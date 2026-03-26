# Wayward Backend

The mission-control API for **Wayward** — the personalized adventure app. Powered by FastAPI and Supabase.

## 🚀 Features
- **Quest Engine**: Dynamic quest generation and progress tracking.
- **Matchmaking**: City-based Duo and Squad discovery and invitations.
- **Social Feed**: Real-time "Bonfire" feed with reactions and threaded replies.
- **Auth**: Secure Supabase authentication integration.

## 🛠️ Stack
- **Framework**: FastAPI (Python 3.11+)
- **Database/Auth**: Supabase
- **Storage**: Supabase Storage (Quest Photos)
- **Web Server**: Uvicorn

## 📦 Setup & Installation

1. **Create Virtual Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: .\venv\Scripts\activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Variables**:
   Create a `.env` file based on `.env.example`:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   ```

4. **Run Server**:
   ```bash
   uvicorn main:app --reload
   ```

## 🛤️ API Structure
- `/auth`: Signup and user authentication logic.
- `/quests`: Quest active lists, generation, and completion.
- `/social`: Matchmaking, feed, reactions, and replies.
- `/users`: Live stats and proximity discovery.

## 🧪 Testing
Run tests using pytest:
```bash
pytest
```

**Go Wayward.**
