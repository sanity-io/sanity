import {
  type ArraySchemaType,
  EMPTY_ARRAY,
  getSchemaTypeTitle,
  getValueAtPath,
  isArrayOfPrimitivesSchemaType,
  isArraySchemaType,
  isPrimitiveSchemaType,
  type ObjectSchemaType,
  type Path,
} from 'sanity'

import {type TreeEditingBreadcrumb, type TreeEditingMenuItem} from '../../types'
import {buildBreadcrumbsState} from './buildBreadcrumbsState'
import {type RecursiveProps, type TreeEditingState} from './buildTreeEditingState'
import {getRelativePath, isSelected, shouldBeInBreadcrumb} from './utils'

interface BuildArrayState {
  arrayValue: Record<string, unknown>[]
  arraySchemaType: ArraySchemaType
  documentValue: unknown
  focusPath: Path
  rootPath: Path
  recursive: (props: RecursiveProps) => TreeEditingState
}

export function buildArrayState(props: BuildArrayState): TreeEditingState {
  const {arraySchemaType, arrayValue, documentValue, focusPath, rootPath, recursive} = props

  let relativePath: Path = getRelativePath(focusPath)
  const menuItems: TreeEditingMenuItem[] = []
  const breadcrumbs: TreeEditingBreadcrumb[] = []

  arrayValue.forEach((item) => {
    const itemPath = [...rootPath, {_key: item._key}] as Path
    const itemType = item?._type as string

    const itemSchemaField = arraySchemaType?.of?.find(
      (type) => type.name === itemType,
    ) as ObjectSchemaType

    const isAnonymous = !itemType
    let title: string = 'Unknown'

    const previewTitleKey = itemSchemaField?.preview?.select?.title
    const previewTitle = item?.[previewTitleKey as string] as string

    // Is anonymous object (no _type field)
    if (!isAnonymous) {
      title = previewTitleKey ? previewTitle : getSchemaTypeTitle(itemSchemaField)
    }

    const childrenFields = itemSchemaField?.fields || []
    const childrenMenuItems: TreeEditingMenuItem[] = []

    if (shouldBeInBreadcrumb(itemPath, focusPath)) {
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

      const isPrimitive = isPrimitiveSchemaType(childField?.type)
      const childValue = getValueAtPath(documentValue, childPath)

      if (isSelected(childPath, focusPath) && !isPrimitive) {
        relativePath = getRelativePath(childPath)
      }

      const isValid =
        !isPrimitive &&
        !isArrayOfPrimitivesSchemaType(childField.type) &&
        isArraySchemaType(childField.type) &&
        childValue

      if (isValid) {
        if (shouldBeInBreadcrumb(childPath, focusPath)) {
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
          title: getSchemaTypeTitle(childField.type) as string,
          path: childPath,
          children: childState?.menuItems || EMPTY_ARRAY,
        })
      }
    })

    const isPrimitive = isPrimitiveSchemaType(itemSchemaField?.type)

    if (isSelected(itemPath, focusPath) && !isPrimitive) {
      relativePath = getRelativePath(itemPath)
    }

    if (!isPrimitive) {
      menuItems.push({
        title: (title || 'Untitled') as string,
        path: itemPath as Path,
        children: childrenMenuItems,
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
