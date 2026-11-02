// 數感飛船：題目產生與評分（南一四上、四下，瀏覽器與 node 測試共用）
(function (root) {
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[ri(0, arr.length - 1)];
  const shuffle = arr => { const r = arr.slice(); for (let i = r.length - 1; i > 0; i--) { const j = ri(0, i); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const uniqueOptions = (ans, makers, n = 3) => { // 候選有限，不可無限重抽
    const s = new Set([ans]); let g = 0;
    while (s.size < n && g++ < 80) { const v = makers(); if (v > 0 && v !== ans) s.add(v); }
    for (let k = 1; s.size < n; k++) s.add(ans + k);
    return shuffle([...s]);
  };
  const d2 = x => (Math.round(x) / 100).toFixed(2); // 幾個 0.01 換成小數
  const gcd = (a, b) => b ? gcd(b, a % b) : a;

  /* ---------- 大數的念法 ---------- */
  const DIG = '零一二三四五六七八九';
  function under10k(n, leadZero) { // 一萬以內：中間的零只念一次，尾巴的零不念
    const ds = [Math.floor(n / 1000), Math.floor(n / 100) % 10, Math.floor(n / 10) % 10, n % 10], U = ['千', '百', '十', ''];
    let s = '', gap = leadZero;
    ds.forEach((d, i) => {
      if (d === 0) { if (s) gap = true; return; }
      if (gap) s += '零';
      s += DIG[d] + U[i]; gap = false;
    });
    return s;
  }
  function toZh(n) {
    if (n === 0) return '零';
    const wan = Math.floor(n / 10000), rest = n % 10000;
    if (!wan) return under10k(rest, false);
    const tail = rest ? under10k(rest, rest < 1000) : '';
    return under10k(wan, false).replace(/^一十/, '十') + '萬' + tail;
  }
  const wanText = n => { const w = Math.floor(n / 10000), r = n % 10000; return w ? `${w} 萬${r ? ` ${r}` : ''}` : `${r}`; };

  /* ---------- 大數控制室（四上 1） ---------- */
  const PLACES = [
    ['臺灣的人口', 2300, 'pop'], ['高雄市的人口', 270, 'pop'], ['臺北市的人口', 240, 'pop'], ['臺南市的人口', 180, 'pop'], ['花蓮縣的人口', 32, 'pop'], ['澎湖縣的人口', 11, 'pop'],
    ['地球到月亮的距離', 38, 'km'],
  ];
  function bigNum() {
    const shape = pick(['w3', 'w4', 'wz', 'zz']);
    if (shape === 'w3') return ri(100, 999) * 10000 + ri(1, 9) * 1000;
    if (shape === 'w4') return ri(1000, 9999) * 10000 + ri(1, 9) * 100;
    if (shape === 'wz') return ri(1, 9) * 1000 * 10000 + ri(1, 99) * 10000 + ri(1, 9) * 100 + ri(1, 9);
    return ri(1, 9) * 100 * 10000 + ri(1, 9) * 1000 + ri(1, 9) * 10;
  }
  function genBig(lv) {
    if (lv <= 0) { const v = bigNum(); return { kind: 'big', mode: 'build', v, word: toZh(v) }; }
    if (lv === 1) {
      const v = bigNum(), ds = String(v), z = ds.indexOf('0'); // 錯誤選項：多念或少念零
      const bad = [toZh(v).replace(/零/g, ''), toZh(v + (v % 10000 >= 1000 ? 1000 : 10000)), toZh(Math.floor(v / 10) * 10 + (v % 10 ? 0 : 1))].filter(x => x !== toZh(v));
      return { kind: 'big', mode: 'read', v, word: toZh(v), options: shuffle([toZh(v), ...[...new Set(bad)].slice(0, 2)]), z };
    }
    if (lv === 2) {
      const stack = ri(1, 9), bun = ri(1, 9), bill = ri(1, 9), box = pick([0, ri(1, 4)]);
      return { kind: 'big', mode: 'money', box, stack, bun, bill, ans: box * 1000000 + stack * 100000 + bun * 10000 + bill * 1000 };
    }
    if (lv === 3) {
      const p = pick(PLACES);
      if (p[2] === 'km') return { kind: 'big', mode: 'stadium', what: p[0], wan: p[1], each: '一輛高速火車要跑', per: 1, unit: '萬公里', ans: p[1], km: true };
      return { kind: 'big', mode: 'stadium', what: p[0], wan: p[1], ans: p[1] };
    }
    if (lv === 4) {
      const a = ri(1000, 9999) * 10000 + ri(0, 9) * 1000, cut = pick([10000, 100000, 1000000, 1000]);
      let b = a + pick([-1, 1]) * cut * ri(1, 3); if (b <= 0 || b >= 100000000) b = a + cut;
      return { kind: 'big', mode: 'cmp', l: a, r: b, ans: a > b ? 'L' : 'R' };
    }
    const w1 = ri(10, 60), r1 = ri(1, 40) * 100, w2 = ri(10, 30), r2 = ri(1, 40) * 100, sub = Math.random() < .4 && r1 >= r2;
    return { kind: 'big', mode: 'wan', w1, r1, w2, r2, op: sub ? '－' : '＋', ansW: sub ? w1 + 40 - w2 : w1 + w2, ansR: sub ? r1 - r2 : r1 + r2, a: w1 + (sub ? 40 : 0) };
  }

  /* ---------- 乘法裝配線（四上 2、四下 1） ---------- */
  function genMul(lv) {
    if (lv <= 0) { const a = ri(2, 9) * 1000, b = ri(2, 9); return { kind: 'mul', mode: 'thou', a, b, ans: a * b, steps: [a / 1000 * b, a * b] }; }
    if (lv === 1) { const a = ri(11, 49), b = ri(2, 9) * 10; return { kind: 'mul', mode: 'tens', a, b, ans: a * b, steps: [a * (b / 10), a * b] }; }
    if (lv === 2) { const a = ri(12, 49), b = ri(12, 39); return { kind: 'mul', mode: 'tiles', a, b, ans: a * b, parts: [[a - a % 10, b - b % 10], [a % 10, b - b % 10], [a - a % 10, b % 10], [a % 10, b % 10]].filter(p => p[0] && p[1]) }; }
    if (lv === 3) { const a = ri(112, 479), b = ri(12, 39); return { kind: 'mul', mode: 'rows', a, b, ans: a * b, steps: [a * (b - b % 10), a * (b % 10), a * b].filter((x, i) => i === 2 || x) }; }
    if (lv === 4) { const a = ri(2, 9), b = ri(2, 9), za = ri(2, 3), zb = ri(1, 2); return { kind: 'mul', mode: 'zero', a, b, za, zb, x: a * 10 ** za, y: b * 10 ** zb, ans: a * b * 10 ** (za + zb), steps: [a * b, a * b * 10 ** (za + zb)] }; }
    const a = ri(112, 319), b = ri(112, 229), h = b - b % 100, t = b % 100 - b % 10, o = b % 10;
    return { kind: 'mul', mode: 'rows', a, b, ans: a * b, steps: [a * h, ...(t ? [a * t] : []), ...(o ? [a * o] : []), a * b] };
  }

  /* ---------- 角度導航台（四上 3） ---------- */
  const angleKind = d => d === 360 ? '周角' : d === 180 ? '平角' : d === 90 ? '直角' : d < 90 ? '銳角' : d < 180 ? '鈍角' : '大於平角的角';
  function genDeg(lv) {
    if (lv <= 0) { const d = ri(2, 17) * 10; return { kind: 'deg', mode: 'read', d, ans: d, unit: 10 }; }
    if (lv === 1) { const d = ri(4, 34) * 5; return { kind: 'deg', mode: 'make', d, start: pick([0, 90, 180]) }; }
    if (lv === 2) { const d = pick([ri(2, 8) * 10, 90, ri(10, 17) * 10, 180, 360]); return { kind: 'deg', mode: 'kind', d, ans: angleKind(d), options: shuffle(['銳角', '直角', '鈍角', '平角', '周角']) }; }
    if (lv === 3) {
      const from = ri(0, 11), steps = ri(1, 9), cw = Math.random() < .7;
      return { kind: 'deg', mode: 'clock', from, steps, cw, to: ((from + (cw ? steps : -steps)) % 12 + 12) % 12, ans: steps * 30 };
    }
    const T = [[45, 30], [45, 45], [60, 30], [90, 45], [90, 30], [90, 60], [60, 45]], t = pick(T);
    if (Math.random() < .5) return { kind: 'deg', mode: 'join', a: t[0], b: t[1], ans: t[0] + t[1] };
    const whole = pick([180, 360]), used = whole === 180 ? pick([40, 65, 110, 135]) : pick([90, 120, 200, 250, 300]);
    return { kind: 'deg', mode: 'rest', whole, used, ans: whole - used };
  }

  /* ---------- 分裝倉庫（四上 4、四下 1） ---------- */
  function genDivv(lv) {
    if (lv <= 0) { const d = ri(2, 6) * 10, q = ri(2, 7), r = pick([0, ri(1, 9)]); return { kind: 'divv', mode: 'pack', total: d * q + r, d, q, r }; }
    if (lv === 1) { const d = ri(12, 39), q = ri(2, 8), r = ri(0, d - 1); return { kind: 'divv', mode: 'try', total: d * q + r, d, q, r, step: 1 }; }
    if (lv === 2) { const d = ri(12, 49), q = ri(12, 29), r = ri(0, d - 1); return { kind: 'divv', mode: 'try', total: d * q + r, d, q, r, step: 10 }; }
    if (lv === 3) { const d = ri(2, 9) * 100, q = ri(2, 9), r = pick([0, ri(1, 5) * 100 % d]); return { kind: 'divv', mode: 'zero', total: d * q + r, d, q, r }; }
    const d = ri(112, 319), q = ri(2, 4), r = ri(0, d - 1); return { kind: 'divv', mode: 'try', total: d * q + r, d, q, r, step: 1 };
  }

  /* ---------- 三角機翼廠（四上 5） ---------- */
  const TRIS = [
    { n: '正三角形', k: '銳角', sides: [6, 6, 6], ang: [60, 60, 60], pts: [[60, 8], [8, 98], [112, 98]] },
    { n: '等腰三角形', k: '銳角', sides: [7, 7, 4], ang: [33, 74, 73], pts: [[60, 4], [32, 104], [88, 104]] },
    { n: '等腰三角形', k: '鈍角', sides: [5, 5, 8], ang: [37, 37, 106], pts: [[6, 88], [114, 88], [60, 42]] },
    { n: '等腰三角形', k: '直角', sides: [6, 6, 8], ang: [90, 45, 45], pts: [[20, 16], [20, 104], [108, 104]] },
    { n: '一般三角形', k: '直角', sides: [3, 4, 5], ang: [90, 37, 53], pts: [[20, 24], [20, 100], [118, 100]] },
    { n: '一般三角形', k: '鈍角', sides: [4, 6, 9], ang: [20, 30, 130], pts: [[6, 96], [114, 96], [40, 56]] },
    { n: '一般三角形', k: '銳角', sides: [6, 7, 8], ang: [47, 58, 75], pts: [[42, 10], [6, 100], [114, 100]] },
  ];
  const SHAPES = [
    [[10, 10], [80, 10], [80, 40], [40, 40], [40, 90], [10, 90]],
    [[10, 10], [50, 10], [90, 50], [90, 90], [50, 90], [10, 40]],
    [[20, 10], [90, 30], [60, 90], [10, 70]],
    [[10, 90], [10, 10], [50, 50], [90, 10], [90, 40], [60, 90]],
  ];
  function genTri(lv) {
    const t = pick(TRIS);
    if (lv <= 0) return { kind: 'tri', mode: 'angle', t, ans: t.k + '三角形', options: ['銳角三角形', '直角三角形', '鈍角三角形'] };
    if (lv === 1) return { kind: 'tri', mode: 'side', t, ans: t.n, options: ['正三角形', '等腰三角形', '一般三角形'] };
    if (lv === 2) { let r = ri(0, 3), f = ri(0, 1); if (!r && !f) r = 1 + ri(0, 2); return { kind: 'tri', mode: 'flip', s: ri(0, SHAPES.length - 1), r, f }; }
    const a = ri(3, 9), b = ri(3, 9) === a ? a + 1 : a + ri(2, 4);
    return { kind: 'tri', mode: 'corr', s: ri(0, 1), a, b, ask: pick(['a', 'b']), r: ri(1, 3) };
  }

  /* ---------- 分數燃料站（四上 6、四下 3） ---------- */
  function genFra(lv) { const q = genFra0(lv); q.food = ri(0, 3); return q; } // 每題換一樣真實的東西
  function genFra0(lv) {
    const n = pick([3, 4, 5, 6, 8]);
    if (lv <= 0) {
      const t = pick(['真分數', '假分數', '帶分數']);
      if (t === '真分數') return { kind: 'fra', mode: 'kind', n, a: ri(1, n - 1), w: 0, ans: t };
      if (t === '假分數') return { kind: 'fra', mode: 'kind', n, a: ri(n, n * 2 + 1), w: 0, ans: t };
      return { kind: 'fra', mode: 'kind', n, a: ri(1, n - 1), w: ri(1, 2), ans: t };
    }
    if (lv === 1) { const w = ri(1, 3), r = ri(0, n - 1); return { kind: 'fra', mode: 'pack', n, a: w * n + r, w, r }; }
    if (lv === 2) { const w = ri(1, 3), r = ri(1, n - 1); return { kind: 'fra', mode: 'unpack', n, w, r, ans: w * n + r }; }
    if (lv === 3) { const top = ri(2, 3), a = ri(1, top * n - 1); return { kind: 'fra', mode: 'line', n, a, top }; }
    if (lv === 4) { const w = ri(0, 2), a = ri(1, n - 1), b = ri(1, n - 1), sub = Math.random() < .4 && w > 0; const t = w * n + a; return { kind: 'fra', mode: 'calc', n, w, a, b, sub, ans: sub ? t - b : t + b }; }
    if (lv === 5) { const a = ri(1, n - 1), k = ri(2, 6); return { kind: 'fra', mode: 'times', n, a, k, ans: a * k }; }
    const w = ri(1, 2), r = ri(1, n - 1), d = pick([-1, 0, 1]); return { kind: 'fra', mode: 'cmp', n, w, r, a: w * n + r + d, ans: d > 0 ? 'R' : d < 0 ? 'L' : 'E' };
  }

  /* ---------- 密碼規律室（四上 7） ---------- */
  function genPat(lv) {
    if (lv <= 0) {
      const dir = pick(['r', 'd', 'x', 'y']), start = ri(1, 6) * 10 + (dir === 'y' ? ri(4, 5) : ri(1, 5)), step = { r: 1, d: 10, x: 11, y: 9 }[dir];
      const cells = [0, 1, 2].map(i => start + step * i), ans = start + step * 3;
      return { kind: 'pat', mode: 'hundred', start, dir, step, cells, ans };
    }
    if (lv === 1) {
      const a = pick([1, 2, 5]), b = pick([10, 20, 12, 7]), s = ri(101, 140), rows = 4, cols = 5, r = ri(1, 3), c = ri(1, 4);
      return { kind: 'pat', mode: 'table', a, b, s, rows, cols, r, c, ans: s + r * b + c * a };
    }
    if (lv === 2) {
      const flip = Math.random() < .3, stepDeg = flip ? 0 : pick([90, 180]), start = pick([0, 90]), len = 4;
      const seq = Array.from({ length: len + 1 }, (_, i) => flip ? { r: 0, f: i % 2 } : { r: (start + i * stepDeg) % 360, f: 0 });
      return { kind: 'pat', mode: 'turn', seq, flip, stepDeg, shape: pick(['▲', 'F']) };
    }
    const op = pick(['＋', '－', '×']), a = ri(2, 9) + (op === '－' ? 6 : 0), b = ri(2, op === '－' ? a - 1 : 7), v = op === '＋' ? a + b : op === '－' ? a - b : a * b;
    return { kind: 'pat', mode: 'odd', op, a, b, v, ans: v % 2 ? '奇數' : '偶數' };
  }

  /* ---------- 採購併式處（四上 8） ---------- */
  function nextOp(t) { // 下一步要算哪個運算：括號先，再先乘除、後加減，同級由左到右
    const open = t.lastIndexOf('(');
    let from = 0, to = t.length;
    if (open >= 0) { from = open + 1; to = t.indexOf(')', open); }
    for (let i = from; i < to; i++) if (t[i] === '×' || t[i] === '÷') return i;
    for (let i = from; i < to; i++) if (t[i] === '＋' || t[i] === '－') return i;
    return -1;
  }
  function applyOp(t, i) {
    const a = t[i - 1], b = t[i + 1], v = t[i] === '＋' ? a + b : t[i] === '－' ? a - b : t[i] === '×' ? a * b : a / b, out = t.slice();
    out.splice(i - 1, 3, v);
    const p = out.indexOf(v, i - 1);
    if (out[p - 1] === '(' && out[p + 1] === ')') out.splice(p - 1, 3, v);
    return { v, t: out };
  }
  function evalTokens(t) { let c = t.slice(), g = 0; while (c.length > 1 && g++ < 9) { const i = nextOp(c); if (i < 0) break; c = applyOp(c, i).t; } return c[0]; }
  function genMix(lv) {
    if (lv <= 0) { const a = ri(4, 9) * 100, b = ri(1, 3) * 50 + ri(1, 9) * 10, c = ri(1, 9) * 20; return { kind: 'mix', mode: 'expr', tokens: [a, '－', b, '＋', c], story: `錢包有 ${a} 元，買零件花 ${b} 元，又賣舊零件賺 ${c} 元。`, ans: a - b + c }; }
    if (lv === 1) { const c = ri(2, 4), d = ri(2, 5), a = c * ri(2, 9) * d; return { kind: 'mix', mode: 'expr', tokens: [a, '÷', c, '×', d], story: `${a} 顆螺絲平分成 ${c} 盒，取 ${d} 盒的量。`, ans: a / c * d }; }
    if (lv === 2) { const a = ri(100, 500), b = ri(2, 9) * 10, c = ri(2, 6); return { kind: 'mix', mode: 'expr', tokens: [a, '＋', b, '×', c], story: `已有 ${a} 個零件，又進了 ${c} 箱，每箱 ${b} 個。`, ans: a + b * c }; }
    if (lv === 3) { const a = ri(3, 9) * 100, b = ri(40, 90), c = ri(10, 30); return { kind: 'mix', mode: 'expr', tokens: [a, '－', '(', b, '＋', c, ')'], story: `有 ${a} 元，一次買了 ${b} 元和 ${c} 元的東西。`, ans: a - (b + c) }; }
    const p = ri(12, 40), n = ri(3, 8), cash = (Math.floor(p * n / 100) + 1) * 100, right = `${cash}－${p}×${n}`, bad1 = `(${cash}－${p})×${n}`, bad2 = `${cash}－${p}＋${n}`;
    return { kind: 'mix', mode: 'write', story: `一個零件 ${p} 元，買 ${n} 個，付 ${cash} 元，要找回多少元？`, right, options: shuffle([right, bad1, bad2]), tokens: [cash, '－', p, '×', n], ans: cash - p * n };
  }

  /* ---------- 精密小數台（四上 9、四下 6） ---------- */
  function genDec(lv) {
    if (lv <= 0) { const v = ri(11, 189); return { kind: 'dec', mode: 'paint', v, text: d2(v) }; }
    if (lv === 1) { const v = ri(101, 399); return { kind: 'dec', mode: 'meter', cm: v, ans: d2(v), options: shuffle([d2(v), (v / 10).toFixed(1), String(v)]) }; }
    if (lv === 2) {
      const a = ri(1, 9) * 10, b = a - ri(1, 9) + pick([0, 10]);
      const l = pick([a, ri(11, 99)]), r = l === a ? b : ri(11, 99) === l ? l + 1 : l + pick([-7, 7, 15]);
      return { kind: 'dec', mode: 'cmp', l, r: Math.max(r, 1), ans: l > Math.max(r, 1) ? 'L' : l < Math.max(r, 1) ? 'R' : 'E' };
    }
    if (lv === 3) { const a = ri(12, 88), b = ri(12, 90), sub = Math.random() < .4, big = Math.max(a, b) + (a === b ? 5 : 0), sm = Math.min(a, b); return sub ? { kind: 'dec', mode: 'calc', a: big, b: sm, op: '－', ans: big - sm } : { kind: 'dec', mode: 'calc', a, b, op: '＋', ans: a + b }; }
    if (lv === 4) { const a = pick([ri(2, 9) * 10, ri(11, 49)]), k = ri(2, 9); return { kind: 'dec', mode: 'times', a, k, ans: a * k }; }
    const a = ri(11, 99), k = ri(11, 25); return { kind: 'dec', mode: 'times', a, k, ans: a * k };
  }
  const decOptions = ans => { const v = [ans, ans + 10, Math.abs(ans - 10) || ans + 1, ans * 10, ans + 100].filter((x, i, s) => s.indexOf(x) === i); return shuffle([ans, ...shuffle(v.slice(1)).slice(0, 2)]).map(d2); };

  /* ---------- 公里跑道（四上 10） ---------- */
  function genKm(lv) {
    if (lv <= 0) { const lap = pick([100, 200, 250, 500]), km = ri(1, 2); return { kind: 'km', mode: 'laps', lap, km, ans: km * 1000 / lap }; }
    if (lv === 1) { const k = ri(1, 9), m = pick([ri(1, 9) * 100, ri(10, 99) * 10, ri(1, 9) * 10, ri(1, 9)]); return { kind: 'km', mode: 'to', k, m, ans: k * 1000 + m }; }
    if (lv === 2) { const k = ri(1, 12), m = pick([ri(1, 9) * 100, ri(1, 9) * 10, ri(101, 999)]); return { kind: 'km', mode: 'back', k, m, v: k * 1000 + m }; }
    if (lv === 3) {
      const a = ri(1, 5), am = ri(1, 9) * 100, b = ri(1, 4), bm = ri(1, 9) * 100, sub = Math.random() < .35;
      if (sub) { const big = (a + b + 1) * 1000 + am, small = b * 1000 + bm; return { kind: 'km', mode: 'road', sub, a: big, b: small, v: big - small }; }
      return { kind: 'km', mode: 'road', sub, a: a * 1000 + am, b: b * 1000 + bm, v: a * 1000 + am + b * 1000 + bm };
    }
    if (lv === 4) { const a = ri(1, 3) * 1000 + ri(1, 9) * 100, k = ri(2, 6), v = a * k; return { kind: 'km', mode: 'days', a, k, v }; }
    const x = pick(ITEMS.km); return { kind: 'km', mode: 'pick', ...unitQuestion('km', x) };
  }

  /* ---------- 四邊艙板廠（四下 2） ---------- */
  const QUADS = [
    { n: '正方形', eq: '4 邊都一樣長', pr: 2, ra: 4, pts: [[25, 15], [105, 15], [105, 95], [25, 95]], side: [8, 8, 8, 8] },
    { n: '長方形', eq: '對邊一樣長', pr: 2, ra: 4, pts: [[8, 28], [122, 28], [122, 88], [8, 88]], side: [11, 6, 11, 6] },
    { n: '菱形', eq: '4 邊都一樣長', pr: 2, ra: 0, pts: [[65, 6], [120, 58], [65, 110], [10, 58]], side: [7, 7, 7, 7] },
    { n: '平行四邊形', eq: '對邊一樣長', pr: 2, ra: 0, pts: [[34, 22], [124, 22], [96, 92], [6, 92]], side: [9, 7, 9, 7] },
    { n: '梯形', eq: '4 邊不一定一樣長', pr: 1, ra: 0, pts: [[40, 22], [90, 22], [122, 92], [8, 92]], side: [5, 7, 11, 7] },
  ];
  function genQuad(lv) {
    if (lv <= 0) { const k = pick(['垂直', '平行', '都不是']); return { kind: 'quad', mode: 'lines', rel: k, tilt: ri(-20, 20), ans: k, options: ['垂直', '平行', '都不是'] }; }
    const t = pick(QUADS);
    if (lv === 1) return { kind: 'quad', mode: 'name', t, ans: t.n, options: shuffle(QUADS.map(x => x.n)).filter(x => x !== t.n).slice(0, 2).concat(t.n).sort(() => Math.random() - .5) };
    if (lv === 2) return { kind: 'quad', mode: 'pairs', t, ans: t.pr };
    const q = pick(QUADS.filter(x => x.n !== '梯形')); return { kind: 'quad', mode: 'diag', t: q, ans: '一樣大' };
  }

  /* ---------- 概數估算室（四下 4） ---------- */
  const roundTo = (v, u) => Math.round(v / u) * u, upTo = (v, u) => Math.ceil(v / u) * u, downTo = (v, u) => Math.floor(v / u) * u;
  function genEst(lv) {
    if (lv <= 0) { let v; do v = ri(1, 9) * 1000 + ri(101, 899); while (v % 100 === 0); return { kind: 'est', mode: 'near', v, u: 100, ans: roundTo(v, 100), lo: downTo(v, 100), hi: upTo(v, 100) }; }
    if (lv === 1) { const each = pick([10, 100]), box = ri(2, 9), r = ri(1, each - 1), n = each * box + r; return { kind: 'est', mode: 'up', n, each, ans: box + 1 }; }
    if (lv === 2) { const each = pick([100, 1000]), cnt = ri(2, 9), r = ri(1, each - 1), n = each * cnt + r; return { kind: 'est', mode: 'down', n, each, ans: cnt }; }
    if (lv === 3) { const u = pick([1000, 10000]), v = ri(11, 99) * u + ri(1, u - 1), how = pick(['四捨五入', '無條件進入', '無條件捨去']), ans = how === '四捨五入' ? roundTo(v, u) : how === '無條件進入' ? upTo(v, u) : downTo(v, u); return { kind: 'est', mode: 'how', v, u, how, ans, lo: downTo(v, u), hi: upTo(v, u) }; }
    if (lv === 4) { const a = ri(2, 9) * 100 + ri(5, 95), b = ri(1, 8) * 100 + ri(5, 95), near = roundTo(a, 100) + roundTo(b, 100); return { kind: 'est', mode: 'sum', a, b, ans: near, options: uniqueOptions(near, () => near + pick([-200, -100, 100, 200])) }; }
    const p = pick([48, 52, 98, 102, 195, 205, 298]), n = ri(3, 9), near = roundTo(p, p < 100 ? 10 : 100) * n; return { kind: 'est', mode: 'cost', p, n, ans: near, options: uniqueOptions(near, () => near + pick([-100, -50, 50, 100, 200])) };
  }

  /* ---------- 圖表觀測台（四下 5） ---------- */
  function genChart(lv) {
    const m0 = ri(0, 8), labels = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'].slice(m0, m0 + 4), names = ['氧氣', '水', '電池', '食物'];
    if (lv === 4) { const vals = labels.map(() => 100 + ri(1, 9) * 10); return { kind: 'chart', mode: 'gap', labels, vals, step: 10, base: 100, r: ri(0, 3), ask: 'read' }; }
    if (lv === 3) { let vals, ds, g = 0; do { vals = labels.map(() => ri(2, 9) * 10); ds = vals.slice(1).map((v, i) => v - vals[i]); } while ((Math.max(...ds) <= 0 || ds.filter(d => d === Math.max(...ds)).length > 1) && g++ < 200); if (Math.max(...ds) <= 0 || ds.filter(d => d === Math.max(...ds)).length > 1) { vals = [30, 70, 40, 60]; ds = [40, -30, 20]; } return { kind: 'chart', mode: 'line', labels, vals, step: 10, ds, best: ds.indexOf(Math.max(...ds)) }; }
    if (lv === 2) { const vals = names.map(() => ri(1, 8)); return { kind: 'chart', mode: 'build', labels: names, vals, step: pick([5, 10]), }; }
    const step = pick([5, 10, 20]), vals = names.map(() => ri(1, 8) * step);
    if (lv <= 0) { const r = ri(0, 3); return { kind: 'chart', mode: 'read', labels: names, vals, step, r, ans: vals[r] }; }
    let a = ri(0, 3), b = (a + ri(1, 3)) % 4; if (vals[a] === vals[b]) vals[a] += step; if (vals[a] < vals[b]) [a, b] = [b, a];
    return { kind: 'chart', mode: 'diff', labels: names, vals, step, a, b, ans: vals[a] - vals[b] };
  }

  /* ---------- 甲板工程處（四下 7） ---------- */
  function genDeck(lv) {
    if (lv <= 0) { const sq = Math.random() < .35, w = ri(3, 12), h = sq ? w : ri(2, 9) === w ? w + 1 : ri(2, 9); const hh = sq ? w : (h === w ? h + 1 : h); return { kind: 'deck', mode: 'walk', w, h: hh, sq, ans: 2 * (w + hh) }; }
    if (lv === 1) { const w = ri(3, 9), h = ri(2, 7); return { kind: 'deck', mode: 'tiles', w, h, ans: w * h }; }
    if (lv === 2) { const W = ri(5, 9), H = ri(4, 7), cw = ri(2, W - 2), ch = ri(1, H - 2); return { kind: 'deck', mode: 'ell', W, H, cw, ch, ans: W * H - cw * ch, a1: W * (H - ch), a2: (W - cw) * ch }; }
    if (lv === 3) { const m = ri(1, 9), cm = m * 10000; return Math.random() < .5 ? { kind: 'deck', mode: 'm2', from: 'm', m, ans: cm } : { kind: 'deck', mode: 'm2', from: 'cm', m, ans: m, cm }; }
    if (lv === 4) { const w = ri(3, 12), h = ri(2, 12), a = w * h; return { kind: 'deck', mode: 'back', w, h, a, ans: h }; }
    const x = pick(ITEMS.m2); return { kind: 'deck', mode: 'pick', ...unitQuestion('m2', x) };
  }

  /* ---------- 等值分數廚房（四下 8） ---------- */
  const EQ_BASE = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [1, 5]];
  function genEqv(lv) {
    const b = pick(EQ_BASE);
    if (lv <= 0) { const k = pick([2, 3, 4].filter(x => b[1] * x <= 12)); return { kind: 'eqv', mode: 'cut', a: b[0], n: b[1], k, ans: b[0] * k, to: b[1] * k }; }
    if (lv === 1) { const k = pick([2, 3, 4]); return { kind: 'eqv', mode: 'simplify', a: b[0] * k, n: b[1] * k, k, ansA: b[0], ansN: b[1] }; }
    if (lv === 2) { const per = pick([2, 3, 4]), total = b[1] * per; return { kind: 'eqv', mode: 'candy', a: b[0], n: b[1], per, total, ans: b[0] * per }; }
    if (lv === 3) { const n = pick([2, 3, 4, 5]), k = pick([2, 3]), m = n * k, a = ri(1, n - 1); let c = ri(1, m - 1); if (c === a * k && m > 2) c = c === 1 ? 2 : c - 1; return { kind: 'eqv', mode: 'cmp', a, n, c, m, k, ans: a * k > c ? 'L' : a * k < c ? 'R' : 'E' }; }
    const P = [[1, 2, '0.5'], [1, 4, '0.25'], [3, 4, '0.75'], [1, 5, '0.2'], [2, 5, '0.4'], [3, 5, '0.6'], [4, 5, '0.8'], [3, 10, '0.3'], [7, 10, '0.7'], [9, 100, '0.09'], [25, 100, '0.25'], [37, 100, '0.37']], p = pick(P);
    return { kind: 'eqv', mode: 'dec', a: p[0], n: p[1], ans: p[2], options: shuffle([p[2], ...shuffle([...new Set([`${p[0]}.${p[1]}`, '0.' + p[0], '0.' + p[1], '1.' + p[0]])].filter(x => x !== p[2])).slice(0, 2)]) };
  }

  /* ---------- 時刻調度室（四下 9） ---------- */
  const ampm = m => { const d = Math.floor(m / 1440), t = m % 1440, h = Math.floor(t / 60), mm = t % 60, pre = h < 6 ? '清晨' : h < 12 ? '上午' : h === 12 ? '中午' : h < 18 ? '下午' : '晚上', h12 = h === 0 ? 12 : h > 12 ? h - 12 : h; return `${d ? '隔天' : ''}${pre} ${h12} 時 ${mm} 分`; };
  const h24 = m => { const t = m % 1440; return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
  function genTime(lv) {
    if (lv <= 0) {
      const t = pick(['dh', 'hm', 'ms']);
      if (t === 'dh') { const a = ri(1, 5), b = ri(1, 23); return { kind: 'time', mode: 'conv', big: a, small: b, per: 24, u1: '日', u2: '小時', ans: a * 24 + b }; }
      if (t === 'hm') { const a = ri(1, 6), b = ri(5, 55); return { kind: 'time', mode: 'conv', big: a, small: b, per: 60, u1: '小時', u2: '分鐘', ans: a * 60 + b }; }
      const a = ri(1, 9), b = ri(5, 55); return { kind: 'time', mode: 'conv', big: a, small: b, per: 60, u1: '分鐘', u2: '秒', ans: a * 60 + b };
    }
    if (lv === 1) { const s = ri(7, 10) * 60 + ri(0, 11) * 5, d = ri(1, 3) * 60 + ri(1, 11) * 5; return { kind: 'time', mode: 'jump', s, e: s + d, h: Math.floor(d / 60), m: d % 60 }; }
    if (lv === 2) { const s = ri(9, 11) * 60 + ri(1, 11) * 5, d = ri(2, 6) * 60 + ri(1, 11) * 5; return { kind: 'time', mode: 'jump', s, e: s + d, h: Math.floor(d / 60), m: d % 60, noon: true }; }
    if (lv === 3) { const s = ri(21, 23) * 60 + ri(1, 11) * 5, d = ri(2, 7) * 60 + ri(1, 11) * 5; return { kind: 'time', mode: 'jump', s, e: s + d, h: Math.floor(d / 60), m: d % 60, night: true }; }
    if (lv === 4) { const s = ri(6, 20) * 60 + ri(1, 11) * 5, d = ri(1, 5) * 60 + ri(1, 11) * 5, before = Math.random() < .35; return before ? { kind: 'time', mode: 'after', s: s + d, h: Math.floor(d / 60), m: d % 60, before: true, e: s } : { kind: 'time', mode: 'after', s, h: Math.floor(d / 60), m: d % 60, before: false, e: s + d }; }
    const m = ri(13, 23) * 60 + ri(1, 11) * 5; return { kind: 'time', mode: 'h24', m, ans: h24(m), text: ampm(m), options: shuffle([h24(m), `${Math.floor(m / 60) - 12}:${String(m % 60).padStart(2, '0')}`, `${Math.max(Math.floor(m / 60) - 2, 13)}:${String((m % 60 + 30) % 60).padStart(2, '0')}`]) };
  }

  /* ---------- 體積貨艙（四下 10） ---------- */
  function genVol(lv) {
    if (lv <= 0) { const a = ri(2, 4), b = ri(2, 3), c = ri(1, 3); return { kind: 'vol', mode: 'layer', a, b, c, ans: a * b * c }; }
    if (lv === 1) { const a = ri(2, 4), b = ri(2, 3), c = ri(2, 4); return { kind: 'vol', mode: 'build', a, b, c, ans: a * b * c }; }
    if (lv === 2) {
      const a = ri(2, 3), b = ri(2, 3), c = 2, n = a * b * c, F = []; for (let x = 1; x <= n; x++) for (let y = 1; y <= n; y++) if (n % (x * y) === 0 && x <= 4 && y <= 3 && n / x / y <= 4) F.push([x, y, n / x / y]);
      const same = pick(F.filter(f => !(f[0] === a && f[1] === b && f[2] === c)).concat([[c, b, a]])), other = [a + 1 > 4 ? a - 1 : a + 1, b, c];
      return { kind: 'vol', mode: 'same', a, b, c, same, other, swap: Math.random() < .5 };
    }
    if (lv === 3) { const a = ri(2, 4), b = ri(2, 3), c = ri(1, 2), d = ri(1, 2), e = ri(1, 2); return { kind: 'vol', mode: 'two', a, b, c, d, e, f: b, ans: a * b * c + d * b * e }; }
    const x = pick(ITEMS.cm3); return { kind: 'vol', mode: 'pick', ...unitQuestion('cm3', x) };
  }

  /* ---------- 單位的生活例子（皆為大約值） ---------- */
  const FACTOR = { 公尺: 1, 公里: 1000, 度: 1, 平方公分: 1, 平方公尺: 10000, 立方公分: 1, 立方公尺: 1000000, 秒: 1, 分鐘: 60, 小時: 3600, 日: 86400 };
  const it = (e, name, dim, v, u) => ({ e, name, dim, v, u, base: v * FACTOR[u] });
  const ITEMS = {
    km: [
      it('🚪', '教室的門', '多高', 2, '公尺'), it('🚌', '一輛公車', '多長', 10, '公尺'), it('🏫', '學校的大樓', '多高', 15, '公尺'), it('🏃', '操場跑道一圈', '多長', 200, '公尺'), it('🌉', '一座長長的橋', '多長', 800, '公尺'),
      it('🚶', '走路 15 分鐘', '大約走多遠', 1, '公里'), it('🚲', '騎腳踏車半小時', '大約騎多遠', 6, '公里'), it('🏃‍♀️', '全程馬拉松', '多長', 42, '公里'), it('🚄', '高雄到臺北', '多遠', 350, '公里'), it('🏝️', '臺灣從北到南', '多長', 390, '公里'),
    ],
    deg: [
      it('✂️', '剪刀微微張開', '大約幾度', 20, '度'), it('📖', '書本打開一點點', '大約幾度', 45, '度'), it('🕒', '三點鐘時鐘的兩根針', '夾幾度', 90, '度'), it('🚪', '門全開', '大約幾度', 90, '度'), it('🕔', '五點鐘時鐘的兩根針', '夾幾度', 150, '度'), it('🕕', '六點鐘時鐘的兩根針', '夾幾度', 180, '度'), it('📐', '三角板最小的角', '大約幾度', 30, '度'), it('🧭', '轉身一整圈', '轉幾度', 360, '度'),
    ],
    m2: [
      it('👆', '食指的指腹', '多大', 1, '平方公分'), it('💳', '一張悠遊卡', '多大', 46, '平方公分'), it('✋', '手掌', '多大', 100, '平方公分'), it('📖', '一本課本的封面', '多大', 500, '平方公分'), it('🪑', '課桌的桌面', '多大', 2400, '平方公分'),
      it('🚪', '一扇門', '多大', 2, '平方公尺'), it('🛏️', '一張雙人床', '多大', 3, '平方公尺'), it('🚗', '一個停車格', '多大', 12, '平方公尺'), it('🏫', '一間教室', '多大', 70, '平方公尺'), it('🏀', '一座籃球場', '多大', 420, '平方公尺'),
    ],
    cm3: [
      it('🎲', '一顆小骰子', '多大', 1, '立方公分'), it('🧽', '一塊橡皮擦', '多大', 10, '立方公分'), it('🥚', '一顆雞蛋', '多大', 55, '立方公分'), it('🍎', '一顆蘋果', '多大', 250, '立方公分'), it('🧃', '一包鋁箔包飲料', '多大', 250, '立方公分'), it('📖', '一本課本', '多大', 500, '立方公分'), it('🧱', '一塊紅磚', '多大', 1200, '立方公分'), it('📦', '一個鞋盒', '多大', 6000, '立方公分'),
    ],
    time: [
      it('👏', '拍一下手', '要多久', 1, '秒'), it('🧼', '好好洗手', '要多久', 30, '秒'), it('🍜', '泡一碗泡麵', '要多久', 3, '分鐘'), it('🔔', '一節下課', '有多久', 10, '分鐘'), it('🏫', '一節課', '有多久', 40, '分鐘'),
      it('🎬', '看一部電影', '要多久', 2, '小時'), it('🎒', '在學校上課一天', '大約多久', 7, '小時'), it('🛌', '晚上睡覺', '要多久', 9, '小時'), it('🗓️', '一個星期', '有幾天', 7, '日'), it('🌴', '暑假', '大約多久', 60, '日'),
    ],
  };
  const UNITS_OF = { km: ['公尺', '公里'], deg: ['度'], m2: ['平方公分', '平方公尺'], cm3: ['立方公分'], time: ['秒', '分鐘', '小時', '日'] };
  function unitQuestion(fam, item) {
    const x = item || pick(ITEMS[fam]), right = `${x.v} ${x.u}`, others = UNITS_OF[fam].filter(u => u !== x.u);
    let opts;
    if (fam === 'deg') { const near = [20, 30, 45, 90, 150, 180, 360].filter(v => v !== x.v); const s = shuffle(near); opts = [right, `${s[0]} 度`, `${s[1]} 度`]; }
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

  const MAX = { big: 5, mul: 5, deg: 4, divv: 4, tri: 3, fra: 6, pat: 3, mix: 4, dec: 5, km: 5, quad: 3, est: 5, chart: 4, deck: 5, eqv: 4, time: 5, vol: 4 };
  const maxLevel = g => MAX[g];
  const GEN = { big: genBig, mul: genMul, deg: genDeg, divv: genDivv, tri: genTri, fra: genFra, pat: genPat, mix: genMix, dec: genDec, km: genKm, quad: genQuad, est: genEst, chart: genChart, deck: genDeck, eqv: genEqv, time: genTime, vol: genVol };
  function gen(game, lv) { return GEN[game](Math.max(0, Math.min(lv, MAX[game]))); }
  function adjust(rec, grade, maxLv) {
    rec.up = grade === 2 ? (rec.up || 0) + 1 : 0;
    rec.down = grade === 0 ? (rec.down || 0) + 1 : 0;
    if (rec.up >= 3) { rec.lv = Math.min((rec.lv || 0) + 1, maxLv); rec.up = 0; }
    if (rec.down >= 2) { rec.lv = Math.max((rec.lv || 0) - 1, 0); rec.down = 0; }
    return rec;
  }
  const api = { gen, GEN, MAX, maxLevel, adjust, toZh, wanText, d2, decOptions, gcd, angleKind, nextOp, applyOp, evalTokens, SHAPES, ampm, h24, ITEMS, UNIT_ITEMS: ITEMS, UNITS_OF, unitQuestion, orderQuestion, ri, pick, shuffle, uniqueOptions, roundTo };
  if (typeof module !== 'undefined') module.exports = api; else root.Logic = api;
})(this);
