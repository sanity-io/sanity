import {TextInput} from '@sanity/ui'
import {type ComponentProps, type RefAttributes} from 'react'

import {CustomTextInputBox} from './CustomTextInputBox'

interface CustomTextInputProps extends ComponentProps<typeof TextInput> {
  $background?: boolean
  $smallClearButton?: boolean
}

export function CustomTextInput(props: CustomTextInputProps & RefAttributes<HTMLInputElement>) {
  const {ref, $background, $smallClearButton, ...rest} = props

  return (
    <CustomTextInputBox $background={$background} $smallClearButton={$smallClearButton}>
      <TextInput {...rest} ref={ref} />
    </CustomTextInputBox>
  )
}
