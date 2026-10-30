import {css} from '#styled-system/css'

/**
 * `_responsive(media, direction, ...)` expanded for the only direction the panel passes,
 * `['column', 'column', layout === 'horizontal' ? 'row' : 'column']`. The `media[0]` step repeats
 * the base (column) values, so only the `media[1]` step of the horizontal layout differs.
 */
export const image = css({
  objectFit: 'cover',
  width: '100%',
  height: '180px',
})

export const imageHorizontal = css({
  // media[1]
  '@media screen and (min-width: 600px)': {
    width: '50%',
    height: 'auto',
  },
})

export const descriptionRoot = css({
  margin: 'auto 0',
})
