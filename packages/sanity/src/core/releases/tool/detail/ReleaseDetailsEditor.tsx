import {useCallback, useEffect, useRef, useState} from 'react'

import {getIsReleaseOpen, TitleDescriptionForm} from '../../components/dialog/TitleDescriptionForm'
import {type EditableReleaseDocument, type ReleaseDocument, useReleaseOperations} from '../../index'
import {useReleasePermissions} from '../../store/useReleasePermissions'

export function ReleaseDetailsEditor({release}: {release: ReleaseDocument}): React.JSX.Element {
  const {updateRelease} = useReleaseOperations()
  const [timer, setTimer] = useState<NodeJS.Timeout | undefined>(undefined)

  const {checkWithPermissionGuard} = useReleasePermissions()
  const [hasUpdatePermission, setHasUpdatePermission] = useState<boolean | null>(null)

  const handleOnChange = useCallback(
    (changedValue: EditableReleaseDocument) => {
      clearTimeout(timer)

      /** @todo I wasn't able to get this working with the debouncer that we use in other parts */
      const newTimer = setTimeout(() => {
        if (hasUpdatePermission) {
          updateRelease(changedValue)
        }
      }, 200)

      setTimer(newTimer)
    },
    [hasUpdatePermission, timer, updateRelease],
  )

  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true

    if (getIsReleaseOpen(release)) {
      // title and description will be readOnly if release is not 'open'
      // so only need to check permission to edit if release is 'open'
      checkWithPermissionGuard(updateRelease, release).then((hasPermission) => {
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
