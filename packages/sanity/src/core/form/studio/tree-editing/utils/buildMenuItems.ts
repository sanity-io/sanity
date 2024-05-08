import {toString} from '@sanity/util/paths'
import {
  type ArraySchemaType,
  getValueAtPath,
  isArraySchemaType,
  type ObjectSchemaType,
  type Path,
} from 'sanity'

import {type TreeEditingMenuItem} from '../types'
import {getSchemaField} from './getSchemaField'

const EMPTY_ARRAY: [] = []

interface BuildTreeMenuItemsProps {
  schemaType: ObjectSchemaType
  documentValue: unknown
  path: Path
}

export function buildTreeMenuItems(props: BuildTreeMenuItemsProps): TreeEditingMenuItem[] {
  const {schemaType, documentValue, path} = props
  const items: TreeEditingMenuItem[] = []

  if (!path.length) return EMPTY_ARRAY

  const rootPath = [path[0]]
  const rootField = getSchemaField(schemaType, toString(rootPath))?.type as ArraySchemaType
  const isArrayField = isArraySchemaType(rootField)
  const value = getValueAtPath(documentValue, rootPath) as Array<Record<string, unknown>>

  if (!isArrayField) return EMPTY_ARRAY

  value.forEach((item) => {
    const itemPath = [...rootPath, {_key: item._key}] as Path
    const itemType = item?._type as string // _type: "animal"

    const itemSchemaField = rootField?.of?.find(
      (type) => type.name === itemType,
    ) as ObjectSchemaType

    const previewTitleKey = itemSchemaField?.preview?.select?.title

    const title = previewTitleKey ? item?.[previewTitleKey] : itemType

    const childrenFields = itemSchemaField?.fields

    const children = childrenFields
      // .filter((f) => isArraySchemaType(f.type) || isObjectSchemaType(f.type))
      .map((childField) => {
        const childPath = [...itemPath, childField.name] as Path
        const childValue = getValueAtPath(item, childPath)

        const subChildren = buildTreeMenuItems({
          schemaType: childField.type as ObjectSchemaType,
          documentValue: childValue,
          path: childPath,
        })

        return {
          title: childField.name as string,
          path: childPath,
          children: subChildren,
        }
      })
      .filter(Boolean)

    items.push({
      title: (title || 'Untitled') as string,
      path: itemPath as Path,
      children,
    })
  })

  return items
}
