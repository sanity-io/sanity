import {ClickOutside} from 'part:@sanity/components/click-outside'
import {Popover} from 'part:@sanity/components/popover'
import * as PathUtils from '@sanity/util/paths'
import classNames from 'classnames'
import React, {useCallback, useRef, useState} from 'react'
import {usePaneRouter} from '../../contexts/PaneRouterContext'
import {useDeskToolFeatures} from '../../features'
import {ChangesPanel} from './changesPanel'
import {useDocumentHistory} from './documentHistory'
import {DocumentPanel, getProductionPreviewItem} from './documentPanel'
import {InspectDialog} from './inspectDialog'
import {DocumentActionShortcuts, isInspectHotkey, isPreviewHotkey} from './keyboardShortcuts'
import {Timeline} from './timeline'
import {Doc, DocumentViewType, MenuItemGroup} from './types'

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
  onChange: (patches: any[]) => void
  onExpand?: () => void
  onCollapse?: () => void
  paneKey: string
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

  const features = useDeskToolFeatures()
  const {startTime} = useDocumentHistory()
  const [showValidationTooltip, setShowValidationTooltip] = useState<boolean>(false)
  const paneRouter = usePaneRouter()
  const [isTimelineOpen, setTimelineOpen] = useState(false)
  const [timelineMode, setTimelineMode] = useState<'version' | 'changesSince'>('version')
  const activeViewId = paneRouter.params.view || (views[0] && views[0].id)
  const initialFocusPath = paneRouter.params.path
    ? PathUtils.fromString(paneRouter.params.path)
    : []
  const isInspectOpen = paneRouter.params.inspect === 'on'
  const isHistoryOpen = Boolean(startTime)

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

  const handleTimelineOpen = useCallback((mode: 'version' | 'changesSince') => {
    setTimelineMode(mode)
    setTimelineOpen(true)
  }, [])

  const handleTimelineClose = useCallback(() => {
    setTimelineOpen(false)
  }, [])

  return (
    <Popover
      content={
        <ClickOutside onClickOutside={handleTimelineClose}>
          {ref => (
            <Timeline onModeChange={setTimelineMode} onSelect={handleTimelineClose} ref={ref} />
          )}
        </ClickOutside>
      }
      open={isTimelineOpen}
      placement="bottom"
      style={{transition: isTimelineOpen ? 'transform 200ms' : undefined}}
      targetElement={
        timelineMode === 'version' ? versionSelectRef.current : changesSinceSelectRef.current
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
            onTimelineOpen={handleTimelineOpen}
            paneTitle={paneTitle}
            schemaType={schemaType}
            toggleInspect={toggleInspect}
            value={value}
            versionSelectRef={versionSelectRef}
            views={views}
          />
        </div>

        {features.reviewChanges && !isCollapsed && isHistoryOpen && (
          <div className={styles.changesContainer}>
            <ChangesPanel
              documentId={documentId}
              changesSinceSelectRef={changesSinceSelectRef}
              onTimelineOpen={handleTimelineOpen}
              schemaType={schemaType}
            />
          </div>
        )}
      </DocumentActionShortcuts>
    </Popover>
  )
}
