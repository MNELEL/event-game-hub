// Enhanced Web Audio API sound effects with richer tones and background music

let _audioCtx: AudioContext | null = null;
const audioCtx = () => {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') {
    _audioCtx.resume();
  }
  return _audioCtx;
};

// Master volume control
let masterVolume = 0.5;
let musicVolume = 0.3;
let sfxVolume = 0.5;
let musicEnabled = true;
let sfxEnabled = true;

// Background music state
let musicGainNode: GainNode | null = null;
let musicOscillators: OscillatorNode[] = [];
let musicInterval: ReturnType<typeof setInterval> | null = null;

function createGain(volume: number): GainNode {
  const ctx = audioCtx();
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume * masterVolume * sfxVolume, ctx.currentTime);
  return gain;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.3,
  detune = 0
) {
  if (!sfxEnabled) return;
  const ctx = audioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  osc.detune.setValueAtTime(detune, ctx.currentTime);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(frequency * 3, ctx.currentTime);

  const vol = volume * masterVolume * sfxVolume;
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

// Play chord (multiple frequencies at once) for richer sound
function playChord(
  frequencies: number[],
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.15
) {
  frequencies.forEach((freq, i) => {
    playTone(freq, duration, type, volume, i * 3);
  });
}

function playSequence(
  notes: { freq: number; dur: number; delay: number; type?: OscillatorType; vol?: number; chord?: number[] }[],
  volume = 0.25
) {
  notes.forEach(({ freq, dur, delay, type, vol, chord }) => {
    setTimeout(() => {
      if (chord) {
        playChord(chord, dur, type || "sine", (vol || volume) * 0.6);
      }
      playTone(freq, dur, type || "sine", vol || volume);
    }, delay * 1000);
  });
}

// Reverb-like effect using delayed echoes
function playWithEcho(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  volume = 0.3,
  echoCount = 3
) {
  playTone(freq, dur, type, volume);
  for (let i = 1; i <= echoCount; i++) {
    setTimeout(() => {
      playTone(freq, dur * 0.6, type, volume * Math.pow(0.4, i));
    }, i * 80);
  }
}

// ==================== BACKGROUND MUSIC ====================
function startBackgroundMusic(style: 'lobby' | 'game' | 'victory' = 'lobby') {
  stopBackgroundMusic();
  if (!musicEnabled) return;

  const ctx = audioCtx();
  musicGainNode = ctx.createGain();
  musicGainNode.gain.setValueAtTime(musicVolume * masterVolume * 0.15, ctx.currentTime);
  musicGainNode.connect(ctx.destination);

  const patterns: Record<string, { notes: number[][]; tempo: number; type: OscillatorType }> = {
    lobby: {
      // Gentle ambient arpeggios in C major
      notes: [
        [261, 329, 392],
        [293, 349, 440],
        [329, 392, 523],
        [293, 349, 440],
        [261, 329, 392],
        [246, 311, 369],
        [261, 329, 392],
        [293, 369, 440],
      ],
      tempo: 600,
      type: "sine",
    },
    game: {
      // Tense, pulsing pattern in minor
      notes: [
        [220, 261, 329],
        [233, 277, 349],
        [220, 261, 329],
        [196, 246, 293],
        [207, 261, 311],
        [220, 261, 329],
        [233, 293, 349],
        [220, 261, 329],
      ],
      tempo: 450,
      type: "triangle",
    },
    victory: {
      // Triumphant major pattern
      notes: [
        [329, 415, 523],
        [349, 440, 554],
        [392, 493, 587],
        [440, 554, 659],
        [392, 493, 587],
        [349, 440, 554],
        [392, 493, 587],
        [440, 554, 659],
      ],
      tempo: 500,
      type: "sine",
    },
  };

  const pattern = patterns[style];
  let step = 0;

  const playStep = () => {
    if (!musicGainNode) return;
    const chord = pattern.notes[step % pattern.notes.length];
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = pattern.type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.detune.setValueAtTime(Math.random() * 4 - 2, ctx.currentTime);

      const vol = musicVolume * masterVolume * 0.08;
      noteGain.gain.setValueAtTime(0.001, ctx.currentTime);
      noteGain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.1);
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + pattern.tempo / 1000 * 0.9);

      osc.connect(noteGain);
      noteGain.connect(musicGainNode!);
      osc.start();
      osc.stop(ctx.currentTime + pattern.tempo / 1000);
      musicOscillators.push(osc);
    });
    step++;
  };

  playStep();
  musicInterval = setInterval(playStep, pattern.tempo);
}

