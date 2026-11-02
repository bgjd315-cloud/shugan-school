// 數感月球城：題目產生與評分（南一五上、五下，瀏覽器與 node 測試共用）
(function (root) {
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[ri(0, arr.length - 1)];
  const shuffle = arr => { const r = arr.slice(); for (let i = r.length - 1; i > 0; i--) { const j = ri(0, i); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const lcm = (a, b) => a * b / gcd(a, b);
  const factors = n => { const f = []; for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i); return f; };
  const simp = (a, n) => { const g = gcd(a, n); return [a / g, n / g]; };

  /* ---------- 通分的分母組合：課綱限一位數、或倍數關係（小於 100）、或乘 2～5 找得到（12 與 18）---------- */
  const DEN_PAIRS = [[2, 3], [2, 5], [3, 4], [4, 6], [6, 8], [6, 9], [2, 4], [3, 6], [4, 8], [5, 10], [3, 12], [4, 12], [6, 12], [8, 12], [3, 5], [2, 9], [4, 5], [12, 18]];
  function fracPair(d = DEN_PAIRS) { // 兩個真分數，分母不同
    const [p, q] = shuffle(pick(d)); const a = pick(factors(p).length ? Array.from({ length: p - 1 }, (_, i) => i + 1).filter(x => gcd(x, p) === 1) : [1]), b = pick(Array.from({ length: q - 1 }, (_, i) => i + 1).filter(x => gcd(x, q) === 1));
    const D = lcm(p, q);
    return { a, n: p, b, m: q, D, A: a * D / p, B: b * D / q };
  }

  /* ---------- 一：氣溫觀測站（折線圖） ---------- */
  const LINE_CTX = [
    { what: '溫室的氣溫', unit: '度', e: '🌡️', xs: ['8 時', '10 時', '12 時', '14 時', '16 時', '18 時'], lo: 10, step: 2, top: 12, verb: '上升' },
    { what: '小樹苗的高度', unit: '公分', e: '🌱', xs: ['第 1 週', '第 2 週', '第 3 週', '第 4 週', '第 5 週', '第 6 週'], lo: 0, step: 5, top: 10, mono: true, verb: '長高' },
    { what: '水塔的水位', unit: '公分', e: '💧', xs: ['週一', '週二', '週三', '週四', '週五', '週六'], lo: 0, step: 10, top: 10, verb: '上升' },
    { what: '基地的訪客', unit: '人', e: '🚀', xs: ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月'], lo: 0, step: 20, top: 10, verb: '增加' },
  ];
  function lineData(c, n = 6) { // 回傳每點在第幾格
    let g = [];
    if (c.mono) { let v = ri(1, 2); for (let i = 0; i < n; i++) { g.push(v); v = Math.min(c.top, v + ri(0, 2)); } } else for (let i = 0; i < n; i++) g.push(ri(1, c.top));
    return g;
  }
  const lineCtxOut = c => ({ what: c.what, unit: c.unit, e: c.e, xs: c.xs, lo: c.lo, step: c.step, top: c.top, verb: c.verb });
  const WHICH = [
    { t: '一棵樹每個月長多高', e: '🌳', a: '折線圖', why: '看同一棵樹跟著時間怎麼變，用線連起來最清楚。' },
    { t: '一天裡每 2 小時的氣溫', e: '🌡️', a: '折線圖', why: '看同一個東西跟著時間的變化，用折線圖。' },
    { t: '水庫這半年每月的水位', e: '💧', a: '折線圖', why: '水位跟著時間升降，用折線圖。' },
    { t: '五個班各有幾個人', e: '🏫', a: '長條圖', why: '五個班是不同的東西，班和班之間連線沒有意思，用長條圖比多少。' },
    { t: '大家最喜歡的水果各幾票', e: '🍎', a: '長條圖', why: '水果之間沒有先後，連線沒有意思，用長條圖。' },
    { t: '四種動物各活幾年', e: '🐢', a: '長條圖', why: '不同的動物是分開的，用長條圖比。' },
  ];
  function genLine(lv) {
    const c = pick(LINE_CTX);
    if (lv <= 0) { const g = lineData(c), i = ri(1, 5); return { kind: 'line', mode: 'read', ...lineCtxOut(c), g, i, ans: c.lo + g[i] * c.step }; }
    if (lv === 1) { const g = lineData(c, 5); return { kind: 'line', mode: 'draw', ...lineCtxOut(c), xs: c.xs.slice(0, 5), g, vals: g.map(x => c.lo + x * c.step) }; }
    if (lv === 2) {
      let g, d, best, t = 0;
      do { g = lineData(c, 5); d = g.slice(1).map((x, i) => x - g[i]); best = Math.max(...d); } while ((best <= 0 || d.filter(x => x === best).length > 1) && t++ < 200);
      if (best <= 0 || d.filter(x => x === best).length > 1) { g = [2, 3, 7, 5, 6]; d = [1, 4, -2, 1]; best = 4; }
      return { kind: 'line', mode: 'trend', ...lineCtxOut(c), xs: c.xs.slice(0, 5), g, best: d.indexOf(best), ans: best * c.step };
    }
    if (lv === 3) { const w = pick(WHICH); return { kind: 'line', mode: 'which', ...w, g: [3, 6, 4, 8, 7] }; }
    const base = pick([130, 140, 120]), step = pick([1, 2]), g = Array.from({ length: 5 }, () => ri(1, 9));
    return { kind: 'line', mode: 'broken', what: '小朋友五年來的身高', unit: '公分', e: '📏', xs: ['1 年', '2 年', '3 年', '4 年', '5 年'], lo: base, step, top: 10, g: g.slice().sort((a, b) => a - b), ans: base + Math.max(...g) * step };
  }

  /* ---------- 二：地磚排列場（因數與倍數，以概念為主） ---------- */
  const THINGS = [['地磚', '塊', '🟫'], ['椅子', '張', '🪑'], ['巧克力', '格', '🍫'], ['太陽能板', '片', '🔆']];
  function genFactor(lv) {
    const t = pick(THINGS);
    if (lv <= 0) { const n = pick([12, 16, 18, 20, 24, 30, 36]); return { kind: 'factor', mode: 'rect', n, thing: t, f: factors(n), ans: factors(n).length }; }
    if (lv === 1) {
      const b = ri(2, 9), yes = Math.random() < .55, q = ri(2, 6), r = yes ? 0 : ri(1, b - 1), ctx = pick([['電池', '個', '盒', '🔋'], ['雞蛋', '顆', '盒', '🥚'], ['餅乾', '片', '袋', '🍪']]);
      return { kind: 'factor', mode: 'fit', n: b * q + r, b, q, r, ctx, ans: yes ? '是' : '不是' };
    }
    if (lv === 2) { const a = ri(2, 9), ctx = pick([['號誌燈', '秒', '亮一次', '💡'], ['接駁車', '分鐘', '來一班', '🚌'], ['灑水器', '分鐘', '灑一次', '💦']]), k = ri(5, 9); return { kind: 'factor', mode: 'multi', a, ctx, lim: Math.min(40, a * 5), k, ans: a * k }; }
    if (lv === 3) {
      const [a, b] = pick([[12, 18], [8, 12], [16, 24], [18, 24], [12, 30], [20, 30], [15, 25], [9, 15], [14, 21], [24, 36], [10, 15], [16, 20]]);
      const ctx = pick([['紅磚', '藍磚', '排成一樣多的排，每排同色、沒有剩', '塊'], ['紅繩', '藍繩', '各自剪成同樣長的小段（整數公分）、都沒有剩', '公分'], ['蘋果', '橘子', '分給一樣多的人，每人都拿得一樣、沒有剩', '顆']]);
      return { kind: 'factor', mode: 'comf', a, b, ctx, fa: factors(a), fb: factors(b), com: factors(a).filter(x => b % x === 0), ans: gcd(a, b) };
    }
    if (lv === 4) { const [a, b] = pick([[2, 3], [3, 4], [4, 6], [6, 8], [3, 5], [2, 5], [4, 5], [6, 9], [4, 10], [6, 10], [5, 6]]); const ctx = pick([['紅燈', '綠燈', '秒', '亮一次', '同時亮'], ['甲線車', '乙線車', '分鐘', '來一班', '同時到站']]); return { kind: 'factor', mode: 'lamp', a, b, ctx, ans: lcm(a, b) }; }
    const [W, H] = pick([[12, 8], [12, 18], [10, 15], [16, 12], [9, 15], [20, 12], [18, 24], [14, 10]]);
    return { kind: 'factor', mode: 'pave', W, H, ctx: pick(['地板', '牆壁', '一張長方形的布']), ans: gcd(W, H) };
  }

  /* ---------- 三：圍牆設計處（多邊形） ---------- */
  function quadPts(a, b, c) { // 由三個內角排出凸四邊形；A 在原點、AB 在 x 軸；找得到才回傳
    const rad = x => x * Math.PI / 180;
    for (const [L1, L2] of [[150, 110], [130, 130], [170, 90], [110, 150], [190, 70], [90, 170]]) {
      const B = [L1, 0], hb = 180 - b, C = [B[0] + L2 * Math.cos(rad(hb)), L2 * Math.sin(rad(hb))], hc = hb + 180 - c;
      const dx = Math.cos(rad(hc)), dy = Math.sin(rad(hc)), ax = Math.cos(rad(a)), ay = Math.sin(rad(a)), det = dx * (-ay) - (-ax) * dy;
      if (Math.abs(det) < .01) continue;
      const t = ((0 - C[0]) * (-ay) - (-ax) * (0 - C[1])) / det, u = (dx * (0 - C[1]) - dy * (0 - C[0])) / det, D = [C[0] + t * dx, C[1] + t * dy];
      if (t > 40 && u > 40) return [[0, 0], B, C, D];
    }
    return null;
  }
  function genPoly(lv) {
    if (lv <= 0) { const a = ri(6, 22) * 5, b = ri(6, Math.min(22, 30 - a / 5)) * 5; return { kind: 'poly', mode: 'sum', a, b, ans: 180 - a - b, ctx: pick(['三角形花圃', '三角旗', '三角形屋頂']) }; }
    if (lv === 1) {
      const tp = pick(['yes', 'yes', 'eq', 'no']), c = ri(6, 12); let a, b;
      if (tp === 'eq') { a = ri(2, c - 2); b = c - a; } else if (tp === 'no') { a = ri(2, Math.floor(c / 2) - 1); b = ri(1, c - a - 1); b = Math.max(b, 2); if (a + b >= c) { a = 2; b = 2; } } else { a = ri(Math.ceil(c / 2), c); b = ri(c - a + 1, c); }
      return { kind: 'poly', mode: 'sticks', a, b, c, ans: a + b > c ? '圍得起來' : '圍不起來', ctx: pick(['木條', '吸管', '鐵條']) };
    }
    if (lv === 2) { const n = ri(4, 8); return { kind: 'poly', mode: 'cut', n, tris: n - 2, ans: (n - 2) * 180, ctx: pick(['圍牆', '花圃', '廣場']) }; }
    if (lv === 3) {
      let a, b, c, d, p, t = 0;
      do { a = ri(12, 26) * 5; b = ri(12, 26) * 5; c = ri(12, 26) * 5; d = 360 - a - b - c; p = d >= 45 && d <= 150 ? quadPts(a, b, c) : null; } while (!p && t++ < 300);
      if (!p) { a = 90; b = 90; c = 90; d = 90; p = [[0, 0], [140, 0], [140, 110], [0, 110]]; }
      return { kind: 'poly', mode: 'quad', a, b, c, ans: d, pts: p, ctx: pick(['一塊四邊形的地', '一面風箏', '一扇四邊形的窗']) };
    }
    if (lv === 4) { const p = ri(5, 12), s = ri(3, p - 1), x = ri(10, 16) * 5; return { kind: 'poly', mode: 'pgram', p, s, x, y: 180 - x, ctx: pick(['伸縮門的一格', '曬衣架的一格', '停車格']) }; }
    if (Math.random() < .5) { const n = pick([3, 4, 5, 6, 8]), a = ri(3, 9); return { kind: 'poly', mode: 'regular', sub: 'total', n, a, ans: a * n, name: { 3: '正三角形', 4: '正方形', 5: '正五邊形', 6: '正六邊形', 8: '正八邊形' }[n] }; }
    const s = pick([['菱形', '每邊一樣長，可是角不一樣大', '不是'], ['長方形', '每個角一樣大，可是邊不一樣長', '不是'], ['正方形', '每邊一樣長，每個角也一樣大', '是'], ['正六邊形', '每邊一樣長，每個角也一樣大', '是'], ['正三角形', '每邊一樣長，每個角也一樣大', '是']]);
    return { kind: 'poly', mode: 'regular', sub: 'is', name: s[0], why: s[1], ans: s[2] };
  }

  /* ---------- 四：披薩切分室（擴分、約分、通分） ---------- */
  const FOOD = [['披薩', 'pie', '個'], ['巧克力', 'bar', '片'], ['蔥油餅', 'pie', '張'], ['蛋糕', 'bar', '盤']];
  const coprimeTo = n => Array.from({ length: n - 1 }, (_, i) => i + 1).filter(x => gcd(x, n) === 1);
  function genExt(lv) {
    const f = pick(FOOD);
    if (lv <= 0) { const n = pick([2, 3, 4, 5, 6]), a = pick(coprimeTo(n)), k = ri(2, n >= 5 ? 3 : 4); return { kind: 'ext', mode: 'slice', a, n, k, food: f, ans: a * k, D: n * k }; }
    if (lv === 1) { const n0 = pick([2, 3, 4, 5, 6]), a0 = pick(coprimeTo(n0)), g = ri(2, n0 >= 5 ? 3 : 4); return { kind: 'ext', mode: 'merge', a: a0 * g, n: n0 * g, g, a0, n0, food: f }; }
    if (lv === 2) { const n0 = pick([2, 3, 4, 5, 6, 8]), a0 = pick(coprimeTo(n0)), g = pick([2, 3, 4, 6].filter(x => x * n0 <= 36)); return { kind: 'ext', mode: 'lowest', a: a0 * g, n: n0 * g, a0, n0, food: ['巧克力', 'bar', '片'] }; }
    if (lv === 3) { const p = fracPair(DEN_PAIRS.filter(x => lcm(x[0], x[1]) <= 24)); return { kind: 'ext', mode: 'common', ...p, food: f }; }
    if (lv === 4) { const p = fracPair(DEN_PAIRS.filter(x => lcm(x[0], x[1]) <= 24)); return { kind: 'ext', mode: 'cmp', ...p, food: f, ans: p.A > p.B ? 'L' : p.A < p.B ? 'R' : 'E' }; }
    if (lv === 5) { // 分數小數互通：切成 10 份或 100 份
      const n = pick([2, 4, 5, 10, 20, 25, 50]), a = pick(coprimeTo(n)), to = 100 % n === 0 ? 100 : 10, up = a * 100 / n, dec = (up / 100).toFixed(up % 10 ? 2 : 1), other = (up / 100 + (up % 10 ? .1 : .2)).toFixed(up % 10 ? 2 : 1), wr = `${a}.${n}`;
      const options = shuffle([...new Set([dec, other, wr, (up / 1000).toFixed(3).replace(/0+$/, '')])]).filter(x => x !== dec).slice(0, 2).concat(dec);
      return { kind: 'ext', mode: 'dec', a, n, up, dec, options: shuffle(options), ctx: pick(['一張百格地圖', '一片百格巧克力', '一面百格磁磚牆']), to };
    }
    const r = pick([['果汁', '水', '杯', '🧃', '💧', '喝起來一樣甜'], ['藍漆', '白漆', '罐', '🟦', '⬜', '顏色一樣'], ['水泥', '沙子', '桶', '🛢️', '🏖️', '一樣牢固']]), a = ri(1, 4); let b = ri(1, 5); if (gcd(a, b) > 1 || a === b) b = a + 1;
    const k = ri(2, 4);
    return { kind: 'ext', mode: 'recipe', a, b, k, r, ans: b * k, t: a + b };
  }

  /* ---------- 五：對摺設計坊（線對稱） ---------- */
  const reflect = (p, c, deg) => { const t = deg * Math.PI / 180, ux = Math.cos(t), uy = Math.sin(t), dx = p[0] - c[0], dy = p[1] - c[1], k = dx * ux + dy * uy; return [c[0] + 2 * k * ux - dx, c[1] + 2 * k * uy - dy]; };
  const samePts = (A, B) => A.every(p => B.some(r => Math.hypot(p[0] - r[0], p[1] - r[1]) < .6));
  const regPts = (n, r = 70, c = [100, 100]) => Array.from({ length: n }, (_, i) => { const t = (i / n * 360 - 90) * Math.PI / 180; return [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]; });
  const SYM_SHAPES = {
    等腰三角形: { pts: [[100, 30], [150, 160], [50, 160]], axes: 1, tryA: [90, 0], o: '屋頂', c: [100, 95] },
    長方形: { pts: [[40, 60], [160, 60], [160, 140], [40, 140]], axes: 2, tryA: [90, 0, 33.7], o: '門板', c: [100, 100] },
    正方形: { pts: [[50, 50], [150, 50], [150, 150], [50, 150]], axes: 4, tryA: [90, 0, 45, 135], o: '地磚', c: [100, 100] },
    菱形: { pts: [[100, 40], [150, 100], [100, 160], [50, 100]], axes: 2, tryA: [90, 0, 45], o: '路標', c: [100, 100] },
    等腰梯形: { pts: [[70, 60], [130, 60], [165, 140], [35, 140]], axes: 1, tryA: [90, 0], o: '燈罩', c: [100, 100] },
    鑽石形: { pts: [[100, 30], [145, 80], [100, 170], [55, 80]], axes: 1, tryA: [90, 0], o: '鑽石貼紙', c: [100, 100] },
    平行四邊形: { pts: [[70, 60], [170, 60], [130, 140], [30, 140]], axes: 0, tryA: [90, 0, 45], o: '停車格', c: [100, 100] },
    正三角形: { pts: regPts(3, 75, [100, 110]), axes: 3, tryA: [90, 30, 150, 0], o: '警告標誌', c: [100, 110] },
    正六邊形: { pts: regPts(6), axes: 6, tryA: [90, 0, 30, 60, 120, 150], o: '蜂巢的一格', c: [100, 100] },
    不規則三角形: { pts: [[60, 40], [170, 150], [40, 150]], axes: 0, tryA: [90, 0], o: '碎玻璃', c: [100, 100] },
  };
  const axisShapes = [ // 只有一條軸的圖案，用格子座標，軸在 x=0 或 y=0
    { name: '房子', o: 'v', half: [[0, -3], [3, -1], [2, -1], [2, 3], [0, 3]] },
    { name: '火箭', o: 'v', half: [[0, -4], [1, -2], [1, 2], [3, 3], [0, 3]] },
    { name: '蝴蝶', o: 'v', half: [[0, -1], [3, -3], [4, -1], [2, 1], [3, 3], [0, 2]] },
    { name: '魚', o: 'h', half: [[-4, 0], [-2, -2], [1, -2], [2, 0]] },
    { name: '箭頭', o: 'h', half: [[-4, 0], [-1, -3], [-1, -1], [3, -1], [3, 0]] },
  ];
  const HALF_SET = [[[0, -3], [3, 0], [0, 3]], [[0, -3], [2, -3], [3, 0], [0, 2]], [[0, -2], [2, -3], [1, 0], [3, 2], [0, 3]], [[0, -3], [3, -2], [2, 1], [0, 3]], [[0, -3], [1, -1], [3, -1], [1, 1], [0, 3]]];
  function genSym(lv) {
    if (lv <= 0) { const s = pick(axisShapes); return { kind: 'sym', mode: 'axis', shape: s, off: pick([-3, -2, 2, 3]) }; }
    if (lv === 1) { const name = pick(Object.keys(SYM_SHAPES)); return { kind: 'sym', mode: 'count', name, ans: SYM_SHAPES[name].axes }; }
    if (lv === 2) { const h = pick(HALF_SET), side = h.filter(p => p[0] !== 0), p = pick(side); return { kind: 'sym', mode: 'point', half: h, p, ans: [-p[0], p[1]] }; }
    if (lv === 3) { const h = pick(HALF_SET); return { kind: 'sym', mode: 'half', half: h }; }
    const tp = pick(['side', 'angle']), s = ri(4, 12), x = ri(8, 15) * 5;
    return { kind: 'sym', mode: 'prop', tp, s, x, name: pick([['屋頂的側面', 0], ['鑽石貼紙', 1]]), ans: tp === 'side' ? s : x };
  }

  /* ---------- 六：燃料調配站（異分母加減） ---------- */
  const VESSEL = [['燃料', '公升', 'cup', '杯'], ['果汁', '公升', 'cup', '杯'], ['電線', '公尺', 'rope', '條'], ['緞帶', '公尺', 'rope', '條']];
  function genUadd(lv) {
    const v = pick(VESSEL), P9 = DEN_PAIRS.filter(x => lcm(x[0], x[1]) <= 24);
    if (lv <= 0) { let p, t = 0; do { p = fracPair(P9); } while (p.A + p.B >= 2 * p.D && t++ < 50); const [sa, sn] = simp(p.A + p.B, p.D); return { kind: 'uadd', mode: 'add', ...p, v, S: p.A + p.B, sa, sn }; }
    if (lv === 1) { let p, t = 0; do { p = fracPair(P9); } while (p.A <= p.B && t++ < 80); if (p.A <= p.B) p = { a: 1, n: 2, b: 1, m: 3, D: 6, A: 3, B: 2 }; const [sa, sn] = simp(p.A - p.B, p.D); return { kind: 'uadd', mode: 'sub', ...p, v, S: p.A - p.B, sa, sn }; }
    if (lv === 2) { let p, t = 0; do { p = fracPair(P9); } while (p.A + p.B >= p.D && t++ < 80); if (p.A + p.B >= p.D) p = { a: 1, n: 2, b: 1, m: 3, D: 6, A: 3, B: 2 }; const w1 = ri(1, 4), w2 = ri(1, 3), [sa, sn] = simp(p.A + p.B, p.D); return { kind: 'uadd', mode: 'mixed', ...p, w1, w2, v, S: p.A + p.B, W: w1 + w2, sa, sn }; }
    if (lv === 3) { let p, t = 0; do { p = fracPair(P9); } while (p.A >= p.B && t++ < 80); if (p.A >= p.B) p = { a: 1, n: 3, b: 1, m: 2, D: 6, A: 2, B: 3 }; const w2 = ri(1, 2), w1 = w2 + ri(2, 3); const S = p.A + p.D - p.B, [sa, sn] = simp(S, p.D); return { kind: 'uadd', mode: 'borrow', ...p, w1, w2, v, S, W: w1 - 1 - w2, sa, sn }; }
    const p = fracPair(P9), ans = p.A + p.B > p.D ? '不夠' : p.A + p.B === p.D ? '剛好' : '夠';
    return { kind: 'uadd', mode: 'enough', ...p, v, ans };
  }

  /* ---------- 七：物資採購處（併式、平均、分配律、連除、□） ---------- */
  function evalTokens(t) { // 支援括號與先乘除後加減；回傳 NaN 表示式子不完整
    let i = 0;
    const atom = () => { if (t[i] === '（') { i++; const v = expr(); if (t[i] !== '）') throw 0; i++; return v; } if (typeof t[i] !== 'number') throw 0; return t[i++]; };
    const term = () => { let v = atom(); while (t[i] === '×' || t[i] === '÷') { const o = t[i++], r = atom(); v = o === '×' ? v * r : v / r; } return v; };
    const expr = () => { let v = term(); while (t[i] === '＋' || t[i] === '－') { const o = t[i++], r = term(); v = o === '＋' ? v + r : v - r; } return v; };
    try { const v = expr(); return i === t.length ? v : NaN; } catch (e) { return NaN; }
  }
  function genMix(lv) {
    if (lv <= 0) {
      const tp = ri(0, 4), a = ri(12, 45), b = ri(3, 8);
      if (tp === 0) { const c = (Math.floor(a * b / 100) + 1) * 100 + pick([0, 100]); return { kind: 'mix', mode: 'write', text: `一盒電池 ${a} 元，買 ${b} 盒，付 ${c} 元，找回多少元？`, pic: '🔋', n: b, right: [c, '－', a, '×', b], ans: c - a * b, parts: `${b} 盒要 ${a}×${b} 元，再從 ${c} 元扣掉` }; }
      if (tp === 1) { const c = ri(5, 30); return { kind: 'mix', mode: 'write', text: `每箱有 ${a} 罐水，有 ${b} 箱，再加 ${c} 罐，共幾罐？`, pic: '📦', n: b, right: [a, '×', b, '＋', c], ans: a * b + c, parts: `${b} 箱是 ${a}×${b} 罐，再加 ${c} 罐` }; }
      if (tp === 2) { const c = ri(10, 25); return { kind: 'mix', mode: 'write', text: `一個便當 ${a} 元，一杯茶 ${c} 元，買 ${b} 份同樣的，共幾元？`, pic: '🍱', n: b, right: ['（', a, '＋', c, '）', '×', b], ans: (a + c) * b, parts: `一份是 ${a}＋${c} 元，再乘 ${b} 份，要先算的放括號` }; }
      if (tp === 3) { const c = ri(2, 9), each = ri(c + 2, 20); return { kind: 'mix', mode: 'write', text: `${each * b} 顆螺絲平分成 ${b} 盒，每盒再拿走 ${c} 顆，每盒剩幾顆？`, pic: '🔩', n: b, right: [each * b, '÷', b, '－', c], ans: each - c, parts: `每盒先有 ${each * b}÷${b} 顆，再拿走 ${c} 顆` }; }
      const c = ri(2, Math.floor(a / 3)), d = ri(20, 80);
      return { kind: 'mix', mode: 'write', text: `一張票 ${a} 元，每張便宜 ${c} 元，買 ${b} 張，再付運費 ${d} 元，共幾元？`, pic: '🎫', n: b, right: ['（', a, '－', c, '）', '×', b, '＋', d], ans: (a - c) * b + d, parts: `一張 ${a}－${c} 元，${b} 張再加運費` };
    }
    if (lv === 1) {
      const n = ri(3, 5), avg = ri(3, 7); let lv2; let t = 0;
      do { lv2 = Array.from({ length: n }, () => ri(1, 9)); const dd = lv2.reduce((s, x) => s + x, 0) - n * avg; lv2[0] -= dd; } while ((lv2[0] < 1 || lv2[0] > 10 || lv2.every(x => x === avg)) && t++ < 200);
      if (lv2[0] < 1 || lv2[0] > 10 || lv2.every(x => x === avg)) { lv2 = new Array(n).fill(avg); lv2[0]++; lv2[1]--; }
      return { kind: 'mix', mode: 'avg', lv2, n, avg, sum: n * avg, ctx: pick([['水塔', '格水', '💧'], ['積木塔', '塊積木', '🧱'], ['組員採的月亮石', '顆', '🌑']]) };
    }
    if (lv === 2) { const a = pick([10, 20, 30, 40, 50]), b = ri(2, 9), c = ri(3, 9), ctx = pick([['一個便當', '一瓶水', '份', '元'], ['一排紅磚', '一排藍磚', '排', '塊']]); return { kind: 'mix', mode: 'dist', a, b, c, ctx, ans: (a + b) * c }; }
    if (lv === 3) {
      if (Math.random() < .55) { const x = pick([1, 2, 3]), big = pick([100, 200, 1000]), a = big - x, c = ri(3, 9); return { kind: 'mix', mode: 'near', sub: 'minus', a, big, x, c, ans: a * c, thing: pick([['一盒燈泡', '盒'], ['一把工具', '把'], ['一件工作服', '件']]) }; }
      const k = ri(3, 9); return { kind: 'mix', mode: 'near', sub: 'four', a: 25, k, b: 4 * k, ans: 100 * k };
    }
    if (lv === 4) { const b = pick([2, 3, 4, 5]), c = pick([2, 3, 4, 5, 6]), d = ri(3, 12); return { kind: 'mix', mode: 'chain', b, c, d, a: b * c * d, ans: d, ctx: pick([['顆螺絲', '箱', '袋'], ['顆種子', '區', '排'], ['片餅乾', '盒', '包']]) }; }
    if (lv === 5) {
      const p = pick([12, 15, 20, 25, 30, 35]), base = pick([0, 0, 50, 100]), t = ri(4, 9), ctx = pick([['一盒燈泡', '盒', '元'], ['一包水泥', '包', '元'], ['一根鋼管', '根', '元']]), ok = base ? `${base}＋${p}×□` : `${p}×□`;
      const options = shuffle([ok, base ? `${base}×□＋${p}` : `□＋${p}`, base ? `（${base}＋${p}）×□` : `${p}＋${p}`]);
      return { kind: 'mix', mode: 'box', p, base, t, ctx, ok, options, ans: base + p * t };
    }
    if (Math.random() < .6) { const a = ri(2, 9) * 10, x = ri(2, 12) * 5; return { kind: 'mix', mode: 'scale', sub: 'add', a, x, c: a + x, ans: x, ctx: pick(['一袋月亮石', '一箱螺絲', '一包水泥']) }; }
    const n = ri(2, 5), x = ri(3, 12) * 5; return { kind: 'mix', mode: 'scale', sub: 'mul', n, x, c: n * x, ans: x, ctx: pick(['一袋月亮石', '一箱螺絲', '一包水泥']) };
  }

  /* ---------- 八：土地裁切場（面積） ---------- */
  function genPara(lv) {
    const lot = pick(['一塊工地', '一片草皮', '一面太陽能板', '一塊停車場']);
    if (lv <= 0) { const b = ri(4, 9), h = ri(2, 5), sh = ri(1, 3); return { kind: 'para', mode: 'para', b, h, sh, side: Math.ceil(Math.hypot(h, sh)), lot, ans: b * h }; }
    if (lv === 1) { const b = ri(2, 5) * 2, h = ri(2, 6), sh = ri(1, b - 1); return { kind: 'para', mode: 'tri', b, h, sh, lot, ans: b * h / 2 }; }
    if (lv === 2) { const tp = pick(['tri', 'para']), h = ri(2, 5) * 2, b = ri(2, 5) * 2; return { kind: 'para', mode: 'slide', tp, b, h, slant: h + ri(1, 3), lot, ans: tp === 'tri' ? b * h / 2 : b * h }; }
    if (lv === 3) { const a = ri(2, 5), b = a + ri(1, 5), h = ri(1, 3) * 2; return { kind: 'para', mode: 'trap', a, b, h, lot, s: a + b, ans: (a + b) * h / 2 }; }
    if (lv === 4) {
      const tp = pick(['para', 'tri', 'trap']);
      if (tp === 'trap') { const a = ri(3, 6), b = a + ri(2, 4), h = ri(1, 3) * 2; return { kind: 'para', mode: 'sym', tp, a, b, h, ans: (a + b) * h / 2, f: '（□＋○）×△÷2', need: [['□', a, '上底'], ['○', b, '下底'], ['△', h, '高']] }; }
      const b = ri(2, 6) * 2, h = ri(2, 7); return { kind: 'para', mode: 'sym', tp, b, h, slant: h + ri(1, 3), ans: tp === 'para' ? b * h : b * h / 2, f: tp === 'para' ? '□×○' : '□×○÷2', need: [['□', b, '底'], ['○', h, '高']] };
    }
    const b = ri(3, 8), h = ri(2, 6);
    return { kind: 'para', mode: 'back', b, h, A: b * h, ans: h, lot };
  }

  /* ---------- 九：工班排班室（時間的乘除） ---------- */
  const T_UNITS = [['時', '分', 60], ['分', '秒', 60], ['日', '時', 24]];
  function genTtime(lv) {
    if (lv <= 0) { const u = pick([[60, '時', '分', '小時', '🕐'], [60, '分', '秒', '分鐘', '⏱️']]), n = pick([2, 3, 4, 5, 6, 10, 12]), a = pick(coprimeTo(n).filter(x => x < n) .concat(1)); return { kind: 'ttime', mode: 'cut', u, n, a, each: u[0] / n, ans: u[0] / n * a, ctx: pick(['一班工人', '月球車充電', '吊車']) }; }
    if (lv === 1) { const t = pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 25]); return { kind: 'ttime', mode: 'dec', t, ans: t * 6, h: (t / 10).toFixed(1), ctx: pick(['挖地基', '焊接', '充電']) }; }
    if (lv === 2) { const u = pick(T_UNITS), big = ri(1, 5), small = u[2] === 24 ? ri(3, 20) : ri(12, 55), n = ri(2, 6), tot = small * n; return { kind: 'ttime', mode: 'mul', u, big, small, n, tot, B: big * n + Math.floor(tot / u[2]), Sm: tot % u[2], carry: Math.floor(tot / u[2]) }; }
    if (lv === 3) { const u = pick(T_UNITS), n = ri(2, 6); let e; do { e = ri(u[2] === 24 ? 20 : 70, u[2] === 24 ? 80 : 180); } while (e % u[2] === 0); const tot = e * n; return { kind: 'ttime', mode: 'div', u, n, big: Math.floor(tot / u[2]), small: tot % u[2], tot, ans: e, ctx: pick(['工班', '機器', '小隊']) }; }
    const u = pick(T_UNITS.slice(0, 2)), big = ri(1, 2), small = ri(5, 55), each = big * 60 + small, r = ri(3, 8), tot = each * r;
    return { kind: 'ttime', mode: 'times', u, big, small, each, r, tot, tb: Math.floor(tot / 60), ts: tot % 60, ctx: pick(['衛星繞月球一圈', '月球車跑一趟', '吊一批貨櫃']) };
  }

  /* ---------- 十：貨櫃組裝場（正方體、長方體） ---------- */
  const NETS_OK = [ // 十一種正方體展開圖 [列, 行]
    [[0, 1], [1, 0], [1, 1], [1, 2], [1, 3], [2, 1]], [[0, 1], [1, 0], [1, 1], [1, 2], [1, 3], [2, 2]], [[0, 1], [1, 0], [1, 1], [1, 2], [1, 3], [2, 3]], [[0, 1], [1, 0], [1, 1], [1, 2], [1, 3], [2, 0]],
    [[0, 0], [1, 0], [1, 1], [1, 2], [1, 3], [2, 3]], [[0, 0], [1, 0], [1, 1], [1, 2], [1, 3], [2, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3], [2, 2]], [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3], [2, 1]], [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3], [2, 3]],
    [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2], [2, 3]], [[0, 0], [0, 1], [0, 2], [1, 2], [1, 3], [1, 4]],
  ];
  const NETS_BAD = [[[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]], [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 2]], [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]], [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1], [3, 1]].map(x => x).concat([]).slice(0, 5).concat([[2, 0]]), [[0, 0], [0, 1], [1, 1], [1, 2], [0, 2], [2, 1]], [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [3, 1]]];
  function netFaces(cells) { // 把骰子在紙上滾：每格碰到骰子的哪一面；六面都不同才摺得起來
    const key = c => c.join(), set = new Set(cells.map(key)), out = {};
    const roll = (die, d) => { const [T, B, N, S, W, E] = die; if (d === 'N') return [S, N, T, B, W, E]; if (d === 'S') return [N, S, B, T, W, E]; if (d === 'W') return [E, W, N, S, T, B]; return [W, E, N, S, B, T]; };
    const dfs = (c, die) => { out[key(c)] = die[1]; for (const [dr, dc, d] of [[-1, 0, 'N'], [1, 0, 'S'], [0, -1, 'W'], [0, 1, 'E']]) { const nx = [c[0] + dr, c[1] + dc]; if (set.has(key(nx)) && out[key(nx)] === undefined) dfs(nx, roll(die, d)); } };
    dfs(cells[0], [0, 1, 2, 3, 4, 5]);
    return cells.map(c => out[key(c)]);
  }
  const netOk = cells => new Set(netFaces(cells)).size === 6;
  const OPP = { 0: 1, 1: 0, 2: 3, 3: 2, 4: 5, 5: 4 };
  const BOX_THINGS = [['貨櫃', '📦'], ['面紙盒', '🧻'], ['牛奶盒', '🥛'], ['鞋盒', '👟']];
  const LIFE = [['教室的地板和天花板', '平行', '🏫'], ['教室的地板和牆壁', '垂直', '🏫'], ['書本的封面和封底（闔起來）', '平行', '📖'], ['牆壁和窗戶的玻璃（關著）', '平行', '🖼️'], ['桌面和桌腳旁的地面', '平行', '🪑'], ['打開九十度的門和地板', '垂直', '🚪'], ['相鄰的兩面牆', '垂直', '🧱'], ['面對面的兩面牆', '平行', '🧱']];
  function genCuboid(lv) {
    const t = pick(BOX_THINGS);
    if (lv <= 0) { const sub = pick(['v', 'e', 'f', 'par', 'per']); return { kind: 'cuboid', mode: 'spin', sub, t, w: ri(3, 5), h: ri(2, 3), d: ri(2, 4), ans: { v: 8, e: 12, f: 6, par: 1, per: 4 }[sub] }; }
    if (lv === 1) { const x = pick(LIFE); return { kind: 'cuboid', mode: 'life', x, ans: x[1] }; }
    if (lv === 2) { const good = Math.random() < .55, cells = pick(good ? NETS_OK : NETS_BAD); return { kind: 'cuboid', mode: 'net', cells, ans: netOk(cells) ? '摺得起來' : '摺不起來' }; }
    if (lv === 3) { const cells = pick(NETS_OK), f = netFaces(cells), red = ri(0, 5), opp = f.indexOf(OPP[f[red]]), order = shuffle([1, 2, 3, 4, 5, 6]); return { kind: 'cuboid', mode: 'opp', cells, red, opp, labels: order, ans: order[opp] }; }
    if (lv === 4) { const w = ri(3, 9), h = ri(2, 5), d = ri(2, 6); return { kind: 'cuboid', mode: 'area', t, w, h, d, top: 2 * w * d, front: 2 * w * h, side: 2 * d * h, ans: 2 * (w * d + w * h + d * h) }; }
    const a = ri(2, 12); return { kind: 'cuboid', mode: 'cube', a, one: a * a, ans: a * a * 6, ctx: pick(['一個正方體貨櫃，每一面都要上漆', '一顆大骰子，每一面都要貼紙', '一個正方體禮物盒，每一面都要包裝']) };
  }

  /* ---------- 五下共用 ---------- */
  const dec = x => +x.toFixed(3);
  const decimalPlaces = x => { const s = String(x); return s.includes('.') ? s.split('.')[1].length : 0; };
  const fmtBig = n => { const zhao = Math.floor(n / 1e12), yi = Math.floor(n % 1e12 / 1e8), wan = Math.floor(n % 1e8 / 1e4), r = n % 1e4; return [zhao ? `${zhao} 兆` : '', yi ? `${yi} 億` : '', wan ? `${wan} 萬` : '', r ? `${r}` : ''].filter(Boolean).join(' '); };

  /* ---------- 十一：農場分糧處（分數的計算） ---------- */
  function genFcalc(lv) {
    if (lv <= 0) { const p = ri(3, 8), cand = [1, 2, 3, 4, 5].filter(x => x < p), n = pick(cand), f = pick([['蔥油餅', '張', '人'], ['披薩', '個', '人'], ['糧餅', '塊', '隻小動物']]); return { kind: 'fcalc', mode: 'share', n, p, f }; }
    if (lv === 1) { let a, b; do { a = ri(2, 9); b = ri(2, 5); } while (gcd(a, b) > 1 || a === b); const c = pick([['水', '公升', '瓶'], ['肥料', '公斤', '袋'], ['繩子', '公尺', '段']]); return { kind: 'fcalc', mode: 'pack', a, b, c, whole: Math.floor(a / b), r: a % b }; }
    if (lv === 2) { const d = pick([2, 3, 4, 5, 6]), a = pick(coprimeTo(d)), k = ri(2, 6), n = d * k, c = pick([['顆蘋果', '顆'], ['隻雞', '隻'], ['棵菜苗', '棵']]); return { kind: 'fcalc', mode: 'of', d, a, k, n, c, ans: a * k }; }
    if (lv === 3) { const n = pick([3, 4, 5, 6, 8]), a = pick(coprimeTo(n)), k = ri(2, 6), [sa, sn] = simp(a * k, n), c = pick([['每袋飼料', '公斤', '袋'], ['每桶牛奶', '公升', '桶'], ['每段水管', '公尺', '段']]); return { kind: 'fcalc', mode: 'times', n, a, k, S: a * k, sa, sn, c }; }
    if (lv === 4) { const b = ri(2, 5), d = ri(2, 5), a = pick(coprimeTo(b)), c = pick(coprimeTo(d)), [sa, sn] = simp(a * c, b * d), t = pick([['一塊田', '種玉米', '玉米田裡再種甜豆'], ['一片巧克力', '分給弟弟', '弟弟再吃掉'], ['一塊布', '做窗簾', '窗簾再染藍色']]); return { kind: 'fcalc', mode: 'area', a, b, c, d, sa, sn, t, all: b * d, on: a * c }; }
    if (lv === 5) { const b = ri(2, 5), a = pick(coprimeTo(b)), k = ri(2, 4), c = pick([['牛奶', '公升', '杯'], ['肥料', '公斤', '袋']]); return { kind: 'fcalc', mode: 'fdiv', a, b, k, c, D: b * k }; }
    const d = pick([2, 3, 4, 5]), tp = pick(['small', 'small', 'big', 'one']), a = tp === 'small' ? pick(coprimeTo(d)) : tp === 'big' ? d + pick(coprimeTo(d)) : d, N = d * ri(3, 8);
    return { kind: 'fcalc', mode: 'cmp', d, a, N, ans: a < d ? '變小' : a > d ? '變大' : '一樣', R: N * a / d };
  }

  /* ---------- 十二：宇宙定位塔（十進位結構） ---------- */
  const PLACE_OFF = { 十位: 2, 個位: 1, 十分位: 0, 百分位: -1, 千分位: -2 };
  function genDecimal(lv) {
    if (lv <= 0) {
      const tp = pick(['yi', 'zhao']), n = tp === 'yi' ? ri(1, 9999) * 1e8 + ri(1, 9) * 1000 * 1e4 : ri(1, 999) * 1e12 + ri(1, 9) * 1000 * 1e8, what = pick(['月球城的電費帳', '宇宙定位塔的里程表', '地球和星星的距離（公里）']);
      const ok = fmtBig(n), options = shuffle([ok, fmtBig(n * 10), fmtBig(Math.floor(n / 10))]);
      return { kind: 'decimal', mode: 'chunk', n, s: String(n), word: ok, options, what, cuts: Math.ceil(String(n).length / 4) - 1 };
    }
    if (lv === 1) { const v = ri(11, 999); return { kind: 'decimal', mode: 'thou', v, s: (v / 1000).toFixed(3), ans: v, ctx: pick(['金屬片厚', '導線粗', '藥水重']), unit: pick(['公分', '公尺']) }; }
    if (lv === 2) {
      let ds, i, place, p, t = 0;
      do { ds = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4); i = ri(0, 3); place = pick(Object.keys(PLACE_OFF)); p = i + PLACE_OFF[place]; } while ((p < 1 || p > 3) && t++ < 200);
      if (p < 1 || p > 3) { i = 1; place = '個位'; p = 2; }
      return { kind: 'decimal', mode: 'point', ds, i, place, p, d: ds[i], v: +(ds.join('') / 10 ** (4 - p)).toFixed(3) };
    }
    if (lv === 3) { const v = pick([ri(11, 99) / 10, ri(101, 999) / 100, ri(1, 9) / 10, ri(11, 99)]), op = pick(decimalPlaces(v) === 2 ? [['×', 10], ['×', 100], ['÷', 10]] : [['×', 10], ['×', 100], ['÷', 10], ['÷', 100]]); let a = op[0] === '×' ? v * op[1] : v / op[1]; a = dec(a); return { kind: 'decimal', mode: 'shift', v, op, ans: a, ok: Math.abs(a - (op[0] === '×' ? v * op[1] : v / op[1])) < 1e-9, thing: pick(['模型長', '電線長', '水管長']) }; }
    if (lv === 4) {
      if (Math.random() < .5) { const a = ri(2, 9), za = ri(1, 3), b = ri(11, 19), zb = ri(1, 2), x = a * 10 ** za, y = b * 10 ** zb; return { kind: 'decimal', mode: 'zero', op: '×', x, y, a, b, za, zb, n: za + zb, ans: x * y, core: a * b, ctx: pick([['每棟大樓每月用電', '度', '棟'], ['每盞路燈要', '元', '盞'], ['每個貨櫃裝', '箱', '個貨櫃']]) }; }
      const q = pick([12, 15, 25, 35, 150, 200]), d = ri(2, 9), z = pick([100, 1000]), y = d * z, x = q * y; return { kind: 'decimal', mode: 'zero', op: '÷', x, y, a: x / z, b: d, z, n: String(z).length - 1, ans: q, core: q, ctx: pick([['個螺絲', '箱', '個'], ['顆種子', '區', '顆'], ['元', '台機器', '元']]) };
    }
    const d = ri(1, 9), far = pick([1, 2]), s = String(d).repeat(3) + '.' + String(d).repeat(2), L = ri(0, 4 - far), up = Math.random() < .5, times = 10 ** far;
    return { kind: 'decimal', mode: 'rel', d, s, L, R: L + far, far, up, ans: up ? `${times} 倍` : `1/${times} 倍`, options: shuffle(far === 1 ? ['10 倍', '1/10 倍', '100 倍'] : ['100 倍', '1/100 倍', '10 倍']) };
  }

  /* ---------- 十三：比例模型室（小數的乘法） ---------- */
  function genDmul(lv) {
    if (lv >= 5) { // 直式
      const c = pick([['每公尺鋼管重', '公斤', '公尺'], ['每公升油漆可刷', '平方公尺', '公升'], ['每包水泥', '公斤', '包']]);
      if (Math.random() < .55) {
        const A = ri(11, 99), d = ri(2, 9), pb = c[2] === '包' ? 0 : pick([1, 1, 0]), raw = A * d, A1 = A % 10, v1 = A1 * d, cr = Math.floor(v1 / 10), A10 = Math.floor(A / 10), pl = 1 + pb, W = Math.max(String(raw).length, pl + 1, 3);
        return { kind: 'dmul', mode: 'vmul', sub: 'one', A, B: d, pb, raw, a: dec(A / 10), b: dec(d / 10 ** pb), pl, W, c, steps: [v1 % 10, A10 * d + cr], A1, A10, d, cr, v1, ans: dec(raw / 10 ** pl), gap: W - 1 - pl };
      }
      const A = ri(11, 49), B = ri(11, 29), p1 = A * (B % 10 || 1), B2 = B % 10 ? B : B + 1, p1b = A * (B2 % 10), p2 = A * Math.floor(B2 / 10), raw = A * B2, pl = 2, W = Math.max(String(raw).length, 4);
      return { kind: 'dmul', mode: 'vmul', sub: 'two', A, B: B2, pb: 1, raw, a: dec(A / 10), b: dec(B2 / 10), pl, W, c: c[2] === '包' ? ['每公尺鋼管重', '公斤', '公尺'] : c, steps: [p1b, p2, raw], p1: p1b, p2, ans: dec(raw / 100), gap: W - 1 - pl };
    }
    if (lv <= 0) { const p = pick([10, 20, 30, 40, 50, 12, 15, 25, 35]), k = ri(1, 9), c = pick([['每公尺鋼管', '元', '公尺'], ['每公斤沙子', '元', '公斤'], ['每公升油漆', '元', '公升']]); return { kind: 'dmul', mode: 'short', p, k, c, each: dec(p / 10), ans: dec(p * k / 10) }; }
    if (lv === 1) { const a = pick([250, 360, 480, 90, 36, 120, 75]), f = pick([.1, .01]); return { kind: 'dmul', mode: 'tenth', a, f, ans: dec(a * f), thing: pick(['建築模型', '橋的模型', '火箭模型']) }; }
    if (lv === 2) { const a = ri(1, 9), b = ri(1, 9), c = pick([['長', '寬', '模型地板', '公尺'], ['長', '寬', '小花圃', '公尺']]); return { kind: 'dmul', mode: 'grid', a, b, c, n: a * b, ans: dec(a * b / 100) }; }
    if (lv === 3) { const A = ri(11, 49), B = ri(11, 29), pb = pick([1, 1, 2]); return { kind: 'dmul', mode: 'col', A, B, a: dec(A / 10), b: dec(B / 10 ** pb), pb, n: A * B, ans: dec(A * B / 10 ** (1 + pb)), ctx: pick([['每公尺鋼管重', '公斤', '公尺', '鋼管'], ['每公斤沙子要', '元', '公斤', '沙子'], ['每公升油漆可刷', '平方公尺', '公升', '油漆']]) }; }
    const N = pick([20, 30, 40, 50, 60]), f = pick([.5, .6, .7, .8, .9, .3, 1.2, 1.5, 1.8, 1]);
    return { kind: 'dmul', mode: 'cmp', N, f, R: dec(N * f), ans: f < 1 ? '變小' : f > 1 ? '變大' : '一樣', what: pick(['模型的高', '電線的長']) };
  }

  /* ---------- 十四：圓形花園（扇形） ---------- */
  function genSector(lv) {
    const ctx = pick(['花圃', '披薩', '扇子', '摺扇']);
    if (lv <= 0) return { kind: 'sector', mode: 'drag', d: ri(2, 22) * 15, ctx };
    if (lv === 1) { const n = pick([2, 3, 4, 5, 6, 8, 9, 10, 12]), a = pick(coprimeTo(n)); return { kind: 'sector', mode: 'frac', n, a, each: 360 / n, ans: 360 * a / n, ctx }; }
    if (lv === 2) { const n = pick([2, 3, 4, 5, 6, 8, 9, 10, 12]); return { kind: 'sector', mode: 'read', n, d: 360 / n, ans: n, ctx }; }
    if (lv === 3) return { kind: 'sector', mode: 'part', part: pick(['圓心角', '半徑', '弧']), d: pick([60, 90, 120, 135, 240]), ctx };
    return { kind: 'sector', mode: 'draw', r: ri(3, 6), d: ri(1, 11) * 30, ctx };
  }

  /* ---------- 十五：大型倉庫（體積） ---------- */
  function genVolume(lv) {
    const box = pick([['貨箱', '立方公分'], ['積木', '立方公分'], ['冰塊盒', '立方公分']]);
    if (lv <= 0) { const a = ri(2, 5), b = ri(2, 4), c = ri(2, 4); return { kind: 'volume', mode: 'layer', a, b, c, one: a * b, ans: a * b * c, box }; }
    if (lv === 1) { const s = ri(2, 5); return { kind: 'volume', mode: 'cube', s, one: s * s, ans: s ** 3, box }; }
    if (lv === 2) { const W = ri(4, 7), w = ri(1, W - 2), H = ri(4, 6), h = ri(1, H - 2), d = ri(2, 4); return { kind: 'volume', mode: 'cut', W, w, H, h, d, p1: W * d * h, p2: w * d * (H - h), ans: W * d * h + w * d * (H - h), box }; }
    if (lv === 3) { const W = ri(4, 7), w = ri(1, W - 2), H = ri(4, 6), h = ri(1, H - 2), d = ri(2, 4); return { kind: 'volume', mode: 'fill', W, w, H, h, d, big: W * H * d, hole: (W - w) * (H - h) * d, ans: W * d * h + w * d * (H - h), box }; }
    if (lv === 4) { const x = pick(ITEMS.m3); return { kind: 'volume', mode: 'm3', ...unitQuestion('m3', x), e: x.e }; }
    if (lv === 5) { const a = ri(3, 12), b = ri(2, 8), c = ri(2, 6); return { kind: 'volume', mode: 'big', a, b, c, one: a * b, ans: a * b * c, what: pick(['大型倉庫', '儲水池', '一間教室大的貨艙']) }; }
    const a = ri(2, 5), b = ri(2, 4), c = ri(2, 5);
    return { kind: 'volume', mode: 'back', a, b, c, V: a * b * c, ans: c, box };
  }

  /* ---------- 十六：能源分配站（南一五下 6：整數、小數除以整數；除數一律是整數，除以小數在六上，商限三位） ---------- */
  function dealPlaces(a, n) { // 一位一位發：每一位有幾個、每份拿幾個、剩幾個（剩的拆開給下一位）
    const A = Math.round(a * 1000), units = [1000000, 100000, 10000, 1000, 100, 10, 1], names = ['1000', '100', '10', '1', '0.1', '0.01', '0.001'], out = [];
    let rem = 0, started = false;
    for (let i = 0; i < 7; i++) {
      const d = Math.floor(A / units[i]) % 10, have = rem * 10 + d;
      if (!started && have === 0 && units[i] > 1000) continue;
      started = true;
      if (units[i] < 1000 && have === 0 && A % units[i] === 0) break;
      const each = Math.floor(have / n);
      out.push({ place: names[i], have, each, left: have % n, split: rem });
      rem = have % n;
    }
    return out;
  }
  function genDdiv(lv) {
    if (lv >= 5) { // 直式
      let n, q, pl, t = 0, D;
      do { n = ri(2, 9); pl = pick([1, 2]); q = pl === 1 ? ri(11, 99) : ri(101, 399); D = String(q * n); } while (D.length !== String(q).length && t++ < 300);
      if (D.length !== String(q).length) { n = 3; q = 24; pl = 1; D = '72'; }
      return { kind: 'ddiv', mode: 'vdiv', n, q, pl, D, a: dec(q * n / 10 ** pl), ans: dec(q / 10 ** pl), digits: [...String(q)].map(Number), gap: D.length - pl, ctx: pick([['度電', '戶', '度'], ['公升燃料', '台機器', '公升'], ['公尺電線', '段', '公尺']]) };
    }
    const ctx = pick([['度電', '戶', '度'], ['公升燃料', '台機器', '公升'], ['公尺電線', '段', '公尺']]);
    if (lv <= 0) { const n = pick([2, 4, 5, 8, 10, 20, 25]), a = pick(Array.from({ length: Math.min(n - 1, 9) }, (_, i) => i + 1).filter(x => decimalPlaces(dec(x / n)) <= 3)), ans = dec(a / n), pl = decimalPlaces(ans), u = 10 ** pl; return { kind: 'ddiv', mode: 'one', a, n, ans, pl, u, cnt: Math.round(ans * u), ctx }; }
    if (lv === 1) { const n = ri(2, 6), q = ri(11, 49), pl = pick([1, 1, 2]), t = q * n; const a = dec(t / 10 ** pl); return { kind: 'ddiv', mode: 'dec', n, q, pl, T: t, a, ans: dec(q / 10 ** pl), ctx, deal: dealPlaces(a, n) }; }
    if (lv === 2) { const n = pick([4, 5, 8, 2]), q = ri(101, 399), T = q / 100 * n, a = dec(T); if (decimalPlaces(a) > 2 || a * 100 % 1 > 1e-9) { return { kind: 'ddiv', mode: 'long', n: 4, a: 5, cnt: 500, q: 125, ans: 1.25, ctx, deal: dealPlaces(5, 4) }; } return { kind: 'ddiv', mode: 'long', n, a, cnt: Math.round(a * 100), q, ans: dec(q / 100), ctx, deal: dealPlaces(a, n) }; }
    if (lv === 3) { const n = pick([2, 4, 5, 8]), a = pick(coprimeTo(n)); return { kind: 'ddiv', mode: 'frac', a, n, ans: dec(a / n), f: pick(['餅', '布', '巧克力']) }; }
    const [a, n] = pick([[10, 3], [20, 3], [7, 3], [5, 6], [11, 6], [2, 3], [13, 6], [10, 7], [16, 7], [25, 3], [50, 6], [100, 7]]), to = pick([1, 2]), v = a / n, ans = +v.toFixed(to), d3 = Math.floor(v * 1000) / 1000, lo = Math.floor(v * 10 ** to) / 10 ** to, hi = dec(lo + 1 / 10 ** to);
    return { kind: 'ddiv', mode: 'round', a, n, to, ans, d3, lo: dec(lo), hi, ctx };
  }

  /* ---------- 十七：城市規劃局（公畝、公頃、平方公里、公噸） ---------- */
  function genBigunit(lv) {
    if (lv <= 0) { const W = pick([20, 30, 40, 50]), H = pick([10, 20, 30]); return { kind: 'bigunit', mode: 'are', W, H, m2: W * H, ans: W * H / 100, what: pick(['社區公園', '停車場', '小農場']) }; }
    if (lv === 1) { const k = ri(2, 9); return { kind: 'bigunit', mode: 'ha', k, ans: k * 100 }; }
    if (lv === 2) {
      const k = ri(2, 9), what = pick(['新公園', '大農場', '自然保護區', '太陽能電廠']), C = pick([[`${k} 公頃`, '平方公尺', k * 10000, [`1 公頃是幾平方公尺？`, 10000], 'ha', true, '公頃', '100 平方公尺', 100], [`${k} 平方公里`, '公頃', k * 100, ['1 平方公里是幾公頃？', 100], 'km', true, '平方公里', '1 公頃', 1], [`${k * 100} 公畝`, '公頃', k, ['幾公畝是 1 公頃？', 100], 'ha', false, '公頃', '1 公畝', 1], [`${k * 10000} 平方公尺`, '公頃', k, ['1 公頃是幾平方公尺？', 10000], 'ha', false, '公頃', '100 平方公尺', 100], [`${k * 100} 公頃`, '平方公里', k, ['1 平方公里是幾公頃？', 100], 'km', false, '平方公里', '1 公頃', 1]]);
      return { kind: 'bigunit', mode: 'conv', from: C[0], to: C[1], ans: C[2], first: C[3], z: C[4], k, what, down: C[5], big: C[6], cell: C[7] };
    }
    if (lv === 3) { const x = pick(ITEMS.land); return { kind: 'bigunit', mode: 'pick', ...unitQuestion('land', x) }; }
    if (lv === 4) { const W = pick([100, 200, 300, 400, 500]), H = pick([100, 200, 300, 500]); return { kind: 'bigunit', mode: 'calc', W, H, m2: W * H, ans: W * H / 10000, what: pick(['新社區', '大農場', '太陽能電廠']) }; }
    if (lv === 5) { const k = ri(2, 9), tp = pick(['toKg', 'toT']), obj = pick([['大象', '🐘'], ['砂石車', '🚛'], ['貨櫃', '📦']]); return { kind: 'bigunit', mode: 'ton', k, tp, obj, ans: tp === 'toKg' ? k * 1000 : k, kg: k * 1000 }; }
    if (lv === 6) { const x = pick(ITEMS.ton); return { kind: 'bigunit', mode: 'tpick', ...unitQuestion('ton', x) }; }
    const a = ri(2, 12), n = ri(2, 9);
    return { kind: 'bigunit', mode: 'tcalc', a, n, t: a * n, ans: a * n * 1000, thing: pick(['一輛砂石車載', '一艘貨船艙載', '一節火車載']) };
  }

  /* ---------- 十八：民調中心（比率不大於 1） ---------- */
  function genRatio(lv) {
    if (lv <= 0) { const n = pick([4, 5, 6, 8, 10, 12, 15, 16, 20]), a = ri(1, n - 1), c = pick([['位居民贊成蓋公園', '位居民'], ['次投籃投進', '次投籃'], ['顆種子發芽', '顆種子']]), [sa, sn] = simp(a, n); return { kind: 'ratio', mode: 'rate', n, a, c, sa, sn }; }
    if (lv === 1) { const v = ri(5, 95); return { kind: 'ratio', mode: 'paint', v, ctx: pick(['贊成的人', '已經用掉的電', '蓋好的面積']) }; }
    if (lv === 2) {
      if (Math.random() < .55) { const n = pick([2, 4, 5, 10, 20, 25, 50]), a = pick(coprimeTo(n)); return { kind: 'ratio', mode: 'to100', sub: 'frac', a, n, ans: a * 100 / n }; }
      const v = ri(1, 99); return { kind: 'ratio', mode: 'to100', sub: 'dec', d: dec(v / 100), ans: v };
    }
    if (lv === 3) { const P = pick([100, 200, 300, 400, 500, 800, 1000, 1200]), k = pick([9, 8, 7, 6, 5]), thing = pick(['太空衣', '工具箱', '望遠鏡']); return { kind: 'ratio', mode: 'off', P, k, thing, each: P / 10, ans: P * k / 10 }; }
    if (lv === 4) { const N = pick([50, 100, 200, 300, 400, 500, 1000]), k = ri(1, 9), c = pick([['全城', '人', '投了票'], ['農場', '棵樹', '結了果'], ['圖書館', '本書', '借出去了']]); return { kind: 'ratio', mode: 'cheng', N, k, c, each: N / 10, ans: N * k / 10 }; }
    const N = pick([100, 200, 300, 400, 500, 600, 800, 1000, 2000]), p = pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 80, 90]), c = pick([['居民', '人', '喜歡新公園'], ['訪客', '人', '從地球來'], ['這批零件', '個', '要重做']]);
    return { kind: 'ratio', mode: 'part', N, p, c, one: N / 100, ans: N * p / 100 };
  }

  /* ---------- 十九：水資源站（容積、容量） ---------- */
  function genCapacity(lv) {
    if (lv <= 0) { const k = ri(2, 9), u = pick(['立方公分', '毫升']); return { kind: 'capacity', mode: 'liter', k, u, ans: k * 1000 }; }
    if (lv === 1) { const W = ri(5, 12), D = ri(5, 10), H = ri(5, 10); return { kind: 'capacity', mode: 'inner', W, D, H, ih: H - 1, base: (W - 2) * (D - 2), ans: (W - 2) * (D - 2) * (H - 1), what: pick(['水箱', '魚缸', '花盆']) }; }
    if (lv === 2) { const a = pick([10, 20, 30]), b = pick([10, 20]), h = ri(2, 9); return { kind: 'capacity', mode: 'level', a, b, h, base: a * b, V: a * b * h, ans: h }; }
    if (lv === 3) { const a = pick([10, 20, 30]), b = pick([10, 20]), h1 = ri(4, 10), up = ri(1, 4), t = pick(['月亮石', '鐵塊', '玩具車']); return { kind: 'capacity', mode: 'rock', a, b, h1, up, h2: h1 + up, base: a * b, ans: a * b * up, t }; }
    if (lv === 4) { const v = ri(2, 12) * 25, t = pick(['石頭', '鑰匙串', '鐵球']); return { kind: 'capacity', mode: 'over', v, t, ans: v }; }
    const x = pick(ITEMS.cap); return { kind: 'capacity', mode: 'pick', ...unitQuestion('cap', x) };
  }

  /* ---------- 二十：建築模型館（柱、錐、球） ---------- */
  const NAME_N = { 3: '三', 4: '四', 5: '五', 6: '六' };
  const solidName = (t, n) => t === 'prism' ? NAME_N[n] + '角柱' : t === 'pyr' ? NAME_N[n] + '角錐' : t === 'cyl' ? '圓柱' : t === 'cone' ? '圓錐' : '球';
  const REAL = [['帳篷', '⛺', 'prism', 3], ['鉛筆（沒削的）', '✏️', 'prism', 6], ['鞋盒', '👟', 'prism', 4], ['金字塔', '🔺', 'pyr', 4], ['罐頭', '🥫', 'cyl', 0], ['甜筒', '🍦', 'cone', 0], ['足球', '⚽', 'ball', 0], ['水塔', '💧', 'cyl', 0]];
  function genSolid(lv) {
    if (lv <= 0) {
      const t = pick(['prism', 'pyr']), n = ri(3, 6), w = pick([['面', '個'], ['邊', '條'], ['頂點', '個']]), ans = t === 'prism' ? { 面: n + 2, 邊: 3 * n, 頂點: 2 * n }[w[0]] : { 面: n + 1, 邊: 2 * n, 頂點: n + 1 }[w[0]];
      return { kind: 'solid', mode: 'count', t, n, w, name: solidName(t, n), ans };
    }
    if (lv === 1) { const r = pick(REAL), right = solidName(r[2], r[3]), others = shuffle(['三角柱', '四角柱', '六角柱', '四角錐', '圓柱', '圓錐', '球'].filter(x => x !== right)).slice(0, 2); return { kind: 'solid', mode: 'name', r, right, options: shuffle([right, ...others]) }; }
    if (lv === 2) {
      const f = pick([['prism', 4, '四角柱的上下兩個底面', '平行', '不平行', '上下一樣大，永遠不會碰到'], ['cyl', 0, '圓柱的上下兩個底面', '平行', '不平行', '上下一樣大，永遠不會碰到'], ['prism', 5, '五角柱的側面和底面', '垂直', '不垂直', '側面站得直直的'], ['cyl', 0, '圓柱的側面和底面', '垂直', '不垂直', '側面站得直直的'], ['pyr', 4, '四角錐的側面和底面', '不垂直', '垂直', '側面斜斜地靠向尖端'], ['cone', 0, '圓錐的側面和底面', '不垂直', '垂直', '側面斜斜地靠向尖端']]);
      return { kind: 'solid', mode: 'rel', t: f[0], n: f[1], text: f[2], ans: f[3], other: f[4], why: f[5] };
    }
    if (lv === 3) { const t = pick(['prism', 'pyr', 'cyl', 'cone']), n = t === 'prism' || t === 'pyr' ? ri(3, 6) : 0, right = solidName(t, n), others = shuffle(['三角柱', '四角柱', '五角柱', '六角柱', '三角錐', '四角錐', '五角錐', '六角錐', '圓柱', '圓錐'].filter(x => x !== right)); const near = others.filter(x => x.includes(NAME_N[n] || '圓')).slice(0, 1); return { kind: 'solid', mode: 'net', t, n, right, options: shuffle([...new Set([right, ...near, ...others])].slice(0, 3)) }; }
    const r = ri(3, 9); return { kind: 'solid', mode: 'ball', r, ans: r * 2, thing: pick(['西瓜', '柳丁', '月亮模型']) };
  }

  /* ---------- 單位的生活例子（皆為大約值） ---------- */
  const FACTOR = { 度: 1, 平方公分: 1, 平方公尺: 10000, 公畝: 1e6, 公頃: 1e8, 平方公里: 1e10, 秒: 1, 分鐘: 60, 小時: 3600, 日: 86400, 公斤: 1, 公噸: 1000, 毫升: 1, 公升: 1000, 立方公分: 1, 立方公尺: 1e6 };
  const it = (e, name, dim, v, u) => ({ e, name, dim, v, u, base: v * FACTOR[u] });
  const ITEMS = {
    deg: [
      it('✂️', '剪刀微微張開', '大約幾度', 20, '度'), it('📖', '書本打開一點點', '大約幾度', 45, '度'), it('🚪', '門全開', '大約幾度', 90, '度'), it('🕕', '六點鐘時鐘的兩根針', '夾幾度', 180, '度'), it('📐', '三角板最小的角', '大約幾度', 30, '度'), it('🧭', '轉身一整圈', '轉幾度', 360, '度'),
    ],
    m2: [
      it('👆', '食指的指腹', '多大', 1, '平方公分'), it('✋', '手掌', '多大', 100, '平方公分'), it('📖', '一本課本的封面', '多大', 500, '平方公分'), it('🪑', '課桌的桌面', '多大', 2400, '平方公分'),
      it('🚪', '一扇門', '多大', 2, '平方公尺'), it('🚗', '一個停車格', '多大', 12, '平方公尺'), it('🏫', '一間教室', '多大', 70, '平方公尺'), it('🏀', '一座籃球場', '多大', 420, '平方公尺'),
    ],
    time: [
      it('👏', '拍一下手', '要多久', 1, '秒'), it('🧼', '好好洗手', '要多久', 30, '秒'), it('🍜', '泡一碗泡麵', '要多久', 3, '分鐘'), it('🏫', '一節課', '有多久', 40, '分鐘'),
      it('🎬', '看一部電影', '要多久', 2, '小時'), it('🛌', '晚上睡覺', '要多久', 9, '小時'), it('🗓️', '一個星期', '有幾天', 7, '日'), it('🌴', '暑假', '大約多久', 60, '日'),
    ],
  };
  ITEMS.land = [
    it('🏫', '一間教室', '多大', 70, '平方公尺'), it('🏀', '一座籃球場', '多大', 420, '平方公尺'), it('🏡', '一塊小菜園', '多大', 2, '公畝'), it('🏊', '一座游泳池', '多大', 12, '公畝'),
    it('⚽', '一座足球場', '大約多大', 1, '公頃'), it('🏫', '一所小學的校地', '大約多大', 2, '公頃'), it('🌳', '一座大公園', '大約多大', 26, '公頃'), it('🏙️', '一個鄉鎮', '大約多大', 50, '平方公里'), it('🗺️', '澎湖群島', '大約多大', 127, '平方公里'),
  ];
  ITEMS.ton = [
    it('🐕', '一隻大狗', '多重', 30, '公斤'), it('🌾', '一袋米', '多重', 20, '公斤'), it('🏍️', '一台機車', '多重', 110, '公斤'), it('🚗', '一輛小汽車', '大約多重', 2, '公噸'), it('🐘', '一頭大象', '大約多重', 5, '公噸'), it('🚌', '一輛公車', '大約多重', 12, '公噸'), it('🚂', '一節火車車廂', '大約多重', 40, '公噸'), it('🐋', '一隻藍鯨', '大約多重', 150, '公噸'),
  ];
  ITEMS.cap = [
    it('🧪', '一小瓶乳酸飲料', '多少', 100, '毫升'), it('🥤', '一杯飲料', '多少', 500, '毫升'), it('🧃', '一包鋁箔包', '多少', 250, '毫升'), it('🍼', '一瓶大瓶牛奶', '多少', 2, '公升'), it('🛢️', '一桶飲水機的水', '多少', 20, '公升'), it('🛁', '一缸洗澡水', '大約多少', 200, '公升'),
  ];
  ITEMS.m3 = [
    it('🎲', '一顆小骰子', '多大', 1, '立方公分'), it('🥚', '一顆雞蛋', '多大', 55, '立方公分'), it('📖', '一本課本', '多大', 500, '立方公分'), it('📦', '一個鞋盒', '多大', 6000, '立方公分'), it('🧊', '一台大冰箱', '大約多大', 1, '立方公尺'), it('🚐', '一輛貨車的貨廂', '大約多大', 15, '立方公尺'), it('🚢', '一個大貨櫃', '大約多大', 30, '立方公尺'), it('🏫', '一間教室', '大約多大', 200, '立方公尺'),
  ];
  const UNITS_OF = { deg: ['度'], m2: ['平方公分', '平方公尺'], time: ['秒', '分鐘', '小時', '日'], land: ['平方公尺', '公畝', '公頃', '平方公里'], ton: ['公斤', '公噸'], cap: ['毫升', '公升'], m3: ['立方公分', '立方公尺'] };
  function unitQuestion(fam, item) {
    const x = item || pick(ITEMS[fam]), right = `${x.v} ${x.u}`, others = UNITS_OF[fam].filter(u => u !== x.u);
    let opts;
    if (fam === 'deg') { const near = [20, 30, 45, 90, 180, 360].filter(v => v !== x.v), s = shuffle(near); opts = [right, `${s[0]} 度`, `${s[1]} 度`]; }
    else if (others.length >= 2) { const s = shuffle(others); opts = [right, `${x.v} ${s[0]}`, `${x.v} ${s[1]}`]; }
    else if (others.length === 1) opts = [right, `${x.v} ${others[0]}`, `${x.v * 10} ${others[0]}`];
    else opts = [right, `${x.v * 100} ${x.u}`, `${x.v * 10000} ${x.u}`];
    return { e: x.e, text: `${x.name}${x.dim}？`, a: right, options: shuffle(opts), why: `${x.name}大約 ${right}。` };
  }
  function orderQuestion(fam) { // 挑 3 樣差很多的東西排大小
    const got = [];
    for (const x of shuffle(ITEMS[fam])) if (got.length < 3 && got.every(g => Math.max(g.base, x.base) / Math.min(g.base, x.base) >= 1.4)) got.push(x);
    return got;
  }

  const MAX = { line: 4, factor: 5, poly: 5, ext: 6, sym: 4, uadd: 4, mix: 6, para: 5, ttime: 4, cuboid: 5, fcalc: 6, decimal: 5, dmul: 5, sector: 4, volume: 6, ddiv: 5, bigunit: 7, ratio: 5, capacity: 5, solid: 4 };
  const maxLevel = g => MAX[g];
  const GEN = { line: genLine, factor: genFactor, poly: genPoly, ext: genExt, sym: genSym, uadd: genUadd, mix: genMix, para: genPara, ttime: genTtime, cuboid: genCuboid, fcalc: genFcalc, decimal: genDecimal, dmul: genDmul, sector: genSector, volume: genVolume, ddiv: genDdiv, bigunit: genBigunit, ratio: genRatio, capacity: genCapacity, solid: genSolid };
  function gen(game, lv) { return GEN[game](Math.max(0, Math.min(lv, MAX[game]))); }
  function adjust(rec, grade, maxLv) {
    rec.up = grade === 2 ? (rec.up || 0) + 1 : 0;
    rec.down = grade === 0 ? (rec.down || 0) + 1 : 0;
    if (rec.up >= 3) { rec.lv = Math.min((rec.lv || 0) + 1, maxLv); rec.up = 0; }
    if (rec.down >= 2) { rec.lv = Math.max((rec.lv || 0) - 1, 0); rec.down = 0; }
    return rec;
  }
  const api = { dealPlaces, fmtBig, decimalPlaces, solidName, gen, GEN, MAX, maxLevel, adjust, gcd, lcm, factors, simp, evalTokens, reflect, samePts, SYM_SHAPES, DEN_PAIRS, NETS_OK, NETS_BAD, netFaces, netOk, OPP, quadPts, ITEMS, UNIT_ITEMS: ITEMS, UNITS_OF, unitQuestion, orderQuestion, ri, pick, shuffle };
  if (typeof module !== 'undefined') module.exports = api; else root.Logic = api;
})(this);
