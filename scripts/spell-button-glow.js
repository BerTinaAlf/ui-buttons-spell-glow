const SPELL_BUTTON_SELECTOR = [
  "button:not(#heartbeat-button):not(#hotbar button):not(#bg3-hotbar-container button):not(.dnd5e2.sheet.actor button:is(.inspiration, .death-save, .pip))",
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
  if (!rect.width || !rect.height) return;

  const burst = document.createElement("span");
  burst.className = "spell-cast-mist-burst";

  const left = Math.min(Math.max(rect.left + (rect.width / 2), 24), window.innerWidth - 24);
  const top = Math.min(Math.max(rect.top + (rect.height / 2), 24), window.innerHeight - 24);

  burst.style.left = `${left}px`;
  burst.style.top = `${top}px`;
  document.body.append(burst);

  window.setTimeout(() => burst.remove(), 760);
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
