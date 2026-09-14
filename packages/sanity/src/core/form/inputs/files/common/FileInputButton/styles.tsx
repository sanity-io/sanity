import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {Button} from '../../../../../../ui-components/button/Button'
import {focusRingStyle} from '../../../../components/withFocusRing/helpers'
import {fileButton, fileButtonFocusRingBoxShadowVar} from './styles.css'

const FILE_BUTTON_BORDER = {width: 1, color: 'var(--card-border-color)'}

export function FileButton(props: ComponentProps<typeof Button>) {
  const {className, style, ...rest} = props
  const {color, input} = useThemeV2()
  const boxShadow = focusRingStyle({
    base: color,
    border: FILE_BUTTON_BORDER,
    focusRing: input.text.focusRing,
  })

  return (
    <Button
      {...rest}
      as="label"
      className={clsx(fileButton, className)}
      style={{...assignInlineVars({[fileButtonFocusRingBoxShadowVar]: boxShadow}), ...style}}
    />
  )
}
