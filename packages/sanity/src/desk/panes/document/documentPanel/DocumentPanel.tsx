import {BoundaryElementProvider, Flex, PortalProvider, usePortal, useElementRect} from '@sanity/ui'
import React, {createElement, useEffect, useMemo, useRef, useState} from 'react'
import styled, {css} from 'styled-components'
import {PaneContent, usePaneLayout} from '../../../components'
import {useDocumentPane} from '../useDocumentPane'
import {InspectDialog} from '../inspectDialog'
import {useDeskTool} from '../../../useDeskTool'
import {ReferenceChangedBanner} from './ReferenceChangedBanner'
import {PermissionCheckBanner} from './PermissionCheckBanner'
import {FormView} from './documentViews'
import {DocumentPanelHeader} from './header'
import {ScrollContainer} from 'sanity'

interface DocumentPanelProps {
  footerHeight: number | null
  rootElement: HTMLDivElement | null
  isInspectOpen: boolean
  setDocumentPanelPortalElement: (el: HTMLElement | null) => void
}

const Scroller = styled(ScrollContainer)<{$disabled: boolean}>(({$disabled}) => {
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

export const DocumentPanel = function DocumentPanel(props: DocumentPanelProps) {
  const {footerHeight, isInspectOpen, rootElement, setDocumentPanelPortalElement} = props
  const {
    activeViewId,
    displayed,
    documentId,
    editState,
    value,
    views,
    ready,
    schemaType,
    permissions,
    isPermissionsLoading,
  } = useDocumentPane()
  const {collapsed: layoutCollapsed} = usePaneLayout()
  const parentPortal = usePortal()
  const {features} = useDeskTool()
  const [headerElement, setHeaderElement] = useState<HTMLDivElement | null>(null)
  const headerRect = useElementRect(headerElement)
  const portalRef = useRef<HTMLDivElement | null>(null)
  const [documentScrollElement, setDocumentScrollElement] = useState<HTMLDivElement | null>(null)

  const requiredPermission = value._createdAt ? 'update' : 'create'

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

  const formViewHidden = activeView.type !== 'form'

  const activeViewNode = useMemo(
    () =>
      activeView.type === 'component' &&
      activeView.component &&
      createElement(activeView.component, {
        document: {
          draft: editState?.draft || null,
          displayed: displayed || value,
          historical: displayed,
          published: editState?.published || null,
        },
        documentId,
        options: activeView.options,
        schemaType,
      }),
    [activeView, displayed, documentId, editState?.draft, editState?.published, schemaType, value]
  )

  // Scroll to top as `documentId` changes
  useEffect(() => {
    if (!documentScrollElement?.scrollTo) return
    documentScrollElement.scrollTo(0, 0)
  }, [documentId, documentScrollElement])

  // Pass portal element to `DocumentPane`
  useEffect(() => {
    if (portalElement) {
      setDocumentPanelPortalElement(portalElement)
    }
  }, [portalElement, setDocumentPanelPortalElement])

  const inspectDialog = useMemo(() => {
    return isInspectOpen ? <InspectDialog value={displayed || value} /> : null
  }, [isInspectOpen, displayed, value])

  return (
    <Flex direction="column" flex={2} overflow={layoutCollapsed ? undefined : 'hidden'}>
      <DocumentPanelHeader rootElement={rootElement} ref={setHeaderElement} />

      <PaneContent>
        <PortalProvider
          element={portalElement}
          __unstable_elements={{documentScrollElement: documentScrollElement}}
        >
          <BoundaryElementProvider element={documentScrollElement}>
            {activeView.type === 'form' && !isPermissionsLoading && ready && (
              <>
                <PermissionCheckBanner
                  granted={Boolean(permissions?.granted)}
                  requiredPermission={requiredPermission}
                />
                <ReferenceChangedBanner />
              </>
            )}

            <Scroller
              $disabled={layoutCollapsed || false}
              data-testid="document-panel-scroller"
              ref={setDocumentScrollElement}
            >
              <FormView
                hidden={formViewHidden}
                key={documentId + (ready ? '_ready' : '_pending')}
                margins={margins}
              />
              {activeViewNode}
            </Scroller>

            {inspectDialog}

            <div data-testid="document-panel-portal" ref={portalRef} />
          </BoundaryElementProvider>
        </PortalProvider>
      </PaneContent>
    </Flex>
  )
}
