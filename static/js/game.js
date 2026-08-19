'use strict';

// ── Virtual resolution ────────────────────────────────
const VW = 320, VH = 180;
const HY = 62;        // horizon y
const CX = VW / 2;   // vanishing point x

// ── Perspective helpers ───────────────────────────────
const Z_NEAR = 2, Z_FAR = 28;
const PATH_HW_WORLD = 18;
const SF = 4.4;

function wToS(wx, Z) {
  const t = Z_NEAR / Z;
  return { sx: Math.round(CX + wx * t * SF), sy: Math.round(HY + t * (VH - HY)), t };
}

// ── Season themes ─────────────────────────────────────
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

const SEASON = {
  spring: {
    skyTop:    '#B0D4EE', skyHor: '#D4EAF8',
    grass:     '#72CC72', grassD: '#58B858',
    path:      '#D0C48A', pathLine: '#E8DCA0',
    treeDark:  '#C84878', treeMid:  '#F08AA8', treeLight: '#FFB8CC',
    mtnMain:   '#C8B8D4', mtnShd:   '#B0A0BC', mtnSnow: '#F0EAF4',
    cloud:     '#FFFAFC',
    particle:  'petal',
  },
  summer: {
    skyTop:    '#4A9BD4', skyHor: '#7EC4E8',
    grass:     '#5BBF5B', grassD: '#4AAF4A',
    path:      '#C8B878', pathLine: '#E0D098',
    treeDark:  '#1B5E20', treeMid:  '#2E7D32', treeLight: '#4CAF50',
    mtnMain:   '#D8C4A0', mtnShd:   '#C4B090', mtnSnow: '#EEF3F8',
    cloud:     '#FFFFFF',
    particle:  null,
  },
  autumn: {
    skyTop:    '#7898B8', skyHor: '#AABCC8',
    grass:     '#8AAA48', grassD: '#708038',
    path:      '#C4A060', pathLine: '#D4B070',
    treeDark:  '#B03800', treeMid:  '#D85000', treeLight: '#F89010',
    mtnMain:   '#C4A060', mtnShd:   '#A88048', mtnSnow: '#DDD0A0',
    cloud:     '#F8F0E8',
    particle:  'leaf',
  },
  winter: {
    skyTop:    '#8AAAC8', skyHor: '#B4C8E0',
    grass:     '#CCE0F0', grassD: '#B0C8DC',
    path:      '#D0CAB8', pathLine: '#E0DAC8',
    treeDark:  '#C8D8E8', treeMid:  '#DCEAF4', treeLight: '#F0F6FF',
    mtnMain:   '#D4E8FC', mtnShd:   '#C0D4E8', mtnSnow: '#FFFFFF',
    cloud:     '#F0F4F8',
    particle:  'snow',
  },
  beach: {
    skyTop:    '#3AAEED', skyHor: '#88D4F8',
    grass:     '#D4B860', grassD: '#C0A448',
    path:      '#E8D07A', pathLine: '#F4DC8A',
    treeDark:  '#1A5C1A', treeMid:  '#2A8030', treeLight: '#4AB050',
    mtnMain:   '#C4D8E8', mtnShd:   '#B0C4D8', mtnSnow: '#E8EFF8',
    cloud:     '#FFFFFF',
    particle:  null,
  },
  storm: {
    skyTop:    '#1A1E28', skyHor: '#252C3C',
    grass:     '#243A20', grassD: '#1A2C18',
    path:      '#484840', pathLine: '#545450',
    treeDark:  '#0C1C0A', treeMid:  '#162A12', treeLight: '#1E381A',
    mtnMain:   '#2C3438', mtnShd:   '#1C2428', mtnSnow: '#383C40',
    cloud:     '#3A3E44',
    particle:  'rain',
  },
  volcano: {
    skyTop:    '#2A0C00', skyHor: '#8A2800',
    grass:     '#1C0800', grassD: '#140400',
    path:      '#3A1408', pathLine: '#4A1C0C',
    treeDark:  '#180400', treeMid:  '#220800', treeLight: '#2C0C04',
    mtnMain:   '#4A1A08', mtnShd:   '#320E04', mtnSnow: '#CC3800',
    cloud:     '#3C2018',
    particle:  'ember',
  },
  // ── Fixed special environments (no TOD cycle) ─────────
  fog: {
    skyTop:    '#9AACAC', skyHor: '#B4C8C4',
    grass:     '#6A8068', grassD: '#5A7058',
    path:      '#B0B098', pathLine: '#C0C0A8',
    treeDark:  '#384838', treeMid:  '#485A46', treeLight: '#586A56',
    mtnMain:   '#889898', mtnShd:   '#708080', mtnSnow: '#AEBCBA',
    cloud:     '#CCD8D4',
    particle:  null,
    overlay:   'rgba(218,228,222,0.40)',
    fixed:     true,
  },
  cave: {
    skyTop:    '#120A06', skyHor: '#1C1008',
    grass:     '#1A0E06', grassD: '#120A04',
    path:      '#281606', pathLine: '#341C0A',
    treeDark:  '#0E0804', treeMid:  '#160C06', treeLight: '#1E1008',
    mtnMain:   '#3A2818', mtnShd:   '#281808', mtnSnow:   '#4C3828',
    cloud:     '#120A06',
    particle:  'dust',
    fixed:     true,
    renderMode: 'cave',
  },
  ultra: {
    skyTop:    '#080014', skyHor: '#1A003A',
    grass:     '#0C001E', grassD: '#070014',
    path:      '#100048', pathLine: '#180060',
    treeDark:  '#06000E', treeMid:  '#0A0018', treeLight: '#100028',
    mtnMain:   '#0A0030', mtnShd:   '#060020', mtnSnow:   '#6010FF',
    cloud:     '#0C0028',
    particle:  'portal',
    fixed:     true,
    renderMode: 'ultra',
  },
};

// ── Particle system ───────────────────────────────────
class Particles {
  constructor(type) {
    this.type = type;
    const n = { rain: 55, stars: 38, portal: 45, glitch: 26, dust: 28 }[type] ?? 35;
    this.ps = Array.from({ length: n }, () => this._spawn(true));
  }

