import type {ButtonProps, ButtonTone, ThemeColorToneKey} from '@sanity/ui'
import {Button, Card, Text} from '@sanity/ui'
import React from 'react'
import styled, {css} from 'styled-components'

interface Props extends Omit<ButtonProps, 'text' | 'padding' | 'iconRight'> {
  statusTone?: ButtonTone
}

const Root = styled(Button)`
  position: relative;
`

const Dot = styled(Card)<{$toneKey?: ThemeColorToneKey}>`
  position: absolute;
  top: 7px;
  right: 7px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: 1px solid var(--card-bg-color);

  ${({$toneKey}) =>
    $toneKey &&
    css`
      background: ${({theme}) => theme.sanity.color.selectable[$toneKey].selected.bg};
    `}
`

export const StatusButton = React.forwardRef(function StatusButton(
  props: Props & React.HTMLProps<HTMLButtonElement>,
  ref: React.Ref<HTMLButtonElement>
) {
  const Icon = props?.icon as any

  return (
    <Root {...props} icon={null} ref={ref}>
      {Icon && <Text>{<Icon />}</Text>}
      {props?.statusTone && <Dot $toneKey={props?.statusTone} scheme="dark" />}
    </Root>
  )
})
