import {InputProps, ObjectInputProps} from '../types'
import {FieldSetProps} from './fieldsetProps'

export type ObjectMember = FieldMember | FieldSetMember

export interface ArrayOfObjectsMember {
  type: 'item'
  key: string
  // the state resolver should make sure this
  // gets collapsible: false and collapsed by default
  collapsed: undefined | boolean
  collapsible: true
  // note: ObjectInputProps.collapsed always follows the array item collapsed state
  // this means you cannot have an expanded array item with a collapsed object inside it
  item: ObjectInputProps
}

export interface FieldMember {
  type: 'field'
  key: string
  name: string
  index: number
  field: InputProps
}

export interface FieldSetMember {
  type: 'fieldSet'
  key: string
  fieldSet: FieldSetProps
}

// we want to use collapsed
// because the default will be to render
// collapsible is an "optional" feature, but supported by array inputs which renders all items as collapsed by default
// 'collapsed' must be boolean|undefined
