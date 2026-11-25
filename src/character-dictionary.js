/** MOLEMALL 3D collectible cards. All live stats and abilities come from data/cards.json. */
import { CHARACTER_FX, createScene, $escape, playCharacterSound } from './character-fx.js?v=character-refresh-20261125';
const $ = s => document.querySelector(s);
const esc = $escape;
const artBase = '../assets/moles/detail/';
const modes = {idle:'기본 상태',attack:'공격',special:'특수 연출'};
const statTypes = [['attack','⚔️ 공격'],['defense','🛡 방어'],['dominance','👑 지배'],['empathy','💗 공감']];
const revisedArt = {
  z: [['z-idle'], ['z-spikes','quill'], ['header-berserker','summon-circle']],
  l: [['l-idle'], ['l-reveal','poison','skull'], ['l-reveal','skull']],
  header: [['header-idle'], ['header-berserker','money'], ['header-berserker','coin']],
  andrew: [['andrew-salute','andrew-discipline','andrew-idle'], ['andrew-kick','ball'], ['andrew-kick','banner']],
  aiden: [['aiden-idle'], ['aiden-bubbles'], ['aiden-summon']],
  sally: [['sally-idle'], ['sally-swing','hammer'], ['sally-drop','diamond']],
  henry: [['henry-idle'], ['henry-charge','glasses'], ['henry-coat']]
};
const regularSpecialArt = new Set(['hailey']);
const sprite = (name, className = '') => `<img class="${className}" src="../assets/fx/plush/${name}.webp" alt="">`;
const heroArt = m => revisedArt[m.id]
 ? `../assets/fx/plush/${m.id}-idle.webp`
 : art(m.id,'hero');

