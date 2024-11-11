<script lang="ts">
  import { onMount } from "svelte";
  import Prism from "prismjs";
  import "prismjs/components/prism-toml";
  import type { Writable } from "svelte/store";
  import { adjustBrightness } from "$lib/color";
  import { accentColor } from "$lib/stores";
  import { Menu, PredefinedMenuItem, MenuItem } from "@tauri-apps/api/menu";

  export let value: Writable<string>;
  export let onInput: (event: Event) => void;

  let selectTextColor: string;
  let textarea: HTMLTextAreaElement;
  let highlighter: HTMLPreElement;
  let currentValue = "";

  function syncHighlight() {
    if (highlighter) {
      const highlighted = Prism.highlight(
        currentValue,
        Prism.languages.toml,
        "toml"
      );
      highlighter.innerHTML = highlighted + "\n";
    }
  }

  function syncScroll(event: Event) {
    const target = event.target as HTMLElement;
    if (target === textarea) {
      highlighter.scrollTop = textarea.scrollTop;
      highlighter.scrollLeft = textarea.scrollLeft;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        document.execCommand("redo");
      } else {
        document.execCommand("undo");
      }
    }
  }

  async function handleContextMenu(event: MouseEvent) {
    event.preventDefault();

    const menuItems = await Promise.all([
      PredefinedMenuItem.new({
        item: "Cut",
      }),
      PredefinedMenuItem.new({
        item: "Copy",
      }),
      PredefinedMenuItem.new({ item: "Paste" }),
      PredefinedMenuItem.new({ item: "Separator" }),
      PredefinedMenuItem.new({ item: "SelectAll" }),
      PredefinedMenuItem.new({ item: "Separator" }),
      MenuItem.new({
        text: "Undo",
        accelerator: "CommandOrControl+Z",
        enabled: document.queryCommandEnabled("undo"),
        action: () => {
          textarea.focus();
          document.execCommand("undo");
        },
      }),
      MenuItem.new({
        text: "Redo",
        accelerator: "CommandOrControl+Shift+Z",
        enabled: document.queryCommandEnabled("redo"),
        action: () => {
          textarea.focus();
          document.execCommand("redo");
        },
      }),
    ]);

    const menu = await Menu.new({
      items: menuItems,
    });

    await menu.popup();
  }

  $: {
    currentValue = $value;
    syncHighlight();
  }

  $: selectTextColor = adjustBrightness($accentColor, -50, 0);
  $: selectTextColorLight = adjustBrightness($accentColor, 10, -60);

  onMount(() => {
    syncHighlight();
    textarea.addEventListener("scroll", syncScroll);

    return () => {
      textarea.removeEventListener("scroll", syncScroll);
    };
  });
</script>

<div class="text-box-container" data-enable-context-menu>
  <pre bind:this={highlighter} class="highlighter" aria-hidden="true"></pre>

  <textarea
    bind:this={textarea}
    bind:value={$value}
    on:input={onInput}
    on:keydown={handleKeydown}
    on:contextmenu={handleContextMenu}
    spellcheck="false"
    class="editor font-mono font-normal"
    style="--select-color: {selectTextColor}; --select-color-light: {selectTextColorLight};"
    rows="1"
  ></textarea>
</div>

<style>
  .text-box-container {
    position: relative;
    display: flex;
    inline-size: 100%;
    align-items: stretch;
    background-clip: padding-box;
    background-color: var(--fds-control-fill-input-active);
    border: 1px solid var(--fds-control-stroke-default);
    border-radius: var(--fds-control-corner-radius);
    cursor: text;
    height: 800px;
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
    width: 100%;
    white-space: pre;
    word-wrap: normal;
    color: transparent;
    caret-color: var(--fds-text-primary);
    position: relative;
    z-index: 2;
    min-height: 38px;
    height: 100%;
    resize: none;
  }

  .highlighter {
    margin: 0;
    padding: 10px;
    width: 100%;
    overflow: auto;
    white-space: pre;
    word-wrap: normal;
    box-sizing: border-box;
    pointer-events: none;
    color: var(--fds-text-primary);
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    min-height: 38px;
    height: 100%;
  }

  .editor::selection {
    background-color: var(--select-color);
    color: var(--fds-text-primary);
  }

  @media (prefers-color-scheme: light) {
    .editor::selection {
      background-color: var(--select-color-light);
      color: var(--fds-text-primary);
    }
  }

  :global(.token.comment) {
    color: #6a9955;
  }
  :global(.token.property) {
    color: #9cdcfe;
  }
  :global(.token.string) {
    color: #ce9178;
  }
  :global(.token.number) {
    color: #b5cea8;
  }
  :global(.token.boolean) {
    color: #569cd6;
  }
  :global(.token.punctuation) {
    color: #d4d4d4;
  }
  :global(.token.operator) {
    color: #d4d4d4;
  }

  @media (prefers-color-scheme: light) {
    :global(.token.comment) {
      color: #008000;
    }
    :global(.token.property) {
      color: #0000ff;
    }
    :global(.token.string) {
      color: #a31515;
    }
    :global(.token.number) {
      color: #098658;
    }
    :global(.token.boolean) {
      color: #0000ff;
    }
    :global(.token.punctuation) {
      color: #000000;
    }
    :global(.token.operator) {
      color: #000000;
    }
  }
</style>
