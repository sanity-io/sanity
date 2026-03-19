export interface StrokeColorOptions {
  focused: boolean
  hovered: boolean
  focusRingColor: string
}

export function getCropStrokeColor(opts: StrokeColorOptions): string {
  if (opts.focused) return opts.focusRingColor
  if (opts.hovered) return 'rgba(255, 255, 255, 1)'
  return 'rgba(255, 255, 255, .5)'
}

export function getHotspotStrokeColor(opts: StrokeColorOptions): string {
  if (opts.focused) return opts.focusRingColor
  if (opts.hovered) return 'rgba(255, 255, 255, 1)'
  return 'rgba(255, 255, 255, .5)'
}

export function getHandleStrokeColor(
  opts: Pick<StrokeColorOptions, 'focused' | 'focusRingColor'>,
): string {
  if (opts.focused) return opts.focusRingColor
  return '#000'
}
