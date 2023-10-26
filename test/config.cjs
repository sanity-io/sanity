'use strict'

/* eslint-disable tsdoc/syntax */

const path = require('path')
const {escapeRegExp, omit} = require('lodash')
const devAliases = require('../dev/aliases.cjs')

/** Regex for matching file extensions. */
const RE_EXT = /\.[0-9a-z]+$/i

/** Path to the root of the Sanity monorepo. */
const ROOT_PATH = path.resolve(__dirname, '..')

/** The default module name mapper (aka. aliases) for jest tests in the Sanity monorepo. */
const defaultModuleNameMapper = resolveAliasPaths({
  ...aliasesToModuleNameWrapper(devAliases),
  '.*\\.module\\.css$': './test/mocks/emptyObject',
  '.*\\.css$': './test/mocks/undefined',
})

/**
 * @returns {import('@jest/types').Config.InitialOptions}
 */
exports.createJestConfig = function createJestConfig(
  /** @type {import('@jest/types').Config.InitialOptions */
  config = {},
) {
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
    resolver: path.resolve(__dirname, './resolver.cjs'),
    testEnvironment: path.resolve(__dirname, './jsdom.jest.env.ts'),
    setupFiles: [...setupFiles, path.resolve(__dirname, './setup.ts')],
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
        // rootMode upwards makes use of the global babel.config.js
        {rootMode: 'upward'},
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
