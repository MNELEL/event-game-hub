# תיקון זרימת המתקשרים בלובי

## הבעיה

1. בטלפון נשמע "חסר לינק" — סימן שהשלוחה בימות לא מוגדרת נכון (`api_link` ריק/שגוי).
2. גם כש-מתקשר כן נרשם, הלובי לא מתעדכן בזמן אמת — כי הטבלה `phone_players` **לא נמצאת** ב-publication של realtime (בדקתי את כל ה-migrations: רק `games`, `players`, `player_answers` שם).

## שלב 1 — Realtime ל-`phone_players` (הקריטי)

migration:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.phone_players;
ALTER TABLE public.phone_players REPLICA IDENTITY FULL;
```

זה לבד יגרום לכך שברגע שמתקשר נכנס, הוא יופיע מיד ב-`PhonePlayersList` של הלובי בלי רענון.

## שלב 2 — שיפור משק הניהול ב-`