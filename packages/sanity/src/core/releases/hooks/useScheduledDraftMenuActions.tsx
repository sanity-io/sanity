import {type ReleaseDocument} from '@sanity/client'
import {CalendarIcon, PublishIcon, TrashIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {type PropsWithChildren, useCallback, useMemo, useState} from 'react'

import {MenuItem} from '../../../ui-components'
import {Translate, useTranslation} from '../../i18n'
import {DeleteScheduledDraftDialog} from '../components/dialog/DeleteScheduledDraftDialog'
import {PublishScheduledDraftDialog} from '../components/dialog/PublishScheduledDraftDialog'
import {ScheduleDraftDialog} from '../components/dialog/ScheduleDraftDialog'
import {useScheduleDraftOperations} from './useScheduleDraftOperations'

const Strong = ({children}: PropsWithChildren) => <strong>{children}</strong>

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
  const toast = useToast()
  const operations = useScheduleDraftOperations()
  const [selectedAction, setSelectedAction] = useState<ScheduledDraftAction | null>(null)
  const [isPerformingOperation, setIsPerformingOperation] = useState(false)

  const scheduledDraftTitle = release.metadata.title || t('release.placeholder-untitled-release')

  const handlePublishNow = useCallback(async () => {
    setIsPerformingOperation(true)
    try {
      await operations.publishScheduledDraft(release)
      toast.push({
        closable: true,
        status: 'success',
        description: (
          <Translate
            t={t}
            i18nKey="release.toast.publish-scheduled-draft.success"
            values={{title: scheduledDraftTitle}}
            components={{Strong}}
          />
        ),
      })
      onActionComplete?.()
    } catch (error) {
      console.error('Failed to run scheduled draft:', error)
      toast.push({
        closable: true,
        status: 'error',
        description: (
          <Translate
            t={t}
            i18nKey="release.toast.publish-scheduled-draft.error"
            values={{
              title: scheduledDraftTitle,
              error: (error as Error).message,
            }}
            components={{Strong}}
          />
        ),
      })
    } finally {
      setIsPerformingOperation(false)
      setSelectedAction(null)
    }
  }, [release, operations, toast, t, scheduledDraftTitle, onActionComplete])

  const handleReschedule = useCallback(
    async (newPublishAt: Date) => {
      setIsPerformingOperation(true)
      try {
        await operations.rescheduleScheduledDraft(release._id, newPublishAt)
        onActionComplete?.()
      } catch (error) {
        console.error('Failed to reschedule draft:', error)
        toast.push({
          closable: true,
          status: 'error',
          description: (
            <Translate
              t={t}
              i18nKey="release.toast.reschedule-scheduled-draft.error"
              values={{
                title: scheduledDraftTitle,
                error: (error as Error).message,
              }}
              components={{Strong}}
            />
          ),
        })
      } finally {
        setIsPerformingOperation(false)
        setSelectedAction(null)
      }
    },
    [release._id, operations, toast, t, scheduledDraftTitle, onActionComplete],
  )

  const handleMenuItemClick = useCallback(
    (action: ScheduledDraftAction) => setSelectedAction(action),
    [],
  )

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
