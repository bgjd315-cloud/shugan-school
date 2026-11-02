// 數感小鎮：畫面與互動
const $app = document.getElementById('app');
const ROUND = 6;
const GAMES = {
  port: { name: '萬數大港', tip: '數到一萬', sem: '三上', need: 0 },
  ship: { name: '千里航道', tip: '四位數加減', sem: '三上', need: 0 },
  fact: { name: '倍數工廠', tip: '拆開來乘', sem: '三上・三下', need: 0 },
  mm: { name: '毫米裁縫島', tip: '量得更準', sem: '三上', need: 0 },
  angle: { name: '角角山', tip: '角和長方形', sem: '三上', need: 0 },
  div: { name: '分分海灘', tip: '除法與餘數', sem: '三上・三下', need: 0 },
  meas: { name: '量量市集', tip: '公升、公斤、時間', sem: '三上・三下', need: 0 },
  frac: { name: '分數烘焙坊', tip: '幾分之幾', sem: '三上・三下', need: 0 },
  circle: { name: '圓圓天文台', tip: '圓心和半徑', sem: '三上', need: 0 },
  rule: { name: '規律花園', tip: '找出規律', sem: '三下', need: 0 },
  area: { name: '面積牧場', tip: '平方公分', sem: '三下', need: 0 },
  deci: { name: '小數碼頭', tip: '認識 0.1', sem: '三下', need: 0 },
};
const availKeys = () => Object.keys(GAMES).filter(k => S.unit >= GAMES[k].need);
const ROUNDS_TO_SAVE = 3; // 每個地方玩幾回合就把居民救回來
const BOSS_ORDER = ['port', 'ship', 'fact', 'div', 'meas', 'frac'];
const ART = ['liang', 'liang_cheer', 'liang_think', 'mimi', 'mimi_happy', 'wanwan', 'piece', 'chest', 'sky_dark', 'sky_bright', 'finale', 'seal', 'turtle', 'octopus', 'crab', 'goat', 'otter', 'bee', 'rabbit', 'fox', 'sheep', 'pelican', 'raccoon', 'isl_port', 'isl_ship', 'isl_fact', 'isl_mm', 'isl_angle', 'isl_div', 'isl_rule', 'isl_frac', 'isl_circle', 'isl_area', 'isl_deci', 'isl_meas'];
const HAS = {}; // 圖還沒收齊時，畫面照樣能玩
const artUrl = n => `assets/${n}.webp`;
const artImg = (n, cls) => HAS[n] ? `<img class="${cls || ''}" src="${artUrl(n)}" alt="">` : '';
const bgStyle = n => HAS[n] ? `background-image:url(${artUrl(n)})` : '';
function preloadArt() {
  return Promise.all(ART.map(n => new Promise(ok => { const i = new Image(); i.onload = () => { HAS[n] = true; ok(); }; i.onerror = () => ok(); i.src = artUrl(n); })));
}

/* ---------- 存檔 ---------- */
const SAVE_KEY = 'shugan3-v1';
function load() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) return s; } catch (e) {}
  return null;
}
const PIECE_KEYS = ['port', 'ship', 'fact', 'mm', 'angle', 'div', 'meas', 'frac', 'circle']; // 九塊碎片的島＝南一三上九個單元，集滿才開最後一關（2026-11-02 照南一學期調整）
const S = Object.assign({ stars: 0, unit: 5, sound: true, rec: {}, log: [], opened: false, prog: {}, bossDone: false, bossSeen: false, stamps: {}, fast: {}, learned: {}, seenCpt: {}, doneCpt: {}, lessonSeen: {} }, load() || {});
S.unit = 20; // 全部單元開放
if (!S.sv) { // 2026-11-02 以前的存檔：規律花園原本是第 7 塊碎片、量量市集在三下。已在規律花園拿到的碎片照算，算在量量市集那一格
  if ((S.prog.rule || 0) >= ROUNDS_TO_SAVE && (S.prog.meas || 0) < ROUNDS_TO_SAVE) S.pieceFrom = { meas: 'rule' };
  S.sv = 2; save();
}
const pieceGot = k => (S.prog[k] || 0) >= ROUNDS_TO_SAVE || !!(S.pieceFrom && S.pieceFrom[k] && (S.prog[S.pieceFrom[k]] || 0) >= ROUNDS_TO_SAVE); // 這一格碎片拿到了沒
// 三上段的量量市集只出公升和毫升（三上第 7 單元）；找到萬萬、第二季開始後才進時間、公斤和公克、表格（三下）
const genUnit = r => r.game === 'meas' && !S.bossDone && r.fixedLv === undefined && !r.daily ? 9 : S.unit;
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
function bp(r) {
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
  do { q = Logic.gen(R.game, R.fixedLv !== undefined ? R.fixedLv : rec(R.game).lv, genUnit(R)); } while (R.lastKey === JSON.stringify(q) && guard++ < 8);
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
  R.grades.push(grade); R.earned += grade * 25; S.stars += grade * 25;
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
  if (q.kind === 'meas' && (q.u1 === '公升' || q.fam === 'vol')) return '三上'; // 公升和毫升是三上第 7 單元
  if (['area', 'deci', 'meas', 'rule'].includes(q.kind)) return '三下'; // 找規律是三下第 2 單元
  if ((q.kind === 'fact' && q.mode === 'two') || (q.kind === 'div' && ['split', 'missing'].includes(q.mode)) || (q.kind === 'frac' && ['cmp', 'add', 'sub'].includes(q.mode))) return '三下';
  return '三上';
}
function frame(promptHtml, stageHtml, extra) {
  const dots = Array.from({ length: ROUND }, (_, i) => `<i class="${i < R.grades.length ? 'g' + R.grades[i] : i === R.i ? 'now' : ''}"></i>`).join('');
  $app.innerHTML = `
    <div class="top">
      <button class="icon-btn" id="home" aria-label="回小鎮">⌂</button>
      <div class="dots">${dots}</div><span class="sem">${semOf(R.q)}</span>
      ${conceptsOf(R.game).length ? '<button class="icon-btn" id="cpt" aria-label="新概念小故事">💡</button>' : ''}<button class="icon-btn" id="say" aria-label="唸題目">🔊</button>
    </div>
    <div class="say-row">${artImg(R.boss ? 'mimi' : R.daily ? 'liang' : STORY[R.game].who, 'say-who')}<div class="prompt" id="prompt">${promptHtml}</div></div>
    <div class="stage" id="stage">${stageHtml}</div>
    <div class="msg" id="msg"></div>
    ${extra || ''}
    <div class="actions" id="actions"></div>`;
  { const c5 = document.getElementById('cpt'); if (c5) c5.onclick = () => viewConcepts(R.game, () => VIEWS[R.game](R.q)); }
  document.getElementById('home').onclick = () => { R = null; go(''); };
  document.getElementById('say').onclick = () => speak(sayText());
}
function endRound() {
  const ch = R.chapter, boss = R.boss;
  let beat = null;
  if (R.daily) S.stamps[today()] = 1;
  if (boss) { if (!S.bossDone) { S.bossDone = true; S.stars = Math.max(S.stars, 10000); beat = 'ending'; } }
  else if (STORY[ch] && R.fixedLv === undefined) {
    const before = S.prog[ch] || 0;
    if (before < ROUNDS_TO_SAVE) { S.prog[ch] = before + 1; beat = STORY[ch].beats[before + 1]; }
  }
  save();
  const praise = boss ? '你陪萬萬算完了最後一次。' : R.daily ? '今天的任務完成了，蓋一個章！' : R.fixedLv !== undefined ? '多練一次，就更有感覺。' : '這座島又亮了一點。';
  $app.innerHTML = `<div class="end pop">
    ${artImg('liang_cheer', 'end-hero')}
    <h2>夜空多亮了 ${N(R.earned)} 顆星</h2>
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
  a.innerHTML = '<button class="btn" id="again">再玩一回</button><button class="btn alt" id="back">回小鎮</button>';
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
    <div class="actions"><button class="btn" id="ok">收進星星本</button></div></div>`;
  document.getElementById('ok').onclick = () => go('');
}
function viewClues() {
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="home" aria-label="回小鎮">⌂</button><h2 class="page-h">星星本</h2></div>
    <p class="tag">碎片上的字，排起來是什麼？</p>
    <div class="clues">${availKeys().map(k => {
      const has = PIECE_KEYS.includes(k) ? pieceGot(k) : (S.prog[k] || 0) >= ROUNDS_TO_SAVE, c = STORY[k].clue;
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
  const u = S.unit, T = [
    ['port', 1, '數線：幾千幾百', 1], ['port', 2, '讀寫四位數', 1], ['port', 3, '比大小', 1], ['port', 4, '位值換算', 1], ['port', 5, '數線：四位數', 1],
    ['ship', 1, '加 1999 想成加 2000', 1], ['ship', 2, '減 1999 想成減 2000', 1], ['ship', 3, '算式心算', 2], ['ship', 4, '整百估算', 2],
    ['fact', 0, '幾十乘以一位數', 3], ['fact', 2, '二位數拆開乘', 3], ['fact', 3, '三位數拆開乘', 3], ['fact', 4, '乘法估算', 3], ['fact', 5, '兩步驟', 14],
    ['mm', 1, '讀毫米', 4], ['mm', 2, '剪出毫米', 4], ['mm', 3, '公分換毫米', 4], ['mm', 4, '毫米換公分', 4], ['mm', 5, '長度量感', 4],
    ['angle', 0, '比角的大小', 1], ['angle', 2, '銳角、直角、鈍角', 5], ['angle', 3, '正方形和長方形', 5], ['angle', 4, '沿著邊走一圈', 5], ['angle', 5, '每邊加起來', 5], ['angle', 6, '拉直比長短', 5],
    ['div', 1, '除法', 6], ['div', 2, '有餘數的除法', 6], ['div', 3, '偶數和奇數', 6], ['div', 5, '先分大的再分小的', 11], ['div', 6, '找出 □', 18],
    ['rule', 0, '每次多多少', 12], ['rule', 1, '每次少多少', 12], ['rule', 3, '相差會變', 12], ['rule', 4, '花瓣規律', 12],
    ['frac', 1, '幾分之幾', 8], ['frac', 2, '做出分數', 8], ['frac', 3, '分數累加', 8], ['frac', 4, '同分母比大小', 17], ['frac', 5, '分數加法', 17], ['frac', 6, '分數減法', 17],
    ['circle', 1, '半徑和直徑', 9], ['circle', 2, '半徑的 2 倍', 9],
    ['area', 1, '數格子', 15], ['area', 3, '缺一角的面積', 15], ['area', 4, '三角形是一半', 15],
    ['deci', 1, '幾個 0.1', 19], ['deci', 2, '小數比大小', 19], ['deci', 4, '小數加減', 19],
    ['meas', 0, '公升和毫升', 7], ['meas', 2, '容量、時間、重量換算', 13],
  ];
  return T.filter(t => u >= t[3]);
}
function viewPractice() {
  const groups = availKeys().map(k => {
    const ts = practiceTopics().filter(t => t[0] === k);
    return ts.length ? `<h3 class="pg-h">${GAMES[k].name}<span class="sem">${GAMES[k].sem}</span></h3><div class="pg">${ts.map(t => `<button class="pg-btn" data-g="${t[0]}" data-l="${t[1]}"><span class="sem">${t[3] >= 11 ? '三下' : '三上'}</span>${nums(t[2])}</button>`).join('')}</div>` : '';
  }).join('');
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="home" aria-label="回小鎮">⌂</button><h2 class="page-h">練習場</h2></div><p class="tag">想多練哪一個？</p><button class="lesson-entry" id="cptAll"><span>💡</span><b>新概念小故事</b><small>可以重看</small></button><h3 class="pg-h">單位的量感</h3><div class="pg">${Object.entries(LESSONS).map(([k, L]) => `<button class="pg-btn" data-ud="${k}"><span class="sem">${L.sem}</span>${L.title}</button>`).join("")}</div>${groups}`;
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
      else if (val.length < 6) val = (val + k).replace(/^0+(?=\d)/, '');
      show();
    };
  });
}
function lockKeypad() { document.querySelectorAll('.keypad button').forEach(b => { b.disabled = true; b.style.opacity = .35; }); }

/* ---------- 尋寶數線 ---------- */
const LX0 = 30, LX1 = 610;
function lineSvg(a, b, s, labels) {
  const X = v => LX0 + (v - a) / (b - a) * (LX1 - LX0);
  let ticks = '';
  for (let v = a; v <= b; v += s) {
    const big = labels.includes(v) || v % (s * 5) === 0;
    ticks += `<path d="M${X(v)} ${big ? 90 : 96}v${big ? 26 : 14}" stroke="#33405a" stroke-width="${big ? 3 : 2}"/>`;
  }
  const size = labels.length > 6 ? (labels[labels.length - 1] >= 1000 ? 15 : 20) : 27;
  const text = labels.map(m => `<text x="${X(m)}" y="146" text-anchor="middle" font-size="${size}">${m}</text>`).join('');
  return `<div class="line-wrap" id="lw"><svg viewBox="0 0 640 160"><g id="seg"></g>
    <path d="M${LX0} 103H${LX1}" stroke="#33405a" stroke-width="5" stroke-linecap="round"/>${ticks}${text}
    <g id="truth"></g><g id="pin" style="display:none"></g></svg></div>`;
}
function viewLine(q) {
  if (q.mode === 'read') return viewLineRead(q);
  let st = { a: q.a, b: q.b, s: q.steps[0], first: true }, stageWrong = 0;
  const X = v => LX0 + (v - st.a) / (st.b - st.a) * (LX1 - LX0);
  function labels() {
    if (!st.first || (st.b - st.a) / st.s <= 10) { const out = []; for (let v = st.a; v <= st.b; v += st.s) out.push(v); return out; }
    if (!q.labelAll) return q.marks;
    const out = []; for (let v = q.a; v <= q.b; v += st.s) out.push(v); return out;
  }
  function stage() {
    const exact = q.v % st.s === 0;
    const prompt = exact ? `貨櫃編號 ${N(q.v)}！<br>點 ${N(q.v)} 的刻度。`
      : `貨櫃編號 ${N(q.v)}！<br>${st.first ? '先看千位，它在哪一段？' : '再看下一位，它在哪一段？'}`;
    frame(prompt, lineSvg(st.a, st.b, st.s, labels()) + (st.first ? '' : `<div class="trail">${nums(`放大看 ${st.a} 到 ${st.b}，一小格是 ${st.s}`)}</div>`));
    const wrap = document.getElementById('lw');
    let pick = null, active = true, down = false;
    const setFrom = e => {
      const r = wrap.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 640;
      const raw = st.a + (Math.max(LX0, Math.min(LX1, x)) - LX0) / (LX1 - LX0) * (st.b - st.a);
      if (exact) { pick = st.a + Math.round((raw - st.a) / st.s) * st.s; drawPin(X(pick), '#3b82c4'); }
      else {
        pick = Math.min(st.a + Math.floor((raw - st.a) / st.s) * st.s, st.b - st.s);
        document.getElementById('seg').innerHTML = `<rect x="${X(pick)}" y="78" width="${X(pick + st.s) - X(pick)}" height="50" rx="3" fill="#ffd65a"/>`;
      }
      document.getElementById('dig').disabled = false;
    };
    wrap.onpointerdown = e => { if (active) { down = true; setFrom(e); } };
    wrap.onpointermove = e => { if (active && down) setFrom(e); };
    window.onpointerup = () => { down = false; };
    const acts = document.getElementById('actions');
    acts.innerHTML = `<button class="btn" id="dig" disabled>${exact ? '放這裡' : '放大看看'}</button>`;
    const zoom = () => { const a = Math.floor(q.v / st.s) * st.s; st = { a, b: a + st.s, s: st.s / 10, first: false }; stageWrong = 0; stage(); };
    document.getElementById('dig').onclick = () => {
      const right = exact ? pick === q.v : pick === Math.floor(q.v / st.s) * st.s;
      if (right) {
        if (!exact) { sfx.ok(); return zoom(); }
        active = false;
        document.getElementById('pin').innerHTML = `<circle cx="${X(q.v)}" cy="103" r="8" fill="#3b82c4"/>`;
        drawTruth(X(q.v), q.v);
        return finish(R.tries === 0 ? 2 : R.tries === 1 ? 1 : 0, 'place', nums(`放對了！就是 ${q.v}！`));
      }
      R.tries++; stageWrong++; sfx.retry();
      const hint = exact ? nums(`你插在 ${pick}，${q.v} 比它${q.v > pick ? '大，再往右' : '小，再往左'}。一小格是 ${st.s}。`)
        : nums(`這一段是 ${pick} 到 ${pick + st.s}。${q.v} 比 ${q.v > pick ? pick + st.s : pick} ${q.v > pick ? '大，再往右' : '小，再往左'}。`);
      if (stageWrong < 2) return setMsg(hint, 'hint');
      active = false;
      if (exact) {
        document.getElementById('pin').innerHTML = `<circle cx="${X(pick)}" cy="103" r="8" fill="#3b82c4"/>`;
        drawTruth(X(q.v), q.v);
        return finish(0, { wrong: pick, ans: q.v }, nums(`貨櫃在這裡：${q.v}。`));
      }
      const a = Math.floor(q.v / st.s) * st.s;
      document.getElementById('seg').innerHTML = `<rect x="${X(a)}" y="78" width="${X(a + st.s) - X(a)}" height="50" rx="3" fill="#ffd65a"/>`;
      setMsg(nums(`${q.v} 在 ${a} 到 ${a + st.s} 這一段。`), 'hint');
      acts.innerHTML = '<button class="btn" id="dig">放大看看</button>';
      document.getElementById('dig').onclick = zoom;
    };
  }
  stage();
}
function viewLineRead(q) {
  const X = v => LX0 + (v - q.a) / (q.b - q.a) * (LX1 - LX0);
  frame(`船長的旗子插在這裡，<br>是多少？一小格是 ${N(q.unit)}。`, lineSvg(q.a, q.b, q.unit, q.marks));
  drawPin(X(q.v), '#d6476b');
  document.getElementById('actions').innerHTML = `<div class="choices">${q.options.map(o => `<button class="choice num" data-o="${o}">${o}</button>`).join('')}</div>`;
  document.querySelectorAll('.choice').forEach(b => {
    b.onclick = () => {
      const o = +b.dataset.o;
      if (o === q.v) return finish(R.tries === 0 ? 2 : R.tries === 1 ? 1 : 0, 'read', nums(`對了！就是 ${q.v}。`));
      R.tries++; b.classList.add('no'); b.disabled = true; sfx.retry();
      setMsg(nums(`${o} 應該在${o > q.v ? '更右邊' : '更左邊'}。從最近的標記開始，一格一格數。`), 'hint');
    };
  });
}
function nearestMark(q) {
  return q.marks.reduce((a, b) => Math.abs(b - q.v) < Math.abs(a - q.v) ? b : a);
}
function drawPin(x, color) {
  const p = document.getElementById('pin'); p.style.display = '';
  p.innerHTML = `<path d="M${x} 103V34" stroke="${color}" stroke-width="4"/><path d="M${x} 34l34 12-34 12z" fill="${color}"/><circle cx="${x}" cy="103" r="7" fill="${color}"/>`;
}
function drawTruth(x, v) {
  document.getElementById('truth').innerHTML = `<g class="pop" style="transform-box:fill-box;transform-origin:center">${HAS.chest ? `<image href="${artUrl('chest')}" x="${x - 32}" y="30" width="64" height="64"/>` : `<path d="M${x} 103l-13-30h26z" fill="#f5a524"/>`}<text x="${x}" y="26" text-anchor="middle" font-size="28" style="fill:#c9740c">${v}</text></g>`;
}

/* ---------- 共用：先動手再作答 ---------- */
const askDiv = '<div class="trail" id="ask"></div>';
const padHidden = () => `<div class="pad-wrap" hidden>${askDiv}${keypadHtml()}</div>`;
const setEl = (id, html) => { document.getElementById(id).innerHTML = html; };
function actionBtn(id, text, cls) { document.getElementById('actions').innerHTML = `<button class="btn ${cls || ''}" id="${id}">${text}</button>`; return document.getElementById(id); }
function afterAct(fn) { document.getElementById('actions').innerHTML = ''; document.querySelectorAll('.pad-wrap').forEach(x => { x.hidden = false; }); reveal('.pad-wrap'); fn(); }
function dragOn(wrap, cb, sel) { // 手指在圖上拖：回傳在圖形裡的相對位置 0～1
  wrap.classList.add('drag-prot');
  const read = e => { const g = sel ? wrap.querySelector(sel) : wrap.querySelector('svg'), b = g.getBoundingClientRect(); cb((e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height, e); };
  let on = false;
  wrap.onpointerdown = e => { on = true; try { wrap.setPointerCapture(e.pointerId); } catch (x) {} read(e); e.preventDefault(); };
  wrap.onpointermove = e => { if (on) read(e); };
  wrap.onpointerup = wrap.onpointercancel = () => { on = false; };
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
  else st.onclick = e => { if (!over && e.target.closest('svg, .pairs, .crates, .boxes, .groups, .lines, .fbars, .seq, .pv, .vs, .est') && !e.target.closest('button')) document.getElementById('gt').click(); };
}
/* ---------- 共用：一步一步輸入、選一個 ---------- */
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

/* ---------- 看得到的數：定位板與積木 ---------- */
function placeBoard(n, cols) {
  const names = cols || ['千', '百', '十', '一'], ds = String(n).padStart(names.length, ' ').split('');
  return `<table class="pv"><tr>${names.map((x, i) => `<th class="c${i}">${x}</th>`).join('')}</tr><tr>${ds.map((d, i) => `<td class="num c${i}">${d === ' ' ? '' : d}</td>`).join('')}</tr></table>`;
}
function blocks(k, h, t, o) {
  const cap = (n, cls) => '<i class="' + cls + '"></i>'.repeat(1) + ('<i class="' + cls + '"></i>').repeat(Math.max(0, n - 1));
  return `<div class="blocks">${k ? `<span class="bgroup">${cap(k, 'k1000')}</span>` : ''}${h ? `<span class="bgroup">${cap(h, 'k100')}</span>` : ''}${t ? `<span class="bgroup">${cap(t, 'k10')}</span>` : ''}${o ? `<span class="bgroup">${cap(o, 'k1')}</span>` : ''}</div>`;
}

/* ---------- 一：萬數大港 ---------- */
function viewPort(q) {
  if (q.mode === 'place') return viewLine(q);
  if (q.mode === 'word') {
    if (isFast(q)) {
      frame(`貨櫃單上寫著「${q.word}」，<br>是哪一個號碼？`, `<div class="trail">幾千、幾百、幾十、幾，一段一段聽</div>`);
      return pickOne(q.options.map(o => placeBoard(o)), q.options.indexOf(q.v), '一位一位對：唸到「零」表示那一位是 0。', `對了！${q.word}就是 ${q.v}。`, 'word');
    }
    const names = ['千', '百', '十', '一'], ds = [0, 0, 0, 0], want = String(q.v).padStart(4, '0');
    frame(`貨櫃單上寫著「${q.word}」，<br>把它撥到定位板上。`, '<div class="dial four" id="dial"></div>');
    const draw = () => {
      setEl('dial', names.map((x, i) => `<div class="dc c${i}"><small>${x}</small><button data-u="${i}" aria-label="${x}加一">＋</button><b class="num">${ds[i]}</b><button class="dn" data-d="${i}" aria-label="${x}減一">−</button></div>`).join(''));
      document.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { const i = +b.dataset.u; ds[i] = (ds[i] + 1) % 10; sfx.hop(); draw(); });
      document.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { const i = +b.dataset.d; ds[i] = (ds[i] + 9) % 10; sfx.hop(); draw(); });
    };
    draw();
    actionBtn('ok', '撥好了').onclick = () => {
      if (ds.join('') === want) return finish(R.tries === 0 ? 2 : R.tries === 1 ? 1 : 0, 'word', nums(`對了！${q.word}就是 ${q.v}。`));
      R.tries++; sfx.retry();
      if (R.tries >= 3) { document.querySelectorAll('#dial button').forEach(b => { b.disabled = true; }); return finish(0, { wrong: +ds.join(''), ans: q.v }, nums(`是 ${q.v}。`)); }
      const bad = ds.findIndex((d, i) => String(d) !== want[i]);
      setMsg(`${names[bad]}位不對。唸到「零」表示那一位是 0。`, 'hint');
    };
    return;
  }
  if (q.mode === 'cmp') {
    const a = q.l > q.r ? '＞' : q.l < q.r ? '＜' : '＝', L = String(q.l).padStart(4, '0'), Rr = String(q.r).padStart(4, '0'), first = [...L].findIndex((c, i) => c !== Rr[i]), names = ['千', '百', '十', '一'];
    const pb = (n, hi) => placeBoard(n).replace(new RegExp(`class="([^"]*c${hi})"`, 'g'), 'class="$1 hi"');
    const pic = hi => `<div class="vs">${pb(q.l, hi)}<span>和</span>${pb(q.r, hi)}</div>`;
    frame('哪一堆貨櫃比較多？<br>從最左邊的千位開始比。', `<div id="pv">${pic(0)}</div><div class="trail" id="ct"></div>`);
    const n = first < 0 ? 3 : first;
    return gate(q, names.slice(0, n).map(x => `${x}位一樣，比下一位`), n, k => { setEl('pv', pic(k)); }, () => pickOne(['＞', '＝', '＜'].map(numBtn), ['＞', '＝', '＜'].indexOf(a), '千位一樣再比百位，百位一樣再比十位。', `對了！${q.l} ${a} ${q.r}。`, 'cmp'));
  }
  let k = q.k, h = q.h, t = q.t;
  frame(`碼頭上有 ${q.text} 的貨，<br>共有多少？`, `<div id="bk"></div><div class="trade" id="tr"></div>${padHidden()}`);
  let opened = false;
  const askT = () => stepKeypad(['共有多少？'], [q.ans], `定位板每格都不超過 9，就讀得出來了。`, `對了！就是 ${q.ans}。`, 'trade');
  const check = () => { if (!opened && t < 10 && h < 10) { opened = true; setEl('tr', ''); setMsg('換好了，讀讀看！', 'good'); afterAct(askT); return true; } return false; };
  const draw = () => {
    document.getElementById('bk').innerHTML = blocks(k, h, t, 0) + placeBoard(k * 1000 + h * 100 + t * 10).replace(/<td class="num c(\d)">[^<]*<\/td>/g, (m, i) => `<td class="num c${i}">${[k, h, t, 0][+i] > 9 ? [k, h, t, 0][+i] : ([k, h, t, 0][+i] || '')}</td>`);
    document.getElementById('tr').innerHTML = `<button id="t1" ${t >= 10 ? '' : 'disabled'}>${nums('10個十→1個百')}</button><button id="t2" ${h >= 10 ? '' : 'disabled'}>${nums('10個百→1個千')}</button>`;
    document.getElementById('t1').onclick = () => { t -= 10; h++; sfx.hop(); draw(); check(); };
    document.getElementById('t2').onclick = () => { h -= 10; k++; sfx.hop(); draw(); check(); };
    document.querySelectorAll('.k10').forEach(b => { b.parentNode.onclick = () => { if (t >= 10) document.getElementById('t1').click(); }; });
    document.querySelectorAll('.k100').forEach(b => { b.parentNode.onclick = () => { if (h >= 10) document.getElementById('t2').click(); }; });
  };
  if (isFast(q)) { while (t >= 10) { t -= 10; h++; } while (h >= 10) { h -= 10; k++; } }
  draw();
  if (!check()) setMsg('點積木或按按鈕，滿 10 個就換一換。');
}

