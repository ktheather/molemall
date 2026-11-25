/** Aiden special: two dice sum >=10, attack stat 30, then 3 future turns of 2-5 damage. */
export const AIDEN_SPECIAL_SUM = 10;
export const AIDEN_SPECIAL_ATTACK = 30;
export const AIDEN_DOT_TURNS = 3;
export const AIDEN_HEAL = 14;
export function isAidenJellyfishRoll(card, d1, d2) {
  return card?.id === 'aiden' && Number.isInteger(d1) && Number.isInteger(d2) && d1 + d2 >= AIDEN_SPECIAL_SUM;
}
export function aidenHealAmount(card, currentHp, maxHp) {
  return card?.id === 'aiden' && Number.isFinite(currentHp) && Number.isFinite(maxHp) && maxHp > 0 && currentHp <= maxHp / 2
    ? Math.max(0, Math.min(AIDEN_HEAL, maxHp - currentHp)) : 0;
}
export function tickAidenJellyfish(remaining, rng = Math.random) {
  if (!Number.isInteger(remaining) || remaining <= 0) return { damage: 0, remaining: 0 };
  const roll = Math.min(0.999999999, Math.max(0, Number(rng())));
  return { damage: 2 + Math.floor(roll * 4), remaining: remaining - 1 };
}
