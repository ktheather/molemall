import { tile, heading, statBadges, portrait, portraitSource, rosterArt, spritePath, paintedBackdrop } from './collectible.js';
/** MOLEMALL 3D collectible cards. All live stats and abilities come from data/cards.json. */
import { CHARACTER_FX, createScene, $escape, playCharacterSound } from './character-fx.js?v=arena4';
const $ = s => document.querySelector(s);
const esc = $escape;
const modes = {idle:'기본 상태',attack:'공격 연출',special:'특수 연출'};
const phases = Object.keys(modes);
const revisedFlow = {
  z: ['가시 없이 대기','가시 성장·사방 발사','소환진·광전사 헤더'],
  l: ['후드 속 혀만 낼름','독에서 피어나는 해골 연기','지배 9↑ · 휴식 2턴 · 중독 3턴'],
  header: ['돼지 저금통 쓰담','찢어진 정장·돈다발','분노 오라·강타'],
  henry: ['후드티·안경','안경 투척·돌진','민소매·털코트 변신'],
  sally: ['황금 금고·펜과 수첩','거대 망치 연속 타격','다이아몬드 낙하']
};
const sprite = (name, className) => name === 'keycaps'
 ? `<span class="${className} mfx-keycap-cloud" aria-hidden="true"><i>Esc</i><i>Q</i><i>Ctrl</i></span>`
 : `<img class="${className}" src="${spritePath(name)}" alt="">`;

function compose(id, state, names) {
 return `<span class="mfx-composition" data-elements="${names.length}">${paintedBackdrop(id,state)}
  ${names.map((name, index) => sprite(name, index ? 'mfx-composite-prop' : 'mfx-composite-actor')).join('')}</span>`;
}

const oliviaMatchups = [['kimi','키미','분홍 하트 연기'],['sean','션','거대화·별빛 안광']];
function matchupArt(key, label, effect) {
 return `<span class="mfx-olivia-matchup">
  <img src="../assets/cards/olivia-${key}.webp" alt="${label} 상대 · ${effect}">
  <b>vs ${label} · ${effect}</b></span>`;
}

