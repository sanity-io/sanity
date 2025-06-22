import {
  type ArrayOfObjectsInputProps,
  type ArrayOfPrimitivesInputProps,
} from '../../../types/inputProps'
import {isArrayOfObjectsInputProps} from '../../../types/asserters'
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
