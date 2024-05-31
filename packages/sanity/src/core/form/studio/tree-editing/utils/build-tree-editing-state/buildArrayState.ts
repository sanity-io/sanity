import {
  type ArraySchemaType,
  EMPTY_ARRAY,
  getSchemaTypeTitle,
  getValueAtPath,
  isArrayOfPrimitivesSchemaType,
  isArraySchemaType,
  isPrimitiveSchemaType,
  isReferenceSchemaType,
  type ObjectSchemaType,
  type Path,
} from 'sanity'

import {type TreeEditingBreadcrumb, type TreeEditingMenuItem} from '../../types'
import {getArrayItemPreview} from '../getArrayItemPreview'
import {buildBreadcrumbsState} from './buildBreadcrumbsState'
import {type RecursiveProps, type TreeEditingState} from './buildTreeEditingState'
import {getRelativePath, isSelected, shouldBeInBreadcrumb} from './utils'

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

  arrayValue.forEach((item) => {
    const itemPath = [...rootPath, {_key: item._key}] as Path
    const itemType = item?._type as string

    const itemSchemaField = arraySchemaType?.of?.find(
      (type) => type.name === itemType,
    ) as ObjectSchemaType

    const childrenFields = itemSchemaField?.fields || []
    const childrenMenuItems: TreeEditingMenuItem[] = []

    const isReference = isReferenceSchemaType(itemSchemaField)

    // if the item is a reference, we don't want to add it to the menu / breadcrumbs
    if (isReference) {
      return
    }

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

      if (isSelected(childPath, openPath)) {
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

        // Get the title of the parent item (the value)
        const parentTitle = getArrayItemPreview({arrayItem: item, arraySchemaType}).title

        childrenMenuItems.push({
          title: getSchemaTypeTitle(childField.type) as string,
          path: childPath,
          children: childState?.menuItems || EMPTY_ARRAY,
          parentTitle,
        })
      }
    })

    const isPrimitive = isPrimitiveSchemaType(itemSchemaField?.type)

    const {title} = getArrayItemPreview({arrayItem: item, arraySchemaType})
    const parentTitle = getSchemaTypeTitle(arraySchemaType) as string

    if (isSelected(itemPath, openPath)) {
      relativePath = getRelativePath(itemPath)
    }

    if (!isPrimitive) {
      menuItems.push({
        title,
        path: itemPath as Path,
        children: childrenMenuItems,
        parentTitle,
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
