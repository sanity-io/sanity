import {memo} from 'react'
import {useSource} from 'sanity'

import {DocumentEventsPane} from './DocumentEventsPane'
import {DocumentPaneWithLegacyTimelineStore} from './DocumentPaneLegacyTimeline'
import {DocumentPerspectiveProvider} from './DocumentPerspectiveProvider'
import {type DocumentPaneProviderProps} from './types'

/**
 * @internal
 */
export const DocumentPaneProviderWrapper = memo((props: DocumentPaneProviderProps) => {
  const source = useSource()

  return (
    <DocumentPerspectiveProvider>
      {source.beta?.eventsAPI?.documents ? (
        <DocumentEventsPane {...props} />
      ) : (
        <DocumentPaneWithLegacyTimelineStore {...props} />
      )}
    </DocumentPerspectiveProvider>
  )
})
DocumentPaneProviderWrapper.displayName = 'Memo(DocumentPaneProviderWrapper)'
