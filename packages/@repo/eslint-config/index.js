// @ts-check
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import js from '@eslint/js'
import {defineConfig, globalIgnores} from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import sanityImport from 'eslint-config-sanity/import.js'
import sanityRecommended from 'eslint-config-sanity/index.js'
import sanityReact from 'eslint-config-sanity/react.js'
import sanityTypescript from 'eslint-config-sanity/typescript.js'
import turboConfig from 'eslint-config-turbo/flat'
import {createTypeScriptImportResolver} from 'eslint-import-resolver-typescript'
import * as importPlugin from 'eslint-plugin-import'
import oxlint from 'eslint-plugin-oxlint'
import pluginReact from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactHooksWithUseEffectEvent from 'eslint-plugin-react-hooks-with-use-effect-event'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import tsdocPlugin from 'eslint-plugin-tsdoc'
import unicorn from 'eslint-plugin-unicorn'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import tsLint from 'typescript-eslint'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootOxlintrc = resolve(__dirname, '../../../.oxlintrc.json')

const ignores = [
  '**/etc/*',
  '**/.sanity/*',
  '**/.cache/*',
  '**/public/*',
  '**/build/*',
  '**/.next/*',
  '**/static/*',
  '**/coverage/*',
  '**/lib/*',
  '**/node_modules/*',
  '**/report/trace/*',
  '**/playwright-ct/report/*',
  '**/dist/*',
  '**/*.json',
  '**/*.css',
  '**/*.snap',
  '**/*.md',
]

const extensions = ['.cjs', '.mjs', '.js', '.jsx', '.ts', '.tsx', '.mts']

