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
  selectors: {
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
    '&&': {
      vars: {
        '--card-fg-color': grayFgVar,
      },
      color: 'var(--card-fg-color)',
    },
  },
})

/** `theme.avatar.sizes[$size].size` */
export const avatarSizeVar = createVar()

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
    '&&:not(:hover)': {
      backgroundColor: 'transparent',
    },
  },
})
