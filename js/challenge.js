/* ===================================================
   challenge.js — Quiz engine
   Flow: pick a module -> quiz starts immediately.
   Questions stay in file order by default; a Shuffle
   button randomizes both question order and answer
   (option) positions. Answers are revealed immediately.
   =================================================== */

let challengeState = {
  moduleId: null,
  base: [],        // questions in original file order
  shuffled: false, // whether the current deck is randomized
  questions: [],   // working deck (possibly shuffled)
  currentIndex: 0,
  answers: {},
  submitted: false
};

// --- Deck building & shuffling ---
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Return a copy of a multiple-choice question with its options reshuffled
// and the correct-answer letter(s) remapped to the new positions.
function shuffleMCOptions(q) {
  if (q.type !== 'multiple_choice' || !q.options || q.options.length < 2) return { ...q };
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const order = shuffleArray(q.options.map((_, i) => i)); // permutation of old indices
  const options = order.map(i => q.options[i]);
  const oldCorrect = (q.multiSelect ? q.answer.split(',') : [q.answer]).map(l => letters.indexOf(l));
  const newCorrect = oldCorrect.map(oi => order.indexOf(oi)).sort((a, b) => a - b);
  const answer = newCorrect.map(i => letters[i]).join(',');
  return { ...q, options, answer };
}

function buildDeck(base, shuffled) {
  if (!shuffled) return base.map(q => ({ ...q }));      // file order, cloned
  return shuffleArray(base).map(shuffleMCOptions);      // randomized questions + options
}

// --- Entry point: start a module's quiz immediately ---
function startModuleQuiz(moduleId) {
  const data = getCurrentData();
  const mod = data && data.modules.find(m => m.id === moduleId);
  if (!mod) return;
  challengeState.moduleId = moduleId;
  challengeState.base = mod.questions;
  challengeState.shuffled = false;
  challengeState.questions = buildDeck(challengeState.base, false);
  challengeState.currentIndex = 0;
  challengeState.answers = {};
  challengeState.submitted = false;
  renderQuiz();
}

function toggleShuffleQuiz() {
  challengeState.shuffled = !challengeState.shuffled;
  challengeState.questions = buildDeck(challengeState.base, challengeState.shuffled);
  challengeState.currentIndex = 0;
  challengeState.answers = {};
  challengeState.submitted = false;
  renderQuiz();
}

function restartQuiz() {
  challengeState.questions = buildDeck(challengeState.base, challengeState.shuffled);
  challengeState.currentIndex = 0;
  challengeState.answers = {};
  challengeState.submitted = false;
  renderQuiz();
}