function stopBackgroundMusic() {
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
  musicOscillators.forEach(osc => {
    try { osc.stop(); } catch {}
  });
  musicOscillators = [];
  if (musicGainNode) {
    try {
      musicGainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx().currentTime + 0.3);
    } catch {}
    musicGainNode = null;
  }
}

// ==================== SOUND EFFECTS ====================
export const SoundEffects = {
  // Volume controls
  setMasterVolume: (v: number) => { masterVolume = Math.max(0, Math.min(1, v)); },
  setMusicVolume: (v: number) => { musicVolume = Math.max(0, Math.min(1, v)); },
  setSfxVolume: (v: number) => { sfxVolume = Math.max(0, Math.min(1, v)); },
  toggleMusic: (enabled?: boolean) => {
    musicEnabled = enabled ?? !musicEnabled;
    if (!musicEnabled) stopBackgroundMusic();
  },
  toggleSfx: (enabled?: boolean) => { sfxEnabled = enabled ?? !sfxEnabled; },

  // Background music
  startMusic: startBackgroundMusic,
  stopMusic: stopBackgroundMusic,

  // Lobby waiting - warm gentle arpeggio
  lobbyPulse: () => {
    playTone(440, 0.2, "sine", 0.08);
    setTimeout(() => playTone(554, 0.2, "sine", 0.08), 120);
    setTimeout(() => playTone(659, 0.15, "sine", 0.06), 240);
  },

  // Game start - epic ascending fanfare with harmonics
  gameStart: () => {
    stopBackgroundMusic();
    playSequence([
      { freq: 523, dur: 0.18, delay: 0, type: "triangle", chord: [523, 659, 784] },
      { freq: 587, dur: 0.18, delay: 0.15, type: "triangle", chord: [587, 740, 880] },
      { freq: 659, dur: 0.18, delay: 0.3, type: "triangle", chord: [659, 784, 988] },
      { freq: 784, dur: 0.25, delay: 0.45, type: "sine", chord: [784, 988, 1175] },
      { freq: 1047, dur: 0.5, delay: 0.65, type: "sine", vol: 0.4, chord: [1047, 1318, 1568] },
    ], 0.35);
    // Start game music after fanfare
    setTimeout(() => startBackgroundMusic('game'), 1200);
  },

  // Question reveal - dramatic orchestral hit
  questionReveal: () => {
    playChord([330, 415, 523, 659], 0.15, "square", 0.12);
    setTimeout(() => {
      playChord([440, 554, 659, 880], 0.25, "triangle", 0.15);
    }, 120);
    setTimeout(() => {
      playWithEcho(660, 0.3, "sine", 0.12, 2);
    }, 250);
  },

  // Timer tick - wooden knock sound
  timerTick: () => {
    playTone(1200, 0.03, "square", 0.12);
    playTone(600, 0.05, "triangle", 0.08);
  },

  // Timer urgent - rapid heartbeat-like pulse
  timerUrgent: () => {
    playTone(200, 0.08, "sine", 0.2);
    setTimeout(() => playTone(200, 0.06, "sine", 0.15), 80);
    setTimeout(() => playTone(1400, 0.05, "square", 0.18), 40);
  },

  // Time's up - dramatic buzzer with bass
  timeUp: () => {
    playChord([150, 200, 300], 0.4, "sawtooth", 0.15);
    setTimeout(() => playChord([100, 150, 250], 0.5, "sawtooth", 0.12), 200);
    setTimeout(() => playTone(80, 0.3, "sine", 0.2), 400);
  },

  // Correct answer - sparkling chime cascade
  correct: () => {
    playSequence([
      { freq: 523, dur: 0.1, delay: 0, type: "sine", chord: [523, 659] },
      { freq: 659, dur: 0.1, delay: 0.08, type: "sine", chord: [659, 784] },
      { freq: 784, dur: 0.1, delay: 0.16, type: "sine", chord: [784, 988] },
      { freq: 1047, dur: 0.1, delay: 0.24, type: "triangle" },
      { freq: 1318, dur: 0.15, delay: 0.32, type: "triangle" },
      { freq: 1568, dur: 0.4, delay: 0.4, type: "sine", vol: 0.35, chord: [1047, 1318, 1568] },
    ], 0.3);
    // Sparkle effect
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        playTone(2000 + Math.random() * 2000, 0.05, "sine", 0.06);
      }, 500 + i * 60);
    }
  },

  // Wrong answer - sad descending with dissonance
  wrong: () => {
    playSequence([
      { freq: 400, dur: 0.2, delay: 0, type: "sawtooth", chord: [400, 475] },
      { freq: 350, dur: 0.2, delay: 0.12, type: "sawtooth", chord: [350, 416] },
      { freq: 280, dur: 0.35, delay: 0.25, type: "sawtooth", chord: [280, 333] },
    ], 0.18);
    setTimeout(() => playTone(100, 0.3, "sine", 0.15), 400);
  },

  // Leaderboard reveal - dramatic drum roll + reveal
  leaderboard: () => {
    // Drum roll simulation
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        playTone(150 + Math.random() * 50, 0.04, "square", 0.1 + i * 0.02);
      }, i * 50);
    }
    // Reveal chord
    setTimeout(() => {
      playChord([392, 493, 587, 784], 0.4, "triangle", 0.15);
    }, 450);
    setTimeout(() => {
      playWithEcho(784, 0.5, "sine", 0.2, 3);
    }, 550);
  },

  // Victory fanfare - full orchestral celebration
  victory: () => {
    stopBackgroundMusic();
    // Trumpet-like fanfare
    playSequence([
      { freq: 523, dur: 0.2, delay: 0, type: "triangle", vol: 0.3, chord: [523, 659, 784] },
      { freq: 523, dur: 0.1, delay: 0.2, type: "triangle", vol: 0.25 },
      { freq: 659, dur: 0.2, delay: 0.3, type: "triangle", vol: 0.3, chord: [659, 784, 988] },
      { freq: 784, dur: 0.2, delay: 0.5, type: "triangle", vol: 0.3 },
      { freq: 1047, dur: 0.3, delay: 0.7, type: "sine", vol: 0.35, chord: [1047, 1318, 1568] },
      { freq: 784, dur: 0.15, delay: 1.0, type: "sine", vol: 0.25 },
      { freq: 1047, dur: 0.15, delay: 1.15, type: "sine", vol: 0.3 },
      { freq: 1318, dur: 0.5, delay: 1.3, type: "sine", vol: 0.4, chord: [1047, 1318, 1568] },
    ], 0.3);

    // Shimmering sparkles on top
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        playTone(1500 + Math.random() * 3000, 0.08, "sine", 0.04);
      }, 800 + i * 100);
    }

    // Bass foundation
    playTone(130, 1.5, "sine", 0.15);
    setTimeout(() => playTone(164, 0.8, "sine", 0.12), 700);

    // Start victory music loop
    setTimeout(() => startBackgroundMusic('victory'), 2000);
  },

  // Player joined - welcoming chime
  playerJoin: () => {
    playTone(660, 0.1, "sine", 0.12);
    setTimeout(() => playTone(880, 0.12, "sine", 0.12), 60);
    setTimeout(() => playTone(1100, 0.15, "sine", 0.1), 140);
    setTimeout(() => playTone(1320, 0.08, "sine", 0.06), 220);
  },

  // Button click - satisfying tactile click
  click: () => {
    playTone(1200, 0.025, "square", 0.08);
    playTone(600, 0.015, "triangle", 0.06);
    setTimeout(() => playTone(800, 0.02, "sine", 0.04), 20);
  },

  // Answer selected - confirmation pop
  answerSelect: () => {
    playTone(500, 0.06, "triangle", 0.12);
    setTimeout(() => playTone(700, 0.08, "sine", 0.1), 40);
  },

  // Countdown beep (3, 2, 1)
  countdown: (num: number) => {
    const freq = num === 1 ? 880 : 660;
    playTone(freq, num === 1 ? 0.3 : 0.15, "triangle", 0.25);
    if (num === 1) {
      setTimeout(() => playChord([880, 1108, 1320], 0.3, "sine", 0.12), 150);
    }
  },

  // Streak bonus sound
  streak: (count: number) => {
    const baseFreq = 600 + count * 100;
    playSequence([
      { freq: baseFreq, dur: 0.08, delay: 0, type: "sine" },
      { freq: baseFreq * 1.25, dur: 0.08, delay: 0.06, type: "sine" },
      { freq: baseFreq * 1.5, dur: 0.15, delay: 0.12, type: "triangle" },
    ], 0.2 + count * 0.03);
  },
};// bird chirp overlay
let forestBirdInterval: ReturnType<typeof setInterval> | null = null;
// Scifi: add occasional laser/blip overlay
let scifiBlipInterval: ReturnType<typeof setInterval> | null = null;

