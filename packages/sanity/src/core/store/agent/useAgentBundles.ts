import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useClient} from '../../hooks'
import {useProjectStore, useResourceCache} from '../../store'
import {useWorkspace} from '../../studio'
import {
  type AgentBundlesState,
  createAgentBundlesStore,
  INITIAL_STATE,
} from './createAgentBundlesStore'

const CLIENT_OPTIONS = {apiVersion: 'v2025-02-19'} as const

/**
 * Returns the current user's active agent bundles, streamed in real time from
 * the agent's SSE endpoint.
 *
 * The underlying SSE connection is shared across all callers within the same
 * workspace (via `useResourceCache`), so mounting this hook in multiple
 * components does not open multiple connections.
 *
 * @internal
 */
export function useAgentBundles(): AgentBundlesState {
  const resourceCache = useResourceCache()
  const workspace = useWorkspace()
  const client = useClient(CLIENT_OPTIONS)
  const projectStore = useProjectStore()

  const store = useMemo(() => {
    const agentBundlesStore =
      resourceCache.get<ReturnType<typeof createAgentBundlesStore>>({
        namespace: 'AgentBundlesStore',
        dependencies: [workspace],
      }) ||
      createAgentBundlesStore({
        organizationId$: projectStore.getOrganizationId(),
        client,
      })

    resourceCache.set({
      namespace: 'AgentBundlesStore',
      dependencies: [workspace],
      value: agentBundlesStore,
    })

    return agentBundlesStore
  }, [resourceCache, workspace, client, projectStore])

  return useObservable(store.state$, INITIAL_STATE)
}
