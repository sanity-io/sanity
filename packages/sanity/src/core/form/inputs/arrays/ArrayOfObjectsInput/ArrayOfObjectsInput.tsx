import React from 'react'
import {ArrayOfObjectsInputProps} from '../../../types'
import {GridArrayInput} from './Grid/GridArrayInput'
import {ListArrayInput} from './List/ListArrayInput'

/**
 *
 * @hidden
 * @beta
 */
export function ArrayOfObjectsInput(props: ArrayOfObjectsInputProps) {
  const isGrid = props.schemaType.options?.layout === 'grid'
  return isGrid ? <GridArrayInput {...props} /> : <ListArrayInput {...props} />
}
