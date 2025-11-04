/* eslint-disable @typescript-eslint/no-require-imports */
/* oxlint-disable import/no-unassigned-import */
const {register} = require('esbuild-register/dist/node')

register({
  target: `node${process.version.slice(1)}`,
  jsx: 'automatic',
  // Force CJS output since sanity/package.json has "type": "module"
  format: 'cjs',

  /**
   * Set 'dynamic-import': false to force esbuild to transpile dynamic import() calls
   * to require() calls. When set to true, esbuild preserves dynamic imports, causing
   * Node.js to try resolving them natively, which fails for .ts files since Node.js
   * can't find TypeScript files. By transpiling to require(), esbuild-register can
   * properly handle the module resolution for TypeScript files during development.
   */
  supported: {'dynamic-import': false},
})

// oxlint-disable-next-line no-console
console.warn('\n️ⓘ Running local Sanity CLI from source\n')

// Define the global `__DEV__` flag which is used to
// - determine when to use `esbuild-register` in the Sanity development server
// - determine when to use `esbuild-register` in the Sanity CLI
// - exclude development-only code from the production build
global.__DEV__ = true

require('../src/run')
