import {
  ArraySchemaType,
  BooleanSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'
import {ArrayOfObjectsMember, ObjectMember} from './members'
import {FieldGroupState} from './fieldGroupState'

export interface BaseNode<T = unknown, S extends SchemaType = SchemaType> {
  // constants
  id: string
  schemaType: S
  level: number
  path: Path

  // state
  compareValue: T | undefined
  value: T | undefined
  readOnly?: boolean
  focused?: boolean
}

export interface ObjectNode<
  T extends {[key in string]: unknown} = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType
> extends BaseNode<T, S> {
  members: ObjectMember[]
  groups: FieldGroupState[]

  focusPath: Path
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DocumentNode<
  T extends {[key in string]: unknown} = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType
> extends ObjectNode<T, S> {}

export interface ArrayOfObjectsNode<
  T extends any[] = unknown[],
  S extends ArraySchemaType = ArraySchemaType
> extends BaseNode<T, S> {
  members: ArrayOfObjectsMember[]

  focusPath: Path
}

export interface ArrayOfPrimitivesNode<
  T extends any[] = unknown[],
  S extends ArraySchemaType = ArraySchemaType
> extends BaseNode<T, S> {
  members: ArrayOfPrimitivesNode[]

  focusPath: Path
  collapsed: boolean
  collapsible: boolean
}

export type BooleanNode<S extends BooleanSchemaType = BooleanSchemaType> = BaseNode<boolean, S>
export type NumberNode<S extends NumberSchemaType = NumberSchemaType> = BaseNode<number, S>
export type StringNode<S extends StringSchemaType = StringSchemaType> = BaseNode<string, S>

export type PrimitiveNode = BooleanNode | NumberNode | StringNode
