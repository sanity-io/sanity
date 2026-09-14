import {clsx} from 'clsx'
import {type ComponentPropsWithRef, type ElementType} from 'react'
import {Text, type TextProps} from 'ui5'

import {emojiText} from './EmojiText.css'

type EmojiTextProps = TextProps<ElementType> &
  Omit<ComponentPropsWithRef<'div'>, keyof TextProps<ElementType>> & {
    /** Legacy alias for `as`; existing call sites in this directory still pass it */
    forwardedAs?: ElementType
  }

export function EmojiText(props: EmojiTextProps) {
  const {as, className, forwardedAs, ...rest} = props

  return <Text {...rest} as={as ?? forwardedAs} className={clsx(emojiText, className)} />
}
