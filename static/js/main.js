// ─── Global flags ────────────────────────────────────
window.REDUCED_MOTION  = false;
window.FAST_MODE       = false;
window.CRIES_ENABLED   = true;
window.HINTS_ENABLED   = false;
window.DAILY_MODE      = false;

// ─── All-time stats ───────────────────────────────────
const ALLTIME_KEY = 'pokerun_alltime';
function getAllTimeStats() {
  try { return JSON.parse(localStorage.getItem(ALLTIME_KEY)) || {}; } catch { return {}; }
}
function updateAllTimeStats({ score, correct, total, bestStreak }) {
  const s = getAllTimeStats();
  s.gamesPlayed     = (s.gamesPlayed     || 0) + 1;
  s.totalQuestions  = (s.totalQuestions  || 0) + total;
  s.totalCorrect    = (s.totalCorrect    || 0) + correct;
  s.bestScore       = Math.max(s.bestScore   || 0, score);
  s.bestStreak      = Math.max(s.bestStreak  || 0, bestStreak);
  s.perfectRuns     = (s.perfectRuns     || 0) + (correct === total && total > 0 ? 1 : 0);
  localStorage.setItem(ALLTIME_KEY, JSON.stringify(s));
}
function renderStatsModal() {
  const s   = getAllTimeStats();
  const acc = s.totalQuestions ? Math.round(s.totalCorrect / s.totalQuestions * 100) : 0;
  document.getElementById('statsBody').innerHTML = [
    ['GAMES PLAYED',        s.gamesPlayed    || 0],
    ['ACCURACY',            acc + '%'],
    ['BEST SCORE',          s.bestScore      || 0],
    ['BEST STREAK',         s.bestStreak     || 0],
    ['PERFECT RUNS',        s.perfectRuns    || 0],
    ['QUESTIONS ANSWERED',  s.totalQuestions || 0],
  ].map(([k, v]) =>
    `<div class="stats-row"><span class="stats-key">${k}</span><span class="stats-val">${v}</span></div>`
  ).join('');
}

// ─── Daily streak helpers ─────────────────────────────
const STREAK_KEY = 'pokerun_streak';
function getDailyStreak() {
  try { return JSON.parse(localStorage.getItem(STREAK_KEY)) || {}; } catch { return {}; }
}
function updateDailyStreakCounter() {
  const today     = _dailyToday();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const s         = getDailyStreak();
  if (s.lastDate === today) return;
  s.current = s.lastDate === yesterday ? (s.current || 0) + 1 : 1;
  s.best    = Math.max(s.best || 0, s.current);
  s.lastDate = today;
  localStorage.setItem(STREAK_KEY, JSON.stringify(s));
}
function updateDailyStreakUI() {
  const el = document.getElementById('dailyStreak');
  if (!el) return;
  const s = getDailyStreak();
  if (s.current >= 2) {
    el.textContent = `${s.current} DAY STREAK`;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

// ─── Daily challenge helpers ──────────────────────────
const DAILY_KEY = 'pokerun_daily';
function _dailyToday() { return new Date().toISOString().slice(0, 10); }
function getDailyState() {
  try {
    const s = JSON.parse(localStorage.getItem(DAILY_KEY) || 'null');
    if (s && s.date === _dailyToday()) return s;
  } catch (_) {}
  return { date: _dailyToday(), played: false };
}
function saveDailyResult({ score, correct, total, bestStreak, results }) {
  localStorage.setItem(DAILY_KEY, JSON.stringify({
    date: _dailyToday(), played: true, score, correct, total,
    bestStreak: bestStreak || 0,
    results: (results || []).map(r => ({
      correct: r.correct,
      pokemon: {
        id: r.pokemon.id,
        name: r.pokemon.name,
        types: r.pokemon.types,
        sprite: r.pokemon.sprite,
        official_artwork: r.pokemon.official_artwork,
      },
    })),
  }));
}
function updateDailyUI() {
  const state     = getDailyState();
  const btn       = document.getElementById('dailyStartBtn');
  const result    = document.getElementById('dailyResult');
  const shareBtn  = document.getElementById('dailyShareBtn');
  if (!btn) return;
  if (state.played) {
    btn.textContent = 'COMPLETED ✓';
    btn.disabled = true;
    result.innerHTML = `
      <div class="daily-stats">
        <span>${state.score} PTS</span>
        <span class="daily-stat-sep">·</span>
        <span>${state.correct}/${state.total} CORRECT</span>
        <span class="daily-stat-sep">·</span>
        <span>${state.bestStreak || 0} STREAK</span>
      </div>`;
    result.classList.add('visible');
    if (shareBtn) shareBtn.classList.remove('hidden');
  } else {
    btn.textContent = '▶ PLAY TODAY\'S RUN';
    btn.disabled = false;
    result.classList.remove('visible');
    result.innerHTML = '';
    if (shareBtn) shareBtn.classList.add('hidden');
  }
}

// ─── Settings state ───────────────────────────────────
const cfg = {
  mode:         'name_from_image',
  answer:       'mc',
  sprite_type:  'still',
  timer:        0,
  lives:        0,
  gen:          'all',
  order:        'random',
  count:        10,
  season:       'seasonal',
  type_filter:  'all',
  trainer_src:  '/static/assets/trainer_sheet.png',
  trainer_cell: 64,
  trainer_row:  3,
};

// ── Menu tabs ─────────────────────────────────────────
document.querySelectorAll('.menu-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.remove('hidden');
  });
});

