import {MenuItemGroup} from '@sanity/base/__legacy/@sanity/components'
import {BoundaryElementProvider, Card, Layer, PortalProvider, usePortal} from '@sanity/ui'
import classNames from 'classnames'
import {ScrollContainer} from 'part:@sanity/components/scroll'
import React, {createElement, useCallback, useMemo, useRef, useState} from 'react'
import {Path} from '@sanity/types'
import {useZIndex} from '@sanity/base/components'
import {useDeskToolFeatures} from '../../../features'
import {useDocumentHistory} from '../documentHistory'
import {Doc, DocumentView} from '../types'
import {DocumentHeaderTitle} from './header/title'
import {DocumentPanelHeader} from './header/header'
import {getMenuItems} from './menuItems'
import {FormView} from './views'

import styles from './documentPanel.css'
import {
  DEFAULT_MARGINS,
  MARGINS_NARROW_SCREEN_WITH_TABS,
  MARGINS_NARROW_SCREEN_WITHOUT_TABS,
} from './constants'

interface DocumentPanelProps {
  activeViewId: string
  documentId: string
  documentType: string
  draft: Doc | null
  idPrefix: string
  initialValue: Doc
  isClosable: boolean
  isCollapsed: boolean
  isHistoryOpen: boolean
  isTimelineOpen: boolean
  markers: any
  menuItemGroups: MenuItemGroup[]
  onChange: (patches: any[]) => void
  formInputFocusPath: Path
  onFormInputFocus: (focusPath: Path) => void
  onCloseView: () => void
  onCollapse?: () => void
  onExpand?: () => void
  onSetActiveView: (id: string | null) => void
  onSplitPane: () => void
  onTimelineOpen: () => void
  paneTitle?: string
  published: Doc | null
  rootElement: HTMLDivElement | null
  schemaType: any
  timelineMode: 'rev' | 'since' | 'closed'
  toggleInspect: (val: boolean) => void
  value: any
  compareValue: any
  versionSelectRef: React.MutableRefObject<HTMLDivElement | null>
  views: DocumentView[]
}

export function DocumentPanel(props: DocumentPanelProps) {
  const {toggleInspect, isHistoryOpen, views, activeViewId} = props
  const zindex = useZIndex()
  const parentPortal = usePortal()
  const features = useDeskToolFeatures()
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null)
  const portalRef = useRef<HTMLDivElement | null>(null)
  const [
    documentViewerContainerElement,
    setDocumentViewerContainerElement,
  ] = useState<HTMLDivElement | null>(null)
  const {displayed, historyController, open: openHistory} = useDocumentHistory()
  const activeView = views.find((view) => view.id === activeViewId) || views[0] || {type: 'form'}

  const {revTime} = historyController

  const menuItems = useMemo(() => {
    return (
      getMenuItems({
        features,
        isHistoryOpen: props.isHistoryOpen,
        rev: revTime ? revTime.id : null,
        value: props.value,
      }) || []
    )
  }, [features, props.isHistoryOpen, revTime, props.value])

  const handleContextMenuAction = useCallback(
    (item) => {
      if (item.action === 'production-preview') {
        window.open(item.url)
        return true
      }

      if (item.action === 'inspect') {
        toggleInspect(true)
        return true
      }

      if (item.action === 'reviewChanges') {
        openHistory()
        return true
      }

      return false
    },
    [openHistory, toggleInspect]
  )

  // Use a local portal container when split panes is supported
  const portalElement: HTMLElement | null = features.splitPanes
    ? portalRef.current || parentPortal.element
    : parentPortal.element

  // Calculate the height of the header
  const hasTabs = views.length > 1
  const narrowScreenMargins = hasTabs
    ? MARGINS_NARROW_SCREEN_WITH_TABS
    : MARGINS_NARROW_SCREEN_WITHOUT_TABS
  const screenIsNarrow = !features.splitPanes
  const margins = screenIsNarrow ? narrowScreenMargins : DEFAULT_MARGINS

  return (
    <Card className={classNames(styles.root, props.isCollapsed && styles.isCollapsed)}>
      <Layer className={styles.headerContainer} zOffset={zindex.pane}>
        <DocumentPanelHeader
          activeViewId={props.activeViewId}
          idPrefix={props.idPrefix}
          isClosable={props.isClosable}
          isCollapsed={props.isCollapsed}
          isTimelineOpen={props.isTimelineOpen}
          markers={props.markers}
          menuItemGroups={props.menuItemGroups}
          menuItems={menuItems}
          onCloseView={props.onCloseView}
          onCollapse={props.onCollapse}
          onContextMenuAction={handleContextMenuAction}
          onExpand={props.onExpand}
          onSetActiveView={props.onSetActiveView}
          onSplitPane={props.onSplitPane}
          onTimelineOpen={props.onTimelineOpen}
          rootElement={props.rootElement}
          schemaType={props.schemaType}
          onSetFormInputFocus={props.onFormInputFocus}
          timelineMode={props.timelineMode}
          title={
            <DocumentHeaderTitle
              documentType={props.documentType}
              paneTitle={props.paneTitle}
              value={props.value}
            />
          }
          versionSelectRef={props.versionSelectRef}
          views={props.views}
          rev={revTime}
          isHistoryOpen={isHistoryOpen}
        />
      </Layer>

      <PortalProvider element={portalElement}>
        <BoundaryElementProvider element={documentViewerContainerElement}>
          <div className={styles.documentViewerContainer} ref={setDocumentViewerContainerElement}>
            <ScrollContainer className={styles.documentScroller}>
              {activeView.type === 'form' && (
                <FormView
                  id={props.documentId}
                  initialValue={props.initialValue}
                  focusPath={props.formInputFocusPath}
                  onFocus={props.onFormInputFocus}
                  markers={props.markers}
                  onChange={props.onChange}
                  readOnly={revTime !== null}
                  schemaType={props.schemaType}
                  value={displayed}
                  margins={margins}
                  compareValue={props.compareValue}
                />
              )}

              {activeView.type === 'component' &&
                createElement((activeView as any).component, {
                  document: {
                    draft: props.draft,
                    displayed: displayed || props.value || props.initialValue,
                    historical: displayed,
                    published: props.published,
                  },
                  documentId: props.documentId,
                  options: (activeView as any).options,
                  schemaType: props.schemaType,
                })}
            </ScrollContainer>

            <div className={styles.portalContainer}>
              <div className={styles.portal} ref={portalRef} />
            </div>
          </div>
        </BoundaryElementProvider>
      </PortalProvider>
    </Card>
  )
}
