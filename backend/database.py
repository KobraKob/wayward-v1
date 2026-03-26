from supabase import create_client, Client
from config import settings

# Admin client uses service_role key — bypasses RLS, used for backend operations
supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key,
)

# Anon client — used for auth operations
supabase_anon: Client = create_client(
    settings.supabase_url,
    settings.supabase_anon_key,
)
