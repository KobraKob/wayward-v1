from fastapi import APIRouter, HTTPException, status
from database import supabase, supabase_anon
from models.user import SignupRequest, LoginRequest, AuthResponse, PushTokenUpdate
from services.auth_utils import create_access_token, get_current_user_id
from fastapi import Depends
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(body: SignupRequest):
    # Create Supabase auth user
    try:
        auth_resp = supabase_anon.auth.sign_up(
            {"email": body.email, "password": body.password}
        )
    except Exception as exc:
        logger.error(f"Supabase signup error: {exc}")
        detail = str(exc)
        if "rate" in detail.lower() or "too many" in detail.lower():
            raise HTTPException(status_code=429, detail="Too many attempts. Supabase has a signup rate limit. Please wait 60 seconds or try a different email.")
        # Pass through the actual error message from Supabase if possible
        error_msg = detail
        if "{" in detail:
            import json
            try:
                # Some Supabase errors are JSON strings
                parsed = json.loads(detail)
                error_msg = parsed.get("msg", detail)
            except: pass
        raise HTTPException(status_code=400, detail=f"Signup failed: {error_msg}")

    if not auth_resp.user:
        raise HTTPException(status_code=400, detail="Signup failed — email may already be registered.")

    user_id = auth_resp.user.id

    # Insert into public.users (use upsert to handle retries gracefully)
    try:
        supabase.table("users").upsert(
            {
                "id": user_id,
                "name": body.name,
                "email": body.email,
                "city": body.city,
            }
        ).execute()
    except Exception as exc:
        logger.error(f"Profile creation error: {exc}")
        # Don't fail signup if profile insert fails — user can still use the app
        pass

    access_token = create_access_token({"sub": user_id, "email": body.email})
    return AuthResponse(
        access_token=access_token,
        user_id=user_id,
        name=body.name,
        email=body.email,
    )


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest):
    try:
        auth_resp = supabase_anon.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
    except Exception as exc:
        logger.error(f"Supabase login error: {exc}")
        detail = str(exc)
        if "email not confirmed" in detail.lower():
            raise HTTPException(status_code=401, detail="Please confirm your email before logging in.")
        if "invalid" in detail.lower():
            raise HTTPException(status_code=401, detail="Wrong email or password.")
        raise HTTPException(status_code=401, detail="Login failed. Please try again.")

    if not auth_resp.user:
        raise HTTPException(status_code=401, detail="Wrong email or password.")

    user_id = auth_resp.user.id

    # Fetch user profile (safely — don't crash if missing)
    name = ""
    email = body.email
    try:
        profile = supabase.table("users").select("name, email").eq("id", user_id).maybe_single().execute()
        if profile.data:
            name = profile.data.get("name", "")
            email = profile.data.get("email", body.email)
    except Exception as exc:
        logger.error(f"Profile fetch error: {exc}")
        # Fall back gracefully
        pass

    access_token = create_access_token({"sub": user_id, "email": email})
    return AuthResponse(
        access_token=access_token,
        user_id=user_id,
        name=name,
        email=email,
    )


@router.put("/push-token")
def update_push_token(
    body: PushTokenUpdate,
    user_id: str = Depends(get_current_user_id),
):
    supabase.table("users").update(
        {"expo_push_token": body.expo_push_token}
    ).eq("id", user_id).execute()
    return {"success": True}
