const features = [
  {
    key: "shape",
    label: "Round face",
    withText: "Round face",
    withoutText: "Round face",
    icon: "shape",
    get: smiley => smiley.shape === "round"
  },
  {
    key: "color",
    label: "Yellow",
    withText: "Yellow",
    withoutText: "Yellow",
    icon: "color",
    get: smiley => smiley.color === "yellow"
  },
  {
    key: "expression",
    label: "Smiling",
    withText: "Smiling",
    withoutText: "Smiling",
    icon: "expression",
    get: smiley => smiley.expression === "smile"
  },
  {
    key: "hat",
    label: "Hat",
    withText: "Hat",
    withoutText: "Hat",
    icon: "hat",
    get: smiley => smiley.hat
  },
  {
    key: "ears",
    label: "Ears",
    withText: "Ears",
    withoutText: "Ears",
    icon: "ears",
    get: smiley => smiley.ears
  }
];

const orderingCriteria = [
  {
    key: "color",
    label: "Yellow",
    get: smiley => smiley.color === "yellow"
  },
  {
    key: "shape",
    label: "Round face",
    get: smiley => smiley.shape === "round"
  },
  {
    key: "expression",
    label: "Smiling",
    get: smiley => smiley.expression === "smile"
  },
  {
    key: "hat",
    label: "Hat",
    get: smiley => smiley.hat
  },
  {
    key: "ears",
    label: "Ears",
    get: smiley => smiley.ears
  }
];

const state = {
  smileys: [],
  activeFeatures: [],
  mission: "feature",
  phase: "setup",
  featureIndex: 0,
  activeOrderingCriteria: [],
  orderingLevel: 1,
  orderingHadMistake: false,
  activeCarrollCriteria: [],
  activeVennCriteria: [],
  activeImplicitCriteria: [],
  requestedCount: 0,
  useNumbers: true,
  countChallenge: null,
  nextPlacementOrder: 1,
  mistakeStreak: 0,
  dragging: null,
  cycleTimers: []
};

const els = {
  setupPanel: document.querySelector("#setupPanel"),
  backButton: document.querySelector("#backButton"),
  missionPanel: document.querySelector("#missionPanel"),
  modePanel: document.querySelector("#modePanel"),
  countPanel: document.querySelector("#countPanel"),
  featureMissionButton: document.querySelector("#featureMissionButton"),
  orderingMissionButton: document.querySelector("#orderingMissionButton"),
  carrollMissionButton: document.querySelector("#carrollMissionButton"),
  vennMissionButton: document.querySelector("#vennMissionButton"),
  implicitMissionButton: document.querySelector("#implicitMissionButton"),
  withNumbersButton: document.querySelector("#withNumbersButton"),
  withoutNumbersButton: document.querySelector("#withoutNumbersButton"),
  workPanel: document.querySelector("#workPanel"),
  countGrid: document.querySelector("#countGrid"),
  progressText: document.querySelector("#progressText"),
  featurePrompt: document.querySelector("#featurePrompt"),
  withHeader: document.querySelector("#withHeader"),
  withoutHeader: document.querySelector("#withoutHeader"),
  trayLabel: document.querySelector("#trayLabel"),
  tray: document.querySelector("#tray"),
  withZone: document.querySelector("#withZone"),
  withoutZone: document.querySelector("#withoutZone"),
  sortTable: document.querySelector("#sortTable"),
  orderingPanel: document.querySelector("#orderingPanel"),
  orderingZone: document.querySelector("#orderingZone"),
  criteriaList: document.querySelector("#criteriaList"),
  carrollPanel: document.querySelector("#carrollPanel"),
  carrollTable: document.querySelector("#carrollTable"),
  carrollTopWith: document.querySelector("#carrollTopWith"),
  carrollTopWithout: document.querySelector("#carrollTopWithout"),
  carrollSideWith: document.querySelector("#carrollSideWith"),
  carrollSideWithout: document.querySelector("#carrollSideWithout"),
  carrollWithWithZone: document.querySelector("#carrollWithWithZone"),
  carrollWithoutWithZone: document.querySelector("#carrollWithoutWithZone"),
  carrollWithWithoutZone: document.querySelector("#carrollWithWithoutZone"),
  carrollWithoutWithoutZone: document.querySelector("#carrollWithoutWithoutZone"),
  vennPanel: document.querySelector("#vennPanel"),
  vennStage: document.querySelector("#vennStage"),
  vennAHead: document.querySelector("#vennAHead"),
  vennBHead: document.querySelector("#vennBHead"),
  vennCHead: document.querySelector("#vennCHead"),
  vennAZone: document.querySelector("#vennAZone"),
  vennBZone: document.querySelector("#vennBZone"),
  vennCZone: document.querySelector("#vennCZone"),
  vennABZone: document.querySelector("#vennABZone"),
  vennACZone: document.querySelector("#vennACZone"),
  vennBCZone: document.querySelector("#vennBCZone"),
  vennABCZone: document.querySelector("#vennABCZone"),
  vennOutsideZone: document.querySelector("#vennOutsideZone"),
  implicitPanel: document.querySelector("#implicitPanel"),
  implicitStage: document.querySelector("#implicitStage"),
  implicitAZone: document.querySelector("#implicitAZone"),
  implicitBZone: document.querySelector("#implicitBZone"),
  implicitABZone: document.querySelector("#implicitABZone"),
  implicitOutsideZone: document.querySelector("#implicitOutsideZone"),
  answerPanel: document.querySelector("#answerPanel"),
  countScheme: document.querySelector("#countScheme"),
  wholeCountInput: document.querySelector("#wholeCountInput"),
  withCountInput: document.querySelector("#withCountInput"),
  withoutCountInput: document.querySelector("#withoutCountInput"),
  withCountLabel: document.querySelector("#withCountLabel"),
  withoutCountLabel: document.querySelector("#withoutCountLabel"),
  submitSortButton: document.querySelector("#submitSortButton"),
  celebration: document.querySelector("#celebration"),
  newSetButton: document.querySelector("#newSetButton"),
  smileyTemplate: document.querySelector("#smileyTemplate")
};

function init() {
  for (let count = 2; count <= 10; count += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = count;
    button.addEventListener("click", () => startSet(count));
    els.countGrid.append(button);
  }

  els.backButton.addEventListener("click", () => showSetup());
  els.featureMissionButton.addEventListener("click", () => chooseFeatureMission());
  els.orderingMissionButton.addEventListener("click", () => startOrderingMission(true));
  els.carrollMissionButton.addEventListener("click", () => startCarrollMission());
  els.vennMissionButton.addEventListener("click", () => startVennMission());
  els.implicitMissionButton.addEventListener("click", () => startImplicitMission());
  els.withNumbersButton.addEventListener("click", () => chooseMode(true));
  els.withoutNumbersButton.addEventListener("click", () => chooseMode(false));
  chooseMode(state.useNumbers);
  if (els.newSetButton) {
    els.newSetButton.addEventListener("click", () => showSetup());
  }
  els.submitSortButton.addEventListener("click", () => validateCurrentPhase());
  els.answerPanel.addEventListener("submit", event => {
    event.preventDefault();
    if (isCelebrating()) return;
    checkCounts();
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Enter" || els.workPanel.classList.contains("hidden")) return;
    if (!els.answerPanel.classList.contains("hidden")) return;
    if (isCelebrating()) return;
    event.preventDefault();
    validateCurrentPhase();
  });
}

