# 🧠 חיוש בת מצוה · Chayoush
# Welcome to your trivia questions and answers project

> משחק טריוויה אינטראקטיבי רב-משתתפים בעברית, בסגנון Kahoot, לאירועים משפחתיים, גיבושים, בת/בר מצווה, כנסים וימי הולדת.
>
> Interactive multi-player Hebrew trivia game (Kahoot-style) for family events, parties and gatherings.

---

## ✨ תכונות עיקריות · Features

- 🎯 **ניהול שאלות מלא** — טקסט, תמונה, אודיו, וידאו · 10 קטגוריות · ייבוא/ייצוא JSON
- 👥 **רב-משתתפים בזמן אמת** — מסך ראשי למנחה + הצטרפות מהטלפון דרך QR או קוד
- ⏱️ **טיימר מסונכרן** — בין המסך הראשי לכל שחקן (1Hz)
- 📊 **אנליטיקה חיה** — התפלגות תשובות, לוח תוצאות, גרפים (Recharts)
- 🏆 **מסך סיום חגיגי** — קונפטי, מוזיקת ניצחון, תארים מיוחדים ("המהיר ביותר", "המדויק ביותר", "האלוף")
- 📱 **PWA + Android** — התקנה כאפליקציה, בנייה ל-APK דרך Capacitor + GitHub Actions
- 🌐 **מצב אופליין מלא** — cache ב-localStorage, סנכרון אוטומטי כשחוזרת רשת
- 🔊 **מנוע קול דינמי** — Web Audio API, BGM מתחלף לפי שלב, SFX לכל פעולה
- 🔐 **אבטחה חזקה** — RLS קפדני, חישוב ציון ב-Edge Function, anti-spoofing עם `secret_token`

---

## 🎨 שפה עיצובית

מוטיב **קלף עתיק (Parchment)** עם מסגרות זהב כפולות, טקסטורת נייר ופינות אקוורל.

- צבעים: זהב חם, קרם, ירוק/אדום לתשובות
- טיפוגרפיה: Fredoka + Rubik + Assistant + Frank Ruhl Libre
- אנימציות: Framer Motion (bounce-in, slide-up, pulse-glow)
- 4 צבעי תשובות בסגנון Kahoot (אדום/כחול/כתום/ירוק)

---

## 🛠️ טכנולוגיות · Tech Stack

| תחום | טכנולוגיה |
|------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Animation | Framer Motion |
| Charts | Recharts |
| Backend | Lovable Cloud (Supabase) — Postgres + RLS + Realtime + Edge Functions |
| Auth | אימייל + Google OAuth |
| Audio | Web Audio API (דינמי, ללא קבצים) |
| Mobile | Capacitor (Android APK) + PWA |
| CI | GitHub Actions (build-apk.yml) |

---

## 📁 מבנה הפרויקט

```
src/
├── pages/
│   ├── Index.tsx          דף בית
│   ├── Admin.tsx          ניהול שאלות, הגדרות, משחקים
│   ├── GameHost.tsx       מסך ראשי למנחה
│   ├── PlayerJoin.tsx     הצטרפות שחקן
│   ├── Login.tsx          התחברות
│   ├── Install.tsx        הוראות התקנה PWA
│   ├── OfflineGame.tsx    משחק אופליין
│   └── About.tsx          אודות
├── components/game/       Lobby, QuestionDisplay, Results, Leaderboard,
│                          Finished, Stats, SoundControl, ActiveGames,
│                          Editor, List, Settings, Tutorial, ImportExport
├── hooks/                 useAuth, useRealtimeGame, usePlayerGame,
│                          useSupabaseQuestions, useSoundEffects, useConfetti
├── utils/                 exportStandaloneHTML
└── integrations/supabase/

supabase/
├── functions/submit-answer/   חישוב ציון server-side
└── migrations/                סכמה, RLS, hardening
```

---

## 🛣️ Routes

| Route | תיאור | הגנה |
|-------|-------|------|
| `/` | דף בית | ציבורי |
| `/about` | אודות האפליקציה | ציבורי |
| `/login` | התחברות | ציבורי |
| `/admin` | ניהול | מוגן (auth) |
| `/host` | מסך מנחה | מוגן (auth) |
| `/play?code=XXX` | הצטרפות שחקן | ציבורי |
| `/join?code=XXX` | redirect ל-`/play` | ציבורי |
| `/install` | התקנת PWA | ציבורי |
| `/offline` | משחק אופליין | ציבורי |

---

## 🔐 Backend & אבטחה

- **טבלאות**: `questions`, `game_settings`, `game_sessions`, `game_players`, `player_answers`, `user_roles`
- **RLS** קפדני בכל טבלה
- **`user_roles` בנפרד** מהפרופיל — מניעת privilege escalation
- **`submit-answer` Edge Function** — חישוב ציון בצד שרת בלבד
- **`secret_token` לכל שחקן** — מניעת זיוף תשובות
- **Leaked Password Protection** מופעל ב-Auth
- **`owner_id`** על כל שאלה והגדרה — בידוד נתונים בין משתמשים

---

## 🚀 הפעלה לפיתוח

```bash
bun install
bun dev
```

האפליקציה תרוץ ב-`http://localhost:8080`.

`.env`, Supabase client ו-types מנוהלים אוטומטית ע"י Lovable Cloud — לא לערוך ידנית.

---

## 📱 בנייה ל-Android

```bash
bun run build
npx cap sync android
npx cap open android
```

או דרך **GitHub Actions** — קובץ `.github/workflows/build-apk.yml` בונה APK אוטומטית בכל push.

---

## 🎮 איך משחקים

1. **המנחה** מתחבר → יוצר משחק → מציג קוד/QR על מסך גדול
2. **השחקנים** סורקים QR (או נכנסים ל-`/play` ומקלידים קוד) → מזינים שם
3. **המנחה** לוחץ "התחל" → השאלות מוצגות עם טיימר מסונכרן
4. **התפלגות תשובות** ולוח תוצאות אחרי כל שאלה
5. **מסך סיום חגיגי** עם תארים: האלוף 🏆 · המהיר ⚡ · המדויק 🎯

---

## 📞 קשר

טלפון: **03-7737970**

---

נבנה עם ❤️ ב-[Lovable](https://lovable.dev)
