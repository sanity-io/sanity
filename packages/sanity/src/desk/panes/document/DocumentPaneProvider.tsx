import React, {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {ObjectSchemaType, Path, SanityDocument, SanityDocumentLike} from '@sanity/types'
import {omit} from 'lodash'
import {useToast} from '@sanity/ui'
import {fromString as pathFromString} from '@sanity/util/paths'
import isHotkey from 'is-hotkey'
import {useMemoObservable} from 'react-rx'
import {isActionEnabled} from '@sanity/schema/_internal'
import {usePaneRouter} from '../../components'
import {PaneMenuItem} from '../../types'
import {useDeskTool} from '../../useDeskTool'
import {DocumentPaneContext, DocumentPaneContextValue} from './DocumentPaneContext'
import {getMenuItems} from './menuItems'
import {DocumentPaneProviderProps} from './types'
import {usePreviewUrl} from './usePreviewUrl'
import {getInitialValueTemplateOpts} from './getInitialValueTemplateOpts'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  DocumentPresence,
  PatchEvent,
  StateTree,
  toMutationPatches,
  getExpandOperations,
  getPublishedId,
  isDev,
  setAtPath,
  useClient,
  useConnectionState,
  useDocumentOperation,
  useEditState,
  useFormState,
  useHistoryStore,
  useInitialValue,
  usePresenceStore,
  useSchema,
  useSource,
  useTemplates,
  useUnique,
  useValidationStatus,
  getDraftId,
  useDocumentValuePermissions,
} from 'sanity'

const emptyObject = {} as Record<string, string | undefined>

/**
 * @internal
 */