function chooseFeatureMission() {
  state.mission = "feature";
  els.missionPanel.classList.add("hidden");
  els.countPanel.classList.remove("hidden");
  els.progressText.textContent = "Choose how many smileys";
}

function chooseMode(useNumbers) {
  state.useNumbers = useNumbers;
  els.withNumbersButton.classList.toggle("is-selected", useNumbers);
  els.withoutNumbersButton.classList.toggle("is-selected", !useNumbers);
  els.withNumbersButton.setAttribute("aria-pressed", String(useNumbers));
  els.withoutNumbersButton.setAttribute("aria-pressed", String(!useNumbers));
}

function startSet(count, clearPendingTimers = true) {
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  const featureCount = featureCountForSmileyCount(count);
  state.mission = "feature";
  state.requestedCount = count;
  state.phase = "sorting";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  state.smileys = makeSmileys(count, featureCount);
  state.activeFeatures = chooseFeatureCycle(state.smileys, featureCount);
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeVennCriteria = [];
  state.activeImplicitCriteria = [];
  state.countChallenge = null;
  state.mistakeStreak = 0;
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  startFeature();
}

function startOrderingMission(resetProgress = false, clearPendingTimers = true) {
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "ordering";
  if (resetProgress) {
    state.orderingLevel = 1;
  }
  const smileyCount = getOrderingSmileyCount();
  state.requestedCount = smileyCount;
  state.phase = "ordering";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  state.smileys = makeSmileys(smileyCount, featureCountForSmileyCount(smileyCount));
  state.activeFeatures = [];
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeVennCriteria = [];
  state.activeImplicitCriteria = [];
  state.countChallenge = null;
  state.mistakeStreak = 0;
  state.orderingHadMistake = false;
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  startOrderingPhase();
}

function startCarrollMission(clearPendingTimers = true) {
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "carroll";
  state.requestedCount = 10;
  state.phase = "carroll";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  const setup = makeCarrollSet();
  state.smileys = setup.smileys;
  state.activeFeatures = [];
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = setup.criteria;
  state.activeVennCriteria = [];
  state.activeImplicitCriteria = [];
  state.countChallenge = null;
  state.mistakeStreak = 0;
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  startCarrollPhase();
}

function startVennMission(clearPendingTimers = true) {
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "venn";
  state.requestedCount = 10;
  state.phase = "venn";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  const setup = makeVennSet();
  state.smileys = setup.smileys;
  state.activeFeatures = [];
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeVennCriteria = setup.criteria;
  state.activeImplicitCriteria = [];
  state.countChallenge = null;
  state.mistakeStreak = 0;
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  startVennPhase();
}

function startImplicitMission(clearPendingTimers = true) {
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "implicit";
  state.requestedCount = 10;
  state.phase = "implicit";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  const setup = makeImplicitSet();
  state.smileys = setup.smileys;
  state.activeFeatures = [];
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeVennCriteria = [];
  state.activeImplicitCriteria = setup.criteria;
  state.countChallenge = null;
  state.mistakeStreak = 0;
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  startImplicitPhase();
}

function showSetup() {
  clearCycleTimers();
  state.smileys = [];
  state.activeFeatures = [];
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeVennCriteria = [];
  state.activeImplicitCriteria = [];
  state.countChallenge = null;
  state.mission = "feature";
  state.orderingLevel = 1;
  state.orderingHadMistake = false;
  state.phase = "setup";
  state.featureIndex = 0;
  els.workPanel.classList.add("hidden");
  els.setupPanel.classList.remove("hidden");
  els.backButton.classList.add("hidden");
  els.missionPanel.classList.remove("hidden");
  els.countPanel.classList.add("hidden");
  els.progressText.textContent = "Choose mission";
}

function startFeature(previousRects = null) {
  const feature = currentFeature();
  state.phase = "sorting";
  state.mistakeStreak = 0;
  state.smileys.forEach(smiley => {
    smiley.zone = "tray";
    smiley.placementOrder = smiley.originalOrder;
  });
  els.sortTable.classList.remove("hidden");
  els.orderingPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  els.trayLabel.textContent = "Smileys to sort";
  if (els.featurePrompt) {
    els.featurePrompt.replaceChildren(createFeatureIcon(feature));
    els.featurePrompt.setAttribute("aria-label", `Sort by ${feature.label}`);
  }
  els.withHeader.replaceChildren(createFeatureIcon(feature));
  els.withHeader.setAttribute("aria-label", `With ${feature.label}`);
  els.withoutHeader.replaceChildren(createFeatureIcon(feature, true));
  els.withoutHeader.setAttribute("aria-label", `Without ${feature.label}`);
  els.progressText.textContent = `${state.featureIndex + 1} of ${state.activeFeatures.length}`;
  els.submitSortButton.textContent = "OK";
  els.submitSortButton.classList.remove("hidden");
  els.answerPanel.classList.add("hidden");
  state.countChallenge = null;
  renderSmileys();
  if (previousRects) {
    animateSmileysFrom(previousRects);
  }
}

function createFeatureIcon(feature, withX = false) {
  const wrapper = document.createElement("span");
  wrapper.className = `feature-icon ${feature.icon}-icon`;
  wrapper.setAttribute("aria-hidden", "true");
  if (withX) {
    wrapper.classList.add("has-red-x");
    const xMark = document.createElement("span");
    xMark.className = "red-x";
    wrapper.append(xMark);
  }

  if (feature.icon === "hat") {
    wrapper.append(document.createElement("span"));
  }

  if (feature.icon === "expression") {
    wrapper.append(document.createElement("span"));
  }

  if (feature.icon === "ears") {
    wrapper.append(document.createElement("span"), document.createElement("span"));
  }

  return wrapper;
}

function makeSmileys(count, featureCount) {
  for (let attempt = 0; attempt < 600; attempt += 1) {
    const smileys = makeUniqueSmileys(count);
    if (hasEnoughUniqueTriads(smileys, featureCount)) {
      return smileys;
    }
  }

  return makeUniqueSmileys(count);
}

function makeUniqueSmileys(count) {
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
  return selected.slice(0, count).map((smiley, index) => ({
    ...smiley,
    id: `smiley-${Date.now()}-${index}`,
    zone: "tray",
    originalOrder: index,
    placementOrder: index
  }));
}

