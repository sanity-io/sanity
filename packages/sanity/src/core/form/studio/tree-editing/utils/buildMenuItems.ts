import {toString} from '@sanity/util/paths'
import {
  type ArraySchemaType,
  getSchemaTypeTitle,
  getValueAtPath,
  isArraySchemaType,
  isPrimitiveSchemaType,
  type ObjectSchemaType,
  type Path,
} from 'sanity'

import {type TreeEditingBreadcrumb, type TreeEditingMenuItem} from '../types'
import {getSchemaField} from './getSchemaField'

const EMPTY_ARRAY: [] = []

export const EMPTY_TREE_STATE: TreeEditingState = {
  breadcrumbs: EMPTY_ARRAY,
  menuItems: EMPTY_ARRAY,
  relativePath: EMPTY_ARRAY,
  rootTitle: '',
}

export interface BuildTreeMenuItemsProps {
  schemaType: ObjectSchemaType | ArraySchemaType
  documentValue: unknown
  focusPath: Path
}

export interface TreeEditingState {
  breadcrumbs: TreeEditingBreadcrumb[]
  menuItems: TreeEditingMenuItem[]
  relativePath: Path
  rootTitle: string
}

interface RecursiveProps extends Omit<BuildTreeMenuItemsProps, 'focusPath'> {
  path: Path
  initial: boolean
}

function isSelected(itemPath: Path, focusPath: Path): boolean {
  return JSON.stringify(itemPath) === JSON.stringify(focusPath)
}

function shouldNavigate(itemPath: Path): boolean {
  // if it's not a key property we don't want to update the relativePath
  return itemPath[itemPath.length - 1].hasOwnProperty('_key')
}

// todo: this should not be a global variable
let relativePath: Path = []

export function buildTreeMenuItems(props: BuildTreeMenuItemsProps): TreeEditingState {
  const {focusPath} = props
  const menuItems: TreeEditingMenuItem[] = []
  const rootPath = [focusPath[0]]
  const rootField = getSchemaField(props.schemaType, toString(rootPath))?.type as ObjectSchemaType

  if (JSON.stringify(rootPath) === JSON.stringify(focusPath)) {
    return EMPTY_TREE_STATE
  }

  recursive({
    initial: true,
    schemaType: rootField,
    documentValue: props.documentValue,
    path: rootPath,
  })

  function recursive(recursiveProps: RecursiveProps): TreeEditingState {
    const {schemaType, path, initial, documentValue} = recursiveProps

    if (schemaType.type?.jsonType === 'object') {
      const items = schemaType?.type?.fields?.map((field) => {
        return {
          title: getSchemaTypeTitle(field.type),
          path: [...path, field.name],
          children: EMPTY_ARRAY,
        }
      })

      return {
        menuItems: items,
        relativePath,
        breadcrumbs: [],
        rootTitle: '',
      }
    }

    if (isArraySchemaType(schemaType.type) && !initial) {
      const arrayValue = getValueAtPath(documentValue, path) as Array<Record<string, unknown>>

      const nestedItems: TreeEditingMenuItem[] = arrayValue?.map((item) => {
        const itemPath = [...path, {_key: item._key}] as Path
        const itemType = item?._type as string

        const itemSchemaField = (schemaType.type as ArraySchemaType)?.of?.find(
          (type) => type.name === itemType,
        ) as ObjectSchemaType

        const previewTitleKey = itemSchemaField?.preview?.select?.title
        const title = previewTitleKey ? item?.[previewTitleKey] : itemType

        const childrenFields = itemSchemaField?.fields || []
        const childrenMenuItems: TreeEditingMenuItem[] = []

        if (isSelected(itemPath, focusPath) && shouldNavigate(itemPath)) {
          relativePath = itemPath
        }

        childrenFields.forEach((childField) => {
          const childPath = [...itemPath, childField.name] as Path

          const isPrimitive = isPrimitiveSchemaType(childField?.type)

          if (isSelected(childPath, focusPath) && shouldNavigate(childPath)) {
            const nextPath = isPrimitive ? childPath.slice(0, childPath.length - 1) : childPath

            relativePath = nextPath
          }

          if (!isPrimitive) {
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

        return {
          path: itemPath,
          title: (title || 'Untitled') as string,
          children: childrenMenuItems,
        }
      })

      return {
        menuItems: nestedItems,
        relativePath,
        breadcrumbs: [],
        rootTitle: '',
      }
    }

    const value = getValueAtPath(documentValue, path) as Array<Record<string, unknown>>

    const arrayValue = Array.isArray(value) ? value : EMPTY_ARRAY
    const arraySchemaType = schemaType as ArraySchemaType

    arrayValue.forEach((item) => {
      const itemPath = [...rootPath, {_key: item._key}] as Path
      const itemType = item?._type as string

      const itemSchemaField = arraySchemaType?.of?.find(
        (type) => type.name === itemType,
      ) as ObjectSchemaType

      const previewTitleKey = itemSchemaField?.preview?.select?.title
      const title = previewTitleKey ? item?.[previewTitleKey] : getSchemaTypeTitle(itemSchemaField)

      const childrenFields = itemSchemaField?.fields || []
      const childrenMenuItems: TreeEditingMenuItem[] = []

      childrenFields.forEach((childField) => {
        const childPath = [...itemPath, childField.name] as Path

        const isPrimitive = isPrimitiveSchemaType(childField?.type)

        if (isSelected(childPath, focusPath) && shouldNavigate(childPath)) {
          const nextPath = isPrimitive ? childPath.slice(0, childPath.length - 1) : childPath

          relativePath = nextPath
        }

        if (!isPrimitive) {
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

      if (isSelected(itemPath, focusPath) && shouldNavigate(itemPath)) {
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
      rootTitle: '',
    }
  }

  // todo: fix breadcrumbs
  const breadcrumbs = relativePath.map((p, index) => {
    const currentPath = relativePath.slice(0, index + 1)

    return {
      path: currentPath as Path,
      title: JSON.stringify(p),
    }
  })

  return {
    menuItems,
    relativePath,
    breadcrumbs,
    rootTitle: getSchemaTypeTitle(rootField),
  }
}
