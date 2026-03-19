import {style} from '@vanilla-extract/css'

export const fillHeight = style({
  vars: {
    '--card-border-color': 'transparent',
  },
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
})
