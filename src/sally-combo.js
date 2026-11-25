/** Sally: one action consists of 2-6 randomly partitioned hits totaling exactly 6.
 * Four or more hits trigger ONE extra diamond strike of 6.
 * Each hit is direct HP damage; do not apply dice/defense per fragment, or the total changes.
 */
export const SALLY_BASE_DAMAGE = 6;
export const SALLY_DIAMOND_DAMAGE = 6;
export const SALLY_MIN_HITS = 2;
export const SALLY_MAX_HITS = 6;

function unit(rng) {
  const x = Number(rng());
  return Number.isFinite(x) ? Math.max(0, Math.min(0.999999999999, x)) : 0;
}

export function sallyAttackSequence(rng = Math.random) {
  const count = SALLY_MIN_HITS + Math.floor(unit(rng) * (SALLY_MAX_HITS - SALLY_MIN_HITS + 1));
  // Randomly choose count-1 distinct cut positions among 1..5.
  const cuts = [1,2,3,4,5];
  for(let i=0;i<count-1;i++) {
    const j=i+Math.floor(unit(rng)*(cuts.length-i));
    [cuts[i],cuts[j]]=[cuts[j],cuts[i]];
  }
  const boundaries=[0,...cuts.slice(0,count-1).sort((a,b)=>a-b),SALLY_BASE_DAMAGE];
  const hits=boundaries.slice(1).map((edge,i)=>edge-boundaries[i]);
  return { hits, hitCount:count, baseDamage:SALLY_BASE_DAMAGE, diamondDamage: count>=4 ? SALLY_DIAMOND_DAMAGE : 0, totalDamage:SALLY_BASE_DAMAGE+(count>=4?SALLY_DIAMOND_DAMAGE:0) };
}
