import {createVar, style} from '@vanilla-extract/css'

/** `${role}-document`, the `grid-area` of the pane inside `DialogLayout` */
export const gridAreaVar = createVar()

export const diffViewPaneLayout = style({
  position: 'relative',
  gridArea: gridAreaVar,
})

export const container = style({
  selectors: {
    // Container sets `width` on itself
    '&&': {
      width: 'auto',
    },
  },
})
