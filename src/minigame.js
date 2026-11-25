import { mountCombatCharacter, animateCharacter, shouldJacobStun, playCharacterSound } from "./character-fx.js?v=character-refresh-20261125"; // MOLEMALL_CHARACTER_FX
// 두더지몰 — 턴 진행 + UI 바인딩
import { rollDie, resolveAttack } from './rules.js?v=zl-henry-final-20261124';
import { checkAttack, attackCount, rollProcs, rollOneDieFor, matchingDiceSummon } from './effects.js?v=zl-henry-final-20261124';
import { createBossState, takeBossHit } from './boss-passives.js?v=zl-henry-final-20261124';
import { battleArt } from './battle-art.js?v=character-refresh-20261125';
import { sallyAttackSequence } from './sally-combo.js';
import { AIDEN_DOT_TURNS, isAidenJellyfishRoll, aidenHealAmount, tickAidenJellyfish } from './aiden-jellyfish.js';
import { buildBossStages, normalizeClearedBossIds, getUnlockedLevel, canEnterStage } from './boss-stages.js?v=z-l-final-20261124';

const DEN_HP = 500; // 두더지 굴(플레이어) 체력
let data, level = 1, boss, bossHp, denHp, gameOver = false;
let turnNumber = 1, muted = false, tearTimer, oilTimer, brothersHurtTimer;
let lastMoleDiceSum = null, lastBossDiceSum = null;   // 직전 턴 주사위 합 (앤드류 같은 효과용)
let ianBonusCount = 0;
let aidenShockTurns = 0;  // persistent shock on the current boss; once per following player turn
let bossDieRolledBy = null;                           // 다음 보스 반격의 주사위 하나를 대신 굴리는 두더지 이름
const PROGRESS_KEY = 'molemall_minigame_cleared_bosses_v1';
const clearedBossIds = new Set();

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const $ = id => document.getElementById(id);
const IMG_V = Date.now(); // 교체된 이미지가 캐시에 가려지지 않도록 페이지 로드마다 버전 태그
const fmt = n => Number.isInteger(n) ? n : n.toFixed(1);
const baseStats = b => data.bosses.find(x => x.id === b.id).stats;

function restoreProgress() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '[]'); }
  catch { saved = []; }
  for (const id of normalizeClearedBossIds(data.bosses, saved)) clearedBossIds.add(id);
}

function saveProgress() {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify([...clearedBossIds])); }
  catch { console.warn('진행 기록을 저장할 수 없어 현재 창에서만 유지합니다.'); }
}

function renderBossPath() {
  $('bossPath').replaceChildren(...data.bosses.map(stage => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'boss-stop';
    button.dataset.level = String(stage.level);
    button.dataset.boss = stage.id;
    const badge = document.createElement('small');
    badge.textContent = `LV${stage.level}`;
    const lock = document.createElement('span');
    lock.className = 'lock-icon';
    lock.textContent = ' 🔒';
    lock.setAttribute('aria-hidden', 'true');
    button.append(badge, document.createTextNode(stage.name), lock);
    button.addEventListener('click', () => startStage(stage.level));
    return button;
  }));
  updateBossPath();
}

function updateBossPath() {
  if (!data) return;
  for (const button of $('bossPath').querySelectorAll('.boss-stop')) {
    const stage = data.bosses.find(entry => entry.id === button.dataset.boss);
    const unlocked = canEnterStage(data.bosses, clearedBossIds, stage.level);
    button.disabled = busy || !unlocked;
    button.classList.toggle('locked', !unlocked);
    button.classList.toggle('current', stage.level === level);
    button.classList.toggle('cleared', clearedBossIds.has(stage.id));
    button.querySelector('.lock-icon').hidden = unlocked;
    button.setAttribute('aria-label', `LV${stage.level} ${stage.name}${unlocked ? '' : ' 잠김'}`);
    button.title = unlocked ? (clearedBossIds.has(stage.id) ? '클리어한 보스 · 다시 도전하기' : '도전 가능한 보스') : `LV${stage.level - 1} 보스를 쓰러뜨리면 열립니다.`;
    if (stage.level === level) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  }
}

const statsHtml = s => `
  <div class="stats">
    <span>공격력 <b>${fmt(s.attack)}</b></span><span>방어력 <b>${fmt(s.defense)}</b></span>
    <span>지배력 <b>${fmt(s.dominance)}</b></span><span>공감력 <b>${fmt(s.empathy)}</b></span>
  </div>`;

const hpBar = (cur, max) =>
  `<div class="hpbar"><div style="width:${Math.max(0, cur / max * 100)}%"></div></div>
   <p class="hp">HP ${fmt(Math.max(0, cur))} / ${max}</p>`;

function renderMole(m) {
  setArenaMole(m);
  $('mole').className = 'card' + ((m.tags ?? []).includes('임원') ? ' gold' : '');
  $('mole').innerHTML = `
    <h2>${m.name}</h2>
    <div class="card-art"><img src="${battleArt(m)}?v=${IMG_V}" alt="${m.name}"></div>
    ${statsHtml(m.stats)}
    <div class="note">${m.trait}</div>`;
}

