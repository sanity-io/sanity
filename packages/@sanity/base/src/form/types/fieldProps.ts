import {
  ArraySchemaType,
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'

export interface BaseFieldProps {
  schemaType: SchemaType
  title: string | undefined
  description: string | undefined
  level: number
  inputId: string
  value: unknown | undefined
  path: Path
  name: string
  index: number
  children: React.ReactNode
}

export interface ObjectFieldProps extends BaseFieldProps {
  schemaType: ObjectSchemaType
  value: {[field in string]: unknown} | undefined
  collapsed?: boolean
  collapsible?: boolean
  onSetCollapsed: (collapsed: boolean) => void
}

export interface ArrayFieldProps extends BaseFieldProps {
  schemaType: ArraySchemaType
  value: unknown[] | undefined
  collapsed?: boolean
  collapsible?: boolean
  onSetCollapsed: (collapsed: boolean) => void
}

export interface NumberFieldProps extends BaseFieldProps {
  schemaType: NumberSchemaType
  value: number | undefined
}
export interface BooleanFieldProps extends BaseFieldProps {
  schemaType: BooleanSchemaType
  value: boolean | undefined
}

export interface StringFieldProps extends BaseFieldProps {
  schemaType: StringSchemaType
  value: string | undefined
}

export type PrimitiveFieldProps = NumberFieldProps | BooleanFieldProps | StringFieldProps

export type FieldProps =
  | ObjectFieldProps
  | ArrayFieldProps
  | NumberFieldProps
  | BooleanFieldProps
  | StringFieldProps
