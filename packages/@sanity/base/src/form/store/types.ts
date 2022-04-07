import {
  ArraySchemaType,
  BooleanSchemaType,
  CurrentUser,
  NumberSchemaType,
  ObjectSchemaType,
  StringSchemaType,
} from '@sanity/types'
import * as React from 'react'
import {ComponentType} from 'react'
import {PatchEvent} from '../patch'
import {PreparedProps, SanityDocument} from './formState'

export interface FormStore<T extends SanityDocument> {
  updateValue: (updater: (current: T) => T) => void
  onChange: (patchEvent: PatchEvent) => void
  onSetFieldGroup: (groupName: string) => void
  updateCurrentUser: (updater: (current: CurrentUser) => CurrentUser) => void
  getState: () => PreparedProps<T>
  getValue: () => T
  subscribe: (subscriber: (value: PreparedProps<T>) => void) => void
}

export interface ObjectFieldGroupState {
  current?: string
  fields?: {
    [field: string]: ObjectFieldGroupState
  }
}

export interface ObjectCollapsedState {
  collapsed?: boolean
  fields?: {
    [name: string]: ObjectCollapsedState
  }
  fieldSets?: {
    [name: string]: boolean
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

export interface FieldMember {
  type: 'field'
  field: FieldProps
}

export interface FieldSetProps {
  name: string
  title?: string
  hidden?: boolean
  collapsible?: boolean
  collapsed?: boolean
  onExpand: () => void
  onCollapse: () => void
  fields: FieldMember[]
}

export interface FieldSetMember {
  type: 'fieldSet'
  fieldSet: FieldSetProps
}

interface BaseFieldProps {
  name: string
  title?: string
  description?: string
  index: number
  level: number
  hidden?: boolean
  readOnly?: boolean
  onChange: (patchEvent: PatchEvent) => void
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

export type PrimitiveFieldProps = BooleanFieldProps | NumberFieldProps | StringFieldProps
export type FieldGroupPath = string[]

export interface ObjectFieldProps extends BaseFieldProps {
  kind: 'object'
  type: ObjectSchemaType
  members: ObjectMember[]
  groups?: FieldGroup[]
  onSelectGroup: (name: string) => void
  hidden?: boolean
  value?: Record<string, unknown>
  readOnly?: boolean
  collapsed?: boolean
  collapsible?: boolean
  onCollapse: () => void
  onExpand: () => void
}

export interface ArrayFieldProps extends BaseFieldProps {
  kind: 'array'
  type: ArraySchemaType
  members: PreparedProps<unknown>[]
  value?: unknown[]
}

export type FieldProps =
  | StringFieldProps
  | ObjectFieldProps
  | ArrayFieldProps
  | NumberFieldProps
  | BooleanFieldProps

export type RenderFieldCallback = (renderFieldProps: RenderFieldCallbackArg) => React.ReactNode
export type RenderFieldCallbackArg = FieldProps & {
  onChange: (event: PatchEvent) => void
}
export type RenderFieldSetCallback = (
  renderFieldSetProps: RenderFieldSetCallbackArg
) => React.ReactNode

export type RenderFieldSetCallbackArg = FieldSetProps & {
  children?: React.ReactNode
}
