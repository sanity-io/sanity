import {type Path} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'

import {findEnclosingTextBlock} from './buildTextSelectionFromFragment'

/**
 * Compute a comment's `field`: the data path to the block's containing array.
 * The block is resolved structurally by walking `selectionPath` against the
 * document value from `basePath`, so a callout's content yields
 * `body[_key=="callout"].content` whether the editor is the body (inline
 * container, `basePath = ['body']`) or the callout's own nested input
 * (`basePath = ['body', {_key: callout}, 'content']`). Returns `undefined` if
 * no enclosing text block exists at the selection path.
 */
export function getCommentFieldPath(
  documentValue: unknown,
  basePath: Path,
  selectionPath: Path,
): string | undefined {
  const enclosing = findEnclosingTextBlock(documentValue, basePath, selectionPath)
  if (!enclosing) return undefined
  return PathUtils.toString([...basePath, ...enclosing.path.slice(0, -1)])
}
