import * as PathUtils from '@sanity/util/paths'
import classNames from 'classnames'
import React, {useCallback} from 'react'
import {usePaneRouter} from '../../contexts/PaneRouterContext'
import {ChangesPanel} from './changesPanel'
import {useDocumentHistory} from './documentHistory'
import {DocumentPanel, getProductionPreviewItem} from './documentPanel'
import {InspectDialog} from './inspectDialog'
import {DocumentActionShortcuts, isInspectHotkey, isPreviewHotkey} from './keyboardShortcuts'
import {Doc, DocumentViewType, MenuAction, MenuItemGroup} from './types'

import styles from './documentPane.css'

interface DocumentPaneProps {
  connectionState: 'connecting' | 'connected' | 'reconnecting'
  documentId: string
  documentIdRaw: string
  documentType: string
  initialValue: Doc
  isClosable: boolean
  isCollapsed: boolean
  isSelected: boolean
  markers: any[]
  menuItemGroups: MenuItemGroup[]
  menuItems: MenuAction[]
  onChange: (patches: any[]) => void
  onExpand?: () => void
  onCollapse?: () => void
  paneKey: string
  schemaType: any
  title?: string
  type: any
  views: DocumentViewType[]
  value: Doc | null
}

// eslint-disable-next-line complexity
export function DocumentPane(props: DocumentPaneProps) {
  const {
    connectionState,
    documentId,
    documentIdRaw,
    documentType,
    initialValue,
    isSelected,
    isCollapsed,
    isClosable,
    markers,
    menuItemGroups = [],
    onChange,
    onCollapse,
    onExpand,
    paneKey,
    title: paneTitle,
    schemaType,
    value,
    views = []
  } = props
  const {startTime} = useDocumentHistory()
  const [showValidationTooltip, setShowValidationTooltip] = React.useState<boolean>(false)
  const paneRouter = usePaneRouter()
  const activeViewId = paneRouter.params.view || (views[0] && views[0].id)
  const initialFocusPath = paneRouter.params.path
    ? PathUtils.fromString(paneRouter.params.path)
    : []
  const isInspectOpen = paneRouter.params.inspect === 'on'
  const isHistoryOpen = Boolean(startTime)

  const handleKeyUp = useCallback((event: any) => {
    if (event.key === 'Escape' && showValidationTooltip) {
      setShowValidationTooltip(false)
    }

    if (isInspectHotkey(event)) {
      toggleInspect()
    }

    if (isPreviewHotkey(event)) {
      const item = getProductionPreviewItem({
        value,
        rev: null
      })

      if (item && item.url) {
        window.open(item.url)
      }
    }
  }, [])

  const toggleInspect = useCallback(
    (toggle = !isInspectOpen) => {
      const {inspect: oldInspect, ...params} = paneRouter.params
      if (toggle) {
        paneRouter.setParams({inspect: 'on', ...params})
      } else {
        paneRouter.setParams(params)
      }
    },
    [paneRouter]
  )

  const handleInspectClose = useCallback(() => {
    toggleInspect(false)
  }, [toggleInspect])

  const handleSetActiveView = useCallback((id: string | null) => paneRouter.setView(id as any), [
    paneRouter
  ])

  const handleClosePane = useCallback(() => paneRouter.closeCurrent(), [paneRouter])

  const handleSplitPane = useCallback(() => {
    paneRouter.duplicateCurrent()
  }, [paneRouter])

  return (
    <DocumentActionShortcuts
      id={documentIdRaw}
      type={documentType}
      onKeyUp={handleKeyUp}
      className={classNames([
        styles.root,
        isCollapsed && styles.isCollapsed,
        isSelected ? styles.isActive : styles.isDisabled
      ])}
    >
      <div className={styles.documentContainer}>
        {isInspectOpen && <InspectDialog value={value} onClose={handleInspectClose} />}

        <DocumentPanel
          activeViewId={activeViewId}
          connectionState={connectionState}
          documentId={documentId}
          documentType={documentType}
          idPrefix={paneKey}
          initialFocusPath={initialFocusPath}
          initialValue={initialValue}
          isClosable={isClosable}
          isCollapsed={isCollapsed}
          isHistoryOpen={isHistoryOpen}
          markers={markers}
          menuItemGroups={menuItemGroups}
          onChange={onChange}
          onCloseView={handleClosePane}
          onCollapse={onCollapse}
          onExpand={onExpand}
          onSetActiveView={handleSetActiveView}
          onSplitPane={handleSplitPane}
          paneTitle={paneTitle}
          schemaType={schemaType}
          toggleInspect={toggleInspect}
          value={value}
          views={views}
        />
      </div>

      {!isCollapsed && isHistoryOpen && (
        <div className={styles.changesContainer}>
          <ChangesPanel documentId={documentId} schemaType={schemaType} />
        </div>
      )}
    </DocumentActionShortcuts>
  )
}
