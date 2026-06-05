import {type EditorSelection} from '@portabletext/editor'
import {toPlainText} from '@portabletext/react'
import {isPortableTextSpan, isPortableTextTextBlock, type PortableTextBlock} from '@sanity/types'

import {type CommentTextSelection} from '../../types'
import {COMMENT_INDICATORS} from './buildRangeDecorationSelectionsFromComments'
import {findTextBlockByKey, getEnclosingTextBlockKey} from './findTextBlockByKey'

interface BuildSelectionFromFragmentProps {
  fragment: PortableTextBlock[]
  value: PortableTextBlock[]
  selection: EditorSelection
}

/**
 * @internal
 */
export function buildTextSelectionFromFragment(
  props: BuildSelectionFromFragmentProps,
): CommentTextSelection {
  const {fragment, value, selection} = props
  if (!selection) {
    throw new Error('Selection is required')
  }
  const normalizedSelection: EditorSelection = selection.backward
    ? {backward: false, anchor: selection.focus, focus: selection.anchor}
    : selection
  const textSelection: CommentTextSelection = {
    type: 'text',
    value: fragment.map((fragmentBlock) => {
      const originalBlock = findTextBlockByKey(value, fragmentBlock._key)?.block
      if (!isPortableTextTextBlock(originalBlock)) {
        return {
          _key: fragmentBlock._key,
          text: '',
        }
      }
      const anchorBlockKey = getEnclosingTextBlockKey(normalizedSelection.anchor.path)
      const focusBlockKey = getEnclosingTextBlockKey(normalizedSelection.focus.path)
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
              (isPortableTextSpan(child) &&
                child.text.slice(0, Math.max(0, normalizedSelection.anchor.offset))) ||
              ''
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
                child.text.slice(normalizedSelection.focus.offset, child.text.length)) ||
                '') + originalTextAfterSelection
            break
          }
          originalTextAfterSelection = child.text + originalTextAfterSelection
        }
      }
      return {
        _key: originalBlock._key,
        text: `${originalTextBeforeSelection}${COMMENT_INDICATORS[0]}${fragmentBlockText}${COMMENT_INDICATORS[1]}${originalTextAfterSelection}`,
      }
    }),
  }

  return textSelection
}
