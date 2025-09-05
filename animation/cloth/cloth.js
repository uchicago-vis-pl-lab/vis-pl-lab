'use strict';

//// PARAMETERS

const PHYSICS = {
  cols: 26,
  rows: 26,
  substeps: 4,         // physics substeps per frame
  mass: 1.0,           // node mass (unitless)
  damp: 0.992,         // global velocity damping (Verlet)
  iterSoft: 4,         // soft projection passes per substep
  grav: 0.04,          // downward accel
};

const FONT = {
  font: "monospace",
  fraction: 0.9,   // char size = spacing * this
  text: ['-', '|', '/', '\\', 'x', '+', 'o', '.', ':'],
};

const SPRING = {
  struct: {     // structural (hori/vert) coefficient
    ks: 0.0015,
    kd: 0.0012,
  },
  shear: {     // diagonal coefficient
    ks: 0.0010,
    kd: 0.008,
  },
  maxStretch: 1.05, // spring stretch cap (ratio)
};

const WIND = {
  base: 0.020,      // base wind magnitude
  variation: 0.008, // magnitude variation band
  drift: 0.05,      // direction drift rate (rad/s)
  gust: {
    prob: 0.10,     // chance to start a gust each frame
    peak: {
      min: 0.04,
      max: 0.16,
    },
    rise: 0.5,     // seconds
    fall: 2.6      // seconds
  },
  turb: {
    amp: 0.035,     // turbulence strength
    scale: 0.004,  // frequency for turbulence
  },
  damp: 0.02       // velocity bleed after projection
};

/// UTILITY

// ensure x is in [a, b]
function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

function randomIn(a, b) {
  return a + Math.random() * (b - a);
}

function genChar(i) {
  // return FONT.text[(Math.random() * FONT.text.length)|0];
  console.log(i % 10);
  return (i % 10).toString();
}

const canvas = document.getElementById('the-canvas');
const ctx = canvas.getContext('2d');

