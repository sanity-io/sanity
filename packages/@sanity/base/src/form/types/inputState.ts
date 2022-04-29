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
import {FIXME} from './_transitional'

export interface BaseInputState<T = unknown, S extends SchemaType = SchemaType> {
  id: string
  type: S
  compareValue?: FIXME
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

export interface ObjectInputState<
  T = {[key: string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType
> extends BaseInputState<T, S> {
  members: ObjectMember[]
  groups?: FieldGroup[]

  focusPath: Path
  onSelectFieldGroup: (groupName: string) => void
  onSetCollapsed: (collapsed: boolean) => void
  collapsed?: boolean
  collapsible?: boolean
}

export interface ArrayInputState<
  T extends any[] = unknown[],
  S extends ArraySchemaType = ArraySchemaType
> extends BaseInputState<T, S> {
  members: ArrayMember[]

  focusPath: Path

  onSetCollapsed: (collapsed: boolean) => void
  onInsert: (event: InsertEvent) => void
  collapsed?: boolean
  collapsible?: boolean
}

export type BooleanInputState<S extends BooleanSchemaType = BooleanSchemaType> = BaseInputState<
  boolean,
  S
>
export type NumberInputState<S extends NumberSchemaType = NumberSchemaType> = BaseInputState<
  number,
  S
>
export type StringInputState<S extends StringSchemaType = StringSchemaType> = BaseInputState<
  string,
  S
>
