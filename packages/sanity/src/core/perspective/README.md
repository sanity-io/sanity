# Perspective

The perspective system for Sanity Studio. This module manages the current viewing perspective (drafts, published, or a specific release), enabling users to preview content as it would appear at different points in time or after specific releases are published.

## Key Exports

### Hooks

- `usePerspective` - Get the current perspective context (selected perspective, perspective stack, excluded perspectives)
- `useGetDefaultPerspective` - Get the default perspective for the workspace

### Utilities

- `getSelectedPerspective` - Extract perspective from URL/state
- `isPerspectiveWriteable` - Check if a perspective allows editing

### Types

- `PerspectiveContextValue` - Context value shape for perspective state
- `TargetPerspective` - Union type for perspective values (release document, system bundle, or string)
- `SelectedPerspective` - Alias for TargetPerspective (deprecated)
- `PerspectiveStack` - Array of perspective IDs for stacked viewing
- `ReleaseId` - Type alias for release identifier strings

## Usage

### Reading the Current Perspective

```ts
import {usePerspective} from 'sanity'

function MyComponent() {
  const {
    selectedPerspectiveName,  // 'published' | 'drafts' | releaseId
    selectedReleaseId,        // Release ID if viewing a release
    selectedPerspective,      // Full perspective data
    perspectiveStack,         // Stacked perspectives for querying
    excludedPerspectives,     // Perspectives to exclude
  } = usePerspective()
  
  return (
    <div>
      Currently viewing: {selectedPerspectiveName}
    </div>
  )
}
```

### Using Perspective Stack with Client

```ts
import {usePerspective, useClient} from 'sanity'

function PreviewComponent() {
  const {perspectiveStack} = usePerspective()
  const client = useClient({apiVersion: '2024-01-01'})
  
  // Use perspective stack to fetch content as it would appear
  const data = await client.fetch(
    '*[_type == "post"]',
    {},
    {perspective: perspectiveStack}
  )
  
  return <Preview data={data} />
}
```

### Checking if Perspective is Writeable

```ts
import {isPerspectiveWriteable} from 'sanity'

function EditButton({perspective}) {
  const canEdit = isPerspectiveWriteable(perspective)
  
  return (
    <button disabled={!canEdit}>
      {canEdit ? 'Edit' : 'View Only'}
    </button>
  )
}
```

## Internal Dependencies

- `../util/draftUtils` - System bundle definitions (drafts, published)
- `../releases` - Release document types
- `sanity/_singletons` - PerspectiveContext singleton

## Architecture

### Perspective Types

1. **Published** - View only published content
2. **Drafts** - View draft content (default for editing)
3. **Release** - View content as it would appear after a release is published

### Perspective Stack

The perspective stack is an array of perspective identifiers that determines how content is resolved:

- `["published"]` - Only published content
- `["drafts"]` - Draft content, falling back to published
- `["releaseId2", "releaseId1", "drafts"]` - Content from releases, stacked chronologically

This stack is passed to the Sanity client's `perspective` option to fetch content as it would appear at a specific point in time.

### Context Providers

- **PerspectiveContext** - Global perspective context
- **DocumentPerspectiveProvider** - Document-level perspective override

### Subdirectories

- `navbar/` - Perspective selector UI components
- `__mocks__/` - Test mocks for perspective hooks

## Key Concepts

- **Perspective** - A view of content at a specific state (drafts, published, or release)
- **Perspective Stack** - Ordered list of perspectives for layered content resolution
- **System Bundle** - Built-in perspectives (drafts, published)
- **Release Perspective** - Custom perspective tied to a release bundle
