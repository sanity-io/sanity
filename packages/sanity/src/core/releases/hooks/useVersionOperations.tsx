import {useTelemetry} from '@sanity/telemetry/react'
import {useToast} from '@sanity/ui'

import {Translate, useTranslation} from '../../i18n'
import {AddedVersion} from '../__telemetry__/releases.telemetry'
import {useReleaseOperations} from '../store/useReleaseOperations'
import {type ReleaseId} from '../util/releaseId'
import {getCreateVersionOrigin} from '../util/util'
import {useStudioPerspectiveState} from './useStudioPerspectiveState'

/** @internal */
export function useVersionOperations(): {
  createVersion: (releaseId: ReleaseId, documentId: string) => Promise<void>
  discardVersion: (releaseId: ReleaseId, documentId: string) => Promise<void>
} {
  const telemetry = useTelemetry()
  const {createVersion, discardVersion} = useReleaseOperations()

  const {setCurrent} = useStudioPerspectiveState()
  const toast = useToast()
  const {t} = useTranslation()

  const handleCreateVersion = async (releaseId: ReleaseId, documentId: string) => {
    const origin = getCreateVersionOrigin(documentId)
    try {
      await createVersion(releaseId, documentId)
      setCurrent(releaseId)
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

      toast.push({
        closable: true,
        status: 'success',
        description: (
          <Translate
            t={t}
            i18nKey={'release.action.discard-version.success'}
            values={{title: document.title as string}}
          />
        ),
      })
    } catch (err) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('release.action.discard-version.failure'),
        description: err.message,
      })
    }
  }
  return {
    createVersion: handleCreateVersion,
    discardVersion: handleDiscardVersion,
  }
}
