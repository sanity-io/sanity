const path = require('path')
const {escapeRegExp, omit} = require('lodash')
const moduleAliases = require('./.module-aliases')

const jestModuleAliases = {
  '@sanity/bifur-client': './test/mockBifurClient',
  'part:@sanity/base/schema': './test/mockSchema',
  'part:@sanity/base/client': './test/mockClient',
  'part:@sanity/base/initial-value-templates?': './test/emptyArray',
  'config:sanity': './dev/test-studio/sanity.json',
  'sanity:css-custom-properties': './test/emptyObject',
  'sanity:versions': './test/mockVersions',
}

// note: these can contain regex for matching
const regexMapper = {
  '^part:@sanity.*-style$': './test/emptyObject',
  '.*\\.css$': './test/emptyObject',
  '^all:.*$': './test/emptyArray',
  '^config:.*$': './test/undefined',
}

const partPackages = ['base', 'form-builder', 'desk-tool', 'default-login', 'data-aspects']

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

// note: these have to be mocked on an individual file level because using
// `jest.mock` on them will replace the target file (and the the source import).
// with this, it's possible for a mock implementation to override multiple other
// optional parts
const optionalParts = {
  '^part:@sanity/form-builder/input/image/asset-sources\\?$':
    './test/optionalParts/formBuilderInputImageAssetSources',
  '^part:@sanity/base/initial-value-templates\\?$':
    './test/optionalParts/baseInitialValueTemplates',
  '^part:@sanity/form-builder/input/legacy-date/schema\\?$':
    './test/optionalParts/formBuilderInputLegacyDateSchema',
  '^part:@sanity/base/preview-resolver\\?$': './test/optionalParts/basePreviewResolver',
  '^part:@sanity/dashboard/config\\?$': './test/optionalParts/dashboardConfig',
  '^part:@sanity/base/login-wrapper\\?$': './test/optionalParts/baseLoginWrapper',
  '^part:@sanity/desk-tool/structure\\?$': './test/optionalParts/deskToolStructure',
  '^part:@sanity/base/brand-logo\\?$': './test/optionalParts/baseBrandLogo',
  '^part:@sanity/form-builder/input/boolean\\?$': './test/optionalParts/formBuilderInputBoolean',
  '^part:@sanity/form-builder/input/datetime\\?$': './test/optionalParts/formBuilderInputDatetime',
  '^part:@sanity/form-builder/input/email\\?$': './test/optionalParts/formBuilderInputEmail',
  '^part:@sanity/form-builder/input/geopoint\\?$': './test/optionalParts/formBuilderInputGeopoint',
  '^part:@sanity/form-builder/input/number\\?$': './test/optionalParts/formBuilderInputNumber',
  '^part:@sanity/form-builder/input/object\\?$': './test/optionalParts/formBuilderInputObject',
  '^part:@sanity/form-builder/input/reference\\?$':
    './test/optionalParts/formBuilderInputReference',
  '^part:@sanity/form-builder/input/string\\?$': './test/optionalParts/formBuilderInputString',
  '^part:@sanity/form-builder/input/text\\?$': './test/optionalParts/formBuilderInputText',
  '^part:@sanity/form-builder/input/url\\?$': './test/optionalParts/formBuilderInputUrl',
  '^part:@sanity/form-builder/input/file/asset-sources\\?$':
    './test/optionalParts/formBuilderInputFileAssetSources',
  '^part:@sanity/default-layout/studio-hints-config\\?$':
    './test/optionalParts/defaultLayoutStudioHintsConfig',
  '^part:@sanity/base/schema\\?$': './test/optionalParts/baseSchema',
  '^part:@sanity/base/configure-client\\?$': './test/optionalParts/baseConfigureClient',
  '^part:@sanity/components/dialogs/fullscreen-message\\?$':
    './test/optionalParts/componentsDialogsFullscreenMessage',
  '^part:@sanity/default-layout/sidecar\\?$': './test/optionalParts/defaultLayoutSidecar',
  '^part:@sanity/base/new-document-structure\\?$': './test/optionalParts/baseNewDocumentStructure',
  '^part:@sanity/transitional/production-preview/resolve-production-url\\?$':
    './test/optionalParts/transitionalProductionPreviewResolveProductionUrl',
  '^part:@sanity/base/client\\?$': './test/optionalParts/baseClient',
  '^part:@sanity/base/preview\\?$': './test/optionalParts/basePreview',
  '^part:@sanity/form-builder/input-resolver\\?$': './test/optionalParts/formBuilderInputResolver',
  '^part:@sanity/desk-tool/filter-fields-fn\\?$': './test/optionalParts/deskToolFilterFieldsFn',
  '^part:@sanity/desk-tool/language-select-component\\?$':
    './test/optionalParts/deskToolLanguageSelectComponent',
}

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
    ...optionalParts,

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
    setupFiles: [...setupFiles, path.resolve(__dirname, './test/jest-setup.ts')],
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
