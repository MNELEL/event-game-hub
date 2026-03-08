import { Question, DEFAULT_CATEGORIES } from "@/types/game";

export function exportStandaloneHTML(questions: Question[], title: string) {
  const getCategoryName = (id: string) => DEFAULT_CATEGORIES.find(c => c.id === id)?.name || id;

  const questionsJSON = JSON.stringify(questions);

  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Tahoma,sans-serif;background:linear-gradient(135deg,#1a1a2e,#16213e,#0f3460);color:#fff;min-height:100vh}
.container{max-width:700px;margin:0 auto;padding:20px}
h1{text-align:center;font-size:2rem;margin:20px 0;color:#f5c518}
.question-card{background:rgba(255,255,255,0.08);border-radius:16px;padding:24px;margin:16px 0;backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1)}
.q-text{font-size:1.2rem;font-weight:600;margin-bottom:16px}
.q-meta{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}
.badge{padding:4px 12px;border-radius:20px;font-size:0.75rem;background:rgba(255,255,255,0.15)}
.options{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.option{padding:14px;border-radius:12px;background:rgba(255,255,255,0.06);border:2px solid rgba(255,255,255,0.1);cursor:pointer;text-align:center;transition:all 0.2s;font-size:1rem}
.option:hover{background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.3)}
.option.correct{background:rgba(46,204,113,0.3);border-color:#2ecc71}
.option.wrong{background:rgba(231,76,60,0.3);border-color:#e74c3c}
.option.selected{transform:scale(0.97)}
.score-bar{text-align:center;padding:16px;font-size:1.3rem;color:#f5c518;font-weight:bold}
.controls{display:flex;justify-content:center;gap:12px;margin:20px 0}
button.btn{padding:12px 32px;border:none;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer;transition:all 0.2s}
.btn-primary{background:linear-gradient(135deg,#f5c518,#e6a800);color:#1a1a2e}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 4px 15px rgba(245,197,24,0.4)}
.btn-secondary{background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.2)}
.hidden{display:none}
.result-msg{text-align:center;padding:10px;font-size:1.1rem;margin-top:10px;border-radius:8px}
.result-msg.correct{color:#2ecc71}
.result-msg.wrong{color:#e74c3c}
.progress{display:flex;justify-content:center;gap:4px;margin:16px 0}
.progress .dot{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,0.2)}
.progress .dot.done-correct{background:#2ecc71}
.progress .dot.done-wrong{background:#e74c3c}
.progress .dot.current{background:#f5c518;box-shadow:0 0 8px #f5c518}
.final{text-align:center;padding:40px 20px}
.final h2{font-size:2rem;color:#f5c518;margin-bottom:16px}
.final p{font-size:1.2rem;margin:8px 0;color:rgba(255,255,255,0.8)}
</style>
</head>
<body>
<div class="container">
  <h1>🧠 ${title}</h1>
  <div class="score-bar">ניקוד: <span id="score">0</span> | שאלה <span id="qnum">1</span> מתוך <span id="qtotal">0</span></div>
  <div class="progress" id="progress"></div>
  <div id="game"></div>
  <div class="controls" id="controls"></div>
</div>
<script>
const questions = ${questionsJSON};
const categories = ${JSON.stringify(Object.fromEntries(DEFAULT_CATEGORIES.map(c => [c.id, c.name])))};
let current = 0, score = 0, answered = false, results = [];

function render() {
  if (current >= questions.length) { showFinal(); return; }
  const q = questions[current];
  answered = false;
  document.getElementById('qnum').textContent = current + 1;
  document.getElementById('qtotal').textContent = questions.length;
  document.getElementById('score').textContent = score;
  renderProgress();
  
  let html = '<div class="question-card">';
  html += '<div class="q-meta"><span class="badge">' + (categories[q.category] || q.category) + '</span><span class="badge">' + q.points + ' נק׳</span></div>';
  html += '<div class="q-text">' + escapeHtml(q.text) + '</div>';
  if (q.type === 'image' && q.mediaUrl) html += '<img src="' + escapeHtml(q.mediaUrl) + '" style="max-width:100%;border-radius:8px;margin-bottom:12px">';
  html += '<div class="options">';
  q.options.forEach((opt, i) => {
    html += '<div class="option" data-idx="' + i + '" onclick="answer(' + i + ')">' + escapeHtml(opt) + '</div>';
  });
  html += '</div><div id="result-msg"></div></div>';
  document.getElementById('game').innerHTML = html;
  document.getElementById('controls').innerHTML = '';
}

function answer(idx) {
  if (answered) return;
  answered = true;
  const q = questions[current];
  const correct = idx === q.correctAnswer;
  if (correct) score += q.points;
  results.push(correct);
  document.querySelectorAll('.option').forEach((el, i) => {
    if (i === q.correctAnswer) el.classList.add('correct');
    if (i === idx && !correct) el.classList.add('wrong');
    el.classList.add('selected');
  });
  const msg = document.getElementById('result-msg');
  msg.className = 'result-msg ' + (correct ? 'correct' : 'wrong');
  msg.textContent = correct ? '✅ תשובה נכונה!' : '❌ תשובה שגויה';
  document.getElementById('score').textContent = score;
  renderProgress();
  document.getElementById('controls').innerHTML = '<button class="btn btn-primary" onclick="next()">הבא →</button>';
}

function next() { current++; render(); }

function showFinal() {
  const correctCount = results.filter(r => r).length;
  document.getElementById('game').innerHTML = '<div class="final"><h2>🎉 המשחק נגמר!</h2><p>ניקוד סופי: ' + score + '</p><p>תשובות נכונות: ' + correctCount + ' מתוך ' + questions.length + '</p></div>';
  document.getElementById('controls').innerHTML = '<button class="btn btn-primary" onclick="restart()">שחק שוב</button>';
  renderProgress();
}

function restart() { current = 0; score = 0; results = []; render(); }

function renderProgress() {
  let html = '';
  questions.forEach((_, i) => {
    let cls = 'dot';
    if (i < results.length) cls += results[i] ? ' done-correct' : ' done-wrong';
    else if (i === current) cls += ' current';
    html += '<div class="' + cls + '"></div>';
  });
  document.getElementById('progress').innerHTML = html;
}

function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

render();
<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title}-offline.html`;
  a.click();
  URL.revokeObjectURL(url);
}
