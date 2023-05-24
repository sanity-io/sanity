import React, {useCallback, useMemo} from 'react'
import {ObjectSchemaType} from '@sanity/types'
import {_getModalOption} from '../helpers'
import {DefaultEditDialog} from './DialogModal'
import {PopoverEditDialog} from './PopoverModal'

export function ObjectEditModal(props: {
  autofocus?: boolean
  boundaryElement: HTMLElement | undefined
  children: React.ReactNode
  defaultType: 'dialog' | 'popover'
  onClose: () => void
  referenceElement: HTMLElement | undefined
  schemaType: ObjectSchemaType
}) {
  const {onClose, defaultType, referenceElement, boundaryElement, schemaType, autofocus} = props

  const schemaModalOption = useMemo(() => _getModalOption(schemaType), [schemaType])
  const modalType = schemaModalOption?.type || defaultType

  const modalTitle = <>Edit {schemaType.title}</>

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const modalWidth = schemaModalOption?.width

  if (modalType === 'popover') {
    return (
      <PopoverEditDialog
        autofocus={autofocus}
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
