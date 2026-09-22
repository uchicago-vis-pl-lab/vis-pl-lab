/* eslint-disable max-depth, max-statements */

const CHIME = {
  count: 5,
  text: 'ting',
  activity: 1.0,
  width: 52,
  length: 174,
  characterSpacing: 25,
  verticalPadding: 24,
  pivotSpacing: 65,
  cordLength: 52
};

const PHYSICS = {
  substeps: 6,
  collisionPasses: 3,
  maxFrameTime: 1 / 30,
  gravity: 2.6,
  angularDamping: 1.15,
  restitution: 0.42,
  positionCorrection: 0.72,
  maxCorrectionImpulse: 18,
  maxSwing: 0.58,
  bodyGravity: 3.1,
  bodyDamping: 0.9,
  hingeCoupling: 0.7,
  maxBodySwing: 0.42,
  supportRestoring: 2.5,
  supportDamping: 0.6,
  supportWindResponse: 0.16,
  maxSupportSwing: 0.5
};

const WIND = {
  steady: 0.08,
  variation: 0.11,
  turbulence: 0.3,
  gustsPerSecond: 0.20,
  gustMin: 0.4,
  gustMax: 0.82,
  gustDurationMin: 1.4,
  gustDurationMax: 2.8
};

const CORD_LENGTH_PATTERN = [0.78, 1, 0.88, 1.08, 0.82];
const BODY_LENGTH_PATTERN = [0.86, 0.92, 1, 1.12, 1.3];

const canvas = document.getElementById('the-canvas');
const ctx = canvas.getContext('2d');

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function vector(x, y) {
  return {x, y};
}

function add(a, b) {
  return vector(a.x + b.x, a.y + b.y);
}

function subtract(a, b) {
  return vector(a.x - b.x, a.y - b.y);
}

