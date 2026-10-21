import {type Path} from '@sanity/types'
import {toString as pathToString} from '@sanity/util/paths'

import {VALIDATION_PATH_PARAM, VALIDATION_PUBLISH_NOTICE_PARAM} from '../../constants'

const EMPTY_PATHS = new Set<string>()

/** Pane params that select these validation markers, or clear the selection. */
export function validationPathParam(paths?: Path[]): Record<string, string> {
  return {
    [VALIDATION_PATH_PARAM]: paths?.length
      ? JSON.stringify(paths.map((path) => pathToString(path)))
      : '',
    // Field and header opens are not a blocked publish.
    [VALIDATION_PUBLISH_NOTICE_PARAM]: '',
  }
}

/** Pane params for opening the inspector from a publish blocked by validation. */
export function publishValidationParams(): Record<string, string> {
  return {
    ...validationPathParam(),
    [VALIDATION_PUBLISH_NOTICE_PARAM]: String(Date.now()),
  }
}

/** Marker path strings selected by {@link validationPathParam}. */
export function highlightedValidationPaths(value: string | undefined): Set<string> {
  if (!value) return EMPTY_PATHS
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return EMPTY_PATHS
    return new Set(parsed.filter((item): item is string => typeof item === 'string'))
  } catch {
    return EMPTY_PATHS
  }
}
