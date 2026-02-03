import {Text} from '@sanity/ui'
import {memo, useCallback, useTransition} from 'react'

import {Dialog} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {useCopyToDrafts} from '../../../hooks/useCopyToDrafts'
import {releasesLocaleNamespace} from '../../../i18n'

interface CopyToDraftsDialogProps {
  documentId: string
  fromRelease: string
  onClose: () => void
  onNavigate: () => void
}

export const CopyToDraftsDialog = memo(function CopyToDraftsDialog(props: CopyToDraftsDialogProps) {
  const {documentId, fromRelease, onClose, onNavigate} = props
  const {t: tReleases} = useTranslation(releasesLocaleNamespace)

  const [isProcessing, startTransition] = useTransition()

  const {handleCopyToDrafts} = useCopyToDrafts({documentId, fromRelease, onNavigate})

  const handleConfirm = useCallback(
    () =>
      startTransition(async () => {
        await handleCopyToDrafts()
        onClose()
      }),
    [handleCopyToDrafts, onClose, startTransition],
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
