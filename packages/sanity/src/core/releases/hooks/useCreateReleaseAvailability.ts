import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {defer} from 'rxjs'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useWorkspace} from '../../studio/workspace'
import {useActiveReleases} from '../store/useActiveReleases'
import {useReleaseOperations} from '../store/useReleaseOperations'
import {useReleasePermissions} from '../store/useReleasePermissions'
import {getReleaseDefaults} from '../util/util'

type CreateReleaseStatus = 'loading' | 'allowed' | 'no-permission' | 'limit-reached'

export interface CreateReleaseAvailability {
  status: CreateReleaseStatus
  disabled: boolean
  tooltip: string | undefined
}

function getCreateReleaseStatus(
  hasPermission: boolean | null,
  isLimitReached: boolean,
): CreateReleaseStatus {
  if (isLimitReached) return 'limit-reached'
  if (hasPermission === null) return 'loading'
  return hasPermission ? 'allowed' : 'no-permission'
}

/**
 * The workspace limit counts every active release in the dataset, scheduled drafts included.
 * Plan limits are deliberately absent: `guardWithReleaseLimitUpsell` checks them on click so the
 * control stays enabled and opens the upsell dialog.
 * @internal
 */
export function useCreateReleaseAvailability(): CreateReleaseAvailability {
  const {t} = useTranslation()
  const {releases} = useWorkspace()
  const {data: activeReleases} = useActiveReleases()
  const {createRelease} = useReleaseOperations()
  const {checkWithPermissionGuard} = useReleasePermissions()

  const hasPermission$ = useMemo(
    () => defer(() => checkWithPermissionGuard(createRelease, getReleaseDefaults())),
    [checkWithPermissionGuard, createRelease],
  )
  const hasPermission = useObservable(hasPermission$, null)

  const limit = releases?.limit ?? Infinity
  const status = getCreateReleaseStatus(hasPermission, activeReleases.length >= limit)

  const tooltipByStatus: Record<CreateReleaseStatus, string | undefined> = {
    'loading': undefined,
    'allowed': undefined,
    'no-permission': t('release.action.permission.error'),
    'limit-reached': t('release.action.new-release.limit-reached', {count: limit}),
  }

  return {status, disabled: status !== 'allowed', tooltip: tooltipByStatus[status]}
}
