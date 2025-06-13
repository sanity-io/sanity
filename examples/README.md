# Sanity Functions Examples

This directory contains examples of Sanity Functions that you can use with your Sanity project.

## Setup

To work with these examples, you need to install the dependencies:

```bash
cd examples/functions
pnpm install
```

## Testing Functions Locally

You can test functions locally using the Sanity CLI:

```bash
# Test a function with sample data
pnpx sanity functions test auto-tag --file auto-tag/document.json
```

## Troubleshooting

### Bundling Errors

If you encounter errors like:

```
Error: Bundling of function failed: [vite]: Rollup failed to resolve import "@sanity/functions" from "/path/to/function/index.ts"
```

Make sure you:

1. Have installed dependencies in the examples/functions directory:
   ```bash
   pnpm add @sanity/functions @sanity/client
   ```

2. Have a `vite.config.js` file that externalizes these dependencies:
   ```js
   import { defineConfig } from 'vite';

   export default defineConfig({
     build: {
       rollupOptions: {
         external: ['@sanity/functions', '@sanity/client']
       }
     }
   });
   ```

## Structure

This directory uses a flat structure where each subdirectory is a standalone function:

```
examples/functions/
├── auto-tag/              # Auto-tagging function
│   ├── document.json      # Test document
│   ├── index.ts           # Function implementation
│   ├── package.json       # Function configuration
│   └── README.md          # Function documentation
├── package.json           # Root dependencies
├── README.md              # This file
├── sanity.blueprint.ts    # Blueprint configuration
└── vite.config.js         # Build configuration
```

The `sanity.blueprint.ts` file automatically discovers all function directories and configures them based on their `package.json` files.

## Available Examples

- [auto-tag](./auto-tag/README.md) - Automatically generates tags for blog posts using AI