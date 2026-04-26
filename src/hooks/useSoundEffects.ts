// ============================================================
// useSoundEffects.ts — Theme-aware Web Audio sound system
// Each theme has unique ambient music & SFX palette
// ============================================================

let _audioCtx: AudioContext | null = null;
const audioCtx = () => {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_audioCtx.state === "suspended") _audioCtx.resume();
  return _audioCtx;
};

let masterVolume  = 0.5;
let musicVolume   = 0.3;
let sfxVolume     = 0.5;
let musicEnabled  = true;
let sfxEnabled    = true;
let activeTheme   = "parchment";

let musicGainNode: GainNode | null = null;
let musicOscillators: OscillatorNode[] = [];
let musicInterval: ReturnType<typeof setInterval> | null = null;

// ── Primitive helpers ──────────────────────────────────────

function playTone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.3, detune = 0) {
  if (!sfxEnabled) return;
  const ctx = audioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  osc.detune.setValueAtTime(detune, ctx.currentTime);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(freq * 3, ctx.currentTime);
  const v = vol * masterVolume * sfxVolume;
  gain.gain.setValueAtTime(v, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + dur);
}

function playChord(freqs: number[], dur: number, type: OscillatorType = "sine", vol = 0.15) {
  freqs.forEach((f, i) => playTone(f, dur, type, vol, i * 3));
}

function playSequence(notes: { freq: number; dur: number; delay: number; type?: OscillatorType; vol?: number; chord?: number[] }[], vol = 0.25) {
  notes.forEach(({ freq, dur, delay, type, vol: v, chord }) => {
    setTimeout(() => {
      if (chord) playChord(chord, dur, type || "sine", (v || vol) * 0.6);
      playTone(freq, dur, type || "sine", v || vol);
    }, delay * 1000);
  });
}

function playWithEcho(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.3, n = 3) {
  playTone(freq, dur, type, vol);
  for (let i = 1; i <= n; i++)
    setTimeout(() => playTone(freq, dur * 0.6, type, vol * Math.pow(0.4, i)), i * 80);
}

// ── Theme music configs ────────────────────────────────────

type MusicStyle = "lobby" | "game" | "victory";
interface ThemeMusicCfg { notes: number[][]; tempo: number; type: OscillatorType; vol: number }

