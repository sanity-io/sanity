# Sanity Studio Architecture

This document provides a high-level overview of the Sanity Studio architecture for developers and AI agents working with this codebase.

## Overview

**Sanity Studio** is an open-source, single-page application (SPA) for content management. It's built with React and TypeScript, designed to be highly customizable through a plugin architecture. The Studio connects to Sanity's **Content Lake** - a real-time, hosted data store that provides the backend infrastructure.

Key characteristics:

- **React-based SPA** - Modern component architecture
- **Real-time collaboration** - Multiple users can edit simultaneously
- **Schema-driven** - Content structure defined in JavaScript/TypeScript
- **Highly extensible** - Plugin system for customization
- **GROQ-powered** - Graph-Oriented Query Language for data access

## Repository Structure

```
sanity/
├── packages/                    # All publishable and internal packages
│   ├── sanity/                 # Main studio package (the "sanity" npm package)
│   ├── groq/                   # GROQ language utilities
│   ├── @sanity/                # Scoped public packages
│   │   ├── types/             # TypeScript type definitions
│   │   ├── schema/            # Schema compilation and validation
│   │   ├── mutator/           # Document mutation logic
│   │   ├── diff/              # Document diffing utilities
│   │   ├── util/              # Shared utilities
│   │   └── vision/            # GROQ query tool (Studio plugin)
│   └── @repo/                  # Internal monorepo tooling (not published)
│       ├── eslint-config/     # Shared ESLint configuration
│       ├── test-config/       # Shared test configuration
│       ├── tsconfig/          # Shared TypeScript configuration
│       ├── tsdown.config/     # Build configuration utilities
│       └── ...
├── dev/                        # Development studios for testing
│   ├── test-studio/           # Primary development studio
│   ├── design-studio/         # Design system testing
│   ├── studio-e2e-testing/    # E2E test fixtures
│   └── ...
├── e2e/                        # End-to-end Playwright tests
├── perf/                       # Performance testing
├── examples/                   # Example projects
└── scripts/                    # Build and maintenance scripts
```

## Package Dependency Graph

The packages have a layered dependency structure. Lower-level packages have no internal dependencies, while higher-level packages compose them.

```
                                    ┌─────────────────┐
                                    │     sanity      │  (main studio package)
                                    └────────┬────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
              ▼                              ▼                              ▼
    ┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
    │   @sanity/cli   │           │  @sanity/schema │           │ @sanity/vision  │
    └────────┬────────┘           └────────┬────────┘           └─────────────────┘
             │                             │                     (Studio plugin)
             │                             │
             ▼                             ▼
    ┌─────────────────┐           ┌─────────────────┐
    │ @sanity/codegen │           │ @sanity/mutator │
    └─────────────────┘           └────────┬────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
          ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
          │  @sanity/types  │    │   @sanity/diff  │    │   @sanity/util  │
          └─────────────────┘    └─────────────────┘    └─────────────────┘
                    │
                    ▼
          ┌─────────────────┐
          │ @sanity/client  │  (external package - API client)
          └─────────────────┘
```

### Package Descriptions

| Package           | Description                                                                             |
| ----------------- | --------------------------------------------------------------------------------------- |
| `sanity`          | Main studio package containing UI, form builder, structure tool, and core functionality |
| `@sanity/types`   | TypeScript type definitions for documents, schemas, and common data structures          |
| `@sanity/schema`  | Schema compilation, validation, and type inference                                      |
| `@sanity/mutator` | Document mutation logic for real-time collaboration                                     |
| `@sanity/diff`    | Generates diffs between documents for change tracking                                   |
| `@sanity/util`    | Shared utilities (paths, date formatting, client helpers)                               |
| `@sanity/vision`  | GROQ query playground tool (Studio plugin)                                              |
| `groq`            | GROQ language utilities and types                                                       |

## Core Architecture Concepts

### Studio and Workspace Configuration

The Studio is configured using `defineConfig()` which creates one or more **workspaces**. Each workspace represents an independent content environment with its own:

