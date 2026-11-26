import { AIDEN_DOT_TURNS, isAidenJellyfishRoll, tickAidenJellyfish } from './aiden-jellyfish.js?v=four-turns';
// 두더지몰 본 게임: 2인 카드 배틀 — 순수 상태 머신 (네트워크/UI 없음)
// 호스트가 이 함수들로 상태를 갱신하고, 결과 상태를 게스트에게 그대로 보낸다.
import { diceBonus, resolveAttack } from './rules.js?v=louis-20261126';
import { startLouisPoison, tickLouisPoison } from './louis-poison.js';
import { sallyAttackSequence } from './sally-combo.js';
import { checkAttack, attackCount, rollProcs, rollOneDieFor, matchingDiceSummon } from './effects.js?v=zl-henry-final-20261124';

export const DEN_HP = 500;
export const START_COINS = 5;
export const START_HAND = 2;
export const DRAW_PER_TURN = 1;    // 턴이 오면 반드시 1장 뽑은 뒤에야 공격 가능
export const HAND_LIMIT = 6;       // 넘으면 공격 전에 반드시 버려야 한다 (어느 카드를 버릴지는 선택, 버린 카드는 더미로)
export const COST = { pick: 5, mulligan: 1, steal: 2 };

const rollDie = rng => 1 + Math.floor(rng() * 6);
const pickIndex = (rng, n) => Math.floor(rng() * n);

export function createGame(cards, names = ['P1', 'P2']) {
  return {
    phase: 'order',            // order → play → over
    cards: Object.fromEntries(cards.map(c => [c.id, c])),
    pool: cards.map(c => c.id),
    players: [0, 1].map(i => ({
      name: names[i], hp: DEN_HP, coins: START_COINS, hand: [], active: null, orderDie: null, skipTurn: false, lastDiceSum: null, dieRolledBy: null, henryAttackLock: false, louisPoison: null, aidenShockTurns: 0,
    })),
    turn: null,                // 현재 턴 플레이어 index
    turnPhase: null,           // 'draw' → 'act'
    drawnThisTurn: [],         // 이번 턴에 뽑은 카드 id 들 (1코인 무르기 대상)
    lastDice: null,
    lastAttack: null,
    winner: null,
    log: [],
  };
}

const log = (s, msg) => { s.log.unshift(msg); if (s.log.length > 60) s.log.pop(); };
const other = p => 1 - p;
const fail = (s, msg) => ({ ok: false, error: msg, state: s });
const ok = s => ({ ok: true, state: s });

function drawRandom(s, p, rng, exclude = null) {
  const candidates = s.pool.filter(id => id !== exclude);
  if (candidates.length === 0) return null;
  const id = candidates[pickIndex(rng, candidates.length)];
  s.pool.splice(s.pool.indexOf(id), 1);
  s.players[p].hand.push(id);
  return id;
}

function startPlay(s, first, rng) {
  s.phase = 'play';
  for (const p of [0, 1]) {
    for (let i = 0; i < START_HAND; i++) drawRandom(s, p, rng);
    s.players[p].active = s.players[p].hand[0] ?? null;
  }
  s.turn = first;
  s.turnPhase = 'draw';
  log(s, `🎲 선공: <b>${s.players[first].name}</b>. 각자 카드 ${START_HAND}장을 받았다.`);
}

function applyOngoingDamage(s, player, rng) {
  const me = s.players[player], op = s.players[other(player)];
  const poison = tickLouisPoison(me.louisPoison, rng);
  me.louisPoison = poison.next;
  for (const damage of poison.hits) {
    if (op.hp <= 0) break;
    op.hp = Math.max(0, op.hp - damage);
    log(s, `<span class="fx">☠️ 루이스 중독 · ${op.name}의 굴에 ${damage} 피해</span>`);
  }
  const shock = tickAidenJellyfish(me.aidenShockTurns, rng);
  me.aidenShockTurns = shock.remaining;
  if (op.hp > 0 && shock.damage) {
    op.hp = Math.max(0, op.hp - shock.damage);
    log(s, `<span class="fx">⚡ 해파리 지속 감전 · ${op.name}의 굴에 ${shock.damage} 피해 (남은 ${shock.remaining}턴)</span>`);
  }
  if (op.hp <= 0) {
    s.phase = 'over'; s.winner = player;
    s.lastAttack = null;
    log(s, `🏆 <b>${me.name}</b> 승리! 지속 피해로 ${op.name}의 굴이 무너졌다.`);
  }
  return poison.resting;
}

