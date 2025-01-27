<script>
  // @ts-nocheck
  // TODO: progressively enhance this
  import { createEventDispatcher } from "svelte";
  import { get_current_component } from "svelte/internal";
  import { createEventForwarder, uid } from "fluent-svelte/internal";
  /** Determines whether the expander is expanded (open) or not. */
  export let expanded = false;
  /** Determines the direction that the expander will extend to. */
  export let direction = "down";
  // svelte-ignore unused-export-let
  /** Determines the expander header's semantic HTML heading tag (h1-h6). */
  export let headingLevel = 3;
  /** Specifies a custom class name for the expander. */
  let className = "";
  export { className as class };
  /** Obtains a bound DOM reference to the expander's container element. */
  export let containerElement = null;
  /** Obtains a bound DOM reference to the expander's header button element. */
  export let headerElement = null;
  /** Obtains a bound DOM reference to the expander's content container. */
  export let contentElement = null;
  const dispatch = createEventDispatcher();
  const forwardEvents = createEventForwarder(get_current_component(), [
    "expand",
    "collapse",
  ]);
  const headerId = uid("fds-expander-header-");
  const contentId = uid("fds-expander-content-");
  $: if (expanded) {
    dispatch("expand");
  } else {
    dispatch("collapse");
  }
  function handleKeydown({ key }) {
    if (key === "Enter" || key === " ") {
      event.preventDefault();
      expanded = !expanded;
    }
  }
</script>

