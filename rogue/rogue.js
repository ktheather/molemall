
import * as E from './engine.js?v=1';
import {battleArt} from '../src/battle-art.js';
import {animateCharacter,mountCombatCharacter,playCharacterSound} from '../src/character-fx.js?v=character-refresh-20261125';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const src=s=>'../'+String(s||'').replace(/^\.\.\//,'').replace(/^\//,'');
const actorImg=c=>battleArt(c);
let data,cards=[],bosses=[],run=null,selected=[],battle=null,timer=null,paused=false,speed=1,sound=true,lastOffers=null;
function card(id){return cards.find(x=>x.id===id)}
function portrait(c){return src(battleArt(c))}
function img(c){return '<img src="'+esc(portrait(c))+'" alt="'+esc(c.name)+'" loading="lazy">'}
function hp(p){return Math.max(0,Math.round(p.hp))+'/'+E.maxHP(p,run)}
function pct(value,max){return Math.max(0,Math.min(100,Math.round(value/max*100)))}
function track(p,enemy=false){const max=enemy?p.max:E.maxHP(p,run);return '<div class="health-track"><div class="health-fill'+(enemy?' enemy':'')+'" style="width:'+pct(p.hp,max)+'%"></div></div>'}
function resetTimer(){if(timer)clearInterval(timer);timer=null}
function put(html){$('app').innerHTML=html}
function btn(text,id,klass='ghost-button'){return '<button type="button" class="'+klass+'" id="'+id+'">'+text+'</button>'}
function partyLine(){return '<div class="party-line">'+run.party.map(p=>{const c=card(p.id);return '<div class="party-chip">'+img(c)+'<span><b>'+esc(c.name)+'</b><br><small>♥ '+hp(p)+' · LV'+p.level+'</small></span></div>'}).join('')+'</div>'}
function relicLine(){return '<div class="relic-list">'+(run.relics.length?run.relics.map(id=>{const r=E.relics.find(x=>x.id===id);return '<span class="relic" title="'+esc(r?.desc)+'">'+esc(r?.icon||'✨')+' '+esc(r?.name||id)+'</span>'}).join(''):'<span class="muted">아직 획득한 유물이 없습니다.</span>')+'</div>'}
function hud(){return '<div class="expedition-hud"><div class="hud-items"><span class="pill">🌲 '+esc(E.stages[run.act-1])+'</span><span class="pill">'+run.act+'막 · '+(run.step+1)+'/5</span><span class="pill">🪙 '+run.gold+'</span><span class="pill">⚔️ '+run.wins+'승</span></div><div class="progress">'+Array.from({length:5},(_,i)=>'<span class="'+(i<run.step?'done':'')+'"></span>').join('')+'</div></div>'}
function renderIntro(){
resetTimer();put('<section class="intro-hero"><div><span class="section-kicker">A NEW PLUSH ADVENTURE</span><h2>PLUSH<br>ROGUE</h2><p>두더지 카드 다섯 장으로 원정대를 꾸리고, 자동 전투와 랜덤 선택을 통해 세 개의 던전을 정복하세요. 기존 봉제인형 공격 연출과 카드 고유 능력치를 사용합니다.</p><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:22px">'+btn('✦ 새 원정 시작','new','primary-button')+(run&&run.status!=='won'&&run.status!=='lost'?btn('▶ 이어하기','continue'):'')+'</div><p class="muted">원정당 3막 · 15개 장소 · 자동 전투 · 유물과 카드 성장</p></div><div class="intro-cards">'+['header','aiden','z'].map(id=>img(card(id)||cards[0])).join('')+'</div></section>');
$('new').onclick=()=>{if(run&&run.status!=='lost'&&run.status!=='won'&&!confirm('기존 원정 진행 상황을 초기화하고 새 원정을 시작할까요?'))return;run=null;selected=[];E.clear();renderPick()};
if($('continue'))$('continue').onclick=resume;
}
function renderPick(){
resetTimer();put('<div class="section-head"><div><span class="section-kicker">STEP 01 · BUILD YOUR PARTY</span><h2>나의 원정대 편성</h2><p>카드 5장을 순서대로 고르세요. 앞의 3장이 전투에 출전하고 나머지 2장은 예비입니다.</p></div>'+btn('← 처음으로','back-intro')+'</div><div class="pick-layout"><section class="panel"><div class="roster-grid">'+cards.map(c=>{let ix=selected.indexOf(c.id);return '<button type="button" class="hero-card'+(ix>=0?' is-selected':'')+'" data-card="'+esc(c.id)+'" aria-pressed="'+(ix>=0)+'">'+(ix>=0?'<span class="selection-badge">'+(ix+1)+'번 편성</span>':'')+'<div class="portrait">'+img(c)+'</div><div class="card-info"><h3>'+esc(c.name)+'</h3><div class="stat-grid"><span>⚔ 공격 '+c.stats.attack+'</span><span>🛡 방어 '+c.stats.defense+'</span><span>👑 지배 '+c.stats.dominance+'</span><span>💗 공감 '+c.stats.empathy+'</span></div><div class="card-trait">'+esc(c.trait||c.nickname||'고유 특성 없음')+'</div></div></button>'}).join('')+'</div></section><aside class="panel pick-side"><h2>✦ 출전 순서</h2><p class="muted">5명 선택 · 첫 3명은 자동 전투</p><div class="selected-slots">'+Array.from({length:5},(_,i)=>{const c=card(selected[i]);return '<div class="slot'+(c?' filled':'')+'"><span>'+(i<3?'⚔️ 출전 ':'🛡 예비 ')+(i+1)+' · '+(c?esc(c.name):'선택 대기')+'</span>'+(c?'<button data-remove="'+i+'" aria-label="'+esc(c.name)+' 선택 취소">✕</button>':'')+'</div>'}).join('')+'</div><div class="notice">공격·방어·지배·공감 수치와 카드별 주사위 특성이 실제 전투에 반영됩니다. 쓰러진 카드는 예비 멤버가 자동으로 교체합니다.</div><button class="primary-button" id="depart" '+(selected.length===5?'':'disabled')+' style="width:100%">⚔️ 원정 출발 · '+selected.length+'/5</button></aside></div>');
document.querySelectorAll('[data-card]').forEach(el=>el.onclick=()=>{const id=el.dataset.card;const ix=selected.indexOf(id);if(ix>=0)selected.splice(ix,1);else if(selected.length<5)selected.push(id);renderPick()});
document.querySelectorAll('[data-remove]').forEach(el=>el.onclick=()=>{selected.splice(+el.dataset.remove,1);renderPick()});
$('back-intro').onclick=renderIntro;$('depart').onclick=()=>{if(selected.length!==5)return;run=E.newRun(selected,cards);E.save(run);renderMap()};
}
function renderMap(){
resetTimer();if(run.step>=5){run.step=4}
run.status='map';if(!run.routes)run.routes=E.routes(run);E.save(run);
put(hud()+'<div class="route-stage"><span class="section-kicker">STEP '+(run.step+1)+' · CHOOSE YOUR PATH</span><h2>'+esc(E.stages[run.act-1])+'</h2><p>다음 목적지를 선택하세요. 선택한 길에 따라 다른 보상과 위험이 기다립니다.</p></div><div class="route-cards">'+run.routes.map((r,i)=>'<button type="button" class="route-card" data-route="'+i+'"><span class="route-icon">'+r.icon+'</span><b>'+esc(r.name)+'</b><small>'+esc(r.desc)+'</small></button>').join('')+'</div><section class="panel"><h3>🏕️ 원정대 현황</h3>'+partyLine()+'<h3 style="margin-top:16px">✦ 보유 유물</h3>'+relicLine()+'<p class="muted">전투는 자동으로 진행됩니다. 카드의 HP는 노드 간 유지됩니다.</p></section>');
document.querySelectorAll('[data-route]').forEach(el=>el.onclick=()=>{const route=run.routes[+el.dataset.route].id;run.routes=null;if(route==='battle'||route==='elite'||route==='boss'){launchBattle(route)}else{run.pending={type:route};run.status='event';E.save(run);renderEvent()}})}
function fighterThumb(p){const c=card(p.id);return '<div class="fighter-thumb'+(p.hp<=0?' dead':'')+'">'+img(c)+'<div style="flex:1;min-width:0"><b>'+esc(c.name)+' · LV'+p.level+'</b>'+track(p)+'<small>♥ '+hp(p)+' · ⚡'+p.energy+'/100</small></div></div>'}
function updateUnits(){if(!battle)return;const e=battle.enemy;const eHp=$('enemy-hp');if(eHp)eHp.textContent=Math.ceil(e.hp)+' / '+e.max;if($('enemy-bar'))$('enemy-bar').style.width=pct(e.hp,e.max)+'%';if($('turn-count'))$('turn-count').textContent='ROUND '+(battle.turn+1);if($('team-list'))$('team-list').innerHTML=run.party.map(fighterThumb).join('');if($('battle-log'))$('battle-log').innerHTML=battle.log.map(x=>'<p>'+esc(x)+'</p>').join('');for(const p of run.party){const el=document.getElementById('unit-'+p.id);if(el)el.classList.toggle('is-dead',p.hp<=0)}}
function battleHtml(){
const e=battle.enemy;const team=run.party.slice(0,3);
return hud()+'<div class="battle-layout"><aside class="panel battle-side"><h3>⚔️ 나의 원정대</h3><div class="fighter-grid" id="team-list">'+run.party.map(fighterThumb).join('')+'</div><p class="muted">생존한 앞의 3장이 자동 출전합니다.</p></aside><section class="battle-center"><div class="arena-header"><strong>PLUSH AUTO BATTLE</strong><span class="battle-tick" id="turn-count">ROUND 1</span><span class="pill">'+(battle.route==='boss'?'👑 BOSS':battle.route==='elite'?'💀 ELITE':'⚔️ BATTLE')+'</span></div><div class="arena-stage" id="arena-stage"><div class="arena-team">'+run.party.map(p=>'<div class="arena-unit'+(p.hp<=0?' is-dead':'')+'" id="unit-'+esc(p.id)+'">'+img(card(p.id))+'<span class="unit-name">'+esc(card(p.id).name)+'</span></div>').join('')+'</div><div class="arena-team"><div class="arena-unit boss-unit" id="enemy-actor"><img src="'+esc(src(e.image))+'" alt="'+esc(e.name)+'"><span class="unit-name">'+esc(e.name)+'</span></div></div><div id="hit-effect"></div></div><div class="arena-header"><b>'+esc(e.name)+'</b><div style="flex:1;max-width:220px"><div class="health-track"><div id="enemy-bar" class="health-fill enemy" style="width:100%"></div></div></div><span class="battle-tick" id="enemy-hp">'+e.hp+' / '+e.max+'</span></div><div class="battle-controls"><span class="battle-tick" id="dice-text">🎲 준비</span><button id="pause" class="mini-button">⏸ 일시정지</button><button id="speed" class="mini-button">속도 ×1</button><select id="tactic" class="mini-button" aria-label="전투 작전"><option value="balanced">⚖️ 균형</option><option value="aggressive">⚔️ 공격</option><option value="defensive">🛡️ 방어</option></select></div></section><aside class="panel battle-side right-side"><h3>☷ 전투 로그</h3><div id="battle-log" class="battle-log" role="log" aria-live="polite"></div><div id="battle-finish"></div></aside></div>';
}
function launchBattle(route){
battle=E.startBattle(run,cards,bosses,route);run.status='battle';run.pending={type:'battle',route};E.save(run);paused=false;speed=1;
put(battleHtml());$('tactic').value=run.tactic;$('tactic').onchange=e=>{run.tactic=e.target.value;E.save(run)};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'▶ 재개':'⏸ 일시정지'};
$('speed').onclick=()=>{speed=speed===1?2:speed===2?4:1;$('speed').textContent='속도 ×'+speed;startLoop()};
startLoop();}
function startLoop(){
resetTimer();timer=setInterval(()=>{
if(!battle||battle.done||paused)return;
const action=E.tick(battle);updateUnits();
if(action){
$('dice-text').textContent='🎲 '+action.d1+' + '+action.d2+(action.db?' · 더블!':'');
const unit=$('unit-'+action.id);if(unit){
unit.classList.remove('is-attacking');void unit.offsetWidth;unit.classList.add('is-attacking');
const c=card(action.id);try{mountCombatCharacter(unit,c);animateCharacter(c,{root:unit,phase:action.mode,diceSum:action.d1+action.d2,doubles:action.db,opponentName:battle.enemy.name,duration:650});if(sound)playCharacterSound(c,action.mode)}catch(err){console.warn('Animation fallback:',err)}
}
if(action.dealt>0){$('hit-effect').innerHTML='<span class="burst">-'+action.dealt+'</span>'}
if($('enemy-actor')){$('enemy-actor').classList.remove('is-hit');void $('enemy-actor').offsetWidth;$('enemy-actor').classList.add('is-hit')}
}
E.save(run);
if(battle.done){resetTimer();run=E.finish(battle);E.save(run);renderEndBattle()}
},Math.max(320,1250/speed));}
function renderEndBattle(){
if(run.status==='reward'){lastOffers=E.rewardChoices(run);renderRewards();return}
renderResult();
}
function renderEvent(){
resetTimer();const type=run.pending?.type||'event';const isRest=type==='rest';
put(hud()+'<section class="panel" style="text-align:center;max-width:800px;margin:35px auto;padding:40px"><div class="route-icon">'+(isRest?'🧵':'❔')+'</div><span class="section-kicker">DUNGEON EVENT</span><h2>'+(isRest?'따뜻한 봉제 공방':'수상한 인형 사건')+'</h2><p class="muted">'+(isRest?'잠시 쉬면서 체력을 회복하거나 쓰러진 동료를 부활시킵니다.':'인형들의 숨겨진 보물과 골드를 발견할 수 있어요.')+'</p><button class="primary-button" id="event-confirm">'+(isRest?'🧵 캠프에서 휴식':'✦ 사건 조사')+'</button></section><section class="panel"><h3>원정대</h3>'+partyLine()+'</section>');
$('event-confirm').onclick=()=>{const message=E.event(run,type);run.step++;run.status='event-done';run.pending={type:'event-done',message};E.save(run);renderEventDone()};
}
function renderEventDone(){put(hud()+'<section class="panel" style="text-align:center;padding:55px"><span class="route-icon">✨</span><h2>'+esc(run.pending?.message||'이벤트 완료')+'</h2>'+btn('다음 장소로 →','event-next','primary-button')+'</section>');$('event-next').onclick=()=>{run.status='map';run.pending=null;E.save(run);renderMap()};}
function renderRewards(){
resetTimer();if(!lastOffers)lastOffers=E.rewardChoices(run);
put(hud()+'<section class="panel" style="text-align:center"><span class="section-kicker">VICTORY · LOOT</span><h2>🎉 전투 승리!</h2><p class="muted">골드가 지급됐습니다. 다음 장소로 떠나기 전에 보상 한 가지를 선택하세요.</p><div class="reward-list">'+lastOffers.map((r,i)=>'<button class="reward-choice" data-reward="'+i+'"><span class="route-icon">'+r.icon+'</span><b>'+esc(r.name)+'</b><span>'+esc(r.desc)+'</span></button>').join('')+'</div><h3>✦ 획득한 유물</h3>'+relicLine()+'</section>');
document.querySelectorAll('[data-reward]').forEach(el=>el.onclick=()=>{E.reward(run,lastOffers[+el.dataset.reward]);lastOffers=null;E.save(run);renderMap()});
}
function renderResult(){
resetTimer();const win=run.status==='won';
put('<section class="intro-hero"><div><span class="section-kicker">'+(win?'EXPEDITION COMPLETE':'EXPEDITION FAILED')+'</span><h2>'+(win?'🏆 원정 성공!':'💔 원정 실패')+'</h2><p>'+(win?'세 개의 던전을 모두 정복했습니다! 최종 보스 L을 처치했어요.':'봉제인형 원정대가 전멸했습니다. 다음 원정에서는 더 좋은 조합을 시도해 보세요.')+'</p><p>⚔️ '+run.wins+'승 · 🪙 골드 '+run.gold+' · 획득 유물 '+run.relics.length+'개</p><div style="display:flex;gap:9px;flex-wrap:wrap">'+btn('✦ 새 원정 시작','again','primary-button')+'<a class="ghost-button" href="../">← 카지노 라운지</a></div></div><div class="intro-cards">'+run.party.slice(0,3).map(p=>img(card(p.id))).join('')+'</div></section>');
$('again').onclick=()=>{run=null;selected=[];E.clear();renderPick()};
}
function resume(){
if(!run){renderIntro();return}
if(run.status==='map')renderMap();else if(run.status==='reward'){lastOffers=E.rewardChoices(run);renderRewards()}
else if(run.status==='event')renderEvent();
else if(run.status==='event-done')renderEventDone();
else if(run.status==='battle'){const route=run.pending?.route||'battle';launchBattle(route)}
else renderResult();
}
async function boot(){
$('help-toggle').onclick=()=>$('help-dialog').showModal();
$('sound-toggle').onclick=()=>{sound=!sound;$('sound-toggle').textContent=sound?'♪ 소리 켜짐':'♪ 소리 꺼짐';$('sound-toggle').setAttribute('aria-pressed',String(!sound))};
try{const response=await fetch('../data/cards.json',{cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);
data=await response.json();cards=data.moles.filter(x=>!x.placeholder);bosses=data.bosses;run=E.load(cards);renderIntro();
}catch(e){console.error(e);put('<div class="center-message"><h2>카드 데이터를 불러오지 못했습니다.</h2><p>새로고침하여 다시 시도해 주세요.</p>'+btn('새로고침','reload','primary-button')+'</div>');$('reload').onclick=()=>location.reload()}}
boot();