const THEME_MUSIC: Record<string, Record<MusicStyle, ThemeMusicCfg>> = {
  // 📜 Parchment — warm classical arpeggios
  parchment: {
    lobby:   { notes:[[261,329,392],[293,349,440],[329,392,523],[261,329,392]], tempo:600, type:"sine",     vol:0.08 },
    game:    { notes:[[220,261,329],[233,277,349],[220,261,329],[196,246,293]], tempo:450, type:"triangle", vol:0.07 },
    victory: { notes:[[329,415,523],[392,493,587],[440,554,659],[523,659,784]], tempo:500, type:"sine",     vol:0.09 },
  },
  // 🌌 Dark — deep electronic
  dark: {
    lobby:   { notes:[[55,110],[65,130],[55,110],[73,146]], tempo:800, type:"sawtooth", vol:0.05 },
    game:    { notes:[[55,82],[65,98],[55,82],[49,73]],     tempo:550, type:"square",   vol:0.06 },
    victory: { notes:[[110,138,165],[146,184,220],[165,207,247],[220,277,330]], tempo:450, type:"triangle", vol:0.07 },
  },
  // 🌊 Ocean — fluid wave-like
  ocean: {
    lobby:   { notes:[[196,247,294],[220,277,330],[247,311,370],[220,277,330]], tempo:900, type:"sine", vol:0.07 },
    game:    { notes:[[185,247,311],[196,262,330],[185,247,311],[175,233,294]], tempo:700, type:"sine", vol:0.06 },
    victory: { notes:[[294,370,440],[330,415,494],[370,466,554],[440,554,659]], tempo:600, type:"sine", vol:0.08 },
  },
  // 🌿 Forest — bird chirps + nature rhythm
  forest: {
    lobby: {
      // High-frequency bird-like chirp patterns
      notes:[[1047,1319],[1175,1568],[880,1109],[1319,1568],[659,880],[1047,1319]],
      tempo:650, type:"sine", vol:0.045,
    },
    game: {
      notes:[[523,659],[440,554],[392,494],[349,440],[523,659],[440,554]],
      tempo:550, type:"triangle", vol:0.055,
    },
    victory: {
      notes:[[659,880,1047],[784,988,1175],[880,1109,1319],[1047,1319,1568]],
      tempo:450, type:"sine", vol:0.08,
    },
  },
  // 🌅 Sunset — warm, slow, melodic
  sunset: {
    lobby:   { notes:[[293,370,440],[329,415,494],[370,466,554],[329,415,494]], tempo:1000, type:"sine",     vol:0.07 },
    game:    { notes:[[247,311,370],[262,330,392],[277,349,415],[247,311,370]], tempo:750,  type:"triangle", vol:0.06 },
    victory: { notes:[[440,554,659],[494,622,740],[554,698,831],[659,831,988]], tempo:550,  type:"sine",     vol:0.08 },
  },
  // 🚀 Sci-Fi — tense mysterious electronic pulses
  scifi: {
    lobby: {
      notes:[[73,110,146],[82,123,164],[65,98,130],[73,110,146],[87,130,174],[65,98,130]],
      tempo:720, type:"sawtooth", vol:0.055,
    },
    game: {
      notes:[[110,146,175],[98,131,164],[110,146,175],[87,116,146],[110,146,175],[98,131,164]],
      tempo:460, type:"square", vol:0.05,
    },
    victory: {
      notes:[[164,207,247],[196,247,294],[220,277,330],[247,311,370],[294,370,440]],
      tempo:420, type:"triangle", vol:0.08,
    },
  },
  // 🏥 Medical — clean clinical minimal
  medical: {
    lobby:   { notes:[[440],[493],[523],[493]], tempo:1200, type:"sine", vol:0.04 },
    game:    { notes:[[523],[493],[440],[415]], tempo:900,  type:"sine", vol:0.04 },
    victory: { notes:[[523,659,784],[659,784,988],[784,988,1175],[988,1175,1397]], tempo:500, type:"triangle", vol:0.06 },
  },
};

function getThemeCfg(style: MusicStyle): ThemeMusicCfg {
  return THEME_MUSIC[activeTheme]?.[style] || THEME_MUSIC.parchment[style];
}

// ── Background music engine ────────────────────────────────

function stopBackgroundMusic() {
  if (musicInterval) { clearInterval(musicInterval); musicInterval = null; }
  musicOscillators.forEach(o => { try { o.stop(); } catch {} });
  musicOscillators = [];
  if (musicGainNode) {
    try { musicGainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx().currentTime + 0.3); } catch {}
    musicGainNode = null;
  }
}

function startBackgroundMusic(style: MusicStyle = "lobby") {
  stopBackgroundMusic();
  if (!musicEnabled) return;

  const ctx = audioCtx();
  const cfg = getThemeCfg(style);

  musicGainNode = ctx.createGain();
  musicGainNode.gain.setValueAtTime(musicVolume * masterVolume * cfg.vol, ctx.currentTime);
  musicGainNode.connect(ctx.destination);

  let step = 0;
  const playStep = () => {
    if (!musicGainNode) return;
    const chord = cfg.notes[step % cfg.notes.length];
    chord.forEach(freq => {
      const osc = ctx.createOscillator();
      const ng = ctx.createGain();
      osc.type = cfg.type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.detune.setValueAtTime(Math.random() * 4 - 2, ctx.currentTime);
      const v = musicVolume * masterVolume * cfg.vol;
      ng.gain.setValueAtTime(0.001, ctx.currentTime);
      ng.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.1);
      ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + cfg.tempo / 1000 * 0.85);
      osc.connect(ng); ng.connect(musicGainNode!);
      osc.start(); osc.stop(ctx.currentTime + cfg.tempo / 1000);
      musicOscillators.push(osc);
    });
    step++;
  };
  playStep();
  musicInterval = setInterval(playStep, cfg.tempo);
}

// ── Theme-specific SFX helpers ─────────────────────────────

