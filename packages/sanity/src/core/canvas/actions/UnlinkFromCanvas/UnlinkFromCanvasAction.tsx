import {UnlinkIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {
  type DocumentActionComponent,
  type DocumentActionProps,
} from '../../../config/document/actions'
import {useClient} from '../../../hooks/useClient'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {getDraftId, getPublishedId} from '../../../util/draftUtils'
import {canvasLocaleNamespace} from '../../i18n'
import {useCanvasTelemetry} from '../../useCanvasTelemetry'
import {useCanvasCompanionDoc} from '../useCanvasCompanionDoc'
import {UnlinkFromCanvasDialog} from './UnlinkFromCanvasDialog'

export const UnlinkFromCanvasAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const {t} = useTranslation(canvasLocaleNamespace)
  const {isLinked, companionDoc, loading} = useCanvasCompanionDoc(
    props.liveEditSchemaType ? getPublishedId(props.id) : getDraftId(props.id),
  )
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {unlinkCtaClicked, unlinkApproved} = useCanvasTelemetry()
  const toast = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [status, setStatus] = useState<'loading' | 'error' | 'success' | 'idle'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleCloseDialog = useCallback(() => setIsDialogOpen(false), [])
  const handleOpenDialog = useCallback(() => {
    unlinkCtaClicked()
    setIsDialogOpen(true)
  }, [unlinkCtaClicked])

  const handleUnlink = useCallback(async () => {
    try {
      if (!companionDoc?._id) {
        throw new Error('Companion doc not found')
      }
      setStatus('loading')
      unlinkApproved()
      await client.delete(companionDoc?._id)
      setStatus('idle')
      handleCloseDialog()
      toast.push({
        status: 'success',
        title: t('dialog.unlink-from-canvas.success'),
      })
    } catch (e) {
      console.error(e)
      setError(e.message)
      setStatus('error')
    }
  }, [client, companionDoc?._id, handleCloseDialog, unlinkApproved, toast, t])

  const document = props.version || props.draft || props.published
  if (!document || !isLinked || loading) {
    return null
  }
  return {
    icon: UnlinkIcon,
    dialog: isDialogOpen
      ? {
          type: 'custom',
          component: (
            <UnlinkFromCanvasDialog
              onClose={handleCloseDialog}
              document={document}
              status={status}
              error={error}
              handleUnlink={handleUnlink}
            />
          ),
        }
      : undefined,
    label: t('action.unlink-document'),
    onHandle: handleOpenDialog,
  }
}

UnlinkFromCanvasAction.action = 'unlinkFromCanvas'
UnlinkFromCanvasAction.displayName = 'UnlinkFromCanvasAction'
