<script>
  // @ts-nocheck

  export let value = "";
  let className = "";
  export { className as class };
</script>

<div class="text-box-container {className}">
  <textarea spellcheck="false" bind:value></textarea>
  <div class="text-box-underline" />
  <slot />
</div>

<style>
  .text-box-container {
    align-items: center;
    background-clip: padding-box;
    background-color: var(--fds-control-fill-default);
    border: 1px solid var(--fds-control-stroke-default);
    border-radius: var(--fds-control-corner-radius);
    cursor: text;
    display: flex;
    inline-size: 100%;
    position: relative;
  }
  .text-box-container:hover {
    background-color: var(--fds-control-fill-secondary);
  }
  .text-box-container.disabled {
    background-color: var(--fds-control-fill-disabled);
    cursor: default;
  }
  .text-box-container.disabled .text-box-underline {
    display: none;
  }
  .text-box-container:focus-within {
    background-color: var(--fds-control-fill-input-active);
  }
  .text-box-container:focus-within .text-box-underline:after {
    border-bottom: 2px solid var(--fds-accent-default);
  }
  .text-box-underline {
    block-size: calc(100% + 2px);
    border-radius: var(--fds-control-corner-radius);
    inline-size: calc(100% + 2px);
    inset-block-start: -1px;
    inset-inline-start: -1px;
    overflow: hidden;
    pointer-events: none;
    position: absolute;
  }
  .text-box-underline:after {
    block-size: 100%;
    border-bottom: 1px solid var(--fds-control-strong-stroke-default);
    box-sizing: border-box;
    content: "";
    inline-size: 100%;
    inset-block-end: 0;
    inset-inline-start: 0;
    position: absolute;
  }
  .text-box-container > :global(textarea) {
    border: none;
    overflow: auto;
    outline: none;
    padding: 10px;
    background-color: transparent;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
    box-shadow: none;
    height: calc(80vh - 200px);
    width: 100%;
  }
</style>
