const WORD_ROUNDS = 7;
const LIKELIHOOD_POWER = 1.2;

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

const UNIFORM_PRIOR = AGE_BINS.map(() => 1 / AGE_BINS.length);
const WORD_META = buildWordMetadata();

const wordDom = {
  gameCard: document.getElementById("wordGameCard"),
  resultCard: document.getElementById("wordResultCard"),
  roundLabel: document.getElementById("wordRoundLabel"),
  progressBar: document.getElementById("wordProgressBar"),
  promptText: document.getElementById("wordPromptText"),
  leftChoice: document.getElementById("wordChoiceLeft"),
  rightChoice: document.getElementById("wordChoiceRight"),
  leftToken: document.getElementById("leftToken"),
  rightToken: document.getElementById("rightToken"),
  ageResult: document.getElementById("wordAgeResult"),
  confidenceText: document.getElementById("wordConfidenceText"),
  playAgain: document.getElementById("playWordsAgain")
};

const wordState = {
  rounds: [],
  selections: [],
  roundIndex: 0,
  posterior: [],
  locked: false
};

startWordGame();

wordDom.leftChoice.addEventListener("click", () => selectWord("left"));
wordDom.rightChoice.addEventListener("click", () => selectWord("right"));
wordDom.playAgain.addEventListener("click", startWordGame);

document.addEventListener("keydown", (event) => {
  if (wordState.locked || wordDom.gameCard.classList.contains("hidden")) {
    return;
  }

  if (event.key.toLowerCase() === "a" || event.key === "ArrowLeft") {
    selectWord("left");
  }

  if (event.key.toLowerCase() === "l" || event.key === "ArrowRight") {
    selectWord("right");
  }
});

function startWordGame() {
  wordState.rounds = buildWordRounds(WORD_ROUNDS);
  wordState.selections = [];
  wordState.roundIndex = 0;
  wordState.posterior = [...UNIFORM_PRIOR];
  wordState.locked = false;

  wordDom.gameCard.classList.remove("hidden");
  wordDom.resultCard.classList.add("hidden");

  renderWordRound();
}

function buildWordRounds(total) {
  const pickedGroups = shuffle([...WORD_GROUPS]).slice(0, total);

  return pickedGroups.map((group, index) => {
    const pair = pickScoredPair(group.words);
    const olderLeft = Math.random() > 0.5;

    return {
      round: index + 1,
      theme: group.theme,
      leftWord: olderLeft ? pair.high.word : pair.low.word,
      rightWord: olderLeft ? pair.low.word : pair.high.word,
      olderLeft,
      signalStrength: clamp(1 + pair.gap * 1.9 + randomRange(Math.random, 0.05, 0.2), 1.2, 2.3),
      midpoint: themeMidpoint(group.theme),
      spread: themeSpread(group.theme)
    };
  });
}

function renderWordRound() {
  const round = wordState.rounds[wordState.roundIndex];
  const roundNo = wordState.roundIndex + 1;

  wordState.locked = false;
  wordDom.leftChoice.classList.remove("selected");
  wordDom.rightChoice.classList.remove("selected");

  wordDom.roundLabel.textContent = `Round ${roundNo} of ${WORD_ROUNDS}`;
  wordDom.progressBar.style.width = `${((roundNo - 1) / WORD_ROUNDS) * 100}%`;
  wordDom.promptText.textContent = "Pick the word that feels more like you right now.";
  wordDom.leftToken.textContent = round.leftWord;
  wordDom.rightToken.textContent = round.rightWord;
}

