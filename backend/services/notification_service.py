import httpx
from config import settings

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_push_notification(
    expo_push_token: str, title: str, body: str, data: dict = None
) -> bool:
    """Send a push notification via Expo's push service."""
    if not expo_push_token or not expo_push_token.startswith("ExponentPushToken"):
        return False

    message = {
        "to": expo_push_token,
        "sound": "default",
        "title": title,
        "body": body,
        "data": data or {},
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                EXPO_PUSH_URL,
                json=message,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                timeout=10.0,
            )
            resp_data = response.json()
            status_val = resp_data.get("data", {}).get("status")
            return status_val == "ok"
        except Exception:
            return False


async def notify_quest_reminder(expo_push_token: str, quest_title: str) -> bool:
    return await send_push_notification(
        expo_push_token,
        title="⚔️ Adventure Awaits!",
        body=f'Your quest "{quest_title}" is waiting for you. Go Wayward!',
        data={"type": "quest_reminder"},
    )


async def notify_squad_completion(
    expo_push_token: str, completer_name: str, quest_title: str
) -> bool:
    return await send_push_notification(
        expo_push_token,
        title="🎉 Squad Quest Update!",
        body=f"{completer_name} just completed '{quest_title}'. It's your turn!",
        data={"type": "squad_completion"},
    )
