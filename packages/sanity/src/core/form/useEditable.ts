import {type ReleaseId, type SanityDocument} from '@sanity/client'
import {isActionEnabled} from '@sanity/schema/_internal'
import {useTelemetry} from '@sanity/telemetry/react'
import {
  type ObjectSchemaType,
  type Path,
  type SanityDocumentLike,
  type ValidationMarker,
} from '@sanity/types'
import {useToast} from '@sanity/ui'
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

import {isSanityCreateLinkedDocument} from '../create/createUtils'
import {type ConnectionState, useConnectionState} from '../hooks/useConnectionState'
import {useDocumentOperation} from '../hooks/useDocumentOperation'
import {useEditState} from '../hooks/useEditState'
import {useSchema} from '../hooks/useSchema'
import {useValidationStatus} from '../hooks/useValidationStatus'
import {useTranslation} from '../i18n/hooks/useTranslation'
import {
  type DocumentPresence,
  type EditStateFor,
  type PermissionCheckResult,
  useDocumentValuePermissions,
  usePresenceStore,
} from '../store'
import {EMPTY_ARRAY, useUnique} from '../util'
import {deepEquals} from '../validation/util/deepEquals'
import {
  type FormState,
  getExpandOperations,
  type OnPathFocusPayload,
  type PatchEvent,
  setAtPath,
  type StateTree,
  toMutationPatches,
  useFormState,
} from '.'
import {CreatedDraft} from './__telemetry__/form.telemetry'

interface EditableOptions {
  documentType: string
  documentId: string
  initialValue?: SanityDocumentLike
  releaseId?: ReleaseId
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
}
interface EditableValues {
  editState: EditStateFor
  connectionState: ConnectionState
  collapsedFieldSets: StateTree<boolean> | undefined
  collapsedPaths: StateTree<boolean> | undefined
  openPath: Path
  onBlur: (blurredPath: Path) => void
  onFocus: (_nextFocusPath: Path, payload?: OnPathFocusPayload) => void
  onSetCollapsedPath: (path: Path, collapsed: boolean) => void
  onSetActiveFieldGroup: (path: Path, groupName: string) => void
  onSetCollapsedFieldSet: (path: Path, collapsed: boolean) => void
  ready: boolean
  value: SanityDocumentLike
  formState: FormState
  focusPath: Path
  validation: ValidationMarker[]
  permissions: PermissionCheckResult | undefined
  isPermissionsLoading: boolean
  onChange: (event: PatchEvent) => void
  onPathOpen: (path: Path) => void
  onProgrammaticFocus: (nextPath: Path) => void
  formStateRef: RefObject<FormState>
  schemaType: ObjectSchemaType
}

