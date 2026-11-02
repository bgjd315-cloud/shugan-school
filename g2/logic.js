// 數感小鎮：題目產生與評分（純邏輯，瀏覽器與 node 測試共用）
(function (root) {
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[ri(0, arr.length - 1)];
  const shuffle = arr => { const r = arr.slice(); for (let i = r.length - 1; i > 0; i--) { const j = ri(0, i); [r[i], r[j]] = [r[j], r[i]]; } return r; };

  /* ---------- 尋寶數線 ---------- */
  const LINE_LEVELS = [
    { a: 0, b: 100, marks: [0, 50, 100], step: 10 },
    { a: 0, b: 100, marks: [0, 50, 100], step: 1 },
    { a: 0, b: 200, marks: [0, 100, 200], step: 1 },
    { a: 0, b: 300, marks: [0, 100, 200, 300], step: 1 },
    { a: 100, b: 200, marks: [100, 200], step: 1 },
    { a: 0, b: 300, marks: [0, 300], step: 1 },
    { a: 0, b: 1000, marks: [0, 500, 1000], step: 10 },
    { a: 0, b: 1000, marks: [0, 1000], step: 1 },
  ];
  function genLine(lv, unit) {
    const c = LINE_LEVELS[Math.min(lv, maxLevel('line', unit))];
    const span = c.b - c.a, margin = Math.round(span * 0.06);
    let v;
    do { v = ri(c.a + margin, c.b - margin); if (c.step > 1) v = Math.round(v / c.step) * c.step; }
    while (c.marks.includes(v));
    const q = { kind: 'line', a: c.a, b: c.b, marks: c.marks, v, gold: span * 0.03, silver: span * 0.08, mode: 'place', steps: c.b - c.a >= 1000 ? [100, 10, 1] : [10, 1], labelAll: c.step > 1 && c.b <= 100 };
    if (lv >= 1 && Math.random() < 0.3) {
      q.mode = 'read';
      const unit = span >= 1000 ? 100 : span >= 200 ? 10 : 5;
      q.unit = unit;
      q.v = Math.max(c.a + unit, Math.min(c.b - unit, Math.round(v / unit) * unit));
      const gap = span * 0.2, opts = new Set([q.v]);
      let guard = 0;
      while (opts.size < 3 && guard++ < 50) {
        const o = Math.round((q.v + (Math.random() < 0.5 ? -1 : 1) * gap * (1 + Math.random())) / unit) * unit;
        if (o > c.a && o < c.b && Math.abs(o - q.v) >= gap) opts.add(o);
      }
      for (let o = c.a + unit; opts.size < 3 && o < c.b; o += unit) if (Math.abs(o - q.v) >= gap) opts.add(o);
      q.options = shuffle([...opts]);
    }
    return q;
  }
  function gradeLine(q, guess) {
    const d = Math.abs(guess - q.v);
    return d <= q.gold ? 2 : d <= q.silver ? 1 : 0;
  }

  /* ---------- 積木工坊 ---------- */
  function genBlock(lv, unit) {
    const L = Math.min(lv, maxLevel('block', unit));
    if (L === 6) { // 二下：千以內
      const h = ri(3, 9), z = Math.random();
      const v = z < 0.1 ? 1000 : z < 0.35 ? h * 100 + ri(1, 9) : h * 100 + ri(1, 9) * 10 + ri(0, 9);
      return { kind: 'block', mode: 'build', v, allow: [1, 1, 1] };
    }
    if (L === 7) {
      const overOnes = Math.random() < 0.5, h = ri(3, 8);
      const t = overOnes ? ri(0, 8) : ri(11, 19), o = overOnes ? ri(11, 19) : ri(0, 9);
      return { kind: 'block', mode: 'trade', h, t, o, v: h * 100 + t * 10 + o };
    }
    const pickMode = L === 5 ? pick([3, 4]) : L;
    if (pickMode === 0) return { kind: 'block', mode: 'build', v: ri(1, 9) * 10 + ri(1, 9), allow: [0, 1, 1] };
    if (pickMode === 1) {
      const v = pick([100 + ri(1, 9), 100 + ri(1, 9) * 10, 100 + ri(1, 9) * 10 + ri(1, 9)]);
      return { kind: 'block', mode: 'build', v, allow: [1, 1, 1] };
    }
    if (pickMode === 2) {
      const h = pick([1, 2]);
      const v = pick([h * 100 + ri(1, 9), h * 100 + ri(1, 9) * 10 + ri(1, 9), 300]);
      return { kind: 'block', mode: 'build', v, allow: [1, 1, 1] };
    }
    if (pickMode === 3) return { kind: 'block', mode: 'build', v: 100 + ri(1, 6) * 10 + ri(0, 9), allow: [0, 1, 1], note: '百積木用完了！' };
    // 換位：十或一超過 9，要換算才讀得出來
    const overOnes = Math.random() < 0.5;
    const h = overOnes ? ri(1, 2) : 1;
    const t = overOnes ? ri(0, 7) : ri(11, 18);
    const o = overOnes ? ri(11, 19) : ri(0, 9);
    return { kind: 'block', mode: 'trade', h, t, o, v: h * 100 + t * 10 + o };
  }

  /* ---------- 青蛙跳跳 ---------- */
  const HOPS = [100, 10, 1, -1, -10, -100];
  const MAXN = 1100;
  function bfs(s, t) {
    if (s === t) return [];
    const prev = new Map([[s, null]]);
    let front = [s];
    while (front.length) {
      const next = [];
      for (const x of front) for (const h of HOPS) {
        const y = x + h;
        if (y < 0 || y > MAXN || prev.has(y)) continue;
        prev.set(y, [x, h]);
        if (y === t) {
          const path = [];
          for (let c = t; prev.get(c); c = prev.get(c)[0]) path.unshift(prev.get(c)[1]);
          return path;
        }
        next.push(y);
      }
      front = next;
    }
    return null;
  }
  const parHops = (s, t) => bfs(s, t).length;
  function genFrog(lv, unit) {
    const L = Math.min(lv, unit < 2 ? 3 : maxLevel('frog', unit));
    if (L === 6) { // 二下：千以內
      const s = ri(120, 780);
      return frogQ(s, s + pick([100, 200, 99, 199, 201, 110, 190, 299, 310]));
    }
    if (L === 7) {
      if (Math.random() < 0.5) { const a = ri(210, 690), b = pick([99, 199, 101, 201, 290, 110, 298]); return { ...frogQ(a, a + b), mode: 'expr', expr: `${a}＋${b}` }; }
      const a = ri(420, 980), b = pick([99, 199, 101, 201, 190, 110, 298]);
      return { ...frogQ(a, a - b), mode: 'expr', expr: `${a}－${b}` };
    }
    if (L === 0) { // 不跨十
      const s = ri(1, 5) * 10 + ri(1, 4);
      return frogQ(s, s + ri(1, 3) * 10 + ri(1, 4));
    }
    if (L === 1) { // 跨十
      const s = ri(1, 7) * 10 + ri(6, 9);
      return frogQ(s, s + ri(2, 6));
    }
    if (L === 2) { // 加近十的數，想成多加再退回
      const s = ri(12, 70);
      return frogQ(s, s + pick([9, 19, 29, 8, 18]));
    }
    if (L === 3) { // 三位數
      const s = ri(102, 199);
      const t = s + pick([100, 110, 90, 109, 99, 120]);
      return frogQ(s, Math.min(t, 300));
    }
    if (L === 4) { // 往回跳
      const s = ri(40, 95);
      return frogQ(s, s - pick([9, 19, 8, 18, 29]));
    }
    // 算式題：終點藏起來
    if (Math.random() < 0.5) {
      const a = ri(15, 79), b = pick([9, 19, 29, 39, 18, 28, 11, 21, 12]);
      return { ...frogQ(a, a + b), mode: 'expr', expr: `${a}＋${b}` };
    }
    const a = ri(45, 99), b = pick([9, 19, 29, 18, 28, 11, 21]);
    return { ...frogQ(a, a - b), mode: 'expr', expr: `${a}－${b}` };
  }
  function frogQ(s, t) {
    return { kind: 'frog', mode: 'walk', s, t, par: parHops(s, t), best: bfs(s, t) };
  }
  function gradeFrog(q, pos, hops) {
    if (pos !== q.t) return 0;
    return hops <= q.par ? 2 : 1;
  }

  /* ---------- 神奇天平 ---------- */
  function cmpQ(lText, l, rText, r, why) { return { kind: 'scale', mode: 'cmp', lText, rText, l, r, ans: l > r ? 'L' : l < r ? 'R' : 'E', why }; }
  function maybeSwap(q) {
    if (Math.random() < 0.5) return q;
    return { ...q, lText: q.rText, rText: q.lText, l: q.r, r: q.l, ans: q.ans === 'L' ? 'R' : q.ans === 'R' ? 'L' : 'E' };
  }
  function genScale(lv, unit) {
    const L = Math.min(lv, unit < 2 ? 0 : maxLevel('scale', unit));
    if (L === 6) { // 二下第 2 單元：估算，個位用 0、1、2、8、9 最好估
      const near = d => pick([d * 10 + 1, d * 10 + 2, d * 10 - 1, d * 10 - 2]);
      if (Math.random() < 0.5) {
        const x = ri(3, 6), y = ri(2, 4), a = near(x), b = near(y), est = (x + y) * 10;
        const options = shuffle([est - 10, est, est + 10]);
        return { kind: 'scale', mode: 'near', text: `${a}＋${b}`, ans: est, options, why: `${a} 大約是 ${x * 10}，${b} 大約是 ${y * 10}，想成 ${x * 10}＋${y * 10}，大約是 ${est}。` };
      }
      const x = ri(2, 6), y = ri(1, 3), a = x * 100 - ri(1, 2), b = y * 100 - ri(1, 2), bench = (x + y) * 100;
      return maybeSwap(cmpQ(`${a}＋${b}`, a + b, `${bench}`, bench, `${a} 不到 ${x * 100}，${b} 不到 ${y * 100}，合起來一定比 ${bench} 少。`));
    }
    if (L === 7) { // 二下第 5 單元：0、1、10 的乘法
      const a = ri(2, 9), b = ri(2, 9);
      return pick([
        () => maybeSwap(cmpQ(`${a}×0`, 0, `0×${b}`, 0, '不管幾個 0，或是 0 組，都是 0。')),
        () => maybeSwap(cmpQ(`${a}×1`, a, `${a}×10`, a * 10, `${a}×10 有 10 組 ${a}，比 1 組多很多。`)),
        () => maybeSwap(cmpQ(`${a}×10`, a * 10, `${a * 10}`, a * 10, `${a} 個十就是 ${a * 10}。`)),
        () => maybeSwap(cmpQ(`1×${b}`, b, `${b}×1`, b, `都是 ${b}。`)),
      ])();
    }
    if (L === 8) { // 二下第 9 單元：幾分之一的大小
      const [m, n] = shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 2);
      const q = cmpQ(fracWord(m), 1 / m, fracWord(n), 1 / n, '同一個東西平分，分的份數越多，每一份就越小。');
      q.frac = true;
      return maybeSwap(q);
    }
    if (L === 0) {
      if (unit < 2 || Math.random() < 0.5) {
        const a = pick([[104, 140], [196, 269], [210, 186], [255, 258], [128, 96], [299, 300], [170, 107], [231, 213]]);
        const pair = Math.random() < 0.5 ? a : [ri(101, 299), ri(101, 299)];
        if (pair[0] === pair[1]) pair[1] += 1;
        return maybeSwap(cmpQ(`${pair[0]}`, pair[0], `${pair[1]}`, pair[1], '先比百位；一樣，再比十位；再一樣，才比個位。'));
      }
      const a = ri(21, 68), x = ri(2, 6), y = x + ri(1, 3);
      return maybeSwap(cmpQ(`${a}＋${x}`, a + x, `${a}＋${y}`, a + y, `都是 ${a} 開始，${y} 比 ${x} 多，加得多的比較重。`));
    }
    if (L === 1) { // 估一估
      const a = ri(21, 48), b = ri(21, 48), s = a + b;
      const bench = Math.random() < 0.5 ? Math.floor(s / 10 - 1) * 10 : Math.ceil(s / 10 + 1) * 10;
      const ta = Math.floor(a / 10) * 10, tb = Math.floor(b / 10) * 10;
      return maybeSwap(cmpQ(`${a}＋${b}`, s, `${bench}`, bench, `先看十位：${ta}＋${tb}＝${ta + tb}，再想個位大概多多少，就知道和 ${bench} 比起來怎麼樣。`));
    }
    if (L === 2) {
      const a = pick([19, 29, 39, 18, 28, 48]), b = ri(12, 35), d = 10 - a % 10;
      const t = pick(['same', 'more', 'swap']);
      if (t === 'same') return maybeSwap(cmpQ(`${a}＋${b}`, a + b, `${a + d}＋${b - d}`, a + b, `${b} 分 ${d} 給 ${a}，總數沒變，所以一樣重。`));
      if (t === 'more') return maybeSwap(cmpQ(`${a}＋${b}`, a + b, `${a + d}＋${b}`, a + d + b, `${a + d} 比 ${a} 多，另一個數一樣，所以 ${a + d}＋${b} 比較重。`));
      return maybeSwap(cmpQ(`${a}＋${b}`, a + b, `${b}＋${a}`, a + b, '兩個數一樣，只是換位置，合起來還是一樣多。'));
    }
    if (L === 3) {
      const a = ri(41, 95), x = pick([8, 9, 18, 19]), d = 10 - x % 10;
      const t = pick(['less', 'keep']);
      if (t === 'less') { const y = x + d; return maybeSwap(cmpQ(`${a}－${x}`, a - x, `${a}－${y}`, a - y, `都從 ${a} 拿走，${y} 拿得比 ${x} 多，剩下的比較少。`)); }
      return maybeSwap(cmpQ(`${a}－${x}`, a - x, `${a + d}－${x + d}`, a - x, `兩邊的數都多 ${d}，相差沒有變，所以一樣重。`));
    }
    if (L === 4) { // 補數字
      const t = pick(['move', 'part', 'minus']);
      if (t === 'move') {
        const a = pick([19, 29, 39, 28, 38, 48]), b = ri(12, 35), d = 10 - a % 10;
        return { kind: 'scale', mode: 'fill', text: `${a}＋${b} ＝ ${a + d}＋□`, ans: b - d, why: `${a} 多了 ${d} 變 ${a + d}，${b} 就要少 ${d}。` };
      }
      if (t === 'part') {
        const a = ri(13, 38), b = ri(5, 29), total = a + b;
        return { kind: 'scale', mode: 'fill', text: `${a}＋□ ＝ ${total}`, ans: b, why: `全部 ${total}，減掉 ${a}，就是另一部分。` };
      }
      const total = ri(30, 95), b = ri(6, 28);
      return { kind: 'scale', mode: 'fill', text: `${total}－□ ＝ ${total - b}`, ans: b, why: `全部 ${total}，減掉剩下的 ${total - b}，就是拿走的。` };
    }
    // 第 7 單元以後才出乘法關係
    const fs = factors(unit), a = pick(fs), b = ri(2, 8);
    const t = pick(['more', 'add']);
    if (t === 'more') return maybeSwap(cmpQ(`${a}×${b}`, a * b, `${a}×${b + 1}`, a * (b + 1), `${a}×${b + 1} 比 ${a}×${b} 多 1 組 ${a}。`));
    const n = Math.min(b, 4), diff = pick([0, 0, 1]);
    const adds = Array(n + diff).fill(a).join('＋');
    return maybeSwap(cmpQ(`${a}×${n}`, a * n, adds, a * (n + diff), `${a}×${n} 就是 ${n} 個 ${a} 相加，數數看加法算式有幾個 ${a}。`));
  }

  /* ---------- 糖果排排 ---------- */
  const ZH = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  function fracWord(n) { return `${ZH[n]}分之一`; }
  function factors(unit) { return unit >= 9 ? [2, 3, 4, 5, 6, 7, 8, 9] : unit >= 7 ? [2, 4, 5, 8] : [2, 5]; }
  function genCandy(lv, unit) {
    const fs = factors(unit), L = Math.min(lv, unit >= 7 ? maxLevel('candy', unit) : 2);
    const a = pick(fs);
    if (L === 4) { // 0、1、10 的乘法
      const b = ri(2, 9), z = pick([0, 1, 10, 10]);
      return { kind: 'candy', mode: 'count', a: z, b, ans: z * b, special: true };
    }
    if (L === 5) { const f = pick(fs), b = ri(2, 9); return { kind: 'candy', mode: 'pack', a: f, b, total: f * b, ans: b }; }
    if (L === 6) { const f = ri(2, 6), b = ri(2, 6); return { kind: 'candy', mode: 'share', a: f, b, total: f * b, ans: f }; }
    if (L === 7) {
      if (Math.random() < 0.3) { const n = pick([2, 3, 4, 5, 6]); return { kind: 'candy', mode: 'fair', n, fairFirst: Math.random() < 0.5, ans: 'fair' }; }
      const n = ri(2, 9);
      const options = shuffle([n, ...shuffle([2, 3, 4, 5, 6, 7, 8, 9].filter(x => x !== n)).slice(0, 2)]);
      return { kind: 'candy', mode: 'frac', n, options, ans: n };
    }
    if (L === 0) { const b = ri(2, 5); return { kind: 'candy', mode: 'count', a, b, ans: a * b }; }
    if (L === 1) { const b = ri(3, 9); return { kind: 'candy', mode: 'count', a, b, ans: a * b }; }
    if (L === 2) {
      const b = ri(3, 7), more = Math.random() < 0.6;
      return { kind: 'candy', mode: more ? 'more' : 'less', a, b, known: a * b, ans: more ? a * (b + 1) : a * (b - 1) };
    }
    const big = fs.filter(x => x > 2);
    const f = big.length ? pick(big) : a, b = ri(6, 9);
    return { kind: 'candy', mode: 'split', a: f, b, ans: f * b };
  }

  /* ---------- 鐘塔修理 ---------- */
  const tt = (h, m) => `${h} 時 ${m} 分`;
  function timeOptions(h, m) {
    const opts = new Set([tt(h, m)]);
    const alts = [[h % 12 + 1, m], [h === 1 ? 12 : h - 1, m], [h, (m + 30) % 60], [h, (m + 5) % 60], [h, (m + 55) % 60], [m / 5 >= 1 && m % 5 === 0 ? m / 5 : h % 12 + 1, h % 12 * 5]];
    for (const [x, y] of shuffle(alts)) { if (opts.size < 3 && x >= 1 && x <= 12) opts.add(tt(x, y)); }
    return shuffle([...opts]);
  }
  function genClock(lv, unit) {
    const L = Math.min(lv, maxLevel('clock', unit)), h = ri(1, 12);
    if (L === 0) { const m = pick([0, 30]); return { kind: 'clock', mode: 'read', h, m, options: timeOptions(h, m) }; }
    if (L === 1) { const m = ri(1, 11) * 5; return { kind: 'clock', mode: 'read', h, m, options: timeOptions(h, m) }; }
    if (L === 2) { const m = ri(1, 59); return { kind: 'clock', mode: 'read', h, m, options: timeOptions(h, m) }; }
    if (L === 3) return { kind: 'clock', mode: 'set', h, m: ri(1, 11) * 5 + pick([0, 0, 1, 2, 3]) };
    // 再過幾分：會跨過整點
    const s = ri(0, 59), add = pick([1, 5, 10, 15, 20, 30, 60]);
    const total = h * 60 + s + add, nh = Math.floor(total / 60), rh = nh > 12 ? nh - 12 : nh;
    return { kind: 'clock', mode: 'after', sh: h, sm: s, add, h: rh, m: total % 60 };
  }

  /* ---------- 小火車 ---------- */
  function genTrain(lv, unit) {
    const L = Math.min(lv, maxLevel('train', unit));
    const on = n => ({ t: '上車', n, d: n }), off = n => ({ t: '下車', n, d: -n });
    let start, ops;
    if (L === 0) { start = ri(2, 4) * 10; ops = [on(ri(1, 3) * 10), on(ri(1, 2) * 10)]; }
    else if (L === 1) { start = ri(30, 60); ops = [off(ri(6, 12)), off(ri(5, 15))]; }
    else if (L === 2) { start = ri(35, 70); ops = [off(ri(12, 29)), on(ri(11, 28))]; }
    else if (L === 3) { start = ri(25, 50); ops = [on(ri(13, 39)), off(ri(14, 30))]; }
    else { // 二下第 7 單元：先乘再加減
      const a = pick(factors(unit)), b = ri(2, 6), n = ri(3, 12);
      const add = Math.random() < 0.5;
      const v = a * b;
      const op = add ? on(n) : off(Math.min(n, v - 1));
      return { kind: 'train', mode: 'mult', a, b, ops: [op], steps: [v, v + op.d], ans: v + op.d };
    }
    const v1 = start + ops[0].d;
    return { kind: 'train', mode: 'two', start, ops, steps: [v1, v1 + ops[1].d], ans: v1 + ops[1].d };
  }

  /* ---------- 零錢小舖 ---------- */
  const GOODS = ['彈珠', '貼紙', '鉛筆', '橡皮擦', '陀螺', '風箏', '小汽車', '跳繩', '故事書', '水壺'];
  const fewest = (v, coins) => { let n = 0; for (const c of coins) { n += Math.floor(v / c); v %= c; } return n; };
  function genShop(lv, unit) {
    const L = Math.min(lv, maxLevel('shop', unit));
    const small = [50, 10, 5, 1], big = [1000, 500, 100, 50, 10, 5, 1], item = pick(GOODS);
    if (L === 0) { const v = ri(1, 9) * 5 + pick([0, 0, 1, 2, 3]); return { kind: 'shop', mode: 'pay', item, price: v, coins: small, par: fewest(v, small) }; }
    if (L === 1) { const v = ri(26, 99); return { kind: 'shop', mode: 'pay', item, price: v, coins: small, par: fewest(v, small), strict: true }; }
    if (L === 2) { const v = ri(11, 95); return { kind: 'shop', mode: 'change', item, price: v, paid: 100, ans: 100 - v }; }
    if (L === 3) { const v = ri(3, 18) * 50 + ri(1, 40); return { kind: 'shop', mode: 'pay', item, price: v, coins: big, par: fewest(v, big), strict: true }; }
    const x = ri(3, 6), y = ri(2, 3), a = x * 10 + pick([-1, -2, 1, 2]), b = y * 10 + pick([-1, -2, 1, 2]);
    const budget = (x + y) * 10 + pick([-5, 5, 10, -10]), other = pick(GOODS.filter(g => g !== item));
    return { kind: 'shop', mode: 'enough', item, other, a, b, budget, ans: a + b <= budget, why: `${a} 大約 ${x * 10}，${b} 大約 ${y * 10}，合起來大約 ${(x + y) * 10}，要和 ${budget} 比一比。` };
  }

  // 單元編號：1–10 是二上，11–20 是二下
  function maxLevel(game, unit) {
    if (game === 'line' || game === 'block') return unit >= 11 ? 7 : 5;
    if (game === 'frog') return unit >= 12 ? 7 : 5;
    if (game === 'clock') return unit >= 8 ? 4 : 0;
    if (game === 'train') return unit >= 17 ? 4 : unit >= 6 ? 3 : 1;
    if (game === 'shop') return unit >= 12 ? 4 : unit >= 11 ? 3 : 2;
    if (game === 'scale') return unit >= 19 ? 8 : unit >= 15 ? 7 : unit >= 12 ? 6 : unit >= 7 ? 5 : 4;
    return unit >= 19 ? 7 : unit >= 18 ? 6 : unit >= 15 ? 4 : 3; // candy：第 8 單元分裝與平分是兩級
  }
  function gen(game, lv, unit) {
    if (game === 'line') return genLine(lv, unit);
    if (game === 'block') return genBlock(lv, unit);
    if (game === 'frog') return genFrog(lv, unit);
    if (game === 'scale') return genScale(lv, unit);
    if (game === 'clock') return genClock(lv, unit);
    if (game === 'train') return genTrain(lv, unit);
    if (game === 'shop') return genShop(lv, unit);
    return genCandy(lv, unit);
  }
  // 依這次成績調整等級：第一次就對連 3 題升級，連 2 題沒答出來降級
  function adjust(rec, grade, maxLv) {
    rec.up = grade === 2 ? (rec.up || 0) + 1 : 0;
    rec.down = grade === 0 ? (rec.down || 0) + 1 : 0;
    if (rec.up >= 3) { rec.lv = Math.min((rec.lv || 0) + 1, maxLv); rec.up = 0; }
    if (rec.down >= 2) { rec.lv = Math.max((rec.lv || 0) - 1, 0); rec.down = 0; }
    return rec;
  }

  const api = { genClock, genTrain, genShop, gen, genLine, genBlock, genFrog, genScale, genCandy, gradeLine, gradeFrog, bfs, parHops, adjust, factors, maxLevel, fracWord, HOPS, ri, pick, shuffle };
  if (typeof module !== 'undefined') module.exports = api; else root.Logic = api;
})(this);
