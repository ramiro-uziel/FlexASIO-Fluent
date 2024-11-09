<script lang="ts">
  import { path } from "@tauri-apps/api";
  import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
  import { writable } from "svelte/store";
  import type { Writable } from "svelte/store";
  import { onMount } from "svelte";
  import { TextBlock } from "fluent-svelte";
  import { fly } from "svelte/transition";
  import { expoOut } from "svelte/easing";
  import { Menu, PredefinedMenuItem } from "@tauri-apps/api/menu";
  import { adjustBrightness } from "$lib/color";
  import { accentColor } from "$lib/stores";
  import TomlEditor from "$lib/components/TomlEditor.svelte";

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
      originalContent = content;
    } catch (error) {
      console.error("Error reading the TOML file:", error);
    }
  }

  export async function saveTomlFile() {
    try {
      await writeTextFile(tomlPath, $tomlContent);
    } catch (error) {
      console.error("Error saving the TOML file:", error);
    }
    readTomlFile();
    textEdited = false;
  }

  function handleTextareaChange() {
    tomlContent.subscribe((newContent) => {
      textEdited = newContent !== originalContent;
    })();
  }

  async function showContextMenu(event: MouseEvent) {
    event.preventDefault();

    const menuItems = await Promise.all([
      PredefinedMenuItem.new({ item: "Cut" }),
      PredefinedMenuItem.new({ item: "Copy" }),
      PredefinedMenuItem.new({ item: "Paste" }),
      PredefinedMenuItem.new({ item: "Separator" }),
      PredefinedMenuItem.new({ item: "SelectAll" }),
      PredefinedMenuItem.new({ item: "Separator" }),
      PredefinedMenuItem.new({ item: "Undo" }),
      PredefinedMenuItem.new({ item: "Redo" }),
    ]);

    const menu = await Menu.new({
      items: menuItems,
    });

    await menu.popup();
  }

  $: selectTextColor = adjustBrightness($accentColor, -50, 0);
  onMount(async () => {
    await getTomlPath();
    readTomlFile();
  });
</script>

<div class="flex flex-col self-center w-full">
  <TextBlock data-tauri-drag-region variant="title">Output</TextBlock>
</div>
<div
  in:fly={{ x: 0, y: 20, duration: 400, opacity: 0.2, easing: expoOut }}
  class="flex flex-col mt-0 mb-0 select-none items-center overflow-y-scroll overflow-x-hidden gap-2.5 py-2"
  style="height: calc(100vh - 98px);"
>
  <TomlEditor
    value={tomlContent}
    onInput={handleTextareaChange}
    onContextMenu={showContextMenu}
    {selectTextColor}
  />
</div>
