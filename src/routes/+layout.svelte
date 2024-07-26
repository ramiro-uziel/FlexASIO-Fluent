<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { ready } from "$lib/stores";
  import "../app.css";

  onMount(async () => {
    const updateDarkMode = (theme: string) => {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    const currentWindow = await getCurrentWindow();
    const theme = await currentWindow.theme();
    updateDarkMode(theme?.toString() || "dark");

    const unlisten = await currentWindow.onThemeChanged(
      ({ payload: theme }) => {
        updateDarkMode(theme);
        console.log("New theme: " + theme);
      }
    );

    currentWindow.show().then(() => {
      ready.set(true);
    });

    onDestroy(() => {
      unlisten();
    });
  });
</script>

<slot />
