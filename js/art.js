/*
 * 두근두근! 우정 타로! — 그림(SVG)
 * 카드 상징 12개, 카드 뒷면, 친구 동물 표시, 마법 아이콘, 수정 구슬
 */
window.TAROT_ART = (function () {
  'use strict';

  const INK = '#4a2e6e';
  const OL = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const OL2 = `stroke="${INK}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;
  let uidN = 0;
  const uid = () => 'tt' + (++uidN).toString(36);
  const r2 = (n) => Math.round(n * 100) / 100;

  // ---------- 모양 도우미 ----------
  function starD(cx, cy, R, r, n = 5, rot = -90) {
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const a = (rot + (i * 180) / n) * Math.PI / 180;
      const rr = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + r2(cx + rr * Math.cos(a)) + ' ' + r2(cy + rr * Math.sin(a));
    }
    return d + 'Z';
  }

  const HEART = [[22, 70, 6, 52, 6, 34], [6, 20, 17, 10, 30, 10], [39, 10, 46, 15, 50, 22],
    [54, 15, 61, 10, 70, 10], [83, 10, 94, 20, 94, 34], [94, 52, 78, 70, 50, 88]];
  function heartD(cx, cy, w) {
    const k = w / 88;
    const X = (x) => r2(cx + (x - 50) * k), Y = (y) => r2(cy + (y - 49) * k);
    let d = `M${X(50)} ${Y(88)}`;
    for (const s of HEART) d += `C${X(s[0])} ${Y(s[1])} ${X(s[2])} ${Y(s[3])} ${X(s[4])} ${Y(s[5])}`;
    return d + 'Z';
  }

  function sparkleD(cx, cy, s) {
    const k = s * 0.2;
    return `M${r2(cx)} ${r2(cy - s)}Q${r2(cx + k)} ${r2(cy - k)} ${r2(cx + s)} ${r2(cy)}` +
      `Q${r2(cx + k)} ${r2(cy + k)} ${r2(cx)} ${r2(cy + s)}Q${r2(cx - k)} ${r2(cy + k)} ${r2(cx - s)} ${r2(cy)}` +
      `Q${r2(cx - k)} ${r2(cy - k)} ${r2(cx)} ${r2(cy - s)}Z`;
  }

  // 큰 원(x1,y1,R1)에서 작은 원(x2,y2,R2)을 도려낸 초승달
  function crescentD(x1, y1, R1, x2, y2, R2) {
    const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy);
    const ux = dx / d, uy = dy / d;
    const a = (R1 * R1 - R2 * R2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, R1 * R1 - a * a));
    const px = x1 + a * ux, py = y1 + a * uy;
    const i1 = [px - h * uy, py + h * ux], i2 = [px + h * uy, py - h * ux];
    const T = Math.PI * 2, norm = (v) => ((v % T) + T) % T;
    const arc = (cx, cy, R, from, to, via) => {
      const ang = (p) => Math.atan2(p[1] - cy, p[0] - cx);
      const a0 = ang(from), dv = norm(ang(via) - a0), dt = norm(ang(to) - a0);
      const sweep = dv < dt ? 1 : 0;
      const span = sweep ? dt : T - dt;
      return `A${r2(R)} ${r2(R)} 0 ${span > Math.PI ? 1 : 0} ${sweep} ${r2(to[0])} ${r2(to[1])}`;
    };
    const far = [x1 - R1 * ux, y1 - R1 * uy];
    const near = [x2 - R2 * ux, y2 - R2 * uy];
    return `M${r2(i1[0])} ${r2(i1[1])}` + arc(x1, y1, R1, i1, i2, far) + arc(x2, y2, R2, i2, i1, near) + 'Z';
  }

  const path = (d, fill, ol = OL, extra = '') => `<path d="${d}" fill="${fill}" ${ol} ${extra}/>`;
  const spark = (cx, cy, s, fill = '#fff6c9', op = 1) => `<path d="${sparkleD(cx, cy, s)}" fill="${fill}" opacity="${op}"/>`;
  const heart = (cx, cy, w, fill, ol = OL2) => path(heartD(cx, cy, w), fill, ol);
  const blush = (cx, cy, rx = 4.5, ry = 3) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#ff8fb8" opacity=".55"/>`;
  const eye = (cx, cy, s = 1) => `<ellipse cx="${cx}" cy="${cy}" rx="${2.5 * s}" ry="${3.2 * s}" fill="${INK}"/><circle cx="${r2(cx - 0.8 * s)}" cy="${r2(cy - 1.2 * s)}" r="${0.9 * s}" fill="#fff"/>`;
  const smile = (cx, cy, w, h) => `<path d="M${cx - w} ${cy}Q${cx} ${cy + h} ${cx + w} ${cy}" fill="none" ${OL2}/>`;
  const lin = (id, a, b, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const rad = (id, a, b, cx = '.4', cy = '.35') => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".75"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`;
  const svg = (inner, defs = '', vb = '0 0 120 120', cls = 'sym') =>
    `<svg class="${cls}" viewBox="${vb}" aria-hidden="true" focusable="false"><defs>${defs}</defs>${inner}</svg>`;

  // ---------- 카드 상징 12개 ----------
  const SYMBOLS = {
    wish() {
      const g = uid();
      return svg(
        `<path d="M58 54Q36 64 12 96" fill="none" stroke="#ffd96b" stroke-width="9" stroke-linecap="round"/>` +
        `<path d="M66 62Q50 82 36 108" fill="none" stroke="#ff9ec8" stroke-width="7" stroke-linecap="round"/>` +
        `<path d="M52 46Q30 48 8 70" fill="none" stroke="#b9a8ff" stroke-width="7" stroke-linecap="round"/>` +
        spark(26, 84, 3.5, '#fff') + spark(44, 92, 2.8, '#fff') + spark(22, 62, 2.6, '#fff') +
        path(starD(76, 42, 30, 15.5), `url(#${g})`) +
        eye(69.5, 42) + eye(82.5, 42) + smile(76, 49, 4.5, 5) + blush(63, 49, 4, 2.6) + blush(89, 49, 4, 2.6) +
        spark(102, 88, 6, '#ffd96b') + spark(100, 12, 4.5, '#fff') + spark(20, 22, 5, '#fff') +
        heart(106, 64, 12, '#ff9ec8'),
        lin(g, '#fff6c2', '#ffc93d', 1, 1)
      );
    },

    crown() {
      const g = uid();
      return svg(
        path('M22 86L16 42L40 60L60 28L80 60L104 42L98 86Z', `url(#${g})`) +
        `<path d="M30 74L27 54" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>` +
        `<rect x="19" y="79" width="82" height="17" rx="7" fill="#ffb93b" ${OL}/>` +
        `<circle cx="16" cy="40" r="6" fill="#ff8fbf" ${OL2}/><circle cx="104" cy="40" r="6" fill="#ff8fbf" ${OL2}/>` +
        `<circle cx="60" cy="24" r="7" fill="#ff8fbf" ${OL2}/>` +
        path(starD(60, 63, 11, 5.6), '#ff6fa8', OL2) +
        heart(40, 87.5, 11, '#ff6fa8') + heart(80, 87.5, 11, '#ff6fa8') +
        `<circle cx="60" cy="87.5" r="4.2" fill="#7fe0c3" ${OL2}/>` +
        spark(10, 16, 6, '#ffd96b') + spark(108, 18, 5, '#fff') + spark(104, 108, 5, '#ffd96b') + spark(14, 106, 4, '#fff'),
        lin(g, '#fff0a8', '#ffc23d')
      );
    },

    constellation() {
      const g = uid();
      const pts = [[60, 46], [48, 36], [34, 38], [28, 52], [36, 66], [48, 78], [60, 89], [72, 78], [84, 66], [92, 52], [86, 38], [72, 36]];
      const dots = [[22, 30], [96, 82], [30, 88], [88, 24], [60, 22], [16, 64], [104, 60], [70, 100], [46, 100]];
      return svg(
        `<circle cx="60" cy="60" r="51" fill="url(#${g})" ${OL}/>` +
        `<circle cx="60" cy="60" r="44" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1.4" stroke-dasharray="1 5"/>` +
        dots.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 1 : 1.4}" fill="#fff" opacity=".6"/>`).join('') +
        `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#ffe9a3" stroke-width="1.8" stroke-dasharray="3 3" opacity=".85"/>` +
        pts.map(([x, y], i) => i % 3 === 0
          ? path(starD(x, y, 6.5, 3.2), '#ffe27a', `stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"`)
          : spark(x, y, i % 2 ? 4.2 : 5, '#fff7d1')).join('') +
        heart(60, 62, 14, '#ff9ec8', `stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"`),
        rad(g, '#5a3fb0', '#1e1655', '.5', '.4')
      );
    },

    // 둥근 쿠키를 반으로 나눈 두 조각이 서로 마주 보고 웃는다
    cookie() {
      const g = uid(), cl = uid(), cr = uid(), ch = uid();
      const zig = [[60, 20], [58, 34], [65, 47], [55, 60], [64, 74], [56, 88], [61, 108]];
      const zs = zig.map((p) => p.join(',')).join(' ');
      const left = `0,0 60,0 ${zs} 60,120 0,120`;
      const right = `60,0 120,0 120,120 60,120 ${zig.slice().reverse().map((p) => p.join(',')).join(' ')}`;
      const C = `<circle cx="60" cy="66" r="38" fill="url(#${g})" ${OL}/>`;
      const half = (clip, chips, fx, fy) =>
        `<g clip-path="url(#${clip})">` + C +
        chips.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#7a4524"/>`).join('') +
        eye(fx - 5.5, fy, 0.85) + eye(fx + 5.5, fy, 0.85) + smile(fx, fy + 5.5, 3.6, 4) +
        blush(fx - 10, fy + 5, 3.4, 2.2) + blush(fx + 10, fy + 5, 3.4, 2.2) +
        `<g clip-path="url(#${ch})"><polyline points="${zs}" fill="none" ${OL}/></g></g>`;
      return svg(
        `<g transform="translate(-7 4) rotate(-10 40 66)">` +
        half(cl, [[36, 42, 3.4], [50, 46, 2.8], [28, 82, 3.2], [44, 92, 3], [26, 60, 2.4]], 42, 66) + `</g>` +
        `<g transform="translate(7 1) rotate(9 80 66)">` +
        half(cr, [[78, 40, 3.2], [90, 48, 2.8], [92, 82, 3.4], [76, 92, 3], [96, 64, 2.4]], 78, 64) + `</g>` +
        `<circle cx="60" cy="112" r="2.2" fill="#e8a957"/><circle cx="67" cy="108" r="1.6" fill="#e8a957"/><circle cx="53" cy="109" r="1.7" fill="#e8a957"/>` +
        heart(60, 14, 16, '#ff6fa8') +
        spark(14, 18, 6, '#ffd96b') + spark(106, 20, 5, '#fff') + spark(108, 100, 4.5, '#ffd96b') + spark(12, 102, 3.5, '#fff'),
        rad(g, '#fbdba0', '#e09a4a', '.4', '.35') +
        `<clipPath id="${cl}"><polygon points="${left}"/></clipPath>` +
        `<clipPath id="${cr}"><polygon points="${right}"/></clipPath>` +
        `<clipPath id="${ch}"><circle cx="60" cy="66" r="38"/></clipPath>`
      );
    },

    letter() {
      const g = uid();
      return svg(
        `<rect x="16" y="44" width="88" height="58" rx="7" fill="#ffc4dc" ${OL}/>` +
        `<rect x="30" y="18" width="60" height="50" rx="5" fill="#fff" ${OL2}/>` +
        `<path d="M38 30H76M38 39H80M38 48H70" fill="none" stroke="#c9b8ef" stroke-width="2.6" stroke-linecap="round"/>` +
        path('M16 54L60 80L104 54V95Q104 102 97 102H23Q16 102 16 95Z', `url(#${g})`) +
        `<path d="M20 99L50 77M100 99L70 77" fill="none" stroke="#e9a2c2" stroke-width="2.6" stroke-linecap="round"/>` +
        heart(60, 80, 24, '#ff5f9c', OL2) +
        `<ellipse cx="53.5" cy="75" rx="2.6" ry="1.8" fill="#fff" opacity=".8"/>` +
        heart(14, 26, 13, '#ff8fbf') + heart(104, 22, 11, '#ffb3d3') + heart(98, 40, 7, '#ff8fbf') +
        spark(10, 54, 4.5, '#ffd96b') + spark(110, 64, 4, '#fff'),
        lin(g, '#ffeef5', '#ffd3e6')
      );
    },

    umbrella() {
      const g = uid();
      const drop = (x, y) => `<path d="M${x} ${y - 6}Q${x + 5} ${y + 1} ${x} ${y + 5}Q${x - 5} ${y + 1} ${x} ${y - 6}Z" fill="#9fd7ff" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`;
      const canopy = 'M14 60Q16 18 60 16Q104 18 106 60Q95 52 83 60Q72 52 60 60Q48 52 37 60Q26 52 14 60Z';
      return svg(
        drop(14, 12) + drop(106, 10) + drop(8, 82) + drop(112, 88) + drop(24, 108) + drop(98, 110) +
        path(canopy, `url(#${g})`, 'stroke="none"') +
        `<path d="M60 16Q48 30 37 60Q48 52 60 60Q72 52 83 60Q72 30 60 16Z" fill="#ffd9ea"/>` +
        `<path d="M60 16Q48 30 37 60M60 16Q72 30 83 60" fill="none" stroke="${INK}" stroke-width="2" opacity=".45"/>` +
        path(canopy, 'none') +
        heart(60, 11, 13, '#ffd36e') +
        `<path d="M60 60V96Q60 105 52 105Q45 105 45 98" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>` +
        `<path d="M50 90L58 84M70 90L62 84" fill="none" ${OL2}/>` +
        `<circle cx="41" cy="86" r="11" fill="#ffe27a" ${OL2}/><circle cx="79" cy="86" r="11" fill="#a8ecd5" ${OL2}/>` +
        `<circle cx="37.5" cy="85" r="1.7" fill="${INK}"/><circle cx="44.5" cy="85" r="1.7" fill="${INK}"/>` +
        smile(41, 89, 3, 3) + blush(35, 90, 2.6, 1.8) + blush(47, 90, 2.6, 1.8) +
        `<circle cx="75.5" cy="85" r="1.7" fill="${INK}"/><circle cx="82.5" cy="85" r="1.7" fill="${INK}"/>` +
        smile(79, 89, 3, 3) + blush(73, 90, 2.6, 1.8) + blush(85, 90, 2.6, 1.8),
        lin(g, '#ffb8d8', '#ff7fb5')
      );
    },

    listen() {
      const g = uid();
      return svg(
        path(crescentD(50, 64, 38, 70, 50, 32), `url(#${g})`) +
        `<path d="M27 72Q31 67.5 35 72" fill="none" ${OL2}/>` +
        smile(38, 81, 3.5, 3.5) + blush(28, 80, 4, 2.6) +
        `<rect x="72" y="12" width="38" height="28" rx="12" fill="#fff" ${OL2}/>` +
        `<path d="M80 39L74 50L90 40" fill="#fff" ${OL2}/>` +
        `<path d="M79 38.6L89 38.6" stroke="#fff" stroke-width="3"/>` +
        heart(91, 26, 13, '#ff8fbf', `stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"`) +
        `<path d="M70 58Q75 64 70 70M77 54Q85 64 77 74" fill="none" stroke="#9b88ff" stroke-width="2.8" stroke-linecap="round"/>` +
        path(starD(100, 76, 7, 3.6), '#ffd96b', `stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"`) +
        spark(96, 102, 5, '#fff') + spark(14, 20, 5.5, '#ffd96b') + spark(34, 16, 3, '#fff') + spark(108, 54, 3.5, '#fff'),
        lin(g, '#fff6c8', '#ffd36e', 0.6, 1)
      );
    },

    lantern() {
      const g = uid(), gl = uid();
      const ray = (x1, y1, x2, y2) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#ffcf5a" stroke-width="3.4" stroke-linecap="round"/>`;
      return svg(
        `<circle cx="60" cy="66" r="50" fill="url(#${gl})"/>` +
        ray(24, 66, 15, 66) + ray(96, 66, 105, 66) + ray(29, 46, 22, 40) + ray(91, 46, 98, 40) + ray(29, 88, 22, 94) + ray(91, 88, 98, 94) +
        `<path d="M47 32Q60 8 73 32" fill="none" ${OL}/>` +
        `<rect x="38" y="40" width="44" height="50" rx="12" fill="url(#${g})" ${OL}/>` +
        `<path d="M47 46V84M73 46V84" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>` +
        heart(60, 65, 24, '#ff9a6b', OL2) + heart(60, 67, 11, '#ffe27a', 'stroke="none"') +
        path('M32 40Q60 22 88 40Z', '#8a74f0') +
        path(crescentD(60, 33, 4.6, 62.6, 31.6, 3.8), '#ffe27a', 'stroke="none"') +
        `<rect x="33" y="88" width="54" height="10" rx="4" fill="#8a74f0" ${OL}/>` +
        `<rect x="49" y="98" width="22" height="6" rx="3" fill="#6c55e0" ${OL2}/>` +
        spark(18, 16, 5, '#fff') + spark(104, 108, 4.5, '#fff') + spark(104, 18, 3.5, '#ffd96b'),
        rad(g, '#fffbe0', '#ffd36e', '.5', '.5') +
        `<radialGradient id="${gl}"><stop offset="0" stop-color="#ffe9a6" stop-opacity=".9"/><stop offset="1" stop-color="#ffe9a6" stop-opacity="0"/></radialGradient>`
      );
    },

    bracelet() {
      const g = uid();
      const cols = ['#ff9cc8', '#ffd36e', '#b9a8ff', '#8fe3c8', '#9fd7ff'];
      const beads = [];
      const N = 14;
      for (let i = 0; i < N; i++) {
        const t = Math.PI / 2 + (i * Math.PI * 2) / N;
        beads.push({ x: 60 + 36 * Math.cos(t), y: 52 + 24 * Math.sin(t), front: Math.sin(t), c: cols[i % cols.length] });
      }
      beads.sort((a, b) => a.y - b.y);
      const bead = (b) => {
        const rr = 6.2 + 1.8 * (b.front + 1) / 2;
        return `<circle cx="${r2(b.x)}" cy="${r2(b.y)}" r="${r2(rr)}" fill="${b.c}" ${OL2}/>` +
          `<circle cx="${r2(b.x - rr * 0.32)}" cy="${r2(b.y - rr * 0.34)}" r="${r2(rr * 0.28)}" fill="#fff" opacity=".8"/>`;
      };
      return svg(
        `<ellipse cx="60" cy="52" rx="36" ry="24" fill="none" stroke="#c9b8ef" stroke-width="2.2"/>` +
        beads.map(bead).join('') +
        `<circle cx="60" cy="87" r="3.6" fill="none" ${OL2}/>` +
        heart(60, 100, 24, `url(#${g})`, OL2) + spark(60, 99, 4, '#fff') +
        spark(14, 18, 6, '#ffd96b') + spark(106, 20, 5, '#fff') + spark(100, 98, 4.5, '#ffd96b') + spark(20, 98, 3.5, '#fff'),
        lin(g, '#fff0a8', '#ffb93b')
      );
    },

    sun() {
      const g = uid();
      let rays = '';
      for (let i = 0; i < 12; i++) {
        const a = (i * 30) * Math.PI / 180, R = i % 2 ? 47 : 52;
        rays += `<path d="M${r2(60 + 37 * Math.cos(a))} ${r2(60 + 37 * Math.sin(a))}L${r2(60 + R * Math.cos(a))} ${r2(60 + R * Math.sin(a))}" stroke="${i % 2 ? '#ffd36e' : '#ffa95e'}" stroke-width="8" stroke-linecap="round"/>`;
      }
      return svg(
        rays +
        `<circle cx="60" cy="60" r="32" fill="url(#${g})" ${OL}/>` +
        `<path d="M45 56Q49.5 50 54 56M66 56Q70.5 50 75 56" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M48 65Q60 80 72 65Z" fill="#5a2e5e" ${OL2}/>` +
        `<ellipse cx="60" cy="70.5" rx="5.5" ry="2.6" fill="#ff8fb0"/>` +
        blush(42, 66, 5, 3.2) + blush(78, 66, 5, 3.2) +
        spark(12, 12, 5, '#fff') + spark(108, 108, 5, '#fff'),
        rad(g, '#fff6c0', '#ffbe45')
      );
    },

    rainbow() {
      const bands = ['#ff8fb8', '#ffb36b', '#ffe27a', '#8fe3c8', '#a99bff'];
      const arc = (r, col, w) => `<path d="M${60 - r} 86A${r} ${r} 0 0 1 ${60 + r} 86" fill="none" stroke="${col}" stroke-width="${w}"/>`;
      const cloud = (cs) => cs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}" stroke="${INK}" stroke-width="5.4"/>`).join('') +
        cs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`).join('');
      return svg(
        arc(50.6, INK, 3) + arc(13.4, INK, 3) +
        bands.map((c, i) => arc(46 - i * 7.3, c, 7.6)).join('') +
        cloud([[12, 92, 8], [22, 86, 11], [33, 91, 9], [22, 97, 8]]) +
        cloud([[108, 92, 8], [98, 86, 11], [87, 91, 9], [98, 97, 8]]) +
        `<circle cx="19" cy="89" r="1.4" fill="${INK}"/><circle cx="26" cy="89" r="1.4" fill="${INK}"/>` +
        `<circle cx="94" cy="89" r="1.4" fill="${INK}"/><circle cx="101" cy="89" r="1.4" fill="${INK}"/>` +
        blush(16, 93, 2.4, 1.6) + blush(29, 93, 2.4, 1.6) + blush(91, 93, 2.4, 1.6) + blush(104, 93, 2.4, 1.6) +
        heart(60, 20, 18, '#ff8fbf') +
        spark(22, 26, 5, '#ffd96b') + spark(98, 26, 5, '#fff') + spark(60, 106, 4, '#fff') + spark(40, 10, 3, '#fff')
      );
    },

    balloon() {
      const g = uid();
      return svg(
        `<path d="M32 69Q38 90 60 104M60 74Q55 90 60 104M88 57Q83 86 60 104" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>` +
        `<ellipse cx="32" cy="46" rx="16" ry="19" fill="#b9a8ff" ${OL2}/>` +
        `<path d="M29 64.5L32 69.5L35 64.5Z" fill="#b9a8ff" ${OL2}/>` +
        `<ellipse cx="26" cy="39" rx="3.4" ry="6" fill="#fff" opacity=".7" transform="rotate(20 26 39)"/>` +
        path(starD(88, 38, 20, 11), '#ffd36e', OL2) +
        `<path d="M85.5 49.5L88 55L90.5 49.5Z" fill="#ffd36e" ${OL2}/>` +
        spark(84, 33, 3.5, '#fff') +
        path(heartD(60, 46, 50), `url(#${g})`) +
        `<path d="M56.5 68L60 74.5L63.5 68Z" fill="#ff6fa8" ${OL2}/>` +
        `<ellipse cx="47" cy="37" rx="4" ry="7.5" fill="#fff" opacity=".7" transform="rotate(-30 47 37)"/>` +
        `<path d="M60 104Q50 95 49 103Q49 112 60 104Q70 95 71 103Q71 112 60 104Z" fill="#ff8fbf" ${OL2}/>` +
        spark(104, 88, 5, '#fff') + spark(14, 86, 4.5, '#ffd96b') + spark(60, 12, 4.5, '#fff') + spark(110, 64, 3, '#ffd96b'),
        lin(g, '#ffc0dc', '#ff6fa8', 0.4, 1)
      );
    },
  };

  // ---------- 친구 동물 표시 ----------
  const TOKENS = {
    rabbit: () => svg(
      `<g transform="rotate(-10 38 40)"><ellipse cx="38" cy="26" rx="9" ry="20" fill="#fff" ${OL}/><ellipse cx="38" cy="28" rx="4" ry="13" fill="#ffb3cf"/></g>` +
      `<g transform="rotate(10 62 40)"><ellipse cx="62" cy="26" rx="9" ry="20" fill="#fff" ${OL}/><ellipse cx="62" cy="28" rx="4" ry="13" fill="#ffb3cf"/></g>` +
      `<ellipse cx="50" cy="62" rx="29" ry="26" fill="#fff" ${OL}/>` +
      eye(40.5, 59) + eye(59.5, 59) +
      `<ellipse cx="50" cy="66" rx="3.4" ry="2.4" fill="#ff7fa8"/>` +
      `<path d="M50 68Q46 72.5 42.5 70M50 68Q54 72.5 57.5 70" fill="none" ${OL2}/>` +
      blush(34, 68, 5, 3.2) + blush(66, 68, 5, 3.2),
      '', '0 0 100 100', 'tok-svg'),
    bear: () => svg(
      `<circle cx="27" cy="34" r="12" fill="#c98b5a" ${OL}/><circle cx="27" cy="34" r="5.5" fill="#f2c39b"/>` +
      `<circle cx="73" cy="34" r="12" fill="#c98b5a" ${OL}/><circle cx="73" cy="34" r="5.5" fill="#f2c39b"/>` +
      `<ellipse cx="50" cy="59" rx="31" ry="28" fill="#d79c6b" ${OL}/>` +
      `<ellipse cx="50" cy="69" rx="13" ry="10" fill="#f6dcc0"/>` +
      eye(38.5, 55) + eye(61.5, 55) +
      `<ellipse cx="50" cy="65" rx="4.8" ry="3.4" fill="${INK}"/>` +
      `<path d="M50 68V72M50 72Q46.5 75 43.5 73M50 72Q53.5 75 56.5 73" fill="none" ${OL2}/>` +
      blush(32, 65, 5, 3.2) + blush(68, 65, 5, 3.2),
      '', '0 0 100 100', 'tok-svg'),
    cat: () => svg(
      path('M22 50L26 16L48 34Z', '#cfc6ec') + path('M78 50L74 16L52 34Z', '#cfc6ec') +
      `<path d="M28 40L29.5 25L39 33Z" fill="#ffb3cf"/><path d="M72 40L70.5 25L61 33Z" fill="#ffb3cf"/>` +
      `<ellipse cx="50" cy="59" rx="31" ry="27" fill="#cfc6ec" ${OL}/>` +
      `<path d="M44 37V43M50 35V42M56 37V43" stroke="#9d90cf" stroke-width="2.6" stroke-linecap="round"/>` +
      eye(39, 57) + eye(61, 57) +
      `<path d="M47 64H53L50 67.5Z" fill="#ff7fa8" stroke="#ff7fa8" stroke-width="1.5" stroke-linejoin="round"/>` +
      `<path d="M50 67.5Q47 71.5 43.5 68.5M50 67.5Q53 71.5 56.5 68.5" fill="none" ${OL2}/>` +
      `<path d="M30 63L15 61M30 68L16 71M70 63L85 61M70 68L84 71" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>` +
      blush(33, 67, 4.5, 3) + blush(67, 67, 4.5, 3),
      '', '0 0 100 100', 'tok-svg'),
    chick: () => svg(
      `<path d="M50 26Q44 12 52 9Q50 17 58 14Q52 20 50 26Z" fill="#ffd23f" ${OL2}/>` +
      `<circle cx="50" cy="58" r="33" fill="#ffe066" ${OL}/>` +
      `<path d="M19 66Q12 58 20 50" fill="none" ${OL2}/><path d="M81 66Q88 58 80 50" fill="none" ${OL2}/>` +
      eye(39, 54) + eye(61, 54) +
      `<path d="M43 63L50 58.5L57 63L50 68Z" fill="#ff9f43" ${OL2}/><path d="M43 63H57" stroke="${INK}" stroke-width="1.6"/>` +
      blush(31, 64, 5, 3.2) + blush(69, 64, 5, 3.2),
      '', '0 0 100 100', 'tok-svg'),
  };

  // ---------- 마법 아이콘(작게) ----------
  const thin = `stroke="${INK}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"`;
  const FAM_ICON = {
    star: () => svg(path(starD(12, 12.8, 10.5, 5.4), '#ffcf5a', thin), '', '0 0 24 24', 'fam-ico'),
    heart: () => svg(path(heartD(12, 12.6, 20), '#ff8fbf', thin), '', '0 0 24 24', 'fam-ico'),
    moon: () => svg(path(crescentD(11, 12.5, 9.5, 15.5, 9.5, 8), '#b1a3ff', thin), '', '0 0 24 24', 'fam-ico'),
    sun: () => {
      let r = '';
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        r += `<path d="M${r2(12 + 7.4 * Math.cos(a))} ${r2(12 + 7.4 * Math.sin(a))}L${r2(12 + 10.4 * Math.cos(a))} ${r2(12 + 10.4 * Math.sin(a))}" stroke="#ff9a4a" stroke-width="2.2" stroke-linecap="round"/>`;
      }
      return svg(r + `<circle cx="12" cy="12" r="5.6" fill="#ffad66" ${thin}/>`, '', '0 0 24 24', 'fam-ico');
    },
  };

  // 카드 모서리 장식(색은 CSS currentColor)
  const ORN = {
    star: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${starD(12, 12.6, 11, 5)}" fill="currentColor"/></svg>`,
    heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${heartD(12, 12.4, 22)}" fill="currentColor"/></svg>`,
    sparkle: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${sparkleD(12, 12, 11)}" fill="currentColor"/></svg>`,
  };

  // ---------- 카드 뒷면(데이터 주소로 한 번만 만들어 CSS 배경으로 씀) ----------
  function cardBackSVG() {
    const tiny = [[34, 64], [166, 70], [48, 112], [154, 118], [30, 168], [172, 176], [50, 214], [150, 220], [40, 250], [160, 246],
      [74, 82], [128, 80], [70, 226], [132, 228], [100, 70], [100, 232]];
    let deco = '';
    tiny.forEach(([x, y], i) => {
      if (i % 4 === 1) deco += `<path d="${heartD(x, y, 9)}" fill="#ff9ec8" opacity=".55"/>`;
      else if (i % 4 === 3) deco += `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff" opacity=".6"/>`;
      else deco += `<path d="${sparkleD(x, y, i % 3 ? 4 : 5.5)}" fill="#ffe29a" opacity=".75"/>`;
    });
    let rays = '';
    for (let i = 0; i < 16; i++) {
      const a = (i * 22.5) * Math.PI / 180, R1 = 64, R2 = i % 2 ? 71 : 78;
      rays += `<path d="M${r2(100 + R1 * Math.cos(a))} ${r2(150 + R1 * Math.sin(a))}L${r2(100 + R2 * Math.cos(a))} ${r2(150 + R2 * Math.sin(a))}" stroke="#ffd36e" stroke-width="${i % 2 ? 1.4 : 2.2}" stroke-linecap="round" opacity=".7"/>`;
    }
    const corner = (x, y) => `<path d="${starD(x, y, 7, 3.2)}" fill="url(#gd)"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300">` +
      `<defs>` +
      `<linearGradient id="bg" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#4a2c94"/><stop offset=".55" stop-color="#2c1d6e"/><stop offset="1" stop-color="#1b1350"/></linearGradient>` +
      `<radialGradient id="gl"><stop offset="0" stop-color="#8a5ce6" stop-opacity=".75"/><stop offset="1" stop-color="#8a5ce6" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset=".5" stop-color="#ffd36e"/><stop offset="1" stop-color="#eba93a"/></linearGradient>` +
      `<linearGradient id="hp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb3d6"/><stop offset="1" stop-color="#ff6fa8"/></linearGradient>` +
      `</defs>` +
      `<rect width="200" height="300" rx="18" fill="url(#bg)"/>` +
      `<circle cx="100" cy="150" r="98" fill="url(#gl)"/>` +
      deco +
      `<rect x="9" y="9" width="182" height="282" rx="12" fill="none" stroke="url(#gd)" stroke-width="3.2"/>` +
      `<rect x="16" y="16" width="168" height="268" rx="8" fill="none" stroke="#ffd36e" stroke-opacity=".5" stroke-width="1.3" stroke-dasharray="2 4"/>` +
      corner(30, 30) + corner(170, 30) + corner(30, 270) + corner(170, 270) +
      rays +
      `<circle cx="100" cy="150" r="56" fill="#26196a" stroke="url(#gd)" stroke-width="3"/>` +
      `<circle cx="100" cy="150" r="48" fill="none" stroke="#ffd36e" stroke-opacity=".45" stroke-width="1.2" stroke-dasharray="1 5"/>` +
      `<path d="${crescentD(94, 152, 36, 112, 140, 30)}" fill="url(#gd)"/>` +
      `<path d="${heartD(112, 154, 34)}" fill="url(#hp)"/>` +
      `<path d="${sparkleD(104, 149, 3.6)}" fill="#fff" opacity=".9"/>` +
      `<path d="${starD(128, 116, 8, 3.8)}" fill="url(#gd)"/>` +
      `<path d="${sparkleD(76, 120, 4.5)}" fill="#fff" opacity=".85"/>` +
      `<path d="${sparkleD(132, 186, 4)}" fill="#ffe29a"/>` +
      `<path d="${sparkleD(78, 44, 5)}" fill="#ffe29a"/><path d="${heartD(100, 44, 13)}" fill="url(#hp)"/><path d="${sparkleD(122, 44, 5)}" fill="#ffe29a"/>` +
      `<path d="${sparkleD(78, 256, 5)}" fill="#ffe29a"/><path d="${heartD(100, 256, 13)}" fill="url(#hp)"/><path d="${sparkleD(122, 256, 5)}" fill="#ffe29a"/>` +
      `</svg>`;
  }

  // 카드 앞면 바탕 무늬(작은 별·하트)
  function frontPatternSVG() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">` +
      `<path d="${sparkleD(13, 14, 4)}" fill="#d9a441" opacity=".22"/>` +
      `<path d="${heartD(44, 44, 8)}" fill="#e7739f" opacity=".18"/>` +
      `<circle cx="46" cy="12" r="1.2" fill="#b49be6" opacity=".35"/><circle cx="12" cy="46" r="1.2" fill="#b49be6" opacity=".35"/>` +
      `</svg>`;
  }

  const dataURI = (s) => `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}")`;

  // ---------- 수정 구슬 ----------
  function crystalBall() {
    const g = uid(), gb = uid(), gl = uid();
    return svg(
      `<circle cx="100" cy="92" r="92" fill="url(#${gl})"/>` +
      `<circle cx="100" cy="92" r="70" fill="url(#${g})" stroke="#ffe29a" stroke-opacity=".7" stroke-width="2.5"/>` +
      `<g class="ball-mist"><path d="M52 104Q70 70 102 86T150 82Q140 120 104 118T52 104Z" fill="#ff9ec8" opacity=".35"/>` +
      `<path d="M62 74Q92 54 124 70T146 100Q120 92 98 102T62 74Z" fill="#9fd7ff" opacity=".28"/></g>` +
      `<path d="${heartD(100, 94, 34)}" fill="#ffb3d6" opacity=".85"/>` +
      `<path d="${sparkleD(82, 70, 5)}" fill="#fff"/><path d="${sparkleD(124, 112, 4)}" fill="#fff"/><path d="${sparkleD(128, 64, 3)}" fill="#fff"/>` +
      `<ellipse cx="74" cy="60" rx="20" ry="10" fill="#fff" opacity=".55" transform="rotate(-32 74 60)"/>` +
      path('M58 156Q100 146 142 156L152 186Q100 200 48 186Z', `url(#${gb})`) +
      `<path d="M56 170Q100 180 144 170" fill="none" stroke="${INK}" stroke-width="2" opacity=".4"/>` +
      `<path d="${heartD(100, 174, 12)}" fill="#ff6fa8"/>` +
      `<path d="${starD(76, 175, 5, 2.4)}" fill="#fff6c2"/><path d="${starD(124, 175, 5, 2.4)}" fill="#fff6c2"/>`,
      rad(g, '#f6efff', '#4a2fa8', '.38', '.3') +
      lin(gb, '#ffe49a', '#d9952a') +
      `<radialGradient id="${gl}"><stop offset=".55" stop-color="#b18cff" stop-opacity=".55"/><stop offset="1" stop-color="#b18cff" stop-opacity="0"/></radialGradient>`,
      '0 0 200 200', 'ball-svg'
    );
  }

  // ---------- 화면 아이콘 ----------
  const ui = (d, extra = '') => `<svg class="ui-ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
  const ICON = {
    home: ui('<path d="M3.5 11L12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>'),
    soundOn: ui('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11"/>'),
    soundOff: ui('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
    full: ui('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    fullExit: ui('<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>'),
    shuffle: ui('<path d="M3 7h3.5c2.5 0 3.5 1.5 5 5s2.5 5 5 5H21"/><path d="M3 17h3.5c1.4 0 2.3-.5 3-1.4M14 8.4c.7-.9 1.6-1.4 3-1.4H21"/><path d="M18 4l3 3-3 3M18 14l3 3-3 3"/>'),
    help: ui('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 014.8 1c0 1.7-2.4 2.1-2.4 3.6"/><path d="M12 17.2v.1"/>'),
    arrow: ui('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    back: ui('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    timer: ui('<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 3h5"/>'),
    swap: ui('<path d="M4 8h13l-3-3M20 16H7l3 3"/>'),
  };

  return {
    SYMBOLS, TOKENS, FAM_ICON, ORN, ICON, crystalBall,
    symbol: (id) => SYMBOLS[id](),
    token: (key) => TOKENS[key](),
    famIcon: (f) => FAM_ICON[f](),
    sparkleD, heartD, starD,
    CARD_BACK: dataURI(cardBackSVG()),
    FRONT_PATTERN: dataURI(frontPatternSVG()),
  };
})();
