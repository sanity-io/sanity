import {style} from '@vanilla-extract/css'

export const previewCard = style({
  selectors: {
    '&&': {
      borderTopRightRadius: 'inherit',
      borderTopLeftRadius: 'inherit',
      height: '100%',
      position: 'relative',
    },
    '&&:focus:focus-visible': {
      boxShadow: '0 0 0 2px var(--card-focus-ring-color)',
    },
  },
  '@media': {
    '(hover: hover)': {
      selectors: {
        '&&:hover': {
          filter: 'brightness(95%)',
        },
      },
    },
  },
})
