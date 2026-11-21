(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.__agCsRippleCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  const RIPPLE = {
    fontSize: 10,
    cellWidth: 7,
    cellHeight: 15,
    changeRate: 2,
    digitRatio: 0.3,
    cloudScale: 100,
    cloudCoverage: 1,
    cloudSoftness: 0.1,
    cloudDrift: 8,
    idleAlphaLight: 0.172,
    idleAlphaDark: 0.13,
    speedNear: 1100,
    speedFar: 80,
    speedFalloff: 240,
    damping: 1,
    borderCells: 6,
    turbulence: 0.45,
    turbulenceScale: 180,
    sourceFrequency: 6,
    sourceRadius: 36,
    sourceAmplitude: 1.4,
    waveGain: 3.5,
    glowDecay: 1.2,
    glowAlpha: 0.3,
    waveAlpha: 0.85,
    patchScale: 60,
    patchFloor: 0.3,
    edgeFeather: 0.05,
    breathPeriod: 10.5,
    breathDepth: 0.24,
    breathScale: 280,
    calmAlpha: 0.45,
    calmFeather: 36,
    lightAlphaScale: 0.72,
    lightInkCool: [74, 90, 118],
    lightWaveCool: [37, 99, 235],
    lightCoolMix: 0.68,
    waveAlphaCap: 0.7,
    injectSoftness: 0.8,
    injectLoadDecay: 0.9,
    heightKnee: 0.9,
    heightCap: 1.6,

    auraTint: 0.48,
    auraLift: 0.78,
    prismTint: 0.68,
    prismCap: 0.74,
    prismBands: 3,
    prismSlopeScale: 60,
    prismThreshold: 0.20,
    nebulaTint: 0.58,
    nebulaLift: 1.08,
    nebulaFrameMs: 40,
    nebulaPeriods: [8.4, 10.8, 12.8],
  };
  const WAVE_STEP = 1 / 600;
  const MAX_ADVANCE = 0.05;
  const REST_HEIGHT = 0.003;
  const DIGITS = '0123456789';
  const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const GLYPHS = DIGITS + LETTERS;
  const COVERAGE_TO_THRESHOLD = 0.39;
  const INVISIBLE_ALPHA = 0.01;
  const TAU = Math.PI * 2;
  const SPECTRUM = [
    [66, 133, 244],
    [155, 114, 203],
    [234, 67, 53],
    [251, 188, 4],
  ];
  // 白昼高饱和宝石四色（Royal Cobalt #2563EB / Iris #7C3AED / Coral #EA4335 / Amber #D97706）
  const SPECTRUM_LIGHT = [
    [37, 99, 235],
    [124, 58, 237],
    [234, 67, 53],
    [217, 119, 6],
  ];
  const PRISM_LEVELS = 7;
  const HUE_LEVELS = 32;
  function hash(a, b) {
    let h = (a * 374761393 + b * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function valueNoise(x, y) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const top = hash(x0, y0) + (hash(x0 + 1, y0) - hash(x0, y0)) * sx;
    const bottom = hash(x0, y0 + 1) + (hash(x0 + 1, y0 + 1) - hash(x0, y0 + 1)) * sx;
    return top + (bottom - top) * sy;
  }
  function fractalNoise(x, y) {
    return (valueNoise(x, y) * 4 + valueNoise(x * 2.1 + 7, y * 2.1 + 3) * 2 + valueNoise(x * 4.3 + 13, y * 4.3 + 11)) / 7;
  }
  function glyphIndex(column, row, tick) {
    const digit = hash(column * 7 + tick * 13, row * 11 + tick * 3) < RIPPLE.digitRatio;
    const pick = hash(column * 131 + tick, row * 197 + tick * 7);
    return digit ? Math.floor(pick * DIGITS.length) : DIGITS.length + Math.floor(pick * LETTERS.length);
  }
  function smooth(value) {
    const clamped = Math.max(0, Math.min(1, value));
    return clamped * clamped * (3 - 2 * clamped);
  }
  function cloudClear(x, y) {
    const noise = fractalNoise(x / RIPPLE.cloudScale, y / RIPPLE.cloudScale);
    const threshold = 0.5 + (RIPPLE.cloudCoverage - 0.5) * COVERAGE_TO_THRESHOLD;
    const cloud = smooth((noise - threshold + RIPPLE.cloudSoftness) / (2 * RIPPLE.cloudSoftness));
    return 0.22 + 0.78 * cloud;
  }
  function patchClear(x, y) {
    const noise = fractalNoise(x / RIPPLE.patchScale + 31, y / RIPPLE.patchScale + 17);
    return RIPPLE.patchFloor + (1 - RIPPLE.patchFloor) * smooth((noise - 0.35) / 0.3);
  }
  const GLYPH_SPECTRA_DARK = {
    0: SPECTRUM,
    1: [
      [148, 74, 52],
      [217, 119, 87],
      [238, 155, 122],
      [246, 189, 96],
    ],
    2: [
      [27, 73, 178],
      [49, 134, 255],
      [92, 198, 252],
      [140, 224, 255],
    ],
    3: [
      [91, 33, 182],
      [139, 92, 246],
      [165, 138, 248],
      [221, 214, 254],
    ],
    4: [
      [146, 64, 14],
      [217, 119, 6],
      [242, 184, 75],
      [253, 230, 138],
    ],
    5: [
      [100, 116, 139],
      [148, 163, 184],
      [203, 213, 225],
      [241, 245, 249],
    ],
  };
  const GLYPH_SPECTRA_LIGHT = {
    0: SPECTRUM_LIGHT,
    1: [
      [154, 52, 18],
      [194, 89, 52],
      [217, 119, 87],
      [217, 119, 6],
    ],
    2: [
      [29, 78, 216],
      [37, 99, 235],
      [2, 132, 199],
      [56, 189, 248],
    ],
    3: [
      [76, 29, 149],
      [109, 40, 217],
      [124, 58, 237],
      [147, 51, 234],
    ],
    4: [
      [120, 53, 15],
      [180, 83, 9],
      [217, 119, 6],
      [234, 88, 12],
    ],
    5: [
      [30, 41, 59],
      [51, 65, 85],
      [71, 85, 105],
      [100, 116, 139],
    ],
  };
  function spectrumRgb(t, out, dark = true, spectrumCode = 0) {
    const bank = dark === false ? GLYPH_SPECTRA_LIGHT : GLYPH_SPECTRA_DARK;
    const stops = bank[spectrumCode] || (dark === false ? SPECTRUM_LIGHT : SPECTRUM);
    let f = (t - Math.floor(t)) * 4;
    const i = Math.min(3, Math.floor(f));
    f -= i;
    const a = stops[i];
    const b = stops[(i + 1) & 3];
    out[0] = a[0] + (b[0] - a[0]) * f;
    out[1] = a[1] + (b[1] - a[1]) * f;
    out[2] = a[2] + (b[2] - a[2]) * f;
    return out;
  }
  const HORIZON_SPECTRUM = [
    [15, 23, 58],
    [49, 134, 255],
    [92, 198, 252],
    [187, 226, 255],
  ];
  const NEBULA_PHASES = [0.35, 2.45, 4.55];
  const NEBULA_ANGLES = [2.85, 0.52, 4.62];
  const NEBULA_HUES = [0.04, 0.54, 0.80];
  function computeNebulaLobes(seconds, width, height, still, out) {
    const t = still ? 2.4 : seconds;
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    const diag = Math.sqrt(w * w + h * h);
    const periods = RIPPLE.nebulaPeriods || [8.4, 10.8, 12.8];
    for (let i = 0; i < 3; i++) {
      const period = Math.max(1, Number(periods[i]) || 10);
      const rawSin = 0.5 + 0.5 * Math.sin((TAU * t) / period + NEBULA_PHASES[i]);
      const env = rawSin * rawSin * (3 - 2 * rawSin);
      const strength = still ? 0.28 : 0.04 + 0.96 * Math.pow(env, 1.3);
      const dir = i === 1 ? -1 : 1;
      const ang = NEBULA_ANGLES[i] + 0.52 * Math.sin(t * (0.13 + i * 0.023) + i * 1.7) + dir * t * (0.045 + i * 0.006);
      const ringR = 0.34 + 0.045 * Math.cos(t * (0.11 + i * 0.019) + i * 1.1);
      const lobe = out[i];
      lobe.x = (0.5 + ringR * 1.06 * Math.cos(ang)) * w;
      lobe.y = (0.5 + ringR * 0.92 * Math.sin(ang)) * h;
      lobe.radius = diag * (0.29 + 0.06 * strength);
      lobe.strength = strength;
      const hue = NEBULA_HUES[i] + 0.14 * Math.sin(t * 0.09 + i * 2.1);
      lobe.hue = hue - Math.floor(hue);
    }
    return out;
  }
  function createWaveField(columns, rows, random = Math.random) {
    const cells = columns * rows;
    const height = new Float32Array(cells);
    const velocity = new Float32Array(cells);
    const speedSquared = new Float32Array(cells);
    const speedFactor = new Float32Array(cells);
    const damping = new Float32Array(cells);
    const seed = random() * 1000;
    const { cellWidth, cellHeight } = RIPPLE;
    const widthSquared = cellWidth * cellWidth;
    const heightSquared = cellHeight * cellHeight;
    const invW2 = 1 / widthSquared;
    const invH2 = 1 / heightSquared;
    const loadDecay = Math.exp(-WAVE_STEP / RIPPLE.injectLoadDecay);
    const wakeLoadDecay = Math.exp(-WAVE_STEP / 0.2);
    const knee = RIPPLE.heightKnee;
    const span = Math.max(0.01, RIPPLE.heightCap - RIPPLE.heightKnee);
    const sources = [];
    let moving = false;
    let behind = 0;
    let load = 0;
    let wakeLoad = 0;
    let baseSpeedPrimed = false;
    let actC0 = columns;
    let actC1 = -1;
    let actR0 = rows;
    let actR1 = -1;
    if (columns >= 32 && rows >= 16) {
      const gCols = Math.ceil(columns / 2) + 1;
      const gRows = Math.ceil(rows / 2) + 1;
      const coarse = new Float32Array(gCols * gRows);
      for (let gr = 0; gr < gRows; gr++) {
        const r = Math.min(rows - 1, gr * 2);
        const ny = (r * cellHeight) / RIPPLE.turbulenceScale + seed;
        for (let gc = 0; gc < gCols; gc++) {
          const c = Math.min(columns - 1, gc * 2);
          coarse[gr * gCols + gc] = fractalNoise((c * cellWidth) / RIPPLE.turbulenceScale + seed, ny);
        }
      }
      for (let row = 0; row < rows; row++) {
        const gr = row >> 1;
        const ty = (row & 1) * 0.5;
        const rowOff0 = gr * gCols;
        const rowOff1 = Math.min(gRows - 1, gr + 1) * gCols;
        for (let column = 0; column < columns; column++) {
          const cell = row * columns + column;
          const gc = column >> 1;
          const gc1 = Math.min(gCols - 1, gc + 1);
          const tx = (column & 1) * 0.5;
          const n0 = coarse[rowOff0 + gc] + (coarse[rowOff0 + gc1] - coarse[rowOff0 + gc]) * tx;
          const n1 = coarse[rowOff1 + gc] + (coarse[rowOff1 + gc1] - coarse[rowOff1 + gc]) * tx;
          const noise = n0 + (n1 - n0) * ty;
          speedFactor[cell] = Math.min(1.4, Math.max(0.3, 1 + RIPPLE.turbulence * (noise - 0.5) * 3.2));
          const edge = Math.min(column, row, columns - 1 - column, rows - 1 - row);
          const border = Math.max(0, 1 - edge / RIPPLE.borderCells) ** 2;
          damping[cell] = RIPPLE.damping + border * 12;
        }
      }
    } else {
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const cell = row * columns + column;
          const noise = fractalNoise((column * cellWidth) / RIPPLE.turbulenceScale + seed, (row * cellHeight) / RIPPLE.turbulenceScale + seed);
          speedFactor[cell] = Math.min(1.4, Math.max(0.3, 1 + RIPPLE.turbulence * (noise - 0.5) * 3.2));
          const edge = Math.min(column, row, columns - 1 - column, rows - 1 - row);
          const border = Math.max(0, 1 - edge / RIPPLE.borderCells) ** 2;
          damping[cell] = RIPPLE.damping + border * 12;
        }
      }
    }
    function primeFarBaseline() {
      if (baseSpeedPrimed) return;
      const far = RIPPLE.speedFar;
      for (let i = 0; i < cells; i++) {
        const s = far * speedFactor[i];
        const sq = s * s;
        if (sq > speedSquared[i]) speedSquared[i] = sq;
      }
      baseSpeedPrimed = true;
    }
    function raiseSpeeds(column, row) {
      primeFarBaseline();
      const nearMinusFar = RIPPLE.speedNear - RIPPLE.speedFar;
      const maxReachPx = RIPPLE.speedFalloff * 4.6;
      const maxReachSq = maxReachPx * maxReachPx;
      const reachCols = Math.ceil(maxReachPx / cellWidth);
      const reachRows = Math.ceil(maxReachPx / cellHeight);
      const r0 = Math.max(0, row - reachRows);
      const r1 = Math.min(rows - 1, row + reachRows);
      const c0 = Math.max(0, column - reachCols);
      const c1 = Math.min(columns - 1, column + reachCols);
      for (let r = r0; r <= r1; r++) {
        const dy = (r - row) * cellHeight;
        const dy2 = dy * dy;
        const rowBase = r * columns;
        for (let c = c0; c <= c1; c++) {
          const dx = (c - column) * cellWidth;
          const d2 = dx * dx + dy2;
          if (d2 > maxReachSq) continue;
          const cell = rowBase + c;
          const speed = (RIPPLE.speedFar + nearMinusFar * Math.exp(-Math.sqrt(d2) / RIPPLE.speedFalloff)) * speedFactor[cell];
          const squared = speed * speed;
          if (squared > speedSquared[cell]) speedSquared[cell] = squared;
        }
      }
    }
    function raiseWakeSpeeds(column, row, speedNorm) {
      primeFarBaseline();
      const wakeBoost = (RIPPLE.speedNear - RIPPLE.speedFar) * (0.14 + 0.14 * speedNorm);
      const reachPx = RIPPLE.speedFalloff * 0.65;
      const reachCols = Math.ceil(reachPx / cellWidth);
      const reachRows = Math.ceil(reachPx / cellHeight);
      const r0 = Math.max(0, row - reachRows);
      const r1 = Math.min(rows - 1, row + reachRows);
      const c0 = Math.max(0, column - reachCols);
      const c1 = Math.min(columns - 1, column + reachCols);
      for (let r = r0; r <= r1; r++) {
        const dy = (r - row) * cellHeight;
        const dy2 = dy * dy;
        for (let c = c0; c <= c1; c++) {
          const dx = (c - column) * cellWidth;
          const dist = Math.sqrt(dx * dx + dy2);
          if (dist > reachPx) continue;
          const cell = r * columns + c;
          const speed = (RIPPLE.speedFar + wakeBoost * Math.exp(-dist / (RIPPLE.speedFalloff * 0.55))) * speedFactor[cell];
          const squared = speed * speed;
          if (squared > speedSquared[cell]) speedSquared[cell] = squared;
        }
      }
    }
    function injectGain() {
      const k = RIPPLE.injectSoftness;
      const n = 1 + load;
      return Math.tanh(k * n) / (Math.tanh(k) * n);
    }
    function skimmerGain() {
      const k = 0.85;
      const n = 1 + wakeLoad;
      return Math.tanh(k * n) / (Math.tanh(k) * n);
    }
    function drive() {
      let keep = 0;
      for (let s = 0; s < sources.length; s++) {
        const source = sources[s];
        if (source.delay > 0) {
          source.delay -= WAVE_STEP;
          sources[keep++] = source;
          continue;
        }
        const freq = source.frequency || RIPPLE.sourceFrequency;
        const envelope = Math.sin((Math.PI * source.time) / source.duration);
        const rate = Math.cos(TAU * freq * source.time) * TAU * RIPPLE.sourceFrequency;
        const radius = RIPPLE.sourceRadius * source.radiusScale;
        const inv2r2 = 1 / (2 * radius * radius);
        const gain = RIPPLE.sourceAmplitude * source.amplitudeScale * envelope * rate * WAVE_STEP;
        const reachColumns = Math.ceil((radius * 3) / cellWidth);
        const reachRows = Math.ceil((radius * 3) / cellHeight);
        const r0 = Math.max(0, source.row - reachRows);
        const r1 = Math.min(rows - 1, source.row + reachRows);
        const c0 = Math.max(0, source.column - reachColumns);
        const c1 = Math.min(columns - 1, source.column + reachColumns);
        if (r0 < actR0) actR0 = r0;
        if (r1 > actR1) actR1 = r1;
        if (c0 < actC0) actC0 = c0;
        if (c1 > actC1) actC1 = c1;
        for (let r = r0; r <= r1; r++) {
          const dy = (r - source.row) * cellHeight;
          const dy2 = dy * dy;
          const rowBase = r * columns;
          for (let c = c0; c <= c1; c++) {
            const dx = (c - source.column) * cellWidth;
            const i = rowBase + c;
            let v = height[i] + gain * Math.exp(-(dx * dx + dy2) * inv2r2);
            const av = v < 0 ? -v : v;
            if (av > knee) v = (v < 0 ? -1 : 1) * (knee + span * Math.tanh((av - knee) / span));
            height[i] = v;
          }
        }
        source.time += WAVE_STEP;
        if (source.time < source.duration) sources[keep++] = source;
      }
      sources.length = keep;
    }
    function step() {
      let peak = 0;
      if (actC0 <= actC1 && actR0 <= actR1) {
        const rStart = Math.max(0, actR0 - 1);
        const rEnd = Math.min(rows - 1, actR1 + 1);
        const cStart = Math.max(0, actC0 - 1);
        const cEnd = Math.min(columns - 1, actC1 + 1);
        const decayMul = 1 - 0.35 * WAVE_STEP;
        for (let r = rStart; r <= rEnd; r++) {
          const rowBase = r * columns;
          const hasAbove = r > 0;
          const hasBelow = r < rows - 1;
          for (let c = cStart; c <= cEnd; c++) {
            const cell = rowBase + c;
            const here = height[cell];
            const left = c > 0 ? height[cell - 1] : here;
            const right = c < columns - 1 ? height[cell + 1] : here;
            const above = hasAbove ? height[cell - columns] : here;
            const below = hasBelow ? height[cell + columns] : here;
            const laplacian = (left + right - 2 * here) * invW2 + (above + below - 2 * here) * invH2;
            velocity[cell] += (speedSquared[cell] * laplacian - damping[cell] * velocity[cell]) * WAVE_STEP;
          }
        }
        let nC0 = columns;
        let nC1 = -1;
        let nR0 = rows;
        let nR1 = -1;
        for (let r = rStart; r <= rEnd; r++) {
          const rowBase = r * columns;
          for (let c = cStart; c <= cEnd; c++) {
            const cell = rowBase + c;
            const vel = velocity[cell];
            let h = (height[cell] + vel * WAVE_STEP) * decayMul;
            const a = h < 0 ? -h : h;
            const av = vel < 0 ? -vel : vel;
            if (a > peak) peak = a;
            if (a > 1e-5 || av > 5e-5) {
              height[cell] = h;
              if (c < nC0) nC0 = c;
              if (c > nC1) nC1 = c;
              if (r < nR0) nR0 = r;
              if (r > nR1) nR1 = r;
            } else if (h !== 0 || vel !== 0) {
              height[cell] = 0;
              velocity[cell] = 0;
            }
          }
        }
        actC0 = nC0;
        actC1 = nC1;
        actR0 = nR0;
        actR1 = nR1;
      }
      drive();
      if (peak === 0 && actC0 <= actC1) {
        for (let r = actR0; r <= actR1; r++) {
          const rowBase = r * columns;
          for (let c = actC0; c <= actC1; c++) {
            const a = Math.abs(height[rowBase + c]);
            if (a > peak) peak = a;
          }
        }
      }
      load *= loadDecay;
      wakeLoad *= wakeLoadDecay;
      moving = sources.length > 0 || peak > REST_HEIGHT;
      if (!moving) {
        if (actC0 <= actC1 && actR0 <= actR1) {
          for (let r = actR0; r <= actR1; r++) {
            const s = r * columns + actC0;
            const e = r * columns + actC1 + 1;
            height.fill(0, s, e);
            velocity.fill(0, s, e);
          }
        } else {
          height.fill(0);
          velocity.fill(0);
        }
        speedSquared.fill(0);
        load = 0;
        wakeLoad = 0;
        baseSpeedPrimed = false;
        actC0 = columns;
        actC1 = -1;
        actR0 = rows;
        actR1 = -1;
      }
    }
    return {
      height,
      active: () => moving,
      disturb(column, row, opts) {
        if (columns <= 0 || rows <= 0) return;
        if (!Number.isFinite(column) || !Number.isFinite(row)) return;
        const c = Math.max(0, Math.min(columns - 1, Math.floor(column)));
        const r = Math.max(0, Math.min(rows - 1, Math.floor(row)));
        const hasOpts = opts && typeof opts === 'object';
        if (hasOpts && opts.wake) {
          raiseWakeSpeeds(c, r, Number.isFinite(opts.speedNorm) ? Math.max(0, Math.min(1, opts.speedNorm)) : 0.5);
        } else {
          raiseSpeeds(c, r);
        }
        const duration = hasOpts && Number.isFinite(opts.duration) && opts.duration > 0
          ? opts.duration
          : (2 + Math.floor(random() * 2)) / RIPPLE.sourceFrequency;
        const radiusScale = hasOpts && Number.isFinite(opts.radiusScale) && opts.radiusScale > 0
          ? opts.radiusScale
          : 0.78 + random() * 0.92;
        const baseAmp = hasOpts && Number.isFinite(opts.amplitudeScale)
          ? Math.max(0, opts.amplitudeScale)
          : 0.78 + random() * 0.72;
        const frequency = hasOpts && Number.isFinite(opts.frequency) && opts.frequency > 0
          ? opts.frequency
          : RIPPLE.sourceFrequency;
        const loadWeight = hasOpts && Number.isFinite(opts.loadWeight)
          ? Math.max(0, opts.loadWeight)
          : 1;
        const delay = hasOpts && Number.isFinite(opts.delay) && opts.delay > 0
          ? opts.delay
          : 0;
        sources.push({
          column: c,
          row: r,
          time: 0,
          delay,
          duration,
          radiusScale,
          amplitudeScale: baseAmp * injectGain(),
          frequency,
          skimmer: false,
        });
        load += loadWeight;
        moving = true;
      },
      skimmer(column, row, speedNorm = 0.5) {
        if (columns <= 0 || rows <= 0) return;
        if (!Number.isFinite(column) || !Number.isFinite(row)) return;
        const c = Math.max(0, Math.min(columns - 1, Math.floor(column)));
        const r = Math.max(0, Math.min(rows - 1, Math.floor(row)));
        const s = Number.isFinite(Number(speedNorm)) ? Math.max(0, Math.min(1, Number(speedNorm))) : 0.5;
        raiseWakeSpeeds(c, r, s);
        const amp = (0.048 + 0.088 * s) * skimmerGain();
        const last = sources.length > 0 ? sources[sources.length - 1] : null;
        if (last && last.skimmer && Math.abs(last.column - c) <= 2 && Math.abs(last.row - r) <= 2 && last.time < 0.036) {
          last.column = c;
          last.row = r;
          last.amplitudeScale = Math.min(0.145, Math.max(last.amplitudeScale, amp));
          moving = true;
          return;
        }
        if (sources.length >= 24) {
          const dropIdx = sources.findIndex((src) => src.skimmer);
          if (dropIdx >= 0) sources.splice(dropIdx, 1);
        }
        const duration = 0.105;
        sources.push({
          column: c,
          row: r,
          time: 0,
          duration,
          radiusScale: 0.52,
          amplitudeScale: amp,
          frequency: 1.5 / duration,
          skimmer: true,
        });
        wakeLoad = Math.min(2.4, wakeLoad + 0.28);
        moving = true;
      },
      advance(seconds) {
        behind += Math.min(seconds, MAX_ADVANCE);
        while (behind >= WAVE_STEP) {
          step();
          behind -= WAVE_STEP;
        }
      },
    };
  }
  function parseCssColorToRgb(cssColor) {
    const s = String(cssColor || '').trim();
    if (!s) return null;
    if (s[0] === '#') {
      const hex = s.slice(1);
      if (hex.length === 3) {
        return [parseInt(hex[0] + hex[0], 16), parseInt(hex[1] + hex[1], 16), parseInt(hex[2] + hex[2], 16)];
      }
      if (hex.length >= 6) {
        return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
      }
    }
    const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(s);
    if (m) return [Math.round(Number(m[1])), Math.round(Number(m[2])), Math.round(Number(m[3]))];
    return null;
  }
  const VERTEX_SHADER = `#version 300 es
void main() {
vec2 corner = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}`;

  const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D cells;
