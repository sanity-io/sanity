import {CalendarIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionProps,
} from '../../../config/document/actions'
import {useTranslation} from '../../../i18n'
import {usePerspective} from '../../../perspective/usePerspective'
import {useDocumentPreviewValues} from '../../../tasks/hooks/useDocumentPreviewValues'
import {ScheduleDraftDialog} from '../../components/dialog/ScheduleDraftDialog'
import {useHasCardinalityOneReleaseVersions} from '../../hooks/useHasCardinalityOneReleaseVersions'
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
  const {createScheduledDraft} = useScheduleDraftOperations()
  const toast = useToast()
  const {perspectiveStack} = usePerspective()

  // Get document preview values to extract the title
  const {value: previewValues} = useDocumentPreviewValues({
    documentId: id,
    documentType: type,
    perspectiveStack,
  })

  // Check if document has versions in cardinality one releases
  const hasCardinalityOneReleaseVersions = useHasCardinalityOneReleaseVersions(id)

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
        await createScheduledDraft(id, publishAt, documentTitle)

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
    [id, createScheduledDraft, previewValues?.title, toast, t],
  )

  if (!draft) {
    return null
  }

  return {
    icon: CalendarIcon,
    disabled: hasCardinalityOneReleaseVersions,
    label: t('action.schedule-publish'),
    title: t('action.schedule-publish'),
    onHandle: handleOpenDialog,
    dialog: dialogOpen && {
      type: 'custom',
      component: (
        <ScheduleDraftDialog
          onClose={handleCloseDialog}
          onSchedule={handleSchedule}
          variant="schedule"
          loading={isScheduling}
        />
      ),
    },
  }
}

SchedulePublishAction.action = 'schedule'
SchedulePublishAction.displayName = 'SchedulePublishAction'
