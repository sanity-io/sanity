import {toString} from '@sanity/util/paths'
import {
  type ArraySchemaType,
  getSchemaTypeTitle,
  getValueAtPath,
  isObjectSchemaType,
  type ObjectSchemaType,
  type Path,
} from 'sanity'

import {type TreeEditingBreadcrumb, type TreeEditingMenuItem} from '../../types'
import {getRootPath} from '../getRootPath'
import {getSchemaField} from '../getSchemaField'
import {buildArrayState} from './buildArrayState'
import {shouldBeInBreadcrumb} from './utils'

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

export interface RecursiveProps extends Omit<BuildTreeEditingStateProps, 'focusPath'> {
  path: Path
  initial: boolean
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

    if (isObjectSchemaType(schemaType?.type)) {
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

    const value = getValueAtPath(documentValue, path) as Array<Record<string, unknown>>
    const arrayValue = Array.isArray(value) ? value : EMPTY_ARRAY
    const arraySchemaType = schemaType?.type as ArraySchemaType

    const arrayState = buildArrayState({
      arraySchemaType,
      arrayValue,
      documentValue,
      focusPath,
      // Pass the recursive function to the buildArrayState function
      // to allow for recursive calls in the array items.
      recursive,
      rootPath: path,
    })

    // If it is not the initial call, we don't want to push the menu items
    // to the menuItems array, as the initial call recursively calls the
    if (!initial) {
      breadcrumbs.unshift(...arrayState.breadcrumbs)
      relativePath = arrayState.relativePath

      return {
        menuItems: arrayState.menuItems,
        relativePath,
        breadcrumbs,
        rootTitle: '',
      }
    }

    breadcrumbs.unshift(...arrayState.breadcrumbs)
    menuItems.push(...arrayState.menuItems)

    relativePath = arrayState.relativePath

    return {
      menuItems: arrayState.menuItems,
      relativePath,
      breadcrumbs,
      rootTitle: '',
    }
  }

  return {
    breadcrumbs,
    menuItems,
    relativePath,
    rootTitle,
  }
}