function makeAllSmileyCombinations() {
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

function makePlayableSmileys(baseSmileys) {
  return baseSmileys.map((smiley, index) => ({
    ...smiley,
    id: `smiley-${Date.now()}-${index}`,
    zone: "tray",
    originalOrder: index,
    placementOrder: index
  }));
}

function hasEnoughUniqueTriads(smileys, featureCount) {
  const triads = features.map(feature => {
    const withCount = smileys.filter(feature.get).length;
    const withoutCount = smileys.length - withCount;
    return triadKey(withCount, withoutCount, smileys.length);
  });
  return new Set(triads).size >= featureCount;
}

function makeCarrollSet() {
  for (let attempt = 0; attempt < 600; attempt += 1) {
    const criteria = shuffle([...features]).slice(0, 2);
    const smileys = makeSmileys(10, featureCountForSmileyCount(10));
    if (hasAllCarrollQuadrants(smileys, criteria)) {
      return { smileys, criteria };
    }
  }

  return {
    smileys: makeSmileys(10, featureCountForSmileyCount(10)),
    criteria: shuffle([...features]).slice(0, 2)
  };
}

function hasAllCarrollQuadrants(smileys, criteria) {
  const zones = new Set(smileys.map(smiley => getCarrollZoneForSmiley(smiley, criteria)));
  return zones.size === 4;
}

function makeVennSet() {
  const criteria = shuffle([...features]).slice(0, 3);
  const selected = shuffle(makeAllSmileyCombinations()).slice(0, 10);
  return {
    smileys: makePlayableSmileys(selected),
    criteria
  };
}

function makeImplicitSet() {
  for (let attempt = 0; attempt < 600; attempt += 1) {
    const criteria = shuffle([...features]).slice(0, 2);
    const smileys = makeSmileys(10, featureCountForSmileyCount(10));
    if (hasAllImplicitZones(smileys, criteria)) {
      return { smileys, criteria };
    }
  }

  return {
    smileys: makeSmileys(10, featureCountForSmileyCount(10)),
    criteria: shuffle([...features]).slice(0, 2)
  };
}

function hasAllImplicitZones(smileys, criteria) {
  const zones = new Set(smileys.map(smiley => getImplicitZoneForSmiley(smiley, criteria)));
  return zones.size === 4;
}

function groupSmileysByVennZone(smileys, criteria) {
  const grouped = new Map();
  getVennZoneKeys().forEach(zone => grouped.set(zone, []));
  smileys.forEach(smiley => {
    grouped.get(getVennZoneForSmiley(smiley, criteria)).push(smiley);
  });
  return grouped;
}

function getVennZoneKeys() {
  return ["venn-a", "venn-b", "venn-c", "venn-ab", "venn-ac", "venn-bc", "venn-abc", "venn-outside"];
}

function chooseFeatureCycle(smileys, featureCount) {
  const shuffledFeatures = shuffle([...features]);
  const selected = [];
  const usedTriads = new Set();

  shuffledFeatures.forEach(feature => {
    if (selected.length >= featureCount) return;
    const key = triadForFeature(smileys, feature);
    if (!usedTriads.has(key)) {
      selected.push(feature);
      usedTriads.add(key);
    }
  });

  shuffledFeatures.forEach(feature => {
    if (selected.length >= featureCount) return;
    if (!selected.includes(feature)) {
      selected.push(feature);
    }
  });

  return selected;
}

function triadForFeature(smileys, feature) {
  const withCount = smileys.filter(feature.get).length;
  const withoutCount = smileys.length - withCount;
  return triadKey(withCount, withoutCount, smileys.length);
}

function featureCountForSmileyCount(count) {
  if (count <= 3) return 1;
  if (count <= 5) return 2;
  if (count <= 7) return 3;
  if (count <= 9) return 4;
  return 5;
}

function triadKey(first, second, whole) {
  return `${Math.min(first, second)}-${Math.max(first, second)}-${whole}`;
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function renderSmileys(excludedId = null) {
  cleanupStrandedDragNodes();
  getAllDropContainers().forEach(zone => zone.replaceChildren());
  getSmileysInRenderOrder().forEach(smiley => {
    if (smiley.id === excludedId) {
      if (smiley.zone === "order") {
        els.orderingZone.append(createOrderPlaceholder());
      }
      return;
    }
    const node = createSmileyNode(smiley);
    getZoneElement(smiley.zone).append(node);
  });
}

function createOrderPlaceholder() {
  const placeholder = document.createElement("span");
  placeholder.className = "smiley-placeholder";
  placeholder.setAttribute("aria-hidden", "true");
  return placeholder;
}

function cleanupStrandedDragNodes() {
  if (state.dragging) return;
  document.querySelectorAll("body > .smiley.dragging").forEach(node => node.remove());
}

function getSmileysInRenderOrder() {
  return [...state.smileys].sort((first, second) => {
    const firstZoneRank = zoneRank(first.zone);
    const secondZoneRank = zoneRank(second.zone);
    if (firstZoneRank !== secondZoneRank) {
      return firstZoneRank - secondZoneRank;
    }
    const firstOrder = first.zone === "tray" ? first.originalOrder : first.placementOrder;
    const secondOrder = second.zone === "tray" ? second.originalOrder : second.placementOrder;
    return firstOrder - secondOrder;
  });
}

function zoneRank(zone) {
  if (zone === "tray") return 0;
  if (zone === "with") return 1;
  if (zone === "without") return 2;
  if (zone.startsWith("carroll")) return 3;
  if (zone.startsWith("venn")) return 4;
  if (zone.startsWith("implicit")) return 5;
  return 3;
}

function getAllDropContainers() {
  return [
    els.tray,
    els.withZone,
    els.withoutZone,
    els.orderingZone,
    els.carrollWithWithZone,
    els.carrollWithoutWithZone,
    els.carrollWithWithoutZone,
    els.carrollWithoutWithoutZone,
    els.vennAZone,
    els.vennBZone,
    els.vennCZone,
    els.vennABZone,
    els.vennACZone,
    els.vennBCZone,
    els.vennABCZone,
    els.vennOutsideZone,
    els.implicitAZone,
    els.implicitBZone,
    els.implicitABZone,
    els.implicitOutsideZone
  ].filter(Boolean);
}

function createSmileyNode(smiley) {
  const node = els.smileyTemplate.content.firstElementChild.cloneNode(true);
  node.dataset.id = smiley.id;
  node.setAttribute("aria-label", describeSmiley(smiley));
  node.classList.toggle("square", smiley.shape === "square");
  node.classList.toggle("red", smiley.color === "red");
  node.classList.toggle("neutral", smiley.expression === "neutral");
  node.classList.toggle("has-hat", smiley.hat);
  node.classList.toggle("has-ears", smiley.ears);
  node.addEventListener("pointerdown", event => beginDrag(event, node));
  return node;
}

function describeSmiley(smiley) {
  const shape = smiley.shape === "round" ? "round" : "square";
  const color = smiley.color;
  const expression = smiley.expression === "smile" ? "smiling" : "neutral";
  const hat = smiley.hat ? "with hat" : "without hat";
  const ears = smiley.ears ? "with ears" : "without ears";
  return `${shape}, ${color}, ${expression}, ${hat}, ${ears}`;
}

function beginDrag(event, node) {
  event.preventDefault();
  if (isCelebrating()) return;
  if (state.dragging) {
    cancelDrag();
  }
  cleanupStrandedDragNodes();
  const previousRects = collectSmileyRects();
  const rect = node.getBoundingClientRect();
  node.setPointerCapture(event.pointerId);
  state.dragging = {
    id: node.dataset.id,
    node,
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    originalZone: state.smileys.find(item => item.id === node.dataset.id)?.zone,
    originalPlacementOrder: state.smileys.find(item => item.id === node.dataset.id)?.placementOrder,
    previewZone: null,
    previewIndex: null
  };
  node.style.width = `${rect.width}px`;
  node.style.height = `${rect.height}px`;
  node.classList.add("dragging");
  document.body.append(node);
  document.addEventListener("pointermove", moveDrag);
  document.addEventListener("pointerup", endDrag);
  document.addEventListener("pointercancel", cancelDrag);
  moveDrag(event);
  animateSmileysFrom(previousRects, node.dataset.id, "fast");
}

function moveDrag(event) {
  if (!state.dragging) return;
  event.preventDefault();
  const { node, offsetX, offsetY } = state.dragging;
  node.style.left = `${event.clientX - offsetX}px`;
  node.style.top = `${event.clientY - offsetY}px`;
  markDropTarget(event.clientX, event.clientY);
  previewOrderingDrag(event.clientX, event.clientY);
}

function endDrag(event) {
  if (!state.dragging) return;
  event.preventDefault();
  const previousRects = collectSmileyRects();
  const dropZone = getDropTarget(event.clientX, event.clientY);
  const smiley = state.smileys.find(item => item.id === state.dragging.id);
  if (dropZone && smiley && shouldRejectImplicitDrop(smiley, dropZone.dataset.zone)) {
    const returnRects = new Map([[smiley.id, state.dragging.node.getBoundingClientRect()]]);
    restoreDraggedSmiley(smiley);
    cleanupDrag();
    renderSmileys();
    animateSmileysFrom(returnRects, null, "fast");
    markRejectedSmiley(smiley.id);
    return;
  }
  if (dropZone && smiley) {
    moveSmileyToZone(smiley, dropZone.dataset.zone, event.clientX, event.clientY);
  } else if (smiley) {
    restoreDraggedSmiley(smiley);
  }
  cleanupDrag();
  renderSmileys();
  animateSmileysFrom(previousRects, null, "fast");
}

function shouldRejectImplicitDrop(smiley, zone) {
  if (state.phase !== "implicit") return false;
  if (zone === "tray") return false;
  return zone !== getImplicitZoneForSmiley(smiley, state.activeImplicitCriteria);
}

function markRejectedSmiley(id) {
  state.mistakeStreak += 1;
  if (navigator.vibrate) {
    navigator.vibrate(80);
  }
  window.setTimeout(() => {
    const node = document.querySelector(`[data-id="${id}"]`);
    if (!node) return;
    node.classList.remove("tilt-reject");
    window.requestAnimationFrame(() => node.classList.add("tilt-reject"));
    node.addEventListener("animationend", () => node.classList.remove("tilt-reject"), { once: true });
  }, 190);
}

function moveSmileyToZone(smiley, zone, x = null, y = null) {
  if (zone === "order") {
    moveSmileyToOrder(smiley, x, y);
    return;
  }
  if (smiley.zone === zone && zone !== "order") return;
  smiley.zone = zone;
  smiley.placementOrder = zone === "tray" ? smiley.originalOrder : state.nextPlacementOrder;
  normalizeOrderedSmileys();
  state.nextPlacementOrder += 1;
}

function moveSmileyToOrder(smiley, x, y) {
  const orderedSmileys = state.smileys
    .filter(item => item.id !== smiley.id && item.zone === "order")
    .sort((first, second) => first.placementOrder - second.placementOrder);
  const insertIndex = getOrderInsertIndex(x, y);
  smiley.zone = "order";
  orderedSmileys.splice(insertIndex, 0, smiley);
  orderedSmileys.forEach((item, index) => {
    item.placementOrder = index;
  });
  state.nextPlacementOrder = orderedSmileys.length;
}

function previewOrderingDrag(x, y) {
  if (state.phase !== "ordering" || !state.dragging) return;
  if (!isPointInsideElement(els.orderingZone, x, y)) return;
  const smiley = state.smileys.find(item => item.id === state.dragging.id);
  if (!smiley) return;
  const insertIndex = getOrderInsertIndex(x, y);
  if (state.dragging.previewZone === "order" && state.dragging.previewIndex === insertIndex) return;

  const previousRects = collectSmileyRects();
  moveSmileyToOrder(smiley, x, y);
  state.dragging.previewZone = "order";
  state.dragging.previewIndex = insertIndex;
  renderSmileys(state.dragging.id);
  animateSmileysFrom(previousRects, state.dragging.id, "fast");
}

function isPointInsideElement(element, x, y) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function restoreDraggedSmiley(smiley) {
  if (!state.dragging) return;
  smiley.zone = state.dragging.originalZone || "tray";
  smiley.placementOrder = state.dragging.originalPlacementOrder ?? smiley.originalOrder;
  normalizeOrderedSmileys();
}

function normalizeOrderedSmileys() {
  state.smileys
    .filter(smiley => smiley.zone === "order")
    .sort((first, second) => first.placementOrder - second.placementOrder)
    .forEach((smiley, index) => {
      smiley.placementOrder = index;
    });
}

function getOrderInsertIndex(x, y) {
  const nodes = [...els.orderingZone.querySelectorAll(".smiley")]
    .filter(node => !state.dragging || node.dataset.id !== state.dragging.id)
    .sort((first, second) => {
      const firstRect = first.getBoundingClientRect();
      const secondRect = second.getBoundingClientRect();
      if (Math.abs(firstRect.top - secondRect.top) > 8) {
        return firstRect.top - secondRect.top;
      }
      return firstRect.left - secondRect.left;
    });

  if (nodes.length === 0) {
    return 0;
  }

  const zoneRect = els.orderingZone.getBoundingClientRect();
  if (y < zoneRect.top) {
    return 0;
  }

  for (let index = 0; index < nodes.length; index += 1) {
    const rect = nodes[index].getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return getHoveredOrderInsertIndex(nodes[index], index);
    }
  }

  for (let index = 0; index < nodes.length; index += 1) {
    const rect = nodes[index].getBoundingClientRect();
    const rowCenter = rect.top + rect.height / 2;
    const itemCenter = rect.left + rect.width / 2;
    if (y < rect.top) {
      return index;
    }
    if (Math.abs(y - rowCenter) <= rect.height / 2 && x < itemCenter) {
      return index;
    }
  }

  return nodes.length;
}

function getHoveredOrderInsertIndex(node, index) {
  if (!state.dragging) return index;
  const hoveredSmiley = state.smileys.find(smiley => smiley.id === node.dataset.id);
  if (!hoveredSmiley) return index;
  const originalOrder = state.dragging.originalPlacementOrder ?? 0;
  if (state.dragging.originalZone === "order" && originalOrder < hoveredSmiley.placementOrder) {
    return index + 1;
  }
  return index;
}

function cancelDrag() {
  const smiley = state.dragging ? state.smileys.find(item => item.id === state.dragging.id) : null;
  if (smiley) {
    restoreDraggedSmiley(smiley);
  }
  cleanupDrag();
  renderSmileys();
}

function cleanupDrag() {
  if (!state.dragging) return;
  const { node, pointerId } = state.dragging;
  if (node.hasPointerCapture(pointerId)) {
    node.releasePointerCapture(pointerId);
  }
  document.removeEventListener("pointermove", moveDrag);
  document.removeEventListener("pointerup", endDrag);
  document.removeEventListener("pointercancel", cancelDrag);
  node.classList.remove("dragging");
  node.removeAttribute("style");
  node.remove();
  state.dragging = null;
  clearDropMarks();
}

function markDropTarget(x, y) {
  clearDropMarks();
  const target = getDropTarget(x, y);
  if (target) {
    target.classList.add("is-over");
  }
}

function clearDropMarks() {
  getAllDropContainers().forEach(zone => zone.classList.remove("is-over"));
}

function getDropTarget(x, y) {
  if (state.phase === "ordering") {
    if (isPointInsideElement(els.orderingZone, x, y)) return els.orderingZone;
    if (isPointInsideElement(els.tray, x, y)) return els.tray;
  }
  if (state.phase === "carroll") {
    const carrollTarget = getAllDropContainers()
      .filter(zone => zone.classList.contains("carroll-zone") || zone.classList.contains("smiley-tray"))
      .find(zone => isPointInsideElement(zone, x, y));
    if (carrollTarget) return carrollTarget;
  }
  if (state.phase === "venn") {
    const vennTarget = getAllDropContainers()
      .filter(zone => zone.classList.contains("venn-zone") || zone.classList.contains("smiley-tray"))
      .find(zone => isPointInsideElement(zone, x, y));
    if (vennTarget) return vennTarget;
  }
  if (state.phase === "implicit") {
    const implicitTarget = getAllDropContainers()
      .filter(zone => zone.classList.contains("implicit-zone") || zone.classList.contains("smiley-tray"))
      .find(zone => isPointInsideElement(zone, x, y));
    if (implicitTarget) return implicitTarget;
  }
  const element = document.elementFromPoint(x, y);
  if (!element) return null;
  if (state.phase === "ordering") {
    return element.closest(".ordering-zone, .smiley-tray");
  }
  if (state.phase === "carroll") {
    return element.closest(".carroll-zone, .smiley-tray");
  }
  if (state.phase === "venn") {
    return element.closest(".venn-zone, .smiley-tray");
  }
  if (state.phase === "implicit") {
    return element.closest(".implicit-zone, .smiley-tray");
  }
  return element.closest(".drop-zone");
}

function validateCurrentPhase() {
  if (isCelebrating()) return;
  if (state.phase === "ordering") {
    validateOrdering();
    return;
  }
  if (state.phase === "carroll") {
    validateCarroll();
    return;
  }
  if (state.phase === "venn") {
    validateVenn();
    return;
  }
  if (state.phase === "implicit") {
    validateImplicit();
    return;
  }
  validateSort();
}

function isCelebrating() {
  return state.phase === "celebrating";
}

function validateSort() {
  const allSorted = state.smileys.every(smiley => smiley.zone !== "tray");
  if (!allSorted) {
    state.mistakeStreak += 1;
    signalIncorrect();
    if (state.mistakeStreak >= 2) {
      setTimeout(returnSmileysToTraySlowly, 560);
    }
    return;
  }

  const feature = currentFeature();
  const isCorrect = state.smileys.every(smiley => {
    const shouldBeWith = feature.get(smiley);
    return smiley.zone === (shouldBeWith ? "with" : "without");
  });

  if (isCorrect) {
    state.mistakeStreak = 0;
    els.submitSortButton.classList.add("hidden");
    if (state.useNumbers) {
      startCountChallenge(buildFeatureCountItems(), () => advanceQuestionFromCount());
    } else {
      advanceQuestion();
    }
    return;
  }

  state.mistakeStreak += 1;
  signalIncorrect();
  if (state.mistakeStreak >= 2) {
    setTimeout(returnSmileysToTraySlowly, 560);
  }
}

function signalIncorrect() {
  if (navigator.vibrate) {
    navigator.vibrate([80, 40, 80]);
  }
  const target = state.phase === "ordering"
    ? els.orderingPanel
    : state.phase === "carroll"
      ? els.carrollPanel
      : state.phase === "venn"
        ? els.vennPanel
        : state.phase === "implicit"
          ? els.implicitPanel
      : els.sortTable;
  target.classList.remove("shake");
  window.requestAnimationFrame(() => target.classList.add("shake"));
}

function returnSmileysToTraySlowly() {
  const previousRects = collectSmileyRects();

  state.smileys.forEach(smiley => {
    smiley.zone = "tray";
    smiley.placementOrder = smiley.originalOrder;
  });
  state.mistakeStreak = 0;
  renderSmileys();
  animateSmileysFrom(previousRects);
}

function animateSmileysFrom(previousRects, excludedId = null, speed = "normal") {
  previousRects.forEach((oldRect, id) => {
    if (id === excludedId) return;
    const node = document.querySelector(`[data-id="${id}"]`);
    if (!node) return;
    const newRect = node.getBoundingClientRect();
    const deltaX = oldRect.left - newRect.left;
    const deltaY = oldRect.top - newRect.top;
    node.classList.add("is-traveling");
    node.style.transition = "none";
    node.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    node.getBoundingClientRect();
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      node.style.transition = "";
      node.classList.add(speed === "fast" ? "returning-fast" : "returning");
      node.style.transform = "";
    }));
    node.addEventListener("transitionend", () => {
      node.classList.remove("returning");
      node.classList.remove("returning-fast");
      node.classList.remove("is-traveling");
      node.style.transition = "";
    }, { once: true });
  });
}

