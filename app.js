import {
  CYCLE_CELEBRATION_MS,
  CYCLE_ENTER_MS,
  CYCLE_EXIT_MS,
  GAME_TITLE,
  SELECTION_RULE_PROGRESSION
} from "./src/core/constants.js";
import { features, orderingCriteria } from "./src/core/features.js";
import {
  featureCountForSmileyCount,
  makeAllSmileyCombinations,
  makePlayableSmileys,
  makeSmileys
} from "./src/core/smileys.js?v=room-memory-v113-20260808";
import {
  addBeardLengthCoins,
  BEARD_LEVELS,
  getBeardLabel,
  getBeardModeValue,
  makeStatisticsBeardSmileys,
  makeStatisticsCoinSmileys,
} from "./src/core/statistics.js";
import { shuffle, triadKey } from "./src/core/utils.js";
import { els, getAllDropContainers, getZoneElement } from "./src/app/elements.js?v=team-menu-fix-v248-20260831";
import { setHeader, setProgress } from "./src/app/header.js";
import { state } from "./src/app/state.js?v=team-menu-fix-v248-20260831";

const vennLightingStates = new WeakMap();
// "all" lights every region inside the hovered circle.
// Change to "separate" to light only A & ~B (or B & ~A).
const VENN_CIRCLE_BOX_LIGHT_MODE = "all";
const ROOM_EXIT_MS = 4000;
const ROOM_REORDER_MS = 760;
const SMILEY_RETURN_SETTLE_MS = 120;
const SUCCESS_SMILEY_RETURN_MS = 2400;
const AVERAGE_CELEBRATION_MS = 700;
const AVERAGE_SLIDE_MS = 1050;
const PHOTO_PREVIEW_MS = 600;
const PHOTO_RETURN_MS = 1500;
const TEAM_PROGRESSION = [[2, 3], [2, 4], [3, 4], [3, 5], [2, 5]];
const SUCCESS_CATEGORY_FADE_OUT_MS = 400;
const SUCCESS_CATEGORY_FADE_IN_MS = 440;
const CATEGORY_WIGGLE_MS = 800;
// Flip to true to restore the paired-shape same/different icons everywhere.
const USE_VISUAL_RELATION_ICONS = false;
const MUSIC_NOTES = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
let audioContext = null;
let musicTimer = null;
let musicStep = 0;
let vennLightingSequence = 0;
let carrollHighlightSequence = 0;
let carrollHighlightedZone = null;
let vennMotionLabFrame = null;
let vennMotionLabLastTime = 0;
let vennMotionLabDirection = 1;
let comparisonTutorialSequence = 0;
let lastSubmitTouchTime = 0;

function init() {
  document.documentElement.classList.toggle("visual-relation-icons", USE_VISUAL_RELATION_ICONS);
  reorderMissionMenu();
  // Keep the app usable if an older service-worker cache supplied a partial state object.
  state.rememberRoomState ??= true;
  state.enteringSmileyIds ??= [];
  state.departingSmileyIds ??= [];
  state.rememberedRooms ??= {};
  state.synchronizedCategorizationCriteria ??= [];
  state.submitMistakeStreak ??= 0;
  state.selectionTutorialSkipped ??= false;
  state.relationDisplayMode ??= "symbolic";
  ["gesturestart", "gesturechange", "gestureend"].forEach(type => {
    document.addEventListener(type, event => {
      if (state.smileyDrags.size) event.preventDefault();
    }, { passive: false });
  });
  for (let count = 2; count <= 10; count += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = count;
    button.addEventListener("click", () => startSet(count));
    els.countGrid.append(button);
  }

  els.backButton.addEventListener("click", () => showSetup());
  els.featureMissionButton.addEventListener("click", () => chooseFeatureMission());
  els.similarityMissionButton.addEventListener("click", () => startSimilarityMission());
  els.orderingMissionButton.addEventListener("click", () => startOrderingMission(true));
  els.carrollMissionButton.addEventListener("click", () => startCarrollMission());
  els.compareMissionButton.addEventListener("click", () => startCompareMission());
  els.simpleCompareMissionButton.addEventListener("click", () => startSimpleCompareMission());
  els.permutationMissionButton.addEventListener("click", () => startPermutationMission());
  els.pairCombinationMissionButton.addEventListener("click", () => startPairCombinationMission());
  els.teamMissionButton?.addEventListener("click", () => startTeamMission());
  els.selectionMissionButton.addEventListener("click", () => startSelectionMission());
  document.querySelector("#selectionSkipTutorialButton")?.addEventListener("click", toggleSelectionMode);
  els.creatorMissionButton.addEventListener("click", () => startCreatorMission());
  els.vennMissionButton.addEventListener("click", () => startVennMission());
  els.nestedMissionButton?.addEventListener("click", () => startNestedMission());
  els.countingMissionButton?.addEventListener("click", () => startCountingMission());
  els.implicitMissionButton.addEventListener("click", () => startImplicitMission());
  els.statisticsMissionButton.addEventListener("click", () => startStatisticsMission());
  (els.averageMissionButton || document.querySelector("#averageMissionButton"))?.addEventListener("click", () => startAverageMission());
  els.cameraButton.addEventListener("click", () => capturePermutationPhoto());
  els.pairCameraButton.addEventListener("click", () => capturePairCombinationPhoto());
  els.teamCameraButton?.addEventListener("click", () => captureTeamPhoto());
  els.creatorConfirmButton.addEventListener("click", () => validateCreatorCurrent());
  els.creatorResetButton.addEventListener("click", () => resetCreatorCurrent());
  els.implicitAHead.addEventListener("click", () => openImplicitChoiceList(0));
  els.implicitBHead.addEventListener("click", () => openImplicitChoiceList(1));
  setupVennLighting();
  setupRelationDisplayMode();
  setupSettingsMenu();
  setupVennMotionLab();
  if (els.newSetButton) {
    els.newSetButton.addEventListener("click", () => showSetup());
  }
  setupCopyrightDedication();
  setupCountCheckDialog();
  els.submitSortButton.addEventListener("pointerup", event => {
    if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
    event.preventDefault();
    lastSubmitTouchTime = Date.now();
    validateCurrentPhase();
  });
  els.submitSortButton.addEventListener("click", () => {
    if (Date.now() - lastSubmitTouchTime < 700) return;
    validateCurrentPhase();
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Enter" || els.workPanel.classList.contains("hidden")) return;
    if (event.target instanceof Element && event.target.closest("button, input, select, textarea")) return;
    if (isCelebrating()) return;
    event.preventDefault();
    validateCurrentPhase();
  });
}

function setupSettingsMenu() {
  const closeSettings = () => {
    els.settingsPanel.classList.add("hidden");
    els.settingsButton.setAttribute("aria-expanded", "false");
  };

  els.settingsButton.addEventListener("click", event => {
    event.stopPropagation();
    const willOpen = els.settingsPanel.classList.contains("hidden");
    els.settingsPanel.classList.toggle("hidden", !willOpen);
    els.settingsButton.setAttribute("aria-expanded", String(willOpen));
  });

  els.settingsPanel.addEventListener("click", event => event.stopPropagation());
  els.lightingSetting.addEventListener("click", () => {
    state.lightingEnabled = !state.lightingEnabled;
    syncSettingsControls();
    if (!state.lightingEnabled) {
      clearDropMarks();
      clearCarrollCrossHighlight();
    }
    refreshVennSettings();
  });
  els.popupSetting.addEventListener("click", () => {
    state.intersectionPopupsEnabled = !state.intersectionPopupsEnabled;
    syncSettingsControls();
    refreshVennSettings();
  });
  els.soundSetting.addEventListener("click", () => {
    state.soundEnabled = !state.soundEnabled;
    syncSettingsControls();
  });
  els.musicSetting.addEventListener("click", () => {
    state.musicEnabled = !state.musicEnabled;
    syncSettingsControls();
    if (state.musicEnabled) {
      startBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  });
  els.numbersSetting.addEventListener("click", () => chooseMode(!state.useNumbers));
  els.roomMemorySetting?.addEventListener("click", () => {
    state.rememberRoomState = !state.rememberRoomState;
    syncSettingsControls();
  });

  document.addEventListener("click", closeSettings);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeSettings();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopBackgroundMusic();
    } else if (state.musicEnabled) {
      startBackgroundMusic();
    }
  });
  syncSettingsControls();
}

function setupVennMotionLab() {
  if (!els.countingLabButton || !els.vennMotionLab) return;

  const positions = [
    [0.14, 0.34],
    [0.2, 0.58],
    [0.29, 0.25],
    [0.35, 0.7],
    [0.42, 0.44],
    [0.5, 0.62],
    [0.57, 0.28],
    [0.64, 0.68],
    [0.7, 0.44],
    [0.78, 0.24],
    [0.84, 0.58]
  ];

  els.vennMotionLabSmileys.replaceChildren(...positions.map(([x, y], index) => {
    const smiley = document.createElement("span");
    smiley.className = `venn-motion-lab-smiley ${index % 2 === 0 ? "is-yellow" : "is-red"}`;
    smiley.dataset.x = String(x);
    smiley.dataset.y = String(y);
    smiley.style.left = `${x * 100}%`;
    smiley.style.top = `${y * 100}%`;
    smiley.setAttribute("aria-hidden", "true");
    return smiley;
  }));

  els.countingLabButton.addEventListener("click", openVennMotionLab);
  els.vennMotionLabClose.addEventListener("click", closeVennMotionLab);
  els.vennMotionLab.addEventListener("click", event => {
    if (event.target === els.vennMotionLab) closeVennMotionLab();
  });
  els.vennMotionPlayButton.addEventListener("click", () => {
    setVennMotionLabPlaying(vennMotionLabFrame === null);
  });
  els.vennMotionDistance.addEventListener("input", () => {
    setVennMotionLabPlaying(false);
    renderVennMotionLab();
  });
  els.vennMotionSize.addEventListener("input", renderVennMotionLab);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !els.vennMotionLab.classList.contains("hidden")) {
      closeVennMotionLab();
    }
  });
  window.addEventListener("resize", () => {
    if (!els.vennMotionLab.classList.contains("hidden")) renderVennMotionLab();
  });
}

function openVennMotionLab() {
  els.vennMotionLab.classList.remove("hidden");
  els.vennMotionDistance.value = "20";
  els.vennMotionSize.value = "100";
  vennMotionLabDirection = 1;
  renderVennMotionLab();
  setVennMotionLabPlaying(true);
  els.vennMotionLabClose.focus();
}

function closeVennMotionLab() {
  setVennMotionLabPlaying(false);
  els.vennMotionLab.classList.add("hidden");
  els.countingLabButton.focus();
}

function setVennMotionLabPlaying(playing) {
  if (vennMotionLabFrame !== null) {
    window.cancelAnimationFrame(vennMotionLabFrame);
    vennMotionLabFrame = null;
  }
  vennMotionLabLastTime = 0;
  els.vennMotionPlayButton.classList.toggle("is-playing", playing);
  els.vennMotionPlayButton.setAttribute("aria-pressed", String(playing));
  els.vennMotionPlayButton.setAttribute("aria-label", playing ? "Pause circle movement" : "Play circle movement");
  if (playing) {
    vennMotionLabFrame = window.requestAnimationFrame(advanceVennMotionLab);
  }
}

function advanceVennMotionLab(timestamp) {
  if (vennMotionLabLastTime === 0) vennMotionLabLastTime = timestamp;
  const elapsed = Math.min(64, timestamp - vennMotionLabLastTime);
  vennMotionLabLastTime = timestamp;
  let value = Number(els.vennMotionDistance.value) + (vennMotionLabDirection * elapsed * 0.0125);
  if (value >= 100) {
    value = 100;
    vennMotionLabDirection = -1;
  } else if (value <= 0) {
    value = 0;
    vennMotionLabDirection = 1;
  }
  els.vennMotionDistance.value = String(value);
  renderVennMotionLab();
  vennMotionLabFrame = window.requestAnimationFrame(advanceVennMotionLab);
}

function renderVennMotionLab() {
  const stage = els.vennMotionLabStage;
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  if (!width || !height) return;

  const closeness = Number(els.vennMotionDistance.value) / 100;
  const greenScale = Number(els.vennMotionSize.value) / 100;
  const blueDiameter = Math.min(height * 0.8, width * 0.5);
  const greenDiameter = blueDiameter * greenScale;
  const maximumDistance = Math.max(0, width - blueDiameter - 38);
  const centerDistance = maximumDistance * (1 - closeness);
  const centerY = height * 0.5;
  const centerA = { x: (width / 2) - (centerDistance / 2), y: centerY, radius: blueDiameter / 2 };
  const centerB = { x: (width / 2) + (centerDistance / 2), y: centerY, radius: greenDiameter / 2 };

  positionVennMotionCircle(els.vennMotionLabCircleA, centerA);
  positionVennMotionCircle(els.vennMotionLabCircleB, centerB);

  let aOnly = 0;
  let bOnly = 0;
  let both = 0;
  [...els.vennMotionLabSmileys.children].forEach(smiley => {
    const x = Number(smiley.dataset.x) * width;
    const y = Number(smiley.dataset.y) * height;
    const inA = Math.hypot(x - centerA.x, y - centerA.y) <= centerA.radius;
    const inB = Math.hypot(x - centerB.x, y - centerB.y) <= centerB.radius;
    smiley.classList.toggle("is-a-only", inA && !inB);
    smiley.classList.toggle("is-b-only", inB && !inA);
    smiley.classList.toggle("is-both", inA && inB);
    smiley.classList.toggle("is-outside", !inA && !inB);
    if (inA && inB) both += 1;
    else if (inA) aOnly += 1;
    else if (inB) bOnly += 1;
  });

  updateVennMotionCount(els.vennMotionCountA, aOnly, "Blue only");
  updateVennMotionCount(els.vennMotionCountBoth, both, "Both circles");
  updateVennMotionCount(els.vennMotionCountB, bOnly, "Green only");
}

function positionVennMotionCircle(circle, geometry) {
  circle.style.width = `${geometry.radius * 2}px`;
  circle.style.height = `${geometry.radius * 2}px`;
  circle.style.left = `${geometry.x - geometry.radius}px`;
  circle.style.top = `${geometry.y - geometry.radius}px`;
}

function updateVennMotionCount(node, value, label) {
  node.textContent = String(value);
  node.setAttribute("aria-label", `${label}: ${value}`);
}

function getAudioContext() {
  if (audioContext) return audioContext;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext = new AudioContextClass();
  return audioContext;
}

