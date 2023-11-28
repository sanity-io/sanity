import {TextInput} from '@sanity/ui'
import React, {ComponentProps, forwardRef} from 'react'
import {CustomTextInputBox} from './CustomTextInputBox'

interface CustomTextInputProps extends ComponentProps<typeof TextInput> {
  background?: boolean
  smallClearButton?: boolean
}

export const CustomTextInput = forwardRef<HTMLInputElement, CustomTextInputProps>(
  function CustomTextInput(props, ref) {
    const {background, smallClearButton, ...rest} = props

    return (
      <CustomTextInputBox $background={background} $smallClearButton={smallClearButton}>
        <TextInput {...rest} ref={ref} />
      </CustomTextInputBox>
    )
  },
)
