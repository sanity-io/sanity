import {Box} from '@sanity/ui'
import {type ComponentProps} from 'react'

import {customTextInputBox} from './CustomTextInputBox.css'

interface CustomTextInputBoxProps extends ComponentProps<typeof Box> {
  $background?: boolean
  $smallClearButton?: boolean
}

export function CustomTextInputBox({$background, $smallClearButton, ...rest}: CustomTextInputBoxProps) {
  const variant = $background
    ? ($smallClearButton ? 'backgroundSmallClear' : 'background')
    : ($smallClearButton ? 'smallClear' : 'default')

  return <Box className={customTextInputBox[variant]} {...rest} />
}
