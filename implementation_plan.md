# Wayward App — Implementation Plan

Wayward is a personalized adventure app built with React Native (Expo) + FastAPI + Supabase + Groq AI. Users get tailored real-world quests, track completions, and share with a social community.

## Proposed Changes

---

### Phase 1 — Supabase (Database + Auth + Storage)

#### [NEW] Supabase Project: `Wayward`
- Region: `ap-south-1`
- Tables: `users`, `quests`, `quest_media`, `social_feed`, `duo_squad_quests`
- Storage bucket: `quest-photos` (public read, authenticated write)
- Realtime: enabled on `social_feed`
- RLS policies on all tables

---

### Phase 2 — FastAPI Backend

**Root:** `c:\Users\badhu\OneDrive\Desktop\Wayward\backend\`

#### [NEW] Project Structure
```
backend/
├── main.py                  # FastAPI app + CORS
├── config.py                # Settings (env vars)
├── database.py              # Supabase client
├── requirements.txt
├── .env.example
├── routers/
│   ├── auth.py              # /auth/signup, /auth/login
│   ├── onboarding.py        # /onboarding/profile
│   ├── quests.py            # /quests/generate, /{id}/accept, /{id}/complete, /bored
│   ├── journal.py           # /journal/{user_id}
│   └── social.py            # /social/feed, /social/share, /squad/*
├── services/
│   ├── groq_service.py      # Groq API + Llama 3.3 quest generation
│   ├── quest_service.py     # Quest logic, difficulty tiers
│   └── notification_service.py  # Push notification helpers
└── models/
    ├── user.py              # Pydantic schemas
    ├── quest.py
    └── social.py
```

---

### Phase 3 — React Native Frontend (Expo)

**Root:** `c:\Users\badhu\OneDrive\Desktop\Wayward\mobile\`

#### [NEW] Project Structure
```
mobile/
├── app.json
├── App.tsx                  # Root with NavigationContainer
├── src/
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   └── api.ts           # Axios base client
│   ├── contexts/
│   │   └── AuthContext.tsx  # Auth state provider
│   ├── navigation/
│   │   ├── AppNavigator.tsx # Root navigator (auth vs. main)
│   │   └── TabNavigator.tsx # Bottom tabs: Home, Journal, Social, Profile
│   ├── screens/
│   │   ├── onboarding/
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── InterestsScreen.tsx
│   │   │   ├── CityTimeScreen.tsx
│   │   │   ├── EnergyScreen.tsx
│   │   │   └── StrengthsScreen.tsx
│   │   ├── HomeScreen.tsx   # "I'm Bored" + today's quests
│   │   ├── QuestOptionsScreen.tsx  # 3 generated quests
│   │   ├── QuestDetailScreen.tsx   # Active quest view
│   │   ├── CompleteQuestScreen.tsx # Photo + note upload
│   │   ├── JournalScreen.tsx
│   │   ├── SocialScreen.tsx
│   │   ├── ShareQuestScreen.tsx
│   │   ├── DuoSquadScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── components/
│   │   ├── QuestCard.tsx
│   │   ├── JournalEntry.tsx
│   │   ├── FeedPost.tsx
│   │   ├── ReactionBar.tsx
│   │   └── StreakBadge.tsx
│   └── constants/
│       ├── colors.ts        # Design tokens (dark theme, purple/orange)
│       └── typography.ts
```

#### Key Libraries
- `@react-navigation/native` + `@react-navigation/bottom-tabs` + `@react-navigation/stack`
- `@supabase/supabase-js`
- `axios`
- `expo-image-picker`
- `expo-notifications`
- `expo-linear-gradient`
- `react-native-reanimated`
- `@react-native-async-storage/async-storage`

---

## Verification Plan

### Automated Tests (Backend)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# Test with:
pytest tests/ -v
```
- `tests/test_auth.py` — signup/login response validation
- `tests/test_quests.py` — quest generation, accept, complete
- `tests/test_social.py` — feed, share, reactions

### Manual Verification (Mobile)
```bash
cd mobile
npx expo start
```
1. Open Expo Go on Android/iOS → scan QR code
2. Complete onboarding quiz (5 steps)
3. Tap "I'm Bored" → verify instant quest appears
4. Tap "Generate Quests" → verify 3 options return
5. Accept a quest → verify it appears in Journal
6. Complete a quest → upload photo → verify in Journal
7. Share to feed → verify emoji reactions work
8. Check Social screen for real-time updates
