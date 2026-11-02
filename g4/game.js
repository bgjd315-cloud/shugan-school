const ZY_CHAR = {}, ZY_PHRASE = []; // 四年級不加注音
// 數感小鎮：畫面與互動
const $app = document.getElementById('app');
const ROUND = 6;
const GAMES = {
  big: { name: '大數控制室', tip: '一億以內', sem: '四上', need: 0 },
  mul: { name: '乘法裝配線', tip: '切開來乘', sem: '四上・四下', need: 0 },
  deg: { name: '角度導航台', tip: '量角度', sem: '四上', need: 0 },
  divv: { name: '分裝倉庫', tip: '試商', sem: '四上・四下', need: 0 },
  tri: { name: '三角機翼廠', tip: '三角形、全等', sem: '四上', need: 0 },
  fra: { name: '分數燃料站', tip: '假分數、帶分數', sem: '四上・四下', need: 0 },
  pat: { name: '密碼規律室', tip: '找規律', sem: '四上', need: 0 },
  mix: { name: '採購併式處', tip: '先算哪裡', sem: '四上', need: 0 },
  dec: { name: '精密小數台', tip: '二位小數', sem: '四上・四下', need: 0 },
  km: { name: '公里跑道', tip: '公里', sem: '四上', need: 0 },
  quad: { name: '四邊艙板廠', tip: '垂直平行、四邊形', sem: '四下', need: 0 },
  est: { name: '概數估算室', tip: '四捨五入', sem: '四下', need: 0 },
  chart: { name: '圖表觀測台', tip: '長條、折線', sem: '四下', need: 0 },
  deck: { name: '甲板工程處', tip: '周長、面積', sem: '四下', need: 0 },
  eqv: { name: '等值分數廚房', tip: '等值分數', sem: '四下', need: 0 },
  time: { name: '時刻調度室', tip: '24 小時制', sem: '四下', need: 0 },
  vol: { name: '體積貨艙', tip: '立方公分', sem: '四下', need: 0 },
};
const availKeys = () => Object.keys(GAMES);
const ROUNDS_TO_SAVE = 3; // 每個地方玩幾回合就把居民救回來
const BOSS_ORDER = ['big', 'mul', 'deg', 'divv', 'fra', 'dec'];
const ART = ['liang', 'liang_cheer', 'liang_think', 'mimi', 'mimi_happy', 'wanwan', 'piece', 'chest', 'sky_dark', 'sky_bright', 'finale', 'seal', 'turtle', 'octopus', 'crab', 'goat', 'otter', 'bee', 'rabbit', 'fox', 'sheep', 'pelican', 'raccoon', 'isl_big', 'isl_mul', 'isl_deg', 'isl_divv', 'isl_tri', 'isl_fra', 'isl_pat', 'isl_mix', 'isl_dec', 'isl_km', 'isl_quad', 'isl_est', 'isl_chart', 'isl_deck', 'isl_eqv', 'isl_time', 'isl_vol'];
const HAS = {}; // 圖還沒收齊時，畫面照樣能玩
const artUrl = n => `assets/${n}.webp`;
const artImg = (n, cls) => HAS[n] ? `<img class="${cls || ''}" src="${artUrl(n)}" alt="">` : '';
const bgStyle = n => HAS[n] ? `background-image:url(${artUrl(n)})` : '';
function preloadArt() {
  return Promise.all(ART.map(n => new Promise(ok => { const i = new Image(); i.onload = () => { HAS[n] = true; ok(); }; i.onerror = () => ok(); i.src = artUrl(n); })));
}

/* ---------- 存檔 ---------- */
const SAVE_KEY = 'shugan4-v1';
const MOON = 384400;
function load() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) return s; } catch (e) {}
  return null;
}
const PIECE_KEYS = ['big', 'mul', 'deg', 'divv', 'tri', 'fra', 'pat', 'mix', 'dec', 'km']; // 四上十個零件，集滿才能發射
const S = Object.assign({ stars: 0, unit: 5, sound: true, rec: {}, log: [], opened: false, prog: {}, bossDone: false, bossSeen: false, stamps: {}, fast: {}, learned: {} }, load() || {});
S.unit = 20; // 全部單元開放
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
const rec = g => S.rec[g] || (S.rec[g] = { lv: 0, up: 0, down: 0 });

/* ---------- 小工具 ---------- */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const N = x => `<span class="num">${x}</span>`;
function nums(s) { return String(s).replace(/\d+/g, m => N(m)); } // 文字裡的數字換成數字字型
const sgn = h => (h > 0 ? '+' : '−') + Math.abs(h);
let audio;
function beep(notes) {
  if (!S.sound) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    notes.forEach(([f, t]) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(.12, audio.currentTime + t);
      g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + t + .22);
      o.connect(g).connect(audio.destination);
      o.start(audio.currentTime + t); o.stop(audio.currentTime + t + .24);
    });
  } catch (e) {}
}
const sfx = { good: () => beep([[523, 0], [659, .1], [784, .2]]), ok: () => beep([[523, 0], [659, .1]]), hop: () => beep([[440, 0]]), retry: () => beep([[330, 0]]) };
function speak(text) {
  try {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, '').replace(/×/g, '乘以').replace(/＋/g, '加').replace(/－/g, '減').replace(/□/g, '多少'));
    u.lang = 'zh-TW'; u.rate = .9;
    speechSynthesis.speak(u);
  } catch (e) {}
}

/* ---------- 注音：直排在國字右邊，家長頁不加 ---------- */
const HAN = /[\u4e00-\u9fff]/;
function bp(r) { return String();
  let s = r || '', top = '', tone = '';
  if (s[0] === '˙') { top = '<i class="qing">˙</i>'; s = s.slice(1); }
  if (/[ˊˇˋ]$/.test(s)) { tone = `<i class="tone">${s.slice(-1)}</i>`; s = s.slice(0, -1); }
  return `<span class="bp" aria-hidden="true">${top}${[...s].map(x => `<span>${x}</span>`).join('')}${tone}</span>`;
}
// 把文字切成一組一組：國字連同注音、緊跟的標點黏在一起，換行才不會讓標點跑到行首
function zyGroups(text) {
  const chars = [...text], rd = new Array(chars.length).fill(null);
  for (let i = 0; i < chars.length; i++) {
    if (rd[i] || !HAN.test(chars[i])) continue;
    const hit = ZY_PHRASE.find(([w]) => chars.slice(i, i + [...w].length).join('') === w);
    if (hit) {
      let k = 0;
      [...hit[0]].forEach((c, j) => { if (HAN.test(c)) rd[i + j] = hit[1][k++]; });
    } else rd[i] = ZY_CHAR[chars[i]] || '';
  }
  const out = [];
  chars.forEach((c, i) => {
    if (HAN.test(c)) out.push(`<span class="zc">${c}${bp(rd[i])}</span>`);
    else if (/[，。！？、：；）」⋯…]/.test(c) && out.length && out[out.length - 1].endsWith('</span>')) out[out.length - 1] = out[out.length - 1].replace(/<\/span>$/, esc(c) + '</span>');
    else out.push(esc(c));
  });
  return out;
}
function annotate(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [];
  while (w.nextNode()) {
    const n = w.currentNode, el = n.parentElement;
    if (HAN.test(n.nodeValue) && !el.closest('.zc, .parent, text')) nodes.push(n);
  }
  nodes.forEach(n => {
    const t = document.createElement('template');
    t.innerHTML = zyGroups(n.nodeValue).join('');
    n.replaceWith(t.content);
  });
}
const plainText = el => { const c = el.cloneNode(true); c.querySelectorAll('.bp').forEach(b => b.remove()); return c.textContent; };

/* ---------- 回合 ---------- */
let R = null; // 目前這一回合
function startRound(game, opts) {
  const boss = game === 'boss', daily = game === 'daily';
  const order = boss ? BOSS_ORDER : daily ? dailyOrder() : null;
  R = { game: order ? order[0] : game, chapter: game, boss, daily, order, fixedLv: opts && opts.lv, i: 0, grades: [], earned: 0, q: null, tries: 0 };
  nextQ();
}
function nextQ() {
  if (!R) return go('');
  if (R.i >= ROUND) return endRound();
  if (R.order) R.game = R.order[R.i];
  let q, guard = 0;
  do { q = Logic.gen(R.game, R.fixedLv !== undefined ? R.fixedLv : rec(R.game).lv, S.unit); } while (R.lastKey === JSON.stringify(q) && guard++ < 8);
  R.lastKey = JSON.stringify(q);
  R.q = q; R.tries = 0;
  conceptThen(q, () => VIEWS[R.game](q));
}
// 一題結束：grade 2 第一次就很棒、1 第二次或差一點、0 沒答出來
const reveal = sel => setTimeout(() => { const e = document.querySelector(sel); if (e) e.scrollIntoView({ block: 'nearest' }); }, 40); // 等注音排好才捲動，字變高才不會又把按鈕擠出去
function finish(grade, detail, msgHtml) {
  const r = rec(R.game);
  if (R.fixedLv === undefined) Logic.adjust(r, grade, Logic.maxLevel(R.game, S.unit)); // 練習場不動等級
  if (R.q) { const fk = R.q.kind + ':' + R.q.mode; S.fast[fk] = grade === 2 ? (S.fast[fk] || 0) + 1 : 0; } // 熟練紀錄
  R.grades.push(grade); R.earned += grade * 500; S.stars += grade * 500;
  S.log.push({ g: R.game, lv: r.lv, gr: grade, d: detail, t: Date.now() });
  if (S.log.length > 300) S.log = S.log.slice(-300);
  save();
  if (grade === 2) sfx.good(); else if (grade === 1) sfx.ok();
  setMsg(msgHtml, grade ? 'good' : 'hint');
  R.i++;
  const a = document.getElementById('actions');
  a.innerHTML = `<button class="btn" id="next">${R.i >= ROUND ? '看成果' : '下一題'}</button>`;
  document.getElementById('next').onclick = nextQ;
  document.querySelectorAll('.keypad, .entry').forEach(x => { x.style.display = 'none'; }); // 答完收起鍵盤，下一題才不會被擠到畫面外
  reveal('#actions');
}
function setMsg(html, cls) {
  const m = document.getElementById('msg');
  if (m) { m.className = 'msg ' + (cls || ''); m.innerHTML = html; }
}
function semOf(q) { // 這一題屬於哪一學期
  if (!q) return '';
  if (['quad', 'est', 'chart', 'deck', 'eqv', 'time', 'vol'].includes(q.kind)) return '四下';
  if ((q.kind === 'mul' && q.mode === 'zero') || (q.kind === 'mul' && q.mode === 'rows' && q.b >= 100) || (q.kind === 'divv' && (q.mode === 'zero' || q.d >= 100)) || (q.kind === 'fra' && ['calc', 'times', 'cmp'].includes(q.mode)) || (q.kind === 'dec' && q.mode === 'times')) return '四下';
  return '四上';
}
function frame(promptHtml, stageHtml, extra) {
  const dots = Array.from({ length: ROUND }, (_, i) => `<i class="${i < R.grades.length ? 'g' + R.grades[i] : i === R.i ? 'now' : ''}"></i>`).join('');
  $app.innerHTML = `
    <div class="top">
      <button class="icon-btn" id="home" aria-label="回地圖">⌂</button>
      <div class="dots">${dots}</div><span class="sem">${semOf(R.q)}</span>
      ${conceptsOf(R.game).length || LESSON_BEFORE[R.game] ? '<button class="icon-btn" id="cpt" aria-label="新概念小故事">💡</button>' : ''}<button class="icon-btn" id="say" aria-label="唸題目">🔊</button>
    </div>
    <div class="say-row">${artImg(R.boss ? 'mimi' : R.daily ? 'liang' : STORY[R.game].who, 'say-who')}<div class="prompt" id="prompt">${promptHtml}</div></div>
    <div class="stage" id="stage">${stageHtml}</div>
    <div class="msg" id="msg"></div>
    ${extra || ''}
    <div class="actions" id="actions"></div>`;
  { const c4 = document.getElementById('cpt'); if (c4) c4.onclick = () => viewConcepts(R.game, () => VIEWS[R.game](R.q)); }
  document.getElementById('home').onclick = () => { R = null; go(''); };
  document.getElementById('say').onclick = () => speak(plainText(document.getElementById('prompt')));
}
function endRound() {
  const ch = R.chapter, boss = R.boss;
  let beat = null;
  if (R.daily) S.stamps[today()] = 1;
  if (boss) { if (!S.bossDone) { S.bossDone = true; S.stars = Math.max(S.stars, MOON); beat = 'ending'; } }
  else if (STORY[ch] && R.fixedLv === undefined) {
    const before = S.prog[ch] || 0;
    if (before < ROUNDS_TO_SAVE) { S.prog[ch] = before + 1; beat = STORY[ch].beats[before + 1]; }
  }
  save();
  const praise = boss ? '發射成功！' : R.daily ? '今天的任務完成了，蓋一個章！' : R.fixedLv !== undefined ? '多練一次，就更有感覺。' : '這個工坊又完成一部分。';
  $app.innerHTML = `<div class="end pop">
    ${artImg('liang_cheer', 'end-hero')}
    <h2>飛船又飛了 ${N(fmt(R.earned))} 公里</h2>
    <p>${praise}</p>
    <div class="actions" id="endActs"></div></div>`;
  const a = document.getElementById('endActs');
  if (beat) {
    a.innerHTML = '<button class="btn" id="cont">看故事</button>';
    document.getElementById('cont').onclick = () => {
      if (beat === 'ending') return playEnding();
      const n = S.prog[ch], after = () => { R = null; if (n >= ROUNDS_TO_SAVE) return showClue(ch); go(''); };
      comic(STORY[ch].bg, beat, after);
    };
    return;
  }
  a.innerHTML = '<button class="btn" id="again">再玩一回</button><button class="btn alt" id="back">回地圖</button>';
  document.getElementById('again').onclick = () => startRound(ch, R.fixedLv !== undefined ? { lv: R.fixedLv } : undefined);
  document.getElementById('back').onclick = () => { R = null; go(''); };
}

/* ---------- 故事畫面 ---------- */
function typeInto(el, text) {
  // 一個字一個字出現；再按一次就全部顯示
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.innerHTML = zyGroups(text).map(g => `<span class="${/^\d$/.test(g) ? 'num ' : ''}ch">${g}</span>`).join('');
  const chars = [...el.children];
  let i = 0, timer = null;
  const finish = () => { clearInterval(timer); timer = null; chars.forEach(c => c.classList.add('on')); };
  if (reduce) finish(); else timer = setInterval(() => { if (i >= chars.length) return finish(); chars[i++].classList.add('on'); }, 42);
  return { typing: () => timer !== null, finish };
}
function comic(bg, lines, then, opts) {
  let i = 0, typer = null;
  function next() {
    if (typer && typer.typing()) return typer.finish();
    try { speechSynthesis.cancel(); } catch (e) {}
    if (++i < lines.length) show(); else leave();
  }
  function leave() { document.body.classList.remove('in-cine'); then(); }
  function show() {
    const [who, name, text, lineBg] = lines[i];
    const b = lineBg && HAS[lineBg] ? lineBg : bg, misty = b === 'town_fog' || b === 'fog_cave';
    document.body.classList.add('in-cine');
    $app.innerHTML = `<div class="cine" id="cine">
      <div class="cine-blur" style="${bgStyle(b)}"></div>
      <div class="scene" style="${bgStyle(b)}">${misty ? '<div class="drift d1"></div><div class="drift d2"></div>' : ''}${who ? artImg(who, 'scene-who rise') : ''}</div>
      <div class="bubble ${who ? '' : 'narr'}">${name ? `<b>${name}</b>` : ''}<p id="line"></p></div>
      <div class="cine-acts">
        <button class="icon-btn" id="say" aria-label="唸出來">🔊</button>
        <button class="btn" id="go">${i + 1 < lines.length ? '繼續' : (opts && opts.last) || '好！'}</button>
        ${opts && opts.skip ? '<button class="skip" id="skip">跳過</button>' : ''}
      </div></div>`;
    typer = typeInto(document.getElementById('line'), text);
    document.getElementById('say').onclick = e => { e.stopPropagation(); speak(text); };
    document.getElementById('go').onclick = e => { e.stopPropagation(); next(); };
    if (opts && opts.skip) document.getElementById('skip').onclick = e => { e.stopPropagation(); leave(); };
    document.getElementById('cine').onclick = next;
  }
  show();
}
function playEnding() {
  let i = 0;
  (function step() {
    if (i >= BOSS.ending.length) { R = null; return go(''); }
    const e = BOSS.ending[i++];
    comic(e.bg, [e.who], step);
  })();
}
function showClue(ch) {
  const c = STORY[ch].clue;
  $app.innerHTML = `<div class="end pop">
    ${artImg('piece', 'clue-big')}
    <h2>找到了！</h2><p><b>${c.name}</b><br>${c.text}</p>
    <div class="actions"><button class="btn" id="ok">裝上飛船</button></div></div>`;
  document.getElementById('ok').onclick = () => go('');
}
function viewClues() {
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="home" aria-label="回地圖">⌂</button><h2 class="page-h">飛船零件</h2></div>
    <p class="tag">集滿四上十個零件就能發射。</p>
    <div class="clues">${availKeys().map(k => {
      const has = (S.prog[k] || 0) >= ROUNDS_TO_SAVE, c = STORY[k].clue;
      return `<div class="clue ${has ? '' : 'off'}">${has ? artImg('piece', 'clue-img') : '<div class="clue-q">？</div>'}<div><b>${has ? c.name : '還沒找到'}</b><small>${has ? c.text : `幫${STORY[k].whoName}的忙就會找到`}</small></div></div>`;
    }).join('')}</div>`;
  document.getElementById('home').onclick = () => go('');
}
const today = () => new Date().toLocaleDateString('sv');
// 每日任務：挑最近最常卡住的遊戲，再混入其他遊戲複習
function dailyOrder() {
  const keys = availKeys();
  const miss = k => S.log.filter(x => x.g === k).slice(-12).filter(x => x.gr < 2).length;
  const sorted = keys.slice().sort((a, b) => miss(b) - miss(a) || Math.random() - .5);
  return Logic.shuffle([sorted[0], sorted[0], sorted[1], sorted[1], ...Logic.shuffle(sorted.slice(2)).slice(0, 2)]);
}
function practiceTopics() {
  return [["big", 0, "撥大數", 1], ["big", 1, "念大數", 1], ["big", 2, "數鈔票", 1], ["big", 3, "體育場有幾座", 1], ["big", 4, "比大小", 1], ["big", 5, "以萬為單位加減", 1], ["mul", 0, "幾千乘以一位", 1], ["mul", 1, "乘以幾十", 1], ["mul", 2, "切成四塊乘", 1], ["mul", 3, "三位乘二位", 1], ["mul", 4, "末位有 0", 11], ["mul", 5, "三位乘三位", 11], ["deg", 0, "讀量角器", 1], ["deg", 1, "轉到指定角度", 1], ["deg", 2, "銳角鈍角平角周角", 1], ["deg", 3, "鐘面旋轉", 1], ["deg", 4, "角的合成與分解", 1], ["divv", 0, "一箱一箱裝", 1], ["divv", 1, "試商：一位", 1], ["divv", 2, "試商：二位", 1], ["divv", 3, "末位有 0", 11], ["divv", 4, "除以三位數", 11], ["tri", 0, "看角分類", 1], ["tri", 1, "看邊分類", 1], ["tri", 2, "旋轉翻轉疊合", 1], ["tri", 3, "全等的對應邊", 1], ["fra", 0, "真假帶分數", 1], ["fra", 1, "假分數裝盒", 1], ["fra", 2, "帶分數拆盒", 1], ["fra", 3, "數線上的分數", 1], ["fra", 4, "同分母加減", 11], ["fra", 5, "分數的整數倍", 11], ["fra", 6, "分數比大小", 11], ["pat", 0, "百數表", 1], ["pat", 1, "座位編碼", 1], ["pat", 2, "圖形旋轉", 1], ["pat", 3, "奇數與偶數", 1], ["mix", 0, "加減由左到右", 1], ["mix", 1, "乘除由左到右", 1], ["mix", 2, "先乘除後加減", 1], ["mix", 3, "括號先算", 1], ["mix", 4, "寫出併式", 1], ["dec", 0, "百格板", 1], ["dec", 1, "公分換公尺", 1], ["dec", 2, "小數比大小", 1], ["dec", 3, "二位小數加減", 1], ["dec", 4, "小數乘一位整數", 11], ["dec", 5, "小數乘二位整數", 11], ["km", 0, "跑滿一公里", 1], ["km", 1, "公里換公尺", 1], ["km", 2, "公尺換公里", 1], ["km", 3, "路程加減", 1], ["km", 4, "路程的倍數", 1], ["km", 5, "距離量感", 1], ["quad", 0, "垂直與平行", 11], ["quad", 1, "四邊形名稱", 11], ["quad", 2, "幾組平行", 11], ["quad", 3, "對角線剪開", 11], ["est", 0, "靠近哪一個", 11], ["est", 1, "無條件進入", 11], ["est", 2, "無條件捨去", 11], ["est", 3, "三種取法", 11], ["est", 4, "估算加法", 11], ["est", 5, "估算乘法", 11], ["chart", 0, "讀長條圖", 11], ["chart", 1, "相差多少", 11], ["chart", 2, "畫長條圖", 11], ["chart", 3, "折線圖", 11], ["chart", 4, "省略符號", 11], ["deck", 0, "周長", 11], ["deck", 1, "鋪地磚算面積", 11], ["deck", 2, "L 形面積", 11], ["deck", 3, "平方公尺換算", 11], ["deck", 4, "由面積找邊長", 11], ["deck", 5, "面積量感", 11], ["eqv", 0, "切細找等值", 11], ["eqv", 1, "合併找等值", 11], ["eqv", 2, "數糖果", 11], ["eqv", 3, "異分母比大小", 11], ["eqv", 4, "分數換小數", 11], ["time", 0, "時間換算", 11], ["time", 1, "同半天經過多久", 11], ["time", 2, "跨中午", 11], ["time", 3, "跨半夜", 11], ["time", 4, "幾時到、幾時出發", 11], ["time", 5, "24 小時制", 11], ["vol", 0, "一層一層數", 11], ["vol", 1, "堆貨", 11], ["vol", 2, "體積一樣大", 11], ["vol", 3, "兩堆合起來", 11], ["vol", 4, "體積量感", 11]];
}
function viewPractice() {
  const groups = availKeys().map(k => {
    const ts = practiceTopics().filter(t => t[0] === k);
    return ts.length ? `<h3 class="pg-h">${GAMES[k].name}<span class="sem">${GAMES[k].sem}</span></h3><div class="pg">${ts.map(t => `<button class="pg-btn" data-g="${t[0]}" data-l="${t[1]}"><span class="sem">${t[3] >= 11 ? '四下' : '四上'}</span>${nums(t[2])}</button>`).join('')}</div>` : '';
  }).join('');
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="home" aria-label="回地圖">⌂</button><h2 class="page-h">練習場</h2></div><p class="tag">想多練哪一個？</p><button class="lesson-entry" id="cptAll"><span>💡</span><b>新概念小故事</b><small>可以重看</small></button><h3 class="pg-h">單位的量感</h3><div class="pg">${Object.entries(LESSONS).map(([k, L]) => `<button class="pg-btn" data-ud="${k}"><span class="sem">${L.sem}</span>${L.title}</button>`).join("")}</div>${groups}`;
  document.getElementById('home').onclick = () => go('');
  document.getElementById('cptAll').onclick = () => viewConcepts(null, viewPractice);
  document.querySelectorAll('.pg-btn[data-g]').forEach(b => b.onclick = () => startRound(b.dataset.g, { lv: +b.dataset.l }));
  document.querySelectorAll('[data-ud]').forEach(b => b.onclick = () => runDrill(b.dataset.ud, viewPractice));
}
function enter(ch) {
  if (ch === 'boss') {
    if (!S.bossSeen) { S.bossSeen = true; save(); return comic(BOSS.bg, BOSS.intro, () => startRound('boss')); }
    return startRound('boss');
  }
  lessonsThen(ch, () => {
    if (!S.prog[ch]) return comic(STORY[ch].bg, STORY[ch].beats[0], () => startRound(ch));
    startRound(ch);
  });
}

/* ---------- 鍵盤 ---------- */
function keypadHtml() {
  return `<div class="entry num" id="entry"><span class="blank">？</span></div><div class="keypad">
    ${[1, 2, 3, 4, 5].map(d => `<button class="num" data-k="${d}">${d}</button>`).join('')}<button data-k="del" aria-label="刪除">⌫</button>
    ${[6, 7, 8, 9, 0].map(d => `<button class="num" data-k="${d}">${d}</button>`).join('')}<button class="go" data-k="ok" aria-label="確定">✓</button></div>`;
}
function bindKeypad(onOk) {
  let val = '';
  const show = () => { document.getElementById('entry').innerHTML = val || '<span class="blank">？</span>'; };
  document.querySelectorAll('.keypad button').forEach(b => {
    b.onclick = () => {
      const k = b.dataset.k;
      if (k === 'del') val = val.slice(0, -1);
      else if (k === 'ok') { if (val) onOk(+val, () => { val = ''; show(); }); else { setMsg('先按數字，再按打勾。', 'hint'); sfx.retry(); } return; }
      else if (val.length < 9) val = (val + k).replace(/^0+(?=\d)/, '');
      show();
    };
  });
}
function lockKeypad() { document.querySelectorAll('.keypad button').forEach(b => { b.disabled = true; b.style.opacity = .35; }); }

function stepKeypad(asks, steps, why, doneMsg, detail, onStep, opts) {
  // opts.shortcut：前面幾步只是幫忙拆解，直接答出最後答案也算對
  let step = 0;
  const many = steps.length > 1, last = steps.length - 1;
  const ask = () => { const a = document.getElementById('ask'); if (a) a.innerHTML = nums((many ? `第 ${step + 1} 步，共 ${steps.length} 步：` : '') + asks[step]); };
  ask();
  const done = () => { lockKeypad(); finish(R.tries === 0 ? 2 : R.tries === 1 ? 1 : 0, detail, nums(doneMsg)); };
  bindKeypad((val, clear) => {
    if (val === steps[step] || (opts && opts.shortcut && val === steps[last])) {
      sfx.ok(); clear();
      if (val === steps[last] && (step === last || (opts && opts.shortcut))) return done();
      step++; ask(); if (onStep) onStep(step);
      return setMsg(nums(`對了，是 ${val}。接著算下一步。`), 'good');
    }
    R.tries++; sfx.retry(); clear();
    const head = many ? `你按的 ${val} 不是這一步的答案。` : `你按的 ${val} 不對喔。`;
    if (R.tries <= 2) return setMsg(nums(`${head}${why}`), 'hint');
    lockKeypad();
    finish(0, { wrong: val, ans: steps[step] }, nums(`這一步是 ${steps[step]}，最後答案是 ${steps[last]}。${why}`));
  });
}
function pickOne(html, right, why, ok, detail) {
  document.getElementById('actions').innerHTML = `<div class="choices ${html[0].includes('class="pv"') ? 'col' : ''}">${html.map((h, i) => `<button class="choice" data-i="${i}">${h}</button>`).join('')}</div>`;
  document.querySelectorAll('[data-i]').forEach(b => {
    b.onclick = () => {
      if (+b.dataset.i === right) return finish(R.tries === 0 ? 2 : R.tries === 1 ? 1 : 0, detail, nums(ok));
      R.tries++; b.classList.add('no'); b.disabled = true; sfx.retry();
      if (R.tries >= 2) { document.querySelectorAll('[data-i]').forEach(x => x.disabled = true); return finish(0, { wrong: b.textContent.slice(0, 12), ans: right }, nums(ok)); }
      setMsg(nums(why), 'hint');
    };
  });
}
const numBtn = v => `<span class="num">${v}</span>`;
/* ---------- 共用 ---------- */
const graded = () => R.tries === 0 ? 2 : R.tries === 1 ? 1 : 0;
const isFast = q => ((S.fast || {})[q.kind + ':' + q.mode] || 0) >= 3; // 連續 3 次第一次就對就跳過操作，答錯回到動手做
const miss = (n = 3) => { R.tries++; sfx.retry(); return R.tries >= n; };
const fmt = n => Number(n).toLocaleString('en-US');
const askDiv = '<div class="trail ask" id="ask"></div>';
function actionBtn(id, text, cls) {
  document.getElementById('actions').innerHTML = `<button class="btn ${cls || ''}" id="${id}">${text}</button>`;
  return document.getElementById(id);
}
function hideKeypad() { document.querySelectorAll('.keypad, .entry').forEach(x => { x.style.display = 'none'; }); }
function showKeypad() { document.querySelectorAll('.pad-wrap').forEach(x => { x.hidden = false; }); reveal('.pad-wrap'); }
const padHidden = () => `<div class="pad-wrap" hidden>${askDiv}${keypadHtml()}</div>`;
function afterAct(fn) { document.getElementById('actions').innerHTML = ''; showKeypad(); fn(); }
function dragOn(wrap, cb, sel) { // 手指在圖上拖：回傳在圖形裡的相對位置 0～1
  wrap.classList.add('drag-prot');
  const read = e => { const g = sel ? wrap.querySelector(sel) : wrap.querySelector('svg'), b = g.getBoundingClientRect(); cb((e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height, e); };
  let on = false;
  wrap.onpointerdown = e => { on = true; try { wrap.setPointerCapture(e.pointerId); } catch (x) {} read(e); e.preventDefault(); };
  wrap.onpointermove = e => { if (on) read(e); };
  wrap.onpointerup = wrap.onpointercancel = () => { on = false; };
}
function dragRotate(wrap, cb) { // 繞圖形中心轉，每轉 90 度回報一次
  wrap.classList.add('drag-prot');
  const ang = e => { const g = wrap.querySelector('svg').getBoundingClientRect(); return Math.atan2(e.clientY - (g.top + g.height / 2), e.clientX - (g.left + g.width / 2)) * 180 / Math.PI; };
  let last = null;
  wrap.onpointerdown = e => { last = ang(e); try { wrap.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); };
  wrap.onpointermove = e => { if (last === null) return; let d = ang(e) - last; if (d > 180) d -= 360; if (d < -180) d += 360; if (Math.abs(d) >= 45) { last += Math.sign(d) * 90; cb(Math.sign(d)); } };
  wrap.onpointerup = wrap.onpointercancel = () => { last = null; };
}
const tapAlso = (id, btn) => { const el = document.getElementById(id); if (el) el.onclick = () => { const b = document.getElementById(btn); if (b) b.click(); }; };
function gate(q, label, n, onStep, ask, drag) { // 動手 n 次才能作答；熟練後直接跳到作答。drag：{ el, map } 用拖的；沒有就可以點圖
  const lab = k => Array.isArray(label) ? label[k] : label;
  if (isFast(q) || n <= 0) { for (let k = 1; k <= n; k++) onStep(k); return afterAct(ask); }
  let k = 0, over = false;
  const st = document.getElementById('stage');
  const end = () => { over = true; st.onclick = null; if (drag) drag.el.onpointerdown = drag.el.onpointermove = null; afterAct(ask); };
  const paint = () => { actionBtn('gt', lab(k)).onclick = () => { k++; sfx.hop(); onStep(k); if (k === n) end(); else paint(); }; };
  paint();
  if (drag) dragOn(drag.el, (x, y) => {
    if (over) return;
    const t = Math.max(0, Math.min(n, Math.round(drag.map(x, y))));
    if (t === k) return;
    k = t; sfx.hop(); onStep(k); if (k === n) end(); else paint();
  }, drag.sel);
  else st.onclick = e => { if (!over && e.target.closest('svg, .pies, .crates, .kms, .packs, .hrow, .stadiums, .pv, .zero-eq, .fcells, .foods') && !e.target.closest('button') && document.getElementById('gt')) document.getElementById('gt').click(); };
}
const setEl = (id, html) => { document.getElementById(id).innerHTML = html; };
function unitPick(q) {
  frame(q.text, `<div class="u-big">${q.e}</div>`);
  pickOne(q.options.map(o => nums(o)), q.options.indexOf(q.a), '想想真的東西有多大。', q.why, 'pick');
}
function lrChoices(leftHtml, rightHtml, ans, why, ok, equal) { // 比大小的三個按鈕
  const opts = equal ? ['L', 'E', 'R'] : ['L', 'R'], labels = { L: '左邊大', R: '右邊大', E: '一樣大' };
  pickOne(opts.map(o => labels[o]), opts.indexOf(ans), why, ok, 'cmp');
}

/* ---------- 定位板 ---------- */
const PV8 = ['千萬', '百萬', '十萬', '萬', '千', '百', '十', '一'];
function pv8(n, opts) { // opts.hi：亮第幾欄
  const ds = String(n).padStart(8, ' ').split('');
  return `<table class="pv pv8"><tr>${PV8.map((x, i) => `<th class="${i < 4 ? 'w' : ''} ${opts && opts.hi === i ? 'hi' : ''}">${x}</th>`).join('')}</tr><tr>${ds.map((d, i) => `<td class="num ${i < 4 ? 'w' : ''} ${opts && opts.hi === i ? 'hi' : ''}">${d === ' ' ? '' : d}</td>`).join('')}</tr></table>`;
}

/* ---------- 一：大數控制室 ---------- */
function viewBig(q) {
  if (q.mode === 'build') {
    const st = new Array(8).fill(0);
    frame(`把這個數撥到定位板上：<br><b class="big-word">${q.word}</b>`, '<div class="dial" id="dial"></div>');
    const draw = () => {
      document.getElementById('dial').innerHTML = PV8.map((x, i) => `<div class="dc ${i < 4 ? 'w' : ''}"><small>${x}</small><button data-u="${i}" aria-label="${x}加一">＋</button><b class="num">${st[i]}</b><button class="dn" data-d="${i}" aria-label="${x}減一">−</button></div>`).join('');
      document.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { const i = +b.dataset.u; st[i] = (st[i] + 1) % 10; sfx.hop(); draw(); });
      document.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { const i = +b.dataset.d; st[i] = (st[i] + 9) % 10; sfx.hop(); draw(); });
    };
    draw();
    actionBtn('ok', '撥好了').onclick = () => {
      const v = +st.join(''), want = String(q.v).padStart(8, '0');
      if (v === q.v) return finish(graded(), 'build', `對了！就是 ${fmt(q.v)}。<br>沒有的位數要撥 0。`);
      const wrong = st.findIndex((d, i) => String(d) !== want[i]);
      if (miss()) { document.querySelectorAll('#dial button').forEach(b => { b.disabled = true; }); return finish(0, { wrong: v, ans: q.v }, `答案是 ${fmt(q.v)}。先找「萬」前面的數，放在左邊四格。`); }
      setMsg(`${PV8[wrong]}位不對。先看「萬」的前面，再看「萬」的後面。`, 'hint');
    };
    return;
  }
  if (q.mode === 'read') {
    frame('定位板上的數，念起來是哪一個？', `${pv8(q.v)}<div class="trail" id="sp">先把它切成兩段</div>`);
    return gate(q, '在「萬」後面切開', 1, () => setEl('sp', `前面是 <b class="num">${Math.floor(q.v / 10000)}</b> 萬，後面是 <b class="num">${q.v % 10000}</b>`), () => pickOne(q.options, q.options.indexOf(q.word), '四位四位看：先念萬的部分，再念後面。中間有 0 要念「零」。', `對了！念作${q.word}。`, 'read'));
  }
  if (q.mode === 'money') {
    const piles = [['🧳', '箱', q.box, '100 萬', 1], ['🗂️', '疊', q.stack, '10 萬', 2], ['💵', '捆', q.bun, '1 萬', 3], ['🧾', '張', q.bill, '1000', 4]].filter(p => p[2]);
    const fast = isFast(q);
    frame('金庫裡共有多少元？', `<div class="cash">${piles.map((p, i) => `<button class="cash-p" data-p="${i}"><span class="ce">${p[0].repeat(Math.min(p[2], 5))}</span><b>${p[2]} ${p[1]}</b><small>每${p[1]} ${p[3]} 元</small></button>`).join('')}</div><div class="trail">10 張千元鈔＝1 捆，10 捆＝1 疊，10 疊＝1 箱</div><div id="pv">${pv8(fast ? q.ans : 0).replace(/>0</, '><')}</div>${padHidden()}`);
    const seen = new Set(); let cur = 0;
    const ask = () => stepKeypad(['按出全部的錢'], [q.ans], '照定位板上的數字按，沒有的位數要按 0。', `對了！共 ${fmt(q.ans)} 元。`, 'money');
    if (fast) return afterAct(ask);
    setMsg('點每一堆錢，放進定位板。');
    document.querySelectorAll('.cash-p').forEach(b => b.onclick = () => {
      const i = +b.dataset.p; if (seen.has(i)) return;
      seen.add(i); b.classList.add('seen'); sfx.hop();
      const p = piles[i]; cur += p[2] * { '箱': 1000000, '疊': 100000, '捆': 10000, '張': 1000 }[p[1]];
      document.getElementById('pv').innerHTML = pv8(cur);
      if (seen.size === piles.length) { setMsg('都放好了！照著按出來。', 'good'); afterAct(ask); }
    });
    return;
  }
  if (q.mode === 'stadium') {
    const show = Math.min(q.wan, 40), head = q.km ? `${q.what}大約 ${q.wan} 萬公里。<br>每 1 萬公里插一面旗子，要幾面？` : `${q.what}大約 ${q.wan} 萬人。<br>一座體育場坐滿是 1 萬人，要幾座？`;
    const icon = q.km ? '🚩' : '🏟️';
    frame(head, `<div class="stadiums" id="st"></div><div class="trail" id="more"></div>${padHidden()}`);
    let n = 0;
    const ask = () => stepKeypad([q.km ? '要幾面旗子？' : '要幾座體育場？', q.km ? '全程是幾公里？按出完整的數。' : '全部是幾人？按出完整的數。'], [q.wan, q.wan * 10000], `每一${q.km ? '面' : '座'}是 1 萬，${q.wan} 個 1 萬後面有 4 個 0。`, `對了！${q.wan} 萬就是 ${fmt(q.wan * 10000)}。`, 'stadium');
    if (isFast(q)) return afterAct(ask);
    const draw = () => { document.getElementById('st').innerHTML = icon.repeat(Math.min(n, show)); document.getElementById('more').innerHTML = `已經 ${n} 萬${q.km ? '公里' : '人'}`; };
    const step = Math.max(1, Math.ceil(q.wan / 20)); draw();
    actionBtn('add', q.wan > 20 ? `再放 ${step} ${q.km ? '面' : '座'}` : `再放 1 ${q.km ? '面' : '座'}`).onclick = () => {
      n = Math.min(q.wan, n + step); sfx.hop(); draw();
      if (n === q.wan) { setMsg(q.wan > show ? `放不下了，畫面只畫 ${show} 個，真的有 ${q.wan} 個！` : '放滿了！', 'good'); afterAct(ask); }
    };
    return;
  }
  if (q.mode === 'cmp') {
    frame('哪一邊的數比較大？<br>從最左邊開始，一位一位比。', `<div id="two"></div>`);
    let i = 0; const a = String(q.l).padStart(8, ' '), b = String(q.r).padStart(8, ' '), first = [...a].findIndex((c, k) => c !== b[k]);
    const draw = hi => { document.getElementById('two').innerHTML = `<div class="tag2">左邊</div>${pv8(q.l, { hi })}<div class="tag2">右邊</div>${pv8(q.r, { hi })}`; };
    const end = () => lrChoices('', '', q.ans, '從最左邊比，第一個不一樣的位數，數字大的那個就大。', `對了！${PV8[first]}位不一樣，${q.ans === 'L' ? '左邊' : '右邊'}的數字比較大。`);
    if (isFast(q)) { draw(-1); return end(); }
    draw(0);
    const bump = () => {
      if (i === first) { setMsg(`${PV8[i]}位不一樣了！`, 'good'); return end(); }
      i++; sfx.hop(); draw(i); actionBtn('nx', `${PV8[i - 1]}位一樣，比下一位`).onclick = bump;
    };
    if (first === 0) { setMsg('第一位就不一樣了！', 'good'); return end(); }
    actionBtn('nx', `${PV8[0]}位一樣，比下一位`).onclick = bump;
    return;
  }
  const bars = (n, c) => `<span class="wbars ${c || ''}">${'<i class="t"></i>'.repeat(Math.floor(n / 10))}${'<i></i>'.repeat(n % 10)}</span>`;
  frame(`${q.a} 萬 ${q.r1} ${q.op} ${q.w2} 萬 ${q.r2}`, `<table class="pv wan"><tr><th></th><th class="w">幾萬</th><th>後面</th></tr><tr><td></td><td class="num w">${q.a}</td><td class="num">${q.r1}</td></tr><tr><td class="num">${q.op}</td><td class="num w">${q.w2}</td><td class="num">${q.r2}</td></tr></table><div id="w1"></div><div id="w2"></div>${padHidden()}`);
  gate(q, ['把「萬」的鈔票放一起', '把後面的鈔票放一起'], 2, k => {
    if (k === 1) setEl('w1', `<div class="trail">長條是 10 萬，短條是 1 萬</div><div class="wrow">${bars(q.a)}<b>${q.op}</b>${bars(q.w2, 'b')}</div>`);
    else setEl('w2', `<div class="trail">長條是 1000，短條是 100</div><div class="wrow">${bars(q.r1 / 100, 'c')}<b>${q.op}</b>${bars(q.r2 / 100, 'd')}</div>`);
  }, () => stepKeypad(['幾萬？', '後面是多少？'], [q.ansW, q.ansR], '萬和萬一起算，後面和後面一起算。', `對了！答案是 ${q.ansW} 萬 ${q.ansR}。`, 'wan'));
}

