import {
  ArraySchemaType,
  BooleanSchemaType,
  FormNodeValidation,
  NumberSchemaType,
  ObjectSchemaType,
  Path,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'
import {ObjectItem} from '../../types'
import {FormNodePresence} from '../../../presence'
import {ArrayOfObjectsMember, ArrayOfPrimitivesMember, ObjectMember} from './members'
import {FormFieldGroup} from './fieldGroup'

/**
 * @hidden
 * @public
 */
export interface BaseFormNode<T = unknown, S extends SchemaType = SchemaType> {
  // constants
  /** The unique identifier of the node. */
  id: string
  /** The schema type of the node. */
  schemaType: S
  /** The level of the node in the form hierarchy. */
  level: number
  /** The path of the node in the form hierarchy. */
  path: Path

  // state
  /**
   * @hidden
   * @beta */
  presence: FormNodePresence[]
  /** The validation errors of the node. */
  validation: FormNodeValidation[]
  /** The value of the node. */
  value: T | undefined
  /** Whether the node is read-only. */
  readOnly?: boolean
  /** Whether the node is focused. */
  focused?: boolean
  /** Whether the node has been changed. */
  changed: boolean
}

/** @internal */
export interface HiddenField {
  kind: 'hidden'
  key: string
  name: string
  index: number
}

/** @public */
export interface ObjectFormNode<
  T = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType
> extends BaseFormNode<T, S> {
  /** The focus path of the form node. */
  focusPath: Path
  /**
   * @hidden
   * @beta */
  groups: FormFieldGroup[]
  /**
   * @hidden
   * @beta */
  members: ObjectMember[]
  /** @internal */
  _allMembers: (ObjectMember | HiddenField)[]
}

/** @public */
export interface ObjectArrayFormNode<
  T extends ObjectItem = ObjectItem,
  S extends ObjectSchemaType = ObjectSchemaType
> extends BaseFormNode<T, S> {
  /** The focus path of the form node. */
  focusPath: Path
  value: T

  /**
   * @hidden
   * @beta */
  groups: FormFieldGroup[]
  /**
   * @hidden
   * @beta */
  members: ObjectMember[]

  /** @internal */
  _allMembers: ObjectMember[]
  changesOpen?: boolean
}

/** @internal */
export type DocumentFormNode<
  T extends {[key in string]: unknown} = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType
> = ObjectFormNode<T, S>

/** @public */
export interface ArrayOfObjectsFormNode<
  T extends any[] = unknown[],
  S extends ArraySchemaType = ArraySchemaType
> extends BaseFormNode<T, S> {
  /** The focus path of the form node. */
  focusPath: Path
  /**
   * @hidden
   * @beta */
  members: ArrayOfObjectsMember[]
}

/** @public */
export interface ArrayOfPrimitivesFormNode<
  T extends (string | number | boolean)[] = (string | number | boolean)[],
  S extends ArraySchemaType = ArraySchemaType
> extends BaseFormNode<T, S> {
  /** The focus path of the form node. */
  focusPath: Path
  /**
   * @hidden
   * @beta */
  members: ArrayOfPrimitivesMember[]
}

/** @public */
export type BooleanFormNode<S extends BooleanSchemaType = BooleanSchemaType> = BaseFormNode<
  boolean,
  S
>

/** @public */
export type NumberFormNode<S extends NumberSchemaType = NumberSchemaType> = BaseFormNode<number, S>

/** @public */
export type StringFormNode<S extends StringSchemaType = StringSchemaType> = BaseFormNode<string, S>

/**
 * @hidden
 * @beta */
export type PrimitiveFormNode = BooleanFormNode | NumberFormNode | StringFormNode
