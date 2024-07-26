<script lang="ts">
  import {
    Button,
    Checkbox,
    ComboBox,
    Expander,
    NumberBox,
    RadioButton,
    TextBlock,
    TextBox,
    Tooltip,
  } from "fluent-svelte";
  import Save from "@fluentui/svg-icons/icons/save_20_regular.svg";
  import Folder from "@fluentui/svg-icons/icons/folder_20_regular.svg";
  import Checkmark from "@fluentui/svg-icons/icons/checkmark_20_regular.svg";
  import Copy from "@fluentui/svg-icons/icons/copy_20_regular.svg";
  import Refresh from "@fluentui/svg-icons/icons/arrow_clockwise_20_regular.svg";
  import Pen from "@fluentui/svg-icons/icons/edit_20_regular.svg";
  import Flask from "$lib/icons/flask-solid.svg";
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { invoke } from "@tauri-apps/api/core";
  import { ready } from "$lib/stores";
  import { accentColor } from "$lib/stores";
  import { dev } from "$app/environment";
  import { adjustBrightness } from "$lib/utils/utils";

  import WindowTitlebar from "$lib/WindowTitlebar.svelte";
  import { cubicOut, elasticIn, elasticInOut } from "svelte/easing";
  import TextArea from "$lib/components/TextArea.svelte";
  import OutputEdit from "$lib/components/OutputEdit.svelte";
  import DeviceEdit from "$lib/components/DeviceEdit.svelte";

  interface DeviceItem {
    name: string;
    device: string;
    value: number;
  }

  let InputDevices = [] as DeviceItem[];
  let OutputDevices = [] as DeviceItem[];

  let outputlist = true;

  let inputExpanded = true;
  let outputExpanded = true;

  let selectedBackend: string | null = "WASAPI";
  let selectedInput: number = -1;
  let selectedOutput: number = -1;

  let outputText = "";
  let toggleName = "";

  let Backend = [
    { name: "MME", value: 0 },
    { name: "DirectSound", value: 1 },
    { name: "WASAPI", value: 2 },
    { name: "WDM-KS", value: 3 },
  ];

  let BufferSize = [
    { name: "Default", value: -1 },
    ...Array.from({ length: 8 }, (_, i) =>
      i === 0 ? 0 : 2 ** (i - 1) * 16
    ).map((i) => ({
      name: `${i}`,
      value: i,
    })),
  ];

  function toggleDevices() {
    outputlist = !outputlist;
    toggleName = outputlist ? "Edit Output" : "Edit Devices";
  }

  async function getAccentColor() {
    try {
      const color = adjustBrightness(
        await invoke<string>("get_accent_color"),
        70
      );
      accentColor.update(() => color);
      console.log("Accent color:", $accentColor);
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

  onMount(async () => {
    checkMica();
    getAccentColor();
    toggleName = outputlist ? "Edit Output" : "Edit Devices";
    console.log("Hi :)");
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
          <Flask class="size-2"></Flask>
        </div>
      {/if}
    </WindowTitlebar>
    <div class="flex flex-row w-full justify-center">
      <div class="flex flex-row w-full max-w-[1000px] min-w-[300px]">
        {#if outputlist}
          <div class="w-full flex justify-center select-none px-3">
            <div class="flex flex-col gap-3 self-center w-full rounded-lg">
              <div class="flex flex-col gap-2">
                <DeviceEdit
                  {InputDevices}
                  {OutputDevices}
                  {selectedBackend}
                  {selectedInput}
                  {selectedOutput}
                  {Backend}
                  {BufferSize}
                  {inputExpanded}
                  {outputExpanded}
                ></DeviceEdit>
              </div>
            </div>
          </div>
        {/if}
        {#if !outputlist}
          <div class="w-full flex justify-center select-none px-3">
            <div class="flex flex-col gap-3 self-center w-full rounded-lg">
              <div class="flex flex-col gap-2">
                <OutputEdit
                  --fds-accent-default={$accentColor}
                  --fds-accent-secondary={$accentColor}
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
