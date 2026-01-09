import {CalendarIcon} from '@sanity/icons'
import {isValidationErrorMarker} from '@sanity/types'
import {useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionProps,
} from '../../../config/document/actions'
import {useValidationStatus} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {usePerspective} from '../../../perspective/usePerspective'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {getDraftId} from '../../../util/draftUtils'
import {isPausedCardinalityOneRelease} from '../../../util/releaseUtils'
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
  const {createScheduledDraft, rescheduleScheduledDraft} = useScheduleDraftOperations()
  const toast = useToast()
  const {enabled: singleDocReleaseEnabled, mode} = useSingleDocReleaseEnabled()
  const {handleOpenDialog: handleOpenUpsellDialog} = useSingleDocReleaseUpsell()
  // Check validation status
  const validationStatus = useValidationStatus(getDraftId(id), type, true)
  const hasValidationErrors = validationStatus.validation.some(isValidationErrorMarker)

  // Check if document has versions in cardinality one releases
  const hasCardinalityOneReleaseVersions = useHasCardinalityOneReleaseVersions(id)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const {onSetScheduledDraftPerspective} = useSingleDocRelease()

  // Check if current release is a paused scheduled draft
  const {data: releases = []} = useActiveReleases()
  const perspective = usePerspective()

  const currentRelease = useMemo(
    () =>
      releases.find(
        (r) => getReleaseIdFromReleaseDocumentId(r._id) === perspective.selectedReleaseId,
      ),
    [releases, perspective.selectedReleaseId],
  )

  const isPaused = isPausedCardinalityOneRelease(currentRelease)
  const initialDate =
    isPaused && currentRelease?.metadata.intendedPublishAt
      ? new Date(currentRelease.metadata.intendedPublishAt)
      : undefined
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
      // Workaround for React Compiler not yet fully supporting try/catch/finally syntax
      const run = async () => {
        if (isPaused && currentRelease) {
          // Resume paused draft: reschedule with new date
          await rescheduleScheduledDraft(currentRelease, publishAt)
        } else {
          // Normal flow: create new scheduled draft
          const releaseDocumentId = await createScheduledDraft(id, publishAt)
          onSetScheduledDraftPerspective(getReleaseIdFromReleaseDocumentId(releaseDocumentId))
        }

        setDialogOpen(false)
      }
      try {
        await run()
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
    [
      id,
      createScheduledDraft,
      toast,
      t,
      onSetScheduledDraftPerspective,
      isPaused,
      currentRelease,
      rescheduleScheduledDraft,
    ],
  )

  const disabled = isPaused
    ? hasValidationErrors // Only check validation errors for paused drafts
    : hasCardinalityOneReleaseVersions || hasValidationErrors // Full check for regular drafts

  const title = useMemo(() => {
    if (isPaused && hasValidationErrors) {
      return t('action.schedule-publish.disabled.validation-issues')
    }

    if (hasCardinalityOneReleaseVersions) {
      return t('action.schedule-publish.disabled.cardinality-one')
    }

    if (hasValidationErrors) {
      return t('action.schedule-publish.disabled.validation-issues')
    }

    return t('action.schedule-publish')
  }, [isPaused, hasValidationErrors, hasCardinalityOneReleaseVersions, t])

  if (!singleDocReleaseEnabled) {
    return null
  }

  // Show for drafts OR paused scheduled drafts
  if (!draft && !isPaused) {
    return null
  }

  return {
    icon: CalendarIcon,
    disabled,
    label: t('action.schedule-publish'),
    title,
    tone: isPaused ? 'primary' : undefined, // Add primary tone when paused
    onHandle: handleOpenDialog,
    dialog: dialogOpen && {
      type: 'custom',
      component: (
        <ScheduleDraftDialog
          onClose={handleCloseDialog}
          onSchedule={handleSchedule}
          variant="schedule"
          loading={isScheduling}
          initialDate={initialDate}
        />
      ),
    },
  }
}

useSchedulePublishAction.action = 'schedule'
useSchedulePublishAction.displayName = 'SchedulePublishAction'
