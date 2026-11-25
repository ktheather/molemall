/** MOLEMALL 3D collectible cards. All live stats and abilities come from data/cards.json. */
import { CHARACTER_FX, createScene, $escape, playCharacterSound } from './character-fx.js?v=zl-henry-final-20261124';
const $ = s => document.querySelector(s);
const esc = $escape;
const artBase = '../assets/moles/detail/';
const modes = {idle:'기본 상태',attack:'공격',special:'특수 연출'};
const statTypes = [['attack','⚔️ 공격'],['defense','🛡 방어'],['dominance','👑 지배'],['empathy','💗 공감']];
const defaultFlow=['기본 대기','공격','특수 연출'];
let all=[],selected=null,mode='idle',opponent='태티서',beforeFocus=null;
const layer=document.createElement('div'); layer.id='mfx-detail-screen'; layer.hidden=true;layer.setAttribute('role','presentation');document.body.append(layer);
const art=(id,part)=>`${artBase}${encodeURIComponent(id)}-${part}.webp?v=z-l-boss-final-20261124`;
const heading=m=>m.nickname||m.trait||'두더지 카드';
const statBadges=m=>statTypes.map(([key,label])=>`<span class="mfx-live-stat">${label} <b>${esc(m.stats?.[key]??'—')}</b></span>`).join('');
const rules=m=>m.secret||'별도 특수능력 없음';
function tile(m) {
 const accent=CHARACTER_FX[m.id]?.accent||'#d5a66b';
 return `<div class="mfx-cover"><img class="mfx-d3-thumb" src="${art(m.id,'hero')}" alt="${esc(m.name)} 3D 카드 일러스트" loading="lazy"><div class="mfx-mini-caption">✦ 3D 카드 상세 보기 ✦</div></div>
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
 layer.querySelectorAll('.mfx-d3-scene').forEach(b=>b.classList.toggle('active',b.dataset.state===mode));
}
function open(m) {
 selected=m; mode='idle';opponent=m.id==='olivia'?'션':m.id==='jacob'?'태티서':m.id==='z'?'L':m.id==='l'?'헤더':'코끼리';
 beforeFocus=document.activeElement;
 const f=CHARACTER_FX[m.id]||{idle:'기본 상태',attack:'일반 공격',special:'특수 연출',flow:defaultFlow};
 const flow=f.flow||defaultFlow;
 layer.innerHTML=`<section class="mfx-modal mfx-three-d-modal ${m.id==='sally'?'mfx-sally-modal':''}" role="dialog" aria-modal="true" aria-label="${esc(m.name)} 3D 카드 상세 정보">
 <button class="mfx-close-modal" type="button" aria-label="팝업 닫기">✕ 닫기</button>
 <div class="mfx-d3-layout">
  <article class="mfx-d3-left">
   <div class="mfx-d3-portrait" data-character="${esc(m.id)}"><img src="${art(m.id,'hero')}" alt="${esc(m.name)}의 입체적인 3D 인형 캐릭터"><div class="mfx-d3-nameplate"><span class="mfx-d3-seal">✦</span><strong>${esc(m.name)}</strong><em>${esc(heading(m))}</em></div></div>
   <div class="mfx-d3-parchment"><div class="mfx-d3-statline">${statBadges(m)}</div><div class="mfx-d3-ribbon">특이사항</div><p class="mfx-d3-rule">${esc(rules(m))}</p></div>
  </article>
  <div class="mfx-d3-right">
   <div class="mfx-d3-scene active" data-state="idle"><div class="mfx-d3-scene-label">기본 상태</div><img src="${art(m.id,'idle')}" alt="${esc(m.name)} 기본 상태 장면"><p>${esc(f.idle||'기본 대기')}</p></div>
   <div class="mfx-d3-scene" data-state="attack"><div class="mfx-d3-scene-label">공격 연출</div><img src="${art(m.id,'attack')}" alt="${esc(m.name)} 공격 장면"><p>${esc(f.attack||'일반 공격')}</p></div>
   ${(m.id==='hailey'||m.id==='andrew'||m.id==='aiden'||m.id==='sally'||m.id==='z'||m.id==='l'||m.id==='henry')?`<div class="mfx-d3-scene mfx-d3-special-scene" data-state="special"><div class="mfx-d3-scene-label">특수 연출</div><img src="${art(m.id,'special')}" alt="${esc(m.name)} 특수 상태"><p>${esc(f.special||'특수 연출')}</p></div>`:''}
   <div class="mfx-d3-scene mfx-d3-flow-scene" data-state="special"><div class="mfx-d3-scene-label">연출 흐름 · 특수 연출</div><img src="${art(m.id,'flow')}" alt="${esc(m.name)} 특수 연출 흐름"><div class="mfx-d3-flowline">${flow.map((s,i)=>`<span><b>0${i+1}</b> ${esc(s)}</span>`).join('<i>➜</i>')}</div></div>
  </div>
 </div>
 <details class="mfx-live-preview" ${m.id==='sally'?'':'open'}><summary>▶ 전투 애니메이션 직접 보기 <small>(카드 사전과 전투 공통 연출)</small></summary>
  <div class="mfx-live-body"><div class="mfx-live-controls"><label for="mfx-target-select">상대 선택</label><select id="mfx-target-select">${[...new Set(['L','태티서','키미','션','코끼리','헤더',...all.map(x=>x.name)])].map(t=>`<option value="${esc(t)}" ${t===opponent?'selected':''}>${esc(t)}</option>`).join('')}</select><div class="mfx-modes"><button data-mode="idle" aria-pressed="true">기본 상태</button><button data-mode="attack" aria-pressed="false">공격</button><button data-mode="special" aria-pressed="false">특수 연출</button></div></div>
  <div class="mfx-stage-box" id="mfx-stage-mount"></div><div id="mfx-state-caption" class="mfx-caption"></div>
  <p class="mfx-subtext">특수 연출 미리보기는 조건 없이 재생됩니다. 실제 전투에서는 전투 규칙의 발동 조건이 적용됩니다.</p></div>
 </details>
 </section>`;
 layer.hidden=false;document.body.style.overflow='hidden';renderMode();
 layer.querySelector('.mfx-close-modal')?.focus();
}
function close() {layer.hidden=true;document.body.style.overflow='';layer.replaceChildren();selected=null;beforeFocus?.focus?.()}
layer.addEventListener('click',e=>{
 if(e.target===layer||e.target.closest('.mfx-close-modal'))return close();
 const b=e.target.closest('.mfx-modes button');if(b){mode=b.dataset.mode;renderMode();playCharacterSound(selected,mode)}
 const scene=e.target.closest('.mfx-d3-scene');if(scene){mode=scene.dataset.state;renderMode();playCharacterSound(selected,mode)}
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