- **Project ID** and **Dataset** - Connection to Content Lake
- **Schema** - Document and field type definitions
- **Plugins** - Extended functionality
- **Tools** - Top-level navigation views

```typescript
// sanity.config.ts
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  name: 'default',
  projectId: 'your-project-id',
  dataset: 'production',

  schema: {
    types: [/* document and object types */],
  },

  plugins: [
    structureTool(),
    // Additional plugins...
  ],
})
```

Key configuration files:

- `packages/sanity/src/core/config/types.ts` - Configuration type definitions
- `packages/sanity/src/core/config/defineConfig.ts` - Configuration factory
- `packages/sanity/src/core/config/resolveConfig.ts` - Configuration resolution

### Schema System

The schema system defines the structure of content. Schemas are defined in JavaScript/TypeScript and compiled at runtime.

**Schema hierarchy:**

```
Schema
└── Types
    ├── Document Types (top-level content)
    │   └── Fields
    │       ├── Primitive (string, number, boolean, etc.)
    │       ├── Complex (array, object, reference)
    │       └── Special (image, file, slug, etc.)
    └── Object Types (reusable field groups)
```

Key files:

- `packages/@sanity/schema/` - Schema compilation and validation
- `packages/@sanity/types/` - Schema type definitions
- `packages/sanity/src/core/schema/` - Runtime schema utilities

### Document Store and Content Lake

The **Content Lake** is Sanity's hosted backend. The Studio communicates with it through:

1. **@sanity/client** - HTTP client for CRUD operations and queries
2. **Real-time listeners** - WebSocket connections for live updates
3. **Mutations** - Transactional document changes

**Document lifecycle:**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Draft     │────▶│  Published  │────▶│  Historical │
│  (working)  │     │   (live)    │     │  (versions) │
└─────────────┘     └─────────────┘     └─────────────┘
```

Key stores and modules:

- `packages/sanity/src/core/store/` - Document and data stores
- `packages/sanity/src/core/preview/` - Document preview system
- `packages/@sanity/mutator/` - Mutation application logic

### Plugin Architecture

Plugins extend Studio functionality through a composable API:

```typescript
import {definePlugin} from 'sanity'

export const myPlugin = definePlugin({
  name: 'my-plugin',

  // Add schema types
  schema: {
    types: [/* custom types */],
  },

  // Add tools to navigation
  tools: [/* custom tools */],

  // Customize document actions
  document: {
    actions: (prev, context) => [...prev, customAction],
  },

  // Add studio components
  studio: {
    components: {/* component overrides */},
  },
})
```

Plugin capabilities:

- **Schema extensions** - Add document/object types
- **Tools** - Add top-level navigation views
- **Document actions** - Publish, delete, custom actions
- **Document badges** - Status indicators
- **Document inspectors** - Side panels for document inspection
- **Form components** - Custom input components
- **Studio components** - Override navbar, layout, etc.

### Tools

**Tools** are top-level views accessible from the Studio's main navigation. Built-in tools include:

| Tool         | Package               | Description                         |
| ------------ | --------------------- | ----------------------------------- |
| Structure    | `sanity/structure`    | Document list and editing interface |
| Vision       | `@sanity/vision`      | GROQ query playground               |
| Presentation | `sanity/presentation` | Visual editing preview              |

Tools are React components with routing integration:

```typescript
interface Tool {
  name: string // URL segment
  title: string // Navigation label
  icon?: ComponentType // Navigation icon
  component: ComponentType // Main view component
  router?: Router // Tool-specific routing
  canHandleIntent?: (intent, params) => boolean // Intent handling
  getIntentState?: (intent, params) => state // Intent state mapping
}
```

Key files:

- `packages/sanity/src/core/config/types.ts` - Tool type definition
- `packages/sanity/src/structure/` - Structure tool implementation

### Real-time Collaboration

Sanity supports real-time collaboration through:

1. **Presence** - Shows which users are viewing/editing documents
2. **Live mutations** - Changes sync across all connected clients
3. **Optimistic updates** - UI updates immediately, syncs in background

The mutation system uses operational transformation concepts:

- `packages/@sanity/mutator/` - Core mutation logic
- `packages/sanity/src/core/store/events/` - Event system for changes

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              SANITY STUDIO                               │
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │    Tool     │    │    Form     │    │   Preview   │                 │
│  │  Component  │    │   Builder   │    │   System    │                 │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                 │
│         │                  │                  │                         │
│         └──────────────────┼──────────────────┘                         │
│                            │                                            │
│                   ┌────────▼────────┐                                   │
│                   │  Document Store │◄─────── RxJS Observables          │
│                   └────────┬────────┘                                   │
│                            │                                            │
│         ┌──────────────────┼──────────────────┐                         │
│         │                  │                  │                         │
│  ┌──────▼──────┐   ┌───────▼──────┐   ┌──────▼──────┐                  │
│  │   Mutator   │   │    Client    │   │  Listener   │                  │
│  │  (patches)  │   │   (queries)  │   │ (real-time) │                  │
│  └──────┬──────┘   └───────┬──────┘   └──────┬──────┘                  │
│         │                  │                  │                         │
└─────────┼──────────────────┼──────────────────┼─────────────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Content Lake   │  (Sanity's hosted backend)
                    │   (HTTP/WS)     │
                    └─────────────────┘
```

