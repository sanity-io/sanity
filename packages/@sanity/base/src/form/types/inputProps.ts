import {ArraySchemaType, ObjectSchemaType, Path, SchemaType, ValidationMarker} from '@sanity/types'
import {FormFieldPresence} from '../../presence'
import {PatchEvent} from '../patch'
import {InsertEvent} from './event'
import {FieldGroup} from './fieldGroup'
import {ArrayMember, ObjectMember} from './member'

export interface BaseInputProps<S extends SchemaType, T = unknown> {
  id: string
  type: S
  compareValue: T | undefined
  value: T | undefined
  onChange: (patchEvent: PatchEvent) => void
  hidden?: boolean
  level: number
  readOnly?: boolean
  path: Path

  focusPath: Path
  focused: boolean

  onFocus: (pathOrEvent?: Path | React.FocusEvent) => void
  onBlur: (event?: React.FocusEvent) => void

  presence: FormFieldPresence[]
  validation: ValidationMarker[]
}

export interface ObjectInputProps<
  T extends Record<string, unknown> = Record<string, unknown>,
  S extends ObjectSchemaType = ObjectSchemaType
> extends BaseInputProps<S, T> {
  members: ObjectMember[]
  groups?: FieldGroup[]

  focusPath: Path
  onSelectFieldGroup: (groupName: string) => void
  onSetCollapsed: (collapsed: boolean) => void
  collapsed?: boolean
  collapsible?: boolean
}

export interface ArrayInputProps<S extends ArraySchemaType = ArraySchemaType, V = unknown[]>
  extends BaseInputProps<S, V> {
  members: ArrayMember[]

  onSetCollapsed: (collapsed: boolean) => void
  onInsert: (event: InsertEvent) => void
  collapsed?: boolean
  collapsible?: boolean
}
