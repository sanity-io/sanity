/**
 * The inventory's selection colours: the `@sanity/ui` 5 blue selection ladder. Studio loads UI 5's
 * stylesheet (`ui5/styles.css`), which declares these variables on `:root` and resolves each
 * `light-dark()` pair from the colour scheme. Nothing here is picked by hand: each value is a UI 5
 * semantic token, or the palette steps a UI 5 token is built from where it has no variable of its
 * own outside a component.
 *
 * @internal
 */
export const SELECTION = {
  /** The open version's row: `--active-background-emphasized` (blue-600 / blue-400). */
  openBackground: 'var(--active-background-emphasized)',
  /** Its title: `--active-foreground-emphasized` (white / black). */
  openTitle: 'var(--active-foreground-emphasized)',
  /** Its subtitle: a blue tint of the title colour, the low-emphasis selected foreground step. */
  openSubtitle: 'light-dark(var(--blue-100), var(--blue-900))',
  /** A checked row: `--active-background-normal` (blue-50 / blue-950). */
  checkedBackground: 'var(--active-background-normal)',
  /** A checked group header: one step stronger than its checked rows (blue-100 / blue-900). */
  checkedHeaderBackground: 'light-dark(var(--blue-100), var(--blue-900))',
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
  /** A checked box: UI 5's checkbox fill and tick (`--active-background-emphasized` / `-foreground-`). */
  checkboxFill: 'var(--active-background-emphasized)',
  checkboxTick: 'var(--active-foreground-emphasized)',
} as const
