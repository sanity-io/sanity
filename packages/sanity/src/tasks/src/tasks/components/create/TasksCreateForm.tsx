/* eslint-disable no-warning-comments */
/* eslint-disable react/jsx-no-bind */
import {type ObjectSchemaType, type Path, type SanityDocumentLike} from '@sanity/types'
import {Box} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'
import {
  createPatchChannel,
  FormBuilder,
  type FormDocumentValue,
  LoadingBlock,
  type PatchEvent,
  ResourceCacheProvider,
  SourceProvider,
  toMutationPatches,
  useConnectionState,
  useDocumentOperation,
  useEditState,
  useFormState,
  useSchema,
  useSource,
  useWorkspaces,
  WorkspaceProvider,
  WorkspacesProvider,
} from 'sanity'

import {useWorkspaceLoader} from '../../../../../core/studio/workspaceLoader'
import {CommentsEnabledProvider} from '../../../../../structure/comments'
import {taskSchema} from './taskSchema'

/**
 * TODO:
 *  - [] add presence
 */

const TasksCreateFormInner = () => {
  const schema = useSchema()
  const documentType = 'tasks.task'
  const documentId = 'b5XL0lGtrYgGdGucT9mYfC'
  const initialValue = {
    _id: documentId,
    _type: documentType,
  }
  const tasksSchemaType = schema.get(documentType) as ObjectSchemaType | undefined

  const {patch} = useDocumentOperation(documentId, documentType)
  const patchRef = useRef<(event: PatchEvent) => void>(() => {
    throw new Error('Nope')
  })
  const [focusPath, setFocusPath] = useState<Path>([])
  const [openPath, setOpenPath] = useState<Path>([])
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

  patchRef.current = (event: PatchEvent) => {
    patch.execute(toMutationPatches(event.patches), initialValue)
  }

  const handleChange = useCallback((event: PatchEvent) => patchRef.current(event), [])
  const connectionState = useConnectionState(documentId, documentType)
  const editState = useEditState(documentId, documentType)

  const value: SanityDocumentLike = editState?.draft || editState?.published || initialValue

  const formState = useFormState(tasksSchemaType!, {
    presence: [],
    value: value,
    comparisonValue: value,
    readOnly: false,
    focusPath: focusPath,
    openPath: openPath,
    collapsedPaths: undefined,
    collapsedFieldSets: undefined,
    fieldGroupState: undefined,
    changesOpen: false,
    validation: [],
  })
  const ready = editState.ready && connectionState === 'connected'

  const patchChannel = useMemo(() => createPatchChannel(), [])
  if (!ready) {
    return <LoadingBlock showText />
  }
  return (
    <CommentsEnabledProvider documentId="" documentType="">
      <Box paddingX={4}>
        {formState === null ? (
          <div>Loading...</div>
        ) : (
          <FormBuilder
            id="root"
            onChange={handleChange}
            __internal_patchChannel={patchChannel}
            onPathFocus={handleFocus}
            onPathBlur={handleBlur}
            onFieldGroupSelect={() => null}
            onPathOpen={setOpenPath}
            onSetFieldSetCollapsed={() => null}
            onSetPathCollapsed={() => null}
            collapsedPaths={undefined}
            collapsedFieldSets={undefined}
            __internal_fieldActions={undefined}
            focusPath={formState.focusPath}
            changed={formState.changed}
            focused={formState.focused}
            groups={formState.groups}
            validation={[]}
            members={formState.members}
            presence={formState?.presence ?? []}
            schemaType={tasksSchemaType!}
            value={
              // note: the form state doesn't have a typed concept of a "document" value
              // but these should be compatible
              formState.value as FormDocumentValue
            }
          />
        )}
      </Box>
    </CommentsEnabledProvider>
  )
}
const AddonWorkspaceSelector = () => {
  const workspaces = useWorkspaces()
  const addonWorkspace = useWorkspaceLoader(workspaces[0])
  if (!addonWorkspace) return null
  return (
    <WorkspaceProvider workspace={addonWorkspace}>
      <SourceProvider source={addonWorkspace.unstable_sources[0]}>
        <ResourceCacheProvider>
          <TasksCreateFormInner />
        </ResourceCacheProvider>
      </SourceProvider>
    </WorkspaceProvider>
  )
}

export function TasksCreateForm() {
  // Parent workspace source, we want to use the same project id
  const source = useSource()
  const baseConfig = useMemo(
    () => ({
      basePath: '',
      dataset: 'playground-comments',
      name: 'comments',
      projectId: source.projectId,
      // TODO: Get this host from the studio config.
      apiHost: 'https://api.sanity.work',
      schema: {
        types: [taskSchema],
      },
    }),
    [source.projectId],
  )

  return (
    <WorkspacesProvider config={baseConfig}>
      <AddonWorkspaceSelector />
    </WorkspacesProvider>
  )
}
