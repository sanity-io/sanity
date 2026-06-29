import {PortableTextEditor, usePortableTextEditor} from '@portabletext/editor'
import {useBoundaryElement} from '@sanity/ui'
import {useCallback} from 'react'

import {isEmptyItem} from '../../../../store/utils/isEmptyItem'
import {usePortableTextMemberItemElementRefs} from '../../contexts/PortableTextMemberItemElementRefsProvider'
import {useOpenPortableTextMember} from '../../hooks/useOpenPortableTextMember'
import {usePortableTextMemberItem} from '../../hooks/usePortableTextMemberItem'
import {ObjectEditModal} from './ObjectEditModal'

export function AnnotationObjectEditModal(props: {
  focused: boolean | undefined
  onItemClose: () => void
  referenceBoundary: HTMLElement | null
}) {
  const editor = usePortableTextEditor()
  const boundaryElement = useBoundaryElement().element
  const elementRefs = usePortableTextMemberItemElementRefs()
  const openAnnotation = useOpenPortableTextMember((kind) => kind === 'annotation')
  const annotationItem = usePortableTextMemberItem(openAnnotation?.member.item.path ?? [])

  const onClose = useCallback(() => {
    if (!openAnnotation) {
      return
    }

    props.onItemClose()

    if (openAnnotation.node.value && isEmptyItem(openAnnotation.node.value) && openAnnotation) {
      PortableTextEditor.removeAnnotation(editor, openAnnotation.node.schemaType)
    }

    PortableTextEditor.focus(editor)
  }, [editor, props, openAnnotation])

  if (!openAnnotation || !annotationItem) {
    return null
  }

  const elementRef = elementRefs[openAnnotation.key]

  if (!elementRef) {
    return null
  }

  return (
    <ObjectEditModal
      defaultType="popover"
      floatingBoundary={boundaryElement}
      onClose={onClose}
      autoFocus={Boolean(props.focused)}
      referenceBoundary={props.referenceBoundary}
      referenceElement={elementRef}
      schemaType={openAnnotation.node.schemaType}
    >
      {annotationItem.input}
    </ObjectEditModal>
  )
}
