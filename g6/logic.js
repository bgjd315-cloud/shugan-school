// 數感銀河站：題目產生與評分（南一六上、六下，瀏覽器與 node 測試共用）
// 每一種題型都有兩種以上的真實情境（q.ctx 是情境名稱，測試會檢查）
(function (root) {
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[ri(0, arr.length - 1)];
  const shuffle = arr => { const r = arr.slice(); for (let i = r.length - 1; i > 0; i--) { const j = ri(0, i); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const lcm = (a, b) => a * b / gcd(a, b);
  const factors = n => { const f = []; for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i); return f; };
  const simp = (a, n) => { const g = gcd(a, n); return [a / g, n / g]; };
  const dec = x => +(+x).toFixed(4); // 小數計算去掉浮點誤差
  const PI = 3.14;
  const isPrime = n => n > 1 && factors(n).length === 2;
  const primeFactors = n => { const f = []; let m = n; for (let p = 2; m > 1; p++) while (m % p === 0) { f.push(p); m /= p; } return f; };
  const ladder = (a, b) => { const out = []; let x = a, y = b; for (let p = 2; p <= Math.min(x, y);) { if (x % p === 0 && y % p === 0) { out.push(p); x /= p; y /= p; } else p++; } return { div: out, x, y }; };

  /* ---------- 一：零件拆解室（質數、質因數、短除法） ---------- */
  // 課綱：扣除 2、3、5 的次方後只剩一個因數，且只能是 7、11、13、17、19、49、77、91
  const TREE = [12, 18, 20, 24, 28, 30, 36, 40, 42, 44, 45, 48, 50, 52, 54, 56, 60, 63, 66, 68, 70, 72, 75, 76, 78, 84, 88, 90, 96, 98, 100, 104, 108, 110, 120];
  const TILE_THINGS = [{ ctx: '地磚', un: '塊', e: '🟫' }, { ctx: '太陽能板', un: '片', e: '🔆' }, { ctx: '貨箱', un: '個', e: '📦' }];
  const GCF_PAIRS = [[12, 18], [24, 36], [18, 30], [16, 24], [20, 30], [28, 42], [36, 54], [24, 40], [30, 45], [48, 60], [26, 39], [34, 51]];
  const LCM_PAIRS = [[6, 8], [8, 12], [12, 18], [10, 15], [9, 12], [6, 15], [14, 21], [16, 24], [20, 30], [12, 20], [15, 18], [18, 24]];
  const COP_PAIRS = [[8, 15], [9, 14], [14, 15], [16, 21], [25, 36], [9, 20], [12, 35], [10, 21], [12, 18], [14, 21], [15, 25], [16, 20], [21, 28], [26, 39]];
  function wrongTrees(n, pf) { // 看起來像、但裡面還有不是質數的零件
    const out = [];
    if (pf.length >= 3) { out.push([pf[0] * pf[1], ...pf.slice(2)]); out.push([...pf.slice(0, -2), pf[pf.length - 2] * pf[pf.length - 1]]); }
    if (pf.length === 2) { out.push([1, n]); out.push([pf[0], pf[1], 2]); }
    const uniq = [...new Set(out.map(a => a.join('×')))].filter(s => s !== pf.join('×'));
    return uniq.length >= 2 ? uniq.slice(0, 2) : [uniq[0] || `1×${n}`, `${pf.join('×')}×2`];
  }
  function genPrime(lv) {
    const t = pick(TILE_THINGS);
    if (lv <= 0) { const n = pick([7, 11, 13, 17, 19, 7, 11, 13, 12, 15, 16, 18, 20, 9, 14, 10]); return { kind: 'prime', mode: 'tile', ctx: t.ctx, thing: t, n, isP: isPrime(n), ans: isPrime(n) ? '只能排一長條' : '排得成長方形' }; }
    if (lv === 1) { const n = pick(TREE), pf = primeFactors(n), right = pf.join('×'); return { kind: 'prime', mode: 'tree', ctx: pick(['機器人', '引擎', '望遠鏡']), n, pf, right, options: shuffle([right, ...wrongTrees(n, pf)]) }; }
    if (lv === 2) { const c = pick([{ ctx: '螺絲', un: '顆', box: '包' }, { ctx: '電池', un: '個', box: '盒' }, { ctx: '燈泡', un: '顆', box: '箱' }]), k = pick([2, 5]), tens = ri(12, 99), one = k === 2 ? ri(0, 9) : pick([0, 5, 2, 3, 7, 5, 0]), n = tens * 10 + one; return { kind: 'prime', mode: 'by25', ctx: c.ctx, c, k, n, tens, one, ans: one % k === 0 ? '剛好裝完' : '會剩下' }; }
    if (lv === 3) { const c = pick([{ ctx: '螺絲', un: '顆', box: '包' }, { ctx: '電池', un: '個', box: '盒' }, { ctx: '能量棒', un: '根', box: '袋' }]), h = ri(1, 4), te = ri(0, 9), o = ri(0, 9), n = h * 100 + te * 10 + o, sum = h + te + o; return { kind: 'prime', mode: 'by3', ctx: c.ctx, c, n, h, te, o, sum, left: sum % 3, ans: sum % 3 }; }
    if (lv === 4) { const [a, b] = pick(GCF_PAIRS), L = ladder(a, b), c = pick([{ ctx: '分零件', say: `紅零件 ${a} 個、藍零件 ${b} 個，分裝成一樣的盒子，都不能剩。` }, { ctx: '裁板子', say: `長 ${a} 公分、寬 ${b} 公分的金屬板，裁成最大的正方形，不能剩。` }]); return { kind: 'prime', mode: 'gcf', ctx: c.ctx, say: c.say, a, b, ...L, ans: gcd(a, b) }; }
    if (lv === 5) { const [a, b] = pick(LCM_PAIRS), L = ladder(a, b), c = pick([{ ctx: '警示燈', say: `紅燈每 ${a} 秒亮一次，綠燈每 ${b} 秒亮一次，剛才一起亮。`, ask: '再過幾秒又一起亮？' }, { ctx: '接駁船', say: `甲船每 ${a} 分鐘出發一班，乙船每 ${b} 分鐘一班，剛才同時出發。`, ask: '再過幾分鐘又同時出發？' }]); return { kind: 'prime', mode: 'lcm', ctx: c.ctx, say: c.say, askText: c.ask, a, b, ...L, g: gcd(a, b), ans: lcm(a, b) }; }
    if (lv === 6) { const [a0, b0] = pick([[12, 18], [24, 36], [18, 42], [30, 45], [16, 40], [28, 42], [36, 48], [45, 60], [20, 32]]), [a, b] = Math.random() < .5 ? [a0, b0] : [a0, b0], L = ladder(a, b), c = pick([{ ctx: '燃料', say: `${b} 公升的燃料用掉 ${a} 公升` }, { ctx: '零件', say: `${b} 個零件裡有 ${a} 個檢查過` }]); return { kind: 'prime', mode: 'simp', ctx: c.ctx, say: c.say, a, b, ...L, sa: L.x, sn: L.y }; }
    const [a, b] = pick(COP_PAIRS), g = gcd(a, b), c = pick([{ ctx: '零件盒', say: `${a} 個紅零件和 ${b} 個藍零件要分裝成一樣的盒子` }, { ctx: '能量棒', say: `${a} 根巧克力棒和 ${b} 根花生棒要平分給幾位站員` }]);
    return { kind: 'prime', mode: 'coprime', ctx: c.ctx, say: c.say, a, b, g, ans: g === 1 ? '只有 1 這個公因數' : '還有別的公因數' };
  }

  /* ---------- 二：能量分裝站（分數的除法） ---------- */
  const FD_CTX = [{ ctx: '能量液', un: '公升', verb: '倒', box: '瓶', e: '🧪' }, { ctx: '緞帶', un: '公尺', verb: '剪', box: '段', e: '🎀' }, { ctx: '麵粉', un: '公斤', verb: '裝', box: '袋', e: '🌾' }];
  const UNLIKE = [[3, 4, 1, 8], [2, 3, 1, 6], [1, 2, 1, 8], [3, 5, 3, 10], [5, 6, 5, 12], [3, 4, 3, 8], [2, 3, 2, 9], [1, 3, 1, 12], [4, 5, 2, 15], [1, 2, 1, 6], [5, 8, 1, 16], [3, 4, 1, 12]];
  const PARTIAL = [[2, 3, 3, 4], [3, 4, 2, 3], [1, 2, 2, 3], [3, 5, 1, 2], [2, 5, 3, 4], [5, 6, 3, 4], [1, 3, 3, 4], [3, 4, 4, 5], [2, 3, 4, 5]].filter(([a, b, c, d]) => gcd(a * d, c * b) === 1);
  function genFdiv(lv) {
    const c = pick(FD_CTX), base = { kind: 'fdiv', ctx: c.ctx, c };
    if (lv <= 0) { const n = ri(2, 4), d = ri(2, 5); return { ...base, mode: 'whole', n, d, ans: n * d }; }
    if (lv === 1) { let n, d, a; do { n = ri(2, 6); d = pick([3, 4, 5, 6]); a = ri(2, d - 1); } while ((n * d) % a || gcd(a, d) !== 1 || n * d > 30); return { ...base, mode: 'intfrac', n, d, a, all: n * d, ans: n * d / a }; }
    if (lv === 2) { let d, a, b; do { d = ri(5, 12); b = ri(1, 3); a = b * ri(2, 4); } while (a >= d); return { ...base, mode: 'same', a, b, d, ans: a / b }; }
    if (lv === 3) { const [a, b, x, y] = pick(UNLIKE), D = lcm(b, y); return { ...base, mode: 'unlike', a, b, x, y, D, A: a * D / b, X: x * D / y, ans: (a * D / b) / (x * D / y) }; }
    if (lv === 4) { const [a, b, x, y] = pick(PARTIAL), D = lcm(b, y), A = a * D / b, X = x * D / y, [sa, sn] = simp(A, X); return { ...base, mode: 'partial', a, b, x, y, D, A, X, sa, sn }; }
    if (lv === 5) { const [X, Y] = pick([[2, 3], [2, 5], [3, 5], [3, 4], [2, 7], [3, 7], [4, 5]]), a = ri(1, 5), b = pick([2, 3, 4, 5, 7]); const [fa, fb] = simp(a, b); const [sa, sn] = simp(fa * Y, fb * X); return { ...base, mode: 'flip', a: fa, b: fb, x: X, y: Y, sa, sn }; }
    const N = pick([12, 18, 24, 30, 36]), f = pick([.5, .25, 2, 3, 1 / 3]); const label = f === .5 ? [1, 2] : f === .25 ? [1, 4] : f === 2 ? [2, 1] : f === 3 ? [3, 1] : [1, 3];
    return { ...base, mode: 'bigger', N, f: label, R: N * label[1] / label[0], ans: label[0] < label[1] ? '變大' : '變小' };
  }

  /* ---------- 三：精密裁切台（小數的除法） ---------- */
  const DD_CTX = [{ ctx: '緞帶', un: '公尺', small: '段', e: '🎀', verb: '剪' }, { ctx: '水管', un: '公尺', small: '根', e: '🚰', verb: '鋸' }, { ctx: '電線', un: '公尺', small: '條', e: '🔌', verb: '剪' }];
  function genDdiv(lv) {
    const c = pick(DD_CTX), base = { kind: 'ddiv', ctx: c.ctx, c };
    if (lv <= 0) { const [T, e] = pick([[3, .5], [4, .5], [6, .5], [3, .2], [2, .2], [6, .4], [4, .4], [2, .4], [6, .6], [3, .6], [9, .6], [4, .8], [8, .8], [6, .3], [3, .3], [7, .7]]); return { ...base, mode: 'cut', T, e, tenths: T * 10, et: dec(e * 10), ans: dec(T / e) }; }
    if (lv === 1) { const d = ri(2, 9), k = ri(2, 9), s = pick([{ ctx: '金屬條', from: '公分', to: '毫米', e: '📏' }, { ctx: '果汁', from: '公升', to: '杯（每杯 0.1 公升）', e: '🧃' }]); return { ...base, ctx: s.ctx, s, mode: 'shift', a: dec(d * k / 10), b: dec(d / 10), A: d * k, B: d, ans: k }; }
    if (lv === 2) { const [A, B] = pick([[125, 25], [150, 25], [120, 15], [175, 25], [36, 4], [96, 12], [132, 12], [144, 16], [75, 15], [64, 16]]), s = pick([{ ctx: '電線', un: '公尺', small: '條', e: '🔌' }, { ctx: '合金粉', un: '公斤', small: '包', e: '🥡' }]); return { ...base, ctx: s.ctx, s, mode: 'two', A, B, a: dec(A / 100), b: dec(B / 100), ans: A / B }; }
    if (lv === 3) { let D, q; do { D = pick([12, 14, 15, 16, 18, 21, 22, 24, 25, 28]); q = ri(21, 79); } while (q % 10 === 0 || D * q >= 1000 || D * q < 100); const N = D * q, head = Math.floor(N / 10), first = Math.floor(head / D), s = pick([{ ctx: '木板', un: '公尺', small: '塊', e: '🌲' }, { ctx: '白米', un: '公斤', small: '袋', e: '🌾' }]); return { ...base, ctx: s.ctx, s, mode: 'long', D, q, N, a: dec(N / 100), b: dec(D / 10), head, first, down: (head - first * D) * 10 + N % 10, ans: dec(q / 10) }; }
    const f = pick([.5, .2, .4, .6, 2, 1.5, .8]), N = pick({ .5: [6, 8, 12, 15], .2: [6, 8, 12], .4: [6, 8, 12], .6: [6, 12, 18], 2: [6, 8, 12, 18], 1.5: [6, 12, 15, 18], .8: [8, 12, 16] }[f]), s = pick([{ ctx: '緞帶', un: '公尺', e: '🎀' }, { ctx: '能量液', un: '公升', e: '🧪' }]);
    return { ...base, ctx: s.ctx, s, mode: 'bigger', N, f, R: dec(N / f), ans: f < 1 ? '比被除數大' : '比被除數小' };
  }

  /* ---------- 四：圓環艙（圓周長、圓面積） ---------- */
  const WHEELS = [{ ctx: '車輪', e: '🚲' }, { ctx: '呼拉圈', e: '⭕' }, { ctx: '水桶口', e: '🥛' }, { ctx: '圓形水池', e: '⛲' }];
  function genCircle(lv) {
    const c = pick(WHEELS), base = { kind: 'circle', ctx: c.ctx, c };
    if (lv <= 0) { const d1 = pick([10, 20, 30]), d2 = pick([40, 50, 60]); return { ...base, mode: 'pi', d1, d2, c1: dec(d1 * PI), c2: dec(d2 * PI), ans: 3 }; }
    if (lv === 1) { const useR = Math.random() < .4, d = pick([4, 6, 8, 10, 20, 30, 40, 50, 60, 100]); return { ...base, mode: 'circ', useR, d, r: d / 2, ans: dec(d * PI) }; }
    if (lv === 2) { const s = pick([{ ctx: '車輪', e: '🚲', go: '滾' }, { ctx: '月球車', e: '🚙', go: '滾' }, { ctx: '捲尺輪', e: '📏', go: '推' }]), d = pick([10, 20, 50, 100]), n = ri(2, 4); return { kind: 'circle', ctx: s.ctx, c: s, mode: 'wheel', d, n, one: dec(d * PI), ans: dec(d * PI * n) }; }
    if (lv === 3) { const s = pick([{ ctx: '圓形桌面', e: '🟤' }, { ctx: '圓形花圃', e: '🌼' }, { ctx: '圓艙地板', e: '⭕' }]), r = pick([1, 2, 3, 4, 5, 10]); return { kind: 'circle', ctx: s.ctx, c: s, mode: 'area', r, half: dec(r * PI), ans: dec(r * r * PI) }; }
    if (lv === 4) { const s = pick([{ ctx: '半圓形窗戶', e: '🏠' }, { ctx: '半圓形花圃', e: '🌼' }, { ctx: '半圓形舞台', e: '🎭' }]), d = pick([2, 4, 6, 8, 10, 20]); return { kind: 'circle', ctx: s.ctx, c: s, mode: 'half', d, arc: dec(d * PI / 2), ans: dec(d * PI / 2 + d) }; }
    const s = pick([{ ctx: '圓環步道', e: '🛤️' }, { ctx: '光環地墊', e: '⭕' }]), [R, r] = pick([[2, 1], [3, 1], [3, 2], [4, 2], [5, 3], [5, 4], [10, 5]]);
    return { kind: 'circle', ctx: s.ctx, c: s, mode: 'ring', R, r, big: dec(R * R * PI), small: dec(r * r * PI), ans: dec((R * R - r * r) * PI) };
  }

  /* ---------- 五：調色配方室（比和比值） ---------- */
  const MIXES = [
    { ctx: '顏料', A: '紅顏料', B: '藍顏料', un: '匙', ca: '#e0455a', cb: '#3b82c4', e: '🎨', what: '顏色' },
    { ctx: '果汁', A: '蜂蜜', B: '水', un: '杯', ca: '#e0a020', cb: '#9fd3f0', e: '🥤', what: '味道' },
    { ctx: '修補材料', A: '沙', B: '水泥', un: '桶', ca: '#d4b070', cb: '#7d8797', e: '🏗️', what: '硬度' },
  ];
  const copr = (lo, hi) => { let a, b; do { a = ri(lo, hi); b = ri(lo, hi); } while (a === b || gcd(a, b) !== 1); return [a, b]; };
  function genRatio(lv) {
    const c = pick(MIXES), base = { kind: 'ratio', ctx: c.ctx, c };
    if (lv <= 0) { const [a, b] = copr(1, 5), k = ri(2, 4); return { ...base, mode: 'mix', a, b, k, ans: b * k }; }
    if (lv === 1) { const [a, b] = copr(2, 7); const s = pick([{ ctx: c.ctx, kind2: '同類', A: c.A, B: c.B, un: c.un }, { ctx: '車子', kind2: '異類', A: '路程', B: '汽油', un: '', ua: '公里', ub: '公升' }, { ctx: '買東西', kind2: '異類', A: '價錢', B: '個數', un: '', ua: '元', ub: '個' }]); return { ...base, ctx: s.ctx, s, mode: 'rate', a, b }; }
    if (lv === 2) { const [a, b] = copr(1, 6), k = ri(2, 5), askBack = Math.random() < .5; return { ...base, mode: 'equal', a, b, k, askBack, ans: (askBack ? b : a) * k }; }
    if (lv === 3) { const a = ri(2, 5), m = pick([2, 3, 4, 5]), a2 = a + ri(1, 4); return { ...base, mode: 'vert', a, b: a * m, m, a2, ans: a2 * m }; }
    if (lv === 4) { const g = pick([2, 3, 4, 6]); const [x, y] = copr(2, 6); return { ...base, mode: 'simp', a: x * g, b: y * g, x, y, g }; }
    if (lv === 5) { const t = pick([[.6, .8, 3, 4, '小數', 10], [1.2, 1.8, 2, 3, '小數', 10], [.4, 1, 2, 5, '小數', 10], [1.5, .5, 3, 1, '小數', 10], [1 / 2, 1 / 3, 3, 2, '分數', [1, 2, 1, 3, 6]], [3 / 4, 2 / 3, 9, 8, '分數', [3, 4, 2, 3, 12]], [2 / 5, 1 / 2, 4, 5, '分數', [2, 5, 1, 2, 10]], [1 / 4, 5 / 6, 3, 10, '分數', [1, 4, 5, 6, 12]]]); return { ...base, mode: 'fd', a: t[0], b: t[1], x: t[2], y: t[3], sort: t[4], how: t[5] }; }
    if (lv === 6) { const [a, b] = copr(1, 7), k = ri(3, 8), s = pick([{ ctx: '分補給', say: '兩個站區按比分補給', A: '甲站', B: '乙站', un: '箱' }, { ctx: '分能量棒', say: '兩組按比分能量棒', A: '甲組', B: '乙組', un: '根' }]); return { ...base, ctx: s.ctx, s, mode: 'share', a, b, k, total: (a + b) * k, each: k, ans: a * k }; }
    const [a, b] = copr(2, 5), k = ri(2, 3), same = Math.random() < .5, a2 = a * k + (same ? 0 : pick([1, -1])), b2 = b * k;
    return { ...base, mode: 'same', a, b, k, a2, b2, ans: same ? '一樣' : '不一樣' };
  }

  /* ---------- 六：太陽能板廠（扇形） ---------- */
  const SECT = [{ ctx: '太陽能板', e: '🔆' }, { ctx: '扇子', e: '🎐' }, { ctx: '披薩', e: '🍕' }, { ctx: '雷達掃描區', e: '📡' }];
  const FRAC_DEG = [30, 45, 60, 72, 90, 120, 135, 150, 180, 240, 270];
  function genSector(lv) {
    const c = pick(SECT), base = { kind: 'sector', ctx: c.ctx, c };
    if (lv <= 0) { const d = pick(FRAC_DEG.filter(x => x % 15 === 0)), [a, n] = simp(d, 360); return { ...base, mode: 'frac', d, a, n }; }
    if (lv === 1) { const d = pick([60, 90, 120, 180, 30, 45]), r = d === 45 ? pick([4, 8]) : d === 30 ? pick([6, 12]) : pick([3, 6, 12]); const C = dec(2 * r * PI); return { ...base, mode: 'arc', d, r, C, ans: dec(C * d / 360) }; }
    if (lv === 2) { const [d, r] = pick([[60, 6], [90, 2], [90, 4], [90, 10], [120, 6], [180, 2], [180, 4], [180, 10], [45, 4], [60, 12], [120, 3]]), A = dec(r * r * PI), n = 360 / d; return { ...base, mode: 'area', d, r, A, n, ans: dec(A * d / 360) }; }
    if (lv === 3) { const r = pick([3, 6, 12]), d = pick([60, 90, 120]); const arc = dec(2 * r * PI * d / 360); return { ...base, mode: 'perim', r, d, arc, ans: dec(arc + 2 * r) }; }
    if (lv === 4) { const d = pick([90, 120, 180, 60]); const [a, n] = simp(d, 360); return { ...base, mode: 'three', d, a, n, ans: '三個比都一樣' }; }
    const s = pick([{ ctx: '分針', say: '分針走 15 分鐘掃過的地方', a: 1, n: 4 }, { ctx: '門打開', say: '自動門轉開一直角，掃過地面的範圍', a: 1, n: 4 }, { ctx: '雷達', say: '雷達掃了三分之一圓', a: 1, n: 3 }, { ctx: '風扇', say: '扇葉轉半圈掃過的範圍', a: 1, n: 2 }]), r = pick([6, 12]);
    return { kind: 'sector', ctx: s.ctx, c: s, mode: 'word', a: s.a, n: s.n, r, A: dec(r * r * PI), ans: dec(r * r * PI * s.a / s.n) };
  }

  /* ---------- 七：飛行跑道（速率） ---------- */
  const RACERS = [{ ctx: '太空船', a: '甲船', b: '乙船', e: '🚀', un: '公里', t: '小時' }, { ctx: '接駁車', a: '甲車', b: '乙車', e: '🚌', un: '公里', t: '小時' }, { ctx: '慢跑', a: '小紅', b: '小白', e: '🏃', un: '公尺', t: '分鐘' }];
  const SP_DIST = [{ ctx: '貨運飛船', e: '🚀', un: '公里', t: '小時', word: '時速', vs: [200, 240, 300, 360, 400, 500] }, { ctx: '電動車', e: '🚗', un: '公里', t: '小時', word: '時速', vs: [30, 40, 50, 60, 70, 80, 90] }, { ctx: '小朋友走路', e: '🚶', un: '公尺', t: '分鐘', word: '分速', vs: [50, 60, 70, 80] }];
  const sum = a => a.reduce((s, x) => s + x, 0);
  function genSpeed(lv) {
    const c = pick(RACERS), s = pick(SP_DIST);
    if (lv <= 0) { const t = ri(2, 4), v1 = ri(3, 9) * 10, v2 = v1 + pick([-20, -10, 10, 20]) * 1; return { kind: 'speed', ctx: c.ctx, c, mode: 'sameT', t, v1, v2, d1: v1 * t, d2: v2 * t, ans: v1 > v2 ? 'a' : 'b' }; }
    if (lv === 1) { const v1 = pick([20, 30, 40, 60]), v2 = pick([20, 30, 40, 60].filter(x => x !== v1)), d = lcm(v1, v2); return { kind: 'speed', ctx: c.ctx, c, mode: 'sameD', d, v1, v2, t1: d / v1, t2: d / v2, ans: v1 > v2 ? 'a' : 'b' }; }
    if (lv === 2) { const t = ri(2, 6), v = pick(s.vs); return { kind: 'speed', ctx: s.ctx, s, mode: 'rate', t, v, d: v * t, ans: v }; }
    if (lv === 3) { const t = ri(2, 6), v = pick(s.vs), back = Math.random() < .4; return { kind: 'speed', ctx: s.ctx, s, mode: 'dist', t, v, d: v * t, back, ans: back ? t : v * t }; }
    if (lv === 4) { const v = pick(s.vs), t = ri(2, 4), m = ri(2, 3), sort = pick(['time', 'speed']); return { kind: 'speed', ctx: s.ctx, s, mode: 'prop', v, t, m, sort, d: v * t, ans: v * t * m }; }
    if (lv === 5) { const u = pick([{ ctx: '高鐵', e: '🚄', big: 300, step: 'h2m' }, { ctx: '飛船', e: '🚀', big: 120, step: 'h2m' }, { ctx: '汽車', e: '🚗', big: 60, step: 'h2m' }, { ctx: '公車', e: '🚌', big: 36, step: 'h2m' }]); const min = dec(u.big * 1000 / 60); return { kind: 'speed', ctx: u.ctx, u, mode: 'unit', big: u.big, meters: u.big * 1000, ans: min }; }
    const t1 = ri(1, 3), t2 = ri(1, 3), v1 = pick(s.vs), tot = t1 + t2; let v2 = pick(s.vs); while ((v1 * t1 + v2 * t2) % tot || v2 === v1) v2 += 10;
    return { kind: 'speed', ctx: s.ctx, s, mode: 'avg', t1, t2, v1, v2, d1: v1 * t1, d2: v2 * t2, D: v1 * t1 + v2 * t2, T: tot, ans: (v1 * t1 + v2 * t2) / tot };
  }

  /* ---------- 八：數據中心（數量關係） ---------- */
  const SUMS = [{ ctx: '晝夜', A: '晝長', B: '夜長', un: '小時', tot: 24, lo: 8, hi: 16 }, { ctx: '兩個水箱', A: '甲箱', B: '乙箱', un: '公升', tot: 30, lo: 5, hi: 25 }, { ctx: '男女生', A: '男生', B: '女生', un: '人', tot: 28, lo: 8, hi: 20 }];
  const DIFFS = [{ ctx: '年齡', A: '哥哥', B: '弟弟', un: '歲', lo: 1, hi: 12 }, { ctx: '水位', A: '甲槽水位', B: '乙槽水位', un: '公分', lo: 1, hi: 15 }];
  const EACHS = [{ ctx: '買電池', A: '盒數', B: '總價', one: '每盒', un1: '盒', un2: '元', eachs: [20, 25, 30, 40, 50] }, { ctx: '行走', A: '分鐘', B: '路程', one: '每分鐘', un1: '分鐘', un2: '公尺', eachs: [50, 60, 70, 80] }, { ctx: '倒水', A: '杯數', B: '水量', one: '每杯', un1: '杯', un2: '毫升', eachs: [150, 200, 250] }];
  const SEATS = [{ ctx: '併桌子', one: '桌子', un: '張', got: '座位', gun: '個', head: 4, add: 2 }, { ctx: '火柴排三角形', one: '三角形', un: '個', got: '火柴', gun: '根', head: 3, add: 2 }, { ctx: '火柴排正方形', one: '正方形', un: '個', got: '火柴', gun: '根', head: 4, add: 3 }];
  const WRITE = [
    { ctx: '晝夜', say: '一天裡，晝長和夜長合起來是 24 小時。', slots: ['晝長', '＋', '夜長', '＝', '24'], tokens: ['晝長', '夜長', '＋', '×', '＝', '24', '60'] },
    { ctx: '買東西', say: '每枝筆 12 元，買的枝數乘起來就是總價。', slots: ['12', '×', '枝數', '＝', '總價'], tokens: ['12', '枝數', '總價', '×', '＋', '＝', '1'] },
    { ctx: '年齡', say: '哥哥永遠比弟弟大 3 歲。', slots: ['哥哥', '－', '弟弟', '＝', '3'], tokens: ['哥哥', '弟弟', '－', '×', '＝', '3', '10'] },
    { ctx: '航線', say: '飛船的時速 200 公里，飛的時間決定路程。', slots: ['200', '×', '時間', '＝', '路程'], tokens: ['200', '時間', '路程', '×', '＋', '＝', '60'] },
    { ctx: '水箱', say: '水箱本來有 5 公升，每分鐘加 2 公升。加的分鐘數和水量的關係：', slots: ['5', '＋', '2×□', '＝', '○'], tokens: ['5', '2×□', '○', '＋', '×', '＝', '60'] },
    { ctx: '併桌', say: '□ 張桌子併一排，○ 個座位。頭尾各 1 個座位，每張桌子上下 2 個。', slots: ['2', '＋', '2×□', '＝', '○'], tokens: ['2', '2×□', '○', '＋', '－', '＝', '100'] },
  ];
  function genRelation(lv) {
    if (lv <= 0) { const s = pick(SUMS), x = ri(s.lo, s.hi), t = ri(s.lo, s.hi); return { kind: 'relation', mode: 'sum', ctx: s.ctx, s, x, t, ans: s.tot - t, options: shuffle([`${s.A}＋${s.B}＝${s.tot}`, `${s.A}×${s.B}＝${s.tot}`, `${s.A}－${s.B}＝${s.tot}`]), right: `${s.A}＋${s.B}＝${s.tot}` }; }
    if (lv === 1) { const s = pick(DIFFS), gap = ri(2, 7), t = ri(s.hi + 3, s.hi + 15); return { kind: 'relation', mode: 'diff', ctx: s.ctx, s, gap, t, ans: t + gap, right: `${s.A}－${s.B}＝${gap}`, options: shuffle([`${s.A}－${s.B}＝${gap}`, `${s.A}＋${s.B}＝${gap}`, `${s.A}×${gap}＝${s.B}`]) }; }
    if (lv === 2) { const s = pick(EACHS), each = pick(s.eachs), t = ri(6, 12); return { kind: 'relation', mode: 'each', ctx: s.ctx, s, each, t, ans: each * t, right: `${each}×${s.A}＝${s.B}`, options: shuffle([`${each}×${s.A}＝${s.B}`, `${each}＋${s.A}＝${s.B}`, `${s.A}－${each}＝${s.B}`]) }; }
    if (lv === 3) { const s = pick(SEATS), t = pick([10, 12, 15, 20]); return { kind: 'relation', mode: 'seat', ctx: s.ctx, s, t, f: n => s.head + s.add * (n - 1), ans: s.head + s.add * (t - 1) }; }
    if (lv === 4) { const w = pick(WRITE); return { kind: 'relation', mode: 'write', ctx: w.ctx, w, tokens: shuffle(w.tokens) }; }
    const s = pick([{ ctx: '電池盒', e: '🔋', box: '盒電池', un: '個' }, { ctx: '零件袋', e: '🔩', box: '袋螺絲', un: '顆' }]), n = ri(2, 4), each = ri(3, 8), extra = ri(2, 9);
    return { kind: 'relation', mode: 'balance', ctx: s.ctx, s, n, each, extra, right: n * each + extra, rest: n * each, ans: each };
  }

  /* ---------- 九：物資調度台（四則混合） ---------- */
  const F = (a, n) => ({ a, n, v: a / n, t: `${a}/${n}` }), Dn = x => ({ v: x, t: String(x) });
  function orderBank() {
    const t = pick(['a+bc', 'a-bc', 'ab+c', 'a/b-c', '(a+b)c', 'a+b/c']);
    if (t === 'a+bc') { const a = pick([.5, 1.5, 2.5, 3]), [b, c] = pick([[F(1, 2), 4], [F(1, 4), 8], [F(3, 4), 4], [Dn(.5), 6], [Dn(1.5), 4], [Dn(.25), 8]]); return { toks: [Dn(a), '＋', b, '×', Dn(c)], first: 3, mid: dec(b.v * c), ans: dec(a + b.v * c) }; }
    if (t === 'a-bc') { const a = pick([6, 8, 10, 7.5]), [b, c] = pick([[F(1, 2), 4], [F(1, 4), 8], [Dn(.5), 6], [Dn(1.5), 4], [Dn(.2), 10]]); return { toks: [Dn(a), '－', b, '×', Dn(c)], first: 3, mid: dec(b.v * c), ans: dec(a - b.v * c) }; }
    if (t === 'ab+c') { const [a, b] = pick([[F(3, 4), 8], [F(2, 5), 10], [Dn(1.2), 5], [Dn(2.5), 4]]), c = pick([.5, 1.5, 2]); return { toks: [a, '×', Dn(b), '＋', Dn(c)], first: 1, mid: dec(a.v * b), ans: dec(a.v * b + c) }; }
    if (t === 'a/b-c') { const [a, b] = pick([[4.2, .6], [3.6, .4], [2.4, .3], [6, F(1, 2)], [9, F(3, 4)]]), c = pick([1, 1.5, 2]), bb = typeof b === 'number' ? Dn(b) : b; return { toks: [Dn(a), '÷', bb, '－', Dn(c)], first: 1, mid: dec(a / bb.v), ans: dec(a / bb.v - c) }; }
    if (t === '(a+b)c') { const [a, b] = pick([[2.4, 1.6], [1.5, 2.5], [.7, .3], [3.2, .8]]), c = pick([F(1, 2), F(1, 4), Dn(.5), Dn(1.5)]); return { toks: ['（', Dn(a), '＋', Dn(b), '）', '×', c], first: 2, mid: dec(a + b), ans: dec((a + b) * c.v) }; }
    const a = pick([1, 2, .5]), [b, c] = pick([[1.2, .4], [.9, .3], [F(1, 2), F(1, 8)], [F(3, 4), F(1, 4)], [2.5, .5]]), bb = typeof b === 'number' ? Dn(b) : b, cc = typeof c === 'number' ? Dn(c) : c;
    return { toks: [Dn(a), '＋', bb, '÷', cc], first: 3, mid: dec(bb.v / cc.v), ans: dec(a + bb.v / cc.v) };
  }
  const CANCEL = [[2.4, 5, 6, .4, 5], [1.5, 2, 3, .5, 2], [.6, 5, 3, .25, 4], [3.6, 5, 9, .5, 4], [1.2, 5, 6, .2, 5], [4.5, 2, 9, .5, 2], [1.6, 3, 4, .3, 4], [2.5, 4, 5, .5, 4]];
  const FD_EQ = [[.5, 1, 2], [.25, 1, 4], [.75, 3, 4], [.2, 1, 5], [.4, 2, 5], [.6, 3, 5], [.8, 4, 5], [.125, 1, 8]];
  const WORD3 = [
    n => { const [v, k, p] = pick([[.6, 4, 2], [.6, 5, 2], [.6, 5, 3], [.8, 4, 2], [.8, 5, 4], [1.2, 4, 3], [1.2, 5, 2], [1.2, 5, 4], [.6, 4, 3]]); return { ctx: '分果汁', say: `每瓶果汁 ${v} 公升，${k} 瓶倒在一起，平分給 ${p} 組。`, ask: ['全部有幾公升？', '每組幾公升？'], steps: [dec(v * k), dec(v * k / p)], how: `每瓶量×瓶數，再÷組數`, bars: [k, p] }; },
    n => { const a = pick([3, 5]), d = pick([4, 8]), p = pick([2, 3, 4, 6].filter(x => (a * 8) % x === 0)); return { ctx: '分緞帶', say: `每條緞帶 ${a}/${d} 公尺，買 ${d} 條接起來，平分成 ${p} 段。`, ask: ['全部幾公尺？', '每段幾公尺？'], steps: [a, dec(a / p)], how: `每條長×條數，再÷段數`, bars: [d, p] }; },
    n => { const v = pick([12.5, 7.5, 2.5]), k = pick([4, 6, 8]), m = 100; return { ctx: '找錢', say: `每份補給 ${v} 元，買 ${k} 份，付 ${m * 2} 元。`, ask: ['一共要付幾元？', '找回幾元？'], steps: [dec(v * k), dec(m * 2 - v * k)], how: `每份價錢×份數，再從付的錢扣掉`, bars: [k, 2] }; },
  ];
  function genMix(lv) {
    if (lv <= 0) { const o = orderBank(), c = pick(['分配物資', '算補給單', '整理貨單']); return { kind: 'mix', mode: 'order', ctx: c, ...o }; }
    if (lv === 1) { const [d, a, n] = pick(FD_EQ), c = pick([{ ctx: '量果汁', un: '公升', e: '🧃' }, { ctx: '量鋼條', un: '公尺', e: '📏' }]), toF = Math.random() < .5; return { kind: 'mix', mode: 'fdeq', ctx: c.ctx, c, d, a, n, toF, ...(toF ? {} : { ans: d }) }; }
    if (lv === 2) { const [x, a, n, y, ans] = pick(CANCEL), c = pick([{ ctx: '分裝粉末', un: '公斤', box: '包' }, { ctx: '裁鋼條', un: '公尺', box: '段' }]); return { kind: 'mix', mode: 'cancel', ctx: c.ctx, c, x, a, n, y, ans }; }
    if (lv === 3) { const w = pick(WORD3)(); return { kind: 'mix', mode: 'word', ...w }; }
    if (lv === 4) { const c = pick([{ ctx: '採買', thing: '能量棒', un: '元', e: '🍫', sh: '盒' }, { ctx: '運貨', thing: '貨箱', un: '公斤', e: '📦', sh: '箱' }]), a = pick([198, 203, 297, 305, 402, 498]), n = pick([19, 21, 29, 31, 39, 41]), A = Math.round(a / 100) * 100, B = Math.round(n / 10) * 10, have = A * B + pick([-1000, 1000, 2000]) * 1; return { kind: 'mix', mode: 'est', ctx: c.ctx, c, a, n, A, B, est: A * B, have, ans: have >= A * B + 500 ? '夠' : '不夠' }; }
    const c = pick([{ ctx: '分配律：緞帶', un: '公尺', thing: '條緞帶' }, { ctx: '分配律：能量液', un: '公升', thing: '瓶能量液' }]), n = pick([5, 7, 9, 10, 8]), a = ri(1, n - 1), b = n - a, f = pick([F(3, 4), F(2, 5), Dn(.6), Dn(1.5), F(5, 8)]);
    return { kind: 'mix', mode: 'dist', ctx: c.ctx, c, n, a, b, f: { t: f.t, v: f.v, a: f.a, n: f.n }, ans: dec(f.v * n) };
  }

  /* ---------- 十：燃料槽工廠（柱體） ---------- */
  const TANKS = [{ ctx: '燃料槽', e: '🛢️' }, { ctx: '蛋糕', e: '🎂' }, { ctx: '積木塔', e: '🧱' }];
  function genPrism(lv) {
    const c = pick(TANKS), base = { kind: 'prism', ctx: c.ctx, c };
    if (lv <= 0) { const a = ri(2, 5), b = ri(2, 4), h = ri(3, 6); return { ...base, mode: 'stack', a, b, h, base2: a * b, ans: a * b * h }; }
    if (lv === 1) { const s = pick([{ ctx: '三角形屋頂', e: '⛺' }, { ctx: '三明治', e: '🥪' }, { ctx: '起司塊', e: '🧀' }]), w = pick([4, 6, 8, 10]), d = pick([3, 5, 6]), h = ri(4, 9); return { ...base, ctx: s.ctx, c: s, mode: 'tri', w, d, h, whole: w * d, base2: w * d / 2, ans: w * d * h / 2 }; }
    if (lv === 2) { const s = pick([{ ctx: '圓柱燃料槽', e: '🛢️' }, { ctx: '罐頭', e: '🥫' }, { ctx: '圓蛋糕', e: '🎂' }]), r = pick([1, 2, 3, 5, 10]), h = pick([2, 3, 4, 5, 10]); return { ...base, ctx: s.ctx, c: s, mode: 'cyl', r, h, base2: dec(r * r * PI), ans: dec(r * r * PI * h) }; }
    if (lv === 3) { const s = pick([{ ctx: '罐頭標籤', e: '🥫', what: '標籤' }, { ctx: '燃料槽外皮', e: '🛢️', what: '外皮' }]), d = pick([2, 4, 6, 10, 20]), h = pick([5, 10, 12]); const C = dec(d * PI), side = dec(C * h), one = dec(d * d * PI / 4); return { ...base, ctx: s.ctx, c: s, mode: 'net', d, r: d / 2, h, C, side, one, ans: dec(side + 2 * one) }; }
    if (lv === 4) { const s = pick([{ ctx: '油漆箱子', e: '📦', sort: 'rect' }, { ctx: '包裝三角柱', e: '🎁', sort: 'tri' }]); if (s.sort === 'rect') { const a = ri(3, 6), b = ri(2, 5), h = ri(3, 7); return { ...base, ctx: s.ctx, c: s, mode: 'surf', sort: 'rect', a, b, h, two: 2 * a * b, side: 2 * (a + b) * h, ans: 2 * a * b + 2 * (a + b) * h }; } const [a, b, cc] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13]]), h = ri(3, 6); return { ...base, ctx: s.ctx, c: s, mode: 'surf', sort: 'tri', a, b, cc, h, two: a * b, side: (a + b + cc) * h, ans: a * b + (a + b + cc) * h }; }
    const hollow = Math.random() < .5;
    if (hollow) { const a = pick([4, 5, 6]), b = pick([4, 5, 6]), H = ri(3, 6), x = ri(1, 2), y = ri(1, 2); return { ...base, ctx: pick(['挖洞的積木', '挖空的零件']), mode: 'comp', hollow, a, b, H, x, y, p1: a * b * H, p2: x * y * H, ans: a * b * H - x * y * H }; }
    const a = ri(3, 6), b = ri(2, 4), h1 = ri(2, 4), x = ri(1, a - 1), y = b, h2 = ri(1, 3);
    return { ...base, ctx: pick(['兩層平台', '階梯零件']), mode: 'comp', hollow, a, b, h1, x, y, h2, p1: a * b * h1, p2: x * y * h2, ans: a * b * h1 + x * y * h2 };
  }

  /* ---------- 十一：補給比較室（基準量、比較量） ---------- */
  const COMP = [
    { ctx: '身高', A: '哥哥', B: '弟弟', un: '公分', lo: 20, per: [20] },
    { ctx: '補給', A: '甲艙', B: '乙艙', un: '箱', lo: 5, per: [4, 6, 8, 10] },
    { ctx: '零用錢', A: '姐姐', B: '妹妹', un: '元', lo: 20, per: [5, 10, 20] },
  ];
  function genBase(lv) {
    const c = lv <= 1 ? pick(COMP) : pick(COMP.slice(1)), tall = c.ctx === '身高', base = { kind: 'base', ctx: c.ctx, c };
    if (lv <= 0) { const [a, b] = tall ? copr(6, 9) : copr(2, 8), k = pick(c.per), baseA = Math.random() < .5; return { ...base, mode: 'read', a, b, k, A: a * k, B: b * k, baseA, sa: baseA ? b : a, sn: baseA ? a : b }; }
    if (lv === 1) { const [a, b] = tall ? copr(6, 9) : copr(2, 7), k = pick(c.per); return { ...base, mode: 'swap', a, b, k, A: a * k, B: b * k }; }
    if (lv === 2) { const [p, d] = pick([[3, 5], [2, 3], [3, 4], [4, 5], [5, 4], [3, 2], [7, 10]]), each = ri(4, 12) * 5; return { ...base, mode: 'cmp', p, d, each, B: d * each, ans: p * each }; }
    if (lv === 3) { const [p, d] = pick([[3, 5], [2, 3], [3, 4], [4, 5], [5, 4], [3, 2]]), each = ri(4, 12) * 5; return { ...base, mode: 'findbase', p, d, each, part: p * each, ans: d * each }; }
    const s = pick([{ ctx: '打折', A: '定價', B: '特價', un: '元', sign: -1 }, { ctx: '增產', A: '上個月', B: '這個月', un: '公斤', sign: 1 }]), [p, d] = pick([[1, 4], [1, 5], [1, 2], [2, 5], [3, 10]]), each = ri(2, 12) * 10;
    return { ...base, ctx: s.ctx, c: { ...s, un: s.un }, mode: 'change', p, d, each, B: d * each, sign: s.sign, ans: (d + s.sign * p) * each, pct: p / d * 100 };
  }

  /* ---------- 十二：星圖繪製室（放大、縮小、比例尺） ---------- */
  const PICS = [{ ctx: '星圖', e: '🌌' }, { ctx: '照片', e: '🖼️' }, { ctx: '站徽', e: '🛡️' }];
  const SHAPES = ['rect', 'tri', 'circle'];
  const MAP_CTX = [{ ctx: '月球地圖', A: '基地', B: '火山口' }, { ctx: '城市地圖', A: '學校', B: '車站' }, { ctx: '航線圖', A: '補給站', B: '太空站' }];
  function genScale(lv) {
    const c = pick(PICS), base = { kind: 'scale', ctx: c.ctx, c };
    if (lv <= 0) { const a = ri(2, 5), b = ri(2, 4), k = ri(2, 4); return { ...base, mode: 'zoom', a, b, k, A: a * k, B: b * k, ans: a * k }; }
    if (lv === 1) { const sh = pick(SHAPES), k = ri(2, 3); return { ...base, mode: 'keep', sh, k, ang: sh === 'tri' ? 60 : 90, ans: sh === 'circle' ? '還是圓' : '角不變，邊變 ' + k + ' 倍', right: sh === 'circle' ? '還是圓' : '角不變，邊變 ' + k + ' 倍', options: sh === 'circle' ? ['還是圓', '變成橢圓', '變成正方形'] : shuffle([`角不變，邊變 ${k} 倍`, `角和邊都變 ${k} 倍`, `邊不變，角變 ${k} 倍`]) }; }
    if (lv === 2) { const a = ri(2, 4), b = ri(2, 3), k = ri(2, 3); const opts = shuffle([{ w: a * k, h: b * k, ok: true }, { w: a * k, h: b * k + 1, ok: false }, { w: a * k + k, h: b, ok: false }]); return { ...base, mode: 'which', a, b, k, opts, ans: opts.findIndex(o => o.ok) }; }
    if (lv === 3) { const k = pick([2, 3, 4]), a = ri(2, 5) * k, b = ri(2, 4) * k; return { ...base, mode: 'shrink', a, b, k, A: a / k, B: b / k, ans: a / k }; }
    const m = pick(MAP_CTX);
    if (lv === 4) { const cm = ri(2, 8), per = pick([2, 5, 10, 50]); return { kind: 'scale', mode: 'ruler', ctx: m.ctx, m, cm, per, ans: cm * per }; }
    if (lv === 5) { const n = pick([10000, 20000, 50000, 100000]), cm = ri(2, 7), meters = n / 100 * cm; return { kind: 'scale', mode: 'mapn', ctx: m.ctx, m, n, cm, one: n / 100, ans: meters }; }
    if (lv === 6) { const [n1, n2] = shuffle([10000, 50000]), real = 500 * ri(2, 4); return { kind: 'scale', mode: 'mis', ctx: m.ctx, m, n1, n2, real, cm1: real * 100 / n1, cm2: real * 100 / n2, ans: n1 < n2 ? '左邊' : '右邊' }; }
    const [n1, n2] = pick([[10000, 20000], [10000, 50000], [20000, 40000], [10000, 40000]]), cm = pick([2, 3, 4, 6]) * (n2 / n1);
    return { kind: 'scale', mode: 'twomap', ctx: m.ctx, m, n1, n2, cm, real: n1 * cm / 100, ans: n1 * cm / n2 };
  }

  /* ---------- 十三：任務解謎室 ---------- */
  const HEN = [{ ctx: '雞兔', A: '雞', B: '兔', ea: '🐔', eb: '🐰', la: 2, lb: 4, part: '腳', un: '隻' }, { ctx: '兩輪車和四輪車', A: '兩輪車', B: '四輪車', ea: '🛵', eb: '🚗', la: 2, lb: 4, part: '輪子', un: '輛' }, { ctx: '三腳架和四腳桌', A: '三腳架', B: '四腳桌', ea: '📷', eb: '🪑', la: 3, lb: 4, part: '腳', un: '個' }];
  const SD = [{ ctx: '兩箱補給', A: '甲箱', B: '乙箱', un: '公斤' }, { ctx: '兩人存錢', A: '哥哥', B: '弟弟', un: '元' }];
  const CHASE = [{ ctx: '飛船追趕', A: '貨船', B: '快船', un: '公里', t: '分鐘', e: '🚀' }, { ctx: '操場追趕', A: '弟弟', B: '哥哥', un: '公尺', t: '分鐘', e: '🏃' }];
  const STREAM = [{ ctx: '河上的船', e: '🚤', flow: '水流', un: '公里', t: '小時' }, { ctx: '逆風的飛船', e: '🚀', flow: '太陽風', un: '公里', t: '小時' }];
  const OUTFIT = [{ ctx: '搭衣服', a: '上衣', b: '裙子', ua: '件', ub: '件', ea: '👕', eb: '👗' }, { ctx: '配套餐', a: '主餐', b: '飲料', ua: '種', ub: '種', ea: '🍱', eb: '🥤' }, { ctx: '選航線', a: '去程', b: '回程', ua: '條', ub: '條', ea: '🚀', eb: '🛸' }];
  function genPuzzle(lv) {
    if (lv <= 0) { const h = pick(HEN), n = ri(6, 10), b = ri(2, n - 2); return { kind: 'puzzle', mode: 'hen', ctx: h.ctx, h, n, b, a: n - b, legs: (n - b) * h.la + b * h.lb, all: n * h.la, gap: h.lb - h.la, ans: b }; }
    if (lv === 1) { const s = pick(SD), small = ri(4, 12) * (s.un === '元' ? 10 : 1), d = ri(2, 6) * (s.un === '元' ? 10 : 1); return { kind: 'puzzle', mode: 'sumdiff', ctx: s.ctx, s, small, d, big: small + d, total: 2 * small + d, ans: small }; }
    if (lv === 2) { const s = pick([{ ctx: '爸爸和小孩', A: '爸爸', B: '小孩' }, { ctx: '老師和學生', A: '老師', B: '學生' }]), m = pick([3, 4]), now = ri(5, 10), yrs = ri(2, 6), gap = (m - 1) * (now + yrs); return { kind: 'puzzle', mode: 'age', ctx: s.ctx, s, m, now, gap, B: now + gap, yrs, later: now + yrs, ans: now + yrs }; }
    if (lv === 3) { const s = pick(CHASE), v1 = pick([40, 50, 60]), v2 = v1 + pick([10, 20, 30]), t = ri(3, 6), head = (v2 - v1) * t; return { kind: 'puzzle', mode: 'chase', ctx: s.ctx, s, v1, v2, head, close: v2 - v1, ans: t }; }
    if (lv === 4) { const s = pick(STREAM), v = ri(4, 12) * 5, f = pick([5, 10]), t = ri(2, 4), up = Math.random() < .5; return { kind: 'puzzle', mode: 'stream', ctx: s.ctx, s, v, f, t, up, speed: up ? v - f : v + f, ans: (up ? v - f : v + f) * t }; }
    if (lv === 5) { const o = pick(OUTFIT), a = ri(2, 4), b = ri(2, 5); return { kind: 'puzzle', mode: 'count', ctx: o.ctx, o, a, b, ans: a * b }; }
    const c = lv === 6 ? pick([{ ctx: '排號碼', sort: 'odd' }, { ctx: '排門牌', sort: 'odd' }]) : pick([{ ctx: '選午餐', sort: 'add' }, { ctx: '選社團', sort: 'add' }]);
    if (c.sort === 'add') { const a = ri(2, 5), b = ri(2, 4), A = c.ctx === '選午餐' ? ['中式便當', '西式套餐'] : ['球類社', '音樂社']; return { kind: 'puzzle', mode: 'addc', ctx: c.ctx, A, a, b, ans: a + b }; }
    const three = Math.random() < .5, digits = [1, 2, 3], odd = digits.filter(d => d % 2);
    return { kind: 'puzzle', mode: 'odd', ctx: c.ctx, digits, odd, three, ten: digits.length, ans: three ? digits.length * digits.length * odd.length : digits.length * odd.length };
  }

  /* ---------- 十四：民意觀測站（圓形圖；可能性是延伸，南一目錄只列圓形圖） ---------- */
  const POLLS = [
    { ctx: '最想去的星球', total: [200, 300, 400, 500], parts: [['月球', 40], ['火星', 35], ['土星', 25]] },
    { ctx: '午餐票選', total: [100, 200, 400], parts: [['麵', 50], ['飯', 30], ['餃子', 20]] },
    { ctx: '零用錢怎麼花', total: [200, 500, 1000], parts: [['存起來', 45], ['買書', 30], ['零食', 25]] },
    { ctx: '上學的方式', total: [200, 300, 600], parts: [['走路', 55], ['腳踏車', 25], ['搭車', 20]] },
  ];
  const WHICHC = [
    { ctx: '票選', t: '全班 30 人最喜歡的水果，各占全班的多少', a: '圓形圖', why: '要看每一部分占全部多少，部分合起來是全部，用圓形圖。' },
    { ctx: '花錢', t: '這個月的零用錢，各種花費占多少', a: '圓形圖', why: '花費的部分合起來就是全部，用圓形圖最看得出比例。' },
    { ctx: '氣溫', t: '一天裡每 2 小時的氣溫怎麼變', a: '折線圖', why: '同一個東西跟著時間變，看上升下降，用折線圖。' },
    { ctx: '身高', t: '一棵樹每個月長多高', a: '折線圖', why: '跟著時間變，用折線圖。' },
    { ctx: '班級', t: '五個班各借了幾本書，哪班最多', a: '長條圖', why: '比較不同的班各有多少，又不是占全部多少，用長條圖。' },
    { ctx: '動物', t: '四種動物各能活幾年', a: '長條圖', why: '分開的東西比多少，用長條圖；加起來也沒有意義。' },
  ];
  const LIKELY = [
    { ctx: '轉盤', say: '一個轉盤每次都用一樣的方法轉，轉了 30 次的記錄', A: '紅色', a: 27, B: '綠色', b: 1, C: '藍色', c: 2 },
    { ctx: '抽球', say: '袋中球的大小、材質相同，每次搖勻、不看，抽 1 顆記錄後放回，共抽 50 次的記錄', A: '紅球', a: 44, B: '藍球', b: 1, C: '黃球', c: 5 },
    { ctx: '抽卡', say: '盒中卡片大小相同，每次洗勻、不看，抽 1 張記錄後放回，共抽 40 次的記錄', A: '星星卡', a: 36, B: '太陽卡', b: 1, C: '月亮卡', c: 3 },
  ];
  function genPie(lv) {
    const p = pick(POLLS);
    if (lv <= 0) { const i = ri(0, 2), tot = pick(p.total); return { kind: 'pie', mode: 'read', ctx: p.ctx, parts: p.parts, i, tot, pct: p.parts[i][1], ans: tot * p.parts[i][1] / 100 }; }
    if (lv === 1) return { kind: 'pie', mode: 'make', ctx: p.ctx, parts: p.parts };
    if (lv === 2) { const tot = pick([20, 25, 50]), n = ri(1, tot - 1) * (tot === 20 ? 1 : 1), s = pick([{ ctx: '問卷', who: '人', say: '人喜歡' }, { ctx: '零件檢查', who: '個', say: '個合格' }]); return { kind: 'pie', mode: 'pct', ctx: s.ctx, s, tot, n, times: 100 / tot, ans: n * 100 / tot }; }
    if (lv === 3) { const w = pick(WHICHC); return { kind: 'pie', mode: 'which', ctx: w.ctx, ...w }; }
    const L = pick(LIKELY), ty = pick(['most', 'least', 'cmp']); const tot = L.a + L.b + L.c;
    return { kind: 'pie', mode: 'likely', ctx: L.ctx, L, ty, tot, right: ty === 'most' ? `很有可能是${L.A}` : ty === 'least' ? `很不可能是${L.B}` : `${L.A}比${L.C}可能`, options: ty === 'most' ? shuffle([`很有可能是${L.A}`, `很有可能是${L.B}`, `很有可能是${L.C}`]) : ty === 'least' ? shuffle([`很不可能是${L.B}`, `很不可能是${L.A}`]) : shuffle([`${L.A}比${L.C}可能`, `${L.C}比${L.A}可能`]) };
  }

  /* ---------- 單位的生活例子（皆為大約值） ---------- */
  const FACTOR = { 公分: 1, 公尺: 100, 公里: 100000, 秒速: 60, 分速: 1, 時速: 1000 / 60, 立方公分: 1, 公升: 1000, 立方公尺: 1000000 };
  const fmtU = x => x.u === '時速' ? `時速 ${x.v} 公里` : x.u === '分速' || x.u === '秒速' ? `${x.u} ${x.v} 公尺` : `${x.v} ${x.u}`;
  const it = (e, name, dim, v, u) => ({ e, name, dim, v, u, base: v * FACTOR[u] });
  const ITEMS = {
    dist: [it('✏️', '一枝鉛筆', '多長', 18, '公分'), it('🪑', '課桌的寬', '多長', 60, '公分'), it('🏫', '教室的長', '多長', 9, '公尺'), it('🏃', '操場一圈', '多長', 200, '公尺'), it('🚶', '用一般步速走 15 分鐘的路', '多遠', 1, '公里'), it('🚄', '臺北到高雄', '多遠', 350, '公里')],
    spd: [it('🚶', '小朋友走路', '多快', 60, '分速'), it('🏃', '小朋友快跑', '多快', 5, '秒速'), it('🚴', '騎腳踏車', '多快', 15, '時速'), it('🚗', '高速公路的汽車', '多快', 100, '時速'), it('🚄', '高鐵', '多快', 300, '時速'), it('🔊', '聲音', '多快', 340, '秒速')],
    vol: [it('🎲', '一顆小骰子', '多大', 1, '立方公分'), it('🥫', '一個罐頭', '多大', 300, '立方公分'), it('🍼', '一大瓶牛奶', '多少', 2, '公升'), it('🛁', '一缸洗澡水', '多少', 200, '公升'), it('📦', '一個大貨櫃', '多大', 30, '立方公尺')],
  };
  const UNITS_OF = { dist: ['公分', '公尺', '公里'], spd: ['分速', '秒速', '時速'], vol: ['立方公分', '公升', '立方公尺'] };
  function unitQuestion(fam, item) {
    const x = item || pick(ITEMS[fam]), right = fmtU(x), others = UNITS_OF[fam].filter(u => u !== x.u), s = shuffle(others);
    const opts = [right, fmtU({ v: x.v, u: s[0] }), fmtU({ v: x.v, u: s[1] })];
    return { e: x.e, text: `${x.name}${x.dim}？`, a: right, options: shuffle(opts), why: `${x.name}大約是${right}。` };
  }
  function orderQuestion(fam) {
    const got = [];
    for (const x of shuffle(ITEMS[fam])) if (got.length < 3 && got.every(g => Math.max(g.base, x.base) / Math.min(g.base, x.base) >= 1.4)) got.push(x);
    return got;
  }

  const MAX = { prime: 7, fdiv: 6, ddiv: 4, circle: 5, ratio: 7, sector: 5, speed: 6, relation: 5, mix: 5, prism: 5, base: 4, scale: 7, puzzle: 7, pie: 4 };
  const maxLevel = g => MAX[g];
  const GEN = { prime: genPrime, fdiv: genFdiv, ddiv: genDdiv, circle: genCircle, ratio: genRatio, sector: genSector, speed: genSpeed, relation: genRelation, mix: genMix, prism: genPrism, base: genBase, scale: genScale, puzzle: genPuzzle, pie: genPie };
  function gen(game, lv) { return GEN[game](Math.max(0, Math.min(lv, MAX[game]))); }
  function adjust(rec, grade, maxLv) {
    rec.up = grade === 2 ? (rec.up || 0) + 1 : 0;
    rec.down = grade === 0 ? (rec.down || 0) + 1 : 0;
    if (rec.up >= 3) { rec.lv = Math.min((rec.lv || 0) + 1, maxLv); rec.up = 0; }
    if (rec.down >= 2) { rec.lv = Math.max((rec.lv || 0) - 1, 0); rec.down = 0; }
    return rec;
  }
  const api = { gen, GEN, MAX, maxLevel, adjust, gcd, lcm, factors, simp, dec, PI, isPrime, primeFactors, ladder, TREE, ITEMS, UNIT_ITEMS: ITEMS, UNITS_OF, unitQuestion, orderQuestion, fmtU, ri, pick, shuffle };
  if (typeof module !== 'undefined') module.exports = api; else root.Logic = api;
})(this);
