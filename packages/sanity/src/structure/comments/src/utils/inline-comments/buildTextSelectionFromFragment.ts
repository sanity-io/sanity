import {PortableTextBlock} from '@sanity/types'
import {toPlainText} from '@portabletext/react'
import {CommentTextSelection} from '../../types'

const EMPTY_ARRAY: [] = []

interface BuildSelectionFromFragmentProps {
  fragment: PortableTextBlock[]
}

export function buildTextSelectionFromFragment(
  props: BuildSelectionFromFragmentProps,
): CommentTextSelection {
  const {fragment = EMPTY_ARRAY} = props

  const selection: CommentTextSelection = {
    type: 'text',
    value: fragment.map((block) => {
      return {
        _key: block._key,
        text: toPlainText([block]),
      }
    }),
  }

  return selection
}
