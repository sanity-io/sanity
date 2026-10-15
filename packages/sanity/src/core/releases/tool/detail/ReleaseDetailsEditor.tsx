import {type EditableReleaseDocument, type ReleaseDocument} from '@sanity/client'
import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {DetailIdentity} from '../../../components/detailLayout'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useWorkspace} from '../../../studio/workspace'
import {ReleaseDescriptionSet} from '../../__telemetry__/releases.telemetry'
import {ReleaseMetadataForm} from '../../components/dialog/ReleaseMetadataForm'
import {TitleDescriptionForm} from '../../components/dialog/TitleDescriptionForm'
import {
  asReleaseMetadata,
  toReleaseMetadataRecord,
  type ReleaseMetadataRecord,
} from '../../metadata/mergeReleaseMetadata'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {getReleaseDescriptionTelemetry} from '../../util/getReleaseDescriptionTelemetry'
import {useCanEditRelease} from './useCanEditRelease'

function ReleaseDetailsEditorProduction({release}: {release: ReleaseDocument}): React.JSX.Element {
  const {updateRelease} = useReleaseOperations()
  const canEdit = useCanEditRelease(release)
  const hasMetadataFields = (useWorkspace().releases?.metadata?.fields?.length ?? 0) > 0
  const [timer, setTimer] = useState<NodeJS.Timeout | undefined>(undefined)
  const [metadata, setMetadata] = useState<ReleaseMetadataRecord>(() =>
    toReleaseMetadataRecord(release.metadata),
  )
  const [metadataValid, setMetadataValid] = useState(!hasMetadataFields)
  const metadataValidRef = useRef(metadataValid)
  const dirtyRef = useRef(false)
  const pendingSave = useRef<EditableReleaseDocument | null>(null)
  const telemetry = useTelemetry()
  // Scoped to a release id because this component instance is reused across release navigation.
  const lastLoggedDescription = useRef({
    releaseId: release._id,
    description: release.metadata?.description ?? '',
  })

  const handleOnChange = useCallback(
    (changedValue: EditableReleaseDocument) => {
      dirtyRef.current = true
      pendingSave.current = changedValue
      setMetadata(toReleaseMetadataRecord(changedValue.metadata))
      clearTimeout(timer)

      /** @todo I wasn't able to get this working with the debouncer that we use in other parts */
      const newTimer = setTimeout(() => {
        if (canEdit && metadataValidRef.current) {
          dirtyRef.current = false
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
    [canEdit, timer, updateRelease, telemetry, release],
  )

  const seenReleaseId = useRef(release._id)
  useEffect(() => {
    metadataValidRef.current = metadataValid
  }, [metadataValid])

  useEffect(() => {
    if (seenReleaseId.current === release._id) return
    seenReleaseId.current = release._id
    dirtyRef.current = false
    setMetadata(toReleaseMetadataRecord(release.metadata))
  }, [release._id, release.metadata])

  useEffect(() => {
    const pending = pendingSave.current
    if (!metadataValid || !canEdit || !dirtyRef.current || !pending) return
    dirtyRef.current = false
    void updateRelease(pending)
  }, [canEdit, metadataValid, updateRelease])

  const releaseForForm = useMemo(
    () => ({...release, metadata: asReleaseMetadata(metadata)}),
    [metadata, release],
  )

  const handleMetadataChange = useCallback(
    (next: EditableReleaseDocument['metadata']) => {
      handleOnChange({...releaseForForm, metadata: next})
    },
    [handleOnChange, releaseForForm],
  )

  return (
    <>
      <TitleDescriptionForm
        key={release._id}
        release={releaseForForm}
        onChange={handleOnChange}
        disabled={!canEdit}
      />
      <ReleaseMetadataForm
        commitInitialValues={false}
        metadata={releaseForForm.metadata}
        onChange={handleMetadataChange}
        onValidityChange={setMetadataValid}
        readOnly={!canEdit}
      />
    </>
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