  _spawn(randomY = false) {
    const p = { x: Math.random() * VW, y: randomY ? Math.random() * VH : -4, vx: 0, vy: 0, sz: 1, col: '#fff' };
    if (this.type === 'snow') {
      p.vy = 10 + Math.random() * 14; p.vx = (Math.random() - 0.5) * 6;
      p.sz = Math.random() > 0.5 ? 2 : 1; p.col = 'rgba(240,248,255,0.92)';
    } else if (this.type === 'leaf') {
      p.vy = 18 + Math.random() * 22; p.vx = (Math.random() - 0.5) * 25;
      p.sz = 2; p.col = ['#E65100','#F57C00','#FFC107','#D84315','#FF8F00'][Math.floor(Math.random()*5)];
    } else if (this.type === 'petal') {
      p.vy = 10 + Math.random() * 14; p.vx = (Math.random() - 0.5) * 14;
      p.sz = 2; p.col = ['#FFB7C5','#FF8FAB','#FFCCD5','#FFA0B8'][Math.floor(Math.random()*4)];
    } else if (this.type === 'rain') {
      p.vy = 80 + Math.random() * 50; p.vx = -10 - Math.random() * 6;
      p.sz = 1; p.col = `rgba(${120+Math.floor(Math.random()*30)},${150+Math.floor(Math.random()*30)},${210+Math.floor(Math.random()*30)},0.65)`;
    } else if (this.type === 'ember') {
      p.y = randomY ? Math.random() * VH : VH + 4;
      p.vy = -(14 + Math.random() * 22); p.vx = (Math.random() - 0.5) * 12;
      p.sz = Math.random() > 0.6 ? 2 : 1;
      p.col = ['#FF4500','#FF6600','#FF8C00','#FFAA00','#FF2800'][Math.floor(Math.random()*5)];
    } else if (this.type === 'stars') {
      p.y = randomY ? Math.random() * (HY + 4) : -Math.floor(Math.random() * 6);
      p.vy = 0.4 + Math.random() * 0.4; p.vx = (Math.random() - 0.5) * 0.3;
      p.sz = 1;
      p.col = Math.random() > 0.88 ? '#FFFFC0' : '#FFFFFF';
    } else if (this.type === 'dust') {
      p.vy = 2 + Math.random() * 7; p.vx = (Math.random() - 0.5) * 5;
      p.sz = 1;
      const v = 90 + Math.floor(Math.random() * 60);
      p.col = `rgba(${v},${Math.floor(v*0.78)},${Math.floor(v*0.48)},0.32)`;
    } else if (this.type === 'glitch') {
      p.vy = 7 + Math.random() * 22; p.vx = (Math.random() - 0.5) * 32;
      p.sz = Math.random() > 0.55 ? 2 : 1;
      p.col = ['#CC00FF','#9900EE','#FF00CC','#6600FF','#BB44FF'][Math.floor(Math.random()*5)];
    } else if (this.type === 'portal') {
      p.y = randomY ? Math.random() * VH : VH + 4;
      p.vy = -(8 + Math.random() * 28); p.vx = (Math.random() - 0.5) * 16;
      p.sz = Math.random() > 0.5 ? 2 : 1;
      p.col = ['#FF0055','#FF8800','#FFDD00','#00FF88','#00AAFF','#AA00FF','#FF00CC'][Math.floor(Math.random()*7)];
    }
    return p;
  }

  update(dt) {
    this.ps.forEach(p => {
      p.x += p.vx * dt; p.y += p.vy * dt;
      const rising  = this.type === 'ember' || this.type === 'portal';
      const skyOnly = this.type === 'stars';
      const gone = rising ? p.y < -4 : skyOnly ? p.y > HY + 8 : p.y > VH + 4;
      if (gone) Object.assign(p, this._spawn(false));
    });
  }

  render(ctx) {
    this.ps.forEach(p => {
      ctx.fillStyle = p.col;
      if (this.type === 'rain') {
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 3);
      } else {
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.sz, p.sz);
      }
    });
  }
}

// ── Color helpers ─────────────────────────────────────
function lerpColor(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r  = Math.round(((pa >> 16 & 0xff) * (1-t)) + ((pb >> 16 & 0xff) * t));
  const g  = Math.round(((pa >>  8 & 0xff) * (1-t)) + ((pb >>  8 & 0xff) * t));
  const bv = Math.round(((pa       & 0xff) * (1-t)) + ((pb       & 0xff) * t));
  return '#' + r.toString(16).padStart(2,'0') + g.toString(16).padStart(2,'0') + bv.toString(16).padStart(2,'0');
}

function darkenColor(hex, f) {
  if (!hex || hex[0] !== '#' || f >= 1) return hex;
  const v = parseInt(hex.slice(1), 16);
  return '#' + [v >> 16 & 0xff, v >> 8 & 0xff, v & 0xff]
    .map(c => Math.max(0, Math.min(255, Math.round(c * f))).toString(16).padStart(2,'0'))
    .join('');
}

// ── Time-of-day system ────────────────────────────────
const TOD_ORDER = ['day', 'dusk', 'night', 'dawn'];

const TOD_MODS = {
  day:   { skyTop: null,      skyHor: null,      blend: 0,    dark: 1.00 },
  dusk:  { skyTop: '#6A1030', skyHor: '#C83808', blend: 0.78, dark: 0.66 },
  night: { skyTop: '#040810', skyHor: '#080E18', blend: 0.93, dark: 0.28, stars: true },
  dawn:  { skyTop: '#7A3050', skyHor: '#D85C38', blend: 0.68, dark: 0.52 },
};

function applyTOD(base, todName) {
  const mod = TOD_MODS[todName] || TOD_MODS.day;
  const { dark, blend, stars } = mod;
  const dk = (hex, f = dark) => darkenColor(hex, f);
  const skyTop = blend > 0 ? lerpColor(base.skyTop, mod.skyTop, blend) : base.skyTop;
  const skyHor = blend > 0 ? lerpColor(base.skyHor, mod.skyHor, blend) : base.skyHor;
  return {
    skyTop, skyHor,
    grass:     dk(base.grass),
    grassD:    dk(base.grassD, dark * 0.92),
    path:      dk(base.path,   Math.min(1, dark * 1.06)),
    pathLine:  dk(base.pathLine, Math.min(1, dark * 1.04)),
    treeDark:  dk(base.treeDark, dark * 0.72),
    treeMid:   dk(base.treeMid,  dark * 0.84),
    treeLight: dk(base.treeLight, dark * 0.94),
    mtnMain:   dk(base.mtnMain, dark * 0.78),
    mtnShd:    dk(base.mtnShd,  dark * 0.68),
    mtnSnow:   dk(base.mtnSnow, dark * 0.96),
    cloud:     dk(base.cloud,   dark * 0.86),
    particle:  (stars && !base.particle) ? 'stars' : base.particle,
    overlay:   base.overlay || null,
    fixed:     false,
  };
}

