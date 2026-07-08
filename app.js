import {
  CYCLE_CELEBRATION_MS,
  CYCLE_ENTER_MS,
  CYCLE_EXIT_MS,
  GAME_TITLE,
  SELECTION_RULE_PROGRESSION,
  SHOW_NUMBER_TOGGLE
} from "./src/core/constants.js";
import { features, orderingCriteria } from "./src/core/features.js";
import {
  featureCountForSmileyCount,
  makeAllSmileyCombinations,
  makePlayableSmileys,
  makeSmileys
} from "./src/core/smileys.js";
import { shuffle, triadKey } from "./src/core/utils.js";

const state = {
  smileys: [],
  activeFeatures: [],
  mission: "feature",
  phase: "setup",
  featureIndex: 0,
  activeOrderingCriteria: [],
  orderingLevel: 1,
  orderingHadMistake: false,
  orderingCleanWins: 0,
  vennLevel: 1,
  vennHadMistake: false,
  vennCleanWins: 0,
  activeCarrollCriteria: [],
  activeVennCriteria: [],
  activeImplicitCriteria: [],
  implicitGuesses: [null, null],
  implicitChoiceIndex: null,
  compareSmileys: [],
  comparePlacements: {},
  compareVisualX: {},
  compareMode: "drag",
  simpleCompareSmileys: [],
  simpleCompareMarks: {},
  permutationLevel: 1,
  permutationCleanWins: 0,
  permutationHadMistake: false,
  permutationAlbum: [],
  selectionLevel: 1,
  selectionHadMistake: false,
  selectionCleanWins: 0,
  selectionSourceZone: null,
  selectionSourceRule: null,
  creatorLevel: 1,
  creatorHadMistake: false,
  creatorCleanWins: 0,
  creatorCriteria: [],
  creatorCurrent: null,
  createdSmileys: [],
  requestedCount: 0,
  useNumbers: false,
  countChallenge: null,
  setCycle: 0,
  reuseGoal: 3,
  nextPlacementOrder: 1,
  mistakeStreak: 0,
  returnAfterErrorPending: false,
  returnAfterErrorTimer: null,
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
  compareMissionButton: document.querySelector("#compareMissionButton"),
  simpleCompareMissionButton: document.querySelector("#simpleCompareMissionButton"),
  permutationMissionButton: document.querySelector("#permutationMissionButton"),
  selectionMissionButton: document.querySelector("#selectionMissionButton"),
  creatorMissionButton: document.querySelector("#creatorMissionButton"),
  vennMissionButton: document.querySelector("#vennMissionButton"),
  implicitMissionButton: document.querySelector("#implicitMissionButton"),
  withNumbersButton: document.querySelector("#withNumbersButton"),
  withoutNumbersButton: document.querySelector("#withoutNumbersButton"),
  workPanel: document.querySelector("#workPanel"),
  screenTitle: document.querySelector("#screenTitle"),
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
  comparePanel: document.querySelector("#comparePanel"),
  compareFaces: document.querySelector("#compareFaces"),
  compareCriteriaBank: document.querySelector("#compareCriteriaBank"),
  compareEqualZone: document.querySelector("#compareEqualZone"),
  compareDifferentZone: document.querySelector("#compareDifferentZone"),
  compareDragView: document.querySelector("#compareDragView"),
  compareTable: document.querySelector("#compareTable"),
  simpleComparePanel: document.querySelector("#simpleComparePanel"),
  simpleCompareFaces: document.querySelector("#simpleCompareFaces"),
  simpleCompareTable: document.querySelector("#simpleCompareTable"),
  permutationPanel: document.querySelector("#permutationPanel"),
  permutationOrderZone: document.querySelector("#permutationOrderZone"),
  albumPages: document.querySelector("#albumPages"),
  cameraButton: document.querySelector("#cameraButton"),
  selectionPanel: document.querySelector("#selectionPanel"),
  selectionStage: document.querySelector("#selectionStage"),
  selectionCaption: document.querySelector("#selectionCaption"),
  selectionTargetZone: document.querySelector("#selectionTargetZone"),
  creatorPanel: document.querySelector("#creatorPanel"),
  creatorFinishButton: document.querySelector("#creatorFinishButton"),
  creatorCriteriaBank: document.querySelector("#creatorCriteriaBank"),
  creatorSmileyTarget: document.querySelector("#creatorSmileyTarget"),
  creatorResetButton: document.querySelector("#creatorResetButton"),
  createdSmileys: document.querySelector("#createdSmileys"),
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
  implicitAHead: document.querySelector("#implicitAHead"),
  implicitBHead: document.querySelector("#implicitBHead"),
  implicitChoiceList: document.querySelector("#implicitChoiceList"),
  implicitStage: document.querySelector("#implicitStage"),
  implicitAZone: document.querySelector("#implicitAZone"),
  implicitBZone: document.querySelector("#implicitBZone"),
  implicitABZone: document.querySelector("#implicitABZone"),
  implicitOutsideZone: document.querySelector("#implicitOutsideZone"),
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
  els.compareMissionButton.addEventListener("click", () => startCompareMission());
  els.simpleCompareMissionButton.addEventListener("click", () => startSimpleCompareMission());
  els.permutationMissionButton.addEventListener("click", () => startPermutationMission());
  els.selectionMissionButton.addEventListener("click", () => startSelectionMission());
  els.creatorMissionButton.addEventListener("click", () => startCreatorMission());
  els.vennMissionButton.addEventListener("click", () => startVennMission());
  els.implicitMissionButton.addEventListener("click", () => startImplicitMission());
  els.cameraButton.addEventListener("click", () => capturePermutationPhoto());
  els.creatorFinishButton.addEventListener("click", () => validateCreatorFinish());
  els.creatorResetButton.addEventListener("click", () => resetCreatorCurrent());
  els.implicitAHead.addEventListener("click", () => openImplicitChoiceList(0));
  els.implicitBHead.addEventListener("click", () => openImplicitChoiceList(1));
  els.modePanel.classList.toggle("hidden", !SHOW_NUMBER_TOGGLE);
  els.withNumbersButton.addEventListener("click", () => chooseMode(true));
  els.withoutNumbersButton.addEventListener("click", () => chooseMode(false));
  chooseMode(state.useNumbers);
  if (els.newSetButton) {
    els.newSetButton.addEventListener("click", () => showSetup());
  }
  els.submitSortButton.addEventListener("click", () => validateCurrentPhase());
  document.addEventListener("keydown", event => {
    if (event.key !== "Enter" || els.workPanel.classList.contains("hidden")) return;
    if (isCelebrating()) return;
    event.preventDefault();
    validateCurrentPhase();
  });
}

function setHeader(title, progress = "") {
  els.screenTitle.textContent = title;
  els.progressText.textContent = progress;
  els.progressText.classList.toggle("hidden", !progress);
}

function setProgress(progress = "") {
  els.progressText.textContent = progress;
  els.progressText.classList.toggle("hidden", !progress);
}

function chooseFeatureMission() {
  startSet(6);
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
  state.setCycle = 0;
  state.reuseGoal = getReuseGoal("feature");
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeVennCriteria = [];
  state.activeImplicitCriteria = [];
  resetImplicitGuessState();
  resetCompareState();
  state.countChallenge = null;
  resetMistakeCounter();
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
  state.setCycle = 0;
  state.reuseGoal = getReuseGoal("ordering");
  state.activeFeatures = [];
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeVennCriteria = [];
  state.activeImplicitCriteria = [];
  resetCompareState();
  state.countChallenge = null;
  resetMistakeCounter();
  state.orderingHadMistake = false;
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  startOrderingPhase();
}

function startCarrollMission(clearPendingTimers = true, count = getDefaultSmileyCount()) {
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "carroll";
  state.requestedCount = count;
  state.phase = "carroll";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  const setup = makeCarrollSet(state.requestedCount);
  state.smileys = setup.smileys;
  state.setCycle = 0;
  state.reuseGoal = getReuseGoal("carroll");
  state.activeFeatures = [];
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = setup.criteria;
  state.activeVennCriteria = [];
  state.activeImplicitCriteria = [];
  resetCompareState();
  state.countChallenge = null;
  resetMistakeCounter();
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  startCarrollPhase();
}

function startCompareMission(clearPendingTimers = true) {
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "compare";
  state.requestedCount = 2;
  state.phase = "compare";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  const setup = makeCompareSet();
  state.smileys = [];
  state.compareSmileys = setup.smileys;
  state.comparePlacements = {};
  state.compareMode = "drag";
  state.activeFeatures = [];
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeVennCriteria = [];
  state.activeImplicitCriteria = [];
  state.countChallenge = null;
  resetMistakeCounter();
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  startComparePhase();
}

function startSimpleCompareMission(clearPendingTimers = true) {
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "simple-compare";
  state.requestedCount = 2;
  state.phase = "simple-compare";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  state.smileys = [];
  state.simpleCompareSmileys = makeCompareSet().smileys;
  state.simpleCompareMarks = {};
  state.activeFeatures = [];
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeVennCriteria = [];
  state.activeImplicitCriteria = [];
  resetCompareState();
  resetSelectionState();
  resetCreatorState();
  resetPermutationState();
  state.countChallenge = null;
  resetMistakeCounter();
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  startSimpleComparePhase();
}

function startPermutationMission(clearPendingTimers = true) {
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  const count = getPermutationSmileyCount();
  state.mission = "permutation";
  state.requestedCount = count;
  state.phase = "permutation";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  state.smileys = makeSmileys(count, featureCountForSmileyCount(count));
  state.smileys.forEach((smiley, index) => {
    smiley.zone = "permutation-order";
    smiley.originalOrder = index;
    smiley.placementOrder = index;
  });
  state.permutationAlbum = [];
  state.permutationHadMistake = false;
  state.activeFeatures = [];
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeVennCriteria = [];
  state.activeImplicitCriteria = [];
  resetCompareState();
  resetSelectionState();
  resetCreatorState();
  state.countChallenge = null;
  resetMistakeCounter();
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  startPermutationPhase();
}

function startSelectionMission(clearPendingTimers = true) {
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "selection";
  state.requestedCount = getDefaultSmileyCount();
  state.phase = "selection";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  const setup = makeVennSetForCount(getSelectionCriterionCount(), state.requestedCount);
  state.activeVennCriteria = setup.criteria;
  state.smileys = setup.smileys.map(smiley => {
    const zone = getVennZoneForSmiley(smiley, setup.criteria);
    return { ...smiley, zone, sourceZone: zone };
  });
  state.setCycle = 0;
  state.reuseGoal = getReuseGoal("selection");
  state.selectionSourceRule = chooseSelectionSourceRule();
  state.selectionSourceZone = state.selectionSourceRule.zone || null;
  state.selectionHadMistake = false;
  state.activeFeatures = [];
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeImplicitCriteria = [];
  resetCompareState();
  resetCreatorState();
  state.countChallenge = null;
  resetMistakeCounter();
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  startSelectionPhase();
}

function startCreatorMission(clearPendingTimers = true) {
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "creator";
  state.requestedCount = 0;
  state.phase = "creator";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  state.smileys = [];
  state.creatorCriteria = chooseCreatorCriteria();
  state.creatorCurrent = makeBaseCreatorSmiley();
  state.createdSmileys = [];
  state.creatorHadMistake = false;
  state.activeFeatures = [];
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeVennCriteria = [];
  state.activeImplicitCriteria = [];
  resetCompareState();
  resetSelectionState();
  state.countChallenge = null;
  resetMistakeCounter();
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  startCreatorPhase();
}