function playInteractionSound(type) {
  if (!state.soundEnabled) return;
  const context = getAudioContext();
  if (!context) return;

  const play = () => {
    if (!state.soundEnabled || context.state !== "running") return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const sounds = {
      pickup: { from: 330, to: 520, duration: 0.11, volume: 0.055, wave: "triangle" },
      drop: { from: 270, to: 175, duration: 0.16, volume: 0.07, wave: "sine" },
      remove: { from: 190, to: 330, duration: 0.14, volume: 0.055, wave: "triangle" },
      mark: { from: 560, to: 430, duration: 0.09, volume: 0.045, wave: "square" },
      unmark: { from: 420, to: 540, duration: 0.08, volume: 0.038, wave: "triangle" },
      return: { from: 310, to: 210, duration: 0.13, volume: 0.045, wave: "triangle" }
    };
    const sound = sounds[type] || sounds.return;

    oscillator.type = sound.wave;
    oscillator.frequency.setValueAtTime(sound.from, now);
    oscillator.frequency.exponentialRampToValueAtTime(sound.to, now + sound.duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(sound.volume, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + sound.duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + sound.duration + 0.02);
  };

  if (context.state === "suspended") {
    context.resume().then(play).catch(() => {});
  } else {
    play();
  }
}

function playBackgroundNote() {
  if (!state.musicEnabled || !audioContext || audioContext.state !== "running") return;

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(MUSIC_NOTES[musicStep % MUSIC_NOTES.length], now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.026, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.54);
  musicStep += 1;
}

function startBackgroundMusic() {
  if (!state.musicEnabled || musicTimer !== null) return;
  const context = getAudioContext();
  if (!context) return;

  const begin = () => {
    if (!state.musicEnabled || musicTimer !== null) return;
    playBackgroundNote();
    musicTimer = window.setInterval(playBackgroundNote, 620);
  };

  if (context.state === "suspended") {
    context.resume().then(begin).catch(() => {});
  } else {
    begin();
  }
}

function stopBackgroundMusic() {
  if (musicTimer !== null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
}

function syncSettingsControls() {
  [
    [els.lightingSetting, state.lightingEnabled],
    [els.popupSetting, state.intersectionPopupsEnabled],
    [els.soundSetting, state.soundEnabled],
    [els.musicSetting, state.musicEnabled],
    [els.numbersSetting, state.useNumbers],
    [els.roomMemorySetting, state.rememberRoomState]
  ].forEach(([button, enabled]) => {
    if (!button) return;
    button.setAttribute("aria-checked", String(enabled));
    button.classList.toggle("is-on", enabled);
  });
  document.documentElement.classList.toggle("layout-lighting-off", !state.lightingEnabled);
}

function refreshVennSettings() {
  [els.vennStage, els.implicitStage, els.countingStage].forEach(stage => {
    const lighting = vennLightingStates.get(stage);
    if (lighting) renderVennLighting(lighting);
  });
}

function setupCopyrightDedication() {
  const dedication = document.querySelector("#copyrightDedication");
  if (!dedication) return;

  dedication.addEventListener("click", event => {
    event.stopPropagation();
    dedication.classList.toggle("is-open");
  });

  document.addEventListener("click", event => {
    if (event.target instanceof Node && dedication.contains(event.target)) return;
    dedication.classList.remove("is-open");
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      dedication.classList.remove("is-open");
    }
  });
}

function setupVennLighting() {
  [
    { stage: els.vennStage, zoneSelector: ".venn-zone", zonePrefix: "venn-" },
    { stage: els.implicitStage, zoneSelector: ".implicit-zone", zonePrefix: "implicit-" },
    { stage: els.countingStage, zoneSelector: ".counting-clue", zonePrefix: "counting-" }
  ].forEach(config => setupVennLightingStage(config));
}

function setupVennLightingStage({ stage, zoneSelector, zonePrefix }) {
  if (!stage) return;

  const areaOverlay = createVennAreaOverlay(`venn-area-${vennLightingSequence += 1}`);
  stage.prepend(areaOverlay.svg);
  const lighting = {
    stage,
    circles: [...stage.querySelectorAll("[data-venn-circle]")],
    heads: [...stage.querySelectorAll("[data-venn-category]")],
    zones: [...stage.querySelectorAll(zoneSelector)],
    areaOverlay,
    zoneSelector,
    zonePrefix,
    hover: null,
    focus: null,
    pinned: null
  };
  vennLightingStates.set(stage, lighting);

  lighting.heads.forEach(head => {
    const descriptor = { type: "circle", key: head.dataset.vennCategory };
    head.addEventListener("focus", () => setVennLightingPreview(lighting, "focus", descriptor));
    head.addEventListener("blur", () => clearVennLightingPreview(lighting, "focus", descriptor));
    head.addEventListener("click", event => {
      event.stopPropagation();
      if (event.detail > 0) lighting.hover = descriptor;
      togglePinnedVennLighting(lighting, descriptor);
    });
  });

  lighting.zones.forEach(zone => {
    const descriptor = {
      type: "region",
      key: zone.dataset.zone?.replace(zonePrefix, "") || "outside"
    };
    zone.addEventListener("focusin", () => setVennLightingPreview(lighting, "focus", descriptor));
    zone.addEventListener("focusout", event => {
      if (event.relatedTarget instanceof Node && zone.contains(event.relatedTarget)) return;
      clearVennLightingPreview(lighting, "focus", descriptor);
    });
    zone.addEventListener("click", event => {
      if (event.target instanceof Element && event.target.closest(".smiley")) return;
      event.stopPropagation();
      if (event.detail > 0) lighting.hover = descriptor;
      togglePinnedVennLighting(lighting, descriptor);
    });
  });

  stage.addEventListener("pointerover", event => updateVennLightingHover(lighting, event.target));
  stage.addEventListener("pointermove", event => updateVennLightingHover(lighting, event.target));
  stage.addEventListener("pointerleave", () => {
    if (!lighting.hover) return;
    lighting.hover = null;
    renderVennLighting(lighting);
  });
  stage.addEventListener("click", event => {
    if (event.target !== stage) return;
    lighting.pinned = null;
    renderVennLighting(lighting);
  });

  if ("ResizeObserver" in window) {
    lighting.resizeObserver = new ResizeObserver(() => {
      const preview = lighting.hover || lighting.focus || lighting.pinned;
      const activeRegion = state.lightingEnabled && preview?.type === "region" ? preview.key : null;
      const popupRegion = state.intersectionPopupsEnabled && preview?.type === "region" ? preview.key : null;
      renderVennAreaOverlay(lighting, activeRegion);
      renderVennIntersectionPopup(lighting, popupRegion);
    });
    lighting.resizeObserver.observe(stage);
  }

  renderVennLighting(lighting);
}

function createVennAreaOverlay(id) {
  const svg = createSvgElement("svg");
  svg.classList.add("venn-area-overlay");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("preserveAspectRatio", "none");

  const defs = createSvgElement("defs");
  const mask = createSvgElement("mask");
  mask.id = `${id}-mask`;
  mask.setAttribute("maskUnits", "userSpaceOnUse");
  mask.setAttribute("maskContentUnits", "userSpaceOnUse");
  mask.setAttribute("mask-type", "luminance");
  defs.append(mask);

  const fill = createSvgElement("rect");
  fill.classList.add("venn-area-fill");
  fill.setAttribute("mask", `url(#${mask.id})`);
  svg.append(defs, fill);
  return { svg, defs, mask, fill, id };
}

function createSvgElement(tagName) {
  return document.createElementNS("http://www.w3.org/2000/svg", tagName);
}

function createSvgRect(width, height, fill) {
  const rect = createSvgElement("rect");
  rect.setAttribute("x", "0");
  rect.setAttribute("y", "0");
  rect.setAttribute("width", String(width));
  rect.setAttribute("height", String(height));
  rect.setAttribute("fill", fill);
  return rect;
}

function createSvgCircle(circle, fill) {
  const node = createSvgElement("circle");
  node.setAttribute("cx", String(circle.x));
  node.setAttribute("cy", String(circle.y));
  node.setAttribute("r", String(circle.radius));
  node.setAttribute("fill", fill);
  return node;
}

function updateVennLightingHover(lighting, target) {
  const descriptor = getVennLightingDescriptorForTarget(lighting, target);
  if (!descriptor || matchesVennLighting(lighting.hover, descriptor)) return;
  lighting.hover = descriptor;
  renderVennLighting(lighting);
}

function getVennLightingDescriptorForTarget(lighting, target) {
  if (!(target instanceof Element)) return null;
  const head = target.closest("[data-venn-category]");
  if (head && lighting.stage.contains(head)) {
    return { type: "circle", key: head.dataset.vennCategory };
  }
  const zone = target.closest(lighting.zoneSelector);
  if (zone && lighting.stage.contains(zone)) {
    return {
      type: "region",
      key: zone.dataset.zone?.replace(lighting.zonePrefix, "") || "outside"
    };
  }
  return null;
}

function setVennLightingPreview(lighting, previewType, descriptor) {
  lighting[previewType] = descriptor;
  renderVennLighting(lighting);
}

function clearVennLightingPreview(lighting, previewType, descriptor) {
  if (!matchesVennLighting(lighting[previewType], descriptor)) return;
  lighting[previewType] = null;
  renderVennLighting(lighting);
}

function togglePinnedVennLighting(lighting, descriptor) {
  if (!matchesVennLighting(lighting.focus, descriptor)) {
    lighting.focus = null;
  }
  lighting.pinned = matchesVennLighting(lighting.pinned, descriptor) ? null : descriptor;
  renderVennLighting(lighting);
}

function matchesVennLighting(first, second) {
  return Boolean(first && second && first.type === second.type && first.key === second.key);
}

function renderVennLighting(lighting) {
  const preview = lighting.hover || lighting.focus || lighting.pinned;
  const active = state.lightingEnabled ? preview : null;
  const activeCircle = active?.type === "circle" ? active.key : null;
  const activeRegion = active?.type === "region" ? active.key : null;
  const popupRegion = state.intersectionPopupsEnabled && preview?.type === "region"
    ? preview.key
    : null;

  lighting.stage.classList.toggle("has-venn-light", Boolean(active));
  lighting.stage.classList.toggle("has-venn-circle-light", Boolean(activeCircle));
  lighting.stage.classList.toggle("has-venn-region-light", Boolean(activeRegion));

  lighting.circles.forEach(circle => {
    const key = circle.dataset.vennCircle;
    circle.classList.toggle("is-venn-circle-lit", activeCircle === key);
  });

  lighting.heads.forEach(head => {
    const descriptor = { type: "circle", key: head.dataset.vennCategory };
    head.classList.toggle("is-venn-category-lit", matchesVennLighting(active, descriptor));
    head.classList.toggle("is-venn-pinned", matchesVennLighting(lighting.pinned, descriptor));
    head.setAttribute("aria-pressed", String(matchesVennLighting(lighting.pinned, descriptor)));
  });

  lighting.zones.forEach(zone => {
    const descriptor = {
      type: "region",
      key: zone.dataset.zone?.replace(lighting.zonePrefix, "") || "outside"
    };
    const belongsToActiveCircle = shouldLightVennZoneForCircle(descriptor.key, activeCircle);
    zone.classList.toggle("is-venn-circle-zone-lit", belongsToActiveCircle);
    zone.classList.toggle("is-venn-region-lit", matchesVennLighting(active, descriptor));
    zone.classList.toggle("is-venn-pinned", matchesVennLighting(lighting.pinned, descriptor));
  });

  renderVennAreaOverlay(lighting, activeRegion);
  renderVennIntersectionPopup(lighting, popupRegion);
}

function shouldLightVennZoneForCircle(zoneKey, circleKey) {
  if (!circleKey || zoneKey === "outside") return false;
  return VENN_CIRCLE_BOX_LIGHT_MODE === "all"
    ? zoneKey.includes(circleKey)
    : zoneKey === circleKey;
}

function renderVennIntersectionPopup(lighting, activeRegion) {
  const popup = els.vennIntersectionPopup;
  if (!popup || lighting.stage !== els.vennStage) return;

  const criteria = activeRegion && activeRegion !== "outside"
    ? [...activeRegion]
      .map(letter => state.activeVennCriteria[letter.charCodeAt(0) - 97])
      .filter(Boolean)
    : [];
  const zone = lighting.zones.find(item =>
    item.dataset.zone === `${lighting.zonePrefix}${activeRegion}`
  );

  if (criteria.length < 2 || !zone || getComputedStyle(zone).display === "none") {
    popup.classList.add("hidden");
    popup.replaceChildren();
    popup.removeAttribute("aria-label");
    return;
  }

  popup.replaceChildren(createCombinedCategoryIcon(criteria));
  popup.setAttribute("aria-label", criteria.map(feature => feature.label).join(" and "));
  popup.classList.remove("hidden");

  const stageRect = lighting.stage.getBoundingClientRect();
  const zoneRect = zone.getBoundingClientRect();
  popup.style.left = `${zoneRect.left - stageRect.left + (zoneRect.width / 2)}px`;
  popup.style.top = `${Math.max(12, zoneRect.top - stageRect.top - 86)}px`;
}

function renderVennAreaOverlay(lighting, activeRegion) {
  const { svg, defs, mask, fill, id } = lighting.areaOverlay;
  if (!activeRegion) {
    svg.classList.remove("is-visible");
    return;
  }

  const overlayRect = svg.getBoundingClientRect();
  if (!overlayRect.width || !overlayRect.height) {
    svg.classList.remove("is-visible");
    return;
  }

  const circles = lighting.circles
    .filter(circle => getComputedStyle(circle).display !== "none")
    .map(circle => {
      const rect = circle.getBoundingClientRect();
      const borderWidth = Number.parseFloat(getComputedStyle(circle).borderLeftWidth) || 0;
      return {
        key: circle.dataset.vennCircle,
        x: rect.left - overlayRect.left + (rect.width / 2),
        y: rect.top - overlayRect.top + (rect.height / 2),
        radius: Math.max(0, (Math.min(rect.width, rect.height) / 2) - (borderWidth / 2))
      };
    })
    .filter(circle => circle.key && circle.radius > 0);
  const circleByKey = new Map(circles.map(circle => [circle.key, circle]));

  svg.setAttribute("viewBox", `0 0 ${overlayRect.width} ${overlayRect.height}`);
  fill.setAttribute("x", "0");
  fill.setAttribute("y", "0");
  fill.setAttribute("width", String(overlayRect.width));
  fill.setAttribute("height", String(overlayRect.height));

  [...defs.querySelectorAll("clipPath")].forEach(clip => clip.remove());
  circles.forEach(circle => {
    const clip = createSvgElement("clipPath");
    clip.id = `${id}-clip-${circle.key}`;
    clip.setAttribute("clipPathUnits", "userSpaceOnUse");
    clip.append(createSvgCircle(circle, "#ffffff"));
    defs.insertBefore(clip, mask);
  });

  mask.replaceChildren(createSvgRect(
    overlayRect.width,
    overlayRect.height,
    activeRegion === "outside" ? "#ffffff" : "#000000"
  ));

  if (activeRegion === "outside") {
    circles.forEach(circle => mask.append(createSvgCircle(circle, "#000000")));
  } else {
    const includedKeys = [...activeRegion].filter(key => circleByKey.has(key));
    if (!includedKeys.length) {
      svg.classList.remove("is-visible");
      return;
    }

    let parent = mask;
    includedKeys.slice(0, -1).forEach(key => {
      const clippedGroup = createSvgElement("g");
      clippedGroup.setAttribute("clip-path", `url(#${id}-clip-${key})`);
      parent.append(clippedGroup);
      parent = clippedGroup;
    });
    parent.append(createSvgCircle(circleByKey.get(includedKeys[includedKeys.length - 1]), "#ffffff"));

    circles
      .filter(circle => !includedKeys.includes(circle.key))
      .forEach(circle => mask.append(createSvgCircle(circle, "#000000")));
  }

  const activeZone = lighting.zones.find(zone =>
    (zone.dataset.zone?.replace(lighting.zonePrefix, "") || "outside") === activeRegion
  );
  const regionColor = activeZone
    ? getComputedStyle(activeZone).getPropertyValue("--venn-region-rgb").trim()
    : "222, 184, 72";
  fill.setAttribute("fill", `rgb(${regionColor})`);
  fill.setAttribute("fill-opacity", activeRegion.length === 1 || activeRegion === "outside" ? "0.3" : "0.34");
  svg.classList.add("is-visible");
}

function clearVennLighting(stage) {
  const lighting = vennLightingStates.get(stage);
  if (!lighting) return;
  lighting.hover = null;
  lighting.focus = null;
  lighting.pinned = null;
  renderVennLighting(lighting);
}

function chooseFeatureMission() {
  startSet(6);
}

function chooseMode(useNumbers) {
  state.useNumbers = useNumbers;
  syncSettingsControls();
  if (!els.workPanel.classList.contains("hidden")) resetCountChallenge();
}

function startSet(count, clearPendingTimers = true) {
  const rememberedSmileys = clearPendingTimers ? getRememberedRoom("feature", count) : [];
  const previousSmileys = !clearPendingTimers && state.mission === "feature" ? state.smileys : rememberedSmileys;
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
  state.smileys = rememberedSmileys.length
    ? restoreRoomSmileys(rememberedSmileys)
    : makeRoomAwareSmileys(previousSmileys, count, featureCount);
  state.activeFeatures = chooseFeatureCycle(state.smileys, featureCount);
  state.setCycle = 0;
  state.reuseGoal = getReuseGoal("feature");
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeVennCriteria = [];
  state.activeImplicitCriteria = [];
  state.countingChallenge = null;
  state.countingAnswer = null;
  state.countingHadMistake = false;
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
  const rememberedSmileys = clearPendingTimers ? getRememberedRoom("ordering", getOrderingSmileyCount()) : [];
  const previousSmileys = !clearPendingTimers && state.mission === "ordering" ? state.smileys : rememberedSmileys;
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
  state.smileys = rememberedSmileys.length
    ? restoreRoomSmileys(rememberedSmileys)
    : makeRoomAwareSmileys(previousSmileys, smileyCount, featureCountForSmileyCount(smileyCount));
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

function startSimilarityMission(clearPendingTimers = true) {
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "similarity";
  state.requestedCount = 3;
  state.phase = "similarity";
  state.smileys = [];
  state.similarityChallenge = makeSimilarityChallenge();
  state.similaritySelectedIndex = null;
  state.activeFeatures = [];
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeVennCriteria = [];
  state.activeImplicitCriteria = [];
  resetCompareState();
  state.countChallenge = null;
  resetMistakeCounter();
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  startSimilarityPhase();
}

function startStatisticsMission(clearPendingTimers = true) {
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "statistics";
  state.requestedCount = 7;
  state.phase = "statistics";
  state.statisticsStep = "beard-frequency";
  state.statisticsQuestionIndex = 0;
  state.statisticsAnswer = null;
  state.statisticsHadMistake = false;
  state.statisticsCoins = [];
  state.statisticsCoinStep = "average-question";
  state.statisticsCoinsDistributed = false;
  state.statisticsWeightedChallenge = null;
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  state.smileys = makeStatisticsBeardSmileys(state.requestedCount);
  state.activeFeatures = [];
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeVennCriteria = [];
  state.activeImplicitCriteria = [];
  resetCompareState();
  state.countChallenge = null;
  resetMistakeCounter();
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  startStatisticsPhase();
}

function startAverageMission(clearPendingTimers = true) {
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "average";
  state.requestedCount = 3 + Math.floor(Math.random() * 8);
  state.phase = "statistics";
  state.statisticsStep = "average-only";
  state.statisticsQuestionIndex = 0;
  state.statisticsAnswer = null;
  state.statisticsHadMistake = false;
  state.statisticsCoins = [];
  state.statisticsCoinStep = "average-question";
  state.statisticsCoinsDistributed = false;
  state.statisticsWeightedChallenge = null;
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  state.smileys = makeStatisticsCoinSmileys(state.requestedCount);
  initializeAverageOnlyCoins();
  state.activeFeatures = [];
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeVennCriteria = [];
  state.activeImplicitCriteria = [];
  resetCompareState();
  state.countChallenge = null;
  resetMistakeCounter();
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  startStatisticsPhase();
}

function startCarrollMission(clearPendingTimers = true, count = getDefaultSmileyCount()) {
  const rememberedSmileys = clearPendingTimers ? getRememberedRoom("carroll", count) : [];
  const synchronizedCriteria = getSynchronizedCategorizationCriteria();
  const previousSmileys = !clearPendingTimers && state.mission === "carroll" ? state.smileys : rememberedSmileys;
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "carroll";
  state.requestedCount = count;
  state.phase = "carroll";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  const setup = rememberedSmileys.length
    ? { smileys: restoreRoomSmileys(rememberedSmileys), criteria: synchronizedCriteria.length === 2 ? synchronizedCriteria : chooseCarrollCriteriaForSmileys(rememberedSmileys, []) }
    : makeCarrollSet(state.requestedCount, previousSmileys);
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

function reorderMissionMenu() {
  const missionGrid = document.querySelector(".mission-grid");
  if (!missionGrid) return;
  [
    "featureMissionButton",
    "carrollMissionButton",
    "simpleCompareMissionButton",
    "compareMissionButton",
    "vennMissionButton",
    "selectionMissionButton",
    "implicitMissionButton",
    "countingMissionButton",
    "permutationMissionButton",
    "pairCombinationMissionButton",
    "teamMissionButton",
    "creatorMissionButton",
    "similarityMissionButton",
    "orderingMissionButton",
    "averageMissionButton",
    "statisticsMissionButton",
    "nestedMissionButton"
  ].forEach(id => {
    const button = document.getElementById(id);
    if (button) missionGrid.append(button);
  });
}

function startPairCombinationMission(clearPendingTimers = true) {
  if (clearPendingTimers) clearCycleTimers();
  els.workPanel.classList.remove("cycle-fading-out");
  state.pairCombinationGroupSizes = shuffle([[2, 2], [2, 3], [3, 2]])[0];
  const count = getPairCombinationSmileyCount();
  state.mission = "pair-combination";
  state.requestedCount = count;
  state.phase = "pair-combination";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  state.smileys = makeSmileys(count, featureCountForSmileyCount(count));
  state.smileys.forEach((smiley, index) => {
    smiley.pairSource = index < state.pairCombinationGroupSizes[0] ? "a" : "b";
    smiley.zone = `pair-source-${smiley.pairSource}`;
    smiley.originalOrder = index;
    smiley.placementOrder = index;
  });
  state.pairCombinationAlbum = [];
  state.pairCombinationHadMistake = false;
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
  startPairCombinationPhase();
}

function startTeamMission(clearPendingTimers = true, advance = false) {
  if (clearPendingTimers) {
    clearCycleTimers();
    state.teamLevel = 0;
  } else if (advance) {
    state.teamLevel = (state.teamLevel + 1) % TEAM_PROGRESSION.length;
  }
  const [teamSize, poolSize] = TEAM_PROGRESSION[state.teamLevel];
  const previousIds = new Set(state.smileys.map(smiley => smiley.id));
  state.mission = "team";
  state.phase = "team";
  state.requestedCount = poolSize;
  state.nextPlacementOrder = poolSize;
  state.smileys = clearPendingTimers
    ? makeSmileys(poolSize, featureCountForSmileyCount(poolSize))
    : resizeTeamPool(poolSize);
  state.enteringSmileyIds = clearPendingTimers
    ? []
    : state.smileys.filter(smiley => !previousIds.has(smiley.id)).map(smiley => smiley.id);
  state.smileys.forEach((smiley, index) => {
    smiley.zone = "team-source";
    smiley.originalOrder = index;
    smiley.placementOrder = index;
  });
  state.teamAlbum = [];
  state.teamHadMistake = false;
  resetMistakeCounter();
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden", "cycle-fading-out");
  els.backButton.classList.remove("hidden");
  startTeamPhase();
}

function resizeTeamPool(poolSize) {
  const current = [...state.smileys].sort((first, second) => first.originalOrder - second.originalOrder);
  if (current.length >= poolSize) return current.slice(0, poolSize);

  const used = new Set(current.map(smileyCombinationKey));
  const additions = shuffle(makeAllSmileyCombinations())
    .filter(smiley => !used.has(smileyCombinationKey(smiley)))
    .slice(0, poolSize - current.length)
    .map((smiley, index) => ({
      ...smiley,
      id: `team-smiley-${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`
    }));
  return [...current, ...additions];
}

function startSelectionMission(clearPendingTimers = true, count = getDefaultSmileyCount()) {
  count = Math.min(7, count);
  const rememberedSmileys = clearPendingTimers ? getRememberedRoom("selection", count) : [];
  const synchronizedCriteria = getSynchronizedCategorizationCriteria();
  const previousSmileys = !clearPendingTimers && state.mission === "selection" ? state.smileys : rememberedSmileys;
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "selection";
  state.requestedCount = count;
  state.phase = "selection";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  const setup = rememberedSmileys.length
    ? { smileys: restoreRoomSmileys(rememberedSmileys), criteria: synchronizedCriteria.length === 2 ? synchronizedCriteria : shuffle([...features]).slice(0, getSelectionCriterionCount()) }
    : makeVennSetForCount(getSelectionCriterionCount(), state.requestedCount, previousSmileys);
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
    state.creatorRound = 0;
    state.creatorEarlyThreeRound = 2 + Math.floor(Math.random() * 2);
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "creator";
  state.requestedCount = 0;
  state.phase = "creator";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  state.smileys = [];
  state.creatorRound += 1;
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
  count = Math.min(7, count);
  const rememberedSmileys = clearPendingTimers ? getRememberedRoom("venn", count) : [];
  const synchronizedCriteria = getSynchronizedCategorizationCriteria();
  const previousSmileys = !clearPendingTimers && state.mission === "venn" ? state.smileys : rememberedSmileys;
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "venn";
  state.requestedCount = count;
  state.phase = "venn";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  const setup = rememberedSmileys.length
    ? { smileys: restoreRoomSmileys(rememberedSmileys), criteria: synchronizedCriteria.length === 2 ? synchronizedCriteria : shuffle([...features]).slice(0, getVennCriterionCount()) }
    : makeVennSet(state.requestedCount, previousSmileys);
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

function startNestedMission(clearPendingTimers = true, count = getDefaultSmileyCount()) {
  count = Math.min(7, Math.max(5, count));
  const rememberedSmileys = clearPendingTimers ? getRememberedRoom("nested", count) : [];
  const previousSmileys = !clearPendingTimers && state.mission === "nested" ? state.smileys : rememberedSmileys;
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "nested";
  state.requestedCount = count;
  state.phase = "nested";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  const setup = rememberedSmileys.length
    ? { smileys: restoreRoomSmileys(rememberedSmileys), criteria: chooseNestedCriteriaForSmileys(rememberedSmileys, []) }
    : makeNestedSet(state.requestedCount, previousSmileys);
  state.smileys = setup.smileys;
  state.setCycle = 0;
  state.reuseGoal = getReuseGoal("nested");
  state.activeFeatures = [];
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeVennCriteria = [];
  state.activeNestedCriteria = setup.criteria;
  state.activeImplicitCriteria = [];
  resetCompareState();
  state.countChallenge = null;
  resetMistakeCounter();
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  startNestedPhase();
}

function startCountingMission(clearPendingTimers = true) {
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "counting";
  state.phase = "counting";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  state.countingSequence = makeCountingSequence();
  const setup = makeCountingSet(state.countingSequence[0]);
  state.requestedCount = setup.smileys.length;
  state.smileys = setup.smileys;
  state.activeFeatures = [];
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeVennCriteria = setup.criteria;
  state.activeImplicitCriteria = [];
  state.countingChallenge = setup.challenge;
  state.countingAnswer = null;
  state.countingHadMistake = false;
  state.countingLastVariant = setup.challenge.variant;
  resetImplicitGuessState();
  resetCompareState();
  resetSelectionState();
  resetCreatorState();
  state.countChallenge = null;
  state.setCycle = 0;
  state.reuseGoal = 3;
  resetMistakeCounter();
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  startCountingPhase();
}

function startImplicitMission(clearPendingTimers = true, count = getDefaultSmileyCount()) {
  count = Math.min(7, count);
  const rememberedSmileys = clearPendingTimers ? getRememberedRoom("implicit", count) : [];
  const previousSmileys = !clearPendingTimers && state.mission === "implicit" ? state.smileys : rememberedSmileys;
  if (clearPendingTimers) {
    clearCycleTimers();
  }
  els.workPanel.classList.remove("cycle-fading-out");
  state.mission = "implicit";
  state.requestedCount = count;
  state.phase = "implicit";
  state.featureIndex = 0;
  state.nextPlacementOrder = 1;
  const setup = rememberedSmileys.length
    ? { smileys: restoreRoomSmileys(rememberedSmileys), criteria: chooseImplicitCriteriaForSmileys(rememberedSmileys) }
    : makeImplicitSet(state.requestedCount, previousSmileys);
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
  rememberCurrentRoom();
  clearCycleTimers();
  closeCountCheckDialog();
  clearInlineCountPrompts();
  els.celebration.classList.add("hidden");
  els.workPanel.classList.remove(
    "is-celebrating",
    "smileys-wiggling",
    "smileys-exiting",
    "smileys-returning-home",
    "criteria-fading-out",
    "criteria-fading-in",
    "cycle-fading-in",
    "selection-rule-wiggling",
    "selection-rule-fading-out",
    "selection-rule-fading-in",
    "selection-rule-held-hidden",
    "selection-venn-fading-out",
    "selection-venn-fading-in",
    "selection-venn-wiggling",
    "selection-box-highlight"
  );
  els.similarityPanel.classList.add("hidden");
  els.nestedPanel.classList.add("hidden");
  state.smileys = [];
  state.activeFeatures = [];
  state.activeOrderingCriteria = [];
  state.activeCarrollCriteria = [];
  state.activeVennCriteria = [];
  state.activeNestedCriteria = [];
  state.activeImplicitCriteria = [];
  resetImplicitGuessState();
  resetCompareState();
  resetSimpleCompareState();
  state.similarityChallenge = null;
  state.similaritySelectedIndex = null;
  resetSelectionState();
  resetCreatorState();
  resetPermutationState();
  state.countChallenge = null;
  state.mission = "feature";
  state.orderingLevel = 1;
  state.vennLevel = 1;
  state.selectionLevel = 1;
  state.selectionTutorialSkipped = false;
  state.creatorLevel = 1;
  state.permutationLevel = 1;
  state.countingLevel = 1;
  state.countingSequence = [];
  state.countingLastVariant = null;
  state.statisticsStep = "beard-frequency";
  state.statisticsQuestionIndex = 0;
  state.statisticsAnswer = null;
  state.statisticsHadMistake = false;
  state.statisticsCoins = [];
  state.statisticsCoinStep = "average-question";
  state.statisticsCoinsDistributed = false;
  state.statisticsWeightedChallenge = null;
  state.orderingHadMistake = false;
  state.vennHadMistake = false;
  state.orderingCleanWins = 0;
  state.vennCleanWins = 0;
  state.selectionCleanWins = 0;
  state.creatorCleanWins = 0;
  state.creatorRound = 0;
  state.creatorEarlyThreeRound = 2;
  state.permutationCleanWins = 0;
  state.phase = "setup";
  state.featureIndex = 0;
  els.workPanel.classList.add("hidden");
  els.statisticsPanel.classList.add("hidden");
  els.countingPanel?.classList.add("hidden");
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
  els.statisticsPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  els.countingPanel?.classList.add("hidden");
  els.trayLabel.textContent = "";
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

function createCombinedCategoryIcon(criteria) {
  const combinedIcon = document.createElement("span");
  combinedIcon.className = `combined-category-icon combined-category-${criteria.length}`;
  combinedIcon.setAttribute("aria-hidden", "true");

  criteria.forEach(feature => {
    const part = createFeatureIcon(feature);
    part.classList.add("combined-category-part", `combined-category-part-${feature.icon}`);
    combinedIcon.classList.add(`has-${feature.icon}`);
    combinedIcon.append(part);
  });

  return combinedIcon;
}

function getDefaultSmileyCount() {
  if (state.useNumbers) return 10;
  return 5 + Math.floor(Math.random() * 3);
}

function getReuseGoal(mission = state.mission) {
  return mission === "feature" ? 1 : 3;
}

function makeRoomAwareSmileys(previousSmileys, count, featureCount, validator = () => true) {
  const previousIds = new Set(previousSmileys.map(smiley => smiley.id));
  const smileys = state.rememberRoomState && previousSmileys.length
    ? evolveSmileys(previousSmileys, count, featureCount, validator)
    : makeSmileys(count, featureCount);
  state.enteringSmileyIds = smileys.filter(smiley => !previousIds.has(smiley.id)).map(smiley => smiley.id);
  return smileys;
}

function rememberCurrentRoom() {
  if (!state.rememberRoomState || !state.mission || !state.smileys.length) return;
  state.rememberedRooms[state.mission] = restoreRoomSmileys(state.smileys);
  if (["carroll", "venn", "selection"].includes(state.mission)) {
    state.rememberedRooms.categorization = restoreRoomSmileys(state.smileys);
    const criteria = state.mission === "carroll" ? state.activeCarrollCriteria : state.activeVennCriteria;
    state.synchronizedCategorizationCriteria = criteria.slice(0, 2).map(feature => feature.key);
  }
}

function getRememberedRoom(mission, count) {
  if (!state.rememberRoomState) return [];
  const sharedMission = ["carroll", "venn", "selection"].includes(mission);
  const room = (sharedMission && state.rememberedRooms.categorization)
    || state.rememberedRooms[mission]
    || [];
  return room.length === count ? room : [];
}

function getSynchronizedCategorizationCriteria() {
  return (state.synchronizedCategorizationCriteria || [])
    .map(key => features.find(feature => feature.key === key))
    .filter(Boolean)
    .slice(0, 2);
}

function restoreRoomSmileys(smileys) {
  return [...smileys]
    .sort((first, second) => (first.originalOrder ?? 0) - (second.originalOrder ?? 0))
    .map((smiley, index) => ({
      ...smiley,
      zone: "tray",
      originalOrder: index,
      placementOrder: index
    }));
}

function evolveSmileys(previousSmileys, count, featureCount, validator = () => true) {
  if (!previousSmileys?.length) return makeSmileys(count, featureCount);
  const orderedPrevious = [...previousSmileys].sort((first, second) =>
    (first.originalOrder ?? first.placementOrder ?? 0) - (second.originalOrder ?? second.placementOrder ?? 0)
  );
  const plannedDepartures = new Set(state.departingSmileyIds);
  const plannedKept = orderedPrevious.filter(smiley => !plannedDepartures.has(smiley.id));
  const plannedAdditionCount = count - plannedKept.length;
  const canUsePlannedDepartures = plannedDepartures.size >= 1
    && plannedDepartures.size <= 4
    && plannedAdditionCount >= 1
    && plannedAdditionCount <= 4;
  const minimumKept = Math.max(0, previousSmileys.length - 4, count - 4);
  const maximumKept = Math.min(previousSmileys.length - 1, count - 1);
  if (minimumKept > maximumKept) return makeSmileys(count, featureCount);

  for (let attempt = 0; attempt < 1200; attempt += 1) {
    const keptCount = canUsePlannedDepartures
      ? plannedKept.length
      : minimumKept + Math.floor(Math.random() * (maximumKept - minimumKept + 1));
    const keptIds = canUsePlannedDepartures
      ? new Set(plannedKept.map(smiley => smiley.id))
      : new Set(shuffle([...orderedPrevious]).slice(0, keptCount).map(smiley => smiley.id));
    const kept = orderedPrevious.filter(smiley => keptIds.has(smiley.id));
    const used = new Set(kept.map(smileyCombinationKey));
    const additions = shuffle(makeAllSmileyCombinations())
      .filter(smiley => !used.has(smileyCombinationKey(smiley)))
      .slice(0, count - keptCount)
      .map((smiley, index) => ({
        ...smiley,
        id: `smiley-evolved-${Date.now()}-${attempt}-${index}-${Math.random().toString(36).slice(2)}`
      }));
    // Existing characters keep their relative places; newcomers join at the end.
    const evolved = [...kept, ...additions].map((smiley, index) => ({
      ...smiley,
      zone: "tray",
      originalOrder: index,
      placementOrder: index
    }));
    const uniqueTriads = new Set(features.map(feature => triadForFeature(evolved, feature))).size;
    if (uniqueTriads >= featureCount && validator(evolved)) return evolved;
  }
  return makeSmileys(count, featureCount);
}

function smileyCombinationKey(smiley) {
  return [smiley.shape, smiley.color, smiley.expression, smiley.hat, smiley.ears].join("|");
}

function makeCarrollSet(count = getDefaultSmileyCount(), previousSmileys = []) {
  for (let attempt = 0; attempt < 600; attempt += 1) {
    const criteria = shuffle([...features]).slice(0, 2);
    const smileys = makeRoomAwareSmileys(
      previousSmileys,
      count,
      featureCountForSmileyCount(count),
      candidate => hasAllCarrollQuadrants(candidate, criteria)
    );
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

function makeVennSet(count = getDefaultSmileyCount(), previousSmileys = []) {
  return makeVennSetForCount(getVennCriterionCount(), count, previousSmileys);
}

function makeNestedSet(count = getDefaultSmileyCount(), previousSmileys = []) {
  const criteria = shuffle(getFeaturePairs())[0];
  if (state.rememberRoomState && previousSmileys.length) {
    return {
      smileys: makeRoomAwareSmileys(
        previousSmileys,
        count,
        featureCountForSmileyCount(count),
        candidate => new Set(candidate.map(smiley => getNestedZoneForSmiley(smiley, criteria))).size === 3
      ),
      criteria
    };
  }
  const allSmileys = shuffle(makeAllSmileyCombinations());
  const zoneOrder = ["nested-inner", "nested-outer", "nested-outside"];
  const selected = zoneOrder.map(zone =>
    allSmileys.find(smiley => getNestedZoneForSmiley(smiley, criteria) === zone)
  ).filter(Boolean);

  shuffle(allSmileys).forEach(smiley => {
    if (selected.length >= count) return;
    if (!selected.includes(smiley)) selected.push(smiley);
  });

  return {
    smileys: makePlayableSmileys(shuffle(selected.slice(0, count))),
    criteria
  };
}

function makeVennSetForCount(criterionCount, count = getDefaultSmileyCount(), previousSmileys = []) {
  const criteria = shuffle([...features]).slice(0, criterionCount);
  if (state.rememberRoomState && previousSmileys.length) {
    return {
      smileys: makeRoomAwareSmileys(previousSmileys, count, featureCountForSmileyCount(count)),
      criteria
    };
  }
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

function makeCountingSet(challenge = makeCountingChallenge()) {
  const selected = shuffle(makeAllSmileyCombinations()).slice(0, challenge.union);
  return {
    smileys: makePlayableSmileys(shuffle(selected)),
    criteria: [],
    challenge
  };
}

function makeCountingSequence() {
  return makeCountingOverlapSequence();
}

function makeCountingOverlapSequence() {
  const step = Math.random() < 0.5 ? 1 : 2;
  const firstIntersection = step === 1 && Math.random() < 0.5 ? 2 : 1;
  const intersections = [
    firstIntersection,
    firstIntersection + step,
    firstIntersection + (step * 2)
  ];
  const union = step === 1 && Math.random() < 0.5 ? 6 : 7;
  const swapSides = Math.random() < 0.5;
  const challenges = intersections.map(intersection => {
    const sideOnlyTotal = union - intersection;
    const smallerSide = Math.floor(sideOnlyTotal / 2);
    const largerSide = sideOnlyTotal - smallerSide;
    const aOnly = swapSides ? largerSide : smallerSide;
    const bOnly = swapSides ? smallerSide : largerSide;
    return makeCountingChallengeFromTotals({
      leftTotal: aOnly + intersection,
      rightTotal: bOnly + intersection,
      intersection,
      pattern: "partial-overlap",
      geometry: "standard",
      sequenceType: "overlap",
      step
    });
  });
  return Math.random() < 0.5 ? challenges : challenges.reverse();
}

function makeCountingChallengeFromTotals({
  leftTotal,
  rightTotal,
  intersection,
  pattern,
  geometry,
  sequenceType,
  step = null
}) {
  const aOnly = leftTotal - intersection;
  const bOnly = rightTotal - intersection;
  const union = aOnly + bOnly + intersection;
  const variant = "circle-totals";
  return {
    aOnly,
    bOnly,
    intersection,
    union,
    leftTotal,
    rightTotal,
    mode: "find-intersection",
    variant,
    pattern,
    geometry,
    sequenceType,
    step,
    answerChoices: []
  };
}

function makeCountingChallenge() {
  const pattern = "partial-overlap";
  const intersection = 1 + Math.floor(Math.random() * 3);
  const aOnlyMax = Math.min(3, 6 - intersection);
  const aOnly = 1 + Math.floor(Math.random() * aOnlyMax);
  const bOnlyMax = Math.min(3, 7 - intersection - aOnly);
  const bOnly = 1 + Math.floor(Math.random() * bOnlyMax);

  const union = aOnly + bOnly + intersection;
  const leftTotal = aOnly + intersection;
  const rightTotal = bOnly + intersection;
  const variant = "circle-totals";
  const mode = "find-intersection";
  const expected = intersection;
  const answerChoices = variant === "parts" ? getCountingAnswerChoices(expected) : [];
  return {
    aOnly,
    bOnly,
    intersection,
    union,
    leftTotal,
    rightTotal,
    mode,
    variant,
    pattern,
    geometry: "standard",
    answerChoices
  };
}

function chooseSelectionSourceZone() {
  const zones = getVennZoneKeys().filter(zone =>
    state.smileys.some(smiley => smiley.sourceZone === zone)
  );
  return shuffle(zones)[0] || "venn-outside";
}

function chooseSelectionSourceRule() {
  const configuredMode = state.selectionTutorialSkipped
    ? "random"
    : SELECTION_RULE_PROGRESSION[Math.min(
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

function makeSimilarityChallenge() {
  const target = shuffle(makeAllSmileyCombinations())[0];
  const featureKeys = shuffle(["shape", "color", "expression", "hat", "ears"]);
  const closeCandidate = featureKeys
    .slice(0, 1)
    .reduce((smiley, featureKey) => toggleSimilarityFeature(smiley, featureKey), { ...target });
  const farCandidate = featureKeys
    .slice(0, 3)
    .reduce((smiley, featureKey) => toggleSimilarityFeature(smiley, featureKey), { ...target });
  const choices = shuffle([
    { smiley: closeCandidate, distance: 1 },
    { smiley: farCandidate, distance: 3 }
  ]);
  const playable = makePlayableSmileys([target, ...choices.map(choice => choice.smiley)]);
  return {
    target: playable[0],
    candidates: playable.slice(1),
    correctIndex: choices.findIndex(choice => choice.distance === 1)
  };
}

function toggleSimilarityFeature(smiley, featureKey) {
  if (featureKey === "shape") {
    return { ...smiley, shape: smiley.shape === "round" ? "square" : "round" };
  }
  if (featureKey === "color") {
    return { ...smiley, color: smiley.color === "yellow" ? "red" : "yellow" };
  }
  if (featureKey === "expression") {
    return { ...smiley, expression: smiley.expression === "smile" ? "neutral" : "smile" };
  }
  return { ...smiley, [featureKey]: !smiley[featureKey] };
}

function chooseCreatorCriteria() {
  if (state.creatorRound === 1) {
    return shuffle([...features]).slice(0, 2);
  }
  const needsThreeCriteria = state.creatorRound === state.creatorEarlyThreeRound;
  const criterionCount = (needsThreeCriteria || Math.random() < 0.5) ? 3 : 2;
  return shuffle([...features]).slice(0, criterionCount);
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

function makeImplicitSet(count = getDefaultSmileyCount(), previousSmileys = []) {
  for (let attempt = 0; attempt < 600; attempt += 1) {
    const criteria = shuffle([...features]).slice(0, 2);
    const smileys = makeRoomAwareSmileys(
      previousSmileys,
      count,
      featureCountForSmileyCount(count),
      candidate => hasAllImplicitZones(candidate, criteria)
    );
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
  const excludedIds = new Set([
    ...[...state.smileyDrags.values()].map(drag => drag.id),
    ...(excludedId ? [excludedId] : [])
  ]);
  cleanupStrandedDragNodes();
  els.pairCombinationPanel?.classList.toggle("hidden", state.phase !== "pair-combination");
  els.teamPanel?.classList.toggle("hidden", state.phase !== "team");
  getAllDropContainers().forEach(zone => zone.replaceChildren());
  getSmileysInRenderOrder().forEach(smiley => {
    if (excludedIds.has(smiley.id)) {
      if (smiley.zone === "order" || smiley.zone === "permutation-order" || smiley.zone === "statistics-order") {
        getZoneElement(smiley.zone).append(createOrderPlaceholder());
      }
      return;
    }
    const node = createSmileyNode(smiley);
    getZoneElement(smiley.zone).append(node);
  });
  if (!excludedId && state.phase === "statistics" && ["beard-ranking", "ranking-questions", "coins"].includes(state.statisticsStep)) {
    renderStatisticsRankSlots();
  }
  if (!excludedId && state.phase === "statistics" && state.statisticsStep === "coins") {
    renderStatisticsCoins();
  }
  if (!excludedId && state.phase === "statistics" && state.statisticsStep === "average-only") {
    renderAverageOnlySmileyCoins();
  }
  if (!excludedId && state.phase === "counting") {
    renderCounting();
  }
  if (!excludedId && state.phase === "pair-combination") {
    updatePairCombinationCameraState();
  }
  if (!excludedId && state.phase === "team") updateTeamCameraState();
}

function createOrderPlaceholder() {
  const placeholder = document.createElement("span");
  placeholder.className = "smiley-placeholder";
  placeholder.setAttribute("aria-hidden", "true");
  return placeholder;
}

function cleanupStrandedDragNodes() {
  if (state.dragging || state.smileyDrags.size) return;
  document.querySelectorAll("body > .smiley.dragging").forEach(node => node.remove());
}

function getSmileysInRenderOrder() {
  return [...state.smileys].sort((first, second) => {
    const firstZoneRank = zoneRank(first.zone);
    const secondZoneRank = zoneRank(second.zone);
    if (firstZoneRank !== secondZoneRank) {
      return firstZoneRank - secondZoneRank;
    }
    const firstOrder = first.placementOrder;
    const secondOrder = second.placementOrder;
    return firstOrder - secondOrder;
  });
}

function zoneRank(zone) {
  if (zone === "tray") return 0;
  if (zone.startsWith("statistics-beard")) return 1;
  if (zone === "statistics-order") return 2;
  if (zone === "with") return 1;
  if (zone === "without") return 2;
  if (zone.startsWith("carroll")) return 3;
  if (zone.startsWith("venn")) return 4;
  if (zone.startsWith("nested")) return 4;
  if (zone.startsWith("counting")) return 5;
  if (zone.startsWith("implicit")) return 6;
  if (zone === "selection-target") return 6;
  if (zone === "permutation-order") return 7;
  if (zone === "team-source") return 7;
  if (zone === "team-capture") return 8;
  return 3;
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
  node.classList.toggle("counting-dull", state.phase === "counting");
  node.classList.toggle("is-cycle-entering", state.enteringSmileyIds?.includes(smiley.id) === true);
  if (state.phase === "team" && smiley.zone === "team-source") {
    const [teamSize] = TEAM_PROGRESSION[state.teamLevel];
    node.disabled = getCurrentTeam().length >= teamSize;
  }
  if (Number.isInteger(smiley.beardLevel)) {
    node.classList.add("has-beard", `beard-${smiley.beardLevel}`);
    const beard = document.createElement("span");
    beard.className = "beard";
    node.append(beard);
  }
  node.addEventListener("pointerdown", event => beginDrag(event, node));
  return node;
}

function createStaticSmileyNode(smiley) {
  const source = createSmileyNode(smiley);
  const visual = document.createElement("span");
  visual.className = `${source.className} similarity-smiley`;
  visual.setAttribute("aria-hidden", "true");
  visual.append(...[...source.children].map(child => child.cloneNode(true)));
  return visual;
}

function describeSmiley(smiley) {
  const shape = smiley.shape === "round" ? "round" : "square";
  const color = smiley.color;
  const expression = smiley.expression === "smile" ? "smiling" : "neutral";
  const hat = smiley.hat ? "with hat" : "without hat";
  const ears = smiley.ears ? "with ears" : "without ears";
  const beard = Number.isInteger(smiley.beardLevel) ? `, ${getBeardLabel(smiley.beardLevel)}` : "";
  const coins = Number.isInteger(smiley.coins) ? `, ${smiley.coins} coins` : "";
  return `${shape}, ${color}, ${expression}, ${hat}, ${ears}${beard}${coins}`;
}

function beginDrag(event, node) {
  event.preventDefault();
  if (isCelebrating()) return;
  if (state.phase === "transitioning") return;
  if (state.phase === "team") {
    const smiley = state.smileys.find(item => item.id === node.dataset.id);
    const [teamSize] = TEAM_PROGRESSION[state.teamLevel];
    if (smiley?.zone === "team-source" && getCurrentTeam().length >= teamSize) return;
  }
  if (state.phase === "implicit" && state.implicitDemoInProgress) return;
  if (state.phase === "statistics" && state.statisticsStep === "average-only") {
    beginAverageSmileyDrag(event, node);
    return;
  }
  if (state.phase === "statistics" && state.statisticsStep === "coins") return;
  if (state.dragging) {
    cancelActiveDrag();
  }
  const dragLimit = state.phase === "selection" && isSelectionPlayMode()
    ? Number.POSITIVE_INFINITY
    : isGuidedSelectionRound()
      ? 1
      : 4;
  if (state.smileyDrags.size >= dragLimit || [...state.smileyDrags.values()].some(drag => drag.id === node.dataset.id)) return;
  cleanupStrandedDragNodes();
  playInteractionSound("pickup");
  const previousRects = collectSmileyRects();
  const rect = node.getBoundingClientRect();
  node.setPointerCapture(event.pointerId);
  const drag = {
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
  state.smileyDrags.set(event.pointerId, drag);
  node.style.width = `${rect.width}px`;
  node.style.height = `${rect.height}px`;
  node.classList.add("dragging");
  prepareTouchDragLift(node, event);
  document.body.append(node);
  document.addEventListener("pointermove", moveDrag);
  document.addEventListener("pointerup", endDrag);
  document.addEventListener("pointercancel", cancelDrag);
  moveDrag(event);
  animateSmileysFrom(previousRects, node.dataset.id, "fast");
}

function cancelActiveDrag() {
  if (state.smileyDrags.size) cancelDrag();
  if (!state.dragging) return;
  if (state.dragging.type === "average-smiley") {
    cancelAverageSmileyDrag();
    return;
  }
  if (state.dragging.type === "statistics-coin") {
    cancelStatisticsCoinDrag();
    return;
  }
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

function beginAverageSmileyDrag(event, smileyNode) {
  if (state.dragging || state.smileyDrags.size) {
    cancelActiveDrag();
  }
  const pair = smileyNode.closest(".average-pair");
  const smiley = state.smileys.find(item => item.id === smileyNode.dataset.id);
  if (!pair || !smiley) return;

  playInteractionSound("pickup");
  const rect = pair.getBoundingClientRect();
  const placeholder = document.createElement("div");
  placeholder.className = "average-drop-placeholder";
  placeholder.setAttribute("aria-hidden", "true");
  placeholder.style.height = `${rect.height}px`;
  pair.before(placeholder);
  document.body.append(pair);
  smileyNode.setPointerCapture(event.pointerId);
  state.dragging = {
    type: "average-smiley",
    id: smiley.id,
    node: pair,
    captureNode: smileyNode,
    placeholder,
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    originalPlacementOrder: smiley.placementOrder
  };
  pair.style.width = `${rect.width}px`;
  pair.style.height = `${rect.height}px`;
  pair.classList.add("dragging-average-pair");
  document.addEventListener("pointermove", moveAverageSmileyDrag);
  document.addEventListener("pointerup", endAverageSmileyDrag);
  document.addEventListener("pointercancel", cancelAverageSmileyDrag);
  moveAverageSmileyDrag(event);
}

function moveAverageSmileyDrag(event) {
  if (!state.dragging || state.dragging.type !== "average-smiley") return;
  event.preventDefault();
  const { node, offsetX, offsetY, placeholder } = state.dragging;
  node.style.left = `${event.clientX - offsetX}px`;
  node.style.top = `${event.clientY - offsetY}px`;
  els.tray.classList.toggle("is-over", isPointInsideElement(els.tray, event.clientX, event.clientY));

  if (!isPointInsideElement(els.tray, event.clientX, event.clientY)) return;
  const rows = [...els.tray.querySelectorAll(".average-pair")];
  const closest = rows
    .map((row, index) => {
      const rect = row.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      return {
        index,
        row,
        rect,
        distance: Math.hypot(event.clientX - centerX, event.clientY - centerY)
      };
    })
    .sort((first, second) => first.distance - second.distance)[0];
  if (!closest) {
    els.tray.append(placeholder);
    return;
  }
  const centerX = closest.rect.left + closest.rect.width / 2;
  const centerY = closest.rect.top + closest.rect.height / 2;
  const sameVisualRow = Math.abs(event.clientY - centerY) <= closest.rect.height / 2;
  const insertAfter = sameVisualRow ? event.clientX > centerX : event.clientY > centerY;
  const nextRow = rows[closest.index + (insertAfter ? 1 : 0)];
  els.tray.insertBefore(placeholder, nextRow || null);
}

function endAverageSmileyDrag(event) {
  if (!state.dragging || state.dragging.type !== "average-smiley") return;
  event.preventDefault();
  const smiley = state.smileys.find(item => item.id === state.dragging.id);
  const placed = Boolean(smiley && isPointInsideElement(els.tray, event.clientX, event.clientY));
  if (placed) {
    const insertIndex = [...els.tray.children].indexOf(state.dragging.placeholder);
    const ordered = state.smileys
      .filter(item => item.id !== smiley.id)
      .sort((first, second) => first.placementOrder - second.placementOrder);
    ordered.splice(Math.max(0, insertIndex), 0, smiley);
    ordered.forEach((item, index) => {
      item.placementOrder = index;
    });
  }
  playInteractionSound(placed ? "drop" : "return");
  cleanupAverageSmileyDrag();
  renderSmileys();
}

function cancelAverageSmileyDrag() {
  if (!state.dragging || state.dragging.type !== "average-smiley") return;
  cleanupAverageSmileyDrag();
  renderSmileys();
}

function cleanupAverageSmileyDrag() {
  if (!state.dragging || state.dragging.type !== "average-smiley") return;
  const { node, captureNode, placeholder, pointerId } = state.dragging;
  if (captureNode.hasPointerCapture(pointerId)) {
    captureNode.releasePointerCapture(pointerId);
  }
  document.removeEventListener("pointermove", moveAverageSmileyDrag);
  document.removeEventListener("pointerup", endAverageSmileyDrag);
  document.removeEventListener("pointercancel", cancelAverageSmileyDrag);
  placeholder.remove();
  node.remove();
  els.tray.classList.remove("is-over");
  state.dragging = null;
}

function moveDrag(event) {
  const drag = state.smileyDrags.get(event.pointerId);
  if (!drag) return;
  event.preventDefault();
  const { node, offsetX, offsetY } = drag;
  node.style.left = `${event.clientX - offsetX}px`;
  node.style.top = `${event.clientY - offsetY}px`;
  const resolvedDrop = resolveDraggedSmileyDrop(drag, event.clientX, event.clientY);
  markDropTarget(resolvedDrop.target);
  previewOrderingDrag(drag, resolvedDrop.x, resolvedDrop.y);
}

function isGuidedSelectionRound() {
  return state.phase === "selection"
    && !state.selectionTutorialSkipped
    && ["and", "or"].includes(state.selectionSourceRule?.type);
}

function toggleSelectionMode() {
  if (state.phase !== "selection") return;
  const enterPlayMode = !isSelectionPlayMode();
  state.selectionTutorialSkipped = enterPlayMode;
  state.selectionLevel = enterPlayMode ? SELECTION_RULE_PROGRESSION.length : 1;
  state.selectionCleanWins = 0;
  const previousRects = collectSmileyRects();
  state.smileys.forEach(smiley => {
    smiley.zone = smiley.sourceZone;
    smiley.placementOrder = smiley.originalOrder;
  });
  state.selectionSourceRule = chooseSelectionSourceRule();
  state.selectionSourceZone = state.selectionSourceRule.zone || null;
  renderSelectionHint();
  renderSmileys();
  animateSmileysFrom(previousRects, null, "fast");
}

function isSelectionPlayMode() {
  return state.selectionTutorialSkipped || state.selectionLevel >= SELECTION_RULE_PROGRESSION.length;
}

function getDraggedSmileyCenter(drag, fallbackX, fallbackY) {
  const rect = drag?.node?.getBoundingClientRect();
  if (!rect) return { x: fallbackX, y: fallbackY };
  return {
    x: rect.left + (rect.width / 2),
    y: rect.top + (rect.height / 2)
  };
}

function resolveDraggedSmileyDrop(drag, pointerX, pointerY) {
  const smileyPosition = getDraggedSmileyCenter(drag, pointerX, pointerY);
  const smileyTarget = getDropTarget(smileyPosition.x, smileyPosition.y);
  const pointerTarget = getDropTarget(pointerX, pointerY);
  if (smileyTarget) {
    return {
      target: smileyTarget,
      x: smileyPosition.x,
      y: smileyPosition.y
    };
  }
  return {
    target: pointerTarget,
    x: pointerX,
    y: pointerY
  };
}

function prepareTouchDragLift(node, event) {
  if (event.pointerType !== "touch") return;
  node.classList.add("touch-dragging");
  node.style.setProperty("--touch-drag-lift", "0px");
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
    if (node.isConnected && node.classList.contains("dragging")) {
      node.style.setProperty("--touch-drag-lift", "-56px");
    }
  }));
}

function endDrag(event) {
  const drag = state.smileyDrags.get(event.pointerId);
  if (!drag) return;
  event.preventDefault();
  const previousRects = collectSmileyRects();
  const resolvedDrop = resolveDraggedSmileyDrop(drag, event.clientX, event.clientY);
  const dropZone = resolvedDrop.target;
  const carrollDropZone = state.phase === "carroll" && dropZone?.classList.contains("carroll-zone")
    ? dropZone.dataset.zone
    : null;
  const smiley = state.smileys.find(item => item.id === drag.id);
  if (dropZone && smiley && shouldRejectGuidedSelectionDrop(smiley, dropZone.dataset.zone)) {
    const returnRects = new Map([[smiley.id, drag.node.getBoundingClientRect()]]);
    restoreDraggedSmiley(smiley, drag);
    cleanupDrag(drag);
    renderSmileys();
    renderSelectionFeedback();
    animateSmileysFrom(returnRects, null, "fast");
    markRejectedSmiley(smiley.id);
    state.selectionHadMistake = true;
    playInteractionSound("return");
    return;
  }
  if (dropZone && smiley && shouldRejectPairCombinationDrop(smiley, dropZone.dataset.zone)) {
    const returnRects = new Map([[smiley.id, drag.node.getBoundingClientRect()]]);
    restoreDraggedSmiley(smiley, drag);
    cleanupDrag(drag);
    renderSmileys();
    animateSmileysFrom(returnRects, null, "fast");
    markRejectedSmiley(smiley.id);
    state.pairCombinationHadMistake = true;
    playInteractionSound("return");
    return;
  }
  if (dropZone && smiley && shouldRejectTeamDrop(smiley, dropZone.dataset.zone)) {
    const returnRects = new Map([[smiley.id, drag.node.getBoundingClientRect()]]);
    restoreDraggedSmiley(smiley, drag);
    cleanupDrag(drag);
    renderSmileys();
    animateSmileysFrom(returnRects, null, "fast");
    markRejectedSmiley(smiley.id);
    state.teamHadMistake = true;
    playInteractionSound("return");
    return;
  }
  if (dropZone && smiley && shouldRejectImplicitDrop(smiley, dropZone.dataset.zone)) {
    const returnRects = new Map([[smiley.id, drag.node.getBoundingClientRect()]]);
    restoreDraggedSmiley(smiley, drag);
    cleanupDrag(drag);
    renderSmileys();
    animateSmileysFrom(returnRects, null, "fast");
    markRejectedSmiley(smiley.id);
    playInteractionSound("return");
    return;
  }
  if (dropZone && smiley) {
    moveSmileyToZone(smiley, dropZone.dataset.zone, resolvedDrop.x, resolvedDrop.y);
  } else if (smiley) {
    restoreDraggedSmiley(smiley, drag);
  }
  playInteractionSound(dropZone && smiley ? "drop" : "return");
  cleanupDrag(drag);
  renderSmileys();
  if (state.phase === "selection") renderSelectionFeedback();
  animateSmileysFrom(previousRects, null, "fast");
  if (carrollDropZone) {
    pulseCarrollCrossHighlight(carrollDropZone);
  }
}

function shouldRejectGuidedSelectionDrop(smiley, zone) {
  return isGuidedSelectionRound()
    && state.selectionSourceRule?.type === "or"
    && zone === "selection-target"
    && !matchesSelectionRule(smiley);
}

function shouldRejectPairCombinationDrop(smiley, zone) {
  if (state.phase !== "pair-combination") return false;
  if (zone === "pair-capture") {
    return state.smileys.some(item =>
      item.id !== smiley.id &&
      item.zone === "pair-capture" &&
      item.pairSource === smiley.pairSource
    );
  }
  if (zone?.startsWith("pair-source-")) {
    return zone !== `pair-source-${smiley.pairSource}`;
  }
  return false;
}

function shouldRejectTeamDrop(smiley, zone) {
  if (state.phase !== "team") return false;
  if (!["team-source", "team-capture"].includes(zone)) return true;
  const [teamSize] = TEAM_PROGRESSION[state.teamLevel];
  return zone === "team-capture" && smiley.zone !== "team-capture" && getCurrentTeam().length >= teamSize;
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
  if (zone === "order" || zone === "permutation-order" || zone === "statistics-order") {
    moveSmileyToOrder(smiley, x, y);
    return;
  }
  const originalZone = smiley.zone;
  const zoneElement = getZoneElement(zone);
  const insertIndex = getZoneInsertIndex(zoneElement, x, y);
  const zoneSmileys = state.smileys
    .filter(item => item.id !== smiley.id && item.zone === zone)
    .sort((first, second) => first.placementOrder - second.placementOrder);
  smiley.zone = zone;
  zoneSmileys.splice(insertIndex, 0, smiley);
  zoneSmileys.forEach((item, index) => {
    item.placementOrder = index;
  });
  if (originalZone !== zone) {
    state.smileys
      .filter(item => item.zone === originalZone)
      .sort((first, second) => first.placementOrder - second.placementOrder)
      .forEach((item, index) => {
        item.placementOrder = index;
      });
  }
  state.nextPlacementOrder = Math.max(state.nextPlacementOrder, zoneSmileys.length);
}

function getZoneInsertIndex(zoneElement, x, y) {
  if (!zoneElement || x === null || y === null) return zoneElement?.children.length || 0;
  const nodes = [...zoneElement.querySelectorAll(":scope > .smiley")];
  for (let index = 0; index < nodes.length; index += 1) {
    const rect = nodes[index].getBoundingClientRect();
    const rowCenter = rect.top + (rect.height / 2);
    const itemCenter = rect.left + (rect.width / 2);
    if (y < rect.top || (Math.abs(y - rowCenter) <= rect.height / 2 && x < itemCenter)) {
      return index;
    }
  }
  return nodes.length;
}

function moveSmileyToOrder(smiley, x, y) {
  const orderZone = getActiveOrderZone();
  const orderZoneKey = getActiveOrderZoneKey();
  if (state.phase === "statistics") {
    moveSmileyToStatisticsOrder(smiley, x, y);
    return;
  }
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

function moveSmileyToStatisticsOrder(smiley, x, y) {
  const insertIndex = getOrderInsertIndex(x, y);
  const occupied = state.smileys.some(item =>
    item.id !== smiley.id &&
    item.zone === "statistics-order" &&
    item.placementOrder === insertIndex
  );
  if (occupied) return;
  smiley.zone = "statistics-order";
  smiley.placementOrder = Math.min(insertIndex, state.smileys.length - 1);
  normalizeOrderedSmileys();
  state.nextPlacementOrder = getStatisticsOrderedSmileys().length;
  if (els.statisticsOrderZone) {
    els.statisticsOrderZone.dataset.zone = "statistics-order";
  }
}

function previewOrderingDrag(drag, x, y) {
  if (!["ordering", "permutation", "statistics"].includes(state.phase) || !drag) return;
  if (state.phase === "statistics") return;
  if (state.smileyDrags.size > 1) return;
  const orderZone = getActiveOrderZone();
  const orderZoneKey = getActiveOrderZoneKey();
  if (!isPointInsideElement(orderZone, x, y)) return;
  const smiley = state.smileys.find(item => item.id === drag.id);
  if (!smiley) return;
  const insertIndex = getOrderInsertIndex(x, y);
  if (drag.previewZone === orderZoneKey && drag.previewIndex === insertIndex) return;

  const previousRects = collectSmileyRects();
  moveSmileyToOrder(smiley, x, y);
  drag.previewZone = orderZoneKey;
  drag.previewIndex = insertIndex;
  renderSmileys(drag.id);
  animateSmileysFrom(previousRects, drag.id, "fast");
}

function isPointInsideElement(element, x, y) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function restoreDraggedSmiley(smiley, drag) {
  if (!drag) return;
  smiley.zone = drag.originalZone || "tray";
  smiley.placementOrder = drag.originalPlacementOrder ?? smiley.originalOrder;
  normalizeOrderedSmileys();
}

function normalizeOrderedSmileys() {
  state.smileys
    .filter(smiley => smiley.zone === "order")
    .sort((first, second) => first.placementOrder - second.placementOrder)
    .forEach((smiley, index) => {
      smiley.placementOrder = index;
    });
  normalizeStatisticsOrderSlots();
}

function normalizeStatisticsOrderSlots() {
  const used = new Set();
  state.smileys
    .filter(smiley => smiley.zone === "statistics-order")
    .sort((first, second) => first.placementOrder - second.placementOrder)
    .forEach(smiley => {
      let slot = Math.max(0, Math.min(state.smileys.length - 1, smiley.placementOrder));
      while (used.has(slot) && slot < state.smileys.length - 1) {
        slot += 1;
      }
      while (used.has(slot) && slot > 0) {
        slot -= 1;
      }
      smiley.placementOrder = slot;
      used.add(slot);
    });
}

function getOrderInsertIndex(x, y) {
  if (state.phase === "statistics") {
    return getStatisticsOrderInsertIndex(y);
  }
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

function getStatisticsOrderInsertIndex(y) {
  const orderZone = els.statisticsOrderZone;
  const count = state.smileys.length || 1;
  const rect = orderZone.getBoundingClientRect();
  const rowHeight = rect.height / count;
  const relativeY = y - rect.top;
  const index = Math.floor(relativeY / Math.max(1, rowHeight));
  return Math.max(0, Math.min(count - 1, index));
}

function getActiveOrderZone() {
  if (state.phase === "statistics") return els.statisticsOrderZone;
  return state.phase === "permutation" ? els.permutationOrderZone : els.orderingZone;
}

function getActiveOrderZoneKey() {
  if (state.phase === "statistics") return "statistics-order";
  return state.phase === "permutation" ? "permutation-order" : "order";
}

function getHoveredOrderInsertIndex(node, index) {
  if (!state.dragging) return index;
  const hoveredSmiley = state.smileys.find(smiley => smiley.id === node.dataset.id);
  if (!hoveredSmiley) return index;
  const originalOrder = state.dragging.originalPlacementOrder ?? 0;
  if (state.dragging.originalZone === getActiveOrderZoneKey() && originalOrder < hoveredSmiley.placementOrder) {
    return index + 1;
  }
  return index;
}

function cancelDrag(event = null) {
  if (event?.pointerId !== undefined) {
    const drag = state.smileyDrags.get(event.pointerId);
    if (!drag) return;
    const smiley = state.smileys.find(item => item.id === drag.id);
    if (smiley) restoreDraggedSmiley(smiley, drag);
    cleanupDrag(drag);
    renderSmileys();
    return;
  }
  [...state.smileyDrags.values()].forEach(drag => {
    const smiley = state.smileys.find(item => item.id === drag.id);
    if (smiley) restoreDraggedSmiley(smiley, drag);
    cleanupDrag(drag);
  });
  renderSmileys();
}

function cleanupDrag(drag) {
  if (!drag) return;
  const { node, pointerId } = drag;
  if (node.hasPointerCapture(pointerId)) {
    node.releasePointerCapture(pointerId);
  }
  node.classList.remove("dragging");
  node.removeAttribute("style");
  node.remove();
  state.smileyDrags.delete(pointerId);
  if (!state.smileyDrags.size) {
    document.removeEventListener("pointermove", moveDrag);
    document.removeEventListener("pointerup", endDrag);
    document.removeEventListener("pointercancel", cancelDrag);
    clearDropMarks();
  }
}

function markDropTarget(target) {
  getAllDropContainers().forEach(zone => zone.classList.toggle("is-over", zone === target));
  if (target) {
    if (state.phase === "carroll" && target.classList.contains("carroll-zone")) {
      applyCarrollCrossHighlight(target.dataset.zone);
    } else if (carrollHighlightedZone) {
      clearCarrollCrossHighlight();
    }
  } else if (carrollHighlightedZone) {
    clearCarrollCrossHighlight();
  }
}

function clearDropMarks() {
  getAllDropContainers().forEach(zone => zone.classList.remove("is-over"));
  clearCarrollCrossHighlight();
}

function getCarrollCoordinates(zone) {
  const match = /^carroll-(with|without)-(with|without)$/.exec(zone || "");
  return match ? { column: match[1], row: match[2] } : null;
}

function applyCarrollCrossHighlight(zone) {
  if (!state.lightingEnabled) {
    clearCarrollCrossHighlight();
    return;
  }
  const coordinates = getCarrollCoordinates(zone);
  if (!coordinates) return;
  if (carrollHighlightedZone === zone) return;
  carrollHighlightedZone = zone;

  els.carrollTable.querySelectorAll(".carroll-zone").forEach(cell => {
    const cellCoordinates = getCarrollCoordinates(cell.dataset.zone);
    cell.classList.toggle("is-carroll-column-guide", cellCoordinates?.column === coordinates.column);
    cell.classList.toggle("is-carroll-row-guide", cellCoordinates?.row === coordinates.row);
  });

  els.carrollTopWith.classList.toggle("is-carroll-column-guide", coordinates.column === "with");
  els.carrollTopWithout.classList.toggle("is-carroll-column-guide", coordinates.column === "without");
  els.carrollSideWith.classList.toggle("is-carroll-row-guide", coordinates.row === "with");
  els.carrollSideWithout.classList.toggle("is-carroll-row-guide", coordinates.row === "without");
}

function clearCarrollCrossHighlight() {
  carrollHighlightSequence += 1;
  carrollHighlightedZone = null;
  els.carrollTable?.classList.remove("is-carroll-drop-pulse");
  els.carrollTable?.querySelectorAll(".is-carroll-column-guide, .is-carroll-row-guide").forEach(node => {
    node.classList.remove("is-carroll-column-guide", "is-carroll-row-guide");
  });
}

function pulseCarrollCrossHighlight(zone) {
  if (!state.lightingEnabled) return;
  clearCarrollCrossHighlight();
  const sequence = carrollHighlightSequence;
  applyCarrollCrossHighlight(zone);
  els.carrollTable.classList.add("is-carroll-drop-pulse");
  window.setTimeout(() => {
    if (sequence !== carrollHighlightSequence) return;
    clearCarrollCrossHighlight();
  }, 720);
}

function getDropTarget(x, y) {
  if (state.phase === "ordering" || state.phase === "permutation" || state.phase === "pair-combination" || state.phase === "team" || (state.phase === "statistics" && state.statisticsStep === "beard-ranking")) {
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
  if (state.phase === "nested") {
    const nestedTarget = getAllDropContainers()
      .filter(zone => zone.classList.contains("nested-zone") || zone.classList.contains("smiley-tray"))
      .find(zone => isPointInsideElement(zone, x, y));
    if (nestedTarget) return nestedTarget;
  }
  if (state.phase === "implicit") {
    const implicitTarget = getAllDropContainers()
      .filter(zone => zone.classList.contains("implicit-zone") || zone.classList.contains("smiley-tray"))
      .find(zone => isPointInsideElement(zone, x, y));
    if (implicitTarget) return implicitTarget;
  }
  if (state.phase === "counting") {
    const countingTarget = getAllDropContainers()
      .filter(zone => zone.classList.contains("counting-clue") || zone.classList.contains("smiley-tray"))
      .find(zone => isPointInsideElement(zone, x, y));
    if (countingTarget) return countingTarget;
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
  if (state.phase === "pair-combination") {
    return element.closest(".pair-capture-zone, .permutation-source-zone");
  }
  if (state.phase === "team") {
    return element.closest(".team-capture-zone, .team-source-zone");
  }
  if (state.phase === "carroll") {
    return element.closest(".carroll-zone, .smiley-tray");
  }
  if (state.phase === "venn") {
    return element.closest(".venn-zone, .smiley-tray");
  }
  if (state.phase === "nested") {
    return element.closest(".nested-zone, .smiley-tray");
  }
  if (state.phase === "implicit") {
    return element.closest(".implicit-zone, .smiley-tray");
  }
  if (state.phase === "counting") {
    return element.closest(".counting-clue, .smiley-tray");
  }
  if (state.phase === "statistics") {
    return element.closest(".statistics-beard-zone, .statistics-order-zone, .smiley-tray");
  }
  if (state.phase === "selection") {
    return element.closest(".venn-zone, .selection-target-zone");
  }
  return element.closest(".drop-zone, .smiley-tray");
}

function validateCurrentPhase(skipCountOffer = false) {
  if (els.submitSortButton.disabled) return;
  if (isCelebrating()) return;
  const validateOrganizationFirst = shouldValidateCompletedOrganizationFirst();
  if (!validateOrganizationFirst && state.countChallenge && !state.countChallenge.onCorrect && markMissingCountInputs()) {
    return;
  }
  if (!validateOrganizationFirst
    && state.countChallenge
    && !state.countChallenge.onCorrect
    && !state.countChallenge.checked
    && !state.countChallenge.skipped
    && !skipCountOffer) {
    openCountCheckDialog();
    return;
  }
  if (!validateOrganizationFirst && state.countChallenge?.onCorrect) {
    checkCounts();
    return;
  }
  if (state.phase === "similarity") {
    validateSimilarity();
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
    if (state.permutationAlbum.length >= getPermutationGoal()) {
      completePermutationAlbum();
    }
    return;
  }
  if (state.phase === "pair-combination") {
    if (state.pairCombinationAlbum.length >= getPairCombinationGoal()) {
      completePairCombinationAlbum();
    }
    return;
  }
  if (state.phase === "team") {
    if (state.teamAlbum.length >= getTeamGoal()) completeTeamAlbum();
    return;
  }
  if (state.phase === "selection") {
    validateSelection();
    return;
  }
  if (state.phase === "creator") {
    validateCreatorFinish();
    return;
  }
  if (state.phase === "venn") {
    validateVenn();
    return;
  }
  if (state.phase === "nested") {
    validateNested();
    return;
  }
  if (state.phase === "counting") {
    validateCounting();
    return;
  }
  if (state.phase === "implicit") {
    validateImplicit();
    return;
  }
  if (state.phase === "statistics") {
    validateStatistics();
    return;
  }
  validateSort();
}

function shouldValidateCompletedOrganizationFirst() {
  if (!state.countChallenge || state.countChallenge.onCorrect) return false;
  if (state.phase === "ordering") {
    return state.smileys.length > 0 && state.smileys.every(smiley => smiley.zone === "order");
  }
  if (["sorting", "carroll", "venn", "nested"].includes(state.phase)) {
    return state.smileys.length > 0 && state.smileys.every(smiley => smiley.zone !== "tray");
  }
  if (state.phase === "implicit") {
    return areImplicitGuessesCorrect()
      || (state.smileys.length > 0 && state.smileys.every(smiley => smiley.zone !== "tray"));
  }
  return false;
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
  state.submitMistakeStreak = 0;
  state.returnAfterErrorPending = false;
  if (state.returnAfterErrorTimer) {
    window.clearTimeout(state.returnAfterErrorTimer);
    state.returnAfterErrorTimer = null;
  }
}

function registerMistake({ returnSmileys = false } = {}) {
  if (!state.returnAfterErrorPending) {
    state.mistakeStreak += 1;
    state.submitMistakeStreak += 1;
  }
  signalIncorrect();

  if (state.submitMistakeStreak === 1) {
    animateUnhappySmileys(state.smileys.map(smiley => smiley.id));
  } else if (state.submitMistakeStreak === 2) {
    animateUnhappySmileys(getWrongSmileyIds());
  }

  if (returnSmileys && state.submitMistakeStreak >= 3 && !state.returnAfterErrorPending) {
    state.returnAfterErrorPending = true;
    state.returnAfterErrorTimer = window.setTimeout(() => {
      state.returnAfterErrorTimer = null;
      returnSmileysToTraySlowly(getWrongSmileyIds());
    }, 560);
  }
}

function animateUnhappySmileys(ids) {
  const idSet = new Set(ids);
  els.workPanel.querySelectorAll(".smiley").forEach(node => {
    if (!idSet.has(node.dataset.id)) return;
    node.classList.remove("mistake-wiggle");
    node.getBoundingClientRect();
    node.classList.add("mistake-wiggle");
    node.addEventListener("animationend", () => node.classList.remove("mistake-wiggle"), { once: true });
  });
}

function getWrongSmileyIds() {
  if (state.phase === "ordering") {
    const placed = state.smileys
      .filter(smiley => smiley.zone === "order")
      .sort((first, second) => first.placementOrder - second.placementOrder);
    const expected = [...placed].sort(compareByOrderingCriteria);
    const misplaced = new Set(
      placed.filter((smiley, index) => smiley.id !== expected[index]?.id).map(smiley => smiley.id)
    );
    state.smileys.filter(smiley => smiley.zone !== "order").forEach(smiley => misplaced.add(smiley.id));
    return [...misplaced];
  }

  return state.smileys.filter(smiley => {
    if (state.phase === "sorting") {
      const feature = currentFeature();
      return smiley.zone !== (feature.get(smiley) ? "with" : "without");
    }
    if (state.phase === "carroll") return smiley.zone !== getCarrollZoneForSmiley(smiley, state.activeCarrollCriteria);
    if (state.phase === "venn") return smiley.zone !== getVennZoneForSmiley(smiley, state.activeVennCriteria);
    if (state.phase === "nested") return smiley.zone !== getNestedZoneForSmiley(smiley, state.activeNestedCriteria);
    if (state.phase === "counting") return smiley.zone !== getCountingZoneForSmiley(smiley);
    if (state.phase === "implicit") return smiley.zone !== getImplicitZoneForSmiley(smiley, state.activeImplicitCriteria);
    if (state.phase === "selection") {
      return (smiley.zone === "selection-target") !== matchesSelectionRule(smiley);
    }
    if (state.phase === "statistics" && state.statisticsStep === "beard-frequency") {
      return smiley.zone !== `statistics-beard-${smiley.beardLevel}`;
    }
    return false;
  }).map(smiley => smiley.id);
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
    : state.phase === "similarity"
      ? els.similarityPanel
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
      : state.phase === "nested"
        ? els.nestedPanel
      : state.phase === "counting"
        ? els.countingPanel
      : state.phase === "implicit"
        ? els.implicitPanel
      : state.phase === "statistics"
        ? els.statisticsPanel
      : els.sortTable;
  target.classList.remove("shake");
  window.requestAnimationFrame(() => target.classList.add("shake"));
}

function returnSmileysToTraySlowly(ids = state.smileys.map(smiley => smiley.id)) {
  const previousRects = collectSmileyRects();
  const idSet = new Set(ids);

  state.smileys.forEach(smiley => {
    if (!idSet.has(smiley.id)) return;
    smiley.zone = "tray";
    smiley.placementOrder = smiley.originalOrder;
  });
  resetMistakeCounter();
  renderSmileys();
  animateSmileysFrom(previousRects);
}

function animateSmileysFrom(previousRects, excludedId = null, speed = "normal") {
  const transitionBySpeed = {
    fast: "transform 180ms ease-out",
    pair: "transform 680ms cubic-bezier(0.22, 1, 0.36, 1)",
    photo: `transform ${PHOTO_RETURN_MS}ms cubic-bezier(0.45, 0, 0.55, 1)`,
    cycle: "transform 2340ms cubic-bezier(0.45, 0, 0.55, 1)",
    counting: "transform 1140ms cubic-bezier(0.45, 0, 0.55, 1)",
    normal: "transform 2340ms cubic-bezier(0.45, 0, 0.55, 1)"
  };
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
      // Keep the duration inline: iPad Safari can otherwise briefly fall back
      // to the base .smiley 240ms transition before applying the speed class.
      node.style.transition = transitionBySpeed[speed] || transitionBySpeed.normal;
      node.classList.add(
        speed === "fast"
          ? "returning-fast"
          : speed === "pair"
            ? "returning-pair"
          : speed === "photo"
            ? "returning-photo"
          : speed === "cycle"
            ? "returning-cycle"
          : speed === "counting"
            ? "returning-counting"
            : "returning"
      );
      node.style.transform = "";
    }));
    node.addEventListener("transitionend", () => {
      node.classList.remove("returning");
      node.classList.remove("returning-fast");
      node.classList.remove("returning-pair");
      node.classList.remove("returning-photo");
      node.classList.remove("returning-cycle");
      node.classList.remove("returning-counting");
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
  if (isStandaloneNumberMission()) {
    state.countChallenge.items = state.mission === "feature"
      ? buildFeatureCountItems()
      : buildMissionCountItems();
  }
  const inputs = [...document.querySelectorAll(".count-question-input")]
    .sort((first, second) => Number(first.dataset.countIndex) - Number(second.dataset.countIndex));
  if (markMissingCountInputs(inputs)) {
    return;
  }
  inputs.forEach(input => {
    input.classList.remove("is-missing");
    input.setAttribute("aria-invalid", "false");
  });

  const isCorrect = state.countChallenge.items.every((item, index) =>
    Number.parseInt(inputs[index].value, 10) === item.expected
  );
  if (isCorrect) {
    const onCorrect = state.countChallenge.onCorrect;
    if (onCorrect) {
      state.countChallenge = null;
      clearInlineCountPrompts();
      onCorrect();
    } else if (advanceMissionFromNumbers()) {
      return;
    } else {
      state.countChallenge.checked = true;
      validateCurrentPhase(true);
    }
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
  const wasChecked = state.countChallenge?.checked === true;
  const wasSkipped = state.countChallenge?.skipped === true;
  const savedValues = [...document.querySelectorAll(".count-question-input")]
    .reduce((values, input) => ({ ...values, [input.dataset.countIndex]: input.value }), {});
  state.countChallenge = { items, onCorrect };
  renderInlineCountPrompts(items);
  document.querySelectorAll(".count-question-input").forEach(input => {
    input.value = savedValues[input.dataset.countIndex] || "";
  });
  els.submitSortButton.textContent = "OK";
  unlockSubmitButton();
  if (onCorrect && (wasChecked || wasSkipped)) {
    state.countChallenge = null;
    clearInlineCountPrompts();
    onCorrect();
  } else if (onCorrect) {
    const inputs = [...document.querySelectorAll(".count-question-input")];
    if (inputs.length && inputs.every(input => input.value.trim() !== "")) {
      checkCounts();
    }
  }
}

function setupCountCheckDialog() {
  const dialog = document.querySelector("#countCheckDialog");
  const checkButton = document.querySelector("#checkCountButton");
  const skipButton = document.querySelector("#skipCountCheckButton");
  checkButton?.addEventListener("click", () => {
    closeCountCheckDialog();
    checkCounts();
  });
  skipButton?.addEventListener("click", () => {
    closeCountCheckDialog();
    checkCounts();
  });
  dialog?.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const nextButton = document.activeElement === checkButton ? skipButton : checkButton;
      nextButton?.focus();
      return;
    }
    if (event.key === "Enter" && (document.activeElement === checkButton || document.activeElement === skipButton)) {
      event.preventDefault();
      document.activeElement.click();
    }
  });
}

function isStandaloneNumberMission() {
  return new Set(["feature", "ordering", "carroll", "venn", "nested", "implicit"])
    .has(state.mission);
}

function advanceMissionFromNumbers() {
  if (!state.countChallenge || !isStandaloneNumberMission()) return false;
  const mission = state.mission;
  state.countChallenge = null;
  clearInlineCountPrompts();
  resetMistakeCounter();
  lockSubmitButton();
  if (mission === "feature") {
    advanceQuestionFromCount();
  } else if (mission === "compare") {
    advanceComparePair();
  } else if (mission === "carroll") {
    finishCarrollCycle();
  } else {
    finishSet(collectSmileyRects());
  }
  return true;
}

function openCountCheckDialog() {
  document.querySelector("#countCheckDialog")?.classList.remove("hidden");
  document.querySelector("#skipCountCheckButton")?.focus();
}

function closeCountCheckDialog() {
  document.querySelector("#countCheckDialog")?.classList.add("hidden");
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
  const countableMissions = new Set(["feature", "ordering", "carroll", "venn", "nested", "implicit"]);
  if (!state.useNumbers || !countableMissions.has(state.mission)) return;
  const missionAtReset = state.mission;
  window.queueMicrotask(() => {
    if (!state.useNumbers || state.mission !== missionAtReset || state.countChallenge) return;
    const items = state.mission === "feature" ? buildFeatureCountItems() : buildMissionCountItems();
    startCountChallenge(items, null);
  });
}

function getCountPromptMount(item) {
  if (item.target === "tray-label") return els.trayLabel;
  if (item.target === "compare-panel") return els.comparePanel;
  if (item.target === "with-header") return els.withHeader;
  if (item.target === "without-header") return els.withoutHeader;
  if (item.target === "carroll-column-with") return els.carrollTopWith;
  if (item.target === "carroll-column-without") return els.carrollTopWithout;
  if (item.target === "carroll-row-with") return els.carrollSideWith;
  if (item.target === "carroll-row-without") return els.carrollSideWithout;
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
  input.tabIndex = 10 + index;
  input.addEventListener("input", () => {
    input.classList.remove("is-missing");
    input.setAttribute("aria-invalid", "false");
  });
  input.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const inputs = [...document.querySelectorAll(".count-question-input")]
      .sort((first, second) => Number(first.dataset.countIndex) - Number(second.dataset.countIndex));
    const currentIndex = inputs.indexOf(input);
    if (currentIndex >= 0 && currentIndex + 1 < inputs.length) {
      inputs[currentIndex + 1].focus();
      inputs[currentIndex + 1].select();
    } else {
      els.submitSortButton.click();
    }
  });
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
      { label: "Compared", expected: state.compareSmileys.length, whole: true, target: "compare-panel", showLabel: false },
      { label: createRelationIcon("equal"), expected: features.filter(feature => getCompareAnswer(feature) === "equal").length, target: "compare-equal", showLabel: false },
      { label: createRelationIcon("different"), expected: features.filter(feature => getCompareAnswer(feature) === "different").length, target: "compare-different", showLabel: false }
    ];
  }
  if (state.mission === "carroll") {
    const [columnFeature, rowFeature] = state.activeCarrollCriteria;
    const candidates = [
      { key: "cell-with-with", expected: countSmileysForMissionZone("carroll-with-with"), zone: "carroll-with-with", showLabel: false },
      { key: "cell-without-with", expected: countSmileysForMissionZone("carroll-without-with"), zone: "carroll-without-with", showLabel: false },
      { key: "cell-with-without", expected: countSmileysForMissionZone("carroll-with-without"), zone: "carroll-with-without", showLabel: false },
      { key: "cell-without-without", expected: countSmileysForMissionZone("carroll-without-without"), zone: "carroll-without-without", showLabel: false },
      { key: "column-with", expected: state.smileys.filter(columnFeature.get).length, target: "carroll-column-with", showLabel: false },
      { key: "column-without", expected: state.smileys.filter(smiley => !columnFeature.get(smiley)).length, target: "carroll-column-without", showLabel: false },
      { key: "row-with", expected: state.smileys.filter(rowFeature.get).length, target: "carroll-row-with", showLabel: false },
      { key: "row-without", expected: state.smileys.filter(smiley => !rowFeature.get(smiley)).length, target: "carroll-row-without", showLabel: false }
    ];
    const signature = ["carroll", columnFeature.key, rowFeature.key, ...state.smileys.map(smiley => smiley.id)].join("|");
    if (state.countItemSelection?.signature !== signature) {
      state.countItemSelection = {
        signature,
        keys: shuffle(candidates.map(item => item.key)).slice(0, 3)
      };
    }
    const selectedItems = state.countItemSelection.keys
      .map(key => candidates.find(item => item.key === key))
      .filter(Boolean);
    return [
      { label: "Whole", expected: state.smileys.length, whole: true, target: "tray-label", showLabel: false },
      ...selectedItems
    ];
  }
  if (state.mission === "venn") {
    return [
      { label: "Whole", expected: state.smileys.length, whole: true, target: "tray-label", showLabel: false },
      ...getVennZoneKeys().map(zone => ({
        label: createVennCountLabel(zone),
        expected: countSmileysForMissionZone(zone),
        zone,
        showLabel: false
      }))
    ];
  }
  if (state.mission === "nested") {
    const [outerFeature, innerFeature] = state.activeNestedCriteria;
    return [
      { label: "Whole", expected: state.smileys.length, whole: true, target: "tray-label", showLabel: false },
      { label: createCountIconGroup([createFeatureIcon(outerFeature), createFeatureIcon(innerFeature)]), expected: countSmileysForMissionZone("nested-inner"), zone: "nested-inner", showLabel: false },
      { label: createFeatureIcon(outerFeature), expected: countSmileysForMissionZone("nested-outer"), zone: "nested-outer", showLabel: false },
      { label: createFeatureIcon(outerFeature, true), expected: countSmileysForMissionZone("nested-outside"), zone: "nested-outside", showLabel: false }
    ];
  }
  if (state.mission === "implicit") {
    return [
      { label: "Whole", expected: state.smileys.length, whole: true, target: "tray-label", showLabel: false },
      { label: "Left", expected: countSmileysForMissionZone("implicit-a"), zone: "implicit-a", showLabel: false },
      { label: "Middle", expected: countSmileysForMissionZone("implicit-ab"), zone: "implicit-ab", showLabel: false },
      { label: "Right", expected: countSmileysForMissionZone("implicit-b"), zone: "implicit-b", showLabel: false },
      { label: "Outside", expected: countSmileysForMissionZone("implicit-outside"), zone: "implicit-outside", showLabel: false }
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
  state.pairCombinationAlbum = [];
  state.pairCombinationHadMistake = false;
  state.pairCombinationGroupSizes = [2, 2];
}

function createRelationIcon(relation) {
  if (state.relationDisplayMode === "words") {
    const word = document.createElement("span");
    word.className = `relation-word ${relation === "different" ? "is-different" : "is-same"}`;
    word.textContent = relation === "different" ? "Different" : "Same";
    return word;
  }
  if (state.relationDisplayMode !== "iconic") {
    const symbol = document.createElement("span");
    symbol.className = `relation-symbol-legacy ${relation === "different" ? "is-different" : "is-same"}`;
    symbol.textContent = relation === "different" ? "≠" : "=";
    return symbol;
  }
  const icon = document.createElement("span");
  icon.className = `relation-pair-icon relation-display-icon ${relation === "different" ? "is-different" : "is-same"}`;
  icon.setAttribute("aria-hidden", "true");
  icon.append(document.createElement("i"), document.createElement("i"));
  return icon;
}

function setupRelationDisplayMode() {
  renderCompareRelationHeaders();
}

function renderCompareRelationHeaders() {
  [...document.querySelectorAll(".compare-symbol-head")].forEach((head, index) => {
    const relation = index === 0 ? "equal" : "different";
    head.replaceChildren(createRelationIcon(relation));
    head.setAttribute("role", "button");
    head.setAttribute("tabindex", "0");
    head.setAttribute("title", "Change relation display");
    head.setAttribute("aria-label", `${relation === "equal" ? "Same" : "Different"}. Change relation display`);
    if (head.dataset.modeToggleBound === "true") return;
    head.dataset.modeToggleBound = "true";
    head.addEventListener("click", cycleRelationDisplayMode);
    head.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      cycleRelationDisplayMode();
    });
  });
}

function cycleRelationDisplayMode() {
  const modes = ["iconic", "symbolic", "words"];
  const currentIndex = modes.indexOf(state.relationDisplayMode);
  state.relationDisplayMode = modes[(currentIndex + 1) % modes.length];
  renderCompareRelationHeaders();
  if (state.phase === "simple-compare") renderSimpleCompare();
}

function createRelationModeSummary() {
  const summary = document.createElement("span");
  summary.className = "relation-mode-summary";
  const separator = document.createElement("span");
  separator.className = "relation-mode-separator";
  separator.textContent = "/";
  separator.setAttribute("aria-hidden", "true");
  summary.append(createRelationIcon("equal"), separator, createRelationIcon("different"));
  return summary;
}

function markMissingCountInputs(inputs = [...document.querySelectorAll(".count-question-input")]) {
  const missingInputs = inputs.filter(input => input.value.trim() === "");
  inputs.forEach(input => {
    const isMissing = missingInputs.includes(input);
    input.classList.toggle("is-missing", isMissing);
    input.setAttribute("aria-invalid", String(isMissing));
  });
  missingInputs[0]?.focus();
  return missingInputs.length > 0;
}

function countSmileysForMissionZone(zone) {
  return state.smileys.filter(smiley => {
    if (zone.startsWith("carroll-")) return getCarrollZoneForSmiley(smiley, state.activeCarrollCriteria) === zone;
    if (zone.startsWith("venn-")) return getVennZoneForSmiley(smiley, state.activeVennCriteria) === zone;
    if (zone.startsWith("nested-")) return getNestedZoneForSmiley(smiley, state.activeNestedCriteria) === zone;
    if (zone.startsWith("implicit-")) return getImplicitZoneForSmiley(smiley, state.activeImplicitCriteria) === zone;
    return smiley.zone === zone;
  }).length;
}

function resetSelectionState() {
  state.selectionSourceZone = null;
  state.selectionSourceRule = null;
  state.selectionHadMistake = false;
}

function resetImplicitGuessState() {
  state.implicitGuesses = [null, null];
  state.implicitChoiceIndex = null;
  state.implicitDemoInProgress = false;
  els.implicitPanel?.removeAttribute("aria-busy");
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
  state.phase = "transitioning";
  lockSubmitButton();
  els.workPanel.classList.add("is-celebrating");
  returnRoomSmileysToTray();

  scheduleCycleTimer(() => {
    els.workPanel.classList.add("criteria-wiggling");
  }, SUCCESS_SMILEY_RETURN_MS + SMILEY_RETURN_SETTLE_MS);

  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("criteria-wiggling");
    els.workPanel.classList.add("criteria-fading-out");
  }, SUCCESS_SMILEY_RETURN_MS + SMILEY_RETURN_SETTLE_MS + CATEGORY_WIGGLE_MS);

  scheduleCycleTimer(() => {
    const previousRects = collectSmileyRects();
    state.featureIndex += 1;
    startFeature(previousRects);
    els.workPanel.classList.remove("is-celebrating");
    els.workPanel.classList.remove("criteria-fading-out");
    els.workPanel.classList.add("criteria-fading-in");
  }, SUCCESS_SMILEY_RETURN_MS + SMILEY_RETURN_SETTLE_MS + CATEGORY_WIGGLE_MS + SUCCESS_CATEGORY_FADE_OUT_MS);

  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("criteria-fading-in");
    els.workPanel.classList.add("criteria-wiggling");
  }, SUCCESS_SMILEY_RETURN_MS + SMILEY_RETURN_SETTLE_MS + CATEGORY_WIGGLE_MS + SUCCESS_CATEGORY_FADE_OUT_MS + SUCCESS_CATEGORY_FADE_IN_MS);

  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("criteria-wiggling");
  }, SUCCESS_SMILEY_RETURN_MS + SMILEY_RETURN_SETTLE_MS + (CATEGORY_WIGGLE_MS * 2) + SUCCESS_CATEGORY_FADE_OUT_MS + SUCCESS_CATEGORY_FADE_IN_MS);
}

function startSimilarityPhase() {
  state.phase = "similarity";
  state.similaritySelectedIndex = null;
  resetMistakeCounter();
  resetCountChallenge();
  els.sortTable.classList.add("hidden");
  els.similarityPanel.classList.remove("hidden");
  els.orderingPanel.classList.add("hidden");
  els.statisticsPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.nestedPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  els.countingPanel?.classList.add("hidden");
  els.tray.replaceChildren();
  els.trayLabel.textContent = "";
  setHeader("Who is more similar?");
  els.submitSortButton.textContent = "OK";
  lockSubmitButton();
  renderSimilarityChallenge();
}

function renderSimilarityChallenge() {
  const challenge = state.similarityChallenge;
  if (!challenge) return;
  els.similarityReference.replaceChildren(createStaticSmileyNode(challenge.target));
  els.similarityReference.setAttribute("aria-label", `Reference: ${describeSmiley(challenge.target)}`);
  els.similarityChoices.replaceChildren(...challenge.candidates.map((smiley, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "similarity-choice";
    button.dataset.similarityIndex = String(index);
    button.setAttribute("aria-label", `Choice ${index + 1}: ${describeSmiley(smiley)}`);
    button.setAttribute("aria-pressed", String(state.similaritySelectedIndex === index));
    button.classList.toggle("is-selected", state.similaritySelectedIndex === index);
    button.append(createStaticSmileyNode(smiley));
    button.addEventListener("click", () => selectSimilarityCandidate(index));
    return button;
  }));
}

function selectSimilarityCandidate(index) {
  if (state.phase !== "similarity") return;
  state.similaritySelectedIndex = index;
  playInteractionSound("mark");
  els.similarityChoices.querySelectorAll(".similarity-choice").forEach((button, buttonIndex) => {
    const isSelected = buttonIndex === index;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
  unlockSubmitButton();
}

function validateSimilarity() {
  const challenge = state.similarityChallenge;
  const selectedIndex = state.similaritySelectedIndex;
  if (!challenge || selectedIndex === null) return;
  const selectedButton = els.similarityChoices.querySelector(`[data-similarity-index="${selectedIndex}"]`);
  if (selectedIndex === challenge.correctIndex) {
    selectedButton?.classList.add("is-correct");
    playInteractionSound("drop");
    resetMistakeCounter();
    finishSet(new Map());
    return;
  }

  selectedButton?.classList.add("is-wrong");
  playInteractionSound("return");
  registerMistake();
  state.similaritySelectedIndex = null;
  lockSubmitButton();
  window.setTimeout(() => {
    if (state.phase === "similarity") renderSimilarityChallenge();
  }, 420);
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
  els.statisticsPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  els.countingPanel?.classList.add("hidden");
  els.trayLabel.textContent = "";
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

function startStatisticsPhase(previousRects = null) {
  state.phase = "statistics";
  resetMistakeCounter();
  resetCountChallenge();
  els.sortTable.classList.add("hidden");
  els.orderingPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  els.countingPanel?.classList.add("hidden");
  els.statisticsPanel.classList.remove("hidden");
  els.tray.dataset.count = String(state.smileys.length);
  els.trayLabel.textContent = "";
  els.submitSortButton.classList.remove("hidden");
  els.submitSortButton.textContent = "OK";
  unlockSubmitButton();
  renderStatistics();
  renderSmileys();
  if (previousRects) {
    animateSmileysFrom(previousRects);
  }
}

function renderStatistics() {
  els.statisticsFrequency.classList.toggle("hidden", !["beard-frequency", "beard-questions", "beard-ranking", "ranking-questions", "coins"].includes(state.statisticsStep));
  els.statisticsOrderZone.classList.toggle("hidden", !["beard-ranking", "ranking-questions", "coins"].includes(state.statisticsStep));
  els.statisticsCoinStage.classList.toggle("hidden", !["coins", "average-only"].includes(state.statisticsStep));
  els.statisticsPanel.classList.toggle("is-coin-step", ["coins", "average-only"].includes(state.statisticsStep));
  els.statisticsPanel.classList.toggle("is-average-only-step", state.statisticsStep === "average-only");
  els.statisticsPanel.classList.toggle("is-average-many", state.statisticsStep === "average-only" && state.smileys.length > 5);
  els.statisticsWeightedTable.classList.add("hidden");
  const statisticsInstruction = document.querySelector("#statisticsInstruction");
  const statisticsRankingDirection = document.querySelector("#statisticsRankingDirection");
  if (statisticsInstruction) {
    statisticsInstruction.textContent = "";
  }
  if (statisticsRankingDirection) {
    statisticsRankingDirection.textContent = "";
  }
  els.statisticsQuestion.textContent = "";
  els.statisticsAnswerRow.replaceChildren();

  if (state.statisticsStep === "beard-frequency") {
    setHeader("Statistics", "1 of 5");
    if (statisticsInstruction) {
      statisticsInstruction.textContent = "Sort the smileys by beard length.";
    }
    renderStatisticsFrequency();
    els.statisticsOrderZone.replaceChildren();
    els.statisticsOrderZone.dataset.count = String(state.smileys.length);
    renderStatisticsRankSlots();
    return;
  }

  if (state.statisticsStep === "beard-questions") {
    setHeader("Statistics", "2 of 5");
    if (statisticsInstruction) {
      statisticsInstruction.textContent = "Use the frequency table.";
    }
    renderStatisticsFrequency();
    renderStatisticsBeardQuestion();
    return;
  }

  if (state.statisticsStep === "beard-ranking") {
    setHeader("Statistics", "3 of 5");
    if (statisticsInstruction) {
      statisticsInstruction.textContent = "";
    }
    renderStatisticsFrequency();
    els.statisticsOrderZone.dataset.count = String(state.smileys.length);
    if (statisticsRankingDirection) {
      statisticsRankingDirection.textContent = "Rank from longest beard at the top to shortest beard at the bottom.";
    }
    renderStatisticsRankSlots();
    return;
  }

  if (state.statisticsStep === "ranking-questions") {
    setHeader("Statistics", "4 of 5");
    if (statisticsInstruction) {
      statisticsInstruction.textContent = "Use the ranking table.";
    }
    renderStatisticsFrequency();
    els.statisticsOrderZone.dataset.count = String(state.smileys.length);
    renderStatisticsRankSlots();
    renderStatisticsRankingQuestion();
    return;
  }

  if (state.statisticsStep === "coins") {
    setHeader("Statistics", "5 of 5");
    if (statisticsInstruction) {
      statisticsInstruction.textContent = state.statisticsCoinStep === "average-question" || state.statisticsCoinStep === "average-review"
        ? "Choose the average coins."
        : state.statisticsCoinStep === "total-question"
          ? "Find the total coins first."
          : "Drag coins from the ranked smileys to the tray, then share them equally.";
    }
    renderStatisticsFrequency();
    renderStatisticsCoinStage();
    if (state.statisticsCoinStep === "average-question" || state.statisticsCoinStep === "average-review") {
      renderStatisticsCoinAverageQuestion();
    } else if (state.statisticsCoinStep === "total-question") {
      renderStatisticsCoinTotalQuestion();
    } else {
      els.statisticsQuestion.textContent = "Spread the coins equally.";
      els.statisticsAnswerRow.replaceChildren();
    }
    return;
  }

  if (state.statisticsStep === "average-only") {
    setHeader("Average");
    if (statisticsInstruction) {
      statisticsInstruction.textContent = "Drag the smileys to sort their coin groups, then find the average.";
    }
    renderStatisticsAverageOnlyStage();
    renderStatisticsAverageOnlyQuestion();
    return;
  }
}

function renderStatisticsFrequency() {
  els.statisticsFrequency.replaceChildren();
  BEARD_LEVELS.forEach(level => {
    const column = document.createElement("div");
    column.className = "statistics-frequency-column";
    const head = document.createElement("div");
    head.className = "statistics-frequency-head";
    head.setAttribute("aria-label", level.label);
    head.append(createBeardIcon(level.value));
    const zone = document.createElement("div");
    zone.className = "statistics-beard-zone";
    zone.dataset.zone = `statistics-beard-${level.value}`;
    zone.setAttribute("aria-label", level.label);
    column.append(head, zone);
    els.statisticsFrequency.append(column);
  });
}

function renderStatisticsRankSlots() {
  els.statisticsOrderZone.querySelectorAll(".statistics-rank-row, .statistics-rank-slot").forEach(node => node.remove());
  const middleIndex = Math.floor(state.smileys.length / 2);
  const smileyNodesBySlot = new Map(
    getStatisticsOrderedSmileys().map(smiley => [
      smiley.placementOrder,
      els.statisticsOrderZone.querySelector(`[data-id="${CSS.escape(smiley.id)}"]`)
    ])
  );
  const rowNodes = [];
  for (let index = 0; index < state.smileys.length; index += 1) {
    const row = document.createElement("div");
    row.className = "statistics-rank-row";
    row.dataset.rankIndex = String(index);
    markStatisticsRankRow(row, index, middleIndex);
    const smileyNode = smileyNodesBySlot.get(index);
    if (smileyNode) {
      smileyNode.dataset.rank = String(index + 1);
      smileyNode.classList.remove("is-first-rank", "is-middle-rank", "is-last-rank");
      row.append(smileyNode);
      rowNodes.push(row);
      continue;
    }
    const slot = document.createElement("span");
    slot.className = "statistics-rank-slot";
    slot.textContent = String(index + 1);
    slot.dataset.rankIndex = String(index);
    slot.setAttribute("aria-hidden", "true");
    row.append(slot);
    rowNodes.push(row);
  }
  els.statisticsOrderZone.replaceChildren(...rowNodes);
  if (state.statisticsStep === "coins") {
    renderStatisticsCoins();
  }
}

function markStatisticsRankRow(node, index, middleIndex) {
  node.classList.remove("is-first-rank", "is-middle-rank", "is-last-rank");
  node.classList.toggle("is-first-rank", index === 0);
  node.classList.toggle("is-middle-rank", index === middleIndex);
  node.classList.toggle("is-last-rank", index === state.smileys.length - 1);
}

function renderStatisticsBeardQuestion() {
  const questions = getStatisticsBeardQuestions();
  const question = questions[state.statisticsQuestionIndex];
  els.statisticsQuestion.textContent = question.prompt;
  renderStatisticsBeardIconAnswerChoices(question.choices, question.answer);
}

function renderStatisticsRankingQuestion() {
  const questions = getStatisticsRankingQuestions();
  const question = questions[state.statisticsQuestionIndex];
  els.statisticsQuestion.textContent = question.prompt;
  renderStatisticsBeardIconAnswerChoices(question.choices, question.answer);
}

function createBeardIcon(level) {
  const icon = document.createElement("span");
  icon.className = `beard-icon beard-icon-${level}`;
  icon.setAttribute("aria-hidden", "true");
  icon.append(document.createElement("span"));
  return icon;
}

function renderStatisticsAnswerChoices(choices, correctAnswer) {
  els.statisticsAnswerRow.replaceChildren();
  choices.forEach(choice => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "statistics-answer-button";
    button.textContent = choice.label;
    button.dataset.value = String(choice.value);
    button.classList.toggle("is-selected", state.statisticsAnswer === choice.value);
    button.addEventListener("click", () => {
      state.statisticsAnswer = choice.value;
      renderStatisticsAnswerChoices(choices, correctAnswer);
    });
    els.statisticsAnswerRow.append(button);
  });
}

function renderStatisticsBeardIconAnswerChoices(choices, correctAnswer) {
  els.statisticsAnswerRow.replaceChildren();
  choices.forEach(choice => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "statistics-answer-button statistics-beard-answer";
    button.dataset.value = String(choice.value);
    button.classList.toggle("is-selected", state.statisticsAnswer === choice.value);
    button.setAttribute("aria-label", choice.label);
    button.append(createBeardIcon(choice.value));
    button.addEventListener("click", () => {
      state.statisticsAnswer = choice.value;
      renderStatisticsBeardIconAnswerChoices(choices, correctAnswer);
    });
    els.statisticsAnswerRow.append(button);
  });
}

function renderStatisticsCoinStage() {
  els.statisticsCoinBank.replaceChildren();
  const bankVisual = document.createElement("div");
  bankVisual.className = "coin-bank-visual";
  const bankLabel = document.createElement("strong");
  bankLabel.className = "coin-bank-label";
  bankLabel.textContent = "Coin tray";
  bankVisual.append(createCoinTrayIcon(), bankLabel);
  const bankCoins = document.createElement("div");
  bankCoins.className = "coin-bank-dots";
  els.statisticsCoinBank.append(bankVisual, bankCoins);
  els.statisticsCoinShares.replaceChildren();
}

function renderStatisticsAverageOnlyStage() {
  els.statisticsFrequency.replaceChildren();
  els.statisticsOrderZone.replaceChildren();
  renderStatisticsCoinStage();
  renderAverageOnlyResetButton();
  renderAverageOnlySmileyCoins();
}

function renderAverageOnlySmileyCoins() {
  if (state.statisticsStep !== "average-only") return;
  const bankDots = els.statisticsCoinBank.querySelector(".coin-bank-dots");
  if (bankDots) {
    bankDots.replaceChildren(...state.statisticsCoins
      .filter(coin => coin.location === "bank")
      .map(coin => createCoinDot(coin)));
  }
  const nodesById = new Map([...els.tray.querySelectorAll(".smiley")].map(node => [node.dataset.id, node]));
  const rowItems = [];
  state.smileys
    .filter(smiley => smiley.zone === "tray")
    .sort((first, second) => first.placementOrder - second.placementOrder)
    .forEach(smiley => {
      const node = nodesById.get(smiley.id);
      if (!node) return;
      node.querySelector(".smiley-coin-dots")?.remove();
      const pair = document.createElement("div");
      pair.className = "average-pair";
      pair.dataset.smileyId = smiley.id;
      const initialCount = document.createElement("span");
      initialCount.className = "average-initial-count";
      initialCount.textContent = `Start: ${smiley.coins}`;
      initialCount.setAttribute("aria-label", `Started with ${smiley.coins} coins`);
      node.append(initialCount);
      pair.append(node, createAverageCoinPile(smiley));
      rowItems.push(pair);
    });
  if (rowItems.length > 0) {
    els.tray.replaceChildren(...rowItems);
  }
}

function createAverageCoinPile(smiley) {
  const pile = document.createElement("div");
  pile.className = "average-coin-pile";
  pile.dataset.smileyId = smiley.id;
  pile.setAttribute("aria-label", "Coins for smiley");
  state.statisticsCoins
    .filter(coin => coin.location === smiley.id)
    .forEach(coin => pile.append(createCoinDot(coin)));
  return pile;
}

function renderAverageOnlyResetButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "statistics-answer-button average-reset-button";
  button.setAttribute("aria-label", "Reset coins");
  button.title = "Reset coins";
  button.textContent = "↺";
  const icon = document.createElement("span");
  icon.className = "average-reset-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "↺";
  const label = document.createElement("span");
  label.textContent = "Reset coins";
  button.replaceChildren(icon, label);
  button.addEventListener("click", () => {
    initializeAverageOnlyCoins();
    renderStatisticsCoinStage();
    renderAverageOnlyResetButton();
    renderAverageOnlySmileyCoins();
  });
  els.statisticsCoinShares.replaceChildren(button);
}

function renderStatisticsCoins() {
  const bankDots = els.statisticsCoinBank.querySelector(".coin-bank-dots");
  if (bankDots) {
    bankDots.replaceChildren(...state.statisticsCoins
      .filter(coin => coin.location === "bank")
      .map(coin => createCoinDot(coin)));
  }

  els.statisticsOrderZone.querySelectorAll(".smiley").forEach(node => {
    node.querySelector(".smiley-coin-dots")?.remove();
    node.querySelector(".smiley-coin-drop-area")?.remove();
    const dropArea = document.createElement("span");
    dropArea.className = "smiley-coin-drop-area";
    dropArea.dataset.smileyId = node.dataset.id;
    const holder = document.createElement("span");
    holder.className = "smiley-coin-dots";
    state.statisticsCoins
      .filter(coin => coin.location === node.dataset.id)
      .forEach(coin => holder.append(createCoinDot(coin)));
    node.append(dropArea, holder);
  });
}

function createCoinTrayIcon() {
  const icon = document.createElement("div");
  icon.className = "coin-tray-icon";
  icon.setAttribute("aria-hidden", "true");
  const svgNamespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.setAttribute("viewBox", "0 0 120 76");
  svg.setAttribute("focusable", "false");
  const back = document.createElementNS(svgNamespace, "path");
  back.setAttribute("d", "M13 25 Q60 9 107 25 L101 54 Q60 71 19 54 Z");
  back.setAttribute("class", "coin-tray-back");
  const rim = document.createElementNS(svgNamespace, "path");
  rim.setAttribute("d", "M13 25 Q60 42 107 25");
  rim.setAttribute("class", "coin-tray-rim");
  const coins = [[38, 24], [59, 27], [80, 23]].map(([cx, cy]) => {
    const coin = document.createElementNS(svgNamespace, "circle");
    coin.setAttribute("cx", String(cx));
    coin.setAttribute("cy", String(cy));
    coin.setAttribute("r", "9");
    coin.setAttribute("class", "coin-tray-coin");
    return coin;
  });
  svg.append(back, ...coins, rim);
  icon.append(svg);
  return icon;
}

function createCoinDot(coin = null) {
  const dot = document.createElement("span");
  dot.className = "coin-dot";
  if (coin) {
    dot.dataset.coinId = coin.id;
    dot.setAttribute("role", "button");
    dot.tabIndex = 0;
    dot.setAttribute("aria-label", "Coin");
    dot.addEventListener("pointerdown", event => beginStatisticsCoinDrag(event, dot));
  }
  return dot;
}

function beginStatisticsCoinDrag(event, node) {
  event.preventDefault();
  event.stopPropagation();
  if (isCelebrating()) return;
  if (state.dragging || state.smileyDrags.size) {
    cancelActiveDrag();
  }
  const coin = state.statisticsCoins.find(item => item.id === node.dataset.coinId);
  if (!coin) return;
  playInteractionSound("pickup");
  const rect = node.getBoundingClientRect();
  node.setPointerCapture(event.pointerId);
  state.dragging = {
    type: "statistics-coin",
    id: coin.id,
    node,
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    originalLocation: coin.location
  };
  node.style.width = `${rect.width}px`;
  node.style.height = `${rect.height}px`;
  node.classList.add("dragging-coin");
  document.body.append(node);
  document.addEventListener("pointermove", moveStatisticsCoinDrag);
  document.addEventListener("pointerup", endStatisticsCoinDrag);
  document.addEventListener("pointercancel", cancelStatisticsCoinDrag);
  moveStatisticsCoinDrag(event);
}

function moveStatisticsCoinDrag(event) {
  if (!state.dragging || state.dragging.type !== "statistics-coin") return;
  event.preventDefault();
  const { node, offsetX, offsetY } = state.dragging;
  node.style.left = `${event.clientX - offsetX}px`;
  node.style.top = `${event.clientY - offsetY}px`;
  markStatisticsCoinDropTarget(event.clientX, event.clientY);
}

function endStatisticsCoinDrag(event) {
  if (!state.dragging || state.dragging.type !== "statistics-coin") return;
  event.preventDefault();
  const coin = state.statisticsCoins.find(item => item.id === state.dragging.id);
  const target = getStatisticsCoinDropTarget(event.clientX, event.clientY);
  if (coin && target?.type === "bank") {
    coin.location = "bank";
  } else if (coin && target?.type === "smiley") {
    coin.location = target.id;
  } else if (coin) {
    coin.location = state.dragging.originalLocation;
  }
  playInteractionSound(coin && target ? "drop" : "return");
  cleanupStatisticsCoinDrag();
  renderActiveStatisticsCoins();
}

function cancelStatisticsCoinDrag() {
  if (!state.dragging || state.dragging.type !== "statistics-coin") return;
  const coin = state.statisticsCoins.find(item => item.id === state.dragging.id);
  if (coin) {
    coin.location = state.dragging.originalLocation;
  }
  cleanupStatisticsCoinDrag();
  renderActiveStatisticsCoins();
}

function cleanupStatisticsCoinDrag() {
  if (!state.dragging || state.dragging.type !== "statistics-coin") return;
  const { node, pointerId } = state.dragging;
  if (node.hasPointerCapture(pointerId)) {
    node.releasePointerCapture(pointerId);
  }
  document.removeEventListener("pointermove", moveStatisticsCoinDrag);
  document.removeEventListener("pointerup", endStatisticsCoinDrag);
  document.removeEventListener("pointercancel", cancelStatisticsCoinDrag);
  node.classList.remove("dragging-coin");
  node.removeAttribute("style");
  node.remove();
  state.dragging = null;
  clearStatisticsCoinDropMarks();
}

function markStatisticsCoinDropTarget(x, y) {
  clearStatisticsCoinDropMarks();
  const target = getStatisticsCoinDropTarget(x, y);
  if (target?.element) {
    target.element.classList.add("is-over");
  }
}

function clearStatisticsCoinDropMarks() {
  els.statisticsCoinBank.classList.remove("is-over");
  els.statisticsOrderZone.querySelectorAll(".smiley").forEach(node => node.classList.remove("is-over"));
  els.statisticsOrderZone.querySelectorAll(".smiley-coin-drop-area").forEach(node => node.classList.remove("is-over"));
  els.tray.querySelectorAll(".average-coin-pile").forEach(node => node.classList.remove("is-over"));
}

function getStatisticsCoinDropTarget(x, y) {
  if (isPointInsideElement(els.statisticsCoinBank, x, y)) {
    return { type: "bank", element: els.statisticsCoinBank };
  }
  const element = document.elementFromPoint(x, y);
  const averagePile = element?.closest?.(".average-coin-pile");
  if (averagePile) {
    return { type: "smiley", id: averagePile.dataset.smileyId, element: averagePile };
  }
  const averagePair = element?.closest?.(".average-pair");
  if (averagePair) {
    return {
      type: "smiley",
      id: averagePair.dataset.smileyId,
      element: averagePair.querySelector(".average-coin-pile") || averagePair
    };
  }
  if (state.statisticsStep === "average-only" && isPointInsideElement(els.tray, x, y)) {
    const targetPair = [...els.tray.querySelectorAll(".average-pair")]
      .map(pair => {
        const rect = pair.getBoundingClientRect();
        return {
          pair,
          distance: Math.hypot(x - (rect.left + rect.width / 2), y - (rect.top + rect.height / 2))
        };
      })
      .sort((first, second) => first.distance - second.distance)[0]?.pair;
    if (targetPair) {
      return {
        type: "smiley",
        id: targetPair.dataset.smileyId,
        element: targetPair.querySelector(".average-coin-pile") || targetPair
      };
    }
  }
  const dropArea = element?.closest?.(".smiley-coin-drop-area");
  if (dropArea) {
    return { type: "smiley", id: dropArea.dataset.smileyId, element: dropArea };
  }
  const smiley = element?.closest?.(".statistics-order-zone .smiley");
  if (smiley) {
    return { type: "smiley", id: smiley.dataset.id, element: smiley.querySelector(".smiley-coin-drop-area") || smiley };
  }
  return null;
}

function renderActiveStatisticsCoins() {
  if (state.statisticsStep === "average-only") {
    renderAverageOnlySmileyCoins();
    return;
  }
  renderStatisticsCoins();
}

function validateStatistics() {
  if (state.statisticsStep === "beard-frequency") {
    validateStatisticsFrequency();
    return;
  }
  if (state.statisticsStep === "beard-ranking") {
    validateStatisticsOrder();
    return;
  }
  if (state.statisticsStep === "coins") {
    if (state.statisticsCoinStep === "average-question" || state.statisticsCoinStep === "average-review") {
      validateStatisticsCoinAverageGuess();
      return;
    }
    if (state.statisticsCoinStep === "total-question") {
      validateStatisticsCoinTotalGuess();
      return;
    }
    if (!state.statisticsCoinsDistributed) {
      validateStatisticsCoinsDistributed();
      return;
    }
    return;
  }
  if (state.statisticsStep === "average-only") {
    validateStatisticsAverageOnlyAnswer();
    return;
  }
  validateStatisticsAnswer();
}

function validateStatisticsFrequency() {
  const allSorted = state.smileys.every(smiley => smiley.zone.startsWith("statistics-beard-"));
  const isCorrect = allSorted && state.smileys.every(smiley => smiley.zone === `statistics-beard-${smiley.beardLevel}`);
  if (!isCorrect) {
    state.statisticsHadMistake = true;
    registerMistake({ returnSmileys: true });
    return;
  }
  resetMistakeCounter();
  state.statisticsStep = "beard-questions";
  state.statisticsQuestionIndex = 0;
  state.statisticsAnswer = null;
  state.nextPlacementOrder = 1;
  startStatisticsPhase(collectSmileyRects());
}

function validateStatisticsOrder() {
  const ordered = getStatisticsOrderedSmileys();
  const isCorrect = ordered.length === state.smileys.length &&
    ordered.every((smiley, index, items) => index === 0 || items[index - 1].beardLevel >= smiley.beardLevel);
  if (!isCorrect) {
    state.statisticsHadMistake = true;
    registerMistake();
    return;
  }
  resetMistakeCounter();
  state.statisticsStep = "ranking-questions";
  state.statisticsQuestionIndex = 0;
  state.statisticsAnswer = null;
  renderStatistics();
  renderSmileys();
}

function validateStatisticsAnswer() {
  const expected = getCurrentStatisticsAnswer();
  if (state.statisticsAnswer !== expected) {
    state.statisticsHadMistake = true;
    registerMistake();
    return;
  }
  resetMistakeCounter();
  state.statisticsAnswer = null;

  if (state.statisticsStep === "beard-questions") {
    const questions = getStatisticsBeardQuestions();
    if (state.statisticsQuestionIndex + 1 < questions.length) {
      state.statisticsQuestionIndex += 1;
      renderStatistics();
      renderSmileys();
      return;
    }
    state.statisticsStep = "beard-ranking";
    state.statisticsQuestionIndex = 0;
    state.nextPlacementOrder = 1;
    startStatisticsPhase(collectSmileyRects());
    renderSmileys();
    return;
  }

  if (state.statisticsStep === "ranking-questions") {
    const questions = getStatisticsRankingQuestions();
    if (state.statisticsQuestionIndex + 1 < questions.length) {
      state.statisticsQuestionIndex += 1;
      renderStatistics();
      renderSmileys();
      return;
    }
    state.statisticsStep = "coins";
    state.smileys = addBeardLengthCoins(state.smileys);
    initializeStatisticsCoins();
    state.statisticsCoinStep = "average-question";
    state.statisticsCoinsDistributed = false;
    state.statisticsQuestionIndex = 0;
    state.statisticsAnswer = null;
    renderStatistics();
    renderSmileys();
    return;
  }
}

function validateStatisticsCoinsDistributed() {
  const mean = getStatisticsCoinMean();
  const ordered = getStatisticsOrderedSmileys();
  const isCorrect = ordered.every(smiley => countStatisticsCoinsAt(smiley.id) === mean) &&
    countStatisticsCoinsAt("bank") === 0;
  if (!isCorrect) {
    state.statisticsHadMistake = true;
    registerMistake();
    return;
  }
  resetMistakeCounter();
  state.statisticsCoinsDistributed = true;
  state.statisticsAnswer = null;
  state.statisticsCoinStep = "average-review";
  renderStatistics();
  renderSmileys();
}

function validateStatisticsCoinAverageGuess() {
  if (state.statisticsAnswer === getStatisticsCoinMean()) {
    resetMistakeCounter();
    finishSet(collectSmileyRects());
    return;
  }
  if (state.statisticsCoinStep === "average-review") {
    state.statisticsHadMistake = true;
    registerMistake();
    return;
  }
  resetMistakeCounter();
  state.statisticsAnswer = null;
  state.statisticsCoinStep = "total-question";
  renderStatistics();
  renderSmileys();
}

function validateStatisticsAverageOnlyAnswer() {
  if (state.statisticsAnswer !== getStatisticsCoinMean()) {
    state.statisticsHadMistake = true;
    registerMistake();
    return;
  }
  resetMistakeCounter();
  finishSet(collectSmileyRects());
}

function validateStatisticsCoinTotalGuess() {
  if (state.statisticsAnswer !== getStatisticsCoinTotal()) {
    state.statisticsHadMistake = true;
    registerMistake();
    return;
  }
  resetMistakeCounter();
  state.statisticsAnswer = null;
  state.statisticsCoinStep = "spreading";
  renderStatistics();
  renderSmileys();
}

function getCurrentStatisticsAnswer() {
  if (state.statisticsStep === "beard-questions") {
    return getStatisticsBeardQuestions()[state.statisticsQuestionIndex].answer;
  }
  if (state.statisticsStep === "ranking-questions") {
    return getStatisticsRankingQuestions()[state.statisticsQuestionIndex].answer;
  }
  return null;
}

function getStatisticsBeardQuestions() {
  const shortest = Math.min(...state.smileys.map(smiley => smiley.beardLevel));
  const longest = Math.max(...state.smileys.map(smiley => smiley.beardLevel));
  const mode = getBeardModeValue(state.smileys);
  const choices = BEARD_LEVELS.map(level => ({ label: level.label, value: level.value }));
  return [
    { prompt: "Choose the beard icon that appears most.", answer: mode, choices },
    { prompt: "Choose the longest beard icon that exists.", answer: longest, choices },
    { prompt: "Choose the shortest beard icon that exists.", answer: shortest, choices }
  ];
}

function getStatisticsRankingQuestions() {
  const ordered = getStatisticsOrderedSmileys();
  const beardChoices = BEARD_LEVELS.map(level => ({ label: level.label, value: level.value }));
  const median = ordered[Math.floor(ordered.length / 2)];
  return [
    { prompt: "Choose the median beard icon.", answer: median?.beardLevel, choices: beardChoices }
  ];
}

function getStatisticsCoinMean() {
  return state.smileys.reduce((sum, smiley) => sum + smiley.coins, 0) / state.smileys.length;
}

function getStatisticsCoinTotal() {
  return state.smileys.reduce((sum, smiley) => sum + smiley.coins, 0);
}

function countStatisticsCoinsAt(location) {
  return state.statisticsCoins.filter(coin => coin.location === location).length;
}

function renderStatisticsCoinAverageQuestion() {
  els.statisticsQuestion.textContent = "What is the average number of coins?";
  renderStatisticsAnswerChoices(getStatisticsCoinAverageAnswerChoices(), getStatisticsCoinMean());
}

function renderStatisticsAverageOnlyQuestion() {
  els.statisticsQuestion.textContent = "What is the average number of coins?";
  renderStatisticsAnswerChoices(getStatisticsAverageOnlyAnswerChoices(), getStatisticsCoinMean());
}

function renderStatisticsCoinTotalQuestion() {
  els.statisticsQuestion.textContent = "How many coins are there altogether?";
  renderStatisticsAnswerChoices(getStatisticsCoinTotalAnswerChoices(), getStatisticsCoinTotal());
}

function getStatisticsCoinAverageAnswerChoices() {
  const answer = getStatisticsCoinMean();
  const values = new Set([answer]);
  while (values.size < 3) {
    values.add(Math.max(1, answer + Math.floor(Math.random() * 7) - 3));
  }
  return [
    ...[...values].sort((first, second) => first - second).map(value => ({ label: String(value), value })),
    { label: "doesn't know", value: "unknown" }
  ];
}

function getStatisticsAverageOnlyAnswerChoices() {
  const answer = getStatisticsCoinMean();
  const values = new Set([answer]);
  while (values.size < 4) {
    values.add(Math.max(1, answer + Math.floor(Math.random() * 7) - 3));
  }
  return [...values].sort((first, second) => first - second).map(value => ({ label: String(value), value }));
}

function getStatisticsCoinTotalAnswerChoices() {
  const answer = getStatisticsCoinTotal();
  const values = new Set([answer]);
  while (values.size < 4) {
    values.add(Math.max(1, answer + Math.floor(Math.random() * 9) - 4));
  }
  return [...values].sort((first, second) => first - second).map(value => ({ label: String(value), value }));
}

function initializeStatisticsCoins() {
  state.statisticsCoins = [];
  getStatisticsOrderedSmileys().forEach(smiley => {
    for (let index = 0; index < smiley.coins; index += 1) {
      state.statisticsCoins.push({
        id: `coin-${smiley.id}-${index}`,
        location: smiley.id
      });
    }
  });
}

function initializeAverageOnlyCoins() {
  state.statisticsCoins = [];
  state.smileys.forEach(smiley => {
    for (let index = 0; index < smiley.coins; index += 1) {
      state.statisticsCoins.push({
        id: `coin-${smiley.id}-${index}`,
        location: smiley.id
      });
    }
  });
}

function getStatisticsOrderedSmileys() {
  return state.smileys
    .filter(smiley => smiley.zone === "statistics-order")
    .sort((first, second) => first.placementOrder - second.placementOrder);
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
  els.statisticsPanel.classList.add("hidden");
  resetCountChallenge();
  els.carrollPanel.classList.remove("hidden");
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  els.countingPanel?.classList.add("hidden");
  els.trayLabel.textContent = "";
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
  els.statisticsPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  els.countingPanel?.classList.add("hidden");
  resetCountChallenge();
  els.comparePanel.classList.remove("hidden");
  els.trayLabel.textContent = "";
  els.tray.replaceChildren();
  setHeader("Compare");
  els.submitSortButton.textContent = "OK";
  unlockSubmitButton();
  renderCompare();
  startComparisonIconTutorial("compare");
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

function startComparisonIconTutorial(kind) {
  const flag = kind === "compare" ? "compareTutorialShown" : "simpleCompareTutorialShown";
  if (state[flag]) return;
  state[flag] = true;
  const selector = kind === "compare"
    ? "#compareCriteriaBank .compare-criterion-card"
    : "#simpleCompareTable .simple-mark-button";
  const target = document.querySelector(selector);
  if (!target) return;

  const sequence = ++comparisonTutorialSequence;
  const pointer = document.createElement("span");
  pointer.className = "comparison-tutorial-pointer";
  pointer.setAttribute("aria-hidden", "true");
  target.classList.add("is-comparison-tutorial");
  target.append(pointer);

  const scheduleStep = (delay, callback) => {
    scheduleCycleTimer(() => {
      if (sequence !== comparisonTutorialSequence || !target.isConnected) return;
      callback();
    }, delay);
  };

  scheduleStep(700, () => target.classList.add("tutorial-shows-x", "is-tutorial-tapped"));
  scheduleStep(1550, () => target.classList.remove("tutorial-shows-x", "is-tutorial-tapped"));
  scheduleStep(2050, () => stopComparisonIconTutorial());
}

function stopComparisonIconTutorial() {
  comparisonTutorialSequence += 1;
  document.querySelectorAll(".is-comparison-tutorial").forEach(target => {
    target.classList.remove("is-comparison-tutorial", "is-tutorial-tapped", "tutorial-shows-x");
    target.querySelector(".comparison-tutorial-pointer")?.remove();
  });
}

function beginCompareCriteriaDrag(event, node) {
  event.preventDefault();
  stopComparisonIconTutorial();
  if (isCelebrating()) return;
  if (state.dragging || state.smileyDrags.size) {
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
    moved: false,
    soundStarted: false
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
  if (state.dragging.moved && !state.dragging.soundStarted) {
    state.dragging.soundStarted = true;
    playInteractionSound("pickup");
  }
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
    const willShowX = !state.compareVisualX[dragged.featureKey];
    setCompareVisualX(dragged.featureKey, willShowX);
    playInteractionSound(willShowX ? "mark" : "unmark");
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
    const previousZone = state.comparePlacements[dragged.featureKey] || "bank";
    if (zone === "bank") {
      delete state.comparePlacements[dragged.featureKey];
    } else {
      state.comparePlacements[dragged.featureKey] = zone;
    }
    playInteractionSound(zone === "bank"
      ? (previousZone === "bank" ? "return" : "remove")
      : "drop");
  } else {
    playInteractionSound("return");
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
  els.statisticsPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.comparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  els.countingPanel?.classList.add("hidden");
  resetCountChallenge();
  els.simpleComparePanel.classList.remove("hidden");
  els.trayLabel.textContent = "";
  els.tray.replaceChildren();
  setHeader("Easy Compare");
  els.submitSortButton.textContent = "OK";
  unlockSubmitButton();
  renderSimpleCompare();
  startComparisonIconTutorial("simple");
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
  relationHead.setAttribute("role", "button");
  relationHead.setAttribute("tabindex", "0");
  relationHead.setAttribute("aria-label", "Change relation display");
  relationHead.setAttribute("title", "Change relation display");
  relationHead.append(createRelationModeSummary());
  relationHead.addEventListener("click", cycleRelationDisplayMode);
  relationHead.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    cycleRelationDisplayMode();
  });
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
        stopComparisonIconTutorial();
        playInteractionSound(value ? "mark" : "unmark");
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
    relationButton.replaceChildren(createRelationIcon(relation));
    relationButton.classList.toggle("is-different", relation === "different");
    relationButton.addEventListener("click", () => {
      stopComparisonIconTutorial();
      playInteractionSound(relation === "different" ? "unmark" : "mark");
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
  const answerFadeMs = 360;
  lockSubmitButton();
  setPairShiftDistance(els.simpleCompareTable, ".simple-face-head .smiley");
  els.simpleCompareTable.classList.add("simple-first-exiting");
  window.setTimeout(() => {
    state.simpleCompareSmileys = makeNextSimpleComparePair();
    els.simpleCompareTable.classList.remove("simple-first-exiting");
    els.simpleCompareTable.classList.add("simple-pair-reforming");
    renderSimpleCompare();
    window.setTimeout(() => {
      els.simpleCompareTable.classList.remove("simple-pair-reforming");
      els.simpleCompareTable.classList.add("simple-answers-fading");
      window.setTimeout(() => {
        state.simpleCompareMarks = {};
        els.simpleCompareTable.classList.remove("simple-answers-fading");
        renderSimpleCompare();
        els.simpleCompareTable.style.removeProperty("--pair-shift-x");
        unlockSubmitButton();
      }, answerFadeMs);
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
  els.cameraButton.disabled = false;
  els.sortTable.classList.add("hidden");
  els.orderingPanel.classList.add("hidden");
  els.statisticsPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  els.countingPanel?.classList.add("hidden");
  resetCountChallenge();
  els.permutationPanel.classList.remove("hidden");
  els.trayLabel.textContent = "";
  els.tray.replaceChildren();
  setHeader("Album", `${state.permutationAlbum.length} of ${getPermutationGoal()}`);
  els.submitSortButton.textContent = "OK";
  lockSubmitButton();
  renderPermutationAlbum();
  renderSmileys();
}

function startPairCombinationPhase() {
  state.phase = "pair-combination";
  resetMistakeCounter();
  state.nextPlacementOrder = state.smileys.length;
  els.sortTable.classList.add("hidden");
  els.orderingPanel.classList.add("hidden");
  els.statisticsPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  els.countingPanel?.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  resetCountChallenge();
  els.pairCombinationPanel.classList.remove("hidden");
  els.trayLabel.textContent = "";
  els.tray.replaceChildren();
  setHeader("Pairs", `${state.pairCombinationAlbum.length} of ${getPairCombinationGoal()}`);
  els.submitSortButton.textContent = "OK";
  lockSubmitButton();
  renderPairCombinationAlbum();
  renderSmileys();
}

function startTeamPhase() {
  state.phase = "team";
  [els.sortTable, els.orderingPanel, els.statisticsPanel, els.carrollPanel, els.comparePanel,
    els.simpleComparePanel, els.selectionPanel, els.creatorPanel, els.vennPanel,
    els.implicitPanel, els.countingPanel, els.permutationPanel, els.pairCombinationPanel]
    .forEach(panel => panel?.classList.add("hidden"));
  els.teamPanel.classList.remove("hidden");
  els.tray.replaceChildren();
  els.trayLabel.textContent = "";
  const [teamSize, poolSize] = TEAM_PROGRESSION[state.teamLevel];
  els.teamTitle.textContent = `Choose ${teamSize} from ${poolSize}`;
  setHeader(`Choose ${teamSize} from ${poolSize}`, `${state.teamAlbum.length} of ${getTeamGoal()}`);
  els.submitSortButton.textContent = "OK";
  lockSubmitButton();
  renderTeamAlbum();
  renderSmileys();
}

function getCurrentTeam() {
  return state.smileys.filter(smiley => smiley.zone === "team-capture");
}

function getTeamPhotoKey(team = getCurrentTeam()) {
  return team.map(smiley => smiley.id).sort().join("|");
}

function updateTeamCameraState() {
  if (state.phase !== "team") return;
  const [teamSize] = TEAM_PROGRESSION[state.teamLevel];
  const team = getCurrentTeam();
  els.teamCameraButton.disabled = team.length !== teamSize;
  els.teamCameraButton.title = "";
}

function captureTeamPhoto() {
  if (state.phase !== "team") return;
  const [teamSize] = TEAM_PROGRESSION[state.teamLevel];
  const team = getCurrentTeam();
  if (team.length !== teamSize) return;
  const order = team.map(smiley => smiley.id).sort();
  const key = getTeamPhotoKey(team);
  if (state.teamAlbum.some(photo => photo.key === key)) {
    state.teamHadMistake = true;
    const previousPhoto = els.teamAlbumPages.querySelector(`.album-photo[data-team-key="${CSS.escape(key)}"]`);
    if (previousPhoto) {
      previousPhoto.classList.remove("wiggle");
      window.requestAnimationFrame(() => previousPhoto.classList.add("wiggle"));
      previousPhoto.addEventListener("animationend", () => previousPhoto.classList.remove("wiggle"), { once: true });
    }
    if (navigator.vibrate) navigator.vibrate(80);
    return;
  }
  state.teamAlbum.push({ key, order });
  renderTeamAlbum();
  els.teamCameraButton.disabled = true;
  els.workPanel.classList.add("photo-holding");
  setProgress(`${state.teamAlbum.length} of ${getTeamGoal()}`);
  scheduleCycleTimer(() => {
    if (state.phase !== "team") return;
    const previousRects = collectSmileyRects();
    team.forEach(smiley => {
      smiley.zone = "team-source";
      smiley.placementOrder = smiley.originalOrder;
    });
    renderSmileys();
    animateSmileysFrom(previousRects, null, "photo");
    scheduleCycleTimer(() => {
      if (state.phase !== "team") return;
      els.workPanel.classList.remove("photo-holding");
      updateTeamCameraState();
      if (state.teamAlbum.length >= getTeamGoal()) {
        els.teamCameraButton.disabled = true;
        unlockSubmitButton();
      }
    }, PHOTO_RETURN_MS);
  }, PHOTO_PREVIEW_MS);
}

function renderTeamAlbum() {
  els.teamAlbumPages.replaceChildren();
  const goal = getTeamGoal();
  for (let pageIndex = 0; pageIndex < Math.ceil(goal / 6); pageIndex += 1) {
    const page = document.createElement("div");
    page.className = "album-page";
    for (let index = 0; index < 6; index += 1) {
      const photoIndex = pageIndex * 6 + index;
      if (photoIndex >= goal) break;
      const slot = document.createElement("div");
      slot.className = "album-photo";
      const photo = state.teamAlbum[photoIndex];
      if (photo) {
        slot.classList.add("has-photo");
        slot.dataset.teamKey = photo.key;
        photo.order.forEach(smileyId => {
          const smiley = state.smileys.find(item => item.id === smileyId);
          if (!smiley) return;
          const node = createSmileyNode({ ...smiley, id: `team-photo-${photoIndex}-${smiley.id}` });
          node.classList.add("photo-smiley");
          slot.append(node);
        });
      }
      page.append(slot);
    }
    els.teamAlbumPages.append(page);
  }
}

function completeTeamAlbum() {
  state.phase = "celebrating";
  els.teamCameraButton.disabled = true;
  lockSubmitButton();
  els.workPanel.classList.add("is-celebrating", "smileys-wiggling");
  celebrateCycle(CYCLE_CELEBRATION_MS);
  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("smileys-wiggling");
    const nextLevel = (state.teamLevel + 1) % TEAM_PROGRESSION.length;
    const nextPoolSize = TEAM_PROGRESSION[nextLevel][1];
    state.departingSmileyIds = state.smileys
      .slice(nextPoolSize)
      .map(smiley => smiley.id);
    state.departingSmileyIds.forEach(id => {
      const node = els.teamSourceZone.querySelector(`[data-id="${CSS.escape(id)}"]`);
      if (!node) return;
      node.classList.add("is-cycle-departing");
      const hand = document.createElement("span");
      hand.className = "goodbye-hand";
      hand.textContent = "👋";
      hand.setAttribute("aria-hidden", "true");
      node.append(hand);
    });
    els.workPanel.classList.add("smileys-exiting");
  }, CYCLE_CELEBRATION_MS);
  const nextLevel = (state.teamLevel + 1) % TEAM_PROGRESSION.length;
  const removesSmileys = TEAM_PROGRESSION[nextLevel][1] < state.smileys.length;
  const exitDuration = removesSmileys ? ROOM_EXIT_MS : CYCLE_EXIT_MS;
  scheduleCycleTimer(() => {
    startTeamMission(false, true);
    state.departingSmileyIds = [];
    els.workPanel.classList.remove("is-celebrating", "smileys-exiting");
    els.workPanel.classList.add("cycle-fading-in");
  }, CYCLE_CELEBRATION_MS + exitDuration);
  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("cycle-fading-in");
    state.enteringSmileyIds = [];
  }, CYCLE_CELEBRATION_MS + exitDuration + CYCLE_ENTER_MS);
}

function getTeamGoal() {
  const [teamSize, poolSize] = TEAM_PROGRESSION[state.teamLevel];
  return factorial(poolSize) / (factorial(teamSize) * factorial(poolSize - teamSize));
}

function renderPairCombinationAlbum() {
  els.pairAlbumPages.replaceChildren();
  const page = document.createElement("div");
  page.className = "album-page";
  page.style.setProperty("--album-columns", "2");
  for (let index = 0; index < 6; index += 1) {
    const photo = state.pairCombinationAlbum[index];
    const slot = document.createElement("div");
    slot.className = "album-photo";
    if (photo) {
      slot.classList.add("has-photo");
      slot.dataset.pairKey = photo.key;
      if (index === state.pairCombinationAlbum.length - 1) {
        slot.classList.add("pair-photo-entering");
        slot.addEventListener("animationend", () => slot.classList.remove("pair-photo-entering"), { once: true });
      }
      photo.order.forEach(smileyId => {
        const smiley = state.smileys.find(item => item.id === smileyId);
        if (!smiley) return;
        const node = createSmileyNode({ ...smiley, id: `pair-photo-${index}-${smiley.id}` });
        node.classList.add("photo-smiley");
        slot.append(node);
      });
    }
    page.append(slot);
  }
  els.pairAlbumPages.append(page);
}

function getPairCombinationOrder() {
  return state.smileys
    .filter(smiley => smiley.zone === "pair-capture")
    .sort((first, second) => first.pairSource.localeCompare(second.pairSource));
}

function updatePairCombinationCameraState() {
  if (!els.pairCameraButton || state.phase !== "pair-combination") return;
  const pair = getPairCombinationOrder();
  els.pairCameraButton.disabled = pair.length !== 2 ||
    new Set(pair.map(smiley => smiley.pairSource)).size !== 2;
}

function capturePairCombinationPhoto() {
  if (state.phase !== "pair-combination") return;
  const pair = getPairCombinationOrder();
  if (pair.length !== 2 || new Set(pair.map(smiley => smiley.pairSource)).size !== 2) return;
  const key = pair.map(smiley => smiley.id).join("|");
  const existing = state.pairCombinationAlbum.find(photo => photo.key === key);
  if (existing) {
    state.pairCombinationHadMistake = true;
    const previousPhoto = els.pairAlbumPages.querySelector(`.album-photo[data-pair-key="${CSS.escape(key)}"]`);
    if (previousPhoto) {
      previousPhoto.classList.remove("wiggle");
      window.requestAnimationFrame(() => previousPhoto.classList.add("wiggle"));
      previousPhoto.addEventListener("animationend", () => previousPhoto.classList.remove("wiggle"), { once: true });
    }
    if (navigator.vibrate) navigator.vibrate(80);
    return;
  }
  state.pairCombinationAlbum.push({ key, order: pair.map(smiley => smiley.id) });
  renderPairCombinationAlbum();
  els.pairCameraButton.disabled = true;
  els.workPanel.classList.add("photo-holding");
  setProgress(`${state.pairCombinationAlbum.length} of ${getPairCombinationGoal()}`);
  scheduleCycleTimer(() => {
    if (state.phase !== "pair-combination") return;
    const previousRects = collectSmileyRects();
    pair.forEach(smiley => {
      smiley.zone = `pair-source-${smiley.pairSource}`;
      smiley.placementOrder = smiley.originalOrder;
    });
    renderSmileys();
    animateSmileysFrom(previousRects, null, "photo");
    scheduleCycleTimer(() => {
      if (state.phase !== "pair-combination") return;
      els.workPanel.classList.remove("photo-holding");
      updatePairCombinationCameraState();
      if (state.pairCombinationAlbum.length >= getPairCombinationGoal()) {
        els.pairCameraButton.disabled = true;
        if (state.phase === "pair-combination" &&
            state.pairCombinationAlbum.length >= getPairCombinationGoal()) {
          unlockSubmitButton();
        }
      }
    }, PHOTO_RETURN_MS);
  }, PHOTO_PREVIEW_MS);
}

function completePairCombinationAlbum() {
  resetMistakeCounter();
  state.phase = "celebrating";
  els.pairCameraButton.disabled = true;
  lockSubmitButton();
  els.workPanel.classList.add("is-celebrating", "smileys-wiggling");
  celebrateCycle(CYCLE_CELEBRATION_MS);
  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("smileys-wiggling");
    markAllCurrentSmileysDeparting();
    els.workPanel.classList.add("smileys-exiting");
  }, CYCLE_CELEBRATION_MS);
  scheduleCycleTimer(() => {
    startPairCombinationMission(false);
    state.departingSmileyIds = [];
    state.enteringSmileyIds = state.smileys.map(smiley => smiley.id);
    renderSmileys();
    els.workPanel.classList.remove("is-celebrating", "smileys-exiting");
    els.workPanel.classList.add("cycle-fading-in");
  }, CYCLE_CELEBRATION_MS + ROOM_EXIT_MS);
  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("cycle-fading-in");
    state.enteringSmileyIds = [];
  }, CYCLE_CELEBRATION_MS + ROOM_EXIT_MS + CYCLE_ENTER_MS);
}

function markAllCurrentSmileysDeparting() {
  state.departingSmileyIds = state.smileys.map(smiley => smiley.id);
  state.departingSmileyIds.forEach(id => {
    const node = els.workPanel.querySelector(`.smiley[data-id="${CSS.escape(id)}"]`);
    if (!node) return;
    node.classList.add("is-cycle-departing");
    const hand = document.createElement("span");
    hand.className = "goodbye-hand";
    hand.textContent = "👋";
    hand.setAttribute("aria-hidden", "true");
    node.append(hand);
  });
}

function getPairCombinationSmileyCount() {
  return state.pairCombinationGroupSizes[0] + state.pairCombinationGroupSizes[1];
}

function getPairCombinationGoal() {
  return state.pairCombinationGroupSizes[0] * state.pairCombinationGroupSizes[1];
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
  if (state.dragging || state.smileyDrags.size) {
    cancelActiveDrag();
  }
  playInteractionSound("pickup");
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
  prepareTouchDragLift(dragNode, event);
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
  playInteractionSound(target && draggedPhoto ? "drop" : "return");
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
  els.cameraButton.disabled = true;
  els.workPanel.classList.add("photo-holding");
  setProgress(`${state.permutationAlbum.length} of ${getPermutationGoal()}`);
  scheduleCycleTimer(() => {
    if (state.phase !== "permutation") return;
    els.workPanel.classList.remove("photo-holding");
    if (state.permutationAlbum.length >= getPermutationGoal()) {
      els.cameraButton.disabled = true;
      unlockSubmitButton();
    } else {
      els.cameraButton.disabled = false;
    }
  }, PHOTO_PREVIEW_MS);
}

function completePermutationAlbum() {
  recordCleanProgress(!state.permutationHadMistake, "permutationCleanWins", "permutationLevel");
  resetMistakeCounter();
  state.phase = "celebrating";
  els.cameraButton.disabled = true;
  lockSubmitButton();
  els.workPanel.classList.add("is-celebrating", "smileys-wiggling");
  celebrateCycle(CYCLE_CELEBRATION_MS);
  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("smileys-wiggling");
    markAllCurrentSmileysDeparting();
    els.workPanel.classList.add("smileys-exiting");
  }, CYCLE_CELEBRATION_MS);
  scheduleCycleTimer(() => {
    startPermutationMission(false);
    state.departingSmileyIds = [];
    state.enteringSmileyIds = state.smileys.map(smiley => smiley.id);
    renderSmileys();
    els.workPanel.classList.remove("is-celebrating");
    els.workPanel.classList.remove("smileys-exiting");
    els.workPanel.classList.add("cycle-fading-in");
  }, CYCLE_CELEBRATION_MS + ROOM_EXIT_MS);
  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("cycle-fading-in");
    state.enteringSmileyIds = [];
  }, CYCLE_CELEBRATION_MS + ROOM_EXIT_MS + CYCLE_ENTER_MS);
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
  for (let value = 2; value <= count; value += 1) total *= value;
  return total;
}

