/**
 * The number of columns a `layout: 'grid'` array renders at when `options.columns`
 * is not set. Chosen so the default stays exactly what it has always been: the
 * responsive ramp below expands `4` to `[2, 3, 4]`.
 */
export const DEFAULT_GRID_COLUMNS = 4

/**
 * Resolves `options.columns` to a Sanity UI responsive `gridTemplateColumns` value.
 *
 * The requested count applies at the widest breakpoint and steps down on narrower
 * ones, so a wide grid stays usable on small screens rather than producing columns
 * too thin to read. The ramp never exceeds the requested count, so asking for fewer
 * columns than the default is honoured at every breakpoint (`2` -> `[2, 2, 2]`).
 *
 * Non-finite, zero and negative values fall back to the default rather than
 * producing an invalid grid — `columns` comes from userland schema config.
 */
export function resolveGridTemplateColumns(columns: number | undefined): number[] {
  const requested =
    typeof columns === 'number' && Number.isFinite(columns) && columns >= 1
      ? Math.floor(columns)
      : DEFAULT_GRID_COLUMNS

  return [Math.min(2, requested), Math.min(3, requested), requested]
}
