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

const MODULE_ID = "ui-buttons-spell-glow";
const PLAYER_SIDEBAR_TABS_SETTING = "playerSidebarTabs";
const HIDDEN_PLAYER_SIDEBAR_TAB_CLASS = "ui-buttons-spell-glow-hidden-player-sidebar-tab";
const HIDDEN_PLAYER_SIDEBAR_PANEL_CLASS = "ui-buttons-spell-glow-hidden-player-sidebar-panel";
const SIDEBAR_TABS = [
  { id: "chat", label: "聊天", icon: () => CONFIG.ChatMessage?.sidebarIcon || "fas fa-comments" },
  { id: "combat", label: "战斗", icon: () => CONFIG.Combat?.sidebarIcon || "fas fa-swords" },
  { id: "scenes", label: "场景", icon: () => CONFIG.Scene?.sidebarIcon || "fas fa-map" },
  { id: "actors", label: "角色", icon: () => CONFIG.Actor?.sidebarIcon || "fas fa-user" },
  { id: "items", label: "物品", icon: () => CONFIG.Item?.sidebarIcon || "fas fa-suitcase" },
  { id: "journal", label: "日志", icon: () => CONFIG.JournalEntry?.sidebarIcon || "fas fa-book-open" },
  { id: "tables", label: "掷骰表", icon: () => CONFIG.RollTable?.sidebarIcon || "fas fa-th-list" },
  { id: "cards", label: "卡牌", icon: () => CONFIG.Cards?.sidebarIcon || "fa-solid fa-cards" },
  { id: "playlists", label: "播放列表", icon: () => CONFIG.Playlist?.sidebarIcon || "fas fa-music" },
  { id: "compendium", label: "合集包", icon: () => "fas fa-atlas" },
  { id: "settings", label: "设置", icon: () => "fas fa-cogs" }
];
const DEFAULT_PLAYER_SIDEBAR_TABS = SIDEBAR_TABS.reduce((tabs, tab) => {
  tabs[tab.id] = true;
  return tabs;
}, {});
const SIDEBAR_TABS_BY_ID = new Map(SIDEBAR_TABS.map((tab) => [tab.id, tab]));
const FONT_AWESOME_PREFIXES = ["fa", "fas", "far", "fab", "fa-solid", "fa-regular", "fa-brands"];

function getPlayerSidebarTabsSetting() {
  const configured = game.settings.get(MODULE_ID, PLAYER_SIDEBAR_TABS_SETTING) || {};
  return { ...DEFAULT_PLAYER_SIDEBAR_TABS, ...configured };
}

function isPlayerSidebarTabVisible(tabId, visibleTabs = getPlayerSidebarTabsSetting()) {
  return visibleTabs[tabId] !== false;
}

function getFontAwesomeClasses(element) {
  if (!element) return [];

  return Array.from(element.classList).filter((className) => (
    FONT_AWESOME_PREFIXES.includes(className) || className.startsWith("fa-")
  ));
}

function getSidebarTabIcon(tabId, tabButton) {
  const knownIcon = SIDEBAR_TABS_BY_ID.get(tabId)?.icon?.();
  if (knownIcon) return knownIcon;

  const iconClasses = getFontAwesomeClasses(tabButton?.querySelector("i"));
  if (iconClasses.length) return iconClasses.join(" ");

  const buttonClasses = getFontAwesomeClasses(tabButton);
  return buttonClasses.length ? buttonClasses.join(" ") : "fas fa-circle";
}

function getSidebarTabLabel(tabId, tabButton) {
  const knownLabel = SIDEBAR_TABS_BY_ID.get(tabId)?.label;
  const labelKey = tabButton?.dataset?.tooltip
    || tabButton?.getAttribute("aria-label")
    || tabButton?.getAttribute("title")
    || tabButton?.textContent?.trim()
    || knownLabel
    || tabId;

  return game.i18n?.localize ? game.i18n.localize(labelKey) : labelKey;
}

function getSidebarTabButtons() {
  const seenTabs = new Set();

  return Array.from(document.querySelectorAll("#sidebar-tabs [data-tab]")).filter((tabButton) => {
    const tabId = tabButton.dataset.tab;

    if (!tabId || seenTabs.has(tabId)) return false;
    if (tabButton.dataset.action === "toggleState") return false;
    if (tabButton.classList.contains("collapse")) return false;

    seenTabs.add(tabId);
    return true;
  });
}

function getSidebarTabsFromDom() {
  return getSidebarTabButtons().map((tabButton, order) => {
    const id = tabButton.dataset.tab;

    return {
      id,
      label: getSidebarTabLabel(id, tabButton),
      icon: getSidebarTabIcon(id, tabButton),
      order
    };
  });
}

function getSidebarTabsForConfig() {
  const configuredTabs = game.settings.get(MODULE_ID, PLAYER_SIDEBAR_TABS_SETTING) || {};
  const tabs = new Map();

  for (const tab of getSidebarTabsFromDom()) {
    tabs.set(tab.id, tab);
  }

  for (const [order, tab] of SIDEBAR_TABS.entries()) {
    if (tabs.has(tab.id)) continue;

    tabs.set(tab.id, {
      id: tab.id,
      label: tab.label,
      icon: tab.icon?.() || "fas fa-circle",
      order: tabs.size + order
    });
  }

  for (const tabId of Object.keys(configuredTabs)) {
    if (tabs.has(tabId)) continue;

    tabs.set(tabId, {
      id: tabId,
      label: tabId,
      icon: "fas fa-circle",
      order: tabs.size
    });
  }

  return Array.from(tabs.values()).sort((a, b) => a.order - b.order);
}

function getDataTabElements(root, tabId) {
  if (!root) return [];

  return Array.from(root.querySelectorAll("[data-tab]")).filter((element) => element.dataset.tab === tabId);
}

