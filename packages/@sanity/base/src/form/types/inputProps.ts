/* eslint-disable @typescript-eslint/no-empty-interface */

import {
  ArraySchemaType,
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  SchemaType,
  StringSchemaType,
  ValidationMarker,
} from '@sanity/types'
import {FormFieldPresence} from '../../presence'
import {PatchEvent} from '../patch'
import {InsertEvent} from './event'
import {FieldGroup} from './fieldGroup'
import {ArrayMember, ObjectMember} from './member'

export interface BaseInputProps<S extends SchemaType, T = unknown> {
  compareValue: T | undefined
  focusPath: Path
  focused: boolean
  hidden?: boolean
  id: string
  level: number
  onBlur: (event?: React.FocusEvent) => void
  onChange: (patchEvent: PatchEvent) => void
  onFocus: (pathOrEvent?: Path | React.FocusEvent) => void
  path: Path
  presence: FormFieldPresence[]
  readOnly: boolean
  type: S
  validation: ValidationMarker[]
  value: T | undefined
}

export interface ObjectInputProps<
  T extends Record<string, unknown> = Record<string, unknown>,
  S extends ObjectSchemaType = ObjectSchemaType
> extends BaseInputProps<S, T> {
  collapsed: boolean
  collapsible: boolean
  groups: FieldGroup[]
  members: ObjectMember[]
  onSelectFieldGroup: (groupName: string) => void
  onSetCollapsed: (collapsed: boolean) => void
}

export interface ArrayInputProps<S extends ArraySchemaType = ArraySchemaType, V = unknown[]>
  extends BaseInputProps<S, V> {
  collapsed: boolean
  collapsible: boolean
  members: ArrayMember[]
  onInsert: (event: InsertEvent) => void
  onSetCollapsed: (collapsed: boolean) => void
}

export interface BooleanInputProps extends BaseInputProps<BooleanSchemaType, boolean> {}

export interface NumberInputProps extends BaseInputProps<NumberSchemaType, number> {}

export interface StringInputProps<S extends StringSchemaType = StringSchemaType>
  extends BaseInputProps<S, string> {}

export type InputProps =
  | ObjectInputProps
  | ArrayInputProps
  | BooleanInputProps
  | NumberInputProps
  | StringInputProps