function renderBoss() {
  updateArenaBars();
  // Keep the summoned jellyfish visibly beside the boss while delayed damage remains.
  const bossActor=$('arenaBoss');
  let jellyfish=bossActor.querySelector('.aiden-jellyfish-orbit');
  if(aidenShockTurns>0 && !jellyfish) {
    jellyfish=document.createElement('img');
    jellyfish.className='aiden-jellyfish-orbit';
    jellyfish.src='../assets/fx/aiden-jellyfish.webp';
    jellyfish.alt=''; jellyfish.setAttribute('aria-hidden','true');
    bossActor.appendChild(jellyfish);
  } else if(aidenShockTurns<=0 && jellyfish) jellyfish.remove();
  const oil = boss.id === 'taetiseo';
  const brothers = boss.id === 'pure_brothers';
  const text = (id, value) => { if ($(id)) $(id).textContent = value; };
  text('bossTitle', boss.name);
  text('bossLevel', `LV${boss.level}`);
  text('passiveTitle', oil ? '기름 분비' : brothers ? '👑 임원 · 당황하는 형제' : boss.id==='l' ? '🐍 뱀의 위장 · 최종 보스' : '보스 정보');
  text('passiveText', oil ? '피해를 받으면 개기름을 흘립니다. 공격력이 20%씩 증가합니다. (누적 적용)' : brothers ? '피격 시 땀을 뻘뻘 흘리며 두 눈을 동그랗게 뜨고 어리둥절해합니다.' : boss.id==='l' ? 'ㅌ으로 시작하지 않는 두더지를 상대하면 공격력 10 · 공감력 5로 변화' : `주사위를 굴려 공격합니다. 방어 ${fmt(boss.stats.defense)} · 지배 ${fmt(boss.stats.dominance)}`);
  text('passiveStack', oil ? `피격 ${boss.oilStacks}회 · 공격 ×${(1.2 ** boss.oilStacks).toFixed(2)}` : `LV${boss.level} · HP ${boss.hp}`);
  text('passiveAttack', `현재 공격력 ${fmt(boss.stats.attack)}`);
  $('arenaBoss').dataset.oilStacks = String(boss.oilStacks);
  $('boss').innerHTML = `
    <h2>LV${boss.level} ${boss.name}${(boss.tags ?? []).includes('임원') ? ' · 👑 임원' : ''}</h2>
    ${hpBar(bossHp, boss.hp)}
    ${aidenShockTurns>0 ? `<p class="note aiden-shock-active">⚡ 해파리 감전 · 다음 ${aidenShockTurns}턴 동안 매 턴 무작위 2~5 피해</p>` : ''}
    ${statsHtml(boss.stats)}
    <p class="note">🎲 기본 공격 ${baseStats(boss).attack}×${boss.attackDie}/2 = ${fmt(boss.spawnAttack)}${oil ? ` · 기름 ${boss.oilStacks}회 → ${fmt(boss.stats.attack)}` : ''} / 지배력 ${baseStats(boss).dominance}×${boss.dominanceDie}/2 = ${fmt(boss.stats.dominance)}</p>`;
}

function renderDen() {
  updateArenaBars();
  $('den').innerHTML = `<h2>🏠 두더지 굴</h2>${hpBar(denHp, DEN_HP)}`;
}

function showDice(prefix, d1, d2) {
  for (const [i, value] of [d1, d2].entries()) {
    const die = $(prefix + (i + 1));
    die.textContent = String.fromCodePoint(0x267f + value);
    die.dataset.value = value;
    die.setAttribute('aria-label', `${prefix === 'm' ? '두더지' : '보스'} 주사위 ${i + 1}: ${value}`);
  }
  $(prefix + 'Sum').textContent = `합 ${d1 + d2}`;
}

function log(html) {
  $('log').insertAdjacentHTML('afterbegin', `<div class="entry"><span class="entry-turn">LV${level} · T${String(turnNumber).padStart(2,'0')}</span> ${html}</div>`);
  while ($('log').children.length > 150) $('log').lastElementChild.remove();
}

function bonusTags(r) {
  const t = [];
  if (r.attackMul === 2)    t.push('<span class="tag">더블! 공격력 ×2</span>');
  if (r.dominanceMul === 2) t.push('<span class="tag">합 10! 지배력 ×2</span>');
  if (r.empathyMul === 2)   t.push(`<span class="tag">곱 ${r.product}! 공감력 ×2</span>`);
  return t.join(' ');
}

function calcLine(att, def, r) {
  return `<div class="calc">공격 (${fmt(r.attackerStats.attack)}+${r.sum})×${r.attackMul}−지배${fmt(r.defDominance)} = ${fmt(r.effAttack)}
          &nbsp;/&nbsp; 방어 ${fmt(r.defenderStats.defense)}−공감${fmt(r.effEmpathy)} = ${fmt(r.effDefense)}</div>`;
}