function stopOverlays() {
  if (forestBirdInterval) { clearInterval(forestBirdInterval); forestBirdInterval = null; }
  if (scifiBlipInterval)  { clearInterval(scifiBlipInterval);  scifiBlipInterval  = null; }
}

function startForestOverlay() {
  stopOverlays();
  forestBirdInterval = setInterval(() => {
    if (!musicEnabled) return;
    const vol = musicVolume * masterVolume * 0.12;
    // Random bird chirp: rapid ascending tones
    const base = [659, 784, 880, 1047, 1175, 1319][Math.floor(Math.random() * 6)];
    setTimeout(() => playTone(base,        0.06, "sine", vol), 0);
    setTimeout(() => playTone(base * 1.2,  0.05, "sine", vol * 0.8), 70);
    setTimeout(() => playTone(base * 1.35, 0.07, "sine", vol * 0.6), 130);
    if (Math.random() > 0.5) {
      setTimeout(() => playTone(base * 0.9, 0.08, "sine", vol * 0.5), 300);
    }
  }, 2200 + Math.random() * 3000);
}

function startScifiOverlay() {
  stopOverlays();
  scifiBlipInterval = setInterval(() => {
    if (!musicEnabled) return;
    const vol = musicVolume * masterVolume * 0.10;
    if (Math.random() > 0.5) {
      // Laser blip — fast descending
      playTone(880, 0.03, "square", vol);
      setTimeout(() => playTone(440, 0.02, "square", vol * 0.6), 40);
    } else {
      // Comm beep
      playTone(1200, 0.04, "sine", vol * 0.7);
      setTimeout(() => playTone(1200, 0.04, "sine", vol * 0.7), 120);
    }
  }, 1800 + Math.random() * 2500);
}

