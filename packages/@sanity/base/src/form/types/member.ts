import {InputProps, ObjectInputProps} from '../types'
import {FieldSetProps} from './fieldsetProps'

export type ObjectMember = FieldMember | FieldSetMember

export interface ArrayOfObjectsMember {
  type: 'item'
  key: string
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
