import {useTelemetry} from '@sanity/telemetry/react'
import {
  type ObjectSchemaType,
  type Path,
  type SanityDocument,
  type SanityDocumentLike,
} from '@sanity/types'
import {fromString as pathFromString, resolveKeyedPath} from '@sanity/util/paths'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  type DocumentActionsContext,
  type DocumentActionsVersionType,
  type DocumentFieldAction,
  type EditStateFor,
  EMPTY_ARRAY,
  getPublishedId,
  getReleaseIdFromReleaseDocumentId,
  isCardinalityOneRelease,
  isGoingToUnpublish,
  isPausedCardinalityOneRelease,
  isPerspectiveWriteable,
  isVersionId,
  type PartialContext,
  pathToString,
  type ReleaseDocument,
  selectUpstreamVersion,
  useActiveReleases,
  useCopyPaste,
  useDocumentForm,
  useDocumentIdStack,
  usePerspective,
  useSchema,
  useSource,
  useTranslation,
  useUnique,
  useWorkspace,
} from 'sanity'
import {DocumentPaneContext} from 'sanity/_singletons'
import {useRouter} from 'sanity/router'

import {usePaneRouter} from '../../components'
import {useDiffViewRouter} from '../../diffView/hooks/useDiffViewRouter'
import {useDocumentLastRev} from '../../hooks/useDocumentLastRev'
import {structureLocaleNamespace} from '../../i18n'
import {type PaneMenuItem} from '../../types'
import {InlineChangesSwitchedOff, InlineChangesSwitchedOn} from './__telemetry__'
import {DEFAULT_MENU_ITEM_GROUPS, EMPTY_PARAMS, INSPECT_ACTION_PREFIX} from './constants'
import {type DocumentPaneContextValue} from './DocumentPaneContext'
import {
  type DocumentPaneProviderProps as DocumentPaneProviderWrapperProps,
  type HistoryStoreProps,
} from './types'
import {useDocumentPaneInitialValue} from './useDocumentPaneInitialValue'
import {useDocumentPaneInspector} from './useDocumentPaneInspector'
import {usePreviewUrl} from './usePreviewUrl'

interface DocumentPaneProviderProps extends DocumentPaneProviderWrapperProps {
  historyStore: HistoryStoreProps
}

/**
 * @internal
 */
