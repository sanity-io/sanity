/* eslint-disable tsdoc/syntax */

import devAliases from '@repo/dev-aliases'

import path from 'node:path'
import {escapeRegExp, omit} from 'lodash-es'
import {resolveDirName} from './resolveDirName.mjs'

const dirname = resolveDirName(import.meta.url)

/** Regex for matching file extensions. */
const RE_EXT = /\.[0-9a-z]+$/i

/** Path to the root of the Sanity monorepo. */
const ROOT_PATH = path.resolve(dirname, '..', '..', '..', '..')

const jestAliases = Object.fromEntries(
  Object.entries(devAliases).map(([packageName, aliasPath]) => [
    packageName,
    path.join('./packages', aliasPath),
  ]),
)

/** The default module name mapper (aka. aliases) for jest tests in the Sanity monorepo. */
const defaultModuleNameMapper = resolveAliasPaths({
  ...aliasesToModuleNameWrapper(jestAliases),
  '.*\\.module\\.css$': './test/mocks/emptyObject',
  '.*\\.css$': './test/mocks/undefined',
})

/**
 * Creates a Jest configuration object.
 *
 * @param {import('jest').Config} config - Initial Jest configuration options.
 * @returns {import('jest').Config} The resulting Jest configuration options.
 */
export function createJestConfig(config = {}) {
  const {
    testMatch = [],
    setupFiles = [],
    globals = {},
    moduleNameMapper = {},
    modulePathIgnorePatterns = [],
    transform = {},
    ...restOfInputConfig
  } = config

  return {
    globals,
    prettierPath: null,
    moduleNameMapper: {
      // > The order in which the mappings are defined matters. Patterns are checked one by one
      // > until one fits. The most specific rule should be listed first. This is true for arrays of
      // > module names as well.
      // https://jestjs.io/docs/configuration#modulenamemapper-objectstring-string--arraystring
      //
      // NOTE: The ordering for this allows overrides from an incoming project configuration.
      // The reason `defaultModuleNameMapper` come last (because the last key in a spread takes
      // precedence) however in this case, because the order of the keys matter, we leave the
      // incoming moduleNameMapper first, then omit duplicate keys from the `defaultModuleNameMapper`
      //
      ...moduleNameMapper,
      ...omit(defaultModuleNameMapper, Object.keys(moduleNameMapper)),
    },
    modulePathIgnorePatterns: [
      ...modulePathIgnorePatterns,
      '<rootDir>/bin/',
      '<rootDir>/coverage/',
      '<rootDir>/lib/',
    ],
    resolver: path.resolve(dirname, './resolver.cjs'),
    testEnvironment: path.resolve(dirname, './jsdom.jest.env.ts'),
    setupFiles: [...setupFiles, path.resolve(dirname, './setup.ts')],
    // testEnvironment: 'jsdom',
    testEnvironmentOptions: {
      url: 'http://localhost:3333',
    },
    testMatch: [...testMatch, '<rootDir>/**/*.{test,spec}.{js,ts,tsx}'],
    transformIgnorePatterns: ['/node_modules/(?!(get-random-values-esm)/)'],
    testPathIgnorePatterns: ['/node_modules/', '/.yalc/'],
    transform: {
      ...transform,
      '\\.[jt]sx?$': [
        'babel-jest',
        {
          // Don't look for babel.config.{ts,js,json} files or .babelrc files
          configFile: false,
          babelrc: false,
          // The rest is only needed by Jest, if Jest is updated to no longer need babel then this can be removed as well as related dependencies
          presets: [
            [
              '@babel/preset-env',
              {
                targets: {
                  node: '18',
                  safari: '16',
                  chrome: '110',
                  firefox: '110',
                  edge: '110',
                },
              },
            ],
            '@babel/preset-typescript',
            ['@babel/preset-react', {runtime: 'automatic'}],
          ],
        },
      ],
    },
    snapshotFormat: {
      escapeString: true,
      printBasicPrototype: true,
    },
    ...restOfInputConfig,
  }
}

/**
 * Converts aliases to a module name mapper for jest.
 *
 * @returns Record<string, string>
 */
function aliasesToModuleNameWrapper(
  /** @type Record<string, string | string[]> */
  aliases,
) {
  /** @type Record<string, string | string[]> */
  const moduleNameMapper = {}

  for (const [aliasPattern, aliasPath] of Object.entries(aliases)) {
    if (RE_EXT.exec(aliasPath)) {
      moduleNameMapper[`^${escapeRegExp(aliasPattern)}$`] = aliasPath
    } else {
      moduleNameMapper[`^${escapeRegExp(aliasPattern)}$`] = aliasPath
      moduleNameMapper[`^${escapeRegExp(aliasPattern)}/(.*)$`] = `${aliasPath}/$1`
    }
  }

  return moduleNameMapper
}

function resolveAliasPaths(
  /** @type Record<string, string> */
  aliases,
) {
  const result = {}

  for (const [aliasPattern, aliasPath] of Object.entries(aliases)) {
    result[aliasPattern] = path.resolve(ROOT_PATH, aliasPath)
  }

  return result
}
