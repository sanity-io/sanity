const path = require('path')
const {escapeRegExp, omit} = require('lodash')
const moduleAliases = require('./.module-aliases')

const jestModuleAliases = {
  '@sanity/bifur-client': './test/mockBifurClient',
  'part:@sanity/base/schema': './test/mockSchema',
  'part:@sanity/base/client': './test/mockClient',
  'part:@sanity/form-builder/input/image/asset-sources?': './test/undefined',
  'part:@sanity/base/initial-value-templates?': './test/emptyArray',
  'part:@sanity/form-builder/input/legacy-date/schema?': './test/null',
  'config:sanity': './examples/test-studio/sanity.json',
  'sanity:css-custom-properties': './test/emptyObject',
}

// note: these can contain regex for matching
const regexMapper = {
  'part:@sanity.*-style': './test/emptyObject',
  '.*\\.css': './test/emptyObject',
  'all:.*': './test/emptyArray',
  'config:.*': './test/undefined',
  'part:.*\\?': './test/undefined',
}

const partPackages = [
  'base',
  'form-builder',
  'desk-tool',
  'code-input',
  'default-login',
  'data-aspects',
]

/**
 * Takes a list of webpack-compatible aliases and converts them into jest module
 * mappings + handles escaping regexp in paths
 * */
const jestify = (aliases) =>
  Object.entries(aliases).reduce((acc, [module, target]) => {
    acc[`^${escapeRegExp(module)}$`] = target
    acc[`^${escapeRegExp(module)}(\\/.*)$`] = `${target}$1`
    return acc
  }, {})

const resolvePaths = (obj) =>
  Object.fromEntries(
    Object.entries(obj).map(([module, relativePath]) => [
      module,
      path.resolve(__dirname, relativePath),
    ])
  )

// note: this is a somewhat naive way to resolve parts.
// there are a few cases that won't work.
const partsAliases = Object.fromEntries(
  partPackages.flatMap((i) => {
    const packagePath = `./packages/@sanity/${i}`
    // eslint-disable-next-line import/no-dynamic-require
    const {parts, paths} = require(`${packagePath}/sanity.json`)

    return parts.flatMap((part) => {
      if (!part.path) return []
      if (!part.implements && !part.name) return []

      return [part.implements, part.name]
        .filter(Boolean)
        .map(escapeRegExp)
        .filter((escapedPart) => !Object.keys(jestModuleAliases).includes(escapedPart))
        .map((partName) => {
          return [`^${partName}$`, path.join(packagePath, paths.source, part.path)]
        })
    })
  })
)

/**
 * @param {import('@jest/types').Config.InitialOptions
 *  | (config: import('@jest/types').Config.InitialOptions) => any} inputConfig
 * @returns {import('@jest/types').Config.InitialOptions}
 */
function createProjectConfig({
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

    ...jestify({
      // note: this spread technique follows the same technique as the
      // `moduleNameMapper` below

      // jest-specific module aliases first
      ...jestModuleAliases,

      // then match modules from webpack compatible aliases
      ...omit(moduleAliases, Object.keys(jestModuleAliases)),
    }),

    // then generic parts mapper
    ...regexMapper,

    // then specific parts implementations
    ...partsAliases,
  })

  return {
    transform: {
      ...transform,
      '\\.[j|t]sx?$': [
        'babel-jest',
        // rootMode upwards makes use of the global babel.config.js
        {rootMode: 'upward'},
      ],
    },
    testMatch: [...testMatch, '<rootDir>/**/*.{test,spec}.{js,ts,tsx}'],
    testPathIgnorePatterns: [...testPathIgnorePatterns, '/(node_modules|lib|dist|bin|coverage)/'],
    setupFiles: [...setupFiles, require.resolve('./test/jest-setup.js')],
    testURL: 'http://localhost:3333',
    testEnvironment: 'jsdom',
    globals: {__DEV__: false, ...globals},
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

module.exports = createProjectConfig
