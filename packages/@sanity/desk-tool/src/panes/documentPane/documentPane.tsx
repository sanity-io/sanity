import {MenuItemGroup} from '@sanity/base/__legacy/@sanity/components'
import {Layer} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import classNames from 'classnames'
import Snackbar from 'part:@sanity/components/snackbar/default'
import React, {useCallback, useRef, useState} from 'react'
import {Path} from '@sanity/types'
import {ChangeConnectorRoot} from '@sanity/base/lib/change-indicators/overlay/ChangeConnectorRoot'
import {setLocation} from 'part:@sanity/base/datastore/presence'
import {useZIndex} from '@sanity/base/components'
import {usePaneRouter} from '../../contexts/PaneRouterContext'
import {useDeskToolFeatures} from '../../features'
import {ChangesPanel} from './changesPanel'
import {useDocumentHistory} from './documentHistory'
import {DocumentPanel, getProductionPreviewItem} from './documentPanel'
import {DocumentOperationResults} from './documentOperationResults'
import {InspectDialog} from './inspectDialog'
import {DocumentActionShortcuts, isInspectHotkey, isPreviewHotkey} from './keyboardShortcuts'
import {DocumentStatusBar} from './statusBar'
import {TimelinePopover} from './timeline'
import {Doc, DocumentViewType} from './types'

import styles from './documentPane.css'

interface DocumentPaneProps {
  connectionState: 'connecting' | 'connected' | 'reconnecting'
  documentId: string
  documentIdRaw: string
  documentType: string
  draft: Doc | null
  initialValue: Doc
  isClosable: boolean
  isCollapsed: boolean
  isSelected: boolean
  markers: any[]
  menuItemGroups: MenuItemGroup[]
  onChange: (patches: any[]) => void
  onExpand?: () => void
  onCollapse?: () => void
  paneKey: string
  published: Doc | null
  schemaType: any
  title?: string
  views: DocumentViewType[]
  value: Doc | null
  compareValue: Doc | null
}

