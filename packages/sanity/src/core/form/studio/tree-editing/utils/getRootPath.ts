import {type Path} from '@sanity/types'

/**
 * Get the root path of the focus path.
 * The root path is the path until the first key segment appears.
 *
 * Example:
 * ```js
 * const rootPath = getRootPath(['object', 'array', { _key: '123' }])
 * // => ['object','array']
 * ```
 */
export function getRootPath(path: Path): Path {
  const keyedSegmentIndex = path.findIndex((seg) => seg?.hasOwnProperty('_key'))

  if (keyedSegmentIndex === -1) return path

  return path.slice(0, keyedSegmentIndex)
}
