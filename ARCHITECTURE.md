# Sanity Monorepo Architecture

This document provides a high-level overview of the Sanity Studio monorepo architecture to help developers and AI agents understand the codebase structure.

## Overview

**Sanity Studio** is an open-source, React-based content management system (CMS) that provides:

- **Real-time collaboration** - Multiple users can edit content simultaneously with live updates
- **Customizable UI** - Built with React, allowing deep customization of the editing experience
- **Structured content** - Schema-driven content modeling with validation
- **Content Lake** - Cloud-hosted content API with GROQ query language support

The studio connects to Sanity's **Content Lake** API for content storage, querying, and real-time synchronization.

## Monorepo Structure

```
sanity/
├── packages/
│   ├── @repo/              # Internal tooling (not published)
│   │   ├── eslint-config/  # Shared ESLint configuration
│   │   ├── test-config/    # Shared Vitest configuration
│   │   ├── tsconfig/       # Shared TypeScript configuration
│   │   └── ...
│   │
│   ├── @sanity/            # Public @sanity/* scoped packages
│   │   ├── cli/            # CLI tool (`sanity` command)
│   │   ├── types/          # TypeScript type definitions
│   │   ├── schema/         # Schema compilation and validation
│   │   ├── mutator/        # Document mutation logic
│   │   ├── diff/           # Document diffing utilities
│   │   ├── migrate/        # Content migration tools
│   │   ├── codegen/        # Code generation utilities
│   │   ├── vision/         # GROQ query playground tool
│   │   └── util/           # Shared utilities
│   │
│   ├── sanity/             # Main Sanity Studio package
│   ├── groq/               # GROQ query language implementation
│   └── create-sanity/      # Project scaffolding (`npm create sanity`)
│
├── dev/                    # Development studios for testing
│   └── test-studio/        # Primary dev studio (pnpm dev)
│
├── e2e/                    # End-to-end Playwright tests
├── perf/                   # Performance testing
└── examples/               # Example studio configurations
```

## Key Packages

### `packages/sanity` - Core Studio

The main Sanity Studio package containing all UI components and core functionality. Located at `src/core/`:

| Module | Purpose |
|--------|---------|
| `config/` | Workspace and plugin configuration types |
| `form/` | Form builder for document editing |
| `store/` | State management and data stores |
| `studio/` | Top-level studio shell and navigation |
| `schema/` | Runtime schema utilities |
| `preview/` | Document preview rendering |
| `presence/` | Real-time user presence |
| `comments/` | Document commenting system |
| `releases/` | Content release management |
| `perspective/` | Draft/published/release view modes |
| `validation/` | Content validation engine |
| `i18n/` | Internationalization support |
| `search/` | Content search functionality |
| `templates/` | Initial value templates |

### `packages/@sanity/cli` - CLI Tool

The `sanity` command-line interface for:
- Creating new projects (`sanity init`)
- Running the dev server (`sanity dev`)
- Building for production (`sanity build`)
- Deploying studios (`sanity deploy`)
- Managing datasets and content

### `packages/@sanity/types` - TypeScript Definitions

Core TypeScript type definitions shared across packages:
- Schema types (`SchemaType`, `ObjectSchemaType`, `ArraySchemaType`)
- Document types (`SanityDocument`, `SanityDocumentLike`)
- User types (`CurrentUser`)
- Client types

### `packages/@sanity/schema` - Schema Compilation

Compiles user-defined schemas into runtime schema objects:
- Type resolution and inheritance
- Validation rule compilation
- Preview configuration processing

### `packages/groq` - GROQ Query Language

Implementation of GROQ (Graph-Relational Object Queries):
- Query parsing and AST generation
- Query evaluation engine
- Used by Vision plugin and content querying

## Core Concepts

### Workspace

A **Workspace** is a configured Sanity environment combining:
- `projectId` - Sanity project identifier
- `dataset` - Content dataset name
- `schema` - Document type definitions
- `tools` - Available studio tools
- `plugins` - Installed plugins

```typescript
interface WorkspaceOptions {
  name: string
  basePath: string       // URL path for this workspace
  projectId: string
  dataset: string
  schema: { types: SchemaTypeDefinition[] }
  tools?: Tool[]
  plugins?: PluginOptions[]
}
```

Studios can have multiple workspaces, each with different configurations.

### Document

A **Document** is the fundamental content unit stored in Content Lake:
- Has a unique `_id` identifier
- Has a `_type` matching a schema type
- Contains structured data defined by the schema
- Supports **drafts** (unpublished changes) and **published** versions

