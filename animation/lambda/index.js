// @ts-check

/**
 * @typedef {{
 *  id: string,
 *  text: string,
 * }} Word
 */

/**
 * @typedef {{
 *   height: number,
 *   id: string,
 *   originX: number
 *   originY: number,
 *   text: string,
 * }} LaidOutWord
 */

const FreshId = new class {
  #nextId = 0;
  next() {
    return this.#nextId++;
  }
}

/**
 * Exponential easing function.
 *
 * https://easings.net/#easeInOutExpo
 *
 * @param x {number}
 * @returns {number}
 */
function easeInOutExpo(x) {
return x === 0
  ? 0
  : x === 1
  ? 1
  : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2
  : (2 - Math.pow(2, -20 * x + 10)) / 2;
}

/**
 * Exponential easing function.
 *
 * https://easings.net/#easeInOutExpo
 *
 * @param x {number}
 * @returns {number}
 */
function easeOutExpo(x) {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

/**
 * @param ctx {CanvasRenderingContext2D}
 */
function setupFontSettings(ctx) {
  ctx.font = "64pt monospace";
  ctx.textBaseline = "top";
}

/**
 * @param ctx {CanvasRenderingContext2D}
 * @param words {Word[]}
 * @returns {LaidOutWord[]}
 */
function layout(ctx, words) {
  let x = 0;
  let y = 0;
  ctx.save();
  setupFontSettings(ctx);

  // The amount of space to allocate for a line continuation.
  const contWidth = ctx.measureText("  ").width;

  const maxWidth = ctx.canvas.width;
  const out = words.map(word => {
    const metrics = ctx.measureText(word.text);
    const height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
    if(x + metrics.width > maxWidth) {
      // newline
      y += height;
      x = metrics.width + contWidth;
      return { originX: contWidth, originY: y, height, ...word };
    } else {
      const pos = { originX: x, originY: y, height, ...word };
      x += metrics.width;
      return pos;
    }
  });
  ctx.restore();
  return out;
}

/**
 * @param layout {LaidOutWord[]}
 * @returns {number}
 */
function layoutHeight(layout) {
  return layout.reduce((height, word) => Math.max(height, word.originY + word.height), 0);
}

/**
 * @param s {string}
 * @returns {Word[]}
 */
function wordsFromString(s) {
  /** @type {Word[]} */
  let out = [];

  const words = s.split(" ");
  for(let i = 0; i < words.length; ++i) {
    if(i < words.length - 1) {
      out.push({ text: words[i], id: (2 * i).toString() });
      out.push({ text: " ", id: (2 * i + 1).toString() });
    } else {
      out.push({ text: words[i], id: (2 * i).toString() });
    }
  }

  return out;
}

/**
 * @typedef {{
 *   toDelete: LaidOutWord[],
 *   toCreate: LaidOutWord[],
 *   toInterp: [LaidOutWord, LaidOutWord][]
 * }} LayoutInterpolation
 */

/**
 * Interpolate between two layouts, returning a `LayoutInterpolation`,
 * which is a description of the interpolation of two layouts which
 * can be turned into a layout with `interpolateLayouts`.
 *
 * @param a {LaidOutWord[]}
 * @param b {LaidOutWord[]}
 * @returns {LayoutInterpolation}
 */
function prepareToInterpolateLayouts(a, b) {
  // If both layouts have a word with the same ID, then interpolate
  // between the position of the fragments.

  let am = new Map(a.map(a => [a.id, a]));
  let bm = new Map(b.map(b => [b.id, b]));

  // Find those elements which are present in `b` but not `a`.
  const toCreate = new Map(bm);
  // Find those elements which are present in `a` but not `b`.
  const toDelete = new Map(am);
  // Find those elements which are present in `a` and `b`.
  const toInterp = new Map();

  for(const [bk, bv] of bm) {
    if(toDelete.has(bk) && toDelete.get(bk).text === bv.text) {
      toDelete.delete(bk);
    }
  }

  for(const [ak, av] of am) {
    if(toCreate.has(ak) && toCreate.get(ak).text === av.text) {
      toCreate.delete(ak);
    }

    if(bm.has(ak) && bm.get(ak).text === am.get(ak).text) {
      toInterp.set(ak, [av, bm.get(ak)]);
    }
  }

  return {
    toDelete: [...toDelete.values()],
    toCreate: [...toCreate.values()],
    toInterp: [...toInterp.values()]
  }
}

/**
 * Render the layout to the canvas.
 *
 * @param ctx {CanvasRenderingContext2D}
 * @param laidOutWords {LaidOutWord[]}
 * @param yOfs {number}
 */
function drawLayout(ctx, laidOutWords, yOfs=0) {
  ctx.save();
  setupFontSettings(ctx);
  ctx.fillStyle = "white";
  for(const laidOutWord of laidOutWords) {
    ctx.fillText(laidOutWord.text, laidOutWord.originX, laidOutWord.originY + yOfs);
  }
  ctx.restore();
}


/**
 * @param omin {number}
 * @param omax {number}
 * @param imin {number}
 * @param xx   {number}
 * @param imax {number}
 * @returns {number}
 */
function lerp(omin, omax, imin, xx, imax) {
  const t = (xx - imin) / (imax - imin);
  return omin * (1 - t) + omax * t;
}

const CREATION_DELETION_MOVE_AMOUNT = 8; //px;

/**
 * @param ctx {CanvasRenderingContext2D}
 * @param interpolation {LayoutInterpolation}
 * @param t {number}
 * @param yOfs {number}
 */
function drawInterpolatedLayout(ctx, interpolation, t, yOfs=0) {
  ctx.save();
  setupFontSettings(ctx);

  for(const word of interpolation.toCreate) {
    let transparency = 1 - t;
    ctx.fillStyle = `color-mix(in srgb, white, transparent ${Math.round(transparency * 100)}%)`;
    ctx.fillText(
      word.text,
      word.originX,
      word.originY + yOfs - ((1 - t) * CREATION_DELETION_MOVE_AMOUNT)
    );
  }

  for(const word of interpolation.toDelete) {
    let transparency = t;
    ctx.fillStyle = `color-mix(in srgb, white, transparent ${Math.round(transparency * 100)}%)`;
    ctx.fillText(
      word.text,
      word.originX,
      word.originY + yOfs + (t * CREATION_DELETION_MOVE_AMOUNT)
    );
  }

  ctx.fillStyle = "white";
  for(const [from, to] of interpolation.toInterp) {
    ctx.fillText(
      from.text,
      lerp(from.originX, to.originX, 0, t, 1),
      lerp(from.originY, to.originY, 0, t, 1) + yOfs
    );
  }

  ctx.restore();
}

/**
 * @typedef {{
 *   type: "Abs",
 *   alpha: string,
 *   t1: Term,
 *   id: number,
 * }} Abs
 */

/**
 * @typedef {{
 *   type: "Subst",
 *   alpha: string,
 *   forTm: Term,
 *   inTm: Term,
 *   id: number,
 * }} Subst
 */

/**
 * @typedef {Abs | Subst | {
 *   type: "App",
 *   t1: Term,
 *   t2: Term,
 *   id: number,
 * } | {
 *   type: "Var",
 *   nm: string,
 *   id: number,
 * }} Term
 */

/**
 * @param id {{ id: number }}
 * @param alpha {string}
 * @param t1 {Term}
 * @returns {Term}
 */
function mkAbs(id, alpha, t1) {
  return { type: "Abs", alpha, t1, id: id.id };
}

/**
 * @param id {{ id: number }}
 * @param alpha {string}
 * @param forTm {Term}
 * @param inTm {Term}
 * @returns {Subst}
 */
function mkSubst(id, alpha, forTm, inTm) {
  return { type: "Subst", alpha, forTm, inTm, id: id.id };
}

/**
 * @param id {{ id: number }}
 * @param t1 {Term}
 * @param t2 {Term}
 * @returns {Term}
 */
function mkApp(id, t1, t2) {
  return { type: "App", t1, t2, id: id.id };
}

/**
 * @param id {{ id: number }}
 * @param nm {string}
 * @returns {Term}
 */
function mkVar(id, nm) {
  return { type: "Var", nm, id: id.id };
}

/**
 * @typedef {{
 *  type: "OpenParen"
 * } | {
 *  type: "CloseParen"
 * } | {
 *  type: "Symbol"
 *  sym: string
 * } | {
 *  type: "Lambda"
 * } | {
 *  type: "Dot"
 * }} Token
 */

/**
 * Scan the given string into a sequence of tokens.
 *
 * @param src {string}
 * @returns {Generator<Token>}
 */
function* scan(src) {
  for(let i = 0; i < src.length;) {
    switch(src[i]) {
    case "(":  yield { type: "OpenParen" };  ++i; break;
    case ")":  yield { type: "CloseParen" }; ++i; break;
    case ".":  yield { type: "Dot" };        ++i; break;
    case "\\": yield { type: "Lambda" };     ++i; break;
    default: {
      if(/\s/.test(src[i])) {
        ++i;
      } else if(/[a-zA-Z]/.test(src[i])) {
        let sym = "";
        while(/[a-zA-Z]/.test(src[i]) && i < src.length) {
          sym += src[i++];
        }
        yield { type: "Symbol", sym };
      } else {
        throw new Error(`Unrecognized character ${src[i]}`);
      }
    }
    }
  }
}

/**
 * @template T
 * @param ts {T[]}
 * @returns T
 */
function randomChoice(...ts) {
  return ts[Math.round(Math.random() * (ts.length - 1))];
}

/**
 * @returns {string}
 */
function randomSymbol() {
  return randomChoice("x", "y", "z", "w");
}

/**
 * @param size {number}
 * @returns {Term}
 */
function randomTerm(size) {
  if(size <= 1) {
    return mkVar({ id: FreshId.next() }, randomSymbol());
  } else {
    return randomChoice(
      () => mkVar({ id: FreshId.next() }, randomSymbol()),
      () => mkApp({ id: FreshId.next(), }, randomTerm(size/2), randomTerm(size/2)),
      () => mkAbs({ id: FreshId.next(), }, randomSymbol(), randomTerm(size/2)),
    )();
  }
}

/**
 * Parse a term from the given string.
 *
 * @param src {string}
 * @returns {Term}
 */
function parseTerm(src) {
  const toks = [...scan(src)];
  let i = 0;
  const peek = () => {
    return toks[i];
  };

  /**
   * @param type {Token["type"]}
   * @returns {boolean}
   */
  const consume = (type) => {
    if(peek().type === type) {
      ++i;
      return true;
    }
    return false;
  };

  /**
   * @template {Token["type"]} K
   * @param type {K}
   * @returns {Extract<Token, { type: K }>}
   */
  const expect = (type) => {
    let tok = peek();
    if(tok.type !== type) {
      throw new Error(`Expected ${type}`);
    }
    ++i;
    return /** @type {Extract<Token, { type: K }>} */ (tok);
  }

  /**
   * @returns {Term}
   */
  const parseLambda = () => {
    expect("Lambda");
    const sym = expect("Symbol");
    expect("Dot");
    const t1 = parseApp();
    return mkAbs({ id: FreshId.next() }, sym.sym, t1);
  };

  /**
   * @returns {Term}
   */
  const parseParens = () => {
    expect("OpenParen");
    const t = parseApp();
    expect("CloseParen");
    return t;
  };

  /**
   * @returns {Term}
   */
  const parseAtom = () => {
    let tok = peek();
    switch(tok.type) {
    case "Lambda": return parseLambda();
    case "OpenParen": return parseParens();
    case "Symbol": {
      consume("Symbol");
      return mkVar({ id: FreshId.next() }, tok.sym);
    }
    default:
      throw new Error(`Unexpected ${tok.type}`);
    }
  };

  /**
   * @returns {Term}
   */
  const parseApp = () => {
    /** @type {Term[]} */
    const atoms = [];
    while(
      peek()
        && (peek().type === "OpenParen"
            || peek().type === "Lambda"
            || peek().type === "Symbol")
    ) {
      atoms.push(parseAtom());
    }

    if(atoms.length === 1) {
      return atoms[0];
    } else {
      return atoms
        .slice(1)
        .reduce(
          (left, right) => mkApp({ id: FreshId.next() }, left, right),
          atoms[0]
        );
    }
  };

  return parseApp();
}


/**
 * @template A
 * @param a {Set<A>}
 * @param b {Set<A>}
 * @returns {Set<A>}
 */
function union(a, b) {
  const out = new Set();
  a.forEach(v => out.add(v));
  b.forEach(v => out.add(v));
  return out;
}

/**
 * @template A
 * @param a {Set<A>}
 * @param b {Set<A>}
 * @returns {Set<A>}
 */
function difference(a, b) {
  const out = new Set([...a]);
  b.forEach(v => out.delete(v));
  return out;
}

/**
 * Find the set of free variables in a term.
 *
 * @param tm {Term}
 * @returns {Set<string>}
 */
function freeVars(tm) {
  switch(tm.type) {
  case "Abs": return difference(freeVars(tm.t1), new Set([tm.alpha]));
  case "App": return union(freeVars(tm.t1), freeVars(tm.t2));
  case "Var": return new Set([tm.nm]);
  default:
    throw new Error("boundVars");
  }
}

/**
 * Find the set of variables in a term.
 *
 * @param tm {Term}
 * @returns {Set<string>}
 */
function vars(tm) {
  switch(tm.type) {
  case "Abs": return union(vars(tm.t1), new Set([tm.alpha]))
  case "App": return union(vars(tm.t1), vars(tm.t2));
  case "Var": return new Set([tm.nm]);
  default:
    throw new Error("boundVars");
  }
}

/**
 * @param from {string}
 * @param to {string}
 * @param tm {Term}
 * @returns {Term}
 */
function renameVarInTerm(from, to, tm) {
  switch(tm.type) {
  case "Abs":
    if(tm.alpha === from) {
      return tm;
    } else {
      return mkAbs(tm, tm.alpha, renameVarInTerm(from, to, tm.t1));
    }
  case "App":
    return mkApp(tm, renameVarInTerm(from, to, tm.t1), renameVarInTerm(from, to, tm.t2));
  case "Var": {
    if(tm.nm === from) {
      return mkVar(tm, to);
    } else {
      return tm;
    }
  }
  default:
    throw new Error("renameVarInTerm");
  }
}

/**
 * Produce an infinite supply of names.
 *
 * @returns {Generator<string>}
 */
function* freshNames() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  for(const c of alphabet) {
    yield c;
  }
  for(const name of freshNames()) {
    for(const c of alphabet) {
      yield c + name;
    }
  }
}

