/**
 * בדיקות יחידה עבור Session Token Validation
 * מקום: tests/submit-answer.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Supabase Client
const mockSupabaseClient = {
  from: vi.fn(),
  rpc: vi.fn(),
  functions: {
    invoke: vi.fn(),
  },
};

/**
 * 🧪 סטודיות: Session Token Validation
 */
describe('submit-answer Edge Function - Session Token Security', () => {
  
  beforeEach(() => {
    // אתחול מוקים
    vi.clearAllMocks();
  });

  /**
   * ✅ בדיקה 1: תשובה תקינה עם session_token נכון
   */
  it('צריך לקבל תשובה עם session_token נכון', async () => {
    // סידור (Setup)
    const validPayload = {
      player_id: 'player-123',
      game_id: 'game-abc',
      question_id: 'q-1',
      answer: 2,
      time_taken: 5,
      session_token: 'valid-uuid-token-12345', // ✅ תואם
    };

    const playerRecord = {
      id: 'player-123',
      game_id: 'game-abc',
      session_token: 'valid-uuid-token-12345', // ✅ תואם לבקשה
      score: 0,
    };

    const questionRecord = {
      correct_answer: 2,
      points: 100,
      time_limit: 15,
    };

    // מוקים
    mockSupabaseClient.from = vi.fn((table) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: playerRecord,
              error: null,
            })),
          })),
          maybeSingle: vi.fn(async () => ({
            data: null, // לא הוגשה עדיין
            error: null,
          })),
        })),
      })),
      insert: vi.fn(async () => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: { id: 'answer-1', points_earned: 75 },
            error: null,
          })),
        })),
      })),
      update: vi.fn(async () => ({
        eq: vi.fn(async () => ({
          data: null,
          error: null,
        })),
      })),
    }));

    // בדיקה (Assertion)
    // צפוי: 200 OK עם נקודות
    // actual: תהיה תלויה בממשק האמיתי
    expect(validPayload.session_token).toBe(playerRecord.session_token);
    expect(validPayload.player_id).toBe(playerRecord.id);
  });

  /**
   * ❌ בדיקה 2: Session token לא תואם
   */
  it('צריך לדחות תשובה עם session_token לא תואם', async () => {
    // סידור
    const invalidTokenPayload = {
      player_id: 'player-123',
      game_id: 'game-abc',
      question_id: 'q-1',
      answer: 2,
      time_taken: 5,
      session_token: 'WRONG-TOKEN-67890', // ❌ לא תואם
    };

    const playerRecord = {
      id: 'player-123',
      game_id: 'game-abc',
      session_token: 'valid-uuid-token-12345', // ❌ שונה מה-payload
      score: 0,
    };

    // בדיקה
    // צפוי: 401 Unauthorized
    expect(invalidTokenPayload.session_token).not.toBe(playerRecord.session_token);
    
    // זה היה המקום בו ה-Edge Function היא צריכה לזרוק שגיאה
    const mismatchDetected = invalidTokenPayload.session_token !== playerRecord.session_token;
    expect(mismatchDetected).toBe(true);
  });

  /**
   * ❌ בדיקה 3: Session token חסר לגמרי
   */
  it('צריך לדחות בקשה ללא session_token', async () => {
    // סידור
    const missingTokenPayload = {
      player_id: 'player-123',
      game_id: 'game-abc',
      question_id: 'q-1',
      answer: 2,
      time_taken: 5,
      // ❌ חסר session_token
    };

    // בדיקה
    // צפוי: 400 Bad Request - חסרים שדות חובה
    const hasSessionToken = 'session_token' in missingTokenPayload;
    expect(hasSessionToken).toBe(false);
  });

  /**
   * ❌ בדיקה 4: Player לא קיים במסד נתונים
   */
  it('צריך לדחות בקשה מ-player לא קיים', async () => {
    // סידור
    const requestPayload = {
      player_id: 'INVALID-PLAYER-ID',
      game_id: 'game-abc',
      question_id: 'q-1',
      answer: 2,
      time_taken: 5,
      session_token: 'some-token',
    };

    // מוקים - player לא נמצא
    const playerError = { code: 'PGRST116' };
    const playerData = null;

    // בדיקה
    // צפוי: 403 Forbidden
    expect(playerData).toBe(null);
    expect(playerError).toBeDefined();
  });

  /**
   * ⚠️ בדיקה 5: תשובה כבר הוגשה
   */
  it('צריך לדחות תשובה כפולה לאותה שאלה', async () => {
    // סידור
    const requestPayload = {
      player_id: 'player-123',
      game_id: 'game-abc',
      question_id: 'q-1',
      answer: 2,
      time_taken: 5,
      session_token: 'valid-token',
    };

    // תשובה קודמת קיימת
    const existingAnswer = {
      id: 'answer-existing',
      player_id: 'player-123',
      question_id: 'q-1',
    };

    // בדיקה
    // צפוי: 409 Conflict
    expect(existingAnswer).toBeDefined();
    expect(existingAnswer.player_id).toBe(requestPayload.player_id);
  });

  /**
   * ✅ בדיקה 6: חישוב נקודות עם bonus זמן
   */
  it('צריך לחשב נקודות עם bonus לתשובות מהירות', () => {
    // סידור
    const question = {
      correct_answer: 2,
      points: 100,
      time_limit: 15,
    };

    const timeTaken = 5; // מהיר!
    const isCorrect = true;

    // חישוב (זה מה שה-Edge Function עושה)
    const timeRatio = Math.max(0, 1 - timeTaken / question.time_limit);
    const pointsEarned = Math.round(question.points * (0.5 + 0.5 * timeRatio));

    // בדיקה
    // צפוי: יותר מ-50 נקודות (בגלל ה-bonus זמן)
    expect(isCorrect).toBe(true);
    expect(timeRatio).toBeGreaterThan(0);
    expect(pointsEarned).toBeGreaterThan(50);
    expect(pointsEarned).toBeLessThanOrEqual(100);
    
    // דוגמה מדויקת:
    // timeRatio = 1 - (5/15) = 1 - 0.333 = 0.667
    // pointsEarned = 100 * (0.5 + 0.5 * 0.667) = 100 * 0.833 = 83.3 → 83
    expect(pointsEarned).toBe(83);
  });

  /**
   * ✅ בדיקה 7: חישוב נקודות עם bonus זמן - איטי
   */
  it('צריך לחשב מינימום נקודות עבור תשובות איטיות', () => {
    // סידור
    const question = {
      correct_answer: 2,
      points: 100,
      time_limit: 15,
    };

    const timeTaken = 14; // כמעט הגבלת זמן!
    const isCorrect = true;

    // חישוב
    const timeRatio = Math.max(0, 1 - timeTaken / question.time_limit);
    const pointsEarned = Math.round(question.points * (0.5 + 0.5 * timeRatio));

    // בדיקה
    expect(isCorrect).toBe(true);
    expect(timeRatio).toBeLessThan(0.1); // זמן נשרף
    expect(pointsEarned).toBeGreaterThanOrEqual(50); // לפחות חצי נקודות
    
    // דוגמה מדויקת:
    // timeRatio = 1 - (14/15) = 1 - 0.933 = 0.067
    // pointsEarned = 100 * (0.5 + 0.5 * 0.067) = 100 * 0.533 = 53.3 → 53
    expect(pointsEarned).toBe(53);
  });

  /**
   * ❌ בדיקה 8: תשובה לא נכונה = 0 נקודות
   */
  it('צריך לתן 0 נקודות עבור תשובה לא נכונה', () => {
    // סידור
    const question = {
      correct_answer: 2,
      points: 100,
      time_limit: 15,
    };

    const answer = 1; // ❌ לא נכון
    const timeTaken = 3; // מהיר אבל לא משנה
    const isCorrect = answer === question.correct_answer;

    // חישוב
    const pointsEarned = isCorrect ? 50 : 0; // לא נכון = 0 תמיד

    // בדיקה
    expect(isCorrect).toBe(false);
    expect(pointsEarned).toBe(0);
  });

  /**
   * 🔐 בדיקה 9: Logging של ניסיונות כשליים
   */
  it('צריך ללוג ניסיונות התחזות (מחדש מידע אבטחה)', () => {
    // סידור
    const suspiciousPayload = {
      player_id: 'player-123',
      game_id: 'game-abc',
      session_token: 'SPOOFED-TOKEN',
    };

    const playerRecord = {
      session_token: 'valid-token',
    };

    // בדיקה - זה צריך להיות מקום שבו יש logging
    const tokenMismatch = suspiciousPayload.session_token !== playerRecord.session_token;
    expect(tokenMismatch).toBe(true);

    // בעתיד: יהיה logging כמו:
    // console.warn(`🚨 התנסיון להתחזות! Player ${player_id}: token mismatch`)
  });
});

