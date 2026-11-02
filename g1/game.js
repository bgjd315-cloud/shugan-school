/* 數感小森林 引擎：存檔、語音、注音、畫面框架、回合流程、首頁 */
const SAVE_KEY = 'shugan1-v1';
const ROUND = 5;
const STATIONS = Logic.STATIONS, KEYS = Object.keys(STATIONS);
const $app = document.getElementById('app');
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const N = x => `<span class="num">${x}</span>`;
function nums(s) { return String(s).replace(/\d+/g, m => N(m)); }
const T = ms => ms * (window.__TS === undefined ? 1 : window.__TS);
const wait = ms => new Promise(r => setTimeout(r, T(ms)));
function load() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; } }
const S = Object.assign({ voice: true, prog: {}, lv: {}, stars: {}, fast: {}, seen: {}, did: {}, quiz: {}, opened: false, halfSeen: false, endSeen: false }, load() || {});
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }

/* ---------- 音效與語音：語音不能用時一樣能玩 ---------- */
let audio;
function beep(list) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    list.forEach(([f, t]) => { const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = f; g.gain.setValueAtTime(.08, audio.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + t + .18); o.connect(g); g.connect(audio.destination); o.start(audio.currentTime + t); o.stop(audio.currentTime + t + .2); });
  } catch (e) {}
}
const sfx = { good: () => beep([[523, 0], [659, .1], [784, .2]]), ok: () => beep([[523, 0], [659, .1]]), hop: () => beep([[440, 0]]), retry: () => beep([[330, 0]]) };
const speakable = t => String(t).replace(/<[^>]+>/g, '').replace(/＋/g, '加').replace(/－/g, '減').replace(/＝/g, '等於').replace(/？(?=[^。！？]*$)/, '？').replace(/□/g, '多少');
let lastSaid = '';
// 估計唸完要多久（毫秒）：自動換下一步之前，讓回饋先唸完
const speakMs = t => { if (!S.voice || !('speechSynthesis' in window)) return 0; const n = speakable(t).replace(/[^一-鿿\d]/g, '').length; return n * 300; };
function say(text, keepLast) {
  if (!keepLast) lastSaid = text;
  if (!S.voice) return;
  try {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(speakable(text));
    u.lang = 'zh-TW'; u.rate = .88;
    const v = speechSynthesis.getVoices().find(x => /zh[-_]TW/i.test(x.lang));
    if (v) u.voice = v;
    u.onerror = () => {};
    speechSynthesis.speak(u);
  } catch (e) {}
}
function toggleVoice() { S.voice = !S.voice; save(); if (!S.voice) { try { speechSynthesis.cancel(); } catch (e) {} } else say(lastSaid); document.querySelectorAll('.vc').forEach(b => { b.textContent = S.voice ? '🔊' : '🔇'; b.setAttribute('aria-label', S.voice ? '關掉聲音' : '打開聲音'); }); }

