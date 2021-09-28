// import {MenuItem} from '@sanity/base/__legacy/@sanity/components'
import {BoundaryElementProvider, Flex, PortalProvider, usePortal, useElementRect} from '@sanity/ui'
import React, {createElement, useMemo, useRef, useState} from 'react'
// import {Path} from '@sanity/types'
import {ScrollContainer} from '@sanity/base/components'
import styled, {css} from 'styled-components'
import {useDocumentHistory} from '../documentHistory'
import {PaneContent} from '../../../components/pane'
import {usePaneLayout} from '../../../components/pane/usePaneLayout'
import {useDeskTool} from '../../../contexts/deskTool'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentHeaderTitle, DocumentPanelHeader} from './header'
import {FormView} from './documentViews'
import {PermissionCheckBanner} from './PermissionCheckBanner'

interface DocumentPanelProps {
  footerHeight: number | null
  // isClosable: boolean
  // isHistoryOpen: boolean
  // onChange: (patches: any[]) => void
  // onCloseView: () => void
  // onMenuAction: (item: MenuItem) => void
  // onSplitPane: () => void
  // paneTitle?: string
  rootElement: HTMLDivElement | null
}

const Scroller = styled(ScrollContainer)<{$disabled?: boolean}>(({$disabled}) => {
  if ($disabled) {
    return {height: '100%'}
  }

  return css`
    height: 100%;
    overflow: auto;
    position: relative;
    scroll-behavior: smooth;
    outline: none;
  `
})

export function DocumentPanel(props: DocumentPanelProps) {
  const {footerHeight, rootElement} = props
  const {
    activeViewId,
    compareValue,
    documentId,
    documentSchema,
    editState,
    focusPath,
    handleChange,
    handleFocus,
    initialValue,
    markers,
    permission,
    value,
    views,
  } = useDocumentPane()
  const {collapsed: layoutCollapsed} = usePaneLayout()
  const parentPortal = usePortal()
  const {features} = useDeskTool()
  const [headerElement, setHeaderElement] = useState<HTMLDivElement | null>(null)
  const headerRect = useElementRect(headerElement)
  const portalRef = useRef<HTMLDivElement | null>(null)
  const [
    documentViewerContainerElement,
    setDocumentViewerContainerElement,
  ] = useState<HTMLDivElement | null>(null)
  const {displayed, historyController} = useDocumentHistory()
  const {revTime: rev} = historyController
  const activeView = useMemo(
    () => views.find((view) => view.id === activeViewId) || views[0] || {type: 'form'},
    [activeViewId, views]
  )

  // Use a local portal container when split panes is supported
  const portalElement: HTMLElement | null = features.splitPanes
    ? portalRef.current || parentPortal.element
    : parentPortal.element

  // Calculate the height of the header
  const margins: [number, number, number, number] = useMemo(() => {
    if (layoutCollapsed) {
      return [headerRect?.height || 0, 0, footerHeight ? footerHeight + 2 : 2, 0]
    }

    return [0, 0, 2, 0]
  }, [layoutCollapsed, footerHeight, headerRect])

  return (
    <Flex direction="column" flex={2} overflow={layoutCollapsed ? undefined : 'hidden'}>
      <DocumentPanelHeader
        rootElement={rootElement}
        title={<DocumentHeaderTitle />}
        ref={setHeaderElement}
      />

      <PaneContent>
        <PortalProvider element={portalElement}>
          <BoundaryElementProvider element={documentViewerContainerElement}>
            {activeView.type === 'form' && <PermissionCheckBanner />}

            <Scroller
              $disabled={layoutCollapsed}
              data-ui="Scroller"
              ref={setDocumentViewerContainerElement}
            >
              {activeView.type === 'form' && (
                <FormView
                  id={documentId}
                  initialValue={initialValue.value}
                  focusPath={focusPath}
                  onFocus={handleFocus}
                  markers={markers}
                  onChange={handleChange}
                  readOnly={rev !== null || !permission.granted}
                  schemaType={documentSchema}
                  value={displayed}
                  margins={margins}
                  compareValue={compareValue}
                />
              )}

              {activeView.type === 'component' &&
                createElement(activeView.component, {
                  document: {
                    draft: editState?.draft || null,
                    displayed: displayed || value || initialValue,
                    historical: displayed,
                    published: editState?.published || null,
                  },
                  documentId,
                  options: activeView.options,
                  schemaType: documentSchema,
                })}
            </Scroller>

            <div data-testid="document-panel-portal" ref={portalRef} />
          </BoundaryElementProvider>
        </PortalProvider>
      </PaneContent>
    </Flex>
  )
}
