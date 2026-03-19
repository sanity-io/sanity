import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const chevronWrapper = style({
  selectors: {
    '&&': {
      marginLeft: 'auto',
    },
  },
})

export const crossDatasetReferencesDetails = style({
  flexShrink: 0,
  flexGrow: 0,
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

export const paddingVar = createVar()

export const table = style({
  width: '100%',
  textAlign: 'left',
  padding: `0 ${paddingVar}`,
  borderCollapse: 'collapse',
})

export const thPaddingVar = createVar()

globalStyle(`${table} th`, {
  padding: thPaddingVar,
})

export const tdPaddingVar = createVar()

globalStyle(`${table} td`, {
  padding: `0 ${tdPaddingVar}`,
})

globalStyle(`${table} tr > *:last-child`, {
  textAlign: 'right',
})

export const documentIdFlex = style({
  selectors: {
    '&&': {
      minHeight: '33px',
    },
  },
})
