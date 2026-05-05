## מטרות
1. למנוע מצבי "מסך תקוע" אחרי deploy (PWA Service Worker).
2. לפשט ולתקן את `build-apk.yml` כדי למנוע קונפליקטים מול GitHub.
3. לפתור את שגיאת ימות "אין לינק" בעת התקשרות.
4. הוספת הוראות לפתרון conflict פתוח ב־GitHub.

---

## 1. הקשחת PWA כדי למנוע מסך תקוע

**הבעיה:** `vite-plugin-pwa` עם `registerType: "autoUpdate"` מגיש לעיתים גרסה ישנה מה־cache עד שהמשתמש עושה refresh כפול.

**פעולות ב־`vite.config.ts`:**
- שינוי `registerType` ל־`"prompt"` עם `skipWaiting: true` ו־`clientsClaim: true` ב־workbox — כך שגרסה חדשה תופעל מיד.
- הוספת `cleanupOutdatedCaches: true`.
- הוספת `navigateFallbackDenylist` עבור `/auth`, `/~oauth`, `/functions` כדי שלא יתפוס fallback של HTML על קריאות ל־Supabase.

**ב־`src/main.tsx` או רכיב חדש:** האזנה לאירוע update של ה־SW והצגת toast עם כפתור "טען מחדש".

---

## 2. תיקון `.github/workflows/build-apk.yml`

**בעיות שנמצאו:**
- שלב **"Capacitor add & sync"** מופיע **פעמיים** (שורות 37-40 ו־77-80) — השני מנסה `cap add android` כשהתיקייה כבר קיימת ⇒ כשלון.
- שלב **"Downgrade Capacitor to v6"** משנה `package.json`/`package-lock.json` בכל ריצה. אם הקובץ נשמר, יוצר קונפליקט מול Lovable.

**פעולות:**
- מחיקת השלבים הכפולים בסוף הקובץ (שורות 71 והלאה — להשאיר רק upload artifact אחד).
- העברת גרסת Capacitor 6 ל־`package.json` עצמו (עדכון `@capacitor/core` ו־`@capacitor/android` ל־`^6.0.0`) ומחיקת השלב "Downgrade Capacitor to v6".
- ודא שה־workflow לא עושה `git commit` בחזרה ל־repo — נכון לעכשיו הוא רק מעלה artifact, אז זה תקין.

---

## 3. תיקון "אין לינק" בימות (השגיאה החשובה)

**שורש הבעיה:** טבלת `yemot_credentials` לא כוללת עמודת `extension`, ולכן:
- אין רשומה איפה ה־`ext.ini` הוגדר בפועל.
- אין דרך לוודא שהמשתמש מתקשר לאותה שלוחה שהוגדרה.
- אין הצגת השלוחה בממשק.

**פעולות:**

**א. מיגרציה במסד נתונים:**
- הוספת עמודה `extension TEXT` ל־`yemot_credentials`.
- הוספת עמודה `last_setup_at TIMESTAMPTZ` ו־`last_setup_path TEXT` כדי לעקוב.

**ב. עדכון `setup-yemot-extension/index.ts`:**
- אחרי `UploadTextFile` מוצלח — לעדכן את הרשומה עם השלוחה ו־`last_setup_at`.
- הוספת **שלב verification**: לקרוא את `ext.ini` בחזרה דרך `DownloadTextFile` של ימות ולוודא שהתוכן זהה ושמכיל `api_link=`. אם לא — להחזיר שגיאה ברורה.
- כתיבה גם ל־root (`ivr2:/ext.ini`) **בנוסף** לשלוחה — מטפל במקרה שהשיחה נכנסת לרמה הראשית.

**ג. עדכון `YemotCredentialsCard.tsx` ו־`E2ETestRunner.tsx`:**
- הצגת השלוחה האחרונה שהוגדרה + תאריך.
- כפתור "אמת שה־`api_link` קיים בימות עכשיו" שמריץ `DownloadTextFile` ומציג את התוכן בפועל.

**ד. הודעת שגיאה ידידותית בעמוד ההגדרה:**
- אם אין `extension` בטבלה: "טרם הוגדרה שלוחה — לחץ 'עדכן api_link אוטומטית'".
- אם הוגדרה לפני יותר מ־24 שעות: warning "כדאי לאמת מחדש".

---

## 4. הוראות לפתרון conflict פתוח ב־GitHub

לא קוד — חלק מהתשובה בצ'אט: לוודא חיבור GitHub פעיל ב־**Connectors → GitHub → Reconnect**, ולא לערוך את אותם קבצים בו־זמנית בשני המקומות.

---

## פרטים טכניים (קצר)

קבצים שייערכו:
- `vite.config.ts` — שינוי תצורת PWA
- `src/main.tsx` — רישום listener ל־SW update + toast
- `.github/workflows/build-apk.yml` — מחיקת כפילות, הסרת downgrade
- `package.json` — קיבוע Capacitor v6
- מיגרציה SQL חדשה — `extension`, `last_setup_at`, `last_setup_path`
- `supabase/functions/setup-yemot-extension/index.ts` — verification + שמירת extension + כתיבה כפולה
- `src/components/yemot/YemotCredentialsCard.tsx` — תצוגת שלוחה + כפתור אימות
- `src/components/yemot/E2ETestRunner.tsx` — שלב verification נוסף

ללא שינוי בסכמת auth, ללא הסרת fields קיימים.
