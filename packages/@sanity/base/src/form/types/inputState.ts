import {
  ArraySchemaType,
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'
import {ArrayOfObjectsMember, ObjectMember} from './member'
import {FieldGroup} from './fieldGroup'
import {FIXME} from './_transitional'

export interface BaseInputState<T = unknown, S extends SchemaType = SchemaType> {
  id: string
  type: S
  compareValue?: FIXME
  value: T | undefined
  title?: string
  description?: string
  hidden?: boolean
  level: number
  readOnly?: boolean
  path: Path
  focused: boolean
}

export interface ObjectInputState<
  T = {[key: string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType
> extends BaseInputState<T, S> {
  members: ObjectMember[]
  groups?: FieldGroup[]

  focusPath: Path
  collapsed?: boolean
  collapsible?: boolean
}

export interface ArrayOfObjectsInputState<
  T extends any[] = unknown[],
  S extends ArraySchemaType = ArraySchemaType
> extends BaseInputState<T, S> {
  members: ArrayOfObjectsMember[]

  focusPath: Path
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
