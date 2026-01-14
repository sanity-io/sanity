import {memo, useCallback} from 'react'
import {SingleDocReleaseProvider, useSource} from 'sanity'

import {usePaneRouter} from '../../components/paneRouter/usePaneRouter'
import {DocumentEventsPane} from './DocumentEventsPane'
import {DocumentPaneWithLegacyTimelineStore} from './DocumentPaneLegacyTimeline'
import {DocumentPerspectiveProvider} from './DocumentPerspectiveProvider'
import {type DocumentPaneProviderProps} from './types'

/**
 * @internal
 */
export const DocumentPaneProviderWrapper = memo((props: DocumentPaneProviderProps) => {
  const source = useSource()
  const {setParams, params} = usePaneRouter()
  const handleSetScheduledDraftPerspective = useCallback(
    (releaseId: string) => {
      setParams(
        {...params, scheduledDraft: releaseId},
        // We need to reset the perspective sticky param when we set the scheduled draft local perspective.
        // this is because the user may be clicking this from another perspective, for example they could be seeing a `release` perspective and then click to see this scheduled draft perspective.
        // the perspective sticky param was set to the release perspective, so we need to remove it.
        // We are changing both the params and the perspective sticky param to ensure that the scheduled draft perspective is set correctly.
        {perspective: ''},
      )
    },
    [params, setParams],
  )

  return (
    <DocumentPerspectiveProvider>
      <SingleDocReleaseProvider onSetScheduledDraftPerspective={handleSetScheduledDraftPerspective}>
        {source.beta?.eventsAPI?.documents ? (
          <DocumentEventsPane {...props} />
        ) : (
          <DocumentPaneWithLegacyTimelineStore {...props} />
        )}
      </SingleDocReleaseProvider>
    </DocumentPerspectiveProvider>
  )
})
DocumentPaneProviderWrapper.displayName = 'Memo(DocumentPaneProviderWrapper)'
