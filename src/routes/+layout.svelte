<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { ready } from "$lib/stores";
  import "../app.css";

  let unlisten: (() => void) | undefined;

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

  const updateDarkMode = (theme: string): void => {
    document.documentElement.classList.toggle("dark", theme === "dark");
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
      const currentWindow = getCurrentWindow();
      const theme = await currentWindow.theme();

      updateDarkMode(theme?.toString() || "dark");

      await currentWindow.show();
      ready.set(true);
      setupEventListeners();

      unlisten = await currentWindow.onThemeChanged(({ payload: theme }) => {
        updateDarkMode(theme);
      });
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
