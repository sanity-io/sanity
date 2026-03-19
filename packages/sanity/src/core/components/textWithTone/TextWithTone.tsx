import {type ButtonTone, Text} from '@sanity/ui'
import {type ComponentProps, forwardRef, type Ref} from 'react'

import {textWithTone} from './TextWithTone.css'

/** @internal */
export interface TextWithToneProps extends ComponentProps<typeof Text> {
  tone: ButtonTone
  dimmed?: boolean
}

/** @internal */
export const TextWithTone = forwardRef(function TextWithTone(
  props: TextWithToneProps,
  ref: Ref<HTMLDivElement>,
) {
  const {tone, dimmed, muted, className, ...rest} = props

  return (
    <Text
      data-ui="TextWithTone"
      data-dimmed={dimmed ? '' : undefined}
      data-muted={muted ? '' : undefined}
      data-tone={tone}
      muted={muted}
      className={[textWithTone, className].filter(Boolean).join(' ')}
      ref={ref}
      {...rest}
    />
  )
})
