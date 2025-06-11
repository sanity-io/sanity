// @ts-check
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import js from '@eslint/js'
import {defineConfig} from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier'
import sanityImport from 'eslint-config-sanity/import.js'
import sanityRecommended from 'eslint-config-sanity/index.js'
import sanityReact from 'eslint-config-sanity/react.js'
import sanityTypescript from 'eslint-config-sanity/typescript.js'
import turboConfig from 'eslint-config-turbo/flat'
import {createTypeScriptImportResolver} from 'eslint-import-resolver-typescript'
import * as importPlugin from 'eslint-plugin-import'
import oxlint from 'eslint-plugin-oxlint'
import pluginReact from 'eslint-plugin-react'
import reactCompiler from 'eslint-plugin-react-compiler'
import * as reactHooks from 'eslint-plugin-react-hooks'
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
  '**/dist/*',
  '*.json',
  '*.css',
  '*.snap',
  '*.md',
]

const extensions = ['.cjs', '.mjs', '.js', '.jsx', '.ts', '.tsx', '.mts']

export default [
  defineConfig({
    ignores,
    // ^  DO NOT REMOVE THIS LINE
    //  - this is necessary for the ignores pattern to be treated as a "global ignores"
  }),
  defineConfig({
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
    settings: {react: {version: '19'}},
  }),
  js.configs.recommended,
  importPlugin.flatConfigs?.typescript,
  tsLint.configs.eslintRecommended,
  pluginReact.configs.flat.recommended,
  reactHooks.configs.recommended,
  {
    // Equivalent to `extends: ['sanity', 'sanity/react', 'sanity/import', 'sanity/typescript']` in ESLint 8
    plugins: {
      'simple-import-sort': simpleImportSort,
      'import': importPlugin,
      'tsdoc': tsdocPlugin,
      'unused-imports': unusedImports,
      'react-compiler': reactCompiler,
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
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      // Set react-compiler to `error` once existing issues are fixed
      /**
       * Once all react-compiler warnings are fixed then this rule should be changed to 'error' and:
       * - the `.eslintignore.react-compiler` file should be deleted
       * - the `.github/workflows/are-we-compiled-yet.yml` action can be deleted
       * - the `pnpm check:react-compiler` command removed
       */
      // 'react-compiler/react-compiler': 'warn',
      'react-compiler/react-compiler': 'error',
      'react/no-unescaped-entities': 'off',
      // 'i18next/no-literal-string': ['error'],
      // '@sanity/i18n/no-attribute-string-literals': [
      //   'error',
      //   {
      //     ignores: {
      //       componentPatterns: ['motion$'],
      //       attributes: [
      //         'animate',
      //         'closed',
      //         'documentType',
      //         'exit',
      //         'fill',
      //         'full',
      //         'initial',
      //         'size',
      //         'sortOrder',
      //         'status',
      //         'group',
      //         'textWeight',
      //         'showChangesBy',
      //       ],
      //     },
      //   },
      // ],
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
  pluginReact.configs.flat['jsx-runtime'],
  ...turboConfig,
  // Disables rules that are handled by prettier, we run prettier separately as running it within ESLint is too slow
  eslintConfigPrettier,
  // oxlint should be the last one so it is able to turn off rules that it's handling
  ...oxlint.buildFromOxlintConfigFile(rootOxlintrc),
]
