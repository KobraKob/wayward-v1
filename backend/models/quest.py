from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Quest(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    title: str
    description: str
    difficulty: str  # "Micro" | "Standard" | "Epic"
    category: str
    estimated_time: str
    status: str = "generated"
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class QuestGenerateRequest(BaseModel):
    time_available: Optional[str] = None  # override from profile if needed


class QuestCompleteRequest(BaseModel):
    note: Optional[str] = None
    # photo sent as multipart form data separately


class QuestMedia(BaseModel):
    id: Optional[str] = None
    quest_id: str
    photo_url: str
    note: Optional[str] = None
    uploaded_at: Optional[datetime] = None


class BoredQuestResponse(BaseModel):
    quest: Quest
    message: str = "Your instant adventure awaits!"