/**
 * @param tm {Abs}
 * @param reserved {Set<string>}
 * @returns Abs
 */
function renameAbs(tm, reserved) {
  reserved = union(vars(tm), reserved);
  let alpha;
  for(const candidate of freshNames()) {
    if(!reserved.has(candidate)) {
      alpha = candidate;
      break;
    }
  }
  return mkAbs(
    tm,
    alpha,
    renameVarInTerm(tm.alpha, alpha, tm.t1)
  );
}

/**
 * Annotate a term with fresh IDs.
 *
 * @param {Term} term
 * @returns {Term}
 */
function withFreshIds(term) {
  const id = { id: FreshId.next() };
  switch(term.type) {
  case "Abs": return mkAbs(id, term.alpha, withFreshIds(term.t1));
  case "Subst": return mkSubst(id, term.alpha, withFreshIds(term.forTm), withFreshIds(term.inTm));
  case "App": return mkApp(id, withFreshIds(term.t1), withFreshIds(term.t2));
  case "Var": return mkVar(id, term.nm);
  }
}

/**
 * @param subst {Subst}
 * @returns {Term}
 */
function stepSubst(subst) {
  switch(subst.inTm.type) {
  case "Var": {
    if(subst.inTm.nm === subst.alpha) {
      return subst.forTm;
    } else {
      return subst.inTm;
    }
  }
  case "Abs": {
    if(subst.inTm.alpha === subst.alpha) {
      // Don't go underneath lambdas which bind the same `alpha`.
      return subst.inTm;
    }

    // In going underneath an abstraction, we need to be careful that
    // the abstraction doesn't bind a variable from the `forTm`.
    const fvs = freeVars(subst.forTm);
    if(fvs.has(subst.inTm.alpha)) {
      // Need to rename this binder.
      return mkSubst(
        subst,
        subst.alpha,
        subst.forTm,
        renameAbs(subst.inTm, union(fvs, new Set([subst.alpha])))
      );
    } else {
      // Continue down...
      return mkAbs(subst.inTm, subst.inTm.alpha, mkSubst(subst, subst.alpha, subst.forTm, subst.inTm.t1));
    }
  }
  case "App": {
    return mkApp(
      subst.inTm,
      mkSubst({ id: FreshId.next() }, subst.alpha,              subst.forTm,  subst.inTm.t1),
      mkSubst({ id: FreshId.next() }, subst.alpha, withFreshIds(subst.forTm), subst.inTm.t2)
    );
  }
  }
}