function multiply(v, scalar) {
  return vector(v.x * scalar, v.y * scalar);
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

function cross(a, b) {
  return a.x * b.y - a.y * b.x;
}

function midpoint(a, b) {
  return multiply(add(a, b), 0.5);
}

function drawLine(from, to) {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}

class Wind {
  constructor() {
    this.gustElapsed = 0;
    this.gustDuration = 0;
    this.gustPeak = 0;
  }

  update(dt) {
    const activity = clamp(CHIME.activity, 0, 1);

    if (this.gustDuration === 0) {
      const chance = WIND.gustsPerSecond * activity * dt;
      if (Math.random() < chance) {
        this.startGust(activity);
      }
      return;
    }

    this.gustElapsed += dt;
    if (this.gustElapsed >= this.gustDuration) {
      this.gustElapsed = 0;
      this.gustDuration = 0;
      this.gustPeak = 0;
    }
  }

  startGust(activity) {
    const direction = Math.random() < 0.5 ? -1 : 1;
    this.gustElapsed = 0;
    this.gustDuration = randomBetween(WIND.gustDurationMin, WIND.gustDurationMax);
    this.gustPeak = direction * randomBetween(WIND.gustMin, WIND.gustMax) * activity;
  }

  accelerationFor(chime, now) {
    const activity = clamp(CHIME.activity, 0, 1);
    const sharedWind = WIND.steady * Math.sin(now * 0.43);
    const slowVariation = WIND.variation * Math.sin(now * 0.81 + 0.6);
    const localVariation = WIND.turbulence * (
      0.65 * Math.sin(now * chime.windFrequency + chime.windPhase) +
      0.35 * Math.sin(now * (chime.windFrequency * 1.83) + chime.windPhase * 0.47)
    );

    let gust = 0;
    if (this.gustDuration > 0) {
      const progress = this.gustElapsed / this.gustDuration;
      gust = this.gustPeak * Math.sin(Math.PI * progress);
    }

    return activity * (sharedWind + slowVariation + localVariation) * chime.windExposure + gust;
  }
}

class Chime {
  constructor(index, pivot, supportOffset, cordLength, size) {
    const middle = (CHIME.count - 1) * 0.5;
    const initialOffset = (index - middle) * 0.012 * CHIME.activity;

    this.index = index;
    this.pivot = pivot;
    this.supportOffset = supportOffset;
    this.cordLength = cordLength;
    this.width = size.width;
    this.height = size.height;
    this.cordAngle = initialOffset;
    this.cordAngularVelocity = 0;
    this.bodyAngle = initialOffset * 0.25;
    this.bodyAngularVelocity = 0;
    this.windPhase = index * 1.37;
    this.windFrequency = 0.72 + index * 0.055;
    this.windExposure = 0.88 + (index % 3) * 0.1;

    const centerDistance = cordLength + size.height * 0.5;
    const bodyInertia = (size.width * size.width + size.height * size.height) / 12;
    this.cordInertia = centerDistance * centerDistance + bodyInertia;
    this.bodyInertia = (size.width * size.width + 4 * size.height * size.height) / 12;
  }

  advance(dt, windAcceleration) {
    const cordAcceleration = -PHYSICS.gravity * Math.sin(this.cordAngle) +
      windAcceleration;
    const bodyAcceleration = -PHYSICS.bodyGravity * Math.sin(this.bodyAngle) +
      PHYSICS.hingeCoupling * (this.cordAngle - this.bodyAngle) +
      windAcceleration * 0.58;

    this.cordAngularVelocity += cordAcceleration * dt;
    this.cordAngularVelocity *= Math.exp(-PHYSICS.angularDamping * dt);
    this.cordAngle += this.cordAngularVelocity * dt;

    this.bodyAngularVelocity += bodyAcceleration * dt;
    this.bodyAngularVelocity *= Math.exp(-PHYSICS.bodyDamping * dt);
    this.bodyAngle += this.bodyAngularVelocity * dt;
    this.constrainMotion();
  }

  constrainMotion() {
    const motionIsFinite = Number.isFinite(this.cordAngle) &&
      Number.isFinite(this.cordAngularVelocity) &&
      Number.isFinite(this.bodyAngle) &&
      Number.isFinite(this.bodyAngularVelocity);

    if (!motionIsFinite) {
      this.cordAngle = 0;
      this.cordAngularVelocity = 0;
      this.bodyAngle = 0;
      this.bodyAngularVelocity = 0;
      return;
    }
    if (Math.abs(this.cordAngle) > PHYSICS.maxSwing) {
      this.cordAngle = clamp(this.cordAngle, -PHYSICS.maxSwing, PHYSICS.maxSwing);
      this.cordAngularVelocity *= -0.2;
    }
    if (Math.abs(this.bodyAngle) > PHYSICS.maxBodySwing) {
      this.bodyAngle = clamp(
        this.bodyAngle,
        -PHYSICS.maxBodySwing,
        PHYSICS.maxBodySwing
      );
      this.bodyAngularVelocity *= -0.2;
    }
  }

  geometry() {
    const cordDirection = vector(Math.sin(this.cordAngle), Math.cos(this.cordAngle));
    const horizontal = vector(Math.cos(this.bodyAngle), -Math.sin(this.bodyAngle));
    const vertical = vector(Math.sin(this.bodyAngle), Math.cos(this.bodyAngle));
    const top = add(this.pivot, multiply(cordDirection, this.cordLength));
    const center = add(top, multiply(vertical, this.height * 0.5));
    const halfWidth = multiply(horizontal, this.width * 0.5);
    const halfHeight = multiply(vertical, this.height * 0.5);

    return {
      horizontal,
      vertical,
      top,
      center,
      vertices: [
        subtract(subtract(center, halfWidth), halfHeight),
        add(subtract(center, halfHeight), halfWidth),
        add(add(center, halfWidth), halfHeight),
        add(subtract(center, halfWidth), halfHeight)
      ]
    };
  }

  velocityAt(point) {
    const geometry = this.geometry();
    const cordArm = subtract(geometry.top, this.pivot);
    const bodyArm = subtract(point, geometry.top);
    const cordVelocity = vector(
      this.cordAngularVelocity * cordArm.y,
      -this.cordAngularVelocity * cordArm.x
    );
    const bodyVelocity = vector(
      this.bodyAngularVelocity * bodyArm.y,
      -this.bodyAngularVelocity * bodyArm.x
    );
    return add(cordVelocity, bodyVelocity);
  }
}

function projectVertices(vertices, axis) {
  let min = dot(vertices[0], axis);
  let max = min;

  for (let i = 1; i < vertices.length; i++) {
    const projection = dot(vertices[i], axis);
    min = Math.min(min, projection);
    max = Math.max(max, projection);
  }

  return {min, max};
}

function supportPoint(vertices, direction) {
  let result = vertices[0];
  let furthest = dot(result, direction);

  for (let i = 1; i < vertices.length; i++) {
    const distance = dot(vertices[i], direction);
    if (distance > furthest) {
      result = vertices[i];
      furthest = distance;
    }
  }

  return result;
}

function findCollision(first, second) {
  const firstGeometry = first.geometry();
  const secondGeometry = second.geometry();
  const axes = [
    firstGeometry.horizontal,
    firstGeometry.vertical,
    secondGeometry.horizontal,
    secondGeometry.vertical
  ];
  let depth = Infinity;
  let normal = null;

  for (const axis of axes) {
    const firstProjection = projectVertices(firstGeometry.vertices, axis);
    const secondProjection = projectVertices(secondGeometry.vertices, axis);
    const overlap = Math.min(firstProjection.max, secondProjection.max) -
      Math.max(firstProjection.min, secondProjection.min);

    if (overlap <= 0) {
      return null;
    }
    if (overlap < depth) {
      depth = overlap;
      normal = axis;
    }
  }

  const centerDelta = subtract(secondGeometry.center, firstGeometry.center);
  if (dot(centerDelta, normal) < 0) {
    normal = multiply(normal, -1);
  }

  const firstSurface = supportPoint(firstGeometry.vertices, normal);
  const secondSurface = supportPoint(secondGeometry.vertices, multiply(normal, -1));

  return {
    depth,
    normal,
    point: midpoint(firstSurface, secondSurface)
  };
}

function resolveCollision(first, second, collision) {
  const firstGeometry = first.geometry();
  const secondGeometry = second.geometry();
  const firstCordLever = cross(
    subtract(firstGeometry.top, first.pivot),
    collision.normal
  );
  const secondCordLever = cross(
    subtract(secondGeometry.top, second.pivot),
    collision.normal
  );
  const firstBodyLever = cross(
    subtract(collision.point, firstGeometry.top),
    collision.normal
  );
  const secondBodyLever = cross(
    subtract(collision.point, secondGeometry.top),
    collision.normal
  );
  const inverseEffectiveMass =
    firstCordLever * firstCordLever / first.cordInertia +
    secondCordLever * secondCordLever / second.cordInertia +
    firstBodyLever * firstBodyLever / first.bodyInertia +
    secondBodyLever * secondBodyLever / second.bodyInertia;

  if (inverseEffectiveMass < 1e-8) {
    return;
  }

  const correctionImpulse = Math.min(
    collision.depth * PHYSICS.positionCorrection / inverseEffectiveMass,
    PHYSICS.maxCorrectionImpulse
  );
  first.cordAngle += correctionImpulse * firstCordLever / first.cordInertia;
  second.cordAngle -= correctionImpulse * secondCordLever / second.cordInertia;
  first.bodyAngle += correctionImpulse * firstBodyLever / first.bodyInertia;
  second.bodyAngle -= correctionImpulse * secondBodyLever / second.bodyInertia;

  const firstVelocity = first.velocityAt(collision.point);
  const secondVelocity = second.velocityAt(collision.point);
  const relativeNormalVelocity = dot(
    subtract(secondVelocity, firstVelocity),
    collision.normal
  );

  if (relativeNormalVelocity >= 0) {
    return;
  }

  const impulse = -(1 + PHYSICS.restitution) * relativeNormalVelocity /
    inverseEffectiveMass;
  first.cordAngularVelocity += impulse * firstCordLever / first.cordInertia;
  second.cordAngularVelocity -= impulse * secondCordLever / second.cordInertia;
  first.bodyAngularVelocity += impulse * firstBodyLever / first.bodyInertia;
  second.bodyAngularVelocity -= impulse * secondBodyLever / second.bodyInertia;
}

function resolveAllCollisions(chimes) {
  for (let pass = 0; pass < PHYSICS.collisionPasses; pass++) {
    for (let first = 0; first < chimes.length - 1; first++) {
      for (let second = first + 1; second < chimes.length; second++) {
        const collision = findCollision(chimes[first], chimes[second]);
        if (collision) {
          resolveCollision(chimes[first], chimes[second], collision);
        }
      }
    }
  }
}

class WindChimeScene {
  constructor(layout) {
    this.layout = layout;
    this.wind = new Wind();
    this.chimes = makeChimes(layout);
    this.supportAngle = 0;
    this.supportAngularVelocity = 0;
  }

  update(dt, now) {
    this.wind.update(dt);
    const substep = dt / PHYSICS.substeps;

    for (let step = 0; step < PHYSICS.substeps; step++) {
      let supportWind = 0;
      for (const chime of this.chimes) {
        supportWind += this.wind.accelerationFor(chime, now);
      }
      supportWind /= Math.max(1, this.chimes.length);
      this.advanceSupport(substep, supportWind);
      this.positionChimePivots();

      for (const chime of this.chimes) {
        chime.advance(substep, this.wind.accelerationFor(chime, now));
      }
      resolveAllCollisions(this.chimes);
      for (const chime of this.chimes) {
        chime.constrainMotion();
      }
    }
  }

  advanceSupport(dt, windAcceleration) {
    const acceleration = -PHYSICS.supportRestoring * this.supportAngle -
      PHYSICS.supportDamping * this.supportAngularVelocity +
      PHYSICS.supportWindResponse * windAcceleration;

    this.supportAngularVelocity += acceleration * dt;
    this.supportAngle += this.supportAngularVelocity * dt;
    this.supportAngle = clamp(
      this.supportAngle,
      -PHYSICS.maxSupportSwing,
      PHYSICS.maxSupportSwing
    );
  }

  positionChimePivots() {
    const center = vector(this.layout.centerX, this.layout.support.y);
    const direction = vector(Math.cos(this.supportAngle), Math.sin(this.supportAngle));

    for (const chime of this.chimes) {
      chime.pivot = add(center, multiply(direction, chime.supportOffset));
    }
  }

  draw() {
    ctx.clearRect(0, 0, this.layout.width, this.layout.height);
    drawProcessChart(this.layout);
    drawSupport(this.layout, this.supportAngle);
    for (const chime of this.chimes) {
      drawChime(chime, this.layout);
    }
  }
}

function resizeCanvas() {
  const deviceScale = Math.max(1, window.devicePixelRatio || 1);
  const bounds = canvas.getBoundingClientRect();
  canvas.width = Math.round(bounds.width * deviceScale);
  canvas.height = Math.round(bounds.height * deviceScale);
  ctx.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
}

function makeLayout() {
  const deviceScale = Math.max(1, window.devicePixelRatio || 1);
  const width = canvas.width / deviceScale;
  const height = canvas.height / deviceScale;
  const characterCount = Math.max(1, Array.from(CHIME.text).length);
  const minimumTextHeight = CHIME.verticalPadding * 2 +
    (characterCount - 1) * CHIME.characterSpacing;
  const unscaledBodyHeight = Math.max(CHIME.length, minimumTextHeight);
  const longestBody = unscaledBodyHeight * Math.max(...BODY_LENGTH_PATTERN);
  const desiredHeight = 340 + longestBody;
  const scale = clamp(Math.min(width / 620, height / desiredHeight), 0.58, 1.25);
  const bodyHeight = unscaledBodyHeight * scale;
  const maxCordLength = CHIME.cordLength * 1.08 * scale;
  const contentHeight = 190 * scale + maxCordLength + longestBody * scale;
  const top = Math.max(24 * scale, (height - contentHeight) * 0.5);
  const centerX = width * 0.5;
  const supportY = top + 190 * scale;
  const pivotSpan = Math.max(0, CHIME.count - 1) * CHIME.pivotSpacing * scale;

  return {
    width,
    height,
    scale,
    centerX,
    bodyWidth: CHIME.width * scale,
    bodyHeight,
    characterSpacing: CHIME.characterSpacing * scale,
    fontSize: 25 * scale,
    chartFontSize: 22 * scale,
    strokeWidth: Math.max(1.5, 2 * scale),
    diamond: {
      center: vector(centerX, top + 44 * scale),
      width: 150 * scale,
      height: 88 * scale
    },
    yesY: top + 136 * scale,
    support: {
      y: supportY,
      left: centerX - pivotSpan * 0.5,
      right: centerX + pivotSpan * 0.5
    }
  };
}

function makeChimes(layout) {
  const chimes = [];
  const middle = (CHIME.count - 1) * 0.5;

  for (let index = 0; index < CHIME.count; index++) {
    const pivot = vector(
      layout.centerX + (index - middle) * CHIME.pivotSpacing * layout.scale,
      layout.support.y
    );
    const pattern = CORD_LENGTH_PATTERN[index % CORD_LENGTH_PATTERN.length];
    const cordLength = CHIME.cordLength * pattern * layout.scale;
    const lengthPattern = BODY_LENGTH_PATTERN[index % BODY_LENGTH_PATTERN.length];
    const size = {
      width: layout.bodyWidth,
      height: layout.bodyHeight * lengthPattern
    };
    const supportOffset = pivot.x - layout.centerX;
    chimes.push(new Chime(index, pivot, supportOffset, cordLength, size));
  }

  return chimes;
}

function setDrawingStyle(layout) {
  ctx.strokeStyle = '#fff';
  ctx.fillStyle = '#fff';
  ctx.lineWidth = layout.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function drawProcessChart(layout) {
  const diamond = layout.diamond;
  const top = vector(diamond.center.x, diamond.center.y - diamond.height * 0.5);
  const right = vector(diamond.center.x + diamond.width * 0.5, diamond.center.y);
  const bottom = vector(diamond.center.x, diamond.center.y + diamond.height * 0.5);
  const left = vector(diamond.center.x - diamond.width * 0.5, diamond.center.y);

  ctx.save();
  setDrawingStyle(layout);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${layout.chartFontSize}px monospace`;

  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(right.x, right.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.lineTo(left.x, left.y);
  ctx.closePath();
  ctx.stroke();
  ctx.fillText('wind?', diamond.center.x, diamond.center.y);

  const labelGap = layout.chartFontSize * 0.8;
  drawLine(bottom, vector(layout.centerX, layout.yesY - labelGap));
  ctx.fillText('yes', layout.centerX, layout.yesY);
  drawLine(
    vector(layout.centerX, layout.yesY + labelGap),
    vector(layout.centerX, layout.support.y)
  );
  ctx.restore();
}

function drawSupport(layout, angle) {
  const center = vector(layout.centerX, layout.support.y);
  const halfLength = (layout.support.right - layout.support.left) * 0.5;
  const direction = vector(Math.cos(angle), Math.sin(angle));

  ctx.save();
  setDrawingStyle(layout);
  drawLine(
    add(center, multiply(direction, -halfLength)),
    add(center, multiply(direction, halfLength))
  );
  ctx.restore();
}

function drawChime(chime, layout) {
  const geometry = chime.geometry();

  ctx.save();
  setDrawingStyle(layout);
  drawLine(chime.pivot, geometry.top);

  ctx.translate(geometry.center.x, geometry.center.y);
  ctx.rotate(-chime.bodyAngle);
  ctx.strokeRect(
    -chime.width * 0.5,
    -chime.height * 0.5,
    chime.width,
    chime.height
  );
  drawVerticalText(CHIME.text, layout);
  ctx.restore();
}

function drawVerticalText(text, layout) {
  const characters = Array.from(text);
  const textHeight = Math.max(0, characters.length - 1) * layout.characterSpacing;
  const startY = -textHeight * 0.5;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${layout.fontSize}px monospace`;

  for (let index = 0; index < characters.length; index++) {
    const character = characters[index];
    const y = startY + index * layout.characterSpacing;

    ctx.fillText(character, 0, y);
  }
}

let scene;
let previousTime;
let animationFrame;

function firstFrame(timestamp) {
  previousTime = timestamp / 1000;
  scene.draw();
  animationFrame = window.requestAnimationFrame(animate);
}

function animate(timestamp) {
  const now = timestamp / 1000;
  const dt = Math.min(now - previousTime, PHYSICS.maxFrameTime);
  previousTime = now;

  scene.update(dt, now);
  scene.draw();
  animationFrame = window.requestAnimationFrame(animate);
}

function start() {
  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame);
  }
  resizeCanvas();
  scene = new WindChimeScene(makeLayout());
  animationFrame = window.requestAnimationFrame(firstFrame);
}

window.addEventListener('load', start);
window.addEventListener('resize', start);
