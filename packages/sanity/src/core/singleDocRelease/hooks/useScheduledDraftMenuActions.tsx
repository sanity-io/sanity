import {type ReleaseDocument} from '@sanity/client'
import {CalendarIcon} from '@sanity/icons/Calendar'
import {EditIcon} from '@sanity/icons/Edit'
import {PublishIcon} from '@sanity/icons/Publish'
import {TrashIcon} from '@sanity/icons/Trash'
import {useToast} from '@sanity/ui/toast'
import {type ComponentProps, useCallback, useMemo, useState} from 'react'

import {type MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {getErrorMessage} from '../../util/getErrorMessage'
import {DeleteScheduledDraftDialog} from '../components/DeleteScheduledDraftDialog'
import {PublishScheduledDraftDialog} from '../components/PublishScheduledDraftDialog'
import {ScheduleDraftDialog} from '../components/ScheduleDraftDialog'
import {usePauseToEditScheduledDraft} from './usePauseToEditScheduledDraft'
import {useScheduledDraftDocument} from './useScheduledDraftDocument'
import {useScheduleDraftOperations} from './useScheduleDraftOperations'

export type ScheduledDraftAction = 'publish-now' | 'delete-schedule' | 'schedule-publish'

export interface UseScheduledDraftMenuActionsOptions {
  release: ReleaseDocument | undefined
  documentType?: string
  documentId?: string
  disabled?: boolean
  onActionComplete?: () => void
  onDeleteComplete?: () => void
}

interface ScheduledDraftActionProps {
  icon: ComponentProps<typeof MenuItem>['icon']
  text: Exclude<ComponentProps<typeof MenuItem>['text'], undefined>
  tone: ComponentProps<typeof MenuItem>['tone']
  onClick: () => void
  disabled: ComponentProps<typeof MenuItem>['disabled']
}

export interface UseScheduledDraftMenuActionsReturn {
  actions: Record<
    'publishNow' | 'pauseToEdit' | 'deleteSchedule' | 'schedulePublish',
    ScheduledDraftActionProps
  >
  dialogs: React.ReactNode
  isPerformingOperation: boolean
  selectedAction: ScheduledDraftAction | null
  handleDialogClose: () => void
}

/**
 * Hook that provides reusable scheduled draft menu action props that can be used to create MenuItem components.
 *
 * @internal
 */
export function useScheduledDraftMenuActions(
  options: UseScheduledDraftMenuActionsOptions,
): UseScheduledDraftMenuActionsReturn {
  const {
    release,
    documentType,
    documentId,
    disabled = false,
    onActionComplete,
    onDeleteComplete,
  } = options

  const {t} = useTranslation()
  const toast = useToast()
  const operations = useScheduleDraftOperations()
  const [selectedAction, setSelectedAction] = useState<ScheduledDraftAction | null>(null)
  const [isScheduling, setIsScheduling] = useState(false)

  // Safely handle undefined release by passing undefined to the hook
  const {firstDocumentPreview, loading: documentLoading} = useScheduledDraftDocument(release?._id, {
    includePreview: true,
  })
  const {pauseToEdit, isPausing} = usePauseToEditScheduledDraft({
    release,
    documentTitle: firstDocumentPreview?.title,
    onComplete: onActionComplete,
  })

  const handleMenuItemClick = useCallback((action: ScheduledDraftAction) => {
    setSelectedAction(action)
  }, [])

  const handleDialogClose = useCallback(() => {
    if (!isPausing) {
      setSelectedAction(null)
    }
  }, [isPausing])

  const handleSchedulePublish = useCallback(
    async (publishAt: Date) => {
      if (!release) return

      setIsScheduling(true)
      // Workaround for React Compiler not yet fully supporting try/catch/finally syntax
      const run = async () => {
        await operations.rescheduleScheduledDraft(release, publishAt)

        toast.push({
          closable: true,
          status: 'success',
          title: t('release.toast.schedule-publish.success'),
        })
      }
      try {
        await run()
      } catch (error) {
        console.error('Failed to schedule draft:', error)
        toast.push({
          closable: true,
          status: 'error',
          title: t('release.toast.schedule-publish.error', {error: getErrorMessage(error)}),
        })
      }
      setIsScheduling(false)
      handleDialogClose()
    },
    [release, operations, toast, t, handleDialogClose],
  )

  const actions = useMemo(() => {
    const baseDisabled = disabled || isPausing || documentLoading

    return {
      publishNow: {
        'icon': PublishIcon,
        'text': t('release.action.publish-now'),
        'tone': 'default' as const,
        'onClick': () => handleMenuItemClick('publish-now'),
        'disabled': baseDisabled,
        'data-testid': 'publish-now-menu-item',
      },
      pauseToEdit: {
        'icon': EditIcon,
        'text': t('release.action.pause-to-edit'),
        'tone': 'default' as const,
        'onClick': pauseToEdit,
        'disabled': baseDisabled,
        'data-testid': 'pause-to-edit-menu-item',
      },
      schedulePublish: {
        'icon': CalendarIcon,
        'text': t('release.action.schedule-publish'),
        'tone': 'default' as const,
        'onClick': () => handleMenuItemClick('schedule-publish'),
        'disabled': baseDisabled,
        'data-testid': 'schedule-publish-menu-item',
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
  }, [t, handleMenuItemClick, pauseToEdit, disabled, isPausing, documentLoading])

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

      case 'delete-schedule':
        return (
          <DeleteScheduledDraftDialog
            release={release}
            documentType={documentType}
            documentId={documentId}
            onClose={handleDialogClose}
            onDeleteComplete={onDeleteComplete}
          />
        )

      case 'schedule-publish':
        return (
          <ScheduleDraftDialog
            onClose={handleDialogClose}
            onSchedule={handleSchedulePublish}
            loading={isScheduling}
            initialDate={release?.metadata?.intendedPublishAt}
          />
        )

      default:
        return null
    }
  }, [
    selectedAction,
    release,
    documentType,
    documentId,
    handleDialogClose,
    handleSchedulePublish,
    isScheduling,
    onDeleteComplete,
  ])

  return {
    actions,
    dialogs,
    isPerformingOperation: isPausing,
    selectedAction,
    handleDialogClose,
  }
}
