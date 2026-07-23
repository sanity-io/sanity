import {isKeySegment, type Path} from '@sanity/types'

import {ROOT_KEY, rerootPath} from '../helpers'

/**
 * Spike R1 — pure path translation between the *field* coordinate space and
 * the *synthetic array* coordinate space.
 *
 * Route 1 mounts Studio's real `PortableTextInput` over the standalone table's
 * object value. That input treats its value as a Portable Text *array* and
 * addresses everything relative to that array: a block is `[{_key}]`, a span is
 * `[{_key}, 'children', {_key}, 'text']`, and so on. Our field, by contrast,
 * stores a plain object and addresses everything relative to *it*: the first
 * row's first cell is `['rows', {_key}, 'cells', {_key}, ...]`.
 *
 * Because {@link packageTableValue} wraps the whole object as a single block
 * keyed {@link ROOT_KEY}, the two coordinate spaces differ by exactly one
 * leading segment — `{_key: 'root'}`. Everything the wrapper hands to
 * `PortableTextInput` (focusPath) must gain that segment; everything the input
 * hands back (patch paths, focus reports) must lose it. These functions are
 * that single, testable translation, in both directions.
 *
 * This file deliberately imports nothing from `sanity` (only `@sanity/types`
 * type-level and the sibling pure helpers), so the bridge's arithmetic can be
 * unit-tested without loading the Studio module graph.
 */

/** The synthetic segment that prefixes every field path in array space. */
export const SYNTHETIC_ROOT_SEGMENT = {_key: ROOT_KEY} as const

/**
 * Field space → synthetic array space: prepend the synthetic root block key.
 *
 * `['rows', {_key: 'r1'}]` → `[{_key: 'root'}, 'rows', {_key: 'r1'}]`
 *
 * The empty field path (field-level focus) maps to `[{_key: 'root'}]` — the
 * block itself — which is how "focus is on the table, not inside a cell" is
 * expressed in array space.
 */
export function toSyntheticPath(fieldPath: Path): Path {
  return [SYNTHETIC_ROOT_SEGMENT, ...fieldPath]
}

/**
 * Synthetic array space → field space: strip the synthetic root block key.
 *
 * `[{_key: 'root'}, 'rows', {_key: 'r1'}]` → `['rows', {_key: 'r1'}]`
 * `[{_key: 'root'}]`                        → `[]`  (block itself → field root)
 *
 * Returns `null` for any path *not* rooted at the synthetic block (a foreign
 * block key, or an empty path). Callers drop those: forwarding a non-rooted
 * path would address the wrong field, and an empty path is a whole-value
 * operation the disguise must never emit. This is the inverse of
 * {@link toSyntheticPath} and reuses the same guard as the POC's patch
 * re-rooting ({@link rerootPath}), so patches and focus reports agree on what
 * "rooted at the synthetic block" means.
 */
export function fromSyntheticPath(syntheticPath: Path): Path | null {
  return rerootPath(syntheticPath)
}

/**
 * True when a synthetic path is a *span text* path — the shape
 * `PortableTextInput` reports for a caret inside editable text
 * (`… 'children', {_key}, 'text'`). The Presentation tool and
 * `useTrackFocusPath` both round-trip this shape, so the bridge preserves the
 * trailing `'text'` segment verbatim rather than trying to normalize it away.
 * Exposed mainly so tests can assert the suffix survives translation.
 */
export function isSpanTextPath(path: Path): boolean {
  return path.length > 0 && path[path.length - 1] === 'text'
}

/**
 * True when a field path points inside a cell's editable block array
 * (`… {_key: cell} 'value' …`). Same predicate as the POC's
 * {@link isInsideCellPath}, restated here in field space for the R1 focus
 * bridge's use; kept local to avoid importing the value-carrying helper module
 * into anything the pure tests load.
 */
export function isFieldPathInsideCell(path: Path | undefined, cellValueField = 'value'): boolean {
  if (!Array.isArray(path)) {
    return false
  }
  return path.some(
    (segment, index) => segment === cellValueField && index > 0 && isKeySegment(path[index - 1]),
  )
}
