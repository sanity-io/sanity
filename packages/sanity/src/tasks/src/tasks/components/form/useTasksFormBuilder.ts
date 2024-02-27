/* eslint-disable no-warning-comments */
/* eslint-disable react/jsx-no-bind */
import {type ObjectSchemaType, type Path} from '@sanity/types'
import {useCallback, useMemo, useRef, useState} from 'react'
import {
  createPatchChannel,
  type DocumentPresence,
  type FormBuilderProps,
  type FormDocumentValue,
  type PatchEvent,
  setAtPath,
  type StateTree,
  toMutationPatches,
  useConnectionState,
  useDocumentOperation,
  useEditState,
  useFormState,
  useSchema,
  useUnique,
  useValidationStatus,
} from 'sanity'

import {type TaskDocument} from '../../types'

/**
 * TODO:
 *  - [] add presence
 */

type TasksFormBuilder =
  | (FormBuilderProps & {
      loading?: undefined
    })
  | {
      loading: true
    }

interface TasksFormBuilderOptions {
  documentType: string
  documentId: string
  initialValue?: Partial<TaskDocument>
  action: 'create' | 'edit'
}

export function useTasksFormBuilder(options: TasksFormBuilderOptions): TasksFormBuilder {
  const {documentType = 'tasks.task', documentId, initialValue = {}, action} = options
  const schema = useSchema()

  const tasksSchemaType = schema.get(documentType) as ObjectSchemaType | undefined
  if (!tasksSchemaType) {
    throw new Error(`Schema type for '${documentType}' not found`)
  }

  const {validation: validationRaw} = useValidationStatus(documentId, documentType)
  const validation = useUnique(validationRaw)
  const [focusPath, setFocusPath] = useState<Path>([])
  const [openPath, setOpenPath] = useState<Path>([])
  const [collapsedPaths, onSetCollapsedPath] = useState<StateTree<boolean>>()
  const [collapsedFieldSets, onSetCollapsedFieldSets] = useState<StateTree<boolean>>()
  const [fieldGroupState, onSetFieldGroupState] = useState<StateTree<string>>()
  const [presence] = useState<DocumentPresence[]>([])

  const handleFocus = useCallback(
    (nextFocusPath: Path) => {
      setFocusPath(nextFocusPath)
      // presenceStore.setLocation([.....
    },
    [setFocusPath],
  )
  const handleBlur = useCallback(() => {
    setFocusPath([])
  }, [])

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

  const {patch} = useDocumentOperation(documentId, documentType)
  const patchRef = useRef<(event: PatchEvent) => void>(() => {
    throw new Error('Nope')
  })

  patchRef.current = (event: PatchEvent) => {
    patch.execute(toMutationPatches(event.patches), initialValue)
  }

  const handleChange = useCallback(
    (event: PatchEvent) => {
      if (action === 'create') {
        console.log('EVENT', event)
      } else patchRef.current(event)
    },
    [action],
  )
  const connectionState = useConnectionState(documentId, documentType)
  const editState = useEditState(documentId, documentType)

  const value = editState?.draft || editState?.published || initialValue

  const formState = useFormState(tasksSchemaType, {
    value: value,
    comparisonValue: value,
    readOnly: false,
    changesOpen: false,
    presence,
    focusPath,
    openPath,
    collapsedPaths,
    collapsedFieldSets,
    fieldGroupState,
    validation,
  })

  const ready = editState.ready && connectionState === 'connected'

  const patchChannel = useMemo(() => createPatchChannel(), [])
  if (formState === null || !ready) {
    return {loading: true}
  }

  return {
    id: 'root',
    onChange: handleChange,
    // eslint-disable-next-line camelcase
    __internal_patchChannel: patchChannel,
    // eslint-disable-next-line camelcase
    __internal_fieldActions: undefined,
    onPathFocus: handleFocus,
    onPathOpen: setOpenPath,
    onPathBlur: handleBlur,
    onFieldGroupSelect: handleSetActiveFieldGroup,
    onSetFieldSetCollapsed: handleOnSetCollapsedFieldSet,
    onSetPathCollapsed: handleOnSetCollapsedPath,
    collapsedPaths,
    collapsedFieldSets,
    focusPath: formState.focusPath,
    changed: formState.changed,
    focused: formState.focused,
    groups: formState.groups,
    validation: formState.validation,
    members: formState.members,
    presence: formState.presence,
    schemaType: tasksSchemaType,
    value: formState.value as FormDocumentValue,
  }
}
