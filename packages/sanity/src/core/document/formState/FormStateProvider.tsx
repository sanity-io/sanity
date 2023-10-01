import {ObjectSchemaType, Path, SanityDocumentLike} from '@sanity/types'
import React, {useCallback, useMemo, useState, useEffect} from 'react'
import {resolveKeyedPath} from '@sanity/util/paths'
import {isActionEnabled} from '@sanity/schema/_internal'
import {
  StateTree,
  PatchEvent,
  setAtPath,
  getExpandOperations,
  toMutationPatches,
  useFormState as useFormStateStandalone,
} from '../../form'
import {
  useSchema,
  useDocumentOperation,
  useConnectionState,
  useEditState,
  useValidationStatus,
} from '../../hooks'
import {usePresenceStore, DocumentPresence, useDocumentValuePermissions} from '../../store'
import {getPublishedId, getDraftId} from '../../util'
import {useStableCallback} from '../../util/useStableCallback'
import {useInitialValue} from '../initialValue/useInitialValue'
import {useDocumentId} from '../useDocumentId'
import {useDocumentType} from '../useDocumentType'
import {useTimelineSelector} from '../timeline'
import {FormStateContext, FormStateContextValue} from './FormStateContext'

const EMPTY_STATE_TREE: StateTree<never> = {value: undefined}
const EMPTY_PATH: Path = []

/** @internal */
export interface FormStateProviderProps {
  isHistoryInspectorOpen?: boolean
  initialFocusPath?: Path
  children: React.ReactNode
}

