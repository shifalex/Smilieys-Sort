import { features } from "./features.js";
import { shuffle, triadKey } from "./utils.js";

export function makeSmileys(count, featureCount) {
  for (let attempt = 0; attempt < 600; attempt += 1) {
    const smileys = makeUniqueSmileys(count);
    if (hasEnoughUniqueTriads(smileys, featureCount)) {
      return smileys;
    }
  }

  return makeUniqueSmileys(count);
}

export function makeUniqueSmileys(count) {
  const allSmileys = makeAllSmileyCombinations();

  shuffle(allSmileys);
  const seed = allSmileys[0];
  const opposite = allSmileys.find(smiley =>
    smiley.shape !== seed.shape &&
    smiley.color !== seed.color &&
    smiley.expression !== seed.expression &&
    smiley.hat !== seed.hat &&
    smiley.ears !== seed.ears
  );
  const selected = [seed, opposite];
  allSmileys.forEach(smiley => {
    if (selected.length >= count) return;
    if (!selected.includes(smiley)) {
      selected.push(smiley);
    }
  });

  shuffle(selected);
  return makePlayableSmileys(selected.slice(0, count));
}

export function makeAllSmileyCombinations() {
  const allSmileys = [];
  ["round", "square"].forEach(shape => {
    ["yellow", "red"].forEach(color => {
      ["smile", "neutral"].forEach(expression => {
        [true, false].forEach(hat => {
          [true, false].forEach(ears => {
            allSmileys.push({ shape, color, expression, hat, ears });
          });
        });
      });
    });
  });
  return allSmileys;
}

export function makePlayableSmileys(baseSmileys) {
  return baseSmileys.map((smiley, index) => ({
    ...smiley,
    id: `smiley-${Date.now()}-${index}`,
    zone: "tray",
    originalOrder: index,
    placementOrder: index
  }));
}

export function featureCountForSmileyCount(count) {
  if (count <= 3) return 1;
  if (count <= 5) return 2;
  if (count <= 7) return 3;
  if (count <= 9) return 4;
  return 5;
}

function hasEnoughUniqueTriads(smileys, featureCount) {
  const triads = features.map(feature => {
    const withCount = smileys.filter(feature.get).length;
    const withoutCount = smileys.length - withCount;
    return triadKey(withCount, withoutCount, smileys.length);
  });
  return new Set(triads).size >= featureCount;
}
