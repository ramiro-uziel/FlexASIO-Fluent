<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { onMount, onDestroy } from "svelte";
  import {
    WebviewWindow,
    getCurrentWebviewWindow,
  } from "@tauri-apps/api/webviewWindow";
  import { ready, accentColor } from "$lib/stores";
  import { adjustBrightness } from "$lib/utils/system";
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

  function setBackgroundColor(color: string): void {
    const darkAccentColor = adjustBrightness(color, -87, -10); // Darken the accent color
    document.documentElement.style.setProperty(
      "--body-bg-color",
      darkAccentColor
    );
    document.body.style.backgroundColor = "var(--body-bg-color)";
  }

  function setTransparentBackground(): void {
    document.body.style.backgroundColor = "transparent";
  }

  async function getAccentColor() {
    try {
      const color = adjustBrightness(
        await invoke<string>("get_accent_color"),
        70
      );
      accentColor.update(() => color);
    } catch (error) {
      console.error("Error getting accent color:", error);
    }
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
    await getAccentColor();
    try {
      accentColor.subscribe((color) => {
        if (color) {
          setBackgroundColor(color);
        }
      });

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

      // Set the background color based on the accent color

      setupEventListeners();
      ready.set(true);

      // Set background to transparent after ready is set to true
      ready.subscribe((isReady) => {
        if (isReady) {
          setTransparentBackground();
        }
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
