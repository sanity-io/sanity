import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const revertErrorColorVar = createVar()

export const root = style({})

globalStyle(`.${root} [data-ui='Text']`, {
  fontWeight: 'normal',
})

globalStyle(`.${root} div[data-ui='Box']`, {
  display: 'none',
})

globalStyle(`.${root}:not([data-disabled='true']):hover, .${root}:not([data-disabled='true']):focus`, {
  // @ts-expect-error custom properties
  '--card-fg-color': revertErrorColorVar,
  '--card-bg-color': 'transparent',
  '--card-border-color': 'transparent',
})

globalStyle(`.${root}:not([data-disabled='true']):hover div[data-ui='Box'], .${root}:not([data-disabled='true']):focus div[data-ui='Box']`, {
  display: 'block',
})
