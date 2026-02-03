import {
  isArrayOfBlocksSchemaType,
  isKeySegment,
  isObjectSchemaType,
  type Path,
  type SchemaType,
} from '@sanity/types'
import {useMemo} from 'react'

import {resolveSchemaTypeForPath} from '../../studio/copyPaste/resolveSchemaTypeForPath'
import {useFormValue} from '../contexts/FormValue'
import {shouldSkipSiblingCount} from '../studio/tree-editing/utils/build-tree-editing-state/utils'

/**
 * Hook to get sibling info (index and count) for a breadcrumb item.
 * Returns null if the item is not in an array, can't be found, or is an object directly inside a PTE array.
 */
export function useBreadcrumbSiblingInfo(
  itemPath: Path,
  documentSchemaType: SchemaType,
  documentValue: unknown,
): {index: number; count: number} | null {
  // Check if the last segment is a key segment (determines if we're in an array)
  const hasKeySegment = isKeySegment(itemPath[itemPath.length - 1])

  // Find the last key segment in the path
  const lastKeySegmentIndex = itemPath.findLastIndex(isKeySegment)

  // Get the parent array path (path up to but not including the key segment)
  const parentArrayPath = useMemo(() => {
    if (lastKeySegmentIndex < 0) return []
    return itemPath.slice(0, lastKeySegmentIndex)
  }, [itemPath, lastKeySegmentIndex])

  // Get the parent array value
  const parentArrayValue = useFormValue(parentArrayPath)

  // Get the schema type for the parent array to check if it's a PTE
  const parentArraySchemaType = useMemo(
    () => resolveSchemaTypeForPath(documentSchemaType, parentArrayPath, documentValue),
    [documentSchemaType, parentArrayPath, documentValue],
  )

  // Check if parent is "children" inside a PTE block (for inline objects)
  // Pattern: ["pteField", {_key}, "children", {_key}]
  const isInsidePTEChildren = useMemo(() => {
    if (parentArrayPath.length < 3) return false
    // Path to PTE array: parentArrayPath minus "children" and the block key
    const pteArrayPath = parentArrayPath.slice(0, -2)
    const pteSchemaType = resolveSchemaTypeForPath(documentSchemaType, pteArrayPath, documentValue)
    return shouldSkipSiblingCount({
      arraySchemaType: pteSchemaType,
      fieldPath: parentArrayPath,
    })
  }, [parentArrayPath, documentSchemaType, documentValue])

  // Get the schema type for the current item
  const itemSchemaType = useMemo(
    () => resolveSchemaTypeForPath(documentSchemaType, itemPath, documentValue),
    [documentSchemaType, itemPath, documentValue],
  )

  return useMemo(() => {
    // Early exit if not a key segment, this means that it will be an array itself and not a nested object
    if (!hasKeySegment) return null

    if (lastKeySegmentIndex < 0) return null

    const isObjectType = isObjectSchemaType(itemSchemaType)

    // Skip sibling info for objects whose immediate parent is a PTE array
    const isParentPTE = parentArraySchemaType && isArrayOfBlocksSchemaType(parentArraySchemaType)
    if (isObjectType && isParentPTE) {
      return null
    }

    // Skip sibling info for objects inside "children" of a PTE block (inline objects)
    if (isObjectType && isInsidePTEChildren) {
      return null
    }

    const keySegment = itemPath[lastKeySegmentIndex]
    if (!isKeySegment(keySegment)) return null

    const arrayValue = parentArrayValue as Array<{_key: string}> | undefined
    if (!Array.isArray(arrayValue)) return null

    const index = arrayValue.findIndex((item) => item._key === keySegment._key)
    if (index < 0) return null

    return {
      index: index + 1, // 1-based index for display
      count: arrayValue.length,
    }
  }, [
    hasKeySegment,
    itemPath,
    lastKeySegmentIndex,
    parentArrayValue,
    parentArraySchemaType,
    itemSchemaType,
    isInsidePTEChildren,
  ])
}
