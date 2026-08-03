import {Text} from '@sanity/ui'
import {memo, useCallback, useTransition} from 'react'

import {Dialog} from '../../../../../ui-components/dialog/Dialog'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {type CopyToDraftsOptions} from '../../../hooks/useCopyToDrafts'
import {releasesLocaleNamespace} from '../../../i18n'

interface CopyToDraftsDialogProps {
  onClose: () => void
  onConfirm: (options: CopyToDraftsOptions) => Promise<void>
}

export const CopyToDraftsDialog = memo(function CopyToDraftsDialog(props: CopyToDraftsDialogProps) {
  const {onClose, onConfirm} = props
  const {t: tReleases} = useTranslation(releasesLocaleNamespace)

  const [isProcessing, startTransition] = useTransition()

  const handleConfirm = useCallback(
    () =>
      startTransition(async () => {
        await onConfirm({shouldConfirmDraftDiscard: false})
        onClose()
      }),
    [onConfirm, onClose, startTransition],
  )

  return (
    <Dialog
      id="copy-to-drafts-dialog"
      header={tReleases('copy-to-draft-dialog.title')}
      onClose={onClose}
      footer={{
        confirmButton: {
          text: tReleases('copy-to-draft-dialog.confirm-button'),
          onClick: handleConfirm,
          loading: isProcessing,
          disabled: isProcessing,
        },
        cancelButton: {
          onClick: onClose,
          disabled: isProcessing,
        },
      }}
    >
      <Text size={1}>{tReleases('copy-to-draft-dialog.description')}</Text>
    </Dialog>
  )
})
