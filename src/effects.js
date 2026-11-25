// 카드 특이사항(숨김 효과) — cards.json 의 effects 배열을 해석한다
//
// 조건부 능력치:
//   { "when": { "opponentNamePrefix": "CEP" }, "set": { "defense": 2 } }
//   { "when": { "opponentNameIn": ["에이든", "션"] }, "set": { "dominance": 10 } }
//   { "when": { "opponentStat": { "empathy": { "lte": 2 } } }, "set": { "attack": 10, "defense": 5 } }
//   { "when": { "diceSum": 12 }, "set": { "attack": 30 } }
//   { "when": { "opponentTag": "임원" }, "mul": { "attack": 2 }, "set": { "defense": 10 } }
//   { "when": { "opponentNameLength": 3 }, "set": { "attack": 15 } }
//   { "when": { "diceSumEqualsLastOpponent": true }, "set": { "attack": 20 } }
//   opponentTag 는 상대 카드의 tags 배열에 그 태그가 있으면 발동.
//   opponentNameLength 는 상대 카드 이름의 글자 수.
//   diceSumEqualsLastOpponent 는 내가 이번에 굴린 주사위 합 == 직전 턴에 상대가 굴린 주사위 합 (공격 시에만).
//   opponentStat 은 상대의 기본 능력치와 비교 (lt / lte / gt / gte / eq).
//   diceSum 은 공격자가 굴린 주사위 합 (공격할 때만 판정, 방어 중에는 적용 안 됨).
//   opponentNamePrefix 가 한글 자음 1글자(ㄱ~ㅎ)면 상대 이름 첫 글자의 초성을 비교, 그 외에는 접두어 비교(대소문자 무시).
//   opponentNameIn 은 목록 중 하나와 접두어 일치하면 된다.
//   연산 순서: set → add → mul. 효과는 배열 순서대로 적용되므로 뒤에 오는 것이 앞을 덮는다.
//
// 확률 발동 (공격 후 판정):
//   { "onAttack": { "chance": 0.06, "proc": "rollOpponentDie" } }
//   → 6% 확률로, 다음 턴 상대의 주사위 2개 중 하나를 이 카드 쪽에서 대신 굴린다.
//
// 공격 제한:
//   { "attackRequires": { "diceSum": 6 } }   → 주사위 합이 6일 때만 공격이 성립. 아니면 불발(데미지 0)
//   { "onDoubles": "skipTurn" }              → 더블이면 공격 불발 + 다음 자기 턴을 쉰다 (기본 더블 보너스 무시)
//   { "onDoubles": "tripleAttack" }          → 더블이면 3연속 공격 (2·3타는 주사위를 새로 굴린다)

const CHOSEONG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

export function choseong(ch) {
  const code = ch.charCodeAt(0);
  if (code >= 0xAC00 && code <= 0xD7A3) return CHOSEONG[Math.floor((code - 0xAC00) / 588)];
  if (CHOSEONG.includes(ch)) return ch; // 이미 자음 하나
  return null;
}

export function namePrefixMatches(name, prefix) {
  if (!name || !prefix) return false;
  if (prefix.length === 1 && CHOSEONG.includes(prefix)) return choseong(name[0]) === prefix;
  return name.toLowerCase().startsWith(prefix.toLowerCase());
}

function conditionMet(when, opponent, ctx) {
  if (!when) return true;
  if (when.diceSum !== undefined && (ctx?.d1 === undefined || ctx.d1 + ctx.d2 !== when.diceSum)) return false;
  if (when.diceSumMin !== undefined && (ctx?.d1 === undefined || ctx.d1 + ctx.d2 < when.diceSumMin)) return false;
  if (when.opponentNameLength !== undefined && (opponent?.name ?? '').length !== when.opponentNameLength) return false;
  if (when.diceSumEqualsLastOpponent) {
    if (ctx?.d1 === undefined || ctx.lastOpponentDiceSum === undefined || ctx.lastOpponentDiceSum === null) return false;
    if (ctx.d1 + ctx.d2 !== ctx.lastOpponentDiceSum) return false;
  }
  if (when.opponentNamePrefix !== undefined && !namePrefixMatches(opponent?.name, when.opponentNamePrefix)) return false;
  if (when.opponentNotNamePrefix !== undefined && namePrefixMatches(opponent?.name, when.opponentNotNamePrefix)) return false;
  if (when.opponentNameIn !== undefined && !when.opponentNameIn.some(n => namePrefixMatches(opponent?.name, n))) return false;
  if (when.opponentTag !== undefined && !(opponent?.tags ?? []).includes(when.opponentTag)) return false;
  if (when.opponentStat !== undefined) {
    for (const [stat, cmp] of Object.entries(when.opponentStat)) {
      const v = opponent?.stats?.[stat];
      if (v === undefined) return false;
      if (cmp.lt  !== undefined && !(v <  cmp.lt))  return false;
      if (cmp.lte !== undefined && !(v <= cmp.lte)) return false;
      if (cmp.gt  !== undefined && !(v >  cmp.gt))  return false;
      if (cmp.gte !== undefined && !(v >= cmp.gte)) return false;
      if (cmp.eq  !== undefined && !(v === cmp.eq)) return false;
    }
  }
  return true;
}