/**
 * @param tm {Term}
 * @returns {Word[]}
 */
function termToWords(tm) {
  switch(tm.type) {
  case "Abs": {
    const out = [{
      text: "\u03BB",
      id: `${tm.id}-0`
    }, {
      text: tm.alpha,
      id: `${tm.id}-1`,
    }, {
      text: ".",
      id: `${tm.id}-2`,
    }];

    out.push(...termToWords(tm.t1));
    return out;
  }
  case "Subst": {
    const rParens = tm.inTm.type === "App";
    const out = [{
      text: "[",
      id: `${tm.id}-0`
    }, {
      text: tm.alpha,
      id: `${tm.id}-1`
    }, {
      text: "\u2192",
      id: `${tm.id}-2`
    }];

    out.push(...termToWords(tm.forTm));
    out.push({
      text: "]",
      id: `${tm.id}-3`,
    });
    if(rParens) {
      out.push({
        text: "(",
        id: `${tm.id}-4`,
      });
    }
    out.push(...termToWords(tm.inTm));
    if(rParens) {
      out.push({
        text: ")",
        id: `${tm.id}-5`,
      });
    }
    return out;
  }
  case "App": {
    const lParens = tm.t1.type === "Abs";
    const rParens = tm.t2.type === "App";

    const out = [];
    if(lParens) {
      out.push({
        text: "(",
        id: `${tm.id}-0`,
      });
    }
    out.push(...termToWords(tm.t1));
    if(lParens) {
      out.push({
        text: ")",
        id: `${tm.id}-1`,
      });
    }
    out.push({
      text: " ",
      id: `${tm.id}-2`,
    });
    if(rParens) {
      out.push({
        text: "(",
        id: `${tm.id}-3`,
      });
    }
    out.push(...termToWords(tm.t2));
    if(rParens) {
      out.push({
        text: ")",
        id: `${tm.id}-4`,
      });
    }
    return out;
  }
  case "Var": return [{ text: tm.nm, id: `${tm.id}-0` }]
  }
}

