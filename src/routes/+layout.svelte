<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { onMount, onDestroy } from "svelte";
  import {
    WebviewWindow,
    getCurrentWebviewWindow,
  } from "@tauri-apps/api/webviewWindow";
  import { ready, accentColor } from "$lib/stores";
  import { adjustBrightness } from "$lib/color";
  import "../app.css";

  // Window
  let currentWindow: WebviewWindow;
  let unlisten: (() => void) | undefined;

  function initWindow() {
    currentWindow.show();
  }

  // Theme
  function updateDarkMode(theme: string): void {
    document.documentElement.classList.toggle("dark", theme === "dark");
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

  async function logDllVersion() {
    try {
      const version = await invoke("get_dll_product_version", {
        filePath: "C:\\Program Files\\FlexASIO\\x64\\FlexASIO.dll",
      });
      console.log("Product Version:", version);
    } catch (error) {
      console.error("Error getting version:", error);
    }
  }

  // Disabling context menu and specific keys
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

  // Init
  async function initializeApp() {
    currentWindow = getCurrentWebviewWindow();

    await getAccentColor();
    await logDllVersion();

    // Hack for tauri issue, timeout to prevent flickering.
    // The background color is not transparent on startup for a brief moment,
    // so we hide the window until the style is applied on the window.
    await new Promise((r) => setTimeout(r, 300));

    let theme = await currentWindow.theme();
    updateDarkMode(theme?.toString() || "dark");

    unlisten = await currentWindow.onThemeChanged(({ payload: theme }) => {
      updateDarkMode(theme);
    });

    setupEventListeners();

    ready.set(true);
  }

  onMount(async () => {
    await initializeApp();

    ready.subscribe((isReady) => {
      if (isReady) {
        initWindow();
      }
    });
  });

  onDestroy(() => {
    if (unlisten) {
      unlisten();
    }
    removeEventListeners();
  });
</script>

<slot />
