// Full-body plush artwork is separate from the original printed-card assets.
const PLUSH_MOLES = new Set(['header', 'kimi', 'harper', 'eden', 'hailey', 'andrew', 'ian', 'kade', 'olivia', 'z', 'l', 'henry', 'aiden', 'sally']);

const UPDATED_ART = new Set(['z', 'l', 'header', 'henry', 'sally', 'andrew', 'aiden']);

export function battleArt(mole) {
  if (mole.id === 'olivia') return '../assets/cards/olivia-portrait.webp';
  if (mole.id === 'jacob') return '../assets/cards/jacob-portrait.webp';
  if (mole.id === 'harper') return '../assets/cards/harper-typing.webp';
  if (UPDATED_ART.has(mole.id)) return `../assets/fx/plush/${mole.id}-idle.webp`;
  return PLUSH_MOLES.has(mole.id)
    ? `../assets/moles/plush/${mole.id}.png`
    : `../${mole.image}`;
}