// 보스 소환: 주사위 2개를 굴려 기본 공격력/지배력에 (눈 / 2) 배수를 곱한다
function spawnBoss(lv) {
  ianBonusCount=0;
  aidenShockTurns=0;
  const base = data.bosses.find(b => b.level === lv);
  if (!base) return null;
  const attackDie = rollDie(), dominanceDie = rollDie();
  boss = createBossState(base, attackDie, dominanceDie);
  bossHp = boss.hp;
  gameOver = false;
  $('resultBanner').hidden = true;
  $('cottonTears').replaceChildren();
  clearTimeout(tearTimer);
  clearTimeout(oilTimer);
  $('oilDrops')?.replaceChildren();
  clearTimeout(brothersHurtTimer);
  $('arenaBoss').classList.remove('pure-brothers-hurt');
  $('oilPool')?.classList.remove('show');
  $('arenaBoss').classList.remove('oily');
  $('phaseBadge').textContent = '카드 대기';
  $('bossBarLabel').textContent = boss.name;
  const arena = document.querySelector('.arena');
  arena.dataset.level = String(boss.level);
  delete arena.dataset.activeMole;
  arena.dataset.boss = boss.id;
  document.querySelector('.scene-label').textContent = boss.id === 'taetiseo' ? `LV.${String(boss.level).padStart(2, '0')} · 쓰레기장` : boss.id === 'pure_brothers' ? `LV.${String(boss.level).padStart(2, '0')} · 전산실` : boss.id === 'l' ? `LV.${String(boss.level).padStart(2, '0')} · 뱀의 극장` : '';
  updateBossPath();
  $('arenaBoss').classList.toggle('dinosaur-fighter',boss.id==='dinosaur');
  $('arenaBossName').textContent=`LV${boss.level} ${boss.name}`;
  $('arenaBoss').classList.toggle('bori-fighter',boss.id==='bori');
  $('arenaBoss').classList.toggle('taetiseo-fighter',boss.id==='taetiseo');
  $('arenaBoss').classList.toggle('pure-brothers-fighter',boss.id==='pure_brothers');
  $('arenaBoss').classList.toggle('l-final-fighter',boss.id==='l');
  const bossArt=$('arenaBossArt');
  bossArt.replaceChildren();
  bossArt.className='monster'+(boss.image?' plush-boss':'');
  if(boss.id==='bori'){
    const sprite=document.createElement('div');
    sprite.className='bori-sprite';
    sprite.setAttribute('role','img');
    sprite.setAttribute('aria-label','민트색 봉제인형 거북이 보리 보스');
    bossArt.appendChild(sprite);
    setBoriFrame(0,0);
  } else if(boss.image){
    const img=document.createElement('img');
    img.src=boss.id==='l' ? battleArt(boss) : '../'+boss.image+'?v='+IMG_V;
    if (boss.id === 'pure_brothers') img.dataset.normalSrc=img.src;
    img.alt=boss.name+' 보스';
    img.onerror=()=>{bossArt.textContent='이미지를 불러오지 못했어요';};
    bossArt.appendChild(img);
    if (boss.id === 'l') mountCombatCharacter(bossArt, boss);
  } else {
    bossArt.textContent=boss.name.includes('코끼리')?'🐘':boss.name.includes('곰')?'🐻':boss.name.includes('호랑이')?'🐯':'🦣';
  }
  if(boss.id==='bori')startBoriIdle();else{clearInterval(boriTimer);boriGeneration++;boriAction=false;}
  $('arenaStatus').textContent='보스가 등장했습니다. 카드를 뽑아주세요.';
  renderBoss();
  log(`🦣 <b>LV${boss.level} ${boss.name}</b> 등장! 공격력 주사위 ${attackDie} → ×${attackDie / 2} = ${fmt(boss.stats.attack)}, 지배력 주사위 ${dominanceDie} → ×${dominanceDie / 2} = ${fmt(boss.stats.dominance)}`);
  return boss;
}

// 보리 원본 앱의 실제 3D 봉제인형 스프라이트 시트를 재생합니다.
// 8열 x 11행의 각 칸은 같은 캐릭터의 개별 동작 프레임입니다.
let boriTimer=null;
let boriAction=false;
let boriGeneration=0;
function setBoriFrame(col,row){
  const sprite=document.querySelector('#arenaBoss .bori-sprite');
  if(sprite) sprite.style.backgroundPosition=`${col/7*100}% ${row/10*100}%`;
}
function startBoriIdle(){
  clearInterval(boriTimer);
  boriGeneration++;
  boriAction=false;
  let tick=0;
  boriTimer=setInterval(()=>{
    if(boriAction || !document.querySelector('#arenaBoss .bori-sprite'))return;
    const frames=[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[4,0],[3,0],[2,0],[1,0]];
    const [col,row]=frames[tick++%frames.length];
    setBoriFrame(col,row);
  },220);
}
async function animateBoriAction(kind){
  if(boss?.id!=='bori')return;
  const generation=boriGeneration;
  boriAction=true;
  const frames=kind==='attack'?[[0,4],[1,4],[2,4],[3,4],[4,4],[2,5],[3,5],[4,5]]:[[0,6],[1,6],[2,6],[3,6],[4,6],[5,6]];
  for(const [col,row] of frames){
    if(generation!==boriGeneration || boss?.id!=='bori')return;
    setBoriFrame(col,row);await wait(kind==='attack'?85:95);
  }
  if(generation!==boriGeneration || boss?.id!=='bori')return;
  boriAction=false;
  setBoriFrame(0,0);
}
function updateArenaBars() {
  if (!boss) return;
  $('arenaBossHp').textContent=`${fmt(Math.max(0,bossHp))} / ${boss.hp}`;
  $('arenaBossBar').style.width=`${Math.max(0,Math.min(100,bossHp/boss.hp*100))}%`;
  if(Number.isFinite(denHp)) {
    $('arenaDenHp').textContent=`${fmt(Math.max(0,denHp))} / ${DEN_HP}`;
    $('arenaDenBar').style.width=`${Math.max(0,Math.min(100,denHp/DEN_HP*100))}%`;
  }
}
function setArenaMole(m) {
  const art=$('arenaMoleArt');
  document.querySelector('.arena').dataset.activeMole = m.id;
  art.replaceChildren();
  const img=document.createElement('img');
  img.src=`${battleArt(m)}?v=${IMG_V}`;
  img.alt=m.name;
  img.onerror=()=>{art.textContent='🐾'};
  art.appendChild(img);
  mountCombatCharacter(art, m); // MOLEMALL_CHARACTER_FX
  $('arenaMoleName').textContent=m.name;
  $('arenaStatus').textContent=`${m.name} 출전! 주사위를 던져주세요.`;
}
function cottonTears() {
  clearTimeout(tearTimer);
  const layer = $('cottonTears');
  layer.replaceChildren();
  // Four puffy drops from each eye: soft cotton instead of water.
  for (let i = 0; i < 8; i++) {
    const drop = document.createElement('span');
    drop.className = 'cotton-tear' + (i % 2 ? ' right' : '');
    drop.style.setProperty('--delay', `${Math.floor(i / 2) * 140}ms`);
    layer.appendChild(drop);
  }
  tearTimer = setTimeout(() => layer.replaceChildren(), 1900);
}
function oilBurst() {
  const layer = $('oilDrops');
  if (!layer) return;
  clearTimeout(oilTimer);
  layer.replaceChildren();
  $('arenaBoss').classList.add('oily');
  const positions = [28, 39, 52, 62, 70, 48, 35, 58, 76, 42, 66, 23];
  positions.forEach((x, index) => {
    const drop = document.createElement('span');
    drop.className = 'oil-drop';
    drop.style.setProperty('--x', `${x}%`);
    drop.style.setProperty('--delay', `${(index % 4) * 75}ms`);
    drop.style.setProperty('--drift', `${(index % 3 - 1) * 18}px`);
    layer.appendChild(drop);
  });
  $('oilPool')?.classList.remove('show');
  if ($('oilPool')) { void $('oilPool').offsetWidth; $('oilPool').classList.add('show'); }
  oilTimer = setTimeout(() => {
    layer.replaceChildren();
    $('arenaBoss').classList.remove('oily');
  }, 2100);
}

