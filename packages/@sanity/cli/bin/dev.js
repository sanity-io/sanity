/* eslint-disable @typescript-eslint/no-require-imports */
/* oxlint-disable import/no-unassigned-import */
const {register} = require('esbuild-register/dist/node')

register({
  target: `node${process.version.slice(1)}`,
  supported: {'dynamic-import': true},
  jsx: 'automatic',
})

if (process.env.TEST !== 'true') {
  // oxlint-disable-next-line no-console
  console.log('\n️ⓘ Running local Sanity CLI from source\n')
}

// Define the global `__DEV__` flag which is used to
// - determine when to use `esbuild-register` in the Sanity development server
// - determine when to use `esbuild-register` in the Sanity CLI
// - exclude development-only code from the production build
global.__DEV__ = true

require('../src/run')
