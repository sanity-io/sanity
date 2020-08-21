import Snackbar from 'part:@sanity/components/snackbar/default'
import React, {createElement, useCallback, useMemo, useRef} from 'react'
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
  presence?: any
  onChange: (patches: any[]) => void
  onCloseView: () => void
  onSetActiveView: (id: string | null) => void
  onSplitPane: () => void
  paneTitle?: string
  schemaType: any
  toggleInspect: (val: boolean) => void
  value: any
  views: DocumentView[]
}

export function DocumentPanel(props: DocumentPanelProps) {
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

  return (
    <div className={styles.root}>
      <div className={styles.headerContainer}>
        <DocumentPanelHeader
          activeViewId={props.activeViewId}
          idPrefix={props.idPrefix}
          isClosable={props.isClosable}
          isCollapsed={props.isCollapsed}
          menuItemGroups={props.menuItemGroups}
          menuItems={menuItems}
          onCloseView={props.onCloseView}
          onContextMenuAction={handleContextMenuAction}
          onSetActiveView={props.onSetActiveView}
          onSplitPane={props.onSplitPane}
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

      <div className={styles.documentViewerContainer}>
        {activeView.type === 'form' && (
          <FormView
            id={props.documentId}
            initialFocusPath={props.initialFocusPath}
            initialValue={props.initialValue}
            markers={props.markers}
            onChange={props.onChange}
            presence={props.presence}
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