/* ---------- 二：乘法裝配線 ---------- */
function viewMul(q) {
  if (q.mode === 'thou') {
    frame(`一箱有 ${fmt(q.a)} 顆螺絲，<br>${q.b} 箱共有幾顆？`, `<div class="crates" id="cr"></div><div class="trail" id="ct">還沒搬</div>${padHidden()}`);
    const ask = () => stepKeypad(['全部是幾個千？', '那是幾顆？'], q.steps, `${q.a / 1000} 個千，${q.b} 箱就是 ${q.a / 1000}×${q.b} 個千。`, `對了！${fmt(q.a)}×${q.b}＝${fmt(q.ans)}。`, 'thou', null, { shortcut: true });
    return gate(q, '搬一箱', q.b, k => { setEl('cr', Array.from({ length: k }, () => `<span class="crate"><b class="num">${q.a / 1000}</b><small>個千</small></span>`).join('')); setEl('ct', `搬了 ${k} 箱`); }, ask);
  }
  if (q.mode === 'tens') {
    const t = q.b / 10;
    frame(`每排 ${q.a} 塊板子，排 ${q.b} 排，<br>共有幾塊？`, `<div class="crates" id="cr"></div><div class="trail" id="ct">10 排疊成一疊</div>${padHidden()}`);
    const ask = () => stepKeypad([`${t} 排有幾塊？`, `${q.b} 排有幾塊？`], q.steps, `${q.a}×${t} 算好，後面補一個 0。`, `對了！${q.a}×${q.b}＝${fmt(q.ans)}。`, 'tens', null, { shortcut: true });
    return gate(q, '再疊 10 排', t, k => { setEl('cr', Array.from({ length: k }, () => `<span class="crate"><b class="num">10</b><small>排</small></span>`).join('')); setEl('ct', `已經 ${k * 10} 排。先算 ${t} 排，再乘以 10`); }, ask);
  }
  if (q.mode === 'tiles') {
    const tA = q.a - q.a % 10, oA = q.a % 10, tB = q.b - q.b % 10, oB = q.b % 10, W = 300, H = 190;
    const wa = oA ? Math.max(W * tA / q.a, W - 70) : W, ha = oB ? Math.max(H * tB / q.b, H - 60) : H;
    const rects = []; if (tA && tB) rects.push([0, 0, wa, ha]); if (oA && tB) rects.push([wa, 0, W - wa, ha]); if (tA && oB) rects.push([0, ha, wa, H - ha]); if (oA && oB) rects.push([wa, ha, W - wa, H - ha]);
    const C = ['#f7c6a3', '#bcd6f2', '#bfe3b4', '#f4c4d6'];
    const svg = lit => `<svg class="tile-svg" viewBox="-32 -22 342 222"><text x="${wa / 2}" y="-6" text-anchor="middle" class="tl">${tA}</text>${oA ? `<text x="${wa + (W - wa) / 2}" y="-6" text-anchor="middle" class="tl">${oA}</text>` : ''}<text x="-4" y="${ha / 2 + 6}" text-anchor="end" class="tl">${tB}</text>${oB ? `<text x="-4" y="${ha + (H - ha) / 2 + 6}" text-anchor="end" class="tl">${oB}</text>` : ''}${rects.map((r, i) => `<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" fill="${i < lit ? C[i] : i === lit ? '#ffe680' : '#fff'}" stroke="#7a5b2e" stroke-width="2"/>${i < lit ? `<text x="${r[0] + r[2] / 2}" y="${r[1] + r[3] / 2 + 6}" text-anchor="middle" class="tv">${q.parts[i][0] * q.parts[i][1]}</text>` : ''}`).join('')}</svg>`;
    const plain = v => `<svg class="tile-svg" viewBox="-32 -22 342 222"><text x="${W / 2}" y="-6" text-anchor="middle" class="tl">${q.a}</text><text x="-4" y="${H / 2 + 6}" text-anchor="end" class="tl">${q.b}</text><rect width="${W}" height="${H}" fill="#fff8e6" stroke="#7a5b2e" stroke-width="2"/>${v ? `<line x1="${wa}" y1="0" x2="${wa}" y2="${H}" stroke="#d6476b" stroke-width="4" stroke-dasharray="8 6"/>` : ''}</svg>`;
    frame(`甲板長 ${q.a}、寬 ${q.b}，要鋪幾塊地磚？<br>先把它切開。`, `<div id="ti">${plain(false)}</div>${padHidden()}`);
    const asks = q.parts.map(p => `黃色這一塊：${p[0]}×${p[1]}＝？`).concat(['全部加起來是幾塊？']), steps = q.parts.map(p => p[0] * p[1]).concat(q.ans);
    const ask = () => stepKeypad(asks, steps, '黃色這一塊的長乘以寬。', `對了！${q.a}×${q.b}＝${fmt(q.ans)}。`, 'tiles', s => setEl('ti', svg(s)), { shortcut: true });
    const cuts = (oA ? 1 : 0) + (oB ? 1 : 0), labels = oA && oB ? ['✂️ 直的切一刀', '✂️ 橫的切一刀'] : [oA ? '✂️ 直的切一刀' : '✂️ 橫的切一刀'];
    return gate(q, labels, cuts, k => { setEl('ti', k === cuts ? svg(0) : plain(true)); }, ask);
  }
  if (q.mode === 'rows') {
    const parts = q.steps.slice(0, -1), mult = parts.map(p => p / q.a);
    frame(`一箱裝 ${q.a} 個零件，有 ${q.b} 箱，<br>把 ${q.b} 拆開來搬。`, `<div class="mrows">${mult.map((m, i) => `<div class="mrow" id="mr${i}" style="visibility:hidden"><b class="num">${q.a}×${m}</b><span class="mbar" style="width:${Math.max(16, m / q.b * 100)}%"></span><em class="num" id="mv${i}"></em></div>`).join('')}</div>${padHidden()}`);
    const asks = mult.map(m => `${q.a}×${m}＝？`).concat(['全部加起來是多少？']);
    const lit = s => { if (s > 0) document.getElementById('mv' + (s - 1)).textContent = fmt(parts[s - 1]); };
    return gate(q, mult.map(m => `搬 ${m} 箱`), mult.length, k => { document.getElementById('mr' + (k - 1)).style.visibility = 'visible'; }, () => stepKeypad(asks, q.steps, '一列一列算：後面有幾個 0，答案就補幾個 0。', `對了！${q.a}×${q.b}＝${fmt(q.ans)}。`, 'rows', lit, { shortcut: true }));
  }
  const zs = '0'.repeat(q.za + q.zb), eq = hide => `<b class="num">${q.a}<i class="${hide ? 'cov' : ''}">${'0'.repeat(q.za)}</i></b><span>×</span><b class="num">${q.b}<i class="${hide ? 'cov' : ''}">${'0'.repeat(q.zb)}</i></b>`;
  frame(`${fmt(q.x)} × ${fmt(q.y)} ＝ ？`, `<div class="zero-eq" id="ze">${eq(false)}</div><div class="trail" id="zt">先把 0 遮起來</div>${padHidden()}`);
  gate(q, '🙈 把 0 遮起來', 1, () => { setEl('ze', eq(true)); setEl('zt', `算 ${q.a}×${q.b}，再把 ${q.za + q.zb} 個 0 補回去`); }, () => stepKeypad([`${q.a}×${q.b}＝？`, `補上 ${q.za + q.zb} 個 0，答案是多少？`], q.steps, `兩個數後面的 0 共有 ${q.za + q.zb} 個。`, `對了！${q.a * q.b} 後面補 ${zs.length} 個 0，就是 ${fmt(q.ans)}。`, 'zero', () => setEl('ze', eq(false)), { shortcut: true }));
}

/* ---------- 三：角度導航台 ---------- */
function protractor(d, opts) { // 半圓量角器；opts.noread 不顯示讀數
  const cx = 160, cy = 165, r = 140, P = (a, l) => [cx + l * Math.cos(a * Math.PI / 180), cy - l * Math.sin(a * Math.PI / 180)];
  let s = `<svg class="prot" viewBox="0 0 320 180"><path d="M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}Z" fill="#fdf3cf" stroke="#c9a56a" stroke-width="2"/>`;
  for (let a = 0; a <= 180; a += 10) { const [x1, y1] = P(a, r), [x2, y2] = P(a, a % 30 ? r - 8 : r - 16); s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#7a5b2e" stroke-width="${a % 30 ? 1 : 2}"/>`; if (a % 30 === 0) { const [x, y] = P(a, r - 30); s += `<text x="${x}" y="${y + 5}" text-anchor="middle" class="pt">${a}</text>`; } }
  const sw = opts && opts.sweep !== undefined ? opts.sweep : d, [ax, ay] = P(d, r - 4), [bx, by] = P(0, r - 4), [ex, ey] = P(sw, 44), [fx, fy] = P(0, 44);
  s += `<path d="M${cx} ${cy}L${fx} ${fy}A44 44 0 0 ${0} ${ex} ${ey}Z" fill="#ffb3a7" opacity=".8"/><line x1="${cx}" y1="${cy}" x2="${bx}" y2="${by}" stroke="#33405a" stroke-width="5"/><line x1="${cx}" y1="${cy}" x2="${ax}" y2="${ay}" stroke="#d6476b" stroke-width="5"/><circle cx="${cx}" cy="${cy}" r="6" fill="#33405a"/>`;
  if (opts && opts.knob !== undefined) { const [kx, ky] = P(opts.knob, r - 4); s += `<line x1="${cx}" y1="${cy}" x2="${kx}" y2="${ky}" stroke="#2f5f9e" stroke-width="5"/><circle cx="${kx}" cy="${ky}" r="15" fill="#ffd65a" stroke="#2f5f9e" stroke-width="4"/>`; }
  return s + '</svg>';
}
function dragAngle(wrap, snap, onChange) { // 手指撥量角器：看手指和圓心連線的角度
  let last = null;
  dragOn(wrap, (rx, ry) => {
    const x = rx * 320 - 160, y = 165 - ry * 180, raw = y < 0 ? (x < 0 ? 180 : 0) : Math.atan2(y, x) * 180 / Math.PI, a = Math.max(0, Math.min(180, Math.round(raw / snap) * snap));
    if (a !== last) { last = a; onChange(a); }
  });
}
function angleArc(d, cls, ref, whole) { // 畫出任何大小的角；ref 疊一個直角來比；whole 把剩下的塗藍
  const cx = 75, cy = 75, r = 56, P = (a, l) => `${cx + l * Math.cos(-a * Math.PI / 180)} ${cy + l * Math.sin(-a * Math.PI / 180)}`, full = d >= 360;
  const fill = full ? `<circle cx="${cx}" cy="${cy}" r="30" fill="#ffb3a7"/>` : `<path d="M${cx} ${cy}L${P(0, 30)}A30 30 0 ${d > 180 ? 1 : 0} 0 ${P(d, 30)}Z" fill="#ffb3a7"/>`;
  const rest = whole ? `<path d="M${cx} ${cy}L${P(d, 40)}A40 40 0 ${whole - d > 180 ? 1 : 0} 0 ${P(whole, 40)}Z" fill="#bcd6f2"/>` : '';
  const rf = ref ? `<path d="M${cx} ${cy}h46v-46h-46z" fill="#3d9970" fill-opacity=".22" stroke="#3d9970" stroke-width="2" stroke-dasharray="5 4"/>` : '';
  return `<svg class="ang big ${cls || ''}" viewBox="0 0 150 150">${rest}${fill}${rf}<line x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="#33405a" stroke-width="5"/><line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(-d * Math.PI / 180)}" y2="${cy + r * Math.sin(-d * Math.PI / 180)}" stroke="#d6476b" stroke-width="5"/></svg>`;
}
function clockSvg(from, cur) {
  let s = '<svg class="clock4" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="#fff" stroke="#33405a" stroke-width="4"/>';
  for (let h = 1; h <= 12; h++) { const a = h * 30 * Math.PI / 180; s += `<text x="${100 + 74 * Math.sin(a)}" y="${106 - 74 * Math.cos(a)}" text-anchor="middle" class="pt">${h}</text>`; }
  const P = (h, l) => [100 + l * Math.sin(h * 30 * Math.PI / 180), 100 - l * Math.cos(h * 30 * Math.PI / 180)], [a, b] = P(from, 58), [c, d] = P(cur, 58);
  return s + `<line x1="100" y1="100" x2="${a}" y2="${b}" stroke="#b9c2d0" stroke-width="5" stroke-dasharray="6 5"/><line x1="100" y1="100" x2="${c}" y2="${d}" stroke="#d6476b" stroke-width="6" stroke-linecap="round"/><circle cx="100" cy="100" r="6" fill="#33405a"/></svg>`;
}
const hourName = h => h === 0 ? 12 : h;
function viewDeg(q) {
  if (q.mode === 'read') {
    frame('量角器上，紅線轉了幾度？<br>撥動黃色圓鈕，從 0 轉到紅線。', `<div id="pr">${protractor(q.d, { sweep: isFast(q) ? q.d : 0, knob: isFast(q) ? q.d : 0 })}</div><div class="trail" id="ct">一小格是 10 度</div>${padHidden()}`);
    const ask = () => stepKeypad(['幾度？'], [q.d], '從 0 開始，一小格 10 度，往左數。', `對了！是 ${q.d} 度，是${Logic.angleKind(q.d)}。`, 'read');
    if (isFast(q)) return afterAct(ask);
    let cur = 0, over = false; const pr = document.getElementById('pr');
    const go = a => {
      if (over) return;
      cur = Math.min(a, q.d); setEl('pr', protractor(q.d, { sweep: cur, knob: cur })); setEl('ct', `轉了 ${cur / 10} 格`);
      if (a === q.d) { over = true; pr.onpointerdown = pr.onpointermove = null; sfx.ok(); setMsg('對齊紅線了！', 'good'); afterAct(ask); } else sfx.hop();
    };
    dragAngle(pr, 10, go);
    actionBtn('gt', '轉一格').onclick = () => go(cur + 10);
    return;
  }
  if (q.mode === 'make') {
    frame(`撥動黃色圓鈕，把藍線轉到 <b class="num">${q.d}</b> 度。`, `<div id="pr"></div><div class="u-count"><b class="num" id="cnt"></b> 度</div><div class="odo two">${[10, 5, -5, -10].map(h => `<button class="turn" data-h="${h}">${h > 0 ? '＋' : '−'}${Math.abs(h)} 度</button>`).join('')}</div>`);
    let cur = q.start;
    const draw = () => { document.getElementById('pr').innerHTML = protractor(cur, { knob: cur }); document.getElementById('cnt').textContent = cur; };
    draw();
    dragAngle(document.getElementById('pr'), 5, a => { cur = a; sfx.hop(); draw(); setMsg(''); });
    document.querySelectorAll('.turn').forEach(b => b.onclick = () => { cur = Math.max(0, Math.min(180, cur + +b.dataset.h)); sfx.hop(); draw(); setMsg(''); });
    actionBtn('ok', '轉好了').onclick = () => {
      if (cur === q.d) return finish(graded(), 'make', `對了！這就是 ${q.d} 度，是${Logic.angleKind(q.d)}。`);
      if (miss()) { cur = q.d; draw(); return finish(0, { wrong: cur, ans: q.d }, `${q.d} 度在這裡。`); }
      setMsg(cur < q.d ? '還要再多轉一點。' : '轉太多了。', 'hint');
    };
    return;
  }
  if (q.mode === 'kind') {
    frame(`這是 ${q.d} 度的角，它是什麼角？`, `<div class="vs" id="an">${angleArc(q.d)}</div>`);
    return gate(q, '📐 拿直角比一比', 1, () => setEl('an', angleArc(q.d, '', true)), () => pickOne(q.options, q.options.indexOf(q.ans), '直角 90 度、平角 180 度、周角 360 度；比直角小是銳角，比直角大、比平角小是鈍角。', `對了！${q.d} 度是${q.ans}。`, 'kind'));
  }
  if (q.mode === 'clock') {
    const dir = q.cw ? '順時針' : '逆時針';
    frame(`指針從 ${hourName(q.from)}，${dir}轉到 ${hourName(q.to)}。<br>轉了幾度？`, `<div class="vs" id="ck"></div><div class="trail" id="d"></div>${padHidden()}`);
    let cur = q.from, n = 0;
    const ask = () => stepKeypad(['轉了幾度？'], [q.ans], '鐘面上每走一格是 30 度。', `對了！走了 ${q.steps} 格，${q.steps}×30＝${q.ans} 度。`, 'clock');
    const draw = () => { document.getElementById('ck').innerHTML = clockSvg(q.from, cur); document.getElementById('d').innerHTML = n ? `走了 ${n} 格` : '每走一格是 30 度'; };
    draw();
    if (isFast(q)) { cur = q.to; n = q.steps; draw(); return afterAct(ask); }
    setMsg('用手指撥動指針，也可以按下面的按鈕。');
    document.getElementById('actions').innerHTML = '<div class="choices"><button class="choice" id="cw">順時針 ↻</button><button class="choice" id="ccw">逆時針 ↺</button></div>';
    dragOn(document.getElementById('ck'), (x, y) => {
      if (n === q.steps) return;
      const h = Math.round(((Math.atan2(x - .5, .5 - y) * 180 / Math.PI + 360) % 360) / 30) % 12, diff = q.cw ? (h - cur + 12) % 12 : (cur - h + 12) % 12;
      if (!diff) return;
      if (diff > 6) return setMsg(q.cw ? '順時針是和時鐘走的方向一樣。' : '逆時針是和時鐘走的方向相反。', 'hint');
      if (n + diff > q.steps) return setMsg(`撥過頭了，停在 ${hourName(q.to)}。`, 'hint');
      cur = h; n += diff; sfx.hop(); draw(); setMsg('');
      if (n === q.steps) { setMsg('轉到了！', 'good'); afterAct(ask); }
    });
    const turn = w => {
      if (w !== q.cw) { R.tries++; sfx.retry(); return setMsg(q.cw ? '順時針是和時鐘走的方向一樣。' : '逆時針是和時鐘走的方向相反。', 'hint'); }
      cur = (cur + (w ? 1 : 11)) % 12; n++; sfx.hop(); draw();
      if (n === q.steps) { setMsg('轉到了！', 'good'); afterAct(ask); }
    };
    document.getElementById('cw').onclick = () => turn(true); document.getElementById('ccw').onclick = () => turn(false);
    return;
  }
  if (q.mode === 'join') {
    const P = d => `${75 + 60 * Math.cos(-d * Math.PI / 180)} ${75 + 60 * Math.sin(-d * Math.PI / 180)}`;
    const wedge = (from, to, c) => `<path d="M75 75L${P(from)}A60 60 0 0 0 ${P(to)}Z" fill="${c}" stroke="#33405a" stroke-width="2"/>`;
    const pic = k => `<svg class="ang big" viewBox="0 0 150 90">${k >= 1 ? wedge(0, q.a, '#bcd6f2') : ''}${k >= 2 ? wedge(q.a, q.a + q.b, '#f7c6a3') : ''}<line x1="75" y1="75" x2="145" y2="75" stroke="#33405a" stroke-width="2"/></svg>`;
    frame(`三角板 ${q.a} 度的角和 ${q.b} 度的角拼在一起，<br>合起來是幾度？`, `<div class="vs" id="an">${pic(0)}</div>${padHidden()}`);
    return gate(q, [`放 ${q.a} 度的角`, `靠上 ${q.b} 度的角`], 2, k => setEl('an', pic(k)), () => stepKeypad(['合起來幾度？'], [q.ans], `${q.a}＋${q.b}。`, `對了！${q.a}＋${q.b}＝${q.ans} 度。`, 'join'));
  }
  frame(`${q.whole === 180 ? '平角' : '周角'}是 ${q.whole} 度，<br>紅色占了 ${q.used} 度，還剩幾度？`, `<div class="vs" id="an">${angleArc(q.used)}</div><div class="trail">${q.whole === 180 ? '一條直線' : '轉一整圈'}是 ${q.whole} 度</div>${padHidden()}`);
  gate(q, '把剩下的塗藍色', 1, () => setEl('an', angleArc(q.used, '', false, q.whole)), () => stepKeypad(['還剩幾度？'], [q.ans], `${q.whole}－${q.used}。`, `對了！${q.whole}－${q.used}＝${q.ans} 度。`, 'rest'));
}

/* ---------- 四：分裝倉庫 ---------- */
function viewDivv(q) {
  const remText = q.r ? `，還剩 ${fmt(q.r)} 個` : '，剛好裝完';
  const steps = q.r || q.mode !== 'zero' ? [q.q, q.r] : [q.q, 0];
  const asks = ['裝了幾箱？', '還剩幾個？（沒有剩就按 0）'];
  const end = () => stepKeypad(asks, steps, '每箱裝滿才算一箱，剩下的一定比一箱少。', `對了！${fmt(q.total)}÷${fmt(q.d)}＝${q.q}${q.r ? ` 餘 ${fmt(q.r)}` : ''}${remText}。`, q.mode);
  if (q.mode === 'pack') {
    frame(`有 ${q.total} 個零件，每箱裝 ${q.d} 個。`, `<div class="crates" id="c"></div><div class="u-count">還有 <b class="num" id="left"></b> 個</div>${padHidden()}`);
    let left = q.total, n = 0;
    const draw = () => { document.getElementById('c').innerHTML = Array.from({ length: n }, () => `<span class="crate small"><b class="num">${q.d}</b></span>`).join('') || '<span class="trail">還沒裝</span>'; document.getElementById('left').textContent = left; };
    draw();
    if (isFast(q)) { document.getElementById('left').parentNode.style.display = 'none'; return afterAct(end); }
    tapAlso('c', 'pk');
    actionBtn('pk', '裝一箱').onclick = () => {
      if (left < q.d) return;
      left -= q.d; n++; sfx.hop(); draw();
      if (left < q.d) { setMsg(left ? `剩 ${left} 個，裝不滿一箱了。` : '裝完了！', 'good'); afterAct(end); }
    };
    return;
  }
  if (q.mode === 'try') {
    frame(`${fmt(q.total)} 個零件，每箱裝 ${q.d} 個，<br>能裝滿幾箱？猜猜看。`, `<div class="try-bar"><span class="tb-all" style="width:${100 / 1.25}%"></span><span class="tb-fill" id="f"></span></div><div class="trail" id="st"></div><div class="u-count">猜 <b class="num" id="g"></b> 箱</div><div class="odo two" id="tb">${(q.step === 10 ? [10, 1, -1, -10] : [1, -1]).map(h => `<button class="turn" data-h="${h}">${h > 0 ? '＋' : '−'}${Math.abs(h)} 箱</button>`).join('')}</div>${padHidden()}`);
    let g = q.step === 10 ? 10 : Math.max(1, Math.round(q.total / (Math.round(q.d / 10) * 10)));
    const draw = () => {
      const used = g * q.d, over = used > q.total, pct = Math.min(used / (q.total * 1.25), 1) * 100, left = q.total - used;
      const f = document.getElementById('f'); f.style.width = pct + '%'; f.className = 'tb-fill ' + (over ? 'over' : '');
      document.getElementById('g').textContent = g;
      document.getElementById('st').innerHTML = over ? `${g} 箱要 ${fmt(used)} 個，不夠裝！` : left >= q.d ? `${g} 箱用 ${fmt(used)} 個，剩 ${fmt(left)} 個，還能再裝。` : `${g} 箱用 ${fmt(used)} 個，剩 ${fmt(left)} 個，裝不滿一箱了。`;
    };
    draw();
    document.querySelectorAll('#tb .turn').forEach(b => b.onclick = () => { g = Math.max(0, g + +b.dataset.h); sfx.hop(); draw(); });
    actionBtn('ok', '就裝這麼多').onclick = () => {
      if (g === q.q) { sfx.ok(); document.getElementById('tb').style.display = 'none'; setMsg('箱數找到了！', 'good'); document.getElementById('actions').innerHTML = ''; showKeypad(); return stepKeypad([asks[1]], [q.r], `${fmt(q.total)}－${fmt(q.q * q.d)}。`, `對了！${fmt(q.total)}÷${q.d}＝${q.q}${q.r ? ` 餘 ${q.r}` : ''}。`, 'try'); }
      if (miss()) { g = q.q; draw(); document.querySelectorAll('#tb .turn').forEach(b => { b.disabled = true; }); return finish(0, { wrong: g, ans: q.q }, `是 ${q.q} 箱，剩 ${q.r} 個。`); }
      setMsg(g > q.q ? '這樣零件不夠裝，少幾箱。' : '還裝得下，多幾箱。', 'hint');
    };
    return;
  }
  const t = q.total / 100, d = q.d / 100;
  frame(`${fmt(q.total)} 個零件，每箱裝 ${fmt(q.d)} 個。`, `<div class="crates" id="cr"></div><div class="trail" id="ct">先把一百個綁成一包</div>${padHidden()}`);
  gate(q, ['一百個綁成一包', ...new Array(q.q).fill(`裝一箱（${d} 包）`)], q.q + 1, k => {
    if (k === 1) return setEl('ct', `有 ${t} 包，每箱 ${d} 包`);
    setEl('cr', Array.from({ length: k - 1 }, () => `<span class="crate small"><b class="num">${d}</b><small>包</small></span>`).join(''));
    setEl('ct', `還剩 ${t - (k - 1) * d} 包。剩下的要把 00 補回來`);
  }, end);
}

/* ---------- 五：三角機翼廠 ---------- */
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function triInfo(t) {
  const P = t.pts, sides = [dist(P[0], P[1]), dist(P[1], P[2]), dist(P[2], P[0])].map(x => Math.round(x / 13));
  const angAt = i => { const a = P[i], b = P[(i + 1) % 3], c = P[(i + 2) % 3], v1 = [b[0] - a[0], b[1] - a[1]], v2 = [c[0] - a[0], c[1] - a[1]]; return Math.round(Math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2))) * 180 / Math.PI); };
  return { sides, angs: [angAt(0), angAt(1), angAt(2)] };
}
function triSvg(t, show) {
  const P = t.pts, I = triInfo(t), cx = (P[0][0] + P[1][0] + P[2][0]) / 3, cy = (P[0][1] + P[1][1] + P[2][1]) / 3;
  let s = `<svg class="tri" viewBox="-14 -14 158 142"><polygon points="${P.map(p => p.join(',')).join(' ')}" fill="#bcd6f2" stroke="#2f5f9e" stroke-width="3"/>`;
  if (show === 's') P.forEach((p, i) => { const q = P[(i + 1) % 3], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, dx = mx - cx, dy = my - cy, l = Math.hypot(dx, dy) || 1; s += `<text x="${mx + dx / l * 13}" y="${my + dy / l * 13 + 5}" text-anchor="middle" class="tv2">${I.sides[i]}</text>`; });
  if (show === 'a') P.forEach((p, i) => { const dx = cx - p[0], dy = cy - p[1], l = Math.hypot(dx, dy) || 1; s += `<text x="${p[0] + dx / l * 24}" y="${p[1] + dy / l * 24 + 5}" text-anchor="middle" class="tv3">${I.angs[i]}°</text>`; });
  return s + '</svg>';
}
function viewTri(q) {
  if (q.mode === 'angle' || q.mode === 'side') {
    const side = q.mode === 'side', fast = isFast(q);
    frame(side ? '這片機翼是哪種三角形？<br>先量三個邊。' : '這片機翼是哪種三角形？<br>先量三個角。', `<div class="vs" id="tr">${triSvg(q.t, fast ? (side ? 's' : 'a') : '')}</div>`);
    const ask = () => pickOne(q.options, q.options.indexOf(q.ans), side ? '三邊一樣長是正三角形，兩邊一樣長是等腰三角形。' : '有一個直角是直角三角形，有一個鈍角是鈍角三角形，三個都是銳角是銳角三角形。', `對了！是${q.ans}。`, q.mode);
    if (fast) return ask();
    tapAlso('tr', 'm');
    actionBtn('m', side ? '📏 量三邊（公分）' : '📐 量三個角').onclick = () => { sfx.hop(); document.getElementById('tr').innerHTML = triSvg(q.t, side ? 's' : 'a'); ask(); };
    return;
  }
  if (q.mode === 'flip') {
    const sh = Logic.SHAPES[q.s], pts = sh.map(p => p.join(',')).join(' ');
    const tf = (r, f) => `rotate(${r} 50 50) translate(${f ? 100 : 0} 0) scale(${f ? -1 : 1} 1)`;
    const tr = q.r * 90;
    frame('把藍色的零件轉一轉、翻一翻，<br>疊到灰色的上面。', `<svg class="fit" viewBox="-5 -5 110 110"><polygon points="${pts}" transform="${tf(tr, q.f)}" fill="#d8dde5" stroke="#8a93a3" stroke-width="2"/><polygon id="mv" points="${pts}" fill="#6ea8dc" fill-opacity=".7" stroke="#2f5f9e" stroke-width="2"/></svg><div class="odo two"><button class="turn" id="rot">↻ 轉 90 度</button><button class="turn" id="flp">⇋ 翻面</button></div>`);
    let r = 0, f = 0;
    const draw = () => document.getElementById('mv').setAttribute('transform', tf(r, f));
    const check = () => {
      draw(); sfx.hop();
      if (r === tr && f === q.f) { document.querySelectorAll('.turn').forEach(b => { b.disabled = true; }); finish(2, 'flip', '疊得剛剛好！只是轉一轉、翻一翻，形狀大小都沒變，這叫作全等。'); }
    };
    const fitSvg = document.querySelector('.fit'), holdF = document.createElement('div'); fitSvg.parentNode.insertBefore(holdF, fitSvg); holdF.appendChild(fitSvg);
    dragRotate(holdF, d => { if (R.grades.length) return; r = (r + (d > 0 ? 90 : 270)) % 360; check(); });
    setMsg('在零件上繞圈轉動，也可以按按鈕。');
    document.getElementById('rot').onclick = () => { r = (r + 90) % 360; check(); };
    document.getElementById('flp').onclick = () => { r = (360 - r) % 360; f ^= 1; check(); };
    return;
  }
  const T = [[15, 85], [85, 85], [25, 25]], pts = T.map(p => p.join(',')).join(' ');
  const line = (i, c, w) => `<line x1="${T[i][0]}" y1="${T[i][1]}" x2="${T[(i + 1) % 3][0]}" y2="${T[(i + 1) % 3][1]}" stroke="${c}" stroke-width="${w}"/>`;
  const ans = q.ask === 'a' ? q.a : q.b, cname = q.ask === 'a' ? '紅色' : '藍色';
  frame(`這兩片機翼全等。<br>右邊${cname}的邊長是幾公分？`, `<div class="vs"><svg class="fit half" viewBox="0 0 100 100"><polygon points="${pts}" fill="#fff2c9"/>${line(0, '#d6476b', 4)}${line(1, '#2f5f9e', 4)}${line(2, '#8a93a3', 2)}<text x="48" y="99" text-anchor="middle" class="tv2">${q.a}</text><text x="66" y="50" class="tv2">${q.b}</text></svg><svg class="fit half" viewBox="0 0 100 100"><g id="gg" transform="rotate(${q.r * 90} 50 50)"><polygon points="${pts}" fill="#fff2c9"/>${line(0, '#d6476b', 4)}${line(1, '#2f5f9e', 4)}${line(2, '#8a93a3', 2)}</g></svg></div>${padHidden()}`);
  const askC = () => stepKeypad(['幾公分？'], [ans], '全等的圖形疊得起來，對應的邊一樣長。', `對了！對應邊一樣長，都是 ${ans} 公分。`, 'corr');
  if (isFast(q)) return afterAct(askC);
  let rt = q.r, over = false; const gg = document.getElementById('gg'), wrapR = gg.closest('svg');
  const turn = d => { if (over) return; rt = (rt + d + 4) % 4; sfx.hop(); gg.setAttribute('transform', `rotate(${rt * 90} 50 50)`); if (rt === 0) { over = true; setMsg('方向一樣了！', 'good'); afterAct(askC); } };
  const holder = document.createElement('span'); wrapR.parentNode.insertBefore(holder, wrapR); holder.appendChild(wrapR);
  dragRotate(holder, turn);
  setMsg('在右邊的機翼上繞圈轉動，轉到和左邊一樣。');
  actionBtn('gt', '↻ 把右邊轉 90 度').onclick = () => turn(1);
}

