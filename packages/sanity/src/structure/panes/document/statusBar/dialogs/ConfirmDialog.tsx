import {type DocumentActionConfirmDialogProps, useTranslation} from 'sanity'

import {ConfirmPopover} from '../../../../../ui-components'
import {structureLocaleNamespace} from '../../../../i18n'
import {POPOVER_FALLBACK_PLACEMENTS} from './constants'

export function ConfirmDialog(props: {
  dialog: DocumentActionConfirmDialogProps
  referenceElement: HTMLElement | null
}) {
  const {dialog, referenceElement} = props
  const {t} = useTranslation(structureLocaleNamespace)

  const {
    cancelButtonIcon,
    cancelButtonText,
    confirmButtonIcon,
    confirmButtonText,
    message,
    onCancel,
    onConfirm,
    tone,
  } = dialog

  return (
    <ConfirmPopover
      cancelButtonIcon={cancelButtonIcon}
      cancelButtonText={cancelButtonText || t('confirm-dialog.cancel-button.fallback-text')}
      confirmButtonIcon={confirmButtonIcon}
      confirmButtonText={confirmButtonText || t('confirm-dialog.confirm-button.fallback-text')}
      message={message}
      onCancel={onCancel}
      onConfirm={onConfirm}
      open
      referenceElement={referenceElement}
      tone={tone}
      placement="top"
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
    />
  )
}
