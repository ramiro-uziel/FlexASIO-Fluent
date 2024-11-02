import { invoke } from "@tauri-apps/api/core";
import type { Config } from "$lib/types";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { path } from "@tauri-apps/api";

export async function getTomlPath() {
  try {
    const homeDir = await path.homeDir();
    return await path.join(homeDir, "FlexASIO.toml");
  } catch (error) {
    console.error("Error getting TOML path:", error);
  }
}

export async function loadConfig(): Promise<Config> {
  try {
    const tomlPath = await getTomlPath();
    if (!tomlPath) throw new Error("Could not get TOML path");

    let configContent: string;
    try {
      configContent = await readTextFile(tomlPath);
    } catch (error) {
      console.warn(
        "Config file not found or could not be read, creating a default config."
      );
      configContent = `backend = "Windows WASAPI"\n[input]\ndevice = ""\n[output]\ndevice = ""`;
      await writeTextFile(tomlPath, configContent);
    }

    return await invoke("load_config", { tomlPath });
  } catch (error) {
    console.error("Failed to load config", error);
    throw error;
  }
}

export async function saveConfig(config: Partial<Config>) {
  try {
    const tomlPath = await getTomlPath();
    if (!tomlPath) throw new Error("Could not get TOML path");
    await invoke("save_config", { tomlPath, config });
  } catch (error) {
    console.error("Failed to save config", error);
    throw error;
  }
}

export async function copyConfig() {
  try {
    const tomlPath = await getTomlPath();
    if (!tomlPath) throw new Error("Could not get TOML path");
    const content = await readTextFile(tomlPath);
    await writeText(content);
  } catch (error) {
    console.error("Error copying the TOML file:", error);
  }
}

export function compareConfigs(
  current: Partial<Config>,
  original: Config | null
): boolean {
  if (!original || !current) return false;

  const compareObjects = (obj1: any, obj2: any): boolean => {
    if (!obj1 || !obj2) return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (typeof obj1[key] === "object" && obj1[key] !== null) {
        if (!compareObjects(obj1[key], obj2[key])) return false;
      } else if (obj1[key] !== obj2[key]) {
        return false;
      }
    }

    return true;
  };

  return (
    current.backend === original.backend &&
    current.bufferSizeSamples === original.bufferSizeSamples &&
    compareObjects(current.input, original.input) &&
    compareObjects(current.output, original.output)
  );
}
