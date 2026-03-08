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
};