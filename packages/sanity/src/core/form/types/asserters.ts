import {
  isArrayOfBlocksSchemaType,
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
export function isObjectItemProps(
  item: ItemProps | Omit<ItemProps, 'renderDefault'>
): item is ObjectItemProps {
  return isObjectSchemaType(item.schemaType)
}

/** @beta */
export function isObjectInputProps(
  inputProps: InputProps | Omit<InputProps, 'renderDefault'>
): inputProps is ObjectInputProps {
  return isObjectSchemaType(inputProps.schemaType)
}

/** @beta */
export function isStringInputProps(
  inputProps: InputProps | Omit<InputProps, 'renderDefault'>
): inputProps is StringInputProps {
  return isStringSchemaType(inputProps.schemaType)
}

/** @beta */
export function isNumberInputProps(
  inputProps: InputProps | Omit<InputProps, 'renderDefault'>
): inputProps is NumberInputProps {
  return isNumberSchemaType(inputProps.schemaType)
}

/** @beta */
export function isBooleanInputProps(
  inputProps: InputProps | Omit<InputProps, 'renderDefault'>
): inputProps is BooleanInputProps {
  return isBooleanSchemaType(inputProps.schemaType)
}

/** @beta */
export function isArrayOfObjectsInputProps(
  inputProps: InputProps | Omit<InputProps, 'renderDefault'>
): inputProps is ArrayOfObjectsInputProps {
  return isArrayOfObjectsSchemaType(inputProps.schemaType)
}

/** @beta */
export function isArrayOfBlocksInputProps(
  inputProps: InputProps | Omit<InputProps, 'renderDefault'>
): inputProps is ArrayOfObjectsInputProps {
  return isArrayOfBlocksSchemaType(inputProps.schemaType)
}

/** @beta */
export function isArrayOfPrimitivesInputProps(
  inputProps: InputProps | Omit<InputProps, 'renderDefault'>
): inputProps is ArrayOfPrimitivesInputProps {
  return isArrayOfPrimitivesSchemaType(inputProps.schemaType)
}
