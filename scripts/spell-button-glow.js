const SPELL_BUTTON_SELECTOR = [
  "button",
  ".button",
  ".control-tool",
  ".scene-control",
  ".playlist-control",
  ".directory .action-buttons button",
  ".sheet-footer button",
  ".dialog-buttons button",
  ".form-footer button",
  ".tabs .item"
].join(",");

function createSpellMistBurst(button) {
  const rect = button.getBoundingClientRect();
  const burst = document.createElement("span");
  burst.className = "spell-cast-mist-burst";

  const isLeftControl = Boolean(button.closest("#controls"));
  const left = isLeftControl
    ? Math.max(rect.left + (rect.width * 1.15), 54)
    : rect.left + (rect.width / 2);
  const top = rect.top + (rect.height / 2);

  burst.style.left = `${left}px`;
  burst.style.top = `${top}px`;
  document.body.append(burst);

  window.setTimeout(() => burst.remove(), 900);
}

document.addEventListener(
  "click",
  (event) => {
    const button = event.target.closest(SPELL_BUTTON_SELECTOR);

    if (!button) return;

    button.classList.remove("spell-casting");
    void button.offsetWidth;
    button.classList.add("spell-casting");
    createSpellMistBurst(button);

    window.setTimeout(() => {
      button.classList.remove("spell-casting");
    }, 680);
  },
  true
);
