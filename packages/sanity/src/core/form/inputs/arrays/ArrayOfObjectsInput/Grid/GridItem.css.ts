import {style} from '@vanilla-extract/css'

export const previewCard = style({
  'height': '100%',
  'position': 'relative',
  'selectors': {
    // `&&`: Card sets `border-radius` itself (radius prop, default 0)
    '&&': {
      borderTopRightRadius: 'inherit',
      borderTopLeftRadius: 'inherit',
    },
    // (0,3,0) beats Card's `&[data-as='button']` box-shadow rule (0,2,0)
    '&:focus:focus-visible': {
      boxShadow: '0 0 0 2px var(--card-focus-ring-color)',
    },
  },
  '@media': {
    '(hover: hover)': {
      selectors: {
        '&:hover': {
          filter: 'brightness(95%)',
        },
      },
    },
  },
})