export default [
  globalIgnores(ignores),
  defineConfig({
    name: 'language-options+globals+react-settings',
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.browser,
        ...globals.es2017,
        ...globals.node,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
      reportUnusedInlineConfigs: 'error',
    },
    settings: {react: {version: '19'}},
  }),
  {
    name: '@eslint/js/recommended',
    ...js.configs.recommended,
  },
  {
    name: 'eslint-plugin-import/typescript',
    ...importPlugin.flatConfigs?.typescript,
  },
  tsLint.configs.eslintRecommended,
  {
    name: 'react/recommended',
    ...pluginReact.configs.flat.recommended,
  },
  // @ts-expect-error - configs is not typed but exists, and it enables React Compiler linter checks
  ...reactHooks.configs['flat/recommended'],
  {
    name: 'sanity/recommended',
    // Equivalent to `extends: ['sanity', 'sanity/react', 'sanity/import', 'sanity/typescript']` in ESLint 8
    plugins: {
      'simple-import-sort': simpleImportSort,
      'tsdoc': tsdocPlugin,
      'unused-imports': unusedImports,
      'unicorn': unicorn,
    },
    rules: {
      ...sanityRecommended.rules,
      ...sanityReact.rules,
      ...sanityImport.rules,
      ...sanityTypescript.rules,
      '@typescript-eslint/no-var-requires': 'off', // prefer import/no-dynamic-require
      'import/extensions': ['error', {pattern: {cjs: 'always', json: 'always'}}],
      'import/named': 'off',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-unresolved': 'off',
      'import/default': 'off',
      'tsdoc/syntax': 'error',
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-explicit-any': ['warn'],
      '@typescript-eslint/no-dupe-class-members': ['error'],
      '@typescript-eslint/no-shadow': ['error'],
      '@typescript-eslint/no-unused-vars': ['warn'],
      '@typescript-eslint/consistent-type-imports': ['error', {prefer: 'type-imports'}],
      'unused-imports/no-unused-imports': 'error',
      // 'unused-imports/no-unused-vars': ['warn'], // this rule creates noise, oxlint handles unused vars
      'import/no-duplicates': ['error', {'prefer-inline': true}],
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/consistent-type-specifier-style': ['error', 'prefer-inline'],
      'import/order': 'off', // handled by simple-import-sort
      'sort-imports': 'off', // handled by simple-import-sort
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'no-undef': 'off',
      'no-dupe-class-members': 'off', // doesn't work with TS overrides
      'no-shadow': 'off',
      'no-unused-vars': 'off',
      'no-useless-catch': 'warn',
      'no-nested-ternary': 'off',
      'no-async-promise-executor': 'warn',
      'unicorn/prefer-string-slice': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-keyboard-event-key': 'error',
      'unicorn/custom-error-definition': 'error',
      'no-warning-comments': 'off',
      'react/jsx-sort-props': [
        'error',
        {
          // The JSX transform might use `React.createElement` instead of the jsx runtime if the order of `key` is wrong: https://github.com/facebook/react/issues/20031#issuecomment-710346866
          reservedFirst: ['key'],
          // While alphabetical sorting usually makes the code more readable, it's tricky to enable it while PRs are in-flight as it creates a very large diff.
          // Thus for now it's disabled.
          noSortAlphabetically: true,
        },
      ],
      // Since we use React Compiler we don't need to warn about arrow functions
      'react/jsx-no-bind': 'off',
    },
    settings: {
      'import/extensions': extensions,
      'import/parsers': {
        '@typescript-eslint/parser': extensions,
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: [
            'dev/*/tsconfig.json',
            'examples/*/tsconfig.json',
            'packages/@repo/*/tsconfig.json',
            'packages/@sanity/*/tsconfig.json',
            'packages/*/tsconfig.json',
          ],
        },
      },
      'import/resolver-next': [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          extensions,
          project: [
            'dev/*/tsconfig.json',
            'examples/*/tsconfig.json',
            'packages/@repo/*/tsconfig.json',
            'packages/@sanity/*/tsconfig.json',
            'packages/*/tsconfig.json',
          ],
        }),
      ],
    },
  },
  ...tsLint.configs.recommended,
  {
    name: 'react/jsx-runtime',
    ...pluginReact.configs.flat['jsx-runtime'],
  },
  ...turboConfig,
  // Disables rules that are handled by prettier, we run prettier separately as running it within ESLint is too slow
  eslintConfigPrettier,
  // oxlint should be the last one so it is able to turn off rules that it's handling
  ...oxlint.buildFromOxlintConfigFile(rootOxlintrc),
  {
    // Since we use useEffectEvent, we can't use the oxlint checker for this rule, we must use the ESLint variant.
    // We're using eslint-plugin-react-hooks@rc, which runs React Compiler checks which matches our babel-plugin-react-compiler@rc setup.
    // However, we're also using the experimental useEffectEvent API using the use-effect-event package, which requires eslint-plugin-react-hooks@experimental (https://react.dev/reference/react/experimental_useEffectEvent).
    // To make all this work we disable the exhaustive-deps rule from the rc react-hooks plugin and enable it with the experimental react-hooks plugin.
    name: 'react-hooks/exhaustive-deps/useEffectEvent',
    plugins: {
      'react-hooks-with-use-effect-event': reactHooksWithUseEffectEvent,
    },
    rules: {
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks-with-use-effect-event/exhaustive-deps': 'error',
    },
  },
  {
    // React Compiler RC3 added a lot of new checks, it'll take a while to fix all of them so we'll change them from error to warn in the mean time
    name: 'react-hooks/react-compiler/temp-disable',
    rules: {
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
    },
  },
  {
    // Don't fail React Compiler rules on test code, warn instead (as it might be an opportunity to delete manual useMemo and such from tests)
    name: 'sanity/no-react-compiler-on-test-code',
    files: [
      `**/*/test/**/*`,
      `**/*/__workshop__/**/*`,
      '**/*/__tests__/**/*',
      '**/*.test.{js,ts,tsx}',
      '**/playwright-ct/**',
    ],
    rules: {
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
    },
  },
  // Since we also use no-restricted-imports in oxlint, we need to add this after `buildFromOxlintConfigFile` or the rule is disabled
  {
    files: ['test/e2e/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              importNames: ['test', 'default'],
              message: 'Please use named imports, e.g. `import {test} from "studio-test"` instead.',
            },
          ],
        },
      ],
    },
  },
]
