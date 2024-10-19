<script>
  import { cn } from "$lib/utils/cn";
</script>

<button
  on:click
  {...$$props}
  class={cn(
    "inline-flex cursor-default items-center justify-center bg-sky-100",
    $$props.class
  )}
>
  <slot />
</button>
