/* ===================================================
   tableflag.js — Interactive Table/Flag Tracing Challenge
   =================================================== */

const TABLE_FLAG_QUESTIONS = [
  {
    id: 'tf1',
    title: 'Arithmetic Tracing — ADD / ADC / DAA / INC / AAA / SUB / SBB / DEC / DAS / NEG / AAS',
    description: 'MOV AX,0123 / BX,4567 / CX,89AB / DX,CDEF + Arithmetic. All registers/flags initially 0.',
    flags: ['SF','ZF','AF','PF','CF','OF'],
    steps: [
      { num: 1, inst: 'MOV AX, 0123', dest: 'AX = 0123H', sf: 0, zf: 0, af: 0, pf: 0, cf: 0, of: 0 },
      { num: 2, inst: 'MOV BX, 4567', dest: 'BX = 4567H', sf: 0, zf: 0, af: 0, pf: 0, cf: 0, of: 0 },
      { num: 3, inst: 'MOV CX, 89AB', dest: 'CX = 89ABH', sf: 0, zf: 0, af: 0, pf: 0, cf: 0, of: 0 },
      { num: 4, inst: 'MOV DX, CDEF', dest: 'DX = CDEFH', sf: 0, zf: 0, af: 0, pf: 0, cf: 0, of: 0 },
      { num: 5, inst: 'ADD AX, BX', dest: 'AX = 468AH', sf: 0, zf: 0, af: 0, pf: 0, cf: 0, of: 0 },
      { num: 6, inst: 'ADC AX, CX', dest: 'AX = D035H', sf: 1, zf: 0, af: 1, pf: 1, cf: 0, of: 0 },
      { num: 7, inst: 'DAA', dest: 'AX = D03BH', sf: 1, zf: 0, af: 1, pf: 0, cf: 0, of: 'X' },
      { num: 8, inst: 'INC AX', dest: 'AX = D03CH', sf: 1, zf: 0, af: 0, pf: 1, cf: 0, of: 0 },
      { num: 9, inst: 'AAA', dest: 'AX = D102H', sf: 'X', zf: 'X', af: 1, pf: 'X', cf: 1, of: 'X' },
      { num: 10, inst: 'SUB BX, CX', dest: 'BX = BBBCH', sf: 1, zf: 0, af: 1, pf: 0, cf: 1, of: 1 },
      { num: 11, inst: 'SBB AX, DX', dest: 'AX = 0312H', sf: 0, zf: 0, af: 1, pf: 1, cf: 0, of: 0 },
      { num: 12, inst: 'DEC AX', dest: 'AX = 0311H', sf: 0, zf: 0, af: 0, pf: 1, cf: 0, of: 0 },
      { num: 13, inst: 'DAS', dest: 'AX = 0311H', sf: 0, zf: 0, af: 0, pf: 1, cf: 0, of: 'X' },
      { num: 14, inst: 'NEG AX', dest: 'AX = FCEFH', sf: 1, zf: 0, af: 1, pf: 0, cf: 1, of: 0 },
      { num: 15, inst: 'AAS', dest: 'AX = FB09H', sf: 'X', zf: 'X', af: 1, pf: 'X', cf: 1, of: 'X' }
    ]
  },
  {
    id: 'tf2',
    title: 'Logic & Shift/Rotate — AND / OR / NOT / XOR / TEST / SHL / SAR / ROL / RCL / ROR / SHR / RCR',
    description: 'MOV AL,67 / BL,89 + Logic & Shift/Rotate. All registers/flags initially 0.',
    flags: ['SF','ZF','PF','CF','AF','OF'],
    steps: [
      { num: 1, inst: 'MOV AL, 67', dest: 'AL = 67H', sf: 0, zf: 0, pf: 0, cf: 0, af: 0, of: 0 },
      { num: 2, inst: 'MOV BL, 89', dest: 'BL = 89H', sf: 0, zf: 0, pf: 0, cf: 0, af: 0, of: 0 },
      { num: 3, inst: 'AND BL, AL', dest: 'BL = 01H', sf: 0, zf: 0, pf: 0, cf: 0, af: 'X', of: 0 },
      { num: 4, inst: 'OR BL, AL', dest: 'BL = 67H', sf: 0, zf: 0, pf: 0, cf: 0, af: 'X', of: 0 },
      { num: 5, inst: 'NOT BL', dest: 'BL = 98H', sf: 0, zf: 0, pf: 0, cf: 0, af: 'X', of: 0 },
      { num: 6, inst: 'XOR BL, AL', dest: 'BL = FFH', sf: 1, zf: 0, pf: 1, cf: 0, af: 'X', of: 0 },
      { num: 7, inst: 'TEST AL, BL', dest: 'AL = 67H', sf: 0, zf: 0, pf: 0, cf: 0, af: 'X', of: 0 },
      { num: 8, inst: 'SHL AL, 1', dest: 'AL = CEH', sf: 1, zf: 0, pf: 0, cf: 0, af: 'X', of: 1 },
      { num: 9, inst: 'SAR AL, 1', dest: 'AL = E7H', sf: 1, zf: 0, pf: 1, cf: 0, af: 'X', of: 0 },
      { num: 10, inst: 'ROL AL, 1', dest: 'AL = CFH', sf: 1, zf: 0, pf: 1, cf: 1, af: 'X', of: 0 },
      { num: 11, inst: 'RCL AL, 1', dest: 'AL = 9FH', sf: 1, zf: 0, pf: 1, cf: 1, af: 'X', of: 0 },
      { num: 12, inst: 'MOV CL, 5', dest: 'CL = 05H', sf: 1, zf: 0, pf: 1, cf: 1, af: 'X', of: 0 },
      { num: 13, inst: 'ROR AL, CL', dest: 'AL = FCH', sf: 1, zf: 0, pf: 1, cf: 'X', af: 'X', of: 'X' },
      { num: 14, inst: 'SHR AL, CL', dest: 'AL = 07H', sf: 0, zf: 0, pf: 0, cf: 1, af: 'X', of: 'X' },
      { num: 15, inst: 'RCR AL, CL', dest: 'AL = 78H', sf: 0, zf: 0, pf: 1, cf: 0, af: 'X', of: 'X' }
    ]
  },
  {
    id: 'tf3',
    title: 'Logic/Rotate + Flag Control — STC / SAHF / CLC / LAHF / CMC',
    description: 'MOV AL,7B / BL,05 + Logic/Shift/Rotate + Flag instructions. All registers/flags initially 0.',
    flags: ['SF','ZF','PF','CF','AF','OF'],
    steps: [
      { num: 1, inst: 'MOV AL, 7B', dest: 'AL = 7BH', sf: 0, zf: 0, pf: 0, cf: 0, af: 0, of: 0 },
      { num: 2, inst: 'MOV BL, 05', dest: 'BL = 05H', sf: 0, zf: 0, pf: 0, cf: 0, af: 0, of: 0 },
      { num: 3, inst: 'AND BL, AL', dest: 'BL = 01H', sf: 0, zf: 0, pf: 0, cf: 0, af: 'X', of: 0 },
      { num: 4, inst: 'OR BL, AL', dest: 'BL = 7BH', sf: 0, zf: 0, pf: 1, cf: 0, af: 'X', of: 0 },
      { num: 5, inst: 'NOT BL', dest: 'BL = 84H', sf: 0, zf: 0, pf: 1, cf: 0, af: 'X', of: 0 },
      { num: 6, inst: 'XOR BL, AL', dest: 'BL = FFH', sf: 1, zf: 0, pf: 1, cf: 0, af: 'X', of: 0 },
      { num: 7, inst: 'TEST AL, BL', dest: 'AL = 7BH', sf: 0, zf: 0, pf: 1, cf: 0, af: 'X', of: 0 },
      { num: 8, inst: 'SHL AL, 1', dest: 'AL = F6H', sf: 1, zf: 0, pf: 1, cf: 0, af: 'X', of: 1 },
      { num: 9, inst: 'SAR AL, 1', dest: 'AL = FBH', sf: 1, zf: 0, pf: 0, cf: 0, af: 'X', of: 0 },
      { num: 10, inst: 'ROL AL, 1', dest: 'AL = F7H', sf: 1, zf: 0, pf: 0, cf: 1, af: 'X', of: 0 },
      { num: 11, inst: 'RCL AL, 1', dest: 'AL = EFH', sf: 1, zf: 0, pf: 0, cf: 1, af: 'X', of: 0 },
      { num: 12, inst: 'MOV CL, 5', dest: 'CL = 05H', sf: 1, zf: 0, pf: 0, cf: 1, af: 'X', of: 0 },
      { num: 13, inst: 'ROR AL, CL', dest: 'AL = 7FH', sf: 0, zf: 0, pf: 0, cf: 'X', af: 'X', of: 'X' },
      { num: 14, inst: 'SHR AL, CL', dest: 'AL = 03H', sf: 0, zf: 0, pf: 1, cf: 1, af: 'X', of: 'X' },
      { num: 15, inst: 'RCR AL, CL', dest: 'AL = 38H', sf: 0, zf: 0, pf: 1, cf: 0, af: 'X', of: 'X' },
      { num: 16, inst: 'STC', dest: 'CF → 1', sf: 0, zf: 0, pf: 1, cf: 1, af: 'X', of: 'X' },
      { num: 17, inst: 'MOV AH, 25', dest: 'AH = 25H', sf: 0, zf: 0, pf: 1, cf: 1, af: 0, of: 'X' },
      { num: 18, inst: 'SAHF', dest: 'flags ← AH', sf: 0, zf: 0, pf: 1, cf: 1, af: 0, of: 'X' },
      { num: 19, inst: 'CLC', dest: 'CF → 0', sf: 0, zf: 0, pf: 1, cf: 0, af: 0, of: 'X' },
      { num: 20, inst: 'LAHF', dest: 'AH = 06H', sf: 0, zf: 0, pf: 1, cf: 0, af: 0, of: 'X' },
      { num: 21, inst: 'CMC', dest: 'CF → 1', sf: 0, zf: 0, pf: 1, cf: 1, af: 0, of: 'X' }
    ]
  },
  {
    id: 'tf5',
    title: 'Program Trace — MOV / POP / ADD / SUB / XCHG / SBB / ADC / DAA / NEG / LEA / INC',
    description: 'DS=8000H, SS=8001H, ALPHA=0020H. Memory: DS:0020H=0050H, SS:0050H=0010H, SS:0040H=1F31H.',
    flags: ['SF','ZF','PF','CF','AF','OF'],
    steps: [
      { num: 1, inst: 'MOV AX, ALPHA', dest: 'AX = 0050H', sf: 0, zf: 0, pf: 0, cf: 0, af: 0, of: 0 },
      { num: 2, inst: 'MOV SP, AX', dest: 'SP = 0050H', sf: 0, zf: 0, pf: 0, cf: 0, af: 0, of: 0 },
      { num: 3, inst: 'POP BX', dest: 'BX = 0010H', sf: 0, zf: 0, pf: 0, cf: 0, af: 0, of: 0 },
      { num: 4, inst: 'ADD BX, AX', dest: 'BX = 0060H', sf: 0, zf: 0, pf: 1, cf: 0, af: 0, of: 0 },
      { num: 5, inst: 'SUB BX, 0020H', dest: 'BX = 0040H', sf: 0, zf: 0, pf: 0, cf: 0, af: 0, of: 0 },
      { num: 6, inst: 'XCHG BX, BP', dest: 'BX = 0000H', sf: 0, zf: 0, pf: 0, cf: 0, af: 0, of: 0 },
      { num: 7, inst: 'MOV CX, [BP]', dest: 'CX = 1F31H', sf: 0, zf: 0, pf: 0, cf: 0, af: 0, of: 0 },
      { num: 8, inst: 'SBB AX, CX', dest: 'AX = E11FH', sf: 1, zf: 0, pf: 0, cf: 1, af: 1, of: 0 },
      { num: 9, inst: 'ADC AX, 0029H', dest: 'AX = E149H', sf: 1, zf: 0, pf: 0, cf: 0, af: 1, of: 0 },
      { num: 10, inst: 'ADD AL, CL', dest: 'AL = 7AH', sf: 0, zf: 0, pf: 0, cf: 0, af: 0, of: 0 },
      { num: 11, inst: 'DAA', dest: 'AL = 80H', sf: 1, zf: 0, pf: 0, cf: 0, af: 1, of: 'X' },
      { num: 12, inst: 'NEG AX', dest: 'AX = 1E80H', sf: 0, zf: 0, pf: 0, cf: 1, af: 0, of: 0 },
      { num: 13, inst: 'LEA SI, ALPHA', dest: 'SI = 0020H', sf: 0, zf: 0, pf: 0, cf: 1, af: 0, of: 0 },
      { num: 14, inst: 'MOV DX, [SI]', dest: 'DX = 0050H', sf: 0, zf: 0, pf: 0, cf: 1, af: 0, of: 0 },
      { num: 15, inst: 'INC DX', dest: 'DX = 0051H', sf: 0, zf: 0, pf: 0, cf: 1, af: 0, of: 0 }
    ]
  }
];

