import {CalendarIcon} from '@sanity/icons/Calendar'
import {isValidationErrorMarker} from '@sanity/types'
import {useToast} from '@sanity/ui/toast'
import {useCallback, useMemo, useState} from 'react'

import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionProps,
} from '../../../config/document/actions'
import {getTargetSiblings, useTargetDocumentState} from '../../../hooks/useTargetDocumentState'
import {useValidationStatus} from '../../../hooks/useValidationStatus'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {getDefaultVariant} from '../../../perspective/getDefaultVariant'
import {usePerspective} from '../../../perspective/usePerspective'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {getDraftId} from '../../../util/draftUtils'
import {getDocumentVersionVariantId} from '../../../util/getDocumentVersionVariant'
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
  const perspective = usePerspective()
  const isVariantSelected = Boolean(getDefaultVariant(perspective.selectedVariantNames))
  const targetDocumentState = useTargetDocumentState(id)

  // With a variant selected, the variant's own draft is scheduled instead of the base draft. Its id
  // is opaque, so it is discovered from the resolved siblings rather than derived with `getDraftId`.
  const variantDraft = isVariantSelected ? getTargetSiblings(targetDocumentState)?.draft : undefined
  const variantDraftId = variantDraft?._id
  const variantDraftVariantId = getDocumentVersionVariantId(variantDraft)
  const variantSource = useMemo(
    () =>
      variantDraftId && variantDraftVariantId
        ? {baseId: variantDraftId, variantId: variantDraftVariantId}
        : undefined,
    [variantDraftId, variantDraftVariantId],
  )

  // Check validation status.
  // No `getTargetScopeId(useTargetDocumentState())` here: scheduling a draft publish deliberately validates the
  // explicit draft of the document's lane (the base draft, or the variant draft), independent of the
  // selected perspective. A variant without a draft (resuming a paused scheduled draft) validates the
  // resolved variant target instead.
  const resolvedTargetId =
    targetDocumentState.status === 'ready' ? targetDocumentState.targetDocument?._id : undefined
  const validationTargetId = isVariantSelected
    ? (variantDraftId ?? resolvedTargetId ?? getDraftId(id))
    : getDraftId(id)
  const validationStatus = useValidationStatus(validationTargetId, type, {listener: 'document'})
  const hasValidationErrors = validationStatus.validation.some(isValidationErrorMarker)

  // Check if the document (or the selected variant) has versions in cardinality one releases
  const {hasCardinalityOneReleaseVersions, loading: cardinalityOneReleaseVersionsLoading} =
    useHasCardinalityOneReleaseVersions(id, getDefaultVariant(perspective.selectedVariants)?._id)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const {onSetScheduledDraftPerspective} = useSingleDocRelease()

  // Check if current release is a paused scheduled draft
  const {data: releases = []} = useActiveReleases()

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
          const releaseDocumentId = await createScheduledDraft(
            id,
            publishAt,
            undefined,
            variantSource,
          )
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
      variantSource,
      toast,
      t,
      onSetScheduledDraftPerspective,
      isPaused,
      currentRelease,
      rescheduleScheduledDraft,
    ],
  )

  // While the check loads, an existing scheduled draft is not detected yet, and scheduling would
  // create a second one.
  const disabled = isPaused
    ? hasValidationErrors // Only check validation errors for paused drafts
    : cardinalityOneReleaseVersionsLoading ||
      hasCardinalityOneReleaseVersions ||
      hasValidationErrors // Full check for regular drafts

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

  // Show for drafts OR paused scheduled drafts. `draft` is always the base draft, so with a variant
  // selected the variant's own draft decides.
  const hasDraft = isVariantSelected ? Boolean(variantSource) : Boolean(draft)
  if (!hasDraft && !isPaused) {
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
          loading={isScheduling}
          initialDate={initialDate}
        />
      ),
    },
  }
}

useSchedulePublishAction.action = 'schedule'
useSchedulePublishAction.displayName = 'SchedulePublishAction'