function resize() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  canvas.width  = Math.round(rect.width  * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

class Pos {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  take(pos) {
    this.x = pos.x;
    this.y = pos.y;
  }
}

class Point {
  constructor(pos, prev, pin, chr, expo) {
    this.curr = pos;  // {x,y}
    this.prev = prev; // {x,y}
    this.pin  = pin;  // bool
    this.chr  = chr;  // string
    this.expo = expo; // number between [0,1]
  }
}

class Spring {
  constructor(from, to, restlen, ks, kd) {
    this.from = from;
    this.to   = to;
    this.restlen = restlen;
    this.ks      = ks;
    this.kd      = kd;
  }
}

class State {
  constructor(origin, points, springs, spacing, squareSize, wind, gust) {
    this.origin = origin;
    this.points = points;
    this.springs = springs;
    this.spacing = spacing;
    this.squareSize = squareSize;
    this.debug = true;
    this.wind = wind; // {dir: pos, mag: float}
    this.gust = gust; // {active: bool, t: int, peak: float}
  }

  static id(r, c) {
    return r * PHYSICS.cols + c;
  }

  updateWind(dt, now) {
    // direction drift
    const heading = Math.PI * Math.sin(now * WIND.drift);
    const dir = new Pos(Math.cos(heading), Math.sin(heading));
    this.wind.dir.x += 0.02 * (dir.x - this.wind.dir.x);
    this.wind.dir.y += 0.02 * (dir.y - this.wind.dir.y);

    // maginitude variation
    const variation = WIND.variation * Math.sin(now * 0.08);

    // check gust
    if (!this.gust.active && Math.random() < WIND.gust.prob) {
      this.gust.active = true;
      this.gust.t = 0;
      this.gust.peak = randomIn(WIND.gust.peak.min, WIND.gust.peak.max);
    }

    // calculate gust
    let gust = 0;
    if (this.gust.active) {
      this.gust.t += dt;
      if (this.gust.t <= WIND.gust.rise) {
        gust = this.gust.peak * (this.gust.t / WIND.gust.rise);
      } else {
        // exponential attenuation
        gust = this.gust.peak * Math.exp(-(this.gust.t - WIND.gust.rise)/WIND.gust.fall);
      }
      if (this.gust.t > WIND.gust.rise + 6 * WIND.gust.fall) {
        this.gust.active = false;
      }
    }
    const mag = Math.max(0, WIND.base + variation + gust);
    this.wind.mag += 0.05 * (mag - this.wind.mag);
  }

  stepPhysics(dt, now) {
    // accelerations
    const ax = new Float32Array(this.points.length);
    const ay = new Float32Array(this.points.length);

    // calculate wind forces
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      // wind forces
      const wx = this.wind.dir.x * this.wind.mag * (0.6 + 0.4 * p.expo);
      const wy = this.wind.dir.y * this.wind.mag * (0.6 + 0.4 * p.expo);

      // turbulence forces
      const turb = State.curlNoise(p.curr.x, p.curr.y, now);
      const tx = turb.x * WIND.turb.amp * (0.5 + 0.5 * p.expo);
      const ty = turb.y * WIND.turb.amp * (0.5 + 0.5 * p.expo);

      ax[i] = wx + tx;
      ay[i] = wy + ty + PHYSICS.grav;
    }

    // calculate spring forces
    for (const s of this.springs) {
      const from = this.points[s.from], to = this.points[s.to];
      const dx = to.curr.x - from.curr.x, dy = to.curr.y - from.curr.y;
      const dist = Math.hypot(dx, dy) || 1e-6;
      const normx = dx / dist, normy = dy / dist;
      const stretch = dist - s.restlen;

      // velocities
      const vfx = from.curr.x - from.prev.x, vfy = from.curr.y - from.prev.y;
      const vtx = to.curr.x - to.prev.x, vty = to.curr.y - to.prev.y;
      const vrel = (vtx - vfx) * normx + (vty - vfy) * normy;
      const f = s.ks * stretch + s.kd * vrel;
      const fx = f * normx, fy = f * normy;
      ax[s.from] += fx / PHYSICS.mass;
      ay[s.from] += fx / PHYSICS.mass;
      ax[s.to]   += -fx / PHYSICS.mass;
      ay[s.to]   += -fy / PHYSICS.mass;
    }

    // integrate
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      if (p.pin) {
        p.prev.take(p.curr);
        continue;
      }
      const vx = (p.curr.x - p.prev.x) * PHYSICS.damp;
      const vy = (p.curr.y - p.prev.y) * PHYSICS.damp;
      const nx = p.curr.x + vx + ax[i]; // Verlet integration
      const ny = p.curr.y + vy + ay[i];
      p.prev.take(p.curr);
      p.curr.x = nx;
      p.curr.y = ny;
      if (isNaN(p.curr.x) || isNaN(p.curr.y)) {
        throw Error("nan");
      }
    }

    // stretch guard, prevent springs from being over-stretched
    for (let it = 0; it < PHYSICS.iterSoft; it++) {
      for (const s of this.springs) {
        const from = this.points[s.from], to = this.points[s.to];
        const dx = to.curr.x - from.curr.x, dy = to.curr.y - from.curr.y;
        const d = Math.hypot(dx, dy) || 1e-6;
        const limit = s.restlen * SPRING.maxStretch;
        if (d <= limit) {
          continue;
        }
        const nx = dx / d, ny = dy / d;
        const excess = d - limit;
        const cx = nx * (excess * 0.5);
        const cy = ny * (excess * 0.5);
        if (!from.pin) {
          from.curr.x += cx;
          from.curr.y += cy;
        }
        if (!to.pin) {
          to.curr.x -= cx;
          to.curr.y -= cy;
        }
      }
    }
  }

  draw() {
    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // font
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${(this.spacing * FONT.fraction).toFixed(2)}px ${FONT.font}`;
    ctx.fillStyle = '#fff';

    // characters
    for (let r = 0; r < PHYSICS.rows; r++) {
      for (let c = 0; c < PHYSICS.cols; c++) {
        const n = this.points[State.id(r, c)];
        const x = (n.curr.x), y = (n.curr.y);
        ctx.fillText(n.chr, x, y);
      }
    }

    if (this.debug) {
      drawArrow(this.wind.dir, this.wind.mag);
    }
  }

  // Bridson et al. "Curl-Noise for Procedural Fluid Flow" ToG 2007.
  // v = (∂φ/∂y, -∂φ/∂x)
  static curlNoise(x, y, t) {
    const s = WIND.turb.scale; // spatial scale
    const w = 0.9;             // temporal frequency multiplier
    const eps = 1e-3;          // finite-difference step

    const sx = x * s, sy = y * s, sz = t * w;
    // ∂φ/∂x
    const dphdx = (perlin3(sx + eps, sy, sz) - perlin3(sx - eps, sy, sz)) / (2 * eps);
    // ∂φ/∂y
    const dphdy = (perlin3(sx, sy + eps, sz) - perlin3(sx, sy - eps, sz)) / (2 * eps);

    // ∂/∂x = s * ∂/∂(sx)
    const ddx = s * dphdx;
    const ddy = s * dphdy;

    return new Pos(ddy, -ddx); // perpendicular
  }
}

// Perlin noise
const _perm = (() => {
  const p = new Uint8Array(512);
  const base = new Uint8Array([
    151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
    190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,
    20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,
    230,220,105,92,41,55,46,245,40,244,102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,
    18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,5,202,
    38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,
    2,44,154,163, 70,221,153,101,155,167, 43,172, 9,129,22,39,253, 19,98,108,110,79,113,224,232,178,185,
    112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
    49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254
  ]);
  for (let i=0;i<512;i++) {
    p[i] = base[i & 255];
  }
  return p;
})();

function perlin3(x, y, z) {
  function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function lerp(a,b,t) {
    return a + t * (b - a);
  }

  function grad(h, x, y, z) {
    // hashed gradient on cube corners
    const m = h & 15;
    const u = m<8 ? x : y;
    const v = m<4 ? y : m===12||m===14 ? x : z;
    return ((m&1)?-u:u) + ((m&2)?-v:v);
  }

// unit cube corners
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);

  const u = fade(x), v = fade(y), w = fade(z);

  const A = _perm[X] + Y, AA = _perm[A] + Z, AB = _perm[A + 1] + Z;
  const B = _perm[X + 1] + Y, BA = _perm[B] + Z, BB = _perm[B + 1] + Z;

  const gAA = grad(_perm[AA], x, y, z);
  const gBA = grad(_perm[BA], x-1, y, z);
  const gAB = grad(_perm[AB], x, y-1, z);
  const gBB = grad(_perm[BB], x-1, y-1, z);
  const gAA1= grad(_perm[AA+1], x, y, z-1);
  const gBA1= grad(_perm[BA+1], x-1, y, z-1);
  const gAB1= grad(_perm[AB+1], x, y-1, z-1);
  const gBB1= grad(_perm[BB+1], x-1, y-1, z-1);

  const x1 = lerp(gAA, gBA, u), x2 = lerp(gAB, gBB, u);
  const y1 = lerp(x1, x2, v);
  const x3 = lerp(gAA1, gBA1, u), x4 = lerp(gAB1, gBB1, u);
  const y2 = lerp(x3, x4, v);

  return lerp(y1, y2, w); // in [-1,1]
}

let state = undefined;

function init() {
  const dpr   = (window.devicePixelRatio || 1);
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  const side = Math.min(width, height)
  const squareSize = side * 0.8;
  const spacing = squareSize / (PHYSICS.cols - 1);
  const origin = new Pos((width - squareSize) * 0.5, (height - squareSize) * 0.5);

  // Calculate exposure of a point to wind. The points closer to the center are
  // more exposed.
  function exposure(x, y) {
    const cx0 = origin.x, cy0 = origin.y;
    const cx1 = origin.x + squareSize, cy1 = origin.y + squareSize;
    const d0 = Math.hypot(x-cx0, y-cy0);
    const d1 = Math.hypot(x-cx1, y-cy0);
    const d2 = Math.hypot(x-cx0, y-cy1);
    const d3 = Math.hypot(x-cx1, y-cy1);
    const dmin = Math.min(d0,d1,d2,d3);
    const dmax = Math.hypot(squareSize, squareSize) / 2;
    return clamp(dmin / dmax, 0, 1);
  }

  const pts = [];
  for (let r = 0; r < PHYSICS.rows; r++) {
    for (let c = 0; c < PHYSICS.cols; c++) {
      const x = origin.x + c * spacing;
      const y = origin.y + r * spacing;
      let pin;
      if ((r === 0 && c === 0)
          || (r === 0 && c === PHYSICS.cols - 1)
          // || (r === PHYSICS.rows - 1 && c === 0)
          // || (r === PHYSICS.rows - 1 && c === PHYSICS.cols - 1)
      ) {
        pin = true;
      } else {
        pin = false;
      }
      const expo = exposure(x, y);
      const i = State.id(r, c);
      pts.push(new Point(new Pos(x,y), new Pos(x,y), pin, genChar(i), expo));
    }
  }

  const springs = [];
  for (let r = 0; r < PHYSICS.rows; r++) {
    for (let c = 0; c < PHYSICS.cols; c++) {
      const to = State.id(r, c);
      if (c > 0) {
        const from = State.id(r, c - 1);
        springs.push(
          new Spring(from, to, spacing, SPRING.struct.ks, SPRING.struct.kd)
        );
      }
      if (r > 0) {
        const from = State.id(r - 1, c);
        springs.push(
          new Spring(from, to, spacing, SPRING.struct.ks, SPRING.struct.kd)
        );
      }
      if (r > 0 && c > 0) {
        const from = State.id(r - 1, c - 1);
        springs.push(
          new Spring(from, to, spacing * Math.SQRT2, SPRING.shear.ks, SPRING.shear.kd)
        );
      }
      if (r > 0 && c < PHYSICS.cols - 1) {
        const from = State.id(r - 1, c + 1);
        springs.push(
          new Spring(from, to, spacing * Math.SQRT2, SPRING.shear.ks, SPRING.shear.kd)
        );
      }
    }
  }

  const wind = { dir: new Pos(1, 0), mag: WIND.base };
  const gust = { active: false, t: 0, peak: 0 };
  state = new State(origin, pts, springs, spacing, squareSize, wind, gust);
  window.requestAnimationFrame(firstFrame);
}

function drawArrow(dir, mag) {
  const x0 = 100, y0 = 100; // corner position (CSS px)
  const ang = Math.atan2(dir.y, dir.x);
  const len = 20 + 500 * mag; // length scales with speed
  ctx.save();
  ctx.translate(x0, y0);
  ctx.rotate(ang);
  ctx.strokeStyle = '#fff';
  ctx.fillStyle = '#fff';
  ctx.lineWidth = 2;
  // shaft
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(len, 0);
  ctx.stroke();
  // head
  ctx.beginPath();
  ctx.moveTo(len, 0);
  ctx.lineTo(len - 8, -4);
  ctx.lineTo(len - 8, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.textBaseline = 'bottom';
  ctx.font = `15px monospace`;
  ctx.fillText(`${(mag * 100).toFixed(2)}`, x0, y0 - 10);
}

let last = undefined;
function firstFrame(timestamp) {
  last = timestamp / 1000;
  state.draw();
  window.requestAnimationFrame(animate);
}

function animate(timestamp) {
  const now = timestamp / 1000;
  let dt = now - last;
  last = now;
  dt = Math.min(dt, 1/30);

  state.updateWind(dt, now);
  const h = dt / PHYSICS.substeps;
  for (let s = 0; s < PHYSICS.substeps; s++) {
    state.stepPhysics(h, now);
  }
  state.draw();
  window.requestAnimationFrame(animate);
}

window.addEventListener("load", () => {resize(); init();});
window.addEventListener('resize', resize);