function startSelectionPhase(previousRects = null) {
  state.phase = "selection";
  clearVennLighting(els.vennStage);
  resetMistakeCounter();
  els.sortTable.classList.add("hidden");
  els.orderingPanel.classList.add("hidden");
  els.statisticsPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  els.countingPanel?.classList.add("hidden");
  resetCountChallenge();
  els.vennPanel.classList.remove("hidden");
  els.selectionPanel.classList.remove("hidden");
  els.trayLabel.textContent = "";
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
  renderSelectionFeedback();
  const modeToggle = document.querySelector("#selectionSkipTutorialButton");
  const playMode = isSelectionPlayMode();
  modeToggle?.classList.toggle("is-play-mode", playMode);
  modeToggle?.setAttribute("aria-pressed", String(playMode));
  modeToggle?.setAttribute("aria-label", playMode ? "Play mode. Switch to tutorial mode" : "Tutorial mode. Switch to play mode");
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
    const category = document.createElement("span");
    category.className = "selection-feature-with-marker";
    category.append(createFeatureIcon(feature, !expected));
    const marker = document.createElement("span");
    marker.className = "selection-feature-marker";
    marker.setAttribute("aria-hidden", "true");
    category.append(marker);
    wrapper.append(category);
  });
  return wrapper;
}

