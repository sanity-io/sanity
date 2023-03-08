import {TextInput} from '@sanity/ui'
import React, {ComponentProps} from 'react'
import {CommandListTextInput} from '../../../../../../components'
import {CustomTextInputBox} from './CustomTextInputBox'

interface CustomCommandTextInputProps extends ComponentProps<typeof TextInput> {
  background?: boolean
  smallClearButton?: boolean
}

export const CustomCommandListTextInput = (props: CustomCommandTextInputProps) => {
  const {background, smallClearButton, ...rest} = props

  return (
    <CustomTextInputBox background={background} smallClearButton={smallClearButton}>
      <CommandListTextInput {...rest} />
    </CustomTextInputBox>
  )
}
