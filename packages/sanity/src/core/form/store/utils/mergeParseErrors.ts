import {type ValidationMarker} from '@sanity/types'
import {fromString as pathFromString, toString as pathToString} from '@sanity/util/paths'

/**
 * A parse error reported by a primitive input that holds malformed text it
 * cannot commit (e.g. a date input whose value does not match `dateFormat`).
 *
 * @internal
 */
export interface ParseError {
  message: string
}

/**
 * Overlay input-reported parse errors onto a validation array.
 *
 * While an input is unparseable, the value committed to the document is still
 * `undefined`, so the validator output for that path is misleading "required"
 * noise. For every path present in `parseErrors`, we drop the existing error
 * markers at that path and emit a single error marker carrying the parse
 * message. Markers at other paths and non-error markers at the same path
 * (warning, info) are preserved.
 *
 * The `parseErrors` map is keyed by `@sanity/util/paths` `toString(path)`.
 *
 * @internal
 */
export function mergeParseErrors(
  validation: ValidationMarker[],
  parseErrors: Record<string, ParseError>,
): ValidationMarker[] {
  const keys = Object.keys(parseErrors)
  if (keys.length === 0) return validation

  const replaced = new Set<string>()
  const merged: ValidationMarker[] = []

  // Walk validation in order. Replace the first error marker for each
  // parse-error path in place (preserving the marker's original position) and
  // drop subsequent error markers at the same path. Non-error markers and
  // markers at unrelated paths pass through.
  for (const marker of validation) {
    if (marker.level !== 'error') {
      merged.push(marker)
      continue
    }
    const key = pathToString(marker.path)
    if (!(key in parseErrors)) {
      merged.push(marker)
      continue
    }
    if (replaced.has(key)) continue
    replaced.add(key)
    merged.push({level: 'error', message: parseErrors[key].message, path: pathFromString(key)})
  }

  // Append parse errors that had no existing marker to replace. Sort the
  // remaining keys so the appended order is stable across re-renders even if
  // a parse error is cleared and re-reported (which would otherwise shift the
  // object's insertion order).
  for (const key of [...keys].sort()) {
    if (replaced.has(key)) continue
    merged.push({level: 'error', message: parseErrors[key].message, path: pathFromString(key)})
  }

  return merged
}
