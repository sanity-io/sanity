import {Checkbox} from '@sanity/ui'
import {styled} from 'styled-components'

import {VariantSetEntry} from './VariantSetEntry'

export const VariantCheckbox = styled(Checkbox)`
  visibility: hidden;

  &:has(input[data-visible='true']),
  ${VariantSetEntry}:hover &,
  ${VariantSetEntry}:focus-within & {
    visibility: visible;

    + .variant-set-icon {
      visibility: hidden;
    }
  }

  input::before {
    display: block;
    position: absolute;
    content: '';
    inset: -1rem;
  }
`
