import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const root = style({
  lineHeight: 0,
  top: 0,
  selectors: {
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
  },
})

export const rootBorder = style({
  selectors: {
    '&:not([data-collapsed]):after': {
      borderBottom: '1px solid var(--card-border-color)',
    },
  },
})

export const rootNoBorder = style({
  selectors: {
    '&:not([data-collapsed]):after': {
      borderBottom: '1px solid transparent',
    },
  },
})

export const layout = style({
  transformOrigin: 'calc(51px / 2)',
  selectors: {
    '[data-collapsed] > div > &': {
      transform: 'rotate(90deg)',
    },
  },
})

/** `color.selectable.default.enabled.bg` (what the legacy `theme.sanity.color.card.enabled.bg` resolves to) */
export const titleCardBgVar = createVar()
/** `color.selectable.default.enabled.fg` (what the legacy `theme.sanity.color.card.enabled.fg` resolves to) */
export const titleCardFgVar = createVar()

// Disable color updates on hover
export const titleCard = style({
  selectors: {
    // Card sets `background-color` and (via Box) `min-width` on itself
    '&&': {
      backgroundColor: titleCardBgVar,
      minWidth: 0,
    },
  },
})

globalStyle(`${titleCard} [data-ui='Text']`, {
  color: titleCardFgVar,
})

export const titleTextSkeleton = style({
  width: '66%',
  maxWidth: '175px',
})

export const titleText = style({
  cursor: 'default',
  outline: 'none',
  minWidth: 0,
})