/** @internal */
export function FormStateProvider<TDocument extends SanityDocumentLike>({
  isHistoryInspectorOpen = false,
  initialFocusPath,
  children,
}: FormStateProviderProps) {
  const documentId = useDocumentId()
  const documentType = useDocumentType()
  const {patch, delete: deleteOp} = useDocumentOperation(documentId, documentType)
  const [isDeleting, setIsDeleting] = useState(false)
  const initialValue = useInitialValue() // useProvidedInitialValue ?? or useInitialValueFromContext
  const connectionState = useConnectionState(documentId, documentType)
  const editState = useEditState(documentId, documentType)
  const presenceStore = usePresenceStore()
  const [error, setError] = useState<Error | null>(null)
  if (error) throw error

  const [presence, setPresence] = useState<DocumentPresence[]>([])
  useEffect(() => {
    const subscription = presenceStore.documentPresence(documentId).subscribe({
      next: setPresence,
      error: setError,
    })

    return () => subscription.unsubscribe()
  }, [documentId, presenceStore])

  const {
    onOlderRevision,
    timelineDisplayed,
    hasRevTime,
    sinceAttributes,
    timelineReady,
    isPristine,
  } = useTimelineSelector(
    useCallback(
      (state) => ({
        onOlderRevision: state.onOlderRevision,
        timelineDisplayed: state.timelineDisplayed,
        hasRevTime: state.revTime !== null,
        timelineReady: state.timelineReady,
        sinceAttributes: state.sinceAttributes,
        isPristine: state.isPristine,
      }),
      [],
    ),
  )

  const {value, valueOrigin} = ((): Pick<
    FormStateContextValue<TDocument>,
    'valueOrigin' | 'value'
  > => {
    if (onOlderRevision) {
      return {
        valueOrigin: 'historical-value',
        value: (timelineDisplayed || {_id: documentId, _type: documentType}) as TDocument,
      }
    }

    if (editState.draft) {
      return {
        valueOrigin: 'draft-value',
        value: editState.draft as TDocument,
      }
    }

    if (editState.published) {
      return {
        valueOrigin: 'published-value',
        value: editState.published as TDocument,
      }
    }

    return {
      valueOrigin: 'initial-value',
      value: initialValue as TDocument,
    }
  })()

  const compareValue: TDocument | null = isHistoryInspectorOpen
    ? (sinceAttributes as TDocument)
    : (editState?.published as TDocument) || null

  const schema = useSchema()
  const schemaType = schema.get(documentType) as ObjectSchemaType | undefined

  if (!schemaType) {
    throw new Error(`Could not find schema type for document type \`${documentType}\``)
  }

  const [focusPath, _setFocusPath] = useState<Path>(() =>
    initialFocusPath ? resolveKeyedPath(value, initialFocusPath) : EMPTY_PATH,
  )
  const [openPath, _setOpenPath] = useState<Path>(
    () =>
      // set the openPath to the initial focus path
      focusPath || EMPTY_PATH,
  )
  const [fieldGroupState, _setFieldGroupState] = useState<StateTree<string>>(EMPTY_STATE_TREE)
  const [collapsedPaths, _setCollapsedPaths] = useState<StateTree<boolean>>(EMPTY_STATE_TREE)
  const [collapsedFieldsets, _setCollapsedFieldsets] =
    useState<StateTree<boolean>>(EMPTY_STATE_TREE)

  const setPathCollapsed = useCallback((path: Path, collapsed: boolean) => {
    _setCollapsedPaths((prevState) => setAtPath(prevState, path, collapsed))
  }, [])

  const setFieldsetCollapsed = useCallback((path: Path, collapsed: boolean) => {
    _setCollapsedFieldsets((prevState) => setAtPath(prevState, path, collapsed))
  }, [])

  const setActiveFieldGroup = useCallback((path: Path, groupName: string) => {
    _setFieldGroupState((prevState) => setAtPath(prevState, path, groupName))
  }, [])

  const [permissions, isPermissionsLoading] = useDocumentValuePermissions({
    document: useMemo(() => {
      return {
        ...value,
        _id: editState.liveEdit ? getPublishedId(documentId) : getDraftId(documentId),
      }
    }, [value, editState.liveEdit, documentId]),
    permission: value._createdAt ? 'update' : 'create',
  })

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
  const ready = connectionState === 'connected' && editState.ready && timelineReady

  const readOnly = (() => {
    const hasNoPermission = !isPermissionsLoading && !permissions?.granted
    const updateActionDisabled = !isActionEnabled(schemaType, 'update')
    const isNonExistent = !value?._id
    const createActionDisabled = isNonExistent && !isActionEnabled(schemaType, 'create')
    const reconnecting = connectionState === 'reconnecting'
    const isLocked = editState.transactionSyncLock?.enabled

    return (
      !ready ||
      hasRevTime ||
      hasNoPermission ||
      updateActionDisabled ||
      createActionDisabled ||
      reconnecting ||
      isLocked
    )
  })()

  const {validation} = useValidationStatus(documentId, documentType)

  const formState = useFormStateStandalone(schemaType, {
    fieldGroupState,
    collapsedFieldSets: collapsedFieldsets,
    collapsedPaths,
    value,
    comparisonValue: compareValue,
    focusPath,
    openPath,
    readOnly,
    presence,
    validation,
    changesOpen: isHistoryInspectorOpen,
  })

  const setOpenPath = useStableCallback((path: Path) => {
    if (!formState) return

    const ops = getExpandOperations(formState, path)

    for (const op of ops) {
      switch (op.type) {
        case 'expandPath': {
          setPathCollapsed(op.path, false)
          break
        }
        case 'expandFieldSet': {
          setFieldsetCollapsed(op.path, false)
          break
        }
        case 'setSelectedGroup': {
          setActiveFieldGroup(op.path, op.groupName)
          break
        }
        default: {
          throw new Error(
            `Could not handle operation \`${
              // @ts-expect-error `op` should be of type never here
              op.type
            }\``,
          )
        }
      }
    }

    _setOpenPath(path)
  })

  const patchValue = useStableCallback((event: PatchEvent) => {
    patch.execute(toMutationPatches(event.patches), initialValue)
  })

  const setFocusPath = useStableCallback((nextFocusPath: Path) => {
    _setFocusPath(nextFocusPath)
    presenceStore.setLocation([
      {
        type: 'document',
        documentId,
        path: nextFocusPath,
        lastActiveAt: new Date().toISOString(),
      },
    ])
  })

  const deleteFn = useStableCallback(() => {
    setIsDeleting(true)
    deleteOp.execute()
  })

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
    return Boolean(!editState?.draft && !editState?.published) && !isPristine
  }, [editState?.draft, editState?.published, isPristine, timelineReady])

  const contextValue: FormStateContextValue<TDocument> = {
    documentId,
    documentType,
    editState,
    value,
    valueOrigin,
    formState,
    compareValue,
    activeFieldGroups: fieldGroupState,
    collapsedFieldsets,
    collapsedPaths,
    focusPath,
    isPermissionsLoading,
    openPath,
    permissions,
    ready,
    validation,
    patchValue,
    setActiveFieldGroup,
    setFieldsetCollapsed,
    setFocusPath,
    setOpenPath,
    setPathCollapsed,
    schemaType,
    connectionState,
    delete: deleteFn,
    isDeleted,
    isDeleting,
  }

  return <FormStateContext.Provider value={contextValue}>{children}</FormStateContext.Provider>
}