function renderSelectionFeedback() {
  if (state.phase !== "selection") return;
  const rule = state.selectionSourceRule;
  const wrappers = [...els.selectionCaption.querySelectorAll(".selection-icon-group")];
  wrappers.forEach(wrapper => {
    wrapper.classList.remove("is-violated", "is-complete");
    wrapper.querySelectorAll(".selection-feature-with-marker").forEach(category => {
      category.classList.remove("is-violated", "is-complete");
    });
  });
  if (!rule || !["and", "or"].includes(rule.type)) return;

  const selected = state.smileys.filter(smiley => smiley.zone === "selection-target");
  if (rule.type === "and") {
    const wrapper = wrappers[0];
    let hasViolation = false;
    rule.checks.forEach((check, index) => {
      const violated = selected.some(smiley => Boolean(check.feature.get(smiley)) !== check.expected);
      wrapper?.querySelectorAll(".selection-feature-with-marker")[index]?.classList.toggle("is-violated", violated);
      hasViolation ||= violated;
    });
    wrapper?.classList.toggle("is-violated", hasViolation);
    if (hasViolation) restartSelectionAnimation(wrapper, "is-wiggling");
    return;
  }

  rule.displayGroups.forEach((group, index) => {
    const matching = state.smileys.filter(smiley =>
      group.every(({ feature, expected }) => Boolean(feature.get(smiley)) === expected)
    );
    const complete = matching.length > 0 && matching.every(smiley => smiley.zone === "selection-target");
    const wrapper = wrappers[index];
    if (!wrapper || !complete) return;
    wrapper.classList.add("is-complete");
    wrapper.querySelector(".selection-feature-with-marker")?.classList.add("is-complete");
    restartSelectionAnimation(wrapper, "is-happy");
  });
}

