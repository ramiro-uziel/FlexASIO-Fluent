<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
  import { ready } from "$lib/stores";
  import "../app.css";

  let unlisten: (() => void) | undefined;

  async function initWindow() {
    const window = WebviewWindow.getCurrent();
    await window.show();
  }

  function setPreferedTheme() {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const value = prefersDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", value);
  }

  function updateDarkMode(theme: string): void {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }

  const isTauriLocalhost = (): boolean =>
    window.location.hostname === "tauri.localhost";

  const disableContextMenu = (e: MouseEvent): void => {
    if (!(e.target as Element).closest("[data-enable-context-menu]")) {
      e.preventDefault();
    }
  };

  const disableSpecificKeys = (e: KeyboardEvent): void => {
    const isFunctionKey =
      e.key.startsWith("F") && !isNaN(Number(e.key.substring(1)));
    const isDisabledCtrlCombination =
      e.ctrlKey && ["f", "g", "j", "p"].includes(e.key.toLowerCase());
    const isAllowedCtrlCombination =
      e.ctrlKey && ["a", "c", "v", "x", "z"].includes(e.key.toLowerCase());
    if (
      (isFunctionKey || isDisabledCtrlCombination) &&
      !isAllowedCtrlCombination
    ) {
      e.preventDefault();
    }
  };

  const setupEventListeners = (): void => {
    if (isTauriLocalhost()) {
      document.addEventListener("contextmenu", disableContextMenu, {
        capture: true,
      });
      document.addEventListener("keydown", disableSpecificKeys, {
        capture: true,
      });
    }
  };

  const removeEventListeners = (): void => {
    if (isTauriLocalhost()) {
      document.removeEventListener("contextmenu", disableContextMenu, {
        capture: true,
      });
      document.removeEventListener("keydown", disableSpecificKeys, {
        capture: true,
      });
    }
  };

  onMount(async () => {
    try {
      setPreferedTheme();
      await new Promise((r) => setTimeout(r, 300));

      await initWindow();

      let currentWindow = getCurrentWebviewWindow();
      currentWindow.setTheme("dark");
      let theme = await currentWindow.theme();
      updateDarkMode(theme?.toString() || "dark");
      unlisten = await currentWindow.onThemeChanged(({ payload: theme }) => {
        updateDarkMode(theme);
      });

      setupEventListeners();
      ready.set(true);
    } catch (error) {
      console.error("Error during onMount:", error);
    }
  });

  onDestroy(() => {
    if (unlisten) {
      unlisten();
    }
    removeEventListeners();
  });
</script>

<slot />
