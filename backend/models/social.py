from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ShareQuestRequest(BaseModel):
    quest_id: str
    caption: Optional[str] = None


class ReactionRequest(BaseModel):
    emoji: str  # e.g. "🔥", "❤️", "🎉"


class FeedPost(BaseModel):
    id: str
    quest_id: str
    user_id: str
    caption: Optional[str] = None
    reactions_json: dict = {}
    shared_at: datetime
    # Joined fields
    user_name: Optional[str] = None
    quest_title: Optional[str] = None
    quest_difficulty: Optional[str] = None
    photo_url: Optional[str] = None


class SquadCreateRequest(BaseModel):
    quest_id: str
    participant_ids: list[str]
    mode: str  # "duo" | "squad"


class SquadInviteRequest(BaseModel):
    squad_quest_id: str
    invitee_id: str


class CommentRequest(BaseModel):
    content: str


class SocialRequestCreate(BaseModel):
    receiver_id: str
    mode: str  # "duo" | "squad"


class SocialRequestRespond(BaseModel):
    status: str  # "accepted" | "rejected"
