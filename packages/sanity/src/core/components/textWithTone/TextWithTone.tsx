import {Text, type TextProps} from '@sanity/ui'
import {getVarName, vars} from '@sanity/ui/css'
import {type ElementTone} from '@sanity/ui/theme'
import {forwardRef, type HTMLProps, type Ref} from 'react'
import {styled} from 'styled-components'

/** @internal */
export interface TextWithToneProps extends TextProps<'div'> {
  tone: ElementTone
  dimmed?: boolean
}

/** @internal */
const TextWithToneStyle = styled(Text)`
  &:not([data-muted]) {
    &[data-tone='default'] {
      ${getVarName(vars.color.fg)}: ${vars.color.solid.default.fg[0]};
    }
    &[data-tone='primary'] {
      ${getVarName(vars.color.fg)}: ${vars.color.solid.primary.fg[0]};
    }
    &[data-tone='positive'] {
      ${getVarName(vars.color.fg)}: ${vars.color.solid.positive.fg[0]};
    }
    &[data-tone='caution'] {
      ${getVarName(vars.color.fg)}: ${vars.color.solid.caution.fg[0]};
    }
    &[data-tone='critical'] {
      ${getVarName(vars.color.fg)}: ${vars.color.solid.critical.fg[0]};
    }
  }

  &[data-dimmed] {
    opacity: 0.3;
  }
`

/** @internal */
export const TextWithTone = forwardRef(function TextWithTone(
  props: TextWithToneProps & HTMLProps<HTMLDivElement>,
  ref: Ref<HTMLDivElement>,
) {
  const {tone, dimmed, muted, ...rest} = props

  return (
    <TextWithToneStyle
      data-ui="TextWithTone"
      data-dimmed={dimmed ? '' : undefined}
      data-muted={muted ? '' : undefined}
      data-tone={tone}
      muted={muted}
      ref={ref}
      {...rest}
    />
  )
})