/**
 * @param tm {Term}
 * @returns {Term | null}
 */
function smallStep(tm) {
  switch(tm.type) {
  case "Abs": {
    const inside = smallStep(tm.t1);
    if(inside) {
      return mkAbs(tm, tm.alpha, inside);
    }
    return null;
  }
  case "Subst": return stepSubst(tm);
  case "App": {
    const insideL = smallStep(tm.t1);
    if(insideL) {
      return mkApp(tm, insideL, tm.t2);
    }

    const insideR = smallStep(tm.t2);
    if(insideR) {
      return mkApp(tm, tm.t1, insideR);
    }

    if(tm.t1.type === "Abs") {
      return mkSubst({ id: FreshId.next() }, tm.t1.alpha, tm.t2, tm.t1.t1);
    }

    return null;
  }
  case "Var": return null;
  }
}

/**
 * @param tm {Term}
 * @returns {string}
 */
function termToString(tm) {
  const words = termToWords(tm);
  let out = "";
  for(const word of words) {
    out += word.text;
  }
  return out;
}

const frameDuration = 5000;

/**
 * Animate in multiple steps.
 *
 * @param t {number} The current time, on [0, 1]
 * @param steps {((t: number) => void)[]} The first animation step.
 * @param step2 {(t: number) => void} The first animation step.
 */
