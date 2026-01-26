# Store

State management and data stores for Sanity Studio. This module provides reactive data stores using RxJS for documents, users, presence, history, and more.

## Purpose

The store module centralizes all data fetching and state management in Sanity Studio:

- **Document store** - Real-time document subscriptions, mutations, and sync state
- **User store** - User information and authentication state
- **Presence store** - Real-time presence of other users editing documents
- **History store** - Document revision history and timeline
- **Grants store** - Permission checking for documents and actions
- **Key-value store** - Persistent local storage with server sync
- **Events store** - Document change events and transaction history

All stores use **RxJS observables** for reactive state management, allowing components to subscribe to data streams and automatically update when data changes. This pattern enables real-time collaboration features and efficient caching.

## Key Exports

- `useDocumentStore` - Access the document store for subscriptions and mutations
- `useUserStore` - Access user information
- `usePresenceStore` - Track who's editing what
- `useHistoryStore` - Access document revision history
- `useGrantsStore` - Check permissions
- `useCurrentUser` - Get the currently authenticated user
- `useConnectionState` - Monitor connection status to Sanity backend

## Key Files

- `_legacy/datastores.ts` - Factory hooks for creating/accessing stores (~355 lines)
- `_legacy/types.ts` - Shared type definitions
- `events/` - Document event tracking and change calculation

### Subdirectories

- `_legacy/` - Core store implementations (document, grants, history, presence, user, project)
- `events/` - Document events, diffs, and transaction history
- `key-value/` - Local storage with server-side key-value sync
- `comlink/` - Cross-frame communication store
- `renderingContext/` - UI rendering context management
- `accessPolicy/` - Access policy fetching
- `translog/` - Transaction log utilities
- `user/` - User-related hooks
- `userApplications/` - User application caching

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Components                    │
│           (useDocumentStore, usePresence, etc.)     │
└─────────────────────┬───────────────────────────────┘
                      │ subscribe
┌─────────────────────▼───────────────────────────────┐
│                 RxJS Observables                     │
│        (document$, presence$, history$, etc.)       │
└─────────────────────┬───────────────────────────────┘
                      │ fetch/listen
┌─────────────────────▼───────────────────────────────┐
│                  Sanity Client                       │
│           (HTTP API, Real-time listeners)           │
└─────────────────────────────────────────────────────┘
```

## Usage Example

```typescript
import {useDocumentStore, useCurrentUser, usePresenceStore} from 'sanity'
import {useObservable} from 'react-rx'

function MyComponent({documentId}) {
  const documentStore = useDocumentStore()
  const presenceStore = usePresenceStore()
  const currentUser = useCurrentUser()

  // Subscribe to document changes
  const document = useObservable(
    documentStore.listenQuery(
      '*[_id == $id][0]',
      {id: documentId},
      {}
    )
  )

  // Subscribe to presence on this document
  const presence = useObservable(
    presenceStore.documentPresence(documentId)
  )

  return (
    <div>
      <h1>{document?.title}</h1>
      <p>Editing: {presence?.map(p => p.user.displayName).join(', ')}</p>
    </div>
  )
}
```

## RxJS Pattern

Stores follow a consistent pattern:

1. **Create store** - Factory function creates store with client dependencies
2. **Expose observables** - Store exposes RxJS observables for data streams
3. **Cache with ResourceCache** - Stores are cached and reused across components
4. **Subscribe in components** - Use `useObservable` from `react-rx` to subscribe

```typescript
// Store creation pattern (from datastores.ts)
const documentStore = resourceCache.get({
  namespace: 'documentStore',
  dependencies: [client],
}) || createDocumentStore({client})

resourceCache.set({
  namespace: 'documentStore',
  dependencies: [client],
  value: documentStore,
})
```

## Related Modules

- [`../hooks`](../hooks/) - Higher-level hooks that wrap store functionality
- [`../form`](../form/) - Form system uses document store for persistence
- [`../studio`](../studio/) - Studio components consume store data
