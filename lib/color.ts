/**
 * Returns true if black text provides better contrast on the given hex color.
 * Mirrors CRM `shouldUseBlackText` helper.
 */
export function shouldUseBlackText(hexColor: string) {
  const r = parseInt(hexColor.substring(1, 3), 16) / 255;
  const g = parseInt(hexColor.substring(3, 5), 16) / 255;
  const b = parseInt(hexColor.substring(5, 7), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const threshold = 0.8;
  return luminance > threshold;
}

/** Pick white or black text given a background color. */
export function pickBadgeTextColor(bgHex: string): string {
  return shouldUseBlackText(bgHex) ? 'black' : 'white';
}

/**
 * Build a linear gradient that minimizes the transition width between colors,
 * creating a near-instant switch with a tiny anti-aliased crossfade.
 */
export function buildTightLinearGradient(colors: string[]): string {
  if (!colors.length) { return ''; }
  if (colors.length === 1) { return colors[0]; }
  const n = colors.length;
  const stops: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const start = (i * 100) / n;
    const end = ((i + 1) * 100) / n;
    const segment = end - start;
    const epsilon = Math.min(1, segment * 0.2); // very tight blend zone
    if (i === 0) {
      stops.push(`${colors[i]} ${start.toFixed(2)}%`);
    }
    stops.push(`${colors[i]} ${(end - epsilon).toFixed(2)}%`);
    if (i < n - 1) {
      stops.push(`${colors[i + 1]} ${(end + epsilon).toFixed(2)}%`);
    } else {
      stops.push(`${colors[i]} 100%`);
    }
  }
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}