function startVennMission(clearPendingTimers = true, count = getDefaultSmileyCount()) {
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "venn";
  state.requestedCount = count;
  state.phase = "venn";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  const setup = makeVennSet(state.requestedCount);
  state.smileys = setup.smileys;
  state.setCycle = 0;
  state.reuseGoal = getReuseGoal("venn");
  state.activeFeatures = [];
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeVennCriteria = setup.criteria;
  state.activeImplicitCriteria = [];
  resetCompareState();
  state.countChallenge = null;
  resetMistakeCounter();
  state.vennHadMistake = false;
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  startVennPhase();
}

function startImplicitMission(clearPendingTimers = true, count = getDefaultSmileyCount()) {
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "implicit";
  state.requestedCount = count;
  state.phase = "implicit";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  const setup = makeImplicitSet(state.requestedCount);
  state.smileys = setup.smileys;
  state.setCycle = 0;
  state.reuseGoal = getReuseGoal("implicit");
  state.activeFeatures = [];
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeVennCriteria = [];
  state.activeImplicitCriteria = setup.criteria;
  resetImplicitGuessState();
  resetCompareState();
  state.countChallenge = null;
  state.setCycle = 0;
  state.reuseGoal = getReuseGoal("implicit");
  resetMistakeCounter();
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
  resetImplicitGuessState();
  resetCompareState();
  resetSimpleCompareState();
  resetSelectionState();
  resetCreatorState();
  resetPermutationState();
  state.countChallenge = null;
  state.mission = "feature";
  state.orderingLevel = 1;
  state.vennLevel = 1;
  state.selectionLevel = 1;
  state.creatorLevel = 1;
  state.permutationLevel = 1;
  state.orderingHadMistake = false;
  state.vennHadMistake = false;
  state.orderingCleanWins = 0;
  state.vennCleanWins = 0;
  state.selectionCleanWins = 0;
  state.creatorCleanWins = 0;
  state.permutationCleanWins = 0;
  state.phase = "setup";
  state.featureIndex = 0;
  els.workPanel.classList.add("hidden");
  els.setupPanel.classList.remove("hidden");
  els.backButton.classList.add("hidden");
  els.missionPanel.classList.remove("hidden");
  els.countPanel.classList.add("hidden");
  setHeader(GAME_TITLE);
}

function startFeature(previousRects = null) {
  const feature = currentFeature();
  state.phase = "sorting";
  resetMistakeCounter();
  state.smileys.forEach(smiley => {
    smiley.zone = "tray";
    smiley.placementOrder = smiley.originalOrder;
  });
  els.sortTable.classList.remove("hidden");
  els.orderingPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  els.trayLabel.textContent = "Smileys";
  if (els.featurePrompt) {
    els.featurePrompt.replaceChildren(createFeatureIcon(feature));
    els.featurePrompt.setAttribute("aria-label", `Sort by ${feature.label}`);
  }
  els.withHeader.replaceChildren(createFeatureIcon(feature));
  els.withHeader.setAttribute("aria-label", `With ${feature.label}`);
  els.withoutHeader.replaceChildren(createFeatureIcon(feature, true));
  els.withoutHeader.setAttribute("aria-label", `Without ${feature.label}`);
  setHeader("Feature Sort", `${state.featureIndex + 1} of ${state.activeFeatures.length}`);
  els.submitSortButton.textContent = "OK";
  unlockSubmitButton();
  resetCountChallenge();
  renderSmileys();
  if (previousRects) {
    animateSmileysFrom(previousRects);
  }
}

function createFeatureIcon(feature, withX = false) {
  const wrapper = document.createElement("span");
  wrapper.className = `feature-icon ${feature.icon}-icon`;
  wrapper.setAttribute("aria-hidden", "true");

  if (feature.icon === "hat") {
    const hatDetail = document.createElement("span");
    hatDetail.className = "hat-detail";
    wrapper.append(hatDetail);
  }

  if (feature.icon === "expression") {
    wrapper.append(document.createElement("span"));
  }

  if (feature.icon === "ears") {
    wrapper.append(document.createElement("span"), document.createElement("span"));
  }

  if (withX) {
    wrapper.classList.add("has-red-x");
    const xMark = document.createElement("span");
    xMark.className = "red-x";
    wrapper.append(xMark);
  }

  return wrapper;
}

function getDefaultSmileyCount() {
  if (state.useNumbers) return 10;
  return 5 + Math.floor(Math.random() * 3);
}

function getReuseGoal(mission = state.mission) {
  return mission === "feature" ? 1 : 3;
}

function makeCarrollSet(count = getDefaultSmileyCount()) {
  for (let attempt = 0; attempt < 600; attempt += 1) {
    const criteria = shuffle([...features]).slice(0, 2);
    const smileys = makeSmileys(count, featureCountForSmileyCount(count));
    if (hasAllCarrollQuadrants(smileys, criteria)) {
      return { smileys, criteria };
    }
  }

  return {
    smileys: makeSmileys(count, featureCountForSmileyCount(count)),
    criteria: shuffle([...features]).slice(0, 2)
  };
}

function hasAllCarrollQuadrants(smileys, criteria) {
  const zones = new Set(smileys.map(smiley => getCarrollZoneForSmiley(smiley, criteria)));
  return zones.size === 4;
}

function makeVennSet(count = getDefaultSmileyCount()) {
  return makeVennSetForCount(getVennCriterionCount(), count);
}

function makeVennSetForCount(criterionCount, count = getDefaultSmileyCount()) {
  const criteria = shuffle([...features]).slice(0, criterionCount);
  const selected = shuffle(makeAllSmileyCombinations()).slice(0, count);
  return {
    smileys: makePlayableSmileys(selected),
    criteria
  };
}

function getVennCriterionCount() {
  return 2;
}

function getSelectionCriterionCount() {
  return 2;
}

function chooseSelectionSourceZone() {
  const zones = getVennZoneKeys().filter(zone =>
    state.smileys.some(smiley => smiley.sourceZone === zone)
  );
  return shuffle(zones)[0] || "venn-outside";
}

function chooseSelectionSourceRule() {
  const configuredMode = SELECTION_RULE_PROGRESSION[Math.min(
    state.selectionLevel - 1,
    SELECTION_RULE_PROGRESSION.length - 1
  )] || "single";
  const mode = configuredMode === "random"
    ? shuffle(SELECTION_RULE_PROGRESSION.filter(item => item !== "random"))[0]
    : configuredMode;
  const rules = buildSelectionRules(mode).filter(hasUsefulSelectionMatches);
  if (rules.length > 0) return shuffle(rules)[0];
  const fallbackRules = buildSelectionRules("single").filter(hasUsefulSelectionMatches);
  if (fallbackRules.length > 0) return shuffle(fallbackRules)[0];
  return buildSelectionZoneRule(chooseSelectionSourceZone());
}

function buildSelectionRules(mode) {
  if (mode === "single") {
    return state.activeVennCriteria.flatMap(feature => [
      makeSelectionRule("single", [[{ feature, expected: true }]]),
      makeSelectionRule("single", [[{ feature, expected: false }]])
    ]);
  }

  if (mode === "and") {
    return getTwoFeatureExpectationPairs().map(checks => makeSelectionRule("and", [checks]));
  }

  const criteria = state.activeVennCriteria.slice(0, 2);
  if (criteria.length < 2) return [];
  return getTwoFeatureExpectationPairs().map(checks => {
    const [first, second] = checks;
    const groups = [
      [first, { ...second, expected: !second.expected }],
      [{ ...first, expected: !first.expected }, second],
      [first, second]
    ];
    return makeSelectionRule("or", groups, {
      displayGroups: [[first], [second]]
    });
  });
}

function buildSelectionZoneRule(zone) {
  const zoneLetters = zone === "venn-outside" ? [] : zone.replace("venn-", "").split("");
  const checks = state.activeVennCriteria.map((feature, index) => ({
    feature,
    expected: zoneLetters.includes(String.fromCharCode(97 + index))
  }));
  return makeSelectionRule("and", [checks], { zone });
}

function makeSelectionRule(type, groups, extras = {}) {
  return { type, groups, displayGroups: groups, checks: groups[0] || [], ...extras };
}

function getTwoFeatureExpectationPairs() {
  const criteria = state.activeVennCriteria.slice(0, 2);
  if (criteria.length < 2) return [];
  const [first, second] = criteria;
  return [
    [{ feature: first, expected: true }, { feature: second, expected: true }],
    [{ feature: first, expected: true }, { feature: second, expected: false }],
    [{ feature: first, expected: false }, { feature: second, expected: true }],
    [{ feature: first, expected: false }, { feature: second, expected: false }]
  ];
}

function hasUsefulSelectionMatches(rule) {
  const matchCount = state.smileys.filter(smiley => matchesSelectionRule(smiley, rule)).length;
  return matchCount > 0 && matchCount < state.smileys.length;
}

function matchesSelectionRule(smiley, rule = state.selectionSourceRule) {
  if (!rule) return false;
  return rule.groups.some(group =>
    group.every(({ feature, expected }) => Boolean(feature.get(smiley)) === expected)
  );
}

function makeCompareSet() {
  const allSmileys = shuffle(makeAllSmileyCombinations());
  for (let firstIndex = 0; firstIndex < allSmileys.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < allSmileys.length; secondIndex += 1) {
      const pair = [allSmileys[firstIndex], allSmileys[secondIndex]];
      const equalCount = features.filter(feature => compareFeatureValue(feature, pair[0]) === compareFeatureValue(feature, pair[1])).length;
      if (equalCount > 0 && equalCount < features.length) {
        return { smileys: makePlayableSmileys(pair) };
      }
    }
  }
  return { smileys: makePlayableSmileys(allSmileys.slice(0, 2)) };
}

function chooseCreatorCriteria() {
  return shuffle([...features]).slice(0, state.creatorLevel >= 2 ? 3 : 2);
}

function makeBaseCreatorSmiley() {
  return {
    shape: "square",
    color: "red",
    expression: "neutral",
    hat: false,
    ears: false,
    id: `creator-current-${Date.now()}`
  };
}

