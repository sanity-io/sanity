import {type RootTheme} from '@sanity/ui/theme'
import {firstValueFrom} from 'rxjs'

import {type Source, type WorkspaceSummary} from '../../config/types'
import {type UserApplication} from '../../store/userApplications'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {SANITY_VERSION} from '../../version'
import {generateStudioManifest} from './generateStudioManifest'
import {resolveIcon} from './icon'

const buildId: string | undefined =
  // @ts-expect-error: __SANITY_BUILD_TIMESTAMP__ is a global env variable set by the vite config
  typeof __SANITY_BUILD_TIMESTAMP__ === 'undefined' ? undefined : `${__SANITY_BUILD_TIMESTAMP__}`

/**
 * Resolves the Source from a WorkspaceSummary by subscribing to the source observable.
 */
async function resolveSource(workspace: WorkspaceSummary): Promise<Source | undefined> {
  // At risk of being fired, we need the schema descriptor id for the workspace.
  const sourceEntry = workspace.__internal.sources[0]
  if (!sourceEntry) {
    return undefined
  }
  return firstValueFrom(sourceEntry.source)
}

/**
 * Resolves the schemaDescriptorId for a workspace.
 * Returns undefined if the schema hasn't been uploaded or is unavailable.
 */
async function resolveSchemaDescriptorId(workspace: WorkspaceSummary): Promise<string | undefined> {
  const source = await resolveSource(workspace)
  return await source?.__internal?.schemaDescriptorId
}

/**
 * Uploads the studio manifest containing all workspace information to the backend.
 * Each workspace manifest includes its associated schemaDescriptorId.
 *
 * @param userApplication - The user application
 * @param workspaces - Array of all workspaces in the Studio
 * @param theme - The Studio theme to use for rendering icons
 * @returns Promise that resolves when upload is complete
 * @internal
 */
export async function registerStudioManifest(
  userApplication: UserApplication,
  workspaces: WorkspaceSummary[],
  theme: RootTheme,
): Promise<void> {
  const {id, projectId} = userApplication

  const workspace = workspaces.find((ws) => ws.projectId === projectId)
  if (!workspace) {
    // Skip registering if the user application doesn't correspond to a workspace
    return
  }

  const liveManifest = await generateStudioManifest({
    workspaces,
    resolveSchemaDescriptorId,
    resolveIcon: (ws) =>
      resolveIcon({
        icon: ws.icon,
        title: ws.title || ws.name,
        subtitle: ws.subtitle,
        theme,
      }),
    bundleVersion: SANITY_VERSION,
    buildId,
  })

  // Skip registering if the manifest does not have any valid workspaces
  if (liveManifest.workspaces.length === 0) {
    return
  }

  const {client, authenticated} = await firstValueFrom(workspace.auth.state)

  if (!authenticated) {
    return // if the user isn't authenticated, nothing to do
  }

  // Post the live manifest via the global api
  await client.withConfig(DEFAULT_STUDIO_CLIENT_OPTIONS).request({
    method: 'POST',
    uri: `/projects/${projectId}/user-applications/${id}/config/live-manifest`,
    body: {
      value: liveManifest,
    },
    tag: 'live-manifest-register',
  })
}
