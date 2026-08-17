import {Checkbox} from '@sanity/ui'
import {styled} from 'styled-components'

export const VariantCheckbox = styled(Checkbox)`
  input::before {
    display: block;
    position: absolute;
    content: '';
    inset: -1rem;
  }
`
