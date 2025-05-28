import {type SanityDocument} from '@sanity/client'
import {LayerProvider, PortalProvider} from '@sanity/ui'

import {SearchPopover} from '../../../studio/components/navbar/search/components/SearchPopover'
import {SearchProvider} from '../../../studio/components/navbar/search/contexts/search/SearchProvider'

export type AddedDocument = Pick<SanityDocument, '_id' | '_type' | 'title'> &
  Partial<SanityDocument>

export function AddDocumentSearch({
  open,
  onClose,
  releaseId,
  idsInRelease,
}: {
  open: boolean
  onClose: (document?: AddedDocument) => void
  releaseId: string
  idsInRelease: string[]
}): React.JSX.Element {
  return (
    <LayerProvider zOffset={1}>
      <SearchProvider disabledDocumentIds={idsInRelease} canDisableAction>
        <PortalProvider>
          <SearchPopover
            onClose={onClose}
            onItemSelect={onClose}
            open={open}
            previewPerspective={[releaseId]}
            disableIntentLink
          />
        </PortalProvider>
      </SearchProvider>
    </LayerProvider>
  )
}
