import {css} from '#styled-system/css'

export const headerFlex = css({
  // `&&` beats ui5 Flex's own `min-height: var(--min-height)` (`.sui-min-height`)
  '&&': {
    minHeight: '25px',
  },
})

/** `theme.color.fg` (v1 `color.base.fg`) */
export const baseFgVar = '--comment-thread-layout-base-fg'

export const breadcrumbsButton = css({
  // The width is needed to make the text ellipsis work
  // in the breadcrumbs component
  'maxWidth': '100%',
  // `&&` beats Button's own enabled-state `--card-fg-color` (the hover states stay stronger)
  '&&': {
    '--card-fg-color': `var(${baseFgVar})`,
  },
})
