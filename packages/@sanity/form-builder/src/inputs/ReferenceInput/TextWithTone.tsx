import styled, {css} from 'styled-components'
import {Text, Theme, ThemeColorButtonTones} from '@sanity/ui'
import {ComponentProps} from 'react'

type ButtonToneKeys = keyof ThemeColorButtonTones

interface TextProps extends ComponentProps<typeof Text> {
  $tone: ButtonToneKeys
}

export const TextWithTone = styled(Text)<TextProps>(
  ({$tone, theme, muted}: TextProps & {theme: Theme}) => {
    const tone = theme.sanity.color.button.bleed[$tone]
    return css`
      &:not(*[data-selected]) {
        --card-fg-color: ${tone ? tone.enabled.fg : undefined};
      }
      [data-ui='Card']:disabled & {
        --card-fg-color: inherit;
      }
      ${muted ? `opacity: 0.3` : ''};
    `
  }
)
