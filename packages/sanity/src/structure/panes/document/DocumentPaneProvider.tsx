import {useTelemetry} from '@sanity/telemetry/react'
import {
  type ObjectSchemaType,
  type Path,
  type SanityDocument,
  type SanityDocumentLike,
} from '@sanity/types'
import {useToast} from '@sanity/ui'
import {fromString as pathFromString, resolveKeyedPath} from '@sanity/util/paths'
import {useEffect, useRef, useState} from 'react'
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
  useStudioUrl,
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
import {DocumentURLCopied, InlineChangesSwitchedOff, InlineChangesSwitchedOn} from './__telemetry__'
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
      drafts: {enabled: draftsEnabled},
    },
  } = useSource()
  const telemetry = useTelemetry()
  const router = useRouter()
  const paneRouter = usePaneRouter()
  const setPaneParams = paneRouter.setParams
  const {push: pushToast} = useToast()
  const {
    options,
    menuItemGroups = DEFAULT_MENU_ITEM_GROUPS,
    title = null,
    views: viewsProp = EMPTY_ARRAY,
  } = pane
  const paneOptions = useUnique(options)
  const documentIdRaw = paneOptions.id
  const documentId = getPublishedId(documentIdRaw)
  const documentType = options.type
  const params = useUnique(paneRouter.params) || EMPTY_PARAMS
  const {buildStudioUrl} = useStudioUrl()

  const perspective = usePerspective()

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
    beta,
  } = useWorkspace()

  const enhancedObjectDialogEnabled = beta?.form?.enhancedObjectDialog?.enabled

  const {selectedReleaseId, selectedPerspectiveName} = forcedVersion
    ? // TODO: COREL - Remove this after updating sanity-assist to use <PerspectiveProvider>
      forcedVersion
    : {
        selectedPerspectiveName: perspective.selectedPerspectiveName,
        selectedReleaseId: perspective.selectedReleaseId,
      }

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
  const getIsDeleted = (editState: EditStateFor) => {
    if (!timelineReady) return false
    return Boolean(!editState?.draft && !editState?.published && !editState?.version) && !isPristine
  }

  const getComparisonValue = (upstreamEditState: EditStateFor) => {
    const upstream = selectUpstreamVersion(upstreamEditState)
    if (changesOpen) {
      return sinceDocument || upstream
    }
    return upstream || null
  }

  const schemaType = schema.get(documentType) as ObjectSchemaType | undefined

  const getIsReadOnly = (editState: EditStateFor): boolean => {
    const isDeleted = getIsDeleted(editState)
    const seeingHistoryDocument = Boolean(params.rev)
    return (
      seeingHistoryDocument ||
      isDeleting ||
      isDeleted ||
      !isPerspectiveWriteable({
        selectedPerspective: perspective.selectedPerspective,
        isDraftModelEnabled,
        schemaType,
      }).result
    )
  }

  const getDisplayed = (value: SanityDocumentLike) => {
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
  }

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
    releaseId: selectedReleaseId,
    selectedPerspectiveName,
    initialFocusPath: params.path ? pathFromString(params.path) : EMPTY_ARRAY,
    readOnly: getIsReadOnly,
    onFocusPath,
    getFormDocumentValue: getDisplayed,
    displayInlineChanges: router.stickyParams.displayInlineChanges === 'true',
  })

  const {data: releases = EMPTY_ARRAY} = useActiveReleases()

  const actionsPerspective = getDocumentVersionType(
    params,
    selectedReleaseId,
    value,
    selectedPerspectiveName,
    draftsEnabled,
    releases,
  )

  const documentActionsProps: PartialContext<DocumentActionsContext> = {
    schemaType: documentType,
    documentId,
    versionType: actionsPerspective,
    releaseId: selectedReleaseId,
  }

  // Resolve document actions
  const actions = documentActions(documentActionsProps)

  const handlePathOpen = (path: Path) => {
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
  }

  // Resolve document badges
  const badges = documentBadges({schemaType: documentType, documentId})

  // Resolve document language filter
  const languageFilter = languageFilterResolver({schemaType: documentType, documentId})

  const views = useUnique(viewsProp)

  const activeViewId = params.view || (views[0] && views[0].id) || null

  // TODO: this may cause a lot of churn. May be a good idea to prevent these
  // requests unless the menu is open somehow
  const previewUrl = usePreviewUrl(value)

  const {t} = useTranslation(structureLocaleNamespace)

  const fieldActions: DocumentFieldAction[] = schemaType
    ? fieldActionsResolver({documentId, documentType, schemaType})
    : EMPTY_ARRAY

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

  const displayed: Partial<SanityDocument> | undefined = getDisplayed(value)

  const {previousId} = useDocumentIdStack({
    strict: true,
    displayed,
    documentId,
    editState,
  })

  const setTimelineRange = (newSince: string, newRev: string | null) => {
    setPaneParams({
      ...params,
      since: newSince,
      rev: newRev || undefined,
    })
  }

  const handlePaneClose = () => paneRouter.closeCurrent()

  const handlePaneSplit = () => paneRouter.duplicateCurrent()

  const toggleInlineChanges = () => {
    const nextState = router.stickyParams.displayInlineChanges !== 'true'
    telemetry.log(nextState ? InlineChangesSwitchedOn : InlineChangesSwitchedOff)

    router.navigate({
      stickyParams: {
        displayInlineChanges: String(nextState),
      },
    })
  }

  const handleMenuAction = async (item: PaneMenuItem) => {
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
      const copyUrl = buildStudioUrl({
        coreUi: (url) => `${url}/intent/edit/id=${documentId};type=${documentType}`,
      })
      await navigator.clipboard.writeText(copyUrl)
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

    if (item.action === 'toggleInlineChanges') {
      toggleInlineChanges()
      return true
    }

    return false
  }

  useEffect(() => {
    setDocumentMeta({
      documentId,
      documentType,
      schemaType: schemaType!,
      onChange,
    })
  }, [documentId, documentType, schemaType, onChange, setDocumentMeta])

  const compareValue = getComparisonValue(upstreamEditState)

  const isDeleted = getIsDeleted(editState)
  const revisionNotFound = onOlderRevision && !revisionDocument

  const currentDisplayed =
    editState.version && isGoingToUnpublish(editState.version) ? editState.published : displayed

  const pathRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (ready && params.path) {
      const {path, ...restParams} = params

      // trigger a focus when `params.path` changes
      if (path !== pathRef.current) {
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
  }, [formStateRef, onProgrammaticFocus, paneRouter, params, ready, enhancedObjectDialogEnabled])

  return (
    <DocumentPaneContext.Provider
      value={
        {
          actions,
          activeViewId,
          badges,
          changesOpen,
          closeInspector,
          collapsedFieldSets,
          collapsedPaths,
          compareValue,
          connectionState,
          displayed: currentDisplayed!,
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
          openInspector,
          openPath,
          index,
          inspectOpen,
          validation,
          menuItemGroups: menuItemGroups || EMPTY_ARRAY,
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
        } satisfies DocumentPaneContextValue
      }
    >
      {children}
    </DocumentPaneContext.Provider>
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