// ── Terrain ───────────────────────────────────────────
class Terrain {
  constructor(seasonName, todName = 'day') {
    this._baseSeason = seasonName;
    this._todName    = todName;
    this.theme       = this._computeTheme(seasonName, todName);
    this._prevTheme  = null;
    this._fadeT      = 1.0;
    this._fadeDur    = 3.5;
    this._pendingParticle = undefined;
    this.runSpeed = 6.5;
    this.scroll   = 0;

    this.trees = [];
    for (let i = 0; i < 14; i++) {
      const Z = Z_NEAR + 0.8 + (i / 13) * (Z_FAR - Z_NEAR - 1);
      this.trees.push({ wx: -(42 + Math.random() * 28), Z });
      this.trees.push({ wx:   42 + Math.random() * 28,  Z: Z + 0.3 });
    }

    this.flowers = Array.from({ length: 22 }, () => ({
      wx: (Math.random() > 0.5 ? 1 : -1) * (22 + Math.random() * 58),
      Z: Z_NEAR + 1 + Math.random() * (Z_FAR - Z_NEAR - 2),
      col: this._flowerCol(seasonName),
    }));

    this.clouds = [
      { x: 15,  y: 18, w: 52, h: 20 },
      { x: 120, y:  9, w: 66, h: 24 },
      { x: 235, y: 16, w: 44, h: 18 },
      { x: 295, y:  8, w: 56, h: 22 },
    ];
    this.cloudDrift = 0;
    this.animTime   = 0;

    // Cave rock formations (closer to path than trees)
    this.rocks = [];
    for (let i = 0; i < 10; i++) {
      const Z = Z_NEAR + 0.8 + (i / 9) * (Z_FAR - Z_NEAR - 1);
      this.rocks.push({ wx: -(20 + Math.random() * 14), Z,         hm: 0.7 + Math.random() * 0.8 });
      this.rocks.push({ wx:   20 + Math.random() * 14,  Z: Z+0.25, hm: 0.7 + Math.random() * 0.8 });
    }

    this.particles = this.theme.particle ? new Particles(this.theme.particle) : null;
  }

