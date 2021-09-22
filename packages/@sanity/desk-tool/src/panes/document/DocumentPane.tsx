// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {MenuItem, MenuItemGroup} from '@sanity/base/__legacy/@sanity/components'
import {BoundaryElementProvider, DialogProvider, Flex, useToast, useElementRect} from '@sanity/ui'
import {fromString as pathFromString, pathFor} from '@sanity/util/paths'
import {Path, Marker, SanityDocument} from '@sanity/types'
import {LegacyLayerProvider, useZIndex} from '@sanity/base/components'
import {ChangeConnectorRoot} from '@sanity/base/change-indicators'
import isHotkey from 'is-hotkey'
import {setLocation} from 'part:@sanity/base/datastore/presence'
import React, {useCallback, useEffect, useState, useMemo} from 'react'
import styled from 'styled-components'
import {usePaneRouter} from '../../contexts/paneRouter'
import {useDeskTool} from '../../contexts/deskTool'
import {PaneFooter} from '../../components/pane'
import {useUnique} from '../../lib/useUnique'
import {usePaneLayout} from '../../components/pane/usePaneLayout'
import {ChangesPanel} from './changesPanel'
import {useDocumentHistory} from './documentHistory'
import {DocumentPanel} from './documentPanel'
import {DocumentOperationResults} from './DocumentOperationResults'
import {InspectDialog} from './inspectDialog'
import {DocumentActionShortcuts} from './keyboardShortcuts'
import {getMenuItems} from './menuItems'
import {DocumentStatusBar} from './statusBar'
import {DocumentView} from './types'
import {usePreviewUrl} from './usePreviewUrl'

interface DocumentPaneProps {
  compareValue: SanityDocument | null
  connectionState: 'connecting' | 'connected' | 'reconnecting'
  documentId: string
  documentIdRaw: string
  documentType: string
  draft: SanityDocument | null
  index: number
  initialValue: Partial<SanityDocument>
  isClosable: boolean
  markers: Marker[]
  menuItemGroups: MenuItemGroup[]
  onChange: (patches: any[]) => void
  paneKey: string
  published: SanityDocument | null
  schemaType: any
  title?: string
  value: Partial<SanityDocument> | null
  views: DocumentView[]
}

const EMPTY_ARRAY = []

const StyledChangeConnectorRoot = styled(ChangeConnectorRoot)`
  flex: 2;
  display: flex;
  direction: column;
  min-width: 0;
  height: 100%;
`

