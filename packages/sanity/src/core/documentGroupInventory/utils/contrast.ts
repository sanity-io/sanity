/**
 * Small colour helpers for styles that must meet a WCAG contrast ratio in every theme. They work on
 * the theme's resolved colours (`#rrggbb`, `rgb()`/`rgba()` or a computed `color(srgb …)`).
 */

type Rgb = [number, number, number]

/**
 * @internal
 */
export function parseColor(value: string): Rgb | undefined {
  const hex = /^#([0-9a-f]{6})$/i.exec(value.trim())
  if (hex) {
    const n = Number.parseInt(hex[1], 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(value.trim())
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  // How browsers serialise a computed `color-mix(in srgb, …)`
  const srgb = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i.exec(value.trim())
  if (srgb) return [Number(srgb[1]) * 255, Number(srgb[2]) * 255, Number(srgb[3]) * 255]
  return undefined
}

function channel(value: number): number {
  const c = value / 255
  return c <= 0.039_28 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance([r, g, b]: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/**
 * The WCAG contrast ratio between two colours.
 *
 * @internal
 */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].toSorted((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

function mix(a: Rgb, b: Rgb, amountOfA: number): Rgb {
  return [0, 1, 2].map((i) => Math.round(a[i] * amountOfA + b[i] * (1 - amountOfA))) as Rgb
}

function toHex(rgb: Rgb): string {
  return `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

/**
 * The quietest mix of `fg` into `bg` that still reaches `ratio` against `bg`: a colour as close to
 * the background as the contrast rule allows. Falls back to `fg` when either colour can't be read.
 *
 * @internal
 */
export function mixToContrast(fg: string, bg: string, ratio: number): string {
  const fgRgb = parseColor(fg)
  const bgRgb = parseColor(bg)
  if (!fgRgb || !bgRgb || contrastRatio(fgRgb, bgRgb) < ratio) return fg

  for (let step = 0; step <= 100; step++) {
    const candidate = mix(fgRgb, bgRgb, step / 100)
    if (contrastRatio(candidate, bgRgb) >= ratio) return toHex(candidate)
  }
  return fg
}

/**
 * `amountOfA` (0–1) of `a` mixed into `b`, as `color-mix(in srgb, a x%, b)` would. Falls back to `b`
 * when either colour can't be read.
 *
 * @internal
 */
export function mixColors(a: string, b: string, amountOfA: number): string {
  const aRgb = parseColor(a)
  const bRgb = parseColor(b)
  if (!aRgb || !bRgb) return b
  return toHex(mix(aRgb, bRgb, amountOfA))
}
