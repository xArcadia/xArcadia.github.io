/* ===================================================
   answerkey.js — Answer key viewer
   =================================================== */

let akState = {
  moduleId: null,
  viewMode: 'all', // 'all', 'one', 'flip'
  searchQuery: '',
  currentFlipIndex: 0,
  flipped: false
};

function initAnswerKey(subjectId) {
  const container = document.getElementById('answerkeyTab');
  const data = getCurrentData();
  if (!container || !data) return;
  renderModuleList(container, data.modules, 'answerkey');

  // Override the click handler for answer key module cards
  container.querySelectorAll('.module-card').forEach((card, i) => {
    card.onclick = () => selectAKModule(data.modules[i].id);
  });
}

function selectAKModule(moduleId) {
  akState.moduleId = moduleId;
  akState.searchQuery = '';
  akState.currentFlipIndex = 0;
  akState.flipped = false;
  akState.viewMode = 'all';
  renderAnswerKey();
}

function renderAnswerKey() {
  const container = document.getElementById('answerkeyTab');
  const mod = getCurrentData().modules.find(m => m.id === akState.moduleId);
  if (!mod) return;

  let filtered = mod.questions;
  if (akState.searchQuery) {
    const q = akState.searchQuery.toLowerCase();
    filtered = filtered.filter(item =>
      item.question.toLowerCase().includes(q) ||
      (item.options && item.options.some(o => o.toLowerCase().includes(q))) ||
      item.answer.toLowerCase().includes(q) ||
      item.explanation.toLowerCase().includes(q)
    );
  }

  container.innerHTML = `
    <div class="answer-key-container">
      <button class="reviewer-back" onclick="initAnswerKey(currentSubjectId)">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        Back to Modules
      </button>
      <div class="section-header" style="margin-bottom:24px">
        <h1>Module ${mod.id}: ${mod.title}</h1>
        <p>${filtered.length} questions</p>
      </div>

      <div class="answer-key-controls">
        <div class="view-mode-toggle">
          <button class="view-mode-btn ${akState.viewMode === 'all' ? 'active' : ''}" onclick="switchAKView('all')">Show All</button>
          <button class="view-mode-btn ${akState.viewMode === 'one' ? 'active' : ''}" onclick="switchAKView('one')">One by One</button>
          <button class="view-mode-btn ${akState.viewMode === 'flip' ? 'active' : ''}" onclick="switchAKView('flip')">Card Flip</button>
        </div>
        <div class="search-bar">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input type="text" placeholder="Search questions..." value="${akState.searchQuery}" oninput="akState.searchQuery=this.value; renderAnswerKey()">
        </div>
      </div>

      <div id="akContent"></div>
    </div>
  `;

  const content = document.getElementById('akContent');
  if (akState.viewMode === 'all') renderAllView(content, filtered);
  else if (akState.viewMode === 'one') renderOneView(content, filtered);
  else renderFlipView(content, filtered);
}

function switchAKView(mode) {
  akState.viewMode = mode;
  akState.currentFlipIndex = 0;
  akState.flipped = false;
  renderAnswerKey();
}

