import {type ComponentType, useState} from 'react'

import {Dialog} from '../../../ui-components/dialog/Dialog'
import {type DocumentLayoutProps} from '../../config/types'
import {useCreatePathSyncChannel} from '../hooks/useCreatePathSyncChannel'
import {useDiffViewRouter} from '../hooks/useDiffViewRouter'
import {useDiffViewState} from '../hooks/useDiffViewState'
import {useScrollMirror} from '../hooks/useScrollMirror'
import {VersionModeHeader} from '../versionMode/components/VersionModeHeader'
import {DialogLayout} from './DialogLayout'
import {DiffViewPane} from './DiffViewPane'

export const DiffView: ComponentType<Pick<DocumentLayoutProps, 'documentId'>> = ({documentId}) => {
  const {documents, state, mode} = useDiffViewState()
  const {exitDiffView} = useDiffViewRouter()
  const syncChannel = useCreatePathSyncChannel()
  const [previousPaneElement, setPreviousPaneElement] = useState<HTMLElement | null>(null)
  const [nextPaneElement, setNextPaneElement] = useState<HTMLElement | null>(null)

  useScrollMirror([previousPaneElement, nextPaneElement])

  return (
    <Dialog
      id="diffView"
      width="auto"
      onClose={exitDiffView}
      padding={false}
      __unstable_hideCloseButton
    >
      <DialogLayout>
        {mode === 'version' && <VersionModeHeader documentId={documentId} state={state} />}
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
            <DiffViewPane
              documentType={documents.next.type}
              documentId={documents.next.id}
              role="next"
              ref={setNextPaneElement}
              scrollElement={nextPaneElement}
              syncChannel={syncChannel}
              // The previous document's edit state is used to calculate the diff inroduced by the next document.
              compareDocument={documents.previous}
            />
          </>
        )}
      </DialogLayout>
    </Dialog>
  )
}
