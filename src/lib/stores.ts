import { writable } from "svelte/store";
import { type DeviceItem } from "./types";
import type { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { adjustBrightness } from "./color";
import { invoke } from "@tauri-apps/api/core";

export const ready = writable(false);
export const accentColor = writable<string>("");
export const isWidescreen = writable<boolean>(false);

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

export let inputDevices = writable([] as DeviceItem[]);
export let outputDevices = writable([] as DeviceItem[]);

export const appWindow = writable<WebviewWindow | undefined>(undefined);
