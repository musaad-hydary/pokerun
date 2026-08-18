'use strict';

async function generateShareImage({ score, bestStreak, correct, total, results, isDaily }) {
  await document.fonts.ready;

  const S       = 2;
  const CARD_W  = 600;
  const SHADOW  = 6;
  const HEADER_H = 62;
  const GRID_PAD = 10;

  const items = results.slice(0, 20);
  const n     = items.length;
  const COLS  = n <= 6 ? n : n <= 10 ? 5 : 10;
  const ROWS  = Math.ceil(n / COLS);

  const CW          = Math.floor((CARD_W - GRID_PAD * 2) / COLS);
  const CH          = Math.round(CW * 1.1);
  const LABEL_H     = Math.max(14, Math.round(CW * 0.15));
  const STRIPE_H    = 3;
  const SPRITE_AREA = CH - STRIPE_H - LABEL_H;
  const SPRITE_PAD  = 4;
  const SPRITE_SIZE = Math.max(8, SPRITE_AREA - SPRITE_PAD * 2);

  const GRID_H = ROWS * CH + GRID_PAD * 2;
  const CARD_H = HEADER_H + GRID_H;

  const canvas  = document.createElement('canvas');
  canvas.width  = (CARD_W + SHADOW) * S;
  canvas.height = (CARD_H + SHADOW) * S;
  const ctx     = canvas.getContext('2d');
  ctx.scale(S, S);

  // ── Shadow ────────────────────────────────────────────
  ctx.fillStyle = '#000';
  ctx.fillRect(SHADOW, SHADOW, CARD_W, CARD_H);

  // ── Panel background ──────────────────────────────────
  ctx.fillStyle = '#f4f4ec';
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Panel border
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, CARD_W - 4, CARD_H - 4);

  // ── Header bar ────────────────────────────────────────
  ctx.fillStyle = '#CC0000';
  ctx.fillRect(0, 0, CARD_W, HEADER_H);
  ctx.fillStyle = '#880000';
  ctx.fillRect(0, HEADER_H - 3, CARD_W, 3);

  // Pokeball
  const PX = 24, PY = 31, PR = 16;
  ctx.save();
  ctx.beginPath();
  ctx.arc(PX, PY, PR, 0, Math.PI * 2);
  ctx.clip();
  // Top half — white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(PX - PR - 1, PY - PR - 1, (PR + 1) * 2, PR + 1);
  // Bottom half — dark so it reads on red background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(PX - PR - 1, PY, (PR + 1) * 2, PR + 1);
  // Center band — white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(PX - PR - 1, PY - 1.5, (PR + 1) * 2, 3);
  ctx.restore();
  // Outer ring stroke
  ctx.beginPath();
  ctx.arc(PX, PY, PR, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Center button — white ring
  ctx.beginPath();
  ctx.arc(PX, PY, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  // Center button — dark inner dot (visible on white band)
  ctx.beginPath();
  ctx.arc(PX, PY, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();

  // Title
  ctx.textAlign = 'left';
  ctx.font = '16px "Press Start 2P"';
  ctx.fillStyle = '#fff';
  ctx.fillText('POKERUN', 50, 27);
  ctx.font = '5.5px "Press Start 2P"';
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText(isDaily ? 'DAILY CHALLENGE' : 'POKÉDEX QUIZ', 52, 41);

  // Stats — 3 columns, each value + label paired in same x position
  const stats = [
    { label: 'SCORE',   value: String(score),            color: '#ffffff',              size: '13px' },
    { label: 'CORRECT', value: `${correct}/${total}`,    color: 'rgba(255,255,255,0.9)', size: '9px'  },
    { label: 'STREAK',  value: String(bestStreak),       color: '#FFD700',              size: '11px' },
  ];
  const RE = CARD_W - 16;
  const COL_GAP = 110;
  ctx.textAlign = 'right';
  stats.forEach((s, i) => {
    const x = RE - i * COL_GAP;
    ctx.font = `${s.size} "Press Start 2P"`;
    ctx.fillStyle = s.color;
    ctx.fillText(s.value, x, 28);
    ctx.font = '5px "Press Start 2P"';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(s.label, x, 44);
  });
  ctx.textAlign = 'left';

  // ── Pokemon grid ──────────────────────────────────────
  const OX = (CARD_W - CW * COLS) / 2;
  const OY = HEADER_H + GRID_PAD;

  const loadImg = src => new Promise(res => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
    setTimeout(() => res(null), 4000);
  });

  const imgs = await Promise.all(
    items.map(r => loadImg(r.pokemon.official_artwork || r.pokemon.sprite || ''))
  );

  items.forEach((r, i) => {
    const col  = i % COLS;
    const row  = Math.floor(i / COLS);
    const x    = OX + col * CW;
    const y    = OY + row * CH;
    const isOk = r.correct;

    // Cell background
    ctx.fillStyle = isOk ? '#f2fff4' : '#fff2f2';
    ctx.fillRect(x + 1, y + 1, CW - 2, CH - 2);

    // Cell border
    ctx.strokeStyle = isOk ? '#c8e8d0' : '#f0c8c8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.75, y + 0.75, CW - 1.5, CH - 1.5);

    // Top accent stripe
    ctx.fillStyle = isOk ? '#28C828' : '#F82020';
    ctx.fillRect(x + 1, y + 1, CW - 2, STRIPE_H);

    // Sprite
    if (imgs[i]) {
      ctx.drawImage(
        imgs[i],
        x + (CW - SPRITE_SIZE) / 2,
        y + STRIPE_H + SPRITE_PAD,
        SPRITE_SIZE,
        SPRITE_SIZE
      );
    }

    // Name label area
    const LY = y + STRIPE_H + SPRITE_AREA;
    ctx.fillStyle = isOk ? '#e8f8ec' : '#f8e8e8';
    ctx.fillRect(x + 1, LY, CW - 2, LABEL_H);

    const namePx = Math.max(4, Math.round(CW * 0.075));
    ctx.font = `${namePx}px "Press Start 2P"`;
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText(
      r.pokemon.name.toUpperCase().slice(0, 8),
      x + CW / 2,
      LY + LABEL_H * 0.72
    );
    ctx.textAlign = 'left';
  });

  return canvas;
}

async function shareResults(data) {
  const canvas = await generateShareImage(data);

  return new Promise((resolve, reject) => {
    canvas.toBlob(async blob => {
      if (!blob) { reject(new Error('canvas export failed')); return; }

      const file = new File([blob], 'pokerun.png', { type: 'image/png' });

      // 1. Native share (mobile)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: 'PokéRun Results',
            text:  `Score: ${data.score} | Streak: ${data.bestStreak} | ${data.correct}/${data.total}`,
            files: [file],
          });
          resolve('shared'); return;
        } catch (_) {}
      }

      // 2. Clipboard (desktop Chrome/Edge)
      if (navigator.clipboard?.write) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          resolve('copied'); return;
        } catch (_) {}
      }

      // 3. Download fallback
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href = url; a.download = 'pokerun-results.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      resolve('downloaded');
    }, 'image/png');
  });
}