function inSteps(t, ...steps) {
  const curStep = Math.floor(t * steps.length);
  return steps[curStep](t * steps.length - curStep);
}

/**
 * Apply `smallStep` to `tm` upto `n` times.
 *
 * @param tm {Term}
 * @param n {number}
 * @returns {Term[]}
 */
function smallSteps(tm, n=100) {
  /** @type {Term[]} */
  let steps = [tm];
  for(let i = 0; i < n; ++i) {
    const next = smallStep(steps[steps.length-1]);
    if(next === null) break;
    steps.push(next);
  }
  return steps;
}

/**
 * Find a random term with the given size which is "interesting".
 *
 * A term is interesting if it takes many steps to reduce.
 *
 * @param size {number}
 * @returns {Term}
 */
function findInterestingRandomTermOfSize(size) {
  /** @type {Term} */
  let best = randomTerm(size);
  /** @type {number} */
  let bestNSteps = smallSteps(best).length;
  for(let i = 0; i < 100; ++i) {
    const candidate = randomTerm(size);
    const nSteps = smallSteps(candidate).length;
    if(nSteps > bestNSteps) {
      best = candidate;
      bestNSteps = nSteps;
    }
  }
  console.log(`Found a term of size ${size} which reduces in ${bestNSteps} steps: ${termToString(best)}`);
  return best;
}

