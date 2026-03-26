# Wayward Mobile (React Native)

The frontend for Wayward, built with Expo, TypeScript, and Lucide icons.

## Features
- **Tailored Quests**: AI-generated adventures based on your city and energy.
- **Micro-Quests**: Instant tasks for when you're "Bored".
- **Visual Journaling**: Document your journey with photos and notes.
- **Social Feed**: See what other explorers are doing and react to their adventures.
- **Dark Mode UI**: A sleek, modern interface with purple and orange accents.

## Tech Stack
- **React Native (Expo)**
- **React Navigation** (Stack & Tabs)
- **Supabase JS** (Authentication & Storage)
- **Axios** (API communication)
- **Lucide-React-Native** (Iconography)

## Getting Started

1. **Install Dependencies**:
   ```bash
   cd mobile
   npm install
   ```

2. **Configure Backend URL**:
   Open `src/lib/api.ts` and update `API_URL` to match your local IP if testing on a physical device (e.g., `http://192.168.1.XX:8000`). For Android emulators, `http://10.0.2.2:8000` usually works.

3. **Configure Supabase**:
   Open `src/lib/supabase.ts` and add your `SUPABASE_ANON_KEY`.

4. **Run the App**:
   ```bash
   npx expo start
   ```
   Scan the QR code with the **Expo Go** app on your phone or press `a` for Android / `i` for iOS emulators.

## Project Structure
- `src/components`: Reusable UI elements.
- `src/contexts`: Global state (Auth).
- `src/lib`: API and Service clients (Axios, Supabase).
- `src/navigation`: App and Tab navigators.
- `src/screens`: Individual app screens organized by feature.
- `src/constants`: Theme tokens (Colors, Typography).
