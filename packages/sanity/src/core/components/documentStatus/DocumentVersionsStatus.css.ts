import {style} from '@vanilla-extract/css'

export const titleStack = style({
  minWidth: 0,
  width: '100%',
})

/** No longer used by the tooltip (it shows no dates); kept for the hosts that style a version's date with it. */
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
