/*
 * 두근두근! 우정 타로! — 화면 흐름
 * 첫 화면(인원) → 이름 → 카드 뽑기 → 모은 카드 → 우정 미션 → 마법 모으기 → 우정 운세
 */
(function () {
  'use strict';

  const D = window.TAROT_DATA, A = window.TAROT_ART, S = window.TAROT_SOUND;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const stage = $('#stage');
  const fx = $('#fx');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CARD = Object.fromEntries(D.CARDS.map((c) => [c.id, c]));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const state = {};
  function resetState() {
    clearTimer();
    Object.assign(state, { count: 0, players: [], deck: [], taken: {}, turn: 0, mIdx: 0, busy: false, temp: 36.5 });
  }

  // ---------- 글자 도우미 ----------
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

  // 받침 있을 때/없을 때 조사 고르기(예: '이/가')
  function josa(word, pair) {
    const [a, b] = pair.split('/');
    const code = word.charCodeAt(word.length - 1);
    if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 ? a : b;
    return `${a}(${b})`;
  }
  const nm = (p, pair) => `<b class="nm">${esc(p.name)}</b>${pair ? josa(p.name, pair) : ''}`;
  const fill = (tpl, me, to) => esc(tpl).replace(/\{(me|to)(?:\|([^}]+))?\}/g, (_, w, pair) => nm(w === 'me' ? me : to, pair));
  const fmtTemp = (t) => (t >= 99.95 ? '100' : (Math.round(t * 10) / 10).toFixed(1));

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () {
      h = (h + 0x6d2b79f5) | 0;
      let t = Math.imul(h ^ (h >>> 15), 1 | h);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- 조각 ----------
  const tok = (p, cls = '') => `<span class="tok ${cls}" style="--acc:${p.accent};--acc-soft:${p.soft}">${A.token(p.key)}</span>`;

  function frontHTML(c) {
    return `<span class="tf-frame"></span>` +
      `<span class="tf-orn tl">${A.ORN.star}</span><span class="tf-orn tr">${A.ORN.heart}</span>` +
      `<span class="tf-orn bl">${A.ORN.heart}</span><span class="tf-orn br">${A.ORN.star}</span>` +
      `<span class="tf-no">${A.ORN.sparkle}<b>${c.no}</b>${A.ORN.sparkle}</span>` +
      `<span class="tf-art"><span class="tf-halo"></span><span class="tf-ring"></span>${A.symbol(c.id)}</span>` +
      `<span class="tf-name">${c.name}</span>`;
  }

  function cardHTML(card, opt = {}) {
    const cls = ['tcard', opt.flipped && 'flipped', opt.cls].filter(Boolean).join(' ');
    return `<span class="${cls}">` +
      `<span class="tcard-inner">` +
      `<span class="tcard-face tcard-back"><span class="sheen"></span></span>` +
      `<span class="tcard-face tcard-front${card ? ' fam-' + card.family : ''}">${card ? frontHTML(card) : ''}</span>` +
      `</span>` +
      (opt.badge ? `<span class="tcard-badge">${tok(opt.badge, 'xs')}</span>` : '') +
      `</span>`;
  }

  // ---------- 화면 바꾸기 ----------
  function go(name, html) {
    clearTimer();
    document.body.dataset.screen = name;
    const old = stage.querySelector('.screen:not(.leaving)');
    if (old) {
      old.classList.add('leaving');
      setTimeout(() => old.remove(), 450);
    }
    const el = document.createElement('section');
    el.className = `screen scr-${name}`;
    el.innerHTML = html;
    stage.appendChild(el);
    return el;
  }

  // ---------- 1. 첫 화면 ----------
  const COUNT_CAP = { 2: '단짝 마법', 3: '삼총사 마법', 4: '사총사 마법' };

  function renderHome() {
    resetState();
    go('home', `
      <div class="home">
        <div class="logo">
          <div class="logo-fan" aria-hidden="true">
            ${[0, 1, 2].map((i) => `<span class="fan-card f${i}">${cardHTML(null)}</span>`).join('')}
          </div>
          <p class="logo-kicker">두근두근!</p>
          <h1 class="logo-title">우정 타로!</h1>
          <p class="logo-sub">오늘 우리 우정에는 어떤 마법이 숨어 있을까?</p>
        </div>
        <h2 class="ask">함께 온 친구는 모두 몇 명인가요?</h2>
        <div class="count-row">
          ${[2, 3, 4].map((n) => `
            <button class="count-btn" data-act="count" data-n="${n}">
              <span class="count-num">${n}<small>명</small></span>
              <span class="count-toks">${D.PLAYERS.slice(0, n).map((p) => tok(p, 'sm')).join('')}</span>
              <span class="count-cap">${COUNT_CAP[n]}</span>
            </button>`).join('')}
        </div>
        <ol class="steps" aria-label="체험 순서">
          <li><b>1</b>카드 뽑기</li>
          <li><b>2</b>우정 미션</li>
          <li><b>3</b>우정 운세</li>
        </ol>
      </div>`);
  }

  // ---------- 2. 이름 ----------
  function renderNames() {
    const n = state.count;
    state.players = D.PLAYERS.slice(0, n).map((p) => ({ ...p, name: p.name, card: null, result: null, easy: false }));
    go('names', `
      <div class="names">
        <header class="scr-head">
          <h2>오늘의 마법사들을 소개해요</h2>
          <p>이름이나 별명을 적어 주세요. 비워 두면 동물 친구 이름으로 불러 줄게요.</p>
        </header>
        <div class="name-grid" style="--n:${n}">
          ${state.players.map((p, i) => `
            <label class="name-tile" style="--acc:${p.accent};--acc-soft:${p.soft};--i:${i}">
              ${tok(p, 'xl')}
              <span class="name-no">${i + 1}번 마법사</span>
              <input class="name-input" data-i="${i}" maxlength="6" placeholder="${p.name}"
                autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="${i < n - 1 ? 'next' : 'go'}">
            </label>`).join('')}
        </div>
        <div class="actions">
          <button class="btn ghost" data-act="names-back">${A.ICON.back}인원 다시 고르기</button>
          <button class="btn primary big" data-act="start-draw">카드 뽑으러 가기 ${A.ICON.arrow}</button>
        </div>
      </div>`);
  }

  function startDraw() {
    $$('.name-input').forEach((inp) => {
      const i = +inp.dataset.i;
      state.players[i].name = inp.value.trim() || D.PLAYERS[i].name;
    });
    if (document.activeElement) document.activeElement.blur();
    renderDraw();
  }

  // ---------- 3. 카드 뽑기 ----------
  function renderDraw() {
    state.deck = shuffle(D.CARDS.map((c) => c.id));
    state.taken = {};
    state.turn = 0;
    state.busy = false;
    go('draw', `
      <div class="draw">
        <div class="turn-bar">
          <div class="turn-who" aria-live="polite"></div>
          <div class="turn-side">
            <div class="turn-progress">
              ${state.players.map((p, i) => `<span class="tp" data-i="${i}">${tok(p, 'sm')}<span class="tp-check">${A.ORN.star}</span></span>`).join('')}
            </div>
            <button class="btn small ghost" data-act="shuffle">${A.ICON.shuffle}카드 섞기</button>
          </div>
        </div>
        <div class="grid-wrap">
          <div class="grid">
            ${state.deck.map((id, i) => `
              <button class="slot" data-act="pick" data-slot="${i}" style="--i:${i}" aria-label="${i + 1}번째 카드 뽑기">
                <span class="float" style="--f:-${((i * 0.73) % 3).toFixed(2)}s">${cardHTML(null)}</span>
              </button>`).join('')}
          </div>
        </div>
      </div>`);
    layoutGrid();
    updateTurn();
  }

  // 화면 크기에 맞춰 6×2, 4×3, 3×4 가운데 카드가 가장 크게 보이는 배치를 고른다
  function layoutGrid() {
    const wrap = $('.scr-draw:not(.leaving) .grid-wrap');
    if (!wrap) return;
    const grid = $('.grid', wrap);
    const r = wrap.getBoundingClientRect();
    const gap = Math.round(Math.max(10, Math.min(r.width, r.height) * 0.025));
    let best = { cols: 4, w: 0 };
    for (const cols of [6, 4, 3]) {
      const rows = 12 / cols;
      const byW = (r.width - gap * (cols - 1)) / cols;
      const byH = (r.height - gap * (rows - 1)) / rows / 1.5;
      const w = Math.min(byW, byH);
      if (w > best.w) best = { cols, w };
    }
    grid.style.setProperty('--cols', best.cols);
    grid.style.setProperty('--gap', gap + 'px');
    grid.style.setProperty('--cw', Math.floor(Math.min(best.w, 230)) + 'px');
  }

  function updateTurn() {
    const p = state.players[state.turn];
    const who = $('.turn-who');
    who.innerHTML = `${tok(p, 'lg bob')}<div><p class="turn-name">${nm(p)}의 차례예요!</p><p class="turn-hint">마음이 끌리는 카드를 한 장 톡 눌러 보세요</p></div>`;
    who.classList.remove('pop');
    void who.offsetWidth;
    who.classList.add('pop');
    $$('.tp').forEach((el, i) => {
      el.classList.toggle('done', !!state.players[i].card);
      el.classList.toggle('now', i === state.turn);
    });
  }

  function pick(btn) {
    const slot = +btn.dataset.slot;
    if (state.busy || slot in state.taken || state.turn >= state.players.length) return;
    state.busy = true;
    const p = state.players[state.turn];
    p.card = CARD[state.deck[slot]];
    p.slot = slot;
    state.taken[slot] = state.turn;
    btn.disabled = true;
    S.whoosh();
    reveal(btn, p.card, p);
  }

  async function reveal(btn, card, p) {
    const fam = D.FAMILIES[card.family];
    const ov = document.createElement('div');
    ov.className = 'reveal';
    ov.innerHTML = `
      <div class="reveal-bg"></div>
      <div class="reveal-stage">
        <div class="reveal-slot"><span class="burst"></span>${cardHTML(card, { cls: 'big' })}</div>
        <div class="reveal-panel parchment fam-${card.family}" role="dialog" aria-modal="true" aria-labelledby="rv-title">
          <div class="rv-body">
            <p class="rv-who">${tok(p, 'xs')}<span>${nm(p, '이/가')} 뽑은 카드</span></p>
            <h2 class="rv-title" id="rv-title"><span class="rv-no">${card.no}</span>${card.name}</h2>
            <p class="rv-chips"><span class="chip fam">${A.famIcon(card.family)}${fam.magic}</span><span class="chip">${card.keyword}</span></p>
            <div class="rv-sec"><h3>${A.ORN.star}상징</h3><p><b>${card.symbol}</b> — ${card.symbolText}</p></div>
            <div class="rv-sec"><h3>${A.ORN.heart}카드의 의미</h3><p>${card.meaning}</p></div>
          </div>
          <button class="btn primary big rv-keep" data-act="keep">카드 간직하기</button>
        </div>
      </div>`;
    document.body.appendChild(ov);

    const big = $('.tcard.big', ov);
    const src = $('.tcard', btn);
    const a = src.getBoundingClientRect();
    const b = big.getBoundingClientRect();
    src.style.visibility = 'hidden';
    big.style.transformOrigin = '0 0';
    big.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width})`;
    void big.offsetWidth;
    ov.classList.add('in');
    big.style.transition = `transform ${reduce ? 0.2 : 0.62}s cubic-bezier(.2,.9,.25,1)`;
    big.style.transform = 'none';
    await wait(reduce ? 220 : 640);

    big.classList.add('flipped');
    S.reveal();
    await wait(reduce ? 120 : 380);
    const r = big.getBoundingClientRect();
    $('.burst', ov).classList.add('go');
    burst(r.left + r.width / 2, r.top + r.height / 2, 24);
    await wait(reduce ? 60 : 300);
    ov.classList.add('show');
    $('.rv-keep', ov).focus({ preventScroll: true });
  }

  async function keep() {
    const ov = $('.reveal');
    if (!ov || ov.classList.contains('out')) return;
    ov.classList.add('out');
    S.tap();
    const p = state.players[state.turn];
    const btn = $(`.scr-draw .slot[data-slot="${p.slot}"]`);
    const holder = $('.float', btn);
    holder.innerHTML = cardHTML(p.card, { flipped: true, badge: p, cls: 'instant' });
    btn.classList.add('taken');
    btn.setAttribute('aria-label', `${p.name}의 카드: ${p.card.name}`);
    const dst = $('.tcard', holder);
    dst.style.visibility = 'hidden';

    const big = $('.tcard.big', ov);
    const a = dst.getBoundingClientRect();
    const b = big.getBoundingClientRect();
    big.style.transition = `transform ${reduce ? 0.15 : 0.5}s cubic-bezier(.5,0,.3,1)`;
    big.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width})`;
    await wait(reduce ? 160 : 520);
    dst.style.visibility = '';
    ov.remove();

    state.turn++;
    if (state.turn < state.players.length) {
      state.busy = false;
      updateTurn();
      S.soft();
    } else {
      $('.turn-who').innerHTML = `<p class="turn-name">모두 카드를 뽑았어요!</p>`;
      $$('.tp').forEach((el) => el.classList.add('done'));
      await wait(800);
      if (document.body.dataset.screen === 'draw') renderSummary();
    }
  }

  function shuffleCards() {
    if (state.busy) return;
    const free = state.deck.map((_, i) => i).filter((i) => !(i in state.taken));
    if (free.length < 2) return;
    state.busy = true;
    S.shuffle();
    const ids = shuffle(free.map((i) => state.deck[i]));
    free.forEach((slot, k) => { state.deck[slot] = ids[k]; });
    if (reduce) { state.busy = false; return; }
    const g = $('.grid').getBoundingClientRect();
    const cx = g.left + g.width / 2, cy = g.top + g.height / 2;
    const runs = free.map((slot, k) => {
      const el = $(`.slot[data-slot="${slot}"] .tcard`);
      const r = el.getBoundingClientRect();
      const dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
      const rot = Math.random() * 30 - 15;
      return el.animate([
        { transform: 'none' },
        { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, offset: 0.42 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${-rot}deg)`, offset: 0.58 },
        { transform: 'none' },
      ], { duration: 1150, easing: 'cubic-bezier(.6,0,.3,1)', delay: k * 15 }).finished;
    });
    Promise.all(runs).then(() => { state.busy = false; }, () => { state.busy = false; });
  }

  // ---------- 4. 모은 카드 ----------
  function renderSummary() {
    const P = state.players;
    go('summary', `
      <div class="summary">
        <header class="scr-head">
          <h2>모두의 카드가 열렸어요!</h2>
          <p>카드 속에 우정 미션이 숨어 있어요. 차례대로 열어 볼까요?</p>
        </header>
        <div class="sum-row n${P.length}" style="--n:${P.length}">
          ${P.map((p, i) => `
            <figure class="sum-item" style="--i:${i}">
              <figcaption class="who-tag">${tok(p, 'xs')}${nm(p)}</figcaption>
              ${cardHTML(p.card, { flipped: true, cls: 'instant' })}
              <span class="chip on-dark">${A.famIcon(p.card.family)}${p.card.keyword}</span>
            </figure>`).join('')}
        </div>
        <div class="actions">
          <button class="btn primary big" data-act="missions">우정 미션 열기 ${A.ICON.arrow}</button>
        </div>
      </div>`);
  }

  // ---------- 5. 우정 미션 ----------
  const level = (t) => Math.max(0, Math.min(1, (t - 30) / 70)).toFixed(3);

  function thermoHTML() {
    return `
      <aside class="thermo" aria-label="우정 온도">
        <p class="th-label">우정 온도</p>
        <p class="th-num"><b>${fmtTemp(state.temp)}</b>℃</p>
        <div class="th-body">
          <div class="th-tube"><span class="th-fill" style="--lv:${level(state.temp)}"></span></div>
          <span class="th-bulb"></span>
        </div>
      </aside>`;
  }

  function timerHTML(sec) {
    return `
      <div class="timer" data-sec="${sec}">
        <div class="t-dial">
          <svg viewBox="0 0 100 100" aria-hidden="true"><circle class="t-track" cx="50" cy="50" r="44"/><circle class="t-ring" cx="50" cy="50" r="44" pathLength="100"/></svg>
          <span class="t-num">${sec}</span>
        </div>
        <button class="btn small gold" data-act="timer">${A.ICON.timer}<span>${sec >= 60 ? '1분' : sec + '초'} 타이머 시작</span></button>
      </div>`;
  }

  function renderMission() {
    const P = state.players, n = P.length, i = state.mIdx;
    const p = P[i], to = P[(i + 1) % n], m = p.card.mission;
    p.easy = false;
    p.result = null;
    go('mission', `
      <div class="mission">
        <div class="ms-side">
          ${cardHTML(p.card, { flipped: true, cls: 'instant' })}
          <p class="ms-owner">${tok(p, 'xs')}<span>${nm(p)}의 카드</span></p>
        </div>
        <article class="ms-panel parchment fam-${p.card.family}">
          <div class="ms-ribbon">우정 미션 <b>${i + 1}</b> / ${n}</div>
          <p class="ms-who">${m.mode === 'all'
            ? `${tok(p, 'xs')}<span>${nm(p, '이/가')} 앞장서서 <span class="ms-all">모두 함께!</span></span>`
            : `${tok(p, 'xs')}${nm(p)} <span class="ms-arrow">${A.ICON.arrow}</span> ${tok(to, 'xs')}<span>${nm(to)}에게</span>`}</p>
          <h2 class="ms-title">${m.title}</h2>
          <p class="ms-label" hidden>쉬운 미션</p>
          <p class="ms-text">${fill(m.text, p, to)}</p>
          ${m.timer ? timerHTML(m.timer) : ''}
          <div class="ms-actions">
            <button class="btn primary big" data-act="m-done">미션 성공!</button>
            <button class="btn ghost" data-act="m-easy">${A.ICON.swap}<span>쉬운 미션으로 바꾸기</span></button>
          </div>
          <button class="link-btn ms-pass" data-act="m-pass">이번엔 넘어갈래요</button>
          <div class="ms-after" hidden></div>
          <div class="stamp" aria-hidden="true"><span class="stamp-in">${A.ORN.heart}<b>미션 성공!</b></span></div>
        </article>
        ${thermoHTML()}
      </div>`);
  }

  function toggleEasy() {
    const P = state.players, i = state.mIdx, p = P[i], to = P[(i + 1) % P.length];
    if (p.result) return;
    p.easy = !p.easy;
    S.tap();
    const text = $('.ms-text');
    text.innerHTML = fill(p.easy ? p.card.mission.easy : p.card.mission.text, p, to);
    text.classList.remove('swap');
    void text.offsetWidth;
    text.classList.add('swap');
    $('.ms-label').hidden = !p.easy;
    $('[data-act="m-easy"] span').textContent = p.easy ? '처음 미션으로 돌아가기' : '쉬운 미션으로 바꾸기';
    const tm = $('.timer');
    if (tm) { clearTimer(); tm.hidden = p.easy; }
  }

  function startTimer(btn) {
    const box = btn.closest('.timer');
    const total = +box.dataset.sec;
    clearTimer();
    S.tap();
    const end = Date.now() + total * 1000;
    let lastSec = total;
    box.classList.add('run');
    box.classList.remove('end');
    $('span', btn).textContent = '처음부터 다시';
    const num = $('.t-num', box), ring = $('.t-ring', box);
    state.timer = setInterval(() => {
      const left = Math.max(0, end - Date.now());
      const sec = Math.ceil(left / 1000);
      num.textContent = sec;
      ring.style.strokeDashoffset = String(100 - (left / (total * 1000)) * 100);
      if (sec !== lastSec) {
        lastSec = sec;
        if (sec > 0 && sec <= 5) S.tick();
      }
      if (left <= 0) {
        clearTimer();
        box.classList.remove('run');
        box.classList.add('end');
        num.textContent = '끝!';
        S.bell();
      }
    }, 100);
  }

  function clearTimer() {
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    if (state.later) { clearTimeout(state.later); state.later = null; }
  }

  function missionEnd(kind) {
    const P = state.players, n = P.length, p = P[state.mIdx];
    if (p.result) return;
    p.result = kind === 'pass' ? 'pass' : (p.easy ? 'easy' : 'done');
    clearTimer();
    const before = state.temp;
    const step = (100 - 36.5) / n;
    state.temp = Math.min(100, state.temp + (kind === 'pass' ? step * 0.5 : step));
    if (state.mIdx === n - 1 && P.every((q) => q.result !== 'pass')) state.temp = 100;

    const panel = $('.ms-panel');
    panel.classList.add(kind === 'pass' ? 'is-pass' : 'is-done');
    $('.ms-actions').hidden = true;
    $('.ms-pass').hidden = true;
    const tm = $('.timer');
    if (tm) tm.hidden = true;
    const last = state.mIdx === n - 1;
    const after = $('.ms-after');
    after.innerHTML = `
      <p class="ms-cheer">${kind === 'pass' ? '괜찮아요. 해 보려는 마음도 소중해요!' : pickOne(D.CHEERS)}</p>
      <button class="btn primary big" data-act="m-next">${last ? '오늘의 우정 운세 보기' : '다음 미션 열기'} ${A.ICON.arrow}</button>`;
    after.hidden = false;

    if (kind === 'pass') {
      S.soft();
    } else {
      S.stamp();
      const st = $('.stamp').getBoundingClientRect();
      setTimeout(() => burst(st.left + st.width / 2, st.top + st.height / 2, 26), 180);
    }
    setThermo(before, state.temp);
  }

  function setThermo(from, to) {
    const fillEl = $('.th-fill');
    if (fillEl) fillEl.style.setProperty('--lv', level(to));
    const out = $('.th-num b');
    if (!out) return;
    $('.thermo').classList.add('rise');
    const t0 = performance.now(), dur = reduce ? 1 : 1100;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      out.textContent = fmtTemp(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function nextMission() {
    S.tap();
    state.mIdx++;
    if (state.mIdx < state.players.length) renderMission();
    else renderGather();
  }

  // ---------- 6. 마법 모으기 ----------
  function renderGather() {
    const P = state.players;
    go('gather', `
      <div class="gather">
        <div class="ball-wrap">
          ${A.crystalBall()}
          <div class="orbit">
            ${P.map((p, i) => `<span class="orb fam-${p.card.family}" style="--a:${(360 / P.length) * i}deg">${A.symbol(p.card.id)}</span>`).join('')}
          </div>
        </div>
        <p class="gather-text">카드의 마법을 모으고 있어요<span class="dots"><i>.</i><i>.</i><i>.</i></span></p>
      </div>`);
    S.magic();
    state.later = setTimeout(renderResult, reduce ? 1200 : 3600);
  }

  // ---------- 7. 우정 운세 ----------
  function teamOf(P) {
    const cnt = {};
    D.FAM_ORDER.forEach((f) => { cnt[f] = 0; });
    P.forEach((p) => { cnt[p.card.family]++; });
    const fams = D.FAM_ORDER.filter((f) => cnt[f] > 0).sort((a, b) => cnt[b] - cnt[a]);
    if (fams.length === 1) return { key: fams[0], same: P.length > 1 };
    if (fams.length >= 3 && cnt[fams[0]] === 1) return { key: 'rainbow' };
    if (cnt[fams[0]] > cnt[fams[1]]) return { key: fams[0] };
    const pair = [fams[0], fams[1]].sort((a, b) => D.FAM_ORDER.indexOf(a) - D.FAM_ORDER.indexOf(b));
    return { key: pair.join('+') };
  }

  function energyOf(P) {
    const sum = {};
    D.FAM_ORDER.forEach((f) => { sum[f] = 0; });
    P.forEach((p) => D.FAM_ORDER.forEach((f) => { sum[f] += p.card.power[f]; }));
    const vals = Object.values(sum), mx = Math.max(...vals), mn = Math.min(...vals);
    return D.FAM_ORDER.map((f) => {
      const pct = mx === mn ? 100 : Math.round(62 + (38 * (sum[f] - mn)) / (mx - mn));
      return { f, pct, word: pct >= 100 ? '최고!' : pct >= 82 ? '가득' : '듬뿍' };
    });
  }

  function luckyOf(P, team) {
    const rnd = seeded(P.map((p) => p.card.id).join('|') + P.length);
    const from = (arr) => arr[Math.floor(rnd() * arr.length)];
    const fams = D.TEAMS[team.key].fams;
    return {
      place: from(D.LUCKY.place),
      time: from(D.LUCKY.time),
      item: from(D.LUCKY.item),
      color: team.key === 'rainbow' ? '무지개색' : fams.map((f) => D.FAMILIES[f].color).join('과 '),
    };
  }

  function renderResult() {
    const P = state.players, n = P.length;
    const team = teamOf(P);
    const T = D.TEAMS[team.key];
    const energy = energyOf(P);
    const lucky = luckyOf(P, team);
    const passed = P.filter((p) => p.result === 'pass').length;
    const intro = `${P.map((p) => `${nm(p)}의 <em>${p.card.keyword}</em>`).join(', ')} 마법이 하나로 합쳐졌어요.`;
    const missionLine = passed === 0
      ? `우정 미션 ${n}개를 모두 해낸 덕분에 우정 온도가 100℃까지 펄펄 끓어올랐어요.`
      : `용기 내어 도전한 미션 덕분에 우정 온도가 ${fmtTemp(state.temp)}℃까지 따끈따끈하게 올랐어요.`;

    go('result', `
      <div class="result">
        <article class="cert parchment">
          <span class="cert-orn tl">${A.ORN.star}</span><span class="cert-orn tr">${A.ORN.heart}</span>
          <span class="cert-orn bl">${A.ORN.heart}</span><span class="cert-orn br">${A.ORN.star}</span>
          <div class="cert-ribbon">오늘의 우정 운세</div>
          <div class="cert-emblem">${T.fams.map((f) => A.famIcon(f)).join('')}</div>
          <h2 class="cert-team">${T.name}</h2>
          <p class="cert-temp">우정 온도 <b>${fmtTemp(state.temp)}℃</b></p>
          <div class="cert-cards" style="--n:${n}">
            ${P.map((p) => `<figure>${cardHTML(p.card, { flipped: true, cls: 'instant' })}<figcaption>${tok(p, 'xs')}${nm(p)}</figcaption></figure>`).join('')}
          </div>
          <p class="cert-text">${intro} ${T.text}${team.same ? ' ' + D.SAME_BONUS : ''} ${missionLine}</p>

          <div class="cert-grid">
            <section class="energy">
              <h3>우리 팀 우정 에너지</h3>
              ${energy.map((e) => `
                <div class="en-row fam-${e.f}">
                  <span class="en-ico">${A.famIcon(e.f)}</span>
                  <span class="en-name">${D.FAMILIES[e.f].power}</span>
                  <span class="en-bar"><span style="--w:${e.pct}%"></span></span>
                  <span class="en-word">${e.word}</span>
                </div>`).join('')}
            </section>
            <section class="lucky">
              <h3>행운 쪽지</h3>
              <dl>
                <div><dt>행운의 장소</dt><dd>${lucky.place}</dd></div>
                <div><dt>행운의 시간</dt><dd>${lucky.time}</dd></div>
                <div><dt>행운의 색</dt><dd>${lucky.color}</dd></div>
                <div><dt>행운의 물건</dt><dd>${lucky.item}</dd></div>
              </dl>
            </section>
          </div>

          <section class="each">
            <h3>친구별 우정 운세</h3>
            <ul>
              ${P.map((p) => `
                <li class="each-row fam-${p.card.family}">
                  <span class="each-sym">${A.symbol(p.card.id)}</span>
                  <div class="each-body">
                    <p class="each-who">${tok(p, 'xs')}${nm(p)}<span class="each-card">${p.card.name}</span></p>
                    <p class="each-fortune">${p.card.fortune}</p>
                    <p class="each-promise"><span class="tag">나의 약속</span>${p.card.promise}</p>
                  </div>
                </li>`).join('')}
            </ul>
          </section>

          <section class="spell">
            <h3>다 함께 우정 주문을 외쳐요!</h3>
            <p class="spell-text">${T.spell}</p>
            <button class="btn gold big" data-act="spell">${A.ORN.sparkle}주문 외치기</button>
          </section>
        </article>
        <div class="actions end">
          <button class="btn primary big" data-act="restart">다음 친구들 맞이하기 ${A.ICON.arrow}</button>
        </div>
      </div>`);

    S.fanfare();
    requestAnimationFrame(() => requestAnimationFrame(() => $('.scr-result:not(.leaving)')?.classList.add('go')));
    setTimeout(confetti, 200);
  }

  function castSpell(btn) {
    S.magic();
    const t = $('.spell-text');
    t.classList.remove('cast');
    void t.offsetWidth;
    t.classList.add('cast');
    const r = t.getBoundingClientRect();
    [0.15, 0.5, 0.85].forEach((k, i) => setTimeout(() => burst(r.left + r.width * k, r.top + r.height / 2, 18), i * 160));
    setTimeout(confetti, 300);
    btn.lastChild.textContent = '한 번 더 외치기';
  }

  // ---------- 반짝이 효과 ----------
  const FX_COLORS = ['#ffd36e', '#ff8fc0', '#b4a6ff', '#7fe0c3', '#fff6d6'];
  function particle(kind, color, size) {
    const d = kind === 'heart' ? A.heartD(12, 12.4, 22) : kind === 'star' ? A.starD(12, 12.6, 11, 5) : A.sparkleD(12, 12, 11);
    const el = document.createElement('span');
    el.className = 'pt';
    el.style.width = el.style.height = size + 'px';
    el.innerHTML = `<svg viewBox="0 0 24 24"><path d="${d}" fill="${color}"/></svg>`;
    fx.appendChild(el);
    return el;
  }

  function burst(x, y, count = 18) {
    if (reduce || !document.body.animate) return;
    const kinds = ['star', 'heart', 'spark'];
    for (let i = 0; i < count; i++) {
      const size = 12 + Math.random() * 20;
      const el = particle(kinds[i % 3], FX_COLORS[i % FX_COLORS.length], size);
      el.style.left = x - size / 2 + 'px';
      el.style.top = y - size / 2 + 'px';
      const ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 200;
      const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 30;
      el.animate([
        { transform: 'translate(0,0) scale(.2)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(1) rotate(${Math.random() * 300 - 150}deg)`, opacity: 1, offset: 0.65 },
        { transform: `translate(${dx * 1.08}px, ${dy * 1.08 + 50}px) scale(.5) rotate(${Math.random() * 360}deg)`, opacity: 0 },
      ], { duration: 950 + Math.random() * 700, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => el.remove();
    }
  }

  function confetti(count = 44) {
    if (reduce || !document.body.animate) return;
    const W = window.innerWidth, H = window.innerHeight;
    for (let i = 0; i < count; i++) {
      const size = 12 + Math.random() * 16;
      const el = particle(i % 2 ? 'heart' : (i % 3 ? 'star' : 'spark'), FX_COLORS[i % FX_COLORS.length], size);
      el.style.left = Math.random() * W + 'px';
      el.style.top = -40 + 'px';
      const sway = (Math.random() - 0.5) * 160;
      el.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${sway}px, ${H * 0.55}px) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${-sway / 2}px, ${H + 80}px) rotate(${Math.random() * 720}deg)`, opacity: 0.2 },
      ], { duration: 2600 + Math.random() * 1800, delay: Math.random() * 700, easing: 'cubic-bezier(.3,.2,.6,1)', fill: 'backwards' }).onfinish = () => el.remove();
    }
  }

  // ---------- 상자(확인·안내) ----------
  function modal(html, focusSel) {
    return new Promise((resolve) => {
      const m = document.createElement('div');
      m.className = 'modal';
      m.innerHTML = `<div class="modal-card parchment" role="dialog" aria-modal="true">${html}</div>`;
      const close = (v) => { m.classList.add('out'); setTimeout(() => m.remove(), 220); resolve(v); };
      m.addEventListener('click', (e) => {
        const b = e.target.closest('[data-v]');
        if (b) close(b.dataset.v === '1');
        else if (e.target === m) close(false);
      });
      document.body.appendChild(m);
      const f = $(focusSel || '[data-v]', m);
      if (f) f.focus();
    });
  }

  async function goHome() {
    const scr = document.body.dataset.screen;
    if (scr === 'home' || $('.reveal')) return;
    if (scr === 'names' || scr === 'result') { S.tap(); renderHome(); return; }
    S.tap();
    const ok = await modal(`
      <h2>처음 화면으로 돌아갈까요?</h2>
      <p>지금까지 뽑은 카드와 미션 기록은 사라져요.</p>
      <div class="actions"><button class="btn ghost" data-v="0">계속하기</button><button class="btn primary" data-v="1">처음으로</button></div>`, '[data-v="0"]');
    if (ok) renderHome();
  }

  function showGuide() {
    S.tap();
    modal(`
      <h2>부스 도우미 안내</h2>
      <ol class="guide">
        <li>체험하러 온 친구 수(2~4명)를 고르고 이름이나 별명을 적어요. 비워 둬도 괜찮아요.</li>
        <li>한 명씩 차례대로 카드를 골라 톡 눌러요. 카드가 뒤집히면 카드 이름과 상징, 의미를 소리 내어 읽어 주세요.</li>
        <li>모두 뽑으면 카드마다 숨어 있던 우정 미션이 열려요. 미션은 다음 차례 친구에게 해요.</li>
        <li>부끄러워하는 친구가 있으면 <b>쉬운 미션으로 바꾸기</b>를 눌러 주세요. 넘어가도 괜찮아요.</li>
        <li>마지막에 우정 운세를 함께 읽고 다 같이 우정 주문을 외치면 끝이에요!</li>
      </ol>
      <p class="guide-tip">오른쪽 위 버튼으로 소리를 켜고 끌 수 있어요. 전체 화면 버튼을 누르면 주소창이 사라져서 체험에 더 집중할 수 있어요.</p>
      <div class="actions"><button class="btn primary" data-v="1">알겠어요</button></div>`);
  }

  // ---------- 위쪽 버튼 ----------
  function syncSound() {
    const b = $('#btn-sound');
    b.innerHTML = S.on ? A.ICON.soundOn : A.ICON.soundOff;
    b.setAttribute('aria-pressed', String(S.on));
    b.setAttribute('aria-label', S.on ? '소리 끄기' : '소리 켜기');
  }

  const de = document.documentElement;
  const canFull = !!(de.requestFullscreen || de.webkitRequestFullscreen);
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  function toggleFull() {
    if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else (de.requestFullscreen || de.webkitRequestFullscreen).call(de);
  }
  function syncFull() {
    const b = $('#btn-full');
    b.innerHTML = fsEl() ? A.ICON.fullExit : A.ICON.full;
    b.setAttribute('aria-label', fsEl() ? '전체 화면 끝내기' : '전체 화면');
    setTimeout(layoutGrid, 120);
  }

  // 부스에서 쓰는 동안 화면이 꺼지지 않게
  let wakeLock = null;
  async function keepAwake() {
    if (wakeLock || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch (e) { /* 지원하지 않으면 그냥 둔다 */ }
  }

  // ---------- 밤하늘 ----------
  function makeSky() {
    let html = '';
    for (let i = 0; i < 70; i++) {
      const s = Math.random() < 0.15 ? 3 : Math.random() < 0.5 ? 2 : 1.4;
      html += `<i style="left:${(Math.random() * 100).toFixed(2)}%;top:${(Math.random() * 100).toFixed(2)}%;--s:${s}px;--d:-${(Math.random() * 5).toFixed(2)}s;--t:${(2.4 + Math.random() * 3).toFixed(2)}s"></i>`;
    }
    for (let i = 0; i < 9; i++) {
      html += `<b class="tw" style="left:${(4 + Math.random() * 92).toFixed(2)}%;top:${(4 + Math.random() * 88).toFixed(2)}%;--z:${(10 + Math.random() * 14).toFixed(0)}px;--d:-${(Math.random() * 6).toFixed(2)}s">${A.ORN.sparkle}</b>`;
    }
    html += '<span class="shoot s1"></span><span class="shoot s2"></span>';
    $('#sky').innerHTML = html;
  }

  // ---------- 시작 ----------
  const ACT = {
    count: (b) => { S.tap(); state.count = +b.dataset.n; renderNames(); },
    'names-back': () => { S.tap(); renderHome(); },
    'start-draw': () => { S.tap(); startDraw(); },
    pick: (b) => pick(b),
    shuffle: () => shuffleCards(),
    keep: () => keep(),
    missions: () => { S.tap(); state.mIdx = 0; renderMission(); },
    timer: (b) => startTimer(b),
    'm-easy': () => toggleEasy(),
    'm-done': () => missionEnd('done'),
    'm-pass': () => missionEnd('pass'),
    'm-next': () => nextMission(),
    spell: (b) => castSpell(b),
    restart: () => { S.tap(); renderHome(); },
    home: () => goHome(),
    sound: () => { S.setOn(!S.on); syncSound(); S.tap(); },
    full: () => toggleFull(),
    help: () => showGuide(),
  };

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const fn = ACT[b.dataset.act];
    if (fn) fn(b, e);
  });

  document.addEventListener('keydown', (e) => {
    if (e.isComposing || e.key !== 'Enter' || !e.target.classList.contains('name-input')) return;
    e.preventDefault();
    const next = $(`.name-input[data-i="${+e.target.dataset.i + 1}"]`);
    if (next) next.focus();
    else startDraw();
  });

  document.addEventListener('pointerdown', keepAwake, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') keepAwake(); });
  document.addEventListener('fullscreenchange', syncFull);
  document.addEventListener('webkitfullscreenchange', syncFull);

  let resizeT = null;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(layoutGrid, 80); });

  de.style.setProperty('--card-back', A.CARD_BACK);
  de.style.setProperty('--front-pattern', A.FRONT_PATTERN);
  $('#btn-home').innerHTML = A.ICON.home;
  $('#btn-help').innerHTML = A.ICON.help;
  if (canFull) syncFull(); else $('#btn-full').hidden = true;
  syncSound();
  makeSky();
  renderHome();

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
  }
})();
