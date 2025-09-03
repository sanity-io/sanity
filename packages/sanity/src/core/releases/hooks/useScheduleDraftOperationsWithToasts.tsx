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
      opts?: Parameters<ScheduleDraftOperationsValue['runNow']>[1],
    ) => {
      try {
        await operations.runNow(releaseDocumentId, opts)
        toast.push({
          closable: true,
          status: 'success',
          description: (
            <Translate
              t={t}
              i18nKey="release.toast.run-now.success"
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
              i18nKey="release.toast.run-now.error"
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
      opts?: Parameters<ScheduleDraftOperationsValue['deleteSchedule']>[1],
    ) => {
      try {
        await operations.deleteSchedule(releaseDocumentId, opts)
        toast.push({
          closable: true,
          status: 'success',
          description: (
            <Translate
              t={t}
              i18nKey="release.toast.delete-schedule.success"
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
              i18nKey="release.toast.delete-schedule.error"
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
      opts?: Parameters<ScheduleDraftOperationsValue['reschedule']>[2],
    ) => {
      try {
        await operations.reschedule(releaseDocumentId, newPublishAt, opts)
        // No success toast for reschedule per requirements
      } catch (error) {
        console.error('Failed to reschedule draft:', error)
        toast.push({
          closable: true,
          status: 'error',
          description: (
            <Translate
              t={t}
              i18nKey="release.toast.reschedule.error"
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
    schedulePublish: operations.schedulePublish, // No toasts needed
    runNow: runNowWithToast,
    deleteSchedule: deleteScheduleWithToast,
    reschedule: rescheduleWithToast,
  }
}
