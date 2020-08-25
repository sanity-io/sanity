import classNames from 'classnames'
import {PortalProvider} from 'part:@sanity/components/portal'
import Snackbar from 'part:@sanity/components/snackbar/default'
import React, {createElement, useCallback, useEffect, useMemo, useRef} from 'react'
import {useDocumentHistory} from '../documentHistory'
import {Doc, DocumentView, MenuItemGroup} from '../types'
import {DocumentOperationResults} from './documentOperationResults'
import {DocumentHeaderTitle} from './header/title'
import {DocumentPanelHeader} from './header/header'
import {getMenuItems} from './menuItems'
import {FormView} from './views'
import {DocumentStatusBar} from './statusBar'

import styles from './documentPanel.css'

interface DocumentPanelProps {
  activeViewId: string
  connectionState: string
  documentId: string
  documentType: string
  idPrefix: string
  initialFocusPath: any[]
  initialValue: Doc
  isClosable: boolean
  isCollapsed: boolean
  isHistoryOpen: boolean
  markers: any
  menuItemGroups: MenuItemGroup[]
  onChange: (patches: any[]) => void
  onCloseView: () => void
  onCollapse?: () => void
  onExpand?: () => void
  onSetActiveView: (id: string | null) => void
  onSplitPane: () => void
  paneTitle?: string
  schemaType: any
  toggleInspect: (val: boolean) => void
  value: any
  views: DocumentView[]
}

export function DocumentPanel(props: DocumentPanelProps) {
  const portalContainerRef = useRef<HTMLDivElement | null>(null)
  const portalRef = useRef(document.createElement('div'))
  const {displayed, historyDisplayed, startTime, toggleHistory} = useDocumentHistory()
  const {toggleInspect} = props
  const formRef = useRef<any>()
  const activeView = props.views.find(view => view.id === props.activeViewId) ||
    props.views[0] || {type: 'form'}

  const menuItems = useMemo(() => {
    return (
      getMenuItems({
        canShowHistoryList: true,
        isHistoryEnabled: true,
        isHistoryOpen: props.isHistoryOpen,
        isLiveEditEnabled: props.schemaType.liveEdit === true,
        rev: startTime ? startTime.chunk.id : null,
        value: props.value
      }) || []
    )
  }, [props.isHistoryOpen, props.schemaType, startTime, props.value])

  const handleContextMenuAction = useCallback(
    item => {
      if (item.action === 'production-preview') {
        window.open(item.url)
        return true
      }

      if (item.action === 'inspect') {
        toggleInspect(true)
        return true
      }

      if (item.action === 'browseHistory') {
        toggleHistory('-')
        return true
      }

      return false
    },
    [toggleHistory, toggleInspect]
  )

  const setFocusPath = useCallback(
    (path: any) => {
      if (formRef.current) {
        formRef.current.handleFocus(path)
      }
    },
    [formRef.current]
  )

  useEffect(() => {
    if (portalContainerRef.current) {
      portalContainerRef.current.appendChild(portalRef.current)
    }

    return () => {
      if (portalContainerRef.current) {
        portalContainerRef.current.removeChild(portalRef.current)
      }
    }
  }, [])

  return (
    <div className={classNames(styles.root, props.isCollapsed && styles.isCollapsed)}>
      <div className={styles.headerContainer}>
        <DocumentPanelHeader
          activeViewId={props.activeViewId}
          idPrefix={props.idPrefix}
          isClosable={props.isClosable}
          isCollapsed={props.isCollapsed}
          markers={props.markers}
          menuItemGroups={props.menuItemGroups}
          menuItems={menuItems}
          onCloseView={props.onCloseView}
          onCollapse={props.onCollapse}
          onContextMenuAction={handleContextMenuAction}
          onExpand={props.onExpand}
          onSetActiveView={props.onSetActiveView}
          onSplitPane={props.onSplitPane}
          schemaType={props.schemaType}
          setFocusPath={setFocusPath}
          title={
            <DocumentHeaderTitle
              documentType={props.documentType}
              paneTitle={props.paneTitle}
              value={props.value}
            />
          }
          views={props.views}
        />
      </div>

      <PortalProvider element={portalRef.current}>
        <div className={styles.documentViewerContainer}>
          <div className={styles.documentScroller}>
            {activeView.type === 'form' && (
              <FormView
                id={props.documentId}
                initialFocusPath={props.initialFocusPath}
                initialValue={props.initialValue}
                markers={props.markers}
                onChange={props.onChange}
                readOnly={historyDisplayed === 'from'}
                ref={formRef}
                schemaType={props.schemaType}
                value={displayed}
              />
            )}

            {activeView.type === 'component' &&
              createElement(activeView.component, {
                documentId: props.documentId,
                options: activeView.options,
                schemaType: props.schemaType
              })}
          </div>

          <div data-portal-container ref={portalContainerRef} />
        </div>
      </PortalProvider>

      <div className={styles.footerContainer}>
        <DocumentStatusBar
          id={props.documentId}
          type={props.documentType}
          lastUpdated={props.value && props.value._updatedAt}
        />
      </div>

      {props.connectionState === 'reconnecting' && (
        <Snackbar kind="warning" isPersisted title="Connection lost. Reconnecting…" />
      )}

      <DocumentOperationResults id={props.documentId} type={props.documentType} />
    </div>
  )
}

DocumentPanel.defaultProps = {
  paneTitle: undefined
}
