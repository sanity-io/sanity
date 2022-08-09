import {Box, TextInput} from '@sanity/ui'
import React, {ComponentProps, forwardRef} from 'react'
import styled, {css} from 'styled-components'

interface CustomTextInputProps extends ComponentProps<typeof TextInput> {
  smallClearButton?: boolean
}

export const CustomTextInput = forwardRef<HTMLInputElement, CustomTextInputProps>(
  function CustomTextInput(props, ref) {
    const {smallClearButton, ...rest} = props

    return (
      <CustomTextInputWrapper smallClearButton={smallClearButton}>
        <TextInput {...rest} ref={ref} />
      </CustomTextInputWrapper>
    )
  }
)

const CustomTextInputWrapper = styled(Box)(({smallClearButton}: {smallClearButton: boolean}) => {
  return css`
    input + span {
      background: none;
    }

    [data-qa='clear-button'] {
      background: none;
      box-shadow: none;
      display: flex; /* TODO: hack, currently used to vertically center <TextInput>'s clearButton */
      transform: ${smallClearButton ? 'scale(0.7)' : 'scale(1)'};
      &:hover {
        opacity: 0.5;
      }
    }
  `
})
