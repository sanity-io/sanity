import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const ratioPaddingBottomVar = createVar()
export const ratioInnerPaddingVar = createVar()

export const ratioBox = style({
  selectors: {
    '&&': {
      position: 'relative',
      paddingBottom: ratioPaddingBottomVar,
    },
  },
})

globalStyle(`${ratioBox} > div`, {
  position: 'absolute',
  top: ratioInnerPaddingVar,
  left: ratioInnerPaddingVar,
  right: ratioInnerPaddingVar,
  bottom: ratioInnerPaddingVar,
})
