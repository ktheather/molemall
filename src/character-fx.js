/** Shared visual direction for the card dictionary and live battle.
 * No game state is mutated here. Stat/turn changes live in the battle engine.
 */
export const CHARACTER_FX = Object.freeze({
  header: { label: '헤더', accent: '#ff5b78', prop: '🐷', idle: '분홍색 돼지 저금통을 쓰다듬는 날카로운 숏컷·세미정장 헤더', attack: '돈다발을 흩뿌리며 전진 일격', special: '붉은 분노 오라 폭발', flow: ['돼지 저금통 쓰담', '돈다발 폭풍', '분노 오라·강타'] },
  kimi: { label: '키미', accent: '#d79bff', prop: '📸', idle: '리듬을 타며 찰칵찰칵', attack: '셔터·눈부신 플래시', special: '록스타 무대 조명', flow: ['카메라 셔터', '플래시 번쩍', '록스타 조명'] },
  harper: { label: '하퍼', accent: '#f0b735', prop: '⌨️', idle: '기존 외형 그대로 · 눈 밑 다크서클과 지친 표정 · 키보드를 도각도각', attack: '태양이 검게 변하고 키캡 폭발', special: '빠른 돌진과 강타', flow: ['도각도각 키보드', '검은 태양·키캡 폭발', '돌진·강타'] },
  eden: { label: '이든', accent: '#e5b648', prop: '👑', idle: '임원의 여유롭고 단정한 대기', attack: '손짓으로 상대를 밀어붙임', special: '금빛 권위 오라', flow: ['여유로운 임원', '압박 손짓', '황금빛 권위'] },
  ian: { label: '이안', accent: '#62c9ff', prop: '🚩', idle: '안내 깃발을 살랑살랑', attack: '계산기 투척 → 깃발 삿대질 → 사자후', special: '주사위 합 7 이상일 때 출격', flow: ['깃발 살랑', '계산기 투척·사자후', '조건 충족 출격'] },
  kade: { label: '케이드', accent: '#92ddff', prop: '🦴', idle: '마시마로를 닮은 둥글고 나른한 수비 자세', attack: '마시마로 외형을 유지한 채 골육봉을 크게 휘둘러 타격', special: '더블 주사위일 때 이중 방어막', flow: ['나른한 수비', '골육봉 휘두르기', '더블 이중 방어막'] },
  olivia: { label: '올리비아', accent: '#ff96c0', prop: '🎂', idle: '기존 원화 외형 그대로 축하 인사를 건네기', attack: '상대를 축하하며 케이크와 꽃가루를 날림', special: '키미: 하트 연기 / 션: 표창 안광·거대화·분노', flow: ['반갑게 축하하기', '케이크·꽃가루 축하', '키미 하트 / 션 분노'] },
  jacob: { label: '제이콥', accent: '#fa6a63', prop: '🤡', idle: '따봉하며 광대 인형 둘이 머리 주변 회전', attack: '일반 공격은 따봉 자세 유지', special: 'ㅌ 초성 상대: 공포 광대 페이드 → 표창 안광 → 공격력 50', flow: ['인형 둘이 빙글빙글', '공포 광대 페이드', '표창 안광·공격 50'] },
  sally: { label: '샐리', accent: '#f4d36f', prop: '💎', idle: '상대를 하찮게 바라보며 펜과 수첩을 들고 대기', attack: '펜·수첩을 내려놓고 거대한 망치를 꺼내 6의 공격을 연속으로 분배', special: '4회 이상 타격하면 다이아몬드가 떨어져 추가 피해 6', flow: ['무작위 2~6회 연속 타격 · 합계 6', '4회 이상 타격 여부 확인', '다이아몬드 추가 공격 6'] },
  aiden: { label: '에이든', accent: '#a78afb', prop: '🪼', idle: '꽃 모양 이펙트가 주위를 둥실둥실', attack: '초롱초롱한 눈으로 가느다란 막대를 물고 비눗방울을 후후 불기', special: '주사위 합 10 이상: 대왕 해파리 감전 공격력 30 · 이후 3턴간 2~5 피해', flow: ['주변에 꽃 이펙트', '가느다란 막대 · 비눗방울', '해파리 소환 · 감전'] },
  hailey: { label: '헤일리', accent: '#c8d9db', prop: '🍎', idle: '은사과를 쓰담쓰담', attack: '안경을 끼면서 은사과를 집어던짐', special: '뒤 배경에 사과나무가 자라남', flow: ['은사과 쓰담', '안경 장착 · 은사과 투척', '사과나무 성장'] },
  henry: { label: '헨리', accent: '#f0c68a', prop: '✨', idle: '검정 후드티와 안경으로 여유롭게 대기', attack: '날렵하게 돌진하고 후드티를 벗을 준비', special: '더블 주사위: 미소·후광 발동 → 민소매·털코트 진화, 상대 공격력 1', flow: ['검정 후드티 기본 상태', '더블 주사위 · 후광', '민소매 · 털코트 진화'] },
  z: { label: 'Z', accent: '#ff594e', prop: '🦡', idle: '느긋하게 누운 벌꿀오소리 · 위협적인 가시', attack: '두더지 천적의 가시 돌진 · 공격력 16', special: '더블 주사위 합 6 이하 → 헤더 소환 공격', flow: ['오소리 가시 무장', '두더지 상대 16 공격', '더블 합 6 이하: 헤더 출현'] },
  l: { label: 'L', accent: '#a66cfc', prop: '🐍', idle: '두더지 탈 안에 숨어 있는 뱀', attack: '탈 아래에서 뱀의 눈과 혀가 드러남', special: 'ㅌ 이외 두더지 상대 공격 10 · 공감 5', flow: ['두더지 탈 위장', '뱀의 독기와 시선', '조건 충족 시 공격 10 · 공감 5'] },
  andrew: { label: '앤드류', accent: '#f8a93c', prop: '⚽', idle: '충성 → 얼차려 → 차렷 자세 반복', attack: '빵빠레와 불꽃 축구 슛', special: '플랜카드가 쫙 펼쳐짐', flow: ['충성 · 얼차려 · 차렷', '빵빠레와 불꽃 슛', '플랜카드 전개'] }
});
// Existing production plush renders are the consistent three-dimensional
// encyclopedia art; keep the original 2D portraits available to other screens.
const DICTIONARY_PLUSH = Object.freeze({
  header:'header', kimi:'kimi', harper:'harper', eden:'eden',
  hailey:'hailey', andrew:'andrew', ian:'ian', kade:'kade', olivia:'olivia'
});
export function characterPortrait(mole) {
  const plush=DICTIONARY_PLUSH[mole?.id];
  return plush ? `assets/moles/plush/${plush}.png` : String(mole?.image||'');
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
export function animationModeFor(mole, { phase = 'attack', opponentName = '', diceSum = null, doubles = false } = {}) {
  const id = mole?.id;
  if (phase === 'idle') return 'idle';
  if (phase === 'special') return 'special';
  if (id === 'aiden' && diceSum !== null && diceSum >= 10) return 'special';
  if (id === 'jacob' && startsWithTie(opponentName)) return 'special';
  if (id === 'jacob') return 'idle'; // ordinary attack deliberately stays thumbs-up
  if (id === 'olivia' && (opponentName === '션' || opponentName === '키미')) return 'special';
  if (id === 'kade' && doubles) return 'special';
  if (id === 'ian' && diceSum !== null && diceSum >= 7) return 'special';
  if (id === 'eden' && diceSum === 12) return 'special';
  if (id === 'harper' && doubles) return 'special';
  if (id === 'henry' && doubles) return 'special';
  if (id === 'z' && doubles && diceSum !== null && diceSum <= 6) return 'special';
  if (id === 'l' && !startsWithTie(opponentName)) return 'special';
  return 'attack';
}
function layers(id) {
  let extra = '';
  if(id==='jacob') extra += '<div class="mfx-orbit"><img class="mfx-toy mfx-toy-red" src="../assets/fx/toy-red.png" alt=""><img class="mfx-toy mfx-toy-green" src="../assets/fx/toy-green.png" alt=""></div><img class="mfx-ghost" src="../assets/fx/ghost-clown.png" alt=""><span class="mfx-star-eyes" aria-hidden="true">✴ ✴</span>';
  if(id==='header') extra += '<span class="mfx-pig" aria-hidden="true">🐷<small>🪙</small></span><div class="mfx-money" aria-hidden="true">💵 💸 💵</div>';
  if(id==='kimi') extra += '<span class="mfx-camera" aria-hidden="true">📸</span><div class="mfx-flash"></div><div class="mfx-concert" aria-hidden="true">🎸 ✦ ♪</div>';
  if(id==='harper') extra += '<span class="mfx-baby-sun" aria-hidden="true">☀️<b>👶</b></span><span class="mfx-keyboard" aria-hidden="true">⌨️</span><span class="mfx-keycaps" aria-hidden="true">Q　A　⏎　X　⌘</span>';
  if(id==='eden') extra += '<div class="mfx-crown" aria-hidden="true">👑</div><div class="mfx-gold-aura"></div>';
  if(id==='ian') extra += '<span class="mfx-flag" aria-hidden="true">🚩</span><span class="mfx-calculator" aria-hidden="true">🧮</span><span class="mfx-roar" aria-hidden="true">으아아!</span>';
  if(id==='kade') extra += '<span class="mfx-bone" aria-hidden="true">🦴</span><span class="mfx-guard" aria-hidden="true">🛡</span><span class="mfx-star-eyes">✴ ✴</span>';
  if(id==='olivia') extra += '<span class="mfx-cake" aria-hidden="true">🎂</span><span class="mfx-hearts" aria-hidden="true">💗 💕 💗</span><span class="mfx-star-eyes">✴ ✴</span>';
  if(id==='sally') extra += '<span class="mfx-sally-ledger" aria-hidden="true">📒 ✒️</span><span class="mfx-sally-hammer" aria-hidden="true">🔨</span><span class="mfx-sally-diamond" aria-hidden="true">💎</span>';
  if(id==='aiden') extra += '<span class="mfx-aiden-flowers" aria-hidden="true">✿ ✿ ✿</span><span class="mfx-aiden-bubbles" aria-hidden="true">◌ ○ ◯ ○</span><img class="mfx-aiden-jellyfish" src="../assets/fx/aiden-jellyfish.webp" alt=""><span class="mfx-aiden-shock" aria-hidden="true">⚡ ✦ ⚡</span>';
  if(id==='hailey') extra += '<span class="mfx-silver-apple" aria-hidden="true">🍎</span><span class="mfx-glasses" aria-hidden="true">👓</span><span class="mfx-apple-throw" aria-hidden="true">🍎</span><span class="mfx-apple-tree" aria-hidden="true">🌳🍏</span>';
  if(id==='henry') extra += '<span class="mfx-henry-halo" aria-hidden="true">✦ ✨ ✦</span><img class="mfx-henry-evolved" src="../assets/moles/henry-evolved.png" alt="">';
  if(id==='z') extra += '<span class="mfx-z-quills" aria-hidden="true">✦ ✦ ✦</span><span class="mfx-z-heather" aria-hidden="true">🐾 헤더 소환!</span>';
  if(id==='l') extra += '<span class="mfx-l-snake" aria-hidden="true">🐍</span><span class="mfx-l-curse" aria-hidden="true">☾ ✦ ☾</span>';
  if(id==='andrew') extra += '<div class="mfx-andrew-poses" aria-hidden="true"><span>충성!</span><span>얼차려!</span><span>차렷!</span></div><span class="mfx-andrew-fanfare" aria-hidden="true">🎺🎉</span><span class="mfx-andrew-kick" aria-hidden="true">🔥⚽</span><div class="mfx-andrew-banner" aria-hidden="true">🏆 신고포상 🏆</div>';
  if(!extra) extra += '<div class="mfx-magic" aria-hidden="true">✧ ✨ ✧</div>';
  return `${extra}<span class="mfx-attack-swish" aria-hidden="true"></span>`;
}
export function createScene(mole, { mode = 'idle', opponentName = '', compact = false }={}) {
  const id = CHARACTER_FX[mole?.id] ? mole.id : 'generic';
  const fx=CHARACTER_FX[id];
  const imgSrc = characterPortrait(mole).replace(/^(\.\.\/)+/,'');
  const specialOpponent = opponentName === '션' ? 'sean' : opponentName === '키미' ? 'kimi' : startsWithTie(opponentName) ? 'tie' : 'other';
  return `<div class="mfx-scene mfx-${id} mfx-phase-${mode}${compact?' mfx-compact':''}" data-opponent="${specialOpponent}" style="--mfx-accent:${fx?.accent || '#e9b368'}">
      <div class="mfx-floor"></div><div class="mfx-sparkles" aria-hidden="true">✦　✧　✦</div>
      <img class="mfx-mole-img" src="../${$escape(imgSrc)}" alt="${$escape(mole?.name)}" loading="eager">
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
  root.querySelectorAll('.mfx-henry-halo,.mfx-henry-evolved,.mfx-z-quills,.mfx-z-heather,.mfx-l-snake,.mfx-l-curse,.mfx-sally-ledger,.mfx-sally-hammer,.mfx-sally-diamond,.mfx-orbit,.mfx-ghost,.mfx-star-eyes,.mfx-pig,.mfx-money,.mfx-camera,.mfx-flash,.mfx-concert,.mfx-baby-sun,.mfx-keyboard,.mfx-keycaps,.mfx-crown,.mfx-gold-aura,.mfx-flag,.mfx-calculator,.mfx-roar,.mfx-bone,.mfx-guard,.mfx-cake,.mfx-hearts,.mfx-magic,.mfx-attack-swish,.mfx-silver-apple,.mfx-glasses,.mfx-apple-throw,.mfx-apple-tree,.mfx-andrew-poses,.mfx-andrew-fanfare,.mfx-andrew-kick,.mfx-andrew-banner,.mfx-aiden-flowers,.mfx-aiden-bubbles,.mfx-aiden-jellyfish,.mfx-aiden-shock').forEach(n=>n.remove());
  root.insertAdjacentHTML('beforeend',layers(id));
}
export async function animateCharacter(mole,{root,opponentName='',phase='attack',diceSum=null,doubles=false,duration=810}={}){
  if(!root || !mole) return;
  if(!root.classList.contains('mfx-battle-root')) mountCombatCharacter(root,mole);
  const mode=animationModeFor(mole,{phase,opponentName,diceSum,doubles});
  root.classList.remove('mfx-phase-idle','mfx-phase-attack','mfx-phase-special','mfx-now-playing');
  root.dataset.opponent=opponentName==='션'?'sean':opponentName==='키미'?'kimi':startsWithTie(opponentName)?'tie':'other';
  void root.offsetWidth;
  root.classList.add('mfx-phase-'+mode,'mfx-now-playing');
  await new Promise(r=>setTimeout(r,duration));
  root.classList.remove('mfx-phase-attack','mfx-phase-special','mfx-now-playing');
  root.classList.add('mfx-phase-idle');
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
    const freqs=id==='kimi'?[850,1100]:id==='harper'?[300,390,280]:id==='ian'?[190,160]:id==='jacob'?[440,590,740]:[360,450];
    const gain=soundCtx.createGain(); gain.gain.setValueAtTime(0.0001,now);gain.connect(soundCtx.destination);
    gain.gain.exponentialRampToValueAtTime(mode==='idle'?.025:.055,now+.01);
    gain.gain.exponentialRampToValueAtTime(.0001,now+.3);
    freqs.forEach((f,i)=>{const osc=soundCtx.createOscillator();osc.type=id==='kimi'?'square':id==='ian'?'sawtooth':'triangle';osc.frequency.value=f;osc.connect(gain);osc.start(now+i*.07);osc.stop(now+i*.07+.09);});
  }catch(_){/* graceful mute on browsers blocking audio */}
}
