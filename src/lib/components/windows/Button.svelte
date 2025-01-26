<button
  on:click
  {...$$props}
  class={`inline-flex cursor-default items-center justify-center bg-sky-100 ${$$props.class}`}
>
  <slot />
</button>
