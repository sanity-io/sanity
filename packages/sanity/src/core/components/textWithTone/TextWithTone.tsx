import {type ButtonTone, Text, type TextProps} from '@sanity/ui'
import {clsx} from 'clsx'
import {type RefAttributes} from 'react'

import {textWithTone} from './TextWithTone.css'

/** @internal */
export type TextWithToneProps = TextProps & {
  tone: ButtonTone
  dimmed?: boolean
}

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
    />
  )
}
