const G = [
  { g: 1, zh: '一年級', name: '數感小森林', key: 'shugan1-v1', tip: '幫小亮亮點亮森林', units: '18 小站', books: 18, m: [71, 91], w: [25, 93], ruby: 1 },
  { g: 2, zh: '二年級', name: '數感小鎮', key: 'shugan-v1', tip: '趕走小鎮的大霧', units: '8 地點', books: 20, m: [36, 78], w: [30, 69] },
  { g: 3, zh: '三年級', name: '數感星星島', key: 'shugan3-v1', tip: '點亮夜空的星星', units: '12 座島', books: 19, m: [70, 61], w: [45, 68] },
  { g: 4, zh: '四年級', name: '數感飛船', key: 'shugan4-v1', tip: '造飛船飛向月亮', units: '17 工坊', books: 20, m: [41, 42], w: [62, 58] },
  { g: 5, zh: '五年級', name: '數感月球城', key: 'shugan5-v1', tip: '在月球蓋一座城', units: '20 工坊', books: 20, m: [33, 29], w: [73, 75] },
  { g: 6, zh: '六年級', name: '數感銀河站', key: 'shugan6-v1', tip: '開通銀河航線，拿畢業證書', units: '14 站區', books: 14, m: [65, 16], w: [90, 35] },
];
const RB = { 數: 'ㄕㄨˋ', 感: 'ㄍㄢˇ', 小: 'ㄒㄧㄠˇ', 森: 'ㄙㄣ', 林: 'ㄌㄧㄣˊ', 一: 'ㄧ', 年: 'ㄋㄧㄢˊ', 級: 'ㄐㄧˊ' };
const ruby = t => [...t].map(c => `<span class="zc">${c}<span class="bp" aria-hidden="true">${RB[c]}</span></span>`).join('');
const label = (x, t) => x.ruby ? ruby(t) : t;
function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function last(n) { try { if (n) localStorage.setItem('school-last', n); return localStorage.getItem('school-last'); } catch (e) { return null; } }
const url = x => `g${x.g}/`;
function quizDone(s) { return s && s.quiz ? Object.keys(s.quiz).length : 0; }
document.getElementById('pins').innerHTML = G.map(x => `<a class="pin" href="${url(x)}" data-g="${x.g}" style="--mx:${x.m[0]}%;--my:${x.m[1]}%;--wx:${x.w[0]}%;--wy:${x.w[1]}%" aria-label="${x.zh} ${x.name}"><img src="assets/badge${x.g}.webp" alt=""><b>${x.g}</b></a>`).join('');
document.getElementById('cards').innerHTML = G.map(x => {
  const s = load(x.key), d = quizDone(s), all = x.books * 3;
  return `<a class="card" href="${url(x)}" data-g="${x.g}"><div class="pic"><img loading="lazy" src="assets/world${x.g}.webp" alt=""><img class="bdg" src="assets/badge${x.g}.webp" alt=""></div>
  <div class="c-t"><small>${label(x, x.zh)}</small><h3>${label(x, x.name)}</h3><p>${x.tip}</p>
  <div class="bar"><i style="width:${Math.min(100, d / all * 100)}%"></i></div><span class="st">${s ? `完成測驗 ${d} / ${all}` : '還沒開始'}</span></div></a>`;
}).join('');
document.getElementById('rows').innerHTML = G.map(x => `<tr><td>${x.zh}</td><td><a href="${url(x)}">${x.name}</a></td><td>${x.units}</td><td>${x.books * 60} 題</td><td>${quizDone(load(x.key))} / ${x.books * 3}</td></tr>`).join('');
document.querySelectorAll('[data-g]').forEach(a => a.addEventListener('click', () => last(a.dataset.g)));
const L = G.find(x => String(x.g) === last());
if (L) { const c = document.getElementById('cont'); c.hidden = false; c.href = url(L); c.textContent = '繼續玩 ' + L.name; }
