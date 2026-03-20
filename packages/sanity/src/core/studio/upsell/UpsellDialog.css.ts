 
import {createVar, style} from '@vanilla-extract/css'

export const topVar = createVar()
export const rightVar = createVar()

export const styledButton = style({
  position: 'absolute',
  top: topVar,
  right: rightVar,
  zIndex: 20,
  background: 'transparent',
  borderRadius: '9999px',
  boxShadow: 'none',
  vars: {
    '--card-fg-color': 'white',
  },
  selectors: {
    '&:hover': {
      vars: {
        '--card-fg-color': 'white',
      },
    },
  },
})

export const image = style({
  objectFit: 'cover',
  width: '100%',
  height: '200px',
})
