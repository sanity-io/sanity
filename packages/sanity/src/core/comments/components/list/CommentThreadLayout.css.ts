import {createVar, style} from '@vanilla-extract/css'

export const headerFlex = style({
  selectors: {
    // `&&` beats ui5 Flex's default `minHeight="0"` (`.sui-min-height {min-height: var(--min-height)}`)
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
    // `&&` beats Button's own enabled-state `--card-fg-color` (0,1,0); the hover/pressed/selected
    // states (0,3,0) stay stronger, as they were against the original override
    '&&': {
      vars: {
        '--card-fg-color': baseFgVar,
      },
    },
  },
})
