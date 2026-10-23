import {css} from '#styled-system/css'

/** `${role}-document`, the `grid-area` of the pane inside `DialogLayout` */
export const gridAreaVar = '--diff-view-pane-grid-area'

export const diffViewPaneLayout = css({
  position: 'relative',
  gridArea: `var(${gridAreaVar})`,
})

export const container = css({
  // Container sets `width` on itself
  '&&': {
    width: 'auto',
  },
})
