import {useTelemetry} from '@sanity/telemetry/react'

import {type ReleaseId} from '../../perspective/types'
import {useSetPerspective} from '../../perspective/useSetPerspective'
import {getDocumentVariantType} from '../../util/getDocumentVariantType'
import {AddedVersion} from '../__telemetry__/releases.telemetry'
import {useReleaseOperations} from '../store/useReleaseOperations'

export interface VersionOperationsValue {
  createVersion: (
    releaseId: ReleaseId,
    documentId: string,
    initialValue?: Record<string, unknown>,
  ) => Promise<void>
  discardVersion: (releaseId: string, documentId: string) => Promise<void>
  unpublishVersion: (documentId: string) => Promise<void>
}

/** @internal */
export function useVersionOperations(): VersionOperationsValue {
  const telemetry = useTelemetry()
  const {createVersion, discardVersion, unpublishVersion} = useReleaseOperations()

  const setPerspective = useSetPerspective()

  const handleCreateVersion = async (
    releaseId: ReleaseId,
    documentId: string,
    initialValue?: Record<string, unknown>,
  ) => {
    const origin = getDocumentVariantType(documentId)
    await createVersion(releaseId, documentId, initialValue)
    setPerspective(releaseId)
    telemetry.log(AddedVersion, {
      documentOrigin: origin,
    })
  }

  const handleDiscardVersion = async (releaseId: string, documentId: string) =>
    discardVersion(releaseId, documentId)

  const handleUnpublishVersion = async (documentId: string) => unpublishVersion(documentId)

  return {
    createVersion: handleCreateVersion,
    discardVersion: handleDiscardVersion,
    unpublishVersion: handleUnpublishVersion,
  }
}
