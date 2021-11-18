import styled, {css} from 'styled-components'
import {Text, Theme, ThemeColorButtonTones} from '@sanity/ui'

type ButtonToneKeys = keyof ThemeColorButtonTones

export const TextWithTone = styled(Text)<{$tone: ButtonToneKeys}>(
  ({$tone, theme}: {$tone: ButtonToneKeys; theme: Theme}) => {
    const tone = theme.sanity.color.button.bleed[$tone]
    return css`
      &:not(*[data-selected]) {
        --card-fg-color: ${tone ? tone.enabled.fg : undefined};
      }
      [data-ui='Card']:disabled & {
        --card-fg-color: inherit;
      }
    `
  }
)
