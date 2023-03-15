import {
  EditorSelection,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {ObjectSchemaType, Path} from '@sanity/types'
import {_getModalOption} from '../helpers'
import {pathToString} from '../../../../../field'
import {usePortableTextMemberItem} from '../../hooks/usePortableTextMembers'
import {DefaultEditDialog} from './DialogModal'
import {PopoverEditDialog} from './PopoverModal'

export function ObjectEditModal(props: {
  boundaryElement: HTMLElement | undefined
  children: React.ReactNode
  defaultType: 'dialog' | 'popover'
  onClose: () => void
  path: Path
  referenceElement: HTMLElement | undefined
  schemaType: ObjectSchemaType
}) {
  const {onClose, defaultType, referenceElement, boundaryElement, schemaType, path} = props
  const editor = usePortableTextEditor()
  const firstElementIsFocused = useRef(false)

  const schemaModalOption = useMemo(() => _getModalOption(schemaType), [schemaType])
  const modalType = schemaModalOption?.type || defaultType

  const modalTitle = <>Edit {schemaType.title}</>

  // The initial editor selection when opening the object
  const initialSelection = useRef<EditorSelection | null>(PortableTextEditor.getSelection(editor))

  const memberItem = usePortableTextMemberItem(pathToString(path))

  const handleClose = useCallback(() => {
    PortableTextEditor.select(editor, initialSelection.current)
    onClose()
  }, [editor, onClose])

  const modalWidth = schemaModalOption?.width

  // Set focus on the first field
  useEffect(() => {
    if (firstElementIsFocused.current) {
      return
    }
    const firstFieldMember = memberItem?.member.item.members.find((m) => m.kind === 'field')
    if (firstFieldMember && firstFieldMember.kind === 'field') {
      setTimeout(() => {
        const firstFieldElm = document.getElementById(
          firstFieldMember.field.id
        ) as HTMLElement | null
        if (firstFieldElm) {
          firstFieldElm.focus()
        }
      }, 0)
      firstElementIsFocused.current = true
    }
  }, [memberItem])

  if (modalType === 'popover') {
    return (
      <PopoverEditDialog
        boundaryElement={boundaryElement}
        onClose={handleClose}
        referenceElement={referenceElement}
        title={modalTitle}
        width={modalWidth}
      >
        {props.children}
      </PopoverEditDialog>
    )
  }

  return (
    <DefaultEditDialog onClose={handleClose} title={modalTitle} width={modalWidth}>
      {props.children}
    </DefaultEditDialog>
  )
}
