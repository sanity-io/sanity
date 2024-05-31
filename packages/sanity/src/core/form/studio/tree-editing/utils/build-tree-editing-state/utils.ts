import {type Path} from 'sanity'

/**
 * Check if the item is selected
 */
export function isSelected(itemPath: Path, focusPath: Path): boolean {
  return JSON.stringify(itemPath) === JSON.stringify(focusPath)
}

/**
 * Check if the path is an array item path
 */
export function isArrayItemPath(path: Path): boolean {
  return path[path.length - 1].hasOwnProperty('_key')
}

/**
 * Check if the item should be in the breadcrumb
 */
export function shouldBeInBreadcrumb(itemPath: Path, focusPath: Path): boolean {
  return (
    itemPath.every((segment, index) => {
      return JSON.stringify(focusPath[index]) === JSON.stringify(segment)
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
