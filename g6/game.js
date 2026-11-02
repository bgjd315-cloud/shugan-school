const ZY_CHAR = {}, ZY_PHRASE = []; // 六年級不加注音
// 數感小鎮：畫面與互動
const $app = document.getElementById('app');
const ROUND = 6;
const GAMES = {
  prime: { name: '零件拆解室', tip: '質因數分解和短除法', sem: '六上', need: 0 },
  fdiv: { name: '能量分裝站', tip: '分數的除法', sem: '六上', need: 0 },
  ddiv: { name: '精密裁切台', tip: '小數的除法', sem: '六上', need: 0 },
  circle: { name: '圓環艙', tip: '圓周長和圓面積', sem: '六上', need: 0 },
  ratio: { name: '調色配方室', tip: '比和比值', sem: '六上', need: 0 },
  sector: { name: '太陽能板廠', tip: '扇形', sem: '六上', need: 0 },
  speed: { name: '飛行跑道', tip: '速率', sem: '六上', need: 0 },
  relation: { name: '數據中心', tip: '數量關係', sem: '六上', need: 0 },
  mix: { name: '物資調度台', tip: '四則混合運算', sem: '六下', need: 0 },
  prism: { name: '燃料槽工廠', tip: '柱體', sem: '六下', need: 0 },
  base: { name: '補給比較室', tip: '基準量和比較量', sem: '六下', need: 0 },
  scale: { name: '星圖繪製室', tip: '放大、縮小、比例尺', sem: '六下', need: 0 },
  puzzle: { name: '任務解謎室', tip: '怎樣解題', sem: '六下', need: 0 },
  pie: { name: '民意觀測站', tip: '圓形圖・可能性（延伸）', sem: '六下', need: 0 },
};
const availKeys = () => Object.keys(GAMES);
const ROUNDS_TO_SAVE = 3; // 每個地方玩幾回合就把居民救回來
const BOSS_ORDER = ['prime', 'fdiv', 'ddiv', 'circle', 'ratio', 'speed'];
const ART = ['liang', 'liang_cheer', 'liang_think', 'mimi', 'mimi_happy', 'wanwan', 'piece', 'chest', 'sky_dark', 'sky_bright', 'finale', 'seal', 'turtle', 'octopus', 'crab', 'goat', 'otter', 'bee', 'rabbit', 'fox', 'sheep', 'pelican', 'raccoon', 'isl_prime', 'isl_fdiv', 'isl_ddiv', 'isl_circle', 'isl_ratio', 'isl_sector', 'isl_speed', 'isl_relation', 'isl_mix', 'isl_prism', 'isl_base', 'isl_scale', 'isl_puzzle', 'isl_pie'];
const HAS = {}; // 圖還沒收齊時，畫面照樣能玩
const artUrl = n => `assets/${n}.webp`;
const artImg = (n, cls) => HAS[n] ? `<img class="${cls || ''}" src="${artUrl(n)}" alt="">` : '';
const bgStyle = n => HAS[n] ? `background-image:url(${artUrl(n)})` : '';
function preloadArt() {
  return Promise.all(ART.map(n => new Promise(ok => { const i = new Image(); i.onload = () => { HAS[n] = true; ok(); }; i.onerror = () => ok(); i.src = artUrl(n); })));
}

/* ---------- 存檔 ---------- */
const SAVE_KEY = 'shugan6-v1';
const ROUTE = 1000000; // 目標航線 100 萬公里
function load() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) return s; } catch (e) {}
  return null;
}
const PIECE_KEYS = ['prime', 'fdiv', 'ddiv', 'circle', 'ratio', 'sector', 'speed', 'relation']; // 六上八區蓋好才能啟用太空站
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
    const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, '').replace(/×/g, '乘以').replace(/＋/g, '加').replace(/－/g, '減').replace(/÷/g, '除以').replace(/(\d+)\/(\d+)/g, '$2分之$1').replace(/(\d)：(\d)/g, '$1比$2').replace(/□/g, '多少'));
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
const plainText = el => { const c = el.cloneNode(true); c.querySelectorAll('.bp').forEach(b => b.remove()); c.querySelectorAll('.frac').forEach(f => { const [a, n] = [...f.querySelectorAll('i')].map(i => i.textContent); f.replaceWith(`${a}/${n}`); }); return c.textContent; };

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
  conceptThen(q, () => VIEWS[R.game](q)); // 第一次遇到新概念先看小故事
}
// 一題結束：grade 2 第一次就很棒、1 第二次或差一點、0 沒答出來
const reveal = sel => setTimeout(() => { const e = document.querySelector(sel); if (e) e.scrollIntoView({ block: 'nearest' }); }, 40); // 等注音排好才捲動，字變高才不會又把按鈕擠出去
function finish(grade, detail, msgHtml) {
  const r = rec(R.game);
  if (R.fixedLv === undefined) Logic.adjust(r, grade, Logic.maxLevel(R.game, S.unit)); // 練習場不動等級
  if (R.q) { const fk = R.q.kind + ':' + R.q.mode; S.fast[fk] = grade === 2 ? (S.fast[fk] || 0) + 1 : 0; } // 熟練紀錄
  R.grades.push(grade); R.earned += grade * 1000; S.stars += grade * 1000;
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
function semOf(q) { // 每題標六上或六下；可能性不在南一目錄（均一類南一版 113 學年），標延伸
  return q ? GAMES[q.kind].sem + (q.kind === 'pie' && q.mode === 'likely' ? '・延伸' : '') : '';
}
function frame(promptHtml, stageHtml, extra) {
  const dots = Array.from({ length: ROUND }, (_, i) => `<i class="${i < R.grades.length ? 'g' + R.grades[i] : i === R.i ? 'now' : ''}"></i>`).join('');
  $app.innerHTML = `
    <div class="top">
      <button class="icon-btn" id="home" aria-label="回地圖">⌂</button>
      <div class="dots">${dots}</div><span class="sem">${semOf(R.q)}</span>
      <button class="icon-btn" id="cst" aria-label="看小故事" hidden>📖</button><button class="icon-btn" id="say" aria-label="唸題目">🔊</button>
    </div>
    <div class="say-row">${artImg(R.boss ? 'mimi' : R.daily ? 'liang' : STORY[R.game].who, 'say-who')}<div class="prompt" id="prompt">${promptHtml}</div></div>
    <div class="stage" id="stage">${stageHtml}</div>
    <div class="msg" id="msg"></div>
    ${extra || ''}
    <div class="actions" id="actions"></div>`;
  document.getElementById('home').onclick = () => { R = null; go(''); };
  document.getElementById('say').onclick = () => speak(plainText(document.getElementById('prompt')));
  bindConceptBtn(R.q);
}
function endRound() {
  const ch = R.chapter, boss = R.boss;
  let beat = null;
  if (R.daily) S.stamps[today()] = 1;
  if (boss) { if (!S.bossDone) { S.bossDone = true; S.stars = Math.max(S.stars, ROUTE / 2); beat = 'ending'; } }
  else if (STORY[ch] && R.fixedLv === undefined) {
    const before = S.prog[ch] || 0;
    if (before < ROUNDS_TO_SAVE) { S.prog[ch] = before + 1; beat = STORY[ch].beats[before + 1]; }
  }
  save();
  const praise = boss ? '太空站啟用了！' : R.daily ? '今天的任務完成了，蓋一個章！' : R.fixedLv !== undefined ? '多練一次，就更有感覺。' : '這一區又完成一部分。';
  $app.innerHTML = `<div class="end pop">
    ${artImg('liang_cheer', 'end-hero')}
    <h2>航線多了 ${N(fmt(R.earned))} 公里</h2>
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
    <h2>完成了！</h2><p><b>${c.name}</b><br>${c.text}</p>
    <div class="actions"><button class="btn" id="ok">記進站區航線</button></div></div>`;
  document.getElementById('ok').onclick = () => go('');
}
function viewClues() {
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="home" aria-label="回地圖">⌂</button><h2 class="page-h">站區航線</h2></div>
    <p class="tag">六上八區蓋太空站，六下六段開航線。</p>
    <div class="clues">${availKeys().map(k => {
      const has = (S.prog[k] || 0) >= ROUNDS_TO_SAVE, c = STORY[k].clue;
      return `<div class="clue ${has ? '' : 'off'}">${has ? artImg('piece', 'clue-img') : '<div class="clue-q">？</div>'}<div><b>${has ? c.name : '還沒完成'}</b><small>${has ? c.text : `幫${STORY[k].whoName}的忙就會完成`}</small></div></div>`;
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
  return [["prime", 0, "排地磚：質數和合數", 1], ["prime", 1, "拆零件：質因數分解", 1], ["prime", 2, "2、5 的倍數", 1], ["prime", 3, "3 的倍數", 1], ["prime", 4, "短除法：最大公因數", 1], ["prime", 5, "短除法：最小公倍數", 1], ["prime", 6, "最簡分數", 1], ["prime", 7, "互質", 1], ["fdiv", 0, "整數除以幾分之一", 1], ["fdiv", 1, "整數除以分數", 1], ["fdiv", 2, "同分母相除", 1], ["fdiv", 3, "切細再相除", 1], ["fdiv", 4, "商是分數", 1], ["fdiv", 5, "乘以倒數", 1], ["fdiv", 6, "除完變大還是變小", 1], ["ddiv", 0, "剪緞帶：整數除以小數", 1], ["ddiv", 1, "小數點一起移", 1], ["ddiv", 2, "百格板：兩位小數", 1], ["ddiv", 3, "小數除法直式", 1], ["ddiv", 4, "商一定比較小嗎", 1], ["circle", 0, "滾一圈：圓周率", 1], ["circle", 1, "圓周長", 1], ["circle", 2, "滾幾圈", 1], ["circle", 3, "切拼：圓面積", 1], ["circle", 4, "半圓的周長", 1], ["circle", 5, "圓環", 1], ["ratio", 0, "一份一份加：比", 1], ["ratio", 1, "比值", 1], ["ratio", 2, "相等的比", 1], ["ratio", 3, "橫著的倍數", 1], ["ratio", 4, "最簡單整數比", 1], ["ratio", 5, "分數比、小數比", 1], ["ratio", 6, "按比分配", 1], ["ratio", 7, "濃度一樣嗎", 1], ["sector", 0, "幾分之幾圓", 1], ["sector", 1, "弧長", 1], ["sector", 2, "扇形面積", 1], ["sector", 3, "扇形周長", 1], ["sector", 4, "三個相等的比", 1], ["sector", 5, "生活中的扇形", 1], ["speed", 0, "時間一樣比距離", 1], ["speed", 1, "距離一樣比時間", 1], ["speed", 2, "求速率", 1], ["speed", 3, "距離和時間", 1], ["speed", 4, "時間幾倍距離幾倍", 1], ["speed", 5, "換單位", 1], ["speed", 6, "平均速率", 1], ["relation", 0, "和不變", 1], ["relation", 1, "差不變", 1], ["relation", 2, "每份量×份數", 1], ["relation", 3, "排列的規律", 1], ["relation", 4, "把關係寫成式子", 1], ["relation", 5, "天平：等量", 1], ["mix", 0, "先算哪一段", 11], ["mix", 1, "分數小數互通", 11], ["mix", 2, "乘除一起約分", 11], ["mix", 3, "兩步驟應用", 11], ["mix", 4, "用概數判斷", 11], ["mix", 5, "分配律", 11], ["prism", 0, "一層層疊", 11], ["prism", 1, "三角柱", 11], ["prism", 2, "圓柱", 11], ["prism", 3, "攤開圓柱", 11], ["prism", 4, "表面積", 11], ["prism", 5, "兩個形體", 11], ["base", 0, "誰當 1", 11], ["base", 1, "交換基準", 11], ["base", 2, "求比較量", 11], ["base", 3, "求基準量", 11], ["base", 4, "增加、減少", 11], ["scale", 0, "放大圖", 11], ["scale", 1, "什麼不變", 11], ["scale", 2, "真的放大嗎", 11], ["scale", 3, "縮圖", 11], ["scale", 4, "用尺量地圖", 11], ["scale", 5, "讀比例尺", 11], ["scale", 6, "分母越大圖越小", 11], ["scale", 7, "兩張地圖", 11], ["puzzle", 0, "雞兔同籠", 11], ["puzzle", 1, "和差問題", 11], ["puzzle", 2, "年齡問題", 11], ["puzzle", 3, "追趕問題", 11], ["puzzle", 4, "流水問題", 11], ["puzzle", 5, "搭配幾種", 11], ["puzzle", 6, "排奇數", 11], ["puzzle", 7, "二選一幾種", 11], ["pie", 0, "讀圓形圖", 11], ["pie", 1, "畫圓形圖", 11], ["pie", 2, "換成百分率", 11], ["pie", 3, "選哪種圖", 11], ["pie", 4, "可能性（延伸）", 11]];
}
function viewPractice() {
  const groups = availKeys().map(k => {
    const ts = practiceTopics().filter(t => t[0] === k);
    return ts.length ? `<h3 class="pg-h">${GAMES[k].name}<span class="sem">${GAMES[k].sem}</span></h3><div class="pg">${ts.map(t => `<button class="pg-btn" data-g="${t[0]}" data-l="${t[1]}"><span class="sem">${t[3] >= 11 ? '六下' : '六上'}</span>${nums(t[2])}</button>`).join('')}</div>` : '';
  }).join('');
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="home" aria-label="回地圖">⌂</button><h2 class="page-h">練習場</h2></div><p class="tag">想多練哪一個？</p><button class="lesson-entry" id="cstories"><span>📖</span><b>新概念小故事</b><small>重看</small></button><h3 class="pg-h">單位的量感</h3><div class="pg">${Object.entries(LESSONS).map(([k, L]) => `<button class="pg-btn" data-ud="${k}"><span class="sem">${L.sem}</span>${L.title}</button>`).join("")}</div>${groups}`;
  document.getElementById('home').onclick = () => go('');
  document.getElementById('cstories').onclick = viewConcepts;
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
    ${[6, 7, 8, 9, 0].map(d => `<button class="num" data-k="${d}">${d}</button>`).join('')}<button class="go" data-k="ok" aria-label="確定">✓</button><button class="dot5" data-k="." hidden>小數點 ．</button></div>`;
}
function bindKeypad(onOk) {
  let val = '';
  const show = () => { document.getElementById('entry').innerHTML = val || '<span class="blank">？</span>'; };
  document.querySelectorAll('.keypad button').forEach(b => {
    b.onclick = () => {
      const k = b.dataset.k;
      if (k === 'del') val = val.slice(0, -1);
      else if (k === '.') { if (!val.includes('.')) val = (val || '0') + '.'; } else if (k === 'ok') { if (val && !val.endsWith('.')) onOk(+val, () => { val = ''; show(); }); else { setMsg('先按數字，再按打勾。', 'hint'); sfx.retry(); } return; }
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
  if (opts && opts.dot) document.querySelectorAll('.dot5').forEach(b => { b.hidden = false; });
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
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dec6 = x => +(+x).toFixed(4);
const askDiv = '<div class="trail ask" id="ask"></div>';
const D2 = { dot: true };
function actionBtn(id, text, cls) {
  document.getElementById('actions').innerHTML = `<button class="btn ${cls || ''}" id="${id}">${text}</button>`;
  return document.getElementById(id);
}
function showKeypad() { document.querySelectorAll('.pad-wrap').forEach(x => { x.hidden = false; }); reveal('.pad-wrap'); }
const padHidden = () => `<div class="pad-wrap" hidden>${askDiv}${keypadHtml()}</div>`;
const padLate = () => `<div class="pad-late" hidden>${askDiv}${keypadHtml()}</div>`; // 先選再算
function showLate(fn) { document.getElementById('actions').innerHTML = ''; document.querySelectorAll('.pad-late').forEach(x => { x.hidden = false; }); reveal('.pad-late'); fn(); }
function afterAct(fn) { document.getElementById('actions').innerHTML = ''; showKeypad(); fn(); }
function holdPad() { document.querySelectorAll('.pad-wrap').forEach(x => { x.hidden = true; }); } // 第一段操作完，第二段操作前先收起鍵盤
function dragOn(wrap, cb, sel) { // 手指在圖上拖：回傳在圖形裡的相對位置 0～1
  wrap.classList.add('drag-prot');
  const read = e => { const g = (sel ? wrap.querySelector(sel) : wrap.querySelector('svg')) || wrap, b = g.getBoundingClientRect(); cb((e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height, e); };
  let on = false;
  wrap.onpointerdown = e => { on = true; try { wrap.setPointerCapture(e.pointerId); } catch (x) {} read(e); e.preventDefault(); };
  wrap.onpointermove = e => { if (on) read(e); };
  wrap.onpointerup = wrap.onpointercancel = () => { on = false; };
}
function gate(q, label, n, onStep, ask, drag) { // 動手 n 次才能作答；熟練後直接跳到作答。drag：{ el, map } 用拖的；按鈕是備用
  const lab = k => Array.isArray(label) ? label[k] : label;
  if (isFast(q) || n <= 0) { for (let k = 1; k <= n; k++) onStep(k); return afterAct(ask); }
  let k = 0, over = false;
  const end = () => { over = true; if (drag) drag.el.onpointerdown = drag.el.onpointermove = null; afterAct(ask); };
  const paint = () => { actionBtn('gt', lab(k)).onclick = () => { k++; sfx.hop(); onStep(k); if (k === n) end(); else paint(); }; };
  paint();
  if (drag) dragOn(drag.el, (x, y) => {
    if (over) return;
    if (Math.round(drag.map(x, y)) <= k) return; // 只往前，一次一步，點尾端不會一次跳完
    k++; sfx.hop(); onStep(k); if (k === n) end(); else paint();
  }, drag.sel);
}
const setEl = (id, html) => { document.getElementById(id).innerHTML = html; };
const sliderHtml6 = (pct, ticks) => { let t = ''; if (ticks) for (let i = 0; i <= ticks; i++) t += `<line x1="${14 + 292 * i / ticks}" x2="${14 + 292 * i / ticks}" y1="9" y2="29" stroke="#aab3c2" stroke-width="1.5"/>`; return `<svg viewBox="0 0 320 38">${t}<line x1="14" x2="306" y1="19" y2="19" stroke="#c9d1dd" stroke-width="8" stroke-linecap="round"/><circle cx="${14 + 292 * pct}" cy="19" r="15" fill="#ffd65a" stroke="#2f5f9e" stroke-width="3"/></svg>`; };
// 拖黃鈕探索：target 拖到定位就往下；need 看過幾個不同的值才能往下。左右按鈕是備用
function explore(q, o) {
  const el = document.getElementById(o.id), lo = o.lo, hi = o.hi, step = o.step || 1, N = Math.round((hi - lo) / step);
  let v = o.start === undefined ? lo : o.start, over = false; const seen = new Set([v]);
  const paint = () => { const k = el.querySelector('.sl6'); if (k) k.innerHTML = sliderHtml6((v - lo) / (hi - lo), N <= 24 ? N : 0); o.draw(v); };
  const end = () => { if (over) return; over = true; el.innerHTML = ''; sfx.ok(); afterAct(o.ask); }; // 拖完收起滑桿，畫面才放得下鍵盤
  if (isFast(q)) { o.draw(o.target !== undefined ? o.target : o.show !== undefined ? o.show : hi); el.innerHTML = ''; return afterAct(o.ask); }
  el.innerHTML = `<div class="sl6"></div><div class="odo two"><button class="turn s6b s6l" aria-label="往左">◀</button><button class="turn s6b s6r" aria-label="往右">▶</button></div>`;
  const set = x => {
    const nv = dec6(clamp(lo + Math.round((x - lo) / step) * step, lo, hi));
    if (nv === v || over) return; v = nv; seen.add(v); sfx.hop(); paint();
    if (o.target !== undefined && v === o.target) return end();
    if (o.need && seen.size >= o.need && !document.getElementById('gt')) actionBtn('gt', o.label || '看好了').onclick = end;
  };
  el.querySelector('.s6l').onclick = () => set(v - step);
  el.querySelector('.s6r').onclick = () => set(v + step);
  dragOn(el.querySelector('.sl6'), x => set(lo + clamp((x * 320 - 14) / 292, 0, 1) * (hi - lo)));
  paint();
}
// 必須點到對的才前進：items [{ t, ok, bad }]
function ops(q, el, items, onOk) {
  const box = document.getElementById(el);
  box.innerHTML = `<div class="op6s">${items.map((it, i) => `<button class="op6" data-i6="${i}" data-ok="${it.ok ? 1 : 0}">${nums(it.t)}</button>`).join('')}</div>`;
  box.querySelectorAll('.op6').forEach(b => b.onclick = () => {
    const it = items[+b.dataset.i6];
    if (it.ok) { sfx.hop(); setMsg(''); onOk(it); return; }
    sfx.retry(); b.disabled = true; setMsg(nums(it.bad || '再想想看。'), 'hint');
  });
}
// 點 n 個（每個點一次）才能往下
function tapN(q, sel, n, onTap, ask) {
  const all = [...document.querySelectorAll(sel)];
  if (isFast(q)) { all.slice(0, n).forEach((e, i) => { e.classList.add('on'); onTap(e, i + 1); }); return afterAct(ask); }
  let k = 0;
  all.forEach(e => { e.classList.add('tap6'); e.onclick = () => { if (e.classList.contains('on') || k >= n) return; e.classList.add('on'); k++; sfx.hop(); onTap(e, k); if (k === n) afterAct(ask); }; });
}
// 拖字卡進格子；也可以先點字卡再點格子
function dragTok(root, onDrop) {
  let sel = null;
  const clear = () => { root.querySelectorAll('.tok.sel').forEach(x => x.classList.remove('sel')); sel = null; };
  root.querySelectorAll('.tok').forEach(t => {
    t.onpointerdown = e => {
      e.preventDefault(); const sx = e.clientX, sy = e.clientY; let moved = false;
      try { t.setPointerCapture(e.pointerId); } catch (x) {}
      t.onpointermove = ev => { const dx = ev.clientX - sx, dy = ev.clientY - sy; if (Math.abs(dx) + Math.abs(dy) > 6) moved = true; t.style.transform = `translate(${dx}px,${dy}px)`; };
      t.onpointerup = ev => {
        t.onpointermove = t.onpointerup = null; t.style.transform = '';
        if (moved) { t.style.visibility = 'hidden'; const hit = document.elementFromPoint(ev.clientX, ev.clientY), b = hit && hit.closest('.bin'); t.style.visibility = ''; clear(); if (b) onDrop(t, b); return; }
        const was = sel === t; clear(); if (!was) { sel = t; t.classList.add('sel'); }
      };
    };
  });
  root.querySelectorAll('.bin').forEach(b => { b.onclick = () => { if (sel) { const t = sel; clear(); onDrop(t, b); } }; });
}
// 選項：對了就 finish；有 then 就接下一步（先選再算）
function pick6(opts, right, why, ok, detail, then) {
  document.getElementById('actions').innerHTML = `<div class="choices col">${opts.map((h, i) => `<button class="choice" data-i="${i}">${nums(h)}</button>`).join('')}</div>`;
  const pass = () => { if (then) { setMsg(nums(ok), 'good'); sfx.ok(); showLate(then); } else finish(graded(), detail, nums(ok)); };
  document.querySelectorAll('[data-i]').forEach(b => {
    b.onclick = () => {
      if (+b.dataset.i === right) return pass();
      R.tries++; b.classList.add('no'); b.disabled = true; sfx.retry();
      if (R.tries >= 2) { document.querySelectorAll('[data-i]').forEach(x => { x.disabled = true; }); if (then) { setMsg(nums(`答案是「${opts[right]}」。${ok}`), 'hint'); return showLate(then); } return finish(0, { wrong: b.textContent.slice(0, 12), ans: right }, nums(ok)); }
      setMsg(nums(why), 'hint');
    };
  });
}
const fracHtml = (a, n) => `<span class="frac num"><i>${a}</i><i>${n}</i></span>`;
const barRow = (n, a, c) => `<div class="drow5" style="grid-template-columns:repeat(${n},1fr)">${Array.from({ length: n }, (_, i) => `<i style="${i < a ? `background:${typeof c === 'function' ? c(i) : c || '#ffd65a'}` : ''}"></i>`).join('')}</div>`;
const groupCol = b => i => Math.floor(i / b) % 2 ? '#f0a03c' : '#6ea8dc';
function ladderHtml(rows, x, y) { // 短除法的樣子：rows [[p, a, b], ...]
  return `<table class="ladder"><tbody>${rows.map(r => `<tr><th class="num">${r[0]}</th><td class="num">${r[1]}</td><td class="num">${r[2]}</td></tr>`).join('')}<tr class="last"><th></th><td class="num">${x}</td><td class="num">${y}</td></tr></tbody></table>`;
}
function runLadder(q, A, B, boxId, opId, ask, say) { // 點質數往下除，直到沒有共同的質數（短除法）
  const rows = []; let x = A, y = B;
  const draw = () => setEl(boxId, ladderHtml(rows, x, y));
  const good = p => { rows.push([p, x, y]); x /= p; y /= p; draw(); };
  if (isFast(q)) { let p = 2; while (p <= Math.min(x, y)) { if (x % p === 0 && y % p === 0) good(p); else p++; } if (say) say(x, y); return afterAct(ask); }
  const PR = [2, 3, 5, 7, 11, 13, 17, 19].filter(p => p <= 7 || A % p === 0 || B % p === 0);
  const paint = () => {
    const none = Logic.gcd(x, y) === 1;
    ops(q, opId, PR.map(p => ({ t: String(p), ok: !none && x % p === 0 && y % p === 0, p, bad: x % p ? `${x} 不能被 ${p} 整除，剩 ${x % p}。` : y % p ? `${y} 不能被 ${p} 整除，剩 ${y % p}。` : `${x}、${y} 已經沒有共同的質數了。` })).concat([{ t: '沒有共同的了', ok: none, end: 1, bad: `還沒。${x}、${y} 還可以一起分。` }]), it => {
      if (it.end) { setEl(opId, ''); return afterAct(ask); }
      good(it.p); paint();
    });
    if (say) say(x, y);
  };
  draw(); paint();
}
/* ---------- 一：零件拆解室 ---------- */
function tilesSvg6(n, w) { // 每排 w 個；排不滿的那排是紅的
  const rows = Math.ceil(n / w), full = Math.floor(n / w), u = Math.min(300 / w, 150 / rows, 34);
  let s = `<svg class="g5" style="max-height:170px" viewBox="-2 -2 ${w * u + 4} ${rows * u + 4}">`;
  for (let i = 0; i < n; i++) { const x = i % w, y = Math.floor(i / w), left = y >= full; s += `<rect x="${x * u + 1}" y="${y * u + 1}" width="${u - 2}" height="${u - 2}" rx="3" fill="${left ? '#f4a9a0' : '#a9d0f0'}" stroke="#33405a"/>`; }
  return s + '</svg>';
}
const partsHtml = (arr, rest) => `<div class="parts6">${arr.map(p => `<b class="chip6 num">${p}</b>`).join('<span>×</span>')}${rest > 1 ? `${arr.length ? '<span>×</span>' : ''}<b class="chip6 big num">${rest}</b>` : ''}</div>`;
function viewPrime(q) {
  if (q.mode === 'tile') {
    const { un } = q.thing;
    frame(`${q.n} ${un}${q.ctx}要排成長方形，<br>每排超過 1 ${un}，不能剩。拖黃鈕試試。`, `<div id="ti"></div><div class="trail" id="ct"></div><div id="sl"></div>`);
    const ok = q.isP ? `對了！${q.n} 怎麼排都有剩，只能排 1×${q.n} 一長條。它的因數只有 1 和自己，這種數叫質數。` : `對了！${q.n} 排得成長方形，除了 1 和自己還有別的因數，這種數叫合數。`;
    return explore(q, { id: 'sl', lo: 2, hi: q.n - 1, need: Math.min(3, q.n - 2), label: '試好了', show: 2, draw: w => { setEl('ti', tilesSvg6(q.n, w)); setEl('ct', q.n % w ? `每排 ${w} ${un}，紅色剩 ${q.n % w} ${un}` : `每排 ${w} ${un}，${q.n / w} 排，剛剛好！`); }, ask: () => pick6(['排得成長方形', '只能排一長條'], q.isP ? 1 : 0, '再想想：有沒有哪種每排幾個，是剛好的？', ok, 'tile') });
  }
  if (q.mode === 'tree') {
    frame(`${q.ctx}的 ${q.n} 號零件組，要拆到不能再拆。<br>點一個數，看能不能剛好拆下來。`, `<div id="pp"></div><div class="trail" id="ct"></div><div id="oo"></div>`);
    let got = [], rest = q.n;
    const ask = () => pick6(q.options.map(o => `${q.n}＝${o}`), q.options.indexOf(q.right), '每個零件都要是質數才算拆完：除了 1 和自己，沒有別的因數。', `對了！${q.n}＝${q.right}，每個都是質數，再也拆不開。這就是質因數分解。`, 'tree');
    const draw = () => setEl('pp', partsHtml(got, rest));
    draw();
    if (isFast(q)) { got = q.pf.slice(); rest = 1; draw(); return afterAct(ask); }
    const paint = () => ops(q, 'oo', [2, 3, 5, 7, 11, 13, 17, 19].map(p => ({ t: String(p), p, ok: rest % p === 0, bad: `${rest} 不能被 ${p} 整除，會剩 ${rest % p}。` })), it => { got.push(it.p); got.sort((a, b) => a - b); rest /= it.p; draw(); setEl('ct', rest > 1 ? `還剩 ${rest} 沒拆完` : '都拆完了！'); if (rest === 1) { setEl('oo', ''); afterAct(ask); } else paint(); });
    return paint();
  }
  if (q.mode === 'by25') {
    const { un, box } = q.c;
    frame(`${q.n} ${un}${q.ctx}，每 ${q.k} ${un}裝一${box}，<br>會剛好裝完嗎？不用真的除，拆開看。`, `<div class="pics5" id="pp"></div><div class="trail" id="ct">先別急著算</div>`);
    setEl('pp', `<b class="num">${q.n}</b> ${un}`);
    return gate(q, ['每 10 個綁成一捆', `把一捆拆開裝${box}`], 2, k => {
      if (k === 1) { setEl('pp', `<b class="num">${q.tens}</b> 捆，加 <b class="num">${q.one}</b> ${un}`); setEl('ct', `每捆 10 ${un}，另外零散 ${q.one} ${un}`); }
      else { setEl('pp', `<div class="vs6">${barRow(10, 10, groupCol(q.k))}</div>`); setEl('ct', `一捆 10 ${un}每 ${q.k} ${un}裝，剛好 ${10 / q.k} ${box}。零散的 ${q.one} ${un}呢？`); }
    }, () => pick6(['剛好裝完', '會剩下'], q.one % q.k ? 1 : 0, `整捆都裝得完，只要看零散的 ${q.one} ${un}能不能 ${q.k} 個一${box}。`, `對了！${q.n} 的個位是 ${q.one}。整十都是 ${q.k} 的倍數，判斷 ${q.k} 的倍數只要看個位。`, 'by25'));
  }
  if (q.mode === 'by3') {
    const { un, box } = q.c;
    frame(`${q.n} ${un}${q.ctx}，每 3 ${un}裝一${box}，能裝完嗎？<br>把百、十、個拆開，一個一個試。`, `<div id="pp"></div><div class="trail" id="ct"></div>${padHidden()}`);
    const rows = [[100, q.h, '一百', 99], [10, q.te, '一十', 9], [1, q.o, '個位', 0]];
    let out = '';
    return gate(q, [`拆 ${q.h} 個一百`, `拆 ${q.te} 個十`, `留下個位 ${q.o} ${un}`], 3, k => {
      const r = rows[k - 1];
      out += `<div class="line6">${r[3] ? `每個${r[2]}裝掉 ${r[3]} ${un}，只剩 1 ${un}：` : '個位零散的：'}剩 <b class="num">${r[1]}</b> ${un}</div>`;
      setEl('pp', out); setEl('ct', k < 3 ? `${r[3]} 是 3 的倍數，一定裝得完` : '把剩下的合起來看');
    }, () => stepKeypad([`裝不掉的合起來幾${un}？`, `再每 3 ${un}裝一${box}，最後剩幾${un}？`], [q.sum, q.left], `把剩下的 ${q.h}、${q.te}、${q.o} 加起來，再 3 個 3 個裝。`, `對了！${q.h}＋${q.te}＋${q.o}＝${q.sum}，剩 ${q.left}，${q.left ? `不是` : `是`} 3 的倍數。判斷 3 的倍數，把每一位的數字加起來就好。`, 'by3'));
  }
  if (q.mode === 'gcf') {
    frame(`${q.say}<br>一次拿出一個共同的質數。`, `<div id="ld"></div><div class="trail" id="ct"></div><div id="oo"></div>${padHidden()}`);
    return runLadder(q, q.a, q.b, 'ld', 'oo', () => stepKeypad([`共同拿出來的 ${q.div.join('、')} 乘起來是多少？`], [q.ans], '左邊那排都是兩個數共同有的零件。', `對了！${q.a} 和 ${q.b} 的最大公因數是 ${q.ans}。${q.ctx === '裁板子' ? `正方形每邊 ${q.ans} 公分。` : `可以分成 ${q.ans} 盒。`}這個直直往下除的寫法叫短除法。`, 'gcf'), (x, y) => setEl('ct', `現在是 ${x} 和 ${y}`));
  }
  if (q.mode === 'lcm') {
    frame(`${q.say}<br>${q.askText}先拿出共同的質數。`, `<div id="ld"></div><div class="trail" id="ct"></div><div id="oo"></div>${padHidden()}`);
    return runLadder(q, q.a, q.b, 'ld', 'oo', () => stepKeypad(['左邊共同的質數乘起來是多少？', `共同的只算一次，再乘下面各自多的 ${q.x} 和 ${q.y}，是多少？`], [q.g, q.ans], '共同的部分只算一次，兩邊各自多的都要留。', `對了！${q.a} 和 ${q.b} 的最小公倍數是 ${q.ans}。它同時是兩個數的倍數，而且最小。`, 'lcm'), (x, y) => setEl('ct', `現在是 ${x} 和 ${y}`));
  }
  if (q.mode === 'simp') {
    frame(`${q.say}，是 ${fracHtml(q.a, q.b)}。<br>上下一起拿出共同的質數，換成最簡分數。`, `<div id="ld"></div><div class="trail" id="ct"></div><div id="oo"></div>${padHidden()}`);
    return runLadder(q, q.a, q.b, 'ld', 'oo', () => stepKeypad(['最簡分數的分子是？', '分母是？'], [q.sa, q.sn], '看最下面一行的兩個數。', `對了！${q.a}/${q.b}＝${q.sa}/${q.sn}。分子分母沒有共同的因數了，叫最簡分數。`, 'simp'), (x, y) => setEl('ct', `現在是 ${x}/${y}`));
  }
  frame(`${q.say}。<br>幾個質數都試試看，兩個都除得開嗎？`, `<div class="op6s" id="tt">${[2, 3, 5, 7, ...(q.g === 13 ? [13] : [])].map(p => `<button class="op6 t6" data-p="${p}"><b class="num">${p}</b><small></small></button>`).join('')}</div><div class="trail" id="ct">點每個質數試試</div>`);
  const prs = [...document.querySelectorAll('.t6')];
  const yes = '只有 1 這個公因數', no = '還有別的公因數';
  return tapN(q, '.t6', prs.length, (e, k) => { const p = +e.dataset.p, both = q.a % p === 0 && q.b % p === 0; e.querySelector('small').textContent = `${q.a % p ? '✗' : '✓'}${q.b % p ? '✗' : '✓'}`; if (both) e.classList.add('hit'); setEl('ct', `${q.a} ${q.a % p ? '不' : ''}能被 ${p} 整除，${q.b} ${q.b % p ? '不' : ''}能`); }, () => pick6([yes, no], q.g === 1 ? 0 : 1, '有沒有哪一個質數，兩個數都打勾？', q.g === 1 ? `對了！${q.a} 和 ${q.b} 除了 1 沒有別的公因數，這兩個數互質。` : `對了！${q.a} 和 ${q.b} 還有公因數 ${q.g}，不互質。`, 'coprime'));
}

/* ---------- 二：能量分裝站 ---------- */
function viewFdiv(q) {
  const { un, verb, box } = q.c;
  if (q.mode === 'whole') {
    frame(`${q.n} ${un}${q.ctx}，每${box} ${fracHtml(1, q.d)} ${un}，<br>可以${verb}幾${box}？一${un}一${un}${verb}。`, `<div id="bb"></div><div class="trail" id="ct">一條是 1 ${un}</div>${padHidden()}`);
    const draw = (cut, done) => { let h = ''; for (let i = 0; i < q.n; i++) h += barRow(cut ? q.d : 1, cut ? q.d : 1, j => i < done ? groupCol(1)(j) : '#dfe5ee'); setEl('bb', h); };
    draw(false, 0);
    return gate(q, [`每 1 ${un}切成 ${q.d} 份`, ...Array.from({ length: q.n }, (_, i) => `${verb}完第 ${i + 1} ${un}`)], q.n + 1, k => { draw(true, k - 1); setEl('ct', k === 1 ? `每一小份就是 1/${q.d} ${un}` : `${verb}了 ${(k - 1) * q.d} ${box}`); }, () => stepKeypad([`1 ${un}可以${verb}幾${box}？`, `${q.n} ${un}可以${verb}幾${box}？`], [q.d, q.ans], `看每一條切成幾份，再看有幾條。`, `對了！${q.n}÷1/${q.d}＝${q.ans} ${box}。1 裡面有 ${q.d} 個 1/${q.d}：每${un} ${q.d} ${box}×${q.n} ${un}。`, 'whole'));
  }
  if (q.mode === 'intfrac') {
    frame(`${q.n} ${un}${q.ctx}，每${box} ${fracHtml(q.a, q.d)} ${un}，<br>可以${verb}幾${box}？`, `<div id="bb"></div><div class="trail" id="ct"></div>${padHidden()}`);
    const draw = st => { let h = ''; for (let i = 0; i < q.n; i++) h += barRow(st ? q.d : 1, st ? q.d : 1, c2 => st > 1 ? groupCol(q.a)(i * q.d + c2) : '#a9d0f0'); setEl('bb', h); };
    draw(0);
    return gate(q, [`每 1 ${un}切成 ${q.d} 份`, `每 ${q.a} 小份圈成一${box}`], 2, k => { draw(k); setEl('ct', k === 1 ? `一小份是 1/${q.d} ${un}` : `藍橘交替，每一段是一${box}`); }, () => stepKeypad(['全部有幾小份？', `每 ${q.a} 小份一${box}，可以幾${box}？`], [q.all, q.ans], `${q.n} 條，每條 ${q.d} 小份。`, `對了！${q.n}÷${q.a}/${q.d}＝${q.ans} ${box}。換成一樣大的小份：${q.all} 份÷${q.a} 份。`, 'intfrac'));
  }
  if (q.mode === 'same') {
    frame(`有 ${fracHtml(q.a, q.d)} ${un}${q.ctx}，每${box} ${fracHtml(q.b, q.d)} ${un}，<br>可以${verb}幾${box}？一${box}一${box}圈。`, `<div id="bb">${barRow(q.d, q.a, '#a9d0f0')}</div><div class="trail" id="ct">一整條是 1 ${un}</div>${padHidden()}`);
    return gate(q, `圈一${box}（${q.b} 格）`, q.ans, k => { setEl('bb', barRow(q.d, q.a, i => i < k * q.b ? groupCol(q.b)(i) : '#a9d0f0')); setEl('ct', `圈了 ${k} ${box}`); }, () => stepKeypad(['藍色一共有幾格？', `每${box}幾格？`, `可以${verb}幾${box}？`], [q.a, q.b, q.ans], '每一格一樣大，所以只要數格數。', `對了！${q.a}/${q.d}÷${q.b}/${q.d}＝${q.a}÷${q.b}＝${q.ans}。分母一樣時，每一格一樣大，只要比幾格。`, 'same'), { el: document.getElementById('bb'), map: x => x * (q.d / q.b) * 1.05, sel: '.drow5' });
  }
  if (q.mode === 'unlike' || q.mode === 'partial') {
    const whole = q.mode === 'unlike';
    frame(`有 ${fracHtml(q.a, q.b)} ${un}${q.ctx}，每${box} ${fracHtml(q.x, q.y)} ${un}，<br>可以${verb}幾${box}？格子不一樣大，先切細。`, `<div id="bb"></div><div class="trail" id="ct"></div><div id="sl"></div>${padHidden()}`);
    const draw = D => { const okA = D % q.b === 0, okX = D % q.y === 0; setEl('bb', `<small>你有的</small>${okA ? barRow(D, q.a * D / q.b, '#a9d0f0') : barRow(q.b, q.a, '#dfe5ee')}<small>每${box}要的</small>${okX ? barRow(D, q.x * D / q.y, '#f0a03c') : barRow(q.y, q.x, '#f6dfbf')}`); setEl('ct', okA && okX ? `都切成 ${D} 格，格子一樣大了！` : `${D} 格切不齊，再換一個數`); };
    const finishAsk = () => {
      if (whole) return stepKeypad([`你有幾小格？`, `每${box}幾小格？`, `可以${verb}幾${box}？`], [q.A, q.X, q.ans], `都換成 ${q.D} 格的尺再數。`, `對了！${q.a}/${q.b}÷${q.x}/${q.y}＝${q.A}/${q.D}÷${q.X}/${q.D}＝${q.A}÷${q.X}＝${q.ans}。`, 'unlike');
      stepKeypad([`可以${verb}幾分之幾${box}？分子是你有的格數，幾格？`, `分母是每${box}的格數，幾格？`], [q.A, q.X], `分不滿一${box}也可以用分數說。`, `對了！${q.a}/${q.b}÷${q.x}/${q.y}＝${q.A}÷${q.X}＝${q.sa}/${q.sn} ${box}。`, 'partial');
    };
    return explore(q, { id: 'sl', lo: 1, hi: q.D + 4, start: 1, target: q.D, draw, ask: () => { holdPad(); if (whole) return gate(q, `圈一${box}`, q.ans, k => setEl('bb', `<small>圈了 ${k} ${box}</small>${barRow(q.D, q.A, i => i < k * q.X ? groupCol(q.X)(i) : '#a9d0f0')}`), finishAsk); gate(q, ['把你有的和一' + box + '排在一起'], 1, () => setEl('bb', `<small>你有的 ${q.A} 格</small>${barRow(Math.max(q.A, q.X), q.A, '#a9d0f0')}<small>一${box} ${q.X} 格</small>${barRow(Math.max(q.A, q.X), q.X, '#f0a03c')}`), finishAsk); } });
  }
  if (q.mode === 'flip') {
    frame(`每${box} ${fracHtml(q.x, q.y)} ${un}${q.ctx}。先想 1 ${un}可以${verb}幾${box}，<br>再想 ${fracHtml(q.a, q.b)} ${un}。`, `<div id="bb">${barRow(1, 1, '#a9d0f0')}</div><div class="trail" id="ct">這是 1 ${un}</div>${padHidden()}`);
    return gate(q, [`切成 ${q.y} 份`, `每 ${q.x} 份圈一${box}`], 2, k => { if (k === 1) { setEl('bb', barRow(q.y, q.y, '#a9d0f0')); setEl('ct', `每份 1/${q.y} ${un}`); } else { setEl('bb', barRow(q.y, q.y, groupCol(q.x))); setEl('ct', `${q.y} 份，每 ${q.x} 份一${box}：1 ${un}是 ${q.y}/${q.x} ${box}`); } }, () => stepKeypad([`1 ${un}可以${verb} □/${q.x} ${box}，□ 是？`, `${q.a}/${q.b} ${un}是 1 ${un}的 ${q.a}/${q.b} 倍。約分後答案的分子是？`, '分母是？'], [q.y, q.sa, q.sn], `1 ${un}是 ${q.y}/${q.x} ${box}，再乘 ${q.a}/${q.b}。`, `對了！${q.a}/${q.b}÷${q.x}/${q.y}＝${q.a}/${q.b}×${q.y}/${q.x}＝${q.sa}/${q.sn}。除以一個分數，等於乘以它上下顛倒的數，就是它的倒數。`, 'flip'));
  }
  const FS = [[1, 4], [1, 3], [1, 2], [1, 1], [2, 1], [3, 1]];
  frame(`${q.N} ${un}${q.ctx}，每${box} ${q.f[1] === 1 ? q.f[0] : fracHtml(q.f[0], q.f[1])} ${un}。<br>拖黃鈕換別的數除，看商怎麼變。`, `<div id="bb"></div><div class="trail" id="ct"></div><div id="sl"></div>`);
  const draw = i => { const [a, n] = FS[i], r = q.N * n / a, W = q.N * 4; setEl('bb', `<svg class="g5" viewBox="0 0 320 60"><rect x="6" y="4" width="${300 * q.N / W}" height="22" fill="#f7dc8c" stroke="#33405a"/><rect x="6" y="34" width="${300 * r / W}" height="22" fill="${a < n ? '#f4a9a0' : '#3fae5a'}" stroke="#33405a"/></svg>`); setEl('ct', `${q.N}÷${n === 1 ? a : `${a}/${n}`}＝${r}`); };
  explore(q, { id: 'sl', lo: 0, hi: 5, need: 3, start: 3, show: FS.findIndex(f => f[0] === q.f[0] && f[1] === q.f[1]), draw, ask: () => pick6(['變大', '變小'], q.ans === '變大' ? 0 : 1, '看紅條和黃條：比 1 小的數切得細，切出來的個數多。', `對了！${q.N}÷${q.f[1] === 1 ? q.f[0] : `${q.f[0]}/${q.f[1]}`}＝${q.R}。除以比 1 小的數，商會比被除數大；除不一定變小。`, 'bigger') });
}

/* ---------- 三：精密裁切台 ---------- */
function bigDot(a, b, sh) { // 兩個數，小數點同時往右 sh 位
  const one = (v, y) => { const dp = (String(v).split('.')[1] || '').length, full = String(v).replace('.', '').replace(/^0+(?=\d)/, ''), point = Math.max(0, dp - sh), body = point ? full.slice(0, full.length - point) + '.' + full.slice(-point) : full + '0'.repeat(Math.max(0, sh - dp)); return `<text x="${y}" y="48" text-anchor="middle" class="big5">${body.startsWith('.') ? '0' + body : body}</text>`; };
  return `<svg class="g5" viewBox="0 0 320 74">${one(a, 80)}<text x="160" y="48" text-anchor="middle" class="big5">÷</text>${one(b, 240)}<text x="160" y="70" text-anchor="middle" class="pt">${sh ? `兩邊一起放大 ${10 ** sh} 倍` : '原來的樣子'}</text></svg>`;
}
function hundredG(n, b, phase) { // n 個 0.01；phase 1 拆成小格；2 每 b 格一組換色
  let out = ''; const boards = Math.ceil(n / 100);
  for (let k = 0; k < boards; k++) { let c = ''; for (let i = 0; i < 100; i++) { const id = k * 100 + i; c += `<i style="background:${id >= n ? '#fff' : phase > 1 ? groupCol(b)(id) : '#a9d0f0'}"></i>`; } out += `<div class="hb6">${c}</div>`; }
  return `<div class="hrow6">${out}</div>`;
}
function viewDdiv(q) {
  if (q.mode === 'cut') {
    const { un, small, verb } = q.c;
    const pic = k => { const w = 300 / q.T; let s = `<svg class="g5" viewBox="0 0 320 58"><rect x="10" y="12" width="300" height="20" fill="#f7dc8c" stroke="#33405a"/><rect x="10" y="12" width="${Math.min(k * q.e * w, 300)}" height="20" fill="#3fae5a" fill-opacity=".4"/>`; for (let i = 1; i <= q.ans; i++) { const x = 10 + i * q.e * w; s += `<line x1="${x}" x2="${x}" y1="${i <= k ? 4 : 12}" y2="${i <= k ? 40 : 32}" stroke="${i <= k ? '#d6476b' : '#c9a56a'}" stroke-width="${i <= k ? 3 : 1}"/>`; } for (let i = 0; i <= q.T; i++) s += `<text x="${10 + i * w}" y="54" text-anchor="middle" class="pt">${i}</text>`; return s + `</svg>`; };
    frame(`${q.T} ${un}長的${q.ctx}，每${small} ${q.e} ${un}。<br>沿著尺拖，一${small}一${small}${verb}。`, `<div id="bb">${pic(0)}</div><div class="trail" id="ct">${verb}下了 0 ${small}</div>${padHidden()}`);
    return gate(q, `${verb}一${small}`, q.ans, k => { setEl('bb', pic(k)); setEl('ct', `${verb}下了 ${k} ${small}，用了 ${dec6(k * q.e)} ${un}`); }, () => stepKeypad([`${q.T} ${un}是幾個 0.1 ${un}？`, `每${small}是幾個 0.1 ${un}？`, `可以${verb}幾${small}？`], [q.tenths, q.et, q.ans], `都用 0.1 ${un}當一份來數。`, `對了！${q.T}÷${q.e}＝${q.tenths}÷${q.et}＝${q.ans}。都換成幾個 0.1，就是整數除法。`, 'cut'), { el: document.getElementById('bb'), map: x => x * (q.ans + .4) });
  }
  if (q.mode === 'shift') {
    const un = q.s.from;
    frame(`${q.a} ${un}${q.ctx}，每份 ${q.b} ${un}，可以分幾份？<br>拖黃鈕，把兩個數的小數點一起往右移。`, `<div id="bb">${bigDot(q.a, q.b, 0)}</div><div class="trail" id="ct"></div><div id="sl"></div><div id="b2"></div>${padHidden()}`);
    return explore(q, { id: 'sl', lo: 0, hi: 2, start: 0, target: 1, draw: k => { setEl('bb', bigDot(q.a, q.b, k)); setEl('ct', k === 1 ? `換成小單位：${q.A} ${q.s.to}、${q.B} ${q.s.to}` : k === 2 ? '移太多了也可以，商還是一樣；先試移 1 位。' : '先把除數變成整數'); }, ask: () => { holdPad(); gate(q, [`排出 ${q.A} 小份`, `每 ${q.B} 小份圈一組`], 2, k => setEl('b2', barRow(q.A, q.A, k > 1 ? groupCol(q.B) : '#a9d0f0')), () => stepKeypad([`${q.A}÷${q.B}＝？`], [q.ans], '數數圈了幾組。', `對了！${q.a}÷${q.b}＝${q.A}÷${q.B}＝${q.ans}。被除數和除數同時放大一樣的倍數，商不變。`, 'shift')); } });
  }
  if (q.mode === 'two') {
    const { un, small } = q.s;
    frame(`${q.a} ${un}${q.ctx}，每${small} ${q.b} ${un}，可以分幾${small}？<br>1 ${un}是一張百格板，每小格是 0.01 ${un}。`, `<div id="bb">${hundredG(q.A, q.B, 0)}</div><div class="trail" id="ct">藍色有多少小格？</div>${padHidden()}`);
    return gate(q, ['數出小格', `每 ${q.B} 小格圈一${small}`], 2, k => { setEl('bb', hundredG(q.A, q.B, k)); setEl('ct', k === 1 ? `全部都是 0.01 ${un}的小格` : `藍橘交替，每一段是一${small}`); }, () => stepKeypad(['全部幾小格？', `每${small}幾小格？`, `可以分幾${small}？`], [q.A, q.B, q.ans], `${q.a} 是 ${q.A} 個 0.01。`, `對了！${q.a}÷${q.b}＝${q.A}÷${q.B}＝${q.ans}。`, 'two'));
  }
  if (q.mode === 'long') {
    const { un, small } = q.s, top = String(q.q), shown = dec6(q.N / 10).toFixed(1);
    const vert = (sh, t) => `<div class="vdiv6 num"><div class="q6t">${t ? `${top[0]}.${top[1]}` : ''}</div><div class="v6r"><span>${sh ? q.D : q.b}</span><span class="v6d">${sh ? shown : q.a}</span></div></div>`;
    frame(`${q.a} ${un}${q.ctx}，每${small} ${q.b} ${un}，可以分幾${small}？<br>拖黃鈕：除數先變整數。`, `<div id="bb">${vert(0, 0)}</div><div class="trail" id="ct"></div><div id="sl"></div>${padHidden()}`);
    return explore(q, { id: 'sl', lo: 0, hi: 2, start: 0, target: 1, draw: k => { setEl('bb', vert(k >= 1, 0)); setEl('ct', k ? `除數 ${q.b} 變 ${q.D}，被除數也放大 10 倍是 ${shown}` : '除數要變成整數'); }, ask: () => { holdPad(); gate(q, ['先不看小數點，當整數除', '商的小數點點上去'], 2, k => { setEl('bb', vert(true, k > 1)); setEl('ct', k === 1 ? `${q.N} 當整數除以 ${q.D}` : `商的小數點和 ${shown} 的小數點對齊`); }, () => stepKeypad([`先看 ${q.head}÷${q.D}，商幾？`, `餘數帶下一位，變成多少？`, `商是多少？（可以按小數點）`], [q.first, q.down, q.ans], `${q.first}×${q.D}＝${q.first * q.D}，剩下的再帶下一位。`, `對了！${q.a}÷${q.b}＝${q.ans} ${small}。除數和被除數都放大 10 倍，商的小數點對齊放大後的被除數。`, 'long', null, D2)); } });
  }
  const FS = [.2, .4, .5, .6, .8, 1, 1.5, 2], un = q.s.un;
  frame(`${q.N} ${un}${q.ctx}，每份 ${q.f} ${un}。<br>商一定比 ${q.N} 小嗎？拖黃鈕換別的數試試。`, `<div id="bb"></div><div class="trail" id="ct"></div><div id="sl"></div>`);
  explore(q, { id: 'sl', lo: 0, hi: 7, start: 5, need: 3, show: FS.indexOf(q.f), draw: i => { const f = FS[i], r = dec6(q.N / f), W = q.N * 5; setEl('bb', `<svg class="g5" viewBox="0 0 320 60"><rect x="6" y="4" width="${300 * q.N / W}" height="22" fill="#f7dc8c" stroke="#33405a"/><rect x="6" y="34" width="${300 * r / W}" height="22" fill="${f < 1 ? '#f4a9a0' : '#3fae5a'}" stroke="#33405a"/></svg>`); setEl('ct', `${q.N}÷${f}＝${r}`); }, ask: () => pick6(['比被除數大', '比被除數小'], q.f < 1 ? 0 : 1, '每份不到 1，就能分比較多份。', `對了！${q.N}÷${q.f}＝${q.R}。除數小於 1，商比被除數大；除數大於 1，商才比較小。`, 'bigger') });
}

/* ---------- 四：圓環艙 ---------- */
function rollSvg(d, turns, maxTurns, sticks) { // 圓在地上滾：turns 轉了幾圈；sticks 顯示直徑棒幾根
  const C = Math.PI * d, total = maxTurns * C + d, scale = Math.min(290 / total, 60 / d), r = d * scale / 2, x = 10 + r + turns * C * scale, ground = 2 * r + 6;
  const a = turns * 2 * Math.PI, sx = x + r * Math.sin(a), sy = 6 + r + r * Math.cos(a);
  let s = `<svg class="g5" viewBox="0 0 320 ${ground + 24}"><line x1="10" x2="310" y1="${ground}" y2="${ground}" stroke="#33405a" stroke-width="2"/><line x1="${10 + r}" x2="${x}" y1="${ground}" y2="${ground}" stroke="#d6476b" stroke-width="5"/>`;
  s += `<circle cx="${x}" cy="${6 + r}" r="${r}" fill="#fff" stroke="#33405a" stroke-width="3"/><line x1="${x}" y1="${6 + r}" x2="${sx}" y2="${sy}" stroke="#d6476b" stroke-width="3"/><circle cx="${sx}" cy="${sy}" r="4" fill="#d6476b"/>`;
  if (sticks) for (let i = 0; i < sticks; i++) s += `<rect x="${10 + r + i * d * scale + 1}" y="${ground + 6}" width="${d * scale - 2}" height="10" rx="2" fill="${i % 2 ? '#f0a03c' : '#6ea8dc'}"/>`;
  return s + '</svg>';
}
function cutCircleSvg(n, r) { // 左邊圓切 n 片，右邊交錯排成長條
  const R = 44, L = Math.PI * R, sw = L / (n / 2); let c = '', p = '';
  for (let i = 0; i < n; i++) { const a0 = i / n * 2 * Math.PI, a1 = (i + 1) / n * 2 * Math.PI; c += `<path d="M50 50L${50 + R * Math.sin(a0)} ${50 - R * Math.cos(a0)}A${R} ${R} 0 0 1 ${50 + R * Math.sin(a1)} ${50 - R * Math.cos(a1)}Z" fill="${i < n / 2 ? '#f7dc8c' : '#6ea8dc'}" stroke="#33405a" stroke-width=".7"/>`; }
  const base = 96, top = base - R;
  for (let i = 0; i < n / 2; i++) { const x0 = 108 + i * sw; p += `<path d="M${x0 + sw / 2} ${top}L${x0} ${base}Q${x0 + sw / 2} ${base + 40 / n} ${x0 + sw} ${base}Z" fill="#f7dc8c" stroke="#33405a" stroke-width=".7"/><path d="M${x0 + sw} ${base}L${x0 + sw / 2} ${top}Q${x0 + sw} ${top - 40 / n} ${x0 + 1.5 * sw} ${top}Z" fill="#6ea8dc" stroke="#33405a" stroke-width=".7"/>`; }
  return `<svg class="g5" viewBox="0 0 ${118 + L + sw / 2} 116">${c}${p}<text x="50" y="112" text-anchor="middle" class="pt">半徑 ${r}</text></svg>`;
}
function viewCircle(q) {
  const e = q.c.e || '';
  if (q.mode === 'pi') {
    frame(`${e} 兩個不一樣大的${q.ctx}：直徑 ${q.d1} 公分和 ${q.d2} 公分。<br>滾一圈，紅線是走過的路。`, `<div id="bb">${rollSvg(q.d1, 0, 1, 0)}</div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, ['滾小的一圈', '再滾大的一圈'], 2, k => { const d = k === 1 ? q.d1 : q.d2; setEl('bb', rollSvg(d, 1, 1, 4)); setEl('ct', `直徑 ${d} 公分，滾一圈 ${dec6(d * 3.14)} 公分。每個色塊是一條直徑`); }, () => stepKeypad(['滾一圈大約是幾條直徑多一點？'], [3], '數下面的色塊：紅線比幾塊長一點？', `對了！不管大小，圓周長都是直徑的 3 倍多一點，大約 3.14 倍。這個倍數叫圓周率。`, 'pi'));
  }
  if (q.mode === 'circ') {
    frame(`${e} ${q.ctx}的${q.useR ? `半徑 ${q.r}` : `直徑 ${q.d}`} 公分，<br>沿邊走一圈多長？滾一圈，再用直徑棒量。`, `<div id="bb">${rollSvg(q.d, 0, 1, 0)}</div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, ['滾一圈', '放直徑棒量'], 2, k => { setEl('bb', rollSvg(q.d, 1, 1, k === 2 ? 3 : 0)); setEl('ct', k === 1 ? '紅線就是圓周長' : `放了 3 條直徑還多一點，大約 3.14 條`); }, () => stepKeypad(q.useR ? ['直徑是幾公分？', '一圈幾公分？（可以按小數點）'] : ['一圈幾公分？（可以按小數點）'], q.useR ? [q.d, q.ans] : [q.ans], `一條直徑的長×3.14 條。`, `對了！${q.d}×3.14＝${q.ans} 公分。圓周長＝直徑×圓周率。`, 'circ', null, D2));
  }
  if (q.mode === 'wheel') {
    frame(`${e} ${q.ctx}的直徑 ${q.d} 公分，滾 ${q.n} 圈走多遠？<br>往右拖，一圈一圈滾。`, `<div id="bb">${rollSvg(q.d, 0, q.n, 0)}</div><div class="trail" id="ct">滾了 0 圈</div>${padHidden()}`);
    return gate(q, '滾一圈', q.n, k => { setEl('bb', rollSvg(q.d, k, q.n, 0)); setEl('ct', `滾了 ${k} 圈`); }, () => stepKeypad(['每一圈走幾公分？', `${q.n} 圈走幾公分？`], [q.one, q.ans], `每圈的長×圈數。`, `對了！${q.one}×${q.n}＝${q.ans} 公分。每圈的長×圈數。`, 'wheel', null, D2), { el: document.getElementById('bb'), map: x => x * (q.n + .4) });
  }
  if (q.mode === 'area') {
    const NS = [4, 8, 16, 32];
    frame(`${e} ${q.ctx}是半徑 ${q.r} 公尺的圓。<br>切開再交錯排排看。拖黃鈕切細。`, `<div id="bb"></div><div class="trail" id="ct"></div><div id="sl"></div>${padHidden()}`);
    return explore(q, { id: 'sl', lo: 0, hi: 3, start: 0, target: 3, draw: i => { setEl('bb', cutCircleSvg(NS[i], q.r)); setEl('ct', `切成 ${NS[i]} 片${i === 3 ? '，幾乎是長方形了！' : ''}`); }, ask: () => { holdPad(); gate(q, ['量長方形的長', '量長方形的寬'], 2, k => setEl('ct', k === 1 ? '長是圓周的一半：藍色一半、黃色一半' : `寬就是半徑 ${q.r} 公尺`), () => stepKeypad([`長是圓周的一半，${q.r * 2}×3.14÷2＝？`, `面積＝長×寬，是幾平方公尺？`], [q.half, q.ans], `長是半徑×3.14，寬是半徑。`, `對了！${q.half}×${q.r}＝${q.ans} 平方公尺。圓面積＝半徑×半徑×圓周率。`, 'area', null, D2)); } });
  }
  if (q.mode === 'half') {
    const pic = k => `<svg class="g5" style="max-height:130px" viewBox="0 0 220 124"><path d="M10 112A100 100 0 0 1 210 112Z" fill="#f7dc8c"/><path d="M10 112A100 100 0 0 1 210 112" fill="none" stroke="${k >= 1 ? '#d6476b' : '#33405a'}" stroke-width="${k >= 1 ? 5 : 2}"/><line x1="10" x2="210" y1="112" y2="112" stroke="${k >= 2 ? '#3b82c4' : '#33405a'}" stroke-width="${k >= 2 ? 5 : 2}"/></svg>`;
    frame(`${e} ${q.ctx}，直徑 ${q.d} 公尺。圍一圈要多長？<br>沿著邊走走看。`, `<div id="bb">${pic(0)}</div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, ['沿著彎的走', '沿著直的走回來'], 2, k => { setEl('bb', pic(k)); setEl('ct', k === 1 ? '彎的是圓周的一半' : `直的就是直徑 ${q.d} 公尺，別忘了它！`); }, () => stepKeypad(['彎的那段幾公尺？', '圍一圈共幾公尺？'], [q.arc, q.ans], `圓周的一半，再加直徑。`, `對了！${q.arc}＋${q.d}＝${q.ans} 公尺。半圓的周長要加上直徑。`, 'half', null, D2));
  }
  const pic = k => `<svg class="g5" style="max-height:170px" viewBox="0 0 170 170"><circle cx="85" cy="85" r="80" fill="${k >= 1 ? '#a9d0f0' : '#f4f6fa'}" stroke="#33405a" stroke-width="2"/>${k >= 2 ? `<circle cx="85" cy="85" r="${80 * q.r / q.R}" fill="#fff" stroke="#d6476b" stroke-width="3"/>` : ''}<line x1="85" y1="85" x2="165" y2="85" stroke="#33405a"/><text x="130" y="80" class="pt">${q.R}</text></svg>`;
  frame(`${e} ${q.ctx}：外圈半徑 ${q.R} 公尺，內圈半徑 ${q.r} 公尺。<br>圓環有多大？`, `<div id="bb">${pic(0)}</div><div class="trail" id="ct"></div>${padHidden()}`);
  gate(q, ['先鋪滿大圓', '挖掉中間的小圓'], 2, k => { setEl('bb', pic(k)); setEl('ct', k === 1 ? '整片都是藍的' : '白色挖掉了，藍色才是圓環'); }, () => stepKeypad(['大圓幾平方公尺？', '小圓幾平方公尺？', '圓環幾平方公尺？'], [q.big, q.small, q.ans], `半徑×半徑×3.14，大的減小的。`, `對了！${q.big}－${q.small}＝${q.ans} 平方公尺。`, 'ring', null, D2));
}

/* ---------- 五：調色配方室 ---------- */
function mixColor(ca, cb, a, b) { const h = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), A = h(ca), B = h(cb), t = a / (a + b); return `rgb(${A.map((x, i) => Math.round(x * t + B[i] * (1 - t))).join(',')})`; }
const cupHtml = (c, a, b) => `<span class="cup6" style="background:${mixColor(c.ca, c.cb, a, b)}"></span>`;
const dots6 = (n, c) => `<span class="dots6">${Array.from({ length: n }, () => `<i style="background:${c}"></i>`).join('')}</span>`;
function viewRatio(q) {
  const c = q.c;
  if (q.mode === 'mix') {
    frame(`${c.e} 配方：${c.A} ${q.a} ${c.un}、${c.B} ${q.b} ${c.un}。<br>要做 ${q.k} 倍，一份一份加，看${c.what}變不變。`, `<div class="rows6" id="bb"></div><div class="trail" id="ct">還沒加</div>${padHidden()}`);
    return gate(q, '再加一份配方', q.k, k => { let h = ''; for (let i = 0; i < k; i++) h += `<div class="r6">${dots6(q.a, c.ca)}${dots6(q.b, c.cb)}</div>`; setEl('bb', h + `<div class="r6c">${cupHtml(c, q.a, q.b)}</div>`); setEl('ct', `${c.A} ${q.a * k} ${c.un}、${c.B} ${q.b * k} ${c.un}，${c.what}沒有變`); }, () => stepKeypad([`${q.k} 份要${c.A}幾${c.un}？`, `${c.B}幾${c.un}？`], [q.a * q.k, q.b * q.k], `一份 ${q.a} 和 ${q.b}，有 ${q.k} 份。`, `對了！${q.a}：${q.b} 和 ${q.a * q.k}：${q.b * q.k} 是一樣的配方。這種關係叫「比」，${q.a}：${q.b} 讀作 ${q.a} 比 ${q.b}。`, 'mix'));
  }
  if (q.mode === 'rate') {
    const s = q.s, ua = s.ua || s.un, ub = s.ub || s.un, u = Math.max(q.a, q.b);
    const pair = (a, b) => `<div style="width:${q.a / u * 100}%">${a}</div><div style="width:${q.b / u * 100}%">${b}</div>`;
    frame(`${s.A} ${q.a} ${ua}，${s.B} ${q.b} ${ub}。<br>用後面的「${s.B}」當 1，前面的是幾分之幾？`, `<div id="bb">${pair(barRow(1, 1, '#f0a03c'), barRow(1, 1, '#6ea8dc'))}</div><div class="trail" id="ct">上面是${s.A}，下面是${s.B}</div>${padHidden()}`);
    return gate(q, [`把${s.B}切成 ${q.b} 份`, `用 1 份去量${s.A}`], 2, k => { setEl('bb', pair(k > 1 ? barRow(q.a, q.a, '#f0a03c') : barRow(1, 1, '#f0a03c'), barRow(q.b, q.b, '#6ea8dc'))); setEl('ct', k === 1 ? `每份是${s.B}的 1/${q.b}` : `${s.A}量到 ${q.a} 份`); }, () => stepKeypad(['比值的分子是？', '分母是？'], [q.a, q.b], `${s.A}有幾份、${s.B}有幾份。`, `對了！${q.a}：${q.b} 的比值是 ${q.a}÷${q.b}＝${q.a}/${q.b}。${s.kind2 === '異類' ? `單位不一樣也能比：每 1 ${ub}有 ${q.a}/${q.b} ${ua}。` : `就是${s.A}是${s.B}的 ${q.a}/${q.b} 倍。`}`, 'rate'));
  }
  if (q.mode === 'equal') {
    const row = (x, y, hi) => `<tr class="${hi ? 'hi6' : ''}"><td class="num">${x}</td><td>：</td><td class="num">${y}</td></tr>`;
    const known = q.askBack ? q.a * q.k : q.b * q.k;
    frame(`${c.e} ${c.A}：${c.B}＝${q.a}：${q.b}。<br>${q.askBack ? `${c.A}用了 ${known} ${c.un}，${c.B}要幾${c.un}？` : `${c.B}用了 ${known} ${c.un}，${c.A}要幾${c.un}？`}一份一份往下加。`, `<table class="tb6" id="bb"><tr><th>${c.A}</th><th></th><th>${c.B}</th></tr>${row(q.a, q.b)}</table><div class="trail" id="ct"></div>${padHidden()}`);
    let html = document.getElementById('bb').innerHTML;
    return gate(q, ['再加一份', '再加一份', '再加一份', '再加一份', '再加一份'].slice(0, q.k - 1).concat(q.k === 2 ? ['上下比比看'] : []), Math.max(2, q.k - 1), k => { const n = Math.min(k + 1, q.k); if (k <= q.k - 1) html += row(q.a * n, q.b * n, n === q.k); setEl('bb', html); setEl('ct', k > q.k - 1 ? '上下兩列，兩邊都是一樣的倍數' : `第 ${n} 份`); }, () => stepKeypad(['表裡是原來的幾倍？', q.askBack ? `${c.B}要幾${c.un}？` : `${c.A}要幾${c.un}？`], [q.k, q.ans], `${q.askBack ? q.a : q.b} 的幾倍是 ${known}？另一邊也要一樣的倍數。`, `對了！${q.a}：${q.b}＝${q.a * q.k}：${q.b * q.k}。前後項同乘一個數，比值不變，叫相等的比。`, 'equal'));
  }
  if (q.mode === 'vert') {
    frame(`${c.e} ${q.a} ${c.un}${c.A}配 ${q.b} ${c.un}${c.B}。<br>換成 ${q.a2} ${c.un}${c.A}，要多少${c.B}？`, `<table class="tb6"><tr><th>${c.A}</th><th></th><th>${c.B}</th></tr><tr><td class="num">${q.a}</td><td id="ar1">：</td><td class="num">${q.b}</td></tr><tr><td class="num">${q.a2}</td><td id="ar2">：</td><td class="num">□</td></tr></table><div class="trail" id="ct">橫著看，${c.B}是${c.A}的幾倍？</div>${padHidden()}`);
    return gate(q, ['橫著比第一列', '第二列也一樣'], 2, k => { if (k === 1) { setEl('ar1', `→×${q.m}→`); setEl('ct', `${q.a} 的 ${q.m} 倍是 ${q.b}`); } else { setEl('ar2', `→×${q.m}→`); setEl('ct', '配方沒變，兩列橫著的倍數也一樣'); } }, () => stepKeypad([`${c.B}是${c.A}的幾倍？`, `${q.a2} 的 ${q.m} 倍，${c.B}要幾${c.un}？`], [q.m, q.ans], '橫著的倍數，每一列都一樣。', `對了！${q.a}：${q.b}＝${q.a2}：${q.ans}。比有兩種倍數：上下兩列的倍數一樣，左右兩項的倍數也一樣。`, 'vert'));
  }
  if (q.mode === 'simp') {
    frame(`${c.e} ${c.A} ${q.a} ${c.un}、${c.B} ${q.b} ${c.un}，<br>找最少份的配方：前後一起拿出共同的質數。`, `<div id="ld"></div><div class="trail" id="ct"></div><div id="oo"></div>${padHidden()}`);
    return runLadder(q, q.a, q.b, 'ld', 'oo', () => stepKeypad(['最簡單的前項是？', '後項是？'], [q.x, q.y], '看最下面一行的兩個數。', `對了！${q.a}：${q.b}＝${q.x}：${q.y}。兩項沒有共同的因數了，叫最簡單整數比。`, 'simp'), (x, y) => setEl('ct', `現在是 ${x}：${y}`));
  }
  if (q.mode === 'fd') {
    const dec1 = q.sort === '小數', [fa, fb, fx, fy, D] = dec1 ? [] : q.how;
    const show = (l, r) => `<div class="zero-eq"><b class="num">${l}</b><span>：</span><b class="num">${r}</b></div>`;
    const s0 = dec1 ? show(q.a, q.b) : show(`${fa}/${fb}`, `${fx}/${fy}`);
    frame(`${c.e} 配方是 ${dec1 ? `${q.a}：${q.b}` : `${fa}/${fb}：${fx}/${fy}`}，不好量。<br>換成最簡單的整數比。`, `<div id="bb">${s0}</div><div class="trail" id="ct"></div>${padHidden()}`);
    const big = dec1 ? [dec6(q.a * 10), dec6(q.b * 10)] : [fa * D / fb, fx * D / fy];
    return gate(q, dec1 ? ['前後都放大 10 倍', '再約成最簡單'] : [`都通分成分母 ${D}`, `前後都乘 ${D}`], 2, k => { if (dec1) { setEl('bb', k === 1 ? show(big[0], big[1]) : show(q.x, q.y)); setEl('ct', k === 1 ? '小數不見了' : `都除以 ${big[0] / q.x}`); } else { setEl('bb', k === 1 ? show(`${big[0]}/${D}`, `${big[1]}/${D}`) : show(big[0], big[1])); setEl('ct', k === 1 ? '分母一樣了' : '分母都不見了'); } }, () => stepKeypad(['最簡單的前項是？', '後項是？'], [q.x, q.y], '兩項沒有共同的因數才算最簡單。', `對了！比可以是分數、小數，前後一起放大一樣的倍數，比值不變，最後都能換成 ${q.x}：${q.y}。`, 'fd'));
  }
  if (q.mode === 'share') {
    const s = q.s;
    frame(`${s.say}：${s.A}：${s.B}＝${q.a}：${q.b}，<br>共 ${q.total} ${s.un}。${s.A}分到幾${s.un}？`, `<div id="bb">${barRow(1, 1, '#dfe5ee')}</div><div class="trail" id="ct">一整條是 ${q.total} ${s.un}</div>${padHidden()}`);
    return gate(q, [`切成 ${q.a} 份和 ${q.b} 份`, '平分到每一份'], 2, k => { setEl('bb', barRow(q.a + q.b, q.a + q.b, i => i < q.a ? '#f0a03c' : '#6ea8dc')); setEl('ct', k === 1 ? `橘色是${s.A}，藍色是${s.B}` : `${q.total} ${s.un}平分到每一格`); }, () => stepKeypad(['全部切成幾份？', `每份幾${s.un}？`, `${s.A}分到幾${s.un}？`], [q.a + q.b, q.k, q.ans], `全部份數是 ${q.a}＋${q.b}，每份量×份數。`, `對了！每份 ${q.k} ${s.un}×${q.a} 份＝${q.ans} ${s.un}。`, 'share'));
  }
  frame(`${c.e} 甲杯：${c.A} ${q.a}、${c.B} ${q.b}。<br>乙杯：${c.A} ${q.a2}、${c.B} ${q.b2}。${c.what}一樣嗎？把甲杯放大比比看。`, `<div class="rows6" id="bb"></div><div class="trail" id="ct"></div><div id="sl"></div>`);
  explore(q, { id: 'sl', lo: 1, hi: q.k + 1, start: 1, target: q.k, draw: k => { setEl('bb', `<div class="r6"><small>甲×${k}</small>${dots6(q.a * k, c.ca)}${dots6(q.b * k, c.cb)}</div><div class="r6"><small>乙</small>${dots6(q.a2, c.ca)}${dots6(q.b2, c.cb)}</div>`); setEl('ct', `甲杯放大 ${k} 倍：${q.a * k}：${q.b * k}`); }, ask: () => gate(q, [`讓${c.B}一樣多再比`], 1, () => setEl('ct', `${c.B}都是 ${q.b2}，${c.A}是 ${q.a * q.k} 和 ${q.a2}`), () => pick6(['一樣', '不一樣'], q.ans === '一樣' ? 0 : 1, `${c.B}一樣多的時候，比${c.A}。`, q.ans === '一樣' ? `對了！${q.a}：${q.b}＝${q.a2}：${q.b2}，比值都是 ${q.a}/${q.b}，${c.what}一樣。` : `對了！${q.a}：${q.b} 放大後是 ${q.a * q.k}：${q.b * q.k}，和 ${q.a2}：${q.b2} 不同，${c.what}不一樣。`, 'same')) });
}

/* ---------- 六：太陽能板廠 ---------- */
function sectorSvg6(d, o) {
  o = o || {}; const cx = 110, cy = 110, r = 96, a = d * Math.PI / 180, ex = cx + r * Math.sin(a), ey = cy - r * Math.cos(a), big = d > 180 ? 1 : 0;
  let s = `<svg class="g5" style="max-height:${o.h || 210}px" viewBox="0 0 220 220"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff8e6" stroke="#33405a" stroke-width="2"/>`;
  if (d >= 360) s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffd65a" stroke="#33405a" stroke-width="2"/>`;
  else if (d > 0) s += `<path d="M${cx} ${cy}L${cx} ${cy - r}A${r} ${r} 0 ${big} 1 ${ex} ${ey}Z" fill="${o.fill || '#ffd65a'}" stroke="#33405a" stroke-width="2"/>`;
  if (o.n) for (let i = 0; i < o.n; i++) { const b = i * 2 * Math.PI / o.n; s += `<line x1="${cx}" y1="${cy}" x2="${cx + r * Math.sin(b)}" y2="${cy - r * Math.cos(b)}" stroke="#a9702a"/>`; }
  if (o.arc && d > 0) s += `<path d="M${cx} ${cy - r}A${r} ${r} 0 ${big} 1 ${ex} ${ey}" fill="none" stroke="#d6476b" stroke-width="6"/>`;
  if (o.radii && d > 0) s += `<path d="M${cx} ${cy - r}L${cx} ${cy}L${ex} ${ey}" fill="none" stroke="#3b82c4" stroke-width="5"/>`;
  if (o.knob) s += `<circle cx="${ex}" cy="${ey}" r="12" fill="#ffd65a" stroke="#2f5f9e" stroke-width="3"/>`;
  return s + '</svg>';
}
function dial(q, o) { // 拖圓周上的黃鈕轉圓心角，到定位就往下；按鈕備用
  const el = document.getElementById(o.id);
  let d = o.start === undefined ? (o.target === 30 ? 60 : 30) : o.start, over = false;
  const set = v => { const nv = clamp(Math.round(v / 15) * 15, 15, 345); if (nv === d || over) return; d = nv; sfx.hop(); o.draw(d); if (d === o.target) { over = true; el.onpointerdown = el.onpointermove = null; setEl(o.btn, ''); sfx.ok(); afterAct(o.ask); } };
  if (isFast(q)) { o.draw(o.target); return afterAct(o.ask); }
  o.draw(d);
  setEl(o.btn, `<div class="odo two"><button class="turn s6b s6l">－15 度</button><button class="turn s6b s6r">＋15 度</button></div>`);
  document.querySelector('.s6l').onclick = () => set(d - 15);
  document.querySelector('.s6r').onclick = () => set(d + 15);
  dragOn(el, (x, y) => { let a = Math.atan2(x - .5, .5 - y) * 180 / Math.PI; if (a < 0) a += 360; set(a); });
}
function viewSector(q) {
  const e = q.c.e || '';
  if (q.mode === 'frac') {
    frame(`${e} 把${q.ctx}的圓心角轉到 ${q.d} 度。<br>拖黃鈕。`, `<div id="ss"></div><div class="trail" id="ct"></div><div id="bt"></div>${padHidden()}`);
    return dial(q, { id: 'ss', btn: 'bt', target: q.d, draw: d => { setEl('ss', sectorSvg6(d, { knob: true })); setEl('ct', `圓心角 ${d} 度，一整圈是 360 度`); }, ask: () => { holdPad(); gate(q, `把圓切成 ${q.n} 等份比比看`, 1, () => { setEl('ss', sectorSvg6(q.d, { n: q.n })); setEl('ct', `切成 ${q.n} 等份，這一片占 ${q.a} 份`); }, () => stepKeypad(['這一片是幾分之幾圓？約分後分子是？', '分母是？'], [q.a, q.n], `${q.d}÷360 再約分。`, `對了！圓心角：360＝${q.d}：360，就是 ${q.a}/${q.n} 圓。`, 'frac')); } });
  }
  if (q.mode === 'arc') {
    frame(`${e} ${q.ctx}半徑 ${q.r} 公尺，圓心角 ${q.d} 度。<br>彎彎的邊多長？先把圓心角轉出來。`, `<div id="ss"></div><div class="trail" id="ct"></div><div id="bt"></div><div id="bb"></div>${padHidden()}`);
    return dial(q, { id: 'ss', btn: 'bt', target: q.d, draw: d => { setEl('ss', sectorSvg6(d, { arc: true, knob: true, h: 170 })); setEl('ct', `紅線是弧，圓心角 ${d} 度`); }, ask: () => { holdPad(); gate(q, '把整個圓周拉直', 1, () => { setEl('bb', barRow(24, q.d / 15, '#d6476b')); setEl('ct', `整條是圓周長，紅色占 ${q.d}/360`); }, () => stepKeypad(['圓周長是幾公尺？', `弧長是圓周長的 ${q.d}/360，幾公尺？`], [q.C, q.ans], `半徑×2×3.14，再取幾分之幾。`, `對了！${q.C}×${q.d}/360＝${q.ans} 公尺。圓心角：360＝弧長：圓周長。`, 'arc', null, D2)); } });
  }
  if (q.mode === 'area') {
    frame(`${e} ${q.ctx}半徑 ${q.r} 公尺，圓心角 ${q.d} 度。<br>有多大？切成一樣大的片，再拿一片。`, `<div id="ss">${sectorSvg6(0)}</div><div class="trail" id="ct">先看整個圓</div>${padHidden()}`);
    return gate(q, [`切成 ${q.n} 等份`, '拿出一片'], 2, k => { setEl('ss', sectorSvg6(k > 1 ? q.d : 0, { n: q.n })); setEl('ct', k === 1 ? `每片 ${q.d} 度，${q.n} 片拼成一圓` : `這一片是整個圓的 1/${q.n}`); }, () => stepKeypad(['整個圓幾平方公尺？', '這一片幾平方公尺？'], [q.A, q.ans], `半徑×半徑×3.14，再÷${q.n}。`, `對了！${q.A}×${q.d}/360＝${q.ans} 平方公尺。圓心角：360＝扇形面積：圓面積。`, 'area', null, D2));
  }
  if (q.mode === 'perim') {
    frame(`${e} ${q.ctx}半徑 ${q.r} 公尺，圓心角 ${q.d} 度。<br>沿著邊貼一圈裝飾條，要多長？沿著走走看。`, `<div id="ss">${sectorSvg6(q.d)}</div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, ['走彎的那段', '走兩條半徑回來'], 2, k => { setEl('ss', sectorSvg6(q.d, { arc: true, radii: k > 1 })); setEl('ct', k === 1 ? `弧長是圓周的 ${q.d}/360` : `還有兩條半徑，每條 ${q.r} 公尺`); }, () => stepKeypad(['彎的那段幾公尺？', '貼一圈共幾公尺？'], [q.arc, q.ans], `弧長再加兩條半徑。`, `對了！${q.arc}＋${q.r}×2＝${q.ans} 公尺。扇形的周長要加兩條半徑。`, 'perim', null, D2));
  }
  if (q.mode === 'three') {
    const bars = d => `<small>圓心角：360</small>${barRow(24, d / 15, '#ffd65a')}<small>弧長：圓周長</small>${barRow(24, d / 15, '#d6476b')}<small>扇形面積：圓面積</small>${barRow(24, d / 15, '#3fae5a')}`;
    frame(`${e} 拖黃鈕把${q.ctx}轉到 ${q.d} 度，<br>看下面三條怎麼跟著變。`, `<div id="ss"></div><div id="bb"></div><div id="bt"></div>`);
    return dial(q, { id: 'ss', btn: 'bt', target: q.d, draw: d => { setEl('ss', sectorSvg6(d, { arc: true, knob: true, h: 140 })); setEl('bb', bars(d)); }, ask: () => gate(q, '把三條疊起來比', 1, () => setEl('bb', bars(q.d) + `<div class="trail">每條都切 24 格，塗的格數呢？</div>`), () => pick6(['三個比都一樣', '弧長的比比較大', '面積的比比較大'], 0, '三條都切 24 格，數塗了幾格。', `對了！圓心角：360＝弧長：圓周長＝扇形面積：圓面積，都是 ${q.a}/${q.n}。`, 'three')) });
  }
  frame(`${q.c.say}，半徑 ${q.r} 公分。<br>掃過的範圍有多大？`, `<div id="ss">${sectorSvg6(0)}</div><div class="trail" id="ct"></div>${padHidden()}`);
  gate(q, ['畫出整個圓', `塗 ${q.a}/${q.n} 圓`], 2, k => { setEl('ss', sectorSvg6(k > 1 ? 360 * q.a / q.n : 0, { n: q.n })); setEl('ct', k === 1 ? `轉滿一圈會掃過整個圓，切成 ${q.n} 等份` : `只掃了 ${q.a}/${q.n}`); }, () => stepKeypad(['整個圓幾平方公分？', '掃過幾平方公分？'], [q.A, q.ans], `半徑×半徑×3.14，再×${q.a}/${q.n}。`, `對了！${q.A}×${q.a}/${q.n}＝${q.ans} 平方公分。`, 'word', null, D2));
}

/* ---------- 七：飛行跑道 ---------- */
function raceSvg(lines, maxD) { // lines [{ d, c, e }]
  const u = 270 / maxD; let s = `<svg class="g5" viewBox="0 0 320 ${lines.length * 54 + 6}">`;
  lines.forEach((l, i) => { const y = 26 + i * 54, x = 18 + l.d * u; s += `<line x1="18" x2="300" y1="${y + 8}" y2="${y + 8}" stroke="#c9d1dd" stroke-width="6"/><line x1="18" x2="${x}" y1="${y + 8}" y2="${y + 8}" stroke="${l.c}" stroke-width="6"/><text x="${x}" y="${y}" text-anchor="middle" style="font-size:22px;font-family:system-ui,sans-serif">${l.e}</text><text x="${x}" y="${y + 24}" text-anchor="middle" class="pt">${l.d}</text>`; });
  return s + '</svg>';
}
function viewSpeed(q) {
  if (q.mode === 'sameT') {
    const c = q.c, max = Math.max(q.d1, q.d2);
    frame(`${c.e} ${c.a}和${c.b}同時出發，走 ${q.t} ${c.t}。誰快？<br>往右拖時間。`, `<div id="bb">${raceSvg([{ d: 0, c: '#d6476b', e: c.e }, { d: 0, c: '#3b82c4', e: c.e }], max)}</div><div class="trail" id="ct">上面是${c.a}，下面是${c.b}</div>`);
    return gate(q, `再過 1 ${c.t}`, q.t, k => { setEl('bb', raceSvg([{ d: q.v1 * k, c: '#d6476b', e: c.e }, { d: q.v2 * k, c: '#3b82c4', e: c.e }], max)); setEl('ct', `過了 ${k} ${c.t}：${c.a} ${q.v1 * k} ${c.un}，${c.b} ${q.v2 * k} ${c.un}`); }, () => pick6([c.a, c.b], q.ans === 'a' ? 0 : 1, '時間一樣，走得遠的比較快。', `對了！時間一樣，距離長的比較快。每 1 ${c.t}：${c.a} ${q.v1} ${c.un}，${c.b} ${q.v2} ${c.un}。`, 'sameT'), { el: document.getElementById('bb'), map: x => x * (q.t + .4) });
  }
  if (q.mode === 'sameD') {
    const c = q.c, T = Math.max(q.t1, q.t2);
    frame(`${c.e} ${c.a}和${c.b}都要到 ${q.d} ${c.un}外。誰快？<br>往右拖時間，看誰先到。`, `<div id="bb">${raceSvg([{ d: 0, c: '#d6476b', e: c.e }, { d: 0, c: '#3b82c4', e: c.e }], q.d)}</div><div class="trail" id="ct">上面是${c.a}，下面是${c.b}</div>`);
    return gate(q, `再過 1 ${c.t}`, T, k => { setEl('bb', raceSvg([{ d: Math.min(q.d, q.v1 * k), c: '#d6476b', e: c.e }, { d: Math.min(q.d, q.v2 * k), c: '#3b82c4', e: c.e }], q.d)); setEl('ct', `過了 ${k} ${c.t}`); }, () => pick6([c.a, c.b], q.ans === 'a' ? 0 : 1, '距離一樣，先到的比較快。', `對了！距離一樣，${c.a}要 ${q.t1} ${c.t}，${c.b}要 ${q.t2} ${c.t}，時間短的比較快。`, 'sameD'), { el: document.getElementById('bb'), map: x => x * (T + .4) });
  }
  const s = q.s;
  if (q.mode === 'rate') {
    frame(`${s.e} ${s.ctx}用 ${q.t} ${s.t}走了 ${q.d} ${s.un}，每段一樣快。<br>1 ${s.t}走多遠？把路切開。`, `<div id="bb">${barRow(1, 1, '#a9d0f0')}</div><div class="trail" id="ct">一整條是 ${q.d} ${s.un}</div>${padHidden()}`);
    return gate(q, [`切成 ${q.t} 段`, '看其中一段'], 2, k => { setEl('bb', barRow(q.t, q.t, i => k > 1 && i === 0 ? '#f0a03c' : '#a9d0f0')); setEl('ct', k === 1 ? `一段就是 1 ${s.t}走的路` : '橘色這一段走了多遠？'); }, () => stepKeypad([`每 1 ${s.t}走幾${s.un}？`], [q.ans], `${q.d} 平分成 ${q.t} 段。`, `對了！${q.d}÷${q.t}＝${q.ans}，${s.word} ${q.ans} ${s.un}。距離和時間的比值，就是速率。`, 'rate'));
  }
  if (q.mode === 'dist') {
    frame(q.back ? `${s.e} ${s.ctx}${s.word} ${q.v} ${s.un}，要走 ${q.d} ${s.un}。<br>要幾${s.t}？一段一段鋪。` : `${s.e} ${s.ctx}${s.word} ${q.v} ${s.un}，走 ${q.t} ${s.t}。<br>走多遠？往右拖時間。`, `<div id="bb">${raceSvg([{ d: 0, c: '#d6476b', e: s.e }], q.d)}</div><div class="trail" id="ct">0 ${s.t}</div>${padHidden()}`);
    return gate(q, `再走 1 ${s.t}`, q.t, k => { setEl('bb', raceSvg([{ d: q.v * k, c: '#d6476b', e: s.e }], q.d)); setEl('ct', `${k} ${s.t}：${q.v * k} ${s.un}`); }, () => stepKeypad([q.back ? `要幾${s.t}？` : `${q.t} ${s.t}走幾${s.un}？`], [q.ans], q.back ? `${q.d} 裡面有幾個 ${q.v}？` : `每${s.t}走 ${q.v}，走 ${q.t} ${s.t}。`, q.back ? `對了！${q.d}÷${q.v}＝${q.ans} ${s.t}。距離裡有幾個速率，就是時間。` : `對了！${q.v}×${q.t}＝${q.ans} ${s.un}。距離＝速率×時間，每${s.t}的量×${s.t}數。`, 'dist'), { el: document.getElementById('bb'), map: x => x * (q.t + .4) });
  }
  if (q.mode === 'prop') {
    const tm = q.sort === 'time', row = (v, t, d, hi) => `<tr class="${hi ? 'hi6' : ''}"><td class="num">${v}</td><td class="num">${t}</td><td class="num">${d}</td></tr>`;
    const head = `<tr><th>${s.word}</th><th>${s.t}</th><th>距離</th></tr>`;
    frame(tm ? `${s.e} ${s.word} ${q.v} ${s.un}不變，走了 ${q.t} ${s.t}。時間變 ${q.m} 倍，<br>距離會變幾倍？填表看。` : `${s.e} 都走 ${q.t} ${s.t}，${s.word} ${q.v} ${s.un}變 ${q.m} 倍，<br>距離會變幾倍？填表看。`, `<table class="tb6" id="tb">${head}${row(q.v, q.t, q.d)}</table><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, ['先看 2 倍', q.m === 2 ? '再驗算 2 倍' : `再看 ${q.m} 倍`], 2, k => { const m = k === 1 ? 2 : q.m; setEl('tb', head + row(q.v, q.t, q.d) + row(tm ? q.v : q.v * 2, tm ? q.t * 2 : q.t, q.d * 2, k === 1) + (k === 2 && q.m !== 2 ? row(tm ? q.v : q.v * q.m, tm ? q.t * q.m : q.t, q.d * q.m, true) : '')); setEl('ct', `${tm ? '時間' : s.word}變 ${m} 倍，距離也變 ${m} 倍`); }, () => stepKeypad(['距離變幾倍？', `現在的距離是幾${s.un}？`], [q.m, q.ans], `${q.d} 的 ${q.m} 倍。`, `對了！${tm ? `速率固定，時間` : `時間固定，速率`}變幾倍，距離就變幾倍：${q.d}×${q.m}＝${q.ans} ${s.un}。`, 'prop'));
  }
  if (q.mode === 'unit') {
    const u = q.u;
    frame(`${u.e} ${u.ctx}時速 ${q.big} 公里。1 分鐘走幾公尺？<br>距離和時間都換小單位。`, `<div id="bb">${barRow(1, 1, '#a9d0f0')}</div><div class="trail" id="ct">一整條是 1 小時走的路</div>${padHidden()}`);
    return gate(q, ['公里換成公尺', '1 小時切成 60 分鐘'], 2, k => { setEl('bb', k > 1 ? barRow(60, 60, i => i ? '#a9d0f0' : '#f0a03c') : barRow(1, 1, '#a9d0f0')); setEl('ct', k === 1 ? `${q.big} 公里＝${fmt(q.meters)} 公尺` : '橘色一小格就是 1 分鐘走的路'); }, () => stepKeypad(['1 小時走幾公尺？', '1 分鐘走幾公尺？'], [q.meters, q.ans], `${q.big}×1000，再÷60。`, `對了！時速 ${q.big} 公里＝分速 ${q.ans} 公尺。先換距離，再把時間切細。`, 'unit'));
  }
  frame(`${s.e} ${s.ctx}先以${s.word} ${q.v1} ${s.un}走 ${q.t1} ${s.t}，<br>再以${s.word} ${q.v2} ${s.un}走 ${q.t2} ${s.t}。平均${s.word}多少？`, `<div id="bb"></div><div class="trail" id="ct"></div>${padHidden()}`);
  setEl('bb', `<div class="hz6"><div style="flex:${q.d1}">${barRow(1, 1, '#f0a03c')}</div><div style="flex:${q.d2}">${barRow(1, 1, '#6ea8dc')}</div></div>`);
  gate(q, ['把兩段路接起來', '把時間接起來平分'], 2, k => { if (k === 1) setEl('ct', `${q.d1}＋${q.d2}＝${q.D} ${s.un}`); else { setEl('bb', barRow(q.T, q.T, groupCol(1))); setEl('ct', `全部 ${q.T} ${s.t}，每${s.t}走一樣多才是平均`); } }, () => stepKeypad([`全部走幾${s.un}？`, `全部幾${s.t}？`, `平均${s.word}多少${s.un}？`], [q.D, q.T, q.ans], `總距離÷總時間，不是把兩個速率直接平均。`, `對了！${q.D}÷${q.T}＝${q.ans}。平均速率＝總距離÷總時間。`, 'avg'));
}

/* ---------- 八：數據中心 ---------- */
function viewRelation(q) {
  const table = (A, B, seen, fa, fb) => `<tr><th>${A}</th>${seen.slice(-4).map(v => `<td class="num">${fa(v)}</td>`).join('')}</tr><tr><th>${B}</th>${seen.slice(-4).map(v => `<td class="num">${fb(v)}</td>`).join('')}</tr>`;
  if (q.mode === 'sum') {
    const s = q.s;
    frame(`${s.ctx}：${s.A}和${s.B}合起來總是 ${s.tot} ${s.un}。<br>拖黃鈕改${s.A}，看${s.B}怎麼變。`, `<div id="bb"></div><table class="tb6" id="tb"></table><div class="trail" id="ct"></div><div id="sl"></div>${padLate()}`);
    const seen = [];
    const draw = x => { if (!seen.includes(x)) seen.push(x); setEl('bb', `<div class="hz6"><div style="flex:${x}">${barRow(1, 1, '#f0a03c')}</div><div style="flex:${s.tot - x}">${barRow(1, 1, '#6ea8dc')}</div></div>`); setEl('tb', table(s.A, s.B, seen, v => v, v => s.tot - v)); setEl('ct', `${x} ＋ ${s.tot - x} ＝ ${s.tot}`); };
    return explore(q, { id: 'sl', lo: s.lo, hi: s.hi, start: s.lo + 1, need: 3, show: q.x, draw, ask: () => pick6(q.options, q.options.indexOf(q.right), '看表格每一直行，哪一個算式每次都成立？', `對了！用文字記下關係：${q.right}。`, 'sum', () => stepKeypad([`${s.A} ${q.t} ${s.un}時，${s.B}幾${s.un}？`], [q.ans], `${s.tot} 扣掉 ${q.t}。`, `對了！${q.right}，知道一個就知道另一個。`, 'sum')) });
  }
  if (q.mode === 'diff') {
    const s = q.s;
    frame(`${s.ctx}：${s.A}和${s.B}一起往上變，<br>拖黃鈕看${s.B}變的時候，${s.A}比${s.B}多多少。`, `<div id="bb"></div><table class="tb6" id="tb"></table><div class="trail" id="ct"></div><div id="sl"></div>${padLate()}`);
    const seen = [];
    const draw = x => { if (!seen.includes(x)) seen.push(x); const W = s.hi + q.gap; setEl('bb', `<div style="width:${(x + q.gap) / W * 100}%">${barRow(x + q.gap, x + q.gap, i => i >= x ? '#d6476b' : '#f0a03c')}</div><div style="width:${x / W * 100}%">${barRow(x, x, '#6ea8dc')}</div>`); setEl('tb', table(s.A, s.B, seen, v => v + q.gap, v => v)); setEl('ct', `紅色永遠是 ${q.gap} ${s.un}`); };
    return explore(q, { id: 'sl', lo: s.lo, hi: s.hi, start: s.lo + 1, need: 3, show: s.lo + 3, draw, ask: () => pick6(q.options, q.options.indexOf(q.right), '兩個都變，什麼沒有變？', `對了！差不變：${q.right}。`, 'diff', () => stepKeypad([`${s.B} ${q.t} ${s.un}時，${s.A}幾${s.un}？`], [q.ans], `多 ${q.gap}。`, `對了！${q.t}＋${q.gap}＝${q.ans}。${q.right}。`, 'diff')) });
  }
  if (q.mode === 'each') {
    const s = q.s;
    frame(`${s.ctx}：${s.one} ${q.each} ${s.un2}。<br>拖黃鈕改${s.A}，看${s.B}怎麼變。`, `<div id="bb"></div><table class="tb6" id="tb"></table><div class="trail" id="ct"></div><div id="sl"></div>${padLate()}`);
    const seen = [];
    const draw = x => { if (!seen.includes(x)) seen.push(x); setEl('bb', barRow(10, x, '#a9d0f0')); setEl('tb', table(s.A, s.B, seen, v => v, v => v * q.each)); setEl('ct', `${q.each}×${x}＝${q.each * x} ${s.un2}`); };
    return explore(q, { id: 'sl', lo: 1, hi: 10, start: 2, need: 3, show: 3, draw, ask: () => pick6(q.options, q.options.indexOf(q.right), '每一直行：下面是上面的幾倍？', `對了！${q.right}。${s.one}的量×份數。`, 'each', () => stepKeypad([`${s.A}是 ${q.t} 時，${s.B}是多少${s.un2}？`], [q.ans], `${q.each}×${q.t}。`, `對了！${q.each}×${q.t}＝${q.ans} ${s.un2}。`, 'each')) });
  }
  if (q.mode === 'seat') {
    const s = q.s, f = n => s.head + s.add * (n - 1);
    frame(`${s.ctx}：一個一個接上去。<br>${s.one}每多 1 ${s.un}，${s.got}多幾${s.gun}？`, `<div id="bb"></div><table class="tb6" id="tb"></table><div class="trail" id="ct"></div>${padHidden()}`);
    const draw = k => { setEl('bb', `<div class="pics5">${'▢'.repeat(k + 1)}</div>`); setEl('tb', `<tr><th>${s.one}</th>${Array.from({ length: k + 1 }, (_, i) => `<td class="num">${i + 1}</td>`).join('')}</tr><tr><th>${s.got}</th>${Array.from({ length: k + 1 }, (_, i) => `<td class="num">${f(i + 1)}</td>`).join('')}</tr>`); setEl('ct', k ? `每多 1 ${s.un}，多 ${s.add} ${s.gun}` : `先有 1 ${s.un}，${s.head} ${s.gun}`); };
    draw(0);
    return gate(q, `再接 1 ${s.un}`, 3, draw, () => stepKeypad([`每多 1 ${s.un}多幾${s.gun}？`, `${q.t} ${s.un}的時候，共幾${s.gun}？`], [s.add, q.ans], `第一個 ${s.head} ${s.gun}，後面每個多 ${s.add} ${s.gun}，後面有 ${q.t - 1} 個。`, `對了！${s.head}＋${s.add}×${q.t - 1}＝${q.ans}。用 □ 記${s.one}數、○ 記${s.got}數：${s.head}＋${s.add}×（□－1）＝○。`, 'seat'));
  }
  if (q.mode === 'write') {
    const w = q.w;
    frame(`把關係寫成式子：<br>${w.say}`, `<div class="slots6" id="ss">${w.slots.map((_, i) => `<span class="bin" data-b="${i}"></span>`).join('')}</div><div class="toks6" id="tt">${q.tokens.map(t => `<span class="tok" data-t="${esc(t)}" data-to="${w.slots.indexOf(t)}">${t}</span>`).join('')}</div><div class="trail" id="ct">把字卡拖進格子；也可以先點字卡再點格子</div>`);
    const fill = {};
    const box = i => document.querySelector(`[data-b="${i}"]`);
    const check = () => {
      const got = w.slots.map((_, i) => fill[i]);
      if (got.some(x => !x)) return;
      const s = w.slots, right = got.join() === s.join() || (s[1] === '＋' && [got[2], got[1], got[0], got[3], got[4]].join() === s.join());
      if (right) { document.getElementById('tt').innerHTML = ''; return finish(graded(), 'write', nums(`對了！${s.join(' ')}。不知道確切的數，也能先把關係寫下來。`)); }
      if (miss()) { s.forEach((t, i) => { box(i).textContent = t; }); document.getElementById('tt').innerHTML = ''; return finish(0, { wrong: got.join(' '), ans: s.join(' ') }, nums(`關係是：${s.join(' ')}。`)); }
      setMsg('再讀一次句子：誰和誰合起來、誰是結果？', 'hint');
      s.forEach((_, i) => { delete fill[i]; box(i).textContent = ''; });
      document.querySelectorAll('.tok').forEach(t => t.classList.remove('used'));
    };
    if (isFast(q)) w.slots.slice(0, 3).forEach((t, i) => { fill[i] = t; box(i).textContent = t; document.querySelector(`[data-t="${esc(t)}"]`).classList.add('used'); });
    return dragTok(document.getElementById('stage'), (t, b) => { const i = b.dataset.b; if (fill[i]) { const old = document.querySelector(`.tok.used[data-t="${esc(fill[i])}"]`); if (old) old.classList.remove('used'); } fill[i] = t.dataset.t; b.textContent = t.dataset.t; t.classList.add('used'); sfx.hop(); check(); });
  }
  const s = q.s, one = s.box.slice(0, 1);
  const pan = (n, ex, w) => `<span class="pan6">${s.e.repeat(n)}${ex ? `<b class="num">＋${ex}</b>` : ''}${w ? `<b class="num">${w}</b>` : ''}</span>`;
  frame(`${s.ctx}：天平左邊 ${q.n} ${s.box}和 ${q.extra} ${s.un}，右邊 ${q.right} ${s.un}，平衡。<br>每${one}有幾${s.un}？兩邊做一樣的事。`, `<div class="bal6" id="bb">${pan(q.n, q.extra)}<i>＝</i>${pan(0, 0, q.right)}</div><div class="trail" id="ct">現在平衡</div>${padHidden()}`);
  gate(q, [`兩邊都拿走 ${q.extra} ${s.un}`, `兩邊都平分成 ${q.n} 份`], 2, k => { setEl('bb', k === 1 ? pan(q.n) + '<i>＝</i>' + pan(0, 0, q.rest) : pan(1) + '<i>＝</i>' + pan(0, 0, q.each)); setEl('ct', k === 1 ? '兩邊拿走一樣多，還是平衡' : '兩邊都分成一樣的份數，還是平衡'); }, () => stepKeypad([`拿走以後，右邊剩幾${s.un}？`, `每${one}幾${s.un}？`], [q.rest, q.ans], `${q.right}－${q.extra}，再平分成 ${q.n} 份。`, `對了！${q.n}×□＋${q.extra}＝${q.right}，兩邊做一樣的事保持平衡，□ 是 ${q.ans}。這就是等量的想法。`, 'balance'));
}
const VIEWS = { prime: viewPrime, fdiv: viewFdiv, ddiv: viewDdiv, circle: viewCircle, ratio: viewRatio, sector: viewSector, speed: viewSpeed, relation: viewRelation };
/* ---------- 九：物資調度台 ---------- */
function viewMix(q) {
  if (q.mode === 'order') {
    const ops2 = q.toks.map((t, i) => typeof t === 'string' && '＋－×÷'.includes(t) ? i : -1).filter(i => i >= 0), second = ops2.find(i => i !== q.first);
    const v = i => q.toks[i].t, T = q.toks, sym = [T[1], T[3]].join('');
    const say = T[0] === '（' ? `${v(1)} 公斤和 ${v(3)} 公斤先合起來，再乘 ${v(6)}。` : sym === '＋×' ? `原有 ${v(0)} 公斤，再運來 ${v(4)} 批，每批 ${v(2)} 公斤。` : sym === '－×' ? `原有 ${v(0)} 公斤，運走 ${v(4)} 批，每批 ${v(2)} 公斤。` : sym === '×＋' ? `每批 ${v(0)} 公斤，運來 ${v(2)} 批，再加 ${v(4)} 公斤。` : sym === '÷－' ? `${v(0)} 公斤，每 ${v(2)} 公斤裝一包，再送出 ${v(4)} 包。` : `原有 ${v(0)} 包，再把 ${v(2)} 公斤每 ${v(4)} 公斤裝一包。`;
    const draw = mark => T.map((t, i) => typeof t === 'string' ? (ops2.includes(i) ? `<button class="op6 mop" data-at="${i}" data-ok="${(mark === 0 && i === q.first) || (mark === 1 && i === second) ? 1 : 0}">${t}${i === q.first && mark >= 1 ? '<small>①</small>' : i === second && mark >= 2 ? '<small>②</small>' : ''}</button>` : `<b>${t}</b>`) : `<b class="num">${t.t}</b>`).join('');
    frame(`${q.ctx}：${say}<br>依照事情的先後，點先算的符號。`, `<div class="expr6" id="ee">${draw(0)}</div><div class="trail" id="ct">點運算符號</div>${padHidden()}`);
    const ask = () => stepKeypad(['第 ① 步的答案是？（可以按小數點）', '第 ② 步的答案是？'], [q.mid, q.ans], `先算有括號的、乘除的那一段，等於 ${q.mid}。`, `對了！先算 ${q.mid}，最後是 ${q.ans}。分數、小數和整數一樣：有括號先算括號，先乘除、後加減。`, 'order', st => { setEl('ee', `<b class="num">${q.mid}</b> 算好了`); }, D2);
    if (isFast(q)) { setEl('ee', draw(2)); return afterAct(ask); }
    let mark = 0;
    const bind = () => document.querySelectorAll('.mop').forEach(b => b.onclick = () => { if (b.dataset.ok === '1') { mark++; sfx.hop(); setMsg(''); setEl('ee', draw(mark)); if (mark === 2) { setEl('ct', '順序排好了'); afterAct(ask); } else { setEl('ct', '接著呢？'); bind(); } } else { sfx.retry(); setMsg(`想想事情的先後：${T[0] === '（' ? '括號裡的合起來要先做。' : '要先把每批或每包算出來。'}`, 'hint'); } });
    return bind();
  }
  if (q.mode === 'fdeq') {
    const c = q.c, line = k => { let s = `<svg class="g5" viewBox="0 0 320 76"><line x1="20" x2="300" y1="40" y2="40" stroke="#33405a" stroke-width="3"/>`; for (let i = 0; i <= 10; i++) { const x = 20 + 28 * i; s += `<line x1="${x}" x2="${x}" y1="28" y2="40" stroke="#3b82c4" stroke-width="2"/>${i % 5 === 0 ? `<text x="${x}" y="22" text-anchor="middle" class="pt">${i / 10}</text>` : ''}`; } for (let i = 0; i <= q.n; i++) { const x = 20 + 280 * i / q.n; s += `<line x1="${x}" x2="${x}" y1="40" y2="52" stroke="#d6476b" stroke-width="2"/>`; } const px = 20 + 280 * k / q.n; return s + `<circle cx="${px}" cy="40" r="9" fill="#ffd65a" stroke="#2f5f9e" stroke-width="3"/><text x="20" y="70" text-anchor="middle" class="pt">0</text><text x="300" y="70" text-anchor="middle" class="pt">1</text></svg>`; };
    frame(q.toF ? `${c.e} ${q.ctx}量到 ${q.d} ${c.un}。拖黃鈕到這裡。<br>紅線把 1 切成 ${q.n} 份，這是幾分之幾？` : `${c.e} ${q.ctx}量到 ${fracHtml(q.a, q.n)} ${c.un}。拖黃鈕到這裡。<br>對上面的藍線看，這是小數多少？`, `<div id="bb">${line(0)}</div><div class="trail" id="ct">上面藍線是小數，下面紅線是分數</div><div id="sl"></div>${padHidden()}`);
    return explore(q, { id: 'sl', lo: 0, hi: q.n, start: 0, target: q.a, draw: k => { setEl('bb', line(k)); setEl('ct', `紅線第 ${k} 格`); }, ask: () => { holdPad(); gate(q, ['對照藍線的小數'], 1, () => setEl('ct', `同一個位置：${q.a}/${q.n}＝${q.d}`), () => q.toF ? stepKeypad(['分子是？', '分母是？'], [q.a, q.n], `紅線把 1 切成 ${q.n} 份，黃鈕在第 ${q.a} 格。`, `對了！${q.d}＝${q.a}/${q.n}。同一個位置，可以有兩個名字。`, 'fdeq') : stepKeypad([`小數是多少？（也可以 ${q.a}÷${q.n}）`], [q.d], `${q.a}÷${q.n}。`, `對了！${q.a}/${q.n}＝${q.d}。同一個位置，可以有兩個名字。`, 'fdeq', null, D2)); } });
  }
  if (q.mode === 'cancel') {
    const c = q.c, [xa, xn] = Logic.simp(Math.round(q.x * 100), 100), [ya, yn] = Logic.simp(Math.round(q.y * 100), 100);
    const lines = [`${q.x} × ${q.a}/${q.n} ÷ ${q.y}`, `${xa}/${xn} × ${q.a}/${q.n} ÷ ${ya}/${yn}`, `${xa}/${xn} × ${q.a}/${q.n} × ${yn}/${ya}`];
    frame(`${q.ctx}：${q.x} ${c.un}的 ${fracHtml(q.a, q.n)}，每${c.box} ${q.y} ${c.un}，<br>可以分幾${c.box}？小數、分數混在一起，先統一。`, `<div class="expr6" id="ee"><b class="num">${lines[0]}</b></div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, ['小數都換成分數', '除換成乘倒數', '上下一樣的約掉'], 3, k => { if (k < 3) setEl('ee', `<b class="num">${lines[k]}</b>`); setEl('ct', k === 1 ? '全都是分數了' : k === 2 ? '現在全都是乘法' : '分子分母一起看，約掉共同的因數'); }, () => stepKeypad([`算出來是幾${c.box}？`], [q.ans], `把分子都乘起來、分母都乘起來，再約分。`, `對了！${lines[2]}＝${q.ans}。除可以看成乘倒數，乘除就能一起約分。`, 'cancel'));
  }
  if (q.mode === 'word') {
    frame(`${q.say}`, `<div id="bb"></div><div class="trail" id="ct">先想事情的先後</div>${padHidden()}`);
    const [k1, p] = q.bars;
    setEl('bb', barRow(k1, 1, '#a9d0f0'));
    return gate(q, ['排出全部', '再做最後一步'], 2, k => { if (k === 1) { setEl('bb', barRow(k1, k1, '#a9d0f0')); setEl('ct', `一共 ${k1} 份`); } else { setEl('bb', barRow(k1 * p, k1 * p, groupCol(k1))); setEl('ct', q.how); } }, () => stepKeypad(q.ask, q.steps, q.how, `對了！${q.how}：${q.steps.join('，再得 ')}。一步一步來，不一定要併成一個式子。`, 'word', null, D2));
  }
  if (q.mode === 'est') {
    const c = q.c;
    frame(`${c.e} ${c.thing}每${c.sh} ${q.a} ${c.un}，要 ${q.n} ${c.sh}。<br>有 ${fmt(q.have)} ${c.un}，${c.un === '元' ? '夠買嗎' : '裝得下嗎'}？先想成好算的數。`, `<div class="expr6" id="ee"><b class="num">${q.a} × ${q.n}</b></div><div class="trail" id="ct"></div>`);
    return gate(q, [`${q.a} 取到整百`, `${q.n} 取到整十`], 2, k => { setEl('ee', `<b class="num">${k === 1 ? `${q.A} × ${q.n}` : `${q.A} × ${q.B} ＝ ${fmt(q.est)}`}</b>`); setEl('ct', k === 1 ? `${q.a} 大約 ${q.A}` : `大約 ${fmt(q.est)} ${c.un}`); }, () => pick6(['夠', '不夠'], q.ans === '夠' ? 0 : 1, `比比看 ${fmt(q.have)} 和 ${fmt(q.est)}。`, `對了！大約要 ${fmt(q.est)} ${c.un}，有 ${fmt(q.have)} ${c.un}，${q.ans}。不用算到精確，概數就能判斷。`, 'est'));
  }
  const c = q.c, f = q.f.t, thing = c.thing;
  frame(`每${thing.slice(0, 1)} ${f} ${c.un}。甲組 ${q.a} ${thing}，乙組 ${q.b} ${thing}。<br>全部幾${c.un}？分開算太麻煩，合起來想。`, `<div id="bb"></div><div class="trail" id="ct"></div>${padHidden()}`);
  setEl('bb', `<div class="hz6"><div style="flex:${q.a}">${barRow(q.a, q.a, '#f0a03c')}</div><div style="flex:${q.b}">${barRow(q.b, q.b, '#6ea8dc')}</div></div>`);
  gate(q, ['把兩組排在一起', '看成同一組'], 2, k => { if (k === 1) setEl('ct', `${f}×${q.a}＋${f}×${q.b}`); else { setEl('bb', barRow(q.n, q.n, '#3fae5a')); setEl('ct', `${f}×（${q.a}＋${q.b}）`); } }, () => stepKeypad(['合起來幾' + thing.slice(0, 1) + '？', `全部幾${c.un}？（可以按小數點）`], [q.n, q.ans], `每${thing.slice(0, 1)}的量×${thing.slice(0, 1)}數。`, `對了！${f}×${q.n}＝${q.ans}。分數、小數和整數一樣，都能用分配律。`, 'dist', null, D2));
}

/* ---------- 十：燃料槽工廠 ---------- */
function isoSvg(a, b, c, shown, col) { // 一塊一塊的積木（由下往上）
  const u = Math.min(24, 180 / (a + b)), dx = u * .87, dy = u * .5, h = u, W = (a + b) * dx, H = (a + b) * dy + c * h, cc = col || ['#a9d0f0', '#6ea8dc', '#3f7fbe'];
  const P = (x, y, z) => [(x - y) * dx + b * dx + 4, (x + y) * dy - z * h + c * h + 4], q = pts => pts.map(p => p.join(',')).join(' ');
  let s = `<svg class="iso6" viewBox="0 0 ${W + 8} ${H + 8}">`, k = 0;
  const total = shown === undefined ? a * b * c : shown;
  for (let z = 0; z < c; z++) for (let y = 0; y < b; y++) for (let x = 0; x < a; x++) { if (k++ >= total) continue; s += `<polygon points="${q([P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)])}" fill="${cc[0]}" stroke="#33405a"/><polygon points="${q([P(x, y + 1, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x, y + 1, z)])}" fill="${cc[1]}" stroke="#33405a"/><polygon points="${q([P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x + 1, y, z)])}" fill="${cc[2]}" stroke="#33405a"/>`; }
  return s + '</svg>';
}
function cylSvg(k, h) { // 圓盤一層層疊
  const n = Math.max(k, 1), th = Math.min(16, 110 / h); let s = `<svg class="g5" style="max-height:170px" viewBox="0 0 200 ${th * h + 56}">`, bottom = th * h + 34;
  for (let i = 0; i < k; i++) { const y = bottom - i * th; s += `<path d="M30 ${y - th}V${y}A70 20 0 0 0 170 ${y}V${y - th}Z" fill="${i % 2 ? '#a9d0f0' : '#6ea8dc'}" stroke="#33405a"/>`; }
  const ty = bottom - k * th;
  return s + `<ellipse cx="100" cy="${ty}" rx="70" ry="20" fill="#ffd65a" stroke="#33405a" stroke-width="2"/></svg>`;
}
function triStack(k, h, st) { // st 0 長方形；1 切一半；2 疊上去
  if (st < 2) return `<svg class="g5" style="max-height:150px" viewBox="0 0 220 130"><rect x="20" y="10" width="180" height="110" fill="${st ? '#fff8e6' : '#ffd65a'}" stroke="#33405a" stroke-width="2"/>${st ? `<polygon points="20,120 200,120 20,10" fill="#ffd65a" stroke="#33405a" stroke-width="2"/><line x1="20" y1="120" x2="200" y2="10" stroke="#d6476b" stroke-width="3" stroke-dasharray="6 5"/>` : ''}</svg>`;
  const th = Math.min(13, 72 / h); let s = `<svg class="g5" style="max-height:170px" viewBox="0 0 220 ${th * h + 90}">`, B = th * h + 84;
  for (let i = 0; i < k; i++) { const y = B - i * th; s += `<polygon points="20,${y} 170,${y} 170,${y - th} 20,${y - th}" fill="${i % 2 ? '#a9d0f0' : '#6ea8dc'}" stroke="#33405a"/><polygon points="170,${y} 205,${y - 60} 205,${y - 60 - th} 170,${y - th}" fill="#3f7fbe" stroke="#33405a"/>`; }
  const t = B - k * th;
  return s + `<polygon points="20,${t} 170,${t} 205,${t - 60}" fill="#ffd65a" stroke="#33405a" stroke-width="2"/></svg>`;
}
function viewPrism(q) {
  const e = q.c.e || '';
  if (q.mode === 'stack') {
    frame(`${e} ${q.ctx}底面長 ${q.a} 公分、寬 ${q.b} 公分，高 ${q.h} 公分。<br>有多大？往右拖，一層一層往上疊。`, `<div class="vs6" id="bb">${isoSvg(q.a, q.b, q.h, q.a * q.b)}</div><div class="trail" id="ct">底面先鋪 1 層</div>${padHidden()}`);
    return gate(q, '再疊一層', q.h - 1, k => { setEl('bb', isoSvg(q.a, q.b, q.h, q.a * q.b * (k + 1))); setEl('ct', `疊了 ${k + 1} 層`); }, () => stepKeypad(['每一層是幾立方公分？', `${q.h} 層是幾立方公分？`], [q.base2, q.ans], `底面積就是一層，每層的量×層數。`, `對了！${q.base2}×${q.h}＝${q.ans} 立方公分。體積＝底面積×高，就是每層的量×層數。`, 'stack'), { el: document.getElementById('bb'), map: x => x * (q.h - .6) });
  }
  if (q.mode === 'tri') {
    frame(`${e} ${q.ctx}的底面是直角三角形，兩條直角邊 ${q.w} 公分、${q.d} 公分，高 ${q.h} 公分。<br>有多大？先看底面。`, `<div id="bb">${triStack(0, q.h, 0)}</div><div class="trail" id="ct">補成長方形比較好看</div>${padHidden()}`);
    return gate(q, ['沿對角線切一半', '往上疊到高'], 2, k => { setEl('bb', k === 1 ? triStack(0, q.h, 1) : triStack(q.h, q.h, 2)); setEl('ct', k === 1 ? `長方形 ${q.whole} 平方公分，切一半才是底面` : `每一層都是這個三角形，疊了 ${q.h} 層`); }, () => stepKeypad(['底面積是幾平方公分？', '體積是幾立方公分？'], [q.base2, q.ans], `三角形是長方形的一半；底面積×高。`, `對了！${q.base2}×${q.h}＝${q.ans} 立方公分。不管底面什麼形狀，體積都是底面積×高。`, 'tri'));
  }
  if (q.mode === 'cyl') {
    frame(`${e} ${q.ctx}底面半徑 ${q.r} 公分，高 ${q.h} 公分。<br>有多大？往右拖，圓盤一層一層疊。`, `<div id="bb">${cylSvg(0, q.h)}</div><div class="trail" id="ct">黃色是底面的圓</div>${padHidden()}`);
    return gate(q, '再疊一層', q.h, k => { setEl('bb', cylSvg(k, q.h)); setEl('ct', `疊了 ${k} 層，每層高 1 公分`); }, () => stepKeypad(['底面積是幾平方公分？', '體積是幾立方公分？'], [q.base2, q.ans], `半徑×半徑×3.14，再×${q.h} 層。`, `對了！${q.base2}×${q.h}＝${q.ans} 立方公分。圓柱也是底面積×高。`, 'cyl', null, D2), { el: document.getElementById('bb'), map: x => x * (q.h + .4) });
  }
  if (q.mode === 'net') {
    const w = q.c.what, pic = (t, tops) => { const W = 200 * t / 4 + 10; return `<svg class="g5" style="max-height:190px" viewBox="0 0 320 180"><rect x="60" y="50" width="${W}" height="80" fill="${t >= 4 ? '#a9d0f0' : '#d3e6f6'}" stroke="#33405a" stroke-width="2"/><text x="${60 + W / 2}" y="96" text-anchor="middle" class="pt">${t ? q.c.ctx : ''}</text>${t < 4 ? `<ellipse cx="${60 + W}" cy="90" rx="26" ry="42" fill="#6ea8dc" stroke="#33405a" stroke-width="2"/>` : ''}${tops ? `<circle cx="160" cy="26" r="24" fill="#ffd65a" stroke="#33405a" stroke-width="2"/><circle cx="160" cy="154" r="24" fill="#ffd65a" stroke="#33405a" stroke-width="2"/>` : ''}</svg>`; };
    frame(`${e} 圓柱直徑 ${q.d} 公分、高 ${q.h} 公分。<br>${w}要多大？拖黃鈕，把側面攤開。`, `<div id="bb">${pic(0)}</div><div class="trail" id="ct"></div><div id="sl"></div>${padHidden()}`);
    return explore(q, { id: 'sl', lo: 0, hi: 4, start: 0, target: 4, draw: t => { setEl('bb', pic(t)); setEl('ct', t === 4 ? `攤成長方形！長就是底面的圓周，寬就是高 ${q.h} 公分` : '慢慢拉開'); }, ask: () => { holdPad(); gate(q, '放上兩個底面', 1, () => { setEl('bb', pic(4, true)); setEl('ct', '上下各一個圓'); }, () => stepKeypad(['長方形的長（底面的圓周）是幾公分？', '側面是幾平方公分？', `加上兩個底面（每個 ${q.one}），全部幾平方公分？`], [q.C, q.side, q.ans], `圓周×高，再加兩個圓。`, `對了！${q.side}＋${q.one}×2＝${q.ans} 平方公分。圓柱的側面攤開是長方形。`, 'net', null, D2)); } });
  }
  if (q.mode === 'surf') {
    const faces = q.sort === 'rect' ? [['上', q.a, q.b], ['下', q.a, q.b], ['前', q.a, q.h], ['後', q.a, q.h], ['左', q.b, q.h], ['右', q.b, q.h]] : [['上', q.a, q.b, 1], ['下', q.a, q.b, 1], ['側面 1', q.a, q.h], ['側面 2', q.b, q.h], ['側面 3', q.cc, q.h]];
    const area = f => f[3] ? f[1] * f[2] / 2 : f[1] * f[2];
    frame(q.sort === 'rect' ? `${e} 箱子長 ${q.a}、寬 ${q.b}、高 ${q.h} 公分。<br>每一面都要包。點每一面，看有多大。` : `${e} 三角柱底面是直角三角形，三邊 ${q.a}、${q.b}、${q.cc} 公分，高 ${q.h} 公分。<br>點每一面，看有多大。`, `<div class="faces6">${faces.map((f, i) => `<button class="face6" data-f="${i}"><b>${f[0]}</b><small>${f[3] ? '三角形 ' : ''}${f[1]}×${f[2]}${f[3] ? '÷2' : ''}</small><em class="num"></em></button>`).join('')}</div><div class="trail" id="ct">還沒看</div>${padHidden()}`);
    return tapN(q, '.face6', faces.length, (el, k) => { const f = faces[+el.dataset.f]; el.querySelector('em').textContent = area(f); setEl('ct', `看了 ${k} 面`); }, () => stepKeypad(['上下兩個底面合起來幾平方公分？', '全部幾平方公分？'], [q.two, q.ans], `把每一面都加起來，別漏掉。`, `對了！${q.two}＋${q.side}＝${q.ans} 平方公分。側面合起來也可以看成底面的周長×高。`, 'surf'));
  }
  frame(q.hollow ? `${e} ${q.ctx}：大塊長 ${q.a}、寬 ${q.b}、高 ${q.H} 公分，<br>中間挖穿一個長 ${q.x}、寬 ${q.y} 的洞。還剩多少？` : `${e} ${q.ctx}：下層長 ${q.a}、寬 ${q.b}、高 ${q.h1} 公分，<br>上層長 ${q.x}、寬 ${q.y}、高 ${q.h2} 公分。全部多少？`, `<div class="vs6 two" id="bb"></div><div class="trail" id="ct"></div>${padHidden()}`);
  gate(q, q.hollow ? ['先算完整的大塊', '再拿掉洞'] : ['先看下層', '再看上層'], 2, k => { if (q.hollow) { setEl('bb', isoSvg(q.a, q.b, q.H) + (k > 1 ? isoSvg(q.x, q.y, q.H, undefined, ['#f4a9a0', '#e77f70', '#c95f50']) : '')); setEl('ct', k === 1 ? `大塊 ${q.a}×${q.b}×${q.H}` : `紅色的洞也是柱體，要減掉`); } else { setEl('bb', isoSvg(q.a, q.b, q.h1) + (k > 1 ? isoSvg(q.x, q.y, q.h2, undefined, ['#f7dc8c', '#f0c040', '#d6a020']) : '')); setEl('ct', k === 1 ? `下層 ${q.a}×${q.b}×${q.h1}` : `上層 ${q.x}×${q.y}×${q.h2}`); } }, () => stepKeypad([q.hollow ? '大塊是幾立方公分？' : '下層是幾立方公分？', q.hollow ? '洞是幾立方公分？' : '上層是幾立方公分？', q.hollow ? '還剩幾立方公分？' : '全部幾立方公分？'], [q.p1, q.p2, q.ans], q.hollow ? '大的減掉洞。' : '兩個柱體加起來。', `對了！${q.p1}${q.hollow ? '－' : '＋'}${q.p2}＝${q.ans} 立方公分。拆成兩個柱體就會算。`, 'comp'));
}

/* ---------- 十一：補給比較室 ---------- */
function viewBase(q) {
  const c = q.c, un = c.un;
  if (q.mode === 'read') {
    const baseName = q.baseA ? c.A : c.B, other = q.baseA ? c.B : c.A, u = Math.max(q.a, q.b);
    const bars = cut => `<div class="bin barbin" data-b="A"><small>${c.A} ${q.A} ${un}</small><div style="width:${q.a / u * 100}%">${barRow(cut ? q.a : 1, cut ? q.a : 1, '#f0a03c')}</div></div><div class="bin barbin" data-b="B"><small>${c.B} ${q.B} ${un}</small><div style="width:${q.b / u * 100}%">${barRow(cut ? q.b : 1, cut ? q.b : 1, '#6ea8dc')}</div></div>`;
    frame(`${c.A} ${q.A} ${un}，${c.B} ${q.B} ${un}。<br>${other}是${baseName}的幾分之幾？把「1」貼到當基準的那一條。`, `<div id="bb">${bars(false)}</div><div class="toks6" id="tt"><span class="tok" data-to="${q.baseA ? 'A' : 'B'}">當作 1</span></div><div class="trail" id="ct">拖到長條上</div>${padHidden()}`);
    const ask = () => { holdPad(); gate(q, [`每 ${Math.round((q.baseA ? q.A : q.B) / (q.baseA ? q.a : q.b))} ${un}切一格`], 1, () => { setEl('bb', bars(true)); setEl('ct', `${baseName}是 ${q.sn} 格，${other}是 ${q.sa} 格`); }, () => stepKeypad(['比值的分子是？', '分母是？'], [q.sa, q.sn], `基準${baseName}是分母。`, `對了！${other}（比較量）÷${baseName}（基準量）＝${q.sa}/${q.sn}。「的」前面那個是基準。`, 'read')); };
    if (isFast(q)) { document.getElementById('tt').innerHTML = ''; return afterAct(ask); }
    return dragTok(document.getElementById('stage'), (t, b) => { if (b.dataset.b === t.dataset.to) { sfx.ok(); t.remove(); setMsg(''); setEl('ct', `${baseName}當作 1`); return afterAct(ask); } sfx.retry(); R.tries++; setMsg(`「${other}是${baseName}的幾分之幾」，要和${baseName}比。`, 'hint'); });
  }
  if (q.mode === 'swap') {
    const u = Math.max(q.a, q.b), pic = (hiA, cut) => `<small>${c.A}${hiA ? '（當作 1）' : ''}</small><div style="width:${q.a / u * 100}%">${barRow(q.a, q.a, '#f0a03c')}</div><small>${c.B}${hiA ? '' : '（當作 1）'}</small><div style="width:${q.b / u * 100}%">${barRow(q.b, q.b, '#6ea8dc')}</div>`;
    frame(`${c.A} ${q.A} ${un}，${c.B} ${q.B} ${un}。<br>${c.B}當 1 時，${c.A}是 ${fracHtml(q.a, q.b)}。換${c.A}當 1 呢？`, `<div id="bb">${pic(false)}</div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, [`看現在誰當 1`, `交換，改用${c.A}當 1`], 2, k => { setEl('bb', pic(k === 2)); setEl('ct', k === 1 ? `${c.B} ${q.b} 格當分母` : `現在${c.A} ${q.a} 格當分母`); }, () => stepKeypad([`${c.B}是${c.A}的幾分之幾？分子是？`, '分母是？'], [q.b, q.a], `分母換成${c.A}的 ${q.a} 格。`, `對了！${q.a}/${q.b} 和 ${q.b}/${q.a}：交換基準，比值就上下顛倒。`, 'swap'));
  }
  if (q.mode === 'cmp') {
    const rows = Math.ceil(q.p / q.d);
    frame(`${c.B} ${q.B} ${un}，${c.A}是${c.B}的 ${fracHtml(q.p, q.d)}。<br>${c.A}有多少？`, `<div id="bb">${barRow(1, 1, '#6ea8dc')}</div><div class="trail" id="ct">這條是${c.B}，當作 1</div>${padHidden()}`);
    return gate(q, [`切成 ${q.d} 份`, `取 ${q.p} 份`], 2, k => { if (k === 1) { setEl('bb', barRow(q.d, q.d, '#6ea8dc')); setEl('ct', `每份是 ${q.B}÷${q.d}`); } else { let h = barRow(q.d, q.d, '#6ea8dc'); for (let r = 0; r < rows; r++) h += barRow(q.d, Math.min(q.d, q.p - r * q.d), '#f0a03c'); setEl('bb', h); setEl('ct', `橘色是${c.A}，${q.p} 份`); } }, () => stepKeypad([`每份幾${un}？`, `${c.A}幾${un}？`], [q.each, q.ans], `${q.B} 切 ${q.d} 份，每份的量×${q.p} 份。`, `對了！${q.each}×${q.p}＝${q.ans} ${un}，就是 ${q.B}×${q.p}/${q.d}。比較量＝基準量×比值。`, 'cmp'));
  }
  if (q.mode === 'findbase') {
    frame(`${c.A} ${q.part} ${un}，是${c.B}的 ${fracHtml(q.p, q.d)}。<br>${c.B}有多少？${c.B}切 ${q.d} 份，${c.A}占 ${q.p} 份。`, `<div id="bb">${barRow(1, 1, '#f0a03c')}</div><div class="trail" id="ct">這條是${c.A}，${q.part} ${un}</div>${padHidden()}`);
    return gate(q, [`把${c.A}切成 ${q.p} 份`, `接成${c.B}的 ${q.d} 份`], 2, k => { if (k === 1) { setEl('bb', barRow(q.p, q.p, '#f0a03c')); setEl('ct', `每份 ${q.part}÷${q.p}`); } else { const n = Math.max(q.p, q.d); setEl('bb', barRow(n, q.p, '#f0a03c') + barRow(n, q.d, '#6ea8dc')); setEl('ct', `每份一樣大，藍色是${c.B}，${q.d} 份`); } }, () => stepKeypad([`每份幾${un}？`, `${c.B}幾${un}？`], [q.each, q.ans], `${q.part} 平分成 ${q.p} 份，再有 ${q.d} 份。`, `對了！${q.each}×${q.d}＝${q.ans} ${un}。先找一份，再乘份數。`, 'findbase'));
  }
  const dn = q.sign < 0;
  frame(`${c.A} ${q.B} ${un}，${c.B}比${c.A}${dn ? '少' : '多'} ${fracHtml(q.p, q.d)}（${q.pct}%）。<br>${c.B}是多少？`, `<div id="bb">${barRow(1, 1, '#6ea8dc')}</div><div class="trail" id="ct">這條是${c.A}，當作 1</div>${padHidden()}`);
  gate(q, [`切成 ${q.d} 份`, dn ? `去掉 ${q.p} 份` : `多接 ${q.p} 份`], 2, k => { if (k === 1) { setEl('bb', barRow(q.d, q.d, '#6ea8dc')); setEl('ct', `每份是 ${q.each} ${un}`); } else if (dn) { setEl('bb', barRow(q.d, q.d, i => i < q.d - q.p ? '#6ea8dc' : '#f4a9a0')); setEl('ct', `紅色去掉，剩 ${q.d - q.p} 份`); } else { setEl('bb', barRow(q.d + q.p, q.d + q.p, i => i < q.d ? '#6ea8dc' : '#3fae5a')); setEl('ct', `綠色多接上去，共 ${q.d + q.p} 份`); } }, () => stepKeypad([`每份幾${un}？`, `${c.B}幾${un}？`], [q.each, q.ans], `變化的部分要看「${c.A}」的幾分之幾。`, `對了！${q.each}×${q.d + q.sign * q.p}＝${q.ans} ${un}。${c.B}是${c.A}的 ${q.d + q.sign * q.p}/${q.d}。`, 'change'));
}

/* ---------- 十二：星圖繪製室 ---------- */
function shapeSvg(sh, a, b, k, gridOn, tag) { // 在格子上畫 a×b（×k）的圖形
  const u = 24, W = 300, H = 170; let s = `<svg class="g5" style="max-height:190px" viewBox="0 0 ${W} ${H}">`;
  if (gridOn) { for (let i = 0; i <= W / u; i++) s += `<line x1="${i * u}" x2="${i * u}" y1="0" y2="${H}" stroke="#e4e8ef"/>`; for (let i = 0; i <= H / u; i++) s += `<line y1="${i * u}" y2="${i * u}" x1="0" x2="${W}" stroke="#e4e8ef"/>`; }
  const big = Math.max(a, b) * k * u, fit = big > 160 ? 160 / big : 1, un = u * fit, w = a * k * un, h = b * k * un;
  if (sh === 'tri') s += `<polygon points="4,${4 + h} ${4 + w},${4 + h} 4,4" fill="#a9d0f0" stroke="#33405a" stroke-width="2"/>`;
  else if (sh === 'circle') s += `<circle cx="${4 + w / 2}" cy="${4 + w / 2}" r="${w / 2}" fill="#a9d0f0" stroke="#33405a" stroke-width="2"/>`;
  else s += `<rect x="4" y="4" width="${w}" height="${h}" fill="#a9d0f0" stroke="#33405a" stroke-width="2"/>`;
  return s + (tag ? `<text x="${W - 6}" y="${H - 8}" text-anchor="end" class="pt">${tag}</text>` : '') + '</svg>';
}
function viewScale(q) {
  const e = q.c ? q.c.e : '';
  if (q.mode === 'zoom') {
    frame(`${e} ${q.ctx}長 ${q.a} 公分、寬 ${q.b} 公分，要做 ${q.k} 倍放大圖。<br>拖黃鈕放大。`, `<div id="bb"></div><div class="trail" id="ct"></div><div id="sl"></div>${padHidden()}`);
    return explore(q, { id: 'sl', lo: 1, hi: 5, start: 1, target: q.k, draw: k => { setEl('bb', shapeSvg('rect', q.a, q.b, k, true, `${k} 倍`)); setEl('ct', `長 ${q.a * k}、寬 ${q.b * k} 公分`); }, ask: () => { holdPad(); gate(q, ['量新的長', '量新的寬'], 2, k => setEl('ct', k === 1 ? `長變 ${q.k} 倍` : `寬也變 ${q.k} 倍`), () => stepKeypad(['新的長是幾公分？', '新的寬是幾公分？'], [q.A, q.B], `每條邊都變 ${q.k} 倍。`, `對了！長 ${q.A}、寬 ${q.B} 公分。放大圖每條邊都乘同一個倍數。`, 'zoom')); } });
  }
  if (q.mode === 'keep') {
    const [a, b] = q.sh === 'circle' ? [2, 2] : q.sh === 'tri' ? [3, 2] : [3, 2];
    frame(`${e} 把${q.ctx}上的${q.sh === 'circle' ? '圓' : q.sh === 'tri' ? '直角三角形' : '長方形'}放大 ${q.k} 倍。<br>拖黃鈕，看什麼變了、什麼沒變。`, `<div id="bb"></div><div class="trail" id="ct"></div><div id="sl"></div>`);
    return explore(q, { id: 'sl', lo: 1, hi: 3, start: 1, target: q.k, draw: k => { setEl('bb', shapeSvg(q.sh, a, b, k, true, `${k} 倍`)); setEl('ct', q.sh === 'circle' ? `直徑 ${a * k}，形狀呢？` : `邊長 ${a * k}、${b * k}，角呢？`); }, ask: () => gate(q, ['把新舊疊起來比角', '比邊的長度'], 2, k => setEl('ct', q.sh === 'circle' ? (k === 1 ? '每個方向都放大一樣多' : '還是圓滾滾的') : (k === 1 ? '直角還是直角，角沒有變' : `每條邊都是原來的 ${q.k} 倍`)), () => pick6(q.options, q.options.indexOf(q.right), '疊起來比一比。', q.sh === 'circle' ? '對了！圓放大還是圓，每個方向都放大一樣多。' : `對了！放大時，對應角一樣大，對應邊變 ${q.k} 倍，還是同一類圖形。`, 'keep')) });
  }
  if (q.mode === 'which') {
    const names = ['甲', '乙', '丙'];
    frame(`${e} 原圖長 ${q.a}、寬 ${q.b}。哪一張才是真正的放大圖？<br>點每一張，比長和寬的倍數。`, `<div class="pics6"><div>${shapeSvg('rect', q.a, q.b, 1, false, '原圖').replace('max-height:190px', 'max-height:80px')}</div>${q.opts.map((o, i) => `<button class="face6 pic6" data-p="${i}"><b>${names[i]}</b><small class="num">長 ${o.w}、寬 ${o.h}</small><em></em></button>`).join('')}</div><div class="trail" id="ct">點每一張</div>`);
    return tapN(q, '.pic6', 3, el => { const o = q.opts[+el.dataset.p], f = (x, y) => Number.isInteger(x / y) ? x / y : `${x}/${y}`; el.querySelector('em').innerHTML = nums(`長 ${f(o.w, q.a)} 倍，寬 ${f(o.h, q.b)} 倍`); }, () => pick6(names, q.ans, '長和寬要變成一樣的倍數，形狀才不會歪。', `對了！${names[q.ans]}的長和寬都是 ${q.k} 倍。兩邊倍數不一樣，圖就歪了，不算放大圖。`, 'which'));
  }
  if (q.mode === 'shrink') {
    frame(`${e} ${q.ctx}長 ${q.a} 公分、寬 ${q.b} 公分，要做 ${fracHtml(1, q.k)} 倍縮圖。<br>拖黃鈕縮小。`, `<div id="bb"></div><div class="trail" id="ct"></div><div id="sl"></div>${padHidden()}`);
    return explore(q, { id: 'sl', lo: 1, hi: 5, start: 1, target: q.k, draw: k => { setEl('bb', shapeSvg('rect', q.a / q.k, q.b / q.k, q.k * 1 / k, true, `1/${k} 倍`)); setEl('ct', `每條邊都變成 1/${k}`); }, ask: () => { holdPad(); gate(q, ['切開長', '切開寬'], 2, k => setEl('ct', k === 1 ? `長切成 ${q.k} 份，取 1 份` : `寬也切成 ${q.k} 份，取 1 份`), () => stepKeypad(['新的長是幾公分？', '新的寬是幾公分？'], [q.A, q.B], `每條邊÷${q.k}。`, `對了！${q.a}×1/${q.k}＝${q.A}，${q.b}×1/${q.k}＝${q.B}。縮圖每條邊乘同一個分數。`, 'shrink')); } });
  }
  const m = q.m;
  const mapPic = (cm, rule, u, tag) => { const U = u || 30, x1 = 20, x2 = x1 + q.cm * U; let s = `<svg class="g5" viewBox="0 0 320 110"><rect width="320" height="110" fill="#f6efd9"/><line x1="${x1}" y1="30" x2="${x2}" y2="30" stroke="#d6476b" stroke-width="3" stroke-dasharray="5 4"/><circle cx="${x1}" cy="30" r="6" fill="#33405a"/><circle cx="${x2}" cy="30" r="6" fill="#33405a"/><text x="${x1}" y="18" class="pt">${m.A}</text><text x="${x2}" y="18" text-anchor="middle" class="pt">${m.B}</text>`; if (rule) { s += `<rect x="20" y="58" width="${U * 9.6}" height="34" fill="#fff" stroke="#c9a56a"/>`; for (let i = 0; i <= 9; i++) s += `<line x1="${20 + i * U}" x2="${20 + i * U}" y1="58" y2="70" stroke="#33405a"/><text x="${20 + i * U}" y="86" text-anchor="middle" class="pt">${i}</text>`; s += `<rect x="20" y="58" width="${(cm || 0) * U}" height="6" fill="#ffd65a"/>`; } return s + (tag ? `<text x="312" y="106" text-anchor="end" class="pt">${tag}</text>` : '') + '</svg>'; };
  if (q.mode === 'ruler') {
    frame(`${q.ctx}：每 1 公分代表 ${q.per} 公里。<br>${m.A}到${m.B}實際多遠？拖黃鈕，尺量到${m.B}。`, `<div id="bb">${mapPic(0, true)}</div><div class="trail" id="ct"></div><div id="sl"></div>${padHidden()}`);
    return explore(q, { id: 'sl', lo: 0, hi: 9, start: 0, target: q.cm, draw: k => { setEl('bb', mapPic(k, true)); setEl('ct', `量到 ${k} 公分`); }, ask: () => { holdPad(); gate(q, '一公分一公分換算', 1, () => setEl('ct', `每 1 公分都是 ${q.per} 公里，有 ${q.cm} 公分`), () => stepKeypad(['圖上幾公分？', '實際幾公里？'], [q.cm, q.ans], `每公分代表的公里數×公分數。`, `對了！${q.per}×${q.cm}＝${q.ans} 公里。`, 'ruler')); } });
  }
  if (q.mode === 'mapn') {
    frame(`${q.ctx}上的比例尺是 1：${fmt(q.n)}。<br>${m.A}到${m.B}實際多遠？先用尺量。`, `<div id="bb">${mapPic(0, true)}</div><div class="trail" id="ct"></div><div id="sl"></div>${padHidden()}`);
    return explore(q, { id: 'sl', lo: 0, hi: 9, start: 0, target: q.cm, draw: k => { setEl('bb', mapPic(k, true)); setEl('ct', `量到 ${k} 公分`); }, ask: () => { holdPad(); gate(q, ['讀比例尺', '公分換成公尺'], 2, k => setEl('ct', k === 1 ? `圖上 1 公分，實際 ${fmt(q.n)} 公分` : `${fmt(q.n)} 公分＝${fmt(q.one)} 公尺`), () => stepKeypad(['圖上 1 公分，實際幾公尺？', '實際距離幾公尺？'], [q.one, q.ans], `每 1 公分${fmt(q.one)} 公尺，有 ${q.cm} 公分。`, `對了！${fmt(q.one)}×${q.cm}＝${fmt(q.ans)} 公尺。比例尺就是圖上長和實際長的比。`, 'mapn')); } });
  }
  if (q.mode === 'mis') {
    const U = 130 / Math.max(q.cm1, q.cm2), seg = cm => `<svg class="g5" viewBox="0 0 150 50"><rect width="150" height="50" fill="#f6efd9"/><line x1="8" x2="${8 + cm * U}" y1="26" y2="26" stroke="#d6476b" stroke-width="4"/><circle cx="8" cy="26" r="4" fill="#33405a"/><circle cx="${8 + cm * U}" cy="26" r="4" fill="#33405a"/></svg>`;
    frame(`同一條實際 ${fmt(q.real)} 公尺的路，畫在兩張地圖上。<br>左邊 1：${fmt(q.n1)}，右邊 1：${fmt(q.n2)}。哪一張畫得長？猜完量量看。`, `<div class="pair6"><div id="m1"><small>1：${fmt(q.n1)}</small></div><div id="m2"><small>1：${fmt(q.n2)}</small></div></div><div class="trail" id="ct"></div>`);
    return gate(q, ['畫出左邊', '畫出右邊'], 2, k => { if (k === 1) { setEl('m1', `<small>1：${fmt(q.n1)}</small>${seg(q.cm1)}<b class="num">${q.cm1} 公分</b>`); setEl('ct', `${fmt(q.real * 100)} 公分÷${fmt(q.n1)}`); } else { setEl('m2', `<small>1：${fmt(q.n2)}</small>${seg(q.cm2)}<b class="num">${q.cm2} 公分</b>`); setEl('ct', `${fmt(q.real * 100)} 公分÷${fmt(q.n2)}`); } }, () => pick6(['左邊', '右邊'], q.ans === '左邊' ? 0 : 1, '比兩條線。分母是實際長度分成幾份。', `對了！分母越大，圖上反而越短，因為地圖縮得更小。不是分母大，圖就大。`, 'mis'));
  }
  frame(`${q.ctx}：甲圖 1：${fmt(q.n1)} 上，${m.A}到${m.B}量到 ${q.cm} 公分。<br>換到乙圖 1：${fmt(q.n2)}，量到幾公分？`, `<div class="pair6"><div id="m1"><small>甲 1：${fmt(q.n1)}</small><b class="num">${q.cm} 公分</b></div><div id="m2"><small>乙 1：${fmt(q.n2)}</small><b class="num">？</b></div></div><div class="trail" id="ct"></div>${padHidden()}`);
  gate(q, ['先算實際距離', '再畫到乙圖'], 2, k => setEl('ct', k === 1 ? `實際 ${q.cm}×${fmt(q.n1 / 100)}＝${fmt(q.real)} 公尺` : `乙圖每 1 公分代表 ${fmt(q.n2 / 100)} 公尺`), () => stepKeypad(['實際距離幾公尺？', '乙圖上幾公分？'], [q.real, q.ans], `實際距離不會變，再除以乙圖每公分代表的長度。`, `對了！實際距離相同：${fmt(q.real)}÷${fmt(q.n2 / 100)}＝${q.ans} 公分。乙圖分母是甲的 ${q.n2 / q.n1} 倍，圖上長度變 1/${q.n2 / q.n1}。`, 'twomap'));
}

/* ---------- 十三：任務解謎室 ---------- */
function viewPuzzle(q) {
  if (q.mode === 'hen') {
    const h = q.h;
    frame(`${h.A}和${h.B}共 ${q.n} ${h.un}，${h.part}共 ${q.legs} 個。<br>先當作全是${h.A}，點一下換成${h.B}，${h.part}要剛好。`, `<div class="ani6">${Array.from({ length: q.n }, (_, i) => `<button class="an6" data-a="${i}">${h.ea}</button>`).join('')}</div><div class="trail" id="ct">現在 ${q.all} 個${h.part}，還差 ${q.legs - q.all} 個</div>${padHidden()}`);
    return tapN(q, '.an6', q.b, (el, k) => { el.textContent = h.eb; setEl('ct', `換了 ${k} ${h.un}：${q.all + k * q.gap} 個${h.part}，${k === q.b ? '剛好！' : `還差 ${q.legs - q.all - k * q.gap} 個`}`); }, () => stepKeypad([`每換一${h.un}，多幾個${h.part}？`, `${h.B}有幾${h.un}？`], [q.gap, q.ans], `差 ${q.legs - q.all} 個，每換一${h.un}多 ${q.gap} 個。`, `對了！差 ${q.legs - q.all} 個÷每次 ${q.gap} 個＝${q.ans} ${h.un}${h.B}，${h.A}${q.a} ${h.un}。`, 'hen'));
  }
  if (q.mode === 'sumdiff') {
    const s = q.s, W = q.big + 0, bars = (cut, half) => `<small>${s.A}</small><div style="width:100%">${barRow(q.big, q.big, i => i >= q.small ? (cut ? '#eee' : '#d6476b') : '#f0a03c')}</div><small>${s.B}</small><div style="width:${q.small / q.big * 100}%">${barRow(q.small, q.small, '#6ea8dc')}</div>`;
    frame(`${s.ctx}：共 ${q.total} ${s.un}，${s.A}比${s.B}多 ${q.d} ${s.un}。<br>${s.B}有多少？多的那段先拿開。`, `<div id="bb">${bars(false)}</div><div class="trail" id="ct">紅色是多出來的 ${q.d} ${s.un}</div>${padHidden()}`);
    return gate(q, ['把多的那段剪掉', '剩下的平分'], 2, k => { setEl('bb', bars(true)); setEl('ct', k === 1 ? `剩 ${q.total - q.d} ${s.un}，兩邊一樣長了` : '兩條一樣長，平分'); }, () => stepKeypad([`剪掉後共幾${s.un}？`, `${s.B}幾${s.un}？`], [q.total - q.d, q.ans], `${q.total}－${q.d}，再÷2。`, `對了！（${q.total}－${q.d}）÷2＝${q.ans} ${s.un}，${s.A}再加 ${q.d}。`, 'sumdiff'));
  }
  if (q.mode === 'age') {
    const s = q.s, MAX = q.B + q.yrs + 4;
    frame(`${s.ctx}：今年${s.B} ${q.now} 歲，${s.A} ${q.B} 歲。<br>幾年後${s.A}是${s.B}的 ${q.m} 倍？拖黃鈕往後看。`, `<div id="bb"></div><table class="tb6"><tr><th>${s.A}－${s.B}</th><td class="num" id="d1"></td><th>${s.A}÷${s.B}</th><td class="num" id="d2"></td></tr></table><div class="trail" id="ct"></div><div id="sl"></div>${padHidden()}`);
    return explore(q, { id: 'sl', lo: 0, hi: q.yrs + 3, start: 0, target: q.yrs, draw: y => { const a = q.B + y, b = q.now + y; setEl('bb', `<small>${s.A} ${a} 歲</small><div style="width:${a / MAX * 100}%">${barRow(1, 1, '#f0a03c')}</div><small>${s.B} ${b} 歲</small><div style="width:${b / MAX * 100}%">${barRow(1, 1, '#6ea8dc')}</div>`); setEl('d1', q.gap); const r = a / b; setEl('d2', Number.isInteger(r) ? r : r.toFixed(1)); setEl('ct', `${y} 年後`); }, ask: () => { holdPad(); gate(q, '看什麼沒有變', 1, () => setEl('ct', `不管過幾年，都差 ${q.gap} 歲`), () => stepKeypad([`兩人差幾歲？`, `那時${s.B}幾歲？`], [q.gap, q.ans], `差不變。${s.A}是 ${q.m} 倍時，差就是${s.B}的 ${q.m - 1} 倍。`, `對了！${q.gap}÷${q.m - 1}＝${q.ans} 歲，也就是 ${q.yrs} 年後。年齡的差永遠不變。`, 'age')); } });
  }
  if (q.mode === 'chase') {
    const s = q.s;
    frame(`${s.e} ${s.A}先走，領先 ${q.head} ${s.un}。${s.A}每${s.t} ${q.v1} ${s.un}，${s.B}每${s.t} ${q.v2} ${s.un}。<br>幾${s.t}追上？拖黃鈕看差距。`, `<div id="bb"></div><div class="trail" id="ct"></div><div id="sl"></div>${padHidden()}`);
    const total = q.head + q.v2 * q.ans;
    return explore(q, { id: 'sl', lo: 0, hi: q.ans + 2, start: 0, target: q.ans, draw: t => { const a = q.head + q.v1 * t, b = q.v2 * t; setEl('bb', raceSvg([{ d: a, c: '#d6476b', e: s.e }, { d: b, c: '#3b82c4', e: s.e }], total + q.v2 * 2)); setEl('ct', a > b ? `過 ${t} ${s.t}，還差 ${a - b} ${s.un}` : a === b ? '追上了！' : '超過了'); }, ask: () => { holdPad(); gate(q, '看每次縮多少', 1, () => setEl('ct', `每${s.t}差距縮小 ${q.close} ${s.un}`), () => stepKeypad([`每${s.t}差距縮小幾${s.un}？`, `幾${s.t}追上？`], [q.close, q.ans], `${q.v2}－${q.v1}，再看 ${q.head} 裡面有幾個。`, `對了！${q.head}÷${q.close}＝${q.ans} ${s.t}。追趕只要看差距每次縮多少。`, 'chase')); } });
  }
  if (q.mode === 'stream') {
    const s = q.s, go = q.up ? '逆著' : '順著', sign = q.up ? '－' : '＋';
    const arrow = (L, c, rev) => `<svg class="g5" viewBox="0 0 320 34"><rect x="${rev ? 300 - L * 2.5 : 20}" y="10" width="${L * 2.5}" height="14" fill="${c}"/><polygon points="${rev ? `${300 - L * 2.5 - 14},17 ${300 - L * 2.5},3 ${300 - L * 2.5},31` : `${20 + L * 2.5 + 14},17 ${20 + L * 2.5},3 ${20 + L * 2.5},31`}" fill="${c}"/></svg>`;
    frame(`${s.e} ${s.ctx}：自己的${s.t === '小時' ? '時速' : '速率'} ${q.v} ${s.un}，${s.flow} ${q.f} ${s.un}。<br>${go}${s.flow}走 ${q.t} ${s.t}，能走多遠？`, `<div id="bb"></div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, ['看自己的速率', `加上${s.flow}箭頭`, '合成實際速率'], 3, k => { let h = `<small>自己 ${q.v}</small>${arrow(q.v, '#6ea8dc')}`; if (k >= 2) h += `<small>${s.flow} ${q.f}</small>${arrow(q.f, '#f0a03c', q.up)}`; if (k >= 3) h += `<small>實際 ${q.speed}</small>${arrow(q.speed, '#3fae5a')}`; setEl('bb', h); setEl('ct', k === 3 ? `${q.v}${sign}${q.f}＝${q.speed}` : k === 2 ? (q.up ? '方向相反，被拖慢了' : '方向一樣，被推快了') : ''); }, () => stepKeypad([`實際每${s.t}走幾${s.un}？`, `${q.t} ${s.t}走幾${s.un}？`], [q.speed, q.ans], `${q.up ? '逆著走要減' : '順著走要加'}，再乘時間。`, `對了！${q.speed}×${q.t}＝${q.ans} ${s.un}。順流加、逆流減。`, 'stream'));
  }
  if (q.mode === 'count') {
    const o = q.o;
    frame(`${o.ctx}：${o.a} ${q.a} ${o.ua}、${o.b} ${q.b} ${o.ub}。<br>每個${o.a}點一下，看可以怎麼配。`, `<div class="tree6">${Array.from({ length: q.a }, (_, i) => `<div class="tr6"><button class="op6 tr-b" data-t="${i}">${o.ea}<small class="num">${i + 1}</small></button><span class="tr-l"></span></div>`).join('')}</div><div class="trail" id="ct">還沒配</div>${padHidden()}`);
    return tapN(q, '.tr-b', q.a, (el, k) => { el.parentNode.querySelector('.tr-l').textContent = o.eb.repeat(q.b); setEl('ct', `配了 ${k} 個${o.a}，共 ${k * q.b} 種`); }, () => stepKeypad([`每個${o.a}有幾種配法？`, `全部幾種？`], [q.b, q.ans], `每個${o.a}都配 ${q.b} 種，有 ${q.a} 個。`, `對了！每個${o.a} ${q.b} 種×${q.a} 個＝${q.ans} 種。一步接一步的選法，用乘的。`, 'count'));
  }
  if (q.mode === 'addc') {
    frame(`${q.ctx}：只能選一種。${q.A[0]}有 ${q.a} 種，${q.A[1]}有 ${q.b} 種。<br>點兩邊，看一共幾種。`, `<div class="pair6"><button class="face6 ad6"><b>${q.A[0]}</b><em class="num"></em></button><button class="face6 ad6"><b>${q.A[1]}</b><em class="num"></em></button></div><div class="trail" id="ct">還沒點</div>${padHidden()}`);
    const c = [q.a, q.b];
    return tapN(q, '.ad6', 2, (el, k) => { const i = [...document.querySelectorAll('.ad6')].indexOf(el); el.querySelector('em').textContent = '●'.repeat(c[i]); setEl('ct', '兩邊各自都是一種選法，不會同時選'); }, () => stepKeypad(['一共有幾種選法？'], [q.ans], `選了這邊就不選那邊，合起來數。`, `對了！${q.a}＋${q.b}＝${q.ans} 種。二選一的選法用加的；一步接一步才用乘的。`, 'addc'));
  }
  const slots = q.three ? ['百位', '十位', '個位'] : ['十位', '個位'], o = q.odd.length, d = q.digits.length;
  const pic = st => `<div class="slot6s">${slots.map((n, i) => { const lastFirst = slots.length - 1 - i, shown = st > lastFirst; return `<div class="s6"><small>${n}</small><b class="num">${shown ? (i === slots.length - 1 ? `${q.odd.join('或')}` : `${q.digits.join('或')}`) : '？'}</b></div>`; }).join('')}</div>`;
  frame(`${q.ctx}：用 ${q.digits.join('、')}，可以重複，排${q.three ? '三' : '二'}位奇數。<br>幾種？先決定最挑的那一位。`, `<div id="bb">${pic(0)}</div><div class="trail" id="ct"></div>${padHidden()}`);
  gate(q, q.three ? ['個位要奇數', '十位隨便選', '百位隨便選'] : ['個位要奇數', '十位隨便選'], slots.length, k => { setEl('bb', pic(k)); setEl('ct', k === 1 ? `個位只能是 ${q.odd.join('、')}，${o} 種` : `每種都可以放 ${d} 個數`); }, () => stepKeypad(['個位有幾種？', '全部幾種？'], [o, q.ans], `個位 ${o} 種，其他每位 ${d} 種，一步接一步。`, `對了！${q.three ? `${d}×${d}×${o}` : `${d}×${o}`}＝${q.ans} 種。先處理限制最多的那一位。`, 'odd'));
}

/* ---------- 十四：民意觀測站 ---------- */
const PIE_COL = ['#f0a03c', '#6ea8dc', '#3fae5a', '#d6476b'];
function pie100(parts, opts) { // parts [[名, %], ...]；百格圓形圖，hi 亮第幾塊
  const o = opts || {}, cx = 100, cy = 100, r = 92; let s = `<svg class="g5 pie6" style="max-height:${o.h || 200}px" viewBox="0 0 200 200">`, acc = 0;
  parts.forEach((p, i) => { const a0 = acc / 100 * 2 * Math.PI, a1 = (acc + p[1]) / 100 * 2 * Math.PI; if (p[1] >= 100) s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${PIE_COL[i]}"/>`; else if (p[1] > 0) s += `<path d="M${cx} ${cy}L${cx + r * Math.sin(a0)} ${cy - r * Math.cos(a0)}A${r} ${r} 0 ${p[1] > 50 ? 1 : 0} 1 ${cx + r * Math.sin(a1)} ${cy - r * Math.cos(a1)}Z" fill="${PIE_COL[i]}" fill-opacity="${o.hi === undefined || o.hi === i ? 1 : .35}"/>`; acc += p[1]; });
  for (let i = 0; i < 100; i++) { const a = i / 100 * 2 * Math.PI; s += `<line x1="${cx}" y1="${cy}" x2="${cx + r * Math.sin(a)}" y2="${cy - r * Math.cos(a)}" stroke="#fff" stroke-opacity=".75" stroke-width="${i % 10 ? .5 : 1.2}"/>`; }
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#33405a" stroke-width="2"/>`;
  acc = 0; parts.forEach((p, i) => { const m = (acc + p[1] / 2) / 100 * 2 * Math.PI; if (p[1] >= 10 && !o.nolabel) s += `<text x="${cx + 56 * Math.sin(m)}" y="${cy - 56 * Math.cos(m) + 5}" text-anchor="middle" class="pt" style="font-size:12px;paint-order:stroke;stroke:#fff;stroke-width:3px">${p[0]}</text>`; acc += p[1]; });
  return s + '</svg>';
}
function viewPie(q) {
  if (q.mode === 'read') {
    const p = q.parts[q.i];
    frame(`${q.ctx}：全部 ${q.tot} 人。<br>選「${p[0]}」的有幾人？先點出這一塊。`, `<div id="bb">${pie100(q.parts)}</div><div id="oo"></div><div class="trail" id="ct">整個圓切成 100 小格</div>${padHidden()}`);
    const ask = () => { holdPad(); gate(q, ['數這一塊有幾格'], 1, () => { setEl('bb', pie100(q.parts, { hi: q.i })); setEl('ct', `${p[0]}占 ${p[1]} 格，也就是 ${p[1]}%`); }, () => stepKeypad(['這一塊占幾格？', `每 1 格是幾人？`, `「${p[0]}」有幾人？`], [p[1], q.tot / 100, q.ans], `${q.tot} 人分在 100 格裡；每格的人數×格數。`, `對了！每格 ${q.tot / 100} 人×${p[1]} 格＝${q.ans} 人。`, 'read')); };
    if (isFast(q)) return afterAct(ask);
    return ops(q, 'oo', q.parts.map((x, i) => ({ t: x[0], ok: i === q.i, bad: `題目問的是「${p[0]}」。` })), () => { setEl('oo', ''); setEl('bb', pie100(q.parts, { hi: q.i })); afterAct(ask); });
  }
  if (q.mode === 'make') {
    const P = q.parts;
    frame(`${q.ctx}：${P.map(p => `${p[0]} ${p[1]}%`).join('、')}。<br>在百格圓形圖上，拖出每一塊。`, `<div id="bb"></div><div class="trail" id="ct"></div><div id="sl"></div>`);
    const drawAt = (i, v) => { const rest = 100 - P.slice(0, i).reduce((s, x) => s + x[1], 0) - v, cur = [...P.slice(0, i), [P[i][0], v], ...P.slice(i + 1).map((x, k) => k === 0 ? ['', rest] : ['', 0])]; setEl('bb', pie100(cur, { h: 190 })); setEl('ct', `${P[i][0]}：拖到 ${P[i][1]} 格，現在 ${v} 格`); };
    const ask = () => { setEl('bb', pie100(P, { h: 190 })); const big = P.reduce((a, b) => b[1] > a[1] ? b : a); pick6(P.map(p => p[0]), P.indexOf(big), '看哪一塊最大。', `對了！圓形圖一眼就看出每一部分占全部多少：${big[0]}最多。`, 'make'); };
    const run = i => {
      if (i >= P.length - 1) return ask();
      const rest = 100 - P.slice(0, i).reduce((s, x) => s + x[1], 0);
      setEl('sl', '<div id="s2"></div>');
      explore(q, { id: 's2', lo: 0, hi: rest, step: 5, start: 0, target: P[i][1], draw: v => drawAt(i, v), ask: () => run(i + 1) });
    };
    return run(0);
  }
  if (q.mode === 'pct') {
    const s = q.s, cell = i => { const g = i < q.n * q.times; return `<i style="background:${g ? groupCol(q.times)(i) : '#f4f6fa'}"></i>`; };
    frame(`${s.ctx}：${q.tot} ${s.who}裡，有 ${q.n} ${s.say}。<br>是百分之幾？想成全部變 100 格。`, `<div class="hb6 big" id="bb">${Array.from({ length: 100 }, () => '<i></i>').join('')}</div><div class="trail" id="ct">一共 100 格</div>${padHidden()}`);
    return gate(q, [`平分給 ${q.tot} ${s.who}`, `塗 ${q.n} ${s.who}的格子`], 2, k => { setEl('bb', Array.from({ length: 100 }, (_, i) => k > 1 ? cell(i) : `<i style="background:${groupCol(q.times)(i)};opacity:.35"></i>`).join('')); setEl('ct', k === 1 ? `每 ${s.who} ${q.times} 格` : `塗了 ${q.n} ${s.who}`); }, () => stepKeypad([`每 1 ${s.who}占幾格？`, `${q.n} ${s.who}占幾格（百分之幾）？`], [q.times, q.ans], `100÷${q.tot}，再×${q.n}。`, `對了！${q.n}/${q.tot}＝${q.ans}/100＝${q.ans}%。`, 'pct'));
  }
  if (q.mode === 'which') {
    const mini = kind => { const d = [40, 30, 20, 10]; if (kind === 0) return pie100([['', 40], ['', 30], ['', 20], ['', 10]], { h: 90, nolabel: true }); if (kind === 1) return `<svg class="g5" style="max-height:90px" viewBox="0 0 120 80">${d.map((v, i) => `<rect x="${10 + i * 26}" y="${74 - v * 1.6}" width="20" height="${v * 1.6}" fill="${PIE_COL[i]}"/>`).join('')}</svg>`; return `<svg class="g5" style="max-height:90px" viewBox="0 0 120 80"><polyline points="${[20, 34, 30, 56, 48].map((v, i) => `${10 + i * 25},${74 - v}`).join(' ')}" fill="none" stroke="#d6476b" stroke-width="3"/></svg>`; };
    frame(`${q.t}。<br>要畫統計圖，用哪一種？點每張圖看它擅長什麼。`, `<div class="pics6">${['圓形圖', '長條圖', '折線圖'].map((n, i) => `<button class="face6 ch6" data-c="${i}">${mini(i)}<b>${n}</b><em></em></button>`).join('')}</div><div class="trail" id="ct"></div>`);
    const tips = ['每部分占全部多少', '不同東西比多少', '跟著時間怎麼變'];
    return tapN(q, '.ch6', 3, el => { el.querySelector('em').textContent = tips[+el.dataset.c]; }, () => pick6(['圓形圖', '長條圖', '折線圖'], ['圓形圖', '長條圖', '折線圖'].indexOf(q.a), '這筆資料想看的是什麼？', `對了！${q.why}`, 'which'));
  }
  const L = q.L, data = [[L.A, L.a], [L.B, L.b], [L.C, L.c]], ask = q.ty === 'cmp' ? `${L.A}和${L.C}哪一個比較可能？` : q.ty === 'most' ? '下一次很有可能是什麼？' : '下一次很不可能是什麼？';
  frame(`${q.ctx}：${L.say}。<br>點每一條，看次數，再回答：${ask}`, `<div class="lk6">${data.map((d, i) => `<button class="lk" data-l="${i}"><b>${d[0]}</b><span class="lkb"><i style="width:0"></i></span><em class="num"></em></button>`).join('')}</div><div class="trail" id="ct">從資料的多寡來判斷</div>`);
  tapN(q, '.lk', 3, el => { const d = data[+el.dataset.l]; el.querySelector('i').style.width = `${d[1] / q.tot * 100}%`; el.querySelector('em').textContent = `${d[1]} 次`; }, () => pick6(q.options, q.options.indexOf(q.right), '次數差很多，就看多的那一邊。', `對了！全部 ${q.tot} 次裡，${L.A} ${L.a} 次、${L.C} ${L.c} 次、${L.B} ${L.b} 次，次數差很多，可以這樣說；但這只是比較可能，下一次不一定是。`, 'likely'));
}
Object.assign(VIEWS, { mix: viewMix, prism: viewPrism, base: viewBase, scale: viewScale, puzzle: viewPuzzle, pie: viewPie });
/* ---------- 新概念小故事（鷹架版）：舊經驗 → 對東西做事（示範→一起→自己）→ 先選想法 → 說出規律 → 圖對應到式子 → 命名 → 選對的話 → 選題／拼題 → 驗收（答錯回到出錯那一步） ---------- */
const K1 = '#e07b00', K2 = '#2f6fb0', K3 = '#2e9450', K4 = '#d6476b'; // 全部／每份／有幾份／另一個量：圖和式子同色
// ---- 畫面零件：.hot6 是要點的東西（示範、一起做時會發亮；自己做時不發亮，按提示才出現），.drag6 也可以拖到 .drop6，.no6 點了會說明原因 ----
const it6 = (e, cls, extra) => `<span class="it6 ${cls || ''}" ${extra || ''}>${e}</span>`;
function pile6(e, n, used, lab) { // 一堆東西，可點可拖
  return `<div class="pile6">${lab ? `<small>${lab}</small>` : ''}${Array.from({ length: n }, (_, i) => it6(e, i < used ? 'gone' : i === used ? 'hot6 drag6' : '')).join('')}</div>`;
}
function rows6(e, k, w, lab) { // 放進框裡，每排 w 個；沒排滿的那排標紅
  const r = Math.ceil(k / w); let h = '';
  for (let i = 0; i < r; i++) { const m = Math.min(w, k - i * w); h += `<div class="row6 ${m < w ? 'part' : ''}">${it6(e).repeat(m)}</div>`; }
  return `<div class="drop6">${h || '<span class="ph6">放到這裡</span>'}${lab ? `<small>${lab}</small>` : ''}</div>`;
}
function cut6(parts, done, o) { // 一條東西平均分成 parts 段；自己做時要點出下一刀的位置
  o = o || {};
  let lines = ''; for (let i = 1; i <= done && i < parts; i++) lines += `<i class="cl6" style="left:${i / parts * 100}%"></i>`;
  const live = !o.noCut && done < parts - 1;
  const sc = live ? `<span class="sc6 hot6" style="left:${(done + 1) / parts * 100}%">✂️</span>` : '';
  const fill = o.fill ? Array.from({ length: parts }, (_, i) => `<b style="left:${i / parts * 100}%;width:${100 / parts}%;background:${o.fill(i)}"></b>`).join('') : '';
  return `<div class="cut6" style="width:${o.w || 100}%">${o.lab ? `<small>${o.lab}</small>` : ''}<span class="cb6 ${live ? 'cutme6' : ''}" data-p="${parts}" data-d="${done}" style="background:${o.col || '#f7dc8c'}">${fill}${lines}${sc}</span></div>`;
}
function grp6(n, g, done, o) { // n 格，每 g 格圈一組
  o = o || {}; let h = '';
  for (let s = 0; s < n; s += g) { const gi = s / g, on = gi < done, nx = gi === done && !o.noHot; h += `<span class="g6 ${on ? 'on' : ''} ${nx ? 'hot6' : ''}" style="${on ? `border-color:${o.c || K3}` : ''}">${Array.from({ length: Math.min(g, n - s) }, (_, j) => `<i style="background:${typeof o.cell === 'function' ? o.cell(s + j) : o.cell || '#a9d0f0'}">${o.e || ''}</i>`).join('')}</span>`; }
  return `${o.lab ? `<small class="lab6">${o.lab}</small>` : ''}<div class="grp6">${h}</div>`;
}
function chips6(list, okFn, whyFn) { // 一排選項：對的點了往下走，錯的點了說明原因（自己做時不發亮）
  return `<div class="op6s">${list.map((x, i) => `<button class="op6 ${okFn(x, i) ? 'hot6' : 'no6'}" data-w="${esc(whyFn ? whyFn(x, i) : '這個選項和題目要的不一樣，再讀一次上面的題目。')}">${x}</button>`).join('')}</div>`;
}
function pie6(parts, cuts, taken, o) { // 披薩：平均分成 parts 片、已切 cuts 刀、拿走 taken 片；o.hot 'cut' 或 'take'
  o = o || {}; const r = 44, c = 50; let s = `<svg class="pz6 ${o.hot === 'cut' && cuts < parts ? 'hot6' : ''}" viewBox="0 0 100 100"><circle cx="${c}" cy="${c}" r="${r}" fill="#f7c873" stroke="#a9702a" stroke-width="2"/>`;
  const P = i => [c + r * Math.sin(i / parts * 2 * Math.PI), c - r * Math.cos(i / parts * 2 * Math.PI)];
  for (let i = 0; i < taken; i++) { const [x0, y0] = P(i), [x1, y1] = P(i + 1); s += `<path class="gone" d="M${c} ${c}L${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}Z" fill="${o.takenCol || '#fff'}" stroke="#a9702a"/>`; }
  if (o.hot === 'take' && taken < parts) { const [x0, y0] = P(taken), [x1, y1] = P(taken + 1); s += `<path class="hot6" d="M${c} ${c}L${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}Z" fill="#ffd65a" stroke="#d6476b" stroke-width="2"/>`; }
  if (parts > 1) for (let i = 0; i < Math.min(cuts, parts); i++) { const [x, y] = P(i); s += `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" stroke="#7a4a1a" stroke-width="2"/>`; }
  return s + '</svg>';
}
const tbl6 = rows => `<table class="tb6">${rows.map((r, j) => `<tr>${r.map(x => j ? `<td class="num">${x}</td>` : `<th>${x}</th>`).join('')}</tr>`).join('')}</table>`;
// 式子：每個數字有顏色和來源說明，和圖上的顏色一樣
const sym6 = arr => `<div class="sym6">${arr.map(p => typeof p === 'string' ? `<span class="so6">${p}</span>` : `<span class="sv6" style="border-color:${p[2]};color:${p[2]}"><b class="num">${p[0]}</b><small>${p[1]}</small></span>`).join('')}</div>`;
const mini6 = (a, b) => `<div class="fade6"><div class="mini6">${a}</div><div class="main6">${b}</div></div>`;
const dotsC = (n, c) => `<span class="dots6">${Array.from({ length: n }, () => `<i style="background:${c}"></i>`).join('')}</span>`;
const wheel6 = (d, k, sticks) => `<span class="hot6 whl6">${rollSvg(d, k / 4, 1, sticks || 0)}</span>`;

// 學習紀錄：S.seenC＝打開過（只用來決定要不要自動播，不代表學會）；S.cst[key]＝{ act 完成操作, hint 用了幾次提示, why 第一次就選對意思, quiz 'solo' 自己通過／'help' 經提示或回看後通過 }
const cst6 = key => { S.cst = S.cst || {}; return (S.cst[key] = S.cst[key] || {}); };
function shapeStory(C) { // 把內容排成統一模板
  if (C._shaped) return; C._shaped = 1;
  const st = C.steps.slice();
  // 「先選想法」留在作者安排的位置（緊接在要預測的操作之前），不再自動搬到第 2 步；只有 guessFirst 才搬
  const g = st.findIndex(s => s.t === 'guess');
  if (C.guessFirst && g > 1) { const [gs] = st.splice(g, 1); st.splice(1, 0, gs); }
  let mi = st.findIndex(s => s.id === 'map');
  if (C.rev && mi >= 0) { const la = st.slice(0, mi).filter(s => s.t === 'act').pop(); st.splice(mi, 0, { t: 'reveal', say: C.rev, pic: C.revPic || (la ? () => la.pic(la.n) : '') }); mi++; }
  if (mi >= 0) {
    // 三步淡化用同一個例子：fs 指定第 1 步要用哪一個操作（預設是驗收答錯要回去的那一步）
    const acts = st.filter(s => s.t === 'act'), src = acts.find(s => s.id === (C.fs || C.q.back)) || acts[acts.length - 1], m = st[mi];
    const f = [{ t: '第 1 步：剛才動手做出來的樣子。', h: () => src.pic(src.n) }];
    if (C.dia) f.push({ t: '第 2 步：同一件事，畫成簡圖。', h: C.dia });
    f.push({ t: `第 ${f.length + 1} 步：寫成算式，每個數字連回圖上。${m.say || ''}`, h: m.pic });
    st[mi] = { t: 'fade', id: 'map', steps: f };
  }
  if (C.sort) { // 正反例分類：預設放在第一次命名之前；sortAt:'map' 放在圖式對應之後（一段裡有好幾個新詞時用）
    const ni = C.sortAt === 'map' ? st.findIndex(s => s.id === 'map') + 1 : st.findIndex(s => s.t === 'name');
    st.splice(ni < 0 ? st.length : ni, 0, { t: 'sort', ...C.sort });
  }
  C.steps = st;
}
const word6 = k => CONCEPTS[k] ? CONCEPTS[k].word : k;
function runConcept(key, then, story, rel) {
  shapeStory(story || CONCEPTS[key]);
  const C = story || CONCEPTS[key], L = { title: C.frameTitle || '新概念小故事', sem: C.sem, who: C.who }, steps = C.steps;
  const rec = story ? {} : cst6(key);
  let timer = null, hintNext = '', backed = false, whyMiss = false;
  const stop = () => { if (timer) clearInterval(timer); timer = null; };
  const leave = () => { stop(); if (!story) { S.seenC = S.seenC || {}; S.seenC[key] = 1; save(); } then(); };
  const P = x => typeof x === 'function' ? x() : (x || '');
  const relRow = i => i === 0 && rel && rel.length ? `<div class="rel6">相關小故事（選讀）：${rel.map(k => `<button class="rel6b" data-rel="${k}">${S.seenC && S.seenC[k] ? '✓ ' : ''}〈${word6(k)}〉</button>`).join('')}</div>` : '';
  const shell = (i, prompt, body) => {
    stop();
    lessonFrame(L, prompt, `<div class="stp6">${steps.map((_, j) => `<i class="${j < i ? 'on' : j === i ? 'now' : ''}"></i>`).join('')}<i class="${i >= steps.length ? 'now' : ''}"></i></div>${relRow(i)}${body}<button class="skip6" id="cskip">${C.skipLabel || '跳過這個小故事'}</button>`);
    document.getElementById('out').onclick = C.exit ? () => { stop(); C.exit(); } : leave;
    document.getElementById('cskip').onclick = leave;
    document.querySelectorAll('[data-rel]').forEach(b => b.onclick = () => { stop(); runConcept(b.dataset.rel, () => runConcept(key, then, story, rel)); });
    if (hintNext) { setMsg(nums(hintNext), 'hint'); hintNext = ''; }
  };
  const next = i => i + 1 < steps.length ? show(i + 1) : quiz();
  const btns = list => { document.getElementById('actions').innerHTML = list.map(([id, t, cls]) => `<button class="btn ${cls || ''}" id="${id}">${t}</button>`).join(''); return list.map(([id]) => document.getElementById(id)); };
  const choices = (opts, onPick) => {
    document.getElementById('actions').innerHTML = `<div class="choices col">${opts.map((h, j) => `<button class="choice" data-co="${j}">${nums(h)}</button>`).join('')}</div>`;
    document.querySelectorAll('[data-co]').forEach(b => b.onclick = () => onPick(+b.dataset.co, b));
  };
  const why6 = (w, j) => Array.isArray(w) ? w[j] : w;
  function show(i) {
    const s = steps[i];
    if (s.t === 'say' || s.t === 'name') {
      shell(i, s.say, s.t === 'name' ? `<div class="cname"><span class="tag6">${s.word || C.word}</span>${P(s.pic)}</div>` : `<div id="cp" class="cmv">${P(s.pic)}</div>`);
      if (s.t === 'name') setMsg(nums(s.name), 'good');
      if (s.anim) { let f = 0; timer = setInterval(() => { const e = document.getElementById('cp'); if (!e) return stop(); f = (f + 1) % s.anim.length; e.innerHTML = s.anim[f](); }, 900); }
      actionBtn('cnext', s.btn || '繼續').onclick = () => next(i);
      return;
    }
    if (s.t === 'reveal') {
      shell(i, `${C._g !== undefined && C._gq ? `你剛才選「${C._gq[C._g]}」。對照圖看看：` : ''}${s.say}`, `<div id="cp">${P(s.pic)}</div>`);
      return actionBtn('cnext', '下一步').onclick = () => next(i);
    }
    if (s.t === 'fade') { // 三步淡化：上一步留在上面，箭頭說「同一件事」；可以回上一步左右對照
      let k = 0;
      const paint = () => {
        const f = s.steps[k], prev = k ? `<div class="cmp6"><div class="prev6">${P(s.steps[k - 1].h)}</div><div class="arr6">↓ 同一件事</div></div>` : '';
        shell(i, f.t, `${prev}<div id="cp">${P(f.h)}</div>`);
        const list = k ? [['cprev', '上一步', 'ghost'], ['cnext', '下一步']] : [['cnext', '下一步']];
        const [a, b] = btns(list);
        if (k) a.onclick = () => { k--; paint(); };
        (k ? b : a).onclick = () => { if (++k < s.steps.length) paint(); else next(i); };
      };
      return paint();
    }
    if (s.t === 'sort') { // 正反例：點卡片，再點它要去的那一邊
      shell(i, s.q, `<div class="bins6">${s.bins.map((b, j) => `<div class="bin6" data-b="${j}"><b>${b}</b><div id="bin6${j}"></div></div>`).join('')}</div><div class="cards6">${s.items.map((it, j) => `<button class="card6" data-c="${j}">${nums(it[0])}</button>`).join('')}</div>`);
      let sel = null, left = s.items.length; setMsg('先點一張卡片，再點它要去的那一邊。');
      document.querySelectorAll('.card6').forEach(c => c.onclick = () => { document.querySelectorAll('.card6').forEach(x => x.classList.remove('sel')); sel = +c.dataset.c; c.classList.add('sel'); });
      document.querySelectorAll('.bin6').forEach(b => b.onclick = () => {
        if (sel === null) return setMsg('先點一張卡片。', 'hint');
        if (s.items[sel][1] !== +b.dataset.b) { sfx.retry(); return setMsg(nums(`「${s.items[sel][0]}」放在這邊不合適。${s.hint}`), 'hint'); }
        const card = document.querySelector(`.card6[data-c="${sel}"]`); document.getElementById('bin6' + b.dataset.b).appendChild(card); card.disabled = true; card.classList.remove('sel'); sel = null; sfx.hop();
        if (--left === 0) { setMsg(nums(s.done), 'good'); actionBtn('cnext', '下一步').onclick = () => next(i); }
      });
      return;
    }
    if (s.t === 'guess') {
      C._gq = s.o; delete C._g;
      shell(i, `先選一個你目前的想法：${s.say}`, `<div id="cp">${P(s.pic)}</div><div class="trail">等一下用圖確認，想法可以修正。</div>`);
      return choices(s.o, j => { C._g = j; document.querySelectorAll('[data-co]').forEach((b, x) => b.classList.toggle('sel', x === j)); setMsg(nums(`你選「${s.o[j]}」。動手看看！`), ''); actionBtn('cnext', '動手看看').onclick = () => next(i); });
    }
    if (s.t === 'check' || s.t === 'pose') {
      const tag = s.tag || (s.t === 'check' ? '' : /^(只改|改一個)/.test(s.say || '') ? '改一個地方看看' : '選一個合適的問題');
      const head = s.t === 'pose' ? `<span class="tag5">${tag}</span> ` : '哪一句話意思對？';
      shell(i, `${head}${s.say ? '<br>' + s.say : ''}`, `<div id="cp">${P(s.pic)}</div>`);
      let miss = false;
      return choices(s.o, (j, b) => {
        if (j === s.a) { if (s.t === 'check' && !miss && !whyMiss && !story) rec.why = 1; setMsg(nums(s.ok || `對了，「${s.o[j]}」。`), 'good'); sfx.good(); return actionBtn('cnext', '繼續').onclick = () => next(i); }
        miss = true; if (s.t === 'check') whyMiss = true;
        sfx.retry(); b.disabled = true; b.classList.add('no'); setMsg(nums(`你選了「${s.o[j]}」。${why6(s.why, j) || '回頭看看上面的圖，這句和剛才看到的結果哪裡不一樣？'}`), 'hint');
      });
    }
    if (s.t === 'build') { // 三張卡拼成一題
      shell(i, `<span class="tag5">拼成一道題</span> ${s.say}`, `<div class="bld6">${s.cols.map((col, c) => `<div><small>${s.heads[c]}</small>${col.map((x, j) => `<button class="choice bc6" data-c="${c}" data-j="${j}">${nums(x)}</button>`).join('')}</div>`).join('')}</div>`);
      const got = [];
      document.querySelectorAll('.bc6').forEach(b => b.onclick = () => {
        const c = +b.dataset.c, j = +b.dataset.j, okC = [].concat(s.a[c]);
        if (!okC.includes(j)) { sfx.retry(); b.classList.add('no'); return setMsg(nums(`「${s.cols[c][j]}」：${s.why[c]}`), 'hint'); }
        sfx.hop(); got[c] = 1; document.querySelectorAll(`.bc6[data-c="${c}"]`).forEach(x => { x.disabled = true; }); b.classList.add('ok6');
        if (got.filter(Boolean).length === s.cols.length) { setMsg(nums(s.ok), 'good'); sfx.good(); actionBtn('cnext', '繼續').onclick = () => next(i); }
      });
      return;
    }
    act(i, s);
  }
  function act(i, s) { // 對東西做事：示範→一起做→自己做（自己做時不預先發亮）
    let k = 0, hintLv = 0; const role = s.who || 'self', auto = role === 'demo' ? s.n : role === 'half' ? Math.floor(s.n / 2) : 0, indep = role === 'self';
    const lead = `<span class="tag5">${role === 'demo' ? '看我做' : role === 'half' ? '一起做' : '換你做'}</span> ${role === 'half' ? '我先做一半，' : ''}`;
    shell(i, lead + s.say, `<div id="cp" class="${indep ? 'indep6' : ''}"></div><div class="trail" id="ct"></div>`);
    const cp = document.getElementById('cp');
    const paint = () => { setEl('cp', s.pic(k)); setEl('ct', nums(s.cap ? s.cap(k) : '')); cp.classList.toggle('demo6', k < auto); };
    const done = () => {
      stop(); setMsg(nums(s.done), 'good'); sfx.good(); cp.classList.remove('show6');
      if (indep && !story && steps.filter(x => x.t === 'act').pop() === s) rec.act = 1;
      const toQuiz = backed && s.id === C.q.back; // 驗收答錯回來重做這一步，做完直接回到換情境題，不必整段重來
      const list = role === 'demo' ? [['creplay', '重看示範', 'ghost'], ['cnext', toQuiz ? '回到換情境題' : '繼續']] : [['cnext', toQuiz ? '回到換情境題' : '繼續']];
      const bs = btns(list);
      if (role === 'demo') bs[0].onclick = () => act(i, s);
      bs[bs.length - 1].onclick = () => toQuiz ? quiz() : next(i);
    };
    const step = () => { if (k >= s.n) return; k++; sfx.hop(); paint(); if (k === s.n) done(); };
    const hintBtn = () => { // 提示分兩層：先給數學提示，再按才指出位置
      actionBtn('chint', '提示').onclick = () => {
        if (!story) rec.hint = (rec.hint || 0) + 1;
        if (!indep || hintLv >= 1) {
          cp.classList.add('show6');
          const h = cp.querySelector('.hot6'); if (h) { h.classList.add('hint6'); setTimeout(() => h.classList.remove('hint6'), 1500); }
          return setMsg(nums(s.tip2 || '亮起來的地方就是下一步。'), 'hint');
        }
        hintLv = 1; setMsg(nums(s.tip || '先想想：這一步要分成幾份、每份多少？想好了再點圖。還需要的話，再按一次提示。'), 'hint');
      };
    };
    paint();
    if (auto > 0) {
      actionBtn('cwait', role === 'demo' ? '看示範⋯' : '看我先做⋯').disabled = true;
      timer = setInterval(() => { if (!document.getElementById('cp')) return stop(); step(); if (k >= auto) { stop(); if (k < s.n) { hintBtn(); setMsg('換你了：把剩下的做完。'); } } }, window.__demoMs || 1100);
    } else hintBtn();
    let dragged = false;
    const near = (t, h) => { // 自己做時：點同一組裡任何一個還沒用過的東西都算
      if (!h || t === cp || t.closest('.gone, .on, .no6, .cb6')) return false;
      const par = h.parentElement; return par === cp ? cp.contains(t) : par.contains(t);
    };
    cp.onclick = e => {
      if (dragged) { dragged = false; return; }
      if (k < auto || k >= s.n) return;
      const bad = e.target.closest('.no6'); if (bad) { sfx.retry(); return setMsg(nums(bad.dataset.w || '這個和題目要的不一樣。'), 'hint'); }
      if (e.target.closest('.hot6')) { setMsg(''); return step(); }
      const cb = e.target.closest('.cutme6');
      if (cb) { // 平均分：要點在下一刀的位置
        const r = cb.getBoundingClientRect(), f = (e.clientX - r.left) / r.width, p = +cb.dataset.p, d = +cb.dataset.d, want = (d + 1) / p;
        if (Math.abs(f - want) < 0.3 / p) { setMsg(''); return step(); }
        sfx.retry(); return setMsg(nums(`這裡切下去，${p} 段不會一樣長。要平均分成 ${p} 段，每段占整條的 1/${p}；第 ${d + 1} 刀要切在從左邊數來第 ${d + 1} 段的尾巴。`), 'hint');
      }
      if (indep && near(e.target, cp.querySelector('.hot6'))) { setMsg(''); step(); }
    };
    cp.onpointerdown = e => { // 拖一個東西放進框裡
      const h = e.target.closest('.drag6') || (indep && e.target.closest('.pile6 .it6:not(.gone)')); if (!h || k < auto) return;
      e.preventDefault(); const sx = e.clientX, sy = e.clientY; let moved = false;
      try { cp.setPointerCapture(e.pointerId); } catch (x) {}
      cp.onpointermove = ev => { if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 8) moved = true; h.style.transform = `translate(${ev.clientX - sx}px,${ev.clientY - sy}px)`; };
      cp.onpointerup = ev => { cp.onpointermove = cp.onpointerup = null; h.style.transform = ''; if (!moved) return; dragged = true; h.style.visibility = 'hidden'; const t = document.elementFromPoint(ev.clientX, ev.clientY); h.style.visibility = ''; if (t && t.closest('.drop6')) step(); setTimeout(() => { dragged = false; }, 50); };
    };
  }
  function quiz() {
    const q = C.q, order = Logic.shuffle(q.o.map((_, j) => j));
    shell(steps.length, `換個情境：${q.t}`, `<div id="cp">${P(q.pic)}</div>`);
    document.getElementById('actions').innerHTML = `<div class="choices col">${order.map(j => `<button class="choice" data-co="${j}">${nums(q.o[j])}</button>`).join('')}</div>`;
    let miss = false;
    document.querySelectorAll('[data-co]').forEach(b => b.onclick = () => {
      const j = +b.dataset.co;
      if (j === q.a) {
        if (!story) { rec.quiz = miss || backed ? (rec.quiz === 'solo' ? 'solo' : 'help') : 'solo'; save(); }
        setMsg(nums(q.ok), 'good'); sfx.good();
        const later = (rel || []).filter(k => !(S.seenC || {})[k] && CONCEPTS[k]);
        const bs = btns(later.length ? [['cmore', `再看〈${word6(later[0])}〉（選讀）`, 'ghost'], ['cdone', C.doneLabel || '開始闖關']] : [['cdone', C.doneLabel || '開始闖關']]);
        if (later.length) bs[0].onclick = () => { stop(); if (!story) { S.seenC[key] = 1; save(); } runConcept(later[0], then); };
        return bs[bs.length - 1].onclick = leave;
      }
      miss = true; sfx.retry(); b.disabled = true; b.classList.add('no');
      const w = why6(q.why, j);
      setMsg(nums(`你選了「${q.o[j]}」。${w ? w + ' ' : ''}${q.hint}`), 'hint');
      actionBtn('cback', '回到那一步看看').onclick = () => { backed = true; hintNext = q.hint; show(steps.findIndex(x => x.id === q.back)); };
    });
  }
  show(0);
}
function cstLabel(k) { // 清單上的狀態：看過、完成操作、驗收（自己／經提示）分開標
  const r = (S.cst || {})[k] || {}, seen = (S.seenC || {})[k];
  if (r.quiz === 'solo') return '<small class="cs6 ok">✓ 自己完成驗收</small>';
  if (r.quiz === 'help') return '<small class="cs6">經提示完成驗收</small>';
  if (r.act) return '<small class="cs6">完成操作</small>';
  return seen ? '<small class="cs6">看過</small>' : '';
}
function viewConcepts() {
  window.scrollTo(0, 0);
  S.seenC = S.seenC || {};
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="home" aria-label="回練習場">⌂</button><h2 class="page-h">新概念小故事</h2></div><p class="tag">「看過」只表示打開過；自己完成最後的換情境題，才標 ✓。</p><div class="pg">${Object.entries(CONCEPTS).map(([k, C]) => `<button class="pg-btn" data-cs="${k}"><span class="sem">${C.sem}</span>${C.word}${cstLabel(k)}</button>`).join('')}</div>`;
  document.getElementById('home').onclick = viewPractice;
  document.querySelectorAll('[data-cs]').forEach(b => b.onclick = () => runConcept(b.dataset.cs, viewConcepts));
}
const conceptsOf = q => (CONCEPT_OF[q.kind + ':' + q.mode] || []).filter(k => CONCEPTS[k]);
const mainConcept = q => { const id = q.kind + ':' + q.mode, L = conceptsOf(q), m = CONCEPT_MAIN[id]; return m && CONCEPTS[m] ? m : L[L.length - 1]; };
function conceptThen(q, then) { // 第一次遇到才自動播，而且只播這一題必需的那一段；其他相關的放在故事裡選讀
  S.seenC = S.seenC || {};
  const k = mainConcept(q);
  if (!k || S.seenC[k]) return then();
  runConcept(k, then, null, conceptsOf(q).filter(x => x !== k));
}
function bindConceptBtn(q) { // 題目頁右上角可重看
  const b = document.getElementById('cst'), k = mainConcept(q);
  if (!b) return;
  if (!k) { b.hidden = true; return; }
  b.hidden = false;
  b.onclick = () => { const rq = R.q; runConcept(k, () => VIEWS[R.game](rq), null, conceptsOf(q).filter(x => x !== k)); };
}
/* ---------- 六年級小故事內容（鷹架版，2026-11 依外部審查修訂） ---------- */
const HON = '#e0a020', WAT = '#7fc4ec', C_HW = { ca: '#e0a020', cb: '#7fc4ec' };
const twoBox6 = (L, R) => `<div class="pair6 box6"><div><small>${L[0]}</small>${L[1]}</div><div><small>${R[0]}</small>${R[1]}</div></div>`;
const barU = (n, c, lab, w) => `<div class="bu6" style="width:${w || 100}%">${lab ? `<small>${lab}</small>` : ''}${barRow(n, n, c)}</div>`;
const hw6 = (a, b) => `<span class="hw6">${'🥄'.repeat(a)} ${'🥛'.repeat(b)}</span>`; // 匙和杯用圖示，不畫成一樣大的色塊
const segs6 = (n, filled, col, lab, w, val) => `<div class="bu6" style="width:${w || 100}%"><small>${lab}</small><div class="seg6" style="grid-template-columns:repeat(${n},1fr)">${Array.from({ length: n }, (_, i) => `<i style="background:${col}">${i < filled ? `<b class="num">${val}</b>` : ''}</i>`).join('')}</div></div>`;
const CONCEPTS = {
  prime: { sem: '六上', who: 'octopus', word: '質數', hide: ['質數', '合數'], fs: 's7',
    steps: [
      { t: 'say', say: '先看一個排隊的例子：6 個小朋友，每排 3 個，排成 2 排，沒有人落單。', pic: () => rows6('🧒', 6, 3, '每排 3 個') },
      { t: 'act', id: 'd6', who: 'demo', say: '6 塊地磚，每排 2 塊，一塊一塊放進框裡。', n: 6, pic: k => pile6('🟫', 6, k, '地磚') + rows6('🟫', k, 2, '每排 2 塊'), cap: k => k ? `放了 ${k} 塊${k % 2 ? '，這排還沒滿' : '，這排滿了'}` : '我先把一塊放進去⋯', done: '6 塊排成 3 排、每排 2 塊，沒有缺塊。這是「至少兩排、每排至少兩塊」的長方形。' },
      { t: 'act', id: 'h5', who: 'half', say: '5 塊地磚，也試試每排 2 塊。', n: 5, pic: k => pile6('🟫', 5, k, '地磚') + rows6('🟫', k, 2, '每排 2 塊'), cap: k => k ? `放了 ${k} 塊` : '', done: '最後一排只有 1 塊（紅色），有缺塊。每排 3 塊、4 塊也會缺。5 塊只排得成 1 排，排不成至少兩排、每排至少兩塊的長方形。' },
      { t: 'guess', say: '7 塊地磚，排得成「至少兩排、每排至少兩塊、沒有缺塊」的長方形嗎？', pic: () => pile6('🟫', 7, 7).replace(/gone/g, ''), o: ['排得成', '排不成'] },
      { t: 'act', id: 's7', say: '7 塊，先試每排 2 塊。點或拖地磚。', tip: '每排放 2 塊，放滿一排再放下一排；最後看最後一排有沒有缺塊。', n: 7, pic: k => pile6('🟫', 7, k, '地磚') + rows6('🟫', k, 2, '每排 2 塊'), cap: k => k ? `放了 ${k} 塊` : '', done: '最後一排缺 1 塊。改成每排 3、4、5、6 塊，也都有缺塊。7 塊排不成這種長方形。' },
      { t: 'say', id: 'map', say: '左邊排得成；右邊只能寫成「1 排」的乘法。', pic: () => twoBox6(['排得成', sym6([[6, '塊', K1], '＝', [2, '每排', K2], '×', [3, '排', K3]]) + sym6([[4, '塊', K1], '＝', [2, '每排', K2], '×', [2, '排', K3]])], ['排不成', sym6([[7, '塊', K1], '＝', [7, '每排', K2], '×', [1, '排', K3]]) + sym6([[5, '塊', K1], '＝', [5, '每排', K2], '×', [1, '排', K3]]) + `<div class="trail">2、3 也只能排 1 排</div>`]) },
      { t: 'name', say: '右邊這一類數，有自己的名字。', name: '大於 1 的整數中，因數只有 1 和自己兩個的數，叫<b>質數</b>。7 的因數只有 1 和 7，所以 7 是質數。1 只有 1 個因數，不是質數。', pic: () => `<div class="trail">2、3、5、7</div>` + rows6('🟫', 5, 5) },
      { t: 'check', o: ['質數是大於 1、因數只有 1 和自己的數', '質數都是奇數', '1 是最小的質數'], a: 0, why: [, '2 是偶數，因數只有 1 和 2，也是質數；9 是奇數，卻排得成 3 排、每排 3 塊。', '1 的因數只有 1 一個，不到兩個，所以 1 不是質數。'] },
      { t: 'pose', say: '哪一張卡在問「11 是不是質數」？', o: ['11 顆蛋，排得成至少兩排、每排一樣多、每排至少 2 顆嗎？', '11 顆蛋，吃掉 2 顆還剩幾顆？', '11 顆蛋，每顆 5 元要多少錢？'], a: 0, why: [, '這題問的是減法，和排不排得成無關。', '這題問的是總價，和排不排得成無關。'], ok: '對了！問排不排得成這種長方形，就是在問是不是質數。' },
    ],
    q: { t: '9 個杯子，想排成至少兩排、每排一樣多、每排至少 2 個。9 是不是質數？', pic: () => pile6('🥤', 9, 9).replace(/gone/g, ''), o: ['不是，每排 3 個可以排成 3 排', '是，因為 9 是奇數'], a: 0, why: [, '奇數也可能排得成：試試每排 3 個。'], ok: '對了！9＝3×3，除了 1 和 9，還有因數 3，不是質數。', back: 's7', hint: '像 7 塊那樣一塊一塊排；9 個試試每排 3 個。' } },
  rate: { sem: '六上', who: 'bee', word: '比值', hide: ['比值', '前項', '後項', '當作 1', '基準'],
    steps: [
      { t: 'say', say: '先回想倍數：6 杯是 2 杯的幾倍？用 2 杯一份一份去量 6 杯，量了 3 份，所以是 3 倍。', pic: () => grp6(6, 2, 3, { noHot: true, cell: WAT, lab: '6 杯水，每 2 杯圈一份' }) },
      { t: 'act', id: 'd', who: 'demo', say: '蜂蜜 2 杯、水 6 杯（用同一種杯子）。用蜂蜜的 2 杯，一份一份圈水。', n: 3, pic: k => `<small class="lab6">蜂蜜</small>` + grp6(2, 2, 1, { noHot: true, cell: HON }) + grp6(6, 2, k, { cell: WAT, lab: '水' }), cap: k => k ? `圈了 ${k} 份` : '我用蜂蜜的 2 杯去量⋯', done: '水是蜂蜜的 3 倍：6÷2＝3。' },
      { t: 'say', say: '反過來問：蜂蜜 2 杯是水 6 杯的幾倍？蜂蜜比水少，連 1 份都不到，要把水平均分成幾段來量。', pic: () => barU(1, WAT, '水 6 杯', 100) + barU(1, HON, '蜂蜜 2 杯', 33.4) },
      { t: 'act', id: 'h', who: 'half', say: '把水平均分成 3 段，點剪刀切。', n: 2, pic: k => cut6(3, k, { col: WAT, lab: '水 6 杯' }) + barU(1, HON, '蜂蜜 2 杯', 33.4), cap: k => `切了 ${k} 刀`, done: '蜂蜜剛好是 3 段裡的 1 段：蜂蜜是水的 1/3 倍。' },
      { t: 'guess', say: '蜂蜜 2 杯、水 3 杯，蜂蜜是水的幾倍？', pic: () => barU(1, WAT, '水 3 杯') + barU(1, HON, '蜂蜜 2 杯', 66.7), o: ['2/3 倍', '3/2 倍', '1 倍'] },
      { t: 'act', id: 's', say: '把水 3 杯平均分成 3 段（一杯一段）：點在要切的位置。', tip: '平均分成 3 段，每段一樣長；第 1 刀切在整條的 1/3 那裡。', n: 2, pic: k => cut6(3, k, { col: WAT, lab: '水 3 杯' }) + barU(2, HON, '蜂蜜 2 杯', 66.7), cap: k => `切了 ${k} 刀`, done: '蜂蜜占 2 段：蜂蜜是水的 2/3 倍。' },
      { t: 'say', id: 'map', say: '蜂蜜的杯數除以水的杯數。', pic: () => mini6(barU(3, WAT, '水 3 杯') + barU(2, HON, '蜂蜜 2 杯', 66.7), sym6([[2, '蜂蜜杯數', K1], '÷', [3, '水杯數', K2], '＝', ['2/3', '蜂蜜是水的幾倍', K3]])) },
      { t: 'say', say: '先回想比的寫法：蜂蜜：水＝2：3。把 2：3 也算成一個數：2÷3＝2/3，和剛才量出來的一樣。', pic: () => sym6([[2, '蜂蜜', K1], '：', [3, '水', K2]]) + '<div class="trail">⬇ 用前面的數除以後面的數</div>' + sym6([[2, '蜂蜜', K1], '÷', [3, '水', K2], '＝', ['2/3', '', K3]]) },
      { t: 'name', say: '這個算出來的數有名字。', name: 'a：b 中，用 a 除以 b 得到的數，叫 a：b 的<b>比值</b>（b 不能是 0）。2：3 的比值是 2÷3＝2/3。', pic: () => sym6([[2, '', K1], '：', [3, '', K2], '→', ['2/3', '比值', K3]]) },
      { t: 'check', o: ['2：3 的比值是 2÷3＝2/3', '2：3 的比值是 2＋3＝5', '2：3 的比值是 3÷2＝3/2'], a: 0, why: [, '比值要用除的，不是把兩個數加起來。', '3÷2 是 3：2 的比值，前後順序倒過來了。'] },
      { t: 'build', say: '拼一道可以用「3÷4」來算的題目。', heads: ['東西', '數量', '問題'], cols: [['果汁和水', '3 個小朋友'], ['果汁 3 杯、水 4 杯', '果汁 4 杯、水 3 杯'], ['果汁是水的幾倍？', '一共有幾杯？']], a: [0, 0, 0], why: ['先找出要比較的兩個量：果汁的杯數和水的杯數。', '3÷4：被除數 3 是果汁的杯數，除數 4 是水的杯數。', '問「一共幾杯」要用加的；問「幾倍」才用除的。'], ok: '果汁 3 杯、水 4 杯，果汁是水的幾倍？3÷4＝3/4。' },
    ],
    q: { t: '紅顏料 1 匙、藍顏料 4 匙（同一支匙），紅：藍＝1：4，比值是多少？', pic: () => barU(4, K2, '藍 4 匙') + barU(1, K4, '紅 1 匙', 25), o: ['1/4', '4', '5'], a: 0, why: [, '4 是 4÷1，是藍：紅的比值。', '5 是 1＋4，比值要用除的。'], ok: '對了！1÷4＝1/4。', back: 's', hint: '像剛才把水平均分成段那樣：藍的分成 4 段，紅的占幾段？' } },
  base: { sem: '六下', who: 'goat', word: '基準量', hide: ['基準', '比較量'], fs: 's2',
    steps: [
      { t: 'say', say: '甲艙有 6 箱物資，乙艙有 3 箱。我們先比較：甲艙的箱數是乙艙的幾倍？', pic: () => `<small class="lab6">甲艙 6 箱</small>${grp6(6, 6, 0, { noHot: true, cell: '#f7c873' })}<small class="lab6">乙艙 3 箱</small>${grp6(3, 3, 0, { noHot: true, cell: K2 })}` },
      { t: 'act', id: 'd', who: 'demo', say: '題目是拿甲艙和乙艙比，所以把乙艙的 3 箱看作 1 份。我用每份 3 箱，在甲艙的 6 箱上圈一圈。', n: 2, pic: k => `<small class="lab6">📏 乙艙 3 箱（看作 1 份）</small>` + grp6(3, 3, 1, { noHot: true, cell: K2 }) + grp6(6, 3, k, { cell: '#f7c873', lab: '甲艙 6 箱' }), cap: k => k ? `圈了 ${k} 份` : '我把乙艙的 3 箱看作 1 份⋯', done: '圈出 2 份：6÷3＝2，甲艙的箱數是乙艙的 2 倍。' },
      { t: 'guess', say: '交換問題：「乙艙的箱數是甲艙的幾倍？」箱數沒有改變，答案還是 2 倍嗎？', o: ['還是 2 倍', '不一樣'] },
      { t: 'act', id: 'h', who: 'demo', say: '這次拿乙艙和甲艙比，要把甲艙的 6 箱看作 1。把甲艙平均分成 2 段。', n: 1, pic: k => cut6(2, k, { col: '#f7c873', lab: '📏 甲艙 6 箱（看作 1）' }) + barU(1, K2, '乙艙 3 箱', 50), cap: k => k ? '分好了' : '', done: '乙艙正好是 2 段裡的 1 段：乙艙的箱數是甲艙的 1/2 倍。答案從 2 變成 1/2，因為這次把甲艙看作 1。' },
      { t: 'act', id: 's1', say: '「弟弟的身高是哥哥的幾倍？」這次要把誰的身高看作 1？', tip: '題目拿誰和誰比？「弟弟是哥哥的幾倍」是拿弟弟和哥哥比。', n: 1, pic: k => `<div class="bu6"><small>${k ? '📏 ' : ''}哥哥 4 格</small>${barRow(4, 4, '#f7c873')}</div><div class="bu6" style="width:75%"><small>弟弟 3 格</small>${barRow(3, 3, K2)}</div>` + (k ? '' : chips6(['把哥哥看作 1', '把弟弟看作 1'], (_, i) => i === 0, () => '題目是拿弟弟去和哥哥比，所以哥哥是被看作 1 的那個。')), cap: k => k ? '把哥哥的 4 格看作 1' : '', done: '把哥哥的身高看作 1。' },
      { t: 'act', id: 's2', say: '把哥哥的 4 格看作 1，平均分成 4 段，看弟弟占幾段。點在要切的位置。', tip: '平均分成 4 段，每段是 1 格；刀子切在格子和格子的交界。', n: 3, pic: k => cut6(4, k, { col: '#f7c873', lab: '📏 哥哥 4 格（看作 1）' }) + barU(3, K2, '弟弟 3 格', 75), cap: k => `切了 ${k} 刀`, done: '弟弟占 3 段：弟弟的身高是哥哥的 3/4 倍。' },
      { t: 'say', id: 'map', say: '拿來比的放前面，看作 1 的放後面。', pic: () => mini6(barU(4, '#f7c873', '📏 哥哥') + barU(3, K2, '弟弟', 75), sym6([[3, '弟弟（拿來比的）', K1], '÷', [4, '哥哥（看作 1）', K2], '＝', ['3/4', '倍數', K3]])) },
      { t: 'name', say: '被看作 1 的那個量，有名字。', name: '比較時，被看作 1 的那個量，叫<b>基準量</b>。「弟弟的身高是哥哥的幾倍」，哥哥的身高是基準量。', pic: () => barU(4, '#f7c873', '📏 哥哥（基準量）') },
      { t: 'check', o: ['基準量是比較時被看作 1 的量', '比較長或比較多的那個，一定是基準量'], a: 0, why: [, '「甲艙是乙艙的幾倍」，被看作 1 的是箱數比較少的乙艙；要看題目拿誰和誰比。'] },
      { t: 'pose', say: '只改一個地方：「甲艙是乙艙的幾倍」改成「乙艙是甲艙的幾倍」，會怎樣？', o: ['看作 1 的換成甲艙，答案從 2 變成 1/2', '什麼都不會變'], a: 0, why: [, '回想剛才：看作 1 的量換了，2 倍就變成 1/2 倍。'], ok: '對了！換了基準量，答案就跟著變。' },
    ],
    q: { t: '以小美的 8 張卡片為基準，小安有 6 張。小安的卡片數是小美的幾倍？', pic: () => barU(8, '#f7c873', '📏 小美 8 張') + barU(6, K2, '小安 6 張', 75), o: ['3/4 倍', '4/3 倍', '2 倍'], a: 0, why: [, '8÷6 是把小安的 6 張看作 1；題目說以小美為基準。', '小安比小美少，不會是 2 倍。'], ok: '對了！你先把小美的 8 張看作 1，再算 6÷8＝3/4。基準量不一定比較小，也不一定比較大。', back: 's1', hint: '先決定把誰看作 1：題目說「以小美的卡片為基準」。' } },
};
// ---- 其他小故事用的畫面零件 ----
const brk6 = st => (k = 0) => { const a = st[Math.min(k, st.length - 1)], c = a.findIndex(x => !Logic.isPrime(x)), last = k >= st.length - 1; return `<div class="parts6">${a.map((x, i) => `<b class="chip6 num ${i === c && !last ? 'hot6 big' : Logic.isPrime(x) ? (last ? '' : 'no6') : 'big'}" data-w="${x} 是質數，不能再拆成兩個比 1 大的數相乘。">${x}</b>`).join('<span>×</span>')}</div>`; };
const ladStep6 = (A, B, divs) => k => { const rows = []; let x = A, y = B; for (let i = 0; i < k; i++) { rows.push([divs[i], x, y]); x /= divs[i]; y /= divs[i]; } const d = divs[k]; return `<div class="pair6"><div>${dotsC(A, K4)}<br>${dotsC(B, K2)}</div><div>${ladderHtml(rows, x, y)}</div></div>` + (k < divs.length ? chips6([2, 3, 5], p => p === d, p => `${x % p ? `${x} 不能被 ${p} 整除` : `${y} 不能被 ${p} 整除`}，${p} 不能同時整除這兩個數。`) : ''); };
const tries6 = (a, b, ps) => k => `<div class="lk6">${ps.slice(0, k).map(p => `<div class="trow6">平分給 <b class="num">${p}</b> 人：${a % p ? `${a} 顆分不完（剩 ${a % p}）` : `${a} 顆剛好分完`}，${b % p ? `${b} 顆分不完（剩 ${b % p}）` : `${b} 顆剛好分完`}</div>`).join('')}</div>` + (k < ps.length ? chips6(ps.map(p => p + ' 人'), (_, i) => i === k, (_, i) => i < k ? '這個人數已經試過了。' : `照順序從人數少的試起：先試 ${ps[k]} 人。`) : '');
const pies6 = (n, parts, taken) => Array.from({ length: n }, (_, i) => pie6(parts, parts, Math.max(0, Math.min(parts, taken - i * parts)), { hot: taken >= i * parts && taken < (i + 1) * parts ? 'take' : '', takenCol: '#a9d0f0' })).join('');
const rectG6 = (w, h, hot, col) => { const u = 18; let s = `<svg class="g5 ${hot ? 'hot6' : ''}" style="max-height:150px" viewBox="0 0 ${Math.max(w, 6) * u + 4} ${Math.max(h, 4) * u + 4}">`; for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) s += `<rect x="${2 + i * u}" y="${2 + j * u}" width="${u}" height="${u}" fill="${col || '#a9d0f0'}" stroke="#33405a"/>`; return s + '</svg>'; };
const addBtn6 = (t, on) => on ? `<div class="op6s"><button class="op6 hot6">${t}</button></div>` : '';
const pan6 = (box, ex, right) => `<div class="bal6"><span class="pan6">${'🎁'.repeat(box)}${ex ? ' ' + it6('🔴', 'hot6').repeat(1) + '🔴'.repeat(Math.max(0, ex - 1)) : ''}</span><i>＝</i><span class="pan6">${'🔴'.repeat(right)}</span></div>`;
const road6 = (cm, k, per) => `<div class="road6">${Array.from({ length: cm }, (_, i) => `<span class="${i < k ? 'on' : i === k ? 'hot6' : ''}">${i < k ? `${per * (i + 1)} 公里` : '📏'}</span>`).join('')}</div>`;
const slice10 = (votes, k, hot) => { const cols = { 月球: K2, 火星: K4, 土星: K3 }; const r = 44, c = 50, P = i => [c + r * Math.sin(i / 10 * 2 * Math.PI), c - r * Math.cos(i / 10 * 2 * Math.PI)]; let s = '<svg class="pz6" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#fff" stroke="#33405a"/>'; for (let i = 0; i < 10; i++) { const [x0, y0] = P(i), [x1, y1] = P(i + 1); s += `<path class="${i === k && hot ? 'hot6' : i < k ? 'gone' : ''}" d="M50 50L${x0} ${y0}A44 44 0 0 1 ${x1} ${y1}Z" fill="${i < k ? cols[votes[i]] : i === k && hot ? '#ffd65a' : '#fff'}" stroke="#33405a"/>`; } return s + '</svg>'; };
const VOTES = ['月球', '月球', '月球', '月球', '月球', '火星', '火星', '火星', '土星', '土星'];
const DRAWS = ['🔴', '🔴', '🔴', '🔵', '🔴', '🔴', '🔴', '🔴', '🔴', '🔴']; // 一次示例紀錄
const DRAWS2 = ['🔴', '🔵', '🔴', '🔴', '🔵', '🔴', '🔴', '🔵', '🔴', '🔴']; // 另一組同學的紀錄：7 紅 3 藍
const drw6 = (a, lab) => `<div class="pile6">${lab ? `<small>${lab}</small>` : ''}${a.map(e => it6(e)).join('')}</div>`; // 摸球紀錄：一顆一個，手機上會自動換行
const halfSvg = k => `<svg class="g5" style="max-height:130px" viewBox="0 0 200 112"><path d="M10 100 A90 90 0 0 1 190 100 Z" fill="#fde7b0" stroke="#33405a" stroke-width="2"/>${k >= 1 ? '<path d="M10 100 A90 90 0 0 1 190 100" fill="none" stroke="#d6476b" stroke-width="7"/>' : ''}${k >= 2 ? '<line x1="10" y1="100" x2="190" y2="100" stroke="#2f6fb0" stroke-width="7"/>' : ''}<text x="100" y="92" text-anchor="middle" class="pt">直徑 10 公分</text></svg>`;
const ringSvg = (k, lab) => `<svg class="g5" style="max-height:150px" viewBox="0 0 200 160"><circle cx="100" cy="80" r="72" fill="${k >= 1 ? '#f7c873' : '#fff'}" stroke="#33405a" stroke-width="2"/>${k >= 2 ? '<circle cx="100" cy="80" r="24" fill="#fff" stroke="#d6476b" stroke-width="3"/>' : '<circle cx="100" cy="80" r="24" fill="none" stroke="#33405a" stroke-dasharray="4 3"/>'}<line x1="100" y1="80" x2="172" y2="80" stroke="#2f6fb0" stroke-width="3"/><line x1="100" y1="80" x2="100" y2="56" stroke="#d6476b" stroke-width="3"/><text x="140" y="74" text-anchor="middle" class="pt">${lab ? lab[0] : 3}</text><text x="112" y="70" class="pt">${lab ? lab[1] : 1}</text></svg>`;
const sectorSvg = k => `<svg class="g5" style="max-height:150px" viewBox="0 0 170 170"><path d="M20 150 L20 20 A130 130 0 0 1 150 150 Z" fill="#c9e8c3" stroke="#33405a" stroke-width="2"/>${k >= 1 ? '<path d="M20 20 A130 130 0 0 1 150 150" fill="none" stroke="#d6476b" stroke-width="7"/>' : ''}${k >= 2 ? '<line x1="20" y1="150" x2="20" y2="20" stroke="#2f6fb0" stroke-width="7"/>' : ''}${k >= 3 ? '<line x1="20" y1="150" x2="150" y2="150" stroke="#2f6fb0" stroke-width="7"/>' : ''}<text x="30" y="142" class="pt">90°</text><text x="6" y="90" class="pt">6</text><text x="80" y="166" class="pt">6</text></svg>`;
const shareRows6 = k => `<div class="rows6">${Array.from({ length: k }, (_, i) => `<div class="r6"><small>第 ${i + 1} 輪</small> 甲 ${'📦'.repeat(2)} ｜ 乙 ${'📦'.repeat(3)}</div>`).join('')}</div>` + pile6('📦', 20, 5 * k, `還沒分的：${20 - 5 * k} 箱`).replace(/hot6 drag6/, '');
Object.assign(CONCEPTS, {
  comp: { sem: '六上', who: 'octopus', word: '合數', hide: ['合數'], fs: 's9',
    steps: [
      { t: 'say', say: '先回想質數：5 塊地磚排不成「至少兩排、每排至少兩塊」的長方形。忘了也可以先看〈質數〉。', pic: () => rows6('🟫', 5, 5) },
      { t: 'act', id: 'd', who: 'demo', say: '6 塊地磚，每排 3 塊。', n: 6, pic: k => pile6('🟫', 6, k) + rows6('🟫', k, 3, '每排 3 塊'), cap: k => `放了 ${k} 塊`, done: '排成 2 排、每排 3 塊，沒有缺塊。6 除了 1 和 6，還有因數 2 和 3。' },
      { t: 'act', id: 'h', who: 'half', say: '8 塊地磚，每排 2 塊。', n: 8, pic: k => pile6('🟫', 8, k) + rows6('🟫', k, 2, '每排 2 塊'), cap: k => `放了 ${k} 塊`, done: '4 排剛好。8 除了 1 和 8，還有因數 2 和 4。' },
      { t: 'guess', say: '9 是奇數。9 塊地磚排得成「至少兩排、每排至少兩塊」的長方形嗎？', o: ['排得成', '排不成'] },
      { t: 'act', id: 's9', say: '9 塊，試試每排 3 塊。', tip: '每排放 3 塊，放滿一排再放下一排。', n: 9, pic: k => pile6('🟫', 9, k) + rows6('🟫', k, 3, '每排 3 塊'), cap: k => `放了 ${k} 塊`, done: '3 排剛好，沒有缺塊。9 是奇數，也排得成。' },
      { t: 'say', id: 'map', say: '左邊除了 1 排，還有別的排法。', pic: () => twoBox6(['排得成', sym6([[8, '塊', K1], '＝', [2, '每排', K2], '×', [4, '排', K3]]) + sym6([[9, '塊', K1], '＝', [3, '每排', K2], '×', [3, '排', K3]])], ['排不成', '<div class="trail">2、3、5、7</div>']) },
      { t: 'name', say: '左邊這一類數有名字。', name: '大於 1 的整數中，除了 1 和自己，還有別的因數的數，叫<b>合數</b>。8、9、10 都是合數。1 既不是質數，也不是合數。', pic: () => rows6('🟫', 9, 3) },
      { t: 'check', o: ['合數除了 1 和自己，還有別的因數', '合數都是偶數'], a: 0, why: [, '9 是奇數，有因數 3，也是合數。'] },
      { t: 'pose', say: '哪一張卡在問「10 是不是合數」？', o: ['10 片餅乾，排得成至少兩排、每排一樣多、每排至少 2 片嗎？', '10 片餅乾吃掉 3 片，剩幾片？'], a: 0, why: [, '這題問的是減法，和排不排得成無關。'] },
    ],
    q: { t: '15 顆彈珠，想排成至少兩排、每排一樣多、每排至少 2 顆。15 是質數還是合數？', o: ['合數，每排 3 顆可以排成 5 排', '質數，因為 15 是奇數'], a: 0, why: [, '奇數也可能是合數：試試每排 3 顆。'], ok: '對了！15＝3×5，除了 1 和 15，還有因數 3 和 5。', back: 's9', hint: '像 9 塊那樣，每排 3 個試試。' } },
  pfac: { sem: '六上', who: 'octopus', word: '質因數', hide: ['質因數'], fs: 's',
    steps: [
      { t: 'say', say: '先回想：6 塊排成 2 排、每排 3 塊，可以寫成 6＝3×2。3 和 2 都是 6 的因數。', pic: () => sym6([[6, '', K1], '＝', [3, '每排', K2], '×', [2, '排', K3]]) },
      { t: 'act', id: 'd', who: 'demo', say: '機器人的 12 號零件：把它拆成兩個數相乘。點還能再拆的那個數。', n: 2, pic: brk6([[12], [2, 6], [2, 2, 3]]), cap: k => ['12 可以拆成 2×6', '6 不是質數，還能拆成 2×3', '2、2、3 都是質數，不能再拆'][k], done: '12＝2×2×3，每個數都是質數了。' },
      { t: 'act', id: 'h', who: 'half', say: '18 號零件。', n: 2, pic: brk6([[18], [2, 9], [2, 3, 3]]), cap: k => `拆了 ${k} 次`, done: '18＝2×3×3，都是質數了。' },
      { t: 'act', id: 's', say: '20 號零件，自己拆：點還能再拆的數。', tip: '先把 20 拆成兩個數相乘，例如 2×10；再看哪一個不是質數，還能拆。', n: 2, pic: brk6([[20], [2, 10], [2, 2, 5]]), cap: k => `拆了 ${k} 次`, done: '20＝2×2×5。' },
      { t: 'guess', say: '15 拆到每個數都是質數，會剩下哪些數？', o: ['3 和 5', '1 和 15', '15 不能拆'] },
      { t: 'act', id: 's15', say: '拆開 15 看看。', tip: '15 可以寫成哪兩個比 1 大的數相乘？', n: 1, pic: brk6([[15], [3, 5]]), cap: k => k ? '3 和 5' : '', done: '15＝3×5，3 和 5 都是質數。' },
      { t: 'say', id: 'map', say: '20 拆到最後，剩下的都是質數。', pic: () => sym6([[20, '原來的數', K1], '＝', [2, '質數', K3], '×', [2, '質數', K3], '×', [5, '質數', K3]]) + '<div class="trail">20 的因數有 1、2、4、5、10、20，其中是質數的只有 2 和 5</div>' },
      { t: 'name', say: '這些是質數的因數有名字。', name: '一個數的因數中，是質數的那些，叫這個數的<b>質因數</b>。20＝2×2×5，20 的質因數是 2 和 5（2 出現兩次，只算一種）。', pic: brk6([[2, 2, 5]]) },
      { t: 'check', o: ['20 的質因數是 2 和 5', '10 也是 20 的質因數', '20 有 2、2、5 三個不同的質因數'], a: 0, why: [, '10 是 20 的因數，但 10＝2×5，不是質數。', '2 出現兩次，但只是同一個質因數；不同的質因數只有 2 和 5。'] },
      { t: 'pose', say: '哪一張卡在問「找出 21 的質因數」？', o: ['21 的因數中，哪些是質數？', '21 個零件分給 3 人，每人幾個？'], a: 0, why: [, '這題在問平分，和哪些因數是質數無關。'] },
    ],
    q: { t: '14 的質因數是哪些？', o: ['2 和 7', '1 和 14', '只有 14'], a: 0, why: [, '1 不是質數；14 也不是質數。', '14＝2×7，不是質數。'], ok: '對了！14＝2×7，2 和 7 都是質數。', back: 's', hint: '像 20 那樣，拆到每個數都是質數。' } },
  pfd: { sem: '六上', who: 'octopus', word: '質因數分解', hide: ['分解'], fs: 's30',
    steps: [
      { t: 'say', say: '先回想質因數：20 的質因數是 2 和 5，20＝2×2×5。忘了也可以先看〈質因數〉。', pic: brk6([[2, 2, 5]]) },
      { t: 'act', id: 'd', who: 'demo', say: '拆開 12，再用乘號把每個數接回去。', n: 2, pic: k => brk6([[12], [2, 6], [2, 2, 3]])(k) + (k === 2 ? sym6([[12, '', K1], '＝', [2, '', K3], '×', [2, '', K3], '×', [3, '', K3]]) : ''), cap: k => `拆了 ${k} 次`, done: '12＝2×2×3。' },
      { t: 'act', id: 's', say: '8 號零件：點還能再拆的數。', tip: '8＝2×4，4 還不是質數。', n: 2, pic: brk6([[8], [2, 4], [2, 2, 2]]), cap: k => `拆了 ${k} 次`, done: '8＝2×2×2。' },
      { t: 'say', say: '拆的路不只一條：20 先拆成 2×10，或先拆成 4×5，拆到底都得到 2×2×5，乘起來還是 20。', pic: () => `<div class="ex6">20 → 2×10 → 2×2×5<br>20 → 4×5 → 2×2×5</div>` },
      { t: 'guess', say: '有人寫 30＝5×6。這樣寫完了嗎？', o: ['還沒，6 還能拆', '寫完了'] },
      { t: 'act', id: 's30', say: '把 30 拆到每個數都是質數。', tip: '30＝2×15，15 還能拆嗎？', n: 2, pic: brk6([[30], [2, 15], [2, 3, 5]]), cap: k => `拆了 ${k} 次`, done: '30＝2×3×5。5×6 的 6＝2×3 還能拆。' },
      { t: 'say', id: 'map', say: '把每個質數用乘號接回去。', pic: () => sym6([[30, '原來的數', K1], '＝', [2, '質數', K3], '×', [3, '質數', K3], '×', [5, '質數', K3]]) },
      { t: 'name', say: '這樣的寫法有名字。', name: '把一個大於 1 的整數寫成幾個質數相乘，叫<b>質因數分解</b>。30＝2×3×5。', pic: () => sym6([[30, '', K1], '＝', [2, '', K3], '×', [3, '', K3], '×', [5, '', K3]]) },
      { t: 'check', o: ['30＝2×3×5 是質因數分解', '30＝5×6 是質因數分解'], a: 0, why: [, '6 不是質數，6＝2×3 還能拆。'] },
      { t: 'pose', say: '只改一個地方：12 換成 24，質因數分解會怎樣？', o: ['多一個 2：24＝2×2×2×3', '完全一樣'], a: 0, why: [, '24＝12×2，多乘了一個 2。'] },
    ],
    q: { t: '18 的質因數分解是？', o: ['18＝2×3×3', '18＝2×9', '18＝3×6'], a: 0, why: [, '9＝3×3，還能拆。', '6＝2×3，還能拆。'], ok: '對了！2、3、3 都是質數。', back: 's', hint: '拆到每個數都是質數。' } },
  short: { sem: '六上', who: 'octopus', word: '短除法', hide: ['短除'], fs: 'h',
    steps: [
      { t: 'say', say: '紅積木 8 塊、藍積木 12 塊，要分成幾份，每份的紅積木一樣多、藍積木也一樣多，都不能剩。最多可以分成幾份？先從小一點的數試。', pic: () => dotsC(8, K4) + '<br>' + dotsC(12, K2) },
      { t: 'act', id: 'd', who: 'demo', say: '紅 4 塊、藍 6 塊：選一個能同時整除 4 和 6 的質數。我選 2。', n: 1, pic: ladStep6(4, 6, [2]), cap: k => k ? '分成 2 份：每份 2 紅、3 藍' : '', done: '剩下 2 和 3，除了 1，沒有能同時整除它們的數了，所以最多分成 2 份。' },
      { t: 'act', id: 'h', who: 'half', say: '8 塊和 12 塊：每次選一個能同時整除這兩個數的質數，分別相除，直到剩下的兩個數只有 1 能同時整除。', n: 2, pic: ladStep6(8, 12, [2, 2]), cap: k => `除了 ${k} 次`, done: '先除以 2 得 4 和 6，再除以 2 得 2 和 3。2 和 3 只有 1 能同時整除，停下來。' },
      { t: 'act', id: 's', say: '6 塊和 9 塊：點一個能同時整除這兩個數的質數。', tip: '2 能整除 6，可是不能整除 9；試試別的質數。', n: 1, pic: ladStep6(6, 9, [3]), cap: k => k ? '每份 2 紅、3 藍' : '', done: '除以 3，剩 2 和 3：最多分成 3 份。' },
      { t: 'guess', say: '8 和 12，左邊的除數是 2 和 2，2×2＝4。這個 4 代表什麼？', o: ['最多可以分成 4 份', '一共有 4 塊'] },
      { t: 'say', id: 'map', say: '左邊的除數相乘，就是最多分成幾份，也就是最大公因數。', pic: () => ladderHtml([[2, 8, 12], [2, 4, 6]], 2, 3) + sym6([[2, '除數', K2], '×', [2, '除數', K2], '＝', [4, '最大公因數', K3]]) },
      { t: 'name', say: '這種直直往下寫的方法有名字。', name: '每次選一個能同時整除兩個數的質數，分別相除，把商直直往下寫，叫<b>短除法</b>。這一段用它找最大公因數：除到剩下的兩個數只有 1 能同時整除時，左邊的除數相乘就是最大公因數。', pic: () => ladderHtml([[2, 8, 12], [2, 4, 6]], 2, 3) },
      { t: 'check', o: ['每次選一個能同時整除這兩個數的質數', '只要能整除其中一個數就可以', '把兩個數加起來再除'], a: 0, why: [, '要兩個數都能被它整除：12 能被 3 整除，8 卻不行。', '短除法是兩個數分別相除，不是相加。'] },
      { t: 'pose', say: '哪一題可以用短除法找最大公因數？', o: ['10 顆蘋果、15 顆橘子，最多分成幾份，每份蘋果一樣多、橘子也一樣多？', '10 顆蘋果吃掉 5 顆，剩幾顆？'], a: 0, why: [, '這題是減法，不用找能同時整除的數。'], ok: '對了！短除法也能找最小公倍數，但停下來以後要乘的數不一樣，另外看〈短除法找最小公倍數〉。' },
    ],
    q: { t: '10 和 15 用短除法，第一個除數選哪一個？', o: ['5', '2', '3'], a: 0, why: [, '10 能被 2 整除，15 不能。', '15 能被 3 整除，10 不能。'], ok: '對了！5 能同時整除 10 和 15。', back: 's', hint: '要選能同時整除兩個數的質數。' } },
  lcmS: { sem: '六上', who: 'octopus', word: '短除法找最小公倍數', hide: [], fs: 's2',
    steps: [
      { t: 'say', say: '兩盞燈現在同時亮起。紅燈每 4 秒亮一次，綠燈每 6 秒亮一次。從現在算起，最早第幾秒會再一起亮？', pic: () => '<div class="it6">🔴 🟢</div>' },
      { t: 'act', id: 'd', who: 'demo', say: '先一個一個列出來：點一下，寫出下一次亮的時間。', n: 2, pic: k => tbl6([['', '第 1 次', '第 2 次', '第 3 次'], ['紅燈（秒）', 4, k >= 1 ? 8 : '', k >= 2 ? 12 : ''], ['綠燈（秒）', 6, k >= 2 ? 12 : '', '']]) + addBtn6('寫出下一次', k < 2), cap: k => k >= 2 ? '紅燈和綠燈都有 12' : '', done: '第 12 秒最早再一起亮。12 是 4 和 6 的最小公倍數。' },
      { t: 'act', id: 'h', who: 'demo', say: '用短除法算：4 和 6 先一起除以 2。', n: 1, pic: ladStep6(4, 6, [2]), cap: k => k ? '剩下 2 和 3' : '', done: '2 和 3 只有 1 能同時整除，停下來。' },
      { t: 'say', say: '最小公倍數要把左邊的除數 2，和最下面剩下的 2、3 全部乘起來：2×2×3＝12，和列表找到的一樣。', pic: () => ladderHtml([[2, 4, 6]], 2, 3) + sym6([[2, '除數', K2], '×', [2, '剩下', K4], '×', [3, '剩下', K1], '＝', [12, '', K3]]) },
      { t: 'guess', say: '8 和 12 用短除法除到剩下 2 和 3。最小公倍數要把哪些數乘起來？', o: ['左邊的除數和最下面的 2、3 全部', '只乘左邊的除數', '只乘最下面的 2 和 3'] },
      { t: 'act', id: 's', say: '8 和 12：每次選一個能同時整除這兩個數的質數。', tip: '8 和 12 都是偶數，先試 2。', n: 2, pic: ladStep6(8, 12, [2, 2]), cap: k => `除了 ${k} 次`, done: '除到 2 和 3，停下來。' },
      { t: 'act', id: 's2', say: '選出 8 和 12 的最小公倍數要乘哪些數。', tip: '公倍數要同時是 8 和 12 的倍數；只乘左邊得到的 4，比 8 還小。', n: 1, pic: k => ladderHtml([[2, 8, 12], [2, 4, 6]], 2, 3) + (k ? sym6([[2, '除數', K2], '×', [2, '除數', K2], '×', [2, '剩下', K4], '×', [3, '剩下', K1], '＝', [24, '最小公倍數', K3]]) : chips6(['2×2×2×3＝24', '2×2＝4', '2×3＝6'], (_, i) => i === 0, (_, i) => i === 1 ? '2×2＝4 是最大公因數；4 比 8 小，不會是 8 的倍數。' : '6 不是 8 的倍數。')), cap: k => k ? '24÷8＝3，24÷12＝2' : '', done: '24 同時是 8 和 12 的倍數，而且是最小的。' },
      { t: 'say', id: 'map', say: '共同的部分（左邊的除數）只算一次，兩邊各自剩下的數都要乘進去。', pic: () => ladderHtml([[2, 8, 12], [2, 4, 6]], 2, 3) + sym6([[2, '除數', K2], '×', [2, '除數', K2], '×', [2, '8 剩下', K4], '×', [3, '12 剩下', K1], '＝', [24, '最小公倍數', K3]]) },
      { t: 'name', word: '全部相乘', say: '把做法整理起來。', name: '用短除法找最小公倍數：除到兩個數只有 1 能同時整除時停下來，把左邊的除數和最下面剩下的兩個數<b>全部相乘</b>。8 和 12 的最小公倍數是 24。', pic: () => ladderHtml([[2, 8, 12], [2, 4, 6]], 2, 3) },
      { t: 'check', o: ['左邊的除數和最下面剩下的數都要乘', '只乘左邊的除數，就是最小公倍數'], a: 0, why: [, '只乘左邊得到 4，是最大公因數；4 比 8 小，不會是 8 的倍數。'] },
    ],
    q: { t: '甲船每 6 分鐘開一班，乙船每 9 分鐘開一班，現在同時出發。最早再過幾分鐘又同時出發？', o: ['18 分鐘', '3 分鐘', '54 分鐘'], a: 0, why: [, '3 是 6 和 9 的最大公因數，3 分鐘時甲船還沒開下一班。', '54＝6×9 也是公倍數，但不是最小的；共同的 3 只能算一次。'], ok: '對了！6 和 9 除以 3 剩 2 和 3，3×2×3＝18。', back: 's2', hint: '短除法除到停下來以後，左邊的除數和最下面剩下的數都要乘。' } },
  coprime: { sem: '六上', who: 'octopus', word: '互質', hide: ['互質'], fs: 's',
    steps: [
      { t: 'say', say: '先看一個例子：4 顆草莓糖、6 顆檸檬糖，可以平分給 2 人，每人 2 顆草莓糖、3 顆檸檬糖，兩種糖都剛好分完。', pic: () => dotsC(4, K4) + '<br>' + dotsC(6, K2) },
      { t: 'act', id: 'd', who: 'demo', say: '3 顆草莓糖、4 顆檸檬糖，試著平分給 2 人、3 人。', n: 2, pic: tries6(3, 4, [2, 3]), done: '2 人、3 人都不能讓兩種糖同時剛好分完；人數再多，3 顆草莓糖就不夠每人 1 顆。只有分給 1 人可以。' },
      { t: 'act', id: 's', say: '5 顆和 6 顆：照順序試 2 人、3 人、4 人、5 人。', tip: '平分給 2 人時，5 顆能剛好分完嗎？6 顆呢？兩種都要剛好分完才算。', n: 4, pic: tries6(5, 6, [2, 3, 4, 5]), done: '都不能讓兩種糖同時分完。5 的因數是 1、5，6 的因數是 1、2、3、6，共同的只有 1。' },
      { t: 'guess', say: '8 顆和 9 顆，除了 1 人，還能平分給別的人數，讓兩種糖都剛好分完嗎？', o: ['不能', '能'] },
      { t: 'act', id: 's8', say: '試 2 人、3 人、4 人。', tip: '9 是奇數，平分給 2 人會剩 1 顆嗎？', n: 3, pic: tries6(8, 9, [2, 3, 4]), done: '都不行。8 的因數 1、2、4、8，9 的因數 1、3、9，共同的只有 1。' },
      { t: 'say', id: 'map', say: '這幾對數，能同時整除它們的只有 1。', pic: () => sym6([[5, '', K1], '和', [6, '', K2], '→', [1, '公因數只有 1', K3]]) + '<div class="trail">3 和 4、8 和 9 也一樣</div>' },
      { t: 'name', say: '這樣的兩個數有名字。', name: '兩個正整數的公因數只有 1，這兩個數就叫<b>互質</b>。5 和 6 互質，3 和 4 也互質。', pic: () => dotsC(5, K4) + '<br>' + dotsC(6, K2) },
      { t: 'check', o: ['互質的兩個數，公因數只有 1', '互質的兩個數一定都是質數'], a: 0, why: [, '4 和 9 都不是質數，公因數卻只有 1，所以 4 和 9 互質。'] },
      { t: 'pose', say: '哪一題在問「7 和 9 是不是互質」？', o: ['7 枝筆和 9 張紙，除了 1 人，能平分給別的人數、兩樣都剛好分完嗎？', '7 枝筆加 9 張紙，一共幾樣？'], a: 0, why: [, '這題是加法，和能不能同時平分無關。'] },
    ],
    q: { t: '6 和 9 互質嗎？', o: ['不互質，3 能同時整除 6 和 9', '互質'], a: 0, why: [, '試平分給 3 人：6 顆每人 2 顆、9 顆每人 3 顆，都剛好分完。'], ok: '對了！6 和 9 的公因數有 1 和 3，不互質。', back: 's', hint: '試試平分給 2 人、3 人。' } },
  simplest: { sem: '六上', who: 'octopus', word: '最簡分數', hide: ['最簡'], fs: 's',
    steps: [
      { t: 'say', say: '先看披薩：一個披薩平均分成 4 片取 2 片，和平均分成 2 片取 1 片，吃掉的部分一樣多，2/4＝1/2。', pic: () => pie6(4, 4, 2) + pie6(2, 2, 1) },
      { t: 'act', id: 'd', who: 'demo', say: '一片巧克力平均分成 6 格，吃了 4 格（灰色）。每 2 格圈成一大塊。', n: 3, pic: k => grp6(6, 2, k, { cell: i => i < 4 ? '#b8a99a' : '#7a4a1a' }), cap: k => `圈了 ${k} 大塊`, done: '平均分成 3 大塊，吃了 2 大塊：4/6＝2/3，吃的量沒有變。' },
      { t: 'act', id: 's', say: '9 格吃了 6 格，每 3 格圈一大塊。', tip: '每 3 格圈一大塊，圈完數一數：一共幾大塊？吃掉的是幾大塊？', n: 3, pic: k => grp6(9, 3, k, { cell: i => i < 6 ? '#b8a99a' : '#7a4a1a' }), cap: k => `圈了 ${k} 大塊`, done: '3 大塊吃了 2 大塊：6/9＝2/3。' },
      { t: 'guess', say: '2/3 的分子 2 和分母 3，還能一起再圈成更大的塊、兩邊都剛好圈完嗎？', o: ['不能了', '可以'] },
      { t: 'say', id: 'map', say: '分子和分母同除以 3，分數的大小沒有變。', pic: () => sym6([[6, '吃的格數', K1], '/', [9, '全部格數', K2], '→', [2, '吃的大塊', K1], '/', [3, '全部大塊', K2]]) + '<div class="trail">2 和 3 的公因數只有 1，圈不下去了</div>' },
      { t: 'name', say: '圈到不能再圈的分數有名字。', name: '分子和分母互質的分數，叫<b>最簡分數</b>。2/3 是最簡分數；7/4 的 7 和 4 也互質，也是最簡分數。', pic: () => grp6(9, 3, 3, { noHot: true, cell: i => i < 6 ? '#b8a99a' : '#7a4a1a' }) },
      { t: 'check', o: ['分子和分母互質的分數，是最簡分數', '最簡分數一定比 1 小'], a: 0, why: [, '7/4 比 1 大，但 7 和 4 互質，也是最簡分數。'] },
      { t: 'pose', say: '只改一個地方：6/9 改成 6/8，最簡分數還是 2/3 嗎？', o: ['不是，6/8＝3/4', '還是 2/3'], a: 0, why: [, '8 格每 2 格圈一塊，是 4 塊吃 3 塊：3/4。'] },
    ],
    q: { t: '一條巧克力平均分成 10 格，吃了 4 格。用最簡分數表示吃了多少？', o: ['2/5', '4/10', '1/5'], a: 0, why: [, '4 和 10 都能被 2 整除，還能約。', '每 2 格圈一塊，共 5 塊、吃了 2 塊，不是 1 塊。'], ok: '對了！每 2 格圈一塊，5 塊吃了 2 塊。', back: 's', hint: '試著每 2 格圈一大塊。' } },
  fdivm: { sem: '六上', who: 'otter', word: '除以分數', hide: ['除以分數'], fs: 'p2',
    steps: [
      { t: 'act', id: 'int', who: 'demo', say: '先看整數：6 顆糖，每袋 2 顆，一袋一袋圈。', n: 3, pic: k => grp6(6, 2, k, { e: '🍬', cell: '#fff' }), cap: k => `${k} 袋`, done: '3 袋。' },
      { t: 'say', say: '寫成算式，每個數字都有自己的位置：', pic: () => sym6([[6, '全部', K1], '÷', [2, '每份', K2], '＝', [3, '有幾份', K3]]) },
      { t: 'act', id: 'p1', who: 'half', say: '同樣的問題換成披薩：1 個披薩平均分成 4 片，每片是 1/4 個。每人拿 1 片，一片一片拿。', n: 4, pic: k => pies6(1, 4, k), cap: k => `拿了 ${k} 片`, done: '1 個披薩有 4 片 1/4 個。' },
      { t: 'act', id: 'p2', say: '2 個披薩，一片一片數。', tip: '1 個披薩有 4 片；數完第 1 個再數第 2 個。', n: 8, pic: k => pies6(2, 4, k), cap: k => `拿了 ${k} 片`, done: '2 個披薩有 8 片。' },
      { t: 'say', say: '說說看：1 個有 4 片，2 個就是 4 片的 2 倍，4×2＝8 片。', pic: () => pies6(2, 4, 0) },
      { t: 'guess', say: '3 個披薩有幾片 1/4 個？', o: ['12 片', '7 片', '3 片'] },
      { t: 'reveal', say: '3 個披薩，每個 4 片：4×3＝12 片。', pic: () => pies6(3, 4, 0) },
      { t: 'say', id: 'map', say: '把「全部、每份、有幾份」放回去。', pic: () => mini6(pies6(2, 4, 8), sym6([[2, '全部：2 個披薩', K1], '÷', ['1/4', '每份：1/4 個', K2], '＝', [8, '有幾份：8 片', K3]])) },
      { t: 'name', say: '除完反而比 2 大了：每份比 1 小，份數就比全部的數大。', name: '問「2 裡面有幾個 1/4」，寫成 2÷1/4＝8。這就是<b>除以分數</b>：看全部裡面有幾個這麼大的一份。', pic: () => sym6([[2, '全部', K1], '÷', ['1/4', '每份', K2], '＝', [8, '有幾份', K3]]) },
      { t: 'say', say: '份數也可能不是整數：3/4 公升果汁，每杯 1/2 公升。可以倒滿 1 杯，剩下的果汁是一杯的一半，相當於 1 又 1/2 杯的量。3/4÷1/2＝3/2。', pic: () => barRow(4, 3, '#f7c873') + grp6(3, 2, 2, { noHot: true, cell: '#f7c873', lab: '每 2 小格（1/2 公升）是一杯' }) },
      { t: 'check', o: ['2÷1/4 是問 2 裡面有幾個 1/4', '除以分數，答案一定變小'], a: 0, why: [, '剛才 2÷1/4＝8，比 2 大。被除數是正數、除數在 0 和 1 之間時，商比被除數大。'] },
      { t: 'pose', say: '哪一題可以用 3÷1/2 解？', o: ['3 公尺緞帶，每段 1/2 公尺，可以剪幾段？', '3 公尺緞帶剪掉 1/2 公尺，剩多少？', '3 公尺的一半是多少？'], a: 0, why: [, '剪掉 1/2 公尺是減法：3－1/2。', '3 公尺的一半是 3×1/2。'] },
    ],
    q: { t: '2 公升果汁，每杯 1/3 公升，可以倒滿幾杯？', o: ['6 杯', '2/3 杯', '5 杯'], a: 0, why: [, '2/3 是 2×1/3；題目問 2 裡面有幾個 1/3。', '5 是 2＋3。'], ok: '對了！2÷1/3＝6。', back: 'p2', hint: '像披薩：1 公升有 3 杯，2 公升就是 3 杯的 2 倍。' } },
  reciprocal: { sem: '六上', who: 'otter', word: '倒數', hide: ['倒數'], fs: 'g',
    steps: [
      { t: 'say', say: '先回想：1 公尺裡面有幾個 1/3 公尺？平均分成 3 段，有 3 個，1÷1/3＝3。', pic: () => cut6(3, 2, { noCut: true, col: '#f4a9a0', lab: '1 公尺' }) },
      { t: 'act', id: 'd', who: 'demo', say: '1 公尺是 2/3 公尺的幾倍？先把 1 公尺平均分成 3 小段，每小段 1/3 公尺。', n: 2, pic: k => cut6(3, k, { col: '#f4a9a0', lab: '1 公尺' }), cap: k => `切了 ${k} 刀`, done: '3 小段，每段 1/3 公尺。' },
      { t: 'act', id: 'g', who: 'half', say: '2 小段是 2/3 公尺，看作 1 份。每 2 小段圈一份。', n: 2, pic: k => grp6(3, 2, k, { cell: '#f4a9a0' }), cap: k => k === 2 ? '1 份整的，加上半份' : `圈了 ${k} 次`, done: '1 公尺裡有 1 個 2/3 公尺，剩下的 1 小段是一份的一半：1 公尺是 2/3 公尺的 1 又 1/2 倍，也就是 3/2 倍。' },
      { t: 'guess', say: '1 公尺是 3/4 公尺的幾倍？', o: ['4/3 倍', '3/4 倍', '4 倍'] },
      { t: 'act', id: 's', say: '1 公尺平均分成 4 小段，每 3 小段圈一份。', tip: '3 小段是 3/4 公尺；圈完一份後，剩下的小段是一份的幾分之幾？', n: 2, pic: k => grp6(4, 3, k, { cell: '#a9d0f0' }), cap: k => `圈了 ${k} 次`, done: '1 份整的，剩下 1 小段是一份的 1/3：1 公尺是 3/4 公尺的 4/3 倍。' },
      { t: 'say', say: '說說看：2/3 對到 3/2，3/4 對到 4/3。再乘乘看：2/3×3/2＝1，3/4×4/3＝1。', pic: () => sym6([['2/3', '每份', K2], '→', ['3/2', '幾倍', K3]]) + sym6([['3/4', '每份', K2], '→', ['4/3', '幾倍', K3]]) },
      { t: 'say', id: 'map', say: '1 公尺裡面有幾個 2/3 公尺。', pic: () => sym6([[1, '全部', K1], '÷', ['2/3', '每份', K2], '＝', ['3/2', '幾倍', K3]]) },
      { t: 'name', say: '相乘等於 1 的兩個數，有名字。', name: '兩個數相乘等於 1，這兩個數互為<b>倒數</b>。2/3×3/2＝1，所以 2/3 和 3/2 互為倒數。0 乘任何數都是 0，所以 0 沒有倒數。', pic: () => sym6([['2/3', '', K2], '×', ['3/2', '', K3], '＝', [1, '', K1]]) },
      { t: 'check', o: ['2/3 的倒數是 3/2，因為 2/3×3/2＝1', '2/3 的倒數是 1/3', '0 的倒數是 0'], a: 0, why: [, '2/3×1/3＝2/9，不是 1。', '0 乘任何數都是 0，乘起來不會等於 1，所以 0 沒有倒數。'] },
      { t: 'pose', say: '只改一個地方：每份 2/3 公尺改成 2/5 公尺，1 公尺是 2/5 公尺的幾倍？', o: ['5/2 倍', '2/5 倍'], a: 0, why: [, '2/5 是一份的長度；2/5 和 5/2 相乘才是 1。'] },
    ],
    q: { t: '1 公升水，每瓶裝 2/5 公升。1 公升是 2/5 公升的幾倍？', o: ['5/2 倍（裝滿 2 瓶，剩下的水是第 3 瓶的一半）', '2/5 倍', '5 倍'], a: 0, why: [, '2/5 是一瓶的量，不是倍數。', '5 是 1 公升裡有幾個 1/5 公升；每瓶是 2 個 1/5 公升。'], ok: '對了！1÷2/5＝5/2：可以裝滿 2 瓶，剩下的水只夠第 3 瓶的一半。如果問「能裝滿幾瓶」，答案是 2 瓶。', back: 's', hint: '平均分成 5 小段，每 2 小段圈一瓶。' } },
  decdiv: { sem: '六上', who: 'crab', word: '除以小數', hide: ['除以小數'], fs: 'h',
    steps: [
      { t: 'say', say: '先回想：6 顆糖，每袋 2 顆，6÷2＝3 袋。', pic: () => sym6([[6, '全部', K1], '÷', [2, '每份', K2], '＝', [3, '有幾份', K3]]) },
      { t: 'guess', say: '3 公尺緞帶，每段 0.5 公尺，剪成的段數比 3 多還是少？', o: ['比 3 少', '比 3 多'] },
      { t: 'act', id: 'd', who: 'demo', say: '先剪 1 公尺：每 0.5 公尺剪一刀。', n: 1, pic: k => cut6(2, k, { lab: '1 公尺' }), cap: k => k ? '2 段' : '', done: '1 公尺有 2 段。' },
      { t: 'act', id: 'h', who: 'half', say: '3 公尺，一刀一刀剪。', n: 5, pic: k => cut6(6, k, { lab: '3 公尺' }), cap: k => `剪了 ${k} 刀`, done: '6 段。每段比 1 公尺短，段數就比 3 多。' },
      { t: 'say', say: '說說看：1 公尺有 2 段，3 公尺就是 2 段的 3 倍，2×3＝6 段。', pic: () => cut6(6, 5, { noCut: true, lab: '3 公尺' }) },
      { t: 'act', id: 's', say: '2 公尺水管，每根 0.4 公尺：點在要鋸的位置。', tip: '0.4＋0.4＋…加到 2 公尺要幾根？照這個根數平均分。', n: 4, pic: k => cut6(5, k, { col: '#a9d0f0', lab: '2 公尺' }), cap: k => `鋸了 ${k} 刀`, done: '5 根：2÷0.4＝5。' },
      { t: 'say', id: 'map', say: '把「全部、每份、有幾份」放回去。也可以把兩個數同乘 10：30÷5＝6，商不變。', pic: () => mini6(cut6(6, 5, { noCut: true }), sym6([[3, '全部', K1], '÷', ['0.5', '每份', K2], '＝', [6, '有幾份', K3]])) },
      { t: 'name', say: '每份比 1 小，份數就比全部的數大。', name: '問「3 裡面有幾個 0.5」，寫成 3÷0.5＝6，這就是<b>除以小數</b>。', pic: () => sym6([[3, '全部', K1], '÷', ['0.5', '每份', K2], '＝', [6, '有幾份', K3]]) },
      { t: 'say', say: '除數比 1 大時呢？3 公尺，每段 1.5 公尺，只能剪 2 段，比 3 少。商比被除數大，只發生在除數比 1 小（而且比 0 大）的時候。', pic: () => cut6(2, 1, { noCut: true, lab: '3 公尺，每段 1.5 公尺' }) },
      { t: 'check', o: ['3÷0.5 是問 3 裡面有幾個 0.5', '除以小數，商一定變大'], a: 0, why: [, '3÷1.5＝2，比 3 小。除數比 1 大，商就比被除數小。'] },
      { t: 'pose', say: '哪一題可以用 4÷0.5 解？', o: ['4 公升水，每杯 0.5 公升，可以倒滿幾杯？', '4 公升水倒掉 0.5 公升，剩多少？'], a: 0, why: [, '倒掉 0.5 公升是減法：4－0.5。'] },
    ],
    q: { t: '2 公尺水管，每根 0.5 公尺，可以鋸成幾根？', o: ['4 根', '1 根', '2.5 根'], a: 0, why: [, '1 是 2×0.5；題目問 2 裡面有幾個 0.5。', '2.5 是 2＋0.5。'], ok: '對了！2÷0.5＝4。', back: 'h', hint: '1 公尺有 2 段，2 公尺呢？' } },
  dshift: { sem: '六上', who: 'crab', word: '被除數和除數同乘 10', hide: [], fs: 'd',
    steps: [
      { t: 'say', say: '1.2 公尺的緞帶，每段 0.4 公尺，可以剪幾段？小數不好直接數，我們換一個單位來數。', pic: () => cut6(3, 2, { noCut: true, lab: '1.2 公尺', col: '#f4a9a0' }) },
      { t: 'act', id: 'd', who: 'demo', say: '把 1.2 公尺看成 12 小格，每格 0.1 公尺。每段 0.4 公尺就是 4 小格，點一點圈一段。', n: 3, pic: k => grp6(12, 4, k, { cell: '#f4a9a0', lab: '1.2 公尺＝12 小格（每格 0.1 公尺）' }), cap: k => `圈了 ${k} 段`, done: '圈出 3 段。12 小格裡有幾個 4 小格：12÷4＝3。' },
      { t: 'guess', say: '1.2÷0.4 和 12÷4，商一樣嗎？', o: ['一樣，都是 3', '不一樣'] },
      { t: 'say', id: 'map', say: '都用 0.1 公尺當一小格來數，等於兩個數都乘 10。', pic: () => sym6([['1.2', '全部（公尺）', K1], '÷', ['0.4', '每段（公尺）', K2], '＝', [3, '段數', K3]]) + '<div class="trail">⬇ 被除數、除數都乘 10（改用小格來數）</div>' + sym6([[12, '全部（小格）', K1], '÷', [4, '每段（小格）', K2], '＝', [3, '段數', K3]]) },
      { t: 'act', id: 's', say: '2.4 公升果汁，每杯 0.6 公升。用 0.1 公升當一小格，選出商一樣的整數除法。', tip: '2.4 公升是幾個 0.1 公升？0.6 公升呢？兩個數都要換。', n: 1, pic: k => (k ? sym6([[24, '小格', K1], '÷', [6, '小格', K2], '＝', [4, '杯', K3]]) : chips6(['24÷6', '2.4÷6', '24÷0.6'], (_, i) => i === 0, (_, i) => i === 1 ? '只把除數乘 10，被除數沒有乘，商會變：2.4÷6＝0.4。' : '只把被除數乘 10，除數沒有乘，商會變：24÷0.6＝40。')), cap: k => k ? '2.4÷0.6＝24÷6' : '', done: '24÷6＝4，所以 2.4÷0.6 也是 4 杯。' },
      { t: 'name', word: '商不變', say: '把剛才的發現整理起來。', name: '<b>被除數和除數同乘 10</b>（或同乘 100），商不變。所以 1.2÷0.4 可以改成 12÷4 來算。小數除法的直式裡，兩個小數點一起往右移，就是這個道理。', pic: () => sym6([['1.2', '', K1], '÷', ['0.4', '', K2], '＝', [12, '', K1], '÷', [4, '', K2]]) },
      { t: 'check', o: ['被除數和除數同乘 10，商不變', '只把除數乘 10，商也不變'], a: 0, why: [, '1.2÷4＝0.3，和 1.2÷0.4＝3 不一樣。兩個數都要乘。'] },
    ],
    q: { t: '3.5 公尺，每段 0.7 公尺，可以剪幾段？哪一個算式的商和它一樣？', o: ['35÷7', '35÷0.7', '3.5÷7'], a: 0, why: [, '只把被除數乘 10，商變成 50。', '只把除數乘 10，商變成 0.5。'], ok: '對了！35÷7＝5，3.5÷0.7 也是 5 段。', back: 's', hint: '被除數和除數要一起乘 10。' } },
  pi: { sem: '六上', who: 'fox', word: '圓周率', hide: ['圓周率', '3.14'], fs: 's',
    steps: [
      { t: 'say', say: '直的長度可以用尺量。圓的邊彎彎的，要怎麼量它一圈有多長？', pic: () => rollSvg(20, 0, 1, 0) },
      { t: 'guess', say: '一個圓紙片的直徑是 1 根吸管長。繞圓紙片一圈，大約是幾根吸管長？', o: ['2 根', '3 根多一點', '4 根多'] },
      { t: 'act', id: 'd', who: 'demo', say: '把圓紙片立起來，沿著直線滾一圈，不滑動：點圓片，每次滾 1/4 圈。', n: 4, pic: k => wheel6(20, k), cap: k => `滾了 ${k}/4 圈`, done: '紅線就是圓紙片一圈的長，拉直了。' },
      { t: 'act', id: 's', say: '用吸管量紅線：每根吸管和直徑一樣長，點紅線放一根。', tip: '吸管一根接一根，從紅線的左端開始放。', n: 3, pic: k => `<span class="hot6 whl6">${rollSvg(20, 1, 1, k)}</span>`, cap: k => `放了 ${k} 根`, done: '3 根還多一點點。' },
      { t: 'act', id: 'b', say: '換一個直徑 2 根吸管長的大圓盤，也滾一圈。', tip: '點大圓盤，讓它滾 1/4 圈。', n: 4, pic: k => wheel6(40, k), cap: k => `滾了 ${k}/4 圈`, done: '大圓盤一圈大約 6 根多，也是直徑的 3 倍多一點。' },
      { t: 'say', id: 'map', say: '小圓、大圓，一圈的長÷直徑都是 3 倍多一點。', pic: () => sym6([['一圈的長', '', K1], '÷', ['直徑', '', K2], '≈', ['3 倍多', '小圓、大圓都一樣', K3]]) },
      { t: 'name', say: '這個不變的數有名字。', name: '圓一圈的長÷直徑，不管圓多大，得到的數都一樣，叫<b>圓周率</b>，常用 π 表示，大約是 3.14。', pic: () => rollSvg(20, 1, 1, 3) },
      { t: 'check', o: ['不管圓多大，一圈的長÷直徑都大約是 3.14', '大的圓，一圈是直徑的 4 倍'], a: 0, why: [, '剛才大圓盤一圈大約 6 根多，直徑 2 根，還是 3 倍多一點。'] },
      { t: 'pose', say: '哪一題會用到圓周率？', o: ['腳踏車輪子滾一圈（不打滑）走多遠？', '一盒餅乾有幾片？'], a: 0, why: [, '數餅乾片數，和圓一圈的長無關。'] },
    ],
    q: { t: '直徑 1 公尺的呼拉圈，一圈大約幾公尺？（圓周率取 3.14）', o: ['3.14 公尺', '2 公尺', '1 公尺'], a: 0, why: [, '2 公尺只有直徑的 2 倍，一圈比 3 倍還多一點。', '1 公尺是直徑，一圈比直徑長。'], ok: '對了！1×3.14＝3.14 公尺。', back: 's', hint: '一圈大約是 3 根直徑多一點。' } },
  circ: { sem: '六上', who: 'fox', word: '圓周長', hide: ['圓周長'], fs: 's',
    steps: [
      { t: 'say', say: '先回想圓周率：圓一圈的長÷直徑，大約是 3.14。忘了也可以先看〈圓周率〉。', pic: () => rollSvg(20, 1, 1, 3) },
      { t: 'act', id: 'd', who: 'demo', say: '直徑 10 公分的圓盤，沿直線滾一圈、不滑動。', n: 4, pic: k => wheel6(10, k), cap: k => `滾了 ${k}/4 圈`, done: '紅線是一圈拉直的長。' },
      { t: 'act', id: 's', say: '用 10 公分長的直徑棒量紅線：點紅線放一根。', tip: '一根接一根放，數一數放了幾根、是幾公分。', n: 3, pic: k => `<span class="hot6 whl6">${rollSvg(10, 1, 1, k)}</span>`, cap: k => `放了 ${k} 根，${k * 10} 公分`, done: '3 根是 30 公分，還多一點：10×3.14＝31.4 公分。' },
      { t: 'guess', say: '直徑 20 公分的盤子，一圈大約多長？（圓周率取 3.14）', o: ['62.8 公分', '40 公分', '23.14 公分'] },
      { t: 'say', id: 'map', say: '直徑乘 3.14，就是一圈的長。', pic: () => sym6([[10, '直徑', K2], '×', ['3.14', '圓周率', K3], '＝', ['31.4', '一圈的長', K1]]) },
      { t: 'name', say: '一圈的長有名字。', name: '繞圓一圈的長，叫<b>圓周長</b>。圓周長＝直徑×圓周率，本題把圓周率取 3.14。', pic: () => rollSvg(10, 1, 1, 3) },
      { t: 'check', o: ['圓周長是繞圓一圈的長', '圓周長就是直徑'], a: 0, why: [, '直徑是穿過圓心的直線；一圈的長大約是直徑的 3.14 倍。'] },
      { t: 'build', say: '拼一道用「20×3.14」算的題目。', heads: ['東西', '數量', '問題'], cols: [['車輪', '蘋果'], ['直徑 20 公分', '20 顆'], ['滾一圈（不打滑）走多遠？', '一共幾元？']], a: [0, 0, 0], why: ['要圓形的東西。', '要知道直徑。', '要問一圈的長。'], ok: '車輪直徑 20 公分，滾一圈（不打滑）走多遠？20×3.14＝62.8 公分。' },
    ],
    q: { t: '直徑 5 公尺的圓形水池，圓周長怎麼算？（圓周率取 3.14）', o: ['5×3.14', '5＋3.14', '5÷3.14'], a: 0, why: [, '是 3.14 倍，要用乘的，不是加 3.14。', '是直徑的 3.14 倍，要用乘的。'], ok: '對了！5×3.14＝15.7 公尺。', back: 's', hint: '一圈大約是 3.14 根直徑。' },
    rev: '20×3.14＝62.8 公分：是 20 的 3.14 倍，不是 20 加 3.14。', revPic: () => rollSvg(20, 1, 1, 3) },
  halfc: { sem: '六上', who: 'fox', word: '半圓的周長', hide: [], fs: 'd',
    steps: [
      { t: 'say', say: '先回想圓周長：直徑 10 公分的圓，圓周長＝10×3.14＝31.4 公分。', pic: () => rollSvg(10, 1, 1, 3) },
      { t: 'guess', say: '把這個圓沿直徑對切，得到一個半圓。沿著半圓的邊走一圈，長度是多少？', o: ['15.7＋10＝25.7 公分', '15.7 公分', '31.4 公分'] },
      { t: 'act', id: 'd', who: 'demo', say: '沿著半圓的邊走一圈：點一下走一段。', n: 2, pic: k => `<span class="${k < 2 ? 'hot6' : ''} whl6">${halfSvg(k)}</span>`, cap: k => ['', '彎的邊：半個圓周，31.4÷2＝15.7 公分', '再加直的邊：直徑 10 公分'][k], done: '半圓的周長＝15.7＋10＝25.7 公分。直的那條邊也圍在外面，也要算。' },
      { t: 'act', id: 's', say: '直徑 4 公尺的半圓形花圃，要沿著邊圍一圈籬笆。選出正確的算式。', tip: '想一想：籬笆要圍彎的邊，還要圍哪一條邊？', n: 1, pic: k => halfSvg(2).replace('直徑 10 公分', '直徑 4 公尺') + (k ? '' : chips6(['4×3.14÷2＋4', '4×3.14÷2', '4×3.14'], (_, i) => i === 0, (_, i) => i === 1 ? '少了直的那一邊（直徑 4 公尺）。' : '這是整個圓的一圈；半圓的彎邊只有一半。')), cap: k => k ? '6.28＋4＝10.28 公尺' : '', done: '4×3.14÷2＋4＝10.28 公尺。' },
      { t: 'say', id: 'map', say: '彎邊加直邊。', pic: () => sym6([['31.4÷2', '彎邊：半個圓周', K1], '＋', [10, '直邊：直徑', K2], '＝', ['25.7', '半圓的周長', K3]]) },
      { t: 'name', say: '整理一下。', name: '<b>半圓的周長</b>＝圓周長÷2＋直徑。彎的邊和直的邊都要算。', pic: () => halfSvg(2) },
      { t: 'check', o: ['半圓的周長＝圓周長÷2＋直徑', '半圓的周長＝圓周長÷2'], a: 0, why: [, '只算了彎邊；直徑那條邊也圍在外面。'] },
    ],
    q: { t: '直徑 6 公尺的半圓形舞台，周長是多少？（圓周率取 3.14）', o: ['9.42＋6＝15.42 公尺', '9.42 公尺', '18.84 公尺'], a: 0, why: [, '只算了彎邊，少了直徑 6 公尺。', '18.84 公尺是整個圓的一圈。'], ok: '對了！6×3.14÷2＋6＝15.42 公尺。', back: 's', hint: '彎邊是半個圓周，還要加上直徑。' } },
  carea: { sem: '六上', who: 'fox', word: '圓面積', hide: ['圓面積'], fs: 's',
    steps: [
      { t: 'say', say: '先回想長方形：長 4 公分、寬 3 公分，面積是 4×3＝12 平方公分。', pic: () => rectG6(4, 3) },
      { t: 'act', id: 'd', who: 'demo', say: '把一個半徑 3 公分的圓平均切成更多片，上下交錯排：點圖。', n: 3, pic: k => `<span class="hot6">${cutCircleSvg([4, 8, 16, 32][k], 3)}</span>`, cap: k => `平均切成 ${[4, 8, 16, 32][k]} 片`, done: '切得越細，排出來的形狀越接近長方形。' },
      { t: 'guess', say: '排出來的近似長方形，長大約是多少？', o: ['半個圓周', '半徑', '整個圓周'] },
      { t: 'act', id: 's', say: '量這個近似長方形：先選「長」是多少，再選「寬」是多少。', tip: '上面一排的彎邊合起來是圓周的一半；旁邊那一邊是從圓心到圓周。', n: 2, pic: k => cutCircleSvg(32, 3) + (k < 2 ? `<div class="trail">${k ? '長：半個圓周 ✓　現在選「寬」' : '先選「長」'}</div>` + chips6(['半個圓周', '半徑', '直徑'], x => x === (k ? '半徑' : '半個圓周'), x => k ? (x === '直徑' ? '寬是從圓心到圓周，只有半徑那麼長。' : '半個圓周已經是長了。') : (x === '半徑' ? '半徑在排好的形狀的旁邊，是寬那一邊。' : '上面一排的彎邊合起來只有半個圓周，不是直徑。')) : '<div class="trail">長：半個圓周（上下各一半的彎邊）<br>寬：半徑 3 公分</div>'), done: '長是半個圓周，寬是半徑。' },
      { t: 'say', id: 'map', say: '切得越細越接近長方形：長×寬。', pic: () => sym6([['3×3.14', '長：半個圓周', K1], '×', [3, '寬：半徑', K2], '＝', ['28.26', '平方公分', K3]]) },
      { t: 'name', say: '圓內部的大小有名字。', name: '圓內部的大小叫<b>圓面積</b>。圓面積＝半徑×半徑×圓周率，本題取 3.14：3×3×3.14＝28.26 平方公分。', pic: () => cutCircleSvg(32, 3) },
      { t: 'check', o: ['圓面積＝半徑×半徑×3.14', '圓面積＝直徑×3.14'], a: 0, why: [, '直徑×3.14 是圓周長，是一圈的長，不是面積。'] },
      { t: 'pose', say: '哪一題要算圓面積？', o: ['剛好蓋住圓桌桌面的圓形貼紙，要多大？', '圓桌邊要貼多長的花邊？'], a: 0, why: [, '花邊貼在邊上，算的是圓周長。'] },
    ],
    q: { t: '半徑 2 公尺的圓形花圃，面積怎麼算？（圓周率取 3.14）', o: ['2×2×3.14', '2×3.14', '2×2'], a: 0, why: [, '2×3.14 只是半個圓周的長。', '2×2 少乘了 3.14。'], ok: '對了！2×2×3.14＝12.56 平方公尺。', back: 's', hint: '長是半個圓周，寬是半徑。' } },
  ringA: { sem: '六上', who: 'fox', word: '圓環面積', hide: ['圓環'], fs: 'd',
    steps: [
      { t: 'say', say: '先回想圓面積：半徑×半徑×3.14。', pic: () => ringSvg(1) },
      { t: 'guess', say: '一個大圓餅，中間挖掉一個小圓洞。剩下的那一圈，面積怎麼算？', o: ['大圓面積－小圓面積', '大圓半徑－小圓半徑，再算面積', '大圓面積＋小圓面積'] },
      { t: 'act', id: 'd', who: 'demo', say: '點一下：先看大圓，再挖掉小圓。', n: 2, pic: k => `<span class="${k < 2 ? 'hot6' : ''} whl6">${ringSvg(k)}</span>`, cap: k => ['', '大圓半徑 3 公分：3×3×3.14＝28.26 平方公分', '挖掉半徑 1 公分的小圓：1×1×3.14＝3.14 平方公分'][k], done: '剩下的那一圈：28.26－3.14＝25.12 平方公分。' },
      { t: 'act', id: 's', say: '外面的圓半徑 5 公分、裡面的圓半徑 3 公分。選出剩下那一圈的面積算式。', tip: '先算整個大圓，再把挖掉的小圓減掉。', n: 1, pic: k => ringSvg(2, [5, 3]) + (k ? '' : chips6(['5×5×3.14－3×3×3.14', '（5－3）×（5－3）×3.14', '5×5×3.14＋3×3×3.14'], (_, i) => i === 0, (_, i) => i === 1 ? '（5－3）×（5－3）×3.14 是半徑 2 公分的小圓，比剩下的那一圈小很多。' : '小圓被挖掉了，要用減的。')), cap: k => k ? '78.5－28.26＝50.24 平方公分' : '', done: '78.5－28.26＝50.24 平方公分。' },
      { t: 'say', id: 'map', say: '大圓減小圓。', pic: () => sym6([['28.26', '外圓面積', K1], '－', ['3.14', '內圓面積', K2], '＝', ['25.12', '剩下那一圈', K3]]) },
      { t: 'name', say: '中間挖空的這種圖形有名字。', name: '大圓中間挖掉一個同圓心的小圓，剩下的圖形叫<b>圓環</b>。圓環面積＝外圓面積－內圓面積。', pic: () => ringSvg(2) },
      { t: 'check', o: ['圓環面積＝外圓面積－內圓面積', '圓環面積＝（外圓半徑－內圓半徑）×（外圓半徑－內圓半徑）×3.14'], a: 0, why: [, '半徑相減再算，只得到一個小圓；圓環比它大很多。'] },
    ],
    q: { t: '外圓半徑 4 公尺、內圓半徑 2 公尺的圓環步道，面積是多少？（圓周率取 3.14）', o: ['50.24－12.56＝37.68 平方公尺', '2×2×3.14＝12.56 平方公尺', '50.24＋12.56＝62.8 平方公尺'], a: 0, why: [, '這是用半徑相減得到的小圓。', '內圓是挖掉的，要用減的。'], ok: '對了！4×4×3.14－2×2×3.14＝37.68 平方公尺。', back: 's', hint: '先算外圓面積，再減掉內圓面積。' } },
  ratio: { sem: '六上', who: 'bee', word: '比', hide: ['1：2', '2：4', '3：6', '叫比', '讀作'], fs: 's',
    steps: [
      { t: 'say', say: '泡蜂蜜水：每次都用同一支湯匙、同一個杯子。1 匙蜂蜜配 2 杯水，是我們要的甜度。', pic: () => hw6(1, 2) + ' ' + cupHtml(C_HW, 1, 2) },
      { t: 'guess', say: '想泡多一點，蜂蜜放 2 匙，水要幾杯才和原來一樣甜？', o: ['3 杯（多加 1 杯）', '4 杯（再加一整組）'] },
      { t: 'act', id: 'd', who: 'demo', say: '一組一組加：每組 1 匙蜂蜜、2 杯水。', n: 2, pic: k => `<div class="rows6">${Array.from({ length: k + 1 }, () => `<div class="r6">${hw6(1, 2)}</div>`).join('')}</div>` + addBtn6('＋一組', true), cap: k => `${k + 1} 組：蜂蜜 ${k + 1} 匙、水 ${2 * (k + 1)} 杯`, done: '3 組：蜂蜜 3 匙、水 6 杯，甜度和原來一樣。' },
      { t: 'act', id: 's', say: '從 1 組開始，要和原來一樣甜，下一步加什麼？', tip: '每一組都是 1 匙蜂蜜配 2 杯水。', n: 1, pic: k => `<div class="rows6">${Array.from({ length: k + 1 }, () => `<div class="r6">${hw6(1, 2)}</div>`).join('')}</div>` + (k ? '' : chips6(['＋1 匙蜂蜜、2 杯水', '＋1 杯水', '＋1 匙蜂蜜'], (_, i) => i === 0, (_, i) => i === 1 ? '只加水，蜂蜜沒有變多，會變淡。' : '只加蜂蜜，會變甜。')), cap: k => `蜂蜜 ${k + 1} 匙、水 ${2 * (k + 1)} 杯`, done: '蜂蜜 2 匙要配 4 杯水。' },
      { t: 'say', say: '比一比：2 匙配 3 杯（左）水只多 1 杯，蜂蜜相對比較多，比較甜；2 匙配 4 杯（右）和原來一樣甜。', pic: () => `<div class="pair6"><div>${cupHtml(C_HW, 2, 3)}<small>2 匙、3 杯</small></div><div>${cupHtml(C_HW, 2, 4)}<small>2 匙、4 杯</small></div></div>` },
      { t: 'say', id: 'map', say: '每組都是「1 匙蜂蜜對 2 杯水」。', pic: () => tbl6([['蜂蜜（匙）', 1, 2, 3], ['水（杯）', 2, 4, 6]]) + sym6([[1, '蜂蜜匙數', K1], '對', [2, '水杯數', K2]]) },
      { t: 'name', say: '這種「幾對幾」的寫法有名字。', name: '用同一支匙、同一個杯子時，「1 匙蜂蜜對 2 杯水」可以寫成 1：2，讀作「1 比 2」，這樣的寫法叫<b>比</b>。', pic: () => sym6([[1, '蜂蜜匙數', K1], '：', [2, '水杯數', K2]]) },
      { t: 'check', o: ['1：2 表示蜂蜜 1 匙對水 2 杯', '1：2 表示水比蜂蜜多 1 杯'], a: 0, why: [, '比說的是「幾對幾」：2 匙對 4 杯也還是同一個配方，水多了 2 杯。'] },
      { t: 'pose', say: '只改一個地方：每組改成 1 匙蜂蜜配 3 杯水，2 組要幾杯水？', o: ['6 杯', '4 杯'], a: 0, why: [, '每組 3 杯水，2 組是 3×2＝6 杯。'] },
    ],
    q: { t: '紅顏料 1 匙配藍顏料 3 匙（同一支匙）。做 2 組一樣的顏色，藍顏料要幾匙？', o: ['6 匙', '4 匙', '3 匙'], a: 0, why: [, '4 匙是只多加 1 匙。', '3 匙只有 1 組。'], ok: '對了！每組 3 匙，2 組是 3×2＝6 匙。', back: 's', hint: '一組一組加：每組 1 匙紅、3 匙藍。' } },
  eqr: { sem: '六上', who: 'bee', word: '相等的比', hide: ['相等的比'], fs: 'd',
    steps: [
      { t: 'say', say: '先回想比：用同樣的量杯，2 杯蜂蜜配 3 杯水，寫成 2：3。', pic: () => dotsC(2, HON) + dotsC(3, WAT) },
      { t: 'guess', say: '想多做一倍、保持相同的配方，蜂蜜和水各要多少杯？', o: ['4 杯蜂蜜、6 杯水', '3 杯蜂蜜、4 杯水'] },
      { t: 'act', id: 'd', who: 'demo', say: '一組一組加，填進表格。', n: 2, pic: k => tbl6([['蜂蜜（杯）', ...Array.from({ length: k + 1 }, (_, i) => 2 * (i + 1))], ['水（杯）', ...Array.from({ length: k + 1 }, (_, i) => 3 * (i + 1))]]) + addBtn6('＋一組', true), done: '2：3、4：6、6：9，都是同一個配方。' },
      { t: 'act', id: 's', say: '1：4 的配方，再加兩組：下一組要填什麼？', tip: '每一組是 1 杯蜂蜜配 4 杯水，要一整組一起加。', n: 2, pic: k => tbl6([['蜂蜜（杯）', ...Array.from({ length: k + 1 }, (_, i) => i + 1)], ['水（杯）', ...Array.from({ length: k + 1 }, (_, i) => 4 * (i + 1))]]) + (k < 2 ? chips6(k ? ['3 和 12', '3 和 9'] : ['2 和 8', '2 和 5'], (_, i) => i === 0, () => '只多加 1 杯水不對：每組是 1 杯蜂蜜配 4 杯水，要一整組一起加。') : ''), done: '1：4、2：8、3：12。' },
      { t: 'say', say: '如果兩邊都只加 1，變成 3：4。蜂蜜 3 杯、水 4 杯，蜂蜜相對於水的比例提高了，比 2：3 更甜，和原來不同。', pic: () => `<div class="pair6"><div>${cupHtml(C_HW, 2, 3)}<small>2：3</small></div><div>${cupHtml(C_HW, 3, 4)}<small>3：4</small></div><div>${cupHtml(C_HW, 4, 6)}<small>4：6</small></div></div>` },
      { t: 'say', id: 'map', say: '前後都乘 2，比值不變。', pic: () => sym6([[2, '', K1], '：', [3, '', K2], '×2→', [4, '', K1], '：', [6, '', K2]]) + '<div class="trail">2÷3 和 4÷6 都是 2/3</div>' },
      { t: 'name', say: '同一個配方的比有名字。', name: '比的前後兩個數，同乘（或同除以）同一個不是 0 的數，比值不變。比值相同的比，叫<b>相等的比</b>。2：3＝4：6。', pic: () => tbl6([['蜂蜜', 2, 4, 6], ['水', 3, 6, 9]]) },
      { t: 'check', o: ['前後同乘同一個數，得到相等的比', '前後同加同一個數，得到相等的比'], a: 0, why: [, '2：3 都加 1 變成 3：4，比值從 2/3 變成 3/4，配方變了。'] },
      { t: 'pose', say: '哪一題可以用 2：3＝4：□ 解？', o: ['2 杯蜂蜜配 3 杯水，4 杯蜂蜜要配幾杯水才是同一個配方？', '2 杯蜂蜜加 3 杯水，一共幾杯？'], a: 0, why: [, '這題是加法，不是找同一個配方。'] },
    ],
    q: { t: '1：4 和哪一個是相等的比？', o: ['3：12', '3：6', '2：5'], a: 0, why: [, '3：6 的比值是 1/2，1：4 的比值是 1/4。', '2：5 是前後都加 1，比值變了。'], ok: '對了！前後都乘 3。', back: 's', hint: '一組一組往下加：前後要乘同一個數。' } },
  share: { sem: '六上', who: 'bee', word: '按比分配', hide: ['按比分配'], fs: 'd',
    steps: [
      { t: 'say', say: '先回想比：甲站和乙站的補給箱數比是 2：3，表示甲站每拿 2 箱，乙站就拿 3 箱。', pic: () => `<div class="r6">甲 ${'📦'.repeat(2)} ｜ 乙 ${'📦'.repeat(3)}</div>` },
      { t: 'guess', say: '一共 20 箱，按 2：3 分給甲站和乙站。甲站分到幾箱？', o: ['8 箱', '10 箱（兩站一樣多）', '2 箱'] },
      { t: 'act', id: 'd', who: 'demo', say: '一輪一輪分：每一輪甲站拿 2 箱、乙站拿 3 箱，一輪共 5 箱。點一下分一輪。', n: 4, pic: k => shareRows6(k) + addBtn6('分一輪', k < 4), cap: k => k ? `分了 ${k} 輪，用掉 5×${k}＝${5 * k} 箱` : '', done: '分 4 輪剛好分完：甲站 2×4＝8 箱，乙站 3×4＝12 箱。' },
      { t: 'act', id: 's', say: '24 根能量棒，按 1：3 分給甲組和乙組。先想一輪分幾根，再想要分幾輪。', tip: '一輪裡，甲組拿 1 根、乙組拿 3 根，一輪一共幾根？', n: 2, pic: k => (k < 2 ? chips6(k ? ['24÷4＝6 輪', '24÷3＝8 輪'] : ['一輪 4 根（1＋3）', '一輪 3 根', '一輪 1 根'], (_, i) => i === 0, (_, i) => k ? '一輪是 4 根，不是 3 根。' : i === 1 ? '3 根只是乙組的；甲組也要拿 1 根。' : '1 根只是甲組的；乙組也要拿 3 根。') : sym6([[1, '甲每輪', K4], '×', [6, '輪', K3], '＝', [6, '甲組', K4]])), cap: k => ['', '一輪 4 根', '分 6 輪'][k], done: '6 輪：甲組 1×6＝6 根，乙組 3×6＝18 根。' },
      { t: 'say', id: 'map', say: '先算輪數，再算各拿幾個。', pic: () => sym6([[20, '全部', K1], '÷', [5, '一輪：2＋3', K2], '＝', [4, '輪數', K3]]) + sym6([[2, '甲每輪', K4], '×', [4, '輪數', K3], '＝', [8, '甲站', K4]]) },
      { t: 'name', say: '這樣分的方法有名字。', name: '照一個比來分東西，叫<b>按比分配</b>：先把比的兩個數加起來，看一輪分幾個；全部÷一輪的個數＝輪數；每一方每輪拿幾個×輪數，就是分到的個數。', pic: () => shareRows6(4) },
      { t: 'check', o: ['先算一輪一共分幾個（比的兩個數相加）', '按 2：3 分，就是兩邊一樣多'], a: 0, why: [, '2：3 表示每輪甲 2 箱、乙 3 箱，乙比較多，不是一樣多。'] },
    ],
    q: { t: '30 顆糖按 1：2 分給弟弟和哥哥，弟弟分到幾顆？', o: ['10 顆', '15 顆', '20 顆'], a: 0, why: [, '15 是兩人一樣多；1：2 表示每輪弟弟 1 顆、哥哥 2 顆。', '20 顆是哥哥分到的。'], ok: '對了！一輪 3 顆，分 10 輪：弟弟 1×10＝10 顆。', back: 's', hint: '一輪分 1＋2＝3 顆，30 顆可以分幾輪？' } },
  simpr: { sem: '六上', who: 'bee', word: '最簡單整數比', hide: ['最簡單', '質數'], fs: 'd',
    steps: [
      { t: 'say', say: '先回想圈組：6 個每 3 個圈一組，是 2 組。', pic: () => grp6(6, 3, 2, { noHot: true }) },
      { t: 'act', id: 'd', who: 'demo', say: '6 杯蜂蜜、9 杯水，每 3 杯圈一組。', n: 5, pic: k => grp6(6, 3, Math.min(k, 2), { cell: HON, lab: '蜂蜜', noHot: k >= 2 }) + grp6(9, 3, Math.max(0, k - 2), { cell: WAT, lab: '水', noHot: k < 2 }), cap: k => `圈了 ${k} 組`, done: '2 組對 3 組。' },
      { t: 'act', id: 's', say: '4 杯蜂蜜、6 杯水，每 2 杯圈一組。', tip: '先圈完蜂蜜，再圈水；每 2 杯一組。', n: 5, pic: k => grp6(4, 2, Math.min(k, 2), { cell: HON, lab: '蜂蜜', noHot: k >= 2 }) + grp6(6, 2, Math.max(0, k - 2), { cell: WAT, lab: '水', noHot: k < 2 }), cap: k => `圈了 ${k} 組`, done: '也是 2 組對 3 組。' },
      { t: 'guess', say: '2 組對 3 組，兩邊還能一起再圈成更大的組、都剛好圈完嗎？', o: ['不能了', '可以'] },
      { t: 'say', id: 'map', say: '圈好的組數寫成比。', pic: () => sym6([[6, '蜂蜜杯數', K1], '：', [9, '水杯數', K2], '→', [2, '組', K1], '：', [3, '組', K2]]) },
      { t: 'name', say: '圈到不能再圈的比有名字。', name: '比的前後兩個數都是整數，而且它們的公因數只有 1，這個比叫<b>最簡單整數比</b>。6：9 的最簡單整數比是 2：3。', pic: () => sym6([[2, '', K1], '：', [3, '', K2]]) },
      { t: 'check', o: ['最簡單整數比的前後兩個數，公因數只有 1', '最簡單整數比裡一定有一個數是 1'], a: 0, why: [, '2：3 裡沒有 1，但 2 和 3 的公因數只有 1，已經是最簡單整數比。'] },
      { t: 'say', say: '比裡有小數時，先變成整數：0.6：0.9，前後同乘 10 得 6：9，再化成 2：3。', pic: () => sym6([['0.6', '', K1], '：', ['0.9', '', K2], '×10→', [6, '', K1], '：', [9, '', K2], '→', [2, '', K1], '：', [3, '', K2]]) },
      { t: 'pose', say: '只改一個地方：8：12 每 4 個圈一組，會變成？', o: ['2：3', '4：6'], a: 0, why: [, '4：6 還能每 2 個再圈一組。'] },
    ],
    q: { t: '8 桶沙、12 桶水泥，最簡單整數比是？', o: ['2：3', '4：6', '8：12'], a: 0, why: [, '4 和 6 的公因數還有 2。', '8 和 12 的公因數還有 2、4。'], ok: '對了！每 4 桶一組。', back: 's', hint: '圈成最大的組，兩邊都剛好圈完。' } },
  arc: { sem: '六上', who: 'sheep', word: '弧長', hide: ['弧'], fs: 's',
    steps: [
      { t: 'say', say: '先回想圓周長：繞圓一圈的長。這個圓形披薩一圈是 40 公分。', pic: () => pie6(1, 0, 0) },
      { t: 'guess', say: '把披薩平均切成 4 片，拿 1 片。這片彎彎的邊有多長？', o: ['10 公分', '40 公分', '20 公分'] },
      { t: 'act', id: 'd', who: 'demo', say: '平均切成 4 片：點披薩切一刀。', n: 4, pic: k => pie6(4, k, 0, { hot: 'cut' }), cap: k => `切了 ${k} 刀`, done: '4 片一樣大，每片的圓心角是 360÷4＝90 度。' },
      { t: 'act', id: 's', say: '拿走一片，看它彎彎的邊。', tip: '點任何一片，把它拿走。', n: 1, pic: k => pie6(4, 4, k, { hot: 'take', takenCol: K4 }), cap: k => k ? '彎邊是整圈的 1/4' : '', done: '40÷4＝10 公分。' },
      { t: 'act', id: 's3', say: '換一個一圈 30 公分的披薩：平均切成 3 片，拿 1 片。', tip: '先點披薩切 3 刀，再拿走 1 片。', n: 4, pic: k => pie6(3, Math.min(k, 3), Math.max(0, k - 3), { hot: k < 3 ? 'cut' : 'take', takenCol: K4 }), cap: k => k > 3 ? '彎邊是 1/3 圈：10 公分' : `切了 ${Math.min(k, 3)} 刀`, done: '30×1/3＝10 公分。' },
      { t: 'say', id: 'map', say: '一圈的長乘「這片占一圈的幾分之幾」。', pic: () => sym6([[40, '一圈的長', K1], '×', ['90/360', '圓心角 90 度占一圈', K2], '＝', [10, '彎邊', K3]]) },
      { t: 'name', say: '彎彎的那一段有名字。', name: '圓周上的一段叫弧，這段彎曲的長叫<b>弧長</b>。扇形的弧長＝圓周長×圓心角/360。', pic: () => pie6(4, 4, 1, { takenCol: K4 }) },
      { t: 'check', o: ['弧長是扇形彎彎那條邊的長', '弧長就是半徑'], a: 0, why: [, '半徑是從圓心到圓周的直線；弧是彎的那一段。'] },
      { t: 'pose', say: '哪一題在算弧長？', o: ['扇子張開 1/3 圈，只在彎彎的邊上貼花邊，要多長？', '扇子的紙面有多大？'], a: 0, why: [, '紙面有多大是面積，不是邊的長。'], ok: '對了！如果要沿著整個扇形的邊貼，還要加兩條半徑，另外看〈扇形的周長〉。' },
    ],
    q: { t: '一圈 60 公分的圓，切下圓心角 120 度的一片，彎邊多長？', o: ['20 公分', '60 公分', '30 公分'], a: 0, why: [, '60 公分是整圈。', '30 公分是半圈（180 度）。'], ok: '對了！60×120/360＝20 公分。', back: 's', hint: '120 度是一圈 360 度的幾分之幾？' } },
  sperim: { sem: '六上', who: 'sheep', word: '扇形的周長', hide: [], fs: 'd',
    steps: [
      { t: 'say', say: '先回想弧長：扇形彎彎那條邊的長。', pic: () => sectorSvg(1) },
      { t: 'guess', say: '半徑 6 公分、圓心角 90 度的扇形，要沿著它的邊貼一圈緞帶。要貼哪些邊？', o: ['彎邊和兩條半徑', '只有彎邊', '兩條半徑'] },
      { t: 'act', id: 'd', who: 'demo', say: '沿著扇形的邊走一圈：點一下走一段。', n: 3, pic: k => `<span class="${k < 3 ? 'hot6' : ''} whl6">${sectorSvg(k)}</span>`, cap: k => ['', '彎邊：6×2×3.14×90/360＝9.42 公分', '一條半徑：6 公分', '另一條半徑：6 公分'][k], done: '扇形的周長＝9.42＋6＋6＝21.42 公分。' },
      { t: 'act', id: 's', say: '半徑 3 公分、圓心角 120 度的扇形，弧長是 6.28 公分。選出周長的算式。', tip: '數一數：扇形的邊有幾條？', n: 1, pic: k => sectorSvg6(120, { arc: true, radii: true, h: 150 }) + (k ? '' : chips6(['6.28＋3＋3', '6.28', '6.28＋3'], (_, i) => i === 0, (_, i) => i === 1 ? '只算了彎邊，少了兩條半徑。' : '扇形有兩條半徑，少算了一條。')), cap: k => k ? '6.28＋3＋3＝12.28 公分' : '', done: '6.28＋3＋3＝12.28 公分。' },
      { t: 'say', id: 'map', say: '彎邊加兩條半徑。', pic: () => sym6([['9.42', '弧長', K1], '＋', [6, '半徑', K2], '＋', [6, '半徑', K2], '＝', ['21.42', '周長', K3]]) },
      { t: 'name', say: '整理一下。', name: '<b>扇形的周長</b>＝弧長＋半徑×2。', pic: () => sectorSvg(3) },
      { t: 'check', o: ['扇形的周長＝弧長＋2 條半徑', '扇形的周長＝弧長'], a: 0, why: [, '弧長只是彎邊；兩條半徑也圍在外面。'] },
    ],
    q: { t: '半徑 12 公分、圓心角 60 度的扇形，周長是多少？（圓周率取 3.14）', o: ['12.56＋24＝36.56 公分', '12.56 公分', '12.56＋12＝24.56 公分'], a: 0, why: [, '只算了弧長，少了兩條半徑。', '少算了一條半徑。'], ok: '對了！弧長 12×2×3.14×60/360＝12.56，加兩條半徑 24 公分。', back: 's', hint: '扇形的邊有一條彎邊、兩條半徑。' } },
  sarea: { sem: '六上', who: 'sheep', word: '扇形面積', hide: ['扇形面積'], fs: 's',
    steps: [
      { t: 'say', say: '先回想圓面積。這個圓形披薩的面積是 100 平方公分。', pic: () => pie6(1, 0, 0) },
      { t: 'act', id: 'd', who: 'demo', say: '平均切成 4 片。', n: 4, pic: k => pie6(4, k, 0, { hot: 'cut' }), cap: k => `切了 ${k} 刀`, done: '4 片一樣大，每片的圓心角是 90 度。' },
      { t: 'act', id: 's', say: '拿走一片。', tip: '點任何一片，把它拿走。', n: 1, pic: k => pie6(4, 4, k, { hot: 'take', takenCol: K3 }), done: '一片是整個的 1/4：100÷4＝25 平方公分。' },
      { t: 'guess', say: '如果平均切成 2 片，1 片的面積是多少？', o: ['50 平方公分', '100 平方公分', '25 平方公分'] },
      { t: 'act', id: 's2', say: '平均切成 2 片，拿 1 片。', tip: '先點披薩切 2 刀，再拿走 1 片。', n: 3, pic: k => pie6(2, Math.min(k, 2), Math.max(0, k - 2), { hot: k < 2 ? 'cut' : 'take', takenCol: K3 }), done: '100÷2＝50 平方公分。' },
      { t: 'say', id: 'map', say: '圓面積乘「這片占一圈的幾分之幾」。', pic: () => sym6([[100, '整個圓（平方公分）', K1], '×', ['90/360', '圓心角 90 度', K2], '＝', [25, '一片', K3]]) },
      { t: 'name', say: '一片的大小有名字。', name: '扇形內部的大小，叫<b>扇形面積</b>。扇形面積＝圓面積×圓心角/360。', pic: () => pie6(4, 4, 1, { takenCol: K3 }) },
      { t: 'check', o: ['扇形面積是扇形內部的大小', '扇形面積是彎邊的長'], a: 0, why: [, '彎邊的長是弧長。'] },
      { t: 'pose', say: '哪一題在算扇形面積？', o: ['平均切成 4 片的披薩，1 片上要撒滿起司，要撒多大的地方？', '1 片披薩彎彎的邊有多長？'], a: 0, why: [, '彎邊的長是弧長。'] },
    ],
    q: { t: '圓形披薩面積 300 平方公分，平均分成 3 片，1 片的面積是多少平方公分？', o: ['100', '300', '150'], a: 0, why: [, '300 是整個披薩。', '150 是平均分成 2 片的 1 片。'], ok: '對了！300÷3＝100 平方公分。', back: 's', hint: '平均分成 3 片，拿 1 片。' } },
  speed: { sem: '六上', who: 'rabbit', word: '速率', hide: ['速率', '時速', '分速', '秒速'], fs: 'd',
    steps: [
      { t: 'say', say: '比快慢：兩人跑一樣遠，先到的比較快。', pic: () => raceSvg([{ d: 100, c: K4, e: '🏃' }, { d: 80, c: K2, e: '🏃' }], 100) },
      { t: 'guess', say: '小綠 2 分鐘走 100 公尺，小藍 3 分鐘走 120 公尺，誰比較快？', o: ['小藍，因為走得比較遠', '小綠', '一樣快'] },
      { t: 'act', id: 'd', who: 'demo', say: '假設小綠一路都走得一樣快。把小綠的路平均分成 2 段，每分鐘一段。', n: 1, pic: k => cut6(2, k, { lab: '小綠 2 分鐘 100 公尺', col: '#f4a9a0' }), cap: k => k ? '每分鐘 50 公尺' : '', done: '小綠每分鐘走 50 公尺。' },
      { t: 'act', id: 's', say: '小藍也一路走得一樣快。把小藍的路平均分成 3 段：點在要切的位置。', tip: '3 分鐘要分成 3 段，每段一樣長。', n: 2, pic: k => cut6(3, k, { lab: '小藍 3 分鐘 120 公尺', col: '#a9d0f0' }), cap: k => k === 2 ? '每分鐘 40 公尺' : `切了 ${k} 刀`, done: '小藍每分鐘走 40 公尺。' },
      { t: 'say', say: '都看「每 1 分鐘」走多遠：小綠 50 公尺、小藍 40 公尺，小綠比較快。走得比較遠，可能只是走得比較久。', pic: () => cut6(2, 1, { noCut: true, col: '#f4a9a0', lab: '小綠每段 50 公尺' }) + cut6(3, 2, { noCut: true, col: '#a9d0f0', lab: '小藍每段 40 公尺' }) },
      { t: 'say', id: 'map', say: '路的長除以時間。', pic: () => sym6([[100, '公尺', K1], '÷', [2, '分鐘', K2], '＝', [50, '每分鐘', K3]]) },
      { t: 'name', say: '「每 1 單位時間走多遠」有名字。', name: '每 1 單位時間走的距離，可以表示快慢，叫<b>速率</b>。速率＝距離÷時間。中間如果有快有慢，算出來的是平均速率。', pic: () => sym6([['距離', '', K1], '÷', ['時間', '', K2]]) },
      { t: 'check', o: ['速率是每單位時間走的距離', '走得遠的，速率一定大'], a: 0, why: [, '小藍走得比較遠，但花了 3 分鐘，每分鐘只走 40 公尺。'] },
      { t: 'build', say: '拼一道用「30÷2」算速率的題目。', heads: ['東西', '數量', '問題'], cols: [['腳踏車', '蘋果'], ['2 小時騎 30 公里', '每箱 30 顆'], ['平均每小時騎幾公里？', '一共騎幾公里？']], a: [0, 0, 0], why: ['要會移動的東西。', '要有時間和距離。', '要問每 1 小時走多遠。'], ok: '腳踏車 2 小時騎 30 公里，平均每小時騎幾公里？30÷2＝15。' },
    ],
    q: { t: '機器人 4 秒走 12 公尺（一路一樣快），每秒走幾公尺？', o: ['3', '48', '16'], a: 0, why: [, '48 是 12×4；要把 12 公尺平均分成 4 段。', '16 是 12＋4。'], ok: '對了！12÷4＝3 公尺。', back: 's', hint: '把路平均分成 4 段，每秒一段。' } },
  shisu: { sem: '六上', who: 'rabbit', word: '時速', hide: ['時速'], fs: 'd',
    steps: [
      { t: 'say', say: '先回想速率：每單位時間走多遠。忘了也可以先看〈速率〉。', pic: () => cut6(2, 1, { noCut: true }) },
      { t: 'act', id: 'd', who: 'demo', say: '汽車 2 小時走 120 公里。把路程平均分成 2 段，每小時一段。', n: 1, pic: k => cut6(2, k, { lab: '120 公里' }), cap: k => k ? '每段 60 公里' : '', done: '平均每小時走 60 公里。' },
      { t: 'guess', say: '腳踏車 3 小時騎 45 公里，平均每小時騎幾公里？', o: ['15 公里', '45 公里', '135 公里'] },
      { t: 'act', id: 's', say: '把 45 公里平均分成 3 段：點在要切的位置。', tip: '3 小時，平均分成 3 段，每段一樣長。', n: 2, pic: k => cut6(3, k, { lab: '45 公里', col: '#a9d0f0' }), cap: k => k === 2 ? '每段 15 公里' : `切了 ${k} 刀`, done: '45÷3＝15，平均每小時 15 公里。' },
      { t: 'say', id: 'map', say: '公里數除以小時數。', pic: () => sym6([[120, '公里', K1], '÷', [2, '小時', K2], '＝', [60, '每 1 小時', K3]]) },
      { t: 'name', say: '用「每 1 小時」來說快慢，有名字。', name: '用每 1 小時走幾公里來表示速率，叫<b>時速</b>。汽車 2 小時走 120 公里，平均時速 60 公里。', pic: () => cut6(2, 1, { noCut: true, lab: '每段 60 公里' }) },
      { t: 'check', o: ['時速 60 公里，是每小時走 60 公里', '時速 60 公里，是走了 60 小時'], a: 0, why: [, '時速說的是每 1 小時走多遠，不是走了多久。'] },
      { t: 'pose', say: '哪一句在說時速？', o: ['公車平均每小時開 40 公里', '公車有 40 個座位'], a: 0, why: [, '座位數和快慢無關。'] },
    ],
    q: { t: '貨車 3 小時開 180 公里，平均時速多少？', o: ['時速 60 公里', '時速 180 公里', '時速 540 公里'], a: 0, why: [, '180 公里是 3 小時一共開的。', '540 是 180×3；要把 180 公里平均分成 3 段。'], ok: '對了！180÷3＝60。', back: 's', hint: '平均分成 3 段，每小時一段。' } },
  fensu: { sem: '六上', who: 'rabbit', word: '分速', hide: ['分速'], fs: 'd',
    steps: [
      { t: 'say', say: '先回想時速：每 1 小時走多遠。速率也可以看每 1 分鐘走多遠。', pic: () => '<div class="it6">🚶</div>' },
      { t: 'act', id: 'd', who: 'demo', say: '走路 3 分鐘走 180 公尺（一路一樣快）。平均分成 3 段，每分鐘一段。', n: 2, pic: k => cut6(3, k, { lab: '180 公尺' }), cap: k => k === 2 ? '每段 60 公尺' : `切了 ${k} 刀`, done: '每分鐘 60 公尺。' },
      { t: 'guess', say: '溜滑板 2 分鐘滑 400 公尺，每分鐘滑多遠？', o: ['200 公尺', '400 公尺', '800 公尺'] },
      { t: 'act', id: 's', say: '把 400 公尺平均分成 2 段：點在要切的位置。', tip: '2 分鐘，平均分成 2 段：一刀切在正中間。', n: 1, pic: k => cut6(2, k, { lab: '400 公尺', col: '#a9d0f0' }), cap: k => k ? '每段 200 公尺' : '', done: '400÷2＝200，每分鐘 200 公尺。' },
      { t: 'say', id: 'map', say: '公尺數除以分鐘數。', pic: () => sym6([[180, '公尺', K1], '÷', [3, '分鐘', K2], '＝', [60, '每 1 分鐘', K3]]) },
      { t: 'name', say: '用「每 1 分鐘」來說快慢，有名字。', name: '用每 1 分鐘走多遠來表示速率，叫<b>分速</b>。走路分速 60 公尺。同一個快慢也可以說成時速 3.6 公里。', pic: () => cut6(3, 2, { noCut: true, lab: '每段 60 公尺' }) },
      { t: 'check', o: ['分速 60 公尺是每分鐘走 60 公尺', '分速 60 公尺是走 60 分鐘'], a: 0, why: [, '分速說的是每 1 分鐘走多遠，不是走了多久。'] },
      { t: 'pose', say: '哪一題可以算分速？', o: ['小狗 2 分鐘跑 300 公尺，平均每分鐘跑多遠？', '小狗 2 歲，重 3 公斤'], a: 0, why: [, '年齡和體重都和快慢無關。'] },
    ],
    q: { t: '跑步 5 分鐘跑 1000 公尺，平均分速多少？', o: ['分速 200 公尺', '分速 5000 公尺', '分速 1005 公尺'], a: 0, why: [, '5000 是 1000×5；要平均分成 5 段。', '1005 是 1000＋5。'], ok: '對了！1000÷5＝200。', back: 's', hint: '平均分成 5 段，每分鐘一段。' } },
  miaosu: { sem: '六上', who: 'rabbit', word: '秒速', hide: ['秒速'], fs: 'd',
    steps: [
      { t: 'say', say: '先回想分速：每 1 分鐘走多遠。速率也可以看每 1 秒走多遠。', pic: () => '<div class="it6">🏃</div>' },
      { t: 'act', id: 'd', who: 'demo', say: '跑步 2 秒跑 10 公尺（一路一樣快），平均分成 2 段，每秒一段。', n: 1, pic: k => cut6(2, k, { lab: '10 公尺' }), cap: k => k ? '每段 5 公尺' : '', done: '每秒 5 公尺。' },
      { t: 'guess', say: '球 3 秒滾 30 公尺（一路一樣快），每秒滾多遠？', o: ['10 公尺', '30 公尺', '90 公尺'] },
      { t: 'act', id: 's', say: '把 30 公尺平均分成 3 段：點在要切的位置。', tip: '3 秒，平均分成 3 段，每段一樣長。', n: 2, pic: k => cut6(3, k, { lab: '30 公尺', col: '#a9d0f0' }), cap: k => k === 2 ? '每段 10 公尺' : `切了 ${k} 刀`, done: '30÷3＝10，每秒 10 公尺。' },
      { t: 'say', id: 'map', say: '公尺數除以秒數。', pic: () => sym6([[10, '公尺', K1], '÷', [2, '秒', K2], '＝', [5, '每 1 秒', K3]]) },
      { t: 'name', say: '用「每 1 秒」來說快慢，有名字。', name: '用每 1 秒走多遠來表示速率，叫<b>秒速</b>。秒速 5 公尺。聲音在空氣中大約是秒速 340 公尺（會隨溫度改變，這裡取約值）。', pic: () => cut6(2, 1, { noCut: true, lab: '每段 5 公尺' }) },
      { t: 'check', o: ['秒速 5 公尺是每秒走 5 公尺', '秒速 5 公尺是走 5 秒'], a: 0, why: [, '秒速說的是每 1 秒走多遠，不是走了多久。'] },
      { t: 'pose', say: '哪一句在說秒速？', o: ['飛機每秒飛大約 250 公尺', '飛機有 250 個座位'], a: 0, why: [, '座位數和快慢無關。'] },
    ],
    q: { t: '聲音 2 秒大約傳 680 公尺，秒速大約多少？', o: ['秒速約 340 公尺', '秒速約 1360 公尺', '秒速約 680 公尺'], a: 0, why: [, '1360 是 680×2；要平均分成 2 段。', '680 公尺是 2 秒一共傳的。'], ok: '對了！680÷2＝340。', back: 's', hint: '平均分成 2 段，每秒一段。' } },
  avgsp: { sem: '六上', who: 'rabbit', word: '平均速率', hide: [], fs: 'h',
    steps: [
      { t: 'say', say: '先回想速率：距離÷時間。如果一趟路中間有快有慢呢？', pic: () => '<div class="it6">🚴</div>' },
      { t: 'guess', say: '小美先騎 1 小時，騎了 12 公里；再騎 2 小時，每小時 6 公里。整趟平均每小時騎幾公里？', o: ['8 公里', '9 公里（12 和 6 的平均）'] },
      { t: 'act', id: 'd', who: 'demo', say: '把整趟的路接起來：點一下，加上一段。', n: 2, pic: k => `<div class="hz6"><div style="flex:12">${barRow(1, k >= 1 ? 1 : 0, '#f4a9a0')}<small>1 小時 12 公里</small></div><div style="flex:12">${barRow(2, k >= 2 ? 2 : 0, '#a9d0f0')}<small>2 小時，6×2＝12 公里</small></div></div>` + addBtn6('加上一段', k < 2), cap: k => ['', '第 1 段：1 小時 12 公里', '第 2 段：每小時 6 公里，2 小時 6×2＝12 公里'][k], done: '整趟 24 公里，一共 3 小時。' },
      { t: 'act', id: 'h', who: 'half', say: '把 24 公里平均分成 3 段，每小時一段。', n: 2, pic: k => cut6(3, k, { lab: '整趟 24 公里，3 小時' }), cap: k => k === 2 ? '每段 8 公里' : `切了 ${k} 刀`, done: '24÷3＝8：平均每小時 8 公里，不是 9 公里。慢的那一段騎得比較久。' },
      { t: 'act', id: 's', say: '小安走路：前 2 分鐘每分鐘 70 公尺，後 3 分鐘每分鐘 50 公尺。選出整趟平均分速的算式。', tip: '先算總路程（70×2 和 50×3），再除以總時間。', n: 1, pic: k => k ? sym6([['140＋150', '總路程（公尺）', K1], '÷', [5, '總時間（分鐘）', K2], '＝', [58, '平均分速', K3]]) : chips6(['（140＋150）÷5', '（70＋50）÷2', '（140＋150）÷2'], (_, i) => i === 0, (_, i) => i === 1 ? '兩段走的時間不一樣長，不能直接把兩個速率平均。' : '要除以總時間 5 分鐘，不是 2 段。'), done: '290÷5＝58，平均分速 58 公尺。' },
      { t: 'say', id: 'map', say: '總路程除以總時間。', pic: () => sym6([[24, '總路程（公里）', K1], '÷', [3, '總時間（小時）', K2], '＝', [8, '平均每小時', K3]]) },
      { t: 'name', say: '整理一下。', name: '整趟的<b>平均速率</b>＝總路程÷總時間。不是把各段的速率加起來再除以段數。', pic: () => sym6([['總路程', '', K1], '÷', ['總時間', '', K2]]) },
      { t: 'check', o: ['平均速率＝總路程÷總時間', '平均速率＝各段速率加起來÷段數'], a: 0, why: [, '兩段時間不一樣長時，各段速率的平均（9）和真正的平均速率（8）不同。'] },
    ],
    q: { t: '貨車先開 2 小時，時速 60 公里；再開 1 小時，時速 90 公里。整趟的平均時速是多少？', o: ['時速 70 公里', '時速 75 公里', '時速 105 公里'], a: 0, why: [, '75 是 60 和 90 的平均，但兩段的時間不一樣長。', '105 是 210÷2；要除以總時間 3 小時。'], ok: '對了！60×2＋90×1＝210 公里，210÷3＝70。', back: 's', hint: '先算總路程，再除以總時間。' } },
  countc: { sem: '六下', who: 'wanwan', word: '乘法原理', hide: ['乘法原理'], fs: 's',
    steps: [
      { t: 'say', say: '穿搭：一次穿一件上衣，配一件裙子。', pic: () => '<div class="it6">👕 ＋ 👗</div>' },
      { t: 'guess', say: '2 件上衣、3 件裙子，每件上衣都可以配每件裙子。一共有幾種穿法？', o: ['5 種（2＋3）', '6 種'] },
      { t: 'act', id: 'd', who: 'demo', say: '點上衣 1，連上每件裙子。', n: 1, pic: k => `<div class="tree6">${[0, 1].map(i => `<div class="tr6"><span class="op6 ${i === k ? 'hot6' : ''}">👕${i + 1}</span><span class="tr-l">${i < k ? '👗👗👗' : ''}</span></div>`).join('')}</div>`, done: '上衣 1 可以配 3 件裙子：3 種。' },
      { t: 'act', id: 's', say: '換你點上衣 2。', tip: '上衣 2 也能配每一件裙子。', n: 1, pic: k => `<div class="tree6">${[0, 1].map(i => `<div class="tr6"><span class="op6 ${i === k + 1 ? 'hot6' : i < k + 1 ? 'on' : ''}">👕${i + 1}</span><span class="tr-l">${i < k + 1 ? '👗👗👗' : ''}</span></div>`).join('')}</div>`, done: '上衣 2 也有 3 種。一共 3×2＝6 種，不是 2＋3＝5 種。' },
      { t: 'act', id: 's3', say: '3 件上衣、2 件褲子：點每件上衣。', tip: '每件上衣都要連上 2 件褲子。', n: 3, pic: k => `<div class="tree6">${[0, 1, 2].map(i => `<div class="tr6"><span class="op6 ${i === k ? 'hot6' : i < k ? 'on' : ''}">👕${i + 1}</span><span class="tr-l">${i < k ? '👖👖' : ''}</span></div>`).join('')}</div>`, cap: k => `${k * 2} 種`, done: '每件上衣配 2 件褲子，3 件上衣：2×3＝6 種。' },
      { t: 'say', id: 'map', say: '每件上衣配幾種，乘上衣的件數。', pic: () => sym6([[3, '每件上衣配幾件裙子', K2], '×', [2, '上衣件數', K1], '＝', [6, '穿法', K3]]) },
      { t: 'name', say: '這種數法有名字。', name: '先選一樣、再選另一樣，而且第一步的每一種，都能配同樣多種第二步，總數就是兩步的種數相乘。這個數法叫<b>乘法原理</b>。', pic: () => '<div class="it6">👕👕 × 👗👗👗</div>' },
      { t: 'check', o: ['每件上衣都能配每件裙子時，種數用乘的', '只要選兩樣，一定用乘的'], a: 0, why: [, '「吃飯或吃麵，只選一種」是二選一，要用加的；有限制（例如紅上衣不能配紅裙子）時也要另外扣掉。'] },
      { t: 'pose', say: '哪一題用乘法原理？', o: ['3 種飯、2 種湯，每份套餐 1 種飯配 1 種湯，有幾種套餐？', '3 種飯和 2 種湯，總共有幾種食物？'], a: 0, why: [, '這題只是數有幾樣食物，用加的。'] },
    ],
    q: { t: '去程有 3 條路、回程有 2 條路，每條去程都能配每條回程。來回有幾種走法？', o: ['6 種', '5 種', '3 種'], a: 0, why: [, '5 是 3＋2；每條去程都要配 2 條回程。', '3 種只算了去程。'], ok: '對了！每條去程配 2 條回程，3 條去程：2×3＝6 種。', back: 's3', hint: '每條去程都配 2 條回程。' } },
  rel: { sem: '六上', who: 'raccoon', word: '關係式', hide: ['關係式'], fs: 's',
    steps: [
      { t: 'say', say: '一天有 24 小時，可以分成白天和晚上。', pic: () => '<div class="it6">🌞 ＋ 🌙 ＝ 24 小時</div>' },
      { t: 'act', id: 'd', who: 'demo', say: '夏天白天變長：點太陽，白天多 1 小時。', n: 2, pic: k => `<div class="hz6"><div style="flex:${10 + k}">${barRow(1, 1, '#ffd65a')}</div><div style="flex:${14 - k}">${barRow(1, 1, '#33405a')}</div></div>` + addBtn6('🌞＋1', true) + tbl6([['白天（小時）', 10 + k], ['晚上（小時）', 14 - k]]), done: '白天 12 小時、晚上 12 小時。' },
      { t: 'act', id: 's', say: '再點兩次，看看晚上怎麼變。', tip: '點「🌞＋1」，看表格裡的晚上變成幾小時。', n: 2, pic: k => `<div class="hz6"><div style="flex:${12 + k}">${barRow(1, 1, '#ffd65a')}</div><div style="flex:${12 - k}">${barRow(1, 1, '#33405a')}</div></div>` + addBtn6('🌞＋1', true) + tbl6([['白天（小時）', 12 + k], ['晚上（小時）', 12 - k]]), done: '白天變長，晚上就變短，合起來一直是 24 小時。' },
      { t: 'guess', say: '白天 15 小時，晚上幾小時？', o: ['9', '15', '24'] },
      { t: 'say', id: 'map', say: '白天和晚上會變，合起來的 24 不變。', pic: () => sym6([['白天', '白天的時數', K1], '＋', ['晚上', '晚上的時數', K2], '＝', [24, '小時', K3]]) },
      { t: 'name', say: '這種式子有名字。', name: '用文字、數字或符號，把數量之間的關係寫出來，像「白天的時數＋晚上的時數＝24」，叫<b>關係式</b>。', pic: () => sym6([['白天', '', K1], '＋', ['晚上', '', K2], '＝', [24, '', K3]]) },
      { t: 'check', o: ['關係式是把數量之間的關係寫出來', '關係式只能寫數字'], a: 0, why: [, '關係式可以用文字或符號，像「白天＋晚上＝24」。'] },
      { t: 'build', say: '拼一個關係式：每枝筆 12 元。', heads: ['左邊', '中間', '右邊'], cols: [['12×枝數', '12＋枝數'], ['＝', '＞'], ['總價', '枝數']], a: [0, 0, 0], why: ['每枝 12 元，幾枝就是 12 的幾倍。', '兩邊一樣多，用等號。', '算出來的是總價。'], ok: '12×枝數＝總價。' },
    ],
    q: { t: '這對兄弟，哥哥一直比弟弟大 3 歲。哪一個是他們年齡的關係式？', o: ['哥哥的年齡－弟弟的年齡＝3', '哥哥的年齡＋弟弟的年齡＝3'], a: 0, why: [, '大 3 歲是相差 3 歲，要用減的。'], ok: '對了！不管過幾年，相差的 3 歲不變。', back: 's', hint: '看看什麼一直不變。' } },
  equal: { sem: '六上', who: 'raccoon', word: '等量', hide: ['等量'], fs: 's2',
    steps: [
      { t: 'say', say: '先看一座兩邊一樣長的天平：兩邊一樣重，天平才會平。', pic: () => '<div class="it6">⚖️</div>' },
      { t: 'act', id: 'd', who: 'demo', say: '每盒一樣重、每顆球一樣重。左邊 2 盒＋3 顆球，右邊 9 顆球，天平平衡。兩邊同時拿走 1 顆球。', n: 1, pic: k => pan6(2, 3 - k, 9 - k), done: '兩邊都少 1 顆，還是平的。' },
      { t: 'guess', say: '如果只拿走左邊的 1 顆球，天平會怎樣？', o: ['會傾斜（右邊比較重）', '還是平的'] },
      { t: 'act', id: 's', say: '兩邊再各拿走 1 顆，直到左邊只剩盒子：點左邊的球。', tip: '每點一次，左右兩邊都會各拿走 1 顆。', n: 2, pic: k => pan6(2, 2 - k, 8 - k), done: '2 盒和 6 顆球一樣重。' },
      { t: 'act', id: 's2', say: '把右邊的 6 顆平均分成 2 份，一盒對一份：點盒子。', tip: '左邊 2 盒、右邊 6 顆，兩邊都平均分成 2 份。', n: 2, pic: k => `<div class="bal6"><span class="pan6">${it6('🎁', k < 2 ? 'hot6' : '')}🎁</span><i>＝</i><span class="pan6">${k ? '🔴🔴🔴 ｜ 🔴🔴🔴' : '🔴🔴🔴🔴🔴🔴'}</span></div>`, done: '一盒和 3 顆球一樣重。' },
      { t: 'say', id: 'map', say: '每一步，兩邊都做一樣的事。', pic: () => sym6([['2盒＋3', '左', K1], '＝', [9, '右', K2]]) + sym6([['2盒', '兩邊都拿走 3', K1], '＝', [6, '', K2]]) + sym6([['1盒', '兩邊都分成 2 份', K1], '＝', [3, '', K2]]) },
      { t: 'name', say: '兩邊一樣重的關係有名字。', name: '天平兩邊一樣重，就是<b>等量</b>，可以用等號寫：2盒＋3＝9。兩邊同時加上、拿走同樣多，或同時乘、同時除以同一個不是 0 的數，兩邊還是等量。', pic: () => pan6(1, 0, 3) },
      { t: 'check', o: ['兩邊同時拿走一樣多，還是等量', '只拿走一邊，也還是等量'], a: 0, why: [, '只拿走一邊，那一邊變輕，天平會傾斜。'] },
      { t: 'pose', say: '只改一個地方：兩邊都加 5 顆球，會怎樣？', o: ['還是平的', '會傾斜'], a: 0, why: [, '兩邊加得一樣多，還是一樣重。'] },
    ],
    q: { t: '左邊 1 袋＋4 顆球，右邊 9 顆球，平衡。怎麼做天平還是平的？', o: ['兩邊都拿走 4 顆球', '只拿走左邊 4 顆球'], a: 0, why: [, '只拿一邊，天平會傾斜。'], ok: '對了！兩邊都拿走 4 顆，1 袋和 5 顆球一樣重。', back: 's', hint: '兩邊要做一樣的事。' },
    rev: '只拿走一邊，兩邊就不一樣重，天平會傾斜。', revPic: () => `<div class="bal6"><span class="pan6">🎁🎁 🔴🔴</span><i>≠</i><span class="pan6">🔴🔴🔴🔴🔴🔴🔴🔴🔴</span></div>` },
  cmpq: { sem: '六下', who: 'goat', word: '比較量', hide: ['比較量'], fs: 's',
    steps: [
      { t: 'say', say: '先回想基準量：比較時被看作 1 的量。忘了也可以先看〈基準量〉。', pic: () => barU(4, '#f7c873', '📏 哥哥 4 格（看作 1）') },
      { t: 'act', id: 'd', who: 'demo', say: '「甲艙的箱數是乙艙的幾倍」：乙艙的 3 箱看作 1。點拿來和它比的那一條。', n: 1, pic: k => `<div class="bu6 ${k ? '' : 'hot6'}"><small>甲艙 6 箱${k ? '（拿來比的）' : ''}</small>${barRow(6, 6, '#f7c873')}</div><div class="bu6 no6" style="width:50%" data-w="乙艙被看作 1，是當標準的。"><small>📏 乙艙 3 箱（看作 1）</small>${barRow(3, 3, K2)}</div>`, done: '甲艙是拿來比的。' },
      { t: 'guess', say: '「弟弟的身高是哥哥的幾倍」，拿來和哥哥比的是誰？', o: ['弟弟', '哥哥'] },
      { t: 'act', id: 's', say: '點拿來和哥哥比的那一條。', tip: '哥哥被看作 1；另一個人是拿來比的。', n: 1, pic: k => `<div class="bu6 no6" data-w="哥哥被看作 1，是當標準的。"><small>📏 哥哥 4 格（看作 1）</small>${barRow(4, 4, '#f7c873')}</div><div class="bu6 ${k ? '' : 'hot6'}" style="width:75%"><small>弟弟 3 格${k ? '（拿來比的）' : ''}</small>${barRow(3, 3, K2)}</div>`, done: '弟弟是拿來比的。' },
      { t: 'say', id: 'map', say: '拿來比的放前面，看作 1 的放後面。', pic: () => sym6([['3 格', '弟弟（拿來比的）', K1], '÷', ['4 格', '哥哥（看作 1）', K2], '＝', ['3/4', '倍數', K3]]) },
      { t: 'name', say: '拿來比的那個量有名字。', name: '拿來和基準量相比的量，叫<b>比較量</b>。比較量÷基準量＝倍數。弟弟的 3 格是比較量，3÷4＝3/4。', pic: () => barU(3, K2, '弟弟 3 格（比較量）', 75) },
      { t: 'check', o: ['比較量÷基準量＝倍數', '比較量一定比基準量大'], a: 0, why: [, '弟弟 3 格比哥哥 4 格少，弟弟還是比較量，倍數是 3/4。'] },
      { t: 'pose', say: '哪一題的比較量是「果汁的杯數」？', o: ['果汁的杯數是水的幾倍？', '水的杯數是果汁的幾倍？'], a: 0, why: [, '這題是拿水和果汁比，果汁被看作 1，是基準量。'] },
    ],
    q: { t: '「甲艙的箱數是乙艙的幾分之幾」，比較量是？', o: ['甲艙的箱數', '乙艙的箱數'], a: 0, why: [, '乙艙被看作 1，是基準量。'], ok: '對了！拿甲艙去和乙艙比。', back: 's', hint: '先找被看作 1 的；另一個就是拿來比的。' } },
  findb: { sem: '六下', who: 'goat', word: '求基準量', hide: [], fs: 'd',
    steps: [
      { t: 'say', say: '先回想：比較量÷基準量＝倍數。例如乙艙 3 箱看作 1，甲艙 6 箱是它的 2 倍。', pic: () => sym6([[6, '比較量', K1], '÷', [3, '基準量', K2], '＝', [2, '倍數', K3]]) },
      { t: 'guess', say: '甲艙的箱數是乙艙的 3/4 倍，甲艙有 15 箱。乙艙有幾箱？', o: ['20 箱', '15×3/4 箱', '12 箱'] },
      { t: 'act', id: 'd', who: 'demo', say: '把乙艙看作 1，平均分成 4 段；甲艙是其中 3 段，共 15 箱。點一下，把 15 箱平均放進 3 段。', n: 3, pic: k => segs6(4, 0, K2, '📏 乙艙（看作 1，平均分成 4 段）', 100, '') + segs6(3, k, '#f7c873', '甲艙 15 箱（3 段）', 75, 5) + addBtn6('放一段', k < 3), cap: k => k ? `${k} 段，每段 15÷3＝5 箱` : '', done: '每段 5 箱。乙艙有 4 段：5×4＝20 箱。' },
      { t: 'act', id: 's', say: '補給原來有 20 箱，後來增加了原來的 1/4。增加了幾箱？選一選。', tip: '「增加了原來的 1/4」：要把原來的 20 箱看作 1。', n: 1, pic: k => segs6(4, k ? 4 : 0, K2, '📏 原來 20 箱（看作 1）', 100, 5) + (k ? segs6(5, 5, '#f7c873', '增加後：20＋5＝25 箱', 100, 5) : chips6(['原來 20 箱的 1/4：5 箱', '增加後的 1/4', '1/4 箱'], (_, i) => i === 0, (_, i) => i === 1 ? '「增加了原來的 1/4」，是以原來的量為基準。' : '1/4 是倍數，不是箱數。')), cap: k => k ? '20×1/4＝5 箱，20＋5＝25 箱' : '', done: '增加的部分以原來的 20 箱為基準：20×1/4＝5 箱，變成 25 箱。' },
      { t: 'say', id: 'map', say: '比較量平均分成段，再算基準量。', pic: () => sym6([[15, '甲艙（比較量）', K1], '÷', [3, '占 3 段', K2], '＝', [5, '每段', K3]]) + sym6([[5, '每段', K3], '×', [4, '乙艙 4 段', K2], '＝', [20, '乙艙（基準量）', K4]]) + '<div class="trail">也可以寫成 15÷3/4＝20</div>' },
      { t: 'name', say: '整理一下。', name: '已知比較量和倍數，求基準量：<b>基準量＝比較量÷倍數</b>。15÷3/4＝20。題目說增加或減少「原來的幾分之幾」時，原來的量就是基準量。', pic: () => segs6(4, 4, K2, '乙艙 20 箱', 100, 5) + segs6(3, 3, '#f7c873', '甲艙 15 箱', 75, 5) },
      { t: 'check', o: ['基準量＝比較量÷倍數', '基準量＝比較量×倍數'], a: 0, why: [, '15×3/4＝11.25，比 15 還少；但甲艙只是乙艙的 3/4，乙艙應該比甲艙多。'] },
    ],
    q: { t: '一本書打折後的價錢是原價的 4/5，賣 80 元。原價是多少元？', o: ['100 元', '64 元', '96 元'], a: 0, why: [, '64 是 80×4/5；80 元只是原價的 4/5，原價應該比 80 元多。', '把原價平均分成 5 段，80 元是 4 段，每段 20 元。'], ok: '對了！80÷4/5＝100：每段 20 元，5 段是 100 元。', back: 'd', hint: '把原價看作 1，平均分成 5 段，80 元占幾段？' } },
  zoom: { sem: '六下', who: 'seal', word: '放大圖', hide: ['放大圖'], fs: 's',
    steps: [
      { t: 'say', say: '照片放大時，照片裡的東西，寬和高會一起變大，形狀不變。', pic: () => rectG6(3, 2) },
      { t: 'guess', say: '寬 3 格、高 2 格的旗子，寬變成 6 格。高要幾格，形狀才和原來一樣？', o: ['3 格（多 1 格）', '4 格（也變 2 倍）'] },
      { t: 'act', id: 'd', who: 'demo', say: '先只把寬變 2 倍：點旗子。', n: 1, pic: k => rectG6(k ? 6 : 3, 2, !k), done: '只把寬變 2 倍，寬和高的比例改變了，形狀和原來不同。' },
      { t: 'act', id: 's', say: '再點一下，把高也變 2 倍。', tip: '點旗子，讓高也乘 2。', n: 1, pic: k => rectG6(6, k ? 4 : 2, !k), done: '寬和高都乘 2，形狀和原來一樣。' },
      { t: 'act', id: 's2', say: '寬 2、高 1 的貼紙放大成 3 倍：點兩次（先寬、再高）。', tip: '寬和高都要乘 3。', n: 2, pic: k => rectG6(k >= 1 ? 6 : 2, k >= 2 ? 3 : 1, k < 2), done: '寬 6、高 3。' },
      { t: 'say', id: 'map', say: '寬和高都乘同一個數。', pic: () => sym6([[3, '原來寬', K1], '×', [2, '倍', K3], '＝', [6, '新寬', K1]]) + sym6([[2, '原來高', K2], '×', [2, '倍', K3], '＝', [4, '新高', K2]]) },
      { t: 'name', say: '這樣的圖有名字。', name: '每條邊都乘同一個大於 1 的數，角的大小不變，得到的圖叫原圖的<b>放大圖</b>。', pic: () => rectG6(6, 4) },
      { t: 'check', o: ['放大圖的每條邊都乘同一個數', '放大圖的每條邊都加同一個數'], a: 0, why: [, '寬 3 高 2 都加 2，變成寬 5 高 4，比例變了，形狀不同。'] },
      { t: 'pose', say: '邊長變 2 倍，面積呢？寬 3 高 2 有 6 格；放大 2 倍後寬 6 高 4。面積變成幾倍？', pic: () => rectG6(3, 2) + rectG6(6, 4), o: ['4 倍（24 格）', '2 倍（12 格）'], a: 0, why: [, '寬乘 2、高也乘 2，格子數是 2×2＝4 倍。'], tag: '想一想' },
    ],
    q: { t: '照片寬 4、高 3，做成 2 倍的放大圖，寬和高各是多少？', o: ['寬 8、高 6', '寬 8、高 3', '寬 6、高 5'], a: 0, why: [, '只放大了寬，高沒有乘 2。', '寬和高都加 2，不是乘 2。'], ok: '對了！4×2＝8，3×2＝6。', back: 's', hint: '寬和高都要乘 2。' } },
  shrink: { sem: '六下', who: 'seal', word: '縮圖', hide: ['縮圖'], fs: 'd',
    steps: [
      { t: 'say', say: '先回想放大圖：每條邊都乘同一個大於 1 的數。現在要把海報縮小，做成書籤。', pic: () => rectG6(6, 4) },
      { t: 'act', id: 'd', who: 'demo', say: '寬 6 格、高 4 格，每條邊都乘 1/2：點圖。', n: 2, pic: k => rectG6(k >= 1 ? 3 : 6, k >= 2 ? 2 : 4, k < 2), done: '寬 3、高 2，形狀一樣，變小了。' },
      { t: 'guess', say: '如果寬 6、高 4 都「減掉 2」，形狀會和原來一樣嗎？', o: ['不一樣，比例改變了', '一樣'] },
      { t: 'act', id: 's', say: '寬 6、高 3 的海報，每條邊都乘 1/3：點兩次。', tip: '寬和高都要乘 1/3。', n: 2, pic: k => rectG6(k >= 1 ? 2 : 6, k >= 2 ? 1 : 3, k < 2), done: '寬 2、高 1。' },
      { t: 'say', id: 'map', say: '寬和高都乘同一個比 1 小的數。', pic: () => sym6([[6, '原來寬', K1], '×', ['1/2', '倍', K3], '＝', [3, '新寬', K1]]) + sym6([[4, '原來高', K2], '×', ['1/2', '倍', K3], '＝', [2, '新高', K2]]) },
      { t: 'name', say: '變小的圖有名字。', name: '每條邊都乘同一個大於 0、小於 1 的數，角的大小不變，得到的圖叫<b>縮圖</b>。', pic: () => rectG6(3, 2) },
      { t: 'check', o: ['縮圖的每條邊都乘同一個比 1 小的數', '縮圖的每條邊都減掉一樣長'], a: 0, why: [, '寬 6 高 4 都減 2，變成寬 4 高 2，比例變了。'] },
      { t: 'pose', say: '哪一題在做縮圖？', o: ['把寬 12、高 8 的地圖，每條邊都乘 1/4', '把寬 12、高 8 的地圖，剪掉一個角'], a: 0, why: [, '剪掉一角，形狀就變了。'] },
    ],
    q: { t: '星圖寬 12、高 8，做成 1/4 倍的縮圖，寬和高各是多少？', o: ['寬 3、高 2', '寬 3、高 8', '寬 8、高 4'], a: 0, why: [, '只縮了寬，高沒有乘 1/4。', '寬和高都減 4，不是乘 1/4。'], ok: '對了！12×1/4＝3，8×1/4＝2。', back: 's', hint: '寬和高都要乘同樣的分數。' },
    rev: '都減 2 變成寬 4、高 2：寬變成高的 2 倍，原來只有 1.5 倍，形狀不同。', revPic: () => rectG6(6, 4) + rectG6(4, 2) },
  mapscale: { sem: '六下', who: 'seal', word: '比例尺', hide: ['比例尺', '1：'], fs: 'd',
    steps: [
      { t: 'say', say: '地圖上的路畫得很短，實際的路很長。', pic: () => '<div class="it6">🗺️</div>' },
      { t: 'act', id: 'd', who: 'demo', say: '這張地圖上，圖上 1 公分代表實際 1 公里。點尺，一公分一公分量。', n: 3, pic: k => road6(3, k, 1), done: '圖上 3 公分，實際 3 公里。' },
      { t: 'act', id: 's', say: '另一條路，圖上 4 公分，自己量。', tip: '一公分一公分量：每 1 公分代表 1 公里。', n: 4, pic: k => road6(4, k, 1), done: '實際 4 公里。' },
      { t: 'guess', say: '換一張畫得更小的地圖：圖上 1 公分代表實際 2 公里。同一條 4 公里的路，在這張圖上畫多長？', o: ['2 公分', '8 公分'] },
      { t: 'act', id: 's2', say: '在小地圖上量。', tip: '每 1 公分代表 2 公里。', n: 2, pic: k => road6(2, k, 2), done: '2 公分。畫得越小，同一條路在圖上越短。' },
      { t: 'say', id: 'map', say: '先把兩個長度換成相同單位（公分），再寫成比。', pic: () => sym6([[1, '圖上 1 公分', K1], '：', [100000, '實際 1 公里＝100000 公分', K2]]) },
      { t: 'name', say: '圖上和實際長度的關係有名字。', name: '圖上長度和實際長度換成相同單位後的比，叫<b>比例尺</b>。圖上 1 公分代表實際 1 公里，比例尺是 1：100000。', pic: () => road6(3, 3, 1) },
      { t: 'check', o: ['比例尺是圖上長度和實際長度（相同單位）的比', '比例尺是那把尺有多長'], a: 0, why: [, '比例尺說的是圖上和實際的長度關係，不是尺本身的長度。'] },
      { t: 'pose', say: '目前的資料足夠嗎？「地圖上量到 3 公分，實際有多遠？」還需要知道什麼？', o: ['需要比例尺：圖上 1 公分代表實際多遠', '什麼都不需要'], a: 0, why: [, '不同的地圖，1 公分代表的距離不一樣。'], tag: '資料夠嗎' },
    ],
    q: { t: '比例尺 1：50000，圖上 1 公分代表實際幾公尺？', o: ['500 公尺', '50000 公尺', '50 公尺'], a: 0, why: [, '50000 的單位是公分，不是公尺。', '50000 公分＝500 公尺，不是 50 公尺。'], ok: '對了！50000 公分＝500 公尺。', back: 's', hint: '圖上 1 公分代表實際 50000 公分；100 公分是 1 公尺。' } },
  prismw: { sem: '六下', who: 'turtle', word: '柱體', hide: ['柱體'], fs: 's',
    steps: [
      { t: 'say', say: '疊積木：一層一層往上疊。', pic: () => isoSvg(2, 2, 1) },
      { t: 'act', id: 'd', who: 'demo', say: '每層都一樣大：點積木往上疊。', n: 2, pic: k => `<span class="hot6">${isoSvg(2, 2, 3, 4 * (k + 1))}</span>`, done: '每一層的形狀、大小都一樣。' },
      { t: 'act', id: 's', say: '圓的也一樣：點圓盤疊上去。', tip: '點圓盤，一層一層疊。', n: 3, pic: k => `<span class="hot6">${cylSvg(k, 3)}</span>`, done: '圓盤一層層一樣大。' },
      { t: 'guess', say: '冰淇淋甜筒（尖的那頭朝下），從下往上，每一層一樣大嗎？', o: ['不一樣，越上面越大', '一樣大'] },
      { t: 'say', id: 'map', say: '分成兩類。', pic: () => twoBox6(['每層一樣大', '<div class="it6">🥫📦🧀</div>'], ['每層不一樣', '<div class="it6">🍦🔺⚽</div>']) },
      { t: 'name', say: '左邊那一類立體有名字。', name: '上下兩個底面的形狀、大小都一樣，而且從底面往上，每一層都和底面一樣的立體，叫<b>柱體</b>。這裡看的是直直往上疊的柱體。', pic: () => cylSvg(3, 3) },
      { t: 'check', o: ['柱體每一層的形狀、大小都和底面一樣', '柱體一定是圓的'], a: 0, why: [, '方形的盒子也是一層一層同樣大，也是柱體。'] },
      { t: 'pose', say: '哪一樣的外形可以看成柱體？', o: ['罐頭', '甜筒', '球'], a: 0, why: [, '甜筒越往上越大。', '球每一層的大小都不一樣。'] },
    ],
    q: { t: '哪一個的外形可以看成柱體？', o: ['方形蛋糕', '金字塔', '球'], a: 0, why: [, '金字塔越往上越小。', '球每一層的大小都不一樣。'], ok: '對了！方形蛋糕每一層都一樣大。', back: 's', hint: '看每一層是不是和底面一樣大。' } },
  vol: { sem: '六下', who: 'turtle', word: '柱體體積', hide: ['體積'], fs: 'd',
    steps: [
      { t: 'say', say: '先回想柱體：每一層都和底面一樣大。長方體可以數有幾塊邊長 1 公分的小方塊。', pic: () => isoSvg(3, 2, 1) },
      { t: 'act', id: 'd', who: 'demo', say: '一層 6 塊（3×2），每層厚 1 公分。點一下疊一層。', n: 3, pic: k => `<span class="hot6">${isoSvg(3, 2, 3, 6 * k)}</span>`, cap: k => `${k} 層，6×${k}＝${6 * k} 塊`, done: '3 層：6×3＝18 塊，就是 18 立方公分。' },
      { t: 'guess', say: '一層 5 塊、每層厚 1 公分，疊 6 層，一共幾塊？', o: ['30 塊', '11 塊'] },
      { t: 'act', id: 's', say: '一層 4 塊（2×2），每層厚 1 公分，已經放好 1 層，再疊到 5 層：點一下疊一層。', tip: '一層 4 塊，疊幾層就是 4 的幾倍。', n: 4, pic: k => `<span class="hot6">${isoSvg(2, 2, 5, 4 * (k + 1))}</span>`, cap: k => `${k + 1} 層，4×${k + 1}＝${4 * (k + 1)} 塊`, done: '4×5＝20 塊，就是 20 立方公分。' },
      { t: 'say', id: 'map', say: '一層的塊數乘層數；每層厚 1 公分時，層數就是高。', pic: () => sym6([[6, '一層：底面積 6 平方公分', K2], '×', [3, '高 3 公分', K3], '＝', [18, '18 立方公分', K1]]) },
      { t: 'name', say: '柱體占空間的大小有名字。', name: '柱體占空間的大小，叫柱體的<b>體積</b>。柱體體積＝底面積×高。', pic: () => isoSvg(3, 2, 3) },
      { t: 'check', o: ['柱體體積＝底面積×高', '柱體體積＝長＋寬＋高'], a: 0, why: [, '長＋寬＋高是把三個長度加起來，不是數有幾塊小方塊。'] },
      { t: 'pose', say: '哪一題要算柱體的體積？', o: ['一塊三角柱形的積木，占多大的空間？', '三角柱積木的表面要塗多少油漆？'], a: 0, why: [, '表面要塗多少，算的是表面積。'] },
    ],
    q: { t: '三角柱的底面積 6 平方公分，高 5 公分，體積是多少？', o: ['30 立方公分', '11 立方公分', '6 立方公分'], a: 0, why: [, '11 是 6＋5。', '6 平方公分只是底面積。'], ok: '對了！6×5＝30 立方公分。', back: 's', hint: '底面積×高。' } },
  surf: { sem: '六下', who: 'turtle', word: '表面積', hide: ['表面積'], fs: 'd',
    steps: [
      { t: 'say', say: '包禮物：盒子的每一面都要包到。', pic: () => '<div class="it6">🎁</div>' },
      { t: 'act', id: 'd', who: 'demo', say: '點盒子的每一面，把它攤開。', n: 6, pic: k => `<div class="faces6">${['上', '下', '前', '後', '左', '右'].map((f, i) => `<span class="face6 ${i < k ? 'on' : i === k ? 'hot6' : ''}">${f}</span>`).join('')}</div>`, cap: k => `攤開 ${k} 面`, done: '長方體盒子有 6 面。' },
      { t: 'guess', say: '一個圓柱形的罐頭，外面要包滿紙，要包哪幾塊？', o: ['側面一塊和上下兩個圓', '只要側面一塊'] },
      { t: 'act', id: 's', say: '罐頭：點側面、上蓋、下蓋。', tip: '外面看得到的每一塊都要點到。', n: 3, pic: k => `<div class="faces6">${['側面（攤開是長方形：長＝底面的圓周長，寬＝罐頭的高）', '上蓋（圓）', '下蓋（圓）'].map((f, i) => `<span class="face6 ${i < k ? 'on' : i === k ? 'hot6' : ''}">${f}</span>`).join('')}</div>`, done: '側面攤開是長方形，再加兩個圓。' },
      { t: 'say', id: 'map', say: '每一面的面積加起來。', pic: () => sym6([['上下', '2 面', K1], '＋', ['前後', '2 面', K2], '＋', ['左右', '2 面', K3]]) },
      { t: 'name', say: '合起來的大小有名字。', name: '立體外表各個面的面積合起來，叫<b>表面積</b>。', pic: () => '<div class="it6">🎁</div>' },
      { t: 'check', o: ['表面積是外表各個面的面積加起來', '表面積是裡面可以裝多少'], a: 0, why: [, '裡面可以裝多少，是容積。'] },
      { t: 'pose', say: '哪一題要算表面積？', o: ['禮物盒外面全部包住，要用多少包裝紙（不算重疊）？', '禮物盒可以裝多少糖？'], a: 0, why: [, '裝多少是容積，不是表面積。'] },
    ],
    q: { t: '正方體每一面的面積是 4 平方公分，表面積是多少？', o: ['24 平方公分', '4 平方公分', '16 平方公分'], a: 0, why: [, '4 平方公分只是一面。', '16 是 4 面；正方體有 6 面。'], ok: '對了！每面 4 平方公分，6 面：4×6＝24 平方公分。', back: 's', hint: '每一面都要算到。' } },
  pie: { sem: '六下', who: 'mimi', word: '圓形圖', hide: ['圓形圖'], fs: 'd',
    steps: [
      { t: 'say', say: '一個圓可以平均分成好幾片，像披薩。', pic: () => pie6(10, 10, 0) },
      { t: 'act', id: 'd', who: 'half', say: '10 個人投票，每人只投一票，從月球、火星、土星選一個最想去的地方。點一片，塗上一票。', n: 10, pic: k => slice10(VOTES, k, true) + `<div class="trail">${k < 10 ? `第 ${k + 1} 票：${VOTES[k]}` : ''}</div>`, done: '月球 5 片、火星 3 片、土星 2 片，10 票剛好塗滿整個圓。' },
      { t: 'guess', say: '月球占全部的幾分之幾？', o: ['5/10，一半', '5'] },
      { t: 'act', id: 's', say: '點月球的每一片，數一數。', tip: '藍色的片是月球；每點一片數一次。', n: 5, pic: k => `<div class="op6s">${Array.from({ length: 5 }, (_, i) => `<span class="op6 ${i < k ? 'on' : i === k ? 'hot6' : ''}">🌕</span>`).join('')}</div>` + slice10(VOTES, 10), done: '5 片，是 10 片的一半。' },
      { t: 'say', id: 'map', say: '片數除以全部的片數；全部加起來是 100%。', pic: () => sym6([[5, '月球片數', K2], '/', [10, '全部片數', K1], '＝', ['50%', '占全部', K3]]) + '<div class="trail">月球 50%＋火星 30%＋土星 20%＝100%</div>' },
      { t: 'name', say: '這種圖有名字。', name: '用整個圓表示全部，每個扇形表示各部分占全部多少，這種圖叫<b>圓形圖</b>。', pic: () => slice10(VOTES, 10) },
      { t: 'check', o: ['圓形圖看每部分占全部多少', '圓形圖看東西怎麼隨時間變'], a: 0, why: [, '隨時間的變化適合用折線圖。'] },
      { t: 'pose', say: '哪一題適合畫圓形圖？', o: ['全班每人選一種最喜歡的水果，各占全班多少？', '一天的氣溫怎麼變？'], a: 0, why: [, '跟著時間變化，適合用折線圖。'] },
    ],
    q: { t: '20 人投票，每人一票。圓形圖上「麵」占一半，有幾人選麵？', o: ['10 人', '20 人', '5 人'], a: 0, why: [, '20 人是全部。', '5 人是 20 人的 1/4。'], ok: '對了！20 的一半是 10。', back: 's', hint: '一半就是全部的 1/2。' } },
  likely: { sem: '六下・延伸', who: 'mimi', word: '可能性', hide: ['可能性'], fs: 's',
    steps: [
      { t: 'say', say: '袋中有 9 顆紅球和 1 顆藍球，球的大小和材質相同。每次先搖勻，不看袋內摸 1 顆，記錄後放回。', pic: () => dotsC(9, K4) + dotsC(1, K2) },
      { t: 'guess', say: '下一次摸，哪種顏色比較容易摸到？', o: ['紅球', '藍球', '一樣'] },
      { t: 'act', id: 'd', who: 'half', say: '摸一顆、記下來、放回、搖勻：點袋子。', n: 6, pic: k => addBtn6('👜 摸一顆', true) + drw6(DRAWS.slice(0, k)), done: '6 次裡，紅的 5 次。' },
      { t: 'act', id: 's', say: '再摸 4 次。', tip: '點「摸一顆」，每次都放回、搖勻。', n: 4, pic: k => addBtn6('👜 摸一顆', true) + drw6(DRAWS.slice(0, 6 + k)), done: '這一次的 10 次紀錄：紅 9 次、藍 1 次。' },
      { t: 'say', say: '這只是一次示例紀錄，每次結果可能不同。另一組同學也摸了 10 次：紅 7 次、藍 3 次。兩組都是紅的比較多，但次數不一樣。', pic: () => drw6(DRAWS, '第一組：紅 9 次、藍 1 次') + drw6(DRAWS2, '第二組：紅 7 次、藍 3 次') },
      { t: 'say', id: 'map', say: '袋子裡紅球多很多，所以紅球比較容易摸到；藍球只有 1 顆，仍然可能被摸到。', pic: () => sym6([[9, '紅球顆數', K4], '對', [1, '藍球顆數', K2]]) },
      { t: 'name', say: '這種說法有名字。', name: '一件事發生的機會有多大，叫這件事的<b>可能性</b>。紅球比較容易摸到，表示摸到紅球的可能性比較大，但不是一定會摸到。', pic: () => dotsC(9, K4) + dotsC(1, K2) },
      { t: 'check', o: ['紅球的可能性比較大，但下一次也可能摸到藍球', '摸 10 次，一定剛好 9 紅 1 藍'], a: 0, why: [, '兩組紀錄就不一樣：一組 9 紅 1 藍、一組 7 紅 3 藍。可能性大，不是保證。'] },
      { t: 'pose', say: '目前的資料足夠嗎？「袋子裡有紅球和藍球，摸到紅球的可能性大嗎？」還需要知道什麼？', o: ['各有幾顆，而且球的大小、材質一樣', '什麼都不需要'], a: 0, why: [, '不知道各有幾顆，就沒辦法比。'], tag: '資料夠嗎' },
    ],
    q: { t: '盒子裡有 8 張星星卡、2 張月亮卡，卡片的大小和材質相同。洗勻後不看，抽 1 張。哪一句話對？', o: ['星星卡比較可能被抽到，月亮卡也可能被抽到', '一定會抽到星星卡', '月亮卡不可能被抽到'], a: 0, why: [, '月亮卡有 2 張，還是可能被抽到，所以不是「一定」。', '月亮卡有 2 張，有可能被抽到。'], ok: '對了！星星卡比較多，比較可能；但月亮卡也可能。', back: 's', hint: '比一比各有幾張；比較可能，不等於一定。' } },
});
// 每一種題型連到哪些小故事；自動只播 CONCEPT_MAIN（沒寫就是最後一個），其他放在故事裡選讀
const CONCEPT_OF = {
  'prime:tile': ['prime', 'comp'], 'prime:tree': ['prime', 'pfac', 'pfd'], 'prime:by25': [], 'prime:by3': [], 'prime:gcf': ['short'], 'prime:lcm': ['short', 'lcmS'], 'prime:simp': ['coprime', 'simplest'], 'prime:coprime': ['coprime'],
  'fdiv:whole': ['fdivm'], 'fdiv:intfrac': ['fdivm'], 'fdiv:same': ['fdivm'], 'fdiv:unlike': ['fdivm'], 'fdiv:partial': ['fdivm'], 'fdiv:flip': ['fdivm', 'reciprocal'], 'fdiv:bigger': ['fdivm'],
  'ddiv:cut': ['decdiv'], 'ddiv:shift': ['decdiv', 'dshift'], 'ddiv:two': ['decdiv'], 'ddiv:long': ['decdiv', 'dshift'], 'ddiv:bigger': ['decdiv'],
  'circle:pi': ['pi'], 'circle:circ': ['pi', 'circ'], 'circle:wheel': ['pi', 'circ'], 'circle:half': ['circ', 'halfc'], 'circle:area': ['carea'], 'circle:ring': ['carea', 'ringA'],
  'ratio:mix': ['ratio'], 'ratio:rate': ['ratio', 'rate'], 'ratio:equal': ['ratio', 'eqr'], 'ratio:vert': ['ratio', 'eqr'], 'ratio:simp': ['ratio', 'simpr'], 'ratio:fd': ['ratio', 'simpr'], 'ratio:share': ['ratio', 'share'], 'ratio:same': ['ratio', 'eqr'],
  'sector:frac': ['arc'], 'sector:arc': ['arc'], 'sector:perim': ['arc', 'sperim'], 'sector:three': ['arc', 'sarea'], 'sector:area': ['sarea'], 'sector:word': ['sarea'],
  'speed:sameT': ['speed'], 'speed:sameD': ['speed'], 'speed:rate': ['speed', 'shisu'], 'speed:dist': ['speed', 'shisu', 'fensu'], 'speed:prop': ['speed', 'shisu', 'fensu'], 'speed:unit': ['speed', 'shisu', 'fensu', 'miaosu'], 'speed:avg': ['speed', 'avgsp'],
  'relation:sum': ['rel'], 'relation:diff': ['rel'], 'relation:each': ['rel'], 'relation:seat': ['rel'], 'relation:write': ['rel'], 'relation:balance': ['equal'],
  'prism:stack': ['prismw', 'vol'], 'prism:tri': ['prismw', 'vol'], 'prism:cyl': ['prismw', 'vol'], 'prism:comp': ['prismw', 'vol'], 'prism:net': ['surf'], 'prism:surf': ['surf'],
  'base:read': ['base', 'cmpq'], 'base:swap': ['base', 'cmpq'], 'base:cmp': ['base', 'cmpq'], 'base:findbase': ['base', 'cmpq', 'findb'], 'base:change': ['base', 'cmpq', 'findb'],
  'scale:zoom': ['zoom'], 'scale:keep': ['zoom'], 'scale:which': ['zoom'], 'scale:shrink': ['zoom', 'shrink'], 'scale:ruler': ['mapscale'], 'scale:mapn': ['mapscale'], 'scale:mis': ['mapscale'], 'scale:twomap': ['mapscale'],
  'puzzle:hen': [], 'puzzle:sumdiff': [], 'puzzle:age': [], 'puzzle:chase': [], 'puzzle:stream': [], 'puzzle:count': ['countc'], 'puzzle:odd': ['countc'], 'puzzle:addc': ['countc'],
  'mix:order': [], 'mix:fdeq': [], 'mix:cancel': ['reciprocal'], 'mix:word': [], 'mix:est': [], 'mix:dist': [],
  'pie:read': ['pie'], 'pie:make': ['pie'], 'pie:pct': ['pie'], 'pie:which': ['pie'], 'pie:likely': ['likely'],
};
const CONCEPT_MAIN = { 'prime:tile': 'prime', 'prime:simp': 'simplest', 'speed:rate': 'speed', 'speed:dist': 'speed', 'speed:prop': 'speed', 'speed:unit': 'fensu', 'base:read': 'base', 'base:swap': 'base', 'scale:shrink': 'shrink' };
/* ---------- 各段的揭曉、簡圖、正反例分類（依五年級樣本模板；簡圖和第 1 步操作、第 3 步算式用同一個例子） ---------- */
const GRY = '#c9ced8';
const S6 = (q, bins, items, hint, done) => ({ q, bins, items, hint, done });
const AUG = {
  prime: { rev: '7 塊試每排 2、3、4、5、6 塊都有缺塊，只排得成 1 排。', dia: () => twoBox6(['6 塊', rectG6(2, 3, false, GRY)], ['7 塊', rectG6(7, 1, false, GRY)]), sort: S6('這些地磚，排得成「至少兩排、每排至少兩塊」的長方形嗎？', ['排得成', '排不成'], [['4 塊', 0], ['5 塊', 1], ['6 塊', 0], ['7 塊', 1], ['9 塊', 0], ['11 塊', 1]], '試試每排 2 塊、3 塊⋯，看最後一排有沒有缺塊。', '4、6、9 排得成；5、7、11 排不成。') },
  comp: { rev: '9 塊排得成 3 排、每排 3 塊。9 是奇數，也排得成。', dia: () => rectG6(3, 3, false, GRY), sort: S6('分一分：排得成「至少兩排、每排至少兩塊」的長方形嗎？', ['排得成', '排不成'], [['8 塊', 0], ['9 塊', 0], ['13 塊', 1], ['10 塊', 0], ['2 塊', 1], ['15 塊', 0]], '試試每排 2、3、5 塊，看有沒有缺塊。', '8、9、10、15 排得成；2、13 排不成。') },
  pfac: { rev: '15＝3×5，3 和 5 都是質數。', dia: () => '<div class="parts6"><b class="chip6 num">2</b>×<b class="chip6 num">2</b>×<b class="chip6 num">5</b></div><div class="trail">20 拆到最後</div>', sort: S6('哪些數已經是質數、不能再拆？', ['是質數，不能再拆', '還能拆成兩個數相乘'], [['2', 0], ['3', 0], ['6', 1], ['5', 0], ['9', 1], ['10', 1]], '試試能不能寫成兩個比 1 大的數相乘。', '2、3、5 不能再拆；6、9、10 還能拆。') },
  pfd: { rev: '5×6 還沒寫完：6＝2×3，所以 30＝2×3×5。', dia: () => '<div class="parts6"><b class="chip6 num">2</b>×<b class="chip6 num">3</b>×<b class="chip6 num">5</b></div><div class="trail">30 拆到最後</div>', sort: S6('哪些已經寫成質數相乘？', ['每個乘數都是質數', '還有不是質數的'], [['12＝2×2×3', 0], ['12＝3×4', 1], ['8＝2×2×2', 0], ['8＝2×4', 1]], '每個乘數都要是質數才算。', '對了！4 還能拆成 2×2。') },
  short: { rev: '2×2＝4：8 和 12 最多分成 4 份，每份 2 紅、3 藍。', dia: () => ladderHtml([[2, 8, 12], [2, 4, 6]], 2, 3), sort: S6('8 和 12：哪個質數可以當第一個除數？', ['能同時整除 8 和 12', '不能'], [['2', 0], ['3', 1], ['5', 1]], '8 和 12 都要能被它整除。', '只有 2 能同時整除 8 和 12。') },
  lcmS: { rev: '要全部乘：2×2×2×3＝24。只乘左邊得到的 4 是最大公因數。', dia: () => ladderHtml([[2, 8, 12], [2, 4, 6]], 2, 3) },
  coprime: { rev: '8 和 9 只有 1 能同時整除，分不成別的人數。', dia: () => dotsC(5, '#999') + '<br>' + dotsC(6, '#bbb'), sort: S6('分一分：', ['公因數只有 1', '還有別的公因數'], [['3 和 4', 0], ['4 和 6', 1], ['5 和 6', 0], ['6 和 9', 1], ['8 和 9', 0]], '試試 2 或 3 能不能同時整除這兩個數。', '3 和 4、5 和 6、8 和 9 的公因數只有 1。') },
  simplest: { rev: '2 和 3 只有 1 能同時整除，不能再一起圈了。', dia: () => grp6(9, 3, 3, { noHot: true, cell: i => i < 6 ? '#999' : '#ddd' }), sort: S6('分一分：', ['還能一起圈', '分子分母互質了'], [['4/6', 0], ['2/3', 1], ['6/9', 0], ['3/4', 1], ['7/4', 1]], '分子分母能不能一起每 2 個或 3 個圈？', '4/6、6/9 還能圈；2/3、3/4、7/4 圈不下去了。') },
  fdivm: { dia: () => barRow(4, 4, groupCol(1)) + barRow(4, 4, groupCol(1)), sort: S6('哪些題目在問「裡面有幾個那麼多」？', ['問裡面有幾個', '不是'], [['2 個披薩，每人 1/4 個，可以分給幾人？', 0], ['2 個披薩吃掉 1/4 個，剩多少？', 1], ['3 公尺，每段 1/2 公尺，剪幾段？', 0], ['3 公尺的一半是多少？', 1]], '看是不是在問「全部裡面有幾份這麼多」。', '對了！') },
  reciprocal: { rev: '1 公尺是 3/4 公尺的 4/3 倍：1 份整的，再加 1/3 份。', dia: () => barRow(3, 3, groupCol(2)), sort: S6('哪些兩個數相乘等於 1？', ['相乘等於 1', '相乘不等於 1'], [['2/3 和 3/2', 0], ['3/4 和 4/3', 0], ['2/3 和 1/3', 1], ['3/5 和 5/3', 0], ['3/5 和 3/10', 1]], '把兩個數相乘看看是不是 1：分子分母互換位置才會。', '對了！') },
  decdiv: { rev: '3 公尺剪成 6 段，比 3 多。', dia: () => barRow(6, 6, groupCol(1)), sort: S6('商會比被除數大，還是小？', ['比被除數大', '比被除數小'], [['3÷0.5', 0], ['3÷1.5', 1], ['2÷0.4', 0], ['6÷3', 1]], '除數比 1 小，商比被除數大；除數比 1 大，商比被除數小。', '對了！') },
  dshift: { rev: '一樣：都用 0.1 公尺當一小格來數，12 小格裡有 3 個 4 小格。', dia: () => grp6(12, 4, 3, { noHot: true, cell: '#ddd' }) },
  pi: { rev: '小圓、大圓，一圈都是直徑的 3 倍多一點。', dia: () => rollSvg(20, 1, 1, 3), sort: S6('這些東西的邊，一圈的長÷直徑都是 3 倍多一點嗎？', ['是圓，3 倍多一點', '不是圓'], [['小杯子的杯口', 0], ['大碗的碗口', 0], ['呼拉圈', 0], ['正方形手帕', 1]], '只要是圓都一樣。', '圓都一樣；手帕是正方形，不是圓。') },
  circ: { dia: () => rollSvg(10, 1, 1, 3), sort: S6('哪些是在問一圈的長？', ['一圈的長', '不是'], [['輪子滾一圈（不打滑）走的路', 0], ['盤子邊的花邊', 0], ['盤子的直徑', 1], ['桌布要蓋住多大的桌面', 1]], '繞著邊走一圈的長。', '對了！') },
  halfc: { rev: '彎邊 15.7 公分，還要加上直的直徑 10 公分：25.7 公分。', revPic: () => halfSvg(2), dia: () => halfSvg(2) },
  carea: { rev: '長是半個圓周（3×3.14），寬是半徑 3。', dia: () => rectG6(6, 3, false, GRY), sort: S6('要算內部的大小，還是一圈的長？', ['內部的大小', '一圈的長'], [['剛好蓋住圓桌桌面的圓形貼紙', 0], ['圓桌邊的花邊', 1], ['圓形草地要種多少草', 0], ['圓形跑道跑一圈', 1]], '蓋住、鋪滿，算的是內部的大小。', '對了！') },
  ringA: { rev: '大圓面積減小圓面積：28.26－3.14＝25.12。', dia: () => ringSvg(2) },
  ratio: { rev: '2 匙要 4 杯：一整組一整組加，不是只多加 1 杯。', dia: () => `<div class="rows6">${[1, 2].map(() => `<div class="r6">${hw6(1, 2)}</div>`).join('')}</div>`, sort: S6('和「1 匙蜂蜜配 2 杯水」一樣甜嗎？（同一支匙、同一個杯子）', ['一樣甜', '不一樣'], [['蜂蜜 2 匙、水 4 杯', 0], ['蜂蜜 2 匙、水 3 杯', 1], ['蜂蜜 3 匙、水 6 杯', 0], ['蜂蜜 3 匙、水 4 杯', 1]], '要一整組一起加：每 1 匙蜂蜜都配 2 杯水。', '對了！') },
  rate: { rev: '蜂蜜 2 杯是水 3 杯的 2/3 倍。', dia: () => barU(3, GRY, '水') + barU(2, '#999', '蜂蜜', 66.7), sort: S6('哪些算式在算「蜂蜜是水的幾倍」？', ['蜂蜜÷水', '不是'], [['蜂蜜 1、水 2：1÷2', 0], ['蜂蜜 3、水 4：3÷4', 0], ['蜂蜜 2、水 3：3÷2', 1], ['蜂蜜 2、水 3：2＋3', 1]], '蜂蜜的杯數放前面，除以水的杯數。', '對了！') },
  eqr: { rev: '多做一倍：前後都乘 2，是 4 杯蜂蜜、6 杯水。都加 1 的 3：4，蜂蜜的比例比較高，比較甜。', dia: () => tbl6([['蜂蜜', 2, 4, 6], ['水', 3, 6, 9]]), sort: S6('和 2：3 是同一個配方嗎？', ['同一個配方', '不一樣'], [['4：6', 0], ['3：4', 1], ['6：9', 0], ['5：6', 1]], '前後要乘同一個數，不是加同一個數。', '對了！') },
  share: { rev: '一輪 2＋3＝5 箱，20 箱分 4 輪：甲站 2×4＝8 箱。', dia: () => `<div class="rows6">${[1, 2, 3, 4].map(() => `<div class="r6">${dotsC(2, '#999')}｜${dotsC(3, '#ccc')}</div>`).join('')}</div>` },
  simpr: { rev: '2 和 3 的公因數只有 1，不能再一起圈了。', dia: () => grp6(6, 3, 2, { noHot: true, cell: '#bbb' }) + grp6(9, 3, 3, { noHot: true, cell: '#ddd' }), sort: S6('分一分：', ['不能再一起圈', '還能一起圈'], [['2：3', 0], ['4：6', 1], ['3：5', 0], ['6：9', 1]], '兩邊能不能一起每 2 個或 3 個圈？', '對了！') },
  arc: { rev: '平均切成 4 片，一片的彎邊是 40÷4＝10 公分。', dia: () => pie6(4, 4, 1, { takenCol: '#999' }), sort: S6('要算彎邊的長，還是一片的大小？', ['彎邊的長', '一片的大小'], [['一片披薩彎彎的邊有多長', 0], ['扇子彎邊上的花邊', 0], ['披薩上撒滿起司的地方', 1], ['扇子紙面要多少紙', 1]], '沿著邊量的是長；鋪滿的是大小。', '對了！') },
  sperim: { rev: '彎邊和兩條半徑都要貼：9.42＋6＋6＝21.42 公分。', dia: () => sectorSvg(3) },
  sarea: { rev: '平均切成 2 片，一片 100÷2＝50 平方公分。', dia: () => pie6(4, 4, 1, { takenCol: '#999' }), sort: S6('要算一片的大小，還是彎邊的長？', ['一片的大小', '彎邊的長'], [['撒滿起司的地方', 0], ['彎邊要多少餅皮', 1], ['扇子紙面要多少紙', 0], ['扇子彎邊上的花邊', 1]], '鋪滿的是大小。', '對了！') },
  speed: { rev: '小綠比較快：每分鐘 50 公尺比 40 公尺多。', dia: () => barU(2, GRY, '小綠：2 段') + barU(3, '#999', '小藍：3 段'), sort: S6('哪些算式在算「每 1 分鐘走多遠」？', ['距離÷時間', '不是'], [['100 公尺÷2 分鐘', 0], ['100 公尺＋2 分鐘', 1], ['120 公尺÷3 分鐘', 0], ['3 分鐘÷120 公尺', 1]], '路的長除以時間。', '對了！') },
  shisu: { rev: '45÷3＝15：平均每小時 15 公里。', dia: () => barRow(2, 2, GRY), sort: S6('哪些是在說每 1 小時走多遠？', ['每 1 小時', '不是'], [['汽車平均每小時 60 公里', 0], ['汽車開了 60 小時', 1], ['高鐵 1 小時大約 300 公里', 0], ['高鐵有 300 個座位', 1]], '要有「每 1 小時」和距離。', '對了！') },
  fensu: { rev: '400÷2＝200：每分鐘 200 公尺。', dia: () => barRow(3, 3, GRY), sort: S6('哪些是在說每 1 分鐘走多遠？', ['每 1 分鐘', '不是'], [['走路每分鐘 60 公尺', 0], ['走了 60 分鐘', 1], ['溜滑板每分鐘 200 公尺', 0], ['滑板重 2 公斤', 1]], '要有「每 1 分鐘」和距離。', '對了！') },
  miaosu: { rev: '30÷3＝10：每秒 10 公尺。', dia: () => barRow(2, 2, GRY), sort: S6('哪些是在說每 1 秒走多遠？', ['每 1 秒', '不是'], [['跑步每秒 5 公尺', 0], ['跑了 5 秒', 1], ['球每秒滾 10 公尺', 0], ['球有 10 顆', 1]], '要有「每 1 秒」和距離。', '對了！') },
  avgsp: { rev: '整趟 24 公里、3 小時：24÷3＝8，不是 12 和 6 的平均 9。', dia: () => barRow(3, 3, GRY) },
  countc: { rev: '是 6 種：每件上衣都能配 3 件裙子，3×2＝6。', dia: () => '<div class="tree6"><div>1 ─ ○○○</div><div>2 ─ ○○○</div></div>', sort: S6('用乘的，還是用加的？', ['一步接一步配在一起（乘）', '只選一樣（加）'], [['上衣配裙子', 0], ['一份套餐：飯配湯', 0], ['吃飯或吃麵，選一種', 1], ['去程配回程', 0], ['選一種球類或一種音樂社團', 1]], '要選兩樣配在一起，而且每一種都能配，才用乘的。', '對了！') },
  rel: { rev: '晚上 9 小時：15＋9＝24。', dia: () => `<div class="hz6"><div style="flex:15">${barRow(1, 1, '#ccc')}</div><div style="flex:9">${barRow(1, 1, '#777')}</div></div>`, sort: S6('哪些是一直不變的關係？', ['一直不變', '會變的數'], [['白天＋晚上＝24', 0], ['今天白天有幾小時', 1], ['這對兄弟：哥哥－弟弟＝3', 0], ['弟弟今年幾歲', 1]], '不管哪一天、哪一年都對的才算。', '對了！') },
  equal: { dia: () => '<div class="bal6"><span class="pan6">▢ ●●●</span><i>＝</i><span class="pan6">●●●</span></div>', sort: S6('這樣做，天平還會平嗎？', ['還是平的', '會傾斜'], [['兩邊都拿走 1 顆', 0], ['只拿走左邊 1 顆', 1], ['兩邊都放 2 顆', 0], ['只放右邊 2 顆', 1]], '兩邊要做一樣的事。', '對了！') },
  base: { rev: '不一樣！把乙艙看作 1，甲艙是 2 倍；把甲艙看作 1，乙艙是 1/2 倍。看作 1 的量換了，答案就換了。', dia: () => barU(4, GRY, '📏 哥哥（看作 1）') + barU(3, '#999', '弟弟', 75), sort: S6('這一題要把誰看作 1？', ['看作 1 的', '拿來比的'], [['「哥哥是弟弟的幾倍」：弟弟', 0], ['「哥哥是弟弟的幾倍」：哥哥', 1], ['「以小美的卡片數為準，小安有幾倍」：小美', 0], ['「以小美的卡片數為準，小安有幾倍」：小安', 1]], '先看題目拿誰和誰比；被拿來當標準的，就是看作 1 的。', '對了！') },
  cmpq: { rev: '拿來和哥哥比的是弟弟。', dia: () => barU(4, GRY, '📏 哥哥') + barU(3, '#999', '弟弟', 75), sort: S6('誰是拿來比的量？', ['拿來比的', '看作 1 的'], [['「水是蜂蜜的幾倍」：水', 0], ['「水是蜂蜜的幾倍」：蜂蜜', 1], ['「甲是乙的幾倍」：甲', 0], ['「甲是乙的幾倍」：乙', 1]], '先找被看作 1 的；另一個就是拿來比的。', '對了！') },
  findb: { rev: '甲艙 15 箱是 3 段，每段 5 箱；乙艙 4 段是 20 箱。', dia: () => segs6(4, 4, GRY, '乙艙 4 段', 100, '') + segs6(3, 3, '#999', '甲艙 3 段', 75, '') },
  zoom: { rev: '高要 4 格：寬乘 2，高也要乘 2。', dia: () => rectG6(6, 4, false, GRY), sort: S6('寬 3 高 2 的旗子變大，哪些形狀和原來一樣？', ['形狀一樣', '比例變了'], [['寬 6、高 4', 0], ['寬 6、高 3', 1], ['寬 9、高 6', 0], ['寬 4、高 4', 1]], '寬和高要乘同一個數。', '對了！') },
  shrink: { dia: () => rectG6(3, 2, false, GRY), sort: S6('寬 6 高 4 的海報變小，哪些形狀和原來一樣？', ['形狀一樣', '比例變了'], [['寬 3、高 2', 0], ['寬 3、高 4', 1], ['寬 6、高 2', 1], ['寬 1.5、高 1', 0]], '寬和高要乘同一個分數。', '對了！') },
  mapscale: { rev: '2 公分：圖上 1 公分代表的距離越長，同一條路在圖上越短。', dia: () => road6(3, 3, 1), sort: S6('分一分：', ['圖上 1 公分代表 1 公里', '圖上 1 公分代表 2 公里'], [['圖上 3 公分是 3 公里', 0], ['圖上 2 公分是 4 公里', 1], ['圖上 4 公分是 4 公里', 0], ['圖上 1 公分是 2 公里', 1]], '算算圖上每 1 公分代表多遠。', '對了！') },
  prismw: { rev: '甜筒越上面越大，每一層不一樣大。', dia: () => isoSvg(2, 2, 3, undefined, ['#ddd', '#bbb', '#999']), sort: S6('從下往上，每一層都和底面一樣大嗎？', ['每層一樣大', '每層不一樣'], [['罐頭', 0], ['甜筒', 1], ['盒子', 0], ['金字塔', 1], ['方形蛋糕', 0]], '從下往上，每一層是不是同樣大？', '對了！') },
  vol: { rev: '一層 5 塊、6 層：5×6＝30 塊。', dia: () => isoSvg(3, 2, 3, undefined, ['#ddd', '#bbb', '#999']), sort: S6('哪些算式是「一層的塊數×層數」？', ['一層×層數', '不是'], [['6×3', 0], ['6＋3', 1], ['10×4', 0], ['10＋4', 1]], '一層的塊數乘幾層。', '對了！') },
  surf: { rev: '罐頭要包 3 塊：側面和上下兩個圓。', dia: () => `<div class="faces6">${['上', '下', '前', '後', '左', '右'].map(f => `<span class="face6">${f}</span>`).join('')}</div>`, sort: S6('哪些是要包的面？', ['要包的面', '裡面的空間'], [['盒子的上面', 0], ['盒子的側面', 0], ['盒子裝的糖', 1], ['罐頭的側面', 0], ['罐頭裝的湯', 1]], '包裝紙包的是外面。', '對了！') },
  pie: { rev: '月球 5 片，是 10 片的一半。', dia: () => slice10(VOTES, 10), sort: S6('想看什麼？', ['每部分占全部多少', '隨時間怎麼變'], [['每人一票，各星球各占多少', 0], ['零用錢的各種花費各占多少', 0], ['一天的氣溫', 1], ['每年的身高', 1]], '各部分合起來剛好是全部的，才分到左邊。', '對了！') },
  likely: { rev: '紅球有 9 顆、藍球只有 1 顆，紅球比較容易摸到。', dia: () => dotsC(9, '#999') + dotsC(1, '#ddd'), sort: S6('分一分：', ['比較容易發生', '比較不容易發生'], [['袋中 9 紅 1 藍（搖勻、不看），摸到紅球', 0], ['同一個袋子，摸到藍球', 1], ['公平轉盤 10 格中 8 格黃，轉到黃色', 0], ['同一個轉盤，轉到不是黃色', 1]], '比一比：顆數或格數，哪一種多？', '對了！比較不容易，也還是可能發生。') },
};
for (const [k, v] of Object.entries(AUG)) if (CONCEPTS[k]) Object.assign(CONCEPTS[k], v);
// 揭曉畫面用和揭曉句子同一個例子（預設是最後一個操作的畫面，例子不同時在這裡指定）
const REVPIC = {
  short: () => ladderHtml([[2, 8, 12], [2, 4, 6]], 2, 3),
  base: () => cut6(2, 1, { noCut: true, col: '#f7c873', lab: '📏 甲艙 6 箱（看作 1）' }) + barU(1, K2, '乙艙 3 箱', 50),
  decdiv: () => cut6(6, 5, { noCut: true, lab: '3 公尺，每段 0.5 公尺' }),
  ringA: () => ringSvg(2),
  eqr: () => `<div class="pair6"><div>${cupHtml(C_HW, 2, 3)}<small>2：3</small></div><div>${cupHtml(C_HW, 4, 6)}<small>4：6</small></div><div>${cupHtml(C_HW, 3, 4)}<small>3：4</small></div></div>`,
  share: () => shareRows6(4),
  arc: () => pie6(4, 4, 1, { takenCol: K4 }),
  sperim: () => sectorSvg(3),
  speed: () => cut6(2, 1, { noCut: true, col: '#f4a9a0', lab: '小綠每段 50 公尺' }) + cut6(3, 2, { noCut: true, col: '#a9d0f0', lab: '小藍每段 40 公尺' }),
  avgsp: () => cut6(3, 2, { noCut: true, lab: '整趟 24 公里，3 小時：每段 8 公里' }),
  countc: () => `<div class="tree6">${[0, 1].map(i => `<div class="tr6"><span class="op6 on">👕${i + 1}</span><span class="tr-l">👗👗👗</span></div>`).join('')}</div>`,
  findb: () => segs6(4, 4, K2, '📏 乙艙 20 箱（4 段）', 100, 5) + segs6(3, 3, '#f7c873', '甲艙 15 箱（3 段）', 75, 5),
  zoom: () => rectG6(3, 2) + rectG6(6, 4),
  vol: () => isoSvg(5, 1, 6),
};
for (const [k, f] of Object.entries(REVPIC)) if (CONCEPTS[k]) CONCEPTS[k].revPic = f;
/* ---------- 單位教室 ---------- */
const LESSONS = {
  dist: {
    title: '距離', sem: '六下', icon: '📏', who: 'seal', name: '波波', say: '地圖上的 1 公分，實際可能很遠。先記得每個單位多長。',
    cards: [
      { e: '✏️', u: '公分', t: '尺上的 1 大格。很多人的食指寬大約 1 公分，可以用來估測。一枝鉛筆大約 18 公分。' },
      { e: '🚪', u: '公尺', t: '1 公尺＝100 公分。門大約 2 公尺高。' },
      { e: '🚶', u: '公里', t: '1 公里＝1000 公尺。用一般的步速估算，大約要走 15 分鐘。' },
    ],
    labs: [{ n: 10, each: 100, from: '公尺', to: '1000 公尺', btn: '走 100 公尺', done: '1000 公尺就是 1 公里！' }],
  },
  spd: {
    title: '快慢', sem: '六上', icon: '🚄', who: 'rabbit', name: '派派', say: '時速看 1 小時走多遠，分速看 1 分鐘，秒速看 1 秒。同一個快慢，三種說法都可以。',
    cards: [
      { e: '🚶', u: '分速', t: '每 1 分鐘走多遠。小朋友走路大約分速 60 公尺，也就是每秒約 1 公尺。' },
      { e: '🏃', u: '秒速', t: '每 1 秒走多遠。快跑大約秒速 5 公尺。' },
      { e: '🚄', u: '時速', t: '每 1 小時走多遠。高鐵大約時速 300 公里，也就是每秒約 83 公尺。' },
    ],
    labs: [{ view: 'clock', n: 6, each: 10, from: '分鐘', to: '60 分鐘', btn: '走 10 分鐘', done: '60 分鐘就是 1 小時。分速 60 公尺，1 小時走 60×60＝3600 公尺，就是時速 3.6 公里！' }],
  },
  vol: {
    title: '裝多少', sem: '六下', icon: '🛢️', who: 'turtle', name: '阿穩', say: '燃料槽裝多少？先看看這些單位有多大。',
    cards: [
      { e: '🎲', u: '立方公分', t: '一個模型小方塊，每邊 1 公分。' },
      { e: '🧊', u: '公升', t: '1 公升＝1000 立方公分。內部每邊 10 公分的正方體容器，裝滿剛好 1 公升。' },
      { e: '📦', u: '立方公尺', t: '每邊 1 公尺的大正方體，可以裝 1000 公升。' },
    ],
    labs: [{ n: 10, each: 100, from: '立方公分', to: '1000 立方公分', btn: '再疊一層（100 立方公分）', done: '10 層共 1000 立方公分，就是 1 公升！' }],
  },
};
const ms6 = (e, n, k, lab) => `<div class="road6">${Array.from({ length: n }, (_, i) => `<span class="${i < k ? 'on' : i === k ? 'hot6' : ''}">${i < k ? e : '　'}</span>`).join('')}</div>${lab ? `<div class="trail">${lab}</div>` : ''}`;
// 單位教室的開場（和小故事同一結構）：舊經驗 → 動手（單位名稱先不出現）→ 一次命名一個單位 → 圖對應 → 選對的話 → 換你出題 → 驗收；之後才接原本的量感與換算練習
const LESSON_STORY = {
  dist: { sem: '六下', who: 'seal', word: '公分、公尺、公里', hide: ['公分', '公尺', '公里'], fs: 's2', sortAt: 'map',
    steps: [
      { t: 'say', say: '先看一個量長度的方法：用手指一指一指量，或用腳一步一步量。', pic: () => '<div class="it6">✋ 👣</div>' },
      { t: 'act', id: 'd', who: 'demo', say: '量橡皮擦：一指一指放上去。', n: 4, pic: k => ms6('☝️', 4, k), cap: k => `${k} 個手指寬`, done: '這塊橡皮擦大約是 4 個手指寬。' },
      { t: 'say', say: '可是每個人的手指寬不一樣，大人的手指比較寬。要讓大家量得一樣，就要用共同的標準單位，用尺來量。', pic: () => '<div class="it6">☝️ ≠ 👆　📏</div>' },
      { t: 'name', word: '公分', say: '尺上每一大格的長度，有名字。', name: '尺上每一大格的長度是 1 <b>公分</b>。很多人的食指寬大約 1 公分，可以用來估測；精確的長度要用尺量。', pic: () => ms6('📏', 4, 4) },
      { t: 'act', id: 's', say: '量走廊：用公分一格一格量太多了。改用一條 100 公分長的捲尺，一段一段量：點一下量一段。', tip: '點下一個空格，量下一段 100 公分。', n: 6, pic: k => ms6('📏', 6, k), cap: k => `量了 ${k} 段，每段 100 公分，100×${k}＝${k * 100} 公分`, done: '6 段，600 公分。' },
      { t: 'name', word: '公尺', say: '100 公分的長度，也有名字。', name: '100 公分的長度叫 1 <b>公尺</b>，1 公尺＝100 公分。大人走一大步大約 1 公尺，可以用來估測。', pic: () => ms6('📏', 6, 6) },
      { t: 'guess', say: '學校到車站，用 1 公尺一段一段量，方便嗎？', o: ['太多段了，要更大的單位', '剛剛好'] },
      { t: 'act', id: 's2', say: '從學校走到車站，路邊每 100 公尺有一塊標示牌：點一下走過一塊。', tip: '點下一個空格，走過下一塊標示牌。', n: 10, pic: k => ms6('🪧', 10, k), cap: k => `走過 ${k} 塊，100×${k}＝${k * 100} 公尺`, done: '走過 10 塊標示牌，是 1000 公尺。用一般的步速估算，大約要走 15 分鐘。' },
      { t: 'name', word: '公里', say: '1000 公尺的長度，也有名字。', name: '1000 公尺的長度叫 1 <b>公里</b>，1 公里＝1000 公尺。', pic: () => ms6('🪧', 10, 10) },
      { t: 'say', id: 'map', say: '三個單位接起來；手指寬、步長只能幫忙估測。', pic: () => sym6([[100, '公分', K1], '＝', [1, '公尺', K2]]) + sym6([[1000, '公尺', K2], '＝', [1, '公里', K3]]) },
      { t: 'check', o: ['越長的距離，用越大的單位比較方便', '什麼都用公分最好'], a: 0, why: [, '用公分說臺北到臺中，數字會非常大，不方便。'] },
      { t: 'pose', say: '哪一題用公里來說最合適？', o: ['臺北到臺中有多遠？', '鉛筆有多長？'], a: 0, why: [, '鉛筆很短，用公分比較合適。'] },
    ],
    q: { t: '學校操場一圈大約多長？哪一個最合理？', o: ['200 公尺', '200 公分', '200 公里'], a: 0, why: [, '200 公分只有大約兩個大人那麼長，太短了。', '200 公里比臺北到臺中還遠，太長了。'], ok: '對了！很多學校的操場一圈是 200 公尺。', back: 's', hint: '想想 1 公尺一段要量幾段。' } },
  spd: { sem: '六上', who: 'rabbit', word: '時速、分速、秒速', hide: ['時速', '分速', '秒速'], fs: 's', sortAt: 'map',
    steps: [
      { t: 'say', say: '比快慢時，可以看每 1 秒、每 1 分鐘或每 1 小時走多遠。同一個快慢，可以用不同的時間來說。', pic: () => '<div class="it6">⏱️ ⏰ 🕐</div>' },
      { t: 'act', id: 'd', who: 'demo', say: '小朋友走路，一路一樣快。表格說的是同一個走法：點「1 分鐘」那一格看看。', n: 1, pic: k => tbl6([['時間', '1 秒', '1 分鐘', '1 小時'], ['走多遠', '約 1 公尺', '60 公尺', '3600 公尺']]) + chips6(['1 秒', '1 分鐘', '1 小時'], (_, i) => i === 1 && !k, () => '這一格也對，說的是同一個快慢；這次先看 1 分鐘。'), done: '1 分鐘走 60 公尺。三格說的是同一個快慢，用哪一格都對。' },
      { t: 'name', word: '分速', say: '「每 1 分鐘走多遠」有名字。', name: '用每 1 分鐘走多遠來說快慢，叫<b>分速</b>。走路大約分速 60 公尺，也可以說每秒約 1 公尺。', pic: () => '<div class="it6">🚶</div>' },
      { t: 'act', id: 's', say: '高鐵，一路一樣快。從表格選出「每 1 小時走多遠」那一格。', tip: '先找表格裡「1 小時」那一欄。', n: 1, pic: k => tbl6([['時間', '1 秒', '1 分鐘', '1 小時'], ['走多遠', '約 83 公尺', '5 公里', '300 公里']]) + (k ? '' : chips6(['約 83 公尺', '5 公里', '300 公里'], (_, i) => i === 2, (_, i) => i === 0 ? '這是 1 秒走的距離；題目要每 1 小時。' : '這是 1 分鐘走的距離；題目要每 1 小時。')), done: '1 小時大約 300 公里。' },
      { t: 'name', word: '時速', say: '「每 1 小時走多遠」有名字。', name: '用每 1 小時走多遠來說快慢，叫<b>時速</b>。高鐵大約時速 300 公里，也就是每分鐘約 5 公里。', pic: () => '<div class="it6">🚄</div>' },
      { t: 'guess', say: '聲音在空氣中大約 1 秒傳 340 公尺。說成每 1 小時，大約多遠？', o: ['約 1224 公里', '約 340 公里'] },
      { t: 'act', id: 's2', say: '聲音：從表格選出「每 1 秒傳多遠」那一格。', tip: '先找表格裡「1 秒」那一欄。', n: 1, pic: k => tbl6([['時間', '1 秒', '1 分鐘', '1 小時'], ['傳多遠', '約 340 公尺', '約 20400 公尺', '約 1224 公里']]) + (k ? '' : chips6(['約 340 公尺', '約 20400 公尺', '約 1224 公里'], (_, i) => i === 0, (_, i) => i === 1 ? '這是 1 分鐘傳的距離；題目要每 1 秒。' : '這是 1 小時傳的距離；題目要每 1 秒。')), done: '1 秒大約 340 公尺。' },
      { t: 'name', word: '秒速', say: '「每 1 秒走多遠」有名字。', name: '用每 1 秒走多遠來說快慢，叫<b>秒速</b>。聲音在空氣中大約秒速 340 公尺。', pic: () => '<div class="it6">🔊</div>' },
      { t: 'say', id: 'map', say: '同一個快慢，可以換成不同的說法；要比較兩個快慢，先換成相同的單位。', pic: () => sym6([['分速 60 公尺', '走路', K1], '＝', ['秒速 1 公尺', '', K2], '＝', ['時速 3.6 公里', '', K3]]) },
      { t: 'check', o: ['同一個快慢，可以用時速、分速或秒速來說', '走路只能用分速來說'], a: 0, why: [, '走路每秒約 1 公尺、時速約 3.6 公里，也都對；看哪一種方便。'] },
      { t: 'pose', say: '要比較腳踏車「時速 15 公里」和走路「分速 60 公尺」誰快，要先做什麼？', o: ['先換成相同的單位再比', '直接比 15 和 60'], a: 0, why: [, '單位不同，不能直接比數字：分速 60 公尺是時速 3.6 公里，比時速 15 公里慢。'] },
    ],
    q: { t: '腳踏車 1 小時騎 15 公里，一路一樣快。哪一個說法對？', o: ['時速 15 公里', '分速 15 公里', '秒速 15 公里'], a: 0, why: [, '15 公里是 1 小時騎的，不是 1 分鐘。', '15 公里是 1 小時騎的，不是 1 秒。'], ok: '對了！', back: 's', hint: '15 公里是騎了多久的距離？' } },
  vol: { sem: '六下', who: 'turtle', word: '立方公分、公升、立方公尺', hide: ['立方', '公升', '毫升'], fs: 's', sortAt: 'map',
    steps: [
      { t: 'say', say: '數方塊：一塊一塊數，看占多大的空間。', pic: () => isoSvg(2, 1, 1) },
      { t: 'act', id: 'd', who: 'demo', say: '每個模型小方塊，邊長都是 1 公分。點小方塊放進盒子。', n: 3, pic: k => ms6('🎲', 3, k), cap: k => `${k} 個`, done: '3 個小方塊那麼大。' },
      { t: 'name', word: '立方公分', say: '一個小方塊的大小有名字。', name: '邊長 1 公分的正方體，體積是 1 <b>立方公分</b>。', pic: () => '<div class="it6">🎲</div>' },
      { t: 'act', id: 's', say: '內部邊長都是 10 公分的正方體盒子，用小方塊裝滿：每層 10×10＝100 個，點一下放一層。', tip: '點盒子，放下一層。', n: 10, pic: k => `<span class="hot6">${isoSvg(10, 10, 10, k * 100)}</span>`, cap: k => `${k} 層，100×${k}＝${k * 100} 個`, done: '10 層，1000 個小方塊，就是 1000 立方公分。' },
      { t: 'name', word: '公升', say: '這個盒子裝滿的量有名字。', name: '內部邊長 10 公分的正方體容器，裝滿是 1000 立方公分，叫 1 <b>公升</b>。1 公升＝1000 立方公分。', pic: () => '<div class="it6">🧊</div>' },
      { t: 'guess', say: '邊長 1 公尺（100 公分）的大正方體，可以放幾個 1 公升的正方體盒子？', o: ['1000 個', '10 個'] },
      { t: 'act', id: 's2', say: '用 1 公升的盒子排滿大正方體：每邊放 10 個，每層 10×10＝100 個，點一下放一層。', tip: '點大正方體，放下一層。', n: 10, pic: k => `<span class="hot6">${isoSvg(10, 10, 10, k * 100, ['#f7dc8c', '#f0c040', '#d6a020'])}</span>`, cap: k => `${k} 層，100×${k}＝${k * 100} 個`, done: '10 層，1000 個 1 公升的盒子。' },
      { t: 'name', word: '立方公尺', say: '大正方體的大小有名字。', name: '邊長 1 公尺的正方體，體積是 1 <b>立方公尺</b>。1 立方公尺＝1000 公升。', pic: () => '<div class="it6">📦</div>' },
      { t: 'say', id: 'map', say: '每大一級，都是 1000 個小的。', pic: () => sym6([[1000, '立方公分', K1], '＝', [1, '公升', K2]]) + sym6([[1000, '公升', K2], '＝', [1, '立方公尺', K3]]) },
      { t: 'check', o: ['1 公升＝1000 立方公分', '1 公升＝10 立方公分'], a: 0, why: [, '1 公升的盒子每層 100 個、共 10 層，是 1000 個 1 立方公分。'] },
      { t: 'pose', say: '哪一個用公升說最合適？', o: ['一桶水有多少？', '一顆骰子有多大？'], a: 0, why: [, '骰子很小，用立方公分比較合適。'] },
    ],
    q: { t: '一桶水大約可以倒滿 10 個 1 公升的盒子，怎麼說？', o: ['大約 10 公升', '大約 10 立方公分', '大約 10 立方公尺'], a: 0, why: [, '10 立方公分只有 10 個小方塊那麼大，太少了。', '10 立方公尺是 10 個大正方體，太多了。'], ok: '對了！', back: 's', hint: '1 個盒子是 1 公升。' } },
};
const LESSON_AUG = {
  dist: { rev: '太多段了，所以要更大的單位。', dia: () => ms6('│', 10, 10), sort: { q: '這些東西很短，還是很長？', bins: ['用公分、公尺', '用公里'], items: [['橡皮擦', 0], ['鉛筆', 0], ['臺北到臺中', 1], ['學校到車站', 1]], hint: '想想用尺就量得完，還是要走很久。', done: '短的用小單位，長的用大單位。' } },
  spd: { rev: '約 1224 公里：1 小時有 3600 秒，340×3600＝1224000 公尺。', dia: () => tbl6([['時間', '1 秒', '1 分鐘', '1 小時'], ['走路', '約 1 公尺', '60 公尺', '3.6 公里']]), sort: { q: '和「走路分速 60 公尺」一樣快嗎？', bins: ['一樣快', '不一樣快'], items: [['秒速 1 公尺', 0], ['時速 3.6 公里', 0], ['時速 60 公里', 1], ['秒速 60 公尺', 1]], hint: '先換成相同的單位：1 分鐘有 60 秒，1 小時有 60 分鐘。', done: '對了！' } },
  vol: { rev: '1000 個：每邊 10 個，10×10×10。', dia: () => isoSvg(3, 3, 3, undefined, ['#ddd', '#bbb', '#999']) + '<div class="trail">縮小的示意圖：每邊其實是 10 個</div>', sort: { q: '這些東西很小，還是很大？', bins: ['用立方公分', '用立方公尺'], items: [['骰子', 0], ['橡皮擦', 0], ['貨櫃', 1], ['房間', 1]], hint: '想想要用小方塊量，還是要用大正方體量。', done: '對了！' } },
};
for (const [k, v] of Object.entries(LESSON_AUG)) Object.assign(LESSON_STORY[k], v);
function clockSvg(from, cur) {
  let s = '<svg class="g5" style="max-height:190px" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="#fff" stroke="#33405a" stroke-width="4"/>';
  for (let h = 1; h <= 12; h++) { const a = h * 30 * Math.PI / 180; s += `<text x="${100 + 74 * Math.sin(a)}" y="${106 - 74 * Math.cos(a)}" text-anchor="middle" class="pt">${h}</text>`; }
  const P = (h, l) => [100 + l * Math.sin(h * 30 * Math.PI / 180), 100 - l * Math.cos(h * 30 * Math.PI / 180)], [c, d] = P(cur, 66);
  return s + `<line x1="100" y1="100" x2="${c}" y2="${d}" stroke="#d6476b" stroke-width="6" stroke-linecap="round"/><circle cx="100" cy="100" r="6" fill="#33405a"/></svg>`;
}
function labPic(X, k) { return `<div class="vs6">${clockSvg(0, k * 2 % 12)}</div>`; }
const LESSON_BEFORE = { scale: ['dist'], prism: ['vol'] }; // 快慢的單位由小故事時速、分速、秒速介紹，單位教室留著複習
function viewLessons() {
  window.scrollTo(0, 0);
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="home" aria-label="回地圖">⌂</button><h2 class="page-h">單位教室</h2></div>
    <p class="tag">先認識單位，再去島上用它。</p>
    <div class="lessons">${Object.entries(LESSONS).map(([k, L]) => `<div class="lesson-row"><button class="lesson" data-l="${k}"><span class="l-e">${L.icon}</span><span class="l-t"><b>${L.title}</b><small>${L.cards.map(c => c.u).join('、')}</small></span><em class="sem">${L.sem}</em>${(S.learned || {})[k] ? '<span class="badge in">✓</span>' : ''}</button><button class="drill-btn" data-d="${k}">練習</button></div>`).join('')}</div>`;
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
  return ex.length ? `<span class="u-ex">${ex.map(x => `<span>${x.e} ${x.name} ${Logic.fmtU(x)}</span>`).join('')}</span>` : '';
}
function runLesson(key, then) { // 先走情境、動手、命名，再接量感與換算；存檔 S.learned 不變
  runConcept(key, () => runLessonBody(key, then), { ...LESSON_STORY[key], frameTitle: '單位教室', skipLabel: '跳過，直接看單位', doneLabel: '認識更多', exit: then });
}
function runLessonBody(key, then) {
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
    lessonFrame(L, `一直加，加到 ${X.to}。`, `${X.view ? '<div id="bar" class="lab-pic"></div>' : `<div class="${X.tall ? 'u-bottle' : 'u-bar'}" id="bar">${Array.from({ length: X.n }, () => '<i></i>').join('')}</div>`}<div class="u-count" id="cnt"></div><div class="trade"><button id="add">${X.btn}</button></div>`);
    document.getElementById('out').onclick = leave;
    let k = 0;
    const draw = () => {
      if (X.view) setEl('bar', labPic(X, k)); else document.querySelectorAll('#bar i').forEach((c, j) => c.classList.toggle('on', j < k));
      document.getElementById('cnt').innerHTML = `<b class="num">${k * X.each}</b> ${X.from}`;
    };
    draw();
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
    lessonFrame(L, `一格是 1 平方公分。<br>點格子，把草地鋪滿。`, `<div class="u-tiles" style="grid-template-columns:repeat(${X.w},1fr)">${Array.from({ length: X.w * X.h }, (_, j) => `<button class="u-tile" data-t="${j}" aria-label="第 ${j + 1} 格"></button>`).join('')}</div><div class="u-count" id="cnt"></div>`);
    document.getElementById('out').onclick = leave;
    const on = new Set();
    const draw = () => { document.getElementById('cnt').innerHTML = `<b class="num">${on.size}</b> 平方公分`; };
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
    const plan = ['sort', 'sort', 'order', 'quiz', 'quiz'];
    unitDrill(key, plan, leave, finishLesson);
  }
  function finishLesson() {
    S.learned = S.learned || {}; const first = !S.learned[key]; S.learned[key] = 1;
    if (first) S.stars += 2000;
    save();
    lessonFrame(L, `${L.title}單位，你認識了！`, `<div class="u-big">${L.icon}</div><div class="u-sum">${L.cards.map(c => `<span>${c.e} ${c.u}</span>`).join('')}</div>${first ? `<div class="trail">${nums('航線多了 2000 公里')}</div>` : ''}`);
    document.getElementById('out').onclick = leave;
    document.getElementById('actions').innerHTML = '<button class="btn" id="end">好！</button>';
    document.getElementById('end').onclick = leave;
  }
  cards();
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
    const slots = () => { document.getElementById('slots').innerHTML = [0, 1, 2].map(i => `<span class="u-slot ${picked[i] ? 'on' : ''}">${picked[i] ? `${picked[i].e}<small>${nums(Logic.fmtU(picked[i]))}</small>` : `<b class="num">${i + 1}</b>`}</span>`).join(''); };
    slots();
    document.querySelectorAll('[data-x]').forEach(b => b.onclick = () => {
      const x = show[+b.dataset.x];
      if (x === right[picked.length]) {
        picked.push(x); b.disabled = true; b.classList.add('no'); sfx.hop(); slots();
        if (picked.length === 3) passed(clean, `對了！由小到大：${right.map(r => `${r.name} ${Logic.fmtU(r)}`).join('，')}。`);
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
      return choose(`${x.name}${x.dim}，<br>用哪個單位最合適？`, x.e, names, x.u, '想想看：很小用小單位，很大用大單位。', `對了！${x.name}大約${Logic.fmtU(x)}。`);
    }
    const q = Logic.unitQuestion(key, x);
    choose(q.text, q.e, q.options, q.a, q.why, `對了！${q.why}`);
  }
  ask();
}
function runDrill(key, then) { // 單獨練習一輪
  const L = LESSONS[key], base =  ['sort', 'quiz', 'order', 'sort', 'quiz', 'sort', 'order', 'quiz'];
  unitDrill(key, base, then, firstTry => {
    lessonFrame(L, `練習完成！`, `<div class="u-big">${L.icon}</div><div class="u-count"><b class="num">${firstTry}</b> ／ ${base.length} 題第一次就對</div><div class="trail">${nums(`航線多了 ${firstTry * 500} 公里`)}</div>`);
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
  lessonFrame(L, `先認識${L.title}的單位，<br>等一下用起來就不怕了！`, `<div class="u-big">${L.icon}</div>`);
  document.getElementById('out').onclick = () => go('');
  document.getElementById('actions').innerHTML = '<button class="btn" id="yes">去上課</button><button class="btn alt" id="no">先跳過</button>';
  document.getElementById('yes').onclick = () => runLesson(need, () => lessonsThen(ch, then));
  document.getElementById('no').onclick = then;
}

const QUIZ_STAR = 200;
/* ---------- 單元數感測驗（共用，來源 D:/數感測驗題庫/quiz_ui.js） ---------- */
const QUIZ_LV = { basic: ['基礎題', 25], adv: ['進階題', 25], fun: ['益智題', 10], pose: ['出題', 10] };
const quizLevels = U => Object.keys(QUIZ_LV).filter(l => U[l] && U[l].length); // 出題組是後加的，沒有就不顯示
const quizBest = key => (S.quiz || {})[key];
const quizShell = (title, back, body) => {
  window.scrollTo(0, 0);
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="qback" aria-label="回上一頁">⌂</button><h2 class="page-h">${title}</h2></div>${body}`;
  document.getElementById('qback').onclick = back;
};
/* 題目圖：一般文字圖照原樣；有「｜」的行畫成表格，欄位才對得齊 */
function picHtml(p) {
  if (!p) return '';
  if (!p.includes('｜')) return `<div class="q-pic">${esc(p)}</div>`;
  const rows = p.split(String.fromCharCode(10)).filter(r => r.trim());
  const tr = rows.filter(r => r.includes('｜')).map(r => `<tr>${r.split('｜').map(c => `<td>${nums(esc(c.trim()))}</td>`).join('')}</tr>`).join('');
  const notes = rows.filter(r => !r.includes('｜')).map(r => `<div class="q-tnote">${nums(esc(r.trim()))}</div>`).join('');
  return `<div class="q-tbl"><table>${tr}</table>${notes}</div>`;
}
// 依南一單元對調過冊序（三年級 3a-7 與 3b-2；六年級 6b-2 與 6b-6），舊成績跟著單元搬一次
function quizMigrate() {
  if (!S.quiz || S.quizMig >= 1) return;
  const ids = ((window.QUIZ && QUIZ.books) || []).map(b => b.id);
  const swap = (a, b) => ['basic', 'adv', 'fun', 'pose'].forEach(l => {
    const x = S.quiz[`${a}-${l}`], y = S.quiz[`${b}-${l}`];
    delete S.quiz[`${a}-${l}`]; delete S.quiz[`${b}-${l}`];
    if (y !== undefined) S.quiz[`${a}-${l}`] = y;
    if (x !== undefined) S.quiz[`${b}-${l}`] = x;
  });
  if (ids.includes('3a') && ids.includes('3b')) swap('3a-7', '3b-2');
  if (ids.includes('6b')) swap('6b-2', '6b-6');
  S.quizMig = 1; save();
}
function viewQuizBooks() {
  quizMigrate();
  const books = (window.QUIZ && QUIZ.books) || [];
  quizShell('單元測驗', () => go(''), `<p class="tag">${books.length ? '每個單元都有基礎、進階和益智題。' : '題庫準備中，很快就來！'}</p><div class="lessons">${books.map((b, i) => {
    const total = b.units.reduce((n, U) => n + quizLevels(U).length, 0), done = b.units.reduce((n, U) => n + quizLevels(U).filter(l => quizBest(`${b.id}-${U.u}-${l}`) !== undefined).length, 0);
    return `<button class="lesson" data-b="${i}"><span class="l-t"><b>${b.name}</b><small>${b.units.length} 個單元</small></span><em class="sem">${done} / ${total}</em></button>`;
  }).join('')}</div>${wpEntry()}`);
  document.querySelectorAll('[data-b]').forEach(x => x.onclick = () => viewQuizUnits(books[+x.dataset.b]));
  const wi = document.getElementById('wpin'); if (wi) wi.onclick = viewWpList;
}
function viewQuizUnits(b) {
  quizShell(b.name, viewQuizBooks, `<div class="q-units">${b.units.map((U, i) => `<div class="q-unit"><b>${nums(`${U.u}. ${U.title}`)}</b><small>${esc(U.sense)}</small><div class="q-lv">${quizLevels(U).map(l => { const best = quizBest(`${b.id}-${U.u}-${l}`); return `<button data-u="${i}" data-l="${l}"><span>${QUIZ_LV[l][0]}</span><small>${best === undefined ? `${QUIZ_LV[l][1]} 題` : `最佳 ${best} 分`}</small></button>`; }).join('')}</div></div>`).join('')}</div>`);
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
      <div class="prompt" id="prompt">${nums(esc(q.q))}</div>${picHtml(q.pic)}<div class="msg" id="msg"></div><div class="actions" id="actions"></div>${q.t === 'num' ? `<div id="pad">${q.unit ? `<div class="trail">${esc(q.unit)}</div>` : ''}${keypadHtml()}</div>` : ''}`);
    const done = ok => {
      if (ok && tries === 0) { right++; S.stars += QUIZ_STAR; } else if (tries === 0 || !ok) wrong.push(list[i]);
      save();
      setMsg(`${ok ? '對了。' : '一起看看怎麼想：'}${nums(esc(q.why))}`, ok ? 'good' : 'hint');
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
        clear(); miss2(nums(`${val} 和答案不一樣。先看題目問的是哪一個量，再算一次。`));
      });
    } else {
      document.getElementById('actions').innerHTML = `<div class="choices col">${q.o.map((o, n) => `<button class="choice" data-c="${n}">${nums(esc(o))}</button>`).join('')}</div>`;
      document.querySelectorAll('[data-c]').forEach(c => c.onclick = () => {
        if (+c.dataset.c === q.a) return done(true);
        c.classList.add('no'); c.disabled = true; miss2('這個選項不對。先找出題目問的是什麼，再選一次。');
      });
    }
  }
  function result() {
    const score = Math.round(right / list.length * 100);
    if (!only) { S.quiz = S.quiz || {}; const k = `${b.id}-${U.u}-${lv}`; S.quiz[k] = Math.max(S.quiz[k] || 0, score); save(); }
    quizShell(`${QUIZ_LV[lv][0]}成績`, back, `<div class="end pop"><h2>${nums(`第一次就答對 ${right} / ${list.length} 題`)}</h2><p>${score === 100 ? '每一題第一次就答對了。' : score >= 80 ? '大部分都答對了，可以挑錯的那幾題，再看一次解說。' : '先挑一題錯的，看解說是哪一步卡住，再試一次。'}</p><div class="actions" id="ra"></div></div>`);
    document.getElementById('ra').innerHTML = `${wrong.length ? '<button class="btn" id="rw">再做一次錯的</button>' : ''}<button class="btn alt" id="rb">回單元</button>`;
    if (wrong.length) document.getElementById('rw').onclick = () => runQuiz(b, U, lv, wrong);
    document.getElementById('rb').onclick = back;
  }
  ask();
}


/* ---------- 應用題（讀題驗收） ----------
   依《南一版一到六年級_應用題分類與引導語整合稿》第 7 節：
   先給完整題目，孩子選「我想先試試」或「幫我讀題」；幫手第一步一律先確認最後要找什麼，一次一個問題，選到合理的就前進。
   作答後才顯示完整解析，再請孩子把答案放回題目檢查（check 步驟），然後出換情境的遷移題。
   紀錄：自己完成／經提示完成／仍需協助（看過做法，或遷移題沒過）；卡住的層分開記：
   目標理解 goal、資料選取 roles、關係表示 scene/plan、計算（讀題幫手全對但答案錯）、檢查 check。計算失誤不算讀題失敗。
   題目的 meta（南一學期、單元、關係標籤）可以缺；缺的放「其他」，也不顯示破題問句。 */
const WP_ORDER = ['goal', 'roles', 'scene', 'plan']; // 幫手的順序：先確認目標，再找資料，再看關係；check 移到作答後
const WP_STAGE = { scene: '這題發生什麼事', goal: '最後要找什麼', roles: '數字各代表什麼', plan: '先求出什麼', check: '答案合不合理' };
const WP_NEXT = { scene: '先不看數字，說說看是誰在做什麼事。', goal: '再讀一次最後一句，找出要知道的是誰的什麼。', roles: '把每個數字和它後面的單位連起來，看它在說誰的什麼。', plan: '問自己：要回答最後一問，題目還沒直接告訴你的是什麼？', check: '把答案放回題目裡，從頭讀一次，看看說不說得通。' };
const WP_LAYER = { goal: '目標理解', roles: '資料選取', rel: '關係表示', calc: '計算', check: '檢查' };
const WP_LAYER_ORDER = ['goal', 'roles', 'rel', 'calc', 'check'];
const wpLayerOf = s => (s === 'scene' || s === 'plan' ? 'rel' : s);
const WP_RES = { self: '自己完成', hinted: '經提示完成', need: '仍需協助' };
const wpSay = t => { if (typeof say === 'function') say(String(t).replace(/<[^>]+>/g, '')); }; // 只有一年級有朗讀
const wpList = () => (window.QUIZ && Array.isArray(QUIZ.wp) && QUIZ.wp.length ? QUIZ.wp : null);
const wpAll = () => (S.wp && typeof S.wp === 'object' ? S.wp : (S.wp = {})); // 舊存檔沒有 S.wp
const wpRec = id => wpAll()[id];
function wpPut(id, patch) { const all = wpAll(); all[id] = Object.assign({}, all[id] || {}, patch); save(); return all[id]; }
/* 三種紀錄。舊紀錄（selfEver/doneEver/shown）也換算得出來 */
function wpResult(r) {
  if (!r) return '';
  const base = r.base || (r.shown ? 'need' : r.self || r.selfEver ? 'self' : r.doneEver ? 'hinted' : 'need');
  return base === 'need' || r.tfPass === false ? 'need' : base;
}
function wpStatus(r) { return r ? WP_RES[wpResult(r)] : '還沒做'; }
/* 列表上的補充說明：換情境有沒有過、卡在哪幾層 */
function wpNote(r) {
  if (!r) return '';
  const a = [], L = WP_LAYER_ORDER.filter(k => (r.layers || []).includes(k));
  if (r.tfPass) a.push('換情境也會');
  if (L.length) a.push(`卡在：${L.map(k => WP_LAYER[k]).join('、')}`);
  return a.length ? `<small class="wp-lay">${a.join('；')}</small>` : '';
}
const wpBrief = s => { const c = [...String(s).replace(/\s+/g, ' ').trim()]; return c.length > 18 ? c.slice(0, 17).join('') + '⋯' : c.join(''); };
const wpAnsText = a => a.t === 'num' ? `${a.a} ${a.unit || ''}`.trim() : a.a.map(n => a.o[n]).join('、');
/* 破題問句：題目 meta.relation_tags 的第一個標籤，對到索引 types[].student_prompt（build 時嵌進 QUIZ.wp_types）；一次只給一句 */
function wpCue(q) {
  const tags = q.meta && q.meta.relation_tags, T = (window.QUIZ && QUIZ.wp_types) || {};
  if (!Array.isArray(tags) || !tags.length) return '';
  const m = String(tags[0]).match(/[A-Z]\d+/);
  return (m && T[m[0]]) || '';
}
/* 依南一學期、單元分組；沒有 meta 的放「其他」 */
function wpGroups(L) {
  const U = (window.QUIZ && QUIZ.wp_units) || {}, G = new Map();
  const semOf = s => (/上/.test(s || '') ? '上' : /下/.test(s || '') ? '下' : '');
  L.forEach((q, i) => {
    const m = q.meta || {}, u = Array.isArray(m.nanyi_units) && m.nanyi_units.length ? String(m.nanyi_units[0]) : '';
    const p = u.match(/^\s*(\d+)\s*([上下])\s*[-－–、]?\s*(\d+)\s*(.*)$/);
    let key, name, ord;
    if (p) {
      const sem = p[2], n = +p[3]; key = `${+p[1]}${sem}-${n}`;
      name = `${sem}學期 第 ${n} 單元　${(U[key] || p[4] || '').replace(/^[\s・:：]+/, '')}`.trim(); ord = (sem === '上' ? 0 : 1000) + n;
    } else if (u) { const sem = semOf(m.semester); key = 'u:' + u; name = u; ord = (sem === '上' ? 0 : sem === '下' ? 1000 : 2000) + 500; }
    else if (semOf(m.semester)) { const sem = semOf(m.semester); key = 's:' + sem; name = `${sem}學期　其他單元`; ord = (sem === '上' ? 0 : 1000) + 999; }
    else { key = 'other'; name = '其他'; ord = 9999; }
    if (!G.has(key)) G.set(key, { name, ord, items: [] });
    G.get(key).items.push(i);
  });
  return [...G.values()].sort((a, b) => a.ord - b.ord);
}
function wpEntry() {
  const L = wpList(); if (!L) return '';
  const done = L.filter(q => wpRec(q.id)).length;
  return `<div class="lessons wp-in"><button class="lesson" id="wpin"><span class="l-t"><b>應用題</b><small>${nums(`讀題驗收・${L.length} 題`)}</small></span><em class="sem">${nums(`${done} / ${L.length}`)}</em></button></div>`;
}
function viewWpList() {
  const L = wpList() || [];
  try { if (typeof cptQuizList !== 'undefined') cptQuizList = null; } catch (e) {} // 二年級的小故事按鈕不跟進來
  quizShell('應用題', viewQuizBooks, `<p class="tag">每一題都可以先自己試，也可以請幫手陪你讀題。</p>${wpGroups(L).map(g => `<h3 class="wp-gt"><span>${nums(esc(g.name))}</span><small>${nums(`${g.items.length} 題`)}</small></h3><div class="lessons">${g.items.map(i => `<button class="lesson wp-item" data-w="${i}"><span class="l-t"><b>${nums(`第 ${i + 1} 題`)}</b><small>${nums(esc(wpBrief(L[i].prompt)))}</small>${wpNote(wpRec(L[i].id))}</span><em class="sem wp-st">${wpStatus(wpRec(L[i].id))}</em></button>`).join('')}</div>`).join('')}`);
  document.querySelectorAll('[data-w]').forEach(x => x.onclick = () => runWp(+x.dataset.w));
}
/* 一到兩格答案，依序作答。h.wrong(格, 孩子答的, 是否多選) / h.right(格) / h.done() */
function wpAnswer(answers, h) {
  let k = 0;
  const box = document.getElementById('wpa');
  const show = () => {
    const a = answers[k];
    const head = `<div class="trail wp-lab" id="wplab">${answers.length > 1 ? nums(`第 ${k + 1} 格，共 ${answers.length} 格：`) : ''}${nums(esc(a.label))}${a.t === 'num' && a.unit ? `（${esc(a.unit)}）` : ''}${a.t === 'multi' ? '（可以選不只一個，選好按確定）' : ''}</div>`;
    if (a.t === 'num') {
      box.innerHTML = head + `<div id="pad">${keypadHtml()}</div>`;
      bindKeypad((v, clear) => { if (v === a.a) return ok(); clear(); h.wrong(k, `${v}${a.unit ? ' ' + a.unit : ''}`); });
    } else {
      box.innerHTML = head + `<div class="choices col wp-ch">${a.o.map((o, n) => `<button class="choice" data-c="${n}">${nums(esc(o))}</button>`).join('')}</div>${a.t === 'multi' ? '<div class="actions"><button class="btn" id="wpok">確定</button></div>' : ''}`;
      const cs = [...box.querySelectorAll('[data-c]')];
      if (a.t === 'pick') cs.forEach(c => c.onclick = () => { const n = +c.dataset.c; if (a.a.includes(n)) { c.classList.add('ok'); return ok(); } c.classList.add('no'); c.disabled = true; h.wrong(k, `「${a.o[n]}」`); });
      else {
        cs.forEach(c => c.onclick = () => c.classList.toggle('on'));
        document.getElementById('wpok').onclick = () => {
          const pick = cs.filter(c => c.classList.contains('on')).map(c => +c.dataset.c);
          if (!pick.length) { setMsg('先選選項，再按確定。', 'hint'); sfx.retry(); return; }
          if (pick.length === a.a.length && pick.every(n => a.a.includes(n))) return ok();
          h.wrong(k, pick.map(n => `「${a.o[n]}」`).join(''), true);
        };
      }
    }
    if (k > 0) wpSay(a.label);
  };
  const ok = () => { h.right(k); k++; if (k < answers.length) show(); else { box.innerHTML = ''; h.done(); } };
  show();
}
function runWp(i) {
  const L = wpList(), q = L[i];
  const steps = WP_ORDER.filter(s => q.steps && q.steps[s]), hints = q.hints || [], chk = q.steps && q.steps.check, cue = wpCue(q);
  const st = { hints: 0, hOpen: true, helper: false, gi: 0, picked: {}, miss: [], wrong: 0, calc: 0, chkMiss: false, ans: false, finished: false };
  const sayBtn = typeof say === 'function' ? '<button class="btn alt" id="wpsay" aria-label="再唸一次">🗣️</button>' : '';
  quizShell('應用題', viewWpList, `<div class="trail">${nums(`第 ${i + 1} 題，共 ${L.length} 題`)}</div>
    <div class="prompt" id="prompt">${nums(esc(q.prompt))}</div>${picHtml(q.pic)}
    <div class="wp-start" id="wps">${sayBtn}<button class="btn" id="wptry">我想先試試</button><button class="btn alt" id="wphelp">幫我讀題</button></div>
    <div class="wp-tools" id="wpt" hidden>${steps.length ? '<button class="btn alt" id="wpgb">幫我讀題</button>' : ''}${hints.length ? '<button class="btn alt" id="wphb">提示</button>' : ''}</div>
    <div class="wp-hints" id="wph" hidden></div>${cue ? `<div class="wp-cue" id="wpc" hidden>${nums(esc(cue))}</div>` : ''}<div class="wp-guide" id="wpg" hidden></div>
    <div class="msg" id="msg"></div><div id="wpa" hidden></div>`);
  const $g = document.getElementById('wpg'), $h = document.getElementById('wph'), $a = document.getElementById('wpa'), $c = document.getElementById('wpc');
  const gb = document.getElementById('wpgb'), hb = document.getElementById('wphb'), sb = document.getElementById('wpsay');
  const layersNow = () => {
    const s = new Set(st.miss.map(wpLayerOf));
    if (st.calc) s.add('calc');
    if (st.chkMiss) s.add('check');
    return WP_LAYER_ORDER.filter(k => s.has(k));
  };
  /* 提示：按一次給一層；整塊可以收起、再打開 */
  const drawHints = () => {
    $h.hidden = !st.hints;
    $h.innerHTML = `<div class="wp-gh"><b>${nums(`提示 ${st.hints} / ${hints.length}`)}</b><button class="wp-x" id="wphx">${st.hOpen ? '收起' : '打開'}</button></div>${st.hOpen ? `<ol>${hints.slice(0, st.hints).map(t => `<li>${nums(esc(t))}</li>`).join('')}</ol>` : ''}`;
    document.getElementById('wphx').onclick = () => { st.hOpen = !st.hOpen; drawHints(); };
    if (hb) { hb.textContent = st.hints < hints.length ? (st.hints ? '下一層提示' : '提示') : '提示都給了'; hb.disabled = st.hints >= hints.length; }
  };
  const moreHint = () => { if (st.hints >= hints.length) return; st.hints++; st.hOpen = true; drawHints(); wpSay(hints[st.hints - 1]); };
  if (hb) hb.onclick = moreHint;
  /* 讀題幫手：第一步一律是「最後要找什麼」；一次一個問題，選到合理的就前進；選錯說明並給下一步，可以改選 */
  const guideOpen = on => { $g.hidden = !on; if ($c) $c.hidden = !on; $a.hidden = on && st.gi < steps.length; if (gb) gb.classList.toggle('lit', on); };
  const guide = () => {
    st.helper = true; guideOpen(true); setMsg('');
    if (st.gi >= steps.length) {
      $g.innerHTML = `<div class="wp-gh"><b>讀題幫手：讀到的</b><button class="wp-x" id="wpgx">收起</button></div><ul class="wp-sum">${steps.map(s => `<li><small>${WP_STAGE[s]}</small>${nums(esc(q.steps[s].o[st.picked[s]]))}</li>`).join('')}</ul>`;
      document.getElementById('wpgx').onclick = () => guideOpen(false);
      return;
    }
    const s = steps[st.gi], c = q.steps[s];
    $g.innerHTML = `<div class="wp-gh"><b>讀題幫手</b><span class="wp-dots">${steps.map((x, j) => `<i class="${j < st.gi ? 'd' : j === st.gi ? 'now' : ''}"></i>`).join('')}</span></div>
      <div class="wp-sq" id="wpsq"><small>${nums(`第 ${st.gi + 1} 步，共 ${steps.length} 步：${WP_STAGE[s]}`)}</small>${nums(esc(c.q))}</div>
      <div class="choices col">${c.o.map((o, n) => `<button class="choice" data-g="${n}">${nums(esc(o))}</button>`).join('')}</div>
      <div class="actions" id="wpga"><button class="btn alt" id="wpgx">先作答</button></div>`;
    wpSay((st.gi === 0 && cue ? cue + '。' : '') + c.q + '。' + c.o.join('。'));
    document.getElementById('wpgx').onclick = () => { guideOpen(false); $a.hidden = false; };
    $g.querySelectorAll('[data-g]').forEach(b => b.onclick = () => {
      const n = +b.dataset.g;
      if (!c.a.includes(n)) {
        if (!st.miss.includes(s)) st.miss.push(s);
        b.classList.add('no'); b.disabled = true; sfx.retry();
        setMsg(`${nums(esc(c.why))}<br>下一步：${nums(esc(c.hint || WP_NEXT[s]))}`, 'hint');
        reveal('#msg'); return;
      }
      st.picked[s] = n; sfx.ok();
      $g.querySelectorAll('[data-g]').forEach(x => { x.disabled = true; });
      b.classList.add('ok');
      setMsg(`對。${nums(esc(c.why))}`, 'good');
      const last = st.gi + 1 >= steps.length;
      document.getElementById('wpga').innerHTML = `<button class="btn" id="wpgn">${last ? '去作答' : '下一步'}</button>`;
      document.getElementById('wpgn').onclick = () => {
        st.gi++; guide();
        if (last) { $a.hidden = false; setMsg('讀題幫手走完了。照著讀到的，在答案格作答。', 'good'); reveal('#wpa'); }
      };
      reveal('#wpga');
    });
    reveal('#wpg');
  };
  /* 開始：兩個並列按鈕擇一；之後工具列留「幫我讀題」「提示」 */
  const begin = help => {
    const s0 = document.getElementById('wps'), t = document.getElementById('wpt');
    if (sb) t.insertBefore(sb, t.firstChild);
    s0.remove(); t.hidden = !t.children.length;
    if (!st.ans) { st.ans = true; wpAnswer(q.answers, H); }
    if (help && steps.length) guide();
    else if (help) { $a.hidden = false; moreHint(); }
    else { $a.hidden = false; wpSay(q.answers[0].label); reveal('#wpa'); }
  };
  document.getElementById('wptry').onclick = () => begin(false);
  document.getElementById('wphelp').onclick = () => begin(true);
  if (gb) gb.onclick = () => { if (!$g.hidden) { guideOpen(false); $a.hidden = false; } else guide(); };
  if (sb) sb.onclick = () => wpSay(!$g.hidden && st.gi < steps.length ? plainText(document.getElementById('wpsq')) : plainText(document.getElementById('prompt')) + '。' + q.answers.map(a => a.label).join('。'));
  const save1 = patch => wpPut(q.id, Object.assign({ layers: layersNow(), hints: st.hints, helper: st.helper, miss: st.miss, wrong: st.wrong, calc: st.calc, t: Date.now() }, patch));
  /* 作答後：完整解析 → 把答案放回題目檢查 → 遷移題 */
  const finishView = (lead, cls) => {
    st.finished = true;
    const t = document.getElementById('wpt'); if (t) { t.querySelectorAll('#wpgb, #wphb').forEach(x => x.remove()); t.hidden = !t.children.length; }
    guideOpen(false); $a.hidden = false; if (st.hints) { st.hOpen = false; drawHints(); }
    setMsg(`${lead}${q.explain ? nums(esc(q.explain)) : ''}<div class="wp-think">怎麼想的：${nums(esc(q.think))}</div>`, cls);
    const tf = q.transfer && q.transfer.prompt;
    const tail = () => {
      const e = document.getElementById('wpend');
      e.innerHTML = `${tf ? '<p class="tag wp-tip">換一個情境，看看同一個做法還用得上嗎。</p>' : ''}<div class="actions">${tf ? '<button class="btn" id="wptf">試一題</button>' : ''}<button class="btn alt" id="wpbk">回題目列表</button></div>`;
      if (tf) document.getElementById('wptf').onclick = () => runWpTransfer(i);
      document.getElementById('wpbk').onclick = viewWpList;
      reveal('#wpend');
    };
    $a.innerHTML = `<div class="wp-check" id="wpk"><b>把答案放回題目檢查</b>${chk ? `<div class="wp-sq" id="wpkq">${nums(esc(chk.q))}</div><div class="choices col">${chk.o.map((o, n) => `<button class="choice" data-wk="${n}">${nums(esc(o))}</button>`).join('')}</div><div class="wp-km" id="wpkm"></div>` : `<div class="wp-sq" id="wpkq">${nums(esc(WP_NEXT.check))}</div>`}</div><div id="wpend"></div>`;
    if (!chk) { wpSay('把答案放回題目檢查。' + WP_NEXT.check); return tail(); }
    wpSay('把答案放回題目檢查。' + chk.q + '。' + chk.o.join('。'));
    $a.querySelectorAll("[data-wk]").forEach(b => b.onclick = () => {
      const n = +b.dataset.wk, km = document.getElementById('wpkm');
      if (!chk.a.includes(n)) {
        b.classList.add('no'); b.disabled = true; sfx.retry();
        if (!st.chkMiss) { st.chkMiss = true; wpPut(q.id, { layers: layersNow() }); }
        km.className = 'wp-km hint'; km.innerHTML = `${nums(esc(chk.why))}<br>下一步：${nums(esc(chk.hint || WP_NEXT.check))}`;
        return;
      }
      sfx.ok(); b.classList.add('ok'); $a.querySelectorAll("[data-wk]").forEach(x => { x.disabled = true; });
      km.className = 'wp-km good'; km.innerHTML = `對。${nums(esc(chk.why))}`;
      tail();
    });
    reveal('#wpk');
  };
  /* 看做法：試了三次還沒對，可以直接看說明；記為「仍需協助」 */
  const showWay = () => {
    const old = wpRec(q.id) || {};
    save1({ base: 'need', shown: true, tfPass: undefined, n: (old.n || 0) + 1 });
    finishView(`答案：${q.answers.map(a => nums(esc(wpAnsText(a)))).join('；')}。`, 'hint');
  };
  const H = {
    wrong: (k, said, multi) => {
      st.wrong++; sfx.retry();
      const a = q.answers[k], readOk = steps.length && st.gi >= steps.length && !st.miss.length; // 幫手全對才可能歸到計算
      if (readOk) st.calc++;
      let next = multi ? '有該選的沒選，或多選了。一個一個選項回到題目裡對照。' : `${esc(said)} 和答案不一樣。`;
      if (readOk) next += '讀題的每一步都選對了，這次多半是計算時算錯了。把每一步算出的數和它代表的量寫下來，再算一次。';
      else if (steps.length && st.gi < steps.length) next += '可以按「幫我讀題」，一步一步把題目讀清楚。';
      else if (st.hints < hints.length) next += '按「提示」，看下一層。';
      else next += '照著提示的示範，把下一段接著做完。';
      setMsg(nums(next) + (st.wrong >= 3 ? '<div class="actions"><button class="btn alt" id="wpway">看做法</button></div>' : ''), 'hint');
      if (gb && st.gi < steps.length) gb.classList.add('lit');
      const w = document.getElementById('wpway'); if (w) w.onclick = showWay;
    },
    right: k => { if (k + 1 < q.answers.length) { sfx.ok(); setMsg(nums(`對，${esc(q.answers[k].label)}是 ${esc(wpAnsText(q.answers[k]))}。接著回答下一格。`), 'good'); } },
    done: () => {
      const base = st.helper || st.hints ? 'hinted' : 'self', old = wpRec(q.id) || {};
      save1({ base, shown: false, tfPass: undefined, self: base === 'self', selfEver: !!(old.selfEver || base === 'self'), doneEver: true, n: (old.n || 0) + 1 });
      if (base === 'self' && !st.wrong) sfx.good(); else sfx.ok();
      finishView('對。', 'good');
    },
  };
}
/* 換情境的題目：沒有幫手和提示，看做法能不能帶過去。看了答案、或靠多次嘗試才答對，記為沒過 */
function runWpTransfer(i) {
  const q = wpList()[i], tq = q.transfer, ans = tq.answers || [];
  let wrong = 0;
  quizShell('應用題：換情境', viewWpList, `<div class="trail">${nums(`第 ${i + 1} 題的換情境題`)}</div>
    <div class="prompt" id="prompt">${nums(esc(tq.prompt))}</div>${picHtml(tq.pic)}
    <div class="msg" id="msg"></div><div id="wpa"></div>`);
  const end = (ok, lead) => {
    if (ans.length) wpPut(q.id, { tfPass: ok, tf: ok, tfEver: !!((wpRec(q.id) || {}).tfEver || ok), tfWrong: wrong });
    setMsg(lead + (tq.explain ? nums(esc(tq.explain)) : ''), ok ? 'good' : 'hint');
    document.getElementById('wpa').innerHTML = `<div class="actions">${i + 1 < wpList().length ? '<button class="btn" id="wpnx">下一題</button>' : ''}<button class="btn alt" id="wpbk">回題目列表</button></div>`;
    const nx = document.getElementById('wpnx'); if (nx) nx.onclick = () => runWp(i + 1);
    document.getElementById('wpbk').onclick = viewWpList;
    reveal('#wpa');
  };
  if (!ans.length) return end(false, '');
  const NEXT = ['回到這題的最後一句：要找的是什麼？', '要回答它，還缺哪個量？先把那個量求出來。', '把答案放回題目裡讀一次，數量對得起來嗎？'];
  wpAnswer(ans, {
    wrong: (k, said, multi) => {
      wrong++; sfx.retry();
      const w = multi ? '有該選的沒選，或多選了。' : `${esc(said)} 和答案不一樣。`;
      setMsg(nums(w + NEXT[Math.min(wrong, 3) - 1]) + (wrong >= 3 ? '<div class="actions"><button class="btn alt" id="wpway">看答案</button></div>' : ''), 'hint');
      const b = document.getElementById('wpway'); if (b) b.onclick = () => { document.getElementById('wpa').innerHTML = ''; end(false, `答案：${ans.map(a => nums(esc(wpAnsText(a)))).join('；')}。這題先記為「仍需協助」，之後可以再做一次。`); };
    },
    right: k => { if (k + 1 < ans.length) { sfx.ok(); setMsg(nums(`對，${esc(ans[k].label)}是 ${esc(wpAnsText(ans[k]))}。接著回答下一格。`), 'good'); } },
    done: () => {
      // 選擇題可以靠刪去法選到，所以答錯過就不算過；數字題容許一次算錯（計算失誤不當成讀題失敗）
      const pass = wrong <= (ans.some(a => a.t !== 'num') ? 0 : 1);
      if (!wrong) sfx.good(); else sfx.ok();
      end(pass, pass ? '對。換了情境，一樣先找出最後要問的是什麼，再用題目給的數字求出來。' : '對。這題試了幾次才找到，先記為「仍需協助」，之後可以再做一次。');
    },
  });
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
    <div class="title-top"><p class="kicker">目標：100 萬公里航線</p><h1 class="logo">數感銀河站</h1></div>
    ${artImg('liang_cheer', 'title-hero')}
    <div class="title-bottom">
      <button class="btn big" id="start">${S.opened ? '繼續冒險' : '開始冒險'}</button>
      <p class="title-note">${S.opened ? `站長，航線已經 ${fmt(Math.min(S.stars, ROUTE))} 公里` : '銀河需要一位太空站站長'}</p>
    </div></div>`;
  document.getElementById('start').onclick = () => {
    document.body.classList.remove('in-cine');
    beep([[523, 0], [784, .12]]);
    viewHome();
  };
}
function viewCert() { // 數感畢業證書
  window.scrollTo(0, 0);
  const d = new Date(), date = `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="home" aria-label="回地圖">⌂</button><h2 class="page-h">畢業證書</h2></div>
    <div class="cert6"><div class="cert6-in"><p class="cert-h">數感畢業證書</p>
    <p class="cert-b">這一位站長，從數到一萬的小鎮出發，一路走到銀河站。遇到難題時，先動手拆開來看，看懂了才寫算式。</p>
    <p class="cert-b">質因數、分數小數、比例、數量關係，都已經做好準備，可以放心升上國中。</p>
    <p class="cert-s">特頒此證，恭喜小學畢業。</p><div class="cert-who">${artImg('liang_cheer', 'cert-a')}${artImg('wanwan', 'cert-a')}${artImg('mimi_happy', 'cert-a')}</div><p class="cert-d">數感小鎮全體居民　敬贈<br>${date}</p></div></div>
    <div class="actions"><button class="btn" id="back2">回地圖</button></div>`;
  document.getElementById('home').onclick = viewHome;
  document.getElementById('back2').onclick = viewHome;
}
function viewHome() { // 地圖：六上八區 → 太空站啟用 → 六下六區 → 畢業
  window.scrollTo(0, 0);
  if (!S.opened) { S.opened = true; save(); return comic(OPENING.bg, OPENING.lines, viewHome, { skip: true, last: '出發！' }); }
  if (S.bossDone && !S.s2Seen) { S.s2Seen = true; save(); return comic(SEASON2.bg, SEASON2.lines, viewHome); }
  const all = Object.keys(GAMES), keys = availKeys();
  const saved = k => (S.prog[k] || 0) >= ROUNDS_TO_SAVE;
  const grad = all.every(saved) && S.bossDone;
  if (grad && !S.grandSeen) { S.grandSeen = true; S.stars = Math.max(S.stars, ROUTE); save(); return comic(GRAND.bg, GRAND.lines, viewCert, { last: '領畢業證書' }); }
  const allSaved = PIECE_KEYS.every(saved), nSaved = keys.filter(saved).length, nPieces = PIECE_KEYS.filter(saved).length;
  const bossNow = allSaved && !S.bossDone;
  const nextKey = bossNow ? null : keys.find(k => !saved(k) && S.prog[k]) || keys.find(k => !saved(k));
  const line = S.bossDone && !nextKey ? '航線全部開通了！恭喜站長畢業。' : S.bossDone ? `開通航線，下一站：${STORY[nextKey].place}！` : bossNow ? '八個站區都蓋好了，準備啟用！' : nSaved === 0 && !S.prog[nextKey] ? `站長，先去${STORY[nextKey].place}！` : `下一站：${STORY[nextKey].place}，${STORY[nextKey].mission}！`;
  const list = [...PIECE_KEYS, 'boss', ...all.filter(k => !PIECE_KEYS.includes(k))];
  const ROW = 150, rows = list.length, pts = [];
  for (let i = 0; i < rows; i++) pts.push([i % 2 ? 70 : 30, ROW * i + 70]);
  const pathD = pts.map((q, i) => i === 0 ? `M${q[0]} ${q[1]}` : `C${pts[i - 1][0]} ${q[1] - 70} ${q[0]} ${pts[i - 1][1] + 70} ${q[0]} ${q[1]}`).join('');
  const stop = (k, i) => {
    if (k === 'boss') return `<button class="stop ${i % 2 ? 'right' : 'left'} cave ${bossNow ? 'now' : ''}" data-g="boss" ${allSaved ? '' : 'disabled'} style="top:${ROW * i}px">
        <span class="medal" style="${bgStyle(BOSS.bg)}"><span class="fog ${S.bossDone ? 'f3' : allSaved ? 'f1' : 'f0'}"></span>${allSaved ? artImg('wanwan', 'medal-who') : '<span class="lock">？</span>'}</span>
        <span class="plate"><b>${S.bossDone ? '再檢查一次' : '太空站啟用'}</b><small>${allSaved ? (S.bossDone ? '複習六上' : '最後檢查') : `先蓋好六上站區（${nPieces}/8）`}</small></span></button>`;
    const st = STORY[k], g = GAMES[k];
    const pr = Math.min(S.prog[k] || 0, ROUNDS_TO_SAVE), done = pr >= ROUNDS_TO_SAVE, now = k === nextKey && !done;
    const pips = Array.from({ length: ROUNDS_TO_SAVE }, (_, n) => `<i class="${n < pr ? 'on' : ''}"></i>`).join('');
    return `<button class="stop ${i % 2 ? 'right' : 'left'} ${done ? 'done' : ''} ${now ? 'now' : ''}" data-g="${k}" style="top:${ROW * i}px">
      <span class="medal" style="${bgStyle(st.bg)}"><span class="fog f${pr}"></span>${artImg(st.who, 'medal-who')}${done ? '<span class="badge">✓</span>' : ''}</span>
      <span class="plate"><b>${g.name}</b><em class="sem">${g.sem}</em><span class="lvl">${pips}</span></span>
      ${now ? artImg('liang', 'guide') : ''}
    </button>`;
  };
  $app.innerHTML = `
    <div class="map-bg"><div class="m1" style="${bgStyle('sky_dark')}"></div><div class="m2" style="${bgStyle('sky_bright')};opacity:${S.bossDone ? 1 : nSaved / keys.length * .85}"></div><div class="shade"></div></div>
    <header class="map-head">
      <div class="map-title"><h1 class="logo small">數感銀河站</h1><div class="star-count">🚀 ${N(fmt(Math.min(S.stars, ROUTE)))}<small>／${fmt(ROUTE)} 公里</small></div></div>
      <div class="hero-say">${artImg(S.bossDone ? 'liang_cheer' : 'liang', 'hero-liang')}<span>${line}</span></div>
    </header>
    ${grad ? '<button class="lesson-entry" id="cert"><span>🎓</span><b>數感畢業證書</b><small>看看</small></button>' : ''}
    <button class="lesson-entry" id="lessons"><span>📏🚄🛢️</span><b>單位教室</b><small>${Object.keys(S.learned || {}).length} / ${Object.keys(LESSONS).length}</small></button>
    <button class="quiz-entry" id="quiz"><span>📝</span><b>單元測驗</b><small>基礎・進階・益智</small></button>
    <div class="map-trail" style="height:${ROW * rows + 8}px">
      <svg viewBox="0 0 100 ${ROW * rows}" preserveAspectRatio="none" aria-hidden="true"><path d="${pathD}" fill="none" stroke="#fff6e3" stroke-width="5" stroke-dasharray="3 11" stroke-linecap="round" vector-effect="non-scaling-stroke" opacity=".9"/></svg>
      ${list.map(stop).join('')}
    </div>
    <nav class="dock">
      <button id="daily" class="${S.stamps[today()] ? 'stamped' : 'hot'}"><b>${S.stamps[today()] ? '✔' : '★'}</b>今日任務<small>${Object.keys(S.stamps).length} 個章</small></button>
      <button id="clues"><b>🛰️</b>站區航線<small>${nSaved} / ${keys.length}</small></button>
      <button id="practice"><b>✏️</b>練習場<small>自己選</small></button>
    </nav>`;
  document.querySelectorAll('[data-g]').forEach(b => b.onclick = () => enter(b.dataset.g));
  document.getElementById('daily').onclick = () => startRound('daily');
  document.getElementById('practice').onclick = viewPractice;
  document.getElementById('clues').onclick = viewClues;
  document.getElementById('lessons').onclick = viewLessons;
  document.getElementById('quiz').onclick = viewQuizBooks;
  if (grad) document.getElementById('cert').onclick = viewCert;
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
    <h2>單元</h2><p>六上、六下所有單元都已開放，孩子可以自由選站區。每個站區和每一題都有標示是六上或六下。</p>
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
    if (confirm('確定清除所有星星和紀錄？')) { S.stars = 0; S.rec = {}; S.log = []; S.prog = {}; S.opened = false; S.bossDone = false; S.bossSeen = false; S.s2Seen = false; S.stamps = {}; S.fast = {}; S.seenC = {}; S.cst = {}; S.quiz = {}; S.grandSeen = false; S.learned = {}; save(); viewParent(); }
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
    if (sessionStorage.getItem('shugan6-updated-to') === latest) return; // 避免快取沒更新時一直重載
    sessionStorage.setItem('shugan6-updated-to', latest);
    location.replace(location.pathname + '?v=' + latest + location.hash);
  } catch (e) {}
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(); });
checkUpdate();
preloadArt().then(route);
