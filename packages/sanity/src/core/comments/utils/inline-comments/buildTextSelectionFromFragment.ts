import {type EditorSelection} from '@portabletext/editor'
import {toPlainText} from '@portabletext/react'
import {
  isPortableTextSpan,
  isPortableTextTextBlock,
  type Path,
  type PortableTextBlock,
  type PortableTextTextBlock,
} from '@sanity/types'

import {getValueAtPath} from '../../../field'
import {type CommentTextSelection} from '../../types'
import {COMMENT_INDICATORS} from './buildRangeDecorationSelectionsFromComments'

interface BuildSelectionFromFragmentProps {
  fragment: PortableTextBlock[]
  documentValue: unknown
  basePath: Path
  selection: EditorSelection
}

/**
 * Walk the selection path from its full depth up to root and return the
 * deepest enclosing text block along with the path segments that reach it
 * (relative to `basePath`). Selection paths from PTE are editor-relative
 * (start at a block key), so the walker prepends `basePath` before descending
 * the document value. The block is identified structurally — `isPortableTextTextBlock`
 * checks for `children` and `markDefs` — so container-nested blocks resolve the
 * same as top-level ones without needing a schema.
 *
 * @internal
 */
export function findEnclosingTextBlock(
  documentValue: unknown,
  basePath: Path,
  path: Path,
): {node: PortableTextTextBlock; path: Path} | undefined {
  for (let end = path.length; end > 0; end--) {
    const relative = path.slice(0, end)
    const candidate = getValueAtPath(documentValue, [...basePath, ...relative])
    if (isPortableTextTextBlock(candidate)) {
      return {node: candidate, path: relative}
    }
  }
  return undefined
}

/**
 * @internal
 */
export function buildTextSelectionFromFragment(
  props: BuildSelectionFromFragmentProps,
): CommentTextSelection {
  const {fragment, documentValue, basePath, selection} = props
  if (!selection) {
    throw new Error('Selection is required')
  }
  const normalizedSelection: EditorSelection = selection.backward
    ? {backward: false, anchor: selection.focus, focus: selection.anchor}
    : selection

  // Walk to the enclosing block through the document value rather than a
  // top-level lookup against the editor slice. Same structural resolution
  // whether the block lives at the root of the editor's array or several
  // container levels deep.
  const anchorBlock = findEnclosingTextBlock(
    documentValue,
    basePath,
    normalizedSelection.anchor.path,
  )?.node
  const focusBlock = findEnclosingTextBlock(
    documentValue,
    basePath,
    normalizedSelection.focus.path,
  )?.node

  const textSelection: CommentTextSelection = {
    type: 'text',
    value: fragment.map((fragmentBlock) => {
      const originalBlock =
        anchorBlock?._key === fragmentBlock._key
          ? anchorBlock
          : focusBlock?._key === fragmentBlock._key
            ? focusBlock
            : undefined
      if (!isPortableTextTextBlock(originalBlock)) {
        return {
          _key: fragmentBlock._key,
          text: '',
        }
      }
      const anchorBlockKey = anchorBlock?._key
      const focusBlockKey = focusBlock?._key
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