function showBrothersHurt() {
  if (boss?.id !== 'pure_brothers') return;
  const actor=$('arenaBoss'), img=$('arenaBossArt').querySelector('img');
  if (!img) return;
  clearTimeout(brothersHurtTimer);
  img.dataset.normalSrc ||= '../assets/bosses/pure-brothers-plush.webp?v='+IMG_V;
  img.src='../assets/bosses/pure-brothers-hit.webp?v='+IMG_V;
  actor.classList.remove('pure-brothers-hurt');
  void actor.offsetWidth;
  actor.classList.add('pure-brothers-hurt');
  brothersHurtTimer=setTimeout(()=>{
    if(boss?.id!=='pure_brothers')return;
    img.src=img.dataset.normalSrc;
    actor.classList.remove('pure-brothers-hurt');
  },1200);
}

function hitBoss(damage) {
  const result = takeBossHit(boss, bossHp, damage);
  boss = result.boss;
  bossHp = result.hp;
  if (result.damage > 0 && boss.id === 'pure_brothers') {
    showBrothersHurt();
    step('💦 순수 형제 피격! 눈이 휘둥그레지고 땀을 뻘뻘!');
    log('<span class="tag">😳 순수 형제가 땀을 흘리며 멍한 표정을 짓습니다!</span>');
  }
  if (result.oilTriggered) {
    oilBurst();
    step(`💧 태티서 피격 ${boss.oilStacks}회: 공격력 20% 증가 → ${fmt(boss.stats.attack)}`);
    log(`<span class="tag oil-tag">💧 기름 분비 ${boss.oilStacks}회 · 공격 ×${(1.2 ** boss.oilStacks).toFixed(2)}</span> 현재 공격력 <b>${fmt(boss.stats.attack)}</b>`);
  }
  renderBoss();
}
async function animateCombat(attacker, damage, targetName, onImpact, {phase='attack',quick=false} = {}) {
  const hero=attacker==='mole';
  const actor=$(hero?'arenaMole':'arenaBoss');
  const target=$(hero?'arenaBoss':'arenaMole');
  const duration = quick ? 480 : phase === 'special' ? 1250 : 1050;
  const fighter = hero ? selectedMole : boss;
  const hasCharacterFx = hero || boss.id === 'l';
  const art = $(hero ? 'arenaMoleArt' : 'arenaBossArt');
  let finishFx;
  let finishDefense;
  if (hasCharacterFx) {
    if (!muted) playCharacterSound(fighter, phase);
    finishFx = animateCharacter(fighter, {
      root: art, opponentName: hero ? boss.name : selectedMole.name, phase, duration,
      diceSum: hero ? fxDice.sum : null, doubles: hero && fxDice.doubles,
      previousDiceSum: hero ? lastBossDiceSum : null
    });
  }
  if (!hero && selectedMole?.id === 'kade' && fxDice.doubles) {
    finishDefense = animateCharacter(selectedMole, {
      root: $('arenaMoleArt'), opponentName: boss.name, phase: 'special', duration
    });
  }
  $('phaseBadge').textContent=hero?'두더지 공격':'보스 반격';
  $('arenaStatus').textContent=hero?`${selectedMole.name}의 공격!`:`${boss.name}의 반격!`;
  actor.classList.remove('attack');
  target.classList.remove('hit');
  if (!hasCharacterFx) {
    void actor.offsetWidth;
    actor.classList.add('attack');
  }
  const impactTime = Math.round(hasCharacterFx ? duration * .68 : 340);
  await wait(impactTime);
  target.classList.add('hit');
  onImpact?.();
  if (damage > 0) {
    sound('impact');
    if (hero && !['taetiseo','pure_brothers'].includes(boss.id)) cottonTears();
    const burst = $('impactBurst');
    burst.style.left = hero ? '65%' : '20%';
    burst.classList.remove('show'); void burst.offsetWidth; burst.classList.add('show');
  }
  if(boss?.id==='bori') void animateBoriAction(hero?'hit':'attack');
  const floater=$('damageFloat');
  floater.textContent=damage>0?`-${fmt(damage)}`:'방어!';
  floater.style.left=hero?'64%':'15%';
  floater.classList.remove('show');void floater.offsetWidth;floater.classList.add('show');
  $('arenaStatus').textContent=`${targetName} ${fmt(damage)} 피해!`;
  await wait(hasCharacterFx ? duration - impactTime + (quick ? 75 : 230) : 600);
  finishFx?.();
  finishDefense?.();
  actor.classList.remove('attack');target.classList.remove('hit');floater.classList.remove('show');$('impactBurst').classList.remove('show');
}

