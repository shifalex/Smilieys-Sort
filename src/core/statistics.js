import { makePlayableSmileys } from "./smileys.js";
import { shuffle } from "./utils.js";

export const BEARD_LEVELS = [
  { value: 0, key: "none", label: "No beard" },
  { value: 2, key: "goatee", label: "Goatee" },
  { value: 3, key: "full", label: "Full beard" },
  { value: 4, key: "long", label: "Long beard" }
];

export function makeStatisticsBeardSmileys(count = 7) {
  const values = makeBeardValues(count);
  const appearances = makeUniqueStatisticsAppearances();
  const baseSmileys = values.map((beardLevel, index) => ({
    ...appearances[index],
    expression: index % 2 === 0 ? "smile" : "neutral",
    beardLevel
  }));
  return makePlayableSmileys(shuffle(baseSmileys));
}

export function makeStatisticsCoinSmileys(count = 5) {
  if (count >= 3 && count <= 10) {
    return makeCoinSmileysFromValues(makeBalancedAverageCoinValues(count));
  }

  for (let attempt = 0; attempt < 300; attempt += 1) {
    const coinValues = Array.from({ length: count }, () => Math.floor(Math.random() * 5) + 1);
    const total = coinValues.reduce((sum, value) => sum + value, 0);
    if (total % count === 0 && new Set(coinValues).size >= 3) {
      return makeCoinSmileysFromValues(coinValues);
    }
  }

  return makeCoinSmileysFromValues([1, 2, 3, 4, 5]);
}

function makeBalancedAverageCoinValues(count) {
  const average = [2, 3, 4][Math.floor(Math.random() * 3)];
  const values = Array.from({ length: count }, () => average);
  const maxDistance = Math.min(average - 1, 5 - average);
  const indexes = shuffle(Array.from({ length: count }, (_, index) => index));

  for (let index = 0; index < indexes.length - 1; index += 2) {
    const firstIndex = indexes[index];
    const secondIndex = indexes[index + 1];
    const distance = 1 + Math.floor(Math.random() * maxDistance);
    values[firstIndex] -= distance;
    values[secondIndex] += distance;
  }

  return shuffle(values);
}

export function addBeardLengthCoins(smileys) {
  return smileys.map(smiley => ({
    ...smiley,
    coins: smiley.beardLevel
  }));
}

export function makeWeightedAverageChallenge() {
  const counts = [1, 2, 3, 2, 1];
  shuffle(counts);
  const totalWeight = counts.reduce((sum, count) => sum + count, 0);
  const totalValue = counts.reduce((sum, count, index) => sum + count * BEARD_LEVELS[index].value, 0);
  return {
    counts,
    answer: totalValue / totalWeight,
    totalWeight
  };
}

export function getBeardLabel(value) {
  return BEARD_LEVELS.find(level => level.value === value)?.label || "";
}

export function getBeardModeValue(smileys) {
  const counts = countBeards(smileys);
  return [...counts.entries()].sort((first, second) => second[1] - first[1] || first[0] - second[0])[0][0];
}

export function getMedianBeardValue(smileys) {
  const values = smileys.map(smiley => smiley.beardLevel).sort((first, second) => first - second);
  return values[Math.floor(values.length / 2)];
}

export function countBeards(smileys) {
  return smileys.reduce((counts, smiley) => {
    counts.set(smiley.beardLevel, (counts.get(smiley.beardLevel) || 0) + 1);
    return counts;
  }, new Map(BEARD_LEVELS.map(level => [level.value, 0])));
}

function makeBeardValues(count) {
  const templates = {
    7: {
      0: [[0, 0, 0, 0, 2, 2, 3]],
      2: [[0, 2, 2, 2, 2, 3, 3]],
      3: [[2, 2, 3, 3, 3, 4, 4]],
      4: [[0, 2, 3, 4, 4, 4, 4]]
    },
    9: {
      0: [[0, 0, 0, 0, 0, 2, 2, 2, 3]],
      2: [[0, 2, 2, 2, 2, 2, 2, 3, 3]],
      3: [[2, 2, 3, 3, 3, 3, 3, 4, 4]],
      4: [[0, 2, 2, 3, 4, 4, 4, 4, 4]]
    },
    11: {
      0: [[0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 3]],
      2: [[0, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3]],
      3: [[2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4]],
      4: [[0, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4]]
    }
  };
  const winnerOptions = [0, 2, 2, 3, 3, 4];
  const winner = winnerOptions[Math.floor(Math.random() * winnerOptions.length)];
  const options = (templates[count] || templates[7])[winner];
  return shuffle([...options[Math.floor(Math.random() * options.length)]]);
}

function makeUniqueStatisticsAppearances() {
  const appearances = [];
  ["round", "square"].forEach(shape => {
    ["yellow", "red"].forEach(color => {
      [false, true].forEach(hat => {
        [false, true].forEach(ears => {
          appearances.push({ shape, color, hat, ears });
        });
      });
    });
  });
  return shuffle(appearances);
}

function makeCoinSmileysFromValues(coinValues) {
  const baseSmileys = coinValues.map((coins, index) => ({
    shape: "round",
    color: index % 2 === 0 ? "yellow" : "red",
    expression: coins >= 3 ? "smile" : "neutral",
    hat: false,
    ears: false,
    coins
  }));
  return makePlayableSmileys(shuffle(baseSmileys));
}
