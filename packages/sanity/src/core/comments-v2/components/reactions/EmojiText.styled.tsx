import {clsx} from 'clsx'
import {type ComponentPropsWithRef, type ElementType} from 'react'
import {Text, type TextProps} from 'ui5'

import {emojiText} from './EmojiText.css'

type EmojiTextProps = TextProps<ElementType> &
  Omit<ComponentPropsWithRef<'div'>, keyof TextProps<ElementType>>

export function EmojiText(props: EmojiTextProps) {
  const {className, ...rest} = props

  return <Text {...rest} className={clsx(emojiText, className)} />
}
