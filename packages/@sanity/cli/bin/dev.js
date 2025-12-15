import {createRequire} from 'node:module'

const require = createRequire(import.meta.url)

/* eslint-disable @typescript-eslint/no-require-imports */
// oxlint-disable no-unassigned-import
console.warn('\n️ⓘ Running local Sanity CLI from source\n')

// Define the global `__DEV__` flag which is used to
// - determine when to use `esbuild-register` in the Sanity development server
// - determine when to use `esbuild-register` in the Sanity CLI
// - exclude development-only code from the production build
global.__DEV__ = true

// eslint-disable-next-line import/extensions
require('../src/run.ts')
