import {rem, Skeleton} from '@sanity/ui'
import {memo} from 'react'

import {type FIXME} from '../../../FIXME'
import {FormRow} from '../../components/layout/FormRow'
import {type FieldMember} from '../../store/types/members'
import {
  type RenderAnnotationCallback,
  type RenderArrayOfObjectsItemCallback,
  type RenderBlockCallback,
  type RenderFieldCallback,
  type RenderInputCallback,
  type RenderPreviewCallback,
} from '../../types/renderCallback'
import {FormNodeSuspense, type FormNodeComponentKey} from '../common/FormNodeSuspense'
import {ArrayOfObjectsField} from './fields/ArrayOfObjectsField'
import {ArrayOfPrimitivesField} from './fields/ArrayOfPrimitivesField'
import {
  isMemberArrayOfObjects,
  isMemberArrayOfPrimitives,
  isMemberObject,
  isMemberPrimitive,
} from './fields/asserters'
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

const FIELD_COMPONENTS: readonly FormNodeComponentKey[] = ['field', 'input']

// In a `FormRow`, so it lines up with the field it stands in for
function FieldBestEffortFallback() {
  return (
    <FormRow>
      <Skeleton data-testid="custom-field-fallback" radius={1} animated style={{height: rem(35)}} />
    </FormRow>
  )
}

/**
 * @hidden
 * @beta */
export const MemberField = memo(function MemberField(props: MemberFieldProps) {
  const {member} = props
  return (
    <FormNodeSuspense
      fallback={<FieldBestEffortFallback />}
      schemaType={member.field.schemaType}
      path={member.field.path}
      components={FIELD_COMPONENTS}
    >
      <FieldOfMemberType {...props} />
    </FormNodeSuspense>
  )
})

function FieldOfMemberType(props: MemberFieldProps) {
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

  if (isMemberPrimitive(member)) {
    return <PrimitiveField member={member} renderField={renderField} renderInput={renderInput} />
  }

  return null
}
