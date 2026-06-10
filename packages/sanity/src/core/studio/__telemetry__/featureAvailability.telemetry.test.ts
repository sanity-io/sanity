import {describe, expect, it} from 'vitest'

import {type Workspace} from '../../config'
import {collectWorkspaceFeatures} from './featureAvailability.telemetry'

describe('collectWorkspaceFeatures', () => {
  it('applies effective defaults for a workspace with no feature config', () => {
    expect(collectWorkspaceFeatures({} as Workspace)).toEqual({
      advancedVersionControlEnabled: false,
      releasesEnabled: true,
      releasesLimit: undefined,
      tasksEnabled: true,
      scheduledDraftsEnabled: true,
      scheduledPublishingEnabled: true,
      scheduledPublishingExplicitlyEnabled: false,
      mediaLibraryEnabled: false,
      canvasEnabled: true,
      variantsEnabled: false,
      eventsApiDocumentsEnabled: true,
      eventsApiReleasesEnabled: false,
      announcementsEnabled: true,
      draftsEnabled: true,
      partialIndexingEnabled: false,
      fileDirectUploadsEnabled: true,
      imageDirectUploadsEnabled: true,
      searchStrategy: 'groqLegacy',
    })
  })

  it('reflects explicitly configured feature flags', () => {
    const workspace = {
      advancedVersionControl: {enabled: true},
      mediaLibrary: {enabled: true},
      releases: {enabled: false, limit: 5},
      search: {strategy: 'groq2024', unstable_partialIndexing: {enabled: true}},
      form: {file: {directUploads: false}, image: {directUploads: false}},
      beta: {variants: {enabled: true}, eventsAPI: {documents: false, releases: true}},
    } as Workspace

    expect(collectWorkspaceFeatures(workspace)).toMatchObject({
      advancedVersionControlEnabled: true,
      mediaLibraryEnabled: true,
      releasesEnabled: false,
      releasesLimit: 5,
      searchStrategy: 'groq2024',
      partialIndexingEnabled: true,
      fileDirectUploadsEnabled: false,
      imageDirectUploadsEnabled: false,
      variantsEnabled: true,
      eventsApiDocumentsEnabled: false,
      eventsApiReleasesEnabled: true,
    })
  })

  it('tracks scheduled publishing as both the effective flag and the explicit opt-in', () => {
    const optedIn = {
      scheduledPublishing: {enabled: true, __internal__workspaceEnabled: true},
    } as Workspace
    expect(collectWorkspaceFeatures(optedIn)).toMatchObject({
      scheduledPublishingEnabled: true,
      scheduledPublishingExplicitlyEnabled: true,
    })

    const optedOut = {scheduledPublishing: {enabled: false}} as Workspace
    expect(collectWorkspaceFeatures(optedOut)).toMatchObject({
      scheduledPublishingEnabled: false,
      scheduledPublishingExplicitlyEnabled: false,
    })
  })
})