// ── Standard btn-group wiring ──────────────────────────
function setupGroup(groupId, key) {
  const grp = document.getElementById(groupId);
  if (!grp) return;
  grp.querySelectorAll('[data-val]').forEach(btn => {
    btn.addEventListener('click', () => {
      grp.querySelectorAll('[data-val]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (key) cfg[key] = btn.dataset.val;
    });
  });
}

setupGroup('modeGroup',   'mode');
setupGroup('answerGroup', 'answer');
setupGroup('spriteGroup', 'sprite_type');
setupGroup('seasonGroup', 'season');

// Lives: visual toggle via setupGroup + number coercion
setupGroup('livesGroup', '_lives');
document.getElementById('livesGroup').querySelectorAll('[data-val]').forEach(btn => {
  btn.addEventListener('click', () => { cfg.lives = parseInt(btn.dataset.val) || 0; });
});

// Timer: visual toggle via setupGroup + number coercion
setupGroup('timerGroup', '_timer');
document.getElementById('timerGroup').querySelectorAll('[data-val]').forEach(btn => {
  btn.addEventListener('click', () => {
    cfg.timer = parseInt(btn.dataset.val) || 0;
    document.getElementById('timerCustom').value = '';
  });
});

// ── Timer custom input ─────────────────────────────────
const timerCustom = document.getElementById('timerCustom');
timerCustom.addEventListener('input', () => {
  const v = parseInt(timerCustom.value);
  if (!isNaN(v) && v >= 5) {
    document.getElementById('timerGroup').querySelectorAll('[data-val]').forEach(b => b.classList.remove('active'));
    cfg.timer = v;
  } else if (timerCustom.value === '') {
    const def = document.getElementById('timerGroup').querySelector('[data-val="0"]');
    if (def) { def.classList.add('active'); cfg.timer = 0; }
  }
});

// ── Lives custom input ─────────────────────────────────
const livesCustom = document.getElementById('livesCustom');
livesCustom.addEventListener('input', () => {
  const v = parseInt(livesCustom.value);
  if (!isNaN(v) && v >= 1) {
    document.getElementById('livesGroup').querySelectorAll('[data-val]').forEach(b => b.classList.remove('active'));
    cfg.lives = v;
  } else if (livesCustom.value === '') {
    const def = document.getElementById('livesGroup').querySelector('[data-val="0"]');
    if (def) { def.classList.add('active'); cfg.lives = 0; }
  }
});

// ── ORDER: single toggle ───────────────────────────────
const orderBtn = document.getElementById('orderBtn');
if (orderBtn) {
  orderBtn.addEventListener('click', () => {
    const isActive = orderBtn.classList.toggle('active');
    cfg.order = isActive ? 'ordered' : 'random';
  });
}

// ── QUESTIONS: preset buttons + custom input ───────────
const countGroup  = document.getElementById('countGroup');
const countCustom = document.getElementById('countCustom');

countGroup.querySelectorAll('[data-val]').forEach(btn => {
  btn.addEventListener('click', () => {
    countGroup.querySelectorAll('[data-val]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    cfg.count = parseInt(btn.dataset.val) || 0;
    countCustom.value = '';
  });
});

countCustom.addEventListener('input', () => {
  const v = parseInt(countCustom.value);
  if (!isNaN(v) && v > 0) {
    countGroup.querySelectorAll('[data-val]').forEach(b => b.classList.remove('active'));
    cfg.count = v;
  } else if (countCustom.value === '') {
    const def = countGroup.querySelector('[data-val="10"]');
    if (def) { def.classList.add('active'); cfg.count = 10; }
  }
});

// ── GENERATION ────────────────────────────────────────
document.getElementById('genSelect').addEventListener('change', e => {
  cfg.gen = e.target.value;
});

// ── TYPE FILTER + badge preview ───────────────────────
const TYPE_COLORS = {
  normal:'#A8A878', fire:'#F08030', water:'#6890F0', electric:'#F8D030',
  grass:'#78C850', ice:'#98D8D8', fighting:'#C03028', poison:'#A040A0',
  ground:'#E0C068', flying:'#A890F0', psychic:'#F85888', bug:'#A8B820',
  rock:'#B8A038', ghost:'#705898', dragon:'#7038F8', dark:'#705848',
  steel:'#B8B8D0', fairy:'#EE99AC',
};
const LIGHT_TYPES = new Set(['electric','ice','ground','steel','grass','normal']);

const typeSelect = document.getElementById('typeSelect');
const typeBadge  = document.getElementById('typePreviewBadge');

typeSelect.addEventListener('change', e => {
  cfg.type_filter = e.target.value;
  if (cfg.type_filter === 'all') {
    typeBadge.classList.remove('visible');
  } else {
    typeBadge.textContent         = cfg.type_filter.toUpperCase();
    typeBadge.style.background    = TYPE_COLORS[cfg.type_filter] || '#888';
    typeBadge.style.color         = LIGHT_TYPES.has(cfg.type_filter) ? '#333' : '#fff';
    typeBadge.style.textShadow    = LIGHT_TYPES.has(cfg.type_filter) ? 'none' : '1px 1px 0 rgba(0,0,0,0.4)';
    typeBadge.classList.add('visible');
  }
});

// ── REDUCE FLASH / MOTION toggle ──────────────────────
const reduceMotionBtn = document.getElementById('reduceMotionBtn');
reduceMotionBtn.addEventListener('click', () => {
  window.REDUCED_MOTION = !window.REDUCED_MOTION;
  reduceMotionBtn.classList.toggle('active', window.REDUCED_MOTION);
  reduceMotionBtn.textContent = window.REDUCED_MOTION ? 'ON' : 'OFF';
});

const fastModeBtn = document.getElementById('fastModeBtn');
fastModeBtn.addEventListener('click', () => {
  window.FAST_MODE = !window.FAST_MODE;
  fastModeBtn.classList.toggle('active', window.FAST_MODE);
  fastModeBtn.textContent = window.FAST_MODE ? 'ON' : 'OFF';
});

// ── Cries toggle ──────────────────────────────────────
const criesBtn = document.getElementById('criesBtn');
criesBtn.addEventListener('click', () => {
  window.CRIES_ENABLED = !window.CRIES_ENABLED;
  criesBtn.classList.toggle('active', window.CRIES_ENABLED);
  criesBtn.textContent = window.CRIES_ENABLED ? 'ON' : 'OFF';
});

// ── Hints toggle ──────────────────────────────────────
const hintsBtn = document.getElementById('hintsBtn');
hintsBtn.addEventListener('click', () => {
  window.HINTS_ENABLED = !window.HINTS_ENABLED;
  hintsBtn.classList.toggle('active', window.HINTS_ENABLED);
  hintsBtn.textContent = window.HINTS_ENABLED ? 'ON' : 'OFF';
});

const hidePauseBtn = document.getElementById('hidePauseBtn');
hidePauseBtn.addEventListener('click', () => {
  const isOn = document.getElementById('pauseBtn').style.display !== 'none';
  const newOn = !isOn;
  document.getElementById('pauseBtn').style.display = newOn ? '' : 'none';
  hidePauseBtn.classList.toggle('active', newOn);
  hidePauseBtn.textContent = newOn ? 'ON' : 'OFF';
});

// ── TRAINER SHOP ──────────────────────────────────────
const TRAINER_SKINS = [
  { id: 'ethan', name: 'ETHAN', src: '/static/assets/trainer_sheet.png', cell: 64, row: 3 },
  { id: 'may',   name: 'MAY',   src: '/static/assets/trainer_kris.png',  cell: 48, row: 3 },
  { id: 'dawn',  name: 'DAWN',  src: '/static/assets/trainer_dawn.png',  cell: 64, row: 3 },
];

let selectedSkin = 'ethan';

function drawSkinPreview(canvas, skin) {
  const img = new Image();
  img.onload = () => {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw back-facing idle frame (col 0, back row)
    ctx.drawImage(img,
      0, skin.row * skin.cell, skin.cell, skin.cell,
      0, 0, canvas.width, canvas.height
    );
  };
  img.src = skin.src;
}

function buildShop() {
  const grid = document.getElementById('shopGrid');
  grid.innerHTML = '';
  TRAINER_SKINS.forEach(skin => {
    const card = document.createElement('div');
    card.className = 'trainer-card' + (skin.id === selectedSkin ? ' selected' : '');
    card.dataset.id = skin.id;

    const canvas = document.createElement('canvas');
    canvas.width  = skin.cell;
    canvas.height = skin.cell;
    canvas.style.cssText = 'width:64px;height:64px;image-rendering:pixelated;';
    drawSkinPreview(canvas, skin);

    const label = document.createElement('div');
    label.className = 'trainer-card-name';
    label.textContent = skin.name;

    card.appendChild(canvas);
    card.appendChild(label);
    card.addEventListener('click', () => {
      grid.querySelectorAll('.trainer-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedSkin = skin.id;
    });
    grid.appendChild(card);
  });
}

document.getElementById('statsBtn').addEventListener('click', () => {
  renderStatsModal();
  document.getElementById('statsModal').classList.remove('hidden');
});
document.getElementById('statsClose').addEventListener('click', () => {
  document.getElementById('statsModal').classList.add('hidden');
});
document.getElementById('statsModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
});

document.getElementById('shopBtn').addEventListener('click', () => {
  buildShop();
  document.getElementById('shopModal').classList.remove('hidden');
});

document.getElementById('shopCloseBtn').addEventListener('click', () => {
  document.getElementById('shopModal').classList.add('hidden');
});

document.getElementById('shopConfirmBtn').addEventListener('click', () => {
  const skin = TRAINER_SKINS.find(s => s.id === selectedSkin) || TRAINER_SKINS[0];
  cfg.trainer_src  = skin.src;
  cfg.trainer_cell = skin.cell;
  cfg.trainer_row  = skin.row;
  if (game && game.trainer) game.trainer.setSkin(skin.src, skin.cell, skin.row);
  document.getElementById('shopModal').classList.add('hidden');
});

document.getElementById('shopModal').addEventListener('click', e => {
  if (e.target === document.getElementById('shopModal')) {
    document.getElementById('shopModal').classList.add('hidden');
  }
});

// ─── Screen helpers ───────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ─── Start ────────────────────────────────────────────
document.getElementById('startBtn').addEventListener('click', async () => {
  showScreen('gameScreen');
  sizeGameWrap();
  await initGame({ ...cfg });
});

// ─── Pause / Resume / Exit ───────────────────────────
document.getElementById('pauseBtn').addEventListener('click', () => {
  if (!game) return;
  game.pause();
  document.getElementById('pauseOverlay').classList.remove('hidden');
});

document.getElementById('resumeBtn').addEventListener('click', () => {
  document.getElementById('pauseOverlay').classList.add('hidden');
  if (game) game.resume();
});

document.getElementById('exitToMenuBtn').addEventListener('click', () => {
  document.getElementById('pauseOverlay').classList.add('hidden');
  if (game) game.stop();
  showScreen('menuScreen');
});

// ─── Share ────────────────────────────────────────────
let _lastGameData = null;
document.addEventListener('gameOver', e => {
  _lastGameData = { ...e.detail, isDaily: !!window.DAILY_MODE };
  const isDaily = !!window.DAILY_MODE;

  updateAllTimeStats(e.detail);

  if (isDaily) {
    saveDailyResult(e.detail);
    updateDailyStreakCounter();
    window.DAILY_MODE     = false;
    window.REDUCED_MOTION = false;
    updateDailyUI();
    updateDailyStreakUI();
  }

  if (e.detail.correct === e.detail.total && e.detail.total > 0) {
    setTimeout(launchConfetti, 400);
  }

  document.getElementById('rsPlayAgainBtn').classList.toggle('hidden', isDaily);
  document.getElementById('rsTomorrowMsg').classList.toggle('hidden', !isDaily);
});

document.getElementById('rsShareBtn').addEventListener('click', async () => {
  const btn = document.getElementById('rsShareBtn');
  if (!_lastGameData) return;
  btn.textContent = 'GENERATING...';
  btn.disabled = true;
  try {
    const result = await shareResults(_lastGameData);
    btn.textContent = result === 'copied' ? 'COPIED!' : result === 'shared' ? 'SHARED!' : 'SAVED!';
  } catch (_) {
    btn.textContent = 'ERROR';
  }
  setTimeout(() => { btn.textContent = 'SHARE'; btn.disabled = false; }, 2500);
});

// ─── Results screen buttons ───────────────────────────
document.getElementById('rsPlayAgainBtn').addEventListener('click', async () => {
  document.getElementById('resultsScreen').classList.add('hidden');
  _resetResultsFooter();
  await initGame({ ...cfg });
});

function _resetResultsFooter() {
  document.getElementById('rsPlayAgainBtn').classList.remove('hidden');
  document.getElementById('rsTomorrowMsg').classList.add('hidden');
}

document.getElementById('rsMenuBtn').addEventListener('click', () => {
  document.getElementById('resultsScreen').classList.add('hidden');
  _resetResultsFooter();
  if (game) game.stop();
  updateDailyUI();
  showScreen('menuScreen');
});

// ─── Daily challenge ──────────────────────────────────
let _dailyIds = null;

fetch('/api/daily')
  .then(r => r.json())
  .then(d => {
    _dailyIds = d.ids;
    const dateEl = document.getElementById('dailyDate');
    if (dateEl && d.date) {
      const dt = new Date(d.date + 'T12:00:00');
      dateEl.textContent = dt.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
      }).toUpperCase();
    }
    updateDailyUI();
    updateDailyStreakUI();
  })
  .catch(() => {
    const btn = document.getElementById('dailyStartBtn');
    if (btn) { btn.textContent = 'UNAVAILABLE'; btn.disabled = true; }
  });

