import {createVar, style} from '@vanilla-extract/css'

/** `theme.space[1]` */
export const space1Var = createVar()

export const rootStack = style({
  position: 'relative',
})

export const contextMenuBox = style({
  '@media': {
    /* Only show the floating layer on hover when hover is supported.
    Else, the layer is always visible. */
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

/** `hues.gray[dark ? 200 : 800].hex` */
export const grayFgVar = createVar()

export const timeText = style({
  minWidth: 'max-content',
  vars: {
    '--card-fg-color': grayFgVar,
  },
  selectors: {
    // `&&` beats ui5 Text's own `color: var(--text-color)` and muted `color: var(--text-color-muted)`
    '&&': {
      color: 'var(--card-fg-color)',
    },
  },
})

export const intentText = style({
  vars: {
    '--card-fg-color': grayFgVar,
  },
  selectors: {
    // `&&` beats ui5 Text's own `color: var(--text-color)` and muted `color: var(--text-color-muted)`
    '&&': {
      color: 'var(--card-fg-color)',
    },
  },
})

/** `theme.avatar.sizes[$size].size` */
export const avatarSizeVar = createVar()

// `&&` beats ui5 Flex's default `minHeight="0"` (`.sui-min-height {min-height: var(--min-height)}`)
export const headerFlex = style({
  selectors: {
    '&&': {
      minHeight: avatarSizeVar,
    },
  },
})

export const errorFlex = style({
  selectors: {
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

export const retryCardButton = style({
  selectors: {
    /* Add not on hover */
    // (0,2,0) beats Card's own root `background-color: var(--card-bg-color)` (0,1,0)
    '&:not(:hover)': {
      backgroundColor: 'transparent',
    },
  },
})
