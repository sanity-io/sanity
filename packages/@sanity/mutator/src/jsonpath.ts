import {jsonMatch, type MatchEntry, stringifyPath} from '@sanity/json-match'

export {stringifyPath as arrayToJSONMatchPath}

export function extract(path: string, value: unknown): unknown[] {
  return Array.from(jsonMatch(value, path)).filter((match) => match.value)
}

export function extractWithPath(path: string, value: unknown): MatchEntry[] {
  return Array.from(jsonMatch(value, path))
}
