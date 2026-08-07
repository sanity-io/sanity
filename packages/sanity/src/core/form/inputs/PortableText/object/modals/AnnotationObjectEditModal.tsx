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
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      PortableTextEditor.removeAnnotation(editor, openAnnotation.node.schemaType)
    }

    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    PortableTextEditor.focus(editor)
  }, [editor, props, openAnnotation])

  if (!openAnnotation) {
    return null
  }

  const elementRef = elementRefs[openAnnotation.key]

  if (!elementRef || !props.referenceBoundary?.contains(elementRef)) {
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
