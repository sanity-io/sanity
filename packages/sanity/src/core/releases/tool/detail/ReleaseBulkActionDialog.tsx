import {Box, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Dialog} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {useVersionOperations} from '../../hooks/useVersionOperations'
import {releasesLocaleNamespace} from '../../i18n'
import {type DocumentInRelease} from './types'

export type ReleaseBulkAction = 'discard' | 'unpublish'

/**
 * Confirmation dialog for a bulk action (Discard versions / Unpublish) over the selected release
 * documents. The per-row menu acts on one document via its own dialog; this applies the same
 * underlying version operation to each selected document, reporting partial failures.
 *
 * @internal
 */
export function ReleaseBulkActionDialog({
  action,
  documents,
  releaseId,
  onClose,
  onSuccess,
}: {
  action: ReleaseBulkAction
  documents: DocumentInRelease[]
  releaseId: string
  onClose: () => void
  onSuccess: () => void
}): React.JSX.Element {
  const {t} = useTranslation(releasesLocaleNamespace)
  const toast = useToast()
  const {discardVersion, unpublishVersion} = useVersionOperations()
  const [isProcessing, setIsProcessing] = useState(false)
  const count = documents.length

  const copy =
    action === 'discard'
      ? {
          header: t('dashboard.details.bulk.discard-dialog.header'),
          confirm: t('dashboard.details.bulk.discard-dialog.confirm'),
          description: t('dashboard.details.bulk.discard-dialog.description', {count}),
          tone: 'critical' as const,
        }
      : {
          header: t('dashboard.details.bulk.unpublish-dialog.header'),
          confirm: t('dashboard.details.bulk.unpublish-dialog.confirm'),
          description: t('dashboard.details.bulk.unpublish-dialog.description', {count}),
          tone: 'caution' as const,
        }

  const handleConfirm = useCallback(async () => {
    setIsProcessing(true)

    const results = await Promise.allSettled(
      documents.map((doc) =>
        action === 'discard'
          ? discardVersion(releaseId, doc.document._id)
          : unpublishVersion(doc.document._id),
      ),
    )

    const failed = results.filter((result) => result.status === 'rejected').length
    const succeeded = count - failed

    if (succeeded > 0) {
      toast.push({
        closable: true,
        status: 'success',
        title:
          action === 'discard'
            ? t('dashboard.details.bulk.discard-toast.success', {count: succeeded})
            : t('dashboard.details.bulk.unpublish-toast.success', {count: succeeded}),
      })
    }
    if (failed > 0) {
      toast.push({
        closable: true,
        status: 'error',
        title:
          action === 'discard'
            ? t('dashboard.details.bulk.discard-toast.error')
            : t('dashboard.details.bulk.unpublish-toast.error'),
      })
    }

    setIsProcessing(false)
    onSuccess()
    onClose()
  }, [
    action,
    count,
    discardVersion,
    documents,
    onClose,
    onSuccess,
    releaseId,
    t,
    toast,
    unpublishVersion,
  ])

  return (
    <Dialog
      data-testid={`release-bulk-${action}-dialog`}
      footer={{
        cancelButton: {disabled: isProcessing},
        confirmButton: {
          text: copy.confirm,
          tone: copy.tone,
          onClick: handleConfirm,
          loading: isProcessing,
          disabled: isProcessing,
        },
      }}
      header={copy.header}
      id={`release-bulk-${action}-dialog`}
      onClose={() => !isProcessing && onClose()}
      width={1}
    >
      <Box padding={4}>
        <Text muted size={1}>
          {copy.description}
        </Text>
      </Box>
    </Dialog>
  )
}
