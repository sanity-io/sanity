import {type SingleActionResult} from '@sanity/client'
import {useTelemetry} from '@sanity/telemetry/react'

import {type ReleaseId} from '../../perspective/types'
import {useSetPerspective} from '../../perspective/useSetPerspective'
import {getDocumentVariantType} from '../../util/getDocumentVariantType'
import {AddedVersion} from '../__telemetry__/releases.telemetry'
import {useReleaseOperations} from '../store/useReleaseOperations'

export interface VersionOperationsValue {
  createVersion: (releaseId: ReleaseId, documentId: string) => Promise<void>
  revertUnpublishVersion: (documentId: string) => Promise<SingleActionResult>
}

/** @internal */
export function useVersionOperations(): VersionOperationsValue {
  const telemetry = useTelemetry()
  const {createVersion, revertUnpublishVersion} = useReleaseOperations()

  const setPerspective = useSetPerspective()

  const handleCreateVersion = async (releaseId: ReleaseId, documentId: string) => {
    const origin = getDocumentVariantType(documentId)
    await createVersion(releaseId, documentId)
    setPerspective(releaseId)
    telemetry.log(AddedVersion, {
      documentOrigin: origin,
    })
  }

  const handleRevertUnpublishVersion = async (documentId: string) =>
    revertUnpublishVersion(documentId)

  return {
    createVersion: handleCreateVersion,
    revertUnpublishVersion: handleRevertUnpublishVersion,
  }
}
