import {style} from '@vanilla-extract/css'

// Button only sets `width` when `width="fill"` is passed, which TitleButton does not.
export const titleButton = style({
  width: '100%',
  maxWidth: '100%',
})

export const taskDetailsRoot = style({
  /* Checkbox width is 17px and first row gap is 12px. */
  marginLeft: '29px',
})
