import { CHARACTER_FX, $escape as esc } from './character-fx.js?v=arena4';
const phases=['idle','attack','special'];
const statTypes = [['attack','⚔️ 공격'],['defense','🛡 방어'],['dominance','👑 지배'],['empathy','💗 공감']];
const rosterArt = {
  header: [['header-idle'], ['header-berserker','money'], ['header-berserker','coin']],
  kimi: [['@kimi','camera'], ['@kimi','camera'], ['@kimi','guitar']],
  harper: [['harper-typing'], ['harper-charge','sun','keycaps'], ['harper-charge','sun','keycaps']],
  eden: [['@eden'], ['@eden','crown'], ['@eden','crown']],
  hailey: [['@hailey','apple'], ['@hailey','apple','glasses'], ['@hailey','tree']],
  andrew: [['andrew-salute','andrew-discipline','andrew-idle'], ['andrew-kick','ball'], ['andrew-kick','banner']],
  ian: [['@ian','flag'], ['@ian','calculator','flag'], ['@ian','flag']],
  kade: [['@kade'], ['@kade','bone'], ['@kade','shield']],
  olivia: [['olivia-nap'], ['@olivia'], ['@olivia']],
  jacob: [['jacob-portrait','@toy-red','@toy-green'], ['jacob-portrait'], ['jacob-terror','@ghost-clown']],
  aiden: [['aiden-idle'], ['aiden-bubbles'], ['aiden-summon']],
  sally: [['sally-idle'], ['sally-swing','hammer'], ['sally-drop','diamond']],
  z: [['z-idle'], ['z-spikes','quill'], ['header-berserker','summon-circle']],
  l: [['l-idle'], ['l-reveal','louis-venom'], ['l-reveal','louis-venom']],
  henry: [['henry-idle'], ['henry-charge','glasses'], ['henry-coat']]
};
const rows = Object.keys(rosterArt);
const portraitArt = {
  olivia: 'olivia-portrait', sally: 'sally-portrait', jacob: 'jacob-portrait',
  hailey: 'hailey-portrait', kimi: 'kimi-portrait', harper: 'harper-portrait', z: 'z-portrait', ian: 'ian-portrait', kade: 'kade-portrait'
};
const portraitUsesFrameArt = new Set(Object.keys(portraitArt));
const spritePath = name => {
  if (name.startsWith('@')) {
    const asset = name.slice(1);
    return `../assets/${['toy-red','toy-green','ghost-clown'].includes(asset) ? 'fx' : 'moles/plush'}/${asset}.png`;
  }
  if (name.endsWith('-portrait') || ['harper-portrait','harper-typing','harper-charge','sally-portrait','olivia-nap','olivia-portrait','jacob-portrait','jacob-terror'].includes(name)) {
    return `../assets/cards/${name}.webp`;
  }
  return `../assets/fx/plush/${name}.webp`;
};
function portraitSource(m) {
 const image = portraitArt[m.id] || rosterArt[m.id]?.[0]?.[0];
 return image ? spritePath(image) : `../${m.image}`;
}
function paintedBackdrop(id, state) {
 const index = rows.indexOf(id);
 if (index < 0) return '';
 const sheet = Math.floor(index / 5) + 1;
 const y = index % 5 * 25;
 const x = phases.indexOf(state) * 50;
 return `<span class="mfx-painted-background" aria-hidden="true"><span style="--mfx-atlas:url('../assets/cards/backdrops-${sheet}.webp');--mfx-atlas-x:${x}%;--mfx-atlas-y:${y}%"></span></span>`;
}

function portrait(m, alt) {
 const cls = portraitUsesFrameArt.has(m.id) ? 'mfx-portrait-art' : 'mfx-portrait-sprite';
 return `${paintedBackdrop(m.id,'idle')}<img class="${cls}" src="${esc(portraitSource(m))}" alt="${esc(alt)}">`;
}

const heading=m=>m.nickname||m.trait||'두더지 카드';
const statBadges=m=>statTypes.map(([key,label])=>`<span class="mfx-live-stat">${label} <b>${esc(m.stats?.[key]??'—')}</b></span>`).join('');
function tile(m) {
 return `<div class="mfx-cover">${portrait(m,`${m.name} 상반신`)}</div>
 <div class="mfx-mini-details"><div class="mfx-mini-name">${esc(m.name)}<span class="mfx-mini-nick">${esc(heading(m))}</span></div><div class="mfx-mini-stats">${statBadges(m)}</div><div class="mfx-mini-trait">${esc(CHARACTER_FX[m.id]?.idle||heading(m))}</div></div>`;
}

export { tile, heading, statBadges, portrait, portraitSource, rosterArt, spritePath, paintedBackdrop };
