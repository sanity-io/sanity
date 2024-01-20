import {memo} from 'react'

import {type FIXME} from '../../../FIXME'
import {type FieldMember} from '../../store'
import {
  type RenderAnnotationCallback,
  type RenderArrayOfObjectsItemCallback,
  type RenderBlockCallback,
  type RenderFieldCallback,
  type RenderInputCallback,
  type RenderPreviewCallback,
} from '../../types'
import {ArrayOfObjectsField} from './fields/ArrayOfObjectsField'
import {ArrayOfPrimitivesField} from './fields/ArrayOfPrimitivesField'
import {isMemberArrayOfObjects, isMemberArrayOfPrimitives, isMemberObject} from './fields/asserters'
import {ObjectField} from './fields/ObjectField'
import {PrimitiveField} from './fields/PrimitiveField'

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
