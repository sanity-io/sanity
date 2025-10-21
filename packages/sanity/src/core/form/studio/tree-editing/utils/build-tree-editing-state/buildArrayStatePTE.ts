import {
  type ArraySchemaType,
  isArrayOfBlocksSchemaType,
  isArrayOfObjectsSchemaType,
  isObjectSchemaType,
  type ObjectField,
  type ObjectSchemaType,
  type Path,
  type SchemaType,
} from '@sanity/types'
import {startsWith} from '@sanity/util/paths'

import {getValueAtPath} from '../../../../../field/paths/helpers'
import {EMPTY_ARRAY} from '../../../../../util/empty'
import {getItemType} from '../../../../store/utils/getItemType'
import {type BreadcrumbItem} from '../../types'
import {isPathTextInPTEField} from '../isPathTextInPTEField'
import {buildBreadcrumbsState} from './buildBreadcrumbsState'
import {type RecursiveProps, type TreeEditingState} from './buildTreeEditingState'
import {
  getRelativePath,
  isArrayItemSelected,
  shouldBeInBreadcrumb,
  shouldSkipSiblingCount,
  validateRelativePathExists,
} from './utils'

interface BuildArrayStatePTEProps {
  /** The child field that is a portable text editor */
  childField: ObjectField<SchemaType>
  /** The child path to the portable text field */
  childPath: Path
  /** The value of the portable text field */
  childValue: unknown
  /** The value of the document */
  documentValue: unknown
  /** The current `openPath` */
  openPath: Path
  /** The recursive function to build the tree editing state for nested fields */
  recursive: (props: RecursiveProps) => TreeEditingState
  /** The root schema type to check for portable text fields */
  rootSchemaType: ObjectSchemaType
  /** The breadcrumbs array to add to */
  breadcrumbs: BreadcrumbItem[]
  /** The children menu items array to add to */
  childrenMenuItems: BreadcrumbItem[]
}

/**
 * Build the state for a Portable Text Editor field.
 * This handles the special case of portable text blocks and their nested array fields.
 */
