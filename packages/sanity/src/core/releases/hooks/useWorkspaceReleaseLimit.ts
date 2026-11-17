import {useToast} from '@sanity/ui/toast'
import {useCallback} from 'react'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useWorkspace} from '../../studio/workspace'
import {useActiveReleases} from '../store/useActiveReleases'

export type WorkspaceReleaseLimitStatus = 'pending' | 'within-limit' | 'limit-reached'

interface WorkspaceReleaseLimit {
  status: WorkspaceReleaseLimitStatus
  message: string | undefined
}

function getWorkspaceReleaseLimitStatus(
  activeReleaseCount: number,
  limit: number,
  loading: boolean,
): WorkspaceReleaseLimitStatus {
  if (activeReleaseCount >= limit) return 'limit-reached'
  if (loading && Number.isFinite(limit)) return 'pending'
  return 'within-limit'
}

/**
 * The workspace limit counts every active release in the dataset, scheduled drafts included,
 * though scheduling a draft is not gated by it.
 * @internal
 */
export function useWorkspaceReleaseLimit(): WorkspaceReleaseLimit {
  const {t} = useTranslation()
  const {releases} = useWorkspace()
  const {data: activeReleases, loading} = useActiveReleases()

  const limit = releases?.limit ?? Infinity
  const status = getWorkspaceReleaseLimitStatus(activeReleases.length, limit, loading)

  return {
    status,
    message:
      status === 'limit-reached'
        ? t('release.action.new-release.limit-reached', {count: limit})
        : undefined,
  }
}

/**
 * Only the studio enforces the workspace limit, so a dialog opened below it checks again on
 * submit in case releases were created in the meantime. Returns `true` when it blocked.
 * @internal
 */
export function useWorkspaceReleaseLimitGuard(): () => boolean {
  const toast = useToast()
  const {status, message} = useWorkspaceReleaseLimit()

  return useCallback(() => {
    if (status === 'limit-reached') {
      toast.push({closable: true, status: 'error', title: message})
      return true
    }
    return false
  }, [message, status, toast])
}
