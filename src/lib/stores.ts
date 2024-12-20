import { writable } from "svelte/store";
import { type DeviceItem } from "./types";

export const ready = writable(false);
export const accentColor = writable("");
export const isWidescreen = writable(false);

export let inputDevices = writable([] as DeviceItem[]);
export let outputDevices = writable([] as DeviceItem[]);
