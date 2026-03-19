import {globalStyle, styleVariants} from '@vanilla-extract/css'

export const media = styleVariants({
  small: {
    width: '25px',
    height: '25px',
    borderRadius: '0.25rem',
    padding: '0',
  },
  large: {
    width: '41px',
    height: '41px',
    borderRadius: '0.25rem',
    padding: '0',
  },
})

globalStyle(`.${media.small} svg, .${media.large} svg`, {
  width: '100%',
  height: '100%',
  borderRadius: 'inherit',
})