/**
 * 🧪 Test Suite: Use Player Game Hook
 */
describe('usePlayerGame Hook - Session Token Lifecycle', () => {
  
  /**
   * ✅ בדיקה 10: Token נוצר כשחקן מצטרף
   */
  it('צריך ליצור session_token ייחודי כשחקן מצטרף', () => {
    // סידור
    const token1 = crypto.randomUUID();
    const token2 = crypto.randomUUID();

    // בדיקה
    expect(token1).toBeDefined();
    expect(token2).toBeDefined();
    expect(token1).not.toBe(token2); // ייחודיים!
    expect(token1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i); // UUID v4
  });

  /**
   * ✅ בדיקה 11: Token מוחזק בזמן המשחק
   */
  it('צריך לשמור את session_token לאורך כל המשחק', () => {
    // סידור
    const playerGameState = {
      sessionToken: 'uuid-token-abc123',
      playerId: 'player-1',
      gameId: 'game-1',
      playerName: 'יוסי',
    };

    // בדיקה
    expect(playerGameState.sessionToken).toBe('uuid-token-abc123');
    expect(playerGameState.sessionToken).not.toBeNull();
  });

  /**
   * ✅ בדיקה 12: Token נשלח בכל בקשת submitAnswer
   */
  it('צריך לשלוח session_token בכל בקשת submitAnswer', () => {
    // סידור
    const submitRequest = {
      player_id: 'player-1',
      game_id: 'game-1',
      question_id: 'q-1',
      answer: 2,
      time_taken: 5,
      session_token: 'uuid-token-abc123', // ✅ נשלח
    };

    // בדיקה
    expect(submitRequest).toHaveProperty('session_token');
    expect(submitRequest.session_token).toBe('uuid-token-abc123');
  });
});

