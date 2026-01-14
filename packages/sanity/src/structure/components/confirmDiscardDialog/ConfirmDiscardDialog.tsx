import {Text} from '@sanity/ui'
import {useId} from 'react'
import {useTranslation} from 'sanity'

import {Dialog} from '../../../ui-components'
import {structureLocaleNamespace} from '../../i18n'

interface ConfirmDiscardDialogProps {
  onCancel: () => void
  onConfirm: () => void
  publishedExists: boolean
}

/**
 * A confirmation dialog used to confirm discarding changes.
 * @internal
 */
export function ConfirmDiscardDialog({
  publishedExists,
  onCancel,
  onConfirm,
}: ConfirmDiscardDialogProps) {
  const {t} = useTranslation(structureLocaleNamespace)
  const dialogId = `deletion-confirmation-${useId()}`

  return (
    <Dialog
      width={1}
      id={dialogId}
      header={t('action.discard-changes.confirm-dialog.header.text')}
      footer={{
        confirmButton: {
          text: t('action.discard-changes.label'),
          onClick: onConfirm,
        },
      }}
      onClose={onCancel}
      onClickOutside={onCancel}
    >
      <Text size={1}>
        {publishedExists
          ? t('action.discard-changes.confirm-dialog.confirm-discard-changes')
          : t('action.discard-changes.confirm-dialog.confirm-discard-changes-draft')}
      </Text>
    </Dialog>
  )
}
