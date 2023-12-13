import styled from 'styled-components'
import {ButtonTone, Text} from '@sanity/ui'
import React, {ComponentProps} from 'react'

/** @internal */
export interface TextWithToneProps extends ComponentProps<typeof Text> {
  tone: ButtonTone
  dimmed?: boolean
}

/** @internal */
const TextWithToneStyle = styled(Text)`
  &:not([data-muted]) {
    &[data-tone='default'] {
      --card-fg-color: var(--card-badge-default-fg-color);
    }
    &[data-tone='primary'] {
      --card-fg-color: var(--card-badge-primary-fg-color);
    }
    &[data-tone='positive'] {
      --card-fg-color: var(--card-badge-positive-fg-color);
    }
    &[data-tone='caution'] {
      --card-fg-color: var(--card-badge-caution-fg-color);
    }
    &[data-tone='critical'] {
      --card-fg-color: var(--card-badge-critical-fg-color);
    }
  }

  &[data-dimmed] {
    opacity: 0.3;
  }
`

/** @internal */
export const TextWithTone = React.forwardRef(function TextWithTone(
  props: TextWithToneProps,
  ref: React.Ref<HTMLDivElement>,
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
