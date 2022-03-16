const path = require('path')
const {escapeRegExp, omit} = require('lodash')
const devAliases = require('../dev/aliases')

const ROOT_PATH = path.resolve(__dirname, '..')

const jestModuleAliases = {
  '@sanity/bifur-client': './test/mocks/mockBifurClient',
  'part:@sanity/base/schema': './test/mocks/mockSchema',
  'part:@sanity/base/client': './test/mocks/mockClient',
  'part:@sanity/base/initial-value-templates?': './test/mocks/emptyArray',
  'config:sanity': './dev/test-studio/sanity.json',
  'sanity:css-custom-properties': './test/mocks/emptyObject',
  'sanity:versions': './test/mocks/mockVersions',
}

// note: these can contain regex for matching
const regexMapper = {
  '^part:@sanity.*-style$': './test/mocks/emptyObject',
  '.*\\.css$': './test/mocks/emptyObject',
  '^all:.*$': './test/mocks/emptyArray',
  '^config:.*$': './test/mocks/undefined',
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

// note: this is a somewhat naive way to resolve parts.
// there are a few cases that won't work.
const partsAliases = Object.fromEntries(
  partPackages.flatMap((i) => {
    const packagePath = path.resolve(ROOT_PATH, `./packages/@sanity/${i}`)
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

// note: these have to be mocked on an individual file level because using
// `jest.mock` on them will replace the target file (and the the source import).
// with this, it's possible for a mock implementation to override multiple other
// optional parts
const optionalParts = {
  '^part:@sanity/form-builder/input/image/asset-sources\\?$':
    './test/mocks/optionalParts/formBuilderInputImageAssetSources',
  '^part:@sanity/base/initial-value-templates\\?$':
    './test/mocks/optionalParts/baseInitialValueTemplates',
  '^part:@sanity/form-builder/input/legacy-date/schema\\?$':
    './test/mocks/optionalParts/formBuilderInputLegacyDateSchema',
  '^part:@sanity/base/preview-resolver\\?$': './test/mocks/optionalParts/basePreviewResolver',
  '^part:@sanity/dashboard/config\\?$': './test/mocks/optionalParts/dashboardConfig',
  '^part:@sanity/base/login-wrapper\\?$': './test/mocks/optionalParts/baseLoginWrapper',
  '^part:@sanity/desk-tool/structure\\?$': './test/mocks/optionalParts/deskToolStructure',
  '^part:@sanity/base/brand-logo\\?$': './test/mocks/optionalParts/baseBrandLogo',
  '^part:@sanity/form-builder/input/boolean\\?$':
    './test/mocks/optionalParts/formBuilderInputBoolean',
  '^part:@sanity/form-builder/input/datetime\\?$':
    './test/mocks/optionalParts/formBuilderInputDatetime',
  '^part:@sanity/form-builder/input/email\\?$': './test/mocks/optionalParts/formBuilderInputEmail',
  '^part:@sanity/form-builder/input/geopoint\\?$':
    './test/mocks/optionalParts/formBuilderInputGeopoint',
  '^part:@sanity/form-builder/input/number\\?$':
    './test/mocks/optionalParts/formBuilderInputNumber',
  '^part:@sanity/form-builder/input/object\\?$':
    './test/mocks/optionalParts/formBuilderInputObject',
  '^part:@sanity/form-builder/input/reference\\?$':
    './test/mocks/optionalParts/formBuilderInputReference',
  '^part:@sanity/form-builder/input/string\\?$':
    './test/mocks/optionalParts/formBuilderInputString',
  '^part:@sanity/form-builder/input/text\\?$': './test/mocks/optionalParts/formBuilderInputText',
  '^part:@sanity/form-builder/input/url\\?$': './test/mocks/optionalParts/formBuilderInputUrl',
  '^part:@sanity/form-builder/input/file/asset-sources\\?$':
    './test/mocks/optionalParts/formBuilderInputFileAssetSources',
  '^part:@sanity/default-layout/studio-hints-config\\?$':
    './test/mocks/optionalParts/defaultLayoutStudioHintsConfig',
  '^part:@sanity/base/schema\\?$': './test/mocks/optionalParts/baseSchema',
  '^part:@sanity/base/configure-client\\?$': './test/mocks/optionalParts/baseConfigureClient',
  '^part:@sanity/components/dialogs/fullscreen-message\\?$':
    './test/mocks/optionalParts/componentsDialogsFullscreenMessage',
  '^part:@sanity/default-layout/sidecar\\?$': './test/mocks/optionalParts/defaultLayoutSidecar',
  '^part:@sanity/base/new-document-structure\\?$':
    './test/mocks/optionalParts/baseNewDocumentStructure',
  '^part:@sanity/transitional/production-preview/resolve-production-url\\?$':
    './test/mocks/optionalParts/transitionalProductionPreviewResolveProductionUrl',
  '^part:@sanity/base/client\\?$': './test/mocks/optionalParts/baseClient',
  '^part:@sanity/base/preview\\?$': './test/mocks/optionalParts/basePreview',
  '^part:@sanity/form-builder/input-resolver\\?$':
    './test/mocks/optionalParts/formBuilderInputResolver',
  '^part:@sanity/desk-tool/filter-fields-fn\\?$':
    './test/mocks/optionalParts/deskToolFilterFieldsFn',
  '^part:@sanity/desk-tool/language-select-component\\?$':
    './test/mocks/optionalParts/deskToolLanguageSelectComponent',
}

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
    ...optionalParts,

    // > The order in which the mappings are defined matters. Patterns are
    // > checked one by one until one fits. The most specific rule should be
    // > listed first. This is true for arrays of module names as well.
    // https://jestjs.io/docs/configuration#modulenamemapper-objectstring-string--arraystring
    //
    // See the note below in `moduleNameMapper` about ordering

    ...jestifyAliases({
      // note: this spread technique follows the same technique as the
      // `moduleNameMapper` below

      // jest-specific module aliases first
      ...jestModuleAliases,

      // then match modules from webpack compatible aliases
      ...omit(devAliases, Object.keys(jestModuleAliases)),
    }),

    // then generic parts mapper
    ...regexMapper,

    // then specific parts implementations
    ...partsAliases,
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
