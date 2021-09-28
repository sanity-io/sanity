// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {MenuItem} from '@sanity/base/__legacy/@sanity/components'
import {unstable_useCheckDocumentPermission as useCheckDocumentPermission} from '@sanity/base/hooks'
import {
  useConnectionState,
  useDocumentOperation,
  useEditState,
  useValidationStatus,
} from '@sanity/react-hooks'
import {Path, SanityDocument} from '@sanity/types'
import {Card, Code, Stack, Text, useToast} from '@sanity/ui'
import {fromString as pathFromString, pathFor} from '@sanity/util/paths'
import isHotkey from 'is-hotkey'
import {setLocation} from 'part:@sanity/base/datastore/presence'
import resolveDocumentActions from 'part:@sanity/base/document-actions/resolver'
import resolveDocumentBadges from 'part:@sanity/base/document-badges/resolver'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import schema from 'part:@sanity/base/schema'
import {useMemoObservable} from 'react-rx'
import {ErrorPane} from '../error'
import {LoadingPane} from '../loading'
import {useDeskTool} from '../../contexts/deskTool'
import {usePaneRouter} from '../../contexts/paneRouter'
import {useUnique} from '../../lib/useUnique'
import {versionedClient} from '../../versionedClient'
import {DocumentHistoryProvider} from './documentHistory'
import {createObservableController} from './documentHistory/history/Controller'
import {Timeline} from './documentHistory/history/Timeline'
import {DocumentPaneContext, DocumentPaneContextValue} from './DocumentPaneContext'
import {useInitialValue} from './lib/initialValue'
import {getMenuItems} from './menuItems'
import {DocumentPaneProviderProps} from './types'
import {getPreviewUrl} from './usePreviewUrl'

declare const __DEV__: boolean

/**
 * @internal
 */
// eslint-disable-next-line complexity, max-statements
export const DocumentPaneProvider = function DocumentPaneProvider(
  props: {children: React.ReactElement} & DocumentPaneProviderProps
) {
  const {children, index, isClosable: closable, pane, paneKey} = props
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

  const [focusPath, setFocusPath] = useState<Path>(() =>
    paneRouter.params.path ? pathFromString(paneRouter.params.path) : []
  )

  const handleFocus = useCallback(
    (nextFocusPath: Path) => {
      setFocusPath(pathFor(nextFocusPath))

      setLocation([
        {type: 'document', documentId, path: nextFocusPath, lastActiveAt: new Date().toISOString()},
      ])
    },
    [documentId, setFocusPath]
  )

  const activeViewId = paneRouter.params.view || (views[0] && views[0].id) || null

  const timeline = useMemo(() => new Timeline({publishedId: documentId, enableTrace: __DEV__}), [
    documentId,
  ])

  // note: this emits sync so can never be null
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

  const handleChange = useCallback((patches) => patch.execute(patches, initialValue.value), [
    patch,
    initialValue.value,
  ])

  const requiredPermission = value?._createdAt ? 'update' : 'create'

  const permission = useCheckDocumentPermission(documentId, documentType, requiredPermission)

  const handleHistoryClose = useCallback(() => {
    paneRouter.setParams({...paneRouter.params, since: undefined})
  }, [paneRouter])

  const handleHistoryOpen = useCallback(() => {
    paneRouter.setParams({...paneRouter.params, since: '@lastPublished'})
  }, [paneRouter])

  const handlePaneClose = useCallback(() => paneRouter.closeCurrent(), [paneRouter])

  const handlePaneSplit = useCallback(() => paneRouter.duplicateCurrent(), [paneRouter])

  const inspectOpen = paneRouter.params.inspect === 'on'

  // const isChangesOpen = historyController.changesPanelActive()
  const compareValue: Partial<SanityDocument> | null = changesOpen
    ? (historyController.sinceAttributes() as any)
    : editState?.published || null

  const toggleInspect = useCallback(
    (toggle = !inspectOpen) => {
      const {inspect: oldInspect, ...params} = paneRouter.params
      if (toggle) {
        paneRouter.setParams({inspect: 'on', ...params})
      } else {
        paneRouter.setParams(params)
      }
    },
    [inspectOpen, paneRouter]
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
      closable,
      compareValue,
      connectionState,
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
      index,
      initialValue,
      inspectOpen,
      markers,
      menuItems,
      menuItemGroups: menuItemGroups || [],
      paneKey,
      permission,
      previewUrl,
      requiredPermission,
      title,
      value,
      views,
    }),
    [
      actions,
      activeViewId,
      badges,
      changesOpen,
      closable,
      compareValue,
      connectionState,
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
      index,
      initialValue,
      inspectOpen,
      markers,
      menuItems,
      menuItemGroups,
      paneKey,
      permission,
      previewUrl,
      requiredPermission,
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

  if (!documentSchema) {
    return (
      <ErrorPane
        {...props}
        flex={2.5}
        minWidth={320}
        title={
          <>
            Unknown document type: <code>{documentType}</code>
          </>
        }
        tone="caution"
      >
        <Stack space={4}>
          {documentType && (
            <Text as="p">
              This document has the schema type <code>{documentType}</code>, which is not defined as
              a type in the local content studio schema.
            </Text>
          )}

          {!documentType && (
            <Text as="p">
              This document does not exist, and no schema type was specified for it.
            </Text>
          )}

          {__DEV__ && value && (
            <>
              <Text as="p">Here is the JSON representation of the document:</Text>
              <Card padding={3} overflow="auto" radius={2} shadow={1} tone="inherit">
                <Code language="json" size={[1, 1, 2]}>
                  {JSON.stringify(value, null, 2)}
                </Code>
              </Card>
            </>
          )}
        </Stack>
      </ErrorPane>
    )
  }

  if (connectionState === 'connecting' || !editState) {
    return (
      <LoadingPane
        {...props}
        flex={2.5}
        minWidth={320}
        title={`Loading ${documentSchema.title}…`}
      />
    )
  }

  if (initialValue.error) {
    return (
      <ErrorPane flex={2.5} minWidth={320} title="Failed to resolve initial value">
        <Text as="p">Check developer console for details.</Text>
      </ErrorPane>
    )
  }

  return (
    <DocumentHistoryProvider controller={historyController} timeline={timeline} value={value}>
      <DocumentPaneContext.Provider value={documentPane}>{children}</DocumentPaneContext.Provider>
    </DocumentHistoryProvider>
  )
}
