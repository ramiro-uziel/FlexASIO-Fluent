<script lang="ts">
  import DevicesColumn from "./DevicesColumn.svelte";

  import { onMount, createEventDispatcher } from "svelte";
  import { fly } from "svelte/transition";
  import { expoOut } from "svelte/easing";
  import { browser } from "$app/environment";
  import { accentColor, inputDevices, outputDevices } from "$lib/stores";

  import { Button, ComboBox, TextBlock, Tooltip } from "fluent-svelte";

  import CustomComboBox from "./fluent-svelte-custom/CustomComboBox.svelte";

  import Speaker from "@fluentui/svg-icons/icons/speaker_2_20_regular.svg?component";
  import Microphone from "@fluentui/svg-icons/icons/mic_20_regular.svg?component";
  import Refresh from "@fluentui/svg-icons/icons/arrow_clockwise_20_regular.svg?component";
  import Info from "@fluentui/svg-icons/icons/info_20_filled.svg?component";

  import type { AudioBackend } from "$lib/types";

  export let inputExpanded: boolean;
  export let inputSetModes: boolean;
  export let inputExclusive: boolean;
  export let inputAutoconvert: boolean;
  export let selectedInput: number;
  export let inputSetLatency: boolean;
  export let inputLatency: number;
  export let inputSetChannels: boolean;
  export let inputChannels: number;

  export let outputExpanded: boolean;
  export let outputSetModes: boolean;
  export let outputExclusive: boolean;
  export let outputAutoconvert: boolean;
  export let selectedOutput: number;
  export let outputSetLatency: boolean;
  export let outputLatency: number;
  export let outputSetChannels: boolean;
  export let outputChannels: number;

  export let selectedBackend: string;
  let previousBackend = selectedBackend;
  export let selectedBuffer: number | string;
  export let AUDIO_BACKENDS;
  export let BufferSize: (
    | { name: string; value: string }
    | { name: string; value: number }
  )[];

  const dispatch = createEventDispatcher();
  let isWidescreen = false;
  let inputSetModesEnabled: boolean;
  let outputSetModesEnabled: boolean;
  let isRefreshIndicatorAnimating = false;
  let refreshTimeout: ReturnType<typeof setTimeout> | null = null;

  let resizeObserver: ResizeObserver;

  const getBackendComboBoxOptions = () =>
    Object.values(AUDIO_BACKENDS).map((b) => {
      const backend = b as AudioBackend;
      return {
        name: backend.value,
        value: backend.value,
      };
    });

  const backendOptions = getBackendComboBoxOptions();

  function handleBufferInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const inputValue = target.value;

    if (inputValue === "Default") {
      selectedBuffer = "Default";
    } else {
      const numValue = parseInt(inputValue, 10);
      selectedBuffer = !isNaN(numValue) ? numValue.toString() : inputValue;
    }
  }

  function checkScreenWidth() {
    isWidescreen = window.innerWidth >= 645; // 685;
  }

  function updateDevices(event?: Event) {
    if (event && selectedBackend === previousBackend) {
      return;
    }
    previousBackend = selectedBackend;
    dispatch("updateDevices");
  }

  function refreshAnimation() {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }

    isRefreshIndicatorAnimating = true;

    refreshTimeout = setTimeout(() => {
      isRefreshIndicatorAnimating = false;
      refreshTimeout = null;
    }, 1000);
  }

  function refreshDevices() {
    dispatch("refreshDevices");
    refreshAnimation();
  }

  onMount(() => {
    resizeObserver = new ResizeObserver(checkScreenWidth);
    checkScreenWidth();
    window.addEventListener("resize", checkScreenWidth);

    return () => {
      if (browser) {
        window.removeEventListener("resize", checkScreenWidth);
        resizeObserver.disconnect();
      }
    };
  });
</script>

<div
  class="flex flex-row items-center justify-between w-full"
  data-tauri-drag-region
>
  <TextBlock variant="title" data-tauri-drag-region>Devices</TextBlock>
</div>

<div
  in:fly={{
    x: 0,
    y: 20,
    duration: 400,
    opacity: 0.2,
    easing: expoOut,
  }}
  class="flex flex-col mt-0 mb-0 select-none items-center overflow-scroll"
  style="height: calc(100vh - 130px);"
>
  <div
    class="flex flex-col gap-3 self-center w-full max-w-[1000px] min-w-[300px] rounded-lg"
  >
    <div class="flex flex-col gap-2">
      <div
        class="rounded p-2 flex flex-row justify-between"
        style="background-color: var(--fds-card-background-default);"
      >
        <div class="flex gap-2.5 items-center">
          <CustomComboBox
            items={backendOptions}
            editable={false}
            bind:value={selectedBackend}
            on:close={updateDevices}
            on:input={updateDevices}
            placeholder="Select a Backend"
            class="w-[150px] custom-combo-box"
            --fds-accent-default={$accentColor}
            --fds-accent-secondary={$accentColor}
          ></CustomComboBox>
          <ComboBox
            items={BufferSize}
            bind:value={selectedBuffer}
            editable={true}
            placeholder="Buffer"
            class="max-w-[96px]"
            --fds-accent-default={$accentColor}
            --fds-accent-secondary={$accentColor}
            on:input={handleBufferInput}
          ></ComboBox>
          {#if selectedBackend === "MME"}
            <Tooltip
              text="PortAudio bug: MME names may be incomplete."
              placement="bottom"
              delay={0}
            >
              <Info class="opacity-80"></Info>
            </Tooltip>
          {/if}
        </div>
        <div class="flex flex-row items-center gap-5">
          <div
            class="rounded-full w-2 h-2 transition-all duration-150 ease-out"
            style="opacity: {isRefreshIndicatorAnimating
              ? '1'
              : '0'}; background-color: {$accentColor}"
          />
          <div class="space-x-1">
            <Button on:click={refreshDevices}
              ><Refresh /><span class="ml-2">Refresh</span></Button
            >
          </div>
        </div>
      </div>
      <div
        class={`flex rounded-b-lg ${isWidescreen ? "flex-row gap-2" : "flex-col gap-5"}`}
      >
        <DevicesColumn
          columnLabel="Input"
          icon={Microphone}
          bind:expanded={inputExpanded}
          bind:setModes={inputSetModes}
          bind:exclusive={inputExclusive}
          bind:autoconvert={inputAutoconvert}
          bind:selectedDevice={selectedInput}
          bind:setLatency={inputSetLatency}
          bind:latency={inputLatency}
          bind:setChannels={inputSetChannels}
          bind:channels={inputChannels}
          bind:devices={$inputDevices}
          bind:SetModesEnabled={inputSetModesEnabled}
          bind:selectedBackend
          bind:isWidescreen
        ></DevicesColumn>
        <DevicesColumn
          columnLabel="Output"
          icon={Speaker}
          bind:expanded={outputExpanded}
          bind:setModes={outputSetModes}
          bind:exclusive={outputExclusive}
          bind:autoconvert={outputAutoconvert}
          bind:selectedDevice={selectedOutput}
          bind:setLatency={outputSetLatency}
          bind:latency={outputLatency}
          bind:setChannels={outputSetChannels}
          bind:channels={outputChannels}
          bind:devices={$outputDevices}
          bind:SetModesEnabled={outputSetModesEnabled}
          bind:selectedBackend
          bind:isWidescreen
        ></DevicesColumn>
      </div>
    </div>
  </div>
</div>
