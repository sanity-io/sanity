import {CalendarIcon} from '@sanity/icons'
import {isValidationErrorMarker} from '@sanity/types'
import {useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionProps,
} from '../../../config/document/actions'
import {useFeatureEnabled, useValidationStatus} from '../../../hooks'
import {FEATURES} from '../../../hooks/useFeatureEnabled'
import {useTranslation} from '../../../i18n'
import {usePerspective} from '../../../perspective/usePerspective'
import {useDocumentPreviewValues} from '../../../tasks/hooks/useDocumentPreviewValues'
import {ScheduleDraftDialog} from '../../components/dialog/ScheduleDraftDialog'
import {useHasCardinalityOneReleaseVersions} from '../../hooks/useHasCardinalityOneReleaseVersions'
import {useReleasesToolAvailable} from '../../hooks/useReleasesToolAvailable'
import {useScheduledDraftsEnabled} from '../../hooks/useScheduledDraftsEnabled'
import {useScheduleDraftOperations} from '../../hooks/useScheduleDraftOperations'
import {releasesLocaleNamespace} from '../../i18n'

/**
 * @internal
 */
export const SchedulePublishAction: DocumentActionComponent = (
  props: DocumentActionProps,
): DocumentActionDescription | null => {
  const {id, type, draft} = props
  const scheduledDraftsEnabled = useScheduledDraftsEnabled()
  const {t} = useTranslation(releasesLocaleNamespace)
  const {createScheduledDraft} = useScheduleDraftOperations()
  const toast = useToast()
  const {perspectiveStack} = usePerspective()
  const releasesToolAvailable = useReleasesToolAvailable()
  const {enabled: releasesEnabled} = useFeatureEnabled(FEATURES.contentReleases)

  // Get document preview values to extract the title
  const {value: previewValues} = useDocumentPreviewValues({
    documentId: id,
    documentType: type,
    perspectiveStack,
  })

  // Check validation status
  const validationStatus = useValidationStatus(id, type)
  const hasValidationErrors = validationStatus.validation.some(isValidationErrorMarker)

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

  // scheduled publishing using scheduled drafts is not available if releases is not enabled
  // releases may either be disabled in `sanity.config` as `releases.enabled: false`
  // or might not be available on the project plan
  if (!releasesToolAvailable || !releasesEnabled) {
    return null
  }

  // Return null if scheduled drafts are disabled or if there's no draft
  if (!scheduledDraftsEnabled || !draft) {
    return null
  }

  const disabled = hasCardinalityOneReleaseVersions || hasValidationErrors
  const title = hasCardinalityOneReleaseVersions
    ? t('action.schedule-publish.disabled.cardinality-one')
    : hasValidationErrors
      ? t('action.schedule-publish.disabled.validation-issues')
      : t('action.schedule-publish')

  return {
    icon: CalendarIcon,
    disabled,
    label: t('action.schedule-publish'),
    title,
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