function makeImplicitSet(count = getDefaultSmileyCount()) {
  for (let attempt = 0; attempt < 600; attempt += 1) {
    const criteria = shuffle([...features]).slice(0, 2);
    const smileys = makeSmileys(count, featureCountForSmileyCount(count));
    if (hasAllImplicitZones(smileys, criteria)) {
      return { smileys, criteria };
    }
  }

  return {
    smileys: makeSmileys(count, featureCountForSmileyCount(count)),
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
  if (state.activeVennCriteria.length <= 2) {
    return ["venn-a", "venn-b", "venn-ab", "venn-outside"];
  }
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

function renderSmileys(excludedId = null) {
  cleanupStrandedDragNodes();
  getAllDropContainers().forEach(zone => zone.replaceChildren());
  getSmileysInRenderOrder().forEach(smiley => {
    if (smiley.id === excludedId) {
      if (smiley.zone === "order" || smiley.zone === "permutation-order") {
        getZoneElement(smiley.zone).append(createOrderPlaceholder());
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
  if (zone === "selection-target") return 6;
  if (zone === "permutation-order") return 7;
  return 3;
}

function getAllDropContainers() {
  return [
    els.tray,
    els.withZone,
    els.withoutZone,
    els.orderingZone,
    els.permutationOrderZone,
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
    els.implicitOutsideZone,
    els.selectionTargetZone
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
    cancelActiveDrag();
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

function cancelActiveDrag() {
  if (!state.dragging) return;
  if (state.dragging.type === "compare-criterion") {
    cancelCompareCriteriaDrag();
    return;
  }
  if (state.dragging.type === "album-photo") {
    cancelAlbumPhotoDrag();
    return;
  }
  cancelDrag();
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
  if (zone === "order" || zone === "permutation-order") {
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
  const orderZone = getActiveOrderZone();
  const orderZoneKey = state.phase === "permutation" ? "permutation-order" : "order";
  const orderedSmileys = state.smileys
    .filter(item => item.id !== smiley.id && item.zone === orderZoneKey)
    .sort((first, second) => first.placementOrder - second.placementOrder);
  const insertIndex = getOrderInsertIndex(x, y);
  smiley.zone = orderZoneKey;
  orderedSmileys.splice(insertIndex, 0, smiley);
  orderedSmileys.forEach((item, index) => {
    item.placementOrder = index;
  });
  state.nextPlacementOrder = orderedSmileys.length;
  if (orderZone) {
    orderZone.dataset.zone = orderZoneKey;
  }
}

function previewOrderingDrag(x, y) {
  if (!["ordering", "permutation"].includes(state.phase) || !state.dragging) return;
  const orderZone = getActiveOrderZone();
  const orderZoneKey = state.phase === "permutation" ? "permutation-order" : "order";
  if (!isPointInsideElement(orderZone, x, y)) return;
  const smiley = state.smileys.find(item => item.id === state.dragging.id);
  if (!smiley) return;
  const insertIndex = getOrderInsertIndex(x, y);
  if (state.dragging.previewZone === orderZoneKey && state.dragging.previewIndex === insertIndex) return;

  const previousRects = collectSmileyRects();
  moveSmileyToOrder(smiley, x, y);
  state.dragging.previewZone = orderZoneKey;
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
  const orderZone = getActiveOrderZone();
  const nodes = [...orderZone.querySelectorAll(".smiley")]
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

  const zoneRect = orderZone.getBoundingClientRect();
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

function getActiveOrderZone() {
  return state.phase === "permutation" ? els.permutationOrderZone : els.orderingZone;
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
  if (state.phase === "ordering" || state.phase === "permutation") {
    const orderZone = getActiveOrderZone();
    if (isPointInsideElement(orderZone, x, y)) return orderZone;
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
  if (state.phase === "selection") {
    const selectionTarget = getAllDropContainers()
      .filter(zone => zone.classList.contains("venn-zone") || zone.classList.contains("selection-target-zone"))
      .find(zone => isPointInsideElement(zone, x, y));
    if (selectionTarget) return selectionTarget;
  }
  const element = document.elementFromPoint(x, y);
  if (!element) return null;
  if (state.phase === "ordering") {
    return element.closest(".ordering-zone, .smiley-tray");
  }
  if (state.phase === "permutation") {
    return element.closest(".permutation-order-zone, .smiley-tray");
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
  if (state.phase === "selection") {
    return element.closest(".venn-zone, .selection-target-zone");
  }
  return element.closest(".drop-zone");
}

function validateCurrentPhase() {
  if (els.submitSortButton.disabled) return;
  if (isCelebrating()) return;
  if (state.countChallenge) {
    checkCounts();
    return;
  }
  if (state.phase === "ordering") {
    validateOrdering();
    return;
  }
  if (state.phase === "carroll") {
    validateCarroll();
    return;
  }
  if (state.phase === "compare") {
    validateCompare();
    return;
  }
  if (state.phase === "simple-compare") {
    validateSimpleCompare();
    return;
  }
  if (state.phase === "permutation") {
    capturePermutationPhoto();
    return;
  }
  if (state.phase === "selection") {
    validateSelection();
    return;
  }
  if (state.phase === "creator") {
    validateCreatorCurrent();
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

function lockSubmitButton() {
  els.submitSortButton.classList.remove("hidden");
  els.submitSortButton.disabled = true;
}

function unlockSubmitButton() {
  els.submitSortButton.classList.remove("hidden");
  els.submitSortButton.disabled = false;
}

function resetMistakeCounter() {
  state.mistakeStreak = 0;
  state.returnAfterErrorPending = false;
  if (state.returnAfterErrorTimer) {
    window.clearTimeout(state.returnAfterErrorTimer);
    state.returnAfterErrorTimer = null;
  }
}

function registerMistake({ returnSmileys = false } = {}) {
  if (!state.returnAfterErrorPending) {
    state.mistakeStreak += 1;
  }
  signalIncorrect();
  if (returnSmileys && state.mistakeStreak >= 2 && !state.returnAfterErrorPending) {
    state.returnAfterErrorPending = true;
    state.returnAfterErrorTimer = window.setTimeout(() => {
      state.returnAfterErrorTimer = null;
      returnSmileysToTraySlowly();
    }, 560);
  }
}

function validateSort() {
  const allSorted = state.smileys.every(smiley => smiley.zone !== "tray");
  if (!allSorted) {
    registerMistake({ returnSmileys: true });
    return;
  }

  const feature = currentFeature();
  const isCorrect = state.smileys.every(smiley => {
    const shouldBeWith = feature.get(smiley);
    return smiley.zone === (shouldBeWith ? "with" : "without");
  });

  if (isCorrect) {
    resetMistakeCounter();
    if (state.useNumbers) {
      startCountChallenge(buildFeatureCountItems(), () => advanceQuestionFromCount());
    } else {
      lockSubmitButton();
      advanceQuestion();
    }
    return;
  }

  registerMistake({ returnSmileys: true });
}

function signalIncorrect() {
  if (navigator.vibrate) {
    navigator.vibrate([80, 40, 80]);
  }
  const target = state.phase === "ordering"
    ? els.orderingPanel
    : state.phase === "carroll"
      ? els.carrollPanel
      : state.phase === "compare"
        ? els.comparePanel
      : state.phase === "simple-compare"
        ? els.simpleComparePanel
      : state.phase === "permutation"
        ? els.permutationPanel
      : state.phase === "selection"
        ? els.selectionPanel
      : state.phase === "creator"
        ? els.creatorPanel
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
  resetMistakeCounter();
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

function animateCompareCriteriaFrom(previousRects) {
  previousRects.forEach((oldRect, featureKey) => {
    const node = document.querySelector(`.compare-criterion-card[data-feature-key="${featureKey}"]`);
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
      node.classList.add("compare-returning");
      node.style.transform = "";
    }));
    node.addEventListener("transitionend", () => {
      node.classList.remove("compare-returning");
      node.classList.remove("is-traveling");
      node.style.transition = "";
    }, { once: true });
  });
}

function animateCompareCriteriaReset(previousRects) {
  previousRects.forEach((oldRect, featureKey) => {
    const node = document.querySelector(`.compare-criterion-card[data-feature-key="${featureKey}"]`);
    if (!node) return;
    const newRect = node.getBoundingClientRect();
    const ghost = node.cloneNode(true);
    ghost.classList.add("compare-reset-ghost");
    ghost.style.left = `${oldRect.left}px`;
    ghost.style.top = `${oldRect.top}px`;
    ghost.style.width = `${newRect.width}px`;
    ghost.style.height = `${newRect.height}px`;
    document.body.append(ghost);
    node.classList.add("compare-reset-arriving");
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      ghost.style.transform = `translate(${newRect.left - oldRect.left}px, ${newRect.top - oldRect.top}px)`;
      node.classList.remove("compare-reset-arriving");
    }));
    ghost.addEventListener("transitionend", event => {
      if (event.target === ghost && event.propertyName === "transform") {
        ghost.remove();
      }
    });
    window.setTimeout(() => ghost.remove(), 760);
  });
}

function setPairShiftDistance(container, faceSelector) {
  const faces = container.querySelectorAll(faceSelector);
  if (faces.length < 2) return;
  const firstRect = faces[0].getBoundingClientRect();
  const secondRect = faces[1].getBoundingClientRect();
  container.style.setProperty("--pair-shift-x", `${firstRect.left - secondRect.left}px`);
}

function collectCompareCriteriaRects() {
  const previousRects = new Map();
  features.forEach(feature => {
    const node = document.querySelector(`.compare-criterion-card[data-feature-key="${feature.key}"]`);
    if (node) {
      const rect = node.getBoundingClientRect();
      previousRects.set(feature.key, {
        left: rect.left,
        top: rect.top
      });
    }
  });
  return previousRects;
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
  const inputs = [...document.querySelectorAll(".count-question-input")]
    .sort((first, second) => Number(first.dataset.countIndex) - Number(second.dataset.countIndex));
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
    clearInlineCountPrompts();
    onCorrect();
    return;
  }

  state.mistakeStreak += 1;
  signalIncorrect();
  if (state.mistakeStreak >= 2) {
    inputs.forEach(input => {
      input.value = "";
    });
    resetMistakeCounter();
  }
}

function advanceQuestionFromCount() {
  advanceQuestion();
}

function startCountChallenge(items, onCorrect) {
  state.countChallenge = { items, onCorrect };
  renderInlineCountPrompts(items);
  els.submitSortButton.textContent = "OK";
  unlockSubmitButton();
  const firstInput = document.querySelector(".count-question-input");
  if (firstInput) {
    firstInput.focus();
  }
}

function renderInlineCountPrompts(items) {
  clearInlineCountPrompts();
  items.forEach((item, index) => {
    const mount = getCountPromptMount(item);
    if (!mount) return;
    mount.classList.add("has-count-question");
    mount.append(createCountBox(item, index));
  });
}

function clearInlineCountPrompts() {
  document.querySelectorAll(".count-question").forEach(node => node.remove());
  document.querySelectorAll(".has-count-question").forEach(node => node.classList.remove("has-count-question"));
}

function resetCountChallenge() {
  state.countChallenge = null;
  clearInlineCountPrompts();
}

function getCountPromptMount(item) {
  if (item.target === "tray-label") return els.trayLabel;
  if (item.target === "with-header") return els.withHeader;
  if (item.target === "without-header") return els.withoutHeader;
  if (item.target === "compare-equal") return els.compareEqualZone;
  if (item.target === "compare-different") return els.compareDifferentZone;
  if (item.zone) return getZoneElement(item.zone);
  return els.trayLabel;
}

function createCountBox(item, index) {
  const label = document.createElement("label");
  label.className = `count-question ${item.whole ? "whole-count-question" : ""}`;
  if (item.showLabel !== false) {
    const labelContent = document.createElement("span");
    labelContent.className = "count-label";
    if (typeof item.label === "string") {
      labelContent.textContent = item.label;
    } else if (item.label) {
      labelContent.append(item.label);
    }
    label.append(labelContent);
  }
  const input = document.createElement("input");
  input.className = "count-question-input";
  input.inputMode = "numeric";
  input.pattern = "[0-9]*";
  input.autocomplete = "off";
  input.placeholder = "?";
  input.setAttribute("aria-label", typeof item.label === "string" ? `${item.label} count` : "Count");
  input.dataset.countIndex = String(index);
  label.append(input);
  return label;
}

function buildFeatureCountItems() {
  const feature = currentFeature();
  const expectedWith = state.smileys.filter(feature.get).length;
  const expectedWithout = state.smileys.length - expectedWith;
  return [
    { label: "Whole", expected: state.smileys.length, whole: true, target: "tray-label", showLabel: false },
    { label: createFeatureIcon(feature), expected: expectedWith, target: "with-header", showLabel: false },
    { label: createFeatureIcon(feature, true), expected: expectedWithout, target: "without-header", showLabel: false }
  ];
}

function buildMissionCountItems() {
  if (state.mission === "ordering") {
    return [
      { label: "Ordered", expected: state.smileys.length, whole: true, zone: "order", showLabel: false }
    ];
  }
  if (state.mission === "compare") {
    return [
      { label: "Compared", expected: state.compareSmileys.length, whole: true, target: "tray-label", showLabel: false },
      { label: "=", expected: features.filter(feature => getCompareAnswer(feature) === "equal").length, target: "compare-equal", showLabel: false },
      { label: "\u2260", expected: features.filter(feature => getCompareAnswer(feature) === "different").length, target: "compare-different", showLabel: false }
    ];
  }
  if (state.mission === "carroll") {
    const [columnFeature, rowFeature] = state.activeCarrollCriteria;
    return [
      { label: "Whole", expected: state.smileys.length, whole: true, target: "tray-label", showLabel: false },
      { label: createCountIconGroup([createFeatureIcon(columnFeature), createFeatureIcon(rowFeature)]), expected: countSmileysInZone("carroll-with-with"), zone: "carroll-with-with", showLabel: false },
      { label: createCountIconGroup([createFeatureIcon(columnFeature, true), createFeatureIcon(rowFeature)]), expected: countSmileysInZone("carroll-without-with"), zone: "carroll-without-with", showLabel: false },
      { label: createCountIconGroup([createFeatureIcon(columnFeature), createFeatureIcon(rowFeature, true)]), expected: countSmileysInZone("carroll-with-without"), zone: "carroll-with-without", showLabel: false },
      { label: createCountIconGroup([createFeatureIcon(columnFeature, true), createFeatureIcon(rowFeature, true)]), expected: countSmileysInZone("carroll-without-without"), zone: "carroll-without-without", showLabel: false }
    ];
  }
  if (state.mission === "venn") {
    return [
      { label: "Whole", expected: state.smileys.length, whole: true, target: "tray-label", showLabel: false },
      ...getVennZoneKeys().map(zone => ({
        label: createVennCountLabel(zone),
        expected: countSmileysInZone(zone),
        zone,
        showLabel: false
      }))
    ];
  }
  if (state.mission === "implicit") {
    return [
      { label: "Whole", expected: state.smileys.length, whole: true, target: "tray-label", showLabel: false },
      { label: "Left", expected: countSmileysInZone("implicit-a"), zone: "implicit-a", showLabel: false },
      { label: "Middle", expected: countSmileysInZone("implicit-ab"), zone: "implicit-ab", showLabel: false },
      { label: "Right", expected: countSmileysInZone("implicit-b"), zone: "implicit-b", showLabel: false },
      { label: "Outside", expected: countSmileysInZone("implicit-outside"), zone: "implicit-outside", showLabel: false }
    ];
  }
  return [{ label: "Whole", expected: state.smileys.length, whole: true, target: "tray-label", showLabel: false }];
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

function resetCompareState() {
  state.compareSmileys = [];
  state.comparePlacements = {};
  state.compareVisualX = {};
  state.compareMode = "drag";
}

function resetSimpleCompareState() {
  state.simpleCompareSmileys = [];
  state.simpleCompareMarks = {};
}

function resetPermutationState() {
  state.permutationAlbum = [];
  state.permutationHadMistake = false;
}

function resetSelectionState() {
  state.selectionSourceZone = null;
  state.selectionSourceRule = null;
  state.selectionHadMistake = false;
}

function resetImplicitGuessState() {
  state.implicitGuesses = [null, null];
  state.implicitChoiceIndex = null;
}

function resetCreatorState() {
  state.creatorCriteria = [];
  state.creatorCurrent = null;
  state.createdSmileys = [];
  state.creatorHadMistake = false;
}

function advanceQuestion() {
  if (state.featureIndex + 1 < state.activeFeatures.length) {
    transitionToNextFeatureQuestion();
    return;
  }

  finishFeatureCycle();
}

function finishFeatureCycle() {
  clearCycleTimers();
  if (shouldReuseSmileysForNextCycle("feature")) {
    finishReusableCycle("feature");
    return;
  }

  const nextCount = randomCountDifferentFrom(state.smileys.length);
  runNewSmileysCycleTransition(() => startSet(nextCount, false));
}

function transitionToNextFeatureQuestion() {
  const previousRects = collectSmileyRects();
  state.phase = "transitioning";
  lockSubmitButton();
  els.workPanel.classList.add("is-celebrating");
  els.workPanel.classList.add("criteria-fading-out");
  scheduleCycleTimer(() => {
    state.featureIndex += 1;
    startFeature(previousRects);
    els.workPanel.classList.remove("is-celebrating");
    els.workPanel.classList.remove("criteria-fading-out");
    els.workPanel.classList.add("criteria-fading-in");
  }, 760);
  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("criteria-fading-in");
  }, 1520);
}

function startOrderingPhase(previousRects = null) {
  state.phase = "ordering";
  state.activeOrderingCriteria = chooseOrderingCriteria();
  resetMistakeCounter();
  state.orderingHadMistake = false;
  state.nextPlacementOrder = 1;
  state.smileys.forEach(smiley => {
    smiley.zone = "tray";
    smiley.placementOrder = smiley.originalOrder;
  });
  els.sortTable.classList.add("hidden");
  resetCountChallenge();
  els.orderingPanel.classList.remove("hidden");
  els.carrollPanel.classList.add("hidden");
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  els.trayLabel.textContent = "Smileys";
  els.criteriaList.replaceChildren(createOrderingCriteriaChain(state.activeOrderingCriteria));
  els.criteriaList.setAttribute("aria-label", `Ordering criteria: ${state.activeOrderingCriteria.map(criterion => criterion.label).join(", then ")}`);
  setHeader("Order", `${state.setCycle + 1} of ${state.reuseGoal}`);
  els.submitSortButton.textContent = "OK";
  unlockSubmitButton();
  renderSmileys();
  if (previousRects) {
    animateSmileysFrom(previousRects);
  }
}

function startCarrollPhase(previousRects = null) {
  state.phase = "carroll";
  resetMistakeCounter();
  state.nextPlacementOrder = 1;
  state.smileys.forEach(smiley => {
    smiley.zone = "tray";
    smiley.placementOrder = smiley.originalOrder;
  });
  els.sortTable.classList.add("hidden");
  els.orderingPanel.classList.add("hidden");
  resetCountChallenge();
  els.carrollPanel.classList.remove("hidden");
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  els.trayLabel.textContent = "Smileys";
  renderCarrollAxes();
  setHeader("Two Feature Sort", `${state.setCycle + 1} of ${state.reuseGoal}`);
  els.submitSortButton.textContent = "OK";
  unlockSubmitButton();
  renderSmileys();
  if (previousRects) {
    animateSmileysFrom(previousRects);
  }
}

function startComparePhase() {
  state.phase = "compare";
  resetMistakeCounter();
  els.sortTable.classList.add("hidden");
  els.orderingPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  resetCountChallenge();
  els.comparePanel.classList.remove("hidden");
  els.trayLabel.textContent = "";
  els.tray.replaceChildren();
  setHeader("Compare");
  els.submitSortButton.textContent = "OK";
  unlockSubmitButton();
  renderCompare();
}

function renderCompare() {
  renderCompareFaces();
  renderCompareMode();
}

function renderCompareFaces() {
  els.compareFaces.replaceChildren(...state.compareSmileys.map(smiley => {
    const wrapper = document.createElement("div");
    wrapper.className = "compare-face";
    wrapper.append(createSmileyNode(smiley));
    return wrapper;
  }));
}

function renderCompareMode() {
  state.compareMode = "drag";
  els.compareDragView.classList.remove("hidden");
  renderCompareDragView();
}

function renderCompareDragView() {
  els.compareCriteriaBank.replaceChildren();
  els.compareEqualZone.replaceChildren();
  els.compareDifferentZone.replaceChildren();
  features.forEach(feature => {
    const card = createCompareCriteriaCard(feature);
    const placement = state.comparePlacements[feature.key];
    if (placement === "equal") {
      els.compareEqualZone.append(card);
    } else if (placement === "different") {
      els.compareDifferentZone.append(card);
    } else {
      els.compareCriteriaBank.append(card);
    }
  });
}

function createCompareSymbol(text) {
  const symbol = document.createElement("span");
  symbol.className = "compare-symbol";
  symbol.textContent = text;
  return symbol;
}

function createCompareCriteriaCard(feature) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "compare-criterion-card";
  card.dataset.featureKey = feature.key;
  card.setAttribute("aria-label", feature.label);
  card.classList.toggle("has-visual-x", Boolean(state.compareVisualX[feature.key]));
  card.append(createFeatureIcon(feature));
  const visualX = document.createElement("span");
  visualX.className = "visual-red-x";
  visualX.setAttribute("aria-hidden", "true");
  card.append(visualX);
  card.addEventListener("pointerdown", event => beginCompareCriteriaDrag(event, card));
  return card;
}

function setCompareVisualX(featureKey, enabled) {
  state.compareVisualX[featureKey] = enabled;
  document
    .querySelectorAll(`.compare-criterion-card[data-feature-key="${featureKey}"]`)
    .forEach(card => card.classList.toggle("has-visual-x", enabled));
}

function beginCompareCriteriaDrag(event, node) {
  event.preventDefault();
  if (isCelebrating()) return;
  if (state.dragging) {
    cancelActiveDrag();
  }
  const rect = node.getBoundingClientRect();
  const dragNode = node.cloneNode(true);
  node.setPointerCapture(event.pointerId);
  node.classList.add("drag-source");
  state.dragging = {
    type: "compare-criterion",
    featureKey: node.dataset.featureKey,
    node: dragNode,
    sourceNode: node,
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    startX: event.clientX,
    startY: event.clientY,
    moved: false
  };
  dragNode.style.width = `${rect.width}px`;
  dragNode.style.height = `${rect.height}px`;
  dragNode.style.left = `${rect.left}px`;
  dragNode.style.top = `${rect.top}px`;
  dragNode.classList.add("dragging");
  dragNode.classList.remove("drag-source");
  document.body.append(dragNode);
  document.addEventListener("pointermove", moveCompareCriteriaDrag);
  document.addEventListener("pointerup", endCompareCriteriaDrag);
  document.addEventListener("pointercancel", cancelCompareCriteriaDrag);
  moveCompareCriteriaDrag(event);
}

function moveCompareCriteriaDrag(event) {
  if (!state.dragging || state.dragging.type !== "compare-criterion") return;
  event.preventDefault();
  const { node, offsetX, offsetY } = state.dragging;
  const travel = Math.hypot(event.clientX - state.dragging.startX, event.clientY - state.dragging.startY);
  state.dragging.moved = travel > 8;
  node.style.left = `${event.clientX - offsetX}px`;
  node.style.top = `${event.clientY - offsetY}px`;
  if (state.dragging.moved) {
    markCompareDropTarget(event.clientX, event.clientY);
  }
}

function endCompareCriteriaDrag(event) {
  if (!state.dragging || state.dragging.type !== "compare-criterion") return;
  event.preventDefault();
  const dragged = state.dragging;
  const target = getCompareDropTarget(event.clientX, event.clientY);
  const travel = Math.hypot(event.clientX - dragged.startX, event.clientY - dragged.startY);
  if (!dragged.moved && travel <= 8) {
    setCompareVisualX(dragged.featureKey, !state.compareVisualX[dragged.featureKey]);
    cleanupCompareCriteriaDrag();
    return;
  }

  const previousRects = collectCompareCriteriaRects();
  const rect = dragged.node.getBoundingClientRect();
  previousRects.set(dragged.featureKey, {
    left: rect.left,
    top: rect.top
  });

  if (target) {
    const zone = target.dataset.compareZone;
    if (zone === "bank") {
      delete state.comparePlacements[dragged.featureKey];
    } else {
      state.comparePlacements[dragged.featureKey] = zone;
    }
  }
  cleanupCompareCriteriaDrag();
  renderCompareDragView();
  animateCompareCriteriaFrom(previousRects);
}

function cancelCompareCriteriaDrag() {
  const previousRects = state.dragging?.type === "compare-criterion"
    ? collectCompareCriteriaRects()
    : null;
  if (previousRects && state.dragging?.type === "compare-criterion") {
    const rect = state.dragging.node.getBoundingClientRect();
    previousRects.set(state.dragging.featureKey, {
      left: rect.left,
      top: rect.top
    });
  }
  cleanupCompareCriteriaDrag();
  renderCompareDragView();
  if (previousRects) {
    animateCompareCriteriaFrom(previousRects);
  }
}

function cleanupCompareCriteriaDrag() {
  if (!state.dragging) return;
  const { node, sourceNode, pointerId } = state.dragging;
  const captureNode = sourceNode || node;
  if (captureNode.hasPointerCapture(pointerId)) {
    captureNode.releasePointerCapture(pointerId);
  }
  document.removeEventListener("pointermove", moveCompareCriteriaDrag);
  document.removeEventListener("pointerup", endCompareCriteriaDrag);
  document.removeEventListener("pointercancel", cancelCompareCriteriaDrag);
  sourceNode?.classList.remove("drag-source");
  node.classList.remove("dragging");
  node.removeAttribute("style");
  node.remove();
  state.dragging = null;
  clearCompareDropMarks();
}

function markCompareDropTarget(x, y) {
  clearCompareDropMarks();
  const target = getCompareDropTarget(x, y);
  if (target) {
    target.classList.add("is-over");
  }
}

function clearCompareDropMarks() {
  [els.compareCriteriaBank, els.compareEqualZone, els.compareDifferentZone].forEach(zone => zone.classList.remove("is-over"));
}

function getCompareDropTarget(x, y) {
  return [els.compareEqualZone, els.compareDifferentZone, els.compareCriteriaBank]
    .find(zone => isPointInsideElement(zone, x, y));
}

function validateCompare() {
  const allPlaced = features.every(feature => state.comparePlacements[feature.key]);
  if (!allPlaced) {
    state.mistakeStreak += 1;
    signalIncorrect();
    return;
  }

  const isCorrect = features.every(feature => state.comparePlacements[feature.key] === getCompareAnswer(feature));
  if (isCorrect) {
    resetMistakeCounter();
    advanceComparePair();
    return;
  }

  state.mistakeStreak += 1;
  signalIncorrect();
  if (state.mistakeStreak >= 2) {
    const previousRects = collectCompareCriteriaRects();
    state.comparePlacements = {};
    resetMistakeCounter();
    renderCompareMode();
    animateCompareCriteriaFrom(previousRects);
  }
}

function getCompareAnswer(feature) {
  const [first, second] = state.compareSmileys;
  return compareFeatureValue(feature, first) === compareFeatureValue(feature, second) ? "equal" : "different";
}

function compareFeatureValue(feature, smiley) {
  if (feature.key === "shape") return smiley.shape;
  if (feature.key === "color") return smiley.color;
  if (feature.key === "expression") return smiley.expression;
  return Boolean(feature.get(smiley));
}

function advanceComparePair() {
  if (state.phase === "transitioning") return;
  const previousCriteriaRects = state.compareMode === "drag" ? collectCompareCriteriaRects() : null;
  state.phase = "transitioning";
  lockSubmitButton();
  state.comparePlacements = {};
  if (previousCriteriaRects) {
    renderCompareDragView();
    animateCompareCriteriaFrom(previousCriteriaRects);
  }
  setPairShiftDistance(els.compareFaces, ".compare-face .smiley");
  els.compareFaces.classList.remove("compare-pair-entering");
  els.compareFaces.classList.add("compare-pair-shifting");
  window.setTimeout(() => {
    state.compareSmileys = makeNextComparePair();
    state.phase = "compare";
    els.compareFaces.classList.remove("compare-pair-shifting");
    els.compareFaces.classList.remove("compare-pair-entering");
    els.compareFaces.classList.add("compare-pair-entering");
    unlockSubmitButton();
    renderCompareFaces();
    if (state.compareMode !== "drag") {
      renderCompareMode();
    }
    window.setTimeout(() => {
      els.compareFaces.classList.remove("compare-pair-entering");
      els.compareFaces.style.removeProperty("--pair-shift-x");
    }, 1250);
  }, 1250);
}

function makeNextComparePair() {
  const previousRight = state.compareSmileys[1];
  const candidates = shuffle(makeAllSmileyCombinations()).filter(smiley =>
    creatorSmileyKey(smiley) !== creatorSmileyKey(previousRight)
  );
  const nextRight = candidates.find(candidate => {
    const equalCount = features.filter(feature =>
      compareFeatureValue(feature, previousRight) === compareFeatureValue(feature, candidate)
    ).length;
    return equalCount > 0 && equalCount < features.length;
  }) || candidates[0];
  return makePlayableSmileys([previousRight, nextRight]);
}

function startSimpleComparePhase() {
  state.phase = "simple-compare";
  resetMistakeCounter();
  els.sortTable.classList.add("hidden");
  els.orderingPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.comparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  resetCountChallenge();
  els.simpleComparePanel.classList.remove("hidden");
  els.trayLabel.textContent = "";
  els.tray.replaceChildren();
  setHeader("Easy Compare");
  els.submitSortButton.textContent = "OK";
  unlockSubmitButton();
  renderSimpleCompare();
}

function renderSimpleCompare() {
  els.simpleCompareFaces.replaceChildren();
  els.simpleCompareTable.replaceChildren();

  state.simpleCompareSmileys.forEach(smiley => {
    const head = document.createElement("div");
    head.className = "simple-compare-head-cell simple-face-head";
    head.append(createSmileyNode({ ...smiley, id: `simple-head-${smiley.id}` }));
    els.simpleCompareTable.append(head);
  });
  const relationHead = document.createElement("div");
  relationHead.className = "simple-compare-head-cell simple-relation-head";
  relationHead.setAttribute("aria-hidden", "true");
  els.simpleCompareTable.append(relationHead);

  features.forEach(feature => {
    state.simpleCompareSmileys.forEach((smiley, smileyIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "simple-mark-button";
      button.dataset.featureKey = feature.key;
      button.dataset.smileyIndex = String(smileyIndex);
      const value = getSimpleFeatureMark(feature.key, smileyIndex);
      button.append(createFeatureIcon(feature));
      const xOverlay = document.createElement("span");
      xOverlay.className = "simple-icon-x";
      xOverlay.setAttribute("aria-hidden", "true");
      button.append(xOverlay);
      button.classList.toggle("is-on", value);
      button.classList.toggle("has-simple-x", !value);
      button.setAttribute("aria-label", `${feature.label} ${value ? "marked present" : "marked absent"}`);
      button.addEventListener("click", () => {
        setSimpleFeatureMark(feature.key, smileyIndex, !value);
        renderSimpleCompare();
      });
      els.simpleCompareTable.append(button);
    });

    const relationButton = document.createElement("button");
    relationButton.type = "button";
    relationButton.className = "simple-relation-button";
    relationButton.dataset.featureKey = feature.key;
    const relation = getSimpleRelationMark(feature.key);
    relationButton.textContent = relation === "different" ? "\u2260" : "=";
    relationButton.classList.toggle("is-different", relation === "different");
    relationButton.addEventListener("click", () => {
      setSimpleRelationMark(feature.key, relation === "different" ? "equal" : "different");
      renderSimpleCompare();
    });
    els.simpleCompareTable.append(relationButton);
  });
}

function getSimpleFeatureMark(featureKey, smileyIndex) {
  return state.simpleCompareMarks[featureKey]?.values?.[smileyIndex] ?? true;
}

function setSimpleFeatureMark(featureKey, smileyIndex, value) {
  if (!state.simpleCompareMarks[featureKey]) {
    state.simpleCompareMarks[featureKey] = { values: [true, true], relation: "equal" };
  }
  state.simpleCompareMarks[featureKey].values[smileyIndex] = value;
}

function getSimpleRelationMark(featureKey) {
  return state.simpleCompareMarks[featureKey]?.relation || "equal";
}

function setSimpleRelationMark(featureKey, value) {
  if (!state.simpleCompareMarks[featureKey]) {
    state.simpleCompareMarks[featureKey] = { values: [true, true], relation: "equal" };
  }
  state.simpleCompareMarks[featureKey].relation = value;
}

function validateSimpleCompare() {
  const wrongFeatureMarks = features.filter(feature =>
    state.simpleCompareSmileys.some((smiley, index) =>
      getSimpleFeatureMark(feature.key, index) !== Boolean(feature.get(smiley))
    )
  );
  if (wrongFeatureMarks.length > 0) {
    state.mistakeStreak += 1;
    wiggleSimpleCompareCells(wrongFeatureMarks.map(feature => feature.key), ".simple-mark-button");
    return;
  }

  const wrongRelations = features.filter(feature =>
    getSimpleRelationMark(feature.key) !== getCompareAnswerForPair(feature, state.simpleCompareSmileys)
  );
  if (wrongRelations.length > 0) {
    state.mistakeStreak += 1;
    wiggleSimpleCompareCells(wrongRelations.map(feature => feature.key), ".simple-relation-button");
    return;
  }

  resetMistakeCounter();
  advanceSimpleComparePair();
}

function wiggleSimpleCompareCells(featureKeys, selector) {
  featureKeys.forEach(featureKey => {
    document.querySelectorAll(`${selector}[data-feature-key="${featureKey}"]`).forEach(node => {
      node.classList.remove("wiggle");
      window.requestAnimationFrame(() => node.classList.add("wiggle"));
      node.addEventListener("animationend", () => node.classList.remove("wiggle"), { once: true });
    });
  });
  if (navigator.vibrate) {
    navigator.vibrate(80);
  }
}

function getCompareAnswerForPair(feature, pair) {
  return compareFeatureValue(feature, pair[0]) === compareFeatureValue(feature, pair[1]) ? "equal" : "different";
}

function advanceSimpleComparePair() {
  const previousXs = [...els.simpleCompareTable.querySelectorAll(".simple-mark-button.has-simple-x .simple-icon-x")];
  previousXs.forEach(node => node.classList.add("simple-x-fade-out"));
  setPairShiftDistance(els.simpleCompareTable, ".simple-face-head .smiley");
  els.simpleCompareTable.classList.add("simple-pair-shifting");
  window.setTimeout(() => {
    state.simpleCompareSmileys = makeNextSimpleComparePair();
    state.simpleCompareMarks = {};
    els.simpleCompareTable.classList.remove("simple-pair-shifting");
    els.simpleCompareTable.classList.remove("simple-pair-entering");
    els.simpleCompareTable.classList.add("simple-pair-entering");
    renderSimpleCompare();
    window.setTimeout(() => {
      els.simpleCompareTable.classList.remove("simple-pair-entering");
      els.simpleCompareTable.style.removeProperty("--pair-shift-x");
    }, 1250);
  }, 1250);
}

function makeNextSimpleComparePair() {
  const previousRight = state.simpleCompareSmileys[1];
  const candidates = shuffle(makeAllSmileyCombinations()).filter(smiley =>
    creatorSmileyKey(smiley) !== creatorSmileyKey(previousRight)
  );
  const nextRight = candidates.find(candidate => {
    const equalCount = features.filter(feature =>
      compareFeatureValue(feature, previousRight) === compareFeatureValue(feature, candidate)
    ).length;
    return equalCount > 0 && equalCount < features.length;
  }) || candidates[0];
  return makePlayableSmileys([previousRight, nextRight]);
}

function startPermutationPhase() {
  state.phase = "permutation";
  resetMistakeCounter();
  state.nextPlacementOrder = state.smileys.length;
  els.sortTable.classList.add("hidden");
  els.orderingPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  resetCountChallenge();
  els.permutationPanel.classList.remove("hidden");
  els.trayLabel.textContent = "";
  els.tray.replaceChildren();
  setHeader("Album", `${state.permutationAlbum.length} of ${getPermutationGoal()}`);
  els.submitSortButton.classList.add("hidden");
  renderPermutationAlbum();
  renderSmileys();
}

function renderPermutationAlbum() {
  els.albumPages.replaceChildren();
  const pages = getPermutationPageCount();
  for (let page = 0; page < pages; page += 1) {
    const pageNode = document.createElement("div");
    pageNode.className = "album-page";
    const start = page * 6;
    for (let index = 0; index < 6; index += 1) {
      const slotIndex = start + index;
      const photo = state.permutationAlbum[slotIndex];
      const slot = document.createElement("div");
      slot.className = "album-photo";
      slot.dataset.photoIndex = String(slotIndex);
      slot.dataset.orderKey = photo?.key || "";
      if (photo) {
        slot.classList.add("has-photo");
        slot.setAttribute("role", "button");
        slot.tabIndex = 0;
        slot.setAttribute("aria-label", "Move this photo");
        slot.addEventListener("pointerdown", event => beginAlbumPhotoDrag(event, slot));
        photo.order.forEach(smileyId => {
          const smiley = state.smileys.find(item => item.id === smileyId);
          if (smiley) {
            const node = createSmileyNode({ ...smiley, id: `photo-${slotIndex}-${smiley.id}` });
            node.classList.add("photo-smiley");
            slot.append(node);
          }
        });
      }
      pageNode.append(slot);
    }
    els.albumPages.append(pageNode);
  }
}

function beginAlbumPhotoDrag(event, node) {
  event.preventDefault();
  if (isCelebrating()) return;
  if (state.dragging) {
    cancelActiveDrag();
  }
  const rect = node.getBoundingClientRect();
  const dragNode = node.cloneNode(true);
  node.setPointerCapture(event.pointerId);
  node.classList.add("drag-source");
  state.dragging = {
    type: "album-photo",
    node: dragNode,
    sourceNode: node,
    pointerId: event.pointerId,
    sourceIndex: Number(node.dataset.photoIndex),
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top
  };
  dragNode.style.width = `${rect.width}px`;
  dragNode.style.height = `${rect.height}px`;
  dragNode.style.left = `${rect.left}px`;
  dragNode.style.top = `${rect.top}px`;
  dragNode.classList.add("dragging");
  dragNode.classList.remove("drag-source");
  document.body.append(dragNode);
  document.addEventListener("pointermove", moveAlbumPhotoDrag);
  document.addEventListener("pointerup", endAlbumPhotoDrag);
  document.addEventListener("pointercancel", cancelAlbumPhotoDrag);
  moveAlbumPhotoDrag(event);
}

function moveAlbumPhotoDrag(event) {
  if (!state.dragging || state.dragging.type !== "album-photo") return;
  event.preventDefault();
  const { node, offsetX, offsetY } = state.dragging;
  node.style.left = `${event.clientX - offsetX}px`;
  node.style.top = `${event.clientY - offsetY}px`;
  markAlbumPhotoDropTarget(event.clientX, event.clientY);
}

function endAlbumPhotoDrag(event) {
  if (!state.dragging || state.dragging.type !== "album-photo") return;
  event.preventDefault();
  const previousRects = collectAlbumPhotoRects();
  const dragged = state.dragging;
  const rect = dragged.node.getBoundingClientRect();
  const draggedPhoto = state.permutationAlbum[dragged.sourceIndex];
  if (draggedPhoto) {
    previousRects.set(draggedPhoto.key, { left: rect.left, top: rect.top });
  }
  const target = getAlbumPhotoDropTarget(event.clientX, event.clientY);
  if (target && draggedPhoto) {
    moveAlbumPhoto(dragged.sourceIndex, Number(target.dataset.photoIndex));
  }
  cleanupAlbumPhotoDrag();
  renderPermutationAlbum();
  animateAlbumPhotosFrom(previousRects);
}

function cancelAlbumPhotoDrag() {
  const previousRects = state.dragging?.type === "album-photo"
    ? collectAlbumPhotoRects()
    : null;
  if (previousRects && state.dragging?.type === "album-photo") {
    const photo = state.permutationAlbum[state.dragging.sourceIndex];
    if (photo) {
      const rect = state.dragging.node.getBoundingClientRect();
      previousRects.set(photo.key, { left: rect.left, top: rect.top });
    }
  }
  cleanupAlbumPhotoDrag();
  renderPermutationAlbum();
  if (previousRects) {
    animateAlbumPhotosFrom(previousRects);
  }
}

function cleanupAlbumPhotoDrag() {
  if (!state.dragging || state.dragging.type !== "album-photo") return;
  const { node, sourceNode, pointerId } = state.dragging;
  if (sourceNode.hasPointerCapture(pointerId)) {
    sourceNode.releasePointerCapture(pointerId);
  }
  document.removeEventListener("pointermove", moveAlbumPhotoDrag);
  document.removeEventListener("pointerup", endAlbumPhotoDrag);
  document.removeEventListener("pointercancel", cancelAlbumPhotoDrag);
  sourceNode.classList.remove("drag-source");
  node.classList.remove("dragging");
  node.removeAttribute("style");
  node.remove();
  state.dragging = null;
  clearAlbumPhotoDropMarks();
}

function moveAlbumPhoto(sourceIndex, targetSlotIndex) {
  if (sourceIndex === targetSlotIndex) return;
  const photos = state.permutationAlbum;
  if (sourceIndex < 0 || sourceIndex >= photos.length) return;
  const [photo] = photos.splice(sourceIndex, 1);
  const targetIndex = Math.max(0, Math.min(targetSlotIndex, photos.length));
  photos.splice(targetIndex, 0, photo);
}

function collectAlbumPhotoRects() {
  const previousRects = new Map();
  els.albumPages.querySelectorAll(".album-photo.has-photo").forEach(photo => {
    const key = photo.dataset.orderKey;
    if (!key) return;
    const rect = photo.getBoundingClientRect();
    previousRects.set(key, { left: rect.left, top: rect.top });
  });
  return previousRects;
}

function animateAlbumPhotosFrom(previousRects) {
  previousRects.forEach((oldRect, key) => {
    const node = els.albumPages.querySelector(`.album-photo[data-order-key="${CSS.escape(key)}"]`);
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
      node.classList.add("album-returning");
      node.style.transform = "";
    }));
    node.addEventListener("transitionend", () => {
      node.classList.remove("album-returning");
      node.classList.remove("is-traveling");
      node.style.transition = "";
    }, { once: true });
  });
}

function markAlbumPhotoDropTarget(x, y) {
  clearAlbumPhotoDropMarks();
  const target = getAlbumPhotoDropTarget(x, y);
  if (target) {
    target.classList.add("is-over");
  }
}

function clearAlbumPhotoDropMarks() {
  els.albumPages.querySelectorAll(".album-photo").forEach(photo => photo.classList.remove("is-over"));
}

function getAlbumPhotoDropTarget(x, y) {
  const element = document.elementFromPoint(x, y);
  return element?.closest(".album-photo");
}

function capturePermutationPhoto() {
  if (state.phase !== "permutation") return;
  const ordered = getPermutationOrder();
  if (ordered.length !== state.smileys.length) {
    state.permutationHadMistake = true;
    state.permutationCleanWins = 0;
    signalIncorrect();
    return;
  }
  const key = ordered.map(smiley => smiley.id).join("|");
  const existing = state.permutationAlbum.find(photo => photo.key === key);
  if (existing) {
    state.permutationHadMistake = true;
    state.permutationCleanWins = 0;
    const photo = els.albumPages.querySelector(`.album-photo[data-order-key="${CSS.escape(key)}"]`);
    if (photo) {
      photo.classList.remove("wiggle");
      window.requestAnimationFrame(() => photo.classList.add("wiggle"));
      photo.addEventListener("animationend", () => photo.classList.remove("wiggle"), { once: true });
    }
    if (navigator.vibrate) {
      navigator.vibrate(80);
    }
    return;
  }

  state.permutationAlbum.push({ key, order: ordered.map(smiley => smiley.id) });
  renderPermutationAlbum();
  setProgress(`${state.permutationAlbum.length} of ${getPermutationGoal()}`);
  if (state.permutationAlbum.length >= getPermutationGoal()) {
    completePermutationAlbum();
  }
}

function completePermutationAlbum() {
  recordCleanProgress(!state.permutationHadMistake, "permutationCleanWins", "permutationLevel");
  resetMistakeCounter();
  window.setTimeout(() => startPermutationMission(false), 620);
}

function getPermutationOrder() {
  return state.smileys
    .filter(smiley => smiley.zone === "permutation-order")
    .sort((first, second) => first.placementOrder - second.placementOrder);
}

function getPermutationSmileyCount() {
  return 3;
}

function getPermutationGoal() {
  return factorial(getPermutationSmileyCount());
}

function getPermutationPageCount() {
  return Math.ceil(getPermutationGoal() / 6);
}

function factorial(count) {
  let total = 1;
  for (let value = 2; value <= count; value += 1) {
    total *= value;
  }
  return total;
}

function startSelectionPhase(previousRects = null) {
  state.phase = "selection";
  resetMistakeCounter();
  els.sortTable.classList.add("hidden");
  els.orderingPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  resetCountChallenge();
  els.vennPanel.classList.remove("hidden");
  els.selectionPanel.classList.remove("hidden");
  els.trayLabel.textContent = "Smileys";
  renderVennHeadlines();
  els.vennStage.classList.toggle("two-circle", state.activeVennCriteria.length <= 2);
  setHeader("Select", `${state.setCycle + 1} of ${state.reuseGoal}`);
  els.submitSortButton.textContent = "OK";
  unlockSubmitButton();
  renderSelectionHint();
  renderSmileys();
  if (previousRects) {
    animateSmileysFrom(previousRects);
  }
}

function renderSelectionHint() {
  renderSelectionCaption();
  els.selectionTargetZone.replaceChildren();
}

function renderSelectionCaption() {
  const groups = state.selectionSourceRule?.displayGroups || [];
  const icons = groups.flatMap((group, index) => {
    const groupElement = createSelectionIconGroup(group);
    if (index === 0) return [groupElement];
    return [createSelectionConnector(), groupElement];
  });

  els.selectionCaption.replaceChildren(...icons);
}

function createSelectionIconGroup(group) {
  const wrapper = document.createElement("span");
  wrapper.className = "selection-icon-group";
  group.forEach(({ feature, expected }) => {
    wrapper.append(createFeatureIcon(feature, !expected));
  });
  return wrapper;
}

function createSelectionConnector() {
  const connector = document.createElement("span");
  connector.className = "selection-connector";
  connector.textContent = "OR";
  return connector;
}

function validateSelection() {
  const selected = state.smileys.filter(smiley => smiley.zone === "selection-target");
  const expected = state.smileys.filter(smiley => matchesSelectionRule(smiley));
  const isCorrect = selected.length === expected.length &&
    selected.every(smiley => matchesSelectionRule(smiley));

  if (isCorrect) {
    recordSelectionProgress(!state.selectionHadMistake);
    resetMistakeCounter();
    finishSet(collectSmileyRects());
    return;
  }

  state.selectionHadMistake = true;
  state.selectionCleanWins = 0;
  registerMistake();
  if (state.mistakeStreak >= 2 && !state.returnAfterErrorPending) {
    state.returnAfterErrorPending = true;
    const previousRects = collectSmileyRects();
    state.smileys.forEach(smiley => {
      smiley.zone = smiley.sourceZone;
      smiley.placementOrder = smiley.originalOrder;
    });
    resetMistakeCounter();
    renderSmileys();
    animateSmileysFrom(previousRects);
  }
}

function startCreatorPhase() {
  state.phase = "creator";
  resetMistakeCounter();
  els.sortTable.classList.add("hidden");
  els.orderingPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  resetCountChallenge();
  els.creatorPanel.classList.remove("hidden");
  els.trayLabel.textContent = "Criteria";
  els.tray.replaceChildren();
  setHeader("Create", `${state.createdSmileys.length} of ${2 ** state.creatorCriteria.length}`);
  els.submitSortButton.textContent = "OK";
  unlockSubmitButton();
  renderCreator();
}

function renderCreator(newCreatedId = null) {
  setProgress(`${state.createdSmileys.length} of ${2 ** state.creatorCriteria.length}`);
  els.creatorCriteriaBank.replaceChildren(...state.creatorCriteria.map(createCreatorCriterionCard));
  els.creatorSmileyTarget.replaceChildren(createSmileyNode({ ...state.creatorCurrent, id: "creator-current" }));
  els.createdSmileys.replaceChildren(...state.createdSmileys.map(smiley => {
    const node = createSmileyNode(smiley);
    node.classList.add("created-smiley-node");
    if (smiley.id === newCreatedId) {
      node.classList.add("come-alive");
    }
    return node;
  }));
}

function createCreatorCriterionCard(feature) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "creator-criterion-card";
  card.dataset.featureKey = feature.key;
  card.setAttribute("aria-label", feature.label);
  card.append(createFeatureIcon(feature));
  card.addEventListener("click", () => {
    applyCreatorFeature(feature.key);
    renderCreator();
  });
  card.addEventListener("pointerdown", event => beginCreatorCriterionDrag(event, card));
  return card;
}

function beginCreatorCriterionDrag(event, node) {
  event.preventDefault();
  const rect = node.getBoundingClientRect();
  node.setPointerCapture(event.pointerId);
  state.dragging = {
    type: "creator-criterion",
    featureKey: node.dataset.featureKey,
    node,
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top
  };
  node.style.width = `${rect.width}px`;
  node.style.height = `${rect.height}px`;
  node.classList.add("dragging");
  document.body.append(node);
  document.addEventListener("pointermove", moveCreatorCriterionDrag);
  document.addEventListener("pointerup", endCreatorCriterionDrag);
  document.addEventListener("pointercancel", cancelCreatorCriterionDrag);
  moveCreatorCriterionDrag(event);
}

function moveCreatorCriterionDrag(event) {
  if (!state.dragging || state.dragging.type !== "creator-criterion") return;
  event.preventDefault();
  const { node, offsetX, offsetY } = state.dragging;
  node.style.left = `${event.clientX - offsetX}px`;
  node.style.top = `${event.clientY - offsetY}px`;
  els.creatorSmileyTarget.classList.toggle("is-over", isPointInsideElement(els.creatorSmileyTarget, event.clientX, event.clientY));
}

function endCreatorCriterionDrag(event) {
  if (!state.dragging || state.dragging.type !== "creator-criterion") return;
  event.preventDefault();
  if (isPointInsideElement(els.creatorSmileyTarget, event.clientX, event.clientY)) {
    applyCreatorFeature(state.dragging.featureKey);
  }
  cleanupCreatorCriterionDrag();
  renderCreator();
}

function cancelCreatorCriterionDrag() {
  cleanupCreatorCriterionDrag();
  renderCreator();
}

function cleanupCreatorCriterionDrag() {
  if (!state.dragging) return;
  const { node, pointerId } = state.dragging;
  if (node.hasPointerCapture(pointerId)) {
    node.releasePointerCapture(pointerId);
  }
  document.removeEventListener("pointermove", moveCreatorCriterionDrag);
  document.removeEventListener("pointerup", endCreatorCriterionDrag);
  document.removeEventListener("pointercancel", cancelCreatorCriterionDrag);
  node.classList.remove("dragging");
  node.removeAttribute("style");
  node.remove();
  state.dragging = null;
  els.creatorSmileyTarget.classList.remove("is-over");
}

function applyCreatorFeature(featureKey) {
  if (featureKey === "shape") state.creatorCurrent.shape = state.creatorCurrent.shape === "round" ? "square" : "round";
  if (featureKey === "color") state.creatorCurrent.color = state.creatorCurrent.color === "yellow" ? "red" : "yellow";
  if (featureKey === "expression") state.creatorCurrent.expression = state.creatorCurrent.expression === "smile" ? "neutral" : "smile";
  if (featureKey === "hat") state.creatorCurrent.hat = !state.creatorCurrent.hat;
  if (featureKey === "ears") state.creatorCurrent.ears = !state.creatorCurrent.ears;
}

function resetCreatorCurrent() {
  if (state.phase !== "creator") return;
  state.creatorCurrent = makeBaseCreatorSmiley();
  renderCreator();
}

function validateCreatorCurrent() {
  const key = creatorSmileyKey(state.creatorCurrent);
  const duplicate = state.createdSmileys.find(smiley => creatorSmileyKey(smiley) === key);
  if (duplicate) {
    const node = els.createdSmileys.querySelector(`[data-id="${duplicate.id}"]`);
    if (node) {
      node.classList.remove("jump");
      window.requestAnimationFrame(() => node.classList.add("jump"));
      node.addEventListener("animationend", () => node.classList.remove("jump"), { once: true });
    }
    return;
  }

  const newCreatedId = `created-${Date.now()}-${state.createdSmileys.length}`;
  state.createdSmileys.push({
    ...state.creatorCurrent,
    id: newCreatedId
  });
  state.creatorCurrent = makeBaseCreatorSmiley();
  renderCreator(newCreatedId);
}

function validateCreatorFinish() {
  const expectedCount = 2 ** state.creatorCriteria.length;
  if (state.createdSmileys.length >= expectedCount) {
    recordCleanProgress(!state.creatorHadMistake, "creatorCleanWins", "creatorLevel");
    finishSet(new Map());
    return;
  }
  state.creatorHadMistake = true;
  state.creatorCleanWins = 0;
  signalIncorrect();
}

function creatorSmileyKey(smiley) {
  return `${smiley.shape}|${smiley.color}|${smiley.expression}|${smiley.hat}|${smiley.ears}`;
}

function startVennPhase(previousRects = null) {
  state.phase = "venn";
  resetMistakeCounter();
  state.nextPlacementOrder = 1;
  resetVennZonesForLayout();
  state.smileys.forEach(smiley => {
    smiley.zone = "tray";
    smiley.placementOrder = smiley.originalOrder;
  });
  els.sortTable.classList.add("hidden");
  els.orderingPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  resetCountChallenge();
  els.vennPanel.classList.remove("hidden");
  els.implicitPanel.classList.add("hidden");
  els.trayLabel.textContent = "Smileys";
  els.vennStage.classList.toggle("two-circle", state.activeVennCriteria.length <= 2);
  renderVennHeadlines();
  setHeader("Circle Sort", `${state.setCycle + 1} of ${state.reuseGoal}`);
  els.submitSortButton.textContent = "OK";
  unlockSubmitButton();
  renderSmileys();
  if (previousRects) {
    animateSmileysFrom(previousRects);
  }
}

function resetVennZonesForLayout() {
  [
    els.vennAZone,
    els.vennBZone,
    els.vennCZone,
    els.vennABZone,
    els.vennACZone,
    els.vennBCZone,
    els.vennABCZone,
    els.vennOutsideZone
  ].filter(Boolean).forEach(zone => {
    zone.replaceChildren();
    zone.classList.remove("is-over", "shake", "tilt-reject");
  });
}

function startImplicitPhase(previousRects = null) {
  state.phase = "implicit";
  resetMistakeCounter();
  state.nextPlacementOrder = 1;
  resetImplicitGuessState();
  state.smileys.forEach(smiley => {
    smiley.zone = "tray";
    smiley.placementOrder = smiley.originalOrder;
  });
  els.sortTable.classList.add("hidden");
  els.orderingPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  resetCountChallenge();
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.implicitPanel.classList.remove("hidden");
  els.trayLabel.textContent = "Smileys";
  setHeader("Find the Rule", `${state.setCycle + 1} of ${state.reuseGoal}`);
  els.submitSortButton.textContent = "OK";
  unlockSubmitButton();
  renderImplicitHeadlines();
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
    if (!feature) {
      head.replaceChildren();
      head.removeAttribute("aria-label");
      return;
    }
    head.replaceChildren(createFeatureIcon(feature));
    head.setAttribute("aria-label", feature.label);
  });
}

