// Web Audio API based sound effects - no external files needed
const audioCtx = () => {
  if (!(window as any).__gameAudioCtx) {
    (window as any).__gameAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return (window as any).__gameAudioCtx as AudioContext;
};

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.3) {
  const ctx = audioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playSequence(notes: { freq: number; dur: number; delay: number; type?: OscillatorType }[], volume = 0.25) {
  notes.forEach(({ freq, dur, delay, type }) => {
    setTimeout(() => playTone(freq, dur, type || "sine", volume), delay * 1000);
  });
}

export const SoundEffects = {
  // Lobby waiting - gentle pulse
  lobbyPulse: () => {
    playTone(440, 0.15, "sine", 0.1);
    setTimeout(() => playTone(554, 0.15, "sine", 0.1), 150);
  },

  // Game start - ascending fanfare
  gameStart: () => {
    playSequence([
      { freq: 523, dur: 0.15, delay: 0 },
      { freq: 659, dur: 0.15, delay: 0.12 },
      { freq: 784, dur: 0.15, delay: 0.24 },
      { freq: 1047, dur: 0.4, delay: 0.36, type: "triangle" },
    ], 0.35);
  },

  // New question appears - dramatic reveal
  questionReveal: () => {
    playSequence([
      { freq: 330, dur: 0.1, delay: 0, type: "square" },
      { freq: 440, dur: 0.1, delay: 0.08, type: "square" },
      { freq: 660, dur: 0.2, delay: 0.16, type: "triangle" },
    ], 0.2);
  },

  // Timer tick - subtle click (last 5 seconds)
  timerTick: () => {
    playTone(880, 0.05, "square", 0.15);
  },

  // Timer urgent - faster ticks (last 3 seconds)
  timerUrgent: () => {
    playTone(1200, 0.08, "square", 0.25);
    setTimeout(() => playTone(1200, 0.08, "square", 0.2), 100);
  },

  // Time's up - buzzer
  timeUp: () => {
    playTone(200, 0.5, "sawtooth", 0.3);
    setTimeout(() => playTone(150, 0.4, "sawtooth", 0.25), 200);
  },

  // Correct answer - happy chime
  correct: () => {
    playSequence([
      { freq: 523, dur: 0.12, delay: 0, type: "triangle" },
      { freq: 659, dur: 0.12, delay: 0.1, type: "triangle" },
      { freq: 784, dur: 0.12, delay: 0.2, type: "triangle" },
      { freq: 1047, dur: 0.35, delay: 0.3, type: "sine" },
    ], 0.3);
  },

  // Wrong answer - descending sad tone
  wrong: () => {
    playSequence([
      { freq: 400, dur: 0.2, delay: 0, type: "sawtooth" },
      { freq: 300, dur: 0.3, delay: 0.15, type: "sawtooth" },
    ], 0.2);
  },

  // Leaderboard reveal - dramatic
  leaderboard: () => {
    playSequence([
      { freq: 392, dur: 0.15, delay: 0, type: "triangle" },
      { freq: 440, dur: 0.15, delay: 0.15, type: "triangle" },
      { freq: 523, dur: 0.15, delay: 0.3, type: "triangle" },
      { freq: 659, dur: 0.3, delay: 0.45, type: "sine" },
    ], 0.25);
  },

  // Victory fanfare - full celebration
  victory: () => {
    playSequence([
      { freq: 523, dur: 0.15, delay: 0, type: "triangle" },
      { freq: 659, dur: 0.15, delay: 0.15, type: "triangle" },
      { freq: 784, dur: 0.15, delay: 0.3, type: "triangle" },
      { freq: 1047, dur: 0.2, delay: 0.45, type: "sine" },
      { freq: 784, dur: 0.1, delay: 0.65, type: "sine" },
      { freq: 1047, dur: 0.5, delay: 0.75, type: "sine" },
    ], 0.35);
  },

  // Player joined
  playerJoin: () => {
    playTone(660, 0.1, "sine", 0.15);
    setTimeout(() => playTone(880, 0.15, "sine", 0.15), 80);
  },

  // Button click
  click: () => {
    playTone(800, 0.04, "square", 0.1);
  },
};
