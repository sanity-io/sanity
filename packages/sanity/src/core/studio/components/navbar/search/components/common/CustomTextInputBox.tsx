import {Box} from '@sanity/ui'
import styled, {css} from 'styled-components'

export const CustomTextInputBox = styled(Box)<{
  $background?: boolean
  $smallClearButton?: boolean
}>(({$background, $smallClearButton}) => {
  return css`
    width: 100%;

    input + span {
      background: ${({theme}) =>
        $background ? theme.sanity.color.card.disabled.bg2 : 'transparent'};
    }

    [data-qa='clear-button'] {
      background: none;
      box-shadow: none;
      display: flex; /* TODO: hack, currently used to vertically center <TextInput>'s clearButton */
      transform: ${$smallClearButton ? 'scale(0.8)' : 'scale(1)'};
      &:hover {
        opacity: 0.5;
      }
    }
  `
})
