import {FieldsetState} from './fieldsetState'
import {BaseNode, ObjectNode, PrimitiveNode} from './nodes'

export type ObjectMember = FieldMember | FieldSetMember

export interface ArrayOfObjectsMember<Node extends ObjectNode = ObjectNode> {
  kind: 'item'
  key: string
  // the state resolver should make sure this
  // gets collapsible: false and collapsed by default
  collapsed: undefined | boolean
  collapsible: true
  // note: ObjectInputProps.collapsed always follows the array item collapsed state
  // this means you cannot have an expanded array item with a collapsed object inside it
  item: Node
}

export interface ArrayOfPrimitivesMember<Node extends PrimitiveNode = PrimitiveNode> {
  kind: 'item'
  // the state resolver should make sure this
  // gets collapsible: false and collapsed by default
  collapsed: undefined | boolean
  collapsible: true
  // note: ObjectInputProps.collapsed always follows the array item collapsed state
  // this means you cannot have an expanded array item with a collapsed object inside it
  item: Node
}

export interface FieldMember<Node extends BaseNode = BaseNode> {
  kind: 'field'
  key: string
  name: string
  index: number
  field: Node
}

export interface FieldSetMember {
  kind: 'fieldSet'
  key: string
  fieldSet: FieldsetState
}

// we want to use collapsed
// because the default will be to render
// collapsible is an "optional" feature, but supported by array inputs which renders all items as collapsed by default
// 'collapsed' must be boolean|undefined