function startBackgroundMusic(style: MusicStyle = "lobby") {
  stopBackgroundMusic();
  if (!musicEnabled) return;

  musicStyle = style;
  const ctx = audioCtx();
  musicGainNode = ctx.createGain();
  musicGainNode.gain.setValueAtTime(0.001, ctx.currentTime);
  musicGainNode.connect(ctx.destination);

  // Pick config for current theme + style
  const themeKey = currentTheme in THEME_MUSIC ? currentTheme : "parchment";
  const cfg = THEME_MUSIC[themeKey][style];

  let step = 0;

  const playStep = () => {
    if (!musicGainNode) return;
    const chord = cfg.notes[step % cfg.notes.length];
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = cfg.type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.detune.setValueAtTime(Math.random() * 6 - 3, ctx.currentTime);
      const vol = cfg.baseVol * musicVolume * masterVolume;
      noteGain.gain.setValueAtTime(0.001, ctx.currentTime);
      noteGain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + cfg.tempo / 1000 * 0.92);
      osc.connect(noteGain);
      noteGain.connect(musicGainNode!);
      osc.start();
      osc.stop(ctx.currentTime + cfg.tempo / 1000);
      musicOscillators.push(osc);
    });
    step++;
  };

  // Fade in
  musicGainNode.gain.linearRampToValueAtTime(
    cfg.baseVol * musicVolume * masterVolume,
    ctx.currentTime + 1.5
  );

  playStep();
  musicInterval = setInterval(playStep, cfg.tempo);

  // Start theme-specific overlays
  if (currentTheme === "forest" && style !== "victory") startForestOverlay();
  if (currentTheme === "scifi"  && style !== "victory") startScifiOverlay();
}

