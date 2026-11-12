import {css} from '#styled-system/css'

export const inventoryContainerName = 'sanity-document-group-inventory'

/** The inset card holding the form. Its padding (20px) is set by the Card. */
export const createVariantCard = css({
  minWidth: 0,
})

/**
 * The header, the three fields and the actions, 20px apart. The header, the field titles and the
 * selects' borders share one left edge.
 */
export const createVariantStack = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
})

/** Cancel and Create variant, at the right, 8px apart. */
export const createVariantActions = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
})