function themeCorrect() {
  switch (activeTheme) {
    case "scifi":
      // Laser/digital ascending beeps
      playSequence([
        { freq:880,  dur:0.06, delay:0,    type:"square",   vol:0.18 },
        { freq:1109, dur:0.06, delay:0.07, type:"square",   vol:0.18 },
        { freq:1397, dur:0.10, delay:0.14, type:"triangle", vol:0.20 },
        { freq:1760, dur:0.20, delay:0.22, type:"sine",     vol:0.22 },
      ], 0.2);
      break;
    case "forest":
      // Bird chirp celebration
      playSequence([
        { freq:1047, dur:0.08, delay:0,    type:"sine", vol:0.14 },
        { freq:1319, dur:0.08, delay:0.06, type:"sine", vol:0.14 },
        { freq:1568, dur:0.08, delay:0.12, type:"sine", vol:0.14 },
        { freq:1319, dur:0.12, delay:0.20, type:"sine", vol:0.16 },
        { freq:1760, dur:0.18, delay:0.30, type:"sine", vol:0.18 },
      ], 0.15);
      break;
    case "ocean":
      // Smooth wave-like ascending
      playSequence([
        { freq:440, dur:0.15, delay:0,    type:"sine", vol:0.15, chord:[440,554] },
        { freq:554, dur:0.15, delay:0.12, type:"sine", vol:0.15, chord:[554,659] },
        { freq:659, dur:0.25, delay:0.25, type:"sine", vol:0.18, chord:[659,784,988] },
      ], 0.18);
      break;
    case "dark":
      playSequence([
        { freq:220, dur:0.08, delay:0,    type:"sawtooth", vol:0.12 },
        { freq:277, dur:0.08, delay:0.08, type:"sawtooth", vol:0.14 },
        { freq:330, dur:0.15, delay:0.16, type:"triangle", vol:0.18, chord:[330,440,554] },
      ], 0.16);
      break;
    default:
      // Default sparkle
      playSequence([
        { freq:523,  dur:0.1,  delay:0,    type:"sine", chord:[523,659] },
        { freq:659,  dur:0.1,  delay:0.08, type:"sine", chord:[659,784] },
        { freq:784,  dur:0.1,  delay:0.16, type:"sine" },
        { freq:1047, dur:0.1,  delay:0.24, type:"triangle" },
        { freq:1318, dur:0.15, delay:0.32, type:"triangle" },
        { freq:1568, dur:0.4,  delay:0.4,  type:"sine", vol:0.35, chord:[1047,1318,1568] },
      ], 0.3);
      for (let i = 0; i < 5; i++)
        setTimeout(() => playTone(2000 + Math.random() * 2000, 0.05, "sine", 0.06), 500 + i * 60);
  }
}

function themeWrong() {
  switch (activeTheme) {
    case "scifi":
      playTone(200, 0.05, "square", 0.15);
      setTimeout(() => playTone(150, 0.08, "square", 0.15), 60);
      setTimeout(() => playTone(100, 0.25, "sawtooth", 0.12), 130);
      break;
    case "forest":
      playTone(277, 0.15, "triangle", 0.12);
      setTimeout(() => playTone(220, 0.20, "triangle", 0.10), 120);
      break;
    default:
      playSequence([
        { freq:400, dur:0.2, delay:0,    type:"sawtooth", chord:[400,475] },
        { freq:350, dur:0.2, delay:0.12, type:"sawtooth" },
        { freq:280, dur:0.35,delay:0.25, type:"sawtooth" },
      ], 0.18);
      setTimeout(() => playTone(100, 0.3, "sine", 0.15), 400);
  }
}

