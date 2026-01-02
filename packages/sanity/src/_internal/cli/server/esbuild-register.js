require('esbuild-register/dist/node').register({
  target: `node${process.version.slice(1)}`,
  supported: {'dynamic-import': true},
  jsx: 'automatic',
  // Force CJS output since sanity/package.json has "type": "module"
  format: 'cjs',
  // plugins: [
  //   {
  //     name: 'ignore-styles',
  //     setup(build) {
  //       // Intercept CSS and style file imports and return empty module
  //       build.onLoad({filter: /\.(css|scss|sass|less)$/}, () => ({
  //         contents: 'module.exports = {}',
  //         loader: 'js',
  //       }))
  //     },
  //   },
  // ],
})