Document IDs follow conventions:
- `abc123` - Published document
- `drafts.abc123` - Draft version
- `versions.<releaseId>.abc123` - Release version

### Schema

A **Schema** defines the structure and validation rules for documents:

```typescript
// Example schema type definition
{
  name: 'post',
  type: 'document',
  fields: [
    { name: 'title', type: 'string' },
    { name: 'body', type: 'array', of: [{ type: 'block' }] },
    { name: 'author', type: 'reference', to: [{ type: 'author' }] }
  ]
}
```

### Tool

A **Tool** is a top-level view or application within the studio:
- Has a URL route (`/studio/structure`, `/studio/vision`)
- Renders a React component when active
- Can handle intents (e.g., "edit document", "create document")

Built-in tools:
- **Structure** - Document browsing and editing
- **Vision** - GROQ query playground

```typescript
interface Tool {
  name: string           // URL segment
  title: string          // Display name
  icon?: ComponentType   // Navigation icon
  component: ComponentType<{ tool: Tool }>
  canHandleIntent?: (intent, params, payload) => boolean
}
```

### Plugin

A **Plugin** extends studio functionality by composing configuration:

```typescript
interface PluginOptions {
  name: string
  plugins?: PluginOptions[]      // Nested plugins
  schema?: { types: [] }         // Additional schema types
  tools?: Tool[]                 // Additional tools
  document?: {
    actions?: DocumentActionComponent[]   // Document actions
    badges?: DocumentBadgeComponent[]     // Document badges
    inspectors?: DocumentInspector[]      // Side panel inspectors
  }
  form?: { components?: FormComponents }  // Custom form components
}
```

Plugins are composed recursively, with later plugins able to modify earlier ones.

### Perspective

A **Perspective** determines which version of documents to display:
- `published` - Only published content
- `drafts` - Published content with draft overlays
- `<releaseId>` - Content within a specific release

Perspectives enable preview of unpublished changes and staged releases.

```typescript
interface PerspectiveContextValue {
  selectedPerspectiveName: 'published' | ReleaseId | undefined
  selectedReleaseId: ReleaseId | undefined
  perspectiveStack: PerspectiveStack  // For layered perspectives
}
```

## Data Flow

### Document Editing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Form Input  │───▶│  Document   │───▶│   Preview   │         │
│  │ Components  │    │   Store     │    │   Render    │         │
│  └─────────────┘    └──────┬──────┘    └─────────────┘         │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Document Store                            │
│  • Manages local document state                                 │
│  • Queues mutations                                             │
│  • Handles optimistic updates                                   │
│  • Manages draft/published states                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Content Lake API                           │
│  • Persists documents                                           │
│  • Executes GROQ queries                                        │
│  • Broadcasts real-time changes                                 │
│  • Manages assets (images, files)                               │
└─────────────────────────────────────────────────────────────────┘
```

### Real-time Synchronization

1. **Listeners** - Studio subscribes to document changes via WebSocket
2. **Mutations** - Changes are sent as mutation operations
3. **Sync** - Content Lake broadcasts changes to all connected clients
4. **State** - Local stores update with incoming changes via RxJS observables

### State Management

The studio uses **RxJS** for reactive state management:
- `DocumentStore` - Manages document state and mutations
- `PresenceStore` - Tracks user presence and selections
- `HistoryStore` - Document revision history
- `ProjectStore` - Project-level configuration

## Build System

### Package Management: pnpm

- **pnpm workspaces** for monorepo package linking
- Version pinned via `packageManager` field in root `package.json`
- Strict dependency management with `preinstall` enforcement

### Build Orchestration: Turborepo

`turbo.json` defines:
- **Task dependencies** - Build order (`^build` means build dependencies first)
- **Caching** - Local and remote build caching
- **Environment variables** - Variables that invalidate cache

Key tasks:
```bash
pnpm build        # Build all packages
pnpm check:types  # TypeScript type checking
pnpm lint         # ESLint + Oxlint
pnpm test         # Vitest unit tests
```

### Versioning & Publishing: Lerna-lite

- **Conventional commits** for automated versioning
- Coordinated package publishing to npm
- Changelog generation

## Development Workflow

```bash
# Install dependencies
pnpm install

# Build all packages (required before testing)
pnpm build

# Start dev studio at http://localhost:3333
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm check:types

# Lint and format
pnpm lint:fix
```

## Further Reading

- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [AGENTS.md](./AGENTS.md) - AI agent guidelines
- [packages/sanity/README.md](./packages/sanity/README.md) - Main package documentation
- [Sanity Documentation](https://www.sanity.io/docs) - Official docs
