// Full-body plush artwork is separate from the original printed-card assets.
const PLUSH_MOLES = new Set(['header', 'kimi', 'harper', 'eden', 'hailey', 'andrew', 'ian', 'kade', 'olivia', 'z', 'l', 'henry', 'aiden', 'sally']);

export function battleArt(mole) {
  if (mole.id === 'l' && mole.level) return '../assets/fx/plush/l-idle.webp';
  if (mole.id === 'jacob' || PLUSH_MOLES.has(mole.id)) return `../assets/moles/roster/${mole.id}.webp`;
  return `../${mole.image}`;
}
