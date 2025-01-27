<script>
  // @ts-nocheck

  import Button from "$lib/components/windows/Button.svelte";
  import Icons from "$lib/components/windows/Icons.svelte";
  import { closeWindow, maximizeWindow, minimizeWindow } from "$lib/app";

  const isWindowMaximized = 0;
</script>

<div {...$$props} class="h-8 select-none {$$props.class}">
  <Button
    on:click={() => minimizeWindow()}
    class="max-h-8 w-[46px] cursor-default rounded-none bg-transparent text-black/90 hover:bg-black/[.05] active:bg-black/[.03] dark:text-white dark:hover:bg-white/[.06] dark:active:bg-white/[.04]"
  >
    <Icons icon="minimizeWin" />
  </Button>
  <Button
    on:click={() => maximizeWindow()}
    class="max-h-8 w-[46px] cursor-default rounded-none bg-transparent text-black/90 hover:bg-black/[.05] active:bg-black/[.03] dark:text-white dark:hover:bg-white/[.06] dark:active:bg-white/[.04]"
  >
    {#if isWindowMaximized}
      <Icons icon="maximizeRestoreWin" />
    {:else}
      <Icons icon="maximizeWin" />
    {/if}
  </Button>
  <Button
    on:click={() => closeWindow()}
    class="max-h-8 w-[46px] cursor-default rounded-none bg-transparent text-black/90 hover:bg-[#c42b1c] hover:text-white active:bg-[#c42b1c]/90 dark:text-white"
  >
    <Icons icon="closeWin" />
  </Button>
</div>