<!--
  @component
  Expanders are controls that display a header and a collapsable content area. The content area can be expanded clicking on the header. [Docs](https://fluent-svelte.vercel.app/docs/components/expander)
  - Usage:
      ```tsx
      <Expander>
          Header
          <svelte:fragment slot="content">
              Content
          </svelte:fragment>
      </Expander>
      ```
  -->
<div
  use:forwardEvents
  class="expander direction-{direction} {className}"
  role="region"
  class:expanded
  bind:this={containerElement}
  {...$$restProps}
>
  <svelte:element this="h">
    <div
      role="button"
      id={headerId}
      aria-controls={contentId}
      class="expander-header"
      aria-expanded={expanded}
      tabindex="0"
      bind:this={headerElement}
      on:keydown={handleKeydown}
      on:click={() => (expanded = !expanded)}
    >
      {#if $$slots.icon}
        <div class="expander-icon">
          <slot name="icon" />
        </div>
      {/if}
      <span class="expander-header-title">
        <slot />
      </span>
      <button
        class="expander-chevron"
        tabindex="-1"
        id={contentId}
        aria-labelledby={headerId}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          {#if direction === "down"}
            <path
              fill="currentColor"
              d="M2.14645 4.64645C2.34171 4.45118 2.65829 4.45118 2.85355 4.64645L6 7.79289L9.14645 4.64645C9.34171 4.45118 9.65829 4.45118 9.85355 4.64645C10.0488 4.84171 10.0488 5.15829 9.85355 5.35355L6.35355 8.85355C6.15829 9.04882 5.84171 9.04882 5.64645 8.85355L2.14645 5.35355C1.95118 5.15829 1.95118 4.84171 2.14645 4.64645Z"
            />
          {:else}
            <path
              fill="currentColor"
              d="M2.14645 7.35355C2.34171 7.54882 2.65829 7.54882 2.85355 7.35355L6 4.20711L9.14645 7.35355C9.34171 7.54882 9.65829 7.54882 9.85355 7.35355C10.0488 7.15829 10.0488 6.84171 9.85355 6.64645L6.35355 3.14645C6.15829 2.95118 5.84171 2.95118 5.64645 3.14645L2.14645 6.64645C1.95118 6.84171 1.95118 7.15829 2.14645 7.35355Z"
            />
          {/if}
        </svg>
      </button>
    </div>
  </svelte:element>
  <div class="expander-content-anchor">
    <div class="expander-content" bind:this={contentElement}>
      <slot name="content" />
    </div>
  </div>
</div>

<style>
  .expander {
    border-radius: var(--fds-control-corner-radius);
    color: var(--fds-text-primary);
    display: flex;
    flex-direction: column;
    inline-size: 100%;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  .expander.direction-down .expander-content {
    -webkit-border-before: none;
    border-block-start: none;
    border-radius: var(--fds-control-corner-radius);
    border-start-end-radius: 0;
    border-start-start-radius: 0;
    transform: translateY(-100%);
  }
  .expander.direction-down.expanded .expander-header {
    border-end-end-radius: 0;
    border-end-start-radius: 0;
    border-radius: var(--fds-control-corner-radius);
  }
  .expander.direction-up .expander-content {
    border-bottom: none;
    border-end-end-radius: 0;
    border-end-start-radius: 0;
    border-radius: var(--fds-control-corner-radius);
    transform: translateY(100%);
  }
  .expander.direction-up .expander-content-anchor {
    order: -1;
  }
  .expander.direction-up.expanded .expander-header {
    border-radius: var(--fds-control-corner-radius);
    border-start-end-radius: 0;
    border-start-start-radius: 0;
  }
  .expander.expanded .expander-content {
    transform: none;
    transition: var(--fds-control-slow-duration)
      var(--fds-control-fast-out-slow-in-easing) transform;
  }
  .expander.expanded .expander-content-anchor {
    max-block-size: 6.019999999999999e23vmax;
    transition: none;
  }
  .expander.expanded .expander-chevron svg {
    transform: rotate(180deg);
  }
  .expander > h3 {
    display: contents;
  }
  .expander-icon {
    -webkit-margin-end: 16px;
    block-size: 16px;
    color: var(--fds-text-primary);
    flex: 0 0 auto;
    inline-size: 16px;
    margin-inline-end: 16px;
  }
  .expander-icon > :global(svg) {
    fill: currentColor;
    block-size: auto;
    inline-size: 16px;
  }
  .expander-header {
    -webkit-padding-start: 16px;
    align-items: center;
    background-clip: padding-box;
    background-color: var(--fds-card-background-default);
    border: 1px solid var(--fds-card-stroke-default);
    border-radius: var(--fds-control-corner-radius);
    box-sizing: border-box;
    display: flex;
    font-family: var(--fds-font-family-text);
    font-size: var(--fds-body-font-size);
    font-weight: 400;
    line-height: 20px;
    outline: none;
    padding: 8px;
    padding-inline-start: 16px;
    text-align: start;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  .expander-header-title {
    flex: 1 1 auto;
  }
  .expander-header:focus-visible {
    box-shadow: var(--fds-focus-stroke);
  }
  .expander-header:hover .expander-chevron {
    background-color: var(--fds-subtle-fill-secondary);
  }
  .expander-header:active .expander-chevron {
    background-color: var(--fds-subtle-fill-tertiary);
    color: var(--fds-text-secondary);
  }
  .expander-chevron {
    -webkit-margin-start: 20px;
    align-items: center;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-color: var(--fds-subtle-fill-transparent);
    block-size: 32px;
    border: none;
    border-radius: var(--fds-control-corner-radius);
    color: var(--fds-text-primary);
    display: flex;
    flex: 0 0 auto;
    inline-size: 32px;
    justify-content: center;
    margin-inline-start: 20px;
    outline: none;
  }
  .expander-chevron:focus-visible {
    box-shadow: var(--fds-focus-stroke);
  }
  .expander-chevron svg {
    fill: currentColor;
    block-size: 12px;
    inline-size: 12px;
    transition: calc(var(--fds-control-faster-duration) * 1.2) linear transform
      var(--fds-control-faster-duration);
  }
  .expander-content {
    background-clip: padding-box;
    background-color: var(--fds-card-background-secondary);
    border: 1px solid var(--fds-card-stroke-default);
    font-family: var(--fds-font-family-text);
    font-size: var(--fds-body-font-size);
    font-weight: 400;
    line-height: 20px;
    padding-right: 8px;
    transition: var(--fds-control-fast-duration) cubic-bezier(1, 1, 0, 1)
      transform;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  .expander-content-anchor {
    max-height: 0;
    overflow: hidden;
    position: relative;
    transition: 0ms linear var(--fds-control-slow-duration) max-height;
  }
</style>
