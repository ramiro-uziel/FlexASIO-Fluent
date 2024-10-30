import { invoke } from "@tauri-apps/api/core";
import { inputDevices, outputDevices } from "$lib/stores";
import type { DeviceItem, Config } from "$lib/types";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { path } from "@tauri-apps/api";

export class AudioManager {
  static async getDevices(selectedBackend: string) {
    try {
      const [inputList, outputList] = await invoke<[string[], string[]]>(
        "list_audio_devices",
        {
          backend: selectedBackend,
        }
      );
      return { inputList, outputList };
    } catch (error) {
      console.error("Error getting devices:", error);
      return { inputList: [], outputList: [] };
    }
  }

  static async labelDevices(selectedBackend: string) {
    const extractNameAndDevice = (
      device: string,
      selectedBackend: string
    ): DeviceItem => {
      if (selectedBackend === "MME") {
        const parts = device.split("(");
        if (parts.length > 1) {
          const name = parts[0].trim();
          const deviceValue = parts[1].replace(/\)/g, "").trim();
          return { name: device, label: name, device: deviceValue, value: -1 };
        }
      } else if (device.includes("bthhfenum.sys")) {
        const match = device.match(/;\((.*?)\)/);
        if (match) {
          return {
            name: device,
            label: match[1].trim(),
            device: "Bluetooth",
            value: -1,
          };
        }
      } else {
        const match = device.match(/^(.*?)\s*\((.*?)\)$/);
        if (match) {
          return {
            name: device,
            label: match[1].trim(),
            device: match[2].trim(),
            value: -1,
          };
        }
      }
      return { name: device, label: device, device: "", value: -1 };
    };

    const sortAndReindex = (devices: string[]) =>
      devices
        .map((device, index) => ({
          ...extractNameAndDevice(device, selectedBackend),
          originalIndex: index,
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((device, index) => ({ ...device, value: index }));

    const { inputList, outputList } = await this.getDevices(selectedBackend);

    inputDevices.set([
      { name: "", label: "None", device: "", value: -1 },
      ...sortAndReindex(inputList),
    ]);
    outputDevices.set([
      { name: "", label: "None", device: "", value: -1 },
      ...sortAndReindex(outputList),
    ]);
  }

  static async getTomlPath() {
    try {
      const homeDir = await path.homeDir();
      return await path.join(homeDir, "FlexASIO.toml");
    } catch (error) {
      console.error("Error getting TOML path:", error);
    }
  }

  static async loadConfig(): Promise<Config> {
    try {
      const tomlPath = await AudioManager.getTomlPath();
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

  static async saveConfig(config: Partial<Config>) {
    try {
      const tomlPath = await AudioManager.getTomlPath();
      if (!tomlPath) throw new Error("Could not get TOML path");
      await invoke("save_config", { tomlPath, config });
    } catch (error) {
      console.error("Failed to save config", error);
      throw error;
    }
  }

  static async copyConfig() {
    try {
      const tomlPath = await AudioManager.getTomlPath();
      if (!tomlPath) throw new Error("Could not get TOML path");
      const content = await readTextFile(tomlPath);
      await writeText(content);
    } catch (error) {
      console.error("Error copying the TOML file:", error);
    }
  }

  static compareConfigs(
    current: Partial<Config>,
    original: Config | null
  ): boolean {
    if (!original) return false;

    const compareObjects = (obj1: any, obj2: any): boolean => {
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
}
