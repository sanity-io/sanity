import {UnpublishIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionProps,
} from '../../../config/document/actions'
import {useTranslation} from '../../../i18n'
import {ScheduleDraftDialog} from '../../components/dialog/ScheduleDraftDialog'
import {useScheduleDraftOperations} from '../../hooks/useScheduleDraftOperations'
import {releasesLocaleNamespace} from '../../i18n'

/**
 * @internal
 */
export const ScheduleUnpublishAction: DocumentActionComponent = (
  props: DocumentActionProps,
): DocumentActionDescription | null => {
  const {id, published} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const {scheduleUnpublish} = useScheduleDraftOperations()
  const toast = useToast()
  const isPublished = published !== null

  const [dialogOpen, setDialogOpen] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)

  const handleOpenDialog = useCallback(() => {
    setDialogOpen(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false)
  }, [])

  const handleSchedule = useCallback(
    async (unpublishAt: Date) => {
      setIsScheduling(true)

      try {
        await scheduleUnpublish(id, unpublishAt)

        toast.push({
          closable: true,
          status: 'success',
          title: t('action.schedule-unpublish-success', 'Document scheduled for unpublishing'),
          description: t(
            'action.schedule-unpublish-success-description',
            `Unpublishing scheduled for ${unpublishAt.toLocaleString()}`,
          ),
        })

        setDialogOpen(false)
      } catch (error) {
        console.error('Failed to schedule document unpublish:', error)

        toast.push({
          closable: true,
          status: 'error',
          title: t('action.schedule-unpublish-error', 'Failed to schedule unpublishing'),
          description: error instanceof Error ? error.message : 'An unknown error occurred',
        })
      } finally {
        setIsScheduling(false)
      }
    },
    [id, scheduleUnpublish, toast, t],
  )

  return {
    disabled: !isPublished,
    tone: 'critical',
    icon: UnpublishIcon,
    label: t('action.schedule-unpublish'),
    title: isPublished ? undefined : t('action.schedule-unpublish.disabled.not-published'),
    onHandle: isPublished ? handleOpenDialog : undefined,
    dialog: dialogOpen &&
      isPublished && {
        type: 'custom',
        component: (
          <ScheduleDraftDialog
            onClose={handleCloseDialog}
            onSchedule={handleSchedule}
            header={t('schedule-unpublish-dialog.header')}
            description={t('schedule-unpublish-dialog.description')}
            confirmButtonText={t('schedule-unpublish-dialog.confirm')}
            confirmButtonTone="critical"
          />
        ),
      },
  }
}

ScheduleUnpublishAction.action = 'schedule'
ScheduleUnpublishAction.displayName = 'ScheduleUnpublishAction'
