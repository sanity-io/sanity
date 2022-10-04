import {
  ArraySchemaType,
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'
import {FormFieldPresence} from '../../presence'
import {
  ArrayOfObjectsInputProps,
  ArrayOfPrimitivesInputProps,
  BooleanInputProps,
  NumberInputProps,
  ObjectInputProps,
  StringInputProps,
} from './inputProps'
import {NodeValidation} from './common'

export interface BaseFieldProps {
  schemaType: SchemaType
  title: string | undefined
  description: string | undefined
  presence: FormFieldPresence[]
  validation: NodeValidation[]
  level: number
  inputId: string
  value: unknown | undefined
  path: Path
  name: string
  index: number
  changed: boolean
  children: React.ReactNode
}

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

export interface ArrayFieldProps extends BaseFieldProps {
  schemaType: ArraySchemaType
  value: unknown[] | undefined
  collapsed?: boolean
  collapsible?: boolean
  onCollapse: () => void
  onExpand: () => void
  inputProps: ArrayOfObjectsInputProps
}

export interface ArrayOfPrimitivesFieldProps extends BaseFieldProps {
  schemaType: ArraySchemaType
  value: unknown[] | undefined
  collapsed?: boolean
  collapsible?: boolean
  onCollapse: () => void
  onExpand: () => void
  inputProps: ArrayOfPrimitivesInputProps
}

export interface NumberFieldProps extends BaseFieldProps {
  schemaType: NumberSchemaType
  value: number | undefined
  inputProps: NumberInputProps
}
export interface BooleanFieldProps extends BaseFieldProps {
  schemaType: BooleanSchemaType
  value: boolean | undefined
  inputProps: BooleanInputProps
}

export interface StringFieldProps extends BaseFieldProps {
  schemaType: StringSchemaType
  value: string | undefined
  inputProps: StringInputProps
}

export type PrimitiveFieldProps = NumberFieldProps | BooleanFieldProps | StringFieldProps

export type FieldProps =
  | ObjectFieldProps
  | ArrayFieldProps
  | NumberFieldProps
  | BooleanFieldProps
  | StringFieldProps
