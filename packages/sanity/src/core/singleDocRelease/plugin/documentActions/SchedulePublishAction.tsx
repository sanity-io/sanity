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
import {getDraftId} from '../../../util/draftUtils'
import {ScheduleDraftDialog} from '../../components/ScheduleDraftDialog'
import {useSingleDocReleaseEnabled} from '../../context/SingleDocReleaseEnabledProvider'
import {useSingleDocRelease} from '../../context/SingleDocReleaseProvider'
import {useSingleDocReleaseUpsell} from '../../context/SingleDocReleaseUpsellProvider'
import {useHasCardinalityOneReleaseVersions} from '../../hooks/useHasCardinalityOneReleaseVersions'
import {useScheduleDraftOperations} from '../../hooks/useScheduleDraftOperations'
import {singleDocReleaseNamespace} from '../../i18n'

// React Compiler needs functions that are hooks to have the `use` prefix, pascal case are treated as a component, these are hooks even though they're confusingly named `DocumentActionComponent`
/** @internal */
export const useSchedulePublishAction: DocumentActionComponent = (
  props: DocumentActionProps,
): DocumentActionDescription | null => {
  const {id, type, draft} = props
  const {t} = useTranslation(singleDocReleaseNamespace)
  const {createScheduledDraft} = useScheduleDraftOperations()
  const toast = useToast()
  const {enabled: singleDocReleaseEnabled, mode} = useSingleDocReleaseEnabled()
  const {handleOpenDialog: handleOpenUpsellDialog} = useSingleDocReleaseUpsell()
  // Check validation status
  const validationStatus = useValidationStatus(getDraftId(id), type)
  const hasValidationErrors = validationStatus.validation.some(isValidationErrorMarker)

  // Check if document has versions in cardinality one releases
  const hasCardinalityOneReleaseVersions = useHasCardinalityOneReleaseVersions(id)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const {onSetScheduledDraftPerspective} = useSingleDocRelease()
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
        onSetScheduledDraftPerspective(getReleaseIdFromReleaseDocumentId(releaseDocumentId))
        setDialogOpen(false)
      } catch (error) {
        console.error('Failed to schedule document publish:', error)

        toast.push({
          closable: true,
          status: 'error',
          title: t('action.schedule-publish-error'),
          description: error instanceof Error ? error.message : 'An unknown error occurred',
        })
      }
      setIsScheduling(false)
    },
    [id, createScheduledDraft, toast, t, onSetScheduledDraftPerspective],
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

useSchedulePublishAction.action = 'schedule'
useSchedulePublishAction.displayName = 'SchedulePublishAction'
