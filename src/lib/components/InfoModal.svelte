<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Button, Tooltip } from "fluent-svelte";
  import { adjustBrightness } from "$lib/color";
  import { accentColor } from "$lib/stores";
  import { expoOut } from "svelte/easing";
  import { fade, fly } from "svelte/transition";
  import { invoke } from "@tauri-apps/api/core";
  import { open } from "@tauri-apps/plugin-shell";
  import { getVersion } from "@tauri-apps/api/app";
  import {
    checkVersion,
    latestVersion,
    updateAvailable,
    setUpdateDismissed,
    updateDismissed,
  } from "$lib/app";

  import DismissCircle from "@fluentui/svg-icons/icons/dismiss_circle_20_regular.svg?component";

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

  const ISSUE_URL =
    "https://github.com/ramiro-uziel/FlexASIO-Fluent/issues/new";

  const PROJECT_URL = "https://github.com/ramiro-uziel/FlexASIO-Fluent";

  const UPDATE_URL =
    "https://github.com/ramiro-uziel/FlexASIO-Fluent/releases/latest";

  function handleDismissUpdate() {
    setUpdateDismissed(!$updateDismissed);
  }

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
  class="fixed bg-black inset-0 bg-opacity-50 flex items-center justify-center z-50 cursor-default"
  on:click={() => (showModal = false)}
  transition:fade={{ duration: 200, easing: expoOut }}
>
  <button
    class="modal p-6 rounded-lg shadow-2xl shadow-black/50 cursor-default border border-white border-opacity-10"
    style="--modal-light: {adjustBrightness(
      $accentColor,
      900,
      -90
    )}; --modal-dark: {adjustBrightness($accentColor, -92, -5)};"
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
    <div class="flex flex-col gap-2">
      <div
        class="flex flex-row justify-between items-center p-4 rounded-md min-w-[400px] mb-2"
        style="background-color: var(--fds-card-background-default);"
      >
        <div class="text-left">
          <h2 class="wd:text-xl font-bold text-left">FlexASIO Fluent</h2>
          <p class="text-sm">
            v{appVersion}
            {#if dllProductVersion}
              - {dllProductVersion}
            {/if}
          </p>
        </div>
        <div class="space-x-1">
          <Button class="h-8" on:click={() => open(ISSUE_URL)}
            >Report Issue</Button
          >
        </div>
      </div>

      <div
        class="flex flex-row justify-between items-center p-4 rounded-md"
        style="background-color: var(--fds-card-background-default);"
      >
        <div class="text-left">
          <p class="font-medium text-sm">Configuration Help</p>
          <p class="text-sm text-gray-400">
            Read about it in the FlexASIO repository
          </p>
        </div>
        <Button class="h-8" on:click={() => open(DOCUMENTATION_URL)}
          >Github</Button
        >
      </div>

      <div
        class="flex flex-row justify-between items-center p-4 rounded-md"
        style="background-color: var(--fds-card-background-default);"
      >
        <div class="text-left">
          <p class="font-medium text-sm">Project Repository</p>
          <p class="text-sm text-gray-400">Source code of the project</p>
        </div>
        <Button class="h-8" on:click={() => open(PROJECT_URL)}>Github</Button>
      </div>

      {#if $updateAvailable}
        <div
          class="flex flex-row justify-between items-center p-4 rounded-md accent-card"
          style="--accent-card-light: {$updateDismissed
            ? 'var(--fds-card-background-default)'
            : adjustBrightness($accentColor, 50, -30)};
            
            --accent-card-dark: {$updateDismissed
            ? 'var(--fds-card-background-default)'
            : adjustBrightness($accentColor, -40, 130)};"
        >
          <div class="text-left">
            <p class="font-medium text-sm">Update available</p>
            <p
              class="text-sm {$updateDismissed
                ? 'text-gray-400'
                : 'dark:text-white text-black'}"
            >
              Version {$latestVersion} is available
            </p>
          </div>
          <div class="flex items-center justify-center space-x-3">
            <Tooltip
              text="Toggle update notification"
              placement="left"
              offset={75}
              delay={0}
            >
              <button
                class="h-8 opacity-40 hover:opacity-100 transition-opacity duration-100 translate-y-0.5"
                on:click={() => handleDismissUpdate()}><DismissCircle /></button
              >
            </Tooltip>
            <Button class="h-8" on:click={() => open(UPDATE_URL)}
              >Download</Button
            >
          </div>
        </div>
      {/if}

      <Button class="mt-4" on:click={() => (showModal = false)}>Close</Button>
    </div>
  </button>
</button>

<style>
  .modal {
    background-color: var(--modal-light);
  }

  @media (prefers-color-scheme: dark) {
    .modal {
      background-color: var(--modal-dark);
    }
  }

  .accent-card {
    background-color: var(--accent-card-light);
  }

  @media (prefers-color-scheme: dark) {
    .accent-card {
      background-color: var(--accent-card-dark);
    }
  }
</style>
