import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps, type CSSProperties} from 'react'

import {ghostNeutralFgVar, textButton} from './TextButton.css'

export function TextButton(props: ComponentProps<'button'>) {
  const {className, style, ...rest} = props
  const {color} = useThemeV2()

  return (
    <button
      {...rest}
      className={clsx(textButton, className)}
      style={
        {
          [ghostNeutralFgVar]: color.button.ghost.neutral.enabled.fg,
          ...style,
        } as CSSProperties
      }
    />
  )
}
