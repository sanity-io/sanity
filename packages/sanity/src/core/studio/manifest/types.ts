import {type Workspace} from '../../config/types'

/**
 * Minimal workspace properties needed for studio manifest generation.
 * Both Workspace and WorkspaceSummary satisfy this type.
 * @internal
 */
export type ManifestWorkspaceInput = Pick<
  Workspace,
  'name' | 'projectId' | 'dataset' | 'basePath' | 'title' | 'subtitle' | 'icon' | 'mediaLibrary'
>

/**
 * Workspace configuration for the Studio manifest.
 * Used when registering a Studio with the Content Operating System.
 * @internal
 */
export interface StudioWorkspaceManifest {
  name: string
  projectId: string
  dataset: string
  schemaDescriptorId: string
  basePath?: string
  title?: string
  subtitle?: string
  icon?: string
  mediaLibraryId?: string
  apiHost?: string
}

/**
 * Studio configuration manifest that gets registered with the Content Operating System.
 * @internal
 */
export interface StudioManifest {
  version?: string
  buildId?: string
  bundleVersion?: string
  workspaces: StudioWorkspaceManifest[]
}