function collectSmileyRects() {
  const previousRects = new Map();
  state.smileys.forEach(smiley => {
    const node = document.querySelector(`[data-id="${smiley.id}"]`);
    if (node) {
      previousRects.set(smiley.id, node.getBoundingClientRect());
    }
  });
  return previousRects;
}

function checkCounts() {
  if (!state.countChallenge) return;
  const inputs = [...els.countScheme.querySelectorAll("input")];
  const emptyInput = inputs.find(input => input.value.trim() === "");
  if (emptyInput) {
    emptyInput.focus();
    return;
  }

  const isCorrect = state.countChallenge.items.every((item, index) =>
    Number.parseInt(inputs[index].value, 10) === item.expected
  );
  if (isCorrect) {
    const onCorrect = state.countChallenge.onCorrect;
    state.countChallenge = null;
    onCorrect();
    return;
  }

  state.mistakeStreak += 1;
  signalIncorrect();
  if (state.mistakeStreak >= 2) {
    inputs.forEach(input => {
      input.value = "";
    });
    state.mistakeStreak = 0;
  }
}

function advanceQuestionFromCount() {
  els.answerPanel.classList.add("collapsing");
  window.setTimeout(() => {
    els.answerPanel.classList.add("hidden");
    els.answerPanel.classList.remove("collapsing");
    advanceQuestion();
  }, 1300);
}

