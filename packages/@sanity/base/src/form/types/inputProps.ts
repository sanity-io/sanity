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
import {PatchEvent} from '../patch'
import {FormFieldPresence} from '../../presence'
import {ArrayMember, ObjectMember} from './member'
import {FieldGroup} from './fieldGroup'
import {InsertEvent} from './event'

export interface BaseInputProps<T = unknown, S extends SchemaType = SchemaType> {
  id: string
  type: S
  compareValue: T | undefined
  value: T | undefined
  onChange: (patchEvent: PatchEvent) => void
  title?: string
  description?: string
  hidden?: boolean
  level: number
  readOnly?: boolean
  path: Path
  focused: boolean

  onFocus: (event: React.FocusEvent) => void
  onBlur: (event: React.FocusEvent) => void

  presence: FormFieldPresence[]
  validation: ValidationMarker[]
}

export interface ObjectInputProps<
  T extends Record<string, unknown> = Record<string, unknown>,
  S extends ObjectSchemaType = ObjectSchemaType
> extends BaseInputProps<T, S> {
  members: ObjectMember[]
  groups?: FieldGroup[]

  focusPath: Path
  onSelectFieldGroup: (groupName: string) => void
  onSetCollapsed: (collapsed: boolean) => void
  collapsed?: boolean
  collapsible?: boolean
}

export interface ArrayInputProps<
  T extends any[] = unknown[],
  S extends ArraySchemaType = ArraySchemaType
> extends BaseInputProps<T, S> {
  members: ArrayMember[]

  focusPath: Path

  onSetCollapsed: (collapsed: boolean) => void
  onInsert: (event: InsertEvent) => void
  collapsed?: boolean
  collapsible?: boolean
}

export type BooleanInputProps = BaseInputProps<boolean, BooleanSchemaType>
export type NumberInputProps = BaseInputProps<boolean, NumberSchemaType>
export type StringInputProps = BaseInputProps<boolean, StringSchemaType>
