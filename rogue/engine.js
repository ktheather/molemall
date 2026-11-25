
import {effectiveStats,checkAttack,attackCount,matchingDiceSummon} from '../src/effects.js';
export const KEY='molemall_plush_rogue_v1';
export const pick=a=>a[Math.floor(Math.random()*a.length)];
export const dice=()=>1+Math.floor(Math.random()*6);
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const stages=['솜뭉치 숲','장난감 폐허','뱀의 극장'];
export const relics=[
{id:'heart',name:'솜사탕 심장',icon:'💗',desc:'전투 시작 시 전원 HP +8'},
{id:'blade',name:'황금 골육봉',icon:'🦴',desc:'모든 공격 피해 +15%'},
{id:'shield',name:'강철 솜',icon:'🛡️',desc:'모든 받는 피해 -15%'},
{id:'dice',name:'황금 주사위',icon:'🎲',desc:'12% 확률로 공격 1회 추가'},
{id:'flower',name:'공감의 꽃',icon:'🌸',desc:'치유량 +50%'},
{id:'crown',name:'왕관',icon:'👑',desc:'시작 에너지 +25'},
{id:'spark',name:'분노의 별',icon:'✨',desc:'필살기 피해 +35%'},
{id:'potion',name:'튼튼한 실',icon:'🧵',desc:'최대 체력 +20'}];
export const bonus=(r,id)=>r.relics.includes(id);
export const maxHP=(u,r)=>u.max+(bonus(r,'potion')?20:0);
export const heal=(u,n,r)=>u.hp=clamp(u.hp+Math.round(n),0,maxHP(u,r));
export function newRun(ids,cards){
return {version:1,status:'map',act:1,step:0,gold:0,party:ids.map(id=>{const c=cards.find(x=>x.id===id);const max=60+5*c.stats.defense;return{id,hp:max,max,energy:0,level:1}}),relics:[],pending:null,tactic:'balanced',wins:0,history:[],routes:null};}
export function save(run){try{localStorage.setItem(KEY,JSON.stringify(run));return true}catch{return false}}
export function load(cards){try{const r=JSON.parse(localStorage.getItem(KEY)||'null');return r&&r.version===1&&Array.isArray(r.party)&&r.party.length===5&&r.party.every(p=>cards.some(c=>c.id===p.id))?r:null}catch{return null}}
export function clear(){try{localStorage.removeItem(KEY)}catch{}}
export function routes(r){
if(r.step===4)return[{id:'boss',icon:'👑',name:'보스 전투',desc:'강력한 수호자와 싸웁니다.'}];
const items={battle:['⚔️','인형의 습격','전투 승리 시 골드와 보상'],event:['❔','수상한 사건','랜덤 유물이나 골드를 획득'],rest:['🧵','봉제 공방','회복 또는 동료 부활'],elite:['💀','정예 인형','강력한 적과 싸워 희귀 보상']};
return ['battle',pick(['battle','event','rest','elite']),pick(['event','rest','elite'])].map((id,i)=>({id,key:id+i,icon:items[id][0],name:items[id][1],desc:items[id][2]}));}
export function makeEnemy(r,route,bosses){
const bossIds=['elephant','taetiseo','l'];
const data=route==='boss'?bosses.find(b=>b.id===bossIds[r.act-1]):pick(bosses.filter(b=>!['l','taetiseo'].includes(b.id)));
const b=data||bosses[0];const scale=route==='boss'?1.8:route==='elite'?1.3:.9;
const max=Math.round((b.hp||60)*scale*(1+.3*(r.act-1))+r.step*9);
return {id:b.id,name:b.name,image:b.image,scene:b.scene,stats:b.stats||{attack:7,defense:4,dominance:3,empathy:0},tags:b.tags||[],effects:b.effects||[],max,hp:max,stun:0,oilstacks:0,poison:0};}
const living=b=>b.run.party.filter(x=>x.hp>0);
const lineup=b=>living(b).slice(0,3);
const write=(b,t)=>{b.log.unshift(t);b.log=b.log.slice(0,40);b.action=t};
export function startBattle(run,cards,bosses,route){
const enemy=makeEnemy(run,route,bosses);
for(const u of run.party){if(u.hp>0&&bonus(run,'heart'))heal(u,8,run);if(u.hp>0&&bonus(run,'crown'))u.energy=clamp(u.energy+25,0,100)}
const b={run,cards,enemy,route,turn:0,log:[],done:false,result:null,action:'준비',lastEnemyRoll:null};
write(b,enemy.name+' 등장! 원정대 자동 전투 시작!');return b;}
export function tick(b){
if(b.done)return null;
const team=lineup(b);
if(!team.length){b.done=true;b.result='lose';write(b,'원정대 전멸');return null}
const hero=team[b.turn%team.length],card=b.cards.find(x=>x.id===hero.id);
const d1=dice(),d2=dice(),db=d1===d2,sum=d1+d2,ctx={d1,d2,lastOpponentDiceSum:b.lastEnemyRoll};
const es=effectiveStats(card,b.enemy,ctx).stats;
const valid=checkAttack(card,d1,d2);let dealt=0,mode='idle';
if(valid.ok){
let hits=attackCount(card,d1,d2);if(db&&hits===1)hits=2;if(bonus(b.run,'dice')&&!db&&Math.random()<.12)hits++;
let atk=es.attack;if(card.id==='z'&&b.enemy.tags.includes('두더지'))atk=Math.max(atk,16);
let damage=Math.max(1,Math.round((5+atk*2+hero.level*2)*(1-clamp(b.enemy.stats.defense*.03,0,.65))*(bonus(b.run,'blade')?1.15:1)));
if(b.run.tactic==='aggressive')damage=Math.round(damage*1.1);
if(hero.energy>=100){damage=Math.round(damage*(bonus(b.run,'spark')?2.1:1.6));hero.energy=0;mode='special'}else mode='attack';
dealt=damage*hits;
if(card.id==='sally')dealt+=6;
if(card.id==='aiden'&&sum>=10){dealt=Math.max(dealt,30);b.enemy.poison+=3}
if(card.id==='z'&&matchingDiceSummon(card,d1,d2))dealt+=23;
if(card.id==='jacob'&&Math.random()<.1)b.enemy.stun=1;
if(es.dominance>=8&&Math.random()<Math.min(.4,es.dominance*.018))b.enemy.stun=1;
b.enemy.hp=Math.max(0,b.enemy.hp-dealt);
if(b.enemy.id==='taetiseo')b.enemy.oilstacks++;
hero.energy=Math.min(100,hero.energy+20+Math.round(es.empathy/2));
write(b,card.name+' 🎲 '+d1+'+'+d2+(db?' 더블!':'')+' · '+dealt+' 피해'+(hits>1?' ('+hits+'연타)':''));
}else{hero.energy=Math.min(100,hero.energy+12);write(b,card.name+' 🎲 '+sum+' · 공격 불발')}
if(card.id==='aiden'&&hero.hp>0&&hero.hp<=maxHP(hero,b.run)/2){heal(hero,14,b.run);write(b,'에이든 체력 +14')}
if(es.empathy>=8&&hero.hp>0){const ally=lineup(b).sort((x,y)=>x.hp/maxHP(x,b.run)-y.hp/maxHP(y,b.run))[0];if(ally){const amount=Math.ceil(es.empathy*(bonus(b.run,'flower')?1.5:1));heal(ally,amount,b.run);write(b,card.name+' 회복 +'+amount)}}
b.turn++;let retaliation=0;
if(b.enemy.hp>0){
if(b.enemy.poison>0){b.enemy.hp=Math.max(0,b.enemy.hp-(2+dice()%4));b.enemy.poison--;write(b,b.enemy.name+' 감전 피해')}
if(b.enemy.hp>0){
if(b.enemy.stun>0){b.enemy.stun--;write(b,b.enemy.name+' 행동 방해!')}
else{
const alive=lineup(b),target=pick(alive),targetCard=b.cards.find(x=>x.id===target.id);
const def=effectiveStats(targetCard,b.enemy,ctx).stats.defense;
const atk=b.enemy.stats.attack*(b.enemy.id==='taetiseo'?Math.pow(1.2,b.enemy.oilstacks):1);
retaliation=Math.max(1,Math.round((5+atk*(1+.17*(b.run.act-1)))*(1-clamp(def*.04,0,.6))*(bonus(b.run,'shield')?.85:1)));
if(b.run.tactic==='defensive')retaliation=Math.max(1,Math.round(retaliation*.87));
if(b.run.tactic==='aggressive')retaliation=Math.round(retaliation*1.13);
target.hp=Math.max(0,target.hp-retaliation);b.lastEnemyRoll=dice()+dice();
write(b,b.enemy.name+' 반격! '+targetCard.name+' -'+retaliation);
}}}
if(b.enemy.hp<=0){b.done=true;b.result='win';write(b,b.enemy.name+' 처치! 승리!')}
else if(!living(b).length){b.done=true;b.result='lose';write(b,'원정대 전멸!')}
return {id:card.id,mode,dealt,d1,d2,db,retaliation};
}
export function finish(b){
const r=b.run;
if(b.result==='lose'){r.status='lost';return r}
r.wins++;r.gold+=b.route==='boss'?65:b.route==='elite'?55:30;
r.history.push(r.act+'막 '+(r.step+1)+'번 '+b.enemy.name+' 처치');
if(b.route==='boss'){if(r.act===3){r.status='won';return r}r.act++;r.step=0}
else r.step++;
r.status='reward';r.pending={type:'battle',route:b.route};r.routes=null;return r;}
export function rewardChoices(r){
const item=pick(relics.filter(x=>!r.relics.includes(x.id)));
const choices=[{id:'level',icon:'⬆️',name:'전투 훈련',desc:'생존 카드 레벨 +1 및 HP +5'}];
if(item)choices.push({id:'relic',icon:item.icon,name:item.name,desc:item.desc,relicId:item.id});
choices.push({id:'heal',icon:'💗',name:'솜실 회복',desc:'생존 카드 모두 HP +25'});return choices;}
export function reward(r,item){
if(item.id==='level')for(const u of r.party)if(u.hp>0){u.level=Math.min(8,u.level+1);u.max+=5;heal(u,5,r)}
if(item.id==='relic'&&!r.relics.includes(item.relicId))r.relics.push(item.relicId);
if(item.id==='heal')for(const u of r.party)if(u.hp>0)heal(u,25,r);
r.status='map';r.pending=null;r.routes=null;}
export function event(r,type){
if(type==='rest'){const down=r.party.find(p=>p.hp<=0);if(down){down.hp=Math.ceil(maxHP(down,r)*.45);return '쓰러진 동료가 체력 45%로 부활!'}for(const p of r.party)heal(p,maxHP(p,r)*.4,r);return '봉제 공방에서 전체 HP 40% 회복!'}
const item=pick(relics.filter(x=>!r.relics.includes(x.id)));
if(dice()>=4&&item){r.relics.push(item.id);return item.icon+' '+item.name+' 획득!'}
const gold=15+dice()*10;r.gold+=gold;return '숨겨진 골드 '+gold+'개 획득!';}
