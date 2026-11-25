'use strict';
(() => {
  const categories = [
    '칼퇴 · 업무 효율 운세',
    '재물 · 간식 · 소소한 행운',
    '직장 내 인간관계 · 소통 운세',
    '커리어 · 성장 · 응원 운세',
    '힐링 · 건강 · 유머 운세',
  ];
  const $ = id => document.getElementById(id);
  const cookie = $('cookie');
  const draw = $('draw');
  const again = $('again');
  const result = $('result');
  const hint = $('hint');
  let fortunes = [];
  let drawing = false;
  let pending = null;

  // Use unbiased cryptographic random selection where supported.
  function randomIndex(length) {
    if (globalThis.crypto?.getRandomValues) {
      const value = new Uint32Array(1);
      const limit = Math.floor(4294967296 / length) * length;
      do { crypto.getRandomValues(value); } while (value[0] >= limit);
      return value[0] % length;
    }
    return Math.floor(Math.random() * length);
  }

  function showFortune(index) {
    $('category').textContent = categories[Math.floor(index / 40)];
    $('message').textContent = fortunes[index];
    $('code').textContent = 'FORTUNE NO. ' + String(index + 1).padStart(3, '0') + ' / 200';
    result.hidden = false;
    hint.textContent = '오늘의 운세가 도착했어! ✨';
    draw.hidden = true;
    again.focus({preventScroll:true});
    drawing = false;
  }

  function drawFortune() {
    if (drawing || fortunes.length !== 200) return;
    drawing = true;
    if (pending) clearTimeout(pending);
    result.hidden = true;
    draw.hidden = false;
    draw.disabled = true;
    cookie.disabled = true;
    cookie.classList.remove('opened');
    // Restart the crack animation when drawing repeatedly.
    void cookie.offsetWidth;
    cookie.classList.add('opened');
    hint.textContent = '바삭! 포춘쿠키를 여는 중…';
    const index = randomIndex(fortunes.length);
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    pending = setTimeout(() => {
      showFortune(index);
      pending = null;
    }, reduceMotion ? 70 : 840);
  }

  draw.addEventListener('click', drawFortune);
  cookie.addEventListener('click', drawFortune);
  again.addEventListener('click', drawFortune);

  fetch('/data/fortunes.json', {cache:'no-store'})
    .then(resp => {if (!resp.ok) throw Error('fetch failed'); return resp.json();})
    .then(data => {
      if (!Array.isArray(data) || data.length !== 200 || data.some(item => typeof item !== 'string' || !item.trim())) throw Error('invalid fortune data');
      fortunes = data;
      hint.textContent = '쿠키를 톡! 눌러 행운을 확인해 봐.';
      draw.disabled = false;
      cookie.disabled = false;
    })
    .catch(() => {
      hint.textContent = '운세 데이터를 불러오지 못했어. 새로고침 후 다시 시도해 줘.';
      draw.textContent = '불러오기 실패';
      draw.disabled = true;
      cookie.disabled = true;
    });
})();
