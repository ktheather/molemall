// Full-body plush artwork is separate from the original printed-card assets.
const PLUSH_MOLES = new Set(['header', 'kimi', 'harper', 'eden', 'hailey', 'andrew', 'ian', 'kade', 'olivia', 'z', 'l', 'henry', 'aiden', 'sally']);

export function battleArt(mole) {
  return PLUSH_MOLES.has(mole.id)
    ? `../assets/moles/plush/${mole.id}.png`
    : `../${mole.image}`;
}
