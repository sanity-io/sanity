import {type ReleaseDocument} from '@sanity/client'
import {useEffect, useRef, useState} from 'react'

import {getIsReleaseOpen} from '../../components/dialog/TitleDescriptionForm'
import {useReleaseOperations} from '../../index'
import {useReleasePermissions} from '../../store/useReleasePermissions'

/**
 * Whether the current user may edit a release's details (title/description). True only when the
 * release is open (editing a published/archived release is not possible) and the permission guard
 * on `updateRelease` passes. Shared by the display-surface edit affordance and the action rail so
 * both gate on exactly the same condition.
 *
 * @internal
 */
export function useCanEditRelease(release: ReleaseDocument): boolean {
  const {updateRelease} = useReleaseOperations()
  const {checkWithPermissionGuard} = useReleasePermissions()
  const [hasUpdatePermission, setHasUpdatePermission] = useState<boolean | null>(null)

  const isReleaseOpen = getIsReleaseOpen(release)
  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true

    if (isReleaseOpen) {
      // Editing is only possible on an open release, so only check permission when it's open.
      void checkWithPermissionGuard(updateRelease, release).then((hasPermission) => {
        if (isMounted.current) setHasUpdatePermission(hasPermission)
      })
    }

    return () => {
      isMounted.current = false
    }
  }, [checkWithPermissionGuard, isReleaseOpen, release, updateRelease])

  return isReleaseOpen && Boolean(hasUpdatePermission)
}
