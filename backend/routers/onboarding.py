from fastapi import APIRouter, HTTPException, Depends
from database import supabase
from models.user import OnboardingProfile, UserProfile
from services.auth_utils import get_current_user_id

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.post("/profile")
def save_onboarding_profile(
    body: OnboardingProfile,
    user_id: str = Depends(get_current_user_id),
):
    """Save onboarding quiz answers as profile_json and update city."""
    profile_data = body.model_dump()

    try:
        supabase.table("users").update(
            {
                "city": body.city,
                "profile_json": profile_data,
            }
        ).eq("id", user_id).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save profile: {str(exc)}")

    return {"success": True, "message": "Profile saved! Your adventure begins now."}


@router.get("/profile", response_model=UserProfile)
def get_profile(user_id: str = Depends(get_current_user_id)):
    """Retrieve the current user's full profile."""
    result = supabase.table("users").select("*").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User profile not found")
    return result.data
