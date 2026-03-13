import {isArraySchemaType, isObjectSchemaType} from '@sanity/types'

import {type ArrayOfObjectsInputProps, type InputProps, type ObjectInputProps} from '../types'

export function isObjectInputProps(
  inputProps: InputProps | Omit<InputProps, 'renderDefault'>,
): inputProps is ObjectInputProps {
  return isObjectSchemaType(inputProps.schemaType)
}

export function isArrayInputProps(
  inputProps: InputProps | Omit<InputProps, 'renderDefault'>,
): inputProps is ArrayOfObjectsInputProps {
  return isArraySchemaType(inputProps.schemaType)
}
