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
  type ArrayOfObjectsInputProps,
  type ArrayOfPrimitivesInputProps,
  type BooleanInputProps,
  type InputProps,
  type NumberInputProps,
  type ObjectInputProps,
  type StringInputProps,
} from './inputProps'
import {type ItemProps, type ObjectItemProps} from './itemProps'

/**
 * @hidden
 * @beta */
export function isObjectItemProps(
  item: ItemProps | Omit<ItemProps, 'renderDefault'>,
): item is ObjectItemProps {
  return isObjectSchemaType(item.schemaType)
}

/**
 * @hidden
 * @beta */
export function isObjectInputProps(
  inputProps: InputProps | Omit<InputProps, 'renderDefault'>,
): inputProps is ObjectInputProps {
  return isObjectSchemaType(inputProps.schemaType)
}

/**
 * @hidden
 * @beta */
export function isStringInputProps(
  inputProps: InputProps | Omit<InputProps, 'renderDefault'>,
): inputProps is StringInputProps {
  return isStringSchemaType(inputProps.schemaType)
}

/**
 * @hidden
 * @beta */
export function isNumberInputProps(
  inputProps: InputProps | Omit<InputProps, 'renderDefault'>,
): inputProps is NumberInputProps {
  return isNumberSchemaType(inputProps.schemaType)
}

/**
 * @hidden
 * @beta */
export function isBooleanInputProps(
  inputProps: InputProps | Omit<InputProps, 'renderDefault'>,
): inputProps is BooleanInputProps {
  return isBooleanSchemaType(inputProps.schemaType)
}

/**
 * @hidden
 * @beta */
export function isArrayOfObjectsInputProps(
  inputProps: InputProps | Omit<InputProps, 'renderDefault'>,
): inputProps is ArrayOfObjectsInputProps {
  return isArrayOfObjectsSchemaType(inputProps.schemaType)
}

/**
 * @hidden
 * @beta */
export function isArrayOfBlocksInputProps(
  inputProps: InputProps | Omit<InputProps, 'renderDefault'>,
): inputProps is ArrayOfObjectsInputProps {
  return isArrayOfBlocksSchemaType(inputProps.schemaType)
}

/**
 * @hidden
 * @beta */
export function isArrayOfPrimitivesInputProps(
  inputProps: InputProps | Omit<InputProps, 'renderDefault'>,
): inputProps is ArrayOfPrimitivesInputProps {
  return isArrayOfPrimitivesSchemaType(inputProps.schemaType)
}
