import { writable } from "svelte/store";
import { type DeviceItem } from "./types";
import type { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export const ready = writable(false);
export const isWidescreen = writable<boolean>(false);
export let inputDevices = writable([] as DeviceItem[]);
export let outputDevices = writable([] as DeviceItem[]);
export const appWindow = writable<WebviewWindow | undefined>(undefined);

export const accentSystemColors = writable<Record<string, string>>({});
export const accent = writable<string>("");
export const accentHover = writable<string>("");
export const accentActive = writable<string>("");

export const updateAvailable = writable(false);
export const latestVersion = writable<string | null>(null);
export const updateDismissed = writable(false);
export const inputExpanded = writable(true);
export const outputExpanded = writable(true);
export const editDevices = writable(true);
