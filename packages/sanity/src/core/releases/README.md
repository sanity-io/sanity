# Releases

The release management system for Sanity Studio. This module provides functionality for creating, managing, and publishing content releases (bundles of document versions that can be published together).

## Key Exports

### Store & Hooks

- `useReleasesStore` - Access the releases store
- `useAllReleases` - Get all releases in the project
- `useActiveReleases` - Get active (non-archived) releases
- `useArchivedReleases` - Get archived releases
- `useReleaseOperations` - Perform release operations (create, archive, publish, etc.)
- `useReleasePermissions` - Check user permissions for release actions
- `useReleaseLimits` - Get release limits for the current plan
- `useDocumentVersionInfo` - Get version info for a document across releases
- `useReleasesMetadata` - Get metadata aggregated across releases

### Components

- Release UI components for the studio interface

### Hooks (from `hooks/`)

- `useCopyToDrafts` - Copy release version back to drafts
- `useCreateReleaseMetadata` - Create metadata for new releases
- `useCustomReleaseActions` - Access custom release actions
- `useDocumentVersionTypeSortedList` - Get sorted document versions
- `useIsReleaseActive` - Check if a release is active
- `useReleaseTime` - Get formatted release time

### Utilities

- `createReleaseId` - Generate unique release IDs
- `getReleaseIdFromReleaseDocumentId` - Extract release ID from document ID
- `getReleaseTone` - Get UI tone/color for release state
- `isGoingToUnpublish` - Check if publishing will unpublish documents
- `isReleasePerspective` - Check if a perspective is a release
- `RELEASES_STUDIO_CLIENT_OPTIONS` - Client options for release operations
- `RELEASE_DOCUMENT_TYPE` - The document type for release metadata

### Telemetry

- Release-related telemetry events for analytics

## Usage

### Listing Releases

```ts
import {useActiveReleases} from 'sanity'

function ReleasesList() {
  const {data: releases, loading} = useActiveReleases()
  
  if (loading) return <Spinner />
  
  return (
    <ul>
      {releases.map(release => (
        <li key={release._id}>{release.metadata.title}</li>
      ))}
    </ul>
  )
}
```

### Creating a Release

```ts
import {useReleaseOperations} from 'sanity'

function CreateReleaseButton() {
  const {createRelease} = useReleaseOperations()
  
  const handleCreate = async () => {
    await createRelease({
      metadata: {
        title: 'My New Release',
        description: 'Content updates for Q1',
      },
    })
  }
  
  return <button onClick={handleCreate}>Create Release</button>
}
```

### Checking Document Versions

```ts
import {useDocumentVersionInfo} from 'sanity'

function VersionIndicator({documentId}) {
  const versionInfo = useDocumentVersionInfo(documentId)
  
  return (
    <div>
      <span>Draft: {versionInfo.draft ? 'Yes' : 'No'}</span>
      <span>Published: {versionInfo.published ? 'Yes' : 'No'}</span>
      <span>In releases: {versionInfo.releases.length}</span>
    </div>
  )
}
```

### Publishing a Release

```ts
import {useReleaseOperations} from 'sanity'

function PublishReleaseButton({releaseId}) {
  const {publishRelease} = useReleaseOperations()
  
  return (
    <button onClick={() => publishRelease(releaseId)}>
      Publish Release
    </button>
  )
}
```

## Internal Dependencies

- `../store` - Core data stores
- `../hooks` - React hooks
- `../perspective` - Perspective system integration
- `../config` - Configuration for release actions
- `../i18n` - Internationalization resources

## Architecture

### Subdirectories

- `components/` - UI components for release management
- `hooks/` - Release-specific React hooks
- `store/` - Release store and state management
- `plugin/` - Release plugin configuration
- `util/` - Utility functions for release operations
- `i18n/` - Internationalization resources
- `types/` - TypeScript type definitions
- `__telemetry__/` - Telemetry event definitions
- `__fixtures__/` - Test fixtures

### Release Lifecycle

1. **Create** - New release is created with metadata
2. **Add Documents** - Documents are added as versions to the release
3. **Review** - Content is reviewed and validated
4. **Schedule** (optional) - Release can be scheduled for future publish
5. **Publish** - All documents in release are published atomically
6. **Archive** - Release is archived for historical reference

### Key Concepts

- **Release** - A bundle of document versions to be published together
- **Version** - A document snapshot within a release
- **Perspective** - View of content from a release's point of view
- **Release ID** - Unique identifier in format `r<id>`
