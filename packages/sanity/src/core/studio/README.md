# Studio

Top-level studio components and layout for Sanity Studio. This module provides the root components, workspace management, authentication, and core UI structure.

## Purpose

The studio module is the entry point for rendering Sanity Studio:

- **Studio root** - Main `<Studio>` component that bootstraps the application
- **Layout system** - Navigation bar, sidebar, and content area layout
- **Workspace management** - Multi-workspace support and switching
- **Authentication** - Auth boundaries and login screens
- **Routing** - URL routing and navigation helpers
- **Color scheme** - Light/dark mode management
- **Announcements** - In-app announcements system
- **Copy/paste** - Cross-document copy and paste functionality

This module connects the configuration system to the React component tree, providing context providers and the overall application shell.

## Key Exports

### Components
- `Studio` - Root component that renders the entire studio
- `StudioProvider` - Context provider for studio configuration
- `StudioLayout` - Main layout component with navbar and content area

### Workspace Management
- `useWorkspace` - Access current workspace configuration
- `useWorkspaces` - Access all configured workspaces
- `useActiveWorkspace` - Get the currently active workspace

### Authentication
- `AuthBoundary` - Wrapper that handles authentication state
- `NotAuthenticatedScreen` - Login screen component

### Utilities
- `renderStudio` - Render studio to a DOM element
- `useColorScheme` - Access/control light/dark mode
- `useActiveWorkspaceMatcher` - URL-based workspace matching

## Key Files

- `Studio.tsx` - Main studio component (via `./Studio`)
- `StudioProvider.tsx` - Root context provider (via `./StudioProvider`)
- `StudioLayout.tsx` - Layout with navbar (via `./StudioLayout`)
- `colorSchemeStore.ts` - Color scheme state management
- `constants.ts` - Studio-wide constants

### Subdirectories

- `activeWorkspaceMatcher/` - Match workspaces to URLs
- `workspaces/` - Workspace context and validation
- `workspaceLoader/` - Workspace loading and error handling
- `screens/` - Authentication and error screens
- `router/` - URL routing utilities
- `copyPaste/` - Cross-document copy/paste (~1000 lines in `transferValue.ts`)
- `studioAnnouncements/` - In-app announcement system
- `telemetry/` - Performance telemetry (Web Vitals)
- `components/` - Shared studio components
- `hooks/` - Studio-specific hooks
- `upsell/` - Upsell/upgrade prompts
- `addonDataset/` - Addon dataset management
- `manifest/` - Studio manifest utilities
- `packageVersionStatus/` - Version checking
- `liveUserApplication/` - Live user application tracking
- `timezones/` - Timezone utilities

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    <Studio>                          │
│              (root component)                        │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│               <StudioProvider>                       │
│    (config, source, workspace contexts)             │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                <AuthBoundary>                        │
│         (authentication check)                       │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│               <StudioLayout>                         │
│      (navbar, workspace switcher, content)          │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                   Tools                              │
│     (desk, vision, media, plugins, etc.)            │
└─────────────────────────────────────────────────────┘
```

## Usage Example

```typescript
import {Studio} from 'sanity'
import config from './sanity.config'

// Basic studio rendering
function App() {
  return <Studio config={config} />
}

// Or render to a DOM element
import {renderStudio} from 'sanity'

renderStudio(
  document.getElementById('root'),
  config
)
```

### Accessing Studio Context

```typescript
import {useWorkspace, useColorScheme} from 'sanity'

function MyStudioComponent() {
  // Get current workspace info
  const workspace = useWorkspace()
  const {projectId, dataset, schema} = workspace

  // Control color scheme
  const {scheme, setScheme} = useColorScheme()

  return (
    <div>
      <p>Project: {projectId}</p>
      <p>Dataset: {dataset}</p>
      <button onClick={() => setScheme(scheme === 'dark' ? 'light' : 'dark')}>
        Toggle theme
      </button>
    </div>
  )
}
```

### Multi-Workspace Setup

```typescript
import {defineConfig} from 'sanity'

export default defineConfig([
  {
    name: 'production',
    title: 'Production',
    projectId: 'abc123',
    dataset: 'production',
    basePath: '/production',
  },
  {
    name: 'staging',
    title: 'Staging',
    projectId: 'abc123',
    dataset: 'staging',
    basePath: '/staging',
  },
])
```

## Related Modules

- [`../config`](../config/) - Configuration consumed by studio
- [`../store`](../store/) - Data stores initialized by studio
- [`../hooks`](../hooks/) - Hooks that require studio context
- [`../form`](../form/) - Form system rendered within studio
