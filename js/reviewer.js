/* ===================================================
   reviewer.js — Module notes viewer
   =================================================== */

function initReviewer(subjectId) {
  const container = document.getElementById('reviewerTab');
  if (!container || !CSPT_DATA) return;
  renderModuleList(container, CSPT_DATA.modules, 'reviewer');
}

function renderModuleList(container, modules, context) {
  container.innerHTML = `
    <div class="module-grid">
      ${modules.map(m => `
        <div class="module-card" onclick="${context === 'reviewer' ? `showReviewerNotes(${m.id})` : `selectChallengeModule(${m.id})`}">
          <div class="module-card-number">${m.id}</div>
          <div class="module-card-info">
            <h4>${m.title}</h4>
            <p>${m.subtopics.join(' • ')}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function showReviewerNotes(moduleId) {
  const container = document.getElementById('reviewerTab');
  const mod = CSPT_DATA.modules.find(m => m.id === moduleId);
  if (!mod) return;

  container.innerHTML = `
    <div class="reviewer-content">
      <button class="reviewer-back" onclick="initReviewer('cspt')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        Back to Modules
      </button>
      <div class="section-header" style="margin-bottom:24px">
        <h1>Module ${mod.id}: ${mod.title}</h1>
        <p>${mod.subtopics.join(' • ')}</p>
      </div>
      ${mod.notes.map((section, i) => `
        <div class="notes-section" style="animation-delay: ${i * 0.05}s">
          <h3>${section.heading} <span class="badge">${section.points.length} notes</span></h3>
          <ul class="notes-list">
            ${section.points.map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
  `;
}
