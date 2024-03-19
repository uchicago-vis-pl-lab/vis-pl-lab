const eyes = [];

function newColor() {
  let n = 8;
  let h = round(random(0, 1) * n) / n * 255;
  return [h, 200, 200];
}

function newEye(x, y) {
  const d = random(20, 40);
  return {
    x, y,  // position
    vx: 0, // velocity
    vy: 0,
    ax: 0, // acceleration
    ay: 0,
    d: d,
    c: newColor(),
    // mass is proportional to area of eye
    iMass: 1 / pow(PI * (d / 2), 2)
  }
}

function drawEye(eye) {
  fill("white");
  circle(eye.x, eye.y, eye.d);
  fill(eye.c[0], eye.c[1], eye.c[2]);
  circle(eye.x, eye.y, 0.5 * eye.d);
  fill("black");
  circle(eye.x, eye.y, 0.3 * eye.d);
}

// Given and eye and a vertical line at x, do the line
// and eye intersect? If so, how much and in what direction?
function penetrationVectorCV(eye, x) {
  if(Math.abs(eye.x - x) > eye.d / 2) return null;

  if(eye.x < x) {
    const p = Math.abs(x - (eye.x + eye.d / 2));
    return { nx: -1, ny: 0, p };
  } else {
    const p = Math.abs(x - (eye.x - eye.d / 2));
    return { nx: 1, ny: 0, p };
  }
}

// Given and eye and a horizontal line at y, do the line
// and eye intersect? If so, how much and in what direction?
function penetrationVectorCH(eye, y) {
  if(Math.abs(eye.y - y) > eye.d / 2) return null;

  if(eye.y < y) {
    const p = Math.abs(y - (eye.y + eye.d / 2));
    return { nx: 0, ny: -1, p };
  } else {
    const p = Math.abs(y - (eye.y - eye.d / 2));
    return { nx: 0, ny: 1, p };
  }
}

// Given two eyes, do they intersect? If so, how
// much and in what direction?
function penetrationVectorCC(eyeA, eyeB) {
  const d = sqrt(pow(eyeA.x - eyeB.x, 2) + pow(eyeA.y - eyeB.y, 2));
  if(d < eyeA.d / 2 + eyeB.d / 2) {
    const nx = (eyeA.x - eyeB.x) / d;
    const ny = (eyeA.y - eyeB.y) / d;
    const p = Math.abs(d - (eyeA.d / 2 + eyeB.d / 2));
    return {
      nx, ny, p
    }
  } else {
    return null;
  }
}

// Update the velocity and position of each eye
// using euler's method.
function updateNewton(eyes, dt) {
  for(const eye of eyes) {
    eye.vx += eye.ax * dt;
    eye.vy += eye.ay * dt;
    eye.y += eye.vy * dt;
    eye.x += eye.vx * dt;
  }
}

// based on Game Physics Engine Development, Ian Millington
function resolveCollision(collision, dt) {
  let sepVel = 0;
  if(collision.b) {
    const sepVelX = (collision.a.vx - collision.b.vx) * collision.nx;
    const sepVelY = (collision.a.vy - collision.b.vy) * collision.ny;
    sepVel = sepVelX + sepVelY; // dot(v_a - v_b, n)
  } else {
    sepVel  = collision.a.vx * collision.nx;
    sepVel += collision.a.vy * collision.ny;
  }

  // Objects are moving away, not colliding.
  if(sepVel > 0) return;

  let newSepVel = -sepVel * collision.restitution;

  // Cancel the portion of the velocity that is only
  // due to acceleration. This simulates the normal force.
  let accCausedVelX = collision.a.ax;
  let accCausedVelY = collision.a.ay;
  if(collision.b) {
    accCausedVelX -= collision.b.ax;
    accCausedVelY -= collision.b.ay;
  }
  let accCausedSepVel = (accCausedVelX * collision.nx + accCausedVelY * collision.ny) * dt;

  if(accCausedSepVel < 0) {
    newSepVel += accCausedSepVel * collision.restitution;

    if(newSepVel < 0) newSepVel = 0;
  }

  const deltaV = newSepVel - sepVel;

  let totalIMass = collision.a.iMass;
  if(collision.b) {
    totalIMass += collision.b.iMass;
  }

  if(totalIMass <= 0) return;

  // Move the objects apart.
  const impulseX = (deltaV / totalIMass) * collision.nx;
  const impulseY = (deltaV / totalIMass) * collision.ny;

  collision.a.vx += impulseX * collision.a.iMass;
  collision.a.vy += impulseY * collision.a.iMass;
  if(collision.b) {
    collision.b.vx -= impulseX * collision.b.iMass;
    collision.b.vy -= impulseY * collision.b.iMass;
  }
}

