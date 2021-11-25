import styled, {css} from 'styled-components'
import {Text, Theme, ThemeColorButtonTones} from '@sanity/ui'
import React, {ComponentProps} from 'react'

type ButtonToneKeys = keyof ThemeColorButtonTones

interface TextProps extends ComponentProps<typeof Text> {
  tone: ButtonToneKeys
  dimmed?: boolean
}

export const TextWithToneStyle = styled(Text)(
  ({$tone, theme}: {$tone: ButtonToneKeys; theme: Theme}) => {
    const tone = theme.sanity.color.muted[$tone]

    return css`
      &:not([data-muted]) {
        --card-fg-color: ${tone ? tone.enabled.fg : undefined};
      }

      &[data-dimmed] {
        opacity: 0.3;
      }
    `
  }
)

export const TextWithTone = React.forwardRef(function TextWithTone(
  props: TextProps,
  ref: React.Ref<HTMLDivElement>
) {
  const {tone, dimmed, muted, ...rest} = props

  return (
    <TextWithToneStyle
      data-ui="TextWithTone"
      data-dimmed={dimmed ? '' : undefined}
      data-muted={muted ? '' : undefined}
      $tone={tone}
      muted={muted}
      ref={ref}
      {...rest}
    />
  )
})
