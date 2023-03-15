import {hues} from '@sanity/color'
import {Box, Theme, ThemeColorToneKey} from '@sanity/ui'
import styled, {css} from 'styled-components'

export const Root = styled.span<{$toneKey?: Exclude<ThemeColorToneKey, 'transparent'>}>(
  (props: {$toneKey?: Exclude<ThemeColorToneKey, 'transparent'>; theme: Theme}) => {
    const {$toneKey = 'default', theme} = props

    return css`
      text-decoration: none;
      display: inline;
      background-color: ${theme.sanity.color.selectable?.[$toneKey].enabled.bg};
      border-bottom: 1px dashed ${theme.sanity.color.selectable?.[$toneKey].enabled.fg};
      color: ${theme.sanity.color.selectable?.[$toneKey].enabled.fg};

      &[data-link] {
        border-bottom: 1px solid ${theme.sanity.color.selectable?.[$toneKey].enabled.fg};
      }

      &[data-custom-markers] {
        background-color: ${theme.sanity.color.dark ? hues.purple[950].hex : hues.purple[50].hex};
      }

      &[data-warning] {
        background-color: ${theme.sanity.color.muted.caution.hovered.bg};
      }

      &[data-error] {
        background-color: ${theme.sanity.color.muted.critical.hovered.bg};
      }
    `
  }
)

export const TooltipBox = styled(Box).attrs({forwardedAs: 'span'})`
  max-width: 250px;
`
