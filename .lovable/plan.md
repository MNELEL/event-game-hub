## הוספת אודיו של שעון חול במהלך שאלה

### מה ייווסף
צליל לולאתי של שעון חול (טיק-טק עם תחושת חול שאוזל) שמתנגן במסך השאלה מתחילתה ועד סוף הזמן או עד שהשחקנים עונים. הצליל יושמע במסך המארח (שמשמיע לכולם בחדר) וייעצר אוטומטית כשהזמן נגמר או כשעוברים ל‑results/leaderboard.

### קבצים לעריכה

**1. `src/hooks/useSoundEffects.ts`**
- להוסיף שתי פונקציות חדשות ל‑`SoundEffects`:
  - `startHourglass()` — מפעיל לולאה סינתטית באמצעות Web Audio API:
    - "טיק" קצר (square 1200Hz, 30ms) כל ~1 שניה
    - "טק" עמוק (triangle 600Hz, 50ms) חצי שניה אחר כך
    - שכבת רעש לבן עדינה דרך BiquadFilter (bandpass ~3kHz) בעוצמה נמוכה — סימולציית חול שזורם
    - הלולאה מואצת קלות ככל שעובר הזמן (אפשר עם פרמטר `urgencyAt` עתידי, כרגע קצב קבוע)
  - `stopHourglass()` — עוצר את ה‑interval ומסיר את ה‑gain nodes בצורה חלקה (fade out 200ms)
- שמירת state ברמת המודול: `hourglassInterval`, `hourglassGain`, `hourglassNoiseSource`
- יכבדו את `sfxEnabled` ו‑`sfxVolume`

**2. `src/components/game/GameQuestionDisplay.tsx`**
- ב‑`useEffect` של mount: לקרוא ל‑`SoundEffects.startHourglass()` מיד אחרי ה‑`questionReveal()` (delay ~400ms כדי שלא יתנגש)
- ב‑cleanup של ה‑effect: `SoundEffects.stopHourglass()`
- ב‑`useEffect` של `timeRemaining`: כש‑`timeRemaining <= 0` לקרוא ל‑`stopHourglass()` (בנוסף ל‑`timeUp()` הקיים)
- להסיר את הקריאות ל‑`timerTick`/`timerUrgent` הבודדים, כי הלולאה מחליפה אותם — או להשאיר את `timerUrgent` רק ל‑3 שניות אחרונות לדגש

### למה גישה סינתטית ולא קובץ MP3
- אין תלות בהעלאת assets או ב‑bucket
- עובד מיד בכל הסביבות (כולל offline mode הקיים)
- עקבי עם שאר ה‑sound engine של הפרויקט (memory: "Web Audio API for dynamic sound")

### הערה לגבי IVR
זה משפיע רק על מסך המארח בדפדפן. ה‑`hourglass-loop` של Yemot כבר הוגדר בקוד ה‑IVR בהודעה קודמת ופועל בנפרד עבור המתקשרים בטלפון.