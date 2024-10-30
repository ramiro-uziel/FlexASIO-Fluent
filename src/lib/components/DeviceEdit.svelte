<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { browser } from "$app/environment";
  import { adjustBrightness } from "$lib/utils/color";
  import { accentColor, inputDevices, outputDevices } from "$lib/stores";

  import {
    Button,
    Checkbox,
    ComboBox,
    Expander,
    NumberBox,
    RadioButton,
    TextBlock,
    Tooltip,
  } from "fluent-svelte";

  import Speaker from "@fluentui/svg-icons/icons/speaker_2_20_regular.svg?component";
  import Microphone from "@fluentui/svg-icons/icons/mic_20_regular.svg?component";
  import Refresh from "@fluentui/svg-icons/icons/arrow_clockwise_20_regular.svg?component";
  import Info from "@fluentui/svg-icons/icons/info_20_filled.svg?component";

  import type { AudioBackend } from "$lib/types";

  // Input Props
  export let inputExpanded: boolean;
  export let inputSetModes: boolean;
  export let inputExclusive: boolean;
  export let inputAutoconvert: boolean;
  export let selectedInput: number;
  export let inputSetLatency: boolean;
  export let inputLatency: number;
  export let inputSetChannels: boolean;
  export let inputChannels: number;

  // Output Props
  export let outputExpanded: boolean;
  export let outputSetModes: boolean;
  export let outputExclusive: boolean;
  export let outputAutoconvert: boolean;
  export let selectedOutput: number;
  export let outputSetLatency: boolean;
  export let outputLatency: number;
  export let outputSetChannels: boolean;
  export let outputChannels: number;

  // Backend Props
  export let selectedBackend: string;
  export let selectedBuffer: number | string;
  export let AUDIO_BACKENDS;
  export let BufferSize: (
    | { name: string; value: string }
    | { name: string; value: number }
  )[];

  // State
  const dispatch = createEventDispatcher();
  let outputHeight: number;
  let inputContent: HTMLDivElement;
  let originalInputHeight: string;
  let isWidescreen = false;
  let inputSetModesEnabled: boolean;
  let outputSetModesEnabled: boolean;
  let inputChannelsEnabled = true;
  let outputChannelsEnabled = true;

  // Backend Options
  const getBackendComboBoxOptions = () =>
    Object.values(AUDIO_BACKENDS).map((b) => {
      const backend = b as AudioBackend;
      return {
        // Hack for Fluent Svelte ComboBox having mismatched value and display text
        name: backend.value,
        value: backend.value,
      };
    });

  const backendOptions = getBackendComboBoxOptions();

  // Event Handlers
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
    isWidescreen = window.innerWidth >= 685;
  }

  function updateDevices() {
    dispatch("updateDevices");
  }

  function refreshDevices() {
    dispatch("refreshDevices");
  }

  $: if (outputHeight && inputContent && isWidescreen) {
    outputHeight += 15;
    inputContent.style.height = `${outputHeight}px`;
  } else if (inputContent && !isWidescreen && originalInputHeight) {
    inputContent.style.height = originalInputHeight;
  }

  $: inputSetModesEnabled = !inputSetModes;
  $: outputSetModesEnabled = !outputSetModes;

  $: if (inputSetModesEnabled) {
    inputAutoconvert = false;
    inputExclusive = false;
  }

  $: if (outputSetModesEnabled) {
    outputAutoconvert = false;
    outputExclusive = false;
  }

  $: inputChannelsEnabled = inputChannels <= 0;
  $: if (inputChannels == 0) {
    inputSetChannels = false;
  }

  $: outputChannelsEnabled = outputChannels <= 0;
  $: if (outputChannels == 0) {
    outputSetChannels = false;
  }

  onMount(() => {
    if (inputContent) {
      originalInputHeight = inputContent.style.height || "auto";
    }

    checkScreenWidth();
    window.addEventListener("resize", checkScreenWidth);

    return () => {
      if (browser) {
        window.removeEventListener("resize", checkScreenWidth);
      }
    };
  });
