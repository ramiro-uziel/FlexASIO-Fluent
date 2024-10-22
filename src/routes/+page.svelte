<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
  import { Button, Tooltip } from "fluent-svelte";
  import OutputEdit from "$lib/components/OutputEdit.svelte";
  import DeviceEdit from "$lib/components/DeviceEdit.svelte";
  import { inputDevices, outputDevices, ready, accentColor } from "$lib/stores";
  import { adjustBrightness } from "$lib/utils/system";
  import { AudioManager } from "$lib/AudioManager";
  import type { Config } from "$lib/types";
  import Checkmark from "@fluentui/svg-icons/icons/checkmark_20_regular.svg?component";
  import Copy from "@fluentui/svg-icons/icons/copy_20_regular.svg?component";
  import Pen from "@fluentui/svg-icons/icons/edit_20_regular.svg?component";

  // import Flask from "$lib/icons/flask-solid.svg?component";
  // import { dev } from "$app/environment";
  // import WindowTitlebar from "$lib/WindowTitlebar.svelte";

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

  let outputEdit: OutputEdit;

  let textEdited: boolean = false;
  let listEdited: boolean = false;

  let originalConfig: Config | null = null;
  let currentConfig: Partial<Config> = {};

  let variant: "accent" | "standard" | "hyperlink" | undefined = "standard";

  let loaded = false;

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

  const BufferSize = [
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

  async function toggleDevices() {
    editDevices = !editDevices;
    toggleName = editDevices ? "Edit Output" : "Edit Devices";
    await loadAndSetConfig();
  }
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
      backend: selectedBackend ? backendOkay[selectedBackend] : undefined,
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

    listEdited = !AudioManager.compareConfigs(currentConfig, originalConfig);
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
      if (textEdited || listEdited) {
        console.log("Text or list edited", textEdited, listEdited);
        variant = "accent";
      } else {
        variant = "standard";
      }
    }
  }

  async function loadAndSetConfig() {
    const config = await AudioManager.loadConfig();
    originalConfig = JSON.parse(JSON.stringify(config));

    selectedBackend = backendMapping[config.backend];
    selectedBuffer =
      config.bufferSizeSamples === null
        ? "Default"
        : config.bufferSizeSamples.toString();

    await AudioManager.getDevices(selectedBackend);
    await AudioManager.labelDevices(selectedBackend);

    const inputDevicesValue = get(inputDevices);
    const outputDevicesValue = get(outputDevices);

    selectedInput =
      inputDevicesValue.findIndex((d) => d.name === config.input.device) - 1;
    selectedOutput =
      outputDevicesValue.findIndex((d) => d.name === config.output.device) - 1;

    if (selectedInput === -2) selectedInput = -1;
    if (selectedOutput === -2) selectedOutput = -1;

    inputSetLatency = config.input.suggestedLatencySeconds !== null;
    inputLatency = config.input.suggestedLatencySeconds || 0;
    outputSetLatency = config.output.suggestedLatencySeconds !== null;
    outputLatency = config.output.suggestedLatencySeconds || 0;

    inputSetChannels = config.input.channels !== null;
    inputChannels = config.input.channels || 0;
    outputSetChannels = config.output.channels !== null;
    outputChannels = config.output.channels || 0;

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

  async function updateDevicesList() {
    await AudioManager.getDevices(selectedBackend);
    await AudioManager.labelDevices(selectedBackend);
    selectedInput = -1;
    selectedOutput = -1;
    updateListEdited();
  }

  async function refreshDevices() {
    await AudioManager.getDevices(selectedBackend);
    await AudioManager.labelDevices(selectedBackend);
    updateListEdited();
  }

  async function handleApply() {
    if (!editDevices) {
      outputEdit.saveTomlFile();
    } else {
      await AudioManager.saveConfig(currentConfig);
    }
    listEdited = false;
    textEdited = false;
    await loadAndSetConfig();
  }

  onMount(async () => {
    let currentWindow = getCurrentWebviewWindow();
    await loadAndSetConfig();
    setTimeout(async () => {
      await currentWindow.show();
      document.body.style.backgroundColor = "transparent";
    }, 0);
  });
</script>

{#if loaded}
  <div class="overflow-hidden w-full pt-1">
    <!-- <WindowTitlebar class="h-10 overflow-hidden">
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
          <Flask class="size-2.5" />
        </div>
      {/if}
    </WindowTitlebar> -->
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
              <Button on:click={AudioManager.copyConfig}>
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
