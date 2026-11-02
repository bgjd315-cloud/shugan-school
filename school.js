const G = [
  { g: 1, zh: '一年級', name: '數感小森林', key: 'shugan1-v1', tip: '幫小亮亮點亮森林', units: '18 小站', books: 18, m: [71, 91], w: [25, 93], ruby: 1 },
  { g: 2, zh: '二年級', name: '數感小鎮', key: 'shugan-v1', tip: '趕走小鎮的大霧', units: '8 地點', books: 20, m: [36, 78], w: [30, 69] },
  { g: 3, zh: '三年級', name: '數感星星島', key: 'shugan3-v1', tip: '點亮夜空的星星', units: '12 座島', books: 19, m: [70, 61], w: [45, 68] },
  { g: 4, zh: '四年級', name: '數感飛船', key: 'shugan4-v1', tip: '造飛船飛向月亮', units: '17 工坊', books: 20, m: [41, 42], w: [62, 58] },
  { g: 5, zh: '五年級', name: '數感月球城', key: 'shugan5-v1', tip: '在月球蓋一座城', units: '20 工坊', books: 20, m: [33, 29], w: [73, 75] },
  { g: 6, zh: '六年級', name: '數感銀河站', key: 'shugan6-v1', tip: '開通銀河航線，拿畢業證書', units: '14 站區', books: 14, m: [65, 16], w: [90, 35] },
];
const Z = {};
'一ㄧ 到ㄉㄠˋ 六ㄌㄧㄡˋ 年ㄋㄧㄢˊ 級ㄐㄧˊ 的˙ㄉㄜ 數ㄕㄨˋ 感ㄍㄢˇ 遊ㄧㄡˊ 戲ㄒㄧˋ 小ㄒㄧㄠˇ 學ㄒㄩㄝˊ 堂ㄊㄤˊ 先ㄒㄧㄢ 動ㄉㄨㄥˋ 手ㄕㄡˇ 再ㄗㄞˋ 作ㄗㄨㄛˋ 答ㄉㄚˊ 選ㄒㄩㄢˇ 繼ㄐㄧˋ 續ㄒㄩˋ 玩ㄨㄢˊ 亮ㄌㄧㄤˋ 成ㄔㄥˊ 長ㄓㄤˇ 路ㄌㄨˋ 線ㄒㄧㄢˋ 從ㄘㄨㄥˊ 森ㄙㄣ 林ㄌㄧㄣˊ 走ㄗㄡˇ 銀ㄧㄣˊ 河ㄏㄜˊ 每ㄇㄟˇ 站ㄓㄢˋ 都ㄉㄡ 開ㄎㄞ 放ㄈㄤˋ 想ㄒㄧㄤˇ 哪ㄋㄚˇ 就ㄐㄧㄡˋ 點ㄉㄧㄢˇ 個ㄍㄜˋ 幫ㄅㄤ 鎮ㄓㄣˋ 趕ㄍㄢˇ 大ㄉㄚˋ 霧ㄨˋ 星ㄒㄧㄥ 島ㄉㄠˇ 夜ㄧㄝˋ 空ㄎㄨㄥ 二ㄦˋ 三ㄙㄢ 完ㄨㄢˊ 測ㄘㄜˋ 驗ㄧㄢˋ 還ㄏㄞˊ 沒ㄇㄟˊ 始ㄕˇ'.split(' ').forEach(x => { Z[x[0]] = x.slice(1); });
function bp(r) { // 和遊戲相同的排法：注音直排，聲調獨立在右邊，輕聲點在上面
  let top = '', tone = '', s = r;
  if (s[0] === '˙') { top = '<i class="qing">˙</i>'; s = s.slice(1); }
  if ('ˊˇˋ'.includes(s[s.length - 1])) { tone = `<i class="tone">${s[s.length - 1]}</i>`; s = s.slice(0, -1); }
  return `<span class="bp" aria-hidden="true">${top}${[...s].map(c => `<span>${c}</span>`).join('')}${tone}</span>`;
}
const zy = t => t.replace(/[一-鿿]/g, c => Z[c] ? `<span class="zc">${c}${bp(Z[c])}</span>` : c);
const label = (x, t) => x.g <= 3 ? zy(t) : t;
function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function last(n) { try { if (n) localStorage.setItem('school-last', n); return localStorage.getItem('school-last'); } catch (e) { return null; } }
const url = x => `g${x.g}/`;
function quizDone(s) { return s && s.quiz ? Object.keys(s.quiz).length : 0; }
document.getElementById('pins').innerHTML = G.map(x => `<a class="pin" href="${url(x)}" data-g="${x.g}" style="--mx:${x.m[0]}%;--my:${x.m[1]}%;--wx:${x.w[0]}%;--wy:${x.w[1]}%" aria-label="${x.zh} ${x.name}"><img src="assets/badge${x.g}.webp" alt=""><b>${x.g}</b></a>`).join('');
document.getElementById('cards').innerHTML = G.map(x => {
  const s = load(x.key), d = quizDone(s), all = x.books * 4;
  return `<a class="card" href="${url(x)}" data-g="${x.g}"><div class="pic"><img loading="lazy" src="assets/world${x.g}.webp" alt=""><img class="bdg" src="assets/badge${x.g}.webp" alt=""></div>
  <div class="c-t"><small>${label(x, x.zh)}</small><h3>${label(x, x.name)}</h3><p>${label(x, x.tip)}</p>
  <div class="bar"><i style="width:${Math.min(100, d / all * 100)}%"></i></div><span class="st">${label(x, s ? `完成測驗 ${d} / ${all}` : '還沒開始')}</span></div></a>`;
}).join('');
document.getElementById('rows').innerHTML = G.map(x => `<tr><td>${x.zh}</td><td><a href="${url(x)}">${x.name}</a></td><td>${x.units}</td><td>${x.books * 70} 題</td><td>${quizDone(load(x.key))} / ${x.books * 4}</td></tr>`).join('');
document.querySelectorAll('[data-g]').forEach(a => a.addEventListener('click', () => last(a.dataset.g)));
const L = G.find(x => String(x.g) === last());
if (L) { const c = document.getElementById('cont'); c.hidden = false; c.href = url(L); c.textContent = '繼續玩 ' + L.name; }
document.querySelectorAll('[data-zy]').forEach(e => { e.innerHTML = zy(e.textContent); });
