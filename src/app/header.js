import { els } from "./elements.js";

export function setHeader(title, progress = "") {
  els.screenTitle.textContent = title;
  els.progressText.textContent = progress;
  els.progressText.classList.toggle("hidden", !progress);
}

export function setProgress(progress = "") {
  els.progressText.textContent = progress;
  els.progressText.classList.toggle("hidden", !progress);
}
