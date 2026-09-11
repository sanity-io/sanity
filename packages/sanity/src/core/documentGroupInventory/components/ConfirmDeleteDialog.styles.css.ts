import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const crossDatasetReferencesDetails = style({
  flex: 'none',
})

export const chevronWrapper = style({
  marginInlineStart: 'auto',
  selectors: {
    [`${crossDatasetReferencesDetails}[open] &`]: {
      transform: 'rotate(180deg)',
    },
  },
})

export const crossDatasetReferencesSummary = style({
  listStyle: 'none',
  selectors: {
    '&::-webkit-details-marker': {
      display: 'none',
    },
  },
})

/** `rem(space[1])` */
export const space1Var = createVar()
/** `rem(space[2])` */
export const space2Var = createVar()

export const table = style({
  inlineSize: '100%',
  textAlign: 'start',
  paddingBlock: 0,
  paddingInline: space2Var,
  borderCollapse: 'collapse',
})

globalStyle(`${table} th`, {
  padding: space1Var,
})

globalStyle(`${table} td`, {
  paddingBlock: 0,
  paddingInline: space1Var,
})

globalStyle(`${table} tr > *:last-child`, {
  textAlign: 'end',
})

export const documentIdFlex = style({
  selectors: {
    // ui5's Flex sets `min-height: 0` on itself through its `.sui-min-height` utility class
    // (0,1,0); `min-block-size` cascades against that declaration, so double the class.
    '&&': {
      minBlockSize: '33px',
    },
  },
})
