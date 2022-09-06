/* eslint-disable tsdoc/syntax */

const path = require('path')
const {escapeRegExp, omit} = require('lodash')
const devAliases = require('../dev/aliases')

const ROOT_PATH = path.resolve(__dirname, '..')

// note: these can contain regex for matching
const moduleNameRegexMapper = {
  '.*\\.css$': './test/mocks/emptyObject',
}

/**
 * Takes a list of webpack-compatible aliases and converts them into jest module
 * mappings + handles escaping regexp in paths
 * */
const jestifyAliases = (aliases) =>
  Object.entries(aliases).reduce((acc, [module, target]) => {
    acc[`^${escapeRegExp(module)}$`] = target
    acc[`^${escapeRegExp(module)}(\\/.*)$`] = `${target}$1`
    return acc
  }, {})

const resolvePaths = (obj) =>
  Object.fromEntries(
    Object.entries(obj).map(([module, relativePath]) => [
      module,
      path.resolve(ROOT_PATH, relativePath),
    ])
  )

/**
 * @param {import('@jest/types').Config.InitialOptions
 *  | (config: import('@jest/types').Config.InitialOptions) => any} inputConfig
 * @returns {import('@jest/types').Config.InitialOptions}
 */
exports.createJestConfig = function createJestConfig({
  testMatch = [],
  testPathIgnorePatterns = [],
  setupFiles = [],
  globals = {},
  moduleNameMapper: incomingModuleNameMapper = {},
  transform = {},
  ...restOfInputConfig
} = {}) {
  const defaultModuleNameMapper = resolvePaths({
    // > The order in which the mappings are defined matters. Patterns are
    // > checked one by one until one fits. The most specific rule should be
    // > listed first. This is true for arrays of module names as well.
    // https://jestjs.io/docs/configuration#modulenamemapper-objectstring-string--arraystring
    //
    // See the note below in `moduleNameMapper` about ordering

    ...jestifyAliases({
      // then match modules from webpack compatible aliases
      ...devAliases,
    }),

    // then generic module name mapper
    ...moduleNameRegexMapper,
  })

  return {
    transform: {
      ...transform,
      '\\.[jt]sx?$': [
        'babel-jest',
        // rootMode upwards makes use of the global babel.config.js
        {rootMode: 'upward'},
      ],
    },
    testMatch: [...testMatch, '<rootDir>/**/*.{test,spec}.{js,ts,tsx}'],
    testPathIgnorePatterns: [...testPathIgnorePatterns, '/(node_modules|lib|bin|coverage)/'],
    setupFiles: [...setupFiles, path.resolve(__dirname, './setup.ts')],
    testURL: 'http://localhost:3333',
    testEnvironment: 'jsdom',
    globals,
    moduleNameMapper: {
      // note: order matters!
      //
      // the ordering for this _does_ allow for overrides from an incoming
      // project configuration. it's kind of weird to see the
      // `defaultModuleNameMapper` come last (because the last key in a spread
      // takes precedence) however in this case, because the order of the keys
      // matter, we leave the incoming moduleNameMapper first, then omit
      // duplicate keys from the `defaultModuleNameMapper`
      ...incomingModuleNameMapper,
      ...omit(defaultModuleNameMapper, Object.keys(incomingModuleNameMapper)),
    },
    ...restOfInputConfig,
  }
}