function stopBackgroundMusic() {
  stopOverlays();
  if (musicInterval) { clearInterval(musicInterval); musicInterval = null; }
  musicOscillators.forEach(osc => { try { osc.stop(); } catch {} });
  musicOscillators = [];
  if (musicGainNode) {
    try {
      const ctx = audioCtx();
      musicGainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    } catch {}
    musicGainNode = null;
  }
}

// ── Theme-aware SFX ─────────────────────────────────────────

// Correct answer — varies by theme
function playCorrect() {
  if (!sfxEnabled) return;
  switch (currentTheme) {
    case "scifi":
      // Electronic ascending beep
      playSequence([
        { freq: 440, dur: 0.06, delay: 0,    type: "square"   },
        { freq: 660, dur: 0.06, delay: 0.07, type: "square"   },
        { freq: 880, dur: 0.08, delay: 0.14, type: "triangle" },
        { freq: 1320, dur: 0.2, delay: 0.22, type: "sine",  vol: 0.3 },
      ], 0.25);
      break;
    case "forest":
      // Happy bird trill
      playSequence([
        { freq: 784,  dur: 0.07, delay: 0,    type: "sine" },
        { freq: 988,  dur: 0.07, delay: 0.07, type: "sine" },
        { freq: 1175, dur: 0.07, delay: 0.14, type: "sine" },
        { freq: 1319, dur: 0.07, delay: 0.21, type: "sine" },
        { freq: 1568, dur: 0.2,  delay: 0.28, type: "sine", vol: 0.3 },
      ], 0.25);
      break;
    case "ocean":
      // Flowing wave chime
      playSequence([
        { freq: 523, dur: 0.12, delay: 0,    chord: [523, 659] },
        { freq: 659, dur: 0.12, delay: 0.1,  chord: [659, 784] },
        { freq: 880, dur: 0.25, delay: 0.22, chord: [880, 1109, 1319], vol: 0.3 },
      ], 0.22);
      break;
    case "dark":
      // Deep synth punch
      playTone(220, 0.1, "sawtooth", 0.2);
      setTimeout(() => playChord([440, 554, 659], 0.3, "triangle", 0.15), 100);
      break;
    case "medical":
      // Clean double-beep
      playTone(1047, 0.08, "sine", 0.18);
      setTimeout(() => playTone(1319, 0.12, "sine", 0.2), 120);
      break;
    default:
      // Classic sparkle cascade (parchment / sunset)
      playSequence([
        { freq: 523, dur: 0.1, delay: 0,    type: "sine", chord: [523, 659]        },
        { freq: 659, dur: 0.1, delay: 0.08, type: "sine", chord: [659, 784]        },
        { freq: 784, dur: 0.1, delay: 0.16, type: "sine", chord: [784, 988]        },
        { freq: 1047,dur: 0.1, delay: 0.24, type: "triangle"                       },
        { freq: 1318,dur: 0.4, delay: 0.32, type: "sine", vol: 0.35, chord: [1047, 1318, 1568] },
      ], 0.3);
  }
}

// Wrong answer — varies by theme
function playWrong() {
  if (!sfxEnabled) return;
  switch (currentTheme) {
    case "scifi":
      playTone(200, 0.15, "square", 0.18);
      setTimeout(() => playTone(150, 0.2, "square", 0.15), 100);
      setTimeout(() => playTone(100, 0.25, "sawtooth", 0.12), 200);
      break;
    case "forest":
      // Low hollow thud
      playTone(196, 0.15, "triangle", 0.18);
      setTimeout(() => playTone(164, 0.25, "triangle", 0.12), 120);
      break;
    case "ocean":
      // Descending wave wash
      playTone(294, 0.18, "sine", 0.15);
      setTimeout(() => playTone(247, 0.18, "sine", 0.12), 100);
      setTimeout(() => playTone(196, 0.3,  "sine", 0.10), 200);
      break;
    case "medical":
      playTone(330, 0.3, "sine", 0.2);
      setTimeout(() => playTone(294, 0.4, "sine", 0.15), 200);
      break;
    default:
      playSequence([
        { freq: 400, dur: 0.2, delay: 0,    type: "sawtooth", chord: [400, 475] },
        { freq: 350, dur: 0.2, delay: 0.12, type: "sawtooth", chord: [350, 416] },
        { freq: 280, dur: 0.35,delay: 0.25, type: "sawtooth", chord: [280, 333] },
      ], 0.18);
      setTimeout(() => playTone(100, 0.3, "sine", 0.15), 400);
  }
}