export function buildArrayStatePTE(props: BuildArrayStatePTEProps): {
  relativePath: Path | null
  breadcrumbs: BreadcrumbItem[]
  childrenMenuItems: BreadcrumbItem[]
  /** Map of path strings to their sibling arrays (including non-editable items, for example references)
   * Starts at 1
   */
  siblings: Map<string, {count: number; index: number}>
} {
  const {
    childField,
    childPath,
    childValue,
    documentValue,
    openPath,
    recursive,
    rootSchemaType,
    breadcrumbs,
    childrenMenuItems,
  } = props

  let relativePath: Path | null = null
  const siblings = new Map<string, {count: number; index: number}>()

  // Ensure we have an array to work with, even if empty
  const portableTextValue = Array.isArray(childValue) ? childValue : []

  // If openPath points to text content within this portable text field, we still need to process
  // the PTE to build siblings for nested arrays, but we won't set a relativePath
  const isTextContent = isPathTextInPTEField(rootSchemaType.fields, openPath, documentValue)

  // Process blocks within portable text
  portableTextValue.forEach((block: unknown) => {
    const blockObj = block as Record<string, unknown>
    if (!blockObj._key || !blockObj._type) return

    // Skip regular text blocks - only process custom object blocks
    if (blockObj._type === 'block') return

    const blockPath = [...childPath, {_key: blockObj._key}] as Path
    const blockSchemaType = getItemType(
      childField.type as ArraySchemaType,
      blockObj,
    ) as ObjectSchemaType

    if (!blockSchemaType?.fields) return

    // Check if openPath points to this block (for direct block editing like images)
    // Set relativePath if openPath points directly to this block
    if (isArrayItemSelected(blockPath, openPath)) {
      relativePath = getRelativePath(blockPath)

      /*const nonBlockArray = portableTextValue.filter((b) => {
        const bObj = b as Record<string, unknown>
        // Only count custom blocks (not regular text blocks)
        return bObj && bObj._type && bObj._type !== 'block'
      })

      // Store the index for the parent PTE array
      siblings.set(toString(childPath), {
        count: nonBlockArray.length,
        index: nonBlockArray.findIndex((b) => b._key === blockObj._key) + 1,
      })*/
    }

    // Add breadcrumb for the block if openPath starts with this block path
    // This handles both direct block selection and nested paths within the block
    const openPathStartsWithBlock = startsWith(blockPath, openPath)

    if (openPathStartsWithBlock && shouldBeInBreadcrumb(blockPath, openPath, documentValue)) {
      const blockBreadcrumb: BreadcrumbItem = {
        children: EMPTY_ARRAY,
        parentSchemaType: childField.type as ArraySchemaType,
        path: blockPath,
        schemaType: blockSchemaType,
        value: blockObj,
      }
      breadcrumbs.push(blockBreadcrumb)
    }

    // Collect nested menu items for this block
    const blockChildrenMenuItems: BreadcrumbItem[] = []

    // Process array fields within the block
    blockSchemaType.fields.forEach((blockField) => {
      if (
        isArrayOfObjectsSchemaType(blockField.type) &&
        !isArrayOfBlocksSchemaType(blockField.type)
      ) {
        const blockFieldPath = [...blockPath, blockField.name] as Path
        const blockFieldValue = getValueAtPath(documentValue, blockFieldPath)

        // If it points to the block itself (in which case we redirect to the first array field)
        // - this is the case for more nested levels of the PTE
        const openPathPointsToArrayField = startsWith(blockFieldPath, openPath)

        // This prevents overriding the block-level relativePath set above which is meant to be more general
        if (openPathPointsToArrayField) {
          // Use openPath as relativePath for more precise targeting
          // meaning that we in fact want to go deeper into the nested structure
          relativePath = getRelativePath(openPath)
          // Process array fields even if they're empty (for new blocks)
          // But ensure the value is at least an empty array for processing
          const arrayFieldValue = Array.isArray(blockFieldValue) ? blockFieldValue : []

          if (shouldBeInBreadcrumb(blockFieldPath, openPath, documentValue)) {
            const breadcrumbsResult = buildBreadcrumbsState({
              arraySchemaType: blockField.type as ArraySchemaType,
              arrayValue: arrayFieldValue as Record<string, unknown>[],
              itemPath: blockFieldPath,
              parentPath: blockPath,
            })
            breadcrumbs.push(breadcrumbsResult)
          }

          // Build nested structure
          const blockFieldState = recursive({
            documentValue,
            path: blockFieldPath,
            schemaType: blockField as ObjectSchemaType,
          })

          // Merge sibling counts from nested state
          const blockFieldPathString = toString(blockFieldPath)

          // If it's an inline custom object/object array/span, skip siblings
          const skipChildren = shouldSkipSiblingCount({
            arraySchemaType: childField.type as ArraySchemaType,
            fieldPath: blockFieldPath,
          })

          blockFieldState.siblings.forEach((info, pathString) => {
            if (skipChildren && pathString === blockFieldPathString) return
            siblings.set(pathString, info)
          })

          blockChildrenMenuItems.push({
            children: blockFieldState?.menuItems || EMPTY_ARRAY,
            parentSchemaType: blockSchemaType,
            path: blockFieldPath,
            schemaType: blockField as ObjectSchemaType,
            value: arrayFieldValue,
          })
        }
      }
    })

    if (isObjectSchemaType(blockSchemaType)) {
      // Add this block as a menu item (similar to how buildArrayState adds array items)
      childrenMenuItems.push({
        children: blockChildrenMenuItems,
        parentSchemaType: childField.type as ArraySchemaType,
        path: blockPath,
        schemaType: blockSchemaType,
        value: blockObj,
      })
    }
  })

  // Final check: if relativePath points to a non-existent item, point to the parent array instead
  // This handles new item creation (in portable text arrays) and is especially important in deeply nested level
  // This prevents the dialog from attempting to navigate when the new key is not ready yet
  // This is for deeply nested PTEs
  relativePath = validateRelativePathExists(relativePath, documentValue)

  return {
    relativePath: isTextContent ? null : relativePath,
    breadcrumbs,
    childrenMenuItems,
    siblings,
  }
}
