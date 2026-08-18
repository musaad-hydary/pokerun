'use strict';

const ANIMATED_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/';

class Quiz {
  constructor() {
    this.pokemon       = null;
    this.answered      = false;
    this._timerTimeout = null;
    this._timerInterval= null;

    document.addEventListener('showQuiz', e => this._show(e.detail));
    document.addEventListener('hideQuiz', () => this._hide());
    document.addEventListener('gameOver', e => this._showResults(e.detail));

    document.getElementById('hintLetter').addEventListener('click',   () => this._useHint('letter'));
    document.getElementById('hintType').addEventListener('click',     () => this._useHint('type'));
    document.getElementById('cryReplayBtn').addEventListener('click', () => this.playCry(this.pokemon?.id));
  }

  _show({ pokemon, choices, mode, answer, sprite_type, timer, theme }) {
    this.pokemon  = pokemon;
    this.answered = false;
    this._stopTimer();

    // ── Pokémon cry ───────────────────────────────────
    if (window.CRIES_ENABLED || mode === 'cry_only') {
      this.playCry(pokemon.id);
    }

    // ── Artwork ──────────────────────────────────────
    const img          = document.getElementById('pokeImg');
    const numEl        = document.getElementById('pokeNum');
    const cryIndicator = document.getElementById('cryIndicator');
    img.classList.remove('silhouette');
    img.style.display = 'block';
    numEl.classList.add('hidden');
    cryIndicator.classList.add('hidden');

    if (mode === 'cry_only') {
      img.style.display = 'none';
      cryIndicator.classList.remove('hidden');
    } else if (mode === 'number_only') {
      img.style.display = 'none';
      numEl.classList.remove('hidden');
      numEl.textContent = `#${String(pokemon.id).padStart(3, '0')}`;
    } else if (mode === 'silhouette') {
      img.src = pokemon.official_artwork || pokemon.sprite || '';
      img.classList.add('silhouette');
    } else {
      if (sprite_type === 'animated') {
        img.src = `${ANIMATED_BASE}${pokemon.id}.gif`;
        img.onerror = () => { img.src = pokemon.official_artwork || pokemon.sprite || ''; img.onerror = null; };
      } else {
        img.src = pokemon.official_artwork || pokemon.sprite || '';
      }
    }

    // ── Info bar ──────────────────────────────────────
    document.getElementById('bwPokeName').textContent = '???????????';

    const typeEl = document.getElementById('bwPokeTypes');
    typeEl.innerHTML = '';
    // Types hidden when hints enabled — revealed via hint or on answer
    if (!window.HINTS_ENABLED) {
      this._showTypes(pokemon);
    }

    document.getElementById('bwHpBar').style.width      = '100%';
    document.getElementById('bwHpBar').style.background = '#28C828';

    // ── Question text ────────────────────────────────
    document.getElementById('quizQ').textContent =
      mode === 'number_only' ? 'NAME THIS POKÉMON!' :
      mode === 'cry_only'    ? 'NAME THAT CRY!'     :
      "WHO'S THAT POKÉMON?";

    // ── Hint bar ─────────────────────────────────────
    const hintBar     = document.getElementById('hintBar');
    const hintDisplay = document.getElementById('hintDisplay');
    const hintLetter  = document.getElementById('hintLetter');
    const hintType    = document.getElementById('hintType');
    if (window.HINTS_ENABLED) {
      hintBar.classList.remove('hidden');
      hintDisplay.classList.add('hidden');
      hintDisplay.textContent = '';
      hintLetter.disabled = false;
      hintLetter.classList.remove('used');
      hintType.disabled = false;
      hintType.classList.remove('used');
    } else {
      hintBar.classList.add('hidden');
    }

    // ── Answer input ─────────────────────────────────
    const grid = document.getElementById('choicesGrid');
    grid.innerHTML = '';
    grid.className = 'bw-move-grid';

    if (answer === 'typed') {
      this._buildTypeInput(grid);
    } else {
      choices.forEach((choice, i) => {
        const btn = document.createElement('button');
        btn.className   = 'choice-btn';
        btn.dataset.id  = choice.id;
        btn.textContent = `${['A','B','C','D'][i]}  ${choice.name.toUpperCase()}`;
        btn.addEventListener('click', () => this._pick(choice, btn));
        grid.appendChild(btn);
      });
    }

    // ── Season-matched battle background ─────────────
    if (theme) {
      document.querySelector('.bw-battle-top').style.background =
        `linear-gradient(180deg, ${theme.skyTop} 0%, ${theme.skyHor} 55%, ${theme.grass} 55%, ${theme.grassD} 100%)`;
    }

    // ── Show overlay ──────────────────────────────────
    const overlay = document.getElementById('quizOverlay');
    overlay.classList.remove('hidden', 'slide-out');

    // ── Timer ─────────────────────────────────────────
    this._startTimer(timer || 0);
  }

