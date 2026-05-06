import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSupabaseQuestions } from "@/hooks/useSupabaseQuestions";
import { useRealtimeGame } from "@/hooks/useRealtimeGame";
import { GameLobby } from "@/components/game/GameLobby";
import { GameQuestionDisplay } from "@/components/game/GameQuestionDisplay";
import { GameResults } from "@/components/game/GameResults";
import { GameLeaderboard } from "@/components/game/GameLeaderboard";
import { GameFinished } from "@/components/game/GameFinished";
import { SoundControlPanel } from "@/components/game/SoundControlPanel";
import { Home, Loader2, Settings } from "lucide-react";
import { useBranding } from "@/hooks/useBranding";
import { HeroIntro } from "@/components/game/HeroIntro";
import { usePhonePlayers } from "@/hooks/usePhonePlayers";
import { IvrSyncIndicator } from "@/components/game/IvrSyncIndicator";
import { HostLiveStatusPanel } from "@/components/game/HostLiveStatusPanel";
import { IvrLiveStatusPanel } from "@/components/game/IvrLiveStatusPanel";
import { supabase } from "@/integrations/supabase/client";
import { StartAtDebugPanel } from "@/components/game/StartAtDebugPanel";
import { ClockSkewDialog, type ClockSkewSeverity } from "@/components/game/ClockSkewDialog";
import { IvrTestCallButton } from "@/components/game/IvrTestCallButton";
import { SoundEffects } from "@/hooks/useSoundEffects";

