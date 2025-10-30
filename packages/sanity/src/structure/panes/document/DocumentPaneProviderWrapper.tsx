import {memo, useMemo} from 'react'
import {
  getVersionFromId,
  isCardinalityOnePerspective,
  PerspectiveProvider,
  PUBLISHED,
  useDocumentVersions,
  usePerspective,
  useSource,
  useWorkspace,
} from 'sanity'

import {ConditionalWrapper} from '../../../ui-components'
import {DocumentEventsPane} from './DocumentEventsPane'
import {DocumentPaneWithLegacyTimelineStore} from './DocumentPaneLegacyTimeline'
import {type DocumentPaneProviderProps} from './types'

/**
 * Local perspective wrapper that sets the default perspective for a given pane
 * when the global perspective is a scheduled draft and the document doesn't belong to that perspective.
 *
 * This will happen in cases where we have two or more document panes open.
 * - [documentPane1 (scheduledDraft) | documentPane2]
 * For document pane 2 we want to render it with the default perspective (published|drafts) and not the scheduled draft perspective.
 */
const DefaultPerspectiveWrapper = ({children}: {children: React.ReactNode}) => {
  const {document} = useWorkspace()
  const {excludedPerspectives} = usePerspective()

  const isDraftModelEnabled = document?.drafts?.enabled
  const defaultPerspective = isDraftModelEnabled ? undefined : PUBLISHED
  return (
    <PerspectiveProvider
      selectedPerspectiveName={defaultPerspective}
      excludedPerspectives={excludedPerspectives}
    >
      {children}
    </PerspectiveProvider>
  )
}

/**
 * @internal
 */
export const DocumentPaneProviderWrapper = memo((props: DocumentPaneProviderProps) => {
  const source = useSource()
  const {selectedPerspectiveName, selectedPerspective} = usePerspective()
  const documentVersions = useDocumentVersions({documentId: props.pane.options.id})

  const hasDocumentInPerspective = useMemo(
    () => documentVersions.data.some((v) => getVersionFromId(v) === selectedPerspectiveName),
    [documentVersions.data, selectedPerspectiveName],
  )

  return (
    <ConditionalWrapper
      condition={isCardinalityOnePerspective(selectedPerspective) && !hasDocumentInPerspective}
      wrapper={(children) => <DefaultPerspectiveWrapper>{children}</DefaultPerspectiveWrapper>}
    >
      {source.beta?.eventsAPI?.documents ? (
        <DocumentEventsPane {...props} />
      ) : (
        <DocumentPaneWithLegacyTimelineStore {...props} />
      )}
    </ConditionalWrapper>
  )
})
DocumentPaneProviderWrapper.displayName = 'Memo(DocumentPaneProviderWrapper)'