document.addEventListener("DOMContentLoaded", () => {
  const canvas  = /** @type {HTMLCanvasElement} */(document.getElementById("myCanvas"));
  if(!canvas) {
    throw new Error("Can't find #myCanvas");
  }
  const ctx = canvas.getContext("2d");
  if(!ctx) {
    throw new Error("Can't get canvas rendering context");
  }

  const canvasCSSSize = canvas.getBoundingClientRect();
  const deviceWidth  = canvasCSSSize.width * window.devicePixelRatio;
  const deviceHeight = canvasCSSSize.height * window.devicePixelRatio;
  canvas.width = deviceWidth;
  canvas.height = deviceHeight;

  let initialTerm = mkVar({ id: FreshId.next() }, "no initial term");

  const params = new URLSearchParams(window.location.search);
  if(params.has("initialTerm")) {
    const src = params.get("initialTerm");
    try {
      initialTerm = parseTerm(src);
    } catch(e) {
      if(e instanceof Error) {
        initialTerm = mkVar({ id: FreshId.next() }, e.message);
      }
    }
  } else if(params.has("size")) {
    let size = parseInt(params.get("size"));
    if(isNaN(size)) {
      size = 1;
    }
    initialTerm = findInterestingRandomTermOfSize(size);
  }

  const steps = smallSteps(initialTerm);

  const stepLayouts = steps.map(term => layout(ctx, termToWords(term)));

  // Draw the first layout now in case there's only one, and hence no
  // interpolations to draw.
  if(stepLayouts.length > 0) {
    drawLayout(ctx, stepLayouts[0]);
  }

  /** @type {LayoutInterpolation[]} */
  const interpolations = [];

  for(let i = 0; i < stepLayouts.length - 1; ++i) {
    interpolations.push(prepareToInterpolateLayouts(stepLayouts[i], stepLayouts[i + 1]));
  }

  /** @type {number} */
  let yScroll = 0;
  /** @type {number} */
  let curYScroll = 0;

  /** @type {number} */
  let step = 0;
  /** @type {number | null} */
  let lastT = null;
  /** @param time {number} */
  const frame = (time) => {
    const t = (time % frameDuration) / frameDuration;

    if(lastT > t) {
      // Then, it's time for the next frame.
      ++step;
      yScroll += curYScroll;
      curYScroll = 0;
    }

    if(step >= interpolations.length) {
      // If we've reached the last step, we don't need to schedule
      // any more animation frames.

      window.setTimeout(() => {
        window.location.reload();
      }, 5000);
      return;
    }

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw the previous steps
    let lastHeight = 0;
    let y = yScroll + curYScroll;
    for(let i = 0; i <= step; ++i) {
      const layout = stepLayouts[i];
      drawLayout(ctx, layout, y);
      lastHeight = layoutHeight(layout);
      y += lastHeight;
    }

    const thisHeight = layoutHeight(stepLayouts[step+1]);

    /** @type {((t: number) => void)[]} */
    const steps = [];

    if(y + thisHeight > ctx.canvas.height) {
      // Scroll if necessary.
      steps.push((t) => {
        curYScroll = -thisHeight * easeOutExpo(t);
      });
    }

    steps.push(
      (t) => {
        // First, copy the last step down.
        drawLayout(
          ctx,
          stepLayouts[step],
          lerp(y - lastHeight, y, 0, easeOutExpo(t), 1),
        );
      }, (t) => {
        // Then, show the move.
        drawInterpolatedLayout(ctx, interpolations[step], easeInOutExpo(t), y);
      }, (_t) => {
        // Then, show the finished move.
        drawLayout(ctx, stepLayouts[step+1], y);
      }
    );

    inSteps(t, ...steps);

    window.requestAnimationFrame(frame);
    lastT = t;
  };

  window.requestAnimationFrame(frame);
});