function renderAllView(container, questions) {
  if (questions.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>No questions found</h3><p>Try a different search term</p></div>`;
    return;
  }
  container.innerHTML = `
    <div class="qa-list">
      ${questions.map((q, i) => {
        const letters = ['A','B','C','D','E','F'];
        let ansText;
        if (q.type === 'multiple_choice') {
          if (q.multiSelect) {
            ansText = q.answer.split(',').map(l => `${l}. ${q.options[letters.indexOf(l)] || '?'}`).join(', ');
          } else {
            ansText = `${q.answer}. ${q.options[letters.indexOf(q.answer)] || '?'}`;
          }
        } else {
          ansText = q.answer;
        }
        return `
          <div class="qa-item">
            <div class="qa-item-q">
              <span class="q-num">${i + 1}.</span>
              <span>${q.question}</span>
            </div>
            <div class="qa-item-a">
              <strong>Answer: ${ansText}</strong>
              <br><span style="color:var(--text-muted);font-size:0.85rem">${q.explanation}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderOneView(container, questions) {
  if (questions.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>No questions found</h3></div>`;
    return;
  }
  const idx = Math.min(akState.currentFlipIndex, questions.length - 1);
  const q = questions[idx];
  const letters = ['A','B','C','D','E','F'];
  let ansText;
  if (q.type === 'multiple_choice') {
    if (q.multiSelect) {
      ansText = q.answer.split(',').map(l => `${l}. ${q.options[letters.indexOf(l)] || '?'}`).join(', ');
    } else {
      ansText = `${q.answer}. ${q.options[letters.indexOf(q.answer)] || '?'}`;
    }
  } else {
    ansText = q.answer;
  }

  container.innerHTML = `
    <div style="text-align:center;margin-bottom:16px;color:var(--text-muted);font-size:0.9rem">
      ${idx + 1} of ${questions.length}
    </div>
    <div class="question-card" style="max-width:600px;margin:0 auto">
      <span class="question-type-badge">${q.type === 'multiple_choice' ? 'Multiple Choice' : q.type === 'true_false' ? 'True or False' : 'Identification'}</span>
      <div class="question-text">${q.question}</div>
      ${q.type === 'multiple_choice' ? `
        <div class="options-list">
          ${q.options.map((opt, i) => {
            const letter = 'ABCDEF'[i];
            const correctAnswers = q.multiSelect ? q.answer.split(',') : [q.answer];
            return `<div class="option-btn ${correctAnswers.includes(letter) ? 'correct' : ''}" style="cursor:default">
              <span class="option-letter">${letter}</span><span>${opt}</span>
            </div>`;
          }).join('')}
        </div>
      ` : `
        <div style="padding:16px 20px;background:var(--success-bg);border-radius:var(--radius-sm);margin-top:12px">
          <strong style="color:var(--success)">Answer: ${ansText}</strong>
        </div>
      `}
      <div class="explanation-box">
        <h5>Explanation</h5>
        <p>${q.explanation}</p>
      </div>
    </div>
    <div class="quiz-nav" style="max-width:600px;margin:16px auto 0">
      <button class="quiz-nav-btn" onclick="akPrev(${questions.length})" ${idx === 0 ? 'disabled' : ''}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        Previous
      </button>
      <button class="quiz-nav-btn" onclick="akNext(${questions.length})" ${idx >= questions.length - 1 ? 'disabled' : ''}>
        Next
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
      </button>
    </div>
  `;
}

function renderFlipView(container, questions) {
  if (questions.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>No questions found</h3></div>`;
    return;
  }
  const idx = Math.min(akState.currentFlipIndex, questions.length - 1);
  const q = questions[idx];
  const letters = ['A','B','C','D','E','F'];
  let ansText;
  if (q.type === 'multiple_choice') {
    if (q.multiSelect) {
      ansText = q.answer.split(',').map(l => `${l}. ${q.options[letters.indexOf(l)] || '?'}`).join(', ');
    } else {
      ansText = `${q.answer}. ${q.options[letters.indexOf(q.answer)] || '?'}`;
    }
  } else {
    ansText = q.answer;
  }

  container.innerHTML = `
    <div class="flip-card-container">
      <div style="color:var(--text-muted);font-size:0.9rem">${idx + 1} of ${questions.length}</div>
      <div class="flip-card ${akState.flipped ? 'flipped' : ''}" onclick="toggleFlip()">
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <div class="flip-card-label">Question</div>
            <div class="flip-card-text">${q.question}</div>
            <div class="flip-card-hint">Tap to reveal answer</div>
          </div>
          <div class="flip-card-back">
            <div class="flip-card-label">Answer</div>
            <div class="flip-card-text" style="color:var(--success);font-weight:700">${ansText}</div>
            <div style="margin-top:12px;font-size:0.85rem;color:var(--text-muted)">${q.explanation}</div>
            <div class="flip-card-hint">Tap to see question</div>
          </div>
        </div>
      </div>
      <div class="quiz-nav" style="width:100%;max-width:500px">
        <button class="quiz-nav-btn" onclick="akPrev(${questions.length})" ${idx === 0 ? 'disabled' : ''}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          Previous
        </button>
        <button class="quiz-nav-btn" onclick="akNext(${questions.length})" ${idx >= questions.length - 1 ? 'disabled' : ''}>
          Next
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  `;
}

function toggleFlip() {
  akState.flipped = !akState.flipped;
  const card = document.querySelector('.flip-card');
  if (card) card.classList.toggle('flipped', akState.flipped);
}

function akPrev(total) {
  if (akState.currentFlipIndex > 0) {
    akState.currentFlipIndex--;
    akState.flipped = false;
    renderAnswerKey();
  }
}

function akNext(total) {
  if (akState.currentFlipIndex < total - 1) {
    akState.currentFlipIndex++;
    akState.flipped = false;
    renderAnswerKey();
  }
}