document.getElementById('dailyShareBtn').addEventListener('click', async () => {
  const state = getDailyState();
  if (!state.played || !state.results) return;
  const btn = document.getElementById('dailyShareBtn');
  const orig = btn.textContent;
  btn.textContent = 'GENERATING...';
  btn.disabled = true;
  try {
    const result = await shareResults({
      score: state.score,
      bestStreak: state.bestStreak || 0,
      correct: state.correct,
      total: state.total,
      results: state.results,
      isDaily: true,
    });
    btn.textContent = result === 'copied' ? 'COPIED!' : result === 'shared' ? 'SHARED!' : 'SAVED!';
  } catch (_) {
    btn.textContent = 'ERROR';
  }
  setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 2500);
});

document.getElementById('dailyStartBtn').addEventListener('click', async () => {
  if (!_dailyIds || getDailyState().played) return;
  window.DAILY_MODE    = true;
  window.REDUCED_MOTION = true;
  showScreen('gameScreen');
  sizeGameWrap();
  await initGame({
    mode:         'silhouette',
    answer:       'typed',
    sprite_type:  'animated',
    timer:        10,
    lives:        1,
    gen:          'all',
    type_filter:  'all',
    order:        'ordered',
    count:        6,
    season:       'seasonal',
    fixedQueue:   _dailyIds,
    trainer_src:  cfg.trainer_src,
    trainer_cell: cfg.trainer_cell,
    trainer_row:  cfg.trainer_row,
  });
});

