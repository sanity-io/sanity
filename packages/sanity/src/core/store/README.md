# Store

The state management layer for Sanity Studio. This module provides data stores for documents, users, presence, history, and other core studio functionality. It handles real-time synchronization, caching, and subscription management.

## Key Exports

### Legacy Data Stores

From `_legacy/`:

- `useDocumentStore` - Hook to access the document store for CRUD operations
- `useUserStore` - Hook to access user information store
- `useGrantsStore` - Hook for permission/grants management
- `useHistoryStore` - Hook for document history/revisions
- `usePresenceStore` - Hook for real-time presence tracking
- `useProjectStore` - Hook for project-level data
- `useConnectionStatusStore` - Hook for monitoring connection state
- `useDocumentPreviewStore` - Hook for document preview subscriptions
- `DocumentStore` - Core document operations store type
- `createDocumentStore` - Factory to create a document store instance

### Events Store

From `events/`:

- `useEventsStore` - Hook for document events and transaction history
- `createEventsStore` - Factory to create events store
- Event types for tracking document changes and transactions

### User Store

From `user/`:

- `useCurrentUser` - Hook to get the current authenticated user

## Usage

### Accessing Documents

```ts
import {useDocumentStore} from 'sanity'
import {useObservable} from 'react-rx'

function MyComponent({documentId}) {
  const documentStore = useDocumentStore()
  
  const document = useObservable(
    documentStore.listenQuery(
      '*[_id == $id][0]',
      {id: documentId}
    )
  )
  
  return <div>{document?.title}</div>
}
```

### Checking Connection Status

```ts
import {useConnectionStatusStore} from 'sanity'

function ConnectionIndicator() {
  const connectionStore = useConnectionStatusStore()
  const status = useObservable(connectionStore.connectionStatus$)
  
  return <span>{status}</span>
}
```

### Working with Document History

```ts
import {useHistoryStore} from 'sanity'

function HistoryPanel({documentId}) {
  const historyStore = useHistoryStore()
  
  // Access document revisions and history timeline
}
```

### Tracking User Presence

```ts
import {usePresenceStore} from 'sanity'

function PresenceIndicator({documentId}) {
  const presenceStore = usePresenceStore()
  
  // Track who else is viewing/editing the document
}
```

## Internal Dependencies

- `../preview` - Document preview store integration
- `../hooks` - React hooks (`useClient`, `useSchema`, etc.)
- `../studio` - Studio source and workspace access
- `../studioClient` - Sanity client configuration

## Architecture

The store module uses a resource cache pattern to ensure stores are singleton instances per workspace. Stores are created lazily and cached based on their dependencies.

### Subdirectories

- `_legacy/` - Core data stores (document, user, grants, history, presence, project)
- `events/` - Document event tracking and transaction history
- `key-value/` - Key-value storage utilities (localStorage with SWR)
- `comlink/` - Communication link store for iframe/worker communication
- `renderingContext/` - UI rendering context management
- `translog/` - Transaction log utilities
- `user/` - User-related hooks and stores
- `userApplications/` - User application cache
- `accessPolicy/` - Access policy fetching and management

### Store Pattern

Each store typically follows this pattern:

1. `create*Store()` - Factory function to create store instance
2. `use*Store()` - React hook to access the store (with caching)
3. Observable streams for reactive data access
4. Methods for querying and mutating data
