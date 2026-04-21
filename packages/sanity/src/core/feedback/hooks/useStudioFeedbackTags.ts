import {uuid} from '@sanity/uuid'
import {useCallback, useMemo, version as reactVersion} from 'react'
import {useRouterState} from 'sanity/router'

import {useClient} from '../../hooks'
import {useProjectSubscriptions} from '../../hooks/useProjectSubscriptions'
import {useProject} from '../../store/_legacy/project/useProject'
import {useProjectOrganizationData} from '../../store/_legacy/project/useProjectOrganizationData'
import {useProjectOrganizationId} from '../../store/_legacy/project/useProjectOrganizationId'
import {useCurrentUser} from '../../store/user/hooks'
import {useWorkspace} from '../../studio/workspace'
import {SANITY_VERSION} from '../../version'
import {type BaseFeedbackTags, type DynamicFeedbackTags} from '../types'

const sessionId = uuid()

interface PluginEntry {
  name: string
  plugins?: PluginEntry[]
}

function collectLeafPluginNames(plugins: PluginEntry[]): string[] {
  const names: string[] = []
  for (const plugin of plugins) {
    if (plugin.plugins && plugin.plugins.length > 0) {
      names.push(...collectLeafPluginNames(plugin.plugins))
    } else {
      names.push(plugin.name)
    }
  }
  return names
}

function resolvePluginNames(workspace: object): string[] {
  const w = workspace as {__internal?: {options?: {plugins?: PluginEntry[]}}}
  const plugins = w.__internal?.options?.plugins ?? []
  return collectLeafPluginNames(plugins).filter(Boolean)
}

/**
 * Gathers the base (static) and dynamic (navigation-dependent) tags for feedback.
 *
 * @internal
 */
export function useStudioFeedbackTags(): {
  baseTags: BaseFeedbackTags
  dynamicTags: DynamicFeedbackTags
  allTags: BaseFeedbackTags & DynamicFeedbackTags
  userName: string | undefined
  userEmail: string | undefined
  userId: string
} {
  const workspace = useWorkspace()
  const currentUser = useCurrentUser()
  const client = useClient({apiVersion: '2023-12-18'})
  const projectId = client.config().projectId ?? ''

  const {value: orgId} = useProjectOrganizationId()
  const {value: orgData} = useProjectOrganizationData()
  const orgName = orgData?.name ?? ''
  const {value: projectData} = useProject()
  const {projectSubscriptions} = useProjectSubscriptions()

  const activeTool = useRouterState(
    useCallback(
      (routerState) => (typeof routerState.tool === 'string' ? routerState.tool : ''),
      [],
    ),
  )

  const pluginNames = useMemo(() => resolvePluginNames(workspace), [workspace])
  const userId = currentUser?.id ?? 'unknown'

  const baseTags = useMemo<BaseFeedbackTags>(
    () => ({
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      screenDensity: typeof window !== 'undefined' ? String(window.devicePixelRatio) : '',
      screenHeight: typeof screen !== 'undefined' ? String(screen.height) : '',
      screenWidth: typeof screen !== 'undefined' ? String(screen.width) : '',
      innerHeight: typeof window !== 'undefined' ? String(window.innerHeight) : '',
      innerWidth: typeof window !== 'undefined' ? String(window.innerWidth) : '',
      studioVersion: SANITY_VERSION,
      reactVersion: reactVersion ?? '',
      environment:
        typeof location !== 'undefined' && location.hostname === 'localhost'
          ? 'development'
          : 'production',
      projectId,
      projectName: projectData?.displayName ?? '',
      orgId: orgId ?? '',
      orgName,
      planTier: projectSubscriptions?.plan?.name ?? '',
      sessionId,
      userId,
      plugins: pluginNames.join(','),
      pluginsCount: pluginNames.length,
    }),
    [
      projectId,
      projectData?.displayName,
      orgId,
      orgName,
      projectSubscriptions?.plan?.name,
      userId,
      pluginNames,
    ],
  )

  const dynamicTags = useMemo<DynamicFeedbackTags>(
    () => ({
      activeTool,
      activeWorkspace: workspace.name,
      activeProjectId: workspace.projectId,
      activeDataset: workspace.dataset,
      url: typeof window !== 'undefined' ? window.location.href : '',
    }),
    [activeTool, workspace.name, workspace.projectId, workspace.dataset],
  )

  const allTags = useMemo<BaseFeedbackTags & DynamicFeedbackTags>(
    () => ({...baseTags, ...dynamicTags}),
    [baseTags, dynamicTags],
  )

  return {
    baseTags,
    dynamicTags,
    allTags,
    userName: currentUser?.name ?? undefined,
    userEmail: currentUser?.email ?? undefined,
    userId,
  }
}