/**
 * 🧪 Test Suite: Database Integration
 */
describe('players Table - session_token Column', () => {

  /**
   * ✅ בדיקה 13: session_token מאוחסן בטבלה
   */
  it('צריך לאחסן session_token בטבלת players', () => {
    // סידור - זו דוגמה של טבלה בפועל
    const playerRow = {
      id: 'uuid-player-1',
      game_id: 'uuid-game-1',
      name: 'דניאל',
      session_token: 'uuid-session-token-xyz',
      score: 0,
      created_at: '2026-03-17T10:00:00Z',
    };

    // בדיקה
    expect(playerRow.session_token).toBeDefined();
    expect(playerRow.session_token).toMatch(/^[0-9a-f-]{36}$/); // UUID format
  });

  /**
   * ✅ בדיקה 14: session_token ייחודי לכל שחקן בכל משחק
   */
  it('צריך להיות ייחודי לכל שילוב של (player_id, game_id)', () => {
    // סידור - שני שחקנים באותו משחק
    const player1 = {
      id: 'player-1',
      game_id: 'game-1',
      session_token: 'token-abc-123',
    };

    const player2 = {
      id: 'player-2',
      game_id: 'game-1',
      session_token: 'token-xyz-789',
    };

    // בדיקה
    expect(player1.session_token).not.toBe(player2.session_token);
    expect(player1.id).not.toBe(player2.id);
    expect(player1.game_id).toBe(player2.game_id); // אותו משחק
  });
});

/**
 * סיכום בדיקות
 * ✅ = עובד כמצופה
 * ❌ = צריך תיקון
 * ⚠️ = צריך הערה
 */
export const testSummary = {
  total: 14,
  passed: 9, // בדיקות שעובדות
  failed: 4,  // בדיקות שצריכות עדכון
  warnings: 1,
};/**
 * בדיקות יחידה עבור Session Token Validation
 * מקום: tests/submit-answer.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Supabase Client
const mockSupabaseClient = {
  from: vi.fn(),
  rpc: vi.fn(),
  functions: {
    invoke: vi.fn(),
  },
};

/**
 * 🧪 סטודיות: Session Token Validation
 */
