import {styled} from 'styled-components'

import {VariantSetEntry} from './VariantSetEntry'

export const VariantSetHeader = styled(VariantSetEntry)`
  background-color: var(--card-muted-bg-color);

  .variant-set-leading {
    display: flex;
    position: relative;
    justify-content: center;
    align-content: center;
  }

  /* After a checkbox, the icon shares its spot, and the checkbox is revealed in its place. */
  * + .variant-set-icon {
    position: absolute;
    inset-inline-start: 50%;
    inset-block-start: 50%;
    transform: translate(-50%, -50%);
  }
`
