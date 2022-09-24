import {SchemaType} from '@sanity/types'
import {ArrayOfObjectsFormNode, FieldMember, ObjectMember} from '../../store'

export function _isBlockType(type: SchemaType): boolean {
  if (type.type) {
    return _isBlockType(type.type)
  }

  return type.name === 'block'
}

export function _isObjectFieldMember(
  member: ObjectMember
): member is FieldMember<ArrayOfObjectsFormNode> {
  return member.kind === 'field' && member.field.schemaType.jsonType === 'object'
}

export function _isArrayOfObjectsFieldMember(
  member: ObjectMember
): member is FieldMember<ArrayOfObjectsFormNode> {
  return member.kind === 'field' && member.field.schemaType.jsonType === 'array'
}
