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
import {RenderArrayItemCallback, RenderFieldCallback} from './renderCallback'

export interface BaseItemInputProps<T = unknown, S extends SchemaType = SchemaType> {
  compareValue: T | undefined
  focusPath: Path
  focused: boolean
  hidden?: boolean
  inputProps: {
    id: string
    onBlur: (event?: React.FocusEvent) => void
    onFocus: (pathOrEvent?: Path | React.FocusEvent) => void
    readOnly: boolean
    ref: React.Ref<any> // @todo
  }
  level: number
  onChange: (patchEvent: PatchEvent) => void
  path: Path
  presence: FormFieldPresence[]
  type: S
  validation: ValidationMarker[]
  value: T | undefined
}

export interface ObjectItemInputProps<
  // eslint-disable-next-line @typescript-eslint/ban-types
  T extends {} = {},
  S extends ObjectSchemaType = ObjectSchemaType
> extends BaseItemInputProps<T, S> {
  kind: 'object'
  collapsed: boolean
  collapsible: boolean
  groups: FieldGroup[]
  members: ObjectMember[]
  onSelectFieldGroup: (groupName: string) => void
  onSetCollapsed: (collapsed: boolean) => void
  renderField: RenderFieldCallback
}

export interface ArrayItemInputProps<V = unknown, S extends ArraySchemaType = ArraySchemaType<V>>
  extends BaseItemInputProps<V, S> {
  kind: 'array'
  collapsed: boolean
  collapsible: boolean
  members: ArrayMember[]
  onInsert: (event: InsertEvent) => void
  onSetCollapsed: (collapsed: boolean) => void
  renderItem: RenderArrayItemCallback
}

export interface BooleanItemInputProps extends BaseItemInputProps<boolean, BooleanSchemaType> {
  kind: 'boolean'
}

export interface NumberItemInputProps extends BaseItemInputProps<number, NumberSchemaType> {
  kind: 'number'
}

export interface StringItemInputProps<S extends StringSchemaType = StringSchemaType>
  extends BaseItemInputProps<string, S> {
  kind: 'string'
}

export type ItemInputProps =
  | ObjectItemInputProps
  | ArrayItemInputProps
  | BooleanItemInputProps
  | NumberItemInputProps
  | StringItemInputProps
