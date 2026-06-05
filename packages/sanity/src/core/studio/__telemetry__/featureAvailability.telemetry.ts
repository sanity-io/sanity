// Fires once per workspace mount. Group by envelope `activeWorkspace` and
// `activeProjectId` for per-workspace adoption; raw counts skew to heavy users.
import {defineEvent} from '@sanity/telemetry'
import {type SearchStrategy} from '@sanity/types'

import {type Workspace} from '../../config'

interface WorkspaceFeaturesObservedInfo {
  advancedVersionControlEnabled: boolean
  releasesEnabled: boolean
  releasesLimit: number | undefined
  tasksEnabled: boolean
  scheduledDraftsEnabled: boolean
  scheduledPublishingEnabled: boolean
  scheduledPublishingExplicitlyEnabled: boolean
  mediaLibraryEnabled: boolean
  canvasEnabled: boolean
  variantsEnabled: boolean
  eventsApiDocumentsEnabled: boolean
  eventsApiReleasesEnabled: boolean
  announcementsEnabled: boolean
  draftsEnabled: boolean
  partialIndexingEnabled: boolean
  fileDirectUploadsEnabled: boolean
  imageDirectUploadsEnabled: boolean
  searchStrategy: SearchStrategy
}

export const WorkspaceFeaturesObserved = defineEvent<WorkspaceFeaturesObservedInfo>({
  name: 'Workspace Features Observed',
  version: 1,
  description: 'Feature flags enabled for the current workspace',
})

/**
 * Reads the resolved workspace into the flat, low-cardinality feature snapshot
 * emitted by {@link WorkspaceFeaturesObserved}. Every entry must be a boolean,
 * small enum, or short number; never free text, identifiers, or customer values,
 * which keeps the payload safe to send and cheap to aggregate. Defaults mirror
 * the config reducers so an omitted option reports its effective value, not
 * `undefined`.
 */
// eslint-disable-next-line complexity -- flat field-by-field mapping, not branching logic
export function collectWorkspaceFeatures(workspace: Workspace): WorkspaceFeaturesObservedInfo {
  return {
    advancedVersionControlEnabled: workspace.advancedVersionControl?.enabled ?? false,
    releasesEnabled: workspace.releases?.enabled ?? true,
    releasesLimit: workspace.releases?.limit,
    tasksEnabled: workspace.tasks?.enabled ?? true,
    scheduledDraftsEnabled: workspace.scheduledDrafts?.enabled ?? true,
    // `enabled` is on-by-default and only flips false on explicit opt-out, so it
    // reads as a near-constant; the explicit opt-in is the real adoption signal.
    // See ScheduledPublishingEnabledProvider, which gates on both.
    scheduledPublishingEnabled: workspace.scheduledPublishing?.enabled ?? true,
    scheduledPublishingExplicitlyEnabled:
      workspace.scheduledPublishing?.__internal__workspaceEnabled ?? false,
    mediaLibraryEnabled: workspace.mediaLibrary?.enabled ?? false,
    canvasEnabled: workspace.apps?.canvas?.enabled ?? true,
    variantsEnabled: workspace.beta?.variants?.enabled ?? false,
    eventsApiDocumentsEnabled: workspace.beta?.eventsAPI?.documents ?? true,
    eventsApiReleasesEnabled: workspace.beta?.eventsAPI?.releases ?? false,
    announcementsEnabled: workspace.announcements?.enabled ?? true,
    draftsEnabled: workspace.document?.drafts?.enabled ?? true,
    partialIndexingEnabled: workspace.search?.unstable_partialIndexing?.enabled ?? false,
    fileDirectUploadsEnabled: workspace.form?.file?.directUploads ?? true,
    imageDirectUploadsEnabled: workspace.form?.image?.directUploads ?? true,
    searchStrategy: workspace.search?.strategy ?? 'groqLegacy',
  }
}
