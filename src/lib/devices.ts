import { invoke } from "@tauri-apps/api/core";
import { inputDevices, outputDevices } from "$lib/stores";
import type { DeviceItem } from "$lib/types";

export async function getDevices(selectedBackend: string) {
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

export async function labelDevices(selectedBackend: string) {
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
      const bracketMatch = device.match(/^(.*?)\s*\((.*?)\)(?:\s*\[(.*?)\])?$/);
      if (bracketMatch) {
        const baseName = bracketMatch[2].trim();
        const parenthesis = bracketMatch[1].trim();
        const brackets = bracketMatch[3];

        const finalLabelName = brackets
          ? `[${brackets}] ${parenthesis}`
          : parenthesis;

        return {
          name: device,
          label: finalLabelName,
          device: baseName,
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
      .sort((a, b) => {
        const aIsLoopback = a.label.startsWith("[Loopback]");
        const bIsLoopback = b.label.startsWith("[Loopback]");

        if (aIsLoopback && !bIsLoopback) return 1;
        if (!aIsLoopback && bIsLoopback) return -1;
        return a.label.localeCompare(b.label);
      })
      .map((device, index) => ({ ...device, value: index }));

  const { inputList, outputList } = await getDevices(selectedBackend);

  inputDevices.set([
    { name: "", label: "None", device: "", value: -1 },
    ...sortAndReindex(inputList),
  ]);
  outputDevices.set([
    { name: "", label: "None", device: "", value: -1 },
    ...sortAndReindex(outputList),
  ]);
}
