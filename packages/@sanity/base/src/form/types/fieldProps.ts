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
import {PatchEvent} from '../patch'
import {ArrayMember, ObjectMember} from './member'
import {FieldGroup} from './fieldGroup'
import {InsertEvent} from './event'

interface BaseFieldProps {
  name: string
  title?: string
  description?: string
  // id is a stringified version of the path
  id: string
  // the full content path of this input
  path: Path
  focusPath: Path
  focused: boolean
  presence: FormFieldPresence[]
  validation: ValidationMarker[]
  index: number
  level: number
  hidden?: boolean
  readOnly?: boolean
  onBlur: (focusEvent?: React.FocusEvent) => void
  onChange: (patchEvent: PatchEvent) => void
  onFocus: (pathOrEvent?: Path | React.FocusEvent) => void
}

export interface StringFieldProps extends BaseFieldProps {
  kind: 'string'
  type: StringSchemaType
  compareValue: string | undefined
  value: string | undefined
}

export interface NumberFieldProps extends BaseFieldProps {
  kind: 'number'
  type: NumberSchemaType
  compareValue: number | undefined
  value: number | undefined
}

export interface BooleanFieldProps extends BaseFieldProps {
  kind: 'boolean'
  type: BooleanSchemaType
  compareValue: boolean | undefined
  value: boolean | undefined
}

export interface ObjectFieldProps<V = Record<string, unknown>, T = ObjectSchemaType>
  extends BaseFieldProps {
  kind: 'object'
  type: T
  members: ObjectMember[]
  groups?: FieldGroup[]
  onSelectFieldGroup: (name: string) => void
  compareValue: V | undefined
  value: V | undefined
  readOnly?: boolean
  collapsed?: boolean
  collapsible?: boolean
  onSetCollapsed: (expanded: boolean) => void
}

export interface ArrayFieldProps<T = unknown, S extends ArraySchemaType = ArraySchemaType<T>>
  extends BaseFieldProps {
  kind: 'array'
  type: S
  onSetCollapsed: (collapsed: boolean) => void
  onInsert: (event: InsertEvent) => void
  collapsed?: boolean
  collapsible?: boolean
  members: ArrayMember[]
  compareValue: T[] | undefined
  value: T[] | undefined
}

export type FieldProps =
  | StringFieldProps
  | ObjectFieldProps
  | ArrayFieldProps
  | NumberFieldProps
  | BooleanFieldProps
