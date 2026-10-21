import {createVar, style} from '@vanilla-extract/css'

export const headerFlex = style({
  selectors: {
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
    '&&': {
      vars: {
        '--card-fg-color': baseFgVar,
      },
    },
  },
})
