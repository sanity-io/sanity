import {
  ArraySchemaType,
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  StringSchemaType,
  ValidationMarker,
} from '@sanity/types'
import {FormFieldPresence} from '../../presence'
import {ArrayMember, ObjectMember} from './member'
import {FieldGroup} from './fieldGroup'

interface BaseFieldProps {
  focusPath: Path
  focused: boolean
  hidden: boolean
  id: string // id is a stringified version of the path
  index: number
  level: number
  name: string
  path: Path // the full content path of this input
  presence: FormFieldPresence[]
  readOnly: boolean
  validation: ValidationMarker[]
}

export interface StringFieldProps extends BaseFieldProps {
  kind: 'string'
  compareValue: string | undefined
  type: StringSchemaType
  value: string | undefined
}

export interface NumberFieldProps extends BaseFieldProps {
  kind: 'number'
  compareValue: number | undefined
  type: NumberSchemaType
  value: number | undefined
}

export interface BooleanFieldProps extends BaseFieldProps {
  kind: 'boolean'
  compareValue: boolean | undefined
  type: BooleanSchemaType
  value: boolean | undefined
}

export interface ObjectFieldProps<V = Record<string, unknown>, T = ObjectSchemaType>
  extends BaseFieldProps {
  kind: 'object'
  collapsed: boolean
  collapsible: boolean
  compareValue: V | undefined
  groups: FieldGroup[]
  members: ObjectMember[]
  type: T
  value: V | undefined
}

export interface ArrayFieldProps<T = unknown, S extends ArraySchemaType = ArraySchemaType<T>>
  extends BaseFieldProps {
  kind: 'array'
  collapsed: boolean
  collapsible: boolean
  compareValue: T[] | undefined
  members: ArrayMember[]
  type: S
  value: T[] | undefined
}

export type FieldProps =
  | StringFieldProps
  | ObjectFieldProps
  | ArrayFieldProps
  | NumberFieldProps
  | BooleanFieldProps
