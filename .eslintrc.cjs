'use strict'

const baseConfig = {
  env: {
    node: true,
    browser: true,
  },
  extends: [
    'sanity',
    'sanity/react',
    'sanity/import',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['import', '@typescript-eslint', 'prettier', 'react', 'tsdoc'],
  rules: {
    '@typescript-eslint/no-var-requires': 'off', // prefer import/no-dynamic-require
    'import/extensions': ['error', {pattern: {cjs: 'always', json: 'always'}}],
    'prettier/prettier': 'error',
    'react/jsx-filename-extension': ['error', {extensions: ['.jsx']}],
    'sort-imports': 'off', // prefer import/order
    'tsdoc/syntax': 'error',
  },
  settings: {
    'import/extensions': ['.cjs', '.mjs', '.js', '.jsx', '.ts', '.tsx'],
    react: {version: '18.0.0'},
  },
}

module.exports = {
  ...baseConfig,

  overrides: [
    // TypeScript files
    {
      files: ['*.{ts,tsx}'],
      extends: [
        'sanity',
        'sanity/react',
        'sanity/import',
        'sanity/typescript',
        'plugin:@typescript-eslint/recommended',
        'plugin:react-hooks/recommended',
        'prettier',
      ],
      plugins: ['import', '@typescript-eslint', 'prettier', 'react', 'tsdoc'],
      rules: {
        ...baseConfig.rules,
        '@typescript-eslint/no-dupe-class-members': ['error'],
        '@typescript-eslint/no-shadow': ['error'],
        '@typescript-eslint/no-unused-vars': ['warn'],
        'import/named': 'off',
        'import/no-named-as-default': 'off',
        'import/no-named-as-default-member': 'off',
        'import/no-unresolved': 'off',
        'no-undef': 'off',
        'no-dupe-class-members': 'off', // doesn't work with TS overrides
        'no-shadow': 'off',
        'no-unused-vars': 'off',
        'react/jsx-filename-extension': ['error', {extensions: ['.tsx']}],
      },
      settings: {
        ...baseConfig.settings,
        'import/parsers': {
          '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
        'import/resolver': {
          typescript: {
            alwaysTryTypes: true,
            project: [
              'dev/*/tsconfig.json',
              'examples/*/tsconfig.json',
              'packages/@sanity/*/tsconfig.json',
              'packages/*/tsconfig.json',
            ],
          },
        },
      },
    },

    // CommonJS files
    {
      files: ['*.cjs'],
      parserOptions: {
        sourceType: 'script',
      },
      rules: {
        ...baseConfig.rules,
        strict: ['error', 'global'],
      },
    },

    // Test files
    {
      files: ['./test/**/*.js', './test/*.js', '*.test.{js,ts,tsx}'],
      env: {jest: true},
    },
  ],

  root: true,
}
