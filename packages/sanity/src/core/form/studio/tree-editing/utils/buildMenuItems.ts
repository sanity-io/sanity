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

const PRIMITIVE_TYPES: string[] = ['string', 'number', 'text', 'boolean']

export const EMPTY_TREE_STATE: TreeEditingState = {
  menuItems: EMPTY_ARRAY,
  relativePath: EMPTY_ARRAY,
  breadcrumbs: EMPTY_ARRAY,
}

export interface BuildTreeMenuItemsProps {
  schemaType: ObjectSchemaType
  documentValue: unknown
  focusPath: Path
}

export interface TreeEditingState {
  menuItems: TreeEditingMenuItem[]
  relativePath: Path
  breadcrumbs: string[]
}

let relativePath: Path = []

export function buildTreeMenuItems(props: BuildTreeMenuItemsProps): TreeEditingState {
  const menuItems: TreeEditingMenuItem[] = []
  const rootPath = [props.focusPath[0]]
  const value = getValueAtPath(props.documentValue, rootPath) as Array<Record<string, unknown>>

  if (props.focusPath.length === 0) {
    return EMPTY_TREE_STATE
  }

  recursive(props)

  function recursive(recursiveProps: BuildTreeMenuItemsProps) {
    const {schemaType, focusPath} = recursiveProps

    const rootField = getSchemaField(schemaType, toString(rootPath))?.type as ArraySchemaType
    const isArrayField = isArraySchemaType(rootField)

    if (!isArrayField) return EMPTY_TREE_STATE

    value.forEach((item) => {
      const itemPath = [...rootPath, {_key: item._key}] as Path
      const itemType = item?._type as string

      const itemSchemaField = rootField?.of?.find(
        (type) => type.name === itemType,
      ) as ObjectSchemaType

      const previewTitleKey = itemSchemaField?.preview?.select?.title
      const title = previewTitleKey ? item?.[previewTitleKey] : itemType

      const childrenFields = itemSchemaField?.fields
      const childrenMenuItems: TreeEditingMenuItem[] = []

      childrenFields.forEach((childField) => {
        const childPath = [...itemPath, childField.name] as Path
        const childValue = getValueAtPath(item, childPath)

        const isSelected = toString(childPath) === toString(focusPath)
        const isPrimitive = PRIMITIVE_TYPES.includes(childField.type.jsonType)

        if (isSelected) {
          const nextPath = isPrimitive ? childPath.slice(0, childPath.length - 1) : childPath

          relativePath = nextPath
        }

        const childState = recursive({
          schemaType: childField as ObjectSchemaType,
          documentValue: childValue,
          focusPath: childPath,
        })

        if (!isPrimitive) {
          childrenMenuItems.push({
            title: childField.name as string,
            path: childPath,
            children: childState?.menuItems || EMPTY_ARRAY,
          })
        }
      })

      const isSelected = toString(itemPath) === toString(focusPath)
      const isPrimitive = PRIMITIVE_TYPES.includes(itemSchemaField.type?.jsonType || '')

      if (isSelected) {
        const nextPath = isPrimitive ? itemPath.slice(0, itemPath.length - 1) : itemPath

        relativePath = nextPath
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
      menuItems,
      relativePath,
      breadcrumbs: [],
    }
  }

  return {
    menuItems,
    relativePath,
    breadcrumbs: [],
  }
}
