import {Text, type TextProps} from '@sanity/ui'
import {forwardRef} from 'react'

import {emojiText} from './EmojiText.css'

export const EmojiText = forwardRef<HTMLDivElement, TextProps>(function EmojiText(props, ref) {
  return <Text {...props} className={emojiText} ref={ref} />
})
