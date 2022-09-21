// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Path, SanityDocument} from '@sanity/types'
import {
  useConnectionState,
  useDocumentOperation,
  useEditState,
  useValidationStatus,
} from '@sanity/react-hooks'
import {omit} from 'lodash'
import {useToast} from '@sanity/ui'
import {fromString as pathFromString} from '@sanity/util/paths'
import isHotkey from 'is-hotkey'
import {setLocation} from 'part:@sanity/base/datastore/presence'
import resolveDocumentActions from 'part:@sanity/base/document-actions/resolver'
import resolveDocumentBadges from 'part:@sanity/base/document-badges/resolver'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import schema from 'part:@sanity/base/schema'
import {useMemoObservable} from 'react-rx'
import {PaneMenuItem, PaneMenuItemGroup} from '../../types'
import {useDeskTool} from '../../contexts/deskTool'
import {usePaneRouter} from '../../contexts/paneRouter'
import {useUnique} from '../../utils/useUnique'
import {versionedClient} from '../../versionedClient'
import {useReferringDocuments} from '../../components/confirmDeleteDialog/useReferringDocuments'
import {createObservableController} from './documentHistory/history/Controller'
import {Timeline} from './documentHistory/history/Timeline'
import {DocumentPaneContext, DocumentPaneContextValue} from './DocumentPaneContext'
import {useInitialValue} from './initialValue'
import {getMenuItems} from './menuItems'
import {DocumentPaneProviderProps} from './types'
import {getPreviewUrl} from './usePreviewUrl'

declare const __DEV__: boolean

const emptyObject = {} as Record<string, string | undefined>
const emptyMenuGroup: PaneMenuItemGroup[] = []

type Props = {children: React.ReactElement} & DocumentPaneProviderProps

/**
 * @internal
 */
// eslint-disable-next-line complexity, max-statements
export const DocumentPaneProvider = ({children, index, pane, paneKey}: Props) => {
  const paneRouter = usePaneRouter()
  const {features} = useDeskTool()
  const {push: pushToast} = useToast()
  const {options, menuItemGroups, title = null, views: viewsProp = []} = pane
  const initialValue = useInitialValue(options.id, options)

  const documentIdRaw = options.id
  const documentId = getPublishedId(documentIdRaw)
  const documentType = options.type
  const {patch}: any = useDocumentOperation(documentId, documentType)
  const editState = useEditState(documentId, documentType, 'low')
  const {markers: markersRaw} = useValidationStatus(documentId, documentType)
  const connectionState = useConnectionState(documentId, documentType)
  const documentSchema = schema.get(documentType)
  const {totalCount, isLoading: isReferencesLoading} = useReferringDocuments(options.id, {
    externalPollInterval: 1000 * 60,
  })
  const totalReferenceCount = isReferencesLoading ? undefined : totalCount
  const value: Partial<SanityDocument> = useMemo(
    () => editState?.draft || editState?.published || initialValue.value,
    [editState, initialValue]
  )
  const actions = useMemo(() => (editState ? resolveDocumentActions(editState) : null), [editState])
  const badges = useMemo(() => (editState ? resolveDocumentBadges(editState) : null), [editState])
  const markers = useUnique(markersRaw)
  const views = useUnique(viewsProp)
  const params = paneRouter.params || emptyObject
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
        documentType,
        client: versionedClient,
      }),
    [timeline, documentId, documentType, timeline, versionedClient]
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
  const inspectOpen = params.inspect === 'on'
  const compareValue: Partial<SanityDocument> | null = changesOpen
    ? historyController.sinceAttributes()
    : editState?.published || null
  const ready = connectionState === 'connected' && editState.ready
  const viewOlderVersion = historyController.onOlderRevision()
  const displayed: Partial<SanityDocument> | null = useMemo(
    () => (viewOlderVersion ? historyController.displayed() : value),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [historyController, params.rev, params.since, value, viewOlderVersion]
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

  const patchRef = useRef(patch)
  patchRef.current = patch
  const handleChange = useCallback(
    (patches) => patchRef.current.execute(patches, initialValue.value),
    [initialValue.value]
  )

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
      if (item.action === 'production-preview' && previewUrl) {
        window.open(previewUrl)
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
    [handleHistoryOpen, previewUrl, toggleInspect]
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
      handleChange,
      handleHistoryClose,
      handleHistoryOpen,
      handleInspectClose,
      handleKeyUp,
      handleMenuAction,
      handlePaneClose,
      handlePaneSplit,
      historyController,
      index,
      initialValue: initialValue.value,
      inspectOpen,
      markers,
      menuItems,
      menuItemGroups: menuItemGroups || emptyMenuGroup,
      paneKey,
      previewUrl,
      ready,
      setTimelineMode,
      setTimelineRange,
      timeline,
      timelineMode,
      title,
      totalReferenceCount,
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
      documentSchema,
      documentType,
      handleChange,
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
      previewUrl,
      ready,
      setTimelineRange,
      timeline,
      timelineMode,
      title,
      totalReferenceCount,
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

  return useMemo(
    () => (
      <DocumentPaneContext.Provider value={documentPane}>{children}</DocumentPaneContext.Provider>
    ),
    [children, documentPane]
  )
}

DocumentPaneProvider.displayName = 'DocumentPaneProvider'
