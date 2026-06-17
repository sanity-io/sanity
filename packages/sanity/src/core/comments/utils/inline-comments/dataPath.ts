import {type Path, type PathSegment} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'

function isKeyedSegment(segment: PathSegment): segment is {_key: string} {
  return typeof segment === 'object' && segment !== null && '_key' in segment
}

/**
 * Given a fully-keyed selection path inside an editor (e.g.
 * `[{_key: block}, 'children', {_key: span}]`), return the path to the block's
 * containing array, relative to the editor root. For a root text block this is
 * `[]`; for a block nested in a container it is e.g. `[{_key: callout}, 'content']`.
 *
 * Text-selection comments always focus inside a span of a text block, so the
 * path ends in `[..., {_key: block}, 'children', {_key: span}]`. The containing
 * array is everything before the block segment.
 */
function getContainingArrayPath(selectionPath: Path): Path {
  const childrenIndex = selectionPath.lastIndexOf('children')

  // Not the expected `[..., block, 'children', span]` shape: treat the block as
  // a root-level block (empty relative path), preserving today's behavior.
  if (childrenIndex <= 0) {
    return []
  }

  return selectionPath.slice(0, childrenIndex - 1)
}

/**
 * Compute a comment's `field`: the **data path** to the block's containing
 * array, joining the editor's own document path (`basePath`) with the path from
 * the editor root down to the block's parent array.
 *
 * This is rendering-agnostic. A callout's content yields
 * `body[_key=="callout"].content` whether the editor is the body (inline
 * container, `basePath = ['body']`) or the callout's own nested input
 * (`basePath = ['body', {_key: callout}, 'content']`). For a root block it
 * collapses to the editor path, matching what is stored today.
 */
export function getCommentFieldPath(basePath: Path, selectionPath: Path): string {
  return PathUtils.toString([...basePath, ...getContainingArrayPath(selectionPath)])
}

/**
 * The array of blocks an editor must search to resolve a comment, plus the path
 * prefix to prepend to decoration selections so they are addressed from the
 * editor root.
 *
 * When `field` is the editor's own path (root/dialog/void-object rendering),
 * the descent is empty: the editor value is the array and the prefix is `[]`,
 * byte-identical to resolving against the top-level value. When `field` is a
 * data path nested below the editor (inline container), descend through the
 * value to that array and return the keyed prefix.
 *
 * Returns `undefined` when `field` is not under `basePath` or the descent does
 * not resolve (e.g. transient value mismatch).
 */
export function resolveCommentArray(
  value: ReadonlyArray<Record<string, unknown>>,
  basePath: Path,
  field: string,
): {array: ReadonlyArray<Record<string, unknown>>; prefix: Path} | undefined {
  const fieldPath = PathUtils.fromString(field)

  if (!PathUtils.startsWith(basePath, fieldPath)) {
    return undefined
  }

  const relative = fieldPath.slice(basePath.length)

  if (relative.length === 0) {
    return {array: value, prefix: []}
  }

  let currentArray: ReadonlyArray<Record<string, unknown>> = value

  for (let index = 0; index < relative.length; index++) {
    const keyedSegment = relative[index]
    if (!isKeyedSegment(keyedSegment)) {
      return undefined
    }
    const node = currentArray.find((item) => item._key === keyedSegment._key)
    const fieldSegment = relative[index + 1]
    if (!node || typeof fieldSegment !== 'string') {
      return undefined
    }
    const nextArray = node[fieldSegment]
    if (!Array.isArray(nextArray)) {
      return undefined
    }
    currentArray = nextArray as ReadonlyArray<Record<string, unknown>>
    index++
  }

  return {array: currentArray, prefix: relative}
}

/**
 * Whether the editor at `basePath` renders the data path `field`, and so should
 * own that comment's decoration. It always owns its own path. It additionally
 * owns nested data paths it draws inline (e.g. container content), supplied via
 * `renderedInlinePaths`. With no inline paths (today), this collapses to exact
 * match: one editor per field path.
 */
export function editorOwnsCommentField(
  basePath: Path,
  field: string,
  renderedInlinePaths: ReadonlyArray<string> = [],
): boolean {
  return field === PathUtils.toString(basePath) || renderedInlinePaths.includes(field)
}
