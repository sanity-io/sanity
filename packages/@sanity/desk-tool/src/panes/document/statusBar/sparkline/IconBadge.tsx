import {IconComponent} from '@sanity/icons'
import styled, {css} from 'styled-components'
import React, {createElement, memo} from 'react'
import {Text, Theme} from '@sanity/ui'

export type IconBadgeTone = 'positive' | 'caution' | 'critical'

interface IconBadgeRootStyleProps {
  $disabled: boolean
  $muted: boolean
  $tone: IconBadgeTone
}

const Root = styled.div<IconBadgeRootStyleProps>(
  ({$disabled, $muted, $tone, theme}: IconBadgeRootStyleProps & {theme: Theme}) => {
    const {color} = theme.sanity
    const tone = $muted ? color.muted[$tone] : color.solid[$tone]
    const state = $disabled ? tone.disabled : tone.enabled

    return css`
      --icon-badge-size: 27px;
      --card-bg-color: ${state.bg};
      --card-fg-color: ${state.fg};
      --card-border-color: ${state.border};

      width: var(--icon-badge-size);
      height: var(--icon-badge-size);
      border-radius: calc(var(--icon-badge-size) / 2);
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--card-bg-color);
      color: var(--card-fg-color);
      box-shadow: inset 0 0 0 1px var(--card-border-color);
      margin: -3px;

      & > span {
        color: inherit;
      }
    `
  }
)

export const IconBadge = memo(function IconBadge(props: {
  disabled?: boolean
  icon: IconComponent
  muted?: boolean
  tone: IconBadgeTone
}) {
  const {disabled = false, icon, muted = false, tone} = props

  return (
    <Root $disabled={disabled} $muted={muted} $tone={tone} aria-hidden>
      <Text as="span">{createElement(icon)}</Text>
    </Root>
  )
})
