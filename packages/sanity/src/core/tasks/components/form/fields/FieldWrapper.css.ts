import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `font.text.weights.regular` */
export const fontTextWeightRegularVar = createVar()

export const fieldWrapperRoot = style({})

// Reset the padding of the field header content box
globalStyle(`${fieldWrapperRoot} [data-ui='fieldHeaderContentBox']`, {
  padding: 0,
})

globalStyle(`${fieldWrapperRoot} [data-ui='fieldHeaderContentBox'] label`, {
  fontWeight: fontTextWeightRegularVar,
})
