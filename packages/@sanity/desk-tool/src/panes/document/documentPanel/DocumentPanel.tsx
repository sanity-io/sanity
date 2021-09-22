import {MenuItem, MenuItemGroup} from '@sanity/base/__legacy/@sanity/components'
import {BoundaryElementProvider, Flex, PortalProvider, usePortal, useElementRect} from '@sanity/ui'
import React, {createElement, useMemo, useRef, useState} from 'react'
import {Marker, Path, SanityDocument} from '@sanity/types'
import {ScrollContainer} from '@sanity/base/components'
import {
  unstable_useCheckDocumentPermission as useCheckDocumentPermission,
  useCurrentUser,
} from '@sanity/base/hooks'
import styled, {css} from 'styled-components'
import {useDocumentHistory} from '../documentHistory'
import {DocumentView} from '../types'
import {PaneContent} from '../../../components/pane'
import {usePaneLayout} from '../../../components/pane/usePaneLayout'
import {useDeskTool} from '../../../contexts/deskTool'
import {DocumentHeaderTitle, DocumentPanelHeader} from './header'
import {FormView} from './documentViews'
import {PermissionCheckBanner} from './PermissionCheckBanner'

interface DocumentPanelProps {
  activeViewId: string
  documentId: string
  documentType: string
  draft: SanityDocument | null
  footerHeight: number | null
  idPrefix: string
  initialValue: Partial<SanityDocument>
  isClosable: boolean
  isHistoryOpen: boolean
  markers: Marker[]
  menuItems: MenuItem[]
  menuItemGroups: MenuItemGroup[]
  onChange: (patches: any[]) => void
  formInputFocusPath: Path
  onFormInputFocus: (focusPath: Path) => void
  onCloseView: () => void
  onMenuAction: (item: MenuItem) => void
  onSplitPane: () => void
  paneTitle?: string
  published: SanityDocument | null
  rootElement: HTMLDivElement | null
  schemaType: any
  value: Partial<SanityDocument> | null
  compareValue: SanityDocument | null
  views: DocumentView[]
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
  const {
    activeViewId,
    documentId,
    documentType,
    draft,
    footerHeight,
    formInputFocusPath,
    idPrefix,
    initialValue,
    isClosable,
    isHistoryOpen,
    markers,
    menuItems,
    menuItemGroups,
    onChange,
    onFormInputFocus,
    onCloseView,
    onMenuAction,
    onSplitPane,
    paneTitle,
    published,
    rootElement,
    schemaType,
    value,
    compareValue,
    views,
  } = props
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
  const activeView = useMemo(
    () => views.find((view) => view.id === activeViewId) || views[0] || {type: 'form'},
    [activeViewId, views]
  )
  const {revTime} = historyController

  const {value: currentUser} = useCurrentUser()

  const requiredPermission = value?._createdAt ? 'update' : 'create'

  const permission = useCheckDocumentPermission(documentId, documentType, requiredPermission)

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
        activeViewId={activeViewId}
        idPrefix={idPrefix}
        isClosable={isClosable}
        markers={markers}
        menuItemGroups={menuItemGroups}
        menuItems={menuItems}
        onCloseView={onCloseView}
        onContextMenuAction={onMenuAction}
        onSplitPane={onSplitPane}
        rootElement={rootElement}
        schemaType={schemaType}
        onSetFormInputFocus={onFormInputFocus}
        title={
          <DocumentHeaderTitle documentType={documentType} paneTitle={paneTitle} value={value} />
        }
        views={views}
        ref={setHeaderElement}
        rev={revTime}
        isHistoryOpen={isHistoryOpen}
      />

      <PaneContent>
        <PortalProvider element={portalElement}>
          <BoundaryElementProvider element={documentViewerContainerElement}>
            {activeView.type === 'form' && (
              <PermissionCheckBanner
                permission={permission}
                requiredPermission={requiredPermission}
                currentUser={currentUser}
              />
            )}

            <Scroller
              $disabled={layoutCollapsed}
              data-ui="Scroller"
              ref={setDocumentViewerContainerElement}
            >
              {activeView.type === 'form' && (
                <FormView
                  id={documentId}
                  initialValue={initialValue}
                  focusPath={formInputFocusPath}
                  onFocus={onFormInputFocus}
                  markers={markers}
                  onChange={onChange}
                  readOnly={revTime !== null || !permission.granted}
                  schemaType={schemaType}
                  value={displayed}
                  margins={margins}
                  compareValue={compareValue}
                />
              )}

              {activeView.type === 'component' &&
                createElement(activeView.component, {
                  document: {
                    draft: draft,
                    displayed: displayed || value || initialValue,
                    historical: displayed,
                    published: published,
                  },
                  documentId,
                  options: activeView.options,
                  schemaType,
                })}
            </Scroller>

            <div ref={portalRef} />
          </BoundaryElementProvider>
        </PortalProvider>
      </PaneContent>
    </Flex>
  )
}
