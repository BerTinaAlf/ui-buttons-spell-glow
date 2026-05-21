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

const ITEM_SHEET_SELECTOR = ".dnd5e2.sheet.item, .dnd5e2.application.sheet.item, .window-app.dnd5e2.sheet.item";

function getItemSheets(root = document) {
  const sheets = [];
  if (root instanceof Element) {
    if (root.matches(ITEM_SHEET_SELECTOR)) sheets.push(root);
    const closest = root.closest?.(ITEM_SHEET_SELECTOR);
    if (closest && !sheets.includes(closest)) sheets.push(closest);
  }
  sheets.push(...(root.querySelectorAll?.(ITEM_SHEET_SELECTOR) ?? []));
  return [...new Set(sheets)];
}

function getItemHeader(sheet) {
  return sheet.querySelector(".window-header")
    ?? sheet.closest(".application, .window-app")?.querySelector(".window-header");
}

function normalizeToggleControlsButton(button) {
  button.type = "button";
  button.classList.add("header-control", "fa-solid", "fa-ellipsis-vertical", "icon");
  button.dataset.action = "toggleControls";
  button.dataset.tooltipDirection ||= "DOWN";
  const label = globalThis.game?.i18n?.localize?.("DND5E.AdditionalControls") || "Additional Controls";
  button.dataset.tooltip ||= label;
  button.setAttribute("aria-label", button.getAttribute("aria-label") || label);
  button.hidden = false;
  button.removeAttribute("style");
}

function restoreItemHeaderControls(root = document) {
  for (const sheet of getItemSheets(root)) {
    const header = getItemHeader(sheet);
    if (!header) continue;

    let button = header.querySelector('[data-action="toggleControls"]');
    if (!button) {
      button = document.createElement("button");
      normalizeToggleControlsButton(button);

      const source = header.querySelector(".source-book");
      const firstState = header.querySelector(".pseudo-header-control, .state-toggle, [data-action='copyUuid'], [data-action='close']");
      if (source) source.after(button);
      else if (firstState) firstState.before(button);
      else header.append(button);
    } else {
      normalizeToggleControlsButton(button);
    }
  }
}

let itemHeaderRestorePending = false;
function scheduleItemHeaderRestore(root = document) {
  if (itemHeaderRestorePending) return;
  itemHeaderRestorePending = true;
  window.setTimeout(() => {
    itemHeaderRestorePending = false;
    restoreItemHeaderControls(root);
  }, 0);
}

Hooks.once("ready", () => {
  restoreItemHeaderControls();

  const observer = new MutationObserver(() => scheduleItemHeaderRestore(document));
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "data-action", "hidden"]
  });

  for (const delay of [100, 350, 900, 1600]) {
    window.setTimeout(() => restoreItemHeaderControls(), delay);
  }
});
