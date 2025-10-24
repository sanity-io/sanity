/* eslint-disable max-statements */
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

import {useCanvasCompanionDoc} from '../canvas/actions/useCanvasCompanionDoc'
import {isSanityCreateLinkedDocument} from '../create/createUtils'
import {useReconnectingToast} from '../hooks'
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
  usePresenceStore,
} from '../store'
import {isNewDocument} from '../store/_legacy/document/isNewDocument'
import {getDraftId, getPublishedId, getVersionFromId, getVersionId, useUnique} from '../util'
import {
  type FormState,
  type NodeChronologyProps,
  type OnPathFocusPayload,
  type PatchEvent,
  type StateTree,
  toMutationPatches,
  useFormState,
} from '.'
import {CreatedDraft} from './__telemetry__/form.telemetry'
import {useComlinkViewHistory} from './useComlinkViewHistory'
import {useFormLocationState} from './useFormLocation'

interface DocumentFormOptions {
  documentType: string
  documentId: string
  releaseId?: ReleaseId
  initialValue?: InitialValueState
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
  focusPath: Path
  onFocusPath: (path: Path) => void
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
  formStateRef: RefObject<FormState | undefined>
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
    focusPath,
    selectedPerspectiveName,
    readOnly: readOnlyProp,
    onFocusPath,
    displayInlineChanges,
  } = options
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

  const prevFormStateRef = useRef<FormState>(undefined)

  const {
    onPathOpen,
    openPath,
    selectedFieldGroup,
    collapsedPaths,
    collapsedFieldSets,
    onSetCollapsedPath,
    onSetCollapsedFieldSet,
    onSetActiveFieldGroup,
  } = useFormLocationState({focusPath, prevFormStateRef})

  const formState = useFormState({
    schemaType,
    documentValue: formDocumentValue,
    readOnly,
    comparisonValue: comparisonValue || value,
    focusPath,
    openPath,
    fieldGroupState: selectedFieldGroup,
    perspective: selectedPerspective,
    collapsedPaths,
    presence,
    validation,
    collapsedFieldSets,
    changesOpen,
    hasUpstreamVersion,
    displayInlineChanges,
  })!

  useEffect(() => {
    prevFormStateRef.current = formState
  }, [formState])

  useComlinkViewHistory({editState})

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

  const handlePathFocus = useCallback(
    (_nextFocusPath: Path, payload?: OnPathFocusPayload) => {
      const nextFocusPath = pathFor(_nextFocusPath)
      updatePresenceThrottled(nextFocusPath, payload)
      onFocusPath(nextFocusPath)
    },
    [onFocusPath, updatePresenceThrottled],
  )

  const handleBlur = useCallback((_blurredPath: Path) => {
    //onFocusPath(EMPTY_ARRAY)
    // note: we're deliberately not syncing presence here since it would make the user avatar disappear when a
    // user clicks outside a field without focusing another one
  }, [])

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
    formStateRef: prevFormStateRef,
    hasUpstreamVersion,
    collapsedFieldSets,
    onSetCollapsedFieldSet,
    collapsedPaths,
    onSetCollapsedPath,
    openPath,
    schemaType,
    onChange: handleChange,
    onPathOpen,
    onBlur: handleBlur,
    onFocus: handlePathFocus,
    onSetActiveFieldGroup,
  }
}
