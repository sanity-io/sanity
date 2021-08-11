import {Flex, rem, Text, Theme, ThemeColorToneKey} from '@sanity/ui'
import {IconComponent} from '@sanity/icons'
import React, {createElement, isValidElement} from 'react'
import {isValidElementType} from 'react-is'
import styled, {css, keyframes} from 'styled-components'

export interface SessionBadgeProps {
  icon?: IconComponent
  iconHover?: IconComponent
  style?: React.CSSProperties
  tone?: ThemeColorToneKey
  title?: string
}

const rotateAnimation = keyframes`
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
`

const Root = styled(Flex)<{$tone: ThemeColorToneKey}>(
  ({$tone, theme}: {$tone: ThemeColorToneKey; theme: Theme}) => {
    const {color} = theme.sanity
    const tone = color.solid[$tone] || color.solid.default

    return css`
      --session-badge-size: ${rem(theme.sanity.avatar.sizes[0].size)};
      --session-badge-bg-color: ${tone.enabled.bg};
      --session-badge-fg-color: ${tone.enabled.fg};
      background-color: var(--session-badge-bg-color);
      color: var(--session-badge-fg-color);
      border-radius: calc(var(--session-badge-size) / 2);
      width: var(--session-badge-size);
      height: var(--session-badge-size);
      box-shadow: 0 0 0 1px var(--card-bg-color);
      [data-badge-icon-hover] {
        display: none;
      }
      @media (hover: hover) {
        button:not([data-disabled='true']):hover & {
          --session-badge-bg-color: var(--card-fg-color);
          --session-badge-fg-color: var(--card-bg-color);
          [data-badge-icon] {
            display: none;
          }
          &:last-of-type [data-badge-icon-hover] {
            display: block;
          }
        }
      }
      button:not([data-disabled='true'])[data-selected] & {
        --session-badge-bg-color: var(--card-fg-color);
        --session-badge-fg-color: var(--card-bg-color);
        [data-badge-icon] {
          display: none;
        }
        &:last-of-type [data-badge-icon-hover] {
          display: block;
        }
      }
      // Only show icon inside a badge if it's the last one/on the top
      &:not(:last-of-type) [data-badge-icon] {
        display: none;
      }
      &[data-syncing='true']:last-of-type [data-sanity-icon] {
        animation-name: ${rotateAnimation};
        animation-duration: 1500ms;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
      }
      @media (hover: hover) {
        button:not([data-disabled='true']):hover & {
          /* --session-badge-bg-color: ${tone.hovered.fg}; */
          /* --session-badge-fg-color: ${tone.hovered.bg}; */
        }
      }
      button:not([data-disabled='true'])[data-selected] & {
        /* --session-badge-bg-color: ${tone.selected.fg}; */
        /* --session-badge-fg-color: ${tone.selected.bg}; */
      }
      [data-ui='DocumentSparkline'][data-disabled='true'] & {
        opacity: 0.2;
      }
    `
  }
)

const IconText = styled(Text)`
  color: inherit;
`

export const SessionBadge = (props: SessionBadgeProps) => {
  const {iconHover, icon, title, tone = 'default', ...restProps} = props

  return (
    <Root
      data-ui="SessionBadge"
      {...restProps}
      $tone={tone}
      align="center"
      justify="center"
      title={title}
    >
      {icon && (
        <IconText size={1} data-badge-icon>
          {isValidElement(icon) && icon}
          {isValidElementType(icon) && createElement(icon)}
        </IconText>
      )}

      <IconText size={1} data-badge-icon-hover>
        {isValidElement(iconHover) && iconHover}
        {isValidElementType(iconHover) && createElement(iconHover)}
      </IconText>
    </Root>
  )
}
