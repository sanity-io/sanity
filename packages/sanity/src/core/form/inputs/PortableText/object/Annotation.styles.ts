import {hues} from '@sanity/color'
import {Box} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {type ElementTone} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

export const Root = styled.span<{$toneKey?: ElementTone}>((props) => {
  const {$toneKey = 'default'} = props

  return css`
    text-decoration: none;
    display: inline;
    background-color: ${vars.color.tinted[$toneKey].bg[0]};
    border-bottom: 1px dashed ${vars.color.tinted[$toneKey].fg[0]};
    color: ${vars.color.tinted[$toneKey].fg[0]};

    &[data-link] {
      border-bottom: 1px solid ${vars.color.tinted[$toneKey].fg[0]};
    }

    &[data-custom-markers] {
      background-color: ${vars.color.dark ? hues.purple[950].hex : hues.purple[50].hex};
    }

    &[data-warning] {
      background-color: ${vars.color.tinted.caution.bg[1]};
    }

    &[data-error] {
      background-color: ${vars.color.tinted.critical.bg[1]};
    }
  `
})

export const TooltipBox = styled(Box).attrs({forwardedAs: 'span'})`
  max-width: 250px;
`
