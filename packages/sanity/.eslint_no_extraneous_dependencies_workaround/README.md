This directory provides a workaround for eslint-plugin-import's lack of support for [self references](https://nodejs.org/docs/latest-v20.x/api/packages.html#self-referencing-a-package-using-its-name).

This directory can be deleted if/when self references works with the [`import/no-extraneous-dependencies`](https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-extraneous-dependencies.md) rule.

The `package.json` here is read by this package's [eslint.config.mjs](../eslint.config.mjs), enabling the eslint rule not fail on `import x from 'sanity'`

See also

- https://github.com/import-js/eslint-plugin-import/issues/2430
- https://github.com/browserify/resolve/issues/222