// When two objects are intersecting, we need to
// push them apart since in real life, objects aren't
// allowed to intersect. The way we move these objects
// apart isn't physically accurate (they are effectively
// teleported), but it's easier and faster than the
// alternative (look up continuous collision detection).
function resolveInterpenetration(collision) {
  if(collision.p <= 0) return;

  let totalIMass = collision.a.iMass;
  if(collision.b) {
    totalIMass += collision.b.iMass;
  }

  if(totalIMass <= 0) return;

  const movementX = (collision.p / totalIMass) * collision.nx;
  const movementY = (collision.p / totalIMass) * collision.ny;

  collision.a.x += movementX * collision.a.iMass;
  collision.a.y += movementY * collision.a.iMass;
  if(collision.b) {
    collision.b.x -= movementX * collision.b.iMass;
    collision.b.y -= movementY * collision.b.iMass;
  }
}

function resolveCollisions(collisions, dt) {
  for(const collision of collisions) {
    resolveCollision(collision, dt);
    resolveInterpenetration(collision);
  }
}

// Find all the collisions and collect them
// in an array of objects.
function findCollisions(eyes) {
  const restitution = 0.25; // "bounciness"
  const collisions = new Map();

  // check collisions against other eyes
  for(let i = 0; i < eyes.length; ++i) {
    for(let j = 0; j < eyes.length; ++j) {
      // don't collide with ourselves!
      if(i === j) continue;

      const maybeCollision = penetrationVectorCC(eyes[i], eyes[j]);
      if(maybeCollision && !collisions.has([i, j])) {
        collisions.set([i, j], {
          a: eyes[i],
          b: eyes[j],
          nx: maybeCollision.nx,
          ny: maybeCollision.ny,
          p: maybeCollision.p,
          restitution
        })
      }
    }

    // check collisions against left wall
    let c = penetrationVectorCV(eyes[i], 0);
    if(c) {
      collisions.set([i, "left-wall"], {
        a: eyes[i],
        nx: c.nx,
        ny: c.ny,
        p: c.p,
        restitution,
      });
    }

    // check collisions against right wall
    c = penetrationVectorCV(eyes[i], width);
    if(c) {
      collisions.set([i, "right-wall"], {
        a: eyes[i],
        nx: c.nx,
        ny: c.ny,
        p: c.p,
        restitution
      });
    }

    // check collisions against floor
    c = penetrationVectorCH(eyes[i], height);
    if(c) {
      collisions.set([i, "floor"], {
        a: eyes[i],
        nx: c.nx,
        ny: c.ny,
        p: c.p,
        restitution
      });
    }
  }

  return [...collisions.values()];
}

let samples = [];
function box_filter(n) {
  samples.push(n);

  if(samples.length > 32) {
    samples.shift();
  }

  return samples.reduce((sum, s) => sum + s) / samples.length;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background("white");
  colorMode(HSB);
  textAlign(LEFT, TOP);
}

function draw() {
  background("white");

  let fps = frameRate();
  text("FPS: " + box_filter(fps).toFixed(2), 10, 10);

  // apply gravity to each eye
  for(const eye of eyes) {
    eye.ay = 9.8 * 20;
    eye.ax = 0;
  }

  // find and resolve collisions 64 times per frame
  const steps = 64;
  for(let n = 0; n < steps; ++n) {
    const dt = 1 / (steps * getTargetFrameRate());
    const collisions = findCollisions(eyes);
    resolveCollisions(collisions, dt);
    updateNewton(eyes, dt);
  }

  // draw all eyes
  for(const eye of eyes) {
    drawEye(eye);
  }

  // potentially spawn some new eyes
  if(random() < 0.1 && eyes.length < 100) {
    const eyeX = random(10, width - 10);
    eyes.push(newEye(eyeX, -50));
  }
}
