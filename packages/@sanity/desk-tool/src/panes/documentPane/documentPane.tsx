import {Chunk} from '@sanity/field/diff'
import * as PathUtils from '@sanity/util/paths'
import classNames from 'classnames'
import {ClickOutside} from 'part:@sanity/components/click-outside'
import {MenuItemGroupType} from 'part:@sanity/components/menus/default'
import {Popover} from 'part:@sanity/components/popover'
import Snackbar from 'part:@sanity/components/snackbar/default'
import React, {useCallback, useRef, useState} from 'react'
import {usePaneRouter} from '../../contexts/PaneRouterContext'
import {useDeskToolFeatures} from '../../features'
import {ChangesPanel} from './changesPanel'
import {useDocumentHistory} from './documentHistory'
import {DocumentPanel, getProductionPreviewItem} from './documentPanel'
import {DocumentOperationResults} from './documentOperationResults'
import {InspectDialog} from './inspectDialog'
import {DocumentActionShortcuts, isInspectHotkey, isPreviewHotkey} from './keyboardShortcuts'
import {DocumentStatusBar} from './statusBar'
import {Timeline, sinceTimelineProps, revTimelineProps} from './timeline'
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
  menuItemGroups: MenuItemGroupType[]
  onChange: (patches: any[]) => void
  onExpand?: () => void
  onCollapse?: () => void
  paneKey: string
  published: Doc | null
  schemaType: any
  title?: string
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
    views = []
  } = props

  const features = useDeskToolFeatures()
  const {setRange, timeline, historyController} = useDocumentHistory()
  const historyState = historyController.selectionState
  const [showValidationTooltip, setShowValidationTooltip] = useState<boolean>(false)
  const paneRouter = usePaneRouter()
  const [timelineMode, setTimelineMode] = useState<'since' | 'rev' | 'closed'>('closed')
  const activeViewId = paneRouter.params.view || (views[0] && views[0].id)
  const initialFocusPath = paneRouter.params.path
    ? PathUtils.fromString(paneRouter.params.path)
    : []
  const isInspectOpen = paneRouter.params.inspect === 'on'

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
          rev: null
        })

        if (item && item.url) {
          window.open(item.url)
        }
      }
    },
    [features]
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

  const changesSinceSelectRef = useRef<HTMLDivElement | null>(null)
  const versionSelectRef = useRef<HTMLDivElement | null>(null)

  const selectRev = useCallback(
    (revChunk: Chunk) => {
      const [sinceId, revId] = historyController.findRangeForNewRev(revChunk)
      setTimelineMode('closed')
      setRange(sinceId, revId)
    },
    [historyController, setRange, setTimelineMode]
  )

  const selectSince = useCallback(
    (sinceChunk: Chunk) => {
      const [sinceId, revId] = historyController.findRangeForNewSince(sinceChunk)
      setTimelineMode('closed')
      setRange(sinceId, revId)
    },
    [historyController, setRange, setTimelineMode]
  )

  const loadMoreHistory = useCallback((state: boolean) => {
    historyController.setLoadMore(state)
  }, [])

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

  const popoverContent = (
    <ClickOutside onClickOutside={handleTimelineClose}>
      {ref =>
        timelineMode === 'rev' ? (
          <Timeline
            ref={ref as any}
            timeline={timeline}
            onSelect={selectRev}
            onLoadMore={loadMoreHistory}
            {...revTimelineProps(historyController.realRevChunk)}
          />
        ) : (
          <Timeline
            ref={ref as any}
            timeline={timeline}
            onSelect={selectSince}
            onLoadMore={loadMoreHistory}
            {...sinceTimelineProps(historyController.sinceTime!, historyController.realRevChunk)}
          />
        )
      }
    </ClickOutside>
  )

  return (
    <Popover
      content={popoverContent as any}
      open={isTimelineOpen}
      placement="bottom"
      targetElement={
        timelineMode === 'rev' ? versionSelectRef.current : changesSinceSelectRef.current
      }
    >
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
        <div className={styles.documentAndChangesContainer}>
          <div className={styles.documentContainer}>
            {isInspectOpen && <InspectDialog value={value} onClose={handleInspectClose} />}

            <DocumentPanel
              activeViewId={activeViewId}
              connectionState={connectionState}
              documentId={documentId}
              documentType={documentType}
              draft={draft}
              idPrefix={paneKey}
              initialFocusPath={initialFocusPath}
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
              schemaType={schemaType}
              timelineMode={timelineMode}
              toggleInspect={toggleInspect}
              value={value}
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
        </div>

        <div className={styles.footerContainer}>
          <DocumentStatusBar
            id={documentId}
            type={documentType}
            lastUpdated={value && value._updatedAt}
          />
        </div>

        {connectionState === 'reconnecting' && (
          <Snackbar kind="warning" isPersisted title="Connection lost. Reconnecting…" />
        )}

        <DocumentOperationResults id={documentId} type={documentType} />
      </DocumentActionShortcuts>
    </Popover>
  )
}