function startCountChallenge(items, onCorrect) {
  state.countChallenge = { items, onCorrect };
  els.countScheme.replaceChildren(...items.map((item, index) => createCountBox(item, index)));
  els.answerPanel.classList.remove("hidden");
  els.answerPanel.classList.remove("collapsing");
  els.submitSortButton.classList.add("hidden");
  const firstInput = els.countScheme.querySelector("input");
  if (firstInput) {
    firstInput.focus();
  }
}

function createCountBox(item, index) {
  const label = document.createElement("label");
  label.className = `ppw-box ${item.whole ? "whole-box" : "part-box"}`;
  const labelContent = document.createElement("span");
  labelContent.className = "count-label";
  if (typeof item.label === "string") {
    labelContent.textContent = item.label;
  } else {
    labelContent.append(item.label);
  }
  const input = document.createElement("input");
  input.inputMode = "numeric";
  input.pattern = "[0-9]*";
  input.autocomplete = "off";
  input.dataset.countIndex = String(index);
  label.append(labelContent, input);
  return label;
}

function buildFeatureCountItems() {
  const feature = currentFeature();
  const expectedWith = state.smileys.filter(feature.get).length;
  const expectedWithout = state.smileys.length - expectedWith;
  return [
    { label: "Whole", expected: state.smileys.length, whole: true },
    { label: createFeatureIcon(feature), expected: expectedWith },
    { label: createFeatureIcon(feature, true), expected: expectedWithout }
  ];
}

