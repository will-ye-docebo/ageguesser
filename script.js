const AGE_BINS = [
  { min: 13, max: 17 },
  { min: 18, max: 22 },
  { min: 23, max: 27 },
  { min: 28, max: 32 },
  { min: 33, max: 37 },
  { min: 38, max: 42 },
  { min: 43, max: 47 },
  { min: 48, max: 52 },
  { min: 53, max: 57 },
  { min: 58, max: 62 }
].map((bin) => ({
  ...bin,
  center: (bin.min + bin.max) / 2,
  label: `${bin.min}-${bin.max}`
}));

const TARGET_ROUNDS = 7;
const UNIFORM_PRIOR = AGE_BINS.map(() => 1 / AGE_BINS.length);
const LIKELIHOOD_POWER = 1.28;
const MODEL_SENSITIVITY = 1.18;

const ROUND_LIBRARY = [
  {
    id: "window-echo",
    prompt: "Which version feels more complete?",
    baseHue: 24,
    scene: 0,
    vector: { warm: 0.44, texture: 0.54, density: 0.18, contrast: -0.26, curvature: 0.18, glow: -0.08, motion: -0.22 },
    model: { midpoint: 36, spread: 11, amplitude: 0.14, direction: 1 }
  },
  {
    id: "night-frames",
    prompt: "Pick the image you would keep on your screen.",
    baseHue: 208,
    scene: 1,
    vector: { warm: -0.28, texture: -0.22, density: -0.12, contrast: 0.38, curvature: -0.2, glow: 0.36, motion: 0.14 },
    model: { midpoint: 27, spread: 10, amplitude: 0.13, direction: 1 }
  },
  {
    id: "coastal-pulse",
    prompt: "Which one feels more natural?",
    baseHue: 196,
    scene: 2,
    vector: { warm: 0.1, texture: 0.34, density: -0.08, contrast: -0.18, curvature: 0.42, glow: -0.05, motion: -0.25 },
    model: { midpoint: 42, spread: 12, amplitude: 0.11, direction: 1 }
  },
  {
    id: "poster-grid",
    prompt: "Choose the image that feels better balanced.",
    baseHue: 8,
    scene: 3,
    vector: { warm: -0.06, texture: -0.12, density: 0.42, contrast: 0.28, curvature: -0.26, glow: 0.08, motion: 0.2 },
    model: { midpoint: 31, spread: 9, amplitude: 0.1, direction: 1 }
  },
  {
    id: "studio-haze",
    prompt: "Pick the one with the better mood.",
    baseHue: 38,
    scene: 4,
    vector: { warm: 0.4, texture: 0.24, density: -0.2, contrast: -0.22, curvature: 0.3, glow: 0.26, motion: -0.18 },
    model: { midpoint: 39, spread: 13, amplitude: 0.1, direction: 1 }
  },
  {
    id: "city-trace",
    prompt: "Which image feels more interesting?",
    baseHue: 216,
    scene: 5,
    vector: { warm: -0.24, texture: 0.04, density: 0.28, contrast: 0.34, curvature: -0.18, glow: 0.24, motion: 0.32 },
    model: { midpoint: 26, spread: 9, amplitude: 0.14, direction: 1 }
  },
  {
    id: "courtyard-shift",
    prompt: "Which one would you look at longer?",
    baseHue: 72,
    scene: 6,
    vector: { warm: 0.28, texture: 0.38, density: 0.18, contrast: -0.16, curvature: 0.14, glow: 0.04, motion: -0.12 },
    model: { midpoint: 47, spread: 10, amplitude: 0.13, direction: 1 }
  },
  {
    id: "print-vs-screen",
    prompt: "Pick the version you prefer at a glance.",
    baseHue: 168,
    scene: 7,
    vector: { warm: -0.2, texture: -0.26, density: -0.08, contrast: 0.22, curvature: -0.22, glow: 0.34, motion: 0.18 },
    model: { midpoint: 34, spread: 11, amplitude: 0.1, direction: 1 }
  },
  {
    id: "memory-lane",
    prompt: "Which image feels more familiar?",
    baseHue: 18,
    scene: 0,
    vector: { warm: 0.34, texture: 0.52, density: 0.14, contrast: -0.28, curvature: 0.24, glow: -0.04, motion: -0.16 },
    model: { midpoint: 44, spread: 8, amplitude: 0.16, direction: 1 }
  },
  {
    id: "clean-lines",
    prompt: "Choose the one that feels cleaner.",
    baseHue: 235,
    scene: 1,
    vector: { warm: -0.18, texture: -0.32, density: -0.22, contrast: 0.3, curvature: -0.3, glow: 0.28, motion: 0.14 },
    model: { midpoint: 29, spread: 12, amplitude: 0.12, direction: 1 }
  }
];