/* ---------- 注音：直排在字右邊 ---------- */
const HAN = /[一-鿿]/;
function bp(r) {
  let s = r || '', top = '', tone = '';
  if (s[0] === '˙') { top = '<i class="qing">˙</i>'; s = s.slice(1); }
  if (/[ˊˇˋ]$/.test(s)) { tone = `<i class="tone">${s.slice(-1)}</i>`; s = s.slice(0, -1); }
  return `<span class="bp" aria-hidden="true">${top}${[...s].map(x => `<span>${x}</span>`).join('')}${tone}</span>`;
}
function zyGroups(text) {
  const chars = [...text], rd = new Array(chars.length).fill(null);
  for (let i = 0; i < chars.length; i++) {
    if (rd[i] || !HAN.test(chars[i])) continue;
    const hit = ZY_PHRASE.find(([w]) => chars.slice(i, i + [...w].length).join('') === w);
    if (hit) { let k = 0; [...hit[0]].forEach((c, j) => { if (HAN.test(c)) rd[i + j] = hit[1][k++]; }); }
    else rd[i] = ZY_CHAR[chars[i]] || '';
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
  while (w.nextNode()) { const n = w.currentNode, el = n.parentElement; if (HAN.test(n.nodeValue) && !el.closest('.zc, .parent, style, script')) nodes.push(n); }
  nodes.forEach(n => { const t = document.createElement('template'); t.innerHTML = zyGroups(n.nodeValue).join(''); n.replaceWith(t.content); });
}
const plainText = el => { const c = el.cloneNode(true); c.querySelectorAll('.bp').forEach(b => b.remove()); return c.textContent.trim(); };
// 題庫頁（quiz_ui）沒有呼叫 say，這裡看到題目或回饋換了就唸
let quizSaid = {};
new MutationObserver(() => {
  annotate($app);
  ['prompt', 'msg'].forEach(id => { const e = $(id); if (e) { const t = plainText(e); if (t && quizSaid[id] !== t) { quizSaid[id] = t; say(t); } } else quizSaid[id] = ''; });
}).observe($app, { childList: true, subtree: true, characterData: true });

function setMsg(html, cls) { const e = $('msg'); if (e) { e.className = 'msg ' + (cls || ''); e.innerHTML = html; } }
const reveal = sel => setTimeout(() => { const e = document.querySelector(sel); if (e) e.scrollIntoView({ block: 'nearest' }); }, 40);

/* 一下才用的大按鈕 0～9（題庫也共用） */
function keypadHtml() {
  return `<div class="pad" id="kp"><div class="pad-show" id="kpv"></div>${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button data-d="${d}">${d}</button>`).join('')}<button data-d="x" aria-label="擦掉一個" class="pad-x">⌫</button><button data-d="0">0</button><button data-d="k" class="pad-ok">好</button></div>`;
}
function bindKeypad(onOk) {
  let v = '';
  const show = () => { $('kpv').textContent = v; };
  const clear = () => { v = ''; show(); };
  document.querySelectorAll('#kp [data-d]').forEach(b => b.onclick = () => {
    const d = b.dataset.d;
    if (d === 'x') v = v.slice(0, -1);
    else if (d === 'k') { if (v) onOk(+v, clear); return; }
    else if (v.length < 3) v += d;
    show();
  });
}

/* ---------- 畫面框架 ---------- */
let CTX = null; // { dots:[…], sem, skip }
function topBar() {
  const c = CTX || {};
  return `<div class="top"><button class="icon-btn" id="home" aria-label="回森林">⌂</button>${c.dots ? `<div class="dots">${c.dots.map(g => `<i class="${g === null ? '' : 'g' + g}"></i>`).join('')}</div>` : '<div class="dots"></div>'}${c.sem ? `<span class="sem">${c.sem}</span>` : ''}${c.back ? '<button class="icon-btn" id="back1" aria-label="上一步">◀</button>' : ''}${c.skip ? '<button class="skip" id="skip">跳過</button>' : ''}<button class="icon-btn vc" id="vc" aria-label="${S.voice ? '關掉聲音' : '打開聲音'}">${S.voice ? '🔊' : '🔇'}</button></div>`;
}
function bindTop() {
  const h = $('home'); if (h) h.onclick = () => { R = null; CTX = null; go(''); };
  $('vc').onclick = toggleVoice;
  const sk = $('skip'); if (sk && CTX && CTX.skip) sk.onclick = CTX.skip;
  const bk = $('back1'); if (bk && CTX && CTX.back) bk.onclick = CTX.back;
}
function stage(st) {
  window.scrollTo(0, 0);
  $app.innerHTML = `${topBar()}<div class="say"><button class="spk" id="spk" aria-label="再唸一次">🗣️</button><div class="prompt1" id="pr">${nums(esc(st.say))}</div></div><div class="scene" id="scene">${st.show ? scene(st.show) : ''}</div><div class="work" id="work"></div><div class="mg" id="mg"></div><div class="actions" id="actions"></div>`;
  bindTop();
  $('spk').onclick = () => say(st.say);
  say(st.say);
  bindCount($('scene'));
}
function setM(text, cls, noSay) { const e = $('mg'); if (!e) return; e.className = 'mg ' + (cls || ''); e.innerHTML = nums(esc(text)); if (text && !noSay) say(text); }

/* 依序跑一題的每個步驟 */
let CUR = null, R = null;
function runSteps(q, steps, onDone, ctx0) {
  let i = 0, tries = 0, gave = false, stepGave = false;
  const ctx = ctx0 || {};
  const next = () => {
    if (i >= steps.length) return onDone(gave ? 0 : tries ? 1 : 2);
    const st = steps[i++], last = i >= steps.length;
    stepGave = false;
    CUR = { q, st, i, ctx, last, steps };
    if (st.dynSplit && ctx.split) Object.assign(st, Logic.splitPick(st.n, ctx.split[0]));
    stage(st);
    const myCur = CUR;
    WID[st.t](st, {
      ctx,
      miss() { tries++; sfx.retry(); },
      giveUp() { gave = true; stepGave = true; },
      tries: () => tries,
      done(text) {
        if (CUR !== myCur) return;
        sfx.good();
        const t = (!stepGave && st.ok) || text || pickPraise();
        setM(t, stepGave ? 'hint' : 'good');
        const go2 = () => { if (CUR === myCur) next(); };
        if (last) { $('actions').innerHTML = '<button class="btn big" id="nx" aria-label="下一步">➜</button>'; $('nx').onclick = go2; reveal('#actions'); }
        else setTimeout(go2, T(Math.max(1100, Math.min(4500, speakMs(t) + 300))));
      },
    });
  };
  next();
}
const pickPraise = () => '對了。';

/* ---------- 回合 ---------- */
function startRound(k) {
  const modes = Logic.roundModes(k, ROUND);
  R = { k, i: 0, grades: [], modes };
  nextQ();
}
const isFast = key => (S.fast[key] || 0) >= 3;
function nextQ() {
  if (!R) return;
  if (R.i >= ROUND) return endRound();
  const q = Logic.gen(R.k, R.modes[R.i], S.lv[R.k] || 0);
  R.q = q;
  const hasHands = q.steps.some(s => s.hands), fast = hasHands && isFast(q.key);
  const steps = fast ? q.steps.filter(s => !s.hands) : q.steps;
  R.skipped = fast;
  CTX = { dots: Array.from({ length: ROUND }, (_, i) => i < R.grades.length ? R.grades[i] : null), sem: q.sem };
  runSteps(q, steps, grade => {
    if (hasHands) S.fast[q.key] = grade === 2 ? (S.fast[q.key] || 0) + 1 : 0;
    R.grades.push(grade); R.i++; save(); nextQ();
  });
}
function endRound() {
  const { k, grades } = R, sum = grades.reduce((a, b) => a + b, 0), lamps = sum >= 9 ? 3 : sum >= 6 ? 2 : 1;
  const first = !S.prog[k];
  S.prog[k] = (S.prog[k] || 0) + 1;
  S.stars[k] = Math.max(S.stars[k] || 0, lamps);
  S.lv[k] = Math.max(0, Math.min(2, (S.lv[k] || 0) + (sum >= 9 ? 1 : sum <= 4 ? -1 : 0)));
  save(); R = null; CTX = null; CUR = null;
  const line = STORY[k].out;
  window.scrollTo(0, 0);
  $app.innerHTML = `<div class="end pop" style="${bgStyle(STATIONS[k].img)}"><div class="end-card"><img class="hero-big" src="assets/baby_glow.webp" alt=""><p class="lamps">${'🏮'.repeat(lamps)}</p><h2 class="end-t">亮亮又亮了一點！</h2><p class="end-l">${esc(line)}</p><div class="actions"><button class="btn" id="again">再玩一次</button><button class="btn alt" id="back">回森林</button></div></div></div>`;
  say('亮亮又亮了一點！' + line);
  sfx.good();
  $('again').onclick = () => startRound(k);
  $('back').onclick = afterBack;
}
function afterBack() {
  const a = KEYS.filter(k => STATIONS[k].sem === '一上'), all = KEYS.every(k => S.prog[k]);
  if (all && !S.endSeen) { S.endSeen = true; save(); return comicList('finale', STORY.end, 'baby_glow', viewHome); }
  if (a.every(k => S.prog[k]) && !S.halfSeen) { S.halfSeen = true; save(); return comicList('sky_bright', STORY.half, 'baby_glow', viewHome); }
  viewHome();
}

/* ---------- 故事頁 ---------- */
const bgStyle = img => `background-image:url(assets/${img}.webp)`;
function comicList(bg, lines, who, done, opt = {}) {
  let i = 0;
  const show = () => {
    if (i >= lines.length) return done();
    const line = lines[i];
    window.scrollTo(0, 0);
    $app.innerHTML = `<div class="comic" style="${bgStyle(bg)}"><div class="comic-top"><button class="skip" id="skip">跳過</button><button class="icon-btn vc" id="vc" aria-label="聲音">${S.voice ? '🔊' : '🔇'}</button></div><img class="comic-who" src="assets/${who}.webp" alt=""><div class="bubble"><button class="spk" id="spk" aria-label="再唸一次">🗣️</button><div class="bubble-t">${nums(esc(line))}</div></div>${opt.word ? '' : ''}<button class="btn big" id="nx" aria-label="下一步">➜</button></div>`;
    say(line);
    $('spk').onclick = () => say(line);
    $('vc').onclick = toggleVoice;
    $('skip').onclick = done;
    $('nx').onclick = () => { i++; show(); };
  };
  show();
}

/* 新概念小故事：小麻煩 → 動手試 → 說出新詞 → 換東西再試
   S.seen[k]＝看過（跳過也算看過）；S.did[k]＝每個動手步驟都做完。兩個分開記，跳過不算做完。 */
function runLesson(k, done) {
  const L = LESSONS[k], st = STATIONS[k], lctx = {};
  let i = 0;
  const leave = full => { S.seen[k] = true; if (full) S.did[k] = true; save(); CTX = null; CUR = null; done(); };
  const skip = () => leave(false);
  const back = () => { i = Math.max(0, i - 2); beat(); };
  const beat = () => {
    if (i >= L.beats.length) return leave(true);
    const b = L.beats[i++];
    if (b.t) {
      CTX = { sem: '小故事', skip, back: i > 1 ? back : null, dots: L.beats.map((_, n) => n < i - 1 ? 2 : null) };
      CUR = null;
      runSteps({ st: k, m: 'lesson', key: 'lesson' }, [JSON.parse(JSON.stringify(b))], () => beat(), lctx);
    } else {
      window.scrollTo(0, 0);
      CUR = { lessonTalk: true };
      $app.innerHTML = `<div class="comic lesson" style="${bgStyle(st.img)}"><div class="comic-top">${i > 1 ? '<button class="icon-btn" id="back1" aria-label="上一步">◀</button>' : ''}<button class="skip" id="skip">跳過</button><button class="icon-btn vc" id="vc" aria-label="聲音">${S.voice ? '🔊' : '🔇'}</button></div><img class="comic-who" src="assets/${st.who}.webp" alt="">${b.word ? `<div class="word-card pop">${nums(esc(b.word))}</div>` : ''}<div class="bubble"><button class="spk" id="spk" aria-label="再唸一次">🗣️</button><div class="bubble-t">${nums(esc(b.say))}</div></div><button class="btn big" id="nx" aria-label="下一步">➜</button></div>`;
      say(b.say);
      $('spk').onclick = () => say(b.say);
      $('vc').onclick = toggleVoice;
      $('skip').onclick = skip;
      if ($('back1')) $('back1').onclick = back;
      $('nx').onclick = beat;
    }
  };
  beat();
}

/* ---------- 頁面 ---------- */
function enterStation(k) {
  if (!S.seen[k]) return comicList(STATIONS[k].img, [STORY[k].talk], STATIONS[k].who, () => runLesson(k, () => startRound(k)));
  viewStation(k);
}
// 小故事的紀錄：看過但跳過，提醒可以回來做完
const lessonNote = k => S.did[k] ? '小故事：每一步都做過了。' : S.seen[k] ? '小故事：看過了，還沒有每一步都做完。' : '';
function viewStation(k) {
  const s = STATIONS[k];
  CTX = null;
  window.scrollTo(0, 0);
  $app.innerHTML = `${topBar()}<div class="st-page"><div class="st-img" style="${bgStyle(s.img)}"><img src="assets/${s.who}.webp" alt=""></div><h2 class="st-name"><span class="num">${s.n}</span> ${esc(s.name)}<span class="sem">${s.sem}</span></h2><p class="st-say">${nums(esc(STORY[k].talk))}</p>${lessonNote(k) ? `<button class="ls-note" id="lsn">${lessonNote(k)}</button>` : ''}<div class="actions"><button class="btn big" id="play">開始玩</button><button class="btn alt" id="lesson">再看小故事</button></div></div>`;
  bindTop();
  if ($('lsn')) $('lsn').onclick = () => say(lessonNote(k));
  say(STORY[k].talk);
  $('play').onclick = () => startRound(k);
  $('lesson').onclick = () => runLesson(k, () => viewStation(k));
}
function viewHome() {
  R = null; CTX = null; CUR = null;
  if (!S.opened) return viewCover();
  const done = KEYS.filter(k => S.prog[k]).length, nextK = KEYS.find(k => !S.prog[k]);
  const line = nextK ? `下一站：${STATIONS[nextK].name}。` : '森林都亮了！小路通到數感小鎮了。';
  const group = sem => KEYS.filter(k => STATIONS[k].sem === sem).map(k => {
    const s = STATIONS[k], l = S.stars[k] || 0;
    return `<button class="stn${S.prog[k] ? ' lit' : ''}${k === nextK ? ' now' : ''}" data-k="${k}" style="${bgStyle(s.img)}"><span class="stn-n">${s.n}</span><span class="stn-sem sem">${s.sem}</span><span class="stn-l">${'🏮'.repeat(l) || '<i class="off"></i>'}</span><b>${esc(s.name)}</b></button>`;
  }).join('');
  window.scrollTo(0, 0);
  $app.innerHTML = `<div class="home-head" style="${bgStyle(done >= 18 ? 'finale' : done >= 9 ? 'sky_bright' : 'sky_dark')}"><button class="icon-btn vc" id="vc" aria-label="聲音">${S.voice ? '🔊' : '🔇'}</button><h1 class="logo small">數感小森林</h1><div class="hero-row"><img src="assets/${done ? 'baby_glow' : 'baby'}.webp" alt=""><div class="hero-say"><button class="spk" id="spk" aria-label="再唸一次">🗣️</button><span>${esc(line)}</span></div></div><div class="lit-bar"><i style="width:${done / 18 * 100}%"></i></div></div>
    <h2 class="part">一上：點亮路燈</h2><div class="stn-grid">${group('一上')}</div>
    <h2 class="part">一下：蓋小路</h2><div class="stn-grid">${group('一下')}</div>
    <div class="dock"><button id="quiz">📝 小測驗</button><button id="parent">大人看</button></div>`;
  say(line);
  $('spk').onclick = () => say(line);
  $('vc').onclick = toggleVoice;
  document.querySelectorAll('[data-k]').forEach(b => b.onclick = () => enterStation(b.dataset.k));
  $('quiz').onclick = viewQuizBooks;
  $('parent').onclick = viewParent;
}
function viewCover() {
  $app.innerHTML = `<div class="cover" style="${bgStyle('sky_dark')}"><p class="kicker">小螢火蟲亮亮的故事</p><h1 class="logo">數感小森林</h1><img class="hero-big" src="assets/baby.webp" alt=""><button class="btn big" id="st">開始</button></div>`;
  $('st').onclick = () => { S.opened = true; save(); comicList('sky_dark', STORY.open, 'baby', viewHome); };
}
function viewParent() {
  const rows = KEYS.map(k => `<tr><td>${STATIONS[k].sem} ${STATIONS[k].n}. ${STATIONS[k].name}</td><td>${S.prog[k] || 0} 回</td><td>${S.lv[k] || 0}</td><td>${S.seen[k] ? '看過' : '—'}</td><td>${S.did[k] ? '做完' : S.seen[k] ? '跳過部分' : '—'}</td></tr>`).join('');
  $app.innerHTML = `<div class="parent"><button class="icon-btn" id="home" aria-label="回森林">⌂</button><h2>給大人看</h2><p>聲音：${'speechSynthesis' in window ? '這台裝置可朗讀（可用右上角喇叭關閉）' : '這台裝置不支援朗讀，仍可遊玩'}</p><table><tr><th>小站</th><th>玩過</th><th>難度</th><th>小故事</th><th>操作</th></tr>${rows}</table><p>「長度」只比較個別單位；乘法不教。「看過」表示打開過小故事（按跳過也算）；「做完」表示每個動手步驟都完成。看過不等於學會。</p><button class="btn alt" id="reset">全部重來</button></div>`;
  $('home').onclick = viewHome;
  $('reset').onclick = () => { if (confirm('確定清除紀錄？')) { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} location.reload(); } };
}
function go(h) { try { if (location.hash.slice(1) !== h) history.replaceState(null, '', h ? '#' + h : location.pathname); } catch (e) {} route(); }
function route() { if (location.hash === '#/parent' || location.hash === '#parent') viewParent(); else viewHome(); }
window.__G = { S, get R() { return R; }, get CUR() { return CUR; }, isFast };
/* ---------- 圖示：自己畫的 SVG，不靠裝置字型 ---------- */
const V = (b, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 64 64" aria-hidden="true">${b}</svg>`;
const col = { b: '#4f9ad6', r: '#e0648a', g: '#57b84a' };
const ICON = {
  fly: V('<ellipse class="tail" cx="44" cy="40" rx="13" ry="13" fill="#d8cfa8"/><ellipse cx="26" cy="36" rx="17" ry="16" fill="#f0a24a"/><ellipse cx="30" cy="16" rx="14" ry="8" fill="#fff" opacity=".75" stroke="#c9b98f"/><circle cx="20" cy="31" r="3.4" fill="#33405a"/><circle cx="31" cy="31" r="3.4" fill="#33405a"/><path d="M20 21 Q16 10 11 9M28 20 Q30 9 34 7" stroke="#8a5a2b" stroke-width="2.4" fill="none"/>'),
  pine: V('<path d="M32 6 C50 18 54 40 32 58 C10 40 14 18 32 6Z" fill="#a0693a"/><path d="M18 22 Q32 32 46 22M14 34 Q32 46 50 34M20 46 Q32 54 44 46M32 8V56" stroke="#6d4524" stroke-width="3" fill="none"/>'),
  apple: V('<path d="M32 20C22 10 8 16 9 32c1 16 12 26 23 24 11 2 22-8 23-24 1-16-13-22-23-12Z" fill="#e3513f"/><path d="M32 20c-1-6 1-11 5-14" stroke="#6d4524" stroke-width="4" fill="none"/><path d="M36 12c6-5 12-4 15-1-5 5-11 5-15 1Z" fill="#57b84a"/>'),
  pear: V('<path d="M32 10c7 0 9 7 10 14 2 8 11 11 10 21-1 9-10 13-20 13S13 54 12 45c-1-10 8-13 10-21 1-7 3-14 10-14Z" fill="#c6d24d"/><path d="M32 10c0-3 1-5 3-7" stroke="#6d4524" stroke-width="4" fill="none"/>'),
  bird: V('<ellipse cx="30" cy="38" rx="20" ry="16" fill="#62aee6"/><circle cx="44" cy="24" r="12" fill="#62aee6"/><circle cx="47" cy="22" r="2.8" fill="#23304a"/><path d="M55 24l8 3-8 3Z" fill="#f2b632"/><path d="M12 36 Q28 22 38 40 Q24 50 12 36Z" fill="#3b82c4"/>'),
  mush: V('<path d="M24 34h16v18c0 6-16 6-16 0Z" fill="#fff5dd" stroke="#cdb98a" stroke-width="2"/><path d="M6 36C6 18 18 8 32 8s26 10 26 28Z" fill="#e0533f"/><circle cx="22" cy="24" r="5" fill="#fff"/><circle cx="42" cy="22" r="6" fill="#fff"/>'),
  honey: V('<rect x="13" y="18" width="38" height="38" rx="9" fill="#f2b632" stroke="#b77e13" stroke-width="2.5"/><rect x="17" y="8" width="30" height="11" rx="3" fill="#c76a3a"/><path d="M21 32q11 8 22 0" stroke="#fff3b8" stroke-width="4" fill="none"/>'),
  stick: V('<rect x="28" y="4" width="8" height="56" rx="4" fill="#a9713d"/><path d="M36 22l9-7" stroke="#a9713d" stroke-width="4"/>', 'stick'),
  bundle: V('<g fill="#a9713d"><rect x="12" y="6" width="6" height="52" rx="3"/><rect x="19" y="4" width="6" height="56" rx="3"/><rect x="26" y="6" width="6" height="52" rx="3"/><rect x="33" y="4" width="6" height="56" rx="3"/><rect x="40" y="6" width="6" height="52" rx="3"/><rect x="47" y="8" width="5" height="48" rx="2.5"/></g><rect x="8" y="27" width="48" height="9" rx="3" fill="#d6476b"/>'),
  bead: V('<circle cx="32" cy="32" r="24" fill="#ef8a3c"/><circle cx="24" cy="24" r="6" fill="#ffd9a8"/>'),
  duckling: V('<ellipse cx="30" cy="42" rx="22" ry="16" fill="#f7d24b"/><circle cx="36" cy="20" r="14" fill="#f7d24b"/><circle cx="41" cy="17" r="2.8" fill="#23304a"/><path d="M49 20l11 3-11 5Z" fill="#f0863a"/>'),
  ice: V('<rect x="28" y="40" width="8" height="20" rx="3" fill="#d9b483"/><rect x="16" y="6" width="32" height="38" rx="14" fill="#f58ab0"/><path d="M18 26q14 8 28 0" stroke="#fff" stroke-width="4" fill="none"/>'),
  ball: V('<circle cx="32" cy="32" r="26" fill="#e0533f"/><path d="M8 26q24 14 48 0" stroke="#fff" stroke-width="4" fill="none"/><circle cx="23" cy="19" r="5" fill="#ffc4b5"/>'),
  cube: V('<path d="M10 22l22-12 22 12v26L32 60 10 48Z" fill="#4f9ad6"/><path d="M10 22l22 12 22-12" stroke="#fff" stroke-width="2.5" fill="none"/><path d="M32 34v26" stroke="#fff" stroke-width="2.5"/>'),
  box: V('<path d="M4 24l14-9h42l-12 9v22H4Z" fill="#57b84a"/><path d="M4 24h44m0 0l12-9M48 24v22" stroke="#fff" stroke-width="2.5" fill="none"/><path d="M48 46l12-9V15" fill="#3e9a48"/>'),
  can: V('<rect x="14" y="14" width="36" height="38" fill="#f2b632"/><ellipse cx="32" cy="14" rx="18" ry="7" fill="#ffe08a" stroke="#b77e13" stroke-width="2"/><ellipse cx="32" cy="52" rx="18" ry="7" fill="#f2b632"/>'),
  circle: V('<circle cx="32" cy="32" r="26" fill="#e0648a"/>'),
  tri: V('<path d="M32 8 60 56H4Z" fill="#f2b632"/>'),
  square: V('<rect x="8" y="8" width="48" height="48" fill="#4f9ad6"/>'),
  rect: V('<rect x="3" y="17" width="58" height="30" fill="#57b84a"/>'),
  sun: V('<circle cx="32" cy="32" r="15" fill="#f2b632"/><g stroke="#f2b632" stroke-width="5" stroke-linecap="round"><path d="M32 4v9M32 51v9M4 32h9M51 32h9M12 12l6 6M46 46l6 6M52 12l-6 6M18 46l-6 6"/></g>'),
  moon: V('<rect width="64" height="64" rx="14" fill="#2b3a6b"/><path d="M42 12a23 23 0 1 0 8 34A19 19 0 1 1 42 12Z" fill="#ffe08a"/><circle cx="50" cy="20" r="2.5" fill="#fff"/>'),
  lunch: V('<ellipse cx="32" cy="44" rx="27" ry="12" fill="#fff" stroke="#c9b98f" stroke-width="2"/><path d="M12 42a20 18 0 0 1 40 0Z" fill="#f7e7c1"/><circle cx="26" cy="31" r="3" fill="#e0533f"/><circle cx="38" cy="29" r="3" fill="#57b84a"/>'),
  school: V('<rect x="10" y="26" width="44" height="30" fill="#f4c26b"/><path d="M4 28 32 8l28 20Z" fill="#d6476b"/><rect x="27" y="40" width="10" height="16" fill="#8a5a2b"/>'),
  clip: V('<path d="M8 26h40a10 10 0 0 1 0 20H18a7 7 0 0 1 0-13h28" stroke="#6b7b8f" stroke-width="4.5" fill="none" stroke-linecap="round"/>'),
  foot: V('<ellipse cx="32" cy="42" rx="16" ry="19" fill="#8c6a48"/><circle cx="17" cy="18" r="6" fill="#8c6a48"/><circle cx="29" cy="11" r="6" fill="#8c6a48"/><circle cx="42" cy="13" r="6" fill="#8c6a48"/><circle cx="51" cy="23" r="5" fill="#8c6a48"/>'),
  basket: V('<path d="M8 28h48l-6 30H14Z" fill="#c98d4b" stroke="#8a5a2b" stroke-width="2.5"/><path d="M14 28a18 22 0 0 1 36 0" stroke="#8a5a2b" stroke-width="4" fill="none"/>'),
  star: V('<path d="M32 5l8 18 20 2-15 13 5 20-18-11-18 11 5-20L4 25l20-2Z" fill="#f2b632"/>'),
};
['b', 'r', 'g'].forEach(c => {
  ICON['paper_' + c] = V(`<rect x="12" y="6" width="40" height="52" rx="3" fill="${col[c]}"/><path d="M19 18h26M19 28h26M19 38h18" stroke="#fff" stroke-width="3.5"/>`);
  ICON['bottle_' + c] = V(`<rect x="26" y="4" width="12" height="11" fill="#fff" stroke="${col[c]}" stroke-width="2"/><path d="M26 15c-11 6-11 13-11 20v21a4 4 0 0 0 4 4h26a4 4 0 0 0 4-4V35c0-7 0-14-11-20Z" fill="${col[c]}" opacity=".85"/>`);
  ICON['tin_' + c] = V(`<rect x="14" y="10" width="36" height="46" rx="4" fill="${col[c]}"/><ellipse cx="32" cy="11" rx="18" ry="5" fill="#d7dde4" stroke="#8f9aa6" stroke-width="2"/><path d="M14 26h36M14 42h36" stroke="#fff" stroke-width="3"/>`);
});
const ic = n => ICON[n] || '';
// 每種東西的量詞，回饋句用
const UNIT = { fly: '隻', bird: '隻', pine: '顆', apple: '顆', pear: '顆', bead: '顆', mush: '朵', honey: '罐', stick: '根' };
const un = (st, item) => st.u || UNIT[item || st.item] || '個';
const ani = (a, st = '') => `<img class="ani" src="assets/${a}.webp" alt="" draggable="false" style="${st}">`;
const COIN = { 1: ['#c6ccd3', 1], 5: ['#b9c3cc', 5], 10: ['#e0b64c', 10], 50: ['#e8c23a', 50] };
const coin = v => { const c = COIN[v][0], R0 = v === 1 ? 20 : v === 5 ? 24 : v === 10 ? 27 : 30; return `<svg class="coin" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="${R0 + 2}" fill="${c}" stroke="#7d7768" stroke-width="2"/><text x="32" y="${32 + 8}" text-anchor="middle" font-size="${v >= 10 ? 22 : 24}" font-weight="700" fill="#3d3a30">${v}</text></svg>`; };
ICON.coin1 = coin(1);
const it = (html, v = 1, extra = '') => `<span class="it ${extra}" data-v="${v}">${html}</span>`;
const itemsGrid = (list, size) => `<div class="items sz${size}">${list.join('')}</div>`;
const szOf = n => n <= 5 ? 'L' : n <= 10 ? 'M' : 'S';
const OPT_INNER = o => {
  if (typeof o === 'number') return `<span class="num big">${o}</span>`;
  if (typeof o === 'string') return `<span class="opt-t">${nums(esc(o))}</span>`;
  if (o.c) return `<i class="swatch" style="background:${o.c}"></i><span class="opt-t">${esc(o.label)}</span>`;
  if (o.ani) return `${ani(o.ani, 'height:64px')}<span>${esc(o.label)}</span>`;
  if (o.ic) return `${ic(o.ic)}<span>${esc(o.label)}</span>`;
  return '';
};