// Victory — varies by theme
function playVictory() {
  if (!sfxEnabled) return;
  stopBackgroundMusic();

  switch (currentTheme) {
    case "scifi":
      // Epic sci-fi fanfare
      playSequence([
        { freq: 220, dur: 0.15, delay: 0,   type: "sawtooth", vol: 0.25 },
        { freq: 330, dur: 0.15, delay: 0.15,type: "sawtooth", vol: 0.25 },
        { freq: 440, dur: 0.15, delay: 0.3, type: "triangle", vol: 0.3  },
        { freq: 660, dur: 0.25, delay: 0.45,type: "triangle", vol: 0.35, chord: [660, 880, 1100] },
        { freq: 880, dur: 0.5,  delay: 0.7, type: "sine",     vol: 0.4,  chord: [880, 1100, 1320] },
      ], 0.3);
      // Laser sparkles
      for (let i = 0; i < 8; i++) {
        setTimeout(() => playTone(1200 + Math.random() * 1600, 0.04, "square", 0.06), 800 + i * 120);
      }
      break;

    case "forest":
      // Forest celebration — birds going wild
      playSequence([
        { freq: 659,  dur: 0.1, delay: 0,    type: "sine" },
        { freq: 784,  dur: 0.1, delay: 0.08, type: "sine" },
        { freq: 988,  dur: 0.1, delay: 0.16, type: "sine" },
        { freq: 1175, dur: 0.1, delay: 0.24, type: "sine" },
        { freq: 1319, dur: 0.1, delay: 0.32, type: "sine" },
        { freq: 1568, dur: 0.4, delay: 0.4,  type: "sine", vol: 0.35, chord: [1047, 1319, 1568] },
      ], 0.3);
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          const b = [659,784,880,1047,1175,1319][Math.floor(Math.random()*6)];
          playTone(b, 0.06, "sine", 0.08 * musicVolume * masterVolume);
        }, 600 + i * 150);
      }
      break;

    case "ocean":
      playSequence([
        { freq: 392, dur: 0.2, delay: 0,   type: "sine", chord: [392, 494, 587] },
        { freq: 440, dur: 0.2, delay: 0.2, type: "sine", chord: [440, 554, 659] },
        { freq: 523, dur: 0.2, delay: 0.4, type: "sine", chord: [523, 659, 784] },
        { freq: 659, dur: 0.5, delay: 0.6, type: "sine", vol: 0.35, chord: [659, 831, 988] },
      ], 0.28);
      break;

    default:
      // Classic orchestral fanfare
      playSequence([
        { freq: 523, dur: 0.2,  delay: 0,   type: "triangle", vol: 0.3, chord: [523, 659, 784]  },
        { freq: 523, dur: 0.1,  delay: 0.2, type: "triangle", vol: 0.25 },
        { freq: 659, dur: 0.2,  delay: 0.3, type: "triangle", vol: 0.3, chord: [659, 784, 988]  },
        { freq: 784, dur: 0.2,  delay: 0.5, type: "triangle", vol: 0.3 },
        { freq: 1047,dur: 0.5,  delay: 0.7, type: "sine",     vol: 0.35, chord: [1047, 1318, 1568] },
      ], 0.3);
      for (let i = 0; i < 12; i++) {
        setTimeout(() => playTone(1500 + Math.random() * 3000, 0.08, "sine", 0.04), 800 + i * 100);
      }
  }
  setTimeout(() => startBackgroundMusic("victory"), 2000);
}

