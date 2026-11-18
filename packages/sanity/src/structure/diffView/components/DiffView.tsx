import {type ComponentType, useContext, useMemo, useState} from 'react'
import {type DocumentLayoutProps} from 'sanity'
import {ReferenceInputOptionsContext} from 'sanity/_singletons'

import {Dialog} from '../../../ui-components/dialog/Dialog'
import {useCreatePathSyncChannel} from '../hooks/useCreatePathSyncChannel'
import {useDiffViewRouter} from '../hooks/useDiffViewRouter'
import {useDiffViewState} from '../hooks/useDiffViewState'
import {useScrollMirror} from '../hooks/useScrollMirror'
import {VersionModeHeader} from '../versionMode/components/VersionModeHeader'
import {ComparisonChangesPanel} from './ComparisonChangesPanel'
import {DialogLayout} from './DialogLayout'
import {DiffViewPane} from './DiffViewPane'
import {EditReferenceLinkComponent} from './EditReferenceLinkComponent'
import {EmptyDiffViewPane} from './EmptyDiffViewPane'

export const DiffView: ComponentType<Pick<DocumentLayoutProps, 'documentId'>> = ({documentId}) => {
  const {documents, state, mode} = useDiffViewState()
  const {exitDiffView} = useDiffViewRouter()
  const syncChannel = useCreatePathSyncChannel()
  const [previousPaneElement, setPreviousPaneElement] = useState<HTMLElement | null>(null)
  const [nextPaneElement, setNextPaneElement] = useState<HTMLElement | null>(null)
  const referenceInputOptionsContext = useContext(ReferenceInputOptionsContext)
  const [changesPanelOpen, setChangesPanelOpen] = useState(false)

  const diffViewReferenceInputOptionsContext = useMemo(
    () => ({
      ...referenceInputOptionsContext,
      disableNew: true,
      EditReferenceLinkComponent,
    }),
    [referenceInputOptionsContext],
  )

  useScrollMirror([previousPaneElement, nextPaneElement])

  return (
    <ReferenceInputOptionsContext.Provider value={diffViewReferenceInputOptionsContext}>
      <Dialog
        id="diffView"
        width="auto"
        onClose={exitDiffView}
        padding={false}
        __unstable_hideCloseButton
      >
        <DialogLayout data-changes-panel={changesPanelOpen && documents?.next ? '' : undefined}>
          {mode === 'version' && (
            <VersionModeHeader
              documentId={documentId}
              state={state}
              changesPanelOpen={changesPanelOpen}
              onToggleChangesPanel={() => setChangesPanelOpen((open) => !open)}
            />
          )}
          {state === 'ready' && (
            <>
              <DiffViewPane
                documentType={documents.previous.type}
                documentId={documents.previous.id}
                role="previous"
                ref={setPreviousPaneElement}
                scrollElement={previousPaneElement}
                syncChannel={syncChannel}
                compareDocument={documents.previous}
              />
              {documents.next ? (
                <DiffViewPane
                  documentType={documents.next.type}
                  documentId={documents.next.id}
                  role="next"
                  ref={setNextPaneElement}
                  scrollElement={nextPaneElement}
                  syncChannel={syncChannel}
                  // The previous document's edit state is used to calculate the diff inroduced by the next document.
                  compareDocument={documents.previous}
                  onOpenReviewChanges={() => setChangesPanelOpen(true)}
                  isReviewChangesOpen={changesPanelOpen}
                />
              ) : (
                <EmptyDiffViewPane />
              )}
              {changesPanelOpen && documents.next ? (
                <ComparisonChangesPanel reference={documents.previous} comparing={documents.next} />
              ) : null}
            </>
          )}
        </DialogLayout>
      </Dialog>
    </ReferenceInputOptionsContext.Provider>
  )
}
