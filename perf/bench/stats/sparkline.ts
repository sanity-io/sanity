const BLOCKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'] as const

/**
 * Render a series as a unicode sparkline, scaled to `max` (defaults to the
 * series peak). Used by settle mode's terminal output to chart per-poll
 * activity (commits/s, CPU) over the session window.
 */
export function sparkline(values: number[], max?: number): string {
  if (values.length === 0) return ''
  const peak = max ?? Math.max(...values)
  if (peak <= 0) return BLOCKS[0].repeat(values.length)
  return values
    .map((value) => {
      const index = Math.round((Math.max(0, value) / peak) * (BLOCKS.length - 1))
      return BLOCKS[Math.min(BLOCKS.length - 1, index)]
    })
    .join('')
}
