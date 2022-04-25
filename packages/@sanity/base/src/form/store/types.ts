import {
  ArraySchemaType,
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  StringSchemaType,
  ValidationMarker,
} from '@sanity/types'
import * as React from 'react'
import {ComponentType} from 'react'
import {PatchEvent} from '../patch'
import {FormFieldPresence} from '../../presence'
import {ObjectInputProps} from './formState'

export interface StateTree<T> {
  value: T | undefined
  children?: {
    [key: string]: StateTree<T>
  }
}

export interface FieldGroup {
  name: string
  title?: string
  icon?: ComponentType<void>
  default?: boolean
  selected?: boolean
  disabled?: boolean
}

export type ObjectMember = FieldMember | FieldSetMember

// note: array members doesn't have the field/fieldSet divide
export type ArrayMember = ObjectInputProps

export interface FieldMember {
  type: 'field'
  field: FieldProps
  key: string
}

export interface FieldSetProps {
  name: string
  title?: string
  hidden?: boolean
  collapsible?: boolean
  collapsed?: boolean
  onSetCollapsed: (collapsed: boolean) => void
  fields: FieldMember[]
}

export interface FieldSetMember {
  type: 'fieldSet'
  key: string
  fieldSet: FieldSetProps
}

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
  onBlur: () => (focusEvent: React.FocusEvent) => void
  onChange: (patchEvent: PatchEvent) => void
  onFocus: (pathOrFocusEvent: Path | React.FocusEvent) => void
  focus: () => void
}

export interface StringFieldProps extends BaseFieldProps {
  kind: 'string'
  type: StringSchemaType
  value?: string
}

export interface NumberFieldProps extends BaseFieldProps {
  kind: 'number'
  type: NumberSchemaType
  value?: number
}

export interface BooleanFieldProps extends BaseFieldProps {
  kind: 'boolean'
  type: BooleanSchemaType
  value?: boolean
}

export interface InsertEvent {
  items: unknown[]
  position: 'before' | 'after'
  reference: number | string
}

export interface ObjectFieldProps<V = Record<string, unknown>, T = ObjectSchemaType>
  extends BaseFieldProps {
  kind: 'object'
  type: T
  members: ObjectMember[]
  groups?: FieldGroup[]
  onSelectGroup: (name: string) => void
  value?: V
  readOnly?: boolean
  collapsed?: boolean
  collapsible?: boolean
  onSetCollapsed: (expanded: boolean) => void
}

export interface ArrayFieldProps<T = unknown, S extends ArraySchemaType = ArraySchemaType<T>>
  extends BaseFieldProps {
  kind: 'array'
  type: S
  members: ObjectInputProps[]
  focusPath: Path
  value?: T[]
}

export type FieldProps =
  | StringFieldProps
  | ObjectFieldProps
  | ArrayFieldProps
  | NumberFieldProps
  | BooleanFieldProps