function renderImplicitHeadlines() {
  [els.implicitAHead, els.implicitBHead].forEach((head, index) => {
    const guessedKey = state.implicitGuesses[index];
    const feature = features.find(item => item.key === guessedKey);
    head.replaceChildren();
    head.classList.toggle("has-guess", Boolean(feature));
    if (feature) {
      head.append(createFeatureIcon(feature));
      head.setAttribute("aria-label", `Hidden rule guess: ${feature.label}`);
    } else {
      const question = document.createElement("span");
      question.className = "implicit-rule-question";
      question.textContent = "?";
      head.append(question);
      head.setAttribute("aria-label", index === 0 ? "Choose left hidden rule" : "Choose right hidden rule");
    }
    const badge = document.createElement("span");
    badge.className = "implicit-rule-badge";
    badge.textContent = "?";
    badge.setAttribute("aria-hidden", "true");
    head.append(badge);
  });
  renderImplicitChoiceList();
}

function openImplicitChoiceList(index) {
  if (state.phase !== "implicit") return;
  state.implicitChoiceIndex = state.implicitChoiceIndex === index ? null : index;
  renderImplicitChoiceList();
}

function chooseImplicitGuess(featureKey) {
  if (state.phase !== "implicit" || state.implicitChoiceIndex === null) return;
  state.implicitGuesses[state.implicitChoiceIndex] = featureKey;
  state.implicitChoiceIndex = null;
  renderImplicitHeadlines();
}