const dom = {
  gameCard: document.getElementById("gameCard"),
  resultCard: document.getElementById("resultCard"),
  roundLabel: document.getElementById("roundLabel"),
  progressBar: document.getElementById("progressBar"),
  promptText: document.getElementById("promptText"),
  choiceLeft: document.getElementById("choiceLeft"),
  choiceRight: document.getElementById("choiceRight"),
  canvasLeft: document.getElementById("canvasLeft"),
  canvasRight: document.getElementById("canvasRight"),
  ageResult: document.getElementById("ageResult"),
  confidenceText: document.getElementById("confidenceText"),
  explanationText: document.getElementById("explanationText"),
  playAgain: document.getElementById("playAgain")
};

const state = {
  rounds: [],
  roundIndex: 0,
  posterior: [],
  locked: false
};

startGame();

dom.choiceLeft.addEventListener("click", () => selectChoice(0));
dom.choiceRight.addEventListener("click", () => selectChoice(1));
dom.playAgain.addEventListener("click", startGame);

document.addEventListener("keydown", (event) => {
  if (state.locked || dom.gameCard.classList.contains("hidden")) {
    return;
  }

  if (event.key.toLowerCase() === "a" || event.key === "ArrowLeft") {
    selectChoice(0);
  }

  if (event.key.toLowerCase() === "l" || event.key === "ArrowRight") {
    selectChoice(1);
  }
});

function startGame() {
  const totalRounds = TARGET_ROUNDS;
  state.rounds = buildRounds(totalRounds);
  state.roundIndex = 0;
  state.posterior = [...UNIFORM_PRIOR];
  state.locked = false;

  dom.resultCard.classList.add("hidden");
  dom.gameCard.classList.remove("hidden");
  dom.explanationText.classList.add("hidden");
  dom.explanationText.textContent = "";

  renderRound();
}

function buildRounds(total) {
  const selected = selectBalancedRounds(total);
  const sessionSeed = Date.now() ^ Math.floor(Math.random() * 1_000_000_000);

  return selected.map((config, idx) => {
    const rng = mulberry32((sessionSeed + idx * 7919) ^ hashString(config.id));
    const base = {
      warm: randomRange(rng, -0.08, 0.08),
      texture: randomRange(rng, -0.06, 0.08),
      density: randomRange(rng, -0.12, 0.12),
      contrast: randomRange(rng, -0.08, 0.08),
      curvature: randomRange(rng, -0.1, 0.1),
      glow: randomRange(rng, -0.1, 0.1),
      motion: randomRange(rng, -0.1, 0.12)
    };

    const signal = randomRange(rng, 0.34, 0.44);
    const olderVariant = jitterStyle(addScaled(base, config.vector, signal), rng, 0.018);
    const youngerVariant = jitterStyle(addScaled(base, config.vector, -signal), rng, 0.018);

    const olderLeft = rng() > 0.5;
    const options = olderLeft
      ? [
          { style: olderVariant, older: true },
          { style: youngerVariant, older: false }
        ]
      : [
          { style: youngerVariant, older: false },
          { style: olderVariant, older: true }
        ];

    return {
      ...config,
      options,
      motifSeed: Math.floor(rng() * 1_000_000_000),
      grainSeeds: [Math.floor(rng() * 1_000_000_000), Math.floor(rng() * 1_000_000_000)]
    };
  });
}

