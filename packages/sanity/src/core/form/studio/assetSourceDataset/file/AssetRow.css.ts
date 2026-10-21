import {style} from '@vanilla-extract/css'

export const rowButton = style({
  boxShadow: 'none',
  minWidth: 0,
  cursor: 'pointer',
  selectors: {
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
      zIndex: 2,
    },
    '&:before': {
      zIndex: 0,
      pointerEvents: 'none',
      borderRadius: 'inherit',
    },
  },
})

export const rowButtonSelected = style({
  selectors: {
    '&&': {
      vars: {
        '--card-muted-fg-color': 'var(--card-bg-color)',
        '--card-fg-color': 'var(--card-bg-color)',
      },
    },
    '&:before': {
      backgroundColor: 'var(--card-focus-ring-color)',
    },
  },
})

export const rowButtonUnselected = style({
  selectors: {
    '&:hover:before': {
      backgroundColor: 'var(--card-bg-color)',
    },
    '&:focus:before': {
      backgroundColor: 'var(--card-code-bg-color)',
    },
    '&:focus-within:before': {
      backgroundColor: 'var(--card-bg-color)',
    },
  },
})

/** Rendered as `<Card as="span">` */
export const cardIconWrapper = style({
  flexShrink: 0,
  selectors: {
    '&&': {
      backgroundColor: 'transparent',
    },
    [`${rowButtonSelected} &`]: {
      vars: {
        '--card-muted-fg-color': 'var(--card-bg-color)',
      },
    },
  },
})

export const customFlex = style({
  selectors: {
    [`${rowButtonSelected} &`]: {
      vars: {
        '--card-muted-fg-color': 'var(--card-bg-color)',
        '--card-fg-color': 'var(--card-bg-color)',
      },
    },
  },
})

export const customCardSelected = style({
  selectors: {
    '&&': {
      vars: {
        '--card-muted-fg-color': 'var(--card-bg-color)',
        '--card-fg-color': 'var(--card-bg-color)',
      },
    },
  },
})

export const typeText = style({
  overflowWrap: 'anywhere',
})
