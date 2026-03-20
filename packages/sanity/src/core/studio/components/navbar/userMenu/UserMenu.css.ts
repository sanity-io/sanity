import {createVar, style} from '@vanilla-extract/css'

export const styledMenu = style({
  selectors: {
    '&&': {
      minWidth: '200px',
      maxWidth: '300px',
    },
  },
})

export const avatarSizeVar = createVar()

export const avatarBox = style({
  selectors: {
    '&&': {
      position: 'relative',
      minWidth: avatarSizeVar,
      minHeight: avatarSizeVar,
    },
  },
})
