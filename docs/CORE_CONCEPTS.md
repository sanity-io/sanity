# Core Concepts

This document explains the key abstractions and mental models needed to understand and work with the Sanity Studio codebase. It is intended for developers contributing to the monorepo and for AI agents assisting with development tasks.

## Table of Contents

1. [Workspace](#workspace)
2. [Documents](#documents)
3. [Schema](#schema)
4. [Perspectives](#perspectives)
5. [Releases](#releases)
6. [Tools](#tools)
7. [Plugins](#plugins)
8. [Forms & Inputs](#forms--inputs)
9. [Document Actions](#document-actions)
10. [Presence](#presence)

---

## Workspace

A **Workspace** is the top-level configuration unit in Sanity Studio. It represents a complete studio environment with its own project, dataset, schema, and tools.

### Key Concepts

- **Project ID & Dataset**: Each workspace connects to a specific Sanity project and dataset
- **Base Path**: URL path for the workspace (e.g., `/myWorkspace`)
- **Sources**: A workspace can have multiple data sources (advanced use case)

### Configuration

Workspaces are configured in `sanity.config.ts`:

```typescript
import {defineConfig} from 'sanity'

export default defineConfig({
  name: 'default',
  title: 'My Studio',
  projectId: 'your-project-id',
  dataset: 'production',
  basePath: '/studio',

  // Schema types
  schema: {
    types: [
      /* ... */
    ],
  },

  // Plugins
  plugins: [
    /* ... */
  ],

  // Tools
  tools: [
    /* ... */
  ],
})
```

### Multi-Workspace Setup

For multiple workspaces, pass an array:

```typescript
export default defineConfig([
  {
    name: 'production',
    basePath: '/production',
    projectId: 'xxx',
    dataset: 'production',
  },
  {
    name: 'staging',
    basePath: '/staging',
    projectId: 'xxx',
    dataset: 'staging',
  },
])
```

### Key Types

- `WorkspaceOptions` - Configuration input for a workspace
- `Workspace` - The resolved workspace with all settings
- `Source` - Data source within a workspace (project + dataset + schema)

**Source**: `packages/sanity/src/core/config/types.ts`

---

## Documents

Documents are the fundamental data units in Sanity. Every piece of content is stored as a JSON document with a unique ID and type.

### Document Structure

All Sanity documents have these system fields:

```typescript
interface SanityDocument {
  _id: string // Unique identifier
  _type: string // Schema type name
  _createdAt: string // ISO timestamp
  _updatedAt: string // ISO timestamp
  _rev: string // Revision ID for optimistic locking
}
```

### Draft vs Published States

Sanity uses a **draft/publish model** for content management:

| State         | ID Pattern                        | Description                       |
| ------------- | --------------------------------- | --------------------------------- |
| **Published** | `myDocument`                      | Live content visible to end users |
| **Draft**     | `drafts.myDocument`               | Work-in-progress changes          |
| **Version**   | `versions.<releaseId>.myDocument` | Content in a release              |

### ID Utilities

```typescript
import {
  getDraftId, // 'foo' → 'drafts.foo'
  getPublishedId, // 'drafts.foo' → 'foo'
  isDraftId, // Check if ID is a draft
  isPublishedId, // Check if ID is published
  isVersionId, // Check if ID is in a release
  getVersionId, // Get version ID for a release
} from 'sanity'
```

### Live Edit

Documents with `liveEdit: true` in their schema skip the draft stage—edits are published immediately.

**Source**: `packages/@sanity/types/src/documents/types.ts`, `packages/sanity/src/core/util/draftUtils.ts`

---

## Schema

The schema system defines the structure of your content. It determines what document types exist, what fields they contain, and how validation works.

### Schema Types

Sanity supports these primitive and complex types:

| Category       | Types                                           |
| -------------- | ----------------------------------------------- |
| **Primitives** | `string`, `number`, `boolean`, `text`           |
| **Date/Time**  | `date`, `datetime`                              |
| **Complex**    | `object`, `array`, `reference`, `image`, `file` |
| **Special**    | `slug`, `block` (Portable Text), `document`     |

### Defining Schema Types

```typescript
import {defineType, defineField} from 'sanity'

export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [{type: 'block'}],
    }),
  ],
})
```

### Validation

Validation rules are defined per-field using the `Rule` API:

```typescript
validation: (rule) =>
  rule
    .required()
    .min(5)
    .max(100)
    .custom((value) => (value?.includes('bad') ? 'No bad words!' : true))
```

### Schema Compilation

At runtime, schema definitions are compiled into `SchemaType` objects with resolved references and validation rules. The compiled schema is accessible via `ConfigContext.schema`.

### Key Types

- `SchemaTypeDefinition` - Input definition for a schema type
- `SchemaType` - Compiled schema type at runtime
- `ObjectSchemaType` - Compiled object/document type with fields
- `Schema` - The full compiled schema with `get()` and `has()` methods

**Source**: `packages/@sanity/types/src/schema/types.ts`

---

## Perspectives

Perspectives control which version of documents you see when querying content. They are fundamental to the draft/publish model and the releases feature.

### Perspective Types

| Perspective   | Description                       | Document ID Pattern                              |
| ------------- | --------------------------------- | ------------------------------------------------ |
| `published`   | Only published documents          | `myDoc`                                          |
| `drafts`      | Drafts layered on published       | `drafts.myDoc` → `myDoc`                         |
| `<releaseId>` | Release version layered on drafts | `versions.<id>.myDoc` → `drafts.myDoc` → `myDoc` |

### Perspective Stack

When viewing a release, perspectives are "stacked" chronologically:

```typescript
// Viewing a release scheduled for next month
perspectiveStack: ['rSummer2024', 'drafts']
// Resolution order: version → draft → published
```

### Using Perspectives

```typescript
import {usePerspective} from 'sanity'

function MyComponent() {
  const {
    selectedPerspectiveName, // 'published' | 'drafts' | releaseId
    selectedReleaseId, // undefined for published/drafts
    perspectiveStack, // Array for client queries
  } = usePerspective()
}
```

### Key Types

- `TargetPerspective` - The selected perspective (system bundle or release document)
- `PerspectiveStack` - Ordered array of perspective IDs for queries
- `SystemBundle` - Built-in perspectives: `'drafts'` | `'published'`

**Source**: `packages/sanity/src/core/perspective/types.ts`

---

## Releases

Releases (also called Content Releases) allow grouping document changes for coordinated publishing. They are Sanity's content versioning and scheduling system.

### Release States

| State         | Description                        |
| ------------- | ---------------------------------- |
| **Active**    | Being edited, not yet published    |
| **Scheduled** | Set to publish at a specific time  |
| **Published** | All documents have been published  |
| **Archived**  | No longer active, kept for history |

### Release Types

```typescript
const releaseTypes = ['asap', 'scheduled', 'undecided'] as const
```

- **ASAP**: Publish as soon as ready (no fixed time)
- **Scheduled**: Publish at a specific date/time
- **Undecided**: Release timing not yet determined

### Release Documents

Releases are stored as special system documents:

```typescript
interface ReleaseDocument {
  _id: string // e.g., '_.releases.summer-launch'
  _type: 'system.release'
  metadata: {
    title: string
    description?: string
    releaseType: 'asap' | 'scheduled' | 'undecided'
    intendedPublishAt?: string // For scheduled releases
  }
  state: 'active' | 'published' | 'archived'
}
```

### Version Documents

Documents in a release have IDs like:

```
versions.<releaseId>.<publishedDocumentId>
```

Example: `versions.rSummer2024.article-123`

### Key Hooks

```typescript
import {
  useActiveReleases, // Get all active releases
  useReleaseOperations, // Create, update, publish, archive
  useReleasesStore, // Full release state management
} from 'sanity'
```

**Source**: `packages/sanity/src/core/releases/`

---

## Tools

Tools are top-level views or "apps" within Sanity Studio. They appear in the main navigation and have their own URL routes.

### Built-in Tools

- **Desk** (or Structure) - Document editing interface
- **Vision** - GROQ query playground
- **Scheduled Publishing** - View scheduled publishes

### Tool Interface

```typescript
interface Tool<Options = any> {
  name: string // URL segment (e.g., 'desk')
  title: string // Display name
  icon?: ComponentType // Navigation icon
  component: ComponentType<{tool: Tool<Options>}>
  options?: Options // Custom configuration
  router?: Router // URL routing

  // Intent handling
  canHandleIntent?: (intent, params, payload) => boolean
  getIntentState?: (intent, params, routerState, payload) => unknown
}
```

### Creating a Custom Tool

```typescript
import {definePlugin} from 'sanity'

export const myTool = definePlugin({
  name: 'my-tool',
  tools: [
    {
      name: 'analytics',
      title: 'Analytics',
      icon: ChartIcon,
      component: AnalyticsDashboard,
    },
  ],
})
```

### Intent Handling

Tools can respond to intents like "edit" or "create":

```typescript
canHandleIntent: (intent, params) => {
  if (intent === 'edit' && params.type === 'article') {
    return true
  }
  return false
}
```

**Source**: `packages/sanity/src/core/config/types.ts` (Tool interface)

---

## Plugins

Plugins extend Sanity Studio's functionality. They can add schema types, tools, document actions, form inputs, and more.

### Creating a Plugin

```typescript
import {definePlugin} from 'sanity'

export const myPlugin = definePlugin<MyPluginOptions>((options) => ({
  name: 'my-plugin',

  // Add schema types
  schema: {
    types: [myCustomType],
  },

  // Add tools
  tools: [myTool],

  // Customize document handling
  document: {
    actions: (prev, context) => [...prev, myAction],
    badges: (prev, context) => [...prev, myBadge],
  },

  // Customize forms
  form: {
    components: {
      input: MyCustomInput,
    },
  },

  // Nest other plugins
  plugins: [otherPlugin()],
}))
```

### Using Plugins

```typescript
import {defineConfig} from 'sanity'
import {myPlugin} from './plugins/myPlugin'

export default defineConfig({
  // ...
  plugins: [myPlugin({option: 'value'})],
})
```

### Plugin Composition

Plugins can compose other plugins, and configuration options are merged recursively. Later plugins can override earlier ones.

### Key Types

- `Plugin<TOptions>` - Function that returns plugin options
- `PluginOptions` - Configuration a plugin can provide
- `ComposableOption<TValue, TContext>` - Pattern for composable config

**Source**: `packages/sanity/src/core/config/definePlugin.ts`

---

## Forms & Inputs

The form system renders editing interfaces for documents based on their schema. It handles state management, validation, patching, and real-time collaboration.

### Form Architecture

```
Document Form
├── Form State (manages document value, validation, focus)
├── Field Components (one per schema field)
│   └── Input Components (type-specific editors)
└── Patch Channel (handles changes)
```

### Input Components

Each schema type has a corresponding input component:

| Schema Type | Input Component     |
| ----------- | ------------------- |
| `string`    | `StringInput`       |
| `number`    | `NumberInput`       |
| `boolean`   | `BooleanInput`      |
| `array`     | `ArrayInput`        |
| `object`    | `ObjectInput`       |
| `reference` | `ReferenceInput`    |
| `image`     | `ImageInput`        |
| `block`     | `PortableTextInput` |

### Custom Inputs

You can create custom inputs in schema definitions:

```typescript
defineField({
  name: 'rating',
  type: 'number',
  components: {
    input: StarRatingInput, // Custom component
  },
})
```

### Patching System

Changes to documents are expressed as patches:

```typescript
import {set, unset, insert, setIfMissing} from 'sanity'

// Set a value
onChange(set('New Title', ['title']))

// Insert into array
onChange(insert([{_key: 'abc', ...}], 'after', ['items', 0]))

// Unset a field
onChange(unset(['description']))
```

### Form Props

Input components receive standardized props:

```typescript
interface InputProps {
  value: unknown // Current field value
  schemaType: SchemaType // Field's schema type
  onChange: (patch: Patch) => void
  path: Path // Path to this field
  validation: ValidationMarker[]
  presence: FormNodePresence[]
  readOnly?: boolean
  // ... and more
}
```

**Source**: `packages/sanity/src/core/form/`

---

## Document Actions

Document Actions are buttons and operations that appear in the document editor's action bar. They control publishing, deletion, duplication, and other document-level operations.

### Built-in Actions

| Action           | Description               |
| ---------------- | ------------------------- |
| `publish`        | Publish draft to live     |
| `unpublish`      | Remove published version  |
| `delete`         | Delete document entirely  |
| `duplicate`      | Create a copy             |
| `discardChanges` | Revert draft to published |
| `restore`        | Restore from history      |

### Action Component Structure

```typescript
interface DocumentActionComponent {
  (props: DocumentActionProps): DocumentActionDescription | null
  action?: string // Identifier for replacement
}

interface DocumentActionDescription {
  label: string
  icon?: ComponentType
  tone?: 'primary' | 'positive' | 'caution' | 'critical'
  disabled?: boolean
  shortcut?: string
  onHandle?: () => void
  dialog?: DocumentActionDialogProps // Show confirmation/form
}
```

### Creating Custom Actions

```typescript
function MyPublishAction(props: DocumentActionProps) {
  const {draft, published} = props

  return {
    label: 'Super Publish',
    icon: RocketIcon,
    tone: 'positive',
    disabled: !draft,
    onHandle: async () => {
      // Custom publish logic
    },
  }
}

// Replace built-in publish action
export default defineConfig({
  document: {
    actions: (prev, context) =>
      prev.map((action) => (action.action === 'publish' ? MyPublishAction : action)),
  },
})
```

### Action Context

Actions receive context about the document state:

```typescript
interface DocumentActionProps {
  id: string // Document ID
  type: string // Schema type
  draft: SanityDocument | null
  published: SanityDocument | null
  liveEdit: boolean
  versionType: 'published' | 'draft' | 'version'
  releaseId?: string // If editing in a release
}
```

### Dialogs

Actions can show dialogs for confirmation or additional input:

```typescript
return {
  label: 'Delete',
  dialog: {
    type: 'confirm',
    message: 'Are you sure?',
    onConfirm: () => deleteDocument(),
    onCancel: () => setDialogOpen(false),
  },
}
```

**Source**: `packages/sanity/src/core/config/document/actions.ts`

---

## Presence

Presence is Sanity's real-time collaboration system. It shows which users are viewing or editing a document and where their cursors are located.

### Presence Data

```typescript
interface FormNodePresence {
  user: User // Who is present
  path: Path // Where in the document
  sessionId: string // Browser session
  lastActiveAt: string // When last active
  selection?: EditorSelection // For text editors
}
```

### How It Works

1. **Session Tracking**: Each browser session has a unique ID
2. **Location Reporting**: The studio reports which document/field is focused
3. **Real-time Sync**: Presence data syncs via Sanity's Bifur service
4. **Visual Indicators**: Avatars and cursors show other users' locations

### Using Presence

```typescript
// In input components
function MyInput(props: InputProps) {
  const {presence} = props

  return (
    <div>
      <PresenceOverlay presence={presence} />
      {/* Input content */}
    </div>
  )
}
```

### Presence Regions

The presence system tracks "regions" in the form—areas where users can be present:

```typescript
interface FieldPresenceData {
  element: HTMLElement | null
  presence: FormNodePresence[]
  maxAvatars: number // Limit visible avatars
}
```

**Source**: `packages/sanity/src/core/presence/types.ts`

---

## Quick Reference

### Key Imports

```typescript
import {
  // Configuration
  defineConfig,
  definePlugin,
  defineType,
  defineField,

  // Document utilities
  getDraftId,
  getPublishedId,
  isDraftId,

  // Hooks
  useClient,
  useSchema,
  usePerspective,
  useActiveReleases,

  // Form
  set,
  unset,
  insert,

  // Types
  type SanityDocument,
  type SchemaType,
  type Tool,
  type Plugin,
} from 'sanity'
```

### Directory Structure

```
packages/sanity/src/core/
├── config/           # Configuration types and utilities
├── form/             # Form system and inputs
├── perspective/      # Perspective management
├── presence/         # Real-time collaboration
├── releases/         # Content releases
├── schema/           # Schema compilation
├── store/            # State management
└── studio/           # Studio shell and UI

packages/@sanity/types/src/
├── documents/        # Document types
├── schema/           # Schema type definitions
├── validation/       # Validation types
└── ...
```

### Further Reading

- [Sanity Documentation](https://www.sanity.io/docs)
- [Schema Types Reference](https://www.sanity.io/docs/schema-types)
- [Plugin Development](https://www.sanity.io/docs/plugin-development)
- [GROQ Query Language](https://www.sanity.io/docs/groq)