  _flowerCol(s) {
    const cols = {
      spring:  ['#FF80AA','#FFB7D0','#FF5599','#FFAACC'],
      summer:  ['#FFD700','#FF8C00','#FFFFFF','#90EE90'],
      autumn:  ['#FF8C00','#FF4500','#FFD700','#8B4513'],
      winter:  ['#B0D8FF','#DDEEFF','#FFFFFF','#C8E8FF'],
      beach:      ['#FFFFFF','#FFE880','#FFD040','#FFFBE8'],
      storm:      ['#2A3020','#354038','#1E2818','#283A20'],
      volcano:    ['#3D0000','#5A0800','#200000','#480A00'],
      fog:        ['#8A9888','#9AACAA','#788A78','#A0ACA0'],
      cave:       ['#3A2010','#2A1808','#4A2818','#301408'],
      distortion: ['#5A1880','#6A2090','#4A1070','#7A28A0'],
      ultra:      ['#001890','#0028C0','#000C60','#1030D0'],
    };
    const arr = cols[s] || cols.summer;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  _getTheme() {
    if (this._fadeT >= 1 || !this._prevTheme) return this.theme;
    const t = this._fadeT, a = this._prevTheme, b = this.theme, th = {};
    for (const k of Object.keys(b)) {
      th[k] = (typeof b[k] === 'string' && b[k][0] === '#' && a[k])
        ? lerpColor(a[k], b[k], t)
        : b[k];
    }
    return th;
  }

  update(dt, mult = 1) {
    if (this._fadeT < 1) {
      this._fadeT = Math.min(1, this._fadeT + dt / this._fadeDur);
      if (this._fadeT >= 0.5 && this._pendingParticle !== undefined) {
        this.particles = this._pendingParticle ? new Particles(this._pendingParticle) : null;
        this._pendingParticle = undefined;
      }
    }
    const dZ = this.runSpeed * dt * mult;
    this.scroll += dZ;
    this.cloudDrift += dt * 4;
    this.animTime   += dt * mult;

    this.trees.forEach(t => {
      t.Z -= dZ;
      if (t.Z < Z_NEAR + 0.5) { t.Z = Z_FAR - Math.random() * 3; t.wx = Math.sign(t.wx) * (42 + Math.random() * 28); }
    });
    this.flowers.forEach(f => {
      f.Z -= dZ;
      if (f.Z < Z_NEAR + 0.8) { f.Z = Z_FAR - Math.random() * 5; f.wx = Math.sign(f.wx) * (22 + Math.random() * 58); }
    });
    this.rocks.forEach(r => {
      r.Z -= dZ;
      if (r.Z < Z_NEAR + 0.5) { r.Z = Z_FAR - Math.random() * 3; r.wx = Math.sign(r.wx) * (18 + Math.random() * 14); }
    });

    if (this.particles) this.particles.update(dt * mult);
  }

  render(ctx) {
    const th   = this._getTheme();
    const mode = th.renderMode || 'default';

    this._sky(ctx);

    if (mode === 'cave') {
      this._stalactites(ctx);
      this._ground(ctx);
      this._path(ctx);
      [...this.rocks].sort((a, b) => b.Z - a.Z).forEach(r => this._rockForm(ctx, r));
    } else if (mode === 'ultra') {
      this._ground(ctx);
      this._ultraPath(ctx);
      this._ultraPortals(ctx);
      [...this.rocks].sort((a, b) => b.Z - a.Z)
        .forEach((r, i) => this._ultraRock(ctx, r, i));
    } else {
      this._mountains(ctx);
      this._ground(ctx);
      this._path(ctx);
      this._pathLines(ctx);
      [...this.flowers.map(f => ({ ...f, k: 'f' })),
       ...this.trees.map(t =>   ({ ...t, k: 't' }))]
        .sort((a, b) => b.Z - a.Z)
        .forEach(o => o.k === 'f' ? this._flower(ctx, o) : this._tree(ctx, o));
    }

    if (th.overlay) { ctx.fillStyle = th.overlay; ctx.fillRect(0, 0, VW, VH); }
  }

  // ── Cave stalactites ────────────────────────────────
  _stalactites(ctx) {
    const th  = this._getTheme();
    const defs = [
      { cx:  28, h:22, w:14 }, { cx:  70, h:30, w:19 },
      { cx: 118, h:16, w:11 }, { cx: 162, h:36, w:23 },
      { cx: 205, h:24, w:16 }, { cx: 248, h:14, w:10 },
      { cx: 288, h:28, w:18 }, { cx: 336, h:20, w:13 },
      { cx: 376, h:32, w:20 },
    ];
    const off = (this.scroll * 0.18) % 420;
    defs.forEach(s => {
      const sx = ((s.cx - off) % 420 + 420) % 420 - 20;
      if (sx < -s.w - 2 || sx > VW + s.w) return;
      for (let i = 0; i < s.h; i++) {
        const hw = Math.round((1 - i / s.h) * s.w / 2);
        if (hw <= 0) continue;
        ctx.fillStyle = i < s.h * 0.35 ? th.mtnMain : th.mtnShd;
        ctx.fillRect(Math.round(sx - hw), i, hw * 2, 1);
      }
      ctx.fillStyle = th.mtnSnow;
      ctx.fillRect(Math.round(sx - 1), s.h - 2, 2, 2);
    });
  }

  // ── Cave rock formations (replaces trees) ───────────
  _rockForm(ctx, r) {
    const pos = wToS(r.wx, r.Z);
    if (pos.sy < HY || pos.sy > VH) return;
    const th = this._getTheme();
    const rw = Math.max(2, Math.round(14 * pos.t * r.hm));
    const rh = Math.max(2, Math.round(12 * pos.t * r.hm));
    for (let dy = 0; dy < rh; dy++) {
      const tv = dy / rh;
      const hw = Math.round(rw * Math.sqrt(Math.max(0, 1 - (2*tv - 1)**2)));
      if (hw <= 0) continue;
      ctx.fillStyle = tv < 0.45 ? th.mtnMain : th.mtnShd;
      ctx.fillRect(pos.sx - hw, pos.sy - rh + dy, hw * 2, 1);
    }
    ctx.fillStyle = th.mtnSnow;
    ctx.fillRect(pos.sx - Math.round(rw*0.35), pos.sy - rh, Math.round(rw*0.7), 1);
  }

  // ── Ultra Space: rainbow crystal rocks ──────────────
  _ultraRock(ctx, r, idx) {
    const pos = wToS(r.wx, r.Z);
    if (pos.sy < HY || pos.sy > VH) return;
    const RAINBOW = ['#FF0055','#FF7700','#FFEE00','#00FF88','#00AAFF','#CC00FF','#FF00BB'];
    const PURPLE  = ['#4400AA','#6600CC','#220066','#5500BB','#330088'];
    const rw = Math.max(2, Math.round(14 * pos.t * r.hm));
    const rh = Math.max(2, Math.round(12 * pos.t * r.hm));
    const hue = (idx * 2.1 + this.animTime * 0.6) % RAINBOW.length;
    const col0 = RAINBOW[Math.floor(hue) % RAINBOW.length];
    const col1 = RAINBOW[(Math.floor(hue) + 1) % RAINBOW.length];
    const mainCol = lerpColor(col0, col1, hue % 1);
    const shadCol = PURPLE[idx % PURPLE.length];
    for (let dy = 0; dy < rh; dy++) {
      const tv = dy / rh;
      const hw = Math.round(rw * Math.sqrt(Math.max(0, 1 - (2*tv - 1)**2)));
      if (hw <= 0) continue;
      ctx.fillStyle = tv < 0.45 ? mainCol : shadCol;
      ctx.fillRect(pos.sx - hw, pos.sy - rh + dy, hw * 2, 1);
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(pos.sx - Math.round(rw*0.35), pos.sy - rh, Math.round(rw*0.7), 1);
  }

  // ── Ultra Space: glowing portal rings ───────────────
  _ultraPortals(ctx) {
    const t = this.animTime;
    const portals = [
      { x: 82,  y: 27, r: 18, ph: 0   },
      { x: 220, y: 20, r: 14, ph: 2.1 },
      { x: 298, y: 31, r: 10, ph: 4.2 },
    ];
    portals.forEach(({ x, y, r, ph }) => {
      const rr = Math.round(r * (1 + 0.06 * Math.sin(t * 1.4 + ph)));

      // Outer aura
      for (let ai = 6; ai >= 1; ai--) {
        const ar = rr + ai;
        ctx.fillStyle = `rgba(0,200,120,${(ai * 0.035).toFixed(2)})`;
        for (let dy = -ar; dy <= ar; dy++) {
          const dx  = Math.round(Math.sqrt(Math.max(0, ar*ar - dy*dy)));
          const dx2 = Math.round(Math.sqrt(Math.max(0, (ar-1)*(ar-1) - dy*dy)));
          if (dx > dx2) { ctx.fillRect(x-dx, y+dy, dx-dx2, 1); ctx.fillRect(x+dx2, y+dy, dx-dx2, 1); }
        }
      }
      // Dark portal interior
      for (let dy = -(rr-2); dy <= rr-2; dy++) {
        const dx = Math.round(Math.sqrt(Math.max(0, (rr-2)*(rr-2) - dy*dy)));
        ctx.fillStyle = '#010008';
        ctx.fillRect(x-dx, y+dy, dx*2, 1);
      }
      // Ring layers
      const RC = ['#004422','#007744','#00BB66','#00EE88','#BBFFDD'];
      RC.forEach((col, li) => {
        const lr = rr - li;
        if (lr <= 0) return;
        ctx.fillStyle = col;
        for (let dy = -lr; dy <= lr; dy++) {
          const dx  = Math.round(Math.sqrt(Math.max(0, lr*lr - dy*dy)));
          const dx2 = Math.round(Math.sqrt(Math.max(0, (lr-1)*(lr-1) - dy*dy)));
          if (dx > dx2) { ctx.fillRect(x-dx, y+dy, dx-dx2, 1); ctx.fillRect(x+dx2, y+dy, dx-dx2, 1); }
        }
      });
      // Rotating star dots inside portal
      for (let si = 0; si < 5; si++) {
        const ang = t * 0.4 + si * (Math.PI*2/5) + ph;
        ctx.fillStyle = '#88FFCC';
        ctx.fillRect(Math.round(x + Math.cos(ang)*rr*0.44), Math.round(y + Math.sin(ang)*rr*0.44), 1, 1);
      }
      // Cross glow at center
      const cl = Math.round(rr * 0.48);
      ctx.fillStyle = 'rgba(180,255,220,0.65)';
      ctx.fillRect(x-cl, y, cl*2, 1); ctx.fillRect(x, y-cl, 1, cl*2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x-1, y-1, 3, 3);
    });
  }

  // ── Ultra Space: rainbow iridescent road ────────────
  _ultraPath(ctx) {
    const phzHW  = Math.round(PATH_HW_WORLD * (Z_NEAR / Z_FAR) * SF);
    const pbotHW = Math.round(PATH_HW_WORLD * SF);
    const COLS = ['#FF0055','#FF7700','#FFEE00','#00FF88','#00AAFF','#CC00FF','#FF00BB'];
    for (let y = HY; y < VH; y++) {
      const tv = (y - HY) / (VH - HY);
      const hw = Math.round(phzHW + tv * (pbotHW - phzHW));
      const raw  = (tv * COLS.length + this.animTime * 0.7) % COLS.length;
      const ci   = ((raw % COLS.length) + COLS.length) % COLS.length;
      const ci0  = Math.floor(ci);
      const ci1  = (ci0 + 1) % COLS.length;
      ctx.fillStyle = lerpColor(COLS[ci0], COLS[ci1], ci - ci0);
      ctx.fillRect(Math.round(CX - hw), y, hw * 2, 1);
    }
    // Shimmer stripe
    for (let y = HY; y < VH; y += 4) {
      const tv = (y - HY) / (VH - HY);
      const hw = Math.round((phzHW + tv*(pbotHW - phzHW)) * 0.32);
      ctx.fillStyle = 'rgba(255,255,255,0.20)';
      ctx.fillRect(Math.round(CX - hw), y, hw*2, 1);
    }
  }

  renderParticles(ctx) {
    if (this.particles) this.particles.render(ctx);
  }

  _computeTheme(seasonName, todName) {
    const base = SEASON[seasonName] || SEASON.summer;
    return base.fixed ? { ...base } : applyTOD(base, todName);
  }

  changeSeason(seasonName, todName) {
    const tod  = todName !== undefined ? todName : this._todName;
    const next = this._computeTheme(seasonName, tod);
    this._prevTheme = this._getTheme();
    this._fadeT = 0;
    this._pendingParticle = next.particle;
    this._baseSeason = seasonName;
    this._todName    = tod;
    this.theme = next;
    this.flowers.forEach(f => { f.col = this._flowerCol(seasonName); });
  }

  changeTOD(todName) {
    const next = this._computeTheme(this._baseSeason, todName);
    this._prevTheme = this._getTheme();
    this._fadeT = 0;
    this._pendingParticle = next.particle;
    this._todName = todName;
    this.theme = next;
  }

  _sky(ctx) {
    const th = this._getTheme();
    ctx.fillStyle = th.skyTop;
    ctx.fillRect(0, 0, VW, HY);
    ctx.fillStyle = th.skyHor;
    ctx.fillRect(0, HY - 14, VW, 14);

    // Clouds
    this.clouds.forEach(c => {
      const cx2 = ((c.x - this.cloudDrift * 0.8) % (VW + c.w + 10) + VW + c.w + 10) % (VW + c.w + 10) - c.w;
      this._cloud(ctx, cx2, c.y, c.w, c.h, th.cloud);
    });
  }

  _cloud(ctx, cx, cy, w, h, col) {
    const p = (rx, ry, rw, rh) => { ctx.fillStyle = col; ctx.fillRect(Math.round(cx+rx), Math.round(cy+ry), rw, rh); };
    const sh = col === '#FFFFFF' ? '#E8EEF4' : darkenColor(col, 0.65);
    ctx.fillStyle = sh;
    ctx.fillRect(Math.round(cx + w*0.12), Math.round(cy + h*0.4), Math.round(w*0.75), Math.round(h*0.6));
    p(0,        h*0.12, w*0.36, h*0.72);
    p(w*0.22,   0,      w*0.52, h*0.88);
    p(w*0.62,   h*0.18, w*0.38, h*0.65);
    p(w*0.1,    h*0.2,  w*0.18, h*0.52);
    p(w*0.28,   h*0.04, w*0.36, h*0.35);
  }

  _mountains(ctx) {
    const th = this._getTheme();
    const mts = [
      { cx: 40,  py: 44, w: 78  },
      { cx: 108, py: 38, w: 98  },
      { cx: 198, py: 41, w: 84  },
      { cx: 268, py: 35, w: 108 },
      { cx: 348, py: 40, w: 88  },
    ];
    const off = (this.scroll * 0.28) % 380;
    mts.forEach(m => {
      const mx = ((m.cx - off) % 380 + 380) % 380 - 40;
      const rows = HY - m.py;
      ctx.fillStyle = th.mtnShd;
      for (let r = 0; r < rows; r++) {
        const hw = Math.round((r / rows) * m.w / 2);
        ctx.fillRect(Math.round(mx), m.py + r, hw, 1);
      }
      ctx.fillStyle = th.mtnMain;
      for (let r = 0; r < rows; r++) {
        const hw = Math.round((r / rows) * m.w / 2);
        ctx.fillRect(Math.round(mx - hw), m.py + r, hw * 2, 1);
      }
      ctx.fillStyle = th.mtnSnow;
      for (let r = 0; r < Math.min(10, rows); r++) {
        const hw = Math.round((r / rows) * m.w / 2);
        ctx.fillRect(Math.round(mx - hw + 1), m.py + r, Math.max(0, hw*2-2), 1);
      }
    });
  }

  _ground(ctx) {
    const th = this._getTheme();
    const phzHW  = Math.round(PATH_HW_WORLD * (Z_NEAR / Z_FAR) * SF);
    const pbotHW = Math.round(PATH_HW_WORLD * SF);

    ctx.fillStyle = th.grass;
    ctx.beginPath(); ctx.moveTo(0, HY); ctx.lineTo(CX - phzHW, HY);
    ctx.lineTo(CX - pbotHW, VH); ctx.lineTo(0, VH); ctx.closePath(); ctx.fill();

    ctx.beginPath(); ctx.moveTo(CX + phzHW, HY); ctx.lineTo(VW, HY);
    ctx.lineTo(VW, VH); ctx.lineTo(CX + pbotHW, VH); ctx.closePath(); ctx.fill();

    // Grass stripes
    ctx.fillStyle = th.grassD;
    for (let Z = Z_NEAR + 1; Z < Z_FAR; Z += 3) {
      const pos = wToS(0, Z);
      if (pos.sy < HY || pos.sy > VH) continue;
      const hw = Math.round(PATH_HW_WORLD * pos.t * SF);
      ctx.fillRect(0, pos.sy, Math.max(0, CX - hw), 1);
      ctx.fillRect(CX + hw, pos.sy, Math.max(0, VW - CX - hw), 1);
    }
  }

  _path(ctx) {
    const th = this._getTheme();
    const phzHW  = Math.round(PATH_HW_WORLD * (Z_NEAR / Z_FAR) * SF);
    const pbotHW = Math.round(PATH_HW_WORLD * SF);

    ctx.fillStyle = th.path;
    ctx.beginPath(); ctx.moveTo(CX - phzHW, HY); ctx.lineTo(CX + phzHW, HY);
    ctx.lineTo(CX + pbotHW, VH); ctx.lineTo(CX - pbotHW, VH); ctx.closePath(); ctx.fill();

    ctx.fillStyle = th.pathLine;
    for (let Z = Z_NEAR + 0.5; Z < Z_FAR; Z += 2) {
      const pos = wToS(0, Z);
      if (pos.sy < HY || pos.sy > VH) continue;
      const hw = Math.round(PATH_HW_WORLD * pos.t * SF);
      ctx.fillRect(CX - hw, pos.sy, hw * 2, 1);
    }

    ctx.strokeStyle = th.grassD;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CX - phzHW, HY); ctx.lineTo(CX - pbotHW, VH);
    ctx.moveTo(CX + phzHW, HY); ctx.lineTo(CX + pbotHW, VH);
    ctx.stroke();
  }

  _pathLines(ctx) {
    ctx.fillStyle = this._getTheme().pathLine;
    const dashZ = 2.8;
    const off = this.scroll % dashZ;
    for (let Z = Z_NEAR + 0.3 + off; Z < Z_FAR - 1; Z += dashZ) {
      const pos = wToS(0, Z);
      if (pos.sy < HY || pos.sy > VH - 2) continue;
      const hw = Math.max(1, Math.round(5 * pos.t));
      const h  = Math.max(1, Math.round(3 * pos.t));
      ctx.fillRect(pos.sx - hw, pos.sy, hw * 2, h);
    }
  }

  _flower(ctx, f) {
    const { sx, sy, t } = wToS(f.wx, f.Z);
    if (t < 0.06 || sy < HY) return;
    const sz = Math.max(1, Math.round(2 * t));
    ctx.fillStyle = f.col;
    ctx.fillRect(sx, sy, sz, sz);
  }

  _tree(ctx, tr) {
    const pos = wToS(tr.wx, tr.Z);
    if (pos.t < 0.06 || pos.sy < HY) return;
    const s = pos.t, bx = pos.sx, by = pos.sy;
    const trW = Math.max(1, Math.round(4 * s)), trH = Math.max(1, Math.round(12 * s));
    const topW = Math.max(2, Math.round(26 * s)), topH = Math.max(2, Math.round(22 * s));
    const th = this._getTheme();

    if (s > 0.2) {
      ctx.fillStyle = 'rgba(0,50,0,0.15)';
      ctx.fillRect(bx - Math.round(topW*0.55), by - 1, Math.round(topW*1.1), 2);
    }

    ctx.fillStyle = '#6D4C26';
    ctx.fillRect(bx - Math.ceil(trW/2), by - trH, trW, trH);

    const tx = bx - Math.round(topW/2);
    const ty = by - trH - topH;
    const profile = [0.38, 0.62, 0.80, 0.92, 0.99, 1.00, 0.99, 0.95, 0.88, 0.78, 0.62, 0.42];
    const rowH = Math.max(1, Math.round(topH / profile.length));

    profile.forEach((frac, i) => {
      const rw = Math.max(1, Math.round(topW * frac));
      const rx = bx - Math.round(rw / 2);
      const ry = ty + i * rowH;
      const p = i / profile.length;
      ctx.fillStyle = p < 0.25 ? th.treeLight : p > 0.70 ? th.treeDark : th.treeMid;
      ctx.fillRect(rx, ry, rw, rowH + 1);
    });

    if (s > 0.15) {
      ctx.fillStyle = th.treeLight;
      ctx.fillRect(bx - Math.round(topW*0.24), ty + Math.round(topH*0.1),
                   Math.max(1, Math.round(topW*0.26)), Math.max(1, Math.round(topH*0.26)));
    }
  }
}

// ── Trainer ───────────────────────────────────────────
class Trainer {
  constructor() {
    this.frame   = 0;
    this.clock   = 0;
    this.fps     = 8;
    this.paused  = false;
    this.exclaim = false;
    this.exTimer = 0;
    this._cell   = 64;
    this._row    = 3;

    this._img   = new Image();
    this._ready = false;
    this._img.onload  = () => { this._ready = true; };
    this._img.onerror = () => { this._ready = false; };
    this._img.src = '/static/assets/trainer_sheet.png';
  }

