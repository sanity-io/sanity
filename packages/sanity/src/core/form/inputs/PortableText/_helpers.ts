import {type SchemaType} from '@sanity/types'

import type {ArrayOfObjectsFormNode} from '../../store/types/nodes'
import {type FieldMember, type ObjectMember} from '../../store/types/members'

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
  member: ObjectMember,
): member is FieldMember<ArrayOfObjectsFormNode> {
  return member.kind === 'field' && member.field.schemaType.jsonType === 'object'
}

/**
 * @internal
 */
export function isArrayOfObjectsFieldMember(
  member: ObjectMember,
): member is FieldMember<ArrayOfObjectsFormNode> {
  return member.kind === 'field' && member.field.schemaType.jsonType === 'array'
}