export function DocumentPane(props: DocumentPaneProps) {
  const {
    connectionState,
    documentId,
    documentIdRaw,
    documentType,
    draft,
    index,
    initialValue: initialValueProp,
    isClosable,
    markers: markersProp,
    menuItemGroups = EMPTY_ARRAY,
    onChange,
    paneKey,
    published,
    title: paneTitle,
    schemaType,
    value,
    compareValue,
    views: viewsProp = EMPTY_ARRAY,
  } = props
  const {features} = useDeskTool()
  const {collapsed: layoutCollapsed} = usePaneLayout()
  const markers = useUnique(markersProp)
  const initialValue = useUnique(initialValueProp)
  const views = useUnique(viewsProp)
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const [footerElement, setFooterElement] = useState<HTMLDivElement | null>(null)
  const [actionsBoxElement, setActionsBoxElement] = useState<HTMLDivElement | null>(null)
  const footerRect = useElementRect(footerElement)
  const {historyController, open: openHistory, displayed} = useDocumentHistory()
  const historyState = historyController.selectionState
  const paneRouter = usePaneRouter()
  const activeViewId = paneRouter.params.view || (views[0] && views[0].id)
  const [formInputFocusPath, setFocusPath] = React.useState<Path>(() =>
    paneRouter.params.path ? pathFromString(paneRouter.params.path) : []
  )
  const isInspectOpen = paneRouter.params.inspect === 'on'
  const previewUrl = usePreviewUrl(value)
  const isChangesOpen = historyController.changesPanelActive()
  const zOffsets = useZIndex()
  const inspectValue = displayed || initialValue
  const {push: pushToast} = useToast()
  const hasValue = Boolean(value)

  const menuItems = useMemo(
    () => getMenuItems({features, hasValue, isHistoryOpen: isChangesOpen, previewUrl}),
    [features, hasValue, isChangesOpen, previewUrl]
  )

  const handleFocus = useCallback(
    (nextFocusPath: Path) => {
      setFocusPath(pathFor(nextFocusPath))
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

  const handleMenuAction = useCallback(
    (item: MenuItem) => {
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

  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      for (const item of menuItems) {
        if (item.shortcut) {
          if (isHotkey(item.shortcut, event)) {
            event.preventDefault()
            event.stopPropagation()
            handleMenuAction(item)
            return
          }
        }
      }
    },
    [handleMenuAction, menuItems]
  )

  const handleInspectClose = useCallback(() => toggleInspect(false), [toggleInspect])

  const handleClosePane = useCallback(() => paneRouter.closeCurrent(), [paneRouter])

  const handleSplitPane = useCallback(() => paneRouter.duplicateCurrent(), [paneRouter])

  useEffect(() => {
    if (connectionState === 'reconnecting') {
      pushToast({
        id: 'desk-tool/reconnecting',
        status: 'warning',
        title: <>Connection lost. Reconnecting…</>,
      })
    }
  }, [connectionState, pushToast])

  const updatedAt = value?._updatedAt

  const paneFooter = useMemo(
    () => (
      <PaneFooter ref={setFooterElement}>
        <DocumentStatusBar
          actionsBoxRef={setActionsBoxElement}
          id={documentId}
          type={documentType}
          lastUpdated={updatedAt}
        />
      </PaneFooter>
    ),
    [documentId, documentType, setActionsBoxElement, updatedAt]
  )

  const inspectDialog = useMemo(
    () => (
      <LegacyLayerProvider zOffset="fullscreen">
        {isInspectOpen && (
          <InspectDialog idPrefix={paneKey} onClose={handleInspectClose} value={inspectValue} />
        )}
      </LegacyLayerProvider>
    ),
    [handleInspectClose, inspectValue, isInspectOpen, paneKey]
  )

  return (
    <DocumentActionShortcuts
      actionsBoxElement={actionsBoxElement}
      data-index={index}
      data-pane-key={paneKey}
      data-ui="DocumentPane"
      flex={2.5}
      id={documentIdRaw}
      minWidth={isChangesOpen ? 640 : 320}
      type={documentType}
      onKeyUp={handleKeyUp}
      rootRef={setRootElement}
    >
      <DialogProvider position={['fixed', 'absolute']} zOffset={zOffsets.portal}>
        <Flex flex={1} height={layoutCollapsed ? undefined : 'fill'}>
          <StyledChangeConnectorRoot
            onSetFocus={handleFocus}
            onOpenReviewChanges={openHistory}
            isReviewChangesOpen={isChangesOpen}
          >
            <DocumentPanel
              activeViewId={activeViewId}
              documentId={documentId}
              documentType={documentType}
              draft={draft}
              footerHeight={footerRect?.height || null}
              idPrefix={paneKey}
              formInputFocusPath={formInputFocusPath}
              onFormInputFocus={handleFocus}
              initialValue={initialValue}
              isClosable={isClosable}
              isHistoryOpen={isChangesOpen}
              markers={markers}
              menuItems={menuItems}
              menuItemGroups={menuItemGroups}
              onChange={onChange}
              onCloseView={handleClosePane}
              onMenuAction={handleMenuAction}
              onSplitPane={handleSplitPane}
              paneTitle={paneTitle}
              published={published}
              rootElement={rootElement}
              schemaType={schemaType}
              value={value}
              compareValue={
                isChangesOpen ? (historyController.sinceAttributes() as any) : compareValue
              }
              views={views}
            />

            {features.reviewChanges && isChangesOpen && (
              <BoundaryElementProvider element={rootElement}>
                <ChangesPanel
                  documentId={documentId}
                  loading={historyState === 'loading'}
                  schemaType={schemaType}
                  since={historyController.sinceTime}
                />
              </BoundaryElementProvider>
            )}
          </StyledChangeConnectorRoot>
        </Flex>
      </DialogProvider>

      {paneFooter}

      <DocumentOperationResults id={documentId} type={documentType} />

      {inspectDialog}
    </DocumentActionShortcuts>
  )
}