function endTurn(s, rng) {
  const next = other(s.turn);
  if (s.players[next].skipTurn) {          // 카드 효과로 한 턴 쉼 → 지금 플레이어가 한 번 더
    s.players[next].skipTurn = false;
    applyOngoingDamage(s, next, rng);
    if (s.phase === 'over') return;
    log(s, `💤 ${s.players[next].name}은(는) 이번 턴을 쉰다. ${s.players[s.turn].name}이(가) 한 번 더!`);
  } else s.turn = next;
  s.turnPhase = 'draw';
  s.drawnThisTurn = [];
}

// 상대의 앞에 나온 두더지. 없으면 방어 0 취급
function defenderCard(s, p) {
  const id = s.players[p].active;
  return id ? s.cards[id] : { name: '(빈 자리)', stats: { attack: 0, defense: 0, dominance: 0, empathy: 0 } };
}

// action: { type, player, ...payload }   rng: () => [0,1)
export function applyAction(state, action, rng = Math.random) {
  const s = structuredClone(state);
  const p = action.player;
  const me = s.players[p], op = s.players[other(p)];
  if (p !== 0 && p !== 1) return fail(s, '잘못된 플레이어');

  switch (action.type) {
    case 'ROLL_ORDER': {
      if (s.phase !== 'order') return fail(s, '순서 정하기 단계가 아님');
      if (me.orderDie !== null) return fail(s, '이미 굴렸음');
      me.orderDie = rollDie(rng);
      log(s, `🎲 ${me.name} 순서 주사위: <b>${me.orderDie}</b>`);
      const [a, b] = s.players.map(x => x.orderDie);
      if (a !== null && b !== null) {
        if (a === b) { s.players.forEach(x => x.orderDie = null); log(s, '동점! 다시 굴린다.'); }
        else startPlay(s, a > b ? 0 : 1, rng);
      }
      return ok(s);
    }
  }

  if (s.phase !== 'play') return fail(s, '게임 진행 중이 아님');
  if (s.turn !== p) return fail(s, '내 턴이 아님');

  switch (action.type) {
    case 'DRAW': {
      if (s.turnPhase !== 'draw') return fail(s, '이미 뽑았음');
      const drawn = [];
      for (let i = 0; i < DRAW_PER_TURN; i++) { const id = drawRandom(s, p, rng); if (id) drawn.push(id); }
      s.drawnThisTurn = drawn;
      s.turnPhase = 'act';
      log(s, drawn.length ? `🃏 ${me.name}이(가) 카드 ${drawn.length}장을 뽑았다.` : `🃏 카드 더미가 비어 ${me.name}은(는) 뽑지 못했다.`);
      return ok(s);
    }
    case 'PICK': { // 5코인: 이번 턴 뽑을 카드 중 1장을 직접 고르고, 나머지는 랜덤
      if (s.turnPhase !== 'draw') return fail(s, '이미 뽑았음');
      if (me.coins < COST.pick) return fail(s, '코인 부족');
      if (!s.pool.includes(action.cardId)) return fail(s, '더미에 없는 카드');
      me.coins -= COST.pick;
      s.pool.splice(s.pool.indexOf(action.cardId), 1);
      me.hand.push(action.cardId);
      const drawn = [action.cardId];
      for (let i = 1; i < DRAW_PER_TURN; i++) { const id = drawRandom(s, p, rng); if (id) drawn.push(id); }
      s.drawnThisTurn = drawn;
      s.turnPhase = 'act';
      log(s, `💰 ${me.name}이(가) 코인 ${COST.pick}개로 <b>${s.cards[action.cardId].name}</b>을(를) 골라 뽑았다.${drawn.length > 1 ? ` (+랜덤 ${drawn.length - 1}장)` : ''}`);
      return ok(s);
    }
    case 'MULLIGAN': { // 1코인: 이번 턴에 뽑은 카드 1장을 되돌리고 새로 뽑기
      const back = action.cardId;
      if (s.turnPhase !== 'act' || !s.drawnThisTurn.includes(back)) return fail(s, '이번 턴에 뽑은 카드만 되돌릴 수 있음');
      if (me.coins < COST.mulligan) return fail(s, '코인 부족');
      me.coins -= COST.mulligan;
      me.hand.splice(me.hand.indexOf(back), 1);
      s.drawnThisTurn.splice(s.drawnThisTurn.indexOf(back), 1);
      s.pool.push(back);
      const id = drawRandom(s, p, rng, back);
      if (id) s.drawnThisTurn.push(id);
      log(s, `↩️ ${me.name}이(가) 코인 ${COST.mulligan}개로 <b>${s.cards[back].name}</b>을(를) 되돌리고 새 카드를 뽑았다.`);
      return ok(s);
    }
    case 'DISCARD': { // 손패가 HAND_LIMIT 을 넘을 때 버리기 → 더미로 돌아간다
      if (s.turnPhase !== 'act') return fail(s, '먼저 카드를 뽑아야 함');
      if (me.hand.length <= HAND_LIMIT) return fail(s, `손패가 ${HAND_LIMIT}장을 넘을 때만 버릴 수 있음`);
      if (!me.hand.includes(action.cardId)) return fail(s, '손패에 없는 카드');
      me.hand.splice(me.hand.indexOf(action.cardId), 1);
      s.drawnThisTurn = s.drawnThisTurn.filter(id => id !== action.cardId);
      s.pool.push(action.cardId);
      if (me.active === action.cardId) me.active = me.hand[0] ?? null;
      log(s, `🗑️ ${me.name}이(가) <b>${s.cards[action.cardId].name}</b>을(를) 버렸다 (더미로).`);
      return ok(s);
    }
    case 'STEAL': { // 2코인: 상대 손패에서 랜덤 1장 뺏기
      if (s.turnPhase !== 'act') return fail(s, '먼저 카드를 뽑아야 함');
      if (me.coins < COST.steal) return fail(s, '코인 부족');
      if (op.hand.length === 0) return fail(s, '상대 손패가 비어 있음');
      me.coins -= COST.steal;
      const id = op.hand.splice(pickIndex(rng, op.hand.length), 1)[0];
      me.hand.push(id);
      if (op.active === id) op.active = op.hand[0] ?? null;
      log(s, `🕳️ ${me.name}이(가) 코인 ${COST.steal}개로 ${op.name}의 <b>${s.cards[id].name}</b>을(를) 뺏어왔다!`);
      return ok(s);
    }
    case 'ATTACK': {
      if (s.turnPhase !== 'act') return fail(s, '먼저 카드를 뽑아야 함');
      if (me.hand.length > HAND_LIMIT) return fail(s, `손패를 ${HAND_LIMIT}장 이하로 버려야 공격할 수 있음`);
      if (!me.hand.includes(action.cardId)) return fail(s, '손패에 없는 카드');
      const atkCard = s.cards[action.cardId];
      const defCard = defenderCard(s, other(p));
      const louisResting = applyOngoingDamage(s, p, rng);
      if (s.phase === 'over') return ok(s);
      if (louisResting && atkCard.id === 'l') {
        me.active = atkCard.id;
        s.lastDice = null;
        s.lastAttack = { player: p, attacker: atkCard.id, defender: defCard.id ?? null, damage: 0, fizzled: true };
        log(s, `💤 루이스는 이번 턴 공격을 쉰다. (남은 휴식 ${me.louisPoison.rest}턴)`);
        endTurn(s, rng);
        return ok(s);
      }
      const henryLockedAttack = me.henryAttackLock === true;
      me.henryAttackLock = false;
      let d1 = rollDie(rng), d2 = rollDie(rng);
      if (me.dieRolledBy) {                     // 상대 카드 효과: 내 주사위 하나를 상대가 대신 굴린다
        const by = me.dieRolledBy; me.dieRolledBy = null;
        const rr = rollOneDieFor(d1, d2, rng);
        log(s, `<span class="fx">🎲 ${me.name}의 ${rr.index + 1}번째 주사위는 <b>${by}</b>이(가) 굴린다! ${rr.from} → ${rr.to}</span>`);
        d1 = rr.d1; d2 = rr.d2;
      }
      me.active = action.cardId;
      s.lastDice = { player: p, d1, d2 };
      // 카드 효과로 공격이 성립하지 않는 경우 (예: 키미 — 합 6만 공격, 더블이면 한 턴 쉼)
      const chk = checkAttack(atkCard, d1, d2);
      if (!chk.ok) {
        if (chk.skipTurn) me.skipTurn = true;
        s.lastAttack = { player: p, attacker: atkCard.id, defender: defCard.id ?? null, damage: 0, fizzled: true };
        me.lastDiceSum = d1 + d2;
        log(s, `⚔️ ${me.name}의 <b>${atkCard.name}</b> 🎲${d1}+${d2} → <span class="fx">${chk.reason}</span>`);
        endTurn(s, rng);
        return ok(s);
      }
      const STAT_KO = { attack: '공격력', defense: '방어력', dominance: '지배력', empathy: '공감력' };
      const hits = attackCount(atkCard, d1, d2);
      if (hits > 1) log(s, `<span class="fx">⚡ ${atkCard.name} 더블! ${hits}연속 공격!</span>`);
      if (atkCard.id === 'sally') {
        const combo=sallyAttackSequence(rng);
        const r=resolveAttack(atkCard,defCard,d1,d2,null,{lastOpponentDiceSum:op.lastDiceSum,...(henryLockedAttack?{forceAttackStat:1}:{})});
        log(s, `<span class="fx">🔨 샐리 연속 공격 ${combo.hitCount}회: ${combo.hits.join('+')} = 6</span>`);
        let applied=0;
        for (const [index,points] of combo.hits.entries()) {
          if(op.hp<=0)break;
          const taken=Math.min(op.hp,points);
          op.hp-=taken;applied+=taken;
          log(s, `🔨 샐리 ${index+1}/${combo.hitCount}타 · ${points} 공격`);
        }
        if(combo.diamondDamage>0 && op.hp>0){
          const taken=Math.min(op.hp,combo.diamondDamage);
          op.hp-=taken;applied+=taken;
          log(s, '<span class="fx">💎 4타 이상! 거대 다이아몬드 추가 공격 6!</span>');
        }
        s.lastAttack={player:p,attacker:atkCard.id,defender:defCard.id??null,...r,damage:applied,sallyHits:combo.hits,sallyDiamondDamage:combo.diamondDamage,hitCount:combo.hitCount};
      } else for (let h = 0; h < hits && op.hp > 0; h++) {
        const [e1, e2] = h === 0 ? [d1, d2] : [rollDie(rng), rollDie(rng)];   // 2타부터는 새로 굴린다
        const r = resolveAttack(atkCard, defCard, e1, e2, null, { lastOpponentDiceSum: op.lastDiceSum, ...(henryLockedAttack?{forceAttackStat:1}:{}) });
        op.hp = Math.max(0, op.hp - r.damage);
        if (r.louisPoison && h === 0 && op.hp > 0) {
          me.louisPoison = startLouisPoison();
          log(s, '<span class="fx">☠️ 루이스 독 공격! 공격력 30 · 휴식 2턴 · 중독 3턴</span>');
        }
        s.lastDice = { player: p, d1: e1, d2: e2 };
        s.lastAttack = { player: p, attacker: atkCard.id, defender: defCard.id ?? null, hit: h, ...r };
        const tags = [
          r.attackMul === 2 && '더블! 공격×2',
          r.dominanceMul === 2 && '합10! 지배×2',
          r.empathyMul === 2 && `곱${r.product}! 공감×2`,
        ].filter(Boolean).map(t => `<span class="tag">${t}</span>`).join(' ');
        const fxLine = r.triggered.map(t => `⚡ ${(t.who === 'attacker' ? atkCard : defCard).name} ${STAT_KO[t.stat]} ${t.from}→${t.to}`).join(' · ');
        log(s, `⚔️ ${me.name}의 <b>${atkCard.name}</b>${hits > 1 ? ` (${h + 1}타)` : ''} 🎲${e1}+${e2} ${tags} → ${op.name}의 ${defCard.name}에게 데미지 <b>${r.damage}</b>`
          + (fxLine ? `<div class="fx">${fxLine}</div>` : '')
          + `<div class="calc">공격 (${r.attackerStats.attack}+${r.sum})×${r.attackMul}−지배${r.defDominance}=${r.effAttack} / 방어 ${r.defenderStats.defense}−공감${r.effEmpathy}=${r.effDefense}</div>`);
      }
      if (isAidenJellyfishRoll(atkCard,d1,d2) && op.hp > 0) {
        me.aidenShockTurns = AIDEN_DOT_TURNS;
        log(s, '<span class="fx">⚡ 대왕 해파리 감전 · 다음 4턴 동안 2~4 피해</span>');
      }
      const helperId = matchingDiceSummon(atkCard,d1,d2);
      if (helperId && op.hp > 0) {
        const helper = s.cards[helperId];
        if (helper) {
          const bonus = resolveAttack(helper,defCard,d1,d2,null,{lastOpponentDiceSum:op.lastDiceSum,...(henryLockedAttack?{forceAttackStat:1}:{})});
          const taken = Math.min(op.hp,bonus.damage);
          op.hp = Math.max(0,op.hp-taken);
          s.lastAttack = {player:p, attacker:atkCard.id, defender:defCard.id??null, summoned:helperId, summonedDamage:taken, damage:(s.lastAttack?.damage??0)+taken};
          log(s, `<span class="fx">🐾 Z 더블 ${d1}+${d2}! <b>${helper.name}</b> 등장 · ${taken} 추가 피해!</span>`);
        }
      }
      if(atkCard.id==='henry' && d1===d2) {
        op.henryAttackLock = true;
        log(s, `<span class="fx">✨ 헨리 더블 ${d1}+${d2}! 환한 미소와 후광: 상대의 다음 공격력은 1로 제한!</span>`);
      }
      if(henryLockedAttack) log(s, '<span class="fx">✨ 헨리 후광 지속: 이번 공격력 1</span>');
      me.lastDiceSum = d1 + d2;   // 다음 턴 상대의 "직전 주사위 합" 판정용 (1타 기준)
      for (const proc of rollProcs(atkCard, rng)) {
        if (proc === 'rollOpponentDie') {
          op.dieRolledBy = atkCard.name;
          log(s, `<span class="fx">✨ ${atkCard.name}의 수작! 다음 턴 ${op.name}의 주사위 하나는 ${atkCard.name}이(가) 굴린다.</span>`);
        }
      }
      if (op.hp <= 0) {
        s.phase = 'over'; s.winner = p;
        log(s, `🏆 <b>${me.name}</b> 승리! ${op.name}의 굴이 무너졌다.`);
      } else endTurn(s, rng);
      return ok(s);
    }
    default:
      return fail(s, `알 수 없는 액션: ${action.type}`);
  }
}