/* ---------- 畫面裡的場景：數量都畫出來，可以一個一個點數 ---------- */
function worm(b, off = 0) { return `<div class="worm" style="margin-left:${off}px">${Array.from({ length: b.len }, (_, i) => `<span class="it seg" data-v="1" style="background:${b.c}"></span>`).join('')}<span class="wface" style="background:${b.c}"></span></div>`; }
const strandHtml = (t, o, item = 'bead') => `${Array.from({ length: t }, () => `<div class="strand">${Array.from({ length: 10 }, () => it(ic('bead'), 1)).join('')}</div>`).join('')}${o ? `<div class="loose">${Array.from({ length: o }, () => it(ic('bead'), 1)).join('')}</div>` : ''}`;
const sticksHtml = (t, o, gt = 0, go = 0) => `<div class="sticks">${Array.from({ length: t }, () => it(ic('bundle'), 10, 'bdl')).join('')}${Array.from({ length: gt }, () => `<span class="gone bdl">${ic('bundle')}</span>`).join('')}</div>${o || go ? `<div class="sticks ones">${Array.from({ length: o }, () => it(ic('stick'), 1, 'one')).join('')}${Array.from({ length: go }, () => `<span class="gone one">${ic('stick')}</span>`).join('')}</div>` : ''}`;
const frameHtml = (n, item, extraCls = '') => `<div class="frame ${extraCls}">${Array.from({ length: 10 }, (_, i) => `<span class="cell">${i < n ? it(ic(item)) : ''}</span>`).join('')}</div>`;
function framesScene(n, item, gone = 0) {
  const first = Math.min(10, n), second = n - first;
  return `${frameHtml(first, item)}${second > 0 ? frameHtml(second, item) : ''}${gone ? `<div class="gone-row">${Array.from({ length: gone }, () => `<span class="gone">${ic(item)}</span>`).join('')}</div>` : ''}`;
}
function calHtml(c, marks = []) {
  let cells = '';
  for (let i = 0; i < c.start; i++) cells += '<span class="cal-e"></span>';
  for (let d = 1; d <= c.days; d++) cells += `<button class="cal-d${marks.includes(d) ? ' mk' : ''}${c.today === d ? ' today' : ''}" data-day="${d}">${d}${c.today === d ? '<i class="stard">★</i>' : ''}</button>`;
  return `<div class="cal"><div class="cal-m"><span class="num">${c.month}</span> 月</div><div class="cal-h">${'日一二三四五六'.split('').map(x => `<b>${x}</b>`).join('')}</div><div class="cal-g">${cells}</div></div>`;
}
function clockSvg(h, half, id = '') {
  const hA = (h % 12) * 30 + (half ? 15 : 0), mA = half ? 180 : 0;
  let nums1 = '';
  for (let i = 1; i <= 12; i++) { const a = i * 30 * Math.PI / 180; nums1 += `<text x="${130 + 100 * Math.sin(a)}" y="${130 - 100 * Math.cos(a) + 9}" text-anchor="middle" font-size="26" font-weight="700" fill="#33405a">${i}</text>`; }
  return `<svg class="clock" ${id ? `id="${id}"` : ''} viewBox="0 0 260 260"><circle cx="130" cy="130" r="124" fill="#fffdf7" stroke="#8a5a2b" stroke-width="8"/>${nums1}<g class="hh" transform="rotate(${hA} 130 130)"><line x1="130" y1="130" x2="130" y2="74" stroke="#d6476b" stroke-width="11" stroke-linecap="round"/><circle cx="130" cy="74" r="10" fill="#d6476b"/></g><g class="mh" transform="rotate(${mA} 130 130)"><line x1="130" y1="130" x2="130" y2="44" stroke="#3b82c4" stroke-width="7" stroke-linecap="round"/><circle cx="130" cy="44" r="10" fill="#3b82c4"/></g><circle cx="130" cy="130" r="8" fill="#33405a"/></svg>`;
}
const polyC = pts => { const a = pts.split(' ').map(p => p.split(',').map(Number)); return [a.reduce((s, p) => s + p[0], 0) / a.length, a.reduce((s, p) => s + p[1], 0) / a.length]; };
function scene(s) {
  switch (s.s) {
    case 'items': {
      const list = [];
      for (let i = 0; i < s.n; i++) list.push(it(ic(s.item), 1, s.on ? 'on' : ''));
      for (let i = 0; i < (s.gone || 0); i++) list.push(`<span class="gone">${ic(s.item)}</span>`);
      for (let i = 0; i < (s.ghost || 0); i++) list.push(`<span class="ghost">${ic(s.item)}</span>`);
      if (!s.n && !s.gone) return `<div class="empty">${ic('basket')}</div>`;
      return itemsGrid(list, szOf(s.n + (s.gone || 0) + (s.ghost || 0)));
    }
    case 'two': {
      const g = x => x.ani ? itemsGrid(Array.from({ length: x.n }, () => it(ani(x.ani))), szOf(x.n + 2)) : itemsGrid(Array.from({ length: x.n }, () => it(ic(x.item))), szOf(x.n + 2));
      return `<div class="two"><div class="grp">${g(s.a)}</div><b class="sign">${s.sign || ''}</b><div class="grp">${g(s.b)}</div></div>`;
    }
    case 'strands': return `<div class="strands">${strandHtml(s.t, s.o)}</div>`;
    case 'sticks': return sticksHtml(s.t, s.o, s.goneT || 0, s.goneO || 0);
    case 'twoS': {
      const g = n => s.kind === 'strands' ? strandHtml(Math.floor(n / 10), n % 10) : sticksHtml(Math.floor(n / 10), n % 10);
      return `<div class="two small"><div class="grp"><p class="grp-t">${s.sign ? '' : '左邊'}</p>${g(s.a)}</div><b class="sign">${s.sign || ''}</b><div class="grp"><p class="grp-t">${s.sign ? '' : '右邊'}</p>${g(s.b)}</div></div>`;
    }
    case 'bars': return `<div class="track"><i class="startline"></i>${s.bars.map(b => worm(b)).join('')}</div>`;
    case 'tall': return `<div class="stand">${s.bars.map(b => `<div class="tall">${ani(b.ani, `height:${b.len * 24}px`)}<small>${esc(b.label)}</small></div>`).join('')}</div>`;
    case 'far': return `<div class="track far"><i class="startline"></i>${s.rows.map(r => `<div class="hop">${Array.from({ length: r.n }, () => it(ic('foot'))).join('')}${ani(r.ani, 'height:44px')}</div>`).join('')}</div>`;
    case 'line': return `<div class="queue"><span class="front">前</span>${s.line.map((a, i) => `<div class="q-a${i === s.mark ? ' mk' : ''}">${i < (s.upto || 0) ? `<span class="it ani-it" data-v="1">${ani(a.ani)}</span>` : ani(a.ani)}</div>`).join('')}</div>`;
    case 'pairs': { const m = Math.max(s.top, s.bot), row = (n, f) => `<div class="pair-r">${Array.from({ length: m }, (_, i) => i < n ? `<span class="it" data-v="1">${f()}</span>` : '<span class="empty1"></span>').join('')}</div>`; return `<div class="pairs">${row(s.top, () => ani(CUTE_ANI[0]))}${row(s.bot, () => ic('ice'))}</div>`; }
    case 'clock': return clockSvg(s.h, s.half);
    case 'ic': return `<div class="big-ic">${ic(s.ic)}</div>`;
    case 'cal': return calHtml(s, s.marks);
    case 'week': return `<div class="week">${'日一二三四五六'.split('').map((x, i) => `<span class="wk${i === s.mark ? ' mk' : ''}">${x}</span>`).join('')}</div>`;
    case 'frames': return framesScene(s.n, s.item, s.gone);
    case 'framesAB': return `<div class="fab">${frameHtml(s.a, s.item)}${frameHtml(s.b, s.item)}</div>`;
    case 'path': return `<div class="paths">${s.rows.map(n => `<div class="path-r">${Array.from({ length: n }, () => it(ic(s.unit))).join('')}${s.join ? `<i class="joint"></i>${Array.from({ length: s.join }, () => it(ic(s.unit))).join('')}` : ''}</div>`).join('')}</div>`;
    case 'path2': return `<div class="paths"><div class="path-r foot" style="--w:${s.foot * 3}">${Array.from({ length: s.foot }, () => it(ic('foot'))).join('')}</div><div class="path-road"></div><div class="path-r clip" style="--w:${s.clip}">${Array.from({ length: s.clip }, () => it(ic('clip'))).join('')}</div></div>`;
    case 'puzzle': return `<svg class="puz" viewBox="0 0 240 240">${s.slots.map(x => `<polygon points="${x.pts}" fill="${x.c}" stroke="#fff" stroke-width="3"/>`).join('')}</svg>`;
    case 'spread': return `<div class="items spread sz${szOf(s.n)}">${Array.from({ length: s.n }, () => it(ic(s.item), 1, 'on')).join('')}</div>`;
    case 'frameLoose': return `${frameHtml(Math.min(10, s.a), s.item)}<div class="loose-row">${Array.from({ length: s.b }, () => it(ic(s.item))).join('')}</div>`;
    case 'frames2': {
      // 十格框和框外一排：拿走的畫成淡色，看得出拿走的是外面幾個、框裡幾個
      const cells = (n, gone) => Array.from({ length: n }, (_, i) => `<span class="cell">${i < n - gone ? it(ic(s.item)) : `<span class="gone">${ic(s.item)}</span>`}</span>`).join('');
      return `<div class="frame">${cells(10, s.goneIn)}</div><div class="loose-row">${Array.from({ length: s.out }, (_, i) => i < s.out - s.goneOut ? it(ic(s.item)) : `<span class="gone">${ic(s.item)}</span>`).join('')}</div>`;
    }
    case 'lay2': {
      // 同一條路（300 長）：一條一根接一根排滿，一條中間留空；迴紋針一樣長，都從左邊起點開始
      const clip = (x, y) => `<path d="M${x + 3} ${y + 3}h48a9 9 0 0 1 0 18h-42a6 6 0 0 1 0-12h36" stroke="#5f6f84" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
      const row = (r, y) => { const w = 60, gap = r.gap ? (300 - r.n * w) / (r.n - 1) : 0; let g = ''; for (let i = 0; i < r.n; i++) g += clip(10 + i * (w + gap), y); return `${g}<rect x="10" y="${y + 27}" width="300" height="7" rx="3" fill="#bda26a"/>`; };
      return `<div class="lay2">${s.rows.map((r, i) => `<div class="lay-r"><b class="lay-t">${esc(r.label)}</b><svg viewBox="0 0 320 40" class="lay-svg">${row(r, 2)}<rect x="8" y="0" width="3" height="38" fill="#d6476b"/><rect x="309" y="0" width="3" height="38" fill="#d6476b"/></svg></div>`).join('')}</div>`;
    }
    case 'tally': return `<div class="tally">${s.rows.map(r => `<div class="t-row"><b>${esc(r.label)}</b>${r.ics.map(i => it(ic(i))).join('')}</div>`).join('')}</div>`;
  }
  return '';
}
const CUTE_ANI = ['squirrel'];
// 場景裡的東西都可以點來數
function bindCount(root) {
  let c = 0;
  root.querySelectorAll('.it').forEach(el => {
    el.onclick = () => {
      const b = el.querySelector('.bdg');
      if (b) { b.remove(); c -= +el.dataset.v; return; }
      c += +el.dataset.v; el.insertAdjacentHTML('beforeend', `<i class="bdg">${c}</i>`); say(String(c), true); sfx.hop();
    };
  });
  root._reset = () => { c = 0; root.querySelectorAll('.bdg').forEach(b => b.remove()); };
}
async function countOut(root, slow = 480) {
  const els = [...root.querySelectorAll('.it')];
  root.querySelectorAll('.bdg').forEach(b => b.remove());
  let c = 0;
  const gap = Math.min(slow, 5000 / Math.max(1, els.length)); // 東西很多時數快一點，示範不超過 5 秒
  for (const el of els) { c += +el.dataset.v; el.insertAdjacentHTML('beforeend', `<i class="bdg">${c}</i>`); say(String(c), true); await wait(gap); }
  return c;
}

/* ---------- 拖放：手指和滑鼠都用 pointer ---------- */
function draggable(el, { zones, onDrop, onTap }) {
  el.classList.add('dg');
  el.addEventListener('pointerdown', e => {
    e.preventDefault();
    const r = el.getBoundingClientRect(), sx = e.clientX, sy = e.clientY;
    let moved = false, g = null;
    const mv = ev => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) > 7) {
        moved = true;
        g = el.cloneNode(true); g.className += ' ghost-d'; g.style.width = r.width + 'px'; g.style.height = r.height + 'px'; g.style.left = r.left + 'px'; g.style.top = r.top + 'px';
        document.body.appendChild(g); el.classList.add('lift');
      }
      if (g) g.style.transform = `translate(${dx}px,${dy}px) scale(1.08)`;
    };
    const up = ev => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      if (g) g.remove();
      el.classList.remove('lift');
      if (!moved) return onTap && onTap(el);
      const z = zones().find(n => { const b = n.getBoundingClientRect(), p = 14; return ev.clientX > b.left - p && ev.clientX < b.right + p && ev.clientY > b.top - p && ev.clientY < b.bottom + p; });
      onDrop(el, z || null);
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  });
}
const okBtn = (label = '好了') => { $('actions').innerHTML = `<button class="btn big" id="ok">${label}</button>`; return $('ok'); };

/* ---------- 互動元件 ---------- */
const WID = {
  // 選答案：答錯立刻用東西數給你看，第二次就直接看答案
  pick(st, api) {
    const w = $('work');
    w.innerHTML = `<div class="opts n${st.opts.length}${st.opts.some(o => typeof o === 'object' && (o.ic || o.ani)) ? ' pic' : ''}">${st.opts.map((o, i) => `<button class="opt" data-o="${i}">${OPT_INNER(o)}</button>`).join('')}</div>`;
    let wrong = 0, busy = false;
    w.querySelectorAll('.opt').forEach(b => b.onclick = async () => {
      if (busy) return;
      if (+b.dataset.o === st.a) { w.querySelectorAll('.opt').forEach(x => x.disabled = true); b.classList.add('yes'); return api.done(); }
      b.classList.add('no'); b.disabled = true; wrong++; api.miss(); busy = true;
      const sc = $('scene'), counted = !st.noCount && sc.querySelector('.it');
      if (counted) await countOut(sc); else await wait(300);
      busy = false;
      if (!w.isConnected) return;
      if (wrong >= 2) { const y = w.querySelector(`[data-o="${st.a}"]`); y.classList.add('yes'); w.querySelectorAll('.opt').forEach(x => x.disabled = true); api.giveUp(); api.done(st.why || '答案在這裡。'); }
      else setM(st.hint || (counted ? '一個一個數，再選一次。' : '再看一次圖，再選一次。'), 'hint');
    });
  },
  // 一下才有的大按鈕 0～9
  pad(st, api) {
    $('work').innerHTML = keypadHtml();
    let wrong = 0, busy = false;
    bindKeypad(async (val, clear) => {
      if (busy) return;
      if (val === st.val) { $('kpv').textContent = val; $('kp').classList.add('done'); return api.done(); }
      wrong++; api.miss(); clear(); busy = true;
      const sc = $('scene');
      if (sc.querySelector('.it')) await countOut(sc); else await wait(300);
      busy = false;
      if (!$('kp')) return;
      if (wrong >= 2) { $('kpv').textContent = st.val; $('kp').classList.add('done'); api.giveUp(); api.done(`答案是 ${st.val}。`); }
      else setM('再按一次。', 'hint');
    });
  },
  // 點一隻亮一隻
  count(st, api) {
    const w = $('work');
    w.innerHTML = `<div class="items sz${szOf(st.n)}">${Array.from({ length: st.n }, () => `<button class="lightme">${ic(st.item)}</button>`).join('')}</div>`;
    let c = 0;
    w.querySelectorAll('.lightme').forEach(b => b.onclick = () => {
      if (b.classList.contains('on')) return;
      c++; b.classList.add('on'); b.insertAdjacentHTML('beforeend', `<i class="bdg">${c}</i>`); say(String(c), true); sfx.hop();
      if (c === st.n) api.done(`每隻點一次，最後數到 ${st.n}。`);
    });
  },
  // 拖到框內，放到指定數量
  dragN(st, api) {
    const w = $('work');
    w.innerHTML = `<div class="pile" id="pile">${Array.from({ length: st.total }, () => `<span class="di">${ic(st.item)}</span>`).join('')}</div><div class="dz" id="dz" data-z="1"><span class="dz-ic">${ic('basket')}</span><div class="dz-in" id="dzIn"></div></div>`;
    const dz = $('dz'), inn = $('dzIn'), pile = $('pile');
    const numbers = () => { [...inn.children].forEach((c, i) => { let b = c.querySelector('.bdg'); if (!b) { c.insertAdjacentHTML('beforeend', '<i class="bdg"></i>'); b = c.querySelector('.bdg'); } b.textContent = i + 1; }); };
    const toggle = el => { if (el.parentElement === pile) { inn.appendChild(el); numbers(); say(String(inn.children.length), true); sfx.hop(); } else { const b = el.querySelector('.bdg'); if (b) b.remove(); pile.appendChild(el); numbers(); } };
    w.querySelectorAll('.di').forEach(el => draggable(el, { zones: () => [dz], onTap: toggle, onDrop: (e, z) => { if ((z && e.parentElement === pile) || (!z && e.parentElement === inn)) toggle(e); } }));
    let wrong = 0;
    okBtn().onclick = () => {
      const k = inn.children.length;
      if (k === st.n) { $('actions').innerHTML = ''; w.querySelectorAll('.di').forEach(e => e.style.pointerEvents = 'none'); return api.done(`數到 ${st.n} 就停下來，籃子裡有 ${st.n} ${un(st)}。`); }
      api.miss(); wrong++;
      setM(k > st.n ? `太多了，要 ${st.n} ${un(st)}。點籃子裡的，拿回去一些。` : `還不夠，要 ${st.n} ${un(st)}。再放進去一些。`, 'hint');
      if (wrong >= 2) { while (inn.children.length > st.n) toggle(inn.lastElementChild); while (inn.children.length < st.n) toggle(pile.firstElementChild); api.giveUp(); $('actions').innerHTML = ''; api.done(`這樣是 ${st.n} ${un(st)}。`); }
    };
  },
  // 果子分兩盤
  split(st, api) {
    const w = $('work');
    w.innerHTML = `<div class="pile" id="pile">${Array.from({ length: st.n }, () => `<span class="di">${ic(st.item)}</span>`).join('')}</div><div class="plates"><div class="dz plate" id="pa" data-z="a"><div class="dz-in"></div></div><div class="dz plate" id="pb" data-z="b"><div class="dz-in"></div></div></div>`;
    const pa = $('pa'), pb = $('pb'), pile = $('pile');
    const nA = () => pa.querySelector('.dz-in').children.length, nB = () => pb.querySelector('.dz-in').children.length;
    const check = () => {
      if (pile.children.length) return;
      if (!nA() || !nB()) return setM(`兩盤都要有${st.item === 'apple' || st.item === 'pear' ? '果子' : '東西'}。點一個拿回來，放到空盤子。`, 'hint');
      if (st.avoid && api.ctx.split && api.ctx.split[0] === nA() && api.ctx.split[1] === nB()) { const a0 = nA(), b0 = nB(); w.querySelectorAll('.plate .di').forEach(e => pile.appendChild(e)); return setM(`剛才分過 ${a0} 和 ${b0} 了。先點一個盤子，再點果子，換一種分法。`, 'hint'); }
      w.querySelectorAll('.di').forEach(e => e.style.pointerEvents = 'none');
      api.ctx.split = [nA(), nB()];
      api.done(`${st.n} ${un(st)}分成 ${nA()} ${un(st)}和 ${nB()} ${un(st)}。`);
    };
    // 點盤子選好要放哪一盤，再點果子；沒選盤子就輪流放
    let turn = 0, target = null;
    [pa, pb].forEach(p => p.addEventListener('click', ev => { if (ev.target.closest('.di')) return; target = p; pa.classList.toggle('sel', p === pa); pb.classList.toggle('sel', p === pb); }));
    w.querySelectorAll('.di').forEach(el => draggable(el, {
      zones: () => [pa, pb],
      onTap: e => { if (e.parentElement !== pile) { pile.appendChild(e); } else { (target || (turn++ % 2 ? pb : pa)).querySelector('.dz-in').appendChild(e); sfx.hop(); check(); } },
      onDrop: (e, z) => { if (z) { z.querySelector('.dz-in').appendChild(e); sfx.hop(); check(); } else if (e.parentElement !== pile) pile.appendChild(e); },
    }));
  },
  // 點排隊的第幾隻
  tapOne(st, api) {
    const w = $('work');
    w.innerHTML = `<div class="queue"><span class="front">前</span>${st.line.map((a, i) => `<button class="q-a" data-i="${i}">${ani(a.ani)}</button>`).join('')}</div>`;
    let wrong = 0, busy = false;
    const qs = [...w.querySelectorAll('.q-a')];
    qs.forEach(b => b.onclick = async () => {
      if (busy) return;
      if (+b.dataset.i === st.ans) { qs.forEach(x => x.disabled = true); b.classList.add('yes'); return api.done(`對了，是${st.line[st.ans].label}。`); }
      api.miss(); wrong++; busy = true; b.classList.add('no');
      const order = st.from === 'back' ? qs.slice().reverse() : qs, stop = st.from === 'back' ? st.line.length - st.ans : st.ans + 1;
      w.querySelectorAll('.bdg').forEach(x => x.remove());
      for (let i = 0; i < stop; i++) { order[i].insertAdjacentHTML('beforeend', `<i class="bdg">${i + 1}</i>`); say(String(i + 1), true); await wait(480); }
      busy = false;
      if (!w.isConnected) return;
      if (wrong >= 2) { qs.forEach(x => x.disabled = true); qs[st.ans].classList.add('yes'); api.giveUp(); api.done(`從${st.from === 'back' ? '後面' : '「前」'}數到 ${stop}，是${st.line[st.ans].label}。`); } else setM(`從${st.from === 'back' ? '最後面' : '「前」這一頭'}開始，一隻一隻數，再點一次。`, 'hint');
    });
  },
  // 一對一連線
  match(st, api) {
    const w = $('work');
    w.innerHTML = `<div class="mt" id="mt"><svg class="mt-l" id="mtl"></svg><div class="mt-r">${Array.from({ length: st.top }, (_, i) => `<button class="mt-a" data-t="${i}">${ani(CUTE_ANI[0])}</button>`).join('')}</div><div class="mt-r bot">${Array.from({ length: st.bot }, (_, i) => `<button class="mt-b" data-b="${i}">${ic('ice')}</button>`).join('')}</div></div>`;
    const box = $('mt'), svg = $('mtl'), goal = Math.min(st.top, st.bot);
    let sel = null, made = 0;
    const center = el => { const a = el.getBoundingClientRect(), b = box.getBoundingClientRect(); return [a.left + a.width / 2 - b.left, a.top + a.height / 2 - b.top]; };
    const link = (a, b) => {
      if (a.classList.contains('used') || b.classList.contains('used')) return;
      a.classList.add('used'); b.classList.add('used'); a.classList.remove('sel');
      const [x1, y1] = center(a), [x2, y2] = center(b);
      svg.insertAdjacentHTML('beforeend', `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#d6476b" stroke-width="5" stroke-linecap="round"/>`);
      made++; sfx.hop(); sel = null;
      if (made === goal) api.done('連好了！');
    };
    w.querySelectorAll('.mt-a,.mt-b').forEach(el => {
      el.style.touchAction = 'none';
      el.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (el.classList.contains('used')) return;
        const up = ev => {
          window.removeEventListener('pointerup', up);
          const tg = document.elementFromPoint(ev.clientX, ev.clientY), other = tg && tg.closest('.mt-a,.mt-b');
          if (other && other !== el && other.className.split(' ')[0] !== el.className.split(' ')[0]) return link(el.classList.contains('mt-a') ? el : other, el.classList.contains('mt-a') ? other : el);
          if (sel && sel !== el && sel.className.split(' ')[0] !== el.className.split(' ')[0]) return link(sel.classList.contains('mt-a') ? sel : el, sel.classList.contains('mt-a') ? el : sel);
          if (sel) sel.classList.remove('sel');
          sel = el; el.classList.add('sel');
        };
        window.addEventListener('pointerup', up);
      });
    });
  },
  // 拉到起跑線或地上
  align(st, api) {
    const w = $('work');
    if (!st.v) {
      w.innerHTML = `<div class="track" id="tk"><i class="startline"></i>${st.bars.map((b, i) => `<div class="aw" data-i="${i}" style="transform:translateX(${60 + i * 34}px)">${worm(b)}</div>`).join('')}</div>`;
    } else {
      w.innerHTML = `<div class="stand" id="tk">${st.bars.map((b, i) => `<div class="aw v" data-i="${i}" style="transform:translateY(${-50 - i * 26}px)">${ani(b.ani, `height:${b.len * 24}px`)}</div>`).join('')}<i class="ground"></i></div>`;
    }
    const left = new Set(st.bars.map((_, i) => i));
    w.querySelectorAll('.aw').forEach(el => {
      const i = +el.dataset.i; let cur = st.v ? -50 - i * 26 : 60 + i * 34;
      el.style.touchAction = 'none';
      el.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (!left.has(i)) return;
        const s0 = st.v ? e.clientY : e.clientX, c0 = cur;
        const mv = ev => { const d = (st.v ? ev.clientY : ev.clientX) - s0; cur = st.v ? Math.min(0, c0 + d) : Math.max(0, c0 + d); el.style.transform = st.v ? `translateY(${cur}px)` : `translateX(${cur}px)`; };
        const up = () => {
          window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
          if (Math.abs(cur) < 22) { cur = 0; el.style.transform = st.v ? 'translateY(0)' : 'translateX(0)'; el.classList.add('snap'); left.delete(i); sfx.hop(); if (!left.size) api.done(st.v ? '腳都踩在地上了，可以比了。' : '尾巴都對齊起跑線了，可以比了。'); }
        };
        window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
      });
    });
  },
  // 拖到對應的框或桶
  sort(st, api) {
    const w = $('work');
    w.innerHTML = `<div class="pile" id="pile">${st.items.map(x => `<span class="di" data-tag="${x.tag}">${ic(x.ic)}</span>`).join('')}</div><div class="bins n${st.bins.length}">${st.bins.map(b => `<div class="dz bin${b.bin ? ' can' : ''}" data-id="${b.id}" ${b.tint ? `style="border-color:${col[b.tint]}"` : ''}>${b.outline ? `<span class="outl">${ic(b.outline)}</span>` : b.ic ? `<span class="binic">${ic(b.ic)}</span>` : ''}${b.label ? `<b>${esc(b.label)}</b>` : ''}<div class="dz-in"></div></div>`).join('')}</div>`;
    const bins = [...w.querySelectorAll('.bin')];
    let sel = null, wrongOnce = false;
    const place = (e, z) => {
      if (z.dataset.id === e.dataset.tag) {
        e.classList.remove('sel'); z.querySelector('.dz-in').appendChild(e); e.style.pointerEvents = 'none'; sfx.hop(); sel = null;
        if (!$('pile').children.length) api.done('都放好了。');
      } else {
        if (!wrongOnce) { wrongOnce = true; api.miss(); } else sfx.retry();
        e.classList.add('shake'); setTimeout(() => e.classList.remove('shake'), 400);
        const right = bins.find(b => b.dataset.id === e.dataset.tag);
        right.classList.add('flash'); setTimeout(() => right.classList.remove('flash'), T(900));
        setM(st.hint || '不是這一桶。看在閃的那一桶。', 'hint');
      }
    };
    w.querySelectorAll('.di').forEach(el => draggable(el, { zones: () => bins, onTap: e => { if (sel) sel.classList.remove('sel'); sel = e; e.classList.add('sel'); }, onDrop: (e, z) => { if (z) place(e, z); } }));
    bins.forEach(b => b.onclick = () => { if (sel) place(sel, b); });
  },
  // 撥鐘：短針、長針各自拖
  clock(st, api) {
    const w = $('work');
    let h = st.h % 12 + 3, half = !st.half; h = (h - 1) % 12 + 1;
    w.innerHTML = clockSvg(h, half, 'dial');
    const svg = $('dial');
    const draw = () => { svg.querySelector('.hh').setAttribute('transform', `rotate(${(h % 12) * 30 + (half ? 15 : 0)} 130 130)`); svg.querySelector('.mh').setAttribute('transform', `rotate(${half ? 180 : 0} 130 130)`); };
    const pos = e => { const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 260 - 130, y = (e.clientY - r.top) / r.height * 260 - 130; return { a: (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360, r: Math.hypot(x, y) }; };
    svg.style.touchAction = 'none';
    svg.addEventListener('pointerdown', e => {
      e.preventDefault();
      const p = pos(e), hand = p.r < 66 ? 'h' : 'm';
      const set = q => { if (hand === 'h') { const d = (q.a - (half ? 15 : 0) + 360) % 360; h = Math.round(d / 30) % 12 || 12; } else half = q.a > 90 && q.a < 270; draw(); };
      set(p);
      const mv = ev => set(pos(ev));
      const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); sfx.hop(); };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    });
    let wrong = 0;
    okBtn().onclick = () => {
      if (h === st.h && half === !!st.half) { $('actions').innerHTML = ''; return api.done(st.half ? `${st.h} 點半，長針指 6，短針在 ${st.h} 和 ${st.h % 12 + 1} 中間。` : `${st.h} 點，短針指 ${st.h}，長針指 12。`); }
      api.miss(); wrong++;
      if (wrong >= 2) { h = st.h; half = !!st.half; draw(); api.giveUp(); $('actions').innerHTML = ''; return api.done(st.half ? `這是 ${st.h} 點半。長針指 6，短針在 ${st.h} 和 ${st.h % 12 + 1} 中間。` : `這是 ${st.h} 點。短針指 ${st.h}，長針指 12。`); }
      setM(st.half ? `把長針拖到 6，短針拖到 ${st.h} 和 ${st.h % 12 + 1} 中間。` : `把短針拖到 ${st.h}，長針拖到 12。`, 'hint');
    };
  },
  // 讓鐘走半圈：長針從 12 走到 6，短針同時走到兩個數中間
  clockRun(st, api) {
    const w = $('work');
    w.innerHTML = clockSvg(st.h, false, 'dial');
    const svg = $('dial');
    okBtn('讓鐘走').onclick = async () => {
      $('actions').innerHTML = '';
      for (let k = 1; k <= 30; k++) { svg.querySelector('.mh').setAttribute('transform', `rotate(${k * 6} 130 130)`); svg.querySelector('.hh').setAttribute('transform', `rotate(${(st.h % 12) * 30 + k * .5} 130 130)`); await wait(70); }
      if (!svg.isConnected) return;
      api.done(`長針走到 6，短針走到 ${st.h} 和 ${st.h % 12 + 1} 的中間。`);
    };
  },
  // 依序點
  order(st, api) {
    const w = $('work');
    w.innerHTML = `<div class="cards">${st.cards.map((c, i) => `<button class="card1" data-r="${c.rank}">${ic(c.ic)}<span>${esc(c.text)}</span></button>`).join('')}</div>`;
    let at = 0, oops = false;
    w.querySelectorAll('.card1').forEach(b => b.onclick = () => {
      if (b.classList.contains('used')) return;
      if (+b.dataset.r === at) { at++; b.classList.add('used'); b.insertAdjacentHTML('beforeend', `<i class="bdg">${at}</i>`); sfx.hop(); if (at === st.cards.length) api.done('順序對了！'); }
      else { if (!oops) { oops = true; api.miss(); } else sfx.retry(); b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); const r = w.querySelector(`[data-r="${at}"]`); r.classList.add('flash'); setTimeout(() => r.classList.remove('flash'), T(900)); setM('這一件要先做。看在閃的那一張。', 'hint'); }
    });
  },
  // 月曆點選
  cal(st, api) {
    const w = $('work');
    w.innerHTML = calHtml(st);
    const need = new Set(st.ans); let oops = 0;
    w.querySelectorAll('.cal-d').forEach(b => b.onclick = () => {
      const d = +b.dataset.day;
      if (need.has(d)) { need.delete(d); b.classList.add('mk'); sfx.hop(); if (!need.size) { w.querySelectorAll('.cal-d').forEach(x => x.disabled = true); api.done('找到了。'); } }
      else if (!b.classList.contains('mk')) {
        if (!oops) api.miss(); else sfx.retry();
        oops++;
        need.forEach(x => { const r = w.querySelector(`[data-day="${x}"]`); r.classList.add('flash'); setTimeout(() => r.classList.remove('flash'), T(900)); });
        setM(st.hint || '不是這一天。看在閃的格子。', 'hint');
      }
    });
  },
  // 錢幣拖放：怎麼付都可以，夠就對
  coin(st, api) {
    const w = $('work');
    w.innerHTML = `${st.thing ? `<div class="thing">${ic(st.thing)}<span class="tag"><span class="num">${st.target}</span> 元</span></div>` : st.showBig ? `<div class="thing">${coin(st.showBig)}</div>` : ''}<div class="dz tray" id="tray"><div class="dz-in" id="trayIn"></div></div><div class="bank">${st.avail.map(v => `<button class="cb" data-v="${v}">${coin(v)}</button>`).join('')}</div>`;
    const tray = $('tray'), inn = $('trayIn');
    const combo = () => [...inn.children].map(c => +c.dataset.v).sort((a, b) => a - b).join(',');
    const said = () => { const c = {}; [...inn.children].forEach(x => c[x.dataset.v] = (c[x.dataset.v] || 0) + 1); return Object.keys(c).sort((a, b) => b - a).map(v => `${c[v]} 個 ${v} 元`).join('和 '); };
    const addCoin = v => { const s = document.createElement('button'); s.className = 'tc'; s.dataset.v = v; s.innerHTML = coin(v); s.onclick = () => s.remove(); inn.appendChild(s); sfx.hop(); };
    w.querySelectorAll('.cb').forEach(el => draggable(el, { zones: () => [tray], onTap: e => addCoin(+e.dataset.v), onDrop: (e, z) => { if (z) addCoin(+e.dataset.v); } }));
    let wrong = 0;
    okBtn('付錢').onclick = () => {
      const sum = [...inn.children].reduce((s, c) => s + +c.dataset.v, 0);
      if (sum === st.target && st.avoid && combo() === api.ctx.lastCombo) return setM('這一種用過了，換別的錢。', 'hint');
      if (sum === st.target) { api.ctx.lastCombo = combo(); $('actions').innerHTML = ''; return api.done(`用 ${said()}，剛好 ${st.target} 元。`); }
      api.miss(); wrong++;
      setM(sum > st.target ? `太多了。現在有 ${sum} 元，要 ${st.target} 元。點盤子裡的錢，拿回來一些。` : `還不夠。現在有 ${sum} 元，要 ${st.target} 元。再放一些錢。`, 'hint');
      if (wrong >= 2) {
        inn.innerHTML = ''; let rest = st.target;
        const avail = st.avail.slice().sort((a, b) => b - a), last = (api.ctx.lastCombo || '');
        avail.forEach(v => { while (rest >= v) { addCoin(v); rest -= v; } });
        if (st.avoid && combo() === last && st.avail.includes(1)) { inn.innerHTML = ''; for (let i = 0; i < st.target; i++) addCoin(1); }
        api.giveUp(); api.ctx.lastCombo = combo(); $('actions').innerHTML = ''; api.done(`用 ${said()}，就是 ${st.target} 元。`);
      }
    };
  },
  // 拼出數量：整捆和單根
  bundle(st, api) {
    const w = $('work');
    w.innerHTML = `<div class="bank"><button class="cb big" data-v="10">${ic('bundle')}<span>一捆</span></button><button class="cb big" data-v="1">${ic('stick')}<span>一根</span></button></div><div class="dz tray tall2" id="tray"><div class="dz-in" id="trayIn"></div></div>`;
    const tray = $('tray'), inn = $('trayIn');
    const add = v => { const s = document.createElement('button'); s.className = 'tc ' + (v === 10 ? 'bdl' : 'one'); s.dataset.v = v; s.innerHTML = ic(v === 10 ? 'bundle' : 'stick'); s.onclick = () => s.remove(); inn.appendChild(s); sfx.hop(); };
    w.querySelectorAll('.cb').forEach(el => draggable(el, { zones: () => [tray], onTap: e => add(+e.dataset.v), onDrop: (e, z) => { if (z) add(+e.dataset.v); } }));
    const sum = () => [...inn.children].reduce((s, c) => s + +c.dataset.v, 0);
    let wrong = 0;
    okBtn().onclick = async () => {
      if (sum() === st.n) { $('actions').innerHTML = ''; return api.done(`${Math.floor(st.n / 10)} 捆和 ${st.n % 10} 根，是 ${st.n} 根。`); }
      api.miss(); wrong++;
      const now = sum();
      setM(`你拼的是 ${now} 根，要 ${st.n} 根。`, 'hint');
      if (wrong >= 2) { inn.innerHTML = ''; for (let i = 0; i < Math.floor(st.n / 10); i++) add(10); for (let i = 0; i < st.n % 10; i++) add(1); api.giveUp(); $('actions').innerHTML = ''; api.done(`${Math.floor(st.n / 10)} 捆和 ${st.n % 10} 根，就是 ${st.n} 根。`); }
    };
  },
  // 每 10 個串起來／綁起來
  strand(st, api) {
    const w = $('work'), stick = st.item === 'stick';
    w.innerHTML = `<div class="rack" id="rack"></div><div class="pile small" id="pile">${Array.from({ length: st.n }, () => `<button class="sb">${ic(st.item)}</button>`).join('')}</div>`;
    const rack = $('rack'); let cur = 0, row = null, made = 0;
    w.querySelectorAll('.sb').forEach(b => b.onclick = () => {
      if (cur === 0) { row = document.createElement('div'); row.className = stick ? 'rack-b' : 'strand'; rack.appendChild(row); }
      b.remove(); row.insertAdjacentHTML('beforeend', `<span class="cellb">${ic(st.item)}</span>`); cur++; sfx.hop();
      say(String(made * 10 + cur), true);
      if (cur === 10) { made++; cur = 0; if (stick) row.innerHTML = `<span class="tied">${ic('bundle')}</span>`; else row.classList.add('tied'); say(stick ? `${made} 捆` : `${made} 串`, true); }
      if (!$('pile').children.length) api.done(stick ? `${made} 捆和 ${st.n % 10} 根，一共 ${st.n} 根。` : `${made} 串和 ${st.n % 10} 顆，一共 ${st.n} 顆。`);
    });
    // 不滿 10 的留在外面：滿了之後剩下的自動停在外面才合理，所以最後一串不用排滿
  },
  // 打開一捆
  openB(st, api) {
    const w = $('work');
    w.innerHTML = `<button class="bundle-big" id="bb">${ic('bundle')}</button><div class="items szM" id="ones"></div>`;
    $('bb').onclick = async () => {
      $('bb').remove();
      const o = $('ones');
      for (let i = 1; i <= 10; i++) { o.insertAdjacentHTML('beforeend', `<span class="it" data-v="1">${ic('stick')}<i class="bdg">${i}</i></span>`); say(String(i), true); await wait(260); }
      api.done('打開了，一根一根數到 10，有 10 根。');
    };
  },
  // 搬到十格盤
  frameAdd(st, api) {
    const w = $('work');
    w.innerHTML = `<div class="frame" id="fm">${Array.from({ length: 10 }, (_, i) => `<span class="cell">${i < st.a ? `<span class="fi">${ic(st.item)}</span>` : ''}</span>`).join('')}</div><div class="pile" id="pile">${Array.from({ length: st.b }, () => `<span class="di">${ic(st.item)}</span>`).join('')}</div>`;
    const fm = $('fm');
    const put = e => {
      const c = [...fm.children].find(x => !x.children.length);
      if (!c) return;
      c.appendChild(e); e.style.pointerEvents = 'none'; e.classList.remove('di'); e.classList.add('fi'); sfx.hop();
      if (![...fm.children].find(x => !x.children.length)) { $('pile').querySelectorAll('.di').forEach(x => x.style.pointerEvents = 'none'); api.done(`框裡滿 10 ${un(st)}了，外面還有 ${st.a + st.b - 10} ${un(st)}。`); }
    };
    w.querySelectorAll('.di').forEach(el => draggable(el, { zones: () => [fm], onTap: put, onDrop: (e, z) => { if (z) put(e); } }));
  },
  // 點掉（小鳥、蜂蜜、整捆單根）
  tapOff(st, api) {
    const w = $('work');
    if (st.sticks) {
      w.innerHTML = sticksHtml(st.tn, st.on);
      let mt = st.mt, mo = st.mo, oops = false;
      w.querySelectorAll('.it').forEach(el => {
        el.classList.add('offable');
        el.onclick = () => {
          if (el.classList.contains('out')) return;
          const big = el.classList.contains('bdl');
          if ((big && !mt) || (!big && !mo)) { if (!oops) { oops = true; api.miss(); } setM(big ? `整捆已經搬走 ${st.mt} 捆了，再點單根。` : `單根已經搬走 ${st.mo} 根了，再點整捆。`, 'hint'); return; }
          if (big) mt--; else mo--;
          el.classList.add('out'); sfx.hop();
          if (!mt && !mo) api.done(`搬走 ${st.mt} 捆和 ${st.mo} 根了。`);
        };
      });
      return;
    }
    if (st.frames) {
      w.innerHTML = `${frameHtml(10, st.item, 'mainf')}${frameHtml(st.n - 10, st.item, 'loosef')}`;
      let left = st.off, oops = false;
      const loose = () => w.querySelectorAll('.loosef .it:not(.out)').length;
      w.querySelectorAll('.it').forEach(el => {
        el.classList.add('offable');
        el.onclick = () => {
          if (el.classList.contains('out')) return;
          if (el.closest('.mainf') && loose()) { if (!oops) { oops = true; api.miss(); } setM(`先拿外面的，外面還有 ${loose()} ${un(st)}。`, 'hint'); w.querySelectorAll('.loosef .it:not(.out)').forEach(x => { x.classList.add('flash'); setTimeout(() => x.classList.remove('flash'), T(900)); }); return; }
          el.classList.add('out'); left--; sfx.hop(); say(String(st.off - left), true);
          if (!left) api.done(`拿走 ${st.off} ${un(st)}了，還剩 ${st.n - st.off} ${un(st)}。`);
        };
      });
      return;
    }
    w.innerHTML = `<div class="items sz${szOf(st.n)}">${Array.from({ length: st.n }, () => `<button class="it offable">${ic(st.item)}</button>`).join('')}</div>`;
    let left = st.off;
    w.querySelectorAll('.it').forEach(el => el.onclick = () => {
      if (el.classList.contains('out') || !left) return;
      el.classList.add('out', 'flyaway'); left--; sfx.hop(); say(String(st.off - left), true);
      if (!left) api.done(`${st.item === 'bird' ? '飛走' : '拿走'} ${st.off} ${un(st)}，還剩 ${st.n - st.off} ${un(st)}。`);
    });
  },
  // 上船
  board(st, api) {
    const w = $('work');
    w.innerHTML = `<div class="dock-r"><div class="pile" id="pile">${st.who.flatMap((a, i) => Array.from({ length: i ? st.b : st.a }, () => `<span class="di ani-d">${ani(a.ani)}</span>`)).join('')}</div></div><div class="dz boat" id="boat"><div class="dz-in" id="bin"></div></div>`;
    const boat = $('boat'), inn = $('bin');
    let c = 0;
    const put = e => { inn.appendChild(e); e.style.pointerEvents = 'none'; c++; say(String(c), true); sfx.hop(); if (!$('pile').children.length) api.done(`全部上船了，一共 ${c} 隻。`); };
    w.querySelectorAll('.di').forEach(el => draggable(el, { zones: () => [boat], onTap: put, onDrop: (e, z) => { if (z) put(e); } }));
  },
  // 換位子
  swap(st, api) {
    const w = $('work');
    const g = n => itemsGrid(Array.from({ length: n }, () => it(ic(st.item))), szOf(n + 2));
    w.innerHTML = `<div class="two" id="tw"><div class="grp" id="ga">${g(st.a)}</div><b class="sign">＋</b><div class="grp" id="gb">${g(st.b)}</div></div>`;
    okBtn('換位子').onclick = () => { const a = $('ga').innerHTML; $('ga').innerHTML = $('gb').innerHTML; $('gb').innerHTML = a; sfx.hop(); $('actions').innerHTML = ''; api.done('換好了！'); };
  },
  // 推推看、疊疊看
  tryIt(st, api) {
    const w = $('work');
    w.innerHTML = `<div class="tries">${st.items.map(k => `<button class="try${st.lying ? ' lying' : ''}" data-k="${k}">${ic(k)}</button>`).join('')}</div>`;
    let left = st.items.length;
    w.querySelectorAll('.try').forEach(b => b.onclick = () => {
      if (b.classList.contains('used')) return;
      b.classList.add('used', b.dataset.k === 'ball' || b.dataset.k === 'can' ? (st.stack ? 'fall' : 'roll') : (st.stack ? 'stackup' : 'still'));
      if (st.stack && b.dataset.k !== 'ball') b.insertAdjacentHTML('afterbegin', `<span class="dbl">${ic(b.dataset.k)}</span>`);
      sfx.hop(); left--;
      if (!left) api.done(st.stack ? '方方的能疊，球會掉下來。' : st.items.length === 1 ? (st.items[0] === 'ball' || st.items[0] === 'can' ? '輕輕推，它就滾走了。' : '推了，它沒有滾。') : '球滾走了，方塊沒有滾。');
    });
  },
  // 用迴紋針、腳印排滿
  lay(st, api) {
    const w = $('work');
    w.innerHTML = `<div class="road dz" id="road" style="--n:${st.n}">${Array.from({ length: st.n }, () => `<span class="slot ${st.unit}"></span>`).join('')}</div><div class="bank"><button class="cb big" id="src">${ic(st.unit)}</button></div>`;
    const road = $('road');
    const put = () => { const s = road.querySelector('.slot:empty'); if (!s) return; s.innerHTML = ic(st.unit); sfx.hop(); const c = road.querySelectorAll('.slot:not(:empty)').length; s.insertAdjacentHTML('beforeend', `<i class="bdg">${c}</i>`); say(String(c), true); if (!road.querySelector('.slot:empty')) api.done(`一個接一個排滿了，是 ${st.n} ${st.unit === 'foot' ? '個腳印' : '根迴紋針'}長。`); };
    draggable($('src'), { zones: () => [road], onTap: put, onDrop: (e, z) => { if (z) put(); } });
  },
  // 拼圖
  puzzle(st, api) {
    const w = $('work');
    w.innerHTML = `<svg class="puz" id="pz" viewBox="0 0 240 240">${st.slots.map((s, i) => `<polygon class="slot-p" data-i="${i}" data-s="${s.shape}" points="${s.pts}" fill="#fff" stroke="#8a7b5c" stroke-width="3" stroke-dasharray="7 6"/>`).join('')}</svg><div class="pcs" id="pcs">${Logic.shuffle(st.slots.map((s, i) => ({ s, i }))).map(({ s, i }) => { const pts = s.pts.split(' ').map(p => p.split(',').map(Number)), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), minx = Math.min(...xs), miny = Math.min(...ys), wd = Math.max(...xs) - minx, ht = Math.max(...ys) - miny; return `<span class="pc" data-s="${s.shape}" data-i="${i}"><svg viewBox="${minx - 2} ${miny - 2} ${wd + 4} ${ht + 4}" style="width:${wd * .55}px;height:${ht * .55}px"><polygon points="${s.pts}" fill="${s.c}"/></svg></span>`; }).join('')}</div>`;
    const pz = $('pz'); let oops = false;
    const fit = e => {
      const i = +e.dataset.i, s = st.slots[i], poly = pz.querySelector(`[data-i="${i}"]`);
      poly.setAttribute('fill', s.c); poly.setAttribute('stroke', '#fff'); poly.removeAttribute('stroke-dasharray');
      e.remove(); sfx.hop();
      if (!$('pcs').children.length) api.done('拼好了。');
    };
    w.querySelectorAll('.pc').forEach(el => draggable(el, { zones: () => [pz], onTap: e => { const p = pz.querySelector(`[data-i="${e.dataset.i}"]`); p.classList.add('flash'); setTimeout(() => p.classList.remove('flash'), T(900)); }, onDrop: (e, z) => {
      if (!z) return;
      fit(e);
    } }));
  },
  // 描邊
  trace(st, api) {
    const P = { tri: [[120, 20], [220, 210], [20, 210]], square: [[40, 40], [200, 40], [200, 200], [40, 200]], rect: [[10, 70], [230, 70], [230, 170], [10, 170]] }[st.shape];
    const w = $('work');
    w.innerHTML = `<svg class="puz" id="tr" viewBox="0 0 240 240"><polygon points="${P.map(p => p.join(',')).join(' ')}" fill="none" stroke="#d9cfae" stroke-width="4" stroke-dasharray="8 8"/><g id="tl"></g>${P.map((p, i) => `<g class="dot" data-i="${i}"><circle cx="${p[0]}" cy="${p[1]}" r="20" fill="${i === 0 ? '#f2b632' : '#fff'}" stroke="#8a5a2b" stroke-width="3"/><text x="${p[0]}" y="${p[1] + 7}" text-anchor="middle" font-size="20" font-weight="700" fill="#33405a">${i + 1}</text></g>`).join('')}</svg>`;
    const tl = $('tl'); let at = 0, oops = false;
    const line = (a, b) => tl.insertAdjacentHTML('beforeend', `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#3b82c4" stroke-width="7" stroke-linecap="round"/>`);
    w.querySelectorAll('.dot').forEach(d => d.onclick = () => {
      const i = +d.dataset.i;
      if (i !== at) { if (!oops) { oops = true; api.miss(); } setM(`要點 ${at + 1}。`, 'hint'); return; }
      if (at > 0) line(P[at - 1], P[at]);
      d.querySelector('circle').setAttribute('fill', '#f2b632'); sfx.hop(); at++;
      if (at === P.length) { line(P[at - 1], P[0]); api.done(`描好了！有 ${P.length} 個邊。`); }
    });
  },
  // 照樣疊積木
  stack(st, api) {
    const w = $('work'), H = 4, cols = st.model.length, h = st.model.map(() => 0);
    const grid = (arr, id, btn) => `<div class="blk" ${id ? `id="${id}"` : ''} style="grid-template-columns:repeat(${cols},1fr)">${Array.from({ length: H }, (_, r) => arr.map((v, c) => { const fill = H - r <= v; return btn ? `<button class="bk${fill ? ' f' : ''}" data-c="${c}" data-r="${H - r}" aria-label="格子"></button>` : `<span class="bk${fill ? ' f' : ''}"></span>`; }).join('')).join('')}</div>`;
    w.innerHTML = `<div class="blk-w"><div>${grid(st.model)}</div><div id="mine">${grid(h, 'bg', true)}</div></div>`;
    const draw = () => { $('mine').innerHTML = grid(h, 'bg', true); bind(); };
    const bind = () => $('bg').querySelectorAll('.bk').forEach(b => b.onclick = () => { const c = +b.dataset.c, r = +b.dataset.r; h[c] = h[c] === r ? r - 1 : r; sfx.hop(); draw(); });
    bind();
    let wrong = 0;
    okBtn().onclick = () => {
      if (h.every((v, i) => v === st.model[i])) { $('actions').innerHTML = ''; return api.done('一模一樣！'); }
      api.miss(); wrong++;
      if (wrong >= 2) { st.model.forEach((v, i) => h[i] = v); draw(); api.giveUp(); $('actions').innerHTML = ''; return api.done('要這樣疊。'); }
      const i = h.findIndex((v, j) => v !== st.model[j]);
      setM(`看第 ${i + 1} 排，要疊 ${st.model[i]} 個。`, 'hint');
    };
  },
  // 用自己的記號記下來
  record(st, api) {
    const w = $('work'), MARKS = ['●', '✓', '★'];
    let mk = 0;
    const cnt = st.rows.map(() => 0);
    w.innerHTML = `<div class="marks">${MARKS.map((m, i) => `<button class="mk-b${i ? '' : ' sel'}" data-m="${i}">${m}</button>`).join('')}</div>${st.rows.map((r, i) => `<div class="rec" data-i="${i}"><div class="rec-h"><b>${esc(r.label)}</b>${r.ics.map(x => ic(x)).join('')}</div><div class="rec-m"><button class="addm" data-i="${i}" aria-label="加一個記號">＋</button><span class="rec-l" id="rl${i}"></span></div></div>`).join('')}`;
    w.querySelectorAll('.mk-b').forEach(b => b.onclick = () => { mk = +b.dataset.m; w.querySelectorAll('.mk-b').forEach(x => x.classList.toggle('sel', x === b)); });
    w.querySelectorAll('.addm').forEach(b => b.onclick = () => {
      const i = +b.dataset.i; cnt[i]++; sfx.hop();
      const sp = document.createElement('button'); sp.className = 'ml'; sp.textContent = MARKS[mk]; sp.onclick = () => { sp.remove(); cnt[i]--; };
      $('rl' + i).appendChild(sp);
    });
    let wrong = 0;
    okBtn().onclick = () => {
      if (cnt.every((c, i) => c === st.rows[i].n)) { $('actions').innerHTML = ''; return api.done(`記好了：${st.rows.map(r => `${r.label} ${r.n} 個記號`).join('，')}。這是你自己的記法。`); }
      api.miss(); wrong++;
      const i = cnt.findIndex((c, j) => c !== st.rows[j].n);
      setM(`${st.rows[i].label}有 ${st.rows[i].n} 個，再對一對。`, 'hint');
      if (wrong >= 2) { st.rows.forEach((r, j) => { while (cnt[j] < r.n) w.querySelector(`.addm[data-i="${j}"]`).click(); while (cnt[j] > r.n) { $('rl' + j).lastElementChild.click(); } }); api.giveUp(); $('actions').innerHTML = ''; api.done('這樣就對了。'); }
    };
  },
};
const QUIZ_STAR = 1;
/* ---------- 單元數感測驗（共用，來源 D:/數感測驗題庫/quiz_ui.js） ---------- */
const QUIZ_LV = { basic: ['簡單題', 25], adv: ['挑戰題', 25], fun: ['動腦題', 10], pose: ['出題', 10] };
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
  quizShell('小測驗', () => go(''), `<p class="tag">每一關都有三種題目。</p><div class="lessons">${books.map((b, i) => {
    const total = b.units.reduce((n, U) => n + quizLevels(U).length, 0), done = b.units.reduce((n, U) => n + quizLevels(U).filter(l => quizBest(`${b.id}-${U.u}-${l}`) !== undefined).length, 0);
    return `<button class="lesson" data-b="${i}"><span class="l-t"><b>${b.name}</b><small>${b.units.length} 關</small></span><em class="sem">${done} / ${total}</em></button>`;
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
    document.getElementById('ra').innerHTML = `${wrong.length ? '<button class="btn" id="rw">再做一次錯的</button>' : ''}<button class="btn alt" id="rb">回去</button>`;
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
(function () { const Q = window.QUIZ; if (!Q || !Q.books) return; Q.books.filter(b => b.id === '1a').forEach(b => b.units.forEach(U => ['basic', 'adv', 'fun'].forEach(l => (U[l] || []).forEach(q => { if (q.t === 'num') { const o = Logic.near(q.a, 0, Math.max(q.a + 3, 10)); q.t = 'choice'; q.o = o.map(String); q.a = o.indexOf(q.a); } })))); })();
route();
