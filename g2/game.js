// 數感小鎮：畫面與互動
const $app = document.getElementById('app');
const ROUND = 6;
const GAMES = {
  line: { name: '尋寶數線', tip: '把數字放到對的地方', color: 'var(--sun)', icon: '<path d="M6 40h44" stroke="#33405a" stroke-width="4" stroke-linecap="round"/><path d="M6 34v12M50 34v12" stroke="#33405a" stroke-width="4"/><path d="M33 34c-9-10-12-14-12-19a12 12 0 0 1 24 0c0 5-3 9-12 19z" fill="#f5a524"/><circle cx="33" cy="15" r="4.5" fill="#fff"/>' },
  block: { name: '積木工坊', tip: '百、十、一，換來換去', color: 'var(--sky)', icon: '<rect x="4" y="16" width="26" height="26" rx="2" fill="#3b82c4"/><rect x="34" y="16" width="7" height="26" rx="1" fill="#3d9970"/><rect x="45" y="35" width="7" height="7" rx="1" fill="#f5a524"/>' },
  frog: { name: '青蛙跳跳', tip: '跳越少越厲害', color: 'var(--leaf)', icon: '<path d="M6 44c10-30 34-30 44 0" fill="none" stroke="#3d9970" stroke-width="3" stroke-dasharray="4 5"/><circle cx="28" cy="20" r="12" fill="#3d9970"/><circle cx="22" cy="11" r="5" fill="#3d9970"/><circle cx="34" cy="11" r="5" fill="#3d9970"/><circle cx="22" cy="10" r="2" fill="#fff"/><circle cx="34" cy="10" r="2" fill="#fff"/>' },
  scale: { name: '神奇天平', tip: '不用算完，也知道哪邊重', color: 'var(--grape)', icon: '<path d="M28 8v38M16 48h24M8 18l40-6" stroke="#7d5bbe" stroke-width="4" stroke-linecap="round"/><path d="M2 32a6 6 0 0 0 12 0zM42 26a6 6 0 0 0 12 0z" fill="#7d5bbe"/>' },
  candy: { name: '糖果排排', tip: '一排一排，算得又快又清楚', color: 'var(--berry)', icon: '<g fill="#d6476b"><circle cx="12" cy="14" r="6"/><circle cx="28" cy="14" r="6"/><circle cx="44" cy="14" r="6"/><circle cx="12" cy="30" r="6"/><circle cx="28" cy="30" r="6"/><circle cx="44" cy="30" r="6"/></g><g fill="#7d5bbe"><circle cx="12" cy="46" r="6"/><circle cx="28" cy="46" r="6"/><circle cx="44" cy="46" r="6"/></g>' },
  clock: { name: '鐘塔修理', tip: '把時間找回來', color: 'var(--sky)', icon: '<circle cx="28" cy="28" r="23" fill="#fff" stroke="#3b82c4" stroke-width="4"/><path d="M28 28V12M28 28l11 7" stroke="#33405a" stroke-width="4" stroke-linecap="round"/>' },
  train: { name: '霧中小火車', tip: '上車下車，想一想', color: 'var(--warn)', icon: '<rect x="6" y="16" width="34" height="24" rx="4" fill="#d9772b"/><rect x="38" y="24" width="14" height="16" rx="3" fill="#33405a"/><circle cx="16" cy="44" r="5" fill="#33405a"/><circle cx="36" cy="44" r="5" fill="#33405a"/>' },
  shop: { name: '零錢小舖', tip: '用最少的錢幣付錢', color: 'var(--sun)', icon: '<circle cx="22" cy="24" r="16" fill="#f5a524"/><circle cx="36" cy="36" r="14" fill="#c9cfdc" stroke="#77809a" stroke-width="2"/>' },
};
const SEM = { line: '二上・二下', block: '二上・二下', frog: '二上・二下', scale: '二上・二下', candy: '二上・二下', clock: '二上', train: '二上・二下', shop: '二上・二下' }; // 全部單元開放，標明學期
const ROUNDS_TO_SAVE = 3; // 每個地方玩幾回合就把居民救回來
const BOSS_ORDER = ['line', 'block', 'frog', 'scale', 'candy', 'train'];
const ART = ['liang', 'liang_cheer', 'liang_think', 'pipi', 'amu', 'gua', 'gua_jump', 'song', 'bear', 'mimi', 'mimi_happy', 'chest', 'town_fog', 'town_clear', 'beach', 'bridge', 'pond', 'market', 'candy_shop', 'fog_cave', 'night_stars', 'owl', 'mole', 'monkey', 'mimi_peek', 'clock_tower', 'station', 'toy_shop', 'win_line', 'win_block', 'win_frog', 'win_scale', 'win_candy', 'win_clock', 'win_train', 'win_shop', 'festival', 'clue_line', 'clue_block', 'clue_frog', 'clue_scale', 'clue_candy', 'clue_clock', 'clue_train', 'clue_shop'];
const HAS = {}; // 圖還沒收齊時，畫面照樣能玩
const artUrl = n => `assets/${n}.webp`;
const artImg = (n, cls) => HAS[n] ? `<img class="${cls || ''}" src="${artUrl(n)}" alt="">` : '';
const bgStyle = n => HAS[n] ? `background-image:url(${artUrl(n)})` : '';
function preloadArt() {
  return Promise.all(ART.map(n => new Promise(ok => { const i = new Image(); i.onload = () => { HAS[n] = true; ok(); }; i.onerror = () => ok(); i.src = artUrl(n); })));
}

