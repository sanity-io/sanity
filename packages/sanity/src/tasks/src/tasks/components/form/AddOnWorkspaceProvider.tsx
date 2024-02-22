import {useMemo} from 'react'
import {
  prepareConfig,
  ResourceCacheProvider,
  SourceProvider,
  useSource,
  useWorkspaceLoader,
  WorkspaceProvider,
} from 'sanity'

import {taskSchema} from './taskSchema'

export function AddOnWorkspaceProvider({children}: {children: React.ReactNode}) {
  // Parent workspace source, we want to use the same project id
  const source = useSource()
  const basePath = undefined // TODO: Is basePath necessary here?
  const addonDatasetConfig = useMemo(
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

  const {workspaces} = useMemo(
    () => prepareConfig(addonDatasetConfig, {basePath}),
    [addonDatasetConfig, basePath],
  )
  const addonWorkspace = useWorkspaceLoader(workspaces[0])
  if (!addonWorkspace) return null
  return (
    <WorkspaceProvider workspace={addonWorkspace}>
      <SourceProvider source={addonWorkspace.unstable_sources[0]}>
        <ResourceCacheProvider>{children}</ResourceCacheProvider>
      </SourceProvider>
    </WorkspaceProvider>
  )
}
