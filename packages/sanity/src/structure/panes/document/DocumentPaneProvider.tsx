/* eslint-disable camelcase */
import {useTelemetry} from '@sanity/telemetry/react'
import {type ObjectSchemaType, type SanityDocument, type SanityDocumentLike} from '@sanity/types'
import {useToast} from '@sanity/ui'
import {fromString as pathFromString, resolveKeyedPath} from '@sanity/util/paths'
import {memo, useCallback, useEffect, useMemo, useState} from 'react'
import {
  type DocumentActionsContext,
  type DocumentActionsVersionType,
  type DocumentFieldAction,
  type EditStateFor,
  EMPTY_ARRAY,
  getPublishedId,
  isVersionId,
  type PartialContext,
  useCopyPaste,
  useDocumentForm,
  usePerspective,
  useSchema,
  useSource,
  useTranslation,
  useUnique,
} from 'sanity'
import {DocumentPaneContext} from 'sanity/_singletons'

import {usePaneRouter} from '../../components'
import {useDiffViewRouter} from '../../diffView/hooks/useDiffViewRouter'
import {useDocumentIdStack} from '../../hooks/useDocumentIdStack'
import {structureLocaleNamespace} from '../../i18n'
import {type PaneMenuItem} from '../../types'
import {DocumentURLCopied} from './__telemetry__'
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
// eslint-disable-next-line complexity, max-statements
export const DocumentPaneProvider = memo((props: DocumentPaneProviderProps) => {
  const {children, index, pane, paneKey, onFocusPath, forcedVersion, historyStore} = props
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
    },
  } = useSource()
  const telemetry = useTelemetry()
  const paneRouter = usePaneRouter()
  const setPaneParams = paneRouter.setParams
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

  const perspective = usePerspective()

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
    (editState: EditStateFor) => {
      return changesOpen ? sinceDocument : editState?.published || null
    },
    [changesOpen, sinceDocument],
  )

  const schemaType = schema.get(documentType) as ObjectSchemaType | undefined

  const getIsReadOnly = useCallback(
    (editState: EditStateFor): boolean => {
      const isDeleted = getIsDeleted(editState)
      const seeingHistoryDocument = revisionId !== null
      return seeingHistoryDocument || isDeleting || isDeleted
    },
    [getIsDeleted, isDeleting, revisionId],
  )

  const getDisplayed = useCallback(
    (value: SanityDocumentLike) => {
      if (onOlderRevision) {
        return revisionDocument || {_id: value._id, _type: value._type}
      }
      return value
    },
    [onOlderRevision, revisionDocument],
  )

  const {
    editState,
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
    documentType,
    documentId,
    initialValue: initialValue.value,
    comparisonValue: getComparisonValue,
    releaseId: selectedReleaseId,
    selectedPerspectiveName,
    initialFocusPath: params.path ? pathFromString(params.path) : EMPTY_ARRAY,
    readOnly: getIsReadOnly,
    onFocusPath,
    getFormDocumentValue: getDisplayed,
  })

  const getDocumentVersionType = useCallback(() => {
    let version: DocumentActionsVersionType
    switch (true) {
      case Boolean(params.rev):
        version = 'revision'
        break
      case selectedReleaseId && isVersionId(value._id):
        version = 'version'
        break
      case selectedPerspectiveName === 'published':
        version = 'published'
        break
      default:
        version = 'draft'
    }

    return version
  }, [selectedPerspectiveName, selectedReleaseId, params, value._id])

  const actionsPerspective = useMemo(() => getDocumentVersionType(), [getDocumentVersionType])

  const documentActionsProps: PartialContext<DocumentActionsContext> = useMemo(
    () => ({
      schemaType: documentType,
      documentId,
      versionType: actionsPerspective,
      ...(selectedReleaseId && {versionName: selectedReleaseId}),
    }),
    [documentType, documentId, actionsPerspective, selectedReleaseId],
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

  const {previousId} = useDocumentIdStack({displayed, documentId, editState})

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

      return false
    },
    [
      previewUrl,
      previousId,
      telemetry,
      pushToast,
      t,
      handleHistoryOpen,
      handleInspectorAction,
      diffViewRouter,
      documentType,
      value._id,
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

  const compareValue = useMemo(() => getComparisonValue(editState), [editState, getComparisonValue])
  const isDeleted = useMemo(() => getIsDeleted(editState), [editState, getIsDeleted])
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
        displayed,
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
        onPathOpen,
        onHistoryClose: handleHistoryClose,
        onHistoryOpen: handleHistoryOpen,
        onInspectClose: handleLegacyInspectClose,
        onMenuAction: handleMenuAction,
        onPaneClose: handlePaneClose,
        onPaneSplit: handlePaneSplit,
        onSetActiveFieldGroup,
        onSetCollapsedPath,
        onSetCollapsedFieldSet,
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
        lastNonDeletedRevId,
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
      displayed,
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
      onPathOpen,
      handleHistoryClose,
      handleHistoryOpen,
      handleLegacyInspectClose,
      handleMenuAction,
      handlePaneClose,
      handlePaneSplit,
      onSetActiveFieldGroup,
      onSetCollapsedPath,
      onSetCollapsedFieldSet,
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
      lastNonDeletedRevId,
    ],
  )

  // Reset `focusPath` when `documentId` or `params.path` changes
  useEffect(() => {
    if (ready && params.path) {
      const {path, ...restParams} = params
      const pathFromUrl = resolveKeyedPath(formStateRef.current?.value, pathFromString(path))
      onProgrammaticFocus(pathFromUrl)

      // remove the `path`-param from url after we have consumed it as the initial focus path
      paneRouter.setParams(restParams)
    }

    return undefined
  }, [formStateRef, onProgrammaticFocus, paneRouter, params, ready])

  return (
    <DocumentPaneContext.Provider value={documentPane}>{children}</DocumentPaneContext.Provider>
  )
})

DocumentPaneProvider.displayName = 'Memo(DocumentPaneProvider)'
