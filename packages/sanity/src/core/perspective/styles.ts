import {css} from 'styled-components'

/**
 * A CSS helper that extends the clickable area of a component by adding a pseudo-element.
 * This creates a larger hit area for better usability without affecting the visual size.
 */
export const oversizedButtonStyle = css`
  position: relative;
  cursor: default;
  &::before {
    content: '';
    position: absolute;
    display: block;
    inset: -4px;
    border-radius: 9999px;
  }
`

/**
 * Custom property carrying the height of whatever a perspective menu keeps pinned
 * at its top.
 *
 * Sticky offsets resolve against the nearest scrolling ancestor, which for these
 * menus is the popover rather than the panel — the same edge the pinned block
 * already occupies, at a higher stacking order. So a section heading at `top: 0`
 * pins underneath that block and disappears; it needs this height as its offset
 * instead.
 *
 * The value is measured at runtime rather than declared, because the block is a
 * different height in different workspaces. A menu that pins nothing above its
 * headings never sets it, and the `0px` fallback is then already correct.
 */
export const MENU_PINNED_BLOCK_HEIGHT_VAR = '--sanity-perspective-menu-pinned-height'

/**
 * Pins a menu section heading below the menu's pinned top block.
 *
 * The background is opaque so rows pass under the heading rather than through it.
 * Each heading is scoped to its own section, so it holds only while that section
 * is on screen and the next heading pushes it out.
 */
export const stickyMenuHeadingStyle = css`
  position: sticky;
  top: var(${MENU_PINNED_BLOCK_HEIGHT_VAR}, 0px);
  z-index: 1;
  background: var(--card-bg-color);
`

/**
 * Insets a perspective menu's action row so its icon's ink lands in the column the rows above it
 * establish.
 *
 * Both menus need this and neither can use the other's number, so what is shared is the mechanism
 * and the reasoning rather than the value.
 *
 * **Why an override at all.** The shared `ui-components/MenuItem` hardcodes its left inset to a
 * scale step and applies it to an inner `Box`, so a `style` on the item stacks with it instead of
 * replacing it. This selector reaches the box that actually carries the padding.
 *
 * **Why the value is off the 4px scale.** Icons align on ink, not on boxes. `@sanity/icons` glyphs
 * fill 0.56-0.60 of their box; a small release avatar's dot fills 0.28 and the temporary rhombi
 * 0.32-0.37. Equal boxes therefore read as a ragged column, and the correction is whatever puts the
 * ink in line - which lands between scale steps.
 *
 * **The two values, so a change to one is visibly a change to only one:**
 *
 * | Menu | Action icons | Inset | Resulting ink | Aligned against |
 * | --- | --- | --- | --- | --- |
 * | Release | calendar, add (21px box, 11.8-12.6px ink) | 11px | 13.2-13.6px | dots 14.0-14.6px, release icons 12.6px |
 * | Variant | outlined rhombus (33px box, 12.2px ink) | 9.5px | 12.9px | rows 12.9px outlined, 13.6px filled |
 *
 * Re-measure both rows of that table when either changes - see the sibling-surfaces rule. A value
 * tuned against one fixture in one menu has repeatedly turned out to be wrong in the other.
 */
export const menuActionIconInsetStyle = (inset: string) => css`
  [data-ui='MenuItem'] > [data-ui='Box'] {
    padding-left: ${inset};
  }
`