function selectWord(side) {
  if (wordState.locked) {
    return;
  }

  wordState.locked = true;

  const round = wordState.rounds[wordState.roundIndex];
  const pickedLeft = side === "left";

  wordDom.leftChoice.classList.toggle("selected", pickedLeft);
  wordDom.rightChoice.classList.toggle("selected", !pickedLeft);

  updatePosterior(round, pickedLeft);

  wordState.selections.push({
    theme: round.theme,
    pickedWord: pickedLeft ? round.leftWord : round.rightWord,
    rejectedWord: pickedLeft ? round.rightWord : round.leftWord,
    pickedOlder: pickedLeft ? round.olderLeft : !round.olderLeft
  });

  setTimeout(() => {
    wordState.roundIndex += 1;

    if (wordState.roundIndex >= WORD_ROUNDS) {
      revealWordResult();
      return;
    }

    renderWordRound();
  }, 180);
}

function updatePosterior(round, pickedLeft) {
  let total = 0;

  wordState.posterior = wordState.posterior.map((prior, i) => {
    const age = AGE_BINS[i].center;
    const pLeft = probabilityChooseLeft(age, round);
    const likelihood = pickedLeft ? pLeft : 1 - pLeft;
    const posterior = prior * Math.pow(Math.max(likelihood, 0.001), LIKELIHOOD_POWER);
    total += posterior;
    return posterior;
  });

  if (total <= 0) {
    wordState.posterior = [...UNIFORM_PRIOR];
    return;
  }

  wordState.posterior = wordState.posterior.map((value) => value / total);
}

function probabilityChooseLeft(age, round) {
  const ageSignal = Math.tanh((age - round.midpoint) / round.spread);
  const orientation = round.olderLeft ? 1 : -1;
  const logit = ageSignal * round.signalStrength * orientation;
  const value = 1 / (1 + Math.exp(-logit));
  return clamp(value, 0.18, 0.82);
}

function revealWordResult() {
  const adjustedPosterior = stabilizePosterior(wordState.posterior);
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

  wordDom.ageResult.textContent = best.label;
  wordDom.confidenceText.textContent = `Confidence ${confidence}%`;
  wordDom.progressBar.style.width = "100%";
  wordDom.gameCard.classList.add("hidden");
  wordDom.resultCard.classList.remove("hidden");
}

function pickScoredPair(words) {
  const entries = words.map((word) => ({
    word,
    score: WORD_META[word].score
  }));

  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let tries = 0; tries < 36; tries += 1) {
    const i = Math.floor(Math.random() * entries.length);
    let j = Math.floor(Math.random() * entries.length);
    while (j === i) {
      j = Math.floor(Math.random() * entries.length);
    }

    const first = entries[i];
    const second = entries[j];
    const gap = Math.abs(first.score - second.score);

    if (gap >= 0.26 && gap <= 0.78) {
      return first.score >= second.score
        ? { high: first, low: second, gap }
        : { high: second, low: first, gap };
    }

    const distance = Math.abs(gap - 0.46);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = first.score >= second.score
        ? { high: first, low: second, gap }
        : { high: second, low: first, gap };
    }
  }

  return best;
}

function buildWordMetadata() {
  const meta = {};

  WORD_GROUPS.forEach((group, groupIndex) => {
    const groupBias = normalizedNoise(`theme:${group.theme}:${groupIndex}`) * 0.16;

    group.words.forEach((word, wordIndex) => {
      const normalizedIndex = (wordIndex / (group.words.length - 1)) * 2 - 1;
      const localNoise = normalizedNoise(`${group.theme}:${word}`) * 0.34;
      const score = clamp(normalizedIndex * 0.62 + localNoise + groupBias, -1, 1);

      meta[word] = {
        theme: group.theme,
        score
      };
    });
  });

  return meta;
}

function themeMidpoint(theme) {
  const h = hashString(`midpoint:${theme}`);
  return clamp(24 + (h % 26), 22, 50);
}

function themeSpread(theme) {
  const h = hashString(`spread:${theme}`);
  return 8 + (h % 5);
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

function normalizedNoise(key) {
  const hash = hashString(key);
  return (hash % 10000) / 5000 - 1;
}

function hashString(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function randomRange(rng, min, max) {
  return min + (max - min) * rng();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function clampInt(value, min, max) {
  return Math.floor(clamp(value, min, max));
}
