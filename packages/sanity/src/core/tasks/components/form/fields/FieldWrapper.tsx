import {vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

import {type StringFieldProps} from '../../../../form'

/**
 * @internal
 * Updates the padding and font weight of the field header content box.
 */
export const FieldWrapperRoot = styled.div`
  /* Reset the padding of the field header content box */
  [data-ui='fieldHeaderContentBox'] {
    padding: 0;
    label {
      font-weight: ${vars.font.text.weight.regular};
    }
  }
`

export function FieldWrapper(props: StringFieldProps) {
  return <FieldWrapperRoot>{props.renderDefault(props)}</FieldWrapperRoot>
}
