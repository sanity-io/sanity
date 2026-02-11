import {type SingleActionResult} from '@sanity/client'
import {useTelemetry} from '@sanity/telemetry/react'

import {type ReleaseId} from '../../perspective/types'
import {useSetPerspective} from '../../perspective/useSetPerspective'
import {getDocumentVariantType} from '../../util/getDocumentVariantType'
import {AddedVersion} from '../__telemetry__/releases.telemetry'
import {useReleaseOperations} from '../store/useReleaseOperations'

export interface VersionOperationsValue {
  createVersion: (releaseId: ReleaseId, documentId: string) => Promise<void>
  discardVersion: (releaseId: string, documentId: string) => Promise<SingleActionResult>
  unpublishVersion: (documentId: string) => Promise<SingleActionResult>
  revertUnpublishVersion: (documentId: string) => Promise<SingleActionResult>
}

/** @internal */
export function useVersionOperations(): VersionOperationsValue {
  const telemetry = useTelemetry()
  const {createVersion, discardVersion, unpublishVersion, revertUnpublishVersion} =
    useReleaseOperations()

  const setPerspective = useSetPerspective()

  const handleCreateVersion = async (releaseId: ReleaseId, documentId: string) => {
    const origin = getDocumentVariantType(documentId)
    await createVersion(releaseId, documentId)
    setPerspective(releaseId)
    telemetry.log(AddedVersion, {
      documentOrigin: origin,
    })
  }

  const handleDiscardVersion = async (releaseId: string, documentId: string) =>
    discardVersion(releaseId, documentId)

  const handleUnpublishVersion = async (documentId: string) => unpublishVersion(documentId)

  const handleRevertUnpublishVersion = async (documentId: string) =>
    revertUnpublishVersion(documentId)

  return {
    createVersion: handleCreateVersion,
    discardVersion: handleDiscardVersion,
    unpublishVersion: handleUnpublishVersion,
    revertUnpublishVersion: handleRevertUnpublishVersion,
  }
}
