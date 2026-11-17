import {css} from '#styled-system/css'

/**
 * A 1px rule between two groups of a menu. It sits inside a group that is padded 8px across
 * (the menu's inset), so it starts and ends where the rows do instead of running edge to edge.
 *
 * The group's 4px vertical padding is the space on the rule's far side. The margins move the
 * rule into that padding, flush with the group's edge, where a border would sit: the next group's
 * own 4px padding then gives 4px on the near side. The group keeps its layout, as with a border.
 */
export const menuSectionDivider = css({
  flexShrink: 0,
  height: '1px',
  backgroundColor: 'var(--card-border-color)',
})

/** At the end of its group: 4px below the rows, then the group's edge. */
export const menuSectionDividerEnd = css({
  marginTop: '4px',
  marginBottom: '-4px',
})

/** At the start of its group: the group's edge, then 4px above the rows. */
export const menuSectionDividerStart = css({
  marginTop: '-4px',
  marginBottom: '4px',
})
