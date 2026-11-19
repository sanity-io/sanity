/**
 * The inventory's selection colours: a blue selection ladder on the `@sanity/ui` 5 palette. Studio
 * loads UI 5's stylesheet (`ui5/styles.css`), which declares these variables on `:root`, and each
 * `light-dark()` pair resolves from the colour scheme. Nothing here is picked by hand: each value is
 * a UI 5 palette step or semantic token. The selected blue names the blue primitives directly: UI 5
 * moved its `--active-*` tokens from blue to grey in 5.0.0-alpha.24, and Studio keeps the blue, at
 * the steps those tokens used up to alpha.23.
 *
 * @internal
 */
export const SELECTION = {
  /** The open version's row: the strong selected blue (blue-600 / blue-400). */
  openBackground: 'light-dark(var(--blue-600), var(--blue-400))',
  /** Its title: white / black on that blue. */
  openTitle: 'light-dark(var(--white), var(--black))',
  /** Its subtitle: a blue tint of the title colour, the low-emphasis selected foreground step. */
  openSubtitle: 'light-dark(var(--blue-100), var(--blue-900))',
  /** A checked row: the pale selected blue (blue-50 / blue-950). */
  checkedBackground: 'light-dark(var(--blue-50), var(--blue-950))',
  /**
   * A checked group header: two steps stronger than its checked rows (blue-200 / blue-800), so it
   * stays visibly a header when the whole group is checked. One step (blue-100 / blue-900) measured
   * only 1.10:1 against the rows.
   */
  checkedHeaderBackground: 'light-dark(var(--blue-200), var(--blue-800))',
  /**
   * A hovered row: `--background-low` (gray-50) in light. In dark that token is gray-950, the
   * panel's own background, so hover would not show: dark takes the next step, gray-900.
   */
  hoverBackground: 'light-dark(var(--gray-50), var(--gray-900))',
  /**
   * A hovered group header, which is already a low band (gray-50 in light): `--background-high`
   * (gray-100) in light. In dark that token is gray-900, about the header band itself, so dark takes
   * the next step, gray-800.
   */
  headerHoverBackground: 'light-dark(var(--gray-100), var(--gray-800))',
  /** A checked box: the strong selected blue with an inverted tick, as the open row. */
  checkboxFill: 'light-dark(var(--blue-600), var(--blue-400))',
  checkboxTick: 'light-dark(var(--white), var(--black))',
} as const