function getSidebarTabContainer(tabButton) {
  return tabButton.closest("li") || tabButton;
}

function clearPlayerSidebarTabVisibility() {
  document.querySelectorAll(`.${HIDDEN_PLAYER_SIDEBAR_TAB_CLASS}`).forEach((element) => {
    element.classList.remove(HIDDEN_PLAYER_SIDEBAR_TAB_CLASS);
  });

  document.querySelectorAll(`.${HIDDEN_PLAYER_SIDEBAR_PANEL_CLASS}`).forEach((element) => {
    element.classList.remove(HIDDEN_PLAYER_SIDEBAR_PANEL_CLASS);
  });
}

function activateFirstVisibleSidebarTab(visibleTabs) {
  const activeTab = document.querySelector("#sidebar-tabs [data-tab].active, #sidebar-tabs [data-tab][aria-selected='true']")?.dataset?.tab
    || ui.sidebar?.activeTab;

  if (!activeTab || isPlayerSidebarTabVisible(activeTab, visibleTabs)) return;

  const sidebarTabs = getSidebarTabsFromDom();
  const firstVisible = (sidebarTabs.length ? sidebarTabs : SIDEBAR_TABS)
    .find((tab) => isPlayerSidebarTabVisible(tab.id, visibleTabs))?.id;
  if (!firstVisible) return;

  if (ui.sidebar?.activateTab) {
    ui.sidebar.activateTab(firstVisible);
    return;
  }

  getDataTabElements(document.querySelector("#sidebar-tabs"), firstVisible)[0]?.click();
}

function applyPlayerSidebarTabVisibility() {
  if (!game.ready) return;

  clearPlayerSidebarTabVisibility();

  if (game.user?.isGM) return;

  const visibleTabs = getPlayerSidebarTabsSetting();
  const hiddenTabs = Object.entries(visibleTabs)
    .filter(([_tabId, isVisible]) => isVisible === false)
    .map(([tabId]) => tabId);

  for (const tabButton of getSidebarTabButtons()) {
    if (isPlayerSidebarTabVisible(tabButton.dataset.tab, visibleTabs)) continue;
    getSidebarTabContainer(tabButton).classList.add(HIDDEN_PLAYER_SIDEBAR_TAB_CLASS);
  }

  for (const tabId of hiddenTabs) {
    getDataTabElements(document.querySelector("#sidebar-content"), tabId).forEach((panel) => {
      panel.classList.add(HIDDEN_PLAYER_SIDEBAR_PANEL_CLASS);
    });

    getDataTabElements(document.querySelector("#sidebar"), tabId).forEach((panel) => {
      if (panel.closest("#sidebar-tabs")) return;
      panel.classList.add(HIDDEN_PLAYER_SIDEBAR_PANEL_CLASS);
    });
  }

  activateFirstVisibleSidebarTab(visibleTabs);
}

class PlayerSidebarTabsConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "ui-buttons-spell-glow-player-sidebar-tabs-config",
      title: "法术 UI：玩家右侧栏可见项",
      template: "modules/ui-buttons-spell-glow/templates/player-sidebar-tabs-config.hbs",
      width: 420
    });
  }

  getData() {
    const visibleTabs = getPlayerSidebarTabsSetting();

    return {
      tabs: getSidebarTabsForConfig().map((tab) => ({
        ...tab,
        checked: isPlayerSidebarTabVisible(tab.id, visibleTabs)
      }))
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("[data-action='select-all']").on("click", () => {
      html.find("input[type='checkbox']").prop("checked", true);
    });

    html.find("[data-action='select-none']").on("click", () => {
      html.find("input[type='checkbox']").prop("checked", false);
    });

    html.find("[data-action='hide-compendium']").on("click", () => {
      html.find("input[type='checkbox']").prop("checked", true);
      html.find("input[data-sidebar-tab-id='compendium']").prop("checked", false);
    });
  }

  async _updateObject(event) {
    const visibleTabs = {};

    for (const input of event.currentTarget.querySelectorAll("[data-sidebar-tab-id]")) {
      visibleTabs[input.dataset.sidebarTabId] = input.checked;
    }

    if (!Object.values(visibleTabs).some(Boolean)) {
      const fallbackTab = visibleTabs.chat !== undefined ? "chat" : Object.keys(visibleTabs)[0];
      if (fallbackTab) visibleTabs[fallbackTab] = true;
      ui.notifications?.warn("至少需要保留一个玩家可见的右侧栏。已自动保留一个栏目。");
    }

    await game.settings.set(MODULE_ID, PLAYER_SIDEBAR_TABS_SETTING, visibleTabs);
    applyPlayerSidebarTabVisibility();
  }
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, PLAYER_SIDEBAR_TABS_SETTING, {
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_PLAYER_SIDEBAR_TABS,
    onChange: applyPlayerSidebarTabVisibility
  });

  game.settings.registerMenu(MODULE_ID, "playerSidebarTabsConfig", {
    name: "玩家右侧栏可见项",
    label: "配置",
    hint: "选择非 GM 玩家能看到哪些右侧边栏标签。GM 不受影响。",
    icon: "fas fa-columns",
    type: PlayerSidebarTabsConfig,
    restricted: true
  });
});

Hooks.once("ready", applyPlayerSidebarTabVisibility);
Hooks.on("renderSidebar", applyPlayerSidebarTabVisibility);
Hooks.on("collapseSidebar", applyPlayerSidebarTabVisibility);
Hooks.on("updateSetting", (setting) => {
  const key = setting?.key || setting?.id;
  if (key === `${MODULE_ID}.${PLAYER_SIDEBAR_TABS_SETTING}`) applyPlayerSidebarTabVisibility();
});

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
