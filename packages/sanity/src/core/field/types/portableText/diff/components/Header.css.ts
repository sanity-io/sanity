import {css} from '#styled-system/css'

export const styledHeading = css({
  // `&&`: Heading's own `&:not([hidden]) {display: block}` is (0,2,0).
  '&&:not([hidden])': {
    display: 'inline',
    textTransform: 'none',
    margin: '0',
  },
  '&&:not([hidden])::before': {
    content: 'unset',
  },
  '&&:not([hidden])::after': {
    content: 'unset',
  },
})
