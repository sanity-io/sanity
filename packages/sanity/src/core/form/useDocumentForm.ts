import {type SanityDocument} from '@sanity/client'
import {isActionEnabled} from '@sanity/schema/_internal'
import {useTelemetry} from '@sanity/telemetry/react'
import {
  type ObjectSchemaType,
  type Path,
  type SanityDocumentLike,
  type ValidationMarker,
} from '@sanity/types'
import {pathFor} from '@sanity/util/paths'
import throttle from 'lodash-es/throttle.js'
import {
  type RefObject,
  useCallback,
  useEffect,
  useInsertionEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import deepEquals from 'react-fast-compare'

import {
  type FormState,
  getExpandOperations,
  type NodeChronologyProps,
  type OnPathFocusPayload,
  type PatchEvent,
  setAtPath,
  type StateTree,
  toMutationPatches,
  useFormState,
} from '.'
import {useCanvasCompanionDoc} from '../canvas/actions/useCanvasCompanionDoc'
import {useReconnectingToast} from '../hooks'
import {type ConnectionState, useConnectionState} from '../hooks/useConnectionState'
import {useDocumentIdStack} from '../hooks/useDocumentIdStack'
import {useDocumentOperation} from '../hooks/useDocumentOperation'
import {type DocumentSyncState, useDocumentSyncState} from '../hooks/useDocumentSyncState'
import {useEditState} from '../hooks/useEditState'
import {useSchema} from '../hooks/useSchema'
import {
  getPairTarget,
  getTargetScopeId,
  useTargetDocumentState,
} from '../hooks/useTargetDocumentState'
import {useValidationStatus} from '../hooks/useValidationStatus'
import {getSelectedPerspective} from '../perspective/getSelectedPerspective'
import {type ReleaseId} from '../perspective/types'
import {usePerspective} from '../perspective/usePerspective'
import {useDocumentVersions} from '../releases/hooks/useDocumentVersions'
import {useDocumentVersionTypeSortedList} from '../releases/hooks/useDocumentVersionTypeSortedList'
import {useOnlyHasVersions} from '../releases/hooks/useOnlyHasVersions'
import {isReleaseDocument} from '../releases/store/types'
import {useActiveReleases} from '../releases/store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {isGoingToUnpublish} from '../releases/util/isGoingToUnpublish'
import {isPublishedPerspective, isReleaseScheduledOrScheduling} from '../releases/util/util'
import {
  type DocumentPresence,
  type EditStateFor,
  type InitialValueState,
  type PermissionCheckResult,
  selectUpstreamVersion,
  useDocumentValuePermissions,
  usePresenceStore,
} from '../store'
import {isNewDocument} from '../store/document/isNewDocument'
import {
  EMPTY_ARRAY,
  getDraftId,
  getPublishedId,
  getVersionFromId,
  getVersionId,
  isSystemBundle,
  useUnique,
} from '../util'
import {CreatedDraft} from './__telemetry__/form.telemetry'
import {useComlinkViewHistory} from './useComlinkViewHistory'

interface DocumentFormOptions {
  documentType: string
  documentId: string
  releaseId?: ReleaseId
  initialValue?: InitialValueState
  initialFocusPath?: Path
  selectedPerspectiveName?: ReleaseId | 'published'
  readOnly?: boolean | ((editState: EditStateFor) => boolean)
  /**
   * Usually the historical _rev value selected, if not defined, it will use the current document value
   * so no comparison will be done.
   */
  comparisonValue?:
    | Partial<SanityDocument>
    | ((editState: EditStateFor) => Partial<SanityDocument>)
    | null
  onFocusPath?: (path: Path) => void
  changesOpen?: boolean
  /**
   * Callback that allows to transform the value before it's passed to the form
   * used by the <DocumentPaneProvider > to display the history values.
   */
  getFormDocumentValue?: (value: SanityDocumentLike) => SanityDocumentLike
  displayInlineChanges?: boolean
  /**
   * Whether the form is displaying a historical revision (e.g. via "Review
   * changes"). When `true`, the live document's validation markers are not
   * applied, since they describe the editable draft/published document rather
   * than the read-only revision being viewed.
   */
  isOlderRevision?: boolean
}
interface DocumentFormValue extends Pick<NodeChronologyProps, 'hasUpstreamVersion'> {
  /**
   * `EditStateFor` for the displayed document.
   * */
  editState: EditStateFor
  /**
   *  `EditStateFor` for the displayed document's upstream version.
   */
  upstreamEditState: EditStateFor
  connectionState: ConnectionState
  /**
   * Staged signal for whether the document's edits are reaching the
   * server. `pending` warns; `stalled` means editing is locked.
   */
  syncState: DocumentSyncState
  collapsedFieldSets: StateTree<boolean> | undefined
  collapsedPaths: StateTree<boolean> | undefined
  openPath: Path

  ready: boolean
  value: SanityDocumentLike
  formState: FormState | null
  focusPath: Path
  validation: ValidationMarker[]
  permissions: PermissionCheckResult | undefined
  isPermissionsLoading: boolean
  onBlur: (blurredPath: Path) => void
  onFocus: (_nextFocusPath: Path, payload?: OnPathFocusPayload) => void
  onSetCollapsedPath: (path: Path, collapsed: boolean) => void
  onSetActiveFieldGroup: (path: Path, groupName: string) => void
  onSetCollapsedFieldSet: (path: Path, collapsed: boolean) => void
  onChange: (event: PatchEvent) => void
  onPathOpen: (path: Path) => void
  onProgrammaticFocus: (nextPath: Path) => void
  formStateRef: RefObject<FormState | null>
  schemaType: ObjectSchemaType
}

/**
 * @internal
 * Hook for creating a form state and combine it with the <FormBuilder>.
 * It will handle the connection state, edit state, validation, and presence.
 *
 * Use this as a base point to create your own form.
 */
export function useDocumentForm(options: DocumentFormOptions): DocumentFormValue {
  const {
    documentType,
    getFormDocumentValue,
    documentId,
    initialValue,
    changesOpen = false,
    comparisonValue: comparisonValueRaw,
    releaseId,
    initialFocusPath,
    selectedPerspectiveName,
    readOnly: readOnlyProp,
    onFocusPath,
    displayInlineChanges,
    isOlderRevision,
  } = options
  const schema = useSchema()
  const presenceStore = usePresenceStore()
  const {data: releases} = useActiveReleases()
  const {data: documentVersions, loading: documentVersionsLoading} = useDocumentVersions({
    documentId,
  })
  const {selectedVariantName, bundle} = usePerspective()
  const targetDocumentState = useTargetDocumentState(documentId)
  const isVariantTarget =
    targetDocumentState.status === 'ready' && targetDocumentState.variant !== undefined

  const enhancedObjectDialogEnabled = true

  const schemaType = schema.get(documentType) as ObjectSchemaType | undefined
  if (!schemaType) {
    throw new Error(`Schema type for '${documentType}' not found`)
  }
  const liveEdit = Boolean(schemaType.liveEdit)

  const telemetry = useTelemetry()

  // if it only has versions then we need to make sure that whatever the first document that is allowed
  // is a version document, but also that it has the right order
  // this will make sure that then the right document appears and so does the right chip within the document header
  const {sortedDocumentList} = useDocumentVersionTypeSortedList({documentId})
  const onlyHasVersions = useOnlyHasVersions({documentId})
  const firstVersion =
    sortedDocumentList.length > 0
      ? documentVersions.find(
          (id) =>
            getVersionFromId(id) === getReleaseIdFromReleaseDocumentId(sortedDocumentList[0]._id),
        )
      : undefined

  // The bundle segment for the pair checkout (`useEditState` & co.). Variant targets use the
  // stub-resolved opaque scope id exclusively: a missing/unresolved variant target must never
  // fall back to another document (ops stay guarded, the form stays read-only). Non-variant
  // targets keep the deterministic release derivation with its fallbacks — a release version id
  // is derivable, so new documents under a release must check out the version pair for typing to
  // create the release version (not the base draft), and documents that only have versions must
  // check out their first version to display it.
  const targetScopeId = useMemo(() => {
    if (selectedVariantName) {
      // The scope of the resolved target document (release id for release targets, opaque scope hash
      // for variant targets), threaded through the version-editing pipeline. Undefined while the
      // target is resolving or when the base draft/published pair applies.
      return getTargetScopeId(targetDocumentState)
    }
    if (isSystemBundle(selectedPerspectiveName)) {
      return undefined
    }
    // if a document version exists with the selected release id, then it should use that
    if (documentVersions.some((id) => getVersionFromId(id) === selectedPerspectiveName)) {
      return selectedPerspectiveName
    }

    // check if the selected version is the only version, if it isn't and it doesn't exist in the release
    // then it needs to use the documentVersions
    if (selectedPerspectiveName && (!documentVersions.length || !onlyHasVersions)) {
      return selectedPerspectiveName
    }

    return getVersionFromId(firstVersion ?? '')
  }, [
    selectedVariantName,
    targetDocumentState,
    documentVersions,
    onlyHasVersions,
    selectedPerspectiveName,
    firstVersion,
  ])

  const editState = useEditState(documentId, documentType, 'default', targetScopeId)

  const connectionState = useConnectionState(documentId, documentType, targetScopeId)
  useReconnectingToast(connectionState === 'reconnecting')

  // Staged signal for "the document's edits aren't reaching the server".
  // `stalled` means it's been unsynced long enough that we lock editing to
  // stop the user piling more changes onto a document that isn't syncing.
  const syncState = useDocumentSyncState(documentId, documentType, targetScopeId)

  const [focusPath, setFocusPath] = useState<Path>(initialFocusPath || EMPTY_ARRAY)

  const value: SanityDocumentLike = useMemo(() => {
    const baseValue = initialValue?.value || {_id: documentId, _type: documentType}
    // When a variant-scoped version was resolved, the editable document is always the version
    // document, regardless of which bundle (published/drafts/release) the variant belongs to.
    if (isVariantTarget) {
      return editState.version || baseValue
    }
    // Only treat releaseId as an actual release/anonymous bundle if it's not a system bundle ('published' or 'drafts')
    // System bundles are handled by subsequent conditions below
    if (releaseId && !isSystemBundle(releaseId)) {
      // in cases where the current version is going to be unpublished, we need to show the published document
      // this way, instead of showing the version that will stop existing, we show instead the published document with a fall back
      if (editState.version && isGoingToUnpublish(editState.version)) {
        return editState.published || baseValue
      }
      return editState.version || editState.draft || editState.published || baseValue
    }
    if (selectedPerspectiveName && isPublishedPerspective(selectedPerspectiveName)) {
      return (
        editState.published ||
        (liveEdit
          ? // If it's live edit and published perspective, add the initialValue
            baseValue
          : // If it's not live edit, the form needs to be empty in the draft state, don't show the initialValue
            {_id: documentId, _type: documentType})
      )
    }
    // we have either a selected perspective that's not a release,
    // or no version is selected, but there are only versions,
    // so it should default to the version it finds
    if (selectedPerspectiveName || onlyHasVersions) {
      return editState.version || editState.draft || editState.published || baseValue
    }
    return editState?.draft || editState?.published || baseValue
  }, [
    isVariantTarget,
    documentId,
    documentType,
    editState.draft,
    editState.published,
    editState.version,
    initialValue,
    releaseId,
    liveEdit,
    selectedPerspectiveName,
    onlyHasVersions,
  ])

  const {validation: validationRaw} = useValidationStatus(
    value._id,
    documentType,
    // require referenced documents to be published unless the document is in a release
    !releaseId,
  )

  // Validation is computed against the live editable document (draft/published/
  // version). When viewing a historical revision those markers don't describe
  // what's on screen, so don't surface them on the read-only revision.
  const validation = useUnique(
    isOlderRevision ? (EMPTY_ARRAY as ValidationMarker[]) : validationRaw,
  )

  const {previousId: upstreamId} = useDocumentIdStack({
    strict: true,
    displayed: value,
    documentId,
    editState,
  })

  // No `getTargetScopeId(useTargetDocumentState())` here: this targets the upstream document in the document id
  // stack (derived from `upstreamId`), not the document targeted by the selected perspective.
  const upstreamEditState = useEditState(
    documentId,
    documentType,
    'default',
    getVersionFromId(upstreamId ?? ''),
  )

  const comparisonValue = useMemo(() => {
    if (typeof comparisonValueRaw === 'function') {
      return comparisonValueRaw(upstreamEditState)
    }
    return comparisonValueRaw
  }, [comparisonValueRaw, upstreamEditState])

  const [presence, setPresence] = useState<DocumentPresence[]>([])
  useEffect(() => {
    const subscription = presenceStore
      .documentPresence(value._id, {excludeVersions: true})
      .subscribe((nextPresence) => {
        setPresence((prev) => {
          if (
            prev.length === nextPresence.length &&
            prev.every(
              (p, i) =>
                p.sessionId === nextPresence[i].sessionId &&
                p.lastActiveAt === nextPresence[i].lastActiveAt &&
                p.path === nextPresence[i].path,
            )
          ) {
            return prev
          }
          return nextPresence
        })
      })
    return () => {
      subscription.unsubscribe()
    }
  }, [presenceStore, value._id])

  const [openPath, onSetOpenPath] = useState<Path>(initialFocusPath || EMPTY_ARRAY)
  const [fieldGroupState, onSetFieldGroupState] = useState<StateTree<string>>()
  const [collapsedPaths, onSetCollapsedPath] = useState<StateTree<boolean>>()
  const [collapsedFieldSets, onSetCollapsedFieldSets] = useState<StateTree<boolean>>()

  const handleOnSetCollapsedPath = (path: Path, collapsed: boolean) => {
    onSetCollapsedPath((prevState) => setAtPath(prevState, path, collapsed))
  }

  const handleOnSetCollapsedFieldSet = (path: Path, collapsed: boolean) => {
    onSetCollapsedFieldSets((prevState) => setAtPath(prevState, path, collapsed))
  }

  const handleSetActiveFieldGroup = (path: Path, groupName: string) =>
    onSetFieldGroupState((prevState) => setAtPath(prevState, path, groupName))

  const requiredPermission = value._createdAt ? 'update' : 'create'
  const targetDocumentId = useMemo(() => {
    // If the document exists, use that target document id.
    // This takes into account the variant ids where the id is opaque.
    if (targetDocumentState.status === 'ready' && targetDocumentState.targetDocument) {
      return targetDocumentState.targetDocument._id
    }
    if (!bundle) {
      return getPublishedId(documentId)
    }
    if (bundle === 'drafts') {
      return getDraftId(documentId)
    }
    return getVersionId(getPublishedId(documentId), bundle)
  }, [targetDocumentState, bundle, documentId])

  const docPermissionsInput = useMemo(() => {
    return {
      ...value,
      _id: targetDocumentId,
    }
  }, [value, targetDocumentId])

  const [permissions, isPermissionsLoading] = useDocumentValuePermissions({
    document: docPermissionsInput,
    permission: requiredPermission,
  })

  const isNonExistent = !value?._id

  const ready =
    connectionState === 'connected' &&
    editState.ready &&
    !initialValue?.loading &&
    !documentVersionsLoading

  const selectedPerspective = useMemo(() => {
    return getSelectedPerspective(selectedPerspectiveName, releases)
  }, [selectedPerspectiveName, releases])

  const isReleaseLocked = useMemo(
    () =>
      isReleaseDocument(selectedPerspective)
        ? isReleaseScheduledOrScheduling(selectedPerspective)
        : false,
    [selectedPerspective],
  )
  const {isLockedByCanvas} = useCanvasCompanionDoc(value._id)

  const readOnly = useMemo(() => {
    const hasNoPermission = !isPermissionsLoading && !permissions?.granted
    const updateActionDisabled = !isActionEnabled(schemaType, 'update')
    const createActionDisabled = isNonExistent && !isActionEnabled(schemaType, 'create')
    const reconnecting = connectionState === 'reconnecting'
    const isLocked = editState.transactionSyncLock?.enabled
    // Lock once edits have stalled, and keep it locked while a failed
    // commit is being retried (`recovering`) — we're not in sync yet.
    const syncBlocked = syncState === 'stalled' || syncState === 'recovering'
    const willBeUnpublished = value ? isGoingToUnpublish(value) : false

    // When a variant is requested but its target has not resolved (still resolving, missing, or
    // an invalid selection), editing must be blocked so patches can never fall back to the base
    // draft/published pair. The document pane additionally gates mounting on resolution, but this
    // hook is also used outside the gated pane (e.g. DiffViewPane).
    if (selectedVariantName && targetDocumentState.status !== 'ready') {
      return true
    }

    // When editing a resolved variant-scoped version, the document id intentionally doesn't match
    // the selected bundle/perspective (variant docs live under `versions.<scopeId>.<publishedId>`),
    // so the perspective/bundle-mismatch guards below must be skipped.
    if (!isVariantTarget) {
      // in cases where the document has no draft or published, but has a version,
      // and that version doesn't match current pinned version
      // we disable editing
      if (
        editState.version &&
        !editState.draft &&
        !editState.published &&
        onlyHasVersions &&
        selectedPerspectiveName !== getVersionFromId(editState.version._id) &&
        isNewDocument(editState) === false
      ) {
        return true
      }

      if (!liveEdit && selectedPerspectiveName === 'published') {
        return true
      }

      // If a release is selected, validate that the document id matches the selected release id.
      //
      // If the user is viewing a new document (a document that exists locally, but has not yet been
      // created in the dataset), they are permitted to edit it, regardless of which perspective was
      // selected when they created it. This will cause it to be created in the dataset, attached to
      // the currently selected perspective.
      if (
        releaseId &&
        getVersionFromId(value._id) !== releaseId &&
        isNewDocument(editState) === false
      ) {
        return true
      }
    }

    // in cases where the document has drafts but the schema is live edit, there is a risk of data loss, so we disable editing in this case
    if (liveEdit && editState.draft?._id) {
      return true
    }

    const isReadOnly =
      !ready ||
      isLockedByCanvas ||
      hasNoPermission ||
      updateActionDisabled ||
      createActionDisabled ||
      reconnecting ||
      isLocked ||
      syncBlocked ||
      willBeUnpublished ||
      isReleaseLocked

    if (isReadOnly) return true
    if (typeof readOnlyProp === 'function') return readOnlyProp(editState)
    return Boolean(readOnlyProp)
  }, [
    isPermissionsLoading,
    isLockedByCanvas,
    permissions?.granted,
    schemaType,
    isNonExistent,
    connectionState,
    editState,
    value,
    onlyHasVersions,
    selectedPerspectiveName,
    liveEdit,
    releaseId,
    selectedVariantName,
    targetDocumentState.status,
    isVariantTarget,
    ready,
    isReleaseLocked,
    readOnlyProp,
    syncState,
  ])

  // For variant flows, pass the full target (not just the scope id) so the store keeps the
  // operations guarded while the target is unresolved or missing, instead of falling back to the
  // base pair. Non-variant flows keep the deterministic version name: their ids are derivable, so
  // resolution never blocks them (and the store's self-derived guard still covers a requested
  // version that doesn't exist).
  const {patch} = useDocumentOperation(
    documentId,
    documentType,
    selectedVariantName ? getPairTarget(targetDocumentState) : targetScopeId,
  )

  const patchRef = useRef<(event: PatchEvent) => void>(() => {
    throw new Error(
      'Attempted to patch the Sanity document during initial render or in an `useInsertionEffect`. Input components should only call `onChange()` in a useEffect or an event handler.',
    )
  })
  const handleChange = (event: PatchEvent) => patchRef.current(event)

  useInsertionEffect(() => {
    // which would otherwise be read-only.
    if (readOnly) {
      patchRef.current = () => {
        throw new Error('Attempted to patch a read-only document')
      }
    } else if (patch.disabled) {
      // The store disabled the patch operation (target unresolved or missing, transient pair
      // setup). Surfacing it here mirrors the read-only guard: never let a patch silently reach
      // the wrong document.
      patchRef.current = () => {
        throw new Error(
          `Attempted to patch a document with a disabled patch operation (${patch.disabled})`,
        )
      }
    } else {
      // note: this needs to happen in an insertion effect to make sure we're ready to receive patches from child components when they run their effects initially
      // in case they do e.g. `useEffect(() => props.onChange(set("foo")), [])`
      // Note: although we discourage patch-on-mount, we still support it.
      patchRef.current = (event: PatchEvent) => {
        // when creating a new draft
        if (!editState.draft && !editState.published) {
          telemetry.log(CreatedDraft)
        }

        patch.execute(toMutationPatches(event.patches), initialValue?.value)
      }
    }
  }, [editState.draft, editState.published, initialValue, patch, telemetry, readOnly])

  const formDocumentValue = useMemo(() => {
    if (getFormDocumentValue) return getFormDocumentValue(value)
    return value
  }, [getFormDocumentValue, value])

  const hasUpstreamVersion = selectUpstreamVersion(upstreamEditState) !== null

  const formState = useFormState({
    schemaType,
    documentValue: formDocumentValue,
    readOnly,
    comparisonValue: comparisonValue || value,
    focusPath,
    openPath,
    perspective: selectedPerspective,
    collapsedPaths,
    presence,
    validation,
    collapsedFieldSets,
    fieldGroupState,
    changesOpen,
    hasUpstreamVersion,
    displayInlineChanges,
  })

  const formStateRef = useRef(formState)
  useEffect(() => {
    formStateRef.current = formState
  }, [formState])

  useComlinkViewHistory({editState})

  const handleSetOpenPath = (path: Path) => {
    if (!formStateRef.current) return
    const ops = getExpandOperations(formStateRef.current, path)
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
  }

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

  // Announce presence on the document root when the form mounts
  useEffect(() => {
    updatePresence(EMPTY_ARRAY)
  }, [updatePresence])

  const updatePresenceThrottled = useMemo(
    () => throttle(updatePresence, 1000, {leading: true, trailing: true}),
    [updatePresence],
  )

  useEffect(() => {
    return () => {
      updatePresenceThrottled.cancel()
    }
  }, [updatePresenceThrottled])

  const focusPathRef = useRef<Path>([])

  const handleFocus = (_nextFocusPath: Path, payload?: OnPathFocusPayload) => {
    const nextFocusPath = pathFor(_nextFocusPath)
    if (nextFocusPath !== focusPathRef.current) {
      setFocusPath(pathFor(nextFocusPath))

      if (enhancedObjectDialogEnabled) {
        handleSetOpenPath(pathFor(nextFocusPath.slice(0, -1)))
      }

      focusPathRef.current = nextFocusPath
      onFocusPath?.(nextFocusPath)
    }
    updatePresenceThrottled(nextFocusPath, payload)
  }

  const handleBlur = (_blurredPath: Path) => {
    setFocusPath(EMPTY_ARRAY)

    if (focusPathRef.current !== EMPTY_ARRAY) {
      focusPathRef.current = EMPTY_ARRAY
      onFocusPath?.(EMPTY_ARRAY)
    }

    // Move presence to the document root (no specific field).
    // DocumentPanelHeader renders these — see document-level-presence cluster.
    updatePresenceThrottled(EMPTY_ARRAY)
  }

  const handleProgrammaticFocus = (nextPath: Path) => {
    // Supports changing the focus path not by a user interaction, but by a programmatic change, e.g. the url path changes.

    if (!deepEquals(focusPathRef.current, nextPath)) {
      setFocusPath(nextPath)
      handleSetOpenPath(nextPath)
      onFocusPath?.(nextPath)

      focusPathRef.current = nextPath
    }
  }
  return {
    editState,
    upstreamEditState,
    connectionState,
    syncState,
    focusPath,
    validation,
    ready,
    value,
    formState,
    permissions,
    isPermissionsLoading,
    formStateRef,
    hasUpstreamVersion,

    collapsedFieldSets,
    collapsedPaths,
    openPath,
    schemaType,
    onChange: handleChange,
    onPathOpen: handleSetOpenPath,
    onProgrammaticFocus: handleProgrammaticFocus,
    onBlur: handleBlur,
    onFocus: handleFocus,
    onSetActiveFieldGroup: handleSetActiveFieldGroup,
    onSetCollapsedPath: handleOnSetCollapsedPath,
    onSetCollapsedFieldSet: handleOnSetCollapsedFieldSet,
  }
}