/* ---------- 二：千里航道 ---------- */
function routeSvg(q, pos, hideEnd) {
  const pts = [q.s, pos, ...(hideEnd ? [] : [q.t])], lo = Math.min(...pts), hi = Math.max(...pts), pad = Math.max(40, (hi - lo) * .12);
  const X = v => 26 + (v - (lo - pad)) / (hi - lo + 2 * pad) * 588;
  return `<svg class="route" viewBox="0 0 640 92"><path d="M10 58H630" stroke="#3b82c4" stroke-width="10" stroke-linecap="round" opacity=".28"/>
    <circle cx="${X(q.s)}" cy="58" r="7" fill="#77809a"/><text x="${X(q.s)}" y="88" text-anchor="middle" font-size="20" style="fill:#77809a">${q.s}</text>
    ${hideEnd ? '' : `<path d="M${X(q.t)} 58V26l22 8-22 8" fill="#d6476b" stroke="#d6476b" stroke-width="3"/><text x="${X(q.t)}" y="88" text-anchor="middle" font-size="20" style="fill:#d6476b">${q.t}</text>`}
    <text x="${X(pos)}" y="56" text-anchor="middle" font-size="34">⛵</text></svg>`;
}
function viewShip(q) {
  if (q.mode === 'est') {
    const parts = q.text.split(/[＋－]/).map(Number), plus = q.text.includes('＋'), near = parts.map(x => Math.round(x / 100) * 100);
    const pic = m => `<div class="est">${parts.map((p, i) => `<span class="est-b"><b class="num">${p}</b><i>↓</i><b class="num near">${i < m ? near[i] : '？'}</b></span>`).join(`<em>${plus ? '＋' : '－'}</em>`)}</div>`;
    frame('出海前先估一估：<br>答案大約是多少？', `<div class="fill-text num">${esc(q.text)}</div><div id="es">${pic(0)}</div><div class="trail">${nums('每個數先想成最接近的整百')}</div>`);
    return gate(q, ['第一個數取整百', '第二個數取整百'], 2, k => setEl('es', pic(k)), () => pickOne(q.options.map(numBtn), q.options.indexOf(q.ans), `${parts[0]} 最接近 ${near[0]}，${parts[1]} 最接近 ${near[1]}。`, `${q.why}大約是 ${q.ans}。`, 'est'));
  }
  const expr = q.mode === 'expr', name = ['千', '百', '十', '一'];
  frame(expr ? `船要開到 ${N(q.expr)} 的答案那裡。` : `船在 ${N(q.s)} 號浮標，<br>開到 ${N(q.t)} 號，最少幾段？`,
    `<div id="rt"></div><div class="odo" id="odo"></div><div class="trail" id="trail">還沒出發</div>`);
  let pos = q.s, done = false; const path = [];
  const draw = () => {
    document.getElementById('rt').innerHTML = routeSvg(q, pos, expr);
    const p4 = String(pos).padStart(4, '0'), ds = p4.length > 4 ? [p4.slice(0, -3), ...p4.slice(-3)] : [...p4]; // 超過 9999 時千位顯示 10，不要只顯示後四位
    document.getElementById('odo').innerHTML = [1000, 100, 10, 1].map((h, i) => `<div class="wheel c${i}"><button class="num" data-h="${h}" aria-label="加 ${h}">+${h}</button><b class="num">${ds[i]}</b><small>${name[i]}</small><button class="num dn" data-h="${-h}" aria-label="減 ${h}">−${h}</button></div>`).join('');
    document.getElementById('trail').innerHTML = path.length ? nums(path.map(sgn).join(' ') + `（${path.length} 段）`) : '還沒出發';
    document.querySelectorAll('#odo [data-h]').forEach(b => { if (done) { b.disabled = true; b.style.opacity = .35; } b.onclick = () => go(+b.dataset.h); });
  };
  const settle = () => {
    if (pos !== q.t) return false;
    done = true; draw();
    const g = path.length <= q.par ? 2 : 1;
    finish(g, { extra: path.length - q.par, s: q.s, t: q.t }, g === 2 ? nums(`到了！${path.length} 段，已經最短了！`) : nums(`到了！還可以更短：${q.best.map(sgn).join(' ')}（${q.par} 段）。`));
    return true;
  };
  const go = h => {
    if (done) return;
    const n = pos + h;
    if (n < 0 || n > 11000) return setMsg('開太遠了，換一條航線。', 'hint');
    pos = n; path.push(h); sfx.hop(); setMsg(''); draw();
    if (!expr) settle();
  };
  draw();
  document.getElementById('actions').innerHTML = `<button class="btn alt" id="undo">退一步</button>${expr ? '<button class="btn" id="arrive">到了</button>' : ''}`;
  document.getElementById('undo').onclick = () => { if (done || !path.length) return; pos -= path.pop(); draw(); };
  if (expr) document.getElementById('arrive').onclick = () => {
    if (settle()) return;
    R.tries++; sfx.retry();
    if (R.tries === 1) return setMsg(nums(`現在在 ${pos}。看算式：要${q.expr.includes('＋') ? '加' : '減'}多少？可以先開整數，再退回來。`), 'hint');
    done = true; draw(); finish(0, { wrong: pos, ans: q.t }, nums(`${q.expr}＝${q.t}。可以這樣開：${q.best.map(sgn).join(' ')}。`));
  };
}

/* ---------- 三：倍數工廠 ---------- */
function viewFact(q) {
  if (q.mode === 'est') {
    const c = Math.round(q.a / 100) * 100;
    frame(`${N(q.a + '×' + q.b)} 大約是多少？`, '<div class="trail" id="ct">不用算到個位，估一估就好</div>');
    return gate(q, `把 ${q.a} 想成整百`, 1, () => setEl('ct', nums(`${q.a} 大約是 ${c}`)), () => pickOne(q.options.map(numBtn), q.options.indexOf(q.ans), '先把被乘數想成整百。', q.why, 'est'));
  }
  if (q.mode === 'two') {
    const m = q.head.match(/\d+/g).map(Number), first = q.head[0] === '每', have = q.head[0] === '原';
    const pic = first ? Array.from({ length: m[1] }, () => `<span class="crate small"><b class="num">${m[0]}</b>顆</span>`) : have ? [`<span class="crate"><b class="num">${m[0]}</b>顆</span>`, `<span class="crate small"><b class="num">${m[1]}</b>顆</span>`] : [`<span class="crate"><b class="num">${m[0]}</b>顆</span>`, `<span class="crate ghost">吃掉 <b class="num">5</b></span>`];
    frame(q.head, `<div class="crates" id="cr"></div>${padHidden()}`);
    return gate(q, first ? '裝一盒' : '放上去', pic.length, k => setEl('cr', pic.slice(0, k).join('')), () => stepKeypad(q.asks, q.steps, q.why, `對了！答案是 ${q.steps[q.steps.length - 1]}。`, 'two', null, { shortcut: true }));
  }
  const row = q.parts.map((p, i) => `<span class="fbar p${i}" style="flex:${Math.max(p, q.a * .16)}">${'<span class="num">' + p + '</span>'}</span>`).join('');
  frame(`每條生產線做 ${N(q.a)} 個，<br>有 ${N(q.b)} 條，共幾個？`, `<div class="lines" id="lines">${Array.from({ length: q.b }, (_, i) => `<div class="fbars" id="fl${i}" style="visibility:hidden">${row}</div>`).join('')}</div>${padHidden()}`);
  const asks = q.parts.map(p => `${q.b} 條的 ${p}：${p}×${q.b}＝？`), steps = q.parts.map(p => p * q.b);
  if (q.parts.length > 1) { asks.push(`全部加起來：${steps.join('＋')}＝？`); steps.push(q.ans); }
  const lit = i => document.querySelectorAll('#lines .fbar').forEach(b => b.classList.toggle('lit', i >= q.parts.length || b.classList.contains('p' + i)));
  gate(q, '開動一條生產線', q.b, k => { document.getElementById('fl' + (k - 1)).style.visibility = 'visible'; }, () => { lit(0); stepKeypad(asks, steps, q.why, `對了！${q.a}×${q.b}＝${q.ans}。`, 'split', lit, { shortcut: true }); });
}

/* ---------- 四：毫米裁縫島 ---------- */
function rulerSvg(range, mm, showBar) {
  const X = v => 20 + v / range * 600;
  let t = '';
  for (let i = 0; i <= range; i++) {
    const c = i % 10 === 0, f = i % 5 === 0;
    t += `<path d="M${X(i)} 62v${c ? 30 : f ? 22 : 13}" stroke="#33405a" stroke-width="${c ? 3 : 1.4}"/>`;
    if (c) t += `<text x="${X(i)}" y="118" text-anchor="middle" font-size="26">${i / 10}</text>`;
  }
  return `<div class="line-wrap" id="lw"><svg viewBox="0 0 640 126"><rect id="ribbon" x="${X(0)}" y="26" width="${showBar ? X(mm) - X(0) : 0}" height="30" rx="2" fill="#e47f96"/>
    <rect x="${X(0) - 8}" y="60" width="${X(range) - X(0) + 16}" height="62" rx="4" fill="#f5deb3" opacity=".45"/>${t}</svg></div>`;
}
function viewMm(q) {
  if (q.mode === 'read') {
    frame(`這條緞帶多長？<br>把藍線拖到緞帶的尾巴。`, `<div id="rb">${rulerSvg(q.range, q.mm, true)}</div>${padHidden()}`);
    const ask = () => stepKeypad([`幾${q.unitText}？（尺上的數字是公分）`], [q.ans], q.unitText === '毫米' ? '大格一格是 1 公分，就是 10 毫米，小格一格是 1 毫米。' : '從 0 開始看，緞帶的尾巴對到幾？', `對了！是 ${q.ans} ${q.unitText}。`, 'read');
    if (isFast(q)) return afterAct(ask);
    const X = v => 20 + v / q.range * 600, wrap = document.getElementById('rb'), svg = wrap.querySelector('svg');
    svg.insertAdjacentHTML('beforeend', `<g id="mk"><path d="M${X(0)} 8V122" stroke="#2f5f9e" stroke-width="5"/><circle cx="${X(0)}" cy="14" r="13" fill="#ffd65a" stroke="#2f5f9e" stroke-width="4"/></g>`);
    let cur = 0, over = false;
    const go = v => { if (over) return; cur = Math.max(0, Math.min(q.range, v)); document.getElementById('mk').setAttribute('transform', `translate(${X(cur) - X(0)} 0)`); if (cur === q.mm) { over = true; wrap.onpointerdown = wrap.onpointermove = null; sfx.ok(); setMsg('對齊尾巴了！讀讀看。', 'good'); afterAct(ask); } };
    dragOn(wrap, x => { const v = Math.round((x * 640 - 20) / 600 * q.range); if (v !== cur) { sfx.hop(); go(v); } });
    actionBtn('gt', '往右一小格').onclick = () => { sfx.hop(); go(cur + 1); };
    return;
  }
  if (q.mode === 'cut') {
    frame(`剪一條 ${N(q.mm)} 毫米的緞帶！<br>拖到正確的刻度。`, rulerSvg(q.range, 0, true));
    const wrap = document.getElementById('lw'); let pick = 0, down = false;
    const setFrom = e => {
      const r = wrap.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 640;
      pick = Math.max(0, Math.min(q.range, Math.round((x - 20) / 600 * q.range)));
      document.getElementById('ribbon').setAttribute('width', pick / q.range * 600);
      document.getElementById('dig').disabled = false;
    };
    wrap.onpointerdown = e => { down = true; setFrom(e); };
    wrap.onpointermove = e => { if (down) setFrom(e); };
    window.onpointerup = () => { down = false; };
    document.getElementById('actions').innerHTML = '<button class="btn" id="dig" disabled>喀嚓</button>';
    document.getElementById('dig').onclick = () => {
      if (pick === q.mm) return finish(R.tries === 0 ? 2 : R.tries === 1 ? 1 : 0, 'cut', nums(`剛剛好！${q.mm} 毫米就是 ${Math.floor(q.mm / 10)} 公分 ${q.mm % 10} 毫米。`));
      R.tries++; sfx.retry();
      if (R.tries === 1) return setMsg(nums(`這是 ${pick} 毫米，${q.mm > pick ? '還要再長一點' : '太長了'}。`), 'hint');
      document.getElementById('dig').disabled = true; wrap.onpointerdown = null;
      document.getElementById('ribbon').setAttribute('width', q.mm / q.range * 600);
      finish(0, { wrong: pick, ans: q.mm }, nums(`${q.mm} 毫米在這裡：${Math.floor(q.mm / 10)} 大格再 ${q.mm % 10} 小格。`));
    };
    return;
  }
  if (q.mode === 'to') {
    const mm = q.ans, range = Math.min(160, (q.c + 1) * 10);
    frame(`緞帶長 ${nums(q.text)}，<br>是幾毫米？`, `<div id="rb">${rulerSvg(range, 0, true)}</div>${padHidden()}`);
    return gate(q, [`拉出 ${q.c} 公分`, `再拉 ${q.m} 毫米`], 2, k => setEl('rb', rulerSvg(range, k === 1 ? q.c * 10 : mm, true)), () => stepKeypad([`${q.c} 公分是幾毫米？`, `再加 ${q.m} 毫米是多少？`], [q.c * 10, q.ans], q.why, `對了！是 ${q.ans} 毫米。`, 'to', null, { shortcut: true }));
  }
  if (q.mode === 'from') {
    const range = Math.min(170, (q.steps[0] + 1) * 10);
    frame(`緞帶長 ${N(q.n)} 毫米，<br>是幾公分幾毫米？`, `<div id="rb">${rulerSvg(range, 0, true)}</div><div class="trail" id="ct">每 10 毫米是 1 大格</div>${padHidden()}`);
    return gate(q, '量 1 大格', q.steps[0] + (q.steps[1] ? 1 : 0), k => { const big = Math.min(k, q.steps[0]), len = k > q.steps[0] ? q.n : big * 10; setEl('rb', rulerSvg(range, len, true)); setEl('ct', nums(k > q.steps[0] ? `${big} 大格，再多 ${q.steps[1]} 小格` : `量了 ${big} 大格`)); }, () => stepKeypad(['尺上走了幾大格？（幾公分）', '還多幾小格？（幾毫米）'], q.steps, q.why, `對了！${q.steps[0]} 公分 ${q.steps[1]} 毫米。`, 'from'));
  }
  frame(q.text, `<div class="u-big">${q.e}</div><div class="trail">想想看真的東西有多大</div>`);
  pickOne(q.options.map(o => nums(o)), q.options.indexOf(q.ans), '1 毫米很小很小，1 公分大約是小指頭的寬，1 公尺大約是張開雙手。', q.why, 'guess');
}

