import {Text, type TextProps} from '@sanity/ui'
import {type ElementTone} from '@sanity/ui/theme'
import {forwardRef, type HTMLProps, type Ref} from 'react'

import * as styles from './TextWithTone.css'

/** @internal */
export interface TextWithToneProps extends TextProps<'div'> {
  tone: ElementTone
  dimmed?: boolean
}

/** @internal */
export const TextWithTone = forwardRef(function TextWithTone(
  props: TextWithToneProps & HTMLProps<HTMLDivElement>,
  ref: Ref<HTMLDivElement>,
) {
  const {tone, dimmed, muted, ...rest} = props

  return (
    <Text
      className={styles.textWithToneStyle}
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
