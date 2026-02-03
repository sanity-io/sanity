import {useMemo} from 'react'

import {
  type ArrayOfObjectsInputProps,
  type ArrayOfPrimitivesInputProps,
  isArrayOfPrimitivesInputProps,
} from '../../types'
import {ArrayOfObjectsInput} from './ArrayOfObjectsInput'
import {ArrayOfOptionsInput} from './ArrayOfOptionsInput'
import {ArrayOfPrimitivesInput} from './ArrayOfPrimitivesInput'

/**
 * Universal array input that will introspect its schemaType and delegate to the right implementation
 * Useful as a fallback/last resort input for an array type
 *
 *
 * @hidden
 * @beta
 */
export function UniversalArrayInput(props: ArrayOfObjectsInputProps | ArrayOfPrimitivesInputProps) {
  const isArrayOfOptionsInput = useMemo(
    () => Array.isArray(props.schemaType.options?.list),
    [props.schemaType],
  )

  if (isArrayOfOptionsInput) {
    return <ArrayOfOptionsInput {...props} />
  }

  return isArrayOfPrimitivesInputProps(props) ? (
    <ArrayOfPrimitivesInput {...props} />
  ) : (
    <ArrayOfObjectsInput {...props} />
  )
}
