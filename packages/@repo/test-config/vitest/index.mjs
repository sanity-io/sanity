import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import * as vitest from 'vitest/config'
import {configDefaults} from 'vitest/config'

/**
 *
 * @param [config] {vitest.UserConfig}
 * @return {vitest.UserConfig}
 */
export function defineConfig(config) {
  return vitest.defineConfig({
    ...config,
    test: {
      ...config?.test,
      // oxlint-disable-next-line no-misused-spread
      alias: {...config?.test?.alias, ...getViteAliases()},
      typecheck: {
        ...config?.test?.typecheck,
        exclude: [
          ...(configDefaults.typecheck?.exclude || []),
          '.tmp/**',
          './lib/**',
          ...(config?.test?.typecheck?.exclude || []),
        ],
      },
      exclude: [...configDefaults.exclude, '.tmp/**', './lib/**', ...(config?.test?.exclude || [])],
    },
  })
}

// @TODO we should refactor our test setup to no longer need resolve.alias to be setup
const devAliases = {
  // NOTE: do not use regex in the module expressions,
  // because they will be escaped by the jest config
  '@sanity/diff': '@sanity/diff/src',
  '@sanity/cli': '@sanity/cli/src',
  '@sanity/mutator': '@sanity/mutator/src',
  '@sanity/schema': '@sanity/schema/src/_exports',
  '@sanity/types': '@sanity/types/src',
  '@sanity/util': '@sanity/util/src/_exports',
  '@sanity/vision': '@sanity/vision/src',
  'sanity': 'sanity/src/_exports',
  'groq': 'groq/src/_exports.mts',
}

const PACKAGES_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
function getViteAliases() {
  return Object.fromEntries(
    Object.entries(devAliases).map(([packageName, aliasPath]) => [
      packageName,
      resolve(PACKAGES_PATH, aliasPath),
    ]),
  )
}