  setSkin(src, cell = 64, row = 3) {
    if (this._img.src.endsWith(src)) return; // already loaded
    this._cell  = cell;
    this._row   = row;
    this._ready = false;
    this._img   = new Image();
    this._img.onload  = () => { this._ready = true; };
    this._img.onerror = () => { this._ready = false; };
    this._img.src = src;
  }

  showExclaim() { this.exclaim = true; this.exTimer = 0.75; }

  update(dt) {
    this.clock += dt;
    if (!this.paused) this.frame = Math.floor(this.clock * this.fps) % 4;
    if (this.exclaim) { this.exTimer -= dt; if (this.exTimer <= 0) this.exclaim = false; }
  }

  render(ctx) {
    const bx = CX, by = VH - 2;
    ctx.imageSmoothingEnabled = false;

    if (this._ready) {
      const C    = this._cell;
      const srcX = this.frame * C;
      const srcY = this._row  * C;
      const dW = 48, dH = 48;
      ctx.drawImage(this._img, srcX, srcY, C, C,
                    Math.round(bx - dW / 2), Math.round(by - dH + 4), dW, dH);
    } else {
      this._fallback(ctx, bx, by, this.frame);
    }

    if (this.exclaim) this._exclaim(ctx, bx, by - 50);
  }

  // Fallback hand-drawn sprite (kept in case image fails)
  _fallback(ctx, bx, by, f) {
    const p = (rx, ry, rw, rh, c) => {
      ctx.fillStyle = c; ctx.fillRect(Math.round(bx-6+rx), Math.round(by-22+ry), rw, rh);
    };
    p(2,0,8,2,'#2A1A0A'); p(1,2,10,3,'#3D2B1A'); p(5,6,2,1,'#F5CBA7');
    p(1,7,10,7,'#0044BB'); p(5,7,2,7,'#0033AA');
    if (f===1){p(-1,6,2,6,'#0044BB');p(11,8,2,6,'#0044BB');}
    else if(f===3){p(-1,8,2,6,'#0044BB');p(11,6,2,6,'#0044BB');}
    else{p(-1,7,2,6,'#0044BB');p(11,7,2,6,'#0044BB');}
    p(-1,12,1,2,'#F5CBA7'); p(12,12,1,2,'#F5CBA7');
    p(2,14,8,1,'#8B4513'); p(5,14,2,1,'#FFD700');
    p(2,15,8,5,'#222244');
    if(f===1){p(2,15,4,7,'#222244');p(6,16,4,5,'#222244');}
    else if(f===3){p(2,16,4,5,'#222244');p(6,15,4,7,'#222244');}
    else{p(2,15,4,6,'#222244');p(6,15,4,6,'#222244');}
    if(f===1){p(1,20,5,2,'#4A3728');p(5,19,4,2,'#4A3728');}
    else if(f===3){p(2,19,4,2,'#4A3728');p(6,20,5,2,'#4A3728');}
    else{p(2,20,4,2,'#4A3728');p(6,20,4,2,'#4A3728');}
  }

