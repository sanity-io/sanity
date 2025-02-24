import {type SanityDocument} from '@sanity/client'
import {LayerProvider, PortalProvider} from '@sanity/ui'

import {SearchPopover} from '../../../studio/components/navbar/search/components/SearchPopover'
import {SearchProvider} from '../../../studio/components/navbar/search/contexts/search/SearchProvider'
import {useBundleDocuments} from './useBundleDocuments'

export type AddedDocument = Pick<SanityDocument, '_id' | '_type' | 'title'> &
  Partial<SanityDocument>

export function AddDocumentSearch({
  open,
  onClose,
  releaseId,
}: {
  open: boolean
  onClose: (document?: AddedDocument) => void
  releaseId: string
}): React.JSX.Element {
  const {results} = useBundleDocuments(releaseId)
  const idsInRelease: string[] = results.map((doc) => doc.document._id)

  return (
    <LayerProvider zOffset={1}>
      {/* eslint-disable-next-line @sanity/i18n/no-attribute-string-literals*/}
      <SearchProvider perspective={['raw']} disabledDocumentIds={idsInRelease} canDisableAction>
        <PortalProvider>
          <SearchPopover onClose={onClose} onItemSelect={onClose} open={open} disableIntentLink />
        </PortalProvider>
      </SearchProvider>
    </LayerProvider>
  )
}
