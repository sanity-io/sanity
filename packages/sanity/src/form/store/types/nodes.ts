import {
  ArraySchemaType,
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'
import {NodePresence, NodeValidation} from '../../types/common'
import {ArrayOfObjectsMember, ArrayOfPrimitivesMember, ObjectMember} from './members'
import {FormFieldGroup} from './fieldGroup'

export interface BaseFormNode<T = unknown, S extends SchemaType = SchemaType> {
  // constants
  id: string
  schemaType: S
  level: number
  path: Path

  // state
  presence: NodePresence[]
  validation: NodeValidation[]
  value: T | undefined
  readOnly?: boolean
  focused?: boolean
  changed: boolean
}

export interface ObjectFormNode<
  T = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType
> extends BaseFormNode<T, S> {
  members: ObjectMember[]
  groups: FormFieldGroup[]

  focusPath: Path
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DocumentFormNode<
  T extends {[key in string]: unknown} = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType
> extends ObjectFormNode<T, S> {}

export interface ArrayOfObjectsFormNode<
  T extends any[] = unknown[],
  S extends ArraySchemaType = ArraySchemaType
> extends BaseFormNode<T, S> {
  members: ArrayOfObjectsMember[]

  focusPath: Path
}

export interface ArrayOfPrimitivesFormNode<
  T extends (string | number | boolean)[] = (string | number | boolean)[],
  S extends ArraySchemaType = ArraySchemaType
> extends BaseFormNode<T, S> {
  members: ArrayOfPrimitivesMember[]

  focusPath: Path
}

export type BooleanFormNode<S extends BooleanSchemaType = BooleanSchemaType> = BaseFormNode<
  boolean,
  S
>
export type NumberFormNode<S extends NumberSchemaType = NumberSchemaType> = BaseFormNode<number, S>
export type StringFormNode<S extends StringSchemaType = StringSchemaType> = BaseFormNode<string, S>

export type PrimitiveFormNode = BooleanFormNode | NumberFormNode | StringFormNode
