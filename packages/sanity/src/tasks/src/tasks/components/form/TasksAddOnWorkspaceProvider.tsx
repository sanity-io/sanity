import {useMemo} from 'react'
import {
  type Config,
  prepareConfig,
  ResourceCacheProvider,
  SourceProvider,
  useAddonDataset,
  useClient,
  useSource,
  useWorkspaceLoader,
  WorkspaceProvider,
} from 'sanity'

import {taskSchema} from './taskSchema'

export function TasksAddonWorkspaceProvider({
  children,
  mode,
}: {
  children: React.ReactNode
  mode: 'edit' | 'create'
}) {
  const client = useClient()
  const apiHost = client.config().apiHost
  // TODO: Is basePath necessary here?
  const basePath = ''

  const {client: addonDatasetClient} = useAddonDataset()
  const addonDataset = addonDatasetClient?.config().dataset
  /**
   * This check is added to prevent the component from rendering when the addon dataset is not available
   * the user should not land on the tasks form without the addon dataset, the dataset will be created if it does not exist
   * when the user clicks on the `new task` button in the tasks list
   */
  if (!addonDataset) throw new Error('Addon dataset not found')

  // Parent workspace source, we want to use the same project id
  const source = useSource()
  const addonDatasetConfig: Config = useMemo(
    () => ({
      basePath,
      dataset: addonDataset,
      name: `addon-dataset-${addonDataset}`,
      projectId: source.projectId,
      apiHost,
      schema: {
        types: [taskSchema(mode)],
      },
    }),
    [source.projectId, mode, apiHost, addonDataset, basePath],
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
