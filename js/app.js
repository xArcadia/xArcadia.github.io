/* ===================================================
   app.js — Core application logic
   =================================================== */

// --- Subjects Registry ---
const SUBJECTS = [
  {
    id: 'cspt',
    title: 'Computer Systems and Platform Technologies',
    description: 'Data manipulation, computer concepts, DOS & Debug, system bus, CPU registers, instruction sets, TASM programming, and operating systems.',
    modules: 8,
    dataFile: 'cspt',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`
  },
  {
    id: 'sysinteg',
    title: 'System Integration',
    description: 'Software engineering, agile development, requirements engineering, architectural design, software testing, project management, and services.',
    modules: 6,
    dataFile: 'sysinteg',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  },
  {
    id: 'infosec',
    title: 'Information Security',
    description: 'CIA triad, encryption, authentication, social engineering, malware, network attacks, security policies, and change management.',
    modules: 257,
    modulesLabel: 'Questions',
    link: 'infosec-reviewer.html',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
  }
];

// --- Subject Data Registry ---
function getSubjectData(subjectId) {
  if (subjectId === 'cspt' && typeof CSPT_DATA !== 'undefined') return CSPT_DATA;
  if (subjectId === 'sysinteg' && typeof SYSINTEG_DATA !== 'undefined') return SYSINTEG_DATA;
  return null;
}

// Current subject ID (set on subject page)
let currentSubjectId = null;
function getCurrentData() {
  return getSubjectData(currentSubjectId);
}

// --- Changelog ---
const CHANGELOG = [
  {
    version: 'v1.3.0',
    date: 'March 31, 2026',
    changes: [
      { type: 'new', text: 'Added System Integration subject (589 questions from Canvas FA1-FA7)' },
      { type: 'new', text: 'Added Table Flag Challenge — interactive instruction tracing tables' },
      { type: 'new', text: 'Added "What\'s New" section in profile menu' },
      { type: 'fix', text: 'Fixed table flag toggle button flicker' }
    ]
  },
  {
    version: 'v1.2.0',
    date: 'March 29, 2026',
    changes: [
      { type: 'new', text: 'Added 40 instruction-tracing questions (Modules 4 & 5)' },
      { type: 'new', text: 'Total CSPT questions: 270' }
    ]
  },
  {
    version: 'v1.1.0',
    date: 'March 29, 2026',
    changes: [
      { type: 'new', text: 'Profile menu with dark mode toggle' },
      { type: 'new', text: 'Accent color theme picker (8 presets)' },
      { type: 'new', text: 'Added 75 new questions across all modules' }
    ]
  },
  {
    version: 'v1.0.0',
    date: 'March 29, 2026',
    changes: [
      { type: 'new', text: 'Initial release with CSPT subject' },
      { type: 'new', text: 'Reviewer, Challenge, and Answer Key tabs' },
      { type: 'new', text: 'Normal and Hell mode quiz challenges' },
      { type: 'new', text: 'Dark mode support' }
    ]
  }
];

// --- Accent Color Presets ---
const ACCENT_COLORS = {
  indigo:  { primary: '#6366f1', secondary: '#8b5cf6', third: '#a855f7' },
  rose:    { primary: '#f43f5e', secondary: '#e11d48', third: '#be123c' },
  emerald: { primary: '#10b981', secondary: '#059669', third: '#047857' },
  amber:   { primary: '#f59e0b', secondary: '#d97706', third: '#b45309' },
  cyan:    { primary: '#06b6d4', secondary: '#0891b2', third: '#0e7490' },
  orange:  { primary: '#f97316', secondary: '#ea580c', third: '#c2410c' },
  violet:  { primary: '#8b5cf6', secondary: '#7c3aed', third: '#6d28d9' },
  fuchsia: { primary: '#d946ef', secondary: '#c026d3', third: '#a21caf' }
};

// --- Dark Mode ---
function initTheme() {
  const saved = localStorage.getItem('reviewer-theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('reviewer-theme', next);
}

// --- Accent Color System ---
function initAccentColor() {
  const saved = localStorage.getItem('reviewer-accent') || 'indigo';
  applyAccentColor(saved);
  highlightActiveSwatch(saved);
}

function applyAccentColor(colorKey) {
  const colors = ACCENT_COLORS[colorKey];
  if (!colors) return;

  const root = document.documentElement;
  root.style.setProperty('--accent-primary', colors.primary);
  root.style.setProperty('--accent-secondary', colors.secondary);
  root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.third})`);

  // Compute glow from primary color
  const r = parseInt(colors.primary.slice(1, 3), 16);
  const g = parseInt(colors.primary.slice(3, 5), 16);
  const b = parseInt(colors.primary.slice(5, 7), 16);
  root.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.3)`);
  root.style.setProperty('--shadow-glow', `0 0 30px rgba(${r}, ${g}, ${b}, 0.15)`);

  // Dark mode gets stronger glow
  if (document.documentElement.getAttribute('data-theme') === 'dark') {
    root.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.4)`);
    root.style.setProperty('--shadow-glow', `0 0 40px rgba(${r}, ${g}, ${b}, 0.25)`);
  }
}

