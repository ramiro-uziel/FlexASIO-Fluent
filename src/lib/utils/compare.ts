import type { Config } from "$lib/types";

export function compareConfigs(
  current: Partial<Config>,
  original: Config | null
): boolean {
  if (!original) return false;

  const compareObjects = (obj1: any, obj2: any): boolean => {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (typeof obj1[key] === "object" && obj1[key] !== null) {
        if (!compareObjects(obj1[key], obj2[key])) return false;
      } else if (obj1[key] !== obj2[key]) {
        return false;
      }
    }

    return true;
  };

  return (
    current.backend === original.backend &&
    current.bufferSizeSamples === original.bufferSizeSamples &&
    compareObjects(current.input, original.input) &&
    compareObjects(current.output, original.output)
  );
}
