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
import {ObjectInputProps} from '../store/formState'

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

export interface ArrayItemMember {
  type: 'item'
  key: string
  item: ObjectInputProps
}

// note: array members doesn't have the field/fieldSet divide
export type ArrayMember = ArrayItemMember // todo: add more members, e.g. placehoders for invalid values etc.

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
