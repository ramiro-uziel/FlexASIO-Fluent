<script lang="ts">
  import { adjustBrightness } from "$lib/color";
  import { accentColor } from "$lib/stores";

  import {
    Checkbox,
    Expander,
    NumberBox,
    RadioButton,
    TextBlock,
  } from "fluent-svelte";

  import { onMount } from "svelte";

  // Props
  export let expanded: boolean;
  export let setModes: boolean;
  export let exclusive: boolean;
  export let autoconvert: boolean;
  export let selectedDevice: number;
  export let setLatency: boolean;
  export let latency: number;
  export let setChannels: boolean;
  export let channels: number;
  export let devices: Array<{
    label: string;
    device: string;
    value: number;
  }>;
  export let selectedBackend: string;
  export let contentRef: HTMLDivElement;
  export let icon: any;
  export let columnLabel: string;
  export let isWidescreen = false;
  export let SetModesEnabled: boolean;
  export let channelsEnabled = true;

  // Content Height State
  $: SetModesEnabled = !setModes;

  $: if (SetModesEnabled) {
    autoconvert = false;
    exclusive = false;
  }

  $: channelsEnabled = channels <= 0;
  $: if (channels == 0) {
    setChannels = false;
  }

  let resizeObserver: ResizeObserver;

  function synchronizeHeights() {
    if (!contentRef) return;

    const contentHeight = contentRef.scrollHeight;
    contentRef.style.height = `${contentHeight}px`;
  }

  onMount(() => {
    if (contentRef) {
      resizeObserver = new ResizeObserver(() => {
        if (isWidescreen) {
          synchronizeHeights();
        }
      });

      resizeObserver.observe(contentRef);

      return () => {
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
    }
  });
</script>

<div class="flex flex-col w-full">
  <div class="mb-[1px]">
    <Expander
      bind:expanded
      --fds-control-fast-duration="0s"
      --fds-control-slow-duration="0s"
    >
      <div class="flex flex-row justify-between">
        <div class="flex flex-row gap-2">
          <svelte:component this={icon}></svelte:component>
          <TextBlock variant="bodyStrong">{columnLabel}</TextBlock>
        </div>
        <TextBlock variant="body" style="color: var(--fds-text-tertiary);">
          {(devices[selectedDevice + 1]?.label ?? "None").length > 22
            ? (devices[selectedDevice + 1]?.label ?? "None").slice(0, 22) +
              "..."
            : (devices[selectedDevice + 1]?.label ?? "None")}
        </TextBlock>
      </div>

      <svelte:fragment slot="content">
        <div
          class="flex flex-col w-full gap-2 overflow-scroll"
          bind:this={contentRef}
          style={isWidescreen
            ? selectedBackend === "WASAPI"
              ? "max-height: calc(100vh - 404px);"
              : "max-height: calc(100vh - 350px);"
            : ""}
        >
          {#each devices as { label, device, value }}
            <div class="w-full">
              <RadioButton
                bind:group={selectedDevice}
                {value}
                --fds-accent-default={$accentColor}
                --fds-accent-secondary={$accentColor}
                --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
                ><div class="flex flex-col">
                  <TextBlock variant="body" class="">{label}</TextBlock>
                  <TextBlock
                    variant="caption"
                    style="color: var(--fds-text-tertiary);">{device}</TextBlock
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
            on:input={() => (setModes = !setModes)}
            bind:checked={setModes}
            >Set Modes
          </Checkbox>
        </div>
        <div class="flex flex-row gap-2">
          <Checkbox
            --fds-accent-default={$accentColor}
            --fds-accent-secondary={$accentColor}
            --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
            bind:checked={exclusive}
            bind:disabled={SetModesEnabled}
            >Exclusive
          </Checkbox>
          <Checkbox
            --fds-accent-default={$accentColor}
            --fds-accent-secondary={$accentColor}
            --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
            bind:checked={autoconvert}
            bind:disabled={SetModesEnabled}
            >Autoconvert
          </Checkbox>
        </div>
      </div>
    </div>
  {/if}

  <div
    class="flex flex-col px-3.5 py-2.5 mb-0.5 mx-[1px] rounded-[4px] justify-between gap-2"
    style="background-color: var(--fds-card-background-default);"
  >
    <div class="flex flex-row justify-between items-center">
      <TextBlock variant="bodyStrong" class="w-[90px]">Latency</TextBlock>
      <div class="flex flex-row gap-3">
        <Checkbox
          --fds-accent-default={$accentColor}
          --fds-accent-secondary={$accentColor}
          --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
          bind:checked={setLatency}
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
          bind:value={latency}
        ></NumberBox>
      </div>
    </div>
  </div>
  <div
    class="flex flex-col px-3.5 py-2.5 mx-[1px] rounded-[4px] justify-between gap-2"
    style="background-color: var(--fds-card-background-default);"
  >
    <div class="flex flex-row justify-between items-center">
      <TextBlock variant="bodyStrong" class="w</div>-[90px]">Channels</TextBlock
      >
      <div class="flex flex-row gap-3">
        <Checkbox
          --fds-accent-default={$accentColor}
          --fds-accent-secondary={$accentColor}
          --fds-accent-tertiary={adjustBrightness($accentColor, -10)}
          bind:checked={setChannels}
          bind:disabled={channelsEnabled}
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
          bind:value={channels}
        ></NumberBox>
      </div>
    </div>
  </div>
</div>
