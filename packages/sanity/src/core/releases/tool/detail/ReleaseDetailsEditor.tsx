import {type EditableReleaseDocument, type ReleaseDocument} from '@sanity/client'
import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useEffect, useRef, useState} from 'react'

import {ReleaseDescriptionSet} from '../../__telemetry__/releases.telemetry'
import {getIsReleaseOpen, TitleDescriptionForm} from '../../components/dialog/TitleDescriptionForm'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {useReleasePermissions} from '../../store/useReleasePermissions'
import {getReleaseDescriptionTelemetry} from '../../util/getReleaseDescriptionTelemetry'

export function ReleaseDetailsEditor({release}: {release: ReleaseDocument}): React.JSX.Element {
  const {updateRelease} = useReleaseOperations()
  const [timer, setTimer] = useState<NodeJS.Timeout | undefined>(undefined)
  const telemetry = useTelemetry()
  // Tracks the last description we logged so title-only edits and repeated saves
  // of an unchanged description do not emit duplicate telemetry.
  const lastLoggedDescription = useRef(release.metadata?.description ?? '')

  const {checkWithPermissionGuard} = useReleasePermissions()
  const [hasUpdatePermission, setHasUpdatePermission] = useState<boolean | null>(null)

  const handleOnChange = useCallback(
    (changedValue: EditableReleaseDocument) => {
      clearTimeout(timer)

      /** @todo I wasn't able to get this working with the debouncer that we use in other parts */
      const newTimer = setTimeout(() => {
        if (hasUpdatePermission) {
          const nextDescription = changedValue.metadata?.description ?? ''
          if (nextDescription !== lastLoggedDescription.current) {
            lastLoggedDescription.current = nextDescription
            telemetry.log(
              ReleaseDescriptionSet,
              getReleaseDescriptionTelemetry('edit', nextDescription),
            )
          }
          void updateRelease(changedValue)
        }
      }, 200)

      setTimer(newTimer)
    },
    [hasUpdatePermission, timer, updateRelease, telemetry],
  )

  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true

    if (getIsReleaseOpen(release)) {
      // title and description will be readOnly if release is not 'open'
      // so only need to check permission to edit if release is 'open'
      void checkWithPermissionGuard(updateRelease, release).then((hasPermission) => {
        if (isMounted.current) setHasUpdatePermission(hasPermission)
      })
    }

    return () => {
      isMounted.current = false
    }
  }, [checkWithPermissionGuard, release, release._id, updateRelease])

  return (
    <TitleDescriptionForm
      key={release._id}
      release={release}
      onChange={handleOnChange}
      disabled={Boolean(!hasUpdatePermission)}
    />
  )
}
