import { writable } from "svelte/store";

export const ready = writable(false);
export const accentColor = writable("");

export interface DeviceItem {
  name: string;
  label: string;
  device: string;
  value: number;
}

export let inputDevices = writable([] as DeviceItem[]);
export let outputDevices = writable([] as DeviceItem[]);
