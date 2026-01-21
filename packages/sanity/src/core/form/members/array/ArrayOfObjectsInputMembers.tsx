import type {ArrayOfObjectsMember} from '../../store/types/members'
import type {
  RenderAnnotationCallback,
  RenderArrayOfObjectsItemCallback,
  RenderBlockCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
} from '../../types/renderCallback'
import {ArrayOfObjectsInputMember} from './ArrayOfObjectsInputMember'

/** @internal */
export interface ArrayOfObjectsInputMembersProps {
  members: ArrayOfObjectsMember[]
  renderAnnotation?: RenderAnnotationCallback
  renderBlock?: RenderBlockCallback
  renderInlineBlock?: RenderBlockCallback
  renderInput: RenderInputCallback
  renderField: RenderFieldCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
}

/**
 * Convenience component for wrapping an array of objects
 * @internal
 */
export function ArrayOfObjectsInputMembers(props: ArrayOfObjectsInputMembersProps) {
  const {members, ...rest} = props
  return (
    <>
      {members.map((member) => (
        <ArrayOfObjectsInputMember key={member.key} member={member} {...rest} />
      ))}
    </>
  )
}
