export function adjustBrightness(
  color: string,
  brightnessPercent: number,
  contrastPercent?: number
): string {
  // Parse the color
  const rgb = parseInt(color.slice(1), 16);
  let r = (rgb >> 16) & 0xff;
  let g = (rgb >> 8) & 0xff;
  let b = rgb & 0xff;

  // Adjust brightness
  const brightnessMultiplier = 1 + brightnessPercent / 100;
  r = Math.round(r * brightnessMultiplier);
  g = Math.round(g * brightnessMultiplier);
  b = Math.round(b * brightnessMultiplier);

  // Adjust contrast if provided
  if (contrastPercent !== undefined) {
    const contrastFactor = (100 + contrastPercent) / 100;
    r = Math.round((r - 128) * contrastFactor + 128);
    g = Math.round((g - 128) * contrastFactor + 128);
    b = Math.round((b - 128) * contrastFactor + 128);
  }

  // Clamp values between 0 and 255
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  // Convert back to hex string
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