// --- Quiz rendering ---
function renderQuiz() {
  const container = document.getElementById('subjectContent');
  if (!container) return;
  const q = challengeState.questions[challengeState.currentIndex];
  const total = challengeState.questions.length;
  const idx = challengeState.currentIndex;
  const answered = challengeState.answers[q.id] !== undefined && challengeState.answers[q.id] !== '';
  const revealed = answered && !challengeState.submitted;
  const userAnswer = challengeState.answers[q.id];

  const mod = getCurrentData().modules.find(m => m.id === challengeState.moduleId);
  const moduleTitle = mod ? mod.title : 'Quiz';

  container.innerHTML = `
    <div class="quiz-container">
      <!-- Top bar -->
      <div class="quiz-topbar">
        <button class="reviewer-back" onclick="showSubjectModules('quiz')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          Back to Modules
        </button>
        <button class="shuffle-toggle ${challengeState.shuffled ? 'active' : ''}" onclick="toggleShuffleQuiz()" title="Randomize question and answer order">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
          ${challengeState.shuffled ? 'Shuffled' : 'Shuffle'}
        </button>
      </div>

      <!-- Header -->
      <div class="quiz-header">
        <div class="quiz-progress">
          <span>${moduleTitle} — Question ${idx + 1} of ${total}</span>
          <div class="progress-bar">
            <div class="progress-bar-fill" style="width:${((idx + 1) / total) * 100}%"></div>
          </div>
        </div>
      </div>

      <!-- Question Nav Toggle -->
      <div class="q-nav-toggle-wrap" style="margin-bottom:20px;text-align:center">
        <button class="q-nav-toggle-btn" onclick="toggleQuestionNav()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Question ${idx + 1} of ${total} — Jump to...
        </button>
      </div>

      <!-- Question Nav Overlay -->
      <div class="q-nav-overlay" id="qNavOverlay" onclick="if(event.target===this)toggleQuestionNav()">
        <div class="q-nav-popup">
          <div class="q-nav-popup-header">
            <h3>Jump to Question</h3>
            <button class="q-nav-close" onclick="toggleQuestionNav()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="question-dots">
            ${challengeState.questions.map((qq, i) => {
              let cls = '';
              if (i === idx) cls = 'current';
              else if (challengeState.answers[qq.id] !== undefined && challengeState.answers[qq.id] !== '') cls = 'answered';
              return `<div class="q-dot ${cls}" onclick="goToQuestion(${i});toggleQuestionNav()">${i + 1}</div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Question Card -->
      <div class="question-card">
        <span class="question-type-badge">${q.type === 'multiple_choice' ? 'Multiple Choice' : q.type === 'true_false' ? 'True or False' : 'Identification'}</span>
        <div class="question-text">${q.question}</div>

        ${q.type === 'multiple_choice' ? renderMCOptions(q, userAnswer, revealed) : ''}
        ${q.type === 'true_false' ? renderTFOptions(q, userAnswer, revealed) : ''}
        ${q.type === 'identification' ? renderIDInput(q, userAnswer) : ''}

        ${revealed && q.explanation ? `
          <div class="explanation-box">
            <h5>Explanation</h5>
            <p>${q.explanation}</p>
          </div>
        ` : ''}
      </div>

      <!-- Navigation -->
      <div class="quiz-nav">
        <button class="quiz-nav-btn" onclick="prevQuestion()" ${idx === 0 ? 'disabled' : ''}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          Previous
        </button>
        ${idx < total - 1 ? `
          <button class="quiz-nav-btn" onclick="nextQuestion()">
            Next
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </button>
        ` : `
          <button class="quiz-nav-btn submit-btn" onclick="submitQuiz()">
            Submit
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </button>
        `}
      </div>
    </div>
  `;
}

function renderMCOptions(q, userAnswer, revealed) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const isMulti = q.multiSelect;
  const correctAnswers = isMulti ? q.answer.split(',') : [q.answer];
  const userAnswers = isMulti && userAnswer ? userAnswer.split(',') : (userAnswer ? [userAnswer] : []);
  return `
    <div class="options-list">
      ${q.options.map((opt, i) => {
        const letter = letters[i];
        let cls = '';
        if (revealed) {
          if (correctAnswers.includes(letter)) cls = 'correct';
          else if (userAnswers.includes(letter)) cls = 'wrong';
        } else if (userAnswers.includes(letter)) {
          cls = 'selected';
        }
        return `
          <button class="option-btn ${cls}" onclick="${isMulti ? `toggleMultiAnswer('${q.id}', '${letter}')` : `selectAnswer('${q.id}', '${letter}')`}" ${revealed && !isMulti ? 'disabled' : ''}>
            <span class="option-letter">${letter}</span>
            <span>${opt}</span>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function renderTFOptions(q, userAnswer, revealed) {
  return `
    <div class="tf-options">
      ${['True', 'False'].map(val => {
        let cls = '';
        if (revealed) {
          if (val === q.answer) cls = 'correct';
          else if (val === userAnswer) cls = 'wrong';
        } else if (val === userAnswer) {
          cls = 'selected';
        }
        return `<button class="tf-btn ${cls}" onclick="selectAnswer('${q.id}', '${val}')" ${revealed ? 'disabled' : ''}>${val}</button>`;
      }).join('')}
    </div>
  `;
}

function renderIDInput(q, userAnswer) {
  // Store on input without re-rendering (keeps focus); reveal happens on navigation.
  const safe = (userAnswer || '').replace(/"/g, '&quot;');
  return `<input class="identification-input" type="text" placeholder="Type your answer..." value="${safe}" oninput="challengeState.answers['${q.id}']=this.value">`;
}

function toggleMultiAnswer(qId, letter) {
  let current = challengeState.answers[qId] ? challengeState.answers[qId].split(',') : [];
  const i = current.indexOf(letter);
  if (i >= 0) current.splice(i, 1);
  else { current.push(letter); current.sort(); }
  challengeState.answers[qId] = current.join(',');
  renderQuiz();
}

function selectAnswer(qId, answer) {
  challengeState.answers[qId] = answer;
  renderQuiz();
}

function prevQuestion() {
  if (challengeState.currentIndex > 0) {
    challengeState.currentIndex--;
    renderQuiz();
  }
}

function nextQuestion() {
  if (challengeState.currentIndex < challengeState.questions.length - 1) {
    challengeState.currentIndex++;
    renderQuiz();
  }
}

function goToQuestion(index) {
  challengeState.currentIndex = index;
  renderQuiz();
}

function submitQuiz() {
  challengeState.submitted = true;

  let correct = 0;
  let wrong = 0;

  challengeState.questions.forEach(q => {
    const userAns = challengeState.answers[q.id];
    if (userAns !== undefined && userAns !== '') {
      if (q.type === 'identification') {
        if (userAns.trim().toLowerCase() === q.answer.toLowerCase()) correct++;
        else wrong++;
      } else if (q.multiSelect) {
        const userSet = userAns.split(',').sort().join(',');
        const ansSet = q.answer.split(',').sort().join(',');
        if (userSet === ansSet) correct++;
        else wrong++;
      } else {
        if (userAns === q.answer) correct++;
        else wrong++;
      }
    } else {
      wrong++;
    }
  });

  const total = challengeState.questions.length;
  const pct = Math.round((correct / total) * 100);
  const dashOffset = 502 - (502 * pct / 100);

  let message = '';
  if (pct >= 90) message = 'Outstanding! 🎉';
  else if (pct >= 75) message = 'Great Job! 👏';
  else if (pct >= 50) message = 'Not Bad! Keep Going! 💪';
  else message = 'Keep Studying! 📚';

  const container = document.getElementById('subjectContent');
  container.innerHTML = `
    <div class="results-container">
      <div class="results-score-circle">
        <svg viewBox="0 0 180 180">
          <circle class="bg-circle" cx="90" cy="90" r="80"/>
          <circle class="score-circle" cx="90" cy="90" r="80" style="stroke-dashoffset:502;stroke:${pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--error)'}"/>
        </svg>
        <div class="score-text" style="color:${pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--error)'}">${pct}%</div>
        <div class="score-label">Score</div>
      </div>
      <div class="results-message">${message}</div>
      <div class="results-sub">You scored ${correct} out of ${total} questions</div>
      <div class="results-stats">
        <div class="results-stat">
          <div class="results-stat-value correct-val">${correct}</div>
          <div class="results-stat-label">Correct</div>
        </div>
        <div class="results-stat">
          <div class="results-stat-value wrong-val">${wrong}</div>
          <div class="results-stat-label">Wrong</div>
        </div>
      </div>
      <div class="results-actions">
        <button class="results-btn primary" onclick="restartQuiz()">Try Again</button>
        <button class="results-btn secondary" onclick="showSubjectModules('quiz')">Pick Module</button>
      </div>

      <!-- Review Answers -->
      <div class="results-review">
        <h3>Review Answers</h3>
        ${challengeState.questions.map((q, i) => {
          const letters = ['A','B','C','D','E','F'];
          const userAns = challengeState.answers[q.id];
          let isCorrect = false;
          if (q.type === 'identification') {
            isCorrect = userAns && userAns.trim().toLowerCase() === q.answer.toLowerCase();
          } else if (q.multiSelect) {
            const userSet = userAns ? userAns.split(',').sort().join(',') : '';
            const ansSet = q.answer.split(',').sort().join(',');
            isCorrect = userSet === ansSet;
          } else {
            isCorrect = userAns === q.answer;
          }
          let ansDisplay, correctDisplay;
          if (q.type === 'multiple_choice') {
            if (q.multiSelect) {
              ansDisplay = userAns ? userAns.split(',').map(l => `${l}. ${q.options[letters.indexOf(l)] || '?'}`).join(', ') : 'No answer';
              correctDisplay = q.answer.split(',').map(l => `${l}. ${q.options[letters.indexOf(l)] || '?'}`).join(', ');
            } else {
              ansDisplay = userAns ? `${userAns}. ${q.options[letters.indexOf(userAns)] || '?'}` : 'No answer';
              correctDisplay = `${q.answer}. ${q.options[letters.indexOf(q.answer)] || '?'}`;
            }
          } else {
            ansDisplay = userAns || 'No answer';
            correctDisplay = q.answer;
          }

          return `
            <div class="review-item ${isCorrect ? 'correct-review' : 'wrong-review'}">
              <div class="review-item-question">${i + 1}. ${q.question}</div>
              <div class="review-item-answer">
                Your answer: <span class="${isCorrect ? 'correct-ans' : 'user-ans'}">${ansDisplay}</span>
                ${!isCorrect ? `<br>Correct answer: <span class="correct-ans">${correctDisplay}</span>` : ''}
                ${q.explanation ? `<br><em style="color:var(--text-muted);font-size:0.85rem">${q.explanation}</em>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Animate score circle from empty to target
  setTimeout(() => {
    const circle = container.querySelector('.score-circle');
    if (circle) circle.style.strokeDashoffset = dashOffset;
  }, 100);
}

function toggleQuestionNav() {
  const overlay = document.getElementById('qNavOverlay');
  if (overlay) overlay.classList.toggle('active');
}