function restartSelectionAnimation(node, className) {
  if (!node || node.classList.contains(className)) return;
  node.classList.add(className);
  node.addEventListener("animationend", () => node.classList.remove(className), { once: true });
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
    finishSelectionCycle();
    return;
  }

  state.selectionHadMistake = true;
  state.selectionCleanWins = 0;
  registerMistake();
  if (state.submitMistakeStreak >= 3 && !state.returnAfterErrorPending) {
    state.returnAfterErrorPending = true;
    const previousRects = collectSmileyRects();
    const wrongIds = new Set(getWrongSmileyIds());
    state.smileys.forEach(smiley => {
      if (!wrongIds.has(smiley.id)) return;
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
  els.statisticsPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  els.countingPanel?.classList.add("hidden");
  resetCountChallenge();
  els.creatorPanel.classList.remove("hidden");
  els.trayLabel.textContent = "Criteria";
  els.tray.replaceChildren();
  setHeader("Create");
  els.submitSortButton.textContent = "OK";
  unlockSubmitButton();
  renderCreator();
}

function renderCreator(newCreatedId = null) {
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
  playInteractionSound("pickup");
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
  const placed = isPointInsideElement(els.creatorSmileyTarget, event.clientX, event.clientY);
  if (placed) {
    applyCreatorFeature(state.dragging.featureKey);
  }
  playInteractionSound(placed ? "drop" : "return");
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
  clearVennLighting(els.vennStage);
  resetMistakeCounter();
  state.nextPlacementOrder = 1;
  resetVennZonesForLayout();
  state.smileys.forEach(smiley => {
    smiley.zone = "tray";
    smiley.placementOrder = smiley.originalOrder;
  });
  els.sortTable.classList.add("hidden");
  els.orderingPanel.classList.add("hidden");
  els.statisticsPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  resetCountChallenge();
  els.vennPanel.classList.remove("hidden");
  els.implicitPanel.classList.add("hidden");
  els.countingPanel?.classList.add("hidden");
  els.trayLabel.textContent = "";
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

function startNestedPhase(previousRects = null) {
  state.phase = "nested";
  resetMistakeCounter();
  state.nextPlacementOrder = 1;
  state.smileys.forEach(smiley => {
    smiley.zone = "tray";
    smiley.placementOrder = smiley.originalOrder;
  });
  [els.nestedOuterZone, els.nestedInnerZone, els.nestedOutsideZone].forEach(zone => {
    zone.replaceChildren();
    zone.classList.remove("is-over", "shake", "tilt-reject");
  });
  els.sortTable.classList.add("hidden");
  els.orderingPanel.classList.add("hidden");
  els.statisticsPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  els.countingPanel?.classList.add("hidden");
  resetCountChallenge();
  els.nestedPanel.classList.remove("hidden");
  els.trayLabel.textContent = "";
  renderNestedHeadlines();
  setHeader("Nested Sets", `${state.setCycle + 1} of ${state.reuseGoal}`);
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

function startCountingPhase(previousRects = null) {
  state.phase = "counting";
  clearVennLighting(els.countingStage);
  resetMistakeCounter();
  state.countingAnswer = null;
  state.nextPlacementOrder = 1;
  state.smileys.forEach(smiley => {
    smiley.zone = "tray";
    smiley.placementOrder = smiley.originalOrder;
  });
  els.sortTable.classList.add("hidden");
  els.orderingPanel.classList.add("hidden");
  els.statisticsPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.implicitPanel.classList.add("hidden");
  resetCountChallenge();
  resetCountingZonesForLayout();
  els.countingPanel?.classList.remove("hidden");
  els.trayLabel.textContent = "";
  setHeader("Counting", `${state.setCycle + 1} of ${state.reuseGoal}`);
  els.submitSortButton.textContent = "OK";
  unlockSubmitButton();
  renderCounting();
  renderSmileys();
  if (previousRects) {
    animateSmileysFrom(previousRects);
  }
}

function resetCountingZonesForLayout() {
  [
    els.countingAClue,
    els.countingBClue,
    els.countingABClue
  ].filter(Boolean).forEach(zone => {
    zone.replaceChildren();
    zone.classList.remove("is-over", "shake", "tilt-reject");
  });
  els.countingUnionClue?.replaceChildren();
  els.countingQuestion?.replaceChildren();
  els.countingAnswers?.replaceChildren();
  els.countingStage?.classList.remove("has-circle-totals");
  els.countingStage?.removeAttribute("data-counting-geometry");
  [els.countingAClue, els.countingBClue, els.countingABClue]
    .filter(Boolean)
    .forEach(zone => zone.classList.remove("is-empty-counting-region"));
}

function renderCounting() {
  els.countingAHead.replaceChildren();
  els.countingBHead.replaceChildren();
  els.countingAHead.setAttribute("aria-label", "Left circle");
  els.countingBHead.setAttribute("aria-label", "Right circle");

  const challenge = state.countingChallenge;
  els.countingStage.dataset.countingGeometry = "standard";
  els.countingStage.classList.toggle("has-circle-totals", challenge.variant === "circle-totals");
  els.countingAClue.classList.toggle("is-empty-counting-region", challenge.aOnly === 0);
  els.countingBClue.classList.toggle("is-empty-counting-region", challenge.bOnly === 0);
  els.countingABClue.classList.toggle("is-empty-counting-region", challenge.intersection === 0);
  if (challenge.variant === "circle-totals") {
    renderCountingCircleTotal(els.countingAHead, challenge.leftTotal, "Left circle");
    renderCountingCircleTotal(els.countingBHead, challenge.rightTotal, "Right circle");
  } else {
    renderCountingBadge(els.countingAClue, challenge.aOnly, "Left only");
    renderCountingBadge(els.countingBClue, challenge.bOnly, "Right only");
    renderCountingBadge(els.countingABClue, null, "Both");
  }
  els.countingUnionClue?.replaceChildren();
  renderCountingQuestion();
}

function renderCountingCircleTotal(head, value, label) {
  const badge = document.createElement("strong");
  badge.className = "counting-circle-total";
  badge.textContent = String(value);
  badge.setAttribute("aria-label", `${label}: ${value}`);
  head.replaceChildren(badge);
}

function renderCountingBadge(zone, value, label) {
  const badge = document.createElement("div");
  badge.className = "counting-number-badge";
  badge.textContent = value === null ? "?" : String(value);
  badge.setAttribute("aria-label", `${label}: ${value === null ? "unknown" : value}`);
  zone.append(badge);
}

function renderCountingQuestion() {
  const challenge = state.countingChallenge;
  els.countingAnswers.replaceChildren();
  if (challenge.variant === "circle-totals") {
    els.countingQuestion.textContent = "";
    return;
  }
  const expected = challenge.intersection;
  els.countingQuestion.textContent = "How many go in both?";
  (challenge.answerChoices || getCountingAnswerChoices(expected)).forEach(value => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "counting-answer-button";
    button.classList.toggle("is-selected", state.countingAnswer === value);
    button.textContent = String(value);
    button.setAttribute("aria-pressed", String(state.countingAnswer === value));
    button.addEventListener("click", () => {
      state.countingAnswer = value;
      renderCountingQuestion();
    });
    els.countingAnswers.append(button);
  });
}

function getCountingAnswerChoices(expected) {
  const choices = new Set([expected]);
  for (let candidate = 1; choices.size < 4; candidate += 1) {
    choices.add(candidate);
  }
  return shuffle([...choices]).sort((first, second) => first - second);
}

function startImplicitPhase(previousRects = null) {
  state.phase = "implicit";
  clearVennLighting(els.implicitStage);
  resetMistakeCounter();
  state.nextPlacementOrder = 1;
  resetImplicitGuessState();
  state.smileys.forEach(smiley => {
    smiley.zone = "tray";
    smiley.placementOrder = smiley.originalOrder;
  });
  els.sortTable.classList.add("hidden");
  els.orderingPanel.classList.add("hidden");
  els.statisticsPanel.classList.add("hidden");
  els.carrollPanel.classList.add("hidden");
  els.vennPanel.classList.add("hidden");
  els.countingPanel?.classList.add("hidden");
  resetCountChallenge();
  els.comparePanel.classList.add("hidden");
  els.simpleComparePanel.classList.add("hidden");
  els.permutationPanel.classList.add("hidden");
  els.selectionPanel.classList.add("hidden");
  els.creatorPanel.classList.add("hidden");
  els.implicitPanel.classList.remove("hidden");
  els.trayLabel.textContent = "";
  setHeader("Find the Rule", `${state.setCycle + 1} of ${state.reuseGoal}`);
  els.submitSortButton.textContent = "OK";
  unlockSubmitButton();
  renderImplicitHeadlines();
  renderSmileys();
  if (previousRects) {
    animateSmileysFrom(previousRects);
  }
  startImplicitDemonstration(Boolean(previousRects));
}

function startImplicitDemonstration(waitForPreviousTransition = false) {
  const orderedSmileys = [...state.smileys].sort((first, second) =>
    first.originalOrder - second.originalOrder
  );
  const demonstrationSmileys = orderedSmileys.slice(0, Math.ceil(orderedSmileys.length / 2));
  const returnAnimationDuration = 3000;
  const reflectionPause = 750;
  const firstMoveDelay = waitForPreviousTransition
    ? returnAnimationDuration + reflectionPause
    : 280;
  const moveInterval = 460;

  state.implicitDemoInProgress = true;
  els.implicitPanel.setAttribute("aria-busy", "true");
  lockSubmitButton();

  demonstrationSmileys.forEach((smiley, index) => {
    scheduleCycleTimer(() => {
      if (state.phase !== "implicit") return;
      const previousRects = collectSmileyRects();
      smiley.zone = getImplicitZoneForSmiley(smiley, state.activeImplicitCriteria);
      smiley.placementOrder = state.nextPlacementOrder;
      state.nextPlacementOrder += 1;
      renderSmileys();
      animateSmileysFrom(previousRects, null, "fast");
    }, firstMoveDelay + (index * moveInterval));
  });

  const finishDelay = firstMoveDelay + (demonstrationSmileys.length * moveInterval);
  scheduleCycleTimer(() => {
    if (state.phase !== "implicit") return;
    state.implicitDemoInProgress = false;
    els.implicitPanel.removeAttribute("aria-busy");
    unlockSubmitButton();
  }, finishDelay);
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

function renderNestedHeadlines() {
  const [outerFeature, innerFeature] = state.activeNestedCriteria;
  els.nestedOuterHead.replaceChildren(createFeatureIcon(outerFeature));
  els.nestedOuterHead.setAttribute("aria-label", outerFeature.label);

  els.nestedInnerHead.replaceChildren(createCombinedCategoryIcon([outerFeature, innerFeature]));
  els.nestedInnerHead.setAttribute("aria-label", `${outerFeature.label} and ${innerFeature.label}`);
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
  if (state.phase !== "implicit" || state.implicitDemoInProgress) return;
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

function chooseNestedCriteriaForSmileys(smileys, previousCriteria = []) {
  const pairs = shuffle(getFeaturePairs());
  const previousKey = getCriteriaPairKey(previousCriteria);
  return pairs.find(pair =>
    getCriteriaPairKey(pair) !== previousKey && hasAllNestedZones(smileys, pair)
  ) || pairs.find(pair => hasAllNestedZones(smileys, pair)) || pairs[0];
}

function hasAllNestedZones(smileys, criteria) {
  return new Set(smileys.map(smiley => getNestedZoneForSmiley(smiley, criteria))).size === 3;
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
    if (state.selectionLevel >= SELECTION_RULE_PROGRESSION.length) {
      state.selectionTutorialSkipped = true;
    }
  }
}

function createOrderingCriteriaChain(criteria) {
  const chain = document.createElement("div");
  chain.className = "criterion-chain";

  criteria.forEach((criterion, index) => {
    const feature = features.find(item => item.key === criterion.key);
    const item = document.createElement("span");
    item.className = "criterion-icon is-initial-bouncing";
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

  const criterionIcons = [...chain.querySelectorAll(".criterion-icon")];
  const stopBouncing = () => {
    criterionIcons.forEach(icon => icon.classList.remove("is-initial-bouncing", "is-rebouncing"));
  };
  chain.addEventListener("click", event => {
    if (!event.target.closest(".criterion-icon")) return;
    stopBouncing();
    chain.getBoundingClientRect();
    criterionIcons.forEach(icon => icon.classList.add("is-rebouncing"));
  });
  chain.addEventListener("animationend", event => {
    if (event.animationName === "criterion-bounce" && event.target === criterionIcons[0]) {
      stopBouncing();
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

function validateNested() {
  const allSorted = state.smileys.every(smiley => smiley.zone !== "tray");
  if (!allSorted) {
    registerMistake({ returnSmileys: true });
    return;
  }

  const isCorrect = state.smileys.every(smiley =>
    smiley.zone === getNestedZoneForSmiley(smiley, state.activeNestedCriteria)
  );

  if (isCorrect) {
    resetMistakeCounter();
    completeMissionAfterCorrectSort();
    return;
  }

  registerMistake({ returnSmileys: true });
}

function validateCounting() {
  const allPlaced = state.smileys.every(smiley => smiley.zone !== "tray");
  if (state.countingChallenge?.variant === "parts" &&
    state.smileys.every(smiley => smiley.zone === "tray") &&
    isCountingAnswerCorrect() &&
    !state.countingHadMistake) {
    resetMistakeCounter();
    finishSet(collectSmileyRects());
    return;
  }
  const placementsCorrect = allPlaced && areCountingGroupsCorrect();
  const answerCorrect = isCountingAnswerCorrect();

  if (placementsCorrect && answerCorrect) {
    recordCleanProgress(!state.countingHadMistake, "countingCleanWins", "countingLevel");
    resetMistakeCounter();
    finishSet(collectSmileyRects());
    return;
  }

  state.countingHadMistake = true;
  state.countingCleanWins = 0;
  registerMistake({ returnSmileys: !allPlaced || !placementsCorrect });
}

function areCountingGroupsCorrect() {
  const challenge = state.countingChallenge;
  if (challenge.variant === "circle-totals") {
    const leftCount = countSmileysInZone("counting-a") + countSmileysInZone("counting-ab");
    const rightCount = countSmileysInZone("counting-b") + countSmileysInZone("counting-ab");
    return leftCount === challenge.leftTotal && rightCount === challenge.rightTotal;
  }
  return countSmileysInZone("counting-a") === challenge.aOnly &&
    countSmileysInZone("counting-b") === challenge.bOnly &&
    countSmileysInZone("counting-ab") === challenge.intersection;
}

function isCountingAnswerCorrect() {
  const challenge = state.countingChallenge;
  if (!challenge || challenge.variant === "circle-totals") return true;
  return state.countingAnswer === challenge.intersection;
}

function validateImplicit() {
  if (areImplicitGuessesCorrect()) {
    resetMistakeCounter();
    completeMissionAfterCorrectSort();
    return;
  }

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

  tiltImplicitRuleHeads();
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

function getNestedZoneForSmiley(smiley, criteria) {
  const [outerFeature, innerFeature] = criteria;
  if (!outerFeature.get(smiley)) return "nested-outside";
  return innerFeature.get(smiley) ? "nested-inner" : "nested-outer";
}

function getCountingZoneForSmiley(smiley) {
  return getCountingZoneForRawSmiley(smiley, state.activeVennCriteria);
}

function getCountingZoneForRawSmiley(smiley, criteria) {
  const [firstFeature, secondFeature] = criteria;
  const inFirst = firstFeature.get(smiley);
  const inSecond = secondFeature.get(smiley);
  if (inFirst && inSecond) return "counting-ab";
  if (inFirst) return "counting-a";
  if (inSecond) return "counting-b";
  return "counting-outside";
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
  if (completedMission === "counting") {
    finishCountingCycle();
    return;
  }
  const reuseSmileys = shouldReuseSmileysForNextCycle(completedMission);
  if (reuseSmileys) {
    finishReusableCycle(completedMission);
    return;
  }
  if (completedMission === "average") {
    finishAverageCycle();
    return;
  }
  runNewSmileysCycleTransition(
    () => startNextMissionRound(completedMission),
    {
      animateSmileys: shouldAnimateRoomSmileys(completedMission)
    }
  );
}

function finishAverageCycle() {
  state.phase = "transitioning";
  lockSubmitButton();
  els.workPanel.classList.add("is-celebrating");
  celebrateCycle(AVERAGE_CELEBRATION_MS);

  scheduleCycleTimer(() => {
    els.workPanel.classList.add("average-round-exiting");
  }, AVERAGE_CELEBRATION_MS);

  scheduleCycleTimer(() => {
    startAverageMission(false);
    els.workPanel.classList.remove("is-celebrating", "average-round-exiting");
    els.workPanel.classList.add("average-round-entering");
  }, AVERAGE_CELEBRATION_MS + AVERAGE_SLIDE_MS);

  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("average-round-entering");
    unlockSubmitButton();
  }, AVERAGE_CELEBRATION_MS + (AVERAGE_SLIDE_MS * 2));
}

function runNewSmileysCycleTransition(startNextRound, options = {}) {
  const animateSmileys = options.animateSmileys !== false;
  const fadeCategories = options.fadeCategories !== false;
  const returnHomeDuration = animateSmileys ? SUCCESS_SMILEY_RETURN_MS : 0;
  const returnHomeDelay = animateSmileys ? CYCLE_CELEBRATION_MS : 0;
  const exitStartDelay = returnHomeDelay + returnHomeDuration +
    (fadeCategories ? SMILEY_RETURN_SETTLE_MS : 0);
  const reorderStartDelay = exitStartDelay + (animateSmileys ? ROOM_EXIT_MS : CYCLE_CELEBRATION_MS);
  const nextRoundDelay = reorderStartDelay + (animateSmileys ? ROOM_REORDER_MS : 0);
  const categoryWiggleStartDelay = nextRoundDelay + (animateSmileys ? CYCLE_ENTER_MS : 0);
  const fadeOutStartDelay = categoryWiggleStartDelay + CATEGORY_WIGGLE_MS;
  const fadeInStartDelay = fadeOutStartDelay + SUCCESS_CATEGORY_FADE_OUT_MS;
  const finalWiggleStartDelay = fadeInStartDelay + SUCCESS_CATEGORY_FADE_IN_MS;
  let categoryGhosts = [];

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
      returnRoomSmileysToTray();
    }, returnHomeDelay);

    scheduleCycleTimer(() => {
      markDepartingRoomSmileys();
      els.workPanel.classList.add("smileys-exiting");
    }, exitStartDelay);

    scheduleCycleTimer(() => {
      compactRemainingRoomSmileys();
    }, reorderStartDelay);

  }

  scheduleCycleTimer(() => {
    if (fadeCategories) {
      categoryGhosts = createCategoryTransitionGhosts();
      els.workPanel.classList.add("criteria-held-hidden");
    }
    startNextRound();
    state.departingSmileyIds = [];
    els.workPanel.classList.remove("is-celebrating");
    els.workPanel.classList.remove("smileys-wiggling");
    els.workPanel.classList.remove("smileys-exiting");
    els.workPanel.classList.remove("smileys-returning-home");
    if (animateSmileys) {
      els.workPanel.classList.add("cycle-fading-in");
    }
  }, nextRoundDelay);

  if (animateSmileys) {
    scheduleCycleTimer(() => {
      els.workPanel.classList.remove("cycle-fading-in");
      state.enteringSmileyIds = [];
    }, categoryWiggleStartDelay);
  }

  if (fadeCategories) {
    scheduleCycleTimer(() => {
      categoryGhosts.forEach(ghost => ghost.classList.add("is-wiggling"));
    }, categoryWiggleStartDelay);

    scheduleCycleTimer(() => {
      categoryGhosts.forEach(ghost => {
        ghost.classList.remove("is-wiggling");
        ghost.classList.add("is-fading");
      });
    }, fadeOutStartDelay);

    scheduleCycleTimer(() => {
      categoryGhosts.forEach(ghost => ghost.remove());
      categoryGhosts = [];
      els.workPanel.classList.remove("criteria-held-hidden");
      els.workPanel.classList.add("criteria-fading-in");
    }, fadeInStartDelay);

    scheduleCycleTimer(() => {
      els.workPanel.classList.remove("criteria-fading-in");
      els.workPanel.classList.add("criteria-wiggling");
    }, finalWiggleStartDelay);

    scheduleCycleTimer(() => {
      els.workPanel.classList.remove("criteria-wiggling");
    }, finalWiggleStartDelay + CATEGORY_WIGGLE_MS);
  }
}

function finishSelectionCycle() {
  clearCycleTimers();
  state.phase = "transitioning";
  lockSubmitButton();
  if (state.setCycle + 1 < state.reuseGoal) {
    finishReusableSelectionTask();
  } else {
    finishSelectionRoom();
  }
}

function returnSelectionSmileysToVenn() {
  const moving = state.smileys
    .filter(smiley => smiley.zone !== smiley.sourceZone)
    .map(smiley => {
      const node = document.querySelector(`[data-id="${CSS.escape(smiley.id)}"]`);
      return node ? { smiley, node, startRect: node.getBoundingClientRect(), placeholder: null } : null;
    })
    .filter(Boolean);
  const movingById = new Map(moving.map(item => [item.smiley.id, item]));

  moving.forEach(({ node, startRect }) => {
    Object.assign(node.style, {
      position: "fixed",
      left: `${startRect.left}px`,
      top: `${startRect.top}px`,
      width: `${startRect.width}px`,
      height: `${startRect.height}px`,
      margin: "0",
      transform: "none",
      transition: "none",
      zIndex: "70"
    });
    node.classList.add("is-selection-returning");
    document.body.append(node);
  });

  state.smileys.forEach(smiley => {
    smiley.zone = smiley.sourceZone;
    smiley.placementOrder = smiley.originalOrder;
  });
  [...state.smileys]
    .sort((first, second) => first.originalOrder - second.originalOrder)
    .forEach(smiley => {
      const movingItem = movingById.get(smiley.id);
      if (movingItem) {
        const placeholder = document.createElement("span");
        placeholder.className = "selection-return-placeholder";
        placeholder.setAttribute("aria-hidden", "true");
        movingItem.placeholder = placeholder;
        getZoneElement(smiley.sourceZone)?.append(placeholder);
        return;
      }
      const node = document.querySelector(`[data-id="${CSS.escape(smiley.id)}"]`);
      const zone = getZoneElement(smiley.sourceZone);
      if (node && zone) zone.append(node);
    });
  clearDropMarks();

  window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
    moving.forEach(({ node, placeholder }) => {
      if (!placeholder?.isConnected) return;
      const targetRect = placeholder.getBoundingClientRect();
      node.style.transition = "left 2340ms cubic-bezier(0.45, 0, 0.55, 1), top 2340ms cubic-bezier(0.45, 0, 0.55, 1)";
      node.style.left = `${targetRect.left}px`;
      node.style.top = `${targetRect.top}px`;
      const finishReturn = event => {
        if (event.propertyName !== "top" || !placeholder.isConnected) return;
        node.removeEventListener("transitionend", finishReturn);
        placeholder.replaceWith(node);
        node.classList.remove("is-selection-returning");
        node.removeAttribute("style");
      };
      node.addEventListener("transitionend", finishReturn);
    });
  }));
}

function finishReusableSelectionTask() {
  returnSelectionSmileysToVenn();
  const returnedAt = SUCCESS_SMILEY_RETURN_MS + SMILEY_RETURN_SETTLE_MS;

  scheduleCycleTimer(() => els.workPanel.classList.add("selection-rule-wiggling"), returnedAt);
  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("selection-rule-wiggling");
    els.workPanel.classList.add("selection-rule-fading-out");
  }, returnedAt + CATEGORY_WIGGLE_MS);
  scheduleCycleTimer(() => {
    state.setCycle += 1;
    state.selectionSourceRule = chooseSelectionSourceRule();
    state.selectionSourceZone = state.selectionSourceRule.zone || null;
    state.selectionHadMistake = false;
    renderSelectionHint();
    setHeader("Select", `${state.setCycle + 1} of ${state.reuseGoal}`);
    els.workPanel.classList.remove("selection-rule-fading-out");
    els.workPanel.classList.add("selection-rule-fading-in");
  }, returnedAt + CATEGORY_WIGGLE_MS + SUCCESS_CATEGORY_FADE_OUT_MS);
  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("selection-rule-fading-in");
    els.workPanel.classList.add("selection-rule-wiggling");
  }, returnedAt + CATEGORY_WIGGLE_MS + SUCCESS_CATEGORY_FADE_OUT_MS + SUCCESS_CATEGORY_FADE_IN_MS);
  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("selection-rule-wiggling");
    state.phase = "selection";
    unlockSubmitButton();
  }, returnedAt + (CATEGORY_WIGGLE_MS * 2) + SUCCESS_CATEGORY_FADE_OUT_MS + SUCCESS_CATEGORY_FADE_IN_MS);
}

