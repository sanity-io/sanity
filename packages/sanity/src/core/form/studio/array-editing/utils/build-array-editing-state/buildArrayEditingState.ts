import {toString} from '@sanity/util/paths'
import {
  type ArraySchemaType,
  getValueAtPath,
  isArrayOfObjectsSchemaType,
  type ObjectSchemaType,
  type Path,
} from 'sanity'

import {type ArrayEditingBreadcrumb} from '../../types'
import {getRootPath} from '../getRootPath'
import {getSchemaField} from '../getSchemaField'
import {buildArrayState} from './buildArrayState'

const EMPTY_ARRAY: [] = []

export const EMPTY_STATE: ArrayEditingState = {
  breadcrumbs: EMPTY_ARRAY,
  relativePath: EMPTY_ARRAY,
}

export interface BuildArrayEditingStateProps {
  schemaType: ObjectSchemaType | ArraySchemaType
  documentValue: unknown
  openPath: Path
}

export interface ArrayEditingState {
  /** The breadcrumbs for the array editing state */
  breadcrumbs: ArrayEditingBreadcrumb[]
  /**
   * The relative path to the selected item in the array editing state.
   * It is used to determine which field to show in the form editor.
   */
  relativePath: Path
}

export interface RecursiveProps extends Omit<BuildArrayEditingStateProps, 'openPath'> {
  path: Path
}

export function buildArrayEditingState(props: BuildArrayEditingStateProps): ArrayEditingState {
  const {openPath} = props

  const rootPath = getRootPath(openPath)
  const rootField = getSchemaField(props.schemaType, toString(rootPath)) as ObjectSchemaType

  if (!isArrayOfObjectsSchemaType(rootField?.type)) {
    return EMPTY_STATE
  }

  // TODO: REMOVE
  if (rootField?.options?.treeEditing === false) {
    return EMPTY_STATE
  }

  let relativePath: Path = []
  const breadcrumbs: ArrayEditingBreadcrumb[] = []

  recursive({
    schemaType: rootField,
    documentValue: props.documentValue,
    path: rootPath,
  })

  function recursive(recursiveProps: RecursiveProps): ArrayEditingState {
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
  }
}
