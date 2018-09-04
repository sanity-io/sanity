/* eslint-disable import/no-commonjs */
module.exports = {
  presets: [
    [
      '@babel/env',
      {
        targets: {
          node: '6',
          chrome: '59',
          safari: '10',
          firefox: '56',
          edge: '14'
        }
      }
    ]
  ],
  plugins: [
    'lodash',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread'
  ],
  babelrcRoots: ['.', ...require('./lerna.json').packages]
}
