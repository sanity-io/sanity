import {MenuItemGroup} from '@sanity/base/__legacy/@sanity/components'
import {BoundaryElementProvider, Card, Layer, PortalProvider, usePortal} from '@sanity/ui'
import classNames from 'classnames'
import React, {createElement, useCallback, useMemo, useRef, useState} from 'react'
import {Path} from '@sanity/types'
import {LegacyLayerProvider, ScrollContainer} from '@sanity/base/components'
import {
  unstable_useCheckDocumentPermission as useCheckDocumentPermission,
  useCurrentUser,
} from '@sanity/base/hooks'
import {useDeskToolFeatures} from '../../../features'
import {useDocumentHistory} from '../documentHistory'
import {Doc, DocumentView} from '../types'
import {usePreviewUrl} from '../usePreviewUrl'
import {DocumentHeaderTitle} from './header/title'
import {DocumentPanelHeader} from './header/header'
import {getMenuItems} from './menuItems'
import {FormView} from './views'

import styles from './documentPanel.css'
import {DEFAULT_MARGINS, MARGINS_NARROW_SCREEN_WITH_TABS} from './constants'
import {PermissionCheckBanner} from './permissionCheckBanner'

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
  paneTitle?: string
  published: Doc | null
  rootElement: HTMLDivElement | null
  schemaType: any
  toggleInspect: (val: boolean) => void
  value: any
  compareValue: any
  views: DocumentView[]
  timelinePopoverBoundaryElement: HTMLDivElement | null
}

export function DocumentPanel(props: DocumentPanelProps) {
  const {toggleInspect, isHistoryOpen, views, activeViewId, timelinePopoverBoundaryElement} = props
  const parentPortal = usePortal()
  const features = useDeskToolFeatures()
  const portalRef = useRef<HTMLDivElement | null>(null)
  const [
    documentViewerContainerElement,
    setDocumentViewerContainerElement,
  ] = useState<HTMLDivElement | null>(null)
  const {displayed, historyController, open: openHistory} = useDocumentHistory()
  const activeView = useMemo(
    () => views.find((view) => view.id === activeViewId) || views[0] || {type: 'form'},
    [activeViewId, views]
  )
  const {revTime} = historyController
  const hasValue = Boolean(props.value)
  const previewUrl = usePreviewUrl(props.value)
  const menuItems = useMemo(() => {
    return (
      getMenuItems({
        features,
        hasValue,
        isHistoryOpen: props.isHistoryOpen,
        previewUrl,
      }) || []
    )
  }, [features, hasValue, props.isHistoryOpen, previewUrl])

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

  const {value: currentUser} = useCurrentUser()

  const requiredPermission = props.value._createdAt ? 'update' : 'create'

  const permission = useCheckDocumentPermission(
    props.documentId,
    props.documentType,
    requiredPermission
  )

  // Use a local portal container when split panes is supported
  const portalElement: HTMLElement | null = features.splitPanes
    ? portalRef.current || parentPortal.element
    : parentPortal.element

  // Calculate the height of the header
  const screenIsNarrow = !features.splitPanes
  const margins = screenIsNarrow ? MARGINS_NARROW_SCREEN_WITH_TABS : DEFAULT_MARGINS

  return (
    <Card className={classNames(styles.root, props.isCollapsed && styles.isCollapsed)}>
      <LegacyLayerProvider zOffset="paneHeader">
        <Layer className={styles.headerContainer}>
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
            rootElement={props.rootElement}
            schemaType={props.schemaType}
            onSetFormInputFocus={props.onFormInputFocus}
            title={
              <DocumentHeaderTitle
                documentType={props.documentType}
                paneTitle={props.paneTitle}
                value={props.value}
              />
            }
            views={props.views}
            rev={revTime}
            isHistoryOpen={isHistoryOpen}
            timelinePopoverBoundaryElement={timelinePopoverBoundaryElement}
          />
        </Layer>
      </LegacyLayerProvider>

      <PortalProvider element={portalElement}>
        <BoundaryElementProvider element={documentViewerContainerElement}>
          {activeView.type === 'form' && (
            <Layer>
              <PermissionCheckBanner
                permission={permission}
                requiredPermission={requiredPermission}
                currentUser={currentUser}
              />
            </Layer>
          )}
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
                  readOnly={revTime !== null || !permission.granted}
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