uniform sampler2D atlas;
uniform vec2 size;
uniform vec2 grid;
uniform vec2 cellPixels;
uniform vec2 atlasCell;
uniform float glyphCount;
uniform vec3 ink;
uniform vec3 wave;
uniform vec4 aura;
uniform vec4 optics;
uniform float auraLift;
uniform float auraPhase;
uniform float lightMode;
uniform vec4 neb0;
uniform vec4 neb1;
uniform vec4 neb2;
uniform vec4 nebOpt;
uniform float nebulaLift;
uniform float spectrumMode;
out vec4 color;
const vec3 COBALT = vec3(66.0 / 255.0, 133.0 / 255.0, 244.0 / 255.0);
const vec3 IRIS = vec3(155.0 / 255.0, 114.0 / 255.0, 203.0 / 255.0);
const vec3 CORAL = vec3(234.0 / 255.0, 67.0 / 255.0, 53.0 / 255.0);
const vec3 AMBER = vec3(251.0 / 255.0, 188.0 / 255.0, 4.0 / 255.0);
const vec3 COBALT_L = vec3(37.0 / 255.0, 99.0 / 255.0, 235.0 / 255.0);
const vec3 IRIS_L = vec3(124.0 / 255.0, 58.0 / 255.0, 237.0 / 255.0);
const vec3 CORAL_L = vec3(234.0 / 255.0, 67.0 / 255.0, 53.0 / 255.0);
const vec3 AMBER_L = vec3(217.0 / 255.0, 119.0 / 255.0, 6.0 / 255.0);
vec3 spectrum(float t, float light, float mode) {
float f = fract(t) * 4.0;
vec3 c0 = COBALT; vec3 c1 = IRIS; vec3 c2 = CORAL; vec3 c3 = AMBER;
vec3 l0 = COBALT_L; vec3 l1 = IRIS_L; vec3 l2 = CORAL_L; vec3 l3 = AMBER_L;
if (mode > 4.5) {
c0 = vec3(0.392, 0.455, 0.545); c1 = vec3(0.580, 0.639, 0.722); c2 = vec3(0.796, 0.835, 0.882); c3 = vec3(0.945, 0.961, 0.976);
l0 = vec3(0.118, 0.161, 0.231); l1 = vec3(0.200, 0.255, 0.333); l2 = vec3(0.278, 0.333, 0.412); l3 = vec3(0.392, 0.455, 0.545);
} else if (mode > 3.5) {
c0 = vec3(0.573, 0.251, 0.055); c1 = vec3(0.851, 0.467, 0.024); c2 = vec3(0.949, 0.722, 0.294); c3 = vec3(0.992, 0.902, 0.541);
l0 = vec3(0.471, 0.208, 0.059); l1 = vec3(0.706, 0.325, 0.035); l2 = vec3(0.851, 0.467, 0.024); l3 = vec3(0.918, 0.345, 0.047);
} else if (mode > 2.5) {
c0 = vec3(0.357, 0.129, 0.714); c1 = vec3(0.545, 0.361, 0.965); c2 = vec3(0.647, 0.541, 0.973); c3 = vec3(0.867, 0.839, 0.996);
l0 = vec3(0.298, 0.114, 0.584); l1 = vec3(0.427, 0.157, 0.851); l2 = vec3(0.486, 0.227, 0.929); l3 = vec3(0.576, 0.200, 0.918);
} else if (mode > 1.5) {
c0 = vec3(0.106, 0.286, 0.698); c1 = vec3(0.192, 0.525, 1.000); c2 = vec3(0.361, 0.776, 0.988); c3 = vec3(0.549, 0.878, 1.000);
l0 = vec3(0.114, 0.306, 0.847); l1 = vec3(0.145, 0.388, 0.922); l2 = vec3(0.008, 0.518, 0.780); l3 = vec3(0.220, 0.741, 0.973);
} else if (mode > 0.5) {
c0 = vec3(0.580, 0.290, 0.204); c1 = vec3(0.851, 0.467, 0.341); c2 = vec3(0.933, 0.608, 0.478); c3 = vec3(0.965, 0.741, 0.376);
l0 = vec3(0.604, 0.204, 0.071); l1 = vec3(0.761, 0.349, 0.204); l2 = vec3(0.851, 0.467, 0.341); l3 = vec3(0.851, 0.467, 0.024);
}
vec3 d;
vec3 l;
if (f < 1.0) { d = mix(c0, c1, f); l = mix(l0, l1, f); }
else if (f < 2.0) { d = mix(c1, c2, f - 1.0); l = mix(l1, l2, f - 1.0); }
else if (f < 3.0) { d = mix(c2, c3, f - 2.0); l = mix(l2, l3, f - 2.0); }
else { d = mix(c3, c0, f - 3.0); l = mix(l3, l0, f - 3.0); }
return mix(d, l, light);
}
void main() {
vec2 position = vec2(gl_FragCoord.x, size.y - gl_FragCoord.y);
vec2 cell = min(floor(position / cellPixels), grid - 1.0);
vec4 data = texelFetch(cells, ivec2(cell), 0);
if (data.g <= 0.0) { color = vec4(0.0); return; }
vec2 local = position - cell * cellPixels;
float glyph = floor(data.r * 255.0 + 0.5);
vec2 inAtlas = vec2(glyph * atlasCell.x + local.x * atlasCell.x / cellPixels.x, local.y * atlasCell.y / cellPixels.y);
float coverage = texture(atlas, inAtlas / vec2(glyphCount * atlasCell.x, atlasCell.y)).a;
if (coverage <= 0.001) { color = vec4(0.0); return; }
vec3 rgb = mix(ink, wave, data.b);
float alpha = data.g;
float packed = floor(data.a * 255.0 + 0.5);
float level = floor(packed / 32.0);
float prismAmt = level / 7.0;
float hue = (packed - level * 32.0) / 32.0;
float wAura = 0.0;
vec3 auraRgb = COBALT;
if (aura.w > 0.001) {
vec2 rel = position - aura.xy;
float ar = max(1.0, aura.z);
if (abs(rel.x) < ar && abs(rel.y) < ar) {
float d2 = dot(rel, rel);
if (d2 < ar * ar) {
float rNorm = sqrt(d2) / ar;
float u = 1.0 - rNorm;
float s = u * u * (3.0 - 2.0 * u);
wAura = s * (0.35 + 0.65 * s);
float ang = atan(rel.y, rel.x + 1e-5) * 0.15915494 + 0.5;
auraRgb = spectrum(ang - rNorm * 0.45 + auraPhase, lightMode, spectrumMode);
}
}
}
float wNeb = 0.0;
vec3 nebAcc = vec3(0.0);
for (int i = 0; i < 3; i++) {
vec4 nb = i == 0 ? neb0 : (i == 1 ? neb1 : neb2);
float nh = i == 0 ? nebOpt.x : (i == 1 ? nebOpt.y : nebOpt.z);
if (nb.w > 0.001) {
vec2 nr = position - nb.xy;
float rad = max(1.0, nb.z);
if (abs(nr.x) < rad && abs(nr.y) < rad) {
float nd2 = dot(nr, nr);
if (nd2 < rad * rad) {
float rn = sqrt(nd2) / rad;
float u = 1.0 - rn;
float s = u * u * (3.0 - 2.0 * u);
float wi = s * (0.30 + 0.70 * s) * nb.w;
float nang = atan(nr.y, nr.x + 1e-5) * 0.15915494;
wNeb += wi;
nebAcc += spectrum(nh + nang * 0.22 - rn * 0.26, lightMode, spectrumMode) * wi;
}
}
}
}
vec3 nebRgb = wNeb > 0.0001 ? nebAcc / wNeb : COBALT;
float wNebC = min(1.0, wNeb);
float nebT = wNebC * nebOpt.w;
float auraT = wAura * optics.x * aura.w;
float prismT = prismAmt * optics.y * optics.w * (0.88 + 0.12 * wAura);
float total = auraT + prismT + nebT;
if (lightMode > 0.5) {
alpha = min(0.88, alpha * (1.0 + (auraLift + 0.72) * wAura * aura.w + prismT * 0.62 + nebulaLift * 0.66 * wNebC));
} else if (wAura > 0.0 || wNebC > 0.0) {
alpha = min(1.0, alpha * (1.0 + auraLift * wAura * aura.w + nebulaLift * wNebC));
}
if (total > 0.0001) {
float capped = min(optics.z, total);
float mixAmt = mix(capped, min(0.96, capped * 1.36), lightMode);
vec3 tintRgb = (auraRgb * auraT + spectrum(hue, lightMode, spectrumMode) * prismT + nebRgb * nebT) / total;
rgb = mix(rgb, tintRgb, mixAmt);
}
float a = alpha * coverage;
color = vec4(rgb * a, a);
}`;
  function readAura(palette) {
    const cfg = palette.aura && palette.aura.active ? palette.aura : null;
    return {
      x: cfg ? Number(cfg.x || 0) : 0,
      y: cfg ? Number(cfg.y || 0) : 0,
      radius: cfg ? Math.max(1, Number(cfg.radius || 230)) : 230,
      strength: cfg ? Math.max(0, Math.min(1, Number(cfg.strength ?? 1))) : 0,
    };
  }
  function createWebGL2Renderer(canvas, columns, rows) {
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: false });
    if (!gl) return null;
    const atlasCanvas = canvas.ownerDocument.createElement('canvas');
    const atlasContext = atlasCanvas.getContext('2d');
    if (!atlasContext) return null;
    const data = new Uint8Array(columns * rows * 4);
    let program, cellTexture, atlasTexture, uniforms, atlasKey = '';
    function compile(type, source) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader compile error');
      return sh;
    }
    function createTex(unit, filter) {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tex;
    }
    function build() {
      program = gl.createProgram();
      const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
      const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (typeof gl.deleteShader === 'function') {
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      }
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'program link error');
      gl.useProgram(program);
      uniforms = {};
      for (const name of ['cells', 'atlas', 'size', 'grid', 'cellPixels', 'atlasCell', 'glyphCount', 'ink', 'wave', 'aura', 'optics', 'auraLift', 'auraPhase', 'lightMode', 'neb0', 'neb1', 'neb2', 'nebOpt', 'nebulaLift', 'spectrumMode']) {
        uniforms[name] = gl.getUniformLocation(program, name);
      }
      cellTexture = createTex(0, gl.NEAREST);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, columns, rows);
      atlasTexture = createTex(1, gl.LINEAR);
      gl.uniform1i(uniforms.cells, 0);
      gl.uniform1i(uniforms.atlas, 1);
      atlasKey = '';
    }
    function buildAtlas(font, dpr) {
      const key = font + '|' + dpr;
      if (key === atlasKey) return;
      const width = Math.ceil(RIPPLE.cellWidth * dpr);
      const height = Math.ceil(RIPPLE.cellHeight * dpr);
      atlasCanvas.width = width * GLYPHS.length;
      atlasCanvas.height = height;
      atlasContext.setTransform(width / RIPPLE.cellWidth, 0, 0, height / RIPPLE.cellHeight, 0, 0);
      atlasContext.clearRect(0, 0, RIPPLE.cellWidth * GLYPHS.length, RIPPLE.cellHeight);
      atlasContext.font = `${RIPPLE.fontSize}px ${font}`;
      atlasContext.textBaseline = 'middle';
      atlasContext.textAlign = 'center';
      atlasContext.fillStyle = '#fff';
      for (let i = 0; i < GLYPHS.length; i++) {
        atlasContext.fillText(GLYPHS[i], i * RIPPLE.cellWidth + RIPPLE.cellWidth / 2, RIPPLE.cellHeight / 2);
      }
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasCanvas);
      gl.uniform2f(uniforms.atlasCell, width, height);
      gl.uniform1f(uniforms.glyphCount, GLYPHS.length);
      atlasKey = key;
    }
    build();
    return {
      mode: 'webgl2',
      data,
      build,
      draw(palette, dpr, uploadCells = true) {
        buildAtlas(palette.fontFamily, dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uniforms.size, canvas.width, canvas.height);
        gl.uniform2f(uniforms.grid, columns, rows);
        gl.uniform2f(uniforms.cellPixels, RIPPLE.cellWidth * dpr, RIPPLE.cellHeight * dpr);
        gl.uniform3f(uniforms.ink, palette.ink[0] / 255, palette.ink[1] / 255, palette.ink[2] / 255);
        gl.uniform3f(uniforms.wave, palette.wave[0] / 255, palette.wave[1] / 255, palette.wave[2] / 255);
        const aura = readAura(palette);
        const amb = Number.isFinite(Number(palette.ambientIntensity)) ? Math.max(0, Math.min(1, Number(palette.ambientIntensity))) : 1;
        const specCode = Number(palette.spectrumCode ?? 0);
        gl.uniform4f(uniforms.aura, aura.x * dpr, aura.y * dpr, aura.radius * dpr, aura.strength * amb);
        gl.uniform4f(uniforms.optics, RIPPLE.auraTint * (specCode === 5 ? 0.55 : 1), RIPPLE.prismTint * (specCode === 5 ? 0.45 : 1), RIPPLE.prismCap, palette.prismStrength);
        gl.uniform1f(uniforms.auraLift, RIPPLE.auraLift * amb);
        gl.uniform1f(uniforms.auraPhase, palette.auraPhase || 0);
        gl.uniform1f(uniforms.lightMode, palette.dark === false ? 1 : 0);
        gl.uniform1f(uniforms.spectrumMode, specCode);
        const neb = palette.nebula;
        const n0 = neb && neb[0];
        const n1 = neb && neb[1];
        const n2 = neb && neb[2];
        gl.uniform4f(uniforms.neb0, n0 ? n0.x * dpr : 0, n0 ? n0.y * dpr : 0, n0 ? n0.radius * dpr : 1, n0 ? n0.strength * amb : 0);
        gl.uniform4f(uniforms.neb1, n1 ? n1.x * dpr : 0, n1 ? n1.y * dpr : 0, n1 ? n1.radius * dpr : 1, n1 ? n1.strength * amb : 0);
        gl.uniform4f(uniforms.neb2, n2 ? n2.x * dpr : 0, n2 ? n2.y * dpr : 0, n2 ? n2.radius * dpr : 1, n2 ? n2.strength * amb : 0);
        gl.uniform4f(uniforms.nebOpt, n0 ? n0.hue : 0, n1 ? n1.hue : 0, n2 ? n2.hue : 0, RIPPLE.nebulaTint * amb * (specCode === 5 ? 0.45 : 1));
        gl.uniform1f(uniforms.nebulaLift, RIPPLE.nebulaLift * amb);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, cellTexture);
        if (uploadCells !== false) {
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, columns, rows, gl.RGBA, gl.UNSIGNED_BYTE, data);
        }
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
      dispose() {
        gl.deleteProgram(program);
        gl.deleteTexture(cellTexture);
        gl.deleteTexture(atlasTexture);
      },
    };
  }
  const LITTLE_ENDIAN = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
  function create2DRenderer(canvas, columns, rows) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const doc = canvas.ownerDocument;
    const atlas = doc && doc.createElement ? doc.createElement('canvas') : null;
    const atlasCtx = atlas ? atlas.getContext('2d', { willReadFrequently: true }) : null;
    if (!atlasCtx) return null;
    const data = new Uint8Array(columns * rows * 4);
    const auraTintRgb = [0, 0, 0];
    const prismTintRgb = [0, 0, 0];
    const nebSampleRgb = [0, 0, 0];
    const nebLobeScaled = [
      { x: 0, y: 0, r: 1, r2: 1, s: 0, hue: 0 },
      { x: 0, y: 0, r: 1, r2: 1, s: 0, hue: 0 },
      { x: 0, y: 0, r: 1, r2: 1, s: 0, hue: 0 },
    ];
    let mask = null;
    let atlasKey = '';
    let gw = 1;
    let gh = 1;
    let image = null;
    let pixels = null;
    function buildAtlas(font, dpr) {
      const key = font + '|' + dpr;
      if (key === atlasKey && mask) return;
      const { cellWidth, cellHeight } = RIPPLE;
      gw = Math.max(1, Math.ceil(cellWidth * dpr));
      gh = Math.max(1, Math.ceil(cellHeight * dpr));
      atlas.width = gw * GLYPHS.length;
      atlas.height = gh;
      atlasCtx.setTransform(gw / cellWidth, 0, 0, gh / cellHeight, 0, 0);
      atlasCtx.clearRect(0, 0, cellWidth * GLYPHS.length, cellHeight);
      atlasCtx.font = `${RIPPLE.fontSize}px ${font}`;
      atlasCtx.textBaseline = 'middle';
      atlasCtx.textAlign = 'center';
      atlasCtx.fillStyle = '#fff';
      for (let i = 0; i < GLYPHS.length; i++) {
        atlasCtx.fillText(GLYPHS[i], i * cellWidth + cellWidth / 2, cellHeight / 2);
      }
      const src = atlasCtx.getImageData(0, 0, atlas.width, gh).data;
      const stride = atlas.width;
      mask = new Uint8Array(GLYPHS.length * gw * gh);
      for (let g = 0; g < GLYPHS.length; g++) {
        for (let y = 0; y < gh; y++) {
          for (let x = 0; x < gw; x++) {
            mask[(g * gh + y) * gw + x] = src[(y * stride + g * gw + x) * 4 + 3];
          }
        }
      }
      atlasKey = key;
    }
    function ensureImage() {
      if (!image || image.width !== canvas.width || image.height !== canvas.height) {
        image = ctx.createImageData(Math.max(1, canvas.width), Math.max(1, canvas.height));
        pixels = new Uint32Array(image.data.buffer);
      }
    }
    return {
      mode: '2d',
      data,
      build() { atlasKey = ''; },
      draw(palette, dpr) {
        buildAtlas(palette.fontFamily, dpr);
        ensureImage();
        pixels.fill(0);
        const W = image.width;
        const H = image.height;
        const ink = palette.ink;
        const wave = palette.wave;
        const isLight = palette.dark === false;
        const amb = Number.isFinite(Number(palette.ambientIntensity)) ? Math.max(0, Math.min(1, Number(palette.ambientIntensity))) : 1;
        const specCode = Number(palette.spectrumCode ?? 0);
        const aura = readAura(palette);
        const auraStrength = aura.strength * amb;
        const auraOn = auraStrength > 0.001;
        const auraPhase = palette.auraPhase || 0;
        const ax = aura.x * dpr;
        const ay = aura.y * dpr;
        const ar = aura.radius * dpr;
        const ar2 = ar * ar;
        const nebSrc = amb > 0.001 ? palette.nebula : null;
        let nebActiveCount = 0;
        for (let i = 0; i < 3; i++) {
          const srcLobe = nebSrc && nebSrc[i];
          const dstLobe = nebLobeScaled[i];
          if (srcLobe && srcLobe.strength * amb > 0.001) {
            dstLobe.x = srcLobe.x * dpr;
            dstLobe.y = srcLobe.y * dpr;
            dstLobe.r = Math.max(1, srcLobe.radius * dpr);
            dstLobe.r2 = dstLobe.r * dstLobe.r;
            dstLobe.s = srcLobe.strength * amb;
            dstLobe.hue = srcLobe.hue;
            nebActiveCount++;
          } else {
            dstLobe.s = 0;
          }
        }
        const auraTintScale = RIPPLE.auraTint * (specCode === 5 ? 0.55 : 1);
        const nebTintScale = RIPPLE.nebulaTint * amb * (specCode === 5 ? 0.45 : 1);
        const nebLiftScale = RIPPLE.nebulaLift * amb;
        const prismGain = RIPPLE.prismTint * palette.prismStrength * (specCode === 5 ? 0.45 : 1);
        const stepX = RIPPLE.cellWidth * dpr;
        const stepY = RIPPLE.cellHeight * dpr;
        const cellArea = gw * gh;
        for (let r = 0; r < rows; r++) {
          const dy0 = Math.round(r * stepY);
          if (dy0 >= H) break;
          const hRows = Math.min(gh, H - dy0);
          const cyPx = r * stepY + stepY / 2;
          const py = cyPx - ay;
          const py2 = py * py;
          const ndy0 = cyPx - nebLobeScaled[0].y;
          const ndy1 = cyPx - nebLobeScaled[1].y;
          const ndy2 = cyPx - nebLobeScaled[2].y;
          const ndy02 = ndy0 * ndy0;
          const ndy12 = ndy1 * ndy1;
          const ndy22 = ndy2 * ndy2;
          for (let c = 0; c < columns; c++) {
            const at = (r * columns + c) * 4;
            let alpha = data[at + 1] / 255;
            if (alpha <= 0) continue;
            const mixT = data[at + 2] / 255;
            let cr = ink[0] + (wave[0] - ink[0]) * mixT;
            let cg = ink[1] + (wave[1] - ink[1]) * mixT;
            let cb = ink[2] + (wave[2] - ink[2]) * mixT;
            const packed = data[at + 3];
            const cxPx = c * stepX + stepX / 2;
            let wAura = 0;
            let auraT = 0;
            let auraHue = 0;
            if (auraOn) {
              const px = cxPx - ax;
              const d2 = px * px + py2;
              if (d2 < ar2) {
                const rNorm = Math.sqrt(d2) / ar;
                const u = 1 - rNorm;
                const s = u * u * (3 - 2 * u);
                wAura = s * (0.35 + 0.65 * s);
                auraT = wAura * auraTintScale * auraStrength;
                const ang = Math.atan2(py, px + 1e-5) / TAU + 0.5;
                auraHue = ang - rNorm * 0.45 + auraPhase;
              }
            }
            let wNeb = 0;
            let nebR = 0;
            let nebG = 0;
            let nebB = 0;
            if (nebActiveCount > 0) {
              for (let i = 0; i < 3; i++) {
                const lb = nebLobeScaled[i];
                if (lb.s <= 0) continue;
                const ndx = cxPx - lb.x;
                const ndy = i === 0 ? ndy0 : (i === 1 ? ndy1 : ndy2);
                const nd2 = ndx * ndx + (i === 0 ? ndy02 : (i === 1 ? ndy12 : ndy22));
                if (nd2 < lb.r2) {
                  const rn = Math.sqrt(nd2) / lb.r;
                  const u = 1 - rn;
                  const s = u * u * (3 - 2 * u);
                  const wi = s * (0.30 + 0.70 * s) * lb.s;
                  const nang = Math.atan2(ndy, ndx + 1e-5) / TAU;
                  spectrumRgb(lb.hue + nang * 0.22 - rn * 0.26, nebSampleRgb, !isLight, specCode);
                  wNeb += wi;
                  nebR += nebSampleRgb[0] * wi;
                  nebG += nebSampleRgb[1] * wi;
                  nebB += nebSampleRgb[2] * wi;
                }
              }
            }
            const wNebC = wNeb > 1 ? 1 : wNeb;
            const nebT = wNebC * nebTintScale;
            const prismT = packed > 31 ? ((packed >> 5) / PRISM_LEVELS) * prismGain * (0.88 + 0.12 * wAura) : 0;
            if (isLight) {
              alpha = Math.min(0.88, alpha * (1 + (RIPPLE.auraLift + 0.72) * wAura * auraStrength + prismT * 0.62 + nebLiftScale * 0.66 * wNebC));
            } else if (wAura > 0 || wNebC > 0) {
              alpha = Math.min(1, alpha * (1 + RIPPLE.auraLift * wAura * auraStrength + nebLiftScale * wNebC));
            }
            const total = auraT + prismT + nebT;
            if (total > 0.0001) {
              const capped = Math.min(RIPPLE.prismCap, total);
              const mixAmt = isLight ? Math.min(0.96, capped * 1.36) : capped;
              if (auraT > 0) spectrumRgb(auraHue, auraTintRgb, !isLight, specCode);
              if (prismT > 0) spectrumRgb((packed & 31) / HUE_LEVELS, prismTintRgb, !isLight, specCode);
              const nr = wNeb > 0.0001 ? nebR / wNeb : 0;
              const ng = wNeb > 0.0001 ? nebG / wNeb : 0;
              const nb = wNeb > 0.0001 ? nebB / wNeb : 0;
              const tr = (auraTintRgb[0] * auraT + prismTintRgb[0] * prismT + nr * nebT) / total;
              const tg = (auraTintRgb[1] * auraT + prismTintRgb[1] * prismT + ng * nebT) / total;
              const tb = (auraTintRgb[2] * auraT + prismTintRgb[2] * prismT + nb * nebT) / total;
              cr += (tr - cr) * mixAmt;
              cg += (tg - cg) * mixAmt;
              cb += (tb - cb) * mixAmt;
            }
            const a8 = Math.round(alpha * 256);
            const R = Math.round(cr) & 255;
            const G = Math.round(cg) & 255;
            const B = Math.round(cb) & 255;
            const rgb = LITTLE_ENDIAN ? (B << 16) | (G << 8) | R : (R << 24) | (G << 16) | (B << 8);
            const dx0 = Math.round(c * stepX);
            if (dx0 >= W) continue;
            const wCols = Math.min(gw, W - dx0);
            const m0 = (data[at] % GLYPHS.length) * cellArea;
            let o = dy0 * W + dx0;
            for (let y = 0, m = m0; y < hRows; y++, m += gw, o += W) {
              for (let x = 0; x < wCols; x++) {
                const v = mask[m + x];
                if (v === 0) continue;
                const av = (v * a8) >> 8;
                pixels[o + x] = LITTLE_ENDIAN ? ((av << 24) | rgb) >>> 0 : (rgb | av) >>> 0;
              }
            }
          }
        }
        ctx.putImageData(image, 0, 0);
      },
      dispose() {},
    };
  }
  function normalizeZones(zones) {
    if (!Array.isArray(zones)) return [];
    const out = [];
    for (const z of zones) {
      if (!z) continue;
      const x = Number(z.x);
      const y = Number(z.y);
      const w = Number(z.w ?? z.width);
      const h = Number(z.h ?? z.height);
      if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) continue;
      out.push({
        x,
        y,
        w,
        h,
        alpha: Number.isFinite(Number(z.alpha)) ? Math.max(0, Math.min(1, Number(z.alpha))) : RIPPLE.calmAlpha,
        feather: Number.isFinite(Number(z.feather)) ? Math.max(1, Number(z.feather)) : RIPPLE.calmFeather,
      });
    }
    return out;
  }
  function zonesKey(list) {
    let key = '';
    for (const z of list) key += `${Math.round(z.x)},${Math.round(z.y)},${Math.round(z.w)},${Math.round(z.h)},${z.alpha},${z.feather};`;
    return key;
  }
  function clampFinite(val, fallback, min, max) {
    const n = Number(val);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  }
  function isCanvasDocHidden(canvas) {
    const owner = canvas && canvas.ownerDocument;
    if (owner && typeof owner.hidden === 'boolean') return owner.hidden;
    return typeof document !== 'undefined' && Boolean(document && document.hidden === true);
  }
  function createGlyphField(canvas, columns, rows, waves, options) {
    const force2D = typeof globalThis !== 'undefined' && globalThis.__agRippleForce2D === true;
    const renderer = (columns > 0 && rows > 0)
      ? ((force2D ? null : createWebGL2Renderer(canvas, columns, rows)) || create2DRenderer(canvas, columns, rows))
      : null;
    const { cellWidth, cellHeight } = RIPPLE;
    const cells = columns * rows;
    const glow = new Float32Array(cells);
    const patch = new Float32Array(cells);
    const glyphs = new Uint8Array(cells);
    const edge = new Float32Array(cells);
    const mask = new Float32Array(cells);
    const breathSin = new Float32Array(cells);
    const breathCos = new Float32Array(cells);
    const wasLit = new Uint8Array(cells);
    let lastIdleRefreshMs = -Infinity;
    let lastIdleDark = null;
    const cloudColumns = new Map();
    const nebulaState = [
      { x: 0, y: 0, radius: 1, strength: 0, hue: 0 },
      { x: 0, y: 0, radius: 1, strength: 0, hue: 0 },
      { x: 0, y: 0, radius: 1, strength: 0, hue: 0 },
    ];
    const effective = { dark: true, ink: [0, 0, 0], wave: [0, 0, 0], fontFamily: 'monospace', aura: null, nebula: nebulaState, prismStrength: 1, auraPhase: 0, ambientIntensity: 1, spectrumCode: 0 };
    let lastNebulaEnabled = true;
    let instanceZones = normalizeZones(options && options.calmZones);
    let appliedKey = null;
    let lastZonesRef = null;
    let lastZonesNormalized = [];
    let lastTick = -1;
    let lastDraw = -Infinity;
    let glowing = false;
    let prismBurst = 0;
    let stale = true;
    const colClouds = new Array(Math.max(0, columns));
    const featherCols = Math.max(1, columns * RIPPLE.edgeFeather);
    const featherRows = Math.max(1, rows * RIPPLE.edgeFeather);
    for (let row = 0; row < rows; row++) {
      const y = row * cellHeight + cellHeight / 2;
      const ey = smooth((Math.min(row, rows - 1 - row) + 0.5) / featherRows);
      const rowBase = row * columns;
      for (let column = 0; column < columns; column++) {
        const cell = rowBase + column;
        const x = column * cellWidth + cellWidth / 2;
        patch[cell] = patchClear(x, y);
        const ex = smooth((Math.min(column, columns - 1 - column) + 0.5) / featherCols);
        edge[cell] = ex * ey;
        mask[cell] = edge[cell];
        const phase = fractalNoise(x / RIPPLE.breathScale + 53, y / RIPPLE.breathScale + 71) * TAU * 1.7;
        breathSin[cell] = Math.sin(phase);
        breathCos[cell] = Math.cos(phase);
      }
    }
    function applyZones(list) {
      const key = zonesKey(list);
      if (key === appliedKey) return;
      appliedKey = key;
      for (let row = 0; row < rows; row++) {
        const y = row * cellHeight + cellHeight / 2;
        for (let column = 0; column < columns; column++) {
          const cell = row * columns + column;
          const x = column * cellWidth + cellWidth / 2;
          let calm = 1;
          for (let i = 0; i < list.length; i++) {
            const z = list[i];
            const dx = Math.max(z.x - x, 0, x - (z.x + z.w));
            const dy = Math.max(z.y - y, 0, y - (z.y + z.h));
            const signed = dx > 0 || dy > 0
              ? Math.sqrt(dx * dx + dy * dy)
              : -Math.min(x - z.x, z.x + z.w - x, y - z.y, z.y + z.h - y);
            if (signed >= z.feather) continue;
            const inset = z.feather * 0.35;
            const t = smooth((signed + inset) / (z.feather + inset));
            const f = z.alpha + (1 - z.alpha) * t;
            if (f < calm) calm = f;
          }
          mask[cell] = edge[cell] * calm;
        }
      }
      stale = true;
    }
    function resolveZones(palette) {
      const source = palette && Array.isArray(palette.calmZones) ? palette.calmZones : null;
      if (!source) return instanceZones;
      if (source !== lastZonesRef) {
        lastZonesRef = source;
        lastZonesNormalized = normalizeZones(source);
      }
      return lastZonesNormalized;
    }
    function onContextLost(e) { e.preventDefault(); }
    function onContextRestored() {
      if (renderer) renderer.build();
      stale = true;
    }
    if (canvas && canvas.addEventListener) {
      canvas.addEventListener('webglcontextlost', onContextLost);
      canvas.addEventListener('webglcontextrestored', onContextRestored);
    }
    function tickAt(now, still) {
      return still ? 0 : Math.floor((now / 1000) * RIPPLE.changeRate);
    }
    function cloudColumn(absolute) {
      let col = cloudColumns.get(absolute);
      if (!col) {
        col = new Float32Array(rows);
        for (let row = 0; row < rows; row++) {
          col[row] = cloudClear(absolute * cellWidth + cellWidth / 2, row * cellHeight + cellHeight / 2);
        }
        cloudColumns.set(absolute, col);
      }
      return col;
    }
    function prepareEffective(palette, seconds, still) {
      const dark = palette.dark !== false;
      const rawSpec = palette.spectrum ?? palette.accentTone ?? palette.accent;
      const specCode =
        rawSpec !== undefined && rawSpec !== null
          ? resolveHorizonSpectrumCode(rawSpec)
          : detectHostSpectrumCode(canvas, dark);
      const ambient =
        palette.ambientIntensity !== undefined
          ? clampFinite(palette.ambientIntensity, 1, 0, 1)
          : 1;
      const ink = palette.ink || [146, 148, 156];
      const wave = palette.wave || [214, 218, 228];
      const useCoolLightMix = !dark && (specCode === 0 || specCode === 2);
      const mix = useCoolLightMix ? RIPPLE.lightCoolMix : 0;
      for (let i = 0; i < 3; i++) {
        effective.ink[i] = Math.round(ink[i] + (RIPPLE.lightInkCool[i] - ink[i]) * mix);
        effective.wave[i] = Math.round(wave[i] + (RIPPLE.lightWaveCool[i] - wave[i]) * mix * 0.65);
      }
      effective.dark = dark;
      effective.fontFamily = palette.fontFamily || 'monospace';
      effective.aura = ambient <= 0.001 ? null : (palette.aura || null);
      effective.ambientIntensity = ambient;
      effective.spectrumCode = specCode;
      if (palette.nebula === false || ambient <= 0.001) {
        effective.nebula = null;
        lastNebulaEnabled = false;
      } else {
        effective.nebula = computeNebulaLobes(seconds, columns * cellWidth, rows * cellHeight, Boolean(still), nebulaState);
        lastNebulaEnabled = true;
      }
      const ps = Number(palette.prismStrength ?? (palette.aura && palette.aura.active ? palette.aura.strength : 1));
      effective.prismStrength = (Number.isFinite(ps) ? Math.max(0, Math.min(1, ps)) : 1) * ambient;
      const ph = Number.isFinite(Number(palette.auraPhase)) ? Number(palette.auraPhase) : seconds * 0.12;
      effective.auraPhase = ph - Math.floor(ph);
      return effective;
    }
    function isFieldBusy() {
      return Boolean(waves && waves.active()) || glowing || prismBurst > 0;
    }
    return {
      mode: renderer ? renderer.mode : 'none',
      invalidate() { stale = true; },
      setCalmZones(zones) {
        instanceZones = normalizeZones(zones);
        stale = true;
      },
      busy: isFieldBusy,
      isSettled: () => !isFieldBusy(),
      triggerLiftoffBurst(normX = 0.5, normY = 0.62) {
        if (!waves || typeof waves.disturb !== 'function' || columns <= 0 || rows <= 0) return false;
        const nx = clampFinite(normX, 0.5, 0, 1);
        const ny = clampFinite(normY, 0.62, 0, 1);
        const col = Math.max(0, Math.min(columns - 1, Math.round(nx * (columns - 1))));
        const row = Math.max(0, Math.min(rows - 1, Math.round(ny * (rows - 1))));
        waves.disturb(col, row, {
          amplitudeScale: 1.55,
          radiusScale: 1.45,
          duration: 0.42,
          frequency: 6.4,
          loadWeight: 0.22,
        });
        waves.disturb(col, Math.max(0, row - 1), {
          amplitudeScale: 1.28,
          radiusScale: 2.35,
          duration: 0.56,
          frequency: 4.5,
          delay: 0.035,
          loadWeight: 0.22,
        });
        prismBurst = 1;
        stale = true;
        return true;
      },
      triggerTideSwell() {
        if (!waves || typeof waves.disturb !== 'function' || columns <= 0 || rows <= 0) return false;
        const baseRow = Math.max(0, rows - 1 - Math.min(2, Math.floor(rows * 0.06)));
        const anchors = [
          { nx: 0.5, delay: 0, amp: 0.78, rad: 1.32, dur: 0.62, freq: 3.2 },
          { nx: 0.22, delay: 0.07, amp: 0.66, rad: 1.18, dur: 0.6, freq: 3.1 },
          { nx: 0.78, delay: 0.14, amp: 0.66, rad: 1.18, dur: 0.6, freq: 3.1 },
        ];
        for (let i = 0; i < anchors.length; i++) {
          const a = anchors[i];
          const col = Math.max(0, Math.min(columns - 1, Math.round(a.nx * (columns - 1))));
          waves.disturb(col, baseRow, {
            amplitudeScale: a.amp,
            radiusScale: a.rad,
            duration: a.dur,
            frequency: a.freq,
            delay: a.delay,
            loadWeight: 0.16,
          });
        }
        stale = true;
        return true;
      },
      needsDraw(now, still) {
        if (isCanvasDocHidden(canvas)) return false;
        if (stale || isFieldBusy() || tickAt(now, still) !== lastTick) return true;
        if (still || !lastNebulaEnabled) return false;
        return Math.abs(now - lastDraw) >= RIPPLE.nebulaFrameMs;
      },
      draw(now, palette, still) {
        if (columns <= 0 || rows <= 0 || isCanvasDocHidden(canvas)) return;
        const rawDt = lastDraw > -Infinity ? Math.max(0, (now - lastDraw) / 1000) : 0;
        if (!renderer) {
          // 无渲染上下文时依然准确推进尾迹与爆发增益衰减，防止 busy() 永久卡 true
          if (!waves.active()) {
            glowing = false;
            prismBurst = 0;
          } else if (prismBurst > 0) {
            prismBurst = still ? 0 : prismBurst * Math.exp(-Math.max(0.016, rawDt) / 0.38);
            if (prismBurst < 0.015) prismBurst = 0;
          }
          lastDraw = now;
          stale = false;
          return;
        }
        applyZones(resolveZones(palette || {}));
        const seconds = still ? 0 : now / 1000;
        const eff = prepareEffective(palette || {}, seconds, still);
        const burst = prismBurst;
        if (burst > 0) {
          eff.prismStrength = Math.min(1.35, Math.max(eff.prismStrength, 0.96) + 0.34 * burst);
        }
        const tick = tickAt(now, still);
        const waveActive = waves.active();
        const needIdleRefresh =
          stale ||
          tick !== lastTick ||
          eff.dark !== lastIdleDark ||
          renderer.mode !== 'webgl2' ||
          Math.abs(now - lastIdleRefreshMs) >= 40;

        if (renderer.mode === 'webgl2' && !needIdleRefresh && !waveActive && !glowing && burst <= 0) {
          renderer.draw(eff, canvas.width / (columns * cellWidth), false);
          lastDraw = now;
          return;
        }

        if (tick !== lastTick) {
          for (let row = 0; row < rows; row++) {
            for (let column = 0; column < columns; column++) {
              glyphs[row * columns + column] = glyphIndex(column, row, tick);
            }
          }
        }
        const drift = Math.floor((seconds * RIPPLE.cloudDrift) / cellWidth);
        if (needIdleRefresh) {
          for (const abs of cloudColumns.keys()) if (abs < drift) cloudColumns.delete(abs);
          lastIdleRefreshMs = now;
          lastIdleDark = eff.dark;
        }
        const decay = still
          ? 0
          : (rawDt > 0 ? Math.exp(-rawDt / RIPPLE.glowDecay) : (waveActive ? 1 : 0.88));
        const idleAlpha = eff.dark ? RIPPLE.idleAlphaDark : RIPPLE.idleAlphaLight;
        const themeScale = eff.dark ? 1 : RIPPLE.lightAlphaScale;
        const omega = (TAU / RIPPLE.breathPeriod) * seconds;
        const bs = Math.sin(omega);
        const bc = Math.cos(omega);
        const breathHalf = RIPPLE.breathDepth * 0.5;
        const cap = RIPPLE.waveAlphaCap;
        const slopeScale = RIPPLE.prismSlopeScale;
        const prismThreshold = Math.min(0.95, Math.max(0, RIPPLE.prismThreshold * (1 - 0.38 * burst)));
        const crestScale = 0.78 + 0.34 * burst;
        const bandScale = RIPPLE.prismBands / TAU;
        const invCap = 1 / cap;
        const inv2CellW = 1 / (2 * cellWidth);
        const inv2CellH = 1 / (2 * cellHeight);
        const invPrismSpan = 1 / Math.max(1e-4, 1 - prismThreshold);
        const idleThemeScale = idleAlpha * themeScale;
        const height = waves.height;
        const { data } = renderer;
        for (let c = 0; c < columns; c++) {
          colClouds[c] = cloudColumn(c + drift);
        }
        let brightest = 0;
        for (let row = 0; row < rows; row++) {
          const rowBase = row * columns;
          const hasAbove = row > 0;
          const hasBelow = row < rows - 1;
          for (let column = 0; column < columns; column++) {
            const cell = rowBase + column;
            const here = height[cell];
            const prevG = glow[cell];
            if (here === 0 && prevG === 0) {
              if (!needIdleRefresh && wasLit[cell] === 0) continue;
              wasLit[cell] = 0;
              const breath = 1 - breathHalf * (1 + bs * breathCos[cell] + bc * breathSin[cell]);
              const alpha = idleThemeScale * colClouds[column][row] * breath * mask[cell];
              const at = cell << 2;
              data[at] = glyphs[cell];
              data[at + 1] = alpha < INVISIBLE_ALPHA ? 0 : (alpha >= 1 ? 255 : (alpha * 255 + 0.5) | 0);
              data[at + 2] = 0;
              data[at + 3] = 0;
              continue;
            }
            const breath = 1 - breathHalf * (1 + bs * breathCos[cell] + bc * breathSin[cell]);
            const strength = Math.tanh(RIPPLE.waveGain * (here < 0 ? -here : here));
            const decayed = prevG * decay;
            const shown = decayed > strength ? decayed : strength;
            const lit = shown < 0.01 ? 0 : shown;
            glow[cell] = lit;
            wasLit[cell] = lit > 0 ? 1 : 0;
            let alpha = idleAlpha * colClouds[column][row] * breath;
            let packed = 0;
            let waveMix = strength;
            if (lit > 0) {
              if (lit > brightest) brightest = lit;
              const rawRatio = (patch[cell] * (lit * RIPPLE.glowAlpha + strength * RIPPLE.waveAlpha)) * invCap;
              alpha += cap * Math.tanh(rawRatio);
              const sBoost = strength * 1.15;
              const lBoost = lit * 0.42;
              const mixRaw = sBoost > lBoost ? sBoost : lBoost;
              waveMix = mixRaw > 1 ? 1 : mixRaw;
              const left = column > 0 ? height[cell - 1] : here;
              const right = column < columns - 1 ? height[cell + 1] : here;
              const above = hasAbove ? height[cell - columns] : here;
              const below = hasBelow ? height[cell + columns] : here;
              const gx = (right - left) * inv2CellW;
              const gy = (below - above) * inv2CellH;
              const slopeG = Math.sqrt(gx * gx + gy * gy) * slopeScale;
              const crestG = strength * crestScale;
              const g = slopeG > crestG ? slopeG : crestG;
              if (g > prismThreshold) {
                const amt = smooth((g - prismThreshold) * invPrismSpan);
                const level = Math.round(amt * PRISM_LEVELS);
                if (level > 0) {
                  let hue = Math.atan2(gy, gx + 1e-6) * bandScale + Math.tanh(here * 2.4) * 0.3;
                  hue -= Math.floor(hue);
                  packed = (level << 5) | (Math.floor(hue * HUE_LEVELS) & 31);
                }
              }
            }
            alpha *= mask[cell] * themeScale;
            const at = cell << 2;
            data[at] = glyphs[cell];
            data[at + 1] = alpha < INVISIBLE_ALPHA ? 0 : (alpha >= 1 ? 255 : (alpha * 255 + 0.5) | 0);
            data[at + 2] = lit > 0 ? ((waveMix * 255 + 0.5) | 0) : 0;
            data[at + 3] = packed;
          }
        }
        renderer.draw(eff, canvas.width / (columns * cellWidth));
        if (burst > 0) {
          prismBurst = still ? 0 : burst * Math.exp(-Math.max(0.016, rawDt) / 0.38);
          if (prismBurst < 0.015) prismBurst = 0;
        }
        glowing = brightest > 0;
        if (!glowing && !waves.active()) {
          glow.fill(0);
          prismBurst = 0;
        }
        lastTick = tick;
        lastDraw = now;
        stale = false;
      },
      dispose() {
        if (canvas && canvas.removeEventListener) {
          canvas.removeEventListener('webglcontextlost', onContextLost);
          canvas.removeEventListener('webglcontextrestored', onContextRestored);
        }
        if (renderer) renderer.dispose();
      },
    };
  }
  const DEFAULT_HORIZON_AURA = Object.freeze({
    reach: 0.47,
    prism: 0,
    surge: 0,
    speed: 1,
  });

  const HORIZON_SPECTRUM_MODES = Object.freeze({
    default: 0,
    follow: 0,
    warm: 1,
    alabaster: 1,
    claude: 1,
    cobalt: 2,
    iris: 3,
    amber: 4,
    mono: 5,
    graphite: 5,
  });

  const HORIZON_SEMANTIC_MODES = Object.freeze({
    none: 0,
    'awaiting-decision': 1,
    decision: 1,
    'error-halted': 2,
    error: 2,
    'long-task-complete': 3,
    'complete-jade': 3,
  });

  function resolveHorizonSpectrumCode(mode) {
    if (typeof mode === 'number' && Number.isFinite(mode)) {
      return Math.max(0, Math.min(5, Math.round(mode)));
    }
    const key = String(mode || '').trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(HORIZON_SPECTRUM_MODES, key)
      ? HORIZON_SPECTRUM_MODES[key]
      : 0;
  }

  function resolveHorizonSemanticCode(sem) {
    if (typeof sem === 'number' && Number.isFinite(sem)) {
      return Math.max(0, Math.min(3, Math.round(sem)));
    }
    const key = String(sem || '').trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(HORIZON_SEMANTIC_MODES, key)
      ? HORIZON_SEMANTIC_MODES[key]
      : 0;
  }

  function resolveHorizonDpr(devicePixelRatio = 1, baseScale = 0.72) {
    const raw = Number.isFinite(Number(devicePixelRatio)) && Number(devicePixelRatio) > 0 ? Number(devicePixelRatio) : 1;
    const sc = Number.isFinite(Number(baseScale)) && Number(baseScale) > 0 ? Number(baseScale) : 0.72;
    if (raw <= 1) return Math.max(0.5, +(raw * sc).toFixed(3));
    return Math.max(0.72, Math.min(1.35, +(raw * Math.min(0.68, sc * 0.9)).toFixed(3)));
  }

  function detectHostSpectrumCode(canvas, dark = true) {
    try {
      const doc = (canvas && canvas.ownerDocument) || (typeof document !== 'undefined' ? document : null);
      const html = doc && doc.documentElement;
      if (!html || typeof html.getAttribute !== 'function') return 0;
      const accent = String(html.getAttribute('data-ag-cs-accent') || '').trim().toLowerCase();
      if (accent && accent !== 'follow' && accent !== 'default' && Object.prototype.hasOwnProperty.call(HORIZON_SPECTRUM_MODES, accent)) {
        return HORIZON_SPECTRUM_MODES[accent];
      }
      const pal = String(html.getAttribute('data-ag-cs-palette') || '').trim().toLowerCase();
      if (pal === 'warm' || pal === 'claude') return 1;
      if (!dark && String(html.getAttribute('data-ag-cs-light-preset') || '').trim().toLowerCase() === 'alabaster') {
        return 1;
      }
    } catch {}
    return 0;
  }

  const HORIZON_PRISM_STOPS = [
    [66, 133, 244],
    [155, 114, 203],
    [234, 67, 53],
    [251, 188, 4],
    [92, 198, 252],
  ];
  // 白昼高透水彩棱镜折射五阶闭合光谱（Royal Cobalt #2563EB / Iris #7C3AED / Coral #EA4335 / Amber #D97706 / Cerulean #0284C7）
  const HORIZON_DAYLIGHT_STOPS = [
    [37, 99, 235],
    [124, 58, 237],
    [234, 67, 53],
    [217, 119, 6],
    [2, 132, 199],
  ];
  function horizonPrismRgb(t, out, dark = true) {
    const stops = dark === false ? HORIZON_DAYLIGHT_STOPS : HORIZON_PRISM_STOPS;
    let f = (t - Math.floor(t)) * 5;
    const i = Math.min(4, Math.floor(f));
    f = smooth(f - i);
    const a = stops[i];
    const b = stops[(i + 1) % 5];
    out[0] = a[0] + (b[0] - a[0]) * f;
    out[1] = a[1] + (b[1] - a[1]) * f;
    out[2] = a[2] + (b[2] - a[2]) * f;
    return out;
  }
  const GLOW_VERT_SHADER = `#version 300 es
