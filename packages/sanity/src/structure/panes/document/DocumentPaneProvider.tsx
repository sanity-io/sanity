/* eslint-disable camelcase */
/* eslint-disable max-nested-callbacks */
import {useTelemetry} from '@sanity/telemetry/react'
import {type ObjectSchemaType, type SanityDocument} from '@sanity/types'
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
  getReleaseIdFromReleaseDocumentId,
  isReleaseDocument,
  isReleaseScheduledOrScheduling,
  isVersionId,
  type PartialContext,
  useCopyPaste,
  useDocumentVersions,
  useEditable,
  usePerspective,
  useSchema,
  useSource,
  useTranslation,
  useUnique,
} from 'sanity'
import {DocumentPaneContext} from 'sanity/_singletons'

import {usePaneRouter} from '../../components'
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
  const {children, index, pane, paneKey, onFocusPath, forcedVersion} = props
  const {
    store: timelineStore,
    error: timelineError,
    ready: timelineReady,
    revisionId,
    revisionDocument,
    onOlderRevision,
    sinceDocument,
    isPristine,
    lastNonDeletedRevId,
  } = props.historyStore

  const schema = useSchema()
  const {setDocumentMeta} = useCopyPaste()
  const {
    __internal_tasks,
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

  const {isReleaseLocked, selectedReleaseId, selectedPerspectiveName} = useMemo(() => {
    if (forcedVersion) {
      return forcedVersion
    }
    return {
      selectedPerspectiveName: perspective.selectedPerspectiveName,
      selectedReleaseId: perspective.selectedReleaseId,
      isReleaseLocked: isReleaseDocument(perspective.selectedPerspective)
        ? isReleaseScheduledOrScheduling(perspective.selectedPerspective)
        : false,
    }
  }, [
    forcedVersion,
    perspective.selectedPerspectiveName,
    perspective.selectedReleaseId,
    perspective.selectedPerspective,
  ])

  const initialValue = useDocumentPaneInitialValue({
    paneOptions,
    selectedReleaseId,
    documentId,
    documentType,
  })

  const {
    changesOpen,
    currentInspector,
    inspectors,
    closeInspector,
    openInspector,
    handleHistoryClose,
    handleHistoryOpen,
    handleInspectorAction,
  } = useDocumentPaneInspector({documentId, documentType})

  const getComparisonValue = useCallback(
    (editState: EditStateFor) => {
      return changesOpen ? sinceDocument : editState?.published || null
    },
    [changesOpen, sinceDocument],
  )
  const schemaType = schema.get(documentType) as ObjectSchemaType | undefined

  const liveEdit = Boolean(schemaType?.liveEdit)
  const {data: documentVersions} = useDocumentVersions({documentId})

  const existsInBundle =
    typeof selectedReleaseId !== 'undefined' &&
    documentVersions.some(
      (version) => getReleaseIdFromReleaseDocumentId(version._id) === selectedReleaseId,
    )

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
      return Boolean(!editState?.draft && !editState?.published) && !isPristine
    },
    [timelineReady, isPristine],
  )

  const [isDeleting, setIsDeleting] = useState(false)

  const getIsReadOnly = useCallback(
    (editState: EditStateFor): boolean => {
      const isDeleted = getIsDeleted(editState)

      // in cases where the document has drafts but the schema is live edit,
      // there is a risk of data loss, so we disable editing in this case
      const isLiveEditAndDraftPerspective = liveEdit && !selectedPerspectiveName
      const isLiveEditAndPublishedPerspective = liveEdit && selectedPerspectiveName === 'published'
      const isSystemPerspectiveApplied =
        isLiveEditAndPublishedPerspective || (selectedPerspectiveName ? existsInBundle : true)

      return (
        !isSystemPerspectiveApplied ||
        isLiveEditAndDraftPerspective ||
        isDeleted ||
        isDeleting ||
        revisionId !== null ||
        isReleaseLocked
      )
    },
    [
      existsInBundle,
      getIsDeleted,
      isDeleting,
      isReleaseLocked,
      liveEdit,
      revisionId,
      selectedPerspectiveName,
    ],
  )

  const {
    editState,
    connectionState,
    focusPath,
    onChange,
    validation,
    ready: formValuesReady,
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
  } = useEditable({
    documentType,
    documentId,
    initialValue: initialValue.value,
    comparisonValue: getComparisonValue,
    releaseId: selectedReleaseId,
    selectedPerspectiveName,
    initialFocusPath: params.path ? pathFromString(params.path) : EMPTY_ARRAY,
    readOnly: getIsReadOnly,
    onFocusPath,
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
  const ready = formValuesReady && (!params.rev || timelineReady || !!timelineError)

  const displayed: Partial<SanityDocument> | undefined = useMemo(
    () => (onOlderRevision ? revisionDocument || {_id: value._id, _type: value._type} : value),
    [onOlderRevision, revisionDocument, value],
  )

  // TODO: Move this outside of the DocumentPaneProvider, it should be part of the history timeline or events timeline
  const setTimelineRange = useCallback(
    (newSince: string, newRev: string | null) => {
      setPaneParams({...params, since: newSince, rev: newRev || undefined})
    },
    [params, setPaneParams],
  )

  const handlePaneClose = useCallback(() => paneRouter.closeCurrent(), [paneRouter])

  const handlePaneSplit = useCallback(() => paneRouter.duplicateCurrent(), [paneRouter])

  // TODO: this may cause a lot of churn. May be a good idea to prevent these
  // requests unless the menu is open somehow
  const previewUrl = usePreviewUrl(value)
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

      // TODO: Is this deprecated? Couldn't find any usage of it
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

      return false
    },
    [t, handleHistoryOpen, previewUrl, pushToast, telemetry, handleInspectorAction],
  )

  // TODO: This could be moved somewhere else
  useEffect(() => {
    setDocumentMeta({documentId, documentType, schemaType: schemaType!, onChange})
  }, [documentId, documentType, schemaType, onChange, setDocumentMeta])

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
        compareValue: getComparisonValue(editState),
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
        onBlur,
        onChange,
        onFocus,
        onPathOpen,
        onHistoryClose: handleHistoryClose,
        onHistoryOpen: handleHistoryOpen,
        onMenuAction: handleMenuAction,
        onPaneClose: handlePaneClose,
        onPaneSplit: handlePaneSplit,
        onSetActiveFieldGroup,
        onSetCollapsedPath,
        onSetCollapsedFieldSet,
        openInspector,
        openPath,
        index,
        validation,
        menuItemGroups: menuItemGroups || [],
        paneKey,
        previewUrl,
        ready,
        schemaType: schemaType!,
        isPermissionsLoading,
        isInitialValueLoading: initialValue.loading,
        permissions,
        setTimelineRange,
        setIsDeleting,
        isDeleting,
        isDeleted: getIsDeleted(editState),
        timelineError,
        timelineStore,
        title,
        value,
        selectedReleaseId,
        views,
        formState,
        unstable_languageFilter: languageFilter,

        // History specific
        revisionId,
        lastNonDeletedRevId,
      }) satisfies DocumentPaneContextValue,
    [
      __internal_tasks,
      actions,
      activeViewId,
      badges,
      changesOpen,
      closeInspector,
      collapsedFieldSets,
      collapsedPaths,
      connectionState,
      currentInspector,
      displayed,
      documentId,
      documentIdRaw,
      documentType,
      documentVersions,
      editState,
      existsInBundle,
      fieldActions,
      focusPath,
      formState,
      getComparisonValue,
      getIsDeleted,
      handleHistoryClose,
      handleHistoryOpen,
      handleMenuAction,
      handlePaneClose,
      handlePaneSplit,
      index,
      initialValue.loading,
      inspectors,
      isDeleting,
      isPermissionsLoading,
      languageFilter,
      lastNonDeletedRevId,
      menuItemGroups,
      onBlur,
      onChange,
      onFocus,
      onPathOpen,
      onSetActiveFieldGroup,
      onSetCollapsedFieldSet,
      onSetCollapsedPath,
      openInspector,
      openPath,
      paneKey,
      permissions,
      previewUrl,
      ready,
      revisionId,
      schemaType,
      selectedReleaseId,
      setTimelineRange,
      timelineError,
      timelineStore,
      title,
      validation,
      value,
      views,
    ],
  )

  return (
    <DocumentPaneContext.Provider value={documentPane}>{children}</DocumentPaneContext.Provider>
  )
})

DocumentPaneProvider.displayName = 'Memo(DocumentPaneProvider)'
