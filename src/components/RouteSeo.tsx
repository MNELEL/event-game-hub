import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useBranding } from "@/hooks/useBranding";

const BASE = "https://megatrivia.lovable.app";

const META: Record<string, { title: string; description: string; noindex?: boolean }> = {
  "/": { title: "מגה טריוויה – טריוויה אינטראקטיבית לאירועים", description: "משחק טריוויה אינטראקטיבי לבת מצווה, אירועים משפחתיים וכנסים. האורחים משחקים מהטלפון ומתחרים בזמן אמת." },
  "/app": { title: "מסך המשחק | מגה טריוויה", description: "מסך הפתיחה של מגה טריוויה: הצטרפות למשחק, הפעלת משחק כמארח, משחק אופליין והתקנת האפליקציה." },
  "/play": { title: "הצטרפות למשחק | מגה טריוויה", description: "מצטרפים לחידון הטריוויה החי מהטלפון: מזינים קוד משחק או סורקים QR, בוחרים שם ומתחילים לשחק." },
  "/about": { title: "אודות | מגה טריוויה", description: "מה זה מגה טריוויה, איך הוא עובד באירוע ואיך כל האורחים משחקים יחד מהטלפון או בשיחת טלפון." },
  "/install": { title: "התקנת האפליקציה | מגה טריוויה", description: "התקינו את מגה טריוויה בטלפון או במחשב כדי לפתוח את המשחק במהירות, גם עם חיבור חלש." },
  "/offline": { title: "משחק אופליין | מגה טריוויה", description: "משחק טריוויה על מכשיר אחד בלי חיבור לאינטרנט – מתאים לטיולים ולמקומות בלי קליטה." },
  "/siyum": { title: "חידון סיום למסיבות סיום | מגה טריוויה", description: "חידון טריוויה לסיום מסכת, סיום שנת לימודים וסיום בתלמוד תורה, עם שאלות וניקוד מותאמים לסוג האירוע." },
  "/events": { title: "לוח משחקים פתוחים | מגה טריוויה", description: "משחקי טריוויה פתוחים שמנחים פרסמו: שם המשחק, מספר טלפון וקישור להצטרפות מהירה." },
  "/kahoot-hebrew": { title: "קהוט בעברית – חלופה ישראלית לקהוט | מגה טריוויה", description: "מחפשים קהוט בעברית? מגה טריוויה הוא חלופה ישראלית: ממשק עברית מלא RTL, מצב אופליין, מיתוג אישי ותמיכה בעברית — לכיתות, אירועים וגיבוש צוות." },
  "/trivia-quiz": { title: "חידון טריוויה בעברית – שאלות לדוגמה | מגה טריוויה", description: "חידון טריוויה לדוגמה בעברית: שאלות ביהדות ובידע כללי עם ניקוד מיידי, בחינם ובלי הרשמה. רוצים חידון כזה באירוע? נסו דמו חי." },
  "/login": { title: "כניסת מארחים | מגה טריוויה", description: "כניסה לממשק המארחים של מגה טריוויה לניהול שאלות והפעלת משחקים.", noindex: true },
};

export function RouteSeo() {
  const { pathname } = useLocation();
  const { branding } = useBranding();
  const base = META[pathname] ?? { ...META["/"], noindex: true };
  const seoTitle = branding.seoTitle?.trim();
  const seoDesc = branding.seoDescription?.trim();
  const isHome = pathname === "/" || !META[pathname];
  const prefix = base.title.split(" | ")[0];
  const m = {
    ...base,
    title: seoTitle ? (isHome || !base.title.includes(" | ") ? seoTitle : `${prefix} | ${seoTitle}`) : base.title,
    description: seoDesc && isHome ? seoDesc : base.description,
  };
  const url = `${BASE}${pathname}`;
  return (
    <Helmet>
      <title>{m.title}</title>
      <meta name="description" content={m.description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={m.title} />
      <meta property="og:description" content={m.description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={m.title} />
      <meta name="twitter:description" content={m.description} />
      {m.noindex && <meta name="robots" content="noindex" />}
    </Helmet>
  );
}