function renderImplicitChoiceList() {
  if (!els.implicitChoiceList) return;
  els.implicitChoiceList.replaceChildren();
  els.implicitChoiceList.classList.toggle("hidden", state.phase !== "implicit" || state.implicitChoiceIndex === null);
  if (state.phase !== "implicit" || state.implicitChoiceIndex === null) return;

  features.forEach(feature => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "implicit-choice-button";
    button.classList.toggle("is-selected", state.implicitGuesses[state.implicitChoiceIndex] === feature.key);
    button.setAttribute("aria-label", feature.label);
    button.append(createFeatureIcon(feature));
    button.addEventListener("click", () => chooseImplicitGuess(feature.key));
    els.implicitChoiceList.append(button);
  });
}

function chooseOrderingCriteria() {
  const shuffledCriteria = shuffle([...orderingCriteria]);
  const criterionCount = getOrderingCriterionCount();
  return shuffledCriteria.slice(0, criterionCount);
}

function chooseCarrollCriteriaForSmileys(smileys, previousCriteria = []) {
  const pairs = shuffle(getFeaturePairs());
  const previousKey = getCriteriaPairKey(previousCriteria);
  return pairs.find(pair =>
    getCriteriaPairKey(pair) !== previousKey && hasAllCarrollQuadrants(smileys, pair)
  ) || pairs.find(pair => hasAllCarrollQuadrants(smileys, pair)) || pairs[0];
}

