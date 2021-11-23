module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  globals: {
    __DEV__: true,
    JSX: true,
  },
  env: {
    node: true,
    browser: true,
  },
  settings: {
    react: {version: '16.9.0'},
  },
  extends: [
    'sanity',
    'sanity/react',
    'sanity/import',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'sanity/typescript',
    'prettier/@typescript-eslint',
    'prettier',
    'prettier/react',
  ],
  rules: {
    'import/no-extraneous-dependencies': 'off', // because of parts
    camelcase: ['error', {allow: ['^unstable_', '^Unstable_']}],
    'import/no-unresolved': ['error', {ignore: ['.*:.*']}], // because of parts
    'prettier/prettier': 'error',
    'sort-imports': 'off', // prefer import/order
  },
  plugins: ['import', '@typescript-eslint', 'prettier', 'react'],
  overrides: [
    {
      files: ['*.{ts,tsx}'],
      rules: {
        'import/no-unresolved': 'off',
        'no-undef': 'off',
        'import/named': 'off',
        // the normal `no-dupe-class-members` doesn't work with TS overrides
        'no-dupe-class-members': 'off',
        '@typescript-eslint/no-dupe-class-members': ['error'],
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['warn'],
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': ['error'],
      },
    },
    {
      files: ['./test/jest-setup.js', '*.test.{js,ts,tsx}'],
      env: {jest: true},
    },
  ],
}
