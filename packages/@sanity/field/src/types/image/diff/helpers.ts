// @todo: use `polished` for this?
export function hexToRgba(hex: string, opacity: number): string {
  const rgba = (/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex) || ([] as string[]))
    .slice(1)
    .map((num) => parseInt(num, 16))
    .concat(opacity)
  return `rgba(${rgba.join(', ')})`
}

// @todo: replace this
export function simpleHash(str: string): string {
  let hash = 0

  if (str.length == 0) {
    return hash.toString()
  }

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)

    // eslint-disable-next-line no-bitwise
    hash = (hash << 5) - hash + char

    // eslint-disable-next-line no-bitwise
    hash &= hash // Convert to 32bit integer
  }

  return hash.toString()
}

export function getDeviceDpr(): number {
  const base = Math.ceil(window.devicePixelRatio || 1)
  return Math.min(3, Math.max(1, base))
}
