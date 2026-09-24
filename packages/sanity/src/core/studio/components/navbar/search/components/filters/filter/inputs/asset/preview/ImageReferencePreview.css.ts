import {css} from '#styled-system/css'

export const container = css({
  'position': 'relative',
  // Override the default `padding: 0` @sanity/ui's Card sets on itself
  '&&': {
    paddingBottom: '100%',
  },
})

export const image = css({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'block',
  objectFit: 'contain',
})
