import io
import uuid
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from database import supabase
from models.quest import QuestGenerateRequest, BoredQuestResponse
from services.auth_utils import get_current_user_id
from services import groq_service

router = APIRouter(prefix="/quests", tags=["quests"])

STORAGE_BUCKET = "quest-photos"


def _get_user_profile(user_id: str) -> dict:
    result = supabase.table("users").select("profile_json, city").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User profile not found. Complete onboarding first.")
    profile = result.data.get("profile_json") or {}
    if not profile.get("city"):
        profile["city"] = result.data.get("city", "your city")
    return profile


@router.get("/generate")
def generate_quests(
    time_available: str = None,
    user_id: str = Depends(get_current_user_id),
):
    """Generate 3 tailored quest options using Groq + Llama 3.3."""
    profile = _get_user_profile(user_id)

    try:
        quests_data = groq_service.generate_quests(profile, time_available)
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=f"Quest generation failed: {str(exc)}")
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Groq API error: {str(exc)}")

    # Persist generated quests in DB with status="generated"
    inserted_quests = []
    for q in quests_data:
        record = {
            "user_id": user_id,
            "title": q["title"],
            "description": q["description"],
            "difficulty": q["difficulty"],
            "category": q["category"],
            "estimated_time": q["estimated_time"],
            "status": "generated",
        }
        result = supabase.table("quests").insert(record).execute()
        if result.data:
            inserted_quests.append(result.data[0])

    return {"quests": inserted_quests}


@router.post("/bored", response_model=BoredQuestResponse)
def bored_quest(user_id: str = Depends(get_current_user_id)):
    """Instant single quest — no choices, no friction."""
    profile = _get_user_profile(user_id)

    try:
        quest_data = groq_service.generate_bored_quest(profile)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Groq API error: {str(exc)}")

    record = {
        "user_id": user_id,
        "title": quest_data["title"],
        "description": quest_data["description"],
        "difficulty": quest_data.get("difficulty", "Micro"),
        "category": quest_data.get("category", "Explore"),
        "estimated_time": quest_data.get("estimated_time", "30 min"),
        "status": "accepted",  # Auto-accept for bored mode
    }
    result = supabase.table("quests").insert(record).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save quest")

    return BoredQuestResponse(quest=result.data[0])


@router.post("/{quest_id}/accept")
def accept_quest(quest_id: str, user_id: str = Depends(get_current_user_id)):
    """Accept a generated quest — changes status to 'accepted'."""
    # Verify ownership
    existing = supabase.table("quests").select("id, status, user_id").eq("id", quest_id).single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Quest not found")
    if existing.data["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your quest")
    if existing.data["status"] not in ("generated",):
        raise HTTPException(status_code=400, detail=f"Quest already {existing.data['status']}")

    result = supabase.table("quests").update({"status": "accepted"}).eq("id", quest_id).execute()
    return {"success": True, "quest": result.data[0] if result.data else {}}


@router.post("/{quest_id}/complete")
async def complete_quest(
    quest_id: str,
    note: str = Form(None),
    photo: UploadFile = File(None),
    share_to_bonfire: bool = Form(False),
    user_id: str = Depends(get_current_user_id),
):
    """Mark quest complete, upload optional photo, increment XP, and share to Bonfire."""
    # 1. Verify ownership and state
    existing = supabase.table("quests").select("id, title, status, user_id").eq("id", quest_id).single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Quest not found")
    if existing.data["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your quest")
    if existing.data["status"] == "completed":
        raise HTTPException(status_code=400, detail="Quest already completed")
    if existing.data["status"] != "accepted":
        raise HTTPException(status_code=400, detail="Quest must be accepted before completing")

    # 2. Update status to completed immediately
    from datetime import datetime, timezone
    supabase.table("quests").update(
        {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", quest_id).execute()

    # 3. Increment User XP (+50 XP per quest)
    user_data = supabase.table("users").select("xp").eq("id", user_id).single().execute()
    current_xp = (user_data.data or {}).get("xp", 0)
    supabase.table("users").update({"xp": current_xp + 50}).eq("id", user_id).execute()

    # 4. Handle Photo Upload (if provided)
    photo_url = None
    if photo and photo.filename:
        try:
            file_bytes = await photo.read()
            file_ext = photo.filename.rsplit(".", 1)[-1] if "." in photo.filename else "jpg"
            import uuid
            storage_path = f"{user_id}/{quest_id}/{uuid.uuid4()}.{file_ext}"
            
            supabase.storage.from_(STORAGE_BUCKET).upload(
                path=storage_path,
                file=file_bytes,
                file_options={"content-type": photo.content_type or "image/jpeg"},
            )
            photo_url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(storage_path)
            
            # Save media record
            supabase.table("quest_media").insert(
                {"quest_id": quest_id, "photo_url": photo_url, "note": note}
            ).execute()
        except Exception as exc:
            print(f"Photo upload failed: {str(exc)}")
            # Don't fail the whole quest if photo fails

    # 5. Handle Social Sharing (if requested)
    if share_to_bonfire:
        try:
            supabase.table("social_feed").insert({
                "quest_id": quest_id,
                "user_id": user_id,
                "caption": note or f"Just completed {existing.data.get('title', 'a quest')}!",
                "reactions_json": {}
            }).execute()
        except Exception as e:
            print(f"Social sharing failed: {str(e)}")

    return {
        "success": True, 
        "message": "Quest completed!", 
        "xp_gained": 50,
        "photo_url": photo_url
    }

    return {
        "success": True,
        "photo_url": photo_url,
        "message": "Quest completed! You went Wayward. 🎉",
    }


@router.get("/active")
def get_active_quests(user_id: str = Depends(get_current_user_id)):
    """Get quests with status 'accepted' for the current user."""
    result = supabase.table("quests").select("*").eq("user_id", user_id).eq("status", "accepted").order("created_at", desc=True).execute()
    return {"quests": result.data or []}