function buildMissionCountItems() {
  if (state.mission === "ordering") {
    return [
      { label: "Ordered", expected: state.smileys.length, whole: true }
    ];
  }
  if (state.mission === "carroll") {
    const [columnFeature, rowFeature] = state.activeCarrollCriteria;
    return [
      { label: "Whole", expected: state.smileys.length, whole: true },
      { label: createCountIconGroup([createFeatureIcon(columnFeature), createFeatureIcon(rowFeature)]), expected: countSmileysInZone("carroll-with-with") },
      { label: createCountIconGroup([createFeatureIcon(columnFeature, true), createFeatureIcon(rowFeature)]), expected: countSmileysInZone("carroll-without-with") },
      { label: createCountIconGroup([createFeatureIcon(columnFeature), createFeatureIcon(rowFeature, true)]), expected: countSmileysInZone("carroll-with-without") },
      { label: createCountIconGroup([createFeatureIcon(columnFeature, true), createFeatureIcon(rowFeature, true)]), expected: countSmileysInZone("carroll-without-without") }
    ];
  }
  if (state.mission === "venn") {
    return [
      { label: "Whole", expected: state.smileys.length, whole: true },
      ...getVennZoneKeys().map(zone => ({
        label: createVennCountLabel(zone),
        expected: countSmileysInZone(zone)
      }))
    ];
  }
  if (state.mission === "implicit") {
    return [
      { label: "Whole", expected: state.smileys.length, whole: true },
      { label: "Left", expected: countSmileysInZone("implicit-a") },
      { label: "Middle", expected: countSmileysInZone("implicit-ab") },
      { label: "Right", expected: countSmileysInZone("implicit-b") },
      { label: "Outside", expected: countSmileysInZone("implicit-outside") }
    ];
  }
  return [{ label: "Whole", expected: state.smileys.length, whole: true }];
}

function createCountIconGroup(icons) {
  const group = document.createElement("span");
  group.className = "count-icon-group";
  group.append(...icons);
  return group;
}

function createVennCountLabel(zone) {
  if (zone === "venn-outside") return "Outside";
  const letters = zone.replace("venn-", "");
  const icons = [...letters].map(letter => {
    const index = letter.charCodeAt(0) - 97;
    return createFeatureIcon(state.activeVennCriteria[index]);
  });
  return createCountIconGroup(icons);
}

function countSmileysInZone(zone) {
  return state.smileys.filter(smiley => smiley.zone === zone).length;
}

function completeMissionAfterCorrectSort(previousRects = collectSmileyRects()) {
  if (state.useNumbers) {
    startCountChallenge(buildMissionCountItems(), () => finishSet(previousRects));
    return;
  }
  finishSet(previousRects);
}

function advanceQuestion() {
  const previousRects = collectSmileyRects();
  state.featureIndex += 1;
  if (state.featureIndex < state.activeFeatures.length) {
    startFeature(previousRects);
    return;
  }

  finishSet(previousRects);
}

function startOrderingPhase(previousRects = null) {
  state.phase = "ordering";
  state.activeOrderingCriteria = chooseOrderingCriteria();
  state.mistakeStreak = 0;
  state.orderingHadMistake = false;
  state.nextPlacementOrder = 1;
  state.smileys.forEach(smiley => {
    smiley.zone = "tray";
    smiley.placementOrder = smiley.originalOrder;
  });
  els.sortTable.classList.add("hidden");
  els.answerPanel.classList.add("hidden");
  els.orderingPanel.classList.remove("hidden");
  els.carrollPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  els.trayLabel.textContent = "Smileys to order";
  els.criteriaList.replaceChildren(createOrderingCriteriaChain(state.activeOrderingCriteria));
  els.criteriaList.setAttribute("aria-label", `Ordering criteria: ${state.activeOrderingCriteria.map(criterion => criterion.label).join(", then ")}`);
  els.progressText.textContent = "Ordering";
  els.submitSortButton.textContent = "OK";
  els.submitSortButton.classList.remove("hidden");
  renderSmileys();
  if (previousRects) {
    animateSmileysFrom(previousRects);
  }
}

