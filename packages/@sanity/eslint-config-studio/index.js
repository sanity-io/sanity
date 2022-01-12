// https://github.com/microsoft/rushstack/tree/ebee58403b1595027da7ef00a4d817d83ecbd737/eslint/eslint-patch#what-it-does
// next.js:         https://github.com/vercel/next.js/blob/0de84472eb565d5ecae1e6b71994f0cd46c8ecb9/packages/eslint-config-next/index.js#L7
// create-react-app https://github.com/facebook/create-react-app/blob/9673858a3715287c40aef9e800c431c7d45c05a2/packages/eslint-config-react-app/base.js#L11
// …both use this
// eslint-disable-next-line import/no-unassigned-import
require('@rushstack/eslint-patch/modern-module-resolution')

/**
 * `@sanity/eslint-config-studio` is meant to be a relatively unobtrusive eslint
 * config that will purely help find bug instead enforce opinions
 */
module.exports = {
  plugins: ['react', 'react-hooks', 'jsx-a11y'],
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
  },

  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      presets: [
        ['@babel/preset-env', {targets: 'maintained node versions'}],
        '@babel/preset-react',
      ],
    },
  },

  rules: {
    // inspired by:
    // - https://github.com/eslint/eslint/blob/dd58cd4afa6ced9016c091fc99a702c97a3e44f0/conf/eslint-recommended.js#L14-L74
    // - https://github.com/suchipi/eslint-config-unobtrusive/blob/744a7f23a549c3dcf0a35a0d43372a268af4f028/index.js
    'constructor-super': 'error',
    'for-direction': 'error',
    'getter-return': 'error',
    'no-case-declarations': 'warn',
    'no-class-assign': 'warn',
    'no-compare-neg-zero': 'warn',
    // https://github.com/suchipi/eslint-config-unobtrusive/blob/744a7f23a549c3dcf0a35a0d43372a268af4f028/index.js#L43-L52
    'no-cond-assign': ['warn', 'except-parens'],
    'no-const-assign': 'error',
    // https://github.com/suchipi/eslint-config-unobtrusive/blob/744a7f23a549c3dcf0a35a0d43372a268af4f028/index.js#L58-L63
    'no-constant-condition': ['warn', {checkLoops: false}],
    'no-debugger': 'warn',
    'no-delete-var': 'error',
    'no-dupe-args': 'error',
    'no-dupe-class-members': 'error', // Note: has a TS extension
    'no-dupe-else-if': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-empty-character-class': 'warn',
    'no-empty-function': 'warn', // Note: has a TS extension
    'no-empty-pattern': 'warn',
    'no-ex-assign': 'warn',
    'no-extra-semi': 'warn', // Note: has a TS extension
    'no-func-assign': 'warn',
    'no-global-assign': 'error',
    'no-import-assign': 'error',
    'no-invalid-regexp': 'error',
    'no-loss-of-precision': 'warn', // Note: has a TS extension
    'no-misleading-character-class': 'warn',
    'no-new-symbol': 'error',
    'no-nonoctal-decimal-escape': 'warn',
    'no-obj-calls': 'error',
    'no-octal': 'error',
    'no-redeclare': 'warn', // Note: has a TS extension
    'no-self-assign': 'warn',
    'no-setter-return': 'warn',
    'no-shadow-restricted-names': 'error',
    'no-sparse-arrays': 'warn',
    'no-this-before-super': 'error',
    'no-undef': 'error',
    'no-unexpected-multiline': 'warn',
    'no-unreachable': 'warn',
    'no-unsafe-finally': 'warn',
    'no-unsafe-negation': 'warn',
    'no-unsafe-optional-chaining': 'warn',
    'no-unused-labels': 'warn',
    'no-unused-vars': 'warn', // Note: has a TS extension
    'no-useless-backreference': 'warn',
    'no-useless-escape': 'warn',
    'no-with': 'error',
    'require-yield': 'warn',
    'use-isnan': 'warn',
    // https://github.com/suchipi/eslint-config-unobtrusive/blob/744a7f23a549c3dcf0a35a0d43372a268af4f028/index.js#L217-L225
    'valid-typeof': ['warn', {requireStringLiterals: false}],

    // mostly inspired by plugin:react/recommended but less strict
    // https://github.com/yannickcr/eslint-plugin-react/blob/151bb2b13892969bea17b334e882eb422152c30a/index.js#L124-L157
    'react/jsx-key': 'warn',
    'react/jsx-no-comment-textnodes': 'warn',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-target-blank': 'warn',
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'warn',
    'react/no-danger-with-children': 'warn',
    'react/no-direct-mutation-state': 'error',
    'react/no-is-mounted': 'warn',
    'react/no-render-return-value': 'error',
    'react/no-string-refs': 'error',
    'react/no-unescaped-entities': 'error',
    'react/no-unknown-property': 'warn',
    'react/prop-types': 'warn',
    'react/react-in-jsx-scope': 'error',
    'react/require-render-return': 'error',

    // https://github.com/facebook/react/blob/9a7e6bf0d0cf08114b74c9fe45c06e60a5e496e4/packages/eslint-plugin-react-hooks/src/index.js#L17-L18
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // inspired by eslint-config-react-app
    // https://github.com/facebook/create-react-app/blob/9673858a3715287c40aef9e800c431c7d45c05a2/packages/eslint-config-react-app/index.js#L260-L281
    'jsx-a11y/alt-text': 'warn',
    'jsx-a11y/anchor-has-content': 'warn',
    'jsx-a11y/aria-activedescendant-has-tabindex': 'warn',
    'jsx-a11y/aria-props': 'warn',
    'jsx-a11y/aria-proptypes': 'warn',
    'jsx-a11y/aria-role': ['warn', {ignoreNonDOM: true}],
    'jsx-a11y/aria-unsupported-elements': 'warn',
    'jsx-a11y/heading-has-content': 'warn',
    'jsx-a11y/iframe-has-title': 'warn',
    'jsx-a11y/img-redundant-alt': 'warn',
    'jsx-a11y/no-access-key': 'warn',
    'jsx-a11y/no-distracting-elements': 'warn',
    'jsx-a11y/no-redundant-roles': 'warn',
    'jsx-a11y/role-has-required-aria-props': 'warn',
    'jsx-a11y/role-supports-aria-props': 'warn',
    'jsx-a11y/scope': 'warn',
  },

  overrides: [
    {
      files: ['**/*.ts?(x)'],
      plugins: ['@typescript-eslint'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2018,
        ecmaFeatures: {jsx: true},
      },
      rules: {
        // https://typescript-eslint.io/rules/#extension-rules
        'no-dupe-class-members': 'off',
        '@typescript-eslint/no-dupe-class-members': 'error',

        'no-empty-function': 'off',
        '@typescript-eslint/no-empty-function': 'warn',

        'no-extra-semi': 'off',
        '@typescript-eslint/no-extra-semi': 'warn',

        'no-loss-of-precision': 'off',
        '@typescript-eslint/no-loss-of-precision': 'warn',

        'no-redeclare': 'off',
        '@typescript-eslint/no-redeclare': 'warn',

        // TypeScript should do a good job at this
        'no-unsafe-optional-chaining': 'off',
        'no-undef': 'off',
        'react/react-in-jsx-scope': 'off',

        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'warn',

        // ts-only rules
        '@typescript-eslint/no-empty-interface': 'warn',
        '@typescript-eslint/no-extra-non-null-assertion': 'warn',
        '@typescript-eslint/no-misused-new': 'warn',
      },
    },
  ],
}
