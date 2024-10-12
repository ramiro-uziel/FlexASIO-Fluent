import { invoke } from "@tauri-apps/api/core";
import { accentColor } from "$lib/stores";
import { adjustBrightness } from "./utils";

export async function checkMica() {
  try {
    const [major, , build] = await invoke<[number, number, number]>(
      "get_windows_version"
    );
    if (!(major > 10 || (major === 10 && build >= 22000))) {
      document.body.classList.add("apply-background-color");
    }
  } catch (error) {
    console.error(`Error fetching Windows version: ${error}`);
  }
}

export async function getAccentColor() {
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
