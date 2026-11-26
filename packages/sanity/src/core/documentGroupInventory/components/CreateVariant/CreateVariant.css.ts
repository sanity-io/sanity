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
  'minInlineSize': 0,
  'gridColumn': '2',

  // Reads as a select: the value fills the row and the chevron sits at the right edge, muted.
  '& [data-ui="MenuButton"] > [data-ui="Box"] > [data-ui="Flex"] > [data-ui="Box"]': {
    flex: 1,
    minWidth: 0,
    textAlign: 'start',
  },
  '& [data-ui="MenuButton"] > [data-ui="Box"] > [data-ui="Flex"] > [data-ui="Box"] [data-ui="Text"] > span':
    {
      display: 'block',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  '& [data-ui="MenuButton"] > [data-ui="Box"] > [data-ui="Flex"] > [data-ui="Text"]:last-child': {
    color: 'var(--card-muted-fg-color)',
  },
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
