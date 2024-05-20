import {isEqual} from 'lodash'
import {
  type ArraySchemaType,
  EMPTY_ARRAY,
  getSchemaTypeTitle,
  type ObjectSchemaType,
  type Path,
} from 'sanity'

import {type TreeEditingBreadcrumb} from '../../types'

interface BuildBreadcrumbsStateProps {
  arraySchemaType: ArraySchemaType
  arrayValue: Record<string, unknown>[]
  itemPath: Path
  parentPath: Path
}

export function buildBreadcrumbsState(props: BuildBreadcrumbsStateProps): TreeEditingBreadcrumb {
  const {arraySchemaType, arrayValue, itemPath, parentPath} = props

  const items = arrayValue.map((arrayItem) => {
    const nestedItemPath = [...parentPath, {_key: arrayItem._key}] as Path
    const nestedItemType = arrayItem?._type as string

    const nestedItemSchemaField = arraySchemaType?.of?.find(
      (type) => type.name === nestedItemType,
    ) as ObjectSchemaType

    // Is anonymous object (no _type field)
    if (!nestedItemType) {
      return {
        path: nestedItemPath,
        title: 'Unknown', // todo: what should we do here?
        children: EMPTY_ARRAY,
      }
    }

    const nestedPreviewTitleKey = nestedItemSchemaField?.preview?.select?.title || ''
    const nestedTitle =
      arrayItem?.[nestedPreviewTitleKey] || getSchemaTypeTitle(nestedItemSchemaField)

    return {
      path: nestedItemPath,
      title: String(nestedTitle || 'Untitled'),
      children: EMPTY_ARRAY,
    }
  })

  const selectedItemTitle = items.find((item) => isEqual(item.path, itemPath))?.title

  return {
    path: itemPath,
    title: (selectedItemTitle || 'Untitled') as string,
    children: items,
  }
}
