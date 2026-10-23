import {css} from '#styled-system/css'

export const rowButton = css({
  // Kept at (0,1,0) like the original: Button sets its own `box-shadow` under
  // `&:not([data-disabled='true'])` (0,2,0), so this never applied to an enabled button, and
  // `&&` would turn that into an order-dependent tie instead.
  'boxShadow': 'none',
  'minWidth': 0,
  'cursor': 'pointer',
  // `&&`: Button sets `position: relative` on itself
  '&&': {
    position: 'initial',
  },
  '&:before, &:after': {
    content: "''",
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  '&:before': {
    zIndex: 0,
    pointerEvents: 'none',
    borderRadius: 'inherit',
  },
  '&:after': {
    zIndex: 2,
  },
})

export const rowButtonSelected = css({
  // `&&`: Button sets the `--card-*` color variables on itself
  '&&': {
    '--card-muted-fg-color': 'var(--card-bg-color)',
    '--card-fg-color': 'var(--card-bg-color)',
  },
  '&:before': {
    backgroundColor: 'var(--card-focus-ring-color)',
  },
})

export const rowButtonUnselected = css({
  '&:hover:before': {
    backgroundColor: 'var(--card-bg-color)',
  },
  '&:focus:before': {
    backgroundColor: 'var(--card-code-bg-color)',
  },
  // `&&`: wins over the `:hover` and `:focus` rules above, which it followed
  '&&:focus-within:before': {
    backgroundColor: 'var(--card-bg-color)',
  },
})

/** Rendered as `<Card as="span">` */
export const cardIconWrapper = css({
  'flexShrink': 0,
  // `&&`: Card sets `background-color` on itself
  '&&': {
    backgroundColor: 'transparent',
  },
  // `data-asset-row-selected` is rendered by the selected `RowButton`
  '[data-asset-row-selected] &': {
    '--card-muted-fg-color': 'var(--card-bg-color)',
  },
})

export const customFlex = css({
  '[data-asset-row-selected] &': {
    '--card-muted-fg-color': 'var(--card-bg-color)',
    '--card-fg-color': 'var(--card-bg-color)',
  },
})

export const customCardSelected = css({
  // `&&`: Card sets the `--card-*` color variables on itself
  '&&': {
    '--card-muted-fg-color': 'var(--card-bg-color)',
    '--card-fg-color': 'var(--card-bg-color)',
  },
})

export const typeText = css({
  overflowWrap: 'anywhere',
})
