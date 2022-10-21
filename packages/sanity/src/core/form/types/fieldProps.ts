import {
  ArraySchemaType,
  BooleanSchemaType,
  FormNodeValidation,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'
import {ReactElement, ReactNode} from 'react'
import {FormNodePresence} from '../../presence'
import {
  ArrayOfObjectsInputProps,
  ArrayOfPrimitivesInputProps,
  BooleanInputProps,
  NumberInputProps,
  ObjectInputProps,
  StringInputProps,
} from './inputProps'

/** @beta */
export interface BaseFieldProps {
  schemaType: SchemaType
  title: string | undefined
  description: string | undefined
  /** @beta */
  presence: FormNodePresence[]
  validation: FormNodeValidation[]
  level: number
  inputId: string
  value: unknown | undefined
  path: Path
  name: string
  index: number
  changed: boolean
  children: ReactNode
  renderDefault: (props: FieldProps) => ReactElement
}

/** @beta */
export interface ObjectFieldProps extends BaseFieldProps {
  schemaType: ObjectSchemaType
  value: {[field in string]: unknown} | undefined
  collapsed?: boolean
  collapsible?: boolean
  onCollapse: () => void
  onExpand: () => void
  open: boolean
  onClose: () => void
  onOpen: () => void
  inputProps: ObjectInputProps
}

/** @beta */
export interface ArrayFieldProps extends BaseFieldProps {
  schemaType: ArraySchemaType
  value: unknown[] | undefined
  collapsed?: boolean
  collapsible?: boolean
  onCollapse: () => void
  onExpand: () => void
  inputProps: ArrayOfObjectsInputProps
}

/** @internal */
export interface ArrayOfPrimitivesFieldProps extends BaseFieldProps {
  schemaType: ArraySchemaType
  value: unknown[] | undefined
  collapsed?: boolean
  collapsible?: boolean
  onCollapse: () => void
  onExpand: () => void
  inputProps: ArrayOfPrimitivesInputProps
}

/** @beta */
export interface NumberFieldProps extends BaseFieldProps {
  schemaType: NumberSchemaType
  value: number | undefined
  inputProps: NumberInputProps
}

/** @beta */
export interface BooleanFieldProps extends BaseFieldProps {
  schemaType: BooleanSchemaType
  value: boolean | undefined
  inputProps: BooleanInputProps
}

/** @beta */
export interface StringFieldProps extends BaseFieldProps {
  schemaType: StringSchemaType
  value: string | undefined
  inputProps: StringInputProps
}

/** @internal */
export type PrimitiveFieldProps = NumberFieldProps | BooleanFieldProps | StringFieldProps

/** @beta */
export type FieldProps =
  | ObjectFieldProps
  | ArrayFieldProps
  | NumberFieldProps
  | BooleanFieldProps
  | StringFieldProps
