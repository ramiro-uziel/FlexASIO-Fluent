<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { onMount, onDestroy } from "svelte";
  import { getVersion } from "@tauri-apps/api/app";
  import {
    WebviewWindow,
    getCurrentWebviewWindow,
  } from "@tauri-apps/api/webviewWindow";
  import { ready, accentColor } from "$lib/stores";
  import { adjustBrightness } from "$lib/color";
  import { writable } from "svelte/store";
  import "../app.css";

  // Create a store for update status
  export const updateAvailable = writable(false);

  // Window
  let currentWindow: WebviewWindow;
  let unlisten: (() => void) | undefined;

  // Version checking
  const GITHUB_OWNER = "ramiro-uziel";
  const GITHUB_REPO = "FlexASIO-Fluent";

  function compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split(".").map(Number);
    const v2Parts = version2.split(".").map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }

    return 0;
  }

  async function checkVersion() {
    try {
      const currentVersion = await getVersion();

      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API request failed: ${response.status}`);
      }

      const latestRelease = await response.json();
      const latestVersion = latestRelease.tag_name.replace("v", "");

      // Only set updateAvailable to true if current version is lower than latest
      const comparison = compareVersions(currentVersion, latestVersion);
      updateAvailable.set(comparison < 0);

      console.log(
        `Current version: ${currentVersion}, Latest: ${latestVersion}`
      );
    } catch (error) {
      console.error("Error checking version:", error);
    }
  }

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
    await checkVersion();

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
