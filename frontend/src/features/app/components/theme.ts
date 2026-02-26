// ─── Crusties — Design tokens & shared style constants ───────────────────────

/** Color palette */
export const C = {
  cream:    '#FFFDF7',
  orange:   '#E85D04',
  orangeD:  '#C44900',
  orangeL:  '#FFF3E0',
  yellow:   '#FFD166',
  red:      '#E63946',
  green:    '#2D6A4F',
  greenL:   '#d4edda',
  charcoal: '#1D1D1D',
  muted:    '#6B7280',
  crust:    '#8B5E3C',
  border:   'rgba(232,93,4,0.18)',
} as const;

/** Font families */
export const F = {
  display: "'Luckiest Guy', cursive",
  body:    "'Luckiest Guy', cursive",
} as const;

/** Red/white checkerboard tablecloth SVG background */
export const CHECKER_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Crect width='28' height='28' fill='%23fff'/%3E%3Crect x='0' y='0' width='14' height='14' fill='%23E63946' opacity='0.13'/%3E%3Crect x='14' y='14' width='14' height='14' fill='%23E63946' opacity='0.13'/%3E%3C/svg%3E")`;

/** Google Fonts import — Luckiest Guy */
export const FONT_FACES = `
  @import url('https://fonts.googleapis.com/css2?family=Luckiest+Guy&display=swap');
  * { box-sizing: border-box; }
`;

/** CSS keyframe animations */
export const ANIM_STYLES = `
  @keyframes float-pizza {
    0%,100% { transform: translateY(0px) rotate(-2deg); }
    50%     { transform: translateY(-14px) rotate(2.5deg); }
  }
  @keyframes wobble {
    0%,100% { transform: rotate(-2deg) scale(1); }
    40%     { transform: rotate(3.5deg) scale(1.05); }
  }
  @keyframes bounce-in {
    0%   { transform: scale(0.5) rotate(-10deg); opacity: 0; }
    60%  { transform: scale(1.08) rotate(2deg);  opacity: 1; }
    100% { transform: scale(1)    rotate(0deg); }
  }
  @keyframes slide-up {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes pulse-dot {
    0%,100% { transform: scale(1);   opacity: 0.5; }
    50%     { transform: scale(1.6); opacity: 1;   }
  }
  @keyframes confetti-fall {
    0%   { transform: translateY(-30px) rotate(0deg);   opacity: 0; }
    8%   { opacity: 1; }
    92%  { opacity: 1; }
    100% { transform: translateY(260px) rotate(600deg); opacity: 0; }
  }
  @keyframes sizzle {
    0%,100% { letter-spacing: -0.5px; }
    50%     { letter-spacing: 0.5px; }
  }
  @keyframes pop-in {
    0%   { transform: scale(0); opacity: 0; }
    70%  { transform: scale(1.12); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes crustie-reveal {
    0%   { transform: scale(0.3) rotate(-15deg); opacity: 0; filter: blur(12px); }
    55%  { transform: scale(1.12) rotate(3deg);  opacity: 1; filter: blur(0px);  }
    75%  { transform: scale(0.96) rotate(-1deg); }
    100% { transform: scale(1)    rotate(0deg);  }
  }
  @keyframes stamp-in {
    0%   { transform: scale(2.5) rotate(-8deg); opacity: 0; }
    60%  { transform: scale(0.9) rotate(2deg);  opacity: 1; }
    100% { transform: scale(1)   rotate(-1.5deg); }
  }
  @keyframes glow-pulse {
    0%,100% { opacity: 0.5; transform: scale(1); }
    50%     { opacity: 1;   transform: scale(1.06); }
  }
  @keyframes confetti-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes fade-up {
    from { transform: translateY(16px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
`;

/** Rarity tier color schemes */
export const RARITY_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  Common:    { bg: '#f5f0e8', border: '#d4b896', text: '#7a5c3a', dot: '#b08050' },
  Uncommon:  { bg: '#edf7f0', border: '#6dbf82', text: '#2d6a4f', dot: '#2d6a4f' },
  Rare:      { bg: '#edf2ff', border: '#7aacf7', text: '#1a4fa0', dot: '#3b82f6' },
  Epic:      { bg: '#f3edff', border: '#b08cf5', text: '#5b21b6', dot: '#a855f7' },
  Legendary: { bg: '#fff8e6', border: '#f59e0b', text: '#b45309', dot: '#f59e0b' },
};
