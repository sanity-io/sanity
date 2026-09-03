import {createVar, style} from '@vanilla-extract/css'

/** `theme.avatar.sizes[$size].size` in px, set on the root and inherited */
export const avatarSizeVar = createVar()
/** `theme.space[1]` in px, set on the root and inherited */
export const space1Var = createVar()
/** `hues.gray[dark ? 200 : 800].hex`, set on the root and inherited */
export const grayFgVar = createVar()

export const rootStack = style({
  position: 'relative',
})

export const contextMenuBox = style({
  /* Only show the floating layer on hover when hover is supported.
  Else, the layer is always visible. */
  '@media': {
    '(hover: hover)': {
      selectors: {
        [`${rootStack} &`]: {
          opacity: 0,
          position: 'absolute',
          right: 0,
          top: 0,
          transform: `translate(${space1Var}, calc(-1 * ${space1Var}))`,
        },
        [`${rootStack} &:focus-within`]: {
          opacity: 1,
        },
        [`${rootStack}:hover &`]: {
          opacity: 1,
        },
      },
    },
  },
  'selectors': {
    [`${rootStack}[data-menu-open='true'] &`]: {
      opacity: 1,
    },
  },
})

export const timeText = style({
  minWidth: 'max-content',
  selectors: {
    // `&&` beats ui5 Text's own `color` (`.sui-Text`, `.sui-Text:where(.sui-text-muted)`)
    '&&': {
      vars: {
        '--card-fg-color': grayFgVar,
      },
      color: 'var(--card-fg-color)',
    },
  },
})

export const intentText = style({
  selectors: {
    // `&&` beats ui5 Text's own `color` (`.sui-Text`, `.sui-Text:where(.sui-text-muted)`)
    '&&': {
      vars: {
        '--card-fg-color': grayFgVar,
      },
      color: 'var(--card-fg-color)',
    },
  },
})

export const headerFlex = style({
  selectors: {
    // `&&` beats ui5 Flex's own `min-height: var(--min-height)` (`.sui-min-height`)
    '&&': {
      minHeight: avatarSizeVar,
    },
  },
})

export const innerStack = style({
  transition: 'opacity 200ms ease',
  selectors: {
    "&[data-muted='true']": {
      transition: 'unset',
      opacity: 0.5,
    },
  },
})

export const errorFlex = style({
  selectors: {
    // `&&` beats ui5 Flex's own `min-height: var(--min-height)` (`.sui-min-height`)
    '&&': {
      minHeight: avatarSizeVar,
    },
  },
})

export const retryCardButton = style({
  selectors: {
    /* Add not on hover */
    '&:not(:hover)': {
      backgroundColor: 'transparent',
    },
  },
})
