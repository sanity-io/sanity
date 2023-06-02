import React, {memo} from 'react'
import {FIXME} from '../../../FIXME'
import {FieldMember} from '../../store'
import {
  RenderFieldCallback,
  RenderInputCallback,
  RenderArrayOfObjectsItemCallback,
  RenderPreviewCallback,
  RenderBlockCallback,
  RenderAnnotationCallback,
} from '../../types'
import {ArrayOfObjectsField} from './fields/ArrayOfObjectsField'
import {PrimitiveField} from './fields/PrimitiveField'
import {ObjectField} from './fields/ObjectField'
import {ArrayOfPrimitivesField} from './fields/ArrayOfPrimitivesField'
import {isMemberArrayOfObjects, isMemberArrayOfPrimitives, isMemberObject} from './fields/asserters'

/** @internal */
export interface MemberFieldProps {
  member: FieldMember
  renderAnnotation?: RenderAnnotationCallback
  renderBlock?: RenderBlockCallback
  renderField: RenderFieldCallback
  renderInlineBlock?: RenderBlockCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
}

/** @internal */
export const MemberField = memo(function MemberField(props: MemberFieldProps) {
  const {
    member,
    renderAnnotation,
    renderBlock,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview,
  } = props

  if (isMemberObject(member)) {
    // this field is of an object type
    return (
      <ObjectField
        member={member}
        renderAnnotation={renderAnnotation}
        renderBlock={renderBlock}
        renderField={renderField}
        renderInlineBlock={renderInlineBlock}
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
        renderAnnotation={renderAnnotation}
        renderBlock={renderBlock}
        renderField={renderField}
        renderInput={renderInput}
        renderInlineBlock={renderInlineBlock}
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
        renderAnnotation={renderAnnotation}
        renderBlock={renderBlock}
        renderField={renderField}
        renderInlineBlock={renderInlineBlock}
        renderInput={renderInput}
        renderItem={renderItem}
        renderPreview={renderPreview}
      />
    )
  }

  return <PrimitiveField member={member} renderField={renderField} renderInput={renderInput} />
})
