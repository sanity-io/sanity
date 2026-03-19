import {style} from '@vanilla-extract/css'

export const rootFlex = style({
  selectors: {
    '&&': {
      width: '100%',
    },
  },
})

export const styleSelectBox = style({
  selectors: {
    '&&': {
      width: '8em',
    },
  },
})

export const styleSelectFlex = style({
  selectors: {
    '&&': {
      borderRight: '1px solid var(--card-border-color)',
    },
  },
})

export const actionMenuBox = style({
  selectors: {
    '&&': {
      maxWidth: 'max-content',
      borderRight: '1px solid var(--card-border-color)',
    },
  },
})

export const actionMenuBoxNoInsert = style({})

export const fullscreenButtonBox = style({
  selectors: {
    '&&': {
      borderLeft: '1px solid var(--card-border-color)',
    },
  },
})
