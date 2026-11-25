// 두더지몰 핵심 규칙 (UI 없음 — 순수 계산)
import { effectiveStats } from './effects.js';

export const rollDie = () => 1 + Math.floor(Math.random() * 6);

// 주사위 2개로 얻는 보정 효과
//  - 더블(같은 눈)      → 공격력 ×2
//  - 합이 10           → 지배력 ×2
//  - 곱이 6 또는 16     → 공감력 ×2
export function diceBonus(d1, d2) {
  const sum = d1 + d2, product = d1 * d2;
  return {
    sum, product,
    attackMul:    d1 === d2 ? 2 : 1,
    dominanceMul: sum === 10 ? 2 : 1,
    empathyMul:   product === 6 || product === 16 ? 2 : 1,
  };
}

// attacker 가 주사위 d1, d2 를 굴려 defender 를 공격
// 유효 공격력 = (attacker.attack + 주사위합) × 공격배율 − defender.dominance
// 유효 방어력 = defender.defense − attacker.empathy × 공감배율
// 데미지     = max(0, 유효 공격력 − 유효 방어력)
// ※ 지배력 배율은 공격자 자신의 지배력에 적용되며, 상대가 나를 칠 때 상대 공격력을 깎는 데 쓰인다.
// opts: { lastOpponentDiceSum } — 직전 턴에 상대가 굴린 주사위 합 (앤드류 같은 효과용)
export function resolveAttack(attacker, defender, d1, d2, defenderBonus = null, opts = {}) {
  const b = diceBonus(d1, d2);
  // 카드 특이사항(숨김 효과): 상대에 따라 능력치가 바뀐다
  const ctx = { d1, d2, lastOpponentDiceSum: opts.lastOpponentDiceSum };
  const A = effectiveStats(attacker, defender, ctx), D = effectiveStats(defender, attacker);
  if (Number.isFinite(opts.forceAttackStat)) A.stats.attack = Math.max(0,opts.forceAttackStat);
  const defDominance = D.stats.dominance * (defenderBonus?.dominanceMul ?? 1);
  const rawAttack  = (A.stats.attack + b.sum) * b.attackMul;
  const effAttack  = Math.max(0, rawAttack - defDominance);
  const effEmpathy = A.stats.empathy * b.empathyMul;
  const effDefense = Math.max(0, D.stats.defense - effEmpathy);
  const damage     = Math.max(0, effAttack - effDefense);
  return {
    ...b, rawAttack, defDominance, effAttack, effEmpathy, effDefense, damage,
    attackerStats: A.stats, defenderStats: D.stats,
    triggered: [...A.triggered.map(t => ({ ...t, who: 'attacker' })), ...D.triggered.map(t => ({ ...t, who: 'defender' }))],
  };
}
