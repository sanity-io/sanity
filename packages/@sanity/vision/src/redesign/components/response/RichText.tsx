import {InlineCode} from 'sanity/i18n'

import {splitMessage} from '../../util/groqLint'

/** Text with the GROQ it quotes in backticks shown as code */
export function RichText({text}: {text: string}) {
  return splitMessage(text).map((segment, index) =>
    segment.code ? <InlineCode key={index}>{segment.text}</InlineCode> : segment.text,
  )
}
