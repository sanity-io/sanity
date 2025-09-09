import {type ReleaseDocument} from '@sanity/client'
import {CalendarIcon, PublishIcon, TrashIcon} from '@sanity/icons'
import {useCallback, useMemo, useState} from 'react'

import {MenuItem} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {DeleteScheduledDraftDialog} from '../components/dialog/DeleteScheduledDraftDialog'
import {PublishScheduledDraftDialog} from '../components/dialog/PublishScheduledDraftDialog'
import {ScheduleDraftDialog} from '../components/dialog/ScheduleDraftDialog'
import {useScheduleDraftOperationsWithToasts} from './useScheduleDraftOperationsWithToasts'

export type ScheduledDraftAction = 'publish-now' | 'edit-schedule' | 'delete-schedule'

export interface UseScheduledDraftMenuActionsOptions {
  release: ReleaseDocument
  documentType?: string
  disabled?: boolean
  onActionComplete?: () => void
  onEditSchedule?: () => void
}

export interface UseScheduledDraftMenuActionsReturn {
  menuItems: {
    publishNow: React.ReactNode
    editSchedule: React.ReactNode
    deleteSchedule: React.ReactNode
  }
  dialogs: React.ReactNode
  isPerformingOperation: boolean
}

/**
 * Hook that provides reusable scheduled draft menu actions as ready-to-render MenuItem components.
 * Returns menu items as JSX components so consumers can directly render them.
 *
 * @internal
 */
export function useScheduledDraftMenuActions(
  options: UseScheduledDraftMenuActionsOptions,
): UseScheduledDraftMenuActionsReturn {
  const {release, documentType, disabled = false, onActionComplete, onEditSchedule} = options

  const {t} = useTranslation()
  const [selectedAction, setSelectedAction] = useState<ScheduledDraftAction | null>(null)
  const [isPerformingOperation, setIsPerformingOperation] = useState(false)

  const scheduledDraftTitle = release.metadata.title || t('release.placeholder-untitled-release')

  const {publishScheduledDraft, rescheduleScheduledDraft} =
    useScheduleDraftOperationsWithToasts(scheduledDraftTitle)

  const handlePublishNow = useCallback(async () => {
    setIsPerformingOperation(true)
    try {
      await publishScheduledDraft(release)
      onActionComplete?.()
    } catch (error) {
      // Error handled by useScheduleDraftOperationsWithToasts
    } finally {
      setIsPerformingOperation(false)
      setSelectedAction(null)
    }
  }, [release, publishScheduledDraft, onActionComplete])

  const handleReschedule = useCallback(
    async (newPublishAt: Date) => {
      setIsPerformingOperation(true)
      try {
        await rescheduleScheduledDraft(release._id, newPublishAt)
        onActionComplete?.()
      } catch (error) {
        // Error handled by useScheduleDraftOperationsWithToasts
      } finally {
        setIsPerformingOperation(false)
        setSelectedAction(null)
      }
    },
    [release._id, rescheduleScheduledDraft, onActionComplete],
  )

  const handleMenuItemClick = useCallback((action: ScheduledDraftAction) => {
    if (action === 'publish-now') {
      // For publish-now, we can execute immediately or show dialog based on preference
      // Currently showing dialog for consistency
      setSelectedAction(action)
    } else {
      // For edit-schedule and delete-schedule, always show dialog
      setSelectedAction(action)
    }
  }, [])

  const handleDialogClose = useCallback(() => {
    if (!isPerformingOperation) {
      setSelectedAction(null)
    }
  }, [isPerformingOperation])

  const menuItems = useMemo(() => {
    const baseDisabled = disabled || isPerformingOperation

    return {
      publishNow: (
        <MenuItem
          key="publish-now"
          icon={PublishIcon}
          text={t('release.action.publish-now')}
          tone="default"
          onClick={() => handleMenuItemClick('publish-now')}
          disabled={baseDisabled}
          data-testid="publish-now-menu-item"
        />
      ),
      editSchedule: (
        <MenuItem
          key="edit-schedule"
          icon={CalendarIcon}
          text={t('release.action.edit-schedule')}
          tone="default"
          onClick={onEditSchedule || (() => handleMenuItemClick('edit-schedule'))}
          disabled={baseDisabled}
          data-testid="edit-schedule-menu-item"
        />
      ),
      deleteSchedule: (
        <MenuItem
          key="delete-schedule"
          icon={TrashIcon}
          text={t('release.action.delete-schedule')}
          tone="critical"
          onClick={() => handleMenuItemClick('delete-schedule')}
          disabled={baseDisabled}
          data-testid="delete-schedule-menu-item"
        />
      ),
    }
  }, [t, handleMenuItemClick, disabled, isPerformingOperation, onEditSchedule])

  const dialogs = useMemo(() => {
    if (!selectedAction) return null

    switch (selectedAction) {
      case 'publish-now':
        return (
          <PublishScheduledDraftDialog
            release={release}
            documentType={documentType}
            onClose={handleDialogClose}
          />
        )

      case 'edit-schedule':
        return (
          <ScheduleDraftDialog
            onClose={handleDialogClose}
            onSchedule={handleReschedule}
            variant="edit-schedule"
            loading={isPerformingOperation}
            initialDate={release.publishAt}
          />
        )

      case 'delete-schedule':
        return (
          <DeleteScheduledDraftDialog
            release={release}
            documentType={documentType}
            onClose={handleDialogClose}
          />
        )

      default:
        return null
    }
  }, [
    selectedAction,
    release,
    documentType,
    handleDialogClose,
    handleReschedule,
    isPerformingOperation,
  ])

  return {
    menuItems,
    dialogs,
    isPerformingOperation,
  }
}