// ── SFX that don't vary much by theme ───────────────────────

function playGameStart() {
  stopBackgroundMusic();
  if (!sfxEnabled) return;
  if (currentTheme === "scifi") {
    // Engine charge-up
    playSequence([
      { freq: 80,  dur: 0.3, delay: 0,    type: "sawtooth", vol: 0.2 },
      { freq: 110, dur: 0.3, delay: 0.25, type: "sawtooth", vol: 0.22 },
      { freq: 165, dur: 0.3, delay: 0.5,  type: "triangle", vol: 0.25 },
      { freq: 220, dur: 0.25,delay: 0.75, type: "triangle", vol: 0.28 },
      { freq: 440, dur: 0.5, delay: 1.0,  type: "sine",     vol: 0.35, chord: [440, 550, 660] },
    ], 0.3);
  } else if (currentTheme === "forest") {
    playSequence([
      { freq: 523,  dur: 0.18, delay: 0,    type: "triangle", chord: [523, 659, 784]  },
      { freq: 659,  dur: 0.18, delay: 0.18, type: "triangle", chord: [659, 784, 988]  },
      { freq: 784,  dur: 0.3,  delay: 0.36, type: "sine",     chord: [784, 988, 1175], vol: 0.35 },
    ], 0.3);
  } else {
    playSequence([
      { freq: 523, dur: 0.18, delay: 0,    type: "triangle", chord: [523, 659, 784]  },
      { freq: 587, dur: 0.18, delay: 0.15, type: "triangle", chord: [587, 740, 880]  },
      { freq: 659, dur: 0.18, delay: 0.3,  type: "triangle", chord: [659, 784, 988]  },
      { freq: 784, dur: 0.25, delay: 0.45, type: "sine",     chord: [784, 988, 1175] },
      { freq: 1047,dur: 0.5,  delay: 0.65, type: "sine",     vol: 0.4, chord: [1047, 1318, 1568] },
    ], 0.35);
  }
  setTimeout(() => startBackgroundMusic("game"), 1300);
}

// ── Exported API ─────────────────────────────────────────────

