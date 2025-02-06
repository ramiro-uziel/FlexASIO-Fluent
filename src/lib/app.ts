import { writable } from "svelte/store";
import { accentColor, appWindow } from "$lib/stores";
import { getVersion } from "@tauri-apps/api/app";
import { load } from "@tauri-apps/plugin-store";
import { invoke } from "@tauri-apps/api/core";
import { adjustBrightness } from "./color";

let storePromise = load("config.json", { autoSave: false });

export const updateAvailable = writable(false);
export const latestVersion = writable<string | null>(null);
export const updateDismissed = writable(false);
export const inputExpanded = writable(true);
export const outputExpanded = writable(true);
export const editDevices = writable(true);

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

export async function checkVersion() {
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
    const githubVersion = latestRelease.tag_name.replace("v", "");

    latestVersion.set(githubVersion);

    const comparison = compareVersions(currentVersion, githubVersion);
    updateAvailable.set(comparison < 0);
  } catch (error) {
    console.error("Error checking version:", error);
    latestVersion.set(null);
  }
}

async function loadStoreValue(key: string, storeValue: any) {
  const store = await storePromise;
  const val = (await store.get(key)) as boolean;
  storeValue.set(val);
  return val;
}

export async function setUpdateDismissed(val: boolean) {
  const store = await storePromise;
  await store.set("dismissUpdate", val);
  updateDismissed.set(val);
}

export async function loadUpdateDismissed() {
  return await loadStoreValue("dismissUpdate", updateDismissed);
}

export async function loadInputExpanded() {
  return await loadStoreValue("inputExpanded", inputExpanded);
}

export async function loadOutputExpanded() {
  return await loadStoreValue("outputExpanded", outputExpanded);
}

export async function loadEditDevices() {
  return await loadStoreValue("editDevices", editDevices);
}

export async function loadUIState() {
  const store = await storePromise;
  await loadUpdateDismissed();
  await loadInputExpanded();
  await loadOutputExpanded();
  await loadEditDevices();

  inputExpanded.subscribe((val) => {
    store.set("inputExpanded", val);
  });

  outputExpanded.subscribe((val) => {
    store.set("outputExpanded", val);
  });

  editDevices.subscribe((val) => {
    store.set("editDevices", val);
  });
}

export async function checkWindows11() {
  try {
    const version = (await invoke("get_windows_version")) as [
      number,
      number,
      number
    ];
    return version[2] >= 22000;
  } catch (error) {
    console.error("Error checking Windows version:", error);
  }
}

export const minimizeWindow = () => {
  appWindow.subscribe((window) => {
    window?.minimize();
  });
};

export const maximizeWindow = async () => {
  appWindow.subscribe(async (window) => {
    await window?.toggleMaximize();
  });
};

export const closeWindow = () => {
  appWindow.subscribe((window) => {
    window?.close();
  });
};

export const fullscreenWindow = async () => {
  appWindow.subscribe(async (window) => {
    const fullscreen = await window?.isFullscreen();

    if (fullscreen) {
      await window?.setFullscreen(false);
    } else {
      await window?.setFullscreen(true);
    }
  });
};

export async function getAccentColor(): Promise<void> {
  try {
    const color = adjustBrightness(
      await invoke<string>("get_accent_color"),
      70
    );
    accentColor.set(color);
  } catch (error) {
    console.error("Error getting accent color:", error);
  }
}
