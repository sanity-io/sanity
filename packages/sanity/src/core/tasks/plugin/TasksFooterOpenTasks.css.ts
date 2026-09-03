import {globalStyle, style} from '@vanilla-extract/css'

export const buttonContainer = style({
  position: 'relative',
})

globalStyle(`${buttonContainer} [data-ui='Badge']`, {
  position: 'absolute',
  top: '-2px',
  right: '-2px',
})
