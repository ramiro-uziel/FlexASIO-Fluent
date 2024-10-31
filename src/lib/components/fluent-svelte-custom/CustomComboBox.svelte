<script lang="ts">
  // @ts-nocheck
  import { createEventDispatcher, tick } from "svelte";
  import { get_current_component } from "svelte/internal";
  import {
    createEventForwarder,
    externalMouseEvents,
    uid,
  } from "fluent-svelte/internal";
  import ComboBoxItem from "fluent-svelte/ComboBox/ComboBoxItem.svelte";
  import Button from "fluent-svelte/Button/Button.svelte";

  interface ComboBoxItem {
    name: string;
    value: string;
    disabled?: boolean;
  }

  interface ComboBoxProps {
    /** Determines which specified item is selected. Corresponds to a given item's `value` key. */
    value: string;
    /** The initial placeholder text displayed if no item is currently selected. */
    placeholder?: string;
    /** Array of objects representing the dropdown items. */
    items: ComboBoxItem[];
    /** Determines if the ComboBox can be searched. */
    editable?: boolean;
    /** Specifies whether the combobox is disabled. */
    disabled?: boolean;
    /** The current visibility state of the dropdown menu. */
    open?: boolean;
    /** Specifies a custom class name for the outer combobox container. */
    class?: string;
  }

  type ElementRefs = {
    inputElement: HTMLInputElement | null;
    searchInputElement: HTMLInputElement | null;
    containerElement: HTMLDivElement | null;
    menuElement: HTMLUListElement | null;
    buttonElement: HTMLButtonElement | null;
  };

  export let value: string;
  export let placeholder = "";
  export let items: ComboBoxItem[] = [];
  export let editable = false;
  export let disabled = false;
  export let open = false;
  let className = "";
  let searchValue: string;
  export { className as class };

  let inputElement: ElementRefs["inputElement"] = null;
  let searchInputElement: ElementRefs["searchInputElement"] = null;
  let containerElement: ElementRefs["containerElement"] = null;
  let menuElement: ElementRefs["menuElement"] = null;
  let buttonElement: ElementRefs["buttonElement"] = null;

  const forwardEvents = createEventForwarder(get_current_component(), [
    "open",
    "close",
    "select",
    "change",
    "input",
    "beforeinput",
    "keydown",
  ]);

  const dispatch = createEventDispatcher();
  const buttonId = uid("fds-combo-box-button-");
  const dropdownId = uid("fds-combo-box-dropdown-");

  $: selectableItems = items.filter((item) => !item.disabled);
  $: selection = items.find((i) => i.value === value);
  $: if (menuElement && menuElement.children.length > 0 && !editable) {
    if (selection) {
      menuElement.children[items.indexOf(selection)].focus();
    } else {
      menuElement.children[0].focus();
    }
  }

  $: if (items.length > 0) {
    if (open) {
      dispatch("open");
    } else {
      dispatch("close");
    }
  }

  $: dispatch("select", selection);

  let inputFocused = false;

  function selectItem(item: ComboBoxItem): void {
    if (item.disabled) return;
    value = item.value;
    searchValue = item.name;
    open = false;
    if (containerElement && !editable) containerElement.children[0].focus();
  }

  async function openMenu(): Promise<void> {
    open = !open;
    await tick();
    if (editable && searchInputElement) searchInputElement.focus();
  }

  async function handleKeyboardNavigation(event: KeyboardEvent): Promise<void> {
    const { key } = event;
    event.stopPropagation();
    const editableClosed = editable && !open;

    if (key === "Tab" || key === "Esc" || key === "Escape") open = false;

    if (
      key === "ArrowDown" &&
      !editableClosed &&
      !(items.indexOf(selection!) >= items.length - 1)
    ) {
      value = selectableItems[selectableItems.indexOf(selection!) + 1].value;
      searchValue =
        selectableItems[selectableItems.indexOf(selection!) + 1].name;
    } else if (
      key === "ArrowUp" &&
      !editableClosed &&
      !(items.indexOf(selection!) <= 0)
    ) {
      value = selectableItems[selectableItems.indexOf(selection!) - 1].value;
      searchValue =
        selectableItems[selectableItems.indexOf(selection!) - 1].name;
    } else if (key === "Home") {
      value = selectableItems[0].value;
      searchValue = selectableItems[0].name;
    } else if (key === "End") {
      value = selectableItems[selectableItems.length - 1].value;
      searchValue = selectableItems[selectableItems.length - 1].name;
    } else if (open && (key === "Enter" || key === " ")) {
      event.preventDefault();
      selectItem(selection!);
    } else if (
      searchInputElement &&
      document.activeElement !== searchInputElement
    ) {
      searchInputElement.focus();
    }

    if (
      key === "ArrowDown" ||
      key === "ArrowUp" ||
      key === "Home" ||
      key === "End"
    )
      event.preventDefault();

    if (key === "ArrowDown" || (key === "ArrowUp" && editable)) {
      if (open) {
        await tick();
        searchInputElement?.select();
      } else {
        open = true;
      }
    }
  }

  function handleInputFocus(): void {
    searchInputElement!.select();
    inputFocused = true;
  }

  function handleInputBlur(): void {
    inputFocused = false;
  }

  function handleInput(event: InputEvent): void {
    const match = selectableItems.find((i) =>
      i.name.toLowerCase().startsWith(searchValue.toLowerCase())
    );
    if (!match) value = "";
    if (
      match &&
      event.inputType === "insertText" &&
      searchValue.trim() !== ""
    ) {
      searchInputElement!.value = match.name;
      searchInputElement!.setSelectionRange(
        searchValue.length,
        match.name.length
      );
    }
    if (match && !match.disabled) value = match.value;
    searchValue = searchInputElement!.value;
  }
