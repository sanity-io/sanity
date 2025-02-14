import {type SanityDocument} from '@sanity/client'
import {useTelemetry} from '@sanity/telemetry/react'
import {LayerProvider, PortalProvider, useToast} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'

import {SearchPopover} from '../../../studio/components/navbar/search/components/SearchPopover'
import {SearchProvider} from '../../../studio/components/navbar/search/contexts/search/SearchProvider'
import {getVersionId} from '../../../util/draftUtils'
import {getDocumentVariantType} from '../../../util/getDocumentVariantType'
import {AddedVersion} from '../../__telemetry__/releases.telemetry'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {useBundleDocuments} from './useBundleDocuments'

export type AddedDocument = Pick<SanityDocument, '_id' | '_type' | 'title'> &
  Partial<SanityDocument>

export function AddDocumentSearch({
  open,
  onClose,
  releaseDocumentId,
}: {
  open: boolean
  onClose: (document: AddedDocument) => void
  releaseDocumentId: string
}): React.JSX.Element {
  const {createVersion} = useReleaseOperations()
  const toast = useToast()
  const telemetry = useTelemetry()

  const releaseId = getReleaseIdFromReleaseDocumentId(releaseDocumentId)

  const {results} = useBundleDocuments(releaseId)
  const idsInRelease: string[] = results.map((doc) => doc.document._id)

  const [addedId, setAddedId] = useState<AddedDocument | null>(null)
  const [isReadyToClose, setIsReadyToClose] = useState(false)
  const [addedDocument, setAddedDocument] = useState<AddedDocument[]>([])

  // Only close search once the document has been received through subscription
  // to the release documents
  useEffect(() => {
    if (isReadyToClose && addedId && idsInRelease.includes(getVersionId(addedId._id, releaseId))) {
      setAddedId(null)
      setIsReadyToClose(false)

      // onClose(addedDocument)
    }
  }, [addedId, idsInRelease, onClose, releaseId, isReadyToClose, addedDocument])

  const addDocument = useCallback(
    async (item: AddedDocument) => {
      try {
        setAddedId(item)
        setAddedDocument(item)
        onClose({...item, _id: getVersionId(item._id, releaseId)})
        await createVersion(releaseId, item._id)

        toast.push({
          closable: true,
          status: 'success',
          title: `${item.title} added to release`,
        })

        const origin = getDocumentVariantType(item._id)

        telemetry.log(AddedVersion, {
          documentOrigin: origin,
        })
      } catch (error) {
        toast.push({
          closable: true,
          status: 'error',
          title: error.message,
        })
      }

      // onClose(addedDocument)
    },
    [createVersion, onClose, releaseId, telemetry, toast],
  )

  const handleClose = useCallback(() => {
    console.log('close called')
  }, [])

  return (
    <LayerProvider zOffset={1}>
      {/* eslint-disable-next-line @sanity/i18n/no-attribute-string-literals*/}
      <SearchProvider perspective={['raw']} disabledDocumentIds={idsInRelease} canDisableAction>
        <PortalProvider>
          <SearchPopover
            onClose={handleClose}
            onItemSelect={addDocument}
            open={open}
            disableIntentLink
          />
        </PortalProvider>
      </SearchProvider>
    </LayerProvider>
  )
}
