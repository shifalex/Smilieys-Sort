export const features = [
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

export const orderingCriteria = [
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
