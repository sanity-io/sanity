import {
  type ArraySchemaType,
  isArrayOfBlocksSchemaType,
  isArrayOfObjectsSchemaType,
  isKeySegment,
  type ObjectField,
  type ObjectSchemaType,
  type Path,
  type SchemaType,
} from '@sanity/types'
import {toString} from '@sanity/util/paths'

import {getValueAtPath} from '../../../../../field/paths/helpers'
import {EMPTY_ARRAY} from '../../../../../util/empty'
import {getItemType} from '../../../../store/utils/getItemType'
import {type TreeEditingBreadcrumb, type TreeEditingMenuItem} from '../../types'
import {isPathTextInPTEField} from '../isPathTextInPTEField'
import {buildBreadcrumbsState} from './buildBreadcrumbsState'
import {type RecursiveProps, type TreeEditingState} from './buildTreeEditingState'
import {getRelativePath, shouldBeInBreadcrumb} from './utils'

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
  breadcrumbs: TreeEditingBreadcrumb[]
  /** The children menu items array to add to */
  childrenMenuItems: TreeEditingMenuItem[]
}

/**
 * Build the state for a Portable Text Editor field.
 * This handles the special case of portable text blocks and their nested array fields.
 */
export function buildArrayStatePTE(props: BuildArrayStatePTEProps): {
  relativePath: Path | null
  breadcrumbs: TreeEditingBreadcrumb[]
  childrenMenuItems: TreeEditingMenuItem[]
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

  // Ensure we have an array to work with, even if empty
  const portableTextValue = Array.isArray(childValue) ? childValue : []

  // If openPath points to text content within this portable text field, skip processing
  // This avoids false positives with regular object fields named 'children'
  if (isPathTextInPTEField(rootSchemaType.fields, openPath)) {
    return {
      relativePath: null, // This will mean that we don't want the path to update in the Array State
      breadcrumbs,
      childrenMenuItems,
    }
  }

  // Process blocks within portable text
  portableTextValue.forEach((block: unknown) => {
    const blockObj = block as Record<string, unknown>
    if (!blockObj._key || !blockObj._type) return

    // Skip regular text blocks - only process custom object blocks
    // This is usually text - this is handled further down or by the PTE itself
    if (blockObj._type === 'block') return

    const blockPath = [...childPath, {_key: blockObj._key}] as Path
    const blockSchemaType = getItemType(
      childField.type as ArraySchemaType,
      blockObj,
    ) as ObjectSchemaType

    // Handle breadcrumbs for blocks that already exist
    if (blockSchemaType && blockSchemaType.fields) {
      // Check if openPath points to this block itself or to an array field within it
      const openPathPointsToThisBlock = toString(openPath).startsWith(toString(blockPath))

      // Add breadcrumb for the PortableText block object if openPath points to it
      if (openPathPointsToThisBlock && shouldBeInBreadcrumb(blockPath, openPath)) {
        const blockBreadcrumb: TreeEditingBreadcrumb = {
          children: EMPTY_ARRAY,
          parentSchemaType: childField.type as ArraySchemaType,
          path: blockPath,
          schemaType: blockSchemaType,
          value: blockObj,
        }
        breadcrumbs.push(blockBreadcrumb)
      }
    }

    blockSchemaType.fields.forEach((blockField) => {
      if (
        isArrayOfObjectsSchemaType(blockField.type) &&
        !isArrayOfBlocksSchemaType(blockField.type)
      ) {
        const blockFieldPath = [...blockPath, blockField.name] as Path
        const blockFieldValue = getValueAtPath(documentValue, blockFieldPath)

        // Process array fields even if they're empty (for new blocks)
        // But ensure the value is at least an empty array for processing
        const arrayFieldValue = Array.isArray(blockFieldValue) ? blockFieldValue : []

        // Check if the openPath points to this array within the block - this is to check in the first nested level of the PTE
        // To allow to open that block further
        const openPathPointsToBlock = toString(openPath).startsWith(toString(blockPath))
        // OR if it points to the block itself (in which case we redirect to the first array field)
        // - this is the case for more nested levels of the PTE
        const openPathPointsToArrayField = toString(openPath).startsWith(toString(blockFieldPath))

        // Process this array field if openPath points to it or to the parent block
        if (openPathPointsToBlock || openPathPointsToArrayField) {
          if (openPathPointsToArrayField) {
            // If openPath points to the array field or deeper within it, use openPath as relativePath
            relativePath = getRelativePath(openPath)
          } else if (openPathPointsToBlock) {
            // If openPath points to the block itself, redirect to the array field
            relativePath = getRelativePath(blockFieldPath)
          }

          if (shouldBeInBreadcrumb(blockFieldPath, openPath)) {
            const breadcrumbsResult = buildBreadcrumbsState({
              arraySchemaType: blockField.type as ArraySchemaType,
              arrayValue: arrayFieldValue as Record<string, unknown>[],
              itemPath: blockFieldPath,
              parentPath: blockPath,
            })

            breadcrumbs.push(breadcrumbsResult)
          }

          // As always this is needed to build the structure for even more potentially nested fields
          const blockFieldState = recursive({
            documentValue,
            path: blockFieldPath,
            schemaType: blockField as ObjectSchemaType,
          })

          // This is currently not needed but in the future we might want to do something with sibling items
          // And since the structure is already built, I am simply keeping it here for future use
          childrenMenuItems.push({
            children: blockFieldState?.menuItems || EMPTY_ARRAY,
            parentSchemaType: blockSchemaType,
            path: blockFieldPath,
            schemaType: blockField as ObjectSchemaType,
            value: arrayFieldValue,
          })
        }
      }
    })
  })

  // Final check: if relativePath points to a non-existent item, point to the parent array instead
  // This handles new item creation (in portable text arrays) and is especially important in deeply nested level
  // This prevents the dialog from attempting to navigate when the new key is not ready yet
  const currentRelativePath = relativePath as Path | null
  if (currentRelativePath !== null && currentRelativePath.length > 0) {
    const lastSegment = currentRelativePath[currentRelativePath.length - 1]

    if (isKeySegment(lastSegment)) {
      // This relativePath points to a specific item. Check if this item exists.
      const parentPath = currentRelativePath.slice(0, -1)
      const parentValue = getValueAtPath(documentValue, parentPath)

      if (Array.isArray(parentValue)) {
        const itemExists = parentValue.some((item) => {
          return (
            item && typeof item === 'object' && '_key' in item && item._key === lastSegment._key
          )
        })

        // If the item doesn't exist, point to the parent array instead
        if (!itemExists) {
          relativePath = parentPath
        }
      }
    }
  }

  return {
    relativePath,
    breadcrumbs,
    childrenMenuItems,
  }
}
