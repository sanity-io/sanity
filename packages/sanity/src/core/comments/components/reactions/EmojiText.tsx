import {Text} from '@sanity/ui'
import {type ComponentProps, forwardRef} from 'react'

import {emojiText} from './EmojiText.css'

export const EmojiText = forwardRef<HTMLDivElement, ComponentProps<typeof Text>>(
  function EmojiText(props, ref) {
    const {className, ...rest} = props
    return <Text {...rest} className={[emojiText, className].filter(Boolean).join(' ')} ref={ref} />
  },
)