function getCriteriaPairKey(criteria) {
  if (!criteria || criteria.length < 2) return "";
  return criteria.map(feature => feature.key).sort().join("|");
}

function chooseImplicitCriteriaForSmileys(smileys) {
  const pairs = shuffle(getFeaturePairs());
  return pairs.find(pair => hasAllImplicitZones(smileys, pair)) || pairs[0];
}

function chooseVennCriteria() {
  return shuffle([...features]).slice(0, getVennCriterionCount());
}

function chooseSelectionCriteria() {
  return shuffle([...features]).slice(0, getSelectionCriterionCount());
}

function getFeaturePairs() {
  const pairs = [];
  for (let first = 0; first < features.length; first += 1) {
    for (let second = first + 1; second < features.length; second += 1) {
      pairs.push([features[first], features[second]]);
    }
  }
  return pairs;
}

function getOrderingCriterionCount() {
  return 2;
}

function getOrderingSmileyCount() {
  if (state.useNumbers) return 10;
  return 5;
}

function recordCleanProgress(clean, streakKey, levelKey) {
  if (!clean) {
    state[streakKey] = 0;
    return;
  }
  if (state[levelKey] >= 2) return;
  state[streakKey] += 1;
  if (state[streakKey] >= 3) {
    state[levelKey] = 2;
  }
}

