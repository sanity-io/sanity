import {globalStyle, style, styleVariants} from '@vanilla-extract/css'

export const media = style({
  borderRadius: '0.25rem',
  padding: 0,
})

export const mediaSize = styleVariants({
  small: {
    width: '25px',
    height: '25px',
  },
  large: {
    width: '41px',
    height: '41px',
  },
})

// The svg is rendered by the workspace's icon component, so it is targeted from the root.
globalStyle(`${media} svg`, {
  width: '100%',
  height: '100%',
  borderRadius: 'inherit',
})
