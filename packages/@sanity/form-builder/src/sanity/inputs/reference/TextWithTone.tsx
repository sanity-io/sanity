import styled, {css} from 'styled-components'
import {Text, Theme, ThemeColorToneKey} from '@sanity/ui'

export const TextWithTone = styled(Text)<{$tone: ThemeColorToneKey}>(
  ({$tone, theme}: {$tone: ThemeColorToneKey; theme: Theme}) => {
    const tone = theme.sanity.color.button.bleed[$tone]
    return css`
      &:not(*[data-selected]) {
        --card-fg-color: ${tone ? tone.enabled.fg : undefined};
        --card-muted-fg-color: ${tone ? tone.enabled.fg : undefined};
      }
      [data-ui='Card']:disabled & {
        --card-fg-color: inherit;
        --card-muted-fg-color: inherit;
      }
    `
  }
)
