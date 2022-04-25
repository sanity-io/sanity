import {ObjectInputProps} from '../types'
import {FieldProps} from './fieldProps'
import {FieldSetProps} from './fieldsetProps'

export type ObjectMember = FieldMember | FieldSetMember

export interface ArrayItemMember {
  type: 'item'
  key: string
  item: ObjectInputProps
}

// note: array members doesn't have the field/fieldSet divide
export type ArrayMember = ArrayItemMember // todo: add more members, e.g. placehoders for invalid values etc.

export interface FieldMember {
  type: 'field'
  field: FieldProps
  key: string
}

export interface FieldSetMember {
  type: 'fieldSet'
  key: string
  fieldSet: FieldSetProps
}