/* ---------- 六：分數燃料站 ---------- */
const fracHtml = (a, n) => `<span class="frac num"><i>${a}</i><i>${n}</i></span>`;
const mixHtml = (w, a, n) => `<span class="mixed num">${w ? `<b>${w}</b>` : ''}${a || !w ? fracHtml(a, n) : ''}</span>`;
const SLICE = { a: '#d6476b', b: '#f0a03c', g: '#ffffff', '': '#fff0cf' };
function pieSvg(n, states, from) { // 每塊都可以點
  const P = i => { const t = i / n * 2 * Math.PI - Math.PI / 2; return `${60 + 54 * Math.cos(t)} ${60 + 54 * Math.sin(t)}`; };
  let s = '<svg class="pie" viewBox="0 0 120 120"><circle cx="60" cy="60" r="57" fill="#c98f4a"/>';
  for (let i = 0; i < n; i++) { const st = states[i] || '', idx = (from || 0) + i; s += n === 1 ? `<circle data-s="${idx}" cx="60" cy="60" r="54" fill="${SLICE[st]}"/>` : `<path data-s="${idx}" d="M60 60L${P(i)}A54 54 0 0 1 ${P(i + 1)}Z" fill="${SLICE[st]}" stroke="#a9702a" stroke-width="2"/>`; }
  return s + '</svg>';
}
function piesOf(total, n, min) { // 其他題目用的整排派
  const cnt = Math.max(min || 1, Math.ceil(total / n)); let out = '';
  for (let k = 0; k < cnt; k++) out += pieSvg(n, Array.from({ length: n }, (_, i) => k * n + i < total ? 'a' : ''));
  return `<div class="pies">${out}</div>`;
}
/* 真實的東西：派、巧克力、果汁、緞帶。一個東西平分成 n 份，每一份都點得到 */
const FOOD = [
  { k: 'pie', one: '個派', cut: '切成', u: '塊', e: '🍰' },
  { k: 'choc', one: '片巧克力', cut: '分成', u: '格', e: '🍫' },
  { k: 'juice', one: '瓶果汁', cut: '倒成', u: '杯', e: '🥤' },
  { k: 'rib', one: '條緞帶', cut: '剪成', u: '段', e: '🎀' },
];
function food1(f, n, st, from) {
  if (f.k === 'pie') return pieSvg(n, st, from);
  return `<div class="food ${f.k}" style="--n:${n}">${Array.from({ length: n }, (_, i) => `<i data-s="${from + i}" class="${st[i] || ''}"></i>`).join('')}</div>`;
}
function foods(f, n, states) { // states 的長度是 n 的倍數
  let out = '';
  for (let k = 0; k < states.length / n; k++) out += `<span class="whole">${food1(f, n, states.slice(k * n, k * n + n), k * n)}</span>`;
  return `<div class="foods">${out}</div>`;
}
const emptyStates = (total, n) => new Array(Math.max(1, Math.ceil(total / n)) * n).fill('');
const loose = (f, cnt) => `<div class="loose">${`<span>${f.e}</span>`.repeat(cnt)}</div>`;
const meanBox = (f, a, n) => `<div class="mean">${fracHtml(a, n)}<span><b>下面 ${n}</b>：1 ${f.one}${f.cut} ${n} ${f.u}<br><b>上面 ${a}</b>：有 ${a} ${f.u}</span></div>`;
const wholeText = (f, c, n) => { const w = Math.floor(c / n), r = c % n; return w ? `${w} ${f.one}${r ? `又 ${r} ${f.u}` : ''}` : `${r} ${f.u}`; };
function viewFra(q) {
  const f = FOOD[q.food || 0], gr = () => R.tries === 0 ? 2 : R.tries === 1 ? 1 : 0;
  if (q.mode === 'kind') {
    const total = q.w * q.n + q.a, opts = ['真分數', '假分數', '帶分數'];
    frame(`${mixHtml(q.w, q.a, q.n)} ${f.one}，<br>${isFast(q) ? '這是哪一種分數？' : `點一點，一${f.u}一${f.u}放上去。`}`, `${q.w ? '' : meanBox(f, q.a, q.n)}<div id="pp"></div><div class="trail" id="ct"></div>`);
    let k = isFast(q) ? total : 0, over = false;
    const draw = () => { const st = emptyStates(total, q.n).map((_, i) => i < k ? 'a' : ''); setEl('pp', foods(f, q.n, st)); setEl('ct', k ? `現在 ${wholeText(f, k, q.n)}` : `1 ${f.one}${f.cut} ${q.n} ${f.u}`); };
    const ask = () => { over = true; setEl('ct', total < q.n ? `不到 1 ${f.one}` : total === q.n ? `剛好 1 ${f.one}` : `超過 1 ${f.one}，有 ${wholeText(f, total, q.n)}`); pickOne(opts, opts.indexOf(q.ans), '不到 1 個是真分數；剛好或超過 1 個、寫成幾分之幾的是假分數；寫成幾個又幾分之幾的是帶分數。', `對了！是${q.ans}。`, 'kind'); };
    draw();
    if (isFast(q)) return ask();
    const put = () => { if (over) return; k++; sfx.hop(); draw(); if (k === q.n && total > q.n) setMsg(`滿 1 ${f.one}了，繼續放！`, 'good'); if (k === total) ask(); };
    document.getElementById('pp').onclick = e => { if (e.target.closest('[data-s]')) put(); };
    actionBtn('gt', `放 1 ${f.u}`).onclick = put;
    return;
  }
  if (q.mode === 'pack') {
    frame(`${fracHtml(q.a, q.n)} ${f.one}，就是 ${q.a} ${f.u}。<br>每 ${q.n} ${f.u}湊成 1 ${f.one}，湊湊看。`, `${meanBox(f, q.a, q.n)}<div id="box"></div><div id="lz"></div><div class="trail" id="ct"></div>${padHidden()}`);
    let put = isFast(q) ? q.a : 0;
    const draw = () => { setEl('box', foods(f, q.n, emptyStates(Math.max(q.a, 1), q.n).map((_, i) => i < put ? 'a' : ''))); setEl('lz', q.a - put ? loose(f, q.a - put) : ''); setEl('ct', `湊好 ${Math.floor(put / q.n)} ${f.one}，還有 ${q.a - put} ${f.u}沒放`); };
    draw();
    const ask = () => stepKeypad(q.r ? [`湊滿幾${f.one}？`, `還多幾${f.u}？`] : [`湊滿幾${f.one}？`], q.r ? [q.w, q.r] : [q.w], `每 ${q.n} ${f.u}是 1 ${f.one}。`, q.r ? `對了！${q.a}/${q.n} 就是 ${q.w} 又 ${q.r}/${q.n}：${q.w} ${f.one}又 ${q.r} ${f.u}。` : `對了！${q.a}/${q.n} 就是 ${q.w} ${f.one}。`, 'pack');
    if (isFast(q)) return afterAct(ask);
    const go = d => { put = Math.min(q.a, put + d); sfx.hop(); draw(); if (put === q.a) { setMsg('都放好了！', 'good'); afterAct(ask); return; } paint(); };
    const paint = () => { document.getElementById('actions').innerHTML = `<button class="btn" id="gt">放 1 ${f.u}</button><button class="btn alt" id="more">放滿這一${f.one.slice(0, 1)}</button>`; document.getElementById('gt').onclick = () => go(1); document.getElementById('more').onclick = () => go(q.n - put % q.n); };
    document.getElementById('lz').onclick = () => go(1);
    paint();
    return;
  }
  if (q.mode === 'unpack') {
    frame(`${mixHtml(q.w, q.r, q.n)} ${f.one}：<br>${q.w} ${f.one}又 ${q.r} ${f.u}。全部拆開，共幾${f.u}？`, `<div id="box"></div><div id="lz"></div><div class="trail" id="ct"></div>${padHidden()}`);
    let box = isFast(q) ? 0 : q.w;
    const draw = () => { const cnt = (q.w - box) * q.n + q.r; setEl('box', box ? foods(f, q.n, new Array(box * q.n).fill('a')) : ''); setEl('lz', loose(f, cnt)); setEl('ct', box ? `點整${f.one.slice(0, 1)}的東西，拆成 ${q.n} ${f.u}` : '全部拆開了，數一數'); };
    draw();
    const ask = () => stepKeypad([`共幾${f.u}？（答案是 □/${q.n}）`], [q.ans], `${q.w} ${f.one}是 ${q.w}×${q.n} ${f.u}，再加 ${q.r} ${f.u}。`, `對了！${q.w} 又 ${q.r}/${q.n} 就是 ${q.ans}/${q.n}。`, 'unpack');
    if (isFast(q)) return afterAct(ask);
    const open = () => { if (!box) return; box--; sfx.hop(); draw(); if (!box) { afterAct(ask); return; } };
    document.getElementById('box').onclick = open;
    actionBtn('gt', `拆開 1 ${f.one}`).onclick = open;
    return;
  }
  if (q.mode === 'line') {
    const cells = q.top * q.n, x = i => 20 + i / cells * 300;
    const svg = cur => { let s = `<svg class="fline" viewBox="0 0 340 92">`; for (let i = 0; i < cells; i++) s += `<rect x="${x(i)}" y="6" width="${300 / cells}" height="24" fill="${i < cur ? '#d6476b' : '#fff0cf'}" stroke="#a9702a" stroke-width="${(i + 1) % q.n ? 1 : 3}"/>`; s += `<line x1="20" y1="58" x2="320" y2="58" stroke="#33405a" stroke-width="3"/>`; for (let i = 0; i <= cells; i++) { const m = i % q.n === 0; s += `<line x1="${x(i)}" y1="${m ? 46 : 51}" x2="${x(i)}" y2="${m ? 70 : 65}" stroke="#33405a" stroke-width="${m ? 3 : 1.5}"/>`; if (m) s += `<text x="${x(i)}" y="87" text-anchor="middle" class="pt">${i / q.n}</text>`; } return s + `<path d="M${x(cur)} 46l-7 -12h14z" fill="#2f5f9e"/></svg>`; };
    frame(`拉一條 ${fracHtml(q.a, q.n)} ${f.one}那麼長。<br>每 1 ${f.one}${f.cut} ${q.n} ${f.u}。`, `${meanBox(f, q.a, q.n)}<div id="ln"></div><div class="trail" id="ct"></div><div class="odo two"><button class="turn" id="bk">← 退 1 ${f.u}</button><button class="turn" id="fw">進 1 ${f.u} →</button></div>`);
    let cur = 0;
    const draw = () => { setEl('ln', svg(cur)); setEl('ct', cur ? `${cur} ${f.u}，就是 ${cur}/${q.n}${cur >= q.n ? `，也就是 ${wholeText(f, cur, q.n)}` : ''}` : '拖藍色的箭頭，也可以按按鈕'); };
    draw();
    dragOn(document.getElementById('ln'), xr => { const t = Math.max(0, Math.min(cells, Math.round((xr * 340 - 20) / 300 * cells))); if (t !== cur) { cur = t; sfx.hop(); draw(); } });
    document.getElementById('bk').onclick = () => { cur = Math.max(0, cur - 1); sfx.hop(); draw(); };
    document.getElementById('fw').onclick = () => { cur = Math.min(cells, cur + 1); sfx.hop(); draw(); };
    actionBtn('ok', '就到這裡').onclick = () => {
      if (cur === q.a) return finish(gr(), 'line', `對了！${q.a}/${q.n} 就是 ${q.a} ${f.u}，從 0 走 ${q.a} 格。`);
      if (miss()) { cur = q.a; draw(); return finish(0, { wrong: cur, ans: q.a }, `${q.a}/${q.n} 在這裡，從 0 走 ${q.a} 格。`); }
      setMsg(`上面的 ${q.a} 是 ${q.a} ${f.u}。你拉了 ${cur} ${f.u}。`, 'hint');
    };
    return;
  }
  if (q.mode === 'calc') {
    const start = q.w * q.n + q.a, cap = Math.max(start, start + (q.sub ? 0 : q.b)), st = emptyStates(cap, q.n).map((_, i) => i < start ? 'a' : '');
    frame(`${mixHtml(q.w, q.a, q.n)} ${q.sub ? '－' : '＋'} ${fracHtml(q.b, q.n)}<br>${isFast(q) ? `現在有幾${f.u}？` : q.sub ? `有 ${start} ${f.u}，點掉 ${q.b} ${f.u}。` : `有 ${start} ${f.u}，點空格再放 ${q.b} ${f.u}。`}`, `<div id="pp"></div><div class="trail" id="ct"></div>${padHidden()}`);
    let done = 0;
    const cnt = () => st.filter(x => x === 'a' || x === 'b').length;
    const draw = () => { setEl('pp', foods(f, q.n, st)); setEl('ct', `現在 ${cnt()} ${f.u}，還要${q.sub ? '拿走' : '放'} ${q.b - done} ${f.u}`); };
    const ask = () => { setEl('ct', ''); stepKeypad([`共幾${f.u}？（答案是 □/${q.n}）`], [q.ans], `分母不變，${q.sub ? `${start}－${q.b}` : `${start}＋${q.b}`}。`, `對了！答案是 ${q.ans}/${q.n}${q.ans >= q.n ? `，也就是 ${Math.floor(q.ans / q.n)}${q.ans % q.n ? ` 又 ${q.ans % q.n}/${q.n}` : ''}` : ''}。分母還是 ${q.n}，因為每${f.u}一樣大。`, 'calc'); };
    const act = i => { if (done >= q.b) return; if (i === undefined) i = q.sub ? st.lastIndexOf('a') : st.indexOf(''); if (q.sub ? st[i] !== 'a' : st[i] !== '') return; st[i] = q.sub ? 'g' : 'b'; done++; sfx.hop(); draw(); if (done === q.b) { setMsg('做完了，數數看。', 'good'); afterAct(ask); } };
    if (isFast(q)) { for (let i = 0; i < q.b; i++) { const t = q.sub ? st.lastIndexOf('a') : st.indexOf(''); st[t] = q.sub ? 'g' : 'b'; } draw(); return afterAct(ask); }
    draw();
    document.getElementById('pp').onclick = e => { const c = e.target.closest('[data-s]'); if (c) act(+c.dataset.s); };
    actionBtn('gt', q.sub ? `拿走 1 ${f.u}` : `放 1 ${f.u}`).onclick = () => act();
    return;
  }
  if (q.mode === 'times') {
    const st = emptyStates(q.ans, q.n);
    frame(`${fracHtml(q.a, q.n)} × ${q.k}<br>每人拿 ${q.a} ${f.u}，${q.k} 個人。點一個人，他就拿走。`, `<div class="people-row" id="pl">${Array.from({ length: q.k }, (_, i) => `<button class="person-b" data-p="${i}">🙂<small>${q.a} ${f.u}</small></button>`).join('')}</div><div id="pp"></div><div class="trail" id="ct"></div>${padHidden()}`);
    let cur = 0, n = 0; const seen = new Set();
    const draw = () => { setEl('pp', foods(f, q.n, st.map((_, i) => i < cur ? 'a' : ''))); setEl('ct', `共 ${cur} ${f.u}`); };
    const ask = () => stepKeypad([`共幾${f.u}？（答案是 □/${q.n}）`], [q.ans], `${q.a}×${q.k}。分母不變。`, `對了！答案是 ${q.ans}/${q.n}${q.ans >= q.n ? `，也就是 ${wholeText(f, q.ans, q.n)}` : ''}。`, 'times');
    const give = i => { if (seen.has(i)) return; seen.add(i); document.querySelector(`[data-p="${i}"]`).disabled = true; cur += q.a; n++; sfx.hop(); draw(); if (n === q.k) { document.getElementById('actions').innerHTML = ''; setMsg('都拿到了，數數看。', 'good'); afterAct(ask); } };
    if (isFast(q)) { document.getElementById('pl').style.display = 'none'; cur = q.ans; draw(); return afterAct(ask); }
    draw();
    document.querySelectorAll('[data-p]').forEach(b => b.onclick = () => give(+b.dataset.p));
    actionBtn('gt', '下一個人拿').onclick = () => give(n);
    return;
  }
  const left = q.w * q.n + q.r, sts = c => emptyStates(c, q.n).map((_, i) => i < c ? 'a' : '');
  frame(`左邊 ${mixHtml(q.w, q.r, q.n)}，右邊 ${fracHtml(q.a, q.n)}<br>每${f.u}一樣大，哪一邊比較多？`, `<div class="two-col"><div>${foods(f, q.n, sts(left))}<div class="trail" id="c1"></div></div><div>${foods(f, q.n, sts(q.a))}<div class="trail" id="c2"></div></div></div>`);
  gate(q, ['數左邊', '數右邊'], 2, k => { if (k === 1) setEl('c1', `${left} ${f.u}`); else setEl('c2', `${q.a} ${f.u}`); }, () => lrChoices('', '', q.ans, `${q.w} 又 ${q.r}/${q.n} 就是 ${left} ${f.u}，再和 ${q.a} ${f.u}比。`, `對了！左邊 ${left} ${f.u}，右邊 ${q.a} ${f.u}。`, true));
}

/* ---------- 七：密碼規律室 ---------- */
function viewPat(q) {
  if (q.mode === 'hundred') {
    const base = Math.floor(q.start / 10) * 10 + 1, name = { r: '往右', d: '往下', x: '往右下', y: '往左下' }[q.dir], fast = isFast(q);
    let cells = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) { const v = base + r * 10 + c, on = q.cells.includes(v), ask = v === q.ans; cells += `<button class="hc4 num ${on ? 'on' : ''}" data-v="${v}">${ask ? '' : v}</button>`; }
    frame(`百數表上，亮的數${name}走。<br>${fast ? '下一個是多少？' : '下一個在哪裡？點那一格。'}`, `<div class="hgrid">${cells}</div>${padHidden()}`);
    const ask = () => stepKeypad(['這一格是多少？'], [q.ans], '看看亮的數每次差多少。', `對了！${name}走，每次多 ${q.step}。`, 'hundred');
    const mark = () => { const c = document.querySelector(`.hc4[data-v="${q.ans}"]`); c.classList.add('ask'); c.textContent = '？'; };
    if (fast) { mark(); return afterAct(ask); }
    let locked = false;
    document.querySelectorAll('.hc4').forEach(b => b.onclick = () => {
      if (locked) return;
      if (+b.dataset.v === q.ans) { locked = true; sfx.ok(); mark(); setMsg('就是這一格！它是多少？', 'good'); return afterAct(ask); }
      R.tries++; sfx.retry(); setMsg(`順著亮的格子${name}走。`, 'hint');
    });
    return;
  }
  if (q.mode === 'table') {
    const val = (r, c) => q.s + r * q.b + c * q.a, fast = isFast(q);
    const tb = (cr, cc) => { let h = ''; for (let r = 0; r < q.rows; r++) { h += '<tr>'; for (let c = 0; c < q.cols; c++) { const ask = r === q.r && c === q.c, here = r === cr && c === cc, show = r === 0 || c === 0 || (r === 1 && c === 1) || here; h += `<td class="num ${ask ? 'ask' : ''} ${here ? 'here' : ''}">${ask && !here ? '？' : show ? val(r, c) : ''}</td>`; } h += '</tr>'; } return `<table class="seq-t seat">${h}</table>`; };
    frame('飛船座位的編號有規律。<br>從左上角走到？，它是幾號？', `<div id="tb4">${tb(0, 0)}</div><div class="odo two" id="wk"><button class="turn" id="rg">往右走（多 ${q.a}）</button><button class="turn" id="dn">往下走（多 ${q.b}）</button></div>${padHidden()}`);
    const ask = () => { document.getElementById('wk').style.display = 'none'; stepKeypad(['幾號？'], [val(q.r, q.c)], `橫著每次多 ${q.a}，直著每次多 ${q.b}。`, `對了！橫著每次多 ${q.a}，直著每次多 ${q.b}。`, 'table'); };
    if (fast) { setEl('tb4', tb(-1, -1)); return afterAct(ask); }
    let r = 0, c = 0;
    const step = (dr, dc) => {
      if (r + dr > q.r || c + dc > q.c) { R.tries++; sfx.retry(); return setMsg('走過頭了，換一個方向。', 'hint'); }
      r += dr; c += dc; sfx.hop(); setEl('tb4', tb(r, c));
      if (r === q.r && c === q.c) { setEl('tb4', tb(-1, -1)); setMsg('走到了！算算看，它是幾號？', 'good'); afterAct(ask); }
    };
    document.getElementById('rg').onclick = () => step(0, 1); document.getElementById('dn').onclick = () => step(1, 0);
    return;
  }
  if (q.mode === 'turn') {
    const F = (r, f) => `<svg class="fshape" viewBox="0 0 60 60"><g transform="rotate(${r} 30 30) translate(${f ? 60 : 0} 0) scale(${f ? -1 : 1} 1)"><path d="M18 8h26v9H28v9h13v9H28v17H18z" fill="#2f5f9e"/></g></svg>`;
    const last = q.seq[4]; let r = q.seq[3].r, f = q.seq[3].f;
    frame('零件照規律排。<br>把最後一個轉一轉、翻一翻，排出下一個。', `<div class="seq">${q.seq.slice(0, 4).map(s => F(s.r, s.f)).join('')}<span class="q-slot" id="me">${F(r, f)}</span></div><div class="odo two"><button class="turn" id="rot">↻ 轉 90 度</button><button class="turn" id="flp">⇋ 翻面</button></div>`);
    const draw = () => setEl('me', F(r, f));
    document.getElementById('rot').onclick = () => { r = (r + 90) % 360; sfx.hop(); draw(); };
    document.getElementById('flp').onclick = () => { f ^= 1; sfx.hop(); draw(); };
    dragRotate(document.getElementById('me'), d => { r = (r + (d > 0 ? 90 : 270)) % 360; sfx.hop(); draw(); });
    actionBtn('ok', '排好了').onclick = () => {
      const msg = q.flip ? '對了！正面、翻面輪流出現。' : `對了！每次都轉 ${q.stepDeg} 度。`;
      const stop = () => document.querySelectorAll('.turn').forEach(b => { b.disabled = true; });
      if (r === last.r && f === last.f) { stop(); return finish(graded(), 'turn', msg); }
      if (miss()) { r = last.r; f = last.f; draw(); stop(); return finish(0, { ans: 'turn' }, q.flip ? '應該長這樣：正面、翻面輪流。' : `應該長這樣：每次轉 ${q.stepDeg} 度。`); }
      setMsg(q.flip ? '一個正面、一個翻面，輪流出現。' : `看看每次轉幾度。`, 'hint');
    };
    return;
  }
  const pairs = n => `<div class="pairs">${Array.from({ length: Math.floor(n / 2) }, () => '<span class="pair"><i></i><i></i></span>').join('')}${n % 2 ? '<span class="pair one"><i></i></span>' : ''}</div>`;
  frame(`${q.a} ${q.op} ${q.b} ＝ ${q.v}，答案是奇數還是偶數？`, `<div id="pr"><div class="trail">${q.op === '×' ? `${q.a} 排，每排 ${q.b} 個` : `${q.a} 和 ${q.b}`}</div></div>`);
  const opts = ['奇數', '偶數'];
  const ask = () => pickOne(opts, opts.indexOf(q.ans), '每 2 個配一對，全部配完是偶數，多 1 個是奇數。', `對了！${q.v} 是${q.ans}。`, 'odd');
  if (isFast(q)) return ask();
  tapAlso('pr', 'p');
  actionBtn('p', '兩個兩個配對').onclick = () => { sfx.hop(); document.getElementById('pr').innerHTML = pairs(q.v); ask(); };
}

/* ---------- 八：採購併式處 ---------- */
function viewMix(q) {
  const stageOf = t => `<div class="expr">${t.map((x, i) => typeof x === 'number' ? `<b class="num">${x}</b>` : x === '(' || x === ')' ? `<em class="pr">${x}</em>` : `<button class="op num" data-op="${i}">${x}</button>`).join('')}</div>`;
  function play() {
    let t = q.tokens.slice();
    frame(`${q.story}<br>先算哪一段？點那個符號。`, `<div id="ex"></div>${padHidden()}`);
    const round = () => {
      document.getElementById('ex').innerHTML = stageOf(t);
      const want = Logic.nextOp(t);
      document.querySelectorAll('.pad-wrap').forEach(x => { x.hidden = true; });
      document.querySelectorAll('.op').forEach(b => b.onclick = () => {
        if (+b.dataset.op !== want) { R.tries++; sfx.retry(); return setMsg(t.includes('(') ? '括號裡面要先算。' : t.some(x => x === '×' || x === '÷') ? '先乘除，後加減。' : '只有加減或只有乘除，就從左邊算過來。', 'hint'); }
        b.classList.add('now'); sfx.hop(); setMsg('');
        const a = t[want - 1], c = t[want + 1], next = Logic.applyOp(t, want);
        showKeypad();
        const entry = document.getElementById('entry'); entry.style.display = ''; document.querySelectorAll('.keypad').forEach(k => { k.style.display = ''; });
        document.getElementById('ask').innerHTML = nums(`${a} ${t[want]} ${c} ＝ ？`);
        bindKeypad((val, clear) => {
          clear();
          if (val !== next.v) { R.tries++; sfx.retry(); return setMsg(R.tries > 2 ? nums(`是 ${next.v}。`) : '再算一次。', 'hint'); }
          sfx.ok(); t = next.t;
          if (t.length === 1) { document.getElementById('ex').innerHTML = stageOf(t); document.querySelectorAll('.pad-wrap').forEach(x => { x.hidden = true; }); return finish(graded(), 'mix', `對了！答案是 ${fmt(q.ans)}。`); }
          setMsg('', ''); round();
        });
      });
    };
    round();
  }
  if (q.mode === 'write') {
    frame(`${q.story}<br>哪一個算式是對的？`, '<div class="u-big">🧾</div>');
    document.getElementById('actions').innerHTML = `<div class="choices col">${q.options.map(o => `<button class="choice num" data-o="${esc(o)}">${o}</button>`).join('')}</div>`;
    document.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
      if (b.dataset.o === q.right) { sfx.ok(); return play(); }
      R.tries++; sfx.retry(); b.classList.add('no'); b.disabled = true; setMsg('先想想：買東西花的錢要怎麼算？再從付的錢裡減掉。', 'hint');
    });
    return;
  }
  play();
}

