import {
  type ArraySchemaType,
  isArrayOfObjectsSchemaType,
  type ObjectSchemaType,
  type Path,
} from '@sanity/types'
import {toString} from '@sanity/util/paths'

import {getValueAtPath} from '../../../../../field/paths/helpers'
import {getSchemaTypeTitle} from '../../../../../schema/helpers'
import {type DialogItem} from '../../types'
import {getRootPath} from '../getRootPath'
import {getSchemaField} from '../getSchemaField'
import {buildArrayState} from './buildArrayState'

const EMPTY_ARRAY: [] = []

export const EMPTY_TREE_STATE: TreeEditingState = {
  breadcrumbs: EMPTY_ARRAY,
  menuItems: EMPTY_ARRAY,
  relativePath: EMPTY_ARRAY,
  rootTitle: '',
  siblings: new Map(),
}

export interface BuildTreeEditingStateProps {
  schemaType: ObjectSchemaType | ArraySchemaType
  documentValue: unknown
  openPath: Path
}

export interface TreeEditingState {
  /** The breadcrumbs for the tree editing state */
  breadcrumbs: DialogItem[]
  /** The menu items for the tree editing state */
  menuItems: DialogItem[]
  /**
   * The relative path to the selected item in the tree editing state.
   * It is used to determine which field to show in the form editor.
   */
  relativePath: Path
  /** The title of the root field */
  rootTitle: string
  /** Map of path strings to their sibling arrays (including non-editable items, for example references)
   * Starts at 1
   */
  siblings: Map<string, {count: number; index: number}>
}

export interface RecursiveProps extends Omit<BuildTreeEditingStateProps, 'openPath'> {
  path: Path
}

export function buildTreeEditingState(props: BuildTreeEditingStateProps): TreeEditingState {
  const {openPath} = props

  const rootPath = getRootPath(openPath)
  const rootField = getSchemaField(props.schemaType, toString(rootPath)) as ObjectSchemaType

  // Safety check: if rootField or rootField.type is undefined, return empty state
  if (!rootField?.type) {
    return EMPTY_TREE_STATE
  }

  const rootTitle = getSchemaTypeTitle(rootField.type as ObjectSchemaType)

  if (!isArrayOfObjectsSchemaType(rootField.type)) {
    return EMPTY_TREE_STATE
  }

  let relativePath: Path = []
  const breadcrumbs: DialogItem[] = []

  const result = recursive({
    schemaType: rootField,
    documentValue: props.documentValue,
    path: rootPath,
  })

  function recursive(recursiveProps: RecursiveProps): TreeEditingState {
    const {schemaType, path, documentValue} = recursiveProps

    const value = getValueAtPath(documentValue, path) as Array<Record<string, unknown>>
    const arrayValue = Array.isArray(value) ? value : EMPTY_ARRAY
    const arraySchemaType = schemaType?.type as ArraySchemaType

    const arrayState = buildArrayState({
      arraySchemaType,
      arrayValue,
      documentValue,
      openPath,
      // Pass the recursive function to the buildArrayState function
      // to allow for recursive calls in the array items.
      recursive,
      rootPath: path,
      // Needed in order to keep track of portable text fields and its items types
      rootSchemaType: props.schemaType as ObjectSchemaType,
    })

    if (arrayState.relativePath.length > 0) {
      relativePath = arrayState.relativePath
    }

    breadcrumbs.unshift(...arrayState.breadcrumbs)

    return arrayState
  }

  return {
    relativePath,
    breadcrumbs,
    menuItems: result.menuItems,
    rootTitle,
    siblings: result.siblings,
  }
}