function finishSelectionRoom() {
  els.workPanel.classList.add("is-celebrating", "smileys-wiggling");
  celebrateCycle(CYCLE_CELEBRATION_MS);

  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("smileys-wiggling");
    returnSelectionSmileysToVenn();
  }, CYCLE_CELEBRATION_MS);

  const returnedAt = CYCLE_CELEBRATION_MS + SUCCESS_SMILEY_RETURN_MS + SMILEY_RETURN_SETTLE_MS;
  scheduleCycleTimer(() => {
    markDepartingRoomSmileys();
    els.workPanel.classList.add("smileys-exiting", "selection-rule-held-hidden");
  }, returnedAt);

  const exitedAt = returnedAt + ROOM_EXIT_MS;
  scheduleCycleTimer(() => {
    els.workPanel.classList.add("selection-venn-fading-out");
  }, exitedAt);

  scheduleCycleTimer(() => startNextSelectionRoom(), exitedAt + SUCCESS_CATEGORY_FADE_OUT_MS);
}

function startNextSelectionRoom() {
  const previousRects = collectSmileyRects();
  const nextCount = Math.min(7, randomCountDifferentFrom(state.requestedCount));
  const setup = makeVennSetForCount(getSelectionCriterionCount(), nextCount, state.smileys);
  state.requestedCount = nextCount;
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
  renderVennHeadlines();
  els.vennStage.classList.toggle("two-circle", state.activeVennCriteria.length <= 2);
  renderSelectionHint();
  renderSmileys();
  setHeader("Select", `1 of ${state.reuseGoal}`);
  els.workPanel.classList.remove("smileys-exiting", "selection-venn-fading-out");
  els.workPanel.classList.add("cycle-fading-in", "selection-venn-fading-in");
  animateSmileysFrom(previousRects, null, "cycle");

  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("selection-venn-fading-in");
    els.workPanel.classList.add("selection-venn-wiggling");
  }, CYCLE_ENTER_MS);
  scheduleCycleTimer(() => els.workPanel.classList.remove("selection-venn-wiggling"), CYCLE_ENTER_MS + CATEGORY_WIGGLE_MS);
  scheduleCycleTimer(() => els.workPanel.classList.remove("cycle-fading-in"), CYCLE_ENTER_MS);

  const reorderedAt = SUCCESS_SMILEY_RETURN_MS;
  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("selection-rule-held-hidden", "is-celebrating");
    els.workPanel.classList.add("selection-rule-fading-in", "selection-box-highlight");
  }, reorderedAt);
  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("selection-rule-fading-in");
    els.workPanel.classList.add("selection-rule-wiggling");
  }, reorderedAt + SUCCESS_CATEGORY_FADE_IN_MS);
  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("selection-rule-wiggling", "selection-box-highlight");
    state.enteringSmileyIds = [];
    state.departingSmileyIds = [];
    state.phase = "selection";
    unlockSubmitButton();
  }, reorderedAt + SUCCESS_CATEGORY_FADE_IN_MS + CATEGORY_WIGGLE_MS);
}

