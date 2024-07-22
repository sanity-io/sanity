import {toString} from '@sanity/util/paths'
import {
  type ArraySchemaType,
  getValueAtPath,
  isArrayOfBlocksSchemaType,
  isArrayOfObjectsSchemaType,
  isObjectSchemaType,
  isReferenceSchemaType,
  type ObjectField,
  type ObjectSchemaType,
  type Path,
  type SchemaType,
} from 'sanity'

import {getItemType} from '../../../../store/utils/getItemType'
import {type ArrayEditingBreadcrumb} from '../../types'
import {findArrayTypePaths} from '../findArrayTypePaths'
import {getSchemaField} from '../getSchemaField'
import {type ArrayEditingState, type RecursiveProps} from './buildArrayEditingState'
import {buildBreadcrumbsState} from './buildBreadcrumbsState'
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
  recursive: (props: RecursiveProps) => ArrayEditingState
  /** The root path of the array */
  rootPath: Path
}

/**
 * Build the state for an array field.
 */
export function buildArrayState(props: BuildArrayState): ArrayEditingState {
  const {arraySchemaType, arrayValue, documentValue, openPath, rootPath, recursive} = props

  let relativePath: Path = []
  const breadcrumbs: ArrayEditingBreadcrumb[] = []

  // If tree editing is disabled for the array field, return early.
  if (arraySchemaType.options?.treeEditing === false) {
    return {
      breadcrumbs,
      relativePath,
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
      // If there are array fields within the child field, recursively build the
      // state for the array fields.
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

          // Recursively build the state for the array field.
          recursive({
            documentValue,
            path: fieldPath,
            schemaType: nestedArrayField as ObjectSchemaType,
          })
        })
      }

      const isPortableText = isArrayOfBlocksSchemaType(childField.type)
      const isValid = isArrayOfObjectsSchemaType(childField.type) && childValue && !isPortableText

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

        recursive({
          documentValue,
          path: childPath,
          schemaType: childField as ObjectSchemaType,
        })

        return
      }

      // If `openPath` points to an array field within a portable text field,
      // set `relativePath` to the parent of the portable text field.
      // This ensures that the array editing dialog opens at the parent level
      // of the portable text field.
      // Portable text fields manage their own dialogs, so we open the array editing
      // dialog for the parent item and let the portable text field handle its
      // dialogs via `openPath`.
      if (isPortableText && toString(openPath).startsWith(toString(childPath))) {
        relativePath = getRelativePath(childPath)
      }
    })

    if (isArrayItemSelected(itemPath, openPath)) {
      relativePath = getRelativePath(itemPath)
    }
  })

  return {
    breadcrumbs,
    relativePath,
  }
}
