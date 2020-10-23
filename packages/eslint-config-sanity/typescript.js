// Use this for typescript projects
module.exports = {
  env: {
    node: true,
    browser: true,
  },
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  rules: {
    // --- typescript types over prop types in typescript projects
    'react/prop-types': 'off',
    'react/require-default-props': 'off',
    // ---

    // --- causing parse errors with d.ts files, see https://github.com/typescript-eslint/typescript-eslint/issues/420
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': 'error',
    // ---

    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    'no-use-before-define': 'off',

    '@typescript-eslint/no-var-requires': 'off', // covered by @typescript-eslint/no-var-requires

    'react/jsx-filename-extension': ['error', {extensions: ['.tsx', '.js']}],
  },
  overrides: [
    {
      files: ['*.ts'],
      rules: {
        // Enable for TS files, but allow TSX (eg react components)
        '@typescript-eslint/explicit-module-boundary-types': ['warn'],
      },
    },
  ],
}
