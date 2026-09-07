import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const chevronWrapper = style({
  marginLeft: 'auto',
})

export const crossDatasetReferencesDetails = style({
  flex: 'none',
})

globalStyle(`${crossDatasetReferencesDetails}[open] ${chevronWrapper}`, {
  transform: 'rotate(180deg)',
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
  width: '100%',
  textAlign: 'left',
  padding: `0 ${space2Var}`,
  borderCollapse: 'collapse',
})

globalStyle(`${table} th`, {
  padding: space1Var,
})

globalStyle(`${table} td`, {
  padding: `0 ${space1Var}`,
})

globalStyle(`${table} tr > *:last-child`, {
  textAlign: 'right',
})

// The ui5 Flex sets no `min-height` of its own, so a single class is enough.
export const documentIdFlex = style({
  minHeight: '33px',
})
