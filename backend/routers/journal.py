from fastapi import APIRouter, HTTPException, Depends
from database import supabase
from services.auth_utils import get_current_user_id

router = APIRouter(prefix="/journal", tags=["journal"])


@router.get("/{user_id}")
def get_journal(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id),
):
    """Get completed quests for a user, with media, in descending chronological order."""
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Cannot view another user's journal")

    quests_result = (
        supabase.table("quests")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "completed")
        .order("completed_at", desc=True)
        .execute()
    )

    quests = quests_result.data or []

    # Fetch media for all completed quests in one query
    quest_ids = [q["id"] for q in quests]
    media_by_quest: dict[str, list] = {}

    if quest_ids:
        media_result = (
            supabase.table("quest_media")
            .select("*")
            .in_("quest_id", quest_ids)
            .execute()
        )
        for m in (media_result.data or []):
            media_by_quest.setdefault(m["quest_id"], []).append(m)

    # Attach media to each quest
    for quest in quests:
        quest["media"] = media_by_quest.get(quest["id"], [])

    # Compute streak: consecutive calendar days with completed quests
    streak = _compute_streak(quests)

    return {
        "quests": quests,
        "total_completed": len(quests),
        "streak_days": streak,
    }


def _compute_streak(quests: list[dict]) -> int:
    """Count current consecutive-day streak of quest completions."""
    from datetime import datetime, timezone, timedelta

    if not quests:
        return 0

    completed_dates = set()
    for q in quests:
        if q.get("completed_at"):
            try:
                dt = datetime.fromisoformat(q["completed_at"].replace("Z", "+00:00"))
                completed_dates.add(dt.date())
            except Exception:
                continue

    if not completed_dates:
        return 0

    today = datetime.now(timezone.utc).date()
    streak = 0
    check = today

    # Allow streak if yesterday or today has a completion
    if check not in completed_dates and (check - timedelta(days=1)) not in completed_dates:
        return 0

    while check in completed_dates:
        streak += 1
        check -= timedelta(days=1)

    return streak