  _revealArtwork() {
    const indicator = document.getElementById('cryIndicator');
    const img       = document.getElementById('pokeImg');
    if (!indicator.classList.contains('hidden')) {
      indicator.classList.add('hidden');
      img.src = this.pokemon.official_artwork || this.pokemon.sprite || '';
      img.style.display = 'block';
    }
  }

  playCry(id) {
    if (!id) return;
    try {
      const cry = new Audio(
        `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`
      );
      cry.volume = 0.5;
      cry.play().catch(() => {});
    } catch (_) {}
  }

  _showTypes(pokemon) {
    const typeEl = document.getElementById('bwPokeTypes');
    typeEl.innerHTML = '';
    (pokemon.types || []).forEach(type => {
      const span = document.createElement('span');
      span.className  = `type-badge type-${type}`;
      span.textContent = type;
      typeEl.appendChild(span);
    });
  }

  _useHint(type) {
    if (this.answered || !this.pokemon) return;
    const hintDisplay = document.getElementById('hintDisplay');

    if (type === 'letter') {
      const first = this.pokemon.name[0].toUpperCase();
      const appended = hintDisplay.textContent
        ? hintDisplay.textContent + `  |  STARTS: ${first}`
        : `STARTS WITH: ${first}`;
      hintDisplay.textContent = appended;
      hintDisplay.classList.remove('hidden');
      document.getElementById('hintLetter').disabled = true;
      if (game) game.applyHintCost(50);
    } else if (type === 'type') {
      this._showTypes(this.pokemon);
      hintDisplay.textContent = hintDisplay.textContent
        ? hintDisplay.textContent + '  |  TYPE REVEALED'
        : 'TYPE REVEALED';
      hintDisplay.classList.remove('hidden');
      document.getElementById('hintType').disabled = true;
      if (game) game.applyHintCost(25);
    }
  }

