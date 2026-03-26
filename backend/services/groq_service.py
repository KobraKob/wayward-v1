import json
import re
from datetime import datetime
from groq import Groq
from config import settings

groq_client = Groq(api_key=settings.groq_api_key)

DIFFICULTY_CONFIG = {
    "Micro": {"time_range": "15–30 min", "cost": "zero cost"},
    "Standard": {"time_range": "2–4 hours", "cost": "low cost"},
    "Epic": {"time_range": "full day", "cost": "may involve spending money"},
}

SYSTEM_PROMPT = """You are a quest generator for Wayward, an adventure app. Given a user profile, generate exactly 3 unique, fun, real-world quests tailored to the user. Each quest must be genuinely doable in the user's city and aligned with their interests and energy level.

Return ONLY a valid JSON array with exactly 3 objects. No markdown, no preamble, no explanation. Each object must have these exact fields:
- title: string (catchy, under 60 chars)
- description: string (exciting description, 2-3 sentences, includes actionable steps)
- difficulty: string (exactly one of: "Micro", "Standard", "Epic")
- estimated_time: string (e.g. "25 min", "3 hours", "Full day")
- category: string (e.g. "Explore", "Social", "Creative", "Fitness", "Food", "Nature", "Culture")"""


def _get_time_context() -> str:
    hour = datetime.now().hour
    if 5 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    else:
        return "night"


def _parse_groq_response(content: str) -> list[dict]:
    """Robustly parse JSON from Groq response, stripping markdown fences if present."""
    content = content.strip()
    # Strip markdown code fences if present
    content = re.sub(r"^```(?:json)?\s*", "", content)
    content = re.sub(r"\s*```$", "", content)
    parsed = json.loads(content)
    if not isinstance(parsed, list):
        raise ValueError("Expected a JSON array from Groq")
    return parsed


def generate_quests(profile: dict, time_available: str = None) -> list[dict]:
    """Call Groq API with user profile and return 3 quest dicts."""
    interests = ", ".join(profile.get("interests", []))
    hobbies = ", ".join(profile.get("hobbies", []))
    energy = profile.get("energy_level", "medium")
    city = profile.get("city", "your city")
    strengths = ", ".join(profile.get("strengths", []))
    
    if not time_available:
        time_context = _get_time_context()
        slots = profile.get("available_time_slots", {})
        weekday_slots = slots.get("weekdays", [])
        time_available = f"{time_context} session" if weekday_slots else "a few hours"

    user_prompt = (
        f"Profile: interests={interests}, hobbies={hobbies}, strengths={strengths}. "
        f"City: {city}. Energy level: {energy}. "
        f"Available time: {time_available}. "
        f"Generate 3 quests — one Micro (15-30min), one Standard (2-4hr), one Epic (full day). "
        f"Make them creative, specific to {city}, and exciting for someone with this profile."
    )

    completion = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.9,
        max_tokens=1500,
    )

    raw = completion.choices[0].message.content
    quests = _parse_groq_response(raw)

    # Enforce difficulty order and validate fields
    required_fields = {"title", "description", "difficulty", "estimated_time", "category"}
    for quest in quests:
        missing = required_fields - set(quest.keys())
        if missing:
            raise ValueError(f"Quest missing fields: {missing}")
        if quest["difficulty"] not in DIFFICULTY_CONFIG:
            quest["difficulty"] = "Standard"

    return quests


def generate_bored_quest(profile: dict) -> dict:
    """Generate a single instant quest based on time of day."""
    time_context = _get_time_context()
    interests = ", ".join(profile.get("interests", []))
    energy = profile.get("energy_level", "medium")
    city = profile.get("city", "your city")

    user_prompt = (
        f"It's {time_context}. User profile: interests={interests}, city={city}, energy={energy}. "
        f"Generate exactly 1 Micro quest (15-30 min, zero cost, starts immediately). "
        f"Return a JSON array with exactly 1 quest object."
    )

    completion = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=1.0,
        max_tokens=500,
    )

    raw = completion.choices[0].message.content
    quests = _parse_groq_response(raw)
    quest = quests[0]
    quest["difficulty"] = "Micro"
    return quest