/* ---------- 存檔 ---------- */
const SAVE_KEY = 'shugan-v1';
function load() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) return s; } catch (e) {}
  return null;
}
const S = Object.assign({ stars: 0, unit: 6, sound: true, rec: {}, log: [], opened: false, prog: {}, bossDone: false, bossSeen: false, stamps: {} }, load() || {});
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
  if (R.q) { S.fast = S.fast || {}; const fk = R.q.kind + ':' + R.q.mode; S.fast[fk] = grade === 2 ? (S.fast[fk] || 0) + 1 : 0; } // 熟練紀錄
  R.grades.push(grade); R.earned += grade; S.stars += grade;
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
  const low = /(^|×)(0|1|10)(×|$)/;
  const down = (q.kind === 'line' && q.b >= 1000) || (q.kind === 'block' && q.v > 300) || (q.kind === 'frog' && (q.s > 300 || q.t > 300))
    || (q.kind === 'scale' && (q.mode === 'near' || q.frac || (q.mode === 'cmp' && (q.l > 300 || q.r > 300 || low.test(q.lText) || low.test(q.rText)))))
    || (q.kind === 'candy' && (q.special || ['pack', 'share', 'frac', 'fair'].includes(q.mode)))
    || (q.kind === 'train' && q.mode === 'mult') || (q.kind === 'shop' && (q.mode === 'enough' || q.price > 100));
  return down ? '二下' : '二上';
}
function frame(promptHtml, stageHtml, extra) {
  const dots = Array.from({ length: ROUND }, (_, i) => `<i class="${i < R.grades.length ? 'g' + R.grades[i] : i === R.i ? 'now' : ''}"></i>`).join('');
  $app.innerHTML = `
    <div class="top">
      <button class="icon-btn" id="home" aria-label="回小鎮">⌂</button>
      <div class="dots">${dots}</div><span class="sem">${semOf(R.q)}</span>
      <button class="icon-btn" id="say" aria-label="唸題目">🔊</button>
    </div>
    <div class="say-row">${artImg(R.boss ? 'mimi' : R.daily ? 'liang' : STORY[R.game].who, 'say-who')}<div class="prompt" id="prompt">${promptHtml}</div></div>
    <div class="stage" id="stage">${stageHtml}</div>
    <div class="msg" id="msg"></div>
    ${extra || ''}
    <div class="actions" id="actions"></div>`;
  document.getElementById('home').onclick = () => { R = null; go(''); };
  document.getElementById('say').onclick = () => speak(plainText(document.getElementById('prompt')));
  cptBtn(cptOf(R.q));
}
function endRound() {
  const ch = R.chapter, boss = R.boss;
  let beat = null;
  if (R.daily) S.stamps[today()] = 1;
  if (boss) { if (!S.bossDone) { S.bossDone = true; beat = 'ending'; } }
  else if (STORY[ch] && R.fixedLv === undefined) {
    const before = S.prog[ch] || 0;
    if (before < ROUNDS_TO_SAVE) { S.prog[ch] = before + 1; beat = STORY[ch].beats[before + 1]; }
  }
  save();
  const praise = boss ? '迷迷的挑戰，你全部走完了。' : R.daily ? '今天的任務完成了，蓋一個章！' : R.fixedLv !== undefined ? '多練一次，就更有感覺。' : { clock: '你看時鐘越來越快了。', train: '一站一站想，人數就清楚了。', shop: '你很會湊錢幣了。', line: '你對數字的位置越來越有感覺了。', block: '百、十、一，你換得很清楚。', frog: '你在找更聰明的走法。', scale: '你開始用想的，不只是用算的。', candy: '一排一排看，數量就清楚了。' }[ch];
  $app.innerHTML = `<div class="end pop">
    ${artImg('liang_cheer', 'end-hero')}
    <h2>亮亮多了 ${N(R.earned)} 顆星的光</h2>
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
    ${artImg('clue_' + ch, 'clue-big')}
    <h2>找到線索了！</h2><p><b>${c.name}</b><br>${c.text}</p>
    <div class="actions"><button class="btn" id="ok">收進線索本</button></div></div>`;
  document.getElementById('ok').onclick = () => go('');
}
function viewClues() {
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="home" aria-label="回小鎮">⌂</button><h2 class="page-h">線索本</h2></div>
    <p class="tag">大霧到底是怎麼來的？</p>
    <div class="clues">${Object.keys(GAMES).map(k => {
      const has = (S.prog[k] || 0) >= ROUNDS_TO_SAVE, c = STORY[k].clue;
      return `<div class="clue ${has ? '' : 'off'}">${has ? artImg('clue_' + k, 'clue-img') : '<div class="clue-q">？</div>'}<div><b>${has ? c.name : '還沒找到'}</b><small>${has ? c.text : `幫${STORY[k].whoName}的忙就會找到`}</small></div></div>`;
    }).join('')}</div>`;
  document.getElementById('home').onclick = () => go('');
}
const today = () => new Date().toLocaleDateString('sv');
// 每日任務：挑最近最常卡住的遊戲，再混入其他遊戲複習
function dailyOrder() {
  const keys = Object.keys(GAMES);
  const miss = k => S.log.filter(x => x.g === k).slice(-12).filter(x => x.gr < 2).length;
  const sorted = keys.slice().sort((a, b) => miss(b) - miss(a) || Math.random() - .5);
  return Logic.shuffle([sorted[0], sorted[0], sorted[1], sorted[1], ...Logic.shuffle(sorted.slice(2)).slice(0, 2)]);
}
function practiceTopics() {
  const u = S.unit, T = [
    ['line', 1, '100 以內的位置', 1], ['line', 3, '300 以內的位置', 1], ['line', 6, '1000 以內的位置', 11],
    ['block', 3, '不用百也能拼', 1], ['block', 4, '換位：十或一超過 9', 1], ['block', 7, '千以內的換位', 11],
    ['frog', 1, '跨過整十', 1], ['frog', 2, '+9 想成 +10−1', 2], ['frog', 4, '往回跳', 2], ['frog', 5, '算式心算', 2], ['frog', 7, '三位數心算', 12],
    ['scale', 1, '估一估', 2], ['scale', 2, '加法搬來搬去', 2], ['scale', 3, '減法的相差', 2], ['scale', 4, '補數字', 4], ['scale', 6, '整十估算', 12], ['scale', 8, '幾分之一比大小', 19],
    ['candy', 1, '一排一排數', 1], ['candy', 2, '多一排、少一排', 1], ['candy', 3, '切開大陣列', 7], ['candy', 4, '0、1、10 的乘法', 15], ['candy', 5, '分裝', 18], ['candy', 6, '平分', 18], ['candy', 7, '幾分之一', 19],
    ['clock', 0, '整點和半點', 1], ['clock', 2, '讀幾時幾分', 8], ['clock', 3, '撥時鐘', 8], ['clock', 4, '再過幾分鐘', 8],
    ['train', 1, '連續下車', 1], ['train', 2, '先下車再上車', 6], ['train', 4, '先乘再加減', 17],
    ['shop', 1, '最少的錢幣', 1], ['shop', 2, '找錢', 1], ['shop', 3, '百元以上付錢', 11], ['shop', 4, '夠不夠', 12],
  ];
  return T.filter(t => u >= t[3]);
}
function viewPractice() {
  const groups = Object.keys(GAMES).map(k => {
    const ts = practiceTopics().filter(t => t[0] === k);
    return ts.length ? `<h3 class="pg-h">${GAMES[k].name}<span class="sem">${SEM[k]}</span></h3><div class="pg">${ts.map(t => `<button class="pg-btn" data-g="${t[0]}" data-l="${t[1]}"><span class="sem">${t[3] >= 11 ? '二下' : '二上'}</span>${nums(t[2])}</button>`).join('')}</div>` : '';
  }).join('');
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="home" aria-label="回小鎮">⌂</button><h2 class="page-h">練習場</h2></div><p class="tag">想多練哪一個？</p><button class="c-entry" id="cpts">💡 新概念小故事</button>${groups}`;
  document.getElementById('cpts').onclick = () => viewConcepts(CONCEPTS, viewPractice);
  document.getElementById('home').onclick = () => go('');
  document.querySelectorAll('.pg-btn').forEach(b => b.onclick = () => startRound(b.dataset.g, { lv: +b.dataset.l }));
}
function enter(ch) {
  if (ch === 'boss') {
    if (!S.bossSeen) { S.bossSeen = true; save(); return comic(BOSS.bg, BOSS.intro, () => startRound('boss')); }
    return startRound('boss');
  }
  if (!S.prog[ch]) return comic(STORY[ch].bg, STORY[ch].beats[0], () => startRound(ch));
  startRound(ch);
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

/* ---------- 先動手再作答 ---------- */
const isFast = q => ((S.fast || {})[q.kind + ':' + q.mode] || 0) >= 3; // 連續 3 次第一次就對就跳過操作，答錯回到動手做
const padHidden = () => `<div class="pad-wrap" hidden><div class="trail" id="ask"></div>${keypadHtml()}</div>`;
const setEl = (id, html) => { document.getElementById(id).innerHTML = html; };
function actionBtn(id, text) { document.getElementById('actions').innerHTML = `<button class="btn" id="${id}">${text}</button>`; return document.getElementById(id); }
function afterAct(fn) { document.getElementById('actions').innerHTML = ''; document.querySelectorAll('.pad-wrap').forEach(x => { x.hidden = false; }); reveal('.pad-wrap'); fn(); }
function dragOn(wrap, cb, sel) { // 手指在圖上拖：回傳在圖形裡的相對位置 0～1
  wrap.classList.add('drag-prot');
  const read = e => { const g = sel === 'self' ? wrap : sel ? wrap.querySelector(sel) : wrap.querySelector('svg'), b = g.getBoundingClientRect(); cb((e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height, e); };
  let on = false;
  wrap.onpointerdown = e => { on = true; try { wrap.setPointerCapture(e.pointerId); } catch (x) {} read(e); e.preventDefault(); };
  wrap.onpointermove = e => { if (on) read(e); };
  wrap.onpointerup = wrap.onpointercancel = () => { on = false; };
}
const tapAlso = (id, btn) => { const el = document.getElementById(id); if (el) el.onclick = () => { const b = document.getElementById(btn); if (b) b.click(); }; };
function gate(q, label, n, onStep, ask) { // 動手 n 次才能作答；也可以直接點圖；熟練後跳到作答
  const lab = k => Array.isArray(label) ? label[k] : label;
  if (isFast(q) || n <= 0) { for (let k = 1; k <= n; k++) onStep(k); return afterAct(ask); }
  let k = 0, over = false;
  const st = document.getElementById('stage');
  const paint = () => { actionBtn('gt', lab(k)).onclick = () => { k++; sfx.hop(); onStep(k); if (k === n) { over = true; st.onclick = null; afterAct(ask); } else paint(); }; };
  paint();
  st.onclick = e => { if (!over && e.target.closest('svg, .ride, .seats, .fill-text') && !e.target.closest('button')) document.getElementById('gt').click(); };
}

/* ---------- 尋寶數線 ---------- */
const LX0 = 30, LX1 = 610;
function lineSvg(a, b, s, labels) {
  const X = v => LX0 + (v - a) / (b - a) * (LX1 - LX0);
  let ticks = '';
  for (let v = a; v <= b; v += s) {
    const big = labels.includes(v) || v % (s * 5) === 0;
    ticks += `<path d="M${X(v)} ${big ? 90 : 96}v${big ? 26 : 14}" stroke="#33405a" stroke-width="${big ? 3 : 2}"/>`;
  }
  const size = labels.length > 6 ? 20 : 27;
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
    if (!st.first) return [st.a, (st.a + st.b) / 2, st.b];
    if (!q.labelAll) return q.marks;
    const out = []; for (let v = q.a; v <= q.b; v += st.s) out.push(v); return out;
  }
  function stage() {
    const exact = q.v % st.s === 0;
    const prompt = exact ? `寶藏埋在 ${N(q.v)}！<br>點 ${N(q.v)} 的刻度，插上旗子。`
      : `寶藏埋在 ${N(q.v)}！<br>${st.first ? '它在哪一段？點那一段。' : '它在這一段裡，再找一找。'}`;
    frame(prompt, lineSvg(st.a, st.b, st.s, labels()) + (st.first ? '' : `<div class="trail">${nums(`放大鏡：${st.a} 到 ${st.b}，一小格是 ${st.s}`)}</div>`));
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
    acts.innerHTML = `<button class="btn" id="dig" disabled>${exact ? '挖挖看' : '放大看看'}</button>`;
    const zoom = () => { const a = Math.floor(q.v / st.s) * st.s; st = { a, b: a + st.s, s: st.s / 10, first: false }; stageWrong = 0; stage(); };
    document.getElementById('dig').onclick = () => {
      const right = exact ? pick === q.v : pick === Math.floor(q.v / st.s) * st.s;
      if (right) {
        if (!exact) { sfx.ok(); return zoom(); }
        active = false;
        document.getElementById('pin').innerHTML = `<circle cx="${X(q.v)}" cy="103" r="8" fill="#3b82c4"/>`;
        drawTruth(X(q.v), q.v);
        return finish(R.tries === 0 ? 2 : R.tries === 1 ? 1 : 0, 'place', nums(`挖到了！就是 ${q.v}！`));
      }
      R.tries++; stageWrong++; sfx.retry();
      const hint = exact ? nums(`你插在 ${pick}，${q.v} 比它${q.v > pick ? '大，再往右' : '小，再往左'}。一小格是 ${st.s}。`)
        : nums(`這一段是 ${pick} 到 ${pick + st.s}。${q.v} 比 ${q.v > pick ? pick + st.s : pick} ${q.v > pick ? '大，再往右' : '小，再往左'}。`);
      if (stageWrong < 2) return setMsg(hint, 'hint');
      active = false;
      if (exact) {
        document.getElementById('pin').innerHTML = `<circle cx="${X(pick)}" cy="103" r="8" fill="#3b82c4"/>`;
        drawTruth(X(q.v), q.v);
        return finish(0, { wrong: pick, ans: q.v }, nums(`寶藏在這裡：${q.v}。`));
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
  frame(`船長的旗子插在這裡，<br>是多少？一小格是 ${N(q.unit)}。`, lineSvg(q.a, q.b, q.unit, q.marks) + '<div class="trail" id="ct"></div>');
  drawPin(X(q.v), '#d6476b');
  const ask = () => {
  document.getElementById('actions').innerHTML = `<div class="choices">${q.options.map(o => `<button class="choice num" data-o="${o}">${o}</button>`).join('')}</div>`;
  document.querySelectorAll('.choice').forEach(b => {
    b.onclick = () => {
      const o = +b.dataset.o;
      if (o === q.v) return finish(R.tries === 0 ? 2 : R.tries === 1 ? 1 : 0, 'read', nums(`對了！就是 ${q.v}。`));
      R.tries++; b.classList.add('no'); b.disabled = true; sfx.retry();
      setMsg(nums(`${o} 應該在${o > q.v ? '更右邊' : '更左邊'}。從最近的標記開始，一格一格數。`), 'hint');
    };
  });
  };
  const m0 = nearestMark(q);
  gate(q, '從最近的數字數一數', 1, () => setEl('ct', nums(`從 ${m0} ${q.v > m0 ? '往右' : '往左'}數了 ${Math.abs(q.v - m0) / q.unit} 格，一格是 ${q.unit}`)), ask);
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

/* ---------- 積木工坊 ---------- */
function viewBlock(q) {
  const st = q.mode === 'trade' ? [q.h, q.t, q.o] : [0, 0, 0];
  const NAMES = ['百', '十', '一'], CL = ['b100', 'b10', 'b1'];
  const prompt = q.mode === 'trade'
    ? `${N(q.h)} 個百、${N(q.t)} 個十、${N(q.o)} 個一<br>木頭共有多少塊？`
    : (q.note ? `${q.note}用十和一，<br>拼出 ${N(q.v)} 塊木頭。` : `這段橋要 ${N(q.v)} 塊木頭！`);
  frame(prompt, `<div class="board" id="board"></div><div class="trade" id="trade"></div>${q.mode === 'trade' ? padHidden() : ''}`);
  function draw(locked) {
    document.getElementById('board').innerHTML = [0, 1, 2].map(i => {
      const shown = Math.min(st[i], 30);
      const pile = Array.from({ length: shown }, () => q.mode === 'build' && !locked ? `<button data-rm="${i}" aria-label="拿走一個${NAMES[i]}"><span class="${CL[i]}" style="display:block"></span></button>` : `<span class="${CL[i]}"></span>`).join('');
      const can = q.mode === 'build' && !locked && (q.allow[i] === 1);
      return `<div class="col"><h3>${NAMES[i]}</h3><div class="tally num">${st[i]}</div><div class="pile">${pile}</div>
        ${q.mode === 'build' ? `<button class="add" data-add="${i}" ${can ? '' : 'disabled'} aria-label="加一個${NAMES[i]}">＋</button>` : ''}</div>`;
    }).join('');
    document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { const i = +b.dataset.add; if (st[i] < 30) st[i]++; sfx.hop(); draw(); });
    document.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { st[+b.dataset.rm]--; draw(); });
    const t = document.getElementById('trade');
    if (locked) { t.innerHTML = ''; return; }
    t.innerHTML = `<button data-tr="ones" ${st[2] >= 10 ? '' : 'disabled'}>${nums('10個一→1個十')}</button>
      ${q.note ? '' : `<button data-tr="tens" ${st[1] >= 10 ? '' : 'disabled'}>${nums('10個十→1個百')}</button>`}`;
    t.querySelector('[data-tr=ones]').onclick = () => { st[2] -= 10; st[1]++; sfx.hop(); draw(); openTrade(); };
    if (!q.note) t.querySelector('[data-tr=tens]').onclick = () => { st[1] -= 10; st[0]++; sfx.hop(); draw(); openTrade(); };
    document.querySelectorAll('.pile .b1').forEach(b => { if (q.mode === 'trade') b.onclick = () => { if (st[2] >= 10) t.querySelector('[data-tr=ones]').click(); }; });
    document.querySelectorAll('.pile .b10').forEach(b => { if (q.mode === 'trade' && !q.note) b.onclick = () => { if (st[1] >= 10) t.querySelector('[data-tr=tens]').click(); }; });
  }
  let opened = false;
  const openTrade = () => { if (q.mode === 'trade' && !opened && st[1] < 10 && st[2] < 10) { opened = true; setEl('trade', ''); setMsg('換好了，讀讀看！', 'good'); afterAct(() => {}); } };
  if (q.mode === 'trade' && isFast(q)) { while (st[2] >= 10) { st[2] -= 10; st[1]++; } while (st[1] >= 10) { st[1] -= 10; st[0]++; } }
  draw();
  if (q.mode === 'trade') {
    openTrade();
    if (!opened) setMsg('點積木或按按鈕，滿 10 個就換一換。');
    bindKeypad((val, clear) => {
      if (val === q.v) { lockKeypad(); draw(true); return finish(R.tries === 0 ? 2 : 1, 'trade', nums(`對了！${q.h} 個百、${q.t} 個十、${q.o} 個一就是 ${q.v}。`)); }
      if (R.tries === 0) { R.tries = 1; sfx.retry(); clear(); return setMsg('看看每一格各有幾個，再讀一次。', 'hint'); }
      lockKeypad(); draw(true);
      finish(0, { wrong: val, ans: q.v }, nums(`答案是 ${q.v}。十或一滿 10 個，就要換到左邊一位。`));
    });
    return;
  }
  document.getElementById('actions').innerHTML = `<button class="btn" id="check">做好了</button>`;
  document.getElementById('check').onclick = () => {
    const v = st[0] * 100 + st[1] * 10 + st[2];
    if (v === q.v) {
      draw(true);
      const extra = q.note ? nums(`${st[1]} 個十和 ${st[2]} 個一，也是 ${q.v}！`) : '做對了！';
      return finish(R.tries === 0 ? 2 : 1, 'build', extra);
    }
    if (R.tries === 0) {
      R.tries = 1; sfx.retry();
      return setMsg(nums(`你做的是 ${v}，比 ${q.v} ${v > q.v ? '多' : '少'} ${Math.abs(v - q.v)}。再調一調。`), 'hint');
    }
    draw(true);
    finish(0, { wrong: v, ans: q.v }, nums(`你做的是 ${v}。${q.v} 可以是 ${Math.floor(q.v / 100)} 個百、${Math.floor(q.v / 10) % 10} 個十、${q.v % 10} 個一。`));
  };
}

/* ---------- 青蛙跳跳 ---------- */
function viewFrog(q) {
  const expr = q.mode === 'expr';
  const hopBtns = [[100, 'up'], [10, 'up'], [1, 'up'], [-100, 'dn'], [-10, 'dn'], [-1, 'dn']];
  const prompt = expr ? `呱呱的家在<br>${N(q.expr)} 的答案那片荷葉` : `從 ${N(q.s)} 跳到 ${N(q.t)} 號荷葉<br>最少幾跳？`;
  frame(prompt, `<p class="frog-now num" id="now">${q.s}</p><div class="line-wrap" id="fl"></div><div class="trail" id="trail">還沒跳</div>
    <div class="hops">${hopBtns.map(([h, c]) => `<button class="${c} num" data-h="${h}">${sgn(h)}</button>`).join('')}</div>`);
  let pos = q.s; const path = []; let done = false;
  function draw() {
    document.getElementById('now').textContent = pos;
    document.getElementById('trail').innerHTML = path.length ? nums(path.map(sgn).join(' ') + `（${path.length} 跳）`) : '還沒跳';
    const pts = [q.s, pos, ...(expr ? [] : [q.t])]; let c = q.s;
    path.forEach(h => { c += h; pts.push(c); });
    const lo = Math.min(...pts), hi = Math.max(...pts), pad = Math.max(3, (hi - lo) * .08);
    const X = v => 24 + (v - (lo - pad)) / (hi - lo + 2 * pad) * 592;
    let arcs = '', x = q.s;
    path.forEach(h => {
      const a = X(x), b = X(x + h), up = Math.min(44, 10 + Math.abs(b - a) * .4);
      arcs += `<path d="M${a} 62Q${(a + b) / 2} ${62 - up * 2} ${b} 62" fill="none" stroke="${h > 0 ? '#3d9970' : '#7d5bbe'}" stroke-width="3"/>`;
      x += h;
    });
    const label = (v, c, y) => `<circle cx="${X(v)}" cy="62" r="6" fill="${c}"/><text x="${X(v)}" y="${y}" text-anchor="middle" font-size="22" style="fill:${c}">${v}</text>`;
    document.getElementById('fl').innerHTML = `<svg viewBox="0 0 640 96"><path d="M12 62H628" stroke="#33405a" stroke-width="3" stroke-linecap="round"/>${arcs}
      ${label(q.s, '#77809a', 90)}${expr ? '' : label(q.t, '#d6476b', 90)}${HAS.gua_jump ? `<image href="${artUrl('gua_jump')}" x="${X(pos) - 24}" y="22" width="48" height="48"/>` : `<circle cx="${X(pos)}" cy="58" r="11" fill="#3d9970"/><circle cx="${X(pos) - 4}" cy="49" r="3" fill="#3d9970"/><circle cx="${X(pos) + 4}" cy="49" r="3" fill="#3d9970"/>`}</svg>`;
  }
  draw();
  function settle() {
    if (pos !== q.t) return false;
    done = true;
    document.querySelectorAll('.hops button').forEach(b => { b.disabled = true; b.style.opacity = .35; });
    const g = Logic.gradeFrog(q, pos, path.length), best = q.best.map(sgn).join(' ');
    const extra = path.length - q.par;
    finish(g, { extra, s: q.s, t: q.t }, g === 2 ? nums(`到了！${path.length} 跳，已經是最少了！`) : nums(`到了！還可以更少：${best}（${q.par} 跳）。`));
    return true;
  }
  document.querySelectorAll('.hops button').forEach(b => {
    b.onclick = () => {
      if (done) return;
      const h = +b.dataset.h, n = pos + h;
      if (n < 0 || n > 1100) return setMsg('跳太遠了，換一個跳法。', 'hint');
      pos = n; path.push(h); sfx.hop(); setMsg(''); draw();
      if (!expr) settle();
    };
  });
  const acts = document.getElementById('actions');
  acts.innerHTML = `<button class="btn alt" id="undo">退一步</button>${expr ? '<button class="btn" id="arrive">到了</button>' : ''}`;
  document.getElementById('undo').onclick = () => { if (done || !path.length) return; pos -= path.pop(); draw(); setMsg(''); };
  if (expr) document.getElementById('arrive').onclick = () => {
    if (settle()) return;
    if (R.tries === 0) { R.tries = 1; sfx.retry(); return setMsg(nums(`你跳到 ${pos}，想想看：${q.expr}，要往${q.expr.includes('＋') ? '右' : '左'}跳多少？`), 'hint'); }
    done = true;
    finish(0, { wrong: pos, ans: q.t }, nums(`${q.expr}＝${q.t}。可以這樣跳：${q.best.map(sgn).join(' ')}。`));
  };
}

/* ---------- 神奇天平 ---------- */
function scaleSvg(lText, rText, tilt) {
  const deg = tilt === 'L' ? -7 : tilt === 'R' ? 7 : 0;
  const pan = (x, t) => `<path d="M${x} 66L${x - 58} 124M${x} 66L${x + 58} 124" stroke="#7d5bbe" stroke-width="2.5"/><path d="M${x - 70} 124h140a70 34 0 0 1-140 0z" fill="#e7def7" stroke="#7d5bbe" stroke-width="2.5"/>${HAN.test(t) ? `<foreignObject x="${x - 68}" y="122" width="136" height="38"><div class="pan-t">${esc(t)}</div></foreignObject>` : `<text x="${x}" y="147" class="num">${esc(t)}</text>`}`;
  return `<svg class="scale-svg" viewBox="0 0 400 196"><path d="M200 66V180M150 186h100" stroke="#7d5bbe" stroke-width="8" stroke-linecap="round"/>
    <g class="beam" id="beam" style="transform:rotate(${deg}deg)"><path d="M90 66H310" stroke="#7d5bbe" stroke-width="7" stroke-linecap="round"/>${pan(90, lText)}${pan(310, rText)}</g></svg>`;
}
function viewScale(q) {
  if (q.mode === 'fill') {
    const sides = q.text.split('＝');
    frame('天平要平衡，□ 要放多少？', `<div class="fill-text num">${esc(q.text)}</div><div id="sc">${scaleSvg('', '', null)}</div>${padHidden()}`);
    gate(q, ['放左邊', '放右邊'], 2, k => setEl('sc', scaleSvg(sides[0], k > 1 ? (sides[1] || '') : '', null)), () => {});
    bindKeypad((val, clear) => {
      if (val === q.ans) { lockKeypad(); return finish(R.tries === 0 ? 2 : 1, 'fill', nums('平衡了！' + q.why)); }
      if (R.tries === 0) { R.tries = 1; sfx.retry(); clear(); return setMsg(nums(`放 ${val} 不平衡。想一想：${q.why.split('，')[0]}。`), 'hint'); }
      lockKeypad();
      finish(0, { wrong: val, ans: q.ans, text: q.text }, nums(`□ 是 ${q.ans}。${q.why}`));
    });
    return;
  }
  if (q.mode === 'near') {
    const ps = q.text.split(/[＋－]/).map(Number), nearT = x => Math.round(x / 10) * 10;
    frame(`這袋松果有 ${N(q.text)} 顆，<br>大約是多少？`, `<div class="fill-text num">${esc(q.text)}</div><div class="trail" id="ct">先想成整十</div>`);
    const ask = () => {
      document.getElementById('actions').innerHTML = `<div class="choices">${q.options.map(o => `<button class="choice num" data-o="${o}">${o}</button>`).join('')}</div>`;
      document.querySelectorAll('.choice').forEach(b => {
        b.onclick = () => {
          if (+b.dataset.o === q.ans) return finish(R.tries === 0 ? 2 : 1, 'near', nums(q.why));
          if (R.tries === 0) { R.tries = 1; b.classList.add('no'); b.disabled = true; sfx.retry(); return setMsg('把兩個整十加起來。', 'hint'); }
          finish(0, { text: q.text, wrong: +b.dataset.o, ans: q.ans }, nums(q.why));
        };
      });
    };
    gate(q, ['第一個想成整十', '第二個想成整十'], 2, k => setEl('ct', nums(ps.slice(0, k).map(x => `${x} 大約是 ${nearT(x)}`).join('，'))), ask);
    return;
  }
  frame(q.frac ? '同樣大的蛋糕，<br>哪一邊的一塊比較大？' : '不用算完，<br>哪一邊的松果多？', `<div id="sc">${scaleSvg('', '', null)}</div>`);
  const lab = q.frac ? { L: '左邊大', E: '一樣大', R: '右邊大' } : { L: '左邊多', E: '一樣多', R: '右邊多' };
  gate(q, ['放到左邊', '放到右邊'], 2, k => setEl('sc', scaleSvg(q.lText, k > 1 ? q.rText : '', null)), () => {
  document.getElementById('actions').innerHTML = `<div class="choices">${['L', 'E', 'R'].map(k => `<button class="choice" data-c="${k}" style="font-size:24px">${lab[k]}</button>`).join('')}</div>`;
  document.querySelectorAll('.choice').forEach(b => {
    b.onclick = () => {
      const c = b.dataset.c;
      if (c === q.ans) {
        document.getElementById('beam').style.transform = `rotate(${q.ans === 'L' ? -7 : q.ans === 'R' ? 7 : 0}deg)`;
        return finish(R.tries === 0 ? 2 : 1, 'cmp', q.frac ? q.why : nums(`左邊 ${q.l}，右邊 ${q.r}。${q.why}`));
      }
      if (R.tries === 0) { R.tries = 1; b.classList.add('no'); b.disabled = true; sfx.retry(); return setMsg('再想一想，看兩邊哪裡不一樣。', 'hint'); }
      document.getElementById('beam').style.transform = `rotate(${q.ans === 'L' ? -7 : q.ans === 'R' ? 7 : 0}deg)`;
      finish(0, { l: q.lText, r: q.rText, pick: c }, q.frac ? `是${lab[q.ans]}。${q.why}` : nums(`是${lab[q.ans]}：左邊 ${q.l}，右邊 ${q.r}。${q.why}`));
    };
  });
  });
}

/* ---------- 糖果排排 ---------- */
function candyRow(a, cls, tag) {
  return `<div class="row-c ${cls || ''}">${'<span class="c"></span>'.repeat(a)}<span class="sum-tag num">${tag || ''}</span></div>`;
}
function viewCandy(q) {
  const useX = S.unit >= 7;
  const eq = (a, b) => useX ? `${a}×${b}` : `每排 ${a} 顆，${b} 排`;
  if (q.mode === 'split') return viewCandySplit(q);
  if (q.mode === 'pack' || q.mode === 'share') return viewCandyDeal(q);
  if (q.mode === 'frac' || q.mode === 'fair') return viewCandyFrac(q);
  const rows = q.mode === 'more' ? q.b + 1 : q.b;
  const prompt = q.mode === 'count' ? `這盒每排 ${N(q.a)} 顆，有 ${N(q.b)} 排，<br>共幾顆？${useX ? `（${N(q.a + '×' + q.b)}）` : ''}`
    : q.mode === 'more' ? `${nums(eq(q.a, q.b))} 是 ${N(q.known)} 顆。<br>多 ${N(1)} 排，共幾顆？`
    : `${nums(eq(q.a, q.b))} 是 ${N(q.known)} 顆。<br>少 ${N(1)} 排，還有幾顆？`;
  frame(prompt, `<div class="grid" id="grid"></div>${padHidden()}`);
  const lit = new Array(rows).fill(false);
  let openedC = false;
  const openC = () => { if (!openedC) { openedC = true; setMsg('數好了，按數字回答。', 'good'); afterAct(() => {}); } };
  function draw() {
    let acc = 0;
    document.getElementById('grid').innerHTML = Array.from({ length: rows }, (_, i) => {
      if (lit[i]) acc += q.a;
      const cls = (lit[i] ? 'lit ' : '') + (q.mode === 'more' && i === rows - 1 ? 'new' : q.mode === 'less' && i === rows - 1 ? 'gone' : '');
      return `<button data-r="${i}" style="padding:0">${candyRow(q.a, cls, lit[i] ? acc : '')}</button>`;
    }).join('');
  }
  const litTo = i => { i = Math.max(0, Math.min(rows - 1, i)); if (lit[i] && !lit[i + 1]) return; lit.fill(false); for (let j = 0; j <= i; j++) lit[j] = true; sfx.hop(); draw(); if (i === rows - 1) openC(); };
  draw();
  dragOn(document.getElementById('grid'), (x, y) => litTo(Math.floor(y * rows)), 'self');
  setMsg(q.mode === 'count' ? nums(`手指從上往下拖，${q.a} 個 ${q.a} 個數到最後一排。`) : nums(`手指往下拖到虛線那一排。`));
  if (isFast(q)) openC();
  bindKeypad((val, clear) => {
    if (val === q.ans) { lockKeypad(); return finish(R.tries === 0 ? 2 : 1, q.mode, q.mode === 'count' ? nums(`對了！${q.b} 個 ${q.a} 是 ${q.ans}。`) : nums(`對了！${q.known} ${q.mode === 'more' ? '再多' : '再少'} ${q.a} 就是 ${q.ans}，不用重算。`)); }
    if (R.tries === 0) {
      R.tries = 1; sfx.retry(); clear();
      return setMsg(q.mode === 'count' ? '點最下面一排，看看一路數到多少。' : nums(`虛線那一排有 ${q.a} 顆，從 ${q.known} 開始想。`), 'hint');
    }
    lockKeypad();
    finish(0, { wrong: val, ans: q.ans, a: q.a, b: q.b, m: q.mode }, nums(`答案是 ${q.ans}。${q.mode === 'count' ? `${q.b} 個 ${q.a} 相加。` : `${q.known} ${q.mode === 'more' ? '＋' : '－'} ${q.a}。`}`));
  });
}
function viewCandySplit(q) {
  frame(`${N(q.a + '×' + q.b)} 太大了？<br>點一排，從它下面切開，變成好算的兩塊！`, `<div class="grid" id="grid"></div><div class="trail" id="parts">還沒切</div>${padHidden()}`);
  let cut = null, openedS = false;
  if (isFast(q)) { openedS = true; afterAct(() => {}); }
  function draw() {
    document.getElementById('grid').innerHTML = Array.from({ length: q.b }, (_, i) => {
      const cls = (cut !== null && i >= cut ? 'part2 ' : '') + (cut === i + 1 ? 'cut' : '');
      return `<button style="padding:0" ${i < q.b - 1 ? `data-cut="${i + 1}"` : ''} aria-label="從第 ${i + 1} 排下面切開">${candyRow(q.a, cls)}</button>`;
    }).join('');
    document.querySelectorAll('[data-cut]').forEach(b => b.onclick = () => { cut = +b.dataset.cut; sfx.hop(); draw(); if (!openedS) { openedS = true; afterAct(() => {}); } });
    document.getElementById('parts').innerHTML = cut === null ? '還沒切' :
      nums(`${q.a}×${cut} 和 ${q.a}×${q.b - cut}`);
  }
  draw();
  bindKeypad((val, clear) => {
    if (val === q.ans) { lockKeypad(); const c = cut || 5; return finish(R.tries === 0 ? 2 : 1, 'split', nums(`對了！${q.a}×${c}＝${q.a * c}，${q.a}×${q.b - c}＝${q.a * (q.b - c)}，合起來 ${q.ans}。`)); }
    if (R.tries === 0) { R.tries = 1; sfx.retry(); clear(); return setMsg(nums(cut ? `先算 ${q.a}×${cut}，再算 ${q.a}×${q.b - cut}，最後加起來。` : `試著切在第 ${Math.min(5, q.b - 1)} 排下面，先算好算的。`), 'hint'); }
    lockKeypad();
    finish(0, { wrong: val, ans: q.ans, a: q.a, b: q.b, m: 'split' }, nums(`答案是 ${q.ans}：${q.a}×5＝${q.a * 5}，${q.a}×${q.b - 5}＝${q.a * (q.b - 5)}，合起來就是了。`));
  });
}

const sweet = n => '<span class="c"></span>'.repeat(n);
function viewCandyDeal(q) {
  const pack = q.mode === 'pack';
  frame(pack ? `${N(q.total)} 顆糖，每 ${N(q.a)} 顆裝 ${N(1)} 盒，<br>可以裝幾盒？` : `${N(q.total)} 顆糖，平分給 ${N(q.b)} 個人，<br>每人幾顆？`,
    `<div class="pile-c" id="pile"></div><div class="boxes" id="boxes"></div><div class="trade"><button id="deal"></button></div>${padHidden()}`);
  let left = isFast(q) ? 0 : q.total, rounds = isFast(q) ? (pack ? q.b : q.a) : 0, openedD = false;
  function draw() {
    document.getElementById('pile').innerHTML = left ? sweet(left) : '<span class="note">分完了！</span>';
    const boxes = pack
      ? Array.from({ length: rounds }, () => `<div class="box">${sweet(q.a)}</div>`)
      : Array.from({ length: q.b }, () => `<div class="box">${rounds ? sweet(rounds) : ''}</div>`);
    document.getElementById('boxes').innerHTML = boxes.join('');
    const d = document.getElementById('deal');
    d.textContent = pack ? '裝一盒' : '每人發一顆';
    d.style.display = left === 0 ? 'none' : '';
    if (left === 0 && !openedD) { openedD = true; setMsg('分完了！按數字回答。', 'good'); afterAct(() => {}); }
  }
  document.getElementById('deal').onclick = () => { left -= pack ? q.a : q.b; rounds++; sfx.hop(); draw(); };
  tapAlso('pile', 'deal');
  draw();
  bindKeypad((val, clear) => {
    if (val === q.ans) { lockKeypad(); return finish(R.tries === 0 ? 2 : 1, q.mode, nums(pack ? `對了！${q.a}×${q.b}＝${q.total}，可以裝 ${q.b} 盒。` : `對了！${q.a}×${q.b}＝${q.total}，每人 ${q.a} 顆。`)); }
    if (R.tries === 0) { R.tries = 1; sfx.retry(); clear(); return setMsg('按黃色按鈕真的分分看，分完再算。', 'hint'); }
    lockKeypad();
    finish(0, { wrong: val, ans: q.ans, a: q.a, b: q.b, m: q.mode }, nums(pack ? `答案是 ${q.b} 盒：${q.a}×${q.b}＝${q.total}。` : `答案是 ${q.a} 顆：${q.a}×${q.b}＝${q.total}。`));
  });
}
const fracHtml = n => `<span class="frac num"><i>1</i><i>${n}</i></span>`;
function cakeSvg(n) { // 圓形平分 2、4、8 份，其他用長條，和課本一樣
  if (n === 2 || n === 4 || n === 8) {
    let s = '<svg class="cake" viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="#fff0cf" stroke="#c9740c" stroke-width="3"/>';
    const P = i => { const t = i / n * 2 * Math.PI - Math.PI / 2; return `${60 + 54 * Math.cos(t)} ${60 + 54 * Math.sin(t)}`; };
    s += `<path d="M60 60L${P(0)}A54 54 0 0 1 ${P(1)}Z" fill="#d6476b"/>`;
    for (let i = 0; i < n; i++) s += `<path d="M60 60L${P(i)}" stroke="#c9740c" stroke-width="3"/>`;
    return s + '</svg>';
  }
  return barSvg(Array(n).fill(1), true);
}
function barSvg(parts, mark) {
  const tot = parts.reduce((a, b) => a + b, 0); let x = 4, s = '<svg class="bar" viewBox="0 0 268 58">';
  parts.forEach((w, i) => { const W = w / tot * 260; s += `<rect x="${x}" y="6" width="${W}" height="46" fill="${mark && i === 0 ? '#d6476b' : '#fff0cf'}" stroke="#c9740c" stroke-width="3"/>`; x += W; });
  return s + '</svg>';
}
function viewCandyFrac(q) {
  if (q.mode === 'fair') {
    const eq = Array(q.n).fill(1), un = eq.map((_, i) => i === 0 ? 2.4 : i === 1 ? 0.5 : 1);
    const [A, B] = q.fairFirst ? [eq, un] : [un, eq];
    frame('熊奶奶要公平地切蛋糕捲，<br>哪一條是「平分」？', `<div class="fair"><button class="choice" data-f="${q.fairFirst ? 1 : 0}">${barSvg(A)}</button><button class="choice" data-f="${q.fairFirst ? 0 : 1}">${barSvg(B)}</button></div>`);
    document.querySelectorAll('[data-f]').forEach(b => {
      b.onclick = () => {
        if (b.dataset.f === '1') return finish(R.tries === 0 ? 2 : 1, 'fair', '對了！每一塊都一樣大，才是平分。');
        R.tries = 1; b.classList.add('no'); b.disabled = true; sfx.retry(); setMsg('這一條有的大、有的小，再看另一條。', 'hint');
      };
    });
    return;
  }
  frame('蛋糕平分好了，<br>紅色這一塊是幾分之一個？', `<div class="cake-wrap">${cakeSvg(q.n)}</div><div class="trail" id="ct"></div>`);
  gate(q, '數一數一共幾塊', 1, () => setEl('ct', nums(`一共 ${q.n} 塊`)), () => {
  document.getElementById('actions').innerHTML = `<div class="choices">${q.options.map(o => `<button class="choice" data-n="${o}">${fracHtml(o)}</button>`).join('')}</div>`;
  document.querySelectorAll('[data-n]').forEach(b => {
    b.onclick = () => {
      if (+b.dataset.n === q.ans) return finish(R.tries === 0 ? 2 : 1, 'frac', nums(`對了！平分成 ${q.n} 塊，1 塊就是${Logic.fracWord(q.n)}個。`));
      if (R.tries === 0) { R.tries = 1; b.classList.add('no'); b.disabled = true; sfx.retry(); return setMsg('數數看，一共平分成幾塊？', 'hint'); }
      finish(0, { ans: q.n, wrong: +b.dataset.n }, nums(`一共 ${q.n} 塊，1 塊是${Logic.fracWord(q.n)}個。`));
    };
  });
  });
}

/* ---------- 鐘塔修理 ---------- */
function clockSvg(h, m) {
  const ma = m * 6, ha = (h % 12) * 30 + m / 2;
  let ticks = '', nums2 = '';
  for (let i = 0; i < 60; i++) { const big = i % 5 === 0; ticks += `<path d="M100 ${big ? 14 : 10}V8" transform="rotate(${i * 6} 100 100)" stroke="#33405a" stroke-width="${big ? 4 : 1.5}" ${big ? '' : 'opacity=".55"'}/>`; }
  for (let i = 1; i <= 12; i++) { const t = i * 30 * Math.PI / 180; nums2 += `<text x="${100 + 72 * Math.sin(t)}" y="${100 - 72 * Math.cos(t) + 8}" text-anchor="middle" font-size="22">${i}</text>`; }
  return `<svg class="clock" viewBox="0 0 200 200"><circle cx="100" cy="100" r="96" fill="#fffdf7" stroke="#3b82c4" stroke-width="6"/>${ticks}${nums2}
    <path id="hh" d="M100 100V52" transform="rotate(${ha} 100 100)" stroke="#33405a" stroke-width="8" stroke-linecap="round"/>
    <path id="mm" d="M100 100V26" transform="rotate(${ma} 100 100)" stroke="#d6476b" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="100" r="7" fill="#33405a"/></svg>`;
}
function viewClock(q) {
  if (q.mode === 'read') {
    frame('大鐘停在這裡，<br>現在是幾時幾分？', `<div class="cake-wrap">${clockSvg(q.h, q.m)}</div><div class="trail" id="ct"></div>`);
    gate(q, ['先看短針', '再看長針'], 2, k => setEl('ct', nums(k === 1 ? (q.m ? `短針過了 ${q.h}` : `短針指著 ${q.h}`) : (q.m ? `短針過了 ${q.h}，長針走了 ${q.m} 小格` : `短針指著 ${q.h}，長針指著 12`))), () => {
    document.getElementById('actions').innerHTML = `<div class="choices col">${q.options.map(o => `<button class="choice" data-o="${o}" style="font-size:24px">${nums(o)}</button>`).join('')}</div>`;
    const ans = `${q.h} 時 ${q.m} 分`;
    document.querySelectorAll('[data-o]').forEach(b => {
      b.onclick = () => {
        if (b.dataset.o === ans) return finish(R.tries === 0 ? 2 : 1, 'read', nums(q.m === 0 ? `對了！短針指著 ${q.h}，長針指著 12。` : `對了！短針過了 ${q.h}，長針走了 ${q.m} 小格。`));
        if (R.tries === 0) { R.tries = 1; b.classList.add('no'); b.disabled = true; sfx.retry(); return setMsg('短針看「幾時」，長針一小格是 1 分鐘。', 'hint'); }
        finish(0, { wrong: b.dataset.o, ans }, nums(`是 ${ans}。短針看幾時，長針看幾分。`));
      };
    });
    });
    return;
  }
  const after = q.mode === 'after';
  frame(after ? `現在是 ${nums(`${q.sh} 時 ${q.sm} 分`)}，<br>再過 ${N(q.add)} 分鐘，把鐘撥好！` : `把大鐘撥到<br>${nums(`${q.h} 時 ${q.m} 分`)}`,
    `<div class="cake-wrap" id="ckw">${clockSvg(after ? q.sh : 12, after ? q.sm : 0)}</div><div class="trail num" id="tm"></div>
     <div class="hops"><button class="up" data-c="60">+1時</button><button class="up" data-c="5">+5分</button><button class="up" data-c="1">+1分</button><button class="dn" data-c="-60">−1時</button><button class="dn" data-c="-5">−5分</button><button class="dn" data-c="-1">−1分</button></div>`);
  let t = (after ? q.sh % 12 : 0) * 60 + (after ? q.sm : 0);
  const draw = () => {
    const h = Math.floor(t / 60) || 12, m = t % 60;
    document.getElementById('hh').setAttribute('transform', `rotate(${(h % 12) * 30 + m / 2} 100 100)`);
    document.getElementById('mm').setAttribute('transform', `rotate(${m * 6} 100 100)`);
    document.getElementById('tm').textContent = `${h} 時 ${m} 分`;
    return [h, m];
  };
  draw();
  document.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { t = (t + +b.dataset.c + 720) % 720; sfx.hop(); draw(); });
  setMsg('手指撥動指針：撥外圈動長針，撥中間動短針。');
  let hand = null;
  dragOn(document.getElementById('ckw'), (x, y) => {
    const dx = x - .5, dy = .5 - y, r = Math.hypot(dx, dy), a = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360, h0 = Math.floor(t / 60), m0 = t % 60;
    if (hand === null) hand = r < .27 ? 'h' : 'm';
    if (hand === 'h') { const h = Math.round(a / 30) % 12; if (h !== h0) { t = h * 60 + m0; sfx.hop(); draw(); } return; }
    const m = Math.round(a / 6) % 60; if (m === m0) return;
    const wrap = m0 > 45 && m < 15 ? 1 : m0 < 15 && m > 45 ? -1 : 0;
    t = ((h0 + wrap + 12) % 12) * 60 + m; draw();
  });
  const wrapCk = document.getElementById('ckw'), upCk = wrapCk.onpointerup;
  wrapCk.onpointerup = e => { hand = null; upCk(e); };
  document.getElementById('actions').innerHTML = '<button class="btn" id="ok">撥好了</button>';
  document.getElementById('ok').onclick = () => {
    const [h, m] = draw();
    if (h === q.h && m === q.m) { document.querySelectorAll('[data-c]').forEach(b => b.disabled = true); return finish(R.tries === 0 ? 2 : 1, q.mode, nums(`噹！噹！${q.h} 時 ${q.m} 分，鐘塔又動了！`)); }
    if (R.tries === 0) { R.tries = 1; sfx.retry(); return setMsg(after ? '先撥分針走那些分鐘，過了 60 分，時針就多 1。' : '先撥時，再撥分。', 'hint'); }
    document.querySelectorAll('[data-c]').forEach(b => b.disabled = true);
    finish(0, { wrong: `${h}:${m}`, ans: `${q.h}:${q.m}` }, nums(`應該是 ${q.h} 時 ${q.m} 分。`));
  };
}

/* ---------- 霧中小火車 ---------- */
function peopleBlock(n, cls, leaveFrom) {
  // 十人一條、一人一格；leaveFrom 之後的人是下車的，畫成虛線
  const cell = i => `<i class="${leaveFrom !== undefined && i >= leaveFrom ? 'gone' : ''}"></i>`;
  let h = '', i = 0;
  while (n - i >= 10) { h += `<span class="p10">${Array.from({ length: 10 }, (_, k) => cell(i + k)).join('')}</span>`; i += 10; }
  if (n - i > 0) h += `<span class="p1s">${Array.from({ length: n - i }, (_, k) => cell(i + k)).join('')}</span>`;
  return `<span class="people ${cls}">${h}</span>`;
}
function seats(before, op) {
  const legend = (cls, text) => `<span class="lg"><i class="${cls}"></i>${nums(text)}</span>`;
  if (!op) return `<div class="ride">${peopleBlock(before, 'old')}</div><div class="legend">${legend('old', `車上 ${before} 人`)}</div>`;
  if (op.d > 0) return `<div class="ride">${peopleBlock(before, 'old')}<b class="plus">＋</b>${peopleBlock(op.n, 'new')}</div>
    <div class="legend">${legend('old', `原本 ${before} 人`)}${legend('new', `上車 ${op.n} 人`)}</div>`;
  return `<div class="ride">${peopleBlock(before, 'old', before - op.n)}</div>
    <div class="legend">${legend('old', `原本 ${before} 人`)}${legend('gone', `下車 ${op.n} 人`)}</div>`;
}
function viewTrain(q) {
  const opText = o => `${o.t} ${N(o.n)} 人`;
  const head = q.mode === 'mult'
    ? `每節車廂 ${N(q.a)} 人，<br>有 ${N(q.b)} 節。`
    : `車上有 ${N(q.start)} 人。<br>第一站${opText(q.ops[0])}。`;
  const asks = q.mode === 'mult'
    ? [`先算：現在車上幾人？`, `到站${opText(q.ops[0])}，還有幾人？`]
    : ['第一站之後有幾人？', `第二站${opText(q.ops[1])}，現在幾人？`];
  let step = 0, pre = q.mode === 'mult' ? null : q.start;
  frame(head, `<div class="seats" id="seats"></div>${padHidden()}`);
  const draw = () => {
    document.getElementById('seats').innerHTML = pre === null ? `<div class="ride">${Array.from({ length: q.b }, () => peopleBlock(q.a, 'old')).join('<b class="plus gap"></b>')}</div><div class="legend"><span class="lg">${nums(`每節 ${q.a} 人，${q.b} 節`)}</span></div>` : seats(pre, q.mode === 'mult' ? q.ops[0] : q.ops[step]);
    document.getElementById('ask').innerHTML = nums(asks[step]).replace(/<span class="num"><span class="num">/g, '<span class="num">');
  };
  document.getElementById('ask').innerHTML = '';
  const cars = n => `<div class="ride">${Array.from({ length: n }, () => peopleBlock(q.a, 'old')).join('<b class="plus gap"></b>')}</div>`;
  if (q.mode === 'mult') gate(q, '接上一節車廂', q.b, k => { setEl('seats', cars(k)); if (k === q.b) draw(); }, () => draw());
  else { setEl('seats', seats(q.start)); gate(q, '開到第一站', 1, () => draw(), () => draw()); }
  bindKeypad((val, clear) => {
    if (val === q.steps[step]) {
      pre = val; R.tries = R.tries || 0; sfx.ok(); clear();
      if (step === 0 && q.steps.length > 1) { step = 1; draw(); return setMsg(nums(`對了，有 ${val} 人。列車繼續開！`), 'good'); }
      lockKeypad(); draw();
      return finish(R.tries === 0 ? 2 : 1, 'train', nums(`到站了！車上有 ${val} 人。`));
    }
    if (R.tries === 0) { R.tries = 1; sfx.retry(); clear(); const o = step === 0 && q.mode === 'mult' ? null : q.ops[q.mode === 'mult' ? 0 : step]; return setMsg(o ? `${o.t}，人數會${o.d > 0 ? '變多' : '變少'}。再算一次。` : nums(`${q.b} 節，每節 ${q.a} 人，${q.a}×${q.b}。`), 'hint'); }
    lockKeypad();
    finish(0, { wrong: val, ans: q.steps[step] }, nums(`這一步是 ${q.steps[step]}，最後是 ${q.ans} 人。`));
  });
}
const sweetDots = n => '<span class="c"></span>'.repeat(n);

/* ---------- 零錢小舖 ---------- */
function coin(v, attrs) {
  const cls = v >= 500 ? 'note' : v >= 100 ? 'c100' : v >= 50 ? 'c50' : v >= 10 ? 'c10' : v >= 5 ? 'c5' : 'c1';
  return `<button class="coin ${cls} num" ${attrs || ''}>${v}</button>`;
}
function viewShop(q) {
  if (q.mode === 'change') {
    frame(`${q.item}要 ${N(q.price)} 元，<br>付 ${N(q.paid)} 元，找多少？`, `<div class="trail">${nums(`從 ${q.price} 開始放錢，放到 ${q.paid} 元。`)}</div><div class="tray" id="tray"></div><div class="u-now num" id="sum"></div><div class="wallet" id="wl">${[50, 10, 5, 1].map(v => coin(v, `data-add="${v}"`)).join('')}</div>${padHidden()}`);
    let now = q.price; const put = []; let openedP = false;
    const drawP = () => { document.getElementById('tray').innerHTML = put.map((v, i) => coin(v, `data-rm="${i}"`)).join('') || '<span class="note">櫃檯是空的</span>'; document.getElementById('sum').textContent = `現在 ${now} 元`; document.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { now -= put.splice(+b.dataset.rm, 1)[0]; sfx.hop(); drawP(); }); };
    drawP();
    const openP = () => { if (!openedP) { openedP = true; document.getElementById('wl').style.display = 'none'; document.getElementById('sum').style.display = 'none'; setMsg('放好了！一共放了多少？', 'good'); afterAct(() => {}); } };
    document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { const v = +b.dataset.add; if (now + v > q.paid) { sfx.retry(); return setMsg('這樣太多了，換小一點的錢。', 'hint'); } now += v; put.push(v); sfx.hop(); setMsg(''); drawP(); if (now === q.paid) openP(); });
    if (isFast(q)) openP();
    bindKeypad((val, clear) => {
      if (val === q.ans) { lockKeypad(); return finish(R.tries === 0 ? 2 : 1, 'change', nums(`對了！${q.price}＋${q.ans}＝100。`)); }
      if (R.tries === 0) { R.tries = 1; sfx.retry(); clear(); const up = Math.ceil(q.price / 10) * 10; return setMsg(nums(`${q.price} 先到 ${up}，再到 100。`), 'hint'); }
      lockKeypad(); finish(0, { wrong: val, ans: q.ans }, nums(`找 ${q.ans} 元：${q.price}＋${q.ans}＝100。`));
    });
    return;
  }
  if (q.mode === 'enough') {
    const nearU = x => Math.round(x / 10) * 10;
    frame(`口袋有 ${N(q.budget)} 元，<br>${q.item} ${N(q.a)} 元、${q.other} ${N(q.b)} 元，夠不夠？`, `<div class="trail" id="ct">不用算到最後，估一估就好</div>`);
    const ask = () => {
      document.getElementById('actions').innerHTML = '<div class="choices"><button class="choice" data-y="1">夠</button><button class="choice" data-y="0">不夠</button></div>';
      document.querySelectorAll('[data-y]').forEach(b => b.onclick = () => {
        if ((b.dataset.y === '1') === q.ans) return finish(R.tries === 0 ? 2 : 1, 'enough', nums(`${q.ans ? '夠' : '不夠'}！${q.why}`));
        if (R.tries === 0) { R.tries = 1; b.classList.add('no'); b.disabled = true; sfx.retry(); return setMsg(nums(q.why), 'hint'); }
      });
    };
    gate(q, ['第一樣想成整十', '第二樣想成整十'], 2, k => setEl('ct', nums(k === 1 ? `${q.item} 大約 ${nearU(q.a)} 元` : `${q.item} 大約 ${nearU(q.a)} 元，${q.other} 大約 ${nearU(q.b)} 元`)), ask);
    return;
  }
  frame(`${q.item}要 ${N(q.price)} 元，<br>${q.strict ? '用最少的錢幣付！' : '把錢放上櫃檯。'}`, `<div class="tray" id="tray"></div><div class="trail num" id="sum"></div><div class="wallet">${q.coins.map(v => coin(v, `data-add="${v}"`)).join('')}</div>`);
  const tray = [];
  const draw = () => {
    document.getElementById('tray').innerHTML = tray.map((v, i) => coin(v, `data-rm="${i}"`)).join('') || '<span class="note">櫃檯是空的</span>';
    document.getElementById('sum').textContent = q.strict ? `已放 ${tray.length} 枚` : `共 ${tray.reduce((a, b) => a + b, 0)} 元`;
    document.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { tray.splice(+b.dataset.rm, 1); draw(); });
  };
  draw();
  document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { if (tray.length < 40) tray.push(+b.dataset.add); sfx.hop(); draw(); });
  document.getElementById('actions').innerHTML = '<button class="btn" id="ok">付錢</button>';
  document.getElementById('ok').onclick = () => {
    const v = tray.reduce((a, b) => a + b, 0);
    if (v === q.price) {
      document.querySelectorAll('.wallet button').forEach(b => b.disabled = true);
      const best = tray.length <= q.par;
      return finish(best && R.tries === 0 ? 2 : 1, 'pay', best ? nums(`剛剛好！${tray.length} 枚，最少了！`) : nums(`錢對了！其實 ${q.par} 枚就夠，先用大的錢幣。`));
    }
    if (R.tries === 0) { R.tries = 1; sfx.retry(); return setMsg(nums(`現在 ${v} 元，${v > q.price ? '多' : '少'}了 ${Math.abs(v - q.price)} 元。`), 'hint'); }
    document.querySelectorAll('.wallet button').forEach(b => b.disabled = true);
    finish(0, { wrong: v, ans: q.price }, nums(`要 ${q.price} 元，你放了 ${v} 元。`));
  };
}