  _buildTypeInput(grid) {
    grid.classList.add('typed-mode');
    grid.innerHTML = `
      <div class="type-it-wrap">
        <input id="typeInput" class="type-input" type="text"
               placeholder="TYPE NAME..."
               autocomplete="off" autocapitalize="none"
               autocorrect="off" spellcheck="false">
        <button id="typeSubmit" class="type-submit-btn">▶ SUBMIT</button>
      </div>
    `;

    const doSubmit = () => {
      const inp = document.getElementById('typeInput');
      const sub = document.getElementById('typeSubmit');
      const typed = inp?.value.trim() || '';
      if (!typed || this.answered) return;
      this.answered = true;
      this._stopTimer();

      const correct = this._normalize(typed) === this._normalize(this.pokemon.name);
      inp.disabled = true;
      sub.disabled = true;
      inp.classList.add(correct ? 'correct' : 'wrong');

      document.getElementById('bwPokeName').textContent = this.pokemon.name.toUpperCase();
      this._revealArtwork();
      if (window.HINTS_ENABLED) this._showTypes(this.pokemon);
      const hpBar = document.getElementById('bwHpBar');
      hpBar.style.width      = correct ? '100%' : '25%';
      hpBar.style.background = correct ? '#28C828' : '#F82020';

      this._showResult(correct);
      if (game) game.submitAnswer(correct);
    };

    document.getElementById('typeSubmit').addEventListener('click', doSubmit);
    document.getElementById('typeInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') doSubmit();
    });
    setTimeout(() => document.getElementById('typeInput')?.focus(), 80);
  }

  _normalize(s) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  _pick(choice, btn) {
    if (this.answered) return;
    this.answered = true;
    this._stopTimer();

    const correct = choice.id === this.pokemon.id;

    document.querySelectorAll('.choice-btn').forEach(b => {
      b.disabled = true;
      if (parseInt(b.dataset.id) === this.pokemon.id) b.classList.add('correct');
    });
    if (!correct) btn.classList.add('wrong');

    document.getElementById('bwPokeName').textContent = this.pokemon.name.toUpperCase();
    this._revealArtwork();
    if (window.HINTS_ENABLED) this._showTypes(this.pokemon);
    const hpBar = document.getElementById('bwHpBar');
    hpBar.style.width      = correct ? '100%' : '25%';
    hpBar.style.background = correct ? '#28C828' : '#F82020';

    this._showResult(correct);
    if (game) game.submitAnswer(correct);
  }

  // ── Timer ─────────────────────────────────────────────

  _startTimer(seconds) {
    const wrap = document.getElementById('quizTimerWrap');
    const fill = document.getElementById('quizTimerFill');
    if (!seconds || seconds <= 0) {
      wrap.classList.remove('active');
      return;
    }

    wrap.classList.add('active');
    fill.className = 'quiz-timer-fill'; // reset animation
    fill.style.setProperty('--td', `${seconds}s`);

    // Trigger reflow so animation restarts cleanly
    void fill.offsetWidth;
    fill.classList.add('draining');

    this._timerTimeout = setTimeout(() => {
      if (!this.answered) this._onTimerExpire();
    }, seconds * 1000);
  }

  _stopTimer() {
    clearTimeout(this._timerTimeout);
    this._timerTimeout = null;
    const wrap = document.getElementById('quizTimerWrap');
    const fill = document.getElementById('quizTimerFill');
    if (wrap) wrap.classList.remove('active');
    if (fill) fill.classList.remove('draining');
  }

  _onTimerExpire() {
    if (this.answered) return;
    this.answered = true;

    // Reveal correct on MC
    document.querySelectorAll('.choice-btn').forEach(b => {
      b.disabled = true;
      if (parseInt(b.dataset.id) === this.pokemon.id) b.classList.add('correct');
    });

    // Mark typed input wrong if open
    const inp = document.getElementById('typeInput');
    const sub = document.getElementById('typeSubmit');
    if (inp) { inp.disabled = true; inp.classList.add('wrong'); }
    if (sub) sub.disabled = true;

    document.getElementById('bwPokeName').textContent = this.pokemon.name.toUpperCase();
    this._revealArtwork();
    if (window.HINTS_ENABLED) this._showTypes(this.pokemon);
    const hpBar = document.getElementById('bwHpBar');
    hpBar.style.width      = '25%';
    hpBar.style.background = '#F82020';

    this._showResult(false);
    if (game) game.submitAnswer(false);
  }

  // ── Result ────────────────────────────────────────────

  _showResult(correct) {
    const banner = document.getElementById('resultBanner');
    document.getElementById('resultWord').className   = 'result-word ' + (correct ? 'correct' : 'wrong');
    document.getElementById('resultWord').textContent = correct ? 'CORRECT!' : 'WRONG!';
    document.getElementById('resultPokeName').textContent = this.pokemon.name.toUpperCase();
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 2200);
  }

  _hide() {
    const overlay = document.getElementById('quizOverlay');
    document.getElementById('resultBanner').classList.add('hidden');
    this._stopTimer();
    overlay.classList.add('slide-out');
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.classList.remove('slide-out');
    }, 380);
  }

  // ── Results screen ────────────────────────────────────

  _showResults({ score, correct, total, bestStreak, results }) {
    document.getElementById('rsScore').textContent   = score;
    document.getElementById('rsStreak').textContent  = bestStreak;
    document.getElementById('rsCorrect').textContent = correct;
    document.getElementById('rsTotal').textContent   = total;

    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = '';

    (results || []).forEach(({ pokemon, correct: isCorrect }) => {
      const card = document.createElement('div');
      card.className = `result-card ${isCorrect ? 'rc-correct' : 'rc-wrong'}`;

      const img = document.createElement('img');
      img.src = pokemon.official_artwork || pokemon.sprite || '';
      img.alt = pokemon.name;

      const name = document.createElement('div');
      name.className   = 'rc-name';
      name.textContent = pokemon.name.toUpperCase();

      const mark = document.createElement('div');
      mark.className   = 'rc-mark';
      mark.textContent = isCorrect ? '✓' : '✗';

      card.appendChild(img);
      card.appendChild(name);
      card.appendChild(mark);
      grid.appendChild(card);
    });

    document.getElementById('resultsScreen').classList.remove('hidden');
  }
}

const quiz = new Quiz();

// Keyboard shortcuts A–D / 1–4 (MC mode)
document.addEventListener('keydown', e => {
  const map = { '1':'0','a':'0', '2':'1','b':'1', '3':'2','c':'2', '4':'3','d':'3' };
  const idx = map[e.key.toLowerCase()];
  if (idx === undefined) return;
  const btns = document.querySelectorAll('.choice-btn');
  if (btns[idx] && !btns[idx].disabled) btns[idx].click();
});