function themeGameStart() {
  stopBackgroundMusic();
  switch (activeTheme) {
    case "scifi":
      playSequence([
        { freq:110,  dur:0.15, delay:0,    type:"sawtooth", vol:0.2 },
        { freq:164,  dur:0.15, delay:0.12, type:"sawtooth", vol:0.22 },
        { freq:220,  dur:0.15, delay:0.24, type:"triangle", vol:0.24 },
        { freq:293,  dur:0.18, delay:0.36, type:"triangle", vol:0.26, chord:[293,440,587] },
        { freq:440,  dur:0.25, delay:0.50, type:"sine",     vol:0.28, chord:[440,587,880] },
        { freq:880,  dur:0.40, delay:0.72, type:"sine",     vol:0.30, chord:[587,880,1175] },
      ], 0.25);
      setTimeout(() => startBackgroundMusic("game"), 1300);
      break;
    case "forest":
      // Bird chorus build-up
      for (let i = 0; i < 4; i++)
        setTimeout(() => playTone(880 + i*220, 0.12, "sine", 0.10 + i*0.03), i * 120);
      setTimeout(() => playChord([659,880,1047,1319], 0.4, "sine", 0.12), 500);
      setTimeout(() => startBackgroundMusic("game"), 1000);
      break;
    default:
      playSequence([
        { freq:523, dur:0.18, delay:0,    type:"triangle", chord:[523,659,784] },
        { freq:587, dur:0.18, delay:0.15, type:"triangle", chord:[587,740,880] },
        { freq:659, dur:0.18, delay:0.30, type:"triangle", chord:[659,784,988] },
        { freq:784, dur:0.25, delay:0.45, type:"sine",     chord:[784,988,1175] },
        { freq:1047,dur:0.5,  delay:0.65, type:"sine",     vol:0.4, chord:[1047,1318,1568] },
      ], 0.35);
      setTimeout(() => startBackgroundMusic("game"), 1200);
  }
}

function themeVictory() {
  stopBackgroundMusic();
  switch (activeTheme) {
    case "scifi":
      playSequence([
        { freq:220,  dur:0.15, delay:0,    type:"sawtooth", vol:0.22 },
        { freq:293,  dur:0.15, delay:0.12, type:"sawtooth", vol:0.24 },
        { freq:440,  dur:0.20, delay:0.26, type:"triangle", vol:0.26, chord:[440,587,880] },
        { freq:587,  dur:0.20, delay:0.45, type:"triangle", vol:0.28, chord:[587,880,1175] },
        { freq:880,  dur:0.30, delay:0.65, type:"sine",     vol:0.30, chord:[880,1175,1760] },
        { freq:1175, dur:0.50, delay:0.95, type:"sine",     vol:0.32, chord:[1175,1760,2093] },
      ], 0.28);
      for (let i = 0; i < 10; i++)
        setTimeout(() => playTone(1500 + Math.random()*2000, 0.05, "sine", 0.04), 1000 + i*80);
      setTimeout(() => startBackgroundMusic("victory"), 1800);
      break;
    case "forest":
      // Bird choir
      for (let i = 0; i < 6; i++)
        setTimeout(() => playTone(880 + i*165, 0.15, "sine", 0.08+i*0.02), i*100);
      setTimeout(() => playChord([659,880,1047,1319,1568], 0.8, "sine", 0.10), 700);
      setTimeout(() => startBackgroundMusic("victory"), 1500);
      break;
    default:
      playSequence([
        { freq:523,  dur:0.2,  delay:0,    type:"triangle", vol:0.3,  chord:[523,659,784] },
        { freq:523,  dur:0.1,  delay:0.2,  type:"triangle", vol:0.25 },
        { freq:659,  dur:0.2,  delay:0.3,  type:"triangle", vol:0.3,  chord:[659,784,988] },
        { freq:784,  dur:0.2,  delay:0.5,  type:"triangle", vol:0.3 },
        { freq:1047, dur:0.3,  delay:0.7,  type:"sine",     vol:0.35, chord:[1047,1318,1568] },
        { freq:784,  dur:0.15, delay:1.0,  type:"sine",     vol:0.25 },
        { freq:1047, dur:0.15, delay:1.15, type:"sine",     vol:0.3 },
        { freq:1318, dur:0.5,  delay:1.3,  type:"sine",     vol:0.4,  chord:[1047,1318,1568] },
      ], 0.3);
      for (let i = 0; i < 12; i++)
        setTimeout(() => playTone(1500 + Math.random()*3000, 0.08, "sine", 0.04), 800 + i*100);
      playTone(130, 1.5, "sine", 0.15);
      setTimeout(() => playTone(164, 0.8, "sine", 0.12), 700);
      setTimeout(() => startBackgroundMusic("victory"), 2000);
  }
}

