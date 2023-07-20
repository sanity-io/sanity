'use strict'

/* eslint-disable tsdoc/syntax */

/**
 * The path mappings/aliases used by various tools in the monorepo to map imported modules to
 * source files in order to speed up rebuilding and avoid having a separate watcher process to build
 * from `src` to `lib`.
 *
 * This file is currently read by:
 * - Vite when running the dev server (only when running in this monorepo)
 * - jest when running test suite
 *
 * @type Record<string, string>
 */
const devAliases = {
  // NOTE: do not use regex in the module expressions,
  // because they will be escaped by the jest config
  '@sanity/block-tools': './packages/@sanity/block-tools/src',
  '@sanity/diff': './packages/@sanity/diff/src',
  '@sanity/mutator': './packages/@sanity/mutator/src',
  '@sanity/portable-text-editor': './packages/@sanity/portable-text-editor/src',
  '@sanity/schema': './packages/@sanity/schema/src/_exports',
  '@sanity/types': './packages/@sanity/types/src',
  '@sanity/types/parts': './packages/@sanity/types/parts',
  '@sanity/util/fs': './packages/@sanity/util/src/fsTools.ts',
  '@sanity/util': './packages/@sanity/util/src',
  '@sanity/vision': './packages/@sanity/vision/src',
  sanity: './packages/sanity/exports',
}

module.exports = devAliases