function sceneArt(m, state, index) {
 const frames = revisedArt[m.id]?.[index];
 if (!frames) {
  const part = state === 'special' && !regularSpecialArt.has(m.id) ? 'flow' : state;
  return `<img src="${art(m.id,part)}" alt="">`;
 }
 return frames.map((name, i) => sprite(name, i === 0 ? 'mfx-thumb-pose' : 'mfx-thumb-prop')).join('');
}
let all=[],selected=null,mode='idle',opponent='태티서',beforeFocus=null;
const layer=document.createElement('div'); layer.id='mfx-detail-screen'; layer.hidden=true;layer.setAttribute('role','presentation');document.body.append(layer);
const art=(id,part)=>`${artBase}${encodeURIComponent(id)}-${part}.webp?v=z-l-boss-final-20261124`;
const heading=m=>m.nickname||m.trait||'두더지 카드';
const statBadges=m=>statTypes.map(([key,label])=>`<span class="mfx-live-stat">${label} <b>${esc(m.stats?.[key]??'—')}</b></span>`).join('');
const rules = m => m.secret || '별도 특수능력 없음';
function tile(m) {
 return `<div class="mfx-cover ${m.id==='sally'?'mfx-sally-backdrop':''}"><img class="mfx-d3-thumb" src="${heroArt(m)}" alt="${esc(m.name)} 3D 카드 일러스트" loading="lazy"></div>
 <div class="mfx-mini-details"><div class="mfx-mini-name">${esc(m.name)}<span class="mfx-mini-nick">${esc(heading(m))}</span></div><div class="mfx-mini-stats">${statBadges(m)}</div><div class="mfx-mini-trait">${esc(CHARACTER_FX[m.id]?.idle||heading(m))}</div></div>`;
}
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
 const mount=$('#mfx-stage-mount');if(mount)mount.innerHTML=createScene(selected,{mode,opponentName:opponent});
 const title=$('#mfx-state-caption');if(title)title.textContent=`${modes[mode]} · ${f[mode]||''}`;
 layer.querySelectorAll('.mfx-modes button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
}
function open(m) {
 selected=m; mode='idle';opponent=m.id==='olivia'?'션':m.id==='jacob'?'태티서':m.id==='z'?'L':m.id==='l'?'헤더':'코끼리';
 beforeFocus=document.activeElement;
 const f = CHARACTER_FX[m.id] || {idle:'기본 상태', attack:'일반 공격', special:'특수 연출'};
 const sallyBackdrop = m.id === 'sally' ? ' mfx-sally-backdrop' : '';
 const stateCards = Object.entries(modes).map(([state,label], index) => `
   <button class="mfx-state-card" type="button" data-state="${state}" data-character="${esc(m.id)}"
     aria-label="${label} 애니메이션 보기">
     <strong>${label}</strong>
     <span class="mfx-state-art${sallyBackdrop}">${sceneArt(m,state,index)}</span>
     <span class="mfx-state-description">${esc(f[state])}</span>
   </button>`).join('');
 layer.innerHTML=`<section class="mfx-modal mfx-three-d-modal" role="dialog" aria-modal="true" aria-labelledby="mfx-detail-title">
 <header class="mfx-detail-header">
  <div><h2 id="mfx-detail-title">${esc(m.name)}</h2><span>${esc(heading(m))}</span></div>
  <button class="mfx-close-modal" type="button" aria-label="팝업 닫기">✕ 닫기</button>
 </header>
 <div class="mfx-overview">
  <div class="mfx-profile">
   <div class="mfx-profile-art${sallyBackdrop}"><img src="${heroArt(m)}" alt="${esc(m.name)}"></div>
   <div class="mfx-profile-data">
    <div class="mfx-d3-statline">${statBadges(m)}</div>
    ${m.trait && m.trait !== heading(m) ? `<p class="mfx-card-trait">${esc(m.trait)}</p>` : ''}
    <strong class="mfx-rule-title">특이사항</strong>
    <p class="mfx-d3-rule">${esc(rules(m))}</p>
   </div>
  </div>
  <div class="mfx-state-grid">${stateCards}</div>
 </div>
 <section class="mfx-preview-panel" hidden aria-label="전투 애니메이션">
  <div class="mfx-preview-controls">
   <button type="button" class="mfx-back-to-card">← 카드 정보</button>
   <label>상대 <select id="mfx-target-select">${[...new Set(['L','태티서','키미','션','코끼리','헤더',...all.map(x=>x.name)])].map(t=>`<option value="${esc(t)}" ${t===opponent?'selected':''}>${esc(t)}</option>`).join('')}</select></label>
   <div class="mfx-modes">${Object.entries(modes).map(([state,label]) =>
    `<button type="button" data-mode="${state}" aria-pressed="false">${label}</button>`).join('')}</div>
  </div>
  <div class="mfx-stage-box" id="mfx-stage-mount"></div>
  <div id="mfx-state-caption" class="mfx-caption"></div>
 </section>
 </section>`;
 layer.hidden=false;document.body.style.overflow='hidden';
 layer.querySelector('.mfx-close-modal')?.focus();
}
function close() {layer.hidden=true;document.body.style.overflow='';layer.replaceChildren();selected=null;beforeFocus?.focus?.()}
layer.addEventListener('click',e=>{
 if(e.target===layer||e.target.closest('.mfx-close-modal'))return close();
 const b=e.target.closest('.mfx-modes button');if(b){mode=b.dataset.mode;renderMode();playCharacterSound(selected,mode)}
 const scene=e.target.closest('.mfx-state-card');
 const overview=layer.querySelector('.mfx-overview');
 const preview=layer.querySelector('.mfx-preview-panel');
 if (scene) {
  mode=scene.dataset.state;
  overview.hidden=true;
  preview.hidden=false;
  renderMode();
  playCharacterSound(selected,mode);
  preview.querySelector('.mfx-back-to-card').focus();
 }
 if (e.target.closest('.mfx-back-to-card')) {
  preview.hidden=true;
  preview.querySelector('#mfx-stage-mount').replaceChildren();
  overview.hidden=false;
  overview.querySelector(`[data-state="${mode}"]`)?.focus();
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
