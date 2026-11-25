import { buildBossStages, FINAL_BOSS_ID, PENULTIMATE_BOSS_ID } from './boss-stages.js?v=zl-henry-final-20261124';

const $ = id => document.getElementById(id);
const STATS = [['attack', '공격력'], ['defense', '방어력'], ['dominance', '지배력'], ['empathy', '공감력']];
const IMAGE_VERSION = Date.now();
const fmt = value => Number.isFinite(Number(value)) ? Number(value).toLocaleString('ko-KR') : '—';
let activeTrigger = null;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function traitOf(boss) {
  return {
    title: boss.passive?.name || '기본 전투',
    description: boss.passive?.description || boss.trait || '별도 패시브 없이 주사위를 굴려 공격합니다.',
  };
}

function bossFigure(boss) {
  const figure = element('span', 'boss-figure');
  if (boss.id === 'bori') {
    const sprite = element('span', 'bori-sprite');
    sprite.setAttribute('role', 'img');
    sprite.setAttribute('aria-label', '민트색 봉제인형 보리의 전신');
    figure.append(sprite);
  } else if (boss.image) {
    const image = element('img');
    image.src = `../${boss.image}?v=${IMAGE_VERSION}`;
    image.alt = `${boss.name} 보스의 전신`;
    image.decoding = 'async';
    image.addEventListener('error', () => {
      figure.replaceChildren(element('span', 'art-error', `${boss.name} 이미지를 불러오지 못했습니다.`));
    }, { once: true });
    figure.append(image);
  } else {
    figure.append(element('span', 'art-error', '이미지를 준비 중입니다.'));
  }
  return figure;
}

function openDetail(boss, trigger) {
  activeTrigger = trigger;
  const trait = traitOf(boss);
  $('detailArt').replaceChildren(bossFigure(boss));
  $('detailLevel').textContent = `LV${boss.level}${(boss.tags ?? []).includes('임원') ? ' · 👑 임원' : ''}${boss.id === FINAL_BOSS_ID ? ' · 최종 보스' : boss.id === PENULTIMATE_BOSS_ID ? ' · 최종 보스 직전' : ''}`;
  $('detailTitle').textContent = boss.name;
  $('detailHp').textContent = `HP ${fmt(boss.hp)}`;
  const rows = document.createDocumentFragment();
  for (const [key, label] of STATS) {
    rows.append(element('dt', '', label), element('dd', '', fmt(boss.stats?.[key])));
  }
  $('detailStats').replaceChildren(rows);
  $('traitTitle').textContent = trait.title;
  $('traitDescription').textContent = trait.description;
  $('detail').showModal();
}

function bossCard(boss) {
  const final = boss.id === FINAL_BOSS_ID;
  const executive = boss.tags?.includes('임원');
  const card = element('button', `boss-card${final ? ' final' : ''}${executive ? ' mfx-executive' : ''}`);
  card.type = 'button';
  card.dataset.id = boss.id;
  card.setAttribute('aria-haspopup', 'dialog');
  card.setAttribute('aria-label', `LV${boss.level} ${boss.name}${final ? ', 최종 보스' : ''} 상세 보기`);
  const top = element('span', 'card-top');
  top.append(element('span', 'level', `LV${boss.level}`));
  if (final) top.append(element('span', 'final-label', '최종 보스'));
  if (executive) top.append(element('span', 'executive-label', '👑 임원'));
  const hp = element('span', 'card-hp', 'HP ');
  hp.append(element('b', '', fmt(boss.hp)));
  const stats = element('span', 'stats');
  for (const [key, label] of STATS) {
    const item = element('span', '', label.slice(0, 2));
    item.append(element('b', '', fmt(boss.stats?.[key])));
    stats.append(item);
  }
  const trait = traitOf(boss);
  const note = element('span', 'note');
  note.append(element('strong', '', trait.title), element('span', '', trait.description));
  card.append(top, element('span', 'card-title', boss.name), bossFigure(boss), hp, stats, note, element('span', 'more', '자세히 보기 →'));
  card.addEventListener('click', () => openDetail(boss, card));
  return card;
}

async function loadBosses() {
  $('grid').setAttribute('aria-busy', 'true');
  $('status').hidden = false;
  $('status').textContent = '보스 정보를 불러오는 중…';
  $('retryBtn').hidden = true;
  $('statGuide').hidden = true;
  $('count').textContent = '';
  try {
    const response = await fetch('../data/cards.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.bosses)) throw new Error('Missing boss data');
    const bosses = buildBossStages(data.bosses);
    const cards = document.createDocumentFragment();
    bosses.forEach(boss => cards.append(bossCard(boss)));
    $('grid').replaceChildren(cards);
    $('count').textContent = `${bosses.length}종`;
    $('status').textContent = bosses.length ? `${bosses.length}종의 보스를 불러왔습니다.` : '아직 등록된 보스가 없습니다.';
    $('status').hidden = bosses.length > 0;
    $('statGuide').hidden = bosses.length === 0;
  } catch (error) {
    $('grid').replaceChildren();
    $('status').textContent = '보스 정보를 불러오지 못했습니다. 연결 상태를 확인하고 다시 시도해주세요.';
    $('retryBtn').hidden = false;
    console.error('보스 사전 불러오기 실패:', error);
  } finally {
    $('grid').setAttribute('aria-busy', 'false');
  }
}

$('retryBtn').addEventListener('click', loadBosses);
$('closeBtn').addEventListener('click', () => $('detail').close());
$('detail').addEventListener('click', event => {
  if (event.target !== $('detail')) return;
  const rect = $('detail').getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $('detail').close();
});
$('detail').addEventListener('close', () => {
  activeTrigger?.focus();
  activeTrigger = null;
});

loadBosses();
