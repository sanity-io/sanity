import {
  type ManifestWorkspaceInput,
  type StudioManifest,
  type StudioWorkspaceManifest,
} from './types'

/**
 * Options for generating a studio manifest.
 * @internal
 */
export interface GenerateStudioManifestOptions<W extends ManifestWorkspaceInput> {
  /** The workspaces to include in the manifest */
  workspaces: W[]
  /**
   * Function to resolve the schema descriptor ID for a workspace.
   * Return undefined to skip the workspace in the manifest.
   */
  resolveSchemaDescriptorId: (workspace: W) => string | undefined | Promise<string | undefined>
  /**
   * Function to resolve the icon HTML string for a workspace.
   * Return undefined if the icon cannot be resolved.
   */
  resolveIcon: (workspace: W) => string | undefined
  /** The Sanity version string */
  bundleVersion: string
  /** Optional build ID */
  buildId?: string
}

/**
 * Generates a workspace manifest entry from a workspace and its schema descriptor ID.
 */
function generateWorkspaceManifest<W extends ManifestWorkspaceInput>(
  workspace: W,
  schemaDescriptorId: string,
  resolveIcon: (workspace: W) => string | undefined,
): StudioWorkspaceManifest {
  return {
    name: workspace.name,
    projectId: workspace.projectId,
    dataset: workspace.dataset,
    schemaDescriptorId,
    basePath: workspace.basePath || undefined,
    title: workspace.title || undefined,
    subtitle: workspace.subtitle || undefined,
    icon: resolveIcon(workspace),
    mediaLibraryId: workspace.mediaLibrary?.enabled ? workspace.mediaLibrary.libraryId : undefined,
  }
}

/**
 * Generates a StudioManifest from workspaces.
 * This is a shared utility used by both CLI deployment and live manifest registration.
 * @internal
 */
export async function generateStudioManifest<W extends ManifestWorkspaceInput>(
  options: GenerateStudioManifestOptions<W>,
): Promise<StudioManifest> {
  const {workspaces, resolveSchemaDescriptorId, resolveIcon, bundleVersion, buildId} = options

  const workspaceManifests = await Promise.all(
    workspaces.map(async (workspace) => {
      const schemaDescriptorId = await resolveSchemaDescriptorId(workspace)

      // Skip workspaces without schema descriptors
      if (!schemaDescriptorId) {
        return null
      }

      return generateWorkspaceManifest(workspace, schemaDescriptorId, resolveIcon)
    }),
  )

  return {
    buildId,
    bundleVersion,
    workspaces: workspaceManifests.filter(
      (manifest): manifest is StudioWorkspaceManifest => manifest !== null,
    ),
  }
}
