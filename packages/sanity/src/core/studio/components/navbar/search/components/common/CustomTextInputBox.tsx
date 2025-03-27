import {Box} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {css, styled} from 'styled-components'

export const CustomTextInputBox = styled(Box)<{
  $background?: boolean
  $smallClearButton?: boolean
}>(({$background, $smallClearButton}) => {
  return css`
    width: 100%;

    input + span {
      background: ${$background ? vars.color.tinted.default.bg[1] : 'transparent'};
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
