import {
  type ArraySchemaType,
  isArrayOfBlocksSchemaType,
  isKeySegment,
  type Path,
  type PathSegment,
} from '@sanity/types'

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

/** Check if the block has span children */
function hasSpanChildren(block: unknown): boolean {
  if (!block || typeof block !== 'object' || !('children' in block)) return false
  return (
    Array.isArray(block.children) && block.children.some((child) => child && child._type === 'span')
  )
}

/**
 * Check if the item should be in the breadcrumb
 *
 * Skips PTE blocks and inline objects from breadcrumbs
 */
export function shouldBeInBreadcrumb(itemPath: Path, path: Path, documentValue?: unknown): boolean {
  if (!documentValue) {
    return (
      itemPath.every((segment, index) => {
        return isArrayItemSelected(path[index], segment)
      }) && isArrayItemPath(itemPath)
    )
  }

  // Skip PTE blocks (object with children containing spans)
  // Need to have the ancestors as it makes a difference if we are checking a block that has immediate children vs a block that is deeply nested
  let currentValue: unknown = documentValue
  const ancestors = []
  for (const segment of itemPath) {
    ancestors.push(currentValue)
    if (typeof segment === 'string') {
      currentValue = (currentValue as Record<string, unknown>)?.[segment]
    } else if (typeof segment === 'object' && isKeySegment(segment)) {
      if (Array.isArray(currentValue)) {
        currentValue = currentValue.find((child) => child?._key === segment._key)
      }
    }
    if (!currentValue) break
  }

  // Skip PTE blocks (block-level object with ANY span child)
  if (currentValue && typeof currentValue === 'object' && '_type' in currentValue) {
    if (hasSpanChildren(currentValue)) return false
  }
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
 * This is needed for example in situations where deeply nested PTEs are used and a new item is added to the array each time
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
  let result: Path | null = null

  relativePath.forEach((segment, i) => {
    if (result !== null) return // Early exit if we already found a result

    if (!isKeySegment(segment)) {
      return
    }

    // This segment points to a specific item. Check if this item exists.
    const parentPath = relativePath.slice(0, i)
    const parentValue = getValueAtPath(documentValue, parentPath)

    // Tackles situations where a deeply nested PTE is used and a new item is added to the array each time
    // This is to prevent the dialog from attempting to navigate when the new key is not ready yet at multiple levels
    if (!Array.isArray(parentValue)) {
      // If parentValue is undefined or not an array
      // Return the parent path to point to the last valid level
      result = parentPath
      return
    }

    const itemExists = parentValue.some((item) => {
      return item && typeof item === 'object' && '_key' in item && item._key === segment._key
    })

    // If the item doesn't exist, point to the parent array instead (where the parent exists)
    if (!itemExists) {
      result = parentPath
    }
  })

  if (result !== null) {
    return result
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

/**
 * Determine if we should skip sibling display for the PTE block children array
 * when the selected item is an inline custom object (non-span).
 */
export function shouldSkipSiblingCount(args: {
  arraySchemaType: ArraySchemaType | unknown
  fieldPath: Path
}): boolean {
  const {arraySchemaType, fieldPath} = args

  const lastFieldSegment = fieldPath[fieldPath.length - 1]
  return isArrayOfBlocksSchemaType(arraySchemaType) && lastFieldSegment === 'children'
}