/* ---------- 五：角角山 ---------- */
function angleSvg(d, len, tilt, ref) {
  const cx = 44, cy = 92, rad = a => (a - (tilt || 0)) * Math.PI / 180;
  const p = (a, r) => [cx + r * Math.cos(rad(a)), cy - r * Math.sin(rad(a))];
  const [x1, y1] = p(0, len), [x2, y2] = p(d, len), [a1, b1] = p(0, 20), [a2, b2] = p(d, 20);
  const large = d > 180 ? 1 : 0;
  let over = '';
  if (ref === 'right') { const [r1, s1] = p(0, 92), [r2, s2] = p(90, 92), [m1, n1] = p(0, 16), [m2, n2] = p(90, 16), [c1, c2] = p(45, 16 * Math.SQRT2); over = `<polygon points="${cx},${cy} ${r1},${s1} ${r2},${s2}" fill="#3b82c4" fill-opacity=".18" stroke="#3b82c4" stroke-width="2" stroke-dasharray="5 4"/><path d="M${m1} ${n1}L${c1} ${c2}L${m2} ${n2}" fill="none" stroke="#3b82c4" stroke-width="2"/>`; }
  else if (typeof ref === 'number') { const [o1, o2] = p(ref, len + 12); over = `<path d="M${cx} ${cy}L${o1} ${o2}" stroke="#d9772b" stroke-width="4" stroke-dasharray="6 4" stroke-linecap="round"/>`; }
  return `<svg class="ang" viewBox="-20 -30 180 150">${over}<path d="M${a1} ${b1}A20 20 0 ${large} 0 ${a2} ${b2}" fill="none" stroke="#d6476b" stroke-width="3"/><path d="M${x1} ${y1}L${cx} ${cy}L${x2} ${y2}" fill="none" stroke="#33405a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
/* 周長：菜園圍籬笆，小羊沿著邊走 */
function perimPic(w, h, t, grid, nums2) {
  const s = Math.min(240 / w, 120 / h, 40), W = w * s, H = h * s, x0 = (320 - W) / 2, y0 = (170 - H) / 2, P = 2 * (W + H);
  let r = t * P, x = x0, y = y0, d = `M${x0} ${y0}`, g = '';
  [[1, 0, W], [0, 1, H], [-1, 0, W], [0, -1, H]].forEach(([a, b, n]) => { const m = Math.min(r, n); x += a * m; y += b * m; if (m > 0) d += `L${x} ${y}`; r -= m; });
  if (grid) { for (let i = 0; i <= w; i++) for (let j = 0; j <= h; j++) if (i === 0 || j === 0 || i === w || j === h) g += `<circle cx="${x0 + i * s}" cy="${y0 + j * s}" r="3.5" fill="#33405a"/>`; }
  return c3s(`<rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="#cfe6c6" stroke="#7a9a62" stroke-width="3"/>${g}<path d="${d}" fill="none" stroke="#d6476b" stroke-width="6" stroke-linejoin="round"/>${nums2 ? c3t(160, y0 - 11, w, 18) + c3t(x0 - 14, 85, h, 18) : ''}${c3e(x, y, '🐑', 26)}`);
}
function pullPic(q, t) { // 兩塊地的繩子，拉直來比
  const C = ['#d6476b', '#3b82c4'], sh = (R, x, c) => `<rect x="${x}" y="8" width="${R[0] * 16}" height="${R[1] * 16}" fill="${c}" fill-opacity=".12" stroke="${c}" stroke-width="4"/>${c3t(x + R[0] * 8, 8 + R[1] * 16 + 12, R[0], 14)}${c3t(x + R[0] * 16 + 9, 8 + R[1] * 8, R[1], 14)}`;
  let o = t ? '' : sh(q.A, 22, C[0]) + sh(q.B, 180, C[1]);
  if (t) [q.A, q.B].forEach((R, i) => { const L = 2 * (R[0] + R[1]); o += `<path d="M14 ${50 + i * 62}H${14 + L * 11.5}" stroke="${C[i]}" stroke-width="9" stroke-linecap="round"/>${c3t(14 + L * 11.5 + 14, 50 + i * 62, L, 16)}`; });
  return c3s(o);
}
function viewPerim(q) {
  if (q.mode === 'pwalk') {
    frame('小羊沿著菜園的邊走一圈，<br>一小段是 1 公尺。共走幾公尺？', `<div class="cp" id="pw">${perimPic(q.w, q.h, 0, true)}</div><div class="trail" id="ct">拖小羊走，看紅線</div>${padHidden()}`);
    return gate(q, ['走半圈', '走完一圈'], 2, k => { setEl('pw', perimPic(q.w, q.h, k / 2, true)); setEl('ct', k === 2 ? '回到原點了，數數紅線！' : nums(`走了半圈：${q.w}＋${q.h}`)); }, () => stepKeypad(['一圈是幾公尺？'], [q.ans], q.why, `對了！一圈是 ${q.ans} 公尺。`, 'pwalk'), { el: document.getElementById('pw'), map: x => x * 2 });
  }
  if (q.mode === 'padd') {
    frame(q.square ? `花圃是正方形，每邊 ${N(q.w)} 公尺，<br>要圍一圈籬笆。要買幾公尺？` : `菜園長 ${N(q.w)} 公尺、寬 ${N(q.h)} 公尺，<br>要圍一圈籬笆。要買幾公尺？`, `<div class="cp" id="pw">${perimPic(q.w, q.h, 0, false, true)}</div><div class="trail" id="ct">拖小羊沿著邊走</div>${padHidden()}`);
    return gate(q, '沿著邊走一圈', 1, () => { setEl('pw', perimPic(q.w, q.h, 1, false, true)); setEl('ct', q.square ? '4 條邊都一樣長' : '長和寬各走了兩次'); }, () => stepKeypad(q.square ? ['一圈是幾公尺？'] : ['走半圈：長＋寬是幾公尺？', '走一圈是幾公尺？'], q.steps, q.why, `對了！要買 ${q.steps[q.steps.length - 1]} 公尺。`, 'padd', null, { shortcut: true }), { el: document.getElementById('pw'), map: x => x });
  }
  frame('兩塊地各用一條繩子圍起來。<br>拉直以後，哪一條比較長？', `<div class="cp" id="pw">${pullPic(q, 0)}</div><div class="trail" id="ct">拖一拖，把繩子拉直</div>`);
  const la = 2 * (q.A[0] + q.A[1]), lb = 2 * (q.B[0] + q.B[1]);
  gate(q, '把繩子拉直', 1, () => { setEl('pw', pullPic(q, 1)); setEl('ct', '看起來大的地，繩子不一定長'); }, () => pickOne(['紅色', '藍色'], q.ans, '看拉直以後的長度，不是看地多大。', `對了！紅色 ${la} 公尺，藍色 ${lb} 公尺。`, 'pline'), { el: document.getElementById('pw'), map: x => x });
}
function viewAngle(q) {
  if (['pwalk', 'padd', 'pline'].includes(q.mode)) return viewPerim(q);
  if (q.mode === 'cmp') {
    frame('哪一個角比較大？<br>疊起來比比看。', `<div class="vs" id="av">${angleSvg(q.a, q.la)}${angleSvg(q.b, q.lb)}</div>`);
    return gate(q, '把兩個角疊起來', 1, () => { setEl('av', angleSvg(q.a, 85, 0, q.b)); setMsg('黑線是左邊的角，橘色虛線是右邊的角。看誰張得比較開。'); }, () => pickOne(['左邊的角', '右邊的角'], q.ans === 'L' ? 0 : 1, '不要看邊多長，看兩條邊張開多少。', `對了！${q.why}`, 'cmp'));
  }
  if (q.mode === 'kind') {
    frame('這是什麼角？<br>拿三角板的直角來比一比。', `<div class="cake-wrap" id="av">${angleSvg(q.d, 85, q.tilt)}</div>`);
    const ks = ['acute', 'right', 'obtuse'];
    return gate(q, '📐 放上三角板', 1, () => { setEl('av', angleSvg(q.d, 85, q.tilt, 'right')); setMsg('藍色是三角板的直角。紅色的角比它小、一樣，還是大？'); }, () => pickOne(['銳角', '直角', '鈍角'], ks.indexOf(q.ans), '拿直角來比：比直角小是銳角，比直角大是鈍角。', { acute: '對了！比直角小，是銳角。', right: '對了！剛好是直角。', obtuse: '對了！比直角大，是鈍角。' }[q.ans], 'kind'));
  }
  const s = q.skew || 0, W = q.w, H = q.h;
  const pts = `${10 + s},10 ${10 + s + W},10 ${10 + W},${10 + H} 10,${10 + H}`;
  frame('這個圖形是什麼？先量量看。', `<div class="cake-wrap"><svg class="ang" viewBox="0 0 ${W + s + 20} ${H + 20}"><polygon points="${pts}" fill="#fde8c8" stroke="#33405a" stroke-width="4"/></svg></div><div class="trail" id="ct"></div>`);
  const ks = ['square', 'rect', 'none'], facts = [];
  gate(q, ['📐 量四個角', '📏 量四個邊'], 2, k => { facts.push(k === 1 ? (s ? '角不是直角' : '4 個角都是直角') : (W === H ? '4 個邊差不多一樣長' : '對邊一樣長，長邊和短邊不一樣')); setEl('ct', facts.join('；')); }, () => pickOne(['正方形', '長方形', '都不是'], ks.indexOf(q.ans), '四個角都要是直角。再看四個邊是不是一樣長。', { square: '對了！四個角都是直角，四個邊一樣長。', rect: '對了！四個角都是直角，兩雙對邊一樣長。', none: '對了！它的角不是直角，所以都不是。' }[q.ans], 'shape'));
}

/* ---------- 六：分分海灘 ---------- */
function shellDots(n) { return '<span class="sh"></span>'.repeat(n); }
function viewDiv(q) {
  if (q.mode === 'deal') {
    const sign = q.signless ? `${q.total} 個貝殼，平分給 ${q.b} 個人` : `${q.total}÷${q.b}`;
    frame(`${N(sign).replace('class="num"', 'class="num small"')}<br>每人幾個？${q.r ? '還剩幾個？' : ''}`, `<div class="pile-c" id="pile"></div><div class="boxes" id="boxes"></div><div class="trade"><button id="deal">每人發一個</button></div>${padHidden()}`);
    let left = q.total, rounds = 0;
    const draw = () => {
      document.getElementById('pile').innerHTML = left ? shellDots(left) : '<span class="note">分完了！</span>';
      document.getElementById('boxes').innerHTML = Array.from({ length: q.b }, () => `<div class="box">${shellDots(rounds)}</div>`).join('');
      const more = left >= q.b;
      document.getElementById('deal').style.display = more ? '' : 'none';
      if (!more && !opened) { opened = true; setMsg(q.r ? '分不夠一輪了！按數字回答。' : '分完了！按數字回答。', 'good'); afterAct(askD); }
    };
    let opened = false;
    const asks = q.r ? ['每人幾個？（商）', '還剩幾個？（餘數）'] : ['每人幾個？'];
    const askD = () => stepKeypad(asks, q.steps, '真的分分看。分不夠一輪的，就是餘數。', q.r ? `${q.total}÷${q.b}＝${q.q}…${q.r}。` : `對了！${q.b}×${q.q}＝${q.total}。`, 'deal');
    if (isFast(q)) { left = q.r; rounds = q.q; }
    document.getElementById('deal').onclick = () => { if (left >= q.b) { left -= q.b; rounds++; sfx.hop(); draw(); } };
    tapAlso('pile', 'deal');
    draw();
    return;
  }
  if (q.mode === 'odd') {
    const pairs = Math.floor(q.n / 2), rows = q.n <= 20;
    frame(`${N(q.n)} 是偶數還是奇數？`, `<div id="pr" class="vs"></div><div class="trail" id="ct">${rows ? '' : '數字太大，看個位就好'}</div>`);
    return gate(q, rows ? '兩個兩個配對' : '看個位', 1, () => { if (rows) setEl('pr', `<div class="pairs">${'<span class="pair"><i></i><i></i></span>'.repeat(pairs)}${q.n % 2 ? '<span class="pair one"><i></i></span>' : ''}</div>`); else setEl('ct', nums(`個位是 ${q.n % 10}`)); }, () => pickOne(['偶數', '奇數'], q.ans === 'even' ? 0 : 1, '兩個兩個一組，剛好分完是偶數；個位是 0、2、4、6、8。', q.ans === 'even' ? '對了！兩個兩個分得完，是偶數。' : '對了！兩個兩個分，會多一個，是奇數。', 'odd'));
  }
  if (q.mode === 'split') {
    const [a, b] = q.parts.map(p => p / q.d), box = m => Array.from({ length: q.d }, () => `<div class="box">${m ? nums(String(m)) : '🙂'}</div>`).join('');
    frame(`${N(q.total)} 個貝殼分給 ${N(q.d)} 個人（${N(q.total + '÷' + q.d)}），<br>先分大包，再分小包。`, `<div class="fbars"><span class="fbar p0" style="flex:3"><span class="num">${q.parts[0]}</span></span><span class="fbar p1" style="flex:1"><span class="num">${q.parts[1]}</span></span></div><div class="boxes" id="bx">${box(0)}</div>${padHidden()}`);
    return gate(q, ['分大包', '再分小包'], 2, k => setEl('bx', box(k === 1 ? a : a + b)), () => stepKeypad([`${q.parts[0]}÷${q.d}＝？`, `${q.parts[1]}÷${q.d}＝？`, `${a}＋${b}＝？`], [a, b, q.ans], q.why, `對了！${q.total}÷${q.d}＝${q.ans}。`, 'split', null, { shortcut: true }));
  }
  if (q.mode === 'missing') {
    frame(`${q.say}`, `<div class="fill-text num">${esc(q.text)}</div><div class="groups" id="gr"></div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, '放一份', q.n, k => { setEl('gr', Array.from({ length: k }, () => `<span class="box">${shellDots(q.per)}</span>`).join('')); setEl('ct', nums(`放了 ${k} 份`)); }, () => stepKeypad(['□＝？'], [q.ans], q.why, `對了！${q.why}`, 'missing'));
  }
  if (q.mode === 'check') {
    frame(`${N(q.text)}＝${N(q.q)}…${N(q.r)}<br>驗算：${N(q.q + '×' + q.b + '＋' + q.r)} 是多少？`, `<div class="boxes" id="bx"></div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, [...new Array(q.b).fill('放回一人份'), '放回剩下的'], q.b + 1, k => { setEl('bx', Array.from({ length: Math.min(k, q.b) }, () => `<div class="box"><b class="num">${q.q}</b></div>`).join('') + (k > q.b ? `<div class="box"><b class="num">${q.r}</b></div>` : '')); }, () => stepKeypad(['全部幾個？'], [q.ans], q.why, `對了！${q.why}`, 'check'));
  }
  const zero = q.text[0] === '0';
  frame('□ 是多少？', `<div class="fill-text num">${esc(q.text)}</div><div class="boxes" id="bx"></div><div class="trail" id="ct"></div>${padHidden()}`);
  gate(q, '分分看', 1, () => { const d = q.text.split('÷').map(Number); setEl('bx', zero ? Array.from({ length: d[1] }, () => '<div class="box"><b class="num">0</b></div>').join('') : `<div class="box"><b class="num">${d[0]}</b></div>`); setEl('ct', zero ? '沒有東西可以分' : '全部都給這 1 個人'); }, () => stepKeypad([`${q.text}＝？`], [q.ans], q.why, `對了！${q.why}`, 'rule'));
}

/* ---------- 七：規律花園 ---------- */
function viewRule(q) {
  if (q.mode === 'grow') {
    const flower = n => `<span class="flower">${'<i></i>'.repeat(n)}</span>`, tb = m => `<table class="seq-t"><tr><th>朵</th>${Array.from({ length: m }, (_, i) => `<td>${i + 1}</td>`).join('')}</tr><tr><th>片</th>${Array.from({ length: m }, (_, i) => `<td>${q.unitN * (i + 1)}</td>`).join('')}</tr></table>`;
    frame(`一朵花 ${N(q.unitN)} 片花瓣，<br>${N(q.k)} 朵共有幾片？`, `<div class="pairs" id="fw"></div><div id="tb"></div>${padHidden()}`);
    const shown = Math.min(3, q.k);
    return gate(q, '再開一朵花', shown, k => { setEl('fw', flower(q.unitN).repeat(k) + (k === shown && q.k > shown ? '<b class="dots">⋯⋯</b>' : '')); setEl('tb', tb(k)); }, () => stepKeypad([`${q.k} 朵是幾片？`], [q.ans], q.why, `對了！${q.why}`, 'grow'));
  }
  const diff = (x, y) => (y > x ? '＋' : '－') + Math.abs(y - x);
  const chain = m => q.seq.map((x, i) => `<b class="num">${x}</b>${i < q.seq.length - 1 ? `<em class="hop num">${i < m ? diff(x, q.seq[i + 1]) : '？'}</em>` : '<em class="hop q num">？</em>'}`).join('');
  frame('花盆上的號碼有規律，<br>下一盆是幾號？', `<div class="seq" id="sq">${chain(0)}<b class="num q">？</b></div><div class="trail">看看每一步多了或少了多少</div>${padHidden()}`);
  gate(q, '量下一步差多少', q.seq.length - 1, k => setEl('sq', chain(k) + '<b class="num q">？</b>'), () => stepKeypad(['下一個數？'], [q.ans], '先看相鄰兩個數差多少。', `對了！${q.why}`, 'seq'));
}

/* ---------- 八：分數烘焙坊 ---------- */
const fracHtml = (a, n) => `<span class="frac num"><i>${a}</i><i>${n}</i></span>`;
function fbar(n, a, id) {
  return `<div class="fcells" ${id ? `id="${id}"` : ''}>${Array.from({ length: n }, (_, i) => `<button class="fcell ${i < a ? 'on' : ''}" data-c="${i}" aria-label="第 ${i + 1} 塊"></button>`).join('')}</div>`;
}
const SLICE = { a: '#d6476b', b: '#f0a03c', g: '#ffffff', '': '#fff0cf' };
function pieSvg(n, states, from, nums2) { // states：每塊的狀態；每一塊都可以點
  const P = i => { const t = i / n * 2 * Math.PI - Math.PI / 2; return `${60 + 54 * Math.cos(t)} ${60 + 54 * Math.sin(t)}`; };
  let s = '<svg class="pie" viewBox="0 0 120 120"><circle cx="60" cy="60" r="57" fill="#c98f4a"/>';
  for (let i = 0; i < n; i++) {
    const st = states[i] || '', idx = (from || 0) + i;
    if (n === 1) { s += `<circle cx="60" cy="60" r="54" data-s="${idx}" fill="${SLICE[st]}" stroke="#a9702a" stroke-width="2"/>`; continue; }
    s += `<path data-s="${idx}" d="M60 60L${P(i)}A54 54 0 0 1 ${P(i + 1)}Z" fill="${SLICE[st]}" stroke="#a9702a" stroke-width="2" ${st === 'g' ? 'stroke-dasharray="4 3"' : ''}/>`;
    if (nums2 && nums2[i]) { const t = (i + .5) / n * 2 * Math.PI - Math.PI / 2; s += `<text x="${60 + 34 * Math.cos(t)}" y="${60 + 34 * Math.sin(t) + 6}" text-anchor="middle" font-size="17" style="fill:#33405a;pointer-events:none">${nums2[i]}</text>`; }
  }
  return s + '</svg>';
}
function piesHtml(n, states) { // 超過一個派就畫下一個
  const out = [], count = Math.max(1, Math.ceil(states.length / n));
  for (let k = 0; k < count; k++) out.push(pieSvg(n, states.slice(k * n, k * n + n), k * n));
  return out.join('');
}
const pieWith = (n, a) => `<span class="pie-w">${pieSvg(n, Array.from({ length: n }, (_, i) => i < a ? 'a' : ''))}${fracHtml(a, n)}</span>`;
// 同一種操作題連續 3 次第一次就對，就跳過操作；答錯一次就回到動手做
const isFast = q => ((S.fast || {})[q.kind + ':' + q.mode] || 0) >= 3;
function viewFrac(q) {
  const graded = () => R.tries === 0 ? 2 : R.tries === 1 ? 1 : 0, fast = isFast(q);
  if ((q.mode === 'unit' || q.mode === 'name') && fast) {
    const set = new Set([q.n]); for (const x of Logic.shuffle([q.a + 1, q.a + 2, q.a + 3, q.a + 4])) if (set.size < 3) set.add(x); // 分母一定比分子大，不可用隨機重抽，11/12 會卡死
    const opts = Logic.shuffle([...set]);
    frame('紅色是幾分之幾個派？', `<div class="cake-wrap">${pieSvg(q.n, Array.from({ length: q.n }, (_, i) => i < q.a ? 'a' : ''))}</div>`);
    return pickOne(opts.map(x => fracHtml(q.a, x)), opts.indexOf(q.n), '數數看全部幾塊，那就是分母。', `對了！平分成 ${q.n} 塊，紅色 ${q.a} 塊。`, 'name');
  }
  if (q.mode === 'accum' && fast) {
    const alts = [[q.a, q.n], [q.a < q.n ? q.a + 1 : q.a - 1, q.n], [1, q.n]], opts = Logic.shuffle(alts);
    frame(`${N(q.a)} 個 ${fracHtml(1, q.n)} 是多少？`, `<div class="cake-wrap">${pieSvg(q.n, Array.from({ length: q.n }, (_, i) => i < q.a ? 'a' : ''))}</div>`);
    return pickOne(opts.map(o => fracHtml(o[0], o[1])), opts.indexOf(alts[0]), '分母不變，幾個 1/幾，分子就是幾。', q.whole ? `對了！${q.n} 個 1/${q.n} 就是 1 個完整的派。` : `對了！就是 ${q.a}/${q.n}。`, 'accum');
  }
  if (q.mode === 'unit' || q.mode === 'name') {
    // 一塊一塊點著數，再自己組出分數
    frame('紅色是幾分之幾個派？<br>點派一塊一塊數，再調整分數。', `<div class="pie-row"><div id="pp"></div><div class="fb">
      <div class="fb-row"><button data-fb="a-">−</button><b class="num" id="fa">1</b><button data-fb="a+">＋</button><small>紅色幾塊</small></div>
      <hr><div class="fb-row"><button data-fb="d-">−</button><b class="num" id="fd">1</b><button data-fb="d+">＋</button><small>全部幾塊</small></div></div></div>`);
    let a = 1, d = 1, tally = 0; const marks = new Array(q.n).fill(0);
    const states = Array.from({ length: q.n }, (_, i) => i < q.a ? 'a' : '');
    const drawPie = () => {
      document.getElementById('pp').innerHTML = pieSvg(q.n, states, 0, marks);
      document.querySelectorAll('#pp [data-s]').forEach(s => s.onclick = () => { const i = +s.dataset.s; if (!marks[i]) { marks[i] = ++tally; sfx.hop(); setMsg(nums(`數到第 ${tally} 塊了。`)); drawPie(); } });
    };
    drawPie();
    document.querySelectorAll('[data-fb]').forEach(b => b.onclick = () => {
      const k = b.dataset.fb; if (k === 'a+') a = Math.min(12, a + 1); if (k === 'a-') a = Math.max(1, a - 1); if (k === 'd+') d = Math.min(12, d + 1); if (k === 'd-') d = Math.max(1, d - 1);
      document.getElementById('fa').textContent = a; document.getElementById('fd').textContent = d; sfx.hop();
    });
    document.getElementById('actions').innerHTML = '<button class="btn" id="ok">上菜</button>';
    document.getElementById('ok').onclick = () => {
      if (a === q.a && d === q.n) return finish(graded(), 'name', nums(`對了！平分成 ${q.n} 塊，紅色 ${q.a} 塊，就是 ${q.a}/${q.n} 個派。`));
      R.tries++; sfx.retry();
      if (R.tries >= 3) return finish(0, { wrong: `${a}/${d}`, ans: `${q.a}/${q.n}` }, nums(`答案是 ${q.a}/${q.n}：全部 ${q.n} 塊在下面，紅色 ${q.a} 塊在上面。`));
      setMsg(d !== q.n ? '下面的數是全部幾塊。把每一塊都點一遍數數看。' : '上面的數是紅色有幾塊。', 'hint');
    };
    return;
  }
  if (q.mode === 'make') {
    // 自己切派、自己拿
    frame(`客人要 ${fracHtml(q.a, q.n)} 個派。<br>${fast ? '派切好了，' : '先切好，再'}點要給客人的塊。`, `<div class="cake-wrap" id="pp"></div>${fast ? '' : '<div class="trade"><button id="less">少切一刀</button><button id="more">多切一刀</button></div>'}<div class="trail num" id="now"></div>`);
    let n = fast ? q.n : 1; const on = new Set();
    const draw = () => {
      document.getElementById('pp').innerHTML = pieSvg(n, Array.from({ length: n }, (_, i) => on.has(i) ? 'a' : ''));
      document.getElementById('now').innerHTML = nums(`切成 ${n} 塊，拿了 ${on.size} 塊`);
      document.querySelectorAll('#pp [data-s]').forEach(s => s.onclick = () => { const i = +s.dataset.s; on.has(i) ? on.delete(i) : on.add(i); sfx.hop(); draw(); });
    };
    if (!fast) {
      document.getElementById('more').onclick = () => { if (n < 12) { n++; on.clear(); sfx.hop(); draw(); } };
      document.getElementById('less').onclick = () => { if (n > 1) { n--; on.clear(); sfx.hop(); draw(); } };
    }
    draw();
    document.getElementById('actions').innerHTML = '<button class="btn" id="ok">端給客人</button>';
    document.getElementById('ok').onclick = () => {
      if (n === q.n && on.size === q.a) return finish(graded(), 'make', nums(`對了！切成 ${q.n} 塊（分母），拿 ${q.a} 塊（分子）。`));
      R.tries++; sfx.retry();
      if (R.tries >= 3) return finish(0, { wrong: `${on.size}/${n}`, ans: `${q.a}/${q.n}` }, nums(`要切成 ${q.n} 塊，拿 ${q.a} 塊。`));
      setMsg(n !== q.n ? nums(`分數下面是 ${q.n}，所以要切成 ${q.n} 塊。`) : nums(`分數上面是 ${q.a}，所以要拿 ${q.a} 塊。`), 'hint');
    };
    return;
  }
  if (q.mode === 'accum') {
    // 一塊一塊放進盤子，分數跟著長大
    frame(`每塊是 ${fracHtml(1, q.n)} 個派，<br>放 ${N(q.a)} 塊到盤子上。`, `<div class="cake-wrap" id="pp"></div><div class="trail num" id="now"></div><div class="trade"><button id="back">拿回一塊</button><button id="put">再放一塊</button></div>`);
    let k = 0;
    const draw = () => {
      document.getElementById('pp').innerHTML = pieSvg(q.n, Array.from({ length: q.n }, (_, i) => i < k ? 'a' : ''));
      document.getElementById('now').innerHTML = k ? `${N(k)} 個 ${fracHtml(1, q.n)} 是 ${fracHtml(k, q.n)}${k === q.n ? '，就是 1 個派！' : ''}` : '盤子是空的';
    };
    document.getElementById('put').onclick = () => { if (k < q.n) { k++; sfx.hop(); draw(); } };
    document.getElementById('back').onclick = () => { if (k > 0) { k--; sfx.hop(); draw(); } };
    draw();
    document.getElementById('actions').innerHTML = '<button class="btn" id="ok">放好了</button>';
    document.getElementById('ok').onclick = () => {
      if (k === q.a) return finish(graded(), 'accum', nums(q.whole ? `對了！${q.n} 個 1/${q.n} 就是 1 個完整的派。` : `對了！${q.a} 個 1/${q.n} 就是 ${q.a}/${q.n}。`));
      R.tries++; sfx.retry();
      if (R.tries >= 3) return finish(0, { wrong: k, ans: q.a }, nums(`要放 ${q.a} 塊。`));
      setMsg(nums(`現在 ${k} 塊，要 ${q.a} 塊。`), 'hint');
    };
    return;
  }
  if (q.mode === 'cmp') {
    frame('每塊一樣大，<br>點派比較多的那一盤。', '<div class="trail">分母一樣，數紅色幾塊就好</div>');
    return pickOne([pieWith(q.n, q.a), pieWith(q.n, q.b)], q.ans === 'L' ? 0 : 1, '每塊一樣大，數數看哪一盤的紅色比較多。', '對了！分母一樣，分子大的比較多。', 'cmp');
  }
  // 加法：一塊一塊放進去；減法：一塊一塊吃掉；動手做完才回答
  const add = q.mode === 'add', st = Array.from({ length: add ? q.a : q.a }, () => 'a');
  frame(`${fracHtml(q.a, q.n)} ${add ? '＋' : '－'} ${fracHtml(q.b, q.n)}<br>${fast ? '算算看，現在有幾塊？' : add ? `再放 ${N(q.b)} 塊上去。` : `點派，吃掉 ${N(q.b)} 塊。`}`,
    `<div class="vs" id="pp"></div>${add && !fast ? '<div class="trade"><button id="put">再放一塊</button></div>' : ''}<div class="trail num" id="now"></div><div id="kp" hidden>${keypadHtml()}</div><div class="trail" id="ask" hidden></div>`);
  let done = 0, opened = false;
  const pad = arr => { const out = arr.slice(); while (out.length % q.n) out.push(''); return out; };
  const open = () => {
    if (opened) return; opened = true;
    document.getElementById('kp').hidden = false; document.getElementById('ask').hidden = false;
    setMsg('數一數，按數字回答。', 'good'); reveal('#kp');
    stepKeypad([`現在有幾塊？（答案是 □/${q.n}）`], [q.ans], `數一數${add ? '紅色和橘色' : '還留著的紅色'}共幾塊。`, `對了！答案是 ${q.ans}/${q.n}${q.ans === q.n ? '，剛好 1 個派' : q.ans > q.n ? `，比 1 個派多 ${q.ans - q.n} 塊` : ''}。`, q.mode);
  };
  const draw = () => {
    document.getElementById('pp').innerHTML = piesHtml(q.n, pad(st));
    const left = q.b - done;
    document.getElementById('now').innerHTML = left > 0 ? nums(add ? `還要放 ${left} 塊` : `還要吃 ${left} 塊`) : nums(add ? '放好了！' : '吃完了！');
    if (!add) document.querySelectorAll('#pp [data-s]').forEach(s => s.onclick = () => { const i = +s.dataset.s; if (st[i] === 'a' && done < q.b) { st[i] = 'g'; done++; sfx.hop(); draw(); if (done === q.b) open(); } });
  };
  if (fast) {
    for (let i = 0; i < q.b; i++) { if (add) st.push('b'); else st[q.a - 1 - i] = 'g'; }
    done = q.b; draw(); document.getElementById('now').innerHTML = ''; open();
    return;
  }
  if (add) document.getElementById('put').onclick = () => { if (done < q.b) { st.push('b'); done++; sfx.hop(); draw(); if (done === q.b) { document.getElementById('put').disabled = true; open(); } } };
  draw();
}

/* ---------- 九：圓圓天文台 ---------- */
function viewCircle(q) {
  if (q.mode === 'center') {
    frame('手指按著圓，拖到正中間。', `<div class="cake-wrap" id="cw"><svg class="ang big" id="cs" viewBox="0 0 200 200"><circle cx="${q.cx}" cy="${q.cy}" r="${q.r}" fill="#dfeafa" stroke="#3b82c4" stroke-width="4"/><g id="mark"></g></svg></div>`);
    const svg = document.getElementById('cs'); let px = null;
    dragOn(document.getElementById('cw'), (x, y) => { px = [x * 200, y * 200]; document.getElementById('mark').innerHTML = `<circle cx="${px[0]}" cy="${px[1]}" r="9" fill="#d6476b"/>`; document.getElementById('ok').disabled = false; });
    document.getElementById('actions').innerHTML = '<button class="btn" id="ok" disabled>就是這裡</button>';
    document.getElementById('ok').onclick = () => {
      const d = Math.hypot(px[0] - q.cx, px[1] - q.cy);
      if (d <= q.r * .28) { document.getElementById('mark').innerHTML = `<circle cx="${q.cx}" cy="${q.cy}" r="5" fill="#2f9e6a"/>`; return finish(R.tries === 0 ? 2 : R.tries === 1 ? 1 : 0, 'center', '找到了！這個點到圓周上每一點都一樣遠。'); }
      R.tries++; sfx.retry();
      if (R.tries === 1) return setMsg('看看這個點到圓邊的距離，每個方向要一樣長。', 'hint');
      document.getElementById('mark').innerHTML = `<circle cx="${q.cx}" cy="${q.cy}" r="5" fill="#2f9e6a"/>`;
      finish(0, { wrong: 'center', ans: 'center' }, '圓心在這裡，到圓周每一點都一樣遠。');
    };
    return;
  }
  const seg = (turn, type) => {
    const t = turn * Math.PI / 180, c = 100, r = 80, P = a => [c + r * Math.cos(a), c - r * Math.sin(a)];
    const [x1, y1] = P(t);
    const [x2, y2] = type === 'radius' ? [c, c] : type === 'diameter' ? P(t + Math.PI) : P(t + 2);
    return `<svg class="ang big" viewBox="0 0 200 200"><circle cx="100" cy="100" r="80" fill="#dfeafa" stroke="#3b82c4" stroke-width="4"/><circle cx="100" cy="100" r="4" fill="#33405a"/><path d="M${x1} ${y1}L${x2} ${y2}" stroke="#d6476b" stroke-width="5" stroke-linecap="round"/></svg>`;
  };
  if (q.mode === 'name') {
    frame('紅色的線是什麼？', `<div class="cake-wrap">${seg(q.turn, q.line)}</div><div class="trail" id="ct"></div>`);
    const ks = ['radius', 'diameter', 'neither'];
    return gate(q, '🔍 看有沒有碰到圓心', 1, () => setEl('ct', q.line === 'radius' ? '一端在圓心，一端在圓周' : q.line === 'diameter' ? '從圓周穿過圓心，到另一邊的圓周' : '沒有碰到圓心'), () => pickOne(['半徑', '直徑', '都不是'], ks.indexOf(q.ans), '看它有沒有碰到圓心：半徑從圓心到圓周，直徑通過圓心。', { radius: '對了！從圓心到圓周，是半徑。', diameter: '對了！通過圓心的直線，是直徑。', neither: '對了！它沒有碰到圓心，都不是。' }[q.ans], 'name'));
  }
  if (q.mode === 'size') {
    const isD = q.ask === 'd';
    frame(isD ? `半徑是 ${N(q.r)} 公分，<br>直徑是幾公分？` : `直徑是 ${N(q.r * 2)} 公分，<br>半徑是幾公分？`, `<div class="cake-wrap" id="sz">${seg(30, isD ? 'radius' : 'diameter')}</div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, isD ? '再接一條半徑' : '從圓心切一半', 1, () => { setEl('sz', seg(30, isD ? 'diameter' : 'radius')); setEl('ct', isD ? '兩條半徑接起來就是直徑' : '直徑切一半就是半徑'); }, () => stepKeypad(['幾公分？'], [q.ans], q.why, `對了！${q.why}`, 'size'));
  }
  frame('哪一條線最長？', `<div class="vs">${seg(q.turn, 'neither')}${seg(q.turn, 'diameter')}</div><div class="trail" id="ct"></div>`);
  gate(q, '📏 量量看', 1, () => setEl('ct', '右邊的線通過圓心，左邊的沒有'), () => pickOne(['左邊的線', '右邊的線'], 1, '看哪一條通過圓心。', q.why, 'long'));
}

