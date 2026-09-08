/**
 * Categorical palette for multi-branch comparison. Hues and their fixed
 * CVD-safe order come from the dataviz skill's validated reference palette
 * (worst adjacent ΔE 24.2 light / 10.3 dark; the ordering IS the safety
 * mechanism — do not reorder). Single-branch charts don't use this; they
 * stay on the studio accent (see TrendChart COLOR).
 *
 * Branches always carry a direct-labelled legend, which satisfies the
 * "relief required" clause for the few slots below 3:1 contrast.
 */
const LIGHT = [
  '#2a78d6', // blue
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
  '#e87ba4', // magenta
  '#eb6834', // orange
]

const DARK = [
  '#3987e5',
  '#199e70',
  '#c98500',
  '#008300',
  '#9085e9',
  '#e66767',
  '#d55181',
  '#d95926',
]

/**
 * Detect the active studio color scheme once, from the resolved background.
 * The studio sets `color-scheme` on the root; fall back to the media query.
 */
function isDarkScheme(): boolean {
  if (typeof window === 'undefined') return false
  const scheme = getComputedStyle(document.documentElement).colorScheme
  if (scheme.includes('dark') && !scheme.includes('light')) return true
  if (scheme.includes('light') && !scheme.includes('dark')) return false
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

/** Stable color for a categorical slot; assigned in fixed order, never cycled. */
export function categoricalColor(index: number): string {
  const ramp = isDarkScheme() ? DARK : LIGHT
  // Past 8 series the palette guidance says fold into "Other" — we cap the
  // branch selector well below that, so a modulo here is only a safety net
  return ramp[index % ramp.length]
}

export const MAX_COMPARE_BRANCHES = 6
