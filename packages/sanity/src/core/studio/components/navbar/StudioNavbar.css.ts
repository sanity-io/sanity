import {style} from '@vanilla-extract/css'

export const rootLayer = style({
  minHeight: 'auto',
  position: 'relative',
  selectors: {
    // (0,2,0) already beats Layer's own `position: relative`
    "&[data-search-open='true']": {
      top: 0,
      position: 'sticky',
    },
  },
})

export const rootCard = style({
  lineHeight: 0,
})

export const navGrid = style({
  // Allow the tools column to shrink below its content so CollapseTabList can collapse into the overflow menu.
  'gridTemplateColumns': 'auto minmax(0, 1fr) auto',
  '@media': {
    // media[4]
    'screen and (min-width: 1800px)': {
      gridTemplateColumns: '1fr auto 1fr',
    },
  },
})
