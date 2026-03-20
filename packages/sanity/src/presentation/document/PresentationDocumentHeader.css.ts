import {createVar, style} from '@vanilla-extract/css'

export const gapVar = createVar()
export const minHeightVar = createVar()
export const marginBottomVar = createVar()

export const locationStack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: gapVar,
  minHeight: minHeightVar,
  marginBottom: marginBottomVar,
  selectors: {
    '&:empty': {
      display: 'none',
    },
  },
})
