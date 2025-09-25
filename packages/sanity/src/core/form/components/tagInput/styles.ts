import {vars} from '@sanity/ui/css'

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
  const bgColor = base ? base.bg : vars.color.bg

  return [
    focusRingInsetWidth > 0 && `inset 0 0 0 ${focusRingInsetWidth}px ${vars.color.focusRing}`,
    border && focusRingBorderStyle(border),
    focusRingInsetWidth < 0 && `0 0 0 ${0 - focusRingInsetWidth}px ${bgColor}`,
    focusRingOutsetWidth > 0 && `0 0 0 ${focusRingOutsetWidth}px ${vars.color.focusRing}`,
  ]
    .filter(Boolean)
    .join(',')
}
