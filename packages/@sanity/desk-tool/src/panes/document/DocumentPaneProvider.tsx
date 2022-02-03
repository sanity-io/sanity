import React, {memo, useCallback, useEffect, useMemo, useState} from 'react'
import {getPublishedId} from '@sanity/base/_internal'
import {Path, SanityDocument} from '@sanity/types'
import {
  useConnectionState,
  useDocumentOperation,
  useEditState,
  useValidationStatus,
} from '@sanity/base/hooks'
import {omit} from 'lodash'
import {useToast} from '@sanity/ui'
import {fromString as pathFromString, pathFor} from '@sanity/util/paths'
import isHotkey from 'is-hotkey'
import {useMemoObservable} from 'react-rx'
import {useClient, useSource, useDatastores, useInitialValue} from '@sanity/base'
import {PaneMenuItem} from '../../types'
import {useDeskTool} from '../../contexts/deskTool'
import {usePaneRouter} from '../../contexts/paneRouter'
import {useUnique} from '../../utils/useUnique'
import {resolveDocumentBadges} from '../../TODO'
import {DocumentPaneContext, DocumentPaneContextValue} from './DocumentPaneContext'
import {getMenuItems} from './menuItems'
import {DocumentPaneProviderProps} from './types'
import {getPreviewUrl} from './usePreviewUrl'
import {getInitialValueTemplateOpts} from './getInitialValueTemplateOpts'

declare const __DEV__: boolean

const emptyObject = {} as Record<string, string | undefined>

/**
 * @internal
 */
// eslint-disable-next-line complexity, max-statements
export const DocumentPaneProvider = memo((props: DocumentPaneProviderProps) => {
  const {children, index, pane, paneKey} = props
  const source = useSource()
  const client = useClient()
  const {historyStore, presenceStore} = useDatastores()
  const paneRouter = usePaneRouter()
  const {features, resolveDocumentActions} = useDeskTool()
  const {push: pushToast} = useToast()
  const {options, menuItemGroups, title = null, views: viewsProp = []} = pane
  const paneOptions = useUnique(options)
  const documentIdRaw = paneOptions.id
  const documentId = getPublishedId(documentIdRaw)
  const documentType = options.type
  const paneParams = useUnique(paneRouter.params)
  const panePayload = useUnique(paneRouter.payload)
  const {templateName, templateParams} = useMemo(
    () =>
      getInitialValueTemplateOpts(source.schema, source.initialValueTemplates, {
        documentType,
        templateName: paneOptions.template,
        templateParams: paneOptions.templateParameters,
        panePayload,
        urlTemplate: paneParams?.template,
      }),
    [
      documentType,
      source.initialValueTemplates,
      paneOptions.template,
      paneOptions.templateParameters,
      panePayload,
      source.schema,
      paneParams?.template,
    ]
  )
  const initialValueRaw = useInitialValue({
    documentId,
    documentType,
    templateName,
    templateParams,
  })
  const initialValue = useUnique(initialValueRaw)
  const {patch}: any = useDocumentOperation(documentId, documentType)
  const editState = useEditState(documentId, documentType)
  const {markers: markersRaw} = useValidationStatus(documentId, documentType)
  const connectionState = useConnectionState(documentId, documentType)
  const documentSchema = source.schema.get(documentType)
  const value: Partial<SanityDocument> =
    editState?.draft || editState?.published || initialValue.value
  const actions = useMemo(
    () => (editState && resolveDocumentActions ? resolveDocumentActions(editState) : null),
    [editState, resolveDocumentActions]
  )
  const badges = useMemo(() => (editState ? resolveDocumentBadges(editState) : null), [editState])
  const markers = useUnique(markersRaw)
  const views = useUnique(viewsProp)
  const params = paneRouter.params || emptyObject
  const [focusPath, setFocusPath] = useState<Path>(() =>
    params.path ? pathFromString(params.path) : []
  )
  const activeViewId = params.view || (views[0] && views[0].id) || null
  const timeline = useMemo(
    () => historyStore.getTimeline({publishedId: documentId, enableTrace: __DEV__}),
    [documentId, historyStore]
  )
  const [timelineMode, setTimelineMode] = useState<'since' | 'rev' | 'closed'>('closed')
  // NOTE: this emits sync so can never be null
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const {historyController} = useMemoObservable(
    () => historyStore.getTimelineController({client, documentId, documentType, timeline}),
    [client, documentId, documentType, timeline]
  )!
  /**
   * @todo: this will now happen on each render, but should be refactored so it happens only when
   * the `rev`, `since` or `historyController` values change.
   */
  historyController.setRange(params.since || null, params.rev || null)
  const changesOpen = historyController.changesPanelActive()
  const previewUrl = useMemo(
    () => getPreviewUrl(historyController, value),
    [historyController, value]
  )
  const hasValue = Boolean(value)
  const menuItems = useMemo(
    () => getMenuItems({features, hasValue, changesOpen, previewUrl}),
    [features, hasValue, changesOpen, previewUrl]
  )
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

  const handleFocus = useCallback(
    (nextFocusPath?: Path | React.FocusEvent<any>) => {
      const path = Array.isArray(nextFocusPath) ? nextFocusPath : []

      setFocusPath(pathFor(path))

      presenceStore.setLocation([
        {
          type: 'document',
          documentId,
          path,
          lastActiveAt: new Date().toISOString(),
        },
      ])
    },
    [documentId, presenceStore, setFocusPath]
  )

  const handleChange = useCallback(
    (patches) => patch.execute(patches, initialValue.value),
    [patch, initialValue.value]
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

  const documentPane: DocumentPaneContextValue = {
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
    inspectOpen,
    markers,
    menuItems,
    menuItemGroups: menuItemGroups || [],
    paneKey,
    previewUrl,
    ready,
    setTimelineMode,
    setTimelineRange,
    timeline,
    timelineMode,
    title,
    value,
    views,
  }

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
})

DocumentPaneProvider.displayName = 'DocumentPaneProvider'
