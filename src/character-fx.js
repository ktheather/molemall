import { battleArt } from './battle-art.js?v=arena4';
/** Shared visual direction for the card dictionary and live battle.
 * No game state is mutated here. Stat/turn changes live in the battle engine.
 */
export const CHARACTER_FX = Object.freeze({
  header: { label: '헤더', accent: '#ff5b78', prop: '🐷', idle: '분홍색 돼지 저금통을 쓰다듬는 날카로운 숏컷·세미정장 헤더', attack: '광전사로 변하며 정장이 찢어지고 거대한 돈다발로 강타', special: '너덜너덜한 정장 차림으로 붉은 분노 오라를 일으킴', flow: ['돼지 저금통 쓰담', '돈다발 폭풍', '분노 오라·강타'] },
  kimi: { label: '키미', accent: '#d79bff', prop: '📸', idle: '리듬을 타며 찰칵찰칵', attack: '셔터·눈부신 플래시', special: '록스타 무대 조명', flow: ['카메라 셔터', '플래시 번쩍', '록스타 조명'] },
  harper: { label: '하퍼', accent: '#f0b735', prop: '⌨️', idle: '기존 외형 그대로 · 눈 밑 다크서클과 지친 표정 · 키보드를 도각도각', attack: '태양이 검게 변하고 키캡 폭발', special: '빠른 돌진과 강타', flow: ['도각도각 키보드', '검은 태양·키캡 폭발', '돌진·강타'] },
  eden: { label: '이든', accent: '#e5b648', prop: '👑', idle: '임원의 여유롭고 단정한 대기', attack: '손짓으로 상대를 밀어붙임', special: '금빛 권위 오라', flow: ['여유로운 임원', '압박 손짓', '황금빛 권위'] },
  ian: { label: '이안', accent: '#62c9ff', prop: '🚩', idle: '안내 깃발을 살랑살랑', attack: '계산기 투척 → 깃발 삿대질 → 사자후', special: '주사위 합 7 이상일 때 출격', flow: ['깃발 살랑', '계산기 투척·사자후', '조건 충족 출격'] },
  kade: { label: '케이드', accent: '#92ddff', prop: '🦴', idle: '마시마로를 닮은 둥글고 나른한 수비 자세', attack: '마시마로 외형을 유지한 채 골육봉을 크게 휘둘러 타격', special: '더블 주사위일 때 이중 방어막', flow: ['나른한 수비', '골육봉 휘두르기', '더블 이중 방어막'] },
  olivia: { label: '올리비아', accent: '#ff96c0', prop: '🎂', idle: '파티 모자를 쓰고 작은 케이크 옆에서 꾸벅꾸벅', attack: '키미에게는 분홍 하트 연기, 션에게는 거대화와 별빛 안광', special: '키미: 하트 연기 / 션: 표창 안광·거대화·분노', flow: ['반갑게 축하하기', '케이크·꽃가루 축하', '키미 하트 / 션 분노'] },
  jacob: { label: '제이콥', accent: '#fa6a63', prop: '🤡', idle: '따봉하며 광대 인형 둘이 머리 주변 회전', attack: '일반 공격은 따봉 자세 유지', special: 'ㅌ 초성 상대: 공포 광대 페이드 → 표창 안광 → 공격력 50', flow: ['인형 둘이 빙글빙글', '공포 광대 페이드', '표창 안광·공격 50'] },
  sally: { label: '샐리', accent: '#f4d36f', prop: '💎', idle: '두더지 중 가장 부유한 샐리. 황금 금고에서 펜과 수첩을 들고 대기', attack: '펜·수첩을 내려놓고 거대한 망치를 꺼내 6의 공격을 연속으로 분배', special: '4회 이상 타격하면 다이아몬드가 떨어져 추가 피해 6', flow: ['무작위 2~6회 연속 타격 · 합계 6', '4회 이상 타격 여부 확인', '다이아몬드 추가 공격 6'] },
  aiden: { label: '에이든', accent: '#a78afb', prop: '🪼', idle: '꽃 모양 이펙트가 주위를 둥실둥실', attack: '초롱초롱한 눈으로 가느다란 막대를 물고 비눗방울을 후후 불기', special: '주사위 합 10 이상: 대왕 해파리 감전 공격력 30 · 이후 4턴간 2~4 피해', flow: ['주변에 꽃 이펙트', '가느다란 막대 · 비눗방울', '해파리 소환 · 감전'] },
  hailey: { label: '헤일리', accent: '#c8d9db', prop: '🍎', idle: '은사과를 쓰담쓰담', attack: '안경을 끼면서 은사과를 집어던짐', special: '뒤 배경에 사과나무가 자라남', flow: ['은사과 쓰담', '안경 장착 · 은사과 투척', '사과나무 성장'] },
  henry: { label: '헨리', accent: '#f0c68a', prop: '✨', idle: '검정 후드티와 안경으로 여유롭게 대기', attack: '안경을 집어던지고 후드티 차림으로 빠르게 돌진', special: '더블 주사위 · 민소매와 털코트로 갈아입으며 후광 발동. 상대 공격력 1', flow: ['검정 후드티 기본 상태', '더블 주사위 · 후광', '민소매 · 털코트 진화'] },
  z: { label: 'Z', accent: '#ff594e', prop: '🦡', idle: '가시 없이 느긋하게 누운 벌꿀오소리', attack: '몸에서 가시가 자라나 사방으로 발사. 두더지 상대 공격력 16', special: '더블 주사위 합 6 이하 · 하늘에 소환진이 열리고 광전사 헤더가 낙하', flow: ['오소리 가시 무장', '두더지 상대 16 공격', '더블 합 6 이하: 헤더 출현'] },
  l: { label: '루이스', accent: '#a66cfc', prop: '🐍', idle: '흰 두더지 후드로 뱀 얼굴을 가리고 혀만 낼름', attack: '뱀 얼굴을 드러내고 형광 녹색 독을 발사. 보라색 해골 연기가 피어오름', special: '상대 지배력 9 이상 · 공격력 30 · 휴식 2턴 · 3턴간 5~10 중독 피해', flow: ['두더지 탈 위장', '뱀의 독기와 시선', '조건 충족 시 공격 10 · 공감 5'] },
  andrew: { label: '앤드류', accent: '#f8a93c', prop: '⚽', idle: '경례 → 팔굽혀펴기 얼차려 → 차렷 자세 반복', attack: '빵빠레와 불꽃 축구 슛', special: '직전 상대와 주사위 합이 같으면 공격력 20. 포상 플래카드가 펼쳐짐', flow: ['충성 · 얼차려 · 차렷', '빵빠레와 불꽃 슛', '플랜카드 전개'] }
});
const effectAsset = name => `../assets/fx/plush/${name}.webp`;
const prop = (name, className) => `<img class="mfx-plush-prop ${className}" src="${effectAsset(name)}" alt="">`;