// eslint-disable-next-line max-statements
export function DocumentPaneProvider(props: DocumentPaneProviderProps) {
  const {
    children,
    index,
    pane,
    paneKey,
    onFocusPath,
    onSetMaximizedPane,
    maximized = false,
    forcedVersion,
    historyStore,
  } = props
  const {
    store: timelineStore,
    error: timelineError,
    ready: timelineReady,
    revisionDocument,
    onOlderRevision,
    sinceDocument,
    isPristine,
    revisionId,
    lastNonDeletedRevId,
  } = historyStore

  const schema = useSchema()
  const {setDocumentMeta} = useCopyPaste()
  const {
    document: {
      actions: documentActions,
      badges: documentBadges,
      unstable_fieldActions: fieldActionsResolver,
      unstable_languageFilter: languageFilterResolver,
      drafts: {enabled: draftsEnabled},
    },
  } = useSource()
  const telemetry = useTelemetry()
  const router = useRouter()
  const paneRouter = usePaneRouter()
  const setPaneParams = paneRouter.setParams
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
  const perspective = usePerspective()

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
    beta,
  } = useWorkspace()

  const enhancedObjectDialogEnabled = true

  const {selectedReleaseId, selectedPerspectiveName} = useMemo(() => {
    // TODO: COREL - Remove this after updating sanity-assist to use <PerspectiveProvider>
    if (forcedVersion) {
      return forcedVersion
    }

    return {
      selectedPerspectiveName: perspective.selectedPerspectiveName,
      selectedReleaseId: perspective.selectedReleaseId,
    }
  }, [forcedVersion, perspective.selectedPerspectiveName, perspective.selectedReleaseId])

  const {data: releases = EMPTY_ARRAY} = useActiveReleases()

  const diffViewRouter = useDiffViewRouter()

  const initialValue = useDocumentPaneInitialValue({
    paneOptions,
    documentId,
    documentType,
    params,
  })

  const isInitialValueLoading = initialValue.loading
  const {
    changesOpen,
    currentInspector,
    inspectors,
    closeInspector,
    openInspector,
    handleHistoryClose,
    handleHistoryOpen,
    handleInspectorAction,
    inspectOpen,
    handleLegacyInspectClose,
  } = useDocumentPaneInspector({documentId, documentType, params, setParams: setPaneParams})

  const [isDeleting, setIsDeleting] = useState(false)
  const {lastRevisionDocument} = useDocumentLastRev(documentId, documentType)

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
  const getIsDeleted = useCallback(
    (editState: EditStateFor) => {
      if (!timelineReady) return false
      return (
        Boolean(!editState?.draft && !editState?.published && !editState?.version) && !isPristine
      )
    },
    [timelineReady, isPristine],
  )

  const getComparisonValue = useCallback(
    (upstreamEditState: EditStateFor) => {
      const upstream = selectUpstreamVersion(upstreamEditState)
      if (changesOpen) {
        return sinceDocument || upstream
      }
      return upstream || null
    },
    [changesOpen, sinceDocument],
  )

  const schemaType = schema.get(documentType) as ObjectSchemaType | undefined

  const getIsReadOnly = useCallback(
    (editState: EditStateFor): boolean => {
      const isDeleted = getIsDeleted(editState)
      const seeingHistoryDocument = Boolean(params.rev)

      // Check if current perspective is a paused scheduled draft
      const currentRelease = releases.find(
        (r) => getReleaseIdFromReleaseDocumentId(r._id) === selectedReleaseId,
      )
      const isPaused = isPausedCardinalityOneRelease(currentRelease)

      return (
        seeingHistoryDocument ||
        isDeleting ||
        isDeleted ||
        (!isPaused &&
          !isPerspectiveWriteable({
            selectedPerspective: perspective.selectedPerspective,
            isDraftModelEnabled,
            schemaType,
          }).result)
      )
    },
    [
      getIsDeleted,
      isDeleting,
      isDraftModelEnabled,
      params.rev,
      perspective.selectedPerspective,
      schemaType,
      releases,
      selectedReleaseId,
    ],
  )

  const getDisplayed = useCallback(
    (value: SanityDocumentLike) => {
      if (onOlderRevision) {
        return revisionDocument || {_id: value._id, _type: value._type}
      }

      // If the document is deleted (no draft, published, or version), return the last revision
      const isDeleted = !value._createdAt && !value._updatedAt
      if (isDeleted && lastNonDeletedRevId) {
        // Return the fetched last revision document if available
        if (lastRevisionDocument) {
          return lastRevisionDocument
        }
      }

      return value
    },
    [onOlderRevision, revisionDocument, lastNonDeletedRevId, lastRevisionDocument],
  )

  const {
    editState,
    upstreamEditState,
    hasUpstreamVersion,
    connectionState,
    focusPath,
    onChange,
    validation,
    ready: formReady,
    value,
    formState,
    permissions,
    onPathOpen,
    isPermissionsLoading,
    formStateRef,
    onProgrammaticFocus,

    collapsedFieldSets,
    collapsedPaths,
    onBlur,
    onFocus,
    onSetActiveFieldGroup,
    onSetCollapsedPath,
    onSetCollapsedFieldSet,
    openPath,
  } = useDocumentForm({
    changesOpen,
    documentType,
    documentId,
    initialValue: initialValue,
    comparisonValue: getComparisonValue,
    releaseId: selectedPerspectiveName,
    selectedPerspectiveName,
    initialFocusPath: params.path ? pathFromString(params.path) : EMPTY_ARRAY,
    readOnly: getIsReadOnly,
    onFocusPath,
    getFormDocumentValue: getDisplayed,
    displayInlineChanges: router.stickyParams.displayInlineChanges === 'true',
  })

  const actionsVersionType = useMemo(
    () =>
      getDocumentVersionType(
        params,
        selectedReleaseId,
        value,
        selectedPerspectiveName,
        draftsEnabled,
        releases,
      ),
    [params, selectedReleaseId, value, selectedPerspectiveName, draftsEnabled, releases],
  )

  const documentActionsContext: PartialContext<DocumentActionsContext> = useMemo(
    () => ({
      schemaType: documentType,
      documentId,
      versionType: actionsVersionType,
      releaseId: selectedReleaseId,
    }),
    [documentType, documentId, actionsVersionType, selectedReleaseId],
  )

  // Resolve document actions
  const actions = useMemo(
    () => documentActions(documentActionsContext),
    [documentActions, documentActionsContext],
  )

  const handlePathOpen = useCallback(
    (path: Path) => {
      // Update internal open path
      onPathOpen(path)

      if (enhancedObjectDialogEnabled) {
        /**
         * Before we used to set the path open based on the focus path
         * Now we set it based on open path, which changes what it represents and is something that could become a source of confusion.
         * There is upcoming work to refactor this and other aspects of the control of the focus path which means that this might return to the focus path in the future.
         */
        const nextPath = pathToString(path)
        if (params.path !== nextPath) {
          setPaneParams({...params, path: nextPath})
        }
      }
    },
    [onPathOpen, params, setPaneParams, enhancedObjectDialogEnabled],
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

  const views = useUnique(viewsProp)

  const activeViewId = params.view || (views[0] && views[0].id) || null

  // TODO: this may cause a lot of churn. May be a good idea to prevent these
  // requests unless the menu is open somehow
  const previewUrl = usePreviewUrl(value)

  const {t} = useTranslation(structureLocaleNamespace)

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
  const ready = formReady && (!params.rev || timelineReady || !!timelineError)

  const displayed: Partial<SanityDocument> | undefined = useMemo(
    () => getDisplayed(value),
    [getDisplayed, value],
  )

  const {previousId} = useDocumentIdStack({
    strict: true,
    displayed,
    documentId,
    editState,
  })

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

  const handlePaneClose = useCallback(() => paneRouter.closeCurrent(), [paneRouter])

  const handlePaneSplit = useCallback(() => paneRouter.duplicateCurrent(), [paneRouter])

  const toggleInlineChanges = useCallback(() => {
    const nextState = router.stickyParams.displayInlineChanges !== 'true'
    telemetry.log(nextState ? InlineChangesSwitchedOn : InlineChangesSwitchedOff)

    router.navigate({
      stickyParams: {
        displayInlineChanges: String(nextState),
      },
    })
  }, [router, telemetry])

  const handleMenuAction = useCallback(
    async (item: PaneMenuItem) => {
      if (item.action === 'production-preview' && previewUrl) {
        window.open(previewUrl)
        return true
      }

      if (item.action === 'reviewChanges') {
        handleHistoryOpen()
        return true
      }

      if (
        item.action === 'inspect' ||
        (typeof item.action === 'string' && item.action.startsWith(INSPECT_ACTION_PREFIX))
      ) {
        handleInspectorAction(item)
      }

      if (item.action === 'compareVersions' && typeof previousId !== 'undefined') {
        diffViewRouter.navigateDiffView({
          mode: 'version',
          previousDocument: {
            type: documentType,
            id: previousId,
          },
          nextDocument: {
            type: documentType,
            id: value._id,
          },
        })
        return true
      }

      if (item.action === 'toggleInlineChanges') {
        toggleInlineChanges()
        return true
      }

      return false
    },
    [
      previewUrl,
      previousId,
      documentType,
      handleHistoryOpen,
      handleInspectorAction,
      diffViewRouter,
      value._id,
      toggleInlineChanges,
    ],
  )

  useEffect(() => {
    setDocumentMeta({
      documentId,
      documentType,
      schemaType: schemaType!,
      onChange,
    })
  }, [documentId, documentType, schemaType, onChange, setDocumentMeta])

  const compareValue = useMemo(
    () => getComparisonValue(upstreamEditState),
    [upstreamEditState, getComparisonValue],
  )

  const isDeleted = useMemo(() => getIsDeleted(editState), [editState, getIsDeleted])
  const revisionNotFound = onOlderRevision && !revisionDocument && ready

  const currentDisplayed = useMemo(() => {
    if (editState.version && isGoingToUnpublish(editState.version)) {
      return editState.published
    }
    return displayed
  }, [editState.version, editState.published, displayed])

  const documentPane: DocumentPaneContextValue = useMemo(
    () =>
      ({
        actions,
        activeViewId,
        badges,
        changesOpen,
        closeInspector,
        collapsedFieldSets,
        collapsedPaths,
        compareValue,
        connectionState,
        displayed: currentDisplayed,
        documentId,
        documentIdRaw,
        documentType,
        editState,
        fieldActions,
        focusPath,
        inspector: currentInspector || null,
        inspectors,
        onBlur,
        onChange,
        onFocus,
        onPathOpen: handlePathOpen,
        onHistoryClose: handleHistoryClose,
        onHistoryOpen: handleHistoryOpen,
        onInspectClose: handleLegacyInspectClose,
        onMenuAction: handleMenuAction,
        onPaneClose: handlePaneClose,
        onPaneSplit: handlePaneSplit,
        onSetActiveFieldGroup,
        onSetCollapsedPath,
        onSetCollapsedFieldSet,
        onSetMaximizedPane,
        maximized,
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
        hasUpstreamVersion,
        isPermissionsLoading,
        isInitialValueLoading,
        permissions,
        setTimelineRange,
        setIsDeleting,
        isDeleting,
        isDeleted,
        timelineError,
        timelineStore,
        title,
        value,
        selectedReleaseId,
        views,
        formState,
        unstable_languageFilter: languageFilter,
        revisionId,
        revisionNotFound,
        lastNonDeletedRevId,
        lastRevisionDocument,
      }) satisfies DocumentPaneContextValue,
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
      currentDisplayed,
      documentId,
      documentIdRaw,
      documentType,
      editState,
      fieldActions,
      focusPath,
      currentInspector,
      inspectors,
      onBlur,
      onChange,
      onFocus,
      handlePathOpen,
      handleHistoryClose,
      handleHistoryOpen,
      handleLegacyInspectClose,
      handleMenuAction,
      handlePaneClose,
      handlePaneSplit,
      onSetActiveFieldGroup,
      onSetCollapsedPath,
      onSetCollapsedFieldSet,
      onSetMaximizedPane,
      maximized,
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
      hasUpstreamVersion,
      isPermissionsLoading,
      isInitialValueLoading,
      permissions,
      setTimelineRange,
      isDeleting,
      isDeleted,
      timelineError,
      timelineStore,
      title,
      value,
      selectedReleaseId,
      views,
      formState,
      languageFilter,
      revisionId,
      revisionNotFound,
      lastNonDeletedRevId,
      lastRevisionDocument,
    ],
  )

  const pathRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (ready && params.path) {
      const {path, ...restParams} = params

      // Only trigger a programmatic focus when the URL path changed AND the
      // form's openPath doesn't already reflect it.  When handlePathOpen updates
      // both the form state and the URL, the form is already in sync — calling
      // onProgrammaticFocus again would re-set focusPath/openPath and cause
      // cascading state updates that flicker nested dialogs.
      const currentOpenPathString = pathToString(openPath)
      if (path !== pathRef.current && path !== currentOpenPathString) {
        const pathFromUrl = resolveKeyedPath(formStateRef.current?.value, pathFromString(path))
        onProgrammaticFocus(pathFromUrl)
      }

      if (!enhancedObjectDialogEnabled) {
        // remove the `path`-param from url after we have consumed it as the initial focus path
        paneRouter.setParams(restParams)
      }
    }
    pathRef.current = params.path

    return undefined
  }, [
    formStateRef,
    onProgrammaticFocus,
    paneRouter,
    params,
    ready,
    enhancedObjectDialogEnabled,
    openPath,
  ])

  return (
    <DocumentPaneContext.Provider value={documentPane}>{children}</DocumentPaneContext.Provider>
  )
}

// eslint-disable-next-line max-params
function getDocumentVersionType(
  params: Record<string, string | undefined> | undefined,
  selectedReleaseId: string | undefined,
  value: SanityDocumentLike,
  selectedPerspectiveName: string | undefined,
  draftsEnabled: boolean,
  releases: ReleaseDocument[],
) {
  let version: DocumentActionsVersionType
  switch (true) {
    case Boolean(params?.rev):
      version = 'revision'
      break
    case selectedReleaseId && isVersionId(value._id): {
      // Check if this is a scheduled draft (cardinality one release)
      const releaseDocument = releases.find(
        (r) => getReleaseIdFromReleaseDocumentId(r._id) === selectedReleaseId,
      )

      if (releaseDocument && isCardinalityOneRelease(releaseDocument)) {
        version = 'scheduled-draft'
      } else {
        version = 'version'
      }
      break
    }
    case selectedPerspectiveName === 'published':
      version = 'published'
      break
    case draftsEnabled:
      version = 'draft'
      break
    default:
      version = 'published'
  }

  return version
}
