import {Box, TextInput} from '@sanity/ui'
import React, {ComponentProps, forwardRef} from 'react'
import styled from 'styled-components'

interface CustomTextInputProps extends ComponentProps<typeof TextInput> {
  smallClearButton?: boolean
}

export const CustomTextInput = forwardRef<HTMLDivElement, CustomTextInputProps>(
  function CustomTextInput(props, ref) {
    const {smallClearButton, ...rest} = props
    return (
      <CustomTextInputWrapper smallClearButton={smallClearButton} ref={ref}>
        <TextInput {...rest} />
      </CustomTextInputWrapper>
    )
  }
)

const CustomTextInputWrapper = styled(Box)<{smallClearButton: boolean}>`
  [data-qa='clear-button'] {
    display: flex; /* TODO: hack, currently used to vertically center <TextInput>'s clearButton */
    transform: ${({smallClearButton}) => (smallClearButton ? 'scale(0.7)' : 'scale(1)')};
  }
`
