import {
  type ArrayOfObjectsInputProps,
  type ArrayOfPrimitivesInputProps,
  isArrayOfObjectsInputProps,
} from '../../../types'
import {ArrayOfObjectOptionsInput} from './ArrayOfObjectOptionsInput'
import {ArrayOfPrimitiveOptionsInput} from './ArrayOfPrimitiveOptionsInput'

/**
 *
 * @hidden
 * @beta
 */
export function ArrayOfOptionsInput(props: ArrayOfObjectsInputProps | ArrayOfPrimitivesInputProps) {
  return isArrayOfObjectsInputProps(props) ? (
    <ArrayOfObjectOptionsInput {...props} />
  ) : (
    <ArrayOfPrimitiveOptionsInput {...props} />
  )
}
