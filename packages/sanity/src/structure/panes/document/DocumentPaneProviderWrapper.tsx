import {memo} from 'react'
import {useSource} from 'sanity'

import {DocumentPaneWithLegacyTimelineStore} from './DocumentPaneLegacyTimeline'
import {type DocumentPaneProviderProps} from './types'

/**
 * @internal
 */
export const DocumentPaneProviderWrapper = memo((props: DocumentPaneProviderProps) => {
  const source = useSource()
  // TODO: This will add support for the new events timeline store, see https://github.com/sanity-io/sanity/blob/corel/packages/sanity/src/structure/panes/document/DocumentPaneProviderWrapper.tsx#L14-L15

  return <DocumentPaneWithLegacyTimelineStore {...props} />
})
DocumentPaneProviderWrapper.displayName = 'Memo(DocumentPaneProviderWrapper)'
