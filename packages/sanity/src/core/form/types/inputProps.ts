import {type BooleanInputProps, type NumberInputProps, type StringInputProps} from '@sanity/types'

export type {
  ArrayOfObjectsInputProps,
  ArrayOfPrimitivesElementType,
  ArrayOfPrimitivesInputProps,
  BaseInputProps,
  BooleanInputProps,
  ComplexElementProps,
  InputProps,
  NumberInputProps,
  ObjectInputProps,
  OnPathFocusPayload,
  PortableTextInputProps,
  PrimitiveInputElementProps,
  StringInputProps,
} from '@sanity/types'

/**
 * @hidden
 * @beta */
export type PrimitiveInputProps = StringInputProps | BooleanInputProps | NumberInputProps
