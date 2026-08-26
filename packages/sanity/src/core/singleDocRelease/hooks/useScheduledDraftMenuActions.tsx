import {type ReleaseDocument} from '@sanity/client'
import {CalendarIcon} from '@sanity/icons/Calendar'
import {EditIcon} from '@sanity/icons/Edit'
import {PublishIcon} from '@sanity/icons/Publish'
import {TrashIcon} from '@sanity/icons/Trash'
import {useToast} from '@sanity/ui/toast'
import {type ComponentProps, useCallback, useMemo, useState} from 'react'

import {type MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {
  InsufficientPermissionsMessage,
  type InsufficientPermissionsMessageProps,
} from '../../components/InsufficientPermissionsMessage'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {Translate} from '../../i18n/Translate'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {useDocumentPairPermissions} from '../../store/grants/documentPairPermissions'
import {useCurrentUser} from '../../store/user/hooks'
import {getErrorMessage} from '../../util/getErrorMessage'
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
  /** The published / document-group id, not the version id. */
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
  /** Carries the insufficient permissions explanation when the grant is missing. */
  tooltipProps: ComponentProps<typeof MenuItem>['tooltipProps']
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
  const [isPerformingOperation, setIsPerformingOperation] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)

  // Safely handle undefined release by passing undefined to the hook
  const {firstDocumentPreview, loading: documentLoading} = useScheduledDraftDocument(release?._id, {
    includePreview: true,
  })

  const currentUser = useCurrentUser()
  // '*' denies without a document lookup.
  const permissionType = release && documentType && documentId ? documentType : '*'
  const permissionVersion = release ? getReleaseIdFromReleaseDocumentId(release._id) : undefined

  const [publishPermission, publishPermissionLoading] = useDocumentPairPermissions({
    id: documentId ?? '',
    type: permissionType,
    version: permissionVersion,
    permission: 'publish',
  })
  const [discardVersionPermission, discardVersionPermissionLoading] = useDocumentPairPermissions({
    id: documentId ?? '',
    type: permissionType,
    version: permissionVersion,
    permission: 'discardVersion',
  })

  const canPublish = publishPermissionLoading || Boolean(publishPermission?.granted)
  const canDiscardVersion =
    discardVersionPermissionLoading || Boolean(discardVersionPermission?.granted)

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
    const baseDisabled =
      disabled ||
      isPerformingOperation ||
      documentLoading ||
      publishPermissionLoading ||
      discardVersionPermissionLoading

    const insufficientPermissions = (
      context: InsufficientPermissionsMessageProps['context'],
    ): ComponentProps<typeof MenuItem>['tooltipProps'] => ({
      content: <InsufficientPermissionsMessage context={context} currentUser={currentUser} />,
    })

    return {
      publishNow: {
        'icon': PublishIcon,
        'text': t('release.action.publish-now'),
        'tone': 'default' as const,
        'onClick': () => handleMenuItemClick('publish-now'),
        'disabled': baseDisabled || !canPublish,
        'tooltipProps': canPublish ? null : insufficientPermissions('publish-document'),
        'data-testid': 'publish-now-menu-item',
      },
      editSchedule: {
        'icon': EditIcon,
        'text': t('release.action.edit-schedule'),
        'tone': 'default' as const,
        'onClick': handleEditSchedule,
        'disabled': baseDisabled || !canPublish,
        'tooltipProps': canPublish ? null : insufficientPermissions('edit-schedules'),
        'data-testid': 'edit-schedule-menu-item',
      },
      schedulePublish: {
        'icon': CalendarIcon,
        'text': t('release.action.schedule-publish'),
        'tone': 'default' as const,
        'onClick': () => handleMenuItemClick('schedule-publish'),
        'disabled': baseDisabled || !canPublish,
        'tooltipProps': canPublish ? null : insufficientPermissions('edit-schedules'),
        'data-testid': 'schedule-publish-menu-item',
      },
      deleteSchedule: {
        'icon': TrashIcon,
        'text': t('release.action.delete-schedule'),
        'tone': 'critical' as const,
        'onClick': () => handleMenuItemClick('delete-schedule'),
        'disabled': baseDisabled || !canDiscardVersion,
        'tooltipProps': canDiscardVersion ? null : insufficientPermissions('delete-schedules'),
        'data-testid': 'delete-schedule-menu-item',
      },
    }
  }, [
    t,
    handleMenuItemClick,
    handleEditSchedule,
    disabled,
    isPerformingOperation,
    documentLoading,
    publishPermissionLoading,
    discardVersionPermissionLoading,
    canPublish,
    canDiscardVersion,
    currentUser,
  ])

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
    onDeleteComplete,
  ])

  return {
    actions,
    dialogs,
    isPerformingOperation,
    selectedAction,
    handleDialogClose,
  }
}
