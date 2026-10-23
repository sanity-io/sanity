import {css} from '#styled-system/css'

export const root = css({
  'outline': 'none',
  // Card sets `box-shadow` on itself (via its `shadow` prop)
  '&&': {
    // NOTE: This will render a border to the right side of each pane
    // without taking up physical space.
    boxShadow: '1px 0 0 var(--card-border-color)',
  },
})
