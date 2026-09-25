import {style} from '@vanilla-extract/css'

/**
 * `_responsive(media, direction, ...)` expanded for the only direction the panel passes,
 * `['column', 'column', layout === 'horizontal' ? 'row' : 'column']`. The `media[0]` step repeats
 * the base (column) values, so only the `media[1]` step of the horizontal layout differs.
 */
export const image = style({
  objectFit: 'cover',
  width: '100%',
  height: '180px',
})

export const imageHorizontal = style({
  '@media': {
    // media[1]
    'screen and (min-width: 600px)': {
      width: '50%',
      height: 'auto',
    },
  },
})

export const descriptionRoot = style({
  margin: 'auto 0',
})
