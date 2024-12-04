import {memo} from 'react'

import {useSource} from '../../../core/studio/source'
import {DocumentPaneEvents} from './DocumentPaneEvents'
import {DocumentPaneWithLegacyTimelineStore} from './DocumentPaneLegacyTimeline'
import {type DocumentPaneProviderProps} from './types'

/**
 * @internal
 */
export const DocumentPaneProviderWrapper = memo((props: DocumentPaneProviderProps) => {
  const source = useSource()
  if (source.beta?.eventsAPI?.enabled) {
    return <DocumentPaneEvents {...props} />
  }
  return <DocumentPaneWithLegacyTimelineStore {...props} />
})
DocumentPaneProviderWrapper.displayName = 'Memo(DocumentPaneProviderWrapper)'
