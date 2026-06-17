import {type EditorSelection} from '@portabletext/editor'
import {toPlainText} from '@portabletext/react'
import {
  isPortableTextSpan,
  isPortableTextTextBlock,
  type Path,
  type PortableTextBlock,
  type PortableTextTextBlock,
} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'

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

  const {block: anchorBlock, path: anchorBlockPath} =
    findEnclosingTextBlock(documentValue, basePath, normalizedSelection.anchor.path) ?? {}
  const {block: focusBlock, path: focusBlockPath} =
    findEnclosingTextBlock(documentValue, basePath, normalizedSelection.focus.path) ?? {}

  // A selection spanning three or more blocks has fragment blocks that are
  // neither the anchor nor the focus block. They live in the same containing
  // arrays, so resolve every fragment block by `_key` within those arrays.
  const containingArrays: Array<Array<unknown>> = []
  for (const blockPath of [anchorBlockPath, focusBlockPath]) {
    if (!blockPath) continue
    const containingArray = getValueAtPath(documentValue, [...basePath, ...blockPath.slice(0, -1)])
    if (Array.isArray(containingArray) && !containingArrays.includes(containingArray)) {
      containingArrays.push(containingArray)
    }
  }

  const textSelection: CommentTextSelection = {
    type: 'text',
    value: fragment.map((fragmentBlock) => {
      const originalBlock = findBlockByKey(containingArrays, fragmentBlock._key)
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

/**
 * The data path to the block's containing array. Returns `undefined` if no
 * enclosing text block exists at the selection path.
 *
 * @internal
 */
export function getCommentFieldPath(
  documentValue: unknown,
  basePath: Path,
  selectionPath: Path,
): string | undefined {
  const enclosingBlockPath = findEnclosingTextBlock(documentValue, basePath, selectionPath)?.path
  if (!enclosingBlockPath) return undefined
  return PathUtils.toString([...basePath, ...enclosingBlockPath.slice(0, -1)])
}

/**
 * Walk `path` up to root against the document value from `basePath`, returning
 * the deepest enclosing text block and the segments (relative to `basePath`)
 * that reach it. Selection paths from PTE are editor-relative.
 */
function findEnclosingTextBlock(
  documentValue: unknown,
  basePath: Path,
  path: Path,
): {block: PortableTextTextBlock; path: Path} | undefined {
  for (let end = path.length; end > 0; end--) {
    const relative = path.slice(0, end)
    const candidate = getValueAtPath(documentValue, [...basePath, ...relative])
    if (isPortableTextTextBlock(candidate)) {
      return {block: candidate, path: relative}
    }
  }
  return undefined
}

function findBlockByKey(
  arrays: Array<Array<unknown>>,
  key: string,
): PortableTextTextBlock | undefined {
  for (const array of arrays) {
    for (const block of array) {
      if (isPortableTextTextBlock(block) && block._key === key) {
        return block
      }
    }
  }
  return undefined
}
