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
import {startsWith, toString} from '@sanity/util/paths'

import {getValueAtPath} from '../../../../../field/paths/helpers'
import {EMPTY_ARRAY} from '../../../../../util/empty'
import {getItemType} from '../../../../store/utils/getItemType'
import {type DialogItem} from '../../types'
import {findArrayTypePaths} from '../findArrayTypePaths'
import {getSchemaField} from '../getSchemaField'
import {isPathTextInPTEField} from '../isPathTextInPTEField'
import {buildArrayStatePTE} from './buildArrayStatePTE'
import {buildBreadcrumbsState} from './buildBreadcrumbsState'
import {type RecursiveProps, type TreeEditingState} from './buildTreeEditingState'
import {
  getRelativePath,
  isArrayItemSelected,
  shouldBeInBreadcrumb,
  shouldSkipSiblingCount,
  validateRelativePathExists,
} from './utils'

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
  /** The root schema type to check for portable text fields */
  rootSchemaType: ObjectSchemaType
}

/**
 * Build the tree editing state for an array field.
 */
export function buildArrayState(props: BuildArrayState): TreeEditingState {
  const {
    arraySchemaType,
    arrayValue,
    documentValue,
    openPath,
    rootPath,
    recursive,
    rootSchemaType,
  } = props

  let relativePath: Path = []
  const menuItems: DialogItem[] = []
  const breadcrumbs: DialogItem[] = []
  const siblings = new Map<string, {count: number; index: number}>()

  // This is specifically needed for Portable Text editors that are at a root level in the document
  // In that case, and if the openPath points to a regular text block (such as when you write it), we return empty state
  // Since this SHOULDN'T open the dialog
  if (
    isArrayOfBlocksSchemaType(arraySchemaType) &&
    isPathTextInPTEField(rootSchemaType.fields, openPath, documentValue)
  ) {
    return {
      breadcrumbs,
      menuItems,
      relativePath,
      rootTitle: '',
      siblings,
    }
  }

  // Iterate over the values of the array field.
  arrayValue.forEach((item, arrayIndex) => {
    // Construct the path to the array item.
    const itemPath = [...rootPath, {_key: item._key}] as Path

    // Get the schema field for the array item.
    const itemSchemaField = getItemType(arraySchemaType, item) as ObjectSchemaType

    if (!itemSchemaField) return
    // Skip references early, references are handled by the reference input and shouldn't open the enhanced dialog
    if (isReferenceSchemaType(itemSchemaField)) return

    // Check if this is the currently selected item and store its index
    if (isArrayItemSelected(itemPath, openPath)) {
      relativePath = getRelativePath(itemPath)
    }

    // Check if openPath is within this array item (for fields within the item)
    // This needs to be less strict than the isArrayItemSelected check
    // Because from a UI perspective we're still within the item
    // Important: do NOT set siblings for Portable Text arrays (arrays of blocks) as we handle them differently
    if (
      item._key &&
      startsWith(itemPath, openPath) &&
      !isArrayOfBlocksSchemaType(arraySchemaType)
    ) {
      // Store sibling info on the parent array path (header reads parent of relativePath)
      siblings.set(toString(rootPath), {count: arrayValue.length, index: arrayIndex + 1})
    }

    const childrenFields = itemSchemaField?.fields || []
    const childrenMenuItems: DialogItem[] = []

    if (shouldBeInBreadcrumb(itemPath, openPath, documentValue)) {
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
      // Construct the path to the child field.
      const childPath = [...itemPath, childField.name] as Path

      // Get the value of the child field.
      const childValue = getValueAtPath(documentValue, childPath)

      // Skip references early, references are handled by the reference input and shouldn't open the enhanced dialog
      if (isReferenceSchemaType(childField.type)) return

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

          // Skip references early, references are handled by the reference input and shouldn't open the enhanced dialog
          if (isReferenceSchemaType(nestedArrayField.type)) return

          // If the child array field has custom components.input, skip building dialog
          if (isArrayOfObjectsSchemaType(nestedArrayField.type)) {
            const nestedArraySchemaType = nestedArrayField.type as ArraySchemaType
          }

          // Update the relative path if the array field is selected.
          if (isArrayItemSelected(fieldPath, openPath)) {
            relativePath = getRelativePath(fieldPath)
          }

          const updateNestedArrayIndex = (nestedItem: unknown, nestedIndex: number) => {
            const nestedItemObj = nestedItem as Record<string, unknown>
            const nestedItemPath = [...fieldPath, {_key: nestedItemObj._key}] as Path

            // Check if openPath is within this nested array item (for fields within the item)
            // Avoids setting siblings that we do not care about
            if (startsWith(nestedItemPath, openPath)) {
              siblings.set(toString(fieldPath), {
                count: arrayFieldValue.length,
                index: nestedIndex + 1,
              })
            }
          }
          arrayFieldValue.forEach(updateNestedArrayIndex)

          // Recursively build the tree editing state for the array field.
          const nestedArrayState = recursive({
            documentValue,
            path: fieldPath,
            schemaType: nestedArrayField as ObjectSchemaType,
          })

          // Merge sibling counts from nested state
          nestedArrayState.siblings.forEach((info, pathString) => {
            siblings.set(pathString, info)
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
      const IsArrayOfObjects =
        isArrayOfObjectsSchemaType(childField.type) && childValue && !isPortableText

      // Handle regular arrays of objects (not portable text)
      if (IsArrayOfObjects) {
        const childArray = Array.isArray(childValue) ? childValue : []

        // Check if any item in this array is selected and update the index
        const updateChildArrayIndex = (childItem: unknown, childIndex: number) => {
          const childItemObj = childItem as Record<string, unknown>
          const childItemPath = [...childPath, {_key: childItemObj._key}] as Path
          if (startsWith(childItemPath, openPath)) {
            // When the parent array is a PTE (array of blocks) and this child array is the block's
            // 'children' array, skip siblings so inline custom objects don't show siblings
            const isBlockChildrenArray =
              isArrayOfBlocksSchemaType(arraySchemaType) && childField.name === 'children'

            if (!isBlockChildrenArray) {
              siblings.set(toString(childPath), {count: childArray.length, index: childIndex + 1})
            }
          }
        }
        childArray.forEach(updateChildArrayIndex)

        if (shouldBeInBreadcrumb(childPath, openPath, documentValue)) {
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

        // Merge sibling counts from child state
        const childPathString = toString(childPath)
        const skipChildArraySiblings = shouldSkipSiblingCount({
          arraySchemaType,
          fieldPath: childPath,
        })

        // If it's an inline custom object/object array/span, skip siblings
        childState.siblings.forEach((info, pathString) => {
          if (skipChildArraySiblings && pathString === childPathString) return
          siblings.set(pathString, info)
        })

        childrenMenuItems.push({
          children: childState?.menuItems || EMPTY_ARRAY,
          parentSchemaType: itemSchemaField,
          path: childPath,
          schemaType: childField as ObjectSchemaType,
          value: childValue,
        })
      }

      // Handle portable text editors inside an array of objects
      if (isPortableText) {
        const pteResult = buildArrayStatePTE({
          childField,
          childPath,
          childValue,
          documentValue,
          openPath,
          recursive,
          rootSchemaType,
          breadcrumbs,
          childrenMenuItems,
        })

        // Merge sibling counts from PTE result
        pteResult.siblings.forEach((info, pathString) => {
          siblings.set(pathString, info)
        })

        // This is needed for cases where new blocks are added to the array within a PTE
        // This will make sure that the relative path is updated with the PTE path only when it should
        if (
          pteResult.relativePath &&
          pteResult.relativePath !== null &&
          relativePath.length === 0
        ) {
          relativePath = pteResult.relativePath
        }
      }
    })

    // Update the relative path if the array item is selected
    // this is specifically done for the case where the array of objects is not nested (exists in the root of the document)
    if (isArrayItemSelected(itemPath, openPath) && !isReferenceSchemaType(itemSchemaField?.type)) {
      relativePath = getRelativePath(itemPath)
    }

    // In cases of primitive types, we don't want to show the menu items
    // the menu items were used for the breadcrumbs for sibling navigation but it's not something we want to use right now explicitly
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
  // This handles new item creation and is especially important in deeply nested structures
  // This prevents the dialog from attempting to navigate when the new key is not ready yet
  relativePath = validateRelativePathExists(relativePath, documentValue) as Path

  return {
    breadcrumbs,
    menuItems,
    relativePath,
    rootTitle: '',
    siblings,
  }
}
