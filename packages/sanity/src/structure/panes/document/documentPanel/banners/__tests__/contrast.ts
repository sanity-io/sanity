/** Whether a computed CSS colour paints nothing. */
export function isTransparent(color: string): boolean {
  return color === 'transparent' || /rgba\(.*,\s*0\)$/.test(color)
}

/** The first non-transparent background colour at or above an element. */
export function backgroundBehind(element: Element): string {
  for (let node: Element | null = element; node; node = node.parentElement) {
    const color = getComputedStyle(node).backgroundColor
    if (color && !isTransparent(color)) return color
  }
  return 'rgb(255, 255, 255)'
}

function luminance(color: string): number {
  const context = document.createElement('canvas').getContext('2d')
  if (!context) throw new Error('No 2D canvas context')
  context.fillStyle = color
  context.fillRect(0, 0, 1, 1)
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** The WCAG contrast ratio of two CSS colours. */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}