/* ---------- 九：精密小數台 ---------- */
function hundred(v, cls) { // v 個 0.01 塗在一張百格板；超過 100 再畫一張
  const one = (n, c) => `<div class="hboard ${c || ''}">${Array.from({ length: 100 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div>`;
  let out = '', left = v; const cnt = Math.max(1, Math.ceil(v / 100));
  for (let k = 0; k < cnt; k++) { out += one(Math.min(100, left), cls); left = Math.max(0, left - 100); }
  return `<div class="hrow">${out}</div>`;
}
function hundredTwo(a, b) { // 前 a 格一色，接下去 b 格另一色
  let out = ''; const total = a + b, cnt = Math.max(1, Math.ceil(total / 100));
  for (let k = 0; k < cnt; k++) out += `<div class="hboard">${Array.from({ length: 100 }, (_, i) => { const x = k * 100 + i; return `<i class="${x < a ? 'on' : x < total ? 'on2' : ''}"></i>`; }).join('')}</div>`;
  return `<div class="hrow">${out}</div>`;
}
function viewDec(q) {
  const d2 = Logic.d2;
  if (q.mode === 'paint') {
    frame(`把 <b class="num">${q.text}</b> 塗出來。<br>一整張是 1，一排是 0.1，一格是 0.01。`, `<div id="hb"></div><div class="u-count"><b class="num" id="cnt"></b></div><div class="odo two">${[[100, '＋1 張'], [10, '＋1 排'], [1, '＋1 格'], [-1, '−1 格'], [-10, '−1 排']].map(p => `<button class="turn" data-h="${p[0]}">${p[1]}</button>`).join('')}</div>`);
    let v = 0;
    const draw = () => { const n = Math.max(Math.ceil(q.v / 100), Math.ceil(v / 100), 1); let h = '', left = v; for (let i = 0; i < n; i++) { h += hundred(Math.min(100, left)).replace(/^<div class="hrow">|<\/div>$/g, ''); left = Math.max(0, left - 100); } document.getElementById('hb').innerHTML = `<div class="hrow">${h}</div>`; document.getElementById('cnt').textContent = d2(v); };
    draw();
    document.querySelectorAll('.turn').forEach(b => b.onclick = () => { v = Math.max(0, Math.min(299, v + +b.dataset.h)); sfx.hop(); draw(); setMsg(''); });
    const hb = document.getElementById('hb');
    setMsg('手指在百格板上拖著塗，也可以按按鈕。');
    dragOn(hb, (x, y, e) => {
      const boards = [...hb.querySelectorAll('.hboard')], i = boards.findIndex(b => { const r = b.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right; });
      if (i < 0) return;
      const r = boards[i].getBoundingClientRect(), row = Math.max(0, Math.min(9, Math.floor((e.clientY - r.top) / r.height * 10))), col = Math.max(0, Math.min(9, Math.floor((e.clientX - r.left) / r.width * 10))), t = i * 100 + row * 10 + col + 1;
      if (t !== v) { v = t; sfx.hop(); draw(); setMsg(''); }
    }, '.hrow');
    actionBtn('ok', '塗好了').onclick = () => {
      if (v === q.v) return finish(graded(), 'paint', `對了！${q.text} 是 ${Math.floor(q.v / 100)} 張、${Math.floor(q.v % 100 / 10)} 排、${q.v % 10} 格，也就是 ${q.v} 個 0.01。`);
      if (miss()) { v = q.v; draw(); return finish(0, { wrong: v, ans: q.v }, `${q.text} 要塗 ${q.v} 格。`); }
      setMsg(v < q.v ? '還不夠，再多塗一些。' : '塗太多了。', 'hint');
    };
    return;
  }
  if (q.mode === 'meter') {
    const whole = Math.floor(q.cm / 100), rest = q.cm % 100;
    const fast = isFast(q);
    frame(`接出一根 ${q.cm} 公分的管子，<br>它是幾公尺？`, `<div class="msticks" id="ms"></div><div class="u-count"><b class="num" id="cnt">0</b> 公分</div><div class="trail">1 公尺＝100 公分，1 公分＝0.01 公尺</div><div class="odo three" id="mb"><button class="turn" data-h="100">接 1 公尺</button><button class="turn" data-h="10">接 10 公分</button><button class="turn" data-h="1">接 1 公分</button></div>`);
    let cur = fast ? q.cm : 0;
    const draw = () => { const w = Math.floor(cur / 100), p = cur % 100; setEl('ms', Array.from({ length: w }, () => '<span class="mstick"><b>1 公尺</b></span>').join('') + (p ? `<span class="mstick part" style="width:${Math.max(p, 22) * .9}px"><b>${p}</b></span>` : '')); document.getElementById('cnt').textContent = cur; };
    const ask = () => { document.getElementById('mb').style.display = 'none'; pickOne(q.options.map(numBtn), q.options.indexOf(q.ans), '小數點後面要有兩位，百分位是公分的位子。', `對了！${q.cm} 公分就是 ${q.ans} 公尺。`, 'meter'); };
    draw();
    if (fast) return ask();
    document.querySelectorAll('#mb .turn').forEach(b => b.onclick = () => {
      const h = +b.dataset.h; if (cur + h > q.cm) { sfx.retry(); return setMsg('這樣太長了，接短一點的。', 'hint'); }
      cur += h; sfx.hop(); draw(); setMsg('');
      if (cur === q.cm) { setMsg('接好了！', 'good'); ask(); }
    });
    return;
  }
  if (q.mode === 'cmp') {
    frame(`${d2(q.l)}　和　${d2(q.r)}<br>哪一邊比較大？`, `<div class="two-col"><div><div id="h1">${hundred(0)}</div><div class="trail num">${d2(q.l)}</div></div><div><div id="h2">${hundred(0, 'alt')}</div><div class="trail num">${d2(q.r)}</div></div></div>`);
    return gate(q, ['塗左邊', '塗右邊'], 2, k => { if (k === 1) setEl('h1', hundred(q.l)); else setEl('h2', hundred(q.r, 'alt')); }, () => lrChoices('', '', q.ans, '比塗了幾格。小數點後面先比十分位，再比百分位。', `對了！${d2(q.l)} 是 ${q.l} 格，${d2(q.r)} 是 ${q.r} 格。`, true));
  }
  const finalPick = (txt, unit) => {
    hideKeypad(); document.querySelectorAll('.pad-wrap').forEach(x => { x.hidden = true; });
    const o = Logic.decOptions(q.ans);
    setMsg(`對了，${q.ans} 個 0.01。那是多少？`, 'good');
    pickOne(o.map(numBtn), o.indexOf(d2(q.ans)), '100 個 0.01 是 1，10 個 0.01 是 0.1。', txt, unit);
  };
  const askN = (label, why, txt) => {
    document.getElementById('ask').innerHTML = nums(label);
    bindKeypad((val, clear) => {
      if (val === q.ans) { sfx.ok(); clear(); return finalPick(txt, q.mode); }
      clear(); if (miss()) { hideKeypad(); return finish(0, { wrong: val, ans: q.ans }, nums(`是 ${q.ans} 個 0.01，就是 ${d2(q.ans)}。${why}`)); }
      setMsg(nums(`你按的 ${val} 不對。${why}`), 'hint');
    });
  };
  if (q.mode === 'calc') {
    const add = q.op === '＋', msg = `對了！${d2(q.a)}${q.op}${d2(q.b)}＝${d2(q.ans)}。`;
    frame(`${d2(q.a)} ${q.op} ${d2(q.b)}<br>想成幾個 0.01。`, `<div id="hb">${hundred(q.a)}</div><div class="trail">${q.a} 個 0.01 ${q.op} ${q.b} 個 0.01</div>${padHidden()}`);
    if (isFast(q)) { afterAct(() => {}); return finalPick(msg, 'calc'); }
    return gate(q, add ? `再塗 ${q.b} 格` : `擦掉 ${q.b} 格`, 1, () => setEl('hb', add ? hundredTwo(q.a, q.b) : hundred(q.ans)), () => askN('現在有幾個 0.01？', `${q.a} ${q.op} ${q.b}。`, msg));
  }
  const small = q.k <= 4, msg = `對了！${d2(q.a)}×${q.k}＝${d2(q.ans)}。`;
  frame(`${d2(q.a)} × ${q.k}<br>想成 ${q.a} 個 0.01，放 ${q.k} 次。`, `<div class="hrow wrap" id="hb"></div><div class="trail" id="ct">小數乘整數：先當整數乘，再放回小數點</div>${padHidden()}`);
  if (isFast(q)) { afterAct(() => {}); return finalPick(msg, 'times'); }
  const per = q.k <= 9 ? 1 : 5, need = Math.ceil(q.k / per);
  gate(q, q.k <= 9 ? '放一次' : '放 5 次', need, k => {
    const done = Math.min(q.k, k * per);
    setEl('hb', small ? Array.from({ length: done }, () => hundred(q.a)).join('') : Array.from({ length: done }, () => `<span class="crate small"><b class="num">${q.a}</b><small>格</small></span>`).join(''));
    setEl('ct', `放了 ${done} 次`);
  }, () => askN(`${q.a}×${q.k}＝？`, `${q.a}×${q.k}。`, msg));
}
/* ---------- 十：公里跑道 ---------- */
const kmText = v => `${Math.floor(v / 1000)} 公里${v % 1000 ? ` ${v % 1000} 公尺` : ''}`;
function viewKm(q) {
  if (q.mode === 'pick') return unitPick(q);
  if (q.mode === 'laps') {
    const goal = q.km * 1000;
    frame(`操場跑一圈 ${q.lap} 公尺。<br>要跑滿 ${q.km} 公里，跑幾圈？`, `<div class="u-bar" id="bar">${Array.from({ length: q.ans }, () => '<i></i>').join('')}</div><div class="u-count"><b class="num" id="m">0</b> 公尺</div>${padHidden()}`);
    let n = 0;
    const ask = () => stepKeypad(['跑了幾圈？'], [q.ans], `${goal}÷${q.lap}。`, `對了！跑 ${q.ans} 圈就是 ${q.km} 公里。1 公里＝1000 公尺。`, 'laps');
    if (isFast(q)) return afterAct(ask);
    tapAlso('bar', 'run');
    actionBtn('run', '🏃 跑一圈').onclick = () => {
      n++; sfx.hop(); document.querySelectorAll('#bar i').forEach((c, j) => c.classList.toggle('on', j < n)); document.getElementById('m').textContent = n * q.lap;
      if (n === q.ans) { setMsg(`${goal} 公尺，就是 ${q.km} 公里！`, 'good'); afterAct(ask); }
    };
    return;
  }
  if (q.mode === 'to') {
    frame(`${q.k} 公里 ${q.m} 公尺，<br>是幾公尺？`, `<div class="kms" id="ks"></div><div class="u-count"><b class="num" id="cnt">0</b> 公尺</div>${padHidden()}`);
    const ask = () => { document.getElementById('cnt').parentNode.style.display = 'none'; stepKeypad([`${q.k} 公里是幾公尺？`, '全部是幾公尺？'], [q.k * 1000, q.ans], `1 公里＝1000 公尺，別忘了後面的 ${q.m} 公尺。`, `對了！${kmText(q.ans)}就是 ${q.ans} 公尺。`, 'to', null, { shortcut: true }); };
    return gate(q, [...new Array(q.k).fill('鋪 1 公里'), `再鋪 ${q.m} 公尺`], q.k + 1, k => {
      const km = Math.min(k, q.k); setEl('ks', '<span class="kmb">1 公里</span>'.repeat(km) + (k > q.k ? `<span class="kmb part">${q.m} 公尺</span>` : ''));
      document.getElementById('cnt').textContent = km * 1000 + (k > q.k ? q.m : 0);
    }, ask);
  }
  if (q.mode === 'back') {
    frame(`路牌寫 ${q.v} 公尺，<br>是幾公里幾公尺？`, `<div class="kms" id="ks"></div><div class="u-count">還有 <b class="num" id="cnt">${q.v}</b> 公尺</div><div class="trail">每 1000 公尺換成 1 公里</div>${padHidden()}`);
    return gate(q, '拿 1000 公尺換 1 公里', q.k, k => { setEl('ks', '<span class="kmb">1 公里</span>'.repeat(k)); document.getElementById('cnt').textContent = q.v - k * 1000; }, () => stepKeypad(['幾公里？', '還剩幾公尺？'], [q.k, q.m], '看有幾個 1000。', `對了！${q.v} 公尺就是 ${kmText(q.v)}。`, 'back'));
  }
  if (q.mode === 'road' || q.mode === 'days') {
    const road = q.mode === 'road', head = road ? (q.sub ? `全程 ${kmText(q.a)}，已經飛了 ${kmText(q.b)}，<br>還要飛多遠？` : `第一段 ${kmText(q.a)}，第二段 ${kmText(q.b)}，<br>全程多遠？`) : `每天巡邏 ${kmText(q.a)}，<br>${q.k} 天共多遠？`;
    const pic = t => `<svg class="road" viewBox="0 0 320 62"><line x1="20" y1="38" x2="300" y2="38" stroke="#c5cbd6" stroke-width="8" stroke-linecap="round" stroke-dasharray="14 8"/><line x1="20" y1="38" x2="${20 + 280 * t}" y2="38" stroke="#d6476b" stroke-width="8" stroke-linecap="round"/><text x="${20 + 280 * t}" y="27" text-anchor="middle">🚀</text></svg>`;
    const steps = [q.v, Math.floor(q.v / 1000), ...(q.v % 1000 ? [q.v % 1000] : [])], asks = ['換成公尺來算，答案是幾公尺？', '是幾公里？', ...(q.v % 1000 ? ['還剩幾公尺？'] : [])];
    const ask = () => stepKeypad(asks, steps, '都換成公尺再算，算完再換回公里。', `對了！是 ${kmText(q.v)}。`, q.mode);
    if (road) {
      const total = q.sub ? q.a : q.a + q.b, first = q.sub ? q.b : q.a;
      frame(head, `<div id="rd">${pic(0)}</div><div class="trail" id="l1"></div><div class="trail" id="l2"></div>${padHidden()}`);
      return gate(q, q.sub ? ['飛到現在的位置', '量剩下的路'] : ['飛第一段', '飛第二段'], 2, k => {
        if (k === 0) return setEl('rd', pic(0));
        if (k === 1) { setEl('rd', pic(first / total)); setEl('l1', q.sub ? `全程 ${q.a} 公尺，已飛 ${q.b} 公尺` : `第一段 ${q.a} 公尺`); } else { setEl('rd', pic(q.sub ? first / total : 1)); setEl('l2', q.sub ? `${q.a}－${q.b}` : `第二段 ${q.b} 公尺，加起來`); }
      }, ask, { el: document.getElementById('rd'), map: x => { const t = (x * 320 - 20) / 280; return t >= .97 ? 2 : t >= first / total - .04 ? 1 : 0; } });
    }
    frame(head, `<div class="crates" id="cr"></div><div class="trail">每天 ${q.a} 公尺</div>${padHidden()}`);
    return gate(q, '巡邏一天', q.k, k => setEl('cr', Array.from({ length: k }, (_, i) => `<span class="crate small"><small>第 ${i + 1} 天</small><b class="num">${q.a}</b></span>`).join('')), ask);
  }
}

/* ---------- 十一：四邊艙板廠 ---------- */
function quadSvg(t, show, cut) {
  const P = t.pts, C = (P[0][0] + P[2][0]) / 2, D = (P[0][1] + P[2][1]) / 2;
  let s = '<svg class="tri" viewBox="-14 -14 158 144">';
  if (cut) s += `<polygon points="${[P[0], P[1], P[2]].map(p => p.join(',')).join(' ')}" fill="#bcd6f2" stroke="#2f5f9e" stroke-width="3" transform="translate(-3 -4)"/><polygon points="${[P[0], P[2], P[3]].map(p => p.join(',')).join(' ')}" fill="#f7c6a3" stroke="#a9702a" stroke-width="3" transform="translate(3 4)"/>`;
  else s += `<polygon points="${P.map(p => p.join(',')).join(' ')}" fill="#fff2c9" stroke="#7a5b2e" stroke-width="3"/>`;
  if (show === 's') P.forEach((p, i) => { const r = P[(i + 1) % 4], mx = (p[0] + r[0]) / 2, my = (p[1] + r[1]) / 2, dx = mx - C, dy = my - D, l = Math.hypot(dx, dy) || 1; s += `<text x="${mx + dx / l * 12}" y="${my + dy / l * 12 + 5}" text-anchor="middle" class="tv2">${t.side[i]}</text>`; });
  if (show === 'p') {
    const seg = (i, c) => `<line x1="${P[i][0]}" y1="${P[i][1]}" x2="${P[(i + 1) % 4][0]}" y2="${P[(i + 1) % 4][1]}" stroke="${c}" stroke-width="6"/>`;
    s += seg(0, '#d6476b') + seg(2, '#d6476b'); if (t.pr === 2) s += seg(1, '#2f5f9e') + seg(3, '#2f5f9e');
  }
  return s + '</svg>';
}
function viewQuad(q) {
  if (q.mode === 'lines') {
    const t = q.tilt, base = `<line x1="20" y1="40" x2="220" y2="40" stroke="#2f5f9e" stroke-width="5"/>`;
    const second = q.rel === '平行' ? `<line x1="20" y1="110" x2="220" y2="110" stroke="#d6476b" stroke-width="5"/>` : q.rel === '垂直' ? `<line x1="120" y1="40" x2="120" y2="150" stroke="#d6476b" stroke-width="5"/>` : `<line x1="50" y1="150" x2="170" y2="50" stroke="#d6476b" stroke-width="5"/>`;
    const helper = q.rel === '平行' ? `<line x1="70" y1="40" x2="70" y2="110" stroke="#3d9970" stroke-width="3" stroke-dasharray="5 4"/><line x1="170" y1="40" x2="170" y2="110" stroke="#3d9970" stroke-width="3" stroke-dasharray="5 4"/><text x="74" y="80" class="tv2">一樣</text><text x="174" y="80" class="tv2">一樣</text>` : q.rel === '垂直' ? `<path d="M120 40h18v18h-18z" fill="#3d9970" fill-opacity=".5" stroke="#3d9970" stroke-width="2"/><text x="146" y="66" class="tv2">直角</text>` : `<path d="M120 40h18v18h-18z" fill="none" stroke="#3d9970" stroke-width="2" stroke-dasharray="4 3"/><text x="146" y="30" class="tv2">不是直角</text>`;
    const svg = h => `<svg class="fit wide" viewBox="0 0 240 160"><g transform="rotate(${t} 120 80)">${base}${second}${h ? helper : ''}</g></svg>`;
    frame('這兩條線是什麼關係？', `<div class="vs" id="ls">${svg(false)}</div>`);
    const ask = () => pickOne(q.options, q.options.indexOf(q.ans), '相交成直角是垂直；一直保持一樣遠、永遠不相交是平行。', `對了！是${q.ans === '都不是' ? '都不是，兩線相交但不是直角' : q.ans}。`, 'lines');
    if (isFast(q)) return ask();
    actionBtn('t', '📐 用三角板靠靠看').onclick = () => { sfx.hop(); document.getElementById('ls').innerHTML = svg(true); ask(); };
    return;
  }
  if (q.mode === 'name') {
    frame('這塊艙板是什麼形狀？<br>先量量看。', `<div class="vs" id="qs">${quadSvg(q.t)}</div><div class="trail" id="note"></div>`);
    let seen = 0;
    const ask = () => pickOne(q.options, q.options.indexOf(q.ans), '看有幾組平行、邊一不一樣長、有沒有直角。', `對了！是${q.ans}：${q.t.eq}，有 ${q.t.pr} 組平行邊，${q.t.ra ? '4 個都是直角' : '不是直角'}。`, 'name');
    if (isFast(q)) return ask();
    document.getElementById('actions').innerHTML = '<div class="choices"><button class="choice" id="a">📏 量邊長</button><button class="choice" id="b">📐 看平行和直角</button></div>';
    const opened = () => { seen++; if (seen === 2) ask(); };
    document.getElementById('a').onclick = e => { e.target.disabled = true; sfx.hop(); document.getElementById('qs').innerHTML = quadSvg(q.t, 's'); opened(); };
    document.getElementById('b').onclick = e => { e.target.disabled = true; sfx.hop(); document.getElementById('note').innerHTML = `有 ${q.t.pr} 組平行邊，${q.t.ra ? '4 個都是直角' : '不是 4 個直角'}。`; opened(); };
    return;
  }
  if (q.mode === 'pairs') {
    frame('這塊艙板有幾組平行的邊？', `<div class="vs" id="qs">${quadSvg(q.t)}</div>${padHidden()}`);
    const ask = () => stepKeypad(['幾組？'], [q.ans], '相對的兩個邊永遠不相交，才是一組平行邊。', `對了！${q.t.n}有 ${q.ans} 組平行邊。`, 'pairs');
    if (isFast(q)) return afterAct(ask);
    actionBtn('t', '把平行的邊塗色').onclick = () => { sfx.hop(); document.getElementById('qs').innerHTML = quadSvg(q.t, 'p'); afterAct(ask); };
    return;
  }
  frame(`沿著對角線把${q.t.n}剪開，<br>兩塊一樣大嗎？`, `<div class="vs" id="qs">${quadSvg(q.t)}</div>`);
  const opts = ['一樣大', '不一樣大'];
  const ask = () => pickOne(opts, 0, '轉一轉、疊疊看，兩塊可以完全疊合。', `對了！${q.t.n}沿對角線剪開，兩塊疊得起來，是全等的。`, 'diag');
  if (isFast(q)) return ask();
  actionBtn('t', '✂️ 沿對角線剪開').onclick = () => { sfx.hop(); document.getElementById('qs').innerHTML = quadSvg(q.t, '', true); ask(); };
}

