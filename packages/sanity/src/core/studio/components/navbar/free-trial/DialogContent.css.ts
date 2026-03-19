import {style, globalStyle} from '@vanilla-extract/css'

export const styledButton = style({
  selectors: {
    '&&': {
      position: 'absolute',
      top: '12px',
      right: '12px',
      zIndex: 20,
      background: 'transparent',
      borderRadius: '9999px',
      boxShadow: 'none',
      color: 'white',
    },
  },
  vars: {
    '--card-fg-color': 'white',
  },
})

globalStyle(`.${styledButton}:hover`, {
  vars: {
    '--card-fg-color': 'white',
  },
})

export const image = style({
  objectFit: 'cover',
  width: '100%',
  height: '196px',
})

export const styledDialog = style({})

globalStyle(`.${styledDialog} > [data-ui='DialogCard']`, {
  maxWidth: '22.5rem',
})