function startCarrollPhase(previousRects = null) {
  state.phase = "carroll";
  state.mistakeStreak = 0;
  state.nextPlacementOrder = 1;
  state.smileys.forEach(smiley => {
    smiley.zone = "tray";
    smiley.placementOrder = smiley.originalOrder;
  });
  els.sortTable.classList.add("hidden");
  els.orderingPanel.classList.add("hidden");
  els.answerPanel.classList.add("hidden");
  els.carrollPanel.classList.remove("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  els.trayLabel.textContent = "Smileys to sort";
  renderCarrollAxes();
  els.progressText.textContent = "Two feature sort";
  els.submitSortButton.textContent = "OK";
  els.submitSortButton.classList.remove("hidden");
  renderSmileys();
  if (previousRects) {
    animateSmileysFrom(previousRects);
  }
}

function startVennPhase(previousRects = null) {
  state.phase = "venn";
  state.mistakeStreak = 0;
  state.nextPlacementOrder = 1;
  state.smileys.forEach(smiley => {
    smiley.zone = "tray";
    smiley.placementOrder = smiley.originalOrder;
  });
  els.sortTable.classList.add("hidden");
  els.orderingPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.answerPanel.classList.add("hidden");
  els.vennPanel.classList.remove("hidden");
  els.implicitPanel.classList.add("hidden");
  els.trayLabel.textContent = "Smileys to sort";
  renderVennHeadlines();
  els.progressText.textContent = "Three circle sort";
  els.submitSortButton.textContent = "OK";
  els.submitSortButton.classList.remove("hidden");
  renderSmileys();
  if (previousRects) {
    animateSmileysFrom(previousRects);
  }
}

function startImplicitPhase(previousRects = null) {
  state.phase = "implicit";
  state.mistakeStreak = 0;
  state.nextPlacementOrder = 1;
  state.smileys.forEach(smiley => {
    smiley.zone = "tray";
    smiley.placementOrder = smiley.originalOrder;
  });
  els.sortTable.classList.add("hidden");
  els.orderingPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.answerPanel.classList.add("hidden");
  els.implicitPanel.classList.remove("hidden");
  els.trayLabel.textContent = "Smileys to sort";
  els.progressText.textContent = "Find the rule";
  els.submitSortButton.textContent = "OK";
  els.submitSortButton.classList.remove("hidden");
  renderSmileys();
  if (previousRects) {
    animateSmileysFrom(previousRects);
  }
}

function renderCarrollAxes() {
  const [columnFeature, rowFeature] = state.activeCarrollCriteria;
  els.carrollTopWith.replaceChildren(createFeatureIcon(columnFeature));
  els.carrollTopWithout.replaceChildren(createFeatureIcon(columnFeature, true));
  els.carrollSideWith.replaceChildren(createFeatureIcon(rowFeature));
  els.carrollSideWithout.replaceChildren(createFeatureIcon(rowFeature, true));
  els.carrollTopWith.setAttribute("aria-label", `With ${columnFeature.label}`);
  els.carrollTopWithout.setAttribute("aria-label", `Without ${columnFeature.label}`);
  els.carrollSideWith.setAttribute("aria-label", `With ${rowFeature.label}`);
  els.carrollSideWithout.setAttribute("aria-label", `Without ${rowFeature.label}`);
}

function renderVennHeadlines() {
  [els.vennAHead, els.vennBHead, els.vennCHead].forEach((head, index) => {
    const feature = state.activeVennCriteria[index];
    head.replaceChildren(createFeatureIcon(feature));
    head.setAttribute("aria-label", feature.label);
  });
}

function chooseOrderingCriteria() {
  const shuffledCriteria = shuffle([...orderingCriteria]);
  const criterionCount = getOrderingCriterionCount();
  return shuffledCriteria.slice(0, criterionCount);
}

function getOrderingCriterionCount() {
  return state.orderingLevel >= 2 ? 3 : 2;
}

function getOrderingSmileyCount() {
  return state.orderingLevel >= 2 ? 7 : 5;
}

function createOrderingCriteriaChain(criteria) {
  const chain = document.createElement("div");
  chain.className = "criterion-chain";

  criteria.forEach((criterion, index) => {
    const feature = features.find(item => item.key === criterion.key);
    const item = document.createElement("span");
    item.className = "criterion-icon";
    item.setAttribute("aria-hidden", "true");
    if (feature) {
      item.append(createFeatureIcon(feature));
    }
    chain.append(item);

    if (index < criteria.length - 1) {
      const arrow = document.createElement("span");
      arrow.className = "criteria-arrow";
      arrow.setAttribute("aria-hidden", "true");
      chain.append(arrow);
    }
  });

  return chain;
}

function validateOrdering() {
  const orderedSmileys = state.smileys
    .filter(smiley => smiley.zone === "order")
    .sort((first, second) => first.placementOrder - second.placementOrder);

  if (orderedSmileys.length !== state.smileys.length) {
    state.orderingHadMistake = true;
    state.mistakeStreak += 1;
    signalIncorrect();
    if (state.mistakeStreak >= 2) {
      setTimeout(returnSmileysToTraySlowly, 560);
    }
    return;
  }

  const isCorrect = orderedSmileys.every((smiley, index) => {
    if (index === 0) return true;
    return compareByOrderingCriteria(orderedSmileys[index - 1], smiley) <= 0;
  });

  if (isCorrect) {
    if (!state.orderingHadMistake && state.orderingLevel === 1) {
      state.orderingLevel = 2;
    }
    state.mistakeStreak = 0;
    completeMissionAfterCorrectSort();
    return;
  }

  state.orderingHadMistake = true;
  state.mistakeStreak += 1;
  signalIncorrect();
  if (state.mistakeStreak >= 2) {
    setTimeout(returnSmileysToTraySlowly, 560);
  }
}

function validateCarroll() {
  const allSorted = state.smileys.every(smiley => smiley.zone !== "tray");
  if (!allSorted) {
    state.mistakeStreak += 1;
    signalIncorrect();
    if (state.mistakeStreak >= 2) {
      setTimeout(returnSmileysToTraySlowly, 560);
    }
    return;
  }

  const isCorrect = state.smileys.every(smiley =>
    smiley.zone === getCarrollZoneForSmiley(smiley, state.activeCarrollCriteria)
  );

  if (isCorrect) {
    state.mistakeStreak = 0;
    completeMissionAfterCorrectSort();
    return;
  }

  state.mistakeStreak += 1;
  signalIncorrect();
  if (state.mistakeStreak >= 2) {
    setTimeout(returnSmileysToTraySlowly, 560);
  }
}

function validateVenn() {
  const allSorted = state.smileys.every(smiley => smiley.zone !== "tray");
  if (!allSorted) {
    state.mistakeStreak += 1;
    signalIncorrect();
    if (state.mistakeStreak >= 2) {
      setTimeout(returnSmileysToTraySlowly, 560);
    }
    return;
  }

  const isCorrect = state.smileys.every(smiley =>
    smiley.zone === getVennZoneForSmiley(smiley, state.activeVennCriteria)
  );

  if (isCorrect) {
    state.mistakeStreak = 0;
    completeMissionAfterCorrectSort();
    return;
  }

  state.mistakeStreak += 1;
  signalIncorrect();
  if (state.mistakeStreak >= 2) {
    setTimeout(returnSmileysToTraySlowly, 560);
  }
}

function validateImplicit() {
  const allSorted = state.smileys.every(smiley => smiley.zone !== "tray");
  if (!allSorted) {
    state.mistakeStreak += 1;
    signalIncorrect();
    return;
  }

  const isCorrect = state.smileys.every(smiley =>
    smiley.zone === getImplicitZoneForSmiley(smiley, state.activeImplicitCriteria)
  );

  if (isCorrect) {
    state.mistakeStreak = 0;
    completeMissionAfterCorrectSort();
    return;
  }

  state.mistakeStreak += 1;
  signalIncorrect();
}

function getCarrollZoneForSmiley(smiley, criteria) {
  const [columnFeature, rowFeature] = criteria;
  const column = columnFeature.get(smiley) ? "with" : "without";
  const row = rowFeature.get(smiley) ? "with" : "without";
  return `carroll-${column}-${row}`;
}

function getVennZoneForSmiley(smiley, criteria) {
  const key = criteria.map((criterion, index) => criterion.get(smiley) ? String.fromCharCode(97 + index) : "").join("");
  return key ? `venn-${key}` : "venn-outside";
}

function getImplicitZoneForSmiley(smiley, criteria) {
  const [firstFeature, secondFeature] = criteria;
  const inFirst = firstFeature.get(smiley);
  const inSecond = secondFeature.get(smiley);
  if (inFirst && inSecond) return "implicit-ab";
  if (inFirst) return "implicit-a";
  if (inSecond) return "implicit-b";
  return "implicit-outside";
}

function compareByOrderingCriteria(first, second) {
  for (const criterion of state.activeOrderingCriteria) {
    const firstHasFeature = criterion.get(first);
    const secondHasFeature = criterion.get(second);
    if (firstHasFeature !== secondHasFeature) {
      return firstHasFeature ? -1 : 1;
    }
  }
  return 0;
}

function finishSet(previousRects) {
  clearCycleTimers();
  const completedMission = state.mission;
  state.phase = "celebrating";
  els.workPanel.classList.add("is-celebrating");
  if (completedMission === "ordering") {
    els.orderingPanel.classList.remove("hidden");
    els.carrollPanel.classList.add("hidden");
    els.vennPanel.classList.add("hidden");
    els.implicitPanel.classList.add("hidden");
    els.sortTable.classList.add("hidden");
  } else {
    state.activeOrderingCriteria = [];
    els.orderingPanel.classList.add("hidden");
    els.sortTable.classList.remove("hidden");
  }
  if (completedMission !== "carroll") {
    els.carrollPanel.classList.add("hidden");
  } else {
    state.activeCarrollCriteria = [];
    els.carrollPanel.classList.add("hidden");
    els.sortTable.classList.remove("hidden");
  }
  if (completedMission !== "venn") {
    els.vennPanel.classList.add("hidden");
  } else {
    state.activeVennCriteria = [];
    els.vennPanel.classList.add("hidden");
    els.sortTable.classList.remove("hidden");
  }
  if (completedMission !== "implicit") {
    els.implicitPanel.classList.add("hidden");
  } else {
    state.activeImplicitCriteria = [];
    els.implicitPanel.classList.add("hidden");
    els.sortTable.classList.remove("hidden");
  }
  els.submitSortButton.textContent = "OK";
  state.smileys.forEach(smiley => {
    smiley.zone = "tray";
    smiley.placementOrder = smiley.originalOrder;
  });
  renderSmileys();
  animateSmileysFrom(previousRects);
  celebrateCycle();
  const nextCount = randomCountDifferentFrom(state.requestedCount);
  scheduleCycleTimer(() => {
    els.workPanel.classList.add("cycle-fading-out");
  }, 4800);
  scheduleCycleTimer(() => {
    if (completedMission === "ordering") {
      startOrderingMission(false, false);
    } else if (completedMission === "carroll") {
      startCarrollMission(false);
    } else if (completedMission === "venn") {
      startVennMission(false);
    } else if (completedMission === "implicit") {
      startImplicitMission(false);
    } else {
      startSet(nextCount, false);
    }
    els.workPanel.classList.remove("is-celebrating");
    els.workPanel.classList.add("cycle-fading-in");
  }, 10400);
  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("cycle-fading-in");
  }, 15600);
}

