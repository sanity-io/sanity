import {type ReleaseDocument} from '@sanity/client'
import {CalendarIcon, EditIcon, PublishIcon, TrashIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {type ComponentProps, useCallback, useMemo, useState} from 'react'

import {type MenuItem} from '../../../ui-components/menuItem'
import {Translate, useTranslation} from '../../i18n'
import {getErrorMessage} from '../../util'
import {DeleteScheduledDraftDialog} from '../components/DeleteScheduledDraftDialog'
import {PublishScheduledDraftDialog} from '../components/PublishScheduledDraftDialog'
import {ScheduleDraftDialog} from '../components/ScheduleDraftDialog'
import {useScheduledDraftDocument} from './useScheduledDraftDocument'
import {useScheduleDraftOperations} from './useScheduleDraftOperations'

export type ScheduledDraftAction =
  | 'publish-now'
  | 'edit-schedule'
  | 'delete-schedule'
  | 'schedule-publish'

export interface UseScheduledDraftMenuActionsOptions {
  release: ReleaseDocument | undefined
  documentType?: string
  documentId?: string
  disabled?: boolean
  onActionComplete?: () => void
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
    'publishNow' | 'editSchedule' | 'deleteSchedule' | 'schedulePublish',
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
  const {release, documentType, documentId, disabled = false, onActionComplete} = options

  const {t} = useTranslation()
  const toast = useToast()
  const operations = useScheduleDraftOperations()
  const [selectedAction, setSelectedAction] = useState<ScheduledDraftAction | null>(null)
  const [isPerformingOperation, setIsPerformingOperation] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)

  // Safely handle undefined release by passing undefined to the hook
  const {firstDocumentPreview, loading: documentLoading} = useScheduledDraftDocument(release?._id, {
    includePreview: true,
  })

  const handleEditSchedule = useCallback(async () => {
    if (!release) return

    setIsPerformingOperation(true)
    // Workaround for React Compiler not yet fully supporting try/catch/finally syntax
    const run = async () => {
      await operations.pauseScheduledDraft(release)
      onActionComplete?.()
    }
    try {
      await run()
    } catch (error) {
      console.error('Failed to pause scheduled draft:', error)
      toast.push({
        closable: true,
        status: 'error',
        description: (
          <Translate
            t={t}
            i18nKey="release.toast.pause-scheduled-draft.error"
            values={{
              title: firstDocumentPreview?.title || t('preview.default.title-fallback'),
              error: getErrorMessage(error),
            }}
          />
        ),
      })
    }
    setIsPerformingOperation(false)
    setSelectedAction(null)
  }, [release, operations, onActionComplete, toast, t, firstDocumentPreview?.title])

  const handleMenuItemClick = useCallback((action: ScheduledDraftAction) => {
    setSelectedAction(action)
  }, [])

  const handleDialogClose = useCallback(() => {
    if (!isPerformingOperation) {
      setSelectedAction(null)
    }
  }, [isPerformingOperation])

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
    const baseDisabled = disabled || isPerformingOperation || documentLoading

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
        'icon': EditIcon,
        'text': t('release.action.edit-schedule'),
        'tone': 'default' as const,
        'onClick': handleEditSchedule,
        'disabled': baseDisabled,
        'data-testid': 'edit-schedule-menu-item',
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
  }, [t, handleMenuItemClick, handleEditSchedule, disabled, isPerformingOperation, documentLoading])

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
          />
        )

      case 'schedule-publish':
        return (
          <ScheduleDraftDialog
            onClose={handleDialogClose}
            onSchedule={handleSchedulePublish}
            variant="schedule"
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
  ])

  return {
    actions,
    dialogs,
    isPerformingOperation,
    selectedAction,
    handleDialogClose,
  }
}
