// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {type StringFieldProps} from '../../../../form'

/**
 * @internal
 * Updates the padding and font weight of the field header content box.
 */
export const FieldWrapperRoot = styled.div((props) => {
  const theme = getTheme_v2(props.theme)

  return css`
    // Reset the padding of the field header content box
    [data-ui='fieldHeaderContentBox'] {
      padding: 0;
      label {
        font-weight: ${theme.font.text.weights.regular};
      }
    }
  `
})

export function FieldWrapper(props: StringFieldProps) {
  return <FieldWrapperRoot>{props.renderDefault(props)}</FieldWrapperRoot>
}
