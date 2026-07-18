export const els = {
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
  countingMissionButton: document.querySelector("#countingMissionButton"),
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
  statisticsMissionButton: document.querySelector("#statisticsMissionButton"),
  averageMissionButton: document.querySelector("#averageMissionButton"),
  statisticsPanel: document.querySelector("#statisticsPanel"),
  statisticsInstruction: document.querySelector("#statisticsInstruction"),
  statisticsQuestion: document.querySelector("#statisticsQuestion"),
  statisticsFrequency: document.querySelector("#statisticsFrequency"),
  statisticsRankingDirection: document.querySelector("#statisticsRankingDirection"),
  statisticsOrderZone: document.querySelector("#statisticsOrderZone"),
  statisticsCoinStage: document.querySelector("#statisticsCoinStage"),
  statisticsCoinBank: document.querySelector("#statisticsCoinBank"),
  statisticsCoinShares: document.querySelector("#statisticsCoinShares"),
  statisticsWeightedTable: document.querySelector("#statisticsWeightedTable"),
  statisticsAnswerRow: document.querySelector("#statisticsAnswerRow"),
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
  countingPanel: document.querySelector("#countingPanel"),
  countingStage: document.querySelector("#countingStage"),
  countingAHead: document.querySelector("#countingAHead"),
  countingBHead: document.querySelector("#countingBHead"),
  countingAClue: document.querySelector("#countingAClue"),
  countingBClue: document.querySelector("#countingBClue"),
  countingABClue: document.querySelector("#countingABClue"),
  countingUnionClue: document.querySelector("#countingUnionClue"),
  countingQuestion: document.querySelector("#countingQuestion"),
  countingAnswers: document.querySelector("#countingAnswers"),
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

export function getAllDropContainers() {
  return [
    els.tray,
    els.withZone,
    els.withoutZone,
    els.orderingZone,
    els.statisticsOrderZone,
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
    els.countingAClue,
    els.countingBClue,
    els.countingABClue,
    els.implicitAZone,
    els.implicitBZone,
    els.implicitABZone,
    els.implicitOutsideZone,
    els.selectionTargetZone,
    ...Array.from(document.querySelectorAll("[data-zone^='statistics-beard-']"))
  ].filter(Boolean);
}

export function getZoneElement(zone) {
  if (zone === "order") return els.orderingZone;
  if (zone === "statistics-order") return els.statisticsOrderZone;
  if (zone.startsWith("statistics-beard-")) return document.querySelector(`[data-zone="${CSS.escape(zone)}"]`);
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
  if (zone === "counting-a") return els.countingAClue;
  if (zone === "counting-b") return els.countingBClue;
  if (zone === "counting-ab") return els.countingABClue;
  if (zone === "selection-target") return els.selectionTargetZone;
  if (zone === "implicit-a") return els.implicitAZone;
  if (zone === "implicit-b") return els.implicitBZone;
  if (zone === "implicit-ab") return els.implicitABZone;
  if (zone === "implicit-outside") return els.implicitOutsideZone;
  return els.tray;
}
