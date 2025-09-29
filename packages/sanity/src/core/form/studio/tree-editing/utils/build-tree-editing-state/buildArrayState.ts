import {
  type ArraySchemaType,
  isArrayOfBlocksSchemaType,
  isArrayOfObjectsSchemaType,
  isObjectSchemaType,
  isPrimitiveSchemaType,
  isReferenceSchemaType,
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
import {findArrayTypePaths} from '../findArrayTypePaths'
import {getSchemaField} from '../getSchemaField'
import {buildBreadcrumbsState} from './buildBreadcrumbsState'
import {type RecursiveProps, type TreeEditingState} from './buildTreeEditingState'
import {getRelativePath, isArrayItemSelected, shouldBeInBreadcrumb} from './utils'

interface BuildArrayState {
  /** The schema type of the array field  */
  arraySchemaType: ArraySchemaType
  /** The value of the array field */
  arrayValue: Record<string, unknown>[]
  /**  The value of the document */
  documentValue: unknown
  /** The current `openPath` */
  openPath: Path
  /** The recursive function to build the tree editing state for nested fields */
  recursive: (props: RecursiveProps) => TreeEditingState
  /** The root path of the array */
  rootPath: Path
}

/**
 * Build the tree editing state for an array field.
 */
export function buildArrayState(props: BuildArrayState): TreeEditingState {
  const {arraySchemaType, arrayValue, documentValue, openPath, rootPath, recursive} = props

  let relativePath: Path = []
  const menuItems: TreeEditingMenuItem[] = []
  const breadcrumbs: TreeEditingBreadcrumb[] = []

  // If tree editing is disabled for the array field, return early.
  if (arraySchemaType.options?.treeEditing === false) {
    return {
      breadcrumbs,
      menuItems,
      relativePath,
      rootTitle: '',
    }
  }

  // Check if this is a PortableText array and if the openPath points to a regular text block
  // If so, return empty state to prevent tree editing dialog from opening
  // Example: when I am clicking a normal text
  if (isArrayOfBlocksSchemaType(arraySchemaType)) {
    const openPathPointsToRegularTextBlock = arrayValue.some((item) => {
      const blockObj = item as Record<string, unknown>
      if (!blockObj._key || !blockObj._type) return false

      // Check if this is a regular text block and openPath points to it
      // This makes sure that we don't go further into the dialog when clicking on a regular text block
      // because it is not necessary
      if (blockObj._type === 'block') {
        const blockPath = [...rootPath, {_key: blockObj._key}] as Path
        const pathMatches = toString(openPath).startsWith(toString(blockPath))

        return pathMatches
      }
      return false
    })

    // If openPath points to a regular text block, return empty state
    if (openPathPointsToRegularTextBlock) {
      return {
        breadcrumbs,
        menuItems,
        relativePath,
        rootTitle: '',
      }
    }
  }

  // Iterate over the values of the array field.
  arrayValue.forEach((item) => {
    // Construct the path to the array item.
    const itemPath = [...rootPath, {_key: item._key}] as Path

    // Get the schema field for the array item.
    const itemSchemaField = getItemType(arraySchemaType, item) as ObjectSchemaType

    if (!itemSchemaField) return
    if (isReferenceSchemaType(itemSchemaField)) return
    if (itemSchemaField?.options?.treeEditing === false) return

    const childrenFields = itemSchemaField?.fields || []
    const childrenMenuItems: TreeEditingMenuItem[] = []

    if (shouldBeInBreadcrumb(itemPath, openPath)) {
      const breadcrumbsResult = buildBreadcrumbsState({
        arraySchemaType,
        arrayValue,
        itemPath,
        parentPath: rootPath,
      })

      breadcrumbs.push(breadcrumbsResult)
    }

    // Iterate over the fields of the array item to resolve any nested fields.
    childrenFields.forEach((childField) => {
      if (childField?.type?.options?.treeEditing === false) return

      // Construct the path to the child field.
      const childPath = [...itemPath, childField.name] as Path

      // Get the value of the child field.
      const childValue = getValueAtPath(documentValue, childPath)

      if (isArrayItemSelected(childPath, openPath)) {
        relativePath = getRelativePath(childPath)
      }

      // If the child field is an object field, check if it contains any array fields.
      // If there are array fields within the child field, recursively build the tree
      // editing state for them.
      if (isObjectSchemaType(childField.type)) {
        // Find the paths of any array fields within the child field.
        const arrayPaths = findArrayTypePaths(childField.type.fields)

        // If there are no array fields within the child field, return early.
        if (arrayPaths.length === 0) return

        // Iterate over the paths of the array fields within the child field.
        arrayPaths.forEach((arrayPath) => {
          // Construct the path to the array field.
          const fieldPath = [...childPath, ...arrayPath] as Path

          // Get the schema field for the array field.
          const nestedArrayField = getSchemaField(
            childField.type,
            toString(arrayPath),
          ) as ObjectField<SchemaType>

          // Get the value of the array field.
          const arrayFieldValue_ = getValueAtPath(documentValue, fieldPath)
          const arrayFieldValue = Array.isArray(arrayFieldValue_) ? arrayFieldValue_ : []

          // If the array field has no value or tree editing is disabled, return early.
          if (!arrayFieldValue.length) return
          if (nestedArrayField.type.options?.treeEditing === false) return

          // Update the relative path if the array field is selected.
          if (isArrayItemSelected(fieldPath, openPath)) {
            relativePath = getRelativePath(fieldPath)
          }

          // Recursively build the tree editing state for the array field.
          const nestedArrayState = recursive({
            documentValue,
            path: fieldPath,
            schemaType: nestedArrayField as ObjectSchemaType,
          })

          // Add the state of the array field to the children menu items.
          childrenMenuItems.push({
            children: nestedArrayState.menuItems,
            parentSchemaType: childField.type,
            path: fieldPath,
            schemaType: nestedArrayField.type,
            value: arrayFieldValue,
          })
        })
      }

      const isPortableText = isArrayOfBlocksSchemaType(childField.type)
      const isValid = isArrayOfObjectsSchemaType(childField.type) && childValue && !isPortableText

      // Handle regular arrays of objects (not portable text)
      if (isValid) {
        if (shouldBeInBreadcrumb(childPath, openPath)) {
          const breadcrumbsResult = buildBreadcrumbsState({
            arraySchemaType: childField.type as ArraySchemaType,
            arrayValue: childValue as Record<string, unknown>[],
            itemPath: childPath,
            parentPath: itemPath,
          })

          breadcrumbs.push(breadcrumbsResult)
        }

        const childState = recursive({
          documentValue,
          path: childPath,
          schemaType: childField as ObjectSchemaType,
        })

        childrenMenuItems.push({
          children: childState?.menuItems || EMPTY_ARRAY,
          parentSchemaType: itemSchemaField,
          path: childPath,
          schemaType: childField as ObjectSchemaType,
          value: childValue,
        })
      }

      // Handle portable text arrays - process even if empty to handle new item creation
      // Regular text blocks (type: 'block') should not be processed as they can only be rendered
      // within the portable text editor context
      if (isPortableText) {
        // Ensure we have an array to work with, even if empty
        const portableTextValue = Array.isArray(childValue) ? childValue : []
        // Check if the openPath points to a regular text block anywhere within this portable text field
        // We need to check if the openPath contains patterns that indicate it's pointing to a text block
        const openPathString = toString(openPath)
        const childPathString = toString(childPath)

        // If the openPath starts with this childPath and contains 'children',
        // It's pointing at a regular text block
        const pointsToTextContent =
          openPathString.startsWith(childPathString) && openPathString.includes('.children')

        // If openPath points to text content within this portable text field, skip processing
        if (pointsToTextContent) {
          return
        }

        // Check if the openPath points to an array field within a custom object block
        // OR if it points to a custom object block that contains array fields

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

          // Only process if this is a custom object block (not a regular text block)
          if (!blockSchemaType || !blockSchemaType.fields) {
            return
          }

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
        })

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

          // Only process if this is a custom object block
          if (!blockSchemaType || !blockSchemaType.fields) return

          // eslint-disable-next-line max-nested-callbacks
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

              // Check if the openPath points to this array within the block
              // OR if it points to the block itself (in which case we redirect to the first array field)
              const openPathPointsToBlock = toString(openPath).startsWith(toString(blockPath))
              const openPathPointsToArrayField = toString(openPath).startsWith(
                toString(blockFieldPath),
              )

              // Process this array field if openPath points to it or to the parent block
              if (openPathPointsToArrayField || openPathPointsToBlock) {
                // Set relativePath based on where openPath points
                if (openPathPointsToArrayField) {
                  // If openPath points to the array field or deeper within it, use openPath as relativePath
                  relativePath = getRelativePath(openPath)
                } else if (openPathPointsToBlock && relativePath.length === 0) {
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

                const blockFieldState = recursive({
                  documentValue,
                  path: blockFieldPath,
                  schemaType: blockField as ObjectSchemaType,
                })

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
      }
    })

    if (isArrayItemSelected(itemPath, openPath) && relativePath.length === 0) {
      relativePath = getRelativePath(itemPath)
    }

    if (!isPrimitiveSchemaType(itemSchemaField?.type)) {
      menuItems.push({
        children: childrenMenuItems,
        parentSchemaType: arraySchemaType,
        path: itemPath as Path,
        schemaType: itemSchemaField as ObjectSchemaType,
        value: item,
      })
    }
  })

  // Final check: if relativePath points to a non-existent item, point to the parent array instead
  // This handles new item creation (in portable text arrays) at any nesting level
  if (relativePath.length > 0) {
    const relativePathString = toString(relativePath)
    const keyMatch = relativePathString.match(/\[_key=="([^"]+)"\]$/)

    if (keyMatch) {
      // This relativePath points to a specific item. Check if this item exists.
      const parentPath = relativePath.slice(0, -1)
      const parentValue = getValueAtPath(documentValue, parentPath)

      if (Array.isArray(parentValue)) {
        const itemKey = keyMatch[1]
        const itemExists = parentValue.some((item) => {
          return item && typeof item === 'object' && '_key' in item && item._key === itemKey
        })

        // If the item doesn't exist, point to the parent array instead
        if (!itemExists) {
          relativePath = parentPath
        }
      }
    }
  }

  return {
    breadcrumbs,
    menuItems,
    relativePath,
    rootTitle: '',
  }
}