/* ---------- 十二：概數估算室 ---------- */
function roundLine(v, lo, hi) {
  const x = n => 25 + (n - lo) / (hi - lo) * 290, mid = (lo + hi) / 2;
  return `<svg class="fline" viewBox="0 0 340 90"><line x1="25" y1="50" x2="315" y2="50" stroke="#33405a" stroke-width="3"/>${[lo, mid, hi].map(n => `<line x1="${x(n)}" y1="38" x2="${x(n)}" y2="62" stroke="#33405a" stroke-width="3"/><text x="${x(n)}" y="82" text-anchor="middle" class="pt">${n}</text>`).join('')}<path d="M${x(v)} 44l-7-14h14z" fill="#d6476b"/><text x="${Math.max(30, Math.min(310, x(v)))}" y="24" text-anchor="middle" class="tv3">${v}</text></svg>`;
}
function viewEst(q) {
  if (q.mode === 'near') {
    frame(`${q.v} 比較靠近哪一個？`, `${roundLine(q.v, q.lo, q.hi)}<div class="trail" id="ct"></div>`);
    const o = [q.lo, q.hi];
    return gate(q, '📏 量量離兩邊多遠', 1, () => setEl('ct', `離 ${q.lo} 差 ${q.v - q.lo}，離 ${q.hi} 差 ${q.hi - q.v}`), () => pickOne(o.map(numBtn), o.indexOf(q.ans), `中間是 ${(q.lo + q.hi) / 2}，看 ${q.v} 在它的哪一邊。`, `對了！四捨五入到百位：十位是 ${Math.floor(q.v / 10) % 10}，所以取 ${q.ans}。`, 'near'));
  }
  if (q.mode === 'up' || q.mode === 'down') {
    const up = q.mode === 'up', full = Math.floor(q.n / q.each), left = q.n % q.each;
    const head = up ? `有 ${q.n} 個零件，每箱裝 ${q.each} 個，<br>全部裝完，最少要幾箱？` : `有 ${q.n} 元，一個零件 ${q.each} 元，<br>最多能買幾個？`;
    frame(head, `<div class="crates" id="cr"></div><div class="u-count">還有 <b class="num" id="cnt">${q.n}</b> ${up ? '個' : '元'}</div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, up ? '裝一箱' : '買一個', full, k => {
      const left2 = q.n - k * q.each;
      setEl('cr', Array.from({ length: k }, () => `<span class="crate small"><b class="num">${q.each}</b></span>`).join('') + (k === full ? `<span class="crate ghost"><b class="num">${left}</b><small>${up ? '沒裝滿' : '不夠買'}</small></span>` : ''));
      document.getElementById('cnt').textContent = left2;
      if (k === full) setEl('ct', up ? '剩下的也要一箱，這叫無條件進入' : '不夠的就不算，這叫無條件捨去');
    }, () => stepKeypad([up ? '最少幾箱？' : '最多幾個？'], [q.ans], up ? `剩下的 ${left} 個也要裝，要多一箱。` : `剩下的 ${left} 元買不起一個。`, up ? `對了！${q.ans} 箱，${q.n} 無條件進入後是 ${q.ans * q.each}。` : `對了！${q.ans} 個，${q.n} 無條件捨去後是 ${q.ans * q.each}。`, q.mode));
  }
  if (q.mode === 'how') {
    const uName = q.u === 1000 ? '千位' : '萬位', chk = q.u === 1000 ? '百位' : '千位';
    frame(`${fmt(q.v)} 用<b>${q.how}</b>法，<br>取概數到${uName}，是多少？`, `${roundLine(q.v, q.lo, q.hi)}<div class="trail" id="ct"></div>`);
    const o = [q.lo, q.hi], dig = Math.floor(q.v / (q.u / 10)) % 10;
    return gate(q, `🔍 看${chk}`, 1, () => setEl('ct', `${chk}是 ${dig}`), () => pickOne(o.map(x => numBtn(fmt(x))), o.indexOf(q.ans), q.how === '四捨五入' ? `看${chk}：0 到 4 捨去，5 到 9 進位。` : q.how === '無條件進入' ? '不管後面是多少，都往大的取。' : '不管後面是多少，都往小的取。', `對了！${fmt(q.v)}≈${fmt(q.ans)}。`, 'how'));
  }
  if (q.mode === 'sum') {
    const est = (a, b) => `<div class="est"><span class="est-b"><b class="num">${q.a}</b><i>↓</i><b class="num near">${a ? Logic.roundTo(q.a, 100) : '？'}</b></span><em>＋</em><span class="est-b"><b class="num">${q.b}</b><i>↓</i><b class="num near">${b ? Logic.roundTo(q.b, 100) : '？'}</b></span></div>`;
    frame(`${q.a} ＋ ${q.b} 大約是多少？<br>先取到整百。`, `<div id="es">${est(0, 0)}</div>`);
    return gate(q, ['第一個數取整百', '第二個數取整百'], 2, k => setEl('es', est(1, k > 1)), () => pickOne(q.options.map(numBtn), q.options.indexOf(q.ans), '把兩個整百加起來。', `對了！大約是 ${q.ans}，寫成 ${q.a}＋${q.b}≈${q.ans}。`, 'sum'));
  }
  const near = q.ans / q.n, est = s => `<div class="est"><span class="est-b"><b class="num">${q.p}</b><i>↓</i><b class="num near">${s ? near : '？'}</b></span><em>×</em><span class="est-b"><b class="num">${q.n}</b></span></div>`;
  frame(`一個零件 ${q.p} 元，買 ${q.n} 個，<br>大約要多少元？`, `<div id="es">${est(0)}</div>`);
  gate(q, `把 ${q.p} 想成好算的數`, 1, () => setEl('es', est(1)), () => pickOne(q.options.map(numBtn), q.options.indexOf(q.ans), `把 ${q.p} 想成 ${near}。`, `對了！${near}×${q.n}＝${q.ans}，大約 ${q.ans} 元。`, 'cost'));
}

/* ---------- 十三：圖表觀測台 ---------- */
function barSvg(labels, vals, o) { // o.step 一格多少；o.base 省略符號的起點；o.top 最高格數
  const base = o.base || 0, top = o.top || Math.max(...vals.map(v => (v - base) / o.step)) + 1, X0 = 44, W = 280, Y0 = 170, H = 150, cell = H / top, bw = W / labels.length;
  let s = `<svg class="chart" viewBox="0 0 330 200">`;
  for (let i = 0; i <= top; i++) { const y = Y0 - i * cell; s += `<line x1="${X0}" y1="${y}" x2="${X0 + W}" y2="${y}" stroke="#d8dde5" stroke-width="1"/><text x="${X0 - 6}" y="${y + 5}" text-anchor="end" class="ct">${i === 0 && !base ? 0 : base + i * o.step}</text>`; }
  if (base) s += `<path d="M${X0 - 6} ${Y0 + 8}l6 -5 -6 -5 6 -5" transform="translate(6 2)" fill="none" stroke="#33405a" stroke-width="2"/>`;
  labels.forEach((l, i) => {
    const h = (vals[i] - base) / o.step * cell, x = X0 + i * bw + bw * .18, w = bw * .64, y = Y0 - h;
    if (o.line) s += ''; else s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${o.hi && o.hi.includes(i) ? '#f0a03c' : '#6ea8dc'}"/>`;
    s += `<text x="${x + w / 2}" y="${Y0 + 22}" text-anchor="middle" class="ct2">${l}</text>`;
  });
  if (o.line) { const P = vals.map((v, i) => [X0 + i * bw + bw / 2, Y0 - (v - base) / o.step * cell]); s += `<polyline points="${P.map(p => p.join(',')).join(' ')}" fill="none" stroke="#d6476b" stroke-width="4"/>${P.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#d6476b"/>`).join('')}`; }
  if (o.mark !== undefined) { const y = Y0 - (o.mark - base) / o.step * cell; s += `<line x1="${X0}" y1="${y}" x2="${X0 + W}" y2="${y}" stroke="#d6476b" stroke-width="3" stroke-dasharray="7 5"/>`; }
  return s + `<line x1="${X0}" y1="${Y0}" x2="${X0 + W}" y2="${Y0}" stroke="#33405a" stroke-width="2"/><line x1="${X0}" y1="${Y0}" x2="${X0}" y2="${Y0 - H}" stroke="#33405a" stroke-width="2"/></svg>`;
}
function viewChart(q) {
  if (q.mode === 'read') {
    const O = m => barSvg(q.labels, q.vals, { step: q.step, hi: [q.r], mark: m, top: Math.max(...q.vals) / q.step + 1 });
    frame(`${q.labels[q.r]}有幾箱？<br>從下面一格一格往上數。`, `<div id="ch">${O(0)}</div><div class="trail" id="ct">一格是 ${q.step} 箱</div>${padHidden()}`);
    const topR = Math.max(...q.vals) / q.step + 1;
    return gate(q, '往上數一格', q.ans / q.step, k => { setEl('ch', O(k * q.step)); setEl('ct', `數了 ${k} 格，一格是 ${q.step} 箱`); }, () => stepKeypad(['幾箱？'], [q.ans], `一格 ${q.step} 箱，數到長條的頂。`, `對了！是 ${q.ans} 箱。`, 'read'), { el: document.getElementById('ch'), map: (x, y) => (170 - y * 200) / (150 / topR) });
  }
  if (q.mode === 'diff') {
    const low = q.vals[q.b], O = m => barSvg(q.labels, q.vals, { step: q.step, hi: [q.a, q.b], mark: m, top: Math.max(...q.vals) / q.step + 1 });
    frame(`${q.labels[q.a]}比${q.labels[q.b]}多幾箱？<br>從低的長條往上數到高的。`, `<div id="ch">${O(low)}</div><div class="trail" id="ct">一格是 ${q.step} 箱</div>${padHidden()}`);
    const topD = Math.max(...q.vals) / q.step + 1;
    return gate(q, '往上數一格', q.ans / q.step, k => { setEl('ch', O(low + k * q.step)); setEl('ct', `差 ${k} 格，一格是 ${q.step} 箱`); }, () => stepKeypad(['多幾箱？'], [q.ans], `差 ${q.ans / q.step} 格，一格 ${q.step} 箱。`, `對了！差 ${q.ans / q.step} 格，共 ${q.ans} 箱。`, 'diff'), { el: document.getElementById('ch'), map: (x, y) => (170 - y * 200) / (150 / topD) - low / q.step });
  }
  if (q.mode === 'build') {
    const st = q.labels.map(() => 0), want = q.vals, table = `<table class="seq-t"><tr>${q.labels.map(l => `<th>${l}</th>`).join('')}</tr><tr>${want.map(v => `<td class="num">${v * q.step}</td>`).join('')}</tr></table>`;
    frame(`照表把長條圖畫出來。<br>一格是 ${q.step} 箱。`, `${table}<div id="ch"></div><div class="bar-btns">${q.labels.map((l, i) => `<div class="bb"><button data-u="${i}">＋</button><button class="dn" data-d="${i}">−</button></div>`).join('')}</div>`);
    const draw = () => { document.getElementById('ch').innerHTML = barSvg(q.labels, st.map(v => v * q.step), { step: q.step, top: 9 }); };
    draw();
    document.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { const i = +b.dataset.u; st[i] = Math.min(9, st[i] + 1); sfx.hop(); draw(); });
    document.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { const i = +b.dataset.d; st[i] = Math.max(0, st[i] - 1); sfx.hop(); draw(); });
    setMsg('手指按住長條往上拖，也可以按下面的按鈕。');
    dragOn(document.getElementById('ch'), (x, y) => { const i = Math.floor((x * 330 - 44) / (280 / 4)); if (i < 0 || i > 3) return; const v = Math.max(0, Math.min(9, Math.round((170 - y * 200) / (150 / 9)))); if (v !== st[i]) { st[i] = v; sfx.hop(); draw(); setMsg(''); } });
    actionBtn('ok', '畫好了').onclick = () => {
      const bad = st.findIndex((v, i) => v !== want[i]);
      if (bad < 0) return finish(graded(), 'build', '對了！長條越高，數量越多。');
      if (miss()) { want.forEach((v, i) => { st[i] = v; }); draw(); document.querySelectorAll('.bar-btns button').forEach(b => { b.disabled = true; }); return finish(0, { ans: 'build' }, '長條圖應該長這樣。數量除以一格的量，就是幾格。'); }
      setMsg(`${q.labels[bad]}不對。${want[bad] * q.step}÷${q.step}＝${want[bad]} 格。`, 'hint');
    };
    return;
  }
  if (q.mode === 'line') {
    const segs = q.labels.slice(1).map((l, i) => `${q.labels[i]}到${l}`), right = q.best;
    frame('燃料用量的折線圖。<br>哪兩個月之間上升最多？', `${barSvg(q.labels, q.vals, { step: q.step, line: true })}<div class="segs" id="sg"></div>`);
    return gate(q, ['量第一段', '量第二段', '量第三段'], 3, k => setEl('sg', q.ds.slice(0, k).map((d, i) => `<span class="${d > 0 ? 'up' : d < 0 ? 'dn' : ''}">${segs[i]}：${d > 0 ? '多' : d < 0 ? '少' : '一樣'}${d ? ` ${Math.abs(d)}` : ''}</span>`).join('')), () => pickOne(segs, right, '線越陡、往上爬越多，就是上升最多。', `對了！${segs[right]}多了 ${q.ds[right]}。`, 'line'));
  }
  const ans = q.vals[q.r], O = m => barSvg(q.labels, q.vals, { step: q.step, base: q.base, hi: [q.r], mark: m, top: (Math.max(...q.vals) - q.base) / q.step + 1 });
  frame(`${q.labels[q.r]}是多少？<br>注意：下面有省略符號！`, `<div id="ch">${O(q.base)}</div><div class="trail" id="ct">0 到 ${q.base} 中間省略了，從 ${q.base} 開始數</div>${padHidden()}`);
  gate(q, '往上數一格', (ans - q.base) / q.step, k => { setEl('ch', O(q.base + k * q.step)); setEl('ct', `從 ${q.base} 開始，數了 ${k} 格，一格 ${q.step}`); }, () => stepKeypad(['是多少？'], [ans], `先看刻度：從 ${q.base} 開始，一格 ${q.step}。`, `對了！是 ${ans}。省略符號讓圖不用畫得太高。`, 'gap'), { el: document.getElementById('ch'), map: (x, y) => (170 - y * 200) / (150 / ((Math.max(...q.vals) - q.base) / q.step + 1)) });
}

/* ---------- 十四：甲板工程處 ---------- */
function deckRect(w, h, walked, tiles, opts) { // opts.hideH 寬先不告訴孩子
  const U = Math.min(28, 260 / w, 170 / h), W = w * U, H = h * U, x0 = 20, y0 = 20;
  let s = `<svg class="deck" viewBox="0 0 ${W + 40} ${H + 40}"><rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="#fff8e6" stroke="#c9a56a" stroke-width="2"/>`;
  if (tiles !== undefined) for (let r = 0; r < tiles; r++) for (let c = 0; c < w; c++) s += `<rect x="${x0 + c * U + 1}" y="${y0 + r * U + 1}" width="${U - 2}" height="${U - 2}" fill="#bfe3b4" stroke="#6aa964"/>`;
  const E = [[x0, y0, x0 + W, y0], [x0 + W, y0, x0 + W, y0 + H], [x0 + W, y0 + H, x0, y0 + H], [x0, y0 + H, x0, y0]];
  if (walked !== undefined) E.forEach((e, i) => { s += `<line x1="${e[0]}" y1="${e[1]}" x2="${e[2]}" y2="${e[3]}" stroke="${i < walked ? '#d6476b' : '#c9a56a'}" stroke-width="${i < walked ? 6 : 2}" stroke-linecap="round"/>`; });
  s += `<text x="${x0 + W / 2}" y="${y0 - 5}" text-anchor="middle" class="tv2">${w}</text><text x="${x0 + W + 5}" y="${y0 + H / 2 + 5}" class="tv2">${opts && opts.hideH ? '？' : h}</text>`;
  return s + '</svg>';
}
function viewDeck(q) {
  if (q.mode === 'pick') return unitPick(q);
  if (q.mode === 'walk') {
    frame(`甲板${q.sq ? '邊長' : `長 ${q.w} 公尺、寬`} ${q.h} 公尺，<br>沿邊圍一圈欄杆，要幾公尺？`, `<div id="dk"></div><div class="u-count"><b class="num" id="sum">0</b> 公尺</div>${padHidden()}`);
    let n = 0, total = 0; const L = [q.w, q.h, q.w, q.h];
    const ask = () => stepKeypad(['一圈幾公尺？'], [q.ans], q.sq ? `正方形周長＝邊長×4。` : `長方形周長＝（長＋寬）×2。`, q.sq ? `對了！${q.h}×4＝${q.ans} 公尺。` : `對了！（${q.w}＋${q.h}）×2＝${q.ans} 公尺。`, 'walk');
    const draw = () => { document.getElementById('dk').innerHTML = deckRect(q.w, q.h, n); document.getElementById('sum').textContent = total; };
    draw();
    if (isFast(q)) { document.getElementById('sum').parentNode.style.display = 'none'; return afterAct(ask); }
    tapAlso('dk', 'wk');
    actionBtn('wk', '🚶 走下一個邊').onclick = () => {
      total += L[n]; n++; sfx.hop(); draw();
      if (n === 4) { setMsg('走完一圈了！周長就是這一圈的長度。', 'good'); document.getElementById('sum').parentNode.style.display = 'none'; afterAct(ask); }
    };
    return;
  }
  if (q.mode === 'tiles') {
    frame(`甲板長 ${q.w} 公尺、寬 ${q.h} 公尺，<br>一塊地磚 1 平方公尺，要幾塊？`, `<div id="dk"></div><div class="trail" id="now"></div>${padHidden()}`);
    let r = 0;
    const ask = () => stepKeypad(['共幾平方公尺？'], [q.ans], '長方形面積＝長×寬。', `對了！${q.w}×${q.h}＝${q.ans} 平方公尺。`, 'tiles');
    const draw = () => { document.getElementById('dk').innerHTML = deckRect(q.w, q.h, undefined, r); document.getElementById('now').innerHTML = `一排 ${q.w} 塊，已鋪 ${r} 排`; };
    draw();
    if (isFast(q)) return afterAct(ask);
    const U4 = Math.min(28, 260 / q.w, 170 / q.h);
    setMsg('手指從上往下拖，把地磚鋪上去。');
    dragOn(document.getElementById('dk'), (x, y) => { const t = Math.max(0, Math.min(q.h, Math.ceil((y * (q.h * U4 + 40) - 20) / U4))); if (t !== r && r < q.h) { r = t; sfx.hop(); draw(); if (r === q.h) { setMsg('鋪滿了！', 'good'); document.getElementById('dk').onpointermove = null; afterAct(ask); } } });
    actionBtn('t', '鋪一排').onclick = () => {
      r++; sfx.hop(); draw();
      if (r === q.h) { setMsg('鋪滿了！', 'good'); afterAct(ask); }
    };
    return;
  }
  if (q.mode === 'ell') {
    const U = 30, L = `0,0 ${q.W * U},0 ${q.W * U},${q.H * U} ${q.cw * U},${q.H * U} ${q.cw * U},${(q.H - q.ch) * U} 0,${(q.H - q.ch) * U}`;
    const svg = cut => `<svg class="deck" viewBox="-24 -24 ${q.W * U + 58} ${q.H * U + 40}">${cut ? `<rect x="0" y="0" width="${q.W * U}" height="${(q.H - q.ch) * U}" fill="#bcd6f2" stroke="#2f5f9e" stroke-width="2"/><rect x="${q.cw * U}" y="${(q.H - q.ch) * U}" width="${(q.W - q.cw) * U}" height="${q.ch * U}" fill="#f7c6a3" stroke="#a9702a" stroke-width="2"/>` : `<polygon points="${L}" fill="#fff2c9" stroke="#7a5b2e" stroke-width="3"/>`}<text x="${q.W * U / 2}" y="-6" text-anchor="middle" class="tv2">${q.W}</text><text x="${q.W * U + 6}" y="${q.H * U / 2}" class="tv2">${q.H}</text><text x="-6" y="${(q.H - q.ch) * U / 2}" text-anchor="end" class="tv2">${q.H - q.ch}</text><text x="${(q.cw + q.W) * U / 2}" y="${q.H * U + 14}" text-anchor="middle" class="tv2">${q.W - q.cw}</text></svg>`;
    frame('這塊 L 形甲板有多大？<br>切成兩個長方形。', `<div id="dk">${svg(false)}</div>${padHidden()}`);
    const ask = () => stepKeypad(['藍色有幾平方公尺？', '橘色有幾平方公尺？', '全部幾平方公尺？'], [q.a1, q.a2, q.ans], '長×寬。邊長要看清楚。', `對了！${q.a1}＋${q.a2}＝${q.ans} 平方公尺。`, 'ell', null, { shortcut: true });
    if (isFast(q)) { document.getElementById('dk').innerHTML = svg(true); return afterAct(ask); }
    tapAlso('dk', 'c');
    actionBtn('c', '✂️ 切開').onclick = () => { sfx.hop(); document.getElementById('dk').innerHTML = svg(true); afterAct(ask); };
    return;
  }
  if (q.mode === 'm2') {
    frame(q.from === 'm' ? `${q.m} 平方公尺，是幾平方公分？` : `${fmt(q.cm)} 平方公分，是幾平方公尺？`, `<div class="trail">1 平方公尺：每邊 100 公分</div><div id="bar">${hundred(0)}</div><div class="u-count"><b class="num" id="cnt">0</b> 平方公分</div>${padHidden()}`);
    return gate(q, '鋪一排（1000 平方公分）', 10, k => { setEl('bar', hundred(k * 10)); document.getElementById('cnt').textContent = k * 1000; if (k === 10) setMsg('鋪滿 1 平方公尺，共 10000 平方公分！', 'good'); }, () => stepKeypad(['答案是多少？'], [q.ans], '1 平方公尺＝10000 平方公分，不是 100。', q.from === 'm' ? `對了！${q.m} 平方公尺＝${fmt(q.ans)} 平方公分。` : `對了！${fmt(q.cm)} 平方公分＝${q.ans} 平方公尺。`, 'm2'), { el: document.getElementById('bar'), sel: '.hboard', map: (x, y) => Math.ceil(y * 10) });
  }
  frame(`甲板面積 ${q.a} 平方公尺，長 ${q.w} 公尺，<br>寬是幾公尺？`, `<div id="dk">${deckRect(q.w, q.h, undefined, 0, { hideH: true })}</div><div class="trail" id="ct">一排 ${q.w} 塊，總共 ${q.a} 塊</div>${padHidden()}`);
  gate(q, '鋪一排', q.h, k => { setEl('dk', deckRect(q.w, q.h, undefined, k, { hideH: true })); setEl('ct', `鋪了 ${k} 排，用掉 ${k * q.w} 塊，還有 ${q.a - k * q.w} 塊`); }, () => stepKeypad(['寬是幾公尺？'], [q.ans], `${q.a}÷${q.w}。`, `對了！${q.a}÷${q.w}＝${q.ans} 公尺。`, 'back'), { el: document.getElementById('dk'), map: (x, y) => { const U5 = Math.min(28, 260 / q.w, 170 / q.h); return Math.ceil((y * (q.h * U5 + 40) - 20) / U5); } });
}

/* ---------- 十五：等值分數廚房 ---------- */
function strip(n, a, cls) { return `<div class="fcells ${cls || ''}">${Array.from({ length: n }, (_, i) => `<i class="fcell ${i < a ? 'on' : ''}"></i>`).join('')}</div>`; }
function viewEqv(q) {
  if (q.mode === 'cut') {
    frame(`兩片一樣大的巧克力，每片分成 ${q.n} 格。<br>上面吃了 ${q.a} 格，就是 ${fracHtml(q.a, q.n)} 片。把下面切細，吃的量變了嗎？`, `${strip(q.n, q.a, 'choc')}<div id="s2">${strip(q.n, q.a, 'choc alt')}</div><div class="trail" id="c">下面也是 ${q.n} 格</div>${padHidden()}`);
    let k = 1;
    const ask = () => stepKeypad([`下面塗色的有幾格？（${q.a}/${q.n}＝□/${q.to}）`], [q.ans], `每格都切成 ${q.k} 小格，${q.a} 格就變成 ${q.a}×${q.k} 小格。`, `對了！${q.a}/${q.n}＝${q.ans}/${q.to}。吃的一樣多，只是格子變小、變多。`, 'cut');
    if (isFast(q)) { setEl('s2', strip(q.to, q.ans, 'choc alt')); return afterAct(ask); }
    tapAlso('s2', 'k');
    actionBtn('k', '每格再切細一次').onclick = () => {
      k++; sfx.hop(); setEl('s2', strip(q.n * k, q.a * k, 'choc alt')); setEl('c', `下面變成 ${q.n * k} 格，塗色的部分一樣長`);
      if (k === q.k) { setMsg(`切成 ${q.to} 格了！`, 'good'); afterAct(ask); }
    };
    return;
  }
  if (q.mode === 'simplify') {
    frame(`巧克力分成 ${q.n} 小格，吃了 ${q.a} 小格，<br>就是 ${fracHtml(q.a, q.n)} 片。每 ${q.k} 小格合成 1 大格。`, `${strip(q.n, q.a, 'choc')}<div id="s2">${strip(q.n, q.a, 'choc alt')}</div>${padHidden()}`);
    return gate(q, `把每 ${q.k} 小格合起來`, 1, () => setEl('s2', strip(q.ansN, q.ansA, 'choc alt')), () => stepKeypad(['吃掉的有幾大格？', '全部有幾大格？'], [q.ansA, q.ansN], `小格數都除以 ${q.k}。`, `對了！${q.a}/${q.n}＝${q.ansA}/${q.ansN}。`, 'simplify'));
  }
  if (q.mode === 'candy') {
    const groups = k => Array.from({ length: q.n }, (_, i) => `<span class="pack ${i < k ? 'on' : ''}">${'🍬'.repeat(q.per)}</span>`).join('');
    frame(`${q.total} 顆糖平分成 ${q.n} 包，<br>${fracHtml(q.a, q.n)} 就是拿 ${q.a} 包，是幾顆？`, `<div class="packs" id="pk">${groups(0)}</div><div class="trail" id="ct">每包 ${q.per} 顆</div>${padHidden()}`);
    return gate(q, '拿一包', q.a, k => { setEl('pk', groups(k)); setEl('ct', `拿了 ${k} 包，${k * q.per} 顆`); }, () => stepKeypad(['幾顆？'], [q.ans], `${q.a}×${q.per}。`, `對了！${q.ans} 顆，也就是 ${q.ans}/${q.total} 盒，和 ${q.a}/${q.n} 一樣多。`, 'candy'));
  }
  if (q.mode === 'cmp') {
    frame(`兩片一樣大的巧克力。<br>上面吃 ${fracHtml(q.a, q.n)} 片，下面吃 ${fracHtml(q.c, q.m)} 片，誰吃得多？`, `<div id="s1">${strip(q.n, q.a, 'choc')}</div><div id="s2">${strip(q.m, q.c, 'choc alt')}</div><div class="trail" id="t">上面的格子比較大，不好比</div>`);
    const labels = { L: '上面多', R: '下面多', E: '一樣多' }, opts = ['L', 'E', 'R'], ask = () => pickOne(opts.map(o => labels[o]), opts.indexOf(q.ans), `${q.a}/${q.n} 切細後是 ${q.a * q.k}/${q.m}，再和 ${q.c}/${q.m} 比。`, `對了！${q.a}/${q.n}＝${q.a * q.k}/${q.m}，${q.a * q.k === q.c ? '兩邊一樣多' : `比 ${q.c}/${q.m} ${q.a * q.k > q.c ? '多' : '少'}`}。`, 'cmp');
    return gate(q, '把上面切成一樣細', 1, () => { setEl('s1', strip(q.m, q.a * q.k, 'choc')); setEl('t', `上面變成 ${q.a * q.k}/${q.m}，格子一樣大了`); }, ask);
  }
  const cells = q.a * (100 / q.n);
  frame(`一大張巧克力有 100 小格，吃 ${fracHtml(q.a, q.n)} 張，<br>換成小數是多少？`, `<div id="hb">${hundred(0)}</div><div class="trail" id="ct">平分成 ${q.n} 份，塗 ${q.a} 份</div>`);
  gate(q, `塗 ${q.a} 份`, 1, () => { setEl('hb', hundred(cells)); setEl('ct', `塗了 ${cells} 格，也就是 ${cells} 個 0.01`); }, () => pickOne(q.options.map(numBtn), q.options.indexOf(q.ans), '先把分母變成 10 或 100，再寫成小數。', `對了！${q.a}/${q.n}＝${q.ans}。`, 'dec'));
}

/* ---------- 十六：時刻調度室 ---------- */
function dayBar(m, s) { // 一天 24 小時的條，看得到白天黑夜
  const pct = x => (x % 1440) / 1440 * 100;
  return `<div class="daybar"><span class="sun"></span><i class="pin" style="left:${pct(s)}%"></i><i class="pin now" style="left:${pct(m)}%"></i><small style="left:0">0</small><small style="left:25%">6</small><small style="left:50%">12</small><small style="left:75%">18</small><small style="left:100%">24</small></div>`;
}
function dragDay(wrap, getCur, cb) { // 拖時間條上的紅針，每 5 分鐘一格；可以跨到隔天
  dragOn(wrap, x => {
    const m = Math.round(Math.max(0, Math.min(1, x)) * 1440 / 5) * 5 % 1440, cur = getCur(), base = Math.floor(cur / 1440) * 1440;
    const t = [base - 1440 + m, base + m, base + 1440 + m].reduce((a, b) => Math.abs(b - cur) < Math.abs(a - cur) ? b : a);
    if (t !== cur) cb(t);
  }, '.daybar');
}
function clockCard(m, label) { return `<div class="tcard"><small>${label}</small><b>${Logic.ampm(m)}</b></div>`; }
function viewTime(q) {
  if (q.mode === 'conv') {
    frame(`${q.big} ${q.u1} ${q.small} ${q.u2}，<br>是幾${q.u2}？`, `<div class="crates" id="cr"></div><div class="trail">1 ${q.u1}＝${q.per} ${q.u2}</div>${padHidden()}`);
    return gate(q, [...new Array(q.big).fill(`放 1 ${q.u1}`), `再放 ${q.small} ${q.u2}`], q.big + 1, k => setEl('cr', Array.from({ length: Math.min(k, q.big) }, () => `<span class="crate"><b class="num">${q.per}</b><small>${q.u2}</small></span>`).join('') + (k > q.big ? `<span class="crate small"><b class="num">${q.small}</b><small>${q.u2}</small></span>` : '')), () => stepKeypad([`${q.big} ${q.u1}是幾${q.u2}？`, '全部是多少？'], [q.big * q.per, q.ans], `1 ${q.u1}是 ${q.per} ${q.u2}，不是 100。`, `對了！${q.big}×${q.per}＋${q.small}＝${q.ans} ${q.u2}。`, 'conv', null, { shortcut: true }));
  }
  if (q.mode === 'h24') {
    const hh = Math.floor(q.m / 60), h12 = hh > 12 ? hh - 12 : hh;
    frame(`${q.text}，<br>用 24 小時制怎麼寫？`, `${dayBar(q.m, q.m)}<div class="trail" id="ct">過了中午，時要接著數</div>`);
    return gate(q, hh > 12 ? '把時加 12' : '中午 12 時不用加', 1, () => setEl('ct', hh > 12 ? `${h12}＋12＝${hh} 時` : '還是 12 時'), () => pickOne(q.options.map(numBtn), q.options.indexOf(q.ans), '下午 1 時是 13 時，下午 2 時是 14 時。', `對了！${q.text}就是 ${q.ans}。`, 'h24'));
  }
  const JUMP = [[60, '＋1 時'], [10, '＋10 分'], [5, '＋5 分'], [-5, '−5 分'], [-10, '−10 分'], [-60, '−1 時']];
  if (q.mode === 'jump') {
    frame(`從${Logic.ampm(q.s)}<br>到${Logic.ampm(q.e)}，經過多久？`, `<div id="tb"></div><div class="u-count" id="ela"></div><div class="odo three" id="jb">${JUMP.map(j => `<button class="turn" data-h="${j[0]}">${j[1]}</button>`).join('')}</div>${padHidden()}`);
    let cur = q.s;
    const ask = () => stepKeypad(['經過幾小時？', '又幾分鐘？'], [q.h, q.m], q.night ? '先算到半夜 12 時，再加上隔天的時間。' : q.noon ? '先算到中午 12 時，再往後算。' : '整點先算，分鐘再算。', `對了！經過 ${q.h} 小時 ${q.m} 分鐘。`, 'jump');
    const draw = () => { const d = cur - q.s; document.getElementById('tb').innerHTML = dayBar(cur, q.s) + clockCard(cur, '現在跳到'); document.getElementById('ela').innerHTML = `走了 <b class="num">${Math.floor(Math.abs(d) / 60)}</b> 小時 <b class="num">${Math.abs(d) % 60}</b> 分鐘`; };
    draw();
    if (isFast(q)) { document.getElementById('jb').style.display = 'none'; document.getElementById('ela').style.display = 'none'; return afterAct(ask); }
    const landJ = () => {
      setMsg(cur > q.e ? '跳過頭了，往回一點。' : cur === q.e ? '到了！' : '', cur === q.e ? 'good' : 'hint');
      if (cur === q.e) { document.getElementById('tb').onpointermove = null; document.getElementById('tb').onpointerdown = null; document.getElementById('jb').style.display = 'none'; document.getElementById('ela').style.display = 'none'; afterAct(ask); }
    };
    dragDay(document.getElementById('tb'), () => cur, t => { cur = Math.max(q.s, t); sfx.hop(); draw(); landJ(); });
    document.querySelectorAll('#jb .turn').forEach(b => b.onclick = () => {
      cur = Math.max(q.s, cur + +b.dataset.h); sfx.hop(); draw();
      setMsg(cur > q.e ? '跳過頭了，往回一點。' : cur === q.e ? '到了！' : '', cur === q.e ? 'good' : 'hint');
      if (cur === q.e) { document.getElementById('jb').style.display = 'none'; document.getElementById('ela').style.display = 'none'; afterAct(ask); }
    });
    return;
  }
  frame(`飛船${Logic.ampm(q.s)}${q.before ? '到站，' : '出發，'}<br>${q.before ? `飛了 ${q.h} 小時 ${q.m} 分鐘。什麼時候出發的？` : `飛 ${q.h} 小時 ${q.m} 分鐘，什麼時候到？`}`, `<div id="tb"></div><div class="odo three" id="jb">${JUMP.map(j => `<button class="turn" data-h="${j[0]}">${j[1]}</button>`).join('')}</div>`);
  let cur = q.s;
  const draw = () => { document.getElementById('tb').innerHTML = dayBar(cur, q.s) + clockCard(cur, '撥到'); };
  draw();
  document.querySelectorAll('#jb .turn').forEach(b => b.onclick = () => { cur = Math.max(0, cur + +b.dataset.h); sfx.hop(); draw(); setMsg(''); });
  dragDay(document.getElementById('tb'), () => cur, t => { cur = Math.max(0, t); sfx.hop(); draw(); setMsg(''); });
  actionBtn('ok', '就是這個時間').onclick = () => {
    if (cur === q.e) { document.querySelectorAll('#jb .turn').forEach(b => { b.disabled = true; }); return finish(graded(), 'after', `對了！是${Logic.ampm(q.e)}。`); }
    if (miss()) { cur = q.e; draw(); document.querySelectorAll('#jb .turn').forEach(b => { b.disabled = true; }); return finish(0, { ans: Logic.ampm(q.e) }, `是${Logic.ampm(q.e)}。先撥小時，再撥分鐘。`); }
    setMsg(q.before ? '要往回撥：先減小時，再減分鐘。' : '先撥小時，再撥分鐘。', 'hint');
  };
}

/* ---------- 十七：體積貨艙 ---------- */
function isoSvg(a, b, c, shown, o) { // shown：畫幾塊（由下往上、由裡往外堆）
  const dx = 20, dy = 11, h = 22, W = (a + b) * dx + 8, H = (a + b) * dy + c * h + 8, ox = b * dx + 4, oy = (c - 1) * h + 4;
  const order = []; for (let z = 0; z < c; z++) for (let y = 0; y < b; y++) for (let x = 0; x < a; x++) order.push([x, y, z]);
  const on = order.slice(0, shown === undefined ? order.length : shown).sort((p, q) => p[2] - q[2] || (p[0] + p[1]) - (q[0] + q[1]));
  const col = o && o.color || ['#6ea8dc', '#3f7cb8', '#2f5f9e'];
  let s = `<svg class="iso" viewBox="0 0 ${W} ${H}">`;
  if (!shown && shown !== undefined) s += `<path d="M${ox} ${oy}l${a * dx} ${a * dy}l${-b * dx} ${b * dy}l${-a * dx} ${-a * dy}z" fill="none" stroke="#b9c2d0" stroke-dasharray="4 4"/>`;
  on.forEach(([x, y, z]) => {
    const px = ox + (x - y) * dx, py = oy + (x + y) * dy - z * h;
    s += `<path d="M${px} ${py}l${dx} ${dy}l${-dx} ${dy}l${-dx} ${-dy}z" fill="${col[0]}" stroke="#fff" stroke-width=".8"/><path d="M${px - dx} ${py + dy}l${dx} ${dy}v${h}l${-dx} ${-dy}z" fill="${col[1]}" stroke="#fff" stroke-width=".8"/><path d="M${px + dx} ${py + dy}l${-dx} ${dy}v${h}l${dx} ${-dy}z" fill="${col[2]}" stroke="#fff" stroke-width=".8"/>`;
  });
  return s + '</svg>';
}
function viewVol(q) {
  if (q.mode === 'pick') return unitPick(q);
  if (q.mode === 'layer') {
    frame('一塊積木是 1 立方公分。<br>這堆貨有幾立方公分？', `<div class="vs" id="iso">${isoSvg(q.a, q.b, q.c)}</div><div class="trail" id="tt">底下那一層：每排 ${q.a} 塊，有 ${q.b} 排</div>${padHidden()}`);
    const ask = () => stepKeypad(['一層有幾塊？', `${q.c} 層共幾立方公分？`], [q.a * q.b, q.ans], `${q.a}×${q.b} 是一層，再乘以 ${q.c} 層。`, `對了！${q.a}×${q.b}×${q.c}＝${q.ans} 立方公分。`, 'layer', null, { shortcut: true });
    if (isFast(q)) return afterAct(ask);
    let n = q.c;
    if (n === 1) return afterAct(ask);
    tapAlso('iso', 't');
    actionBtn('t', '拿走最上面一層看看').onclick = () => {
      n--; sfx.hop(); document.getElementById('iso').innerHTML = isoSvg(q.a, q.b, n);
      document.getElementById('tt').innerHTML = `還剩 ${n} 層，全部有 ${q.c} 層`;
      if (n === 1) afterAct(ask);
    };
    return;
  }
  if (q.mode === 'build') {
    const goal = q.a * q.b * q.c;
    frame(`把貨艙堆滿：<br>每排 ${q.a} 塊、${q.b} 排、${q.c} 層。`, `<div class="vs" id="iso"></div><div class="trail" id="tt"></div><div class="odo three" id="bb"><button class="turn" id="b1">一塊</button><button class="turn" id="b2">一排</button><button class="turn" id="b3">一層</button></div>${padHidden()}`);
    let n = 0;
    const ask = () => stepKeypad(['共幾立方公分？'], [q.ans], `${q.a}×${q.b}×${q.c}。`, `對了！${q.a}×${q.b}×${q.c}＝${q.ans} 立方公分。`, 'build');
    const draw = () => { document.getElementById('iso').innerHTML = isoSvg(q.a, q.b, q.c, n); document.getElementById('tt').innerHTML = n === goal ? '堆滿了！' : '堆滿才算完成'; };
    draw();
    if (isFast(q)) { n = goal; draw(); document.getElementById('bb').style.display = 'none'; return afterAct(ask); }
    const add = k => { n = Math.min(goal, n + k); sfx.hop(); draw(); if (n === goal) { document.getElementById('bb').style.display = 'none'; afterAct(ask); } };
    setMsg('點貨艙放一塊，也可以一次放一排、一層。');
    document.getElementById('iso').onclick = () => { if (n < goal) add(1); };
    document.getElementById('b1').onclick = () => add(1); document.getElementById('b2').onclick = () => add(q.a); document.getElementById('b3').onclick = () => add(q.a * q.b);
    return;
  }
  if (q.mode === 'same') {
    const opts = q.swap ? [q.same, q.other] : [q.other, q.same], right = q.swap ? 0 : 1, total = q.a * q.b * q.c;
    frame('哪一堆和藍色的體積一樣大？', `<div class="vs">${isoSvg(q.a, q.b, q.c)}</div><div class="trail" id="ct"></div>`);
    return gate(q, '數藍色有幾塊', 1, () => setEl('ct', `藍色：每排 ${q.a} 塊、${q.b} 排、${q.c} 層，共 ${total} 塊`), () => pickOne(opts.map(o => isoSvg(o[0], o[1], o[2], undefined, { color: ['#f0b87a', '#d68f4a', '#b5722f'] })), right, '數數看每一堆有幾塊，形狀不同也可能一樣大。', `對了！都是 ${total} 塊，形狀不同，體積一樣大。`, 'same'));
  }
  frame('這個貨櫃由兩堆組成，<br>共幾立方公分？', `<div class="vs iso-two"><div class="iso-c" id="i1"></div><b class="plus">＋</b><div class="iso-c" id="i2"></div></div>${padHidden()}`);
  gate(q, ['堆藍色', '堆橘色'], 2, k => { if (k === 1) setEl('i1', isoSvg(q.a, q.b, q.c)); else setEl('i2', isoSvg(q.d, q.f, q.e, undefined, { color: ['#f0b87a', '#d68f4a', '#b5722f'] })); }, () => stepKeypad(['藍色幾塊？', '橘色幾塊？', '全部幾塊？'], [q.a * q.b * q.c, q.d * q.f * q.e, q.ans], '每一堆都是長×寬×高。', `對了！${q.a * q.b * q.c}＋${q.d * q.f * q.e}＝${q.ans} 立方公分。`, 'two', null, { shortcut: true }));
}
const VIEWS = { big: viewBig, mul: viewMul, deg: viewDeg, divv: viewDivv, tri: viewTri, fra: viewFra, pat: viewPat, mix: viewMix, dec: viewDec, km: viewKm, quad: viewQuad, est: viewEst, chart: viewChart, deck: viewDeck, eqv: viewEqv, time: viewTime, vol: viewVol };
/* ---------- 單位教室 ---------- */
const LESSONS = {
  km: {
    title: '長度', sem: '四上', icon: '🛣️', who: 'otter', name: '水水', say: '公里是很長的距離單位。點每張卡片看看。',
    cards: [
      { e: '🏃', u: '公尺', t: '張開雙手大約 1 公尺。操場一圈大約 200 公尺。' },
      { e: '🛣️', u: '公里', t: '1 公里＝1000 公尺。走路大約 15 分鐘才走得完。' },
    ],
    labs: [{ n: 5, each: 200, from: '公尺', to: '1000 公尺', btn: '🏃 跑一圈 200 公尺', done: '跑 5 圈是 1000 公尺，就是 1 公里！' }],
  },
  deg: {
    title: '角度', sem: '四上', icon: '📐', who: 'goat', name: '角爺爺', say: '角的大小用「度」來說。',
    cards: [{ e: '📐', u: '度', t: '轉一整圈是 360 度。半圈 180 度，一個直角 90 度。' }],
    labs: [
      { view: 'angle', n: 9, each: 10, from: '度', to: '90 度', btn: '或按這裡轉 10 度', done: '90 度就是直角，像書本的角、門全開的樣子。' },
      { view: 'angle', n: 18, each: 10, from: '度', to: '180 度', btn: '或按這裡轉 10 度', done: '180 度是一條直線，叫作平角。' },
    ],
  },
  m2: {
    title: '面積', sem: '四下', icon: '🟩', who: 'sheep', name: '咩咩', say: '小東西用平方公分，大地方用平方公尺。',
    cards: [
      { e: '👆', u: '平方公分', t: '每邊 1 公分的正方形，大約是食指的指腹。' },
      { e: '🟩', u: '平方公尺', t: '每邊 1 公尺的正方形，大約可以站 12 個小朋友。' },
    ],
    labs: [{ view: 'board', n: 10, each: 1000, from: '平方公分', to: '10000 平方公分', btn: '鋪一排（1000 平方公分）', done: '每邊 100 公分，鋪滿要 100×100＝10000 平方公分，就是 1 平方公尺！' }],
  },
  cm3: {
    title: '體積', sem: '四下', icon: '🎲', who: 'octopus', name: '八八', say: '東西占多少空間，用「立方公分」來說。',
    cards: [{ e: '🎲', u: '立方公分', t: '長、寬、高都是 1 公分的小方塊，大約是一顆小骰子。' }],
    labs: [{ tiles: true, w: 3, h: 3, say: '一塊小方塊是 1 立方公分。<br>點一點，把底層鋪滿。', unit: '立方公分', done: '一層有 3×3＝9 塊。疊 2 層就是 18 立方公分！' }],
  },
  time: {
    title: '時間', sem: '四下', icon: '⏰', who: 'raccoon', name: '秤秤', say: '時間的單位，要記得不是滿 100 才換喔。',
    cards: [
      { e: '👏', u: '秒', t: '拍一下手大約 1 秒。' },
      { e: '🍜', u: '分', t: '1 分鐘＝60 秒。泡麵大約 3 分鐘。' },
      { e: '🎬', u: '小時', t: '1 小時＝60 分鐘。一部電影大約 2 小時。' },
      { e: '🗓️', u: '日', t: '1 日＝24 小時。從今天這個時候到明天這個時候。' },
    ],
    labs: [
      { view: 'clock', n: 6, each: 10, from: '分鐘', to: '60 分鐘', btn: '分針走 10 分鐘', done: '60 分鐘就是 1 小時，不是 100 分鐘！' },
      { view: 'day', n: 12, each: 2, from: '小時', to: '24 小時', btn: '過了 2 小時', done: '24 小時就是 1 日。' },
    ],
  },
};
function labPic(X, k) { // 單位要看得到它本來的樣子：角就是角，面積就是一片
  if (X.view === 'angle') return protractor(k * X.each, { knob: k * X.each });
  if (X.view === 'board') return hundred(k * 10);
  if (X.view === 'clock') return `<div class="vs">${clockSvg(0, k * 2 % 12)}</div>`;
  return dayBar(Math.min(k * X.each * 60, 1439), 0);
}
const LESSON_BEFORE = { km: ['km'], deg: ['deg'], deck: ['m2'], vol: ['cm3'], time: ['time'] };
/* ---------- 新概念小故事：生活情境提問 → 動手試（不出現新詞）→ 命名、新詞貼回剛才的圖 → 換情境用新詞答一題，答錯回操作 ---------- */
/* 單位教室（公里、度、平方公尺、立方公分、時間）已經教的單位不在這裡重複，💡 清單裡會接到單位教室 */
const c4T = w => `<b class="term">${w}</b>`;
const c4s = (h, inner) => `<svg class="g4" viewBox="0 0 320 ${h}">${inner}</svg>`;
const c4x = (x, y, t, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || 'middle'}" class="c4t ${o.c || ''}"${o.s ? ` font-size="${o.s}"` : ''}${o.f ? ` style="fill:${o.f}"` : ''}>${t}</text>`;
const c4tag = (x, y, t) => { const w = [...t].reduce((n, ch) => n + (/[\x00-\x7f]/.test(ch) ? 9 : 16), 14); return `<g class="c4tag"><rect x="${x - w / 2}" y="${y - 15}" width="${w}" height="24" rx="8" fill="#ffe680" stroke="#c23a5e" stroke-width="2"/><text x="${x}" y="${y + 3}" text-anchor="middle" class="c4t" font-size="16" style="fill:#c23a5e;font-weight:700">${t}</text></g>`; };
const c4L = (a, b, c = '#33405a', w = 4, ex = '') => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${ex}/>`;
const c4poly = (P, fill = '#bcd6f2', st = '#2f5f9e', w = 3) => `<polygon points="${P.map(p => p.join(',')).join(' ')}" fill="${fill}" stroke="${st}" stroke-width="${w}" stroke-linejoin="round"/>`;
const c4fr = (x, y, a, n, c = '#33405a') => `<text x="${x}" y="${y - 3}" text-anchor="middle" class="c4t" style="fill:${c}">${a}</text><line x1="${x - 10}" x2="${x + 10}" y1="${y + 1}" y2="${y + 1}" stroke="${c}" stroke-width="2"/><text x="${x}" y="${y + 17}" text-anchor="middle" class="c4t" style="fill:${c}">${n}</text>`;
const c4pol = (cx, cy, r, deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy - r * Math.sin(deg * Math.PI / 180)];
function c4wedge(cx, cy, r, a0, a1, fill) { const [x0, y0] = c4pol(cx, cy, r, a0), [x1, y1] = c4pol(cx, cy, r, a1); return a1 - a0 >= 359.9 ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>` : `<path d="M${cx} ${cy}L${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 0 ${x1} ${y1}Z" fill="${fill}"/>`; }
function c4pie(cx, cy, r, n, k, fill = '#f0a03c') { let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff0cf" stroke="#7a5b2e" stroke-width="2"/>`; for (let i = 0; i < n; i++) { const a0 = 90 - (i + 1) * 360 / n, a1 = 90 - i * 360 / n, [x, y] = c4pol(cx, cy, r, a0); if (i < k) s += c4wedge(cx, cy, r, a0, a1, fill); s += c4L([cx, cy], [x, y], '#7a5b2e', 1.5); } return s; }
const c4cells = (x, y, n, k, W, H, c = '#f0a03c') => Array.from({ length: n }, (_, i) => `<rect x="${x + i * W / n}" y="${y}" width="${W / n}" height="${H}" fill="${i < k ? c : '#fff'}" stroke="#7a5b2e" stroke-width="1.5"/>`).join('');
function c4grid(x, y, v, cell = 16, base = 0) { let s = ''; for (let i = 0; i < 100; i++) { const r = Math.floor(i / 10), c = i % 10; s += `<rect x="${x + c * cell}" y="${y + r * cell}" width="${cell}" height="${cell}" fill="${i < v ? (base && i >= base ? '#f0a03c' : '#6ea8dc') : '#fff'}" stroke="#aab3c2" stroke-width=".8"/>`; } return s; }
function c4angle(d, tag) { // 角：黑邊固定、紅邊轉；綠色虛線是直角
  const C = [160, 125], R = 105, e = c4pol(C[0], C[1], R, d);
  return c4s(145, `${c4wedge(C[0], C[1], 42, 0, d, '#ffb3a7')}<path d="M${C[0]} ${C[1]}h34v-34h-34z" fill="#3d9970" fill-opacity=".14" stroke="#3d9970" stroke-width="2" stroke-dasharray="5 4"/>${c4L(C, [C[0] + R, C[1]], '#33405a', 6)}${c4L(C, e, '#d6476b', 6)}<circle cx="${C[0]}" cy="${C[1]}" r="6" fill="#33405a"/>${c4x(C[0] + 74, 142, `${Math.round(d)} 度`, { s: 18 })}${tag ? c4tag(70, 28, tag) : ''}`);
}
function c4clock(d, tag) { // 鐘面的長針從 12 轉出去，轉過的地方塗色
  const C = [160, 96], R = 84; let s = `<circle cx="${C[0]}" cy="${C[1]}" r="${R + 6}" fill="#fff" stroke="#33405a" stroke-width="3"/>`;
  s += d >= 359.9 ? `<circle cx="${C[0]}" cy="${C[1]}" r="50" fill="#ffb3a7"/>` : `<path d="M${C[0]} ${C[1]}L${C[0]} ${C[1] - 50}A50 50 0 ${d > 180 ? 1 : 0} 1 ${C[0] + 50 * Math.sin(d * Math.PI / 180)} ${C[1] - 50 * Math.cos(d * Math.PI / 180)}Z" fill="#ffb3a7"/>`;
  for (let h = 1; h <= 12; h++) { const a = h * 30 * Math.PI / 180; s += c4x(C[0] + 72 * Math.sin(a), C[1] + 5 - 72 * Math.cos(a), h, { s: 13 }); }
  s += c4L(C, [C[0], C[1] - 60], '#b9c2d0', 5, 'stroke-dasharray="6 6"') + c4L(C, [C[0] + 60 * Math.sin(d * Math.PI / 180), C[1] - 60 * Math.cos(d * Math.PI / 180)], '#d6476b', 6) + `<circle cx="${C[0]}" cy="${C[1]}" r="6" fill="#33405a"/>`;
  return c4s(195, s + c4x(280, 30, `${Math.round(d)} 度`, { s: 18 }) + (tag ? c4tag(52, 30, tag) : ''));
}
const c4angAt = (P, i) => { const a = P[i], b = P[(i + 1) % 3], c = P[(i + 2) % 3], u = [b[0] - a[0], b[1] - a[1]], v = [c[0] - a[0], c[1] - a[1]]; return Math.acos((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v))) * 180 / Math.PI; };
function c4triA(P, tag) { // 三角形標出三個角的度數，最大的角標紅
  const r = [Math.round(c4angAt(P, 0)), Math.round(c4angAt(P, 1))]; r.push(180 - r[0] - r[1]); const m = r.indexOf(Math.max(...r)), cx = (P[0][0] + P[1][0] + P[2][0]) / 3, cy = (P[0][1] + P[1][1] + P[2][1]) / 3;
  return c4s(170, c4poly(P) + P.map((p, i) => { const dx = cx - p[0], dy = cy - p[1], l = Math.hypot(dx, dy); return c4x(p[0] + dx / l * 30, p[1] + dy / l * 30 + 5, r[i], { s: i === m ? 20 : 16, f: i === m ? '#d6476b' : '#33405a' }); }).join('') + (tag ? c4tag(100, 22, tag) : ''));
}
function c4triS(a, b, c, tag) { // 依三邊長畫三角形：a 左邊、b 右邊、c 底邊
  const k = 15, cx = (c * c + a * a - b * b) / (2 * c), h = Math.sqrt(Math.max(a * a - cx * cx, 1)), x0 = 160 - c * k / 2, y0 = 150, A = [x0, y0], B = [x0 + c * k, y0], T = [x0 + cx * k, y0 - h * k];
  const col = (v, o1, o2) => v === o1 || v === o2 ? '#d6476b' : '#2f5f9e';
  return c4s(170, c4poly([A, B, T], '#e6f0fa', '#2f5f9e', 2) + c4L(A, T, col(a, b, c), 5) + c4L(B, T, col(b, a, c), 5) + c4L(A, B, col(c, a, b), 5) + c4x((A[0] + T[0]) / 2 - 16, (A[1] + T[1]) / 2 + 2, a, { s: 18 }) + c4x((B[0] + T[0]) / 2 + 16, (B[1] + T[1]) / 2 + 2, b, { s: 18 }) + c4x((A[0] + B[0]) / 2, y0 + 18, c, { s: 18 }) + (tag ? c4tag(64, 26, tag) : ''));
}
function c4bars(labels, vals, stage, tag, top) { // stage 0 只有數字、1 一格一格疊、2 有刻度
  const X = 46, Y = 150, cw = 250 / labels.length, u = 130 / top; let s = '';
  if (stage === 0) return c4s(170, labels.map((l, i) => c4x(160, 34 + i * 34, `${l}：${vals[i]} 票`, { s: 19 })).join(''));
  if (stage === 2) for (let v = 0; v <= top; v += 2) s += `<line x1="${X}" x2="${X + 250}" y1="${Y - v * u}" y2="${Y - v * u}" stroke="#d8dde5"/>` + c4x(X - 8, Y - v * u + 5, v, { a: 'end', s: 13 });
  labels.forEach((l, i) => { const x = X + i * cw + cw * .2, w = cw * .6; if (stage === 1) for (let k = 0; k < vals[i]; k++) s += `<rect x="${x}" y="${Y - (k + 1) * u}" width="${w}" height="${u - 2}" fill="#6ea8dc"/>`; else s += `<rect x="${x}" y="${Y - vals[i] * u}" width="${w}" height="${vals[i] * u}" rx="3" fill="#6ea8dc"/>`; s += c4x(x + w / 2, Y + 18, l, { s: 14 }); });
  s += c4L([X, Y], [X + 250, Y], '#33405a', 2); if (stage === 2) s += c4L([X, Y], [X, Y - top * u], '#33405a', 2);
  return c4s(172, s + (tag ? c4tag(250, 18, tag) : ''));
}
function c4lineChart(labels, vals, n, tag, top, step) { // n 段線
  const X = 46, Y = 150, cw = 250 / labels.length, u = 130 / top, P = vals.map((v, i) => [X + i * cw + cw / 2, Y - v * u]); let s = '';
  for (let v = 0; v <= top; v += step) s += `<line x1="${X}" x2="${X + 250}" y1="${Y - v * u}" y2="${Y - v * u}" stroke="#d8dde5"/>` + c4x(X - 8, Y - v * u + 5, v, { a: 'end', s: 13 });
  labels.forEach((l, i) => { s += c4x(P[i][0], Y + 18, l, { s: 14 }); });
  if (n) s += `<polyline points="${P.slice(0, n + 1).map(p => p.join(',')).join(' ')}" fill="none" stroke="#d6476b" stroke-width="4"/>`;
  s += P.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#d6476b"/>`).join('') + c4L([X, Y], [X + 250, Y], '#33405a', 2) + c4L([X, Y], [X, Y - top * u], '#33405a', 2);
  return c4s(172, s + (tag ? c4tag(100, 18, tag) : ''));
}
function c4gap(st, tag) { // 三個人的身高：從 0 畫、切掉下面、切掉再做記號
  const v = [131, 135, 138], n = ['小安', '小宇', '小晴'], Y = 148, X = 54, base = st ? 120 : 0, u = st ? 6 : .85; let s = '';
  (st ? [120, 130, 140] : [0, 50, 100, 150]).forEach(g => { s += `<line x1="${X}" x2="300" y1="${Y - (g - base) * u}" y2="${Y - (g - base) * u}" stroke="#d8dde5"/>` + c4x(X - (st === 2 ? 22 : 8), Y - (g - base) * u + 5, g, { a: 'end', s: 13 }); });
  v.forEach((x, i) => { s += `<rect x="${X + 16 + i * 80}" y="${Y - (x - base) * u}" width="50" height="${(x - base) * u}" rx="3" fill="#6ea8dc"/>` + c4x(X + 41 + i * 80, Y + 18, n[i], { s: 14 }) + c4x(X + 41 + i * 80, Y - (x - base) * u - 5, x, { s: 13 }); });
  s += c4L([X, Y], [300, Y], '#33405a', 2) + c4L([X, st === 2 ? Y - 24 : Y], [X, 8], '#33405a', 2);
  if (st === 2) s += `<path d="M${X} ${Y}l-7 -5 14 -6 -14 -6 14 -6 -7 -5" fill="none" stroke="#d6476b" stroke-width="3"/>`;
  return c4s(172, s + (tag ? c4tag(120, 20, tag) : ''));
}
const c4SP = [[0, -44], [58, 26], [-40, 26]];
function c4congr(t, tag) { // 右邊那片轉一轉、移過去，疊在左邊那片上
  const at = (cx, cy, r) => c4SP.map(p => { const a = r * Math.PI / 180; return [cx + p[0] * Math.cos(a) - p[1] * Math.sin(a), cy + p[0] * Math.sin(a) + p[1] * Math.cos(a)]; }), A = at(92, 90, 0), B = at(232 - 140 * t, 80 + 10 * t, 180 * (1 - t));
  return c4s(150, c4poly(A, '#fff0cf', '#7a5b2e') + c4poly(B, '#6ea8dc99', '#2f5f9e') + (tag ? c4L(A[1], A[2], '#d6476b', 6) + c4tag(70, 138, '對應邊') + c4tag(232, 28, tag) : ''));
}
const c4PIE7 = (st, tag) => { // 7 個 1/4 片：散的、4 片拼成一個、寫成一個又幾分之幾
  const w = (x, y) => `<g transform="translate(${x} ${y})">${c4wedge(0, 18, 30, 45, 135, '#f0a03c')}<path d="M0 18L21 -3A30 30 0 0 0 -21 -3Z" fill="none" stroke="#7a5b2e" stroke-width="1.5"/></g>`; let s = '';
  if (st === 0) { for (let i = 0; i < 7; i++) s += w(30 + (i % 4) * 56 + (i > 3 ? 28 : 0), 18 + (i > 3 ? 60 : 0)); }
  else { s += c4pie(82, 70, 54, 4, 4); if (st === 1) for (let i = 0; i < 3; i++) s += w(180 + i * 48, 50); else s += c4pie(228, 70, 54, 4, 3); }
  return c4s(140, s + (st === 2 ? `${c4x(82, 136, '1 個', { s: 16 })}${c4x(228, 136, '和 3/4 個', { s: 16 })}` : '') + (tag ? c4tag(155, 22, tag) : ''));
};
function c4road(st, tag) { // 兩條路：斜斜相交、直角相交、永遠不碰
  const a = [[20, 125], [300, 125]], D = [[60, 28], [255, 152]], U = [[160, 12], [160, 158]], P = [[20, 45], [300, 45]], b = [D, U, P][st];
  return c4s(170, c4L(a[0], a[1], '#6ea8dc', 14) + c4L(b[0], b[1], '#f0a03c', 14) + (st === 1 ? `<path d="M160 125h18v-18h-18z" fill="none" stroke="#d6476b" stroke-width="3"/>` : '') + (tag ? c4tag(st === 1 ? 240 : 160, st === 1 ? 62 : 86, tag) : ''));
}
const c4QS = [[[60, 30], [290, 30], [240, 130], [10, 130]], [[90, 30], [220, 30], [290, 130], [20, 130]], [[50, 25], [230, 50], [290, 130], [20, 110]]];
function c4quadPair(i, tag) { // 同一組對邊同色
  const P = c4QS[i], c = i === 0 ? ['#d6476b', '#3d9970', '#d6476b', '#3d9970'] : i === 1 ? ['#d6476b', '#2f5f9e', '#d6476b', '#2f5f9e'] : ['#2f5f9e', '#2f5f9e', '#2f5f9e', '#2f5f9e'];
  return c4s(160, c4poly(P, '#e6f0fa', '#2f5f9e', 1) + P.map((p, k) => c4L(p, P[(k + 1) % 4], c[k], 6)).join('') + (tag ? c4tag(160, 150, tag) : ''));
}
function c4rhomb(lean, tag) { // 四根一樣長的吸管，推歪
  const L = 92, x0 = 94 - lean * .4, y0 = 150, r = lean * Math.PI / 180, dx = L * Math.sin(r), dy = L * Math.cos(r), P = [[x0, y0], [x0 + L, y0], [x0 + L + dx, y0 - dy], [x0 + dx, y0 - dy]];
  return c4s(165, c4poly(P, '#bcd6f2', '#2f5f9e', 6) + P.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="#f0a03c"/>`).join('') + (tag ? c4tag(64, 26, tag) : ''));
}
function c4diag(st, tag) { // 連連看：旁邊的角、對面的角
  const P = [[60, 25], [290, 25], [250, 135], [20, 135]], names = 'ABCD', L = [[0, 1], [0, 2], [1, 3]][st];
  return c4s(160, c4poly(P, '#fff0cf', '#7a5b2e', 3) + (st ? c4poly(st === 1 ? [P[0], P[1], P[2]] : [P[1], P[2], P[3]], '#f4a9a080', 'none', 0) : '') + c4L(P[L[0]], P[L[1]], '#d6476b', 6) + P.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="#33405a"/>` + c4x(p[0] + (i === 1 || i === 2 ? 14 : -14), p[1] + 5, names[i], { s: 15 })).join('') + (tag ? c4tag(155, 152, tag) : ''));
}
function c4round(v, tag) { // 數線看靠近誰
  const x = 40 + (v - 3400) * 2.4, near = v >= 3450 ? 3500 : 3400;
  return c4s(120, `${c4L([40, 72], [280, 72], '#33405a', 4)}${c4L([40, 60], [40, 84], '#33405a', 3)}${c4L([280, 60], [280, 84], '#33405a', 3)}${c4L([160, 64], [160, 80], '#aab3c2', 3)}${c4x(40, 104, 3400, { s: 16 })}${c4x(160, 104, 3450, { s: 13 })}${c4x(280, 104, 3500, { s: 16 })}<path d="M${x} 66l-9 -16h18z" fill="#d6476b"/>${c4x(x, 42, Math.round(v), { s: 17, f: '#d6476b' })}${c4L([x, 72], [near === 3500 ? 280 : 40, 72], '#f0a03c', 7)}${tag ? c4tag(70, 18, '概數') + c4tag(235, 18, tag) : ''}`);
}
function c4boxes(st, tag) { // 87 顆橘子，每箱 10 顆
  let s = ''; for (let i = 0; i < 9; i++) { const x = 16 + (i % 5) * 60, y = 8 + Math.floor(i / 5) * 58, last = i === 8, show = !last || st !== 2; s += `<rect x="${x}" y="${y}" width="50" height="46" rx="5" fill="${last ? (st === 1 ? '#ffe9b0' : '#f4f6fa') : '#ffd9a0'}" stroke="${last && st === 2 ? '#d6476b' : '#7a5b2e'}" stroke-width="2"${last && st === 0 ? ' stroke-dasharray="5 4"' : ''}/>` + (show ? c4x(x + 25, y + 30, last ? 7 : 10, { s: 20 }) : c4x(x + 25, y + 32, '✕', { s: 24, f: '#d6476b' })); }
  return c4s(142, s + (tag ? c4tag(160, 130, tag) : ''));
}
function c4est(st, tag) { // 48 元買 3 個，估一下
  const lab = ['48', '48', '48']; let s = '';
  lab.forEach((_, i) => { const x = 22 + i * 70; s += `<rect x="${x}" y="10" width="62" height="50" rx="8" fill="#ffe9b0" stroke="#a9702a" stroke-width="2"/>${c4x(x + 31, st ? 32 : 42, st ? '差不多' : 48, { s: st ? 13 : 22 })}${st ? c4x(x + 31, 52, 50, { s: 20, f: '#d6476b' }) : ''}`; });
  s += c4x(268, 42, '3 個', { s: 18 });
  if (st >= 1) s += c4x(160, 90, '50×3＝150', { s: 22 });
  if (st >= 2) s += `<rect x="30" y="104" width="195" height="18" fill="#6ea8dc"/><rect x="30" y="104" width="260" height="18" fill="none" stroke="#33405a" stroke-width="2"/>${c4x(290, 140, '200 元', { a: 'end', s: 14 })}${c4x(30, 140, '大約 150 元', { a: 'start', s: 14 })}`;
  return c4s(148, s + (tag ? c4tag(70, 96, tag) : ''));
}
function c4strip(k, tag) { // 1/2 條切細
  const n = 2 * k;
  return c4s(120, `${c4cells(30, 8, 2, 1, 260, 34)}${c4cells(30, 62, n, k, 260, 34, '#d6476b')}${c4x(160, 30, '原來的一半', { s: 14 })}${c4x(30 + 65, 86, `${k}/${n}`, { s: 18, f: '#fff' })}${tag ? c4tag(160, 112, tag) : ''}`);
}
function c4day(m, tag) { // 一天 24 小時的長條
  const x = 16 + m / 1440 * 288, h = Math.floor(m / 60), P = ['上午', '中午', '下午'][m < 720 ? 0 : m === 720 ? 1 : 2]; let s = `<rect x="16" y="66" width="288" height="26" fill="#27305a"/><rect x="88" y="66" width="144" height="26" fill="#ffd97a"/><rect x="16" y="66" width="288" height="26" fill="none" stroke="#33405a" stroke-width="2"/>`;
  [0, 6, 12, 18, 24].forEach(v => { s += c4x(16 + v * 12, 112, v, { s: 14 }); });
  s += `<path d="M${x} 64l-8 -12h16z" fill="#d6476b"/>${c4x(160, 34, `${h}:00`, { s: 30, f: '#d6476b' })}${c4x(74, 30, P, { s: 16 })}${c4x(74, 48, `${h > 12 ? h - 12 : h} 時`, { s: 16 })}`;
  return c4s(122, s + (tag ? c4tag(258, 28, tag) : ''));
}
function c4ell(st, tag) { // L 形甲板，每格 1 平方公尺
  const c = 24, X = 60, Y = 8, cells = []; for (let y = 0; y < 5; y++) for (let x = 0; x < (y < 3 ? 3 : 6); x++) cells.push([x, y]);
  let s = cells.map(([x, y]) => `<rect x="${X + x * c}" y="${Y + y * c}" width="${c}" height="${c}" fill="${st >= 2 ? (y < 3 ? '#f4c17a' : '#a9d0f0') : '#e6edf5'}" stroke="#7a8aa0"/>`).join('');
  if (st >= 1) s += c4L([X - 8, Y + 3 * c], [X + 3 * c + 6, Y + 3 * c], '#d6476b', 4, 'stroke-dasharray="6 5"');
  if (st >= 2) s += `${c4x(X + 36, Y + 42, '3×3＝9', { s: 14 })}${c4x(X + 72, Y + 98, '6×2＝12', { s: 15 })}${c4x(262, 72, '9＋12', { s: 17 })}${c4x(262, 94, '＝21', { s: 17 })}`;
  return c4s(136, s + (tag ? c4tag(248, 22, tag) : ''));
}
const c4Calc = (lines, tag) => c4s(150, lines.map((l, i) => `${c4x(160, 42 + i * 42, l[0], { s: l[2] || 23, f: l[1] || '#33405a' })}`).join('') + (tag ? c4tag(160, 136, tag) : ''));

