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
