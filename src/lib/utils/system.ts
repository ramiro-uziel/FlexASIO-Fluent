export function adjustBrightness(
  color: string,
  brightnessPercent: number,
  contrastPercent?: number
): string {
  const rgb = parseInt(color.slice(1), 16);
  let r = (rgb >> 16) & 0xff;
  let g = (rgb >> 8) & 0xff;
  let b = rgb & 0xff;

  const brightnessMultiplier = 1 + brightnessPercent / 100;
  r = Math.round(r * brightnessMultiplier);
  g = Math.round(g * brightnessMultiplier);
  b = Math.round(b * brightnessMultiplier);

  if (contrastPercent !== undefined) {
    const contrastFactor = (100 + contrastPercent) / 100;
    r = Math.round((r - 128) * contrastFactor + 128);
    g = Math.round((g - 128) * contrastFactor + 128);
    b = Math.round((b - 128) * contrastFactor + 128);
  }

  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
