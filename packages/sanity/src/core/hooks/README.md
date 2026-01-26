# Hooks

React hooks for Sanity Studio functionality. This module provides the primary API for plugin and component authors to interact with Sanity's features.

## Purpose

The hooks module exposes React hooks that provide access to Sanity Studio's core functionality:

- **Data access** - Get schema, client, project info, and document data
- **Document operations** - Perform publish, unpublish, delete, and other document actions
- **State subscriptions** - Subscribe to connection state, sync state, and validation
- **Formatting utilities** - Internationalized date, number, time, and duration formatting
- **UI utilities** - Toast notifications, dialog management, clipboard operations

These hooks are the **recommended API** for plugin authors and custom component developers. They abstract away the underlying store complexity and provide a clean, React-friendly interface.

## Key Exports

### Data Access
- `useClient` - Get configured Sanity client instance
- `useSchema` - Access the compiled schema
- `useDataset` - Get current dataset name
- `useProjectId` - Get current project ID
- `useTemplates` - Access document templates
- `useTools` - Get configured studio tools

### Document Operations
- `useDocumentOperation` - Get document operations (publish, patch, delete, etc.)
- `useDocumentOperationEvent` - Subscribe to operation events
- `useEditState` - Get document edit state (draft, published, liveEdit)
- `useValidationStatus` - Get validation markers for a document
- `useSyncState` - Check if document is synced with server
- `useConnectionState` - Monitor connection to Sanity backend

### Presence & Collaboration
- `useReferringDocuments` - Find documents that reference a given document

### Formatting (i18n)
- `useDateTimeFormat` - Localized date/time formatting
- `useNumberFormat` - Localized number formatting
- `useListFormat` - Localized list formatting (e.g., "A, B, and C")
- `useRelativeTime` - Relative time strings (e.g., "2 hours ago")
- `useTimeAgo` - Time ago formatting
- `useFormattedDuration` - Duration formatting
- `useUnitFormatter` - Unit formatting (bytes, etc.)

### UI Utilities
- `useConditionalToast` - Show toasts based on conditions
- `useReconnectingToast` - Show reconnection status toast
- `useDialogStack` - Manage dialog stacking
- `useReviewChanges` - Toggle review changes panel

## Key Files

- `useClient.ts` - Sanity client access with API version configuration
- `useSchema.ts` - Schema access hook
- `useDocumentOperation.ts` - Document operation hooks
- `useEditState.ts` - Document editing state
- `useValidationStatus.ts` - Validation status subscription
- `useConnectionState.ts` - Connection state monitoring
- `useRelativeTime.ts` - Relative time formatting (~200 lines)
- `useFormattedDuration.ts` - Duration formatting (~170 lines)

## Usage Example

```typescript
import {
  useClient,
  useSchema,
  useDocumentOperation,
  useValidationStatus,
  useDateTimeFormat,
} from 'sanity'

function MyDocumentActions({documentId, documentType}) {
  // Get the Sanity client
  const client = useClient({apiVersion: '2024-01-01'})

  // Access schema information
  const schema = useSchema()
  const docSchema = schema.get(documentType)

  // Get document operations
  const {publish, patch} = useDocumentOperation(documentId, documentType)

  // Subscribe to validation
  const {validation, isValidating} = useValidationStatus(documentId, documentType)

  // Format dates
  const dateFormatter = useDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const handlePublish = () => {
    if (validation.length === 0) {
      publish.execute()
    }
  }

  return (
    <div>
      <p>Schema: {docSchema?.title}</p>
      <p>Validation errors: {validation.length}</p>
      <button onClick={handlePublish} disabled={isValidating}>
        Publish
      </button>
    </div>
  )
}
```

## Hook Patterns

### Client Configuration

Always specify an API version when using `useClient`:

```typescript
// ✅ Good - explicit API version
const client = useClient({apiVersion: '2024-01-01'})

// ❌ Avoid - no API version
const client = useClient()
```

### Memoization

Hooks like `useDocumentOperation` return stable references, so you can use them directly in effects:

```typescript
const {publish} = useDocumentOperation(documentId, documentType)

useEffect(() => {
  // publish reference is stable
}, [publish])
```

## Related Modules

- [`../store`](../store/) - Underlying stores that hooks wrap
- [`../form`](../form/) - Form hooks for editing
- [`../studio`](../studio/) - Studio-level hooks
- [`../config`](../config/) - Configuration accessed via hooks
