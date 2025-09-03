import {useToast} from '@sanity/ui'
import {useCallback, type ReactNode} from 'react'

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

  const runNowWithToast = useCallback(
    async (
      releaseDocumentId: string,
      opts?: Parameters<ScheduleDraftOperationsValue['runNow']>[1],
    ) => {
      try {
        await operations.runNow(releaseDocumentId, opts)
        // Show success toast for run-now
        toast.push({
          closable: true,
          status: 'success',
          description: (
            <Translate
              t={t}
              i18nKey="release.toast.run-now.success"
              values={{title: releaseTitle || 'scheduled draft'}}
              components={{
                Strong: ({children}: {children?: ReactNode}) => <strong>{children}</strong>,
              }}
            />
          ),
        })
      } catch (error) {
        console.error('Failed to run scheduled draft:', error)
        // Show error toast for run-now
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
              components={{
                Strong: ({children}: {children?: ReactNode}) => <strong>{children}</strong>,
              }}
            />
          ),
        })
        throw error // Re-throw for caller to handle UI state
      }
    },
    [operations, toast, t, releaseTitle],
  )

  const deleteScheduleWithToast = useCallback(
    async (
      releaseDocumentId: string,
      opts?: Parameters<ScheduleDraftOperationsValue['deleteSchedule']>[1],
    ) => {
      try {
        await operations.deleteSchedule(releaseDocumentId, opts)
        // Show success toast for delete-schedule
        toast.push({
          closable: true,
          status: 'success',
          description: (
            <Translate
              t={t}
              i18nKey="release.toast.delete-schedule.success"
              values={{title: releaseTitle || 'scheduled draft'}}
              components={{
                Strong: ({children}: {children?: ReactNode}) => <strong>{children}</strong>,
              }}
            />
          ),
        })
      } catch (error) {
        console.error('Failed to delete scheduled draft:', error)
        // Show error toast for delete-schedule
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
              components={{
                Strong: ({children}: {children?: ReactNode}) => <strong>{children}</strong>,
              }}
            />
          ),
        })
        throw error // Re-throw for caller to handle UI state
      }
    },
    [operations, toast, t, releaseTitle],
  )

  const rescheduleWithToast = useCallback(
    async (
      releaseDocumentId: string,
      newPublishAt: Date,
      opts?: Parameters<ScheduleDraftOperationsValue['reschedule']>[2],
    ) => {
      try {
        await operations.reschedule(releaseDocumentId, newPublishAt, opts)
        // No success toast for reschedule - per requirements
      } catch (error) {
        console.error('Failed to reschedule draft:', error)
        // Show error toast for reschedule
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
              components={{
                Strong: ({children}: {children?: ReactNode}) => <strong>{children}</strong>,
              }}
            />
          ),
        })
        throw error // Re-throw for caller to handle UI state
      }
    },
    [operations, toast, t, releaseTitle],
  )

  // Return the same interface as useScheduleDraftOperations but with toast-enabled methods
  return {
    schedulePublish: operations.schedulePublish, // This one doesn't need toasts
    runNow: runNowWithToast,
    deleteSchedule: deleteScheduleWithToast,
    reschedule: rescheduleWithToast,
  }
}
