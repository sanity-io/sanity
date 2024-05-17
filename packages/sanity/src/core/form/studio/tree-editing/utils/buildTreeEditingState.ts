import {toString} from '@sanity/util/paths'
import {
  type ArraySchemaType,
  getSchemaTypeTitle,
  getValueAtPath,
  isArrayOfPrimitivesSchemaType,
  isArraySchemaType,
  isPrimitiveSchemaType,
  type ObjectSchemaType,
  type Path,
} from 'sanity'

import {type TreeEditingBreadcrumb, type TreeEditingMenuItem} from '../types'
import {getRootPath} from './getRootPath'
import {getSchemaField} from './getSchemaField'

const EMPTY_ARRAY: [] = []

export const EMPTY_TREE_STATE: TreeEditingState = {
  breadcrumbs: EMPTY_ARRAY,
  menuItems: EMPTY_ARRAY,
  relativePath: EMPTY_ARRAY,
  rootTitle: '',
}

export interface BuildTreeEditingStateProps {
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

interface RecursiveProps extends Omit<BuildTreeEditingStateProps, 'focusPath'> {
  path: Path
  initial: boolean
}

function isSelected(itemPath: Path, focusPath: Path): boolean {
  return JSON.stringify(itemPath) === JSON.stringify(focusPath)
}

/**
 * Check if the path is an array item path
 */
function isArrayItemPath(path: Path): boolean {
  return path[path.length - 1].hasOwnProperty('_key')
}

/**
 * Check if the item should be in the breadcrumb
 */
function shouldBeInBreadcrumb(itemPath: Path, focusPath: Path): boolean {
  return (
    itemPath.every((segment, index) => {
      return JSON.stringify(focusPath[index]) === JSON.stringify(segment)
    }) && isArrayItemPath(itemPath)
  )
}

function getRelativePath(path: Path) {
  return isArrayItemPath(path) ? path : path.slice(0, path.length - 1)
}

export function buildTreeEditingState(props: BuildTreeEditingStateProps): TreeEditingState {
  const {focusPath} = props
  const menuItems: TreeEditingMenuItem[] = []

  const rootPath = getRootPath(focusPath)
  const rootField = getSchemaField(props.schemaType, toString(rootPath)) as ObjectSchemaType
  const rootTitle = getSchemaTypeTitle(rootField?.type as ObjectSchemaType)

  const breadcrumbs: TreeEditingBreadcrumb[] = []
  let relativePath: Path = []

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
        const nextPath = [...path, field.name]
        const objectTitle = getSchemaTypeTitle(schemaType)

        if (shouldBeInBreadcrumb(nextPath, focusPath)) {
          breadcrumbs.push({
            path: nextPath,
            title: objectTitle,
            children: EMPTY_ARRAY,
          })
        }

        return {
          title: objectTitle,
          path: nextPath,
          children: EMPTY_ARRAY,
        }
      })

      return {
        menuItems: items,
        relativePath,
        breadcrumbs: EMPTY_ARRAY,
        rootTitle: '',
      }
    }

    // THIS SHOULD BE REPLACED WITH USING THE `processArray` FUNCTION BELOW
    // BUT IT'S NOT WORKING AS EXPECTED
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

        if (isSelected(itemPath, focusPath)) {
          relativePath = getRelativePath(itemPath)
        }

        if (shouldBeInBreadcrumb(itemPath, focusPath)) {
          const breadcrumbsResult = buildBreadcrumbs({
            arraySchemaType: schemaType.type as ArraySchemaType,
            arrayValue: arrayValue,
            itemPath,
            parentPath: path,
            title: title as string,
          })

          breadcrumbs.push(breadcrumbsResult)
        }

        childrenFields.forEach((childField) => {
          const childPath = [...itemPath, childField.name] as Path

          const isPrimitiveChild = isPrimitiveSchemaType(childField?.type)
          const childTitle = getSchemaTypeTitle(childField.type) as string
          const childValue = getValueAtPath(documentValue, childPath)

          if (isSelected(childPath, focusPath)) {
            relativePath = getRelativePath(childPath)
          }

          if (!isPrimitiveChild && childValue) {
            if (shouldBeInBreadcrumb(childPath, focusPath)) {
              const breadcrumbsResult = buildBreadcrumbs({
                arraySchemaType: childField.type as ArraySchemaType,
                arrayValue: childValue as Record<string, unknown>[],
                itemPath: childPath,
                parentPath: itemPath,
                title: childTitle,
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
              title: childTitle,
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
        breadcrumbs: EMPTY_ARRAY,
        rootTitle: '',
      }
    }

    const value = getValueAtPath(documentValue, path) as Array<Record<string, unknown>>
    const arrayValue = Array.isArray(value) ? value : EMPTY_ARRAY
    const arraySchemaType = schemaType?.type as ArraySchemaType

    const arrayState = processArray({
      arraySchemaType,
      arrayValue,
      documentValue,
      focusPath,
      rootPath,
      recursive,
    })

    breadcrumbs.push(...arrayState.breadcrumbs)
    menuItems.push(...arrayState.menuItems)
    relativePath = arrayState.relativePath

    return arrayState
  }

  return {
    breadcrumbs,
    menuItems,
    relativePath,
    rootTitle,
  }
}

interface ProcessArrayProps {
  arrayValue: Record<string, unknown>[]
  arraySchemaType: ArraySchemaType
  documentValue: unknown
  focusPath: Path
  rootPath: Path
  recursive: (props: RecursiveProps) => TreeEditingState
}

function processArray(props: ProcessArrayProps): TreeEditingState {
  const {arraySchemaType, arrayValue, documentValue, focusPath, rootPath, recursive} = props

  let relativePath: Path = []
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
      const breadcrumbsResult = buildBreadcrumbs({
        arraySchemaType,
        arrayValue,
        itemPath,
        parentPath: rootPath,
        title,
      })

      breadcrumbs.push(breadcrumbsResult)
    }

    childrenFields.forEach((childField) => {
      const childPath = [...itemPath, childField.name] as Path

      const isPrimitive = isPrimitiveSchemaType(childField?.type)
      const childTitle = getSchemaTypeTitle(childField.type) as string
      const childValue = getValueAtPath(documentValue, childPath)

      if (isSelected(childPath, focusPath)) {
        relativePath = getRelativePath(childPath)
      }

      if (
        !isPrimitive &&
        !isArrayOfPrimitivesSchemaType(childField.type) &&
        isArraySchemaType(childField.type) &&
        childValue
      ) {
        if (shouldBeInBreadcrumb(childPath, focusPath)) {
          const breadcrumbsResult = buildBreadcrumbs({
            arraySchemaType: childField.type as ArraySchemaType,
            arrayValue: childValue as Record<string, unknown>[],
            itemPath: childPath,
            parentPath: itemPath,
            title: childTitle,
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

    if (isSelected(itemPath, focusPath)) {
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

interface BuildBreadcrumbsProps {
  arraySchemaType: ArraySchemaType
  arrayValue: Record<string, unknown>[]
  itemPath: Path
  parentPath: Path
  title: string
}

function buildBreadcrumbs(props: BuildBreadcrumbsProps): TreeEditingBreadcrumb {
  const {arraySchemaType, arrayValue, itemPath, parentPath, title} = props

  return {
    path: itemPath,
    title: (title || 'Untitled') as string,
    children: arrayValue.map((arrayItem) => {
      const nestedItemPath = [...parentPath, {_key: arrayItem._key}] as Path
      const nestedItemType = arrayItem?._type as string

      const nestedItemSchemaField = arraySchemaType?.of?.find(
        (type) => type.name === nestedItemType,
      ) as ObjectSchemaType

      // Is anonymous object (no _type field)
      if (!nestedItemType) {
        return {
          path: nestedItemPath,
          title: 'Unknown',
          children: EMPTY_ARRAY,
        }
      }

      const nestedPreviewTitleKey = nestedItemSchemaField?.preview?.select?.title
      const nestedTitle = nestedPreviewTitleKey
        ? arrayItem?.[nestedPreviewTitleKey]
        : getSchemaTypeTitle(nestedItemSchemaField)

      return {
        path: nestedItemPath,
        title: nestedTitle as string,
        children: EMPTY_ARRAY,
      }
    }),
  }
}
