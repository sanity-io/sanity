import {PortableTextEditor, usePortableTextEditor} from '@portabletext/editor'
import {useBoundaryElement} from '@sanity/ui'
import {useCallback, useMemo} from 'react'

import {isEmptyItem} from '../../../../store/utils/isEmptyItem'
import {usePortableTextMemberItemElementRefs} from '../../contexts/PortableTextMemberItemElementRefsProvider'
import {usePortableTextMemberItems} from '../../hooks/usePortableTextMembers'
import {ObjectEditModal} from './ObjectEditModal'

export function AnnotationObjectEditModal(props: {
  focused: boolean | undefined
  onItemClose: () => void
  referenceBoundary: HTMLElement | null
}) {
  const editor = usePortableTextEditor()
  const boundaryElement = useBoundaryElement().element
  const portableTextMemberItems = usePortableTextMemberItems()
  const elementRefs = usePortableTextMemberItemElementRefs()
  const openAnnotation = useMemo(() => {
    return portableTextMemberItems.find((m) => m.kind === 'annotation' && m.member.open)
  }, [portableTextMemberItems])

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

  if (!openAnnotation) {
    return null
  }

  const elementRef = elementRefs[openAnnotation.member.key]

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
      {openAnnotation.input}
    </ObjectEditModal>
  )
}
