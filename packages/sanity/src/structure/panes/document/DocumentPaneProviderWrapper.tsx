import {memo} from 'react'
import {useSource} from 'sanity'

import {DocumentEventsPane} from './DocumentEventsPane'
import {DocumentPaneWithLegacyTimelineStore} from './DocumentPaneLegacyTimeline'
import {type DocumentPaneProviderProps} from './types'

/**
 * @internal
 */
export const DocumentPaneProviderWrapper = memo((props: DocumentPaneProviderProps) => {
  const source = useSource()
  if (source.beta?.eventsAPI?.documents) {
    return <DocumentEventsPane {...props} />
  }
  return <DocumentPaneWithLegacyTimelineStore {...props} />
})
DocumentPaneProviderWrapper.displayName = 'Memo(DocumentPaneProviderWrapper)'
