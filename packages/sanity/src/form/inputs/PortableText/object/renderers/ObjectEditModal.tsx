import {
  EditorSelection,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {_getModalOption} from '../helpers'
import {isFieldMember, PortableTextMemberItem} from '../../PortableTextInput'
import {DefaultEditDialog} from './DefaultEditDialog'
import {PopoverEditDialog} from './PopoverEditDialog'

export function ObjectEditModal(props: {
  children: React.ReactNode
  memberItem: PortableTextMemberItem
  onClose: () => void
  scrollElement: HTMLElement
}) {
  const {memberItem, onClose, scrollElement} = props
  const {schemaType} = memberItem.member.item
  const modalOption = useMemo(() => _getModalOption({type: schemaType}), [schemaType])
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

  const title = <>Edit {memberItem.member.item.schemaType.title}</>

  // Set focus on the first field
  useEffect(() => {
    if (firstField) {
      return
    }
    const firstFieldMember = memberItem.member.item.members.find((m) => m.kind === 'field')
    if (firstFieldMember && isFieldMember(firstFieldMember)) {
      const firstFieldElm = document.getElementById(firstFieldMember.field.id) as HTMLElement | null
      if (firstFieldElm) {
        setFirstField(firstFieldElm)
        firstFieldElm.focus()
      }
    }
  }, [firstField, memberItem])

  if (modalOption.type === 'popover') {
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
