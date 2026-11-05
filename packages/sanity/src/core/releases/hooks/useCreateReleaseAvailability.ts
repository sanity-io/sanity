import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {defer} from 'rxjs'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useReleaseOperations} from '../store/useReleaseOperations'
import {useReleasePermissions} from '../store/useReleasePermissions'
import {getReleaseDefaults} from '../util/util'
import {
  useWorkspaceReleaseLimit,
  type WorkspaceReleaseLimitStatus,
} from './useWorkspaceReleaseLimit'

type CreateReleaseStatus = 'loading' | 'allowed' | 'no-permission' | 'limit-reached'

export interface CreateReleaseAvailability {
  status: CreateReleaseStatus
  disabled: boolean
  tooltip: string | undefined
}

function getCreateReleaseStatus(
  hasPermission: boolean | null,
  workspaceLimitStatus: WorkspaceReleaseLimitStatus,
): CreateReleaseStatus {
  if (workspaceLimitStatus === 'limit-reached') return 'limit-reached'
  if (workspaceLimitStatus === 'pending' || hasPermission === null) return 'loading'
  return hasPermission ? 'allowed' : 'no-permission'
}

/**
 * Plan limits are left to `guardWithReleaseLimitUpsell`, which checks them on click.
 * @internal
 */
export function useCreateReleaseAvailability(): CreateReleaseAvailability {
  const {t} = useTranslation()
  const workspaceLimit = useWorkspaceReleaseLimit()
  const {createRelease} = useReleaseOperations()
  const {checkWithPermissionGuard} = useReleasePermissions()

  const hasPermission$ = useMemo(
    () => defer(() => checkWithPermissionGuard(createRelease, getReleaseDefaults())),
    [checkWithPermissionGuard, createRelease],
  )
  const hasPermission = useObservable(hasPermission$, null)

  const status = getCreateReleaseStatus(hasPermission, workspaceLimit.status)

  const tooltipByStatus: Record<CreateReleaseStatus, string | undefined> = {
    'loading': undefined,
    'allowed': undefined,
    'no-permission': t('release.action.permission.error'),
    'limit-reached': workspaceLimit.message,
  }

  return {status, disabled: status !== 'allowed', tooltip: tooltipByStatus[status]}
}
