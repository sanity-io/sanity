import {type ArrayOfObjectsInputProps} from '../../../types/inputProps'
import {GridArrayInput} from './Grid/GridArrayInput'
import {ListArrayInput} from './List/ListArrayInput'

/**
 *
 * @internal
 */
export function ArrayOfObjectsInput(props: ArrayOfObjectsInputProps) {
  const isGrid = props.schemaType.options?.layout === 'grid'
  return isGrid ? <GridArrayInput {...props} /> : <ListArrayInput {...props} />
}
