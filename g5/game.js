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
      { e: '🏡', u: '公畝', t: '每邊 10 公尺的正方形，100 平方公尺。大約一間半教室。' },
      { e: '⚽', u: '公頃', t: '每邊 100 公尺的正方形，100 公畝。大約一座足球場再大一點。' },
      { e: '🏙️', u: '平方公里', t: '每邊 1 公里的正方形，100 公頃。走完一邊要 15 分鐘。' },
    ],
    labs: [{ view: 'map', n: 10, each: 10, from: '公畝', to: '100 公畝', btn: '鋪一排（10 公畝）', done: '100 公畝就是 1 公頃！' }, { view: 'map', n: 10, each: 10, from: '公頃', to: '100 公頃', btn: '鋪一排（10 公頃）', done: '100 公頃就是 1 平方公里！月球城的目標就是這麼大。' }],
  },
  ton: {
    title: '重量', sem: '五下', icon: '🐘', who: 'turtle', name: '阿穩', say: '大象、貨車太重了，用公斤數字太大。',
    cards: [{ e: '🧒', u: '公斤', t: '五年級小朋友大約 40 公斤。' }, { e: '🐘', u: '公噸', t: '1 公噸＝1000 公斤。一輛小汽車大約 2 公噸。' }],
    labs: [{ view: 'ton', n: 10, each: 100, from: '公斤', to: '1000 公斤', btn: '放 100 公斤的沙包', done: '1000 公斤就是 1 公噸！大約 25 個小朋友那麼重。' }],
  },
  cap: {
    title: '容量', sem: '五下', icon: '🚰', who: 'otter', name: '水水', say: '倒水最清楚：水占的空間就是體積。',
    cards: [{ e: '🥤', u: '毫升', t: '1 毫升的水，就是 1 立方公分。一杯飲料大約 500 毫升。' }, { e: '🍼', u: '公升', t: '1 公升＝1000 毫升。每邊 10 公分的方盒剛好裝滿。' }],
    labs: [{ view: 'pour', n: 10, each: 100, from: '毫升', to: '1000 毫升', btn: '倒一層（100 毫升）', done: '10×10×10＝1000 立方公分，裝 1000 毫升，就是 1 公升！' }],
  },
  m3: {
    title: '大體積', sem: '五下', icon: '📦', who: 'octopus', name: '八八', say: '房子、貨櫃太大了，要用更大的方塊。',
    cards: [{ e: '🎲', u: '立方公分', t: '一顆小骰子，每邊 1 公分。' }, { e: '📦', u: '立方公尺', t: '每邊 1 公尺的大方塊，大約一台大冰箱。' }],
    labs: [{ view: 'frame', n: 12, each: 1, from: '根棍子', to: '12 根', btn: '搭一根 1 公尺的棍子', done: '這個框就是 1 立方公尺，鑽進去看看，大約坐得下 3 個小朋友！' }],
  },
  deg: {
    title: '角度', sem: '五上', icon: '📐', who: 'goat', name: '角爺爺', say: '圍牆轉彎的地方都有角。角的大小用「度」來說。',
    cards: [{ e: '📐', u: '度', t: '轉一整圈是 360 度。半圈 180 度，一個直角 90 度。' }],
    labs: [{ view: 'angle', n: 18, each: 10, from: '度', to: '180 度', btn: '或按這裡轉 10 度', done: '180 度是一條直線。等一下三角形的角會用到它。' }],
  },
  m2: {
    title: '面積', sem: '五上', icon: '🟩', who: 'sheep', name: '咩咩', say: '小東西用平方公分，大地方用平方公尺。',
    cards: [
      { e: '👆', u: '平方公分', t: '每邊 1 公分的正方形，大約是食指的指腹。' },
      { e: '🟩', u: '平方公尺', t: '每邊 1 公尺的正方形，大約可以站 12 個小朋友。' },
    ],
    labs: [{ view: 'board', n: 10, each: 1000, from: '平方公分', to: '10000 平方公分', btn: '鋪一排（1000 平方公分）', done: '每邊 100 公分，鋪滿要 100×100＝10000 平方公分，就是 1 平方公尺！' }],
  },
  time: {
    title: '時間', sem: '五上', icon: '⏰', who: 'raccoon', name: '秤秤', say: '時間不是滿 100 才換，要先記得每個單位多大。',
    cards: [
      { e: '👏', u: '秒', t: '拍一下手大約 1 秒。60 秒是 1 分鐘。' },
      { e: '🍜', u: '分鐘', t: '泡麵大約 3 分鐘。60 分鐘是 1 小時。' },
      { e: '🎬', u: '小時', t: '一部電影大約 2 小時。24 小時是 1 日。' },
      { e: '🗓️', u: '日', t: '從今天這個時候到明天這個時候。' },
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
/* ---------- 新概念小故事：情境提問 → 動手試（不出現新詞）→ 命名 → 換情境用新詞答一題 ---------- */
const T = w => `<b class="term">${w}</b>`;
const cBar = (n, a, c) => barRow(n, a, c || '#6ea8dc');
const tri5 = (P, lab) => `<svg class="g5" style="max-height:130px" viewBox="0 0 320 170"><polygon points="${polyStr(P)}" fill="#fff0cf" stroke="#7a5b2e" stroke-width="3"/>${lab || ''}</svg>`;
const triAngles = P => { const a = Math.round(ptAng(P[2], P[0], P[1])), b = Math.round(ptAng(P[0], P[1], P[2])); return [a, b, 180 - a - b]; };
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
const NET_A = [[0, 1], [1, 0], [1, 1], [1, 2], [1, 3], [2, 1]], NET_BAD = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]];
const CONCEPTS = [
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
const conceptsOf = g => CONCEPTS.filter(c => c.game === g || c.when.some(w => w.startsWith(g + ':')));
const seenCpt = () => S.seenCpt || (S.seenCpt = {});
let cptTimer = null;
const cptStop = () => { if (cptTimer) { clearInterval(cptTimer); cptTimer = null; } };
function runConcept(key, then) {
  const C = CONCEPTS.find(c => c.key === key), L = { title: C.title, sem: GAMES[C.game].sem, who: C.who };
  const done = () => { cptStop(); seenCpt()[key] = 1; save(); then(); };
  const skipBtn = '<button class="skip5" id="skipc">跳過</button>';
  const wire = () => { document.getElementById('out').onclick = () => { cptStop(); R = null; go(''); }; document.getElementById('skipc').onclick = done; };
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
      if (+b.dataset.c5 === K.a) { sfx.good(); setMsg(nums(K.ok), 'good'); seenCpt()[key] = 1; save(); document.getElementById('skipc').hidden = true; actionBtn('fin', '開始玩').onclick = done; return; }
      sfx.retry(); setMsg(nums(K.why), 'hint'); actionBtn('bk', '回去再動手看看').onclick = op;
    });
  }
  op();
}
function conceptThen(q, then) { // 第一次碰到這個題型，自動播；已看過就不再播
  const key = q.kind + ':' + q.mode, C = CONCEPTS.find(c => c.when.includes(key) && !seenCpt()[c.key]);
  if (!C) return then();
  runConcept(C.key, () => conceptThen(q, then));
}
function viewConcepts(g, back) { // 重看
  const list = g ? conceptsOf(g) : CONCEPTS;
  window.scrollTo(0, 0);
  $app.innerHTML = `<div class="top"><button class="icon-btn" id="bkc" aria-label="回去">⌂</button><h2 class="page-h">新概念小故事</h2></div><p class="tag">想再看一次哪一個？</p><div class="lessons">${list.map(c => `<button class="lesson" data-rc="${c.key}"><span class="l-t"><b>${c.title}</b><small>${c.terms.join('、')}・${GAMES[c.game].name}</small></span><em class="sem">${GAMES[c.game].sem}</em>${seenCpt()[c.key] ? '<span class="badge in">✓</span>' : ''}</button>`).join('')}</div>`;
  document.getElementById('bkc').onclick = back;
  document.querySelectorAll('[data-rc]').forEach(b => b.onclick = () => runConcept(b.dataset.rc, () => viewConcepts(g, back)));
}
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
    if (confirm('確定清除所有星星和紀錄？')) { S.stars = 0; S.rec = {}; S.log = []; S.prog = {}; S.opened = false; S.bossDone = false; S.bossSeen = false; S.s2Seen = false; S.stamps = {}; S.fast = {}; S.quiz = {}; S.grandSeen = false; S.seenCpt = {}; S.learned = {}; save(); viewParent(); }
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
