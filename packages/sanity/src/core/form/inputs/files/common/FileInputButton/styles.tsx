import {useTheme} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ComponentProps} from 'react'

import {Button, MenuItem} from '../../../../../../ui-components'
import {focusRingStyle} from '../../../../components/withFocusRing/helpers'
import {fileButton, fileMenuItem, focusRingShadowVar} from './styles.css'

function useFocusRingVars() {
  const theme = useTheme()
  const {focusRing} = theme.sanity
  const base = theme.sanity.color.base
  const border = {width: 1, color: 'var(--card-border-color)'}
  return assignInlineVars({[focusRingShadowVar]: focusRingStyle({base, border, focusRing})})
}

export function FileButton(props: ComponentProps<typeof Button>) {
  const {className, style, ...rest} = props

  return (
    <Button
      {...rest}
      className={[fileButton, className].filter(Boolean).join(' ')}
      style={{...useFocusRingVars(), ...style}}
      // @ts-expect-error - TODO: vanilla-extract-migration fix this
      forwardedAs="label"
    />
  )
}

export function FileMenuItem(props: ComponentProps<typeof MenuItem>) {
  const {className, style, ...rest} = props

  return (
    <MenuItem
      {...rest}
      className={[fileMenuItem, className].filter(Boolean).join(' ')}
      style={{...useFocusRingVars(), ...style}}
      // @ts-expect-error - TODO: vanilla-extract-migration fix this
      forwardedAs="label"
    />
  )
}
