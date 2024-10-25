import {useTelemetry} from '@sanity/telemetry/react'
import {useToast} from '@sanity/ui'
import {filter, firstValueFrom} from 'rxjs'

import {useClient, useDocumentOperation} from '../../hooks'
import {Translate, useTranslation} from '../../i18n'
import {useDocumentStore} from '../../store'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {getPublishedId, getVersionFromId, getVersionId} from '../../util'
import {AddedVersion} from '../__telemetry__/releases.telemetry'
import {getBundleIdFromReleaseId} from '../util/getBundleIdFromReleaseId'
import {getCreateVersionOrigin} from '../util/util'
import {usePerspective} from './usePerspective'

/** @internal */
export function useVersionOperations(
  documentId: string,
  documentType: string,
): {
  createVersion: (releaseId: string) => void
  discardVersion: () => void
} {
  const publishedId = getPublishedId(documentId)

  const documentStore = useDocumentStore()
  const telemetry = useTelemetry()
  const {createVersion} = useDocumentOperation(
    publishedId,
    documentType,
    getVersionFromId(documentId),
  )
  const {setPerspectiveFromRelease, setPerspective} = usePerspective()
  const toast = useToast()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {t} = useTranslation()
  const {currentGlobalBundle} = usePerspective()

  const handleCreateVersion = async (releaseId: string) => {
    // set up the listener before executing to make sure it's successful
    const createVersionSuccess = firstValueFrom(
      documentStore.pair
        .operationEvents(getPublishedId(documentId), documentType)
        .pipe(filter((e) => e.op === 'createVersion' && e.type === 'success')),
    )

    const docId = getVersionId(publishedId, getBundleIdFromReleaseId(releaseId))

    const origin = getCreateVersionOrigin(documentId)
    createVersion.execute(docId, origin)

    // only change if the version was created successfully
    await createVersionSuccess
    setPerspectiveFromRelease(releaseId)

    telemetry.log(AddedVersion, {
      schemaType: documentType,
      documentOrigin: origin,
    })
  }

  const handleDiscardVersion = async () => {
    try {
      /** @todo eventually change this from using document operations */
      await client.delete(documentId)

      if (
        currentGlobalBundle._id &&
        getBundleIdFromReleaseId(currentGlobalBundle._id) === getVersionFromId(documentId)
      ) {
        setPerspective('drafts')
      }

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
    } catch (e) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('release.action.discard-version.failure'),
      })
    }
  }
  return {
    createVersion: handleCreateVersion,
    discardVersion: handleDiscardVersion,
  }
}
