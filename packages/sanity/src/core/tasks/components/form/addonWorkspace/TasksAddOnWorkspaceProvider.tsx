import {useEffect, useMemo} from 'react'

import {LoadingBlock} from '../../../../components'
import {type Config, prepareConfig} from '../../../../config'
import {useClient} from '../../../../hooks'
import {ResourceCacheProvider} from '../../../../store'
import {
  SourceProvider,
  useAddonDataset,
  useSource,
  useWorkspaceLoader,
  WorkspaceProvider,
} from '../../../../studio'
import {API_VERSION} from '../../../constants'
import {type FormMode} from '../../../types'
import {taskSchema} from './taskSchema'

function TasksAddonWorkspaceProviderInner({
  children,
  mode,
  addonDataset,
}: {
  addonDataset: string
  children: React.ReactNode
  mode: FormMode
}) {
  const client = useClient({apiVersion: API_VERSION})
  const apiHost = client.config().apiHost
  // TODO: Is basePath necessary here?
  const basePath = ''

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

/**
 * Provides a workspace for the addon dataset, with the correct schema for tasks.
 * It also, creates the addon dataset if it doesn't exist.
 */
export function TasksAddonWorkspaceProvider(props: {children: React.ReactNode; mode: FormMode}) {
  const {client: addonDatasetClient, ready, createAddonDataset} = useAddonDataset()
  const addonDataset = addonDatasetClient?.config().dataset

  useEffect(() => {
    if (!addonDataset && ready) {
      // The user is trying to use the addon dataset form, but it hasn't been created yet.
      // We should create it.
      createAddonDataset()
    }
  }, [addonDataset, ready, createAddonDataset])

  if (!addonDataset) {
    return <LoadingBlock />
  }

  return <TasksAddonWorkspaceProviderInner {...props} addonDataset={addonDataset} />
}