function createCategoryTransitionGhosts() {
  const selector = [
    ".column-head .feature-icon",
    ".criterion-icon",
    ".carroll-axis .feature-icon",
    ".venn-circle-head .feature-icon",
    ".counting-circle-head .feature-icon",
    ".nested-category-head > *",
    ".selection-source .feature-icon",
    ".implicit-rule-head > *",
    ".implicit-circle .feature-icon"
  ].join(",");

  return [...els.workPanel.querySelectorAll(selector)]
    .filter(node => node.getClientRects().length > 0)
    .map(node => {
      const rect = node.getBoundingClientRect();
      const ghost = node.cloneNode(true);
      ghost.classList.add("category-transition-ghost");
      Object.assign(ghost.style, {
        position: "fixed",
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`
      });
      document.body.append(ghost);
      return ghost;
    });
}

function compactRemainingRoomSmileys() {
  const departingIds = new Set(state.departingSmileyIds);
  if (!departingIds.size) return;
  const previousRects = collectSmileyRects();
  departingIds.forEach(id => {
    document.querySelector(`[data-id="${CSS.escape(id)}"]`)?.remove();
  });
  animateSmileysFrom(previousRects, null, "pair");
}

function returnRoomSmileysToTray() {
  const previousRects = collectSmileyRects();
  state.smileys.forEach((smiley, index) => {
    smiley.zone = "tray";
    smiley.originalOrder = index;
    smiley.placementOrder = index;
  });
  renderSmileys();
  animateSmileysFrom(previousRects, null, "cycle");
}

function shouldReuseSmileysForNextCycle(mission) {
  if (mission === "similarity" || mission === "compare" || mission === "simple-compare" || mission === "creator" || mission === "permutation" || mission === "statistics" || mission === "average" || mission === "counting") return false;
  return state.setCycle + 1 < state.reuseGoal;
}

function finishReusableCycle(mission) {
  state.phase = "transitioning";
  lockSubmitButton();
  els.workPanel.classList.add("is-celebrating");
  returnRoomSmileysToTray();

  scheduleCycleTimer(() => {
    els.workPanel.classList.add("criteria-wiggling");
  }, SUCCESS_SMILEY_RETURN_MS + SMILEY_RETURN_SETTLE_MS);

  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("criteria-wiggling");
    els.workPanel.classList.add("criteria-fading-out");
  }, SUCCESS_SMILEY_RETURN_MS + SMILEY_RETURN_SETTLE_MS + CATEGORY_WIGGLE_MS);

  scheduleCycleTimer(() => {
    startNextCycleWithSameSmileys(mission, collectSmileyRects());
    els.workPanel.classList.remove("is-celebrating");
    els.workPanel.classList.remove("criteria-fading-out");
    els.workPanel.classList.add("criteria-fading-in");
  }, SUCCESS_SMILEY_RETURN_MS + SMILEY_RETURN_SETTLE_MS + CATEGORY_WIGGLE_MS + SUCCESS_CATEGORY_FADE_OUT_MS);

  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("criteria-fading-in");
    els.workPanel.classList.add("criteria-wiggling");
  }, SUCCESS_SMILEY_RETURN_MS + SMILEY_RETURN_SETTLE_MS + CATEGORY_WIGGLE_MS + SUCCESS_CATEGORY_FADE_OUT_MS + SUCCESS_CATEGORY_FADE_IN_MS);

  scheduleCycleTimer(() => {
    els.workPanel.classList.remove("criteria-wiggling");
  }, SUCCESS_SMILEY_RETURN_MS + SMILEY_RETURN_SETTLE_MS + (CATEGORY_WIGGLE_MS * 2) + SUCCESS_CATEGORY_FADE_OUT_MS + SUCCESS_CATEGORY_FADE_IN_MS);
}

function markDepartingRoomSmileys() {
  const nodes = [...els.workPanel.querySelectorAll(".smiley")]
    .filter(node => !node.closest(".album-photo, .creator-panel"));
  const departingCount = state.rememberRoomState
    ? Math.min(nodes.length, 1 + Math.floor(Math.random() * Math.min(4, nodes.length)))
    : nodes.length;
  shuffle(nodes).slice(0, departingCount).forEach(node => {
    node.classList.add("is-cycle-departing");
    const hand = document.createElement("span");
    hand.className = "goodbye-hand";
    hand.textContent = "👋";
    hand.setAttribute("aria-hidden", "true");
    node.append(hand);
  });
  state.departingSmileyIds = nodes
    .filter(node => node.classList.contains("is-cycle-departing"))
    .map(node => node.dataset.id)
    .filter(Boolean);
}

function shouldAnimateRoomSmileys(mission) {
  return mission !== "creator";
}

function finishCountingCycle() {
  state.phase = "celebrating";
  els.workPanel.classList.add("is-celebrating", "smileys-wiggling");
  lockSubmitButton();
  celebrateCycle(CYCLE_CELEBRATION_MS);

  scheduleCycleTimer(() => {
    state.phase = "counting";
    els.workPanel.classList.remove("smileys-wiggling");
    const previousRects = collectSmileyRects();
    state.smileys.forEach(smiley => {
      smiley.zone = "tray";
      smiley.placementOrder = smiley.originalOrder;
    });
    renderSmileys();
    animateSmileysFrom(previousRects, null, "counting");
  }, CYCLE_CELEBRATION_MS);

  scheduleCycleTimer(() => {
    if (state.setCycle + 1 < state.reuseGoal) {
      startNextCountingCycle();
    } else {
      startCountingMission(false);
    }
    els.workPanel.classList.remove("is-celebrating");
  }, CYCLE_CELEBRATION_MS + 1200);
}

function startNextCountingCycle() {
  state.setCycle += 1;
  const challenge = state.countingSequence[state.setCycle];
  state.activeVennCriteria = [];
  state.countingChallenge = challenge;
  state.countingAnswer = null;
  state.countingHadMistake = false;
  state.countingLastVariant = challenge.variant;
  startCountingPhase();
}

function startNextMissionRound(completedMission) {
  const nextCount = randomCountDifferentFrom(state.requestedCount);
  if (completedMission === "ordering") {
    startOrderingMission(false, false);
  } else if (completedMission === "similarity") {
    startSimilarityMission(false);
  } else if (completedMission === "carroll") {
    startCarrollMission(false, nextCount);
  } else if (completedMission === "compare") {
    startCompareMission(false);
  } else if (completedMission === "simple-compare") {
    startSimpleCompareMission(false);
  } else if (completedMission === "permutation") {
    startPermutationMission(false);
  } else if (completedMission === "selection") {
    startSelectionMission(false, nextCount);
  } else if (completedMission === "creator") {
    startCreatorMission(false);
  } else if (completedMission === "venn") {
    startVennMission(false, nextCount);
  } else if (completedMission === "nested") {
    startNestedMission(false, nextCount);
  } else if (completedMission === "counting") {
    startCountingMission(false);
  } else if (completedMission === "implicit") {
    startImplicitMission(false, nextCount);
  } else if (completedMission === "statistics") {
    startStatisticsMission(false);
  } else if (completedMission === "average") {
    startAverageMission(false);
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

  if (mission === "nested") {
    state.activeNestedCriteria = chooseNestedCriteriaForSmileys(state.smileys, state.activeNestedCriteria);
    startNestedPhase(previousRects);
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
  stopComparisonIconTutorial();
  if (els.workPanel) {
    els.workPanel.classList.remove("cycle-fading-out");
    els.workPanel.classList.remove("cycle-fading-in");
    els.workPanel.classList.remove("smileys-exiting");
    els.workPanel.classList.remove("smileys-returning-home");
    els.workPanel.classList.remove("smileys-wiggling");
    els.workPanel.classList.remove("criteria-wiggling");
    els.workPanel.classList.remove("criteria-held-hidden");
    els.workPanel.classList.remove("criteria-fading-out");
    els.workPanel.classList.remove("criteria-fading-in");
    els.workPanel.classList.remove("average-round-exiting");
    els.workPanel.classList.remove("average-round-entering");
    els.workPanel.classList.remove("photo-holding");
    els.workPanel.classList.remove("is-celebrating");
    els.celebration.classList.add("hidden");
    document.querySelectorAll(".category-transition-ghost").forEach(node => node.remove());
  }
}

function celebrateCycle(duration = 1800) {
  els.celebration.classList.remove("hidden");
  scheduleCycleTimer(() => {
    els.celebration.classList.add("hidden");
  }, duration);
}


function randomCountDifferentFrom(previousCount) {
  if (state.rememberRoomState) return previousCount;
  let count = previousCount;
  while (count === previousCount) {
    count = state.useNumbers ? Math.floor(Math.random() * 9) + 2 : getDefaultSmileyCount();
    // A population change of at most three still permits at least one departure
    // and no more than four arrivals in the same transition.
    if (state.rememberRoomState && Math.abs(count - previousCount) > 3) count = previousCount;
  }
  return count;
}

function currentFeature() {
  return state.activeFeatures[state.featureIndex];
}

init();
