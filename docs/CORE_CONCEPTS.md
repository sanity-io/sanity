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
    types: [/* ... */],
  },

  // Plugins
  plugins: [/* ... */],

  // Tools
  tools: [/* ... */],
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

Document actions are identified by a stable `action` id (`SanityDefinedAction` / `DocumentActionKeys`). The document pane footer is one consumer; other surfaces (version chip, release table, banners) may _mirror_ an id. Mirroring is behavioural: a control reproduces an id even when its file never writes that string (`CanvasLinkedBanner` ↔ `editInCanvas`).

### Built-in Actions

| Action             | Description                                                     |
| ------------------ | --------------------------------------------------------------- |
| `publish`          | Publish draft to live                                           |
| `unpublish`        | Remove published version                                        |
| `delete`           | Delete document entirely                                        |
| `duplicate`        | Create a copy                                                   |
| `discardChanges`   | Revert draft to published                                       |
| `restore`          | Restore from history                                            |
| `discardVersion`   | Discard a release version (Delete schedule on scheduled drafts) |
| `unpublishVersion` | Unpublish the published document when this release publishes    |
| `linkToCanvas`     | Link the document to Canvas                                     |
| `editInCanvas`     | Open the linked Canvas document                                 |
| `unlinkFromCanvas` | Unlink the document from Canvas                                 |
| `schedule`         | Schedule a draft, or edit a scheduled-draft schedule            |

