// Fires once per active workspace, re-emitting on workspace switch. Group by
// envelope `activeWorkspace` and `activeProjectId` for per-workspace adoption;
// raw counts skew to heavy users.
import {defineEvent} from '@sanity/telemetry'
import {type SearchStrategy} from '@sanity/types'

import {type Workspace, type WorkspaceOptions} from '../../config/types'
import {
  createEmptyDeprecatedConfigFlags,
  type DeprecatedConfigFlags,
  detectDeprecatedLegacyThemeOptions,
  detectDeprecatedPresentationOptions,
  detectDeprecatedRawConfigOptions,
  detectDeprecatedSchemaOptions,
  detectDeprecatedThemeOptions,
} from './deprecatedConfigDetection'

interface WorkspaceFeaturesObservedInfo {
  advancedVersionControlEnabled: boolean
  releasesEnabled: boolean | undefined
  releasesLimit: number | undefined
  tasksEnabled: boolean | undefined
  scheduledDraftsEnabled: boolean | undefined
  scheduledPublishingEnabled: boolean
  scheduledPublishingExplicitlyEnabled: boolean | undefined
  mediaLibraryEnabled: boolean | undefined
  canvasEnabled: boolean | undefined
  variantsEnabled: boolean | undefined
  documentGroupInventoryEnabled: boolean | undefined
  eventsApiDocumentsEnabled: boolean | undefined
  eventsApiReleasesEnabled: boolean | undefined
  announcementsEnabled: boolean | undefined
  draftsEnabled: boolean
  partialIndexingEnabled: boolean | undefined
  fileDirectUploadsEnabled: boolean
  imageDirectUploadsEnabled: boolean
  searchStrategy: SearchStrategy | undefined
}

export const WorkspaceFeaturesObserved = defineEvent<WorkspaceFeaturesObservedInfo>({
  name: 'Workspace Features Observed',
  version: 1,
  description: 'Feature flags enabled for the current workspace',
})

export const DeprecatedConfigUsageObserved = defineEvent<DeprecatedConfigFlags>({
  name: 'Deprecated Config Usage Observed',
  version: 1,
  description: 'Tracks usage of deprecated config options before v7 removal',
})

/**
 * Projects the resolved workspace into the flat, low-cardinality feature
 * snapshot emitted by {@link WorkspaceFeaturesObserved}. Values are read
 * straight off the resolved workspace, where the config resolver has already
 * applied every default and merged plugin contributions, so this never restates
 * a default itself: changing a default upstream flows through with no change
 * here. The `| undefined` unions track the input `Workspace` type rather than
 * runtime behaviour: the resolver writes concrete defaults for almost all of
 * these, so `releasesLimit` (unset when no release limit is configured) is the
 * only field that is genuinely `undefined` at runtime.
 *
 * Every entry must stay a boolean, small enum, or short number; never free
 * text, identifiers, or customer values, which keeps the payload safe to send
 * and cheap to aggregate.
 */
export function collectWorkspaceFeatures(workspace: Workspace): WorkspaceFeaturesObservedInfo {
  return {
    advancedVersionControlEnabled: workspace.advancedVersionControl.enabled,
    releasesEnabled: workspace.releases?.enabled,
    releasesLimit: workspace.releases?.limit,
    tasksEnabled: workspace.tasks?.enabled,
    scheduledDraftsEnabled: workspace.scheduledDrafts?.enabled,
    // `enabled` is on-by-default and only flips false on explicit opt-out, so it
    // reads as a near-constant; the explicit opt-in is the real adoption signal.
    // See SchedulePublishingStudioProvider: `enabled` is what it publishes as
    // ScheduledPublishingEnabledContext, while the explicit opt-in only settles its
    // usage probe as used without probing.
    scheduledPublishingEnabled: workspace.scheduledPublishing.enabled,
    scheduledPublishingExplicitlyEnabled:
      workspace.scheduledPublishing.__internal__workspaceEnabled,
    mediaLibraryEnabled: workspace.mediaLibrary?.enabled,
    canvasEnabled: workspace.apps?.canvas?.enabled,
    variantsEnabled: workspace.beta?.variants?.enabled,
    documentGroupInventoryEnabled: workspace.beta?.documentGroupInventory?.enabled,
    // oxlint-disable-next-line no-deprecated -- keep reporting the deprecated opt-out until it is removed
    eventsApiDocumentsEnabled: workspace.beta?.eventsAPI?.documents,
    eventsApiReleasesEnabled: workspace.beta?.eventsAPI?.releases,
    announcementsEnabled: workspace.announcements?.enabled,
    draftsEnabled: workspace.document.drafts.enabled,
    partialIndexingEnabled: workspace.search.unstable_partialIndexing?.enabled,
    fileDirectUploadsEnabled: workspace.form.file.directUploads,
    imageDirectUploadsEnabled: workspace.form.image.directUploads,
    searchStrategy: workspace.search.strategy,
  }
}

/**
 * Collects all deprecated config flags from the workspace.
 * Used by {@link DeprecatedConfigUsageObserved} to track usage of deprecated
 * config options before their removal in v7.
 * @internal
 */
export function collectDeprecatedConfigFlags(workspace: Workspace): DeprecatedConfigFlags {
  const flags = createEmptyDeprecatedConfigFlags()

  // The raw config is available at workspace.__internal.options
  // At runtime this includes workspace-level fields even though typed as SourceOptions
  const rawConfig = workspace.__internal.options as WorkspaceOptions

  // Detect deprecated raw config options (logo, beta.create, beta.form.enhancedObjectDialog, etc.)
  Object.assign(flags, detectDeprecatedRawConfigOptions(rawConfig))

  // Detect deprecated theme options (avatar, button, container, etc.)
  // The theme is available on the workspace but comes from raw config
  const theme = (workspace as unknown as {theme?: unknown}).theme
  if (theme && typeof theme === 'object') {
    Object.assign(flags, detectDeprecatedThemeOptions(theme))
    // Detect deprecated buildLegacyTheme options (--screen-*-break keys)
    // These are stored on the theme object by buildLegacyTheme
    Object.assign(flags, detectDeprecatedLegacyThemeOptions(theme))
  }

  // Detect deprecated presentation tool options (check, disable, unstable_showUnsafeShareUrl)
  Object.assign(flags, detectDeprecatedPresentationOptions(workspace.tools))

  // Detect deprecated schema options (array direction/treeEditing, cross-dataset __experimental_search)
  Object.assign(flags, detectDeprecatedSchemaOptions(workspace.schema))

  return flags
}
