/*
 * 두근두근! 우정 타로! — 효과음
 * 소리 파일 없이 Web Audio로 만들어요. 소리 켜기/끄기는 이 기기에 기억해요.
 */
window.TAROT_SOUND = (function () {
  'use strict';

  const KEY = 'friendship-tarot.sound';
  let ctx = null;
  let on = true;
  try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) { /* 저장소를 못 쓰면 켠 채로 */ }

  function ac() {
    if (!on) return null;
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // 음 하나: 주파수, 시작(초), 길이, 모양, 크기, 끝 주파수
  function tone(c, freq, at, dur, type = 'sine', vol = 0.16, to = 0) {
    const t0 = c.currentTime + at;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  const N = { C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98, A6: 1760, C7: 2093 };

  const play = (fn) => () => { const c = ac(); if (c) fn(c); };

  return {
    get on() { return on; },
    setOn(v) {
      on = !!v;
      try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* 무시 */ }
      if (on) ac();
    },
    tap: play((c) => tone(c, N.A5, 0, 0.09, 'triangle', 0.12)),
    whoosh: play((c) => { tone(c, 320, 0, 0.35, 'sine', 0.1, 980); tone(c, 640, 0.05, 0.3, 'triangle', 0.05, 1500); }),
    reveal: play((c) => {
      [N.C6, N.E6, N.G6, N.C7].forEach((f, i) => tone(c, f, i * 0.07, 0.5, 'sine', 0.13));
      [N.E6, N.G6].forEach((f, i) => tone(c, f * 1.003, 0.32 + i * 0.09, 0.6, 'triangle', 0.05));
    }),
    shuffle: play((c) => { for (let i = 0; i < 7; i++) tone(c, 900 + Math.random() * 500, i * 0.11, 0.06, 'triangle', 0.05); }),
    stamp: play((c) => {
      tone(c, 160, 0, 0.18, 'sine', 0.3, 70);
      [N.G5, N.C6, N.E6, N.G6].forEach((f, i) => tone(c, f, 0.12 + i * 0.08, 0.35, 'triangle', 0.1));
    }),
    soft: play((c) => { tone(c, N.E5, 0, 0.25, 'sine', 0.1); tone(c, N.G5, 0.12, 0.35, 'sine', 0.1); }),
    tick: play((c) => tone(c, 1200, 0, 0.05, 'square', 0.04)),
    bell: play((c) => { tone(c, N.C6, 0, 0.9, 'sine', 0.18); tone(c, N.C6 * 2.01, 0, 0.6, 'sine', 0.05); tone(c, N.G5, 0.25, 0.9, 'sine', 0.12); }),
    fanfare: play((c) => {
      const seq = [[N.C5, 0], [N.E5, 0.12], [N.G5, 0.24], [N.C6, 0.36], [N.G5, 0.56], [N.C6, 0.68]];
      seq.forEach(([f, t]) => { tone(c, f, t, 0.3, 'triangle', 0.12); tone(c, f * 2, t, 0.2, 'sine', 0.04); });
      [N.C6, N.E6, N.G6, N.C7].forEach((f, i) => tone(c, f, 0.9 + i * 0.06, 0.8, 'sine', 0.08));
    }),
    magic: play((c) => {
      const up = [N.C6, N.D6, N.E6, N.G6, N.A6, N.C7];
      up.forEach((f, i) => tone(c, f, i * 0.06, 0.5, 'sine', 0.1));
      up.slice().reverse().forEach((f, i) => tone(c, f * 1.5, 0.45 + i * 0.05, 0.4, 'triangle', 0.04));
    }),
  };
})();
