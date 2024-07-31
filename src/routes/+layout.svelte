<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { ready } from "$lib/stores";
  import "../app.css";

  let unlisten: (() => void) | undefined;

  onMount(async () => {
    const updateDarkMode = (theme: string) => {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
    const currentWindow = getCurrentWindow();
    const theme = await currentWindow.theme();
    updateDarkMode(theme?.toString() || "dark");
    // await currentWindow.show();
    // ready.set(true);

    try {
      unlisten = await currentWindow.onThemeChanged(({ payload: theme }) => {
        updateDarkMode(theme);
      });
    } catch (error) {
      console.error("Error during onMount:", error);
    }

    currentWindow.show().then(() => {
      ready.set(true);
    });
  });

  onDestroy(() => {
    if (unlisten) {
      unlisten();
    }
  });
</script>

<slot />
