import {css} from '#styled-system/css'

export const root = css({
  'lineHeight': 0,
  'top': 0,
  // Layer sets `position: relative` on itself
  '&&': {
    position: 'sticky',
  },
  '&:not([data-collapsed]):after': {
    content: '""',
    display: 'block',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '-1px',
    opacity: 1,
  },
})

export const rootBorder = css({
  '&:not([data-collapsed]):after': {
    borderBottom: '1px solid var(--card-border-color)',
  },
})

export const rootNoBorder = css({
  '&:not([data-collapsed]):after': {
    borderBottom: '1px solid transparent',
  },
})

export const layout = css({
  'transformOrigin': 'calc(51px / 2)',
  '[data-collapsed] > div > &': {
    transform: 'rotate(90deg)',
  },
})

/** `color.selectable.default.enabled.bg` (what the legacy `theme.sanity.color.card.enabled.bg` resolves to) */
export const titleCardBgVar = '--pane-header-title-card-bg'
/** `color.selectable.default.enabled.fg` (what the legacy `theme.sanity.color.card.enabled.fg` resolves to) */
export const titleCardFgVar = '--pane-header-title-card-fg'

// Disable color updates on hover
export const titleCard = css({
  // Card sets `background-color` and (via Box) `min-width` on itself
  '&&': {
    backgroundColor: `var(${titleCardBgVar})`,
    minWidth: 0,
  },
  "& [data-ui='Text']": {
    color: `var(${titleCardFgVar})`,
  },
})

export const titleTextSkeleton = css({
  // TextSkeleton sets its own dimensions
  '&&': {
    width: '66%',
    maxWidth: '175px',
  },
})

export const titleText = css({
  cursor: 'default',
  outline: 'none',
  minWidth: 0,
})