Ids are not 1:1 with UI items. Three of them are claimed by more than one action; see [Ids are not unique](#what-the-gate-cannot-see).

`releases` and `singleDocRelease` **replace** the action list for `versionType === 'version'` and `'scheduled-draft'` rather than composing, so only a root / workspace-level `document.actions` filter survives into those version types.

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

Two types:

**Resolver context** - `DocumentActionsContext`, argument to `document.actions(prev, ctx)`. This is where `versionType` and `releaseId` live (`DocumentActionsContext` also extends `ConfigContext`).

```typescript
type DocumentActionsVersionType = 'published' | 'draft' | 'revision' | 'version' | 'scheduled-draft'

interface DocumentActionsContext {
  documentId?: string
  schemaType: string
  releaseId: string | undefined
  versionType: DocumentActionsVersionType
}
```

Derivation of `ctx.versionType`:

- `params.rev` present → `'revision'`
- cardinality-one release version → `'scheduled-draft'`
- other release version → `'version'`
- published perspective → `'published'`
- `draftsEnabled` → `'draft'`
- `draftsEnabled` false and no other match → `'published'`

**Invoked props** - `DocumentActionProps` extends `EditStateFor`. It does **not** have `versionType`.

```typescript
interface DocumentActionProps extends EditStateFor {
  revision?: string
  initialValueResolved: boolean
}
```

`EditStateFor` is the document pair handed to an invoked action hook. Its members include `id`, `type`, `draft`, `published`, `version`, `liveEdit`, `ready` and `release`, which is a required key typed `string | undefined` (`packages/sanity/src/core/store/document/document-pair/editState.ts`).

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

### The document.actions invariant

> For every control that lets a user trigger a document mutation, the set of Sanity-defined action ids that control's behaviour reproduces must be a subset of the ids present in `source.document.actions(ctx)` for the exact `ctx = {schemaType, documentId, versionType, releaseId}` that control acts on, not the context of the document the user happens to have open.

1. **Keyed on the resolver's id set, not on what the footer renders.** Footer _hiding_ is placement; config _removing_ an id is permission. Only the second binds.
2. **One-directional.** Presence licenses rendering; it never compels it. An action hook may still return `null`.
3. **Behavioural.** A control mirrors an id even when nothing in its file names that id (`CanvasLinkedBanner` ↔ `editInCanvas`).

### In-pane versus out-of-pane

| Surface                                                                             | How it honours config                                                                                                       |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Inside the pane** (footer, overflow, in-pane dialogs fed by the same provider)    | Render from `DocumentActionsStateContext` (`DocumentActionsProvider` already invoked the configured hooks). **No id gate.** |
| **Outside the pane** (chip, inventory, release table, banners that reproduce an id) | Gate on the mirrored id via `useConfiguredDocumentActionIds(ctx)` for **that control's** `ctx`.                             |

- Hook path: `packages/sanity/src/core/config/document/useConfiguredDocumentActionIds.ts`
- The hook shipped with the gating work in #14244. This docs change does not add it.
- `src/core` must not import `src/structure`. Out-of-pane core surfaces cannot invoke structure action hooks.

### Four availability questions

A document action answers four questions. The configured array carries one, the action's own return value carries three.

| Question                      | Answer                                       | Channel      |
| ----------------------------- | -------------------------------------------- | ------------ |
| Allowed by config             | absent from `document.actions(prev, ctx)`    | the array    |
| This document's action at all | `null`                                       | return value |
| Anything to do right now      | rendered `disabled`                          | return value |
| Forbidden                     | rendered `disabled` with a reason in `title` | return value |

`useConfiguredDocumentActionIds` reads the array and nothing else.

The built-ins split the last three inconsistently. "Nothing published to unpublish" greys (`disabled: !isPublished || !isTargetReady`, `UnpublishVersionAction.tsx:111`). "Already published" greys with `ALREADY_PUBLISHED` as the reason (`PublishAction.tsx:259-267`), so a nothing-to-do condition arrives through the forbidden channel. "Scheduled draft is paused" hides, returning `null` (`ScheduledDraftDocumentActions.tsx:47-49`, wired at `:91-94`), and that file supplies no reason anywhere: its `title` is the menu label. UX owns the choice between hiding and greying. This document records the split.

### What the gate cannot see

`useConfiguredDocumentActionIds` collects the `action` ids off the array `document.actions(prev, ctx)` returns. It never invokes the action components. Four limits follow, and all four are accepted at the call site.

**Presence only.** An action a filter removes loses its id from the set, and the gate hides the mirror. An action that stays in the array and returns `null` from its own hook keeps its id in the set, so the mirror can render a live item while the footer renders nothing. `EditScheduledDraftAction` is the live case. `createScheduledDraftAction` returns `null` when its `visibilityCheck` fails, and `EditScheduledDraftAction` supplies `(release) => !isPausedCardinalityOneRelease(release)`. The id `schedule` stays in the set either way, so each mirror has to re-derive the predicate: `ScheduledDraftContextMenu` and `ScheduledDraftMenuButtonWrapper` both call `isPausedCardinalityOneRelease` themselves. One rule, three copies, nothing connecting them.

**Ids are not unique.** Three ids are claimed by seven actions between them:

| id               | claimed by                                                                                                                                                                                                                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schedule`       | `useScheduleAction` (`core/scheduled-publishing/plugin/documentActions/schedule/ScheduleAction.tsx:191`), `useSchedulePublishAction` (`core/singleDocRelease/plugin/documentActions/SchedulePublishAction.tsx:184`), `EditScheduledDraftAction` (`ScheduledDraftDocumentActions.tsx:104`) |
| `publish`        | `usePublishAction` (`structure/documentActions/PublishAction.tsx:336`), `PublishScheduledDraftAction` (`ScheduledDraftDocumentActions.tsx:102`)                                                                                                                                           |
| `discardVersion` | `useDiscardVersionAction` (`core/releases/plugin/documentActions/DiscardVersionAction.tsx:85`), `DeleteScheduledDraftAction` (`ScheduledDraftDocumentActions.tsx:106`)                                                                                                                    |

Presence of an id does not identify which action supplied it. `has('publish')` answers for whichever `publish` the resolver produced.

Two of the three collisions never reach the same resolved array. `releases` replaces the list for `versionType === 'version'` and `singleDocRelease` replaces it for `'scheduled-draft'`, and `singleDocRelease` resolves last (`core/config/resolveDefaultPlugins.ts:19-29`), so the two `publish` claimants never coexist and neither do the two `discardVersion` ones. `useSchedulePublishAction` and `EditScheduledDraftAction` both sit in the scheduled-draft array (`core/singleDocRelease/plugin/documentActions/index.ts:17-22`), so `has('schedule')` in a scheduled-draft context is the live ambiguity.

**Replacement keeps the id.** A studio that swaps its own component in for a built-in keeps that id in the array (`action?: keyof DocumentActionKeys`, `core/config/document/actions.ts:117`). The footer renders the replacement. A mirror surface reads the id and renders its own hard-coded item wired to Sanity's handler. An exact availability signal would still leave the mirror running the wrong implementation.

**Removal propagates, addition does not.** These menus render a fixed set of built-in items and test literal ids (`has('publish')`, `has('schedule')`, `has('discardVersion')`, `has('unpublishVersion')`). Removing an id hides the matching mirror. An action a plugin adds never appears in one, even though `DocumentActionKeys` is open to plugin-registered keys through declaration merging.

Making the gate exact needs a declarative availability filter separate from the render half, which is a public API change. See SAPP-4373. Even an exact signal leaves the replacement case above open, so no gate closes the whole class.

SAPP-4372 would have consolidated the out-of-pane gate into one primitive. It was closed unbuilt on 2026-08-26, so its residue lives here permanently: no gate reaches a surface that never asks the policy question. SAPP-4400 records one, where `ToolPreview.tsx:46` hard-codes `execute: isScheduled` and consults `document.actions` nowhere.

### Why descriptions cannot be resolved out of pane

Do **not** render resolved `DocumentActionDescription[]` outside the pane.

1. **Structure hooks throw outside the pane provider.** The six built-ins in `packages/sanity/src/structure/documentActions/` - `useDeleteAction`, `useDiscardChangesAction`, `useDuplicateAction`, `useHistoryRestoreAction`, `usePublishAction`, `useUnpublishAction` - call `useDocumentPane()`, which throws `'DocumentPane: missing context value'` outside the pane provider (`packages/sanity/src/structure/panes/document/useDocumentPane.tsx`). Combined with the `core ↛ structure` boundary, core surfaces cannot invoke them anyway.
2. **Version-action hooks read ambient perspective, not the chip's release.** `useDiscardVersionAction` reads `usePerspective()` and `useTargetDocumentState()`. `useUnpublishVersionAction` reads `useTargetDocumentState()`. Running them for a chip that represents a different release mislabels / mis-targets the dialog. Nesting `PerspectiveProvider` per chip was rejected: it introduces a `usePerspective` / router / `useDocumentPane().targetDocumentState` three-way divergence.
3. **Each distinct version id opens a document-pair listener.** `editState` is memoised per `(client, idPair, typeName)` (`packages/sanity/src/core/store/document/document-pair/editState.ts`). Resolving a description requires that pair. With `@sanity/ui` v4 keeping closed overlays mounted (`<Activity>`), resolving per chip costs one listener per chip for as long as the overlay tree stays mounted.

Rejected alternatives: rendering resolved descriptions out of pane; widening `DocumentActionGroup` into placement slots; `.find(...)` on resolved components; a per-row resolver twin; gating inside `useScheduledDraftMenuActions`; branded `GatedAction` tokens; custom lint on i18n keys; nesting `PerspectiveProvider` per chip; relaxing `.oxlintrc.json` boundaries.

### Exemptions

Presence of an exemption does not weaken the invariant for a control that _does_ reproduce a Sanity-defined id.

**1. No id in the vocabulary.** `createVersion`, `copyToDrafts`, `copyToRelease`, add-document-to-release, revert-release. `SANITY_DEFINED_ACTIONS` names none of them.

**2. Non-document entity.** Release and variant actions are governed by `releases.actions` or by nothing. `document.actions` is the wrong authority.

**3. Bulk over a selection.** No single `ctx`. Hide the control only when the id is absent for every selected row; exclude rows where it is absent from the transaction. Do not invent a per-row resolver twin.

**4. Remediation UI.** Banners that appear because the footer cannot offer the action. Polarity is per-banner:

| Banner                   | Rule                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Obsolete draft Publish   | **Exempt** - `usePublishAction` returns null when `liveEdit && !version`; the status bar hides the primary |
| Obsolete draft Discard   | **Gate** `discardChanges` with `versionType: 'draft'`                                                      |
| Deleted-document Restore | **Gate** `restore`. Keep the informational banner                                                          |
| Canvas Edit in Canvas    | **Gate** `editInCanvas`                                                                                    |

**5. Deprecated scheduled publishing (`sanity/scheduled-publishing`).** `ContextMenuItems` (Schedules tool and the in-pane Schedule dialog) gates only Publish now on `document.actions`. Its Edit, Delete and Clear items, and all of `FallbackContextMenu` (no-schema rows), stay ungated. They predate the action-id vocabulary and mutate schedule records through the schedules HTTP API (`useScheduleOperation`), not document operations. Edit / Delete / Clear have no honest Sanity-defined id: they are not `delete` (the document is unchanged) and not `discardVersion` (legacy schedules are not versions). Publish now is a document publish via `POST /schedules/…/publish`, so its call site gates it on `publish` (SAPP-4400). That gate reaches config-array omission only, the same presence-only ceiling the shipped out-of-pane gates accept. The plugin is `@deprecated` (enabled only when `scheduledPublishing.enabled` or `hasUsedScheduledPublishing`). In-pane Edit/Delete are already behind `useScheduleAction.action = 'schedule'`. The no-schema fallback cannot build `{schemaType, documentId, versionType, releaseId}`. Studios that want these controls to honour `document.actions` should use scheduled drafts (`singleDocRelease`), where Publish now → `publish`, Edit schedule → `schedule`, Delete schedule → `discardVersion`. See SAPP-4342 and the file comments on `packages/sanity/src/core/scheduled-publishing/components/scheduleContextMenu/ContextMenuItems.tsx` and `FallbackContextMenu.tsx`.

### Reference implementations

1. `packages/sanity/src/core/releases/components/documentHeader/contextMenu/VersionContextMenu.tsx` - resolve `useConfiguredDocumentActionIds` at the surface for the chip's own `ctx`. Derive booleans locally. Pass those booleans into the child menu. Do not invoke action hooks.
2. `packages/sanity/src/core/releases/tool/detail/documentTable/DocumentActions.tsx` - empty-menu idiom:

```ts
const showDiscardVersion = configuredActionIds.has('discardVersion')
const showUnpublish = configuredActionIds.has('unpublishVersion')
const hasConfiguredMenuItems = showDiscardVersion || showUnpublish
if (!hasConfiguredMenuItems) return null
```

Use this whenever a menu would otherwise render a chrome-only shell.

**Source**: `packages/sanity/src/core/config/document/actions.ts`

**Out-of-pane gate**: `packages/sanity/src/core/config/document/useConfiguredDocumentActionIds.ts`

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
