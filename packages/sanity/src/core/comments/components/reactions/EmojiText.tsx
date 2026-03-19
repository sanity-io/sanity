import {Text, type TextProps} from '@sanity/ui'
import {forwardRef} from 'react'

import {emojiText} from './EmojiText.css'

export const EmojiText = forwardRef<HTMLDivElement, TextProps>(function EmojiText(props, ref) {
  const {className, ...rest} = props
  return <Text {...rest} className={[emojiText, className].filter(Boolean).join(' ')} ref={ref} />
})
