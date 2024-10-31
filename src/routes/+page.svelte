<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
  import { Button, Tooltip } from "fluent-svelte";
  import { adjustBrightness } from "$lib/color";
  import Checkmark from "@fluentui/svg-icons/icons/checkmark_20_regular.svg?component";
  import Copy from "@fluentui/svg-icons/icons/copy_20_regular.svg?component";
  import Pen from "@fluentui/svg-icons/icons/edit_20_regular.svg?component";

  import OutputEdit from "$lib/components/OutputEdit.svelte";
  import DeviceEdit from "$lib/components/DeviceEdit.svelte";

  import { inputDevices, outputDevices, accentColor } from "$lib/stores";
  import { getDevices, labelDevices } from "$lib/devices";
  import {
    loadConfig,
    saveConfig,
    copyConfig,
    compareConfigs,
  } from "$lib/config";
  import type { AudioBackend, Config } from "$lib/types";

  const AUDIO_BACKENDS: { [key: string]: AudioBackend } = {
    MME: { value: "MME", displayName: "MME" },
    DirectSound: { value: "DirectSound", displayName: "Windows DirectSound" },
    WASAPI: { value: "WASAPI", displayName: "Windows WASAPI" },
    "WDM-KS": { value: "WDM-KS", displayName: "Windows WDM-KS" },
  } as const;

  const BUFFER_SIZES = [
    { name: "Default", value: "Default" },
    { name: "0", value: "0" },
    { name: "16", value: "16" },
    { name: "32", value: "32" },
    { name: "64", value: "64" },
    { name: "128", value: "128" },
    { name: "256", value: "256" },
    { name: "512", value: "512" },
    { name: "1024", value: "1024" },
  ];

  // State Management
  let outputEdit: OutputEdit;
  let loaded = false;
  let textEdited = false;
  let listEdited = false;
  let variant: "accent" | "standard" | "hyperlink" | undefined = "standard";

  // Config State
  let originalConfig: Config | null = null;
  let currentConfig: Partial<Config> = {};

  // UI State
  let editDevices = true;
  let toggleName = "Edit Output";

  // Device Settings State
  let selectedBackend: string;
  let selectedBuffer: string | number;

  // Input Settings
  let inputExpanded = true;
  let selectedInput = -1;
  let inputSetModes = false;
  let inputExclusive = false;
  let inputAutoconvert = false;
  let inputSetLatency = false;
  let inputLatency = 0;
  let inputSetChannels = false;
  let inputChannels = 0;

  // Output Settings
  let outputExpanded = true;
  let selectedOutput = -1;
  let outputSetModes = false;
  let outputExclusive = false;
  let outputAutoconvert = false;
  let outputSetLatency = false;
  let outputLatency = 0;
  let outputSetChannels = false;
  let outputChannels = 0;

  // Backend string conversion from display name to value
  const getInternalBackendValue = (displayName: string) => {
    const backend = Object.values(AUDIO_BACKENDS).find(
      (b) => b.displayName === displayName
    );
    return backend?.value ?? displayName;
  };

  const getBackendDisplayName = (value: string) => {
    const backend = AUDIO_BACKENDS[value as keyof typeof AUDIO_BACKENDS];
    return backend?.displayName ?? value;
  };

  // Event Handlers
  async function toggleDevices() {
    editDevices = !editDevices;
    toggleName = editDevices ? "Edit Output" : "Edit Devices";
    await loadAndSetConfig();
  }

  async function handleApply() {
    if (!editDevices) {
      outputEdit.saveTomlFile();
    } else {
      await saveConfig(currentConfig);
    }
    listEdited = false;
    textEdited = false;
    await loadAndSetConfig();
  }

  // Config Management
  function updateListEdited() {
    if (!originalConfig) return;

    const inputDeviceName =
      selectedInput >= 0
        ? get(inputDevices)[selectedInput + 1]?.name || ""
        : "";
    const outputDeviceName =
      selectedOutput >= 0
        ? get(outputDevices)[selectedOutput + 1]?.name || ""
        : "";

    currentConfig = {
      backend: getBackendDisplayName(selectedBackend),
      bufferSizeSamples:
        selectedBuffer === "Default"
          ? null
          : isNaN(Number(selectedBuffer))
            ? null
            : Number(selectedBuffer),
      input: {
        channels: inputSetChannels ? Number(inputChannels) : null,
        device: inputDeviceName,
        suggestedLatencySeconds: inputSetLatency ? Number(inputLatency) : null,
        wasapiAutoConvert: inputSetModes ? inputAutoconvert : null,
        wasapiExclusiveMode: inputSetModes ? inputExclusive : null,
      },
      output: {
        channels: outputSetChannels ? Number(outputChannels) : null,
        device: outputDeviceName,
        suggestedLatencySeconds: outputSetLatency
          ? Number(outputLatency)
          : null,
        wasapiAutoConvert: outputSetModes ? outputAutoconvert : null,
        wasapiExclusiveMode: outputSetModes ? outputExclusive : null,
      },
    };

    listEdited = !compareConfigs(currentConfig, originalConfig);
  }

  async function loadAndSetConfig() {
    const config = await loadConfig();
    originalConfig = JSON.parse(JSON.stringify(config));

    selectedBackend = getInternalBackendValue(config.backend);
    selectedBuffer =
      config.bufferSizeSamples === null
        ? "Default"
        : config.bufferSizeSamples.toString();

    await getDevices(selectedBackend);
    await labelDevices(selectedBackend);

    const inputDevicesValue = get(inputDevices);
    const outputDevicesValue = get(outputDevices);

    // Set device selections
    selectedInput =
      inputDevicesValue.findIndex((d) => d.name === config.input.device) - 1;
    selectedOutput =
      outputDevicesValue.findIndex((d) => d.name === config.output.device) - 1;

    if (selectedInput === -2) selectedInput = -1;
    if (selectedOutput === -2) selectedOutput = -1;

    // Set latency values
    inputSetLatency = config.input.suggestedLatencySeconds !== null;
    inputLatency = config.input.suggestedLatencySeconds || 0;
    outputSetLatency = config.output.suggestedLatencySeconds !== null;
    outputLatency = config.output.suggestedLatencySeconds || 0;

    // Set channel values
    inputSetChannels = config.input.channels !== null;
    inputChannels = config.input.channels || 0;
    outputSetChannels = config.output.channels !== null;
    outputChannels = config.output.channels || 0;

    // Handle WASAPI-specific settings
    if (selectedBackend === "WASAPI") {
      inputSetModes =
        config.input.wasapiExclusiveMode !== null ||
        config.input.wasapiAutoConvert !== null;
      inputExclusive = config.input.wasapiExclusiveMode || false;
      inputAutoconvert = config.input.wasapiAutoConvert || false;

      outputSetModes =
        config.output.wasapiExclusiveMode !== null ||
        config.output.wasapiAutoConvert !== null;
      outputExclusive = config.output.wasapiExclusiveMode || false;
      outputAutoconvert = config.output.wasapiAutoConvert || false;
    }

    updateListEdited();
    loaded = true;
  }

  // Device Management
  async function updateDevicesList() {
    await getDevices(selectedBackend);
    await labelDevices(selectedBackend);
    selectedInput = -1;
    selectedOutput = -1;
    updateListEdited();
  }

  async function refreshDevices() {
    await getDevices(selectedBackend);
    await labelDevices(selectedBackend);
    updateListEdited();
  }

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
      variant = textEdited || listEdited ? "accent" : "standard";
    }
  }

  onMount(async () => {
    let currentWindow = getCurrentWebviewWindow();
    await loadAndSetConfig();
    setTimeout(async () => {
      await currentWindow.show();
    }, 0);
  });
