<script lang="ts">
  import { path } from "@tauri-apps/api";
  import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
  import { writable } from "svelte/store";
  import type { Writable } from "svelte/store";
  import { onMount } from "svelte";
  import { Button, TextBlock } from "fluent-svelte";
  import Save from "@fluentui/svg-icons/icons/save_20_regular.svg";
  import Folder from "@fluentui/svg-icons/icons/folder_20_regular.svg";
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  const tomlContent: Writable<string> = writable("");
  let tomlPath: string;
  let originalContent: string = "";
  export let textEdited: boolean = false;

  async function getTomlPath() {
    const homeDir = await path.homeDir();
    tomlPath = await path.join(homeDir, "FlexASIO.toml");
  }

  async function readTomlFile() {
    try {
      const content = await readTextFile(tomlPath);
      tomlContent.set(content);
      originalContent = content; // Store the original content
    } catch (error) {
      console.error("Error reading the TOML file:", error);
    }
  }

  export async function saveTomlFile() {
    console.log("Saving TOML file...");
    try {
      await writeTextFile(tomlPath, $tomlContent);
    } catch (error) {
      console.error("Error saving the TOML file:", error);
    }
    readTomlFile();
    textEdited = false;
  }

  function handleTextareaChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    const newContent = target.value;
    textEdited = newContent !== originalContent;
    console.log("Text edited:", textEdited);
  }

  onMount(async () => {
    await getTomlPath();
    readTomlFile();
  });
</script>

<div class="flex flex-col self-center w-full">
  <TextBlock variant="title">Output</TextBlock>
</div>
<div
  in:fly={{ delay: 100, x: 0, y: 10, duration: 150, easing: cubicOut }}
  class="flex flex-col mt-0 mb-0 select-none items-center overflow-scroll gap-2.5 py-2"
  style="height: calc(100vh - 120px);"
>
  <!-- <div
    class="rounded p-2 flex flex-row justify-between w-full"
    style="background-color: var(--fds-card-background-default);"
  >
    <div class="flex flex-row gap-3">
      <Button><Save /><span class="pl-1.5">Save As</span></Button>
      <Button><Folder /><span class="pl-1.5">Load From</span></Button>
    </div>
  </div> -->
  <!-- <button on:click={() => saveTomlFile($tomlContent)}>Save</button> -->

  <div class="text-box-container">
    <textarea
      bind:value={$tomlContent}
      on:input={(e) => handleTextareaChange(e)}
    ></textarea>
    <div class="text-box-underline" />
    <slot />
  </div>
</div>

<style>
  .text-box-container {
    align-items: center;
    background-clip: padding-box;
    background-color: var(--fds-control-fill-default);
    border: 1px solid var(--fds-control-stroke-default);
    border-radius: var(--fds-control-corner-radius);
    cursor: text;
    display: flex;
    inline-size: 100%;
    position: relative;
  }
  .text-box-container:hover {
    background-color: var(--fds-control-fill-secondary);
  }
  .text-box-container:focus-within {
    background-color: var(--fds-control-fill-input-active);
  }
  .text-box-container:focus-within .text-box-underline:after {
    border-bottom: 2px solid var(--fds-accent-default);
  }
  .text-box-underline {
    block-size: calc(100% + 2px);
    border-radius: var(--fds-control-corner-radius);
    inline-size: calc(100% + 2px);
    inset-block-start: -1px;
    inset-inline-start: -1px;
    overflow: hidden;
    pointer-events: none;
    position: absolute;
  }
  .text-box-underline:after {
    block-size: 100%;
    border-bottom: 1px solid var(--fds-control-strong-stroke-default);
    box-sizing: border-box;
    content: "";
    inline-size: 100%;
    inset-block-end: 0;
    inset-inline-start: 0;
    position: absolute;
  }
  .text-box-container > :global(textarea) {
    border: none;
    overflow: auto;
    outline: none;
    padding: 10px;
    background-color: transparent;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
    box-shadow: none;
    height: calc(80vh - 200px);
    width: 100%;
  }
</style>
