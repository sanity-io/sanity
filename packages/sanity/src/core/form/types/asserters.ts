import {
  isArrayOfObjectsSchemaType,
  isArrayOfPrimitivesSchemaType,
  isBooleanSchemaType,
  isNumberSchemaType,
  isObjectSchemaType,
  isStringSchemaType,
} from '@sanity/types'
import {
  ArrayOfObjectsInputProps,
  ArrayOfPrimitivesInputProps,
  BooleanInputProps,
  InputProps,
  NumberInputProps,
  ObjectInputProps,
  StringInputProps,
} from './inputProps'
import {ItemProps, ObjectItemProps} from './itemProps'

/** @beta */
export function isObjectItemProps(item: ItemProps): item is ObjectItemProps {
  return isObjectSchemaType(item.schemaType)
}

/** @beta */
export function isObjectInputProps(inputProps: InputProps): inputProps is ObjectInputProps {
  return isObjectSchemaType(inputProps.schemaType)
}

/** @beta */
export function isStringInputProps(inputProps: InputProps): inputProps is StringInputProps {
  return isStringSchemaType(inputProps.schemaType)
}

/** @beta */
export function isNumberInputProps(inputProps: InputProps): inputProps is NumberInputProps {
  return isNumberSchemaType(inputProps.schemaType)
}

/** @beta */
export function isBooleanInputProps(inputProps: InputProps): inputProps is BooleanInputProps {
  return isBooleanSchemaType(inputProps.schemaType)
}

/** @beta */
export function isArrayOfObjectsInputProps(
  inputProps: InputProps
): inputProps is ArrayOfObjectsInputProps {
  return isArrayOfObjectsSchemaType(inputProps.schemaType)
}

/** @beta */
export function isArrayOfPrimitivesInputProps(
  inputProps: InputProps
): inputProps is ArrayOfPrimitivesInputProps {
  return isArrayOfPrimitivesSchemaType(inputProps.schemaType)
}
