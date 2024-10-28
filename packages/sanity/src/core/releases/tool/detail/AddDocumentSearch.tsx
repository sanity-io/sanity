import {LayerProvider, PortalProvider, useToast} from '@sanity/ui'
import {useCallback} from 'react'
import {getBundleIdFromReleaseId, useReleaseOperations} from 'sanity'

import {type SanityDocumentLike} from '../../../../../../@sanity/types/src/documents/types'
import {SearchPopover} from '../../../studio/components/navbar/search/components/SearchPopover'
import {SearchProvider} from '../../../studio/components/navbar/search/contexts/search/SearchProvider'

export function AddDocumentSearch({
  open,
  onClose,
  releaseId,
}: {
  open: boolean
  onClose: () => void
  releaseId: string
}): JSX.Element {
  const {createVersion} = useReleaseOperations()
  const toast = useToast()

  const addDocument = useCallback(
    (item: Pick<SanityDocumentLike, '_id' | '_type'>) => {
      createVersion(item._id, getBundleIdFromReleaseId(releaseId)).then((msg) => {
        toast.push({
          closable: true,
          status: 'success',
          title: 'Document added to release',
        })
      })
    },
    [createVersion, releaseId, toast],
  )

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <LayerProvider zOffset={1}>
      <SearchProvider>
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
