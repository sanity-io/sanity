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
