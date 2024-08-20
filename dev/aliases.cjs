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
  '@sanity/cli': './packages/@sanity/cli/src',
  '@sanity/mutator': './packages/@sanity/mutator/src',
  '@sanity/schema': './packages/@sanity/schema/src/_exports',
  '@sanity/migrate': './packages/@sanity/migrate/src/_exports',
  '@sanity/types': './packages/@sanity/types/src',
  '@sanity/util': './packages/@sanity/util/src/_exports',
  '@sanity/vision': './packages/@sanity/vision/src',
  'sanity': './packages/sanity/src/_exports',
  'groq': './packages/groq/src/_exports.mts',
}

module.exports = devAliases
