import {isArrayOfObjectsInputProps} from '../../../types/asserters'
import type {ArrayOfObjectsInputProps, ArrayOfPrimitivesInputProps} from '../../../types/inputProps'
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
