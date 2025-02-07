export function adjustBrightness(
  color: string,
  brightnessPercent: number,
  contrastPercent?: number
): string {
  if (!color || color.trim() === "") {
    return "";
  }

  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!rgbMatch) {
    throw new Error("Invalid RGB format. Expected rgb(r, g, b)");
  }

  let r = parseInt(rgbMatch[1], 10);
  let g = parseInt(rgbMatch[2], 10);
  let b = parseInt(rgbMatch[3], 10);

  const brightnessMultiplier = 1 + brightnessPercent / 100;
  r = Math.round(r * brightnessMultiplier);
  g = Math.round(g * brightnessMultiplier);
  b = Math.round(b * brightnessMultiplier);

  if (contrastPercent !== undefined) {
    const contrastFactor = Math.max(0, Math.min(contrastPercent, 100)) / 100;
    r = Math.round(r + (255 - r) * contrastFactor);
    g = Math.round(g + (255 - g) * contrastFactor);
    b = Math.round(b + (255 - b) * contrastFactor);
  }

  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  return `rgb(${r}, ${g}, ${b})`;
}
