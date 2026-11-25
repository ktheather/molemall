// 두더지몰 본 게임 — 로비 + 네트워크 + 렌더링. 규칙은 battle-rules.js, 연결은 net.js
import { createGame, applyAction, COST, DRAW_PER_TURN, HAND_LIMIT } from './battle-rules.js?v=zl-henry-final-20261124';
import { host, join, makeCode } from './net.js';

const $ = id => document.getElementById(id);
const IMG_V = Date.now(); // 교체된 이미지가 캐시에 가려지지 않도록 페이지 로드마다 버전 태그
let cards, net, me, state = null, myName = '', peerName = '';
// me: 0 = 호스트, 1 = 게스트

// 네트워크로 전달되는 이름은 HTML 렌더링에 사용되므로 제한한다.
const safeName = (value, fallback) => String(value ?? '').replace(/[<>&"']/g, '').trim().slice(0, 24) || fallback;

// ───────────── 로비 ─────────────
function show(id) { for (const s of ['lobby', 'wait', 'game']) $(s).hidden = s !== id; }
function setStatus(msg) { $('status').textContent = msg; }

$('hostBtn').onclick = () => {
  myName = safeName($('name').value, '호스트');
  const code = makeCode();
  me = 0;
  net = host(code, {
    onOpen: c => { $('code').textContent = c; show('wait'); setStatus('상대가 들어오길 기다리는 중…'); },
    onGuest: () => { net.send({ t: 'hello', name: myName }); },
    onMessage: onMsg,
    onClose: () => setStatus('상대 연결이 끊겼습니다.'),
    onError: e => setStatus('연결 오류: ' + e.type),
  });
};

$('joinBtn').onclick = () => {
  myName = safeName($('name').value, '게스트');
  const code = $('joinCode').value.trim();
  if (code.length !== 4) return setStatus('방 코드 4글자를 입력하세요');
  me = 1;
  show('wait'); $('code').textContent = code.toUpperCase(); setStatus('접속 중…');
  net = join(code, {
    onOpen: () => net.send({ t: 'hello', name: myName }),
    onMessage: onMsg,
    onClose: () => setStatus('호스트 연결이 끊겼습니다.'),
    onError: e => setStatus('연결 오류: ' + (e.type === 'peer-unavailable' ? '해당 방 코드를 찾을 수 없음' : e.type)),
  });
};

function onMsg(m) {
  if (!m || typeof m !== 'object' || typeof m.t !== 'string') return;
  if (m.t === 'hello') {
    peerName = safeName(m.name, '상대');
    if (me === 0) {                       // 호스트가 게임을 만든다
      state = createGame(cards, [myName, peerName]);
      broadcast();
    }
  } else if (m.t === 'state') {
    state = m.state; render();
  } else if (m.t === 'action' && me === 0) {
    if (m.action && typeof m.action === 'object') handle({ ...m.action, player: 1 });
  } else if (m.t === 'error') {
    setStatus(m.error);
  }
}

// ───────────── 액션 ─────────────
function dispatch(type, payload = {}) {
  const action = { type, player: me, ...payload };
  if (me === 0) handle(action);
  else net.send({ t: 'action', action });
}

function handle(action) {                 // 호스트 전용
  const r = applyAction(state, action);
  if (!r.ok) {
    if (action.player === me) setStatus(r.error); else net.send({ t: 'error', error: r.error });
    return;
  }
  state = r.state;
  broadcast();
}

// 게스트에게 보낼 때 카드의 숨김 정보(secret, effects)는 뺀다 — 효과 계산은 호스트만 한다
function publicState(st) {
  const cards = Object.fromEntries(Object.entries(st.cards).map(([id, c]) => {
    const { secret, effects, ...pub } = c; return [id, pub];
  }));
  return { ...st, cards };
}
function broadcast() { net.send({ t: 'state', state: publicState(state) }); render(); }

// ───────────── 렌더링 ─────────────
const stat = s => `<div class="stats">
  <span>공 <b>${s.attack}</b></span><span>방 <b>${s.defense}</b></span>
  <span>지배 <b>${s.dominance}</b></span><span>공감 <b>${s.empathy}</b></span></div>`;

// 카드 구성: 이름 / 이미지 / 능력치 / 특이사항 (실물 57×87 세로형)
function cardHtml(c, opts = {}) {
  if (!c) return `<div class="card empty">비어 있음</div>`;
  return `<div class="card ${opts.cls ?? ''}${(c.tags ?? []).includes('임원') ? ' gold' : ''}" ${opts.attr ?? ''}>
    <h3>${c.name}</h3>
    <img src="../${c.image}?v=${IMG_V}" alt="" style="transform:scale(${c.imageScale ?? 1})">
    ${stat(c.stats)}
    <div class="note">${c.trait || ''}</div></div>`;
}

function setBar(id, hp, max = 500) {
  const bar = $(id), pct = hp / max * 100;
  bar.firstElementChild.style.width = pct + '%';
  bar.classList.toggle('mid', pct <= 50 && pct > 20);
  bar.classList.toggle('low', pct <= 20);
}

function setSprite(id, card, owner) {
  const el = $(id);
  el.classList.toggle('empty', !card);
  el.querySelector('img').src = (card ? '../' + card.image : '../assets/moles/OnlyLogo_BK.png') + '?v=' + IMG_V;
  el.querySelector('img').style.transform = `scale(${card?.imageScale ?? 1})`;
}

let lastAttackSeen = null;
function playAttackFx() {
  const a = state.lastAttack;
  if (!a || a === lastAttackSeen) return;
  const key = JSON.stringify([a.player, a.attacker, a.damage, state.players[1 - a.player].hp]);
  if (key === lastAttackSeen) return;
  lastAttackSeen = key;
  const atk = a.player === me ? 'mySprite' : 'oppSprite';
  const def = a.player === me ? 'oppSprite' : 'mySprite';
  for (const id of [atk, def]) { $(id).classList.remove('lunge', 'hit'); void $(id).offsetWidth; }
  $('dice').classList.remove('roll'); void $('dice').offsetWidth; $('dice').classList.add('roll');
  $(atk).classList.add('lunge');
  $(def).classList.add('hit');
  setTimeout(() => { $(atk).classList.remove('lunge'); $(def).classList.remove('hit'); }, 1000);
}

function menuBtn(label, onClick, disabled = false, wide = false) {
  const b = document.createElement('button');
  b.textContent = label; b.disabled = disabled; b.onclick = onClick;
  if (wide) b.classList.add('wide');
  $('menu').appendChild(b);
}

function render() {
  if (!state) return;
  show('game');
  const mine = state.players[me], opp = state.players[1 - me];
  const myTurn = state.phase === 'play' && state.turn === me;
  const acting = myTurn && state.turnPhase === 'act';
  const myCard = state.cards[mine.active], oppCard = state.cards[opp.active];

  // HP 박스
  $('oppCardName').textContent = oppCard ? oppCard.name : '—';
  $('myCardName').textContent = myCard ? myCard.name : '—';
  $('oppName').textContent = opp.name; $('myName').textContent = mine.name;
  $('oppCoins').textContent = '●'.repeat(opp.coins) + '○'.repeat(5 - opp.coins);
  $('myCoins').textContent = '●'.repeat(mine.coins) + '○'.repeat(5 - mine.coins);
  $('oppHandCount').textContent = `손패${opp.hand.length}`;
  setBar('oppBar', opp.hp); setBar('myBar', mine.hp);
  $('myHpText').textContent = `${mine.hp}/ 500`;

  // 스프라이트
  setSprite('oppSprite', oppCard); setSprite('mySprite', myCard);

  // 주사위
  if (state.lastDice) { $('d1').textContent = state.lastDice.d1; $('d2').textContent = state.lastDice.d2; }
  playAttackFx();

  // 메시지 = 최신 로그 1줄
  $('msg').innerHTML = state.log[0] ?? '';

  // 메뉴
  $('menu').innerHTML = '';
  if (state.phase === 'order') {
    setStatus(mine.orderDie === null ? '주사위를 굴려 선공을 정하세요' : `내 주사위 ${mine.orderDie} — 상대를 기다리는 중`);
    menuBtn('주사위', () => dispatch('ROLL_ORDER'), mine.orderDie !== null, true);
  } else if (state.phase === 'over') {
    setStatus(state.winner === me ? '🏆 승리!' : '💀 패배…');
    $('msg').innerHTML = state.winner === me ? `${opp.name}의 굴이 무너졌다!<br>승리!` : `${mine.name}의 굴이 무너졌다…<br>패배`;
    menuBtn('다시', () => location.reload(), false, true);
  } else if (!myTurn) {
    setStatus(`${opp.name}의 턴`);
    menuBtn('상대 턴…', null, true, true);
  } else if (state.turnPhase === 'draw') {
    setStatus('턴 시작 — 카드를 1장 뽑아야 공격할 수 있어요');
    menuBtn('뽑기', () => dispatch('DRAW'));
    menuBtn(`고르기 ●${COST.pick}`, openPicker, mine.coins < COST.pick || state.pool.length === 0);
    menuBtn(`더미 ${state.pool.length}장`, null, true, true);
  } else if (mine.hand.length > HAND_LIMIT) {
    const n = mine.hand.length - HAND_LIMIT;
    setStatus(`손패가 ${HAND_LIMIT}장을 넘었습니다 — ${n}장을 골라 버려야 공격할 수 있어요`);
    menuBtn(`${n}장 버리기`, () => $('hand').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), false, true);
    menuBtn(`뺏기 ●${COST.steal}`, () => dispatch('STEAL'), mine.coins < COST.steal || opp.hand.length === 0);
  } else {
    setStatus('싸우다 → 손패에서 카드를 클릭하세요');
    menuBtn('싸우다', () => $('hand').scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    menuBtn(`뺏기 ●${COST.steal}`, () => dispatch('STEAL'), mine.coins < COST.steal || opp.hand.length === 0);
    menuBtn(`더미 ${state.pool.length}장`, null, true, true);
  }

  // 손패
  const overLimit = mine.hand.length > HAND_LIMIT;
  const canAttack = acting && !overLimit;
  $('hand').innerHTML = mine.hand.map(id => {
    const isNew = acting && state.drawnThisTurn.includes(id);
    const sub = [];
    if (isNew && mine.coins >= COST.mulligan && state.pool.length > 0)
      sub.push(`<button class="mini" data-act="MULLIGAN" data-id="${id}">↩ ●${COST.mulligan} 무르기</button>`);
    if (acting && overLimit)
      sub.push(`<button class="mini discard" data-act="DISCARD" data-id="${id}">✕ 버리기</button>`);
    const cls = (canAttack ? 'playable' : '') + (isNew ? ' new' : '') + (id === mine.active ? ' active' : '');
    return `<div class="slot">${cardHtml(state.cards[id], { cls, attr: `data-id="${id}"` })}${sub.join('')}</div>`;
  }).join('');
  if (canAttack) for (const el of $('hand').querySelectorAll('.card')) el.onclick = () => dispatch('ATTACK', { cardId: el.dataset.id });
  if (acting) for (const b of $('hand').querySelectorAll('.mini')) b.onclick = e => { e.stopPropagation(); dispatch(b.dataset.act, { cardId: b.dataset.id }); };
  $('handInfo').textContent = `${mine.hand.length}/${HAND_LIMIT}장` + (overLimit ? ` — ${mine.hand.length - HAND_LIMIT}장 버려야 함` : '') + (canAttack ? ' · 카드 클릭 = 공격' : '');

  $('log').innerHTML = state.log.map(l => `<div class="entry">${l}</div>`).join('');
}

function openPicker() {
  const box = $('picker');
  box.innerHTML = `<h3>코인 ${COST.pick}개로 1장 고르기${DRAW_PER_TURN > 1 ? ` (나머지 ${DRAW_PER_TURN - 1}장은 랜덤)` : ''}</h3><div class="grid">` +
    state.pool.map(id => cardHtml(state.cards[id], { cls: 'playable', attr: `data-id="${id}"` })).join('') +
    `</div><button id="pickCancel">취소</button>`;
  box.hidden = false;
  for (const el of box.querySelectorAll('.card')) el.onclick = () => { box.hidden = true; dispatch('PICK', { cardId: el.dataset.id }); };
  $('pickCancel').onclick = () => box.hidden = true;
}

fetch('../data/cards.json', { cache: 'no-store' }).then(r => r.json()).then(j => { cards = j.moles.filter(m => !m.placeholder); show('lobby'); });
