import {type ObjectFormNode, type ObjectSchemaType} from '@sanity/types'

export type {BaseFormNode} from '@sanity/types'

/** @internal */
export interface HiddenField {
  kind: 'hidden'
  key: string
  name: string
  index: number
}

export type {
  ArrayOfObjectsFormNode,
  ArrayOfPrimitivesFormNode,
  BooleanFormNode,
  NumberFormNode,
  ObjectArrayFormNode,
  ObjectFormNode,
  PrimitiveFormNode,
  StringFormNode,
} from '@sanity/types'

/** @internal */
export type DocumentFormNode<
  T extends {[key in string]: unknown} = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType,
> = ObjectFormNode<T, S>
