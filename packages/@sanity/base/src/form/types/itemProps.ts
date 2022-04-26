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

interface BaseItemProps {
  name: string
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
  hidden: boolean
  readOnly: boolean
}

export interface StringItemProps extends BaseItemProps {
  kind: 'string'
  type: StringSchemaType
  compareValue: string | undefined
  value: string | undefined
}

export interface NumberItemProps extends BaseItemProps {
  kind: 'number'
  type: NumberSchemaType
  compareValue: number | undefined
  value: number | undefined
}

export interface BooleanItemProps extends BaseItemProps {
  kind: 'boolean'
  type: BooleanSchemaType
  compareValue: boolean | undefined
  value: boolean | undefined
}

export interface ObjectItemProps<V = Record<string, unknown>, T = ObjectSchemaType>
  extends BaseItemProps {
  kind: 'object'
  type: T
  members: ObjectMember[]
  groups: FieldGroup[]
  compareValue: V | undefined
  value: V | undefined
  collapsed: boolean
  collapsible: boolean
}

// export interface ArrayItemProps<T = unknown, S extends ArraySchemaType = ArraySchemaType<T>>
//   extends BaseItemProps {
//   kind: 'array'
//   type: S
//   collapsed: boolean
//   collapsible: boolean
//   members: ArrayMember[]
//   compareValue: T[] | undefined
//   value: T[] | undefined
// }

export type ItemProps =
  | StringItemProps
  | ObjectItemProps
  // | ArrayItemProps
  | NumberItemProps
  | BooleanItemProps