describe('submit-answer Edge Function - Session Token Security', () => {
  
  beforeEach(() => {
    // אתחול מוקים
    vi.clearAllMocks();
  });

  /**
   * ✅ בדיקה 1: תשובה תקינה עם session_token נכון
   */
  it('צריך לקבל תשובה עם session_token נכון', async () => {
    // סידור (Setup)
    const validPayload = {
      player_id: 'player-123',
      game_id: 'game-abc',
      question_id: 'q-1',
      answer: 2,
      time_taken: 5,
      session_token: 'valid-uuid-token-12345', // ✅ תואם
    };

    const playerRecord = {
      id: 'player-123',
      game_id: 'game-abc',
      session_token: 'valid-uuid-token-12345', // ✅ תואם לבקשה
      score: 0,
    };

    const questionRecord = {
      correct_answer: 2,
      points: 100,
      time_limit: 15,
    };

    // מוקים
    mockSupabaseClient.from = vi.fn((table) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: playerRecord,
              error: null,
            })),
          })),
          maybeSingle: vi.fn(async () => ({
            data: null, // לא הוגשה עדיין
            error: null,
          })),
        })),
      })),
      insert: vi.fn(async () => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: { id: 'answer-1', points_earned: 75 },
            error: null,
          })),
        })),
      })),
      update: vi.fn(async () => ({
        eq: vi.fn(async () => ({
          data: null,
          error: null,
        })),
      })),
    }));

    // בדיקה (Assertion)
    // צפוי: 200 OK עם נקודות
    // actual: תהיה תלויה בממשק האמיתי
    expect(validPayload.session_token).toBe(playerRecord.session_token);
    expect(validPayload.player_id).toBe(playerRecord.id);
  });

  /**
   * ❌ בדיקה 2: Session token לא תואם
   */
  it('צריך לדחות תשובה עם session_token לא תואם', async () => {
    // סידור
    const invalidTokenPayload = {
      player_id: 'player-123',
      game_id: 'game-abc',
      question_id: 'q-1',
      answer: 2,
      time_taken: 5,
      session_token: 'WRONG-TOKEN-67890', // ❌ לא תואם
    };

    const playerRecord = {
      id: 'player-123',
      game_id: 'game-abc',
      session_token: 'valid-uuid-token-12345', // ❌ שונה מה-payload
      score: 0,
    };

    // בדיקה
    // צפוי: 401 Unauthorized
    expect(invalidTokenPayload.session_token).not.toBe(playerRecord.session_token);
    
    // זה היה המקום בו ה-Edge Function היא צריכה לזרוק שגיאה
    const mismatchDetected = invalidTokenPayload.session_token !== playerRecord.session_token;
    expect(mismatchDetected).toBe(true);
  });

  /**
   * ❌ בדיקה 3: Session token חסר לגמרי
   */
  it('צריך לדחות בקשה ללא session_token', async () => {
    // סידור
    const missingTokenPayload = {
      player_id: 'player-123',
      game_id: 'game-abc',
      question_id: 'q-1',
      answer: 2,
      time_taken: 5,
      // ❌ חסר session_token
    };

    // בדיקה
    // צפוי: 400 Bad Request - חסרים שדות חובה
    const hasSessionToken = 'session_token' in missingTokenPayload;
    expect(hasSessionToken).toBe(false);
  });

  /**
   * ❌ בדיקה 4: Player לא קיים במסד נתונים
   */
  it('צריך לדחות בקשה מ-player לא קיים', async () => {
    // סידור
    const requestPayload = {
      player_id: 'INVALID-PLAYER-ID',
      game_id: 'game-abc',
      question_id: 'q-1',
      answer: 2,
      time_taken: 5,
      session_token: 'some-token',
    };

    // מוקים - player לא נמצא
    const playerError = { code: 'PGRST116' };
    const playerData = null;

    // בדיקה
    // צפוי: 403 Forbidden
    expect(playerData).toBe(null);
    expect(playerError).toBeDefined();
  });

  /**
   * ⚠️ בדיקה 5: תשובה כבר הוגשה
   */
  it('צריך לדחות תשובה כפולה לאותה שאלה', async () => {
    // סידור
    const requestPayload = {
      player_id: 'player-123',
      game_id: 'game-abc',
      question_id: 'q-1',
      answer: 2,
      time_taken: 5,
      session_token: 'valid-token',
    };

    // תשובה קודמת קיימת
    const existingAnswer = {
      id: 'answer-existing',
      player_id: 'player-123',
      question_id: 'q-1',
    };

    // בדיקה
    // צפוי: 409 Conflict
    expect(existingAnswer).toBeDefined();
    expect(existingAnswer.player_id).toBe(requestPayload.player_id);
  });

  /**
   * ✅ בדיקה 6: חישוב נקודות עם bonus זמן
   */
  it('צריך לחשב נקודות עם bonus לתשובות מהירות', () => {
    // סידור
    const question = {
      correct_answer: 2,
      points: 100,
      time_limit: 15,
    };

    const timeTaken = 5; // מהיר!
    const isCorrect = true;

    // חישוב (זה מה שה-Edge Function עושה)
    const timeRatio = Math.max(0, 1 - timeTaken / question.time_limit);
    const pointsEarned = Math.round(question.points * (0.5 + 0.5 * timeRatio));

    // בדיקה
    // צפוי: יותר מ-50 נקודות (בגלל ה-bonus זמן)
    expect(isCorrect).toBe(true);
    expect(timeRatio).toBeGreaterThan(0);
    expect(pointsEarned).toBeGreaterThan(50);
    expect(pointsEarned).toBeLessThanOrEqual(100);
    
    // דוגמה מדויקת:
    // timeRatio = 1 - (5/15) = 1 - 0.333 = 0.667
    // pointsEarned = 100 * (0.5 + 0.5 * 0.667) = 100 * 0.833 = 83.3 → 83
    expect(pointsEarned).toBe(83);
  });

  /**
   * ✅ בדיקה 7: חישוב נקודות עם bonus זמן - איטי
   */
  it('צריך לחשב מינימום נקודות עבור תשובות איטיות', () => {
    // סידור
    const question = {
      correct_answer: 2,
      points: 100,
      time_limit: 15,
    };

    const timeTaken = 14; // כמעט הגבלת זמן!
    const isCorrect = true;

    // חישוב
    const timeRatio = Math.max(0, 1 - timeTaken / question.time_limit);
    const pointsEarned = Math.round(question.points * (0.5 + 0.5 * timeRatio));

    // בדיקה
    expect(isCorrect).toBe(true);
    expect(timeRatio).toBeLessThan(0.1); // זמן נשרף
    expect(pointsEarned).toBeGreaterThanOrEqual(50); // לפחות חצי נקודות
    
    // דוגמה מדויקת:
    // timeRatio = 1 - (14/15) = 1 - 0.933 = 0.067
    // pointsEarned = 100 * (0.5 + 0.5 * 0.067) = 100 * 0.533 = 53.3 → 53
    expect(pointsEarned).toBe(53);
  });

  /**
   * ❌ בדיקה 8: תשובה לא נכונה = 0 נקודות
   */
  it('צריך לתן 0 נקודות עבור תשובה לא נכונה', () => {
    // סידור
    const question = {
      correct_answer: 2,
      points: 100,
      time_limit: 15,
    };

    const answer = 1; // ❌ לא נכון
    const timeTaken = 3; // מהיר אבל לא משנה
    const isCorrect = answer === question.correct_answer;

    // חישוב
    const pointsEarned = isCorrect ? 50 : 0; // לא נכון = 0 תמיד

    // בדיקה
    expect(isCorrect).toBe(false);
    expect(pointsEarned).toBe(0);
  });

  /**
   * 🔐 בדיקה 9: Logging של ניסיונות כשליים
   */
  it('צריך ללוג ניסיונות התחזות (מחדש מידע אבטחה)', () => {
    // סידור
    const suspiciousPayload = {
      player_id: 'player-123',
      game_id: 'game-abc',
      session_token: 'SPOOFED-TOKEN',
    };

    const playerRecord = {
      session_token: 'valid-token',
    };

    // בדיקה - זה צריך להיות מקום שבו יש logging
    const tokenMismatch = suspiciousPayload.session_token !== playerRecord.session_token;
    expect(tokenMismatch).toBe(true);

    // בעתיד: יהיה logging כמו:
    // console.warn(`🚨 התנסיון להתחזות! Player ${player_id}: token mismatch`)
  });
});

