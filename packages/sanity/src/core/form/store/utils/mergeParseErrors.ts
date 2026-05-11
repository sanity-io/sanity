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

  const filtered = validation.filter((marker) => {
    if (marker.level !== 'error') return true
    return !(pathToString(marker.path) in parseErrors)
  })

  const parseErrorMarkers: ValidationMarker[] = keys.map((key) => ({
    level: 'error',
    message: parseErrors[key].message,
    path: pathFromString(key),
  }))

  return [...filtered, ...parseErrorMarkers]
}
