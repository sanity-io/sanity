# Preview

The document preview system for Sanity Studio. This module provides functionality for observing and rendering document previews with real-time updates, supporting both simple previews and complex nested content structures.

## Key Exports

### Components

- `Preview` - Main preview component for rendering document previews
- `PreviewLoader` - Loading state wrapper for previews
- `SanityDefaultPreview` - Default preview implementation

### Store & Observers

- `DocumentPreviewStore` - Store for subscribing to document previews with real-time sync
- `createDocumentPreviewStore` - Factory to create a preview store instance

### Hooks

- `useValuePreview` - Hook to get preview value for a document
- `useObserveDocument` / `unstable_useObserveDocument` - Observe a document by ID
- `useLiveDocumentIdSet` - Observe a set of document IDs matching a filter
- `useLiveDocumentSet` - Observe documents matching a filter

### Utilities

- `getPreviewPaths` - Get paths needed for preview from schema
- `getPreviewStateObservable` - Create observable for preview state
- `getPreviewValueWithFallback` - Get preview value with fallback handling
- `prepareForPreview` - Transform document data for preview rendering

### Types

- `PreparedSnapshot` - Prepared preview data snapshot
- `Previewable` - Value that can be previewed
- `PreviewableType` - Schema type that supports preview
- `PreviewPath` - Path specification for preview fields
- `DraftsModelDocument` - Document with draft/published states
- `DraftsModelDocumentAvailability` - Availability status for draft/published

## Usage

### Rendering a Preview

```tsx
import {Preview} from 'sanity'

function DocumentCard({document, schemaType}) {
  return (
    <Preview
      value={document}
      schemaType={schemaType}
      layout="default"
    />
  )
}
```

### Using the Preview Hook

```ts
import {useValuePreview} from 'sanity'

function DocumentPreview({value, schemaType}) {
  const preview = useValuePreview({
    value,
    schemaType,
  })
  
  if (preview.isLoading) return <Spinner />
  if (preview.error) return <Error message={preview.error.message} />
  
  return (
    <div>
      <h3>{preview.value?.title}</h3>
      <p>{preview.value?.subtitle}</p>
    </div>
  )
}
```

### Observing a Document

```ts
import {useObserveDocument} from 'sanity'

function LiveDocument({documentId}) {
  const {document, loading} = useObserveDocument(documentId)
  
  if (loading) return <Spinner />
  
  return <div>{document?.title}</div>
}
```

### Observing Document Sets

```ts
import {useLiveDocumentSet} from 'sanity'

function LiveDocumentList({filter, params}) {
  const {documents, loading} = useLiveDocumentSet(filter, params)
  
  return (
    <ul>
      {documents.map(doc => (
        <li key={doc._id}>{doc.title}</li>
      ))}
    </ul>
  )
}
```

### Creating a Preview Store

```ts
import {createDocumentPreviewStore} from 'sanity'

const previewStore = createDocumentPreviewStore({
  client,
  documentStore,
})

// Subscribe to preview updates
previewStore.observeForPreview(value, schemaType).subscribe(snapshot => {
  console.log('Preview updated:', snapshot)
})
```

## Internal Dependencies

- `../store` - Document store for data access
- `../util` - Utility functions
- `@sanity/client` - Sanity client for API calls

## Architecture

### Preview Resolution

1. Schema defines preview configuration (`preview.select`, `preview.prepare`)
2. `getPreviewPaths` extracts the fields needed for preview
3. `observeForPreview` subscribes to those specific fields
4. `prepareForPreview` transforms the data using the schema's `prepare` function
5. Components render the prepared preview data

### Real-time Updates

The preview system uses Mendoza patches for efficient real-time updates:

- Global listener receives mutation events
- Patches are applied incrementally to cached data
- Subscribers receive updated snapshots

### Subdirectories

- `components/` - Preview UI components
- `streams/` - Observable streams for events (scroll, resize, visibility)
- `utils/` - Helper functions for preview preparation
- `__test__/` - Test files
- `__workshop__/` - Workshop stories for development

### Key Concepts

- **Snapshot** - A prepared preview value at a point in time
- **Availability** - Whether draft/published versions exist
- **Previewable** - Any value that can generate a preview (document, reference, etc.)
- **Preview Layout** - Display mode (default, media, detail, inline, block)

## Performance Considerations

- Previews only observe the fields specified in `preview.select`
- Batched queries reduce API calls for multiple previews
- Debounced updates prevent excessive re-renders
- Intersection observer delays loading off-screen previews
