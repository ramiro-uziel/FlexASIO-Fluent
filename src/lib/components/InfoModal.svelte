<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Button } from "fluent-svelte";
  import { adjustBrightness } from "$lib/color";
  import { accentColor } from "$lib/stores";
  import { expoOut } from "svelte/easing";
  import { fade, fly } from "svelte/transition";
  import { invoke } from "@tauri-apps/api/core";
  import { open } from "@tauri-apps/plugin-shell";
  import { getVersion } from "@tauri-apps/api/app";
  import { checkVersion, latestVersion, updateAvailable } from "$lib/app";

  import Alert from "@fluentui/svg-icons/icons/error_circle_16_regular.svg?component";
  import Dismiss from "@fluentui/svg-icons/icons/dismiss_circle_20_regular.svg?component";

  export let showModal = false;

  let dllProductVersion: string;

  let appVersion: string;

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      showModal = false;
    }
  };

  const DOCUMENTATION_URL =
    "https://github.com/dechamps/FlexASIO/blob/master/CONFIGURATION.md";

  const PROJECT_URL = "https://github.com/ramiro-uziel/FlexASIO-Fluent";

  const ISSUE_URL =
    "https://github.com/ramiro-uziel/FlexASIO-Fluent/issues/new";

  $: hoverTextColor = adjustBrightness($accentColor, 20, -20);
  $: clickTextColor = adjustBrightness($accentColor, -20, 0);

  onMount(() => {
    invoke("get_dll_product_version").then((version: unknown) => {
      dllProductVersion = (version as string).split(" ")[0];
    });

    getVersion().then((version) => {
      appVersion = version;
    });

    checkVersion();

    window.addEventListener("keydown", handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener("keydown", handleKeydown);
  });
</script>

<button
  class="fixed bg-black inset-0 bg-opacity-30 flex items-center justify-center z-50 cursor-default"
  on:click={() => (showModal = false)}
  transition:fade={{ duration: 200, easing: expoOut }}
>
  <button
    class="p-6 rounded-lg shadow-2xl shadow-black/50 cursor-default border border-white border-opacity-10 -translate-y-3 min-w-72"
    style="background-color: {adjustBrightness($accentColor, -92, -5)}; "
    on:click|stopPropagation
    in:fly={{
      x: 0,
      y: 20,
      duration: 400,
      opacity: 0.2,
      easing: expoOut,
    }}
    out:fade={{
      duration: 200,
      easing: expoOut,
    }}
  >
    <div class="flex flex-row justify-between items-center mb-5">
      <h2 class="text-xl font-medium text-left">FlexASIO Fluent</h2>
    </div>
    <div class="flex flex-col gap-5 text-left">
      <div class="grid grid-cols-2 gap-5">
        <div>
          <p class="font-medium">Version</p>
          <p>{appVersion}</p>
        </div>
        <div>
          <p class="font-medium">FlexASIO Version</p>
          <p>{dllProductVersion}</p>
        </div>

        <div>
          <button
            on:click={() => open(DOCUMENTATION_URL)}
            class="underline underline-offset-4 hover-text transition-colors duration-100"
            style="--hover-color: {hoverTextColor}; --click-color: {clickTextColor}"
          >
            Configuration Docs
          </button>
        </div>
        <div>
          <button
            on:click={() => open(PROJECT_URL)}
            class="underline underline-offset-4 hover-text transition-colors duration-100"
            style="--hover-color: {hoverTextColor}; --click-color: {clickTextColor}"
          >
            Project Repository
          </button>
        </div>

        <div>
          <button
            on:click={() => open(ISSUE_URL)}
            class="hover-text transition-colors duration-100 flex items-center gap-1 text-sm"
            style="--hover-color: {hoverTextColor}; --click-color: {clickTextColor}"
            ><Alert /> Report Issue</button
          >
        </div>
      </div>

      {#if $updateAvailable}
        <div class=" flex flex-row gap-2 justify-between text-sm items-center">
          <div
            class="flex flex-row gap-1 justify-center items-center px-2 py-1 rounded h-8 w-full"
            style="background-color: {adjustBrightness(
              $accentColor,
              -51,
              130
            )};"
          >
            <Alert />
            <span> Update available - </span>
            <span class="text-white">
              v{$latestVersion}
            </span>
          </div>
          <Button class="h-8" on:click={() => (showModal = false)}
            ><Dismiss /></Button
          >
        </div>
      {/if}

      <Button class="flex justify-end" on:click={() => (showModal = false)}
        >Close</Button
      >
    </div>
  </button>
</button>

<style>
  .hover-text {
    text-decoration-color: rgba(256, 256, 256, 0.4);
    text-decoration-style: dotted;
  }

  .hover-text:hover {
    color: var(--hover-color);
    fill: var(--hover-color);
    text-decoration-color: var(--hover-color);
    text-decoration-style: solid;
  }

  .hover-text:active {
    color: var(--click-color);
    fill: var(--click-color);
    text-decoration-color: var(--click-color);
    text-decoration-style: solid;
  }
</style>