// --- Table Flag Challenge State ---
let tableFlagState = {
  questionIndex: 0,
  userAnswers: {}, // { stepIndex: { sf: val, zf: val, ... } }
  submitted: false
};

function startTableFlagChallenge() {
  const container = document.getElementById('challengeTab');
  // Show question picker
  container.innerHTML = `
    <div class="challenge-setup">
      <button class="reviewer-back" onclick="initChallenge('cspt')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        Back to Modules
      </button>
      <div class="section-header" style="margin-bottom:24px">
        <h1>🏁 Table Flag Challenge</h1>
        <p>Trace instructions and determine register values & flag states</p>
      </div>
      <div class="module-grid">
        ${TABLE_FLAG_QUESTIONS.map((q, i) => `
          <div class="module-card" onclick="launchTableFlag(${i})">
            <div class="module-card-number" style="background:linear-gradient(135deg, var(--error), var(--warning))">T${i+1}</div>
            <div class="module-card-info">
              <h4>${q.title}</h4>
              <p>${q.steps.length} steps to trace</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function launchTableFlag(index) {
  tableFlagState.questionIndex = index;
  tableFlagState.userAnswers = {};
  tableFlagState.submitted = false;
  renderTableFlag();
}

function renderTableFlag() {
  const container = document.getElementById('challengeTab');
  const q = TABLE_FLAG_QUESTIONS[tableFlagState.questionIndex];
  const submitted = tableFlagState.submitted;

  container.innerHTML = `
    <div class="challenge-setup">
      <button class="reviewer-back" onclick="startTableFlagChallenge()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        Back to Tables
      </button>
      <div class="section-header" style="margin-bottom:16px">
        <h1 style="font-size:1.4rem">${q.title}</h1>
        <p>${q.description}</p>
      </div>
      <div class="tf-table-wrapper">
        <table class="tf-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Instruction</th>
              <th>Dest. Operand</th>
              ${q.flags.map(f => `<th class="flag-col">${f}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${q.steps.map((step, si) => renderTableRow(q, step, si, submitted)).join('')}
          </tbody>
        </table>
      </div>
      ${!submitted ? `
        <button class="start-btn" style="margin-top:20px" onclick="submitTableFlag()">
          Submit Answers
        </button>
      ` : `
        <div class="tf-results-bar">
          <span class="tf-score">${calcTableScore(q)} / ${countGradable(q)} correct</span>
          <div class="results-actions" style="margin-top:12px">
            <button class="results-btn primary" onclick="launchTableFlag(${tableFlagState.questionIndex})">Try Again</button>
            <button class="results-btn secondary" onclick="startTableFlagChallenge()">Pick Table</button>
          </div>
        </div>
      `}
    </div>
  `;
}

function renderTableRow(q, step, si, submitted) {
  const flags = q.flags;
  const userRow = tableFlagState.userAnswers[si] || {};

  return `
    <tr class="${submitted ? getRowClass(q, step, si) : ''}">
      <td class="step-num">${step.num}</td>
      <td class="step-inst">${step.inst}</td>
      <td class="step-dest">${step.dest}</td>
      ${flags.map(f => {
        const key = f.toLowerCase();
        const correct = step[key];
        const userVal = userRow[key];

        if (correct === 'X') {
          // Undefined flag — show X, no input needed
          return `<td class="flag-cell flag-x">X</td>`;
        }

        if (submitted) {
          const isCorrect = parseInt(userVal) === correct;
          return `<td class="flag-cell ${isCorrect ? 'flag-correct' : 'flag-wrong'}">
            <span class="flag-user">${userVal !== undefined ? userVal : '—'}</span>
            ${!isCorrect ? `<span class="flag-answer">${correct}</span>` : ''}
          </td>`;
        }

        // Input mode — toggle button
        const currentVal = userVal !== undefined ? userVal : '';
        return `<td class="flag-cell">
          <button class="flag-toggle ${currentVal === 0 ? 'val-0' : currentVal === 1 ? 'val-1' : ''}"
                  onclick="toggleFlag(${si},'${key}',this)">
            ${currentVal !== '' ? currentVal : '·'}
          </button>
        </td>`;
      }).join('')}
    </tr>
  `;
}

function toggleFlag(stepIndex, flagKey, btn) {
  if (!tableFlagState.userAnswers[stepIndex]) {
    tableFlagState.userAnswers[stepIndex] = {};
  }
  const current = tableFlagState.userAnswers[stepIndex][flagKey];
  let next;
  if (current === undefined || current === '') {
    next = 0;
  } else if (current === 0) {
    next = 1;
  } else {
    next = 0;
  }
  tableFlagState.userAnswers[stepIndex][flagKey] = next;

  // Update only this button — no full re-render
  btn.className = 'flag-toggle ' + (next === 0 ? 'val-0' : 'val-1');
  btn.textContent = next;
}

function submitTableFlag() {
  tableFlagState.submitted = true;
  renderTableFlag();
}

function getRowClass(q, step, si) {
  const flags = q.flags;
  const userRow = tableFlagState.userAnswers[si] || {};
  let allCorrect = true;
  flags.forEach(f => {
    const key = f.toLowerCase();
    if (step[key] === 'X') return;
    if (parseInt(userRow[key]) !== step[key]) allCorrect = false;
  });
  return allCorrect ? 'row-correct' : 'row-wrong';
}

function calcTableScore(q) {
  let correct = 0;
  q.steps.forEach((step, si) => {
    const userRow = tableFlagState.userAnswers[si] || {};
    q.flags.forEach(f => {
      const key = f.toLowerCase();
      if (step[key] === 'X') return;
      if (parseInt(userRow[key]) === step[key]) correct++;
    });
  });
  return correct;
}

function countGradable(q) {
  let total = 0;
  q.steps.forEach(step => {
    q.flags.forEach(f => {
      if (step[f.toLowerCase()] !== 'X') total++;
    });
  });
  return total;
}
