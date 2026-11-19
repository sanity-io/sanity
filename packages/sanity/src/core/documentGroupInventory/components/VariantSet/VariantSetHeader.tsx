import {styled} from 'styled-components'

import {VariantSetEntry} from './VariantSetEntry'

export const VariantSetHeader = styled(VariantSetEntry)`
  position: sticky;
  inset-block-start: 0;
  z-index: 2;
  background-color: var(--card-muted-bg-color);

  .variant-set-leading {
    display: flex;
    position: relative;
    justify-content: center;
    align-content: center;
  }

  /* A long name ends in an ellipsis, like a row's, and the count stays whole beside it. */
  .variant-set-title {
    min-inline-size: 0;
  }

  .variant-set-title > :not(.version-title) {
    flex: none;
  }

  /* After a checkbox, the icon shares its spot, and the checkbox is revealed in its place. */
  * + .variant-set-icon {
    position: absolute;
    inset-inline-start: 50%;
    inset-block-start: 50%;
    transform: translate(-50%, -50%);
  }
`
