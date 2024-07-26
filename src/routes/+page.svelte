<script lang="ts">
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
  import Save from "@fluentui/svg-icons/icons/save_20_regular.svg";
  import Folder from "@fluentui/svg-icons/icons/folder_20_regular.svg";
  import Checkmark from "@fluentui/svg-icons/icons/checkmark_20_regular.svg";
  import Copy from "@fluentui/svg-icons/icons/copy_20_regular.svg";
  import Refresh from "@fluentui/svg-icons/icons/arrow_clockwise_20_regular.svg";
  import Pen from "@fluentui/svg-icons/icons/edit_20_regular.svg";
  import Flask from "$lib/icons/flask-solid.svg";
  import { onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { ready } from "$lib/stores";
  import { accentColor } from "$lib/stores";
  import { dev } from "$app/environment";

  import WindowTitlebar from "$lib/WindowTitlebar.svelte";

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

  async function updateDevices() {
    if (selectedBackend === null) {
      InputDevices = [{ name: "None", device: "", value: -1 }];
      OutputDevices = [{ name: "None", device: "", value: -1 }];
      return;
    }

    try {
      selectedInput = selectedOutput = -1;
      const [inputDevices, outputDevices] = await invoke<[string[], string[]]>(
        "list_audio_devices",
        { backend: selectedBackend }
      );

      const extractNameAndDevice = (device: string) => {
        if (device.includes("bthhfenum.sys")) {
          const match = device.match(/;\((.*?)\)/);
          if (match) {
            return { name: match[1].trim(), device: "Bluetooth" };
          }
        } else {
          const match = device.match(/^(.*?)\s*\((.*?)\)$/);
          if (match) {
            return { name: match[1].trim(), device: match[2].trim() };
          }
        }
        return { name: device, device: "" };
      };

      InputDevices = [
        { name: "None", device: "", value: -1 },
        ...inputDevices.map((device, index) => {
          const { name, device: deviceName } = extractNameAndDevice(device);
          return { name, device: deviceName, value: index };
        }),
      ];

      OutputDevices = [
        { name: "None", device: "", value: -1 },
        ...outputDevices.map((device, index) => {
          const { name, device: deviceName } = extractNameAndDevice(device);
          return { name, device: deviceName, value: index };
        }),
      ];

      console.log("Input Devices:", InputDevices);
      console.log("Output Devices:", OutputDevices);
    } catch (error) {
      console.error("Error changing backend and listing devices:", error);
    }
  }

  function adjustBrightness(color: string, percent: number) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = parseInt(((R * (100 + percent)) / 100).toString());
    G = parseInt(((G * (100 + percent)) / 100).toString());
    B = parseInt(((B * (100 + percent)) / 100).toString());

    R = R < 255 ? R : 255;
    G = G < 255 ? G : 255;
    B = B < 255 ? B : 255;

    let RR =
      R.toString(16).length === 1 ? "0" + R.toString(16) : R.toString(16);
    let GG =
      G.toString(16).length === 1 ? "0" + G.toString(16) : G.toString(16);
    let BB =
      B.toString(16).length === 1 ? "0" + B.toString(16) : B.toString(16);

    return "#" + RR + GG + BB;
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
    updateDevices();
    console.log("Hi :)");
  });
</script>

