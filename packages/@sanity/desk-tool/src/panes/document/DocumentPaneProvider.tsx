// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Path, SanityDocument} from '@sanity/types'
import {unstable_useCheckDocumentPermission as useCheckDocumentPermission} from '@sanity/base/hooks'
import {
  useConnectionState,
  useDocumentOperation,
  useEditState,
  useValidationStatus,
} from '@sanity/react-hooks'
import {omit} from 'lodash'
import {useToast} from '@sanity/ui'
import {fromString as pathFromString, pathFor} from '@sanity/util/paths'
import isHotkey from 'is-hotkey'
import {setLocation} from 'part:@sanity/base/datastore/presence'
import resolveDocumentActions from 'part:@sanity/base/document-actions/resolver'
import resolveDocumentBadges from 'part:@sanity/base/document-badges/resolver'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import schema from 'part:@sanity/base/schema'
import {useMemoObservable} from 'react-rx'
import {PaneMenuItem} from '../../types'
import {useDeskTool} from '../../contexts/deskTool'
import {usePaneRouter} from '../../contexts/paneRouter'
import {useUnique} from '../../utils/useUnique'
import {versionedClient} from '../../versionedClient'
import {createObservableController} from './documentHistory/history/Controller'
import {Timeline} from './documentHistory/history/Timeline'
import {DocumentPaneContext, DocumentPaneContextValue} from './DocumentPaneContext'
import {useInitialValue} from './initialValue'
import {getMenuItems} from './menuItems'
import {DocumentPaneProviderProps} from './types'
import {getPreviewUrl} from './usePreviewUrl'

declare const __DEV__: boolean

const emptyObject = {} as Record<string, string | undefined>

/**
 * @internal
 */
