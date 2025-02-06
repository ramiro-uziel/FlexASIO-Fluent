<!--+page.svelte-->
<script lang="ts">
  import { onMount, tick } from "svelte";
  import { get } from "svelte/store";
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
  import { Button, Tooltip } from "fluent-svelte";

  import Checkmark from "@fluentui/svg-icons/icons/checkmark_20_regular.svg?component";
  import Copy from "@fluentui/svg-icons/icons/copy_20_regular.svg?component";
  import Pen from "@fluentui/svg-icons/icons/edit_20_regular.svg?component";
  import Info from "@fluentui/svg-icons/icons/info_20_regular.svg?component";
  import Save from "@fluentui/svg-icons/icons/save_20_regular.svg?component";
  import Folder from "@fluentui/svg-icons/icons/folder_20_regular.svg?component";

  import OutputEdit from "$lib/components/OutputEdit.svelte";
  import DeviceEdit from "$lib/components/DeviceEdit.svelte";
  import InfoModal from "$lib/components/InfoModal.svelte";

  import {
    loadConfig,
    saveConfig,
    copyConfig,
    compareConfigs,
    saveConfigToFile,
    loadConfigFromFile,
  } from "$lib/config";
  import {
    inputDevices,
    outputDevices,
    accentColor,
    isWidescreen,
  } from "$lib/stores";
  import { getDevices, labelDevices } from "$lib/devices";
  import { adjustBrightness } from "$lib/color";

  import {
    inputExpanded,
    outputExpanded,
    editDevices,
    loadUIState,
  } from "$lib/app";

  import { checkVersion, updateDismissed, updateAvailable } from "$lib/app";

  import type { AudioBackend, Config } from "$lib/types";
  import { invoke } from "@tauri-apps/api/core";
  import WindowsControls from "$lib/components/WindowsControls.svelte";

  const AUDIO_BACKENDS: { [key: string]: AudioBackend } = {
    MME: { value: "MME", displayName: "MME" },
    DirectSound: { value: "DirectSound", displayName: "Windows DirectSound" },
    WASAPI: { value: "WASAPI", displayName: "Windows WASAPI" },
    "WDM-KS": { value: "WDM-KS", displayName: "Windows WDM-KS" },
  } as const;

  const BUFFER_SIZES = [
    { name: "Default", value: "Default" },
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
  let invalidConfig = false;
  let loaded = false;
  let initialLoadComplete = false;
  let textEdited = false;
  let listEdited = false;
  let devicesLoading = false;
  let applyButtonVariant: "accent" | "standard" | "hyperlink" | undefined =
    "standard";
  let infoButtonVariant: "accent" | "standard" | "hyperlink" | undefined =
    "standard";

  // Config State
  let originalConfig: Config | null = null;
  let currentConfig: Partial<Config> = {};

  // UI State
  let showModal = false;

  // Device Settings State
  let selectedBackend: string;
  let selectedBuffer: string | number;

  // Input Settings
  let selectedInput = -1;
  let inputSetModes = false;
  let inputExclusive = false;
  let inputAutoconvert = false;
  let inputSetLatency = false;
  let inputLatency = 0;
  let inputSetChannels = false;
  let inputChannels = 0;

  // Output Settings
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
  async function toggleModal() {
    showModal = !showModal;
  }

  async function toggleDevices() {
    $editDevices = !$editDevices;
    await loadAndSetConfig();
  }

  async function handleApply() {
    if (!$editDevices) {
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
    if (!originalConfig) {
      listEdited = false;
      return;
    }

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
    try {
      const config = await loadConfig();
      originalConfig = JSON.parse(JSON.stringify(config));

      selectedBackend = getInternalBackendValue(config.backend);
      selectedBuffer =
        config.bufferSizeSamples === null
          ? "Default"
          : config.bufferSizeSamples.toString();

      labelDevices(selectedBackend).then(() => {
        const inputDevicesValue = get(inputDevices);
        const outputDevicesValue = get(outputDevices);

        selectedInput =
          inputDevicesValue.findIndex((d) => d.name === config.input.device) -
          1;
        selectedOutput =
          outputDevicesValue.findIndex((d) => d.name === config.output.device) -
          1;

        if (selectedInput === -2) selectedInput = -1;
        if (selectedOutput === -2) selectedOutput = -1;
      });

      // Rest of the configuration
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
      invalidConfig = false;
      loaded = true;
    } catch (error) {
      console.error("Error loading config:", error);
      invalidConfig = true;
      loaded = true;
    }
  }

  // Device Management
  async function updateDevicesList() {
    devicesLoading = true;
    try {
      await getDevices(selectedBackend);
      await labelDevices(selectedBackend);
      selectedInput = -1;
      selectedOutput = -1;
      updateListEdited();
    } finally {
      devicesLoading = false;
    }
  }

  async function refreshDevices() {
    devicesLoading = true;
    try {
      await getDevices(selectedBackend);
      await labelDevices(selectedBackend);
      updateListEdited();
    } finally {
      devicesLoading = false;
    }
  }

  // File handlers
  async function showError(message: string) {
    await invoke("plugin:dialog|message", {
      title: "Error",
      message,
      kind: "error",
    });
  }

  async function handleSaveToFile() {
    try {
      if ($editDevices && currentConfig) {
        await saveConfigToFile(currentConfig);
      } else if (!$editDevices) {
        await saveConfigToFile(await loadConfig());
      }
    } catch (error) {
      await showError(`Error saving config to file: ${error}`);
      console.error("Error saving config to file:", error);
    }
  }

  async function handleLoadFromFile() {
    try {
      const loadedConfig = await loadConfigFromFile();
      if (loadedConfig) {
        await saveConfig(loadedConfig);

        loaded = false;
        await tick();

        loaded = true;
        await loadAndSetConfig();
      }
    } catch (error) {
      await showError(`Error loading config from file: ${error}`);
      console.error("Error loading config from file:", error);
    }
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
      applyButtonVariant = textEdited || listEdited ? "accent" : "standard";
      infoButtonVariant =
        $updateAvailable && !$updateDismissed ? "accent" : "standard";
    }
  }

  onMount(async () => {
    await loadUIState();
    await loadAndSetConfig();
    await checkVersion();
    let currentWindow = getCurrentWebviewWindow();
    setTimeout(() => {
      currentWindow.show();
    }, 0);
  });
</script>

{#if loaded}
  <div class="overflow-hidden w-full">
    <div class="flex h-[35px] w-full overflow-hidden select-none">
      <div class="flex flex-1 items-center gap-2 px-3 pointer-events-none">
        <img src="favicon.png" alt="FlexASIO Fluent Icon" class="size-[15px]" />
        <span class="text-[12px]">FlexASIO Fluent</span>
      </div>

      <WindowsControls class="flex z-[80]" />
    </div>
    <div
      data-tauri-drag-region
      class="absolute inset-0 z-[60] pointer-events-auto w-full h-[35px]"
    ></div>

    {#if showModal}
      <InfoModal bind:showModal></InfoModal>
    {/if}
    <div data-tauri-drag-region class="w-full"></div>
    <div class="flex flex-row w-full justify-center">
      <div class="flex flex-row w-full max-w-[1000px] min-w-[300px]">
        {#if $editDevices}
          <div class="w-full flex justify-center select-none px-3">
            <div class="flex flex-col gap-3 self-center w-full rounded-lg">
              <div class="flex flex-col gap-2">
                <DeviceEdit
                  {AUDIO_BACKENDS}
                  BufferSize={BUFFER_SIZES}
                  bind:inputExpanded={$inputExpanded}
                  bind:outputExpanded={$outputExpanded}
                  bind:selectedBackend
                  bind:selectedBuffer
                  bind:selectedInput
                  bind:inputSetModes
                  bind:inputExclusive
                  bind:inputAutoconvert
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
        class="rounded-lg flex flex-row justify-center w-full p-2 mr-[4px] -ml-[1px] max-w-[985px]"
      >
        <div class="flex flex-row justify-between w-full">
          <div class="flex gap-2.5">
            <Button on:click={toggleDevices} class="w-[130px]">
              <Pen /><span class="pl-1.5"
                >{$editDevices ? "Edit Output" : "Edit Devices"}</span
              >
            </Button>
            <Tooltip delay={300} placement="top" offset={10} text="App Info">
              <Button
                on:click={toggleModal}
                variant={infoButtonVariant}
                --fds-accent-default={$accentColor}
                --fds-accent-secondary={$accentColor}
                --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
              >
                <Info
                  class={infoButtonVariant === "accent"
                    ? "fill-white dark:fill-black"
                    : ""}
                />
                {#if $updateAvailable && !$updateDismissed}
                  <span class="pl-1.5 wd:block hidden">Update</span>
                {/if}
              </Button>
            </Tooltip>
          </div>

          <div class="flex gap-2.5">
            <Tooltip
              delay={300}
              placement="top"
              offset={10}
              text="Save to file"
            >
              <Button on:click={handleSaveToFile}>
                <Save />
              </Button>
            </Tooltip>

            <Tooltip
              delay={300}
              placement="top"
              offset={10}
              text="Load from file"
            >
              <Button on:click={handleLoadFromFile}>
                <Folder />
              </Button>
            </Tooltip>

            <Tooltip delay={300} placement="top" offset={10} text="Copy config">
              <Button on:click={copyConfig}>
                <Copy />
              </Button>
            </Tooltip>
            <Tooltip
              delay={$isWidescreen ? 1000 : 300}
              placement="top"
              offset={10}
              text="Apply config"
            >
              <Button
                on:click={handleApply}
                variant={applyButtonVariant}
                --fds-accent-default={$accentColor}
                --fds-accent-secondary={$accentColor}
                --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
                class="wd:w-full w-[63px]"
              >
                <Checkmark
                  class={applyButtonVariant === "accent"
                    ? "fill-white dark:fill-black"
                    : ""}
                />
                <span class="pl-1.5 wd:block hidden">Apply</span>
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
