export function getPresenceOverlayPosition(options: {
  presenceTop: number
  presenceBottom: number
  scrollportTop: number
  scrollportBottom: number
}): 'top' | 'bottom' | 'inside' {
  if (options.presenceBottom <= options.scrollportTop) return 'top'
  if (options.presenceTop >= options.scrollportBottom) return 'bottom'
  return 'inside'
}
