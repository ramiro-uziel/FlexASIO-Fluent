import { writable } from "svelte/store";
import { type DeviceItem } from "./types";
import type { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export const ready = writable(false);
export const accentColor = writable<string>("");
export const isWidescreen = writable<boolean>(false);
export let inputDevices = writable([] as DeviceItem[]);
export let outputDevices = writable([] as DeviceItem[]);
export const appWindow = writable<WebviewWindow | undefined>(undefined);
