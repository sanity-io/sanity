import {css} from '#styled-system/css'

export const collapseMenuDivider = css({
  'borderRight': '1px solid var(--card-border-color)',
  'height': 'auto',

  '&[data-hidden]': {
    opacity: 0,
  },
})
