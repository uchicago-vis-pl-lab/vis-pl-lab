const DEAD = 0;
const LIVE = 1;

const LIVE_COLOR = "white";
const DEAD_COLOR = "#111";

class World {
  constructor(w, h) {
    this.width = w + 2;
    this.height = h + 2;
    this.total  = this.width * this.height;
    this.from = new Uint8Array(this.total);
    this.from.fill(DEAD);
    this.to = new Uint8Array(this.total);
    this.to.fill(DEAD);
    this.nextval = World.precompute();
  }

  set(row, col) {
    this.from[this.at(row + 1, col + 1)] = LIVE;
  }

  population() {
    return this.from.reduce((count, value) => {
      return value == LIVE ? count + 1 : count;
    }, 0);
  }

  swap() {
    const tmp = this.to;
    this.to = this.from;
    this.from = tmp;
  }

  at(row, col) {
    return row * this.width + col;
  }

  nextgen() {
    // The inner loop will probably be JITted, so two things are done to
    // minimize the number of valid branches.
    // 1. The edges of the world are not considered so that the neighbor
    //    calculation does not involve branches. The initialization code ensures
    //    to allocate the extra space.
    // 2. The result for each cell is fetched from a look-up table.
    for (let i = 1; i + 1 < this.height; i++) {
      for (let j = 1; j + 1 < this.width; j++) {
        const from = this.from;
        const neighbors =
          from[this.at(i-1,j-1)] + from[this.at(i-1,j)] + from[this.at(i-1,j+1)] +
          from[this.at(i  ,j-1)]                        + from[this.at(i  ,j+1)] +
          from[this.at(i+1,j-1)] + from[this.at(i+1,j)] + from[this.at(i+1,j+1)];
        const state = from[this.at(i,j)];
        this.to[this.at(i,j)] = this.nextval[state * 9 + neighbors];
      }
    }
    this.swap();
  }

  draw(ctx, init, cellSz, gap, row, col, width, height) {
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const state = this.from[this.at(row + i, col + j)];
        const old   = this.to[this.at(row + i, col + j)];
        if (!init && state === old) {
          continue;
        }
        if (state === LIVE) {
          ctx.fillStyle = LIVE_COLOR;
        } else {
          ctx.fillStyle = DEAD_COLOR;
        }
        ctx.fillRect(j * (cellSz + gap), i * (cellSz + gap), cellSz, cellSz);
      }
    }
  }

  dump() {
    let output = "";
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        const state = this.from[this.at(i, j)];
        if (state === LIVE) {
          output += "*";
        } else {
          output += ".";
        }
      }
      output += "\n";
    }
    console.log(output);
  }

  static precompute() {
    const states = 2; // two states: dead or alive
    const stride = 9; // max neighbors 8
    let tbl = new Uint8Array(states * stride);
    for (let state = 0; state < states; state++) {
      for (let n = 0; n < stride; n++) {
        tbl[state * stride + n] =
          // The rule of Life:
          // 1. Any live cell with fewer than two live neighbours dies, as if by underpopulation.
          // 2. Any live cell with two or three live neighbours lives on to the next generation.
          // 3. Any live cell with more than three live neighbours dies, as if by overpopulation.
          // 4. Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
          (n === 3 || (n === 2 && state === LIVE)) ? LIVE : DEAD;
      }
    }
    return tbl;
  }
}