// ─── Canvas / wrap sizing ─────────────────────────────
function sizeGameWrap() {
  const wrap   = document.getElementById('gameWrap');
  const screen = document.getElementById('gameScreen');
  const vw = (window.visualViewport?.width  ?? window.innerWidth);
  const vh = (window.visualViewport?.height ?? window.innerHeight);
  const aspect  = 16 / 9;
  const isPortrait = vh > vw;
  const isTouch    = window.matchMedia('(pointer: coarse)').matches;

  if (isPortrait && isTouch) {
    // Mobile portrait: rotate 90° so the 16:9 game fills the portrait screen
    let gameH = vw;
    let gameW = gameH * aspect;
    if (gameW > vh) { gameW = vh; gameH = gameW / aspect; }

    wrap.style.width           = Math.round(gameW) + 'px';
    wrap.style.height          = Math.round(gameH) + 'px';
    wrap.style.position        = 'absolute';
    wrap.style.left            = Math.round((vw - gameW) / 2) + 'px';
    wrap.style.top             = Math.round((vh - gameH) / 2) + 'px';
    wrap.style.transform       = 'rotate(90deg)';
    wrap.style.transformOrigin = 'center center';
    screen.style.overflow      = 'hidden';
  } else {
    let w = vw, h = w / aspect;
    if (h > vh) { h = vh; w = h * aspect; }
    wrap.style.width           = Math.round(w) + 'px';
    wrap.style.height          = Math.round(h) + 'px';
    wrap.style.position        = '';
    wrap.style.left            = '';
    wrap.style.top             = '';
    wrap.style.transform       = '';
    wrap.style.transformOrigin = '';
    screen.style.overflow      = '';
  }
}

if (window.visualViewport) window.visualViewport.addEventListener('resize', sizeGameWrap);
window.addEventListener('resize', sizeGameWrap);
sizeGameWrap();
