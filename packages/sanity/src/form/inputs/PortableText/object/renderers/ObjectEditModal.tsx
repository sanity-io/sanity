import {
  EditorSelection,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {_getModalOption} from '../helpers'
import {PortableTextMemberItem} from '../../PortableTextInput'
import {DefaultEditDialog} from './DefaultEditDialog'
import {PopoverEditDialog} from './PopoverEditDialog'
import {ModalType} from './types'

export function ObjectEditModal(props: {
  children: React.ReactNode
  kind: PortableTextMemberItem['kind']
  memberItem: PortableTextMemberItem
  onClose: () => void
  scrollElement: HTMLElement
}) {
  const {memberItem, onClose, scrollElement, kind} = props
  const {schemaType} = memberItem.node
  const modalOption = useMemo(() => _getModalOption({schemaType}), [schemaType])

  const modalType: ModalType = useMemo(() => {
    if (modalOption.type) return modalOption.type

    // If the object is inline or an annotation, then default to "popover"
    if (kind === 'inlineObject' || kind === 'annotation') return 'popover'

    return 'dialog'
  }, [kind, modalOption])

  const [firstField, setFirstField] = useState<HTMLElement | null>(null)
  const editor = usePortableTextEditor()
  const initialSelection = useRef<EditorSelection | null>(PortableTextEditor.getSelection(editor))

  const handleClose = useCallback(() => {
    onClose()
    // Force a new selection here as the selection is a callback dep. for showing the popup
    PortableTextEditor.select(editor, null)
    PortableTextEditor.focus(editor)
    PortableTextEditor.select(editor, initialSelection.current)
  }, [editor, onClose])

  const title = <>Edit {memberItem.node.schemaType.title}</>

  // Set focus on the first field
  useEffect(() => {
    if (firstField) {
      return
    }
    const firstFieldMember = memberItem.node.members.find((m) => m.kind === 'field')
    if (firstFieldMember && firstFieldMember.kind === 'field') {
      const firstFieldElm = document.getElementById(firstFieldMember.field.id) as HTMLElement | null
      if (firstFieldElm) {
        setFirstField(firstFieldElm)
        firstFieldElm.focus()
      }
    }
  }, [firstField, memberItem])

  if (modalType === 'popover') {
    return (
      <PopoverEditDialog
        elementRef={memberItem.elementRef}
        onClose={handleClose}
        scrollElement={scrollElement}
        title={title}
      >
        {props.children}
      </PopoverEditDialog>
    )
  }

  return (
    <DefaultEditDialog title={title} onClose={handleClose}>
      {props.children}
    </DefaultEditDialog>
  )
}
