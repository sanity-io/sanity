import {isEqual} from 'lodash'
import {
  type ArraySchemaType,
  EMPTY_ARRAY,
  getSchemaTypeTitle,
  isReferenceSchemaType,
  type Path,
} from 'sanity'

import {getItemType} from '../../../../store/utils/getItemType'
import {type TreeEditingBreadcrumb} from '../../types'
import {getArrayItemPreview} from '../getArrayItemPreview'

interface BuildBreadcrumbsStateProps {
  arraySchemaType: ArraySchemaType
  arrayValue: Record<string, unknown>[]
  itemPath: Path
  parentPath: Path
}

export function buildBreadcrumbsState(props: BuildBreadcrumbsStateProps): TreeEditingBreadcrumb {
  const {arraySchemaType, arrayValue, itemPath, parentPath} = props

  const parentTitle = getSchemaTypeTitle(arraySchemaType)

  const items: TreeEditingBreadcrumb[] = arrayValue
    .map((arrayItem) => {
      const nestedItemPath = [...parentPath, {_key: arrayItem._key}] as Path

      const itemType = getItemType(arraySchemaType, arrayItem)

      const isReference = isReferenceSchemaType(itemType)

      // Don't add reference items to the breadcrumbs
      if (isReference) return null

      const {title} = getArrayItemPreview({arrayItem, arraySchemaType})

      return {
        path: nestedItemPath,
        title,
        children: EMPTY_ARRAY,
        parentArrayTitle: parentTitle,
      }
    })
    .filter(Boolean) as TreeEditingBreadcrumb[]

  const selectedItemTitle = items.find((item) => isEqual(item.path, itemPath))?.title

  return {
    path: itemPath,
    title: selectedItemTitle as string,
    children: items,
    parentArrayTitle: parentTitle,
  }
}