const CONCEPTS = [
  { key: 'yi', title: '億和千萬位', terms: ['億', '千萬位'], game: 'big', sem: '四上', when: ['big:build', 'big:read', 'big:money', 'big:cmp'],
    ask: '一座體育場坐 1 萬人。如果有好多好多座，一共是幾人？定位板放得下嗎？', tryIt: '往右拖，體育場一次多很多。', states: [10, 1000, 10000],
    pic: (n, tg) => { const s = String(n * 10000), H = ['', '', '百萬', '十萬', '萬', '千', '百', '十', '個'], W = 32, X = 12; let o = c4x(160, 22, `${fmt(n)} 座體育場`, { s: 18 }); H.forEach((h, i) => { const x = X + i * W + (i > 0 ? 4 : 0) + (i > 4 ? 4 : 0), d = s.length >= 9 - i ? s[i - (9 - s.length)] : '', over = i === 0; o += `<rect x="${x}" y="62" width="${W - 3}" height="44" rx="4" fill="${over ? (d ? '#ffd5cf' : '#f4f6fa') : '#fff'}" stroke="${over ? '#d6476b' : '#33405a'}" stroke-width="2"${over && !d ? ' stroke-dasharray="5 4"' : ''}/>${c4x(x + 14, 92, d, { s: 22 })}${h ? c4x(x + 14, 54, h, { s: 12 }) : ''}`; }); return c4s(140, o + (tg ? `${c4tag(30, 128, '億')}${c4tag(92, 128, '千萬位')}${c4L([92, 114], [60, 108], '#c23a5e', 2)}` : '')); },
    note: n => n === 10 ? '10 座：10 萬人' : n === 1000 ? '1000 座：1000 萬人，右邊 8 格都用上了' : '10000 座：10000 個萬，8 格放不下了！',
    found: '1000 萬已經把 8 格放滿。10000 個萬要第 9 格，需要一個新名字。', name: `一萬個一萬，叫 1 ${c4T('億')}。8 格裡最左邊那一格，叫${c4T('千萬位')}。`, loop: [1, 2],
    check: { q: '臺灣大約 2300 萬人，寫成 23000000。最左邊的 2 在哪一位？', pic: () => '<div class="u-big num">23000000</div>', opts: ['百萬位', '千萬位', '億位'], a: 1, why: '從右邊數過來，第 8 位是哪一位？', ok: '對了！第 8 位是千萬位。' } },
  { key: 'trydiv', title: '試商', terms: ['試商'], game: 'divv', sem: '四上', when: ['divv:try'],
    ask: '92 顆橘子，每箱裝 23 顆。到底能裝幾箱？一下子看不出來，怎麼辦？', tryIt: '往右拖，猜猜看裝幾箱。', states: [5, 3, 4],
    pic: (k, tg) => { const u = 270 / 115, X = 22; let o = `<rect x="${X}" y="52" width="${92 * u}" height="44" fill="#fff" stroke="#33405a" stroke-width="3"/>${c4L([X + 92 * u, 44], [X + 92 * u, 104], '#33405a', 3)}${c4x(X + 92 * u, 36, '92 顆', { s: 15 })}`; for (let i = 0; i < k; i++) o += `<rect x="${X + i * 23 * u + 1}" y="56" width="${23 * u - 2}" height="36" rx="3" fill="${(i + 1) * 23 > 92 ? '#f4a9a0' : '#ffd9a0'}" stroke="#a9702a"/>${c4x(X + (i + .5) * 23 * u, 80, 23, { s: 14 })}`; return c4s(130, o + (tg ? c4tag(80, 22, '試商') : '')); },
    note: k => k === 5 ? '23×5＝115，比 92 多：猜太多了' : k === 3 ? '23×3＝69，還剩 23 顆：還裝得下' : '23×4＝92，剛好裝完！',
    found: '猜太多就改小，還裝得下就改大，幾次就找到了：4 箱。', name: `先猜一個商，乘乘看，再改大或改小，這樣找商叫${c4T('試商')}。`, loop: [0, 1, 2],
    check: { q: '78 顆蘋果，每袋裝 26 顆。試商先試 2 袋，還剩 26 顆。商要怎麼改？', pic: () => c4Calc([['26×2＝52'], ['78－52＝26']]), opts: ['改大一點', '改小一點', '不用改'], a: 0, why: '剩下的還裝得下一袋嗎？', ok: '對了！還裝得下，商改成 3。' } },
  { key: 'acute', title: '銳角和鈍角', terms: ['銳角', '鈍角'], game: 'deg', sem: '四上', when: ['deg:kind'],
    ask: '一本書可以打開小小的，也可以打開大大的。和綠色的直角比一比，有幾種情形？', tryIt: '往右拖，把書打開。', states: [40, 90, 130], tween: 1,
    pic: (d, tg) => c4angle(d, tg ? (d < 90 ? '銳角' : d > 90 ? '鈍角' : '') : ''),
    note: d => d < 90 ? '紅邊在綠框裡面：比直角小' : d === 90 ? '紅邊貼著綠框：剛好是直角' : d > 90 ? '紅邊跑到綠框外面：比直角大' : '',
    found: '比直角小、剛好直角、比直角大，一共三種情形。', name: `比直角小的角叫${c4T('銳角')}；比直角大、又還沒變成一直線的角叫${c4T('鈍角')}。`, loop: [0, 2],
    check: { q: '雨傘打開時，傘骨張開 120 度。這是什麼角？', pic: () => c4angle(120), opts: ['銳角', '直角', '鈍角'], a: 2, why: '120 度比 90 度大還是小？', ok: '對了！比直角大，是鈍角。' } },
  { key: 'turn', title: '旋轉角、平角、周角', terms: ['旋轉角', '平角', '周角'], game: 'deg', sem: '四上', when: ['deg:kind', 'deg:clock'],
    ask: '時鐘的長針從 12 開始走。走半圈、走一整圈，轉出來的角有多大？', tryIt: '往右拖，讓長針轉起來。', states: [90, 180, 360], tween: 1,
    pic: (d, tg) => c4clock(d, tg ? (d >= 359 ? '周角' : d === 180 ? '平角' : '旋轉角') : ''),
    note: d => d === 90 ? '走到 3：轉了 90 度' : d === 180 ? '走到 6：轉了 180 度，兩條線變成一直線' : d >= 360 ? '走回 12：轉了 360 度，一整圈' : '',
    found: '角不一定是畫好的，轉一轉也會轉出角來。半圈 180 度，一圈 360 度。', name: `像這樣轉出來的角叫${c4T('旋轉角')}。轉半圈的 180 度叫${c4T('平角')}，轉一圈的 360 度叫${c4T('周角')}。`, loop: [0, 1, 2],
    check: { q: '電風扇的頭，從最左邊轉到最右邊，轉了 180 度。這個角叫什麼？', pic: () => c4clock(180), opts: ['銳角', '平角', '周角'], a: 1, why: '180 度是半圈，還是一整圈？', ok: '對了！180 度是平角。' } },
  { key: 'triang', title: '看角分三角形', terms: ['銳角三角形', '直角三角形', '鈍角三角形'], game: 'tri', sem: '四上', when: ['tri:angle'],
    ask: '機翼上的三角形，有的尖尖、有的扁扁。看最大的那個角，可以怎麼分組？', tryIt: '往右拖，換一片機翼看。', states: [0, 1, 2],
    pic: (i, tg) => c4triA([[[50, 150], [270, 150], [170, 30]], [[70, 150], [270, 150], [70, 40]], [[20, 150], [190, 150], [290, 62]]][i], tg ? ['銳角三角形', '直角三角形', '鈍角三角形'][i] : ''),
    note: i => ['最大的角也比直角小', '最大的角剛好是直角', '最大的角比直角大'][i],
    found: '只要看最大的角，就能分成三組。', name: `最大的角比直角小，叫${c4T('銳角三角形')}；有直角叫${c4T('直角三角形')}；有比直角大的角，叫${c4T('鈍角三角形')}。`, loop: [0, 1, 2],
    check: { q: '三角旗的三個角是 30、40、110 度。它是什麼三角形？', pic: () => c4triA([[20, 150], [290, 150], [180, 58]]), opts: ['銳角三角形', '直角三角形', '鈍角三角形'], a: 2, why: '最大的角 110 度，和直角比呢？', ok: '對了！110 度比直角大，是鈍角三角形。' } },
  { key: 'tside', title: '看邊分三角形', terms: ['等腰三角形', '正三角形'], game: 'tri', sem: '四上', when: ['tri:side'],
    ask: '用吸管做屋頂，要左右一樣斜才不會歪。吸管要怎麼挑？', tryIt: '往右拖，換一組吸管（單位：公分）。', states: [[7, 5, 8], [7, 7, 6], [7, 7, 7]],
    pic: (s, tg) => c4triS(s[0], s[1], s[2], tg ? (s[0] === s[1] && s[1] === s[2] ? '正三角形' : s[0] === s[1] ? '等腰三角形' : '') : ''),
    note: s => s[1] === 5 ? '三根都不一樣長：屋頂歪一邊' : s[2] === 6 ? '兩根一樣長：左右一樣斜' : '三根都一樣長：怎麼轉都一樣',
    found: '看有幾根一樣長，就能分出不同的三角形。', name: `兩邊一樣長的叫${c4T('等腰三角形')}；三邊都一樣長的叫${c4T('正三角形')}。`, loop: [1, 2],
    check: { q: '衣架兩條斜邊都是 20 公分，下面那條 34 公分。它是什麼三角形？', pic: () => c4s(120, c4poly([[40, 100], [280, 100], [160, 30]], '#e6f0fa', '#2f5f9e') + c4x(84, 58, 20, { s: 18 }) + c4x(236, 58, 20, { s: 18 }) + c4x(160, 118, 34, { s: 18 })), opts: ['等腰三角形', '正三角形', '一般三角形'], a: 0, why: '有幾條邊一樣長？', ok: '對了！兩邊一樣長，是等腰三角形。' } },
  { key: 'congr', title: '全等', terms: ['全等', '對應邊'], game: 'tri', sem: '四上', when: ['tri:flip', 'tri:corr'],
    ask: '飛船左右兩片機翼要一模一樣。方向不同，要怎麼知道它們真的一樣？', tryIt: '往右拖，把藍色那片移過去。', states: [0, .5, 1], tween: 1,
    pic: (t, tg) => c4congr(t, tg && t === 1 ? '全等' : ''),
    note: t => t === 0 ? '方向不一樣，看不出來' : t < 1 ? '邊轉邊移' : '完全疊在一起，一點都沒有多出來！',
    found: '轉一轉再疊上去，每個邊、每個角都對得剛剛好。', name: `能完全疊在一起的兩個圖形叫${c4T('全等')}。疊在一起的邊叫${c4T('對應邊')}，一樣長。`, loop: [0, 2],
    check: { q: '兩張全等的郵票。一張的長邊是 5 公分，它在另一張的對應邊是幾公分？', pic: () => c4congr(1), opts: ['3', '5', '10'], a: 1, why: '全等的圖形疊起來，那條邊會一樣長嗎？', ok: '對了！對應邊一樣長，是 5 公分。' } },
  { key: 'impro', title: '真分數和假分數', terms: ['真分數', '假分數'], game: 'fra', sem: '四上', when: ['fra:kind', 'fra:pack', 'fra:line'],
    ask: '一個派切成 4 片。如果拿了好幾片，會不會超過 1 個派？', tryIt: '往右拖，一直多拿幾片。', states: [3, 4, 7],
    pic: (k, tg) => c4s(150, c4pie(86, 68, 58, 4, Math.min(k, 4)) + c4pie(232, 68, 58, 4, Math.max(k - 4, 0)) + c4fr(160, 128, k, 4, '#d6476b') + (tg ? c4tag(258, 138, k < 4 ? '真分數' : '假分數') : '')),
    note: k => k === 3 ? `${fracHtml(3, 4)} 個：比 1 個少` : k === 4 ? `${fracHtml(4, 4)} 個：剛好 1 個` : `${fracHtml(7, 4)} 個：比 1 個多`,
    found: '上面的數比下面小，就還不到 1 個；一樣大或更大，就有 1 個以上。', name: `分子比分母小的叫${c4T('真分數')}；分子和分母一樣或更大的，叫${c4T('假分數')}。`, loop: [0, 1, 2],
    check: { q: `一壺果汁有 ${fracHtml(6, 5)} 公升，這個分數是什麼分數？`, pic: () => c4s(70, c4cells(20, 8, 5, 5, 135, 40) + c4cells(165, 8, 5, 1, 135, 40)), opts: ['真分數', '假分數'], a: 1, why: '分子 6 和分母 5，哪一個大？', ok: '對了！分子比分母大，是假分數。' } },
  { key: 'mixedf', title: '帶分數', terms: ['帶分數'], game: 'fra', sem: '四上', when: ['fra:kind', 'fra:pack', 'fra:unpack'],
    ask: '有 7 片派，每片是 1/4 個。要怎麼說，別人才馬上知道有多少？', tryIt: '往右拖，把 4 片拼成一個。', states: [0, 1, 2],
    pic: (s, tg) => c4PIE7(s, tg && s === 2 ? '帶分數' : ''),
    note: s => ['7 片散散的，看不出有多少', '4 片拼成 1 個，還剩 3 片', '1 個，和 3/4 個'][s],
    found: `${fracHtml(7, 4)} 個也可以說成「1 個和 3/4 個」，一聽就知道比 1 個多一些。`, name: `整數帶著一個真分數，像 ${mixHtml(1, 3, 4)}，叫${c4T('帶分數')}，念作一又四分之三。`, loop: [1, 2],
    check: { q: `${fracHtml(9, 4)} 盒蛋糕，每 4 塊是 1 盒。換成帶分數是幾盒？`, pic: () => c4s(60, c4cells(15, 8, 4, 4, 90, 36) + c4cells(115, 8, 4, 4, 90, 36) + c4cells(215, 8, 4, 1, 90, 36)), opts: ['2 又 1/4', '1 又 5/4', '4 又 1/4'], a: 0, why: '4 塊一盒，9 塊能裝滿幾盒？還剩幾塊？', ok: '對了！裝滿 2 盒，還剩 1 塊。' } },
  { key: 'ftimes', title: '分數的整數倍', terms: ['整數倍'], game: 'fra', sem: '四下', when: ['fra:times'],
    ask: '每杯燃料 2/5 公升。裝 3 杯一共是幾公升？', tryIt: '往右拖，一杯一杯加上去。', states: [1, 2, 3],
    pic: (k, tg) => c4s(120, Array.from({ length: 3 }, (_, i) => c4cells(30, 8 + i * 34, 5, i < k ? 2 : 0, 200, 28)).join('') + c4x(278, 60, `${2 * k}/5`, { s: 22, f: '#d6476b' }) + (tg ? c4tag(278, 24, '整數倍') : '')),
    note: k => `每杯 2/5 公升 × ${k} 杯，一共 ${2 * k} 個 1/5 公升`,
    found: '一樣多的東西重複 3 次，只要數有幾個 1/5：2×3＝6，是 6/5 公升。', name: `同樣的 2/5 重複 3 次，就是 2/5 的 3 倍，叫分數的${c4T('整數倍')}。寫成 每份量×份數：2/5×3。`, loop: [0, 1, 2],
    check: { q: '每瓶果汁 3/8 公升，買 4 瓶。求整數倍 3/8×4，是幾公升？', pic: () => c4s(70, Array.from({ length: 4 }, (_, i) => c4cells(8 + i * 77, 8, 8, 3, 72, 36)).join('')), opts: ['7/8', '12/8', '3/32'], a: 1, why: '3 個 1/8，重複 4 次，一共幾個 1/8？', ok: '對了！3×4＝12，是 12/8 公升。' } },
  { key: 'odd', title: '奇數和偶數', terms: ['奇數', '偶數'], game: 'pat', sem: '四上', when: ['pat:odd'],
    ask: '大家兩個兩個牽手跳舞。每個人都能找到伴嗎？', tryIt: '往右拖，換不同的人數。', states: [6, 7, 10],
    pic: (n, tg) => { let o = ''; for (let i = 0; i < n; i++) { const x = 34 + Math.floor(i / 2) * 50, y = i % 2 ? 76 : 28, alone = n % 2 && i === n - 1; o += `<circle cx="${x}" cy="${y}" r="15" fill="${alone ? '#f4a9a0' : '#6ea8dc'}" stroke="${alone ? '#d6476b' : '#2f5f9e'}" stroke-width="2"/>`; if (i % 2) o += c4L([x, 43], [x, 61], '#2f5f9e', 4); } return c4s(120, o + c4x(290, 110, `${n} 人`, { a: 'end', s: 17 }) + (tg ? c4tag(70, 110, n % 2 ? '奇數' : '偶數') : '')); },
    note: n => n % 2 ? `${n} 人：剩下 1 個人沒有伴` : `${n} 人：每個人都有伴`,
    found: '有些人數剛好配完，有些人數一定剩 1 個。', name: `兩個兩個配，剛好配完的數叫${c4T('偶數')}；一定剩 1 個的數叫${c4T('奇數')}。`, loop: [0, 1],
    check: { q: '13 位球員兩人一組傳球。13 是什麼數？', pic: () => `<div class="u-big">⚽</div>`, opts: ['奇數', '偶數'], a: 0, why: '13 個兩個兩個配，會剩下嗎？', ok: '對了！會剩 1 個，13 是奇數。' } },
  { key: 'expr', title: '併式', terms: ['併式'], game: 'mix', sem: '四上', when: ['mix:expr', 'mix:write'],
    ask: '帶 100 元，買 3 個麵包，每個 20 元。要找回幾元？能不能只寫一行？', tryIt: '往右拖，一步一步算，最後合起來。', states: [0, 1, 2],
    pic: (s, tg) => c4Calc(s === 0 ? [['每個 20 元 × 3 個', '', 16], ['20×3＝60']] : s === 1 ? [['20×3＝60', '#aab3c2'], ['100－60＝40']] : [['100－60＝40', '#aab3c2', 17], ['100－20×3＝40', '#d6476b', 26]], tg && s === 2 ? '併式' : ''),
    note: s => ['先算麵包要多少錢', '再算要找回多少錢', '把 60 換成 20×3，兩行變一行！'][s],
    found: '60 就是 20×3，放進第二行，一行就說完了。', name: `把幾個步驟合成一條算式，叫${c4T('併式')}。`, loop: [1, 2],
    check: { q: '一盒 8 顆，買 5 盒，又吃掉 6 顆。哪一個併式對？', pic: () => '<div class="u-big">🍬</div>', opts: ['8×5－6', '8＋5－6', '8－6×5'], a: 0, why: '先想一共幾顆：每盒量×盒數，再減掉吃的。', ok: '對了！8×5－6＝34 顆。' } },
  { key: 'order', title: '先乘除，後加減', terms: ['先乘除，後加減', '括號先算'], game: 'mix', sem: '四上', when: ['mix:expr', 'mix:write'], test: q => q.tokens.includes('(') || (q.tokens.some(t => t === '×' || t === '÷') && q.tokens.some(t => t === '＋' || t === '－')),
    ask: '100－20×3，小華和小美算出來不一樣。算的是剛才的麵包，誰才對？', tryIt: '往右拖，看看每個人怎麼算。', states: [0, 1, 2],
    pic: (s, tg) => c4Calc(s === 0 ? [['小華：100－20×3', '', 19], ['80×3＝240', '#d6476b']] : s === 1 ? [['小美：100－20×3', '', 19], ['100－60＝40', '#3d9970']] : [['3 人都有 100 元，每人花 20 元', '', 15], ['(100－20)×3＝240', '#3d9970']], tg ? (s === 2 ? '括號先算' : s === 1 ? '先乘除，後加減' : '') : ''),
    note: s => ['先減再乘：找回 240 元？比 100 元還多，不合理！', '先算 3 個麵包的錢：找回 40 元，合理', '每人剩的錢要先算，就把它圈起來'][s],
    found: '麵包的錢要先算才合理；想先算別的地方，就要圈起來。', name: `規定：${c4T('先乘除，後加減')}；有括號的，${c4T('括號先算')}。`, loop: [1, 2],
    check: { q: '依照先乘除，後加減：50＋10×2 是多少？', pic: () => c4Calc([['50＋10×2']]), opts: ['120', '70', '62'], a: 1, why: '10×2 要先算。', ok: '對了！50＋20＝70。' } },
  { key: 'dec2', title: '二位小數', terms: ['二位小數', '百分位'], game: 'dec', sem: '四上', when: ['dec:paint', 'dec:meter', 'dec:cmp', 'dec:calc'],
    ask: '小魚跳了 35 公分，要寫成幾公尺？1 公尺切成 10 段太粗了，量不出來。', tryIt: '1 公尺切成 100 小格。往右拖，塗塗看。', states: [1, 10, 35],
    pic: (v, tg) => c4s(172, c4grid(14, 6, v) + c4x(250, 60, `${v} 格`, { s: 20 }) + c4x(250, 100, `0.${String(v).padStart(2, '0')}`, { s: 30, f: '#d6476b' }) + c4x(250, 124, '公尺', { s: 15 }) + (tg ? c4tag(250, 22, '二位小數') + c4tag(254, 150, '百分位') + c4L([278, 106], [266, 136], '#c23a5e', 2) : '')),
    note: v => v === 1 ? '1 格是 1 公分，寫成 0.01 公尺' : v === 10 ? '10 格是 10 公分，0.10 和 0.1 一樣多' : '35 格，就是 0.35 公尺',
    found: '切成 100 格，一格是 0.01，小數點後面要有兩個數字。', name: `像 0.35 小數點後面有兩位，叫${c4T('二位小數')}。後面第二位記幾個 0.01，叫${c4T('百分位')}。`, loop: [0, 2],
    check: { q: '一瓶水 2.46 公升，數字 6 在哪一位？', pic: () => '<div class="u-big num">2.46</div>', opts: ['個位', '十分位', '百分位'], a: 2, why: '小數點後面第幾個？', ok: '對了！第二位是百分位。' } },
  { key: 'dtimes', title: '小數的整數倍', terms: ['整數倍'], game: 'dec', sem: '四下', when: ['dec:times'],
    ask: '每瓶水 0.25 公升。裝 3 瓶，一共幾公升？', tryIt: '往右拖，一瓶一瓶加上去。', states: [1, 2, 3],
    pic: (k, tg) => c4s(172, c4grid(14, 6, 25 * k, 16, 25 * (k - 1)) + c4x(250, 70, `${k} 瓶`, { s: 20 }) + c4x(250, 110, (.25 * k).toFixed(2), { s: 30, f: '#d6476b' }) + (tg ? c4tag(254, 150, '整數倍') : '')),
    note: k => `每瓶 0.25 公升 × ${k} 瓶：${25 * k} 個 0.01，是 ${(.25 * k).toFixed(2)} 公升`,
    found: '數有幾個 0.01：25×3＝75，就是 0.75。', name: `同樣的 0.25 重複 3 次，就是小數的${c4T('整數倍')}。寫成 每份量×份數：0.25×3。`, loop: [0, 1, 2],
    check: { q: '每包糖 0.12 公斤，買 4 包。求整數倍 0.12×4，是幾公斤？', pic: () => c4s(172, c4grid(70, 6, 48)), opts: ['0.48', '0.16', '4.8'], a: 0, why: '12 個 0.01，重複 4 次。', ok: '對了！48 個 0.01，是 0.48 公斤。' } },
  { key: 'perp', title: '垂直和平行', terms: ['垂直', '平行'], game: 'quad', sem: '四下', when: ['quad:lines', 'quad:name', 'quad:pairs', 'quad:diag'],
    ask: '新城市要開兩條路。兩條路可以怎麼擺？', tryIt: '往右拖，換橘色那條路的方向。', states: [0, 1, 2],
    pic: (s, tg) => c4road(s, tg ? ['', '垂直', '平行'][s] : ''),
    note: s => ['碰在一起，歪歪的', '碰在一起，夾出一個直角', '再怎麼延長，都不會碰到'][s],
    found: '有的會碰到，碰成直角最特別；有的永遠碰不到。', name: `兩條線相交成直角，叫${c4T('垂直')}；兩條線永遠碰不到，叫${c4T('平行')}。`, loop: [1, 2],
    check: { q: '斑馬線上的每一條白線，一條一條都碰不到。它們是什麼關係？', pic: () => c4s(90, [0, 1, 2, 3, 4].map(i => `<rect x="${40 + i * 50}" y="8" width="26" height="72" fill="#aab3c2"/>`).join('')), opts: ['垂直', '平行', '都不是'], a: 1, why: '白線會碰到嗎？', ok: '對了！永遠碰不到，是平行。' } },
  { key: 'quadp', title: '平行四邊形和梯形', terms: ['平行四邊形', '梯形'], game: 'quad', sem: '四下', when: ['quad:name', 'quad:pairs'],
    ask: '工廠有好多四邊形的板子。要怎麼分類？看看相對的兩條邊。', tryIt: '往右拖，換一塊板子。一樣顏色的是平行的邊。', states: [0, 1, 2],
    pic: (i, tg) => c4quadPair(i, tg ? ['平行四邊形', '梯形', ''][i] : ''),
    note: i => ['兩組對邊都平行', '只有一組對邊平行', '沒有平行的邊'][i],
    found: '數一數有幾組對邊平行，就能替板子分類。', name: `兩組對邊平行的四邊形叫${c4T('平行四邊形')}；只有一組對邊平行的叫${c4T('梯形')}。`, loop: [0, 1],
    check: { q: '水桶的側面，上下兩條邊平行，左右兩條邊不平行。它是什麼形狀？', pic: () => c4quadPair(1), opts: ['長方形', '梯形', '平行四邊形'], a: 1, why: '幾組對邊平行？', ok: '對了！只有一組，是梯形。' } },
  { key: 'rhomb', title: '菱形', terms: ['菱形'], game: 'quad', sem: '四下', when: ['quad:name'],
    ask: '四根一樣長的吸管接成一圈，輕輕一推，形狀會變。什麼沒有變？', tryIt: '往右拖，推推看。', states: [0, 22, 42], tween: 1,
    pic: (d, tg) => c4rhomb(d, tg && d > 0 ? '菱形' : ''),
    note: d => d === 0 ? '4 個角都是直角，是正方形' : d < 42 && d > 0 ? '角變了，4 根吸管還是一樣長' : d === 42 ? '更歪了，4 邊還是一樣長' : '',
    found: '角一直變，可是 4 邊都一樣長。', name: `4 個邊都一樣長的四邊形叫${c4T('菱形')}。`, loop: [1, 2],
    check: { q: '風箏的 4 條邊都是 30 公分，角不是直角。它是什麼形狀？', pic: () => c4rhomb(30), opts: ['梯形', '菱形', '長方形'], a: 1, why: '看 4 條邊。', ok: '對了！4 邊一樣長，是菱形。' } },
  { key: 'diag', title: '對角線', terms: ['對角線'], game: 'quad', sem: '四下', when: ['quad:diag'],
    ask: '板子要多加一根骨架才穩。從 A 點拉線，拉到哪裡才能穿過板子中間？', tryIt: '往右拖，換一條線拉。', states: [0, 1, 2],
    pic: (s, tg) => c4diag(s, tg && s ? '對角線' : ''),
    note: s => ['A 到 B：就是板子的邊，沒有穿過中間', 'A 到 C：連到對面的點，把板子分成兩塊', 'B 到 D：也連到對面的點'][s],
    found: '連到對面的點才會穿過中間，一共有 2 條。', name: `四邊形連接相對兩個頂點的線，叫${c4T('對角線')}。`, loop: [1, 2],
    check: { q: '一扇長方形的窗戶，對角線一共可以畫幾條？', pic: () => c4s(110, c4poly([[60, 10], [260, 10], [260, 100], [60, 100]], '#e6f0fa', '#2f5f9e')), opts: ['1', '2', '4'], a: 1, why: '從每個角連到對面的角，會有幾條？', ok: '對了！2 條。' } },
  { key: 'round', title: '概數和四捨五入', terms: ['概數', '四捨五入'], game: 'est', sem: '四下', when: ['est:near', 'est:how'],
    ask: '新聞不會說「3482 人」，常常說「大約 3500 人」。為什麼不是 3400？', tryIt: '往右拖，看看紅色箭頭靠近哪一邊。', states: [3420, 3482, 3450], tween: 1,
    pic: (v, tg) => c4round(v, tg ? '四捨五入' : ''),
    note: v => v === 3450 ? '3450 剛好在中間，規定算 3500' : v === 3420 ? '3420 靠近 3400' : v === 3482 ? '3482 靠近 3500' : '移動中',
    found: '只看十位：0 到 4 往 3400 走，5 到 9 往 3500 走。', name: `大約的數叫${c4T('概數')}。看下一位，4 以下不要、5 以上進位，叫${c4T('四捨五入')}。`, loop: [0, 1],
    check: { q: '一場比賽 1276 人。用四捨五入取到百位，概數是多少？', pic: () => '<div class="u-big num">1276</div>', opts: ['1200', '1300', '1280'], a: 1, why: '百位的下一位是 7。', ok: '對了！7 比 5 大，要進位，是 1300。' } },
  { key: 'updown', title: '無條件進入和捨去', terms: ['無條件進入', '無條件捨去'], game: 'est', sem: '四下', when: ['est:up', 'est:down', 'est:how'],
    ask: '87 顆橘子，每箱裝 10 顆。要幾箱？老闆和客人的想法不一樣。', tryIt: '往右拖，看裝箱和賣箱有什麼不同。', states: [0, 1, 2],
    pic: (s, tg) => c4boxes(s, tg ? ['', '無條件進入', '無條件捨去'][s] : ''),
    note: s => ['8 箱裝滿，還剩 7 顆', '全部都要裝：剩的也要一箱，共 9 箱', '整箱才能賣：剩的不算，只有 8 箱'][s],
    found: '不看剩幾顆：全部要裝就多算一箱，整箱才賣就不算。', name: `不管零頭多少都多算一個，叫${c4T('無條件進入')}；不管零頭多少都不算，叫${c4T('無條件捨去')}。`, loop: [1, 2],
    check: { q: '432 位學生坐遊覽車，每車 100 人，全部都要坐到。要用哪一種取法？', pic: () => '<div class="u-big">🚌</div>', opts: ['無條件進入', '無條件捨去'], a: 0, why: '剩下的 32 人可以不坐嗎？', ok: '對了！要多一輛，共 5 輛。' } },
  { key: 'estim', title: '估算', terms: ['估算'], game: 'est', sem: '四下', when: ['est:sum', 'est:cost'],
    ask: '每個麵包 48 元，買 3 個。帶 200 元夠嗎？站在櫃臺前，很快就想知道。', tryIt: '往右拖，用好算的數想想看。', states: [0, 1, 2],
    pic: (s, tg) => c4est(s, tg && s ? '估算' : ''),
    note: s => ['48×3 要算一下', '48 差不多 50，每個 50 元 × 3 個', '大約 150 元，比 200 元少很多：一定夠！'][s],
    found: '不用算得很準，先換成好算的數，就知道夠不夠。', name: `先取概數算個大概，叫${c4T('估算')}。`, loop: [1, 2],
    check: { q: '每本書 198 元，買 2 本。估算大約要幾元？', pic: () => '<div class="u-big">📚</div>', opts: ['200', '300', '400'], a: 2, why: '198 差不多 200，再乘 2。', ok: '對了！200×2＝400。' } },
  { key: 'barc', title: '長條圖', terms: ['長條圖'], game: 'chart', sem: '四下', when: ['chart:read', 'chart:diff', 'chart:build'],
    ask: '班上投票選點心。只看一排數字，要很久才知道誰最多。可以怎麼辦？', tryIt: '往右拖，把票數疊起來。', states: [0, 1, 2],
    pic: (s, tg) => c4bars(['餅乾', '蘋果', '布丁', '果凍'], [6, 3, 5, 2], s, tg && s ? '長條圖' : '', 8),
    note: s => ['全部都是字，比不出來', '一票一格疊起來，一眼看出誰高', '再加上刻度，每一條都讀得出來'][s],
    found: '條子高的就是多，不用一個一個比。', name: `用長條的高低，表示數量的多少，叫${c4T('長條圖')}。`, loop: [1, 2],
    check: { q: '這張長條圖是三班回收的瓶子。哪一班最多？', pic: () => c4bars(['甲班', '乙班', '丙班'], [4, 7, 3], 2, '', 8), opts: ['甲班', '乙班', '丙班'], a: 1, why: '哪一條最高？', ok: '對了！乙班最高。' } },
  { key: 'linec', title: '折線圖', terms: ['折線圖'], game: 'chart', sem: '四下', when: ['chart:line'],
    ask: '豆苗每天量一次高度。哪一天長得最快？要看變化，怎麼畫比較清楚？', tryIt: '往右拖，把每天的點連起來。', states: [1, 2, 3],
    pic: (n, tg) => c4lineChart(['第一天', '第二天', '第三天', '第四天'], [2, 3, 7, 8], n, tg ? '折線圖' : '', 10, 2),
    note: n => ['第一天到第二天：長 1 公分', '第二天到第三天：長 4 公分，線很陡！', '第三天到第四天：長 1 公分'][n - 1],
    found: '線越陡，那一段變得越多；一眼就看出第二天到第三天長最快。', name: `把每個點用線連起來，看出變化的圖，叫${c4T('折線圖')}。`, loop: [0, 1, 2],
    check: { q: '這張折線圖是一天的氣溫。哪一段上升最多？', pic: () => c4lineChart(['8時', '10時', '12時', '14時'], [18, 20, 26, 27], 3, '', 30, 10), opts: ['8 時到 10 時', '10 時到 12 時', '12 時到 14 時'], a: 1, why: '哪一段線最陡？', ok: '對了！上升了 6 度。' } },
  { key: 'gap', title: '省略符號', terms: ['省略符號'], game: 'chart', sem: '四下', when: ['chart:gap'],
    ask: '三個人的身高差不多。從 0 開始畫，三條幾乎一樣高，看不出差別。怎麼辦？', tryIt: '往右拖，改一改刻度。', states: [0, 1, 2],
    pic: (s, tg) => c4gap(s, tg && s === 2 ? '省略符號' : ''),
    note: s => ['從 0 開始：三條幾乎一樣高', '切掉下面：差別看清楚了，可是別人以為從 0 開始', '加上鋸齒記號：告訴別人下面切掉了'][s],
    found: '下面用不到的部分可以切掉，但是要做記號告訴別人。', name: `表示「這裡省略了一段刻度」的鋸齒記號，叫${c4T('省略符號')}。`, loop: [1, 2],
    check: { q: '這張圖的刻度從 120 開始，下面有省略符號。這是什麼意思？', pic: () => c4gap(2), opts: ['0 到 120 這段沒畫出來', '大家都是 120', '圖畫錯了'], a: 0, why: '鋸齒記號表示什麼被切掉了？', ok: '對了！那一段刻度省略了。' } },
  { key: 'ell', title: '複合圖形', terms: ['複合圖形'], game: 'deck', sem: '四下', when: ['deck:ell'],
    ask: 'L 形的甲板要鋪地磚。沒有公式可以直接算，怎麼知道要幾塊？', tryIt: '往右拖，切一刀試試。', states: [0, 1, 2],
    pic: (s, tg) => c4ell(s, tg && s === 2 ? '複合圖形' : ''),
    note: s => ['不是長方形，公式用不上', '切一刀，變成兩個長方形', '分開算再加起來：21 塊'][s],
    found: '切開就變成會算的長方形了。', name: `由幾個圖形合起來的圖形，叫${c4T('複合圖形')}。可以切開算再加起來。`, loop: [1, 2],
    check: { q: '凸字形的花圃，是兩個長方形合起來的。它是什麼圖形？', pic: () => c4s(110, c4poly([[110, 10], [210, 10], [210, 50], [280, 50], [280, 100], [40, 100], [40, 50], [110, 50]], '#e6f0fa', '#2f5f9e')), opts: ['梯形', '複合圖形', '正方形'], a: 1, why: '它是幾個圖形合起來的？', ok: '對了！可以切開算面積。' } },
  { key: 'eqv', title: '等值分數', terms: ['等值分數'], game: 'eqv', sem: '四下', when: ['eqv:cut', 'eqv:simplify', 'eqv:candy', 'eqv:cmp'],
    ask: '姊姊吃半條巧克力，弟弟把半條切成小塊才吃。弟弟吃得比較多嗎？', tryIt: '往右拖，把紅色那一條切細。', states: [1, 2, 4],
    pic: (k, tg) => c4strip(k, tg ? '等值分數' : ''),
    note: k => `切成 ${2 * k} 塊，吃 ${k} 塊，和上面一樣長`,
    found: '塊數變多，可是長度一樣。1/2、2/4、4/8 都是一樣多。', name: `寫法不同、大小一樣的分數，叫${c4T('等值分數')}。`, loop: [0, 1, 2],
    check: { q: '哪一個和 1/3 是等值分數？', pic: () => c4s(90, c4cells(30, 6, 3, 1, 260, 32) + c4cells(30, 50, 6, 0, 260, 32)), opts: ['2/6', '2/3', '3/6'], a: 0, why: '1 塊切成 2 小塊，3 塊就變成幾小塊？', ok: '對了！1/3＝2/6。' } },
  { key: 'h24', title: '24 小時制', terms: ['24 小時制'], game: 'time', sem: '四下', when: ['time:h24'],
    ask: '火車票寫著「15:00 開車」。鐘面上明明沒有 15，這是幾點？', tryIt: '往右拖，從半夜開始走。', states: [180, 720, 900], tween: 0,
    pic: (m, tg) => c4day(m, tg ? '24 小時制' : ''),
    note: m => m === 180 ? '上午 3 時：3:00' : m === 720 ? '中午 12 時：12:00' : '下午 3 時：12＋3，是 15:00',
    found: '從半夜一直數到隔天半夜，就不會弄混上午和下午。', name: `一天從 0 時數到 24 時，叫${c4T('24 小時制')}。下午的時刻多加 12。`, loop: [0, 2],
    check: { q: '晚上 8 時 20 分，用 24 小時制怎麼寫？', pic: () => '<div class="u-big">🌙</div>', opts: ['8:20', '18:20', '20:20'], a: 2, why: '晚上的時刻要加 12。', ok: '對了！8＋12＝20，是 20:20。' } },
];
/* 單位教室的開場：同一結構。名稱出現之後才接原本的卡片（量感）、動手、換算練習 */
const c4tags = (...ts) => c4s(34, ts.map((t, i) => c4tag(160 + (i - (ts.length - 1) / 2) * 130, 20, t)).join(''));
const UCONCEPTS = [
  { key: 'u_km', lesson: 'km', title: '公里', terms: ['公里'], game: 'km', who: 'otter', sem: '四上',
    ask: '路標要寫「到車站還有 5000 公尺」，字好長，開車也看不清楚。可以怎麼說？', tryIt: '操場一圈 200 公尺。往右拖，多跑幾圈。', states: [1, 5, 10],
    pic: (k, tg) => c4s(150, Array.from({ length: 10 }, (_, i) => `<ellipse cx="${36 + (i % 5) * 62}" cy="${28 + Math.floor(i / 5) * 42}" rx="26" ry="16" fill="${i < k ? '#a9d0a0' : '#f4f6fa'}" stroke="${i < k ? '#3d9970' : '#b9c2d0'}" stroke-width="5"/>`).join('') + c4x(160, 126, `${fmt(k * 200)} 公尺`, { s: 24, f: '#d6476b' }) + (tg && k > 1 ? c4tag(270, 122, `${k * 200 / 1000} 公里`) : '')),
    note: k => k === 1 ? '跑 1 圈：200 公尺' : k === 5 ? '跑 5 圈：1000 公尺，已經要 4 個數字' : '跑 10 圈：2000 公尺，走路要半小時',
    found: '每滿 1000 公尺就換一個大單位，數字就變短了。', name: `1000 公尺，叫 1 ${c4T('公里')}。5000 公尺就是 5 公里。`, loop: [1, 2],
    check: { q: '從家到車站 3000 公尺。是幾公里？', pic: () => '<div class="u-big">🚉</div>', opts: ['3 公里', '30 公里', '300 公里'], a: 0, why: '1000 公尺是 1 公里，3000 公尺有幾個 1000？', ok: '對了！3000 公尺是 3 公里。' } },
  { key: 'u_deg', lesson: 'deg', title: '度', terms: ['度'], game: 'deg', who: 'goat', sem: '四上',
    ask: '「門開一點點」，每個人想的都不一樣。角有多大，要怎麼說才清楚？', tryIt: '把一整圈切成 360 小片。往右拖，用小片拼角。', states: [30, 90, 180], tween: 1,
    pic: (d, tg) => { const C = [160, 130], R = 110; let o = c4wedge(C[0], C[1], R, 0, d, '#ffb3a7'); for (let a = 0; a <= Math.floor(d); a += 10) o += c4L(C, c4pol(C[0], C[1], R, a), '#d6476b', 1); return c4s(150, o + c4L(C, [C[0] + R, C[1]], '#33405a', 5) + c4L(C, c4pol(C[0], C[1], R, d), '#d6476b', 5) + c4x(160, 147, `${Math.round(d)} 小片`, { s: 16 }) + (tg ? c4tag(52, 26, `${Math.round(d)} 度`) : '')); },
    note: d => d === 30 ? '30 小片：三角板最小的角' : d === 90 ? '90 小片：剛好是直角' : d === 180 ? '180 小片：半圈，變成一直線' : '',
    found: '只要說「幾小片」，大家想的角就一樣大了。', name: `把一整圈切成 360 份，1 份的大小叫 1 ${c4T('度')}。直角是 90 度。`, loop: [0, 1, 2],
    check: { q: '書本打開的角，拼進去剛好 45 小片。這個角是幾度？', pic: () => c4s(120, c4wedge(160, 110, 95, 0, 45, '#ffb3a7') + c4L([160, 110], [255, 110], '#33405a', 5) + c4L([160, 110], c4pol(160, 110, 95, 45), '#d6476b', 5)), opts: ['4 度', '45 度', '450 度'], a: 1, why: '1 小片是 1 度。', ok: '對了！45 小片就是 45 度。' } },
  { key: 'u_m2', lesson: 'm2', title: '平方公尺', terms: ['平方公尺'], game: 'deck', who: 'sheep', sem: '四下',
    ask: '教室地板要鋪墊子。用 1 平方公分的小格來數，數到明天也數不完！有大一點的格子嗎？', tryIt: '有一塊每邊 100 公分的大墊子。往右拖，鋪上小格。', states: [100, 5000, 10000],
    pic: (v, tg) => c4s(172, c4grid(10, 6, v / 100) + c4x(248, 60, fmt(v), { s: 26, f: '#d6476b' }) + c4x(248, 84, '平方公分', { s: 15 }) + c4x(248, 22, '每邊 100 公分', { s: 14 }) + (tg && v === 10000 ? c4tag(248, 124, '1 平方公尺') : '')),
    note: v => v === 100 ? '鋪一排：100 個小格' : v === 5000 ? '鋪 50 排：每排 100 格 × 50 排' : '鋪滿 100 排：每排 100 格 × 100 排＝10000 格',
    found: '一塊大墊子就有 10000 個小格。量大地方用它，好算多了。', name: `每邊 1 公尺的正方形，叫 1 ${c4T('平方公尺')}，等於 10000 平方公分。`, loop: [0, 2],
    check: { q: '小房間剛好鋪滿 12 塊每邊 1 公尺的大墊子。地板有多大？', pic: () => c4s(110, Array.from({ length: 12 }, (_, i) => `<rect x="${64 + (i % 4) * 48}" y="${6 + Math.floor(i / 4) * 32}" width="48" height="32" fill="#bfe3b4" stroke="#3d9970"/>`).join('')), opts: ['12 平方公分', '12 平方公尺', '12 公尺'], a: 1, why: '一塊每邊 1 公尺的墊子，有多大？', ok: '對了！12 塊就是 12 平方公尺。' } },
  { key: 'u_cm3', lesson: 'cm3', title: '體積和立方公分', terms: ['體積', '立方公分'], game: 'vol', who: 'octopus', sem: '四下',
    ask: '一個盒子又長又扁，一個又高又瘦。哪一個占的空間大？直接看比不出來。', tryIt: '拿每邊 1 公分的小方塊來堆。往右拖，堆堆看。', states: [3, 9, 18],
    pic: (n, tg) => `${isoSvg(3, 3, 2, n)}${tg ? c4tags('體積', `${n} 立方公分`) : c4s(34, c4x(160, 24, `${n} 塊小方塊`, { s: 18 }))}`,
    note: n => n === 3 ? '一排 3 塊' : n === 9 ? '每排 3 塊 × 3 排：一層 9 塊' : '每層 9 塊 × 2 層：18 塊',
    found: '數有幾塊小方塊，就知道占多少空間。形狀不同也能比。', name: `東西占的空間大小叫${c4T('體積')}。每邊 1 公分的小方塊是 1 ${c4T('立方公分')}。`, loop: [1, 2],
    check: { q: '積木每層 4 塊，疊 3 層，每塊 1 立方公分。體積是多少？', pic: () => isoSvg(2, 2, 3), opts: ['7 立方公分', '12 立方公分', '12 公分'], a: 1, why: '每層 4 塊 × 3 層，一共幾塊？', ok: '對了！4×3＝12 立方公分。' } },
  { key: 'u_time', lesson: 'time', title: '分鐘、小時、日', terms: ['分鐘', '小時', '日'], game: 'time', who: 'raccoon', sem: '四下',
    ask: '飛船今天早上 8 點出發，明天早上 8 點到。鐘面上的針一共走了多少？', tryIt: '往右拖，讓鐘走起來。', states: [1, 12, 24], tween: 1,
    pic: (h, tg) => { const C = [110, 92], R = 84; let o = `<circle cx="${C[0]}" cy="${C[1]}" r="${R}" fill="#fff" stroke="#33405a" stroke-width="3"/>`; for (let i = 1; i <= 12; i++) { const a = i * 30 * Math.PI / 180; o += c4x(C[0] + 68 * Math.sin(a), C[1] + 5 - 68 * Math.cos(a), i, { s: 13 }); } const a = (8 + h) * 30 * Math.PI / 180; o += c4L(C, [C[0], C[1] - 58], '#2f5f9e', 4) + c4L(C, [C[0] + 40 * Math.sin(a), C[1] - 40 * Math.cos(a)], '#d6476b', 7) + `<circle cx="${C[0]}" cy="${C[1]}" r="6" fill="#33405a"/>`; const H = Math.round(h); return c4s(186, o + c4x(255, 60, '短針走了', { s: 15 }) + c4x(255, 92, H, { s: 30, f: '#d6476b' }) + c4x(255, 116, '大格', { s: 15 }) + (tg ? (H === 1 ? c4tag(255, 28, '60 分鐘') + c4tag(255, 150, '1 小時') : H === 24 ? c4tag(255, 150, '1 日') : '') : '')); },
    note: h => h === 1 ? '長針走一圈 60 小格，短針才走 1 大格' : h === 12 ? '短針走 12 大格：早上 8 點到晚上 8 點' : h === 24 ? '短針走 24 大格：到了明天這個時候' : '',
    found: '時間不是滿 100 才換：60 小格換 1 大格，24 大格換一天。', name: `長針走 1 小格是 1 ${c4T('分鐘')}，60 分鐘是 1 ${c4T('小時')}；24 小時是 1 ${c4T('日')}。`, loop: [0, 2],
    check: { q: '露營從星期六晚上 8 點，到星期天晚上 8 點。一共過了多久？', pic: () => '<div class="u-big">⛺</div>', opts: ['1 日', '1 小時', '1 分鐘'], a: 0, why: '短針走了幾大格？', ok: '對了！24 小時就是 1 日。' } },
];
const conceptsOf = g => CONCEPTS.filter(c => c.game === g);
const seenCpt = () => S.seenCpt || (S.seenCpt = {});
let cptTimer = null, cptAnim = 0;
const cptStop = () => { if (cptTimer) { clearInterval(cptTimer); cptTimer = null; } cptAnim++; };
function cptPaint(C, to, named, from) { // 能轉、能移的圖用補間動起來；其他直接換
  const el = document.getElementById('cp'); if (!el) return;
  const put = v => { const e = document.getElementById('cp'); if (e) e.innerHTML = C.pic(v, named); };
  const id = ++cptAnim;
  if (!C.tween || typeof to !== 'number' || typeof from !== 'number' || from === to) return put(to);
  const t0 = performance.now(), step = t => { if (id !== cptAnim) return; const p = Math.min(1, (t - t0) / 320); put(p >= 1 ? to : from + (to - from) * (1 - (1 - p) * (1 - p))); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function cptDrag(el, cb) { // 在圖和拉桿上都可以拖
  el.onpointerdown = e => { el._on = true; try { el.setPointerCapture(e.pointerId); } catch (x) {} const b = el.getBoundingClientRect(); cb((e.clientX - b.left) / b.width); e.preventDefault(); };
  el.onpointermove = e => { if (el._on) { const b = el.getBoundingClientRect(); cb((e.clientX - b.left) / b.width); } };
  el.onpointerup = el.onpointercancel = () => { el._on = false; };
}
function runConcept(key, then, replay, exit) {
  const C = CONCEPTS.concat(UCONCEPTS).find(c => c.key === key), who = C.who || STORY[C.game].who, L = { title: C.title, sem: C.sem, who }, L0 = { title: '小故事', sem: C.sem, who };
  const done = () => { cptStop(); if (!replay) { seenCpt()[key] = 1; save(); } then(); };
  const skipBtn = `<button class="skip5" id="skipc">${replay ? '不看了' : '跳過'}</button>`;
  const wire = () => { document.getElementById('out').onclick = () => { cptStop(); if (exit) return exit(); if (replay) return then(); R = null; go(''); }; document.getElementById('skipc').onclick = () => { seenCpt()[key] = 1; save(); cptStop(); then(); }; };
  function op() { // 第二步：動手試，全程不出現新詞（連標題也不出現）
    cptStop();
    lessonFrame(L0, `${nums(C.ask)}<br><small>${nums(C.tryIt)}</small>`, `<div class="cp" id="cpw"><div id="cp"></div><div class="cslide" id="cs">${C.states.map((_, i) => `<u style="left:${i / (C.states.length - 1) * 100}%"></u>`).join('')}<i id="csk" class="hint">👉</i></div></div><div class="trail" id="ct"></div>${skipBtn}`); wire();
    const seen = new Set(); let i = -1, over = false;
    const nextBtn = () => { document.getElementById('actions').innerHTML = over ? '<button class="btn" id="nm">這叫什麼？</button>' : '<button class="btn alt" id="tn">不方便拖？按這裡換下一個</button>'; if (over) document.getElementById('nm').onclick = named; else document.getElementById('tn').onclick = () => { const n = C.states.findIndex((_, k) => !seen.has(k)); show(n < 0 ? (i + 1) % C.states.length : n, true); }; };
    const show = (k, moved) => { const prev = i < 0 ? undefined : C.states[i]; i = k; cptPaint(C, C.states[k], false, prev); setEl('ct', nums(C.note(C.states[k]))); const sk = document.getElementById('csk'); sk.style.left = `${k / (C.states.length - 1) * 100}%`; if (moved) sk.classList.remove('hint'); sfx.hop(); seen.add(k); if (seen.size === C.states.length && !over) { over = true; setMsg(nums(C.found), 'good'); sfx.ok(); } nextBtn(); };
    show(0);
    cptDrag(document.getElementById('cpw'), x => { const k = clamp4(Math.round(x * (C.states.length - 1)), 0, C.states.length - 1); if (k !== i) show(k, true); });
  }
  function named() { // 第三步：命名，圖一直動，新詞貼在圖上
    cptStop();
    lessonFrame(L, nums(C.name), `<div class="cp2"><div id="cp"></div></div><div class="tagrow">${C.terms.map(t => `<span class="termtag">${t}</span>`).join('')}</div>${skipBtn}`); wire();
    let k = 0, prev; const paint = () => { const v = C.states[C.loop[k % C.loop.length]]; cptPaint(C, v, true, prev); prev = v; }; paint();
    cptTimer = setInterval(() => { k++; if (document.getElementById('cp')) paint(); else cptStop(); }, 1400);
    actionBtn('ck', '換一題試試').onclick = check;
  }
  function check() { // 第四步：換情境用新詞答；答錯回到操作
    cptStop(); const K = C.check;
    lessonFrame(L, nums(K.q), `<div class="cp2">${K.pic()}</div>${skipBtn}`); wire();
    document.getElementById('actions').innerHTML = `<div class="choices${K.opts.some(o => o.length > 6) || K.opts.length > 3 ? ' col' : ''}">${K.opts.map((o, i) => `<button class="choice" data-c4="${i}">${nums(o)}</button>`).join('')}</div>`;
    document.querySelectorAll('[data-c4]').forEach(b => b.onclick = () => {
      if (+b.dataset.c4 === K.a) { sfx.good(); setMsg(nums(K.ok), 'good'); seenCpt()[key] = 1; save(); document.getElementById('skipc').hidden = true; actionBtn('fin', exit ? '繼續上課' : replay ? '看完了' : '開始玩').onclick = done; return; }
      sfx.retry(); setMsg(nums(K.why), 'hint'); actionBtn('bk', '回去再動手看看').onclick = op;
    });
  }
  op();
}
const LESSON_ASK = { km: '路有多長', deg: '角有多大', m2: '地有多大', cm3: '占多少空間', time: '過了多久' };
const lessonName = k => (S.learned || {})[k] ? LESSONS[k].title : LESSON_ASK[k]; // 還沒上過課，選單先不露出單位名稱
const clamp4 = (v, a, b) => Math.max(a, Math.min(b, v));
function conceptThen(q, then) { // 第一次碰到這個題型自動播；已看過就不再播；舊存檔沒有 seenCpt 也可以
  const key = q.kind + ':' + q.mode, C = CONCEPTS.find(c => c.when.includes(key) && !seenCpt()[c.key] && (!c.test || c.test(q)));
  if (!C) return then();
  runConcept(C.key, () => conceptThen(q, then));
}
function viewConcepts(g, back) { // 重看；單位教室教過的單位，接回單位教室
  const list = g ? conceptsOf(g) : CONCEPTS, lk = g ? (LESSON_BEFORE[g] || []) : [];
  window.scrollTo(0, 0);
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="bkc" aria-label="回去">⌂</button><h2 class="page-h">新概念小故事</h2></div><p class="tag">想再看一次哪一個？</p><div class="lessons">${lk.map(k => `<button class="lesson" data-rl="${k}"><span class="l-t"><b>單位教室：${lessonName(k)}</b><small>${(S.learned || {})[k] ? LESSONS[k].cards.map(c => c.u).join('、') : '從小故事開始'}</small></span><em class="sem">${LESSONS[k].sem}</em></button>`).join('')}${list.map(c => `<button class="lesson" data-rc="${c.key}"><span class="l-t"><b>${c.title}</b><small>${c.terms.join('、')}・${GAMES[c.game].name}</small></span><em class="sem">${c.sem}</em>${seenCpt()[c.key] ? '<span class="badge in">✓</span>' : ''}</button>`).join('')}</div>`;
  document.getElementById('bkc').onclick = back;
  document.querySelectorAll('[data-rc]').forEach(b => b.onclick = () => runConcept(b.dataset.rc, () => viewConcepts(g, back), true));
  document.querySelectorAll('[data-rl]').forEach(b => b.onclick = () => runLesson(b.dataset.rl, () => viewConcepts(g, back)));
}
function viewLessons() {
  window.scrollTo(0, 0);
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="home" aria-label="回地圖">⌂</button><h2 class="page-h">單位教室</h2></div>
    <p class="tag">先認識單位，再去島上用它。</p>
    <div class="lessons">${Object.entries(LESSONS).map(([k, L]) => `<div class="lesson-row"><button class="lesson" data-l="${k}"><span class="l-e">${L.icon}</span><span class="l-t"><b>${lessonName(k)}</b><small>${(S.learned || {})[k] ? L.cards.map(c => c.u).join('、') : '從小故事開始'}</small></span><em class="sem">${L.sem}</em>${(S.learned || {})[k] ? '<span class="badge in">✓</span>' : ''}</button><button class="drill-btn" data-d="${k}">練習</button></div>`).join('')}</div>`;
  document.getElementById('home').onclick = () => go('');
  document.querySelectorAll('[data-l]').forEach(b => b.onclick = () => runLesson(b.dataset.l, viewLessons));
  document.querySelectorAll('[data-d]').forEach(b => b.onclick = () => runDrill(b.dataset.d, viewLessons));
}
function lessonFrame(L, title, body) {
  window.scrollTo(0, 0);
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="out" aria-label="離開">⌂</button><h2 class="page-h">${L.title}<span class="sem">${L.sem}</span></h2><button class="icon-btn" id="say" aria-label="唸出來">🔊</button></div>
    <div class="say-row">${artImg(L.who, 'say-who')}<div class="prompt" id="prompt">${title}</div></div><div class="stage" id="stage">${body}</div><div class="msg" id="msg"></div><div class="actions" id="actions"></div>`;
  document.getElementById('say').onclick = () => speak(plainText(document.getElementById('prompt')));
}
const FAM_UNIT = { 分: '分鐘' };
function exList(key, unit) { // 同單位的生活例子
  const ex = Logic.UNIT_ITEMS[key].filter(x => x.u === (FAM_UNIT[unit] || unit));
  return ex.length ? `<span class="u-ex">${ex.map(x => `<span>${x.e} ${x.name} ${x.v} ${x.u}</span>`).join('')}</span>` : '';
}
function runLesson(key, then) {
  const L = LESSONS[key];
  const leave = () => { document.body.classList.remove('in-cine'); then(); };
  // 第一步：一張一張看實物
  function cards() {
    lessonFrame(L, L.say, `<div class="u-cards">${L.cards.map((c, i) => `<button class="u-card" data-i2="${i}"><span class="u-e">${c.e}</span><b>${c.u}</b><small class="u-t" hidden>${nums(c.t)}${exList(key, c.u)}</small></button>`).join('')}</div>`);
    document.getElementById('out').onclick = leave;
    const seen = new Set();
    document.getElementById('actions').innerHTML = '<button class="btn" id="go2" disabled>動手試試</button>';
    setMsg('點每一張卡片，看看它有多大。');
    document.querySelectorAll('.u-card').forEach(b => b.onclick = () => {
      seen.add(b.dataset.i2); b.classList.add('seen'); b.querySelector('.u-t').hidden = false; sfx.hop();
      speak(L.cards[+b.dataset.i2].u + '。' + L.cards[+b.dataset.i2].t);
      if (seen.size === L.cards.length) { document.getElementById('go2').disabled = false; setMsg('都看過了！'); reveal('#actions'); }
    });
    document.getElementById('go2').onclick = () => lab(0);
  }
  // 第二步：動手裝滿，感覺單位之間的關係
  function lab(i) {
    const X = L.labs[i];
    if (!X) return quiz();
    if (X.tiles) return tiles(X, i);
    lessonFrame(L, `${X.view === 'angle' ? '撥動黃色圓鈕，轉到' : '一直加，加到'} ${X.to}。`, `${X.view ? '<div id="bar" class="lab-pic"></div>' : `<div class="${X.tall ? 'u-bottle' : 'u-bar'}" id="bar">${Array.from({ length: X.n }, () => '<i></i>').join('')}</div>`}<div class="u-count" id="cnt"></div><div class="trade"><button id="add">${X.btn}</button></div>`);
    document.getElementById('out').onclick = leave;
    let k = 0;
    const draw = () => {
      if (X.view) setEl('bar', labPic(X, k)); else document.querySelectorAll('#bar i').forEach((c, j) => c.classList.toggle('on', j < k));
      document.getElementById('cnt').innerHTML = `<b class="num">${k * X.each}</b> ${X.from}`;
    };
    draw();
    if (X.view === 'angle') dragAngle(document.getElementById('bar'), X.each, a => { if (k >= X.n) return; if (a >= X.n * X.each) { k = X.n - 1; return document.getElementById('add').onclick(); } k = a / X.each; sfx.hop(); draw(); });
    document.getElementById('add').onclick = () => {
      if (k >= X.n) return;
      k++; sfx.hop(); draw();
      if (k === X.n) {
        sfx.good(); document.getElementById('add').style.display = 'none'; setMsg(nums(X.done), 'good');
        document.getElementById('actions').innerHTML = '<button class="btn" id="go3">繼續</button>';
        document.getElementById('go3').onclick = () => lab(i + 1);
        reveal('#actions');
      }
    };
  }
  function tiles(X, i) {
    lessonFrame(L, X.say, `<div class="u-tiles" style="grid-template-columns:repeat(${X.w},1fr)">${Array.from({ length: X.w * X.h }, (_, j) => `<button class="u-tile" data-t="${j}" aria-label="第 ${j + 1} 格"></button>`).join('')}</div><div class="u-count" id="cnt"></div>`);
    document.getElementById('out').onclick = leave;
    const on = new Set();
    const draw = () => { document.getElementById('cnt').innerHTML = `<b class="num">${on.size}</b> ${X.unit}`; };
    draw();
    document.querySelectorAll('.u-tile').forEach(b => b.onclick = () => {
      if (on.has(b.dataset.t)) return;
      on.add(b.dataset.t); b.classList.add('on'); sfx.hop(); draw();
      if (on.size === X.w * X.h) {
        sfx.good(); setMsg(nums(X.done), 'good');
        document.getElementById('actions').innerHTML = '<button class="btn" id="go3">繼續</button>';
        document.getElementById('go3').onclick = () => lab(i + 1);
        reveal('#actions');
      }
    });
  }
  // 第三步：選單位、排大小、想一想
  function quiz() {
    const plan = Logic.UNITS_OF[key].length === 1 ? ['order', 'quiz', 'quiz', 'quiz'] : ['sort', 'sort', 'order', 'quiz', 'quiz'];
    unitDrill(key, plan, leave, finishLesson);
  }
  function finishLesson() {
    S.learned = S.learned || {}; const first = !S.learned[key]; S.learned[key] = 1;
    if (first) S.stars += 1000;
    save();
    lessonFrame(L, `${L.title}單位，你認識了！`, `<div class="u-big">${L.icon}</div><div class="u-sum">${L.cards.map(c => `<span>${c.e} ${c.u}</span>`).join('')}</div>${first ? `<div class="trail">${nums('飛船又飛了 1000 公里')}</div>` : ''}`);
    document.getElementById('out').onclick = leave;
    document.getElementById('actions').innerHTML = '<button class="btn" id="end">好！</button>';
    document.getElementById('end').onclick = leave;
  }
  runConcept('u_' + key, cards, false, leave);
}
// 單位練習：sort 替東西選單位、order 由小排到大、quiz 大約多少
function unitDrill(key, plan, leave, done) {
  const L = LESSONS[key], used = new Set(); let n = 0, firstTry = 0;
  const nextItem = () => { const pool = Logic.UNIT_ITEMS[key].filter(x => !used.has(x)), x = Logic.pick(pool.length ? pool : Logic.UNIT_ITEMS[key]); used.add(x); return x; };
  const passed = (clean, msg) => {
    if (clean) { firstTry++; S.stars += 500; save(); }
    setMsg(nums(msg), 'good'); sfx.ok(); n++;
    document.getElementById('actions').innerHTML = `<button class="btn" id="go4">${n < plan.length ? '下一題' : '完成'}</button>`;
    document.getElementById('go4').onclick = ask;
    reveal('#actions');
  };
  const count = () => nums(`第 ${n + 1} 題，共 ${plan.length} 題`);
  function choose(prompt, emoji, opts, right, why, okMsg) {
    lessonFrame(L, prompt, `<div class="u-big">${emoji}</div><div class="trail">${count()}</div>`);
    document.getElementById('out').onclick = leave;
    document.getElementById('actions').innerHTML = `<div class="choices col">${opts.map(o => `<button class="choice" data-o="${esc(o)}">${nums(o)}</button>`).join('')}</div>`;
    let clean = true;
    document.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
      if (b.dataset.o === right) return passed(clean, okMsg);
      clean = false; sfx.retry(); b.classList.add('no'); b.disabled = true; setMsg(nums(why), 'hint');
    });
  }
  function order() {
    const items = Logic.orderQuestion(key), right = items.slice().sort((a, b) => a.base - b.base), show = Logic.shuffle(items), picked = [];
    lessonFrame(L, '由小到大排排看：<br>從最小的開始點。', `<div class="u-slots" id="slots"></div><div class="u-items">${show.map((x, i) => `<button class="u-item" data-x="${i}"><span class="u-e">${x.e}</span>${x.name}</button>`).join('')}</div><div class="trail">${count()}</div>`);
    document.getElementById('out').onclick = leave;
    let clean = true;
    const slots = () => { document.getElementById('slots').innerHTML = [0, 1, 2].map(i => `<span class="u-slot ${picked[i] ? 'on' : ''}">${picked[i] ? `${picked[i].e}<small>${nums(`${picked[i].v} ${picked[i].u}`)}</small>` : `<b class="num">${i + 1}</b>`}</span>`).join(''); };
    slots();
    document.querySelectorAll('[data-x]').forEach(b => b.onclick = () => {
      const x = show[+b.dataset.x];
      if (x === right[picked.length]) {
        picked.push(x); b.disabled = true; b.classList.add('no'); sfx.hop(); slots();
        if (picked.length === 3) passed(clean, `對了！由小到大：${right.map(r => `${r.name} ${r.v} ${r.u}`).join('，')}。`);
        return;
      }
      clean = false; sfx.retry();
      setMsg(`${x.name}還不是最小的，再想想看。`, 'hint');
    });
  }
  function ask() {
    if (n >= plan.length) return done(firstTry);
    const kind = plan[n];
    if (kind === 'order') return order();
    const x = nextItem();
    if (kind === 'sort') {
      const names = Logic.UNITS_OF[key].map(u => u);
      return choose(`${x.name}${x.dim}，<br>用哪個單位最合適？`, x.e, names, x.u, '想想看：很小用小單位，很大用大單位。', `對了！${x.name}大約 ${x.v} ${x.u}。`);
    }
    const q = Logic.unitQuestion(key, x);
    choose(q.text, q.e, q.options, q.a, q.why, `對了！${q.why}`);
  }
  ask();
}
function runDrill(key, then) { // 單獨練習一輪
  const L = LESSONS[key], base = Logic.UNITS_OF[key].length === 1 ? ['order', 'quiz', 'quiz', 'quiz', 'order', 'quiz'] : ['sort', 'quiz', 'order', 'sort', 'quiz', 'sort', 'order', 'quiz'];
  unitDrill(key, base, then, firstTry => {
    lessonFrame(L, `練習完成！`, `<div class="u-big">${L.icon}</div><div class="u-count"><b class="num">${firstTry}</b> ／ ${base.length} 題第一次就對</div><div class="trail">${nums(`飛船又飛了 ${firstTry * 500} 公里`)}</div>`);
    document.getElementById('out').onclick = then;
    document.getElementById('actions').innerHTML = '<button class="btn" id="again">再練一輪</button><button class="btn alt" id="end">好了</button>';
    document.getElementById('again').onclick = () => runDrill(key, then);
    document.getElementById('end').onclick = then;
  });
}
// 哪座島第一次進去前要先上哪一課
function lessonsThen(ch, then) {
  const need = (LESSON_BEFORE[ch] || []).find(k => !(S.learned || {})[k]);
  if (!need) return then();
  const L = LESSONS[need];
  lessonFrame({ ...L, title: '小故事' }, `先來看一個小故事，<br>等一下用起來就不怕了！`, `<div class="u-big">${L.icon}</div>`);
  document.getElementById('out').onclick = () => go('');
  document.getElementById('actions').innerHTML = '<button class="btn" id="yes">去上課</button><button class="btn alt" id="no">先跳過</button>';
  document.getElementById('yes').onclick = () => runLesson(need, () => lessonsThen(ch, then));
  document.getElementById('no').onclick = then;
}

const QUIZ_STAR = 500;
/* ---------- 單元數感測驗（共用，來源 D:/數感測驗題庫/quiz_ui.js） ---------- */
const QUIZ_LV = { basic: ['基礎題', 25], adv: ['進階題', 25], fun: ['益智題', 10] };
const quizBest = key => (S.quiz || {})[key];
const quizShell = (title, back, body) => {
  window.scrollTo(0, 0);
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="qback" aria-label="回上一頁">⌂</button><h2 class="page-h">${title}</h2></div>${body}`;
  document.getElementById('qback').onclick = back;
};
function viewQuizBooks() {
  const books = (window.QUIZ && QUIZ.books) || [];
  quizShell('單元測驗', () => go(''), `<p class="tag">每個單元都有基礎、進階和益智題。</p><div class="lessons">${books.map((b, i) => {
    const total = b.units.length * 3, done = b.units.reduce((n, U) => n + Object.keys(QUIZ_LV).filter(l => quizBest(`${b.id}-${U.u}-${l}`) !== undefined).length, 0);
    return `<button class="lesson" data-b="${i}"><span class="l-t"><b>${b.name}</b><small>${b.units.length} 個單元</small></span><em class="sem">${done} / ${total}</em></button>`;
  }).join('')}</div>`);
  document.querySelectorAll('[data-b]').forEach(x => x.onclick = () => viewQuizUnits(books[+x.dataset.b]));
}
function viewQuizUnits(b) {
  quizShell(b.name, viewQuizBooks, `<div class="q-units">${b.units.map((U, i) => `<div class="q-unit"><b>${nums(`${U.u}. ${U.title}`)}</b><small>${esc(U.sense)}</small><div class="q-lv">${Object.keys(QUIZ_LV).map(l => { const best = quizBest(`${b.id}-${U.u}-${l}`); return `<button data-u="${i}" data-l="${l}"><span>${QUIZ_LV[l][0]}</span><small>${best === undefined ? `${QUIZ_LV[l][1]} 題` : `最佳 ${best} 分`}</small></button>`; }).join('')}</div></div>`).join('')}</div>`);
  document.querySelectorAll('[data-u]').forEach(x => x.onclick = () => runQuiz(b, b.units[+x.dataset.u], x.dataset.l));
}
function runQuiz(b, U, lv, only) {
  const all = U[lv], list = only || all.map((_, i) => i), wrong = [];
  let i = 0, right = 0;
  const back = () => viewQuizUnits(b);
  function ask() {
    const q = all[list[i]];
    let tries = 0;
    quizShell(`${QUIZ_LV[lv][0]}`, back, `<div class="q-bar"><i style="width:${i / list.length * 100}%"></i></div><div class="trail">${nums(`第 ${i + 1} 題，共 ${list.length} 題`)}</div>
      <div class="prompt" id="prompt">${nums(esc(q.q))}</div>${q.pic ? `<div class="q-pic">${esc(q.pic)}</div>` : ''}<div class="msg" id="msg"></div><div class="actions" id="actions"></div>${q.t === 'num' ? `<div id="pad">${q.unit ? `<div class="trail">${esc(q.unit)}</div>` : ''}${keypadHtml()}</div>` : ''}`);
    const done = ok => {
      if (ok && tries === 0) { right++; S.stars += QUIZ_STAR; } else if (tries === 0 || !ok) wrong.push(list[i]);
      save();
      setMsg(`${ok ? (tries ? '對了。' : '答對了！') : '再看一次：'}${nums(esc(q.why))}`, ok ? 'good' : 'hint');
      if (ok && tries === 0) sfx.good(); else if (ok) sfx.ok();
      const pad = document.getElementById('pad'); if (pad) pad.style.display = 'none';
      document.getElementById('actions').innerHTML = `<button class="btn" id="qn">${i + 1 < list.length ? '下一題' : '看成績'}</button>`;
      document.getElementById('qn').onclick = () => { i++; if (i < list.length) ask(); else result(); };
      reveal('#actions');
    };
    const miss2 = text => { tries++; sfx.retry(); if (tries >= 2) return done(false); setMsg(text, 'hint'); };
    if (q.t === 'num') {
      bindKeypad((val, clear) => {
        if (val === q.a) return done(true);
        clear(); miss2(nums(`你按的 ${val} 不對，再想想。`));
      });
    } else {
      document.getElementById('actions').innerHTML = `<div class="choices col">${q.o.map((o, n) => `<button class="choice" data-c="${n}">${nums(esc(o))}</button>`).join('')}</div>`;
      document.querySelectorAll('[data-c]').forEach(c => c.onclick = () => {
        if (+c.dataset.c === q.a) return done(true);
        c.classList.add('no'); c.disabled = true; miss2('再想想，換一個答案。');
      });
    }
  }
  function result() {
    const score = Math.round(right / list.length * 100);
    if (!only) { S.quiz = S.quiz || {}; const k = `${b.id}-${U.u}-${lv}`; S.quiz[k] = Math.max(S.quiz[k] || 0, score); save(); }
    quizShell(`${QUIZ_LV[lv][0]}成績`, back, `<div class="end pop"><h2>${nums(`第一次就答對 ${right} / ${list.length} 題`)}</h2><p>${score === 100 ? '全部答對，太棒了！' : score >= 80 ? '很不錯，只差一點點。' : '沒關係，把錯的再做一次就會更熟。'}</p><div class="actions" id="ra"></div></div>`);
    document.getElementById('ra').innerHTML = `${wrong.length ? '<button class="btn" id="rw">再做一次錯的</button>' : ''}<button class="btn alt" id="rb">回單元</button>`;
    if (wrong.length) document.getElementById('rw').onclick = () => runQuiz(b, U, lv, wrong);
    document.getElementById('rb').onclick = back;
  }
  ask();
}
/* ---------- 首頁 ---------- */
let titleShown = false;
function viewTitle() {
  titleShown = true;
  const flies = Array.from({ length: 12 }, (_, i) => `<i style="left:${8 + (i * 37) % 86}%;top:${22 + (i * 53) % 62}%;animation-delay:${(i * .6) % 4}s"></i>`).join('');
  document.body.classList.add('in-cine');
  $app.innerHTML = `<div class="title" style="${bgStyle(S.bossDone ? 'finale' : 'sky_dark')}">
    ${S.bossDone ? '' : '<div class="drift d1"></div><div class="drift d2"></div>'}
    <div class="flies">${flies}</div>
    <div class="title-top"><p class="kicker">目標：月亮</p><h1 class="logo">數感飛船</h1></div>
    ${artImg('liang_cheer', 'title-hero')}
    <div class="title-bottom">
      <button class="btn big" id="start">${S.opened ? '繼續冒險' : '開始冒險'}</button>
      <p class="title-note">${S.opened ? `總工程師，飛船已經飛了 ${fmt(Math.min(S.stars, MOON))} 公里` : '飛船需要一位總工程師'}</p>
    </div></div>`;
  document.getElementById('start').onclick = () => {
    document.body.classList.remove('in-cine');
    beep([[523, 0], [784, .12]]);
    viewHome();
  };
}
function viewHome() {
  window.scrollTo(0, 0);
  if (!S.opened) { S.opened = true; save(); return comic(OPENING.bg, OPENING.lines, viewHome, { skip: true, last: '出發！' }); }
  if (S.bossDone && !S.s2Seen) { S.s2Seen = true; save(); return comic(SEASON2.bg, SEASON2.lines, viewHome); }
  const keys = availKeys();
  const saved = k => (S.prog[k] || 0) >= ROUNDS_TO_SAVE;
  const allSaved = PIECE_KEYS.every(saved), nSaved = keys.filter(saved).length, nPieces = PIECE_KEYS.filter(saved).length;
  const bossNow = allSaved && !S.bossDone;
  const nextKey = bossNow ? null : keys.find(k => !saved(k) && S.prog[k]) || keys.find(k => !saved(k));
  const line = S.bossDone && !nextKey ? '飛船升級完成，抵達月亮了！' : S.bossDone ? `太空升級，下一站：${STORY[nextKey].place}！` : bossNow ? '零件都到齊了，準備發射！' : nSaved === 0 && !S.prog[nextKey] ? `總工程師，先去${STORY[nextKey].place}！` : `下一站：${STORY[nextKey].place}，${STORY[nextKey].mission}！`;
  const ROW = 150, rows = keys.length + 1, pts = [];
  for (let i = 0; i < rows; i++) pts.push([i % 2 ? 70 : 30, ROW * i + 70]);
  const pathD = pts.map((q, i) => i === 0 ? `M${q[0]} ${q[1]}` : `C${pts[i - 1][0]} ${q[1] - 70} ${q[0]} ${pts[i - 1][1] + 70} ${q[0]} ${q[1]}`).join('');
  const stop = (k, i) => {
    const pr = Math.min(S.prog[k] || 0, ROUNDS_TO_SAVE), st = STORY[k], done = pr >= ROUNDS_TO_SAVE, now = k === nextKey && !done;
    const pips = Array.from({ length: ROUNDS_TO_SAVE }, (_, n) => `<i class="${n < pr ? 'on' : ''}"></i>`).join('');
    return `<button class="stop ${i % 2 ? 'right' : 'left'} ${done ? 'done' : ''} ${now ? 'now' : ''}" data-g="${k}" style="top:${ROW * i}px">
      <span class="medal" style="${bgStyle(st.bg)}"><span class="fog f${pr}"></span>${artImg(st.who, 'medal-who')}${done ? '<span class="badge">✓</span>' : ''}</span>
      <span class="plate"><b>${GAMES[k].name}</b><em class="sem">${GAMES[k].sem}</em><span class="lvl">${pips}</span></span>
      ${now ? artImg('liang', 'guide') : ''}
    </button>`;
  };
  $app.innerHTML = `
    <div class="map-bg"><div class="m1" style="${bgStyle('sky_dark')}"></div><div class="m2" style="${bgStyle('sky_bright')};opacity:${S.bossDone ? 1 : nSaved / keys.length * .85}"></div><div class="shade"></div></div>
    <header class="map-head">
      <div class="map-title"><h1 class="logo small">數感飛船</h1><div class="star-count">🚀 ${N(fmt(Math.min(S.stars, MOON)))}<small>／${fmt(MOON)} 公里</small></div></div>
      <div class="hero-say">${artImg(S.bossDone ? 'liang_cheer' : 'liang', 'hero-liang')}<span>${line}</span></div>
    </header>
    <button class="lesson-entry" id="lessons"><span>🛣️📐🟩🎲⏰</span><b>單位教室</b><small>${Object.keys(S.learned || {}).length} / 5</small></button>
    <button class="quiz-entry" id="quiz"><span>📝</span><b>單元測驗</b><small>基礎・進階・益智</small></button>
    <div class="map-trail" style="height:${ROW * rows + 8}px">
      <svg viewBox="0 0 100 ${ROW * rows}" preserveAspectRatio="none" aria-hidden="true"><path d="${pathD}" fill="none" stroke="#fff6e3" stroke-width="5" stroke-dasharray="3 11" stroke-linecap="round" vector-effect="non-scaling-stroke" opacity=".9"/></svg>
      ${keys.map(stop).join('')}
      <button class="stop ${keys.length % 2 ? 'right' : 'left'} cave ${allSaved && !S.bossDone ? 'now' : ''}" data-g="boss" ${allSaved ? '' : 'disabled'} style="top:${ROW * keys.length}px">
        <span class="medal" style="${bgStyle(BOSS.bg)}"><span class="fog ${S.bossDone ? 'f3' : allSaved ? 'f1' : 'f0'}"></span>${allSaved ? artImg(S.bossDone ? 'mimi_happy' : 'mimi', 'medal-who') : '<span class="lock">？</span>'}</span>
        <span class="plate"><b>${S.bossDone ? '再發射一次' : '發射飛船'}</b><small>${allSaved ? (S.bossDone ? '再檢查一次' : '最後檢查') : `先集滿四上零件（${nPieces}/10）`}</small></span>
      </button>
    </div>
    <nav class="dock">
      <button id="daily" class="${S.stamps[today()] ? 'stamped' : 'hot'}"><b>${S.stamps[today()] ? '✔' : '★'}</b>今日任務<small>${Object.keys(S.stamps).length} 個章</small></button>
      <button id="clues"><b>🔧</b>飛船零件<small>${nSaved} / ${keys.length}</small></button>
      <button id="practice"><b>✏️</b>練習場<small>自己選</small></button>
    </nav>`;
  document.querySelectorAll('[data-g]').forEach(b => b.onclick = () => enter(b.dataset.g));
  document.getElementById('daily').onclick = () => startRound('daily');
  document.getElementById('practice').onclick = viewPractice;
  document.getElementById('quiz').onclick = viewQuizBooks;
  document.getElementById('clues').onclick = viewClues;
  document.getElementById('lessons').onclick = viewLessons;
}

/* ---------- 家長頁 ---------- */
function summarize(g) {
  const L = S.log.filter(x => x.g === g), last = L.slice(-30);
  if (!last.length) return { n: 0, rate: '—', note: '還沒玩' };
  const first = last.filter(x => x.gr === 2).length, none = last.filter(x => x.gr === 0).length;
  let note = `最近 ${last.length} 題：第一次就對 ${first} 題，沒答出來 ${none} 題`;
  if (g === 'line') { const ds = last.filter(x => x.d && x.d.dist !== undefined).map(x => x.d.dist); if (ds.length) note += `；平均差全長的 ${Math.round(ds.reduce((a, b) => a + b, 0) / ds.length)}%`; }
  if (g === 'frog') { const ex = last.filter(x => x.d && x.d.extra !== undefined); if (ex.length) { note += `；${ex.filter(x => x.d.extra === 0).length}/${ex.length} 題跳到最少`; } }
  return { n: L.length, note };
}
function recentMisses() {
  return S.log.filter(x => x.gr === 0 && x.d && typeof x.d === 'object').slice(-8).reverse().map(x => {
    const d = x.d, n = GAMES[x.g].name;
    if (d.text) return `${n}：${d.text}，答 ${d.wrong}，正解 ${d.ans}`;
    if (d.l) return `${n}：${d.l} 和 ${d.r}`;
    if (d.a) return `${n}：每排 ${d.a} 顆、${d.b} 排（${{ count: '數全部', more: '多一排', less: '少一排', split: '切開', pack: '分裝', share: '平分' }[d.m]}），答 ${d.wrong}，正解 ${d.ans}`;
    if (d.dist !== undefined) return `${n}：差全長 ${d.dist}%`;
    if (d.ans !== undefined) return `${n}：答 ${d.wrong}，正解 ${d.ans}`;
    return n;
  });
}
function viewParent() {
  const rows = Object.entries(GAMES).map(([k, g]) => { const s = summarize(k); return `<tr><td>${g.name}</td><td>${Math.min(rec(k).lv, Logic.maxLevel(k, S.unit)) + 1} / ${Logic.maxLevel(k, S.unit) + 1}</td><td>${s.note}</td></tr>`; }).join('');
  const miss = recentMisses();
  $app.innerHTML = `<div class="parent">
    <h1>家長頁</h1>
    <h2>單元</h2><p>四上、四下所有單元都已開放，孩子可以自由選工坊。每個工坊和每一題都有標示是四上或四下。</p>
    <h2>各遊戲狀況</h2>
    <table><tr><th>遊戲</th><th>等級</th><th>紀錄</th></tr>${rows}</table>
    <h2>最近沒答出來的題目</h2>
    ${miss.length ? `<ul>${miss.map(m => `<li>${esc(m)}</li>`).join('')}</ul>` : '<p>目前沒有。</p>'}
    <h2>設定</h2>
    <p><label><input type="checkbox" id="snd" ${S.sound ? 'checked' : ''}> 音效</label></p>
    <button class="link" id="reset">清除這台裝置的紀錄</button><br>
    <button class="link" id="out">回地圖</button>
    <p class="note" style="font-size:14px">紀錄只存在這台裝置的瀏覽器，不會傳到網路。題目皆為自編，非課本內容。</p>
  </div>`;
  document.getElementById('snd').onchange = e => { S.sound = e.target.checked; save(); };
  document.getElementById('reset').onclick = () => {
    if (confirm('確定清除所有星星和紀錄？')) { S.stars = 0; S.rec = {}; S.log = []; S.prog = {}; S.opened = false; S.bossDone = false; S.bossSeen = false; S.s2Seen = false; S.stamps = {}; S.fast = {}; S.quiz = {}; S.seenCpt = {}; S.learned = {}; save(); viewParent(); }
  };
  document.getElementById('out').onclick = () => go('');
}

/* ---------- 路由 ---------- */
function go(h) { if (location.hash.slice(1) === h) route(); else location.hash = h; }
function route() {
  window.onpointerup = null;
  document.body.classList.remove('in-cine');
  if (location.hash === '#parent') viewParent(); else if (!titleShown) viewTitle(); else viewHome();
}
window.addEventListener('hashchange', route);
// 有新版就自動載入；進度存在瀏覽器裡，不受影響。正在答題時不打斷，下次切回來再檢查
async function checkUpdate() {
  if (!window.APP_V || R) return;
  try {
    const r = await fetch('version.txt?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return;
    const latest = (await r.text()).trim();
    if (!/^\d+$/.test(latest) || latest === window.APP_V || R) return;
    if (sessionStorage.getItem('shugan4-updated-to') === latest) return; // 避免快取沒更新時一直重載
    sessionStorage.setItem('shugan4-updated-to', latest);
    location.replace(location.pathname + '?v=' + latest + location.hash);
  } catch (e) {}
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(); });
checkUpdate();
preloadArt().then(route);