function sceneArt(m, state) {
 const frames = rosterArt[m.id];
 if (!frames) return `<span class="mfx-composition"><img src="${esc(portraitSource(m))}" alt=""></span>`;
 if (m.id === 'olivia' && state !== 'idle') {
  const art = oliviaMatchups.map(args => matchupArt(...args)).join('');
  if (state === 'attack') return `<span class="mfx-matchup-scenes">${art}</span>`;
  return `<span class="mfx-flow-art">${compose(m.id,'idle',frames[0])}${art}</span>`;
 }
 if (state === 'special') {
  return `<span class="mfx-flow-art">${frames.map((frame,i) => compose(m.id,phases[i],frame)).join('')}</span>`;
 }
 return compose(m.id,state,frames[phases.indexOf(state)]);
}
let all=[],selected=null,mode='idle',opponent='태티서',beforeFocus=null;
const layer=document.createElement('div'); layer.id='mfx-detail-screen'; layer.hidden=true;layer.setAttribute('role','presentation');document.body.append(layer);
const rules = m => m.secret || '별도 특수능력 없음';
function decorate() {
 const grid=$('#grid');if(!grid||!all.length)return;
 for (const c of grid.querySelectorAll('.card[data-id], [data-mole-id]')) {
  const id=c.dataset.id||c.dataset.moleId;
  const m=all.find(x=>x.id===id);
  if(!m||c.classList.contains('mfx-card-tile'))continue;
  c.classList.add('mfx-card-tile');c.tabIndex=0;c.setAttribute('role','button');c.setAttribute('aria-label',`${m.name} 3D 상세 카드 보기`);
  c.style.setProperty('--mfx-accent',CHARACTER_FX[id]?.accent||'#e9b268');
  c.innerHTML=tile(m);
 }
}
function renderMode() {
 if(!selected||layer.hidden)return;
 const f=CHARACTER_FX[selected.id]||{idle:'기본 대기',attack:'공격',special:'특수 연출'};
 const mount=$('#mfx-stage-mount');
 if (mount) {
  const previewMode = selected.id==='olivia' && mode!=='idle' ? 'special' : mode;
  mount.innerHTML=createScene(selected,{mode:previewMode,opponentName:opponent});
  mount.firstElementChild.insertAdjacentHTML('afterbegin', paintedBackdrop(selected.id,mode));
 }
 const title=$('#mfx-state-caption');if(title)title.textContent=`${modes[mode]} · ${f[mode]||''}`;
 layer.querySelectorAll('.mfx-d3-scene').forEach(button =>
  button.classList.toggle('mfx-active-scene', button.dataset.state === mode));
 layer.querySelectorAll('.mfx-modes button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
}
function open(m) {
 selected=m; mode='idle';opponent=m.id==='olivia'?'션':m.id==='jacob'?'태티서':m.id==='z'?'루이스':m.id==='l'?'헤더':'코끼리';
 beforeFocus=document.activeElement;
 const f = CHARACTER_FX[m.id] || {idle:'기본 상태', attack:'일반 공격', special:'특수 연출'};
 const flow = m.id==='olivia' ? ['파티장 대기','키미 · 분홍 하트 연기','션 · 거대화와 안광']
  : revisedFlow[m.id] || f.flow || Object.values(modes);
 const opponents = m.id==='olivia' ? oliviaMatchups.map(([,name])=>name)
  : [...new Set(['루이스','태티서','키미','션','코끼리','헤더',...all.map(x=>x.name)])];
 const stateCards = Object.entries(modes).map(([state,label]) => `
   <button class="mfx-d3-scene" type="button" data-state="${state}"
     aria-label="${label} 애니메이션 보기" aria-controls="mfx-live-preview">
     <strong class="mfx-d3-scene-label">${state === 'special' ? '연출 흐름 · 특수 연출' : label}</strong>
     <span class="mfx-d3-scene-art">${sceneArt(m,state)}</span>
     ${state === 'special'
       ? `<span class="mfx-d3-flowline">${flow.map((step,index) =>
          `<span><b>0${index+1}</b> ${esc(step)}</span>`).join('')}</span>
          <span class="mfx-d3-special-note">${esc(f.special)}</span>`
       : `<span class="mfx-d3-scene-caption">${esc(f[state])}</span>`}
   </button>`).join('');
 layer.innerHTML=`<section class="mfx-modal mfx-three-d-modal" data-character="${esc(m.id)}"
    role="dialog" aria-modal="true"
   aria-labelledby="mfx-detail-title" style="--mfx-accent:${f.accent || '#d5a66b'}">
 <button class="mfx-close-modal" type="button" aria-label="팝업 닫기">✕ 닫기</button>
 <div class="mfx-d3-layout">
  <article class="mfx-d3-left${m.tags?.includes('임원') ? ' mfx-executive' : ''}">
   <div class="mfx-d3-portrait">
    ${portrait(m,`${m.name} 상반신`)}
    <div class="mfx-d3-nameplate">
     <span class="mfx-d3-seal" aria-hidden="true">✦</span>
     <h2 id="mfx-detail-title">${esc(m.name)}</h2><em>${esc(heading(m))}</em>
    </div>
   </div>
   <div class="mfx-d3-parchment">
    <div class="mfx-d3-statline">${statBadges(m)}</div>
    ${m.trait && m.trait !== heading(m) ? `<p class="mfx-card-trait">${esc(m.trait)}</p>` : ''}
    <strong class="mfx-d3-ribbon">특이사항</strong>
    <p class="mfx-d3-rule">${esc(rules(m))}</p>
   </div>
  </article>
  <div class="mfx-d3-right">${stateCards}</div>
 </div>
 <details class="mfx-preview-panel" id="mfx-live-preview">
  <summary>전투 애니메이션 미리보기</summary>
  <div class="mfx-preview-controls">
   <label>상대 <select id="mfx-target-select">${opponents.map(t=>`<option value="${esc(t)}" ${t===opponent?'selected':''}>${esc(t)}</option>`).join('')}</select></label>
   <div class="mfx-modes">${Object.entries(modes).map(([state,label]) =>
    `<button type="button" data-mode="${state}" aria-pressed="false">${label}</button>`).join('')}</div>
  </div>
  <div class="mfx-stage-box" id="mfx-stage-mount"></div>
  <div id="mfx-state-caption" class="mfx-caption"></div>
 </details>
 </section>`;
 layer.querySelector('.mfx-preview-panel').addEventListener('toggle', (event) => {
  if (event.currentTarget.open && !event.currentTarget.querySelector('.mfx-scene')) renderMode();
 });
 layer.hidden=false;document.body.style.overflow='hidden';
 layer.querySelector('.mfx-close-modal')?.focus();
}
function close() {layer.hidden=true;document.body.style.overflow='';layer.replaceChildren();selected=null;beforeFocus?.focus?.()}
layer.addEventListener('click',e=>{
 if(e.target===layer||e.target.closest('.mfx-close-modal'))return close();
 const b=e.target.closest('.mfx-modes button');if(b){mode=b.dataset.mode;renderMode();playCharacterSound(selected,mode)}
 const scene=e.target.closest('.mfx-d3-scene');
 if (scene) {
  mode=scene.dataset.state;
  const preview=layer.querySelector('.mfx-preview-panel');
  preview.open=true;
  renderMode();
  playCharacterSound(selected,mode);
  preview.querySelector('summary').focus();
 }
});
layer.addEventListener('change',e=>{if(e.target.id==='mfx-target-select'){opponent=e.target.value;renderMode()}});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!layer.hidden){e.preventDefault();close();return}
 const c=e.target.closest?.('#grid .mfx-card-tile');
 if(c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopImmediatePropagation();const m=all.find(x=>x.id===(c.dataset.id||c.dataset.moleId));if(m)open(m)}
},true);
document.addEventListener('click',e=>{
 const c=e.target.closest?.('#grid .mfx-card-tile');if(!c)return;
 const m=all.find(x=>x.id===(c.dataset.id||c.dataset.moleId));if(!m)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 const old=$('#detail');if(old)old.hidden=true;open(m);
},true);
const observer=new MutationObserver(decorate);
if($('#grid'))observer.observe($('#grid'),{childList:true,subtree:false});
fetch('../data/cards.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Cards '+r.status);return r.json()}).then(json=>{
 all=(json.moles||[]).filter(m=>!m.placeholder);decorate();
}).catch(err=>console.warn('3D 카드 사전 초기화 실패:',err));