function renderRound() {
  const total = state.rounds.length;
  const roundNo = state.roundIndex + 1;
  const round = state.rounds[state.roundIndex];

  state.locked = false;
  dom.choiceLeft.classList.remove("selected");
  dom.choiceRight.classList.remove("selected");

  dom.roundLabel.textContent = `Round ${roundNo} of ${total}`;
  dom.promptText.textContent = round.prompt;
  dom.progressBar.style.width = `${((roundNo - 1) / total) * 100}%`;

  drawPicture(
    dom.canvasLeft,
    round.options[0].style,
    round.baseHue,
    round.scene,
    round.motifSeed,
    round.grainSeeds[0]
  );
  drawPicture(
    dom.canvasRight,
    round.options[1].style,
    round.baseHue,
    round.scene,
    round.motifSeed,
    round.grainSeeds[1]
  );
}

function selectChoice(choiceIndex) {
  if (state.locked) {
    return;
  }

  state.locked = true;
  dom.choiceLeft.classList.toggle("selected", choiceIndex === 0);
  dom.choiceRight.classList.toggle("selected", choiceIndex === 1);

  const round = state.rounds[state.roundIndex];
  const pickedOlder = round.options[choiceIndex].older;
  updatePosterior(round.model, pickedOlder);

  setTimeout(() => {
    state.roundIndex += 1;

    if (state.roundIndex >= state.rounds.length) {
      revealResult();
      return;
    }

    renderRound();
  }, 220);
}

function updatePosterior(model, pickedOlder) {
  let total = 0;

  state.posterior = state.posterior.map((prior, i) => {
    const age = AGE_BINS[i].center;
    const pOlder = probabilityChooseOlder(age, model);
    const likelihood = pickedOlder ? pOlder : 1 - pOlder;
    const weightedLikelihood = Math.pow(Math.max(likelihood, 0.001), LIKELIHOOD_POWER);
    const posterior = prior * weightedLikelihood;
    total += posterior;
    return posterior;
  });

  if (total <= 0) {
    state.posterior = AGE_BINS.map(() => 1 / AGE_BINS.length);
    return;
  }

  state.posterior = state.posterior.map((p) => p / total);
}

function probabilityChooseOlder(age, model) {
  const { midpoint, spread, amplitude, direction } = model;
  const effectiveAmplitude = amplitude * MODEL_SENSITIVITY;
  const signal = Math.tanh((age - midpoint) / spread);
  return clamp(0.5 + direction * effectiveAmplitude * signal, 0.2, 0.8);
}

function revealResult() {
  const adjustedPosterior = stabilizePosterior(state.posterior);
  const meanAge = weightedMeanAge(adjustedPosterior);
  const modeIndex = indexOfMax(adjustedPosterior);
  const bestIndex = nearestBinIndex(meanAge, modeIndex);
  const best = AGE_BINS[bestIndex];
  const entropy = distributionEntropy(adjustedPosterior);
  const spread = posteriorStdDev(adjustedPosterior, meanAge);
  const certaintyFromEntropy = 1 - entropy;
  const certaintyFromSpread = 1 - clamp((spread - 3.8) / 15.2, 0, 1);
  const confidence = clampInt(
    Math.round(32 + certaintyFromEntropy * 44 + certaintyFromSpread * 18),
    30,
    94
  );

  dom.ageResult.textContent = best.label;
  dom.confidenceText.textContent = `Confidence ${confidence}%`;
  dom.explanationText.classList.add("hidden");
  dom.explanationText.textContent = "";

  dom.progressBar.style.width = "100%";
  dom.gameCard.classList.add("hidden");
  dom.resultCard.classList.remove("hidden");
}

