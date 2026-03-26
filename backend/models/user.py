from pydantic import BaseModel, EmailStr
from typing import Optional, Any
from datetime import datetime


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    city: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    email: str


class OnboardingProfile(BaseModel):
    interests: list[str]
    hobbies: list[str]
    city: str
    available_time_slots: dict[str, list[str]]  # {"weekdays": ["morning"], "weekends": ["afternoon"]}
    energy_level: str  # "low" | "medium" | "high"
    strengths: list[str]


class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    city: Optional[str] = None
    profile_json: Optional[dict[str, Any]] = None
    expo_push_token: Optional[str] = None
    created_at: datetime


class PushTokenUpdate(BaseModel):
    expo_push_token: str