let selectedMole = null, busy = false;
let fxDice = { sum:null, doubles:false }; // MOLEMALL_CHARACTER_FX
function setBusy(value) {
  busy = value;
  updateBossPath();
}
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
// Pre-rendered sound effects. Unlock playback during a real user click.
const sfx = Object.fromEntries(Object.entries({
  shuffle: '../assets/sfx/card-shuffle.wav',
  dice: '../assets/sfx/dice-roll.wav',
  impact: '../assets/sfx/attack-impact.wav'
}).map(([key, url]) => {
  const audio = new Audio(url);
  audio.preload = 'auto';
  audio.volume = key === 'impact' ? 0.95 : 0.9;
  return [key, audio];
}));
let audioContext;
function unlockAudio() {
  // Browsers allow sound after a click; keep the audio context unlocked for later hits.
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') void audioContext.resume();
  } catch (err) { /* Audio files still work without Web Audio */ }
}
function sound(kind) {
  if (muted) return;
  const original = sfx[kind];
  if (!original) return;
  try {
    const audio = original.cloneNode(true);
    audio.volume = original.volume;
    void audio.play().catch(err => console.warn('Effect audio playback blocked:', kind, err));
    audio.addEventListener('ended', () => { audio.src = ''; }, { once: true });
  } catch (err) { console.warn('Effect audio unavailable:', kind, err); }
}
function step(text,reset=false) {
  const el=$('stepLines');
  if(reset) el.textContent='';
  el.textContent+=(el.textContent?'\n':'')+text;
}
async function animate(kind, d1, d2, prefix = 'm') {
  let ticker;
  if(kind==='shuffle') {
    $('phaseBadge').textContent = '카드 셔플';
    $('stageVisual').innerHTML='<div class="deck" aria-label="카드 섞는 중"><i></i><i></i><i></i></div>';
  } else {
    $('phaseBadge').textContent = prefix === 'm' ? '두더지 주사위' : '보스 주사위';
    $('stageVisual').innerHTML='<div class="rolling" aria-label="주사위 2개 굴리는 중"><span>⚄</span><span>⚂</span></div>';
    let tick = 0;
    for (const i of [1,2]) $(prefix+i).classList.add('rolling-die');
    ticker = setInterval(() => {
      const faces = [1+(tick++ % 6), 1+((tick+2) % 6)];
      showDice(prefix, ...faces);
      $('stageVisual').querySelectorAll('span').forEach((el,i) => el.textContent = String.fromCodePoint(0x267f+faces[i]));
    }, 85);
  }
  sound(kind);
  try { await wait(kind==='shuffle'?900:1000); }
  finally {
    clearInterval(ticker);
    if (kind !== 'shuffle') {
      for (const i of [1,2]) $(prefix+i).classList.remove('rolling-die');
      showDice(prefix, d1, d2);
    }
  }
  $('stageVisual').innerHTML=kind==='shuffle'?'<div class="stage-label">카드 선택 완료</div>':`<div class="stage-label">${prefix==='m'?'두더지':'보스'} 주사위<br><strong>${d1} + ${d2} = ${d1+d2}</strong></div>`;
}
async function drawCard() {
  if(busy||gameOver||selectedMole||!data)return;
  unlockAudio();
  setBusy(true);$('drawBtn').disabled=true;
  step('① 카드를 섞는 중…',true);
  await animate('shuffle');
  selectedMole=pick(data.moles);
  renderMole(selectedMole);
  $('cardState').textContent='출전';
  $('phaseBadge').textContent='주사위 대기';
  step(`② 뽑은 카드: ${selectedMole.name}`);
  $('stageVisual').textContent=`🃏 ${selectedMole.name}`;
  $('rollBtn').disabled=false;setBusy(false);
}
async function turn() {
  if (gameOver||busy||!selectedMole)return;
  unlockAudio();
  setBusy(true);$('rollBtn').disabled=true;
  const mole=selectedMole;
  // Residual jellyfish electricity hits once at the beginning of each of the NEXT three turns,
  // independent of which mole is drawn. It does not consume the player's action.
  if (aidenShockTurns>0) {
    const shock = tickAidenJellyfish(aidenShockTurns);
    aidenShockTurns=shock.remaining;
    hitBoss(shock.damage);
    log(`<span class="tag">⚡ 대왕 해파리 지속 감전! ${boss.name} HP -${shock.damage} (남은 ${aidenShockTurns}턴)</span>`);
    step(`⚡ 해파리 지속 감전: ${shock.damage} 피해 · 남은 ${aidenShockTurns}턴`);
    $('arenaStatus').textContent=`⚡ ${boss.name} 감전 피해 ${shock.damage}!`;
    if (bossHp<=0) { log(`🎉 <b>LV${boss.level} ${boss.name}</b> 감전으로 사냥 성공!`); return end(true); }
  }
  // Healing is a separate ability, once each Aiden turn at or below half den HP.
  const healed=aidenHealAmount(mole,denHp,DEN_HP);
  if (healed>0) {
    denHp+=healed;
    renderDen();
    log(`<span class="tag">💚 에이든의 아군 회복! 두더지 굴 HP +${healed}</span>`);
    step(`💚 에이든 회복: 두더지 굴 HP +${healed}`);
  }
  const m1=rollDie(),m2=rollDie();
  fxDice={sum:m1+m2,doubles:m1===m2}; // MOLEMALL_CHARACTER_FX
  step('③ 두더지 주사위 2개를 굴리는 중…');
  await animate('dice',m1,m2);
  showDice('m',m1,m2);
  step(`④ 두더지 주사위: ${m1} + ${m2} = ${m1+m2}`);
  const chk=checkAttack(mole,m1,m2),moleDiceSum=m1+m2;
  let atk=null;
  if(!chk.ok) {
    $('arenaStatus').textContent=`공격 실패: ${chk.reason}`;
    step(`⑤ 공격 실패: ${chk.reason}`);
    log(`🐾 <b>${mole.name}</b> 🎲 ${m1}+${m2} → <span class="tag">${chk.reason}</span>`);
  } else if(mole.id==='sally') {
    // Sally's six basic points are divided into random per-hit damage packets.
    // 4+ hits trigger ONE separate +6 diamond attack (not "attack >=4").
    const combo=sallyAttackSequence();
    atk=resolveAttack(mole,boss,m1,m2,null,{lastOpponentDiceSum:lastBossDiceSum});
    atk.damage=0;
    log(`<span class="tag">🔨 샐리 연속 타격! ${combo.hitCount}회 · ${combo.hits.join(' + ')} = 6</span>`);
    step(`⑤ 샐리 연속 공격 ${combo.hitCount}회: ${combo.hits.join(' + ')} = 6`);
    for(let i=0;i<combo.hits.length && bossHp>0;i++){
      const points=combo.hits[i];
      await animateCombat('mole',points,boss.name,()=>hitBoss(points),{quick:true});
      atk.damage+=points;
      log(`🔨 <b>샐리</b> ${i+1}/${combo.hitCount}타 · <b>${points}</b> 피해`);
    }
    if(combo.diamondDamage>0 && bossHp>0){
      step('💎 4회 이상 공격 성공! 하늘에서 거대 다이아몬드 낙하!');
      log('<span class="tag">💎 샐리의 거대 다이아몬드 추가 공격 +6!</span>');
      await animateCombat('mole',combo.diamondDamage,boss.name,()=>hitBoss(combo.diamondDamage),{phase:'special'});
      atk.damage+=combo.diamondDamage;
    }
  } else {
    const hits=attackCount(mole,m1,m2);
    if(hits>1)log(`<span class="tag">⚡ ${mole.name} 더블! ${hits}연속 공격!</span>`);
    for(let h=0;h<hits&&bossHp>0;h++){
      const [e1,e2]=h===0?[m1,m2]:[rollDie(),rollDie()];
      if(h>0){step(`추가 공격 ${h+1}타: 주사위 굴리는 중…`);await animate('dice',e1,e2);}
      showDice('m',e1,e2);
      fxDice={sum:e1+e2,doubles:e1===e2}; // MOLEMALL_CHARACTER_FX
      atk=resolveAttack(mole,boss,e1,e2,null,{lastOpponentDiceSum:lastBossDiceSum});
      if(mole.id==='ian' && ianBonusCount){const multiplier=1.2**ianBonusCount;atk.damage=Math.max(0,Math.round((atk.effAttack*multiplier-atk.effDefense)*10)/10);atk.effAttack=Math.round(atk.effAttack*multiplier*10)/10;}

      await animateCombat('mole',atk.damage,boss.name, () => hitBoss(atk.damage));
      if (atk.triggered.length) log(atk.triggered.map(t => `<span class="tag">⚡ ${t.who==='attacker'?mole.name:boss.name} ${{attack:'공격력',defense:'방어력',dominance:'지배력',empathy:'공감력'}[t.stat]} ${fmt(t.from)}→${fmt(t.to)}</span>`).join(' '));
      step(`⑤ ${h+1}타 피해 ${fmt(atk.damage)} (공격 ${fmt(atk.effAttack)}, 방어 ${fmt(atk.effDefense)})`);
      log(`🐾 <b>${mole.name}</b>${hits>1?` (${h+1}타)`:''} 🎲 ${e1}+${e2} ${bonusTags(atk)} → <b>${boss.name}</b>에게 데미지 <b>${fmt(atk.damage)}</b>${calcLine(mole,boss,atk)}`);
    }
  }
  // Z honey badger's doubled dice (sum <= 6) summon the existing Header card.
  const summonedId=chk.ok ? matchingDiceSummon(mole,m1,m2) : null;
  const summoned=data.moles.find(card => card.id===summonedId);
  if(summoned && bossHp>0){
    const cameo=resolveAttack(summoned,boss,m1,m2,null,{lastOpponentDiceSum:lastBossDiceSum});
    step(`⚡ ${mole.name} 더블 특수: ${summoned.name} 소환!`);
    log(`<span class="tag">🐾 Z 특수 · ${m1}+${m2}: 헤더가 등장해 함께 공격!</span>`);
    await animateCombat('mole',cameo.damage,boss.name,()=>hitBoss(cameo.damage),{phase:'special'});
    log(`💥 <b>헤더 소환 공격</b> · ${fmt(cameo.damage)} 피해`);
    if(bossHp<=0){step(`🎉 LV${boss.level} 사냥 성공!`);log(`🎉 <b>LV${boss.level} ${boss.name}</b> 사냥 성공!`);return end(true);}
  }
  // Two dice >=10 summons Aiden's jellyfish. 30 is the attack STAT from the
  // card effect; the resolved hit still uses ordinary dice/defense battle rules.
  if (chk.ok && isAidenJellyfishRoll(mole,m1,m2)) {
    aidenShockTurns=AIDEN_DOT_TURNS;
    renderBoss();
    log(`<span class="tag">🪼 에이든 대왕 해파리 소환! 공격력 30 · 다음 3턴 동안 감전 피해 2~5</span>`);
    step('🪼 대왕 해파리 소환: 공격력 30 · 감전 3턴 예약');
  }
  if(bossHp<=0){step(`🎉 LV${boss.level} 사냥 성공!`);log(`🎉 <b>LV${boss.level} ${boss.name}</b> 사냥 성공!`);return end(true);}
  lastMoleDiceSum=moleDiceSum;
  // MOLEMALL_CHARACTER_FX: Jacob makes non-ㅌ opponents laugh away exactly one counterattack, 10% chance.
  const jacobLaughSkip = chk.ok && shouldJacobStun(mole,boss.name);
  if(jacobLaughSkip){
    log('<span class="tag">🤡 제이콥의 몰 크라운! 웃음을 참지 못한 보스가 반격 한 턴을 쉽니다.</span>');
    step('⑥ 상대가 웃느라 반격을 한 턴 쉽니다.');
  }

  if(chk.ok)for(const proc of rollProcs(mole)){
    if(proc==='rollOpponentDie'){bossDieRolledBy=mole.name;log(`<span class="tag">✨ ${mole.name}의 수작! ${boss.name}의 주사위 하나는 ${mole.name}이(가) 굴린다.</span>`);}
  }
  for(let i=0;i<(chk.skipTurn?2:1);i++){
    if(jacobLaughSkip){if(i===0)continue;} // MOLEMALL_CHARACTER_FX: skip the next counterattack only
    let b1=rollDie(),b2=rollDie();
    if(bossDieRolledBy){
      const by=bossDieRolledBy;bossDieRolledBy=null;
      const rr=rollOneDieFor(b1,b2);
      log(`<span class="tag">🎲 ${boss.name}의 ${rr.index+1}번째 주사위는 ${by}이(가) 굴린다! ${rr.from} → ${rr.to}</span>`);
      b1=rr.d1;b2=rr.d2;
    }
    step('⑥ 보스 반격: 주사위 굴리는 중…');
    await animate('dice',b1,b2,'b');
    showDice('b',b1,b2);
    // Henry double: opponent's attack STAT (not total damage) is forced to 1 for this counterattack.
    const henryHalo = mole.id==='henry' && chk.ok && m1===m2;
    const counter=resolveAttack(boss,mole,b1,b2,atk,{lastOpponentDiceSum:lastMoleDiceSum,...(henryHalo?{forceAttackStat:1}:{})});
    if(henryHalo)log('<span class="tag">✨ 헨리 더블! 후광과 미소 → 보스 공격력 1 고정</span>');
    if(mole.id==='kade' && m1===m2){counter.damage=Math.max(0,Math.round((counter.effAttack/2-counter.effDefense*2)*10)/10);log('<span class="tag">🛡️ 케이드 더블: 방어 2배 / 상대 공격 반감</span>');}
    if(mole.id==='kade' && denHp<=DEN_HP*.2){const reroll=rollDie();log(`<span class="tag">🎲 케이드 위기 재굴림: ${reroll}</span>`);if(reroll===1){counter.damage=0;log('<span class="tag">🛡️ 케이드 공격 무효!</span>');}}

    await animateCombat('boss',counter.damage,'두더지 굴', () => { denHp=Math.max(0,denHp-counter.damage);renderDen(); });
    lastBossDiceSum=b1+b2;
    if(lastBossDiceSum<=6) ianBonusCount++;
    step(`⑦ 보스 ${b1}+${b2}, 두더지 굴 피해 ${fmt(counter.damage)} / 남은 HP ${fmt(Math.max(0,denHp))}`);
    log(`🦣 <b>${boss.name}</b> 반격${i?' (한 번 더!)':''} 🎲 ${b1}+${b2} ${bonusTags(counter)} → 두더지 굴에 데미지 <b>${fmt(counter.damage)}</b>${calcLine(boss,mole,counter)}`);
    if(denHp<=0){step('💀 사냥 실패');log(`💀 두더지 굴이 무너졌다… <b>${boss.name}</b> 사냥 실패`);return end(false);}
  }
  selectedMole=null;setBusy(false);$('drawBtn').disabled=false;
  turnNumber++;$('turnLabel').textContent=`TURN ${String(turnNumber).padStart(2,'0')}`;
  $('cardState').textContent='이전 출전';$('phaseBadge').textContent='카드 대기';
  $('stageVisual').textContent='🃏 다음 카드를 뽑아주세요';
  $('arenaStatus').textContent='다음 두더지 카드를 뽑아주세요.';
}
function end(won){
  gameOver=true;
  if(won) {
    clearedBossIds.add(boss.id);
    saveProgress();
  }
  setBusy(false);
  $('phaseBadge').textContent=won?'사냥 성공':'사냥 종료';
  $('resultBanner').hidden=false;
  $('resultBanner').innerHTML=won?`✦ LV${level} 사냥 성공!<small>${boss.name}에게 승리했어요.</small>`:'사냥 실패<small>두더지 굴이 무너졌어요. 다시 도전해 보세요.</small>';
  $('arenaStatus').textContent=won?'🎉 보스 사냥 성공!':'💀 두더지 굴이 무너졌습니다.';
  $('drawBtn').disabled=true;$('rollBtn').disabled=true;
  const btn=$('nextBtn'),hasNext=won&&canEnterStage(data.bosses,clearedBossIds,level+1);
  btn.hidden=false;btn.textContent=hasNext?`다음 레벨 (LV${level+1})`:won?'LV1 다시 시작':'다시 도전';
  btn.onclick=()=>startStage(hasNext ? level+1 : won ? 1 : level, { restoreDen: !hasNext });
}

