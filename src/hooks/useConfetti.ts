import confetti from "canvas-confetti";

export function fireConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#7C5CFC"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#7C5CFC"],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

export function fireCorrectBurst() {
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#4ECDC4", "#FFD700", "#7C5CFC"],
  });
}
