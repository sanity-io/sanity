# Sanity Studio Vite Plugin

This plugin allows you to serve Sanity Studio using standard Vite tooling.

## Usage

```typescript
// vite.config.ts
import {defineConfig} from 'vite'
import {sanityStudioPlugin} from 'sanity/vite'

export default defineConfig({
  plugins: [
    sanityStudioPlugin({
      // Optional: Path to sanity.config.ts (auto-discovered if omitted)
      // configPath: './sanity.config.ts',
      // Optional: Base path for the studio (default: '/')
      // basePath: '/studio',
      // Optional: Enable React strict mode (default: true)
      // reactStrictMode: true,
      // Optional: Enable schema extraction during dev
      // schemaExtraction: true,
    }),
  ],
})
```

## Options

| Option             | Type                | Default         | Description                       |
| ------------------ | ------------------- | --------------- | --------------------------------- |
| `configPath`       | `string`            | auto-discovered | Path to sanity.config.ts          |
| `basePath`         | `string`            | `'/'`           | Base path where Studio is mounted |
| `reactStrictMode`  | `boolean`           | `true`          | Enable React strict mode          |
| `schemaExtraction` | `boolean \| object` | `false`         | Enable schema extraction          |

## How It Works

The plugin:

1. **Auto-discovers** your `sanity.config.ts` file
2. **Generates virtual modules** for the entry point and HTML template
3. **Serves the Studio** at the configured base path
4. **Handles HMR** through Vite's built-in capabilities
5. **Builds optimized bundles** for production

## Running with Vite

```bash
# Development
npx vite

# Production build
npx vite build
```

## Integration with Existing Apps

Mount the Studio at a subpath to run alongside your main app:

```typescript
sanityStudioPlugin({
  basePath: '/studio',
})
```

This serves the Studio at `/studio` while leaving other routes for your app.
