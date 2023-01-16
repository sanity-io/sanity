import {Box, TextInput} from '@sanity/ui'
import React, {ComponentProps, forwardRef} from 'react'
import styled, {css} from 'styled-components'

interface CustomTextInputProps extends ComponentProps<typeof TextInput> {
  background?: boolean
  smallClearButton?: boolean
}

const CustomTextInputBox = styled(Box)(
  ({background, smallClearButton}: {background?: boolean; smallClearButton?: boolean}) => {
    return css`
      width: 100%;

      input + span {
        background: ${({theme}) =>
          background ? theme.sanity.color.card.disabled.bg2 : 'transparent'};
      }

      [data-qa='clear-button'] {
        background: none;
        box-shadow: none;
        display: flex; /* TODO: hack, currently used to vertically center <TextInput>'s clearButton */
        transform: ${smallClearButton ? 'scale(0.8)' : 'scale(1)'};
        &:hover {
          opacity: 0.5;
        }
      }
    `
  }
)

export const CustomTextInput = forwardRef<HTMLInputElement, CustomTextInputProps>(
  function CustomTextInput(props, ref) {
    const {background, smallClearButton, ...rest} = props

    return (
      <CustomTextInputBox background={background} smallClearButton={smallClearButton}>
        <TextInput {...rest} ref={ref} />
      </CustomTextInputBox>
    )
  }
)
