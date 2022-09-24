import {FieldsetState} from './fieldsetState'
import {BaseFormNode, ObjectFormNode, PrimitiveFormNode} from './nodes'
import {ArrayItemError, FieldError} from './memberErrors'

export type ObjectMember = FieldMember | FieldSetMember | FieldError
export type ArrayOfObjectsMember = ArrayOfObjectsItemMember | ArrayItemError
export type ArrayOfPrimitivesMember = ArrayOfPrimitivesItemMember | ArrayItemError

export interface ArrayOfObjectsItemMember<Node extends ObjectFormNode = ObjectFormNode> {
  kind: 'item'
  key: string
  index: number
  // the state resolver should make sure this
  // gets collapsible: false and collapsed by default
  // Note: we want to use collapsed because the default will be to render
  // collapsible is an "optional" feature, but supported by array inputs which renders all items as collapsed by default
  // 'collapsed' must be preserved as boolean|undefined
  collapsed: undefined | boolean
  collapsible: true
  // note: ObjectInputProps.collapsed always follows the array item collapsed state
  // this means you cannot have an expanded array item with a collapsed object inside it

  open: boolean

  item: Node
}

export interface ArrayOfPrimitivesItemMember<Node extends PrimitiveFormNode = PrimitiveFormNode> {
  kind: 'item'
  // note: there's no persistent handle on primitive items, so our only option is to use the index as key here
  key: string
  index: number
  // the state resolver should make sure this
  // gets collapsible: false and collapsed by default

  // todo: consider if this makes sense
  // collapsed: undefined | boolean
  // collapsible: true

  open: boolean

  // note: ObjectInputProps.collapsed always follows the array item collapsed state
  // this means you cannot have an expanded array item with a collapsed object inside it
  item: Node
}

export interface FieldMember<Node extends BaseFormNode = BaseFormNode> {
  kind: 'field'
  key: string
  name: string
  index: number
  collapsed: boolean | undefined
  collapsible: boolean | undefined
  open: boolean
  field: Node
}

export interface FieldSetMember {
  kind: 'fieldSet'
  key: string
  fieldSet: FieldsetState
}