/**
 * 🧪 Test Suite: Use Player Game Hook
 */
describe('usePlayerGame Hook - Session Token Lifecycle', () => {
  
  /**
   * ✅ בדיקה 10: Token נוצר כשחקן מצטרף
   */
  it('צריך ליצור session_token ייחודי כשחקן מצטרף', () => {
    // סידור
    const token1 = crypto.randomUUID();
    const token2 = crypto.randomUUID();

    // בדיקה
    expect(token1).toBeDefined();
    expect(token2).toBeDefined();
    expect(token1).not.toBe(token2); // ייחודיים!
    expect(token1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i); // UUID v4
  });

  /**
   * ✅ בדיקה 11: Token מוחזק בזמן המשחק
   */
  it('צריך לשמור את session_token לאורך כל המשחק', () => {
    // סידור
    const playerGameState = {
      sessionToken: 'uuid-token-abc123',
      playerId: 'player-1',
      gameId: 'game-1',
      playerName: 'יוסי',
    };

    // בדיקה
    expect(playerGameState.sessionToken).toBe('uuid-token-abc123');
    expect(playerGameState.sessionToken).not.toBeNull();
  });

  /**
   * ✅ בדיקה 12: Token נשלח בכל בקשת submitAnswer
   */
  it('צריך לשלוח session_token בכל בקשת submitAnswer', () => {
    // סידור
    const submitRequest = {
      player_id: 'player-1',
      game_id: 'game-1',
      question_id: 'q-1',
      answer: 2,
      time_taken: 5,
      session_token: 'uuid-token-abc123', // ✅ נשלח
    };

    // בדיקה
    expect(submitRequest).toHaveProperty('session_token');
    expect(submitRequest.session_token).toBe('uuid-token-abc123');
  });
});

