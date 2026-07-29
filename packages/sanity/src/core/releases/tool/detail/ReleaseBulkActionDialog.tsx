import {Box, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {useClient} from '../../../hooks/useClient'
import {useSchema} from '../../../hooks/useSchema'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useGrantsStore} from '../../../store/datastores'
import {useCurrentUser} from '../../../store/user/hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {useVersionOperations} from '../../hooks/useVersionOperations'
import {releasesLocaleNamespace} from '../../i18n'
import {
  filterDocumentsForBulkAction,
  type ReleaseBulkAction,
  useReleaseBulkActionTargets,
} from './releaseBulkDocumentPermissions'
import {type DocumentInRelease} from './types'

export type {ReleaseBulkAction} from './releaseBulkDocumentPermissions'

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
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const schema = useSchema()
  const grantsStore = useGrantsStore()
  const currentUser = useCurrentUser()
  const {discardVersion, unpublishVersion} = useVersionOperations()
  const [isProcessing, setIsProcessing] = useState(false)
  const {targets: actionTargets, isLoading: isTargetsLoading} = useReleaseBulkActionTargets(
    documents,
    action,
  )
  const count = actionTargets.length

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

    const targets = await filterDocumentsForBulkAction(documents, action, {
      client,
      schema,
      grantsStore,
      userId: currentUser?.id,
    })

    const skipped = documents.length - targets.length

    if (targets.length === 0) {
      toast.push({
        closable: true,
        status: 'error',
        title:
          action === 'discard'
            ? t('dashboard.details.bulk.discard-toast.no-permission')
            : t('dashboard.details.bulk.unpublish-toast.no-permission'),
      })
      setIsProcessing(false)
      onClose()
      return
    }

    if (skipped > 0) {
      toast.push({
        closable: true,
        status: 'warning',
        title: t('dashboard.details.bulk.toast.documents-skipped', {count: skipped}),
      })
    }

    const results = await Promise.allSettled(
      targets.map((doc) =>
        action === 'discard'
          ? discardVersion(releaseId, doc.document._id)
          : unpublishVersion(doc.document._id),
      ),
    )

    const failed = results.filter((result) => result.status === 'rejected').length
    const succeeded = targets.length - failed

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
    client,
    currentUser?.id,
    discardVersion,
    documents,
    grantsStore,
    onClose,
    onSuccess,
    releaseId,
    schema,
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
          disabled: isProcessing || isTargetsLoading || count === 0,
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
