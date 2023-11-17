import React, {useCallback, useMemo} from 'react'
import type {ObjectSchemaType} from '@sanity/types'
import {useTranslation} from '../../../../../i18n'
import {_getModalOption} from '../helpers'
import {DefaultEditDialog} from './DialogModal'
import {PopoverEditDialog} from './PopoverModal'

export function ObjectEditModal(props: {
  autoFocus?: boolean
  children: React.ReactNode
  defaultType: 'dialog' | 'popover'
  floatingBoundary: HTMLElement | null
  onClose: () => void
  referenceBoundary: HTMLElement | null
  referenceElement: HTMLElement | null
  schemaType: ObjectSchemaType & {i18nTitle?: string}
}) {
  const {
    autoFocus,
    defaultType,
    floatingBoundary,
    onClose,
    referenceBoundary,
    referenceElement,
    schemaType,
  } = props

  const {t} = useTranslation()
  const schemaModalOption = useMemo(() => _getModalOption(schemaType), [schemaType])
  const modalType = schemaModalOption?.type || defaultType

  const schemaTypeTitle = schemaType.i18nTitleKey
    ? t(schemaType.i18nTitleKey)
    : schemaType.title || schemaType.name

  const modalTitle = t('inputs.portable-text.annotation-editor.title', {
    schemaType: schemaTypeTitle,
  })

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const modalWidth = schemaModalOption?.width

  if (modalType === 'popover') {
    return (
      <PopoverEditDialog
        autoFocus={autoFocus}
        floatingBoundary={floatingBoundary}
        onClose={handleClose}
        referenceBoundary={referenceBoundary}
        referenceElement={referenceElement}
        title={<>{modalTitle}</>}
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
      autoFocus={autoFocus}
    >
      {props.children}
    </DefaultEditDialog>
  )
}
