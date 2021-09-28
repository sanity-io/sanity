import {BoundaryElementProvider, DialogProvider, Flex, useElementRect} from '@sanity/ui'
import {LegacyLayerProvider, useZIndex} from '@sanity/base/components'
import {ChangeConnectorRoot} from '@sanity/base/change-indicators'
import React, {useState} from 'react'
import styled from 'styled-components'
import {useDeskTool} from '../../contexts/deskTool'
import {PaneFooter} from '../../components/pane'
import {usePaneLayout} from '../../components/pane/usePaneLayout'
import {ChangesPanel} from './changesPanel'
import {useDocumentHistory} from './documentHistory'
import {DocumentPanel} from './documentPanel'
import {DocumentOperationResults} from './DocumentOperationResults'
import {InspectDialog} from './inspectDialog'
import {DocumentActionShortcuts} from './keyboardShortcuts'
import {DocumentStatusBar} from './statusBar'
import {useDocumentPane} from './useDocumentPane'
import {DocumentPaneProvider} from './DocumentPaneProvider'
import {DocumentPaneProviderProps} from './types'

const StyledChangeConnectorRoot = styled(ChangeConnectorRoot)`
  flex: 2;
  display: flex;
  direction: column;
  min-width: 0;
  height: 100%;
`

export function DocumentPane(props: DocumentPaneProviderProps) {
  return (
    <DocumentPaneProvider {...props}>
      <InnerDocumentPane />
    </DocumentPaneProvider>
  )
}

function InnerDocumentPane() {
  const {
    changesOpen,
    handleFocus,
    handleHistoryOpen,
    handleKeyUp,
    index,
    initialValue,
    inspectOpen,
    paneKey,
  } = useDocumentPane()
  const {features} = useDeskTool()
  const {collapsed: layoutCollapsed} = usePaneLayout()
  const {displayed} = useDocumentHistory()
  const zOffsets = useZIndex()
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const [footerElement, setFooterElement] = useState<HTMLDivElement | null>(null)
  const [actionsBoxElement, setActionsBoxElement] = useState<HTMLDivElement | null>(null)
  const footerRect = useElementRect(footerElement)

  return (
    <DocumentActionShortcuts
      actionsBoxElement={actionsBoxElement}
      data-index={index}
      data-pane-key={paneKey}
      data-ui="DocumentPane"
      flex={2.5}
      minWidth={changesOpen ? 640 : 320}
      onKeyUp={handleKeyUp}
      rootRef={setRootElement}
    >
      <DialogProvider position={['fixed', 'absolute']} zOffset={zOffsets.portal}>
        <Flex flex={1} height={layoutCollapsed ? undefined : 'fill'}>
          <StyledChangeConnectorRoot
            isReviewChangesOpen={changesOpen}
            onOpenReviewChanges={handleHistoryOpen}
            onSetFocus={handleFocus}
          >
            <DocumentPanel footerHeight={footerRect?.height || null} rootElement={rootElement} />
            {features.reviewChanges && changesOpen && (
              <BoundaryElementProvider element={rootElement}>
                <ChangesPanel />
              </BoundaryElementProvider>
            )}
          </StyledChangeConnectorRoot>
        </Flex>
      </DialogProvider>
      <PaneFooter ref={setFooterElement}>
        <DocumentStatusBar actionsBoxRef={setActionsBoxElement} />
      </PaneFooter>
      <DocumentOperationResults />
      <LegacyLayerProvider zOffset="fullscreen">
        {inspectOpen && <InspectDialog value={displayed || initialValue.value} />}
      </LegacyLayerProvider>
    </DocumentActionShortcuts>
  )
}
