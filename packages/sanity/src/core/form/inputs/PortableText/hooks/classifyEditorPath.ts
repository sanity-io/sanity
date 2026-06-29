import {type EditorSnapshot} from '@portabletext/editor'
import {
  getAnnotation,
  getEnclosingBlock,
  getNode,
  isBlock,
  isInline,
} from '@portabletext/editor/traversal'
import {type Path} from '@sanity/types'

/**
 * Classification of an editor path's structural shape.
 *
 * Used by the focus-tracking hook to decide what to scroll to, what to
 * select in the editor, and whether to take DOM focus. Depth-agnostic:
 * the shape predicates work for paths at any container nesting depth.
 *
 * @internal
 */
export type EditorPathShape =
  | {kind: 'block'; blockPath: Path}
  | {kind: 'inlineChild'; blockPath: Path; childPath: Path}
  | {kind: 'spanText'; blockPath: Path; childPath: Path}
  | {kind: 'annotation'; blockPath: Path; annotationPath: Path}
  | {kind: 'objectField'; blockPath: Path; fieldPath: Path}
  | {kind: 'unknown'}

/**
 * Classify the structural shape of a path against the editor's value
 * tree.
 *
 * Returns a discriminated union describing what kind of node the path
 * points at, with the relevant `blockPath` / `childPath` /
 * `annotationPath` already resolved. Composes editor traversal
 * (`getAnnotation`, `getNode`, `isBlock`, `isInline`,
 * `getEnclosingBlock`) for the structural questions, so it works at
 * any depth without hardcoded index reaches.
 *
 * @internal
 */
export function classifyEditorPath(snapshot: EditorSnapshot, path: Path): EditorPathShape {
  if (path.length === 0) {
    return {kind: 'unknown'}
  }

  // Annotations live in `markDefs`, alongside `children` rather than
  // inside it, so `getNode` skips past them. Resolve via `getAnnotation`
  // first — if it returns, the path points at an annotation.
  const annotation = getAnnotation(snapshot, path)
  if (annotation) {
    const block = getEnclosingBlock(snapshot, annotation.path)
    if (block) {
      return {kind: 'annotation', blockPath: block.path, annotationPath: annotation.path}
    }
  }

  // `getNode` returns a path that identifies the node — trailing field
  // segments (e.g. an object's primitive field, or a span's `text`) are
  // stripped, so `entry.path` is always fully keyed.
  const entry = getNode(snapshot, path)
  if (entry) {
    if (isBlock(snapshot, entry.path)) {
      // Path ended on a block, or descended into a block's primitive
      // field (the trailing field segments were stripped).
      if (entry.path.length === path.length) {
        return {kind: 'block', blockPath: entry.path}
      }
      return {kind: 'objectField', blockPath: entry.path, fieldPath: path}
    }
    if (isInline(snapshot, entry.path)) {
      const block = getEnclosingBlock(snapshot, entry.path)
      if (!block) return {kind: 'unknown'}
      // Span vs. inline-object discriminator. Spans can have a `text`
      // field path, but so can inline objects (post-EDEX-1421). The
      // `_type` check disambiguates.
      const isSpan = entry.node._type === snapshot.context.schema.span.name
      if (isSpan && entry.path.length < path.length) {
        return {kind: 'spanText', blockPath: block.path, childPath: entry.path}
      }
      if (entry.path.length === path.length) {
        return {kind: 'inlineChild', blockPath: block.path, childPath: entry.path}
      }
      return {kind: 'objectField', blockPath: block.path, fieldPath: path}
    }
  }

  return {kind: 'unknown'}
}
