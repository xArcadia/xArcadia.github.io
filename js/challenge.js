/* ===================================================
   challenge.js — Quiz / Exam engine
   =================================================== */

let challengeState = {
  moduleId: null,
  mode: 'normal', // 'normal' or 'hell'
  examType: 'mixed',
  timed: false,
  timeLimit: 0,
  questionCount: 10,
  questions: [],
  currentIndex: 0,
  answers: {},
  submitted: false,
  timerInterval: null,
  timeRemaining: 0
};

function initChallenge(subjectId) {
  const container = document.getElementById('challengeTab');
  if (!container || !CSPT_DATA) return;
  renderChallengeModuleList(container, CSPT_DATA.modules);
}

function renderChallengeModuleList(container, modules) {
  container.innerHTML = `
    <div class="module-grid">
      ${modules.map(m => `
        <div class="module-card" onclick="selectChallengeModule(${m.id})">
          <div class="module-card-number">${m.id}</div>
          <div class="module-card-info">
            <h4>${m.title}</h4>
            <p>${m.subtopics.join(' • ')}</p>
          </div>
        </div>
      `).join('')}
      <div class="module-card tf-special-card" onclick="startTableFlagChallenge()">
        <div class="module-card-number" style="background:linear-gradient(135deg, var(--error), var(--warning))">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
        </div>
        <div class="module-card-info">
          <h4>Table Flag Challenge</h4>
          <p>Mod 4–5 Combined • Trace instructions & determine flag values</p>
        </div>
      </div>
    </div>
  `;
}

function selectChallengeModule(moduleId) {
  challengeState.moduleId = moduleId;
  showChallengeSetup();
}

function showChallengeSetup() {
  const container = document.getElementById('challengeTab');
  const mod = CSPT_DATA.modules.find(m => m.id === challengeState.moduleId);
  if (!mod) return;
  const maxQ = mod.questions.length;

  container.innerHTML = `
    <div class="challenge-setup">
      <button class="reviewer-back" onclick="initChallenge('cspt')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        Back to Modules
      </button>
      <div class="section-header" style="margin-bottom:24px">
        <h1>Module ${mod.id}: ${mod.title}</h1>
        <p>Set up your challenge</p>
      </div>

      <!-- Mode Selection -->
      <h4 style="margin-bottom:12px;font-size:0.95rem;color:var(--text-secondary)">Select Mode</h4>
      <div class="mode-selector">
        <div class="mode-card normal selected" id="modeNormal" onclick="selectMode('normal')">
          <div class="mode-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M9 12l2 2 4-4"/></svg>
          </div>
          <h4>Normal Mode</h4>
          <p>See correct answers immediately. Go back and change answers anytime.</p>
        </div>
        <div class="mode-card hell" id="modeHell" onclick="selectMode('hell')">
          <div class="mode-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <h4>Hell Mode</h4>
          <p>Real exam simulation. No going back. No answer reveals. Results only at the end.</p>
        </div>
      </div>

      <!-- Settings -->
      <div class="settings-panel">
        <h4>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Settings
        </h4>
        <div class="settings-row">
          <div class="settings-group">
            <label>Question Type</label>
            <select id="examType" onchange="challengeState.examType=this.value">
              <option value="mixed">Mixed (All Types)</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True or False</option>
            </select>
          </div>
          <div class="settings-group">
            <label>Number of Questions (max ${maxQ})</label>
            <input type="number" id="questionCount" value="${Math.min(10, maxQ)}" min="1" max="${maxQ}" onchange="challengeState.questionCount=Math.min(parseInt(this.value)||1,${maxQ})">
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-group">
            <label>Timer</label>
            <select id="timerSelect" onchange="updateTimer(this.value)">
              <option value="0">No Timer</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="120">2 minutes</option>
              <option value="300">5 minutes</option>
              <option value="600">10 minutes</option>
              <option value="900">15 minutes</option>
              <option value="1800">30 minutes</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div class="settings-group" id="customTimerGroup" style="display:none">
            <label>Custom Time (seconds)</label>
            <input type="number" id="customTimer" value="60" min="10" max="7200">
          </div>
        </div>
      </div>

      <button class="start-btn" onclick="startChallenge()">
        Start Challenge
      </button>
    </div>
  `;
}

function selectMode(mode) {
  challengeState.mode = mode;
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
  document.getElementById(mode === 'normal' ? 'modeNormal' : 'modeHell').classList.add('selected');
}

