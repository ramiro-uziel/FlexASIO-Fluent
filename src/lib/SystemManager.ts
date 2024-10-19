import { invoke } from "@tauri-apps/api/core";
import { accentColor } from "$lib/stores";

export function adjustBrightness(color: string, percent: number) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = parseInt(((R * (100 + percent)) / 100).toString());
  G = parseInt(((G * (100 + percent)) / 100).toString());
  B = parseInt(((B * (100 + percent)) / 100).toString());

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  let RR = R.toString(16).length === 1 ? "0" + R.toString(16) : R.toString(16);
  let GG = G.toString(16).length === 1 ? "0" + G.toString(16) : G.toString(16);
  let BB = B.toString(16).length === 1 ? "0" + B.toString(16) : B.toString(16);

  return "#" + RR + GG + BB;
}

export class SystemManager {
  static async checkMica() {
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

  static async getAccentColor() {
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
}
