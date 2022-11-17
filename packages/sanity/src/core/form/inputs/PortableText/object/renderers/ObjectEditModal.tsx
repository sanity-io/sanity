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

export function ObjectEditModal(props: {
  children: React.ReactNode
  kind: PortableTextMemberItem['kind']
  memberItem: PortableTextMemberItem
  onClose: () => void
  scrollElement: HTMLElement
}) {
  const {memberItem, onClose, scrollElement, kind} = props
  const {schemaType} = memberItem.node
  const modalOption = useMemo(() => _getModalOption(schemaType), [schemaType])

  const modalType = useMemo(() => {
    if (modalOption?.type) return modalOption.type

    // If the object is inline or an annotation, then default to "popover"
    return kind === 'inlineObject' || kind === 'annotation' ? 'popover' : 'dialog'
  }, [kind, modalOption])

  const [firstField, setFirstField] = useState<HTMLElement | null>(null)
  const editor = usePortableTextEditor()
  const initialSelection = useRef<EditorSelection | null>(PortableTextEditor.getSelection(editor))

  const handleClose = useCallback(() => {
    // Force a new selection here as the selection is a callback dep. for showing the popup
    PortableTextEditor.focus(editor)
    PortableTextEditor.select(editor, initialSelection.current)
    onClose()
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
    // 2022/11/18: Test if the elementRef is set before opening. On newly created annotations,
    // this might not be true, and currently the @sanity/ui Popover code will not
    // properly show the Popover if it's given at a later point.
    return memberItem.elementRef?.current ? (
      <PopoverEditDialog
        elementRef={memberItem.elementRef}
        onClose={handleClose}
        width={modalOption?.width}
        scrollElement={scrollElement}
        title={title}
      >
        {props.children}
      </PopoverEditDialog>
    ) : null
  }

  return (
    <DefaultEditDialog title={title} onClose={handleClose} width={modalOption?.width}>
      {props.children}
    </DefaultEditDialog>
  )
}
