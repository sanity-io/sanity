import {isEqual} from 'lodash'
import {type ArraySchemaType, EMPTY_ARRAY, type Path} from 'sanity'

import {type TreeEditingBreadcrumb} from '../../types'
import {getArrayItemPreview} from '../getArrayItemPreview'

interface BuildBreadcrumbsStateProps {
  arraySchemaType: ArraySchemaType
  arrayValue: Record<string, unknown>[]
  itemPath: Path
  parentPath: Path
  arrayTitle: string
}

export function buildBreadcrumbsState(props: BuildBreadcrumbsStateProps): TreeEditingBreadcrumb {
  const {arraySchemaType, arrayValue, itemPath, parentPath, arrayTitle} = props

  const items: TreeEditingBreadcrumb[] = arrayValue.map((arrayItem) => {
    const nestedItemPath = [...parentPath, {_key: arrayItem._key}] as Path

    const {title} = getArrayItemPreview({arrayItem, arraySchemaType})

    return {
      path: nestedItemPath,
      title,
      children: EMPTY_ARRAY,
      breadcrumbTitle: arrayTitle,
    }
  })

  const selectedItemTitle = items.find((item) => isEqual(item.path, itemPath))?.title

  return {
    path: itemPath,
    title: selectedItemTitle as string,
    children: items,
    breadcrumbTitle: arrayTitle,
  }
}
