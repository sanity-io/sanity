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
 * @internal */
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
 * @internal */
export function isNumberInputProps(
  inputProps: InputProps | Omit<InputProps, 'renderDefault'>,
): inputProps is NumberInputProps {
  return isNumberSchemaType(inputProps.schemaType)
}

/**
 * @internal */
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
 * @internal */
export function isArrayOfBlocksInputProps(
  inputProps: InputProps | Omit<InputProps, 'renderDefault'>,
): inputProps is ArrayOfObjectsInputProps {
  return isArrayOfBlocksSchemaType(inputProps.schemaType)
}

/**
 * @internal */
export function isArrayOfPrimitivesInputProps(
  inputProps: InputProps | Omit<InputProps, 'renderDefault'>,
): inputProps is ArrayOfPrimitivesInputProps {
  return isArrayOfPrimitivesSchemaType(inputProps.schemaType)
}