function startStage(nextLevel, { restoreDen = true } = {}) {
  if (busy || !data || !canEnterStage(data.bosses, clearedBossIds, nextLevel)) return;
  level = nextLevel;
  selectedMole = null;
  turnNumber = 1;
  lastMoleDiceSum = null;
  lastBossDiceSum = null;
  bossDieRolledBy = null;
  if (restoreDen || !Number.isFinite(denHp)) denHp = DEN_HP;
  $('nextBtn').hidden = true;
  $('turnLabel').textContent = 'TURN 01';
  $('cardState').textContent = '미리보기';
  $('rollBtn').disabled = true;
  $('log').replaceChildren();
  for (const id of ['arenaMole', 'arenaBoss']) $(id).classList.remove('attack', 'hit');
  $('damageFloat').classList.remove('show');
  $('damageFloat').textContent = '';
  $('impactBurst').classList.remove('show');
  for (const prefix of ['m', 'b']) {
    for (const index of [1, 2]) {
      const die = $(prefix + index);
      die.textContent = '?';
      die.classList.remove('rolling-die');
      die.removeAttribute('data-value');
      die.removeAttribute('aria-label');
    }
    $(prefix + 'Sum').textContent = '—';
  }
  renderMole(data.moles.find(mole => mole.id === 'harper') ?? data.moles[0]);
  spawnBoss(level);
  renderDen();
  step(`LV${level} ${boss.name} · 카드를 뽑아주세요.`, true);
  $('stageVisual').innerHTML = '<div class="stage-label">카드를 뽑아 시작하세요</div>';
  $('drawBtn').disabled = false;
  setBusy(false);
}

