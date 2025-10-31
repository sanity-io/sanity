// oxlint-disable-next-line no-unassigned-import
const tsx = require('tsx/cjs/api')

// oxlint-disable-next-line no-console
console.log('\n️ⓘ Running local Sanity CLI from source\n')

// Define the global `__DEV__` flag which is used to
// - determine when to use `esbuild-register` in the Sanity development server
// - determine when to use `esbuild-register` in the Sanity CLI
// - exclude development-only code from the production build
global.__DEV__ = true

tsx.require('../src/run', __filename)
