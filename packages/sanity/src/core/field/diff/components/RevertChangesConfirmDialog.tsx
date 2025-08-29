import {type DocumentActionConfirmDialogProps} from 'sanity'

import {ConfirmDialog} from '../../../../structure/panes/document/statusBar/dialogs/ConfirmDialog'
import {useTranslation} from '../../../i18n'

interface RevertChangesConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  changeCount: number
  referenceElement: HTMLElement | null
}

export function RevertChangesConfirmDialog({
  open,
  onConfirm,
  onCancel,
  changeCount,
  referenceElement,
}: RevertChangesConfirmDialogProps) {
  const {t} = useTranslation()

  if (!open) return null

  const dialog: DocumentActionConfirmDialogProps = {
    type: 'confirm',
    tone: 'critical',
    message:
      changeCount > 1
        ? t('changes.action.revert-all-description', {count: changeCount})
        : t('changes.action.revert-changes-description', {count: changeCount}),
    confirmButtonText:
      changeCount > 1
        ? t('changes.action.revert-all-confirm')
        : t('changes.action.revert-changes-confirm-change', {count: 1}),
    cancelButtonText: t('changes.action.revert-all-cancel'),
    onConfirm,
    onCancel,
  }

  return <ConfirmDialog dialog={dialog} referenceElement={referenceElement} />
}
