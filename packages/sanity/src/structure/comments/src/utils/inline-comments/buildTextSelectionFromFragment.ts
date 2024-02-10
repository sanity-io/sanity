import {
  PortableTextBlock,
  isKeySegment,
  isPortableTextSpan,
  isPortableTextTextBlock,
} from '@sanity/types'
import {toPlainText} from '@portabletext/react'
import {EditorSelection} from '@sanity/portable-text-editor'
import {CommentTextSelection} from '../../types'

interface BuildSelectionFromFragmentProps {
  fragment: PortableTextBlock[]
  value: PortableTextBlock[]
  selection: EditorSelection
}

export function buildTextSelectionFromFragment(
  props: BuildSelectionFromFragmentProps,
): CommentTextSelection {
  const {fragment, value, selection} = props
  if (!selection) {
    throw new Error('Selection is required')
  }
  const textSelection: CommentTextSelection = {
    type: 'text',
    value: fragment.map((fragmentBlock) => {
      const originalBlock = value.find((b) => b._key === fragmentBlock._key)
      if (!isPortableTextTextBlock(originalBlock)) {
        return {
          _key: fragmentBlock._key,
          text: '',
        }
      }
      const anchorBlockKey = isKeySegment(selection.anchor.path[0]) && selection.anchor.path[0]._key
      const focusBlockKey = isKeySegment(selection.focus.path[0]) && selection.focus.path[0]._key
      const fragmentBlockText = toPlainText([fragmentBlock])
      const fragmentStartSpan = isPortableTextTextBlock(fragmentBlock)
        ? fragmentBlock.children[0]
        : undefined
      const fragmentEndSpan = isPortableTextTextBlock(fragmentBlock)
        ? fragmentBlock.children[fragmentBlock.children.length - 1]
        : undefined
      let originalTextBeforeSelection = ''
      let startChildIndex = -1
      if (anchorBlockKey === originalBlock._key) {
        for (const child of originalBlock.children) {
          startChildIndex++
          if (child._key === fragmentStartSpan?._key) {
            originalTextBeforeSelection +=
              (isPortableTextSpan(child) && child.text.substring(0, selection.anchor.offset)) || ''
            break
          }
          originalTextBeforeSelection += child.text
        }
      }
      let originalTextAfterSelection = ''
      if (focusBlockKey === originalBlock._key) {
        for (const child of originalBlock.children.slice(startChildIndex).reverse()) {
          if (child._key === fragmentEndSpan?._key) {
            originalTextAfterSelection =
              ((isPortableTextSpan(child) &&
                child.text.substring(selection.focus.offset, child.text.length)) ||
                '') + originalTextAfterSelection
            break
          }
          originalTextAfterSelection = child.text + originalTextAfterSelection
        }
      }
      return {
        _key: originalBlock._key,
        text: `${originalTextBeforeSelection}<comment>${fragmentBlockText}</comment>${originalTextAfterSelection}`,
      }
    }),
  }

  return textSelection
}