/* ---------- 十：面積牧場 ---------- */
function gridSvg(w, h, cut, rows) { // rows：鋪到第幾排，沒鋪的是空格
  const S = 28; let r = '';
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const gone = cut && x >= w - cut.w && y < cut.h;
    if (!gone) r += `<rect x="${x * S + 2}" y="${y * S + 2}" width="${S}" height="${S}" fill="${rows === undefined || y < rows ? '#bfe3b4' : '#fff'}" stroke="#3d9970" stroke-width="1.5"/>`;
  }
  return `<svg class="grid-a" viewBox="0 0 ${w * S + 4} ${h * S + 4}" style="width:${Math.min(w * S + 4, 300)}px">${r}</svg>`;
}
function viewArea(q) {
  if (q.mode === 'pick') {
    frame(q.text, `<div class="u-big">${q.e}</div>`);
    return pickOne(q.options.map(o => nums(o)), q.options.indexOf(q.ans), '邊長 1 公分的正方形是 1 平方公分；手掌大約 100 平方公分。用這兩個來比一比。', q.why, 'pick');
  }
  if (q.mode === 'count') {
    frame(`這塊草地有幾平方公分？<br>一格是 1 平方公分。手指往下拖，鋪草皮。`, `<div class="cake-wrap" id="gd">${gridSvg(q.w, q.h, null, 0)}</div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, '鋪一排', q.h, k => { setEl('gd', gridSvg(q.w, q.h, null, k)); setEl('ct', nums(`鋪了 ${k} 排，一排 ${q.w} 格`)); }, () => stepKeypad(['幾平方公分？'], [q.w * q.h], `一排 ${q.w} 格，有 ${q.h} 排。`, `對了！${q.w}×${q.h}＝${q.w * q.h} 平方公分。`, 'count'), { el: document.getElementById('gd'), map: (x, y) => Math.ceil(y * q.h) });
  }
  if (q.mode === 'same') {
    frame(`哪一塊面積不是<br>${N(q.a)} 平方公分？`, `<div class="vs wrap">${q.cards.map(c => gridSvg(c.w, c.h)).join('')}</div><div class="trail" id="ct"></div>`);
    return gate(q, ['數第一塊', '數第二塊', '數第三塊'], 3, k => setEl('ct', nums(q.cards.slice(0, k).map((c, i) => `第${'一二三'[i]}塊 ${c.w}×${c.h}`).join('，'))), () => pickOne(['第一塊', '第二塊', '第三塊'], q.cards.findIndex(c => !c.same), '每一塊都用「一排幾格×幾排」算算看。', '對了！其他兩塊形狀不同，面積卻一樣。', 'same'));
  }
  if (q.mode === 'cut') {
    frame('缺了一角的草地，<br>有幾平方公分？', `<div class="cake-wrap" id="gd">${gridSvg(q.W, q.H, null, 0)}</div>${padHidden()}`);
    return gate(q, ['鋪滿完整的長方形', '✂️ 挖掉缺的那一角'], 2, k => setEl('gd', k === 1 ? gridSvg(q.W, q.H) : gridSvg(q.W, q.H, { w: q.cw, h: q.ch })), () => stepKeypad(['完整的長方形有幾格？', '缺的那一塊有幾格？', '剩下幾平方公分？'], [q.W * q.H, q.cw * q.ch, q.ans], '先算完整的，再減掉缺的那一塊。', `對了！${q.W * q.H}－${q.cw * q.ch}＝${q.ans}。`, 'cut', null, { shortcut: true }));
  }
  const S = 28, W = q.w * S, H = q.h * S;
  const pic = c => `<svg class="grid-a" viewBox="0 0 ${W + 4} ${H + 4}" style="width:${Math.min(W + 4, 240)}px"><rect x="2" y="2" width="${W}" height="${H}" fill="${c ? 'none' : '#bfe3b4'}" stroke="#3d9970" stroke-width="2"/>${c ? `<polygon points="2,2 2,${H + 2} ${W + 2},${H + 2}" fill="#bfe3b4" stroke="#3d9970" stroke-width="2"/>` : ''}</svg>`;
  frame(`長方形切一半變三角形，<br>三角形有幾平方公分？`, `<div class="cake-wrap" id="gd">${pic(false)}</div><div class="trail">${nums(`長方形一排 ${q.w} 格，有 ${q.h} 排`)}</div>${padHidden()}`);
  gate(q, '✂️ 沿對角線切開', 1, () => setEl('gd', pic(true)), () => stepKeypad(['長方形有幾平方公分？', '三角形是一半，幾平方公分？'], [q.w * q.h, q.ans], '三角形是長方形的一半。', `對了！${q.w * q.h}÷2＝${q.ans}。`, 'half', null, { shortcut: true }));
}

/* ---------- 十一：小數碼頭 ---------- */
function fishBars(states) { // 每 10 段一條；a 原本、b 加上去、g 吃掉
  const rows = []; for (let i = 0; i < Math.max(states.length, 1); i += 10) rows.push(states.slice(i, i + 10));
  return `<div class="tenbars">${rows.map(r => `<div class="tenbar fish">${Array.from({ length: 10 }, (_, i) => `<i class="${r[i] || ''}"></i>`).join('')}</div>`).join('')}</div>`;
}
const fishState = (n, s) => Array.from({ length: n }, () => s || 'a');
function viewDeci(q) {
  const d1 = n => (n / 10).toFixed(1), graded = () => R.tries === 0 ? 2 : R.tries === 1 ? 1 : 0, fast = isFast(q);
  if (q.mode === 'color' && fast) {
    frame(`${N(d1(q.a))} 條魚乾是幾段？`, `${fishBars([])}<div class="trail">一段是 0.1</div><div class="trail" id="ask"></div>`, keypadHtml());
    return stepKeypad(['幾段？'], [q.a], '小數點後面的數字就是幾段。', `對了！${d1(q.a)} 就是 ${q.a} 個 0.1。`, 'color');
  }
  if (q.mode === 'count' && fast) {
    frame(`${N(q.text)} 裡面有幾個 ${N('0.1')}？`, `<div class="trail">一整條是 10 段</div><div class="trail" id="ask"></div>`, keypadHtml());
    return stepKeypad(['幾個？'], [q.n], `${Math.floor(q.n / 10)} 整條是 ${Math.floor(q.n / 10) * 10} 段，再加 ${q.n % 10} 段。`, `對了！${q.text} 是 ${q.n} 個 0.1。`, 'count');
  }
  if (q.mode === 'color') {
    // 點到第幾段就拿到第幾段，小數跟著變
    frame(`一條魚乾平分成 10 段，<br>一段是 ${N('0.1')}。拿出 ${N(d1(q.a))} 條。`, `<div class="fcells" id="cells">${Array.from({ length: 10 }, (_, i) => `<button class="fcell" data-c="${i}" aria-label="拿到第 ${i + 1} 段"></button>`).join('')}</div><div class="trail num" id="now"></div>`);
    let k = 0;
    const draw = () => { document.querySelectorAll('.fcell').forEach((c, i) => c.classList.toggle('on', i < k)); document.getElementById('now').innerHTML = k ? nums(`${k} 段，就是 ${k} 個 0.1，寫成 ${d1(k)}`) : '點魚乾，拿到第幾段'; };
    dragOn(document.getElementById('cells'), (x, y, e) => { const b = document.getElementById('cells').getBoundingClientRect(), t = Math.max(0, Math.min(10, Math.ceil((e.clientX - b.left) / b.width * 10))); if (t !== k) { k = t; sfx.hop(); draw(); } }, '.fcell');
    draw();
    document.getElementById('actions').innerHTML = '<button class="btn" id="ok">拿好了</button>';
    document.getElementById('ok').onclick = () => {
      if (k === q.a) return finish(graded(), 'color', nums(`對了！${d1(q.a)} 就是 ${q.a} 個 0.1。`));
      R.tries++; sfx.retry();
      if (R.tries >= 3) return finish(0, { wrong: k, ans: q.a }, nums(`要 ${q.a} 段。`));
      setMsg(nums(`小數點後面的數字是幾段：${d1(q.a)} 要 ${q.a} 段。`), 'hint');
    };
    return;
  }
  if (q.mode === 'count') {
    // 用整條和段拼出小數
    frame(`幫大嘴拿 ${N(q.text)} 條魚乾。<br>小數點左邊是整條，右邊是幾段。`, `<div id="fb"></div><div class="trail num" id="now"></div><div class="trade"><button id="m1">拿回一條</button><button id="p1">加一整條</button></div><div class="trade"><button id="m2">拿回一段</button><button id="p2">加一段</button></div>`);
    let k = 0;
    const draw = () => { document.getElementById('fb').innerHTML = fishBars(fishState(k)); document.getElementById('now').innerHTML = nums(`現在：${Math.floor(k / 10)} 整條又 ${k % 10} 段`); };
    const change = d => { k = Math.max(0, Math.min(49, k + d)); sfx.hop(); draw(); };
    document.getElementById('p1').onclick = () => change(10); document.getElementById('m1').onclick = () => change(-10);
    document.getElementById('p2').onclick = () => change(1); document.getElementById('m2').onclick = () => change(-1);
    draw();
    document.getElementById('actions').innerHTML = '<button class="btn" id="ok">拿好了</button>';
    document.getElementById('ok').onclick = () => {
      if (k === q.n) return finish(graded(), 'count', nums(`對了！${q.text} 條就是 ${Math.floor(q.n / 10)} 整條又 ${q.n % 10} 段，一共 ${q.n} 個 0.1。`));
      R.tries++; sfx.retry();
      if (R.tries >= 3) return finish(0, { wrong: k, ans: q.n }, nums(`${q.text} 是 ${Math.floor(q.n / 10)} 整條又 ${q.n % 10} 段。`));
      setMsg(nums(`看小數點：左邊 ${Math.floor(q.n / 10)} 是整條，右邊 ${q.n % 10} 是段。`), 'hint');
    };
    return;
  }
  if (q.mode === 'cmp') {
    frame('點魚乾比較多的那一堆。', '<div class="trail">先比幾整條，再比多的段數</div>');
    const card = (t, n) => `<span class="fish-card"><b class="num">${t}</b>${fishBars(fishState(n))}</span>`;
    return pickOne([card(q.l, q.a), card(q.r, q.b)], q.ans === 'L' ? 0 : 1, '先比幾整條，再比多出來的段數。', '對了！', 'cmp');
  }
  // 加法：一段一段放上去；減法：一段一段吃掉；做完才選答案
  const m = q.text.match(/([\d.]+)([＋－])([\d.]+)/), x = Math.round(+m[1] * 10), y = Math.round(+m[3] * 10), add = m[2] === '＋';
  frame(`${N(q.text)}<br>${fast ? '現在有多少？' : add ? `再放 ${N(d1(y))} 條，就是 ${N(y)} 段。` : `吃掉 ${N(d1(y))} 條，就是 ${N(y)} 段。`}`, `<div id="fb"></div><div class="trail num" id="now"></div>${fast ? '' : `<div class="trade"><button id="step">${add ? '再放一段' : '吃掉一段'}</button></div>`}`);
  const st = fishState(x); let done = 0;
  const draw = () => {
    document.getElementById('fb').innerHTML = fishBars(st);
    const left = y - done;
    document.getElementById('now').innerHTML = left > 0 ? nums(add ? `還要放 ${left} 段` : `還要吃 ${left} 段`) : '做完了，現在有多少？';
  };
  const ask = () => {
    const opts = Logic.uniqueOptions(q.tenths, () => q.tenths + Logic.pick([-10, -2, -1, 1, 2, 10]));
    pickOne(opts.map(o => numBtn(d1(o))), opts.indexOf(q.tenths), '先數幾整條，再數多的段數。', `對了！${q.why}`, 'calc');
    setMsg('現在有多少？點答案。', 'good'); reveal('#actions');
  };
  if (fast) {
    for (let i = 0; i < y; i++) { if (add) st.push('b'); else st[x - 1 - i] = 'g'; }
    done = y; draw(); document.getElementById('now').innerHTML = ''; ask();
    return;
  }
  document.getElementById('step').onclick = () => {
    if (done >= y) return;
    if (add) st.push('b'); else { st[x - 1 - done] = 'g'; }
    done++; sfx.hop(); draw();
    if (done === y) { document.getElementById('step').disabled = true; ask(); }
  };
  draw();
}

/* ---------- 十二：量量市集 ---------- */
function viewMeas(q) {
  if (q.mode === 'pick') {
    frame(q.text, `<div class="u-big">${q.e}</div>`);
    return pickOne(q.options.map(o => nums(o)), q.options.indexOf(q.ans), q.why, `對了！${q.why}`, 'pick');
  }
  const crate = (u, n) => `<span class="crate"><b class="num">1</b>${u}<small class="num">＝${n}</small></span>`;
  if (q.mode === 'to') {
    frame(`${nums(q.text)}，<br>是幾${q.unit}？`, `<div class="crates" id="cr"></div>${padHidden()}`);
    return gate(q, [...new Array(q.big).fill(`放 1 ${q.u1}`), `再放 ${q.small} ${q.unit}`], q.big + 1, k => setEl('cr', Array.from({ length: Math.min(k, q.big) }, () => crate(q.u1, q.per)).join('') + (k > q.big ? `<span class="crate small"><b class="num">${q.small}</b>${q.unit}</span>` : '')), () => stepKeypad([`${q.big} ${q.u1}是幾${q.unit}？`, `再加 ${q.small} ${q.unit}是多少？`], [q.big * q.per, q.ans], q.why, `對了！是 ${q.ans} ${q.unit}。`, 'to', null, { shortcut: true }));
  }
  if (q.mode === 'from') {
    const total = q.steps[0] * q.per + q.steps[1];
    frame(`${nums(q.text)}，<br>是幾${q.u1}幾${q.u2}？`, `<div class="crates" id="cr"></div><div class="u-count">還有 <b class="num" id="cnt">${total}</b> ${q.u2}</div><div class="trail">${nums(`每裝滿 ${q.per} ${q.u2}，就是 1 ${q.u1}`)}</div>${padHidden()}`);
    return gate(q, `裝滿 1 ${q.u1}`, q.steps[0], k => { setEl('cr', Array.from({ length: k }, () => crate(q.u1, q.per)).join('')); document.getElementById('cnt').textContent = total - k * q.per; }, () => stepKeypad([`可以裝滿幾個 ${q.per}？（幾${q.u1}）`, `還剩多少？（幾${q.u2}）`], q.steps, q.why, `對了！${q.steps[0]} ${q.u1} ${q.steps[1]} ${q.u2}。`, 'from'));
  }
  if (q.mode === 'dial') {
    const a = q.g / 1000 * 2 * Math.PI, x = 100 + 72 * Math.sin(a), y = 100 - 72 * Math.cos(a);
    let t = '';
    for (let i = 0; i < 20; i++) { const b = i * 18; t += `<path d="M100 18v${i % 2 ? 8 : 15}" transform="rotate(${b} 100 100)" stroke="#33405a" stroke-width="${i % 2 ? 1.5 : 3}"/>`; }
    [0, 250, 500, 750].forEach((v, i) => { const b = i * 90 * Math.PI / 180; t += `<text x="${100 + 60 * Math.sin(b)}" y="${100 - 60 * Math.cos(b) + 6}" text-anchor="middle" font-size="16">${v}</text>`; });
    const pic = g => { const h = g / 1000 * 2 * Math.PI, kx = 100 + 80 * Math.sin(h), ky = 100 - 80 * Math.cos(h), big = g > 500 ? 1 : 0; return `<svg class="ang big" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="#fffdf7" stroke="#d9772b" stroke-width="5"/>${g ? `<path d="M100 100V20A80 80 0 ${big} 1 ${kx} ${ky}Z" fill="#ffd65a" opacity=".55"/>` : ''}${t}<path d="M100 100L${x} ${y}" stroke="#d6476b" stroke-width="4" stroke-linecap="round"/><circle cx="100" cy="100" r="6" fill="#33405a"/><circle cx="${kx}" cy="${ky}" r="11" fill="#ffd65a" stroke="#2f5f9e" stroke-width="3"/></svg>`; };
    frame('秤上的指針指著幾公克？<br>撥黃色圓鈕，從 0 轉到指針。', `<div class="cake-wrap" id="dl">${pic(0)}</div><div class="trail" id="ct">一小格是 50 公克</div>${padHidden()}`);
    const n = q.g / 50;
    return gate(q, '轉一小格', n, k => { setEl('dl', pic(k * 50)); setEl('ct', nums(`轉了 ${k} 小格`)); }, () => stepKeypad(['幾公克？'], [q.ans], '從 0 開始，一小格一小格加 50。', `對了！是 ${q.ans} 公克。`, 'dial'), { el: document.getElementById('dl'), map: (px, py) => { const d = (Math.atan2(px - .5, .5 - py) * 180 / Math.PI + 360) % 360; return d / 18; } });
  }
  frame(`${q.rows[q.r]}${q.cols[q.c]}有幾個人來市集？<br>點那一格。`, `<table class="seq-t"><tr><th></th>${q.cols.map(c => `<th>${c}</th>`).join('')}</tr>${q.rows.map((r, i) => `<tr><th>${r}</th>${q.data[i].map((v, j) => `<td class="num tap-c" data-r="${i}" data-c="${j}">${v}</td>`).join('')}</tr>`).join('')}</table>${padHidden()}`);
  const askB = () => stepKeypad(['幾個人？'], [q.ans], '先找橫列，再找直行，看交叉的那一格。', `對了！是 ${q.ans} 個人。`, 'table');
  if (isFast(q)) return afterAct(askB);
  let found = false;
  document.querySelectorAll('.tap-c').forEach(c => c.onclick = () => {
    if (found) return;
    if (+c.dataset.r === q.r && +c.dataset.c === q.c) { found = true; c.classList.add('here'); sfx.ok(); setMsg('找到了！', 'good'); return afterAct(askB); }
    R.tries++; sfx.retry(); setMsg('先找橫列，再找直行，看交叉的那一格。', 'hint');
  });
}

const VIEWS = { port: viewPort, ship: viewShip, fact: viewFact, mm: viewMm, angle: viewAngle, div: viewDiv, rule: viewRule, frac: viewFrac, circle: viewCircle, area: viewArea, deci: viewDeci, meas: viewMeas };

/* ---------- 單位教室：先認識單位，再建立數感 ---------- */
const LESSONS = {
  len: {
    title: '長度', sem: '三上', icon: '📏', who: 'crab', name: '夾夾',
    say: '毫米、公分、公尺各有多長？點卡片，感覺一下！',
    cards: [
      { e: '🐜', u: '毫米', t: '尺上最小的一小格長 1 毫米。一隻小螞蟻大約長 4 毫米，這只是估計。' },
      { e: '📏', u: '公分', t: '10 毫米＝1 公分。小指頭的寬大約 1 公分，可以拿來估計；要量準，還是用尺。' },
      { e: '🚪', u: '公尺', t: '100 公分＝1 公尺。教室的門大約高 2 公尺。教室、跑道常用公尺量。' },
    ],
    labs: [
      { from: '毫米', each: 1, n: 10, to: '1 公分', btn: '再加 1 毫米', hint: '畫面上的格子只是示意，不是真的長度。', done: '10 個 1 毫米接起來，是 10 毫米，就是 1 公分。' },
      { from: '公分', each: 10, n: 10, to: '1 公尺', btn: '再加 10 公分', hint: '每一格代表 10 公分。', done: '10 個 10 公分接起來，是 100 公分，就是 1 公尺。' },
    ],
  },
  vol: {
    title: '容量', sem: '三上', icon: '🥛', who: 'raccoon', name: '秤秤',
    say: '公升和毫升能裝多少？點卡片，感覺一下！',
    cards: [
      { e: '💧', u: '毫升', t: '很少的水量用毫升。量藥水的小杯常標毫升刻度；一小瓶養樂多大約 100 毫升，可以看包裝上的標示。' },
      { e: '🧃', u: '公升', t: '比較多的水量用公升。一大瓶鮮奶大約 1 公升；水桶能裝多少水，也常用公升說。' },
    ],
    labs: [{ from: '毫升', each: 100, n: 10, to: '1 公升', btn: '倒 100 毫升', hint: '這個瓶子每一格代表 100 毫升。', done: '倒了 10 次 100 毫升，是 1000 毫升，剛好裝滿 1 公升。', tall: true }],
  },
  weight: {
    title: '重量', sem: '三下', icon: '⚖️', who: 'raccoon', name: '秤秤',
    say: '公克和公斤有多重？點卡片，感覺一下！',
    cards: [
      { e: '📎', u: '公克', t: '很輕的東西用公克。一根小迴紋針大約 1 公克；迴紋針大小不同，重量也不同。' },
      { e: '🍚', u: '公斤', t: '比較重的東西用公斤。包裝上寫「1 公斤」的一包砂糖，就重 1 公斤。' },
    ],
    labs: [{ view: 'dial', from: '公克', each: 100, n: 10, to: '1 公斤', btn: '放 100 公克', hint: '這個秤每一大格代表 100 公克。', done: '放了 10 次 100 公克，是 1000 公克，就是 1 公斤。' }],
  },
  time: {
    title: '時間', sem: '三下', icon: '⏱️', who: 'liang', name: '亮亮',
    say: '秒、分、小時、日有多久？點卡片，感覺一下！',
    cards: [
      { e: '🥁', u: '秒', t: '節拍器每秒響一聲，響一聲到下一聲是 1 秒。戴好帽子大約 10 秒。' },
      { e: '⏳', u: '分', t: '4 分鐘的沙漏，沙子流完就過了 4 分鐘。1 分鐘＝60 秒。' },
      { e: '🏫', u: '小時', t: '一節課 40 分鐘，1 小時比一節課長一些。1 小時＝60 分鐘。' },
      { e: '🌞', u: '日', t: '從今天早上 7 點到明天早上 7 點，是 1 日。1 日＝24 小時。' },
    ],
    labs: [
      { view: 'clock', from: '秒', each: 10, n: 6, to: '1 分鐘', btn: '再過 10 秒', hint: '紅色的是秒針，按一下走 10 秒。', done: '秒針走一圈是 60 秒，就是 1 分鐘。時間是 60 個換 1 個，和長度的 10 個、100 個換不一樣。' },
      { view: 'clock', from: '分', each: 10, n: 6, to: '1 小時', btn: '再過 10 分', hint: '紅色的是分針，按一下走 10 分鐘。', done: '分針走一圈是 60 分鐘，就是 1 小時。' },
    ],
  },
  area: {
    title: '面積', sem: '三下', icon: '🟩', who: 'sheep', name: '咩咩',
    say: '1 平方公分有多大？點卡片，感覺一下！',
    cards: [
      { e: '🟩', u: '平方公分', t: '邊長 1 公分的正方形，面積是 1 平方公分。一張長 8 公分、寬 5 公分的卡片，可以鋪滿 40 個這樣的正方形。' },
    ],
    labs: [{ tiles: true, w: 4, h: 3, done: '鋪滿了 12 格，不重疊、沒有空隙，面積是 12 平方公分。' }],
  },
};
function viewLessons() {
  window.scrollTo(0, 0);
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="home" aria-label="回小鎮">⌂</button><h2 class="page-h">單位教室</h2></div>
    <p class="tag">先認識單位，再去島上用它。</p>
    <div class="lessons">${Object.entries(LESSONS).map(([k, L]) => { const st = LESSON_STORY[k], fresh = st && !seenCpt()[st]; return `<div class="lesson-row"><button class="lesson" data-l="${k}"><span class="l-e">${L.icon}</span><span class="l-t"><b>${fresh ? CONCEPTS.find(c => c.key === st).hook : L.title}</b><small>${fresh ? '先看小故事' : L.cards.map(c => c.u).join('、')}</small></span><em class="sem">${L.sem}</em>${(S.learned || {})[k] ? '<span class="badge in">✓</span>' : (S.lessonSeen || {})[k] ? '<span class="badge seen">看過</span>' : ''}</button><button class="drill-btn" data-d="${k}">練習</button></div>`; }).join('')}</div>`;
  document.getElementById('home').onclick = () => go('');
  document.querySelectorAll('[data-l]').forEach(b => b.onclick = () => runLesson(b.dataset.l, viewLessons));
  document.querySelectorAll('[data-d]').forEach(b => b.onclick = () => runDrill(b.dataset.d, viewLessons));
}
function lessonFrame(L, title, body) {
  window.scrollTo(0, 0);
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="out" aria-label="離開">⌂</button><h2 class="page-h">${L.title}<span class="sem">${L.sem}</span></h2><button class="icon-btn" id="say" aria-label="唸出來">🔊</button></div>
    <div class="say-row">${artImg(L.who, 'say-who')}<div class="prompt" id="prompt">${title}</div></div><div class="stage" id="stage">${body}</div><div class="msg" id="msg"></div><div class="actions" id="actions"></div>`;
  document.getElementById('say').onclick = () => speak(sayText());
}
// 朗讀：題目＋圖下說明＋回饋一起唸，不只唸題目
function sayText() { return ['prompt', 'ct', 'cnt', 'ask', 'msg'].map(id => document.getElementById(id)).filter(e => e && e.textContent.trim()).map(plainText).join('。'); }
const FAM_UNIT = { 分: '分鐘' };
function exList(key, unit) { // 同單位的生活例子
  const ex = Logic.UNIT_ITEMS[key].filter(x => x.u === (FAM_UNIT[unit] || unit));
  return ex.length ? `<span class="u-ex">${ex.map(x => `<span>${x.e} ${x.name} ${x.v} ${x.u}</span>`).join('')}</span>` : '';
}
function labPic(X, k) { // 單位要看得到它本來的樣子：時間是鐘面，重量是秤
  const a = k / X.n * 2 * Math.PI, x = 100 + 72 * Math.sin(a), y = 100 - 72 * Math.cos(a);
  if (X.view === 'clock') { let t = ''; for (let i = 1; i <= 12; i++) { const b = i * 30 * Math.PI / 180; t += `<text x="${100 + 72 * Math.sin(b)}" y="${100 - 72 * Math.cos(b) + 6}" text-anchor="middle" font-size="17">${i}</text>`; } return `<svg class="ang big" viewBox="0 0 200 200"><circle cx="100" cy="100" r="94" fill="#fff" stroke="#33405a" stroke-width="5"/>${t}<path d="M100 100L${100 + 60 * Math.sin(a)} ${100 - 60 * Math.cos(a)}" stroke="#d6476b" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="100" r="6" fill="#33405a"/></svg>`; }
  let t = ''; for (let i = 0; i < 10; i++) t += `<path d="M100 14v12" transform="rotate(${i * 36} 100 100)" stroke="#33405a" stroke-width="3"/>`;
  return `<svg class="ang big" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="#fffdf7" stroke="#d9772b" stroke-width="5"/>${t}<path d="M100 100L${x} ${y}" stroke="#d6476b" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="100" r="6" fill="#33405a"/></svg>`;
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
      if (seen.size === L.cards.length) { document.getElementById('go2').disabled = false; S.lessonSeen = S.lessonSeen || {}; S.lessonSeen[key] = 1; save(); setMsg('卡片都看過了，接著動手試試。'); reveal('#actions'); }
    });
    document.getElementById('go2').onclick = () => lab(0);
  }
  // 第二步：動手裝滿，感覺單位之間的關係
  function lab(i) {
    const X = L.labs[i];
    if (!X) return quiz();
    if (X.tiles) return tiles(X, i);
    lessonFrame(L, `一直加，加到 ${X.to}。${X.hint ? `<br><small>${nums(X.hint)}</small>` : ''}`, `${X.view ? '<div id="bar" class="vs lab-pic"></div>' : `<div class="${X.tall ? 'u-bottle' : 'u-bar'}" id="bar">${Array.from({ length: X.n }, () => '<i></i>').join('')}</div>`}<div class="u-count" id="cnt"></div><div class="trade"><button id="add">${X.btn}</button></div>`);
    document.getElementById('out').onclick = leave;
    let k = 0;
    const draw = () => {
      if (X.view) setEl('bar', labPic(X, k)); else document.querySelectorAll('#bar i').forEach((c, j) => c.classList.toggle('on', j < k));
      document.getElementById('cnt').innerHTML = `<b class="num">${k * X.each}</b> ${X.from}`;
    };
    draw();
    tapAlso('bar', 'add');
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
    lessonFrame(L, `每一格代表邊長 1 公分的正方形，面積 1 平方公分。<br><small>畫面上的大小只是示意。點格子，把這塊地鋪滿。</small>`, `<div class="u-tiles" style="grid-template-columns:repeat(${X.w},1fr)">${Array.from({ length: X.w * X.h }, (_, j) => `<button class="u-tile" data-t="${j}" aria-label="第 ${j + 1} 格"></button>`).join('')}</div><div class="u-count" id="cnt"></div>`);
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
    const plan = key === 'area' ? ['order', 'quiz', 'quiz', 'quiz'] : ['sort', 'sort', 'order', 'quiz', 'quiz'];
    unitDrill(key, plan, leave, finishLesson);
  }
  function finishLesson() {
    S.learned = S.learned || {}; const first = !S.learned[key]; S.learned[key] = 1;
    if (first) S.stars += 100;
    save();
    lessonFrame(L, `${L.title}單位，你認識了！`, `<div class="u-big">${L.icon}</div><div class="u-sum">${L.cards.map(c => `<span>${c.e} ${c.u}</span>`).join('')}</div>${first ? `<div class="trail">${nums('夜空多亮了 100 顆星')}</div>` : ''}`);
    document.getElementById('out').onclick = leave;
    document.getElementById('actions').innerHTML = '<button class="btn" id="end">好！</button>';
    document.getElementById('end').onclick = leave;
  }
  storyFirst(key, cards, leave);
}
// 單位練習：sort 替東西選單位、order 由小排到大、quiz 大約多少
function unitDrill(key, plan, leave, done) {
  const L = LESSONS[key], used = new Set(); let n = 0, firstTry = 0;
  const nextItem = () => { const pool = Logic.UNIT_ITEMS[key].filter(x => !used.has(x)), x = Logic.pick(pool.length ? pool : Logic.UNIT_ITEMS[key]); used.add(x); return x; };
  const passed = (clean, msg) => {
    if (clean) { firstTry++; S.stars += 25; save(); }
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
      if (b.dataset.o === right) return passed(clean, clean ? okMsg : okMsg.replace(/^對了！/, '改對了！'));
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
        if (picked.length === 3) passed(clean, `${clean ? '對了！' : '改對了！'}由小到大：${right.map(r => `${r.name} ${r.v} ${r.u}`).join('，')}。`);
        return;
      }
      clean = false; sfx.retry();
      setMsg(nums(`${x.name}不是剩下的裡面最小的。比一比還沒排的東西，哪一樣最小？`), 'hint');
    });
  }
  function ask() {
    if (n >= plan.length) return done(firstTry);
    const kind = plan[n];
    if (kind === 'order') return order();
    const x = nextItem();
    if (kind === 'sort') {
      const names = Logic.UNITS_OF[key].map(u => u);
      return choose(`${x.name}${x.dim}，<br>用哪個單位最合適？`, x.e, names, x.u, Logic.UNITS_OF[key].length === 3 ? '想想看：很小用小單位，很大用大單位。' : '很少或很輕用小單位，很多或很重用大單位。', `對了！${x.name}大約 ${x.v} ${x.u}。`);
    }
    const q = Logic.unitQuestion(key, x);
    choose(q.q, q.e, Logic.shuffle(q.opts), q.a, '想一想：這個數配上哪個單位，才和真的東西差不多？可以和卡片上的例子比一比。', `對了！${q.why}`);
  }
  ask();
}
function runDrill(key, then) { // 單獨練習一輪；還沒認識單位先看小故事
  if (LESSON_STORY[key] && !seenCpt()[LESSON_STORY[key]]) return storyFirst(key, () => runDrill(key, then), then);
  const L = LESSONS[key], base = key === 'area' ? ['order', 'quiz', 'quiz', 'quiz', 'order', 'quiz'] : ['sort', 'quiz', 'order', 'sort', 'quiz', 'sort', 'order', 'quiz'];
  unitDrill(key, base, then, firstTry => {
    lessonFrame(L, `練習完成！`, `<div class="u-big">${L.icon}</div><div class="u-count"><b class="num">${firstTry}</b> ／ ${base.length} 題第一次就對</div><div class="trail">${nums(`夜空多亮了 ${firstTry * 25} 顆星`)}</div>`);
    document.getElementById('out').onclick = then;
    document.getElementById('actions').innerHTML = '<button class="btn" id="again">再練一輪</button><button class="btn alt" id="end">好了</button>';
    document.getElementById('again').onclick = () => runDrill(key, then);
    document.getElementById('end').onclick = then;
  });
}
// 哪座島第一次進去前要先上哪一課
const LESSON_BEFORE = { mm: ['len'], area: ['area'], meas: ['vol', 'time', 'weight'] };
function lessonsThen(ch, then) {
  const need = (LESSON_BEFORE[ch] || []).find(k => !(S.learned || {})[k]);
  if (!need) return then();
  const L = LESSONS[need];
  storyFirst(need, () => {
  lessonFrame(L, `${L.title}的單位到底有多大？<br>去單位教室感覺一下！`, `<div class="u-big">${L.icon}</div>`);
  document.getElementById('out').onclick = () => go('');
  document.getElementById('actions').innerHTML = '<button class="btn" id="yes">去上課</button><button class="btn alt" id="no">先跳過</button>';
  document.getElementById('yes').onclick = () => runLesson(need, then); // 一次只上一課，不連播
  document.getElementById('no').onclick = then;
  }, () => go(''));
}

/* ---------- 新概念小故事：情境提問 → 動手試（不出現新詞）→ 命名並貼回圖上 → 換情境用新詞答一題，答錯回操作 ---------- */
// 圖裡的中文一律用 HTML 標籤（c3s 的 labs），SVG 的 text 不會加注音，只放數字和符號
// 2026-11-02 依外部審查修改：two 接受兩種解題順序、area 甲乙格子同大、驗收答錯只停用那一個選項、看過與完成分開記錄
const cT = w => `<b class="term">${w}</b>`;
const c3s = (inner, labs, vb) => { const [w, h] = vb || [320, 170]; return `<div class="c3p"><svg class="c3s" viewBox="0 0 ${w} ${h}">${inner}</svg>${(labs || []).map(l => `<span class="c3l ${l[3] || 'plain'}" style="left:${l[1] / w * 100}%;top:${l[2] / h * 100}%">${nums(l[0])}</span>`).join('')}</div>`; };
const c3e = (x, y, e, s) => `<text x="${x}" y="${y}" font-size="${s || 22}" text-anchor="middle" dominant-baseline="central">${e}</text>`;
const c3t = (x, y, t, s, f) => `<text class="c3n" x="${x}" y="${y}" font-size="${s || 18}" text-anchor="middle" dominant-baseline="central" fill="${f || '#33405a'}">${t}</text>`;
const c3L = (a, v) => { const i = Math.min(Math.floor(v), a.length - 1), j = Math.min(i + 1, a.length - 1), t = v - i; return a[i] + (a[j] - a[i]) * t; };
const c3sec = (cx, cy, r, a0, a1, fill) => { const p = a => [cx + r * Math.sin(a * Math.PI / 180), cy - r * Math.cos(a * Math.PI / 180)], [x0, y0] = p(a0), [x1, y1] = p(a1); return `<path d="M${cx} ${cy}L${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}Z" fill="${fill}" stroke="#7a5b2e" stroke-width="2"/>`; };
const c3pie = (cx, cy, r, n, a, b, col2) => { let o = ''; for (let i = 0; i < n; i++) o += c3sec(cx, cy, r, i * 360 / n, (i + 1) * 360 / n, i < a ? '#f08a8a' : i < a + (b || 0) ? (col2 || '#f7c35c') : '#fff0cf'); return o; };
const c3frac = (x, y, a, n, s) => c3t(x, y - (s || 26) * .62, a, s || 26) + `<path d="M${x - 16} ${y}H${x + 16}" stroke="#33405a" stroke-width="3"/>` + c3t(x, y + (s || 26) * .62, n, s || 26);
function c3deal(total, b, dealt, e) { // 上面是還沒分的東西，下面每人一個盤子
  let o = ''; const left = total - dealt; e = e || '🐚';
  for (let i = 0; i < left; i++) o += c3e(160 + (i - (left - 1) / 2) * 21, 20, e, 17);
  const dx = 300 / b;
  for (let p = 0; p < b; p++) {
    const x = 10 + dx * p + dx / 2, cnt = Math.floor((dealt + b - 1 - p) / b);
    o += c3e(x, 58, '🙂', 22) + `<rect x="${x - dx / 2 + 5}" y="76" width="${dx - 10}" height="88" rx="12" fill="#fff6e3" stroke="#e6d8bb" stroke-width="2"/>`;
    for (let i = 0; i < cnt; i++) o += c3e(x - 20 + (i % 3) * 20, 92 + Math.floor(i / 3) * 24, e, 17);
  }
  return o;
}
function c3angle(d, l, labs, ref, cx, cy, fill) { // 頂點在 (cx,cy)，一條邊水平
  cx = cx === undefined ? 70 : cx; cy = cy === undefined ? 145 : cy; const r = d * Math.PI / 180, x = cx + l * Math.cos(r), y = cy - l * Math.sin(r), ax = cx + 26 * Math.cos(r), ay = cy - 26 * Math.sin(r);
  return `${ref ? `<rect x="${cx}" y="${cy - 80}" width="80" height="80" fill="#a9d0f0" fill-opacity=".5" stroke="#3b82c4" stroke-dasharray="5 4" stroke-width="2"/>` : ''}<path d="M${cx + 26} ${cy}A26 26 0 0 0 ${ax} ${ay}L${cx} ${cy}Z" fill="${fill || '#f4a9a0'}"/><path d="M${cx + l} ${cy}L${cx} ${cy}L${x} ${y}" fill="none" stroke="#33405a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
}
const c3line = (v, max, labels, boat) => { const X = i => 20 + 280 * i / max; let o = `<path d="M8 105H312" stroke="#33405a" stroke-width="4"/>`; for (let i = 0; i <= max; i++) o += `<path d="M${X(i)} 96V114" stroke="#33405a" stroke-width="3"/>` + (labels ? c3t(X(i), 132, labels(i), 16) : ''); return o + boat(X(v)); };
const c3board = (cols, x0, y0, w) => cols.map((c, i) => `<rect x="${x0 + i * w}" y="${y0}" width="${w}" height="38" fill="${c[1] || '#fffdf7'}" stroke="#33405a" stroke-width="2"/>${c3t(x0 + i * w + w / 2, y0 + 19, c[0], 22)}`).join('');
const C3_T = [[5, 3], [7, 4], [6, 2]];
function c3table(v, hi) { // 每一橫行是一個班，每一直行是一種天氣
  let o = ''; const x0 = 90, y0 = 42, w = 90, h = 38, put = Math.floor(v * 3 + .01), flat = [];
  C3_T.forEach((r, i) => r.forEach((n, j) => flat.push([i, j, n])));
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) o += `<rect x="${x0 + j * w}" y="${y0 + i * h}" width="${w}" height="${h}" fill="${hi && i === 1 && j === 1 ? '#ffe680' : '#fffdf7'}" stroke="#33405a" stroke-width="2"/>`;
  flat.forEach(([i, j, n], k) => { const done = k < put; o += c3t(done ? x0 + j * w + w / 2 : 296 - (k % 2) * 16, done ? y0 + i * h + h / 2 : 30 + k * 24, n, 22, done ? '#33405a' : '#d6476b'); });
  return c3s(o, [['一班', 45, 61], ['二班', 45, 99], ['三班', 45, 137], ['晴天', 135, 22], ['雨天', 225, 22]]);
}
const c3fish = (x, y, w, n, a, whole) => { let o = ''; const d = w / n; for (let i = 0; i < n; i++) o += `<rect x="${x + i * d}" y="${y}" width="${d}" height="30" fill="${whole || i < a ? '#e8a35c' : '#fff'}" stroke="#a9702a" stroke-width="${n > 1 ? 1.5 : 2.5}"/>`; return o; };
function c3ruler(v) { // 尺：放大後才看得見 1 公分裡的小格
  const z = c3L([28, 44, 58], v), X = c => 20 + (c - (v >= 1 ? 3.6 : 3.6 - 1.2 * (1 - v)) ) * z * 1; let o = `<rect x="8" y="88" width="304" height="52" fill="#f7dc8c" stroke="#a9702a" stroke-width="2"/>`;
  for (let c = 0; c <= 9; c++) { const x = X(c); if (x < 8 || x > 312) continue; o += `<path d="M${x} 88v26" stroke="#33405a" stroke-width="3"/>` + c3t(x, 127, c, 17); }
  if (v > .3) for (let m = 0; m <= 90; m++) { if (m % 10 === 0) continue; const x = X(m / 10); if (x < 8 || x > 312) continue; o += `<path d="M${x} 88v13" stroke="#33405a" stroke-width="1.5" opacity="${Math.min(1, (v - .3) * 2)}"/>`; }
  return o + `<rect x="8" y="50" width="${X(4.3) - 8}" height="24" fill="#e0607e"/><path d="M${X(4.3)} 40V140" stroke="#3b82c4" stroke-width="2.5"/>` + (v >= 1.5 ? `<rect x="${X(4)}" y="84" width="${X(4.3) - X(4)}" height="20" fill="#d6476b" fill-opacity=".35"/>` : '');
}
// 鐘面：分針也跟著秒數慢慢動（每秒 0.1 度），不是停在原地
const c3clock = (sec, labs) => { let o = `<circle cx="160" cy="85" r="78" fill="#fff" stroke="#33405a" stroke-width="5"/>`; for (let i = 0; i < 60; i += 5) { const a = i * 6 * Math.PI / 180; o += `<path d="M${160 + 68 * Math.sin(a)} ${85 - 68 * Math.cos(a)}L${160 + 76 * Math.sin(a)} ${85 - 76 * Math.cos(a)}" stroke="#33405a" stroke-width="3"/>`; } const a = sec * 6 * Math.PI / 180, m = sec * .1 * Math.PI / 180; o += `<path d="M160 85L${160 + 56 * Math.sin(m)} ${85 - 56 * Math.cos(m)}" stroke="#33405a" stroke-width="6" stroke-linecap="round"/><path d="M160 85L${160 + 70 * Math.sin(a)} ${85 - 70 * Math.cos(a)}" stroke="#d6476b" stroke-width="3" stroke-linecap="round"/><circle cx="160" cy="85" r="6" fill="#33405a"/>`; return c3s(o, labs); };
const c3bucket = (x, lv) => `<path d="M${x} 60L${x + 8} 160H${x + 82}L${x + 90} 60Z" fill="#fff" stroke="#33405a" stroke-width="3"/><path d="M${x + 8} ${160 - 96 * lv}H${x + 82}V160H${x + 8}Z" fill="#6ea8dc" opacity=".8"/>`;
const c3cells = (x, y, w, h, s, on, col) => { let o = ''; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) o += `<rect x="${x + i * s}" y="${y + j * s}" width="${s}" height="${s}" fill="${j * w + i < on ? col : '#fff'}" stroke="#7a9a62" stroke-width="1.5"/>`; return o; };
// 一塊地：先只看外框，鋪上幾格就畫幾格（每格同樣大）
const c3plot = (x, y, w, h, s, on, col) => { let o = `<rect x="${x}" y="${y}" width="${w * s}" height="${h * s}" fill="#eef6e6" stroke="#5f7f4a" stroke-width="3"/>`; for (let k = 0; k < Math.min(on, w * h); k++) o += `<rect x="${x + (k % w) * s}" y="${y + Math.floor(k / w) * s}" width="${s}" height="${s}" fill="${col}" stroke="#7a9a62" stroke-width="1.5"/>`; return o; };
// 兩步驟：4 盒糖，每盒 2 袋，每袋 5 顆。0 全關、1 開 1 盒、2 每盒 10 顆、3 全開數袋子
function c3two(st) {
  let o = '';
  for (let i = 0; i < 4; i++) {
    const x = 8 + i * 78, open = st === 3 || (st >= 1 && st < 2 && i === 0);
    o += `<rect x="${x}" y="8" width="72" height="76" rx="6" fill="${open ? '#fff6e3' : '#c9a36a'}" stroke="#7a5b2e" stroke-width="3"/>`;
    if (open) for (let b = 0; b < 2; b++) o += `<rect x="${x + 6 + b * 32}" y="16" width="28" height="42" rx="5" fill="#a9d0f0" stroke="#2f5f9e" stroke-width="2"/>` + c3t(x + 20 + b * 32, 37, 5, 17) + (st === 3 ? c3t(x + 20 + b * 32, 72, i * 2 + b + 1, 14, '#d6476b') : '');
    else if (st >= 2) o += c3t(x + 36, 46, 10, 26, '#2f5f9e');
  }
  if (st === 1) o += c3t(145, 120, '5×2＝10', 28, '#2f5f9e');
  if (st === 2) o += c3t(145, 112, '5×2＝10', 22, '#2f5f9e') + c3t(145, 146, '10×4＝40', 28, '#2f9e6a');
  if (st === 3) o += c3t(145, 112, '2×4＝8', 22, '#a9702a') + c3t(145, 146, '5×8＝40', 28, '#2f9e6a');
  return o;
}
const C3_CUT = [[200, 100, 60], [160, 110, 90], [120, 120, 120]];
const CONCEPTS = [
  { key: 'numline', title: '數線', terms: ['數線'], sem: '三上', game: 'port', hook: '碼頭的長線', when: ['port:place'],
    ask: '碼頭邊有一條長線，每格一樣長。2、5、9 這三個數，要放在線上哪裡？', tryIt: '拖小船，停到 2、5、9 的刻度上。', states: [2, 5, 9],
    pic: (v, n) => c3s(c3line(v, 10, i => i, x => c3e(x, 74, '🚢', 34)), n ? [['數線', 270, 60, 'stick']] : []),
    note: v => ({ 2: '2 在 0 的右邊第 2 格', 5: '5 比 2 多 3，再往右 3 格', 9: '9 比 5 多 4，再往右 4 格，在最右邊' }[v]),
    found: '每格都差 1、一樣長。兩個數差得越多，隔得越遠；越往右，數越大。', name: `在一條直線上，每格代表一樣多，再標上數，就是${cT('數線')}。先看一格代表多少，才讀得出位置；數線也不一定從 0 開始。`, loop: [0, 1, 2],
    check: { q: '這條數線一格是 1000。箭頭指著幾？', pic: () => c3s(c3line(3, 5, i => i < 2 ? i * 1000 : '', x => c3e(x, 74, '⬇️', 30))), opts: ['300', '3000', '4000'], a: 1, why: '先看一格是 1000，再從 0 往右數到箭頭，一共幾格？', ok: '對了！從 0 往右數 3 格，3 個 1000 是 3000。' } },
  { key: 'kilo', title: '千位', terms: ['千位'], sem: '三上', game: 'port', hook: '寫不下的貨', when: ['port:word', 'port:cmp'],
    ask: '倉庫有 12 盒貨，每盒 100 個，是 12 個百。百位只能寫一個數字，要怎麼記？', tryIt: '拖一拖，把 10 盒綁成 1 大箱。', states: [0, 1, 2],
    pic: (v, n) => { const t = Math.min(v, 1); let o = ''; for (let i = 0; i < 12; i++) { const sx = 22 + (i % 6) * 48, sy = 8 + Math.floor(i / 6) * 40, ex = i < 10 ? 30 + (i % 5) * 26 : 196 + (i - 10) * 48, ey = i < 10 ? 8 + Math.floor(i / 5) * 32 : 26, x = sx + (ex - sx) * t, y = sy + (ey - sy) * t; if (i < 10 && v >= 1.5) continue; o += `<rect x="${x}" y="${y}" width="${i < 10 && t === 1 ? 24 : 38}" height="30" fill="#6ea8dc" stroke="#2f5f9e" stroke-width="2"/>`; } if (v >= 1 && v < 1.5) o += '<rect x="24" y="2" width="138" height="72" rx="8" fill="none" stroke="#d6476b" stroke-width="4"/>'; if (v >= 1.5) o += `<rect x="30" y="6" width="128" height="64" fill="#f0a03c" stroke="#a9702a" stroke-width="3"/>${c3t(94, 38, '1000', 26)}`; const cols = v >= 1.5 ? [['1'], ['2'], ['0'], ['0']] : [['12', '#f9c6c6'], ['0'], ['0']]; o += c3board(cols, v >= 1.5 ? 60 : 110, 118, 50); return c3s(o, v >= 1.5 ? [[n ? '千位' : '新的一位', 85, 100, n ? 'stick' : 'plain']] : [['百', 135, 100], ['十', 185, 100], ['個', 235, 100]]); },
    note: v => ['12 個百，百位寫不下 12', '先把 10 個百綁在一起', '10 個百換成 1 個千，還剩 2 個百'][v],
    found: '12 個百換成 1 個千和 2 個百，總數還是 1200，沒有變。', name: `從個位往左數，第 4 位記有幾個一千，叫${cT('千位')}。1200 的 1 就在千位。`, loop: [2],
    check: { q: '4725 的千位是哪一個數字？', pic: () => c3s(c3board([['4'], ['7'], ['2'], ['5']], 60, 60, 50)), opts: ['4', '7', '5'], a: 0, why: '從右邊的個位開始往左數：個、十、百、千。第 4 位是哪個數字？', ok: '對了！從個位往左數到第 4 位是 4，表示 4 個一千。' } },
  { key: 'wan', title: '一萬', terms: ['一萬'], sem: '三上', game: 'port', hook: '滿滿的貨櫃', when: ['port:trade'],
    ask: '每個貨櫃裝 1000 件貨。9 櫃之後再來 1 櫃，一共幾件？要怎麼寫？', tryIt: '拖一拖，再加一櫃。', states: [8, 9, 10],
    pic: (v, n) => { let o = ''; const c = Math.floor(v + .01); for (let i = 0; i < c; i++) o += `<rect x="${14 + (i % 5) * 60}" y="${10 + Math.floor(i / 5) * 52}" width="52" height="44" fill="#f0a03c" stroke="#a9702a" stroke-width="2"/>${c3t(40 + (i % 5) * 60, 32 + Math.floor(i / 5) * 52, 1000, 15)}`; o += c3t(160, 142, String(c * 1000), 30, c === 10 ? '#d6476b' : '#33405a'); return c3s(o, n && c === 10 ? [['一萬', 260, 142, 'stick']] : []); },
    note: v => v === 10 ? '10 櫃是 10000 件，數字又往左多一位' : `${v} 櫃是 ${v * 1000} 件`,
    found: '10 個一千是 10000，也就是 9999 再多 1。', name: `10 個一千是 10000，讀作${cT('一萬')}。`, loop: [2, 1],
    check: { q: '已經有 6 個一千。再多幾個一千，才是一萬？', pic: () => c3s(Array.from({ length: 6 }, (_, i) => `<rect x="${14 + (i % 5) * 60}" y="${20 + Math.floor(i / 5) * 56}" width="52" height="44" fill="#f0a03c" stroke="#a9702a" stroke-width="2"/>`).join('')), opts: ['4', '6', '10'], a: 0, why: '一萬是 10 個一千。已經有 6 個，再數幾個才到 10 個？', ok: '對了！6 個一千再加 4 個一千，是 10 個一千，就是一萬。' } },
  { key: 'est', title: '估算', terms: ['估算'], sem: '三上', game: 'ship', hook: '錢夠不夠', when: ['ship:est', 'fact:est'],
    ask: '帶 1000 元，買 398 元的鞋和 505 元的書包。錢夠不夠？先估計大約多少，再決定要不要算到個位。', tryIt: '拖一拖，把數想成接近的整百。', states: [0, 1, 2],
    pic: (v, n) => { const a = v >= .5 ? 400 : 398, b = v >= .5 ? 500 : 505; return c3s(c3e(70, 34, '👟', 40) + c3e(250, 34, '🎒', 40) + c3t(70, 80, a, 30, v >= .5 ? '#d6476b' : '#33405a') + c3t(250, 80, b, 30, v >= .5 ? '#d6476b' : '#33405a') + c3t(160, 80, '＋', 30) + (v >= 1.5 ? c3t(160, 120, '400＋500＝900', 24, '#2f9e6a') + c3t(160, 152, '398＜400　505＜600', 18, '#2f5f9e') : ''), n ? [['估算', 160, 34, 'stick']] : []); },
    note: v => ['398 和 505，先估計大約多少', '398 接近 400，505 接近 500，大約 900 元', '398 比 400 少，505 比 600 少，加起來一定比 1000 少'][v],
    found: '大約 900 元。再檢查：398 比 400 少，505 比 600 少，合起來一定比 400＋600＝1000 少，所以一定夠。', name: `把數想成接近又好算的整百，先算出大約多少，叫${cT('估算')}。`, loop: [0, 1, 2],
    check: { q: '每盒 198 元，買 3 盒，帶 500 元。用估算想一想，夠不夠？', pic: () => c3s(c3e(100, 80, '📦', 60) + c3t(200, 80, '198×3', 34)), opts: ['夠', '不夠'], a: 1, why: '198 接近 200。每盒大約 200 元，3 盒大約多少？和 500 比一比。', ok: '對了！每盒大約 200 元，3 盒大約 600 元。198 只比 200 少 2，3 盒也只少 6 元，還是比 500 元多，所以不夠。' } },
  { key: 'split', title: '拆開來乘', terms: ['拆開來乘'], sem: '三上', game: 'fact', hook: '買很多包貼紙', when: ['fact:split'],
    ask: '每包 23 張貼紙，買 4 包，共幾張？一張一張數太慢了。', tryIt: '拖一拖，把每一包分成 20 張和 3 張。', states: [0, 1, 2],
    pic: (v, n) => { const s = 12, x0 = 22, y0 = 12; let o = ''; const cut = v >= .5; for (let j = 0; j < 4; j++) for (let i = 0; i < 23; i++) o += `<rect x="${x0 + i * s + (cut && i >= 20 ? 8 : 0)}" y="${y0 + j * s * 1.5}" width="${s - 2}" height="${s * 1.5 - 2}" rx="2" fill="${cut && i >= 20 ? '#f0a03c' : '#6ea8dc'}"/>`; if (v >= 1.5) o += c3t(130, 106, '20×4＝80', 22, '#2f5f9e') + c3t(280, 106, '3×4＝12', 18, '#a9702a') + c3t(160, 142, '80＋12＝92', 26, '#2f9e6a'); return c3s(o, n ? [['拆開來乘', 262, 150, 'stick']] : []); },
    note: v => ['每包 23 張，有 4 包：23×4', '每一包都分成 20 張和 3 張', '4 包的 20 張是 80 張，4 包的 3 張是 12 張，合起來 92 張'][v],
    found: '每一包都有 20 張和 3 張。20 張要算 4 包，3 張也要算 4 包，最後合起來。', name: `把 23 分成 20 和 3，兩部分都乘 4，再加起來，叫${cT('拆開來乘')}。`, loop: [1, 2],
    check: { q: '每箱 31 瓶，有 5 箱。拆開來乘，哪一個對？', pic: () => c3s(c3e(160, 70, '📦', 70) + c3t(160, 140, '31×5', 28)), opts: ['30×5＋1×5', '30×5＋1', '30＋1×5'], a: 0, why: '每一箱都有 30 瓶和 1 瓶。5 箱的 1 瓶，也要算進去嗎？', ok: '對了！30×5＝150，1×5＝5，150＋5＝155 瓶。30 和 1 都要乘 5。' } },
  { key: 'two', title: '兩步驟', terms: ['兩步驟'], sem: '三下', game: 'fact', hook: '一盒一盒的糖', when: ['fact:two'],
    ask: '每袋 5 顆糖，每盒 2 袋，買 4 盒。一共有幾顆糖？一次算不出來，可以先求什麼？', tryIt: '拖一拖，看看兩種算法。', states: [0, 1, 2, 3],
    pic: (v, n) => { const st = Math.round(v); return c3s(c3two(st), (st === 1 || st === 2 ? [['路線甲', 34, 128]] : st === 3 ? [['路線乙', 34, 128]] : []).concat(n ? [['兩步驟', 284, 128, 'stick']] : [])); },
    note: v => ['4 盒糖，每盒 2 袋，每袋 5 顆', '路線甲，第一步先求 1 盒：每袋 5 顆，有 2 袋，5×2＝10 顆', '路線甲，第二步：每盒 10 顆，有 4 盒，10×4＝40 顆', '路線乙，先求袋數：每盒 2 袋，有 4 盒，2×4＝8 袋；再求顆數：每袋 5 顆，有 8 袋，5×8＝40 顆'][v],
    found: '兩條路的第一步求的量不一樣：10 是 1 盒有幾顆，8 是一共有幾袋。最後都求到一共 40 顆。', name: `一次算不出來，先求出一個中間的量，再用它求答案，這樣的問題叫${cT('兩步驟')}問題。`, loop: [2, 3],
    check: { pre: [{ q: '剛才的路線甲裡，5×2＝10，這個 10 代表什麼？', pic: () => c3s(c3two(1)), opts: ['1 盒有幾顆糖', '一共有幾袋', '一共有幾顆糖'], a: 0, why: '看圖：5×2 是打開的那 1 盒，每袋 5 顆，有 2 袋。', ok: '對，10 是 1 盒的顆數。' }],
      q: '換一題：每盒 3 袋，每袋 6 顆，買 2 盒。一共幾顆？你想先求什麼？', head: '每盒 3 袋，每袋 6 顆，買 2 盒。', pic: () => c3s(Array.from({ length: 2 }, (_, i) => `<rect x="${40 + i * 130}" y="20" width="110" height="80" rx="6" fill="#fff6e3" stroke="#7a5b2e" stroke-width="3"/>` + [0, 1, 2].map(b => `<rect x="${48 + i * 130 + b * 34}" y="32" width="28" height="54" rx="5" fill="#a9d0f0" stroke="#2f5f9e" stroke-width="2"/>` + c3t(62 + i * 130 + b * 34, 59, 6, 17)).join('')).join('')),
      routes: [
        { label: '先求 1 盒有幾顆', steps: [
          { q: '第一步：1 盒有幾顆？', opts: ['6×3＝18', '3×2＝6', '6×2＝12'], a: 0, why: '1 盒有 3 袋，每袋 6 顆。每份 6 顆，有 3 份，怎麼寫？', ok: '對，1 盒有 18 顆。' },
          { q: '第二步：2 盒一共有幾顆？', opts: ['18×2＝36', '18＋2＝20', '6×2＝12'], a: 0, why: '每盒 18 顆，有 2 盒。', ok: '' }] },
        { label: '先求一共有幾袋', steps: [
          { q: '第一步：一共有幾袋？', opts: ['3×2＝6', '6×3＝18', '3＋2＝5'], a: 0, why: '每盒 3 袋，有 2 盒。', ok: '對，一共有 6 袋。' },
          { q: '第二步：一共有幾顆？', opts: ['6×6＝36', '3×6＝18', '6＋6＝12'], a: 0, why: '每袋 6 顆，有 6 袋。', ok: '' }] }],
      ok: '對了！兩種方法都可以。你每一步都說清楚求的是什麼量，最後都求到一共 36 顆。' } },
  { key: 'angle', title: '角', terms: ['角', '頂點'], sem: '三上', game: 'angle', hook: '兩把剪刀', when: ['angle:cmp'],
    ask: '剪刀張開時，兩片刀刃從同一點分開。刀刃比較長的剪刀，一定張得比較開嗎？', tryIt: '拖一拖：把邊變長、轉個方向，再張大。', states: [0, 1, 2, 3],
    pic: (v, n) => c3s(`<g transform="rotate(${-c3L([0, 0, 40, 0], v)} 70 145)">${c3angle(c3L([35, 35, 35, 80], v), c3L([80, 170, 80, 80], v))}</g>`, n ? [['頂點', 40, 158, 'stick'], ['角', 122, 120, 'stick']] : []),
    note: v => ['張開這麼多', '兩條邊變長了，張開的大小沒有變', '整個轉了方向，張開的大小還是沒有變', '這次兩條邊張得更開，才真的變大'][v],
    found: '比張得開不開，要看兩條邊之間張開多少；邊的長短、擺的方向都沒有關係。', name: `從同一個端點伸出的兩條邊，形成一個${cT('角')}。共同的端點叫${cT('頂點')}。`, loop: [0, 1, 2, 3],
    check: { q: '藍色的邊很長、張得小；紅色的邊很短、張得大。哪個角比較大？', pic: () => c3s(c3angle(25, 120, 0, 0, 16, 140, '#a9d0f0') + c3angle(95, 60, 0, 0, 220, 140)), opts: ['藍色', '紅色'], a: 1, why: '先找頂點，再看兩條邊之間張開多少，不要看邊多長。', ok: '對了！紅色的邊比較短，但兩條邊張得比較開，所以紅色的角比較大。' } },
  { key: 'right', title: '直角、銳角、鈍角', terms: ['直角', '銳角', '鈍角'], sem: '三上', game: 'angle', hook: '書架和牆', when: ['angle:kind', 'angle:shape'],
    ask: '書架要貼緊牆角。拿一張紙對摺，再把摺好的邊對齊，再摺一次，做出一個角。要張多開才剛好？', tryIt: '拖一拖，把紅色的角張開，和藍色的摺紙比一比。', states: [45, 90, 135],
    pic: (v, n) => c3s(c3angle(v, 110, 0, true, 120), n ? [[v < 80 ? '銳角' : v > 100 ? '鈍角' : '直角', 60, 60, 'stick']] : []),
    note: v => ({ 45: '比摺紙的角小', 90: '和摺紙的角剛好一樣', 135: '比摺紙的角大，兩條邊還沒有張成一直線' }[v]),
    found: '有的角比摺紙的角小，有的剛好一樣，有的比較大。', name: `和摺紙的角一樣大的叫${cT('直角')}。比直角小的角叫${cT('銳角')}。比直角大、兩條邊還沒有張成一直線的角叫${cT('鈍角')}。`, loop: [0, 1, 2],
    check: { q: '時鐘 2 點，長針指 12，短針指 2。兩針張開的角是什麼角？', pic: () => { let o = '<circle cx="160" cy="85" r="76" fill="#fff" stroke="#33405a" stroke-width="5"/><path d="M160 85V22" stroke="#33405a" stroke-width="5" stroke-linecap="round"/><path d="M160 85L200 62" stroke="#33405a" stroke-width="7" stroke-linecap="round"/>'; return c3s(o); }, opts: ['銳角', '直角', '鈍角'], a: 0, why: '3 點時兩針張開剛好是直角。2 點張開的比 3 點多還是少？', ok: '對了！2 點兩針張開的角比 3 點的直角小，是銳角。' } },
  { key: 'perim', title: '周長', terms: ['周長'], sem: '三上', game: 'angle', hook: '菜園的籬笆', when: ['angle:pwalk', 'angle:padd', 'angle:pline'],
    ask: '長方形菜園長 6 公尺、寬 4 公尺，要沿著邊圍一圈籬笆，不留門口。要買多長？', tryIt: '拖小羊，沿著邊走。', states: [6, 10, 20],
    pic: (v, n) => { const W = 180, H = 120, x0 = 70, y0 = 25, u = 30, L = v * u; let d = `M${x0} ${y0}`, x = x0, y = y0, r = L; [[1, 0, W], [0, 1, H], [-1, 0, W], [0, -1, H]].forEach(([a, b, s]) => { const t = Math.min(r, s); x += a * t; y += b * t; if (t > 0) d += `L${x} ${y}`; r -= t; }); return c3s(`<rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="#cfe6c6" stroke="#7a9a62" stroke-width="3"/><path d="${d}" fill="none" stroke="#d6476b" stroke-width="6"/>${c3e(x, y, '🐑', 30)}`, [['6 公尺', 160, 10], ['4 公尺', 34, 85]].concat(n ? [['周長', 160, 85, 'stick']] : [])); },
    note: v => v === 20 ? '回到起點：6＋4＋6＋4＝20 公尺' : `走了 ${v} 公尺`,
    found: '沿著四條邊走一圈：6＋4＋6＋4＝20，要買 20 公尺。', name: `沿著圖形的邊界繞一圈的長度，叫${cT('周長')}。`, loop: [0, 1, 2],
    check: { q: '正方形花圃每邊 5 公尺，周長是幾公尺？', pic: () => c3s('<rect x="100" y="25" width="120" height="120" fill="#cfe6c6" stroke="#7a9a62" stroke-width="3"/>' + c3t(160, 85, 5, 28)), opts: ['5', '10', '20'], a: 2, why: '正方形有 4 條邊，每條都是 5 公尺。每條邊都要走到。', ok: '對了！每邊 5 公尺，有 4 邊，5×4＝20 公尺。' } },
  { key: 'division', title: '除法', terms: ['除法'], sem: '三上', game: 'div', hook: '分貝殼', when: ['div:deal'],
    ask: '9 顆貝殼平分給 3 個人，每人一樣多。每人幾顆？', tryIt: '拖一拖，一輪一輪發貝殼。', states: [0, 1, 2, 3],
    pic: (v, n) => c3s(c3deal(9, 3, Math.floor(v * 3 + .01)) + (n ? c3t(160, 20, '9÷3＝3', 26, '#d6476b') : ''), n ? [['除法', 270, 20, 'stick']] : []),
    note: v => v ? `發了 ${v} 輪，每人 ${v} 顆，還有 ${9 - 3 * v} 顆` : '9 顆，3 個人',
    found: '一輪發 3 顆，發了 3 輪剛好發完，每人 3 顆，一樣多。', name: `把 9 顆平分給 3 個人，每人 3 顆，寫成 9÷3＝3，讀作「9 除以 3 等於 3」。這種算法叫${cT('除法')}。`, loop: [3],
    check: { steps: [
      { q: '12 張卡片平分給 4 個人，每人幾張？要用哪個算式？', pic: () => c3s(c3deal(12, 4, 0, '🃏')), opts: ['12÷4', '12－4', '4×12'], a: 0, why: '12 張平分成 4 份，求每份幾張。平分要用哪一種算法？', ok: '對了！12÷4＝3，每人 3 張。' },
      { q: '換個問法：15 張卡片，每人分 5 張，可以分給幾個人？', pic: () => c3s(c3e(160, 80, '🃏', 70)), opts: ['15÷5', '15－5', '5×15'], a: 0, why: '每次拿 5 張給一個人，15 張可以拿幾次？', ok: '對了！15÷5＝3，可以分給 3 個人。知道每人幾張、求能分給幾人，也用除法。' }] } },
  { key: 'rem', title: '餘數', terms: ['餘數'], sem: '三上', game: 'div', hook: '多出來的貝殼', when: ['div:deal'], need: q => q.r > 0,
    ask: '10 顆貝殼平分給 3 個人，每人一樣多，貝殼不能切開。分得完嗎？', tryIt: '拖一拖，一輪一輪發貝殼。', states: [1, 2, 3],
    pic: (v, n) => c3s(c3deal(10, 3, Math.floor(v * 3 + .01)), n ? [['餘數', 214, 20, 'stick']] : []),
    note: v => v === 3 ? '還剩 1 顆，比 3 個人少，不夠每人再發 1 顆' : `發了 ${v} 輪，還有 ${10 - 3 * v} 顆`,
    found: '每人 3 顆，剩下 1 顆。1 比 3 小，不夠再發一輪。', name: `10÷3＝3…1。一輪一輪發整顆，最後不夠再發一輪、剩下的 1，叫${cT('餘數')}。餘數一定比分的人數少。`, loop: [2],
    check: { q: '17 顆糖平分給 5 個人，糖不能切開。餘數是多少？', pic: () => c3s(c3deal(17, 5, 15, '🍬')), opts: ['1', '2', '3'], a: 1, why: '一輪發 5 顆。發了 3 輪用掉幾顆？剩下的夠不夠再發一輪？', ok: '對了！發 3 輪用掉 15 顆，剩 2 顆，比 5 少，不能再發，17÷5＝3…2，餘數是 2。' } },
  { key: 'parts', title: '驗算', terms: ['被除數', '除數', '商', '驗算'], sem: '三上', game: 'div', hook: '有沒有分錯', when: ['div:check', 'div:rule'],
    ask: '14 顆貝殼平分給 4 個人，每人 3 顆，留下 2 顆。怎麼知道有沒有分錯？', tryIt: '拖一拖，把貝殼收回來。', states: [0, 1, 2],
    pic: (v, n) => { const o = c3deal(14, 4, v < .5 ? 12 : 0); if (v < .5) return c3s(o); return c3s((n ? c3t(160, 26, '14÷4＝3…2', 38, '#d6476b') : '') + c3t(n ? 90 : 160, n ? 130 : 50, '3×4＝12', n ? 24 : 34, '#2f5f9e') + (v >= 1.5 ? c3t(n ? 235 : 160, n ? 130 : 105, '12＋2＝14', n ? 24 : 34, '#2f9e6a') : ''), n ? [['被除數', 72, 68, 'stick'], ['除數', 148, 68, 'stick'], ['商', 200, 68, 'stick']] : []); },
    note: v => ['每人 3 顆，留下 2 顆', '每人 3 顆，有 4 個人：3×4＝12 顆', '12 顆再加留下的 2 顆，是 14 顆'][v],
    found: '收回來剛好是原來的 14 顆；留下的 2 顆比 4 個人少，不能再發一輪。兩件事都對，才沒有分錯。', name: `14÷4＝3…2 裡，被分的 14 叫${cT('被除數')}，分給 4 人的 4 叫${cT('除數')}，每人分到的 3 叫${cT('商')}。用商×除數＋餘數算回被除數，再看餘數比除數小，叫${cT('驗算')}。`, loop: [1, 2],
    check: { steps: [
      { q: '23÷5＝4…3，驗算要怎麼算？', pic: () => c3s(c3t(160, 80, '23÷5＝4…3', 38)), opts: ['4×5＋3', '4×3＋5', '23×5＋3'], a: 0, why: '每人 4 顆，有 5 個人，再加上留下的 3 顆。', ok: '對了！4×5＋3＝23，算回來是被除數 23。' },
      { q: '小華算 23÷5＝3…8。3×5＋8 也是 23。這個答案對嗎？', pic: () => c3s(c3t(160, 80, '23÷5＝3…8 ?', 38)), opts: ['對，算回來是 23', '不對，餘數 8 比除數 5 大'], a: 1, why: '剩下 8 顆，夠不夠 5 個人再各分 1 顆？', ok: '對了！餘數要比除數小。剩 8 顆還能再分一輪，正確是 23÷5＝4…3。' }] } },
  { key: 'odd', title: '奇數和偶數', terms: ['奇數', '偶數'], sem: '三上', game: 'div', hook: '兩個一對', when: ['div:odd'],
    ask: '把積木兩個兩個排成一對。幾個積木排完，剛好沒有剩？', tryIt: '拖一拖，換積木的個數試試看。', states: [6, 7, 8],
    pic: (v, n) => { const c = Math.round(v); let o = ''; for (let i = 0; i < c; i++) { const p = Math.floor(i / 2), alone = c % 2 && i === c - 1; o += `<rect x="${22 + p * 66}" y="${22 + (i % 2) * 52}" width="44" height="44" rx="6" fill="${alone ? '#f0a03c' : '#6ea8dc'}" stroke="#2f5f9e" stroke-width="2"/>`; if (i % 2) o += `<rect x="${16 + p * 66}" y="16" width="56" height="108" rx="10" fill="none" stroke="#2f9e6a" stroke-width="3" stroke-dasharray="6 4"/>`; } return c3s(o, n ? [[c % 2 ? '奇數' : '偶數', 160, 150, 'stick']] : []); },
    note: v => v % 2 ? `${v} 個：排成 ${(v - 1) / 2} 對，剩 1 個` : `${v} 個：排成 ${v / 2} 對，剛好排完`,
    found: '有的個數兩個兩個排，剛好排完；有的個數一定剩 1 個。', name: `兩個兩個排剛好排完的數叫${cT('偶數')}，會剩 1 個的叫${cT('奇數')}。0 個也剛好沒有剩，0 是偶數。`, loop: [0, 1, 2],
    check: { q: '25 個積木，兩個兩個排成一對。25 是什麼數？', pic: () => c3s(c3t(160, 80, 25, 70)), opts: ['偶數', '奇數'], a: 1, why: '20 個可以剛好排完。再看個位的 5 個，兩個兩個排，會不會剩 1 個？', ok: '對了！20 個剛好排完，5 個排成 2 對還剩 1 個，25 是奇數。' } },
  { key: 'bigfirst', title: '先分大的', terms: ['先分大的'], sem: '三下', game: 'div', hook: '一包一包分', when: ['div:split'],
    ask: '64 顆貝殼，有 6 包（每包 10 顆）和 4 顆。2 個人平分，怎麼分比較快？', tryIt: '拖一拖，分給兩個人。', states: [0, 1, 2],
    pic: (v, n) => { let o = c3e(80, 60, '🙂', 34) + c3e(240, 60, '🙂', 34); const P = (x, y) => `<rect x="${x}" y="${y}" width="28" height="26" fill="#f0a03c" stroke="#a9702a" stroke-width="2"/>${c3t(x + 14, y + 13, 10, 14)}`; if (v < .5) { for (let i = 0; i < 6; i++) o += P(50 + i * 32, 6); for (let i = 0; i < 4; i++) o += c3e(120 + i * 26, 110, '🐚', 20); } else { [50, 210].forEach(x => { for (let i = 0; i < 3; i++) o += P(x + i * 30 - 10, 90); if (v >= 1.5) { o += c3e(x + 10, 140, '🐚', 20) + c3e(x + 40, 140, '🐚', 20); } }); if (v < 1.5) for (let i = 0; i < 4; i++) o += c3e(120 + i * 26, 22, '🐚', 20); } return c3s(o, n ? [['先分大的', 160, 155, 'stick']] : []); },
    note: v => ['6 包和 4 顆', '先分整包的：每人 3 包', '再分單顆的：每人 2 顆。每人 3 包和 2 顆，是 32 顆'][v],
    found: '先分整包的十，再分單顆的一，很快就分完：每人 32 顆。', name: `先分整十（整包），再分一（單顆）；整包分不完，就拆開成一顆一顆再分。這樣分叫${cT('先分大的')}。`, loop: [0, 1, 2],
    check: { steps: [
      { q: '96 顆，有 9 包（每包 10 顆）和 6 顆，3 個人平分。先分大的，要先分哪一個？', pic: () => c3s(c3t(160, 80, '96÷3', 50)), opts: ['9 包', '6 顆'], a: 0, why: '一包有 10 顆。先分整包的，還是先分單顆的？', ok: '對了！先分 9 包，每人 3 包；再分 6 顆，每人 2 顆。' },
      { q: '52 顆，有 5 包和 2 顆，2 個人平分。每人先拿 2 包，還剩 1 包。接下來怎麼辦？', pic: () => c3s([0, 1, 2, 3, 4].map(i => `<rect x="${40 + i * 50}" y="40" width="40" height="36" fill="${i === 4 ? '#f7c35c' : '#f0a03c'}" stroke="#a9702a" stroke-width="2"/>${c3t(60 + i * 50, 58, 10, 16)}`).join('') + c3e(130, 120, '🐚', 22) + c3e(190, 120, '🐚', 22)), opts: ['把 1 包拆成 10 顆，和 2 顆一起分', '剩下的 1 包不要分了', '把 1 包給其中一個人'], a: 0, why: '每人要一樣多。剩下的那 1 包，可以拆開來分嗎？', ok: '對了！拆開是 10 顆，加 2 顆是 12 顆，每人再拿 6 顆。每人 2 包和 6 顆，是 26 顆。' }] } },
  { key: 'inverse', title: '乘除互逆', terms: ['乘除互逆'], sem: '三下', game: 'div', hook: '要裝幾袋', when: ['div:missing'],
    ask: '每袋裝 6 顆，一共有 24 顆，要裝幾袋？', tryIt: '拖一拖，一袋一袋加。', states: [2, 3, 4],
    pic: (v, n) => { const c = Math.floor(v + .01); let o = ''; for (let i = 0; i < c; i++) { o += `<rect x="${14 + i * 74}" y="10" width="66" height="72" rx="10" fill="#fde8c8" stroke="#a9702a" stroke-width="2"/>`; for (let k = 0; k < 6; k++) o += `<circle cx="${30 + i * 74 + (k % 3) * 17}" cy="${30 + Math.floor(k / 3) * 28}" r="7" fill="#d6476b"/>`; } o += c3t(160, 124, `6×${n ? '□' : c}＝${n ? 24 : 6 * c}`, 32, c === 4 ? '#2f9e6a' : '#33405a') + (n ? c3t(90, 156, '24÷6＝4', 24, '#d6476b') : ''); return c3s(o, n ? [['乘除互逆', 262, 156, 'stick']] : []); },
    note: v => v === 4 ? '6×4＝24，剛好 4 袋' : `6×${v}＝${6 * v}，還不到 24 顆`,
    found: '一袋一袋加，試到 4 袋剛好 24 顆。用 24÷6 也能直接算出 4。', name: `6×□＝24，可以用 24÷6 求出 □ 是 4，再用 6×4＝24 檢查。乘和除可以互相還原，叫${cT('乘除互逆')}。`, loop: [2],
    check: { q: '□×5＝35，用乘除互逆，□ 怎麼算？', pic: () => c3s(c3t(160, 80, '□×5＝35', 44)), opts: ['35÷5', '35×5', '35－5'], a: 0, why: '反過來用除的：35 裡面有幾個 5？', ok: '對了！35÷5＝7，再用 7×5＝35 檢查，沒錯。' } },
  { key: 'pattern', title: '規律', terms: ['規律'], sem: '三下', game: 'rule', hook: '花盆的號碼', when: ['rule:seq', 'rule:grow'],
    ask: '花盆號碼是 3、6、9。如果每次都多 3，接下來該寫幾號？', tryIt: '拖一拖，再多放幾盆。', states: [4, 5, 6],
    pic: (v, n) => { const c = Math.floor(v + .01); let o = ''; for (let i = 0; i < c; i++) { o += c3e(30 + i * 52, 60, '🌷', 34) + c3t(30 + i * 52, 106, 3 * (i + 1), 22, i >= 3 ? '#d6476b' : '#33405a'); if (i) o += c3t(4 + i * 52, 84, '+3', 13, '#2f9e6a'); } return c3s(o, n ? [['規律', 160, 145, 'stick']] : []); },
    note: v => `第 ${v} 盆是 ${3 * v} 號，比前一盆多 3`,
    found: '照「每次多 3」一直走下去：3、6、9、12、15、18。', name: `數或圖照同一個方法一直變下去，這個方法叫${cT('規律')}。`, loop: [0, 1, 2],
    check: { q: '20、18、16、14，這串數的規律是什麼？', pic: () => c3s(c3t(160, 80, '20  18  16  14', 36)), opts: ['每次多 2', '每次少 2', '每次少 4'], a: 1, why: '從 20 到 18，再從 18 到 16，每次變多還是變少？差幾？', ok: '對了！每一次都少 2。照這個規律，下一個是 12。' } },
  { key: 'frac', title: '分數', terms: ['分數'], sem: '三上', game: 'frac', hook: '三個人一個蛋糕', when: ['frac:unit'],
    ask: '1 個蛋糕，3 個人平分。每人吃到多少？1 個太多，0 個也不對。', tryIt: '拖一拖，移動刀子，切到一樣大。', states: [0, 1, 2],
    pic: (v, n) => { const a = [0, 1, 2].map(i => c3L(C3_CUT.map(r => r[i]), v)); return c3s(c3sec(160, 85, 78, 0, a[0], n ? '#f08a8a' : '#fff0cf') + c3sec(160, 85, 78, a[0], a[0] + a[1], '#fde8c8') + c3sec(160, 85, 78, a[0] + a[1], 360, '#ffe9b0') + (n ? c3frac(290, 85, 1, 3, 26) : ''), n ? [['分數', 290, 28, 'stick']] : []); },
    note: v => ['一塊大、一塊小，不公平', '還是不一樣大', '三塊一樣大，這才是平分'][v],
    found: '每人拿其中 1 塊，比 1 個少，要用新的數來說。', name: `1 個蛋糕平均分成 3 份，其中 1 份是三分之一個，寫成 ${fracHtml(1, 3)}。這樣的數叫${cT('分數')}。`, loop: [2],
    check: { q: '1 條長條蛋糕平均切成 4 段，4 個人各拿 1 段。每人拿到幾條？', pic: () => c3s(c3fish(40, 70, 240, 4, 1)), opts: [fracHtml(1, 4), fracHtml(1, 3), fracHtml(4, 1)], a: 0, why: '這條蛋糕平均切成幾段？每人拿其中幾段？', ok: '對了！平均切成 4 段，1 段是四分之一條。' } },
  { key: 'numer', title: '分子和分母', terms: ['分子', '分母'], sem: '三上', game: 'frac', hook: '我吃了 3 塊', when: ['frac:name', 'frac:make', 'frac:accum'],
    ask: '只說「我吃了 3 塊派」，別人知道你吃了多少嗎？', tryIt: '拖一拖，同樣大的派，換不同切法看看。', states: [0, 1, 2],
    pic: (v, n) => { const i = Math.round(v), m = [4, 8, 5][i]; return c3s(c3pie(n ? 110 : 160, 85, 76, m, 3) + (n ? c3frac(240, 85, 3, m, 30) : ''), n ? [['分子', 295, 58, 'stick'], ['分母', 295, 112, 'stick']] : []); },
    note: v => ['平均切 4 塊，吃 3 塊', '平均切 8 塊，也吃 3 塊，可是吃得比較少', '平均切 5 塊，吃 3 塊'][v],
    found: '派一樣大，光說吃 3 塊不夠，還要說平均切成幾塊。', name: `以一個派當作 1，下面的數表示平均分成幾份，叫${cT('分母')}；上面的數表示拿了幾份，叫${cT('分子')}。`, loop: [0, 1, 2],
    check: { q: '一條吐司平均切成 7 片，吃了 3 片。寫成分數時，分母是多少？', pic: () => c3s(c3fish(40, 70, 240, 7, 3)), opts: ['3', '7', '10'], a: 1, why: '分母是平均分成幾份。數一數這條吐司切成幾片。', ok: `對了！平均切成 7 片，分母是 7；吃了 3 片，分子是 3，是 ${fracHtml(3, 7)} 條。` } },
  { key: 'same', title: '同分母', terms: ['同分母'], sem: '三下', game: 'frac', hook: '一塊一塊放', when: ['frac:cmp', 'frac:add', 'frac:sub'],
    ask: '派平均切成 6 塊。有 2 塊，再放 3 塊，一共是幾分之幾個派？', tryIt: '拖一拖，一塊一塊放。', states: [2, 3, 5],
    pic: (v, n) => c3s(c3pie(120, 85, 76, 6, Math.floor(v + .01)) + (n ? c3frac(255, 85, Math.floor(v + .01), 6, 30) : ''), n ? [['同分母', 255, 20, 'stick']] : []),
    note: v => v === 2 ? `2 塊，是 ${fracHtml(2, 6)} 個` : v === 3 ? '再放 1 塊，3 塊' : `再放 2 塊，一共 5 塊，是 ${fracHtml(5, 6)} 個`,
    found: `每塊都是 ${fracHtml(1, 6)} 個，一樣大。2 塊再放 3 塊是 5 塊，就是 ${fracHtml(5, 6)}；切成幾塊沒有變。`, name: `分母一樣的分數，叫${cT('同分母')}分數。同一個整體、每份一樣大，比大小、加、減都只要數有幾份，分母不變。`, loop: [0, 1, 2],
    check: { steps: [
      { q: `同一個派：${fracHtml(3, 7)} 和 ${fracHtml(5, 7)}，哪一個比較大？`, pic: () => c3s(c3pie(88, 85, 64, 7, 3) + c3pie(232, 85, 64, 7, 5)), opts: [fracHtml(3, 7), fracHtml(5, 7)], a: 1, why: '兩個派一樣大，都平均切 7 份。比一比誰的份數多。', ok: `對了！5 份比 3 份多，${fracHtml(5, 7)} 比較大。` },
      { q: `${fracHtml(2, 7)}＋${fracHtml(3, 7)} 是多少？`, pic: () => c3s(c3pie(160, 85, 76, 7, 2, 3)), opts: [fracHtml(5, 7), fracHtml(5, 14), fracHtml(6, 7)], a: 0, why: `每份都是 ${fracHtml(1, 7)}。2 份再加 3 份是幾份？每份的大小有變嗎？`, ok: `對了！2 份加 3 份是 5 份，是 ${fracHtml(5, 7)}，分母不變。` },
      { q: `${fracHtml(5, 7)}－${fracHtml(2, 7)} 是多少？`, pic: () => c3s(c3pie(160, 85, 76, 7, 3, 2, '#d9d9d9')), opts: [fracHtml(3, 7), fracHtml(7, 7), fracHtml(2, 7)], a: 0, why: '5 份拿走 2 份（灰色），還剩幾份？', ok: `對了！5 份拿走 2 份剩 3 份，是 ${fracHtml(3, 7)}。` }] } },
  { key: 'center', title: '圓心', terms: ['圓心'], sem: '三上', game: 'circle', hook: '小羊和繩子', when: ['circle:center'],
    ask: '小羊用繩子綁在木樁上，繩子拉直走一圈。走過的路是什麼形狀？', tryIt: '拖一拖，帶小羊走。', states: [100, 220, 360],
    pic: (v, n) => { const a = v * Math.PI / 180, x = 160 + 70 * Math.sin(a), y = 85 - 70 * Math.cos(a), big = v > 180 ? 1 : 0; return c3s(`${v >= 359 ? '<circle cx="160" cy="85" r="70" fill="#dfeafa" stroke="#d6476b" stroke-width="4"/>' : `<path d="M160 15A70 70 0 ${big} 1 ${x} ${y}" fill="none" stroke="#d6476b" stroke-width="4"/>`}<path d="M160 85L${x} ${y}" stroke="#a9702a" stroke-width="3"/><circle cx="160" cy="85" r="7" fill="#33405a"/>${c3e(x, y, '🐑', 28)}`, n ? [['圓心', 210, 90, 'stick']] : []); },
    note: v => v === 360 ? '走回起點了' : v === 100 ? '走了一小段，繩子拉得直直的' : '走了大半圈，繩子還是一樣長',
    found: '繩子綁在同一點、一樣長又拉直，走出來的是一個圓。木樁在正中間。', name: `圓正中間的這個點，叫${cT('圓心')}。圓上每一點到圓心都一樣遠。`, loop: [0, 1, 2],
    check: { q: '用圓規畫圓，尖尖的腳踩著的那一點是什麼？', pic: () => c3s('<circle cx="160" cy="85" r="70" fill="#dfeafa" stroke="#3b82c4" stroke-width="3"/><circle cx="160" cy="85" r="6" fill="#d6476b"/>'), opts: ['圓心', '圓的邊'], a: 0, why: '筆繞著畫一圈，尖腳一直踩在同一點。那一點在圓的哪裡？', ok: '對了！尖腳踩的點是圓心，筆畫出的每一點離它都一樣遠。' } },
  { key: 'radius', title: '半徑和直徑', terms: ['半徑', '直徑'], sem: '三上', game: 'circle', hook: '水池上的橋', when: ['circle:name', 'circle:size', 'circle:long'],
    ask: '圓形水池要架一座最長的橋，從池邊到池邊。要架在哪裡？', tryIt: '拖橋，上下移動看看。', states: [55, 30, 0],
    pic: (v, n) => { const R0 = 75, w = Math.sqrt(R0 * R0 - v * v), y = 85 - v; return c3s(`<circle cx="160" cy="85" r="${R0}" fill="#cfe4f7" stroke="#3b82c4" stroke-width="3"/><circle cx="160" cy="85" r="5" fill="#33405a"/><path d="M${160 - w} ${y}H${160 + w}" stroke="#d6476b" stroke-width="7" stroke-linecap="round"/>${n ? '<path d="M160 85L213 32" stroke="#2f9e6a" stroke-width="6" stroke-linecap="round"/>' : ''}`, n ? [['直徑', 62, 85, 'stick'], ['半徑', 260, 40, 'stick']] : []); },
    note: v => v === 0 ? '穿過正中間，最長' : v === 55 ? '這座橋太短了' : '長一點了，還不是最長',
    found: '穿過正中間的橋最長，剛好是兩段「從中間到池邊」接起來。', name: `從圓心到圓上一點的線段叫${cT('半徑')}。穿過圓心、兩端都在圓上的線段叫${cT('直徑')}。直徑是半徑的 2 倍。`, loop: [2],
    check: { q: '圓形貼紙的半徑是 4 公分，直徑是幾公分？', pic: () => c3s('<circle cx="160" cy="85" r="75" fill="#fde8c8" stroke="#a9702a" stroke-width="3"/><path d="M160 85H235" stroke="#2f9e6a" stroke-width="6"/>' + c3t(198, 68, 4, 24)), opts: ['2', '4', '8'], a: 2, why: '直徑穿過圓心，是兩條半徑接起來。', ok: '對了！兩條 4 公分的半徑接起來，4×2＝8 公分。' } },
  { key: 'mm', title: '毫米', terms: ['毫米'], sem: '三上', game: 'mm', hook: '量緞帶', when: ['mm:read', 'mm:cut', 'mm:to', 'mm:from', 'mm:guess'],
    ask: '緞帶比 4 公分長一點，比 5 公分短。要怎麼說才準？', tryIt: '拖一拖，把尺放大看（畫面只是示意，不是真的長度）。', states: [0, 1, 2],
    pic: (v, n) => c3s(c3ruler(v), n ? [['毫米', 95, 25, 'stick']] : []),
    note: v => ['比 4 公分長，比 5 公分短', '放大看：1 公分裡平均分成 10 小格', '超過 4 公分 3 小格'][v],
    found: '這把尺每 1 公分平均分成 10 小格，用小格量才準。', name: `這把尺每 1 公分平均分成 10 小格，每小格長 1 ${cT('毫米')}，10 毫米＝1 公分。緞帶長 4 公分 3 毫米。`, loop: [1, 2],
    check: { q: '橡皮擦長 5 公分 2 毫米，是幾毫米？', pic: () => c3s(c3e(160, 80, '🧽', 70)), opts: ['7 毫米', '52 毫米', '502 毫米'], a: 1, why: '1 公分＝10 毫米。5 公分是幾毫米？再加上 2 毫米。', ok: '對了！5 公分是 5 個 10 毫米，50 毫米，再加 2 毫米，是 52 毫米。' } },
  { key: 'ml', title: '公升和毫升', terms: ['公升', '毫升'], sem: '三上', game: 'meas', hook: '兩桶水', when: ['meas:to', 'meas:from', 'meas:pick'], need: q => /公升|毫升/.test(JSON.stringify(q)),
    ask: '哥哥和妹妹都說：「我的桶裝了 5 杯水。」兩桶水一樣多嗎？', tryIt: '拖一拖，倒水看看。', states: [1, 3, 5],
    pic: (v, n) => c3s(c3bucket(40, v * .18) + c3bucket(190, v * .05) + '<rect x="66" y="8" width="38" height="44" rx="4" fill="#dfeafa" stroke="#33405a" stroke-width="3"/>' + c3e(235, 34, '🥛', 22), n ? [['公升', 85, 110, 'stick'], ['毫升', 235, 110, 'stick']] : []),
    note: v => v === 5 ? '都是 5 杯，水卻差很多' : `兩人都倒了 ${v} 杯`,
    found: '兩個杯子大小不一樣，只說幾杯講不清楚。大家要用同樣的容量單位。', name: `大家約好的容量單位有 1 ${cT('公升')}和 1 ${cT('毫升')}，1 公升＝1000 毫升。`, loop: [1, 2],
    check: { q: '鮮奶倒滿 2 個 1 公升的量杯，一共有多少？', pic: () => c3s(c3e(120, 80, '🥛', 66) + c3e(200, 80, '🥛', 66)), opts: ['2 公升', '2 毫升', '20 公升'], a: 0, why: '1 個量杯裝 1 公升，倒滿了 2 個。', ok: '對了！每杯 1 公升，有 2 杯，1×2＝2 公升。' } },
  { key: 'sec', title: '秒', terms: ['秒'], sem: '三下', game: 'meas', hook: '賽跑誰快', when: ['meas:to', 'meas:from', 'meas:pick'], need: q => /小時|秒|分鐘/.test(JSON.stringify(q)) || q.per === 60,
    ask: '兩個人在同一條跑道、同時出發，都不到 1 分鐘就到終點。分針只移動一點點，怎麼比誰快？', tryIt: '拖紅色細針，看它走。', states: [5, 10, 15],
    pic: (v, n) => c3clock(v, n ? [['秒針', 270, 40, 'stick']] : []),
    note: v => `紅色細針走了 ${v} 小格；分針也在慢慢移動，只是很慢`,
    found: '紅色細針走得快，短短的時間也讀得出來，就比得出誰快。', name: `紅色細針叫秒針，走 1 小格是 1 ${cT('秒')}，走一圈是 60 秒，也就是 1 分鐘。`, loop: [0, 1, 2],
    check: { q: '小安和小明在同一條跑道、同時出發。小安 12 秒跑到，小明 15 秒跑到。誰比較快？', pic: () => c3clock(12), opts: ['小安', '小明'], a: 0, why: '跑同樣長的路，用的秒數比較少的，比較快。', ok: '對了！同樣的路，小安只用 12 秒，比 15 秒少，小安比較快。' } },
  { key: 'kg', title: '公斤和公克', terms: ['公斤', '公克'], sem: '三下', game: 'meas', hook: '書包有多重', when: ['meas:to', 'meas:from', 'meas:pick', 'meas:dial'], need: q => q.mode === 'dial' || /公斤|公克/.test(JSON.stringify(q)),
    ask: '書包有多重？用手掂掂說不準。用兩邊一樣長的天平，和一樣重的砝碼比比看。', tryIt: '拖一拖，在右邊放砝碼。', states: [1, 2, 3],
    pic: (v, n) => { const tilt = (3 - v) * 7; let o = `<path d="M160 160V70" stroke="#33405a" stroke-width="6"/><path d="M130 160H190" stroke="#33405a" stroke-width="6"/><g transform="rotate(${-tilt} 160 70)"><path d="M50 70H270" stroke="#33405a" stroke-width="6"/>${c3e(60, 44, '🎒', 44)}`; const c = Math.floor(v + .01); for (let i = 0; i < c; i++) o += `<rect x="${222 + i * 22 - 22}" y="50" width="20" height="20" fill="#77809a" stroke="#33405a"/>`; return c3s(o + '</g>', n ? [['公斤', 260, 110, 'stick'], ['公克', 60, 120, 'stick']] : []); },
    note: v => v === 3 ? '放了 3 個砝碼，兩邊一樣平' : `放了 ${v} 個砝碼，書包那一邊比較低，書包比較重`,
    found: '書包和 3 個一樣重的砝碼一樣平。砝碼要大家都一樣，才說得清楚。', name: `這組砝碼每個都重 1 ${cT('公斤')}，書包重 3 公斤。比較輕的東西用${cT('公克')}，1 公斤＝1000 公克。`, loop: [2],
    check: { q: '西瓜放在天平一邊，另一邊放 5 個 1 公斤的砝碼，兩邊一樣平。西瓜多重？', pic: () => c3s(c3e(160, 80, '🍉', 80)), opts: ['5 公斤', '5 公克', '1 公斤'], a: 0, why: '每個砝碼 1 公斤，放了 5 個。', ok: '對了！每個 1 公斤，有 5 個，1×5＝5 公斤。' } },
  { key: 'area', title: '面積', terms: ['面積', '平方公分'], sem: '三下', game: 'area', hook: '兩塊地', when: ['area:pick', 'area:count', 'area:same', 'area:cut', 'area:half'],
    ask: '甲、乙兩塊地形狀不一樣，疊在一起也比不出來。哪一塊地比較大？', tryIt: '拖一拖，用同樣大的方格鋪滿。', states: [0, 1, 2],
    pic: (v, n) => { const f = v / 2; return c3s(c3plot(20, 30, 4, 3, 28, Math.round(12 * f), '#8fce7a') + c3plot(170, 44, 5, 2, 28, Math.round(10 * f), '#8fce7a'), [['甲', 76, 16], ['乙', 240, 30]].concat(n ? [['面積', 76, 150, 'stick'], ['平方公分', 240, 130, 'stick']] : [])); },
    note: v => ['形狀不一樣，看不出哪一塊大', '用同樣大的方格鋪，不重疊、沒有空隙', '甲鋪了 12 格，乙鋪了 10 格'][v],
    found: '每格一樣大，不重疊、沒有空隙，數格子就能比：甲 12 格比乙 10 格多，甲比較大。', name: `一個面有多大，叫${cT('面積')}。邊長 1 公分的正方形，面積是 1 ${cT('平方公分')}。如果這裡每格都是這樣的正方形，甲的面積是 12 平方公分。`, loop: [1, 2],
    check: { q: '藍色貼紙鋪了 9 格，黃色貼紙鋪了 8 格，每格一樣大。哪一張的面積比較大？', pic: () => c3s(c3cells(30, 30, 3, 3, 30, 9, '#6ea8dc') + c3cells(180, 45, 4, 2, 30, 8, '#f7dc8c')), opts: ['藍色', '黃色'], a: 0, why: '每格一樣大，數一數哪一張的格子比較多。', ok: '對了！每格一樣大，9 格比 8 格多，藍色的面積比較大。' } },
  { key: 'deci', title: '小數', terms: ['小數', '小數點'], sem: '三下', game: 'deci', hook: '多出來的魚乾', when: ['deci:color', 'deci:count'],
    ask: '大嘴的魚乾比 1 條多，比 2 條少。要怎麼說才準？', tryIt: '拖一拖，把一樣長的第二條平均切開來數。', states: [0, 1, 2],
    pic: (v, n) => { const cut = v >= .5; return c3s(c3fish(30, 30, 260, 1, 1, true) + (cut ? c3fish(30, 82, 260, 10, v >= 1.5 ? 3 : 0) : `<rect x="30" y="82" width="78" height="30" fill="#e8a35c" stroke="#a9702a" stroke-width="2.5"/><rect x="30" y="82" width="260" height="30" fill="none" stroke="#a9702a" stroke-dasharray="5 4"/>`) + (n ? c3t(110, 145, '1.3', 34, '#d6476b') : ''), n ? [['小數', 190, 145, 'stick']] : []); },
    note: v => ['多出來的不到 1 條', '把 1 條平均分成 10 段', '多了 3 段'][v],
    found: '1 條平均分成 10 段，1 段比 1 條小，要用新的寫法。', name: `1 條平均分成 10 段，1 段是 0.1 條；1 條和 3 段是 1.3 條。像這樣的數叫${cT('小數')}，中間的點叫${cT('小數點')}。`, loop: [1, 2],
    check: { q: '1 條緞帶平均分成 10 段，拿 7 段。用小數說，是幾條？', pic: () => c3s(c3fish(30, 70, 260, 10, 7)), opts: ['0.7', '7', '0.1'], a: 0, why: '1 段是 0.1 條。7 段是幾個 0.1？', ok: '對了！7 個 0.1 條是 0.7 條。' } },
  { key: 'tenths', title: '十分位', terms: ['十分位'], sem: '三下', game: 'deci', hook: '誰的魚乾多', when: ['deci:cmp', 'deci:calc'],
    ask: '1.3 條和 1.7 條魚乾，哪一個比較多？', tryIt: '拖一拖，先比整條，再比段數。', states: [0, 1, 2],
    pic: (v, n) => { const a = v >= .5 ? 3 : 0, b = v >= .5 ? 7 : 0; return c3s(c3fish(12, 14, 140, 1, 1, true) + c3fish(164, 14, 140, 10, a) + c3fish(12, 62, 140, 1, 1, true) + c3fish(164, 62, 140, 10, b) + c3board([['1'], ['.'], [a || '']], 40, 102, 36) + c3board([['1'], ['.'], [b || '']], 180, 102, 36), n ? [['十分位', 130, 160, 'stick'], ['十分位', 270, 160, 'stick']] : []); },
    note: v => ['兩個都有 1 整條，一樣多', '再比多出來的：3 段和 7 段', '整條一樣，7 段比 3 段多，1.7 比較多'][v],
    found: '整條一樣多，就比小數點右邊那一位：它記的是幾個 0.1。', name: `小數點右邊第一位，記有幾個 0.1，叫${cT('十分位')}。`, loop: [1, 2],
    check: { steps: [
      { q: '2.6 的十分位是哪一個數字？', pic: () => c3s(c3t(160, 80, '2.6', 70)), opts: ['2', '6', '0'], a: 1, why: '看小數點的右邊第一位。', ok: '對了！6 在十分位，就是 6 個 0.1。' },
      { q: '1.4 條和 1.2 條，哪一個比較多？', pic: () => c3s(c3t(100, 80, '1.4', 56) + c3t(220, 80, '1.2', 56)), opts: ['1.4', '1.2'], a: 0, why: '整條都是 1。再比十分位：4 個 0.1 和 2 個 0.1。', ok: '對了！整條一樣，十分位 4 比 2 大，1.4 比較多。' }] } },
  { key: 'table', title: '表格', terms: ['表格'], sem: '三下', game: 'meas', hook: '找一個數字', when: ['meas:table'],
    ask: '三個班晴天、雨天走路上學的人數：一班晴天 5 人、雨天 3 人；二班晴天 7 人、雨天 4 人……一長串好難找！怎麼擺比較好找？', tryIt: '拖一拖，把數字放進格子。', states: [0, 1, 2],
    pic: (v, n) => { const h = c3table(v, v >= 1.9); return n ? h.replace('</div>', `<span class="c3l stick" style="left:14%;top:13%">表格</span></div>`) : h; },
    note: v => ['數字排成一長串，很難找', '每一橫行是一個班，每一直行是一種天氣', '二班那一橫行和雨天那一直行交會的格子，是 4'][v],
    found: '先找班級那一橫行，再找天氣那一直行，交會的格子就是答案。', name: `把資料排進橫行和直行的格子裡，最上面和最左邊寫上標題，就叫${cT('表格')}。`, loop: [1, 2],
    check: { q: '看這個表格：一班雨天走路上學的有幾人？', pic: () => c3table(2), opts: ['3', '5', '7'], a: 0, why: '先找左邊「一班」那一橫行，再找上面「雨天」那一直行，看交會的格子。', ok: '對了！一班那一橫行和雨天那一直行交會在 3，一班雨天有 3 人。' } },
];
const conceptsOf = g => CONCEPTS.filter(c => c.game === g || c.when.some(w => w.startsWith(g + ':')));
// 看過（seenCpt：看過或按跳過，不再自動播）和完成（doneCpt：自己答對驗收）分開記；舊存檔只有 seenCpt，照樣保留
const seenCpt = () => S.seenCpt || (S.seenCpt = {});
const doneCpt = () => S.doneCpt || (S.doneCpt = {});
let cptTimer = null, cptAnim = null, cptVal = 0;
const cptStop = () => { if (cptTimer) { clearInterval(cptTimer); cptTimer = null; } if (cptAnim) { clearInterval(cptAnim); cptAnim = null; } };
function cptTween(to, paint) { // 圖從現在的樣子慢慢變過去
  if (cptAnim) { clearInterval(cptAnim); cptAnim = null; }
  const from = cptVal, n = 10; let i = 0;
  const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || from === to) { cptVal = to; paint(to); return; }
  cptAnim = setInterval(() => {
    i++; cptVal = i >= n ? to : from + (to - from) * i / n;
    if (i >= n) { clearInterval(cptAnim); cptAnim = null; }
    if (document.getElementById('cp')) paint(cptVal); else cptStop();
  }, 30);
}
function runConcept(key, then, opt) {
  const C = CONCEPTS.find(c => c.key === key), o = opt || {};
  document.body.classList.remove('in-cine');
  const who = STORY[C.game].who, LOp = { title: '小故事', sem: C.sem, who }, LN = { title: C.title, sem: C.sem, who };
  const leave = () => { cptStop(); if (o.leave) return o.leave(); R = null; go(''); };
  const skip = () => { cptStop(); seenCpt()[key] = 1; save(); then(); }; // 跳過只算「看過」
  const skipBtn = '<button class="skip5" id="skipc">跳過</button>';
  const wire = () => { document.getElementById('out').onclick = leave; document.getElementById('skipc').onclick = skip; };
  function op() { // 第二步：動手試，全程不出現新詞
    cptStop();
    lessonFrame(LOp, `${nums(C.ask)}<br><small>${nums(C.tryIt)}</small>`, `<div class="cp" id="cp"></div><div class="trail" id="ct"></div>${skipBtn}`); wire();
    const seen = new Set([0]), paint = v => setEl('cp', C.pic(v)); let i = 0, over = false;
    const btn = () => { if (over) actionBtn('nm', '這叫什麼？').onclick = named; else actionBtn('tn', '試下一個').onclick = () => { let k = (i + 1) % C.states.length; while (seen.has(k)) k = (k + 1) % C.states.length; show(k); }; };
    const show = k => { i = k; setEl('ct', nums(C.note(C.states[k]))); sfx.hop(); seen.add(k); cptTween(C.states[k], paint); if (seen.size === C.states.length && !over) { over = true; setMsg(nums(C.found), 'good'); sfx.ok(); btn(); reveal('#actions'); } };
    cptVal = C.states[0]; paint(cptVal); setEl('ct', nums(C.note(C.states[0]))); btn();
    dragOn(document.getElementById('cp'), x => { const k = Math.max(0, Math.min(C.states.length - 1, Math.floor(x * C.states.length))); if (k !== i) show(k); }, '.c3p');
  }
  function named() { // 第三步：命名，新詞貼回剛才的圖，圖繼續動
    cptStop();
    lessonFrame(LN, nums(C.name), `<div class="cp" id="cp"></div>${skipBtn}`); wire();
    let k = 0; const paint = v => setEl('cp', C.pic(v, true));
    cptVal = C.states[C.loop[0]]; paint(cptVal);
    if (C.loop.length > 1) cptTimer = setInterval(() => { k++; if (document.getElementById('cp')) cptTween(C.states[C.loop[k % C.loop.length]], paint); else cptStop(); }, 1500);
    actionBtn('ck', '換一題試試').onclick = check; reveal('#actions');
  }
  function finish(msg) { // 自己答對驗收，才記「完成」
    seenCpt()[key] = 1; doneCpt()[key] = 1; save();
    sfx.good(); setMsg(nums(msg), 'good'); document.getElementById('skipc').hidden = true;
    actionBtn('fin', o.doneText || '開始玩').onclick = () => { cptStop(); then(); }; reveal('#actions');
  }
  // 一小題：答錯只停用那一個選項，提示一個可以檢查的關係，讓孩子再選；也可以回去動手
  const fixed = (t, m) => !t ? m : /^對了！/.test(m) ? m.replace(/^對了！/, '改對了！') : '改對了！' + m; // 答錯後改對，稱讚修正
  function ask(st, pic, next, retried, head) {
    cptStop();
    lessonFrame(LN, (head ? `<small>${nums(head)}</small><br>` : '') + nums(st.q), `<div class="cp2">${(st.pic || pic)()}</div>${skipBtn}`); wire();
    document.getElementById('actions').innerHTML = `<div class="choices">${st.opts.map((t, i) => `<button class="choice" data-c5="${i}">${nums(t)}</button>`).join('')}</div>`;
    let tried = !!retried;
    document.querySelectorAll('[data-c5]').forEach(b => b.onclick = () => {
      if (+b.dataset.c5 === st.a) { document.querySelectorAll('[data-c5]').forEach(x => { x.disabled = true; }); b.classList.add('yes'); return next(tried); }
      tried = true; sfx.retry(); b.classList.add('no'); b.disabled = true; setMsg(nums(st.why) + '<br><small>' + nums('想好了，再選一次。') + '</small>', 'hint');
      if (!document.getElementById('bk')) { document.getElementById('actions').insertAdjacentHTML('beforeend', '<button class="btn alt" id="bk">回去再動手看看</button>'); document.getElementById('bk').onclick = op; }
      reveal('#actions');
    });
  }
  function steps(list, pic, finalOk, i, tried, head) { // 依序做幾小題，最後一題答對才算完成
    ask(list[i], pic, t => {
      const last = i === list.length - 1;
      if (last) return finish(fixed(t, finalOk || list[i].ok));
      sfx.ok(); setMsg(nums(fixed(t, list[i].ok)), 'good');
      actionBtn('nx', '下一步').onclick = () => steps(list, pic, finalOk, i + 1, false, head); reveal('#actions');
    }, tried, head);
  }
  function check() { // 第四步：換情境用新詞答；有兩種解法的題目先讓孩子選一條路
    const K = C.check, pic = K.pic;
    const routes = () => {
      lessonFrame(LN, nums(K.q), `<div class="cp2">${pic()}</div>${skipBtn}`); wire();
      setMsg(nums('兩種想法都可以，選一條路做做看。'));
      document.getElementById('actions').innerHTML = `<div class="choices col">${K.routes.map((r, i) => `<button class="choice" data-rt="${i}">${nums(r.label)}</button>`).join('')}</div>`;
      document.querySelectorAll('[data-rt]').forEach(b => b.onclick = () => steps(K.routes[+b.dataset.rt].steps, pic, K.ok, 0, false, K.head));
    };
    if (K.routes) {
      if (!K.pre) return routes();
      return ask(K.pre[0], K.pre[0].pic, t => { sfx.ok(); setMsg(nums(fixed(t, K.pre[0].ok)), 'good'); actionBtn('nx', '下一步').onclick = routes; reveal('#actions'); });
    }
    steps(K.steps || [K], pic, K.steps ? null : K.ok, 0);
  }
  op();
}
function conceptThen(q, then) { // 第一次碰到這個題型，自動播一段；一次只播一段，不連播
  const key = q.kind + ':' + q.mode, C = CONCEPTS.find(c => c.when.includes(key) && !seenCpt()[c.key] && (!c.need || c.need(q)));
  if (!C) return then();
  runConcept(C.key, then);
}
function viewConcepts(g, back) { // 重看：沒看過的先不露新詞；✓ 是自己答對驗收，「看過」是看過或跳過
  const list = g ? conceptsOf(g) : CONCEPTS;
  window.scrollTo(0, 0);
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="bkc" aria-label="回去">⌂</button><h2 class="page-h">新概念小故事</h2></div><p class="tag">想再看一次哪一個？</p><div class="lessons">${list.map(c => { const s = seenCpt()[c.key], d = doneCpt()[c.key]; return `<button class="lesson" data-rc="${c.key}"><span class="l-t"><b>${nums(c.hook)}</b><small>${s ? c.terms.join('、') + (d ? '' : '（看過）') : '還沒看過'}</small></span><em class="sem">${c.sem}</em>${d ? '<span class="badge in">✓</span>' : ''}</button>`; }).join('')}</div>`;
  document.getElementById('bkc').onclick = back;
  const again = () => viewConcepts(g, back);
  document.querySelectorAll('[data-rc]').forEach(b => b.onclick = () => runConcept(b.dataset.rc, again, { leave: again, doneText: '看完了' }));
}
// 單位教室的銜接：先用小故事知道為什麼要這個單位，教室再感覺它多大、怎麼換算
const LESSON_STORY = { len: 'mm', vol: 'ml', weight: 'kg', time: 'sec', area: 'area' };
function storyFirst(key, then, leave) {
  const c = LESSON_STORY[key];
  if (c && !seenCpt()[c]) return runConcept(c, then, { leave, doneText: '繼續' });
  then();
}
const QUIZ_STAR = 25;
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
  quizShell('單元測驗', () => go(''), `<p class="tag">每個單元都有基礎、進階和益智題。</p><div class="lessons">${books.map((b, i) => {
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
    <div class="title-top"><p class="kicker">星星船長出航</p><h1 class="logo">數感星星島</h1></div>
    ${artImg('liang_cheer', 'title-hero')}
    <div class="title-bottom">
      <button class="btn big" id="start">${S.opened ? '繼續冒險' : '開始冒險'}</button>
      <p class="title-note">${S.opened ? `船長，夜空已經亮了 ${Math.min(S.stars, S.bossDone ? 10000 : 9999)} 顆星` : '夜空需要一位星星船長'}</p>
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
  const allSaved = PIECE_KEYS.every(pieceGot), nSaved = keys.filter(saved).length, nPieces = PIECE_KEYS.filter(pieceGot).length;
  const bossNow = allSaved && !S.bossDone;
  const seg1 = keys.filter(k => PIECE_KEYS.includes(k)), seg2 = keys.filter(k => !PIECE_KEYS.includes(k)); // 三上段、三下段
  const pool = S.bossDone ? [...seg2, ...seg1] : seg1, need = k => S.bossDone ? !saved(k) : !pieceGot(k); // 找到萬萬以前只帶去三上的島；第二季先帶去三下新島
  const nextKey = bossNow ? null : pool.find(k => need(k) && S.prog[k]) || pool.find(need) || null;
  const line = S.bossDone && !nextKey ? '夜空亮了！一萬顆星都在閃。' : S.bossDone ? (seg2.includes(nextKey) ? `還有小星星迷路，下一站：${STORY[nextKey].place}！` : `${STORY[nextKey].place}還在等你，${STORY[nextKey].mission}！`) : bossNow ? '碎片都到齊了，去找萬萬吧！' : nSaved === 0 && !S.prog[nextKey] ? `船長，先去${STORY[nextKey].place}！` : `下一站：${STORY[nextKey].place}，${STORY[nextKey].mission}！`;
  const ROW = 150, HEAD = 46, rows = keys.length + 1, nb = seg1.length; // 段落標題各占 HEAD 高
  const ys = Array.from({ length: rows }, (_, i) => HEAD + ROW * i + (i > nb ? HEAD : 0)), H = ys[rows - 1] + ROW;
  const pts = ys.map((y, i) => [i % 2 ? 70 : 30, y + 70]);
  const pathD = pts.map((q, i) => i === 0 ? `M${q[0]} ${q[1]}` : `C${pts[i - 1][0]} ${q[1] - 70} ${q[0]} ${pts[i - 1][1] + 70} ${q[0]} ${q[1]}`).join('');
  const stop = (k, i) => {
    const pr = Math.min(S.prog[k] || 0, ROUNDS_TO_SAVE), st = STORY[k], done = pr >= ROUNDS_TO_SAVE, now = k === nextKey && !done;
    const pips = Array.from({ length: ROUNDS_TO_SAVE }, (_, n) => `<i class="${n < pr ? 'on' : ''}"></i>`).join('');
    return `<button class="stop ${i % 2 ? 'right' : 'left'} ${done ? 'done' : ''} ${now ? 'now' : ''}" data-g="${k}" style="top:${ys[i]}px">
      <span class="medal" style="${bgStyle(st.bg)}"><span class="fog f${pr}"></span>${artImg(st.who, 'medal-who')}${done ? '<span class="badge">✓</span>' : ''}</span>
      <span class="plate"><b>${GAMES[k].name}</b><em class="sem">${GAMES[k].sem}</em><span class="lvl">${pips}</span></span>
      ${now ? artImg('liang', 'guide') : ''}
    </button>`;
  };
  $app.innerHTML = `
    <div class="map-bg"><div class="m1" style="${bgStyle('sky_dark')}"></div><div class="m2" style="${bgStyle('sky_bright')};opacity:${S.bossDone ? 1 : nSaved / keys.length * .85}"></div><div class="shade"></div></div>
    <header class="map-head">
      <div class="map-title"><h1 class="logo small">星星島</h1><div class="star-count">⭐ ${N(Math.min(S.stars, S.bossDone ? 10000 : 9999))}<small>／10000</small></div></div>
      <div class="hero-say">${artImg(S.bossDone ? 'liang_cheer' : 'liang', 'hero-liang')}<span>${line}</span></div>
    </header>
    <button class="lesson-entry" id="lessons"><span>📏🥛⚖️⏱️</span><b>單位教室</b><small>${Object.keys(S.learned || {}).length} / 5</small></button>
    <button class="quiz-entry" id="quiz"><span>📝</span><b>單元測驗</b><small>基礎・進階・益智</small></button>
    <div class="map-trail" style="height:${H + 8}px">
      <svg viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${pathD}" fill="none" stroke="#fff6e3" stroke-width="5" stroke-dasharray="3 11" stroke-linecap="round" vector-effect="non-scaling-stroke" opacity=".9"/></svg>
      <div class="seg-h" style="top:0"><b>三上</b>找九塊碎片</div>
      ${seg1.map(stop).join('')}
      <button class="stop ${nb % 2 ? 'right' : 'left'} cave ${allSaved && !S.bossDone ? 'now' : ''}" data-g="boss" ${allSaved ? '' : 'disabled'} style="top:${ys[nb]}px">
        <span class="medal" style="${bgStyle(BOSS.bg)}"><span class="fog ${S.bossDone ? 'f3' : allSaved ? 'f1' : 'f0'}"></span>${allSaved ? artImg(S.bossDone ? 'mimi_happy' : 'mimi', 'medal-who') : '<span class="lock">？</span>'}</span>
        <span class="plate"><b>${S.bossDone ? '和萬萬玩' : '找到萬萬'}</b><small>${allSaved ? (S.bossDone ? '再挑戰一次' : '把碎片拼回去') : `先找齊碎片（${nPieces}/9）`}</small></span>
      </button>
      ${seg2.length ? `<div class="seg-h" style="top:${ys[nb + 1] - HEAD}px"><b>三下</b>找三顆小星星</div>` : ''}
      ${seg2.map((k, j) => stop(k, nb + 1 + j)).join('')}
    </div>
    <nav class="dock">
      <button id="daily" class="${S.stamps[today()] ? 'stamped' : 'hot'}"><b>${S.stamps[today()] ? '✔' : '★'}</b>今日任務<small>${Object.keys(S.stamps).length} 個章</small></button>
      <button id="clues"><b>🌟</b>星星本<small>${nSaved} / ${keys.length}</small></button>
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
const UNITS = { 1: '三上1 數到10000', 2: '三上2 四位數的加減', 3: '三上3 乘法', 4: '三上4 幾毫米', 5: '三上5 角、正方形和長方形', 6: '三上6 除法', 7: '三上7 公升和毫升', 8: '三上8 分數', 9: '三上9 圓', 11: '三下1 除法', 12: '三下2 找規律', 13: '三下3 時間', 14: '三下4 兩步驟的計算', 15: '三下5 面積', 16: '三下6 公斤和公克', 17: '三下7 分數的加減', 18: '三下8 乘除的應用', 19: '三下9 小數', 20: '三下10 報讀表格' };
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
    <h2>單元</h2><p>三上、三下所有單元都已開放，孩子可以自由選島。每座島和每一題都有標示是三上或三下。</p>
    <h2>各遊戲狀況</h2>
    <table><tr><th>遊戲</th><th>等級</th><th>紀錄</th></tr>${rows}</table>
    <h2>最近沒答出來的題目</h2>
    ${miss.length ? `<ul>${miss.map(m => `<li>${esc(m)}</li>`).join('')}</ul>` : '<p>目前沒有。</p>'}
    <h2>設定</h2>
    <p><label><input type="checkbox" id="snd" ${S.sound ? 'checked' : ''}> 音效</label></p>
    <button class="link" id="reset">清除這台裝置的紀錄</button><br>
    <button class="link" id="out">回小鎮</button>
    <p class="note" style="font-size:14px">紀錄只存在這台裝置的瀏覽器，不會傳到網路。題目皆為自編，非課本內容。</p>
  </div>`;
  document.getElementById('snd').onchange = e => { S.sound = e.target.checked; save(); };
  document.getElementById('reset').onclick = () => {
    if (confirm('確定清除所有星星和紀錄？')) { S.stars = 0; S.rec = {}; S.log = []; S.prog = {}; S.opened = false; S.bossDone = false; S.bossSeen = false; S.s2Seen = false; S.stamps = {}; S.fast = {}; S.seenCpt = {}; S.doneCpt = {}; S.lessonSeen = {}; S.quiz = {}; S.pieceFrom = {}; S.learned = {}; save(); viewParent(); }
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
new MutationObserver(() => annotate($app)).observe($app, { childList: true, subtree: true });
// 有新版就自動載入；進度存在瀏覽器裡，不受影響。正在答題時不打斷，下次切回來再檢查
async function checkUpdate() {
  if (!window.APP_V || R) return;
  try {
    const r = await fetch('version.txt?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return;
    const latest = (await r.text()).trim();
    if (!/^\d+$/.test(latest) || latest === window.APP_V || R) return;
    if (sessionStorage.getItem('shugan-updated-to') === latest) return; // 避免快取沒更新時一直重載
    sessionStorage.setItem('shugan-updated-to', latest);
    location.replace(location.pathname + '?v=' + latest + location.hash);
  } catch (e) {}
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(); });
checkUpdate();
preloadArt().then(route);
