import {styled} from 'styled-components'

import {VariantSetEntry} from './VariantSetEntry'

/**
 * A set's header row. Its checkbox sits in the same column as the rows' checkboxes, and its icon in
 * the shared leading column with the rows' marks, so the icon is never covered or swapped out.
 */
export const VariantSetHeader = styled(VariantSetEntry)`
  position: sticky;
  inset-block-start: 0;
  z-index: 2;
  background-color: var(--card-muted-bg-color);

  .variant-set-icon {
    display: flex;
    grid-column: mark;
    align-items: center;
    justify-content: center;
  }

  .variant-set-text {
    grid-column: text;
    min-inline-size: 0;
  }
`
