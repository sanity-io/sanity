import {
  type ArraySchemaType,
  type BooleanSchemaType,
  type NumberSchemaType,
  type ObjectSchemaType,
  type Path,
  type StringSchemaType,
} from '@sanity/types'
import {type BaseFormNode, type ObjectFormNode} from 'sanity/_singleton'

import {type ArrayOfObjectsMember, type ArrayOfPrimitivesMember} from './members'

/** @internal */
export interface HiddenField {
  kind: 'hidden'
  key: string
  name: string
  index: number
}

/** @internal */
export type DocumentFormNode<
  T extends {[key in string]: unknown} = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType,
> = ObjectFormNode<T, S>

/** @public */
export interface ArrayOfObjectsFormNode<
  T extends any[] = unknown[],
  S extends ArraySchemaType = ArraySchemaType,
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
  S extends ArraySchemaType = ArraySchemaType,
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