const GameHost = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeGameId = searchParams.get("gameId");
  const { questions, settings, loading: questionsLoading } = useSupabaseQuestions();
  const game = useRealtimeGame(questions, settings);
  const { gameState } = game;
  const [gameReady, setGameReady] = useState(false);
  const [graceCountdown, setGraceCountdown] = useState<number | null>(null);
  const [startAt, setStartAt] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const [clockSkew, setClockSkew] = useState<{ severity: ClockSkewSeverity; driftSeconds: number; serverMessage?: string } | null>(null);
  const [pendingStart, setPendingStart] = useState<(() => void) | null>(null);
  const { branding } = useBranding();
  const phonePlayers = usePhonePlayers(game.gameDbId);
  const [questionReady, setQuestionReady] = useState(false);
  const [locked, setLocked] = useState(false);

  // Sync locked flag from DB
  useEffect(() => {
    if (!game.gameDbId) return;
    let cancelled = false;
    const fetchLocked = async () => {
      const { data } = await supabase
        .from("games")
        .select("locked")
        .eq("id", game.gameDbId)
        .maybeSingle();
      if (!cancelled) setLocked(Boolean((data as { locked?: boolean } | null)?.locked));
    };
    fetchLocked();
    const iv = setInterval(fetchLocked, 5000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [game.gameDbId]);

  const toggleLock = async () => {
    if (!game.gameDbId) return;
    const next = !locked;
    setLocked(next);
    await supabase.from("games").update({ locked: next }).eq("id", game.gameDbId);
  };

  // Reset readiness on every question change / status switch
  useEffect(() => {
    setQuestionReady(false);
  }, [gameState.currentQuestionIndex, gameState.status]);

  // Live-track games.start_at across all phases so the host live panel can
  // tell apart "normal" vs "recovery" phone joiners (created_at vs start_at).
  useEffect(() => {
    if (!game.gameDbId) return;
    let cancelled = false;
    const fetchStart = async () => {
      const { data } = await supabase
        .from("games")
        .select("start_at")
        .eq("id", game.gameDbId)
        .maybeSingle();
      if (!cancelled) setStartAt((data as { start_at: string | null } | null)?.start_at ?? null);
    };
    fetchStart();
    // Poll faster while in lobby (countdown UX), slower mid-game.
    const intervalMs = gameState.status === "lobby" ? 2000 : 10_000;
    const iv = setInterval(fetchStart, intervalMs);
    const tick = setInterval(() => setNowTick(Date.now()), 1000);
    return () => { cancelled = true; clearInterval(iv); clearInterval(tick); };
  }, [game.gameDbId, gameState.status]);

  // Create or resume game session when questions are loaded
  useEffect(() => {
    if (questionsLoading || questions.length === 0 || gameReady) return;

    if (resumeGameId) {
      game.resumeGame(resumeGameId, questions).then((result) => {
        if (result) setGameReady(true);
      });
    } else {
      game.createGame().then(() => setGameReady(true));
    }
  }, [questionsLoading, questions.length, gameReady, resumeGameId]);

  // Timer — only ticks once the question is fully rendered (audio+UI ready)
  useEffect(() => {
    if (gameState.status !== "question" || gameState.timeRemaining <= 0) return;
    if (!questionReady) return;
    const interval = setInterval(() => game.tick(), 1000);
    return () => clearInterval(interval);
  }, [gameState.status, gameState.timeRemaining, questionReady, game.tick]);

  // Auto show results when timer ends — stop hourglass first to avoid leak
  useEffect(() => {
    if (gameState.status === "question" && gameState.timeRemaining <= 0 && questionReady) {
      SoundEffects.stopHourglass();
      game.showResults();
    }
  }, [gameState.timeRemaining, gameState.status, questionReady]);

  const handleNextFromResults = async () => {
    SoundEffects.stopHourglass();
    if (gameState.settings.showLeaderboardAfterEach) {
      game.showLeaderboard();
    } else {
      const isFinished = await game.nextQuestion();
      if (!isFinished) {
        // Wait for exit animation before mounting next question
        setTimeout(() => game.showQuestion(), 450);
      }
    }
  };

  const handleNextFromLeaderboard = async () => {
    SoundEffects.stopHourglass();
    const isFinished = await game.nextQuestion();
    if (!isFinished) {
      setTimeout(() => game.showQuestion(), 450);
    }
  };

  if (questionsLoading || !gameReady) {
    return (
      <div className="min-h-screen game-gradient flex items-center justify-center relative overflow-hidden" dir="rtl">
        {branding.backgroundImageUrl && (
          <div
            className="absolute inset-0 bg-center bg-cover opacity-15 pointer-events-none"
            style={{ backgroundImage: `url(${branding.backgroundImageUrl})` }}
            aria-hidden="true"
          />
        )}
        <motion.div className="text-center relative z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {(branding.heroImageUrl || branding.logoUrl) && (
            <img
              src={branding.heroImageUrl || branding.logoUrl}
              alt={branding.name}
              className="mx-auto mb-6 max-h-40 w-auto rounded-xl shadow-xl object-cover"
            />
          )}
          <Loader2 className="w-12 h-12 text-game-gold animate-spin mx-auto mb-4" />
          <p className="text-game-dark-gold/60 font-serif text-xl">
            {resumeGameId ? "טוען משחק..." : "מכין את המשחק..."}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen game-gradient relative overflow-hidden" dir="rtl">
      {branding.backgroundImageUrl && (
        <div
          className="absolute inset-0 bg-center bg-cover opacity-15 pointer-events-none z-0"
          style={{ backgroundImage: `url(${branding.backgroundImageUrl})` }}
          aria-hidden="true"
        />
      )}
      {branding.logoUrl && (
        <img
          src={branding.logoUrl}
          alt={branding.name}
          className="absolute top-3 right-4 z-50 h-12 w-12 object-contain drop-shadow-md pointer-events-none"
        />
      )}
      <div className="absolute top-4 left-4 z-50 flex gap-2 items-start">
        <Button variant="ghost" size="icon" className="text-game-dark-gold/50 hover:text-game-dark-gold" onClick={() => navigate("/")}>
          <Home className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-game-dark-gold/50 hover:text-game-dark-gold" onClick={() => navigate("/admin")}>
          <Settings className="w-5 h-5" />
        </Button>
        <SoundControlPanel />
        <IvrSyncIndicator
          phonePlayers={phonePlayers}
          currentQuestionIndex={gameState.currentQuestionIndex}
        />
        <IvrTestCallButton compact />
        {gameState.status !== "finished" && (
          <Button
            variant={locked ? "destructive" : "outline"}
            size="sm"
            onClick={toggleLock}
            className="gap-1"
            title={locked ? "המשחק נעול — מתקשרים חדשים לא יוכלו להצטרף" : "נעל מתקשרים חדשים"}
          >
            {locked ? "🔒 נעול" : "🔓 נעל משחק"}
          </Button>
        )}
      </div>

      <HostLiveStatusPanel
        gameStatus={gameState.status as "lobby" | "playing" | "question" | "results" | "leaderboard" | "finished"}
        currentQuestionIndex={gameState.currentQuestionIndex}
        totalQuestions={gameState.questions.length}
        questionText={gameState.questions[gameState.currentQuestionIndex]?.text}
        timeRemaining={gameState.timeRemaining}
        screenPlayersCount={gameState.players.length}
        phonePlayers={phonePlayers}
        startAt={startAt}
      />

      <div className="mt-3">
        <IvrLiveStatusPanel
          gameStatus={gameState.status as "lobby" | "playing" | "question" | "results" | "leaderboard" | "finished"}
          currentQuestionIndex={gameState.currentQuestionIndex}
          totalQuestions={gameState.questions.length}
          timeRemaining={gameState.timeRemaining}
          phonePlayers={phonePlayers}
          startAt={startAt}
        />
      </div>

      <HeroIntro triggerKey={`${gameState.status}-${gameState.currentQuestionIndex}`} />

      <AnimatePresence mode="wait">
        {gameState.status === "lobby" && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }} transition={{ duration: 0.4 }}>
            <StartAtDebugPanel startAt={startAt} now={nowTick} />
            <GameLobby
              gameCode={gameState.gameCode}
              players={gameState.players}
              phonePlayers={phonePlayers}
              gameStatus={gameState.status}
              onAddPlayer={game.addPlayer}
              onStart={async () => {
                const proceedStart = () => {
                  const grace = Math.max(0, gameState.settings.lobbyGraceSeconds || 0);
                  const startAtIso = new Date(Date.now() + grace * 1000).toISOString();
                  if (game.gameDbId) {
                    supabase.from("games").update({ start_at: startAtIso }).eq("id", game.gameDbId);
                  }
                  if (grace === 0) {
                    game.startGame();
                    setTimeout(() => game.showQuestion(), 100);
                    return;
                  }
                  setGraceCountdown(grace);
                  let remaining = grace;
                  const iv = setInterval(() => {
                    remaining -= 1;
                    if (remaining <= 0) {
                      clearInterval(iv);
                      setGraceCountdown(null);
                      game.startGame();
                      setTimeout(() => game.showQuestion(), 100);
                    } else {
                      setGraceCountdown(remaining);
                    }
                  }, 1000);
                };

                // Server-side clock-skew sanity check before starting.
                const { data: skewRows } = await supabase.rpc("check_clock_skew", {
                  p_client_now: new Date().toISOString(),
                  p_warn_seconds: 5,
                  p_critical_seconds: 30,
                });
                const skew = Array.isArray(skewRows) ? skewRows[0] : null;
                if (skew?.severity === "critical") {
                  setClockSkew({
                    severity: "critical",
                    driftSeconds: Number(skew.drift_seconds),
                    serverMessage: skew.message,
                  });
                  setPendingStart(null);
                  return;
                }
                if (skew?.severity === "warning") {
                  setClockSkew({
                    severity: "warning",
                    driftSeconds: Number(skew.drift_seconds),
                    serverMessage: skew.message,
                  });
                  setPendingStart(() => proceedStart);
                  return;
                }
                proceedStart();
              }}
              graceCountdown={graceCountdown}
              onCancelGrace={async () => {
                setGraceCountdown(null);
                if (game.gameDbId) {
                  await supabase.from("games").update({ start_at: new Date().toISOString() }).eq("id", game.gameDbId);
                }
                game.startGame();
                setTimeout(() => game.showQuestion(), 100);
              }}
              questionsCount={gameState.questions.length}
            />
          </motion.div>
        )}

        {gameState.status === "question" && (
          <motion.div
            key={`question-${gameState.currentQuestionIndex}`}
            initial={{ opacity: 0, x: 100, rotateY: 15 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: -100, rotateY: -15 }}
            transition={{ type: "spring", stiffness: 100, damping: 18 }}
          >
            <GameQuestionDisplay
              question={gameState.questions[gameState.currentQuestionIndex]}
              questionNumber={gameState.currentQuestionIndex + 1}
              totalQuestions={gameState.questions.length}
              timeRemaining={gameState.timeRemaining}
              onTimeUp={game.showResults}
              onReady={() => setQuestionReady(true)}
            />
          </motion.div>
        )}

        {gameState.status === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 1.1, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <GameResults
              question={gameState.questions[gameState.currentQuestionIndex]}
              players={gameState.players}
              onNext={handleNextFromResults}
            />
          </motion.div>
        )}

        {gameState.status === "leaderboard" && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 80, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
          >
            <GameLeaderboard
              players={gameState.players}
              onNext={handleNextFromLeaderboard}
              isFinal={false}
            />
          </motion.div>
        )}

        {gameState.status === "finished" && (
          <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.8, filter: "blur(12px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <GameFinished
              players={gameState.players}
              questions={gameState.questions}
              onRestart={() => {
                setGameReady(false);
                game.resetGame();
                navigate("/host", { replace: true });
              }}
              onHome={() => navigate("/")}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ClockSkewDialog
        open={!!clockSkew}
        info={clockSkew}
        onCancel={() => {
          setClockSkew(null);
          setPendingStart(null);
        }}
        onContinue={
          clockSkew?.severity === "warning" && pendingStart
            ? () => {
                const fn = pendingStart;
                setClockSkew(null);
                setPendingStart(null);
                fn();
              }
            : undefined
        }
      />
    </div>
  );
};

export default GameHost;
