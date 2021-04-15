// todo: get these utils from @sanity/ui instead
export function focusRingBorderStyle(border: {color: string; width: number}): string {
  return `inset 0 0 0 ${border.width}px ${border.color}`
}

export function focusRingStyle(opts: {
  base?: {bg: string}
  border?: {color: string; width: number}
  focusRing: {offset: number; width: number}
}): string {
  const {base, border, focusRing} = opts
  const focusRingOutsetWidth = focusRing.offset + focusRing.width
  const focusRingInsetWidth = 0 - focusRing.offset
  const bgColor = base ? base.bg : 'var(--card-bg-color)'

  return [
    focusRingInsetWidth > 0 && `inset 0 0 0 ${focusRingInsetWidth}px var(--card-focus-ring-color)`,
    border && focusRingBorderStyle(border),
    focusRingInsetWidth < 0 && `0 0 0 ${0 - focusRingInsetWidth}px ${bgColor}`,
    focusRingOutsetWidth > 0 && `0 0 0 ${focusRingOutsetWidth}px var(--card-focus-ring-color)`,
  ]
    .filter(Boolean)
    .join(',')
}