export function useEditable(options: EditableOptions): EditableValues {
  const {
    documentType,
    documentId,
    initialValue,
    comparisonValue: comparisonValueRaw,
    releaseId,
    initialFocusPath,
    selectedPerspectiveName,
    readOnly: readOnlyProp,
    onFocusPath,
  } = options
  const schema = useSchema()
  const presenceStore = usePresenceStore()

  const schemaType = schema.get(documentType) as ObjectSchemaType | undefined
  if (!schemaType) {
    throw new Error(`Schema type for '${documentType}' not found`)
  }
  const telemetry = useTelemetry()

  const {validation: validationRaw} = useValidationStatus(documentId, documentType, releaseId)
  const validation = useUnique(validationRaw)

  const editState = useEditState(documentId, documentType, 'default', releaseId)
  const connectionState = useConnectionState(documentId, documentType, {version: releaseId})
  useConnectionToast(connectionState)

  const [focusPath, setFocusPath] = useState<Path>(initialFocusPath || EMPTY_ARRAY)
  const [openPath, setOpenPathState] = useState<Path>(EMPTY_ARRAY)
  const [collapsedPaths, onSetCollapsedPath] = useState<StateTree<boolean>>()
  const [collapsedFieldSets, onSetCollapsedFieldSets] = useState<StateTree<boolean>>()
  const [fieldGroupState, onSetFieldGroupState] = useState<StateTree<string>>()
  const [presence, setPresence] = useState<DocumentPresence[]>([])

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

  const comparisonValue = useMemo(() => {
    if (typeof comparisonValueRaw === 'function') {
      return comparisonValueRaw(editState)
    }
    return comparisonValueRaw
  }, [comparisonValueRaw, editState])

  const {patch} = useDocumentOperation(documentId, documentType)

  const patchRef = useRef<(event: PatchEvent) => void>(() => {
    throw new Error(
      'Attempted to patch the Sanity document during initial render or in an `useInsertionEffect`. Input components should only call `onChange()` in a useEffect or an event handler.',
    )
  })
  useInsertionEffect(() => {
    // note: this needs to happen in an insertion effect to make sure we're ready to receive patches from child components when they run their effects initially
    // in case they do e.g. `useEffect(() => props.onChange(set("foo")), [])`
    // Note: although we discourage patch-on-mount, we still support it.
    patchRef.current = (event: PatchEvent) => {
      // when creating a new draft
      if (!editState.draft && !editState.published && !editState.version) {
        telemetry.log(CreatedDraft)
      }
      patch.execute(toMutationPatches(event.patches), initialValue)
    }
  }, [editState.draft, editState.published, editState.version, initialValue, patch, telemetry])

  const handleChange = useCallback((event: PatchEvent) => patchRef.current(event), [])

  const documentValue: SanityDocumentLike = useMemo(() => {
    const baseValue = initialValue || {
      _id: documentId,
      _type: documentType,
    }
    if (releaseId) {
      return (
        editState.version || editState.draft || editState.published || initialValue || baseValue
      )
    }
    if (selectedPerspectiveName === 'published') {
      return editState.published || editState.draft || initialValue || baseValue
    }
    return editState?.draft || editState?.published || initialValue || baseValue
  }, [
    documentId,
    documentType,
    editState.draft,
    editState.published,
    editState.version,
    initialValue,
    releaseId,
    selectedPerspectiveName,
  ])

  useEffect(() => {
    const subscription = presenceStore
      .documentPresence(documentValue._id)
      .subscribe((nextPresence) => {
        setPresence(nextPresence)
      })
    return () => {
      subscription.unsubscribe()
    }
  }, [presenceStore, documentValue._id])

  const [permissions, isPermissionsLoading] = useDocumentValuePermissions({
    document: documentValue,
    permission: documentValue._createdAt ? 'update' : 'create',
  })

  const isNonExistent = !documentValue?._id
  const isCreateLinked = isSanityCreateLinkedDocument(documentValue)
  const ready = editState.ready && connectionState === 'connected'

  const readOnly = useMemo(() => {
    const createActionDisabled = isNonExistent && !isActionEnabled(schemaType!, 'create')
    const updateActionDisabled = !isActionEnabled(schemaType!, 'update')

    const hasNoPermission = !isPermissionsLoading && !permissions?.granted
    const reconnecting = connectionState === 'reconnecting'
    const isLocked = editState.transactionSyncLock?.enabled

    const editableReadOnly =
      reconnecting ||
      hasNoPermission ||
      isLocked ||
      createActionDisabled ||
      updateActionDisabled ||
      isCreateLinked ||
      !ready

    if (editableReadOnly) return true
    if (typeof readOnlyProp === 'function') return readOnlyProp(editState)
    return Boolean(readOnlyProp)
  }, [
    isNonExistent,
    schemaType,
    isPermissionsLoading,
    permissions?.granted,
    connectionState,
    ready,
    editState,
    isCreateLinked,
    readOnlyProp,
  ])

  const formState = useFormState({
    schemaType,
    documentValue,
    comparisonValue: comparisonValue || documentValue,
    readOnly,
    changesOpen: false,
    presence,
    focusPath,
    openPath,
    collapsedPaths,
    collapsedFieldSets,
    fieldGroupState,
    validation,
  })!

  const formStateRef = useRef(formState)
  useEffect(() => {
    formStateRef.current = formState
  }, [formState])

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
      setOpenPathState(path)
    },
    [formStateRef],
  )

  const updatePresence = useCallback(
    (nextFocusPath: Path, payload?: OnPathFocusPayload) => {
      presenceStore.setLocation([
        {
          type: 'document',
          documentId: documentValue._id,
          path: nextFocusPath,
          lastActiveAt: new Date().toISOString(),
          selection: payload?.selection,
        },
      ])
    },
    [presenceStore, documentValue._id],
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
        setOpenPath(pathFor(nextFocusPath.slice(0, -1)))
        focusPathRef.current = nextFocusPath
        onFocusPath?.(nextFocusPath)
      }
      updatePresenceThrottled(nextFocusPath, payload)
    },
    [onFocusPath, setFocusPath, setOpenPath, updatePresenceThrottled],
  )

  const disableBlurRef = useRef(false)

  const handleBlur = useCallback(
    (_blurredPath: Path) => {
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

  const handleProgrammaticFocus = useCallback(
    (nextPath: Path) => {
      // Supports changing the focus path not by a user interaction, but by a programmatic change, e.g. the url path changes.
      // to avoid the blur event to be triggered, we set a flag to disable it for a short period of time.
      disableBlurRef.current = true

      // Reset focus path when url params path changes
      if (!deepEquals(focusPathRef.current, nextPath)) {
        setFocusPath(nextPath)
        setOpenPath(nextPath)
        onFocusPath?.(nextPath)

        focusPathRef.current = nextPath
      }

      const timeout = setTimeout(() => {
        disableBlurRef.current = false
      }, 0)
      return () => clearTimeout(timeout)
    },
    [onFocusPath, setOpenPath],
  )
  return {
    editState,
    connectionState,
    focusPath,
    validation,
    ready,
    value: documentValue,
    formState,
    permissions,
    isPermissionsLoading,
    formStateRef,

    collapsedFieldSets,
    collapsedPaths,
    openPath,
    schemaType,
    onChange: handleChange,
    onPathOpen: setOpenPath,
    onProgrammaticFocus: handleProgrammaticFocus,
    onBlur: handleBlur,
    onFocus: handleFocus,
    onSetActiveFieldGroup: handleSetActiveFieldGroup,
    onSetCollapsedPath: handleOnSetCollapsedPath,
    onSetCollapsedFieldSet: handleOnSetCollapsedFieldSet,
  }
}

const useConnectionToast = (connectionState: ConnectionState) => {
  const {push: pushToast} = useToast()
  const {t} = useTranslation('studio')

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    if (connectionState === 'reconnecting') {
      timeout = setTimeout(() => {
        pushToast({
          id: 'sanity/reconnecting',
          status: 'warning',
          title: t('panes.document-pane-provider.reconnecting.title'),
        })
      }, 2000) // 2 seconds, we can iterate on the value
    }
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [connectionState, pushToast, t])
}
