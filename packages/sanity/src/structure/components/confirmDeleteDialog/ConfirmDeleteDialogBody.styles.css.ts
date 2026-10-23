import {css} from '#styled-system/css'

export const chevronWrapper = css({
  'marginLeft': 'auto',
  // `data-cross-dataset-references` is rendered by the `details` element with the
  // `crossDatasetReferencesDetails` class
  '[data-cross-dataset-references][open] &': {
    transform: 'rotate(180deg)',
  },
})

export const crossDatasetReferencesDetails = css({
  flex: 'none',
})

export const crossDatasetReferencesSummary = css({
  'listStyle': 'none',
  '&::-webkit-details-marker': {
    display: 'none',
  },
})

/** `rem(space[1])` */
export const space1Var = '--confirm-delete-dialog-body-space-1'
/** `rem(space[2])` */
export const space2Var = '--confirm-delete-dialog-body-space-2'

export const table = css({
  'width': '100%',
  'textAlign': 'left',
  'padding': `0 var(${space2Var})`,
  'borderCollapse': 'collapse',
  '& th': {
    padding: `var(${space1Var})`,
  },
  '& td': {
    padding: `0 var(${space1Var})`,
  },
  '& tr > *:last-child': {
    textAlign: 'right',
  },
})

export const documentIdFlex = css({
  // Flex sets `min-height: 0` on itself
  '&&': {
    minHeight: '33px',
  },
})
