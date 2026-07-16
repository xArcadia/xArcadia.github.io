/* ===================================================
   cute.js — optional "Cute Mode" layer
   Off by default. When enabled (profile menu toggle) it adds a reactive
   study-buddy mascot, confetti, and a streak + sticker reward system.
   All effects are no-ops unless data-cute="on" on <html>.
   Exposes window.Cute for the quiz engine to call.
   =================================================== */
(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CUTE_KEY = 'reviewer-cute';
  const STICKER_KEY = 'reviewer-stickers';
  const STREAK_KEY = 'reviewer-streak';
  const STICKER_POOL = ['🏆', '🌟', '🍀', '🌸', '🚀', '🧠', '🐣', '🎈', '💎', '🌈'];

  let buddyEl = null, comboEl = null, canvas = null, ctx = null;
  let parts = [], raf = null, fontLoaded = false, combo = 0;

  const enabled = () => root.getAttribute('data-cute') === 'on';
  const today = () => new Date().toISOString().slice(0, 10);

  // --- rounded display font (loaded lazily on first enable) ---
  function loadFont() {
    if (fontLoaded) return;
    fontLoaded = true;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap';
    document.head.appendChild(l);
  }

  // --- mascot SVG ---
  const BUDDY_SVG = `
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <g class="cb-body">
        <ellipse cx="60" cy="99" rx="28" ry="6" fill="rgba(0,0,0,.14)"/>
        <path d="M60 20 C86 20 96 44 96 66 C96 92 80 104 60 104 C40 104 24 92 24 66 C24 44 34 20 60 20 Z" fill="var(--accent-primary)"/>
        <path d="M60 26 C80 26 88 46 88 66 C88 88 76 98 60 98 C44 98 32 88 32 66 C32 46 40 26 60 26 Z" fill="#fff" opacity=".93"/>
        <circle cx="42" cy="72" r="6" fill="var(--accent-primary)" opacity=".4"/>
        <circle cx="78" cy="72" r="6" fill="var(--accent-primary)" opacity=".4"/>
        <path d="M56 66 L64 66 L60 72 Z" fill="#ffb648"/>
        <g class="cb-eyes-open"><circle cx="48" cy="58" r="5" fill="#2a2340"/><circle cx="72" cy="58" r="5" fill="#2a2340"/><circle cx="50" cy="56" r="1.6" fill="#fff"/><circle cx="74" cy="56" r="1.6" fill="#fff"/></g>
        <g class="cb-eyes-happy"><path d="M42 60 Q48 52 54 60" stroke="#2a2340" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M66 60 Q72 52 78 60" stroke="#2a2340" stroke-width="3.4" fill="none" stroke-linecap="round"/></g>
        <g class="cb-eyes-sad"><circle cx="48" cy="60" r="4.6" fill="#2a2340"/><circle cx="72" cy="60" r="4.6" fill="#2a2340"/><path d="M42 52 Q48 50 53 53" stroke="#2a2340" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M67 53 Q72 50 78 52" stroke="#2a2340" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>
        <g class="cb-eyes-sleepy"><path d="M42 58 Q48 62 54 58" stroke="#2a2340" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M66 58 Q72 62 78 58" stroke="#2a2340" stroke-width="3" fill="none" stroke-linecap="round"/></g>
        <path class="cb-m-neutral" d="M54 80 Q60 84 66 80" stroke="#2a2340" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path class="cb-m-smile" d="M52 79 Q60 90 68 79" stroke="#2a2340" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path class="cb-m-frown" d="M53 85 Q60 78 67 85" stroke="#2a2340" stroke-width="3" fill="none" stroke-linecap="round"/>
        <ellipse class="cb-m-open" cx="60" cy="83" rx="6" ry="7" fill="#ff7a9c"/>
      </g>
      <g class="cb-sparkle"><path d="M100 30 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z" fill="var(--accent-secondary)"/><path d="M14 40 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 z" fill="var(--accent-primary)"/></g>
    </svg>`;

  function ensureDom() {
    if (buddyEl) return;
    canvas = document.createElement('canvas');
    canvas.className = 'cute-confetti';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);

    buddyEl = document.createElement('div');
    buddyEl.className = 'cute-buddy is-idle';
    buddyEl.setAttribute('aria-hidden', 'true');
    buddyEl.innerHTML = '<span class="cute-combo"></span>' + BUDDY_SVG;
    document.body.appendChild(buddyEl);
    comboEl = buddyEl.querySelector('.cute-combo');
  }

  function mood(name, anim) {
    if (!buddyEl) return;
    buddyEl.className = 'cute-buddy is-' + name;
    if (anim && !reduce) { void buddyEl.offsetWidth; buddyEl.classList.add('anim-' + anim); }
  }

  function updateCombo() {
    if (!comboEl) return;
    comboEl.textContent = combo > 1 ? '🔥 x' + combo : '';
    comboEl.classList.toggle('on', combo > 1);
  }

  // --- rewards storage ---
  function getStickers() {
    try { return JSON.parse(localStorage.getItem(STICKER_KEY)) || []; } catch (e) { return []; }
  }
  function awardSticker() {
    const s = getStickers();
    s.push(STICKER_POOL[Math.floor(Math.random() * STICKER_POOL.length)]);
    const trimmed = s.slice(-12);
    localStorage.setItem(STICKER_KEY, JSON.stringify(trimmed));
    return trimmed[trimmed.length - 1];
  }
  function getStreak() {
    try { return JSON.parse(localStorage.getItem(STREAK_KEY)) || { last: null, count: 0 }; }
    catch (e) { return { last: null, count: 0 }; }
  }
  function bumpStreak() {
    const st = getStreak();
    const t = today();
    if (st.last === t) return st.count;               // already counted today
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    st.count = (st.last === y) ? (st.count + 1) : 1;   // continued vs reset
    st.last = t;
    localStorage.setItem(STREAK_KEY, JSON.stringify(st));
    return st.count;
  }

  // --- confetti ---
  function sizeCanvas() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function confetti() {
    if (reduce || !ctx) return;
    const cols = ['#ff8ec6', '#b9a4ff', '#5fd6b2', '#ffcf7a', '#68b6ff', '#ff9e7d'];
    parts = [];
    for (let i = 0; i < 130; i++) parts.push({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 140,
      y: window.innerHeight * 0.32,
      vx: (Math.random() - 0.5) * 9, vy: -Math.random() * 11 - 4,
      s: 5 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      c: cols[i % cols.length], life: 90 + Math.random() * 40
    });
    if (!raf) tick();
  }
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts.forEach(p => { p.vy += 0.28; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--; });
    parts = parts.filter(p => p.life > 0 && p.y < window.innerHeight + 40);
    parts.forEach(p => { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore(); });
    if (parts.length) { raf = requestAnimationFrame(tick); } else { ctx.clearRect(0, 0, canvas.width, canvas.height); raf = null; }
  }

  // --- apply on/off ---
  function apply(on) {
    root.setAttribute('data-cute', on ? 'on' : 'off');
    localStorage.setItem(CUTE_KEY, on ? 'on' : 'off');
    const btn = document.getElementById('cuteToggle');
    if (btn) { btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', String(on)); }
    if (on) { loadFont(); ensureDom(); mood('idle'); }
    // refresh the module list so the rewards bar shows/hides immediately
    if (typeof currentSubjectId !== 'undefined' && currentSubjectId &&
        typeof showSubjectModules === 'function' &&
        document.querySelector('.modules-view')) {
      showSubjectModules(document.querySelector('.view-mode-btn.active')?.textContent.trim() === 'Answer Key' ? 'answerkey' : 'quiz');
    }
  }

  // --- public API (used by the quiz engine + app.js) ---
  window.Cute = {
    enabled,
    quizStart() { if (!enabled()) return; combo = 0; updateCombo(); mood('idle'); },
    react(isCorrect) {
      if (!enabled()) return;
      if (isCorrect) { combo++; mood('happy', 'bounce'); }
      else { combo = 0; mood('sad', 'wiggle'); }
      updateCombo();
    },
    results(pct) {
      if (!enabled()) return null;
      combo = 0; updateCombo();
      if (pct >= 75) { mood('celebrate', 'jump'); confetti(); }
      else { mood('sad'); }
      bumpStreak();
      return awardSticker();
    },
    idle() { if (!enabled()) return; combo = 0; updateCombo(); mood('idle'); },
    // Injects the streak + sticker shelf at the top of the module list.
    decorateModules() {
      if (!enabled()) return;
      const view = document.querySelector('.modules-view');
      if (!view || view.querySelector('.cute-rewards')) return;
      const streak = getStreak().count;
      const stickers = getStickers();
      const bar = document.createElement('div');
      bar.className = 'cute-rewards';
      bar.innerHTML =
        `<div class="cute-streak">🔥 ${streak > 0 ? streak + '-day streak' : 'Start your streak!'}</div>` +
        `<div class="cute-shelf"><span class="cute-shelf-lbl">Stickers</span>` +
        (stickers.length ? stickers.map(s => `<span class="cute-sticker">${s}</span>`).join('') : '<span class="cute-shelf-lbl">none yet — finish a quiz!</span>') +
        `</div>`;
      const toggle = view.querySelector('.modules-toggle');
      if (toggle && toggle.nextSibling) view.insertBefore(bar, toggle.nextSibling);
      else view.insertBefore(bar, view.firstChild);
    }
  };

  // --- boot ---
  document.addEventListener('DOMContentLoaded', () => {
    const on = localStorage.getItem(CUTE_KEY) === 'on';   // default OFF
    if (on) { loadFont(); ensureDom(); }
    apply(on);
    const btn = document.getElementById('cuteToggle');
    if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); apply(!enabled()); });
  });
})();
