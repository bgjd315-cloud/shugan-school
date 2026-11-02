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
  pie: { name: '民意觀測站', tip: '圓形圖、可能性', sem: '六下', need: 0 },
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
function semOf(q) { // 每題標六上或六下
  return q ? GAMES[q.kind].sem : '';
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
  return [["prime", 0, "排地磚：質數和合數", 1], ["prime", 1, "拆零件：質因數分解", 1], ["prime", 2, "2、5 的倍數", 1], ["prime", 3, "3 的倍數", 1], ["prime", 4, "短除法：最大公因數", 1], ["prime", 5, "短除法：最小公倍數", 1], ["prime", 6, "最簡分數", 1], ["prime", 7, "互質", 1], ["fdiv", 0, "整數除以幾分之一", 1], ["fdiv", 1, "整數除以分數", 1], ["fdiv", 2, "同分母相除", 1], ["fdiv", 3, "切細再相除", 1], ["fdiv", 4, "商是分數", 1], ["fdiv", 5, "乘以倒數", 1], ["fdiv", 6, "除完變大還是變小", 1], ["ddiv", 0, "剪緞帶：整數除以小數", 1], ["ddiv", 1, "小數點一起移", 1], ["ddiv", 2, "百格板：兩位小數", 1], ["ddiv", 3, "小數除法直式", 1], ["ddiv", 4, "商一定比較小嗎", 1], ["circle", 0, "滾一圈：圓周率", 1], ["circle", 1, "圓周長", 1], ["circle", 2, "滾幾圈", 1], ["circle", 3, "切拼：圓面積", 1], ["circle", 4, "半圓的周長", 1], ["circle", 5, "圓環", 1], ["ratio", 0, "一份一份加：比", 1], ["ratio", 1, "比值", 1], ["ratio", 2, "相等的比", 1], ["ratio", 3, "橫著的倍數", 1], ["ratio", 4, "最簡單整數比", 1], ["ratio", 5, "分數比、小數比", 1], ["ratio", 6, "按比分配", 1], ["ratio", 7, "濃度一樣嗎", 1], ["sector", 0, "幾分之幾圓", 1], ["sector", 1, "弧長", 1], ["sector", 2, "扇形面積", 1], ["sector", 3, "扇形周長", 1], ["sector", 4, "三個相等的比", 1], ["sector", 5, "生活中的扇形", 1], ["speed", 0, "時間一樣比距離", 1], ["speed", 1, "距離一樣比時間", 1], ["speed", 2, "求速率", 1], ["speed", 3, "距離和時間", 1], ["speed", 4, "時間幾倍距離幾倍", 1], ["speed", 5, "換單位", 1], ["speed", 6, "平均速率", 1], ["relation", 0, "和不變", 1], ["relation", 1, "差不變", 1], ["relation", 2, "每份量×份數", 1], ["relation", 3, "排列的規律", 1], ["relation", 4, "把關係寫成式子", 1], ["relation", 5, "天平：等量", 1], ["mix", 0, "先算哪一段", 11], ["mix", 1, "分數小數互通", 11], ["mix", 2, "乘除一起約分", 11], ["mix", 3, "兩步驟應用", 11], ["mix", 4, "用概數判斷", 11], ["mix", 5, "分配律", 11], ["prism", 0, "一層層疊", 11], ["prism", 1, "三角柱", 11], ["prism", 2, "圓柱", 11], ["prism", 3, "攤開圓柱", 11], ["prism", 4, "表面積", 11], ["prism", 5, "兩個形體", 11], ["base", 0, "誰當 1", 11], ["base", 1, "交換基準", 11], ["base", 2, "求比較量", 11], ["base", 3, "求基準量", 11], ["base", 4, "增加、減少", 11], ["scale", 0, "放大圖", 11], ["scale", 1, "什麼不變", 11], ["scale", 2, "真的放大嗎", 11], ["scale", 3, "縮圖", 11], ["scale", 4, "用尺量地圖", 11], ["scale", 5, "讀比例尺", 11], ["scale", 6, "分母越大圖越小", 11], ["scale", 7, "兩張地圖", 11], ["puzzle", 0, "雞兔同籠", 11], ["puzzle", 1, "和差問題", 11], ["puzzle", 2, "年齡問題", 11], ["puzzle", 3, "追趕問題", 11], ["puzzle", 4, "流水問題", 11], ["puzzle", 5, "搭配幾種", 11], ["puzzle", 6, "排奇數", 11], ["puzzle", 7, "二選一幾種", 11], ["pie", 0, "讀圓形圖", 11], ["pie", 1, "畫圓形圖", 11], ["pie", 2, "換成百分率", 11], ["pie", 3, "選哪種圖", 11], ["pie", 4, "可能性", 11]];
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
    frame(`${q.n} ${un}${q.ctx}，每${box} ${fracHtml(1, q.d)} ${un}，<br>可以${verb}幾${box}？一 ${un}一 ${un}${verb}。`, `<div id="bb"></div><div class="trail" id="ct">一條是 1 ${un}</div>${padHidden()}`);
    const draw = (cut, done) => { let h = ''; for (let i = 0; i < q.n; i++) h += barRow(cut ? q.d : 1, cut ? q.d : 1, j => i < done ? groupCol(1)(j) : '#dfe5ee'); setEl('bb', h); };
    draw(false, 0);
    return gate(q, [`每 1 ${un}切成 ${q.d} 份`, ...Array.from({ length: q.n }, (_, i) => `${verb}完第 ${i + 1} ${un}`)], q.n + 1, k => { draw(true, k - 1); setEl('ct', k === 1 ? `每一小份就是 1/${q.d} ${un}` : `${verb}了 ${(k - 1) * q.d} ${box}`); }, () => stepKeypad([`1 ${un}可以${verb}幾${box}？`, `${q.n} ${un}可以${verb}幾${box}？`], [q.d, q.ans], `看每一條切成幾份，再看有幾條。`, `對了！${q.n}÷1/${q.d}＝${q.ans} ${box}。1 裡面有 ${q.d} 個 1/${q.d}：每 ${un}${q.d} ${box}×${q.n} ${un}。`, 'whole'));
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
  frame(`${q.N} ${un}${q.ctx}，每${box} ${fracHtml(q.f[0], q.f[1])} ${un}。<br>拖黃鈕換別的數除，看商怎麼變。`, `<div id="bb"></div><div class="trail" id="ct"></div><div id="sl"></div>`);
  const draw = i => { const [a, n] = FS[i], r = q.N * n / a, W = q.N * 4; setEl('bb', `<svg class="g5" viewBox="0 0 320 60"><rect x="6" y="4" width="${300 * q.N / W}" height="22" fill="#f7dc8c" stroke="#33405a"/><rect x="6" y="34" width="${300 * r / W}" height="22" fill="${a < n ? '#f4a9a0' : '#3fae5a'}" stroke="#33405a"/></svg>`); setEl('ct', `${q.N}÷${n === 1 ? a : `${a}/${n}`}＝${r}`); };
  explore(q, { id: 'sl', lo: 0, hi: 5, need: 3, start: 3, show: FS.findIndex(f => f[0] === q.f[0] && f[1] === q.f[1]), draw, ask: () => pick6(['變大', '變小'], q.ans === '變大' ? 0 : 1, '看紅條和黃條：比 1 小的數切得細，切出來的個數多。', `對了！${q.N}÷${q.f[0]}/${q.f[1]}＝${q.R}。除以比 1 小的數，商會比被除數大；除不一定變小。`, 'bigger') });
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
    frame(`${e} ${q.ctx}的底面是直角三角形，兩邊 ${q.w} 公分、${q.d} 公分，高 ${q.h} 公分。<br>有多大？先看底面。`, `<div id="bb">${triStack(0, q.h, 0)}</div><div class="trail" id="ct">補成長方形比較好看</div>${padHidden()}`);
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
  tapN(q, '.lk', 3, el => { const d = data[+el.dataset.l]; el.querySelector('i').style.width = `${d[1] / q.tot * 100}%`; el.querySelector('em').textContent = `${d[1]} 次`; }, () => pick6(q.options, q.options.indexOf(q.right), '次數差很多，就看多的那一邊。', `對了！全部 ${q.tot} 次裡，${L.A} ${L.a} 次、${L.C} ${L.c} 次、${L.B} ${L.b} 次，資料差很多就能這樣說。`, 'likely'));
}
Object.assign(VIEWS, { mix: viewMix, prism: viewPrism, base: viewBase, scale: viewScale, puzzle: viewPuzzle, pie: viewPie });
/* ---------- 新概念小故事：情境提問 → 動手試幾次（還不出現新詞）→ 命名貼回操作 → 換情境用新詞答一題，答錯回操作 ---------- */
const C_tile = (n, w) => tilesSvg6(n, w);
const C_note = (n, w) => `<div class="trail">${n % w ? `每排 ${w} 個，剩 ${n % w} 個` : `每排 ${w} 個，${n / w} 排，剛剛好！`}</div>`;
const C_lad = (A, B, k) => { const rows = []; let x = A, y = B, p = 2, c = 0; while (c < k && p <= Math.min(x, y)) { if (x % p === 0 && y % p === 0) { rows.push([p, x, y]); x /= p; y /= p; c++; } else p++; } return ladderHtml(rows, x, y); };
const C_split = (n, k) => { const pf = Logic.primeFactors(n), got = pf.slice(0, k), rest = pf.slice(k).reduce((s, x) => s * x, 1); return partsHtml(got, rest); };
const C_bars = (A, B) => `<small>${A[0]}</small><div style="width:${A[2]}%">${barRow(A[1], A[1], '#f0a03c')}</div><small>${B[0]}</small><div style="width:${B[2]}%">${barRow(B[1], B[1], '#6ea8dc')}</div>`;
const C_cups = (c, a, b, k) => `<div class="rows6">${Array.from({ length: k }, () => `<div class="r6">${dots6(a, c.ca)}${dots6(b, c.cb)}</div>`).join('')}<div class="r6c">${cupHtml(c, a, b)}</div></div>`;
const C_R = { ca: '#e0455a', cb: '#3b82c4' }, C_H = { ca: '#e0a020', cb: '#9fd3f0' };
const C_sec = (d, o) => sectorSvg6(d, { h: 170, knob: true, ...o });
const C_tb = (rows) => `<table class="tb6">${rows.map(r => `<tr>${r.map(x => `<td class="num">${x}</td>`).join('')}</tr>`).join('')}</table>`;
const CONCEPTS = {
  prime: { game: 'prime', sem: '六上', who: 'octopus', word: '質數', hide: ['質數', '合數', '因數'],
    intro: '倉庫的地磚要排成整齊的長方形。12 塊一下就排好了，13 塊卻怎麼排都不對。為什麼？',
    tries: [
      { say: '12 塊：拖黃鈕，試到每排 3 塊。', lo: 2, hi: 11, start: 2, target: 3, draw: w => C_tile(12, w) + C_note(12, w), find: '12 塊可以排成 3×4，還有 2×6。' },
      { say: '13 塊：拖到每排 5 塊，看看。', lo: 2, hi: 12, start: 2, target: 5, draw: w => C_tile(13, w) + C_note(13, w), find: '有剩！你可以再想想，2 到 12 每種都會剩。' },
      { say: '7 塊：拖到每排 3 塊。', lo: 2, hi: 6, start: 2, target: 3, draw: w => C_tile(7, w) + C_note(7, w), find: '也有剩。7 塊和 13 塊一樣，只能排一長條。' },
    ],
    back: '13、7 只能排一長條，12 排得成長方形。它們有名字了。', name: '只能排一長條的數，除了 1 和自己沒有別的因數，叫<b>質數</b>。12 這種排得成長方形的，叫<b>合數</b>。', pic: () => C_tile(13, 5),
    q: { t: '換成電池：11 顆電池想排成長方形，只能排一長條。11 是什麼數？', o: ['質數', '合數'], a: 0, ok: '對了！11 除了 1 和 11，沒有別的因數。' } },
  pfac: { game: 'prime', sem: '六上', who: 'octopus', word: '質因數分解', hide: ['質因數'],
    intro: '機器人的 30 號零件組太大了，想拆成最小、再也拆不開的零件。會拆出什麼？',
    tries: [
      { say: '拖黃鈕，把 30 一個一個拆開。', lo: 0, hi: 3, start: 0, target: 3, draw: k => C_split(30, k), find: '30＝2×3×5，每一個都不能再拆。' },
      { say: '換 12。一個一個拆開。', lo: 0, hi: 3, start: 0, target: 3, draw: k => C_split(12, k), find: '12＝2×2×3，同樣的零件可以出現兩次。' },
    ],
    back: '剛才拆出來的 2、3、5 都是只能排一長條的數。', name: '拆出來的質數叫<b>質因數</b>。把一個數拆成質因數相乘，叫<b>質因數分解</b>。', pic: () => C_split(30, 3),
    q: { t: '換成望遠鏡的 18 號零件組。哪一個是 18 的質因數分解？', o: ['18＝2×3×3', '18＝2×9', '18＝3×6'], a: 0, ok: '對了！每個都是質數才算拆完。' } },
  short: { game: 'prime', sem: '六上', who: 'octopus', word: '短除法', hide: ['短除', '公因數', '公倍數'],
    intro: '紅零件 12 個、藍零件 18 個，要分裝成一樣的盒子，都不能剩。最多幾盒？一個一個試太慢了。',
    tries: [
      { say: '兩堆一起拿出共同的質數。拖黃鈕往下拿。', lo: 0, hi: 2, start: 0, target: 2, draw: k => C_lad(12, 18, k), find: '拿出 2 和 3，剩下 2 和 3，再也沒有共同的。2×3＝6 盒。' },
      { say: '換 24 和 36。', lo: 0, hi: 4, start: 0, target: 3, draw: k => C_lad(24, 36, k), find: '拿出 2、2、3，乘起來 12。' },
    ],
    back: '剛才直直往下除的寫法，好短好省事。', name: '這個寫法叫<b>短除法</b>。左邊乘起來是最大公因數；左邊和最下面全部乘起來，是最小公倍數。', pic: () => C_lad(12, 18, 2),
    q: { t: '換成兩班接駁船：短除法算到左邊 2、3，下面 2、3。最大公因數是多少？', o: ['6', '36', '5'], a: 0, ok: '對了！左邊 2×3＝6。下面再乘進去，2×3×2×3＝36 是最小公倍數。' } },
  coprime: { game: 'prime', sem: '六上', who: 'octopus', word: '互質', hide: ['互質'],
    intro: '8 根巧克力棒和 15 根花生棒，想平分給 2 人以上，每人都一樣，都不能剩。分得成嗎？',
    tries: [
      { say: '拖黃鈕，試著平分給 2 人，再到 3 人。', lo: 1, hi: 8, start: 1, target: 3, draw: p => C_tb([['人數', p], ['8 根', 8 % p ? '剩' : '可以'], ['15 根', 15 % p ? '剩' : '可以']]), find: '2 人時 15 會剩，3 人時 8 會剩。' },
      { say: '再試到 5 人。', lo: 1, hi: 8, start: 3, target: 5, draw: p => C_tb([['人數', p], ['8 根', 8 % p ? '剩' : '可以'], ['15 根', 15 % p ? '剩' : '可以']]), find: '還是不行。除了 1 人，都分不成。' },
    ],
    back: '8 和 15 共同的因數只有 1。', name: '兩個數的公因數只有 1，這兩個數<b>互質</b>。', pic: () => C_tb([['人數', 1], ['8 根', '可以'], ['15 根', '可以']]),
    q: { t: '換成地磚：9 塊和 14 塊，公因數只有 1。這兩個數怎麼樣？', o: ['互質', '不互質'], a: 0, ok: '對了！9 和 14 互質。' } },
  simplest: { game: 'prime', sem: '六上', who: 'octopus', word: '最簡分數', hide: ['最簡'],
    intro: '30 公升燃料用掉 12 公升，是 12/30。還可以說得更簡單嗎？',
    tries: [{ say: '上下一起拿出共同的質數。拖黃鈕。', lo: 0, hi: 2, start: 0, target: 2, draw: k => C_lad(12, 30, k), find: '12/30 變成 2/5，再也約不下去。' }, { say: '換 16/24。', lo: 0, hi: 3, start: 0, target: 3, draw: k => C_lad(16, 24, k), find: '16/24 變成 2/3。' }],
    back: '分子分母已經互質，不能再約了。', name: '分子分母互質的分數，叫<b>最簡分數</b>。', pic: () => C_lad(12, 30, 2),
    q: { t: '換成零件：40 個零件有 16 個檢查過。16/40 的最簡分數是？', o: ['2/5', '4/10', '8/20'], a: 0, ok: '對了！2 和 5 互質。' } },
  fdivm: { game: 'fdiv', sem: '六上', who: 'otter', word: '除以分數', hide: ['除以分數', '÷'],
    intro: '有 2 公升能量液，每瓶只裝 1/4 公升，可以裝幾瓶？一瓶還不到 1 公升，要怎麼想？',
    tries: [
      { say: '每 1 公升切成 4 份。拖黃鈕裝瓶。', lo: 0, hi: 8, start: 0, target: 8, draw: k => barRow(4, 4, i => i < k ? groupCol(1)(i) : '#dfe5ee') + barRow(4, 4, i => i + 4 < k ? groupCol(1)(i) : '#dfe5ee') + `<div class="trail">裝了 ${k} 瓶</div>`, find: '2 公升裡有 8 個 1/4 公升。' },
      { say: '換緞帶：3 公尺，每段 1/2 公尺。', lo: 0, hi: 6, start: 0, target: 6, draw: k => [0, 1, 2].map(r => barRow(2, 2, i => r * 2 + i < k ? groupCol(1)(i) : '#dfe5ee')).join('') + `<div class="trail">剪了 ${k} 段</div>`, find: '3 公尺裡有 6 個 1/2 公尺。' },
    ],
    back: '剛才都在問：「裡面有幾個那麼多？」', name: '問「2 裡面有幾個 1/4」，就寫成 2÷1/4，這就是<b>除以分數</b>。', pic: () => barRow(4, 4, groupCol(1)) + barRow(4, 4, groupCol(1)),
    q: { t: '換成麵粉：3 公斤，每袋 1/5 公斤，可以裝幾袋？要用哪個算式？', o: ['3÷1/5', '3×1/5', '1/5÷3'], a: 0, ok: '對了！問 3 裡面有幾個 1/5，3÷1/5＝15 袋。' } },
  reciprocal: { game: 'fdiv', sem: '六上', who: 'otter', word: '倒數', hide: ['倒數'],
    intro: '每瓶 2/3 公升，1 公升可以裝幾瓶？不是整數，怎麼說？',
    tries: [
      { say: '把 1 公升切成 3 份。拖黃鈕，每 2 份圈一瓶。', lo: 1, hi: 3, start: 1, target: 3, draw: k => barRow(k, k, k === 3 ? groupCol(2) : '#a9d0f0') + `<div class="trail">${k === 3 ? '圈了 1 瓶，再多半瓶，就是 3/2 瓶' : `切成 ${k} 份`}</div>`, find: '1 公升是 3/2 瓶。2/3 上下顛倒了！' },
      { say: '每段 3/4 公尺，1 公尺是幾段？拖到切成 4 份。', lo: 1, hi: 4, start: 1, target: 4, draw: k => barRow(k, k, k === 4 ? groupCol(3) : '#a9d0f0') + `<div class="trail">${k === 4 ? '每 3 份一段，1 公尺是 4/3 段' : `切成 ${k} 份`}</div>`, find: '1 公尺是 4/3 段，3/4 也顛倒了。' },
    ],
    back: '2/3 和 3/2，3/4 和 4/3，都是上下顛倒。', name: '上下顛倒的數叫<b>倒數</b>。除以一個分數，等於乘以它的倒數。', pic: () => barRow(3, 3, groupCol(2)),
    q: { t: '換成麵粉：每袋 2/5 公斤。除以 2/5，等於乘以多少？', o: ['5/2', '2/5', '1/5'], a: 0, ok: '對了！2/5 的倒數是 5/2。' } },
  decdiv: { game: 'ddiv', sem: '六上', who: 'crab', word: '除以小數', hide: ['除以小數', '÷'],
    intro: '3 公尺緞帶，每段 0.5 公尺，可以剪幾段？每段不到 1 公尺，段數會比 3 多還是少？',
    tries: [
      { say: '拖黃鈕，一段一段剪。', lo: 0, hi: 6, start: 0, target: 6, draw: k => barRow(6, 6, i => i < k ? groupCol(1)(i) : '#f7dc8c') + `<div class="trail">剪了 ${k} 段</div>`, find: '3 公尺裡有 6 個 0.5 公尺。' },
      { say: '換水管：2 公尺，每根 0.4 公尺。', lo: 0, hi: 5, start: 0, target: 5, draw: k => barRow(5, 5, i => i < k ? groupCol(1)(i) : '#f7dc8c') + `<div class="trail">鋸了 ${k} 根</div>`, find: '2 公尺裡有 5 個 0.4 公尺。' },
    ],
    back: '剛才也是問「裡面有幾個那麼多」。', name: '3 裡面有幾個 0.5，就寫成 3÷0.5，這就是<b>除以小數</b>。商可以比被除數大。', pic: () => barRow(6, 6, groupCol(1)),
    q: { t: '換成電線：4 公尺，每條 0.8 公尺。商會比 4 大還是小？', o: ['比 4 大', '比 4 小'], a: 0, ok: '對了！4÷0.8＝5。除數小於 1，商比被除數大。' } },
  pi: { game: 'circle', sem: '六上', who: 'fox', word: '圓周率', hide: ['圓周率', '3.14'],
    intro: '大輪子和小輪子，滾一圈各走多遠？和它的寬度（直徑）有什麼關係？',
    tries: [
      { say: '小輪子：拖黃鈕，滾完一圈。', lo: 0, hi: 4, start: 0, target: 4, draw: k => rollSvg(20, k / 4, 1, k === 4 ? 4 : 0), find: '滾完放直徑棒：3 條多一點。' },
      { say: '大輪子：也滾一圈。', lo: 0, hi: 4, start: 0, target: 4, draw: k => rollSvg(60, k / 4, 1, k === 4 ? 4 : 0), find: '也是 3 條多一點！大小不同，倍數一樣。' },
    ],
    back: '不管多大，滾一圈都是直徑的 3 倍多一點。', name: '這個固定的倍數叫<b>圓周率</b>，大約是 3.14。', pic: () => rollSvg(60, 1, 1, 4),
    q: { t: '換成呼拉圈：直徑 100 公分的呼拉圈，滾一圈大約是直徑的幾倍？這個倍數叫什麼？', o: ['圓周率，大約 3.14 倍', '半徑，大約 2 倍'], a: 0, ok: '對了！任何圓都一樣。' } },
  circ: { game: 'circle', sem: '六上', who: 'fox', word: '圓周長', hide: ['圓周長'],
    intro: '圓形水池要沿邊圍一圈欄杆。彎彎的，尺量不了。要買多長？',
    tries: [
      { say: '把圓沿著地滾一圈，紅線就是那一圈拉直。', lo: 0, hi: 4, start: 0, target: 4, draw: k => rollSvg(40, k / 4, 1, 0), find: '彎的邊變成直的了。' },
      { say: '換直徑 10 公分：滾一圈，用直徑棒量。', lo: 0, hi: 4, start: 0, target: 4, draw: k => rollSvg(10, k / 4, 1, k === 4 ? 3 : 0) + `<div class="trail">${k === 4 ? '10×3.14＝31.4 公分' : ''}</div>`, find: '一條直徑的長×3.14。' },
    ],
    back: '紅線的長，就是繞圓一圈的長。', name: '繞圓一圈的長叫<b>圓周長</b>。圓周長＝直徑×圓周率。', pic: () => rollSvg(40, 1, 1, 3),
    q: { t: '換成車輪：直徑 50 公分。圓周長怎麼算？', o: ['50×3.14', '50÷3.14', '50＋3.14'], a: 0, ok: '對了！50×3.14＝157 公分。' } },
  carea: { game: 'circle', sem: '六上', who: 'fox', word: '圓面積', hide: ['圓面積', '半徑×半徑'],
    intro: '圓形花圃要鋪草皮，圓的邊彎彎的，方格子數不準。有什麼好辦法？',
    tries: [
      { say: '切成很多片交錯排排看。拖黃鈕切細。', lo: 0, hi: 3, start: 0, target: 3, draw: i => cutCircleSvg([4, 8, 16, 32][i], 5), find: '切得越細，越像長方形！' },
      { say: '再拖一次，看長方形的長：上下各是一半的圓周。', lo: 0, hi: 3, start: 3, target: 1, draw: i => cutCircleSvg([4, 8, 16, 32][i], 5), find: '切得粗就彎彎的；長一直是半個圓周，寬一直是半徑。' },
    ],
    back: '長方形的長是半個圓周（半徑×3.14），寬是半徑。', name: '這片大小叫<b>圓面積</b>：半徑×3.14×半徑，也就是半徑×半徑×圓周率。', pic: () => cutCircleSvg(32, 5),
    q: { t: '換成圓桌：半徑 2 公尺。圓面積怎麼算？', o: ['2×2×3.14', '2×2×2', '2×3.14'], a: 0, ok: '對了！12.56 平方公尺。第三個只是半個圓周。' } },
  ratio: { game: 'ratio', sem: '六上', who: 'bee', word: '比', hide: ['叫比', '：', '讀作'],
    intro: '太空站要漆成同一種紫色。一桶是 3 匙紅、2 匙藍。要多做幾桶，顏色才不會變？',
    tries: [
      { say: '一份一份加，看顏色。拖黃鈕到 3 份。', lo: 1, hi: 4, start: 1, target: 3, draw: k => C_cups(C_R, 3, 2, k) + `<div class="trail">紅 ${3 * k} 匙、藍 ${2 * k} 匙，顏色沒變</div>`, find: '數量變多，顏色不變。' },
      { say: '換果汁，1 杯蜂蜜配 4 杯水，加到 2 份。', lo: 1, hi: 4, start: 1, target: 2, draw: k => C_cups(C_H, 1, 4, k) + `<div class="trail">蜂蜜 ${k} 杯、水 ${4 * k} 杯，味道沒變</div>`, find: '一樣，只要兩樣東西一起變。' },
    ],
    back: '不變的是「3 份對 2 份」這個關係。', name: '這種關係寫成 3：2，讀作 3 比 2，叫<b>比</b>。前面叫前項，後面叫後項。', pic: () => C_cups(C_R, 3, 2, 2),
    q: { t: '換成修補材料：沙 5 桶、水泥 2 桶。沙和水泥的比怎麼寫？', o: ['5：2', '2：5', '5＋2'], a: 0, ok: '對了！沙在前面，寫成 5：2。' } },
  rate: { game: 'ratio', sem: '六上', who: 'bee', word: '比值', hide: ['比值'],
    intro: '甲配方 3：4，乙配方 6：8。寫法不一樣，要怎麼用一個數說出它們的關係？',
    tries: [
      { say: '把後項當 1，切成 4 份，再量前項。拖黃鈕。', lo: 1, hi: 4, start: 1, target: 4, draw: k => `<div style="width:75%">${barRow(k === 4 ? 3 : 1, k === 4 ? 3 : 1, '#f0a03c')}</div>${barRow(k, k, '#6ea8dc')}<div class="trail">${k === 4 ? '前項是後項的 3/4' : `切成 ${k} 份`}</div>`, find: '3÷4＝3/4。' },
      { say: '換 6：8，切成 8 份。', lo: 1, hi: 8, start: 1, target: 8, draw: k => `<div style="width:75%">${barRow(k === 8 ? 6 : 1, k === 8 ? 6 : 1, '#f0a03c')}</div>${barRow(k, k, '#6ea8dc')}<div class="trail">${k === 8 ? '6/8，約分也是 3/4' : `切成 ${k} 份`}</div>`, find: '6÷8 也是 3/4！' },
    ],
    back: '前項除以後項，得到一個數。', name: '前項÷後項得到的數叫<b>比值</b>。3：4 和 6：8 的比值都是 3/4。', pic: () => barRow(4, 3, '#f0a03c'),
    q: { t: '換成買東西：12 元買 5 個，12：5 的比值是？', o: ['12/5', '5/12', '17'], a: 0, ok: '對了！單位不一樣也能比，每個 12/5 元。' } },
  eqr: { game: 'ratio', sem: '六上', who: 'bee', word: '相等的比', hide: ['相等的比'],
    intro: '配方是 2 杯蜂蜜配 3 杯水。有 8 杯蜂蜜，水要幾杯才會一樣甜？',
    tries: [
      { say: '一份一份往下加，拖到 4 份。', lo: 1, hi: 5, start: 1, target: 4, draw: k => C_tb([['蜂蜜', '水'], ...Array.from({ length: k }, (_, i) => [2 * (i + 1), 3 * (i + 1)])]), find: '8 杯蜂蜜配 12 杯水，兩邊都是 4 倍。' },
      { say: '橫著看：3 是 2 的幾倍？拖到第 2 列比比。', lo: 1, hi: 3, start: 1, target: 2, draw: k => C_tb([['蜂蜜', '水', '水÷蜂蜜'], ...Array.from({ length: k }, (_, i) => [2 * (i + 1), 3 * (i + 1), '3/2'])]), find: '每一列橫著的倍數都一樣。' },
    ],
    back: '2：3 和 8：12 寫法不同，甜度一樣。', name: '比值一樣的比，叫<b>相等的比</b>。前後項同乘一個數，就得到它。', pic: () => C_tb([['蜂蜜', '水'], [2, 3], [8, 12]]),
    q: { t: '換成顏料：紅：藍＝1：2。下面哪一個和它是相等的比？', o: ['3：6', '3：5', '2：1'], a: 0, ok: '對了！1：2 同乘 3 是 3：6。' } },
  simpr: { game: 'ratio', sem: '六上', who: 'bee', word: '最簡單整數比', hide: ['最簡單'],
    intro: '配方寫 8 桶：12 桶，數字好大。可不可以用最少的份數說？',
    tries: [{ say: '前後一起拿出共同的質數。拖黃鈕。', lo: 0, hi: 2, start: 0, target: 2, draw: k => C_lad(8, 12, k), find: '8：12 變 2：3，比值沒變。' }, { say: '換 18：24。', lo: 0, hi: 2, start: 0, target: 2, draw: k => C_lad(18, 24, k), find: '18：24 變 3：4。' }],
    back: '兩項已經互質，不能再少了。', name: '前後項互質的整數比，叫<b>最簡單整數比</b>。', pic: () => C_lad(8, 12, 2),
    q: { t: '換成果汁：蜂蜜 6 杯、水 10 杯。最簡單整數比是？', o: ['3：5', '6：10', '12：20'], a: 0, ok: '對了！都除以 2。' } },
  arc: { game: 'sector', sem: '六上', who: 'sheep', word: '弧長', hide: ['弧長', '弧'],
    intro: '扇形太陽能板，彎彎的那條邊要貼防水條。要多長？它和整個圓有什麼關係？',
    tries: [
      { say: '拖黃鈕，把圓心角轉到 90 度。', lo: 15, hi: 345, step: 15, start: 30, target: 90, draw: d => C_sec(d, { arc: true, knob: false }) + `<div class="trail">紅線占整圈的 ${d}/360</div>`, find: '90 度，紅線是整圈的 1/4。' },
      { say: '轉到 180 度。', lo: 15, hi: 345, step: 15, start: 90, target: 180, draw: d => C_sec(d, { arc: true, knob: false }) + `<div class="trail">紅線占整圈的 ${d}/360</div>`, find: '角變 2 倍，紅線也變 2 倍。' },
    ],
    back: '紅線的長跟著圓心角變。', name: '扇形彎彎的邊叫弧，它的長叫<b>弧長</b>。弧長＝圓周長×圓心角/360。', pic: () => C_sec(90, { arc: true, knob: false }),
    q: { t: '換成披薩：圓周長 60 公分，切 120 度。弧長是圓周長的幾分之幾？', o: ['120/360，就是 1/3', '120/60', '1/120'], a: 0, ok: '對了！60×1/3＝20 公分。' } },
  sarea: { game: 'sector', sem: '六上', who: 'sheep', word: '扇形面積', hide: ['扇形面積'],
    intro: '雷達轉了一個角度，掃過地面多大一片？整圈的大小你已經會算了。',
    tries: [{ say: '拖到 90 度，看占整個圓幾分之幾。', lo: 15, hi: 345, step: 15, start: 30, target: 90, draw: d => C_sec(d, { n: 4, knob: false }), find: '4 片拼一圓，這片是 1/4。' }, { say: '拖到 120 度。', lo: 15, hi: 345, step: 15, start: 90, target: 120, draw: d => C_sec(d, { n: 3, knob: false }), find: '3 片拼一圓，這片是 1/3。' }],
    back: '這一片的大小，是整個圓的幾分之幾。', name: '這一片的大小叫<b>扇形面積</b>＝圓面積×圓心角/360。', pic: () => C_sec(120, { n: 3, knob: false }),
    q: { t: '換成披薩：一個披薩面積 300 平方公分，切 90 度一片。扇形面積是？', o: ['300×1/4', '300×90', '300÷90'], a: 0, ok: '對了！75 平方公分。' } },
  speed: { game: 'speed', sem: '六上', who: 'rabbit', word: '速率', hide: ['速率', '時速', '分速', '秒速'],
    intro: '甲船 3 小時飛 180 公里，乙船 2 小時飛 140 公里。一個飛得久，一個飛得短，怎麼比誰快？',
    tries: [
      { say: '拖黃鈕讓時間前進，看甲船每小時走多遠。', lo: 0, hi: 3, start: 0, target: 3, draw: k => raceSvg([{ d: 60 * k, c: '#d6476b', e: '🚀' }], 180), find: '每小時 60 公里。' },
      { say: '再看乙船。', lo: 0, hi: 2, start: 0, target: 2, draw: k => raceSvg([{ d: 70 * k, c: '#3b82c4', e: '🚀' }], 180), find: '每小時 70 公里，乙船比較快！' },
    ],
    back: '都換成「每 1 小時走多遠」，就能公平比。', name: '單位時間走的距離叫<b>速率</b>：距離÷時間。', pic: () => raceSvg([{ d: 180, c: '#d6476b', e: '🚀' }, { d: 140, c: '#3b82c4', e: '🚀' }], 180),
    q: { t: '換成走路：小綠 5 分鐘走 300 公尺。她的速率怎麼算？', o: ['300÷5', '300×5', '5÷300'], a: 0, ok: '對了！每分鐘 60 公尺。' } },
  speedu: { game: 'speed', sem: '六上', who: 'rabbit', word: '時速、分速、秒速', hide: ['時速', '分速', '秒速'],
    intro: '高鐵快得用小時算，走路用分鐘算，跑百米用秒算。同樣的快慢，怎麼說才清楚？',
    tries: [
      { say: '1 小時切成 60 分鐘，拖黃鈕看 1 分鐘的一格。', lo: 1, hi: 60, start: 1, target: 60, draw: k => barRow(k, k, i => i ? '#a9d0f0' : '#f0a03c') + `<div class="trail">3600 公尺切 ${k} 份，一份 ${dec6(3600 / k)} 公尺</div>`, find: '1 小時走 3600 公尺，1 分鐘走 60 公尺。' },
      { say: '1 分鐘再切成 60 秒。', lo: 1, hi: 60, start: 1, target: 60, draw: k => barRow(k, k, i => i ? '#a9d0f0' : '#f0a03c') + `<div class="trail">60 公尺切 ${k} 份，一份 ${dec6(60 / k)} 公尺</div>`, find: '1 秒走 1 公尺。一樣快，說法不同。' },
    ],
    back: '3600 公尺/小時、60 公尺/分鐘、1 公尺/秒，都一樣快。', name: '每小時走多遠叫<b>時速</b>，每分鐘叫<b>分速</b>，每秒叫<b>秒速</b>。', pic: () => barRow(60, 60, i => i ? '#a9d0f0' : '#f0a03c'),
    q: { t: '換成貨車：1 小時走 60 公里。怎麼說？', o: ['時速 60 公里', '分速 60 公里', '秒速 60 公里'], a: 0, ok: '對了！' } },
  countc: { game: 'puzzle', sem: '六下', who: 'wanwan', word: '乘法原理', hide: ['乘法原理'],
    intro: '有 3 件上衣、4 件裙子，一天穿一套。可以穿幾天不重複？一套一套列，好容易漏。',
    tries: [
      { say: '拖黃鈕，每件上衣都配上裙子。', lo: 0, hi: 3, start: 0, target: 3, draw: k => C_tb(Array.from({ length: 3 }, (_, i) => [`上衣 ${i + 1}`, i < k ? '👗👗👗👗' : '？'])) + `<div class="trail">已經 ${k * 4} 套</div>`, find: '每件上衣 4 種，3 件就是 12 種。' },
      { say: '換午餐，2 種主餐配 3 種飲料。', lo: 0, hi: 2, start: 0, target: 2, draw: k => C_tb(Array.from({ length: 2 }, (_, i) => [`主餐 ${i + 1}`, i < k ? '🥤🥤🥤' : '？'])) + `<div class="trail">已經 ${k * 3} 種</div>`, find: '每種主餐 3 種，2 種主餐就是 6 種。' },
    ],
    back: '先選一樣，再選下一樣，一步接一步。', name: '一步接一步選，把每一步的種數乘起來，這個想法叫<b>乘法原理</b>。如果是二選一，就用加的。', pic: () => C_tb([['上衣 1', '👗👗👗👗'], ['上衣 2', '👗👗👗👗'], ['上衣 3', '👗👗👗👗']]),
    q: { t: '換成航線：去程 3 條、回程 2 條，來回有幾種走法？', o: ['3×2＝6 種', '3＋2＝5 種', '3 種'], a: 0, ok: '對了！每條去程都有 2 條回程。' } },
  rel: { game: 'relation', sem: '六上', who: 'raccoon', word: '關係式', hide: ['關係式'],
    intro: '一天的白天和晚上每天都在變。有沒有什麼是不變的，可以先記下來？',
    tries: [{ say: '拖黃鈕改白天的長度，看晚上。', lo: 8, hi: 16, start: 9, target: 14, draw: x => `<div class="hz6"><div style="flex:${x}">${barRow(1, 1, '#f0a03c')}</div><div style="flex:${24 - x}">${barRow(1, 1, '#6ea8dc')}</div></div><div class="trail">白天 ${x}，晚上 ${24 - x}，合起來 24</div>`, find: '兩個都在變，合起來一直是 24。' }, { say: '換買筆：每枝 12 元，拖到 5 枝。', lo: 1, hi: 8, start: 1, target: 5, draw: x => barRow(8, x, '#a9d0f0') + `<div class="trail">12×${x}＝${12 * x} 元</div>`, find: '每枝的錢×枝數，一直是總價。' }],
    back: '不知道確切的數，也能用文字或 □ 先把關係寫下來。', name: '「晝長＋夜長＝24」這樣的式子，叫<b>關係式</b>。', pic: () => `<div class="expr6">晝長 ＋ 夜長 ＝ 24</div>`,
    q: { t: '換成年齡：哥哥永遠比弟弟大 3 歲。關係式是？', o: ['哥哥－弟弟＝3', '哥哥＋弟弟＝3', '哥哥×弟弟＝3'], a: 0, ok: '對了！差不變。' } },
  equal: { game: 'relation', sem: '六上', who: 'raccoon', word: '等量', hide: ['等量'],
    intro: '天平兩邊平衡。想把左邊的東西拿走一些，又不想讓它歪掉，要怎麼辦？',
    tries: [{ say: '拖黃鈕，兩邊一起拿走 2 顆。', lo: 0, hi: 2, start: 0, target: 2, draw: k => `<div class="bal6"><span class="pan6">🔋🔋<b class="num">＋${5 - k}</b></span><i>＝</i><span class="pan6"><b class="num">${11 - k}</b></span></div>`, find: '兩邊拿走一樣多，還是平衡。' }, { say: '再拿到左邊只剩電池盒。', lo: 2, hi: 5, start: 2, target: 5, draw: k => `<div class="bal6"><span class="pan6">🔋🔋${5 - k ? `<b class="num">＋${5 - k}</b>` : ''}</span><i>＝</i><span class="pan6"><b class="num">${11 - k}</b></span></div>`, find: '兩盒是 6 顆，一盒 3 顆。' }],
    back: '兩邊做一樣的事，平衡不會變。', name: '兩邊一樣多的關係叫<b>等量</b>。兩邊同加、同減、同乘、同除，都還是等量。', pic: () => `<div class="bal6"><span class="pan6">🔋🔋</span><i>＝</i><span class="pan6"><b class="num">6</b></span></div>`,
    q: { t: '換成螺絲：左邊一袋加 4 顆，右邊 9 顆，平衡。兩邊怎麼做還是等量？', o: ['兩邊都拿走 4 顆', '只有左邊拿走 4 顆'], a: 0, ok: '對了！一袋就是 5 顆。' } },
  base: { game: 'base', sem: '六下', who: 'goat', word: '基準量、比較量', hide: ['基準', '比較量'],
    intro: '甲艙 40 箱，乙艙 50 箱。「甲是乙的幾分之幾」和「乙是甲的幾分之幾」，答案一樣嗎？',
    tries: [
      { say: '把乙艙當 1，拖黃鈕切成 5 份。', lo: 1, hi: 5, start: 1, target: 5, draw: k => C_bars(['甲艙 40 箱', k === 5 ? 4 : 1, 80], ['乙艙 50 箱', k, 100]) + `<div class="trail">${k === 5 ? '甲是乙的 4/5' : ''}</div>`, find: '甲 4 份，乙 5 份，甲是乙的 4/5。' },
      { say: '換甲艙當 1，切成 4 份。', lo: 1, hi: 4, start: 1, target: 4, draw: k => C_bars(['甲艙 40 箱', k, 80], ['乙艙 50 箱', k === 4 ? 5 : 1, 100]) + `<div class="trail">${k === 4 ? '乙是甲的 5/4' : ''}</div>`, find: '當 1 的換了，答案也上下顛倒！' },
    ],
    back: '先決定誰當 1，再拿另一個和它比。', name: '當作 1 的量叫<b>基準量</b>，拿來比的量叫<b>比較量</b>。比較量÷基準量＝比值。', pic: () => C_bars(['比較量', 4, 80], ['基準量', 5, 100]),
    q: { t: '換成身高：「弟弟是哥哥的 4/5」，基準量是誰？', o: ['哥哥', '弟弟'], a: 0, ok: '對了！「的」前面的哥哥當 1。' } },
  zoom: { game: 'scale', sem: '六下', who: 'seal', word: '放大圖', hide: ['放大圖'],
    intro: '站徽要印到大旗子上，又不能變形。怎麼做才不會歪？',
    tries: [{ say: '長寬一起變：拖黃鈕到 2 倍。', lo: 1, hi: 4, start: 1, target: 2, draw: k => shapeSvg('rect', 3, 2, k, true, `${k} 倍`), find: '形狀一樣，只是變大了。' }, { say: '三角形：拖到 3 倍。', lo: 1, hi: 4, start: 1, target: 3, draw: k => shapeSvg('tri', 3, 2, k, true, `${k} 倍`), find: '角沒有變，每條邊都變 3 倍。' }],
    back: '每條邊變一樣的倍數，角不變，形狀才不會歪。', name: '這樣做出來的圖叫<b>放大圖</b>。對應角相等，對應邊成比例。', pic: () => shapeSvg('tri', 3, 2, 3, true, '3 倍'),
    q: { t: '換成照片：長 4、寬 3 公分，做 2 倍放大圖。新的是？', o: ['長 8、寬 6', '長 8、寬 3', '長 6、寬 5'], a: 0, ok: '對了！長寬都乘 2。' } },
  shrink: { game: 'scale', sem: '六下', who: 'seal', word: '縮圖', hide: ['縮圖'],
    intro: '大海報要做成小書籤，字和圖都要照原樣變小。怎麼做？',
    tries: [{ say: '長寬一起變小：拖黃鈕到每邊的 1/2。', lo: 1, hi: 4, start: 1, target: 2, draw: k => shapeSvg('rect', 4, 3, 1 / k, true, `1/${k} 倍`), find: '形狀一樣，每邊都是一半。' }, { say: '拖到每邊的 1/4。', lo: 1, hi: 4, start: 2, target: 4, draw: k => shapeSvg('rect', 4, 3, 1 / k, true, `1/${k} 倍`), find: '還是同樣的形狀。' }],
    back: '每條邊乘同一個比 1 小的數。', name: '這樣做出來的圖叫<b>縮圖</b>，例如 1/2 倍縮圖。', pic: () => shapeSvg('rect', 4, 3, .5, true, '1/2 倍'),
    q: { t: '換成星圖：長 12、寬 8 公分，做 1/4 倍縮圖。新的是？', o: ['長 3、寬 2', '長 3、寬 8', '長 8、寬 4'], a: 0, ok: '對了！長寬都÷4。' } },
  mapscale: { game: 'scale', sem: '六下', who: 'seal', word: '比例尺', hide: ['比例尺', '1：'],
    intro: '學校到車站很遠，地圖上卻只差幾公分。怎麼從地圖知道實際多遠？',
    tries: [{ say: '地圖上每 1 公分是實際 1 公里。拖尺量到 3 公分。', lo: 0, hi: 6, start: 0, target: 3, draw: k => barRow(6, k, '#ffd65a') + `<div class="trail">量到 ${k} 公分，實際 ${k} 公里</div>`, find: '量到幾公分，就知道實際幾公里。' }, { say: '換一張縮得更小的：每 1 公分是 5 公里。同一條路，拖到幾格？拖到 1 格。', lo: 0, hi: 6, start: 3, target: 1, draw: k => barRow(6, k, '#ffd65a') + `<div class="trail">${k} 公分，實際 ${k * 5} 公里</div>`, find: '縮得越小，圖上的路越短。' }],
    back: '圖上長度和實際長度，有固定的關係。', name: '圖上長和實際長的比叫<b>比例尺</b>。1：100000 就是圖上 1 公分，實際 100000 公分。分母越大，圖上越短。', pic: () => barRow(6, 3, '#ffd65a'),
    q: { t: '換成月球地圖：比例尺 1：50000，圖上 1 公分，實際幾公尺？', o: ['500 公尺', '50000 公尺', '50 公尺'], a: 0, ok: '對了！50000 公分＝500 公尺。' } },
  vol: { game: 'prism', sem: '六下', who: 'turtle', word: '柱體體積', hide: ['柱體', '體積', '底面積'],
    intro: '燃料槽有方的、圓的、三角的。要裝多少燃料？形狀不同，有共同的算法嗎？',
    tries: [{ say: '方的：拖黃鈕往上一層層疊。', lo: 1, hi: 4, start: 1, target: 4, draw: k => isoSvg(3, 2, 4, 6 * k) + `<div class="trail">每層 6 塊，疊 ${k} 層</div>`, find: '每層的量×層數。' }, { say: '圓的：也一層層疊。', lo: 1, hi: 5, start: 1, target: 5, draw: k => cylSvg(k, 5) + `<div class="trail">疊了 ${k} 層</div>`, find: '形狀換了，還是每層的量×層數！' }],
    back: '不管底面什麼形狀，都是一層一層一樣大地往上疊。', name: '這樣的形體叫柱體。<b>柱體體積</b>＝底面積×高。', pic: () => cylSvg(5, 5),
    q: { t: '換成三角形的起司塊：底面 6 平方公分，高 5 公分。體積怎麼算？', o: ['6×5', '6＋5', '6×5÷3'], a: 0, ok: '對了！30 立方公分。' } },
  surf: { game: 'prism', sem: '六下', who: 'turtle', word: '表面積', hide: ['表面積', '側面積'],
    intro: '罐頭要貼標籤，上下還要加蓋。要用多少鐵皮？彎彎的外皮怎麼量？',
    tries: [{ say: '拖黃鈕，把外皮剪開攤平。', lo: 0, hi: 4, start: 0, target: 4, draw: t => `<div style="width:${25 + t * 18}%;margin:0 auto">${barRow(1, 1, '#a9d0f0')}${barRow(1, 1, '#a9d0f0')}</div><div class="trail">${t === 4 ? '攤成長方形，長就是圓周，寬就是高' : '慢慢拉開'}</div>`, find: '彎的外皮攤開是長方形！' }, { say: '換箱子：拖黃鈕把 6 面都打開。', lo: 0, hi: 6, start: 0, target: 6, draw: k => barRow(6, k, '#f0a03c') + `<div class="trail">開了 ${k} 面</div>`, find: '每一面都攤平了，就能一面一面加。' }],
    back: '攤平以後，每一面都看得到。', name: '所有面的大小合起來，叫<b>表面積</b>。', pic: () => barRow(6, 6, '#f0a03c'),
    q: { t: '換成禮物盒：長方體上下各 12、前後各 8、左右各 6 平方公分。表面積是？', o: ['52 平方公分', '26 平方公分', '576 平方公分'], a: 0, ok: '對了！（12＋8＋6）×2。' } },
  pie: { game: 'pie', sem: '六下', who: 'mimi', word: '圓形圖', hide: ['圓形圖'],
    intro: '全班票選想去哪個星球。想一眼看出每一個占全部多少，怎麼畫？',
    tries: [{ say: '把一個圓切成 100 格。月球 40%：拖到 40 格。', lo: 0, hi: 100, step: 10, start: 0, target: 40, draw: v => pie100([['月球', v], ['', 100 - v]], { h: 170 }), find: '一格就是 1%，40 格就是 40%。' }, { say: '火星 35%：再接著拖到 35 格。', lo: 0, hi: 60, step: 5, start: 0, target: 35, draw: v => pie100([['月球', 40], ['火星', v], ['', 60 - v]], { h: 170 }), find: '一塊一塊，合起來就是全部。' }],
    back: '每一塊是部分，整個圓是全部。', name: '這種圖叫<b>圓形圖</b>，看「每部分占全部多少」最清楚。', pic: () => pie100([['月球', 40], ['火星', 35], ['土星', 25]], { h: 170 }),
    q: { t: '換成午餐：要看麵、飯、餃子各占全班多少，用哪種圖？', o: ['圓形圖', '折線圖'], a: 0, ok: '對了！部分占全部，用圓形圖。' } },
  likely: { game: 'pie', sem: '六下', who: 'mimi', word: '可能性', hide: ['可能'],
    intro: '明天要帶傘嗎？沒有人知道明天的事，但過去的記錄能幫我們說得有把握一點。',
    tries: [{ say: '看過去 30 天，拖黃鈕翻開記錄。', lo: 0, hi: 30, step: 5, start: 0, target: 30, draw: k => barRow(30, 30, i => i >= k ? '#eee' : i < 27 ? '#f0a03c' : '#6ea8dc') + `<div class="trail">翻了 ${k} 天：晴 ${Math.min(k, 27)} 天、雨 ${Math.max(0, k - 27)} 天</div>`, find: '27 天晴、3 天雨，差很多。' }, { say: '換抽球：抽 50 次的記錄。拖黃鈕翻開。', lo: 0, hi: 50, step: 10, start: 0, target: 50, draw: k => barRow(50, 50, i => i >= k ? '#eee' : i < 45 ? '#d6476b' : '#6ea8dc') + `<div class="trail">翻了 ${k} 次：紅 ${Math.min(k, 45)} 次、藍 ${Math.max(0, k - 45)} 次</div>`, find: '45 次紅、5 次藍，也差很多。' }],
    back: '資料差很多的時候，才能這樣說。', name: '這就是<b>可能性</b>：多的那個「很有可能」，少的那個「很不可能」，也可以說「紅比藍可能」。', pic: () => barRow(30, 30, i => i < 27 ? '#f0a03c' : '#6ea8dc'),
    q: { t: '換成接駁車：40 天裡 36 天準時、4 天晚到。可以怎麼說？', o: ['準時比晚到可能', '晚到比準時可能'], a: 0, ok: '對了！從資料多寡來說。' } },
};
const CONCEPT_OF = {
  'prime:tile': ['prime'], 'prime:tree': ['prime', 'pfac'], 'prime:by25': [], 'prime:by3': [], 'prime:gcf': ['short'], 'prime:lcm': ['short'], 'prime:simp': ['simplest'], 'prime:coprime': ['coprime'],
  'fdiv:whole': ['fdivm'], 'fdiv:intfrac': ['fdivm'], 'fdiv:same': ['fdivm'], 'fdiv:unlike': ['fdivm'], 'fdiv:partial': ['fdivm'], 'fdiv:flip': ['fdivm', 'reciprocal'], 'fdiv:bigger': ['fdivm'],
  'ddiv:cut': ['decdiv'], 'ddiv:shift': ['decdiv'], 'ddiv:two': ['decdiv'], 'ddiv:long': ['decdiv'], 'ddiv:bigger': ['decdiv'],
  'circle:pi': ['pi'], 'circle:circ': ['pi', 'circ'], 'circle:wheel': ['pi', 'circ'], 'circle:half': ['pi', 'circ'], 'circle:area': ['carea'], 'circle:ring': ['carea'],
  'ratio:mix': ['ratio'], 'ratio:rate': ['ratio', 'rate'], 'ratio:equal': ['ratio', 'eqr'], 'ratio:vert': ['ratio', 'eqr'], 'ratio:simp': ['ratio', 'simpr'], 'ratio:fd': ['ratio', 'simpr'], 'ratio:share': ['ratio'], 'ratio:same': ['ratio', 'eqr'],
  'sector:frac': [], 'sector:arc': ['arc'], 'sector:perim': ['arc'], 'sector:three': ['arc', 'sarea'], 'sector:area': ['sarea'], 'sector:word': ['sarea'],
  'speed:sameT': ['speed'], 'speed:sameD': ['speed'], 'speed:rate': ['speed', 'speedu'], 'speed:dist': ['speed', 'speedu'], 'speed:prop': ['speed', 'speedu'], 'speed:unit': ['speed', 'speedu'], 'speed:avg': ['speed', 'speedu'],
  'relation:sum': ['rel'], 'relation:diff': ['rel'], 'relation:each': ['rel'], 'relation:seat': ['rel'], 'relation:write': ['rel'], 'relation:balance': ['equal'],
  'prism:stack': ['vol'], 'prism:tri': ['vol'], 'prism:cyl': ['vol'], 'prism:comp': ['vol'], 'prism:net': ['surf'], 'prism:surf': ['surf'],
  'base:read': ['base'], 'base:swap': ['base'], 'base:cmp': ['base'], 'base:findbase': ['base'], 'base:change': ['base'],
  'scale:zoom': ['zoom'], 'scale:keep': ['zoom'], 'scale:which': ['zoom'], 'scale:shrink': ['shrink'], 'scale:ruler': ['mapscale'], 'scale:mapn': ['mapscale'], 'scale:mis': ['mapscale'], 'scale:twomap': ['mapscale'],
  'puzzle:hen': [], 'puzzle:sumdiff': [], 'puzzle:age': [], 'puzzle:chase': [], 'puzzle:stream': [], 'puzzle:count': ['countc'], 'puzzle:odd': ['countc'], 'puzzle:addc': ['countc'],
  'mix:order': [], 'mix:fdeq': [], 'mix:cancel': ['reciprocal'], 'mix:word': [], 'mix:est': [], 'mix:dist': [],
  'pie:read': ['pie'], 'pie:make': ['pie'], 'pie:pct': ['pie'], 'pie:which': ['pie'], 'pie:likely': ['likely'],
};
const conceptsOf = q => CONCEPT_OF[q.kind + ':' + q.mode] || [];
function conceptThen(q, then) { // 第一次遇到才自動播
  S.seenC = S.seenC || {};
  const k = conceptsOf(q).find(x => !S.seenC[x]);
  if (!k) return then();
  runConcept(k, () => conceptThen(q, then));
}
function bindConceptBtn(q) { // 題目頁右上角可重看
  const b = document.getElementById('cst'), L = conceptsOf(q);
  if (!b) return;
  if (!L.length) { b.hidden = true; return; }
  b.hidden = false;
  b.onclick = () => { const rq = R.q; runConcept(L[L.length - 1], () => VIEWS[R.game](rq)); };
}
function runConcept(key, then) {
  const C = CONCEPTS[key], L = { title: '新概念小故事', sem: C.sem, who: C.who };
  let timer = null;
  const stop = () => { if (timer) clearInterval(timer); timer = null; };
  const leave = () => { stop(); S.seenC = S.seenC || {}; S.seenC[key] = 1; save(); then(); };
  const shell = (prompt, body) => { stop(); lessonFrame(L, prompt, `${body}<button class="skip6" id="cskip">跳過這個小故事</button>`); document.getElementById('out').onclick = leave; document.getElementById('cskip').onclick = leave; };
  function intro() {
    const T = C.tries[0], step = T.step || 1, back = T.target < T.start ? -step : step;
    shell(C.intro, '<div id="cp" class="cmv"></div>');
    let v = T.start; const paint = () => setEl('cp', T.draw(v)); paint();
    timer = setInterval(() => { if (!document.getElementById('cp')) return stop(); v = v === T.target ? T.start : dec6(v + back); paint(); }, 650); // 會動的圖
    actionBtn('cgo', '動手試試').onclick = () => tryIt(0);
  }
  function tryIt(i) {
    const T = C.tries[i];
    shell(T.say, '<div id="cp"></div><div id="sl"></div>');
    explore({ kind: 'concept', mode: key }, { id: 'sl', lo: T.lo, hi: T.hi, step: T.step, start: T.start, target: T.target, draw: v => setEl('cp', T.draw(v)), ask: () => {
      setMsg(nums(T.find), 'good'); sfx.good();
      actionBtn('cnext', i + 1 < C.tries.length ? '再試一次' : '我發現了！').onclick = () => i + 1 < C.tries.length ? tryIt(i + 1) : named();
    } });
  }
  function named() {
    shell(C.back, `<div class="cname"><span class="tag6">${C.word}</span>${C.pic()}</div>`);
    setMsg(nums(C.name), 'good');
    actionBtn('cq', '換個情境用用看').onclick = quiz;
  }
  function quiz() {
    const q = C.q, order = Logic.shuffle(q.o.map((_, i) => i));
    shell(q.t, '<div class="u-big">🤔</div>');
    document.getElementById('actions').innerHTML = `<div class="choices col">${order.map(i => `<button class="choice" data-co="${i}">${nums(q.o[i])}</button>`).join('')}</div>`;
    document.querySelectorAll('[data-co]').forEach(b => b.onclick = () => {
      if (+b.dataset.co === q.a) { setMsg(nums(q.ok), 'good'); sfx.good(); return actionBtn('cdone', '開始闖關').onclick = leave; }
      sfx.retry(); setMsg(nums('再動手看一次，答案就在操作裡。'), 'hint');
      actionBtn('cback', '回去動手').onclick = () => tryIt(0);
    });
  }
  intro();
}
function viewConcepts() {
  window.scrollTo(0, 0);
  S.seenC = S.seenC || {};
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="home" aria-label="回練習場">⌂</button><h2 class="page-h">新概念小故事</h2></div><div class="pg">${Object.entries(CONCEPTS).map(([k, C]) => `<button class="pg-btn" data-cs="${k}"><span class="sem">${C.sem}</span>${S.seenC[k] ? '✓ ' : ''}${C.word}</button>`).join('')}</div>`;
  document.getElementById('home').onclick = viewPractice;
  document.querySelectorAll('[data-cs]').forEach(b => b.onclick = () => runConcept(b.dataset.cs, viewConcepts));
}
/* ---------- 單位教室 ---------- */
const LESSONS = {
  dist: {
    title: '距離', sem: '六下', icon: '📏', who: 'seal', name: '波波', say: '地圖上的 1 公分，實際可能很遠。先記得每個單位多長。',
    cards: [
      { e: '✏️', u: '公分', t: '大約食指的寬。一枝鉛筆大約 18 公分。' },
      { e: '🚪', u: '公尺', t: '1 公尺＝100 公分。門大約 2 公尺高。' },
      { e: '🚶', u: '公里', t: '1 公里＝1000 公尺。走路大約 15 分鐘。' },
    ],
    labs: [{ n: 10, each: 100, from: '公尺', to: '1000 公尺', btn: '走 100 公尺', done: '1000 公尺就是 1 公里！' }],
  },
  spd: {
    title: '速率', sem: '六上', icon: '🚄', who: 'rabbit', name: '派派', say: '時速看 1 小時走多遠，分速看 1 分鐘，秒速看 1 秒。',
    cards: [
      { e: '🚶', u: '分速', t: '每 1 分鐘走多遠。小朋友走路大約分速 60 公尺。' },
      { e: '🏃', u: '秒速', t: '每 1 秒走多遠。快跑大約秒速 5 公尺。' },
      { e: '🚄', u: '時速', t: '每 1 小時走多遠。高鐵大約時速 300 公里。' },
    ],
    labs: [{ view: 'clock', n: 6, each: 10, from: '分鐘', to: '60 分鐘', btn: '走 10 分鐘', done: '60 分鐘就是 1 小時。分速 60 公尺，1 小時走 3600 公尺，就是時速 3.6 公里！' }],
  },
  vol: {
    title: '體積和容量', sem: '六下', icon: '🛢️', who: 'turtle', name: '阿穩', say: '燃料槽裝多少？先看看這些單位有多大。',
    cards: [
      { e: '🎲', u: '立方公分', t: '一顆小骰子，每邊 1 公分。' },
      { e: '🍼', u: '公升', t: '1 公升＝1000 立方公分。每邊 10 公分的盒子剛好裝滿。' },
      { e: '📦', u: '立方公尺', t: '每邊 1 公尺的大方塊，大約一台大冰箱。' },
    ],
    labs: [{ n: 10, each: 100, from: '立方公分', to: '1000 立方公分', btn: '再疊一層（100 立方公分）', done: '10 層共 1000 立方公分，就是 1 公升！' }],
  },
};
function clockSvg(from, cur) {
  let s = '<svg class="g5" style="max-height:190px" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="#fff" stroke="#33405a" stroke-width="4"/>';
  for (let h = 1; h <= 12; h++) { const a = h * 30 * Math.PI / 180; s += `<text x="${100 + 74 * Math.sin(a)}" y="${106 - 74 * Math.cos(a)}" text-anchor="middle" class="pt">${h}</text>`; }
  const P = (h, l) => [100 + l * Math.sin(h * 30 * Math.PI / 180), 100 - l * Math.cos(h * 30 * Math.PI / 180)], [c, d] = P(cur, 66);
  return s + `<line x1="100" y1="100" x2="${c}" y2="${d}" stroke="#d6476b" stroke-width="6" stroke-linecap="round"/><circle cx="100" cy="100" r="6" fill="#33405a"/></svg>`;
}
function labPic(X, k) { return `<div class="vs6">${clockSvg(0, k * 2 % 12)}</div>`; }
const LESSON_BEFORE = { speed: ['spd'], scale: ['dist'], prism: ['vol'] };
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
const QUIZ_LV = { basic: ['基礎題', 25], adv: ['進階題', 25], fun: ['益智題', 10] };
const quizBest = key => (S.quiz || {})[key];
const quizShell = (title, back, body) => {
  window.scrollTo(0, 0);
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="qback" aria-label="回上一頁">⌂</button><h2 class="page-h">${title}</h2></div>${body}`;
  document.getElementById('qback').onclick = back;
};
function viewQuizBooks() {
  const books = (window.QUIZ && QUIZ.books) || [];
  quizShell('單元測驗', () => go(''), `<p class="tag">${books.length ? '每個單元都有基礎、進階和益智題。' : '題庫準備中，很快就來！'}</p><div class="lessons">${books.map((b, i) => {
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
    if (confirm('確定清除所有星星和紀錄？')) { S.stars = 0; S.rec = {}; S.log = []; S.prog = {}; S.opened = false; S.bossDone = false; S.bossSeen = false; S.s2Seen = false; S.stamps = {}; S.fast = {}; S.seenC = {}; S.quiz = {}; S.grandSeen = false; S.learned = {}; save(); viewParent(); }
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
