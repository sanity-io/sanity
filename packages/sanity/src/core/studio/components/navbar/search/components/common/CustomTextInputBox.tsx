import {clsx} from 'clsx'
import {type ComponentProps} from 'react'
import {Box} from 'ui5'

import {
  customTextInputBox,
  smallClearButton,
  transparentInputBackground,
} from './CustomTextInputBox.css'

interface CustomTextInputBoxProps extends ComponentProps<typeof Box> {
  $background?: boolean
  $smallClearButton?: boolean
}

export function CustomTextInputBox(props: CustomTextInputBoxProps) {
  const {$background, $smallClearButton, className, ...rest} = props

  return (
    <Box
      {...rest}
      className={clsx(
        customTextInputBox,
        !$background && transparentInputBackground,
        $smallClearButton && smallClearButton,
        className,
      )}
    />
  )
}
