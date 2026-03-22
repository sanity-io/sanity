import {styled} from 'styled-components'

import {type FormArea} from './FormRow'

interface Props {
  $area: FormArea
}

/**
 * @internal
 */
export const FormCell = styled.div<Props>`
  grid-area: ${({$area}) => $area};
`
