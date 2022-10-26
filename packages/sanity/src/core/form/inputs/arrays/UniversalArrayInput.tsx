import React, {useMemo} from 'react'
import {
  ArrayOfObjectsInputProps,
  ArrayOfPrimitivesInputProps,
  isArrayOfPrimitivesInputProps,
} from '../../types'
import {ArrayOfPrimitivesInput} from './ArrayOfPrimitivesInput'
import {ArrayOfOptionsInput} from './ArrayOfOptionsInput'
import {ArrayOfObjectsInput} from './ArrayOfObjectsInput'

/**
 * Universal array input that will introspect its schemaType and delegate to the right implementation
 * Useful as a fallback/last resort input for an array type
 *
 * @beta
 */
export function UniversalArrayInput(props: ArrayOfObjectsInputProps | ArrayOfPrimitivesInputProps) {
  const isArrayOfOptionsInput = useMemo(
    () => Array.isArray(props.schemaType.options?.list),
    [props.schemaType]
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