{#if $ready}
  <WindowTitlebar class="h-10">
    <div class="pointer-events-none w-full">
      <div class="flex flex-row items-center align-middle p-2 gap-2 ml-1">
        <img src="favicon.png" alt="FlexASIO Fluent Icon" class="size-[15px]" />
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
  <div class="w-full flex justify-center select-none">
    <div
      class="flex flex-col self-center w-full max-w-[1000px] min-w-[300px] mx-3 mb-2"
    >
      <TextBlock variant="title">Devices</TextBlock>
    </div>
  </div>
  <div class="w-full" style="">
    {#if outputlist}
      <div
        class="flex flex-col m-3 mt-0 mb-0 select-none items-center overflow-scroll"
        style="height: calc(100vh - 120px);"
      >
        <div
          class="flex flex-col gap-3 self-center w-full max-w-[1000px] min-w-[300px] rounded-lg"
        >
          <div class="flex flex-col gap-2">
            <div
              class="rounded p-2 flex flex-row justify-between"
              style="background-color: var(--fds-card-background-default);"
            >
              <div class="flex gap-2.5">
                <ComboBox
                  items={Backend}
                  editable={true}
                  bind:searchValue={selectedBackend}
                  on:close={updateDevices}
                  on:input={updateDevices}
                  placeholder="Backend"
                  class="w-[150px] custom-combo-box"
                  --fds-accent-default={$accentColor}
                  --fds-accent-secondary={$accentColor}
                ></ComboBox>
                <ComboBox
                  items={BufferSize}
                  editable={true}
                  placeholder="Buffer"
                  class="max-w-[100px]"
                  --fds-accent-default={$accentColor}
                  --fds-accent-secondary={$accentColor}
                ></ComboBox>
              </div>
              <div>
                <Button><Refresh /><span class="ml-2">Refresh</span></Button>
              </div>
            </div>
            <div class="flex flex-col gap-5 rounded-b-lg">
              <div class="flex flex-col">
                <div class="mb-[1px]">
                  <Expander bind:expanded={inputExpanded}>
                    <div class="flex flex-row justify-between">
                      <TextBlock variant="bodyStrong">Input</TextBlock>
                      <TextBlock
                        variant="body"
                        style="color: var(--fds-text-tertiary);"
                      >
                        {InputDevices[selectedInput + 1]?.name ??
                          "None"}</TextBlock
                      >
                    </div>

                    <svelte:fragment slot="content">
                      <div class="flex flex-col w-full gap-2">
                        {#each InputDevices as { name, device, value }}
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
                                <TextBlock variant="body" class=""
                                  >{name}</TextBlock
                                >
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
                        --fds-accent-tertiary={adjustBrightness(
                          $accentColor,
                          -10
                        )}
                      ></Checkbox>
                      <NumberBox
                        --fds-accent-default={$accentColor}
                        --fds-accent-secondary={$accentColor}
                        --fds-accent-tertiary={adjustBrightness(
                          $accentColor,
                          -10
                        )}
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
                        --fds-accent-tertiary={adjustBrightness(
                          $accentColor,
                          -10
                        )}
                      ></Checkbox>
                      <NumberBox
                        --fds-accent-default={$accentColor}
                        --fds-accent-secondary={$accentColor}
                        --fds-accent-tertiary={adjustBrightness(
                          $accentColor,
                          -10
                        )}
                      ></NumberBox>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex flex-col">
                <div class="mb-[1px]">
                  <Expander bind:expanded={outputExpanded}>
                    <div class="flex flex-row justify-between">
                      <TextBlock variant="bodyStrong">Output</TextBlock>
                      <TextBlock
                        variant="body"
                        style="color: var(--fds-text-tertiary);"
                      >
                        {OutputDevices[selectedOutput + 1]?.name ??
                          "None"}</TextBlock
                      >
                    </div>

                    <svelte:fragment slot="content">
                      <div class="flex flex-col w-full gap-2">
                        {#each OutputDevices as { name, device, value }}
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
                                <TextBlock variant="body" class=""
                                  >{name}</TextBlock
                                >
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
                        --fds-accent-tertiary={adjustBrightness(
                          $accentColor,
                          -10
                        )}
                      ></Checkbox>
                      <NumberBox
                        --fds-accent-default={$accentColor}
                        --fds-accent-secondary={$accentColor}
                        --fds-accent-tertiary={adjustBrightness(
                          $accentColor,
                          -10
                        )}
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
                        --fds-accent-tertiary={adjustBrightness(
                          $accentColor,
                          -10
                        )}
                      ></Checkbox>
                      <NumberBox
                        --fds-accent-default={$accentColor}
                        --fds-accent-secondary={$accentColor}
                        --fds-accent-tertiary={adjustBrightness(
                          $accentColor,
                          -10
                        )}
                      ></NumberBox>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
  <div
    class="rounded-lg flex flex-row w-screen justify-center bottom-0 px-1.5 mb-0.5 fixed"
  >
    <div
      class="rounded-lg flex flex-row justify-center w-full p-2 mr-1 max-w-[1015px] min-w-[200px]"
    >
      <div class="flex flex-row justify-between w-full">
        <div class="flex gap-2.5">
          <Button><Pen /><span class="pl-1.5">Edit output</span></Button>
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