function recordSelectionProgress(clean) {
  if (!clean) {
    state.selectionCleanWins = 0;
    return;
  }
  if (state.selectionLevel >= SELECTION_RULE_PROGRESSION.length) return;
  state.selectionCleanWins += 1;
  if (state.selectionCleanWins >= 3) {
    state.selectionLevel += 1;
    state.selectionCleanWins = 0;
  }
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
    state.orderingCleanWins = 0;
    registerMistake({ returnSmileys: true });
    return;
  }

  const isCorrect = orderedSmileys.every((smiley, index) => {
    if (index === 0) return true;
    return compareByOrderingCriteria(orderedSmileys[index - 1], smiley) <= 0;
  });

  if (isCorrect) {
    recordCleanProgress(!state.orderingHadMistake, "orderingCleanWins", "orderingLevel");
    resetMistakeCounter();
    completeMissionAfterCorrectSort();
    return;
  }

  state.orderingHadMistake = true;
  state.orderingCleanWins = 0;
  registerMistake({ returnSmileys: true });
}

function validateCarroll() {
  const allSorted = state.smileys.every(smiley => smiley.zone !== "tray");
  if (!allSorted) {
    registerMistake({ returnSmileys: true });
    return;
  }

  const isCorrect = state.smileys.every(smiley =>
    smiley.zone === getCarrollZoneForSmiley(smiley, state.activeCarrollCriteria)
  );

  if (isCorrect) {
    resetMistakeCounter();
    completeCarrollAfterCorrectSort();
    return;
  }

  registerMistake({ returnSmileys: true });
}

