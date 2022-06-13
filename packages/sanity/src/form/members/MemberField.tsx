import React, {memo} from 'react'
import {FieldMember} from '../store'
import {
  RenderFieldCallback,
  RenderInputCallback,
  RenderArrayOfObjectsItemCallback,
  FIXME,
  RenderPreviewCallback,
} from '../types'
import {ArrayOfObjectsField} from './fields/ArrayOfObjectsField'
import {PrimitiveField} from './fields/PrimitiveField'
import {ObjectField} from './fields/ObjectField'
import {ArrayOfPrimitivesField} from './fields/ArrayOfPrimitivesField'
import {isMemberArrayOfObjects, isMemberArrayOfPrimitives, isMemberObject} from './fields/asserters'

export interface MemberFieldProps {
  member: FieldMember
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
}

export const MemberField = memo(function MemberField(props: MemberFieldProps) {
  const {member, renderField, renderInput, renderItem, renderPreview} = props

  if (isMemberObject(member)) {
    // this field is of an object type
    return (
      <ObjectField
        member={member}
        renderField={renderField}
        renderInput={renderInput}
        renderItem={renderItem}
        renderPreview={renderPreview}
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
        renderPreview={renderPreview}
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
        renderPreview={renderPreview}
      />
    )
  }

  return <PrimitiveField member={member} renderField={renderField} renderInput={renderInput} />
})
