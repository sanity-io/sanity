import {CalendarIcon} from '@sanity/icons'
import {isValidationErrorMarker} from '@sanity/types'
import {useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionProps,
} from '../../../config/document/actions'
import {useValidationStatus} from '../../../hooks'
import {Translate, useTranslation} from '../../../i18n'
import {getReleaseIdFromReleaseDocumentId} from '../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {ScheduleDraftDialog} from '../../components/ScheduleDraftDialog'
import {useSingleDocReleaseEnabled} from '../../context/SingleDocReleaseEnabledProvider'
import {useSingleDocReleaseUpsell} from '../../context/SingleDocReleaseUpsellProvider'
import {useHasCardinalityOneReleaseVersions} from '../../hooks/useHasCardinalityOneReleaseVersions'
import {useScheduleDraftOperations} from '../../hooks/useScheduleDraftOperations'
import {singleDocReleaseNamespace} from '../../i18n'
import {usePaneRouter} from 'sanity/structure'

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
  const {enabled: singleDocReleaseEnabled, mode} = useSingleDocReleaseEnabled()
  const {handleOpenDialog: handleOpenUpsellDialog} = useSingleDocReleaseUpsell()
  // Check validation status
  const validationStatus = useValidationStatus(id, type)
  const hasValidationErrors = validationStatus.validation.some(isValidationErrorMarker)

  // Check if document has versions in cardinality one releases
  const hasCardinalityOneReleaseVersions = useHasCardinalityOneReleaseVersions(id)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const {params, setParams} = usePaneRouter()
  const handleOpenDialog = useCallback(() => {
    if (mode === 'upsell') {
      handleOpenUpsellDialog('document_action')
    } else {
      setDialogOpen(true)
    }
  }, [mode, handleOpenUpsellDialog])

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
        setParams(
          {...params, scheduledDraft: getReleaseIdFromReleaseDocumentId(releaseDocumentId)},
          // We need to reset the perspective sticky param when we set the scheduled draft local perspective.
          // this is because the user may be clicking this from another perspective, for example they could be seeing a `release` perspective and then click to see this scheduled draft perspective.
          // the perspective sticky param was set to the release perspective, so we need to remove it.
          // We are changing both the params and the perspective sticky param to ensure that the scheduled draft perspective is set correctly.
          {perspective: ''},
        )
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
    [id, createScheduledDraft, toast, t, params, setParams],
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
