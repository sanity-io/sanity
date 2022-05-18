import React, {memo} from 'react'
import {isArraySchemaType, isObjectSchemaType, isPrimitiveSchemaType} from '@sanity/types'
import {FieldMember} from '../../store/types/members'
import {
  RenderFieldCallback,
  RenderInputCallback,
  RenderArrayOfObjectsItemCallback,
  RenderArrayOfPrimitivesItemCallback,
  FIXME,
} from '../../types'
import {
  ArrayOfObjectsFormNode,
  ArrayOfPrimitivesFormNode,
  ObjectFormNode,
} from '../../store/types/nodes'
import {ArrayOfObjectsField} from './members/ArrayOfObjectsField'
import {PrimitiveField} from './members/PrimitiveField'
import {ObjectField} from './members/ObjectField'
import {ArrayOfPrimitivesField} from './members/ArrayOfPrimitivesField'

export interface MemberFieldProps {
  member: FieldMember
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
}

function isMemberObject(member: FieldMember): member is FieldMember<ObjectFormNode> {
  return isObjectSchemaType(member.field.schemaType)
}

function isMemberArrayOfPrimitives(
  member: FieldMember
): member is FieldMember<ArrayOfPrimitivesFormNode> {
  return (
    isArraySchemaType(member.field.schemaType) &&
    member.field.schemaType.of.every((ofType) => isPrimitiveSchemaType(ofType))
  )
}

function isMemberArrayOfObjects(
  member: FieldMember
): member is FieldMember<ArrayOfObjectsFormNode> {
  return (
    isArraySchemaType(member.field.schemaType) &&
    member.field.schemaType.of.every((ofType) => isObjectSchemaType(ofType))
  )
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

  if (isMemberArrayOfPrimitives(member)) {
    return (
      <ArrayOfPrimitivesField
        member={member}
        renderField={renderField}
        renderInput={renderInput}
        // todo: these have different signatures, so renderItem for a primitive input should not be the same as renderItem in array of object inputs
        renderItem={renderItem as FIXME}
      />
    )
  }

  if (isMemberArrayOfObjects(member)) {
    return (
      <ArrayOfObjectsField
        member={member}
        renderField={renderField}
        renderInput={renderInput}
        renderItem={renderItem}
      />
    )
  }

  return <PrimitiveField member={member} renderField={renderField} renderInput={renderInput} />
})
