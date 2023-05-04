import {
  EditorSelection,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import React, {useCallback, useMemo, useRef} from 'react'
import {ObjectSchemaType} from '@sanity/types'
import {_getModalOption} from '../helpers'
import {DefaultEditDialog} from './DialogModal'
import {PopoverEditDialog} from './PopoverModal'

export function ObjectEditModal(props: {
  boundaryElement: HTMLElement | undefined
  children: React.ReactNode
  defaultType: 'dialog' | 'popover'
  onClose: () => void
  referenceElement: HTMLElement | undefined
  schemaType: ObjectSchemaType
  autofocus?: boolean
}) {
  const {onClose, defaultType, referenceElement, boundaryElement, schemaType, autofocus} = props
  const editor = usePortableTextEditor()

  const schemaModalOption = useMemo(() => _getModalOption(schemaType), [schemaType])
  const modalType = schemaModalOption?.type || defaultType

  const modalTitle = <>Edit {schemaType.title}</>

  // The initial editor selection when opening the object
  const initialSelection = useRef<EditorSelection | null>(PortableTextEditor.getSelection(editor))

  const handleClose = useCallback(() => {
    PortableTextEditor.select(editor, initialSelection.current)
    onClose()
  }, [editor, onClose])

  const modalWidth = schemaModalOption?.width

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
    <DefaultEditDialog
      onClose={handleClose}
      title={modalTitle}
      width={modalWidth}
      autofocus={autofocus}
    >
      {props.children}
    </DefaultEditDialog>
  )
}