// eslint-disable-next-line complexity
export function DocumentPane(props: DocumentPaneProps) {
  const {
    connectionState,
    documentId,
    documentIdRaw,
    documentType,
    draft,
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
    published,
    title: paneTitle,
    schemaType,
    value,
    compareValue,
    views = [],
  } = props
  const zindex = useZIndex()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const features = useDeskToolFeatures()
  const {historyController, setTimelineMode, timelineMode, open} = useDocumentHistory()
  const historyState = historyController.selectionState
  const [showValidationTooltip, setShowValidationTooltip] = useState<boolean>(false)
  const paneRouter = usePaneRouter()
  const activeViewId = paneRouter.params.view || (views[0] && views[0].id)
  const [formInputFocusPath, setFocusPath] = React.useState<Path>(() =>
    paneRouter.params.path ? PathUtils.fromString(paneRouter.params.path) : []
  )
  const isInspectOpen = paneRouter.params.inspect === 'on'

  const handleFocus = useCallback(
    (nextFocusPath: Path) => {
      setFocusPath(nextFocusPath)
      setLocation([
        {
          type: 'document',
          documentId,
          path: nextFocusPath,
          lastActiveAt: new Date().toISOString(),
        },
      ])
    },
    [documentId]
  )

  const toggleInspect = useCallback(
    (toggle = !isInspectOpen) => {
      const {inspect: oldInspect, ...params} = paneRouter.params
      if (toggle) {
        paneRouter.setParams({inspect: 'on', ...params})
      } else {
        paneRouter.setParams(params)
      }
    },
    [isInspectOpen, paneRouter]
  )

  const handleKeyUp = useCallback(
    (event: any) => {
      if (event.key === 'Escape' && showValidationTooltip) {
        setShowValidationTooltip(false)
      }

      if (isInspectHotkey(event)) {
        toggleInspect()
      }

      if (isPreviewHotkey(event)) {
        const item = getProductionPreviewItem({
          features,
          value,
          rev: null,
        })

        if (item && item.url) {
          window.open(item.url)
        }
      }
    },
    [features, showValidationTooltip, toggleInspect, value]
  )

  const handleInspectClose = useCallback(() => toggleInspect(false), [toggleInspect])

  const handleSetActiveView = useCallback((id: string | null) => paneRouter.setView(id as any), [
    paneRouter,
  ])

  const handleClosePane = useCallback(() => paneRouter.closeCurrent(), [paneRouter])

  const handleSplitPane = useCallback(() => paneRouter.duplicateCurrent(), [paneRouter])

  const changesSinceSelectRef = useRef<HTMLDivElement | null>(null)
  const versionSelectRef = useRef<HTMLDivElement | null>(null)

  const handleTimelineClose = useCallback(() => {
    setTimelineMode('closed')
  }, [setTimelineMode])

  const handleTimelineSince = useCallback(() => {
    setTimelineMode(timelineMode === 'since' ? 'closed' : 'since')
  }, [timelineMode, setTimelineMode])

  const handleTimelineRev = useCallback(() => {
    setTimelineMode(timelineMode === 'rev' ? 'closed' : 'rev')
  }, [timelineMode, setTimelineMode])

  const isChangesOpen = historyController.changesPanelActive()
  const isTimelineOpen = timelineMode !== 'closed'

  return (
    <DocumentActionShortcuts
      id={documentIdRaw}
      type={documentType}
      onKeyUp={handleKeyUp}
      className={classNames([
        styles.root,
        isCollapsed && styles.isCollapsed,
        isSelected ? styles.isActive : styles.isDisabled,
      ])}
      rootRef={rootRef}
    >
      <ChangeConnectorRoot
        onSetFocus={handleFocus}
        onOpenReviewChanges={open}
        isReviewChangesOpen={isChangesOpen}
        className={styles.documentAndChangesContainer}
      >
        <div className={styles.documentContainer}>
          {isInspectOpen && (
            <InspectDialog idPrefix={paneKey} onClose={handleInspectClose} value={value as any} />
          )}

          <DocumentPanel
            activeViewId={activeViewId}
            documentId={documentId}
            documentType={documentType}
            draft={draft}
            idPrefix={paneKey}
            formInputFocusPath={formInputFocusPath}
            onFormInputFocus={handleFocus}
            initialValue={initialValue}
            isClosable={isClosable}
            isCollapsed={isCollapsed}
            isHistoryOpen={isChangesOpen}
            isTimelineOpen={isTimelineOpen}
            markers={markers}
            menuItemGroups={menuItemGroups}
            onChange={onChange}
            onCloseView={handleClosePane}
            onCollapse={onCollapse}
            onExpand={onExpand}
            onSetActiveView={handleSetActiveView}
            onSplitPane={handleSplitPane}
            onTimelineOpen={handleTimelineRev}
            paneTitle={paneTitle}
            published={published}
            rootElement={rootRef.current}
            schemaType={schemaType}
            timelineMode={timelineMode}
            toggleInspect={toggleInspect}
            value={value}
            compareValue={isChangesOpen ? historyController.sinceAttributes() : compareValue}
            versionSelectRef={versionSelectRef}
            views={views}
          />
        </div>

        {features.reviewChanges && !isCollapsed && isChangesOpen && (
          <div className={styles.changesContainer}>
            <ChangesPanel
              changesSinceSelectRef={changesSinceSelectRef}
              documentId={documentId}
              isTimelineOpen={isTimelineOpen}
              loading={historyState === 'loading'}
              onTimelineOpen={handleTimelineSince}
              schemaType={schemaType}
              since={historyController.sinceTime}
              timelineMode={timelineMode}
            />
          </div>
        )}
      </ChangeConnectorRoot>

      <Layer className={styles.footerContainer} zOffset={zindex.pane}>
        <DocumentStatusBar
          id={documentId}
          type={documentType}
          lastUpdated={value && value._updatedAt}
        />
      </Layer>

      {connectionState === 'reconnecting' && (
        <Snackbar kind="warning" isPersisted title="Connection lost. Reconnecting…" />
      )}

      <DocumentOperationResults id={documentId} type={documentType} />

      <TimelinePopover
        onClose={handleTimelineClose}
        open={isTimelineOpen}
        placement="bottom"
        targetElement={
          timelineMode === 'rev' ? versionSelectRef.current : changesSinceSelectRef.current
        }
      />
    </DocumentActionShortcuts>
  )
}
