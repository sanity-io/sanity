import {createVar, style} from '@vanilla-extract/css'

export const headerFlex = style({
  selectors: {
    // `&&` beats ui5 Flex's own `min-height: var(--min-height)` (`.sui-min-height`)
    '&&': {
      minHeight: '25px',
    },
  },
})

/** `theme.color.fg` (v1 `color.base.fg`) */
export const baseFgVar = createVar()

export const breadcrumbsButton = style({
  // The width is needed to make the text ellipsis work
  // in the breadcrumbs component
  maxWidth: '100%',
  selectors: {
    // `&&` beats Button's own enabled-state `--card-fg-color` (the hover states stay stronger)
    '&&': {
      vars: {
        '--card-fg-color': baseFgVar,
      },
    },
  },
})
