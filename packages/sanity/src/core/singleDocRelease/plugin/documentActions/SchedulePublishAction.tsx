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
import {Translate, useTranslation} from '../../../i18n'
import {useSetPerspective} from '../../../perspective/useSetPerspective'
import {getReleaseIdFromReleaseDocumentId} from '../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {ScheduleDraftDialog} from '../../components/ScheduleDraftDialog'
import {useHasCardinalityOneReleaseVersions} from '../../hooks/useHasCardinalityOneReleaseVersions'
import {useScheduleDraftOperations} from '../../hooks/useScheduleDraftOperations'
import {singleDocReleaseNamespace} from '../../i18n'

/**
 * @internal
 */
export const SchedulePublishAction: DocumentActionComponent = (
  props: DocumentActionProps,
): DocumentActionDescription | null => {
  const {id, type, draft} = props
  const {t} = useTranslation(singleDocReleaseNamespace)
  const {createScheduledDraft} = useScheduleDraftOperations()
  const toast = useToast()
  const setPerspective = useSetPerspective()
  const {enabled: singleDocReleaseEnabled} = useFeatureEnabled(FEATURES.singleDocRelease)

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
        const releaseDocumentId = await createScheduledDraft(id, publishAt)

        toast.push({
          closable: true,
          status: 'success',
          title: t('action.schedule-publish-success'),
          description: (
            <Translate
              t={t}
              i18nKey="action.schedule-publish-success-description"
              values={{publishAt: publishAt.toLocaleString()}}
            />
          ),
        })
        setPerspective(getReleaseIdFromReleaseDocumentId(releaseDocumentId))
        setDialogOpen(false)
      } catch (error) {
        console.error('Failed to schedule document publish:', error)

        toast.push({
          closable: true,
          status: 'error',
          title: t('action.schedule-publish-error'),
          description: error instanceof Error ? error.message : 'An unknown error occurred',
        })
      } finally {
        setIsScheduling(false)
      }
    },
    [id, createScheduledDraft, toast, t, setPerspective],
  )

  if (!draft || !singleDocReleaseEnabled) {
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
