import {ArraySchemaType} from '@sanity/types'
import {FieldsetState} from './fieldsetState'
import {BaseFormNode, ObjectArrayFormNode, PrimitiveFormNode} from './nodes'
import {ArrayItemError, FieldError} from './memberErrors'

/** @public */
export type ObjectMember = FieldMember | FieldSetMember | FieldError

/** @beta */
export type ArrayOfObjectsMember = ArrayOfObjectsItemMember | ArrayItemError

/** @beta */
export type ArrayOfPrimitivesMember = ArrayOfPrimitivesItemMember | ArrayItemError

/** @beta */
export interface ArrayOfObjectsItemMember<Node extends ObjectArrayFormNode = ObjectArrayFormNode> {
  kind: 'item'
  key: string
  index: number

  collapsed: boolean | undefined
  collapsible: boolean | undefined

  open: boolean

  parentSchemaType: ArraySchemaType

  /** @beta */
  item: Node
}

/** @beta */
export interface ArrayOfPrimitivesItemMember<Node extends PrimitiveFormNode = PrimitiveFormNode> {
  kind: 'item'
  // note: there's no persistent handle on primitive items, so our only option is to use the index as key here
  key: string
  index: number
  // the state resolver should make sure this
  // gets collapsible: false and collapsed by default

  open: boolean

  parentSchemaType: ArraySchemaType

  /** @beta */
  item: Node
}

/** @public */
export interface FieldMember<Node extends BaseFormNode = BaseFormNode> {
  kind: 'field'
  key: string
  name: string
  index: number
  collapsed: boolean | undefined
  collapsible: boolean | undefined
  open: boolean

  /**
   * @internal
   * Whether this field is in the selected group
   */
  inSelectedGroup: boolean

  /**
   * @internal
   * Names of the field groups this field is part of
   */
  groups: string[]

  /** @beta */
  field: Node
}

/** @public */
export interface FieldSetMember {
  kind: 'fieldSet'
  key: string

  // if it's hidden and in the currently selected group, it should still be excluded from its group
  _inSelectedGroup: boolean
  groups: string[]

  /** @beta */
  fieldSet: FieldsetState
}