function setAccentColor(colorKey) {
  localStorage.setItem('reviewer-accent', colorKey);
  applyAccentColor(colorKey);
  highlightActiveSwatch(colorKey);
}

function highlightActiveSwatch(colorKey) {
  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.classList.toggle('active', sw.dataset.color === colorKey);
  });
}

// --- Profile Menu ---
function initProfileMenu() {
  const profileBtn = document.getElementById('profileBtn');
  const profileMenu = document.getElementById('profileMenu');

  if (!profileBtn || !profileMenu) return;

  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle('open');
  });

  // Close on click outside
  document.addEventListener('click', (e) => {
    if (!profileMenu.contains(e.target)) {
      profileMenu.classList.remove('open');
    }
  });

  // Color picker
  const colorPicker = document.getElementById('colorPicker');
  if (colorPicker) {
    colorPicker.addEventListener('click', (e) => {
      const swatch = e.target.closest('.color-swatch');
      if (swatch) {
        setAccentColor(swatch.dataset.color);
      }
    });
  }
}

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAccentColor();
  initProfileMenu();

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTheme();
      // Re-apply accent glow for the new theme
      const accent = localStorage.getItem('reviewer-accent') || 'indigo';
      applyAccentColor(accent);
    });
  }

  // Homepage — render subject cards
  const grid = document.getElementById('subjectsGrid');
  if (grid) {
    renderSubjectCards(grid);
  }

  // Subject page — init tabs
  const tabNav = document.getElementById('tabNav');
  if (tabNav) {
    initSubjectPage();
  }
});

// --- Homepage: Render Subject Cards ---
function renderSubjectCards(container) {
  container.innerHTML = SUBJECTS.map(s => `
    <a href="${s.link || ('subject.html?subject=' + s.id)}" class="subject-card" id="subject-${s.id}">
      <div class="subject-card-icon">${s.icon}</div>
      <h3>${s.title}</h3>
      <p>${s.description}</p>
      <div class="subject-card-meta">
        <span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          ${s.modules} ${s.modulesLabel || 'Modules'}
        </span>
      </div>
    </a>
  `).join('');
}

// --- Subject Page: Init ---
function initSubjectPage() {
  const params = new URLSearchParams(window.location.search);
  const subjectId = params.get('subject');

  if (!subjectId) {
    window.location.href = 'index.html';
    return;
  }

  const subject = SUBJECTS.find(s => s.id === subjectId);
  if (!subject) {
    window.location.href = 'index.html';
    return;
  }

  // Set current subject
  currentSubjectId = subjectId;

  // Set title
  const titleEl = document.getElementById('subjectTitle');
  if (titleEl) titleEl.textContent = subject.title;
  document.title = `${subject.title} — Interactive Reviewer`;

  // Tab navigation
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      const target = document.getElementById(btn.dataset.tab + 'Tab');
      if (target) target.classList.add('active');
    });
  });

  // Initialize feature modules
  if (typeof initReviewer === 'function') initReviewer(subjectId);
  if (typeof initChallenge === 'function') initChallenge(subjectId);
  if (typeof initAnswerKey === 'function') initAnswerKey(subjectId);
}

// --- What's New Modal ---
function showWhatsNew() {
  // Close profile dropdown
  const pm = document.getElementById('profileMenu');
  if (pm) pm.classList.remove('open');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'whatsNewModal';
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  const typeIcons = {
    'new': '<span class="wn-badge wn-new">NEW</span>',
    'fix': '<span class="wn-badge wn-fix">FIX</span>',
    'improve': '<span class="wn-badge wn-improve">IMPROVED</span>'
  };

  overlay.innerHTML = `
    <div class="modal-content wn-modal">
      <div class="modal-header">
        <h2>What's New</h2>
        <button class="modal-close" onclick="document.getElementById('whatsNewModal').remove()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        ${CHANGELOG.map(release => `
          <div class="wn-release">
            <div class="wn-version-row">
              <span class="wn-version">${release.version}</span>
              <span class="wn-date">${release.date}</span>
            </div>
            <ul class="wn-list">
              ${release.changes.map(c => `
                <li>${typeIcons[c.type] || ''} ${c.text}</li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

