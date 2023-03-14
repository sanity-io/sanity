import {
  EditorSelection,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {ObjectSchemaType} from '@sanity/types'
import {_getModalOption} from '../helpers'
import {ArrayOfObjectsItemMember, ObjectArrayFormNode, ObjectItem} from '../../../..'
import {DefaultEditDialog} from './DefaultEditDialog'
import {PopoverEditDialog} from './PopoverEditDialog'

export function ObjectEditModal(props: {
  boundaryElement: HTMLElement | undefined
  children: React.ReactNode
  referenceElement: HTMLElement | undefined
  member: ArrayOfObjectsItemMember<ObjectArrayFormNode<ObjectItem, ObjectSchemaType>>
  modalType: 'popover' | 'modal'
  onClose: () => void
}) {
  const {member, onClose, modalType: modalTypeFromProps, referenceElement, boundaryElement} = props
  const schemaType = member.item.schemaType
  const schemaModalOption = useMemo(() => _getModalOption(schemaType), [schemaType])
  const modalType = schemaModalOption?.type || modalTypeFromProps
  const title = <>Edit {schemaType.title}</>
  const [firstField, setFirstField] = useState<HTMLElement | null>(null)
  const editor = usePortableTextEditor()

  // The initial editor selection when opening the object
  const initialSelection = useRef<EditorSelection | null>(PortableTextEditor.getSelection(editor))

  const handleClose = useCallback(() => {
    PortableTextEditor.select(editor, initialSelection.current)
    PortableTextEditor.focus(editor)
    onClose()
  }, [editor, onClose])

  // // Set focus on the first field
  // useEffect(() => {
  //   if (firstField) {
  //     return
  //   }
  //   const firstFieldMember = member.item.members.find((m) => m.kind === 'field')
  //   if (firstFieldMember && firstFieldMember.kind === 'field') {
  //     const firstFieldElm = document.getElementById(firstFieldMember.field.id) as HTMLElement | null
  //     if (firstFieldElm) {
  //       setFirstField(firstFieldElm)
  //       firstFieldElm.focus()
  //     }
  //   }
  // }, [firstField, member])

  const width = schemaModalOption?.width

  if (modalType === 'popover') {
    return (
      <PopoverEditDialog
        onClose={handleClose}
        referenceElement={referenceElement}
        boundaryElement={boundaryElement}
        title={title}
        width={width}
      >
        {props.children}
      </PopoverEditDialog>
    )
  }

  return (
    <DefaultEditDialog title={title} onClose={handleClose} width={width}>
      {props.children}
    </DefaultEditDialog>
  )
}
