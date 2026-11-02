// 數感小森林　題目產生器：每題是 1～3 個步驟（steps），hands:true 的步驟是動手操作，熟練後可跳過
(function (root) {
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pickOne = a => a[ri(0, a.length - 1)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = ri(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const STATIONS = {
  count10: { n: 1, sem: '一上', name: '螢火蟲點燈', who: 'bear', img: 'isl_count10', tip: '數到 10' },
  long: { n: 2, sem: '一上', name: '毛毛蟲賽跑', who: 'caterpillar', img: 'isl_long', tip: '比長短' },
  split: { n: 3, sem: '一上', name: '果子分盤', who: 'hedgehog', img: 'isl_split', tip: '分一分' },
  order: { n: 4, sem: '一上', name: '動物排隊', who: 'duck', img: 'isl_order', tip: '第幾個' },
  count30: { n: 5, sem: '一上', name: '十顆一串', who: 'squirrel', img: 'isl_count30', tip: '數到 30' },
  add: { n: 6, sem: '一上', name: '小船上客', who: 'duck', img: 'isl_add', tip: '加一加' },
  shape: { n: 7, sem: '一上', name: '形狀小屋', who: 'bunny', img: 'isl_shape', tip: '認形狀' },
  sub: { n: 8, sem: '一上', name: '小鳥飛走', who: 'squirrel', img: 'isl_sub', tip: '減一減' },
  clock: { n: 9, sem: '一上', name: '貓頭鷹的鐘', who: 'owl', img: 'isl_clock', tip: '看鐘' },
  count100: { n: 10, sem: '一下', name: '百寶大樹', who: 'squirrel', img: 'isl_count100', tip: '數到 100' },
  add18: { n: 11, sem: '一下', name: '湊十蘑菇', who: 'bunny', img: 'isl_add18', tip: '先湊 10' },
  measure: { n: 12, sem: '一下', name: '量量小路', who: 'caterpillar', img: 'isl_measure', tip: '量長短' },
  sub18: { n: 13, sem: '一下', name: '吃蜂蜜', who: 'bear', img: 'isl_sub18', tip: '先吃到 10' },
  puzzle: { n: 14, sem: '一下', name: '拼圖工坊', who: 'hedgehog', img: 'isl_puzzle', tip: '拼一拼' },
  calendar: { n: 15, sem: '一下', name: '森林月曆', who: 'owl', img: 'isl_calendar', tip: '幾月幾日' },
  shop: { n: 16, sem: '一下', name: '森林小舖', who: 'mouse', img: 'isl_shop', tip: '用錢買' },
  add2d: { n: 17, sem: '一下', name: '整捆搬貨', who: 'mouse', img: 'isl_add2d', tip: '整捆加整捆' },
  record: { n: 18, sem: '一下', name: '分類回收站', who: 'bunny', img: 'isl_record', tip: '分一分，記下來' },
};

// 數字選項：答案加上旁邊的兩個數
function near(ans, lo, hi, n = 3) {
  const pool = [];
  for (let d = 1; d <= 6; d++) { if (ans + d <= hi) pool.push(ans + d); if (ans - d >= lo) pool.push(ans - d); }
  const near1 = pool.slice(0, 4);
  const out = [ans, ...shuffle(near1).slice(0, n - 1)];
  return out.sort((a, b) => a - b);
}
const pickN = (say, show, val, lo = 0, hi = val + 3, x = {}) => { const opts = near(val, lo, hi); return { t: 'pick', say, show, opts, a: opts.indexOf(val), val, ...x }; };
const pickT = (say, show, opts, right, x = {}) => { const o = shuffle(opts), r = JSON.stringify(right); return { t: 'pick', say, show, opts: o, a: o.findIndex(v => JSON.stringify(v) === r), ...x }; };
const pad = (say, show, val, x = {}) => ({ t: 'pad', say, show, val, ...x });
const COLORS = [{ c: '#57b84a', label: '綠色' }, { c: '#f2b632', label: '黃色' }, { c: '#4f9ad6', label: '藍色' }, { c: '#e0648a', label: '粉紅色' }];
const CUTE = [{ ani: 'bear', label: '小熊熊' }, { ani: 'bunny', label: '跳跳' }, { ani: 'duck', label: '呱寶' }, { ani: 'mouse', label: '吱吱' }, { ani: 'squirrel', label: '果果' }, { ani: 'hedgehog', label: '刺刺' }, { ani: 'owl', label: '咕咕' }];
const KINDN = { bear: '小熊', bunny: '小兔子', duck: '小鴨子', mouse: '小老鼠', squirrel: '小松鼠', hedgehog: '小刺蝟', owl: '貓頭鷹' };
const SHAPES3 = { ball: '球', cube: '方塊', box: '長盒子', can: '圓罐子' };
const SHAPES2 = { circle: '圓形', tri: '三角形', square: '正方形', rect: '長方形' };
const opt2 = k => ({ ic: k, label: SHAPES2[k] });
const opt3 = k => ({ ic: k, label: SHAPES3[k] });
const lvn = (lv, a, b, c) => [a, b, c][Math.min(lv, 2)];

const GEN = {
  count10: {
    light(lv) {
      const n = ri(...lvn(lv, [3, 6], [5, 8], [7, 10]));
      return [{ t: 'count', hands: true, say: `點一隻，亮一隻。`, item: 'fly', n }, pickN('一共亮了幾隻？', { s: 'items', item: 'fly', n, on: true }, n, 1, 10)];
    },
    basket(lv) {
      const n = ri(...lvn(lv, [2, 5], [4, 8], [6, 10]));
      return [{ t: 'dragN', hands: true, say: `放 ${n} 顆松果到籃子裡。`, item: 'pine', total: Math.min(10, n + 3), n }, pickN('籃子裡有幾顆？', { s: 'items', item: 'pine', n }, n, 1, 10)];
    },
    zero() { return [pickT('籃子裡空空的。有幾顆松果？', { s: 'items', item: 'pine', n: 0 }, [0, 1, 2], 0, { val: 0 })]; },
    next(lv) {
      const n = ri(...lvn(lv, [1, 5], [3, 8], [5, 9]));
      return [pickN(`這裡有 ${n} 隻。再來 1 隻，是幾隻？`, { s: 'items', item: 'fly', n, on: true, ghost: 1 }, n + 1, 1, 10)];
    },
  },
  long: {
    len() {
      const cs = shuffle(COLORS).slice(0, 2), ls = shuffle([3, 4, 5, 6, 7]).slice(0, 2);
      const bars = cs.map((c, i) => ({ ...c, len: ls[i] }));
      const right = bars[ls[0] > ls[1] ? 0 : 1];
      return [{ t: 'align', hands: true, say: '把毛毛蟲拉到起跑線。', bars }, pickT('誰比較長？點牠的顏色。', { s: 'bars', bars }, bars.map(b => ({ c: b.c, label: b.label })), { c: right.c, label: right.label })];
    },
    short() {
      const cs = shuffle(COLORS).slice(0, 3), ls = shuffle([2, 3, 4, 5, 6, 7]).slice(0, 3);
      const bars = cs.map((c, i) => ({ ...c, len: ls[i] }));
      const right = bars.reduce((m, b) => b.len < m.len ? b : m);
      return [pickT('哪一隻最短？點牠的顏色。', { s: 'bars', bars }, bars.map(b => ({ c: b.c, label: b.label })), { c: right.c, label: right.label })];
    },
    tall() {
      const who = shuffle(CUTE).slice(0, 2), hs = pickOne([[3, 6], [6, 3], [4, 7], [7, 4]]);
      const bars = who.map((w, i) => ({ ...w, len: hs[i] }));
      const right = bars[hs[0] > hs[1] ? 0 : 1];
      return [{ t: 'align', hands: true, v: true, say: '讓牠們都站到地上。', bars }, pickT('誰比較高？', { s: 'tall', bars }, bars.map(b => ({ ani: b.ani, label: b.label })), { ani: right.ani, label: right.label })];
    },
    far() {
      const who = shuffle(CUTE).slice(0, 2), ns = pickOne([[3, 6], [6, 3], [4, 7], [7, 5], [5, 8]]);
      const rows = who.map((w, i) => ({ ...w, n: ns[i] }));
      const right = rows[ns[0] > ns[1] ? 0 : 1];
      return [pickT('從同一條線出發。誰跳得比較遠？', { s: 'far', rows }, rows.map(b => ({ ani: b.ani, label: b.label })), { ani: right.ani, label: right.label })];
    },
  },
  split: {
    free(lv) {
      const n = lvn(lv, 5, ri(5, 7), ri(7, 10));
      const a = ri(1, n - 1);
      return [{ t: 'split', hands: true, say: `把 ${n} 顆果子放進兩個盤子。兩盤都要有。`, item: 'apple', n },
        { t: 'pick', dynSplit: true, n, a, say: `${n} 顆可以分成 ${a} 顆和幾顆？`, show: { s: 'two', a: { item: 'apple', n: a }, b: { item: 'apple', n: n - a } }, opts: splitOpts(n, n - a), a2: n - a, val: n - a }];
    },
    rest(lv) {
      const n = lvn(lv, 5, ri(6, 8), ri(8, 10)), a = ri(1, n - 1);
      return [pickN(`一共 ${n} 顆。這盤有 ${a} 顆，那盤有幾顆？`, { s: 'two', a: { item: 'apple', n: a }, b: { item: 'apple', n: n - a } }, n - a, 0, n)];
    },
    join(lv) {
      const n = lvn(lv, ri(4, 6), ri(6, 8), ri(8, 10)), a = ri(1, n - 1);
      return [pickN(`${a} 顆和 ${n - a} 顆，放在一起是幾顆？`, { s: 'two', a: { item: 'pear', n: a }, b: { item: 'pear', n: n - a } }, n, 1, 10)];
    },
  },
  order: {
    front(lv) {
      const len = lvn(lv, 5, 6, 7), line = shuffle(CUTE).slice(0, len), k = ri(1, len);
      return [{ t: 'tapOne', say: `從前面數，第 ${k} 隻是誰？點牠。`, line, ans: k - 1, from: 'front' }];
    },
    back(lv) {
      const len = lvn(lv, 5, 6, 7), line = shuffle(CUTE).slice(0, len), k = ri(1, len - 1);
      return [{ t: 'tapOne', say: `從後面數，第 ${k} 隻是誰？點牠。`, line, ans: len - k, from: 'back' }];
    },
    ahead(lv) {
      const len = lvn(lv, 5, 6, 7), line = shuffle(CUTE).slice(0, len), k = ri(1, len - 1);
      return [pickN(`${line[k].label}的前面有幾隻？`, { s: 'line', line, mark: k, upto: k }, k, 0, len)];
    },
    match(lv) {
      const a = ri(3, lvn(lv, 4, 5, 6)), d = ri(1, 2), n1 = pickOne([a, a + d]), n2 = n1 === a ? a + d : a;
      const more = n1 > n2 ? '小動物' : '冰';
      const steps = [{ t: 'match', hands: true, say: '一隻小動物配一支冰。連起來。', top: n1, bot: n2 },
        pickT('誰比較多？', { s: 'pairs', top: n1, bot: n2 }, ['小動物', '冰'], more)];
      if (lv >= 1) steps.push(pickN('多幾個？', { s: 'pairs', top: n1, bot: n2 }, d, 0, 5));
      return steps;
    },
  },
  count30: {
    string(lv) {
      const n = ri(...lvn(lv, [11, 19], [15, 25], [21, 30]));
      const t = Math.floor(n / 10), o = n % 10;
      const say = `每 10 顆串成一串。`;
      const lab = (a, b) => `${a} 串又 ${b} 顆`;
      const wrongs = shuffle([lab(o, t), lab(t + 1, o), lab(t, (o + 1) % 10)].filter(x => x !== lab(t, o))).slice(0, 2);
      return [{ t: 'strand', hands: true, say, item: 'bead', n }, pickT('有幾串又幾顆？', { s: 'strands', t, o }, [lab(t, o), ...wrongs], lab(t, o)), pickN('一共幾顆？', { s: 'strands', t, o }, n, 10, 30)];
    },
    read(lv) {
      const n = ri(...lvn(lv, [11, 19], [12, 25], [20, 30]));
      return [pickN('這是幾顆？', { s: 'strands', t: Math.floor(n / 10), o: n % 10 }, n, 10, 30)];
    },
    cmp(lv) {
      let a = ri(...lvn(lv, [11, 19], [11, 28], [15, 30])), b = ri(11, 30); while (a === b) b = ri(11, 30);
      return [pickT('哪一邊比較多？', { s: 'twoS', kind: 'strands', a, b }, ['左邊', '右邊'], a > b ? '左邊' : '右邊')];
    },
    next(lv) {
      const n = ri(...lvn(lv, [10, 19], [15, 25], [20, 29]));
      return [pickN(`${n} 顆再多 1 顆，是幾顆？`, { s: 'strands', t: Math.floor(n / 10), o: n % 10 }, n + 1, 10, 30)];
    },
  },
  add: {
    board(lv) {
      const a = ri(1, lvn(lv, 3, 5, 6)), b = ri(1, lvn(lv, 3, 4, 4));
      const who = shuffle(CUTE).slice(0, 2);
      return [{ t: 'board', hands: true, say: `讓 ${a} 隻${KINDN[who[0].ani]}、${b} 隻${KINDN[who[1].ani]}上船。`, a, b, who }, pickN(`${a} ＋ ${b} ＝ ？`, { s: 'two', a: { ani: who[0].ani, n: a }, b: { ani: who[1].ani, n: b }, sign: '＋' }, a + b, 1, 10)];
    },
    swap(lv) {
      let a = ri(1, lvn(lv, 4, 5, 6)), b = ri(1, 4); while (a === b) b = ri(1, 4);
      return [{ t: 'swap', hands: true, say: '點一下，讓左右兩邊換位子。', a, b, item: 'duckling' },
        pickT('換了位子，全部有變多嗎？', { s: 'two', a: { item: 'duckling', n: b }, b: { item: 'duckling', n: a } }, ['一樣多', '變多了', '變少了'], '一樣多', { val: a + b }),
        pickN(`${b} ＋ ${a} ＝ ？`, { s: 'two', a: { item: 'duckling', n: b }, b: { item: 'duckling', n: a }, sign: '＋' }, a + b, 1, 10)];
    },
    expr(lv) {
      const a = ri(1, lvn(lv, 4, 6, 8)), b = ri(1, Math.max(1, 10 - a));
      return [pickN(`${a} ＋ ${b} ＝ ？`, { s: 'two', a: { item: 'duckling', n: a }, b: { item: 'duckling', n: b }, sign: '＋' }, a + b, 1, 10)];
    },
    same(lv) {
      let a = ri(1, lvn(lv, 5, 6, 8)), b = ri(1, Math.max(1, 9 - a)); if (a === b) b = b > 1 ? b - 1 : b + 1;
      const r = `${b} ＋ ${a}`, w1 = `${a} ＋ ${b + 1}`, w2 = `${Math.max(1, a - 1)} ＋ ${b}`;
      return [pickT(`誰和 ${a} ＋ ${b} 一樣多？`, { s: 'two', a: { item: 'duckling', n: a }, b: { item: 'duckling', n: b }, sign: '＋' }, [r, w1, w2], r, { val: a + b })];
    },
  },
  shape: {
    roll() {
      const set = shuffle(['cube', 'box']);
      return [{ t: 'tryIt', hands: true, say: '點一點，推推看。', items: ['ball', ...set] }, pickT('哪一個會滾？', null, [opt3('ball'), opt3(set[0]), opt3(set[1])], opt3('ball'))];
    },
    pile() {
      const c = pickOne(['cube', 'box']);
      return [{ t: 'tryIt', hands: true, stack: true, say: '點一點，疊疊看。', items: ['ball', c] }, pickT('哪一個可以疊得高？', null, [opt3('ball'), opt3(c)], opt3(c))];
    },
    frame(lv) {
      const keys = shuffle(Object.keys(SHAPES2)).slice(0, lvn(lv, 2, 3, 4));
      const items = shuffle(keys.flatMap(k => Array(lv >= 1 ? 2 : 1).fill({ ic: k, tag: k })));
      return [{ t: 'sort', say: '把形狀拖到一樣的框。', items, bins: keys.map(k => ({ id: k, outline: k })) }];
    },
    name() {
      const keys = shuffle(Object.keys(SHAPES2)).slice(0, 3), k = keys[0];
      return [pickT(`哪一個是${SHAPES2[k]}？`, null, keys.map(opt2), opt2(k))];
    },
  },
  sub: {
    fly(lv) {
      const n = ri(...lvn(lv, [3, 6], [5, 8], [6, 10])), off = ri(1, Math.min(n - 1, lvn(lv, 2, 4, 5)));
      return [{ t: 'tapOff', hands: true, say: `點 ${off} 隻小鳥，讓牠們飛走。`, item: 'bird', n, off }, pickN(`${n} － ${off} ＝ ？還剩幾隻？`, { s: 'items', item: 'bird', n: n - off, gone: off }, n - off, 0, 10)];
    },
    expr(lv) {
      const n = ri(...lvn(lv, [3, 6], [5, 8], [6, 10])), off = ri(1, n - 1);
      return [pickN(`${n} － ${off} ＝ ？`, { s: 'items', item: 'bird', n: n - off, gone: off }, n - off, 0, 10)];
    },
    which(lv) {
      const add = Math.random() < .5, a = ri(3, lvn(lv, 5, 6, 7)), b = ri(1, add ? Math.min(3, 10 - a) : Math.min(3, a - 1));
      const say = add ? `樹上有 ${a} 隻鳥，又飛來 ${b} 隻。` : `樹上有 ${a} 隻鳥，飛走 ${b} 隻。`;
      const val = add ? a + b : a - b;
      const show = add ? { s: 'two', a: { item: 'bird', n: a }, b: { item: 'bird', n: b }, sign: '＋' } : { s: 'items', item: 'bird', n: val, gone: b };
      return [pickT(`${say}小鳥會變多，還是變少？`, show, ['變多', '變少'], add ? '變多' : '變少'),
        pickT('要用哪一個算？', show, [`${a} ＋ ${b}`, `${a} － ${b}`], add ? `${a} ＋ ${b}` : `${a} － ${b}`),
        pickN('現在有幾隻？', show, val, 0, 10)];
    },
  },
  clock: {
    set(lv) {
      const h = ri(1, 12), half = lv >= 1 && Math.random() < .5;
      return [{ t: 'clock', say: half ? `把鐘撥到 ${h} 點半。` : `把鐘撥到 ${h} 點。`, h, half }];
    },
    read(lv) {
      const h = ri(1, 12), half = lv >= 1 ? Math.random() < .5 : false, t = (a, b) => b ? `${a} 點半` : `${a} 點`;
      const r = t(h, half), o = [r, t(h % 12 + 1, half), t(h, !half)];
      if (!half) o[2] = t((h + 1) % 12 + 1, false);
      return [pickT('現在是幾點？', { s: 'clock', h, half }, o, r)];
    },
    day() {
      const set = pickOne([[['sun', '起床'], ['lunch', '吃午餐'], ['moon', '睡覺']], [['sun', '吃早餐'], ['school', '放學回家'], ['moon', '看星星']], [['school', '上學'], ['lunch', '吃午餐'], ['moon', '洗澡睡覺']]]);
      return [{ t: 'order', say: '哪一件事先做？照順序點。', cards: shuffle(set.map(([ic, text], rank) => ({ ic, text, rank }))) }];
    },
    when() {
      const [text, r, ic] = pickOne([['吃早餐', '早上', 'sun'], ['吃午餐', '中午', 'lunch'], ['看星星', '晚上', 'moon']]);
      return [pickT(`${text}是什麼時候？`, { s: 'ic', ic }, ['早上', '中午', '晚上'], r)];
    },
  },
  count100: {
    make(lv) {
      const n = ri(...lvn(lv, [21, 49], [30, 79], [50, 99]));
      return [{ t: 'bundle', say: `拼出 ${n} 根樹枝。`, n }];
    },
    read(lv) {
      const n = ri(...lvn(lv, [21, 49], [30, 79], [50, 100]));
      return [pad('這是幾根？', { s: 'sticks', t: Math.floor(n / 10), o: n % 10 }, n)];
    },
    open() {
      const k = ri(1, 3);
      return [{ t: 'openB', hands: true, say: '點樹枝捆，把它打開。' }, pad('1 捆打開，是幾根？', { s: 'items', item: 'stick', n: 10 }, 10), pad(`${k} 捆是幾根？`, { s: 'sticks', t: k, o: 0 }, k * 10)];
    },
    tie(lv) {
      const n = ri(...lvn(lv, [11, 19], [12, 20], [20, 30]));
      return [{ t: 'strand', hands: true, say: '每 10 根綁成一捆。', item: 'stick', n }, pad('一共幾根？', { s: 'sticks', t: Math.floor(n / 10), o: n % 10 }, n)];
    },
    cmp(lv) {
      let a = ri(...lvn(lv, [20, 60], [30, 90], [40, 100])), b = ri(20, 100); while (a === b) b = ri(20, 100);
      return [pickT('哪一邊比較多？', { s: 'twoS', kind: 'sticks', a, b }, ['左邊', '右邊'], a > b ? '左邊' : '右邊')];
    },
    next(lv) {
      const n = lvn(lv, ri(20, 59), ri(30, 89), pickOne([39, 49, 59, 69, 79, 89, 99]));
      return [pad(`${n} 再多 1，是多少？`, { s: 'sticks', t: Math.floor(n / 10), o: n % 10 }, n + 1)];
    },
  },
  add18: {
    mush(lv) {
      const a = ri(...lvn(lv, [8, 9], [7, 9], [6, 9])), b = ri(11 - a, Math.min(9, 18 - a));
      return [{ t: 'frameAdd', hands: true, say: '把蘑菇搬過來，先排滿 10 格。', a, b, item: 'mush' }, pad(`${a} ＋ ${b} ＝ ？`, { s: 'frames', n: a + b, item: 'mush' }, a + b)];
    },
    expr(lv) {
      const a = ri(...lvn(lv, [8, 9], [6, 9], [5, 9])), b = ri(11 - a, Math.min(9, 18 - a));
      return [pad(`${a} ＋ ${b} ＝ ？`, { s: 'framesAB', a, b, item: 'mush' }, a + b)];
    },
    tale(lv) {
      const a = ri(...lvn(lv, [7, 9], [6, 9], [5, 9])), b = ri(11 - a, Math.min(9, 18 - a));
      return [pad(`左邊 ${a} 朵，右邊 ${b} 朵。一共幾朵？`, { s: 'framesAB', a, b, item: 'mush' }, a + b)];
    },
    fill(lv) {
      const a = ri(...lvn(lv, [7, 9], [6, 9], [5, 9]));
      return [pad(`${a} 朵，再來幾朵就滿 10 格？`, { s: 'frames', n: a, item: 'mush' }, 10 - a)];
    },
  },
  measure: {
    clip(lv) {
      const n = ri(...lvn(lv, [3, 5], [4, 7], [6, 9]));
      return [{ t: 'lay', hands: true, say: '用迴紋針，排滿這條路。', unit: 'clip', n }, pad('這條路是幾根迴紋針長？', { s: 'path', unit: 'clip', rows: [n] }, n)];
    },
    foot(lv) {
      const n = ri(...lvn(lv, [2, 4], [3, 5], [4, 6]));
      return [{ t: 'lay', hands: true, say: '用腳印，走完這條路。', unit: 'foot', n }, pad('這條路是幾個腳印長？', { s: 'path', unit: 'foot', rows: [n] }, n)];
    },
    join(lv) {
      const a = ri(2, lvn(lv, 4, 6, 8)), b = ri(2, lvn(lv, 4, 5, 7));
      return [pad(`${a} 根和 ${b} 根接起來，是幾根長？`, { s: 'path', unit: 'clip', rows: [a], join: b }, a + b)];
    },
    cmp(lv) {
      let a = ri(3, lvn(lv, 6, 7, 8)), b = ri(3, lvn(lv, 6, 7, 8)); while (a === b) b = ri(3, 8);
      return [pickT('哪一條路比較長？', { s: 'path', unit: 'clip', rows: [a, b] }, ['上面', '下面'], a > b ? '上面' : '下面')];
    },
    unit() {
      const f = ri(2, 3);
      return [pickT('同一條路。哪一種排得比較多個？', { s: 'path2', foot: f, clip: f * 3 }, [{ ic: 'clip', label: '迴紋針' }, { ic: 'foot', label: '腳印' }], { ic: 'clip', label: '迴紋針' })];
    },
  },
  sub18: {
    honey(lv) {
      const n = ri(11, lvn(lv, 14, 16, 18)), o = n - 10, off = ri(o + 1, Math.min(9, o + lvn(lv, 3, 4, 5)));
      return [{ t: 'tapOff', hands: true, frames: true, say: `吃掉 ${off} 格。先吃外面的，再吃十格盤。`, item: 'honey', n, off }, pad(`${n} － ${off} ＝ ？`, { s: 'frames', n: n - off, item: 'honey', gone: off }, n - off)];
    },
    expr(lv) {
      const n = ri(11, lvn(lv, 14, 16, 18)), o = n - 10, off = ri(o + 1, 9);
      return [pad(`${n} － ${off} ＝ ？`, { s: 'frames', n: n - off, item: 'honey', gone: off }, n - off)];
    },
    first(lv) {
      const n = ri(11, lvn(lv, 14, 16, 18));
      return [pad(`${n} 罐。先吃幾罐，就剩 10 罐？`, { s: 'frames', n, item: 'honey' }, n - 10)];
    },
    tale(lv) {
      const n = ri(11, lvn(lv, 14, 16, 18)), o = n - 10, off = ri(o + 1, 9);
      return [pad(`有 ${n} 罐，吃掉 ${off} 罐。還剩幾罐？`, { s: 'frames', n: n - off, item: 'honey', gone: off }, n - off)];
    },
  },
  puzzle: {
    tan(lv) { return [{ t: 'puzzle', say: '把形狀拖到框裡，拼起來。', ...pickOne(lv >= 1 ? PUZZLES : PUZZLES.slice(0, 3)) }]; },
    trace() {
      const k = pickOne(['tri', 'square', 'rect']);
      return [{ t: 'trace', hands: true, say: '照 1、2、3 的順序點，把邊描出來。', shape: k }, pickT('描出來是什麼形狀？', { s: 'ic', ic: k, big: true }, [opt2('tri'), opt2('square'), opt2('rect')], opt2(k))];
    },
    stack(lv) {
      const cols = lvn(lv, 2, 3, 4), model = Array.from({ length: cols }, () => ri(1, lvn(lv, 2, 3, 4)));
      return [{ t: 'stack', say: '照左邊的樣子，疊積木。點格子。', model }];
    },
    count() {
      const p = pickOne(PUZZLES), n = p.slots.filter(s => s.shape === 'tri').length;
      if (!n) return GEN.puzzle.count();
      return [pad('這個圖用了幾個三角形？', { s: 'puzzle', slots: p.slots }, n)];
    },
  },
  calendar: {
    rel() {
      const c = calMonth(), today = ri(2, c.days - 1), g = pickOne(['tom', 'yest', 'today']);
      const ans = { tom: today + 1, yest: today - 1, today }[g];
      return [{ t: 'cal', ...c, today, ans: [ans], say: { tom: '有星星的是今天。明天在哪裡？點一下。', yest: '有星星的是今天。昨天在哪裡？點一下。', today: '有星星的是今天。點今天。' }[g] }];
    },
    wed() {
      const c = calMonth(), dow = ri(1, 5), name = '日一二三四五六'[dow];
      const ans = []; for (let d = 1; d <= c.days; d++) if ((d - 1 + c.start) % 7 === dow) ans.push(d);
      return [{ t: 'cal', hands: true, multi: true, ...c, ans, say: `把星期${name}都點出來。` }, pad(`這個月有幾個星期${name}？`, { s: 'cal', ...c, marks: ans }, ans.length)];
    },
    dow() {
      const c = calMonth(), d = ri(1, c.days), dw = (d - 1 + c.start) % 7, wk = i => '星期' + '日一二三四五六'[i];
      const right = wk(dw), o = [right, wk((dw + 1) % 7), wk((dw + 6) % 7)];
      return [pickT(`${d} 日是星期幾？`, { s: 'cal', ...c, marks: [d] }, o, right)];
    },
    next() {
      const dw = ri(0, 6), wk = i => '星期' + '日一二三四五六'[i], back = Math.random() < .5;
      const right = wk(back ? (dw + 6) % 7 : (dw + 1) % 7), o = [right, wk(dw), wk(back ? (dw + 1) % 7 : (dw + 6) % 7)];
      return [pickT(`今天是${wk(dw)}。${back ? '昨天' : '明天'}是星期幾？`, { s: 'week', mark: dw }, o, right)];
    },
  },
  shop: {
    pay(lv) {
      const n = ri(...lvn(lv, [3, 15], [11, 30], [25, 60]));
      return [{ t: 'coin', say: `付 ${n} 元。把錢拖到盤子上。`, target: n, avail: lv >= 2 ? [1, 5, 10, 50] : [1, 5, 10], thing: pickOne(['apple', 'pear', 'honey']) }];
    },
    other(lv) {
      const n = ri(...lvn(lv, [6, 15], [11, 25], [15, 40]));
      return [{ t: 'coin', say: `付 ${n} 元。把錢拖到盤子上。`, target: n, avail: [1, 5, 10], thing: 'honey' }, { t: 'coin', avoid: true, say: `換一種錢，再付一次 ${n} 元。`, target: n, avail: [1, 5, 10], thing: 'honey' }];
    },
    trade(lv) {
      const [target, avail, big] = pickOne(lv >= 1 ? [[10, [1, 5], 10], [50, [10, 5], 50], [5, [1], 5]] : [[10, [1, 5], 10], [5, [1], 5]]);
      return [{ t: 'coin', say: `把 ${big} 元換開。放一樣多的錢。`, target, avail, showBig: big }];
    },
    change(lv) {
      const paid = lv >= 1 ? pickOne([10, 20]) : 10, price = ri(paid === 10 ? 3 : 12, paid - 1);
      return [pad(`東西 ${price} 元，付 ${paid} 元。要找幾元？`, { s: 'items', item: 'coin1', n: paid - price, gone: price }, paid - price)];
    },
  },
  add2d: {
    addB(lv) {
      const t1 = ri(1, lvn(lv, 3, 4, 5)), t2 = ri(1, lvn(lv, 2, 3, 4)), o1 = ri(0, 4), o2 = ri(lv === 0 ? 1 : 0, 4);
      const a = t1 * 10 + o1, b = t2 * 10 + o2;
      const items = shuffle([...Array(t1 + t2).fill({ ic: 'bundle', tag: 'b' }), ...Array(o1 + o2).fill({ ic: 'stick', tag: 's' })]);
      return [{ t: 'sort', hands: true, say: '整捆放一邊，單根放一邊。', items, bins: [{ id: 'b', ic: 'bundle', label: '整捆' }, { id: 's', ic: 'stick', label: '單根' }] }, pad(`${a} ＋ ${b} ＝ ？`, { s: 'sticks', t: t1 + t2, o: o1 + o2 }, a + b)];
    },
    subB(lv) {
      const t = ri(2, lvn(lv, 4, 6, 8)), o = ri(2, 8), mt = ri(1, t - 1), mo = ri(1, o - 1);
      const a = t * 10 + o, b = mt * 10 + mo;
      return [{ t: 'tapOff', hands: true, sticks: true, say: `搬走 ${mt} 捆和 ${mo} 根。點它們。`, tn: t, on: o, mt, mo }, pad(`${a} － ${b} ＝ ？`, { s: 'sticks', t: t - mt, o: o - mo, goneT: mt, goneO: mo }, a - b)];
    },
    expr(lv) {
      const t1 = ri(1, lvn(lv, 3, 5, 7)), t2 = ri(1, 8 - t1 > 0 ? Math.min(8 - t1, 3) : 1), o1 = ri(1, 5), o2 = ri(0, 4);
      return [pad(`${t1 * 10 + o1} ＋ ${t2 * 10 + o2} ＝ ？`, { s: 'twoS', kind: 'sticks', a: t1 * 10 + o1, b: t2 * 10 + o2, sign: '＋' }, (t1 + t2) * 10 + o1 + o2)];
    },
    tens(lv) {
      const sub = lv >= 1 && Math.random() < .5, a = ri(2, 9), b = sub ? ri(1, a - 1) : ri(1, 10 - a);
      return [pad(`${a * 10} ${sub ? '－' : '＋'} ${b * 10} ＝ ？`, sub ? { s: 'sticks', t: a - b, o: 0, goneT: b, goneO: 0 } : { s: 'twoS', kind: 'sticks', a: a * 10, b: b * 10, sign: '＋' }, (sub ? a - b : a + b) * 10)];
    },
  },
  record: {
    resort(lv) {
      const items = shuffle(TRASH).slice(0, lvn(lv, 4, 6, 7)), kinds = [...new Set(items.map(x => x.kind))];
      const sizes = [...new Set(items.map(x => x.color))];
      if (kinds.length < 2 || sizes.length < 2) return GEN.record.resort(lv);
      return [{ t: 'sort', say: '照東西的種類，拖進桶子。', items: items.map(x => ({ ic: x.ic, tag: x.kind })), bins: kinds.map(k => ({ id: k, label: KIND[k], bin: true })) },
        { t: 'sort', say: '換一種分法。這次照顏色分。', items: items.map(x => ({ ic: x.ic, tag: x.color })), bins: sizes.map(c => ({ id: c, label: COLOR[c], bin: true, tint: c })) }];
    },
    mark(lv) {
      const items = shuffle(TRASH).slice(0, lvn(lv, 5, 6, 7)), kinds = [...new Set(items.map(x => x.kind))];
      if (kinds.length < 2) return GEN.record.mark(lv);
      const cnt = kinds.map(k => items.filter(x => x.kind === k).length), max = Math.max(...cnt);
      if (cnt.filter(c => c === max).length > 1) return GEN.record.mark(lv);
      const right = KIND[kinds[cnt.indexOf(max)]];
      return [{ t: 'sort', hands: true, say: '把東西拖進桶子。', items: items.map(x => ({ ic: x.ic, tag: x.kind })), bins: kinds.map(k => ({ id: k, label: KIND[k], bin: true })) },
        { t: 'record', say: '用你喜歡的記號，一個東西記一個。', rows: kinds.map((k, i) => ({ label: KIND[k], n: cnt[i], ics: items.filter(x => x.kind === k).map(x => x.ic) })) },
        pickT('哪一桶最多？', { s: 'tally', rows: kinds.map((k, i) => ({ label: KIND[k], n: cnt[i], ics: items.filter(x => x.kind === k).map(x => x.ic) })) }, kinds.map(k => KIND[k]), right)];
    },
    most(lv) {
      const items = shuffle(TRASH).slice(0, lvn(lv, 5, 6, 8)), kinds = [...new Set(items.map(x => x.kind))];
      if (kinds.length < 2) return GEN.record.most(lv);
      const pickK = kinds[ri(0, kinds.length - 1)], n = items.filter(x => x.kind === pickK).length;
      return [pad(`${KIND[pickK]}有幾個？`, { s: 'tally', rows: kinds.map(k => ({ label: KIND[k], n: items.filter(x => x.kind === k).length, ics: items.filter(x => x.kind === k).map(x => x.ic) })) }, n)];
    },
  },
};

const KIND = { paper: '紙', bottle: '瓶子', can: '鐵罐' };
const COLOR = { b: '藍色', r: '紅色', g: '綠色' };
const TRASH = [
  { ic: 'paper_b', kind: 'paper', color: 'b' }, { ic: 'paper_r', kind: 'paper', color: 'r' }, { ic: 'paper_g', kind: 'paper', color: 'g' },
  { ic: 'bottle_b', kind: 'bottle', color: 'b' }, { ic: 'bottle_g', kind: 'bottle', color: 'g' }, { ic: 'bottle_r', kind: 'bottle', color: 'r' },
  { ic: 'tin_r', kind: 'can', color: 'r' }, { ic: 'tin_b', kind: 'can', color: 'b' }, { ic: 'tin_g', kind: 'can', color: 'g' },
];
// 拼圖：座標在 0～240 的方框內，piece 的形狀和格子相同，放對位置才會吸住
const PUZZLES = [
  { name: '大方塊', slots: [{ shape: 'tri', pts: '30,30 210,30 30,210', c: '#f2b632' }, { shape: 'tri', pts: '210,30 210,210 30,210', c: '#57b84a' }] },
  { name: '小房子', slots: [{ shape: 'tri', pts: '30,110 120,30 210,110', c: '#e0648a' }, { shape: 'square', pts: '60,110 180,110 180,230 60,230', c: '#f2b632' }] },
  { name: '小船', slots: [{ shape: 'tri', pts: '120,20 120,130 200,130', c: '#4f9ad6' }, { shape: 'rect', pts: '30,140 210,140 210,200 30,200', c: '#a9713d' }] },
  { name: '小魚', slots: [{ shape: 'square', pts: '50,70 150,70 150,170 50,170', c: '#4f9ad6' }, { shape: 'tri', pts: '150,120 220,70 220,170', c: '#f2b632' }] },
  { name: '小樹', slots: [{ shape: 'tri', pts: '120,10 50,90 190,90', c: '#57b84a' }, { shape: 'tri', pts: '120,70 40,160 200,160', c: '#3e9a48' }, { shape: 'rect', pts: '100,160 140,160 140,230 100,230', c: '#a9713d' }] },
];
function calMonth() { return { month: ri(1, 12), days: pickOne([30, 31]), start: ri(0, 6) }; }
function splitOpts(n, val) { return near(val, 0, n); }
function splitPick(n, a) { const val = n - a, opts = near(val, 0, n); return { say: `${n} 顆可以分成 ${a} 顆和幾顆？`, val, opts, a: opts.indexOf(val), show: { s: 'two', a: { item: 'apple', n: a }, b: { item: 'apple', n: val } } }; }

const MODES = Object.fromEntries(Object.entries(GEN).map(([k, v]) => [k, Object.keys(v)]));
function gen(st, m, lv = 0) {
  const steps = GEN[st][m](lv);
  steps.forEach(s => {
    if (s.dynSplit) { const p = splitPick(s.n, s.a); Object.assign(s, p); s.a2 = undefined; s.a = p.a; s.a0 = steps[0]; }
  });
  return { st, m, sem: STATIONS[st].sem, key: st + ':' + m, steps };
}
function roundModes(st, count) {
  const out = []; while (out.length < count) out.push(...shuffle(MODES[st]));
  return out.slice(0, count);
}
function coinCount(tray) { return tray.reduce((s, c) => s + c, 0); }
const api = { STATIONS, GEN, MODES, gen, roundModes, shuffle, ri, splitPick, near, PUZZLES, coinCount, SHAPES2, SHAPES3 };
if (typeof module !== 'undefined') module.exports = api; else root.Logic = api;
})(this);
