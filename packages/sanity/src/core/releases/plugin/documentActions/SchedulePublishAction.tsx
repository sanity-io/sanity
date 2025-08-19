import {CalendarIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionProps,
} from '../../../config/document/actions'
import {useTranslation} from '../../../i18n'
import {useDocumentPreviewValues} from '../../../tasks/hooks/useDocumentPreviewValues'
import {ScheduleDraftDialog} from '../../components/dialog/ScheduleDraftDialog'
import {useScheduleDraftOperations} from '../../hooks/useScheduleDraftOperations'
import {releasesLocaleNamespace} from '../../i18n'

/**
 * @internal
 */
export const SchedulePublishAction: DocumentActionComponent = (
  props: DocumentActionProps,
): DocumentActionDescription | null => {
  const {id, type, draft} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const {schedulePublish} = useScheduleDraftOperations()
  const toast = useToast()

  // Get document preview values to extract the title
  const {value: previewValues} = useDocumentPreviewValues({
    documentId: id,
    documentType: type,
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)

  const handleOpenDialog = useCallback(() => {
    setDialogOpen(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false)
  }, [])

  const handleSchedule = useCallback(
    async (publishAt: Date) => {
      setIsScheduling(true)

      try {
        // Pass the document title from preview values
        const documentTitle = previewValues?.title || undefined
        await schedulePublish(id, publishAt, documentTitle)

        toast.push({
          closable: true,
          status: 'success',
          title: t('action.schedule-publish-success', 'Document scheduled for publishing'),
          description: t(
            'action.schedule-publish-success-description',
            `Publishing scheduled for ${publishAt.toLocaleString()}`,
          ),
        })

        setDialogOpen(false)
      } catch (error) {
        console.error('Failed to schedule document publish:', error)

        toast.push({
          closable: true,
          status: 'error',
          title: t('action.schedule-publish-error', 'Failed to schedule publishing'),
          description: error instanceof Error ? error.message : 'An unknown error occurred',
        })
      } finally {
        setIsScheduling(false)
      }
    },
    [id, schedulePublish, previewValues?.title, toast, t],
  )

  return {
    disabled: !!draft,
    icon: CalendarIcon,
    label: t('action.schedule-publish'),
    title: t('action.schedule-publish'),
    onHandle: handleOpenDialog,
    dialog: dialogOpen && {
      type: 'custom',
      component: (
        <ScheduleDraftDialog
          onClose={handleCloseDialog}
          onSchedule={handleSchedule}
          header={t('schedule-publish-dialog.header')}
          description={t('schedule-publish-dialog.description')}
          confirmButtonText={t('schedule-publish-dialog.confirm')}
          confirmButtonTone="primary"
          loading={isScheduling}
        />
      ),
    },
  }
}

SchedulePublishAction.action = 'schedule'
SchedulePublishAction.displayName = 'SchedulePublishAction'