</script>

<div class="flex flex-col self-center w-full">
  <TextBlock data-tauri-drag-region variant="title">Devices</TextBlock>
</div>

<div
  in:fly={{
    delay: 100,
    x: 0,
    y: 10,
    duration: 150,
    easing: cubicOut,
  }}
  class="flex flex-col mt-0 mb-0 select-none items-center overflow-scroll"
  style="height: calc(100vh - 89px);"
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
          <ComboBox
            items={backendOptions}
            editable={true}
            bind:value={selectedBackend}
            searchValue={selectedBackend}
            on:close={updateDevices}
            on:input={updateDevices}
            placeholder="Backend"
            class="w-[150px] custom-combo-box"
            --fds-accent-default={$accentColor}
            --fds-accent-secondary={$accentColor}
          ></ComboBox>
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
        <div class="space-x-1">
          <Button on:click={refreshDevices}
            ><Refresh /><span class="ml-2">Refresh</span></Button
          >
        </div>
      </div>
      <div
        class={`flex rounded-b-lg ${isWidescreen ? "flex-row gap-2" : "flex-col gap-5"}`}
      >
        <div class="flex flex-col w-full">
          <div class="mb-[1px]">
            <Expander
              bind:expanded={inputExpanded}
              --fds-control-fast-duration="0s"
              --fds-control-slow-duration="0s"
            >
              <div class="flex flex-row justify-between">
                <div class="flex flex-row gap-2">
                  <Microphone></Microphone>
                  <TextBlock variant="bodyStrong">Input</TextBlock>
                </div>
                <TextBlock
                  variant="body"
                  style="color: var(--fds-text-tertiary);"
                >
                  {($inputDevices[selectedInput + 1]?.label ?? "None").length >
                  22
                    ? ($inputDevices[selectedInput + 1]?.label ?? "None").slice(
                        0,
                        22
                      ) + "..."
                    : ($inputDevices[selectedInput + 1]?.label ?? "None")}
                </TextBlock>
              </div>

              <svelte:fragment slot="content">
                <div
                  class="flex flex-col w-full gap-2 overflow-scroll"
                  bind:this={inputContent}
                  style={isWidescreen
                    ? selectedBackend === "WASAPI"
                      ? "max-height: calc(100vh - 404px);"
                      : "max-height: calc(100vh - 350px);"
                    : ""}
                >
                  {#each $inputDevices as { label, device, value }}
                    <div class="w-full">
                      <RadioButton
                        bind:group={selectedInput}
                        {value}
                        --fds-accent-default={$accentColor}
                        --fds-accent-secondary={$accentColor}
                        --fds-accent-tertiary={adjustBrightness(
                          $accentColor,
                          -10
                        )}
                        ><div class="flex flex-col">
                          <TextBlock variant="body" class="">{label}</TextBlock>
                          <TextBlock
                            variant="caption"
                            style="color: var(--fds-text-tertiary);"
                            >{device}</TextBlock
                          >
                        </div></RadioButton
                      >
                    </div>
                  {/each}
                </div>
              </svelte:fragment>
            </Expander>
          </div>
          {#if selectedBackend === "WASAPI"}
            <div
              class="flex flex-col px-3.5 py-2.5 mb-0.5 mx-[1px] rounded-[4px] justify-between gap-2"
              style="background-color: var(--fds-card-background-default);"
            >
              <div class="flex flex-row justify-between items-center">
                <div class="flex flex-row items-center">
                  <Checkbox
                    --fds-accent-default={$accentColor}
                    --fds-accent-secondary={$accentColor}
                    --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
                    on:input={() => (inputSetModes = !inputSetModes)}
                    bind:checked={inputSetModes}
                    >Set Modes
                  </Checkbox>
                </div>
                <div class="flex flex-row gap-2">
                  <Checkbox
                    --fds-accent-default={$accentColor}
                    --fds-accent-secondary={$accentColor}
                    --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
                    bind:checked={inputExclusive}
                    bind:disabled={inputSetModesEnabled}>Exclusive</Checkbox
                  >
                  <Checkbox
                    --fds-accent-default={$accentColor}
                    --fds-accent-secondary={$accentColor}
                    --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
                    bind:checked={inputAutoconvert}
                    bind:disabled={inputSetModesEnabled}>Autoconvert</Checkbox
                  >
                </div>
              </div>
            </div>
          {/if}

          <div
            class="flex flex-col px-3.5 py-2.5 mb-0.5 mx-[1px] rounded-[4px] justify-between gap-2"
            style="background-color: var(--fds-card-background-default);"
          >
            <div class="flex flex-row justify-between items-center">
              <TextBlock variant="bodyStrong" class="w-[90px]"
                >Latency</TextBlock
              >
              <div class="flex flex-row gap-3">
                <Checkbox
                  --fds-accent-default={$accentColor}
                  --fds-accent-secondary={$accentColor}
                  --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
                  bind:checked={inputSetLatency}
                ></Checkbox>
                <NumberBox
                  placeholder="0"
                  inline={true}
                  step={0.1}
                  min={0}
                  class="min-w-[163px] max-w-[163px]"
                  --fds-accent-default={$accentColor}
                  --fds-accent-secondary={$accentColor}
                  --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
                  bind:value={inputLatency}
                ></NumberBox>
              </div>
            </div>
          </div>
          <div
            class="flex flex-col px-3.5 py-2.5 mx-[1px] rounded-[4px] justify-between gap-2"
            style="background-color: var(--fds-card-background-default);"
          >
            <div class="flex flex-row justify-between items-center">
              <TextBlock variant="bodyStrong" class="w-[90px]"
                >Channels</TextBlock
              >
              <div class="flex flex-row gap-3">
                <Checkbox
                  --fds-accent-default={$accentColor}
                  --fds-accent-secondary={$accentColor}
                  --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
                  bind:checked={inputSetChannels}
                  bind:disabled={inputChannelsEnabled}
                ></Checkbox>
                <NumberBox
                  placeholder="0"
                  inline={true}
                  step={1}
                  min={0}
                  class="min-w-[163px] max-w-[163px]"
                  --fds-accent-default={$accentColor}
                  --fds-accent-secondary={$accentColor}
                  --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
                  bind:value={inputChannels}
                ></NumberBox>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col w-full">
          <div class="mb-[1px]">
            <Expander
              bind:expanded={outputExpanded}
              --fds-control-fast-duration="0s"
              --fds-control-slow-duration="0s"
            >
              <div class="flex flex-row justify-between">
                <div class="flex flex-row gap-2">
                  <Speaker></Speaker>
                  <TextBlock variant="bodyStrong">Output</TextBlock>
                </div>
                <TextBlock
                  variant="body"
                  style="color: var(--fds-text-tertiary);"
                >
                  {($outputDevices[selectedOutput + 1]?.label ?? "None")
                    .length > 22
                    ? (
                        $outputDevices[selectedOutput + 1]?.label ?? "None"
                      ).slice(0, 22) + "..."
                    : ($outputDevices[selectedOutput + 1]?.label ?? "None")}
                </TextBlock>
              </div>

              <svelte:fragment slot="content">
                <div
                  class="flex flex-col w-full gap-2 overflow-scroll"
                  style={isWidescreen
                    ? selectedBackend === "WASAPI"
                      ? "max-height: calc(100vh - 404px);"
                      : "max-height: calc(100vh - 350px);"
                    : ""}
                  bind:clientHeight={outputHeight}
                >
                  {#each $outputDevices as { label, device, value }}
                    <div class="w-full">
                      <RadioButton
                        bind:group={selectedOutput}
                        {value}
                        --fds-accent-default={$accentColor}
                        --fds-accent-secondary={$accentColor}
                        --fds-accent-tertiary={adjustBrightness(
                          $accentColor,
                          -10
                        )}
                        ><div class="flex flex-col">
                          <TextBlock variant="body" class="">{label}</TextBlock>
                          <TextBlock
                            variant="caption"
                            style="color: var(--fds-text-tertiary);"
                            >{device}</TextBlock
                          >
                        </div></RadioButton
                      >
                    </div>
                  {/each}
                </div>
              </svelte:fragment>
            </Expander>
          </div>
          {#if selectedBackend === "WASAPI"}
            <div
              class="flex flex-col px-3.5 py-2.5 mb-0.5 mx-[1px] rounded-[4px] justify-between gap-2"
              style="background-color: var(--fds-card-background-default);"
            >
              <div class="flex flex-row justify-between items-center">
                <div class="flex flex-row items-center">
                  <Checkbox
                    --fds-accent-default={$accentColor}
                    --fds-accent-secondary={$accentColor}
                    --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
                    on:input={() => (outputSetModes = !outputSetModes)}
                    bind:checked={outputSetModes}
                    >Set Modes
                  </Checkbox>
                </div>
                <div class="flex flex-row gap-2">
                  <Checkbox
                    --fds-accent-default={$accentColor}
                    --fds-accent-secondary={$accentColor}
                    --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
                    bind:checked={outputExclusive}
                    bind:disabled={outputSetModesEnabled}>Exclusive</Checkbox
                  >
                  <Checkbox
                    --fds-accent-default={$accentColor}
                    --fds-accent-secondary={$accentColor}
                    --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
                    bind:checked={outputAutoconvert}
                    bind:disabled={outputSetModesEnabled}>Autoconvert</Checkbox
                  >
                </div>
              </div>
            </div>
          {/if}
          <div
            class="flex flex-col px-3.5 py-2.5 mb-0.5 mx-[1px] rounded-[4px] justify-between gap-2"
            style="background-color: var(--fds-card-background-default);"
          >
            <div class="flex flex-row justify-between items-center">
              <TextBlock variant="bodyStrong" class="w-[90px]"
                >Latency</TextBlock
              >
              <div class="flex flex-row gap-3">
                <Checkbox
                  --fds-accent-default={$accentColor}
                  --fds-accent-secondary={$accentColor}
                  --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
                  bind:checked={outputSetLatency}
                ></Checkbox>
                <NumberBox
                  placeholder="0"
                  inline={true}
                  step={0.1}
                  min={0}
                  class="min-w-[163px] max-w-[163px]"
                  --fds-accent-default={$accentColor}
                  --fds-accent-secondary={$accentColor}
                  --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
                  bind:value={outputLatency}
                ></NumberBox>
              </div>
            </div>
          </div>
          <div
            class="flex flex-col px-3.5 py-2.5 mx-[1px] rounded-[4px] justify-between gap-2"
            style="background-color: var(--fds-card-background-default);"
          >
            <div class="flex flex-row justify-between items-center">
              <TextBlock variant="bodyStrong" class="w-[90px]"
                >Channels</TextBlock
              >
              <div class="flex flex-row gap-3">
                <Checkbox
                  --fds-accent-default={$accentColor}
                  --fds-accent-secondary={$accentColor}
                  --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
                  bind:checked={outputSetChannels}
                  bind:disabled={outputChannelsEnabled}
                ></Checkbox>
                <NumberBox
                  placeholder="0"
                  inline={true}
                  step={1}
                  min={0}
                  class="min-w-[163px] max-w-[163px]"
                  --fds-accent-default={$accentColor}
                  --fds-accent-secondary={$accentColor}
                  --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
                  bind:value={outputChannels}
                ></NumberBox>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
