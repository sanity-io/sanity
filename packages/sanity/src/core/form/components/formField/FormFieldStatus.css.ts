import {style} from '@vanilla-extract/css'

export const root = style({
  display: 'flex',
  justifyContent: 'flex-end',
  boxSizing: 'border-box',
  minHeight: 'var(--avatar-height)',
  width: '77px',
  marginLeft: 'var(--small-padding)',
  selectors: {
    "&[data-max-avatars='1']": {
      maxWidth: '23px',
    },
    "&[data-position='top']": {
      alignSelf: 'flex-start',
    },
    "&[data-position='bottom']": {
      alignSelf: 'flex-end',
    },
  },
})
