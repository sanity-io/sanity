import {style} from '@vanilla-extract/css'

export const titleStack = style({
  minWidth: 0,
  width: '100%',
})

export const updatedAtText = style({
  flex: 'none',
  whiteSpace: 'nowrap',
})

export const versionStatusItem = style({
  selectors: {
    '&&': {
      padding: '2px 0',
    },
  },
})
