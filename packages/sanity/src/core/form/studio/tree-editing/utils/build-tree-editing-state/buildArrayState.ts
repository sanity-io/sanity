import {toString} from '@sanity/util/paths'
import {
  type ArraySchemaType,
  EMPTY_ARRAY,
  getValueAtPath,
  isArrayOfPrimitivesSchemaType,
  isArraySchemaType,
  isPrimitiveSchemaType,
  isReferenceSchemaType,
  type ObjectSchemaType,
  type Path,
} from 'sanity'

import {getItemType} from '../../../../store/utils/getItemType'
import {type TreeEditingBreadcrumb, type TreeEditingMenuItem} from '../../types'
import {buildBreadcrumbsState} from './buildBreadcrumbsState'
import {type RecursiveProps, type TreeEditingState} from './buildTreeEditingState'
import {getRelativePath, isArrayItemSelected, shouldBeInBreadcrumb} from './utils'

interface BuildArrayState {
  arrayValue: Record<string, unknown>[]
  arraySchemaType: ArraySchemaType
  documentValue: unknown
  openPath: Path
  rootPath: Path
  recursive: (props: RecursiveProps) => TreeEditingState
}

export function buildArrayState(props: BuildArrayState): TreeEditingState {
  const {arraySchemaType, arrayValue, documentValue, openPath, rootPath, recursive} = props

  let relativePath: Path = []
  const menuItems: TreeEditingMenuItem[] = []
  const breadcrumbs: TreeEditingBreadcrumb[] = []

  if (arraySchemaType.options?.treeEditing === false) {
    return {
      breadcrumbs,
      menuItems,
      relativePath,
      rootTitle: '',
    }
  }

  arrayValue.forEach((item) => {
    const itemPath = [...rootPath, {_key: item._key}] as Path

    const itemSchemaField = getItemType(arraySchemaType, item) as ObjectSchemaType

    if (!itemSchemaField) return

    const childrenFields = itemSchemaField?.fields || []
    const childrenMenuItems: TreeEditingMenuItem[] = []

    const isReference = isReferenceSchemaType(itemSchemaField)

    // Do not include references
    if (isReference) return

    if (itemSchemaField?.options?.treeEditing === false) return

    if (shouldBeInBreadcrumb(itemPath, openPath)) {
      const breadcrumbsResult = buildBreadcrumbsState({
        arraySchemaType,
        arrayValue,
        itemPath,
        parentPath: rootPath,
      })

      breadcrumbs.push(breadcrumbsResult)
    }

    childrenFields.forEach((childField) => {
      const childPath = [...itemPath, childField.name] as Path
      const childValue = getValueAtPath(documentValue, childPath)

      const isPrimitive = isPrimitiveSchemaType(childField?.type)
      const isPortableText =
        isArraySchemaType(childField.type) && childField.type.of.some((t) => t.name === 'block')

      if (childField?.type?.options?.treeEditing === false) return

      if (isArrayItemSelected(childPath, openPath)) {
        relativePath = getRelativePath(childPath)
      }

      // Proceed with adding the child item to the menu item and breadcrumbs if:
      // - The child is not a primitive
      // - The child is not an array of primitives
      // - The child is an array
      // - The child has a value
      // - The child is not a portable text
      const isValid =
        !isPrimitive &&
        !isArrayOfPrimitivesSchemaType(childField.type) &&
        isArraySchemaType(childField.type) &&
        childValue &&
        !isPortableText

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
          schemaType: childField as ObjectSchemaType,
          documentValue,
          path: childPath,
          initial: false,
        })

        childrenMenuItems.push({
          children: childState?.menuItems || EMPTY_ARRAY,
          parentSchemaType: itemSchemaField,
          path: childPath,
          schemaType: childField as ObjectSchemaType,
          value: childValue,
        })

        return
      }

      // If `openPath` points to an array field within a portable text field,
      // set `relativePath` to the parent of the portable text field.
      // This ensures that the tree editing dialog opens at the parent level
      // of the portable text field.
      // Portable text fields manage their own dialogs, so we open the tree editing
      // dialog for the parent item and let the portable text field handle its
      // dialogs via `openPath`.
      if (isPortableText && toString(openPath).startsWith(toString(childPath))) {
        relativePath = getRelativePath(childPath)
      }
    })

    const isPrimitive = isPrimitiveSchemaType(itemSchemaField?.type)

    if (isArrayItemSelected(itemPath, openPath)) {
      relativePath = getRelativePath(itemPath)
    }

    if (!isPrimitive) {
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
