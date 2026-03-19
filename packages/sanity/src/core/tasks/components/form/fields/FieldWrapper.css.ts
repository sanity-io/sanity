import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const fontWeightVar = createVar()

export const fieldWrapperRoot = style({})

// Reset the padding of the field header content box
globalStyle(`${fieldWrapperRoot} [data-ui='fieldHeaderContentBox']`, {
  padding: 0,
})

globalStyle(`${fieldWrapperRoot} [data-ui='fieldHeaderContentBox'] label`, {
  fontWeight: fontWeightVar,
})