function scheduleCycleTimer(callback, delay) {
  const timer = window.setTimeout(() => {
    state.cycleTimers = state.cycleTimers.filter(item => item !== timer);
    callback();
  }, delay);
  state.cycleTimers.push(timer);
}

function clearCycleTimers() {
  state.cycleTimers.forEach(timer => window.clearTimeout(timer));
  state.cycleTimers = [];
  if (els.workPanel) {
    els.workPanel.classList.remove("cycle-fading-out");
    els.workPanel.classList.remove("cycle-fading-in");
    els.workPanel.classList.remove("is-celebrating");
  }
}

function celebrateCycle() {
  els.celebration.classList.remove("hidden");
  window.setTimeout(() => {
    els.celebration.classList.add("hidden");
  }, 15600);
}


function randomCountDifferentFrom(previousCount) {
  let count = previousCount;
  while (count === previousCount) {
    count = Math.floor(Math.random() * 9) + 2;
  }
  return count;
}

function currentFeature() {
  return state.activeFeatures[state.featureIndex];
}

function getZoneElement(zone) {
  if (zone === "order") return els.orderingZone;
  if (zone === "with") return els.withZone;
  if (zone === "without") return els.withoutZone;
  if (zone === "carroll-with-with") return els.carrollWithWithZone;
  if (zone === "carroll-without-with") return els.carrollWithoutWithZone;
  if (zone === "carroll-with-without") return els.carrollWithWithoutZone;
  if (zone === "carroll-without-without") return els.carrollWithoutWithoutZone;
  if (zone === "venn-a") return els.vennAZone;
  if (zone === "venn-b") return els.vennBZone;
  if (zone === "venn-c") return els.vennCZone;
  if (zone === "venn-ab") return els.vennABZone;
  if (zone === "venn-ac") return els.vennACZone;
  if (zone === "venn-bc") return els.vennBCZone;
  if (zone === "venn-abc") return els.vennABCZone;
  if (zone === "venn-outside") return els.vennOutsideZone;
  if (zone === "implicit-a") return els.implicitAZone;
  if (zone === "implicit-b") return els.implicitBZone;
  if (zone === "implicit-ab") return els.implicitABZone;
  if (zone === "implicit-outside") return els.implicitOutsideZone;
  return els.tray;
}

init();
