import {isKeyedObject, isKeySegment, Path, PathSegment} from '@sanity/types'

// Tests whether a keyed value matches a given keyed pathSegment
function matchesSegment(segment: PathSegment, value: unknown) {
  return isKeyedObject(value) && isKeySegment(segment) && value._key === segment._key
}

// Utility to check if the given focusPath terminates at the given keyed value
// E.g. focus is on the value itself and not a child node
export function hasFocusAtPath(path: Path, value: unknown): boolean {
  return path.length === 1 && matchesSegment(path[0], value)
}

// Utility to check if the given focusPath terminates at a child node of the given keyed value
// E.g. focus is on a child node of the value and not the value itself
export function hasFocusWithinPath(path: Path, value: unknown): boolean {
  return path.length > 1 && matchesSegment(path[0], value)
}
