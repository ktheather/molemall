(() => {
  'use strict';
  const rules = {
    hammer:{name:'두더지 망치',duration:15,selection:false,goal:'지정된 목표 두더지를 다섯 번 이상 정확히 맞히세요.',controls:[['클릭 / 터치','굴에서 나온 목표 두더지를 망치로 타격']],detail:'목표를 맞히면 공격력만큼 가점, 다른 두더지는 방어력만큼 감점. 목표 점수에 도달하면 승리합니다.'},
    race:{name:'두더지 경마',duration:25,selection:true,goal:'우승할 두더지를 선택하고 경주 결과를 예측하세요.',controls:[['캐릭터 클릭','응원할 선수 선택 및 경주 시작']],detail:'공격력·방어력·공감력과 각자의 고유 기술이 달리기에 영향을 줍니다. 선택한 선수가 1등이면 승리합니다.'},
    thief:{name:'도둑두더지',duration:60,selection:true,goal:'루이스에게 잡히지 않고 60초 동안 물건을 훔치세요.',controls:[['W A S D','상하좌우 이동 / 땅 파기'],['SPACE','방에 있는 물건 훔치기'],['E','의상 및 장비 벗기 (소음 감소)'],['Q','칼 장착 / 뱀꼬리 공격'],['1','곡괭이 ↔ 칼 전환']],detail:'훔친 공격 도구의 주인 공격력만큼 점수가 쌓입니다. 소리가 커질수록 루이스의 추격이 빨라집니다.'},
    bomb:{name:'두더지 폭탄 돌리기',duration:60,selection:true,goal:'폭탄을 넘기며 끝까지 생존하세요.',controls:[['SPACE','폭탄 전달'],['Q','캐릭터 고유 기술']],detail:'폭발 전에 다음 두더지에게 넘기세요.'},
    office:{name:'두더지 사무실 대소동',duration:60,selection:false,goal:'CEO L의 사무실에서 발생하는 사건을 해결하세요.',controls:[['클릭 / 터치','사건과 해결할 직원 선택']],detail:'각 캐릭터의 고유 능력으로 사건을 해결하세요.'}
  };
  const $=id=>document.getElementById(id);
  const rosterPromise=fetch('/data/cards.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('cards');return r.json()}).then(d=>d.moles.filter(c=>!c.placeholder&&c.stats&&c.tags?.includes('두더지'))).catch(()=>[]);
  const art=c=>'/assets/moles/roster/'+encodeURIComponent(c.id)+'.webp';
  const mk=(tag,txt,cls)=>{const n=document.createElement(tag);if(txt!=null)n.textContent=txt;if(cls)n.className=cls;return n};
  const img=(c,cls)=>{const n=mk('img',null,cls);n.src=art(c);n.alt=c.name;n.draggable=false;return n};
  let active=null,version=0,maximum=0,playing=false,available=['hammer','race','thief'];
  function time(seconds){
    const v=seconds==null?null:Math.max(0,Math.ceil(seconds));
    $('arcade-time').textContent=v==null?'--:--':String(Math.floor(v/60)).padStart(2,'0')+':'+String(v%60).padStart(2,'0');
    $('arcade-time').classList.toggle('urgent',v!=null&&v<=5);
    $('arcade-time-fill').style.width=v==null||maximum===0?'0%':Math.min(100,v/maximum*100)+'%';
  }
  function right(id){
    const rule=rules[id];if(!rule)return;
    $('arcade-rule-name').textContent=rule.name;
    $('arcade-rule-goal').textContent=rule.goal;
    $('arcade-rule-duration').textContent=rule.duration+'초 제한';
    $('arcade-rule-detail').textContent=rule.detail;
    const list=$('arcade-rule-controls');list.replaceChildren();
    rule.controls.forEach(([key,desc])=>{const item=mk('div',null,'arcade-key-row');item.append(mk('kbd',key),mk('span',desc));list.append(item)});
    $('arcade-rule-tabs').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.rule===id));
  }
  function setAvailable(ids){
    available=ids.filter(id=>rules[id]);const menu=$('arcade-rule-tabs');menu.replaceChildren();
    available.forEach(id=>{const b=mk('button',rules[id].name);b.type='button';b.dataset.rule=id;b.onclick=()=>{if(!playing)right(id)};menu.append(b)});right(available[0]);
  }
  function waiting(text){const area=$('arcade-player');area.replaceChildren(mk('div',text,'arcade-await'))}
  async function cheer(){
    const token=++version,area=$('arcade-player');area.replaceChildren();
    const group=mk('div',null,'arcade-cheer');group.append(mk('div','GO! GO!','arcade-cheer-word'));
    const cast=mk('div',null,'arcade-cheer-cast');group.append(cast);group.append(mk('div','두더지 응원단','arcade-cheer-caption'));area.append(group);
    const pool=[...await rosterPromise];if(token!==version)return;
    const names=[];
    for(let i=0;i<3&&pool.length;i++){const c=pool.splice(Math.floor(Math.random()*pool.length),1)[0];names.push(c.name);const figure=mk('div',null,'arcade-cheerer cheer-'+i);figure.append(img(c));cast.append(figure)}
    group.append(mk('small',names.join(' · '),'arcade-cheer-names'));
  }
  function select(card,ability,detail,role='내 캐릭터'){
    version++;const area=$('arcade-player');area.replaceChildren();
    const selected=mk('div',null,'arcade-selected');
    selected.append(mk('div',role,'arcade-player-role'),img(card,'arcade-selected-art'),mk('strong',card.name,'arcade-selected-name'),mk('small',card.trait||'','arcade-selected-nick'));
    const stats=mk('div',null,'arcade-stats');[['공격','attack'],['방어','defense'],['지배','dominance'],['공감','empathy']].forEach(([label,key])=>{const cell=mk('span');cell.append(mk('small',label),mk('b',String(card.stats?.[key]??'—')));stats.append(cell)});selected.append(stats);
    const box=mk('div',null,'arcade-ability');box.append(mk('small','이번 게임의 능력'),mk('strong',ability||'공통 조작'),mk('p',detail||'기존 카드 능력치 참고'));selected.append(box);area.append(selected);
  }
  function begin(id){
    active=id;playing=true;maximum=rules[id]?.duration||0;version++;
    $('arcade-left').dataset.game=id;$('arcade-right').dataset.game=id;
    $('arcade-rule-tabs').hidden=true;right(id);time(maximum);
    if(rules[id]?.selection)waiting('캐릭터를 선택하세요');else cheer();
  }
  function lobby(){
    active=null;playing=false;version++;maximum=0;time(null);
    $('arcade-left').dataset.game='lobby';$('arcade-right').dataset.game='lobby';$('arcade-rule-tabs').hidden=false;right(available[0]);cheer();
  }
  function finish(){playing=false;time(0)}
  function target(c){$('arcade-left').dataset.target=c.name;const a=$('arcade-player');if(!a.querySelector('.arcade-cheer'))return;const old=a.querySelector('.arcade-target-note');old?.remove();a.append(mk('div','목표: '+c.name+' · '+c.stats.attack+'점','arcade-target-note'))}
  window.ArcadeHud={begin,select,time,finish,lobby,setAvailable,target,rules};
  setAvailable(available);lobby();
})();