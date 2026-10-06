import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useBranding } from "@/hooks/useBranding";

const BASE = "https://megatrivia.lovable.app";

const META: Record<string, { title: string; description: string; noindex?: boolean }> = {
  "/": { title: "חיוש בת מצוה – טריוויה אינטראקטיבית לאירועים", description: "משחק טריוויה אינטראקטיבי לבת מצווה, אירועים משפחתיים וכנסים. האורחים משחקים מהטלפון ומתחרים בזמן אמת." },
  "/app": { title: "מסך המשחק | חיוש בת מצוה", description: "מסך הפתיחה של חידון חיוש: הצטרפות למשחק, הפעלת משחק כמארח, משחק אופליין והתקנת האפליקציה." },
  "/play": { title: "הצטרפות למשחק | חיוש בת מצוה", description: "מצטרפים לחידון הטריוויה החי מהטלפון: מזינים קוד משחק או סורקים QR, בוחרים שם ומתחילים לשחק." },
  "/about": { title: "אודות | חיוש בת מצוה", description: "מה זה חידון חיוש, איך הוא עובד באירוע ואיך כל האורחים משחקים יחד מהטלפון או בשיחת טלפון." },
  "/install": { title: "התקנת האפליקציה | חיוש בת מצוה", description: "התקינו את חידון חיוש בטלפון או במחשב כדי לפתוח את המשחק במהירות, גם עם חיבור חלש." },
  "/offline": { title: "משחק אופליין | חיוש בת מצוה", description: "משחק טריוויה על מכשיר אחד בלי חיבור לאינטרנט – מתאים לטיולים ולמקומות בלי קליטה." },
  "/events": { title: "לוח משחקים פתוחים | חיוש בת מצוה", description: "משחקי טריוויה פתוחים שמנחים פרסמו: שם המשחק, מספר טלפון וקישור להצטרפות מהירה." },
  "/kahoot-hebrew": { title: "קהוט בעברית – חלופה ישראלית לקהוט | חיוש בת מצוה", description: "מחפשים קהוט בעברית? חידון חיוש הוא חלופה ישראלית: ממשק עברית מלא RTL, מצב אופליין, מיתוג אישי ותמיכה בעברית — לכיתות, אירועים וגיבוש צוות." },
  "/login": { title: "כניסת מארחים | חיוש בת מצוה", description: "כניסה לממשק המארחים של חידון חיוש לניהול שאלות והפעלת משחקים.", noindex: true },
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
