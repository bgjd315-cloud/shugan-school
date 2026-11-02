// 故事與新概念小故事。全部自編。
// LESSONS 每站四拍：小麻煩 → 孩子動手試 → 才說出新詞 → 換一個東西再試一次
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
const LESSONS = {
  count10: { title: '一共有幾個', beats: [L('小熊熊想知道，有幾隻螢火蟲。一隻一隻點吧！'), { t: 'count', say: '點一隻，亮一隻。', item: 'fly', n: 3 }, L('最後數到 3，就是一共有 3 隻。', '一共'), { t: 'dragN', say: '換松果。放 4 顆到籃子裡。', item: 'pine', total: 6, n: 4 }] },
  long: { title: '比較長', beats: [L('兩隻毛毛蟲站得不一樣。誰長呢？先排好！'), { t: 'align', say: '把毛毛蟲拉到起跑線。', bars: [{ c: '#57b84a', label: '綠色', len: 3 }, { c: '#4f9ad6', label: '藍色', len: 6 }] }, L('排好再看。藍色多出來，藍色比較長。', '比較長'), { t: 'align', v: true, say: '換小動物。讓牠們站到地上。', bars: [{ ani: 'bear', label: '小熊熊', len: 7 }, { ani: 'mouse', label: '吱吱', len: 4 }] }] },
  split: { title: '分成', beats: [L('刺刺有 4 顆果子，要放兩個盤子。'), { t: 'split', say: '把 4 顆果子放進兩個盤子。兩盤都要有。', item: 'apple', n: 4 }, L('一樣是 4 顆，可以分成不一樣的兩份。', '分成'), { t: 'split', say: '換梨子。把 5 顆放進兩個盤子。', item: 'pear', n: 5 }] },
  order: { title: '第幾隻', beats: [L('大家排隊。呱寶要請排在最前面的吃冰。'), { t: 'tapOne', say: '誰排最前面？點牠。', line: [{ ani: 'bear', label: '小熊熊' }, { ani: 'mouse', label: '吱吱' }, { ani: 'bunny', label: '跳跳' }, { ani: 'duck', label: '呱寶' }], ans: 0, from: 'front' }, L('最前面是第 1 隻，下一隻是第 2 隻。', '第幾隻'), { t: 'tapOne', say: '換一隊。從前面數，第 2 隻是誰？點牠。', line: [{ ani: 'owl', label: '咕咕' }, { ani: 'squirrel', label: '果果' }, { ani: 'hedgehog', label: '刺刺' }], ans: 1, from: 'front' }] },
  count30: { title: '一串', beats: [L('果子太多，果果數到亂掉了。'), { t: 'strand', say: '一顆一顆點，串起來。', item: 'bead', n: 12 }, L('滿 10 顆就是一串。看到一串，就知道有 10 顆。', '一串'), { t: 'strand', say: '換樹枝。每 10 根綁一捆。', item: 'stick', n: 11 }] },
  add: { title: '加起來', beats: [L('船上有兩種小動物。全部有幾隻呢？'), { t: 'board', say: '讓牠們上船。', a: 2, b: 1, who: [{ ani: 'duck', label: '呱寶' }, { ani: 'bunny', label: '跳跳' }] }, L('放在一起數全部，就是加起來。', '加起來'), { t: 'pick', say: '換蘋果。2 顆和 2 顆，加起來幾顆？', show: { s: 'two', a: { item: 'apple', n: 2 }, b: { item: 'apple', n: 2 }, sign: '＋' }, opts: [3, 4, 5], a: 1, val: 4 }] },
  shape: { title: '會滾、能疊', beats: [L('跳跳的東西亂滾，怎麼辦？推推看！'), { t: 'tryIt', say: '點一點，推推看。', items: ['ball', 'cube'] }, L('圓圓的球會滾。方方的方塊能疊高。', '會滾、能疊'), { t: 'pick', say: '換一個。哪一個會滾？', opts: [{ ic: 'box', label: '長盒子' }, { ic: 'ball', label: '球' }], a: 1 }] },
  sub: { title: '減', beats: [L('樹上有 4 隻小鳥。有 1 隻想飛走。'), { t: 'tapOff', say: '點 1 隻小鳥，讓牠飛走。', item: 'bird', n: 4, off: 1 }, L('拿走了，就變少了，這就是減。', '減'), { t: 'tapOff', say: '換蘋果。吃掉 2 顆。', item: 'apple', n: 5, off: 2 }] },
  clock: { title: '幾點半', beats: [L('咕咕要 3 點吃點心。鐘要撥好！'), { t: 'clock', say: '短針指 3，長針指 12。', h: 3, half: false }, L('長針走到 6，就是過了一半，叫做幾點半。', '幾點半'), { t: 'clock', say: '再試一次。撥到 4 點半。', h: 4, half: true }] },
  count100: { title: '一捆', beats: [L('樹枝一根一根，好難拿。有一捆綁好的！'), { t: 'openB', say: '點樹枝捆，把它打開。' }, L('打開有 10 根。10 根綁起來，就是 1 捆。', '一捆'), { t: 'strand', say: '換你綁。每 10 根綁一捆。', item: 'stick', n: 12 }] },
  add18: { title: '湊滿 10', beats: [L('跳跳有兩堆蘑菇，一朵一朵數好久。'), { t: 'frameAdd', say: '把蘑菇搬過來，先排滿 10 格。', a: 8, b: 3, item: 'mush' }, L('滿 10 格，再看多幾朵，一下就知道了。', '湊滿 10'), { t: 'frameAdd', say: '換蘋果。先排滿 10 格。', a: 9, b: 4, item: 'apple' }] },
  measure: { title: '幾根長', beats: [L('長長想知道，小路有多長。'), { t: 'lay', say: '用迴紋針，排滿這條路。', unit: 'clip', n: 4 }, L('排了 4 根，這條路就是 4 根長。', '幾根長'), { t: 'lay', say: '換腳印。走完這條路。', unit: 'foot', n: 3 }] },
  sub18: { title: '先吃到 10', beats: [L('小熊熊有 12 罐蜂蜜，要吃掉 5 罐。'), { t: 'tapOff', frames: true, say: '吃掉 5 格。先吃外面的，再吃十格盤。', item: 'honey', n: 12, off: 5 }, L('先吃到剩 10，再繼續吃，就好算了。', '先吃到 10'), { t: 'tapOff', frames: true, say: '換蘑菇。拿走 4 朵，先拿外面的。', item: 'mush', n: 11, off: 4 }] },
  puzzle: { title: '拼成', beats: [L('路標破成兩塊了。刺刺想把它拼回去。'), { t: 'puzzle', say: '把形狀拖到框裡，拼起來。', slots: [{ shape: 'tri', pts: '30,30 210,30 30,210', c: '#f2b632' }, { shape: 'tri', pts: '210,30 210,210 30,210', c: '#57b84a' }] }, L('兩個三角形，可以拼成一個大方塊。', '拼成'), { t: 'puzzle', say: '換小房子。拼拼看。', slots: [{ shape: 'tri', pts: '30,110 120,30 210,110', c: '#e0648a' }, { shape: 'square', pts: '60,110 180,110 180,230 60,230', c: '#f2b632' }] }] },
  calendar: { title: '昨天、今天、明天', beats: [L('咕咕在月曆上畫了星星。星星就是今天。'), { t: 'cal', say: '點有星星的那一天。', month: 5, days: 31, start: 3, today: 14, ans: [14] }, L('今天的前一天是昨天，後一天是明天。', '昨天、今天、明天'), { t: 'cal', say: '換一天。明天在哪裡？點一下。', month: 6, days: 30, start: 6, today: 9, ans: [10] }] },
  shop: { title: '元', beats: [L('吱吱賣蘋果，一顆 3 元。要付錢才能拿。'), { t: 'coin', say: '付 3 元。把錢拖到盤子上。', target: 3, avail: [1, 5], thing: 'apple' }, L('錢用「元」來說。5 個 1 元和 1 個 5 元一樣多。', '元'), { t: 'coin', say: '換蜂蜜。付 6 元。', target: 6, avail: [1, 5], thing: 'honey' }] },
  add2d: { title: '整捆、單根', beats: [L('吱吱的樹枝有整捆，也有一根一根的。'), { t: 'sort', say: '整捆放一邊，單根放一邊。', items: [{ ic: 'bundle', tag: 'b' }, { ic: 'stick', tag: 's' }, { ic: 'bundle', tag: 'b' }], bins: [{ id: 'b', ic: 'bundle', label: '整捆' }, { id: 's', ic: 'stick', label: '單根' }] }, L('整捆和整捆一起算，單根和單根一起算。', '整捆、單根'), { t: 'tapOff', sticks: true, say: '換搬走。搬走 1 捆和 1 根。', tn: 2, on: 3, mt: 1, mo: 1 }] },
  record: { title: '分一分', beats: [L('地上有好多東西。跳跳不知道怎麼收。'), { t: 'sort', say: '一樣的放一起。拖進桶子。', items: [{ ic: 'paper_b', tag: 'paper' }, { ic: 'bottle_g', tag: 'bottle' }, { ic: 'paper_r', tag: 'paper' }], bins: [{ id: 'paper', label: '紙', bin: true }, { id: 'bottle', label: '瓶子', bin: true }] }, L('一樣的放在一起，就是分一分。', '分一分'), { t: 'sort', say: '換顏色來分。', items: [{ ic: 'tin_r', tag: 'r' }, { ic: 'tin_b', tag: 'b' }, { ic: 'bottle_r', tag: 'r' }], bins: [{ id: 'r', label: '紅色', bin: true, tint: 'r' }, { id: 'b', label: '藍色', bin: true, tint: 'b' }] }] },
};
if (typeof module !== 'undefined') module.exports = { STORY, LESSONS }; else { root.STORY = STORY; root.LESSONS = LESSONS; }
})(this);
