import {SchemaType} from '@sanity/types'
import {ArrayOfObjectsFormNode, FieldMember, ObjectMember} from '../../store'

/**
 * @internal
 */
export function isBlockType(type: SchemaType): boolean {
  if (type.type) {
    return isBlockType(type.type)
  }

  return type.name === 'block'
}

/**
 * @internal
 */
export function isObjectFieldMember(
  member: ObjectMember
): member is FieldMember<ArrayOfObjectsFormNode> {
  return member.kind === 'field' && member.field.schemaType.jsonType === 'object'
}

/**
 * @internal
 */
export function isArrayOfObjectsFieldMember(
  member: ObjectMember
): member is FieldMember<ArrayOfObjectsFormNode> {
  return member.kind === 'field' && member.field.schemaType.jsonType === 'array'
}