</script>

{#if loaded}
  <div class="overflow-hidden w-full">
    <div data-tauri-drag-region class="w-full h-1"></div>
    <div class="flex flex-row w-full justify-center">
      <div class="flex flex-row w-full max-w-[1000px] min-w-[300px]">
        {#if editDevices}
          <div class="w-full flex justify-center select-none px-3">
            <div class="flex flex-col gap-3 self-center w-full rounded-lg">
              <div class="flex flex-col gap-2">
                <DeviceEdit
                  {AUDIO_BACKENDS}
                  BufferSize={BUFFER_SIZES}
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
                  on:refreshDevices={refreshDevices}
                />
              </div>
            </div>
          </div>
        {:else}
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

    <!-- Bottom Action Bar -->
    <div
      class="rounded-lg flex flex-row w-screen justify-center bottom-0 px-1.5 mb-1 fixed"
    >
      <div
        class="rounded-lg flex flex-row justify-center w-full p-2 mr-1 max-w-[985px] min-w-[200px]"
      >
        <div class="flex flex-row justify-between w-full">
          <div class="flex gap-2.5">
            <Button on:click={toggleDevices}>
              <Pen /><span class="pl-1.5">{toggleName}</span>
            </Button>
          </div>
          <div class="flex gap-2.5">
            <Tooltip text="Copy the config">
              <Button on:click={copyConfig}>
                <Copy /><span class="pl-1.5">Copy</span>
              </Button>
            </Tooltip>
            <Tooltip text="Apply the config" alignment="end" offset={5}>
              <Button
                on:click={handleApply}
                {variant}
                --fds-accent-default={$accentColor}
                --fds-accent-secondary={$accentColor}
                --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
              >
                <Checkmark class={variant === "accent" ? "fill-black" : ""} />
                <span class="pl-1.5">Apply</span>
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
