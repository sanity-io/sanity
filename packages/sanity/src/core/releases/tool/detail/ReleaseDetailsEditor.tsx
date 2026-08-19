import {type EditableReleaseDocument, type ReleaseDocument} from '@sanity/client'
import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useEffect, useRef, useState} from 'react'

import {DetailIdentity} from '../../../components/detailLayout'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useWorkspace} from '../../../studio/workspace'
import {ReleaseDescriptionSet} from '../../__telemetry__/releases.telemetry'
import {getIsReleaseOpen, TitleDescriptionForm} from '../../components/dialog/TitleDescriptionForm'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {useReleasePermissions} from '../../store/useReleasePermissions'
import {getReleaseDescriptionTelemetry} from '../../util/getReleaseDescriptionTelemetry'

function ReleaseDetailsEditorProduction({release}: {release: ReleaseDocument}): React.JSX.Element {
  const {updateRelease} = useReleaseOperations()
  const [timer, setTimer] = useState<NodeJS.Timeout | undefined>(undefined)
  const telemetry = useTelemetry()
  // Scoped to a release id because this component instance is reused across release navigation.
  const lastLoggedDescription = useRef({
    releaseId: release._id,
    description: release.metadata?.description ?? '',
  })

  const {checkWithPermissionGuard} = useReleasePermissions()
  const [hasUpdatePermission, setHasUpdatePermission] = useState<boolean | null>(null)

  const handleOnChange = useCallback(
    (changedValue: EditableReleaseDocument) => {
      clearTimeout(timer)

      /** @todo I wasn't able to get this working with the debouncer that we use in other parts */
      const newTimer = setTimeout(() => {
        if (hasUpdatePermission) {
          const nextDescription = changedValue.metadata?.description ?? ''
          const isSameRelease = lastLoggedDescription.current.releaseId === release._id
          const baselineDescription = isSameRelease
            ? lastLoggedDescription.current.description
            : (release.metadata?.description ?? '')
          const hasChangedDescription = nextDescription !== baselineDescription

          lastLoggedDescription.current = {
            releaseId: release._id,
            description: nextDescription,
          }

          if (hasChangedDescription) {
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
    [hasUpdatePermission, timer, updateRelease, telemetry, release],
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

/**
 * The release identity (title + description) as a read-only display surface built on the shared
 * `DetailIdentity` spine.
 *
 * Editing is an explicit action, never inline. Behind `beta.variants` the pencil is dropped in
 * favour of a defined "Edit details" action in the top action rail (a defined button is discoverable
 * and keyboard/screen-reader accessible in a way a hover-only affordance is not).
 */
function ReleaseDetailsEditorVariants({release}: {release: ReleaseDocument}): React.JSX.Element {
  const {t} = useTranslation()

  return (
    <DetailIdentity
      title={release.metadata.title}
      titleAs="h1"
      titlePlaceholder={t('release.placeholder-untitled-release')}
      description={release.metadata.description}
      titleTestId="release-title-display"
      descriptionTestId="release-description-display"
    />
  )
}

export function ReleaseDetailsEditor({release}: {release: ReleaseDocument}): React.JSX.Element {
  const variantsEnabled = Boolean(useWorkspace().beta?.variants?.enabled)

  if (variantsEnabled) {
    return <ReleaseDetailsEditorVariants release={release} />
  }

  return <ReleaseDetailsEditorProduction release={release} />
}