function reportError(error) {
  console.error('미니게임 오류:', error);
  setBusy(false);
  $('drawBtn').disabled = true;
  $('rollBtn').disabled = true;
  $('phaseBadge').textContent = '불러오기 오류';
  $('arenaStatus').textContent = '게임을 불러오지 못했습니다. 다시 불러오기를 눌러주세요.';
  $('nextBtn').hidden = false;
  $('nextBtn').textContent = '다시 불러오기';
  $('nextBtn').onclick = () => location.reload();
}
$('soundBtn').addEventListener('click', () => {
  muted = !muted;
  if (!muted) { unlockAudio(); sound('shuffle'); }
  $('soundBtn').setAttribute('aria-pressed', String(muted));
  $('soundBtn').setAttribute('aria-label', muted?'효과음 켜기':'효과음 끄기');
  $('soundBtn').innerHTML = muted?'♫ <span>소리 꺼짐</span>':'♪ <span>소리 켜짐</span>';
});
$('drawBtn').addEventListener('click', () => drawCard().catch(reportError));
$('rollBtn').addEventListener('click', () => turn().catch(reportError));
fetch('../data/cards.json', { cache: 'no-store' }).then(r => {
  if (!r.ok) throw new Error(`카드 데이터 HTTP ${r.status}`);
  return r.json();
}).then(json => {
  data = { ...json, moles: json.moles.filter(m => !m.placeholder), bosses: buildBossStages(json.bosses) };
  if (!data.moles.length || !data.bosses.some(b=>b.level===1)) throw new Error('카드 또는 보스 데이터가 없습니다.');
  restoreProgress();
  renderBossPath();
  const requestedLevel = Number(new URLSearchParams(location.search).get('level'));
  startStage(canEnterStage(data.bosses, clearedBossIds, requestedLevel) ? requestedLevel : getUnlockedLevel(data.bosses, clearedBossIds));
}).catch(reportError);

// molemall-arrow-shortcuts-v2
window.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
  const active = document.activeElement;
  if (active && (active.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName))) return;
  const buttonId = event.key === 'ArrowLeft' ? 'drawBtn' : event.key === 'ArrowRight' ? 'rollBtn' : null;
  if (!buttonId) return;
  const button = document.getElementById(buttonId);
  if (!button || button.disabled) return;
  event.preventDefault();
  button.click();
});
