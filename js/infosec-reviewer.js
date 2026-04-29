/* InfoSec Reviewer — Core Logic */

let questions = [...INFOSEC_QUESTIONS];
let order = questions.map((_, i) => i);  // index mapping
let currentIdx = 0;  // position in order[]
let userAnswers = {};  // order-index -> selected option index
let isShuffled = false;

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/* ─── Init ─── */
window.addEventListener('DOMContentLoaded', () => {
  renderQuestion();
  buildNavDots();
  updateProgress();
});

/* ─── Render ─── */
function renderQuestion() {
  const qi = order[currentIdx];
  const q = questions[qi];
  const card = document.getElementById('question-card');
  
  // Trigger animation
  card.style.animation = 'none';
  card.offsetHeight;
  card.style.animation = 'cardIn 0.35s ease';

  document.getElementById('q-number').textContent = `Question ${currentIdx + 1} of ${questions.length}`;
  document.getElementById('q-text').textContent = q.question;

  const scoreEl = document.getElementById('q-score');
  const answered = userAnswers[qi] !== undefined;

  if (answered) {
    const isCorrect = userAnswers[qi] === q.answer;
    scoreEl.textContent = isCorrect ? '✓ Correct' : '✗ Wrong';
    scoreEl.className = 'q-score ' + (isCorrect ? 'correct' : 'wrong');
  } else {
    scoreEl.textContent = '';
    scoreEl.className = 'q-score';
  }

  const container = document.getElementById('options-container');
  container.innerHTML = '';

  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `
      <span class="option-letter">${LETTERS[i]}</span>
      <span class="option-text">${opt}</span>
    `;

    if (answered) {
      const selected = userAnswers[qi];
      const isCorrectAnswer = i === q.answer;
      const wasSelected = i === selected;
      const userWasCorrect = selected === q.answer;

      if (wasSelected && userWasCorrect) {
        btn.classList.add('correct');
      } else if (wasSelected && !userWasCorrect) {
        btn.classList.add('wrong');
        // Allow re-selecting a different answer
        btn.onclick = () => selectOption(qi, i);
      } else if (isCorrectAnswer && !userWasCorrect) {
        btn.classList.add('reveal-correct');
      } else {
        btn.classList.add('disabled');
        // Allow clicking other options to change answer
        if (!userWasCorrect) {
          btn.classList.remove('disabled');
          btn.onclick = () => selectOption(qi, i);
        }
      }
    } else {
      btn.onclick = () => selectOption(qi, i);
    }

    container.appendChild(btn);
  });

  // Nav buttons
  document.getElementById('prev-btn').disabled = currentIdx === 0;
  document.getElementById('next-btn').disabled = currentIdx === questions.length - 1;

  // Update dots
  updateNavDots();
  updateProgress();
  updateResultsBar();
}

function selectOption(qi, optionIdx) {
  userAnswers[qi] = optionIdx;
  renderQuestion();
}

/* ─── Navigation ─── */
function nextQuestion() {
  if (currentIdx < questions.length - 1) {
    currentIdx++;
    renderQuestion();
    scrollDotIntoView();
  }
}

function prevQuestion() {
  if (currentIdx > 0) {
    currentIdx--;
    renderQuestion();
    scrollDotIntoView();
  }
}

function goToQuestion(idx) {
  currentIdx = idx;
  renderQuestion();
  scrollDotIntoView();
  closeJumpModal();
}

/* ─── Shuffle ─── */
function toggleShuffle() {
  isShuffled = !isShuffled;
  const btn = document.getElementById('shuffle-btn');

  if (isShuffled) {
    // Fisher-Yates shuffle
    let arr = [...order];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    order = arr;
    btn.classList.add('active');
  } else {
    order = questions.map((_, i) => i);
    btn.classList.remove('active');
  }

  currentIdx = 0;
  renderQuestion();
  buildNavDots();
}

