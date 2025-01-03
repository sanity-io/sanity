import {type Path, type PathSegment} from '@sanity/types'

/**
 * Check if the item is selected
 */
export function isArrayItemSelected(
  itemPath: Path | PathSegment,
  path: Path | PathSegment,
): boolean {
  return JSON.stringify(itemPath) === JSON.stringify(path)
}

/**
 * Check if the path is an array item path
 */
export function isArrayItemPath(path: Path): boolean {
  if (path.length === 0) return false

  // Check if the last segment in the path has a key
  // at this point it will never be at path 0 since this method is not meant to be used for the document level
  return path[path.length - 1].hasOwnProperty('_key')
}

/**
 * Check if the item should be in the breadcrumb
 */
export function shouldBeInBreadcrumb(itemPath: Path, path: Path): boolean {
  return (
    itemPath.every((segment, index) => {
      return isArrayItemSelected(path[index], segment)
    }) && isArrayItemPath(itemPath)
  )
}

/**
 * Get the relative path.
 * The relative path is used to determine show fields that should be shown in the form.
 */
export function getRelativePath(path: Path): Path {
  return isArrayItemPath(path) ? path : path.slice(0, path.length - 1)
}
