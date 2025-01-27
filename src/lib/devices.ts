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

function extractLastParentheses(str: string) {
  let result = null;
  let baseName = str;
  let depth = 0;

  for (let i = str.length - 1; i >= 0; i--) {
    if (str[i] === ")") {
      if (depth === 0) {
        let j = i;
        let innerDepth = 1;
        while (j >= 0 && innerDepth > 0) {
          j--;
          if (str[j] === ")") innerDepth++;
          if (str[j] === "(") innerDepth--;
        }
        if (innerDepth === 0) {
          result = str.substring(j + 1, i);
          baseName = str.substring(0, j).trim();
          break;
        }
      }
      depth++;
    } else if (str[i] === "(") {
      depth--;
    }
  }

  return { content: result, baseName };
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
      const bracketMatch = device.match(/^(.*?)\s*\[(.*?)\]$/);
      const { content: deviceName, baseName } = extractLastParentheses(device);

      if (deviceName) {
        const brackets = bracketMatch ? bracketMatch[2] : null;
        const finalLabelName = brackets
          ? `[${brackets}] ${baseName}`
          : baseName;

        return {
          name: device,
          label: finalLabelName,
          device: deviceName,
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
