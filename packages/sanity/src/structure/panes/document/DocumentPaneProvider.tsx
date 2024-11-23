/* eslint-disable camelcase */
import {isActionEnabled} from '@sanity/schema/_internal'
import {useTelemetry} from '@sanity/telemetry/react'
import {
  type ObjectSchemaType,
  type Path,
  type SanityDocument,
  type SanityDocumentLike,
} from '@sanity/types'
import {useToast} from '@sanity/ui'
import {fromString as pathFromString, pathFor, resolveKeyedPath} from '@sanity/util/paths'
import {omit, throttle} from 'lodash'
import {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import deepEquals from 'react-fast-compare'
import {
  type DocumentActionsContext,
  type DocumentActionsVersionType,
  type DocumentFieldAction,
  type DocumentInspector,
  type DocumentPresence,
  EMPTY_ARRAY,
  getDraftId,
  getExpandOperations,
  getPublishedId,
  getReleaseIdFromReleaseDocumentId,
  isReleaseScheduledOrScheduling,
  isSanityCreateLinkedDocument,
  isVersionId,
  type OnPathFocusPayload,
  type PartialContext,
  type PatchEvent,
  setAtPath,
  type StateTree,
  toMutationPatches,
  useConnectionState,
  useCopyPaste,
  useDocumentOperation,
  useDocumentValuePermissions,
  useDocumentVersions,
  useEditState,
  useFormState,
  useInitialValue,
  usePerspective,
  usePresenceStore,
  useSchema,
  useSource,
  useTemplates,
  useTimelineSelector,
  useTranslation,
  useUnique,
  useValidationStatus,
} from 'sanity'
import {DocumentPaneContext} from 'sanity/_singletons'

import {usePaneRouter} from '../../components'
import {structureLocaleNamespace} from '../../i18n'
import {type PaneMenuItem} from '../../types'
import {useStructureTool} from '../../useStructureTool'
import {CreatedDraft, DocumentURLCopied} from './__telemetry__'
import {
  DEFAULT_MENU_ITEM_GROUPS,
  EMPTY_PARAMS,
  HISTORY_INSPECTOR_NAME,
  INSPECT_ACTION_PREFIX,
} from './constants'
import {type DocumentPaneContextValue} from './DocumentPaneContext'
import {getInitialValueTemplateOpts} from './getInitialValueTemplateOpts'
import {useHistory} from './HistoryProvider'
import {type DocumentPaneProviderProps} from './types'
import {usePreviewUrl} from './usePreviewUrl'

/**
 * @internal
 */
// eslint-disable-next-line complexity, max-statements
export const DocumentPaneProvider = memo((props: DocumentPaneProviderProps) => {
  const {children, index, pane, paneKey, onFocusPath} = props
  const schema = useSchema()
  const templates = useTemplates()
  const {setDocumentMeta} = useCopyPaste()
  const {
    __internal_tasks,
    document: {
      actions: documentActions,
      badges: documentBadges,
      unstable_fieldActions: fieldActionsResolver,
      unstable_languageFilter: languageFilterResolver,
      inspectors: inspectorsResolver,
    },
  } = useSource()
  const presenceStore = usePresenceStore()
  const paneRouter = usePaneRouter()
  const setPaneParams = paneRouter.setParams
  const {features} = useStructureTool()
  const {push: pushToast} = useToast()
  const {
    options,
    menuItemGroups = DEFAULT_MENU_ITEM_GROUPS,
    title = null,
    views: viewsProp = [],
  } = pane
  const paneOptions = useUnique(options)
  const documentIdRaw = paneOptions.id
  const documentId = getPublishedId(documentIdRaw)
  const documentType = options.type
  const params = useUnique(paneRouter.params) || EMPTY_PARAMS
  const {
    selectedPerspectiveName,
    selectedReleaseId: globalSelectedReleaseId,
    selectedPerspective,
  } = usePerspective()
  const seeingHistoricVersion = Boolean(params.historyVersion)

  const selectedReleaseId = seeingHistoricVersion ? params.historyVersion : globalSelectedReleaseId

  /* Version and the global perspective should match.
   * If user clicks on add document, and then switches to another version, he should click again on create document.
   */
  const newDocumentVersion = params.version === selectedPerspectiveName ? params.version : undefined

  const panePayload = useUnique(paneRouter.payload)
  const {templateName, templateParams} = useMemo(
    () =>
      getInitialValueTemplateOpts(templates, {
        documentType,
        templateName: paneOptions.template,
        templateParams: paneOptions.templateParameters,
        panePayload,
        urlTemplate: params.template,
      }),
    [documentType, paneOptions, params, panePayload, templates],
  )
  const initialValueRaw = useInitialValue({
    documentId,
    documentType,
    templateName,
    templateParams,
    version: selectedReleaseId,
  })

  const initialValue = useUnique(initialValueRaw)

  const {patch} = useDocumentOperation(documentId, documentType, selectedReleaseId)
  const schemaType = schema.get(documentType) as ObjectSchemaType | undefined
  const editState = useEditState(documentId, documentType, 'default', selectedReleaseId)
  const {validation: validationRaw} = useValidationStatus(
    documentId,
    documentType,
    selectedReleaseId,
  )
  const connectionState = useConnectionState(documentId, documentType, {
    version: selectedReleaseId,
  })
  const {data: documentVersions} = useDocumentVersions({documentId})

  let value: SanityDocumentLike = initialValue.value

  switch (true) {
    case typeof selectedReleaseId !== 'undefined':
      value = editState.version || editState.draft || editState.published || value
      break
    case selectedPerspectiveName === 'published':
      value = editState.published || editState.draft || value
      break
    default:
      value = editState?.draft || editState?.published || value
  }

  const [isDeleting, setIsDeleting] = useState(false)

  const getDocumentVersionType = useCallback(() => {
    let version: DocumentActionsVersionType
    switch (true) {
      /**
       * bundle Perspective will always be undefined in published and draft but not on version
       * should also check if the current value is a version otherwise this would impact the document actions
       */
      case typeof selectedPerspectiveName !== 'undefined' && isVersionId(value._id):
        version = 'version'
        break
      case Boolean(params):
        version = 'revision'
        break
      case selectedPerspectiveName === 'published':
        version = 'published'
        break
      default:
        version = 'draft'
    }

    return version
  }, [selectedPerspectiveName, params, value._id])

  const actionsPerspective = useMemo(() => getDocumentVersionType(), [getDocumentVersionType])

  const documentActionsProps: PartialContext<DocumentActionsContext> = useMemo(
    () => ({
      schemaType: documentType,
      documentId,
      versionType: actionsPerspective,
      ...(selectedPerspectiveName && {versionName: selectedReleaseId}),
    }),
    [documentType, documentId, actionsPerspective, selectedPerspectiveName, selectedReleaseId],
  )

  // Resolve document actions
  const actions = useMemo(
    () => documentActions(documentActionsProps),
    [documentActions, documentActionsProps],
  )

  // Resolve document badges
  const badges = useMemo(
    () => documentBadges({schemaType: documentType, documentId}),
    [documentBadges, documentId, documentType],
  )

  // Resolve document language filter
  const languageFilter = useMemo(
    () => languageFilterResolver({schemaType: documentType, documentId}),
    [documentId, documentType, languageFilterResolver],
  )

  const validation = useUnique(validationRaw)
  const views = useUnique(viewsProp)

  const [focusPath, setFocusPath] = useState<Path>(() =>
    params.path ? pathFromString(params.path) : EMPTY_ARRAY,
  )
  const focusPathRef = useRef<Path>([])
  const activeViewId = params.view || (views[0] && views[0].id) || null
  const [timelineMode, setTimelineMode] = useState<'since' | 'rev' | 'closed'>('closed')

  const {store: timelineStore, error: timelineError, eventsStore} = useHistory()
  // Subscribe to external timeline state changes
  const onOlderRevision = useTimelineSelector(timelineStore, (state) => state.onOlderRevision)
  const revTime = useTimelineSelector(timelineStore, (state) => state.revTime)
  const sinceAttributes = useTimelineSelector(timelineStore, (state) => state.sinceAttributes)
  const timelineDisplayed = useTimelineSelector(timelineStore, (state) => state.timelineDisplayed)
  const timelineReady = useTimelineSelector(timelineStore, (state) => state.timelineReady)
  const isPristine = useTimelineSelector(timelineStore, (state) => state.isPristine)

  /**
   * Determine if the current document is deleted.
   *
   * When the timeline is available – we check for the absence of an editable document pair
   * (both draft + published versions) as well as a non 'pristine' timeline (i.e. a timeline that consists
   * of at least one chunk).
   *
   * In the _very rare_ case where the timeline cannot be loaded – we skip this check and always assume
   * the document is NOT deleted. Since we can't accurately determine document deleted status without history,
   * skipping this check means that in these cases, users will at least be able to create new documents
   * without them being incorrectly marked as deleted.
   */
  const isDeleted = useMemo(() => {
    if (!timelineReady) {
      return false
    }
    return Boolean(!editState?.draft && !editState?.published && !editState?.version) && !isPristine
  }, [editState?.draft, editState?.published, editState?.version, isPristine, timelineReady])

  // TODO: this may cause a lot of churn. May be a good idea to prevent these
  // requests unless the menu is open somehow
  const previewUrl = usePreviewUrl(value)

  const [presence, setPresence] = useState<DocumentPresence[]>([])
  useEffect(() => {
    const subscription = presenceStore.documentPresence(value._id).subscribe((nextPresence) => {
      setPresence(nextPresence)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [presenceStore, value._id])

  const inspectors: DocumentInspector[] = useMemo(
    () => inspectorsResolver({documentId, documentType}),
    [documentId, documentType, inspectorsResolver],
  )

  const [inspectorName, setInspectorName] = useState<string | null>(() => params.inspect || null)

  // Handle inspector name changes from URL
  const inspectParamRef = useRef<string | undefined>(params.inspect)
  useEffect(() => {
    if (inspectParamRef.current !== params.inspect) {
      inspectParamRef.current = params.inspect
      setInspectorName(params.inspect || null)
    }
  }, [params.inspect])

  const currentInspector = inspectors?.find((i) => i.name === inspectorName)
  const resolvedChangesInspector = inspectors.find((i) => i.name === HISTORY_INSPECTOR_NAME)

  const changesOpen = currentInspector?.name === HISTORY_INSPECTOR_NAME

  const {t} = useTranslation(structureLocaleNamespace)

  const inspectOpen = params.inspect === 'on'
  const compareValue: Partial<SanityDocument> | null = useMemo(() => {
    if (eventsStore?.enabled) {
      return changesOpen
        ? eventsStore?.sinceRevision?.document || null
        : editState?.published || null
    }
    return changesOpen ? sinceAttributes : editState?.published || null
  }, [
    changesOpen,
    editState?.published,
    eventsStore?.enabled,
    eventsStore?.sinceRevision?.document,
    sinceAttributes,
  ])

  const fieldActions: DocumentFieldAction[] = useMemo(
    () => (schemaType ? fieldActionsResolver({documentId, documentType, schemaType}) : []),
    [documentId, documentType, fieldActionsResolver, schemaType],
  )

  /**
   * Note that in addition to connection and edit state, we also wait for a valid document timeline
   * range to be loaded. This means if we're loading an older revision, the full transaction range must
   * be loaded in full prior to the document being displayed.
   *
   * Previously, visiting studio URLs with timeline params would display the 'current' document and then
   * 'snap' in the older revision, which was disorienting and could happen mid-edit.
   *
   * In the event that the timeline cannot be loaded due to TimelineController errors or blocked requests,
   * we skip this readiness check to ensure that users aren't locked out of editing. Trying to select
   * a timeline revision in this instance will display an error localized to the popover itself.
   */
  const ready =
    connectionState === 'connected' &&
    editState.ready &&
    (!params.rev || timelineReady || !!timelineError)

  const displayed: Partial<SanityDocument> | undefined = useMemo(() => {
    if (eventsStore?.revision?.revisionId) {
      return eventsStore?.revision?.document || {_id: value._id, _type: value._type}
    }
    if (onOlderRevision) {
      console.log('RETURNING OLDER REVISION; WHY ARE WE HERE???')
      return timelineDisplayed || {_id: value._id, _type: value._type}
    }
    return value
  }, [
    eventsStore?.revision?.document,
    eventsStore?.revision?.revisionId,
    onOlderRevision,
    timelineDisplayed,
    value,
  ])

  const setTimelineRange = useCallback(
    (newSince: string, newRev: string | null) => {
      setPaneParams({
        ...params,
        since: newSince,
        rev: newRev || undefined,
      })
    },
    [params, setPaneParams],
  )

  const handleBlur = useCallback(
    (blurredPath: Path) => {
      if (disableBlurRef.current) {
        return
      }

      setFocusPath(EMPTY_ARRAY)

      if (focusPathRef.current !== EMPTY_ARRAY) {
        focusPathRef.current = EMPTY_ARRAY
        onFocusPath?.(EMPTY_ARRAY)
      }

      // note: we're deliberately not syncing presence here since it would make the user avatar disappear when a
      // user clicks outside a field without focusing another one
    },
    [onFocusPath, setFocusPath],
  )

  const patchRef = useRef<(event: PatchEvent) => void>(() => {
    throw new Error('Nope')
  })

  patchRef.current = (event: PatchEvent) => {
    // when creating a new draft
    if (!editState.draft && !editState.published && !editState.version) {
      telemetry.log(CreatedDraft)
    }
    patch.execute(toMutationPatches(event.patches), initialValue.value)
  }

  const handleChange = useCallback((event: PatchEvent) => patchRef.current(event), [])

  const closeInspector = useCallback(
    (closeInspectorName?: string) => {
      // inspector?: DocumentInspector
      const inspector = closeInspectorName && inspectors.find((i) => i.name === closeInspectorName)

      if (closeInspectorName && !inspector) {
        console.warn(`No inspector named "${closeInspectorName}"`)
        return
      }

      if (!currentInspector) {
        return
      }

      if (inspector) {
        const result = inspector.onClose?.({params}) ?? {params}

        setInspectorName(null)
        inspectParamRef.current = undefined

        setPaneParams({...result.params, inspect: undefined})

        return
      }

      if (currentInspector) {
        const result = currentInspector.onClose?.({params}) ?? {params}

        setInspectorName(null)
        inspectParamRef.current = undefined

        setPaneParams({...result.params, inspect: undefined})
      }
    },
    [currentInspector, inspectors, params, setPaneParams],
  )

  const openInspector = useCallback(
    (nextInspectorName: string, paneParams?: Record<string, string>) => {
      const nextInspector = inspectors.find((i) => i.name === nextInspectorName)

      if (!nextInspector) {
        console.warn(`No inspector named "${nextInspectorName}"`)
        return
      }

      // if the inspector is already open, only update params
      if (currentInspector?.name === nextInspector.name) {
        setPaneParams({...params, ...paneParams, inspect: nextInspector.name})
        return
      }

      let currentParams = params

      if (currentInspector) {
        const closeResult = nextInspector.onClose?.({params: currentParams}) ?? {
          params: currentParams,
        }

        currentParams = closeResult.params
      }

      const result = nextInspector.onOpen?.({params: currentParams}) ?? {params: currentParams}

      setInspectorName(nextInspector.name)
      inspectParamRef.current = nextInspector.name

      setPaneParams({...result.params, ...paneParams, inspect: nextInspector.name})
    },
    [currentInspector, inspectors, params, setPaneParams],
  )

  const handleHistoryClose = useCallback(() => {
    if (resolvedChangesInspector) {
      closeInspector(resolvedChangesInspector.name)
    }
  }, [closeInspector, resolvedChangesInspector])

  const handleHistoryOpen = useCallback(() => {
    if (!features.reviewChanges) {
      return
    }

    if (resolvedChangesInspector) {
      openInspector(resolvedChangesInspector.name, {changesInspectorTab: 'review'})
    }
  }, [features.reviewChanges, openInspector, resolvedChangesInspector])

  const handlePaneClose = useCallback(() => paneRouter.closeCurrent(), [paneRouter])

  const handlePaneSplit = useCallback(() => paneRouter.duplicateCurrent(), [paneRouter])

  const toggleLegacyInspect = useCallback(
    (toggle = !inspectOpen) => {
      if (toggle) {
        setPaneParams({...params, inspect: 'on'})
      } else {
        setPaneParams(omit(params, 'inspect'))
      }
    },
    [inspectOpen, params, setPaneParams],
  )

  const telemetry = useTelemetry()

  const handleMenuAction = useCallback(
    (item: PaneMenuItem) => {
      if (item.action === 'production-preview' && previewUrl) {
        window.open(previewUrl)
        return true
      }

      if (item.action === 'copy-document-url' && navigator) {
        telemetry.log(DocumentURLCopied)
        // Chose to copy the user's current URL instead of
        // the document's edit intent link because
        // of bugs when resolving a document that has
        // multiple access paths within Structure
        navigator.clipboard.writeText(window.location.toString())
        pushToast({
          id: 'copy-document-url',
          status: 'info',
          title: t('panes.document-operation-results.operation-success_copy-url'),
        })
        return true
      }

      if (item.action === 'inspect') {
        toggleLegacyInspect(true)
        return true
      }

      if (item.action === 'reviewChanges') {
        handleHistoryOpen()
        return true
      }

      if (typeof item.action === 'string' && item.action.startsWith(INSPECT_ACTION_PREFIX)) {
        const nextInspectorName = item.action.slice(INSPECT_ACTION_PREFIX.length)
        const nextInspector = inspectors.find((i) => i.name === nextInspectorName)

        if (nextInspector) {
          if (nextInspector.name === inspectorName) {
            closeInspector(nextInspector.name)
          } else {
            openInspector(nextInspector.name)
          }
          return true
        }
      }

      return false
    },
    [
      t,
      closeInspector,
      handleHistoryOpen,
      inspectorName,
      inspectors,
      openInspector,
      previewUrl,
      toggleLegacyInspect,
      pushToast,
      telemetry,
    ],
  )

  const handleLegacyInspectClose = useCallback(
    () => toggleLegacyInspect(false),
    [toggleLegacyInspect],
  )

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
    [],
  )

  const requiredPermission = value._createdAt ? 'update' : 'create'
  const liveEdit = Boolean(schemaType?.liveEdit)
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

  const isCreateLinked = isSanityCreateLinkedDocument(value)
  const isNonExistent = !value?._id
  const existsInBundle =
    typeof selectedReleaseId !== 'undefined' &&
    documentVersions.some(
      (version) => getReleaseIdFromReleaseDocumentId(version._id) === selectedReleaseId,
    )

  const readOnly = useMemo(() => {
    const hasNoPermission = !isPermissionsLoading && !permissions?.granted
    const updateActionDisabled = !isActionEnabled(schemaType!, 'update')
    const createActionDisabled = isNonExistent && !isActionEnabled(schemaType!, 'create')
    const reconnecting = connectionState === 'reconnecting'
    const isLocked = editState.transactionSyncLock?.enabled
    // in cases where the document has drafts but the schema is live edit,
    // there is a risk of data loss, so we disable editing in this case
    const isLiveEditAndDraftPerspective = liveEdit && !selectedPerspectiveName
    const isLiveEditAndPublishedPerspective = liveEdit && selectedPerspectiveName === 'published'
    const isSystemPerspectiveApplied =
      isLiveEditAndPublishedPerspective || (selectedPerspectiveName ? existsInBundle : true)

    const isReleaseLocked =
      typeof selectedPerspective === 'object' && 'state' in selectedPerspective
        ? isReleaseScheduledOrScheduling(selectedPerspective)
        : false

    return (
      !isSystemPerspectiveApplied ||
      !ready ||
      revTime !== null ||
      hasNoPermission ||
      updateActionDisabled ||
      createActionDisabled ||
      reconnecting ||
      isLocked ||
      isDeleting ||
      isDeleted ||
      isLiveEditAndDraftPerspective ||
      isCreateLinked ||
      isReleaseLocked
    )
  }, [
    isPermissionsLoading,
    permissions?.granted,
    schemaType,
    isNonExistent,
    connectionState,
    editState.transactionSyncLock?.enabled,
    liveEdit,
    selectedPerspectiveName,
    selectedPerspective,
    existsInBundle,
    ready,
    revTime,
    isDeleting,
    isDeleted,
    isCreateLinked,
  ])

  const formState = useFormState({
    schemaType: schemaType!,
    documentValue: displayed,
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

  useEffect(() => {
    setDocumentMeta({
      documentId,
      documentType,
      schemaType: schemaType!,
      onChange: handleChange,
    })
  }, [documentId, documentType, schemaType, handleChange, setDocumentMeta])

  const formStateRef = useRef(formState)
  formStateRef.current = formState

  const setOpenPath = useCallback(
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
    [formStateRef],
  )

  const updatePresence = useCallback(
    (nextFocusPath: Path, payload?: OnPathFocusPayload) => {
      presenceStore.setLocation([
        {
          type: 'document',
          documentId: value._id,
          path: nextFocusPath,
          lastActiveAt: new Date().toISOString(),
          selection: payload?.selection,
        },
      ])
    },
    [presenceStore, value._id],
  )

  const updatePresenceThrottled = useMemo(
    () => throttle(updatePresence, 1000, {leading: true, trailing: true}),
    [updatePresence],
  )

  const handleFocus = useCallback(
    (_nextFocusPath: Path, payload?: OnPathFocusPayload) => {
      const nextFocusPath = pathFor(_nextFocusPath)
      if (nextFocusPath !== focusPathRef.current) {
        setFocusPath(pathFor(nextFocusPath))
        setOpenPath(pathFor(nextFocusPath.slice(0, -1)))
        focusPathRef.current = nextFocusPath
        onFocusPath?.(nextFocusPath)
      }
      updatePresenceThrottled(nextFocusPath, payload)
    },
    [onFocusPath, setOpenPath, updatePresenceThrottled],
  )

  const documentPane: DocumentPaneContextValue = useMemo(
    () => ({
      actions,
      activeViewId,
      badges,
      changesOpen,
      closeInspector,
      collapsedFieldSets,
      collapsedPaths,
      compareValue,
      connectionState,
      displayed,
      documentId,
      documentIdRaw,
      documentType,
      documentVersions,
      editState,
      existsInBundle,
      fieldActions,
      focusPath,
      inspector: currentInspector || null,
      inspectors,
      __internal_tasks,
      onBlur: handleBlur,
      onChange: handleChange,
      onFocus: handleFocus,
      onPathOpen: setOpenPath,
      onHistoryClose: handleHistoryClose,
      onHistoryOpen: handleHistoryOpen,
      onInspectClose: handleLegacyInspectClose,
      onMenuAction: handleMenuAction,
      onPaneClose: handlePaneClose,
      onPaneSplit: handlePaneSplit,
      onSetActiveFieldGroup: handleSetActiveFieldGroup,
      onSetCollapsedPath: handleOnSetCollapsedPath,
      onSetCollapsedFieldSet: handleOnSetCollapsedFieldSet,
      openInspector,
      openPath,
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
      setIsDeleting,
      isDeleting,
      isDeleted,
      timelineError,
      timelineMode,
      timelineStore,
      title,
      value,
      selectedVersionName: selectedPerspectiveName,
      selectedReleaseId,
      views,
      formState,
      unstable_languageFilter: languageFilter,
    }),
    [
      actions,
      activeViewId,
      badges,
      changesOpen,
      closeInspector,
      collapsedFieldSets,
      collapsedPaths,
      compareValue,
      connectionState,
      displayed,
      documentId,
      documentIdRaw,
      documentType,
      documentVersions,
      editState,
      existsInBundle,
      fieldActions,
      focusPath,
      currentInspector,
      inspectors,
      __internal_tasks,
      handleBlur,
      handleChange,
      handleFocus,
      setOpenPath,
      handleHistoryClose,
      handleHistoryOpen,
      handleLegacyInspectClose,
      handleMenuAction,
      handlePaneClose,
      handlePaneSplit,
      handleSetActiveFieldGroup,
      handleOnSetCollapsedPath,
      handleOnSetCollapsedFieldSet,
      openInspector,
      openPath,
      index,
      inspectOpen,
      validation,
      menuItemGroups,
      paneKey,
      previewUrl,
      ready,
      schemaType,
      isPermissionsLoading,
      permissions,
      setTimelineRange,
      isDeleting,
      isDeleted,
      timelineError,
      timelineMode,
      timelineStore,
      title,
      value,
      selectedPerspectiveName,
      selectedReleaseId,
      views,
      formState,
      languageFilter,
    ],
  )

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    if (connectionState === 'reconnecting') {
      timeout = setTimeout(() => {
        pushToast({
          id: 'sanity/structure/reconnecting',
          status: 'warning',
          title: t('panes.document-pane-provider.reconnecting.title'),
        })
      }, 2000) // 2 seconds, we can iterate on the value
    }
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [connectionState, pushToast, t])

  const disableBlurRef = useRef(false)

  // Reset `focusPath` when `documentId` or `params.path` changes
  useEffect(() => {
    if (ready && params.path) {
      const {path, ...restParams} = params
      const pathFromUrl = resolveKeyedPath(formStateRef.current?.value, pathFromString(path))

      disableBlurRef.current = true

      // Reset focus path when url params path changes
      if (!deepEquals(focusPathRef.current, pathFromUrl)) {
        setFocusPath(pathFromUrl)
        setOpenPath(pathFromUrl)
        focusPathRef.current = pathFromUrl
        onFocusPath?.(pathFromUrl)
      }

      const timeout = setTimeout(() => {
        disableBlurRef.current = false
      }, 0)

      // remove the `path`-param from url after we have consumed it as the initial focus path
      paneRouter.setParams(restParams)

      return () => clearTimeout(timeout)
    }

    return undefined
  }, [params, documentId, onFocusPath, setOpenPath, ready, paneRouter])

  return (
    <DocumentPaneContext.Provider value={documentPane}>{children}</DocumentPaneContext.Provider>
  )
})

DocumentPaneProvider.displayName = 'Memo(DocumentPaneProvider)'
