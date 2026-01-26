# Config

Configuration system for Sanity Studio. This module provides the APIs for defining studio configurations, plugins, and workspace settings.

## Purpose

The config module is the foundation for customizing Sanity Studio. It handles:

- **Studio configuration** - Define project settings, datasets, schema, plugins, and tools
- **Plugin system** - Create reusable configuration bundles that can be shared across projects
- **Configuration resolution** - Merge and flatten nested plugin configurations into a final resolved config
- **Type definitions** - Comprehensive TypeScript types for all configuration options (1300+ lines in `types.ts`)

The configuration system uses a compositional approach where plugins can extend any aspect of the studio, and nested plugins are flattened into a single resolved configuration at runtime.

## Key Exports

- `defineConfig` - Main function to define a studio configuration
- `definePlugin` - Create reusable plugins that extend studio functionality
- `resolveConfig` - Resolve and flatten nested configurations
- `flattenConfig` - Flatten plugin configurations into a single config object
- `ConfigPropertyError` - Error class for configuration property issues
- `ConfigResolutionError` - Error class for configuration resolution failures
- `SchemaError` - Error class for schema-related configuration errors

## Key Files

- `types.ts` - Core TypeScript types for all configuration options (~1300 lines)
- `defineConfig.ts` - The `defineConfig` helper function
- `definePlugin.ts` - The `definePlugin` helper function with validation
- `resolveConfig.ts` - Logic to resolve workspace configurations
- `configPropertyReducers.ts` - Reducers for merging configuration properties (~720 lines)
- `flattenConfig.ts` - Utilities for flattening nested plugin configs

### Subdirectories

- `document/` - Document-level configuration (actions, badges, inspectors)
- `form/` - Form configuration types
- `studio/` - Studio-level configuration types
- `auth/` - Authentication configuration types
- `releases/` - Content release action configuration

## Usage Example

```typescript
import {defineConfig, definePlugin} from 'sanity'

// Define a plugin
const myPlugin = definePlugin({
  name: 'my-plugin',
  schema: {
    types: [/* custom schema types */],
  },
  document: {
    actions: (prev) => [...prev, myCustomAction],
  },
})

// Define studio configuration
export default defineConfig({
  projectId: 'your-project-id',
  dataset: 'production',
  plugins: [myPlugin()],
  schema: {
    types: [/* your schema types */],
  },
})
```

## Related Modules

- [`../studio`](../studio/) - Studio components that consume the resolved configuration
- [`../form`](../form/) - Form system configured via form options
- [`../store`](../store/) - Data stores initialized from configuration
