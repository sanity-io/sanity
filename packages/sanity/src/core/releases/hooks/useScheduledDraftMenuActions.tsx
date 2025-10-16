import {type ReleaseDocument} from '@sanity/client'
import {CalendarIcon, PublishIcon, TrashIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {type ComponentProps, useCallback, useMemo, useState} from 'react'

import {type MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {Translate} from '../../i18n/Translate'
import {getErrorMessage} from '../../util/getErrorMessage'
import {DeleteScheduledDraftDialog} from '../components/dialog/DeleteScheduledDraftDialog'
import {PublishScheduledDraftDialog} from '../components/dialog/PublishScheduledDraftDialog'
import {ScheduleDraftDialog} from '../components/dialog/ScheduleDraftDialog'
import {useScheduledDraftDocument} from './useScheduledDraftDocument'
import {useScheduleDraftOperations} from './useScheduleDraftOperations'

type ScheduledDraftAction = 'publish-now' | 'edit-schedule' | 'delete-schedule'

export interface UseScheduledDraftMenuActionsOptions {
  release: ReleaseDocument | undefined
  documentType?: string
  disabled?: boolean
  onActionComplete?: () => void
  onEditSchedule?: () => void
}

interface ScheduledDraftActionProps {
  icon: ComponentProps<typeof MenuItem>['icon']
  text: Exclude<ComponentProps<typeof MenuItem>['text'], undefined>
  tone: ComponentProps<typeof MenuItem>['tone']
  onClick: () => void
  disabled: ComponentProps<typeof MenuItem>['disabled']
}

export interface UseScheduledDraftMenuActionsReturn {
  actions: Record<'publishNow' | 'editSchedule' | 'deleteSchedule', ScheduledDraftActionProps>
  dialogs: React.ReactNode
  isPerformingOperation: boolean
}

/**
 * Hook that provides reusable scheduled draft menu action props that can be used to create MenuItem components.
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

  const {firstDocumentPreview} = useScheduledDraftDocument(release?._id, {
    includePreview: true,
  })

  const handleReschedule = useCallback(
    async (newPublishAt: Date) => {
      if (!release?._id) return

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
                title: firstDocumentPreview?.title || t('preview.default.title-fallback'),
                error: getErrorMessage(error),
              }}
            />
          ),
        })
      } finally {
        setIsPerformingOperation(false)
        setSelectedAction(null)
      }
    },
    [release?._id, operations, onActionComplete, toast, t, firstDocumentPreview?.title],
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

  const actions = useMemo(() => {
    const baseDisabled = disabled || isPerformingOperation

    return {
      publishNow: {
        'icon': PublishIcon,
        'text': t('release.action.publish-now'),
        'tone': 'default' as const,
        'onClick': () => handleMenuItemClick('publish-now'),
        'disabled': baseDisabled,
        'data-testid': 'publish-now-menu-item',
      },
      editSchedule: {
        'icon': CalendarIcon,
        'text': t('release.action.edit-schedule'),
        'tone': 'default' as const,
        'onClick': onEditSchedule || (() => handleMenuItemClick('edit-schedule')),
        'disabled': baseDisabled,
        'data-testid': 'edit-schedule-menu-item',
      },
      deleteSchedule: {
        'icon': TrashIcon,
        'text': t('release.action.delete-schedule'),
        'tone': 'critical' as const,
        'onClick': () => handleMenuItemClick('delete-schedule'),
        'disabled': baseDisabled,
        'data-testid': 'delete-schedule-menu-item',
      },
    }
  }, [t, handleMenuItemClick, disabled, isPerformingOperation, onEditSchedule])

  const dialogs = useMemo(() => {
    if (!selectedAction || !release) return null

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
    actions,
    dialogs,
    isPerformingOperation,
  }
}
