import {css} from '#styled-system/css'

export const crossDatasetReferencesDetails = css({
  flex: 'none',
})

export const chevronWrapper = css({
  'marginInlineStart': 'auto',
  // `data-cross-dataset-references` is rendered by the `details` element with the
  // `crossDatasetReferencesDetails` class
  '[data-cross-dataset-references][open] &': {
    transform: 'rotate(180deg)',
  },
})

export const crossDatasetReferencesSummary = css({
  'listStyle': 'none',
  '&::-webkit-details-marker': {
    display: 'none',
  },
})

/** `rem(space[1])` */
export const space1Var = '--confirm-delete-dialog-space-1'
/** `rem(space[2])` */
export const space2Var = '--confirm-delete-dialog-space-2'

export const table = css({
  'inlineSize': '100%',
  'textAlign': 'start',
  'paddingBlock': 0,
  'paddingInline': `var(${space2Var})`,
  'borderCollapse': 'collapse',
  '& th': {
    padding: `var(${space1Var})`,
  },
  '& td': {
    paddingBlock: 0,
    paddingInline: `var(${space1Var})`,
  },
  '& tr > *:last-child': {
    textAlign: 'end',
  },
})

export const documentIdFlex = css({
  // ui5's Flex sets `min-height: 0` on itself through its `.sui-min-height` utility class
  // (0,1,0); `min-block-size` cascades against that declaration, so double the class.
  '&&': {
    minBlockSize: '33px',
  },
})
