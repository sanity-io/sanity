#!/usr/bin/env node --experimental-loader esbuild-register/loader

'use strict'

require('esbuild-register/dist/node').register({
  target: `node${process.version.slice(1)}`,
})

// Define the global `__DEV__` flag which is used to
// - determine when to use `esbuild-register` in the Sanity development server
// - determine when to use `esbuild-register` in the Sanity CLI
// - exclude development-only code from the production build
global.__DEV__ = true

// eslint-disable-next-line import/no-unassigned-import
require('../../packages/@sanity/cli/src/run')
