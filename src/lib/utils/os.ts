import type { OsType } from "@tauri-apps/plugin-os";

export let osType: OsType | undefined;

if (typeof window !== "undefined") {
  import("@tauri-apps/plugin-os").then((module) => {
    osType = module.type();
  });
}
