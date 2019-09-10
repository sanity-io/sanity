/*
 shared eslint typescript config
 To use in a package add an .eslintrc file with the following content:
```json
{
  "extends": ["../../../.eslintrc-ts.js"]
}
```
*/

module.exports = {
  // this will make this eslint config *not* inherit from ./eslintrc
  root: true,
  env: {
    node: true,
    browser: true
  },
  parser: '@typescript-eslint/parser',
  extends: [
    './packages/eslint-config-sanity/react.js',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'prettier/react',
    'prettier'
  ],
  rules: {
    'prettier/prettier': 'error',
    'react/jsx-filename-extension': ['error', {extensions: ['.tsx']}]
  },
  plugins: ['@typescript-eslint', 'prettier', 'react']
}
