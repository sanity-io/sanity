import {css} from '#styled-system/css'

export const rootPopover = css({
  "& [data-ui='Popover__wrapper']": {
    overflow: 'auto',
    maxHeight: '60vh',
  },
})

export const contentScrollerBox = css({
  /* Prevent overflow caused by change indicator */
  overflowX: 'hidden',
})

export const contentHeaderBox = css({
  'boxShadow': '0 1px 0 var(--card-shadow-outline-color)',
  'position': 'relative',
  'zIndex': 10,
  // Box sets `min-height: 0` on itself (`.sui-min-height`)
  '&&': {
    minHeight: 'auto',
  },
})
