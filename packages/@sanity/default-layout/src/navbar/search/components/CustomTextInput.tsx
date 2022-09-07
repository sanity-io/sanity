import {Box, TextInput} from '@sanity/ui'
import React, {ComponentProps, forwardRef} from 'react'
import styled, {css} from 'styled-components'

interface CustomTextInputProps extends ComponentProps<typeof TextInput> {
  smallClearButton?: boolean
}

const CustomTextInputBox = styled(Box)(({smallClearButton}: {smallClearButton: boolean}) => {
  return css`
    width: 100%;

    input + span {
      background: none;
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
})

export const CustomTextInput = forwardRef<HTMLInputElement, CustomTextInputProps>(
  function CustomTextInput(props, ref) {
    const {smallClearButton, ...rest} = props

    return (
      <CustomTextInputBox smallClearButton={smallClearButton}>
        <TextInput {...rest} ref={ref} />
      </CustomTextInputBox>
    )
  }
)
