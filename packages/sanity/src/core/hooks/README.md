# Hooks

A collection of React hooks for Sanity Studio. These hooks provide access to studio context, document operations, formatting utilities, and various studio features.

## Key Exports

### Client & Configuration

- `useClient` - Access the Sanity client with configurable API version
- `useSchema` - Access the current workspace schema
- `useProjectId` - Get the current project ID
- `useDataset` - Get the current dataset name
- `useTemplates` - Access document templates
- `useTools` - Access registered studio tools

### Document Operations

- `useDocumentOperation` - Execute document operations (publish, delete, duplicate, etc.)
- `useDocumentOperationEvent` - Subscribe to document operation events
- `useEditState` - Get document edit state (draft, published, liveEdit)
- `useValidationStatus` - Get document validation status
- `useSyncState` - Get document synchronization state
- `useConnectionState` - Monitor real-time connection status
- `useReferringDocuments` - Find documents that reference a given document

### Formatting & Localization

- `useDateTimeFormat` - Format dates and times with Intl.DateTimeFormat
- `useNumberFormat` - Format numbers with Intl.NumberFormat
- `useListFormat` - Format lists with Intl.ListFormat
- `useRelativeTime` - Display relative time (e.g., "2 hours ago")
- `useTimeAgo` - Human-readable time differences
- `useFormattedDuration` - Format durations
- `useUnitFormatter` - Format values with units

### Releases & Perspectives

- `useFilteredReleases` - Get filtered release bundles
- `useReviewChanges` - Access review changes panel state

### UI & Features

- `useDialogStack` - Manage dialog stacking behavior
- `useConditionalToast` - Show toasts based on conditions
- `useReconnectingToast` - Display reconnection notifications
- `useGlobalCopyPasteElementHandler` - Handle global copy/paste
- `useFeatureEnabled` - Check if a feature flag is enabled

### User & Permissions

- `useUserListWithPermissions` - Get users with their permissions
- `useManageFavorite` - Manage favorite documents

### Studio URLs

- `useStudioUrl` - Generate studio URLs for documents

## Usage

### Accessing the Sanity Client

```ts
import {useClient} from 'sanity'

function MyComponent() {
  // Get client with specific API version
  const client = useClient({apiVersion: '2024-01-01'})
  
  // Use for queries
  const data = await client.fetch('*[_type == "post"]')
}
```

### Document Operations

```ts
import {useDocumentOperation} from 'sanity'

function PublishButton({id, type}) {
  const {publish} = useDocumentOperation(id, type)
  
  return (
    <button 
      onClick={() => publish.execute()}
      disabled={publish.disabled}
    >
      Publish
    </button>
  )
}
```

### Formatting Dates

```ts
import {useDateTimeFormat} from 'sanity'

function FormattedDate({date}) {
  const formatDate = useDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  
  return <span>{formatDate(new Date(date))}</span>
}
```

### Checking Validation Status

```ts
import {useValidationStatus} from 'sanity'

function ValidationIndicator({documentId, documentType}) {
  const {isValidating, validation} = useValidationStatus(documentId, documentType)
  
  const hasErrors = validation.some(v => v.level === 'error')
  
  return hasErrors ? <ErrorIcon /> : <ValidIcon />
}
```

### Finding References

```ts
import {useReferringDocuments} from 'sanity'

function ReferencesList({documentId}) {
  const {isLoading, referringDocuments} = useReferringDocuments(documentId)
  
  if (isLoading) return <Spinner />
  
  return (
    <ul>
      {referringDocuments.map(doc => (
        <li key={doc._id}>{doc._type}</li>
      ))}
    </ul>
  )
}
```

## Internal Dependencies

- `../studio` - Studio context and source access
- `../store` - Data stores for documents and users
- `../config` - Configuration types
- `../releases` - Release management
- `../i18n` - Internationalization

## Guidelines

- Most hooks require being used within a Sanity Studio context
- Use the `apiVersion` option with `useClient` to ensure API compatibility
- Document operation hooks handle optimistic updates automatically
- Formatting hooks respect the user's locale settings
