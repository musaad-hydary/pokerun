'use strict';

function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  const COLORS = ['#CC0000','#FFD700','#28C828','#4488FF','#FF88CC','#ffffff','#FF6600'];
  const particles = Array.from({ length: 110 }, () => ({
    x:     Math.random() * canvas.width,
    y:     -10 - Math.random() * 120,
    w:     5 + Math.random() * 8,
    h:     3 + Math.random() * 5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    vx:    (Math.random() - 0.5) * 3.5,
    vy:    2.5 + Math.random() * 4,
    rot:   Math.random() * Math.PI * 2,
    rotV:  (Math.random() - 0.5) * 0.18,
  }));

  const DURATION = 3200;
  const FADE_START = 2200;
  let start = null;

  function frame(ts) {
    if (!start) start = ts;
    const elapsed = ts - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const alpha = elapsed < FADE_START ? 1 : Math.max(0, 1 - (elapsed - FADE_START) / (DURATION - FADE_START));

    for (const p of particles) {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.12;
      p.rot += p.rotV;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (elapsed < DURATION) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(frame);
}
