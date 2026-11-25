// 카드 사전 — 실제 카드만 (placeholder 제외).
// 숨김 특이사항(secret)은 개발용 토글(?dev=1 또는 우상단 스위치)을 켰을 때만 보여준다.
const $ = id => document.getElementById(id);
const IMG_V = Date.now(); // 교체된 이미지가 캐시에 가려지지 않도록 페이지 로드마다 버전 태그
let dev = new URLSearchParams(location.search).get('dev') === '1';
const STAT = [['attack', '공격력'], ['defense', '방어력'], ['dominance', '지배력'], ['empathy', '공감력']];

const stat = s => `<div class="stats">${STAT.map(([k, ko]) => `<span>${ko.slice(0, 2)} <b>${s[k]}</b></span>`).join('')}</div>`;

// showImage=false 면 이미지를 빼고 그린다 (상세 팝업용)
const cardHtml = (c, showImage = true) => `<div class="card${(c.tags ?? []).includes('임원') ? ' gold' : ''}" data-id="${c.id}">
  <h3>${c.name}</h3>
  ${showImage ? `<img src="../${c.image}?v=${IMG_V}" alt="${c.name}" style="transform:scale(${c.imageScale ?? 1})">` : ''}
  ${stat(c.stats)}
  <div class="note">${c.trait || ''}</div></div>`;

function openDetail(c) {
  $('detail').innerHTML = `<div class="sheet">
    ${cardHtml(c)}
    <div class="info">
      <h2>${c.name}</h2>
      ${STAT.map(([k, ko]) => `<div class="bar"><span>${ko}</span><i style="width:${c.stats[k] * 10}%"></i>&nbsp;${c.stats[k]}</div>`).join('')}
      <dl>
        <dt>특이사항</dt><dd>${c.trait || '—'}</dd>
        ${dev ? `<dt class="dev">숨김 특이사항 (개발용)</dt><dd class="dev">${c.secret || '—'}</dd>` : ''}
      </dl>
      <button class="close" id="closeBtn">닫기</button>
    </div></div>`;
  $('detail').hidden = false;
  $('closeBtn').onclick = () => $('detail').hidden = true;
  $('detail').onclick = e => { if (e.target === $('detail')) $('detail').hidden = true; };
}

$('devToggle').checked = dev;
$('devToggle').onchange = e => { dev = e.target.checked; if (!$('detail').hidden) { const id = $('detail').querySelector('.card')?.dataset.id; if (id) openDetail(current.find(m => m.id === id)); } };
let current = [];
fetch('../data/cards.json', { cache: 'no-store' }).then(r => r.json()).then(j => {
  const moles = current = j.moles.filter(m => !m.placeholder);
  $('count').textContent = `${moles.length}장`;
  $('grid').innerHTML = moles.length ? moles.map(c => cardHtml(c)).join('') : '<p class="empty">아직 카드가 없습니다.</p>';
  for (const el of $('grid').querySelectorAll('.card')) el.onclick = () => openDetail(moles.find(m => m.id === el.dataset.id));
});
