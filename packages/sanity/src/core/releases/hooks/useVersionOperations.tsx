import {useTelemetry} from '@sanity/telemetry/react'
import {useToast} from '@sanity/ui'

import {useTranslation} from '../../i18n'
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

  const toast = useToast()
  const {t} = useTranslation()

  const handleCreateVersion = async (
    releaseId: ReleaseId,
    documentId: string,
    initialValue?: Record<string, unknown>,
  ) => {
    const origin = getDocumentVariantType(documentId)
    try {
      await createVersion(releaseId, documentId, initialValue)
      setPerspective(releaseId)
      telemetry.log(AddedVersion, {
        documentOrigin: origin,
      })
    } catch (err) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('release.action.create-version.failure'),
        description: err.message,
      })
    }
  }

  const handleDiscardVersion = async (releaseId: string, documentId: string) => {
    try {
      await discardVersion(releaseId, documentId)
    } catch (err) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('release.action.discard-version.failure'),
        description: err.message,
      })
    }
  }

  const handleUnpublishVersion = async (documentId: string) => {
    try {
      await unpublishVersion(documentId)
    } catch (err) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('release.action.unpublish-version.failure'),
        description: err.message,
      })
    }
  }
  return {
    createVersion: handleCreateVersion,
    discardVersion: handleDiscardVersion,
    unpublishVersion: handleUnpublishVersion,
  }
}