</script>

<div
  use:forwardEvents
  use:externalMouseEvents={{ type: "mousedown" }}
  class="combo-box {className}"
  class:disabled
  class:editable
  class:open
  on:outermousedown={() => {
    if (open) open = false;
  }}
  bind:this={containerElement}
  {...$$restProps}
>
  <Button
    type="button"
    class="combo-box-button"
    id={buttonId}
    aria-labelledby={buttonId}
    aria-haspopup={open ? "listbox" : undefined}
    aria-controls={dropdownId}
    on:keydown={handleKeyboardNavigation}
    on:keydown
    on:click={openMenu}
    bind:element={buttonElement}
    {disabled}
  >
    <span class="combo-box-label" class:placeholder={!selection}>
      {selection?.name || placeholder}
    </span>
    <svg
      aria-hidden="true"
      class="combo-box-icon"
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 48 48"
    >
      <path
        fill="currentColor"
        d="M8.36612 16.1161C7.87796 16.6043 7.87796 17.3957 8.36612 17.8839L23.1161 32.6339C23.6043 33.122 24.3957 33.122 24.8839 32.6339L39.6339 17.8839C40.122 17.3957 40.122 16.6043 39.6339 16.1161C39.1457 15.628 38.3543 15.628 37.8661 16.1161L24 29.9822L10.1339 16.1161C9.64573 15.628 8.85427 15.628 8.36612 16.1161Z"
      />
    </svg>
  </Button>

  {#if !disabled && items.length > 0}
    {#if open}
      <ul
        bind:this={menuElement}
        on:blur={() => (open = false)}
        id={dropdownId}
        aria-labelledby={buttonId}
        role="listbox"
        class="combo-box-dropdown direction-top"
      >
        {#each items as item, i}
          <ComboBoxItem
            role="option"
            selected={item.value === value}
            disabled={item.disabled}
            id="{dropdownId}-item-{i}"
            on:keydown={handleKeyboardNavigation}
            on:click={() => selectItem(item)}
          >
            {item.name}
          </ComboBoxItem>
        {/each}
      </ul>
    {/if}

    <input
      type="hidden"
      aria-hidden="true"
      bind:this={inputElement}
      bind:value
      on:change
      on:input
      on:beforeinput
    />
    <slot />
  {/if}
</div>

<style>
  @-webkit-keyframes menu-in {
    0% {
      -webkit-clip-path: var(--fds-grow-clip-path);
      clip-path: var(--fds-grow-clip-path);
    }
    to {
      -webkit-clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
      clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    }
  }
  @keyframes menu-in {
    0% {
      -webkit-clip-path: var(--fds-grow-clip-path);
      clip-path: var(--fds-grow-clip-path);
    }
    to {
      -webkit-clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
      clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    }
  }
  @-webkit-keyframes shadow-in {
    0% {
      box-shadow: none;
    }
    to {
      box-shadow: var(--fds-flyout-shadow);
    }
  }
  @keyframes shadow-in {
    0% {
      box-shadow: none;
    }
    to {
      box-shadow: var(--fds-flyout-shadow);
    }
  }
  .combo-box {
    display: inline-flex;
    position: relative;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  .combo-box :global(.button),
  .combo-box :global(.text-box) {
    flex: 1 1 auto;
  }
  .combo-box :global(.text-box) {
    border-color: var(--fds-control-border-default);
  }
  .combo-box :global(.text-box-underline:after) {
    border-color: transparent;
  }
  .combo-box :global(.text-box-container) {
    cursor: default;
  }
  .combo-box :global(.text-box-container:focus-visible) {
    cursor: text;
  }
  .combo-box.editable :global(.combo-box-textbox:not(:focus-within)) {
    border-color: var(--fds-control-border-default);
    cursor: default;
  }
  .combo-box.editable
    :global(.combo-box-textbox:not(:focus-within))
    :global(.text-box-underline:after) {
    content: none;
  }
  .combo-box.editable :global(.combo-box-textbox.disabled) {
    border-color: var(--fds-control-stroke-default);
  }
  .combo-box.editable.open :global(.combo-box-textbox) {
    background-color: var(--fds-control-fill-input-active);
    cursor: text;
  }
  .combo-box.editable.open
    :global(.combo-box-textbox)
    :global(.text-box-underline:after) {
    border-bottom: 2px solid var(--fds-accent-default);
    content: "";
  }
  .combo-box.editable.open
    :global(.combo-box-textbox)
    :global(input::-moz-placeholder) {
    color: var(--fds-text-tertiary);
  }
  .combo-box.editable.open
    :global(.combo-box-textbox)
    :global(input:-ms-input-placeholder) {
    color: var(--fds-text-tertiary);
  }
  .combo-box.editable.open
    :global(.combo-box-textbox)
    :global(input::placeholder) {
    color: var(--fds-text-tertiary);
  }
  .combo-box.editable.open :global(.text-box-underline) {
    border-end-end-radius: 0;
    border-end-start-radius: 0;
  }
  .combo-box.editable .combo-box-dropdown {
    border-radius: var(--fds-overlay-corner-radius);
    border-start-end-radius: 0;
    border-start-start-radius: 0;
    inline-size: 100%;
    inset-block-start: 100%;
    inset-inline-start: 0;
    margin: 0;
  }
  .combo-box.editable .combo-box-icon {
    margin: 0;
  }
  .combo-box-label {
    flex: 1 1 auto;
    min-block-size: 20px;
    text-align: start;
  }
  .combo-box-label.placeholder {
    color: var(--fds-text-secondary);
  }
  .combo-box.disabled .placeholder {
    color: var(--fds-text-disabled);
  }
  .combo-box-icon {
    -webkit-margin-start: 8px;
    block-size: 12px;
    inline-size: 12px;
    margin-inline-start: 8px;
  }
  .combo-box-dropdown {
    -webkit-margin-before: -6px;
    -webkit-margin-start: -5px;
    -webkit-animation:
      menu-in var(--fds-control-normal-duration)
        var(--fds-control-fast-out-slow-in-easing),
      shadow-in var(--fds-control-normal-duration)
        var(--fds-control-fast-out-slow-in-easing)
        var(--fds-control-normal-duration);
    animation:
      menu-in var(--fds-control-normal-duration)
        var(--fds-control-fast-out-slow-in-easing),
      shadow-in var(--fds-control-normal-duration)
        var(--fds-control-fast-out-slow-in-easing)
        var(--fds-control-normal-duration);
    background-clip: padding-box;
    background-color: var(--fds-solid-background-quarternary);
    border: 1px solid var(--fds-surface-stroke-flyout);
    border-radius: var(--fds-overlay-corner-radius);
    box-shadow: var(--fds-flyout-shadow);
    box-sizing: border-box;
    inline-size: calc(100% + 8px);
    inset-block-start: var(--fds-menu-offset, 0);
    inset-inline-start: 0;
    margin: 0;
    margin-block-start: -6px;
    margin-inline-start: -5px;
    max-block-size: 504px;
    overflow: auto;
    padding: 1px;
    position: absolute;
    z-index: 100;
  }
  @supports (overflow: overlay) {
    .combo-box-dropdown {
      overflow: overlay;
    }
  }
  .combo-box-dropdown.direction-top {
    --fds-grow-clip-path: polygon(0 0, 100% 0, 100% 25%, 0 25%);
  }
  .combo-box-dropdown.direction-center {
    --fds-grow-clip-path: polygon(0 25%, 100% 24%, 100% 75%, 0 75%);
  }
  .combo-box-dropdown.direction-bottom {
    --fds-grow-clip-path: polygon(0 75%, 100% 75%, 100% 100%, 0 100%);
  }
</style>
