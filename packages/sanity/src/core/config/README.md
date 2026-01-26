# Config

The configuration system for Sanity Studio. This module provides the foundation for defining and resolving studio configuration, plugins, and workspace settings.

## Key Exports

- `defineConfig` - Define a Sanity Studio configuration
- `definePlugin` - Create reusable plugins with optional configuration options
- `resolveConfig` - Resolve and merge configuration from plugins and user config
- `flattenConfig` - Flatten nested plugin configurations into a single config object
- `resolveSchemaTypes` - Resolve schema types from configuration
- `ConfigPropertyError` - Error class for configuration property issues
- `ConfigResolutionError` - Error class for configuration resolution failures
- `SchemaError` - Error class for schema-related issues

### Document Configuration

- `defineDocumentAction` - Define custom document actions (publish, delete, etc.)
- `defineDocumentBadge` - Define custom document badges
- `defineDocumentInspector` - Define custom document inspectors

### Asset Sources

- `createSanityMediaLibraryFileSource` - Create a file asset source using Sanity Media Library
- `createSanityMediaLibraryImageSource` - Create an image asset source using Sanity Media Library

## Usage

### Defining a Studio Configuration

```ts
import {defineConfig} from 'sanity'

export default defineConfig({
  projectId: 'your-project-id',
  dataset: 'production',
  schema: {
    types: [/* your schema types */],
  },
  plugins: [/* your plugins */],
})
```

### Creating a Plugin

```ts
import {definePlugin} from 'sanity'

export const myPlugin = definePlugin<{optionalSetting?: boolean}>((options) => ({
  name: 'my-plugin',
  // Plugin configuration...
}))

// Usage in config:
defineConfig({
  plugins: [myPlugin({optionalSetting: true})],
})
```

## Internal Dependencies

- `../form/studio/assetSourceMediaLibrary` - Asset source implementations
- `../util` - Utility functions

## Architecture

The configuration system follows a layered resolution approach:

1. User config is defined via `defineConfig`
2. Plugins are defined via `definePlugin` and added to the config
3. `flattenConfig` merges all plugin configs recursively
4. `resolveConfig` produces the final resolved configuration
5. Config property reducers merge arrays/objects from multiple sources