/* ─── Nav Dots ─── */
function buildNavDots() {
  const container = document.getElementById('nav-dots');
  container.innerHTML = '';
  // Only show dots for manageable count, otherwise skip
  const maxDots = 40;
  const step = Math.max(1, Math.floor(questions.length / maxDots));
  
  for (let i = 0; i < questions.length; i += step) {
    const dot = document.createElement('div');
    dot.className = 'nav-dot';
    dot.title = `Question ${i + 1}`;
    dot.onclick = () => goToQuestion(i);
    container.appendChild(dot);
  }
  updateNavDots();
}

function updateNavDots() {
  const dots = document.querySelectorAll('.nav-dot');
  const step = Math.max(1, Math.floor(questions.length / 40));
  
  dots.forEach((dot, di) => {
    const i = di * step;
    const qi = order[i];
    dot.className = 'nav-dot';
    
    if (i === currentIdx) dot.classList.add('active');
    
    if (userAnswers[qi] !== undefined) {
      dot.classList.add(userAnswers[qi] === questions[qi].answer ? 'answered-correct' : 'answered-wrong');
    }
  });
}

function scrollDotIntoView() {
  const dots = document.getElementById('nav-dots');
  const step = Math.max(1, Math.floor(questions.length / 40));
  const dotIdx = Math.floor(currentIdx / step);
  const dot = dots.children[dotIdx];
  if (dot) dot.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

/* ─── Progress ─── */
function updateProgress() {
  const answered = Object.keys(userAnswers).length;
  document.getElementById('progress-badge').textContent = `${answered} / ${questions.length}`;
}

function updateResultsBar() {
  const answered = Object.keys(userAnswers).length;
  if (answered === 0) {
    document.getElementById('results-bar').classList.add('hidden');
    return;
  }

  document.getElementById('results-bar').classList.remove('hidden');
  
  let correct = 0, wrong = 0;
  for (const qi in userAnswers) {
    if (userAnswers[qi] === questions[qi].answer) correct++;
    else wrong++;
  }

  document.getElementById('results-correct').textContent = `${correct} Correct`;
  document.getElementById('results-wrong').textContent = `${wrong} Wrong`;
  document.getElementById('results-remaining').textContent = `${questions.length - answered} Remaining`;
}

/* ─── Jump Modal ─── */
function openJumpModal() {
  const modal = document.getElementById('jump-modal');
  modal.classList.add('open');
  document.getElementById('jump-search').value = '';
  buildJumpGrid();
  document.getElementById('jump-search').focus();
}

function closeJumpModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('jump-modal').classList.remove('open');
}

function buildJumpGrid() {
  const grid = document.getElementById('jump-grid');
  grid.innerHTML = '';

  for (let i = 0; i < questions.length; i++) {
    const qi = order[i];
    const cell = document.createElement('div');
    cell.className = 'jump-cell';
    cell.textContent = i + 1;
    cell.onclick = () => goToQuestion(i);

    if (i === currentIdx) cell.classList.add('current');
    if (userAnswers[qi] !== undefined) {
      cell.classList.add(userAnswers[qi] === questions[qi].answer ? 'answered-correct' : 'answered-wrong');
    }
    grid.appendChild(cell);
  }
}

function filterJump() {
  const val = parseInt(document.getElementById('jump-search').value);
  if (val >= 1 && val <= questions.length) {
    goToQuestion(val - 1);
  }
}

/* ─── Keyboard ─── */
document.addEventListener('keydown', (e) => {
  if (document.getElementById('jump-modal').classList.contains('open')) {
    if (e.key === 'Escape') closeJumpModal();
    return;
  }

  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextQuestion();
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevQuestion();
  else if (e.key === 's' || e.key === 'S') toggleShuffle();
  else if (e.key === 'j' || e.key === 'J') openJumpModal();
  else {
    // A-D keys to select option
    const idx = e.key.toUpperCase().charCodeAt(0) - 65;
    const qi = order[currentIdx];
    if (idx >= 0 && idx < questions[qi].options.length) {
      selectOption(qi, idx);
    }
  }
});