// eslint-disable-next-line complexity, max-statements
export const DocumentPaneProvider = memo((props: DocumentPaneProviderProps) => {
  const {children, index, pane, paneKey} = props
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const schema = useSchema()
  const templates = useTemplates()
  const {
    actions: documentActions,
    badges: documentBadges,
    unstable_languageFilter: languageFilterResolver,
  } = useSource().document
  const historyStore = useHistoryStore()
  const presenceStore = usePresenceStore()
  const paneRouter = usePaneRouter()
  const {features} = useDeskTool()
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
      getInitialValueTemplateOpts(templates, {
        documentType,
        templateName: paneOptions.template,
        templateParams: paneOptions.templateParameters,
        panePayload,
        urlTemplate: paneParams?.template,
      }),
    [documentType, paneOptions, paneParams, panePayload, templates]
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
  const {validation: validationRaw} = useValidationStatus(documentId, documentType)
  const connectionState = useConnectionState(documentId, documentType)
  const schemaType = schema.get(documentType) as ObjectSchemaType | undefined
  const value: SanityDocumentLike = editState?.draft || editState?.published || initialValue.value

  // Resolve document actions
  const actions = useMemo(
    () => documentActions({schemaType: documentType, documentId}),
    [documentActions, documentId, documentType]
  )

  // Resolve document badges
  const badges = useMemo(
    () => documentBadges({schemaType: documentType, documentId}),
    [documentBadges, documentId, documentType]
  )

  // Resolve document language filter
  const languageFilter = useMemo(
    () => languageFilterResolver({schemaType: documentType, documentId}),
    [documentId, documentType, languageFilterResolver]
  )

  const validation = useUnique(validationRaw)
  const views = useUnique(viewsProp)
  const params = paneRouter.params || emptyObject
  const [focusPath, setFocusPath] = useState<Path>(() =>
    params.path ? pathFromString(params.path) : []
  )
  const activeViewId = params.view || (views[0] && views[0].id) || null
  const timeline = useMemo(
    () => historyStore.getTimeline({publishedId: documentId, enableTrace: isDev}),
    [documentId, historyStore]
  )
  const [timelineMode, setTimelineMode] = useState<'since' | 'rev' | 'closed'>('closed')
  // NOTE: this emits sync so can never be null
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const {historyController} = useMemoObservable(
    () => historyStore.getTimelineController({client, documentId, documentType, timeline}),
    [client, documentId, documentType, timeline]
  )!

  // @todo: this will now happen on each render, but should be refactored so it happens only when
  // the `rev`, `since` or `historyController` values change.
  historyController.setRange(params.since || null, params.rev || null)
  const changesOpen = historyController.changesPanelActive()

  // TODO: this may cause a lot of churn. May be a good idea to prevent these
  // requests unless the menu is open somehow
  const previewUrl = usePreviewUrl(value)

  const [presence, setPresence] = useState<DocumentPresence[]>([])
  useEffect(() => {
    const subscription = presenceStore.documentPresence(documentId).subscribe((nextPresence) => {
      setPresence(nextPresence)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [documentId, presenceStore])

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

  const displayed: Partial<SanityDocument> | undefined = useMemo(
    () =>
      viewOlderVersion
        ? historyController.displayed() || {_id: value._id, _type: value._type}
        : value,
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
    (nextFocusPath: Path) => {
      setFocusPath(nextFocusPath)
      presenceStore.setLocation([
        {
          type: 'document',
          documentId,
          path: nextFocusPath,
          lastActiveAt: new Date().toISOString(),
        },
      ])
    },
    [documentId, presenceStore, setFocusPath]
  )

  const handleBlur = useCallback(
    (blurredPath: Path) => {
      setFocusPath([])
      // note: we're deliberately not syncing presence here since it would make the user avatar disappear when a
      // user clicks outside a field without focusing another one
    },
    [setFocusPath]
  )

  const patchRef = useRef<(event: PatchEvent) => void>(() => {
    throw new Error('Nope')
  })

  patchRef.current = (event: PatchEvent) => {
    patch.execute(toMutationPatches(event.patches), initialValue.value)
  }

  const handleChange = useCallback((event: any) => patchRef.current(event), [])

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

  const [openPath, onSetOpenPath] = useState<Path>([])
  const [fieldGroupState, onSetFieldGroupState] = useState<StateTree<string>>()
  const [collapsedPaths, onSetCollapsedPath] = useState<StateTree<boolean>>()
  const [collapsedFieldSets, onSetCollapsedFieldSets] = useState<StateTree<boolean>>()

  const handleOnSetCollapsedPath = useCallback((path: Path, collapsed: boolean) => {
    onSetCollapsedPath((prevState) => setAtPath(prevState, path, collapsed))
  }, [])

  const handleOnSetCollapsedFieldSet = useCallback((path: Path, collapsed: boolean) => {
    onSetCollapsedFieldSets((prevState) => setAtPath(prevState, path, collapsed))
  }, [])

  const handleSetActiveFieldGroup = useCallback(
    (path: Path, groupName: string) =>
      onSetFieldGroupState((prevState) => setAtPath(prevState, path, groupName)),
    []
  )

  const requiredPermission = value._createdAt ? 'update' : 'create'
  const liveEdit = useMemo(() => Boolean(schemaType?.liveEdit), [documentType, schema])
  const docId = value._id ? value._id : 'dummy-id'
  const docPermissionsInput = useMemo(() => {
    return {
      ...value,
      _id: liveEdit ? getPublishedId(docId) : getDraftId(docId),
    }
  }, [liveEdit, value, docId])

  const [permissions, isPermissionsLoading] = useDocumentValuePermissions({
    document: docPermissionsInput,
    permission: requiredPermission,
  })
  const {revTime: rev} = historyController

  const isNonExistent = !value?._id

  const readOnly = useMemo(() => {
    const hasNoPermission = !isPermissionsLoading && !permissions?.granted
    const updateActionDisabled = !isActionEnabled(schemaType!, 'update')
    const createActionDisabled = isNonExistent && !isActionEnabled(schemaType!, 'create')
    const reconnecting = connectionState === 'reconnecting'

    return (
      !ready ||
      rev !== null ||
      hasNoPermission ||
      updateActionDisabled ||
      createActionDisabled ||
      reconnecting
    )
  }, [
    connectionState,
    isNonExistent,
    isPermissionsLoading,
    permissions?.granted,
    ready,
    rev,
    schemaType,
  ])

  const formState = useFormState(schemaType!, {
    value: displayed,
    readOnly,
    comparisonValue: compareValue,
    focusPath,
    openPath,
    collapsedPaths,
    presence,
    validation,
    collapsedFieldSets,
    fieldGroupState,
    changesOpen,
  })

  const formStateRef = useRef(formState)
  formStateRef.current = formState

  const handleOpenPath = useCallback(
    (path: Path) => {
      const ops = getExpandOperations(formStateRef.current!, path)
      ops.forEach((op) => {
        if (op.type === 'expandPath') {
          onSetCollapsedPath((prevState) => setAtPath(prevState, op.path, false))
        }
        if (op.type === 'expandFieldSet') {
          onSetCollapsedFieldSets((prevState) => setAtPath(prevState, op.path, false))
        }
        if (op.type === 'setSelectedGroup') {
          onSetFieldGroupState((prevState) => setAtPath(prevState, op.path, op.groupName))
        }
      })
      onSetOpenPath(path)
    },
    [formStateRef]
  )

  const documentPane: DocumentPaneContextValue = {
    actions,
    activeViewId,
    badges,
    changesOpen,
    collapsedFieldSets,
    collapsedPaths,
    compareValue,
    connectionState,
    displayed,
    documentId,
    documentIdRaw,
    documentType,
    editState,
    focusPath,
    menuItems,
    onBlur: handleBlur,
    onChange: handleChange,
    onFocus: handleFocus,
    onPathOpen: handleOpenPath,
    onHistoryClose: handleHistoryClose,
    onHistoryOpen: handleHistoryOpen,
    onInspectClose: handleInspectClose,
    onKeyUp: handleKeyUp,
    onMenuAction: handleMenuAction,
    onPaneClose: handlePaneClose,
    onPaneSplit: handlePaneSplit,
    onSetActiveFieldGroup: handleSetActiveFieldGroup,
    onSetCollapsedPath: handleOnSetCollapsedPath,
    onSetCollapsedFieldSet: handleOnSetCollapsedFieldSet,
    historyController,
    index,
    inspectOpen,
    validation,
    menuItemGroups: menuItemGroups || [],
    paneKey,
    previewUrl,
    ready,
    schemaType: schemaType!,
    isPermissionsLoading,
    permissions,
    setTimelineMode,
    setTimelineRange,
    timeline,
    timelineMode,
    title,
    value,
    views,
    formState,
    unstable_languageFilter: languageFilter,
  }

  useEffect(() => {
    if (connectionState === 'reconnecting') {
      pushToast({
        id: 'sanity/desk/reconnecting',
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
