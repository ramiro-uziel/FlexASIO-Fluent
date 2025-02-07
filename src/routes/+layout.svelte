<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
  import { ready } from "$lib/stores";
  import { appWindow } from "$lib/stores";
  import { getAccentColor } from "$lib/app";
  import { WindowManager } from "$lib/window";
  import "../app.css";

  let windowManager: WindowManager;

  async function initializeApp() {
    const currentWindow = getCurrentWebviewWindow();
    appWindow.set(currentWindow);

    windowManager = new WindowManager(currentWindow);
    await windowManager.initialize();
    await getAccentColor();

    ready.set(true);
  }

  onMount(async () => {
    await initializeApp();
  });

  onDestroy(() => {
    windowManager?.cleanup();
  });
</script>

<slot />
