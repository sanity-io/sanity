import {useTelemetry} from '@sanity/telemetry/react'
import {filter, firstValueFrom} from 'rxjs'
import {
  AddedVersion,
  getCreateVersionOrigin,
  getPublishedId,
  getVersionFromId,
  getVersionId,
  useDocumentOperation,
  useDocumentStore,
  usePerspective,
} from 'sanity'

export function useVersionOperations(
  documentId: string,
  documentType: string,
): {
  createVersion: (releaseId: string) => void
  discardVersion: () => void
} {
  const documentStore = useDocumentStore()
  const telemetry = useTelemetry()

  const publishedId = getPublishedId(documentId)
  const {createVersion} = useDocumentOperation(
    publishedId,
    documentType,
    getVersionFromId(documentId),
  )
  const {setPerspective} = usePerspective()

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

  const handleDiscardVersion = () => {
    // eslint-disable-next-line no-console
    console.log('working on this - rita :)')
  }
  return {
    createVersion: handleCreateVersion,
    discardVersion: handleDiscardVersion,
  }
}
