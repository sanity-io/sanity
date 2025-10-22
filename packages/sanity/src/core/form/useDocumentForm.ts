/* eslint-disable max-statements */

import {type SanityDocument} from '@sanity/client'
import {isActionEnabled} from '@sanity/schema/_internal'
import {useTelemetry} from '@sanity/telemetry/react'
import {
  isKeySegment,
  type ObjectSchemaType,
  type Path,
  type SanityDocumentLike,
  type ValidationMarker,
} from '@sanity/types'
import {pathFor} from '@sanity/util/paths'
import {throttle} from 'lodash'
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
import {useObservable} from 'react-rx'
import {of, tap, toArray} from 'rxjs'

import {useCanvasCompanionDoc} from '../canvas/actions/useCanvasCompanionDoc'
import {isSanityCreateLinkedDocument} from '../create/createUtils'
import {findDivergences} from '../divergence/findDivergences'
import {useClient, useReconnectingToast} from '../hooks'
import {type ConnectionState, useConnectionState} from '../hooks/useConnectionState'
import {useDocumentIdStack} from '../hooks/useDocumentIdStack'
import {useDocumentOperation} from '../hooks/useDocumentOperation'
import {useEditState} from '../hooks/useEditState'
import {useSchema} from '../hooks/useSchema'
import {useValidationStatus} from '../hooks/useValidationStatus'
import {getSelectedPerspective} from '../perspective/getSelectedPerspective'
import {type ReleaseId} from '../perspective/types'
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
  useEventsStore,
  usePresenceStore,
} from '../store'
import {isNewDocument} from '../store/_legacy/document/isNewDocument'
import {getDocumentAtRevision} from '../store/events/getDocumentAtRevision'
import {
  EMPTY_ARRAY,
  getDraftId,
  getPublishedId,
  getVersionFromId,
  getVersionId,
  useUnique,
} from '../util'
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
  collapsedFieldSets: StateTree<boolean> | undefined
  collapsedPaths: StateTree<boolean> | undefined
  openPath: Path

  ready: boolean
  value: SanityDocumentLike
  formState: FormState
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
  formStateRef: RefObject<FormState>
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
  } = options
  const client = useClient({apiVersion: '2025-10-26'}) // xxx!
  const schema = useSchema()
  const presenceStore = usePresenceStore()
  const {data: releases} = useActiveReleases()
  const {data: documentVersions} = useDocumentVersions({documentId})

  const schemaType = schema.get(documentType) as ObjectSchemaType | undefined
  if (!schemaType) {
    throw new Error(`Schema type for '${documentType}' not found`)
  }
  const liveEdit = Boolean(schemaType.liveEdit)
  const publishedId = getPublishedId(documentId)

  const telemetry = useTelemetry()

  const {validation: validationRaw} = useValidationStatus(documentId, documentType, releaseId)
  const validation = useUnique(validationRaw)

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

  const activeDocumentReleaseId = useMemo(() => {
    // if a document version exists with the selected release id, then it should use that
    if (documentVersions.some((id) => getVersionFromId(id) === releaseId)) {
      return releaseId
    }

    // check if the selected version is the only version, if it isn't and it doesn't exist in the release
    // then it needs to use the documentVersions
    if (releaseId && (!documentVersions || !onlyHasVersions)) {
      return releaseId
    }

    return getVersionFromId(firstVersion ?? '')
  }, [documentVersions, onlyHasVersions, releaseId, firstVersion])

  const editState = useEditState(documentId, documentType, 'default', activeDocumentReleaseId)

  const connectionState = useConnectionState(documentId, documentType, releaseId)
  useReconnectingToast(connectionState === 'reconnecting')

  const [focusPath, setFocusPath] = useState<Path>(initialFocusPath || EMPTY_ARRAY)

  const value: SanityDocumentLike = useMemo(() => {
    const baseValue = initialValue?.value || {_id: documentId, _type: documentType}
    if (releaseId) {
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
    // if no version is selected, but there is only version, it should default to the version it finds
    if (!selectedPerspectiveName && onlyHasVersions) {
      return editState.version || editState.draft || editState.published || baseValue
    }
    return editState?.draft || editState?.published || baseValue
  }, [
    documentId,
    documentType,
    editState.draft,
    editState.published,
    editState.version,
    initialValue,
    liveEdit,
    releaseId,
    selectedPerspectiveName,
    onlyHasVersions,
  ])

  const {previousId: upstreamId} = useDocumentIdStack({
    strict: true,
    displayed: value,
    documentId,
    editState,
  })

  const upstreamEditState = useEditState(
    documentId,
    documentType,
    'low',
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
        setPresence(nextPresence)
      })
    return () => {
      subscription.unsubscribe()
    }
  }, [presenceStore, value._id])

  const [openPath, onSetOpenPath] = useState<Path>(EMPTY_ARRAY)
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
  const targetDocumentId = useMemo(() => {
    if (releaseId) {
      return getVersionId(publishedId, releaseId)
    }

    // in cases where there is a draft in a live edit, we need to use it so that it can be published
    // in case if the user has permissions to do so otherwise just use the published id
    return liveEdit ? editState?.draft?._id || publishedId : getDraftId(documentId)
  }, [documentId, editState?.draft?._id, liveEdit, publishedId, releaseId])
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
  const isCreateLinked = isSanityCreateLinkedDocument(value)

  const ready = connectionState === 'connected' && editState.ready && !initialValue?.loading

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
  const {isLinked} = useCanvasCompanionDoc(value._id)

  // eslint-disable-next-line complexity
  const readOnly = useMemo(() => {
    const hasNoPermission = !isPermissionsLoading && !permissions?.granted
    const updateActionDisabled = !isActionEnabled(schemaType!, 'update')
    const createActionDisabled = isNonExistent && !isActionEnabled(schemaType!, 'create')
    const reconnecting = connectionState === 'reconnecting'
    const isLocked = editState.transactionSyncLock?.enabled
    const willBeUnpublished = value ? isGoingToUnpublish(value) : false

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

    // in cases where the document has drafts but the schema is live edit, there is a risk of data loss, so we disable editing in this case
    if (liveEdit && editState.draft?._id) {
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

    const isReadOnly =
      !ready ||
      isLinked ||
      hasNoPermission ||
      updateActionDisabled ||
      createActionDisabled ||
      reconnecting ||
      isLocked ||
      isCreateLinked ||
      willBeUnpublished ||
      isReleaseLocked

    if (isReadOnly) return true
    if (typeof readOnlyProp === 'function') return readOnlyProp(editState)
    return Boolean(readOnlyProp)
  }, [
    isPermissionsLoading,
    isLinked,
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
    ready,
    isCreateLinked,
    isReleaseLocked,
    readOnlyProp,
  ])

  const {patch} = useDocumentOperation(documentId, documentType, releaseId)

  const patchRef = useRef<(event: PatchEvent) => void>(() => {
    throw new Error(
      'Attempted to patch the Sanity document during initial render or in an `useInsertionEffect`. Input components should only call `onChange()` in a useEffect or an event handler.',
    )
  })
  const handleChange = useCallback((event: PatchEvent) => patchRef.current(event), [])

  // console.log('[value id]', value._id)

  // `{ type: "createDocumentVersion"}` can be used to grab `timestamp`, which reflects when version created
  const eventsStore = useEventsStore({
    // documentId: releaseId ? getVersionId(documentId, releaseId) : documentId,
    documentId: value._id,
    documentType: editState.type /* , rev: editState.version, since*/,
  })

  // const upstreamEventsStore = useEventsStore({
  //   documentId: selectUpstreamVersion(upstreamEditState)?._id ?? documentId,
  //   documentType: editState.type /* , rev: editState.version, since*/,
  // })

  // upstreamEventsStore.getChangesList() // xxx

  const versionCreatedAt = useMemo(
    () => eventsStore.events.find((event) => event.type === 'createDocumentVersion')?.timestamp,
    [eventsStore.events],
  )

  // const upstreamAtForkStore = useTimelineStore({
  //   documentId: selectUpstreamVersion(upstreamEditState)?._id ?? documentId,
  //   // documentId: 'ad8d3bd5-1990-454a-9f82-71c28864dfe8',
  //   documentType,
  //   onError: (error) => console.error(error),
  //   // rev: params.rev,
  //   // rev: 'UXAXn1cxk7P5t3sh0OC6dr',
  //   // since: versionCreatedAt, // (-1ms)
  //   since:
  //     typeof versionCreatedAt === 'string'
  //       ? // ? `${new Date(versionCreatedAt).getTime().toString()}/UXAXn1cxk7P5t3sh0OC6dr`
  //         new Date(versionCreatedAt).getTime().toString()
  //       : undefined,
  //   // since: '@lastPublished',
  //   // rev: '5e73LZVBzvO1Aylk80XvhO',
  // })

  // const upstreamAtForkTimeline = useTimelineSelector(
  //   upstreamAtForkStore,
  //   // (state) => state.timelineDisplayed,
  //   (state) => state.sinceAttributes,
  //   // (state) => state.lastNonDeletedRevId,
  //   // (state) => state,
  // )

  const upstream = selectUpstreamVersion(upstreamEditState)

  const upstreamAtFork$ = useMemo(
    () =>
      typeof versionCreatedAt === 'string' && typeof upstream?._id === 'string'
        ? getDocumentAtRevision({
            client,
            documentId: upstream?._id,
            time: versionCreatedAt,
          })
        : of(null),
    [client, upstream?._id, versionCreatedAt],
  )

  const upstreamAtFork = useObservable(upstreamAtFork$, null)

  // useEffect(() => {
  //   console.log('[UPSTREAM AT FORK]', versionCreatedAt, upstreamAtFork)
  // }, [documentId, documentType, upstreamAtFork, upstreamEditState, versionCreatedAt])

  const divergences$ = useMemo(
    () =>
      findDivergences({
        upstreamAtFork: upstreamAtFork?.document ?? undefined,
        upstream: selectUpstreamVersion(upstreamEditState) ?? undefined,
        subject: editState.version ?? editState.draft ?? undefined,
        resolutions: (editState.version ?? editState.draft)?._system?.divergenceResolutions,
      }).pipe(
        toArray(),
        tap((divergences) => console.log('[divergences!]', divergences)),
      ),
    [editState, upstreamAtFork?.document, upstreamEditState],
  )

  useObservable(divergences$)

  // useEffect(() => {
  //   if (typeof versionCreatedAt === 'undefined') {
  //     return
  //   }

  //   ;(async () => {
  //     for await (const divergence of findDivergences({
  //       upstreamEditState,
  //       editState,
  //       upstreamAtFork: upstreamAtFork?.document ?? undefined,
  //       // versionCreatedAt,
  //     })) {
  //       console.log('[divergence]', divergence)
  //     }
  //   })()
  // }, [editState, eventsStore.events, upstreamAtFork, upstreamEditState, versionCreatedAt])

  useInsertionEffect(() => {
    // Create-linked documents enter a read-only state in Studio. However, unlinking a Create-linked
    // document necessitates patching it. This renders it impossible to unlink a Create-linked
    // document.
    //
    // Excluding Create-linked documents from this check is a simple way to ensure they can be
    // unlinked.
    //
    // This does mean `handleChange` can be used to patch any part of a Create-linked document,
    // which would otherwise be read-only.
    if (readOnly && !isCreateLinked) {
      patchRef.current = () => {
        throw new Error('Attempted to patch a read-only document')
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
  }, [
    editState.draft,
    editState.published,
    initialValue,
    patch,
    telemetry,
    readOnly,
    isCreateLinked,
  ])

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
  })!

  const formStateRef = useRef(formState)
  useEffect(() => {
    formStateRef.current = formState
  }, [formState])

  useComlinkViewHistory({editState})

  const handleSetOpenPath = useCallback(
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
  const focusPathRef = useRef<Path>([])

  const handleFocus = useCallback(
    (_nextFocusPath: Path, payload?: OnPathFocusPayload) => {
      const nextFocusPath = pathFor(_nextFocusPath)
      if (nextFocusPath !== focusPathRef.current) {
        setFocusPath(pathFor(nextFocusPath))

        // When focusing on an object field, set openPath to the field's parent.
        // Exception: if focusing directly on an array item (so it has a key),
        // it should skip updating openPath - let explicit onPathOpen calls handle it.
        const lastSegment = nextFocusPath[nextFocusPath.length - 1]

        if (!isKeySegment(lastSegment)) {
          // For fields inside array items, find the last key segment to preserve context
          const lastKeyIndex = nextFocusPath.findLastIndex((seg) => isKeySegment(seg))
          const newOpenPath =
            lastKeyIndex >= 0
              ? nextFocusPath.slice(0, lastKeyIndex + 1)
              : nextFocusPath.slice(0, -1)

          handleSetOpenPath(pathFor(newOpenPath))
        }

        focusPathRef.current = nextFocusPath
        onFocusPath?.(nextFocusPath)
      }
      updatePresenceThrottled(nextFocusPath, payload)
    },
    [onFocusPath, setFocusPath, handleSetOpenPath, updatePresenceThrottled],
  )

  const handleBlur = useCallback(
    (_blurredPath: Path) => {
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

  const handleProgrammaticFocus = useCallback(
    (nextPath: Path) => {
      // Supports changing the focus path not by a user interaction, but by a programmatic change, e.g. the url path changes.

      if (!deepEquals(focusPathRef.current, nextPath)) {
        setFocusPath(nextPath)
        handleSetOpenPath(nextPath)
        onFocusPath?.(nextPath)

        focusPathRef.current = nextPath
      }
    },
    [onFocusPath, handleSetOpenPath],
  )
  return {
    editState,
    upstreamEditState,
    connectionState,
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

// async function* findDivergences({
//   upstreamEditState,
//   editState,
//   upstreamAtFork,
// }: FindDivergencesContext): AsyncGenerator<DivergenceAtPath> {
//   // the problem with this approach is that changing any upstream field causes that document's
//   // revision to change. the effect is that changes to any field in the upstream will result in a
//   // divergence for all fields in the subject doc, even for fields that are unchanged since the last
//   // resolution marker.
//   //
//   // lazy solution might be to store the upstream value in addition to the `_rev` in the `_system`
//   // data of the subject doc. a divergence would require the upstream doc `_rev` has changes *and*
//   // the content at the given field path has changed. however, this feels inefficient. maybe we could
//   // use a hash instead? 🤔
//   //
//   // two fold approach:
//   //   - first check `_rev` as an inexpensive comparison.
//   //   - if rev changed, calculate and compare sha-1 hash.
//   //
//   // bonus:
//   //   - we don't need transactions at all; just two documents to compare.
//   //   - having the `_rev` means we can compute how the upstream has changed since the last
//   //     resolution marker.
//   //
//   // how will this be stored in `_system`?
//   //
//   // ```json
//   // {
//   //   "_system": {
//   //     "title": ["someRev", "someHash"],
//   //     "someArray": ["someRev", "someHash"],
//   //     "someArray[0]": ["someRev", "someHash"],
//   //     "someObjectArray": ["someRev", "someHash"],
//   //     "someObjectArray[_key=x].title": ["someRev", "someHash"],
//   //     "someObject": ["someRev", "someHash"],
//   //     "someObject.title": ["someRev", "someHash"]
//   //   }
//   // }
//   // ```
//   //
//   // why store resolution markers for parent arrays and objects in addition to each member?
//   //   - allows us to determine that a member was added, removed, or moved.
//   //
//   // what about understanding intention e.g. that an array member moved. or seeing who made the change?
//   //   - identify existency of divergence cheaply using document comparison approach.
//   //   - lazily computer further details on closer inspection. requires loading and processing
//   //     transactions, which is more costly.
//   //
//   // things to be wary of:
//   //   - removal or fields and setting fields to `null`.
//   //   - upstream changing due to previous upstream being published or removed. should resolution marker include upstream id?
//   //
//   // ***
//   //
//   // another approach could be to walk the transaction log of the upstream in order to identify
//   // whether any mutations have occurred for the given field path since the last resolution marker.
//   // however, this is complicated and potentially costly in the quanity of data we'd need to load.
//   // it also has the downside that noop changes could be identified as divergences (e.g. a value is
//   // changed from "x" -> "y" -> "x" in the upstream since the last resolution marker).
//   const upstream = selectUpstreamVersion(upstreamEditState)
//   const value = editState.version ?? editState.draft

//   if (upstream === null || value === null) {
//     return // {}
//   }

//   // this would come from `_system` in the document
//   const divergenceStatus: Record<string, ResolutionMarker> = {
//     'image': ['GHo0Y0SNkSU8z2lb76buJ5', '9746c39664f005cd7b92aa24ab119fc5e11b53e8'],
//     'image._type': ['GHo0Y0SNkSU8z2lb76buJ5', '0e76292794888d4f1fa75fb3aff4ca27c58f56a6'],
//     'name': ['GHo0Y0SNkSU8z2lb76buJ5', 'bb3a7f6c39752c310e6a6e65bb8fe0772cf7bce0'],
//     // 'slug': ['someRevision', 'someHash'],
//     // 'slug.current': ['someRevision', 'someHash'],
//   }

//   const state: Record<string, Record<SnapshotType, unknown | undefined>> = {}

//   for (const [snapshotType, [flatPath, nodeValue]] of combineIterators(
//     flattenObject(value).map((v) => ['current', v]),
//     flattenObject(upstream).map((v) => ['upstream', v]),
//     flattenObject(upstreamAtFork ?? {}).map((v) => ['upstreamAtFork', v]),
//   )) {
//     state[flatPath] ??= {}
//     state[flatPath][snapshotType] = nodeValue
//   }

//   for (const [flatPath, snapshots] of Object.entries(state)) {
//     const resolutionMarker = divergenceStatus[flatPath]
//     const nextResolutionMarkerXxx = [upstream._rev, await hashAnything(snapshots.upstream)]

//     const strategy: DivergenceDetectionStrategy =
//       typeof resolutionMarker === 'undefined' ? 'sinceFork' : 'sinceResolution'

//     if (strategy === 'sinceFork') {
//       // xxx what if new upstream created after fork? probably get earliest existing snapshot
//       if (upstreamAtFork?._rev !== upstream._rev) {
//         const [hashA, hashB] = await Promise.all([
//           hashAnything(snapshots.upstreamAtFork),
//           hashAnything(snapshots.upstream),
//         ])

//         if (hashA !== hashB) {
//           yield [
//             flatPath,
//             {
//               status: 'unresolved',
//               debugA: {
//                 hashA,
//                 hashB,
//                 snapshots,
//                 nextResolutionMarkerXxx,
//               },
//             },
//           ]
//         }
//       }

//       continue
//     }

//     if (strategy === 'sinceResolution') {
//       if (upstream._rev !== resolutionMarker[0]) {
//         const hashA = await hashAnything(snapshots.upstream)

//         if (hashA !== resolutionMarker[1]) {
//           yield [
//             flatPath,
//             {
//               status: 'unresolved',
//               debugB: {
//                 hashA,
//                 hashB: resolutionMarker[1],
//                 snapshots,
//                 nextResolutionMarkerXxx,
//               },
//             },
//           ]
//         }
//       }
//     }
//   }

//   // this field has no existing resolution markers
//   // we will need to check whether the upstream value has changed since version was created
//   //
//   // - has there been mutation to this node in upstream since version was created?
//   // - AND is hash of current upstream value different to hash of current version value?
//   //
//   // 1. load transanctions for version… when was it created? sadly we can't determine this from the doc itself, as it inherits the base document's timestamps when it's created.
//   // 2. load transactions for upstream (potentially *since version was created*. pro: less data, con: creates waterfall). has a mutation occurred at given path since version was created?
//   // 3. if upstream has been mutated, is the hash of its value different to the hash of the value at the given path?

//   // if there is a resolution marker, we don't need translog.
//   // instead, we check:
//   //   - is the upstream rev different to the resolution marker's rev?
//   //   - AND is the hash of the upstream value different to the resolution marker's rev?
// }

// const stuff = combineIterators(
//   (function* () {
//     yield 'a'
//   })(),
//   (function* () {
//     yield 1
//   })(),
// )

// for (const thing of stuff) {
//   console.log(thing)
// }

// function* combineIterators<A>(...iterators: Generator<A>[]): Generator<A> {
//   for (const iterator of iterators) {
//     yield* iterator
//   }
// }
//
// function* combineIterators(...iterators: Generator<any, any, any>[]): Generator<any, any, any> {
//   for (const iterator of iterators) {
//     yield* iterator
//   }
// }
