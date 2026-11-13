import {css} from '#styled-system/css'

export const inventoryContainerName = 'sanity-document-group-inventory'

const columnarLayoutMinBlockSize = '24rem'

export const createVariantForm = css({
  borderBlock: '1px solid var(--card-border-color)',

  [`@container ${inventoryContainerName} (width >= ${columnarLayoutMinBlockSize})`]: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    columnGap: 'var(--space-4)',
  },
})

export const createVariantPickerLabel = css({
  alignItems: 'flex-start',

  [`@container ${inventoryContainerName} (width < ${columnarLayoutMinBlockSize})`]: {
    'gridColumn': '1 / -1',
    'gridTemplateColumns': 'subgrid',

    '&&&': {
      display: 'grid',
    },
  },

  [`@container ${inventoryContainerName} (width >= ${columnarLayoutMinBlockSize})`]: {
    alignItems: 'center',
  },
})

export const createVariantPickerTrigger = css({
  minInlineSize: 0,
  gridColumn: '2',
})

const formRow = css.raw({
  'display': 'grid',
  'gridColumn': '1 / -1',
  'alignItems': 'center',
  'rowGap': 'var(--space-3)',
  'padding': 'var(--space-3) var(--space-4)',

  '& + &': {
    borderBlockStart: '1px solid var(--card-border-color)',
  },

  [`@container ${inventoryContainerName} (width >= ${columnarLayoutMinBlockSize})`]: {
    gridTemplateColumns: 'subgrid',
  },
})

export const createVariantFormRow = css(formRow, {
  [`@container ${inventoryContainerName} (width < ${columnarLayoutMinBlockSize})`]: {
    gridTemplateColumns: 'auto 1fr',
    columnGap: 'var(--space-3)',
  },
})

export const createVariantFormFooter = css(formRow, {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--space-4)',
})