// card 가 opponent 를 상대할 때의 실제 능력치와, 발동된 효과 목록을 돌려준다
// ctx: { d1, d2 } — 이 카드가 공격자일 때 굴린 주사위 (주사위 조건 효과용)
export function effectiveStats(card, opponent, ctx = null) {
  const stats = { ...card.stats };
  const triggered = [];
  for (const fx of card.effects ?? []) {
    if (!fx.set && !fx.add && !fx.mul) continue;
    if (!conditionMet(fx.when, opponent, ctx)) continue;
    for (const [k, v] of Object.entries(fx.set ?? {})) {
      if (stats[k] !== v) triggered.push({ stat: k, from: stats[k], to: v });
      stats[k] = v;
    }
    for (const [k, v] of Object.entries(fx.add ?? {})) {
      triggered.push({ stat: k, from: stats[k], to: stats[k] + v });
      stats[k] += v;
    }
    for (const [k, v] of Object.entries(fx.mul ?? {})) {
      triggered.push({ stat: k, from: stats[k], to: stats[k] * v });
      stats[k] *= v;
    }
  }
  return { stats, triggered };
}

// 주사위를 굴린 뒤 이 카드의 공격이 성립하는지 판정
// → { ok: true } | { ok: false, reason, skipTurn }
export function checkAttack(card, d1, d2) {
  for (const fx of card.effects ?? []) {
    if (fx.onDoubles === 'skipTurn' && d1 === d2)
      return { ok: false, reason: `${card.name}은(는) 더블이 나와 멍하니 서 있다… 한 턴 쉰다.`, skipTurn: true };
  }
  for (const fx of card.effects ?? []) {
    const req = fx.attackRequires;
    if (req?.diceSumMin !== undefined && d1 + d2 < req.diceSumMin)
      return { ok: false, reason: `${card.name}은(는) 주사위 합이 ${req.diceSumMin} 이상일 때만 공격한다. (${d1}+${d2}=${d1 + d2}) 공격 불발!`, skipTurn: false };
    if (req?.diceSum !== undefined && d1 + d2 !== req.diceSum)
      return { ok: false, reason: `${card.name}은(는) 주사위 합이 ${req.diceSum}일 때만 공격한다. (${d1}+${d2}=${d1 + d2}) 공격 불발!`, skipTurn: false };
  }
  return { ok: true };
}

// 주사위 결과에 따라 이 카드가 몇 번 공격하는지 (기본 1)
export function attackCount(card, d1, d2) {
  for (const fx of card.effects ?? []) {
    if (fx.onDoubles === 'tripleAttack' && d1 === d2) return 3;
  }
  return 1;
}

// 공격을 마친 뒤 확률 효과를 판정한다 → 발동된 proc 이름 배열
export function rollProcs(card, rng = Math.random) {
  const out = [];
  for (const fx of card.effects ?? []) {
    const oa = fx.onAttack;
    if (!oa?.proc) continue;
    if (rng() < (oa.chance ?? 1)) out.push(oa.proc);
  }
  return out;
}

// 주사위 2개 중 하나를 상대(효과를 건 쪽)가 대신 굴린다 → { d1, d2, index, from, to }
export function rollOneDieFor(d1, d2, rng = Math.random) {
  const index = rng() < 0.5 ? 0 : 1;
  const to = 1 + Math.floor(rng() * 6);
  const from = index === 0 ? d1 : d2;
  return { d1: index === 0 ? to : d1, d2: index === 1 ? to : d2, index, from, to };
}

// Special summon: Z's 1+1, 2+2, or 3+3 dice call in the real Header card.
// The cameo uses Header's existing attack formula; it does not invent damage.
export function matchingDiceSummon(card, d1, d2) {
  if (d1 !== d2) return null;
  for (const fx of card?.effects ?? []) {
    const special=fx.onMatchingDiceSummon;
    if (special?.cardId && d1+d2 <= special.maxSum) return special.cardId;
  }
  return null;
}
