import {isArrayOfBlocksSchemaType, isKeySegment, type Path, type SchemaType} from '@sanity/types'
import {useMemo} from 'react'

import {resolveSchemaTypeForPath} from '../../studio/copyPaste/resolveSchemaTypeForPath'
import {useFormValue} from '../contexts/FormValue'

/**
 * Hook to get sibling info (index and count) for a breadcrumb item.
 * Returns null if the item is not in an array, can't be found, or is inside a PTE array.
 */
export function useBreadcrumbSiblingInfo(
  itemPath: Path,
  documentSchemaType: SchemaType,
  documentValue: unknown,
): {index: number; count: number} | null {
  // Find the last key segment in the path
  const lastKeySegmentIndex = useMemo(() => {
    for (let i = itemPath.length - 1; i >= 0; i--) {
      if (isKeySegment(itemPath[i])) {
        return i
      }
    }
    return -1
  }, [itemPath])

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

  return useMemo(() => {
    if (lastKeySegmentIndex < 0) return null

    // Skip sibling info for Portable Text arrays (arrays of blocks)
    if (parentArraySchemaType && isArrayOfBlocksSchemaType(parentArraySchemaType)) {
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
  }, [itemPath, lastKeySegmentIndex, parentArrayValue, parentArraySchemaType])
}