const VIEWS = { line: viewLine, block: viewBlock, frog: viewFrog, scale: viewScale, candy: viewCandy, clock: viewClock, train: viewTrain, shop: viewShop };

/*QUIZ_BEGIN*/
const QUIZ_STAR = 1;
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
/*QUIZ_END*/
/*CPT_BEGIN*/
/* ---------- 新概念小故事：生活問題 → 動手試（新詞不出現）→ 命名貼回圖上 → 換情境答一題，答錯回去動手 ---------- */
const cT = w => `<b class="term">${w}</b>`;
const cTag = w => `<span class="ctag">${w}</span>`;
const cBk = (k, n) => `<i class="bk ${k}"></i>`.repeat(n);
const cDots = n => '<i class="dot"></i>'.repeat(n);
const cPv = (cols, labels) => `<div class="pv">${cols.map((c, i) => `<div class="pv-c"><b class="num">${c[0]}</b><div class="pv-b">${c[1]}</div>${labels ? cTag(labels[i]) : ''}</div>`).join('')}</div>`;
const cDigits = s => `<div class="pv-d num">${[...s].map(d => `<span>${d}</span>`).join('')}</div>`;
const cLine = (marks, flag, labels) => `<svg class="c-svg" viewBox="0 0 320 84"><line x1="16" x2="304" y1="56" y2="56" stroke="#33405a" stroke-width="4" stroke-linecap="round"/>${marks.map(v => { const x = 16 + v * 2.88; return `<line x1="${x}" x2="${x}" y1="46" y2="66" stroke="#33405a" stroke-width="3"/>${(labels || marks).includes(v) ? `<text x="${x}" y="82" text-anchor="middle" font-size="15" fill="#33405a">${v}</text>` : ''}`; }).join('')}${flag !== undefined ? `<text class="c-drop" x="${16 + flag * 2.88 + 9}" y="44" text-anchor="middle" font-size="26">🚩</text>` : ''}</svg>`;
const cBags = (n, per) => `<div class="bags">${Array.from({ length: n }, (_, i) => `<span class="bag cin" style="animation-delay:${i * .06}s">${cDots(per)}</span>`).join('')}</div>`;
const cPlates = (a, n) => `<div class="bags">${Array.from({ length: n }, () => `<span class="bag plate-c cin">${cDots(a)}</span>`).join('')}</div>`;
const cEq = (a, b, labels) => `<div class="eq5 num"><span>${a}${labels ? `<small>${labels[0]}</small>` : ''}</span><em>×</em><span>${b}${labels ? `<small>${labels[1]}</small>` : ''}</span><em>＝</em><span>${a * b}</span></div>`;
const cRope = n => `<div class="rope">${Array.from({ length: n }, (_, i) => `<span class="seg cin" style="animation-delay:${i * .08}s"><i></i><i></i></span>`).join('')}</div>`;
const cClock = (h, m) => `<div class="c-ck">${clockSvg(h, m)}</div>`;
const cNear = (a, b, on) => `<div class="near num ${on ? 'cin' : 'off'}"><b>${a}</b><i>➜</i><b class="on">${b}</b></div>`;
const cPile = n => `<div class="pile5">${cDots(n)}</div>`;
const cWood = (n, labels) => `<div class="wood">${Array.from({ length: n }, (_, i) => `<span class="cin" style="animation-delay:${i * .05}s">${labels ? `<b class="num">${i + 1}</b>` : ''}</span>`).join('')}</div>`;
const cRuler = (len, to) => `<svg class="c-svg" viewBox="0 0 320 80"><rect x="14" y="8" width="${len * 28}" height="16" rx="6" fill="#f5a524"/><rect x="14" y="30" width="292" height="30" fill="#fff0cf" stroke="#c9740c" stroke-width="2"/>${Array.from({ length: to + 1 }, (_, i) => `<line x1="${14 + i * 28}" x2="${14 + i * 28}" y1="30" y2="44" stroke="#33405a" stroke-width="2"/><text x="${14 + i * 28}" y="76" text-anchor="middle" font-size="14" fill="#33405a">${i}</text>`).join('')}</svg>`;
const cStick = n => `<div class="stick"><i class="cgrow" style="width:${n}%;--w:${n}%"></i></div>`;
const cPot = (cls, name, pct, cups, from) => `<div class="pot-w"><div class="pot ${cls}"><i class="water" style="--from:${from}%;--to:${pct}%;height:${pct}%"></i></div><b>${name}</b><small>${'🥛'.repeat(cups) || '　'}</small></div>`;
const cScale = (l, r, tilt) => `<svg class="c-svg" viewBox="0 0 320 130"><path d="M160 34V118M120 122H200" stroke="#7d5bbe" stroke-width="6" stroke-linecap="round"/><g transform="rotate(${tilt} 160 34)"><path d="M50 34H270" stroke="#7d5bbe" stroke-width="6" stroke-linecap="round"/><path d="M26 62a24 10 0 0 0 48 0zM246 62a24 10 0 0 0 48 0z" fill="#d9c9f2" stroke="#7d5bbe" stroke-width="2"/><path d="M50 34V62M270 34V62" stroke="#7d5bbe" stroke-width="2"/><text x="50" y="60" text-anchor="middle" font-size="${l.length > 2 ? 14 : 26}">${l}</text><text x="270" y="60" text-anchor="middle" font-size="${r.length > 2 ? 14 : 26}">${r}</text></g></svg>`;
const cTri = s => { const P = [[160, 14], [40, 150], [280, 150]]; return `<svg class="c-svg tall" viewBox="0 0 320 166"><polygon points="${P.join(' ')}" fill="#fff0cf" stroke="${s === 0 ? '#d6476b' : '#c9740c'}" stroke-width="${s === 0 ? 8 : 3}" stroke-linejoin="round"/>${s === 2 ? '<path d="M138 39A34 34 0 0 0 182 39M62 125A34 34 0 0 1 74 150M246 150A34 34 0 0 1 258 125" fill="none" stroke="#3b82c4" stroke-width="7"/>' : ''}${s === 1 ? P.map(p => `<circle class="c-pulse" cx="${p[0]}" cy="${p[1]}" r="9" fill="#3d9970"/>`).join('') : ''}</svg>`; };
const cRect = k => { const S2 = [[40, 20, 280, 20], [280, 20, 280, 110], [280, 110, 40, 110], [40, 110, 40, 20]], Lb = [[160, 14, 5], [298, 70, 3], [160, 130, 5], [20, 70, 3]], F = [[280, 20], [280, 110], [40, 110], [40, 20]][k - 1]; return `<svg class="c-svg tall" viewBox="0 0 320 136"><rect x="40" y="20" width="240" height="90" fill="#cfe8c9"/>${S2.map((l, i) => `<line x1="${l[0]}" y1="${l[1]}" x2="${l[2]}" y2="${l[3]}" stroke="${i < k ? '#d6476b' : '#8a93a8'}" stroke-width="${i < k ? 7 : 3}" stroke-linecap="round"/><text x="${Lb[i][0]}" y="${Lb[i][1]}" text-anchor="middle" font-size="16" fill="#33405a">${Lb[i][2]}</text>`).join('')}<text class="c-drop" x="${F[0]}" y="${F[1] + 8}" text-anchor="middle" font-size="24">🐸</text></svg>`; };
const cCloth = (r, c, on, col) => `<div class="cloth" style="grid-template-columns:repeat(${c},24px);background:${col}">${Array.from({ length: r * c }, (_, i) => `<i class="${on ? 'cin' : 'blank'}" style="animation-delay:${i * .03}s"></i>`).join('')}</div>`;
const cCal = m => { const n = { 1: 31, 2: 28, 4: 30 }[m]; return `<div class="cal"><b>${N(m)} 月</b><div class="cal-g num">${Array.from({ length: n }, (_, i) => `<i class="${i === n - 1 ? 'last' : ''}">${i + 1}</i>`).join('')}</div></div>`; };
const cptMul = q => q.kind === 'candy' && ['count', 'more', 'less', 'split'].includes(q.mode) && !q.special || q.kind === 'train' && q.mode === 'mult' || (q.kind === 'scale' && /×/.test((q.lText || '') + (q.rText || '')) && !cptLow(q));
function cptLow(q) { return /(^|×)(0|1)(×|$)/.test(q.lText || '') || /(^|×)(0|1)(×|$)/.test(q.rText || ''); }
const CONCEPTS = [
  { key: 'place', title: '百位、十位、個位', sem: '二上', scene: '235 的 2，是 2 根嗎？', terms: ['百位', '十位', '個位'], who: 'amu', quiz: ['2a-1', '2b-1'], when: q => q.kind === 'block',
    ask: '阿木收到 235 根木頭。235 裡的 2，是 2 根嗎？', tryIt: '按住手指往右拖，把積木一格一格擺好。', states: [1, 2, 3],
    pic: (s, n) => cPv([[s >= 1 ? 2 : '', cBk('h', 2)], [s >= 2 ? 3 : '', s >= 2 ? cBk('t', 3) : ''], [s >= 3 ? 5 : '', s >= 3 ? cBk('o', 5) : '']], n && ['百位', '十位', '個位']),
    note: s => ['', '左邊的 2，是 2 個百，就是 200', '中間的 3，是 3 個十，就是 30', '右邊的 5，是 5 個一，就是 5'][s],
    found: '一樣是數字，站的格子不一樣，大小就不一樣。', name: `左邊這格叫${cT('百位')}，中間叫${cT('十位')}，右邊叫${cT('個位')}。`, loop: [0, 1, 2],
    check: { q: '308 的十位是多少？', pic: () => cDigits('308'), opts: ['3', '0', '8'], a: 1, why: '十位是中間那一格。回去看看中間在哪裡。', ok: '對了！308 的十位是 0，一個十也沒有。' } },
  { key: 'qian', title: '一千', sem: '二下', scene: '9 個百，再來 1 個百？', terms: ['一千'], ban: ['1000'], who: 'amu', quiz: ['2b-1'], when: q => (q.kind === 'block' && q.v > 300) || (q.kind === 'line' && q.b >= 1000),
    ask: '木頭越來越多，已經有 8 個百了。再一直來，會變成多少？', tryIt: '往右拖，再放百積木。', states: [8, 9, 10],
    pic: (k, n) => `<div class="hunds ${k === 10 ? 'ring' : ''}">${cBk('h', k)}</div>${n && k === 10 ? cTag('一千') : ''}`,
    note: k => k === 10 ? '10 個百，可以合成一大塊！' : `${k} 個百，是 ${k}00`,
    found: '10 個百合成一大塊，比 900 又多了 100。', name: `10 個百合起來叫${cT('一千')}，寫成 1000。`, loop: [2],
    check: { q: '一箱有 100 張貼紙，10 箱一共幾張？', pic: () => `<div class="hunds">${cBk('h', 10)}</div>`, opts: ['110', '1000', '10000'], a: 1, why: '10 個百是多少？回去數一數。', ok: '對了！10 個百是 1000。' } },
  { key: 'jinwei', title: '進位', sem: '二上', scene: '小積木太多，放不下了', terms: ['進位'], who: 'amu', quiz: ['2a-2'], when: q => q.kind === 'block' && q.mode === 'trade',
    ask: '阿木有 1 條十和 12 個小積木。小積木太多了，要怎麼一眼看出有多少？', tryIt: '往右拖，把小積木圈起來換一換。', states: [0, 1, 2],
    pic: (s, n) => `${cPv([[s === 2 ? 2 : 1, cBk('t', s === 2 ? 2 : 1)], [s === 2 ? 2 : 12, s === 0 ? cBk('o', 12) : s === 1 ? `<span class="ring">${cBk('o', 10)}</span>${cBk('o', 2)}` : cBk('o', 2)]])}${n ? `<div class="c-arrow">⬅ ${cTag('進位')}</div>` : ''}`,
    note: s => ['1 條十和 12 個一，太擠了', '圈起 10 個一', '換成 1 條十：2 條十、2 個一，是 22'][s],
    found: '滿 10 個一，就換成 1 條十，放到左邊那格。', name: `滿十換到左邊一格，叫${cT('進位')}。`, loop: [0, 1, 2],
    check: { q: '6 張貼紙加 7 張，個位是 6＋7＝13。接下來呢？', pic: () => cPv([['', ''], ['13', cBk('o', 13)]]), opts: ['個位寫 3，十位多 1', '個位寫 13'], a: 0, why: '一格放得下 13 個一嗎？', ok: '對了！滿十要進位，答案是 13。' } },
  { key: 'tuiwei', title: '退位', sem: '二上', scene: '散的不夠拿，怎麼辦？', terms: ['退位'], who: 'gua', quiz: ['2a-2'], when: q => q.kind === 'frog' && q.t < q.s,
    ask: '呱呱有 32 片荷葉，3 條十和 2 片散的。要送朋友 5 片，散的不夠，怎麼辦？', tryIt: '往右拖，把 1 條十拆開。', states: [0, 1, 2],
    pic: (s, n) => `${cPv([[s ? 2 : 3, cBk('t', s ? 2 : 3)], [s === 0 ? 2 : s === 1 ? 12 : 7, s === 0 ? cBk('o', 2) : s === 1 ? `<span class="ring">${cBk('o', 10)}</span>${cBk('o', 2)}` : cBk('o', 7) + cBk('o gone', 5)]])}${n ? `<div class="c-arrow">➡ ${cTag('退位')}</div>` : ''}`,
    note: s => ['只有 2 片散的，拿不出 5 片', '拆 1 條十，變成 10 片散的，共 12 片', '拿走 5 片，還有 2 條十和 7 片，是 27'][s],
    found: '不夠拿，就拆開左邊的 1 條十，變成 10 個一。', name: `不夠拿時，從左邊一格拆 1 個十來用，叫${cT('退位')}。`, loop: [0, 1, 2],
    check: { q: '41－6，個位的 1 不夠拿 6。要怎麼辦？', pic: () => cPv([[4, cBk('t', 4)], [1, cBk('o', 1)]]), opts: ['拆 1 個十，再拿', '把 6 改成 1'], a: 0, why: '數字不能亂改。回去看看散的不夠時怎麼辦。', ok: '對了！退位以後，11－6＝5。' } },
  { key: 'line', title: '數線', sem: '二上', scene: '沙灘上怎麼找寶藏？', terms: ['數線'], who: 'pipi', quiz: [], when: q => q.kind === 'line',
    ask: '皮皮船長說：寶藏在第 70 步的地方。沙灘上什麼也沒有，怎麼找？', tryIt: '往右拖，插上木樁。', states: [0, 1, 2],
    pic: (s, n) => `${cLine(s === 0 ? [0, 100] : s === 1 ? [0, 50, 100] : [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100], s === 2 ? 70 : undefined, s === 2 ? [0, 50, 70, 100] : undefined)}${n ? cTag('數線') : ''}`,
    note: s => ['只有 0 和 100，不知道在哪裡', '中間是 50，70 還要再過去', '每 10 步一根木樁，找到 70 了！'][s],
    found: '數字照順序、一樣遠地排好，每個數都有自己的家。', name: `數字照順序、一樣遠地排在一條線上，這條線叫${cT('數線')}。`, loop: [0, 1, 2],
    check: { q: '在這條數線上，小旗子在 50 和 70 的正中間。它是多少？', pic: () => cLine([0, 50, 70, 100], 60), opts: ['55', '60', '65'], a: 1, why: '50 和 70 的正中間，兩邊要一樣遠。', ok: '對了！60 離 50 和 70 都是 10。' } },
  { key: 'cm', title: '公分', sem: '二上', scene: '同一根木條，答案怎麼不一樣？', terms: ['公分'], who: 'amu', quiz: ['2a-3', '2b-3'], when: () => false,
    ask: '阿木量同一根木條，量到 5 下；小猴子量到 8 下。怎麼會不一樣？', tryIt: '往右拖，換不同的東西量。', states: [5, 8, 6],
    pic: (k, n) => `${cWood(k, k === 6)}${n ? cTag('一小格是 1 公分') : ''}`,
    note: k => k === 5 ? '阿木的大手指：5 下' : k === 8 ? '小猴子的小手指：8 下' : '大家都用一樣的小方塊：都是 6 格',
    found: '手不一樣大，量出來就不一樣。大家用一樣長的小格，答案才一樣。', name: `這一小格的長，叫 1 ${cT('公分')}。木條有 6 格，就是 6 公分。`, loop: [2],
    check: { q: '鉛筆從 0 量到這裡，長幾公分？', pic: () => cRuler(9, 10), opts: ['8', '9', '10'], a: 1, why: '數一數鉛筆蓋住幾小格。', ok: '對了！9 小格，就是 9 公分。' } },
  { key: 'm', title: '公尺', sem: '二下', scene: '木橋好長，要量到什麼時候？', terms: ['公尺'], who: 'amu', quiz: ['2b-3'], when: () => false,
    ask: '木橋好長！用 1 公分一格一格量，要量好久。有沒有快一點的方法？', tryIt: '往右拖，把小格接起來。', states: [10, 50, 100],
    pic: (k, n) => `${cStick(k)}${n ? cTag(k === 100 ? '100 公分是 1 公尺' : '接起來⋯⋯') : ''}`,
    note: k => k === 100 ? '接了 100 格，變成一根長棍！' : `接了 ${k} 格`,
    found: '用這根長棍量，木橋一下子就量好了。', name: `100 公分接起來，叫 1 ${cT('公尺')}。`, loop: [0, 2],
    check: { q: '小船長 3 公尺，是幾公分？', pic: () => `${cStick(100)}${cStick(100)}${cStick(100)}`, opts: ['3', '30', '300'], a: 2, why: '1 根長棍有 100 公分，3 根呢？', ok: '對了！3 公尺是 300 公分。' } },
  { key: 'capacity', title: '容量', sem: '二上', scene: '瘦壺和胖壺，誰裝得多？', terms: ['容量'], who: 'song', quiz: ['2a-5'], when: () => false,
    ask: '一個瘦瘦高高的壺，一個矮矮胖胖的壺。看不出來，誰裝的水比較多？', tryIt: '往右拖，用一樣的杯子倒水。', states: [[3, 0], [3, 3], [3, 5]],
    pic: ([a, b], n) => `<div class="pots">${cPot('tall', '瘦壺', a / 3 * 100, a, 0)}${cPot('fat', '胖壺', b / 5 * 100, b, b === 5 ? 60 : 0)}</div>${n ? cTag('胖壺的容量比較大') : ''}`,
    note: ([a, b]) => b === 0 ? '瘦壺倒 3 杯，滿了' : b === 3 ? '胖壺倒 3 杯，還沒滿' : '胖壺倒 5 杯，才滿',
    found: '杯子一樣大，倒得杯數多的，裝得比較多。', name: `一個東西裝滿的水量，叫${cT('容量')}。`, loop: [0, 1, 2],
    check: { q: '大鍋子倒滿要 9 碗，小鍋子倒滿要 4 碗（碗一樣大）。哪一個容量比較大？', pic: () => '<div class="pots">🍲</div>', opts: ['大鍋子', '小鍋子'], a: 0, why: '碗一樣大，誰倒的碗數多？', ok: '對了！大鍋子的容量比較大。' } },
  { key: 'jige', title: '幾個幾', sem: '二上', scene: '糖果一顆一顆數好慢', terms: ['幾個幾'], ban: [/\d 個 \d/], who: 'bear', quiz: ['2a-7', '2a-9'], when: cptMul,
    ask: '熊奶奶要送糖：每包 5 顆，有 3 包。不想一顆一顆數，怎麼說最快？', tryIt: '往右拖，一包一包放上來。', states: [1, 2, 3],
    pic: (k, n) => `${cBags(k, 5)}${n ? cTag(`${k} 個 5`) : ''}`,
    note: k => ['', '1 包，5 顆', '2 包，5、10', '3 包，5、10、15'][k],
    found: '每包都一樣多，一包一包加就好了。', name: `每包 5 顆、有 3 包，可以說 3 個 5。這種說法叫${cT('幾個幾')}。`, loop: [0, 1, 2],
    check: { q: '每盤 4 個包子，有 6 盤。要怎麼說？', pic: () => cBags(6, 4), opts: ['6 個 4', '4 個 6', '10 個'], a: 0, why: '每盤幾個？有幾盤？回去看看怎麼一包一包放。', ok: '對了！6 盤，每盤 4 個，是 6 個 4。' } },
  { key: 'mult', title: '乘法和乘號', sem: '二上', scene: '加法寫得好長！', terms: ['乘法', '乘號'], ban: ['×'], who: 'bear', quiz: ['2a-7', '2a-9'], when: cptMul,
    ask: '5＋5＋5＋5＋5＋5＋5＋5，寫得好長！有沒有短一點的寫法？', tryIt: '往右拖，多放幾包看看。', states: [2, 4, 8],
    pic: (k, n) => n ? `${cBags(k, 5)}${cEq(5, k, ['每份量', '份數'])}<div class="c-arrow">${cTag('乘法')} ${cTag('× 是乘號')}</div>` : `${cBags(k, 5)}<div class="chain num">${Array(k).fill(5).join('＋')}</div>`,
    note: k => `每份 5 顆，有 ${k} 份`,
    found: '每次都加 5。只要記住「每份幾顆」和「有幾份」就夠了。', name: `每份 5 顆、有 8 份，寫成 5×8。這種算法叫${cT('乘法')}，× 叫${cT('乘號')}。先寫每份量，再寫份數。`, loop: [0, 1, 2],
    check: { q: '每盤 4 個包子，有 3 盤。乘法算式是哪一個？', pic: () => cBags(3, 4), opts: ['4×3', '3×4', '4＋3'], a: 0, why: '先寫每份量，再寫份數。每盤幾個？有幾盤？', ok: '對了！每份量×份數，4×3＝12 個。' } },
  { key: 'bei', title: '倍', sem: '二上', scene: '繩子要接幾段才夠？', terms: ['倍'], who: 'amu', quiz: ['2a-9'], when: q => q.kind === 'candy' && (q.mode === 'more' || q.mode === 'less'),
    ask: '一段繩子有 2 格長。木橋要接成 3 段那麼長，要怎麼說才清楚？', tryIt: '往右拖，一段一段接起來。', states: [1, 2, 3],
    pic: (k, n) => `${cRope(k)}${n ? cTag(k === 1 ? '2 格' : `${k * 2} 格是 2 格的 ${k} 倍`) : ''}`,
    note: k => `接 ${k} 段，是 ${k * 2} 格`,
    found: '6 格，就是把 2 格重複 3 次。', name: `6 格是 2 格的 3 ${cT('倍')}，寫成 2×3＝6。`, loop: [0, 1, 2],
    check: { q: '一盒有 4 顆糖。媽媽的糖是它的 2 倍，有幾顆？', pic: () => cBags(1, 4), opts: ['4', '6', '8'], a: 2, why: '2 倍就是 2 個 4。', ok: '對了！4×2＝8 顆。' } },
  { key: 'zero', title: '0 和 1 的乘法', sem: '二下', scene: '盤子上都沒有糖', terms: ['1×3', '0×3'], who: 'bear', quiz: ['2b-5'], when: q => (q.kind === 'candy' && q.special) || (q.kind === 'scale' && cptLow(q)),
    ask: '3 個盤子，熊奶奶每盤放的糖越來越少。如果每盤都沒有糖呢？', tryIt: '往右拖，每盤少放一點。', states: [2, 1, 0],
    pic: (a, n) => `${cPlates(a, 3)}${n ? cTag(`${a}×3＝${a * 3}`) : ''}`,
    note: a => `每盤 ${a} 顆，3 盤，共 ${a * 3} 顆`,
    found: '每盤都沒有糖，盤子再多，也是 0 顆。', name: `每盤 1 顆，寫成 ${cT('1×3')}＝3；每盤 0 顆，寫成 ${cT('0×3')}＝0。`, loop: [1, 2],
    check: { q: '7 個籃子都是空的，每籃 0 顆蘋果。0×7 是多少？', pic: () => cPlates(0, 7), opts: ['0', '7', '70'], a: 0, why: '籃子裡都沒有蘋果，有幾顆？', ok: '對了！0×7＝0。' } },
  { key: 'clock', title: '時針和分針', sem: '二上', scene: '兩根針，要先看哪一根？', terms: ['時針', '分針'], who: 'owl', quiz: ['2a-8'], when: q => q.kind === 'clock',
    ask: '大鐘有長短兩根針。阿鐘問：現在幾時幾分，兩根針要怎麼看？', tryIt: '往右拖，撥動長針。', states: [0, 5, 10],
    pic: (m, n) => `${cClock(3, m)}${n ? `<div class="c-arrow">${cTag('短針是時針')} ${cTag('長針是分針')}</div>` : ''}`,
    note: m => m === 0 ? '長針指 12，短針指 3：3 時整' : `長針走 ${m / 5} 大格，是 ${m} 小格：3 時 ${m} 分`,
    found: '短針告訴我們幾時，長針走 1 小格就過 1 分。', name: `短針叫${cT('時針')}，看幾時；長針叫${cT('分針')}，看幾分。`, loop: [0, 1, 2],
    check: { q: '時針剛過 7，分針指在 4。現在是幾時幾分？', pic: () => cClock(7, 20), opts: ['7 時 20 分', '4 時 7 分', '7 時 4 分'], a: 0, why: '分針走 1 大格是 5 小格。走了幾大格？', ok: '對了！4 大格是 20 小格，7 時 20 分。' } },
  { key: 'hour', title: '1 小時', sem: '二上', scene: '長針走一圈，過了多久？', terms: ['1 小時', '60 分鐘'], who: 'owl', quiz: ['2a-8'], when: q => q.kind === 'clock' && q.mode === 'after',
    ask: '阿鐘 2 時開始修鐘，修到長針又回到 12。過了多久？', tryIt: '往右拖，讓長針走一圈。', states: [15, 30, 60],
    pic: (m, n) => `${cClock(2 + Math.floor(m / 60), m % 60)}${n ? cTag('1 小時＝60 分鐘') : ''}`,
    note: m => m === 60 ? '長針走完一圈，60 小格；短針走了 1 大格' : `長針走了 ${m} 小格`,
    found: '長針走完一圈，短針才走 1 大格，從 2 走到 3。', name: `長針走一圈是 ${cT('60 分鐘')}，也叫 ${cT('1 小時')}。`, loop: [0, 1, 2],
    check: { q: '看故事書看了 1 小時，是幾分鐘？', pic: () => cClock(4, 0), opts: ['30', '60', '100'], a: 1, why: '長針走一圈有幾小格？', ok: '對了！1 小時是 60 分鐘。' } },
  { key: 'est', title: '估算', sem: '二下', scene: '100 元夠買嗎？', terms: ['估算', '大約'], who: 'monkey', quiz: ['2b-2'], when: q => (q.kind === 'scale' && q.mode === 'near') || (q.kind === 'shop' && q.mode === 'enough'),
    ask: '猴子老闆的書 49 元、球 31 元。你帶了 100 元，不用算完，夠不夠？', tryIt: '往右拖，把數想成好算的數。', states: [0, 1, 2],
    pic: (s, n) => `${cNear(49, 50, true)}${cNear(31, 30, s >= 1)}<div class="near num ${s >= 2 ? 'cin' : 'off'}"><b>50＋30</b><i>➜</i><b class="on">80</b></div>${n ? `<div class="c-arrow">${cTag('49 大約是 50')} ${cTag('這樣算叫估算')}</div>` : ''}`,
    note: s => ['49 很靠近 50', '31 很靠近 30', '想成 50＋30＝80，比 100 少，夠了！'][s],
    found: '不用算到最後，想成好算的數，就知道夠不夠。', name: `49 ${cT('大約')}是 50。想成好算的數來算，叫${cT('估算')}。`, loop: [0, 1, 2],
    check: { q: '鞋子 198 元、帽子 102 元。估算一下，大約要多少元？', pic: () => `${cNear(198, '？', true)}${cNear(102, '？', true)}`, opts: ['200', '300', '400'], a: 1, why: '198 靠近幾百？102 靠近幾百？', ok: '對了！想成 200＋100，大約 300 元。' } },
  { key: 'pack', title: '分裝', sem: '二下', scene: '12 顆糖可以裝幾盒？', terms: ['分裝'], who: 'bear', quiz: ['2b-8'], when: q => q.kind === 'candy' && q.mode === 'pack',
    ask: '熊奶奶有 12 顆糖，每盒裝 3 顆。可以裝幾盒？', tryIt: '往右拖，一盒一盒裝。', states: [1, 2, 4],
    pic: (k, n) => `${cPile(12 - 3 * k)}${cBags(k, 3)}${n ? cTag('每 3 顆裝一盒，這是分裝') : ''}`,
    note: k => k === 4 ? '裝了 4 盒，剛好裝完！' : `裝了 ${k} 盒，還剩 ${12 - 3 * k} 顆`,
    found: '每次拿 3 顆裝 1 盒，裝了 4 盒，一顆也沒剩。', name: `每幾個裝成一份，看可以裝幾份，叫${cT('分裝')}。`, loop: [0, 1, 2],
    check: { q: '15 個包子，每盤放 5 個，可以放幾盤？', pic: () => cPile(15), opts: ['3', '5', '10'], a: 0, why: '5 個 5 個拿，可以拿幾次？', ok: '對了！3 盤。5×3＝15。' } },
  { key: 'share', title: '平分', sem: '二下', scene: '怎麼分才公平？', terms: ['平分'], who: 'bear', quiz: ['2b-8', '2b-9'], when: q => (q.kind === 'candy' && ['share', 'fair', 'frac'].includes(q.mode)) || (q.kind === 'scale' && q.frac),
    ask: '12 顆糖要給 3 個小朋友。要大家一樣多，怎麼發才公平？', tryIt: '往右拖，一人一顆輪流發。', states: [1, 2, 4],
    pic: (k, n) => `${cPile(12 - 3 * k)}<div class="bags">${Array.from({ length: 3 }, () => `<span class="kid"><em>🙂</em><span class="bag">${cDots(k)}</span></span>`).join('')}</div>${n ? cTag('每人一樣多，這是平分') : ''}`,
    note: k => k === 4 ? '發完了！每人都是 4 顆' : `每人 ${k} 顆，還剩 ${12 - 3 * k} 顆`,
    found: '一輪一輪發到完，每個人都一樣多。', name: `分得一樣多，叫${cT('平分')}。`, loop: [0, 1, 2],
    check: { q: '10 片餅乾給 2 個人。哪一種是平分？', pic: () => cPile(10), opts: ['5 片和 5 片', '6 片和 4 片', '9 片和 1 片'], a: 0, why: '平分要每個人一樣多。', ok: '對了！都是 5 片，一樣多。' } },
  { key: 'frac', title: '幾分之一', sem: '二下', scene: '一塊蛋糕捲要怎麼說？', terms: ['三分之一', '幾分之一'], ban: ['分之'], who: 'bear', quiz: ['2b-9'], when: q => (q.kind === 'candy' && (q.mode === 'frac' || q.mode === 'fair')) || (q.kind === 'scale' && q.frac),
    ask: '一條蛋糕捲切給大家，要切得一樣長。你吃到的紅色這一段，要怎麼說？', tryIt: '往右拖，切成不同段數。', states: [2, 3, 4],
    pic: (k, n) => `<div class="c-bar">${barSvg(Array(k).fill(1), true)}</div>${n ? cTag(Logic.fracWord(k)) : ''}`,
    note: k => `切成 ${k} 段一樣長，紅色是其中 1 段`,
    found: '切的段數越多，紅色這一段就越小。', name: `平分成 3 份，1 份是${cT('三分之一')}。平分成幾份，1 份就是${cT('幾分之一')}。`, loop: [0, 1, 2],
    check: { q: '披薩平分成 4 片，吃了 1 片。吃了多少個披薩？', pic: () => `<div class="c-bar">${cakeSvg(4)}</div>`, opts: ['二分之一', '四分之一', '一分之四'], a: 1, why: '平分成幾份？回去數一數。', ok: '對了！四分之一個。' } },
  { key: 'calendar', title: '大月和小月', sem: '二下', scene: '每個月都一樣長嗎？', terms: ['大月', '小月'], who: 'owl', quiz: ['2b-4'], when: () => false,
    ask: '果果每天存 1 元。每個月都會存一樣多嗎？', tryIt: '往右拖，翻翻月曆。', states: [1, 4, 2],
    pic: (m, n) => `${cCal(m)}${n ? cTag(m === 1 ? '31 天，是大月' : '比 31 天少，是小月') : ''}`,
    note: m => `${m} 月有 ${{ 1: 31, 4: 30, 2: 28 }[m]} 天，存 ${{ 1: 31, 4: 30, 2: 28 }[m]} 元`,
    found: '每個月的天數不一樣！有的 31 天，有的比較少。', name: `有 31 天的月叫${cT('大月')}；比 31 天少的月叫${cT('小月')}。`, loop: [0, 1, 2],
    check: { q: '7 月有 31 天。它是大月還是小月？', pic: () => '<div class="pots">📅</div>', opts: ['大月', '小月'], a: 0, why: '數一數有沒有 31 天。', ok: '對了！7 月是大月。' } },
  { key: 'weight', title: '重量', sem: '二下', scene: '蘋果和橘子，誰比較重？', terms: ['重量'], who: 'mole', quiz: ['2b-6'], when: () => false,
    ask: '蘋果和橘子看起來差不多大。拿在手上比不出來，誰比較重？', tryIt: '往右拖，用天平比比看。', states: [0, 1, 2],
    pic: (s, n) => `${s === 0 ? cScale('🍎', '', -8) : s === 1 ? cScale('🍎', '🍊', -5) : `${cScale('🍎', '●●●●●', 0)}<div class="near num">🍊 ＝ ●●●</div>`}${n ? cTag('東西有多重，就是重量') : ''}`,
    note: s => ['放上蘋果，那一邊沉下去', '再放上橘子，蘋果那邊還是比較低', '用彈珠比：蘋果 5 顆，橘子 3 顆'][s],
    found: '沉下去的比較重；用彈珠比，還能看出差多少。', name: `東西有多重，就是它的${cT('重量')}。`, loop: [0, 1, 2],
    check: { q: '1 本書和 6 個積木一樣重，1 個杯子和 4 個積木一樣重。誰的重量比較重？', pic: () => cScale('📕', '☕', -6), opts: ['書', '杯子', '一樣'], a: 0, why: '積木一樣大，誰要用的積木多？', ok: '對了！書的重量比較重。' } },
  { key: 'shape', title: '邊、頂點、角', sem: '二上', scene: '怎麼說清楚這個形狀？', terms: ['邊', '頂點', '角'], who: 'owl', quiz: ['2a-10', '2b-10'], when: () => false,
    ask: '阿鐘想在電話裡告訴朋友這個招牌的樣子。只說「尖尖的」，對方聽得懂嗎？', tryIt: '往右拖，一樣一樣找出來。', states: [0, 1, 2],
    pic: (s, n) => `${cTri(s)}${n ? cTag(['紅色的線是邊', '綠色的點是頂點', '藍色的地方是角'][s]) : ''}`,
    note: s => ['直直的線，有 3 條', '尖尖的點，有 3 個', '兩條線張開的地方，有 3 個'][s],
    found: '線、尖尖的點、張開的地方，都數得出來。', name: `直直的線叫${cT('邊')}；尖尖的點叫${cT('頂點')}；兩條邊張開的地方叫${cT('角')}。`, loop: [0, 1, 2],
    check: { q: '方方的招牌，有幾個頂點？', pic: () => '<svg class="c-svg tall" viewBox="0 0 320 130"><rect x="90" y="15" width="140" height="100" fill="#fff0cf" stroke="#c9740c" stroke-width="4"/></svg>', opts: ['3', '4', '5'], a: 1, why: '頂點是尖尖的點。一個一個數。', ok: '對了！有 4 個頂點。' } },
  { key: 'perim', title: '周長', sem: '二上', scene: '繞花圃一圈有多遠？', terms: ['周長'], who: 'gua', quiz: ['2a-10'], when: () => false,
    ask: '呱呱要繞著花圃跳一圈。一圈有多遠？', tryIt: '往右拖，帶呱呱沿著花圃走。', states: [1, 2, 4],
    pic: (k, n) => `${cRect(k)}<div class="chain num">${[5, 3, 5, 3].slice(0, k).join('＋')}＝${[5, 8, 13, 16][k - 1]}</div>${n ? cTag('繞一圈的長是周長') : ''}`,
    note: k => k === 4 ? '回到起點了！一圈是 16' : `走了 ${k} 段，是 ${[5, 8, 13, 16][k - 1]}`,
    found: '把每一段的長都加起來，就是一圈的長。', name: `繞圖形一圈的長，叫${cT('周長')}。`, loop: [0, 1, 2],
    check: { q: '正方形每個邊 4 公分，周長是幾公分？', pic: () => '<svg class="c-svg tall" viewBox="0 0 320 130"><rect x="110" y="15" width="100" height="100" fill="#cfe8c9" stroke="#3d9970" stroke-width="4"/><text x="160" y="72" text-anchor="middle" font-size="20">4</text></svg>', opts: ['8', '12', '16'], a: 2, why: '正方形有幾個邊？都要加起來。', ok: '對了！4＋4＋4＋4＝16 公分。' } },
  { key: 'area', title: '面積', sem: '二下', scene: '長桌布和方桌布，誰比較大？', terms: ['面積'], who: 'song', quiz: ['2b-10'], when: () => false,
    ask: '一塊桌布長長的，一塊方方的。疊起來也看不出來，誰比較大？', tryIt: '往右拖，用一樣大的格子蓋滿。', states: [0, 1, 2],
    pic: (s, n) => `<div class="cloths">${cCloth(2, 6, s >= 1, '#f4c6d0')}${cCloth(3, 3, s >= 2, '#bcd8f2')}</div>${n ? cTag('12 格的面積比 9 格大') : ''}`,
    note: s => ['形狀不一樣，比不出來', '長桌布蓋了 12 格', '方桌布蓋了 9 格'][s],
    found: '格子一樣大，蓋的格子多的，就比較大。', name: `一個面有多大，就是它的${cT('面積')}。`, loop: [0, 1, 2],
    check: { q: '書本蓋滿 15 格，便當盒蓋滿 12 格（格子一樣大）。誰的面積比較大？', pic: () => '<div class="pots">📕 🍱</div>', opts: ['書本', '便當盒'], a: 0, why: '誰蓋的格子多？', ok: '對了！書本的面積比較大。' } },
];
const seenCpt = () => S.seenCpt || (S.seenCpt = {});
const cptOf = q => CONCEPTS.filter(c => c.when(q));
let cptTimer = null;
const cptStop = () => { if (cptTimer) { clearInterval(cptTimer); cptTimer = null; } };
const clamp2 = (v, a, b) => Math.max(a, Math.min(b, v));
function runConcept(key, then, doneLabel) {
  const C = CONCEPTS.find(c => c.key === key);
  const done = () => { cptStop(); seenCpt()[key] = 1; save(); then(); };
  function shell(step, prompt, body) {
    cptStop(); window.scrollTo(0, 0);
    $app.innerHTML = `<div class="top"><button class="icon-btn" id="home" aria-label="回小鎮">⌂</button><div class="dots">${[0, 1, 2, 3].map(i => `<i class="${i < step ? 'g2' : i === step ? 'now' : ''}"></i>`).join('')}</div><span class="sem">小故事</span><button class="icon-btn" id="say" aria-label="唸出來">🔊</button></div>
      <div class="say-row">${artImg(C.who, 'say-who')}<div class="prompt" id="prompt">${prompt}</div></div>
      <div class="stage cpt-stage" id="stage">${body}</div><div class="msg" id="msg"></div><div class="actions" id="actions"></div><button class="skip5" id="skipc">跳過</button>`;
    document.getElementById('home').onclick = () => { cptStop(); R = null; go(''); };
    document.getElementById('say').onclick = () => speak(plainText(document.getElementById('prompt')));
    document.getElementById('skipc').onclick = done;
  }
  function op() { // 動手試，全程不出現新詞
    shell(1, `${nums(C.ask)}<br><small>${nums(C.tryIt)}</small>`, `<div class="cpw" id="cpw"><div class="cp" id="cp"></div><div class="c2note" id="ct"></div><div class="c2track">${C.states.map(() => '<u></u>').join('')}<b class="knob nudge" id="knob">👆</b></div></div>`);
    const seen = new Set(); let i = -1, over = false;
    const btns = () => {
      if (over) actionBtn('nm', '這叫什麼？').onclick = named;
      else actionBtn('tn', '試下一個').onclick = () => show((i + 1) % C.states.length);
    };
    const show = k => {
      i = k; setEl('cp', C.pic(C.states[k], false)); setEl('ct', nums(C.note(C.states[k])));
      const kn = document.getElementById('knob'); kn.style.left = k / (C.states.length - 1) * 100 + '%';
      seen.add(k); if (seen.size > 1) { kn.classList.remove('nudge'); sfx.hop(); }
      if (seen.size === C.states.length && !over) { over = true; setMsg(nums(C.found), 'good'); sfx.ok(); reveal('#actions'); }
      btns();
    };
    show(0);
    dragOn(document.getElementById('cpw'), x => { const k = clamp2(Math.round(x * (C.states.length - 1)), 0, C.states.length - 1); if (k !== i) { for (let j = i + Math.sign(k - i); j !== k; j += Math.sign(k - i)) seen.add(j); show(k); } }, 'self');
  }
  function named() { // 命名，把新詞貼回剛才的圖
    shell(2, nums(C.name), '<div class="cp" id="cp"></div>');
    let k = 0; const paint = () => { if (document.getElementById('cp')) setEl('cp', C.pic(C.states[C.loop[k % C.loop.length]], true)); else cptStop(); };
    paint(); if (C.loop.length > 1) cptTimer = setInterval(() => { k++; paint(); }, 1500);
    actionBtn('ck', '換一題試試').onclick = check; sfx.good(); reveal('#actions');
  }
  function check() { // 換情境用新詞答；答錯回到操作
    const K = C.check; shell(3, nums(K.q), `<div class="cp" id="cp">${K.pic()}</div>`);
    document.getElementById('actions').innerHTML = `<div class="choices col">${K.opts.map((o, i) => `<button class="choice" data-c2="${i}">${nums(o)}</button>`).join('')}</div>`;
    document.querySelectorAll('[data-c2]').forEach(b => b.onclick = () => {
      if (+b.dataset.c2 === K.a) { sfx.good(); setMsg(nums(K.ok), 'good'); seenCpt()[key] = 1; save(); document.getElementById('skipc').hidden = true; actionBtn('fin', doneLabel || '開始玩').onclick = done; reveal('#actions'); return; }
      sfx.retry(); setMsg(nums(K.why), 'hint'); actionBtn('bk', '回去再動手看看').onclick = op; reveal('#actions');
    });
  }
  op();
}
function conceptThen(q, then) { // 第一次碰到這個題型自動播；看過就不再播
  const L = cptOf(q).filter(c => !seenCpt()[c.key]);
  if (!L.length) return then();
  runConcept(L[0].key, () => conceptThen(q, then), L.length > 1 ? '下一個小故事' : '開始玩');
}
function cptChain(keys, then) { // 測驗單元用：一個接一個
  const L = keys.filter(k => !seenCpt()[k]);
  if (!L.length) return then();
  runConcept(L[0], () => cptChain(keys, then), L.length > 1 ? '下一個小故事' : '開始作答');
}
function viewConcepts(list, back) { // 重看；沒看過的只露情境，不露新詞
  window.scrollTo(0, 0);
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="bkc" aria-label="回去">⌂</button><h2 class="page-h">新概念小故事</h2></div><p class="tag">想看哪一個？</p><div class="clist">${list.map(c => { const s = seenCpt()[c.key]; return `<button class="c-item" data-rc="${c.key}"><span><b>${nums(s ? c.title : c.scene)}</b><small>${s ? nums(c.scene) : '還沒看過'}</small></span><em class="sem">${c.sem}</em>${s ? '<i class="c-ok">✓</i>' : ''}</button>`; }).join('')}</div>`;
  document.getElementById('bkc').onclick = back;
  document.querySelectorAll('[data-rc]').forEach(b => b.onclick = () => runConcept(b.dataset.rc, () => viewConcepts(list, back), '回列表'));
}
function cptOpen(list) { // 從題目頁打開：題目留著，看完回來接著做
  const kept = [...$app.childNodes], y = window.scrollY, back = () => { $app.replaceChildren(...kept); window.scrollTo(0, y); };
  if (list.length === 1) return runConcept(list[0].key, back, '回到題目');
  viewConcepts(list, back);
}
function cptBtn(list) {
  const top = document.querySelector('#app .top'); if (!top || !list.length || document.getElementById('cptb')) return;
  const b = document.createElement('button'); b.className = 'icon-btn'; b.id = 'cptb'; b.setAttribute('aria-label', '看小故事'); b.textContent = '💡';
  b.onclick = () => cptOpen(list);
  const say = document.getElementById('say'); if (say) top.insertBefore(b, say); else top.appendChild(b);
}
/* 單元測驗：題庫段不動，從外面包。第一次進這個單元的測驗先播對應的小故事 */
const cptQuiz = (b, U) => CONCEPTS.filter(c => c.quiz.includes(`${b.id}-${U.u}`));
let cptQuizList = null;
const vqu0 = viewQuizUnits, rq0 = runQuiz;
viewQuizUnits = function (b) {
  cptQuizList = null; vqu0(b);
  document.querySelectorAll('.q-unit').forEach((el, i) => {
    const L = cptQuiz(b, b.units[i]); if (!L.length) return;
    const x = document.createElement('button'); x.className = 'c-chip'; x.textContent = '💡 小故事';
    x.onclick = () => viewConcepts(L, () => viewQuizUnits(b));
    el.appendChild(x);
  });
};
runQuiz = function (b, U, lv, only) {
  const L = cptQuiz(b, U);
  cptChain(L.map(c => c.key), () => { cptQuizList = L; rq0(b, U, lv, only); });
};
new MutationObserver(() => { if (cptQuizList && document.getElementById('qback')) cptBtn(cptQuizList); }).observe($app, { childList: true });
/*CPT_END*/
/* ---------- 首頁 ---------- */
let titleShown = false;
function viewTitle() {
  titleShown = true;
  const flies = Array.from({ length: 12 }, (_, i) => `<i style="left:${8 + (i * 37) % 86}%;top:${22 + (i * 53) % 62}%;animation-delay:${(i * .6) % 4}s"></i>`).join('');
  document.body.classList.add('in-cine');
  $app.innerHTML = `<div class="title" style="${bgStyle(S.bossDone ? 'town_clear' : 'town_fog')}">
    ${S.bossDone ? '' : '<div class="drift d1"></div><div class="drift d2"></div>'}
    <div class="flies">${flies}</div>
    <div class="title-top"><p class="kicker">大霧救援行動</p><h1 class="logo">數感小鎮</h1></div>
    ${artImg('liang_cheer', 'title-hero')}
    <div class="title-bottom">
      <button class="btn big" id="start">${S.opened ? '繼續冒險' : '開始冒險'}</button>
      <p class="title-note">${S.opened ? `隊長，你已經收集 ${S.stars} 顆星星的光` : '小鎮需要一位救援隊長'}</p>
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
  const keys = Object.keys(GAMES);
  const saved = k => (S.prog[k] || 0) >= ROUNDS_TO_SAVE;
  const allSaved = keys.every(saved), nSaved = keys.filter(saved).length;
  const nextKey = keys.find(k => !saved(k) && S.prog[k]) || keys.find(k => !saved(k));
  const line = S.bossDone ? '大霧散了！小鎮天天都在慶祝。' : allSaved ? '線索全都指向後山的山洞⋯⋯走吧！' : nSaved === 0 && !S.prog[nextKey] ? `隊長，先去救${STORY[nextKey].whoName}！` : `下一站：${STORY[nextKey].place}，${STORY[nextKey].mission}！`;
  const ROW = 150, rows = keys.length + 1, pts = [];
  for (let i = 0; i < rows; i++) pts.push([i % 2 ? 70 : 30, ROW * i + 70]);
  const pathD = pts.map((q, i) => i === 0 ? `M${q[0]} ${q[1]}` : `C${pts[i - 1][0]} ${q[1] - 70} ${q[0]} ${pts[i - 1][1] + 70} ${q[0]} ${q[1]}`).join('');
  const stop = (k, i) => {
    const pr = Math.min(S.prog[k] || 0, ROUNDS_TO_SAVE), st = STORY[k], done = pr >= ROUNDS_TO_SAVE, now = k === nextKey && !done;
    const pips = Array.from({ length: ROUNDS_TO_SAVE }, (_, n) => `<i class="${n < pr ? 'on' : ''}"></i>`).join('');
    return `<button class="stop ${i % 2 ? 'right' : 'left'} ${done ? 'done' : ''} ${now ? 'now' : ''}" data-g="${k}" style="top:${ROW * i}px">
      <span class="medal" style="${bgStyle(st.bg)}"><span class="fog f${pr}"></span>${artImg(st.who, 'medal-who')}${done ? '<span class="badge">✓</span>' : ''}</span>
      <span class="plate"><b>${GAMES[k].name}</b><em class="sem">${SEM[k]}</em><span class="lvl">${pips}</span></span>
      ${now ? artImg('liang', 'guide') : ''}
    </button>`;
  };
  $app.innerHTML = `
    <div class="map-bg"><div class="m1" style="${bgStyle('town_fog')}"></div><div class="m2" style="${bgStyle('town_clear')};opacity:${S.bossDone ? 1 : nSaved / keys.length * .85}"></div><div class="shade"></div></div>
    <header class="map-head">
      <div class="map-title"><h1 class="logo small">數感小鎮</h1><div class="star-count">⭐ ${N(S.stars)}</div></div>
      <div class="hero-say">${artImg(S.bossDone ? 'liang_cheer' : 'liang', 'hero-liang')}<span>${line}</span></div>
    </header>
    <button class="quiz-entry" id="quiz"><span>📝</span><b>單元測驗</b><small>基礎・進階・益智</small></button>
    <div class="map-trail" style="height:${ROW * rows + 8}px">
      <svg viewBox="0 0 100 ${ROW * rows}" preserveAspectRatio="none" aria-hidden="true"><path d="${pathD}" fill="none" stroke="#fff6e3" stroke-width="5" stroke-dasharray="3 11" stroke-linecap="round" vector-effect="non-scaling-stroke" opacity=".9"/></svg>
      ${keys.map(stop).join('')}
      <button class="stop ${keys.length % 2 ? 'right' : 'left'} cave ${allSaved && !S.bossDone ? 'now' : ''}" data-g="boss" ${allSaved ? '' : 'disabled'} style="top:${ROW * keys.length}px">
        <span class="medal" style="${bgStyle(BOSS.bg)}"><span class="fog ${S.bossDone ? 'f3' : allSaved ? 'f1' : 'f0'}"></span>${allSaved ? artImg(S.bossDone ? 'mimi_happy' : 'mimi', 'medal-who') : '<span class="lock">？</span>'}</span>
        <span class="plate"><b>${S.bossDone ? '和迷迷玩' : '後山的山洞'}</b><small>${allSaved ? (S.bossDone ? '再挑戰一次' : '霧是從這裡來的') : `先幫完大家（${nSaved}/${keys.length}）`}</small></span>
      </button>
    </div>
    <nav class="dock">
      <button id="daily" class="${S.stamps[today()] ? 'stamped' : 'hot'}"><b>${S.stamps[today()] ? '✔' : '★'}</b>今日任務<small>${Object.keys(S.stamps).length} 個章</small></button>
      <button id="clues"><b>🔍</b>線索本<small>${nSaved} / ${keys.length}</small></button>
      <button id="practice"><b>✏️</b>練習場<small>自己選</small></button>
    </nav>`;
  document.querySelectorAll('[data-g]').forEach(b => b.onclick = () => enter(b.dataset.g));
  document.getElementById('daily').onclick = () => startRound('daily');
  document.getElementById('practice').onclick = viewPractice;
  document.getElementById('quiz').onclick = viewQuizBooks;
  document.getElementById('clues').onclick = viewClues;
}

/* ---------- 家長頁 ---------- */
const UNITS = ['數到 300', '二位數的加減', '幾公分', '加減的關係與應用', '容量', '兩步驟的加減', '2、5、4、8 的乘法', '幾時幾分', '3、6、7、9 的乘法', '平面圖形',
  '數到 1000', '加加減減', '幾公尺', '年月日', '0、1、10 的乘法', '重量', '兩步驟的計算', '分東西', '單位分數', '面的大小與立體'];
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
    <h2>單元</h2><p>二上、二下所有單元都已開放，孩子可以自由選地點。每個地點和每一題都有標示是二上或二下。</p>
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
    if (confirm('確定清除所有星星和紀錄？')) { S.stars = 0; S.rec = {}; S.log = []; S.prog = {}; S.opened = false; S.bossDone = false; S.bossSeen = false; S.s2Seen = false; S.stamps = {}; S.fast = {}; S.quiz = {}; S.seenCpt = {}; save(); viewParent(); }
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
