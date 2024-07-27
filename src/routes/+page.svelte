<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { invoke } from "@tauri-apps/api/core";
  import { path } from "@tauri-apps/api";
  import { dev } from "$app/environment";
  import { Button, Tooltip } from "fluent-svelte";
  import WindowTitlebar from "$lib/WindowTitlebar.svelte";
  import OutputEdit from "$lib/components/OutputEdit.svelte";
  import DeviceEdit from "$lib/components/DeviceEdit.svelte";
  import { inputDevices, outputDevices, ready, accentColor } from "$lib/stores";
  import type { DeviceItem } from "$lib/stores";
  import { adjustBrightness } from "$lib/utils/utils";
  import Save from "@fluentui/svg-icons/icons/save_20_regular.svg";
  import Folder from "@fluentui/svg-icons/icons/folder_20_regular.svg";
  import Checkmark from "@fluentui/svg-icons/icons/checkmark_20_regular.svg";
  import Copy from "@fluentui/svg-icons/icons/copy_20_regular.svg";
  import Pen from "@fluentui/svg-icons/icons/edit_20_regular.svg";
  import Flask from "$lib/icons/flask-solid.svg";

  interface Config {
    backend: string;
    bufferSizeSamples: number | null;
    input: InputOutput;
    output: InputOutput;
  }

  interface InputOutput {
    device: string | null;
    suggestedLatencySeconds: number | null;
    wasapiExclusiveMode: boolean | null;
    wasapiAutoConvert: boolean | null;
    channels: number | null;
  }

  const Backend = [
    { name: "MME", value: "MME" },
    { name: "DirectSound", value: "DirectSound" },
    { name: "WASAPI", value: "WASAPI" },
    { name: "WDM-KS", value: "WDM-KS" },
  ];

  const backendMapping: Record<string, string> = {
    MME: "MME",
    "Windows DirectSound": "DirectSound",
    "Windows WASAPI": "WASAPI",
    "Windows WDM-KS": "WDM-KS",
  };

  const backendOkay: Record<string, string> = {
    MME: "MME",
    DirectSound: "Windows DirectSound",
    WASAPI: "Windows WASAPI",
    "WDM-KS": "Windows WDM-KS",
  };

  let BufferSize = [
    { name: "Default", value: "Default" },
    { name: "0", value: 0 },
    { name: "16", value: 16 },
    { name: "32", value: 32 },
    { name: "64", value: 64 },
    { name: "128", value: 128 },
    { name: "256", value: 256 },
    { name: "512", value: 512 },
    { name: "1024", value: 1024 },
  ];

  let selectedBackend: string;
  let selectedBuffer: string | number;
  let editDevices = true;
  let inputExpanded = true;
  let selectedInput = -1;
  let inputSetModes = false;
  let inputExclusive = false;
  let inputAutoconvert = false;
  let inputSetLatency = false;
  let inputLatency = 0;
  let inputSetChannels = false;
  let inputChannels = 0;
  let outputExpanded = true;
  let selectedOutput = -1;
  let outputSetModes = false;
  let outputExclusive = false;
  let outputAutoconvert = false;
  let outputSetLatency = false;
  let outputLatency = 0;
  let outputSetChannels = false;
  let outputChannels = 0;
  let toggleName = "Edit Output";
  let inputDevicesList: string[] = [];
  let outputDevicesList: string[] = [];

  let outputEdit: OutputEdit;

  let textEdited: boolean = false;
  let listEdited: boolean = false;

  let originalConfig: Config | null = null;
  let currentConfig: Partial<Config> = {};

  let variant: "accent" | "standard" | "hyperlink" | undefined = "standard";

  let loaded = false;

  async function toggleDevices() {
    editDevices = !editDevices;
    toggleName = editDevices ? "Edit Output" : "Edit Devices";
    await loadConfig();
  }

  async function getAccentColor() {
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

  async function checkMica() {
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

  async function getDevices() {
    try {
      const result = await invoke<[string[], string[]]>("list_audio_devices", {
        backend: selectedBackend,
      });
      inputDevicesList = result[0];
      outputDevicesList = result[1];
    } catch (error) {
      console.error("Error getting devices:", error);
      inputDevicesList = [];
      outputDevicesList = [];
    }
  }

  function labelDevices() {
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

    inputDevices.set([
      { name: "", label: "None", device: "", value: -1 },
      ...sortAndReindex(inputDevicesList),
    ]);
    outputDevices.set([
      { name: "", label: "None", device: "", value: -1 },
      ...sortAndReindex(outputDevicesList),
    ]);
  }

  async function getBackend(config: Config) {
    selectedBackend = backendMapping[config.backend];
  }

  async function getLatency(config: Config) {
    if (config.input.suggestedLatencySeconds !== null) {
      inputSetLatency = true;
      inputLatency = config.input.suggestedLatencySeconds;
    } else {
      inputSetLatency = false;
      inputLatency = 0;
    }

    if (config.output.suggestedLatencySeconds !== null) {
      outputSetLatency = true;
      outputLatency = config.output.suggestedLatencySeconds;
    } else {
      outputSetLatency = false;
      outputLatency = 0;
    }
  }

  async function getChannels(config: Config) {
    if (config.input.channels !== null) {
      inputSetChannels = true;
      inputChannels = config.input.channels;
    } else {
      inputSetChannels = false;
      inputChannels = 0;
    }

    if (config.output.channels !== null) {
      outputSetChannels = true;
      outputChannels = config.output.channels;
    } else {
      outputSetChannels = false;
      outputChannels = 0;
    }
  }

  function compareConfigs(
    current: Partial<Config>,
    original: Config | null
  ): boolean {
    if (!original) return false;

    console.log(
      "Are they fucking the same",
      JSON.stringify(original) === JSON.stringify(current)
    );
    console.log("Original", JSON.stringify(original));
    console.log("Current", JSON.stringify(current));

    return (
      current.backend === original.backend &&
      current.bufferSizeSamples === original.bufferSizeSamples &&
      JSON.stringify(current.input) === JSON.stringify(original.input) &&
      JSON.stringify(current.output) === JSON.stringify(original.output)
    );
  }

  function updateListEdited() {
    if (!originalConfig) return;

    currentConfig = {
      backend: selectedBackend ? backendOkay[selectedBackend] : undefined,
      bufferSizeSamples:
        selectedBuffer === "Default" ? null : Number(selectedBuffer),
      input: {
        channels: inputSetChannels ? Number(inputChannels) : null,
        device:
          selectedInput >= 0
            ? get(inputDevices)[selectedInput + 1]?.name || ""
            : "",
        suggestedLatencySeconds: inputSetLatency ? Number(inputLatency) : null,
        wasapiAutoConvert: inputSetModes ? inputAutoconvert : null,
        wasapiExclusiveMode: inputSetModes ? inputExclusive : null,
      },
      output: {
        channels: outputSetChannels ? Number(outputChannels) : null,
        device:
          selectedOutput >= 0
            ? get(outputDevices)[selectedOutput + 1]?.name || ""
            : "",
        suggestedLatencySeconds: outputSetLatency
          ? Number(outputLatency)
          : null,
        wasapiAutoConvert: outputSetModes ? outputAutoconvert : null,
        wasapiExclusiveMode: outputSetModes ? outputExclusive : null,
      },
    };

    listEdited = !compareConfigs(currentConfig, originalConfig);
  }

  // Modify the existing reactive statement
  $: if (originalConfig && selectedBackend) {
    selectedBackend,
      selectedBuffer,
      selectedInput,
      selectedOutput,
      inputSetModes,
      inputExclusive,
      inputAutoconvert,
      inputSetLatency,
      inputLatency,
      inputSetChannels,
      inputChannels,
      outputSetModes,
      outputExclusive,
      outputAutoconvert,
      outputSetLatency,
      outputLatency,
      outputSetChannels,
      outputChannels,
      updateListEdited();
  }

  $: {
    if (loaded) {
      if (textEdited || listEdited) {
        variant = "accent";
      } else {
        variant = "standard";
      }
    }
  }

  async function loadConfig() {
    const homeDir = await path.homeDir();
    const tomlPath = await path.join(homeDir, "FlexASIO.toml");

    try {
      const config: Config = await invoke("load_config", { tomlPath });

      originalConfig = JSON.parse(JSON.stringify(config));

      await getBackend(config);

      if (config.bufferSizeSamples === null) selectedBuffer = "Default";
      else selectedBuffer = config.bufferSizeSamples;

      await getDevices();
      labelDevices();

      const inputDevicesValue = get(inputDevices);
      const outputDevicesValue = get(outputDevices);

      selectedInput =
        inputDevicesValue.findIndex((d) => d.name === config.input.device) - 1;
      selectedOutput =
        outputDevicesValue.findIndex((d) => d.name === config.output.device) -
        1;

      if (selectedInput === -2) selectedInput = -1;
      if (selectedOutput === -2) selectedOutput = -1;

      await getLatency(config);
      await getChannels(config);

      if (selectedBackend === "WASAPI") {
        if (
          config.input.wasapiExclusiveMode ||
          config.input.wasapiAutoConvert !== null
        ) {
          inputSetModes = true;
          inputExclusive = config.input.wasapiExclusiveMode ?? false;
          inputAutoconvert = config.input.wasapiAutoConvert ?? false;
        } else {
          inputSetModes = false;
          inputExclusive = false;
          inputAutoconvert = false;
        }

        if (
          config.output.wasapiExclusiveMode ||
          config.output.wasapiAutoConvert !== null
        ) {
          outputSetModes = true;
          outputExclusive = config.output.wasapiExclusiveMode ?? false;
          outputAutoconvert = config.output.wasapiAutoConvert ?? false;
        } else {
          outputSetModes = false;
          outputExclusive = false;
          outputAutoconvert = false;
        }
      }

      loaded = true;
      updateListEdited();
    } catch (error) {
      console.error("Failed to load config", error);
    }
  }

  async function updateDevices() {
    await getDevices();
    labelDevices();
  }

  async function updateDevicesList() {
    await getDevices();
    labelDevices();
    selectedInput = -1;
    selectedOutput = -1;
  }

  async function handleApply() {
    if (!editDevices) {
      outputEdit.saveTomlFile();
    } else {
      const homeDir = await path.homeDir();
      const tomlPath = await path.join(homeDir, "FlexASIO.toml");
      try {
        await invoke("save_config", { tomlPath, config: currentConfig });
      } catch (error) {
        console.error("Failed to save config", error);
      }
      listEdited = false;
    }
  }

  onMount(async () => {
    await checkMica();
    await loadConfig();
    await getAccentColor();
  });
</script>

<div class="overflow-hidden w-full">
  {#if $ready}
    <WindowTitlebar class="h-10 overflow-hidden">
      <div class="pointer-events-none w-full">
        <div class="flex flex-row items-center align-middle p-2 gap-2 ml-1">
          <img
            src="favicon.png"
            alt="FlexASIO Fluent Icon"
            class="size-[15px]"
          />
          <span class="text-[12px]">FlexASIO Fluent</span>
        </div>
      </div>
      {#if dev}
        <div
          class="pointer-events-none flex flex-row items-center justify-end gap-2 w-full -mt-2 mr-2"
        >
          <span class="text-[12px]">Dev</span>
          <Flask class="size-2.5"></Flask>
        </div>
      {/if}
    </WindowTitlebar>
    <div class="flex flex-row w-full justify-center">
      <div class="flex flex-row w-full max-w-[1000px] min-w-[300px]">
        {#if editDevices}
          <div class="w-full flex justify-center select-none px-3">
            <div class="flex flex-col gap-3 self-center w-full rounded-lg">
              <div class="flex flex-col gap-2">
                <DeviceEdit
                  {Backend}
                  {BufferSize}
                  bind:selectedBackend
                  bind:selectedBuffer
                  bind:inputExpanded
                  bind:selectedInput
                  bind:inputSetModes
                  bind:inputExclusive
                  bind:inputAutoconvert
                  bind:outputExpanded
                  bind:selectedOutput
                  bind:outputSetModes
                  bind:outputExclusive
                  bind:outputAutoconvert
                  bind:inputSetLatency
                  bind:inputLatency
                  bind:inputSetChannels
                  bind:inputChannels
                  bind:outputSetLatency
                  bind:outputLatency
                  bind:outputSetChannels
                  bind:outputChannels
                  on:updateDevices={updateDevicesList}
                  on:refreshDevices={loadConfig}
                ></DeviceEdit>
              </div>
            </div>
          </div>
        {/if}
        {#if !editDevices}
          <div class="w-full flex justify-center select-none px-3">
            <div class="flex flex-col gap-3 self-center w-full rounded-lg">
              <div class="flex flex-col gap-2">
                <OutputEdit
                  --fds-accent-default={$accentColor}
                  --fds-accent-secondary={$accentColor}
                  bind:this={outputEdit}
                  bind:textEdited
                />
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
    <div
      class="rounded-lg flex flex-row w-screen justify-center bottom-0 px-1.5 mb-1 fixed"
    >
      <div
        class="rounded-lg flex flex-row justify-center w-full p-2 mr-1 max-w-[985px] min-w-[200px]"
      >
        <div class="flex flex-row justify-between w-full">
          <div class="flex gap-2.5">
            <Button on:click={toggleDevices}
              ><Pen /><span class="pl-1.5">{toggleName}</span></Button
            >
          </div>
          <div class="flex gap-2.5">
            <Button><Save /><span class="pl-1.5">Save</span></Button>
            <Button><Folder /><span class="pl-1.5">Load</span></Button>
            <Tooltip text="Copy the config"><Button><Copy /></Button></Tooltip>
            <Tooltip text="Apply the config" alignment="end" offset={5}>
              <Button
                on:click={handleApply}
                {variant}
                --fds-accent-default={$accentColor}
                --fds-accent-secondary={$accentColor}
                --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
                ><Checkmark /></Button
              >
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  @import url("https://unpkg.com/fluent-svelte/theme.css");

  :global(body) {
    color: var(--fds-text-primary);
    fill: var(--fds-text-primary);
  }

  :global(body.apply-background-color) {
    background-color: var(--fds-solid-background-base);
  }
</style>
