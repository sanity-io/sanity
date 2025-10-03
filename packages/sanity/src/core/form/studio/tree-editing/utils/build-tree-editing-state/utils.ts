import {isKeySegment, type Path, type PathSegment} from '@sanity/types'

import {getValueAtPath} from '../../../../../field/paths/helpers'

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
 * Validates that a relative path points to an existing item, and if not, returns the parent array path.
 * This handles new item creation and prevents the dialog from attempting to navigate when the new key is not ready yet.
 * For deeply nested paths, this validates all key segments in the path, not just the last one.
 */
export function validateRelativePathExists(
  relativePath: Path | null,
  documentValue: unknown,
): Path | null {
  if (!relativePath || relativePath.length === 0) {
    return relativePath
  }

  // Check all key segments in the path, starting from the beginning
  // We need to validate each level to ensure the entire path is valid
  for (let i = 0; i < relativePath.length; i++) {
    const segment = relativePath[i]

    if (!isKeySegment(segment)) {
      continue
    }

    // This segment points to a specific item. Check if this item exists.
    const parentPath = relativePath.slice(0, i)
    const parentValue = getValueAtPath(documentValue, parentPath)

    if (!Array.isArray(parentValue)) {
      // If parentValue is undefined or not an array, the path doesn't exist
      // Return the parent path to point to the last valid level

      return parentPath
    }

    const itemExists = parentValue.some((item) => {
      return item && typeof item === 'object' && '_key' in item && item._key === segment._key
    })

    // If the item doesn't exist, point to the parent array instead
    if (!itemExists) {
      return parentPath
    }
  }

  return relativePath
}

/**
 * Get the relative path.
 * The relative path is used to determine show fields that should be shown in the form.
 */
export function getRelativePath(path: Path): Path {
  return isArrayItemPath(path) ? path : path.slice(0, path.length - 1)
}
