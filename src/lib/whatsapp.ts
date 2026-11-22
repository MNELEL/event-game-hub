export const LIVE_URL = "https://megatrivia.lovable.app";
export const BUSINESS_WHATSAPP = "972772267604";

export const liveJoinLink = (code: string) => `${LIVE_URL}/play?code=${encodeURIComponent(code)}`;

export const whatsappShareUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;

export const whatsappChatUrl = (text: string) =>
  `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(text)}`;

export const gameInviteText = (code: string) =>
  `הוזמנתם למשחק טריוויה! 🎉\nקוד המשחק: ${code}\nהצטרפו כאן: ${liveJoinLink(code)}`;
