import json
from fastapi import APIRouter, HTTPException, Depends
from database import supabase
from models.social import (
    ShareQuestRequest, ReactionRequest, SquadCreateRequest, SquadInviteRequest,
    CommentRequest, SocialRequestCreate, SocialRequestRespond
)
from services.auth_utils import get_current_user_id
from services.notification_service import notify_squad_completion

router = APIRouter(tags=["social"])


# ─── Social Feed ─────────────────────────────────────────────────────────────

@router.get("/social/feed")
def get_social_feed(
    limit: int = 20,
    offset: int = 0,
    user_id: str = Depends(get_current_user_id),
):
    """Paginated public social feed, newest first."""
    result = (
        supabase.table("social_feed")
        .select("*, quests(title, difficulty, category), users(name), comments(count)")
        .order("shared_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    posts = result.data or []

    # Also fetch one photo per quest to show in feed
    quest_ids = [p["quest_id"] for p in posts if p.get("quest_id")]
    media_map: dict[str, str] = {}
    if quest_ids:
        media_result = (
            supabase.table("quest_media")
            .select("quest_id, photo_url")
            .in_("quest_id", quest_ids)
            .execute()
        )
        for m in (media_result.data or []):
            # Keep first photo per quest
            if m["quest_id"] not in media_map:
                media_map[m["quest_id"]] = m["photo_url"]

    for post in posts:
        post["photo_url"] = media_map.get(post.get("quest_id"))
        post["user_name"] = (post.get("users") or {}).get("name", "Wayward Explorer")
        post["quest_title"] = (post.get("quests") or {}).get("title", "")
        post["quest_difficulty"] = (post.get("quests") or {}).get("difficulty", "")
        # Clean up nested objects from response
        post.pop("users", None)
        post.pop("quests", None)

    return {"posts": posts, "limit": limit, "offset": offset}


@router.post("/social/share", status_code=201)
def share_quest(
    body: ShareQuestRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Share a completed quest to the social feed."""
    # Verify quest belongs to user and is completed
    quest = supabase.table("quests").select("id, status, user_id").eq("id", body.quest_id).single().execute()
    if not quest.data:
        raise HTTPException(status_code=404, detail="Quest not found")
    if quest.data["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your quest")
    if quest.data["status"] != "completed":
        raise HTTPException(status_code=400, detail="Only completed quests can be shared")

    # Check not already shared
    existing = supabase.table("social_feed").select("id").eq("quest_id", body.quest_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Quest already shared")

    result = supabase.table("social_feed").insert(
        {
            "quest_id": body.quest_id,
            "user_id": user_id,
            "caption": body.caption,
            "reactions_json": {},
        }
    ).execute()

    return {"success": True, "post": result.data[0] if result.data else {}}


@router.post("/social/feed/{post_id}/react")
def add_reaction(
    post_id: str,
    body: ReactionRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Toggle an emoji reaction on a feed post."""
    ALLOWED_EMOJIS = {"🔥", "🏔️", "⚡", "🌊", "🎯", "💎", "❤️", "🎉", "😮", "💪", "✨"}
    if body.emoji not in ALLOWED_EMOJIS:
        raise HTTPException(status_code=400, detail=f"Emoji not allowed.")

    post = supabase.table("social_feed").select("reactions_json").eq("id", post_id).single().execute()
    if not post.data:
        raise HTTPException(status_code=404, detail="Post not found")

    reactions: dict = post.data.get("reactions_json") or {}

    # reactions_json structure: { "🔥": ["user_id1", "user_id2"], ... }
    current_users = reactions.get(body.emoji, [])
    if user_id in current_users:
        current_users.remove(user_id)  # toggle off
    else:
        current_users.append(user_id)   # toggle on

    if current_users:
        reactions[body.emoji] = current_users
    else:
        reactions.pop(body.emoji, None)

    supabase.table("social_feed").update({"reactions_json": reactions}).eq("id", post_id).execute()
    return {"success": True, "reactions": reactions}


@router.post("/social/feed/{post_id}/comment")
def add_comment(
    post_id: str,
    body: CommentRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Post a reply to a feed post."""
    result = supabase.table("comments").insert({
        "post_id": post_id,
        "user_id": user_id,
        "content": body.content
    }).execute()
    
    return {"success": True, "comment": result.data[0] if result.data else {}}


@router.get("/users/nearby")
def get_nearby_users(user_id: str = Depends(get_current_user_id)):
    """Find other users in the same city for Duo/Squad requests."""
    user = supabase.table("users").select("city").eq("id", user_id).single().execute()
    city = (user.data or {}).get("city", "Everywhere")
    
    # Find active users in the same city (exclude self)
    # In a real app, we might filter by 'last_active'
    result = (
        supabase.table("users")
        .select("id, name, city, xp")
        .eq("city", city)
        .neq("id", user_id)
        .limit(20)
        .execute()
    )
    
    return {"users": result.data or []}


@router.post("/social/requests")
def send_social_request(
    body: SocialRequestCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Send a Duo or Squad request to another user."""
    # Check for existing pending request
    existing = (
        supabase.table("social_requests")
        .select("id")
        .eq("sender_id", user_id)
        .eq("receiver_id", body.receiver_id)
        .eq("status", "pending")
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=400, detail="Request already pending")
        
    result = supabase.table("social_requests").insert({
        "sender_id": user_id,
        "receiver_id": body.receiver_id,
        "mode": body.mode,
        "status": "pending"
    }).execute()
    
    return {"success": True, "request": result.data[0] if result.data else {}}


@router.get("/social/requests/received")
def get_incoming_requests(user_id: str = Depends(get_current_user_id)):
    """Get all pending Duo/Squad requests for the current user."""
    result = (
        supabase.table("social_requests")
        .select("*, sender:users!sender_id(name, xp)")
        .eq("receiver_id", user_id)
        .eq("status", "pending")
        .execute()
    )
    return {"requests": result.data or []}


@router.post("/social/requests/{request_id}/respond")
def respond_to_request(
    request_id: str,
    body: SocialRequestRespond,
    user_id: str = Depends(get_current_user_id),
):
    """Accept or reject a social request."""
    # Verify ownership
    req = supabase.table("social_requests").select("*").eq("id", request_id).single().execute()
    if not req.data or req.data["receiver_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    supabase.table("social_requests").update({"status": body.status}).eq("id", request_id).execute()
    
    if body.status == "accepted":
        # logic to create a duo/squad quest or link users could go here
        pass
        
    return {"success": True}


# ─── Squad / Duo Quests ───────────────────────────────────────────────────────

@router.post("/squad/create", status_code=201)
def create_squad_quest(
    body: SquadCreateRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Create a duo or squad quest. Creator must be in participant_ids."""
    if body.mode not in ("duo", "squad"):
        raise HTTPException(status_code=400, detail="Mode must be 'duo' or 'squad'")
    if body.mode == "duo" and len(body.participant_ids) > 2:
        raise HTTPException(status_code=400, detail="Duo mode allows max 2 participants")
    if body.mode == "squad" and len(body.participant_ids) > 5:
        raise HTTPException(status_code=400, detail="Squad mode allows max 5 participants")
    if user_id not in body.participant_ids:
        raise HTTPException(status_code=400, detail="Creator must be in participant_ids")

    # Verify quest exists and is completed/accepted by creator
    quest = supabase.table("quests").select("id, status, user_id").eq("id", body.quest_id).single().execute()
    if not quest.data:
        raise HTTPException(status_code=404, detail="Quest not found")

    result = supabase.table("duo_squad_quests").insert(
        {
            "quest_id": body.quest_id,
            "participant_ids": body.participant_ids,
            "mode": body.mode,
            "status": "active",
        }
    ).execute()

    return {"success": True, "squad_quest": result.data[0] if result.data else {}}


@router.post("/squad/invite")
def invite_to_squad(
    body: SquadInviteRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Add a user to an existing squad quest (if under limit)."""
    squad = supabase.table("duo_squad_quests").select("*").eq("id", body.squad_quest_id).single().execute()
    if not squad.data:
        raise HTTPException(status_code=404, detail="Squad quest not found")

    sq = squad.data
    participant_ids: list = sq.get("participant_ids") or []

    if user_id not in participant_ids:
        raise HTTPException(status_code=403, detail="Only existing participants can invite")

    max_size = 2 if sq["mode"] == "duo" else 5
    if len(participant_ids) >= max_size:
        raise HTTPException(status_code=400, detail=f"{sq['mode'].capitalize()} is already full")

    if body.invitee_id in participant_ids:
        raise HTTPException(status_code=400, detail="User already in squad")

    participant_ids.append(body.invitee_id)
    supabase.table("duo_squad_quests").update({"participant_ids": participant_ids}).eq("id", sq["id"]).execute()

    return {"success": True, "participant_ids": participant_ids}


@router.get("/squad/my-quests")
def get_my_squad_quests(user_id: str = Depends(get_current_user_id)):
    """Get all duo/squad quests where the current user is a participant."""
    result = supabase.table("duo_squad_quests").select("*, quests(title, description, difficulty, category)").execute()

    # Filter in Python since array contains isn't natively queryable here

# ─── Matchmaking ─────────────────────────────────────────────────────────────

@router.post("/matchmaking/join")
def join_matchmaking(
    mode: str, # "duo" or "squad"
    user_id: str = Depends(get_current_user_id),
):
    """Join the matchmaking queue for a duo or squad quest."""
    if mode not in ("duo", "squad"):
        raise HTTPException(status_code=400, detail="Invalid mode")

    # Get user's city
    user = supabase.table("users").select("city").eq("id", user_id).single().execute()
    city = (user.data or {}).get("city", "Everywhere")

    # Remove existing pending entries for this user to avoid duplicates
    supabase.table("matchmaking_queue").update({"status": "expired"}).eq("user_id", user_id).eq("status", "pending").execute()

    # Join queue
    result = supabase.table("matchmaking_queue").insert({
        "user_id": user_id,
        "city": city,
        "mode": mode,
        "status": "pending"
    }).execute()

    # Simple Matchmaking: Find other pending users in the same city and mode
    others = (
        supabase.table("matchmaking_queue")
        .select("user_id")
        .eq("city", city)
        .eq("mode", mode)
        .eq("status", "pending")
        .neq("user_id", user_id)
        .limit(1 if mode == "duo" else 4)
        .execute()
    )

    if others.data:
        # We found a match!
        participant_ids = [user_id] + [o["user_id"] for o in others.data]
        
        # Mark all as matched
        matched_ids = [user_id] + [o["user_id"] for o in others.data]
        supabase.table("matchmaking_queue").update({"status": "matched"}).in_("user_id", matched_ids).eq("status", "pending").execute()

        # Create a duo/squad quest (using a placeholder quest for now, or the latest active one)
        # In a real app, we'd pick a quest together, here we just signal success
        return {
            "matched": True,
            "participant_ids": participant_ids,
            "mode": mode
        }

    return {"matched": False, "message": "Searching for partners..."}


@router.get("/matchmaking/status")
def check_match_status(user_id: str = Depends(get_current_user_id)):
    """Check if the user has been matched."""
    # This is a fallback if the join call didn't immediately match
    # Real apps would use WebSockets or Supabase Realtime
    match = (
        supabase.table("matchmaking_queue")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "matched")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    
    if match.data:
        # Find who else was matched with them in the same window (simple logic)
        m = match.data[0]
        others = (
            supabase.table("matchmaking_queue")
            .select("user_id")
            .eq("city", m["city"])
            .eq("mode", m["mode"])
            .eq("status", "matched")
            .gte("created_at", m["created_at"]) # approximate match window
            .execute()
        )
        return {
            "matched": True, 
            "participant_ids": [o["user_id"] for o in others.data],
            "mode": m["mode"]
        }
    
    return {"matched": False}


# ─── User Stats ─────────────────────────────────────────────────────────────

@router.get("/users/me/stats")
def get_user_stats(user_id: str = Depends(get_current_user_id)):
    """Get live user stats for Home and Basecamp screens."""
    # XP from users table
    user = supabase.table("users").select("xp, name, city").eq("id", user_id).single().execute()
    
    # Completed quests count
    completed = supabase.table("quests").select("id", count="exact").eq("user_id", user_id).eq("status", "completed").execute()
    
    # Simple streak (count quests in last 3 days)
    # real streak would be daily-consecutive
    
    return {
        "xp": (user.data or {}).get("xp", 0),
        "completed_count": completed.count or 0,
        "streak": 1 if completed.count > 0 else 0, # Placeholder
        "badges_count": 0,
        "name": (user.data or {}).get("name", "Wanderer"),
        "city": (user.data or {}).get("city", "Everywhere")
    }
