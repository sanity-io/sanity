import {type ArraySchemaType, isReferenceSchemaType, type Path} from '@sanity/types'
import {isEqual} from 'lodash'

import {EMPTY_ARRAY} from '../../../../../util/empty'
import {getItemType} from '../../../../store/utils/getItemType'
import {type TreeEditingBreadcrumb} from '../../types'

interface BuildBreadcrumbsStateProps {
  arraySchemaType: ArraySchemaType
  arrayValue: Record<string, unknown>[]
  itemPath: Path
  parentPath: Path
}

export function buildBreadcrumbsState(props: BuildBreadcrumbsStateProps): TreeEditingBreadcrumb {
  const {arraySchemaType, arrayValue, itemPath, parentPath} = props

  const items: TreeEditingBreadcrumb[] = arrayValue
    .map((arrayItem) => {
      const nestedItemPath = [...parentPath, {_key: arrayItem._key}] as Path

      const itemType = getItemType(arraySchemaType, arrayItem)
      const isReference = isReferenceSchemaType(itemType)

      // Don't add reference items to the breadcrumbs
      // or items without a type
      if (isReference || !itemType) return null

      return {
        children: EMPTY_ARRAY,
        parentSchemaType: arraySchemaType,
        path: nestedItemPath,
        schemaType: itemType,
        value: arrayItem,
      } satisfies TreeEditingBreadcrumb
    })
    .filter(Boolean) as TreeEditingBreadcrumb[]

  const selectedItem = items.find((item) => isEqual(item.path, itemPath)) as TreeEditingBreadcrumb

  return {
    children: items,
    parentSchemaType: arraySchemaType,
    path: itemPath,
    schemaType: selectedItem.schemaType,
    value: selectedItem.value,
  }
}