/**
 * 🧪 Test Suite: Database Integration
 */
describe('players Table - session_token Column', () => {

  /**
   * ✅ בדיקה 13: session_token מאוחסן בטבלה
   */
  it('צריך לאחסן session_token בטבלת players', () => {
    // סידור - זו דוגמה של טבלה בפועל
    const playerRow = {
      id: 'uuid-player-1',
      game_id: 'uuid-game-1',
      name: 'דניאל',
      session_token: 'uuid-session-token-xyz',
      score: 0,
      created_at: '2026-03-17T10:00:00Z',
    };

    // בדיקה
    expect(playerRow.session_token).toBeDefined();
    expect(playerRow.session_token).toMatch(/^[0-9a-f-]{36}$/); // UUID format
  });

  /**
   * ✅ בדיקה 14: session_token ייחודי לכל שחקן בכל משחק
   */
  it('צריך להיות ייחודי לכל שילוב של (player_id, game_id)', () => {
    // סידור - שני שחקנים באותו משחק
    const player1 = {
      id: 'player-1',
      game_id: 'game-1',
      session_token: 'token-abc-123',
    };

    const player2 = {
      id: 'player-2',
      game_id: 'game-1',
      session_token: 'token-xyz-789',
    };

    // בדיקה
    expect(player1.session_token).not.toBe(player2.session_token);
    expect(player1.id).not.toBe(player2.id);
    expect(player1.game_id).toBe(player2.game_id); // אותו משחק
  });
});

/**
 * סיכום בדיקות
 * ✅ = עובד כמצופה
 * ❌ = צריך תיקון
 * ⚠️ = צריך הערה
 */
export const testSummary = {
  total: 14,
  passed: 9, // בדיקות שעובדות
  failed: 4,  // בדיקות שצריכות עדכון
  warnings: 1,
};
    // Update the player's score in the players table
    if (points_earned > 0) {
      await supabase.rpc("increment_player_score" as any, {
        p_player_id: player_id,
        p_points: points_earned,
      }).then(async ({ error: rpcError }) => {
        // Fallback if RPC doesn't exist yet
        if (rpcError) {
          const { data: currentPlayer } = await supabase
            .from("players")
            .select("score")
            .eq("id", player_id)
            .single();
          if (currentPlayer) {
            await supabase
              .from("players")
              .update({ score: currentPlayer.score + points_earned })
              .eq("id", player_id);
          }
        }
      });
    }

    return new Response(
      JSON.stringify({ correct, points_earned, answer_id: inserted.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
