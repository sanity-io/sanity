import {type ButtonTone} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentPropsWithRef, type RefAttributes} from 'react'
import {Text, type TextProps} from 'ui5'

import {textWithTone} from './TextWithTone.css'

/** @internal */
export type TextWithToneProps = Omit<TextProps<'div'>, 'tone' | 'as'> & {
  tone: ButtonTone
  dimmed?: boolean
} & Omit<ComponentPropsWithRef<'div'>, keyof TextProps<'div'> | 'tone' | 'as'>

/** @internal */
export function TextWithTone(props: TextWithToneProps & RefAttributes<HTMLDivElement>) {
  const {ref, tone, dimmed, muted, className, ...rest} = props

  return (
    <Text
      data-ui="TextWithTone"
      data-dimmed={dimmed ? '' : undefined}
      data-muted={muted ? '' : undefined}
      data-tone={tone}
      muted={muted}
      ref={ref}
      className={clsx(textWithTone, className)}
      {...rest}
      as="div"
      trim={true}
    />
  )
}