  _exclaim(ctx, bx, by) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(bx - 7, by - 14, 14, 18);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
    ctx.strokeRect(bx - 7, by - 14, 14, 18);
    ctx.fillStyle = '#CC2200';
    ctx.fillRect(bx - 1, by - 11, 2, 7);
    ctx.fillRect(bx - 1, by - 2,  2, 2);
  }
}

// ── Encounter flash ───────────────────────────────────
class EncounterEffect {
  constructor(onDone, skipAnim = false) {
    this.dur = skipAnim ? 0.15 : 0.85;
    this.t = 0; this.done = false; this.onDone = onDone;
    this.skipAnim = skipAnim;
  }
  update(dt) {
    this.t += dt;
    if (!this.done && this.t >= this.dur) { this.done = true; this.onDone(); }
  }
  renderCanvas(ctx) {
    if (this.skipAnim) return;
    const p = Math.min(this.t / this.dur, 1);
    const flash = (Math.sin(p * Math.PI * 4.5) * 0.5 + 0.5) * (1 - p);
    ctx.fillStyle = `rgba(255,255,255,${flash})`;
    ctx.fillRect(0, 0, VW, VH);
  }
}

// ── Game ─────────────────────────────────────────────
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx    = this.canvas.getContext('2d');
    this.canvas.width = VW; this.canvas.height = VH;
    this.ctx.imageSmoothingEnabled = false;

    // Season chosen at game start
    this.seasonName = 'summer';
    this.terrain    = null;
    this.trainer    = new Trainer();
    this.fx         = null;

    this.state = 'IDLE';
    this.score = 0; this.streak = 0; this.bestStreak = 0;
    this.correct = 0; this.total = 0;
    this.results = [];
    this.lives = 0; this.maxLives = 0; this._livesDepleted = false;
    this.queue = []; this.qIdx = 0; this.currentPokemon = null;
    this.runTimer = 0; this.answerTimer = 0;
    this.settings = { mode: 'name_from_image', answer: 'mc', sprite_type: 'still', timer: 0, lives: 0, gen: 'all', order: 'random', count: 10, season: 'seasonal', type_filter: 'all', trainer_src: '/static/assets/trainer_sheet.png', trainer_cell: 64, trainer_row: 3 };

    // Seasonal day/night cycle
    this._seasonIdx    = 0;
    this._todIdx       = 0;
    this._seasonCount  = 0;
    this._seasonTarget = 3 + Math.floor(Math.random() * 3);

    this._raf = null; this._last = null;
  }

  configure(s) { Object.assign(this.settings, s); }

  async loadQueue() {
    const s = this.settings.season;
    const isSeasonal = (s === 'seasonal');
    if (isSeasonal) {
      this._seasonIdx = Math.floor(Math.random() * SEASONS.length);
      this._todIdx    = 0;
      this.seasonName = SEASONS[this._seasonIdx];
    } else {
      this.seasonName = s || 'summer';
    }
    this.terrain = new Terrain(this.seasonName, isSeasonal ? TOD_ORDER[0] : 'day');
    this.trainer.setSkin(this.settings.trainer_src, this.settings.trainer_cell, this.settings.trainer_row);

    const el = document.getElementById('seasonLabel');
    if (el) {
      el.textContent = isSeasonal
        ? `${this.seasonName.toUpperCase()} · ${TOD_ORDER[0].toUpperCase()}`
        : this.seasonName.toUpperCase();
      el.classList.remove('hidden');
    }

    this.queue = this.settings.fixedQueue
      ? [...this.settings.fixedQueue]
      : await API.getQueue(
          this.settings.gen, this.settings.order,
          this.settings.count, this.settings.type_filter
        );
    this.qIdx = 0;
  }

  start() {
    this.state = 'RUNNING';
    this.runTimer = window.FAST_MODE ? (0.5 + Math.random() * 0.4) : (2.5 + Math.random() * 1.5);
    if (!this._raf) this._raf = requestAnimationFrame(ts => this._loop(ts));
  }

  stop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null; this._last = null;
  }

  pause() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null; this._last = null;
    // Pause CSS quiz timer if active
    const fill = document.getElementById('quizTimerFill');
    if (fill) fill.style.animationPlayState = 'paused';
  }

  resume() {
    const fill = document.getElementById('quizTimerFill');
    if (fill) fill.style.animationPlayState = 'running';
    if (!this._raf) this._raf = requestAnimationFrame(ts => this._loop(ts));
  }

  _loop(ts) {
    const dt = this._last ? Math.min((ts - this._last) / 1000, 0.1) : 0;
    this._last = ts;
    this._update(dt);
    this._render();
    this._raf = requestAnimationFrame(t => this._loop(t));
  }

  _update(dt) {
    if (!this.terrain) return;
    switch (this.state) {
      case 'RUNNING':
        this.terrain.update(dt);
        this.trainer.update(dt);
        this.runTimer -= dt;
        if (this.runTimer <= 0) this._triggerEncounter();
        break;
      case 'ENCOUNTER':
        this.terrain.update(dt, 0.08);
        this.trainer.update(dt);
        if (this.fx) this.fx.update(dt);
        break;
      case 'QUIZ':
        this.trainer.paused = true;
        this.trainer.update(dt);
        break;
      case 'ANSWER':
        this.terrain.update(dt, 0.3);
        this.trainer.paused = false;
        this.trainer.update(dt);
        this.answerTimer -= dt;
        if (this.answerTimer <= 0) this._nextQuestion();
        break;
    }
  }

  _render() {
    if (!this.terrain) return;
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.clearRect(0, 0, VW, VH);
    this.terrain.render(this.ctx);
    this.trainer.render(this.ctx);
    if (this.state === 'ENCOUNTER' && this.fx) this.fx.renderCanvas(this.ctx);
    // Particles render on top (snow in front of trainer, etc.)
    this.terrain.renderParticles(this.ctx);
  }

  _triggerEncounter() {
    if (this.qIdx >= this.queue.length) { this._endGame(); return; }

    // Seasonal: cycle through time of day, then advance season
    if (this.settings.season === 'seasonal' && this.terrain) {
      this._seasonCount++;
      if (this._seasonCount >= this._seasonTarget) {
        this._seasonCount  = 0;
        this._seasonTarget = 3 + Math.floor(Math.random() * 3);

        // Advance TOD; wrap → next season
        this._todIdx = (this._todIdx + 1) % TOD_ORDER.length;
        if (this._todIdx === 0) {
          this._seasonIdx = (this._seasonIdx + 1) % SEASONS.length;
          this.seasonName = SEASONS[this._seasonIdx];
        }

        const todName = TOD_ORDER[this._todIdx];
        this.terrain.changeSeason(this.seasonName, todName);
        const el = document.getElementById('seasonLabel');
        if (el) {
          el.textContent = `${this.seasonName.toUpperCase()} · ${todName.toUpperCase()}`;
          el.classList.remove('hidden');
        }
      }
    }


    this.state = 'ENCOUNTER';
    this.trainer.paused = true;
    this.trainer.showExclaim();

    const flash = document.getElementById('encFlash');
    const reducedMotion = window.REDUCED_MOTION;
    if (!reducedMotion) {
      flash.classList.remove('hidden', 'flashing');
      void flash.offsetWidth;
      flash.classList.add('flashing');
    }

    this.fx = new EncounterEffect(() => {
      flash.classList.add('hidden');
      this.state = 'QUIZ';
      this._showQuiz();
    }, reducedMotion);
  }

  async _showQuiz() {
    const pid = this.queue[this.qIdx];
    try {
      const [pokemon, choiceData] = await Promise.all([
        API.getPokemon(pid),
        API.getChoices(pid, this.settings.gen, this.settings.type_filter),
      ]);
      this.currentPokemon = pokemon;
      const answerMode = this.settings.answer === 'mixed'
        ? ['mc', 'typed', 'true_false'][Math.floor(Math.random() * 3)]
        : this.settings.answer;

      let tfName = null, tfCorrect = false;
      if (answerMode === 'true_false') {
        tfCorrect = Math.random() < 0.5;
        if (tfCorrect) {
          tfName = pokemon.name;
        } else {
          const wrong = choiceData.choices.find(c => c.id !== pokemon.id);
          tfName = wrong ? wrong.name : pokemon.name;
          tfCorrect = tfName === pokemon.name;
        }
      }

      document.dispatchEvent(new CustomEvent('showQuiz', {
        detail: {
          pokemon,
          choices:     choiceData.choices,
          mode:        this.settings.mode,
          answer:      answerMode,
          sprite_type: this.settings.sprite_type,
          timer:       this.settings.timer,
          theme:       this.terrain ? this.terrain._getTheme() : null,
          tfName,
          tfCorrect,
        },
      }));
      this._updateHUD();
    } catch (e) { console.error(e); this._nextQuestion(); }
  }

  applyHintCost(cost) {
    this.score = Math.max(0, this.score - cost);
    this._updateHUD();
    this._showScorePop(-cost, 0);
  }

  submitAnswer(correct) {
    this.total++;
    this.results.push({ pokemon: this.currentPokemon, correct });
    if (correct) {
      this.correct++;
      const pts = 100 + this.streak * 20;
      this.score += pts;
      this.streak++;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      this._showScorePop(pts, this.streak);
    } else {
      this.streak = 0;
      if (this.maxLives > 0) {
        this.lives = Math.max(0, this.lives - 1);
        this._updateLivesHUD(true);
        if (this.lives === 0) this._livesDepleted = true;
      }
    }
    this._updateHUD();
    this.state = 'ANSWER';
    this.answerTimer = window.FAST_MODE ? 0.8 : 2.5;
  }

  _updateLivesHUD(animateLoss = false) {
    const container = document.getElementById('livesHud');
    if (!container) return;

    if (this.maxLives <= 0) { container.innerHTML = ''; return; }

    // Rebuild balls
    const balls = container.querySelectorAll('.life-ball');
    if (balls.length !== this.maxLives) {
      // Build fresh
      container.innerHTML = '';
      for (let i = 0; i < this.maxLives; i++) {
        const b = document.createElement('div');
        b.className = 'life-ball' + (i >= this.lives ? ' lost' : '');
        container.appendChild(b);
      }
      return;
    }

    // Update existing balls
    balls.forEach((b, i) => {
      const shouldBeLost = i >= this.lives;
      if (shouldBeLost && !b.classList.contains('lost')) {
        if (animateLoss) {
          b.classList.add('losing');
          b.addEventListener('animationend', () => {
            b.classList.remove('losing');
            b.classList.add('lost');
          }, { once: true });
        } else {
          b.classList.add('lost');
        }
      }
    });
  }

  _showScorePop(pts, streak) {
    const el = document.createElement('div');
    el.className = 'score-pop';
    if (pts < 0) {
      el.textContent = `${pts} HINT`;
      el.style.color = '#ff8800';
    } else {
      el.textContent = streak >= 2 ? `+${pts}  x${streak} STREAK` : `+${pts}`;
    }
    el.style.cssText += ';left:50%;bottom:42%;transform:translateX(-50%)';
    document.getElementById('gameWrap').appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  _nextQuestion() {
    this.qIdx++;
    document.dispatchEvent(new CustomEvent('hideQuiz'));
    this.trainer.paused = false;
    const el = document.getElementById('seasonLabel');
    if (el) el.classList.add('hidden');

    if (this._livesDepleted || this.qIdx >= this.queue.length) {
      this._livesDepleted = false;
      this._endGame();
    } else {
      this.state = 'RUNNING';
      this.runTimer = window.FAST_MODE ? (0.4 + Math.random() * 0.3) : (2.0 + Math.random() * 2.0);
    }
  }

  _endGame() {
    this.state = 'DONE';
    document.dispatchEvent(new CustomEvent('gameOver', {
      detail: {
        score: this.score, correct: this.correct,
        total: this.total, bestStreak: this.bestStreak,
        results: this.results,
      },
    }));
  }

  _updateHUD() {
    const total = this.queue.length > 0 ? this.queue.length : (this.settings.count > 0 ? this.settings.count : '?');
    document.getElementById('hudScore').textContent   = `SCORE  ${this.score}`;
    document.getElementById('hudStreak').textContent  = `STREAK  ${this.streak}`;
    document.getElementById('hudProg').textContent    = `${this.qIdx} / ${total}`;
  }

  reset() {
    this.score = 0; this.streak = 0; this.bestStreak = 0;
    this.correct = 0; this.total = 0; this.qIdx = 0;
    this.results = [];
    this.maxLives = parseInt(this.settings.lives) || 0;
    this.lives = this.maxLives;
    this._livesDepleted = false;
    this.queue = []; this.currentPokemon = null;
    this.state = 'IDLE'; this.terrain = null;
    this.trainer.paused = false; this.trainer.frame = 0;
    this._seasonCount  = 0;
    this._seasonTarget = 3 + Math.floor(Math.random() * 3);
    this._updateHUD();
    this._updateLivesHUD();
  }
}

let game = null;

async function initGame(settings) {
  if (game) game.stop();
  game = new Game();
  game.configure(settings);
  game.reset();
  await game.loadQueue();
  game.start();
  game._updateHUD();
}