class Scene {
  static async load(canvas, path) {
    const {width, height, lines} = await Scene.fetchfile(path);

    // display twice the size of the bounding box
    let displayWidth  = width  * 2;
    let displayHeight = height * 2;

    // adjust to the same aspect ratio as the canvas
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const r = canvasWidth / canvasHeight;
    let W = Math.ceil(displayHeight * r);
    if (W < displayWidth) {
      // grow the height instead
      displayHeight = Math.ceil(displayWidth / r);
    } else {
      displayWidth = W;
    }

    // simulate twice the size of the display size
    const simulateWidth  = displayWidth * 2;
    const simulateHeight = displayHeight * 2;

    // center the loaded gadgets in the simulated world
    const colOffset = Math.floor((simulateWidth - width) / 2);
    const rowOffset = Math.floor((simulateHeight - height) / 2);

    const world = new World(simulateWidth, simulateHeight);
    for (let row = 0; row < height; row++) {
      const line = lines[row];
      for (let col = 0; col < Math.min(width, line.length); col++) {
        const ch = line[col];
        if (ch !== '.') {
          world.set(row + rowOffset, col + colOffset);
        }
      }
    }
    return new Scene(world, canvas, displayWidth, displayHeight);
  }

  constructor(world, canvas, displayWidth, displayHeight) {
    this.world = world;
    this.canvas = canvas;
    if (!canvas.getContext) {
      throw Error("Unsupported browser");
    }
    this.ctx = canvas.getContext("2d");
    this.displayWidth = displayWidth;
    this.displayHeight = displayHeight;
    this.resize(canvas);
  }

  resize() {
    const widthPx  = this.canvas.width;
    const heightPx = this.canvas.height;

    const cellPx1 = Math.floor(widthPx / this.displayWidth);
    const cellPx2 = Math.floor(heightPx / this.displayHeight);
    const cellPx  = Math.min(cellPx1, cellPx2);

    let gap = Math.max(1, Math.floor(cellPx * 0.1));
    let cell;
    if (cellPx > gap) {
      cell = cellPx - gap;
    } else {
      cell = cellPx;
      gap = 0;
    }

    const colOffset = Math.floor((this.world.width - this.displayWidth) / 2);
    const rowOffset = Math.floor((this.world.height - this.displayHeight) / 2);

    console.log(gap, cell, colOffset, rowOffset);
    console.log(this.world.width, this.displayWidth, this.world.height, this.displayHeight);
    this.gap = gap;
    this.cell = cell;
    this.displayColOffset = colOffset;
    this.displayRowOffset = rowOffset;
  }

  draw(init) {
    this.world.draw(
      this.ctx, init, this.cell, this.gap,
      this.displayRowOffset, this.displayColOffset,
      this.displayWidth, this.displayHeight
    );
  }

  static async fetchfile(path) {
    const r = await fetch(path);
    if (!r.ok) {
      throw new Error(`Fetch failed: ${r.status} ${r.statusText}`);
    }

    const comment = "!";
    let txt = await r.text();
    let lines = txt.replace(/\r\n?/g, '\n').split('\n')
                   .filter(l => !l.startsWith(comment));

    // Drop trailing empty line
    if (lines.at(-1) === '') lines.pop();

    const width = lines.reduce((m, l) => Math.max(m, l.length), 0);
    return { width, height: lines.length, lines };
  }
}

let scene = undefined;

async function init() {
  const canvas = document.getElementById("the-canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let params = (new URL(document.location)).searchParams;
  let worldpath;
  if (params.has('world')) {
    worldpath = params.get('world');
  } else {
    worldpath = 'worlds/gun-destruction.cells';
  }
  scene = await Scene.load(canvas, worldpath);
  window.requestAnimationFrame(firstFrame);
}

let last = undefined;
const duration = (1.0 / 10.0) * 1000.0; // 10-Hz

function firstFrame(timestamp) {
  last = timestamp;
  draw(true);
  window.requestAnimationFrame(animate);
}

function animate(timestamp) {
  const frames = (timestamp - last) / duration;

  if (frames >= 1) {
    last = timestamp;
    draw(false);
  }
  window.requestAnimationFrame(animate);
}

function draw(init) {
  const canvas = document.getElementById("the-canvas");
  scene.draw(init);
  scene.world.nextgen();
}

function resize() {
  scene.canvas.width = window.innerWidth;
  scene.canvas.height = window.innerHeight;
  scene.resize();
  scene.draw(true);
}

window.addEventListener("load", init);
window.addEventListener("resize", resize);
