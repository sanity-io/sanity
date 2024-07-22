import {isEqual} from 'lodash'
import {type ArraySchemaType, isReferenceSchemaType, type Path} from 'sanity'

import {getItemType} from '../../../../store/utils/getItemType'
import {type ArrayEditingBreadcrumb} from '../../types'

interface BuildBreadcrumbsStateProps {
  arraySchemaType: ArraySchemaType
  arrayValue: Record<string, unknown>[]
  itemPath: Path
  parentPath: Path
}

export function buildBreadcrumbsState(props: BuildBreadcrumbsStateProps): ArrayEditingBreadcrumb {
  const {arraySchemaType, arrayValue, itemPath, parentPath} = props

  const items: ArrayEditingBreadcrumb[] = arrayValue
    .map((arrayItem) => {
      const nestedItemPath = [...parentPath, {_key: arrayItem._key}] as Path

      const itemType = getItemType(arraySchemaType, arrayItem)
      const isReference = isReferenceSchemaType(itemType)

      // Don't add reference items to the breadcrumbs
      // or items without a type
      if (isReference || !itemType) return null

      return {
        path: nestedItemPath,
        schemaType: itemType,
        value: arrayItem,
      } satisfies ArrayEditingBreadcrumb
    })
    .filter(Boolean) as ArrayEditingBreadcrumb[]

  const selectedItem = items.find((item) => isEqual(item.path, itemPath)) as ArrayEditingBreadcrumb

  return {
    path: itemPath,
    schemaType: selectedItem.schemaType,
    value: selectedItem.value,
  }
}
