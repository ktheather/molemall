// One clock per side. A rest turn adds a second independently rolled poison hit.
export const LOUIS_DOMINANCE_THRESHOLD = 9;
export const LOUIS_POISON_ATTACK = 30;
export const startLouisPoison = () => ({ rest: 2, poison: 3 });

export function tickLouisPoison(state, rng = Math.random) {
  const { rest = 0, poison = 0 } = state ?? {};
  const resting = rest > 0;
  const count = poison > 0 ? (resting ? 2 : 1) : 0;
  return {
    next: { rest: Math.max(0, rest - 1), poison: Math.max(0, poison - 1) },
    resting,
    hits: Array.from({ length: count }, () => 5 + Math.floor(rng() * 6)),
  };
}