function drawPicture(canvas, style, baseHue, scene, motifSeed, grainSeed) {
  const ctx = canvas.getContext("2d");
  const motifRng = mulberry32(motifSeed);
  const grainRng = mulberry32(grainSeed);

  const hue = wrapHue(baseHue + style.warm * 28 + style.glow * 9);
  const sat = clamp(38 + style.contrast * 22 + style.texture * 8, 16, 86);
  const lightA = clamp(84 + style.warm * 8 - style.contrast * 10, 36, 92);
  const lightB = clamp(50 - style.warm * 8 + style.motion * 6, 12, 80);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, `hsl(${hue}, ${sat}%, ${lightA}%)`);
  gradient.addColorStop(1, `hsl(${wrapHue(hue - 32)}, ${clamp(sat - 12, 10, 80)}%, ${lightB}%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawMotif(ctx, motifRng, style, hue, scene, canvas.width, canvas.height);
  drawFrame(ctx, hue, style, canvas.width, canvas.height);
  drawGrain(ctx, grainRng, style, canvas.width, canvas.height);
}

function drawMotif(ctx, rng, style, hue, scene, w, h) {
  const count = 16 + (scene % 3);
  const softness = clamp(12 + style.curvature * 8, 4, 26);
  const densityScale = 1 + style.density * 0.26;

  for (let i = 0; i < count; i += 1) {
    const x = rng() * w;
    const y = rng() * h;
    const rx = randomRange(rng, 22, 96) * (1 + style.motion * 0.2) * densityScale;
    const ry = randomRange(rng, 16, 70) * (1 - style.motion * 0.18) * densityScale;
    const alpha = randomRange(rng, 0.08, 0.24) * clamp(1 + style.density * 0.3, 0.7, 1.35);
    const localHue = wrapHue(hue + randomRange(rng, -28, 26));

    ctx.fillStyle = `hsla(${localHue}, ${clamp(42 + style.contrast * 14, 18, 76)}%, ${clamp(
      64 + randomRange(rng, -12, 10),
      26,
      90
    )}%, ${alpha})`;

    ctx.beginPath();
    ellipsePath(ctx, x, y, rx, ry, randomRange(rng, 0, Math.PI));
    ctx.filter = `blur(${softness}px)`;
    ctx.fill();
    ctx.filter = "none";
  }

  ctx.lineWidth = clamp(1.2 + style.contrast * 1.8, 0.7, 3.8);
  ctx.globalAlpha = clamp(0.12 + style.glow * 0.14, 0.06, 0.28);
  ctx.strokeStyle = `hsl(${wrapHue(hue + 58)}, ${clamp(50 + style.contrast * 24, 18, 88)}%, ${clamp(
    62 + style.glow * 11,
    24,
    92
  )}%)`;

  if (scene % 4 === 0) {
    for (let i = 0; i < 5; i += 1) {
      const inset = 20 + i * 24;
      roundRectPath(ctx, inset, 20 + i * 8, w - inset * 2, h - 40 - i * 14, clamp(8 + style.curvature * 10, 3, 18));
      ctx.stroke();
    }
  } else if (scene % 4 === 1) {
    for (let i = 0; i < 8; i += 1) {
      const x = (w / 7) * i + randomRange(rng, -4, 4);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + randomRange(rng, -12, 12), h);
      ctx.stroke();
    }
  } else if (scene % 4 === 2) {
    for (let i = 0; i < 7; i += 1) {
      const y = (h / 7) * i + randomRange(rng, -6, 6);
      ctx.beginPath();
      ctx.moveTo(0, y + randomRange(rng, -8, 8));
      ctx.lineTo(w, y + randomRange(rng, -8, 8));
      ctx.stroke();
    }
  } else {
    for (let i = 0; i < 9; i += 1) {
      const startX = randomRange(rng, -20, w * 0.55);
      const startY = randomRange(rng, 0, h);
      const endX = startX + randomRange(rng, w * 0.2, w * 0.8);
      const endY = startY + randomRange(rng, -40, 40);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo((startX + endX) / 2, startY + randomRange(rng, -80, 80), endX, endY);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
}

function drawFrame(ctx, hue, style, w, h) {
  const inset = 10;
  const border = clamp(1.1 + style.contrast * 1.4, 0.9, 3.4);
  const radius = clamp(14 + style.curvature * 10, 8, 28);

  ctx.lineWidth = border;
  ctx.strokeStyle = `hsla(${wrapHue(hue - 24)}, ${clamp(24 + style.texture * 8, 10, 52)}%, ${clamp(
    42 - style.contrast * 8,
    18,
    64
  )}%, 0.66)`;

  roundRectPath(ctx, inset, inset, w - inset * 2, h - inset * 2, radius);
  ctx.stroke();
}

function drawGrain(ctx, rng, style, w, h) {
  const specks = Math.floor(1200 + (style.texture + 1) * 700);
  const alphaBase = clamp(0.016 + style.texture * 0.02, 0.004, 0.06);

  for (let i = 0; i < specks; i += 1) {
    const x = rng() * w;
    const y = rng() * h;
    const bright = rng() > 0.5;
    const a = alphaBase * rng();
    ctx.fillStyle = bright ? `rgba(255,255,255,${a})` : `rgba(14,18,22,${a})`;
    ctx.fillRect(x, y, 1, 1);
  }
}

function roundRectPath(ctx, x, y, width, height, r) {
  const radius = Math.min(r, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function ellipsePath(ctx, x, y, rx, ry, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(rx, ry);
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.closePath();
  ctx.restore();
}

function addScaled(base, vector, scale) {
  const next = {};

  for (const key of Object.keys(vector)) {
    next[key] = clamp((base[key] || 0) + vector[key] * scale, -1, 1);
  }

  return next;
}

function jitterStyle(style, rng, amount) {
  const next = {};

  for (const [key, value] of Object.entries(style)) {
    next[key] = clamp(value + randomRange(rng, -amount, amount), -1, 1);
  }

  return next;
}

function selectBalancedRounds(total) {
  const sorted = [...ROUND_LIBRARY].sort((a, b) => a.model.midpoint - b.model.midpoint);
  if (total >= sorted.length) {
    return shuffle(sorted);
  }

  const picks = [];
  for (let i = 0; i < total; i += 1) {
    const start = Math.floor((i / total) * sorted.length);
    const end = Math.max(start + 1, Math.floor(((i + 1) / total) * sorted.length));
    const index = start + Math.floor(Math.random() * (end - start));
    picks.push(sorted[index]);
  }

  return shuffle(uniqueById(picks));
}

function uniqueById(rounds) {
  const seen = new Set();
  const unique = [];

  for (const round of rounds) {
    if (seen.has(round.id)) {
      continue;
    }
    seen.add(round.id);
    unique.push(round);
  }

  if (unique.length === rounds.length) {
    return unique;
  }

  const remaining = ROUND_LIBRARY.filter((round) => !seen.has(round.id));
  for (const round of shuffle(remaining)) {
    unique.push(round);
    if (unique.length === rounds.length) {
      break;
    }
  }

  return unique;
}

function stabilizePosterior(posterior) {
  const entropy = distributionEntropy(posterior);
  const certainty = 1 - entropy;
  const blend = 0.74 + certainty * 0.2;
  const smoothed = smoothDistribution(posterior);

  return normalizeDistribution(
    smoothed.map((value, i) => value * blend + UNIFORM_PRIOR[i] * (1 - blend))
  );
}

function smoothDistribution(values) {
  return values.map((_, i) => {
    const left = i > 0 ? values[i - 1] : values[i];
    const center = values[i];
    const right = i < values.length - 1 ? values[i + 1] : values[i];
    return left * 0.16 + center * 0.68 + right * 0.16;
  });
}

function normalizeDistribution(values) {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return [...UNIFORM_PRIOR];
  }
  return values.map((value) => value / total);
}

function weightedMeanAge(distribution) {
  return distribution.reduce((sum, probability, i) => sum + probability * AGE_BINS[i].center, 0);
}

function posteriorStdDev(distribution, meanAge) {
  const variance = distribution.reduce((sum, probability, i) => {
    const delta = AGE_BINS[i].center - meanAge;
    return sum + probability * delta * delta;
  }, 0);

  return Math.sqrt(Math.max(variance, 0));
}

function distributionEntropy(distribution) {
  const raw = distribution.reduce((sum, probability) => {
    if (probability <= 0) {
      return sum;
    }
    return sum - probability * Math.log(probability);
  }, 0);

  return raw / Math.log(distribution.length);
}

function nearestBinIndex(age, tieBreakerIndex = 0) {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < AGE_BINS.length; i += 1) {
    const distance = Math.abs(AGE_BINS[i].center - age);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
      continue;
    }

    if (distance === bestDistance && i === tieBreakerIndex) {
      bestIndex = i;
    }
  }

  return bestIndex;
}

function indexOfMax(values) {
  let idx = 0;
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] > values[idx]) {
      idx = i;
    }
  }
  return idx;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function hashString(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let n = Math.imul(t ^ (t >>> 15), 1 | t);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

function randomRange(rng, min, max) {
  return min + (max - min) * rng();
}

function wrapHue(value) {
  return ((value % 360) + 360) % 360;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function clampInt(value, min, max) {
  return Math.floor(clamp(value, min, max));
}