### Query Flow

1. Component requests data via hooks (`useDocumentStore`, `useClient`)
2. Document Store manages subscriptions and caching
3. Client sends GROQ queries to Content Lake
4. Real-time listeners push updates back

### Mutation Flow

1. User edits trigger form changes
2. Form builder generates patches
3. Mutator applies patches optimistically
4. Mutations sent to Content Lake
5. Confirmation/conflict resolution

## Key Technologies

| Technology            | Purpose                                    |
| --------------------- | ------------------------------------------ |
| **React**             | UI component framework                     |
| **TypeScript**        | Type safety and developer experience       |
| **RxJS**              | Reactive data streams and state management |
| **Vite**              | Development server and build tool          |
| **GROQ**              | Query language for Content Lake            |
| **Portable Text**     | Rich text data structure                   |
| **@sanity/ui**        | Design system components                   |
| **styled-components** | CSS-in-JS styling                          |

## Module Organization (packages/sanity)

The main `sanity` package is organized into modules:

```
packages/sanity/src/
├── core/                    # Core functionality
│   ├── config/             # Configuration system
│   ├── form/               # Form builder
│   ├── hooks/              # React hooks
│   ├── i18n/               # Internationalization
│   ├── preview/            # Document preview
│   ├── schema/             # Schema utilities
│   ├── store/              # Data stores
│   ├── studio/             # Studio shell components
│   ├── templates/          # Document templates
│   ├── validation/         # Document validation
│   └── ...
├── router/                  # Client-side routing
├── structure/              # Structure tool
├── presentation/           # Presentation tool
├── desk/                   # Legacy desk tool (deprecated)
└── _exports/               # Public API exports
```

## Entry Points

The `sanity` package exposes multiple entry points:

| Import                | Description                                    |
| --------------------- | ---------------------------------------------- |
| `sanity`              | Main exports (defineConfig, components, hooks) |
| `sanity/structure`    | Structure tool and builder                     |
| `sanity/router`       | Routing utilities                              |
| `sanity/presentation` | Presentation tool                              |
| `sanity/cli`          | CLI-specific exports                           |
| `sanity/_internal`    | Internal APIs (unstable)                       |

## Further Reading

- [Official Documentation](https://www.sanity.io/docs)
- [Plugin Development Guide](https://www.sanity.io/docs/developing-plugins)
- [GROQ Documentation](https://www.sanity.io/docs/groq)
- [Schema Configuration](https://www.sanity.io/docs/schema-types)
- [Studio Configuration](https://www.sanity.io/docs/configuration)
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [AGENTS.md](./AGENTS.md) - AI agent guidelines for this repository
