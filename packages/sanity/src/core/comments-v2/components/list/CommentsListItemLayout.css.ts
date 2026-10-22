import {css} from '#styled-system/css'

/** `theme.avatar.sizes[$size].size` in px, set on the root and inherited */
export const avatarSizeVar = '--comments-list-item-layout-avatar-size'
/** `theme.space[1]` in px, set on the root and inherited */
export const space1Var = '--comments-list-item-layout-space-1'
/** `hues.gray[dark ? 200 : 800].hex`, set on the root and inherited */
export const grayFgVar = '--comments-list-item-layout-gray-fg'

export const rootStack = css({
  position: 'relative',
})

// `data-comments-list-item-layout` is rendered by the element with the `rootStack` class
export const contextMenuBox = css({
  /* Only show the floating layer on hover when hover is supported.
  Else, the layer is always visible. */
  '@media (hover: hover)': {
    '[data-comments-list-item-layout] &': {
      'opacity': 0,
      'position': 'absolute',
      'right': 0,
      'top': 0,
      'transform': `translate(var(${space1Var}), calc(-1 * var(${space1Var})))`,
      '&:focus-within': {
        opacity: 1,
      },
    },
    '[data-comments-list-item-layout]:hover &': {
      opacity: 1,
    },
  },
  "[data-comments-list-item-layout][data-menu-open='true'] &": {
    opacity: 1,
  },
})

export const timeText = css({
  'minWidth': 'max-content',
  // `&&` beats ui5 Text's own `color` (`.sui-Text`, `.sui-Text:where(.sui-text-muted)`)
  '&&': {
    '--card-fg-color': `var(${grayFgVar})`,
    'color': 'var(--card-fg-color)',
  },
})

export const intentText = css({
  // `&&` beats ui5 Text's own `color` (`.sui-Text`, `.sui-Text:where(.sui-text-muted)`)
  '&&': {
    '--card-fg-color': `var(${grayFgVar})`,
    'color': 'var(--card-fg-color)',
  },
})

export const headerFlex = css({
  // `&&` beats ui5 Flex's own `min-height: var(--min-height)` (`.sui-min-height`)
  '&&': {
    minHeight: `var(${avatarSizeVar})`,
  },
})

export const innerStack = css({
  'transition': 'opacity 200ms ease',
  "&[data-muted='true']": {
    transition: 'unset',
    opacity: 0.5,
  },
})

export const errorFlex = css({
  // `&&` beats ui5 Flex's own `min-height: var(--min-height)` (`.sui-min-height`)
  '&&': {
    minHeight: `var(${avatarSizeVar})`,
  },
})

export const retryCardButton = css({
  /* Add not on hover */
  '&&:not(:hover)': {
    backgroundColor: 'transparent',
  },
})
