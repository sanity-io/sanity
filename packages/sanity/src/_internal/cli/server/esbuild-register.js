require('esbuild-register/dist/node').register({
  target: `node${process.version.slice(1)}`,
  supported: {'dynamic-import': true},
  jsx: 'automatic',
  // Force CJS output since sanity/package.json has "type": "module"
  format: 'cjs',
})