function completeCarrollAfterCorrectSort() {
  if (state.useNumbers) {
    startCountChallenge(buildMissionCountItems(), () => finishCarrollCycle());
    return;
  }
  finishCarrollCycle();
}

function finishCarrollCycle() {
  clearCycleTimers();
  if (shouldReuseSmileysForNextCycle("carroll")) {
    finishReusableCycle("carroll");
    return;
  }

  const nextCount = randomCountDifferentFrom(state.smileys.length);
  runNewSmileysCycleTransition(() => startCarrollMission(false, nextCount));
}

function validateVenn() {
  const allSorted = state.smileys.every(smiley => smiley.zone !== "tray");
  if (!allSorted) {
    state.vennHadMistake = true;
    state.vennCleanWins = 0;
    registerMistake({ returnSmileys: true });
    return;
  }

  const isCorrect = state.smileys.every(smiley =>
    smiley.zone === getVennZoneForSmiley(smiley, state.activeVennCriteria)
  );

  if (isCorrect) {
    recordCleanProgress(!state.vennHadMistake, "vennCleanWins", "vennLevel");
    resetMistakeCounter();
    completeMissionAfterCorrectSort();
    return;
  }

  state.vennHadMistake = true;
  state.vennCleanWins = 0;
  registerMistake({ returnSmileys: true });
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

  if (!isCorrect) {
    state.mistakeStreak += 1;
    signalIncorrect();
    return;
  }

  if (!areImplicitGuessesCorrect()) {
    tiltImplicitRuleHeads();
    return;
  }

  resetMistakeCounter();
  completeMissionAfterCorrectSort();
}

function areImplicitGuessesCorrect() {
  return state.activeImplicitCriteria.every((feature, index) =>
    state.implicitGuesses[index] === feature.key
  );
}

function tiltImplicitRuleHeads() {
  [els.implicitAHead, els.implicitBHead].forEach(head => {
    head.classList.remove("tilt-reject");
    window.requestAnimationFrame(() => head.classList.add("tilt-reject"));
    head.addEventListener("animationend", () => head.classList.remove("tilt-reject"), { once: true });
  });
  state.mistakeStreak += 1;
  if (navigator.vibrate) {
    navigator.vibrate(80);
  }
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
  const reuseSmileys = shouldReuseSmileysForNextCycle(completedMission);
  if (reuseSmileys) {
    finishReusableCycle(completedMission);
    return;
  }
  runNewSmileysCycleTransition(
    () => startNextMissionRound(completedMission),
    { animateSmileys: shouldAnimateRoomSmileys(completedMission) }
  );
}

function runNewSmileysCycleTransition(startNextRound, options = {}) {
  const animateSmileys = options.animateSmileys !== false;
  const fadeCategories = options.fadeCategories !== false;
  const exitStartDelay = animateSmileys ? CYCLE_CELEBRATION_MS : 0;
  const nextRoundDelay = exitStartDelay + (animateSmileys ? CYCLE_EXIT_MS : CYCLE_CELEBRATION_MS);

  state.phase = "celebrating";
  els.workPanel.classList.add("is-celebrating");
  if (animateSmileys) {
    els.workPanel.classList.add("smileys-wiggling");
  }
  lockSubmitButton();
  celebrateCycle(CYCLE_CELEBRATION_MS);

  if (animateSmileys) {
    scheduleCycleTimer(() => {
      els.workPanel.classList.remove("smileys-wiggling");
      els.workPanel.classList.add("smileys-exiting");
      if (fadeCategories) {
        els.workPanel.classList.add("criteria-fading-out");
      }
    }, exitStartDelay);
  }

  scheduleCycleTimer(() => {
    startNextRound();
    els.workPanel.classList.remove("is-celebrating");
    els.workPanel.classList.remove("smileys-wiggling");
    els.workPanel.classList.remove("smileys-exiting");
    els.workPanel.classList.remove("criteria-fading-out");
    if (animateSmileys) {
      els.workPanel.classList.add("cycle-fading-in");
    }
    if (fadeCategories) {
      els.workPanel.classList.add("criteria-fading-in");
    }
  }, nextRoundDelay);

  if (animateSmileys) {
    scheduleCycleTimer(() => {
      els.workPanel.classList.remove("cycle-fading-in");
      els.workPanel.classList.remove("criteria-fading-in");
    }, nextRoundDelay + CYCLE_ENTER_MS);
  } else if (fadeCategories) {
    scheduleCycleTimer(() => {
      els.workPanel.classList.remove("criteria-fading-in");
    }, nextRoundDelay + 460);
  }
}

function shouldReuseSmileysForNextCycle(mission) {
  if (mission === "compare" || mission === "simple-compare" || mission === "creator" || mission === "permutation") return false;
  return state.setCycle + 1 < state.reuseGoal;
}

function finishReusableCycle(mission) {
  const previousRects = collectSmileyRects();
  state.phase = "transitioning";
  lockSubmitButton();
  els.workPanel.classList.add("is-celebrating");
  els.workPanel.classList.add("criteria-fading-out");
  scheduleCycleTimer(() => {
    startNextCycleWithSameSmileys(mission, previousRects);
    els.workPanel.classList.remove("is-celebrating");
    els.workPanel.classList.remove("criteria-fading-out");
    els.workPanel.classList.add("criteria-fading-in");
  }, 760);
  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("criteria-fading-in");
  }, 1520);
}

function shouldAnimateRoomSmileys(mission) {
  return mission !== "creator";
}

function startNextMissionRound(completedMission) {
  const nextCount = randomCountDifferentFrom(state.requestedCount);
  if (completedMission === "ordering") {
    startOrderingMission(false, false);
  } else if (completedMission === "carroll") {
    startCarrollMission(false, nextCount);
  } else if (completedMission === "compare") {
    startCompareMission(false);
  } else if (completedMission === "simple-compare") {
    startSimpleCompareMission(false);
  } else if (completedMission === "permutation") {
    startPermutationMission(false);
  } else if (completedMission === "selection") {
    startSelectionMission(false);
  } else if (completedMission === "creator") {
    startCreatorMission(false);
  } else if (completedMission === "venn") {
    startVennMission(false, nextCount);
  } else if (completedMission === "implicit") {
    startImplicitMission(false, nextCount);
  } else {
    startSet(nextCount, false);
  }
}

function startNextCycleWithSameSmileys(mission, previousRects = null) {
  state.setCycle += 1;
  els.workPanel.classList.remove("cycle-fading-out");
  state.nextPlacementOrder = 1;
  state.smileys.forEach((smiley, index) => {
    smiley.zone = "tray";
    smiley.originalOrder = index;
    smiley.placementOrder = index;
  });

  if (mission === "feature") {
    state.featureIndex = 0;
    state.activeFeatures = chooseFeatureCycle(state.smileys, featureCountForSmileyCount(state.smileys.length));
    startFeature(previousRects);
    return;
  }

  if (mission === "ordering") {
    startOrderingPhase(previousRects);
    return;
  }

  if (mission === "carroll") {
    state.activeCarrollCriteria = chooseCarrollCriteriaForSmileys(state.smileys, state.activeCarrollCriteria);
    startCarrollPhase(previousRects);
    return;
  }

  if (mission === "selection") {
    state.activeVennCriteria = chooseSelectionCriteria();
    state.smileys.forEach(smiley => {
      const zone = getVennZoneForSmiley(smiley, state.activeVennCriteria);
      smiley.zone = zone;
      smiley.sourceZone = zone;
      smiley.placementOrder = smiley.originalOrder;
    });
    state.selectionSourceRule = chooseSelectionSourceRule();
    state.selectionSourceZone = state.selectionSourceRule.zone || null;
    state.selectionHadMistake = false;
    startSelectionPhase(previousRects);
    return;
  }

  if (mission === "venn") {
    state.activeVennCriteria = chooseVennCriteria();
    startVennPhase(previousRects);
    return;
  }

  if (mission === "implicit") {
    state.activeImplicitCriteria = chooseImplicitCriteriaForSmileys(state.smileys);
    startImplicitPhase(previousRects);
    return;
  }

  startFeature(previousRects);
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
    els.workPanel.classList.remove("smileys-exiting");
    els.workPanel.classList.remove("smileys-wiggling");
    els.workPanel.classList.remove("criteria-fading-out");
    els.workPanel.classList.remove("criteria-fading-in");
    els.workPanel.classList.remove("is-celebrating");
    els.celebration.classList.add("hidden");
  }
}

function celebrateCycle(duration = 1800) {
  els.celebration.classList.remove("hidden");
  scheduleCycleTimer(() => {
    els.celebration.classList.add("hidden");
  }, duration);
}


function randomCountDifferentFrom(previousCount) {
  let count = previousCount;
  while (count === previousCount) {
    count = state.useNumbers ? Math.floor(Math.random() * 9) + 2 : getDefaultSmileyCount();
  }
  return count;
}

function currentFeature() {
  return state.activeFeatures[state.featureIndex];
}

function getZoneElement(zone) {
  if (zone === "order") return els.orderingZone;
  if (zone === "permutation-order") return els.permutationOrderZone;
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
  if (zone === "selection-target") return els.selectionTargetZone;
  if (zone === "implicit-a") return els.implicitAZone;
  if (zone === "implicit-b") return els.implicitBZone;
  if (zone === "implicit-ab") return els.implicitABZone;
  if (zone === "implicit-outside") return els.implicitOutsideZone;
  return els.tray;
}

init();
