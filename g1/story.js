// 故事與新概念小故事。全部自編。
// LESSONS 每站：小麻煩 → 孩子動手試 → 才說出新詞（一站一個）→ 換一個東西再試；有 hint（錯了的下一步）和 ok（對了說出做法）
(function (root) {
const STORY = {
  open: ['亮亮是剛孵出來的小螢火蟲。', '可是，亮亮的尾巴還不會亮。', '森林的朋友有小麻煩。你幫一個忙，亮亮就亮一點！'],
  half: ['小森林的路燈，都亮起來了！', '亮亮說：我們來蓋一條小路吧。', '小路會通到哪裡呢？'],
  end: ['小路蓋好了！亮亮的尾巴好亮好亮。', '路的那一頭，就是數感小鎮。', '謝謝你。我們下次在小鎮見！'],
  count10: { talk: '小熊熊說：天黑了，路燈要點亮。', out: '燈亮了！小熊熊不怕黑了。' },
  long: { talk: '長長說：我們要比賽，誰比較長呢？', out: '長長笑了：比之前要先排好！' },
  split: { talk: '刺刺說：果子要放在兩個盤子。', out: '刺刺說：分法好多種！' },
  order: { talk: '呱寶說：大家排隊買冰囉！', out: '呱寶說：排好隊，大家都吃到冰了。' },
  count30: { talk: '果果說：果子好多，數到亂掉了。', out: '果果說：十顆一串，好數多了！' },
  add: { talk: '呱寶說：小船要開了，大家快上船。', out: '船開了！呱寶揮揮翅膀。' },
  shape: { talk: '跳跳說：小屋裡的東西亂亂的。', out: '小屋變整齊了，跳跳好開心。' },
  sub: { talk: '果果說：小鳥飛來飛去，還剩幾隻呢？', out: '果果說：你看得好清楚！' },
  clock: { talk: '咕咕說：我的鐘，要請你幫忙撥。', out: '咕咕說：鐘都走對了，謝謝你！' },
  count100: { talk: '果果說：要蓋小路，要好多樹枝。', out: '樹枝夠了，小路開始蓋了！' },
  add18: { talk: '跳跳說：蘑菇要搬到路邊。', out: '路邊的蘑菇，排得好整齊！' },
  measure: { talk: '長長說：這條小路有多長？', out: '長長說：量好了，可以鋪路了。' },
  sub18: { talk: '小熊熊說：蜂蜜好香，我想吃。', out: '小熊熊吃飽了，又有力氣蓋路。' },
  puzzle: { talk: '刺刺說：路標壞了，幫我拼好。', out: '路標拼好了，不會迷路了！' },
  calendar: { talk: '咕咕說：哪一天要開工呢？', out: '咕咕說：日子看清楚了！' },
  shop: { talk: '吱吱說：要買蓋路的東西，付錢吧。', out: '吱吱說：謝謝光臨，錢都對！' },
  add2d: { talk: '吱吱說：貨好多，一起搬吧。', out: '貨都搬到了，小路快好了！' },
  record: { talk: '跳跳說：蓋路後，地上有好多垃圾。', out: '森林變乾淨了！小路蓋好了。' },
};
const L = (say, word) => ({ say, word });
// 2026-11 依外部審查修改：看得見的東西＋一個動作＋一個問題；錯了給下一步（hint），對了說出做法（ok）
const BEAR = { ani: 'bear', label: '小熊熊' }, MOUSE = { ani: 'mouse', label: '吱吱' }, BUNNY = { ani: 'bunny', label: '跳跳' }, DUCK = { ani: 'duck', label: '呱寶' }, OWL = { ani: 'owl', label: '咕咕' }, SQ = { ani: 'squirrel', label: '果果' }, HOG = { ani: 'hedgehog', label: '刺刺' };
const REC_ROWS = [{ label: '紙', n: 3, ics: ['paper_b', 'paper_r', 'paper_g'] }, { label: '瓶子', n: 2, ics: ['bottle_g', 'bottle_b'] }];
const LESSONS = {
  count10: { title: '一共有幾個', beats: [
    L('小熊熊想知道，有幾隻螢火蟲。一隻一隻點吧！'),
    { t: 'count', say: '每隻點一次。點一隻，亮一隻。', item: 'fly', n: 3 },
    L('每隻數一次，最後數到 3，一共有 3 隻。', '一共'),
    { t: 'pick', say: '螢火蟲換了位子。現在一共有幾隻？', show: { s: 'spread', item: 'fly', n: 3 }, opts: [2, 3, 4], a: 1, val: 3, hint: '每隻點一次，數一數，再選一次。', ok: '對了，換了位子，還是 3 隻。' },
    { t: 'dragN', say: '換松果。放 4 顆到籃子裡，再按好了。', item: 'pine', total: 6, n: 4 }] },
  long: { title: '比較長', beats: [
    L('兩隻毛毛蟲的尾巴沒有對齊。誰比較長呢？'),
    { t: 'align', say: '把毛毛蟲往左拉，尾巴碰到起跑線。', bars: [{ c: '#57b84a', label: '綠色', len: 3 }, { c: '#4f9ad6', label: '藍色', len: 6 }] },
    L('尾巴對齊了，再看頭。藍色伸得比較遠，藍色比較長。', '比較長'),
    { t: 'align', v: true, say: '換小動物。把牠們往下拉，腳踩到地上。', bars: [{ ani: 'bear', label: '小熊熊', len: 7 }, { ani: 'mouse', label: '吱吱', len: 4 }] },
    { t: 'pick', say: '腳都踩在地上了。誰比較高？', show: { s: 'tall', bars: [{ ani: 'bear', label: '小熊熊', len: 7 }, { ani: 'mouse', label: '吱吱', len: 4 }] }, opts: [BEAR, MOUSE], a: 0, hint: '腳一樣踩在地上，看誰的頭比較上面。', ok: '對了，腳對齊地面，小熊熊的頭比較上面，小熊熊比較高。' }] },
  split: { title: '分成', beats: [
    L('刺刺有 4 顆果子，要全部放進兩個盤子。'),
    { t: 'split', say: '把 4 顆都放進盤子。兩盤都要有果子。', item: 'apple', n: 4 },
    { t: 'split', avoid: true, say: '還有別的分法嗎？再分一次，換一種。', item: 'apple', n: 4 },
    L('一樣是 4 顆，可以分成 1 和 3、2 和 2，也可以分成 3 和 1。', '分成'),
    { t: 'split', say: '換梨子。把 5 顆都放進兩個盤子。', item: 'pear', n: 5 }] },
  order: { title: '第幾隻', beats: [
    L('大家排隊買冰。呱寶要請排在最前面的先吃冰。'),
    { t: 'tapOne', say: '寫著「前」的那一頭是最前面。誰排最前面？', line: [BEAR, MOUSE, BUNNY, DUCK], ans: 0, from: 'front' },
    L('從「前」開始數：第 1 隻、第 2 隻、第 3 隻。', '第幾隻'),
    { t: 'tapOne', say: '換一隊。從「前」開始數，第 2 隻是誰？點牠。', line: [OWL, SQ, HOG], ans: 1, from: 'front' },
    { t: 'pick', say: '第 2 隻是果果。這一隊一共有幾隻？', show: { s: 'line', line: [OWL, SQ, HOG], upto: 3, mark: 1 }, opts: [2, 3, 4], a: 1, val: 3, hint: '一隻一隻數，要數全部。', ok: '對了，第 2 隻只是其中一隻，這一隊一共有 3 隻。' }] },
  count30: { title: '一串', beats: [
    L('果子太多，果果數到亂掉了。'),
    { t: 'strand', say: '一顆一顆點。這裡每 10 顆串成一串。', item: 'bead', n: 12 },
    L('這裡每 10 顆串成一串。1 串和 2 顆，一共有 12 顆。', '一串'),
    { t: 'pick', say: '2 串和 3 顆，一共有幾顆？', show: { s: 'strands', t: 2, o: 3 }, opts: [5, 23, 32], a: 1, val: 23, hint: '一串有 10 顆。先數 10、20，再數散的。', ok: '對了，2 串是 20 顆，再加 3 顆，是 23 顆。' }] },
  add: { title: '加起來', beats: [
    L('岸上有 2 隻小鴨子和 1 隻小兔子，要一起坐船。'),
    { t: 'board', say: '把牠們一隻一隻拖上船。', a: 2, b: 1, who: [DUCK, BUNNY] },
    L('2 隻和 1 隻合在一起，一共有 3 隻。可以寫成 2＋1＝3。', '加起來'),
    { t: 'pick', say: '換蘋果。2 顆和 2 顆，加起來一共幾顆？', show: { s: 'two', a: { item: 'apple', n: 2 }, b: { item: 'apple', n: 2 }, sign: '＋' }, opts: [3, 4, 5], a: 1, val: 4, ok: '對了，2 顆和 2 顆合在一起，2＋2＝4。' }] },
  shape: { title: '會滾、能疊', beats: [
    L('跳跳的東西滾來滾去。哪些會滾，哪些能疊高？'),
    { t: 'tryIt', say: '輕輕推一推球和方塊，看看會怎樣。', items: ['ball', 'cube'] },
    L('這顆球輕輕推就會滾。方塊用平平的面朝下，容易疊高。', '會滾、能疊'),
    { t: 'pick', say: '換一個。哪一個輕輕推會滾走？', opts: [{ ic: 'box', label: '長盒子' }, { ic: 'ball', label: '球' }], a: 1, hint: '想想剛才推一推，哪一個滾走了？', ok: '對了，球圓圓的，輕輕推就滾走了。' },
    { t: 'tryIt', lying: true, say: '圓罐子躺下來了。推推看。', items: ['can'], ok: '躺著的圓罐子會滾。站著時，平平的面朝下，就能疊。' }] },
  sub: { title: '減', beats: [
    L('樹上有 4 隻小鳥。有 1 隻要飛走了。'),
    { t: 'tapOff', say: '點 1 隻小鳥，讓牠飛走。', item: 'bird', n: 4, off: 1 },
    L('4 隻飛走 1 隻，還剩 3 隻。可以寫成 4－1＝3，這就是減。', '減'),
    { t: 'tapOff', say: '換蘋果。有 5 顆，點 2 顆吃掉。', item: 'apple', n: 5, off: 2, ok: '吃掉 2 顆了。' },
    { t: 'pick', say: '5 顆吃掉 2 顆，還剩幾顆？', show: { s: 'items', item: 'apple', n: 3, gone: 2 }, opts: [2, 3, 7], a: 1, val: 3, ok: '對了，5－2＝3，還剩 3 顆。' }] },
  clock: { title: '幾點半', beats: [
    L('咕咕要 3 點吃點心，鐘要撥好。'),
    { t: 'clock', say: '撥到 3 點：短針指 3，長針指 12。', h: 3, half: false },
    { t: 'clockRun', say: '按「讓鐘走」，看兩根針怎麼走。', h: 3 },
    L('3 點半時，長針指 6，短針在 3 和 4 的中間。這叫做幾點半。', '幾點半'),
    { t: 'clock', say: '換你。把鐘撥到 4 點半。', h: 4, half: true }] },
  count100: { title: '一捆', beats: [
    L('樹枝一根一根，好難拿。這裡有一捆綁好的。'),
    { t: 'openB', say: '點樹枝捆，把它打開，數一數。' },
    L('每 10 根綁成 1 捆。1 捆打開是 10 根，樹枝沒有變多，也沒有變少。', '一捆'),
    { t: 'strand', say: '換你綁。每 10 根綁一捆。', item: 'stick', n: 12 },
    { t: 'pick', say: '3 捆和 4 根，一共有幾根？', show: { s: 'sticks', t: 3, o: 4 }, opts: [7, 34, 43], a: 1, val: 34, hint: '1 捆是 10 根。先數 10、20、30，再數單根。', ok: '對了，3 捆是 30 根，再加 4 根，是 34 根。' },
    { t: 'pick', say: '10 捆一共有幾根？', show: { s: 'sticks', t: 10, o: 0 }, opts: [10, 20, 100], a: 2, val: 100, hint: '1 捆是 10 根，一捆一捆數：10、20、30。', ok: '對了，10 捆是 100 根。10 個 10 就是 100。' }] },
  add18: { title: '湊滿 10', beats: [
    L('跳跳有 8 朵蘑菇，又找到 3 朵。一共有幾朵呢？'),
    { t: 'pick', say: '先看十格框。框裡有 8 朵，還空幾格？', show: { s: 'frameLoose', a: 8, b: 3, item: 'mush' }, opts: [1, 2, 3], a: 1, val: 2, noCount: true, hint: '一格一格數空的格子，再選一次。', ok: '對了，還空 2 格。' },
    { t: 'frameAdd', say: '從外面的 3 朵拿 2 朵，搬進框裡。', a: 8, b: 3, item: 'mush' },
    { t: 'pick', say: '10 朵和 1 朵，一共有幾朵？', show: { s: 'frameLoose', a: 10, b: 1, item: 'mush' }, opts: [10, 11, 12], a: 1, val: 11, ok: '對了，10 朵和 1 朵，一共 11 朵。' },
    { t: 'pick', say: '剛才只是搬位子。蘑菇有變多或變少嗎？', show: { s: 'frameLoose', a: 10, b: 1, item: 'mush' }, opts: ['變多了', '沒有變', '變少了'], a: 1, noCount: true, hint: '搬之前是 8 朵和 3 朵，有拿走或加進來嗎？', ok: '對了，只是搬位子，8 朵和 3 朵還是 11 朵。' },
    L('8 再加 2 就滿 10。把 3 分成 2 和 1，先湊 10，再加 1，就是 11。', '湊滿 10'),
    { t: 'pick', say: '換蘋果。9 顆和 4 顆，要搬幾顆，框才會滿？', show: { s: 'frameLoose', a: 9, b: 4, item: 'apple' }, opts: [1, 2, 3, 4], a: 0, val: 1, noCount: true, hint: '先數空格，再決定要搬幾顆。', ok: '對了，還空 1 格，搬 1 顆就滿 10。' },
    { t: 'pick', say: '搬好了。10 顆和 3 顆，一共有幾顆？', show: { s: 'frameLoose', a: 10, b: 3, item: 'apple' }, opts: [12, 13, 14], a: 1, val: 13, ok: '對了，你把 4 分成 1 和 3，先湊 10，再加 3，是 13。' }] },
  measure: { title: '幾根長', beats: [
    L('長長想知道，這條小路有多長。'),
    { t: 'lay', say: '用一樣長的迴紋針，從左邊一根接一根排。', unit: 'clip', n: 4 },
    L('一根接一根，不重疊，也不留空。排了 4 根，這條路就是 4 根迴紋針長。', '幾根長'),
    { t: 'pick', say: '兩條路一樣長。哪一條排得對？', show: { s: 'lay2', unit: 'clip', rows: [{ label: '上面', n: 4, gap: true }, { label: '下面', n: 5 }] }, opts: ['上面', '下面'], a: 1, noCount: true, hint: '看看迴紋針中間，有沒有空著。', ok: '對了，下面一根接一根，沒有留空，這條路是 5 根長。' },
    { t: 'lay', say: '換腳印卡。用一樣大的腳印，一個接一個排。', unit: 'foot', n: 3 }] },
  sub18: { title: '先減到剩 10', beats: [
    L('小熊熊有 12 罐蜂蜜，要吃掉 5 罐。還剩幾罐呢？'),
    { t: 'tapOff', frames: true, say: '先點外面的 2 罐，再點框裡的 3 罐。', item: 'honey', n: 12, off: 5, ok: '吃掉 5 罐了。' },
    { t: 'pick', say: '吃掉的 5 罐：外面 2 罐，框裡幾罐？', show: { s: 'frames2', item: 'honey', out: 2, goneOut: 2, goneIn: 3 }, opts: [2, 3, 5], a: 1, val: 3, noCount: true, hint: '數一數框裡淡淡的罐子。', ok: '對了，5 罐是外面 2 罐和框裡 3 罐。' },
    L('12－5：先拿走外面 2 罐，剩 10 罐；再拿走 3 罐，剩 7 罐。', '先減到剩 10'),
    { t: 'tapOff', frames: true, say: '換蘑菇。11 朵拿走 4 朵，先拿外面的。', item: 'mush', n: 11, off: 4, ok: '拿走 4 朵了。' },
    { t: 'pick', say: '11 朵拿走 4 朵，還剩幾朵？', show: { s: 'frames2', item: 'mush', out: 1, goneOut: 1, goneIn: 3 }, opts: [6, 7, 8], a: 1, val: 7, ok: '對了，先拿 1 朵剩 10 朵，再拿 3 朵，剩 7 朵。' }] },
  puzzle: { title: '拼成', beats: [
    L('路標破成兩片了。刺刺想把它拼回去。'),
    { t: 'puzzle', say: '把兩片三角形拖到框裡，拼起來。', slots: [{ shape: 'tri', pts: '30,30 210,30 30,210', c: '#f2b632' }, { shape: 'tri', pts: '210,30 210,210 30,210', c: '#57b84a' }], ok: '拼好了，是一個正方形。' },
    L('這兩片三角形，剛好拼成一個正方形。', '拼成'),
    { t: 'pick', say: '這塊路標轉了方向。它還是正方形嗎？', show: { s: 'puzzle', slots: [{ shape: 'tri', pts: '120,20 220,120 20,120', c: '#f2b632' }, { shape: 'tri', pts: '220,120 120,220 20,120', c: '#57b84a' }] }, opts: ['是', '不是'], a: 0, hint: '想像把它轉回來，看看是什麼形狀。', ok: '對了，只是轉了方向，還是那個正方形。' },
    { t: 'puzzle', say: '換小房子。用三角形和正方形拼拼看。', slots: [{ shape: 'tri', pts: '30,110 120,30 210,110', c: '#e0648a' }, { shape: 'square', pts: '60,110 180,110 180,230 60,230', c: '#f2b632' }], ok: '拼好了，一個三角形和一個正方形，拼成小房子。' }] },
  calendar: { title: '昨天、今天、明天', beats: [
    L('咕咕在月曆上畫了星星。在這個故事裡，有星星的那天是今天。'),
    { t: 'cal', say: '點有星星的那一天。', month: 5, days: 31, start: 3, today: 14, ans: [14], ok: '對了，5 月 14 日是今天。' },
    L('今天的前一天是昨天，後一天是明天。', '昨天、今天、明天'),
    { t: 'cal', say: '換一個月。明天在哪裡？點一下。', month: 6, days: 30, start: 6, today: 9, ans: [10], hint: '明天是星星的後一天。看在閃的格子。', ok: '對了，9 日的後一天是 10 日，10 日是明天。' },
    { t: 'pick', say: '今天是 5 月 31 日。明天是幾月幾日？', show: { s: 'cal', month: 5, days: 31, start: 3, today: 31 }, opts: ['5 月 30 日', '5 月 32 日', '6 月 1 日'], a: 2, hint: '5 月最後一天是 31 日。過完 5 月，就到 6 月。', ok: '對了，5 月只到 31 日，明天是 6 月 1 日。' }] },
  shop: { title: '元', beats: [
    L('吱吱賣蘋果，一顆 3 元。要付錢才能拿。'),
    { t: 'coin', say: '付 3 元。把錢拖到盤子上，再按付錢。', target: 3, avail: [1, 5], thing: 'apple' },
    L('錢用「元」來說。5 個 1 元是 5 元，1 個 5 元也是 5 元，一樣多。', '元'),
    { t: 'coin', say: '換蜂蜜。付 6 元，哪一種錢都可以用。', target: 6, avail: [1, 5], thing: 'honey' }] },
  add2d: { title: '整捆、單根', beats: [
    L('吱吱的樹枝有整捆，也有一根一根的。每捆都是 10 根。'),
    { t: 'sort', say: '整捆放一邊，單根放一邊。', items: [{ ic: 'bundle', tag: 'b' }, { ic: 'stick', tag: 's' }, { ic: 'bundle', tag: 'b' }, { ic: 'stick', tag: 's' }, { ic: 'stick', tag: 's' }], bins: [{ id: 'b', ic: 'bundle', label: '整捆' }, { id: 's', ic: 'stick', label: '單根' }], hint: '綁起來的放整捆，一根的放單根。', ok: '分好了：2 捆放一邊，3 根放一邊。' },
    L('每捆 10 根。整捆和整捆合起來，單根和單根合起來。', '整捆、單根'),
    { t: 'pick', say: '23 根和 14 根，合起來一共幾根？', show: { s: 'twoS', kind: 'sticks', a: 23, b: 14, sign: '＋' }, opts: [10, 37, 47], a: 1, val: 37, hint: '整捆和整捆一起數，單根和單根一起數。', ok: '對了，2 捆和 1 捆是 3 捆，3 根和 4 根是 7 根，一共 37 根。' },
    { t: 'tapOff', sticks: true, say: '改試減法。有 2 捆 3 根，搬走 1 捆和 1 根。', tn: 2, on: 3, mt: 1, mo: 1 },
    { t: 'pick', say: '23 根搬走 11 根，還剩幾根？', show: { s: 'sticks', t: 1, o: 2, goneT: 1, goneO: 1 }, opts: [12, 13, 22], a: 0, val: 12, ok: '對了，整捆剩 1 捆，單根剩 2 根，一共 12 根。' }] },
  record: { title: '分一分', beats: [
    L('地上有好多東西。跳跳不知道怎麼收。'),
    { t: 'sort', say: '先按種類分：紙放紙桶，瓶子放瓶子桶。', items: [{ ic: 'paper_r', tag: 'paper' }, { ic: 'bottle_b', tag: 'bottle' }, { ic: 'paper_b', tag: 'paper' }, { ic: 'bottle_r', tag: 'bottle' }], bins: [{ id: 'paper', label: '紙', bin: true }, { id: 'bottle', label: '瓶子', bin: true }], hint: '紙放紙桶，瓶子放瓶子桶。看在閃的那一桶。', ok: '分好了：紙 2 張，瓶子 2 個。' },
    { t: 'sort', say: '同樣的東西，換按顏色分：紅的一桶，藍的一桶。', items: [{ ic: 'paper_r', tag: 'r' }, { ic: 'bottle_b', tag: 'b' }, { ic: 'paper_b', tag: 'b' }, { ic: 'bottle_r', tag: 'r' }], bins: [{ id: 'r', label: '紅色', bin: true, tint: 'r' }, { id: 'b', label: '藍色', bin: true, tint: 'b' }], hint: '紅的放紅色桶，藍的放藍色桶。', ok: '分好了。紅瓶子這次和紅紙放在一起了。' },
    L('一樣的放在一起，就是分一分。換一種分法，同一個東西可能換到另一桶。', '分一分'),
    { t: 'record', say: '又撿到一些。紙、瓶子各有幾個？一個畫一個記號。', rows: REC_ROWS },
    { t: 'pick', say: '看這張紀錄：哪一種比較多？', show: { s: 'tally', rows: REC_ROWS }, opts: ['紙', '瓶子'], a: 0, noCount: true, hint: '一個對一個比，哪一排多出來？', ok: '對了，紙有 3 個，瓶子有 2 個，紙比較多。' }] },
};
if (typeof module !== 'undefined') module.exports = { STORY, LESSONS }; else { root.STORY = STORY; root.LESSONS = LESSONS; }
})(this);