function updateTimer(val) {
  const custom = document.getElementById('customTimerGroup');
  if (val === 'custom') {
    custom.style.display = '';
    challengeState.timed = true;
  } else {
    custom.style.display = 'none';
    challengeState.timed = parseInt(val) > 0;
    challengeState.timeLimit = parseInt(val);
  }
}

function startChallenge() {
  const mod = CSPT_DATA.modules.find(m => m.id === challengeState.moduleId);
  if (!mod) return;

  let pool = [...mod.questions];
  if (challengeState.examType !== 'mixed') {
    pool = pool.filter(q => q.type === challengeState.examType);
  }

  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const count = Math.min(challengeState.questionCount, pool.length);
  challengeState.questions = pool.slice(0, count);
  challengeState.currentIndex = 0;
  challengeState.answers = {};
  challengeState.submitted = false;

  if (challengeState.timed) {
    if (document.getElementById('customTimerGroup')?.style.display !== 'none') {
      challengeState.timeLimit = parseInt(document.getElementById('customTimer')?.value) || 60;
    }
    challengeState.timeRemaining = challengeState.timeLimit;
  }

  renderQuiz();

  if (challengeState.timed) startTimer();
}

function startTimer() {
  if (challengeState.timerInterval) clearInterval(challengeState.timerInterval);
  challengeState.timerInterval = setInterval(() => {
    challengeState.timeRemaining--;
    updateTimerDisplay();
    if (challengeState.timeRemaining <= 0) {
      clearInterval(challengeState.timerInterval);
      submitQuiz();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById('quizTimer');
  if (!el) return;
  const mins = Math.floor(challengeState.timeRemaining / 60);
  const secs = challengeState.timeRemaining % 60;
  el.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const wrapper = el.closest('.quiz-timer');
  if (wrapper) {
    wrapper.classList.remove('warning', 'danger');
    if (challengeState.timeRemaining <= 10) wrapper.classList.add('danger');
    else if (challengeState.timeRemaining <= 30) wrapper.classList.add('warning');
  }
}

function renderQuiz() {
  const container = document.getElementById('challengeTab');
  const q = challengeState.questions[challengeState.currentIndex];
  const total = challengeState.questions.length;
  const idx = challengeState.currentIndex;
  const isHell = challengeState.mode === 'hell';
  const answered = challengeState.answers[q.id] !== undefined;
  const userAnswer = challengeState.answers[q.id];

  // Check if already revealed (normal mode)
  const revealed = !isHell && answered && !challengeState.submitted;

  container.innerHTML = `
    <div class="quiz-container">
      <!-- Header -->
      <div class="quiz-header">
        <div class="quiz-progress">
          <span>Question ${idx + 1} of ${total}</span>
          <div class="progress-bar">
            <div class="progress-bar-fill" style="width:${((idx + 1) / total) * 100}%"></div>
          </div>
        </div>
        ${challengeState.timed ? `
          <div class="quiz-timer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span id="quizTimer">--:--</span>
          </div>
        ` : ''}
      </div>

      <!-- Question Dots -->
      <div class="question-dots" style="margin-bottom:20px">
        ${challengeState.questions.map((qq, i) => {
          let cls = '';
          if (i === idx) cls = 'current';
          else if (challengeState.answers[qq.id] !== undefined) cls = 'answered';
          const clickable = isHell ? (i <= idx ? `onclick="goToQuestion(${i})"` : '') : `onclick="goToQuestion(${i})"`;
          return `<div class="q-dot ${cls}" ${clickable}>${i + 1}</div>`;
        }).join('')}
      </div>

      <!-- Question Card -->
      <div class="question-card">
        <span class="question-type-badge">${q.type === 'multiple_choice' ? 'Multiple Choice' : q.type === 'true_false' ? 'True or False' : 'Identification'}</span>
        <div class="question-text">${q.question}</div>

        ${q.type === 'multiple_choice' ? renderMCOptions(q, userAnswer, revealed) : ''}
        ${q.type === 'true_false' ? renderTFOptions(q, userAnswer, revealed) : ''}
        ${q.type === 'identification' ? renderIDInput(q, userAnswer) : ''}

        ${revealed ? `
          <div class="explanation-box">
            <h5>Explanation</h5>
            <p>${q.explanation}</p>
          </div>
        ` : ''}
      </div>

      <!-- Navigation -->
      <div class="quiz-nav">
        ${!isHell ? `
          <button class="quiz-nav-btn" onclick="prevQuestion()" ${idx === 0 ? 'disabled' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            Previous
          </button>
        ` : '<div></div>'}
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

  if (challengeState.timed) updateTimerDisplay();
}

function renderMCOptions(q, userAnswer, revealed) {
  const letters = ['A', 'B', 'C', 'D'];
  return `
    <div class="options-list">
      ${q.options.map((opt, i) => {
        const letter = letters[i];
        let cls = '';
        if (revealed) {
          if (letter === q.answer) cls = 'correct';
          else if (letter === userAnswer) cls = 'wrong';
        } else if (letter === userAnswer) {
          cls = 'selected';
        }
        return `
          <button class="option-btn ${cls}" onclick="selectAnswer('${q.id}', '${letter}')" ${revealed ? 'disabled' : ''}>
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
  return `<input class="identification-input" type="text" placeholder="Type your answer..." value="${userAnswer || ''}" oninput="selectAnswer('${q.id}', this.value)">`;
}

function selectAnswer(qId, answer) {
  challengeState.answers[qId] = answer;
  const isHell = challengeState.mode === 'hell';

  if (!isHell) {
    // Normal mode: show answer immediately
    renderQuiz();
  } else {
    // Hell mode: just update dots, auto-advance after short delay
    const q = challengeState.questions[challengeState.currentIndex];
    if (q.type !== 'identification') {
      setTimeout(() => {
        if (challengeState.currentIndex < challengeState.questions.length - 1) {
          challengeState.currentIndex++;
          renderQuiz();
        } else {
          renderQuiz(); // re-render to show submit
        }
      }, 300);
    }
  }
}

function prevQuestion() {
  if (challengeState.mode === 'hell') return;
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
  if (challengeState.mode === 'hell' && index > challengeState.currentIndex) return;
  if (challengeState.mode === 'hell' && index < challengeState.currentIndex) return; // No going back
  challengeState.currentIndex = index;
  renderQuiz();
}

function submitQuiz() {
  if (challengeState.timerInterval) clearInterval(challengeState.timerInterval);
  challengeState.submitted = true;

  let correct = 0;
  let wrong = 0;

  challengeState.questions.forEach(q => {
    const userAns = challengeState.answers[q.id];
    if (userAns !== undefined) {
      if (q.type === 'identification') {
        if (userAns.trim().toLowerCase() === q.answer.toLowerCase()) correct++;
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

  const container = document.getElementById('challengeTab');
  container.innerHTML = `
    <div class="results-container">
      <div class="results-score-circle">
        <svg viewBox="0 0 180 180">
          <circle class="bg-circle" cx="90" cy="90" r="80"/>
          <circle class="score-circle" cx="90" cy="90" r="80" style="stroke-dashoffset:${dashOffset};stroke:${pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--error)'}"/>
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
        <button class="results-btn primary" onclick="showChallengeSetup()">Try Again</button>
        <button class="results-btn secondary" onclick="initChallenge('cspt')">Pick Module</button>
      </div>

      <!-- Review Answers -->
      <div class="results-review">
        <h3>Review Answers</h3>
        ${challengeState.questions.map((q, i) => {
          const userAns = challengeState.answers[q.id];
          let isCorrect = false;
          if (q.type === 'identification') {
            isCorrect = userAns && userAns.trim().toLowerCase() === q.answer.toLowerCase();
          } else {
            isCorrect = userAns === q.answer;
          }
          const ansDisplay = q.type === 'multiple_choice'
            ? (userAns ? `${userAns}. ${q.options['ABCD'.indexOf(userAns)]}` : 'No answer')
            : (userAns || 'No answer');
          const correctDisplay = q.type === 'multiple_choice'
            ? `${q.answer}. ${q.options['ABCD'.indexOf(q.answer)]}`
            : q.answer;

          return `
            <div class="review-item ${isCorrect ? 'correct-review' : 'wrong-review'}">
              <div class="review-item-question">${i + 1}. ${q.question}</div>
              <div class="review-item-answer">
                Your answer: <span class="${isCorrect ? 'correct-ans' : 'user-ans'}">${ansDisplay}</span>
                ${!isCorrect ? `<br>Correct answer: <span class="correct-ans">${correctDisplay}</span>` : ''}
                <br><em style="color:var(--text-muted);font-size:0.85rem">${q.explanation}</em>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Animate score circle
  setTimeout(() => {
    const circle = container.querySelector('.score-circle');
    if (circle) circle.style.strokeDashoffset = dashOffset;
  }, 100);
}
