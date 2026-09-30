import {type DocumentActionConfirmDialogProps, useTranslation} from 'sanity'

import {ConfirmPopover} from '../../../../../ui-components/confirmPopover/ConfirmPopover'
import {structureLocaleNamespace} from '../../../../i18n'
import {
  getMirroredFallbackPlacements,
  getMirroredPlacement,
  useDocumentActionsPlacement,
} from '../documentActionsPlacement'

export function ConfirmDialog(props: {
  dialog: DocumentActionConfirmDialogProps
  referenceElement: HTMLElement | null
}) {
  const {dialog, referenceElement} = props
  const {t} = useTranslation(structureLocaleNamespace)
  const barPlacement = useDocumentActionsPlacement()

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
      placement={getMirroredPlacement(barPlacement)}
      fallbackPlacements={getMirroredFallbackPlacements(barPlacement)}
    />
  )
}
