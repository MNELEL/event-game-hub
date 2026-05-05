## ניהול אוטומטי מלא של אסימוני ימות מתוך המשחק

### המטרה
לאפשר ליצור, לבדוק, ולעדכן את אסימוני ההתחברות של ימות (`YEMOT_API_TOKEN` ו-`YEMOT_WEBHOOK_SECRET`) ישירות מתוך עמוד `/yemot-setup`, בלי לגשת אל Supabase או אל פאנל ימות ידנית.

### ארכיטקטורה
מכיוון ש-Edge Functions לא יכולות לכתוב משתני סביבה (secrets) בעצמן, נשמור את האסימונים בטבלה ייעודית בבסיס הנתונים, ונקרא אותם משם בכל ה-Edge Functions במקום מ-`Deno.env`.

### שינויים נדרשים

**1. מיגרציה — טבלת `yemot_credentials`**
```sql
create table public.yemot_credentials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  yemot_username text,           -- מספר מערכת בימות (לאימות + תצוגה)
  yemot_api_token text not null, -- אסימון ה-API שהמשתמש מקבל מימות
  webhook_secret text not null default encode(gen_random_bytes(24), 'hex'),
  last_verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.yemot_credentials enable row level security;
create policy "owner reads own creds" on public.yemot_credentials for select to authenticated using (owner_id = auth.uid());
create policy "owner upserts own creds" on public.yemot_credentials for insert to authenticated with check (owner_id = auth.uid());
create policy "owner updates own creds" on public.yemot_credentials for update to authenticated using (owner_id = auth.uid());
```

**2. Edge Function חדשה — `yemot-credentials`**
פעולות `action`:
- `get` — מחזירה למשתמש המחובר את ה-username, מסכת ה-API token (`••••1234`), ואת `webhook_secret` (כדי להציג ב-UI לפי הצורך).
- `save` — שומרת/מעדכנת `yemot_username` + `yemot_api_token`. לפני שמירה — מאמתת מול ימות (`POST /ym/api/GetSession` או `Login`) שהאסימון תקין.
- `rotate_secret` — מייצרת `webhook_secret` חדש, שומרת אותו, ומחזירה הוראה להריץ `setup-yemot-extension` כדי לדרוס את `ext.ini`.
- `verify` — קוראת ל-`GetSession` של ימות לבדוק שהאסימון עדיין חי, ומעדכנת `last_verified_at`.

**3. עדכון פונקציות קיימות**
`setup-yemot-extension` ו-`check-yemot-extension` ישלפו את `yemot_api_token` ו-`webhook_secret` מתוך הטבלה (לפי המשתמש המחובר) במקום מ-`Deno.env`. אם לא קיימים — תוחזר שגיאה ידידותית עם הוראה ללחוץ "הזן אסימון ימות".

**4. עדכון `yemot-ivr` (ה-webhook עצמו)**
היום הוא משווה את ה-`secret` שנשלח מימות מול `YEMOT_WEBHOOK_SECRET` ב-env. נעדכן אותו לחפש בטבלה האם קיים `webhook_secret` תואם (תמיכה במספר משתמשים בעתיד; היום משתמש יחיד).

**5. UI ב-`/yemot-setup`** — קלפ חדש בראש העמוד **"חיבור לחשבון ימות שלי"**:
- שדה **מספר מערכת** (`yemot_username`) + שדה **אסימון API** + כפתור **שמור ואמת**.
- אינדיקטור סטטוס: ✅ מאומת / ❌ לא תקין / ⚠ לא הוגדר.
- כפתור **בדוק חיבור** (קורא ל-`verify`).
- כפתור **צור webhook secret חדש** (קורא ל-`rotate_secret` ואז ל-`setup-yemot-extension` אוטומטית).
- קישור הסבר קצר: "איפה משיגים אסימון API? פאנל ימות → ניהול מערכת → API → צור אסימון חדש".

**6. תאימות לאחור**
אם `YEMOT_API_TOKEN`/`YEMOT_WEBHOOK_SECRET` עדיין קיימים ב-env והטבלה ריקה — נשתמש בערכים מה-env כברירת מחדל (כדי שהמערכת הקיימת לא תישבר).

### תוצאה למשתמש
מהעמוד `/yemot-setup` אפשר: להזין אסימון ימות חדש, לאמת אותו מול ימות, לסובב את ה-webhook secret, להריץ את ה-`setup-yemot-extension` ואת `check` — הכל בלי לפתוח את Supabase או את פאנל ימות.