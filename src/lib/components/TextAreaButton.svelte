<script>
  // @ts-nocheck

  export let type = "button";
  let className = "";
  export { className as class };
  export let element = null;
</script>

<button
  bind:this={element}
  class="text-box-button {className}"
  {type}
  {...$$restProps}
>
  <slot />
</button>

<style>
  .text-box-button {
    align-items: center;
    background-color: var(--fds-subtle-fill-transparent);
    border: none;
    border-radius: var(--fds-control-corner-radius);
    box-sizing: border-box;
    color: var(--fds-text-secondary);
    display: flex;
    justify-content: center;
    min-block-size: 22px;
    min-inline-size: 26px;
    outline: none;
    padding: 3px 5px;
  }
  .text-box-button:focus-visible {
    box-shadow: var(--fds-focus-stroke);
  }
  .text-box-button:hover {
    background-color: var(--fds-subtle-fill-secondary);
  }
  .text-box-button:active {
    background-color: var(--fds-subtle-fill-tertiary);
    color: var(--fds-text-tertiary);
  }
  .text-box-button:disabled {
    background-color: var(--fds-subtle-fill-tertiary);
    color: var(--fds-text-disabled);
  }
  .text-box-button :global(svg) {
    fill: currentColor;
    min-block-size: 12px;
    min-inline-size: 12px;
    pointer-events: none;
  }
</style>