void main() {
vec2 corner = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}`;
  const HORIZON_FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uDpr;
uniform float uTime;
uniform float uDark;
uniform float uReach;
uniform float uIntensity;
uniform float uStretch;
uniform float uPresence;
uniform float uPrism;
uniform float uSurge;
uniform float uSpeed;
uniform float uSpectrum;
uniform float uSemantic;
out vec4 outColor;

float hash(vec2 p) {
p = fract(p * vec2(123.34, 456.21));
p += dot(p, p + 45.32);
return fract(p.x * p.y);
}
float ign(vec2 p) {
return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}
float noise(vec2 p) {
vec2 i = floor(p);
vec2 f = fract(p);
vec2 u = f * f * (3.0 - 2.0 * f);
return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
float v = 0.0;
float a = 0.5;
for (int i = 0; i < 4; i++) {
v += a * noise(p);
p = p * 2.03 + 17.1;
a *= 0.5;
}
return v;
}
float halftone(vec2 px, vec2 res, float y, float t, float cell, float msk) {
float persp = 1.0 / (0.55 + y);
vec2 g = vec2((px.x - res.x * 0.5) * persp, res.y * log(0.55 + y));
g.y += 10.0 * sin(g.x * 0.007 + t * 0.42) + 3.2 * sin(g.x * 0.019 - t * 0.28) - t * 1.5;
vec2 uvCell = g / cell;
vec2 c = fract(uvCell) - 0.5;
float dist = length(c);
float aa = clamp(fwidth(dist) * 1.15, 0.035, 0.14);
float r = 0.08 + 0.16 * msk;
return (1.0 - smoothstep(r - aa, r + aa * 0.35, dist)) * msk;
}
const vec3 DEEP_SPACE_BLUE = vec3(0.059, 0.090, 0.227);
const vec3 ZENITH_BLUE = vec3(0.192, 0.525, 1.000);
const vec3 SKY_BLUE = vec3(0.361, 0.776, 0.988);
const vec3 HAZE_BLUE = vec3(0.733, 0.886, 1.000);
const vec3 PRISM_COBALT = vec3(0.259, 0.522, 0.957);
const vec3 PRISM_IRIS = vec3(0.608, 0.447, 0.796);
const vec3 PRISM_CORAL = vec3(0.918, 0.263, 0.208);
const vec3 PRISM_AMBER = vec3(0.984, 0.737, 0.016);
const vec3 ICE_MIST = vec3(0.839, 0.933, 1.000);
const vec3 DAY_COBALT = vec3(0.145, 0.388, 0.922);
const vec3 DAY_IRIS = vec3(0.486, 0.227, 0.929);
const vec3 DAY_CORAL = vec3(0.918, 0.263, 0.208);
const vec3 DAY_AMBER = vec3(0.851, 0.467, 0.024);
const vec3 DAY_CERULEAN = vec3(0.008, 0.518, 0.780);
const vec3 WARM_DARK_A = vec3(0.580, 0.290, 0.204);
const vec3 WARM_DARK_B = vec3(0.851, 0.467, 0.341);
const vec3 WARM_DARK_C = vec3(0.933, 0.682, 0.365);
const vec3 DAY_TERRACOTTA = vec3(0.761, 0.349, 0.204);
const vec3 DAY_SIENNA = vec3(0.635, 0.247, 0.141);
const vec3 MONO_DARK_LO = vec3(0.620, 0.659, 0.725);
const vec3 MONO_DARK_HI = vec3(0.847, 0.878, 0.929);
const vec3 MONO_LIGHT_LO = vec3(0.267, 0.318, 0.400);
const vec3 MONO_LIGHT_HI = vec3(0.416, 0.475, 0.569);
const vec3 SEM_AMBER_D = vec3(0.949, 0.722, 0.294);
const vec3 SEM_AMBER_L = vec3(0.851, 0.467, 0.024);
const vec3 SEM_CORAL_D = vec3(0.851, 0.345, 0.365);
const vec3 SEM_CORAL_L = vec3(0.863, 0.149, 0.149);
const vec3 SEM_JADE_D = vec3(0.314, 0.745, 0.576);
const vec3 SEM_JADE_L = vec3(0.020, 0.588, 0.412);
vec3 blueLoop(float x) {
float t = fract(x) * 4.0;
float f = smoothstep(0.0, 1.0, fract(t));
vec3 indigo = mix(DEEP_SPACE_BLUE, ZENITH_BLUE, 0.84);
vec3 ice = mix(SKY_BLUE, HAZE_BLUE, 0.35);
if (t < 1.0) return mix(ZENITH_BLUE, indigo, f);
if (t < 2.0) return mix(indigo, SKY_BLUE, f);
if (t < 3.0) return mix(SKY_BLUE, ice, f);
return mix(ice, ZENITH_BLUE, f);
}
vec3 prismLoop(float x) {
float t = fract(x) * 5.0;
float f = smoothstep(0.0, 1.0, fract(t));
if (t < 1.0) return mix(PRISM_COBALT, PRISM_IRIS, f);
if (t < 2.0) return mix(PRISM_IRIS, PRISM_CORAL, f);
if (t < 3.0) return mix(PRISM_CORAL, PRISM_AMBER, f);
if (t < 4.0) return mix(PRISM_AMBER, SKY_BLUE, f);
return mix(SKY_BLUE, PRISM_COBALT, f);
}
vec3 daylightInkLoop(float x) {
float t = fract(x) * 5.0;
float f = smoothstep(0.0, 1.0, fract(t));
if (t < 1.0) return mix(DAY_COBALT, DAY_IRIS, f);
if (t < 2.0) return mix(DAY_IRIS, DAY_CORAL, f);
if (t < 3.0) return mix(DAY_CORAL, DAY_AMBER, f);
if (t < 4.0) return mix(DAY_AMBER, DAY_CERULEAN, f);
return mix(DAY_CERULEAN, DAY_COBALT, f);
}
vec3 spectrumBaseDark(float spec, float ph) {
float w = 0.5 + 0.5 * sin(ph * 6.2831853);
if (spec > 4.5) return mix(MONO_DARK_LO, MONO_DARK_HI, w);
if (spec > 3.5) return mix(vec3(0.820, 0.545, 0.200), SEM_AMBER_D, w);
if (spec > 2.5) return mix(vec3(0.440, 0.360, 0.820), PRISM_IRIS, w);
if (spec > 1.5) return blueLoop(ph);
if (spec > 0.5) return mix(WARM_DARK_A, WARM_DARK_B, 0.35 + 0.65 * w);
return blueLoop(ph);
}
vec3 spectrumPrismDark(float spec, float ph) {
float w = 0.5 + 0.5 * sin(ph * 6.2831853 + 1.1);
if (spec > 4.5) return mix(MONO_DARK_LO, MONO_DARK_HI, w);
if (spec > 3.5) return mix(SEM_AMBER_D, WARM_DARK_C, w);
if (spec > 2.5) return mix(PRISM_IRIS, vec3(0.710, 0.560, 0.960), w);
if (spec > 1.5) return mix(PRISM_COBALT, SKY_BLUE, w);
if (spec > 0.5) return mix(WARM_DARK_B, WARM_DARK_C, w);
return prismLoop(ph);
}
vec3 spectrumInkLight(float spec, float ph, float washPhase) {
float w = 0.5 + 0.5 * sin(ph * 6.2831853);
float sw = 0.5 + 0.5 * sin(washPhase);
if (spec > 4.5) return mix(MONO_LIGHT_LO, MONO_LIGHT_HI, 0.5 * (w + sw));
if (spec > 3.5) return mix(DAY_AMBER, vec3(0.706, 0.325, 0.035), w);
if (spec > 2.5) return mix(DAY_IRIS, vec3(0.310, 0.275, 0.898), w);
if (spec > 1.5) return mix(DAY_COBALT, DAY_CERULEAN, sw);
if (spec > 0.5) return mix(DAY_TERRACOTTA, mix(DAY_AMBER, DAY_SIENNA, sw), 0.45 + 0.45 * w);
return daylightInkLoop(ph);
}
vec3 semanticColor(float sem, float dark, float ph) {
float w = 0.5 + 0.5 * sin(ph * 6.2831853);
if (sem < 1.5) {
return dark > 0.5
  ? mix(SEM_AMBER_D, vec3(0.980, 0.835, 0.480), 0.35 * w)
  : mix(SEM_AMBER_L, vec3(0.706, 0.325, 0.035), 0.40 * w);
}
if (sem < 2.5) {
return dark > 0.5
  ? mix(SEM_CORAL_D, vec3(0.690, 0.235, 0.265), 0.40 * w)
  : mix(SEM_CORAL_L, vec3(0.620, 0.110, 0.120), 0.35 * w);
}
return dark > 0.5
  ? mix(SEM_JADE_D, SKY_BLUE, 0.38 * w)
  : mix(SEM_JADE_L, DAY_CERULEAN, 0.42 * w);
}
void main() {
vec2 uv = gl_FragCoord.xy / max(uRes, vec2(1.0));
float reach = max(uReach, 0.01);
float stretch = uStretch * (1.0 + 0.08 * (uSpeed - 1.0));
float surgeUp = max(uSurge, 0.0);
float yCut = uv.y / reach - 0.25 * stretch;
if (yCut > 1.6 + 0.22 * surgeUp) {
outColor = vec4(0.0);
return;
}
float topFeather = 1.0 - smoothstep(1.15 + 0.14 * surgeUp, 1.58 + 0.22 * surgeUp, yCut);
vec2 px = gl_FragCoord.xy / max(uDpr, 0.5);
vec2 res = uRes / max(uDpr, 0.5);
float t = uTime;
vec2 p = (px - res * 0.5) / max(res.y, 1.0);
vec2 q = p + 0.09 * vec2(fbm(p * 2.0 + vec2(t * 0.16, 0.0)), fbm(p * 2.0 + vec2(3.1, -t * 0.13))) - 0.045;
float y = uv.y / reach;
float waveA = sin(uv.x * 5.2 - t * 0.68);
float waveB = sin(uv.x * 8.6 + t * 0.46 + 1.4);
float curtain = 0.5 + 0.32 * waveA + 0.18 * waveB;
float jut = (fbm(vec2(px.x / 220.0 + t * 0.18, t * 0.11)) - 0.5) * 0.68 + (waveA * 0.65 + waveB * 0.35) * 0.24;
float h = y + stretch * (0.36 * jut + 0.11 * (fbm(vec2(px.x / 90.0 - t * 0.21, t * 0.14 + 3.0)) - 0.5));
float glow = exp(-max(h, 0.0) * max(h, 0.0) * 4.0) * (0.76 + 0.42 * curtain) * mix(0.35, 1.0, smoothstep(0.0, 0.3, uv.x) * (1.0 - smoothstep(0.7, 1.0, uv.x)));
float basePhase = px.x / max(res.x, 1.0) * 0.9 + t * 0.15 + 0.22 * fbm(q * 1.5);
vec3 base = uSemantic > 0.5 ? semanticColor(uSemantic, 1.0, basePhase) : spectrumBaseDark(uSpectrum, basePhase);
float n = fbm(q * 3.0 + t * 0.16);
float field = (1.0 - exp(-1.8 * glow * (0.75 + 0.45 * n))) / (1.0 - exp(-1.8 * 1.2));
float pPhase = uv.x * 1.18 - t * 0.18 + 0.28 * fbm(q * 2.1 + vec2(0.0, t * 0.12)) + 0.14 * y;
vec3 dotPrismTint = vec3(0.0);
float dotPrismMix = 0.0;
float dotBoost = 0.0;
float surgeArc = 0.0;
float surgeDy = 0.0;
float chimeWave = 0.0;
float chimePhase = 0.0;
float effPrism = uSpectrum > 4.5 ? uPrism * 0.28 : uPrism;
if (effPrism > 0.0001 || abs(uSurge) > 0.0001) {
vec3 pCol = uSemantic > 0.5 ? semanticColor(uSemantic, 1.0, pPhase) : spectrumPrismDark(uSpectrum, pPhase);
if (effPrism > 0.0001) {
float wing = smoothstep(0.06, 0.42, field) * (1.0 - 0.52 * smoothstep(0.72, 0.98, field));
float caustics = 0.52 + 0.48 * smoothstep(-0.24, 0.26, jut);
base = mix(base, pCol, clamp(effPrism * 1.15 * wing * caustics, 0.0, 0.68));
dotPrismTint = pCol;
dotPrismMix = clamp(effPrism * 1.25 * (0.45 + 0.55 * caustics), 0.0, 0.78);
}
if (uSurge > 0.0001) {
float sp = clamp(uSurge, 0.0, 1.0);
float sEnv = sin(sp * 3.14159265) * (1.0 - 0.32 * sp);
float xRel = (uv.x - 0.5) * 2.0;
float xSpan = smoothstep(0.0, 0.22, uv.x) * (1.0 - smoothstep(0.78, 1.0, uv.x));
float frontY = 1.15 * (1.0 - pow(1.0 - sp, 1.45)) - 0.15 * xRel * xRel + 0.06 * jut;
float dy = y - frontY;
float arc = (dy >= 0.0 ? exp(-dy * dy * 24.0) : exp(-dy * dy * 5.2)) * sEnv * xSpan;
surgeArc = arc;
surgeDy = dy - sp * 0.35;
vec3 surgeLead = uSemantic > 0.5 ? semanticColor(uSemantic, 1.0, pPhase + 0.2) : (uSpectrum > 4.5 ? MONO_DARK_HI : (uSpectrum > 0.5 && uSpectrum < 1.5 ? WARM_DARK_C : SKY_BLUE));
vec3 surgeTrail = uSemantic > 0.5 ? semanticColor(uSemantic, 1.0, pPhase + surgeDy * 1.3) : spectrumPrismDark(uSpectrum, pPhase + surgeDy * 1.3);
vec3 surgeCol = mix(surgeLead, surgeTrail, 0.62);
field = clamp(field + arc * 0.52, 0.0, 1.0);
base = mix(base, surgeCol, clamp(arc * 0.78, 0.0, 0.85));
dotBoost += arc * 0.58;
dotPrismTint = mix(dotPrismTint, surgeCol, clamp(arc * 0.85, 0.0, 1.0));
dotPrismMix = max(dotPrismMix, clamp(arc * 0.82, 0.0, 0.85));
} else if (uSurge < -0.0001) {
float cp = clamp(-uSurge, 0.0, 1.0);
float cEnv = sin(cp * 3.14159265) * (1.0 - 0.28 * cp);
float rx = abs(uv.x - 0.5);
float ringR = 0.04 + 0.43 * (1.0 - pow(1.0 - cp, 1.35));
float dr = (rx - ringR) / 0.135;
float hRip = exp(-dr * dr) + 0.32 * (1.0 - cp) * exp(-rx * rx * 18.0);
float setY = 0.70 * pow(1.0 - cp, 1.35) + 0.04;
float dsy = y - setY;
float vSet = exp(-dsy * dsy * 13.5) * (1.0 - smoothstep(1.05, 1.35, y));
float chime = hRip * vSet * cEnv;
chimeWave = chime;
chimePhase = uv.x * 1.5 + rx * 2.0 - cp * 0.35;
vec3 chimeLead = uSemantic > 0.5 ? semanticColor(uSemantic, 1.0, chimePhase) : (uSpectrum > 4.5 ? MONO_DARK_HI : (uSpectrum > 0.5 && uSpectrum < 1.5 ? WARM_DARK_C : ICE_MIST));
vec3 chimeCol = uSemantic > 0.5 ? chimeLead : mix(chimeLead, spectrumPrismDark(uSpectrum, chimePhase), 0.22);
field = clamp(field + chime * 0.46, 0.0, 1.0);
base = mix(base, chimeCol, clamp(chime * 0.82, 0.0, 0.88));
dotBoost += chime * 0.42;
dotPrismTint = mix(dotPrismTint, chimeCol, clamp(chime * 0.8, 0.0, 1.0));
dotPrismMix = max(dotPrismMix, clamp(chime * 0.75, 0.0, 0.82));
}
}
float hot = 0.75 * smoothstep(0.65, 1.0, field);
field *= topFeather;
dotBoost *= topFeather;
float band = smoothstep(0.3, 0.55, field) * (1.0 - smoothstep(0.7, 0.98, field));
float dotMsk = clamp(band * 0.8 * smoothstep(0.12, 0.32, -jut) + dotBoost, 0.0, 1.0);
float dA = halftone(px, res, uv.y, t, 7.0, dotMsk);
float grain = hash(px + fract(t * 7.0) * 91.0) - 0.5;
vec3 c;
vec3 dc;
float a;
float da;
if (uDark > 0.5) {
vec3 fill = base * (1.0 + 0.25 * hot) * mix(0.72, 1.16, uIntensity);
c = fill + grain * 0.05;
dc = min(fill * 1.6, 1.0);
if (dotPrismMix > 0.0001) {
dc = mix(dc, min(dotPrismTint * 1.22 + 0.08, 1.0), dotPrismMix);
}
float breathMod = mix(0.68, 1.24, clamp(uIntensity, 0.0, 1.0));
a = clamp(field * 0.56 * breathMod * uPresence, 0.0, 1.0);
da = clamp(dA * sqrt(a) * 0.78, 0.0, 1.0);
} else {
// Daylight Dichroic Ink Wash (pure high-chroma jewel pigments without white fog dilution)
float washPh = uv.x * 3.1 + t * 0.48 + 1.3 * n;
vec3 prismInk = uSemantic > 0.5 ? semanticColor(uSemantic, 0.0, pPhase) : spectrumInkLight(uSpectrum, pPhase, washPh);
vec3 washBase = uSemantic > 0.5
  ? semanticColor(uSemantic, 0.0, basePhase)
  : (uSpectrum > 0.5 ? spectrumInkLight(uSpectrum, basePhase, washPh) : mix(DAY_COBALT, DAY_CERULEAN, 0.5 + 0.5 * sin(washPh)));
float causticsL = 0.48 + 0.52 * smoothstep(-0.24, 0.26, jut);
float dichroicW = clamp((0.48 + 0.46 * effPrism) * (0.58 + 0.42 * causticsL), 0.0, 0.94);
vec3 inkRgb = mix(washBase, prismInk, dichroicW);
if (surgeArc > 0.0001) {
vec3 surgeInk = uSemantic > 0.5
  ? semanticColor(uSemantic, 0.0, pPhase + surgeDy * 1.3)
  : mix(washBase, spectrumInkLight(uSpectrum, pPhase + surgeDy * 1.3, washPh), 0.68);
inkRgb = mix(inkRgb, surgeInk, clamp(surgeArc * 0.85, 0.0, 0.90));
} else if (chimeWave > 0.0001) {
vec3 chimeInk = uSemantic > 0.5
  ? semanticColor(uSemantic, 0.0, chimePhase)
  : mix(washBase, spectrumInkLight(uSpectrum, chimePhase, washPh), 0.45);
inkRgb = mix(inkRgb, chimeInk, clamp(chimeWave * 0.86, 0.0, 0.90));
}
vec3 hotAnchor = uSemantic > 0.5 ? washBase * 0.88 : (uSpectrum > 4.5 ? MONO_LIGHT_LO : (uSpectrum > 0.5 && uSpectrum < 1.5 ? DAY_SIENNA : DAY_COBALT * 0.84 + DAY_IRIS * 0.16));
inkRgb = mix(inkRgb, hotAnchor, hot * 0.24);
c = clamp(inkRgb + grain * 0.022, 0.0, 1.0);
dc = clamp(mix(washBase * 0.86, prismInk * 0.92, clamp(0.26 + dotPrismMix * 0.68, 0.0, 0.90)), 0.0, 1.0);
float effPres = pow(clamp(uPresence, 0.0, 1.0), 0.68);
float washGain = mix(1.02, 1.62, clamp(uIntensity, 0.0, 1.0));
a = clamp(field * 0.66 * washGain * effPres, 0.0, 0.84);
da = clamp(dA * (0.52 + 0.44 * sqrt(a)) * effPres, 0.0, 0.88);
}
float outAlpha = clamp(a + da * (1.0 - a), 0.0, 1.0);
vec3 premulRgb = clamp(c, 0.0, 1.0) * a * (1.0 - da) + clamp(dc, 0.0, 1.0) * da;
if (outAlpha > 0.0015) {
vec2 dp = gl_FragCoord.xy + fract(t * 3.0) * vec2(37.0, 19.0);
float tpdf = ign(dp) - ign(dp.yx + vec2(11.3, 27.1));
premulRgb += (tpdf / 255.0) * min(1.0, outAlpha * 2.5);
outAlpha = clamp(outAlpha + tpdf * (0.5 / 255.0), 0.0, 1.0);
}
outColor = clamp(vec4(premulRgb, outAlpha), 0.0, 1.0);
}`;
  const GLOW_FRAG_SHADER = HORIZON_FRAGMENT_SHADER;
  function createBrandHorizonGLRenderer(canvas) {
    const gl = canvas && canvas.getContext
      ? canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: false })
      : null;
    if (!gl) return null;
    let program = null;
    const u = {};
    function compile(type, source) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(sh) || 'glow shader compile error';
        gl.deleteShader(sh);
        throw new Error(log);
      }
      return sh;
    }
    function build() {
      const vs = compile(gl.VERTEX_SHADER, GLOW_VERT_SHADER);
      const fs = compile(gl.FRAGMENT_SHADER, HORIZON_FRAGMENT_SHADER);
      program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'glow program link error');
      }
      gl.useProgram(program);
      for (const name of ['uRes', 'uDpr', 'uTime', 'uDark', 'uReach', 'uIntensity', 'uStretch', 'uPresence', 'uPrism', 'uSurge', 'uSpeed', 'uSpectrum', 'uSemantic']) {
        u[name] = gl.getUniformLocation(program, name);
      }
    }
    try {
      build();
    } catch {
      if (program) gl.deleteProgram(program);
      return null;
    }
    return {
      mode: 'webgl2',
      build,
      clear() {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      },
      draw(w, h, dpr, timeSec, dark, intensity, presence, reach = DEFAULT_HORIZON_AURA.reach, prism = 0, surge = 0, speed = 1, spectrumCode = 0, semanticCode = 0) {
        gl.viewport(0, 0, w, h);
        gl.useProgram(program);
        gl.uniform2f(u.uRes, w, h);
        gl.uniform1f(u.uDpr, dpr);
        gl.uniform1f(u.uTime, timeSec);
        gl.uniform1f(u.uDark, dark ? 1 : 0);
        gl.uniform1f(u.uReach, reach);
        gl.uniform1f(u.uIntensity, intensity);
        gl.uniform1f(u.uStretch, 0.6);
        gl.uniform1f(u.uPresence, presence);
        gl.uniform1f(u.uPrism, prism);
        gl.uniform1f(u.uSurge, surge);
        gl.uniform1f(u.uSpeed, speed);
        if (u.uSpectrum) gl.uniform1f(u.uSpectrum, spectrumCode);
        if (u.uSemantic) gl.uniform1f(u.uSemantic, semanticCode);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
      dispose() {
        if (program) gl.deleteProgram(program);
        program = null;
      },
    };
  }
  function sampleHorizonTone2D(spectrumCode, semanticCode, dark, phase, out) {
    const w = 0.5 + 0.5 * Math.sin(phase * TAU);
    if (semanticCode >= 1) {
      if (semanticCode === 1) {
        out[0] = dark ? 242 + 8 * w : 217 - 37 * w;
        out[1] = dark ? 184 + 28 * w : 119 - 36 * w;
        out[2] = dark ? 75 + 47 * w : 6 + 3 * w;
        return out;
      }
      if (semanticCode === 2) {
        out[0] = dark ? 217 - 41 * w : 220 - 62 * w;
        out[1] = dark ? 88 - 28 * w : 38 - 10 * w;
        out[2] = dark ? 93 - 25 * w : 38 - 8 * w;
        return out;
      }
      out[0] = dark ? 80 + 12 * w : 5 - 3 * w;
      out[1] = dark ? 190 + 8 * w : 150 - 18 * w;
      out[2] = dark ? 147 + 105 * w : 105 + 94 * w;
      return out;
    }
    if (spectrumCode === 5) {
      out[0] = dark ? 158 + 58 * w : 68 + 38 * w;
      out[1] = dark ? 168 + 56 * w : 81 + 40 * w;
      out[2] = dark ? 185 + 52 * w : 102 + 43 * w;
      return out;
    }
    if (spectrumCode === 4) {
      out[0] = dark ? 209 + 33 * w : 217 - 37 * w;
      out[1] = dark ? 139 + 45 * w : 119 - 36 * w;
      out[2] = dark ? 51 + 24 * w : 6 + 3 * w;
      return out;
    }
    if (spectrumCode === 3) {
      out[0] = dark ? 112 + 69 * w : 124 - 45 * w;
      out[1] = dark ? 92 + 51 * w : 58 + 12 * w;
      out[2] = dark ? 209 + 36 * w : 237 - 8 * w;
      return out;
    }
    if (spectrumCode === 2) {
      out[0] = dark ? 49 + 43 * w : 37 - 35 * w;
      out[1] = dark ? 134 + 64 * w : 99 + 33 * w;
      out[2] = dark ? 255 - 3 * w : 235 - 36 * w;
      return out;
    }
    if (spectrumCode === 1) {
      out[0] = dark ? 168 + 64 * w : 194 - 28 * w;
      out[1] = dark ? 86 + 72 * w : 89 + 16 * w;
      out[2] = dark ? 58 + 35 * w : 52 - 22 * w;
      return out;
    }
    return horizonPrismRgb(phase, out, dark);
  }
  function createBrandHorizon2DRenderer(canvas) {
    const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return null;
    let image = null;
    let pixels = null;
    const prismRgb = [0, 0, 0];
    const surgeRgb = [0, 0, 0];
    const toneRgb = [0, 0, 0];
    function ensureImage(w, h) {
      if (!image || image.width !== w || image.height !== h) {
        image = ctx.createImageData(w, h);
        pixels = new Uint32Array(image.data.buffer);
      }
    }
    return {
      mode: '2d',
      build() {},
      clear() {
        if (typeof ctx.clearRect === 'function') {
          ctx.clearRect(0, 0, canvas.width || 0, canvas.height || 0);
        } else if (canvas.width > 0 && canvas.height > 0) {
          ensureImage(canvas.width, canvas.height);
          pixels.fill(0);
          ctx.putImageData(image, 0, 0);
        }
      },
      draw(w, h, dpr, timeSec, dark, intensity, presence, reach = DEFAULT_HORIZON_AURA.reach, prism = 0, surge = 0, speed = 1, spectrumCode = 0, semanticCode = 0) {
        if (!w || !h) return;
        ensureImage(w, h);
        pixels.fill(0);
        const rEff = Math.max(0.01, reach);
        const stretchScale = 1 + 0.08 * (speed - 1);
        const surgeUp = Math.max(0, surge);
        const effPrism = spectrumCode === 5 ? prism * 0.28 : prism;
        const hasPrism = effPrism > 0.0001;
        const hasSurge = Math.abs(surge) > 0.0001;
        const customMode = spectrumCode > 0 || semanticCode > 0;
        const cssW = w / Math.max(0.5, dpr);
        const cssH = h / Math.max(0.5, dpr);
        const step = Math.max(1, Math.round(dpr));
        const effPresL = dark ? presence : Math.pow(Math.max(0, Math.min(1, presence)), 0.68);
        const washGainL = dark ? 1 : (1.02 + 0.60 * Math.max(0, Math.min(1, intensity)));
        const darkBreathMod = dark ? (0.68 + 0.56 * Math.max(0, Math.min(1, intensity))) : 1;
        for (let py = 0; py < h; py += step) {
          const uvY = 1 - py / h;
          const yNorm = uvY / rEff;
          if (yNorm > 1.48 + 0.25 * surgeUp) continue;
          const persp = 1 / (0.55 + uvY);
          const gyBase = cssH * Math.log(0.55 + uvY);
          for (let px = 0; px < w; px += step) {
            const uvX = px / w;
            const cssX = px / Math.max(0.5, dpr);
            const waveA = Math.sin(uvX * 5.2 - timeSec * 0.68);
            const waveB = Math.sin(uvX * 8.6 + timeSec * 0.46 + 1.4);
            const curtain = 0.5 + 0.32 * waveA + 0.18 * waveB;
            const jut = (valueNoise(cssX / 220 + timeSec * 0.18, timeSec * 0.11) - 0.5) * 0.68 + (waveA * 0.65 + waveB * 0.35) * 0.24;
            const hJut = Math.max(0, yNorm + 0.25 * stretchScale * jut);
            const edgeFade = (uvX < 0.3 ? 0.35 + 0.65 * smooth(uvX / 0.3) : uvX > 0.7 ? 0.35 + 0.65 * smooth((1 - uvX) / 0.3) : 1);
            const gVal = Math.exp(-hJut * hJut * 4.0) * (0.76 + 0.42 * curtain) * edgeFade;
            let field = dark
              ? Math.min(1, gVal * 1.12 * darkBreathMod * presence)
              : Math.min(1, gVal * 1.12);
            if (!hasSurge && (dark ? field < 0.008 : field * effPresL < 0.008)) continue;
            const mixSky = 0.5 + 0.5 * Math.sin(uvX * 3.2 + timeSec * 0.48);
            const pPhase = uvX * 1.18 - timeSec * 0.18 + 0.28 * valueNoise(uvX * 3.1 + 1.7, yNorm * 1.6 - timeSec * 0.12) + 0.14 * yNorm;
            let baseR;
            let baseG;
            let baseB;
            let dotR = 0;
            let dotG = 0;
            let dotB = 0;
            if (dark) {
              if (customMode) {
                sampleHorizonTone2D(spectrumCode, semanticCode, true, uvX * 0.8 + timeSec * 0.12, toneRgb);
                baseR = toneRgb[0];
                baseG = toneRgb[1];
                baseB = toneRgb[2];
              } else {
                baseR = 49 + (92 - 49) * mixSky;
                baseG = 134 + (198 - 134) * mixSky;
                baseB = 255 + (252 - 255) * mixSky;
              }
            } else if (customMode) {
              sampleHorizonTone2D(spectrumCode, semanticCode, false, pPhase, prismRgb);
              sampleHorizonTone2D(spectrumCode, semanticCode, false, uvX * 0.5 + timeSec * 0.08, toneRgb);
              const causticsL = 0.48 + 0.52 * smooth((jut + 0.24) / 0.5);
              const dichroicW = Math.min(0.94, (0.48 + 0.46 * effPrism) * (0.58 + 0.42 * causticsL));
              baseR = toneRgb[0] + (prismRgb[0] - toneRgb[0]) * dichroicW;
              baseG = toneRgb[1] + (prismRgb[1] - toneRgb[1]) * dichroicW;
              baseB = toneRgb[2] + (prismRgb[2] - toneRgb[2]) * dichroicW;
              const dotMix = Math.min(0.9, 0.26 + effPrism * 0.64);
              dotR = toneRgb[0] * 0.86 * (1 - dotMix) + prismRgb[0] * 0.92 * dotMix;
              dotG = toneRgb[1] * 0.86 * (1 - dotMix) + prismRgb[1] * 0.92 * dotMix;
              dotB = toneRgb[2] * 0.86 * (1 - dotMix) + prismRgb[2] * 0.92 * dotMix;
            } else {
              // 白昼高透水彩棱镜折射（2D 分支镜像：Royal Cobalt #2563EB + 四色宝石彩墨，零泛白）
              horizonPrismRgb(pPhase, prismRgb, false);
              const cobR = 37 + (2 - 37) * mixSky;
              const cobG = 99 + (132 - 99) * mixSky;
              const cobB = 235 + (199 - 235) * mixSky;
              const causticsL = 0.48 + 0.52 * smooth((jut + 0.24) / 0.5);
              const dichroicW = Math.min(0.94, (0.48 + 0.46 * prism) * (0.58 + 0.42 * causticsL));
              baseR = cobR + (prismRgb[0] - cobR) * dichroicW;
              baseG = cobG + (prismRgb[1] - cobG) * dichroicW;
              baseB = cobB + (prismRgb[2] - cobB) * dichroicW;
              const dotMix = Math.min(0.9, 0.26 + prism * 0.64);
              dotR = 32 * (1 - dotMix) + prismRgb[0] * 0.92 * dotMix;
              dotG = 85 * (1 - dotMix) + prismRgb[1] * 0.92 * dotMix;
              dotB = 202 * (1 - dotMix) + prismRgb[2] * 0.92 * dotMix;
            }
            let dotBoost = 0;
            if (hasPrism || hasSurge) {
              if (dark && hasPrism) {
                sampleHorizonTone2D(spectrumCode, semanticCode, true, pPhase + 0.18, prismRgb);
                const wing = smooth((field - 0.04) / 0.32) * (1 - 0.5 * smooth((field - 0.68) / 0.28));
                const caustics = 0.52 + 0.48 * smooth((jut + 0.24) / 0.5);
                const wPrism = Math.min(0.68, effPrism * 1.2 * wing * caustics);
                baseR += (prismRgb[0] - baseR) * wPrism;
                baseG += (prismRgb[1] - baseG) * wPrism;
                baseB += (prismRgb[2] - baseB) * wPrism;
              }
              if (surge > 0.0001) {
                const sp = Math.min(1, surge);
                const sEnv = Math.sin(sp * Math.PI) * (1 - 0.32 * sp);
                const xRel = (uvX - 0.5) * 2;
                const xSpan = smooth(uvX / 0.22) * (1 - smooth((uvX - 0.78) / 0.22));
                const frontY = 1.15 * (1 - Math.pow(1 - sp, 1.45)) - 0.15 * xRel * xRel + 0.06 * jut;
                const dy = yNorm - frontY;
                const arc = (dy >= 0 ? Math.exp(-dy * dy * 24) : Math.exp(-dy * dy * 5.2)) * sEnv * xSpan;
                field = Math.min(1, field + arc * 0.52 * (dark ? presence : 1));
                sampleHorizonTone2D(spectrumCode, semanticCode, dark, pPhase + dy * 1.3 - sp * 0.35, surgeRgb);
                const leadR = customMode ? surgeRgb[0] : (dark ? 92 : 37);
                const leadG = customMode ? surgeRgb[1] : (dark ? 198 : 99);
                const leadB = customMode ? surgeRgb[2] : (dark ? 252 : 235);
                const sr = leadR * 0.34 + surgeRgb[0] * 0.66;
                const sg = leadG * 0.34 + surgeRgb[1] * 0.66;
                const sb = leadB * 0.34 + surgeRgb[2] * 0.66;
                const wArc = Math.min(0.88, arc * 0.82);
                baseR += (sr - baseR) * wArc;
                baseG += (sg - baseG) * wArc;
                baseB += (sb - baseB) * wArc;
                dotBoost += arc * 0.58 * (dark ? presence : 1);
              } else if (surge < -0.0001) {
                const cp = Math.min(1, -surge);
                const cEnv = Math.sin(cp * Math.PI) * (1 - 0.28 * cp);
                const rx = Math.abs(uvX - 0.5);
                const ringR = 0.04 + 0.43 * (1 - Math.pow(1 - cp, 1.35));
                const dr = (rx - ringR) / 0.135;
                const hRip = Math.exp(-dr * dr) + 0.32 * (1 - cp) * expClamp(rx * rx * 18);
                const setY = 0.70 * Math.pow(1 - cp, 1.35) + 0.04;
                const dsy = yNorm - setY;
                const vSet = Math.exp(-dsy * dsy * 13.5) * (1 - smooth((yNorm - 1.05) / 0.3));
                const chime = hRip * vSet * cEnv;
                field = Math.min(1, field + chime * 0.46 * (dark ? presence : 1));
                sampleHorizonTone2D(spectrumCode, semanticCode, dark, uvX * 1.5 + rx * 2 - cp * 0.35, surgeRgb);
                const cr = customMode ? surgeRgb[0] : (dark ? (214 * 0.78 + surgeRgb[0] * 0.22) : (2 * 0.55 + surgeRgb[0] * 0.45));
                const cg = customMode ? surgeRgb[1] : (dark ? (238 * 0.78 + surgeRgb[1] * 0.22) : (132 * 0.55 + surgeRgb[1] * 0.45));
                const cb = customMode ? surgeRgb[2] : (dark ? (255 * 0.78 + surgeRgb[2] * 0.22) : (199 * 0.55 + surgeRgb[2] * 0.45));
                const wChime = Math.min(0.88, chime * 0.84);
                baseR += (cr - baseR) * wChime;
                baseG += (cg - baseG) * wChime;
                baseB += (cb - baseB) * wChime;
                dotBoost += chime * 0.42 * (dark ? presence : 1);
              }
            }
            if (dark ? field < 0.008 : field * effPresL < 0.008) continue;
            const gx = (cssX - cssW * 0.5) * persp;
            const gy = gyBase + 10 * Math.sin(gx * 0.007 + timeSec * 0.42) - timeSec * 1.4;
            const cellX = gx / 7 - Math.floor(gx / 7) - 0.5;
            const cellY = gy / 7 - Math.floor(gy / 7) - 0.5;
            const dist = Math.sqrt(cellX * cellX + cellY * cellY);
            const band = Math.min(1, smooth((field - 0.25) / 0.25) * (1 - smooth((field - 0.72) / 0.26)) + dotBoost);
            let fillA;
            let dotA;
            let R;
            let G;
            let B;
            if (dark) {
              dotA = dist < 0.26 ? (1 - smooth((dist - 0.12) / 0.14)) * band * 0.65 : 0;
              fillA = field * 0.48;
              const dLift = spectrumCode === 5 ? 36 : 56;
              R = Math.round(Math.min(255, Math.max(0, baseR + dotA * (spectrumCode === 5 ? 36 : 72)))) & 255;
              G = Math.round(Math.min(255, Math.max(0, baseG + dotA * dLift))) & 255;
              B = Math.round(Math.min(255, Math.max(0, baseB + dotA * (spectrumCode === 5 ? 38 : 24)))) & 255;
            } else {
              fillA = Math.min(0.84, field * 0.66 * washGainL * effPresL);
              dotA = dist < 0.24 ? Math.min(0.88, (1 - smooth((dist - 0.14) / 0.1)) * band * (0.52 + 0.44 * Math.sqrt(fillA)) * effPresL) : 0;
              const hotL = 0.24 * smooth((field - 0.65) / 0.35);
              const ancR = customMode ? baseR * 0.85 : 46;
              const ancG = customMode ? baseG * 0.85 : 92;
              const ancB = customMode ? baseB * 0.85 : 235;
              const inkR = baseR * (1 - hotL) + ancR * hotL;
              const inkG = baseG * (1 - hotL) + ancG * hotL;
              const inkB = baseB * (1 - hotL) + ancB * hotL;
              const compA = fillA + dotA * (1 - fillA);
              if (compA <= 0.002) continue;
              const wFill = (fillA * (1 - dotA)) / compA;
              const wDot = dotA / compA;
              R = Math.round(Math.min(255, Math.max(0, inkR * wFill + dotR * wDot))) & 255;
              G = Math.round(Math.min(255, Math.max(0, inkG * wFill + dotG * wDot))) & 255;
              B = Math.round(Math.min(255, Math.max(0, inkB * wFill + dotB * wDot))) & 255;
            }
            const outA = Math.max(0, Math.min(1, fillA + dotA * (1 - fillA)));
            const A = Math.round(outA * 255) & 255;
            if (A === 0) continue;
            const packed = LITTLE_ENDIAN ? ((A << 24) | (B << 16) | (G << 8) | R) >>> 0 : ((R << 24) | (G << 16) | (B << 8) | A) >>> 0;
            for (let sy = 0; sy < step && py + sy < h; sy++) {
              const rowOff = (py + sy) * w + px;
              for (let sx = 0; sx < step && px + sx < w; sx++) {
                pixels[rowOff + sx] = packed;
              }
            }
          }
        }
        ctx.putImageData(image, 0, 0);
      },
      dispose() {},
    };
  }
  function expClamp(v) {
    return v > 40 ? 0 : Math.exp(-v);
  }

  function parseAmbientScale(raw) {
    if (raw === null || raw === undefined || raw === '') return 1;
    const n = Number(raw);
    if (!Number.isFinite(n)) return 1;
    return n <= 0 ? 0 : n > 1 ? Math.max(0, Math.min(1, n / 100)) : Math.max(0, Math.min(1, n));
  }

  function mountBrandHorizonGlow(canvas, options = {}) {
    if (!canvas) {
      return {
        mode: 'none',
        resize() {},
        invalidate() {},
        clear() {},
        setAuraParams() { return { ...DEFAULT_HORIZON_AURA }; },
        getAuraParams() { return { ...DEFAULT_HORIZON_AURA }; },
        getExtendedState() {
          return { ...DEFAULT_HORIZON_AURA, spectrum: 'default', semantic: 'none', ambientIntensity: 1, sleeping: true };
        },
        draw() {},
        drawStaticSnapshot() { return false; },
        isSleeping() { return true; },
        dispose() {},
      };
    }
    const force2D = Boolean(options.force2D) || (typeof globalThis !== 'undefined' && globalThis.__agRippleForce2D === true);
    const renderer = (force2D ? null : createBrandHorizonGLRenderer(canvas)) || createBrandHorizon2DRenderer(canvas);
    let cssW = Math.max(0, Number(options.width || canvas.clientWidth || 0));
    let cssH = Math.max(0, Number(options.height || canvas.clientHeight || 0));
    let dpr = Math.max(0.5, Math.min(1.75, Number(options.dpr || 1)));
    const baseAura = {
      reach: clampFinite(options.reach, DEFAULT_HORIZON_AURA.reach, 0.05, 1),
      prism: clampFinite(options.prism, DEFAULT_HORIZON_AURA.prism, 0, 1),
      surge: clampFinite(options.surge, DEFAULT_HORIZON_AURA.surge, -1, 1),
      speed: clampFinite(options.speed, DEFAULT_HORIZON_AURA.speed, 0, 3),
    };
    const activeAura = { ...baseAura };
    let baseSpectrum = options.spectrum !== undefined ? String(options.spectrum) : (options.accent !== undefined ? String(options.accent) : null);
    let baseSemantic = options.semantic !== undefined ? String(options.semantic) : 'none';
    let baseAmbient = clampFinite(options.ambientIntensity, 1, 0, 1);
    let activeSpectrum = baseSpectrum || 'default';
    let activeSemantic = baseSemantic;
    let activeAmbient = baseAmbient;
    let hasCustom = options.reach !== undefined || options.prism !== undefined || options.surge !== undefined || options.speed !== undefined;
    let startMs = null;
    let lastClockMs = null;
    let lastRawNow = null;
    let flowSec = 0;
    let lastDrawMs = -Infinity;
    let lastDark = null;
    let lastStrength = -1;
    let lastReach = -1;
    let lastPrism = -1;
    let lastSurge = -9;
    let lastSpeed = -1;
    let lastSpectrum = -1;
    let lastSemantic = -1;
    let clearedZero = false;
    let stale = true;
    let sleeping = false;
    function onContextLost(e) { if (e && e.preventDefault) e.preventDefault(); }
    function onContextRestored() {
      if (renderer && renderer.build) renderer.build();
      stale = true;
    }
    if (canvas.addEventListener) {
      canvas.addEventListener('webglcontextlost', onContextLost);
      canvas.addEventListener('webglcontextrestored', onContextRestored);
    }
    function syncSize(w, h, nextDpr) {
      const nw = Math.max(0, Math.round(Number(w || 0)));
      const nh = Math.max(0, Math.round(Number(h || 0)));
      const nd = Math.max(0.5, Math.min(1.75, Number(nextDpr || dpr || 1)));
      const pw = Math.max(1, Math.round(nw * nd));
      const ph = Math.max(1, Math.round(nh * nd));
      if (nw !== cssW || nh !== cssH || nd !== dpr || canvas.width !== pw || canvas.height !== ph) {
        cssW = nw;
        cssH = nh;
        dpr = nd;
        if (nw > 0 && nh > 0) {
          canvas.width = pw;
          canvas.height = ph;
        }
        clearedZero = false;
        stale = true;
      }
    }
    if (cssW > 0 && cssH > 0 && (!canvas.width || !canvas.height)) {
      syncSize(cssW, cssH, dpr);
    }
    function setAuraParams(extra) {
      if (!extra || typeof extra !== 'object') {
        baseAura.reach = DEFAULT_HORIZON_AURA.reach;
        baseAura.prism = DEFAULT_HORIZON_AURA.prism;
        baseAura.surge = DEFAULT_HORIZON_AURA.surge;
        baseAura.speed = DEFAULT_HORIZON_AURA.speed;
        baseSpectrum = null;
        baseSemantic = 'none';
        baseAmbient = 1;
        activeSpectrum = 'default';
        activeSemantic = 'none';
        activeAmbient = 1;
        hasCustom = false;
      } else {
        if (extra.reach !== undefined) baseAura.reach = clampFinite(extra.reach, baseAura.reach, 0.05, 1);
        if (extra.prism !== undefined) baseAura.prism = clampFinite(extra.prism, baseAura.prism, 0, 1);
        if (extra.surge !== undefined) baseAura.surge = clampFinite(extra.surge, baseAura.surge, -1, 1);
        if (extra.speed !== undefined) baseAura.speed = clampFinite(extra.speed, baseAura.speed, 0, 3);
        if (extra.spectrum !== undefined || extra.accent !== undefined) {
          baseSpectrum = String(extra.spectrum ?? extra.accent);
          activeSpectrum = baseSpectrum;
        }
        if (extra.semantic !== undefined) {
          baseSemantic = String(extra.semantic);
          activeSemantic = baseSemantic;
        }
        if (extra.ambientIntensity !== undefined) {
          baseAmbient = clampFinite(extra.ambientIntensity, baseAmbient, 0, 1);
          activeAmbient = baseAmbient;
        }
        hasCustom = true;
      }
      Object.assign(activeAura, baseAura);
      stale = true;
      return { ...activeAura };
    }
    function clearCanvas() {
      if (renderer && typeof renderer.clear === 'function') {
        renderer.clear();
      }
      clearedZero = true;
      sleeping = true;
    }
    function renderInternal(nowInput, isDarkOrOpts = {}, strengthArg, extraArg, forceStatic = false) {
      if (!renderer || canvas.width <= 0 || canvas.height <= 0 || isCanvasDocHidden(canvas)) return false;
      // 支持 drawStaticSnapshot({ dark, strength, ... }) 单对象简写
      if (forceStatic && nowInput && typeof nowInput === 'object') {
        extraArg = strengthArg;
        strengthArg = isDarkOrOpts;
        isDarkOrOpts = nowInput;
        nowInput = 0;
      }
      const isObjOpts = typeof isDarkOrOpts === 'object' && isDarkOrOpts !== null;
      let still = forceStatic;
      let dark = true;
      let rawStrength = 1;
      let extra = null;
      if (isObjOpts) {
        still = forceStatic || Boolean(isDarkOrOpts.still || isDarkOrOpts.staticSnapshot);
        dark = isDarkOrOpts.dark !== false;
        rawStrength = isDarkOrOpts.strength ?? isDarkOrOpts.prismStrength ?? 1;
        const nested = (strengthArg && typeof strengthArg === 'object')
          ? strengthArg
          : (isDarkOrOpts.extra && typeof isDarkOrOpts.extra === 'object' ? isDarkOrOpts.extra : null);
        if (
          nested ||
          isDarkOrOpts.reach !== undefined ||
          isDarkOrOpts.prism !== undefined ||
          isDarkOrOpts.surge !== undefined ||
          isDarkOrOpts.speed !== undefined ||
          isDarkOrOpts.spectrum !== undefined ||
          isDarkOrOpts.accent !== undefined ||
          isDarkOrOpts.semantic !== undefined ||
          isDarkOrOpts.ambientIntensity !== undefined
        ) {
          extra = nested ? { ...isDarkOrOpts, ...nested } : isDarkOrOpts;
        }
      } else {
        dark = isDarkOrOpts !== false;
        rawStrength = strengthArg ?? 1;
        extra = extraArg && typeof extraArg === 'object' ? extraArg : null;
        still = forceStatic || Boolean(extra && (extra.still || extra.staticSnapshot));
      }
      const ambient = extra && extra.ambientIntensity !== undefined
        ? clampFinite(extra.ambientIntensity, baseAmbient, 0, 1)
        : baseAmbient;
      activeAmbient = ambient;
      const strength = clampFinite(rawStrength, 1, 0, 1) * ambient;
      if (ambient <= 0 || (forceStatic && strength <= 0)) {
        if (!clearedZero) clearCanvas();
        else sleeping = true;
        return false;
      }
      const reach = extra && extra.reach !== undefined ? clampFinite(extra.reach, baseAura.reach, 0.05, 1) : baseAura.reach;
      const prism = extra && extra.prism !== undefined ? clampFinite(extra.prism, baseAura.prism, 0, 1) : baseAura.prism;
      const surge = extra && extra.surge !== undefined ? clampFinite(extra.surge, baseAura.surge, -1, 1) : baseAura.surge;
      const speed = extra && extra.speed !== undefined ? clampFinite(extra.speed, baseAura.speed, 0, 3) : baseAura.speed;
      const rawSpec = extra && (extra.spectrum !== undefined || extra.accent !== undefined)
        ? (extra.spectrum ?? extra.accent)
        : baseSpectrum;
      const spectrumCode = rawSpec !== null && rawSpec !== undefined
        ? resolveHorizonSpectrumCode(rawSpec)
        : detectHostSpectrumCode(canvas, dark);
      const rawSem = extra && extra.semantic !== undefined ? extra.semantic : baseSemantic;
      const semanticCode = resolveHorizonSemanticCode(rawSem);
      activeAura.reach = reach;
      activeAura.prism = prism;
      activeAura.surge = surge;
      activeAura.speed = speed;
      activeSpectrum = rawSpec || (spectrumCode === 1 ? 'warm' : 'default');
      activeSemantic = String(rawSem || 'none');

      const rawNow = Number(nowInput || 0);
      const inSec = Boolean(extra && extra.timeUnit === 'sec') || (!isObjOpts && lastRawNow !== null && rawNow > 0 && rawNow < 1e4 && Math.abs(rawNow - lastRawNow) > 0 && Math.abs(rawNow - lastRawNow) < 0.5);
      lastRawNow = rawNow;
      const nowMs = inSec ? rawNow * 1000 : rawNow;
      if (startMs === null) startMs = nowMs;
      const ext = Boolean(extra) || hasCustom;
      const realSec = still ? 0 : Math.max(0, (nowMs - startMs) / 1000);
      const ramp = (still || forceStatic || ext) ? 1 : -(Math.cos(Math.PI * Math.min(1, Math.max(0, realSec / 1.4))) - 1) * 0.5;
      const basePresence = Math.max(0.22, ramp);
      const dirty = forceStatic
        || dark !== lastDark
        || spectrumCode !== lastSpectrum
        || semanticCode !== lastSemantic
        || Math.abs(strength - lastStrength) >= 0.005
        || Math.abs(reach - lastReach) >= 0.002
        || Math.abs(prism - lastPrism) >= 0.002
        || Math.abs(surge - lastSurge) >= 0.001
        || Math.abs(speed - lastSpeed) >= 0.005;
      const isGpuGlow = Boolean(renderer && renderer.mode === 'webgl2');
      const frameGap = isGpuGlow ? 0 : (ext ? 14 : (basePresence < 1 ? 33 : 42));
      if (!stale && !dirty && (still || (frameGap > 0 && Math.abs(nowMs - lastDrawMs) < frameGap))) {
        if (forceStatic) sleeping = true;
        return false;
      }
      if (forceStatic) {
        if (flowSec === 0) flowSec = 2.4;
        lastClockMs = nowMs;
        sleeping = true;
      } else if (still) {
        flowSec = 0;
        lastClockMs = nowMs;
        sleeping = true;
      } else {
        sleeping = false;
        if (lastClockMs === null || nowMs < lastClockMs) {
          if (lastClockMs === null) flowSec = realSec * speed;
          lastClockMs = nowMs;
        } else {
          const dtSec = Math.max(0, (nowMs - lastClockMs) / 1000);
          lastClockMs = nowMs;
          flowSec += dtSec * speed;
        }
      }
      const breath = forceStatic
        ? 0.64
        : (still ? 0.58 : 0.46 + 0.24 * Math.sin(flowSec * 1.15) + 0.06 * Math.sin(flowSec * 2.05 + 0.9));
      const isDefaultHome = !ext && strength >= 0.999;
      const intensity = isDefaultHome ? breath * (0.2 + 0.8 * strength) : breath * (0.55 + 0.45 * strength);
      const strengthGain = strength <= 0 ? 0 : (strength >= 0.999 ? 1 : Math.pow(strength, 0.78));
      const presence = basePresence * strengthGain;
      renderer.draw(canvas.width, canvas.height, dpr, 12 + flowSec, dark, intensity, presence, reach, prism, surge, speed, spectrumCode, semanticCode);
      clearedZero = false;
      lastDrawMs = nowMs;
      lastDark = dark;
      lastStrength = strength;
      lastReach = reach;
      lastPrism = prism;
      lastSurge = surge;
      lastSpeed = speed;
      lastSpectrum = spectrumCode;
      lastSemantic = semanticCode;
      stale = false;
      return true;
    }
    return {
      mode: renderer ? renderer.mode : 'none',
      resize(w, h, nextDpr) {
        syncSize(w, h, nextDpr);
      },
      invalidate() {
        stale = true;
      },
      clear: clearCanvas,
      setAuraParams,
      getAuraParams() {
        return { ...activeAura };
      },
      getExtendedState() {
        return {
          ...activeAura,
          spectrum: activeSpectrum,
          semantic: activeSemantic,
          ambientIntensity: activeAmbient,
          sleeping,
        };
      },
      isSleeping() {
        return sleeping;
      },
      draw(nowInput, isDarkOrOpts = {}, strengthArg, extraArg) {
        return renderInternal(nowInput, isDarkOrOpts, strengthArg, extraArg, false);
      },
      drawStaticSnapshot(nowInput, isDarkOrOpts = {}, strengthArg, extraArg) {
        stale = true;
        return renderInternal(nowInput, isDarkOrOpts, strengthArg, extraArg, true);
      },
      dispose() {
        sleeping = true;
        if (canvas.removeEventListener) {
          canvas.removeEventListener('webglcontextlost', onContextLost);
          canvas.removeEventListener('webglcontextrestored', onContextRestored);
        }
        if (renderer) renderer.dispose();
      },
    };
  }
  return {
    RIPPLE,
    SPECTRUM,
    SPECTRUM_LIGHT,
    HORIZON_SPECTRUM,
    HORIZON_PRISM_STOPS,
    HORIZON_DAYLIGHT_STOPS,
    HORIZON_SPECTRUM_MODES,
    HORIZON_SEMANTIC_MODES,
    HORIZON_FRAGMENT_SHADER,
    GLOW_FRAG_SHADER,
    DEFAULT_HORIZON_AURA,
    GLYPHS,
    hash,
    valueNoise,
    fractalNoise,
    glyphIndex,
    cloudClear,
    patchClear,
    spectrumRgb,
    horizonPrismRgb,
    resolveHorizonSpectrumCode,
    resolveHorizonSemanticCode,
    resolveHorizonDpr,
    computeNebulaLobes,
    createWaveField,
    parseCssColorToRgb,
    parseAmbientScale,
    createGlyphField,
    mountBrandHorizonGlow,
  };
});
