import {useMemo} from 'react'

import {type ObjectMember} from '../../store'
import {
  type RenderAnnotationCallback,
  type RenderArrayOfObjectsItemCallback,
  type RenderBlockCallback,
  type RenderFieldCallback,
  type RenderInputCallback,
  type RenderPreviewCallback,
} from '../../types'
import {ObjectInputMember} from './ObjectInputMember'

/** @internal */
export interface ObjectMembersProps {
  members: ObjectMember[]
  renderAnnotation?: RenderAnnotationCallback
  renderBlock?: RenderBlockCallback
  renderInlineBlock?: RenderBlockCallback
  renderInput: RenderInputCallback
  renderField: RenderFieldCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
}

/**
 * Convenience component for wrapping an object input
 * @internal
 */
export function ObjectInputMembers(props: ObjectMembersProps) {
  const {
    members,
    renderAnnotation,
    renderBlock,
    renderInput,
    renderInlineBlock,
    renderField,
    renderItem,
    renderPreview,
  } = props

  const renderMembers = useMemo(
    () =>
      members.map((member) => (
        <ObjectInputMember
          key={member.key}
          member={member}
          renderAnnotation={renderAnnotation}
          renderBlock={renderBlock}
          renderField={renderField}
          renderInlineBlock={renderInlineBlock}
          renderInput={renderInput}
          renderItem={renderItem}
          renderPreview={renderPreview}
        />
      )),
    [
      members,
      renderAnnotation,
      renderBlock,
      renderField,
      renderInlineBlock,
      renderInput,
      renderItem,
      renderPreview,
    ],
  )

  return <>{renderMembers}</>
}

/**
 * @deprecated Use ObjectInputMembers instead
 * @internal
 */
export const ObjectMembers = ObjectInputMembers
