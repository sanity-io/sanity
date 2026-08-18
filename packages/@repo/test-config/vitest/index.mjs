import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import * as vitest from 'vitest/config'
import {configDefaults} from 'vitest/config'

// Node 25+ enables the Web Storage API by default, shadowing the `localStorage`
// global provided by jsdom (vitest's `populateGlobal` skips keys that already
// exist on the worker's global). Disable Node's native Web Storage so jsdom's
// implementation is used. The flag is a no-op on Node versions where Web
// Storage isn't enabled. See https://github.com/vitest-dev/vitest/issues/8757.
// Use the canonical `--no-experimental-webstorage` alias since the shorter
// `--no-webstorage` only exists on Node 26+.
const workerExecArgv = ['--no-experimental-webstorage']

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
      // Pin the locale so date/number formatting is deterministic regardless of the developer's OS
      // locale (en-CA renders dates as 2023-10-10, en-US as 10/10/2023), matching the fixed TZ. ICU
      // resolves its default locale once at worker startup and ignores later changes, so it must be
      // set via env; the forks pool spawns workers with this env so ICU picks it up.
      env: {LC_ALL: 'en_US.UTF-8', LANG: 'en_US.UTF-8', ...config?.test?.env},
      // Disable console interception to prevent `EnvironmentTeardownError: Closing rpc while
      // "onUserConsoleLog" was pending` when async emissions (e.g. RxJS catchError logs) fire
      // after a test's body resolves but before the worker finishes teardown. Tradeoff:
      // console output goes directly to stdout/stderr instead of through the vitest reporter.
      disableConsoleIntercept: config?.test?.disableConsoleIntercept ?? true,
      alias: {...config?.test?.alias, ...getViteAliases()},
      execArgv: [...workerExecArgv, ...(config?.test?.execArgv ?? [])],
      experimental: {
        // Print the slowest imports after test runs, to keep the cost of heavy
        // import graphs (e.g. barrel files) visible in CI and local runs.
        importDurations: {
          limit: 10,
          print: true,
        },
        ...config?.test?.experimental,
      },
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
