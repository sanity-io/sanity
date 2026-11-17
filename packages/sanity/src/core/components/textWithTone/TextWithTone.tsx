import {type ButtonTone} from '@sanity/ui'
import {type ComponentPropsWithRef, type Ref, type RefAttributes} from 'react'
import {styled} from 'styled-components'
import {Text, type TextProps} from 'ui5'

/** @internal */
export type TextWithToneProps = Omit<TextProps<'div'>, 'tone' | 'as'> & {
  tone: ButtonTone
  dimmed?: boolean
} & Omit<ComponentPropsWithRef<'div'>, keyof TextProps<'div'> | 'tone' | 'as'>

/** @internal */
const TextWithToneStyle = styled(Text)`
  &:not([data-muted]) {
    &[data-tone='default'] {
      --text-color: var(--card-badge-default-fg-color);
    }
    &[data-tone='primary'] {
      --text-color: var(--card-badge-primary-fg-color);
    }
    &[data-tone='positive'] {
      --text-color: var(--card-badge-positive-fg-color);
    }
    &[data-tone='caution'] {
      --text-color: var(--card-badge-caution-fg-color);
    }
    &[data-tone='critical'] {
      --text-color: var(--card-badge-critical-fg-color);
    }
  }

  &[data-dimmed] {
    opacity: 0.3;
  }
`

/** @internal */
export function TextWithTone(props: TextWithToneProps & RefAttributes<HTMLDivElement>) {
  const {ref, tone, dimmed, muted, ...rest} = props

  return (
    <TextWithToneStyle
      data-ui="TextWithTone"
      data-dimmed={dimmed ? '' : undefined}
      data-muted={muted ? '' : undefined}
      data-tone={tone}
      muted={muted}
      ref={ref}
      {...rest}
      forwardedAs="div"
      trim={true}
    />
  )
}
