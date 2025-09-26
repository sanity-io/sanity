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
      if (blockObj._type === 'block') {
        const blockPath = [...rootPath, {_key: blockObj._key}] as Path
        return toString(openPath).startsWith(toString(blockPath))
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

      // Handle portable text arrays - but only for custom object blocks that contain arrays
      // Regular text blocks (type: 'block') should not be processed as they can only be rendered
      // within the portable text editor context
      if (isPortableText && childValue && Array.isArray(childValue)) {
        // Check if the openPath points to an array field within a custom object block
        // OR if it points to a custom object block that contains array fields
        let foundMatchingArrayField = false

        childValue.forEach((block: unknown) => {
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
          if (!blockSchemaType || !blockSchemaType.fields || blockSchemaType.name === 'block')
            return

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

          if (openPathPointsToThisBlock) {
            // eslint-disable-next-line max-nested-callbacks
            blockSchemaType.fields.forEach((blockField) => {
              if (
                isArrayOfObjectsSchemaType(blockField.type) &&
                !isArrayOfBlocksSchemaType(blockField.type)
              ) {
                const blockFieldPath = [...blockPath, blockField.name] as Path
                const blockFieldValue = getValueAtPath(documentValue, blockFieldPath)

                // If this block has array fields with data, we should handle it
                if (
                  blockFieldValue &&
                  Array.isArray(blockFieldValue) &&
                  blockFieldValue.length > 0
                ) {
                  foundMatchingArrayField = true
                }
              }
            })
          }
        })

        // Only process if we found a matching array field in a custom object block
        if (foundMatchingArrayField) {
          childValue.forEach((block: unknown) => {
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
            if (!blockSchemaType || !blockSchemaType.fields || blockSchemaType.name === 'block')
              return

            // eslint-disable-next-line max-nested-callbacks
            blockSchemaType.fields.forEach((blockField) => {
              if (
                isArrayOfObjectsSchemaType(blockField.type) &&
                !isArrayOfBlocksSchemaType(blockField.type)
              ) {
                const blockFieldPath = [...blockPath, blockField.name] as Path
                const blockFieldValue = getValueAtPath(documentValue, blockFieldPath)

                if (
                  blockFieldValue &&
                  Array.isArray(blockFieldValue) &&
                  blockFieldValue.length > 0
                ) {
                  // Check if the openPath points to this array within the block
                  // OR if it points to the block itself (in which case we redirect to the first array field)
                  const openPathPointsToBlock = toString(openPath).startsWith(toString(blockPath))
                  const openPathPointsToArrayField = toString(openPath).startsWith(
                    toString(blockFieldPath),
                  )

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
                      arrayValue: blockFieldValue as Record<string, unknown>[],
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
                    value: blockFieldValue,
                  })
                }
              }
            })
          })
        }
      }
    })

    if (isArrayItemSelected(itemPath, openPath)) {
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

  return {
    breadcrumbs,
    menuItems,
    relativePath,
    rootTitle: '',
  }
}
