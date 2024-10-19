<script lang="ts">
  import { osType } from "$lib/utils/os";
  import { cn } from "$lib/utils/cn";
  import Windows from "./controls/Windows.svelte";

  export let hide = false;
  export let hideMethod = "display";
  export let justify = false;

  const customClass = cn(
    "flex",
    $$props.class,
    hide && (hideMethod === "display" ? "hidden" : "invisible"),
    justify && "ml-auto"
  );

  const isWindows = osType === "windows";

  if (!isWindows) {
    console.error(
      "Error: This component is designed for Windows platforms only."
    );
  }
</script>

{#if isWindows}
  <Windows {...$$props} class={customClass} />
{/if}
