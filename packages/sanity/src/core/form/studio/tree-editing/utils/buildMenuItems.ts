import {toString} from '@sanity/util/paths'
import {
  type ArraySchemaType,
  getValueAtPath,
  isArraySchemaType,
  type ObjectFieldType,
  type ObjectSchemaType,
  type Path,
  type SchemaType,
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

  let previousSchema: ArraySchemaType<SchemaType> | ObjectFieldType<SchemaType> | null = null

  path.forEach((seg, index) => {
    const currentPath = path.slice(0, index + 1)
    const previousPath = path.slice(0, index)

    const field = getSchemaField(schemaType, toString(currentPath))
    const isKeySegment = seg.hasOwnProperty('_key')

    if (field?.type) {
      previousSchema = field?.type
    }

    if (isKeySegment && isArraySchemaType(previousSchema)) {
      // Get the value of the array field in the document value
      const arrayValue = getValueAtPath(documentValue, previousPath) as any[]

      for (const [_index, item] of arrayValue.entries()) {
        // Get the type of the array item
        const itemType = item?._type

        // Find the schema field for the array item
        const itemSchemaField = previousSchema?.of?.find(
          (type) => type.name === itemType,
        ) as ObjectSchemaType

        // Get the preview title key for the array item
        const previewTitleKey = itemSchemaField.preview?.select?.title

        // Get the title preview title value for the array item
        const title = previewTitleKey ? item[previewTitleKey] : itemType

        // Construct the path for the array item using the previous path and the item key
        const itemPath = [...previousPath, {_key: item._key}]

        items.push({
          title: title || 'Untitled',
          path: itemPath,
        })
      }
    }
  })

  return items
}
