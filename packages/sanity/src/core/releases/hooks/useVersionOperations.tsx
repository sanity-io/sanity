import {useTelemetry} from '@sanity/telemetry/react'
import {useToast} from '@sanity/ui'

import {Translate, useTranslation} from '../../i18n'
import {AddedVersion} from '../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../i18n'
import {useReleaseOperations} from '../store/useReleaseOperations'
import {getCreateVersionOrigin} from '../util/util'
import {usePerspective} from './usePerspective'

/** @internal */
export function useVersionOperations(): {
  createVersion: (releaseId: string, documentId: string) => Promise<void>
  discardVersion: (releaseId: string, documentId: string) => Promise<void>
} {
  const telemetry = useTelemetry()
  const {createVersion, discardVersion} = useReleaseOperations()

  const {setPerspectiveFromReleaseId} = usePerspective()
  const toast = useToast()
  const {t} = useTranslation(releasesLocaleNamespace)

  const handleCreateVersion = async (releaseId: string, documentId: string) => {
    const origin = getCreateVersionOrigin(documentId)
    try {
      await createVersion(releaseId, documentId)
      setPerspectiveFromReleaseId(releaseId)
      telemetry.log(AddedVersion, {
        documentOrigin: origin,
      })
    } catch (err) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('action.create-version.failure'),
        description: err.message,
      })
    }
  }

  const handleDiscardVersion = async (releaseId: string, documentId: string) => {
    try {
      await discardVersion(releaseId, documentId)

      toast.push({
        closable: true,
        status: 'success',
        description: (
          <Translate
            t={t}
            i18nKey={'action.discard-version.success'}
            values={{title: document.title as string}}
          />
        ),
      })
    } catch (err) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('action.discard-version.failure'),
        description: err.message,
      })
    }
  }
  return {
    createVersion: handleCreateVersion,
    discardVersion: handleDiscardVersion,
  }
}