// eslint-disable-next-line complexity, max-statements
export const DocumentPaneProvider = function DocumentPaneProvider(
  props: {children: React.ReactElement} & DocumentPaneProviderProps
) {
  const {children, index, pane, paneKey} = props
  const paneRouter = usePaneRouter()
  const {features} = useDeskTool()
  const {push: pushToast} = useToast()
  const {options, menuItemGroups, title = null, views: viewsProp = []} = pane
  const initialValueRaw = useInitialValue(options.id, pane.options)
  const initialValue = useUnique(initialValueRaw)
  const documentIdRaw = options.id
  const documentId = getPublishedId(documentIdRaw)
  const documentType = options.type
  const {patch}: any = useDocumentOperation(documentId, documentType)
  const editState = useEditState(documentId, documentType)
  const {markers: markersRaw} = useValidationStatus(documentId, documentType)
  const connectionState = useConnectionState(documentId, documentType)
  const documentSchema = schema.get(documentType)
  const value: Partial<SanityDocument> =
    editState?.draft || editState?.published || initialValue.value
  const actions = useMemo(() => (editState ? resolveDocumentActions(editState) : null), [editState])
  const badges = useMemo(() => (editState ? resolveDocumentBadges(editState) : null), [editState])
  const markers = useUnique(markersRaw)
  const views = useUnique(viewsProp)
  const params = paneRouter.params || emptyObject
  const [focusPath, setFocusPath] = useState<Path>(() =>
    params.path ? pathFromString(params.path) : []
  )
  const activeViewId = params.view || (views[0] && views[0].id) || null
  const timeline = useMemo(() => new Timeline({publishedId: documentId, enableTrace: __DEV__}), [
    documentId,
  ])
  const [timelineMode, setTimelineMode] = useState<'since' | 'rev' | 'closed'>('closed')
  // NOTE: this emits sync so can never be null
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const {historyController} = useMemoObservable(
    () =>
      createObservableController({
        timeline,
        documentId,
        client: versionedClient,
      }),
    [documentId, timeline]
  )!
  /**
   * @todo: this will now happen on each render, but should be refactored so it happens only when
   * the `rev`, `since` or `historyController` values change.
   */
  historyController.setRange(params.since || null, params.rev || null)
  const changesOpen = historyController.changesPanelActive()
  const previewUrl = useMemo(() => getPreviewUrl(historyController, value), [
    historyController,
    value,
  ])
  const hasValue = Boolean(value)
  const menuItems = useMemo(() => getMenuItems({features, hasValue, changesOpen, previewUrl}), [
    features,
    hasValue,
    changesOpen,
    previewUrl,
  ])
  const requiredPermission = value?._createdAt ? 'update' : 'create'
  const permission = useCheckDocumentPermission(documentId, documentType, requiredPermission)
  const inspectOpen = params.inspect === 'on'
  const compareValue: Partial<SanityDocument> | null = changesOpen
    ? historyController.sinceAttributes()
    : editState?.published || null
  const ready = connectionState === 'connected' && !patch.disabled
  const displayed: Partial<SanityDocument> | null = useMemo(
    () => {
      return historyController.onOlderRevision() ? historyController.displayed() : value
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [historyController, params.rev, params.since, value]
  )

  const setTimelineRange = useCallback(
    (newSince: string, newRev: string | null) => {
      paneRouter.setParams({
        ...paneRouter.params,
        since: newSince,
        rev: newRev || undefined,
      })
    },
    [paneRouter]
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
    [documentId, setFocusPath]
  )

  const handleChange = useCallback((patches) => patch.execute(patches, initialValue.value), [
    patch,
    initialValue.value,
  ])

  const handleHistoryClose = useCallback(() => {
    paneRouter.setParams({...params, since: undefined})
  }, [paneRouter, params])

  const handleHistoryOpen = useCallback(() => {
    paneRouter.setParams({...params, since: '@lastPublished'})
  }, [paneRouter, params])

  const handlePaneClose = useCallback(() => paneRouter.closeCurrent(), [paneRouter])

  const handlePaneSplit = useCallback(() => paneRouter.duplicateCurrent(), [paneRouter])

  const toggleInspect = useCallback(
    (toggle = !inspectOpen) => {
      if (toggle) {
        paneRouter.setParams({...params, inspect: 'on'})
      } else {
        paneRouter.setParams(omit(params, 'inspect'))
      }
    },
    [inspectOpen, paneRouter, params]
  )

  const handleMenuAction = useCallback(
    (item: PaneMenuItem) => {
      if (item.action === 'production-preview') {
        window.open(item.url)
        return true
      }

      if (item.action === 'inspect') {
        toggleInspect(true)
        return true
      }

      if (item.action === 'reviewChanges') {
        handleHistoryOpen()
        return true
      }

      return false
    },
    [handleHistoryOpen, toggleInspect]
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

  const documentPane: DocumentPaneContextValue = useMemo(
    () => ({
      actions,
      activeViewId,
      badges,
      changesOpen,
      compareValue,
      connectionState,
      displayed,
      documentId,
      documentIdRaw,
      documentSchema,
      documentType,
      editState,
      focusPath,
      handleChange,
      handleFocus,
      handleHistoryClose,
      handleHistoryOpen,
      handleInspectClose,
      handleKeyUp,
      handleMenuAction,
      handlePaneClose,
      handlePaneSplit,
      historyController,
      index,
      initialValue,
      inspectOpen,
      markers,
      menuItems,
      menuItemGroups: menuItemGroups || [],
      paneKey,
      permission,
      previewUrl,
      ready,
      requiredPermission,
      setTimelineMode,
      setTimelineRange,
      timeline,
      timelineMode,
      title,
      value,
      views,
    }),
    [
      actions,
      activeViewId,
      badges,
      changesOpen,
      compareValue,
      connectionState,
      displayed,
      documentId,
      documentIdRaw,
      documentType,
      documentSchema,
      editState,
      focusPath,
      handleChange,
      handleFocus,
      handleHistoryClose,
      handleHistoryOpen,
      handleInspectClose,
      handleKeyUp,
      handleMenuAction,
      handlePaneClose,
      handlePaneSplit,
      historyController,
      index,
      initialValue,
      inspectOpen,
      markers,
      menuItems,
      menuItemGroups,
      paneKey,
      permission,
      previewUrl,
      ready,
      requiredPermission,
      setTimelineMode,
      setTimelineRange,
      timeline,
      timelineMode,
      title,
      value,
      views,
    ]
  )

  useEffect(() => {
    if (connectionState === 'reconnecting') {
      pushToast({
        id: 'desk-tool/reconnecting',
        status: 'warning',
        title: <>Connection lost. Reconnecting…</>,
      })
    }
  }, [connectionState, pushToast])

  // Reset `focusPath` when `documentId` or `params.path` changes
  useEffect(() => {
    // Reset focus path
    setFocusPath(params.path ? pathFromString(params.path) : [])
  }, [documentId, params.path])

  return (
    <DocumentPaneContext.Provider value={documentPane}>{children}</DocumentPaneContext.Provider>
  )
}
