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
    'import/no-unresolved': ['error', {ignore: ['.*:.*']}], // because of parts
    'prettier/prettier': 'error',
    'sort-imports': 'off', // prefer import/order
  },
  plugins: ['import', '@typescript-eslint', 'prettier', 'react'],
}
