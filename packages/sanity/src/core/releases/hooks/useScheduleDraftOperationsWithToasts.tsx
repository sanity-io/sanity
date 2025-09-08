import {type ReleaseState} from '@sanity/client'
import {useToast} from '@sanity/ui'
import {type ReactNode, useCallback} from 'react'

import {Translate, useTranslation} from '../../i18n'
import {
  type ScheduleDraftOperationsValue,
  useScheduleDraftOperations,
} from './useScheduleDraftOperations'

/**
 * Hook for scheduled draft operations with built-in toast notifications.
 *
 * Wraps useScheduleDraftOperations and provides the same API but with consistent toast handling:
 * - Run now: Shows error toasts only (no success toast)
 * - Delete schedule: Shows both success and error toasts
 * - Reschedule: Shows error toasts only (no success toast)
 *
 * @param releaseTitle - The title to use in toast messages
 * @internal
 */
export function useScheduleDraftOperationsWithToasts(
  releaseTitle?: string,
): ScheduleDraftOperationsValue {
  const operations = useScheduleDraftOperations()
  const toast = useToast()
  const {t} = useTranslation()

  // Reusable Strong component for all Translate components
  const Strong = useCallback(
    ({children}: {children?: ReactNode}) => <strong>{children}</strong>,
    [],
  )

  const runNowWithToast = useCallback(
    async (
      releaseDocumentId: string,
      opts?: Parameters<ScheduleDraftOperationsValue['publishScheduledDraft']>[1],
    ) => {
      try {
        await operations.publishScheduledDraft(releaseDocumentId, opts)
        toast.push({
          closable: true,
          status: 'success',
          description: (
            <Translate
              t={t}
              i18nKey="release.toast.publish-scheduled-draft.success"
              values={{title: releaseTitle || 'scheduled draft'}}
              components={{Strong}}
            />
          ),
        })
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
                title: releaseTitle || 'scheduled draft',
                error: (error as Error).message,
              }}
              components={{Strong}}
            />
          ),
        })
        throw error // Re-throw for caller to handle UI state
      }
    },
    [operations, toast, t, releaseTitle, Strong],
  )

  const deleteScheduleWithToast = useCallback(
    async (
      releaseDocumentId: string,
      releaseState: ReleaseState,
      opts?: Parameters<ScheduleDraftOperationsValue['deleteScheduledDraft']>[2],
    ) => {
      try {
        await operations.deleteScheduledDraft(releaseDocumentId, releaseState, opts)
        toast.push({
          closable: true,
          status: 'success',
          description: (
            <Translate
              t={t}
              i18nKey="release.toast.delete-schedule-draft.success"
              values={{title: releaseTitle || 'scheduled draft'}}
              components={{Strong}}
            />
          ),
        })
      } catch (error) {
        console.error('Failed to delete scheduled draft:', error)
        toast.push({
          closable: true,
          status: 'error',
          description: (
            <Translate
              t={t}
              i18nKey="release.toast.delete-schedule-draft.error"
              values={{
                title: releaseTitle || 'scheduled draft',
                error: (error as Error).message,
              }}
              components={{Strong}}
            />
          ),
        })
        throw error // Re-throw for caller to handle UI state
      }
    },
    [operations, toast, t, releaseTitle, Strong],
  )

  const rescheduleWithToast = useCallback(
    async (
      releaseDocumentId: string,
      newPublishAt: Date,
      opts?: Parameters<ScheduleDraftOperationsValue['rescheduleScheduledDraft']>[2],
    ) => {
      try {
        await operations.rescheduleScheduledDraft(releaseDocumentId, newPublishAt, opts)
        // No success toast for reschedule per requirements
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
                title: releaseTitle || 'scheduled draft',
                error: (error as Error).message,
              }}
              components={{Strong}}
            />
          ),
        })
        throw error // Re-throw for caller to handle UI state
      }
    },
    [operations, toast, t, releaseTitle, Strong],
  )

  return {
    createScheduledDraft: operations.createScheduledDraft, // No toasts needed
    publishScheduledDraft: runNowWithToast,
    deleteScheduledDraft: deleteScheduleWithToast,
    rescheduleScheduledDraft: rescheduleWithToast,
  }
}