export function characterPortrait(mole) {
  return battleArt(mole).replace(/^\.\.\//, '');
}

function pose(action, name) {
  return `<img class="mfx-pose mfx-pose-${action}" src="${effectAsset(name)}" alt="">`;
}
export const $escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CHOSEONG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
export function startsWithTie(name) {
  const c = String(name ?? '').trim()[0];
  if (!c) return false;
  const n = c.codePointAt(0);
  return c === 'ㅌ' || (n >= 0xac00 && n <= 0xd7a3 && CHOSEONG[Math.floor((n-0xac00)/588)] === 'ㅌ');
}
export function isJacobSpecial(mole, opponentName) {
  return mole?.id === 'jacob' && startsWithTie(opponentName);
}
export function shouldJacobStun(mole, opponentName, rng = Math.random) {
  return mole?.id === 'jacob' && !startsWithTie(opponentName) && rng() < .10;
}
export function animationModeFor(mole, { phase = 'attack', opponentName = '', diceSum = null, doubles = false, previousDiceSum = null } = {}) {
  const id = mole?.id;
  if (phase === 'idle') return 'idle';
  if (phase === 'special') return 'special';
  if (id === 'aiden' && diceSum !== null && diceSum >= 10) return 'special';
  if (id === 'header' && startsWithTie(opponentName)) return 'special';
  if (id === 'jacob' && startsWithTie(opponentName)) return 'special';
  if (id === 'jacob') return 'idle'; // ordinary attack deliberately stays thumbs-up
  if (id === 'olivia' && (opponentName === '션' || opponentName === '키미')) return 'special';
  if (id === 'kade' && doubles) return 'special';
  if (id === 'ian' && diceSum !== null && diceSum >= 7) return 'special';
  if (id === 'eden' && diceSum === 12) return 'special';
  if (id === 'harper' && doubles) return 'special';
  if (id === 'henry' && doubles) return 'special';
  if (id === 'andrew' && diceSum !== null && diceSum === previousDiceSum) return 'special';
  return 'attack';
}
function layers(id) {
  let extra = '';
  if(id==='jacob') extra += '<div class="mfx-orbit"><img class="mfx-toy mfx-toy-red" src="../assets/fx/toy-red.png" alt=""><img class="mfx-toy mfx-toy-green" src="../assets/fx/toy-green.png" alt=""></div><img class="mfx-ghost" src="../assets/cards/jacob-terror.webp" alt=""><span class="mfx-star-eyes" aria-hidden="true">✴ ✴</span>';
  if(id==='header') extra += `${pose('attack','header-berserker')}${prop('money','mfx-money mfx-travel')}${prop('coin','mfx-header-coin mfx-travel')}`;
  if(id==='kimi') extra += `${prop('camera','mfx-camera mfx-travel')}<div class="mfx-flash"></div>${prop('guitar','mfx-concert mfx-travel')}`;
  if(id==='harper') extra += `<img class="mfx-pose mfx-pose-attack" src="../assets/cards/harper-charge.webp" alt="">${prop('sun','mfx-baby-sun')}${prop('keyboard','mfx-keyboard mfx-travel')}`;
  if(id==='eden') extra += `${prop('crown','mfx-crown mfx-travel')}<div class="mfx-gold-aura"></div>`;
  if(id==='ian') extra += `${prop('flag','mfx-flag')}${prop('calculator','mfx-calculator mfx-travel')}<span class="mfx-roar" aria-hidden="true">으아아!</span>`;
  if(id==='kade') extra += `${prop('bone','mfx-bone mfx-swing')}${prop('shield','mfx-guard mfx-grow')}<span class="mfx-star-eyes">✴ ✴</span>`;
  if(id==='olivia') extra += `${prop('cake','mfx-cake mfx-travel')}${prop('heart','mfx-hearts mfx-travel')}<span class="mfx-star-eyes">✴ ✴</span>`;
  if(id==='sally') extra += `${pose('attack','sally-swing')}${pose('special','sally-drop')}${prop('hammer','mfx-sally-hammer mfx-swing')}${prop('diamond','mfx-sally-diamond mfx-drop')}`;
  if(id==='aiden') extra += `${pose('attack','aiden-bubbles')}${pose('special','aiden-summon')}<span class="mfx-aiden-flowers" aria-hidden="true">✿ ✿ ✿</span><span class="mfx-aiden-bubbles" aria-hidden="true">◌ ○ ◯ ○</span><img class="mfx-aiden-jellyfish" src="../assets/fx/aiden-jellyfish.webp" alt=""><span class="mfx-aiden-shock" aria-hidden="true">⚡ ✦ ⚡</span>`;
  if(id==='hailey') extra += `${prop('apple','mfx-silver-apple')}${prop('glasses','mfx-glasses')}${prop('apple','mfx-apple-throw mfx-travel')}${prop('tree','mfx-apple-tree mfx-grow')}`;
  if(id==='henry') extra += `${pose('attack','henry-charge')}${pose('special','henry-coat')}${prop('glasses','mfx-henry-glasses mfx-travel')}<span class="mfx-henry-halo" aria-hidden="true"></span>`;
  if(id==='z') extra += `${pose('attack','z-spikes')}${Array.from({length:12},(_,i)=>`<span class="mfx-quill-track" style="--angle:${i*30}deg">${prop('quill','mfx-z-quill')}</span>`).join('')}${prop('summon-circle','mfx-z-circle')}${prop('header-berserker','mfx-z-drop mfx-drop')}`;
  if(id==='l') extra += `${pose('attack','l-reveal')}${prop('louis-venom','mfx-poison mfx-travel')}`;
  if(id==='andrew') extra += `${pose('salute','andrew-salute')}${pose('discipline','andrew-discipline')}${pose('attack','andrew-kick')}${prop('ball','mfx-andrew-kick mfx-travel')}${prop('trumpet','mfx-andrew-fanfare')}${prop('banner','mfx-andrew-banner mfx-grow')}`;
  if(!extra) extra += '<div class="mfx-magic" aria-hidden="true">✧ ✨ ✧</div>';
  return `<div class="mfx-layers" aria-hidden="true">${extra}<span class="mfx-attack-swish"></span></div>`;
}
export function createScene(mole, { mode = 'idle', opponentName = '', compact = false }={}) {
  const id = CHARACTER_FX[mole?.id] ? mole.id : 'generic';
  const fx=CHARACTER_FX[id];
  const imgSrc = characterPortrait(mole);
  const specialOpponent = opponentName === '션' ? 'sean' : opponentName === '키미' ? 'kimi' : startsWithTie(opponentName) ? 'tie' : 'other';
  return `<div class="mfx-scene mfx-${id} mfx-phase-${mode}${compact?' mfx-compact':''}" data-opponent="${specialOpponent}" style="--mfx-accent:${fx?.accent || '#e9b368'}">
      <div class="mfx-floor"></div><div class="mfx-sparkles" aria-hidden="true">✦　✧　✦</div>
      <img class="mfx-mole-img mfx-base-pose" src="../${$escape(imgSrc)}" alt="${$escape(mole?.name)}" loading="eager">
      ${layers(id)}
    </div>`;
}
export function mountCombatCharacter(root, mole) {
  if (!root || !mole) return;
  const id=CHARACTER_FX[mole.id] ? mole.id : 'generic';
  root.classList.add('mfx-battle-root','mfx-'+id);
  for (const cls of Array.from(root.classList)) {
    if(cls.startsWith('mfx-') && cls!=='mfx-battle-root' && cls!=='mfx-'+id) root.classList.remove(cls);
  }
  root.dataset.mfxCharacter=id;
  root.style.setProperty('--mfx-accent', CHARACTER_FX[id]?.accent || '#ffca72');
  root.querySelector('.mfx-layers')?.remove();
  root.querySelector(':scope > img')?.classList.add('mfx-base-pose');
  root.classList.add('mfx-phase-idle');
  mountIdleLayers(root, id);
}
// In combat only Andrew's three body poses belong to the idle animation.
function mountIdleLayers(root, id) {
  root.querySelector('.mfx-layers')?.remove();
  if (id === 'andrew') root.insertAdjacentHTML('beforeend',
    '<div class="mfx-layers" aria-hidden="true">'+pose('salute','andrew-salute')+pose('discipline','andrew-discipline')+'</div>');
}
export function animateCharacter(mole, {
  root, opponentName = '', phase = 'attack', diceSum = null, doubles = false,
  previousDiceSum = null, duration = 980
} = {}) {
  if (!root || !mole) return;
  if (!root.classList.contains('mfx-battle-root')) mountCombatCharacter(root, mole);
  const mode = animationModeFor(mole, {phase, opponentName, diceSum, doubles, previousDiceSum});
  root.querySelector('.mfx-layers')?.remove();
  root.insertAdjacentHTML('beforeend',layers(mole.id));
  root.style.setProperty('--mfx-duration', `${duration}ms`);
  root.classList.remove('mfx-phase-idle', 'mfx-phase-attack', 'mfx-phase-special');
  root.dataset.opponent = opponentName === '션' ? 'sean' : opponentName === '키미' ? 'kimi'
    : startsWithTie(opponentName) ? 'tie' : 'other';
  void root.offsetWidth;
  root.classList.add('mfx-phase-' + mode);
  return () => {
    mountIdleLayers(root, mole.id);
    root.classList.remove('mfx-phase-attack', 'mfx-phase-special');
    root.classList.add('mfx-phase-idle');
  };
}
let soundCtx;
export function playCharacterSound(mole,mode='idle') {
  try {
    const id=typeof mole==='string'?mole:mole?.id;
    const Ctor=window.AudioContext||window.webkitAudioContext;
    if (!Ctor) return;
    soundCtx ??= new Ctor();
    if (soundCtx.state==='suspended') void soundCtx.resume();
    const now=soundCtx.currentTime;
    const freqs=id==='andrew'?[392,523,659,784]:id==='kimi'?[850,1100]:id==='harper'?[300,390,280]:id==='ian'?[190,160]:id==='jacob'?[440,590,740]:[360,450];
    const gain=soundCtx.createGain(); gain.gain.setValueAtTime(0.0001,now);gain.connect(soundCtx.destination);
    gain.gain.exponentialRampToValueAtTime(mode==='idle'?.025:.055,now+.01);
    gain.gain.exponentialRampToValueAtTime(.0001,now+.3);
    freqs.forEach((f,i)=>{const osc=soundCtx.createOscillator();osc.type=id==='kimi'?'square':id==='ian'?'sawtooth':'triangle';osc.frequency.value=f;osc.connect(gain);osc.start(now+i*.07);osc.stop(now+i*.07+.09);});
  }catch(_){/* graceful mute on browsers blocking audio */}
}
