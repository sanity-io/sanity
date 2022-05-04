import React, {memo} from 'react'
import {isArraySchemaType, isObjectSchemaType} from '@sanity/types'
import {FieldMember} from '../../store/types/members'
import {RenderFieldCallback, RenderInputCallback, RenderArrayItemCallback} from '../../types'
import {ArrayOfObjectsNode, ObjectNode} from '../../store/types/nodes'
import {ArrayField} from './members/ArrayField'
import {PrimitiveField} from './members/PrimitiveField'
import {ObjectField} from './members/ObjectField'

export interface MemberFieldProps {
  member: FieldMember
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayItemCallback
}

function isMemberObject(member: FieldMember): member is FieldMember<ObjectNode> {
  return isObjectSchemaType(member.field.schemaType)
}

function isMemberArray(member: FieldMember): member is FieldMember<ArrayOfObjectsNode> {
  return isArraySchemaType(member.field.schemaType)
}

export const MemberField = memo(function MemberField(props: MemberFieldProps) {
  const {member, renderField, renderInput, renderItem} = props

  if (isMemberObject(member)) {
    // this field is of an object type
    return (
      <ObjectField
        member={member}
        renderField={renderField}
        renderInput={renderInput}
        renderItem={renderItem}
      />
    )
  }

  if (isMemberArray(member)) {
    return (
      <ArrayField
        member={member}
        renderField={renderField}
        renderInput={renderInput}
        renderItem={renderItem}
      />
    )
  }

  return <PrimitiveField member={member} renderField={renderField} renderInput={renderInput} />
})
