const ZY_CHAR = {}, ZY_PHRASE = []; // 五年級不加注音
// 數感小鎮：畫面與互動
const $app = document.getElementById('app');
const ROUND = 6;
const GAMES = {
  line: { name: '氣溫觀測站', tip: '折線圖', sem: '五上', need: 0 },
  factor: { name: '地磚排列場', tip: '因數、倍數', sem: '五上', need: 0 },
  poly: { name: '圍牆設計處', tip: '多邊形', sem: '五上', need: 0 },
  ext: { name: '披薩切分室', tip: '擴分、約分、通分', sem: '五上', need: 0 },
  sym: { name: '對摺設計坊', tip: '線對稱', sem: '五上', need: 0 },
  uadd: { name: '燃料調配站', tip: '異分母加減', sem: '五上', need: 0 },
  mix: { name: '物資採購處', tip: '併式、平均、分配律', sem: '五上', need: 0 },
  para: { name: '土地裁切場', tip: '平行四邊形、三角形、梯形', sem: '五上', need: 0 },
  ttime: { name: '工班排班室', tip: '時間的乘除', sem: '五上', need: 0 },
  cuboid: { name: '貨櫃組裝場', tip: '正方體、長方體', sem: '五上', need: 0 },
  fcalc: { name: '農場分糧處', tip: '分數的計算', sem: '五下', need: 0 },
  decimal: { name: '宇宙定位塔', tip: '十進位結構', sem: '五下', need: 0 },
  dmul: { name: '比例模型室', tip: '小數的乘法', sem: '五下', need: 0 },
  sector: { name: '圓形花園', tip: '扇形', sem: '五下', need: 0 },
  volume: { name: '大型倉庫', tip: '體積', sem: '五下', need: 0 },
  ddiv: { name: '能源分配站', tip: '小數除法', sem: '五下', need: 0 },
  bigunit: { name: '城市規劃局', tip: '大單位', sem: '五下', need: 0 },
  ratio: { name: '民調中心', tip: '比率、百分率', sem: '五下', need: 0 },
  capacity: { name: '水資源站', tip: '容積、容量', sem: '五下', need: 0 },
  solid: { name: '建築模型館', tip: '柱體、錐體、球體', sem: '五下', need: 0 },
};
const availKeys = () => Object.keys(GAMES).filter(k => VIEWS[k]); // 工坊寫好才開放
const ROUNDS_TO_SAVE = 3; // 每個地方玩幾回合就把居民救回來
const BOSS_ORDER = ['factor', 'ext', 'uadd', 'mix', 'para', 'ttime'];
const ART = ['liang', 'liang_cheer', 'liang_think', 'mimi', 'mimi_happy', 'wanwan', 'piece', 'chest', 'sky_dark', 'sky_bright', 'finale', 'seal', 'turtle', 'octopus', 'crab', 'goat', 'otter', 'bee', 'rabbit', 'fox', 'sheep', 'pelican', 'raccoon', 'isl_line', 'isl_factor', 'isl_poly', 'isl_ext', 'isl_sym', 'isl_uadd', 'isl_mix', 'isl_para', 'isl_ttime', 'isl_cuboid', 'isl_fcalc', 'isl_decimal', 'isl_dmul', 'isl_sector', 'isl_volume', 'isl_ddiv', 'isl_bigunit', 'isl_ratio', 'isl_capacity', 'isl_solid'];
const HAS = {}; // 圖還沒收齊時，畫面照樣能玩
const artUrl = n => `assets/${n}.webp`;
const artImg = (n, cls) => HAS[n] ? `<img class="${cls || ''}" src="${artUrl(n)}" alt="">` : '';
const bgStyle = n => HAS[n] ? `background-image:url(${artUrl(n)})` : '';
function preloadArt() {
  return Promise.all(ART.map(n => new Promise(ok => { const i = new Image(); i.onload = () => { HAS[n] = true; ok(); }; i.onerror = () => ok(); i.src = artUrl(n); })));
}

/* ---------- 存檔 ---------- */
const SAVE_KEY = 'shugan5-v1';
const CITY = 1000000; // 目標 1 平方公里
function load() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) return s; } catch (e) {}
  return null;
}
const PIECE_KEYS = ['line', 'factor', 'poly', 'ext', 'sym', 'uadd', 'mix', 'para', 'ttime', 'cuboid']; // 五上十棟建築，蓋好才能開城
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
function semOf(q) { // 每題標五上或五下
  return q ? GAMES[q.kind].sem : '';
}
function frame(promptHtml, stageHtml, extra) {
  const dots = Array.from({ length: ROUND }, (_, i) => `<i class="${i < R.grades.length ? 'g' + R.grades[i] : i === R.i ? 'now' : ''}"></i>`).join('');
  $app.innerHTML = `
    <div class="top">
      <button class="icon-btn" id="home" aria-label="回地圖">⌂</button>
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
  document.getElementById('say').onclick = () => speak(plainText(document.getElementById('prompt')));
}
function endRound() {
  const ch = R.chapter, boss = R.boss;
  let beat = null;
  if (R.daily) S.stamps[today()] = 1;
  if (boss) { if (!S.bossDone) { S.bossDone = true; S.stars = Math.max(S.stars, CITY / 2); beat = 'ending'; } }
  else if (STORY[ch] && R.fixedLv === undefined) {
    const before = S.prog[ch] || 0;
    if (before < ROUNDS_TO_SAVE) { S.prog[ch] = before + 1; beat = STORY[ch].beats[before + 1]; }
  }
  save();
  const praise = boss ? '開城成功！' : R.daily ? '今天的任務完成了，蓋一個章！' : R.fixedLv !== undefined ? '多練一次，就更有感覺。' : '這棟建築又蓋好一部分。';
  $app.innerHTML = `<div class="end pop">
    ${artImg('liang_cheer', 'end-hero')}
    <h2>城市多了 ${N(fmt(R.earned))} 平方公尺</h2>
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
    <div class="actions"><button class="btn" id="ok">蓋進城市</button></div></div>`;
  document.getElementById('ok').onclick = () => go('');
}
function viewClues() {
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="home" aria-label="回地圖">⌂</button><h2 class="page-h">城市建築</h2></div>
    <p class="tag">蓋好五上十棟就能開城。</p>
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
  return [["line", 0, "讀折線圖", 1], ["line", 1, "畫折線圖", 1], ["line", 2, "哪一段變最多", 1], ["line", 3, "長條圖或折線圖", 1], ["line", 4, "省略符號", 1], ["factor", 0, "排長方形找因數", 1], ["factor", 1, "裝得剛好嗎", 1], ["factor", 2, "找倍數", 1], ["factor", 3, "公因數", 1], ["factor", 4, "一起亮：公倍數", 1], ["factor", 5, "最大的正方形", 1], ["poly", 0, "三角形內角和", 1], ["poly", 1, "三根木條", 1], ["poly", 2, "切成三角形", 1], ["poly", 3, "四邊形內角和", 1], ["poly", 4, "平行四邊形的邊和角", 1], ["poly", 5, "正多邊形", 1], ["ext", 0, "切細：擴分", 1], ["ext", 1, "合併：約分", 1], ["ext", 2, "最簡分數", 1], ["ext", 3, "通分", 1], ["ext", 4, "異分母比大小", 1], ["ext", 5, "分數換小數", 1], ["ext", 6, "配方變多倍", 1], ["sym", 0, "找對稱軸", 1], ["sym", 1, "幾條對稱軸", 1], ["sym", 2, "對稱點", 1], ["sym", 3, "畫另一半", 1], ["sym", 4, "對稱邊和角", 1], ["uadd", 0, "異分母加法", 1], ["uadd", 1, "異分母減法", 1], ["uadd", 2, "帶分數加法", 1], ["uadd", 3, "帶分數減法", 1], ["uadd", 4, "夠不夠", 1], ["mix", 0, "排併式", 1], ["mix", 1, "平均", 1], ["mix", 2, "分配律", 1], ["mix", 3, "簡化計算", 1], ["mix", 4, "連除", 1], ["mix", 5, "用 □ 記關係", 1], ["mix", 6, "天平：等量", 1], ["para", 0, "平行四邊形", 1], ["para", 1, "三角形", 1], ["para", 2, "等底等高", 1], ["para", 3, "梯形", 1], ["para", 4, "符號公式", 1], ["para", 5, "由面積找邊", 1], ["ttime", 0, "鐘面切等分", 1], ["ttime", 1, "小數的時間", 1], ["ttime", 2, "時間的乘法", 1], ["ttime", 3, "時間的除法", 1], ["ttime", 4, "時間除以時間", 1], ["cuboid", 0, "轉動立體圖", 1], ["cuboid", 1, "生活中的平行垂直", 1], ["cuboid", 2, "摺得成正方體嗎", 1], ["cuboid", 3, "對面是哪一面", 1], ["cuboid", 4, "長方體表面積", 1], ["cuboid", 5, "正方體表面積", 1], ["fcalc", 0, "餅平分：整數相除", 11], ["fcalc", 1, "分裝：整數相除", 11], ["fcalc", 2, "整數的幾分之幾", 11], ["fcalc", 3, "分數的整數倍", 11], ["fcalc", 4, "分數乘分數", 11], ["fcalc", 5, "分數除以整數", 11], ["fcalc", 6, "變大還是變小", 11], ["decimal", 0, "每 4 位切開", 11], ["decimal", 1, "拆到 0.001", 11], ["decimal", 2, "拖小數點", 11], ["decimal", 3, "乘除 10、100", 11], ["decimal", 4, "處理後面的 0", 11], ["decimal", 5, "相鄰位的倍數", 11], ["dmul", 0, "整數乘小數", 11], ["dmul", 1, "乘 0.1、0.01", 11], ["dmul", 2, "百格板小數乘小數", 11], ["dmul", 3, "小數乘小數", 11], ["dmul", 4, "變大還是變小", 11], ["dmul", 5, "小數乘法直式", 11], ["sector", 0, "拖圓心角", 11], ["sector", 1, "幾分之幾圓", 11], ["sector", 2, "幾片拼一圓", 11], ["sector", 3, "認識扇形", 11], ["sector", 4, "畫扇形", 11], ["volume", 0, "長方體體積", 11], ["volume", 1, "正方體體積", 11], ["volume", 2, "切開算", 11], ["volume", 3, "補滿算", 11], ["volume", 4, "立方公尺量感", 11], ["volume", 5, "立方公尺計算", 11], ["volume", 6, "由體積找高", 11], ["ddiv", 0, "整數除以整數", 11], ["ddiv", 1, "小數除以整數", 11], ["ddiv", 2, "除到下一位", 11], ["ddiv", 3, "分數換小數", 11], ["ddiv", 4, "除不盡取概數", 11], ["ddiv", 5, "小數除法直式", 11], ["bigunit", 0, "公畝", 11], ["bigunit", 1, "公頃", 11], ["bigunit", 2, "面積換算", 11], ["bigunit", 3, "面積量感", 11], ["bigunit", 4, "面積計算", 11], ["bigunit", 5, "公噸", 11], ["bigunit", 6, "重量量感", 11], ["bigunit", 7, "公噸計算", 11], ["ratio", 0, "比率", 11], ["ratio", 1, "塗百分率", 11], ["ratio", 2, "換成百分率", 11], ["ratio", 3, "打折", 11], ["ratio", 4, "成數", 11], ["ratio", 5, "百分率應用", 11], ["capacity", 0, "公升與立方公分", 11], ["capacity", 1, "容積", 11], ["capacity", 2, "水位", 11], ["capacity", 3, "放石頭量體積", 11], ["capacity", 4, "溢出的水", 11], ["capacity", 5, "容量量感", 11], ["solid", 0, "數面、邊、頂點", 11], ["solid", 1, "生活中的形體", 11], ["solid", 2, "平行與垂直", 11], ["solid", 3, "配對展開圖", 11], ["solid", 4, "切開球", 11]];
}
function viewPractice() {
  const groups = availKeys().map(k => {
    const ts = practiceTopics().filter(t => t[0] === k);
    return ts.length ? `<h3 class="pg-h">${GAMES[k].name}<span class="sem">${GAMES[k].sem}</span></h3><div class="pg">${ts.map(t => `<button class="pg-btn" data-g="${t[0]}" data-l="${t[1]}"><span class="sem">${t[3] >= 11 ? '五下' : '五上'}</span>${nums(t[2])}</button>`).join('')}</div>` : '';
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
  const read = e => { const g = (sel ? wrap.querySelector(sel) : wrap.querySelector('svg')) || wrap, b = g.getBoundingClientRect(); cb((e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height, e); };
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
function clockSvg(from, cur) {
  let s = '<svg class="clock4" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="#fff" stroke="#33405a" stroke-width="4"/>';
  for (let h = 1; h <= 12; h++) { const a = h * 30 * Math.PI / 180; s += `<text x="${100 + 74 * Math.sin(a)}" y="${106 - 74 * Math.cos(a)}" text-anchor="middle" class="pt">${h}</text>`; }
  const P = (h, l) => [100 + l * Math.sin(h * 30 * Math.PI / 180), 100 - l * Math.cos(h * 30 * Math.PI / 180)], [a, b] = P(from, 58), [c, d] = P(cur, 58);
  return s + `<line x1="100" y1="100" x2="${a}" y2="${b}" stroke="#b9c2d0" stroke-width="5" stroke-dasharray="6 5"/><line x1="100" y1="100" x2="${c}" y2="${d}" stroke="#d6476b" stroke-width="6" stroke-linecap="round"/><circle cx="100" cy="100" r="6" fill="#33405a"/></svg>`;
}
const fracHtml = (a, n) => `<span class="frac num"><i>${a}</i><i>${n}</i></span>`;
const SLICE = { a: '#d6476b', b: '#f0a03c', g: '#ffffff', '': '#fff0cf' };
function pieSvg(n, states, from) { // 每塊都可以點
  const P = i => { const t = i / n * 2 * Math.PI - Math.PI / 2; return `${60 + 54 * Math.cos(t)} ${60 + 54 * Math.sin(t)}`; };
  let s = '<svg class="pie" viewBox="0 0 120 120"><circle cx="60" cy="60" r="57" fill="#c98f4a"/>';
  for (let i = 0; i < n; i++) { const st = states[i] || '', idx = (from || 0) + i; s += n === 1 ? `<circle data-s="${idx}" cx="60" cy="60" r="54" fill="${SLICE[st]}"/>` : `<path data-s="${idx}" d="M60 60L${P(i)}A54 54 0 0 1 ${P(i + 1)}Z" fill="${SLICE[st]}" stroke="#a9702a" stroke-width="2"/>`; }
  return s + '</svg>';
}
function hundred(v, cls) { // v 個 0.01 塗在一張百格板；超過 100 再畫一張
  const one = (n, c) => `<div class="hboard ${c || ''}">${Array.from({ length: 100 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div>`;
  let out = '', left = v; const cnt = Math.max(1, Math.ceil(v / 100));
  for (let k = 0; k < cnt; k++) { out += one(Math.min(100, left), cls); left = Math.max(0, left - 100); }
  return `<div class="hrow">${out}</div>`;
}
function dayBar(m, s) { // 一天 24 小時的條，看得到白天黑夜
  const pct = x => (x % 1440) / 1440 * 100;
  return `<div class="daybar"><span class="sun"></span><i class="pin" style="left:${pct(s)}%"></i><i class="pin now" style="left:${pct(m)}%"></i><small style="left:0">0</small><small style="left:25%">6</small><small style="left:50%">12</small><small style="left:75%">18</small><small style="left:100%">24</small></div>`;
}
/* ---------- 五年級共用：連續拖動、常用圖 ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function slideTo(q, elId, label, draw, ask, read) { // 拖到定位才能作答；read 把手指位置換成 0～1；按鈕是備用
  const el = document.getElementById(elId);
  if (isFast(q)) { draw(1); return afterAct(ask); }
  let over = false;
  const end = () => { if (over) return; over = true; el.onpointerdown = el.onpointermove = null; draw(1); sfx.ok(); afterAct(ask); };
  draw(0);
  actionBtn('gt', label).onclick = end;
  dragOn(el, (x, y) => { if (over) return; const t = clamp(read ? read(x, y) : x, 0, 1); if (t >= .9) return end(); draw(t); });
}
const fracText = (a, n) => `${a}/${n}`;
const polyStr = pts => pts.map(p => p.join(',')).join(' ');
const mixedHtml = (w, a, n) => `<span class="mixed">${w ? `<b class="num">${w}</b>` : ''}${fracHtml(a, n)}</span>`;
function foodSvg(food, n, a, opts) { // 真實物品：披薩是圓的，巧克力是一片格子
  const o = opts || {}, other = o.b || 0;
  if (food[1] === 'pie') return pieSvg(n, Array.from({ length: n }, (_, i) => i < a ? 'a' : i < a + other ? 'b' : ''));
  let r = 1; for (let k = 1; k * k <= n; k++) if (n % k === 0) r = k;
  const c = n / r, W = 180, H = 120, cw = W / c, rh = H / r;
  let s = `<svg class="choco" viewBox="-4 -4 ${W + 8} ${H + 8}"><rect x="-3" y="-3" width="${W + 6}" height="${H + 6}" rx="6" fill="#6b4226"/>`;
  for (let i = 0; i < n; i++) { const x = i % c, y = Math.floor(i / c); s += `<rect x="${x * cw + 1}" y="${y * rh + 1}" width="${cw - 2}" height="${rh - 2}" rx="2" fill="${i < a ? '#d6476b' : i < a + other ? '#f0a03c' : '#a8744a'}"/>`; }
  return s + '</svg>';
}
function vesselSvg(v, n, a, b) { // 量杯或一條線：每一格都看得到
  if (v[2] === 'cup') {
    let s = '<svg class="cup" viewBox="0 0 70 150"><path d="M6 4V146H64V4" fill="#f4f8fc" stroke="#33405a" stroke-width="3"/>';
    const h = 140 / n;
    for (let i = 0; i < n; i++) { const y = 145 - (i + 1) * h, on = i < a ? '#6ea8dc' : i < a + (b || 0) ? '#f0a03c' : 'none'; if (on !== 'none') s += `<rect x="8" y="${y}" width="54" height="${h}" fill="${on}"/>`; if (i) s += `<line x1="6" x2="64" y1="${145 - i * h}" y2="${145 - i * h}" stroke="#33405a" stroke-width="1"/>`; }
    return s + '</svg>';
  }
  let s = '<svg class="ropebar" viewBox="0 0 280 34"><rect x="4" y="9" width="272" height="16" rx="4" fill="#f4f6fa" stroke="#33405a" stroke-width="2"/>';
  const w = 268 / n;
  for (let i = 0; i < n; i++) { const on = i < a ? '#d6476b' : i < a + (b || 0) ? '#f0a03c' : ''; if (on) s += `<rect x="${6 + i * w}" y="11" width="${w}" height="12" fill="${on}"/>`; if (i) s += `<line x1="${6 + i * w}" x2="${6 + i * w}" y1="9" y2="25" stroke="#33405a"/>`; }
  return s + '</svg>';
}

/* ---------- 一：氣溫觀測站 ---------- */
function lineChart(q, o) { // o.g 各點；o.n 畫幾點；o.guide 直線；o.h 從直線到刻度的水平虛線；o.bars 長條；o.flat 刻度從 0 開始
  o = o || {};
  const g = o.g || q.g, cnt = g.length, x = i => 56 + i * (264 / (cnt - 1)), base = 192, topPx = 12, vmax = q.lo + q.top * q.step;
  const lvl = v => base - v * ((base - topPx) / q.top), val = v => o.flat ? base - (q.lo + v * q.step) * ((base - topPx) / vmax) : lvl(v);
  let s = `<svg class="g5" viewBox="0 0 340 232">`;
  if (o.flat) { for (let k = 0; k <= 5; k++) { const yy = base - k / 5 * (base - topPx); s += `<line x1="44" x2="330" y1="${yy}" y2="${yy}" stroke="#dde3ec"/><text x="40" y="${yy + 4}" text-anchor="end" class="ax">${Math.round(vmax * k / 5)}</text>`; } }
  else for (let k = 0; k <= q.top; k++) { const yy = lvl(k); s += `<line x1="44" x2="330" y1="${yy}" y2="${yy}" stroke="${k % 2 ? '#eef1f6' : '#dde3ec'}"/>`; if (k % 2 === 0) s += `<text x="40" y="${yy + 4}" text-anchor="end" class="ax">${q.lo + k * q.step}</text>`; }
  s += `<line x1="44" y1="${topPx}" x2="44" y2="${base}" stroke="#33405a" stroke-width="2"/><line x1="44" y1="${base}" x2="330" y1="${base}" y2="${base}" stroke="#33405a" stroke-width="2"/>`;
  if (q.lo > 0 && !o.flat) s += `<path d="M36 ${base - 2}l8 -4l-8 -4l8 -4" fill="none" stroke="#d6476b" stroke-width="2.5"/>`;
  q.xs.slice(0, cnt).forEach((t, i) => { s += `<text x="${x(i)}" y="210" text-anchor="middle" class="ax">${t}</text>`; });
  if (o.bars) g.forEach((v, i) => { s += `<rect x="${x(i) - 16}" y="${val(v)}" width="32" height="${base - val(v)}" fill="#6ea8dc"/>`; });
  else {
    const n = o.n === undefined ? cnt : o.n;
    if (n > 1) s += `<polyline points="${g.slice(0, n).map((v, i) => `${x(i)},${val(v)}`).join(' ')}" fill="none" stroke="#d6476b" stroke-width="3"/>`;
    if (o.hiSeg !== undefined) { const i = o.hiSeg; s += `<line x1="${x(i)}" y1="${val(g[i])}" x2="${x(i + 1)}" y2="${val(g[i + 1])}" stroke="#f0a03c" stroke-width="6"/>`; }
    g.slice(0, n).forEach((v, i) => { s += `<circle cx="${x(i)}" cy="${val(v)}" r="${o.big ? 12 : 5}" fill="${o.big === i ? '#ffd65a' : '#d6476b'}" stroke="#33405a" stroke-width="${o.big ? 2 : 1}"/>`; });
  }
  if (o.guide !== undefined) { s += `<line x1="${x(o.guide)}" y1="${topPx}" x2="${x(o.guide)}" y2="${base}" stroke="#2f5f9e" stroke-width="3"/><circle cx="${x(o.guide)}" cy="${base + 2}" r="11" fill="#ffd65a" stroke="#2f5f9e" stroke-width="3"/>`; }
  if (o.h !== undefined) s += `<line x1="44" x2="${x(o.h)}" y1="${val(g[o.h])}" y2="${val(g[o.h])}" stroke="#2f5f9e" stroke-width="2" stroke-dasharray="6 4"/>`;
  return s + '</svg>';
}
function viewLine(q) {
  if (q.mode === 'read') {
    frame(`${q.e} ${q.what}的紀錄。<br><b>${q.xs[q.i]}</b> 是多少${q.unit}？<br>拖黃圓鈕到 ${q.xs[q.i]}。`, `<div id="ch"></div><div class="trail">一格是 ${q.step} ${q.unit}，先看刻度。</div>${padHidden()}`);
    const ask = () => stepKeypad([`${q.xs[q.i]}是多少${q.unit}？`], [q.ans], `順著藍色虛線往左看刻度，一格是 ${q.step}。`, `對了！${q.xs[q.i]}是 ${q.ans} ${q.unit}。點的高低就是數的大小。`, 'read');
    if (isFast(q)) { setEl('ch', lineChart(q, { guide: q.i, h: q.i })); return afterAct(ask); }
    let cur = 0, over = false; const el = document.getElementById('ch');
    const go = i => { if (over) return; cur = clamp(i, 0, q.g.length - 1); setEl('ch', lineChart(q, { guide: cur })); if (cur === q.i) { over = true; el.onpointerdown = el.onpointermove = null; setEl('ch', lineChart(q, { guide: cur, h: cur })); sfx.ok(); afterAct(ask); } else sfx.hop(); };
    setEl('ch', lineChart(q, { guide: 0 }));
    if (q.i === 0) { go(0); return; }
    dragOn(el, x => go(Math.round((x * 340 - 56) / (264 / (q.g.length - 1)))));
    actionBtn('gt', '往右一格').onclick = () => go(cur + 1);
    return;
  }
  if (q.mode === 'draw') {
    const g = q.g.map((v, i) => isFast(q) && i < q.g.length - 1 ? v : 0); let act = isFast(q) ? q.g.length - 1 : 0;
    frame(`${q.e} 把${q.what}畫成折線圖。<br>上下拖每個紅點到表上的數。`, `<table class="pv tb5"><tr>${q.xs.map(x => `<th>${x}</th>`).join('')}</tr><tr>${q.vals.map(v => `<td class="num">${v}</td>`).join('')}</tr></table><div id="ch"></div><div class="odo three"><button class="turn" id="pv">◀ 上一點</button><button class="turn" id="up">往上一格</button><button class="turn" id="dn">往下一格</button></div><div class="trail" id="ct"></div>`);
    const draw = () => { setEl('ch', lineChart(q, { g, big: act })); setEl('ct', `正在調：${q.xs[act]}　現在是 ${q.lo + g[act] * q.step}`); };
    draw();
    dragOn(document.getElementById('ch'), (x, y) => { const i = clamp(Math.round((x * 340 - 56) / (264 / (g.length - 1))), 0, g.length - 1), v = clamp(Math.round((192 - y * 232) / (180 / q.top)), 0, q.top); if (i !== act || v !== g[i]) { act = i; g[i] = v; sfx.hop(); draw(); } });
    document.getElementById('up').onclick = () => { g[act] = clamp(g[act] + 1, 0, q.top); sfx.hop(); draw(); };
    document.getElementById('dn').onclick = () => { g[act] = clamp(g[act] - 1, 0, q.top); sfx.hop(); draw(); };
    document.getElementById('pv').onclick = () => { act = (act + g.length - 1) % g.length; sfx.hop(); draw(); };
    actionBtn('ok', '畫好了').onclick = () => {
      const bad = g.findIndex((v, i) => v !== q.g[i]);
      if (bad < 0) return finish(graded(), 'draw', '對了！點連成線，一眼就看出它怎麼變。');
      if (miss()) { q.g.forEach((v, i) => { g[i] = v; }); draw(); return finish(0, { wrong: bad, ans: q.vals[bad] }, '正確的折線在這裡。先看橫的是哪一格，再往上找數。'); }
      act = bad; draw(); setMsg(`${q.xs[bad]}要是 ${q.vals[bad]}，現在是 ${q.lo + g[bad] * q.step}。`, 'hint');
    };
    return;
  }
  if (q.mode === 'trend') {
    const opts = q.xs.slice(0, -1).map((x, i) => `${x}到${q.xs[i + 1]}`);
    frame(`${q.e} ${q.what}。<br>哪一段${q.verb}最多？<br>拖過去看每一段。`, `<div id="ch"></div><div class="trail" id="ct">線越陡，變得越多</div>`);
    setEl('ch', lineChart(q));
    const ask = () => pickOne(opts, q.best, '看哪一段往上爬得最陡，算一算差幾格。', `對了！${opts[q.best]}多了 ${q.ans} ${q.unit}，線也最陡。`, 'trend');
    return gate(q, ['看第 1 段', '看第 2 段', '看第 3 段', '看第 4 段'], 4, k => { const i = k - 1; setEl('ch', lineChart(q, { hiSeg: i })); const d = (q.g[i + 1] - q.g[i]) * q.step; setEl('ct', `${opts[i]}：${d > 0 ? `${q.verb} ${d}` : d < 0 ? `少了 ${-d}` : '沒變'} ${q.unit}`); }, ask, { el: document.getElementById('ch'), map: x => x * 4.4 });
  }
  if (q.mode === 'which') {
    const c = { lo: 0, step: 1, top: 10, xs: ['甲', '乙', '丙', '丁', '戊'], g: q.g };
    frame(`${q.e} 要記錄「${q.t}」，<br>長條圖和折線圖都畫畫看。`, `<div id="ch"></div>`);
    setEl('ch', lineChart(c, { bars: true }));
    return gate(q, ['畫成折線圖', '畫成長條圖再看一次'], 2, k => setEl('ch', lineChart(c, { bars: k === 2 })), () => pickOne(['折線圖', '長條圖'], q.a === '折線圖' ? 0 : 1, '先問：這些資料是跟著時間在變，還是一樣一樣分開的東西？', `對了！${q.why}`, 'which'));
  }
  frame(`${q.e} ${q.what}。<br>刻度從 0 開始，線幾乎是平的，看不出來！<br>往右拖，把用不到的下半截切掉。`, `<div id="ch"></div>${padHidden()}`);
  const ask = () => stepKeypad(['現在一格是多少公分？', '最高的點是多少公分？'], [q.step, q.ans], `看刻度上相鄰的兩個數。紅色鋸齒是省略符號，表示下面省略了。`, `對了！最高是 ${q.ans} 公分。鋸齒表示 0 到 ${q.lo} 省略了，變化才看得清楚。`, 'broken');
  slideTo(q, 'ch', '加上省略符號', t => setEl('ch', lineChart(q, t >= 1 ? {} : { flat: true })), ask);
}

/* ---------- 二：地磚排列場 ---------- */
function tilesSvg(n, w, thing) {
  const rows = Math.ceil(n / w), u = Math.min(310 / w, 170 / rows), ok = n % w === 0;
  let s = `<svg class="g5" viewBox="0 0 320 180">`;
  for (let i = 0; i < n; i++) { const x = i % w, y = Math.floor(i / w), lone = !ok && y === rows - 1; s += `<rect x="${5 + x * u}" y="${5 + y * u}" width="${u - 1.5}" height="${u - 1.5}" rx="${Math.min(3, u / 5)}" fill="${lone ? '#f4a9a0' : '#e0b070'}" stroke="#7a5b2e"/>`; }
  return s + '</svg>';
}
const sliderHtml = (id, pct) => `<div class="sl5" id="${id}"><svg viewBox="0 0 320 30"><line x1="12" x2="308" y1="15" y2="15" stroke="#c9d1dd" stroke-width="8" stroke-linecap="round"/><circle cx="${12 + 296 * pct}" cy="15" r="13" fill="#ffd65a" stroke="#2f5f9e" stroke-width="3"/></svg></div>`;
function viewFactor(q) {
  if (q.mode === 'rect') {
    const [nm, un] = q.thing, pairs = q.f.filter(x => x * x <= q.n);
    frame(`${q.n} ${un}${nm}要排成整齊的長方形，一${un}都不剩。<br>拖黃鈕改「每排幾${un}」，找出<b>所有</b>排法。`, `<div id="ti"></div><div id="sl"></div><div class="odo two"><button class="turn" id="mi">每排少 1</button><button class="turn" id="pl">每排多 1</button></div><div class="trail" id="ct"></div><div class="chips" id="fd"></div>${padHidden()}`);
    let w = 1; const found = new Set();
    const ask = () => { document.querySelector('.sl5')?.remove(); stepKeypad([`能排的「每排幾${un}」共有幾種？`], [q.ans], '數下面的數字卡，每一張都是一種排法。', `對了！${q.n} 的因數是 ${q.f.join('、')}。它們一對一對出現：${pairs.map(x => `${x}×${q.n / x}`).join('、')}。`, 'rect'); };
    const draw = () => {
      setEl('ti', tilesSvg(q.n, w)); setEl('sl', sliderHtml('s1', (w - 1) / (q.n - 1)));
      const ok = q.n % w === 0; setEl('ct', ok ? `每排 ${w}${un}，${q.n / w} 排，剛好！` : `每排 ${w}${un}，最後一排排不滿`);
      if (ok && !found.has(w)) { found.add(w); found.add(q.n / w); sfx.ok(); } else sfx.hop();
      setEl('fd', q.f.map(x => `<span class="chip ${found.has(x) ? 'on' : 'dim'}">${found.has(x) ? x : '？'}</span>`).join(''));
      if (found.size === q.f.length && !over) { over = true; setMsg(`全部找到了！這些數都能把 ${q.n} 剛好排完。`, 'good'); document.getElementById('mi').disabled = document.getElementById('pl').disabled = true; afterAct(ask); }
    };
    let over = false;
    if (isFast(q)) { q.f.forEach(x => found.add(x)); w = q.f[1]; }
    draw();
    document.getElementById('mi').onclick = () => { if (!over) { w = Math.max(1, w - 1); draw(); } };
    document.getElementById('pl').onclick = () => { if (!over) { w = Math.min(q.n, w + 1); draw(); } };
    dragOn(document.getElementById('sl'), x => { if (over) return; const v = clamp(Math.round((x * 320 - 12) / 296 * (q.n - 1)) + 1, 1, q.n); if (v !== w) { w = v; draw(); } });
    return;
  }
  if (q.mode === 'fit') {
    const [nm, un, box, e] = q.ctx;
    frame(`${e} ${q.n} ${un}${nm}，每${box}裝 ${q.b} ${un}。<br>一${box}一${box}裝裝看。`, `<div class="crates" id="cr"></div><div class="trail" id="ct">還有 ${q.n} ${un}沒裝</div>`);
    const ask = () => pickOne([`${q.b} 是 ${q.n} 的因數`, `${q.b} 不是 ${q.n} 的因數`], q.ans === '是' ? 0 : 1, '看看有沒有裝完，還剩幾個？', q.r ? `對了！剩 ${q.r} ${un}裝不滿，所以 ${q.b} 不是 ${q.n} 的因數。` : `對了！${q.b}×${q.q}＝${q.n} 剛好裝完。${q.b} 是 ${q.n} 的因數，${q.n} 也是 ${q.b} 的倍數。`, 'fit');
    return gate(q, `再裝一${box}`, q.q, k => { setEl('cr', Array.from({ length: k }, () => `<span class="crate"><b class="num">${q.b}</b><small>${un}</small></span>`).join('')); setEl('ct', k === q.q ? (q.r ? `裝了 ${q.q} ${box}，還剩 ${q.r} ${un}，裝不滿了` : `裝了 ${q.q} ${box}，一${un}也沒剩`) : `還有 ${q.n - k * q.b} ${un}沒裝`); }, ask);
  }
  if (q.mode === 'multi') {
    const [nm, un, act, e] = q.ctx, lim = q.lim, cnt = Math.floor(lim / q.a);
    frame(`${e} ${nm}每 ${q.a} ${un}${act}。<br>在時間軸上，點出 ${lim} ${un}內它${act}的時候。`, `<div class="numgrid" id="ng">${Array.from({ length: lim }, (_, i) => `<button class="ng" data-n="${i + 1}">${i + 1}</button>`).join('')}</div><div class="trail" id="ct"></div>${padHidden()}`);
    const ask = () => stepKeypad([`第 ${q.k} 次${act}是第幾${un}？`], [q.ans], `每次多 ${q.a}，第 ${q.k} 次就是 ${q.k} 個 ${q.a}。`, `對了！${q.a}×${q.k}＝${q.ans}。${q.a}、${q.a * 2}、${q.a * 3}⋯⋯都是 ${q.a} 的倍數，後面還有無限多個。`, 'multi');
    if (isFast(q)) { document.querySelectorAll('.ng').forEach(b => { if (+b.dataset.n % q.a === 0) b.classList.add('on'); }); return afterAct(ask); }
    let got = 0;
    document.querySelectorAll('.ng').forEach(b => b.onclick = () => {
      const v = +b.dataset.n; if (b.classList.contains('on')) return;
      if (v % q.a) { sfx.retry(); return setMsg(`第 ${v} ${un}不會${act}。從上一次再過 ${q.a} ${un}才會。`, 'hint'); }
      b.classList.add('on'); sfx.hop(); got++; setEl('ct', `已經點 ${got} 個`);
      if (got === cnt) { setMsg('每次都多一樣多，這些就是它的倍數。', 'good'); afterAct(ask); }
    });
    return;
  }
  if (q.mode === 'comf') {
    const [A, B, how, un] = q.ctx;
    frame(`${q.a} ${un}${A}和 ${q.b} ${un}${B}，要${how}。<br>上下兩列都有的數字才行，把它們點出來。`, `<div class="trail">${q.a} 可以分成：</div><div class="chips" id="c1">${q.fa.map(x => `<button class="chip" data-v="${x}">${x}</button>`).join('')}</div><div class="trail">${q.b} 可以分成：</div><div class="chips" id="c2">${q.fb.map(x => `<span class="chip dim2" data-w="${x}">${x}</span>`).join('')}</div>${padHidden()}`);
    const ask = () => stepKeypad(['最大可以分成幾份？'], [q.ans], '兩列都有的數字裡，找最大的。', `對了！${q.com.join('、')} 都是公因數，最大的是 ${q.ans}。`, 'comf');
    const mark = v => { document.querySelectorAll(`[data-v="${v}"],[data-w="${v}"]`).forEach(x => x.classList.add('on')); };
    if (isFast(q)) { q.com.forEach(mark); return afterAct(ask); }
    let got = 0;
    document.querySelectorAll('[data-v]').forEach(b => b.onclick = () => {
      const v = +b.dataset.v; if (b.classList.contains('on')) return;
      if (q.b % v) { sfx.retry(); return setMsg(`${q.b} 分不成 ${v} 份，會有剩。`, 'hint'); }
      mark(v); sfx.hop(); got++;
      if (got === q.com.length) { setMsg('兩邊都分得完的數，叫作公因數。', 'good'); afterAct(ask); }
    });
    return;
  }
  if (q.mode === 'lamp') {
    const [A, B, un, act, both] = q.ctx;
    frame(`現在${A}和${B}一起開始。<br>${A}每 ${q.a} ${un}${act}，${B}每 ${q.b} ${un}${act}。<br>拖時間，看幾${un}後${both}。`, `<div class="lamps" id="lp"></div><div id="sl"></div><div class="trail" id="ct"></div>${padHidden()}`);
    const lamp = (on, c) => `<span class="lamp ${on ? 'on' : ''}" style="--c:${c}"></span>`;
    const draw = k => { setEl('lp', `<div>${lamp(k && k % q.a === 0, '#e0455a')}<small>${A}</small></div><div>${lamp(k && k % q.b === 0, '#3fae5a')}<small>${B}</small></div>`); setEl('sl', sliderHtml('s2', k / q.ans)); setEl('ct', `過了 ${k} ${un}`); };
    draw(0);
    const ask = () => stepKeypad([`第一次${both}是幾${un}後？`], [q.ans], `要同時是 ${q.a} 的倍數和 ${q.b} 的倍數。`, `對了！${q.ans} 同時是 ${q.a} 和 ${q.b} 的倍數，是最小的公倍數。之後每 ${q.ans} ${un}又會${both}。`, 'lamp');
    return gate(q, `再過 1 ${un}`, q.ans, draw, ask, { el: document.getElementById('sl'), map: x => (x * 320 - 12) / 296 * q.ans });
  }
  const u0 = Math.min(280 / q.W, 170 / q.H);
  frame(`${q.ctx}長 ${q.W} 格、寬 ${q.H} 格，要鋪正方形的地磚，都不能切。<br>拖黃鈕改地磚大小，找<b>最大</b>的一種。`, `<div id="pv"></div><div id="sl"></div><div class="odo two"><button class="turn" id="mi">小一點</button><button class="turn" id="pl">大一點</button></div><div class="trail" id="ct"></div>`);
  const mx = Math.min(q.W, q.H); let s = 1;
  const draw = () => {
    const okW = q.W % s === 0, okH = q.H % s === 0;
    let h = `<svg class="g5" viewBox="-4 -4 ${q.W * u0 + 8} ${q.H * u0 + 8}"><rect width="${q.W * u0}" height="${q.H * u0}" fill="#fff8e6" stroke="#7a5b2e" stroke-width="2"/>`;
    for (let y = 0; y + s <= q.H; y += s) for (let x = 0; x + s <= q.W; x += s) h += `<rect x="${x * u0}" y="${y * u0}" width="${s * u0}" height="${s * u0}" fill="${(x + y) / s % 2 ? '#bcd6f2' : '#d9e8f7'}" stroke="#2f5f9e"/>`;
    setEl('pv', h + '</svg>'); setEl('sl', sliderHtml('s3', (s - 1) / (mx - 1)));
    setEl('ct', `每邊 ${s} 格：${okW && okH ? '剛好鋪滿' : !okW && !okH ? '長和寬都有空隙' : okW ? '寬有空隙' : '長有空隙'}`);
  };
  draw();
  dragOn(document.getElementById('sl'), x => { const v = clamp(Math.round((x * 320 - 12) / 296 * (mx - 1)) + 1, 1, mx); if (v !== s) { s = v; sfx.hop(); draw(); } });
  document.getElementById('mi').onclick = () => { s = Math.max(1, s - 1); sfx.hop(); draw(); };
  document.getElementById('pl').onclick = () => { s = Math.min(mx, s + 1); sfx.hop(); draw(); };
  actionBtn('ok', '就是這一種').onclick = () => {
    if (s === q.ans) return finish(graded(), 'pave', `對了！${q.ans} 能同時除盡 ${q.W} 和 ${q.H}，是最大公因數。`);
    if (miss()) { s = q.ans; draw(); return finish(0, { wrong: s, ans: q.ans }, `每邊 ${q.ans} 格才是最大的。要同時是 ${q.W} 和 ${q.H} 的因數。`); }
    setMsg(q.W % s || q.H % s ? '有空隙，要長和寬都剛好。' : '鋪得滿，可是還可以更大。', 'hint');
  };
}

/* ---------- 三：圍牆設計處 ---------- */
const ptAng = (A, B, C) => { const u = Math.atan2(A[1] - B[1], A[0] - B[0]), v = Math.atan2(C[1] - B[1], C[0] - B[0]); let d = Math.abs(u - v) * 180 / Math.PI; return d > 180 ? 360 - d : d; };
function wedges(list) { // 把撕下的角拼在同一點
  const cx = 150, cy = 110, r = 70, C = ['#f4a9a0', '#a9d0f0', '#b7e0a8', '#f7dc8c'];
  let s = `<svg class="g5" viewBox="0 0 300 200"><line x1="20" x2="280" y1="${cy}" y2="${cy}" stroke="#c9d1dd" stroke-width="2" stroke-dasharray="6 5"/>`, from = 0;
  list.forEach((a, i) => { const P = t => `${cx + r * Math.cos(-t * Math.PI / 180)} ${cy + r * Math.sin(-t * Math.PI / 180)}`, mid = from + a / 2; s += `<path d="M${cx} ${cy}L${P(from)}A${r} ${r} 0 ${a > 180 ? 1 : 0} 0 ${P(from + a)}Z" fill="${C[i]}" stroke="#33405a"/><text x="${cx + 44 * Math.cos(-mid * Math.PI / 180)}" y="${cy + 44 * Math.sin(-mid * Math.PI / 180) + 5}" text-anchor="middle" class="ax">${a === null ? '' : a}</text>`; from += a; });
  return s + `<circle cx="${cx}" cy="${cy}" r="4" fill="#33405a"/></svg>`;
}
function viewPoly(q) {
  if (q.mode === 'sum') {
    frame(`${q.ctx}可以拖成各種形狀。<br>拖黃點改形狀，看看三個角加起來。`, `<div id="tr"></div><div class="trail" id="ct"></div>${padHidden()}`);
    let P = [[60, 170], [270, 170], [130, 50]], grab = -1, moved = 0, over = false;
    const ask = () => stepKeypad([`一個三角形有兩個角是 ${q.a} 度和 ${q.b} 度，第三個角幾度？`], [q.ans], '三個角撕下來拼成一條直線，是多少度？', `對了！180－${q.a}－${q.b}＝${q.ans} 度。怎麼拖都是 180 度。`, 'sum');
    const nums3 = () => { const a = Math.round(ptAng(P[2], P[0], P[1])), b = Math.round(ptAng(P[0], P[1], P[2])); return [a, b, 180 - a - b]; };
    const draw = () => { const [a, b, c] = nums3(); setEl('tr', `<svg class="g5" viewBox="0 0 320 200"><polygon points="${polyStr(P)}" fill="#fff0cf" stroke="#7a5b2e" stroke-width="3"/>${P.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="13" fill="#ffd65a" stroke="#2f5f9e" stroke-width="3"/>`).join('')}</svg>`); setEl('ct', `三個角：${a} 度、${b} 度、${c} 度`); };
    const tear = () => { if (over) return; over = true; const el = document.getElementById('tr'); el.onpointerdown = el.onpointermove = null; const [a, b, c] = nums3(); setEl('tr', wedges([a, b, c])); setEl('ct', `${a}＋${b}＋${c}＝${a + b + c}，剛好拼成一直線`); sfx.ok(); afterAct(ask); };
    draw();
    if (isFast(q)) return tear();
    const el = document.getElementById('tr');
    dragOn(el, (x, y) => { if (over) return; const X = x * 320, Y = y * 200; if (grab < 0) { let bd = 9e9; P.forEach((p, i) => { const d = Math.hypot(p[0] - X, p[1] - Y); if (d < bd) { bd = d; grab = i; } }); } P[grab] = [clamp(X, 14, 306), clamp(Y, 14, 186)]; const area = Math.abs((P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[2][0] - P[0][0]) * (P[1][1] - P[0][1])); if (area < 4000) return; moved++; draw(); if (moved === 6) { document.getElementById('gt').disabled = false; setMsg('角一直變，加起來呢？撕下來拼拼看。'); } });
    el.addEventListener('pointerup', () => { grab = -1; }); el.addEventListener('pointerdown', () => { grab = -1; }, true);
    actionBtn('gt', '✂️ 撕下三個角拼一起').onclick = tear;
    return;
  }
  if (q.mode === 'sticks') {
    const U = Math.min(26, 250 / q.c), bx = 160 - q.c * U / 2, by = 175, Ax = bx, Bx = bx + q.c * U;
    let ta = 60, tb = 120, grab = -1, used = false;
    frame(`三根${q.ctx}：${q.a}、${q.b}、${q.c} 公分。<br>拖兩根${q.ctx}的黃色尖端，圍得起來嗎？`, `<div id="st"></div><div class="trail" id="ct"></div>`);
    const tip = () => [[Ax + q.a * U * Math.cos(ta * Math.PI / 180), by - q.a * U * Math.sin(ta * Math.PI / 180)], [Bx + q.b * U * Math.cos(tb * Math.PI / 180), by - q.b * U * Math.sin(tb * Math.PI / 180)]];
    const draw = () => { const [p, r] = tip(), gap = Math.hypot(p[0] - r[0], p[1] - r[1]); setEl('st', `<svg class="g5" viewBox="0 0 320 200"><line x1="${Ax}" x2="${Bx}" y1="${by}" y2="${by}" stroke="#7a5b2e" stroke-width="8" stroke-linecap="round"/><text x="${(Ax + Bx) / 2}" y="${by + 20}" text-anchor="middle" class="ax">${q.c}</text><line x1="${Ax}" y1="${by}" x2="${p[0]}" y2="${p[1]}" stroke="#d6476b" stroke-width="7" stroke-linecap="round"/><line x1="${Bx}" y1="${by}" x2="${r[0]}" y2="${r[1]}" stroke="#2f5f9e" stroke-width="7" stroke-linecap="round"/><circle cx="${p[0]}" cy="${p[1]}" r="11" fill="#ffd65a" stroke="#d6476b" stroke-width="3"/><circle cx="${r[0]}" cy="${r[1]}" r="11" fill="#ffd65a" stroke="#2f5f9e" stroke-width="3"/></svg>`); setEl('ct', gap < 14 ? '尖端碰在一起了！' : `兩個尖端還差一段`); };
    const ask = () => pickOne(['圍得起來', '圍不起來'], q.ans === '圍得起來' ? 0 : 1, '把兩根短的轉到最靠近，夠不夠碰到？', q.a + q.b > q.c ? `對了！${q.a}＋${q.b}＝${q.a + q.b}，比 ${q.c} 長，圍得起來。` : `對了！${q.a}＋${q.b}＝${q.a + q.b}，${q.a + q.b === q.c ? `和 ${q.c} 一樣長，只會攤平成一直線` : `比 ${q.c} 短，碰不到`}。`, 'sticks');
    draw();
    const first = () => { if (!used) { used = true; afterAct(ask); actionBackup(); } };
    const actionBackup = () => {};
    if (isFast(q)) return afterAct(ask);
    dragOn(document.getElementById('st'), (x, y) => { const X = x * 320, Y = y * 200, [p, r] = tip(); if (grab < 0) grab = Math.hypot(p[0] - X, p[1] - Y) < Math.hypot(r[0] - X, r[1] - Y) ? 0 : 1; if (grab === 0) ta = clamp(Math.atan2(by - Y, X - Ax) * 180 / Math.PI, 0, 180); else tb = clamp(Math.atan2(by - Y, X - Bx) * 180 / Math.PI, 0, 180); draw(); first(); });
    document.getElementById('st').addEventListener('pointerup', () => { grab = -1; });
    actionBtn('gt', '讓尖端靠最近').onclick = () => { ta = 25; tb = 155; if (q.a + q.b > q.c) { const c = q.c, a = q.a, b = q.b, A = Math.acos((a * a + c * c - b * b) / (2 * a * c)) * 180 / Math.PI; ta = A; tb = 180 - Math.acos((b * b + c * c - a * a) / (2 * b * c)) * 180 / Math.PI; } else { ta = 0; tb = 180; } sfx.hop(); draw(); first(); };
    return;
  }
  if (q.mode === 'cut') {
    const P = Array.from({ length: q.n }, (_, i) => { const t = (i / q.n * 360 - 90) * Math.PI / 180; return [160 + 92 * Math.cos(t), 106 + 92 * Math.sin(t)]; });
    frame(`${q.n} 邊形的${q.ctx}，內角和是多少？<br>從紅點切到別的黃點，切成三角形。`, `<div id="pg"></div><div class="trail" id="ct">三角形會算，多邊形就切成三角形</div>${padHidden()}`);
    const done = new Set();
    const ask = () => stepKeypad(['切成幾個三角形？', '內角和是幾度？'], [q.tris, q.ans], '每個三角形都有 180 度。', `對了！180×${q.tris}＝${q.ans} 度。邊數多 1，三角形也多 1。`, 'cut', null, { shortcut: true });
    const draw = () => { const f = ['#fff0cf', '#d9e8f7', '#dcf0d5', '#fbe0da', '#efe2f7', '#f7efc9']; const list = [1, ...[...done].sort((a, b) => a - b), q.n - 1]; let tr = ''; for (let k = 0; k + 1 < list.length; k++) { const a = list[k], b = list[k + 1], pts = [P[0]]; for (let i = a; i <= b; i++) pts.push(P[i]); tr += `<polygon points="${polyStr(pts)}" fill="${f[k]}"/>`; } setEl('pg', `<svg class="g5" viewBox="0 0 320 212">${tr}<polygon points="${polyStr(P)}" fill="none" stroke="#7a5b2e" stroke-width="3"/>${[...done].map(i => `<line x1="${P[0][0]}" y1="${P[0][1]}" x2="${P[i][0]}" y2="${P[i][1]}" stroke="#d6476b" stroke-width="3"/>`).join('')}${P.map((p, i) => `<circle class="vt" data-v="${i}" cx="${p[0]}" cy="${p[1]}" r="${i === 0 ? 11 : 13}" fill="${i === 0 ? '#d6476b' : i === 1 || i === q.n - 1 ? '#ccd3de' : done.has(i) ? '#7dc27a' : '#ffd65a'}" stroke="#33405a" stroke-width="2"/>`).join('')}</svg>`); setEl('ct', `已切成 ${done.size + 1} 塊`); };
    if (isFast(q)) { for (let i = 2; i < q.n - 1; i++) done.add(i); draw(); return afterAct(ask); }
    draw();
    const cut = i => { if (i < 2 || i > q.n - 2 || done.has(i)) return; done.add(i); sfx.hop(); draw(); if (done.size === q.n - 3) { setMsg('全部都是三角形了！', 'good'); document.getElementById('pg').onclick = null; afterAct(ask); } };
    document.getElementById('pg').onclick = e => { const v = e.target.dataset && e.target.dataset.v; if (v === undefined) return; cut(+v); };
    actionBtn('gt', '切一刀').onclick = () => { for (let i = 2; i < q.n - 1; i++) if (!done.has(i)) return cut(i); };
    return;
  }
  if (q.mode === 'quad') {
    const xs = q.pts.map(p => p[0]), ys = q.pts.map(p => p[1]), mx = Math.min(...xs), my = Math.max(...ys), sc = Math.min(260 / (Math.max(...xs) - mx), 150 / (my - Math.min(...ys))), P = q.pts.map(p => [20 + (p[0] - mx) * sc, 16 + (my - p[1]) * sc]);
    const pic = `<svg class="g5" viewBox="0 0 300 180"><polygon points="${polyStr(P)}" fill="#fff0cf" stroke="#7a5b2e" stroke-width="3"/>${[q.a, q.b, q.c, '？'].map((v, i) => { const c = [(P[0][0] + P[1][0] + P[2][0] + P[3][0]) / 4, (P[0][1] + P[1][1] + P[2][1] + P[3][1]) / 4]; return `<text x="${P[i][0] + (c[0] - P[i][0]) * .28}" y="${P[i][1] + (c[1] - P[i][1]) * .28 + 5}" text-anchor="middle" class="ax">${v}</text>`; }).join('')}</svg>`;
    frame(`${q.ctx}，三個角是 ${q.a}、${q.b}、${q.c} 度。<br>第四個角幾度？<br>把角撕下來，拼在同一點。`, `<div class="q5">${pic}</div><div id="wd" class="q5"></div>${padHidden()}`);
    return gate(q, ['撕下第 1 個角', '撕下第 2 個角', '撕下第 3 個角'], 3, k => setEl('wd', wedges([q.a, q.b, q.c].slice(0, k))), () => stepKeypad(['第四個角幾度？'], [q.ans], '四個角拼起來剛好繞一圈。一圈幾度？', `對了！360－${q.a}－${q.b}－${q.c}＝${q.ans} 度。四邊形可以切成 2 個三角形，180×2＝360。`, 'quad'));
  }
  if (q.mode === 'pgram') {
    const u = 22, h0 = q.s * u * Math.sin(q.x * Math.PI / 180), sh = q.s * u * Math.cos(q.x * Math.PI / 180), W = q.p * u, x0 = 30, y0 = 165, pts = [[x0, y0], [x0 + W, y0], [x0 + W + sh, y0 - h0], [x0 + sh, y0 - h0]];
    frame(`${q.ctx}是平行四邊形。<br>下邊 ${q.p} 公分，左邊 ${q.s} 公分，左下角 ${q.x} 度。<br>拖動，把它複製一份轉半圈疊上去。`, `<div id="pp"></div>${padHidden()}`);
    const mid = [(pts[0][0] + pts[2][0]) / 2, (pts[0][1] + pts[2][1]) / 2], k = 320 / Math.max(320, x0 + W + Math.max(sh, 0) + 10);
    const draw = t => setEl('pp', `<svg class="g5" viewBox="0 0 ${320 / k} 185"><polygon points="${polyStr(pts)}" fill="#fff0cf" stroke="#7a5b2e" stroke-width="3"/><text x="${x0 + W / 2}" y="${y0 + 16}" text-anchor="middle" class="ax">${q.p}</text><text x="${x0 + sh / 2 - 12}" y="${y0 - h0 / 2}" text-anchor="middle" class="ax">${q.s}</text><text x="${x0 + 28}" y="${y0 - 8}" class="ax">${q.x}°</text><g transform="rotate(${180 * t} ${mid[0]} ${mid[1]})" opacity=".55"><polygon points="${polyStr(pts)}" fill="#a9d0f0" stroke="#2f5f9e" stroke-width="3" stroke-dasharray="6 4"/></g></svg>`);
    const ask = () => stepKeypad(['上邊是幾公分？', '右上角是幾度？'], [q.p, q.x], '轉半圈後疊得剛剛好，上邊就蓋住下邊。', `對了！轉半圈完全疊合，所以對邊一樣長、對角一樣大。`, 'pgram');
    return slideTo(q, 'pp', '轉半圈疊上去', draw, ask);
  }
  if (q.sub === 'total') {
    const P = Array.from({ length: q.n }, (_, i) => { const t = (i / q.n * 360 - 90 + (q.n === 4 ? 45 : 0)) * Math.PI / 180; return [160 + 88 * Math.cos(t), 104 + 88 * Math.sin(t)]; });
    frame(`${q.name}的圍牆，每邊用 ${q.a} 公尺的木板。<br>一邊一邊圍起來，共要幾公尺？`, `<div id="fn"></div><div class="trail" id="ct"></div>${padHidden()}`);
    const draw = k => { setEl('fn', `<svg class="g5" viewBox="0 0 320 206"><polygon points="${polyStr(P)}" fill="#fdf7e6" stroke="#d6dbe4" stroke-width="3"/>${P.slice(0, k).map((p, i) => { const r = P[(i + 1) % q.n]; return `<line x1="${p[0]}" y1="${p[1]}" x2="${r[0]}" y2="${r[1]}" stroke="#a9702a" stroke-width="7" stroke-linecap="round"/>`; }).join('')}</svg>`); setEl('ct', `圍了 ${k} 邊`); };
    draw(0);
    return gate(q, '圍一邊', q.n, draw, () => stepKeypad(['全部是幾公尺？'], [q.ans], `每邊一樣長，有 ${q.n} 邊。`, `對了！${q.a}×${q.n}＝${q.ans} 公尺。每邊一樣長，每個角也一樣大，才叫正多邊形。`, 'regular'));
  }
  const SH = { 菱形: [[160, 20], [240, 100], [160, 180], [80, 100]], 長方形: [[60, 50], [260, 50], [260, 150], [60, 150]], 正方形: [[90, 30], [230, 30], [230, 170], [90, 170]], 正六邊形: Array.from({ length: 6 }, (_, i) => { const t = (i * 60 - 90) * Math.PI / 180; return [160 + 80 * Math.cos(t), 100 + 80 * Math.sin(t)]; }), 正三角形: Array.from({ length: 3 }, (_, i) => { const t = (i * 120 - 90) * Math.PI / 180; return [160 + 90 * Math.cos(t), 115 + 90 * Math.sin(t)]; }) }[q.name];
  frame(`這塊地磚叫${q.name}。<br>它算「正多邊形」嗎？先量邊，再量角。`, `<div id="fn"></div><div class="trail" id="ct"></div>`);
  const pic = (sides, angs) => { const n = SH.length; let s = `<svg class="g5" viewBox="0 0 320 200"><polygon points="${polyStr(SH)}" fill="#fff0cf" stroke="#7a5b2e" stroke-width="3"/>`; const c = [SH.reduce((a, p) => a + p[0], 0) / n, SH.reduce((a, p) => a + p[1], 0) / n]; SH.forEach((p, i) => { const r = SH[(i + 1) % n], l = SH[(i + n - 1) % n], m = [(p[0] + r[0]) / 2, (p[1] + r[1]) / 2]; if (sides) s += `<text x="${m[0] + (m[0] - c[0]) * .12}" y="${m[1] + (m[1] - c[1]) * .12 + 5}" text-anchor="middle" class="ax">${Math.round(Math.hypot(p[0] - r[0], p[1] - r[1]) / 10)}</text>`; if (angs) s += `<text x="${p[0] + (c[0] - p[0]) * .3}" y="${p[1] + (c[1] - p[1]) * .3 + 5}" text-anchor="middle" class="tv3">${Math.round(ptAng(l, p, r))}°</text>`; }); return s + '</svg>'; };
  setEl('fn', pic(false, false));
  gate(q, ['📏 量每一邊', '📐 量每個角'], 2, k => { setEl('fn', pic(true, k === 2)); setEl('ct', k === 1 ? '邊都量好了，再量角' : q.why); }, () => pickOne(['是', '不是'], q.ans === '是' ? 0 : 1, '邊和角都要各自一樣才算。', `對了！${q.name}${q.why}，所以${q.ans}正多邊形。`, 'regular'));
}

/* ---------- 四：披薩切分室 ---------- */
function viewExt(q) {
  const F = q.food, nm = F && F[0];
  if (q.mode === 'slice') {
    frame(`${fracHtml(q.a, q.n)} ${F[2]}${nm}。把每一塊再切細，<br>切成一共 ${q.D} 塊，是幾塊？`, `<div class="vs" id="fd">${foodSvg(F, q.n, q.a)}</div><div class="trail" id="ct">拖動或點按鈕，切細一次</div>${padHidden()}`);
    const ask = () => stepKeypad([`塗色的現在是幾塊（${q.D} 塊裡的幾塊）？`], [q.ans], `數塗色的塊數，本來 1 塊變成 ${q.k} 小塊。`, `對了！${q.a}/${q.n}＝${q.ans}/${q.D}。分子分母一起變 ${q.k} 倍，份量還是一樣多。`, 'slice');
    return gate(q, '每塊再切一刀', q.k - 1, k => { setEl('fd', foodSvg(F, q.n * (k + 1), q.a * (k + 1))); setEl('ct', `每塊切成 ${k + 1} 小塊，全部 ${q.n * (k + 1)} 塊`); }, ask, { el: document.getElementById('fd'), map: x => x * q.k });
  }
  if (q.mode === 'merge') {
    frame(`${fracHtml(q.a, q.n)} ${F[2]}${nm}。切得太碎了，<br>每 ${q.g} 塊併成 1 大塊。`, `<div class="vs" id="fd">${foodSvg(F, q.n, q.a)}</div>${padHidden()}`);
    const ask = () => stepKeypad(['現在全部切成幾大塊？', '塗色的是幾大塊？'], [q.n0, q.a0], `${q.n} 塊每 ${q.g} 塊併起來，就看 ${q.n}÷${q.g}。`, `對了！${q.a}/${q.n}＝${q.a0}/${q.n0}，分子分母一起除以 ${q.g}。這叫約分。`, 'merge');
    return gate(q, `每 ${q.g} 塊併起來`, 1, () => setEl('fd', foodSvg(F, q.n0, q.a0)), ask, { el: document.getElementById('fd'), map: x => x * 1.3 });
  }
  if (q.mode === 'lowest') {
    let a = q.a, n = q.n;
    frame(`${fracHtml(q.a, q.n)} 片巧克力。一直合併，<br>併到不能再併為止。點能併的數。`, `<div class="vs" id="fd"></div><div class="u-count" id="now"></div><div class="chips" id="pk">${[2, 3, 5].map(v => `<button class="chip" data-g="${v}">每 ${v} 塊併</button>`).join('')}</div>${padHidden()}`);
    const draw = () => { setEl('fd', foodSvg(F, n, a)); setEl('now', fracHtml(a, n)); };
    const ask = () => stepKeypad(['最簡分數的分母是？', '分子是？'], [q.n0, q.a0], '分子分母一起除以同一個數，除到只剩 1 才能除為止。', `對了！${q.a}/${q.n}＝${q.a0}/${q.n0}。分子和分母只剩公因數 1，叫最簡分數。`, 'lowest');
    if (isFast(q)) { document.getElementById('pk').hidden = true; draw(); return afterAct(ask); }
    draw();
    document.querySelectorAll('[data-g]').forEach(b => b.onclick = () => {
      const g = +b.dataset.g;
      if (a % g || n % g) { sfx.retry(); R.tries++; return setMsg(`${a} 和 ${n} 不能同時被 ${g} 分完。`, 'hint'); }
      a /= g; n /= g; sfx.hop(); draw();
      if (Logic.gcd(a, n) === 1) { setMsg('不能再併了！', 'good'); document.getElementById('pk').hidden = true; finish(graded(), 'lowest', `對了！${q.a}/${q.n}＝${a}/${n}，這是最簡分數。`); }
    });
    return;
  }
  if (q.mode === 'common' || q.mode === 'cmp') {
    let x = q.mode === 'cmp' && isFast(q) ? q.D / q.n : 1, y = q.mode === 'cmp' && isFast(q) ? q.D / q.m : 1;
    frame(`${fracHtml(q.a, q.n)} ${F[2]}和 ${fracHtml(q.b, q.m)} ${F[2]}${nm}，塊的大小不一樣。<br>${q.mode === 'cmp' ? '想比大小' : '要加起來'}，先把兩個切成一樣細。`, `<div class="vs two5"><button class="fd5" id="l"></button><button class="fd5" id="r"></button></div><div class="trail" id="ct">點一${F[2]}${nm}，每塊再多切一刀</div><div class="odo two"><button class="turn" id="bk">還原</button></div>${padHidden()}`);
    let done = false;
    const draw = () => { setEl('l', foodSvg(F, q.n * x, q.a * x) + `<small>切成 ${q.n * x} 塊</small>`); setEl('r', foodSvg(F, q.m * y, q.b * y) + `<small>切成 ${q.m * y} 塊</small>`); };
    const ask = () => { const D = q.n * x, A = q.a * x, B = q.b * y; if (q.mode === 'cmp') return lrChoices('', '', q.ans, '塊一樣大了，數塗色的塊數。', `對了！${A}/${D} 和 ${B}/${D}，塊一樣大，${A === B ? '一樣多' : `${A > B ? '左邊' : '右邊'}塊數多`}。`, true); stepKeypad([`左邊的塗色現在是幾塊？`, `右邊的塗色現在是幾塊？`], [A, B], '塊的數目跟著切細變多了，數數看。', `對了！${q.a}/${q.n}＝${A}/${D}，${q.b}/${q.m}＝${B}/${D}。分母一樣了，叫通分。`, 'common'); };
    const check = () => { draw(); if (q.n * x === q.m * y && !done) { done = true; setMsg(`都切成 ${q.n * x} 塊了！`, 'good'); document.getElementById('bk').hidden = true; document.getElementById('l').disabled = document.getElementById('r').disabled = true; document.getElementById('actions').innerHTML = ''; afterAct(ask); } };
    if (isFast(q)) { x = q.D / q.n; y = q.D / q.m; return check(); }
    draw();
    const cap = 24;
    document.getElementById('l').onclick = () => { if (q.n * (x + 1) > cap) return setMsg('太細了，按還原重來。想想兩邊怎樣才一樣。', 'hint'); x++; sfx.hop(); check(); };
    document.getElementById('r').onclick = () => { if (q.m * (y + 1) > cap) return setMsg('太細了，按還原重來。想想兩邊怎樣才一樣。', 'hint'); y++; sfx.hop(); check(); };
    document.getElementById('bk').onclick = () => { x = y = 1; sfx.hop(); draw(); };
    return;
  }
  if (q.mode === 'dec') {
    frame(`${q.ctx}切成 100 格。<br>塗 ${fracHtml(q.a, q.n)}，再用小數說說看。`, `<div id="hb">${hundred(0)}</div><div class="trail" id="ct">先把 100 格分成 ${q.n} 份</div>`);
    const ask = () => pickOne(q.options, q.options.indexOf(q.dec), '100 格塗了幾格？1 格是 0.01。', `對了！${q.a}/${q.n}＝${q.up}/100＝${q.dec}。同一個量，分數和小數都能說。`, 'dec');
    return gate(q, `塗 1 份（${100 / q.n} 格）`, q.a, k => { setEl('hb', hundred(k * 100 / q.n)); setEl('ct', `塗了 ${k * 100 / q.n} 格`); }, ask, { el: document.getElementById('hb'), map: x => x * q.a * 1.15 });
  }
  const [A, B, un, ea, eb, same] = q.r;
  frame(`${A} ${q.a} ${un}配${B} ${q.b} ${un}。<br>要${same}，${A}變成 ${q.a * q.k} ${un}，${B}要幾${un}？<br>一批一批加。`, `<div class="batch" id="bt"></div><div class="trail" id="ct"></div>${padHidden()}`);
  const row = () => `<div class="brow">${ea.repeat(q.a)}<b>｜</b>${eb.repeat(q.b)}</div>`;
  const ask = () => stepKeypad([`${B}要幾${un}？`, `${A}占全部的 ${q.a}/${q.t}，現在是 ${q.t * q.k} 裡的幾${un}？`], [q.ans, q.a * q.k], `每批都有 ${q.a} ${un}${A}、${q.b} ${un}${B}，共 ${q.k} 批。`, `對了！${q.a}/${q.t}＝${q.a * q.k}/${q.t * q.k}。兩樣都變 ${q.k} 倍，${same}。`, 'recipe');
  setEl('bt', row()); setEl('ct', '現在 1 批');
  gate(q, '再加一批', q.k - 1, k => { setEl('bt', row().repeat(k + 1)); setEl('ct', `現在 ${k + 1} 批：${A} ${q.a * (k + 1)} ${un}、${B} ${q.b * (k + 1)} ${un}`); }, ask);
}

/* ---------- 五：對摺設計坊 ---------- */
const G5 = { u: 27, cx: 160, cy: 125 };
const gp = p => [G5.cx + p[0] * G5.u, G5.cy + p[1] * G5.u];
function gridBg(extra) { let s = '<svg class="g5" viewBox="0 0 320 250">'; for (let x = -5; x <= 5; x++) s += `<line x1="${gp([x, -4])[0]}" x2="${gp([x, -4])[0]}" y1="${gp([x, -4])[1]}" y2="${gp([x, 4])[1]}" stroke="#e5e9f0"/>`; for (let y = -4; y <= 4; y++) s += `<line x1="${gp([-5, y])[0]}" x2="${gp([5, y])[0]}" y1="${gp([0, y])[1]}" y2="${gp([0, y])[1]}" stroke="#e5e9f0"/>`; return s + extra + '</svg>'; }
const fullShape = (half, o) => { const m = o === 'h' ? half.map(p => [p[0], -p[1]]) : half.map(p => [-p[0], p[1]]); return half.concat(m.slice(o === 'h' ? 1 : 1, -1).reverse()); };
function viewSym(q) {
  if (q.mode === 'axis') {
    const v = q.shape.o === 'v', pts = fullShape(q.shape.half, q.shape.o).map(p => v ? [p[0] + q.off, p[1]] : [p[0], p[1] + q.off]);
    frame(`${q.shape.name}的圖案要對摺剪紙。<br>拖紅色摺線，摺起來兩邊要完全重疊。`, `<div id="gr"></div><div class="odo two"><button class="turn" id="a">${v ? '◀ 往左' : '▲ 往上'}</button><button class="turn" id="b">${v ? '往右 ▶' : '往下 ▼'}</button></div>`);
    let p = 0;
    const draw = () => { const g = pts.map(k => v ? [2 * p - k[0], k[1]] : [k[0], 2 * p - k[1]]); const l = v ? [gp([p, -4]), gp([p, 4])] : [gp([-5, p]), gp([5, p])]; setEl('gr', gridBg(`<polygon points="${polyStr(pts.map(gp))}" fill="#a9d0f0" stroke="#2f5f9e" stroke-width="2"/><polygon points="${polyStr(g.map(gp))}" fill="#f4a9a0" fill-opacity=".45" stroke="#d6476b" stroke-dasharray="5 4"/><line x1="${l[0][0]}" y1="${l[0][1]}" x2="${l[1][0]}" y2="${l[1][1]}" stroke="#d6476b" stroke-width="4"/>`)); };
    draw();
    dragOn(document.getElementById('gr'), (x, y) => { const nv = v ? clamp(Math.round((x * 320 - G5.cx) / G5.u), -4, 4) : clamp(Math.round((y * 250 - G5.cy) / G5.u), -3, 3); if (nv !== p) { p = nv; sfx.hop(); draw(); } });
    document.getElementById('a').onclick = () => { p = Math.max(v ? -4 : -3, p - 1); sfx.hop(); draw(); };
    document.getElementById('b').onclick = () => { p = Math.min(v ? 4 : 3, p + 1); sfx.hop(); draw(); };
    actionBtn('ok', '就摺這裡').onclick = () => {
      if (p === q.off) return finish(graded(), 'axis', '對了！摺起來完全重疊，這條線就叫對稱軸。');
      if (miss()) { p = q.off; draw(); return finish(0, { wrong: p, ans: q.off }, '摺在這裡才會完全重疊。'); }
      setMsg('粉紅的影子和藍色還沒疊好，再移一點。', 'hint');
    };
    return;
  }
  if (q.mode === 'count') {
    const s = Logic.SYM_SHAPES[q.name];
    const pic = a => { let x = `<svg class="g5" viewBox="0 0 200 200"><polygon points="${polyStr(s.pts)}" fill="#a9d0f0" stroke="#2f5f9e" stroke-width="2"/>`; if (a !== undefined) { const g = s.pts.map(p => Logic.reflect(p, s.c, a)), t = a * Math.PI / 180, dx = 100 * Math.cos(t), dy = 100 * Math.sin(t); x += `<polygon points="${polyStr(g)}" fill="#f4a9a0" fill-opacity=".45" stroke="#d6476b" stroke-dasharray="4 3"/><line x1="${s.c[0] - dx}" y1="${s.c[1] - dy}" x2="${s.c[0] + dx}" y2="${s.c[1] + dy}" stroke="#d6476b" stroke-width="3"/>`; } return x + '</svg>'; };
    frame(`${s.o}是${q.name}。<br>每一種摺法都摺摺看，有幾條對稱軸？`, `<div class="vs" id="sp">${pic()}</div><div class="trail" id="ct"></div><div class="chips" id="rc"></div>${padHidden()}`);
    const rc = [];
    return gate(q, s.tryA.map((_, i) => `摺第 ${i + 1} 種`), s.tryA.length, k => { const a = s.tryA[k - 1], ok = Logic.samePts(s.pts, s.pts.map(p => Logic.reflect(p, s.c, a))); setEl('sp', pic(a)); rc.push(ok); setEl('ct', ok ? '完全重疊！' : '沒有重疊'); setEl('rc', rc.map(o => `<span class="chip ${o ? 'on' : 'dim'}">${o ? '○' : '✕'}</span>`).join('')); }, () => stepKeypad(['有幾條對稱軸？（沒有就按 0）'], [q.ans], '數一數摺起來完全重疊的有幾種。', q.ans ? `對了！${q.name}有 ${q.ans} 條對稱軸。` : `對了！${q.name}怎麼摺都疊不起來，沒有對稱軸。`, 'count'));
  }
  if (q.mode === 'point') {
    const pts = fullShape(q.half, 'v');
    frame(`紅點摺過去會碰到哪裡？<br>點出它的對稱點。`, `<div id="gr"></div><div class="trail" id="ct">直的紅線是對稱軸</div>`);
    const base = extra => gridBg(`<polygon points="${polyStr(pts.map(gp))}" fill="#fff0cf" stroke="#7a5b2e" stroke-width="2"/><line x1="${gp([0, -4])[0]}" y1="${gp([0, -4])[1]}" x2="${gp([0, 4])[0]}" y2="${gp([0, 4])[1]}" stroke="#d6476b" stroke-width="3"/><circle cx="${gp(q.p)[0]}" cy="${gp(q.p)[1]}" r="9" fill="#d6476b"/>${extra || ''}`);
    setEl('gr', base());
    const el = document.getElementById('gr'); el.classList.add('drag-prot');
    el.onclick = e => {
      const b = el.querySelector('svg').getBoundingClientRect(), X = Math.round(((e.clientX - b.left) / b.width * 320 - G5.cx) / G5.u), Y = Math.round(((e.clientY - b.top) / b.height * 250 - G5.cy) / G5.u);
      if (X === q.ans[0] && Y === q.ans[1]) { el.onclick = null; const a = gp(q.p), c = gp(q.ans); setEl('gr', base(`<circle cx="${c[0]}" cy="${c[1]}" r="9" fill="#3fae5a"/><line x1="${a[0]}" y1="${a[1]}" x2="${c[0]}" y2="${c[1]}" stroke="#3fae5a" stroke-dasharray="5 4" stroke-width="2"/>`)); return finish(graded(), 'point', `對了！兩個點到對稱軸都是 ${Math.abs(q.p[0])} 格，連線和對稱軸垂直。`); }
      if (miss()) { el.onclick = null; const c = gp(q.ans); setEl('gr', base(`<circle cx="${c[0]}" cy="${c[1]}" r="9" fill="#3fae5a"/>`)); return finish(0, { wrong: [X, Y], ans: q.ans }, '綠點才是。一樣高，到紅線一樣遠。'); }
      setMsg(Y !== q.p[1] ? '對摺時點不會往上往下跑，要一樣高。' : `紅點離對稱軸 ${Math.abs(q.p[0])} 格，另一邊也要一樣遠。`, 'hint');
    };
    return;
  }
  if (q.mode === 'half') {
    const need = q.half.filter(p => p[0] !== 0).map(p => [-p[0], p[1]]), on = new Set(isFast(q) ? need.slice(0, -1).map(p => p.join()) : []);
    frame(`設計圖只畫了右半邊。<br>點左邊的格子點，把另一半畫出來。`, `<div id="gr"></div><div class="trail" id="ct"></div>`);
    const draw = () => { const m = q.half.map(p => [-p[0], p[1]]).filter(p => p[0] === 0 || on.has(p.join())); setEl('gr', gridBg(`<polygon points="${polyStr(fullShape(q.half, 'v').map(gp))}" fill="none" stroke="none"/><polyline points="${polyStr(q.half.map(gp))}" fill="none" stroke="#2f5f9e" stroke-width="4"/><polyline points="${polyStr(m.map(gp))}" fill="none" stroke="#d6476b" stroke-width="4"/><line x1="${gp([0, -4])[0]}" y1="${gp([0, -4])[1]}" x2="${gp([0, 4])[0]}" y2="${gp([0, 4])[1]}" stroke="#aab3c2" stroke-width="2" stroke-dasharray="5 4"/>${q.half.map(p => `<circle cx="${gp(p)[0]}" cy="${gp(p)[1]}" r="5" fill="#2f5f9e"/>`).join('')}${m.map(p => `<circle cx="${gp(p)[0]}" cy="${gp(p)[1]}" r="6" fill="#d6476b"/>`).join('')}`)); setEl('ct', `還要 ${need.length - on.size} 個點`); };
    draw();
    const el = document.getElementById('gr');
    const hit = (X, Y) => { const k = need.find(p => p[0] === X && p[1] === Y); if (k && !on.has(k.join())) { on.add(k.join()); sfx.hop(); draw(); if (on.size === need.length) { el.onclick = null; document.getElementById('actions').innerHTML = ''; finish(graded(), 'half', '對了！每個點都和另一邊的點對稱，圖形就對稱了。'); } return; } if (k) return; if (miss(4)) { need.forEach(p => on.add(p.join())); draw(); el.onclick = null; return finish(0, { wrong: [X, Y], ans: need[0] }, '正確的另一半在這裡。一個點一個點，一樣高、一樣遠。'); } setMsg('找一個藍點，看它離中線幾格，左邊也數一樣多格。', 'hint'); };
    el.onclick = e => { const b = el.querySelector('svg').getBoundingClientRect(); hit(Math.round(((e.clientX - b.left) / b.width * 320 - G5.cx) / G5.u), Math.round(((e.clientY - b.top) / b.height * 250 - G5.cy) / G5.u)); };
    actionBtn('gt', '幫我點一個').onclick = () => { const k = need.find(p => !on.has(p.join())); if (k) { R.tries = Math.max(R.tries, 1); hit(k[0], k[1]); } };
    return;
  }
  const P = q.name[1] ? [[160, 20], [230, 75], [160, 190], [90, 75]] : [[160, 30], [270, 170], [50, 170]], lab = q.name[1] ? { s: [(160 + 230) / 2 + 22, 45], s2: [(160 + 90) / 2 - 22, 45], x: [205, 92], x2: [115, 92] } : { s: [228, 95], s2: [92, 95], x: [228, 162], x2: [92, 162] };
  const pic = open => `<svg class="g5" viewBox="0 0 320 210"><polygon points="${polyStr(P)}" fill="#fff0cf" stroke="#7a5b2e" stroke-width="3"/><line x1="160" y1="10" x2="160" y2="200" stroke="#d6476b" stroke-width="3" stroke-dasharray="6 4"/>${q.tp === 'side' ? `<text x="${lab.s[0]}" y="${lab.s[1]}" text-anchor="middle" class="ax">${q.s}</text><text x="${lab.s2[0]}" y="${lab.s2[1]}" text-anchor="middle" class="tv3">${open ? q.s : '？'}</text>` : `<text x="${lab.x[0]}" y="${lab.x[1]}" text-anchor="middle" class="ax">${q.x}°</text><text x="${lab.x2[0]}" y="${lab.x2[1]}" text-anchor="middle" class="tv3">${open ? q.x + '°' : '？'}</text>`}</svg>`;
  frame(`${q.name[0]}，紅線是對稱軸。<br>沿著紅線摺起來，？是多少？`, `<div class="vs" id="sp">${pic(false)}</div>${padHidden()}`);
  gate(q, '沿對稱軸摺起來', 1, () => setEl('sp', `<svg class="g5" viewBox="0 0 320 210"><polygon points="${polyStr(P.map(p => p[0] < 160 ? [320 - p[0], p[1]] : p))}" fill="#ffe4b0" stroke="#7a5b2e" stroke-width="3"/><line x1="160" y1="10" x2="160" y2="200" stroke="#d6476b" stroke-width="3"/></svg>`), () => stepKeypad([`？是多少${q.tp === 'side' ? '公分' : '度'}？`], [q.ans], '摺起來兩邊完全重疊，被蓋住的那一邊和那一角是一樣的。', q.tp === 'side' ? `對了！它們是對稱邊，一樣長，都是 ${q.ans} 公分。` : `對了！它們是對稱角，一樣大，都是 ${q.ans} 度。`, 'prop'));
}

/* ---------- 六：燃料調配站 ---------- */
function viewUadd(q) {
  const v = q.v, unit = v[1], nm = v[0];
  const two = (ln, la, rn, rb, sep) => v[2] === 'cup' ? `<div class="vs two5"><span>${vesselSvg(v, ln, la)}</span><b class="plus">${sep}</b><span>${vesselSvg(v, rn, 0, rb)}</span></div>` : `<div class="ropes">${vesselSvg(v, ln, la)}<b>${sep}</b>${vesselSvg(v, rn, 0, rb)}</div>`;
  const redu = (a, n, sa, sn) => sa !== a ? `，約分成 ${sa}/${sn}` : '';
  if (q.mode === 'add' || q.mode === 'sub') {
    const add = q.mode === 'add', sign = add ? '＋' : '－', word = add ? '倒在一起' : `倒掉（用掉）${fracText(q.b, q.m)}`;
    frame(`${nm} ${fracHtml(q.a, q.n)} ${unit} ${sign} ${fracHtml(q.b, q.m)} ${unit}。<br>格子大小不一樣，不能直接${add ? '加' : '減'}。`, `<div id="vv">${two(q.n, q.a, q.m, q.b, sign)}</div><div class="trail" id="ct">先動手切</div>${padHidden()}`);
    const merged = add ? (q.S > q.D ? (v[2] === 'cup' ? `<div class="vs two5">${vesselSvg(v, q.D, q.D)}${vesselSvg(v, q.D, q.S - q.D)}</div>` : `<div class="ropes">${vesselSvg(v, q.D, q.D)}${vesselSvg(v, q.D, q.S - q.D)}</div>`) : `<div class="vs">${vesselSvg(v, q.D, q.A, q.B)}</div>`) : `<div class="vs">${vesselSvg(v, q.D, q.S)}</div>`;
    const steps = [q.D, q.S], asks = ['切成一樣細以後，一共分成幾格？', add ? '倒在一起是幾格？' : '還剩幾格？'];
    if (q.sa !== q.S) { asks.push('約分以後，分母是多少？'); steps.push(q.sn); }
    const ask = () => stepKeypad(asks, steps, '看圖數格子，每一格都一樣大了才能數。', `對了！${q.A}/${q.D} ${sign} ${q.B}/${q.D}＝${q.S}/${q.D}${redu(q.S, q.D, q.sa, q.sn)}。先切一樣細，才能數格子。`, q.mode);
    return gate(q, ['✂️ 切成一樣細', add ? '🫗 倒在一起' : '🫗 倒掉一些'], 2, k => { setEl('vv', k === 1 ? two(q.D, q.A, q.D, q.B, sign) : merged); setEl('ct', k === 1 ? `都切成 ${q.D} 格，${q.A} 格 ${sign} ${q.B} 格` : word); }, ask);
  }
  if (q.mode === 'mixed') {
    frame(`${mixedHtml(q.w1, q.a, q.n)} ＋ ${mixedHtml(q.w2, q.b, q.m)} ${unit}${nm}。<br>整的放一邊，零的放一邊。`, `<div class="wholes" id="wh"></div><div id="vv"></div><div class="trail" id="ct"></div>${padHidden()}`);
    setEl('wh', `<span class="wb">${q.w1}</span>＋<span class="wb">${q.w2}</span>`); setEl('vv', two(q.n, q.a, q.m, q.b, '＋'));
    const ask = () => stepKeypad(['整的共幾' + unit + '？', '切成一樣細是幾格？', `零的共幾格？`], [q.W, q.D, q.S], '整的和整的加，零的切一樣細再加。', `對了！${q.W} 又 ${q.S}/${q.D}${redu(q.S, q.D, q.sa, q.sn)} ${unit}。`, 'mixed');
    return gate(q, ['把整的合起來', '✂️ 零的切一樣細'], 2, k => { if (k === 1) setEl('wh', `<span class="wb">${q.w1 + q.w2}</span> ${unit}`); else setEl('vv', two(q.D, q.A, q.D, q.B, '＋')); }, ask);
  }
  if (q.mode === 'borrow') {
    frame(`${mixedHtml(q.w1, q.a, q.n)} － ${mixedHtml(q.w2, q.b, q.m)} ${unit}${nm}。<br>零的不夠減，怎麼辦？`, `<div class="wholes" id="wh"></div><div id="vv"></div><div class="trail" id="ct"></div>${padHidden()}`);
    setEl('wh', `整的 <span class="wb">${q.w1}</span>`); setEl('vv', two(q.n, q.a, q.m, q.b, '－'));
    const ask = () => stepKeypad(['剩下的零的是幾格？', '切成幾格算一整個？', '整的剩幾' + unit + '？'], [q.S, q.D, q.W], `拆開的 1 整個是 ${q.D} 格，${q.A}＋${q.D}＝${q.A + q.D} 格，再減 ${q.B} 格。整的用掉 ${q.w2}，又拆掉 1。`, `對了！${q.W} 又 ${q.S}/${q.D}${redu(q.S, q.D, q.sa, q.sn)} ${unit}。零的不夠，就拆 1 個整的。`, 'borrow');
    return gate(q, ['✂️ 切成一樣細', '拆開 1 個整的'], 2, k => { if (k === 1) { setEl('vv', two(q.D, q.A, q.D, q.B, '－')); setEl('ct', `${q.A} 格不夠減 ${q.B} 格`); } else { setEl('wh', `整的 <span class="wb">${q.w1 - 1}</span>，零的多了 ${q.D} 格`); setEl('vv', `<div class="vs">${vesselSvg(v, q.D, q.D)}${vesselSvg(v, q.D, q.A)}</div>`); setEl('ct', `現在是 ${q.A + q.D} 格，減得了 ${q.B} 格了`); } }, ask);
  }
  frame(`${nm}桶容量 1 ${unit}。<br>要裝 ${fracHtml(q.a, q.n)} 和 ${fracHtml(q.b, q.m)} ${unit}，裝得下嗎？`, `<div id="vv">${two(q.n, q.a, q.m, q.b, '＋')}</div><div class="trail" id="ct"></div>`);
  gate(q, ['✂️ 切成一樣細', '🫗 倒進 1 整桶'], 2, k => { if (k === 1) { setEl('vv', two(q.D, q.A, q.D, q.B, '＋')); setEl('ct', `${q.A} 格和 ${q.B} 格，一整桶是 ${q.D} 格`); } else { setEl('vv', `<div class="vs">${vesselSvg(v, q.D, Math.min(q.A, q.D), Math.min(q.B, q.D - q.A))}</div>`); setEl('ct', `共 ${q.A + q.B} 格，一整桶 ${q.D} 格`); } }, () => pickOne(['夠', '剛好', '不夠'], ['夠', '剛好', '不夠'].indexOf(q.ans), '比較倒進去的格數和一整桶的格數。', `對了！共 ${q.A + q.B}/${q.D}，${q.ans === '不夠' ? '超過 1，桶裝不下' : q.ans === '剛好' ? '剛好 1 整桶' : '比 1 少，裝得下'}。`, 'enough'));
}

/* ---------- 七：物資採購處 ---------- */
const scaleSvg = (l, r, tilt) => { const a = tilt * 8, cx = 160, cy = 40, L = 110, dy = L * Math.sin(a * Math.PI / 180), dx = L * Math.cos(a * Math.PI / 180); const pan = (x, y, t) => `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 40}" stroke="#7a5b2e" stroke-width="2"/><rect x="${x - 50}" y="${y + 40}" width="100" height="8" rx="4" fill="#a9702a"/><text x="${x}" y="${y + 32}" text-anchor="middle" class="tv2">${t}</text>`; return `<svg class="g5" viewBox="0 0 320 170"><rect x="${cx - 6}" y="${cy}" width="12" height="110" fill="#7a5b2e"/><rect x="${cx - 40}" y="150" width="80" height="10" rx="4" fill="#7a5b2e"/><line x1="${cx - dx}" y1="${cy + dy}" x2="${cx + dx}" y2="${cy - dy}" stroke="#33405a" stroke-width="6" stroke-linecap="round"/>${pan(cx - dx, cy + dy, l)}${pan(cx + dx, cy - dy, r)}</svg>`; };
function viewMix(q) {
  if (q.mode === 'write') {
    const toks = Logic.shuffle(q.right), used = [];
    frame(`${q.text}<br>把卡片排成一條算式。`, `<div class="pics5">${q.pic.repeat(Math.min(q.n, 9))}</div><div class="exp5" id="ex"></div><div class="chips" id="tk">${toks.map((t, i) => `<button class="chip tok" data-t="${i}">${t}</button>`).join('')}</div><div class="odo two"><button class="turn" id="un">退回一張</button><button class="turn" id="cl">全部重排</button></div>${padHidden()}`);
    const line = () => setEl('ex', used.length ? used.map(i => `<span class="num">${toks[i]}</span>`).join(' ') : '<span class="blank">先想：哪一段要先算？</span>');
    const ask = () => { ['un', 'cl'].forEach(x => { const e = document.getElementById(x); if (e) e.parentNode.hidden = true; }); document.getElementById('tk').hidden = true; stepKeypad(['這條算式算出來是多少？'], [q.ans], `${q.parts}。先乘除後加減，括號先算。`, `對了！${q.right.join(' ')}＝${q.ans}。`, 'write'); };
    if (isFast(q)) { q.right.forEach(x => { const i = toks.findIndex((t, k) => t === x && !used.includes(k)); used.push(i); }); line(); return afterAct(ask); }
    line();
    document.querySelectorAll('.tok').forEach(b => b.onclick = () => { const i = +b.dataset.t; used.push(i); b.disabled = true; sfx.hop(); line(); });
    document.getElementById('un').onclick = () => { const i = used.pop(); if (i !== undefined) { document.querySelector(`[data-t="${i}"]`).disabled = false; line(); } };
    document.getElementById('cl').onclick = () => { used.length = 0; document.querySelectorAll('.tok').forEach(b => { b.disabled = false; }); line(); };
    actionBtn('ok', '排好了').onclick = () => {
      const seq = used.map(i => toks[i]);
      if (seq.length !== toks.length) return setMsg('卡片還沒用完。', 'hint');
      const val = Logic.evalTokens(seq), mi = q.right.indexOf('×');
      if (val === q.ans) {
        const si = seq.indexOf('×');
        if (mi >= 0 && si >= 0 && seq[si - 1] === q.right[mi + 1] && seq[si + 1] === q.right[mi - 1]) { R.tries++; sfx.retry(); return setMsg('算得出來，可是我們把「每份量」寫在前面、「份數」寫在後面，換一下。', 'hint'); }
        setMsg('算式排好了！', 'good'); return afterAct(ask);
      }
      if (miss()) { document.querySelector('#actions').innerHTML = ''; used.length = 0; q.right.forEach(x => { const i = toks.findIndex((t, k) => t === x && !used.includes(k)); used.push(i); }); line(); setMsg(`算式是 ${q.right.join(' ')}。${q.parts}。`, 'hint'); R.tries = 2; return afterAct(ask); }
      setMsg(`這樣算出來不對。想想：${q.parts}。`, 'hint');
    };
    return;
  }
  if (q.mode === 'avg') {
    const L = q.lv2.slice(), [nm, un, e] = q.ctx;
    frame(`${e} ${q.n} 個${nm}高高低低。<br>按住高的，拖到低的，每次移 1 ${un}，把它們推平。`, `<div class="tanks" id="tk"></div><div class="trail" id="ct"></div>${padHidden()}`);
    let src = -1, over = false;
    const ask = () => stepKeypad(['全部有幾' + un + '？', '平均每個是幾' + un + '？'], [q.sum, q.avg], '先把全部加起來，再分成一樣多。', `對了！${q.lv2.join('＋')}＝${q.sum}，${q.sum}÷${q.n}＝${q.avg}。推平後的高度，就是平均。`, 'avg');
    const draw = () => { setEl('tk', L.map((v, i) => `<div class="tank ${i === src ? 'sel' : ''}" data-k="${i}"><div class="wtr">${'<i></i>'.repeat(v)}</div><b class="num">${v}</b></div>`).join('')); setEl('ct', L.every(x => x === L[0]) ? '一樣高了！' : '推到每個都一樣高'); };
    const move = (a, b) => { if (over || a === b || L[a] <= 0) return; L[a]--; L[b]++; sfx.hop(); src = -1; draw(); if (L.every(x => x === L[0])) { over = true; setMsg('都一樣高了！', 'good'); afterAct(ask); } };
    if (isFast(q)) { L.fill(q.avg); draw(); return afterAct(ask); }
    draw();
    const el = document.getElementById('tk'); el.classList.add('drag-prot');
    el.onpointerdown = e => { const t = e.target.closest('.tank'); if (!t) return; const i = +t.dataset.k; if (src >= 0 && src !== i) return move(src, i); src = i; draw(); e.preventDefault(); };
    el.onpointerup = e => { const t = document.elementFromPoint(e.clientX, e.clientY)?.closest('.tank'); if (t && src >= 0 && +t.dataset.k !== src) move(src, +t.dataset.k); };
    actionBtn('gt', '幫我移一格').onclick = () => move(L.indexOf(Math.max(...L)), L.indexOf(Math.min(...L)));
    return;
  }
  if (q.mode === 'dist') {
    const [A, B, un, u2] = q.ctx, W = 280, H = 26 * q.c > 150 ? 150 : 26 * q.c, cut = W * q.a / (q.a + q.b), brick = un === '排';
    frame(brick ? `每排 ${q.a} 塊紅磚和 ${q.b} 塊藍磚，鋪 ${q.c} 排，共幾塊？<br>拖紅線，把紅磚和藍磚切開。` : `${A} ${q.a} 元、${B} ${q.b} 元，買 ${q.c} 份，共幾元？<br>拖紅線，把${A}和${B}切開。`, `<div id="ds"></div>${padHidden()}`);
    const pic = t => { const x = cut * t; let s = `<svg class="g5" viewBox="-30 -24 330 ${H + 34}">`; s += `<rect width="${W}" height="${H}" fill="#fff0cf" stroke="#7a5b2e" stroke-width="2"/>`; if (t >= 1) { s += `<rect width="${cut}" height="${H}" fill="#f4a9a0" stroke="#7a5b2e"/><rect x="${cut}" width="${W - cut}" height="${H}" fill="#a9d0f0" stroke="#7a5b2e"/><text x="${cut / 2}" y="-8" text-anchor="middle" class="ax">${q.a}</text><text x="${cut + (W - cut) / 2}" y="-8" text-anchor="middle" class="ax">${q.b}</text>`; } else s += `<text x="${W / 2}" y="-8" text-anchor="middle" class="ax">${q.a}＋${q.b}</text>`; for (let i = 1; i < q.c; i++) s += `<line x1="0" x2="${W}" y1="${i * H / q.c}" y2="${i * H / q.c}" stroke="#7a5b2e" stroke-opacity=".35"/>`; s += `<text x="-8" y="${H / 2 + 5}" text-anchor="end" class="ax">${q.c}</text><line x1="${x}" x2="${x}" y1="-14" y2="${H + 6}" stroke="#d6476b" stroke-width="4"/><circle cx="${x}" cy="${H + 2}" r="9" fill="#ffd65a" stroke="#d6476b" stroke-width="2"/>`; return s + '</svg>'; };
    const ask = () => stepKeypad([`粉紅這塊：${q.a}×${q.c}＝？`, `藍色這塊：${q.b}×${q.c}＝？`, '合起來是多少？'], [q.a * q.c, q.b * q.c, q.ans], '一塊一塊算，整十的最好算。', `對了！（${q.a}＋${q.b}）×${q.c}＝${q.a}×${q.c}＋${q.b}×${q.c}＝${q.ans}。一整塊切成兩塊，總數不變。`, 'dist', null, { shortcut: true });
    return slideTo(q, 'ds', '✂️ 切開', t => setEl('ds', pic(t)), ask, x => (x * 330 - 30) / cut);
  }
  if (q.mode === 'near') {
    if (q.sub === 'four') {
      frame(`一包 25 顆，有 ${q.b} 包。<br>每 4 包放成一堆，一堆就是 100 顆。`, `<div class="crates" id="cr"></div><div class="trail" id="ct">原本算 25×${q.b}</div>${padHidden()}`);
      return gate(q, '再放一堆 4 包', q.k, k => { setEl('cr', Array.from({ length: k }, () => `<span class="crate"><b class="num">25×4</b><small>100 顆</small></span>`).join('')); setEl('ct', `放了 ${k} 堆`); }, () => stepKeypad(['25×4＝？', `全部幾顆？`], [100, q.ans], `${q.b} 包是 ${q.k} 堆，每堆 100 顆。`, `對了！25×${q.b}＝25×4×${q.k}＝100×${q.k}＝${q.ans}。算式可以換個樣子，算起來更快。`, 'near', null, { shortcut: true }));
    }
    frame(`${q.thing[0]} ${q.a} 元，買 ${q.c} ${q.thing[1]}。<br>假裝每${q.thing[1]}都付 ${q.big} 元，再拿回找的錢。`, `<div class="mrows" id="rw">${Array.from({ length: q.c }, (_, i) => `<div class="mrow5" id="r${i}"></div>`).join('')}</div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, [`每${q.thing[1]}先付 ${q.big} 元`, `每${q.thing[1]}找回 ${q.x} 元`], 2, k => { for (let i = 0; i < q.c; i++) setEl('r' + i, `<span class="bill">${q.big}</span>${k === 2 ? `<span class="back">－${q.x}</span>` : ''}`); setEl('ct', k === 1 ? `先付了 ${q.big}×${q.c}` : `一共找回 ${q.x}×${q.c}`); }, () => stepKeypad([`${q.big}×${q.c}＝？`, `${q.x}×${q.c}＝？`, '實際付多少元？'], [q.big * q.c, q.x * q.c, q.ans], '先付的減掉找回的。', `對了！${q.a}×${q.c}＝${q.big}×${q.c}－${q.x}×${q.c}＝${q.ans}。`, 'near', null, { shortcut: true }));
  }
  if (q.mode === 'chain') {
    const [un, b1, b2] = q.ctx;
    frame(`${q.a} ${un}，平分成 ${q.b} ${b1}，每${b1}再平分成 ${q.c} ${b2}。<br>每${b2}幾${un[0]}？`, `<div class="crates" id="cr"></div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, [`分成 ${q.b} ${b1}`, `每${b1}分成 ${q.c} ${b2}`], 2, k => { if (k === 1) { setEl('cr', Array.from({ length: q.b }, () => `<span class="crate"><b class="num">${q.a / q.b}</b><small>${b1}</small></span>`).join('')); setEl('ct', `${q.a}÷${q.b}`); } else { setEl('cr', Array.from({ length: q.b * q.c }, () => `<span class="crate mini"><b class="num">？</b></span>`).join('')); setEl('ct', `一共 ${q.b}×${q.c}＝${q.b * q.c} ${b2}`); } }, () => stepKeypad([`每${b1}幾${un[0]}？`, `每${b2}幾${un[0]}？`], [q.a / q.b, q.ans], `先分${b1}，再分${b2}。`, `對了！${q.a}÷${q.b}÷${q.c}＝${q.ans}，也等於 ${q.a}÷（${q.b}×${q.c}），因為一共分成 ${q.b * q.c} ${b2}。`, 'chain', null, { shortcut: true }));
  }
  if (q.mode === 'box') {
    const [nm, un, m] = q.ctx, seen = new Map();
    frame(`${nm} ${q.p} ${m}${q.base ? `，本來已經付了 ${q.base} ${m}運費` : ''}，要買幾${un}還沒決定。<br>還不知道的數用 □ 代替。拖黃鈕試試看。`, `<div class="u-count"><b class="num">□＝<span id="bx">1</span></b> ${un}</div><div id="sl"></div><table class="pv tb5" id="tb"></table>`);
    let t = 1;
    const ask = () => pickOne(q.options, q.options.indexOf(q.ok), `□ 換成 2、換成 3，看哪一條算式都對得上表。`, `對了！買 □ ${un}要 ${q.ok} ${m}。□ 是 ${q.t} 時，就是 ${q.ans} ${m}。`, 'box');
    const draw = () => { setEl('sl', sliderHtml('s4', (t - 1) / 8)); document.getElementById('bx').textContent = t; seen.set(t, q.base + q.p * t); const ks = [...seen.keys()].sort((a, b) => a - b); setEl('tb', `<tr><th>□</th>${ks.map(k => `<td class="num">${k}</td>`).join('')}</tr><tr><th>共幾${m}</th>${ks.map(k => `<td class="num">${seen.get(k)}</td>`).join('')}</tr>`); };
    if (isFast(q)) { [2, 3, q.t].forEach(k => seen.set(k, q.base + q.p * k)); draw(); return afterAct(ask); }
    let over = false;
    const check = () => { if (!over && seen.size >= 4) { over = true; setMsg('記下來的數，有什麼規律？', 'good'); afterAct(ask); } };
    draw();
    dragOn(document.getElementById('sl'), x => { const v = clamp(Math.round((x * 320 - 12) / 296 * 8) + 1, 1, 9); if (v !== t) { t = v; sfx.hop(); draw(); check(); } });
    actionBtn('gt', '□ 多 1').onclick = () => { t = t % 9 + 1; sfx.hop(); draw(); check(); };
    return;
  }
  const add = q.sub === 'add';
  frame(add ? `天平平衡：${q.ctx}（□ 公克）加 ${q.a} 公克的砝碼，和 ${q.c} 公克一樣重。<br>□ 是多少？` : `天平平衡：${q.n} 個一樣的${q.ctx}（每個 □ 公克），和 ${q.c} 公克一樣重。<br>□ 是多少？`, `<div id="sc"></div><div class="trail" id="ct"></div><div class="odo two"><button class="turn" id="lf">${add ? `只拿走左邊 ${q.a}` : '只分左邊'}</button><button class="turn" id="bt">${add ? `兩邊都拿走 ${q.a}` : `兩邊都分成 ${q.n} 份`}</button></div>${padHidden()}`);
  const L0 = add ? `□＋${q.a}` : `${'□'.repeat(q.n)}`, end = () => { setEl('sc', scaleSvg('□', add ? q.c - q.a : `${q.c}÷${q.n}`, 0)); setEl('ct', '還是平衡的！'); document.getElementById('lf').parentNode.hidden = true; afterAct(() => stepKeypad(['□ 是多少公克？'], [q.ans], add ? `右邊也拿走 ${q.a}，${q.c}－${q.a}。` : `右邊也分成 ${q.n} 份，${q.c}÷${q.n}。`, add ? `對了！□＋${q.a}＝${q.c}，兩邊都減 ${q.a}，□＝${q.ans}。` : `對了！□×${q.n}＝${q.c}，兩邊都分 ${q.n} 份，□＝${q.ans}。`, 'scale')); };
  setEl('sc', scaleSvg(L0, q.c, 0));
  if (isFast(q)) return end();
  setMsg('左右一樣重才平衡。試試看兩個按鈕。');
  document.getElementById('lf').onclick = () => { R.tries = Math.max(R.tries, 0); sfx.retry(); setEl('sc', scaleSvg('□', q.c, -1)); setEl('ct', '歪了！只動一邊就不平衡。'); };
  document.getElementById('bt').onclick = () => { sfx.ok(); end(); };
}

/* ---------- 八：土地裁切場 ---------- */
function viewPara(q) {
  if (q.mode === 'para') {
    const U = Math.min(26, 290 / (q.b + q.sh)), W = q.b * U, H = q.h * U, S = q.sh * U, x0 = 12, y0 = 16;
    frame(`${q.lot}是平行四邊形，底 ${q.b} 公尺，高 ${q.h} 公尺，斜邊 ${q.side} 公尺。<br>面積怎麼算？把左邊的三角形剪下來，往右拖。`, `<div id="pp"></div><div class="trail" id="ct"></div>${padHidden()}`);
    const svgH = H + 2 * y0 + 12;
    const pic = t => { const d = t * W; return `<svg class="g5" viewBox="0 0 ${x0 * 2 + W + S} ${svgH}"><polygon points="${x0 + S},${y0} ${x0 + W + S},${y0} ${x0 + W},${y0 + H} ${x0 + S},${y0 + H}" fill="#cfe6c6" stroke="#4a8a3e" stroke-width="2"/><polygon points="${x0 + d},${y0 + H} ${x0 + S + d},${y0} ${x0 + S + d},${y0 + H}" fill="#f4a9a0" stroke="#d6476b" stroke-width="2"/><line x1="${x0 + S}" x2="${x0 + S}" y1="${y0}" y2="${y0 + H}" stroke="#d6476b" stroke-width="2" stroke-dasharray="5 4"/><text x="${x0 + W / 2 + (t >= 1 ? S : 0)}" y="${y0 + H + 16}" text-anchor="middle" class="ax">${q.b}</text><text x="${x0 + S + 6}" y="${y0 + H / 2}" class="ax">${q.h}</text></svg>`; };
    return slideTo(q, 'pp', '✂️ 剪下來移過去', t => { setEl('pp', pic(t)); if (t >= 1) setEl('ct', '變成長方形了！'); }, () => stepKeypad(['長方形的面積是幾平方公尺？'], [q.ans], `變成的長方形，長是底、寬是高。斜邊 ${q.side} 用不到。`, `對了！平行四邊形面積＝底×高＝${q.b}×${q.h}＝${q.ans} 平方公尺。`, 'para'), x => x * (x0 * 2 + W + S) / W - .1);
  }
  if (q.mode === 'tri') {
    const U = Math.min(26, 290 / (q.b + q.sh)), W = q.b * U, H = q.h * U, S = q.sh * U, x0 = 12, y0 = 18, a = [x0, y0 + H], b = [x0 + W, y0 + H], c = [x0 + S, y0];
    frame(`${q.lot}是三角形，底 ${q.b} 公尺，高 ${q.h} 公尺。<br>複製一個一樣的，拖過來拼一拼。`, `<div id="pp"></div>${padHidden()}`);
    const pic = t => { const dx = (1 - t) * 30, dy = (1 - t) * -14; return `<svg class="g5" viewBox="0 0 ${x0 * 2 + W + S + 34} ${H + y0 + 32}"><polygon points="${polyStr([a, b, c])}" fill="#fff0cf" stroke="#7a5b2e" stroke-width="2"/><text x="${x0 + W / 2}" y="${y0 + H + 16}" text-anchor="middle" class="ax">${q.b}</text><g transform="translate(${dx} ${dy + 14 * 0})"><polygon points="${polyStr([b, [x0 + W + S, y0], c])}" fill="#a9d0f0" fill-opacity=".85" stroke="#2f5f9e" stroke-width="2"/></g><line x1="${c[0]}" x2="${c[0]}" y1="${y0}" y2="${y0 + H}" stroke="#d6476b" stroke-dasharray="5 4" stroke-width="2"/><text x="${c[0] + 5}" y="${y0 + H / 2 + 5}" class="ax">${q.h}</text></svg>`; };
    return slideTo(q, 'pp', '拼上去', t => setEl('pp', pic(t)), () => stepKeypad(['拼成的平行四邊形是幾平方公尺？', '一個三角形是幾平方公尺？'], [q.b * q.h, q.ans], '兩個一樣的三角形拼成平行四邊形，一個是它的一半。', `對了！三角形面積＝底×高÷2＝${q.b}×${q.h}÷2＝${q.ans} 平方公尺。`, 'tri', null, { shortcut: true }));
  }
  if (q.mode === 'slide') {
    const tri = q.tp === 'tri', U = Math.min(22, 240 / q.b), W = q.b * U, H = q.h * U > 130 ? 130 : q.h * U, x0 = 40, y0 = 20; let top = 70;
    frame(`${q.lot}是${tri ? '三角形' : '平行四邊形'}：底 ${q.b} 公尺，高 ${q.h} 公尺。<br>拖上面的黃點左右移，形狀變了，面積變了嗎？`, `<div id="pp"></div><div class="trail" id="ct"></div>${padHidden()}`);
    const draw = () => { const pts = tri ? [[x0, y0 + H], [x0 + W, y0 + H], [x0 + top, y0]] : [[x0, y0 + H], [x0 + W, y0 + H], [x0 + top + W, y0], [x0 + top, y0]]; const mxW = 320 + (tri ? 0 : W * .4); setEl('pp', `<svg class="g5" viewBox="0 0 ${mxW} ${H + y0 + 30}"><line x1="0" x2="${mxW}" y1="${y0}" y2="${y0}" stroke="#c9d1dd" stroke-dasharray="6 5"/><line x1="0" x2="${mxW}" y1="${y0 + H}" y2="${y0 + H}" stroke="#c9d1dd" stroke-dasharray="6 5"/><polygon points="${polyStr(pts)}" fill="#cfe6c6" stroke="#4a8a3e" stroke-width="2"/><line x1="${x0 + top}" x2="${x0 + top}" y1="${y0}" y2="${y0 + H}" stroke="#d6476b" stroke-width="3"/><text x="${x0 + top + 6}" y="${y0 + H / 2}" class="ax">高 ${q.h}</text><text x="${x0 + W / 2}" y="${y0 + H + 18}" text-anchor="middle" class="ax">底 ${q.b}</text><circle cx="${x0 + top}" cy="${y0}" r="12" fill="#ffd65a" stroke="#2f5f9e" stroke-width="3"/></svg>`); };
    const ask = () => stepKeypad(['面積是幾平方公尺？'], [q.ans], '底和高沒有變。斜邊不是高，高要和底垂直。', `對了！黃點怎麼移，底和高都一樣，面積都是 ${q.ans} 平方公尺。`, 'slide');
    draw(); setEl('ct', '斜邊變長變短，紅色的高有變嗎？');
    if (isFast(q)) return afterAct(ask);
    let n = 0, over = false; const el = document.getElementById('pp');
    const stop = () => { if (!over) { over = true; afterAct(ask); } };
    dragOn(el, x => { top = clamp(x * 320 - x0, 0, tri ? W : 150); draw(); if (++n === 8) { setMsg('底一樣、高一樣。', 'good'); stop(); } });
    actionBtn('gt', '移動黃點').onclick = () => { top = (top + 50) % (tri ? W : 150); sfx.hop(); draw(); if (++n >= 3) stop(); };
    return;
  }
  if (q.mode === 'trap') {
    const U = Math.min(20, 300 / (q.a + q.b)), A = q.a * U, B = q.b * U, H = q.h * U > 110 ? 110 : Math.max(q.h * U, 44), S = (B - A) / 2, x0 = 8, y0 = 20;
    frame(`${q.lot}是梯形：上底 ${q.a}、下底 ${q.b}、高 ${q.h} 公尺。<br>複製一個，轉半圈拼在旁邊。`, `<div id="pp"></div><div class="trail" id="ct"></div>${padHidden()}`);
    const T1 = [[x0, y0 + H], [x0 + B, y0 + H], [x0 + S + A, y0], [x0 + S, y0]], T2 = [[x0 + S + A, y0], [x0 + B, y0 + H], [x0 + B + A, y0 + H], [x0 + S + A + B, y0]];
    const pic = k => `<svg class="g5" viewBox="0 0 ${x0 * 2 + (A + B) + S + 4} ${H + y0 + 26}"><polygon points="${polyStr(T1)}" fill="#fff0cf" stroke="#7a5b2e" stroke-width="2"/>${k ? `<polygon points="${polyStr(T2)}" fill="#a9d0f0" stroke="#2f5f9e" stroke-width="2"/>` : ''}<text x="${x0 + B / 2}" y="${y0 + H + 16}" text-anchor="middle" class="ax">${q.b}</text><text x="${x0 + S + A / 2}" y="${y0 - 5}" text-anchor="middle" class="ax">${q.a}</text>${k ? `<text x="${x0 + B + A / 2}" y="${y0 + H + 16}" text-anchor="middle" class="tv3">${q.a}</text><text x="${x0 + S + A + B / 2}" y="${y0 - 5}" text-anchor="middle" class="tv3">${q.b}</text>` : ''}</svg>`;
    setEl('pp', pic(0));
    return gate(q, '複製一個拼上去', 1, () => { setEl('pp', pic(1)); setEl('ct', '拼成平行四邊形了，底是上底加下底'); }, () => stepKeypad(['拼成的平行四邊形，底是多少？', '平行四邊形面積是多少？', '一個梯形是多少？'], [q.s, q.s * q.h, q.ans], '底是上底＋下底；一個梯形是平行四邊形的一半。', `對了！梯形面積＝（上底＋下底）×高÷2＝（${q.a}＋${q.b}）×${q.h}÷2＝${q.ans} 平方公尺。`, 'trap', null, { shortcut: true }), { el: document.getElementById('pp'), map: x => x * 1.3 });
  }
  if (q.mode === 'sym') {
    const shp = { para: `<polygon points="70,30 280,30 230,130 20,130" fill="#cfe6c6" stroke="#4a8a3e" stroke-width="2"/><line x1="70" x2="70" y1="30" y2="130" stroke="#d6476b" stroke-width="2" stroke-dasharray="5 4"/><text x="120" y="150" text-anchor="middle" class="ax">底 ${q.b}</text><text x="76" y="85" class="ax">高 ${q.h}</text><text x="28" y="74" class="ax">${q.slant}</text>`, tri: `<polygon points="20,130 280,130 90,30" fill="#cfe6c6" stroke="#4a8a3e" stroke-width="2"/><line x1="90" x2="90" y1="30" y2="130" stroke="#d6476b" stroke-width="2" stroke-dasharray="5 4"/><text x="150" y="150" text-anchor="middle" class="ax">底 ${q.b}</text><text x="96" y="85" class="ax">高 ${q.h}</text><text x="30" y="74" class="ax">${q.slant}</text>`, trap: `<polygon points="20,130 280,130 220,30 80,30" fill="#cfe6c6" stroke="#4a8a3e" stroke-width="2"/><line x1="150" x2="150" y1="30" y2="130" stroke="#d6476b" stroke-width="2" stroke-dasharray="5 4"/><text x="150" y="150" text-anchor="middle" class="ax">下底 ${q.b}</text><text x="150" y="22" text-anchor="middle" class="ax">上底 ${q.a}</text><text x="156" y="85" class="ax">高 ${q.h}</text>` }[q.tp];
    const chips = Logic.shuffle(q.tp === 'trap' ? [q.a, q.b, q.h] : [q.b, q.h, q.slant]); const fill = {}; let idx = 0;
    frame(`公式可以用符號寫：面積＝<b class="num">${q.f}</b><br>${q.need.map(n => `${n[0]} 是${n[2]}`).join('，')}。把數字放進去。`, `<div class="vs"><svg class="g5" viewBox="0 0 300 160">${shp}</svg></div><div class="exp5" id="ex"></div><div class="chips" id="ck">${chips.map((c, i) => `<button class="chip" data-c="${i}">${c}</button>`).join('')}</div>${padHidden()}`);
    const line = () => { let s = q.f; q.need.forEach(n => { s = s.replace(n[0], fill[n[0]] !== undefined ? fill[n[0]] : `<em class="${q.need[idx] && q.need[idx][0] === n[0] ? 'cur' : ''}">${n[0]}</em>`); }); setEl('ex', `<span class="num">${s}</span>`); };
    const ask = () => stepKeypad(['算出來是多少？'], [q.ans], '括號先算，再由左往右乘除。', `對了！符號代表數，換上數字就是 ${q.ans} 平方公尺。`, 'sym');
    line();
    if (isFast(q)) { q.need.forEach(n => { fill[n[0]] = n[1]; }); idx = q.need.length; line(); document.getElementById('ck').hidden = true; return afterAct(ask); }
    document.querySelectorAll('[data-c]').forEach(b => b.onclick = () => {
      const v = chips[+b.dataset.c], cur = q.need[idx];
      if (v !== cur[1]) { sfx.retry(); R.tries++; return setMsg(`${cur[0]} 是${cur[2]}，看圖上哪個數是${cur[2]}。`, 'hint'); }
      fill[cur[0]] = v; idx++; sfx.hop(); b.disabled = true; line();
      if (idx === q.need.length) { document.getElementById('ck').hidden = true; afterAct(ask); }
    });
    return;
  }
  const U = Math.min(30, 300 / q.b);
  frame(`${q.lot}是長方形，面積 ${q.A} 平方公尺，長 ${q.b} 公尺。<br>寬還不知道，叫它 □。往下拖，一排一排鋪到 ${q.A} 塊。`, `<div id="pp"></div><div class="u-count"><b class="num" id="cn">0</b> 塊，寬 <b class="num" id="kw">？</b></div>${padHidden()}`);
  const pic = k => { let s = `<svg class="g5" viewBox="0 0 ${q.b * U + 8} ${q.h * U + 8}"><rect x="2" y="2" width="${q.b * U}" height="${q.h * U}" fill="#fff" stroke="#c9d1dd" stroke-dasharray="5 4"/>`; for (let r = 0; r < k; r++) for (let c = 0; c < q.b; c++) s += `<rect x="${2 + c * U}" y="${2 + r * U}" width="${U - 1}" height="${U - 1}" fill="#cfe6c6" stroke="#4a8a3e"/>`; return s + '</svg>'; };
  setEl('pp', pic(0));
  gate(q, '再鋪一排', q.h, k => { setEl('pp', pic(k)); document.getElementById('cn').textContent = k * q.b; document.getElementById('kw').textContent = k; }, () => stepKeypad(['□ 是多少公尺？'], [q.ans], `一排 ${q.b} 塊，幾排才有 ${q.A} 塊？`, `對了！${q.b}×□＝${q.A}，□＝${q.A}÷${q.b}＝${q.ans}。`, 'back'), { el: document.getElementById('pp'), map: (x, y) => y * q.h * 1.1 });
}

/* ---------- 九：工班排班室 ---------- */
function clockCut(n, a, label) { // 一整個鐘面切成 n 等分，塗 a 份
  const cx = 110, cy = 110, r = 92, P = t => `${cx + r * Math.sin(t * 2 * Math.PI)} ${cy - r * Math.cos(t * 2 * Math.PI)}`;
  let s = `<svg class="fit" viewBox="0 0 220 220"><circle cx="${cx}" cy="${cy}" r="${r + 8}" fill="#fff" stroke="#33405a" stroke-width="3"/>`;
  for (let i = 0; i < n; i++) s += `<path d="M${cx} ${cy}L${P(i / n)}A${r} ${r} 0 ${n === 1 ? 1 : 0} 1 ${P((i + 1) / n)}Z" fill="${i < a ? '#ffd65a' : '#f4f6fa'}" stroke="#7a8496" stroke-width="1.5"/>`;
  for (let m = 0; m < 12; m++) s += `<text x="${cx + (r - 14) * Math.sin(m / 12 * 2 * Math.PI)}" y="${cy - (r - 14) * Math.cos(m / 12 * 2 * Math.PI) + 5}" text-anchor="middle" class="ax">${(m || 12) * (label === 'm' ? 5 : 1)}</text>`;
  return s + '</svg>';
}
const workBars = (each, n, cap) => `<div class="wks">${Array.from({ length: n }, () => `<span class="wk" style="width:${Math.min(100, each / cap * 100)}%"></span>`).join('')}</div>`;
function viewTtime(q) {
  if (q.mode === 'cut') {
    const [T, big, small, nm] = q.u, frTxt = fracHtml(q.a, q.n);
    frame(`${q.ctx}要 ${frTxt} ${nm}，是幾${small}？<br>把鐘面切成 ${q.n} 等分。`, `<div class="vs" id="ck">${clockCut(1, 0, 'm')}</div><div class="trail" id="ct"></div>${padHidden()}`);
    const asks = q.a === 1 ? [`${frTxt.replace(/<[^>]+>/g, ' ').trim().split(' ').join('/')} ${nm}是幾${small}？`.replace(/\s+/, '')] : [`1 份是幾${small}？`, `${q.a} 份是幾${small}？`], steps = q.a === 1 ? [q.each] : [q.each, q.ans];
    return gate(q, ['切開', '塗上要的份數'], 2, k => { setEl('ck', clockCut(q.n, k === 2 ? q.a : 0, 'm')); setEl('ct', k === 1 ? `切成 ${q.n} 份，一整圈 ${T} ${small}` : `塗了 ${q.a} 份`); }, () => stepKeypad(asks, steps, `一整圈 ${T} ${small}，平分成 ${q.n} 份。`, `對了！1 ${big}＝${T} ${small}，${T}÷${q.n}＝${q.each}。${q.a} 份是 ${q.ans} ${small}。`, 'cut'), { el: document.getElementById('ck'), map: x => x * 2.4 });
  }
  if (q.mode === 'dec') {
    const whole = Math.floor(q.t / 10);
    frame(`${q.ctx}要 ${q.h} 小時，是幾分鐘？<br>把 1 小時切成 10 格，一格是 0.1 小時。`, `<div class="dbar" id="db"></div><div class="trail" id="ct"></div>${padHidden()}`);
    const draw = k => { let h = ''; const bars = Math.max(1, Math.ceil(q.t / 10)); for (let b = 0; b < bars; b++) h += `<div class="drow">${Array.from({ length: 10 }, (_, i) => `<i class="${b * 10 + i < k ? 'on' : ''}">${b * 10 + i < k ? '6' : ''}</i>`).join('')}</div>`; setEl('db', h); setEl('ct', `${(k / 10).toFixed(1)} 小時`); };
    draw(0);
    const [fa, fn] = Logic.simp(q.t, 10);
    return gate(q, '再塗一格', q.t, draw, () => stepKeypad(['0.1 小時是幾分鐘？', `${q.h} 小時是幾分鐘？`], [6, q.ans], `1 小時 60 分切成 10 格，一格是 60÷10。${q.h} 小時有 ${q.t} 格。`, `對了！${q.h} 小時＝${fa}/${fn} 小時＝${q.ans} 分。6×${q.t}＝${q.ans}。小數、分數都能說。`, 'dec', null, { shortcut: true }), q.t <= 10 ? { el: document.getElementById('db'), map: x => x * 10.5 } : undefined);
  }
  if (q.mode === 'mul') {
    const [B, Sm, T] = q.u;
    frame(`每班工作 ${q.big} ${B} ${q.small} ${Sm}，排 ${q.n} 班，共多久？<br>一班一班接起來。`, `<div class="wks" id="wk"></div><div class="trail" id="ct"></div>${padHidden()}`);
    const hint = `${q.small}×${q.n}＝${q.tot} ${Sm}，每 ${T} ${Sm}換成 1 ${B}。`;
    return gate(q, '再排一班', q.n, k => { setEl('wk', Array.from({ length: k }, () => `<div class="wk1"><span>${q.big} ${B}</span><span class="s">${q.small} ${Sm}</span></div>`).join('')); setEl('ct', `${k} 班：${q.big * k} ${B} ${q.small * k} ${Sm}`); }, () => stepKeypad([`${Sm}的部分共幾${Sm}？`, `換算好，全部是幾${B}（不滿 1 ${B}先不算）？`, `還剩幾${Sm}？`], [q.tot, q.B, q.Sm], hint, `對了！${q.big} ${B} ${q.small} ${Sm}×${q.n}＝${q.B} ${B} ${q.Sm} ${Sm}。`, 'mul'));
  }
  if (q.mode === 'div') {
    const [B, Sm, T] = q.u;
    frame(`${q.big} ${B} ${q.small} ${Sm}的工作，${q.n} 個${q.ctx}平分，每個做多久？`, `<div class="wks" id="wk"><div class="wk1 big"><span>${q.big} ${B} ${q.small} ${Sm}</span></div></div><div class="trail" id="ct">${B}不好分，先拆開</div>${padHidden()}`);
    return gate(q, [`把 ${B} 拆成 ${Sm}`, `平分成 ${q.n} 份`], 2, k => { if (k === 1) { setEl('wk', `<div class="wk1 big"><span class="s">${q.tot} ${Sm}</span></div>`); setEl('ct', `${q.big}×${T}＋${q.small}＝${q.tot}`); } else { setEl('wk', Array.from({ length: q.n }, () => `<div class="wk1"><span class="s">？ ${Sm}</span></div>`).join('')); setEl('ct', `${q.tot}÷${q.n}`); } }, () => stepKeypad([`全部是幾${Sm}？`, `每個是幾${Sm}？`], [q.tot, q.ans], `1 ${B}＝${T} ${Sm}。`, `對了！${q.tot}÷${q.n}＝${q.ans} ${Sm}，就是 ${Math.floor(q.ans / T)} ${B} ${q.ans % T} ${Sm}。`, 'div', null, { shortcut: true }));
  }
  const [B, Sm] = q.u;
  frame(`${q.ctx}要 ${q.big} ${B} ${q.small} ${Sm}。<br>${q.tb} ${B} ${q.ts} ${Sm}可以做幾次？`, `<div class="wks" id="wk"></div><div class="trail" id="ct"></div>${padHidden()}`);
  gate(q, '放一次', q.r, k => { setEl('wk', Array.from({ length: k }, () => `<div class="wk1"><span class="s">${q.each} ${Sm}</span></div>`).join('')); setEl('ct', `已經 ${q.each * k} ${Sm}，全部有 ${q.tb} ${B} ${q.ts} ${Sm}`); }, () => stepKeypad([`一次是幾${Sm}？`, `全部是幾${Sm}？`, '可以做幾次？'], [q.each, q.tot, q.r], `單位要一樣才能除，都換成${Sm}。`, `對了！${q.tot}÷${q.each}＝${q.r} 次。`, 'times', null, { shortcut: true }));
}

/* ---------- 十：貨櫃組裝場 ---------- */
function box3d(w, h, d, yaw, pit, o) { // 真的算三維，手指轉到哪就畫到哪
  o = o || {};
  const u = Math.min(150 / Math.hypot(w, d), 32), ya = yaw * Math.PI / 180, pi = pit * Math.PI / 180, cy = Math.cos(ya), sy = Math.sin(ya), cp = Math.cos(pi), sp = Math.sin(pi);
  const X = w / 2, Y = h / 2, Z = d / 2;
  const proj = ([x, y, z]) => { const x1 = x * cy + z * sy, z1 = -x * sy + z * cy, y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp; return [150 + x1 * u, 115 - y1 * u, z2]; };
  const F = [['#f4a9a0', [[-X, Y, -Z], [X, Y, -Z], [X, Y, Z], [-X, Y, Z]]], ['#f4a9a0', [[-X, -Y, -Z], [X, -Y, -Z], [X, -Y, Z], [-X, -Y, Z]]], ['#a9d0f0', [[-X, -Y, Z], [X, -Y, Z], [X, Y, Z], [-X, Y, Z]]], ['#a9d0f0', [[-X, -Y, -Z], [X, -Y, -Z], [X, Y, -Z], [-X, Y, -Z]]], ['#b7e0a8', [[X, -Y, -Z], [X, -Y, Z], [X, Y, Z], [X, Y, -Z]]], ['#b7e0a8', [[-X, -Y, -Z], [-X, -Y, Z], [-X, Y, Z], [-X, Y, -Z]]]];
  const faces = F.map((f, i) => { const P = f[1].map(proj); return { i, c: o.colors ? o.colors[i] : f[0], P, z: P.reduce((s, p) => s + p[2], 0) / 4 }; }).sort((a, b) => a.z - b.z);
  return `<svg class="g5" viewBox="0 0 300 230">${faces.map(f => `<polygon points="${f.P.map(p => `${p[0]},${p[1]}`).join(' ')}" fill="${f.c}" fill-opacity="${f.z < 0 ? .25 : 1}" stroke="#33405a" stroke-width="2" ${f.z < 0 ? 'stroke-dasharray="5 4"' : ''}/>`).join('')}</svg>`;
}
function foldNet(cells, t, o) { // t 0～1：沿著每條摺線真的摺起來
  o = o || {};
  const key = c => c.join(), idx = {}; cells.forEach((c, i) => { idx[key(c)] = i; });
  let root = 0, best = 99; cells.forEach((c, i) => { const m = Math.max(...cells.map(x => Math.abs(x[0] - c[0]) + Math.abs(x[1] - c[1]))); if (m < best) { best = m; root = i; } });
  const par = new Array(6).fill(-1), order = [root], seen = new Set([root]);
  for (let h = 0; h < order.length; h++) { const c = cells[order[h]]; for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const k = idx[key([c[0] + dr, c[1] + dc])]; if (k !== undefined && !seen.has(k)) { seen.add(k); par[k] = order[h]; order.push(k); } } }
  const quad = cells.map(([r, c]) => [[c, r, 0], [c + 1, r, 0], [c + 1, r + 1, 0], [c, r + 1, 0]]);
  const ang = t * Math.PI / 2, sub = i => { const out = [i]; order.forEach(k => { if (out.includes(par[k])) out.push(k); }); return out; };
  for (let h = order.length - 1; h > 0; h--) {
    const k = order[h], p = par[k], [r, c] = cells[k], [pr, pc] = cells[p], ux = c - pc, uy = r - pr;
    const a = ux === 1 ? [c, r, 0] : ux === -1 ? [c + 1, r, 0] : uy === 1 ? [c, r, 0] : [c, r + 1, 0], ax = [uy, -ux, 0]; // u×z
    const co = Math.cos(ang), si = Math.sin(ang);
    sub(k).forEach(j => { quad[j] = quad[j].map(P => { const v = [P[0] - a[0], P[1] - a[1], P[2] - a[2]], cr = [ax[1] * v[2] - ax[2] * v[1], ax[2] * v[0] - ax[0] * v[2], ax[0] * v[1] - ax[1] * v[0]], dt = ax[0] * v[0] + ax[1] * v[1] + ax[2] * v[2]; return [a[0] + v[0] * co + cr[0] * si + ax[0] * dt * (1 - co), a[1] + v[1] * co + cr[1] * si + ax[1] * dt * (1 - co), a[2] + v[2] * co + cr[2] * si + ax[2] * dt * (1 - co)]; }); });
  }
  const [rr, rc] = cells[root], Ox = rc + .5, Oy = rr + .5, a0 = -28 * Math.PI / 180 * t, p0 = (75 - 40 * t) * Math.PI / 180, ca = Math.cos(a0), sa = Math.sin(a0), sp = Math.sin(p0), cp = Math.cos(p0), U = 42 * (1 + .45 * t);
  const pr = ([x, y, z]) => { const X = x - Ox, Y = y - Oy, xx = X * ca - Y * sa, yy = X * sa + Y * ca; return [160 + xx * U, 120 + yy * sp * U - z * cp * U, yy * cp + z * sp]; };
  const C = ['#f7dc8c', '#a9d0f0', '#b7e0a8', '#f4c4d6', '#d8c7f0', '#f7c6a3'];
  const faces = quad.map((q, i) => { const P = q.map(pr); return { i, P, z: P.reduce((s, p) => s + p[2], 0) / 4 }; }).sort((a, b) => a.z - b.z);
  return `<svg class="g5" viewBox="0 0 320 250">${faces.map(f => { const cx = f.P.reduce((s, p) => s + p[0], 0) / 4, cy = f.P.reduce((s, p) => s + p[1], 0) / 4; return `<polygon points="${f.P.map(p => `${p[0]},${p[1]}`).join(' ')}" fill="${o.red === f.i ? '#e0455a' : C[f.i]}" stroke="#33405a" stroke-width="2"/>${o.labels ? `<text x="${cx}" y="${cy + 6}" text-anchor="middle" class="tv2">${o.labels[f.i]}</text>` : ''}`; }).join('')}</svg>`;
}
function viewCuboid(q) {
  if (q.mode === 'spin') {
    const words = { v: ['頂點', '個'], e: ['邊', '條'], f: ['面', '個'], par: ['和紅色面平行的面', '個'], per: ['和紅色面垂直的面', '個'] }[q.sub], rel = q.sub === 'par' || q.sub === 'per', cols = rel ? ['#fdeec6', '#fdeec6', '#e0455a', '#c8d7e8', '#fdeec6', '#fdeec6'] : null;
    frame(`${q.t[1]} 一個${q.t[0]}。用手指轉轉看。<br>${words[0]}有幾${words[1]}？`, `<div id="bx"></div><div class="trail" id="ct">虛線是看不到的那一面</div>${padHidden()}`);
    let yaw = 30, pit = 25, travel = 0, over = false;
    const ask = () => stepKeypad([`${words[0]}有幾${words[1]}？`], [q.ans], rel ? '繼續轉。不相碰、永遠一樣距離的是平行；相鄰、像牆和地板的是垂直。' : '繼續轉轉看，一面一面、上下兩圈數。', q.sub === 'par' ? '對了！對面的那一面和它平行，只有 1 面。' : q.sub === 'per' ? '對了！旁邊相鄰的 4 面都和它垂直。' : `對了！${q.t[0]}有 8 個頂點、12 條邊、6 個面。`, 'spin');
    const draw = () => setEl('bx', box3d(q.w, q.h, q.d, yaw, pit, { colors: cols }));
    draw();
    const el = document.getElementById('bx');
    let lx = null, ly = null;
    dragOn(el, (x, y) => { if (lx !== null) { const dx = x - lx, dy = y - ly; yaw += dx * 220; pit = clamp(pit + dy * 120, -70, 70); travel += Math.abs(dx * 220) + Math.abs(dy * 120); draw(); if (!over && travel > 80) { over = true; sfx.ok(); afterAct(ask); } } lx = x; ly = y; });
    el.addEventListener('pointerup', () => { lx = ly = null; });
    if (isFast(q)) { over = true; return afterAct(ask); }
    actionBtn('gt', '轉 45 度').onclick = () => { yaw += 45; travel += 45; sfx.hop(); draw(); if (!over && travel >= 90) { over = true; afterAct(ask); } };
    return;
  }
  if (q.mode === 'life') {
    const [t, a, e] = q.x, cols = a === '平行' ? ['#fdeec6', '#fdeec6', '#e0455a', '#e0455a', '#fdeec6', '#fdeec6'] : ['#e0455a', '#fdeec6', '#e0455a', '#fdeec6', '#fdeec6', '#fdeec6'];
    frame(`${e} ${t}，是平行還是垂直？<br>把它想成一個盒子，兩面塗紅色。`, `<div id="bx"></div>`);
    let yaw = 30; const draw = () => setEl('bx', box3d(4, 3, 3, yaw, 22, { colors: cols })); draw();
    return gate(q, '轉一下', 2, () => { yaw += 60; draw(); }, () => pickOne(['平行', '垂直'], a === '平行' ? 0 : 1, '兩面一直不會碰到，還是碰在一起成一個直角？', `對了！${t}${a}。`, 'life'), { el: document.getElementById('bx'), map: x => x * 2.4 });
  }
  if (q.mode === 'net') {
    frame('把紙盒的展開圖摺起來，<br>摺得成正方體嗎？往右拖摺摺看。', `<div id="nt"></div><div class="trail" id="ct"></div>`);
    return slideTo(q, 'nt', '摺起來', t => { setEl('nt', foldNet(q.cells, t)); if (t >= 1) setEl('ct', q.ans === '摺得起來' ? '六個面都圍起來了' : '有的面疊在一起，有的地方破了洞'); }, () => pickOne(['摺得起來', '摺不起來'], q.ans === '摺得起來' ? 0 : 1, '看看有沒有疊在一起的面。', q.ans === '摺得起來' ? '對了！六面剛好圍成正方體。' : '對了！有兩面疊在一起，一定會少一面。', 'net'));
  }
  if (q.mode === 'opp') {
    frame('展開圖摺成骰子，<br>紅色面的對面是哪一個數字？往右拖摺摺看。', `<div id="nt"></div>`);
    const lab = q.labels, cand = lab.filter((_, i) => i !== q.red);
    return slideTo(q, 'nt', '摺起來', t => setEl('nt', foldNet(q.cells, t, { red: q.red, labels: lab })), () => pickOne(cand.map(String), cand.indexOf(q.ans), '摺起來時，隔著一格的兩面會變成對面。', `對了！${q.ans} 和紅色面互相平行，是對面。`, 'opp'));
  }
  if (q.mode === 'area') {
    const u = Math.min(14, 280 / (2 * q.w + 2 * q.d)), W = q.w * u, D = q.d * u, H = q.h * u, y0 = 8;
    const rects = (k) => { const C = ['#f4a9a0', '#a9d0f0', '#b7e0a8'], R0 = [[D, y0 + D, W, H, 1], [D, y0 + D + H + D, W, H, 1], [D, y0, W, D, 0], [D, y0 + D + H, W, D, 0], [0, y0 + D, D, H, 2], [D + W, y0 + D, D, H, 2]]; return `<svg class="g5" viewBox="0 0 ${2 * D + W + 8} ${2 * D + 2 * H + y0 + 8}">${R0.map(r => `<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" fill="${r[4] < k ? C[r[4]] : '#f4f6fa'}" stroke="#33405a" stroke-width="1.5"/>`).join('')}</svg>`; };
    frame(`${q.t[1]} ${q.t[0]}長 ${q.w}、寬 ${q.d}、高 ${q.h} 公分。<br>要包住全部的面，要多少紙？拆開來看。`, `<div class="row5"><div id="b3">${box3d(q.w, q.h, q.d, 30, 25)}</div></div><div class="vs" id="nt">${rects(0)}</div><div class="trail" id="ct"></div>${padHidden()}`);
    const lab = [`上下兩面（${q.w}×${q.d}×2）`, `前後兩面（${q.w}×${q.h}×2）`, `左右兩面（${q.d}×${q.h}×2）`];
    return gate(q, ['塗上下兩面', '塗前後兩面', '塗左右兩面'], 3, k => { setEl('nt', rects(k)); setEl('ct', `${lab[k - 1]}`); }, () => { setEl('b3', ''); setMsg(`上下兩面是 ${q.top} 平方公分，先幫你算好。`); stepKeypad([`前後兩面 ${q.w}×${q.h}×2＝？`, `左右兩面 ${q.d}×${q.h}×2＝？`, '六個面全部是多少？'], [q.front, q.side, q.ans], '對面一樣大，一對一對算。', `對了！${q.top}＋${q.front}＋${q.side}＝${q.ans} 平方公分。這就是表面積，把六個面加起來。`, 'area', null, { shortcut: true }); });
  }
  frame(`${q.ctx}，每邊 ${q.a} 公分。<br>一面一面貼上去。`, `<div class="vs" id="fx"></div><div class="trail" id="ct"></div>${padHidden()}`);
  const net = [[0, 1], [1, 0], [1, 1], [1, 2], [1, 3], [2, 1]];
  setEl('fx', foldNet(net, 0));
  gate(q, '貼一面', 6, k => { setEl('fx', foldNet(net, k / 6)); setEl('ct', `貼了 ${k} 面`); }, () => stepKeypad(['一面是幾平方公分？', '六面共幾平方公分？'], [q.one, q.ans], `一面是正方形，六面都一樣大。`, `對了！${q.a}×${q.a}＝${q.one}，${q.one}×6＝${q.ans} 平方公分。`, 'cube', null, { shortcut: true }), { el: document.getElementById('fx'), map: x => x * 6.6 });
}

// 五下的工坊寫在 views5b.js，用 Object.assign(VIEWS, { fcalc: viewFcalc, ... }) 接上
const VIEWS = { line: viewLine, factor: viewFactor, poly: viewPoly, ext: viewExt, sym: viewSym, uadd: viewUadd, mix: viewMix, para: viewPara, ttime: viewTtime, cuboid: viewCuboid };
/* ---------- 五下共用 ---------- */
const D2 = { dot: true };
const barRow = (n, a, c) => `<div class="drow5" style="grid-template-columns:repeat(${n},1fr)">${Array.from({ length: n }, (_, i) => `<i style="${i < a ? `background:${c || '#ffd65a'}` : ''}"></i>`).join('')}</div>`;
function isoSvg(a, b, c, shown, o) { // 一塊一塊的積木：shown 畫幾塊（由下往上）
  const u = Math.min(26, 190 / (a + b)), dx = u * .87, dy = u * .5, h = u, W = (a + b) * dx, H = (a + b) * dy + c * h, col = (o && o.color) || ['#a9d0f0', '#6ea8dc', '#3f7fbe'];
  const P = (x, y, z) => [(x - y) * dx + b * dx + 6, (x + y) * dy - z * h + c * h + 6];
  const q = pts => pts.map(p => p.join(',')).join(' ');
  let s = `<svg class="iso5" viewBox="0 0 ${W + 12} ${H + 12}">`, k = 0;
  const total = shown === undefined ? a * b * c : shown;
  for (let z = 0; z < c; z++) for (let y = 0; y < b; y++) for (let x = 0; x < a; x++) { if (k++ >= total) continue; s += `<polygon points="${q([P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)])}" fill="${col[0]}" stroke="#33405a"/><polygon points="${q([P(x, y + 1, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x, y + 1, z)])}" fill="${col[1]}" stroke="#33405a"/><polygon points="${q([P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x + 1, y, z)])}" fill="${col[2]}" stroke="#33405a"/>`; }
  return s + '</svg>';
}

/* ---------- 十一：農場分糧處 ---------- */
function fgrid(b, d, a, c, st) { // 直切 b 份塗 a 份；橫切 d 份塗 c 份；st 第幾步
  const W = 300, H = 180, cw = W / b, rh = H / d; let s = `<svg class="g5" viewBox="-3 -3 306 186"><rect width="${W}" height="${H}" fill="#fff8e6"/>`;
  if (st >= 1) s += `<rect width="${a * cw}" height="${H}" fill="#f7dc8c"/>`;
  if (st >= 2) s += `<rect y="0" width="${W}" height="${c * rh}" fill="#a9d0f0" fill-opacity=".45"/><rect width="${a * cw}" height="${c * rh}" fill="#3fae5a"/>`;
  if (st >= 1) for (let i = 1; i < b; i++) s += `<line x1="${i * cw}" x2="${i * cw}" y1="0" y2="${H}" stroke="#7a5b2e"/>`;
  if (st >= 2) for (let i = 1; i < d; i++) s += `<line y1="${i * rh}" y2="${i * rh}" x1="0" x2="${W}" stroke="#2f5f9e"/>`;
  return s + `<rect width="${W}" height="${H}" fill="none" stroke="#33405a" stroke-width="3"/></svg>`;
}
function viewFcalc(q) {
  if (q.mode === 'share') {
    const [nm, un, who] = q.f;
    frame(`${q.n} ${un}${nm}要平分給 ${q.p} ${who}。<br>不夠每人一整${un}，怎麼分？`, `<div class="pies" id="pp">${Array.from({ length: q.n }, () => pieSvg(1, ['']).replace('class="pie"', 'class="pie mini5"')).join('')}</div><div class="plates" id="pl"></div><div class="trail" id="ct"></div>${padHidden()}`);
    const plates = k => setEl('pl', Array.from({ length: q.p }, () => `<span class="plate5">${k ? `<b class="num">${k}</b> 塊` : '🍽️'}</span>`).join(''));
    plates(0);
    return gate(q, [`每${un}都切成 ${q.p} 塊`, ...Array.from({ length: q.n }, (_, i) => `發第 ${i + 1} ${un}`)], q.n + 1, k => { const dealt = k - 1; setEl('pp', Array.from({ length: q.n }, (_, i) => pieSvg(q.p, new Array(q.p).fill(i < dealt ? 'g' : 'a')).replace('class="pie"', 'class="pie mini5"')).join('')); plates(dealt); setEl('ct', dealt ? `每人多拿 1 塊，1 塊是 1/${q.p} ${un}` : `1 塊是 1/${q.p} ${un}`); }, () => stepKeypad(['每人拿到幾塊？', `全部切成幾份才算 1 ${un}？`], [q.n, q.p], `1 ${un}切 ${q.p} 塊，每${un}每人拿 1 塊。`, `對了！${q.n}÷${q.p}＝${q.n}/${q.p} ${un}。分不完整的，商可以用分數說。`, 'share'));
  }
  if (q.mode === 'pack') {
    const [nm, un, box] = q.c, n = q.whole + (q.r ? 1 : 0);
    frame(`${q.a} ${un}${nm}，每 ${q.b} ${un}裝 1 ${box}。<br>可以裝幾${box}？一${box}一${box}裝。`, `<div id="bb">${barRow(q.a, 0)}</div><div class="trail" id="ct">一格是 1 ${un}</div>${padHidden()}`);
    return gate(q, `裝 1 ${box}`, n, k => { const used = Math.min(q.a, k * q.b); setEl('bb', barRow(q.a, used, k % 2 ? '#6ea8dc' : '#f0a03c')); setEl('ct', k <= q.whole ? `裝了 ${k} ${box}，還有 ${q.a - k * q.b} ${un}` : `剩 ${q.r} ${un}，只裝了這一${box}的 ${q.r}/${q.b}`); }, () => stepKeypad([`全部有幾${un}（分子）？`, `每${box}要幾${un}（分母）？`], [q.a, q.b], `${q.a} 裡有幾個 ${q.b}，就寫成 ${q.a}/${q.b}。`, `對了！${q.a}÷${q.b}＝${q.a}/${q.b} ${box}。${q.whole ? `就是 ${q.whole} ${box}多 ${q.r}/${q.b} ${box}。` : ''}`, 'pack'));
  }
  if (q.mode === 'of') {
    const [nm, un] = q.c;
    frame(`${q.n} ${nm}，拿走 ${fracHtml(q.a, q.d)}，是幾${un}？<br>先分成 ${q.d} 份。`, `<div class="grps" id="gg"></div><div class="trail" id="ct"></div>${padHidden()}`);
    const draw = st => setEl('gg', st ? Array.from({ length: q.d }, (_, i) => `<span class="grp ${st > 1 && i < q.a ? 'on' : ''}">${'●'.repeat(q.k)}</span>`).join('') : `<span class="grp">${'●'.repeat(q.n)}</span>`);
    draw(0);
    return gate(q, [`分成 ${q.d} 份`, `圈出 ${q.a} 份`], 2, k => { draw(k); setEl('ct', k === 1 ? `每份 ${q.k} ${un}` : `圈了 ${q.a} 份`); }, () => stepKeypad(['每份幾' + un + '？', `${q.a} 份是幾${un}？`], [q.k, q.ans], `${q.n}÷${q.d} 是一份，再乘 ${q.a} 份。`, `對了！${q.n}×${q.a}/${q.d}＝${q.ans}。「${q.n} 的 ${q.a}/${q.d}」就是 ${q.n} 的 ${q.a}/${q.d} 倍，${q.a < q.d ? '比原來小' : ''}。`, 'of'), { el: document.getElementById('gg'), map: x => x * 2.4 });
  }
  if (q.mode === 'times') {
    const [nm, un, box] = q.c, rows = Math.ceil(q.S / q.n);
    frame(`${nm} ${fracHtml(q.a, q.n)} ${un}，有 ${q.k} ${box}，共幾${un}？<br>一${box}一${box}倒進去。`, `<div id="bb"></div><div class="trail" id="ct"></div>${padHidden()}`);
    const draw = k => { const t = k * q.a; let h = ''; for (let r = 0; r < rows; r++) h += barRow(q.n, Math.max(0, Math.min(q.n, t - r * q.n)), '#6ea8dc'); setEl('bb', h); setEl('ct', `${k} ${box}：${t} 格，每條 ${q.n} 格是 1 ${un}`); };
    draw(0);
    const asks = [`共幾格（分子）？`, `幾格是 1 ${un}（分母）？`], steps = [q.S, q.n];
    return gate(q, `倒 1 ${box}`, q.k, draw, () => stepKeypad(asks, steps, `每${box} ${q.a} 格，${q.k} ${box}。分母不會變。`, `對了！${q.a}/${q.n}×${q.k}＝${q.S}/${q.n}${q.sa !== q.S ? `，約分成 ${q.sa}/${q.sn}` : ''} ${un}。`, 'times'));
  }
  if (q.mode === 'area') {
    const [nm, t1, t2] = q.t;
    frame(`${nm}的 ${fracHtml(q.a, q.b)} ${t1}，其中的 ${fracHtml(q.c, q.d)} ${t2}。<br>占${nm}的幾分之幾？先直切，再橫切。`, `<div class="vs" id="gd">${fgrid(q.b, q.d, q.a, q.c, 0)}</div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, ['直切，塗黃色', '橫切，塗藍色'], 2, k => { setEl('gd', fgrid(q.b, q.d, q.a, q.c, k)); setEl('ct', k === 1 ? `塗了 ${q.a}/${q.b}` : '黃藍重疊的是綠色'); }, () => stepKeypad(['全部切成幾格？', '綠色有幾格？'], [q.all, q.on], `直的 ${q.b} 份、橫的 ${q.d} 份；綠色是 ${q.a} 排 × ${q.c} 排。`, `對了！${q.a}/${q.b}×${q.c}/${q.d}＝${q.on}/${q.all}${q.sa !== q.on ? `，約分成 ${q.sa}/${q.sn}` : ''}。分子乘分子、分母乘分母。`, 'area'), { el: document.getElementById('gd'), map: (x, y) => x * 2.4 });
  }
  if (q.mode === 'fdiv') {
    const [nm, un, box] = q.c;
    frame(`${fracHtml(q.a, q.b)} ${un}${nm}，平分成 ${q.k} ${box}。<br>每${box}是幾${un}？切細就分得開。`, `<div id="bb">${barRow(q.b, q.a, '#6ea8dc')}</div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, [`每格切成 ${q.k} 小格`, `分給第 1 ${box}`], 2, k => { if (k === 1) { setEl('bb', barRow(q.D, q.a * q.k, '#6ea8dc')); setEl('ct', `1 ${un}變成 ${q.D} 小格，有 ${q.a * q.k} 小格`); } else { setEl('bb', barRow(q.D, q.a, '#f0a03c')); setEl('ct', `${q.a * q.k} 小格分 ${q.k} ${box}，一${box} ${q.a} 小格`); } }, () => stepKeypad([`1 ${un}現在是幾小格（分母）？`, '每' + box + '幾小格（分子）？'], [q.D, q.a], `每格切 ${q.k} 小格，分母變 ${q.b}×${q.k}。`, `對了！${q.a}/${q.b}÷${q.k}＝${q.a}/${q.D}，和 ${q.a}/${q.b}×1/${q.k} 一樣。平分成 ${q.k} 份，就是拿 1/${q.k}。`, 'fdiv'));
  }
  frame(`${q.N} 公斤的米，乘以 ${fracHtml(q.a, q.d)}。<br>答案會比 ${q.N} 大還是小？切開看。`, `<div id="bb">${barRow(q.d, q.d, '#f7dc8c')}</div><div id="b2"></div><div class="trail" id="ct">一條是 ${q.N} 公斤，切成 ${q.d} 份</div>`);
  gate(q, `取 ${q.a} 份`, 1, () => { const rows = Math.ceil(q.a / q.d); let h = ''; for (let r = 0; r < rows; r++) h += barRow(q.d, Math.min(q.d, q.a - r * q.d), '#3fae5a'); setEl('b2', h); setEl('ct', `每份 ${q.N / q.d} 公斤，${q.a} 份`); }, () => pickOne(['變小', '一樣', '變大'], ['變小', '一樣', '變大'].indexOf(q.ans), '比較綠色和上面的一整條。', `對了！${q.N}×${q.a}/${q.d}＝${q.R}。乘以比 1 小的數會變小，乘不一定變大。`, 'cmp'));
}

/* ---------- 十二：宇宙定位塔 ---------- */
function viewDecimal(q) {
  if (q.mode === 'chunk') {
    const ds = [...q.s];
    const pic = k => { const out = []; ds.forEach((d, i) => { const fromR = ds.length - i; if (i && fromR % 4 === 0 && (fromR / 4) <= k) out.push('<b class="cut5">｜</b>'); out.push(`<span class="dg">${d}</span>`); }); return `<div class="digits">${out.join('')}</div>`; };
    frame(`${q.what}：這個數好長！<br>從右邊開始，每 4 位切一刀，再念。`, `<div id="dd">${pic(0)}</div><div class="trail" id="ct">切開的地方，由右往左是萬、億、兆</div>`);
    return gate(q, ['切一刀（萬）', '再切一刀（億）', '再切一刀（兆）'].slice(0, q.cuts), q.cuts, k => setEl('dd', pic(k)), () => pickOne(q.options, q.options.indexOf(q.word), '看最左邊那一段前面是什麼單位。', `對了！念作 ${q.word}。每 4 位換一個新名字。`, 'chunk'), { el: document.getElementById('dd'), map: x => x * (q.cuts + .4) });
  }
  if (q.mode === 'thou') {
    frame(`${q.ctx} ${q.s} ${q.unit}。<br>1 太大了，一層一層拆開，看 ${q.s} 有幾個 0.001。`, `<div id="zz"></div><div class="trail" id="ct"></div>${padHidden()}`);
    const lv = [['1 整條', 1, 1], ['拆成 10 個 0.1', 10, 1], ['每個再拆 10 個 0.01', 10, 10], ['每個再拆 10 個 0.001', 10, 100]];
    const draw = k => { const dg = q.s.slice(2); let h = barRow(1, 1, '#a9d0f0'); if (k >= 1) h += barRow(10, +dg[0], '#6ea8dc'); if (k >= 2) h += barRow(10, +dg[1], '#f0a03c'); if (k >= 3) h += barRow(10, +dg[2], '#3fae5a'); setEl('zz', h); setEl('ct', k ? lv[k][0] + `，${q.s} 用了 ${dg[k - 1]} 個` : '最上面是 1'); };
    draw(0);
    return gate(q, ['拆成 0.1', '拆成 0.01', '拆成 0.001'], 3, draw, () => stepKeypad([`${q.s} 是幾個 0.001？`], [q.ans], `1 個 0.1 是 100 個 0.001，1 個 0.01 是 10 個 0.001。`, `對了！${q.s} 是 ${q.ans} 個 0.001。0.001 那一位叫千分位。`, 'thou'), { el: document.getElementById('zz'), map: x => x * 3.4 });
  }
  if (q.mode === 'point') {
    let p = 4;
    const val = () => p >= 4 ? q.ds.join('') : q.ds.slice(0, p).join('') + '.' + q.ds.slice(p).join('');
    const pic = () => { let s = `<svg class="g5" viewBox="0 0 320 110">`; const x = i => 40 + i * 64; q.ds.forEach((d, i) => { s += `<rect x="${x(i) - 26}" y="16" width="52" height="60" rx="6" fill="${i === q.i ? '#ffd65a' : '#fff'}" stroke="#33405a" stroke-width="2"/><text x="${x(i)}" y="58" text-anchor="middle" class="big5">${d}</text>`; }); const px = 8 + p * 64; return s + `<circle cx="${px}" cy="78" r="9" fill="#d6476b"/><circle cx="${px}" cy="78" r="17" fill="#d6476b" fill-opacity=".2"/></svg>`; };
    frame(`拖紅色的小數點，<br>讓黃色的 ${q.d} 落在<b>${q.place}</b>。`, `<div id="pt"></div><div class="u-count"><b class="num" id="vv"></b></div><div class="odo two"><button class="turn" id="a">◀ 往左</button><button class="turn" id="b">往右 ▶</button></div>`);
    const draw = () => { setEl('pt', pic()); document.getElementById('vv').textContent = val(); };
    draw();
    dragOn(document.getElementById('pt'), x => { const v = clamp(Math.round((x * 320 - 8) / 64), 1, 4); if (v !== p) { p = v; sfx.hop(); draw(); } });
    document.getElementById('a').onclick = () => { p = Math.max(1, p - 1); sfx.hop(); draw(); };
    document.getElementById('b').onclick = () => { p = Math.min(4, p + 1); sfx.hop(); draw(); };
    actionBtn('ok', '放好了').onclick = () => {
      if (p === q.p) return finish(graded(), 'point', `對了！變成 ${val()}，${q.d} 在${q.place}。小數點往左移一格，數就變成十分之一。`);
      if (miss()) { p = q.p; draw(); return finish(0, { wrong: p, ans: q.p }, `小數點在這裡，${q.d} 才在${q.place}。小數點左邊第一位是個位。`); }
      setMsg('小數點左邊第一位是個位，右邊第一位是十分位。數數看。', 'hint');
    };
    return;
  }
  if (q.mode === 'shift') {
    const times = q.op[0] === '×', steps = String(q.op[1]).length - 1, names = ['千', '百', '十', '個', '十分', '百分', '千分'];
    frame(`${q.thing} ${q.v} 公尺，${times ? '放大' : '縮小'}成 ${q.op[0]}${q.op[1]}。<br>數字往${times ? '左' : '右'}搬${steps}格。`, `<div id="pv5"></div>${padHidden()}`);
    const board = sh => { const s = String(q.v), [I, F = ''] = s.split('.'); const cells = new Array(7).fill(''); [...I].reverse().forEach((d, i) => { const k = 3 - i - (times ? sh : -sh); if (k >= 0 && k < 7) cells[k] = d; }); [...F].forEach((d, i) => { const k = 4 + i - (times ? sh : -sh); if (k >= 0 && k < 7) cells[k] = d; }); return `<table class="pv tb5"><tr>${names.map(n => `<th>${n}</th>`).join('')}</tr><tr>${cells.map((c, i) => `<td class="num ${i === 3 ? 'w' : ''}">${c}</td>`).join('')}</tr></table>`; };
    setEl('pv5', board(0));
    return gate(q, `搬一格`, steps, k => setEl('pv5', board(k)), () => stepKeypad([`${q.v}${q.op[0]}${q.op[1]}＝？（可以按小數點）`], [q.ans], '看定位板。空的位數要補 0。', `對了！${q.v}${q.op[0]}${q.op[1]}＝${q.ans}。每乘以 10，數字往左一位；每除以 10，往右一位。`, 'shift', null, D2));
  }
  if (q.mode === 'zero') {
    const m = q.op === '×', Nm = { 1: '十', 2: '百', 3: '千', 4: '萬', 5: '十萬' };
    const pack = (cnt, nm, c) => `<span class="pk5 ${c || ''}"><b class="num">${cnt}</b><small>個${nm}</small></span>`;
    if (m) {
      const [what, un, per] = q.ctx;
      frame(`${what} ${fmt(q.x)} ${un}，有 ${fmt(q.y)} ${per}，一共多少${un}？<br>先把大數包成一包一包。`, `<div class="pkrow" id="p1">${pack(fmt(q.x), '一', 'off')}<b>×</b>${pack(fmt(q.y), '一', 'off')}</div><div class="trail" id="ct"></div>${padHidden()}`);
      const left = () => pack(q.a, Nm[q.za]), right = c => pack(q.b, Nm[q.zb], c);
      return gate(q, [`把 ${fmt(q.x)} 包成 ${q.a} 個${Nm[q.za]}`, `把 ${fmt(q.y)} 包成 ${q.b} 個${Nm[q.zb]}`], 2, k => { setEl('p1', k === 1 ? `${left()}<b>×</b>${pack(fmt(q.y), '一', 'off')}` : `${left()}<b>×</b>${right()}`); setEl('ct', k === 1 ? `${fmt(q.x)}＝${q.a}×${10 ** q.za}` : `${fmt(q.y)}＝${q.b}×${10 ** q.zb}。包住的 ${10 ** q.za} 和 ${10 ** q.zb} 最後再乘回去`); }, () => stepKeypad([`先算 ${q.a}×${q.b}＝？`, `再乘回 ${10 ** q.za}×${10 ** q.zb}（共 ${q.n} 個 0），全部是多少？`], [q.core, q.ans], `包住的 0 共 ${q.n} 個，補回去。`, `對了！${fmt(q.x)}×${fmt(q.y)}＝${q.a}×${q.b}×${fmt(10 ** q.n)}＝${fmt(q.ans)} ${un}。`, 'zero', null, { shortcut: true }), { el: document.getElementById('p1'), map: x => x * 2.4 });
    }
    const [what, box, un] = q.ctx, zn = Nm[q.n];
    frame(`${fmt(q.x)} ${what}，每${box} ${fmt(q.y)} ${un}，可以裝幾${box}？<br>數字太大，先每 ${fmt(q.z)} ${un}包成一包。`, `<div class="pkrow" id="p1">${pack(fmt(q.x), '一', 'off')}<b>÷</b>${pack(fmt(q.y), '一', 'off')}</div><div class="crates" id="cr"></div><div class="trail" id="ct"></div>${padHidden()}`);
    const show = Math.min(q.ans, 24);
    return gate(q, [`每 ${fmt(q.z)} ${un}包一包`, `每 ${q.b} 包裝一${box}`], 2, k => { setEl('p1', `${pack(q.a, zn)}<b>÷</b>${pack(q.b, zn)}`); setEl('ct', k === 1 ? `全部 ${q.a} 包，每${box}要 ${q.b} 包。兩邊都除以 ${fmt(q.z)}，個數不變` : `裝了一${box}又一${box}${q.ans > show ? `，畫面只畫 ${show} ${box}` : ''}`); if (k === 2) setEl('cr', `<span class="crate mini"><b class="num">${q.b}</b></span>`.repeat(show)); }, () => stepKeypad([`${q.a}÷${q.b}＝？（可以裝幾${box}）`], [q.ans], `全部 ${q.a} 包，每${box} ${q.b} 包。`, `對了！${fmt(q.x)}÷${fmt(q.y)}＝${q.a}÷${q.b}＝${q.ans} ${box}。`, 'zero'));
  }
  const ds = [...q.s], digIdx = ds.map((c, i) => c === '.' ? -1 : i).filter(i => i >= 0), iL = digIdx[q.L], iR = digIdx[q.R];
  const pic = zoom => `<div class="digits big">${ds.map((c, i) => c === '.' ? '<b>.</b>' : `<span class="dg ${i === iL ? 'l' : i === iR ? 'r' : ''}">${c}</span>`).join('')}</div>${zoom ? `<div class="trail">紅的在左邊，每往右一位，價值變成十分之一</div>` : ''}`;
  frame(`${q.s} 這個數，紅色的 ${q.d} 和藍色的 ${q.d}。<br>${q.up ? '紅色是藍色的幾倍？' : '藍色是紅色的幾倍？'}`, `<div id="dd">${pic(false)}</div>`);
  gate(q, '比比看', 1, () => setEl('dd', pic(true)), () => pickOne(q.options, q.options.indexOf(q.ans), '相鄰的位，差 10 倍；隔一位，差幾倍？', `對了！隔 ${q.far} 位差 ${10 ** q.far} 倍。這就是十進位。`, 'rel'));
}

/* ---------- 十三：比例模型室 ---------- */
function gridDec(a, b, st) { // 百格板：直的塗 a 排，橫的塗 b 排
  let s = '<svg class="g5" viewBox="-14 -14 228 228"><rect width="200" height="200" fill="#fff"/>';
  if (st >= 1) s += `<rect width="${a * 20}" height="200" fill="#f7dc8c"/>`;
  if (st >= 2) s += `<rect width="200" height="${b * 20}" fill="#a9d0f0" fill-opacity=".5"/><rect width="${a * 20}" height="${b * 20}" fill="#3fae5a"/>`;
  for (let i = 0; i <= 10; i++) s += `<line x1="${i * 20}" x2="${i * 20}" y1="0" y2="200" stroke="#99a"/><line y1="${i * 20}" y2="${i * 20}" x1="0" x2="200" stroke="#99a"/>`;
  return s + '<rect width="200" height="200" fill="none" stroke="#33405a" stroke-width="3"/></svg>';
}
function viewDmul(q) {
  if (q.mode === 'short') {
    const [nm, un, u2] = q.c;
    frame(`${nm} ${q.p} ${un}，買 0.${q.k} ${u2}，要多少${un}？<br>1 ${u2}切成 10 段。`, `<div id="bb">${barRow(10, 0)}</div><div class="trail" id="ct">一整條 ${q.p} ${un}</div>${padHidden()}`);
    return gate(q, '塗一段', q.k, k => { setEl('bb', barRow(10, k)); setEl('ct', `塗了 0.${k} ${u2}`); }, () => stepKeypad([`0.1 ${u2}是幾${un}？`, `0.${q.k} ${u2}是幾${un}？`], [q.each, q.ans], `先把 ${q.p} 分成 10 份，再拿 ${q.k} 份。`, `對了！${q.p}×0.${q.k}＝${q.ans} ${un}。比 ${q.p} 少，因為只買不到 1 ${u2}。`, 'short', null, { dot: true, shortcut: true }), { el: document.getElementById('bb'), map: x => x * 10.5 });
  }
  if (q.mode === 'tenth') {
    const n = q.f === .1 ? 1 : 2;
    frame(`${q.thing}是實物的 ${q.f} 倍。<br>實物高 ${q.a} 公尺，模型多高？切細看。`, `<div id="bb">${barRow(1, 1, '#f7dc8c')}</div><div class="trail" id="ct">一整條 ${q.a} 公尺</div>${padHidden()}`);
    return gate(q, '切成 10 份，拿 1 份', n, k => { setEl('bb', barRow(1, 1, '#f7dc8c') + barRow(10, 1, '#6ea8dc') + (k === 2 ? barRow(10, 1, '#3fae5a') : '')); setEl('ct', `現在是 ${k === 1 ? '0.1' : '0.01'} 倍，就是 ${q.a}÷${10 ** k}`); }, () => stepKeypad([`${q.a}×${q.f}＝？`], [q.ans], `乘以 ${q.f}，就是除以 ${10 ** n}。`, `對了！${q.a}×${q.f}＝${q.ans}。`, 'tenth', null, D2));
  }
  if (q.mode === 'grid') {
    const [, , nm, un] = q.c;
    frame(`${nm}長 0.${q.a} ${un}、寬 0.${q.b} ${un}。<br>整張板是 1 平方${un}。先直著塗，再橫著塗。`, `<div class="vs q6" id="gd">${gridDec(q.a, q.b, 0)}</div><div class="trail" id="ct">每條邊 1 ${un}，切 10 份</div>${padHidden()}`);
    return gate(q, ['直著塗 0.' + q.a, '橫著塗 0.' + q.b], 2, k => { setEl('gd', gridDec(q.a, q.b, k)); setEl('ct', k === 1 ? '塗了十分之' + q.a : '綠色是重疊的地方'); }, () => stepKeypad(['綠色有幾小格？', `每小格是 0.01，0.${q.a}×0.${q.b}＝？`], [q.n, q.ans], `${q.a} 直排、${q.b} 橫排，重疊 ${q.a}×${q.b} 格。`, `對了！0.${q.a}×0.${q.b}＝${q.ans} 平方${un}。一位小數乘一位小數，積有兩位小數。`, 'grid', null, { dot: true, shortcut: true }), { el: document.getElementById('gd'), map: x => x * 2.4 });
  }
  if (q.mode === 'col') {
    const [what, un, u2, nm] = q.ctx, f2 = 10 ** q.pb, f3 = 10 * f2;
    frame(`${what} ${q.a} ${un}，買 ${q.b} ${u2}${nm}，是多少${un}？<br>小數不好乘，先把兩個數都放大成整數。`, `<div id="sc5"></div><div class="trail" id="ct"></div>${padHidden()}`);
    const bar = (lab, val, w, c) => `<div class="sc5r"><small>${lab}</small><i style="width:${w}%;background:${c}"></i><b class="num">${val}</b></div>`;
    const pic = k => setEl('sc5', bar('每' + u2, k >= 1 ? q.A : q.a, k >= 1 ? 72 : 18, '#6ea8dc') + bar('買的量', k >= 2 ? q.B : q.b, k >= 2 ? 72 : 18, '#f0a03c'));
    pic(0);
    return gate(q, [`${q.a} 放大 10 倍`, `${q.b} 放大 ${f2} 倍`], 2, k => { pic(k); setEl('ct', k === 1 ? `${q.a} 變成 ${q.A}，積也變 10 倍` : `${q.b} 變成 ${q.B}，積一共變 ${f3} 倍`); }, () => stepKeypad([`${q.A}×${q.B}＝？`, `積放大了 ${f3} 倍，要縮回來。${q.a}×${q.b}＝？`], [q.n, q.ans], `小數點往左移 ${1 + q.pb} 位，位數不夠要補 0。`, `對了！${q.a}×${q.b}＝${q.ans} ${un}。放大多少倍，最後就縮回多少。`, 'col', null, { dot: true, shortcut: true }), { el: document.getElementById('sc5'), map: x => x * 2.4 });
  }
  if (q.mode === 'vmul') return viewVmul(q);
  let f = 1;
  frame(`${q.what} ${q.N} 公分，乘以 ${q.f}，會變大還是變小？<br>拖黃鈕試試別的數。`, `<div id="tw"></div><div id="sl"></div><div class="trail" id="ct"></div>`);
  const pic = () => { const W = 260, scale = W / (q.N * 2); setEl('tw', `<svg class="g5" viewBox="0 0 280 60"><rect x="10" y="4" width="${q.N * scale}" height="20" fill="#f7dc8c" stroke="#33405a"/><rect x="10" y="32" width="${q.N * f * scale}" height="20" fill="${f > 1 ? '#f4a9a0' : f < 1 ? '#3fae5a' : '#a9d0f0'}" stroke="#33405a"/></svg>`); setEl('sl', sliderHtml('s9', f / 2)); setEl('ct', `${q.N}×${f.toFixed(1)}＝${dec5(q.N * f)}`); };
  pic();
  const ask = () => pickOne(['變小', '一樣', '變大'], ['變小', '一樣', '變大'].indexOf(q.ans), '乘數比 1 小還是比 1 大？', `對了！${q.N}×${q.f}＝${q.R}。乘數小於 1 變小，大於 1 變大。`, 'cmp');
  if (isFast(q)) { f = q.f; pic(); return afterAct(ask); }
  let n = 0, over = false; const stop = () => { if (!over) { over = true; document.getElementById('sl').onpointerdown = document.getElementById('sl').onpointermove = null; f = q.f; pic(); afterAct(ask); } };
  dragOn(document.getElementById('sl'), x => { f = clamp(Math.round((x * 320 - 12) / 296 * 20) / 10, .1, 2); sfx.hop(); pic(); if (++n >= 8) stop(); });
  actionBtn('gt', '換一個數').onclick = () => { f = f >= 1.8 ? .3 : +(f + .5).toFixed(1); sfx.hop(); pic(); if (++n >= 3) stop(); };
}
const dec5 = x => +x.toFixed(3);

/* ---------- 直式：格子一位一位放，小數點自己放 ---------- */
function vgrid(rows, W) { // row: { c: 每格字元, pt: 小數點在第幾格後, tap: 可點縫, ln: 上面畫線, hi: 亮第幾格 }
  return `<div class="vg" style="grid-template-columns:repeat(${W - 1},30px 14px) 30px">${rows.map(r => { let h = ''; for (let i = 0; i < W; i++) { const ch = r.c[i] === undefined ? '' : r.c[i]; h += `<span class="vc ${r.ln ? 'ln' : ''} ${r.hi === i ? 'hi' : ''} ${r.box && i >= r.box ? 'bx' : ''}">${ch}</span>`; if (i < W - 1) h += r.tap ? `<button class="vgap ${r.pt === i ? 'on' : ''}" data-g="${i}" aria-label="小數點">${r.pt === i ? '.' : ''}</button>` : `<span class="vgap0 ${r.ln ? 'ln' : ''}">${r.pt === i ? '.' : ''}</span>`; } return h; }).join('')}</div>`;
}
const rightAlign = (s, W, shift) => { const c = new Array(W).fill(''), t = String(s), e = W - 1 - (shift || 0); [...t].forEach((d, i) => { c[e - (t.length - 1 - i)] = d; }); return c; };
function viewVmul(q) {
  const [what, un, u2] = q.c, W = q.W, ptA = W - 2, ptB = q.pb ? W - 1 - q.pb : -1;
  frame(`${what} ${q.a} ${un}，${u2 === '包' ? `${q.b} 包` : `${q.b} ${u2}`}是多少${un}？<br>寫成直式：靠右對齊，一格一格放。`, `<div id="vg"></div><div class="trail" id="ct">先不管小數點，當整數乘</div>${padHidden()}`);
  const fast = isFast(q);
  const prod = String(q.raw).padStart(q.pl + 1, '0');
  const rowsAt = (st, tap, pt) => { const out = [{ c: rightAlign(q.A, W), pt: ptA }, { c: rightAlign(q.B, W), pt: ptB }]; out[1].c[0] = out[1].c[0] || '×';
    if (q.sub === 'one') { const c = new Array(W).fill(''); if (st >= 1) c[W - 1] = q.steps[0]; if (st >= 2) rightAlign(q.raw, W).forEach((x, i) => { if (x !== '') c[i] = x; }); if (tap) rightAlign(prod, W).forEach((x, i) => { if (x !== '') c[i] = x; }); out.push({ c, ln: true, tap, pt }); }
    else { out.push({ c: st >= 1 ? rightAlign(q.p1, W) : [], ln: true }); out.push({ c: st >= 2 ? rightAlign(q.p2, W, 1) : [] }); const c = tap ? rightAlign(prod, W) : st >= 3 ? rightAlign(q.raw, W) : []; out.push({ c, ln: true, tap, pt }); }
    return out; };
  setEl('vg', vgrid(rowsAt(0), W));
  const asks = q.sub === 'one' ? [`${q.A1}×${q.d}＝${q.v1}，個位放進最右邊的格子，按幾？`, `${q.A10}×${q.d}${q.cr ? `，再加進位 ${q.cr}` : ''}，按多少？`] : [`第一行：${q.A}×${q.B % 10}＝？`, `第二行：${q.A}×${Math.floor(q.B / 10)}＝？（往左一格放）`, '兩行加起來＝？'];
  const finishPoint = () => {
    hideKeypad(); const a = document.getElementById('ask'); if (a) a.innerHTML = '';
    setEl('vg', vgrid(rowsAt(9, true), W)); setEl('ct', `${q.a} 有 1 位小數，${q.b} 有 ${q.pb} 位小數。點積的數字之間，放小數點。`); setMsg('小數點放哪裡？');
    document.getElementById('vg').onclick = e => { const b = e.target.closest('[data-g]'); if (!b) return; const g = +b.dataset.g; if (g === q.gap) { document.getElementById('vg').onclick = null; setEl('vg', vgrid(rowsAt(9, false, q.gap), W)); return finish(graded(), 'vmul', nums(`對了！${q.a}×${q.b}＝${q.ans} ${un}。積的小數位數＝兩個乘數小數位數的和，共 ${q.pl} 位，不用對齊上面的小數點。`)); } if (miss()) { document.getElementById('vg').onclick = null; setEl('vg', vgrid(rowsAt(9, false, q.gap), W)); return finish(0, { wrong: g, ans: q.gap }, nums(`小數點在這裡，從右邊數 ${q.pl} 位。答案是 ${q.ans}。`)); } setMsg(nums(`從最右邊往左數 ${q.pl} 位。`), 'hint'); };
  };
  afterAct(() => {
    if (fast) { setEl('vg', vgrid(rowsAt(3), W)); return stepKeypad([`${q.a}×${q.b}＝？（可以按小數點）`], [q.ans], `小數位數共 ${q.pl} 位。`, `對了！${q.a}×${q.b}＝${q.ans}。`, 'vmul', null, D2); }
    let st = 0; const ask = () => { document.getElementById('ask').innerHTML = nums(asks[st]); }; ask();
    bindKeypad((val, clear) => {
      clear();
      if (val === q.steps[st]) { sfx.ok(); st++; setEl('vg', vgrid(rowsAt(st), W)); setMsg(''); if (st === q.steps.length) return finishPoint(); return ask(); }
      R.tries++; sfx.retry(); if (R.tries >= 3) { st = q.steps.length; setEl('vg', vgrid(rowsAt(st), W)); setMsg(nums(`這一格的答案看圖。積的數字是 ${q.raw}。`), 'hint'); return finishPoint(); }
      setMsg(nums(`再算一次：${asks[st]}`), 'hint');
    });
  });
}
function viewVdiv(q) {
  const [nm, who] = q.ctx, W = q.D.length + 1, give = who === '段' ? '平分成' : '平分給';
  frame(`${q.a} ${nm}${give} ${q.n} ${who}，每${who}多少？<br>寫成直式，先把商的小數點放好。`, `<div id="vg"></div><div class="trail" id="ct"></div>${padHidden()}`);
  const dv = [String(q.n), ...q.D], qc = new Array(W).fill('');
  const rows = (st, tap) => { const r = [{ c: qc.map((_, i) => i && i <= st ? q.digits[i - 1] : ''), tap, pt: tap ? undefined : q.gap, hi: !tap && st < q.digits.length ? st + 1 : -1 }, { c: dv, pt: q.gap, ln: true, box: 1 }];
    let rem = 0; for (let i = 0; i < st; i++) { const cur = rem * 10 + +q.D[i], qd = q.digits[i], pr = qd * q.n; rem = cur - pr; if (qd) { r.push({ c: rightAlign(pr, i + 2) }); const nx = i + 1 < q.D.length ? `${rem || ''}${q.D[i + 1]}` : String(rem); r.push({ c: rightAlign(nx, i + 1 < q.D.length ? i + 3 : i + 2), ln: true }); } else if (i + 1 < q.D.length) r.push({ c: rightAlign(`${rem || ''}${q.D[i + 1]}`, i + 3) }); } return r; };
  const ask = () => { setEl('vg', vgrid(rows(0), W)); setEl('ct', '被除數的數字一位一位除，商放在正上方'); let rem0 = 0; const asks = q.digits.map((d, i) => { const cur = rem0 * 10 + +q.D[i]; rem0 = cur - d * q.n; return `${cur} 裡有幾個 ${q.n}？放進黃格。`; }); stepKeypad(asks, q.digits, '想想這個數裡有幾個除數，剩下的和下一位一起算。', `對了！${q.a}÷${q.n}＝${q.ans}。每${who} ${q.ans}。商的小數點和被除數的小數點對齊。`, 'vdiv', s => setEl('vg', vgrid(rows(s), W))); };
  if (isFast(q)) { setEl('vg', vgrid(rows(q.digits.length), W)); return afterAct(() => stepKeypad([`${q.a}÷${q.n}＝？（可以按小數點）`], [q.ans], '商的小數點和被除數對齊。', `對了！${q.a}÷${q.n}＝${q.ans}。`, 'vdiv', null, D2)); }
  setEl('vg', vgrid(rows(0, true), W)); setEl('ct', '點上面那一列的縫，放小數點');
  const el = document.getElementById('vg');
  el.onclick = e => { const b = e.target.closest('[data-g]'); if (!b) return; const g = +b.dataset.g; if (g === q.gap) { el.onclick = null; sfx.ok(); setMsg('對齊了！', 'good'); return afterAct(ask); } if (miss(9)) return; setMsg('商的小數點要在被除數小數點的正上方。', 'hint'); };
}

/* ---------- 十四：圓形花園 ---------- */
function sectorSvg(d, o) {
  o = o || {}; const cx = 150, cy = 115, r = o.r || 95, P = (a, l) => [cx + l * Math.cos(-a * Math.PI / 180), cy + l * Math.sin(-a * Math.PI / 180)], [ax, ay] = P(0, r), [bx, by] = P(d, r);
  let s = `<svg class="g5" viewBox="0 0 300 230"><circle cx="${cx}" cy="${cy}" r="${o.R || r}" fill="#f4f6fa" stroke="#c9d1dd" stroke-width="2"/>`;
  if (d >= 360) s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#7dc27a" stroke="#33405a" stroke-width="2"/>`; else if (d > 0) s += `<path data-z="body" d="M${cx} ${cy}L${ax} ${ay}A${r} ${r} 0 ${d > 180 ? 1 : 0} 0 ${bx} ${by}Z" fill="#7dc27a" stroke="#33405a" stroke-width="2"/>`;
  if (o.parts) { const [mx, my] = P(d / 2, r); s += `<line data-z="半徑" x1="${cx}" y1="${cy}" x2="${ax}" y2="${ay}" stroke="#2f5f9e" stroke-width="10"/><line data-z="半徑" x1="${cx}" y1="${cy}" x2="${bx}" y2="${by}" stroke="#2f5f9e" stroke-width="10"/><path data-z="弧" d="M${ax} ${ay}A${r} ${r} 0 ${d > 180 ? 1 : 0} 0 ${bx} ${by}" fill="none" stroke="#d6476b" stroke-width="12"/><path data-z="圓心角" d="M${cx} ${cy}L${P(0, 30).join(' ')}A30 30 0 ${d > 180 ? 1 : 0} 0 ${P(d, 30).join(' ')}Z" fill="#ffd65a" stroke="#33405a"/>`; }
  if (o.cuts) for (let i = 0; i < o.cuts; i++) { const [x, y] = P(i * 360 / o.cuts, o.r || 95); s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#33405a"/>`; }
  if (o.knob) s += `<circle cx="${bx}" cy="${by}" r="13" fill="#ffd65a" stroke="#2f5f9e" stroke-width="3"/>`;
  return s + '</svg>';
}
const readAngle = (x, y, step) => { const X = x * 300 - 150, Y = 115 - y * 230; let a = Math.atan2(Y, X) * 180 / Math.PI; if (a < 0) a += 360; return Math.round(a / step) * step % 360; };
function viewSector(q) {
  if (q.mode === 'drag') {
    let d = 90;
    frame(`把${q.ctx}打開：拖黃鈕，圓心角轉到 <b class="num">${q.d}</b> 度。`, `<div id="sc"></div><div class="u-count"><b class="num" id="cn"></b> 度</div><div class="odo three"><button class="turn" data-h="-15">−15</button><button class="turn" data-h="15">＋15</button><button class="turn" data-h="90">＋90</button></div>`);
    const draw = () => { setEl('sc', sectorSvg(d, { knob: true })); document.getElementById('cn').textContent = d; };
    draw();
    let prev = 90;
    dragOn(document.getElementById('sc'), (x, y) => { const a = readAngle(x, y, 15); if (a !== d) { d = a; sfx.hop(); draw(); } });
    document.querySelectorAll('[data-h]').forEach(b => b.onclick = () => { d = ((d + +b.dataset.h) % 360 + 360) % 360; sfx.hop(); draw(); });
    actionBtn('ok', '轉好了').onclick = () => {
      if (d === q.d) return finish(graded(), 'drag', `對了！${q.d} 度的扇形${q.d > 180 ? '超過半圓，還是一個扇形' : ''}。`);
      if (miss()) { d = q.d; draw(); return finish(0, { wrong: d, ans: q.d }, `${q.d} 度在這裡。一直角 90 度，半圈 180 度。`); }
      setMsg(d < q.d ? '再多轉一點。' : '轉太多了。', 'hint');
    };
    return;
  }
  if (q.mode === 'frac') {
    frame(`${q.ctx}是 ${fracHtml(q.a, q.n)} 圓，圓心角幾度？<br>先把圓切成 ${q.n} 份。`, `<div id="sc">${sectorSvg(0)}</div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, ['切成一樣大', `塗 ${q.a} 份`], 2, k => { setEl('sc', sectorSvg(k === 2 ? q.ans : 0, { cuts: q.n })); setEl('ct', k === 1 ? `一圈 360 度切 ${q.n} 份` : `塗了 ${q.a} 份`); }, () => stepKeypad(['1 份是幾度？', `${q.a} 份是幾度？`], [q.each, q.ans], `360÷${q.n} 是 1 份。`, `對了！${q.each}×${q.a}＝${q.ans} 度。${q.a}/${q.n} 圓的圓心角是 ${q.ans} 度。`, 'frac', null, { shortcut: true }), { el: document.getElementById('sc'), map: x => x * 2.4 });
  }
  if (q.mode === 'read') {
    frame(`一片${q.ctx}的圓心角 ${q.d} 度。<br>幾片才能拼成一個圓？一片一片拼。`, `<div id="sc">${sectorSvg(q.d)}</div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, '再拼一片', q.n - 1, k => { setEl('sc', sectorSvg(q.d * (k + 1), { cuts: q.n })); setEl('ct', `拼了 ${k + 1} 片，${q.d * (k + 1)} 度`); }, () => stepKeypad(['幾片拼成一個圓？'], [q.ans], `一圈 360 度，看 360 裡有幾個 ${q.d}。`, `對了！360÷${q.d}＝${q.n}，所以這一片是 1/${q.n} 圓。`, 'read'));
  }
  if (q.mode === 'part') {
    frame(`這個扇形。用手指點出<b>「${q.part}」</b>。`, `<div id="sc">${sectorSvg(q.d, { parts: true })}</div><div class="trail">由兩條半徑和一段弧圍成</div>`);
    const el = document.getElementById('sc');
    el.onclick = e => { const z = e.target.dataset && e.target.dataset.z; if (!z || z === 'body') return; if (z === q.part) { el.onclick = null; return finish(graded(), 'part', { 圓心角: '對了！頂點在圓心的角，就是圓心角。', 半徑: '對了！從圓心到圓周的線是半徑。', 弧: '對了！圓周的一段叫作弧。' }[q.part]); } if (miss()) { el.onclick = null; return finish(0, { wrong: z, ans: q.part }, `${z}是另一個。${q.part === '圓心角' ? '黃色那塊才是圓心角。' : q.part === '半徑' ? '藍色的線才是半徑。' : '紅色的彎線才是弧。'}`); } setMsg(`這是${z}。再找找看。`, 'hint'); };
    actionBtn('gt', '提示').onclick = () => { setMsg('黃色在圓心，藍色是直線，紅色是彎的。', 'hint'); };
    return;
  }
  let r = 2, d = 30;
  frame(`在紙上畫扇形：半徑 <b class="num">${q.r}</b> 公分、圓心角 <b class="num">${q.d}</b> 度。<br>拖黃鈕：離圓心的距離是半徑，轉到的角度是圓心角。`, `<div id="sc"></div><div class="u-count"><b class="num" id="cn"></b></div><div class="odo two"><button class="turn" id="rp">半徑＋1</button><button class="turn" id="dp">角度＋30</button></div>`);
  const draw = () => { setEl('sc', sectorSvg(d, { r: r * 15, R: 105, knob: true })); document.getElementById('cn').textContent = `半徑 ${r} 公分，${d} 度`; };
  draw();
  dragOn(document.getElementById('sc'), (x, y) => { const X = x * 300 - 150, Y = 115 - y * 230, nr = clamp(Math.round(Math.hypot(X, Y) / 15), 1, 7), a = readAngle(x, y, 30); if (nr !== r || a !== d) { r = nr; d = a; sfx.hop(); draw(); } });
  document.getElementById('rp').onclick = () => { r = r % 7 + 1; sfx.hop(); draw(); };
  document.getElementById('dp').onclick = () => { d = (d + 30) % 360; sfx.hop(); draw(); };
  actionBtn('ok', '畫好了').onclick = () => {
    if (r === q.r && d === q.d) return finish(graded(), 'draw', `對了！半徑決定多大，圓心角決定開多開。`);
    if (miss()) { r = q.r; d = q.d; draw(); return finish(0, { wrong: [r, d], ans: [q.r, q.d] }, '正確的扇形在這裡。'); }
    setMsg(r !== q.r ? '半徑不對，黃鈕往外或往內拖。' : '圓心角不對，黃鈕繞著圓心轉。', 'hint');
  };
}

/* ---------- 十五：大型倉庫 ---------- */
function lShape(q, st) { // 正面看的 L 形貨堆：st 1 切開、2 補滿
  const u = Math.min(30, 260 / q.W), H = q.H * u; let s = `<svg class="g5" style="max-height:220px" viewBox="-30 -20 ${q.W * u + 40} ${H + 44}">`;
  const rect = (x, y, w, h, f, dash) => `<rect x="${x * u}" y="${y * u}" width="${w * u}" height="${h * u}" fill="${f}" stroke="#33405a" stroke-width="2" ${dash ? 'stroke-dasharray="5 4"' : ''}/>`;
  if (st === 2) s += rect(q.w, 0, q.W - q.w, q.H - q.h, '#fff', true);
  s += rect(0, q.H - q.h, q.W, q.h, st === 1 ? '#a9d0f0' : '#f7dc8c') + rect(0, 0, q.w, q.H - q.h, st === 1 ? '#f4a9a0' : '#f7dc8c');
  for (let x = 1; x < q.W; x++) for (let y = 0; y < q.H; y++) if (x <= q.W && (y >= q.H - q.h || x < q.w)) s += `<line x1="${x * u}" x2="${x * u}" y1="${y * u}" y2="${(y + 1) * u}" stroke="#7a8496" stroke-opacity=".4"/>`;
  return s + `<text x="${q.W * u / 2}" y="${H + 16}" text-anchor="middle" class="ax">${q.W}</text><text x="-8" y="${H / 2 + 4}" text-anchor="end" class="ax">${q.H}</text><text x="${q.w * u / 2}" y="-1" text-anchor="middle" class="ax">${q.w}</text></svg>`;
}
function viewVolume(q) {
  const un = '立方公分', [bx] = q.box || [''];
  if (q.mode === 'layer') {
    frame(`${bx}要堆成長 ${q.a}、寬 ${q.b}、高 ${q.c} 公分。一塊 1 ${un}。<br>一層一層堆。`, `<div class="vs" id="iso"></div><div class="trail" id="ct"></div>${padHidden()}`);
    setEl('iso', isoSvg(q.a, q.b, q.c, 0));
    return gate(q, '堆一層', q.c, k => { setEl('iso', isoSvg(q.a, q.b, q.c, k * q.one)); setEl('ct', `${k} 層，每層 ${q.a}×${q.b} 塊`); }, () => stepKeypad(['一層幾塊？', '全部幾' + un + '？'], [q.one, q.ans], `一層有 ${q.a} 塊 ${q.b} 排，再乘 ${q.c} 層。`, `對了！${q.a}×${q.b}×${q.c}＝${q.ans} ${un}。長方體體積＝長×寬×高。`, 'layer', null, { shortcut: true }), { el: document.getElementById('iso'), map: (x, y) => (1 - y) * q.c * 1.2 });
  }
  if (q.mode === 'cube') {
    frame(`一個每邊 ${q.s} 公分的正方體${bx}，一塊 1 ${un}。<br>一層一層堆。`, `<div class="vs" id="iso"></div>${padHidden()}`);
    setEl('iso', isoSvg(q.s, q.s, q.s, 0));
    return gate(q, '堆一層', q.s, k => setEl('iso', isoSvg(q.s, q.s, q.s, k * q.one)), () => stepKeypad(['一層幾塊？', '全部幾' + un + '？'], [q.one, q.ans], `每層 ${q.s}×${q.s}，有 ${q.s} 層。`, `對了！${q.s}×${q.s}×${q.s}＝${q.ans} ${un}。正方體體積＝邊長×邊長×邊長。`, 'cube', null, { shortcut: true }));
  }
  if (q.mode === 'cut') {
    frame(`L 形貨堆，厚度都是 ${q.d} 公分。下面高 ${q.h}，上面寬 ${q.w}。<br>不是長方體，切一刀看看。`, `<div class="vs" id="ll">${lShape(q, 0)}</div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, '✂️ 橫切一刀', 1, () => { setEl('ll', lShape(q, 1)); setEl('ct', '切成藍和粉紅兩個長方體'); }, () => stepKeypad([`藍色：${q.W}×${q.d}×${q.h}＝？`, `粉紅：${q.w}×${q.d}×${q.H - q.h}＝？`, '合起來？'], [q.p1, q.p2, q.ans], '長方體會算，就切成長方體。', `對了！${q.p1}＋${q.p2}＝${q.ans} ${un}。`, 'cut', null, { shortcut: true }), { el: document.getElementById('ll'), map: x => x * 1.3 });
  }
  if (q.mode === 'fill') {
    frame(`同一種貨堆，厚度 ${q.d} 公分。這次不切，<br>把缺的角補起來，算完再扣掉。`, `<div class="vs" id="ll">${lShape(q, 0)}</div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, '補上缺的角', 1, () => { setEl('ll', lShape(q, 2)); setEl('ct', `缺的部分寬 ${q.W - q.w}、高 ${q.H - q.h}`); }, () => stepKeypad([`補滿：${q.W}×${q.H}×${q.d}＝？`, `補的：${q.W - q.w}×${q.H - q.h}×${q.d}＝？`, '原來的體積？'], [q.big, q.hole, q.ans], '先算大的，再扣掉多補的。', `對了！${q.big}－${q.hole}＝${q.ans} ${un}。切開和補滿，算出來一樣。`, 'fill', null, { shortcut: true }));
  }
  if (q.mode === 'm3') {
    const edges = [[[0, 0], [1, 0]], [[1, 0], [1.5, .5]], [[1.5, .5], [.5, .5]], [[.5, .5], [0, 0]]];
    frame(q.text, `<div class="u-big">${q.e}</div><div id="fr"></div><div class="trail" id="ct">1 立方公尺：用 12 根 1 公尺的棍子圍起來</div>`);
    const fr = k => { const P = [[60, 150], [190, 150], [190, 40], [60, 40], [110, 120], [240, 120], [240, 10], [110, 10]], E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]; setEl('fr', `<svg class="g5" style="max-height:150px" viewBox="40 0 220 165">${E.slice(0, k).map(e => `<line x1="${P[e[0]][0]}" y1="${P[e[0]][1]}" x2="${P[e[1]][0]}" y2="${P[e[1]][1]}" stroke="#a9702a" stroke-width="5"/>`).join('')}</svg>`); };
    fr(0);
    return gate(q, ['搭 4 根', '再搭 4 根', '最後 4 根'], 3, k => fr(k * 4), () => pickOne(q.options.map(o => nums(o)), q.options.indexOf(q.a), '想想這個框有多大，大約能塞下幾個小朋友。', q.why, 'm3'));
  }
  if (q.mode === 'big') {
    frame(`${q.what}長 ${q.a}、寬 ${q.b}、高 ${q.c} 公尺。<br>每塊是 1 立方公尺的大箱子，一層一層放。`, `<div class="vs" id="fl"></div><div class="trail" id="ct"></div>${padHidden()}`);
    const pic = k => { const u = Math.min(22, 280 / q.a), W = q.a * u; let s = `<svg class="g5" style="max-height:170px" viewBox="-2 -2 ${W + 40} ${q.b * u + 30}">`; for (let y = 0; y < q.b; y++) for (let x = 0; x < q.a; x++) s += `<rect x="${x * u}" y="${y * u}" width="${u}" height="${u}" fill="${k ? '#a9d0f0' : '#fff'}" stroke="#33405a"/>`; return s + `<text x="${W + 4}" y="20" class="ax">${k} 層</text></svg>`; };
    setEl('fl', pic(0));
    return gate(q, '放滿一層', q.c, k => { setEl('fl', pic(k)); setEl('ct', `${k} 層`); }, () => stepKeypad(['一層幾個？', '全部幾立方公尺？'], [q.one, q.ans], `${q.a}×${q.b}，再乘 ${q.c} 層。`, `對了！${q.a}×${q.b}×${q.c}＝${q.ans} 立方公尺。`, 'big', null, { shortcut: true }));
  }
  frame(`${bx}的底面長 ${q.a}、寬 ${q.b} 公分，體積 ${q.V} ${un}。<br>高是多少？叫它 □，一層一層堆到 ${q.V} 塊。`, `<div class="vs" id="iso"></div><div class="u-count"><b class="num" id="cn">0</b> 塊</div>${padHidden()}`);
  setEl('iso', isoSvg(q.a, q.b, q.c, 0));
  gate(q, '堆一層', q.c, k => { setEl('iso', isoSvg(q.a, q.b, q.c, k * q.a * q.b)); document.getElementById('cn').textContent = k * q.a * q.b; }, () => stepKeypad(['□ 是幾公分？'], [q.ans], `一層 ${q.a}×${q.b} 塊，幾層才有 ${q.V} 塊？`, `對了！${q.a}×${q.b}×□＝${q.V}，□＝${q.V}÷（${q.a}×${q.b}）＝${q.ans}。`, 'back'));
}

/* ---------- 十六：能源分配站 ---------- */
function viewDdiv(q) {
  const ctx = q.ctx, un = ctx ? ctx[0].replace('度電', '度').replace('公升燃料', '公升').replace('公尺電線', '公尺') : '';
  if (q.mode === 'one') {
    const nm = ctx[0], who = ctx[1], name = q.pl === 1 ? '0.1' : q.pl === 2 ? '0.01' : '0.001';
    frame(`${q.a} ${nm}${who === '段' ? '平分成' : '平分給'} ${q.n} ${who}，每${who}多少？<br>不夠 1，就把 1 拆開。`, `<div id="bb"></div><div class="trail" id="ct"></div>${padHidden()}`);
    const lab = ['0.1', '0.01', '0.001'];
    const draw = k => { let h = ''; if (k === 0) h = barRow(q.a, q.a, '#ffd65a'); else h = barRow(Math.min(q.u, 100), Math.min(100, Math.round(q.cnt * q.n / (q.u > 100 ? 10 : 1))), '#6ea8dc'); setEl('bb', h); setEl('ct', k ? `${q.a} 是 ${q.a * q.u} 個 ${name}，每${who} ${q.a * q.u}÷${q.n}` : `全部 ${q.a} ${nm.slice(-1) === '電' ? '度' : ''}`); };
    draw(0);
    return gate(q, `把 ${q.a} 拆成 ${name}`, 1, draw, () => stepKeypad([`每${who}幾個 ${name}？`, `每${who}是多少？（可以按小數點）`], [q.cnt, q.ans], `${q.a * q.u} 個 ${name} 分給 ${q.n} ${who}。`, `對了！${q.a}÷${q.n}＝${q.ans}。不夠分，就換成更小的單位繼續分。`, 'one', null, { dot: true, shortcut: true }));
  }
  if (q.mode === 'vdiv') return viewVdiv(q);
  if (q.mode === 'dec' || q.mode === 'long') {
    const nm = ctx[0], who = ctx[1], give = who === '段' ? '平分成' : '平分給';
    frame(`${q.a} ${nm.replace(/^[^公度]*/, '')}${give} ${q.n} ${who}，每${who}多少？<br>${q.mode === 'long' ? '分不完的就拆開，' : ''}一位一位發。`, `<div class="pile5" id="pl"></div><div class="plates" id="pp"></div><div class="trail" id="ct"></div>${padHidden()}`);
    const plan = []; q.deal.forEach((d, i) => { if (d.split) plan.push({ t: 'split', i }); plan.push({ t: 'deal', i }); });
    const chips = (n, nm2, c) => n ? `<div class="chips5"><small>${nm2}</small>${`<i class="${c}"></i>`.repeat(Math.min(n, 60))}<b class="num">${n} 個</b></div>` : '';
    const got = upto => q.deal.slice(0, upto).filter(d => d.each).map(d => `${d.each} 個 ${d.place}`).join('＋') || '還沒有';
    const raw = () => { const u = q.deal.map(d => d.split ? null : d).filter(Boolean); return u; };
    const draw = k => {
      let html = '', msg = '', upto = 0;
      if (k === 0) { const parts = q.deal.map(d => ({ n: d.have - d.split * 10, p: d.place })).filter(x => x.n > 0); html = parts.map(x => chips(x.n, x.p, x.p === '1' ? 'c1' : x.p === '0.1' ? 'c2' : x.p === '0.01' ? 'c3' : 'c0')).join(''); msg = `全部 ${q.a}`; }
      else { const st = plan[k - 1], d = q.deal[st.i], cls = d.place === '1' ? 'c1' : d.place === '0.1' ? 'c2' : d.place === '0.01' ? 'c3' : 'c0'; upto = st.t === 'deal' ? st.i + 1 : st.i; if (st.t === 'split') { html = chips(d.have, d.place, cls); msg = `剩下的 ${d.split} 個拆開，每個換 10 個 ${d.place}`; } else { html = chips(d.left, d.place, cls); msg = `${d.have} 個 ${d.place} 發給 ${q.n} ${who}，每${who} ${d.each} 個${d.left ? `，剩 ${d.left} 個` : '，發完了'}`; } }
      setEl('pl', html || '<div class="trail">全部發完了</div>'); setEl('pp', Array.from({ length: Math.min(q.n, 8) }, () => `<span class="plate5 wide">${got(upto)}</span>`).join('')); setEl('ct', msg);
    };
    draw(0);
    return gate(q, plan.map(st => st.t === 'split' ? `拆開剩下的 ${q.deal[st.i].split} 個` : `發 ${q.deal[st.i].place}`), plan.length, draw, () => stepKeypad([`每${who}是多少？（可以按小數點）`], [q.ans], `把每${who}拿到的合起來：${got(q.deal.length)}。`, `對了！${q.a}÷${q.n}＝${q.ans}。一位一位發，分不完就換小單位，直式就是這樣來的。`, q.mode, null, D2));
  }
  if (q.mode === 'frac') {
    frame(`${fracHtml(q.a, q.n)} 張${q.f}，用小數怎麼說？<br>分數線就是除號：${q.a}÷${q.n}。先塗一塗。`, `<div id="hb">${hundred(0)}</div><div class="trail" id="ct"></div>${padHidden()}`);
    const cells = q.a * 100 / q.n;
    return gate(q, `塗 ${q.a} 份`, 1, () => { setEl('hb', hundred(Math.round(cells))); setEl('ct', q.n === 8 ? `每份 12.5 格，塗了 ${cells} 格` : `塗了 ${cells} 格`); }, () => stepKeypad([`${q.a}/${q.n} 是多少？（可以按小數點）`], [q.ans], `${q.a}÷${q.n}，把 ${q.a} 換成小單位來分。`, `對了！${q.a}/${q.n}＝${q.ans}。`, 'frac', null, D2));
  }
  const nm = ctx[0], who = ctx[1], digs = [+(q.a / q.n).toFixed(1), Math.floor(q.a / q.n * 100) / 100, q.d3];
  frame(`${q.a} ${nm}${who === '段' ? '平分成' : '平分給'} ${q.n} ${who}，一直除不盡！<br>算到第三位看看，再用四捨五入取到小數第 ${q.to} 位。`, `<div class="trail" id="ct">商是</div><div class="u-count"><b class="num" id="dg"></b></div><div id="ln"></div>${padHidden()}`);
  const seq = [Math.floor(q.a / q.n * 10) / 10, Math.floor(q.a / q.n * 100) / 100, q.d3];
  const line = () => { const step = 1 / 10 ** q.to, t = (q.d3 - q.lo) / step, x = 30 + 260 * t; setEl('ln', `<svg class="g5" viewBox="0 0 320 70"><line x1="30" x2="290" y1="30" y2="30" stroke="#33405a" stroke-width="3"/><line x1="160" x2="160" y1="20" y2="40" stroke="#d6476b" stroke-width="2"/><text x="30" y="56" text-anchor="middle" class="ax">${q.lo}</text><text x="290" y="56" text-anchor="middle" class="ax">${q.hi}</text><circle cx="${x}" cy="30" r="8" fill="#ffd65a" stroke="#2f5f9e" stroke-width="3"/></svg>`); };
  gate(q, '再除下一位', 3, k => { document.getElementById('dg').textContent = seq[k - 1].toFixed(k) + '⋯'; if (k === 3) { line(); setEl('ct', '後面還有，畫到數線上：看它靠近哪一邊'); } }, () => stepKeypad([`取到小數第 ${q.to} 位是多少？`], [q.ans], `看小數第 ${q.to + 1} 位，5 以上進位，4 以下捨去。`, `對了！大約是 ${q.ans}。分不完的時候，取到需要的位數就夠用了。`, 'round', null, D2));
}

/* ---------- 十七：城市規劃局 ---------- */
function mapSvg(cols, rows, on, unitLabel, o) { // 地圖鋪格子：on 鋪了幾格
  const u = Math.min(300 / cols, 170 / rows); let s = `<svg class="g5" viewBox="-2 -2 ${cols * u + 4} ${rows * u + 4}"><rect width="${cols * u}" height="${rows * u}" fill="#dcecc8"/>`;
  let k = 0;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { s += `<rect x="${x * u}" y="${y * u}" width="${u}" height="${u}" fill="${k < on ? (o && o.c) || '#7dc27a' : 'none'}" stroke="#4a8a3e" stroke-width="${u < 8 ? .4 : 1}"/>`; k++; }
  return s + `<rect width="${cols * u}" height="${rows * u}" fill="none" stroke="#33405a" stroke-width="2"/></svg>`;
}
function viewBigunit(q) {
  if (q.mode === 'pick' || q.mode === 'tpick') return unitPick(q);
  if (q.mode === 'are') {
    const cols = q.W / 10, rows = q.H / 10;
    frame(`${q.what}長 ${q.W} 公尺、寬 ${q.H} 公尺。<br>用每邊 10 公尺的「1 公畝」地毯鋪滿它。`, `<div id="mp">${mapSvg(cols, rows, 0)}</div><div class="trail" id="ct">1 公畝：10×10＝100 平方公尺</div>${padHidden()}`);
    return gate(q, `鋪一排`, rows, k => { setEl('mp', mapSvg(cols, rows, k * cols)); setEl('ct', `鋪了 ${k * cols} 公畝`); }, () => stepKeypad(['面積是幾平方公尺？', '是幾公畝？'], [q.m2, q.ans], `每 100 平方公尺是 1 公畝。`, `對了！${q.W}×${q.H}＝${q.m2} 平方公尺＝${q.ans} 公畝。`, 'are', null, { shortcut: true }), { el: document.getElementById('mp'), map: (x, y) => y * rows * 1.1 });
  }
  if (q.mode === 'ha') {
    frame(`這張地圖每邊 100 公尺，是 <b>1 公頃</b>。<br>用公畝地毯鋪滿，要幾塊？`, `<div id="mp">${mapSvg(10, 10, 0)}</div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, '鋪一排（10 公畝）', 10, k => { setEl('mp', mapSvg(10, 10, k * 10)); setEl('ct', `${k * 10} 公畝`); }, () => stepKeypad(['1 公頃是幾公畝？', `${q.k} 公頃是幾公畝？`], [100, q.ans], '數鋪了幾塊。每公頃都一樣多。', `對了！1 公頃＝100 公畝＝10000 平方公尺。${q.k} 公頃＝${q.ans} 公畝。`, 'ha', null, { shortcut: true }), { el: document.getElementById('mp'), map: (x, y) => y * 10.5 });
  }
  if (q.mode === 'conv') {
    const km = q.z === 'km', minis = n => `<div class="minis">${Array.from({ length: n }, () => `<span class="mini-m">${mapSvg(10, 10, 100, '', { c: '#a9d0f0' })}</span>`).join('')}</div>`;
    frame(`${q.what}是 ${q.from}，是多少${q.to}？<br>${q.down ? `放大地圖，看 1 ${q.big}裡面有什麼。` : `把小格子圈成 1 ${q.big}，看有幾個。`}`, `<div id="mp">${q.down ? `<div class="bigbox">1 ${q.big}</div>` : mapSvg(10, 10, 0)}</div><div class="trail" id="ct"></div>${padHidden()}`);
    const k1 = q.down ? `放大 1 ${q.big}` : `圈出 1 ${q.big}（100 小格）`, k2 = q.down ? `鋪滿 ${q.k} ${q.big}` : `全部圈完`;
    return gate(q, [k1, k2], 2, k => { if (k === 1) { setEl('mp', mapSvg(10, 10, 100, '', { c: '#a9d0f0' })); setEl('ct', `每小格是 ${q.cell}，共 100 格，就是 1 ${q.big}`); } else { setEl('mp', minis(q.k)); setEl('ct', q.down ? `${q.k} 張地圖，每張都一樣多` : `圈成 ${q.k} 張，每張 1 ${q.big}`); } }, () => stepKeypad([q.first[0], `${q.from}是多少${q.to}？`], [q.first[1], q.ans], `看一張地圖有多少，再看有幾張。`, `對了！${q.from}＝${fmt(q.ans)} ${q.to}。`, 'conv', null, { shortcut: true }), { el: document.getElementById('mp'), map: x => x * 2.4 });
  }
  if (q.mode === 'calc') {
    const cols = q.W / 100, rows = q.H / 100;
    frame(`${q.what}長 ${q.W} 公尺、寬 ${q.H} 公尺，是幾公頃？<br>用 1 公頃（每邊 100 公尺）的地圖鋪。`, `<div id="mp">${mapSvg(cols, rows, 0)}</div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, '鋪一排', rows, k => { setEl('mp', mapSvg(cols, rows, k * cols)); setEl('ct', `鋪了 ${k * cols} 公頃`); }, () => stepKeypad(['面積是幾平方公尺？', '是幾公頃？'], [q.m2, q.ans], '每 10000 平方公尺是 1 公頃。', `對了！${q.W}×${q.H}＝${fmt(q.m2)} 平方公尺＝${q.ans} 公頃。`, 'calc', null, { shortcut: true }));
  }
  if (q.mode === 'ton') {
    const [nm, e] = q.obj, toKg = q.tp === 'toKg';
    frame(toKg ? `${e} ${nm}大約 ${q.k} 公噸，是幾公斤？<br>用 100 公斤的沙包秤。` : `${e} ${nm}大約 ${fmt(q.kg)} 公斤，是幾公噸？<br>用 100 公斤的沙包秤。`, `<div class="pics5" id="bg"></div><div class="u-count"><b class="num" id="cn">0</b> 公斤</div>${padHidden()}`);
    return gate(q, '放 100 公斤', 10, k => { setEl('bg', '🛍️'.repeat(k)); document.getElementById('cn').textContent = k * 100; }, () => stepKeypad(['1 公噸是幾公斤？', toKg ? `${q.k} 公噸是幾公斤？` : `${fmt(q.kg)} 公斤是幾公噸？`], [1000, q.ans], '數一數沙包，10 包才 1 公噸。', `對了！1 公噸＝1000 公斤。${q.k} 公噸＝${fmt(q.kg)} 公斤。`, 'ton', null, { shortcut: true }));
  }
  frame(`${q.thing} ${q.a} 公噸，運 ${q.n} 趟，一共多少公斤？`, `<div class="pics5" id="bg"></div><div class="trail" id="ct"></div>${padHidden()}`);
  gate(q, '再運一趟', q.n, k => { setEl('bg', '🚛'.repeat(k)); setEl('ct', `${k} 趟，${q.a * k} 公噸`); }, () => stepKeypad(['一共幾公噸？', '是幾公斤？'], [q.t, q.ans], `${q.a}×${q.n}，再換公斤。`, `對了！${q.a}×${q.n}＝${q.t} 公噸＝${fmt(q.ans)} 公斤。`, 'tcalc', null, { shortcut: true }));
}

/* ---------- 十八：民調中心 ---------- */
function viewRatio(q) {
  if (q.mode === 'rate') {
    const [t1, t2] = q.c;
    frame(`全部 ${q.n} ${t2}，有 ${q.a} ${t1}。<br>點人偶，把符合的塗起來。`, `<div class="people" id="pe">${Array.from({ length: q.n }, (_, i) => `<button class="pp" data-p="${i}">🙂</button>`).join('')}</div><div class="trail" id="ct">還沒塗</div>${padHidden()}`);
    const ask = () => stepKeypad(['塗了幾個（分子）？', '全部有幾個（分母）？'], [q.a, q.n], '比率＝部分÷全部。', `對了！比率是 ${q.a}/${q.n}${q.sa !== q.a ? `，約分成 ${q.sa}/${q.sn}` : ''}。部分不會比全部多，比率不會超過 1。`, 'rate');
    const list = [...document.querySelectorAll('.pp')];
    if (isFast(q)) { list.slice(0, q.a).forEach(b => { b.textContent = '😀'; b.classList.add('on'); }); return afterAct(ask); }
    let k = 0;
    list.forEach(b => b.onclick = () => { if (b.classList.contains('on') || k >= q.a) return; b.classList.add('on'); b.textContent = '😀'; k++; sfx.hop(); setEl('ct', `塗了 ${k} 個`); if (k === q.a) { setMsg('塗好了！', 'good'); afterAct(ask); } });
    return;
  }
  if (q.mode === 'paint') {
    let v = 0;
    frame(`${q.ctx}占 <b class="num">${q.v}%</b>。<br>在百格板上從左上開始拖，塗出 ${q.v}%。`, `<div id="hb"></div><div class="u-count"><b class="num" id="cn">0</b> 格</div><div class="odo three"><button class="turn" id="m1">−1</button><button class="turn" id="p1">＋1</button><button class="turn" id="pX">＋10</button></div>`);
    const draw = () => { setEl('hb', hundred(v)); document.getElementById('cn').textContent = v; };
    draw();
    dragOn(document.getElementById('hb'), (x, y) => { const c = clamp(Math.floor(x * 10), 0, 9), r = clamp(Math.floor(y * 10), 0, 9), nv = r * 10 + c + 1; if (nv !== v) { v = nv; draw(); } }, '.hboard');
    document.getElementById('m1').onclick = () => { v = Math.max(0, v - 1); draw(); };
    document.getElementById('p1').onclick = () => { v = Math.min(100, v + 1); draw(); };
    document.getElementById('pX').onclick = () => { v = Math.min(100, v + 10); draw(); };
    actionBtn('ok', '塗好了').onclick = () => {
      if (v === q.v) return finish(graded(), 'paint', `對了！${q.v}% 就是 100 格裡的 ${q.v} 格，也就是 ${q.v}/100、${(q.v / 100).toFixed(2)}。`);
      if (miss()) { v = q.v; draw(); return finish(0, { wrong: v, ans: q.v }, `${q.v}% 就是 ${q.v} 格。一整張是 100%。`); }
      setMsg(v < q.v ? '還不夠，再塗幾格。' : '塗太多了。', 'hint');
    };
    return;
  }
  if (q.mode === 'to100') {
    const isF = q.sub === 'frac';
    frame(isF ? `${fracHtml(q.a, q.n)} 是百分之幾？<br>把分母變成 100，在百格板上看。` : `${q.d} 是百分之幾？<br>1 格是 0.01，塗出來看。`, `<div id="hb">${hundred(0)}</div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, '塗出來', 1, () => { setEl('hb', hundred(q.ans)); setEl('ct', `塗了 ${q.ans} 格`); }, () => stepKeypad(['是百分之幾？（只按數字）'], [q.ans], isF ? `分母變 100，分子也要一起變。` : '100 格裡有幾格，就是百分之幾。', isF ? `對了！${q.a}/${q.n}＝${q.ans}/100＝${q.ans}%＝${(q.ans / 100)}。` : `對了！${q.d}＝${q.ans}/100＝${q.ans}%。`, 'to100'), { el: document.getElementById('hb'), map: x => x * 1.3 });
  }
  if (q.mode === 'off' || q.mode === 'cheng') {
    const off = q.mode === 'off', K = q.k, [w1, w2, w3] = off ? ['', '', ''] : q.c;
    frame(off ? `${q.thing}定價 ${q.P} 元，打 ${K} 折，要付幾元？<br>打 ${K} 折：把價錢切 10 份，付其中 ${K} 份。` : `${w1}共有 ${q.N} ${w2}，${K} 成${w3}，是幾${w2}？<br>${K} 成：切 10 份拿 ${K} 份。`, `<div id="bb">${barRow(1, 1, '#f7dc8c')}</div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, ['切成 10 份', `塗 ${K} 份`], 2, k => { setEl('bb', barRow(10, k === 2 ? K : 0, '#6ea8dc')); setEl('ct', k === 1 ? `10 份，每份 ${off ? q.P : q.N}÷10` : `塗了 ${K} 份`); }, () => stepKeypad(['每份是多少？', `${K} 份是多少？`], [q.each, q.ans], `先算 1 份，再算 ${K} 份。`, off ? `對了！${q.P}×${K}/10＝${q.ans} 元，便宜了 ${q.P - q.ans} 元。打 ${K} 折就是付 ${K * 10}%。` : `對了！${q.N}×${K}/10＝${q.ans}。${K} 成就是 ${K * 10}%。`, q.mode, null, { shortcut: true }), { el: document.getElementById('bb'), map: x => x * 2.4 });
  }
  const [w1, w2, w3] = q.c;
  frame(`${w1}共 ${q.N} ${w2}，${q.p}% ${w3}，是幾${w2}？<br>把全部切成 100 份。`, `<div id="hb">${hundred(0)}</div><div class="trail" id="ct"></div>${padHidden()}`);
  gate(q, `塗 ${q.p} 份`, 1, () => { setEl('hb', hundred(q.p)); setEl('ct', `每格是 ${q.N}÷100＝${q.one} ${w2}`); }, () => stepKeypad(['每格是多少？', `${q.p} 格是多少？`], [q.one, q.ans], `${q.N} 分成 100 份，再拿 ${q.p} 份。`, `對了！${q.N}×${q.p}/100＝${q.ans} ${w2}。`, 'part', null, { shortcut: true }), { el: document.getElementById('hb'), map: x => x * 1.3 });
}

/* ---------- 十九：水資源站 ---------- */
function tankSvg(level, o) { // 長方體水箱側面：level 0～1；o.rock 放石頭、o.marks 刻度數
  o = o || {}; const W = 200, H = 170, x0 = 50, y0 = 10, hPx = H * level, m = o.marks || 10;
  let s = `<svg class="g5" viewBox="0 0 300 190"><rect x="${x0}" y="${y0 + H - hPx}" width="${W}" height="${hPx}" fill="#a9d0f0"/>`;
  if (o.rockY !== undefined) s += `<ellipse cx="${x0 + W / 2}" cy="${o.rockY}" rx="34" ry="24" fill="#8b8f99" stroke="#33405a" stroke-width="2"/>`;
  s += `<path d="M${x0} ${y0}V${y0 + H}H${x0 + W}V${y0}" fill="none" stroke="#33405a" stroke-width="4"/>`;
  for (let i = 1; i < m; i++) { const y = y0 + H - i * H / m; s += `<line x1="${x0 + W}" x2="${x0 + W + 8}" y1="${y}" y2="${y}" stroke="#33405a"/>`; if (o.lab) s += `<text x="${x0 + W + 12}" y="${y + 4}" class="ax">${i}</text>`; }
  return s + '</svg>';
}
function viewCapacity(q) {
  if (q.mode === 'pick') return unitPick(q);
  if (q.mode === 'liter') {
    frame(`10 公分×10 公分×10 公分的水箱，裝滿是 1 公升。<br>一層一層倒，每層 100 ${q.u}。`, `<div id="tk">${tankSvg(0)}</div><div class="u-count"><b class="num" id="cn">0</b> ${q.u}</div>${padHidden()}`);
    return gate(q, '倒一層', 10, k => { setEl('tk', tankSvg(k / 10)); document.getElementById('cn').textContent = k * 100; }, () => stepKeypad([`1 公升是幾${q.u}？`, `${q.k} 公升是幾${q.u}？`], [1000, q.ans], '數倒了幾層，10 層才滿。', `對了！1 公升＝1000 毫升＝1000 立方公分。${q.k} 公升＝${q.ans} ${q.u}。`, 'liter', null, { shortcut: true }), { el: document.getElementById('tk'), map: (x, y) => (1 - y) * 11 });
  }
  if (q.mode === 'inner') {
    frame(`${q.what}外面長 ${q.W}、寬 ${q.D}、高 ${q.H} 公分，上面沒蓋，厚 1 公分。<br>能裝多少水？水只在裡面。`, `<div id="pp"></div><div class="trail" id="ct"></div>${padHidden()}`);
    const pic = k => { const u = 16, w = q.W * u, h = q.H * u, sc = Math.min(1, 280 / w); return `<svg class="g5" style="max-height:190px" viewBox="-6 -6 ${w + 12} ${h + 12}"><rect width="${w}" height="${h}" fill="${k ? '#c9a36a' : '#e8d9b8'}" stroke="#33405a" stroke-width="2"/>${k ? `<rect x="${k >= 1 ? u : 0}" y="0" width="${w - (k >= 1 ? 2 * u : 0)}" height="${h - (k >= 2 ? u : 0)}" fill="#a9d0f0"/>` : ''}</svg>`; };
    setEl('pp', pic(0));
    return gate(q, ['扣掉左右的厚度', '扣掉底的厚度'], 2, k => { setEl('pp', pic(k)); setEl('ct', k === 1 ? `裡面長 ${q.W - 2}、寬 ${q.D - 2}（兩邊都要扣）` : `裡面高 ${q.ih}（只扣底）`); }, () => stepKeypad(['裡面的底面積是多少？', '裡面的高是多少？', '容積是幾立方公分？'], [q.base, q.ih, q.ans], `底面積 ${q.W - 2}×${q.D - 2}，高 ${q.H}－1。`, `對了！容積是 ${q.base}×${q.ih}＝${q.ans} 立方公分。容積看的是裡面，不是外面。`, 'inner', null, { shortcut: true }));
  }
  if (q.mode === 'level') {
    frame(`水箱底面長 ${q.a}、寬 ${q.b} 公分，倒入 ${q.V} 立方公分的水。<br>水位多高？`, `<div id="tk">${tankSvg(0, { lab: true })}</div><div class="trail" id="ct"></div>${padHidden()}`);
    return gate(q, '水位升 1 公分', q.h, k => { setEl('tk', tankSvg(k / 10, { lab: true })); setEl('ct', `每升 1 公分要 ${q.base} 立方公分，現在 ${q.base * k}`); }, () => stepKeypad(['底面積是多少？', '水位幾公分？'], [q.base, q.ans], `底面積×高＝體積，所以高＝體積÷底面積。`, `對了！${q.V}÷${q.base}＝${q.ans} 公分。`, 'level', null, { shortcut: true }), { el: document.getElementById('tk'), map: (x, y) => (1 - y) * 10.5 });
  }
  if (q.mode === 'rock') {
    frame(`水箱底面長 ${q.a}、寬 ${q.b} 公分，水深 ${q.h1} 公分。<br>把${q.t}往下拖，放進水裡，水位怎麼變？`, `<div id="tk"></div><div class="trail" id="ct"></div>${padHidden()}`);
    const ask = () => stepKeypad(['水位上升幾公分？', '底面積是多少？', `${q.t}的體積是幾立方公分？`], [q.up, q.base, q.ans], `${q.t}占了水的位置，水位才會上升。上升的那一層就是它的體積。`, `對了！${q.a}×${q.b}×${q.up}＝${q.ans} 立方公分。形狀怪也量得出來。`, 'rock', null, { shortcut: true });
    return slideTo(q, 'tk', `把${q.t}放進去`, t => { setEl('tk', tankSvg(t >= 1 ? q.h2 / 16 : q.h1 / 16, { rockY: t >= 1 ? 150 : 8 + t * 130, marks: 16, lab: true })); if (t >= 1) setEl('ct', `水位從 ${q.h1} 升到 ${q.h2} 公分`); }, ask, (x, y) => y);
  }
  frame(`水杯裝滿水，把${q.t}放進去，溢出來的水，倒進量筒。`, `<div id="tk">${tankSvg(.95)}</div><div class="trail" id="ct"></div>${padHidden()}`);
  slideTo(q, 'tk', `放進${q.t}`, t => { setEl('tk', tankSvg(.95, { rockY: 10 + t * 130 })); if (t >= 1) setEl('ct', `溢出 ${q.v} 毫升`); }, () => stepKeypad([`${q.t}的體積是幾立方公分？`], [q.ans], '1 毫升的水就是 1 立方公分。', `對了！溢出 ${q.v} 毫升，${q.t}就是 ${q.v} 立方公分。`, 'over'), (x, y) => y);
}

/* ---------- 二十：建築模型館 ---------- */
function solidSvg(t, n, yaw, pit) {
  const N = t === 'prism' || t === 'pyr' ? n : 28, R = 1.15, H = t === 'ball' ? 0 : 1.5, ya = yaw * Math.PI / 180, pi = pit * Math.PI / 180, cy = Math.cos(ya), sy = Math.sin(ya), cp = Math.cos(pi), sp = Math.sin(pi), U = 78;
  const proj = ([x, y, z]) => { const x1 = x * cy + z * sy, z1 = -x * sy + z * cy, y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp; return [150 + x1 * U, 112 - y1 * U, z2]; };
  if (t === 'ball') return `<svg class="g5" viewBox="0 0 300 225"><defs><radialGradient id="bg5" cx=".35" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#6ea8dc"/></radialGradient></defs><circle cx="150" cy="112" r="95" fill="url(#bg5)" stroke="#33405a" stroke-width="2"/></svg>`;
  const ring = y => Array.from({ length: N }, (_, i) => { const a = i / N * 2 * Math.PI; return [R * Math.cos(a), y, R * Math.sin(a)]; });
  const bot = ring(-H / 2), top = ring(H / 2), apex = [0, H / 2, 0], F = [];
  if (t === 'prism' || t === 'cyl') { F.push({ p: top, c: '#f7dc8c' }, { p: bot, c: '#f7dc8c' }); for (let i = 0; i < N; i++) F.push({ p: [bot[i], bot[(i + 1) % N], top[(i + 1) % N], top[i]], c: '#a9d0f0', ns: t === 'cyl' }); }
  else { F.push({ p: bot, c: '#f7dc8c' }); for (let i = 0; i < N; i++) F.push({ p: [bot[i], bot[(i + 1) % N], apex], c: '#b7e0a8', ns: t === 'cone' }); }
  const fs = F.map(f => { const P = f.p.map(proj); return { ...f, P, z: P.reduce((s, p) => s + p[2], 0) / P.length }; }).sort((a, b) => a.z - b.z);
  return `<svg class="g5" viewBox="0 0 300 225">${fs.map(f => `<polygon points="${f.P.map(p => `${p[0]},${p[1]}`).join(' ')}" fill="${f.c}" fill-opacity="${f.z < -.2 ? .3 : 1}" stroke="${f.ns ? f.c : '#33405a'}" stroke-width="${f.ns ? 1 : 2}"/>`).join('')}</svg>`;
}
function spin5(q, id, t, n, ask) { // 手指轉動立體圖，轉夠了才作答，作答時還可以繼續轉
  let yaw = 30, pit = 20, travel = 0, over = false, lx = null, ly = null;
  const draw = () => setEl(id, solidSvg(t, n, yaw, pit)); draw();
  const el = document.getElementById(id);
  dragOn(el, (x, y) => { if (lx !== null) { const dx = x - lx, dy = y - ly; yaw += dx * 220; pit = clamp(pit + dy * 120, -75, 75); travel += Math.abs(dx * 220) + Math.abs(dy * 120); draw(); if (!over && travel > 80) { over = true; sfx.ok(); afterAct(ask); } } lx = x; ly = y; });
  el.addEventListener('pointerup', () => { lx = ly = null; });
  if (isFast(q)) { over = true; return afterAct(ask); }
  actionBtn('gt', '轉 45 度').onclick = () => { yaw += 45; pit = pit === 20 ? -30 : 20; travel += 45; sfx.hop(); draw(); if (!over && travel >= 90) { over = true; afterAct(ask); } };
}
function netSvg(t, n, st) { // 展開圖；st 1 底面上色、2 側面上色
  const b = st >= 1 ? '#f7dc8c' : '#f4f6fa', c = st >= 2 ? '#a9d0f0' : '#f4f6fa', g = st >= 2 ? '#b7e0a8' : '#f4f6fa';
  const poly = (cx, cy, r, m, rot) => Array.from({ length: m }, (_, i) => { const a = (i / m * 360 + (rot || 0)) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
  let s = '<svg class="g5" viewBox="0 0 320 240">';
  if (t === 'prism') { const w = Math.min(46, 220 / n), L = n * w, x0 = 160 - L / 2, y0 = 80, H = 80; for (let i = 0; i < n; i++) s += `<rect x="${x0 + i * w}" y="${y0}" width="${w}" height="${H}" fill="${c}" stroke="#33405a" stroke-width="2"/>`; const r = w / (2 * Math.sin(Math.PI / n)), ry = r * Math.cos(Math.PI / n); s += `<polygon points="${polyStr(poly(x0 + w / 2, y0 - ry, r, n, 90 + 180 / n))}" fill="${b}" stroke="#33405a" stroke-width="2"/><polygon points="${polyStr(poly(x0 + w / 2, y0 + H + ry, r, n, -90 + 180 / n))}" fill="${b}" stroke="#33405a" stroke-width="2"/>`; }
  if (t === 'pyr') { const r = 34 / Math.sin(Math.PI / n) * .9, P = poly(160, 120, r, n, -90 + 180 / n); P.forEach((p, i) => { const q2 = P[(i + 1) % n], mx = (p[0] + q2[0]) / 2, my = (p[1] + q2[1]) / 2, dx = mx - 160, dy = my - 120, d = Math.hypot(dx, dy); s += `<polygon points="${polyStr([p, q2, [mx + dx / d * 62, my + dy / d * 62]])}" fill="${g}" stroke="#33405a" stroke-width="2"/>`; }); s += `<polygon points="${polyStr(P)}" fill="${b}" stroke="#33405a" stroke-width="2"/>`; }
  if (t === 'cyl') s += `<rect x="70" y="72" width="180" height="96" fill="${c}" stroke="#33405a" stroke-width="2"/><circle cx="130" cy="42" r="29" fill="${b}" stroke="#33405a" stroke-width="2"/><circle cx="130" cy="198" r="29" fill="${b}" stroke="#33405a" stroke-width="2"/>`;
  if (t === 'cone') s += `<path d="M160 20L66 150A110 110 0 0 0 254 150Z" fill="${g}" stroke="#33405a" stroke-width="2"/><circle cx="160" cy="200" r="30" fill="${b}" stroke="#33405a" stroke-width="2"/>`;
  return s + '</svg>';
}
function viewSolid(q) {
  if (q.mode === 'count') {
    frame(`這座建築是${q.name}。用手指轉轉看。<br>${q.w[0]}有幾${q.w[1]}？`, `<div id="bx"></div><div class="trail">底面是${{ 3: '三', 4: '四', 5: '五', 6: '六' }[q.n]}邊形</div>${padHidden()}`);
    const tip = q.t === 'prism' ? { 面: '上下 2 個底面，加上每邊 1 個側面。', 邊: '上一圈、下一圈，再加中間直的。', 頂點: '上一圈、下一圈。' } : { 面: '1 個底面，加上每邊 1 個側面。', 邊: '底一圈，每個頂點再連到尖端。', 頂點: '底一圈，再加尖端 1 個。' };
    return spin5(q, 'bx', q.t, q.n, () => stepKeypad([`${q.w[0]}有幾${q.w[1]}？`], [q.ans], tip[q.w[0]], `對了！${q.name}有 ${q.ans} ${q.w[1]}${q.w[0]}。${tip[q.w[0]]}`, 'count'));
  }
  if (q.mode === 'name') {
    frame(`${q.r[1]} ${q.r[0]}的形狀叫什麼？<br>轉轉這個模型，再回答。`, `<div id="bx"></div>`);
    return spin5(q, 'bx', q.r[2], q.r[3], () => pickOne(q.options, q.options.indexOf(q.right), '上下一樣粗是柱，頂端尖尖是錐，看底面的形狀。', `對了！${q.r[0]}就像${q.right}。`, 'name'));
  }
  if (q.mode === 'rel') {
    frame(`${q.text}，是什麼關係？<br>放在桌上轉一轉。`, `<div id="bx"></div>`);
    const opts = [q.ans, q.other].sort();
    return spin5(q, 'bx', q.t, q.n, () => pickOne(opts, opts.indexOf(q.ans), '把它想成站在桌上，側面是直的還是斜的？', `對了！${q.why}，所以是${q.ans}。`, 'rel'));
  }
  if (q.mode === 'net') {
    frame('這張展開圖摺起來是什麼？<br>先塗底面，再塗側面。', `<div id="nt">${netSvg(q.t, q.n, 0)}</div><div class="trail" id="ct"></div>`);
    const side = q.t === 'prism' ? '長方形' : q.t === 'cyl' ? '長方形（捲成一圈）' : q.t === 'pyr' ? '三角形' : '扇形', cnt = q.t === 'prism' || q.t === 'cyl' ? 2 : 1;
    return gate(q, ['塗底面', '塗側面'], 2, k => { setEl('nt', netSvg(q.t, q.n, k)); setEl('ct', k === 1 ? `有 ${cnt} 個底面` : `側面是${side}`); }, () => pickOne(q.options, q.options.indexOf(q.right), '柱有 2 個底面，錐只有 1 個；再看底面有幾個邊。', `對了！是${q.right}。`, 'net'));
  }
  let y = 0;
  frame(`把${q.thing}（半徑 ${q.r} 公分）切開。<br>拖刀子上下移，切開的面是什麼形狀？`, `<div id="bl"></div><div class="trail" id="ct"></div>${padHidden()}`);
  const draw = t => { const d = (1 - t) * 90, ch = Math.sqrt(Math.max(0, 95 * 95 - d * d)); setEl('bl', `<svg class="g5" viewBox="0 0 300 220"><circle cx="150" cy="110" r="95" fill="#e8f0f8" stroke="#33405a" stroke-width="2"/><ellipse cx="150" cy="${110 - d}" rx="${ch}" ry="${ch * .22}" fill="#f4a9a0" stroke="#d6476b" stroke-width="2"/><circle cx="150" cy="110" r="4" fill="#33405a"/><line x1="10" x2="290" y1="${110 - d}" y2="${110 - d}" stroke="#d6476b" stroke-width="2" stroke-dasharray="6 4"/></svg>`); setEl('ct', t >= 1 ? '穿過球心時，切開的圓最大' : '都是圓，大小不一樣'); };
  slideTo(q, 'bl', '切過球心', draw, () => stepKeypad(['最大的圓，直徑是幾公分？'], [q.ans], `切過球心時，直徑是半徑的 2 倍。`, `對了！${q.r}×2＝${q.ans} 公分。球怎麼切都是圓，切過球心的最大。`, 'ball'), (x, yy) => yy * 1.1);
}

Object.assign(VIEWS, { fcalc: viewFcalc, decimal: viewDecimal, dmul: viewDmul, sector: viewSector, volume: viewVolume, ddiv: viewDdiv, bigunit: viewBigunit, ratio: viewRatio, capacity: viewCapacity, solid: viewSolid });
/* ---------- 單位教室（五下的公畝、公頃、公噸、公升等由 views5b 的工坊一起加進來） ---------- */
const LESSONS = {
  land: {
    title: '大面積', sem: '五下', icon: '🗺️', who: 'seal', name: '波波', say: '地方越大，單位越大。在地圖上鋪鋪看。',
    cards: [
      { e: '🏡', u: '公畝', t: '邊長 10 公尺的正方形，面積 100 平方公尺。大約一間半教室。' },
      { e: '⚽', u: '公頃', t: '邊長 100 公尺的正方形，面積 10000 平方公尺＝100 公畝。一座足球場比它小一些，可以約略比較。' },
      { e: '🏙️', u: '平方公里', t: '邊長 1 公里的正方形，面積 1 平方公里＝100 公頃。' },
    ],
    labs: [{ view: 'map', n: 10, each: 10, from: '公畝', to: '100 公畝', btn: '鋪一排（10 公畝）', done: '100 公畝就是 1 公頃！' }, { view: 'map', n: 10, each: 10, from: '公頃', to: '100 公頃', btn: '鋪一排（10 公頃）', done: '100 公頃就是 1 平方公里！月球城的目標就是這麼大。' }],
  },
  ton: {
    title: '重量', sem: '五下', icon: '🐘', who: 'turtle', name: '阿穩', say: '大象、貨車太重了，用公斤數字太大。',
    cards: [{ e: '🌾', u: '公斤', t: '一袋米大約 20 公斤。' }, { e: '🐘', u: '公噸', t: '1 公噸＝1000 公斤。一輛小汽車大約 2 公噸。' }],
    labs: [{ view: 'ton', n: 10, each: 100, from: '公斤', to: '1000 公斤', btn: '放 100 公斤的沙包', done: '1000 公斤就是 1 公噸！一輛小汽車大約 2 公噸。' }],
  },
  cap: {
    title: '容量', sem: '五下', icon: '🚰', who: 'otter', name: '水水', say: '倒水最清楚：水占的空間就是體積。',
    cards: [{ e: '🥤', u: '毫升', t: '1 毫升和 1 立方公分是相同的體積。一杯飲料大約 500 毫升。' }, { e: '🍼', u: '公升', t: '1 公升＝1000 毫升。內部每邊 10 公分的正方體容器，容積是 1 公升。' }],
    labs: [{ view: 'pour', n: 10, each: 100, from: '毫升', to: '1000 毫升', btn: '倒一層（100 毫升）', done: '10×10×10＝1000 立方公分，裝 1000 毫升，就是 1 公升！' }],
  },
  m3: {
    title: '大體積', sem: '五下', icon: '📦', who: 'octopus', name: '八八', say: '房子、貨櫃太大了，要用更大的方塊。',
    cards: [{ e: '🎲', u: '立方公分', t: '邊長 1 公分的正方體，例如一個模型小方塊。' }, { e: '📦', u: '立方公尺', t: '邊長 1 公尺的正方體，大約一台大冰箱那麼大。' }],
    labs: [{ view: 'frame', n: 12, each: 1, from: '根棍子', to: '12 根', btn: '搭一根 1 公尺的棍子', done: '這個框圍出的空間，就是 1 立方公尺。' }],
  },
  deg: {
    title: '角度', sem: '五上', icon: '📐', who: 'goat', name: '角爺爺', say: '圍牆轉彎的地方都有角。角的大小用「度」來說。',
    cards: [{ e: '📐', u: '度', t: '把一整圈平均分成 360 份，每份是 1 度。平角 180 度，直角 90 度。' }],
    labs: [{ view: 'angle', n: 18, each: 10, from: '度', to: '180 度', btn: '或按這裡轉 10 度', done: '180 度是一條直線。等一下三角形的角會用到它。' }],
  },
  m2: {
    title: '面積', sem: '五上', icon: '🟩', who: 'sheep', name: '咩咩', say: '小東西用平方公分，大地方用平方公尺。',
    cards: [
      { e: '👆', u: '平方公分', t: '邊長 1 公分的正方形，例如方格紙上的一小格。' },
      { e: '🟩', u: '平方公尺', t: '邊長 1 公尺的正方形。1 平方公尺＝10000 平方公分。' },
    ],
    labs: [{ view: 'board', n: 10, each: 1000, from: '平方公分', to: '10000 平方公分', btn: '鋪一排（1000 平方公分）', done: '每邊 100 公分，鋪滿要 100×100＝10000 平方公分，就是 1 平方公尺！' }],
  },
  time: {
    title: '時間', sem: '五上', icon: '⏰', who: 'raccoon', name: '秤秤', say: '時間不是滿 100 才換，要先記得每個單位多大。',
    cards: [
      { e: '👏', u: '秒', t: '跟著每秒一次的節拍拍手，兩聲之間是 1 秒。60 秒是 1 分鐘。' },
      { e: '🍜', u: '分鐘', t: '泡麵大約 3 分鐘。60 分鐘是 1 小時。' },
      { e: '🎬', u: '小時', t: '一部電影大約 2 小時。24 小時是 1 日。' },
      { e: '🗓️', u: '日', t: '24 小時，例如從今天上午 8 點到明天上午 8 點。' },
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
  if (X.view === 'map') return mapSvg(10, 10, k * 10);
  if (X.view === 'ton') return `<div class="pics5">${'🛍️'.repeat(k)}</div>`;
  if (X.view === 'pour') return tankSvg(k / 10);
  if (X.view === 'frame') { const P = [[60, 150], [190, 150], [190, 40], [60, 40], [110, 120], [240, 120], [240, 10], [110, 10]], E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]; return `<svg class="g5" style="max-height:170px" viewBox="40 0 220 165">${E.slice(0, k).map(e => `<line x1="${P[e[0]][0]}" y1="${P[e[0]][1]}" x2="${P[e[1]][0]}" y2="${P[e[1]][1]}" stroke="#a9702a" stroke-width="5"/>`).join('')}</svg>`; }
  return dayBar(Math.min(k * X.each * 60, 1439), 0);
}
const LESSON_BEFORE = { poly: ['deg'], para: ['m2'], cuboid: ['m2'], ttime: ['time'], bigunit: ['land', 'ton'], capacity: ['cap'], volume: ['m3'] };
/* ---------- 新概念小故事（鷹架版）：舊經驗 → 先猜 → 示範・一起做・自己做 → 東西→簡圖→算式 → 正反例 → 命名 → 選對的話 → 換情境驗收（答錯回到出錯的那一步）
   命名之前，畫面和文字都不出現新詞；一段只教一個新詞；數字小。 ---------- */
const T = w => `<b class="term">${w}</b>`;
const C1 = '#d6476b', C2 = '#2f7fd0', C3 = '#2e9a52', C4 = '#e08a1e';
const K = (v, c) => `<b class="k5" style="color:${c};border-color:${c}">${v}</b>`; // 有顏色的數字，連回圖上同色的地方
const cBar = (n, a, c) => barRow(n, a, c || '#6ea8dc');
const em = (s, n) => `<span class="em5">${s.repeat(n)}</span>`;
const tri5 = (P, lab) => `<svg class="g5" style="max-height:130px" viewBox="0 0 320 170"><polygon points="${polyStr(P)}" fill="#fff0cf" stroke="#7a5b2e" stroke-width="3"/>${lab || ''}</svg>`;
const triAngles = P => { const a = Math.round(ptAng(P[2], P[0], P[1])), b = Math.round(ptAng(P[0], P[1], P[2])); return [a, b, 180 - a - b]; };
function wedgePie(parts, o) { // parts：[{f 占一圈多少, c 顏色, t 可點的 id}]
  o = o || {}; const R = 54, cx = 60, cy = 60; let a = -90, s = `<svg class="pie ${o.cls || ''}" viewBox="0 0 120 120"><circle cx="60" cy="60" r="58" fill="#c98f4a"/>`;
  const P = d => `${cx + R * Math.cos(d * Math.PI / 180)} ${cy + R * Math.sin(d * Math.PI / 180)}`;
  parts.forEach(p => { const b = a + p.f * 360; s += p.f >= .999 ? `<circle cx="60" cy="60" r="${R}" fill="${p.c}" ${p.t !== undefined ? `data-t="${p.t}"` : ''} stroke="#a9702a" stroke-width="2"/>` : `<path d="M60 60L${P(a)}A${R} ${R} 0 ${p.f > .5 ? 1 : 0} 1 ${P(b)}Z" fill="${p.c}" stroke="#a9702a" stroke-width="2" ${p.t !== undefined ? `data-t="${p.t}" class="tap5"` : ''}/>`; a = b; });
  return s + '</svg>';
}
const PIE_ON = '#d6476b', PIE_OFF = '#fff0cf';
function roomSvg(on, red) { // 一點透視的房間：floor ceil back left right
  const F = { ceil: [[20, 20], [300, 20], [220, 70], [100, 70]], floor: [[100, 150], [220, 150], [300, 200], [20, 200]], back: [[100, 70], [220, 70], [220, 150], [100, 150]], left: [[20, 20], [100, 70], [100, 150], [20, 200]], right: [[300, 20], [220, 70], [220, 150], [300, 200]] };
  const N = { ceil: '天花板', floor: '地板', back: '後牆', left: '左牆', right: '右牆' };
  return `<svg class="g5" style="max-height:200px" viewBox="0 0 320 220">${Object.entries(F).map(([k, P]) => `<polygon points="${polyStr(P)}" data-t="${k}" class="tap5" fill="${k === red ? '#e0455a' : on.has(k) ? '#ffd65a' : '#f4f6fa'}" stroke="#33405a" stroke-width="2"/><text x="${P.reduce((s, p) => s + p[0], 0) / 4}" y="${P.reduce((s, p) => s + p[1], 0) / 4 + 5}" text-anchor="middle" class="ax" style="pointer-events:none">${N[k]}</text>`).join('')}</svg>`;
}
const NET_A = [[0, 1], [1, 0], [1, 1], [1, 2], [1, 3], [2, 1]], NET_BAD = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]];

/* ---------- 四種可以「對東西做事」的板子 ---------- */
const BOARDS = {
  counter: { // 點同一個東西 n 次（拿一塊地磚、過一秒、倒一層水）
    init: () => 0, copy: k => k, next: () => 'x', done: (p, k) => k >= p.n,
    tap: (p, k, id) => id === 'x' && k < p.n ? { st: k + 1 } : { hint: p.hint || '點發亮的那個東西。' },
    draw: (p, k) => p.draw(k), status: (p, k) => p.st ? p.st(k) : '', result: (p, k) => p.res,
  },
  tapSet: { // 要點的東西有好幾個，每個點一次；點錯給一句提示
    init: () => new Set(), copy: s => new Set(s), next: (p, s) => p.right.find(r => !s.has(r)), done: (p, s) => p.right.every(r => s.has(r)),
    tap: (p, s, id) => { if (p.right.includes(id)) { if (s.has(id)) return { hint: '這個做過了，換下一個。' }; const n = new Set(s); n.add(id); return { st: n }; } return { hint: (p.hints && p.hints[id]) || p.hint || '再看看，不是這一個。' }; },
    draw: (p, s) => p.draw(s), status: (p, s) => p.st ? p.st(s) : '', result: p => p.res,
  },
  two: { // 兩個披薩各自切細，切到塊一樣大
    init: () => ({ x: 1, y: 1 }), copy: s => ({ ...s }), next: (p, s) => p.n * s.x < p.m * s.y ? 'L' : 'R', done: (p, s) => p.n * s.x === p.m * s.y,
    tap: (p, s, id) => { const r = { ...s }; if (id === 'L') r.x++; else if (id === 'R') r.y++; else return { hint: '點一個披薩，每塊再切一刀。' }; if (p.n * r.x > 12 || p.m * r.y > 12) return { hint: '切太細了。先切塊比較大的那一個。' }; return { st: r }; },
    draw: (p, s) => `<div class="vs two5"><span data-t="L" class="tap5w">${wedgePie(Array.from({ length: p.n * s.x }, (_, i) => ({ f: 1 / (p.n * s.x), c: i < s.x ? PIE_ON : PIE_OFF })))}<small>${p.n * s.x} 塊</small></span><span data-t="R" class="tap5w">${wedgePie(Array.from({ length: p.m * s.y }, (_, i) => ({ f: 1 / (p.m * s.y), c: i < s.y * p.b ? '#f0a03c' : PIE_OFF })))}<small>${p.m * s.y} 塊</small></span></div>`,
    status: (p, s) => p.n * s.x === p.m * s.y ? '兩個都切成一樣大的塊了！' : '塊的大小還不一樣', result: p => p.res,
  },
  tanks: { // 點最高的水塔，倒一格給最低的
    init: p => p.L.slice(), copy: L => L.slice(), next: (p, L) => String(L.indexOf(Math.max(...L))), done: (p, L) => L.every(x => x === L[0]),
    tap: (p, L, id) => { const i = +id, mx = Math.max(...L), mn = Math.min(...L); if (L[i] !== mx || mx === mn) return { hint: '從最高的那一個倒出來。' }; const r = L.slice(); r[i]--; r[r.indexOf(mn)]++; return { st: r }; },
    draw: (p, L) => `<div class="tanks">${L.map((v, i) => `<div class="tank tap5w" data-t="${i}"><div class="wtr">${'<i></i>'.repeat(v)}</div><b class="num">${v}</b></div>`).join('')}</div>`,
    status: (p, L) => L.every(x => x === L[0]) ? '一樣高了！' : '高高低低', result: p => p.res,
  },
};

/* ---------- 一段小故事的場景 ---------- */
// mk：hook 舊經驗、guess 先猜、rounds 示範・一起做・自己做（solo 可附 predict 先猜下一個）、reveal 揭曉猜測、fade 三步淡化、sort 正反例、kid＋term 命名、pick 選對的話、check 驗收
function mk(o) {
  const sc = [{ t: 'hook', say: o.hook, pic: o.hookPic }];
  if (o.guess) sc.push({ t: 'guess', q: o.guess[0], opts: o.guess[1], a: o.guess[2] }); // a：結果揭曉時拿來和孩子的想法對照
  const modes = ['demo', 'together', 'solo'];
  o.rounds.forEach((r, i) => sc.push({ t: 'board', mode: modes[i], ...r, mh: r.mh || o.mh }));
  const solo = sc.length - 1;
  if (o.reveal) sc.push({ t: 'reveal', say: o.reveal, pic: o.revealPic });
  sc.push({ t: 'fade', steps: o.fade });
  if (o.sort) sc.push({ t: 'sort', ...o.sort });
  sc.push({ t: 'name', kid: o.kid, say: o.nameSay, term: o.term, pic: o.namePic || o.fade[1].h });
  sc.push({ t: 'pick', opts: o.pick[0], a: o.pick[1], why: o.pick[2] }); // why 可以是每個選項各一句（對應錯因）
  if (o.pose) sc.push({ t: 'pose', ...o.pose }); // 選一個合適的問題／拼成一道題／資料夠嗎／改一個條件
  sc.push({ t: 'check', ...o.check, back: o.check.back === undefined ? solo : o.check.back });
  return { key: o.key, title: o.title, terms: [o.term], who: o.who, game: o.game, when: o.when || [], board: o.board, scenes: sc };
}
const rowsDraw = (n, w, e) => k => { const rows = []; for (let i = 0; i < k; i += w) rows.push(`<div class="row6">${em(e, Math.min(w, k - i))}</div>`); return `<div class="rows6">${rows.join('') || '<div class="trail">還沒放</div>'}</div><div class="pile6">${k < n ? `<span class="tap5w big6" data-t="x">${e}</span>${em(e, n - k - 1)}` : ''}</div>`; };
const rowsSt = (n, w) => k => { const full = Math.floor(k / w), r = k % w; return k < n ? `放了 ${k} 塊` : r ? `最後一排只有 ${r} 塊，排不滿` : `剛好排完：每排 ${w} 塊，${full} 排`; };
const rowsRound = (n, w, e, say) => ({ p: { n, draw: rowsDraw(n, w, e), st: rowsSt(n, w), res: n % w ? `每排 ${w} 塊，最後一排排不滿。` : `每排 ${w} 塊，剛好排 ${n / w} 排。` }, say });

/* ---------- 三段樣本：因數、擴分、分數倍 ---------- */
const SEGS = [
  mk({ key: 'factor', title: '因數', term: '因數', who: 'octopus', game: 'factor', when: ['factor:rect', 'factor:fit'], board: 'counter',
    hook: '先看一個排隊的例子：6 個人每排站 2 個，可以站成 3 排，沒有人落單。今天用同樣的方法排地磚。', hookPic: () => em('🟫', 6),
    mh: '一塊一塊放，排滿一排再排下一排。最後看最後一排有沒有排滿。',
    rounds: [rowsRound(6, 2, '🟫', '看我做：6 塊地磚，我每排放 2 塊。一塊一塊放⋯⋯'), rowsRound(6, 4, '🟫', '一起做：這次每排放 4 塊。我先放幾塊，剩下的你點。'), { ...rowsRound(6, 3, '🟫', '換你做：每排放 3 塊，一塊一塊點。'), predict: ['先預測：每排 3 塊，會剛好排完嗎？', ['會剛好', '會排不滿'], 0] }],
    fade: [{ h: `<div class="rows6"><div class="row6">${em('🟫', 2)}</div><div class="row6">${em('🟫', 2)}</div><div class="row6">${em('🟫', 2)}</div></div>`, t: '第 1 步：真的地磚，每排 2 塊，排了 3 排。' },
      { h: `<svg class="g5" style="max-height:120px" viewBox="0 0 140 110"><g>${[0, 1, 2].map(r => [0, 1].map(c => `<rect x="${20 + c * 32}" y="${8 + r * 32}" width="30" height="30" fill="#e0b070" stroke="#7a5b2e"/>`).join('')).join('')}</g><text x="52" y="108" text-anchor="middle" class="ax" fill="${C1}" style="fill:${C1}">每排 2</text><text x="100" y="58" class="ax" style="fill:${C2}">3 排</text></svg>`, t: '第 2 步：畫成方格。紅色是每排幾塊，藍色是幾排。' },
      { h: `<div class="eq5">${K(2, C1)} × ${K(3, C2)} ＝ ${K(6, C3)}</div><div class="trail">紅 2：每排 2 塊　藍 3：排了 3 排　綠 6：全部 6 塊</div>`, t: '第 3 步：寫成算式，每個數都是圖上的一個地方。' }],
    sort: { q: '6 塊地磚，每排放幾塊能剛好排完？把卡片放進對的那一邊。', items: [1, 2, 3, 4, 5, 6].map(w => ({ h: `每排 ${w} 塊`, c: 6 % w ? 1 : 0 })), bins: ['剛好排完', '排不滿'], hint: '在心裡排排看：最後一排會不會滿？', done: '1、2、3、6 都能剛好排完；4、5 排不滿。' },
    nameSay: `每排 3 塊，6 塊剛好排成 2 排：6÷3＝2，沒有餘數。<br>像 1、2、3、6 這樣，能把 6 剛好分完的數，叫作 6 的${T('因數')}。4 會剩下 2 塊，所以 4 不是。`, namePic: `<div class="eq5">${K(1, C1)}、${K(2, C1)}、${K(3, C1)}、${K(6, C1)}</div>`,
    pick: [['4 是 6 的因數，因為 4 比 6 小。', '3 是 6 的因數，因為每排 3 塊能剛好排完。', '比 6 大的數都是 6 的因數。'], 1, ['比 6 小不一定行：每排 4 塊，最後一排只有 2 塊。', '', '每排 7 塊，連一排都排不滿。']],
    pose: { kind: 'pic', q: '哪一個問題是在問「3 是不是 9 的因數」？', pic: () => `<div class="rows6">${[0, 1, 2].map(() => `<div class="row6">${em('🥚', 3)}</div>`).join('')}</div>`, opts: ['9 顆蛋，每盒裝 3 顆，剛好裝完嗎？', '9 顆蛋，又買 3 顆，一共幾顆？', '9 顆蛋，吃掉 3 顆，還剩幾顆？'], a: 0, why: ['', '這是把蛋加起來，不是問能不能剛好分完。', '這是拿走一些，不是問能不能剛好分完。'], ok: '對了！這個問題和排地磚一樣，問能不能剛好分完。' },
    check: { q: '8 顆糖，每袋裝 3 顆，剛好裝完嗎？3 是 8 的因數嗎？', pic: () => `<div class="rows6"><div class="row6">${em('🍬', 3)}</div><div class="row6">${em('🍬', 3)}</div><div class="row6">${em('🍬', 2)}</div></div>`, opts: ['是', '不是'], a: 1, hint: '回到剛才「每排 3 塊」那一步：最後一排有沒有滿？', hints: ['最後一袋只有 2 顆，不是 3 顆：8÷3 有餘數。', ''], ok: '對了，你看了最後一袋：只有 2 顆，沒有剛好裝完，3 不是 8 的因數。' } }),

  mk({ key: 'expand', title: '擴分', term: '擴分', who: 'rabbit', game: 'ext', when: ['ext:slice'], board: 'tapSet',
    hook: '這是一個披薩，平均分成 2 塊，紅色是其中 1 塊，也就是這個披薩的 1/2。', hookPic: () => wedgePie([{ f: .5, c: PIE_ON }, { f: .5, c: PIE_OFF }]),
    guess: ['如果把每一塊再平均分成 2 塊，紅色部分的大小會改變嗎？', ['變多', '一樣多', '變少'], 1],
    mh: '每一塊都要點到，點一下就把那一塊平均分成 2 塊。紅的和白的都要分。',
    rounds: [1, 2, 3].map((r, i) => { const n = [2, 3, 3][i], a = [1, 1, 2][i]; return { p: { right: Array.from({ length: n }, (_, j) => String(j)), draw: s => `<div class="vs">${wedgePie([].concat(...Array.from({ length: n }, (_, j) => s.has(String(j)) ? [{ f: 1 / n / 2, c: j < a ? PIE_ON : PIE_OFF }, { f: 1 / n / 2, c: j < a ? PIE_ON : PIE_OFF }] : [{ f: 1 / n, c: j < a ? PIE_ON : PIE_OFF, t: String(j) }])))}</div>`, st: s => `紅色：${[...Array(n)].reduce((c, _, j) => c + (j < a ? (s.has(String(j)) ? 2 : 1) : 0), 0)} 塊，全部 ${n + s.size} 塊`, res: `全部的塊數和紅色的塊數都變成 2 倍，紅色部分的大小沒有變。` }, say: ['看我做：這個披薩的 1/2 是紅色。我把每一塊都再平均分成 2 塊。', '一起做：紅色是 1/3 個披薩。我先把一塊平均分成 2 塊，剩下的你點。', '換你做：紅色是 2/3 個披薩，每一塊都點一下，平均分成 2 塊。'][i], predict: i === 2 ? ['先預測：分完以後，紅色會是幾塊？', ['2 塊', '4 塊', '6 塊'], 1] : null }; }),
    reveal: '塊數變多了，紅色部分的大小沒有變。', revealPic: () => `<div class="vs two5">${wedgePie([{ f: .5, c: PIE_ON }, { f: .5, c: PIE_OFF }])}${wedgePie([{ f: .25, c: PIE_ON }, { f: .25, c: PIE_ON }, { f: .25, c: PIE_OFF }, { f: .25, c: PIE_OFF }])}</div>`,
    fade: [{ h: `<div class="vs two5">${wedgePie([{ f: .5, c: PIE_ON }, { f: .5, c: PIE_OFF }])}<b>→</b>${wedgePie([{ f: .25, c: PIE_ON }, { f: .25, c: PIE_ON }, { f: .25, c: PIE_OFF }, { f: .25, c: PIE_OFF }])}</div>`, t: '第 1 步：真的披薩，每塊再平均分成 2 塊。' },
      { h: `${barRow(2, 1, PIE_ON)}${barRow(4, 2, PIE_ON)}`, t: '第 2 步：畫成長條。上下兩條的紅色一樣長。' },
      { h: `<div class="eq5"><span class="fr5">${K(1, C1)}<i></i>${K(2, C2)}</span> ＝ <span class="fr5">${K(2, C1)}<i></i>${K(4, C2)}</span></div><div class="trail">紅：分子（紅色塊數）1→2　藍：分母（全部塊數）2→4　兩個都乘 2</div>`, t: '第 3 步：寫成分數：分子（上面的數）和分母（下面的數）都乘 2。' }],
    nameSay: `分子和分母同乘一個大於 1 的整數（這裡是 2），分數的值不變。<br>這樣改寫分數，叫作${T('擴分')}。`,
    pick: [['擴分以後，紅色部分變多了。', '擴分是分子和分母同乘一個大於 1 的整數，分數的值不變。', '擴分只要把分母乘 2。'], 1, ['看披薩：塊數變多，紅色部分大小不變。', '', '只乘分母，1/2 會變成 1/4，紅色就變少了。']],
    pose: { kind: 'change', q: '紅色仍是 1/2 個披薩，這次每一塊平均分成 3 塊。紅色部分的大小會變嗎？', pic: () => wedgePie([{ f: .5, c: PIE_ON }, { f: .5, c: PIE_OFF }]), opts: ['會變多', '不會變', '會變少'], a: 1, why: ['分得再細，只是塊數變多；紅色部分的範圍沒有變。', '', '分子分母都乘 3，紅色部分不會變少。'], ok: '對了，1/2＝3/6。分得更細，只改變塊數。' },
    check: { q: '一片巧克力平均分成 3 格，塗色 2 格，是 2/3 片。每一格再平均分成 2 小格，塗色的現在是全部 6 小格裡的幾格？', pic: () => `<div class="vs">${foodSvg(['巧克力', 'bar', '片'], 3, 2)}</div>`, opts: ['2 格', '4 格', '6 格'], a: 1, hint: '回到「每一塊都分成 2 塊」那一步：塗色的 2 格，每格變成幾小格？', hints: ['2 格是分之前的格數；每格分成 2 小格後要再數一次。', '', '6 是全部的小格數，塗色的只有一部分。'], ok: '對了，塗色的 2 格各分成 2 小格，共 4 小格：2/3＝4/6。' } }),

  mk({ key: 'ffrac', title: '分數倍', term: '分數倍', who: 'rabbit', game: 'fcalc', when: ['fcalc:of', 'fcalc:times', 'fcalc:area', 'fcalc:fdiv', 'fcalc:cmp'], board: 'counter',
    hook: '先回想整數倍：6 顆蘋果的 2 倍，是拿 2 次 6 顆，6×2＝12 顆。', hookPic: () => `${em('🍎', 6)}<b> ×2 → </b>${em('🍎', 12)}`,
    guess: ['那 6 顆蘋果的 1/2 倍，會比 6 顆多還是少？', ['比 6 多', '一樣', '比 6 少'], 2],
    mh: '先點全部的蘋果，把它平均分成幾份；再點其中一份拿走。',
    rounds: [[6, 2, 1], [6, 3, 1], [8, 4, 1]].map(([n, d, a], i) => ({ p: { n: 2, draw: k => `<div class="grps">${k === 0 ? `<span class="grp tap5w" data-t="x">${em('🍎', n)}</span>` : Array.from({ length: d }, (_, j) => `<span class="grp ${k >= 2 && j < a ? 'on' : ''} ${k === 1 && j === 0 ? 'tap5w' : ''}" ${k === 1 && j === 0 ? 'data-t="x"' : ''}>${em('🍎', n / d)}</span>`).join('')}</div>`, st: k => [`${n} 顆蘋果`, `平均分成 ${d} 份，每份 ${n / d} 顆`, `取 1 份：${n / d} 顆`][k], res: `${n} 顆的 1/${d} 倍，是 ${n / d} 顆，比 ${n} 顆少。` }, say: [`看我做：求 6 顆的 1/2 倍。先點蘋果，平均分成 2 份，再點一份拿走。`, `一起做：6 顆的 1/3 倍。我先平均分成 3 份，你點一份拿走。`, `換你做：8 顆的 1/4 倍。先平均分成 4 份，再取 1 份。`][i], predict: i === 2 ? ['先預測：8 顆的 1/4 倍是幾顆？', ['2 顆', '4 顆', '32 顆'], 0] : null })),
    reveal: '6 的 1/2 倍是平均分成 2 份、取 1 份，得到 3 顆，比 6 顆少。乘的數比 1 小時，得到的比原來少。', revealPic: () => `${em('🍎', 6)}<b> ×1/2 → </b>${em('🍎', 3)}`,
    fade: [{ h: `<div class="grps"><span class="grp on">${em('🍎', 2)}</span><span class="grp">${em('🍎', 2)}</span><span class="grp">${em('🍎', 2)}</span></div>`, t: '第 1 步：6 顆蘋果平均分成 3 份，取 1 份。' },
      { h: `${barRow(3, 1, C1)}<div class="trail">一整條是 6 顆，平均分成 3 段，塗 1 段</div>`, t: '第 2 步：畫成長條。' },
      { h: `<div class="eq5">${K(6, C2)} × <span class="fr5">${K(1, C1)}<i></i>${K(3, C3)}</span> ＝ ${K(2, C4)}</div><div class="trail">藍 6：一整條　綠 3：平均分成 3 段　紅 1：取 1 段　橘 2：得到 2 顆</div>`, t: '第 3 步：寫成算式，每個數連回長條。' }],
    sort: { q: '原數都是正的。哪些會比原來少？放進對的那一邊。', items: [['6×1/2', 0], ['6×2', 1], ['8×1/4', 0], ['6×2/3', 0], ['6×3/2', 1]].map(([h, c]) => ({ h, c })), bins: ['比原來少', '比原來多'], hint: '乘的數比 1 小，就只拿了一部分；乘的數比 1 大，就比原來多。', done: '乘的數介於 0 和 1 之間時變少（6 的 2/3 倍是平均分成 3 份取 2 份，得 4）；比 1 大時變多（6 的 3/2 倍是 9）。' },
    nameSay: `求 6 的 1/3 倍，就是把 6 平均分成 3 份，取其中 1 份，寫成 6×1/3＝2。<br>像這樣用分數表示「幾倍」，叫作${T('分數倍')}。`,
    pick: [['乘法的答案一定比原來大。', '6×1/3 是把 6 平均分成 3 份取 1 份，得到 2。', '6×1/3 是 18。'], 1, ['乘的數比 1 小時，答案會比原來小，像 6×1/2＝3。', '', '18 是 6×3。×1/3 是平均分成 3 份取 1 份。']],
    pose: { q: '把三張卡拼成一道題，要能用「8×1/4」來算。每一列選一張，合理的選法不只一種。', rows: [{ label: '東西', cards: ['8 顆糖', '8 張貼紙', '1/4 顆糖'], ok: [0, 1], why: '算式裡的 8 是全部有多少，不是 1/4。' }, { label: '怎麼做', cards: ['平均分成 4 份，取 1 份，', '再買 4 個，'], ok: [0], why: '×1/4 是平均分成 4 份取 1 份，不是再買。' }, { label: '問什麼', cards: ['拿到多少？', '今天星期幾？'], ok: [0], why: '問的要是算式能算出來的東西。' }], ok: '拼好了！這一題可以用 8×1/4 算：8 平均分成 4 份，取 1 份，得 2。' },
    check: { q: '12 元的 1/2 倍是幾元？', pic: () => `${em('🟡', 12)}`, opts: ['6 元', '12 元', '24 元'], a: 0, hint: '回到「平均分成幾份、取一份」那一步：12 元平均分成 2 份，取 1 份。', hints: ['', '12 元是原來的錢；1/2 倍要平均分成 2 份取 1 份。', '24 元是 12 的 2 倍，不是 1/2 倍。'], ok: '對了，你把 12 元平均分成 2 份、取 1 份：12×1/2＝6 元，比 12 少。' } }),
];

/* ---------- 還沒改成鷹架版的段落，暫用舊版（逐段改完就刪） ---------- */
const paraCut = t => { const W = 180, H = 90, S = 50, x = 40, y = 15, d = t * W; return `<svg class="g5" style="max-height:170px" viewBox="0 0 320 125"><polygon points="${x + S},${y} ${x + W + S},${y} ${x + W},${y + H} ${x + S},${y + H}" fill="#cfe6c6" stroke="#4a8a3e" stroke-width="2"/><polygon points="${x + d},${y + H} ${x + S + d},${y} ${x + S + d},${y + H}" fill="#f4a9a0" stroke="#d6476b" stroke-width="2"/><line x1="${x + S}" x2="${x + S}" y1="${y}" y2="${y + H}" stroke="#d6476b" stroke-width="3"/><text x="${x + W / 2 + S / 2}" y="${y + H + 17}" text-anchor="middle" class="ax">下面這條</text></svg>`; };
const twoPies = (n, a, m, b) => `<div class="vs two5">${pieSvg(n, Array.from({ length: n }, (_, i) => i < a ? 'a' : ''))}${pieSvg(m, Array.from({ length: m }, (_, i) => i < b ? 'b' : ''))}</div>`;
const lampPair = (A, B) => `<div class="lamps"><div><span class="lamp ${A ? 'on' : ''}" style="--c:#e0455a"></span><small>紅燈</small></div><div><span class="lamp ${B ? 'on' : ''}" style="--c:#3fae5a"></span><small>綠燈</small></div></div>`;
const timeline = (lim, on) => `<div class="numgrid">${Array.from({ length: lim }, (_, i) => `<span class="ng ${on.includes(i + 1) ? 'on' : ''}">${i + 1}</span>`).join('')}</div>`;
const tanks3 = L => `<div class="tanks">${L.map(v => `<div class="tank"><div class="wtr">${'<i></i>'.repeat(v)}</div><b class="num">${v}</b></div>`).join('')}</div>`;
const symHalf = [[0, -1], [3, -3], [4, -1], [2, 1], [3, 3], [0, 2]];
const symPic = p => { const pts = fullShape(symHalf, 'v'), g = pts.map(k => [2 * p - k[0], k[1]]); return gridBg(`<polygon points="${polyStr(pts.map(gp))}" fill="#a9d0f0" stroke="#2f5f9e" stroke-width="2"/><polygon points="${polyStr(g.map(gp))}" fill="#f4a9a0" fill-opacity=".45" stroke="#d6476b" stroke-dasharray="5 4"/><line x1="${gp([p, -4])[0]}" y1="${gp([p, -4])[1]}" x2="${gp([p, 4])[0]}" y2="${gp([p, 4])[1]}" stroke="#d6476b" stroke-width="4"/>`); };
const ptPic = x => { const pts = fullShape([[0, -3], [3, -1], [2, -1], [2, 3], [0, 3]], 'v'), a = gp([2, 1]), b = gp([x, 1]); return gridBg(`<polygon points="${polyStr(pts.map(gp))}" fill="#fff0cf" stroke="#7a5b2e" stroke-width="2"/><line x1="${gp([0, -4])[0]}" y1="${gp([0, -4])[1]}" x2="${gp([0, 4])[0]}" y2="${gp([0, 4])[1]}" stroke="#d6476b" stroke-width="3"/><circle cx="${a[0]}" cy="${a[1]}" r="9" fill="#d6476b"/><circle cx="${b[0]}" cy="${b[1]}" r="9" fill="${x === -2 ? '#3fae5a' : '#aab3c2'}"/>`); };
const distPic = t => { const W = 270, H = 90, cut = W * 40 / 45, x = cut * t; return `<svg class="g5" style="max-height:170px" viewBox="-24 -22 310 122"><rect width="${W}" height="${H}" fill="${t >= 1 ? '#f4a9a0' : '#fff0cf'}" stroke="#7a5b2e" stroke-width="2"/>${t >= 1 ? `<rect x="${cut}" width="${W - cut}" height="${H}" fill="#a9d0f0" stroke="#7a5b2e"/><text x="${cut / 2}" y="-6" text-anchor="middle" class="ax">40</text><text x="${cut + (W - cut) / 2}" y="-6" text-anchor="middle" class="ax">5</text>` : '<text x="135" y="-6" text-anchor="middle" class="ax">45</text>'}<line x1="0" x2="${W}" y1="30" y2="30" stroke="#7a5b2e" stroke-opacity=".4"/><line x1="0" x2="${W}" y1="60" y2="60" stroke="#7a5b2e" stroke-opacity=".4"/><text x="-8" y="50" text-anchor="end" class="ax">3</text><line x1="${x}" x2="${x}" y1="-14" y2="${H + 6}" stroke="#d6476b" stroke-width="4"/></svg>`; };
const groupPic = st => `<div class="grps">${st ? Array.from({ length: 3 }, (_, i) => `<span class="grp ${st > 1 && i === 0 ? 'on' : ''}">🍎🍎🍎🍎</span>`).join('') : `<span class="grp">${'🍎'.repeat(12)}</span>`}</div>`;
const netRects = k => { const C = ['#f4a9a0', '#a9d0f0', '#b7e0a8'], W = 90, D = 40, H = 50, y0 = 4, R0 = [[D, y0 + D, W, H, 1], [D, y0 + D + H + D, W, H, 1], [D, y0, W, D, 0], [D, y0 + D + H, W, D, 0], [0, y0 + D, D, H, 2], [D + W, y0 + D, D, H, 2]]; return `<svg class="g5" style="max-height:210px" viewBox="0 0 ${2 * D + W + 8} ${2 * D + 2 * H + 12}">${R0.map(r => `<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" fill="${r[4] < k ? C[r[4]] : '#f4f6fa'}" stroke="#33405a" stroke-width="1.5"/>`).join('')}</svg>`; };
const faceCols = i => i ? ['#fdeec6', '#fdeec6', '#e0455a', '#c8d7e8', '#fdeec6', '#fdeec6'] : null;
const cupPic = k => `<svg class="g5" style="max-height:190px" viewBox="0 0 220 180"><rect x="30" y="10" width="160" height="160" rx="6" fill="#c9a36a" stroke="#33405a" stroke-width="2"/><rect x="50" y="10" width="120" height="140" fill="${k ? '#a9d0f0' : '#fff'}"/>${k > 1 ? '<text x="110" y="85" text-anchor="middle" class="ax">水只裝在這裡</text>' : ''}</svg>`;
const OLD_CONCEPTS = [
  { key: 'factor', title: '因數', terms: ['因數'], who: 'octopus', game: 'factor', when: ['factor:rect', 'factor:fit'],
    ask: '12 塊地磚要排成整齊的長方形，有幾種排法？', tryIt: '拖一拖，每排放幾塊試試。', states: [5, 4, 3], pic: w => tilesSvg(12, w), note: w => 12 % w ? `每排 ${w} 塊，最後一排排不滿` : `每排 ${w} 塊，排 ${12 / w} 排，剛好排完！`,
    found: '有的能剛好排完，有的不行。1、2、3、4、6、12 都能剛好排完。', name: `能剛好排完的每排塊數 1、2、3、4、6、12，就叫 12 的${T('因數')}。`, loop: [1, 2],
    check: { q: '18 顆雞蛋，每盒裝 4 顆。4 是 18 的因數嗎？', pic: () => `<div class="crates">${'<span class="crate"><b class="num">4</b><small>顆</small></span>'.repeat(4)}<span class="crate mini"><b class="num">2</b></span></div>`, opts: ['是', '不是'], a: 1, why: '裝 4 盒還剩 2 顆，沒有剛好裝完。', ok: '對了！沒有剛好裝完，4 不是 18 的因數。' } },
  { key: 'multiple', title: '倍數', terms: ['倍數'], who: 'octopus', game: 'factor', when: ['factor:multi'],
    ask: '號誌燈每 3 秒亮一次。它什麼時候會亮？', tryIt: '往右拖時間，每次亮燈都記下來。', states: [3, 6, 9], pic: t => timeline(15, Array.from({ length: t / 3 }, (_, i) => (i + 1) * 3)), note: t => `第 ${t} 秒亮了`,
    found: '3、6、9⋯⋯每次都多 3，一直數也數不完。', name: `3、6、9、12⋯⋯亮燈的這些時間，就叫 3 的${T('倍數')}。`, loop: [0, 1, 2],
    check: { q: '接駁車每 4 分鐘來一班。哪一個是 4 的倍數？', pic: () => timeline(24, [4, 8, 12]), opts: ['18', '20', '22'], a: 1, why: '從 4 開始一直加 4，會碰到哪一個？', ok: '對了！4×5＝20，20 是 4 的倍數。' } },
  { key: 'comf', title: '公因數', terms: ['公因數', '最大公因數'], who: 'octopus', game: 'factor', when: ['factor:comf', 'factor:pave'],
    ask: '12 塊紅磚、18 塊藍磚，兩種都要排成每排一樣多，都不能剩。每排可以放幾塊？', tryIt: '拖一拖，試試每排幾塊。', states: [5, 2, 6], pic: w => `<div class="vs two5"><span style="flex:1">${tilesSvg(12, w)}</span><span style="flex:1">${tilesSvg(18, w)}</span></div>`, note: w => 12 % w === 0 && 18 % w === 0 ? `每排 ${w} 塊：兩種都剛好` : `每排 ${w} 塊：排不整齊`,
    found: '1、2、3、6 兩種都排得剛好，最多每排 6 塊。', name: `兩個數都能剛好分完的 1、2、3、6，叫 ${'12 和 18 的'}${T('公因數')}；最大的 6，叫${T('最大公因數')}。`, loop: [1, 2],
    check: { q: '8 公分和 12 公分的繩子，都剪成同樣長、不能剩，最長剪幾公分？（8 和 12 的最大公因數）', pic: () => `${cBar(8, 8, '#f4a9a0')}${cBar(12, 12, '#a9d0f0')}`, opts: ['2', '4', '8'], a: 1, why: '8 分得完、12 也要分得完，找最大的。', ok: '對了！4 是 8 和 12 的最大公因數。' } },
  { key: 'coml', title: '公倍數', terms: ['公倍數', '最小公倍數'], who: 'octopus', game: 'factor', when: ['factor:lamp'],
    ask: '紅燈每 2 秒亮一次，綠燈每 3 秒亮一次。現在一起開始，下次什麼時候一起亮？', tryIt: '往右拖時間看看。', states: [2, 3, 6], pic: t => lampPair(t % 2 === 0, t % 3 === 0), note: t => t === 6 ? `第 ${t} 秒：一起亮了！` : `第 ${t} 秒：只有${t % 2 === 0 ? '紅燈' : '綠燈'}亮`,
    found: '第 6 秒一起亮，之後第 12、18 秒也會一起亮。', name: `6、12、18⋯⋯兩盞燈一起亮的時間，叫 2 和 3 的${T('公倍數')}；最小的 6，叫${T('最小公倍數')}。`, loop: [0, 1, 2],
    check: { q: '甲車每 4 分鐘、乙車每 6 分鐘一班。第一次同時到是幾分鐘後？（4 和 6 的最小公倍數）', pic: () => timeline(24, [4, 8, 12]), opts: ['8', '12', '24'], a: 1, why: '數 4 的倍數，看哪一個也是 6 的倍數。', ok: '對了！12 是 4 和 6 的最小公倍數。' } },
  { key: 'sum180', title: '內角和', terms: ['內角和'], who: 'goat', game: 'poly', when: ['poly:sum', 'poly:cut', 'poly:quad'],
    ask: '三角形花圃的形狀可以變來變去。三個角合起來會不會變？', tryIt: '拖一拖，換三種形狀，再把角撕下來拼。', states: [[[60, 150], [270, 150], [130, 30]], [[30, 150], [290, 150], [60, 60]], [[100, 150], [220, 150], [160, 15]]], pic: P => `${tri5(P)}${`<div class="q5">${wedges(triAngles(P))}</div>`}`, note: P => { const [a, b, c] = triAngles(P); return `${a}＋${b}＋${c}＝180，拼成一條直線`; },
    found: '形狀一直變，三個角撕下來，都剛好拼成一條直線。', name: `一個圖形裡面所有的角加起來，叫${T('內角和')}。三角形的內角和都是 180 度。`, loop: [0, 1, 2],
    check: { q: '三角旗有兩個角是 50 度和 60 度。第三個角幾度？', pic: () => `<div class="q5">${wedges([50, 60])}</div>`, opts: ['70', '80', '90'], a: 0, why: '內角和是 180 度，還缺多少？', ok: '對了！180－50－60＝70 度。' } },
  { key: 'regular', title: '正多邊形', terms: ['正多邊形'], who: 'goat', game: 'poly', when: ['poly:regular'],
    ask: '圍牆要每邊一樣長，每個轉角也一樣大。哪一種才行？', tryIt: '拖一拖，一種一種量。', states: [0, 1, 2], pic: i => tri5([[[60, 50], [260, 50], [260, 130], [60, 130]], [[160, 10], [240, 85], [160, 160], [80, 85]], [[100, 25], [220, 25], [220, 145], [100, 145]]][i]), note: i => ['長方形：角一樣大，邊不一樣長', '菱形：邊一樣長，角不一樣大', '正方形：邊和角都一樣！'][i],
    found: '只有邊和角都各自一樣的才行。', name: `每邊一樣長、每個角也一樣大的多邊形，叫${T('正多邊形')}。`, loop: [2],
    check: { q: '蜂巢的一格，六個邊一樣長，六個角也一樣大。它是正多邊形嗎？', pic: () => `<svg class="g5" style="max-height:120px" viewBox="0 0 200 200"><polygon points="${polyStr(Array.from({ length: 6 }, (_, i) => { const t = (i * 60 - 90) * Math.PI / 180; return [100 + 85 * Math.cos(t), 100 + 85 * Math.sin(t)]; }))}" fill="#f7dc8c" stroke="#a9702a" stroke-width="4"/></svg>`, opts: ['是', '不是'], a: 0, why: '邊和角都一樣嗎？', ok: '對了！它是正六邊形。' } },
  { key: 'expand', title: '擴分', terms: ['擴分'], who: 'rabbit', game: 'ext', when: ['ext:slice'],
    ask: '半個披薩再多切幾刀，吃到的會變多嗎？', tryIt: '拖一拖，切細一點。', states: [1, 2, 4], pic: k => `<div class="vs">${pieSvg(2 * k, Array.from({ length: 2 * k }, (_, i) => i < k ? 'a' : ''))}</div>`, note: k => `${k}/${2 * k} 個：塗色的大小都一樣`,
    found: '塊數變多了，塗色的大小沒有變。1/2＝2/4＝4/8。', name: `分子分母一起變大、份量不變，這樣切細就叫${T('擴分')}。`, loop: [0, 1, 2],
    check: { q: '2/3 片巧克力切細成 6 塊，塗色的是幾塊？（把 2/3 擴分）', pic: () => `<div class="vs">${foodSvg(['巧克力', 'bar', '片'], 3, 2)}</div>`, opts: ['2', '4', '6'], a: 1, why: '每塊切成 2 小塊，塗色的 2 塊變幾塊？', ok: '對了！2/3＝4/6。' } },
  { key: 'reduce', title: '約分', terms: ['約分', '最簡分數'], who: 'rabbit', game: 'ext', when: ['ext:merge', 'ext:lowest'],
    ask: '4/8 個披薩切得太碎了，把小塊併起來，能變幾塊？', tryIt: '拖一拖，兩塊兩塊併。', states: [8, 4, 2], pic: n => `<div class="vs">${pieSvg(n, Array.from({ length: n }, (_, i) => i < n / 2 ? 'a' : ''))}</div>`, note: n => `${n / 2}/${n} 個${n === 2 ? '，不能再併了！' : ''}`,
    found: '併到 1/2 就不能再併了，塗色的大小一直沒變。', name: `分子分母一起變小叫${T('約分')}。約到不能再約的 1/2，叫${T('最簡分數')}。`, loop: [0, 1, 2],
    check: { q: '6/9 盤蛋糕的最簡分數是哪一個？', pic: () => `<div class="vs">${foodSvg(['蛋糕', 'bar', '盤'], 9, 6)}</div>`, opts: ['3/6', '2/3', '6/9'], a: 1, why: '6 和 9 都能分成 3 份。', ok: '對了！6/9 約分成 2/3。' } },
  { key: 'common', title: '通分', terms: ['通分'], who: 'rabbit', game: 'ext', when: ['ext:common', 'ext:cmp', 'uadd:add', 'uadd:sub', 'uadd:mixed', 'uadd:borrow', 'uadd:enough'],
    ask: '1/2 個和 1/3 個披薩，塊的大小不同，哪一個多？多多少？', tryIt: '拖一拖，把兩個切細，切到塊一樣大。', states: [[1, 1], [2, 1], [3, 2]], pic: ([x, y]) => twoPies(2 * x, x, 3 * y, y), note: ([x, y]) => 2 * x === 3 * y ? `都切成 ${2 * x} 塊：${x} 塊和 ${y} 塊，比得出來了！` : `${2 * x} 塊和 ${3 * y} 塊，還不一樣`,
    found: '切成一樣的塊數，塊就一樣大，可以直接數了。', name: `把幾個分數切成一樣的分母，就叫${T('通分')}。`, loop: [0, 2],
    check: { q: '一杯燃料 1/2 公升、一杯 1/4 公升。通分時，都切成幾格最方便？', pic: () => `<div class="vs two5">${vesselSvg(['', '', 'cup'], 2, 1)}${vesselSvg(['', '', 'cup'], 4, 1)}</div>`, opts: ['2', '4', '6'], a: 1, why: '把 1/2 切細，什麼時候和 1/4 一樣細？', ok: '對了！1/2＝2/4，都切成 4 格。' } },
  { key: 'sym', title: '線對稱', terms: ['線對稱圖形', '對稱軸'], who: 'crab', game: 'sym', when: ['sym:axis', 'sym:count'],
    ask: '蝴蝶貼紙要對摺，兩邊要完全重疊。摺線要放在哪裡？', tryIt: '拖紅線試試看。', states: [-1, 1, 0], pic: symPic, note: p => p === 0 ? '完全重疊！' : '影子沒有疊好', found: '只有摺在正中間，兩邊才完全重疊。', name: `沿一條線對摺能完全重疊的圖形，叫${T('線對稱圖形')}；那條摺線叫${T('對稱軸')}。`, loop: [0, 2],
    check: { q: '停車格是平行四邊形，直的橫的摺都疊不起來。它是線對稱圖形嗎？', pic: () => `<svg class="g5" style="max-height:120px" viewBox="0 0 200 200"><polygon points="70,60 170,60 130,140 30,140" fill="#a9d0f0" stroke="#2f5f9e" stroke-width="2"/></svg>`, opts: ['是', '不是'], a: 1, why: '線對稱要能完全重疊。', ok: '對了！摺不重疊，就不是線對稱圖形。' } },
  { key: 'sympt', title: '對稱點', terms: ['對稱點'], who: 'crab', game: 'sym', when: ['sym:point', 'sym:half', 'sym:prop'],
    ask: '房子對摺時，紅點會碰到另一邊的哪裡？', tryIt: '拖一拖，試三個位置。', states: [-1, -3, -2], pic: ptPic, note: x => x === -2 ? '碰到了！一樣高、一樣遠' : '摺過去碰不到', found: '紅點離摺線 2 格，碰到的點也離摺線 2 格。', name: `對摺時碰在一起的兩個點，叫${T('對稱點')}。它們到對稱軸一樣遠。`, loop: [2],
    check: { q: '窗花上一個點離對稱軸 3 格，它的對稱點離對稱軸幾格？', pic: () => gridBg(`<line x1="${gp([0, -4])[0]}" y1="${gp([0, -4])[1]}" x2="${gp([0, 4])[0]}" y2="${gp([0, 4])[1]}" stroke="#d6476b" stroke-width="3"/><circle cx="${gp([3, 0])[0]}" cy="${gp([3, 0])[1]}" r="9" fill="#d6476b"/>`), opts: ['2', '3', '6'], a: 1, why: '對摺要碰在一起，要一樣遠。', ok: '對了！都是 3 格。' } },
  { key: 'avg', title: '平均', terms: ['平均'], who: 'raccoon', game: 'mix', when: ['mix:avg'],
    ask: '三個水塔 5、1、3 格水，高高低低。如果一樣高，每個會是幾格？', tryIt: '拖一拖，從高的倒到低的。', states: [[5, 1, 3], [4, 2, 3], [3, 3, 3]], pic: tanks3, note: L => L.every(x => x === L[0]) ? '都一樣高了！每個 3 格' : '還高高低低', found: '水沒有變多變少，只是推平了。全部 9 格，分成 3 份。', name: `高的補低的、推到一樣多，這個數就是${T('平均')}。9÷3＝3。`, loop: [0, 1, 2],
    check: { q: '三天存了 2、4、6 元。平均每天存幾元？', pic: () => tanks3([2, 4, 6]), opts: ['3', '4', '6'], a: 1, why: '6 分 2 給 2，推平看看。', ok: '對了！12÷3＝4 元。' } },
  { key: 'dist', title: '分配律', terms: ['分配律'], who: 'raccoon', game: 'mix', when: ['mix:dist', 'mix:near'],
    ask: '便當 40 元、水 5 元，買 3 份，有幾種算法？', tryIt: '拖紅線，把一整塊切開。', states: [0, .5, 1], pic: distPic, note: t => t >= 1 ? '切成 40×3 和 5×3 兩塊' : '整塊是 45×3', found: '可以整份一起算，也可以分開再加，總數一樣。', name: `（40＋5）×3＝40×3＋5×3，先合再乘和分開乘再加一樣，叫${T('分配律')}。`, loop: [0, 2],
    check: { q: '每排 20 塊紅磚、3 塊藍磚，鋪 4 排。用分配律，哪一個算法對？', pic: () => `${cBar(23, 20, '#f4a9a0')}${cBar(23, 20, '#f4a9a0')}`, opts: ['20×4＋3×4', '20×4＋3', '20＋3×4'], a: 0, why: '紅的和藍的都有 4 排。', ok: '對了！紅、藍都要乘 4。' } },
  { key: 'baseh', title: '底和高', terms: ['底', '高'], who: 'sheep', game: 'para', when: ['para:para', 'para:tri', 'para:slide', 'para:trap', 'para:sym', 'para:back'],
    ask: '這塊歪歪的地，要量哪兩條線才算得出大小？', tryIt: '拖一拖，把左邊的三角形剪下來移到右邊。', states: [0, .5, 1], pic: paraCut, note: t => t >= 1 ? '變成長方形了！' : '移動中⋯⋯', found: '變成的長方形，長是下面這條線，寬是紅色直直的線，不是斜的那條。', name: `下面這條叫${T('底')}，和底垂直、紅色這條叫${T('高')}。`, loop: [0, 2],
    check: { q: '屋頂是三角形，下面 8 公尺，斜邊 6 公尺，和下面垂直的線 4 公尺。高是幾公尺？', pic: () => tri5([[40, 150], [280, 150], [160, 40]], '<line x1="160" x2="160" y1="40" y2="150" stroke="#d6476b" stroke-width="3" stroke-dasharray="5 4"/><text x="165" y="100" class="ax">4</text><text x="80" y="90" class="ax">6</text><text x="160" y="168" text-anchor="middle" class="ax">8</text>'), opts: ['4', '6', '8'], a: 0, why: '高要和底垂直，斜的不算。', ok: '對了！高是 4 公尺。' } },
  { key: 'plane', title: '面的平行和垂直', terms: ['平行', '垂直'], who: 'bee', game: 'cuboid', when: ['cuboid:spin', 'cuboid:life'],
    ask: '貨櫃的紅色面和其他面，哪些永遠碰不到？哪些碰在一起？', tryIt: '拖一拖，轉貨櫃看。', states: [30, 120, 210], pic: y => box3d(4, 3, 3, y, 22, { colors: faceCols(1) }), note: y => y === 210 ? '藍色面在紅色面的對面，碰不到' : '旁邊的面都和紅色面碰成直角', found: '對面的面永遠碰不到；旁邊的面像牆和地板。', name: `對面的面互相${T('平行')}；相鄰的面互相${T('垂直')}。`, loop: [0, 1, 2],
    check: { q: '教室的地板和天花板是什麼關係？', pic: () => '<div class="u-big">🏫</div>', opts: ['平行', '垂直'], a: 0, why: '它們會碰到嗎？', ok: '對了！地板和天花板平行。' } },
  { key: 'net', title: '展開圖', terms: ['展開圖'], who: 'bee', game: 'cuboid', when: ['cuboid:net', 'cuboid:opp'],
    ask: '紙盒可以攤平裝進袋子裡。攤開來長什麼樣子？', tryIt: '拖一拖，把紙盒打開。', states: [1, .5, 0], pic: t => foldNet(NET_A, t), note: t => t === 0 ? '六個面連在一起，平平的' : '打開中⋯⋯', found: '六個面攤成一張平的紙，摺回去又是盒子。', name: `立體攤平後的這張圖，叫${T('展開圖')}。`, loop: [0, 1, 2],
    check: { q: '這張圖能摺成正方體的展開圖嗎？', pic: () => foldNet(NET_BAD, 0), opts: ['能', '不能'], a: 1, why: '想像摺起來，有沒有面疊在一起？', ok: '對了！會疊在一起，摺不成。' } },
  { key: 'surface', title: '表面積', terms: ['表面積'], who: 'bee', game: 'cuboid', when: ['cuboid:area', 'cuboid:cube'],
    ask: '面紙盒要包住全部，要多少包裝紙？', tryIt: '拖一拖，一對面一對面塗。', states: [1, 2, 3], pic: netRects, note: k => `塗了 ${k * 2} 面`, found: '六個面都塗到了，全部加起來就是要的紙。', name: `立體外面所有面的面積加起來，叫${T('表面積')}。`, loop: [0, 1, 2],
    check: { q: '骰子每面 4 平方公分，表面積是多少？', pic: () => '<div class="u-big">🎲</div>', opts: ['4', '16', '24'], a: 2, why: '骰子有幾個面？', ok: '對了！4×6＝24 平方公分。' } },
  { key: 'ffrac', title: '分數倍', terms: ['分數倍'], who: 'rabbit', game: 'fcalc', when: ['fcalc:of', 'fcalc:times', 'fcalc:area', 'fcalc:fdiv', 'fcalc:cmp'],
    ask: '12 顆蘋果，拿 3 份裡的 1 份，是幾顆？', tryIt: '拖一拖，分成 3 份，再圈 1 份。', states: [0, 1, 2], pic: groupPic, note: s => ['12 顆', '每份 4 顆', '圈了 4 顆'][s], found: '分 3 份拿 1 份，就是 4 顆，比 12 少。', name: `「12 的 1/3」也可以說 12 的 1/3 倍，寫成 12×1/3。乘一個分數叫${T('分數倍')}。`, loop: [0, 1, 2],
    check: { q: '20 元的 1/2 倍是幾元？', pic: () => cBar(2, 1, '#f7dc8c'), opts: ['10', '20', '40'], a: 0, why: '分 2 份拿 1 份。', ok: '對了！20×1/2＝10 元。' } },
  { key: 'thou', title: '千分位', terms: ['千分位'], who: 'pelican', game: 'decimal', when: ['decimal:thou', 'decimal:point', 'decimal:shift', 'decimal:rel'],
    ask: '金屬片比 0.01 公分還薄，要怎麼寫？', tryIt: '拖一拖，一層一層切細。', states: [1, 2, 3], pic: k => `${cBar(1, 1, '#a9d0f0')}${k >= 1 ? cBar(10, 1, '#6ea8dc') : ''}${k >= 2 ? cBar(10, 1, '#f0a03c') : ''}${k >= 3 ? cBar(10, 1, '#3fae5a') : ''}`, note: k => ['', '切 10 份：一份 0.1', '再切 10 份：一份 0.01', '再切 10 份：一份 0.001'][k], found: '1 切 10 份，再切 10 份，再切 10 份，就是 0.001。', name: `小數點後第三位，記幾個 0.001，叫${T('千分位')}。`, loop: [0, 1, 2],
    check: { q: '3.275 的 5 在哪一位？', pic: () => '<div class="digits big"><span class="dg">3</span><b>.</b><span class="dg">2</span><span class="dg">7</span><span class="dg l">5</span></div>', opts: ['十分位', '百分位', '千分位'], a: 2, why: '小數點後第幾位？', ok: '對了！第三位是千分位。' } },
  { key: 'zhao', title: '億和兆', terms: ['兆'], who: 'pelican', game: 'decimal', when: ['decimal:chunk', 'decimal:zero'],
    ask: '星星好遠！3 0000 0000 0000 公里，怎麼念？', tryIt: '拖一拖，從右邊每 4 位切一刀。', states: [1, 2, 3], pic: k => { const g = ['3', '0000', '0000', '0000']; return `<div class="digits">${g.map((x, i) => (i && 3 - i < k ? '<b class="cut5">｜</b>' : '') + x).join('')}</div>`; }, note: k => ['', '第一刀是萬', '第二刀是億', '第三刀是一個新的單位'][k], found: '萬、億，再往左還有一個新單位。一萬個億才到它。', name: `一萬個億叫 1 ${T('兆')}。這個數念作 3 兆。`, loop: [0, 1, 2],
    check: { q: '5 0000 0000 0000 念作什麼？', pic: () => '<div class="digits">5｜0000｜0000｜0000</div>', opts: ['5 億', '5 兆', '50 萬'], a: 1, why: '第三刀前面是什麼單位？', ok: '對了！5 兆。' } },
  { key: 'sector', title: '扇形', terms: ['扇形', '圓心角'], who: 'bee', game: 'sector', when: ['sector:drag', 'sector:frac', 'sector:read', 'sector:part', 'sector:draw'],
    ask: '披薩切一片下來，要怎麼說它有多大？', tryIt: '拖一拖，打開不同大小。', states: [45, 90, 200], pic: d => sectorSvg(d, { knob: true }), note: d => `尖尖的地方張開 ${d} 度`, found: '從圓心張開的角越大，切下來的片越大。', name: `兩條半徑和一段圓周圍成的形狀叫${T('扇形')}；圓心這個角叫${T('圓心角')}。`, loop: [0, 1, 2],
    check: { q: '1/4 圓的花圃，圓心角幾度？', pic: () => sectorSvg(90), opts: ['45', '90', '180'], a: 1, why: '一圈 360 度分 4 份。', ok: '對了！360÷4＝90 度。' } },
  { key: 'ratio', title: '比率', terms: ['比率'], who: 'mimi', game: 'ratio', when: ['ratio:rate'],
    ask: '5 個人有 3 個人舉手。10 個人有 6 個人舉手。哪一組比較多人贊成？', tryIt: '拖一拖，每 5 人分一組看。', states: [[5, 3], [10, 6], [20, 12]], pic: ([n, a]) => `<div class="people">${Array.from({ length: n }, (_, i) => `<span class="pp ${i < a ? 'on' : ''}">${i < a ? '😀' : '🙂'}</span>`).join('')}</div>`, note: ([n, a]) => `${n} 人裡有 ${a} 人，每 5 人都有 3 人`, found: '人數不同，但都是每 5 人有 3 人，一樣多。', name: `部分占全部的多少，叫${T('比率')}。這裡都是 3/5。`, loop: [0, 1],
    check: { q: '投籃 10 次進 4 次，投進的比率是多少？', pic: () => cBar(10, 4, '#3fae5a'), opts: ['4/10', '10/4', '4/14'], a: 0, why: '部分÷全部。', ok: '對了！4/10。' } },
  { key: 'percent', title: '百分率', terms: ['百分率'], who: 'mimi', game: 'ratio', when: ['ratio:paint', 'ratio:to100', 'ratio:part'],
    ask: '每班人數不同，要怎麼比贊成的有多少？', tryIt: '拖一拖，都想成 100 格來塗。', states: [10, 25, 35], pic: v => hundred(v), note: v => `100 格塗了 ${v} 格`, found: '都換成 100 份，就比得出來。35 格就是 100 份裡的 35 份。', name: `100 份裡的幾份，叫${T('百分率')}。35 份寫成 35%。`, loop: [0, 1, 2],
    check: { q: '100 顆種子有 20 顆發芽。發芽的百分率是多少？', pic: () => hundred(20), opts: ['2%', '20%', '80%'], a: 1, why: '100 份裡的幾份？', ok: '對了！20%。' } },
  { key: 'discount', title: '打折', terms: ['打折', '8 折'], who: 'mimi', game: 'ratio', when: ['ratio:off'],
    ask: '100 元的工具，老闆說只要付 8 份。怎麼算？', tryIt: '拖一拖，切 10 份，再塗要付的。', states: [0, 4, 8], pic: k => cBar(10, k, '#6ea8dc'), note: k => k ? `付 ${k} 份，${k * 10} 元` : '切成 10 份，每份 10 元', found: '切 10 份付 8 份，只要 80 元，便宜了 20 元。', name: `切 10 份付幾份，叫${T('打折')}。付 8 份就是打 ${T('8 折')}。`, loop: [0, 1, 2],
    check: { q: '200 元的太空衣打 9 折，要付幾元？', pic: () => cBar(10, 9, '#6ea8dc'), opts: ['20', '180', '190'], a: 1, why: '切 10 份，每份 20 元，付 9 份。', ok: '對了！180 元。' } },
  { key: 'cheng', title: '成數', terms: ['成'], who: 'mimi', game: 'ratio', when: ['ratio:cheng'],
    ask: '果園 10 棵樹有 6 棵結果，要怎麼用短短的話說？', tryIt: '拖一拖，一棵棵塗。', states: [2, 4, 6], pic: k => `<div class="pics5">${'🍎'.repeat(k)}${'🌳'.repeat(10 - k)}</div>`, note: k => `10 棵裡有 ${k} 棵`, found: '只要說「10 份裡的 6 份」。', name: `全部切 10 份，幾份就叫幾${T('成')}。這裡是 6 成。`, loop: [0, 1, 2],
    check: { q: '圖書館 100 本書，3 成借出去，是幾本？', pic: () => cBar(10, 3, '#3fae5a'), opts: ['3', '30', '70'], a: 1, why: '切 10 份，每份 10 本。', ok: '對了！30 本。' } },
  { key: 'capacity', title: '容積', terms: ['容積'], who: 'turtle', game: 'capacity', when: ['capacity:inner', 'capacity:level', 'capacity:rock', 'capacity:over'],
    ask: '厚厚的水杯外面看很大，真的裝得下那麼多水嗎？', tryIt: '拖一拖，看水裝在哪裡。', states: [0, 1, 2], pic: cupPic, note: k => ['杯壁很厚', '水倒進去', '水碰不到杯壁裡面'][k], found: '水只裝在裡面，外面看的大小不算。', name: `容器裡面能裝的大小，叫${T('容積')}。要量裡面。`, loop: [0, 1, 2],
    check: { q: '魚缸裡面長 10、寬 10、高 5 公分，容積是多少立方公分？', pic: () => cupPic(1), opts: ['25', '500', '1000'], a: 1, why: '量裡面的長、寬、高相乘。', ok: '對了！10×10×5＝500 立方公分。' } },
  { key: 'prism', title: '角柱和圓柱', terms: ['角柱', '圓柱'], who: 'fox', game: 'solid', when: ['solid:count', 'solid:name', 'solid:rel', 'solid:net'],
    ask: '大樓、帳篷、罐頭，有什麼一樣的地方？', tryIt: '拖一拖，一個一個轉。', states: [['prism', 3], ['prism', 6], ['cyl', 0]], pic: ([t, n]) => solidSvg(t, n, 30, 20), note: ([t, n]) => t === 'cyl' ? '上下是圓，側面彎彎的' : `上下是${n === 3 ? '三' : '六'}邊形，側面是長方形`, found: '上下兩面一樣大，從上到下都一樣粗。', name: `底面是多邊形的叫${T('角柱')}，底面是圓的叫${T('圓柱')}。`, loop: [0, 1, 2],
    check: { q: '水管切下一段，上下都是圓。它是什麼？', pic: () => solidSvg('cyl', 0, 30, 20), opts: ['角柱', '圓柱'], a: 1, why: '底面是什麼形狀？', ok: '對了！圓柱。' } },
  { key: 'pyr', title: '角錐和圓錐', terms: ['角錐', '圓錐'], who: 'fox', game: 'solid', when: ['solid:count', 'solid:name', 'solid:rel', 'solid:net'],
    ask: '金字塔和甜筒，和柱子有什麼不一樣？', tryIt: '拖一拖，一個一個轉。', states: [['pyr', 4], ['pyr', 3], ['cone', 0]], pic: ([t, n]) => solidSvg(t, n, 30, 20), note: ([t, n]) => t === 'cone' ? '底面是圓，往上變尖' : `底面是${n === 3 ? '三' : '四'}邊形，往上變尖`, found: '只有一個底面，往上收成一個尖尖的點。', name: `底面是多邊形的尖頂叫${T('角錐')}，底面是圓的叫${T('圓錐')}。`, loop: [0, 1, 2],
    check: { q: '尖尖的派對帽，底面是圓的。它是什麼？', pic: () => solidSvg('cone', 0, 30, 20), opts: ['角錐', '圓錐'], a: 1, why: '底面是什麼形狀？', ok: '對了！圓錐。' } },
];
function storyFlow(C, L, o) { // 四步共用：新概念小故事、單位教室都走這裡
  const done = () => { cptStop(); o.done(); };
  const skipBtn = '<button class="skip5" id="skipc">跳過</button>';
  const wire = () => { document.getElementById('out').onclick = () => { cptStop(); o.out(); }; document.getElementById('skipc').onclick = done; };
  function op() { // 第二步：動手試，全程不出現新詞
    cptStop();
    lessonFrame(L, `${C.ask}<br><small>${C.tryIt}</small>`, `<div class="cp" id="cp"></div><div class="trail" id="ct"></div>${skipBtn}`); wire();
    const seen = new Set(); let i = -1, over = false;
    const nextBtn = () => { document.getElementById('actions').innerHTML = over ? '<button class="btn" id="nm">這叫什麼？</button>' : '<button class="btn" id="tn">試下一個</button>'; if (over) document.getElementById('nm').onclick = named; else document.getElementById('tn').onclick = () => show((i + 1) % C.states.length); };
    const show = k => { i = k; setEl('cp', C.pic(C.states[k])); setEl('ct', C.note(C.states[k])); sfx.hop(); seen.add(k); if (seen.size === C.states.length && !over) { over = true; setMsg(C.found, 'good'); sfx.ok(); } nextBtn(); };
    show(0);
    dragOn(document.getElementById('cp'), x => { const k = clamp(Math.floor(x * C.states.length), 0, C.states.length - 1); if (k !== i) show(k); });
  }
  function named() { // 第三步：命名，圖一直動，名詞貼回剛才的操作
    lessonFrame(L, C.name, `<div class="cp" id="cp"></div><div class="tagrow">${C.terms.map(t => `<span class="termtag">${t}</span>`).join('')}</div>${skipBtn}`); wire();
    let k = 0; const paint = () => setEl('cp', C.pic(C.states[C.loop[k % C.loop.length]])); paint();
    cptStop(); cptTimer = setInterval(() => { k++; if (document.getElementById('cp')) paint(); else cptStop(); }, 1100);
    actionBtn('ck', '換一題試試').onclick = check;
  }
  function check() { // 第四步：換情境用新詞答；答錯回到操作
    cptStop(); const K = C.check;
    lessonFrame(L, K.q, `<div class="cp">${K.pic()}</div>${skipBtn}`); wire();
    document.getElementById('actions').innerHTML = `<div class="choices">${K.opts.map((o, i) => `<button class="choice" data-c5="${i}">${nums(o)}</button>`).join('')}</div>`;
    document.querySelectorAll('[data-c5]').forEach(b => b.onclick = () => {
      if (+b.dataset.c5 === K.a) { sfx.good(); setMsg(nums(K.ok), 'good'); if (o.right) o.right(); document.getElementById('skipc').hidden = true; actionBtn('fin', o.last).onclick = done; return; }
      sfx.retry(); setMsg(nums(K.why), 'hint'); actionBtn('bk', '回去再動手看看').onclick = op;
    });
  }
  op();
}
const OLD_LESSON_STORY = {
  deg: { terms: ['度'], ask: '門開一點點和門全開，差多少？要怎麼說才清楚？', tryIt: '把一整圈切成 360 小格。拖一拖，轉轉看。', states: [30, 90, 180], pic: d => protractor(d, { knob: d }), note: d => `轉了 ${d} 小格${d === 90 ? '，像門全開' : d === 180 ? '，變成一條直線' : ''}`, found: '數小格就比得出來了。半圈 180 小格，一圈 360 小格。', name: `一整圈切成 360 份，1 份就叫 1 ${T('度')}。`, loop: [0, 1, 2],
    check: { q: '時鐘 3 點，兩根針夾多大？', pic: () => clockSvg(0, 3), opts: ['30 度', '90 度', '180 度'], a: 1, why: '三點鐘像門全開，是一個直角。', ok: '對了！直角是 90 度。' } },
  m2: { terms: ['平方公分', '平方公尺'], ask: '三塊地毯形狀都不一樣，哪一塊比較大？', tryIt: '拖一拖，用小方格鋪鋪看。', states: [4, 6, 12], pic: w => tilesSvg(12, w), note: w => `每排 ${w} 格，共 12 格`, found: '形狀不一樣，都是 12 格，一樣大。數方格就比得出來。', name: `每邊 1 公分的小方格叫 1 ${T('平方公分')}；每邊 1 公尺的大方格叫 1 ${T('平方公尺')}。`, loop: [0, 1, 2],
    check: { q: '教室的地板要用哪一種方格來量？', pic: () => '<div class="u-big">🏫</div>', opts: ['平方公分', '平方公尺'], a: 1, why: '教室很大，要用大方格。', ok: '對了！教室大約 70 平方公尺。' } },
  time: { terms: ['秒', '分鐘', '小時', '日'], ask: '拍手一下很快，看電影很久。要怎麼說「多久」才方便？', tryIt: '拖一拖，看時鐘的針怎麼走。', states: [3, 6, 12], pic: h => `<div class="vs">${clockSvg(0, h % 12)}</div>`, note: h => h === 12 ? '長針走滿一圈了' : `長針走了 ${h} 大格`, found: '最細的針走一圈，長針走一小格；長針走一圈，短針走一大格；短針走兩圈，太陽又回到同一個地方。', name: `拍一下手是 1 ${T('秒')}；60 秒是 1 ${T('分鐘')}；60 分鐘是 1 ${T('小時')}；24 小時是 1 ${T('日')}。`, loop: [0, 1, 2],
    check: { q: '看一部電影大約要多久？', pic: () => '<div class="u-big">🎬</div>', opts: ['2 秒', '2 分鐘', '2 小時'], a: 2, why: '60 秒才 1 分鐘，電影很長。', ok: '對了！大約 2 小時。' } },
  land: { terms: ['公畝', '公頃', '平方公里'], ask: '月球城要蓋大公園，用小地磚一塊塊數太累了。有更大的算法嗎？', tryIt: '拖一拖，把地圖一排排鋪起來。每小格 100 平方公尺。', states: [3, 6, 10], pic: k => mapSvg(10, 10, k * 10), note: k => `鋪了 ${k * 10} 小格，${fmt(k * 1000)} 平方公尺`, found: '100 小格是 10000 平方公尺，數字太長。把一片片包起來，就好說了。', name: `每邊 10 公尺的一小格叫 1 ${T('公畝')}；100 公畝叫 1 ${T('公頃')}；100 公頃叫 1 ${T('平方公里')}。`, loop: [0, 1, 2],
    check: { q: '一座足球場大約多大？', pic: () => '<div class="u-big">⚽</div>', opts: ['1 公畝', '1 公頃', '1 平方公里'], a: 1, why: '足球場每邊大約一百公尺。', ok: '對了！大約 1 公頃。' } },
  ton: { terms: ['公噸'], ask: '大象太重了，用公斤說，數字好長。有更好說的嗎？', tryIt: '拖一拖，把 100 公斤的沙包放上秤。', states: [3, 6, 10], pic: k => `<div class="pics5">${'🛍️'.repeat(k)}</div>`, note: k => `${k * 100} 公斤`, found: '10 包是 1000 公斤。如果 1000 公斤有一個新名字就好了。', name: `1000 公斤叫 1 ${T('公噸')}。`, loop: [0, 1, 2],
    check: { q: '一頭大象 5000 公斤，是幾公噸？', pic: () => '<div class="u-big">🐘</div>', opts: ['5', '50', '500'], a: 0, why: '每 1000 公斤圈一堆，有幾堆？', ok: '對了！5 公噸。' } },
  cap: { terms: ['毫升', '公升'], ask: '水箱能裝多少水？水沒有形狀，要怎麼量？', tryIt: '拖一拖，往每邊 10 公分的方盒倒水。', states: [3, 6, 10], pic: k => tankSvg(k / 10), note: k => `倒了 ${k} 層，每層 100 個小方格那麼多`, found: '10 層倒滿，水占的空間是 10×10×10＝1000 立方公分。', name: `1 立方公分那麼多的水叫 1 ${T('毫升')}；1000 毫升叫 1 ${T('公升')}。`, loop: [0, 1, 2],
    check: { q: '一瓶 2 公升的牛奶，是幾毫升？', pic: () => '<div class="u-big">🍼</div>', opts: ['20', '200', '2000'], a: 2, why: '1 公升是 1000 毫升，有 2 個。', ok: '對了！2000 毫升。' } },
  m3: { terms: ['立方公分', '立方公尺'], ask: '貨櫃太大了，用小骰子一顆一顆堆，堆到什麼時候？', tryIt: '拖一拖，用 1 公尺長的棍子搭一個大方框。', states: [4, 8, 12], pic: k => labPic({ view: 'frame', each: 1 }, k), note: k => `搭了 ${k} 根棍子`, found: '12 根棍子搭成每邊 1 公尺的大方框，用它來量大東西就快多了。', name: `小骰子每邊 1 公分，叫 1 ${T('立方公分')}；這個大方框每邊 1 公尺，叫 1 ${T('立方公尺')}。`, loop: [0, 1, 2],
    check: { q: '一個大貨櫃要用哪一個來量？', pic: () => '<div class="u-big">🚢</div>', opts: ['立方公分', '立方公尺'], a: 1, why: '貨櫃很大，用大方框。', ok: '對了！大約 30 立方公尺。' } },
};
/* ---------- 播放器 ---------- */
// seenCpt：已經自動播過（含跳過），不再自動播。cptLog：把「看過」和「做過、驗收」分開記（舊存檔沒有這個欄位，用到才建立）
const seenCpt = () => S.seenCpt || (S.seenCpt = {});
const cptLog = () => S.cptLog || (S.cptLog = {});
function logCpt(key, f) { const r = cptLog()[key] || (cptLog()[key] = {}); if (f === 'open' || f === 'hint') r[f] = (r[f] || 0) + 1; else r[f] = 1; }
function cptStatus(key) { // 看過 ≠ 學會：只有驗收題第一次就答對、操作沒用提示，才算「自己完成驗收」
  const r = cptLog()[key] || {};
  if (r.self) return ['done', '自己完成驗收'];
  if (r.help) return ['help', '經提示完成驗收'];
  if (r.ops) return ['ops', '做過操作，還沒驗收'];
  if (r.skip) return ['seen', '跳過了'];
  if (r.open || seenCpt()[key]) return ['seen', '看過'];
  return null;
}
let cptTimer = null, cptTimers = [];
const cptStop = () => { if (cptTimer) { clearInterval(cptTimer); cptTimer = null; } cptTimers.forEach(clearTimeout); cptTimers = []; };
const DEF_MH = { counter: '一次只做一件事：點有黃色虛線框的東西，看看圖上的數量怎麼變。', tapSet: '先想清楚要找的是什麼，再一個一個檢查。', two: '先比較兩個披薩的一塊誰比較大，塊比較大的那一個先分細。', tanks: '水的總量不變。從最高的水塔倒一格給最低的。' };
const pickWhy = (w, j) => Array.isArray(w) ? w[j] : w;
function runSeg(C, L, o) {
  const B = BOARDS[C.board], guess = {}; let backHint = '', retCheck = null, lastWrong = '', helped = 0;
  const log = f => { if (o.log) o.log(f); };
  const skipBtn = '<button class="skip5" id="skipc">跳過</button>';
  const fin = () => { cptStop(); o.done(); };
  const skip = () => { cptStop(); (o.skip || o.done)(); };
  const page = (prompt, body) => { cptStop(); lessonFrame({ title: o.title || '小故事', sem: L.sem, who: C.who }, prompt, body + skipBtn); document.getElementById('out').onclick = () => { cptStop(); o.out(); }; document.getElementById('skipc').onclick = skip; if (backHint) { setMsg(nums(backHint), 'hint'); backHint = ''; } };
  const next = i => () => show(i + 1);
  const btn = (txt, fn) => { actionBtn('nx5', txt).onclick = fn; reveal('#actions'); };
  function show(i) {
    const sc = C.scenes[i]; if (!sc) return fin();
    const tag = { demo: '看我做', together: '一起做', solo: '換你做' }[sc.mode];
    if (sc.t === 'hook') { page(sc.say, `<div class="cp">${sc.pic ? sc.pic() : ''}</div>`); return btn('開始', next(i)); }
    if (sc.t === 'guess') {
      page(sc.q, `<div class="trail">先選一個你目前的想法，等一下用圖確認。</div>`);
      document.getElementById('actions').innerHTML = `<div class="choices">${sc.opts.map((x, j) => `<button class="choice" data-g5="${j}">${x}</button>`).join('')}</div>`;
      document.querySelectorAll('[data-g5]').forEach(b => b.onclick = () => { guess.v = sc.opts[+b.dataset.g5]; guess.ok = sc.a === undefined ? null : +b.dataset.g5 === sc.a; setMsg(`你選了「${guess.v}」。等一下動手做做看，再對照。`, 'good'); btn('動手做做看', next(i)); });
      return;
    }
    if (sc.t === 'board') {
      const p = sc.p; let st = B.init(p), hl = 0, pre = null;
      page(`<span class="tag5">${tag}</span> ${sc.say}`, `<div class="cp" id="cp"></div><div class="trail" id="ct"></div>`);
      const draw = () => { setEl('cp', B.draw(p, st)); setEl('ct', nums(B.status(p, st))); };
      const end = () => {
        draw(); document.getElementById('cp').onclick = null;
        const cmp = pre === null ? '' : pre ? '<br><small>和你的預測一樣。</small>' : `<br><small>你剛才預測「${sc.predict[1][guess.pi]}」，和結果不一樣。看看圖上是哪裡不同。</small>`;
        setMsg(nums(B.result(p, st)) + cmp, 'good'); sfx.ok();
        if (sc.mode === 'solo') log('ops');
        if (retCheck !== null) { const r = retCheck; return btn('回到驗收題', () => { retCheck = null; show(r); }); }
        btn(i + 1 < C.scenes.length ? '下一步' : '完成', next(i));
      };
      const tap = id => { const r = B.tap(p, st, id); if (r.hint) { sfx.retry(); return setMsg(nums(r.hint), 'hint'); } st = r.st; sfx.hop(); setMsg(''); draw(); if (B.done(p, st)) end(); };
      let total = 0; { let s = B.copy(st); while (!B.done(p, s) && total < 60) { s = B.tap(p, s, B.next(p, s)).st; total++; } }
      const autoN = sc.mode === 'demo' ? total : sc.mode === 'together' ? Math.max(1, Math.floor(total / 2)) : 0;
      // 提示分兩層：第一次按給數學提示（要想什麼），再按才給位置提示（發亮下一步）
      const kid = () => { document.getElementById('cp').onclick = e => { const t = e.target.closest('[data-t]'); if (t) tap(t.dataset.t); }; if (sc.mode !== 'demo') actionBtn('hp5', '提示').onclick = () => { hl++; helped++; log('hint'); if (hl === 1) return setMsg(nums('想一想：' + (sc.mh || DEF_MH[C.board] || DEF_MH.tapSet)), 'hint'); const id = B.next(p, st); const el = document.querySelector(`#cp [data-t="${id}"]`); if (el) el.classList.add('glow5'); setMsg('位置提示：發亮的地方是下一步可以點的。', 'hint'); }; };
      const auto = k => { if (k >= autoN) { if (B.done(p, st)) return end(); if (sc.mode === 'together') setMsg('換你點，把剩下的做完。需要的話可以按「提示」。'); return kid(); } cptTimers.push(setTimeout(() => { if (!document.getElementById('cp')) return; tap(B.next(p, st)); if (!B.done(p, st)) auto(k + 1); }, p.ms || 750)); };
      draw();
      const go = () => { document.getElementById('actions').innerHTML = ''; auto(0); };
      if (sc.predict && retCheck === null) { // 預測放在題目條件和圖都出現之後
        setMsg(sc.predict[0]);
        document.getElementById('actions').innerHTML = `<div class="choices">${sc.predict[1].map((x, j) => `<button class="choice" data-p5="${j}">${x}</button>`).join('')}</div>`;
        document.querySelectorAll('[data-p5]').forEach(b => b.onclick = () => { guess.pi = +b.dataset.p5; pre = guess.pi === sc.predict[2]; setMsg(`你預測「${sc.predict[1][guess.pi]}」。動手做做看，做完再對照。`); go(); });
        return;
      }
      return go();
    }
    if (sc.t === 'reveal') { const cmp = guess.v ? (guess.ok === true ? `你剛才選「${guess.v}」，和圖上的結果一樣。` : guess.ok === false ? `你剛才選「${guess.v}」。現在圖上有什麼不同？` : `你剛才選「${guess.v}」。`) : ''; page(`${cmp}${sc.say}`, `<div class="cp">${sc.pic ? sc.pic() : ''}</div>`); return btn('下一步', next(i)); }
    if (sc.t === 'fade') {
      let k = 0;
      const step = () => { const s = sc.steps[k], prev = k ? `<div class="prev5">${sc.steps[k - 1].h}</div><div class="arr5">↓ 同一件事</div>` : ''; page(s.t, `${prev}<div class="cp">${s.h}</div>`); btn(k < 2 ? '下一步' : '繼續', () => { k++; if (k < 3) step(); else show(i + 1); }); };
      return step();
    }
    if (sc.t === 'sort') {
      page(sc.q, `<div class="bins5">${sc.bins.map((b, j) => `<div class="bin5" data-b="${j}"><b>${b}</b><div class="binin" id="bin${j}"></div></div>`).join('')}</div><div class="cards5">${sc.items.map((it, j) => `<button class="card5" data-c="${j}">${nums(it.h)}</button>`).join('')}</div>`);
      let sel = null, left = sc.items.length;
      setMsg('先點一張卡片，再點它要去的那一邊。');
      document.querySelectorAll('[data-c]').forEach(c => c.onclick = () => { document.querySelectorAll('.card5').forEach(x => x.classList.remove('sel')); sel = +c.dataset.c; c.classList.add('sel'); });
      document.querySelectorAll('[data-b]').forEach(b => b.onclick = () => {
        if (sel === null) return setMsg('先點一張卡片。', 'hint');
        const it = sc.items[sel]; if (it.c !== +b.dataset.b) { sfx.retry(); return setMsg(nums(it.w || sc.hint), 'hint'); }
        const card = document.querySelector(`[data-c="${sel}"]`); document.getElementById('bin' + b.dataset.b).appendChild(card); card.disabled = true; card.classList.remove('sel'); sel = null; sfx.hop();
        if (--left === 0) { setMsg(nums(sc.done), 'good'); btn('下一步', next(i)); }
      });
      return;
    }
    if (sc.t === 'pose') { // 依實際做的事命名：拼成一道題、選一個合適的問題、資料夠嗎、改一個條件
      const ptag = sc.rows ? '拼成一道題' : { can: '資料夠嗎？', change: '改一個條件', story: '選一個合適的問題', pic: '選一個合適的問題' }[sc.kind] || '選一個合適的問題';
      const pq = sc.kind === 'can' ? `${sc.q}<br><small>目前的資料夠回答嗎？還需要知道什麼？</small>` : sc.q;
      page(`<span class="tag5">${ptag}</span> ${pq}`, `<div class="cp">${sc.pic ? sc.pic() : ''}</div>`);
      if (sc.rows) { // 把「東西、怎麼做、問什麼」三張卡拼成一題；每一列可以有不只一個合理選擇
        const pickd = sc.rows.map(() => -1);
        const paint = () => { setEl('stage', `<div class="cp">${sc.pic ? sc.pic() : ''}</div>${sc.rows.map((row, ri) => `<div class="prow5"><small>${row.label}</small>${row.cards.map((c, ci) => `<button class="card5 ${pickd[ri] === ci ? 'sel' : ''}" data-r="${ri}" data-k="${ci}">${nums(c)}</button>`).join('')}</div>`).join('')}<div class="trail">${pickd.every(x => x >= 0) ? nums(sc.rows.map((row, ri) => row.cards[pickd[ri]]).join('')) : '每一列選一張'}</div>${skipBtn}`); document.getElementById('skipc').onclick = skip; document.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { pickd[+b.dataset.r] = +b.dataset.k; sfx.hop(); paint(); }); };
        paint();
        actionBtn('ck5', '這樣拼').onclick = () => { if (pickd.some(x => x < 0)) return setMsg('每一列都要選一張。', 'hint'); const bad = sc.rows.findIndex((row, ri) => !row.ok.includes(pickd[ri])); if (bad >= 0) { sfx.retry(); return setMsg(nums(`「${sc.rows[bad].label}」這一列：${sc.rows[bad].why}`), 'hint'); } sfx.good(); setMsg(nums(sc.ok), 'good'); btn('下一步', next(i)); };
        return;
      }
      document.getElementById('actions').innerHTML = `<div class="choices col">${sc.opts.map((x, j) => `<button class="choice" data-c5="${j}">${nums(x)}</button>`).join('')}</div>`;
      document.querySelectorAll('[data-c5]').forEach(b => b.onclick = () => { const j = +b.dataset.c5; if (j === sc.a) { sfx.good(); setMsg(nums(sc.ok), 'good'); return btn('下一步', next(i)); } sfx.retry(); b.disabled = true; b.classList.add('no'); setMsg(nums(pickWhy(sc.why, j)), 'hint'); });
      return;
    }
    if (sc.t === 'name') { page(sc.say || `${sc.kid}，<br>就叫作${T(sc.term)}。`, `<div class="cp">${typeof sc.pic === 'function' ? sc.pic() : sc.pic}</div><div class="tagrow"><span class="termtag">${sc.term}</span></div>`); return btn('下一步', next(i)); }
    if (sc.t === 'pick' || sc.t === 'check') {
      const chk = sc.t === 'check';
      page(chk ? sc.q : '哪一句話說得對？', chk ? `<div class="cp">${sc.pic()}</div>` : '');
      if (chk && lastWrong) setMsg(nums(`你上一次選「${lastWrong}」。對照剛才那一步，再選一次。`), 'hint');
      document.getElementById('actions').innerHTML = `<div class="choices ${chk ? '' : 'col'}">${sc.opts.map((x, j) => `<button class="choice" data-c5="${j}">${nums(x)}</button>`).join('')}</div>`;
      document.querySelectorAll('[data-c5]').forEach(b => b.onclick = () => {
        const j = +b.dataset.c5;
        if (j === sc.a) {
          sfx.good(); if (!chk) { setMsg('對了。', 'good'); return btn('下一步', next(i)); }
          setMsg(nums(sc.ok) + (o.note ? `<br><small>${nums(o.note)}</small>` : ''), 'good'); if (o.right) o.right(!lastWrong && !helped); document.getElementById('skipc').hidden = true; return btn(o.last || '完成', fin);
        }
        sfx.retry(); b.disabled = true; b.classList.add('no');
        if (!chk) return setMsg(nums(pickWhy(sc.why, j)), 'hint');
        const h = (sc.hints && sc.hints[j]) || sc.hint; lastWrong = sc.opts[j];
        setMsg(nums(h), 'hint'); actionBtn('bk', '回去看那一步').onclick = () => { backHint = `${h}<br><small>做完這一步，會直接回到驗收題。</small>`; retCheck = i; show(sc.back); };
      });
    }
  }
  show(o.start || 0);
}
let CONCEPTS = SEGS; // segs5*.js 補上其餘段落後重新組合
const conceptsOf = g => CONCEPTS.filter(c => c.game === g || c.when.some(w => w.startsWith(g + ':')));
function runConcept(key, then, note) {
  const C = CONCEPTS.find(c => c.key === key);
  logCpt(key, 'open'); save();
  const o = { done: () => { seenCpt()[key] = 1; save(); then(); }, skip: () => { seenCpt()[key] = 1; logCpt(key, 'skip'); save(); then(); }, right: self => { seenCpt()[key] = 1; logCpt(key, self ? 'self' : 'help'); save(); }, log: f => logCpt(key, f), out: () => { R = null; go(''); }, last: '開始玩', note };
  if (!C.scenes) return storyFlow(C, { title: C.title, sem: GAMES[C.game].sem, who: C.who }, o);
  runSeg(C, { sem: GAMES[C.game].sem }, o);
}
const LESSON_STORY = {};
function lessonStory(key, L, next, leave) { // 單位教室開場：一個單位一段，依序播
  if (!LESSON_STORY[key] && OLD_LESSON_STORY[key]) return storyFlow(OLD_LESSON_STORY[key], { title: '單位教室', sem: L.sem, who: L.who }, { done: next, out: leave, last: '再多認識一點' });
  const list = LESSON_STORY[key] || []; let i = 0;
  const run = () => { if (i >= list.length) return next(); const seg = list[i++]; logCpt(seg.key, 'open'); runSeg(seg, L, { done: run, skip: () => { logCpt(seg.key, 'skip'); save(); run(); }, right: self => { logCpt(seg.key, self ? 'self' : 'help'); save(); }, log: f => logCpt(seg.key, f), out: leave, last: i < list.length ? '下一個單位' : '再多認識一點', title: '單位教室' }); };
  run();
}
function conceptThen(q, then) { // 第一次碰到這個題型：只播目前最需要的一段（還沒看過的第一段），其他列為選讀，不連播
  const key = q.kind + ':' + q.mode, list = CONCEPTS.filter(c => c.when.includes(key)), C = list.find(c => !seenCpt()[c.key]);
  if (!C) return then();
  const rest = list.filter(c => c !== C && !seenCpt()[c.key]).map(c => `〈${c.title}〉`);
  runConcept(C.key, then, rest.length ? `相關的小故事${rest.join('、')}可以之後按題目上的 💡 選讀。` : '');
}
function viewConcepts(g, back) { // 重看：「看過」和「做過、驗收」分開顯示
  const list = g ? conceptsOf(g) : CONCEPTS;
  window.scrollTo(0, 0);
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="bkc" aria-label="回去">⌂</button><h2 class="page-h">新概念小故事</h2></div><p class="tag">想再看一次哪一個？</p><p class="cst5-note">「看過」不等於學會；驗收題自己答對，才標「自己完成驗收」。</p><div class="lessons">${list.map(c => { const s = cptStatus(c.key); return `<button class="lesson" data-rc="${c.key}"><span class="l-t"><b>${c.title}</b><small>${GAMES[c.game].name}</small></span><em class="sem">${GAMES[c.game].sem}</em>${s ? `<span class="cst5 ${s[0]}">${s[1]}</span>` : ''}</button>`; }).join('')}</div>`;
  document.getElementById('bkc').onclick = back;
  document.querySelectorAll('[data-rc]').forEach(b => b.onclick = () => runConcept(b.dataset.rc, () => viewConcepts(g, back)));
}
/* ---------- 鷹架版段落（一）：因數倍數、多邊形、分數（依 2026-11-02 外部審查修訂） ---------- */
const cnt = (n, draw, st, res, say, predict, mh) => ({ p: { n, draw, st, res }, say, predict: predict || null, mh });
const tset = (right, draw, st, res, say, predict, hints, mh) => ({ p: { right, draw, st, res, hints }, say, predict: predict || null, mh });
// 「選一個合適的問題／資料夠嗎／改一個條件」：kind 決定畫面上的標籤，why 可以是每個選項各一句
const pose = (kind, q, opts, a, why, ok, pic) => ({ kind, q, opts, a, why, ok, pic });
const step3 = (h1, t1, h2, t2, h3, t3) => [{ h: h1, t: '第 1 步：' + t1 }, { h: h2, t: '第 2 步：' + t2 }, { h: h3, t: '第 3 步：' + t3 }];
const lit = (s, c) => `<b style="color:${c}">${s}</b>`;
// 時鐘：短針是時針、長針是分針（h 可以有小數，m 是分鐘）
const clock2 = (h, m) => { const P = (deg, l) => [100 + l * Math.sin(deg * Math.PI / 180), 100 - l * Math.cos(deg * Math.PI / 180)], hh = P((h % 12) * 30 + m * .5, 44), mm = P(m * 6, 70); let s = '<svg class="clock4" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="#fff" stroke="#33405a" stroke-width="4"/>'; for (let i = 1; i <= 12; i++) { const [x, y] = P(i * 30, 76); s += `<text x="${x}" y="${y + 6}" text-anchor="middle" class="pt">${i}</text>`; } return s + `<line x1="100" y1="100" x2="${mm[0]}" y2="${mm[1]}" stroke="#2f5f9e" stroke-width="5" stroke-linecap="round"/><line x1="100" y1="100" x2="${hh[0]}" y2="${hh[1]}" stroke="#d6476b" stroke-width="8" stroke-linecap="round"/><circle cx="100" cy="100" r="6" fill="#33405a"/></svg>`; };
// 兩堆磚排排看：先排紅磚，再排藍磚
const bricks2 = (a, b, w) => k => { const ra = Math.min(k, a), rb = Math.max(0, k - a); const rows = (n, e) => { const r = []; for (let i = 0; i < n; i += w) r.push(`<div class="row6">${em(e, Math.min(w, n - i))}</div>`); return r.join(''); }; return `<div class="vs two5"><div class="rows6">${rows(ra, '🟥') || '<small>紅磚</small>'}</div><div class="rows6">${rows(rb, '🟦') || '<small>藍磚</small>'}</div></div><div class="pile6">${k < a + b ? `<span class="tap5w big6" data-t="x">${k < a ? '🟥' : '🟦'}</span>${em(k < a ? '🟥' : '🟦', (k < a ? a - k : a + b - k) - 1)}` : ''}</div>`; };
const bricksSt = (a, b, w) => k => k < a + b ? `排了 ${k} 塊` : `紅磚${a % w ? '最後一排不滿' : '剛好排完'}，藍磚${b % w ? '最後一排不滿' : '剛好排完'}`;
const brRound = (a, b, w, say, predict) => cnt(a + b, bricks2(a, b, w), bricksSt(a, b, w), `每排 ${w} 塊：紅磚 ${a} 塊${a % w ? `最後一排只有 ${a % w} 塊` : '剛好排完'}，藍磚 ${b} 塊${b % w ? `最後一排只有 ${b % w} 塊` : '剛好排完'}。`, say, predict);
const lampsDraw = (A, B) => k => `${lampPair(k && k % A === 0, k && k % B === 0)}<div class="lines5"><div>${Array.from({ length: Math.max(k, 1) }, (_, i) => `<i class="${(i + 1) % A === 0 && i < k ? 'r' : ''}">${i + 1}</i>`).join('')}</div><div>${Array.from({ length: Math.max(k, 1) }, (_, i) => `<i class="${(i + 1) % B === 0 && i < k ? 'g' : ''}">${i + 1}</i>`).join('')}</div></div><div class="pile6"><span class="tap5w big6" data-t="x">⏱️</span><small>點一下，時間過 1 秒</small></div>`;
const lampRound = (A, B, n, say, predict, res) => cnt(n, lampsDraw(A, B), k => k ? `第 ${k} 秒：${k % A === 0 && k % B === 0 ? '兩盞一起亮！' : k % A === 0 ? '紅燈亮' : k % B === 0 ? '綠燈亮' : '都沒亮'}` : '第 0 秒：兩盞同時亮了一下，碼表開始', res || `從第 0 秒算起，第 ${n} 秒兩盞燈最早再一起亮。`, say, predict);
const boxDraw = (each, n, e) => k => `<div class="crates">${Array.from({ length: k }, (_, i) => `<span class="crate"><span class="em5">${e.repeat(each)}</span><small>${each * (i + 1)}</small></span>`).join('') || '<small>還沒拿</small>'}</div><div class="pile6">${k < n ? `<span class="tap5w big6" data-t="x">📦</span><small>拿一盒（每盒 ${each} 顆）</small>` : ''}</div>`;
const tearTri = (P, lab) => s => { const ang = triAngles(P), C = ['#f4a9a0', '#a9d0f0', '#b7e0a8'], torn = [0, 1, 2].filter(i => s.has('c' + i)).map(i => ang[i]); return `${tri5(P, P.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="17" data-t="c${i}" class="tap5" fill="${s.has('c' + i) ? '#fff' : C[i]}" stroke="#33405a" stroke-width="2"/>`).join(''))}<div class="q5">${torn.length ? wedges(torn) : '<div class="trail">點一個角，把它撕下來</div>'}</div>`; };
const TRIS = [[[60, 150], [270, 150], [130, 30]], [[30, 150], [290, 150], [80, 60]], [[90, 150], [230, 150], [160, 20]]];
const sideShape = (P, s, showAng) => { const n = P.length; let h = `<svg class="g5" style="max-height:170px" viewBox="0 0 320 210"><polygon points="${polyStr(P)}" fill="#fff0cf" stroke="#7a5b2e" stroke-width="3"/>`; P.forEach((p, i) => { const q = P[(i + 1) % n], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], L = Math.round(Math.hypot(p[0] - q[0], p[1] - q[1]) / 20); h += `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${s.has('s' + i) ? C1 : 'transparent'}" stroke-width="14" data-t="s${i}" class="tap5" opacity=".5"/>${s.has('s' + i) ? `<text x="${m[0]}" y="${m[1] - 8}" text-anchor="middle" class="ax" style="fill:${C1}">${L}</text>` : ''}`; if (showAng) { const l = P[(i + n - 1) % n], c = [P.reduce((a, b) => a + b[0], 0) / n, P.reduce((a, b) => a + b[1], 0) / n]; h += `<text x="${p[0] + (c[0] - p[0]) * .25}" y="${p[1] + (c[1] - p[1]) * .25 + 5}" text-anchor="middle" class="ax" style="fill:${C2}">${Math.round(ptAng(l, p, q))}°</text>`; } }); return h + '</svg>'; };
// 菱形：上下兩個角 60 度、左右兩個角 120 度（半寬 52、半高 90，tan 30°≈52/90）
const SH_RECT = [[50, 50], [270, 50], [270, 160], [50, 160]], SH_RHO = [[160, 15], [212, 105], [160, 195], [108, 105]], SH_SQ = [[100, 40], [220, 40], [220, 160], [100, 160]];
const measRound = (P, say, predict) => tset(P.map((_, i) => 's' + i), s => sideShape(P, s, s.size === P.length), s => s.size < P.length ? `量了 ${s.size} 條邊` : '邊量完了，四個角的度數也一起量出來', '每條邊和每個角都量好了。', say, predict, null, '每一條邊都要量到。一條一條點，量完會看到邊長和角的度數。');
const mergePie = (n, a) => s => { const parts = []; for (let j = 0; j < n / 2; j++) { const on = 2 * j < a; if (s.has('m' + j)) parts.push({ f: 2 / n, c: on ? PIE_ON : PIE_OFF }); else parts.push({ f: 1 / n, c: on ? PIE_ON : PIE_OFF, t: 'm' + j }, { f: 1 / n, c: on ? PIE_ON : PIE_OFF, t: 'm' + j }); } return `<div class="vs">${wedgePie(parts)}</div>`; };
const mergeRound = (n, a, say, predict) => tset(Array.from({ length: n / 2 }, (_, j) => 'm' + j), mergePie(n, a), s => `紅色 ${a - [...s].filter(m => 2 * +m.slice(1) < a).length} 塊，全部 ${n - s.size} 塊`, `每兩塊合成一塊：${a}/${n} 變成 ${a / 2}/${n / 2}，紅色部分的大小沒有變。`, say, predict, null, '相鄰的兩小塊合成一塊。紅的和紅的合，白的和白的合。');
const capRow = (opts, a, ok, why) => ({ opts, a, ok, why });

SEGS.push(
  mk({ key: 'multiple', title: '倍數', term: '倍數', who: 'octopus', game: 'factor', when: ['factor:multi'], board: 'counter',
    hook: '兩個兩個數：2、4、6、8。今天換成一盒一盒拿蛋來數。', hookPic: () => `<div class="eq5">2、4、6、8</div>`,
    mh: '每拿一盒，蛋就多一盒的顆數。點一下盒子，看看總數變成多少。',
    rounds: [cnt(3, boxDraw(2, 3, '🥚'), k => `拿了 ${k} 盒，共 ${2 * k} 顆`, '拿 1、2、3 盒，分別是 2、4、6 顆，每次多 2 顆。', '看我做：一盒 2 顆蛋，我一盒一盒拿。'), cnt(3, boxDraw(3, 3, '🥚'), k => `拿了 ${k} 盒，共 ${3 * k} 顆`, '拿 1、2、3 盒，分別是 3、6、9 顆，每次多 3 顆。', '一起做：一盒 3 顆。我先拿，剩下的你拿。'), cnt(3, boxDraw(4, 3, '🥚'), k => `拿了 ${k} 盒，共 ${4 * k} 顆`, '拿 1、2、3 盒，分別是 4、8、12 顆，每次多 4 顆。', '換你做：一盒 4 顆，一盒一盒拿。', ['先預測：拿 3 盒共幾顆？', ['7 顆', '12 顆', '16 顆'], 1])],
    fade: step3(`<div class="crates">${[1, 2, 3].map(i => `<span class="crate"><span class="em5">${'🥚'.repeat(3)}</span><small>${3 * i}</small></span>`).join('')}</div>`, '真的蛋盒，每盒 3 顆，拿了 3 盒。', `<div class="lines5"><div>${Array.from({ length: 9 }, (_, i) => `<i class="${(i + 1) % 3 ? '' : 'r'}">${i + 1}</i>`).join('')}</div></div>`, '畫成數線：每拿一盒，就往前跳 3 格，停在 3、6、9。', `<div class="eq5">${K(3, C1)}×1、${K(3, C1)}×2、${K(3, C1)}×3 ＝ ${K(3, C2)}、${K(6, C2)}、${K(9, C2)}</div><div class="trail">${lit('紅 3：每盒幾顆', C1)}　×1、×2、×3：拿幾盒　${lit('藍：數線上停的地方', C2)}</div>`, '寫成算式：每盒的顆數 × 盒數。'),
    sort: { q: '一盒 3 顆，一盒一盒拿，能剛好拿到幾顆？', items: [[6, 0], [9, 0], [12, 0], [7, 1], [10, 1]].map(([v, c]) => ({ h: `${v} 顆`, c })), bins: ['拿得到', '拿不到'], hint: '從 3 開始，每次加 3：3、6、9、12⋯⋯會不會碰到它？', done: '6、9、12 拿得到；7、10 會被跳過，拿不到。' },
    nameSay: `每盒 3 顆，拿 1、2、3、4 盒，分別有 3、6、9、12 顆，也就是 3×1、3×2、3×3、3×4。<br>這些數叫作 3 的${T('倍數')}，還可以一直找下去。（這裡從拿 1 盒開始數。）`, namePic: `<div class="eq5">${[3, 6, 9, 12].map(v => K(v, C2)).join('、')}⋯⋯</div>`,
    pick: [['3 的倍數只有 3、6、9 三個。', '3、6、9、12 都是 3 的倍數，還可以一直數下去。', '7 也是 3 的倍數。'], 1, ['再拿第 4 盒就有 12 顆，還可以繼續拿下去。', '', '3、6、9 一路跳過了 7，一盒一盒拿，拿不到 7 顆。']],
    pose: pose('story', '哪一個問題會用到「5 的倍數」？', ['每包 5 片餅乾，買幾包會有幾片？', '5 片餅乾吃掉 2 片，剩幾片？', '5 個人分 10 片，每人幾片？'], 0, ['', '這是拿走一部分，不是一包一包加上去。', '這是平均分，不是一包一包加上去。'], '對了！一包 5 片、一包一包買，數到的片數 5、10、15⋯⋯就是 5 的倍數。'),
    check: { q: '每包 5 片餅乾，一包一包買，能剛好買到 15 片嗎？', pic: () => `<div class="crates">${[1, 2, 3].map(() => `<span class="crate"><span class="em5">🍪🍪🍪🍪🍪</span></span>`).join('')}</div>`, opts: ['買得到', '買不到'], a: 0, hint: '回到一盒一盒拿那一步：5、10、15⋯⋯', hints: ['', '數數看：第 1 包 5 片、第 2 包 10 片、第 3 包幾片？'], ok: '對了，你一包一包數：5、10、15。5×3＝15，15 是 5 的倍數。' } }),

  mk({ key: 'comf', title: '公因數', term: '公因數', who: 'octopus', game: 'factor', when: ['factor:comf', 'factor:pave'], board: 'counter',
    hook: '先回想：6 塊地磚每排 2 塊，剛好排完。這次有紅磚 4 塊、藍磚 6 塊，兩堆要用同樣的每排塊數來排。', hookPic: () => `${em('🟥', 4)}　${em('🟦', 6)}`,
    mh: '一塊一塊點，先排紅磚、再排藍磚。排完看兩堆的最後一排是不是都滿。',
    rounds: [brRound(4, 6, 2, '看我做：4 塊紅磚、6 塊藍磚，兩堆都每排 2 塊。'), brRound(4, 6, 3, '一起做：這次兩堆都每排 3 塊，我先排紅磚。'), brRound(4, 6, 4, '換你做：兩堆都每排 4 塊。', ['先預測：每排 4 塊，兩堆都會剛好排完嗎？', ['兩堆都剛好', '有一堆排不滿'], 1])],
    fade: step3(`<div class="vs two5"><div class="rows6"><div class="row6">${em('🟥', 2)}</div><div class="row6">${em('🟥', 2)}</div></div><div class="rows6">${[1, 2, 3].map(() => `<div class="row6">${em('🟦', 2)}</div>`).join('')}</div></div>`, '真的磚，每排 2 塊，兩堆都剛好排完。', `<div class="eq5" style="font-size:20px"><span class="ln5">${lit('紅磚 4', C1)}：每排 ${K(1, C3)}、${K(2, C3)}、4 塊都剛好</span><span class="ln5">${lit('藍磚 6', C2)}：每排 ${K(1, C3)}、${K(2, C3)}、3、6 塊都剛好</span></div>`, '把兩堆各自能剛好排完的每排塊數，全部列出來。', `<div class="eq5">${K(1, C3)}、${K(2, C3)}</div><div class="trail">${lit('綠色', C3)}是兩列都有的數：紅磚排得完，藍磚也排得完</div>`, '圈出兩列都有的數。'),
    sort: { q: '每排幾塊，兩堆都能剛好排完？', items: [1, 2, 3, 4, 6].map(w => ({ h: `每排 ${w} 塊`, c: 4 % w || 6 % w ? 1 : 0 })), bins: ['兩堆都剛好', '有一堆不滿'], hint: '紅磚 4 塊、藍磚 6 塊，兩堆都要排完才算。', done: '1、2 兩堆都剛好；3、6 紅磚排不滿，4 藍磚排不滿。' },
    nameSay: `4÷1、4÷2、6÷1、6÷2 都沒有餘數。<br>像 1、2 這樣，能同時把 4 和 6 剛好分完的數，叫作 4 和 6 的${T('公因數')}。`, namePic: `<div class="eq5">${K(1, C3)}、${K(2, C3)}</div>`,
    pick: [['公因數是能同時把兩個數剛好分完的數。', '公因數就是兩個數相加。', '3 是 4 和 6 的公因數。'], 0, ['', '4＋6＝10，每排 10 塊，兩堆連一排都排不滿。', '每排 3 塊：藍磚剛好，紅磚最後一排只有 1 塊。']],
    pose: pose('can', '紅磚 4 塊，藍磚有一些，兩堆都每排 2 塊。兩堆都會剛好排完嗎？', ['夠，一定都剛好', '不夠，還需要知道藍磚有幾塊', '不夠，紅磚太少'], 1, ['藍磚如果是 5 塊，每排 2 塊就會剩 1 塊。', '', '紅磚 4 塊每排 2 塊剛好，問題不在紅磚。'], '對了，缺藍磚的塊數。藍磚 6 塊就剛好，5 塊就排不完。'),
    check: { q: '6 顆蘋果、9 顆橘子，都是每袋裝 3 顆，兩種都剛好裝完嗎？3 是 6 和 9 的公因數嗎？', pic: () => `${em('🍎', 6)}　${em('🍊', 9)}`, opts: ['是', '不是'], a: 0, hint: '回到排磚那一步：兩堆每排 3 個，各自排得完嗎？', hints: ['', '6÷3＝2、9÷3＝3，兩個都沒有餘數。'], ok: '對了，你分別檢查兩堆：6÷3、9÷3 都沒有餘數，3 是 6 和 9 的公因數。' } }),

  mk({ key: 'gcf', title: '最大公因數', term: '最大公因數', who: 'octopus', game: 'factor', when: ['factor:comf', 'factor:pave'], board: 'counter',
    hook: '先回想：4 和 6 的公因數是 1 和 2。這次兩堆磚每排放一樣多、都要剛好排完，而且每排越多越好。', hookPic: () => `<div class="eq5">${K(1, C3)}、${K(2, C3)}</div>`,
    guess: ['兩堆每排放一樣多、都剛好排完，每排最多可以放幾塊？', ['1 塊', '2 塊', '4 塊'], 1],
    mh: '一塊一塊排，排完看兩堆的最後一排是不是都滿。都滿才行。',
    rounds: [brRound(4, 6, 2, '看我做：紅磚 4 塊、藍磚 6 塊，試每排 2 塊。'), brRound(6, 9, 3, '一起做：紅磚 6 塊、藍磚 9 塊，試每排 3 塊。'), brRound(4, 8, 4, '換你做：紅磚 4 塊、藍磚 8 塊，試每排 4 塊。', ['先預測：每排 4 塊，兩堆都剛好嗎？', ['都剛好', '有一堆不滿'], 0])],
    reveal: '4 和 6 每排 3 塊或 4 塊，總有一堆排不完；每排最多 2 塊。', revealPic: () => `<div class="eq5">${K(1, C3)}、${K(2, C1)}</div>`,
    fade: step3(`<div class="vs two5"><div class="rows6">${[1, 2].map(() => `<div class="row6">${em('🟥', 2)}</div>`).join('')}</div><div class="rows6">${[1, 2, 3].map(() => `<div class="row6">${em('🟦', 2)}</div>`).join('')}</div></div>`, '紅磚 4 塊、藍磚 6 塊，每排 2 塊，兩堆都剛好。', `<div class="eq5" style="font-size:20px"><span class="ln5">4：${K(1, C3)}、${K(2, C3)}、4</span><span class="ln5">6：${K(1, C3)}、${K(2, C3)}、3、6</span></div>`, '列出兩堆各自能剛好排完的數，綠色是兩堆都有的。', `<div class="eq5">${K(1, C3)}、${K(2, C1)} → 最大的是 ${K(2, C1)}</div>`, '在兩堆都有的數裡，挑最大的。'),
    nameSay: `4 和 6 的公因數有 1、2，其中最大的是 2。<br>公因數裡最大的那一個，叫作${T('最大公因數')}。`, namePic: `<div class="eq5">4 和 6 → ${K(2, C1)}</div>`,
    pick: [['最大公因數是兩個數相乘。', '最大公因數是公因數裡最大的那一個。', '最大公因數一定是 1。'], 1, ['4×6＝24，每排 24 塊，兩堆都排不滿。', '', '1 一定是公因數，可是 4 和 6 還有比 1 大的 2。']],
    pose: pose('change', '紅磚 4 塊、藍磚 6 塊。只把藍磚改成 8 塊，每排最多幾塊會變嗎？', ['會，變成 4 塊', '不會，還是 2 塊', '會，變成 1 塊'], 0, ['', '試試每排 4 塊：4÷4、8÷4 都沒有餘數。', '每排 2 塊、4 塊也都能剛好，最多不是 1 塊。'], '對了，4 和 8 每排最多 4 塊。改一個數，最大公因數就可能改變。'),
    check: { q: '6 公分和 9 公分的兩條繩子，都剪成等長的小段，不留剩餘。每段最長幾公分？', pic: () => `${cBar(6, 6, '#f4a9a0')}${cBar(9, 9, '#a9d0f0')}`, opts: ['1 公分', '3 公分', '9 公分'], a: 1, hint: '回到排磚那一步：6 和 9 都能剛好分完的數裡，最大是幾？', hints: ['1 公分可以剪得剛好，但不是最長的；試試更長的。', '', '6 公分長的繩子剪不出 9 公分的一段。'], ok: '對了，6 和 9 的公因數有 1、3，最大的是 3，每段最長 3 公分。' } }),

  mk({ key: 'coml', title: '公倍數', term: '公倍數', who: 'octopus', game: 'factor', when: ['factor:lamp'], board: 'counter',
    hook: '兩盞燈在碼表第 0 秒同時亮了一下。之後紅燈每隔 2 秒亮一次，綠燈每隔 3 秒亮一次。', hookPic: () => lampPair(true, true),
    mh: '紅燈在 2 數得到的秒數亮，綠燈在 3 數得到的秒數亮。點碼表，一秒一秒看。',
    rounds: [lampRound(2, 3, 6, '看我做：紅燈每隔 2 秒、綠燈每隔 3 秒亮。我按碼表。', null, '第 6 秒兩盞燈再一起亮。繼續數下去，第 12、18 秒也會一起亮。'), lampRound(2, 4, 8, '一起做：紅燈每隔 2 秒、綠燈每隔 4 秒。我先按，你接著按到第 8 秒。', null, '第 4 秒和第 8 秒，兩盞燈都一起亮。'), lampRound(3, 6, 6, '換你做：紅燈每隔 3 秒、綠燈每隔 6 秒。', ['先預測：開始之後，第幾秒會再一起亮？', ['第 3 秒', '第 6 秒', '第 18 秒'], 1])],
    fade: step3(lampPair(true, true), '紅燈每隔 2 秒、綠燈每隔 3 秒，第 6 秒一起亮。', `<div class="lines5"><div>${Array.from({ length: 12 }, (_, i) => `<i class="${(i + 1) % 2 ? '' : 'r'}">${i + 1}</i>`).join('')}</div><div>${Array.from({ length: 12 }, (_, i) => `<i class="${(i + 1) % 3 ? '' : 'g'}">${i + 1}</i>`).join('')}</div></div>`, `畫成兩條數線：${lit('紅', C1)}是紅燈亮、${lit('綠', C3)}是綠燈亮。`, `<div class="eq5">${K(6, C4)}、${K(12, C4)}</div><div class="trail">兩條線都有記號的地方：6 和 12 是 2 數得到的，也是 3 數得到的</div>`, '圈出兩條都有的數。'),
    sort: { q: '紅燈每隔 2 秒、綠燈每隔 3 秒，哪幾秒兩盞一起亮？', items: [[6, 0], [12, 0], [4, 1], [9, 1]].map(([v, c]) => ({ h: `第 ${v} 秒`, c })), bins: ['一起亮', '只亮一盞'], hint: '要是 2 數得到的，也要是 3 數得到的。', done: '6、12 一起亮；4 只有紅燈，9 只有綠燈。' },
    nameSay: `紅燈在 2、4、6、8⋯⋯秒亮，綠燈在 3、6、9、12⋯⋯秒亮。<br>兩邊都有的 6、12、18⋯⋯，既是 2 的倍數也是 3 的倍數，叫作 2 和 3 的${T('公倍數')}。`, namePic: `<div class="eq5">${[6, 12, 18].map(v => K(v, C4)).join('、')}⋯⋯</div>`,
    pick: [['公倍數是兩個數都數得到的數。', '公倍數是兩個數相加。', '4 是 2 和 3 的公倍數。'], 0, ['', '2＋3＝5，第 5 秒兩盞燈都沒亮。', '第 4 秒只有紅燈亮，4 不是 3 的倍數。']],
    pose: pose('pic', '看這兩條數線，哪一個問題配得上？', ['甲、乙兩線公車現在同時到站，之後甲每 2 分鐘、乙每 3 分鐘到站一次。什麼時候會再一起到站？', '甲有 2 顆、乙有 3 顆，共幾顆？', '2 個人分 3 個餅。'], 0, ['', '兩條數線是兩種「每隔多久」，不是把兩堆合起來。', '兩條數線是兩種「每隔多久」，不是平均分。'], '對了！兩件每隔一段時間就發生的事，從同一個時刻開始，之後一起發生的時刻就是公倍數。', () => `<div class="lines5"><div>${Array.from({ length: 6 }, (_, i) => `<i class="${(i + 1) % 2 ? '' : 'r'}">${i + 1}</i>`).join('')}</div><div>${Array.from({ length: 6 }, (_, i) => `<i class="${(i + 1) % 3 ? '' : 'g'}">${i + 1}</i>`).join('')}</div></div>`),
    check: { q: '甲、乙兩線公車現在同時到站，之後甲每 2 分鐘、乙每 3 分鐘到一班。從現在算起第 12 分鐘，會一起到站嗎？', pic: () => '<div class="u-big">🚌🚌</div>', opts: ['會', '不會'], a: 0, hint: '回到按碼表那一步：12 是 2 數得到的嗎？是 3 數得到的嗎？', hints: ['', '兩個都檢查：12÷2＝6、12÷3＝4，都沒有餘數。'], ok: '對了，你檢查了兩邊：12 是 2 的倍數，也是 3 的倍數，所以是 2 和 3 的公倍數。' } }),

  mk({ key: 'lcm', title: '最小公倍數', term: '最小公倍數', who: 'octopus', game: 'factor', when: ['factor:lamp'], board: 'counter',
    hook: '兩盞燈在第 0 秒同時亮。之後第 6、12、18⋯⋯秒也會一起亮。不算開始那一下，最早再一起亮是哪一秒？', hookPic: () => `<div class="eq5">${[6, 12, 18].map(v => K(v, C4)).join('、')}</div>`,
    guess: ['最早再一起亮的那一秒，是不是一定等於兩個數相乘？', ['一定是', '不一定'], 1],
    mh: '一秒一秒按，看第一次兩盞燈同時亮是第幾秒。',
    rounds: [lampRound(2, 3, 6, '看我做：紅燈每隔 2 秒、綠燈每隔 3 秒，找最早再一起亮的那一秒。'), lampRound(2, 4, 4, '一起做：紅燈每隔 2 秒、綠燈每隔 4 秒。2×4＝8，會是第 8 秒嗎？'), lampRound(2, 5, 10, '換你做：紅燈每隔 2 秒、綠燈每隔 5 秒。', ['先預測：最早再一起亮是第幾秒？', ['第 7 秒', '第 10 秒', '第 20 秒'], 1])],
    reveal: '紅燈每隔 2 秒、綠燈每隔 4 秒時，第 4 秒就再一起亮了，比 2×4＝8 早。所以不一定是兩個數相乘。', revealPic: () => lampPair(true, true),
    fade: step3(lampPair(true, true), '紅燈每隔 2 秒、綠燈每隔 4 秒：第 0 秒同時亮起後，第 4 秒最早再一起亮。', `<div class="lines5"><div>${Array.from({ length: 8 }, (_, i) => `<i class="${(i + 1) % 2 ? '' : 'r'}">${i + 1}</i>`).join('')}</div><div>${Array.from({ length: 8 }, (_, i) => `<i class="${(i + 1) % 4 ? '' : 'g'}">${i + 1}</i>`).join('')}</div></div>`, '數線上，第一個兩條都有記號的地方是 4。', `<div class="eq5" style="font-size:20px"><span class="ln5">2 數得到：2、${K(4, C4)}、6、${K(8, C4)}</span><span class="ln5">4 數得到：${K(4, C4)}、${K(8, C4)}</span><span class="ln5">兩邊都有的：4、8，最小是 ${K(4, C4)}</span></div>`, '寫成數字：兩邊都有的數裡，挑最小的。'),
    nameSay: `不算開始的第 0 秒，2 和 4 的公倍數有 4、8、12⋯⋯，最小的是 4。<br>公倍數裡最小的那一個，叫作${T('最小公倍數')}。`, namePic: `<div class="eq5">2 和 4 → ${K(4, C4)}</div>`,
    pick: [['最小公倍數一定是兩個數相乘。', '最小公倍數是公倍數裡最小的那一個。', '最小公倍數一定是 1。'], 1, ['2 和 4 的最小公倍數是 4，不是 2×4＝8。', '', '第 1 秒兩盞燈都沒亮，1 不是 2 的倍數。']],
    pose: pose('change', '紅燈每隔 2 秒、綠燈每隔 4 秒。只把綠燈改成每隔 3 秒，最早再一起亮的時間會變嗎？', ['會，從第 4 秒變成第 6 秒', '不會', '會，變成第 8 秒'], 0, ['', '2 數得到 2、4、6；3 數得到 3、6。第 4 秒綠燈沒有亮。', '第 6 秒兩盞就一起亮了，比第 8 秒早。'], '對了，改了一個數，最早一起亮就從第 4 秒變成第 6 秒。'),
    check: { q: '一個社團每 3 天聚會一次，另一個每 4 天聚會一次。今天兩個社團都聚會，最快幾天後會再一起聚會？', pic: () => '<div class="u-big">📅</div>', opts: ['7 天', '12 天', '24 天'], a: 1, hint: '回到按碼表那一步：3、6、9、12 和 4、8、12，最早一起出現的是哪個？', hints: ['3＋4＝7，第 7 天兩個社團都不聚會。', '', '第 24 天也會一起聚會，可是第 12 天更早。'], ok: '對了，你把兩邊的倍數列出來找最早相同的：3 和 4 的最小公倍數是 12。' } }),

  mk({ key: 'sum180', title: '內角和', term: '內角和', who: 'goat', game: 'poly', when: ['poly:sum', 'poly:cut', 'poly:quad'], board: 'tapSet',
    hook: '三角形有三個角，每個角都可以用量角器量出度數。', hookPic: () => tri5(TRIS[0]),
    guess: ['把三個角撕下來，頂點靠在一起拼，會拼成什麼樣子？', ['一個直角', '一個平角（一條直線）', '一整圈'], 1],
    mh: '把三個角都撕下來，看它們拼在一起時，兩邊是不是連成一條直線。',
    rounds: TRIS.map((P, i) => tset(['c0', 'c1', 'c2'], tearTri(P), s => `撕下 ${s.size} 個角`, `三個角拼成平角：${triAngles(P).join('＋')}＝180。`, ['看我做：我把三個角一個一個撕下來，拼在一起。', '一起做：換一個三角形，我先撕一個角。', '換你做：再換一個瘦長的三角形，三個角都撕下來。'][i], i === 2 ? ['先預測：這個瘦長的三角形，三個角拼起來還是平角嗎？', ['還是平角', '不會是平角'], 0] : null)),
    reveal: '換了三個不同的三角形，三個角每次都拼成平角，也就是 180 度。', revealPic: () => wedges(triAngles(TRIS[0])),
    fade: step3(tri5(TRIS[0]), '紙做的三角形，撕下三個角。', `<div class="q5">${wedges(triAngles(TRIS[0]))}</div>`, '三個角拼成平角，三種顏色是三個角。', `<div class="eq5">${triAngles(TRIS[0]).map((a, i) => `<b style="color:${['#e07b70', '#6ea8dc', '#5fae55'][i]}">${a}</b>`).join('＋')}＝${K(180, C1)}</div><div class="trail">每個數的顏色和上面的角一樣，${lit('180', C1)} 是平角的度數</div>`, '寫成算式。'),
    nameSay: `三角形三個角的度數加起來，每次都是 180 度。<br>多邊形各個內角的度數加起來，叫作${T('內角和')}。三角形的內角和是 180 度。`, namePic: `<div class="q5">${wedges(triAngles(TRIS[0]))}</div>`,
    pick: [['大的三角形，三個角加起來比較大。', '三角形的內角和都是 180 度。', '三角形的內角和是 360 度。'], 1, ['把大三角形的三個角撕下來，一樣拼成平角，還是 180 度。', '', '360 度是一整圈；三個角只拼成半圈。']],
    pose: pose('can', '一個三角形有一個角是 50 度，另外兩個角各是幾度？', ['夠，各 65 度', '不夠，只知道另外兩個角合起來 130 度，還要知道其中一個角', '夠，各 50 度'], 1, ['兩個角不一定一樣大：60 和 70 合起來也是 130。', '', '50＋50＋50＝150，不是 180。'], '對了！只能知道另外兩個合起來 130 度，要再多一個條件。'),
    check: { q: '三角旗有兩個角是 50 度和 60 度，第三個角幾度？', pic: () => `<div class="q5">${wedges([50, 60])}</div>`, opts: ['70 度', '80 度', '90 度'], a: 0, hint: '回到撕角那一步：拼成平角是 180 度，還缺多少？', hints: ['', '50＋60＋80＝190，比 180 多了 10。', '50＋60＋90＝200，比 180 多了 20。'], ok: '對了，你用 180 減去已知的兩個角：180－50－60＝70。' } }),

  mk({ key: 'regular', title: '正多邊形', term: '正多邊形', who: 'goat', game: 'poly', when: ['poly:regular'], board: 'tapSet',
    hook: '先回想正方形：四條邊一樣長，四個角都是直角。今天量量看其他四邊形。', hookPic: () => sideShape(SH_SQ, new Set(), false),
    mh: '把每一條邊都點一次，量完會同時看到四個角的度數。比較邊，也比較角。',
    rounds: [measRound(SH_RECT, '看我做：量長方形門板的每一條邊。'), measRound(SH_RHO, '一起做：量菱形路標，我先量一條。'), measRound(SH_SQ, '換你做：量正方形地磚的每一條邊。', ['先預測：正方形的邊和角，都會各自一樣嗎？', ['都一樣', '邊一樣、角不一樣'], 0])],
    fade: step3(`<div class="u-big">⬜</div>`, '一塊正方形地磚。', `${sideShape(SH_SQ, new Set(['s0', 's1', 's2', 's3']), true)}`, '畫成簡圖：邊都是 6，角都是 90 度。', `<div class="eq5">${lit('邊', C1)}：6、6、6、6　${lit('角', C2)}：90、90、90、90</div>`, '寫成數字，兩排都各自一樣。'),
    sort: { q: '哪些圖形的邊都一樣長、角也都一樣大？', items: [['圖中的正方形地磚（四邊都 6，角都 90 度）', 0], ['長方形門板（邊 6 和 11，角都 90 度）', 1], ['菱形路標（四邊一樣長，角 60 度和 120 度）', 1], ['圖中理想化的蜂巢一格（六邊一樣長，六個角一樣大）', 0], ['三邊一樣長的三角形警告牌（角都 60 度）', 0]].map(([h, c]) => ({ h, c })), bins: ['邊和角都一樣', '有不一樣'], hint: '兩個條件都要看：邊都一樣長嗎？角都一樣大嗎？', done: '地磚、蜂巢、警告牌兩個條件都符合；門板的邊不一樣，路標的角不一樣。' },
    nameSay: `每條邊都一樣長、每個內角都一樣大的多邊形，叫作${T('正多邊形')}。`,
    pick: [['只要每邊一樣長就是正多邊形。', '每條邊一樣長、每個內角也一樣大，才是正多邊形。', '長方形是正多邊形。'], 1, ['菱形路標四邊一樣長，可是角有 60 度和 120 度。', '', '不是正方形的長方形，角都一樣大，但長和寬不一樣長。']],
    pose: pose('change', '把正方形只向左右拉長，四個角仍是直角，但長和寬不相等。它還是正多邊形嗎？', ['還是', '不是了'], 1, ['四個角一樣大，可是並非每條邊都一樣長。', ''], '對了，角都一樣大還不夠，每條邊也要一樣長。'),
    check: { q: '圖中理想化的蜂巢一格，六條邊一樣長，六個角也一樣大。它是正多邊形嗎？', pic: () => `<svg class="g5" style="max-height:110px" viewBox="0 0 200 200"><polygon points="${polyStr(Array.from({ length: 6 }, (_, i) => { const t = (i * 60 - 90) * Math.PI / 180; return [100 + 85 * Math.cos(t), 100 + 85 * Math.sin(t)]; }))}" fill="#f7dc8c" stroke="#a9702a" stroke-width="4"/></svg>`, opts: ['是', '不是'], a: 0, hint: '回到量邊那一步：檢查兩件事，邊都一樣長嗎？角都一樣大嗎？', hints: ['', '題目說六條邊一樣長、六個角也一樣大，兩個條件都符合。'], ok: '對了，邊和角兩個條件都符合，它是正六邊形。' } }),

  mk({ key: 'reduce', title: '約分', term: '約分', who: 'rabbit', game: 'ext', when: ['ext:merge', 'ext:lowest'], board: 'tapSet',
    hook: '把每塊再平均分成幾小塊，紅色部分的大小不變。反過來，把小塊合併成大塊呢？', hookPic: () => wedgePie(Array.from({ length: 4 }, (_, i) => ({ f: .25, c: i < 2 ? PIE_ON : PIE_OFF }))),
    rounds: [mergeRound(4, 2, '看我做：紅色是一個披薩的 2/4，我把小塊兩塊兩塊合併。'), mergeRound(6, 2, '一起做：紅色是 2/6 個披薩，我先合併一組。'), mergeRound(8, 4, '換你做：紅色是 4/8 個披薩，兩塊兩塊點來合併。', ['先預測：每兩塊合成一塊以後，是幾分之幾？', ['1/2', '2/4', '4/4'], 1])],
    fade: step3(`<div class="vs two5">${wedgePie(Array.from({ length: 4 }, (_, i) => ({ f: .25, c: i < 2 ? PIE_ON : PIE_OFF })))}<b>→</b>${wedgePie([{ f: .5, c: PIE_ON }, { f: .5, c: PIE_OFF }])}</div>`, '真的披薩，每兩塊合成一塊。', `${barRow(4, 2, PIE_ON)}${barRow(2, 1, PIE_ON)}`, '畫成長條，紅色一樣長。', `<div class="eq5"><span class="fr5">${K(2, C1)}<i></i>${K(4, C2)}</span> ＝ <span class="fr5">${K(1, C1)}<i></i>${K(2, C2)}</span></div><div class="trail">${lit('紅：分子（紅色塊數）2→1', C1)}　${lit('藍：分母（全部塊數）4→2', C2)}　都除以 2</div>`, '寫成分數：分子和分母都除以 2。'),
    nameSay: `分子和分母同除以一個大於 1 的公因數（這裡是 2），分數的值不變。<br>這樣改寫分數，叫作${T('約分')}。不一定要兩塊兩塊合，也不一定一次就合到最大塊。`,
    pick: [['約分以後披薩變少了。', '約分是分子和分母同除以一個大於 1 的公因數，分數的值不變。', '約分只把分子變小。'], 1, ['合併以後塊數變少，可是紅色部分的大小不變。', '', '只把分子變小，紅色部分就真的變少了。']],
    pose: pose('change', '紅色是 3/6 個披薩。這次改成每 3 小塊合成一塊，會變成幾分之幾？', ['1/2', '3/3', '1/6'], 0, ['', '分母也要一起除以 3：6÷3＝2。', '分子 3÷3＝1，分母 6÷3＝2，不是 6。'], '對了，3/6 的分子和分母同除以 3，得到 1/2。不一定要兩塊兩塊合。', () => barRow(6, 3, PIE_ON)),
    check: { q: '紅色是一盒巧克力的 4/8。每兩塊合成一塊，是幾分之幾？', pic: () => barRow(8, 4, PIE_ON), opts: ['2/4', '4/4', '1/8'], a: 0, hint: '回到合併披薩那一步：分子和分母都除以 2。', hints: ['', '分母也要除以 2：8÷2＝4，分子 4÷2＝2。', '分子 4÷2 是 2；分母也要除以 2。'], ok: '對了，分子和分母都除以 2：4/8＝2/4。2/4 還可以再約分，不必一次約到最簡。' } }),

  mk({ key: 'lowest', title: '最簡分數', term: '最簡分數', who: 'rabbit', game: 'ext', when: ['ext:lowest'], board: 'tapSet',
    hook: '2/4 約分一次變成 1/2。1/2 還能再約分嗎？', hookPic: () => wedgePie([{ f: .5, c: PIE_ON }, { f: .5, c: PIE_OFF }]),
    rounds: [mergeRound(4, 2, '看我做：2/4 兩塊兩塊合，變成 1/2，就再也合不下去了。'), mergeRound(8, 4, '一起做：4/8 合一次是 2/4，我先合。'), mergeRound(6, 2, '換你做：2/6 兩塊兩塊合。', ['先預測：合完以後，還能再兩塊兩塊合嗎？', ['還能', '不能了'], 1])],
    fade: step3(`<div class="vs two5">${wedgePie(Array.from({ length: 8 }, (_, i) => ({ f: 1 / 8, c: i < 4 ? PIE_ON : PIE_OFF })))}<b>→</b>${wedgePie(Array.from({ length: 4 }, (_, i) => ({ f: .25, c: i < 2 ? PIE_ON : PIE_OFF })))}<b>→</b>${wedgePie([{ f: .5, c: PIE_ON }, { f: .5, c: PIE_OFF }])}</div>`, '4/8 → 2/4 → 1/2，一直合。', `${barRow(8, 4, PIE_ON)}${barRow(4, 2, PIE_ON)}${barRow(2, 1, PIE_ON)}`, '長條的格子一路變大，紅色一樣長。', `<div class="eq5"><span class="fr5">4<i></i>8</span>＝<span class="fr5">2<i></i>4</span>＝<span class="fr5">${K(1, C1)}<i></i>${K(2, C1)}</span></div><div class="trail">${lit('1 和 2', C1)} 的公因數只有 1，不能再約分了</div>`, '寫成分數，最後一個停住了。'),
    sort: { q: '哪些還能再約分？', items: [['1/2', 1], ['1/3', 1], ['2/4', 0], ['3/6', 0], ['2/3', 1]].map(([h, c]) => ({ h, c })), bins: ['還能再約分', '不能再約分'], hint: '分子和分母有沒有大於 1 的公因數？', done: '2/4、3/6 還能約分；1/2、1/3、2/3 的分子分母公因數只有 1。' },
    nameSay: `分子和分母的公因數只有 1，不能再約分的分數，叫作${T('最簡分數')}。`,
    pick: [['最簡分數就是很小的分數。', '分子和分母的公因數只有 1 的分數，是最簡分數。', '2/4 是最簡分數。'], 1, ['大小不是重點：2/3 比 1/4 大，兩個都不能再約分。', '', '2 和 4 有公因數 2，還能約分成 1/2。']],
    pose: pose('can', '小明說：「我寫的分數是最簡分數。」他寫的是幾分之幾？', ['夠，是 1/2', '不夠，最簡分數有很多個，還需要更多資料', '夠，是 2/4'], 1, ['1/3、2/3、3/4 也都是最簡分數。', '', '2/4 還能約分，不是最簡分數。'], '對了！只知道「最簡」，不知道是哪一個。'),
    check: { q: '3/6 盤蛋糕，約分到最簡分數，是幾分之幾？', pic: () => barRow(6, 3, PIE_ON), opts: ['1/2', '3/6', '1/3'], a: 0, hint: '回到一直合的那一步：3 和 6 有沒有大於 1 的公因數？', hints: ['', '3 和 6 有公因數 3，還可以約分。', '分子 3÷3＝1，分母 6÷3 是 2，不是 3。'], ok: '對了，3 和 6 同除以 3：3/6＝1/2，1 和 2 的公因數只有 1。' } }),

  mk({ key: 'common', title: '通分', term: '通分', who: 'rabbit', game: 'ext', when: ['ext:common', 'ext:cmp', 'uadd:add', 'uadd:sub', 'uadd:mixed', 'uadd:borrow', 'uadd:enough'], board: 'two',
    hook: '兩個一樣大的披薩，都平均分成 4 塊。比紅色和橘色的塊數，就知道誰多。', hookPic: () => `<div class="vs two5">${wedgePie(Array.from({ length: 4 }, (_, i) => ({ f: .25, c: i < 1 ? PIE_ON : PIE_OFF })))}${wedgePie(Array.from({ length: 4 }, (_, i) => ({ f: .25, c: i < 3 ? '#f0a03c' : PIE_OFF })))}</div>`,
    guess: ['兩個一樣大的披薩，一個紅色是 1/2、一個橘色是 1/3。塊的大小不一樣，能直接比塊數嗎？', ['能', '不能'], 1],
    mh: '先比較兩個披薩的一塊誰比較大。塊比較大的那一個，先把每塊再分細。',
    rounds: [{ p: { n: 2, m: 4, b: 1, res: '1/2 改寫成 2/4，和 1/4 的塊一樣大了：2 塊比 1 塊多。' }, say: '看我做：兩個一樣大的披薩，1/2 和 1/4。我把 1/2 那個的每塊再平均分成 2 塊。' }, { p: { n: 2, m: 3, b: 1, res: '都分成 6 塊：3/6 和 2/6，3 塊比 2 塊多。' }, say: '一起做：1/2 和 1/3。我先分一個，你接著分。' }, { p: { n: 3, m: 6, b: 1, res: '1/3 改寫成 2/6，和 1/6 的塊一樣大。' }, say: '換你做：1/3 和 1/6。點披薩，讓它的每塊再分細。', predict: ['先預測：要把哪一個披薩分細？', ['1/3 那個', '1/6 那個'], 0] }],
    reveal: '塊不一樣大，比塊數沒有意義；先分成一樣大的塊，再比。', revealPic: () => `<div class="vs two5">${wedgePie(Array.from({ length: 6 }, (_, i) => ({ f: 1 / 6, c: i < 3 ? PIE_ON : PIE_OFF })))}${wedgePie(Array.from({ length: 6 }, (_, i) => ({ f: 1 / 6, c: i < 2 ? '#f0a03c' : PIE_OFF })))}</div>`,
    fade: step3(`<div class="vs two5">${wedgePie(Array.from({ length: 6 }, (_, i) => ({ f: 1 / 6, c: i < 3 ? PIE_ON : PIE_OFF })))}${wedgePie(Array.from({ length: 6 }, (_, i) => ({ f: 1 / 6, c: i < 2 ? '#f0a03c' : PIE_OFF })))}</div>`, '兩個一樣大的披薩，都平均分成 6 塊。', `${barRow(6, 3, PIE_ON)}${barRow(6, 2, '#f0a03c')}`, '畫成兩條一樣長、格子一樣大的長條。', `<div class="eq5"><span class="fr5">1<i></i>2</span>＝<span class="fr5">${K(3, C1)}<i></i>${K(6, C2)}</span>　<span class="fr5">1<i></i>3</span>＝<span class="fr5">${K(2, C4)}<i></i>${K(6, C2)}</span></div><div class="trail">${lit('藍 6', C2)}：兩條都分成 6 格　${lit('紅 3', C1)}、${lit('橘 2', C4)}：各塗幾格</div>`, '寫成分數，分母一樣了。'),
    nameSay: `用擴分把 1/2 改寫成 3/6、1/3 改寫成 2/6，分母相同，各自的值不變。<br>像這樣用擴分或約分，把幾個分數改成同分母，叫作${T('通分')}。`,
    pick: [['通分是把分子變一樣。', '通分是把幾個分數改寫成分母相同、各自的值不變的分數。', '通分會讓披薩變多。'], 1, ['要一樣的是塊的大小，也就是分母。', '', '分得更細只是塊數變多，紅色部分大小不變。']],
    pose: pose('story', '哪一個問題要先通分才好算？', ['1/2 杯果汁加 1/3 杯，共幾杯？', '1/4 杯加 2/4 杯，共幾杯？', '3 杯果汁加 2 杯。'], 0, ['', '1/4 和 2/4 的分母已經一樣了。', '3 杯和 2 杯是整數，直接加。'], '對了！1/2 和 1/3 塊不一樣大，要先改成一樣大的塊。'),
    check: { q: '一杯 1/2 公升、一杯 1/4 公升，想用一樣大的格子比較。兩杯都分得剛好、而且格數最少，要都分成幾格？', pic: () => `<div class="vs two5">${vesselSvg(['', '', 'cup'], 2, 1)}${vesselSvg(['', '', 'cup'], 4, 1)}</div>`, opts: ['2 格', '4 格', '6 格'], a: 1, hint: '回到分披薩那一步：1/2 的每格再分成 2 格，會是幾格？', hints: ['分成 2 格，1/4 公升那杯就分不剛好。', '', '分成 6 格時，1/4 不是整數格。'], ok: '對了，1/2＝2/4，兩杯都用四分之一公升的格子。分成 8 格也能通分，只是 4 格最少。' } }),
);
/* ---------- 鷹架版段落（二）：對稱、平均數、分配律、底和高、平行四邊形與三角形面積、長方體（依 2026-11-02 外部審查修訂） ---------- */
// 幾何小工具：垂足、對直線翻摺、直角記號
const ft = (P, A, B) => { const dx = B[0] - A[0], dy = B[1] - A[1], t = ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / (dx * dx + dy * dy); return { x: A[0] + t * dx, y: A[1] + t * dy, t }; };
const refl = (p, A, B) => { const F = ft(p, A, B); return [2 * F.x - p[0], 2 * F.y - p[1]]; };
const ln5 = (a, b, st) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" ${st}/>`;
const unit5 = (a, b) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; };
const rmark = (F, A, B, V) => { const u = unit5(A, B), n = unit5(F, V), k = 11, p = [[F[0] + k * u[0], F[1] + k * u[1]], [F[0] + k * u[0] + k * n[0], F[1] + k * u[1] + k * n[1]], [F[0] + k * n[0], F[1] + k * n[1]]]; return `<polyline points="${p.map(q => q.join(',')).join(' ')}" fill="none" stroke="#33405a" stroke-width="2"/>`; };
const rot5 = (pts, deg, c) => pts.map(p => { const a = deg * Math.PI / 180, x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)]; });
// 圖：o.base 紅色的底；o.perp [頂點, 邊] 藍色垂直虛線；o.edges 每條邊都能點；o.cands 可點的候選線 [id, 起點, 終點]
function bhSvg(P, o) {
  const E = i => [P[i], P[(i + 1) % P.length]], sel = o.sel || new Set();
  let s = `<svg class="g5" style="max-height:185px" viewBox="0 0 320 215"><polygon points="${polyStr(P)}" fill="#cfe6c6" stroke="#4a8a3e" stroke-width="2"/>`;
  if (o.perp) { const [vi, ei] = o.perp, [A, B] = E(ei), F = ft(P[vi], A, B); if (F.t < 0 || F.t > 1) s += ln5(F.t < 0 ? A : B, [F.x, F.y], 'stroke="#4a8a3e" stroke-width="2" stroke-dasharray="2 4"'); s += ln5(P[vi], [F.x, F.y], `stroke="${C2}" stroke-width="4" stroke-dasharray="7 5"`); if (o.mark) s += rmark([F.x, F.y], A, B, P[vi]); }
  if (o.ext) { const [A, B] = E(o.ext[0]), F = ft(P[o.ext[1]], A, B); if (F.t < 0 || F.t > 1) s += ln5(F.t < 0 ? A : B, [F.x, F.y], 'stroke="#4a8a3e" stroke-width="2" stroke-dasharray="2 4"'); }
  if (o.base !== undefined) s += ln5(...E(o.base), `stroke="${C1}" stroke-width="7"`);
  if (o.edges) P.forEach((p, i) => { const on = sel.has('e' + i); s += ln5(...E(i), `stroke="${on ? C1 : 'transparent'}" stroke-width="7"`) + ln5(...E(i), `stroke="transparent" stroke-width="24" data-t="e${i}" class="tap5"`); });
  (o.cands || []).forEach(([id, a, b]) => { const on = sel.has(id); s += ln5(a, b, `stroke="${on ? C2 : '#7a8699'}" stroke-width="${on ? 5 : 3}" stroke-dasharray="7 5"`) + ln5(a, b, `stroke="transparent" stroke-width="20" data-t="${id}" class="tap5"`); });
  (o.marks || []).forEach(([F, A, B, V]) => { s += rmark(F, A, B, V); });
  (o.labels || []).forEach(([t, x, y, c]) => { s += `<text x="${x}" y="${y}" text-anchor="middle" class="ax" style="fill:${c || '#33405a'}">${t}</text>`; });
  return s + '</svg>';
}
// 平行四邊形：底 7、高 4、偏 2（每格 20）；PGR 是同一塊轉了方向
const PG0 = [[70, 160], [210, 160], [250, 80], [110, 80]], PGR = rot5(PG0, -20, [160, 120]);
const TRI1 = [[50, 165], [255, 125], [150, 35]], TRI2 = [[40, 175], [150, 175], [285, 65]];
const footOf = (P, vi, ei) => { const F = ft(P[vi], P[ei], P[(ei + 1) % P.length]); return [F.x, F.y]; };
const atT = (P, ei, t) => { const A = P[ei], B = P[(ei + 1) % P.length]; return [A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])]; };
const baseRound = (P, ei, vi, say, predict) => tset(['e' + ei], s => bhSvg(P, { perp: [vi, ei], edges: true, sel: s, mark: s.has('e' + ei) }), s => s.size ? '這條邊和藍色虛線互相垂直' : '點一條邊', '找到了：這條邊和藍色虛線互相垂直，藍色虛線就是頂點到這條邊的垂直距離。', say, predict, Object.fromEntries(P.map((_, i) => i).filter(i => i !== ei).map(i => ['e' + i, '這條邊和藍色虛線沒有垂直。找和它成直角的那條邊（或那條邊的延長線）。'])), '用三角板的直角對對看：哪一條邊（或它的延長線）和藍色虛線成直角？');
const hRound = (P, ei, vi, cands, say, predict) => tset(['h'], s => bhSvg(P, { base: ei, cands, sel: s, ext: [ei, vi], marks: s.has('h') ? [[footOf(P, vi, ei), P[ei], P[(ei + 1) % P.length], P[vi]]] : [] }), s => s.size ? '這一條和紅色的底垂直' : '點一條虛線', '對了：這條虛線和紅色的底互相垂直，它的長度就是頂點到底的距離。', say, predict, { s: '這一條是斜邊，和紅色的底沒有垂直。', o: '這一條斜斜的，和紅色的底沒有成直角。' }, '要找和紅色的底成直角的那一條。三條裡最短的那一條，就是垂直的。');
// 摺紙
const foldShape = (pts, c) => s => { const g = pts.map(p => [2 * c - p[0], p[1]]); return `<svg class="g5" style="max-height:180px" viewBox="0 0 220 200"><polygon points="${polyStr(pts)}" fill="#a9d0f0" stroke="#2f5f9e" stroke-width="2" data-t="f" class="tap5"/>${s.has('f') ? `<polygon points="${polyStr(g)}" fill="#f4a9a0" fill-opacity=".5" stroke="#d6476b" stroke-dasharray="5 4"/><line x1="${c}" x2="${c}" y1="5" y2="195" stroke="#d6476b" stroke-width="3"/>` : ''}</svg>`; };
const HEART = [[110, 180], [40, 110], [40, 60], [70, 35], [110, 60], [150, 35], [180, 60], [180, 110]], RECT2 = [[40, 60], [180, 60], [180, 150], [40, 150]], PARA2 = [[70, 60], [190, 60], [150, 150], [30, 150]];
const foldRound = (pts, c, yes, say, predict) => tset(['f'], foldShape(pts, c), s => s.size ? (yes ? '兩側完全重合！' : '對不齊，有地方露出來') : '點圖形，沿中間的直線摺', yes ? '沿這條直線摺，兩側完全重合。' : '沿這條直線摺，兩側沒有完全重合。', say, predict, null, '點圖形一下，它就會沿中間摺過去。看看粉紅色的虛線框和藍色的圖形有沒有對齊。');
const PARA_LINES = [['v', [110, 5], [110, 195]], ['h', [10, 105], [210, 105]], ['d1', [70, 60], [150, 150]], ['d2', [190, 60], [30, 150]]];
const foldTry = (pts, lines) => s => { const last = [...s].pop(), L = lines.find(l => l[0] === last); let h = `<svg class="g5" style="max-height:190px" viewBox="0 0 220 210"><polygon points="${polyStr(pts)}" fill="#a9d0f0" stroke="#2f5f9e" stroke-width="2"/>`; if (L) h += `<polygon points="${polyStr(pts.map(p => refl(p, L[1], L[2])))}" fill="#f4a9a0" fill-opacity=".45" stroke="#d6476b" stroke-dasharray="5 4"/>`; lines.forEach(l => { const on = s.has(l[0]); h += ln5(l[1], l[2], `stroke="${on ? '#d6476b' : '#33405a'}" stroke-width="${on ? 3 : 2}" stroke-dasharray="6 5"`) + ln5(l[1], l[2], `stroke="transparent" stroke-width="18" data-t="${l[0]}" class="tap5"`); }); return h + '</svg>'; };
const lineShape = (pts, lines) => s => `<svg class="g5" style="max-height:190px" viewBox="0 0 220 210"><polygon points="${polyStr(pts)}" fill="#a9d0f0" stroke="#2f5f9e" stroke-width="2"/>${lines.map(L => `<line x1="${L[1][0]}" y1="${L[1][1]}" x2="${L[2][0]}" y2="${L[2][1]}" stroke="${s.has(L[0]) ? '#d6476b' : '#33405a'}" stroke-width="${s.has(L[0]) ? 4 : 2}" stroke-dasharray="${s.has(L[0]) ? '' : '6 5'}"/><line x1="${L[1][0]}" y1="${L[1][1]}" x2="${L[2][0]}" y2="${L[2][1]}" stroke="transparent" stroke-width="18" data-t="${L[0]}" class="tap5"/>`).join('')}</svg>`;
const ptGrid = (P, cand) => s => gridBg(`<polygon points="${polyStr(fullShape([[0, -3], [3, -1], [2, -1], [2, 3], [0, 3]], 'v').map(gp))}" fill="#fff0cf" stroke="#7a5b2e" stroke-width="2"/><line x1="${gp([0, -4])[0]}" y1="${gp([0, -4])[1]}" x2="${gp([0, 4])[0]}" y2="${gp([0, 4])[1]}" stroke="#d6476b" stroke-width="3"/><circle cx="${gp(P)[0]}" cy="${gp(P)[1]}" r="9" fill="#d6476b"/>${cand.map(c => `<circle cx="${gp(c)[0]}" cy="${gp(c)[1]}" r="11" data-t="${c.join('_')}" class="tap5" fill="${s.has(c.join('_')) ? '#3fae5a' : '#ffd65a'}" stroke="#33405a"/>`).join('')}`);
const ptRound = (P, cand, say, predict) => tset([[-P[0], P[1]].join('_')], ptGrid(P, cand), s => s.size ? '摺過去重合了！' : `紅點離摺痕 ${Math.abs(P[0])} 格`, `兩點離摺痕都是 ${Math.abs(P[0])} 格，兩點的連線和摺痕垂直。`, say, predict, Object.fromEntries(cand.map(c => [c.join('_'), c[1] !== P[1] ? '摺過去，兩點的連線會和摺痕垂直；這個點偏上或偏下了。' : '數一數：兩點離摺痕要一樣遠。'])), '摺過去的點，和紅點離摺痕一樣遠，而且兩點的連線和摺痕垂直。先數紅點離摺痕幾格。');
const diagPts = () => { const a = gp([2, -1]), b = gp([-1, 2]); return gridBg(`<line x1="${gp([-4, -4])[0]}" y1="${gp([-4, -4])[1]}" x2="${gp([4, 4])[0]}" y2="${gp([4, 4])[1]}" stroke="#d6476b" stroke-width="3"/>${ln5(a, b, 'stroke="#2f5f9e" stroke-width="2" stroke-dasharray="5 4"')}<circle cx="${a[0]}" cy="${a[1]}" r="9" fill="#d6476b"/><circle cx="${b[0]}" cy="${b[1]}" r="9" fill="#3fae5a"/>`); };
// 平均數：一樣粗的水塔
// 分配律：每份一個飯糰和一瓶水
const trays = (n, a, b, e1, e2) => s => `<div class="tray5">${Array.from({ length: n }, (_, i) => `<div class="trow"><span class="em5">${e1 || '🍙'}</span><small>${a} 元</small>${s.has('w' + i) ? '' : `<span class="tap5w" data-t="w${i}"><span class="em5">${e2 || '💧'}</span><small>${b} 元</small></span>`}</div>`).join('')}</div><div class="trow g2">${s.size ? `<span class="em5">${(e2 || '💧').repeat(s.size)}</span><small>${b}×${s.size}</small>` : '<small>移出來的放這裡</small>'}</div>`;
const trayRound = (n, a, b, say, predict) => tset(Array.from({ length: n }, (_, i) => 'w' + i), trays(n, a, b), s => `飯糰 ${a}×${n}，水 ${b}×${s.size}`, `先算一份再乘份數：(${a}＋${b})×${n}＝${(a + b) * n}；分開算：${a}×${n}＋${b}×${n}＝${a * n + b * n}，一樣多。`, say, predict, null, '每一份都有一瓶水。把每一瓶水都移到下面，看看水一共有幾瓶。');
// 面積：平行四邊形沿高剪開移過去；兩個一樣的三角形拼成平行四邊形
const U5 = 20;
function pgCut(b, h, off, k) {
  const x0 = 30, yb = 20 + h * U5, yt = 20, A = [x0, yb], B = [x0 + b * U5, yb], C = [x0 + (b + off) * U5, yt], D = [x0 + off * U5, yt], F = [D[0], yb], dx = k >= 3 ? b * U5 : k === 2 ? b * U5 / 2 : 0;
  const tri = [A, F, D].map(p => [p[0] + dx, p[1]]);
  let s = `<svg class="g5" style="max-height:170px" viewBox="0 0 ${x0 * 2 + (b + off) * U5} ${yb + 40}"><polygon points="${polyStr([F, B, C, D])}" fill="#cfe6c6" stroke="#4a8a3e" stroke-width="2"/><polygon points="${polyStr(tri)}" fill="${k >= 1 ? '#f4a9a0' : '#cfe6c6'}" stroke="${k >= 1 ? '#d6476b' : '#4a8a3e'}" stroke-width="2"/>`;
  s += ln5(D, F, `stroke="${k >= 1 ? '#d6476b' : C2}" stroke-width="${k >= 1 ? 3 : 2.5}" stroke-dasharray="${k >= 1 ? '' : '6 4'}"`);
  s += `<text x="${(A[0] + B[0]) / 2 + (k >= 3 ? off * U5 : 0)}" y="${yb + 22}" text-anchor="middle" class="ax" style="fill:${C1}">${k >= 3 ? '長' : '底'} ${b}</text><text x="${D[0] + 5}" y="${(yt + yb) / 2 + 5}" class="ax" style="fill:${C2}">${k >= 3 ? '寬' : '高'} ${h}</text>`;
  return s + '</svg>';
}
const pgRound = (b, h, off, say, predict) => cnt(3, k => `<div class="tap5w" data-t="x" style="display:block">${pgCut(b, h, off, k)}</div>`, k => ['平行四邊形：底 ' + b + '、高 ' + h, '沿高剪開，剪下左邊的三角形', '把三角形往右移', '拼成長方形了'][k], `拼成長 ${b}、寬 ${h} 的長方形，面積 ${b}×${h}＝${b * h} 平方公分。`, say, predict, '每點一下做一件事：沿高剪開、把三角形移過去、拼好。看看拼出來的長方形，長和寬是原來的哪兩段。');
function triPair(b, h, c, k) {
  const x0 = 30, yb = 20 + h * U5, yt = 20, A = [x0, yb], B = [x0 + b * U5, yb], C = [x0 + c * U5, yt], A2 = [B[0] + C[0] - A[0], yt];
  let s = `<svg class="g5" style="max-height:160px" viewBox="0 0 ${x0 * 2 + (b + c) * U5} ${yb + 40}">`;
  if (k >= 1) s += `<polygon points="${polyStr([B, A2, C])}" fill="${k >= 2 ? '#a9d0f0' : 'none'}" stroke="#2f5f9e" stroke-width="2" stroke-dasharray="${k >= 2 ? '' : '6 4'}"/>`;
  s += `<polygon points="${polyStr([A, B, C])}" fill="#f7dc8c" stroke="#a9702a" stroke-width="2"/>${ln5(C, [C[0], yb], `stroke="${C2}" stroke-width="2.5" stroke-dasharray="6 4"`)}<text x="${(A[0] + B[0]) / 2}" y="${yb + 22}" text-anchor="middle" class="ax" style="fill:${C1}">底 ${b}</text><text x="${C[0] + 5}" y="${(yt + yb) / 2 + 5}" class="ax" style="fill:${C2}">高 ${h}</text>`;
  return s + '</svg>';
}
const triRound = (b, h, c, say, predict) => cnt(2, k => `<div class="tap5w" data-t="x" style="display:block">${triPair(b, h, c, k)}</div>`, k => ['一個三角形：底 ' + b + '、高 ' + h, '拿一個一模一樣的三角形，轉半圈', '拼成平行四邊形了'][k], `兩個一樣的三角形拼成底 ${b}、高 ${h} 的平行四邊形，面積 ${b}×${h}＝${b * h}；一個三角形是一半：${b * h / 2} 平方公分。`, say, predict, '點一下拿出一樣的三角形，再點一下把它轉半圈靠上去。看看拼出來的是什麼形狀。');
// 表面積：長 6、寬 3、高 4 的盒子（每公分 15 像素），每一面標上面積
const BOXF = (() => { const W = 90, D = 45, H = 60, y0 = 4; return [[D, y0 + D, W, H, 1, 24, '前'], [D, y0 + D + H + D, W, H, 1, 24, '後'], [D, y0, W, D, 0, 18, '蓋'], [D, y0 + D + H, W, D, 0, 18, '底'], [0, y0 + D, D, H, 2, 12, '左'], [D + W, y0 + D, D, H, 2, 12, '右']]; })();
const boxNet = (s, open) => { const C = ['#f4a9a0', '#a9d0f0', '#b7e0a8']; return `<svg class="g5" style="max-height:230px" viewBox="0 0 ${2 * 45 + 90 + 8} ${2 * 45 + 2 * 60 + 12}">${BOXF.map((r, j) => { const lid = open && j === 2, on = s === true || (s && s.has && s.has('f' + j)); return `<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" ${lid ? '' : `data-t="f${j}" class="tap5"`} fill="${lid ? '#fff' : on ? C[r[4]] : '#f4f6fa'}" stroke="#33405a" stroke-width="1.5" ${lid ? 'stroke-dasharray="4 3"' : ''}/><text x="${r[0] + r[2] / 2}" y="${r[1] + r[3] / 2 + 5}" text-anchor="middle" class="ax" style="pointer-events:none">${lid ? '沒有蓋' : on ? r[5] : r[6]}</text>`; }).join('')}</svg>`; };
const surfRound = (open, say, predict) => tset(['f0', 'f1', 'f3', 'f4', 'f5'].concat(open ? [] : ['f2']), s => boxNet(s, open), s => `塗了 ${s.size} 面`, open ? '沒有蓋子，只塗 5 面：24＋24＋18＋12＋12＝90 平方公分。' : '六個面都塗到了：24＋24＋18＋18＋12＋12＝108 平方公分。', say, predict, null, '包裝紙要蓋住盒子外面的每一面。一面一面點，點到的會顯示這一面的面積。');

SEGS.push(
  mk({ key: 'symfig', title: '線對稱圖形', term: '線對稱圖形', who: 'crab', game: 'sym', when: ['sym:axis', 'sym:count'], board: 'tapSet',
    hook: '把一張長方形紙沿中間對摺，兩半剛好疊在一起。今天摺不同的形狀。', hookPic: () => '<div class="u-big">📄</div>',
    rounds: [foldRound(HEART, 110, true, '看我做：愛心貼紙，我沿中間的直線摺。'), foldRound(RECT2, 110, true, '一起做：長方形門板，點它摺摺看。'), tset(PARA_LINES.map(l => l[0]), foldTry(PARA2, PARA_LINES), s => s.size ? `試了 ${s.size} 條摺線：這一條摺過去，兩側沒有完全重合` : '點一條虛線，沿它摺摺看', '直的、橫的、兩條斜的都試過，沒有一條能讓兩側完全重合。', '換你做：停車格的形狀（平行四邊形）。一條一條虛線都摺摺看。', ['先預測：這個形狀找得到一條摺線，讓兩側完全重合嗎？', ['找得到', '找不到'], 1], null, '每一條虛線都要試。粉紅色虛線框是摺過去的樣子，看它和藍色的圖形有沒有對齊。')],
    fade: step3(foldShape(HEART, 110)(new Set(['f'])), '愛心貼紙沿中間摺，兩側完全重合。', lineShape(HEART, [['v', [110, 5], [110, 195]]])(new Set(['v'])), '畫成簡圖：紅線是那條摺線。', `<div class="eq5" style="font-size:20px"><span class="ln5">沿紅線對摺：${lit('左半邊', C2)} ↔ ${lit('右半邊', C1)}</span><span class="ln5">完全重合</span></div>`, '說成一句話。'),
    sort: { q: '哪些圖形找得到一條摺線，讓兩側完全重合？', items: [['愛心', 0], ['蝴蝶圖案', 0], ['長方形門板', 0], ['停車格（平行四邊形）', 1], ['三邊都不一樣長的三角形', 1]].map(([h, c]) => ({ h, c })), bins: ['找得到', '找不到'], hint: '想像換不同的摺線摺摺看：直的、橫的、斜的。', done: '愛心、蝴蝶、門板找得到；停車格、三邊都不一樣長的三角形找不到。' },
    nameSay: `沿著某一條直線對摺，兩側能完全重合的圖形，叫作${T('線對稱圖形')}。`,
    pick: [['所有圖形都是線對稱圖形。', '能沿某一條直線對摺、兩側完全重合的，才是線對稱圖形。', '停車格的形狀是線對稱圖形。'], 1, ['停車格的形狀換了四條摺線，都對不齊。', '', '直的、橫的、斜的摺線都試過，兩側都沒有完全重合。']],
    pose: pose('pic', '哪一個問題配這張圖？', ['這個蝴蝶圖案能沿一條直線對摺，兩側完全重合嗎？', '這隻蝴蝶有幾隻腳？', '蝴蝶飛多快？'], 0, ['', '圖上要看的是形狀能不能摺到重合，不是數腳。', '圖上看不出速度。'], '對了！問的是能不能完全重合。', () => '<div class="u-big">🦋</div>'),
    check: { q: '蝴蝶圖案沿中間那條直線對摺，兩側完全重合。它是線對稱圖形嗎？', pic: () => '<div class="u-big">🦋</div>', opts: ['是', '不是'], a: 0, hint: '回到摺紙那一步：只要找得到一條直線能摺到完全重合就是。', hints: ['', '題目說沿中間那條直線摺，兩側完全重合，已經找到一條了。'], ok: '對了，找得到一條摺線讓兩側完全重合，就是線對稱圖形。' } }),

  mk({ key: 'symaxis', title: '對稱軸', term: '對稱軸', who: 'crab', game: 'sym', when: ['sym:axis', 'sym:count'], board: 'tapSet',
    hook: '對摺後再打開，紙上會留下一條摺痕。', hookPic: () => foldShape(HEART, 110)(new Set(['f'])),
    mh: '沿一條虛線摺，兩側要完全重合才算。直的、橫的、斜的都想一想。',
    rounds: [tset(['v'], lineShape(HEART, [['v', [110, 5], [110, 195]], ['h', [20, 110], [200, 110]]]), s => `找到 ${s.size} 條`, '愛心只有直的這一條能摺到完全重合。', '看我做：愛心可以沿哪一條虛線摺到完全重合？', null, { h: '橫著摺，上下兩半形狀不一樣。' }), tset(['v', 'h'], lineShape(RECT2, [['v', [110, 40], [110, 170]], ['h', [20, 105], [200, 105]], ['d', [40, 60], [180, 150]]]), s => `找到 ${s.size} 條`, '長方形門板有直的、橫的兩條。', '一起做：長方形門板（不是正方形）有好幾條虛線，我先找一條。', null, { d: '斜著摺，角對不起來。' }), tset(['v', 'h', 'd1', 'd2'], lineShape(SH_SQ.map(p => [p[0] - 50, p[1]]), [['v', [110, 20], [110, 180]], ['h', [30, 100], [190, 100]], ['d1', [50, 40], [170, 160]], ['d2', [170, 40], [50, 160]]]), s => `找到 ${s.size} 條`, '正方形地磚有 4 條：直的、橫的，還有兩條斜的。', '換你做：正方形地磚有幾條能摺到完全重合的線？點出全部。', ['先預測：正方形地磚有幾條？', ['2 條', '4 條'], 1])],
    fade: step3(foldShape(RECT2, 110)(new Set(['f'])), '門板沿直的線摺，兩側完全重合。', lineShape(RECT2, [['v', [110, 40], [110, 170]], ['h', [20, 105], [200, 105]]])(new Set(['v', 'h'])), '簡圖：兩條紅線都能摺到完全重合。', `<div class="eq5" style="font-size:20px"><span class="ln5">門板（不是正方形的長方形）</span><span class="ln5">直的 ${K(1, C1)} 條＋橫的 ${K(1, C1)} 條＝${K(2, C1)} 條</span></div>`, '數一數有幾條。'),
    nameSay: `能讓圖形對摺後兩側完全重合的那條直線，叫作${T('對稱軸')}。它可以是直的、橫的，也可以是斜的。`,
    pick: [['每個圖形都只有一條對稱軸。', '對稱軸是能讓圖形對摺後完全重合的那條直線。', '斜著摺長方形門板，那條摺線也是對稱軸。'], 1, ['正方形地磚有 4 條。', '', '不是正方形的長方形斜著摺，角對不起來。']],
    pose: pose('can', '一面旗子有幾條對稱軸？', ['夠，2 條', '不夠，還要看到旗子的形狀；也要說清楚只看外框，還是連圖案一起看', '夠，1 條'], 1, ['長方形外框有 2 條，可是旗子上的圖案可能讓它變少。', '', '有些旗子連圖案一起看是 1 條，有些是 0 條，要看到才知道。'], '對了！只看長方形外框有 2 條；連圖案一起看，條數可能不一樣。'),
    check: { q: '長方形門板（不是正方形）有幾條對稱軸？', pic: () => lineShape(RECT2, [])(new Set()), opts: ['1 條', '2 條', '4 條'], a: 1, hint: '回到找摺痕那一步：直的、橫的、斜的各試一次。', hints: ['直的那條對了，橫的那條也試試看。', '', '4 條是正方形；這個門板斜著摺對不齊。'], ok: '對了，你檢查了直、橫、斜三種：直的和橫的兩條能摺到完全重合。' } }),

  mk({ key: 'sympt', title: '對稱點', term: '對稱點', who: 'crab', game: 'sym', when: ['sym:point', 'sym:half', 'sym:prop'], board: 'tapSet',
    hook: '沿摺痕對摺，左邊的一個點，會碰到右邊的某個點。', hookPic: () => ptGrid([2, 1], [])(new Set()),
    rounds: [ptRound([2, 1], [[-1, 1], [-2, 1], [-2, 2]], '看我做：紅點離摺痕 2 格，摺過去碰到哪？'), ptRound([3, -1], [[-3, -1], [-2, -1], [-3, 0]], '一起做：紅點離摺痕 3 格。'), ptRound([1, 2], [[-1, 2], [-2, 2], [-1, 1]], '換你做：紅點離摺痕 1 格。', ['先預測：碰到的點離摺痕幾格？', ['1 格', '2 格'], 0])],
    fade: step3(ptGrid([2, 1], [[-2, 1]])(new Set(['-2_1'])), '紅點和綠點摺起來碰在一起。', gridBg(`${ln5(gp([0, -4]), gp([0, 4]), 'stroke="#d6476b" stroke-width="3"')}${ln5(gp([-2, 1]), gp([2, 1]), 'stroke="#2f5f9e" stroke-width="2" stroke-dasharray="5 4"')}<circle cx="${gp([2, 1])[0]}" cy="${gp([2, 1])[1]}" r="9" fill="#d6476b"/><circle cx="${gp([-2, 1])[0]}" cy="${gp([-2, 1])[1]}" r="9" fill="#3fae5a"/>${rmark(gp([0, 1]), gp([0, -4]), gp([0, 4]), gp([2, 1]))}<text x="${gp([1, 1])[0]}" y="${gp([1, 1])[1] - 8}" text-anchor="middle" class="ax">2 格</text><text x="${gp([-1, 1])[0]}" y="${gp([-1, 1])[1] - 8}" text-anchor="middle" class="ax">2 格</text>`), '簡圖：只留摺痕和兩個點。連線和摺痕垂直。', `<div class="eq5">紅點離摺痕 ${K(2, C1)} 格　綠點離摺痕 ${K(2, C3)} 格</div>`, '寫成數字，一樣遠。'),
    nameSay: `沿對稱軸對摺後會重合的兩個點，互為${T('對稱點')}。它們到對稱軸的距離相同，兩點的連線和對稱軸垂直。`,
    pick: [['對稱點離摺痕的距離不一樣。', '沿對稱軸對摺後會重合的兩個點，是對稱點。', '任何兩個點都是對稱點。'], 1, ['摺過去會重合，兩點離摺痕一定一樣遠。', '', '要摺過去會碰在一起才算；隨便兩點通常碰不到。']],
    pose: pose('change', '把摺痕換成斜的。紅點的對稱點，還是「離摺痕一樣遠、連線和摺痕垂直」嗎？', ['是', '不是，對稱點一定要一樣高'], 0, ['', '「一樣高」只在摺痕是直的時候成立；斜的摺痕，兩點就不一樣高了。'], '對了，摺痕是斜的也一樣：兩點到摺痕一樣遠，連線和摺痕垂直。', diagPts),
    check: { q: '窗花上一個點離對稱軸 3 格，它的對稱點離對稱軸幾格？', pic: () => ptGrid([3, 0], [])(new Set()), opts: ['2 格', '3 格', '6 格'], a: 1, hint: '回到找點那一步：兩點離摺痕要一樣遠。', hints: ['兩邊要一樣遠，紅點是 3 格。', '', '6 格是兩個點之間的距離；題目問的是到對稱軸的距離。'], ok: '對了，對稱點到對稱軸的距離和原來的點一樣，都是 3 格。' } }),

  mk({ key: 'avg', title: '平均數', term: '平均數', who: 'raccoon', game: 'mix', when: ['mix:avg'], board: 'tanks',
    hook: '兩個一樣粗（底面一樣大）的水塔，一個有 4 格水、一個有 2 格水。想讓兩個一樣高，可以從高的倒給低的。', hookPic: () => tanks3([4, 2]),
    mh: '水的總量不會變。每次從最高的水塔倒一格，給最低的水塔。',
    rounds: [{ p: { L: [4, 2], res: '水位一樣高了，每個 3 格。總共還是 6 格。' }, say: '看我做：兩個水塔 4 格和 2 格，從高的倒一格給低的。' }, { p: { L: [5, 1, 3], res: '水位一樣高了，每個 3 格。總共還是 9 格。' }, say: '一起做：三個一樣粗的水塔，5、1、3 格。我先倒，你接著倒。' }, { p: { L: [2, 6, 4], res: '水位一樣高了，每個 4 格。總共還是 12 格。' }, say: '換你做：2、6、4 格，點最高的水塔倒一格。', predict: ['先預測：倒到一樣高時，每個幾格？', ['3 格', '4 格', '6 格'], 1] }],
    fade: step3(tanks3([5, 1, 3]), '一樣粗的水塔，水位高高低低。', `${tanks3([3, 3, 3])}`, '倒到一樣高後，每個 3 格，總量不變。', `<div class="eq5">（${K(5, C1)}＋${K(1, C1)}＋${K(3, C1)}）÷${K(3, C2)}＝${K(3, C3)}</div><div class="trail">${lit('紅：原來每個', C1)}　${lit('藍 3：有 3 個水塔', C2)}　${lit('綠 3：倒平後每個', C3)}</div>`, '全部加起來，再平均分成 3 份。'),
    nameSay: `水的總量不變，重新平均分配到 3 個水塔，每個都是 3 格。<br>重新平均分配後每份的量，叫作${T('平均數')}。原本每個水塔不一定一樣多。`,
    pick: [['平均數就是最多的那一個。', '平均數是總量不變、重新平均分配後，每份的量。', '平均數一定是整數。'], 1, ['最高的水塔有 5 格，倒平後是 3 格。', '', '如果 7 格水平均分給 2 個水塔，每個 3.5 格，也可以。']],
    pose: pose('can', '三個人跑步，平均每人跑幾圈？', ['夠，3 圈', '不夠，還需要知道三個人一共跑幾圈（或每個人各跑幾圈）', '夠，1 圈'], 1, ['3 是人數，不是圈數。', '', '不知道總共跑了多少，不能平均分。'], '對了！要先知道總量，才能平均分。'),
    check: { q: '三天存了 2、4、6 元，平均每天存幾元？', pic: () => tanks3([2, 4, 6]), opts: ['3 元', '4 元', '6 元'], a: 1, hint: '回到倒水那一步：從 6 倒給 2，倒到一樣高。', hints: ['3 是天數；要把 2＋4＋6 平均分成 3 份。', '', '6 元是存最多的那一天。'], ok: '對了，總共 12 元平均分成 3 份：(2＋4＋6)÷3＝4 元。實際上每天存的不一樣多。' } }),

  mk({ key: 'dist', title: '分配律', term: '分配律', who: 'raccoon', game: 'mix', when: ['mix:dist', 'mix:near'], board: 'tapSet',
    hook: '一份早餐有一個飯糰 30 元和一瓶水 10 元，一份是 40 元。', hookPic: () => `<span class="em5">🍙💧</span>`,
    rounds: [trayRound(2, 30, 10, '看我做：買 2 份。我把水一瓶一瓶移出來，分開算。'), trayRound(3, 30, 10, '一起做：買 3 份。我先移一瓶。'), trayRound(4, 30, 10, '換你做：買 4 份，點每一瓶水移出來。', ['先預測：一份一份算和分開算，錢會一樣嗎？', ['一樣', '不一樣'], 0])],
    fade: step3(trays(3, 30, 10)(new Set()), '3 份早餐，每份一個飯糰、一瓶水。', `<div class="eq5" style="font-size:20px"><span class="ln5">${lit('飯糰', C1)}：${K(30, C1)} ${K(30, C1)} ${K(30, C1)}</span><span class="ln5">${lit('水', C2)}：${K(10, C2)} ${K(10, C2)} ${K(10, C2)}</span></div>`, '分成兩堆：飯糰一堆、水一堆，各 3 個。', `<div class="eq5">（${K(30, C1)}＋${K(10, C2)}）×${K(3, C3)}＝${K(30, C1)}×${K(3, C3)}＋${K(10, C2)}×${K(3, C3)}</div><div class="trail">左邊：一份的錢 × 份數　右邊：飯糰總價＋水總價　${lit('綠 3：買 3 份', C3)}</div>`, '寫成算式：每份量 × 份數。'),
    nameSay: `(30＋10)×3＝30×3＋10×3：先算一份再乘份數，和分別算飯糰、水的總價再相加，結果一樣。<br>這個規律叫作${T('分配律')}。`,
    pick: [['(30＋10)×3＝30×3＋10', '(30＋10)×3＝30×3＋10×3', '(30＋10)×3＝30＋10×3'], 1, ['水也買了 3 瓶，10 也要乘 3。', '', '飯糰也買了 3 個，30 也要乘 3。']],
    pose: pose('story', '哪一個問題可以寫成 (20＋5)×4？', ['一份飯 20 元、一杯湯 5 元，買 4 份', '20 元買 5 個，再買 4 個', '20 個人分 5 組，再來 4 人'], 0, ['', '這是個數相加，不是「一份的錢 × 份數」。', '這是分組和加人，不是「一份 × 份數」。'], '對了！括號裡是一份的錢 20＋5 元，乘份數 4。'),
    check: { q: '一枝筆 15 元、一把尺 5 元，每份各一樣，買 4 份。哪一個算法對？', pic: () => trays(4, 15, 5, '✏️', '📏')(new Set()), opts: ['15×4＋5×4', '15×4＋5', '15＋5×4'], a: 0, hint: '回到移水那一步：每一份都有一把尺。', hints: ['', '尺也有 4 把，5 也要乘 4。', '筆也有 4 枝，15 也要乘 4。'], ok: '對了，筆的總價加尺的總價：(15＋5)×4＝15×4＋5×4＝80 元。' } }),

  mk({ key: 'base', title: '底', term: '底', who: 'sheep', game: 'para', when: ['para:para', 'para:tri', 'para:slide', 'para:trap', 'para:sym', 'para:back'], board: 'tapSet',
    hook: '長方形的面積是長乘寬。今天的圖形斜放著，藍色虛線是從一個頂點畫到對邊、和那條邊垂直的線。', hookPic: () => bhSvg(PGR, { perp: [3, 0] }),
    rounds: [baseRound(PGR, 0, 3, '看我做：這塊斜放的平行四邊形，找和藍色虛線垂直的那條邊。'), baseRound(TRI1, 1, 0, '一起做：換一個三角形，這次藍色虛線從左下的頂點出發。'), baseRound(TRI2, 0, 2, '換你做：這個三角形有一個角很大。', ['先預測：藍色虛線會碰到三角形的邊，還是要把一條邊延長才碰得到？', ['碰得到', '要把邊延長'], 1])],
    fade: step3(bhSvg(PGR, { perp: [3, 0], base: 0, mark: true }), '斜放的平行四邊形：選紅色這條邊。', bhSvg(PG0, { perp: [3, 0], base: 0, mark: true, labels: [['7 公分', 140, 185, C1], ['4 公分', 128, 125, C2]] }), '把圖轉一轉，紅邊轉到下面。它還是同一條邊，藍色虛線也還是和它垂直。', `<div class="eq5" style="font-size:20px"><span class="ln5">紅邊 ${K(7, C1)} 公分</span><span class="ln5">和它垂直的藍色虛線 ${K(4, C2)} 公分</span></div>`, '量出兩段的長度。'),
    nameSay: `先選定一條邊作為${T('底')}。底不一定在下面；換選另一條邊當底，和它垂直的距離也要重新找。`,
    pick: [['底一定是最長的邊。', '底是我們選定的一條邊，不一定在下面。', '底一定是貼著地面的那條邊。'], 1, ['任何一條邊都可以選來當底，和長短無關。', '', '把圖轉一轉，紅邊不在下面，它還是我們選的底。']],
    pose: pose('pic', '哪一個問題配這張圖？', ['選紅色這條邊作為底，和它垂直的藍色虛線有多長？', '這個三角形是什麼顏色？', '三角形有幾個角？'], 0, ['', '顏色和底、垂直距離無關。', '圖上畫的是底和垂直距離，不是在數角。'], '對了！紅邊是底，藍色虛線是和它垂直的距離。', () => bhSvg(TRI1, { perp: [0, 1], base: 1, mark: true })),
    check: { q: '三角形的三條邊，都可以選來當底嗎？', pic: () => bhSvg(TRI1, {}), opts: ['可以，選哪一條都行，但垂直距離要跟著換', '不行，只有最下面那條能當底'], a: 0, hint: '回到找邊那一步：同一個三角形，藍色虛線從不同頂點出發，對到的是不同的邊。', hints: ['', '轉一轉圖形，哪一條都可以在下面。底是我們選的。'], ok: '對了，三條邊都能當底；換了底，就要重新找和它垂直的距離。梯形通常把兩條平行的邊叫上底和下底。' } }),

  mk({ key: 'height', title: '圖形的高', term: '圖形的高', who: 'sheep', game: 'para', when: ['para:para', 'para:tri', 'para:slide', 'para:trap', 'para:sym', 'para:back'], board: 'tapSet',
    hook: '量身高時，尺要和地面垂直，不是沿著斜的方向量。量圖形也一樣：紅色是選好的底。', hookPic: () => bhSvg(PG0, { base: 0 }),
    guess: ['斜放的平行四邊形，量它的斜邊，是頂點到底的垂直距離嗎？', ['是', '不是'], 1],
    rounds: [hRound(PG0, 0, 3, [['s', PG0[3], PG0[0]], ['h', PG0[3], footOf(PG0, 3, 0)], ['o', PG0[3], atT(PG0, 0, .7)]], '看我做：從上面的頂點到紅色的底，三條虛線裡哪一條和底垂直？'), hRound(TRI1, 0, 2, [['o', TRI1[2], atT(TRI1, 0, .25)], ['s', TRI1[2], TRI1[1]], ['h', TRI1[2], footOf(TRI1, 2, 0)]], '一起做：三角形，紅色的底是下面這條。'), hRound(TRI2, 0, 2, [['s', TRI2[2], TRI2[1]], ['o', TRI2[2], TRI2[0]], ['h', TRI2[2], footOf(TRI2, 2, 0)]], '換你做：這個三角形有一個角很大，紅色的底要延長（點點的線）。', ['先預測：三條虛線裡最短的那條，是和底垂直的那條嗎？', ['是', '不是'], 0])],
    reveal: '斜邊比較長，但它和底沒有垂直，不是頂點到底的距離。', revealPic: () => bhSvg(PG0, { base: 0, perp: [3, 0], mark: true, cands: [['s', PG0[3], PG0[0]]] }),
    fade: step3('<div class="u-big">🧍📏</div>', '量身高：尺和地面垂直，從腳量到頭頂。', bhSvg(PG0, { base: 0, perp: [3, 0], mark: true, labels: [['底 7', 140, 185, C1], ['4', 122, 125, C2]] }), '量平行四邊形：從頂點畫一條和底垂直的線。', `<div class="eq5" style="font-size:20px"><span class="ln5">和底垂直的距離 ${K(4, C2)} 公分</span><span class="ln5">斜邊約 4.5 公分（不用）</span></div>`, '寫成數字，用垂直的那一段。'),
    nameSay: `從頂點向底（或底的延長線）畫垂直的線，這段垂直距離就是對應這條底的高，叫作${T('圖形的高')}。<br>平行四邊形、梯形的高，也是兩條平行邊之間的垂直距離。`,
    pick: [['高就是斜邊。', '高是從頂點到底（或底的延長線）的垂直距離。', '高一定畫在圖形裡面。'], 1, ['斜邊沒有和底垂直，比高還長。', '', '角很大的三角形，高可能落在圖形外面，要把底延長。']],
    pose: pose('can', '平行四邊形的底是 6 公尺，面積是多少？', ['夠，36 平方公尺', '不夠，還需要知道對應這條底的高', '夠，12 平方公尺'], 1, ['6×6 把底當成高了，不知道高是多少。', '', '6＋6 不是面積的算法，而且還不知道高。'], '對了！缺高，算不出來。'),
    check: { q: '屋頂三角形：底 8 公尺、斜邊 6 公尺，從頂點垂直畫到底是 4 公尺。這條底對應的高是幾公尺？', pic: () => tri5([[40, 150], [280, 150], [174, 30]], '<line x1="174" x2="174" y1="30" y2="150" stroke="#2f5f9e" stroke-width="3" stroke-dasharray="5 4"/><text x="180" y="100" class="ax">4</text><text x="92" y="84" class="ax">6</text><text x="160" y="168" text-anchor="middle" class="ax">8</text>'), opts: ['4', '6', '8'], a: 0, hint: '回到量高那一步：找和底垂直的那一段，不量斜邊。', hints: ['', '6 公尺是斜邊，沒有和底垂直。', '8 公尺是底的長度。'], ok: '對了，你挑的是和底垂直的那一段：高是 4 公尺。' } }),

  mk({ key: 'pgarea', title: '平行四邊形面積', term: '平行四邊形面積公式', who: 'sheep', game: 'para', when: ['para:para', 'para:slide', 'para:sym', 'para:back'], board: 'counter',
    hook: '長方形的面積＝長×寬。平行四邊形斜斜的，能不能剪一剪、拼成長方形？', hookPic: () => pgCut(6, 3, 2, 0),
    rounds: [pgRound(6, 3, 2, '看我做：底 6 公分、高 3 公分。我沿高剪開，把三角形移到右邊。'), pgRound(8, 4, 2, '一起做：底 8、高 4。我先剪開，你接著移。'), pgRound(5, 4, 2, '換你做：底 5、高 4。', ['先預測：拼成的長方形，長和寬是多少？', ['長 5、寬 4', '長 5、寬 5', '長 7、寬 4'], 0])],
    fade: step3(pgCut(6, 3, 2, 3), '剪下三角形移過去，拼成長方形。', pgCut(6, 3, 2, 0), '回到原來的平行四邊形：長方形的長是它的底，寬是它的高。', `<div class="eq5">${K('底 6', C1)} × ${K('高 3', C2)} ＝ ${K(18, C3)}</div><div class="trail">${lit('紅：長方形的長＝底', C1)}　${lit('藍：長方形的寬＝高', C2)}　${lit('綠：面積 18 平方公分', C3)}</div>`, '寫成算式。'),
    nameSay: `平行四邊形沿高剪開、移過去，拼成長方形：長是原來的底，寬是原來的高，面積沒有變。<br>所以平行四邊形面積＝底×高，這叫作${T('平行四邊形面積公式')}。`,
    pick: [['平行四邊形面積＝底×斜邊。', '平行四邊形面積＝底×高。', '平行四邊形面積＝底＋高。'], 1, ['拼成長方形後，寬是高，不是斜邊。', '', '面積是能鋪幾個小方格，要用乘的。']],
    pose: pose('can', '一塊平行四邊形的地，斜邊 5 公尺、底 6 公尺，面積是多少？', ['夠，30 平方公尺', '不夠，還需要知道高'], 1, ['6×5 用的是斜邊，不是高。', ''], '對了，面積要用和底垂直的高，斜邊不行。'),
    check: { q: '平行四邊形的底 7 公分、高 3 公分，面積是多少平方公分？', pic: () => pgCut(7, 3, 2, 0), opts: ['10', '21', '42'], a: 1, hint: '回到剪拼那一步：拼成的長方形，長和寬是多少？', hints: ['7＋3 是相加；面積要相乘。', '', '不用再乘 2；拼成的長方形就是 7×3。'], ok: '對了，拼成長 7、寬 3 的長方形：7×3＝21 平方公分。' } }),

  mk({ key: 'triarea', title: '三角形面積', term: '三角形面積公式', who: 'sheep', game: 'para', when: ['para:tri'], board: 'counter',
    hook: '先回想：平行四邊形面積＝底×高。如果拿兩個一模一樣的三角形，能拼成什麼？', hookPic: () => triPair(6, 4, 2, 0),
    rounds: [triRound(6, 4, 2, '看我做：底 6 公分、高 4 公分的三角形。我拿一個一樣的，轉半圈靠上去。'), triRound(4, 3, 1, '一起做：底 4、高 3。我先拿出一樣的三角形，你把它靠上去。'), triRound(5, 2, 3, '換你做：底 5、高 2。', ['先預測：一個三角形的面積是多少平方公分？', ['5', '10', '7'], 0])],
    fade: step3(triPair(6, 4, 2, 2), '兩個一樣的三角形，拼成一個平行四邊形。', triPair(6, 4, 2, 0), '回到一個三角形：底 6、高 4，它是那個平行四邊形的一半。', `<div class="eq5">${K(6, C1)} × ${K(4, C2)} ÷ ${K(2, C3)} ＝ 12</div><div class="trail">${lit('紅 6：底', C1)}　${lit('藍 4：高', C2)}　${lit('綠 ÷2：兩個三角形取一個', C3)}</div>`, '寫成算式，每個數連回圖上。'),
    nameSay: `兩個一樣的三角形拼成平行四邊形，面積是底×高；一個三角形是它的一半。<br>所以三角形面積＝底×高÷2，這叫作${T('三角形面積公式')}。`,
    pick: [['三角形面積＝底×高。', '三角形面積＝底×高÷2。', '三角形面積＝底×斜邊÷2。'], 1, ['底×高是兩個三角形拼成的平行四邊形面積。', '', '要用和底垂直的高，不是斜邊。']],
    pose: pose('story', '哪一個問題要用「底×高÷2」？', ['三角形旗子底 6 公分、高 4 公分，面積多少？', '長方形桌子長 6 公尺、寬 4 公尺，面積多少？', '6 根木條和 4 根木條，一共幾根？'], 0, ['', '長方形的面積是長×寬，不用 ÷2。', '這是數量相加，不是面積。'], '對了！三角形是平行四邊形的一半，所以要 ÷2。'),
    check: { q: '三角形的底 8 公分、高 3 公分，面積是多少平方公分？', pic: () => triPair(8, 3, 3, 0), opts: ['12', '24', '11'], a: 0, hint: '回到拼圖那一步：兩個一樣的三角形拼成底 8、高 3 的平行四邊形。', hints: ['', '24 是兩個三角形拼成的平行四邊形；一個三角形要再 ÷2。', '8＋3 是相加；面積要用底×高÷2。'], ok: '對了，8×3＝24 是兩個三角形，一個是 24÷2＝12 平方公分。' } }),

  mk({ key: 'facepar', title: '面和面平行', term: '面和面平行', who: 'bee', game: 'cuboid', when: ['cuboid:spin', 'cuboid:life'], board: 'tapSet',
    hook: '把教室想成一個理想的長方體：地板、天花板和四面牆都是平平的面。', hookPic: () => roomSvg(new Set(), 'floor'),
    mh: '想像兩個面一直往四周延伸。有交線（碰在一起）的不算，要找延伸了也不相交的那一面。',
    rounds: [tset(['ceil'], s => roomSvg(s, 'floor'), s => s.size ? '延伸了也不相交！' : '紅色是地板', '天花板和地板處處一樣遠，再怎麼延伸也不會相交。', '看我做：哪一面和紅色的地板，延伸了也不會相交？', null, { back: '後牆和地板相交在一條線上。', left: '左牆和地板相交在一條線上。', right: '右牆和地板相交在一條線上。' }), tset(['right'], s => roomSvg(s, 'left'), s => s.size ? '延伸了也不相交！' : '紅色是左牆', '右牆和左牆處處一樣遠，不會相交。', '一起做：紅色換成左牆，哪一面和它不相交？', null, { ceil: '天花板和左牆相交了。', floor: '地板和左牆相交了。', back: '後牆和左牆相交了。' }), tset(['floor'], s => roomSvg(s, 'ceil'), s => s.size ? '延伸了也不相交！' : '紅色是天花板', '地板和天花板不相交。', '換你做：紅色是天花板。', ['先預測：和天花板不相交的有幾面？', ['1 面', '3 面'], 0], { back: '後牆和天花板相交了。', left: '左牆和天花板相交了。', right: '右牆和天花板相交了。' })],
    fade: step3(roomSvg(new Set(['ceil']), 'floor'), '教室：地板和天花板。', box3d(4, 3, 3, 30, 22, { colors: ['#ffd65a', '#e0455a', '#fdeec6', '#fdeec6', '#fdeec6', '#fdeec6'] }), '畫成長方體盒子：上下相對的兩面。', `<div class="eq5" style="font-size:20px"><span class="ln5">${lit('紅', C1)}（下面）和 ${lit('黃', C4)}（上面）</span><span class="ln5">處處一樣遠，延伸也不相交</span></div>`, '說成一句話。'),
    nameSay: `把長方體相對的兩個面想像向四周延伸，它們仍然不相交。<br>這種關係叫作${T('面和面平行')}，例如地板和天花板。`,
    pick: [['相鄰的兩面平行。', '長方體相對的兩面，延伸後也不相交，是面和面平行。', '地板和牆壁平行。'], 1, ['相鄰的兩面碰在一起，有一條交線。', '', '牆壁和地板相交在牆角那條線上。']],
    pose: pose('story', '哪一個問題在問兩個面平不平行？', ['把長方體鞋盒的盒蓋和盒底想像延伸，會相交嗎？', '鞋盒有多重？', '鞋子幾號？'], 0, ['', '重量和兩個面的關係無關。', '鞋子大小和兩個面的關係無關。'], '對了！問的是兩個面延伸後會不會相交。'),
    check: { q: '把書桌的桌面和地板想成兩個平平的面。它們是什麼關係？', pic: () => '<div class="u-big">🪑</div>', opts: ['面和面平行', '會相交'], a: 0, hint: '回到教室那一步：桌面和地板處處一樣遠嗎？', hints: ['', '桌面是水平的，和地板處處一樣遠，延伸也不會相交。'], ok: '對了，桌面和地板處處一樣遠，是面和面平行。' } }),

  mk({ key: 'faceper', title: '面和面垂直', term: '面和面垂直', who: 'bee', game: 'cuboid', when: ['cuboid:spin', 'cuboid:life'], board: 'tapSet',
    hook: '在長方體的教室裡，牆壁和地板相交在一條線上。把三角板的直角靠在牆角，剛好貼合。', hookPic: () => roomSvg(new Set(), 'floor'),
    mh: '找和紅色的面相交、而且夾成直角的面。相對、不相交的那一面不算。',
    rounds: [tset(['back', 'left', 'right'], s => roomSvg(s, 'floor'), s => `找到 ${s.size} 面`, '三面牆都和地板相交，夾成直角。', '看我做：哪幾面和紅色地板相交、夾成直角？', null, { ceil: '天花板和地板不相交。' }), tset(['ceil', 'floor', 'back'], s => roomSvg(s, 'left'), s => `找到 ${s.size} 面`, '天花板、地板、後牆都和左牆夾成直角。', '一起做：紅色換成左牆。', null, { right: '右牆和左牆不相交。' }), tset(['ceil', 'floor', 'left', 'right'], s => roomSvg(s, 'back'), s => `找到 ${s.size} 面`, '四面都和後牆夾成直角。', '換你做：紅色是後牆。', ['先預測：和後牆夾成直角的有幾面？', ['2 面', '4 面'], 1])],
    fade: step3(roomSvg(new Set(['back', 'left', 'right']), 'floor'), '教室：牆和地板。', box3d(4, 3, 3, 30, 22, { colors: ['#fdeec6', '#e0455a', '#ffd65a', '#fdeec6', '#ffd65a', '#fdeec6'] }), '畫成長方體盒子：紅色和旁邊的面。', `<div class="eq5" style="font-size:20px"><span class="ln5">${lit('紅', C1)}和每一個${lit('黃', C4)}</span><span class="ln5">相交，夾成 ${K('90°', C1)}</span></div>`, '旁邊的面都夾成直角。'),
    nameSay: `在長方體中，相鄰的兩個面相交，夾成直角。<br>這種關係叫作${T('面和面垂直')}，例如牆壁和地板。`,
    pick: [['相對的兩面垂直。', '長方體中相鄰、夾成直角的兩面，叫面和面垂直。', '天花板和地板垂直。'], 1, ['相對的兩面不相交，那是面和面平行。', '', '天花板和地板不相交，是面和面平行。']],
    pose: pose('change', '長方體盒子平放時，側面和盒底垂直。把盒子翻成直立的，原來的側面和原來的盒底，還是互相垂直嗎？', ['還是', '不是了'], 0, ['', '翻轉盒子不會改變兩個面相交的角度，還是直角。'], '對了，兩個面的關係由盒子本身決定，和怎麼擺放無關。'),
    check: { q: '長方體教室裡相鄰的兩面牆，是什麼關係？', pic: () => '<div class="u-big">🧱</div>', opts: ['面和面垂直', '面和面平行'], a: 0, hint: '回到教室那一步：左牆和後牆相交嗎？夾成什麼角？', hints: ['', '相鄰的兩面牆在牆角相交，不是平行。'], ok: '對了，相鄰的兩面牆相交、夾成直角，是面和面垂直。' } }),

  mk({ key: 'net', title: '展開圖', term: '展開圖', who: 'bee', game: 'cuboid', when: ['cuboid:net', 'cuboid:opp'], board: 'counter',
    hook: '正方體紙盒沿著一些邊剪開，就能攤成一張平平的紙。', hookPic: () => '<div class="u-big">📦</div>',
    mh: '每點一下，就把一個面攤開。看看六個面攤平後是不是還連在一起。',
    rounds: [0, 1, 2].map(i => cnt(5, k => `<div class="tap5w" data-t="x" style="display:block">${foldNet(NET_A, 1 - k / 5)}</div>`, k => k < 5 ? `打開了 ${k} 面` : '全部攤平了', '六個面連在一起，攤成一張平平的紙。', ['看我做：一面一面打開紙盒。', '一起做：我先打開兩面，你接著打開。', '換你做：點紙盒，一面一面打開。'][i], i === 2 ? ['先預測：全部攤平後，六個面還連在一起嗎？', ['連在一起', '散開了'], 0] : null)),
    fade: step3('<div class="u-big">📦</div>', '真的紙盒。', foldNet(NET_A, 0), '攤平的簡圖，六個面連在一起。', `<div class="eq5">${K(6, C1)} 個正方形，連成一張</div>`, '數一數。'),
    sort: { q: '這些圖摺得回正方體嗎？', items: [[NET_A, 0], [[[0, 0], [1, 0], [1, 1], [1, 2], [1, 3], [2, 3]], 0], [NET_BAD, 1], [[[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]], 1]].map(([n, c]) => ({ h: `<span class="netmini">${foldNet(n, 0)}</span>`, c })), bins: ['摺得回去', '摺不回去'], hint: '想像中間一排當側面繞一圈，其他的當上蓋和底。有沒有兩面會疊在一起？', done: '上面兩張摺得回正方體；另外兩張摺起來有兩面疊在一起。' },
    nameSay: `沿著立體的一些邊剪開，把各個面攤平，得到能再摺回原來立體的圖，叫作${T('展開圖')}。`,
    pick: [['展開圖是立體的照片。', '展開圖是把立體攤平的圖，摺回去又是原來的立體。', '六個正方形隨便排都是展開圖。'], 1, ['照片只看得到外面幾面，不能摺回去。', '', '有些排法摺起來兩面會疊在一起，就不是正方體的展開圖。']],
    pose: pose('can', '這張圖能摺成正方體嗎？', ['能', '不能，有兩面會疊在一起'], 1, ['摺摺看：左邊兩排是 2×3 的長方形，摺起來會有兩面疊在一起。', ''], '對了！它摺不成正方體。', () => foldNet(NET_BAD, 0)),
    check: { q: '這張圖摺起來，能變回正方體嗎？', pic: () => foldNet([[0, 0], [1, 0], [1, 1], [1, 2], [1, 3], [2, 3]], 0), opts: ['能', '不能'], a: 0, hint: '回到打開紙盒那一步：中間 4 格繞一圈當側面，上下各一格當蓋和底。', hints: ['', '中間一排 4 格繞一圈，左上那格當蓋、右下那格當底，沒有疊在一起。'], ok: '對了，中間 4 格繞成側面，另外兩格剛好是上蓋和底，它是正方體的展開圖。' } }),

  mk({ key: 'surface', title: '表面積', term: '表面積', who: 'bee', game: 'cuboid', when: ['cuboid:area', 'cuboid:cube'], board: 'tapSet',
    hook: '一個禮物盒長 6 公分、寬 3 公分、高 4 公分。用包裝紙剛好蓋住盒子外面的每一面（不算重疊和剪掉的部分），需要多少紙？', hookPic: () => '<div class="u-big">🎁</div>',
    rounds: [surfRound(false, '看我做：盒子攤平了，我一面一面塗包裝紙。'), surfRound(false, '一起做：我先塗三面，你塗剩下的。'), surfRound(true, '換你做：這次是沒有蓋子的盒子，只塗要包的面。', ['先預測：沒有蓋子的盒子要塗幾面？', ['5 面', '6 面'], 0])],
    fade: step3('<div class="u-big">🎁</div>', '真的禮物盒：長 6、寬 3、高 4。', boxNet(true, false), '攤平，每一面都標上面積。', `<div class="eq5">${K(24, C1)}＋${K(24, C1)}＋${K(18, C2)}＋${K(18, C2)}＋${K(12, C3)}＋${K(12, C3)}＝108</div><div class="trail">${lit('紅 6×4', C1)}　${lit('藍 6×3', C2)}　${lit('綠 3×4', C3)}：同色的兩面一樣大</div>`, '每一面的面積加起來。'),
    nameSay: `把立體外表各個面的面積加起來，叫作${T('表面積')}。這個盒子的表面積是 108 平方公分（不算包裝時重疊的部分）。`,
    pick: [['表面積只算最大的一面。', '表面積是立體外表各個面的面積總和。', '表面積是裡面能裝多少。'], 1, ['盒子有 6 面，每一面都要算。', '', '能裝多少是看裡面的空間，不是包在外面的面積。']],
    pose: pose('change', '同一個盒子，把蓋子拿掉不包，要的紙會變嗎？', ['不會變', '會變少'], 1, ['蓋子那一面 18 平方公分不用包了。', ''], '對了，少包一面 18 平方公分。如果只包側面，上下兩面都不算。'),
    check: { q: '一個正方體，每一面都是 4 平方公分，表面積是多少平方公分？', pic: () => '<div class="u-big">🎲</div>', opts: ['4', '16', '24'], a: 2, hint: '回到塗面那一步：正方體有幾面？', hints: ['4 是一面的面積；正方體有 6 面。', '16 只算了 4 面，還有上下兩面。', ''], ok: '對了，6 面都一樣大：4×6＝24 平方公分。' } }),
);
/* ---------- 鷹架版段落（三）：千分位、兆、扇形、比率、容積、柱錐，以及單位教室開場（依 2026-11-02 外部審查修訂） ---------- */
// 一層一層放大：下一層是把上一層的「第 1 格」放大來看，再平均分成 10 份
const zoomFunnel = '<svg viewBox="0 0 100 10" preserveAspectRatio="none" style="width:100%;height:12px;display:block"><path d="M0 0L10 0L100 10L0 10Z" fill="#cfe0f5"/></svg>';
const ZL = [['1（一整條）', '#a9d0f0'], ['1 平均分成 10 份，1 份是 0.1', '#6ea8dc'], ['把 0.1 放大，再平均分成 10 份，1 份是 0.01', '#f0a03c'], ['把 0.01 放大，再平均分成 10 份，1 份是 0.001', '#3fae5a']];
const zoomStrip = k => `<div class="tap5w" data-t="x" style="display:block;padding:2px 4px">${ZL.slice(0, k + 1).map(([t, c], i) => `${i ? zoomFunnel : ''}<small class="zl5">${t}</small>${i ? cBar(10, 1, c) : cBar(1, 1, c)}`).join('')}</div>`;
const digitsCut = (groups, k) => `<div class="digits big tap5w" data-t="x">${groups.map((g, i) => (i && groups.length - i <= k ? '<b class="cut5">｜</b>' : '') + g).join('')}</div>`;
const shots = (n, ins) => k => `<div class="people">${Array.from({ length: n }, (_, i) => `<span class="pp ${i < k ? (ins.includes(i) ? 'on' : '') : ''}">${i < k ? (ins.includes(i) ? '🏀' : '❌') : '⚪'}</span>`).join('')}</div><div class="pile6">${k < n ? '<span class="tap5w big6" data-t="x">🏀</span><small>投一球</small>' : ''}</div>`;
const trees = (n, on) => `<div class="pics5">${Array.from({ length: n }, (_, i) => `<span class="t5 ${i < on ? 'on' : ''}">🌳${i < on ? '<i>●</i>' : ''}</span>`).join('')}</div>`;
const people10 = on => `<div class="pics5">${Array.from({ length: 10 }, (_, i) => `<span class="t5 ${i < on ? 'on' : ''}">🧑</span>`).join('')}</div>`;
const capCup = k => `<svg class="g5" style="max-height:190px" viewBox="0 0 240 190"><rect x="40" y="10" width="160" height="160" rx="6" fill="#c9a36a" stroke="#33405a" stroke-width="2"/><rect x="60" y="10" width="120" height="140" fill="#fff"/><rect x="60" y="${150 - k * 28}" width="120" height="${k * 28}" fill="#a9d0f0"/><line x1="40" x2="200" y1="182" y2="182" stroke="#33405a"/><text x="120" y="179" text-anchor="middle" class="ax">外面 8 公分</text><line x1="60" x2="180" y1="22" y2="22" stroke="#2f5f9e" stroke-dasharray="4 3"/><text x="120" y="38" text-anchor="middle" class="ax" style="fill:#2f5f9e">裡面 6 公分</text></svg><div class="pile6"><span class="tap5w big6" data-t="x">🫗</span><small>倒一層</small></div>`;
const capPic = k => capCup(k).replace(/<div class="pile6">.*<\/div>$/, '');
const solidCard = (id, name, t, n) => `<button class="sol5 tap5w" data-t="${id}">${solidSvg(t, n, 30, 20).replace('class="g5"', 'class="g5 solmini"')}<small>${name}</small></button>`;
const SOL = { tent: ['帳篷', 'prism', 3], box: ['鞋盒', 'prism', 4], pencil: ['沒削的鉛筆', 'prism', 6], can: ['罐頭', 'cyl', 0], pipe: ['一段水管', 'cyl', 0], pyr: ['金字塔', 'pyr', 4], roof: ['尖屋頂', 'pyr', 3], cone: ['甜筒形積木', 'cone', 0], hat: ['派對帽', 'cone', 0], ball: ['足球', 'ball', 0] };
// 每一種東西「為什麼不是」：依目標形體給錯因
const SOLWHY = { prism: { can: '罐頭的兩個底面是圓，不是多邊形。', pipe: '水管的底面是圓。', pyr: '金字塔只有一個底面，往上收成一個尖點。', roof: '尖屋頂往上收成一個尖點。', cone: '它的底面是圓，而且頂端是尖的。', hat: '它的底面是圓，而且頂端是尖的。', ball: '球沒有平平的底面。' }, cyl: { box: '鞋盒的底面是長方形，不是圓。', tent: '帳篷的底面是三角形。', pencil: '鉛筆的底面是六邊形。', cone: '它往上收成一個尖點，只有一個底面。', hat: '派對帽往上收成一個尖點。', ball: '球沒有平平的底面。', pyr: '金字塔的底面是正方形，頂端是尖的。' }, pyr: { box: '鞋盒上下有兩個一樣的底面，不是尖的。', can: '罐頭的底面是圓，上下一樣粗。', tent: '帳篷是橫放的三角柱，有兩個三角形底面。', cone: '它的底面是圓，不是多邊形。', hat: '派對帽的底面是圓。', pencil: '沒削的鉛筆上下一樣粗。' }, cone: { can: '罐頭上下一樣粗，有兩個底面。', pyr: '金字塔的底面是正方形，不是圓。', ball: '球沒有平平的底面，也沒有尖點。', roof: '尖屋頂的底面是三角形。', pipe: '水管上下一樣粗，沒有尖點。', tent: '帳篷的底面是三角形。' } };
const solRound = (ids, right, say, type, predict) => tset(right, s => `<div class="sols5">${ids.map(id => { const [nm, t, n] = SOL[id]; return solidCard(id, nm, t, n).replace('class="sol5 tap5w"', `class="sol5 tap5w ${s.has(id) ? 'on' : ''}"`); }).join('')}</div>`, s => `找到 ${s.size} 個`, '都找到了。', say, predict, Object.fromEntries(ids.filter(i => !right.includes(i)).map(i => [i, SOLWHY[type][i] || '這個不符合：看底面的形狀，再看上下是不是一樣粗。'])));
const solidSeg = o => mk({ key: o.key, title: o.term, term: o.term, who: 'fox', game: 'solid', when: ['solid:count', 'solid:name', 'solid:rel', 'solid:net'], board: 'tapSet', hook: o.hook, hookPic: () => `<div class="sols5">${o.rounds[0][0].slice(0, 3).map(id => solidCard(id, SOL[id][0], SOL[id][1], SOL[id][2])).join('')}</div>`, mh: o.mh,
  rounds: o.rounds.map((r, i) => solRound(r[0], r[1], ['看我做：', '一起做：', '換你做：'][i] + r[2], o.type, r[3])),
  fade: step3(`<div class="sols5">${o.right.slice(0, 2).map(id => solidCard(id, SOL[id][0], SOL[id][1], SOL[id][2])).join('')}</div>`, '把真的東西想成理想的模型。', solidSvg(SOL[o.right[0]][1], SOL[o.right[0]][2], 30, 20), o.fade[0], `<div class="eq5" style="font-size:20px">${o.fade[1]}</div>`, o.fade[2]),
  sort: { q: '分分看。', items: o.sort.map(([h, c]) => ({ h, c })), bins: [o.bin, '不是'], hint: '先看底面有幾個、是什麼形狀，再看上下是不是一樣粗。', done: o.sortDone }, nameSay: o.nameSay, term: o.term, pick: o.pick, pose: o.pose, check: o.check });

SEGS.push(
  mk({ key: 'thou', title: '千分位', term: '千分位', who: 'pelican', game: 'decimal', when: ['decimal:thou', 'decimal:point', 'decimal:shift', 'decimal:rel'], board: 'counter',
    hook: '先回想：把 1 平均分成 10 份，每份是 0.1；把 0.1 再平均分成 10 份，每份是 0.01。忘了也沒關係，下面會再做一次。', hookPic: () => zoomStrip(2).replace(' tap5w" data-t="x"', '"'),
    mh: '每點一下，就把上一層的 1 格放大，再平均分成 10 份。看新的一份是多少。',
    rounds: [cnt(1, zoomStrip, k => ['一整條是 1', '一份是 0.1'][k], '1 平均分成 10 份，一份是 0.1。', '看我做：點長條，平均分成 10 份。'), cnt(2, zoomStrip, k => ['一整條是 1', '一份是 0.1', '一份是 0.01'][k], '再分一次，一份是 0.01。', '一起做：分兩次，我先分第一次。'), cnt(3, zoomStrip, k => ['一整條是 1', '一份是 0.1', '一份是 0.01', '一份是 0.001'][k], '分三次，一份是 0.001。', '換你做：分三次。', ['先預測：0.01 再平均分成 10 份，一份是多少？', ['0.1', '0.001', '0.02'], 1])],
    fade: step3('<div class="u-big">📏</div><div class="trail">1 公尺 → 1 公寸是 0.1 公尺 → 1 公分是 0.01 公尺 → 1 公釐是 0.001 公尺</div>', '一把 1 公尺長的尺：最小的 1 小格（1 公釐）是 1 公尺的 1/1000。', zoomStrip(3).replace(' tap5w" data-t="x"', '"'), '畫成長條：每一層都是把上一層的 1 格放大，再平均分成 10 份。', `<div class="digits big"><span>0</span><b>.</b><span style="color:${C2}">0</span><span style="color:${C4}">0</span><span style="color:${C3}">1</span></div><div class="trail">1÷10÷10÷10＝0.001　${lit('藍：幾個 0.1', C2)}　${lit('橘：幾個 0.01', C4)}　${lit('綠：幾個 0.001', C3)}</div>`, '寫成小數，每一位對應一層。'),
    nameSay: `把 1 平均分成 1000 份，每份是 0.001。<br>小數點右邊第三位記的是有幾個 0.001，這一位叫作${T('千分位')}。例如 3.275 的 5 表示 5 個 0.001。`,
    pick: [['千分位是小數點右邊第一位。', '千分位是小數點右邊第三位，記有幾個 0.001。', '千分位是 1000。'], 1, ['右邊第一位是十分位，記幾個 0.1。', '', '千分位記的是幾個 0.001，不是 1000。']],
    pose: pose('change', '3.275 只把 5 改成 8，哪一位的數字變了？', ['十分位', '百分位', '千分位'], 2, ['十分位是 2，沒有改。', '百分位是 7，沒有改。', ''], '對了！只有千分位變了：3.278 比 3.275 多 3 個 0.001。'),
    check: { q: '3.275 的 5 在哪一位？', pic: () => '<div class="digits big"><span>3</span><b>.</b><span>2</span><span>7</span><span class="dg l">5</span></div>', opts: ['十分位', '百分位', '千分位'], a: 2, hint: '回到分長條那一步：小數點右邊第三層是多少？', hints: ['十分位是小數點右邊第一位，是 2。', '百分位是右邊第二位，是 7。', ''], ok: '對了，5 在小數點右邊第三位，是千分位，表示 5 個 0.001。' } }),

  mk({ key: 'zhao', title: '兆', term: '兆', who: 'pelican', game: 'decimal', when: ['decimal:chunk', 'decimal:zero'], board: 'counter',
    hook: '先回想：1 0000 是一萬，1 0000 0000 是一億。很長的數，從個位開始每 4 位分一組來念。', hookPic: () => '<div class="digits">1｜0000｜0000</div>',
    mh: '從最右邊的個位開始，每數 4 位切一刀。每切一刀，左邊那一組的單位就更大。',
    rounds: [cnt(2, k => digitsCut(['12', '3456', '7890'], k), k => ['從個位開始，每 4 位切一刀', '第一刀：左邊是萬', '第二刀：左邊是億'][k], '念作 12 億 3456 萬 7890。', '看我做：從個位開始，每 4 位切一刀。'), cnt(2, k => digitsCut(['5', '0000', '0000'], k), k => ['從個位開始，每 4 位切一刀', '第一刀：左邊是萬', '第二刀：左邊是億'][k], '念作 5 億。', '一起做：我先切一刀。'), cnt(3, k => digitsCut(['3', '0000', '0000', '0000'], k), k => ['從個位開始，每 4 位切一刀', '第一刀：左邊是萬', '第二刀：左邊是億', '第三刀：左邊比億還大'][k], '切了三刀，最左邊的 3，每個表示 10000 億。', '換你做：切三刀。', ['先預測：第三刀左邊的 3，表示 3 個多少？', ['3 個億', '3 個 10000 億', '3 個萬'], 1])],
    fade: step3('<div class="u-big">🌌</div>', '天文、人口、經費常有很長的數。', '<div class="digits big">3<b class="cut5">｜</b>0000<b class="cut5">｜</b>0000<b class="cut5">｜</b>0000</div>', '從個位開始，每 4 位切一刀。', `<div class="eq5">${K('10000', C1)} 個 ${K('億', C2)}</div><div class="trail">最左邊那一組，每個 1 表示 10000 個億</div>`, '寫出最左邊那一組的大小。'),
    nameSay: `從個位開始每 4 位一組，依序是個、萬、億，再往左一組，每個 1 表示 10000 億。<br>10000 億叫作 1 ${T('兆')}。1 兆＝10000 億。`,
    pick: [['1 兆＝1000 億。', '1 兆＝10000 億。', '1 兆＝10000 萬。'], 1, ['億的左邊一組有 4 位，所以是 10000 億，不是 1000 億。', '', '10000 萬是 1 億。']],
    pose: pose('change', '5 兆改成 3 兆，等於幾億？', ['3 億', '30000 億', '300 億'], 1, ['3 兆比 3 億大很多：每 1 兆是 10000 億。', '', '1 兆是 10000 億，3 兆是 3 個 10000 億。'], '對了！3 兆＝3×10000 億＝30000 億。'),
    check: { q: '5 0000 0000 0000 怎麼念？', pic: () => '<div class="digits">5｜0000｜0000｜0000</div>', opts: ['5 億', '5 兆', '50 萬'], a: 1, hint: '回到切數字那一步：數數看有幾組 0000。', hints: ['5 後面有 3 組 0000，5 億只有 2 組。', '', '50 萬是 50 0000，只有 1 組。'], ok: '對了，5 後面有 3 組 0000，最左邊那一組是兆：5 兆。' } }),

  mk({ key: 'sector', title: '扇形', term: '扇形', who: 'bee', game: 'sector', when: ['sector:drag', 'sector:frac', 'sector:read', 'sector:part', 'sector:draw'], board: 'counter',
    hook: '一個圓形披薩，從圓心沿直線往外切，可以切下一塊一塊。', hookPic: () => sectorSvg(360),
    mh: '每點一下，就從圓心沿兩條直線切下一塊。看看每一塊有幾條直的邊、幾條彎的邊。',
    rounds: [1, 2, 3].map((n, i) => cnt(n, k => `<div class="tap5w" data-t="x" style="display:block">${sectorSvg(360 - 45 * k)}</div>`, k => `切下 ${k} 塊`, '從圓心切下來的每一塊：兩條直的邊都從圓心出發，另一條邊是圓周的一段。', ['看我做：從圓心切一塊下來。', '一起做：再切兩塊。', '換你做：切三塊。'][i], i === 2 ? ['先預測：切下來的每一塊，有幾條直的邊？', ['1 條', '2 條', '3 條'], 1] : null)),
    fade: step3('<div class="u-big">🍕</div>', '一塊從圓心切下的圓形披薩。', sectorSvg(45, { parts: true }), `畫成簡圖：${lit('兩條半徑', C2)}和${lit('一段圓周', C1)}。`, `<div class="eq5">${K(2, C2)} 條半徑（從圓心出發）＋${K(1, C1)} 段圓周</div>`, '數一數邊。'),
    sort: { q: '哪些是由同一個圓的兩條半徑和一段圓周圍成的？', items: [['從圓心切下的一塊圓形披薩', 0], ['兩條半徑和一段圓周圍成的圖', 0], ['一把長方形的扇子', 1], ['沒有切過圓心的西瓜片', 1], ['三角形餅乾', 1]].map(([h, c]) => ({ h, c })), bins: ['是', '不是'], hint: '看兩條直的邊是不是從圓心出發的半徑，另一條邊是不是圓周的一段。', done: '只有從圓心切下的那兩個是；長方形扇子、沒過圓心的西瓜片、三角形餅乾都不是。' },
    nameSay: `由同一個圓的兩條半徑，和它們之間的一段圓周圍成的圖形，叫作${T('扇形')}。名字像扇子，但不是每一把扇子都是這個形狀。`,
    pick: [['扇形是三角形。', '扇形由同一個圓的兩條半徑和一段圓周圍成。', '扇形一定比半圓小。'], 1, ['扇形有一條邊是彎的圓周。', '', '張開超過 180 度的扇形比半圓大。']],
    pose: pose('story', '哪一個問題說的是扇形？', ['把圓形蛋糕從圓心切成 4 塊一樣大的，一塊有多大？', '把方形蛋糕切成 4 塊。', '買 4 個圓形蛋糕。'], 0, ['', '方形蛋糕切下的一塊沒有圓周。', '這是買幾個，沒有切成扇形。'], '對了！從圓心切，每一塊都是扇形。'),
    check: { q: '一塊從圓心切下的圓形披薩，是什麼形狀？', pic: () => sectorSvg(60), opts: ['三角形', '扇形', '長方形'], a: 1, hint: '回到切披薩那一步：它有兩條半徑和一段圓周。', hints: ['三角形三條邊都是直的；這一塊有一條邊是彎的。', '', '長方形有四條直的邊。'], ok: '對了，兩條半徑加一段圓周，是扇形。' } }),

  mk({ key: 'centerangle', title: '圓心角', term: '圓心角', who: 'bee', game: 'sector', when: ['sector:drag', 'sector:frac', 'sector:read', 'sector:part', 'sector:draw'], board: 'counter',
    hook: '同一個圓切下的兩個扇形：一個在圓心張開一點點，一個張開很多。', hookPic: () => `<div class="vs two5">${sectorSvg(30)}${sectorSvg(150)}</div>`,
    mh: '每點一下，在圓心多張開 30 度。看扇形跟著變大多少。',
    rounds: [2, 3, 4].map((n, i) => cnt(n, k => `<div class="tap5w" data-t="x" style="display:block">${sectorSvg(30 * k || 2)}</div>`, k => `在圓心張開 ${30 * k}°`, `在圓心張開 ${30 * n} 度。`, ['看我做：點一下，在圓心多張開 30 度。', '一起做：張開到 90 度。', '換你做：張開到 120 度。'][i], i === 2 ? ['先預測：同一個圓裡，張開 120 度的扇形，比張開 90 度的大還是小？', ['大', '小'], 0] : null)),
    fade: step3('<div class="u-big">🍕</div>', '同一個披薩切下大小不同的兩塊。', sectorSvg(90, { parts: true }), `簡圖：${lit('圓心那個角', C4)}張開多少。`, `<div class="eq5">${K('90°', C4)} → 1/4 圓</div><div class="trail">一整圈 360 度，90 度是 360 度的 1/4</div>`, '寫出圓心那個角的度數。'),
    nameSay: `扇形中，頂點在圓心、兩邊都是半徑的那個角，叫作${T('圓心角')}。在同一個圓（或半徑一樣的圓）裡，它越大，扇形越大。`,
    pick: [['圓心角是彎的那條邊的長度。', '在同一個圓裡，圓心角越大，扇形越大。', '圓心角都是 90 度。'], 1, ['彎的邊是圓周的一段，不是角。', '', '圓心角可以是各種度數，例如 30 度、120 度。']],
    pose: pose('can', '一片扇形的花圃，是幾分之幾圓？', ['夠，1/4 圓', '不夠，還要知道圓心角', '夠，半圓'], 1, ['沒有說張開幾度，不一定是 1/4。', '', '沒有說張開幾度，不一定是半圓。'], '對了！缺圓心角。'),
    check: { q: '1/4 圓的花圃，圓心角幾度？', pic: () => sectorSvg(90), opts: ['45 度', '90 度', '180 度'], a: 1, hint: '回到張開扇形那一步：一圈 360 度平均分成 4 份。', hints: ['45 度是 1/8 圓。', '', '180 度是半圓。'], ok: '對了，360÷4＝90 度。' } }),

  mk({ key: 'ratio', title: '比率', term: '比率', who: 'mimi', game: 'ratio', when: ['ratio:rate'], board: 'counter',
    hook: '小安投籃，投 5 球、進 3 球。要怎麼用一個數，說出投進的次數和全部投球次數相比的結果？', hookPic: () => '<div class="u-big">🏀</div>',
    mh: '一球一球點，數進了幾球，也數一共投了幾球。',
    rounds: [cnt(5, shots(5, [0, 2, 4]), k => `投了 ${k} 球`, '投 5 球，進 3 球。', '看我做：投 5 球，一球一球投。'), cnt(4, shots(4, [1, 2]), k => `投了 ${k} 球`, '投 4 球，進 2 球。', '一起做：投 4 球，我先投兩球。'), cnt(5, shots(5, [0, 3]), k => `投了 ${k} 球`, '投 5 球，進 2 球。', '換你做：這次投 5 球，一球一球點。', ['先預測：如果進了 2 球，進球數和全部的球數相比，可以怎麼寫？', ['2/5', '5/2', '2/3'], 0])],
    fade: step3(shots(5, [0, 2, 4])(5), '投 5 球，進 3 球。', cBar(5, 3, '#3fae5a'), '畫成長條：全部 5 格，進球塗 3 格。', `<div class="eq5"><span class="fr5">${K(3, C3)}<i></i>${K(5, C2)}</span></div><div class="trail">${lit('綠 3：投進的次數', C3)}　${lit('藍 5：全部投球的次數', C2)}</div>`, '寫成分數：投進的次數在上，全部的次數在下。'),
    nameSay: `把「投進的次數」和「全部投球的次數」相比，進 3 次、投 5 次，用 3/5 表示。<br>像這樣用分數（或小數）表示一個量和另一個量相比的結果，叫作${T('比率')}。這一題是部分和全部相比。`,
    pick: [['投進的比率是 5/3。', '進 3 球、投 5 球，投進的比率是 3/5。', '比率一定比 1 小。'], 1, ['5/3 是把全部放在上面；這題問的是投進的次數和全部相比。', '', '比率也可以比 1 大，例如今年的人數和去年的人數相比。']],
    pose: pose('story', '哪一個問題在問比率？', ['10 顆種子有 7 顆發芽，發芽的占全部的幾分之幾？', '10 顆種子又買 7 顆，共幾顆？', '7 顆種子分給 10 人。'], 0, ['', '這是相加，不是相比。', '這是平均分，不是兩個量相比。'], '對了！發芽的和全部相比：7/10。'),
    check: { q: '投 10 次進 4 次，投進的比率是多少？', pic: () => cBar(10, 4, '#3fae5a'), opts: ['4/10', '10/4', '4/14'], a: 0, hint: '回到投球那一步：投進的次數在上，全部的次數在下。', hints: ['', '10/4 把全部放在上面了。', '4/14 把進的和投的加起來；全部只有 10 次。'], ok: '對了，投進 4 次和全部 10 次相比：4/10。' } }),

  mk({ key: 'percent', title: '百分率', term: '百分率', who: 'mimi', game: 'ratio', when: ['ratio:paint', 'ratio:to100', 'ratio:part'], board: 'counter',
    hook: '一條長條平均分成 10 份，塗了 3 份，是 3/10。如果改用 100 格的板子來塗呢？', hookPic: () => cBar(10, 3, '#6ea8dc'),
    mh: '每點一下塗一排 10 格。3/10 的每 1 份，在 100 格的板子上是 10 格。',
    rounds: [cnt(3, k => `<div class="tap5w" data-t="x">${hundred(k * 10)}</div>`, k => `塗了 ${k * 10} 格`, '100 格塗 30 格：3/10＝30/100。', '看我做：3/10 塗到 100 格的板子上。點板子，一次塗一排 10 格。'), cnt(5, k => `<div class="tap5w" data-t="x">${hundred(k * 10)}</div>`, k => `塗了 ${k * 10} 格`, '100 格塗 50 格：5/10＝50/100，正好一半。', '一起做：5/10，塗 5 排。'), cnt(2, k => `<div class="tap5w" data-t="x">${hundred(k * 10)}</div>`, k => `塗了 ${k * 10} 格`, '100 格塗 20 格：2/10＝20/100。', '換你做：2/10，塗 2 排。', ['先預測：塗 2 排是 100 格裡的幾格？', ['2 格', '20 格'], 1])],
    fade: step3(people10(3), '10 個人裡有 3 個人贊成，是 3/10。全部不是 100 個人。', hundred(30), '改用 100 格表示：每 1 個人變成一排 10 格，塗 30 格。', `<div class="eq5"><span class="fr5">${K(3, C2)}<i></i>${K(10, C1)}</span>＝<span class="fr5">${K(30, C2)}<i></i>${K(100, C1)}</span></div><div class="trail">分子、分母都乘 10，變成分母是 100 的分數</div>`, '寫成分數：分母改成 100。'),
    nameSay: `把一個比率改寫成分母是 100 的分數，例如 3/10＝30/100，再寫成 30%，這叫作${T('百分率')}。<br>% 讀作「百分之」；全部不一定剛好是 100 個。`,
    pick: [['30% 就是 30 個人。', '30% 表示每 100 份中的 30 份。', '20% 就是每 100 份取 2 份。'], 1, ['10 個人裡 3 人贊成也是 30%，不一定是 30 個人。', '', '20% 是每 100 份取 20 份；每 100 份取 2 份是 2%。']],
    pose: pose('change', '100 顆種子有 20 顆發芽。改成 50 顆種子有 10 顆發芽，發芽的種子占全部種子的百分率會變嗎？', ['不會變，都是 20%', '會變'], 0, ['', '10/50 分子分母都乘 2 是 20/100，和原來一樣。'], '對了！10/50＝20/100＝20%。'),
    check: { q: '一盒 10 顆種子，有 2 顆發芽。發芽的種子占全部種子的百分率是多少？', pic: () => cBar(10, 2, '#3fae5a'), opts: ['2%', '20%', '80%'], a: 1, hint: '回到塗百格板那一步：2/10 改寫成分母是 100 的分數。', hints: ['2 是顆數；2/10 要先改寫成 20/100。', '', '80% 是沒有發芽的種子。'], ok: '對了，2/10＝20/100＝20%。全部只有 10 顆也能用百分率。' } }),

  mk({ key: 'discount', title: '打折', term: '打折', who: 'mimi', game: 'ratio', when: ['ratio:off'], board: 'counter',
    hook: '一件標價 100 元的玩具在特價，只要付原價的一部分。要付多少？', hookPic: () => '<div class="u-big">🏷️</div>',
    mh: '把原價平均分成 10 份，每點一下就有一份不用付。看藍色剩下幾份。',
    rounds: [1, 2, 3].map((n, i) => cnt(n, k => `<div class="tap5w" data-t="x">${cBar(10, 10 - k, '#6ea8dc')}</div><div class="trail">藍色是要付的，每份 10 元</div>`, k => `少付 ${k} 份，付 ${10 - k} 份`, `原價平均分成 10 份，付 ${10 - n} 份，是 ${(10 - n) * 10} 元。`, ['看我做：把 100 元平均分成 10 份，點一份不用付。', '一起做：兩份不用付。', '換你做：三份不用付。'][i], i === 2 ? ['先預測：付 7 份是幾元？', ['30 元', '70 元'], 1] : null)),
    fade: step3('<div class="u-big">🏷️</div>', '標價 100 元。', cBar(10, 8, '#6ea8dc'), '把原價平均分成 10 份，付 8 份。', `<div class="eq5">${K(100, C1)}×<span class="fr5">${K(8, C2)}<i></i>10</span>＝${K(80, C3)}</div><div class="trail">${lit('紅：原價', C1)}　${lit('藍：付 10 份裡的幾份', C2)}　${lit('綠：要付的錢', C3)}</div>`, '寫成算式。'),
    nameSay: `只付原價的十分之幾，叫作${T('打折')}。付 8/10 就是打 8 折，也就是付原價的 80%，省下 20%。`,
    pick: [['8 折是便宜 8 元。', '8 折是付原價的 8/10。', '8 折比 9 折貴。'], 1, ['便宜多少要看原價：100 元打 8 折是便宜 20 元。', '', '8 折付 8/10，9 折付 9/10，8 折比較便宜。']],
    pose: pose('can', '一件衣服打 8 折，要付多少錢？', ['夠，80 元', '不夠，還要知道原價', '夠，8 元'], 1, ['80 元只在原價 100 元時才對。', '', '8 元不是 8 折的意思。'], '對了！要先知道原價。'),
    check: { q: '200 元的衣服打 9 折，要付幾元？', pic: () => cBar(10, 9, '#6ea8dc'), opts: ['20 元', '180 元', '190 元'], a: 1, hint: '回到平均分成 10 份那一步：每份 20 元，付 9 份。', hints: ['20 元是原價的 1/10，也就是省下的錢。', '', '190 元是只少付 10 元；要少付 200 的 1/10，也就是 20 元。'], ok: '對了，每份 20 元，付 9 份：200×9/10＝180 元。' } }),

  mk({ key: 'cheng', title: '成數', term: '成數', who: 'mimi', game: 'ratio', when: ['ratio:cheng'], board: 'counter',
    hook: '果園裡有 10 棵一樣的樹，數數看有幾棵結了果子。', hookPic: () => trees(10, 0),
    mh: '每點一下，就有一棵樹結果（打上圓點）。數一數 10 棵裡有幾棵。',
    rounds: [2, 4, 6].map((n, i) => cnt(n, k => `<div class="tap5w" data-t="x">${trees(10, k)}</div>`, k => `10 棵裡 ${k} 棵結果`, `10 棵裡 ${n} 棵結果，是 ${n}/10。`, ['看我做：點樹，結果子了。', '一起做：數到 4 棵。', '換你做：數到 6 棵。'][i], i === 2 ? ['先預測：6 棵結果，沒結果的有幾棵？', ['4 棵', '6 棵'], 0] : null)),
    fade: step3(trees(10, 6), '10 棵裡 6 棵結果。', cBar(10, 6, '#3fae5a'), '畫成 10 格的長條。', `<div class="eq5"><span class="fr5">${K(6, C3)}<i></i>${K(10, C2)}</span>＝60%</div><div class="trail">${lit('綠 6：結果的', C3)}　${lit('藍 10：全部平均分成 10 份', C2)}</div>`, '寫成分數和百分率。'),
    nameSay: `把全部平均分成 10 份，用「幾成」來說其中的幾份：1 成是 1/10，6 成是 6/10，也就是 60%。<br>這種說法叫作${T('成數')}。`,
    pick: [['6 成就是 6 個。', '6 成是 6/10，也就是 60%。', '6 成是 100 份裡的 6 份。'], 1, ['20 棵樹的 6 成是 12 棵，不一定是 6 個。', '', '100 份裡的 6 份是 6%；6 成是 60%。']],
    pose: pose('story', '哪一個情況可以用「3 成」來說？', ['10 個人有 3 個人戴眼鏡', '3 個人去公園', '30 個人分 10 組'], 0, ['', '只有人數，沒有和全部相比。', '這是分組，不是占全部的幾份。'], '對了！10 份裡的 3 份。'),
    check: { q: '圖書館有 100 本書，借出 3 成，是幾本？', pic: () => cBar(10, 3, '#3fae5a'), opts: ['3 本', '30 本', '70 本'], a: 1, hint: '回到 10 份那一步：100 本平均分成 10 份，每份 10 本，3 份是幾本？', hints: ['3 是成數；3 成是 3/10，100 本的 3/10 是 30 本。', '', '70 本是沒有借出去的。'], ok: '對了，每份 10 本，3 份是 30 本。' } }),

  mk({ key: 'capacity', title: '容積', term: '容積', who: 'turtle', game: 'capacity', when: ['capacity:inner', 'capacity:level', 'capacity:rock', 'capacity:over'], board: 'counter',
    hook: '這是一個方形杯子的切面圖，杯壁很厚：外面量 8 公分寬，裡面量 6 公分寬。', hookPic: () => capPic(0),
    guess: ['水能裝到 8 公分寬嗎？', ['能', '不能'], 1],
    mh: '每點一下倒一層水。看藍色的水最寬到哪裡。',
    rounds: [2, 3, 5].map((n, i) => cnt(n, capCup, k => `倒了 ${k} 層`, '水會碰到內壁，但杯壁本身占去的地方裝不進水，水只有 6 公分寬。', ['看我做：一層一層倒水。', '一起做：我先倒，你接著倒。', '換你做：倒到快滿。'][i], i === 2 ? ['先預測：水最寬能到幾公分？', ['6 公分', '8 公分'], 0] : null)),
    reveal: '外面 8 公分，可是兩邊的杯壁占了地方，水只有 6 公分寬。', revealPic: () => capPic(3),
    fade: step3(capPic(4), '真的杯子，倒了水。', `<svg class="g5" style="max-height:140px" viewBox="0 0 240 150"><rect x="40" y="10" width="160" height="130" fill="#c9a36a"/><rect x="60" y="10" width="120" height="110" fill="#a9d0f0"/><text x="120" y="70" text-anchor="middle" class="ax" style="fill:${C2}">裡面</text></svg>`, '簡圖：藍色是裡面的空間。', `<div class="eq5">${K('裡面的長', C2)}×${K('裡面的寬', C2)}×${K('裡面的高', C2)}</div>`, '長方體容器：量裡面的長、寬、高。'),
    nameSay: `容器內部能容納東西的空間大小，叫作${T('容積')}。長方體容器的容積＝內部的長×寬×高。`,
    pick: [['容積要量外面。', '容積是容器內部能容納的空間大小。', '容積和表面積一樣。'], 1, ['外面包含杯壁，杯壁的地方裝不進水。', '', '表面積是外表的面積；容積是裡面的空間。']],
    pose: pose('change', '外面大小一樣的杯子，杯壁改得更厚，容積會變嗎？', ['變大', '變小', '不變'], 1, ['杯壁變厚，裡面的空間變小，不會變大。', '', '杯壁占的地方變多了，裡面變小。'], '對了！裡面變小，容積就變小。'),
    check: { q: '長方體魚缸，內部長 10、寬 10、高 5 公分，容積是多少立方公分？', pic: () => capPic(3), opts: ['25', '500', '1000'], a: 1, hint: '回到倒水那一步：量的是裡面，長×寬×高。', hints: ['10＋10＋5 是相加；容積要相乘。', '', '1000 是內部高 10 公分時；這裡內部高只有 5 公分。'], ok: '對了，內部長×寬×高：10×10×5＝500 立方公分。' } }),
);
SEGS.push(
  solidSeg({ key: 'prism', term: '角柱', type: 'prism', right: ['tent', 'box', 'pencil'], hook: '把帳篷、鞋盒、沒削的鉛筆想成理想的模型。它們的形狀有什麼一樣？', mh: '看兩件事：有沒有上下兩個一樣的多邊形底面？從上到下是不是一樣粗？',
    rounds: [[['tent', 'can', 'pyr'], ['tent'], '哪一個有兩個一樣的多邊形底面、上下一樣粗？'], [['box', 'pencil', 'cone', 'ball'], ['box', 'pencil'], '找出全部有兩個一樣的多邊形底面、上下一樣粗的。'], [['tent', 'pipe', 'roof', 'pencil'], ['tent', 'pencil'], '再找一次。', ['先預測：水管是不是？', ['是', '不是，它的底面是圓'], 1]]],
    sort: [['鞋盒', 0], ['帳篷（橫放）', 0], ['罐頭', 1], ['金字塔', 1]], bin: '兩個多邊形底面、上下一樣粗', sortDone: '鞋盒、帳篷是；罐頭的底面是圓，金字塔只有一個底面。', fade: ['簡圖：上下兩個一樣大的底面。', `${lit('底面', C4)}：三角形、四邊形、六邊形<br>${lit('側面', C2)}：長方形`, '寫出底面和側面的形狀。'],
    nameSay: `有兩個互相平行、形狀和大小都相同的多邊形底面，側面都是長方形的立體，叫作${T('角柱')}。（這裡先看側面和底面垂直的角柱。）`,
    pick: [['角柱的底面是圓。', '角柱有兩個互相平行、一樣大的多邊形底面。', '角柱頂端是尖的。'], 1, ['底面是圓的是另一種立體。', '', '頂端尖的只有一個底面，不是角柱。']],
    pose: pose('pic', '這張圖可以問什麼？', ['這個鞋盒是不是有兩個一樣的多邊形底面、上下一樣粗？', '鞋盒是什麼顏色？', '鞋子幾號？'], 0, ['', '顏色和形體無關。', '鞋子大小和盒子的形狀無關。'], '對了！問的是形狀。', () => solidSvg('prism', 4, 30, 20)),
    check: { q: '沒削的鉛筆，兩個底面都是六邊形、上下一樣粗。它是什麼？', pic: () => solidSvg('prism', 6, 30, 20), opts: ['角柱', '角錐'], a: 0, hint: '回到找形狀那一步：有幾個底面？上下一樣粗嗎？', hints: ['', '角錐只有一個底面，頂端是尖的；鉛筆上下一樣粗。'], ok: '對了，兩個六邊形底面、上下一樣粗：六角柱。' } }),
  solidSeg({ key: 'cylinder', term: '圓柱', type: 'cyl', right: ['can', 'pipe'], hook: '罐頭、一段水管，外形都近似同一種立體。它們的形狀有什麼一樣？', mh: '看兩件事：底面是不是圓？有沒有上下兩個一樣大的底面？',
    rounds: [[['can', 'box', 'cone'], ['can'], '哪一個有上下兩個一樣大的圓形底面？'], [['pipe', 'tent', 'ball', 'can'], ['pipe', 'can'], '找出全部。'], [['hat', 'can', 'pencil'], ['can'], '再找一次。', ['先預測：派對帽是不是？', ['是', '不是，它往上變尖'], 1]]],
    sort: [['罐頭', 0], ['一段水管', 0], ['甜筒形積木', 1], ['足球', 1]], bin: '兩個圓形底面、上下一樣粗', sortDone: '罐頭、水管是；甜筒形積木往上變尖，足球沒有平平的底面。', fade: ['簡圖：上下兩個一樣大的圓。', `${lit('底面', C4)}：圓<br>${lit('側面', C2)}：攤開是長方形`, '寫出底面和側面。'],
    nameSay: `有兩個互相平行、大小相同的圓形底面，側面攤開是長方形的立體，叫作${T('圓柱')}。罐頭、水管的外形近似它。`,
    pick: [['圓柱的頂端是尖的。', '圓柱有上下兩個一樣大的圓形底面。', '圓柱的底面是三角形。'], 1, ['頂端尖的只有一個底面。', '', '底面是多邊形的是角柱。']],
    pose: pose('change', '罐頭的上面改成收成一個尖點，還是同一種立體嗎？', ['還是', '不是了'], 1, ['上面變尖就只剩一個底面，上下也不一樣粗了。', ''], '對了！只改一個地方，形體就不一樣了。'),
    check: { q: '一個水塔，上下兩個底面是一樣大的圓、從上到下一樣粗。它的外形近似什麼立體？', pic: () => solidSvg('cyl', 0, 30, 20), opts: ['圓柱', '圓錐'], a: 0, hint: '回到找形狀那一步：有幾個圓形底面？', hints: ['', '圓錐只有一個底面，頂端尖；水塔上下一樣粗。'], ok: '對了，兩個一樣大的圓形底面、上下一樣粗：圓柱。' } }),
  solidSeg({ key: 'pyramid', term: '角錐', type: 'pyr', right: ['pyr', 'roof'], hook: '金字塔、尖屋頂，它們的形狀有什麼一樣？', mh: '看兩件事：底面是不是多邊形？側面是不是都交會在同一個尖點？',
    rounds: [[['pyr', 'box', 'can'], ['pyr'], '哪一個底面是多邊形、側面交會在一個尖點？'], [['roof', 'tent', 'cone', 'pyr'], ['roof', 'pyr'], '找出全部。'], [['hat', 'pyr', 'pencil'], ['pyr'], '再找一次。', ['先預測：派對帽是不是？', ['是', '不是，它的底面是圓'], 1]]],
    sort: [['金字塔', 0], ['尖屋頂', 0], ['甜筒形積木', 1], ['鞋盒', 1]], bin: '多邊形底面、頂端尖', sortDone: '金字塔、尖屋頂是；甜筒形積木的底面是圓，鞋盒沒有尖點。', fade: ['簡圖：一個底面，側面交會在一個尖點。', `${lit('底面', C4)}：多邊形<br>${lit('側面', C2)}：三角形`, '寫出底面和側面。'],
    nameSay: `有一個多邊形底面，各個三角形側面交會在同一個頂點的立體，叫作${T('角錐')}。`,
    pick: [['角錐有兩個底面。', '角錐只有一個多邊形底面，側面交會在一個頂點。', '角錐的底面是圓。'], 1, ['有兩個底面的是柱體。', '', '底面是圓、頂端尖的是另一種立體。']],
    pose: pose('story', '哪一個東西的外形是角錐？', ['四個側面都是三角形、底面是正方形的金字塔', '底面是圓的甜筒形積木', '長長的沒削的鉛筆'], 0, ['', '它的底面是圓，不是多邊形。', '鉛筆上下一樣粗，沒有尖點。'], '對了！多邊形底面，側面交會在一個頂點。'),
    check: { q: '一個尖屋頂，底面是三角形、側面都交會在一個尖點。它是什麼？', pic: () => solidSvg('pyr', 3, 30, 20), opts: ['角柱', '角錐'], a: 1, hint: '回到找形狀那一步：有幾個底面？頂端尖嗎？', hints: ['角柱有兩個底面、上下一樣粗；這個頂端是尖的。', ''], ok: '對了，一個三角形底面、頂端尖：三角錐。' } }),
  solidSeg({ key: 'cone', term: '圓錐', type: 'cone', right: ['cone', 'hat'], hook: '甜筒形積木、派對帽（派對帽只有側面，外形像這種立體的側面），它們的形狀有什麼一樣？', mh: '看兩件事：底面是不是圓？側面是不是向一個尖點收攏？',
    rounds: [[['cone', 'can', 'pyr'], ['cone'], '哪一個底面是圓、側面向一個尖點收攏？'], [['hat', 'ball', 'cone', 'roof'], ['hat', 'cone'], '找出全部。'], [['pipe', 'hat', 'tent'], ['hat'], '再找一次。', ['先預測：水管是不是？', ['是', '不是，它沒有尖點'], 1]]],
    sort: [['甜筒形積木', 0], ['派對帽的外形', 0], ['金字塔', 1], ['罐頭', 1]], bin: '圓形底面、頂端尖', sortDone: '甜筒形積木、派對帽的外形是；金字塔的底面是正方形，罐頭上下一樣粗。', fade: ['簡圖：一個圓形底面，側面收攏成一個尖點。', `${lit('底面', C4)}：圓<br>${lit('側面', C2)}：攤開是扇形`, '寫出底面和側面。'],
    nameSay: `有一個圓形底面，側面向同一個頂點收攏的立體，叫作${T('圓錐')}。（這裡先看頂點在底面圓心正上方的圓錐。）`,
    pick: [['圓錐的底面是正方形。', '圓錐有一個圓形底面，側面向一個頂點收攏。', '圓錐上下一樣粗。'], 1, ['底面是正方形、頂端尖的是四角錐。', '', '上下一樣粗、兩個圓形底面的是圓柱。']],
    pose: pose('can', '一頂帽子的外形是不是圓錐？只知道它是紅色的。', ['夠，能判斷', '不夠，還要知道它的形狀'], 1, ['顏色不決定形狀。', ''], '對了！要看底面和側面的形狀。'),
    check: { q: '一個甜筒形積木，底面是圓，側面向一個尖點收攏。它是什麼立體？', pic: () => solidSvg('cone', 0, 30, 20), opts: ['角錐', '圓錐'], a: 1, hint: '回到找形狀那一步：底面是什麼形狀？', hints: ['角錐的底面是多邊形；這個底面是圓。', ''], ok: '對了，圓形底面、頂端尖：圓錐。' } }),
);

/* ---------- 單位教室開場：一個單位一段 ---------- */
const UL = (key, term, who, o) => mk({ key: 'u_' + key, title: '單位教室', term, who, game: 'line', when: [], board: 'counter', ...o });
const tapDraw = (pic, label) => k => `<div class="tap5w" data-t="x" style="display:block">${pic(k)}</div><div class="pile6"><small>${label}</small></div>`;
const turnPic = k => protractor(30 * k, { knob: 30 * k });
const tilesPic = (cols, rows, e) => k => `<div class="rows6">${Array.from({ length: rows }, (_, r) => `<div class="row6">${em(e, Math.max(0, Math.min(cols, k - r * cols)))}${'<span class="em5" style="opacity:.2">⬜</span>'.repeat(Math.max(0, cols - Math.max(0, Math.min(cols, k - r * cols))))}</div>`).join('')}</div>`;
const lessonCnt = (ns, draw, st, res, says, predict, mh) => ns.map((n, i) => cnt(n, draw(n), st, res(n), says[i], i === 2 ? predict : null, mh));
const ucheck = (q, pic, opts, a, hint, ok, hints) => ({ q, pic, opts, a, hint, ok, hints });
// 秒針錶面：s 秒（圖上快轉）
const secDial = s => { const P = (deg, l) => [100 + l * Math.sin(deg * Math.PI / 180), 100 - l * Math.cos(deg * Math.PI / 180)], d = (s % 60) * 6, full = s > 0 && s % 60 === 0; let h = '<svg class="clock4" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="#fff" stroke="#33405a" stroke-width="4"/>'; if (full) h += '<circle cx="100" cy="100" r="80" fill="#ffe3a3"/>'; else if (d) { const [x, y] = P(d, 80); h += `<path d="M100 100L100 20A80 80 0 ${d > 180 ? 1 : 0} 1 ${x} ${y}Z" fill="#ffe3a3"/>`; } for (let i = 0; i < 60; i++) { const [a, b] = P(i * 6, 92), [c, e] = P(i * 6, i % 5 ? 86 : 80); h += `<line x1="${a}" y1="${b}" x2="${c}" y2="${e}" stroke="#33405a" stroke-width="${i % 5 ? 1 : 2}"/>`; } for (let i = 1; i <= 12; i++) { const [x, y] = P(i * 30, 66); h += `<text x="${x}" y="${y + 6}" text-anchor="middle" class="pt" style="font-size:15px">${i * 5}</text>`; } const [hx, hy] = P(d, 84); return h + `<line x1="100" y1="100" x2="${hx}" y2="${hy}" stroke="#d6476b" stroke-width="3"/><circle cx="100" cy="100" r="5" fill="#33405a"/></svg>`; };
// 有刻度的量杯：v 小格的水，最多 30 小格
const mcup = v => { let s = `<svg class="g5" style="max-height:190px" viewBox="0 0 200 200"><rect x="70" y="${180 - v * 5}" width="60" height="${v * 5}" fill="#a9d0f0"/><path d="M70 20V180H130V20" fill="none" stroke="#33405a" stroke-width="3"/>`; for (let i = 1; i <= 30; i++) { const y = 180 - i * 5; s += `<line x1="130" x2="${i % 5 ? 136 : 142}" y1="${y}" y2="${y}" stroke="#33405a"/>`; if (i % 5 === 0) s += `<text x="146" y="${y + 4}" class="ax" style="font-size:12px">${i}</text>`; } return s + '</svg>'; };
// 每邊 1 公尺的框，搭好以後框裡的空間半透明
const m3Frame = k => { const base = labPic({ view: 'frame', each: 1 }, k); return k >= 12 ? base.replace('</svg>', '<polygon points="60,150 190,150 240,120 240,10 110,10 60,40" fill="#a9d0f0" fill-opacity=".35"/><text x="150" y="90" text-anchor="middle" class="ax">1 公尺</text></svg>') : base; };
const DAYT = ['上午 8 點', '下午 2 點', '晚上 8 點', '凌晨 2 點', '隔天上午 8 點'];
const dayPic = k => `<div class="pics5" style="flex-wrap:wrap;gap:4px">${DAYT.slice(0, Math.min(k, 4) + 1).map((t, i) => `<span class="t5 ${i === Math.min(k, 4) ? 'on' : ''}" style="font-size:14px;padding:2px 6px">${t}</span>`).join('→')}</div>${k > 4 ? `<div class="trail">又過了 ${(k - 4) * 6} 小時</div>` : ''}`;
Object.assign(LESSON_STORY, {
  deg: [UL('deg', '度', 'goat', { hook: '先看一個直角：書本的角，或是門扇打開到和關閉的位置成直角。', hookPic: () => protractor(90, { knob: 90 }),
    rounds: lessonCnt([2, 3, 6], n => tapDraw(turnPic, '點量角器，轉 30 小格'), k => `轉了 ${30 * k} 小格`, n => `轉了 ${30 * n} 小格。`, ['看我做：一整圈平均分成 360 小格，量角器是半圈，有 180 小格。我一次轉 30 小格。', '一起做：轉到和書本的角一樣大。', '換你做：轉到兩邊成一條直線。'], ['先預測：成一條直線是幾小格？', ['90', '180', '360'], 1], '每點一下轉 30 小格。看藍色的邊轉到量角器上的哪個數。'),
    fade: step3('<div class="u-big">🚪</div>', '門扇和關閉的位置成直角。', protractor(90, { knob: 90 }), '量角器上轉 90 小格。', `<div class="eq5">一圈 ${K(360, C1)} 份，1 份是 1　直角 ${K(90, C2)} 份</div>`, '寫成數字。'),
    nameSay: `把一整圈平均分成 360 份，每一份的角是 1 ${T('度')}。直角是 90 度，平角是 180 度。`, pick: [['一圈是 100 度。', '一圈是 360 度，直角是 90 度。', '直角是 180 度。'], 1, ['一圈是平均分成 360 份，不是 100 份。', '', '180 度是平角（一條直線），直角是它的一半。']],
    pose: pose('story', '哪一個問題要用角的大小來回答？', ['門扇打開了多大？', '門有多高？', '門多重？'], 0, ['', '高是長度，不是角的大小。', '重是重量，不是角的大小。'], '對了！問的是張開多大。'),
    check: ucheck('3 點整時，時針和分針所夾的較小的角是幾度？', () => clock2(3, 0), ['30 度', '90 度', '180 度'], 1, '回到轉量角器那一步：鐘面一圈 12 大格，1 大格是 30 度。', '對了，兩針差 3 大格：3×30＝90 度，是直角。', ['30 度只有 1 大格；3 點時兩針差 3 大格。', '', '180 度是兩針成一直線，像 6 點整。']) })],
  m2: [UL('cm2', '平方公分', 'sheep', { hook: '兩張卡片哪一張比較大？可以疊在一起比，也可以數一數能鋪幾個一樣大的小方格。', hookPic: () => '<div class="u-big">🧽📒</div>',
    rounds: lessonCnt([4, 6, 9], n => tapDraw(tilesPic(n === 4 ? 2 : 3, n === 9 ? 3 : 2, '🟩'), '點一下鋪一小格（邊長 1 公分）'), k => `鋪了 ${k} 小格`, n => `鋪滿 ${n} 小格，沒有重疊、沒有空隙。`, ['看我做：用邊長 1 公分的小方格，把橡皮擦的一面鋪滿。', '一起做：便條紙的一面。', '換你做：一張小貼紙。'], ['先預測：3 排、每排 3 格，共幾格？', ['6', '9'], 1], '一格一格鋪，不重疊、不留空隙。數一數一共鋪了幾格。'),
    fade: step3('<div class="u-big">🧽</div>', '橡皮擦的一面。', tilesPic(3, 2, '🟩')(6), '鋪滿 6 小格。', `<div class="eq5">${K(6, C3)} 個小方格（邊長 ${K('1 公分', C1)}）</div>`, '寫成數字。'),
    nameSay: `邊長 1 公分的正方形，面積是 1 ${T('平方公分')}。橡皮擦這一面鋪滿 6 格，就是 6 平方公分。`, pick: [['1 平方公分是一條 1 公分的線。', '1 平方公分是邊長 1 公分的正方形那麼大。', '1 平方公分和一張桌子一樣大。'], 1, ['1 公分是長度；平方公分量的是一片面有多大。', '', '桌面要鋪很多很多小方格。']],
    pose: pose('can', '一張長方形卡片長 8 公分，面積是多少？', ['夠', '不夠，還要知道寬'], 1, ['只知道一邊，不知道要鋪幾排。', ''], '對了！長和寬都知道，才知道鋪幾格。'),
    check: ucheck('一張郵票剛好鋪滿 4 個邊長 1 公分的小方格，沒有重疊、沒有空隙。它的面積是多少？', () => tilesPic(2, 2, '🟩')(4), ['4 公分', '4 平方公分', '2 平方公分'], 1, '回到鋪小方格那一步：鋪了幾格？每格多大？', '對了，鋪了 4 格，每格 1 平方公分：4 平方公分。', ['公分是長度單位；面積要用平方公分。', '', '2 是一邊的格數；共有 2×2＝4 格。']) }),
    UL('m2', '平方公尺', 'sheep', { hook: '小東西用邊長 1 公分的小方格鋪。教室地板如果用小方格，要鋪非常多格。', hookPic: () => '<div class="u-big">🏫</div>',
    rounds: lessonCnt([2, 4, 6], n => tapDraw(tilesPic(n === 2 ? 2 : n === 4 ? 2 : 3, n === 2 ? 1 : 2, '🟫'), '點一下鋪一大塊（邊長 1 公尺）'), k => `鋪了 ${k} 大塊`, n => `鋪了 ${n} 大塊。`, ['看我做：用邊長 1 公尺的大地墊鋪地板。', '一起做：鋪走廊。', '換你做：鋪舞台。'], ['先預測：邊長 1 公尺的大地墊，一邊可以排幾個 1 公分？', ['10 個', '100 個'], 1], '一大塊一大塊鋪，數一數鋪了幾塊。'),
    fade: step3(`<svg class="g5" style="max-height:130px" viewBox="0 0 200 150"><rect x="50" y="20" width="100" height="100" fill="#e8d3b0" stroke="#7a5b2e" stroke-width="3" stroke-dasharray="8 5"/><text x="100" y="140" text-anchor="middle" class="ax">1 公尺</text><text x="165" y="75" class="ax">1 公尺</text></svg>`, '在地上用膠帶圍出邊長 1 公尺的正方形，看看它占多大的地面。', tilesPic(3, 2, '🟫')(6), '舞台鋪了 6 大塊。', `<div class="eq5">${K(6, C1)} 大塊（邊長 ${K('1 公尺', C2)}）</div>`, '寫成數字。'),
    nameSay: `邊長 1 公尺的正方形，面積是 1 ${T('平方公尺')}。<br>一邊排得下 100 個 1 公分，所以 1 平方公尺＝100×100＝10000 平方公分。`, pick: [['1 平方公尺和 1 平方公分一樣大。', '1 平方公尺是邊長 1 公尺的正方形那麼大，等於 10000 平方公分。', '1 平方公尺是一條 1 公尺的線。'], 1, ['大地墊一邊就排得下 100 個 1 公分，差很多。', '', '1 公尺是長度；平方公尺量的是一片面有多大。']],
    pose: pose('change', '同一間教室，改用平方公分來量，數字會變大還是變小？', ['變大', '變小'], 0, ['', '小方格比較小，要鋪更多格，數字會變大。'], '對了！單位越小，要的格數越多。'),
    check: ucheck('邊長 1 公尺的正方形，面積是多少平方公分？', () => '<div class="u-big">🟫</div>', ['100', '1000', '10000'], 2, '回到大地墊那一步：一邊排 100 個 1 公分，要排幾排？', '對了，100 排、每排 100 格：100×100＝10000 平方公分。', ['100 只是一排；要排 100 排。', '1000 少了一個 0：100×100 是 10000。', '']) })],
  time: [UL('sec', '秒', 'raccoon', { hook: '跟著「滴、滴、滴」的節拍拍手，每一聲之間的時間都一樣長。', hookPic: () => '<div class="u-big">👏</div>',
    rounds: lessonCnt([3, 5, 10], n => tapDraw(k => `<div class="pics5">${'👏'.repeat(k)}</div>`, '跟著節拍拍手'), k => `拍了 ${k} 下`, n => `拍了 ${n} 下，每兩下之間一樣長。`, ['看我做：滴、滴、滴，每響一聲拍一下。', '一起做：拍 5 下。', '換你做：拍 10 下，盡量跟上一樣的節拍。'], ['先預測：拍 10 下，比拍 5 下久嗎？', ['久', '一樣'], 0], '跟著一樣的節拍，一下一下點。').map(r => ({ ...r, p: { ...r.p, ms: 1000 } })),
    fade: step3('<div class="u-big">👏</div>', '跟著節拍拍一下手。', secDial(1), '碼表上，最細的那根針走一小格。', `<div class="eq5">相鄰兩聲 ＝ 最細的針走 ${K(1, C1)} 小格</div>`, '對起來。'),
    nameSay: `跟著每秒一次的節拍拍手，相鄰兩聲之間的時間是 1 ${T('秒')}。`, pick: [['1 秒很長，像一節課。', '1 秒大約是跟著節拍拍一下手的時間。', '1 秒是一天。'], 1, ['一節課有很多很多秒。', '', '一天有 86400 秒。']],
    pose: pose('story', '哪一個用「秒」來說最合適？', ['跑 50 公尺要多久', '暑假有多久', '睡覺要多久'], 0, ['', '暑假很長，用秒說數字太大。', '睡覺好幾個小時，用秒說數字太大。'], '對了！很短的時間用秒。'),
    check: ucheck('好好洗手大約要多久？', () => '<div class="u-big">🧼</div>', ['30 秒', '30 天'], 0, '回到拍手那一步：大約拍 30 下的時間。', '對了，洗手大約 30 秒。', ['', '30 天是一個月左右，太長了。']) }),
    UL('min', '分鐘', 'raccoon', { hook: '泡一碗泡麵要等一段時間，用秒來數會數很多下。', hookPic: () => '<div class="u-big">🍜</div>',
    rounds: lessonCnt([3, 6, 9], n => tapDraw(k => secDial(k * 20), '點一下，秒針前進 20 秒（圖上快轉，不用真的等）'), k => `過了 ${k * 20} 秒`, n => `過了 ${n * 20} 秒，秒針走了 ${n * 20 / 60} 圈。`, ['看我做：圖上一次快轉 20 秒，到 60 秒。', '一起做：到 120 秒。', '換你做：到 180 秒。'], ['先預測：180 秒是秒針走幾圈？', ['3 圈', '18 圈'], 0], '每點一下，秒針前進 20 秒。看秒針走一整圈是幾秒。'),
    fade: step3('<div class="u-big">🍜</div>', '泡麵要等。', secDial(60), '秒針走一整圈。', `<div class="eq5">${K(60, C1)} 秒 ＝ 秒針走 ${K('一圈', C2)}</div>`, '對起來。'),
    nameSay: `秒針走一整圈是 60 秒，叫作 1 ${T('分鐘')}。1 分鐘＝60 秒。`, pick: [['1 分鐘是 100 秒。', '1 分鐘是 60 秒。', '1 分鐘是 10 秒。'], 1, ['時間不是滿 100 才進一位；秒針一圈是 60 秒。', '', '10 秒只走了一圈的 1/6。']],
    pose: pose('change', '泡麵要 3 分鐘，改成 2 分鐘，要等的秒數會少多少？', ['少 60 秒', '少 1 秒'], 0, ['', '少的是 1 分鐘，1 分鐘是 60 秒。'], '對了！少 1 分鐘，就是少 60 秒。'),
    check: ucheck('120 秒是幾分鐘？', () => secDial(0), ['1 分鐘', '2 分鐘', '12 分鐘'], 1, '回到快轉秒針那一步：60 秒走一圈。', '對了，120 秒是秒針走 2 圈：2 分鐘。', ['60 秒才 1 分鐘，120 秒是 2 個 60 秒。', '', '12 是把 120 去掉一個 0；時間要用 60 秒一圈來算。']) }),
    UL('hr', '小時', 'raccoon', { hook: '一節課大約 40 分鐘；看一部電影比一節課久很多。', hookPic: () => '<div class="u-big">🎬</div>',
    rounds: lessonCnt([4, 4, 8], n => tapDraw(k => `<div class="vs">${clock2(2, k * 15)}</div>`, '點一下，分針（藍色長針）走 15 分鐘'), k => `過了 ${k * 15} 分鐘`, n => `過了 ${n * 15} 分鐘，分針走了 ${n / 4} 圈。`, ['看我做：從 2 點開始，分針一次走 15 分鐘，走一圈。', '一起做：再從 2 點走一圈。', '換你做：走兩圈。'], ['先預測：分針走兩圈是幾分鐘？', ['60', '120'], 1], '每點一下，藍色的分針走 15 分鐘。看分針走一整圈是幾分鐘，紅色的時針走了多少。'),
    fade: step3('<div class="u-big">🎬</div>', '看電影。', `<div class="vs">${clock2(2, 0)}${clock2(3, 0)}</div>`, '從 2 點到 3 點：分針走一整圈，時針走一大格。', `<div class="eq5">${K(60, C1)} 分鐘 ＝ 分針走 ${K('一圈', C2)}</div>`, '對起來。'),
    nameSay: `分針走一整圈是 60 分鐘，叫作 1 ${T('小時')}。1 小時＝60 分鐘。`, pick: [['1 小時是 100 分鐘。', '1 小時是 60 分鐘。', '1 小時是 60 秒。'], 1, ['時間不是滿 100 才進一位；分針一圈是 60 分鐘。', '', '60 秒是 1 分鐘。']],
    pose: pose('can', '小明看完電影是幾點？', ['夠', '不夠，還要知道開始的時間和電影多長'], 1, ['只知道去看電影，不知道從幾點開始、演多久。', ''], '對了！要知道從幾點開始、演多久。'),
    check: ucheck('一部電影大約要多久？', () => '<div class="u-big">🎬</div>', ['2 秒', '2 分鐘', '2 小時'], 2, '回到走分針那一步：一節課 40 分鐘，電影比一節課久很多。', '對了，電影大約 2 小時。', ['2 秒只夠拍兩下手。', '2 分鐘比泡麵還短。', '']) }),
    UL('day', '日', 'raccoon', { hook: '早上起床、中午吃飯、晚上睡覺，又到早上。', hookPic: () => '<div class="u-big">🌅🌞🌙</div>',
    rounds: lessonCnt([4, 4, 8], n => tapDraw(dayPic, '點一下，時間過 6 小時'), k => `過了 ${k * 6} 小時`, n => `過了 ${n * 6} 小時。`, ['看我做：從上午 8 點開始，一次過 6 小時，回到上午 8 點。', '一起做：再過一輪。', '換你做：過兩輪。'], ['先預測：兩輪是幾小時？', ['24', '48'], 1], '每點一下過 6 小時。看回到上午 8 點時，一共過了幾小時。'),
    fade: step3('<div class="u-big">🌅🌞🌙</div>', '上午 8 點 → 下午 2 點 → 晚上 8 點 → 凌晨 2 點 → 隔天上午 8 點。', dayBar(480, 480), '畫成一條 24 格的長條，從 8 點走一圈回到 8 點。', `<div class="eq5">${K(24, C1)} 小時 ＝ 從今天上午 8 點到明天上午 8 點</div>`, '對起來。'),
    nameSay: `24 小時叫作 1 ${T('日')}，例如從今天上午 8 點到明天上午 8 點。`, pick: [['1 日是 12 小時。', '1 日是 24 小時。', '1 日是 60 分鐘。'], 1, ['12 小時只到晚上 8 點，還沒回到隔天上午 8 點。', '', '60 分鐘是 1 小時。']],
    pose: pose('story', '哪一個用「日」來說最合適？', ['暑假有多長', '拍手要多久', '跑一圈操場要多久'], 0, ['', '拍手很短，用秒。', '跑一圈幾分鐘，用分鐘。'], '對了！很長的時間用日。'),
    check: ucheck('48 小時是幾日？', () => '<div class="u-big">📅</div>', ['2 日', '4 日', '24 日'], 0, '回到過 6 小時那一步：24 小時一輪。', '對了，48 小時是 2 個 24 小時：2 日。', ['', '4 日是 96 小時。', '24 是 1 日的小時數。']) })],
  land: [UL('are', '公畝', 'seal', { hook: '平方公尺你已經認識：邊長 1 公尺的正方形。蓋公園時，1 平方公尺的地墊要鋪非常多塊。', hookPic: () => '<div class="u-big">🏞️</div>',
    rounds: lessonCnt([2, 4, 6], n => tapDraw(k => mapSvg(3, 2, k), '點一下鋪一塊（邊長 10 公尺）'), k => `鋪了 ${k} 塊`, n => `鋪了 ${n} 塊大地毯，每塊 100 平方公尺。`, ['看我做：邊長 10 公尺的大地毯，一塊是 10×10＝100 平方公尺。', '一起做：鋪 4 塊。', '換你做：鋪 6 塊。'], ['先預測：6 塊是幾平方公尺？', ['60', '600'], 1], '每塊大地毯是 10×10＝100 平方公尺。數一數鋪了幾塊。'),
    fade: step3('<div class="u-big">🏞️</div>', '小公園。', mapSvg(3, 2, 6), '一格是邊長 10 公尺的正方形。', `<div class="eq5">10×10＝${K(100, C1)} 平方公尺 一塊　${K(6, C2)} 塊</div>`, '寫成數字。'),
    nameSay: `邊長 10 公尺的正方形，面積是 100 平方公尺，也就是 1 ${T('公畝')}。`, pick: [['1 公畝是 10 平方公尺。', '1 公畝是 100 平方公尺。', '1 公畝是 1 平方公尺。'], 1, ['邊長 10 公尺，面積是 10×10，不是 10。', '', '1 平方公尺是邊長 1 公尺；這塊邊長 10 公尺。']],
    pose: pose('change', '公園改成鋪 8 塊大地毯，是幾平方公尺？', ['80', '800'], 1, ['一塊是 100 平方公尺，不是 10。', ''], '對了！8×100＝800 平方公尺。'),
    check: ucheck('一塊菜園長 20 公尺、寬 10 公尺，是幾公畝？', () => mapSvg(2, 1, 2), ['2 公畝', '20 公畝', '200 公畝'], 0, '回到鋪大地毯那一步：每塊邊長 10 公尺，這塊要鋪幾塊？', '對了，20×10＝200 平方公尺，是 2 個 100 平方公尺：2 公畝。', ['', '20 是長度；面積是 200 平方公尺，是 2 公畝。', '200 是平方公尺的數；1 公畝是 100 平方公尺。']) }),
    UL('ha', '公頃', 'seal', { hook: '一塊邊長 10 公尺的大地毯是 1 公畝。大農場，要鋪好幾排。', hookPic: () => mapSvg(10, 1, 10),
    rounds: lessonCnt([3, 6, 10], n => tapDraw(k => mapSvg(10, 10, k * 10), '點一下鋪一排（10 公畝）'), k => `鋪了 ${k * 10} 公畝`, n => `鋪了 ${n * 10} 公畝。`, ['看我做：一次鋪一排 10 公畝。', '一起做：鋪 6 排。', '換你做：鋪滿 10 排。'], ['先預測：鋪滿是幾公畝？', ['10', '100'], 1], '每點一下鋪一排 10 塊（10 公畝）。數排數。'),
    fade: step3('<div class="u-big">🚜</div>', '大農場。', mapSvg(10, 10, 100), '邊長 100 公尺的正方形，鋪滿 100 塊。', `<div class="eq5">${K(100, C1)} 公畝 ＝ 100×100＝${K('10000 平方公尺', C2)}</div>`, '寫成數字。'),
    nameSay: `邊長 100 公尺的正方形，面積是 10000 平方公尺＝100 公畝，叫作 1 ${T('公頃')}。`, pick: [['1 公頃是 10 公畝。', '1 公頃是 100 公畝。', '1 公頃比 1 公畝小。'], 1, ['鋪滿要 10 排、每排 10 塊，是 100 塊。', '', '1 公頃要 100 塊公畝才鋪得滿，比公畝大。']],
    pose: pose('story', '哪一個用「公頃」來說最合適？', ['一所學校的校地有多大', '一張桌子有多大', '一張郵票有多大'], 0, ['', '桌子用平方公分或平方公尺。', '郵票用平方公分。'], '對了！很大的地用公頃。'),
    check: ucheck('邊長 100 公尺的正方形農地，面積是多少？', () => mapSvg(10, 10, 100), ['1 公畝', '1 公頃', '1 平方公里'], 1, '回到鋪 10 排那一步：鋪滿了幾公畝？', '對了，100×100＝10000 平方公尺＝1 公頃。一座足球場比 1 公頃小一些，可以拿來約略比較。', ['1 公畝只是其中一小格（邊長 10 公尺）。', '', '1 平方公里的邊長是 1000 公尺。']) }),
    UL('km2', '平方公里', 'seal', { hook: '1 公頃是邊長 100 公尺的正方形。一整個鄉鎮呢？', hookPic: () => '<div class="u-big">🏙️</div>',
    rounds: lessonCnt([3, 6, 10], n => tapDraw(k => mapSvg(10, 10, k * 10, '', { c: '#a9d0f0' }), '點一下鋪一排（10 公頃）'), k => `鋪了 ${k * 10} 公頃`, n => `鋪了 ${n * 10} 公頃。`, ['看我做：一次鋪一排 10 公頃。', '一起做：鋪 6 排。', '換你做：鋪滿。'], ['先預測：鋪滿時，一邊有幾公尺？', ['100 公尺', '1000 公尺'], 1], '每點一下鋪一排 10 塊（10 公頃）。每塊的邊長是 100 公尺。'),
    fade: step3('<div class="u-big">🏙️</div>', '一個鄉鎮的一部分。', mapSvg(10, 10, 100, '', { c: '#a9d0f0' }), '一邊 10 塊，每塊 100 公尺：邊長 1000 公尺＝1 公里。', `<div class="eq5">${K(100, C1)} 公頃 ＝ 邊長 ${K('1 公里', C2)} 的正方形</div>`, '寫成數字。'),
    nameSay: `邊長 1 公里的正方形，面積是 1 ${T('平方公里')}，等於 100 公頃。`, pick: [['1 平方公里是 10 公頃。', '1 平方公里是 100 公頃。', '1 平方公里是 1 公里。'], 1, ['鋪滿要 10 排、每排 10 公頃，是 100 公頃。', '', '1 公里是長度；平方公里量的是一片地有多大。']],
    pose: pose('can', '一塊長方形基地長 2 公里，面積是多少？', ['夠', '不夠，還要知道寬'], 1, ['只知道長，不知道寬，算不出面積。', ''], '對了！長方形面積要長和寬。'),
    check: ucheck('月球城的目標是 1 平方公里，是幾公頃？', () => '<div class="u-big">🌕</div>', ['10', '100', '1000'], 1, '回到鋪排那一步：鋪滿了幾公頃？', '對了，10 排、每排 10 公頃：100 公頃。', ['10 只是一排。', '', '1000 多了一個 0。']) })],
  ton: [UL('ton', '公噸', 'turtle', { hook: '一袋米大約 20 公斤，用公斤說很方便。工地吊車要吊起的鋼材就重很多。', hookPic: () => '<div class="u-big">🏗️</div>',
    rounds: lessonCnt([5, 5, 5], n => tapDraw(k => `<div class="pics5">${'🧱'.repeat(k)}</div><div class="u-count"><b class="num">${k * 200}</b> 公斤</div>`, '點一下，吊車吊上一捆 200 公斤的鋼材'), k => `${k * 200} 公斤`, n => '吊到 1000 公斤了。', ['看我做：一捆 200 公斤，吊到 1000 公斤。', '一起做：再吊一次。', '換你做：再吊到 1000 公斤。'], ['先預測：5 捆是幾公斤？', ['1000', '500'], 0], '每點一下加 200 公斤。數一數吊到 1000 公斤要幾捆。'),
    fade: step3('<div class="u-big">🏗️</div>', '吊車吊鋼材。', `<div class="pics5">${'🧱'.repeat(5)}</div>`, '5 捆，每捆 200 公斤。', `<div class="eq5">200×5＝${K(1000, C1)} 公斤</div>`, '數字太長，需要一個更大的單位。'),
    nameSay: `1000 公斤叫作 1 ${T('公噸')}。1 公噸＝1000 公斤。`, pick: [['1 公噸是 100 公斤。', '1 公噸是 1000 公斤。', '1 公噸比 1 公斤輕。'], 1, ['5 捆 200 公斤才到 1 公噸，是 1000 公斤。', '', '1 公噸是 1000 個 1 公斤，重很多。']],
    pose: pose('story', '哪一個用「公噸」來說最合適？', ['一輛砂石車多重', '一顆蘋果多重', '一本書多重'], 0, ['', '蘋果用公克。', '書用公克或公斤。'], '對了！很重的東西用公噸。'),
    check: ucheck('一頭大象大約 5000 公斤，是幾公噸？', () => '<div class="u-big">🐘</div>', ['5', '50', '500'], 0, '回到吊鋼材那一步：每 1000 公斤圈一堆，有幾堆？', '對了，5000 公斤是 5 個 1000 公斤：5 公噸。', ['', '50 公噸是 50000 公斤。', '500 公噸是 500000 公斤。']) })],
  cap: [UL('ml', '毫升', 'otter', { hook: '邊長 1 公分的模型小方塊，體積是 1 立方公分。水沒有固定形狀，要怎麼量多少？', hookPic: () => isoSvg(1, 1, 1),
    rounds: lessonCnt([2, 3, 5], n => tapDraw(k => mcup(k * 5), '點一下，倒入 5 小格的水（每小格和 1 個小方塊一樣多）'), k => `水面到 ${k * 5} 小格`, n => `水面到 ${n * 5} 小格。`, ['看我做：有刻度的量杯，每一小格裝得下 1 個邊長 1 公分的小方塊那麼多的水。我一次倒 5 小格。', '一起做：倒到 15 小格。', '換你做：倒到 25 小格。'], ['先預測：倒 5 次、每次 5 小格，水面到第幾格？', ['25', '10'], 0], '每點一下倒 5 小格。看水面停在刻度上的哪個數。'),
    fade: step3(mcup(5), '有刻度的量杯，水面在 5。', isoSvg(5, 1, 1), '5 小格的水，和 5 個邊長 1 公分的小方塊一樣多。', `<div class="eq5">1 小格水 ＝ ${K('1 立方公分', C1)} 那麼多</div>`, '對起來。'),
    nameSay: `1 立方公分那麼多的水，叫作 1 ${T('毫升')}。1 毫升和 1 立方公分是相同的體積。`, pick: [['1 毫升是一大杯水。', '1 毫升和 1 立方公分是相同的體積。', '1 毫升是 1 公分。'], 1, ['一杯水有好幾百小格。', '', '1 公分是長度；毫升量的是有多少水。']],
    pose: pose('change', '一杯飲料 500 毫升，倒掉一半，還剩幾毫升？', ['250', '50'], 0, ['', '一半是 500÷2。'], '對了！500÷2＝250 毫升。'),
    check: ucheck('一包鋁箔包飲料大約多少？', () => '<div class="u-big">🧃</div>', ['250 毫升', '250 公升'], 0, '回到量杯那一步：一包飲料拿在手上，大約 250 小格那麼多。', '對了，大約 250 毫升。', ['', '250 公升比一缸洗澡水還多。']) }),
    UL('l', '公升', 'otter', { hook: '1 毫升是 1 小格那麼多的水。一大瓶水，要數非常多小格。', hookPic: () => '<div class="u-big">🍼</div>',
    rounds: lessonCnt([5, 5, 5], n => tapDraw(k => tankSvg(k / 5), '點一下倒 200 毫升'), k => `倒了 ${k * 200} 毫升`, n => '內部每邊 10 公分的方盒倒滿了。', ['看我做：內部每邊 10 公分的方盒，一次倒 200 毫升。', '一起做：再倒滿一次。', '換你做：倒滿。'], ['先預測：倒滿是幾毫升？', ['100', '1000'], 1], '每點一下倒 200 毫升。數一數倒滿要幾次。'),
    fade: step3('<div class="u-big">🍼</div>', '一大瓶牛奶。', tankSvg(1), '內部每邊 10 公分的方盒倒滿。', `<div class="eq5">10×10×10＝${K(1000, C1)} 毫升</div>`, '寫成數字。'),
    nameSay: `1000 毫升叫作 1 ${T('公升')}。內部每邊 10 公分的正方體容器，容積是 1 公升。`, pick: [['1 公升是 100 毫升。', '1 公升是 1000 毫升。', '1 公升比 1 毫升少。'], 1, ['10×10×10 是 1000，不是 100。', '', '1 公升是 1000 個 1 毫升，多很多。']],
    pose: pose('can', '水壺能裝幾公升？只知道它是藍色的。', ['夠', '不夠，還要知道它的大小'], 1, ['顏色不決定能裝多少。', ''], '對了！要知道容器裡面多大。'),
    check: ucheck('一瓶 2 公升的牛奶，是幾毫升？', () => '<div class="u-big">🍼</div>', ['20', '200', '2000'], 2, '回到倒方盒那一步：1 公升是 1000 毫升。', '對了，2 個 1000 毫升：2000 毫升。', ['1 公升是 1000 毫升，不是 10。', '1 公升是 1000 毫升，不是 100。', '']) })],
  m3: [UL('cm3', '立方公分', 'octopus', { hook: '邊長 1 公分的小方格可以鋪滿一片面。如果往上堆高，變成一塊一塊的小方塊呢？', hookPic: () => isoSvg(1, 1, 1),
    rounds: lessonCnt([4, 6, 8], n => tapDraw(k => isoSvg(2, 2, 2, k), '點一下放一個模型小方塊'), k => `放了 ${k} 個`, n => `堆了 ${n} 個。`, ['看我做：邊長 1 公分的模型小方塊，一個一個堆。', '一起做：堆 6 個。', '換你做：堆 8 個。'], ['先預測：2 層、每層 4 個，共幾個？', ['6', '8'], 1], '每點一下放一個小方塊。數一數一共幾個。'),
    fade: step3(isoSvg(1, 1, 1), '一個邊長 1 公分的模型小方塊。', isoSvg(2, 2, 2), '堆成 8 個的大方塊。', `<div class="eq5">${K(8, C1)} 個小方塊（邊長 ${K('1 公分', C2)}）</div>`, '寫成數字。'),
    nameSay: `邊長 1 公分的正方體，體積是 1 ${T('立方公分')}。這塊堆了 8 個，就是 8 立方公分。`, pick: [['1 立方公分是一張紙。', '1 立方公分是邊長 1 公分的正方體那麼大。', '1 立方公分和 1 平方公分一樣。'], 1, ['紙很薄，量的是一片面；立方公分量的是一塊有多大。', '', '平方公分是一片面，立方公分是一塊立體。']],
    pose: pose('story', '哪一個用「立方公分」來說最合適？', ['一塊橡皮擦的體積', '一間教室的體積', '一座游泳池的體積'], 0, ['', '教室很大，用更大的單位。', '游泳池很大，用更大的單位。'], '對了！小東西用立方公分。'),
    check: ucheck('一塊積木由 12 個邊長 1 公分的小方塊堆成，體積是多少？', () => isoSvg(3, 2, 2), ['12 立方公分', '12 公分', '12 平方公分'], 0, '回到堆小方塊那一步：堆了幾個？每個多大？', '對了，12 個 1 立方公分：12 立方公分。', ['', '公分是長度單位。', '平方公分是面積單位。']) }),
    UL('m3', '立方公尺', 'octopus', { hook: '用邊長 1 公分的小方塊量貨櫃，要數非常非常多個。', hookPic: () => '<div class="u-big">🚢</div>',
    rounds: lessonCnt([3, 3, 3], n => tapDraw(k => m3Frame(k * 4), '點一下搭 4 根棍子（每根 1 公尺）'), k => `搭了 ${k * 4} 根`, n => '12 根搭成一個每邊 1 公尺的框，框裡的空間塗成淡藍色。', ['看我做：用 1 公尺長的棍子搭框。', '一起做：再搭一個。', '換你做：搭一個。'], ['先預測：搭好一個框要幾根棍子？', ['8', '12'], 1], '每點一下搭 4 根。正方體有幾條邊，就要幾根。'),
    fade: step3('<div class="u-big">🧊</div>', '一台大冰箱，大約這麼大。', m3Frame(12), '每邊 1 公尺的框，淡藍色是框裡的空間。', `<div class="eq5">每邊 ${K('1 公尺', C1)} 的正方體空間</div>`, '寫成數字。'),
    nameSay: `邊長 1 公尺的正方體，體積是 1 ${T('立方公尺')}。`, pick: [['1 立方公尺和小方塊一樣大。', '1 立方公尺是邊長 1 公尺的正方體那麼大。', '1 立方公尺是一條線。'], 1, ['小方塊每邊只有 1 公分。', '', '一根棍子是 1 公尺長；立方公尺量的是框裡的空間。']],
    pose: pose('change', '大框每邊改成 1 公分，它還是 1 立方公尺嗎？', ['是', '不是，變成 1 立方公分'], 1, ['邊長變了，體積就變了。', ''], '對了！邊長變小，體積也變小。'),
    check: ucheck('一個大貨櫃的體積，要用哪一個單位來說？', () => '<div class="u-big">🚢</div>', ['立方公分', '立方公尺'], 1, '回到搭大框那一步：貨櫃裡放得下好幾個這樣的框。', '對了，貨櫃大約 30 立方公尺。', ['用立方公分，數字會非常長。', '']) })],
});
CONCEPTS = SEGS.slice();
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
    if (first) S.stars += 2000;
    save();
    lessonFrame(L, `${L.title}單位，你認識了！`, `<div class="u-big">${L.icon}</div><div class="u-sum">${L.cards.map(c => `<span>${c.e} ${c.u}</span>`).join('')}</div>${first ? `<div class="trail">${nums('城市多了 2000 平方公尺')}</div>` : ''}`);
    document.getElementById('out').onclick = leave;
    document.getElementById('actions').innerHTML = '<button class="btn" id="end">好！</button>';
    document.getElementById('end').onclick = leave;
  }
  lessonStory(key, L, cards, leave); // 先走情境→動手→命名→換情境，再接原本的量感與練習
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
    lessonFrame(L, `練習完成！`, `<div class="u-big">${L.icon}</div><div class="u-count"><b class="num">${firstTry}</b> ／ ${base.length} 題第一次就對</div><div class="trail">${nums(`城市多了 ${firstTry * 500} 平方公尺`)}</div>`);
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
function viewQuizBooks() {
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
      <div class="prompt" id="prompt">${nums(esc(q.q))}</div>${q.pic ? `<div class="q-pic">${esc(q.pic)}</div>` : ''}<div class="msg" id="msg"></div><div class="actions" id="actions"></div>${q.t === 'num' ? `<div id="pad">${q.unit ? `<div class="trail">${esc(q.unit)}</div>` : ''}${keypadHtml()}</div>` : ''}`);
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

/* ---------- 應用題（讀題驗收）：先自己試；需要時才打開讀題幫手或提示，提示由少到多；答對後換情境再試一題 ---------- */
const WP_ORDER = ['scene', 'goal', 'roles', 'plan', 'check'];
const WP_STAGE = { scene: '這題發生什麼事', goal: '最後要找什麼', roles: '數字各代表什麼', plan: '先求出什麼', check: '答案合不合理' };
const WP_NEXT = { scene: '先不看數字，說說看是誰在做什麼事。', goal: '再讀一次最後一句，找出要知道的是誰的什麼。', roles: '把每個數字和它後面的單位連起來，看它在說誰的什麼。', plan: '問自己：要回答最後一問，題目還沒直接告訴你的是什麼？', check: '把答案放回題目裡，看看說不說得通。' };
const wpSay = t => { if (typeof say === 'function') say(String(t).replace(/<[^>]+>/g, '')); }; // 只有一年級有朗讀
const wpList = () => (window.QUIZ && Array.isArray(QUIZ.wp) && QUIZ.wp.length ? QUIZ.wp : null);
const wpAll = () => (S.wp && typeof S.wp === 'object' ? S.wp : (S.wp = {})); // 舊存檔沒有 S.wp
const wpRec = id => wpAll()[id];
function wpPut(id, patch) { const all = wpAll(); all[id] = Object.assign({}, all[id] || {}, patch); save(); return all[id]; }
function wpStatus(r) {
  if (!r) return '還沒做';
  const a = [r.selfEver ? '自己完成' : r.doneEver ? '經提示完成' : '看過做法'];
  if (r.tfEver) a.push('換情境也會');
  return a.join('・');
}
const wpBrief = s => { const c = [...String(s).replace(/\s+/g, ' ').trim()]; return c.length > 18 ? c.slice(0, 17).join('') + '⋯' : c.join(''); };
const wpAnsText = a => a.t === 'num' ? `${a.a} ${a.unit || ''}`.trim() : a.a.map(n => a.o[n]).join('、');
function wpEntry() {
  const L = wpList(); if (!L) return '';
  const done = L.filter(q => wpRec(q.id)).length;
  return `<div class="lessons wp-in"><button class="lesson" id="wpin"><span class="l-t"><b>應用題</b><small>${nums(`讀題驗收・${L.length} 題`)}</small></span><em class="sem">${nums(`${done} / ${L.length}`)}</em></button></div>`;
}
function viewWpList() {
  const L = wpList() || [];
  try { if (typeof cptQuizList !== 'undefined') cptQuizList = null; } catch (e) {} // 二年級的小故事按鈕不跟進來
  quizShell('應用題', viewQuizBooks, `<p class="tag">先自己讀題、作答；需要時可以打開讀題幫手或提示。</p><div class="lessons">${L.map((q, i) => `<button class="lesson wp-item" data-w="${i}"><span class="l-t"><b>${nums(`第 ${i + 1} 題`)}</b><small>${nums(esc(wpBrief(q.prompt)))}</small></span><em class="sem wp-st">${wpStatus(wpRec(q.id))}</em></button>`).join('')}</div>`);
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
  const steps = WP_ORDER.filter(s => q.steps && q.steps[s]), hints = q.hints || [];
  const st = { hints: 0, hOpen: true, helper: false, gi: 0, picked: {}, miss: [], wrong: 0 };
  quizShell('應用題', viewWpList, `<div class="trail">${nums(`第 ${i + 1} 題，共 ${L.length} 題`)}</div>
    <div class="prompt" id="prompt">${nums(esc(q.prompt))}</div>${q.pic ? `<div class="q-pic">${esc(q.pic)}</div>` : ''}
    <div class="wp-tools" id="wpt">${typeof say === 'function' ? '<button class="btn alt" id="wpsay" aria-label="再唸一次">🗣️</button>' : ''}${steps.length ? '<button class="btn alt" id="wpgb">讀題幫手</button>' : ''}${hints.length ? '<button class="btn alt" id="wphb">提示</button>' : ''}</div>
    <div class="wp-hints" id="wph" hidden></div><div class="wp-guide" id="wpg" hidden></div>
    <div class="msg" id="msg"></div><div id="wpa"></div>`);
  const $g = document.getElementById('wpg'), $h = document.getElementById('wph'), $a = document.getElementById('wpa');
  const gb = document.getElementById('wpgb'), hb = document.getElementById('wphb'), sb = document.getElementById('wpsay');
  /* 提示：按一次給一層；整塊可以收起、再打開 */
  const drawHints = () => {
    $h.hidden = !st.hints;
    $h.innerHTML = `<div class="wp-gh"><b>${nums(`提示 ${st.hints} / ${hints.length}`)}</b><button class="wp-x" id="wphx">${st.hOpen ? '收起' : '打開'}</button></div>${st.hOpen ? `<ol>${hints.slice(0, st.hints).map(t => `<li>${nums(esc(t))}</li>`).join('')}</ol>` : ''}`;
    document.getElementById('wphx').onclick = () => { st.hOpen = !st.hOpen; drawHints(); };
    if (hb) { hb.textContent = st.hints < hints.length ? (st.hints ? '下一層提示' : '提示') : '提示都給了'; hb.disabled = st.hints >= hints.length; }
  };
  if (hb) hb.onclick = () => { if (st.hints >= hints.length) return; st.hints++; st.hOpen = true; drawHints(); wpSay(hints[st.hints - 1]); };
  /* 讀題幫手：一次一步，選錯說明並給下一步，可以改選 */
  const guideOpen = on => { $g.hidden = !on; $a.hidden = on && st.gi < steps.length; if (gb) gb.classList.toggle('lit', on); };
  const guide = () => {
    st.helper = true; guideOpen(true); setMsg('');
    if (st.gi >= steps.length) {
      $g.innerHTML = `<div class="wp-gh"><b>讀題幫手：讀到的</b><button class="wp-x" id="wpgx">收起</button></div><ul class="wp-sum">${steps.map(s => `<li><small>${WP_STAGE[s]}</small>${nums(esc(q.steps[s].o[st.picked[s]]))}</li>`).join('')}</ul>`;
      document.getElementById('wpgx').onclick = () => guideOpen(false);
      return;
    }
    const s = steps[st.gi], c = q.steps[s];
    $g.innerHTML = `<div class="wp-gh"><b>讀題幫手</b><span class="wp-dots">${steps.map((x, j) => `<i class="${j < st.gi ? 'd' : j === st.gi ? 'now' : ''}"></i>`).join('')}</span></div>
      <div class="wp-sq" id="wpsq"><small>${nums(`第 ${st.gi + 1} 步，共 ${steps.length} 步`)}</small>${nums(esc(c.q))}</div>
      <div class="choices col">${c.o.map((o, n) => `<button class="choice" data-g="${n}">${nums(esc(o))}</button>`).join('')}</div>
      <div class="actions" id="wpga"><button class="btn alt" id="wpgx">先作答</button></div>`;
    wpSay(c.q + '。' + c.o.join('。'));
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
      document.getElementById('wpga').innerHTML = `<button class="btn" id="wpgn">${last ? '回到答案格' : '繼續'}</button>`;
      document.getElementById('wpgn').onclick = () => {
        st.gi++; guide();
        if (last) { $a.hidden = false; setMsg('讀題幫手走完了。照著讀到的，在答案格作答。', 'good'); reveal('#wpa'); }
      };
      reveal('#wpga');
    });
    reveal('#wpg');
  };
  if (gb) gb.onclick = () => { if (!$g.hidden) { guideOpen(false); $a.hidden = false; } else guide(); };
  if (sb) sb.onclick = () => wpSay(!$g.hidden && st.gi < steps.length ? plainText(document.getElementById('wpsq')) : plainText(document.getElementById('prompt')) + '。' + q.answers.map(a => a.label).join('。'));
  const finishView = (lead, cls) => {
    const t = document.getElementById('wpt'); if (t) t.querySelectorAll('#wpgb, #wphb').forEach(x => x.remove());
    guideOpen(false); $a.hidden = false; if (st.hints) { st.hOpen = false; drawHints(); }
    setMsg(`${lead}${q.explain ? nums(esc(q.explain)) : ''}<div class="wp-think">怎麼想的：${nums(esc(q.think))}</div>`, cls);
    const tf = q.transfer && q.transfer.prompt;
    $a.innerHTML = `<div class="actions">${tf ? '<button class="btn" id="wptf">試一題</button>' : ''}<button class="btn alt" id="wpbk">回題目列表</button></div>${tf ? '<p class="tag wp-tip">換一個情境，看看同一個做法還用得上嗎。</p>' : ''}`;
    if (tf) document.getElementById('wptf').onclick = () => runWpTransfer(i);
    document.getElementById('wpbk').onclick = viewWpList;
    reveal('#wpa');
  };
  /* 看做法：試了三次還沒對，可以直接看說明，再去試換情境的題目 */
  const showWay = () => {
    const old = wpRec(q.id) || {};
    wpPut(q.id, { self: false, shown: true, hints: st.hints, helper: st.helper, miss: st.miss, wrong: st.wrong, n: (old.n || 0) + 1, t: Date.now() });
    finishView(`答案：${q.answers.map(a => nums(esc(wpAnsText(a)))).join('；')}。`, 'hint');
  };
  wpAnswer(q.answers, {
    wrong: (k, said, multi) => {
      st.wrong++; sfx.retry();
      const a = q.answers[k];
      let next = multi ? '有該選的沒選，或多選了。一個一個選項回到題目裡對照。' : `${esc(said)} 還不是「${esc(a.label)}」。`;
      if (steps.length && st.gi < steps.length) next += '可以打開讀題幫手，一步一步把題目讀清楚。';
      else if (st.hints < hints.length) next += '按「提示」，看下一層。';
      else next += '照著提示的示範，把下一段接著做完。';
      setMsg(nums(next) + (st.wrong >= 3 ? '<div class="actions"><button class="btn alt" id="wpway">看做法</button></div>' : ''), 'hint');
      if (gb && st.gi < steps.length) gb.classList.add('lit');
      const w = document.getElementById('wpway'); if (w) w.onclick = showWay;
    },
    right: k => { if (k + 1 < q.answers.length) { sfx.ok(); setMsg(nums(`對，${esc(q.answers[k].label)}是 ${esc(wpAnsText(q.answers[k]))}。接著回答下一格。`), 'good'); } },
    done: () => {
      const self = !st.helper && !st.hints, old = wpRec(q.id) || {};
      wpPut(q.id, { self, hints: st.hints, helper: st.helper, miss: st.miss, wrong: st.wrong, shown: false, selfEver: !!(old.selfEver || self), doneEver: true, n: (old.n || 0) + 1, t: Date.now() });
      if (self && !st.wrong) sfx.good(); else sfx.ok();
      finishView('對。', 'good');
    },
  });
}
/* 換情境的題目：沒有幫手和提示，看做法能不能帶過去 */
function runWpTransfer(i) {
  const q = wpList()[i], tq = q.transfer, ans = tq.answers || [];
  let wrong = 0;
  quizShell('應用題：換情境', viewWpList, `<div class="trail">${nums(`第 ${i + 1} 題的換情境題`)}</div>
    <div class="prompt" id="prompt">${nums(esc(tq.prompt))}</div>${tq.pic ? `<div class="q-pic">${esc(tq.pic)}</div>` : ''}
    <div class="msg" id="msg"></div><div id="wpa"></div>`);
  const end = (ok, lead) => {
    const old = wpRec(q.id) || {};
    wpPut(q.id, { tf: ok, tfEver: !!(old.tfEver || ok), tfWrong: wrong });
    setMsg(lead + (tq.explain ? nums(esc(tq.explain)) : ''), ok ? 'good' : 'hint');
    document.getElementById('wpa').innerHTML = `<div class="actions">${i + 1 < wpList().length ? '<button class="btn" id="wpnx">繼續</button>' : ''}<button class="btn alt" id="wpbk">回題目列表</button></div>`;
    const nx = document.getElementById('wpnx'); if (nx) nx.onclick = () => runWp(i + 1);
    document.getElementById('wpbk').onclick = viewWpList;
    reveal('#wpa');
  };
  if (!ans.length) return end(false, '');
  wpAnswer(ans, {
    wrong: (k, said, multi) => {
      wrong++; sfx.retry();
      const w = multi ? '有該選的沒選，或多選了。' : `${esc(said)} 還不是「${esc(ans[k].label)}」。`;
      setMsg(nums(w + '回想原來那題：最後要找什麼、先求了什麼；在這題裡，要用的數字在哪裡？') + (wrong >= 3 ? '<div class="actions"><button class="btn alt" id="wpway">看答案</button></div>' : ''), 'hint');
      const b = document.getElementById('wpway'); if (b) b.onclick = () => { document.getElementById('wpa').innerHTML = ''; end(false, `答案：${ans.map(a => nums(esc(wpAnsText(a)))).join('；')}。`); };
    },
    right: k => { if (k + 1 < ans.length) { sfx.ok(); setMsg(nums(`對，${esc(ans[k].label)}是 ${esc(wpAnsText(ans[k]))}。接著回答下一格。`), 'good'); } },
    done: () => { if (!wrong) sfx.good(); else sfx.ok(); end(!wrong, wrong ? '對。這次中間答錯過，換情境的紀錄先不算；之後可以再做一次。' : '對。換了情境，一樣先找出最後要問的是什麼，再用題目給的數字求出來。'); },
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
    <div class="title-top"><p class="kicker">把月球城蓋到 1 平方公里大</p><h1 class="logo">數感月球城</h1></div>
    ${artImg('liang_cheer', 'title-hero')}
    <div class="title-bottom">
      <button class="btn big" id="start">${S.opened ? '繼續冒險' : '開始冒險'}</button>
      <p class="title-note">${S.opened ? `總工程師，城市已經 ${fmt(Math.min(S.stars, CITY))} 平方公尺` : '月球需要一位城市總工程師'}</p>
    </div></div>`;
  document.getElementById('start').onclick = () => {
    document.body.classList.remove('in-cine');
    beep([[523, 0], [784, .12]]);
    viewHome();
  };
}
function viewHome() { // 地圖：五上十站 → 開城典禮 → 五下十站；還沒做好的工坊顯示施工中
  window.scrollTo(0, 0);
  if (!S.opened) { S.opened = true; save(); return comic(OPENING.bg, OPENING.lines, viewHome, { skip: true, last: '出發！' }); }
  if (S.bossDone && !S.s2Seen) { S.s2Seen = true; save(); return comic(SEASON2.bg, SEASON2.lines, viewHome); }
  const all = Object.keys(GAMES), keys = availKeys();
  const saved = k => (S.prog[k] || 0) >= ROUNDS_TO_SAVE;
  if (all.every(k => VIEWS[k] && saved(k)) && S.bossDone && !S.grandSeen) { S.grandSeen = true; S.stars = Math.max(S.stars, CITY); save(); return comic(GRAND.bg, GRAND.lines, viewHome, { last: '太棒了！' }); }
  const allSaved = PIECE_KEYS.every(saved), nSaved = keys.filter(saved).length, nPieces = PIECE_KEYS.filter(saved).length;
  const bossNow = allSaved && !S.bossDone;
  const nextKey = bossNow ? null : keys.find(k => !saved(k) && S.prog[k]) || keys.find(k => !saved(k));
  const line = S.bossDone && !nextKey ? '城市運作起來了！朋友都來玩了。' : S.bossDone ? `讓城市動起來，下一站：${STORY[nextKey].place}！` : bossNow ? '十棟建築都蓋好了，準備開城！' : nSaved === 0 && !S.prog[nextKey] ? `總工程師，先去${STORY[nextKey].place}！` : `下一站：${STORY[nextKey].place}，${STORY[nextKey].mission}！`;
  const list = [...PIECE_KEYS, 'boss', ...all.filter(k => !PIECE_KEYS.includes(k))];
  const ROW = 150, rows = list.length, pts = [];
  for (let i = 0; i < rows; i++) pts.push([i % 2 ? 70 : 30, ROW * i + 70]);
  const pathD = pts.map((q, i) => i === 0 ? `M${q[0]} ${q[1]}` : `C${pts[i - 1][0]} ${q[1] - 70} ${q[0]} ${pts[i - 1][1] + 70} ${q[0]} ${q[1]}`).join('');
  const stop = (k, i) => {
    if (k === 'boss') return `<button class="stop ${i % 2 ? 'right' : 'left'} cave ${bossNow ? 'now' : ''}" data-g="boss" ${allSaved ? '' : 'disabled'} style="top:${ROW * i}px">
        <span class="medal" style="${bgStyle(BOSS.bg)}"><span class="fog ${S.bossDone ? 'f3' : allSaved ? 'f1' : 'f0'}"></span>${allSaved ? artImg('wanwan', 'medal-who') : '<span class="lock">？</span>'}</span>
        <span class="plate"><b>${S.bossDone ? '再辦一次開城' : '開城典禮'}</b><small>${allSaved ? (S.bossDone ? '再檢查一次' : '最後檢查') : `先蓋好五上建築（${nPieces}/10）`}</small></span></button>`;
    const st = STORY[k], g = GAMES[k], built = !!VIEWS[k];
    if (!built) return `<button class="stop ${i % 2 ? 'right' : 'left'} cave" disabled style="top:${ROW * i}px"><span class="medal" style="${bgStyle(st.bg)}"><span class="fog f0"></span><span class="lock">🚧</span></span><span class="plate"><b>${g.name}</b><em class="sem">${g.sem}</em><small>施工中</small></span></button>`;
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
      <div class="map-title"><h1 class="logo small">數感月球城</h1><div class="star-count">🏙️ ${N(fmt(Math.min(S.stars, CITY)))}<small>／${fmt(CITY)} 平方公尺</small></div></div>
      <div class="hero-say">${artImg(S.bossDone ? 'liang_cheer' : 'liang', 'hero-liang')}<span>${line}</span></div>
    </header>
    <button class="lesson-entry" id="lessons"><span>📐🗺️🐘🚰</span><b>單位教室</b><small>${Object.keys(S.learned || {}).length} / ${Object.keys(LESSONS).length}</small></button>
    <button class="quiz-entry" id="quiz"><span>📝</span><b>單元測驗</b><small>基礎・進階・益智</small></button>
    <div class="map-trail" style="height:${ROW * rows + 8}px">
      <svg viewBox="0 0 100 ${ROW * rows}" preserveAspectRatio="none" aria-hidden="true"><path d="${pathD}" fill="none" stroke="#fff6e3" stroke-width="5" stroke-dasharray="3 11" stroke-linecap="round" vector-effect="non-scaling-stroke" opacity=".9"/></svg>
      ${list.map(stop).join('')}
    </div>
    <nav class="dock">
      <button id="daily" class="${S.stamps[today()] ? 'stamped' : 'hot'}"><b>${S.stamps[today()] ? '✔' : '★'}</b>今日任務<small>${Object.keys(S.stamps).length} 個章</small></button>
      <button id="clues"><b>🏗️</b>城市建築<small>${nSaved} / ${keys.length}</small></button>
      <button id="practice"><b>✏️</b>練習場<small>自己選</small></button>
    </nav>`;
  document.querySelectorAll('[data-g]').forEach(b => b.onclick = () => enter(b.dataset.g));
  document.getElementById('daily').onclick = () => startRound('daily');
  document.getElementById('practice').onclick = viewPractice;
  document.getElementById('clues').onclick = viewClues;
  document.getElementById('lessons').onclick = viewLessons;
  document.getElementById('quiz').onclick = viewQuizBooks;
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
  const rows = availKeys().map(k => [k, GAMES[k]]).map(([k, g]) => { const s = summarize(k); return `<tr><td>${g.name}</td><td>${Math.min(rec(k).lv, Logic.maxLevel(k, S.unit)) + 1} / ${Logic.maxLevel(k, S.unit) + 1}</td><td>${s.note}</td></tr>`; }).join('');
  const miss = recentMisses();
  $app.innerHTML = `<div class="parent">
    <h1>家長頁</h1>
    <h2>單元</h2><p>五上、五下完成的單元都已開放，孩子可以自由選工坊。每個工坊和每一題都有標示是五上或五下。</p>
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
    if (confirm('確定清除所有星星和紀錄？')) { S.stars = 0; S.rec = {}; S.log = []; S.prog = {}; S.opened = false; S.bossDone = false; S.bossSeen = false; S.s2Seen = false; S.stamps = {}; S.fast = {}; S.quiz = {}; S.grandSeen = false; S.seenCpt = {}; S.cptLog = {}; S.learned = {}; save(); viewParent(); }
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
    if (sessionStorage.getItem('shugan5-updated-to') === latest) return; // 避免快取沒更新時一直重載
    sessionStorage.setItem('shugan5-updated-to', latest);
    location.replace(location.pathname + '?v=' + latest + location.hash);
  } catch (e) {}
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(); });
checkUpdate();
preloadArt().then(route);
