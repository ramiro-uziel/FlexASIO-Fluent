declare module "*.svg?component" {
  import type { ComponentType, SvelteComponentTyped } from "svelte";
  import type { SVGAttributes } from "svelte/elements";

  const content: ComponentType<
    SvelteComponentTyped<SVGAttributes<SVGSVGElement>>
  >;

  export default content;
}
