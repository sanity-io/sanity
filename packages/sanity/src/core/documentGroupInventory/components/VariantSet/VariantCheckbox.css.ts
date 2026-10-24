import {css} from '#styled-system/css'

export const variantCheckbox = css({
  '&& input::before': {
    display: 'block',
    position: 'absolute',
    content: '""',
    inset: '-1rem',
  },
})
