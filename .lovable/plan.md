## סנכרון מלא של שעון החול והמעברים בין שאלות

### 1. שעון החול — סנכרון מדויק (`src/hooks/useSoundEffects.ts`)

החלפת ה‑`startHourglass()` הקיים בגרסה עם סנכרון לזמן השאלה:

- **חתימה חדשה**: `startHourglass(durationSeconds?: number)` — מקבל את משך השאלה.
- **אסימון ייחודי (`hourglassToken`)**: כל קריאה מגדילה token; טיק ישן שכבר מתוזמן ב‑`setTimeout` יבדוק שה‑token עדיין שלו לפני שינגן — מונע חפיפה כששתי שאלות נכנסות מהר.
- **תזמון דינמי ב‑`setTimeout`** (במקום `setInterval` קבוע): מחשב את ה‑delay הבא לפי הזמן שנשאר.
- **האצה ב‑4 שניות אחרונות**: ה‑delay בין טיקים מתקצר באופן ליניארי מ‑500ms עד 120ms — תחושת שעון חול שאוזל.
- **עצירה מובטחת בסוף**: `setTimeout` נוסף ב‑`totalMs + 50` שעוצר את הלולאה גם אם משהו השתבש.
- **`stopHourglass()` חזק יותר**: מגדיל את ה‑token (פוסל טיקים ממתינים), `cancelScheduledValues` על ה‑gain, ו‑fade out 150ms חלק. מנקה גם `setInterval` ישן (תאימות) וגם `setTimeout` חדש.

### 2. סנכרון "שאלה מופיעה לפני שהטיימר מתחיל"

**`src/components/game/GameQuestionDisplay.tsx`**:
- הוספת `prop` חדש `onReady?: () => void` שנקרא אחרי שהשאלה מצוירת במלואה (אחרי 800ms — סיום אנימציית הופעת התשובות `0.6 + 3*0.12 ≈ 1s`).
- מחיקת ההתחלה האוטומטית של `startHourglass()` ב‑mount של הקומפוננטה.
- במקום זה: `useEffect` שמחכה `setTimeout(800ms)` ואז קורא ל‑`startHourglass(question.timeLimit)` + `onReady?.()`.
- cleanup: `stopHourglass()` בכל unmount או החלפת שאלה.

**`src/pages/GameHost.tsx`** (timer effect, שורות 76-80):
- הוספת state `questionReady` שמתאפס בכל שינוי `currentQuestionIndex`.
- ה‑interval של `game.tick()` ירוץ רק כש‑`questionReady === true` **וגם** `status === "question"`.
- מעבירים `onReady={() => setQuestionReady(true)}` ל‑`GameQuestionDisplay`.
- כך הטיימר על המסך לא יתחיל לרדת לפני שהשאלה מצויירת והאודיו התחיל.

### 3. סנכרון מעברים שאלה→תוצאות→שאלה הבאה

**`GameHost.tsx`**:
- ב‑effect של "auto show results" (שורות 83-87): להוסיף `SoundEffects.stopHourglass()` ישירות לפני `game.showResults()` — מבטיח שאין דליפת אודיו אם ה‑unmount מתעכב.
- ב‑`handleNextFromResults` (שורה 95): להגדיל את ה‑delay מ‑100ms ל‑400ms כדי שאנימציית ה‑exit של המסך הקודם תספיק להסתיים לפני שהשאלה הבאה נטענת.
- אותו טיפול ב‑callback של "next" אחרי leaderboard.

### 4. הערות טכניות
- האצת הטיק תואמת את ה‑`timerUrgent` של 3 שניות אחרונות — אבל עכשיו הוא יושמע פחות פעמים כי הלולאה כבר מהירה. אפשר להסיר את `timerUrgent` או להשאיר לדגש דרמטי. **בוחר להשאיר** כי הוא בתדר שונה ויוצר שכבה.
- כל ה‑state של שעון החול ברמת המודול (singleton) — ה‑token מבטיח שאין שני instances מקבילים.
- `timeLimit` לכל שאלה מועבר כפרמטר, כך שאם יש שאלות עם זמנים שונים — הסיום מסונכרן לכל אחת.

### קבצים שיתעדכנו
- `src/hooks/useSoundEffects.ts` — שכתוב `startHourglass`/`stopHourglass`
- `src/components/game/GameQuestionDisplay.tsx` — `onReady` + תזמון תחילת השעון
- `src/pages/GameHost.tsx` — gate על הטיימר עד `questionReady`, stopHourglass לפני results, delay ארוך יותר במעבר לשאלה הבאה