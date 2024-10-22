import {useTelemetry} from '@sanity/telemetry/react'
import {useToast} from '@sanity/ui'
import {filter, firstValueFrom} from 'rxjs'
import {
  AddedVersion,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  getCreateVersionOrigin,
  getPublishedId,
  getVersionFromId,
  getVersionId,
  Translate,
  useClient,
  useDocumentOperation,
  useDocumentStore,
  usePerspective,
  useTranslation,
} from 'sanity'

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
  const {setPerspective} = usePerspective()
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

    const docId = getVersionId(publishedId, releaseId)

    const origin = getCreateVersionOrigin(documentId)
    createVersion.execute(docId, origin)

    // only change if the version was created successfully
    await createVersionSuccess
    setPerspective(releaseId)

    telemetry.log(AddedVersion, {
      schemaType: documentType,
      documentOrigin: origin,
    })
  }

  const handleDiscardVersion = async () => {
    try {
      /** @todo eventually change this from using document operations */
      await client.delete(documentId)

      if (currentGlobalBundle._id === getVersionFromId(documentId)) {
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