export const SoundEffects = {
  // Volume
  setMasterVolume: (v: number) => { masterVolume = Math.max(0, Math.min(1, v)); },
  setMusicVolume:  (v: number) => { musicVolume  = Math.max(0, Math.min(1, v)); },
  setSfxVolume:    (v: number) => { sfxVolume    = Math.max(0, Math.min(1, v)); },
  toggleMusic: (enabled?: boolean) => {
    musicEnabled = enabled ?? !musicEnabled;
    if (!musicEnabled) stopBackgroundMusic();
  },
  toggleSfx: (enabled?: boolean) => { sfxEnabled = enabled ?? !sfxEnabled; },

  // Theme — call this whenever the theme changes
  setTheme: (themeId: string) => {
    currentTheme = themeId;
    // Restart current music with new theme's style
    if (musicInterval) {
      const style = musicStyle;
      stopBackgroundMusic();
      setTimeout(() => startBackgroundMusic(style), 300);
    }
  },

  // Music
  startMusic:  startBackgroundMusic,
  stopMusic:   stopBackgroundMusic,

  // Lobby pulse
  lobbyPulse: () => {
    if (currentTheme === "scifi") {
      playTone(110, 0.15, "sawtooth", 0.05 * musicVolume * masterVolume);
    } else if (currentTheme === "forest") {
      const chirp = [784, 880, 988, 1047][Math.floor(Math.random() * 4)];
      playTone(chirp, 0.08, "sine", 0.06 * musicVolume * masterVolume);
    } else {
      playTone(440, 0.2, "sine", 0.06 * musicVolume * masterVolume);
    }
  },

  gameStart:      playGameStart,
  correct:        playCorrect,
  wrong:          playWrong,
  victory:        playVictory,

  questionReveal: () => {
    if (!sfxEnabled) return;
    if (currentTheme === "scifi") {
      playTone(880, 0.05, "square", 0.15);
      setTimeout(() => playChord([440, 554, 659, 880], 0.2, "triangle", 0.12), 60);
    } else {
      playChord([330, 415, 523, 659], 0.15, "square", 0.12);
      setTimeout(() => playChord([440, 554, 659, 880], 0.25, "triangle", 0.15), 120);
      setTimeout(() => playWithEcho(660, 0.3, "sine", 0.12, 2), 250);
    }
  },

  timerTick: () => {
    if (!sfxEnabled) return;
    if (currentTheme === "scifi") {
      playTone(1400, 0.02, "square", 0.10);
    } else {
      playTone(1200, 0.03, "square", 0.12);
      playTone(600,  0.05, "triangle", 0.08);
    }
  },

  timerUrgent: () => {
    if (!sfxEnabled) return;
    playTone(200, 0.08, "sine", 0.2);
    setTimeout(() => playTone(200, 0.06, "sine", 0.15), 80);
    setTimeout(() => playTone(currentTheme === "scifi" ? 1800 : 1400, 0.05, "square", 0.18), 40);
  },

  timeUp: () => {
    if (!sfxEnabled) return;
    if (currentTheme === "scifi") {
      playChord([80, 120, 160], 0.5, "sawtooth", 0.14);
      setTimeout(() => playTone(60, 0.4, "sine", 0.18), 300);
    } else {
      playChord([150, 200, 300], 0.4, "sawtooth", 0.15);
      setTimeout(() => playChord([100, 150, 250], 0.5, "sawtooth", 0.12), 200);
      setTimeout(() => playTone(80, 0.3, "sine", 0.2), 400);
    }
  },

  leaderboard: () => {
    if (!sfxEnabled) return;
    for (let i = 0; i < 8; i++) {
      setTimeout(() => playTone(150 + Math.random() * 50, 0.04, "square", 0.1 + i * 0.02), i * 50);
    }
    setTimeout(() => playChord([392, 493, 587, 784], 0.4, "triangle", 0.15), 450);
    setTimeout(() => playWithEcho(784, 0.5, "sine", 0.2, 3), 550);
  },

  playerJoin: () => {
    if (!sfxEnabled) return;
    if (currentTheme === "scifi") {
      playTone(880, 0.05, "square", 0.1);
      setTimeout(() => playTone(1100, 0.08, "triangle", 0.1), 70);
      setTimeout(() => playTone(1320, 0.06, "sine",     0.08), 150);
    } else {
      playTone(660,  0.1,  "sine", 0.12);
      setTimeout(() => playTone(880,  0.12, "sine", 0.12), 60);
      setTimeout(() => playTone(1100, 0.15, "sine", 0.10), 140);
    }
  },

  click: () => {
    if (!sfxEnabled) return;
    if (currentTheme === "scifi") {
      playTone(1600, 0.02, "square", 0.07);
    } else {
      playTone(1200, 0.025, "square", 0.08);
      playTone(600,  0.015, "triangle", 0.06);
      setTimeout(() => playTone(800, 0.02, "sine", 0.04), 20);
    }
  },

  answerSelect: () => {
    if (!sfxEnabled) return;
    if (currentTheme === "scifi") {
      playTone(660, 0.04, "square",   0.1);
      setTimeout(() => playTone(880, 0.06, "triangle", 0.09), 40);
    } else {
      playTone(500, 0.06, "triangle", 0.12);
      setTimeout(() => playTone(700, 0.08, "sine", 0.1), 40);
    }
  },

  countdown: (num: number) => {
    if (!sfxEnabled) return;
    const freq = num === 1 ? 880 : 660;
    playTone(freq, num === 1 ? 0.3 : 0.15, "triangle", 0.25);
    if (num === 1) setTimeout(() => playChord([880, 1108, 1320], 0.3, "sine", 0.12), 150);
  },

  streak: (count: number) => {
    if (!sfxEnabled) return;
    const base = (currentTheme === "scifi" ? 440 : 600) + count * 80;
    playSequence([
      { freq: base,        dur: 0.08, delay: 0,    type: "sine" },
      { freq: base * 1.25, dur: 0.08, delay: 0.06, type: "sine" },
      { freq: base * 1.5,  dur: 0.15, delay: 0.12, type: "triangle" },
    ], 0.2 + count * 0.03);
  },
};