// ── Public API ─────────────────────────────────────────────

export const SoundEffects = {
  // Theme control
  setTheme: (id: string) => {
    activeTheme = id;
  },

  // Volume
  setMasterVolume: (v: number) => { masterVolume = Math.max(0, Math.min(1, v)); },
  setMusicVolume:  (v: number) => { musicVolume  = Math.max(0, Math.min(1, v)); },
  setSfxVolume:    (v: number) => { sfxVolume    = Math.max(0, Math.min(1, v)); },
  toggleMusic: (enabled?: boolean) => {
    musicEnabled = enabled ?? !musicEnabled;
    if (!musicEnabled) stopBackgroundMusic();
  },
  toggleSfx: (enabled?: boolean) => { sfxEnabled = enabled ?? !sfxEnabled; },

  // Music
  startMusic: startBackgroundMusic,
  stopMusic:  stopBackgroundMusic,

  // SFX
  lobbyPulse: () => {
    playTone(440, 0.2, "sine", 0.08);
    setTimeout(() => playTone(554, 0.2, "sine", 0.08), 120);
    setTimeout(() => playTone(659, 0.15, "sine", 0.06), 240);
  },

  gameStart:       themeGameStart,
  correct:         themeCorrect,
  wrong:           themeWrong,
  victory:         themeVictory,

  questionReveal: () => {
    playChord([330,415,523,659], 0.15, "square", 0.12);
    setTimeout(() => playChord([440,554,659,880], 0.25, "triangle", 0.15), 120);
    setTimeout(() => playWithEcho(660, 0.3, "sine", 0.12, 2), 250);
  },

  timerTick: () => {
    playTone(1200, 0.03, "square", 0.12);
    playTone(600,  0.05, "triangle", 0.08);
  },

  timerUrgent: () => {
    playTone(200, 0.08, "sine", 0.2);
    setTimeout(() => playTone(200, 0.06, "sine", 0.15), 80);
    setTimeout(() => playTone(1400, 0.05, "square", 0.18), 40);
  },

  timeUp: () => {
    playChord([150,200,300], 0.4, "sawtooth", 0.15);
    setTimeout(() => playChord([100,150,250], 0.5, "sawtooth", 0.12), 200);
    setTimeout(() => playTone(80, 0.3, "sine", 0.2), 400);
  },

  leaderboard: () => {
    for (let i = 0; i < 8; i++)
      setTimeout(() => playTone(150 + Math.random()*50, 0.04, "square", 0.1+i*0.02), i*50);
    setTimeout(() => playChord([392,493,587,784], 0.4, "triangle", 0.15), 450);
    setTimeout(() => playWithEcho(784, 0.5, "sine", 0.2, 3), 550);
  },

  playerJoin: () => {
    playTone(660, 0.1, "sine", 0.12);
    setTimeout(() => playTone(880,  0.12, "sine", 0.12), 60);
    setTimeout(() => playTone(1100, 0.15, "sine", 0.10), 140);
    setTimeout(() => playTone(1320, 0.08, "sine", 0.06), 220);
  },

  click: () => {
    playTone(1200, 0.025, "square", 0.08);
    playTone(600,  0.015, "triangle", 0.06);
    setTimeout(() => playTone(800, 0.02, "sine", 0.04), 20);
  },

  answerSelect: () => {
    playTone(500, 0.06, "triangle", 0.12);
    setTimeout(() => playTone(700, 0.08, "sine", 0.10), 40);
  },

  countdown: (num: number) => {
    const freq = num === 1 ? 880 : 660;
    playTone(freq, num === 1 ? 0.3 : 0.15, "triangle", 0.25);
    if (num === 1) setTimeout(() => playChord([880,1108,1320], 0.3, "sine", 0.12), 150);
  },

  streak: (count: number) => {
    const base = 600 + count * 100;
    playSequence([
      { freq: base,          dur:0.08, delay:0,    type:"sine" },
      { freq: base * 1.25,   dur:0.08, delay:0.06, type:"sine" },
      { freq: base * 1.5,    dur:0.15, delay:0.12, type:"triangle" },
    ], 0.2 + count * 0.03);
  },
};
