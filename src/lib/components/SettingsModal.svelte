<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Button } from "fluent-svelte";
  import { adjustBrightness } from "$lib/color";
  import { accentColor } from "$lib/stores";
  import { expoOut } from "svelte/easing";
  import { fade, fly } from "svelte/transition";

  export let showModal = false;

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      showModal = false;
    }
  };

  onMount(() => {
    window.addEventListener("keydown", handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener("keydown", handleKeydown);
  });
</script>

<button
  class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 cursor-default"
  on:click={() => (showModal = false)}
  transition:fade={{ duration: 200, easing: expoOut }}
>
  <button
    class="p-6 rounded-lg shadow-2xl shadow-black/50 cursor-default border border-white border-opacity-10 -translate-y-3"
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
    <h2 class="text-xl font-bold mb-4 text-left">Settings</h2>
    <p class="mb-4">This is the modal content.</p>
    <div class="flex justify-end">
      <Button on:click={() => (showModal = false)}>Close</Button>
    </div>
  </button>
</button>
